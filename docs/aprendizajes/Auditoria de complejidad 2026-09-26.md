# Auditoría de COMPLEJIDAD — Mycelium `desktop-tauri` (2026-09-26)

> [!info] Informe de un agente auditor, guardado tal cual
> Parte de [[Auditoria de codigo 2026-09-26]], que consolida los tres informes y el plan. Los scripts y resultados que este informe cita como «scratchpad» están en `docs/aprendizajes/scripts-auditoria-2026-09-26/`.

Estado: **auditoría cerrada**. Todos los hallazgos de abajo están verificados leyendo el código
(no solo `grep`) y contrastados con `docs/`. Nada queda «pendiente de verificar».

Leído: `lib/api.ts`, `lib/db/*` (client, vaultContext, auth, indexer, notas, carpetas, contenido,
vaultFs, estadoVault, grafo, tree, diagramas, sharing, preferencias, tabla/buscar/fts cabeceras),
`lib/vaultWatch.ts`, `lib/import.ts`, `lib/export.ts`, `lib/excalidraw.ts`, `lib/idb.ts`,
`lib/collab/collab.ts`, `lib/eventos.ts`, `lib/otrosArchivos.ts`, `lib/terminalBase.ts`,
`lib/editor/wikilink.ts`, los 22 stores, `NoteEditor.tsx` (carga/guardado/colab),
`ExplorerPanel.tsx` (estado), `VentanaAjustes.tsx`, `VaultSection.tsx`, `EditorPane.tsx`,
`TabBar.tsx`, `FileOpenBridge.tsx`, `workspace/page.tsx`, `app/page.tsx`; Rust: `lib.rs`,
`archivos.rs`, `vault_fs.rs`, `mycignore.rs`, `prefs_vault.rs` y esqueletos del resto.
Docs: `Mapa de documentacion`, `Aprendizajes tecnicos`, `Estado con Zustand`,
`Rendimiento del grafo` (DEF-109), BACKLOG (`FUN-M-13/14/15`, `FUN-L-09/10`), `RAMAS`,
`vault-en-carpeta`, `desktop-sin-login`. Más `git diff desktop-tauri web-cloud` sobre los
archivos supuestamente compartidos.

Dato que cambia varias conclusiones: **ya divergen** entre ramas `vaultStore` (130 líneas),
`authStore` (77), `tabsStore` (119), `graphStore` (51), `NoteEditor` (108), `ExplorerPanel` (158),
`EditorPane`, `VaultSection`, `import`, `export`, `excalidraw`. Siguen **idénticos**:
`preferencesStore`, `uiStore`, `cssStore`, `syncStore`, `idb.ts`, `wikilink.ts`, `collab.ts`
(2 líneas). Cuando un archivo ya diverge, «lo mantenemos así para compartirlo con web» deja de
ser argumento.

---

## 1. Hallazgos (por beneficio/riesgo)

### H1 · El «modo SQLite clásico» es inalcanzable y sigue duplicando cada mutador — **M**
- `lib/db/vaultContext.ts:17-27`; ramas `getVaultActual() === null` en `lib/db/notas.ts:81,128,175,214`,
  `carpetas.ts:112,142,189,237`, `papelera.ts:43,82,138`, `contenido.ts:41`, `enlaces.ts:62-250`,
  `estadoVault.ts:94`; executor por defecto `mycelium.db` en `lib/db/client.ts:33,122-126`; migración
  sqlx `001_init.sql` en `src-tauri/src/lib.rs:22,104-108,156`; comentarios «en clásico coincide con
  `b`» en `lib/api.ts:128,148`.
- **Evidencia**: las tres entradas de la app abren un vault antes del workspace (`app/page.tsx`,
  `app/(vaults)/vaults/page.tsx:75-77`, `WorkspaceGuard` en `workspace/page.tsx:365-383`). La única
  forma de caer en «clásico» es pegar `/workspace` a mano sin `sessionStorage` ni `?vault=`, y el
  resultado es un workspace vacío contra `mycelium.db`. La spec lo dejó como coexistencia «durante
  el desarrollo… a futuro el modo carpeta puede volverse el único» (`docs/features/vault-en-carpeta.md:172-174`)
  — decisión pendiente desde 2026-07-20 (`84cd55f`), nunca cerrada. Cada repo lleva dos
  implementaciones (`nuevoId()`+`tituloUnico` vs `nombreNotaLibre`; `UPDATE titulo` vs
  `moverRuta`+`rekeyIndice`), y `ftsRetitular`, `nuevoId`, `tituloUnico` solo viven para la rama muerta.
- **Simplificación**: `vaultActual` obligatorio (los repos reciben `vault: string` o `getVaultActual()`
  lanza); borrar todas las ramas `else`; quitar `DB_URL`/migraciones/`mycelium.db` de `lib.rs` y el
  executor por defecto de `client.ts`; `WorkspaceGuard` sin vault → `router.replace("/vaults")`.
  Actualizar la spec.
- **Riesgo/verificar**: arranque frío, recarga con vault, ventana nueva (`?vault=`), tests headless de
  repos (`setExecutor`). `cargo check` + `tsc`.

### H2 · Sesión/identidad heredadas de web para obtener una constante — **L (mecánico)**
- `stores/authStore.ts` (`restore()` → `POST /auth/refresh` → `GET /auth/me`), `lib/db/auth.ts:26-47`
  (`ensureSeed` usuario/vault/membresía), tablas `usuarios/vaults/membresias` en `lib/db/indexer.ts:52-79`,
  `lib/api.ts:57-80`, `token:` en **58** llamadas, `vaults[0]?.id` en 7 sitios, etapa «identidad» en la
  pantalla de carga (`vaultSessionStore.ts:165-166`).
- **Evidencia**: `vaultId` es siempre `LOCAL_VAULT_ID`; `accessToken` es `"local"` y `api()` lo ignora.
  La justificación documentada («el checksum de la migración sqlx impide tocar el esquema»,
  `docs/features/desktop-sin-login.md:11-12`, `lib/db/auth.ts:4-6`) aplica a `mycelium.db`, **no** al
  índice del vault, que se crea con `CREATE TABLE IF NOT EXISTS` y «NO se usa `_sqlx_migrations`»
  (`indexer.ts:46-48`). `authStore` ya diverge de web. Lo único que la fila `usuarios` aporta hoy es
  guardar tema/modo/preferencias (ver H3).
- **Simplificación**: `authStore` pasa a fachada síncrona con constantes (`user`,
  `vaults=[{id: LOCAL_VAULT_ID}]`, `initialized: true`) para no tocar los componentes compartidos
  que lo leen; borrar `ensureSeed/session/me`, `/auth/refresh|me` del dispatcher, y las tres tablas
  del esquema del índice. `token?` queda en `ApiOptions` como opcional ignorado (no hace falta tocar
  los 58 llamadores).
- **Riesgo**: `cssStore` y `preferencesStore` leen de esa fila → hacer junto con H3. Verificar
  apertura de vault viejo (índice con tablas sobrantes: se ignoran).

### H3 · Dos mecanismos para «preferencias del vault», uno con seis saltos — **M** (esperar a que cierre FUN-L-23 por `prefsVaultStore.ts`)
- Camino A: `preferencesStore.ts:239-250 persistPrefs` → `PUT /auth/preferencias` →
  `lib/db/preferencias.ts:14-33` (UPDATE `usuarios` del índice) → `estadoVault.ts:167-172
  respaldarApariencia` → `.mycelium/apariencia.json` → al abrir `restaurarEstadoVault`
  (`estadoVault.ts:197-218`) vuelca al índice → `authStore.restore()` → `hydrateFromUser`
  (`vaultSessionStore.ts:179-184`). Camino B: `prefsVaultStore.ts:150-160` → `escribir_prefs_vault` →
  `.mycelium/preferencias.json` (2 saltos).
- **Evidencia**: el encabezado de `prefsVaultStore.ts:6-10` dice que `preferencesStore` «es de la
  persona y vale para todo», pero en desktop **también es por vault** (vive en el índice del vault +
  `apariencia.json`; el propio `vaultSessionStore.ts:179-182` lo explica). Dos stores, dos archivos
  JSON en la misma carpeta, dos rutas de persistencia, para el mismo alcance. Ídem `cssStore` →
  tabla `css_snippets` → `snippets.json` (`estadoVault.ts:175-182, 220-231`: `DELETE`+`INSERT` de
  todos los snippets en cada apertura).
- **Simplificación**: en desktop, `persistPrefs`/`hydrateFromUser` escriben/leen un JSON de
  `.mycelium/` directo (mismo comando que `prefsVaultStore`, o fusionar los dos stores si el usuario
  acepta que tema/tipografía sean por vault, que ya lo son); `cssStore` lee/escribe `snippets.json`
  sin pasar por SQL. Desaparecen `apariencia.json`, la fila `usuarios`, `respaldarApariencia/Snippets`,
  y la mitad de `estadoVault.ts` (queda la papelera, que sí necesita filas en `notas`).
  `preferencesStore` es idéntico a web: acotar la divergencia a esas dos funciones.
- **Riesgo**: migración de `apariencia.json` existentes (leerlo una vez si no hay el nuevo).
  Verificar cambio de tema/atmósfera, snippets, cambiar de vault y reabrir.

### H4 · Diagramas Excalidraw «embebidos» (tabla `diagramas`): segundo mecanismo, ya llamado «legado», y con **pérdida de datos** — **M**
- Creación: soltar un `.excalidraw` sobre el editor → `NoteEditor.tsx:1279-1298` → `saveDiagram` →
  `lib/db/diagramas.ts` → tabla `diagramas` del índice → inserta `![[uuid.excalidraw]]`. La barra de
  herramientas (`NoteEditor.tsx:971`) crea en cambio un **archivo** real. Lectura doble en
  `lib/excalidraw.ts:124-140` («si no, cae al diagrama embebido… (legado)»),
  `ExcalidrawModal.tsx:45-66` (`fileId` vs `notaId+diagId`), `rekeyIndice` repunta `diagramas`
  (`vaultFs.ts:264`), `duplicarNota` las copia (`notas.ts:258-268`), dos rutas en `api.ts:175-178`,
  `EXCALIDRAW_RE` duplicada (`lib/export.ts:14` vs `livePreview.ts:646`).
- **Evidencia**: en modo carpeta ese diagrama vive **solo en el índice** (no hay archivo ni respaldo
  en `.mycelium/`); `DEF-107` cubrió apariencia/snippets/papelera pero no `diagramas` → reconstruir
  el índice lo borra sin aviso. Es exactamente el problema que motivó `DEF-107`.
- **Simplificación**: el drop crea un archivo del vault (`crearNota(tipo excalidraw)` +
  `putContenido`) e inserta `![[título.excalidraw]]`, igual que la barra. Borrar `lib/db/diagramas.ts`,
  la tabla, las dos rutas, `loadDiagram/saveDiagram`, la prop `diagId`, el repunte y la copia.
  Migración única al abrir: si `diagramas` tiene filas, exportarlas a archivos y reescribir el `![[uuid…]]`.
- **Riesgo**: vaults con embeds `uuid` hoy (ya frágiles). Verificar drop, render en lectura y en
  vivo, edición en el modal.

### H5 · Caché IndexedDB + estados «offline»/conflicto de la web dentro del editor de escritorio — **M**
- `NoteEditor.tsx:330-338 saveLocal`, `340-375 syncNow`, `687-750` (carga: caché primero, «remoto»
  después, `navigator.onLine ? "error" : "offline"`, banner de conflicto si `cached.dirty` y el
  remoto es más nuevo); `lib/idb.ts:17-19` (clave = `notaId` **sin vault**); también
  `LinkedPreviewPane.tsx:33-35` y `lib/export.ts:34-44` («backend primero, IndexedDB si no hay conexión»).
- **Evidencia**: en desktop el «remoto» es el disco local; la caché no gana nada y agrega un estado
  más (`SyncState` con `offline`). Peor: IndexedDB es por origen (`tauri://localhost`), así que
  `Notas/plan.md` de dos vaults **comparten entrada**: al abrir el segundo se pinta primero el
  contenido del primero y, si aquel quedó `dirty`, aparece un conflicto fantasma. `NoteEditor.tsx`
  ya diverge de web (108 líneas).
- **Simplificación**: en desktop cargar con `api()` y listo; conservar `instanceCache` (estado de
  pestaña) y `guardadoPendiente`; eliminar `idb.ts`, `saveLocal`, los estados `offline`/conflicto y
  sus refs (`remoteUpdatedAtRef`, `conflictUpdatedAtRef`). `syncStore` reduce a
  `local|syncing|synced|error`.
- **Riesgo**: recuperación tras cierre brusco con nota sucia (hoy tampoco la recupera: `dirty` se
  sincroniza al desmontar). Verificar apertura, cambio de vault con rutas homónimas, cierre con cambios.

### H6 · Dos resolutores de `[[wikilink]]` con semántica distinta dentro de desktop — **M**
- Editor/navegación/autocompletado: `lib/editor/wikilink.ts:57-105` (`Carpeta/título` como pista,
  sin extensión, empate → ruta más corta). Índice/grafo/conexiones/retroenlaces:
  `lib/db/grafo.ts:59-62,100-103,113-117` (`porTitulo` = **primera** nota con ese título en el orden
  del `SELECT`, sin pista de carpeta ni extensión).
- **Evidencia**: con títulos homónimos, el clic navega a una nota y el grafo dibuja la arista a otra;
  `![[x.excalidraw]]` resuelve en el editor y no en el grafo. Y `renameNota` (`vaultStore.ts:302-309`)
  reescribe los enlaces entrantes usando `conexiones` → puede reescribir la nota equivocada.
  `FUN-M-15` ya registra que la capa se toca en tres lugares y `RAMAS:188` que la regla vive dos
  veces desktop/web; **lo que agrego**: dentro de desktop solo ya vive dos veces con divergencia observable.
- **Simplificación**: mover `resolveWikilink` a `lib/wikilinks.ts` (puro; solo necesita
  `{id,titulo,carpetaId}[]` y carpetas) con una variante indexada por título, y que `grafo.ts` la
  use. Hacerlo **antes** de `FUN-M-15`, que así toca un solo sitio.
- **Riesgo**: cambian aristas en vaults con homónimos (deseado). Verificar grafo, conexiones,
  renombrado con retroenlaces, embeds.

### H7 · Importar una carpeta a un vault que **es** una carpeta pasa por la tubería web — **M**
- `lib/import.ts:66-75 collectFromNativeFolder` (`leer_carpeta` trae **todo el contenido** por IPC y
  lo envuelve en `File`), `90-196 importFiles` (por nota: `POST /vaults/:id/notas` + `PUT contenido`
  → SQL + `escribirNota`); «adjuntos no soportados» (`import.ts:107-109`) aunque `FUN-S-03`/`FUN-L-11`
  ya muestran y abren esos archivos; «reemplazar» crea un duplicado (`import.ts:167-169`). En Rust,
  `recorrer`/`leer_carpeta` (`archivos.rs:139-183`) es un cuarto walker que **no** aplica
  `.mycignore` (usa `es_oculto`).
- **Simplificación**: importar carpeta = un comando Rust `copiar_arbol(origen, destino_rel)` que
  copia respetando `.mycignore` (adjuntos incluidos) + `indexarVault`. El zip puede extraerse a
  disco y seguir el mismo camino. Desaparecen `leer_carpeta`, `recorrer`, `es_oculto`,
  `collectFromNativeFolder` y la mitad de `importFiles`.
- **Riesgo**: conflictos de nombre (hoy pregunta por título; con archivos sería por basename).
  Verificar importación de un vault Obsidian con adjuntos y `.obsidian/`.

### H8 · Cuatro walkers recursivos en `archivos.rs` y tres pasadas por apertura — **M** (continuación de `FUN-M-13`/`FUN-L-10`)
- `recorrer` (:139), `recorrer_meta` (:210), `recorrer_observables` (:262), `recorrer_dirs` (:550).
  Por apertura: `listar_archivos_meta` + `listar_directorios` (ya en `FUN-M-13`) **más**
  `listar_otros_archivos` desde `ExplorerPanel.tsx:251-262`, que además se relanza con cada cambio
  de `store.notas`/`store.carpetas`.
- **Lo que agrego a FUN-M-13**: el comentario de `listar_otros_archivos` (`archivos.rs:320-323`) dice
  «comparte el recorrido a propósito: con dos walkers el `.mycignore` se aplicaría distinto» — y es
  lo que pasa con `recorrer`. Un solo `recorrer_vault(base) -> {notas_meta, otros, directorios}`
  alimenta el índice, el explorador y el watcher (`rutas_observables`). `FUN-L-10` lo absorbe si se
  hace en Rust.
- **Riesgo**: cambia la firma de 3 comandos y 3 llamadores. Verificar apertura, carpetas vacías,
  `.mycignore`, watcher tras renombrar.

### H9 · El «tipo de pestaña» se decide en cuatro componentes con listas paralelas — **S/M**
- `EditorPane.tsx:63-100` (qué componente), `TabBar.tsx:77-108` (título e ícono),
  `SidebarDock.tsx:65-83` (título e ícono), `SidebarNoteView.tsx:57-102` (vista); predicados
  dispersos: `esSentinela` **privado** en `tabsStore.ts:96-101`, `esTabTerminal` en `terminalBase.ts`,
  `esTabArchivo` en `otrosArchivos.ts`, tres constantes `*_TAB_ID`.
- **Evidencia**: `SidebarDock` y `SidebarNoteView` no contemplan `ENLACES_TAB_ID` (inconsistencia
  real). La doc `Estado con Zustand.md:39-58` habla de **2** tipos y **3** puntos a revisar; hoy son
  **5** tipos y **10** archivos. El patrón de ids sentinela está justificado (misma doc); la
  dispersión no.
- **Simplificación**: `lib/pestanas.ts` con `tipoDePestana(notaId)` discriminado
  (`nota|grafo|enlaces|calendario|terminal|archivo`), `esSentinela` exportado, y una tabla
  `título/ícono` por tipo que consuman los cuatro. Actualizar la doc.
- **Riesgo**: bajo; verificar cada tipo en pestaña, en el dock lateral y en la paleta.

### H10 · `.mycelium/`: dos pares de comandos para la misma operación y el índice como «copia» del JSON — **S** (+ lo de H3)
- `prefs_vault.rs:96-116`: `leer/escribir_prefs_vault` (solo `preferencias.json`) y
  `leer/escribir_estado_vault` (lista cerrada `ESTADOS` que **excluye** `preferencias.json` a
  propósito, con test `prefs_vault.rs:155-163`). Cinco archivos, dos APIs, y tres tablas SQL que son
  «copia» (`estadoVault.ts:1-27`).
- **Simplificación**: un solo par `leer/escribir_estado_vault(nombre)` con `preferencias.json` en la
  lista; `prefsVaultStore`, `recordatoriosStore`, y (tras H3) `preferencesStore`/`cssStore` usan el
  mismo. La papelera sí necesita filas en `notas` → conserva su sincronización.
- **Riesgo**: nulo funcionalmente; tests Rust del módulo.

### H11 · Constantes duplicadas que «DEBEN espejar» a otra — **S**
- `IGNORE_DEFAULT` en `VaultSection.tsx:207-221` ↔ `mycignore::DEFAULT` (`mycignore.rs:31`); títulos
  por defecto («Dibujo sin título»…) en `vaultStore.ts:280-290` **y** `lib/db/notas.ts:64-73`;
  `carpetasDeRuta` vs `carpetasDeDir` en `indexer.ts:210-244` (la primera es la segunda aplicada al
  `dirname`).
- **Simplificación**: comando `mycignore_default()` (o `leer_archivo_texto` con fallback desde Rust);
  `TITULO_POR_DEFECTO` junto a `EXTENSION_POR_TIPO` en `lib/extensionesDeTipo.ts` (el mismo patrón
  «una sola tabla» que ya se adoptó tras el fallo de `.drawio`);
  `carpetasDeRuta = (r) => carpetasDeDir(dirname(r))`.

### H12 · Compartir/colaboración latentes que la UI de desktop sigue cargando — **M**
- `lib/db/sharing.ts` (noops), `tree.ts:29-33` (`carpetasCompartidas` → `[]` siempre),
  `vaultStore.ts:60,211-222` (`sharedCarpetaIds`), `ExplorerPanel.tsx:150-176` (sección «Compartido»
  plegable + divisor redimensionable persistido `mic-split-compartido`), `:270,552,557,950`
  («Compartir» en el menú contextual, `SharedSection`), `uiStore.shareTarget`, `ShareModal`;
  `collab.ts:27-40` + `NoteEditor.tsx:577-583`: **una llamada `/colaboracion` por cada nota que se
  abre**, siempre `habilitada:false`; deps `yjs`, `y-websocket`, `y-indexeddb`, `y-codemirror.next`.
- **Evidencia**: `sharing.ts:4-5` dice «se reactiva al integrar Cloudflare (fase 7)», pero la nube
  es la línea `web-cloud` (`Dos ramas en vez de monorepo`, `Diferencias funcionales aceptadas`);
  desktop no va a tener membresías. `ExplorerPanel` ya diverge.
- **Simplificación**: quitar de desktop la sección, el menú, el store y `startCollab`; dejar
  `sharing.ts` solo si algún componente compartido lo exige (ninguno lo hace directo: van por
  `api()`). → Confirmar con el agente de código muerto y con el usuario (Duda 2).

### H13 · `pendingMoves` con 60 s de gracia para «una réplica del backend que va por detrás» — **S**
- `vaultStore.ts:96-103`, reconciliación en `:174-192` y repuntes en `moveCarpeta/moveNota/undoLastMove`.
- **Evidencia**: en desktop `loadTree` lee SQLite local tras el `UPDATE`; no hay réplica atrasada.
  `vaultStore` ya diverge (130 líneas). Queda el optimista + revertir en error, que sí vale.
- **Riesgo**: bajo. Verificar D&D de nota y carpeta, deshacer con Ctrl+Z.

### H14 · Comentarios que describen un estado que ya no existe y llevan a conclusiones erróneas — **S**
- `indexer.ts:8-9` («nada de esto se activa todavía; el arranque sigue usando `mycelium.db`»),
  `vaultMode.ts:9-10` y `vault_config.rs:10-11` («la conmutación real llega en fases posteriores»),
  `client.ts:6-9` («la web podría inyectar otro executor»), `archivos.rs:7` («acotada a estos tres
  comandos» — hay nueve), `indexer.ts:186-189` (`snake_case` «para no romper `leer_carpeta`»),
  `sharing.ts:4-5` (fase 7 Cloudflare). Un lector nuevo concluye que el modo dual está vivo y
  planificado. Va con H1.

---

## 2. Revisado y justificado (no volver a proponer)
- **`api()` como ruta HTTP simulada** (`lib/api.ts`): justificado mientras haya componentes
  compartidos con web que llamen `api()` (72 llamadores; `BaseView`, `CanvasView`, `PropiedadesTab`…
  son idénticos en las dos ramas). El costo (`encodeURIComponent`/`decodeURIComponent`, `token`
  ignorado, `vaultId` en la URL) es el precio de compartir. **Observación**: conviven ya **dos
  convenciones** —`api("/ruta")` para lo compartido e `invoke()`/envoltorios para lo solo-desktop
  (`estadoVault`, `prefsVault`, `recordatorios`, `otrosArchivos`)—; escribir la regla en
  `Capa de datos del desktop` («`api()` solo para lo que existe en web») evita que crezca al azar.
- **Ids sentinela** en `tabsStore` en vez de un campo `tipo`: documentado en `Estado con Zustand`;
  solo la dispersión (H9).
- **`fts_filas` (`ftsIndice.ts`)**: tabla extra medida (`DEF-105`, 16 ms → 0,02 ms); no es sobre-ingeniería.
- **`compactarSiHaceFalta`** (`indexer.ts`): tres pasos medidos (`DEF-108`).
- **Debounce + espera máxima en `vaultWatch.ts`**: `DEF-106`, medido.
- **`\u0000` como separador de clave** en `grafo.ts`: aprendizaje #5.
- **`SqlExecutor` inyectable** (`client.ts`): lo usan los tests headless; vale aunque el «seam web» no.
- **`terminalBase.ts` separado de `terminal.ts`**: evita cargar xterm en el arranque; razón escrita.
- **Escritura atómica + lista cerrada de nombres en `prefs_vault.rs`**: defensa contra `..` desde la webview.
- **`marco.rs`, `navegacion.rs`, `recordatorios.rs`, `ventanas.rs`**: complejidad nativa con causa
  documentada en cada cabecera; `misma_ruta` de `ventanas.rs:29` ya está en el plan MCP
  (BACKLOG:806-809, tres normalizaciones distintas).
- **`CATEGORIAS` con `rotulo`+`alias` en `VentanaAjustes.tsx:36-176`**: decisión de `FUN-M-35`; los
  rótulos viven dos veces (catálogo y sección) por diseño para saltar al DOM. Frágil, pero elegido.
- **`useDialogoModal`/`useMenuEmergente`/`confirmar`**: un solo camino cada uno, bien.
- **`vaultId` compartido (`LOCAL_VAULT_ID`) entre vaults y los `reset()` explícitos**: consecuencia
  de H2; se va con él.

## 3. Para el agente de EFICIENCIA
- `lib/db/grafo.ts:171-204 conexiones()` reconstruye el grafo **entero** del vault por cada nota
  (lo llaman `NotePanel`, `BarraEstado`, y `renameNota`).
- `ExplorerPanel.tsx:141 const store = useVaultStore()` suscribe al store completo; `:251-262`
  relanza `listar_otros_archivos` (recorrido completo del disco) en cada cambio de `notas`/`carpetas`.
- `lib/db/contenido.ts:49-55 putContenido` no actualiza `notas.mtime` → el watcher relee por IPC
  cada nota que la propia app acaba de guardar (adyacente a `FUN-M-14`).
- `NoteEditor.tsx:577-583 startCollab`: una llamada `/colaboracion` por montaje de editor, siempre inerte.
- `estadoVault.ts:220-231`: `DELETE`+`INSERT` de todos los snippets en cada apertura.
- `vaultFs.ts:150-171 basenamesOcupados`: 2 consultas por creación; `vaultStore.subtreeIds` es O(n²)
  con bucle `while(changed)`.
- `indexer.ts:299-301`: `sort` que hace `split("/")` en cada comparación.

## 4. Para el agente de CÓDIGO MUERTO (confirmar)
- Sharing/colab: `lib/db/sharing.ts`, `tree.carpetasCompartidas`, `SharedSection.tsx`,
  `ShareModal.tsx`, `uiStore.shareTarget`, `vaultStore.sharedCarpetaIds`, `collab.ts`,
  `yjs`/`y-websocket`/`y-indexeddb`/`y-codemirror.next` (solo importados dinámicamente desde
  `collab.ts:44-47`, que siempre retorna antes).
- Rama «clásico» (H1): `ftsRetitular`, `nuevoId`, `tituloUnico` (`lib/db/util.ts`), `001_init.sql`,
  `ExecResult.lastInsertId`.
- `lib/idb.ts deleteCachedNote` (no vi llamadores); `lib/db/types.ts`
  `RowVault/RowCarpeta/RowNota/RowPapelera/RowContenido/RowCssSnippet` (verificar uso); columnas
  `password_hash/github_id/avatar_url/email_verificado` del esquema del índice.
- `EXPIRES_IN_MINUTES` en `auth.ts` («nadie lo consume», dice el propio comentario).
- `take_opened_files`/`open-files`/`FileOpenBridge.tsx`: importa **una copia** del `.md` al vault
  (`FileOpenBridge.tsx:19-42`); confirmar que `tauri.conf.json` declara `fileAssociations` — si no,
  es camino sin entrada.
- `uiStore.liveTables` y `prefs.graphContinuousSim`: confirmar que algo los lee.
- `leer_carpeta`/`recorrer`/`es_oculto` en `archivos.rs` quedan sin uso si H7.

## 5. Dudas para el usuario
1. **H1**: ¿declaramos muerto el «modo SQLite clásico» (la spec lo dejó «a futuro»)? Sin esa
   decisión H1 y H2 no se pueden hacer.
2. **H12**: ¿desktop va a tener compartir/colaboración alguna vez, o eso queda solo en `web-cloud`?
   Decide si se borra o se documenta como latente.
3. **H4**: ¿existen en tus vaults embeds `![[<uuid>.excalidraw]]` (creados soltando un archivo
   sobre el editor)? Hoy viven solo en el índice y **se pierden al reconstruirlo** — conviene
   registrarlo como `DEF-*` aunque no se toque el código.
4. **H3**: ¿aceptás que tema/tipografía/atmósfera sean **por vault** (ya lo son en desktop) y
   unificarlos con `prefsVaultStore`, o preferís que vuelvan a ser globales de la instalación?
   Cambia hacia dónde se simplifica.
5. **Posible defecto (fuera de complejidad, verificar)**: `vaultFs.ts:255-264 rekeyIndice` repunta
   `contenidos/diagramas/papelera` pero **no `propiedades`**; como `propiedades.nota_id` tiene
   `ON DELETE CASCADE` (`indexer.ts:139`) y el `mtime` no cambia al mover en Windows, renombrar o
   mover una nota con frontmatter borra sus propiedades del índice hasta la próxima edición del
   contenido → una `.base` deja de listarla. Reproducir: renombrar una nota con `tags:` y filtrar
   por ese tag en una base.
6. **H8 y FUN-L-23**: `listar_otros_archivos` y las disposiciones del grafo no se tocan; nada de lo
   de arriba entra en `MiniGraph/GraphView/GraphOptionsMenu`. Solo H3/H10 rozan
   `prefsVaultStore.ts` → **esperar a que cierre FUN-L-23**.

---

## Respuestas a código muerto (derivaciones evaluadas el 2026-09-26)

1. **`api()`/dispatcher + identidad falsa** → **incorporado** en H2 (identidad) y en «Revisado y justificado» (dispatcher). No cambia nada: la identidad existe solo para transportar `tema/modoOscuro/preferencias_json` (es lo que dice H2 y lo que H3 resuelve); el dispatcher se queda mientras haya componentes idénticos a web que llamen `api()`. Lo que sí agrego a H2 con su dato: el `token` se pasa en ~25 archivos, o sea que borrar el parámetro no es viable de una vez; por eso H2 propone dejarlo opcional e ignorado.
2. **Doble camino clásico/carpeta + `indexer.ts:34` espeja `001_init.sql`** → **incorporado** en H1. Precisión: `001_init.sql` solo migra `mycelium.db` (`lib.rs:104-108,156`); el índice del vault ya se crea únicamente desde `ESQUEMA_INDICE` (`indexer.ts:46-48`). Al borrar el `.sql` con H1, el esquema TS queda como única fuente **y eso es lo correcto**, no un riesgo: hoy la «obligación de mantenerlos en sync» (`indexer.ts:35-37`) es trabajo sin consumidor.
3. **`lib/idb.ts`** → **incorporado** en H5. Respuesta a su duda: la caché **no tapa de forma permanente** un cambio externo — la carga aplica lo del disco si `!dirty` (`NoteEditor.tsx:727-733`) y el watcher recarga con `EVENTO_RECARGA` solo si `!dirty` (`:660-668`) — pero sí lo tapa **de forma transitoria** (se pinta la caché hasta que llega el disco) y, si la nota quedó `dirty`, muestra un banner de conflicto en vez del cambio. El caso grave es el cruce entre vaults con la misma ruta relativa (H5). Coincido en que «tiene efecto»: es complejidad viva, no código muerto.
4. **`TERMINAL_TAB_PREFIX` en `terminal.ts` y `terminalBase.ts`** → **descartado**. `lib/terminal.ts:28` es una **reexportación** de `terminalBase` (una sola definición, `terminalBase.ts:13`), y el reparto está justificado por la carga diferida de xterm (cabecera de `terminalBase.ts`). No hay dos fuentes.
5. **~66 `export` superfluos** → **fuera de mi alcance** como hallazgo de complejidad: quitar `export` a lo interno no reduce capas ni caminos, es higiene; que lo lleve él como **un solo ítem S** con la lista de `xref.js`. Dos excepciones que sí me interesan porque un `export` sin importador puede ser una API imaginada: `lib/db/client.ts:106 getExecutor` (no lo usa nadie fuera de `lib/db`, ni `scripts/`; con H1 desaparece el executor por defecto y queda solo `abrirIndiceDeVault`) y `lib/db/papelera.ts:162 purgarExpiradas` (una purga automática de papelera que **nadie llama**: eso es funcionalidad muerta, no un `export` de más — que lo confirme él y, si nadie la quiere, se borra).
6. **`lib/db/types.ts` mezcla snake_case y camelCase** → **descartado como hallazgo propio; incorporado en «justificado»**. El snake_case (`padre_id`, `carpeta_id`, `actualizado_en`, `nota_id`…) es el **contrato del backend .NET** que los componentes compartidos ya esperan (`vaultStore.loadTree` mapea `padre_id` → `padreId`); el dispatcher tiene que devolver la misma forma que web o los archivos idénticos divergirían. Se va solo cuando se abandone `api()`, que no es lo que propongo.

Coincido con él en que modo clásico (H1) y sharing (H12) son decisiones del usuario (Dudas 1 y 2); no lo repito.
