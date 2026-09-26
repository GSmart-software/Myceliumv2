# Auditoria de codigo 2026-09-26

Auditoría a tres bandas sobre `desktop-tauri` (2026-09-26), pedida por el usuario para
**quitar complejidad innecesaria, mejorar la eficiencia y eliminar código sin uso**. Tres
agentes de solo lectura corrieron en paralelo, cada uno con un foco, y se intercambiaron
hallazgos por medio del orquestador; cada uno evaluó las derivaciones de los otros con
«incorporado / descartado / fuera de alcance». Los informes completos, tal como los
devolvieron:

- [[Auditoria de complejidad 2026-09-26]] — 14 hallazgos, 12 casos «revisado y justificado».
- [[Auditoria de eficiencia 2026-09-26]] — mediciones sobre tres vaults reales con
  réplicas fuera de Tauri, 12 hallazgos.
- [[Auditoria de codigo muerto 2026-09-26]] — 12 símbolos, 4 dependencias, permisos, CSS
  y scripts confirmados muertos; 55 de 55 comandos Rust vivos.

Los agentes quedaron definidos en `.claude/agents/` (`auditor-complejidad`,
`auditor-eficiencia`, `auditor-codigo-muerto`, más `auditor-robustez` y
`auditor-seguridad`, sin correr todavía). Los scripts de medición están en
`docs/aprendizajes/scripts-auditoria-2026-09-26/`.

> [!important] Estado: **diagnóstico terminado, nada implementado**
> Este documento ordena lo que salió y separa lo que se puede hacer sin preguntar de lo
> que exige una decisión del usuario. Cada tanda que se apruebe va por el flujo del
> orquestador (spec si hace falta, subagente en worktree, `tsc`/`cargo check`, merge).

## 1. Lo que la auditoría cambió de lo que se creía

- **Once archivos «compartidos» ya divergen de `web-cloud`** (`vaultStore`, `authStore`,
  `tabsStore`, `graphStore`, `NoteEditor`, `ExplorerPanel`, `EditorPane`, `VaultSection`,
  `import`, `export`, `excalidraw`). «Lo mantenemos así para compartirlo con web» ya no
  frena un arreglo en ellos. Siguen idénticos `preferencesStore`, `uiStore`, `cssStore`,
  `syncStore`, `idb.ts`, `wikilink.ts`, `collab.ts`: ahí un cambio pide reflejo o
  divergencia declarada en [[RAMAS]].
- **El costo por statement IPC es de 4 a 5 ms** (cruce de `DEF-106` con el SQL puro
  medido): un indexado frío de la Tesina son 13.496 viajes. Reducir statements vale más
  que acelerar cualquier función.
- **Cada guardado dispara un reindexado completo y dos escaneos del grafo** porque
  `putContenido` no actualiza `notas.mtime` y el watcher ve el archivo como cambiado. Es
  probablemente la «pausa al guardar» que el usuario percibe en vaults grandes.
- **El modo «SQLite clásico» es inalcanzable** desde la UI y sigue costando una rama en
  cada mutador; el sharing y la colaboración están apagados por bandera pero cargados.
- **Cuatro walkers en Rust** recorren el disco por apertura (340 ms en la Tesina) y uno de
  ellos, el de importación, no aplica `.mycignore`.
- Los 12 smoke tests de julio son anteriores al rediseño 2.0.0 y ya no encuentran la UI.

## 2. Defectos que salieron de paso (registrados)

| ID | Qué | De dónde |
|---|---|---|
| `DEF-110` | Renombrar o mover una nota con frontmatter borra sus propiedades del índice hasta la próxima edición (una `.base` deja de listarla). **Sin reproducir en la app** | complejidad, duda 5 |
| `DEF-111` | En la búsqueda, una respuesta lenta pisa a una más nueva: la petición en vuelo no se cancela | eficiencia H2 |
| `DEF-112` | Un diagrama Excalidraw soltado sobre el editor vive solo en el índice y se pierde al reconstruirlo | complejidad H4 |
| `DEF-113` | La caché de notas es por origen, no por vault: dos vaults con la misma ruta relativa comparten entrada y aparece contenido ajeno o un conflicto fantasma | complejidad H5 |

## 3. Plan propuesto, en tandas

### Tanda 1 · Rendimiento sin decisiones (todo desktop, riesgo bajo)

| # | Cambio | Medido / esperado | Tam | Origen |
|---|---|---|---|---|
| 1 | `putContenido` guarda el `mtime` que devuelve `escribir_nota`, y el watcher ignora las rutas que la app acaba de escribir | Evita el reindex + 2 escaneos del grafo por guardado | S | efic. H3 · amplía `FUN-M-14` |
| 2 | Búsqueda: mínimo 2 caracteres y cancelación de la petición en vuelo | `"e"*` de 2,3 s → `"pr"*` 80 ms; cierra `DEF-111` | S | efic. H2 |
| 3 | Indexado por tandas con `INSERT` multi-fila (`json_each`) para `notas`, `contenidos`, FTS y `propiedades` | Tesina: 13.496 → 36 statements, 8,2 s → 2,9 s en SQL puro (en la app, de minutos a segundos) | M | efic. H1 · alternativa barata a `FUN-L-10` |
| 4 | Un solo recorrido `recorrer_vault → {notas, otros, directorios}` para índice, explorador y watcher; «otros» en `vaultStore` | Quita 2 de los 4 recorridos por apertura y el recorrido tras cada `loadTree` | M | efic. H4/H8 · compl. H8 · amplía `FUN-M-13` |
| 5 | `resolveWikilink` con un `Map` por título derivado en `loadTree` | 0,34 ms → µs por enlace visible por tecla | S | efic. H6 |
| 6 | No reescribir FTS ni propiedades si `textoIndexable` no cambió (hash) | Guardar una nota de 500 KB: 375 ms → ~0 en SQL | S | efic. H10 |
| 7 | `mycignore::ignorada` con patrones precompilados | 50 % del recorrido en vaults chicos | S | efic. H9 |
| 8 | `renderNota` con debounce adaptativo | Notas grandes: bloqueos de 0,5–1,9 s espaciados | S | efic. H5 |

### Tanda 2 · Limpieza confirmada (sin decisiones salvo la D4)

> [!success] Hecha en `feat/auditoria-limpieza-desktop` (`FUN-M-39`): ver [[auditoria-limpieza-1]].

- Dependencias: `codemirror`, `highlight.js`, script `deploy:pages`.
- Permisos de Tauri redundantes (`dialog:allow-confirm/ask`, `sql:allow-*`), bloque
  `bundle.android`.
- Los 12 exports muertos, los tipos `Row*`, `deleteCachedNote`, `limpiarAviso`, `hydrated`,
  `EXTENSION_BASE/CANVAS`, `insertRefAtPoint`, `parseWikilinkTarget`,
  `existeCarpetaEsporas`. Y `purgarExpiradas` (una purga de papelera que nadie llama:
  funcionalidad muerta, salvo que se quiera).
- CSS y assets sin uso (8 clases, 4 custom properties, 5 SVG de create-next-app, README
  del frontend, comentario de `next.config.ts`). **Excepto** `Settings.module.css
  .feedback/.error`, que usa web.
- Complejidad chica: tipo de pestaña en un solo sitio (`lib/pestanas.ts`, compl. H9),
  constantes duplicadas (H11), `pendingMoves` (H13), comentarios que describen un estado
  que ya no existe (H14).
- Decisión D3 (abajo) para los 12 smoke tests.

### Tanda 3 · Con decisión del usuario

| Decisión | Si «sí» | Qué se simplifica | Tam |
|---|---|---|---|
| **D1** · Declarar muerto el modo «SQLite clásico» (`mycelium.db`, `001_init.sql`, ramas `getVaultActual() === null`). La spec [[vault-en-carpeta]] lo dejó «a futuro» en 2026-07-20 | `vaultActual` obligatorio, se borran ~20 ramas y el executor por defecto; el esquema TS queda como única fuente | compl. H1 + H14 · muerto § rama clásico | M/L |
| **D2** · Quitar de desktop compartir y colaboración (quedan en `web-cloud`) | Sección «Compartido», menú, `shareTarget`, `sharedCarpetaIds`, `startCollab`, 4 deps `yjs`; una llamada inerte menos por nota abierta | compl. H12 · muerto § sharing | M |
| **D3** · ¿Tema, tipografía y atmósfera son **por vault** (ya lo son en desktop) y se unifican con `prefsVaultStore`, o vuelven a ser globales? | Con «por vault»: desaparecen `apariencia.json`, la fila `usuarios`, la identidad falsa (`authStore`, 3 tablas, `/auth/*`) y media `estadoVault.ts` | compl. H2 + H3 + H10 | L |
| **D4** · Lo muerto en archivos idénticos a web (`wikilink.ts`, `esporasVault.ts`, `bases.ts`, `canvas.ts`, `tokens.css`, `preferencesStore.ts`): ¿limpiar en las dos ramas a la vez? | Siguen idénticos y no hay que anotar divergencia en [[RAMAS]] | muerto, duda 4 | S |
| **D5** · Los 12 smoke tests de julio: ¿borrar o reescribir para la UI 2.0.0? | — | muerto § scripts | S/M |
| **D6** · El diagrama Excalidraw soltado sobre el editor pasa a ser un archivo del vault (con migración de los embebidos existentes) | Cierra `DEF-112`; borra `diagramas.ts`, la tabla y dos rutas | compl. H4 | M |
| **D7** · Quitar la caché IndexedDB y los estados «offline»/conflicto del editor de escritorio | Cierra `DEF-113`; `syncStore` queda en cuatro estados | compl. H5 | M |
| **D8** · Un solo resolutor de `[[wikilink]]` (el del editor, extraído a `lib/wikilinks.ts`) para grafo y conexiones | Con homónimos, el clic y el grafo dejan de discrepar; `renameNota` deja de poder reescribir la nota equivocada. Hacerlo antes de `FUN-M-15` | compl. H6 | M |
| **D9** · Importar carpeta con un comando Rust que copie respetando `.mycignore` (adjuntos incluidos) | Desaparece el cuarto walker y la tubería web de importación | compl. H7 | M |

Fuera del plan pero pendiente de vos: el `.mycignore` de la Tesina no tiene `.*/` y
recorre `.git/` (6.199 «otros» en el explorador); y el plan de `DEF-109` sobre el cúmulo
sigue esperando la decisión sobre el aspecto del flujo.

## 4. Cómo trabajaron los agentes (para afinarlos)

Lo que funcionó:
- **Medir con réplicas fuera de Tauri** dio cifras comparables entre vaults y desmintió
  una propuesta (agrupar aristas era peor) y una micro-optimización (`sinCodigo` sin
  `split` no es el cuello). Sin medir, las dos habrían entrado al plan.
- **Leer los docs antes** evitó reproponer `FUN-M-13/14`, `FUN-L-10` y `DEF-109`: los tres
  informes citan IDs y agregan solo lo nuevo.
- **La triple búsqueda** (import, string, convención) del auditor de código muerto
  descartó 30 falsos positivos de knip y detectó que `Settings.module.css` lo usa web.
- **El cruce entre agentes** cerró siete derivaciones con medición o evidencia en vez de
  dejarlas como sospechas, y produjo dos correcciones (una clase CSS «muerta» que web usa;
  `tituloUnico` que corre una consulta y descarta el resultado).

Lo que hay que corregir en los agentes:
- Dos terminaron **antes** de recibir el pedido de anotar a medida; el informe solo
  sobrevivió porque el orquestador lo copió. La regla de anotar desde el arranque ya está
  en los cinco.
- El de complejidad y el de código muerto **coincidieron en dos temas grandes** (modo
  clásico, sharing) y ambos los redactaron entero. Sirve como confirmación cruzada, pero
  el orquestador debería asignar el «dueño» de un tema en cuanto el primero lo reporta.
- Los informes largos citan `ruta:línea` que caducan con el próximo commit. Para el plan
  sirven; para retomar en un mes, hay que releer.
- Faltó que cada agente pusiera **fecha y commit base** (`git rev-parse HEAD`) en la
  cabecera de su informe. Se agregó como regla.

## Relacionadas

- [[Aprendizajes tecnicos]] — mapa del área.
- [[Rendimiento del grafo]] — `DEF-109`, la auditoría previa del grafo.
- [[Rendimiento de la apertura del vault]] — el primer análisis del indexador, que esta
  auditoría vuelve a medir.
- [[BACKLOG]] — `FUN-M-13`, `FUN-M-14`, `FUN-L-10`, `FUN-M-15`, que las tandas amplían.
- [[Bugs_errores_y_defectos]] — `DEF-110` a `DEF-113`; estado en [[bugs-progreso]].
- [[RAMAS]] — qué diverge ya y qué sigue idéntico.
