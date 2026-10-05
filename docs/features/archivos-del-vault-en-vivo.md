# Archivos del vault en vivo

**Solo desktop** (web no tiene disco ni watcher) · investigado el 2026-10-04 · `DEF-127`,
`DEF-128`, `FUN-M-42`, `FUN-S-26`

## Qué se pidió

«Explorar cómo gestiona Obsidian los archivos del vault y los muestra en el explorador.
Obsidian los gestiona instantáneamente; Mycelium puede tardar mucho (hipótesis: la
reindexación lo ralentiza). Por ejemplo, una imagen agregada desde fuera tarda en
aparecer. Y en Obsidian puedo agregar cualquier tipo de archivo arrastrándolo a cualquier
carpeta del explorador desde el sistema operativo.» (usuario, 2026-10-04)

## Cómo lo hace Obsidian

- **El árbol vive en memoria y lo alimenta un watcher.** `FileSystemAdapter` escucha el disco
  con `fs.watch` (en Windows, `ReadDirectoryChangesW`) y actualiza `TFile`/`TFolder` en
  memoria con cada evento; el `Vault` emite `create/modify/delete/rename`. La latencia es la
  del evento del SO: **2 a 6 ms** medidos en esta máquina. Fuente: la API pública
  ([obsidian.d.ts](https://raw.githubusercontent.com/obsidianmd/obsidian-api/master/obsidian.d.ts)).
- **El árbol y el índice están separados.** El `MetadataCache` (enlaces, tags, frontmatter)
  se llena **después, archivo por archivo**, en segundo plano. El explorador nunca lo espera.
- **Muestra todos los tipos** reconocidos (y cualquier extensión con «Detect all file
  extensions»); oculta lo que empieza con `.`.
- **Arrastrar desde el SO a una carpeta del explorador la copia ahí**, sea del tipo que sea
  ([ayuda](https://obsidian.md/help/plugins/file-explorer)). Sobre una nota, la copia a la
  carpeta de adjuntos e inserta el enlace.
- **Debilidad conocida:** en Windows `ReadDirectoryChangesW` pierde eventos en ráfagas grandes y
  Obsidian no tiene botón de refrescar
  ([foro](https://forum.obsidian.md/t/windows-sometimes-changes-made-outside-of-obsidian-are-not-reflected-in-the-files-pane/73451)).

## Cómo lo hacía Mycelium (antes de A, B y C)

> [!info] Histórico
> Así estaba al investigarlo. Lo que cambió, en las secciones «Implementación de B» y «de C».

```
SO → notify-debouncer-full (400 ms)
   → FILTRO en vault_watch.rs: lo que no es borrado ni nota (md/excalidraw/base/canvas/drawio) se DESCARTA
   → "vault-cambios" → lib/vaultWatch.ts (debounce 300 ms)
   → indexarVault COMPLETO (esquema de nuevo, recorrido del disco, lectura, escritura, limpieza)
   → loadTree (árbol desde el índice SQLite) → render
```

- **Una imagen, PDF o carpeta externa no aparece nunca por sí sola** (`DEF-127`): el filtro la
  descarta y solo aparece cuando otra cosa dispara un reindexado.
- **Una nota externa tarda ~0,9–1,2 s**: el 70 % son los dos debounces; el indexado (~200–300 ms)
  lo espera el explorador entero porque el árbol sale del índice. Además se recrea el esquema
  del índice en **cada** reindexado (~25 sentencias inútiles).
- **Soltar desde el SO** filtra `onlyMd`: una imagen o un PDF soltados se descartan sin aviso, aunque
  lo que sigue (`importarArchivos` → `copiar_arbol`) ya soporta cualquier tipo. Una carpeta con más
  de 100 elementos entra incompleta (`DEF-128`: `readEntries` se llama una sola vez). Y los bytes
  viajan como JSON (`number[]`): 20 MB son 71 MB de JSON y ~2,3 s; lo grande es inviable así.
  Sin el arrastre nativo de Tauri (apagado a propósito: `DEF-036`, `DEF-124`) no llega la ruta
  absoluta, solo el contenido.

## Propuesta

| Parte | Qué | Tamaño | Versión |
|---|---|---|---|
| **A** · `DEF-127` | El watcher deja pasar **toda** ruta no ignorada por `.mycignore` (filtrando temporales conocidos: `~$*`, `.tmp`, parciales de sincronización). Con eso una imagen aparece en ~1 s. | S | patch |
| **B** · `FUN-M-42` `ARBOL-EN-VIVO` | **Primero el árbol, después el índice**, como Obsidian: el árbol del explorador en memoria, armado con `recorrer_vault` y actualizado con los **deltas** del watcher (crear, borrar, renombrar, carpeta) sin esperar al índice; debounce corto para el árbol y largo solo para el indexado; indexado **dirigido** por las rutas recibidas (completa `FUN-M-14`); esquema creado una vez por sesión; reconciliación al recuperar el foco (o botón «Refrescar») para los eventos que pierde Windows. | M | patch (mismo comportamiento, al instante) |
| **C** · `FUN-S-26` `SOLTAR-CUALQUIER-ARCHIVO` + `DEF-128` | Soltar **cualquier tipo de archivo y carpetas** desde el SO sobre cualquier carpeta del explorador: quitar `onlyMd`, repetir `readEntries` hasta vaciar, textos del menú. Para archivos grandes, bytes por IPC **binario** (`tauri::ipc::Request`, una llamada por archivo, con progreso) en vez de JSON. | S (+M el binario) | minor |
| (opcional) | Rutas absolutas de WebView2 (`postMessageWithAdditionalObjects` + `CoreWebView2File.Path`) para copiar sin pasar bytes. Solo Windows, COM; verificar que no choque con la IPC de Tauri. | L | — |

Relación con el backlog: B **completa `FUN-M-14`**; `FUN-L-10` (indexado en Rust) queda
independiente y deja de ser urgente para este síntoma. Soltar un archivo **sobre una nota**
para crear un adjunto con su enlace va con `DEF-126` (imágenes en notas) y es tema aparte.

## Decisiones (usuario, 2026-10-04)

1. **Las tres partes**, cada una en su rama y con su merge `--no-ff`, para evaluarlas por
   separado. A y B tocan el watcher: van **en serie** (A primero); C va en paralelo.
2. Soltar sobre una carpeta **copia**, como Obsidian; el original queda donde estaba. Con
   conflicto de nombre, el mismo diálogo de la importación.
3. Soltar una carpeta del SO sigue dejando fuera `.git` y `.obsidian`, como hoy (default del
   orquestador; no se preguntó).
4. Archivos grandes: **IPC binario**. Las rutas absolutas de WebView2 quedan descartadas por ahora.
5. **Las dos**: reconciliar al recuperar el foco (si pasó un rato) y botón «Refrescar» en el
   explorador.
6. Soltar sobre una **nota** (adjunto + enlace) queda fuera: es tema aparte, sobre `DEF-126`.

## Implementación de B (2026-10-04, `FUN-M-42` + `FUN-M-14`)

Rama `feat/arbol-en-vivo-desktop`. **Sin confirmar en la app.** Ahora el flujo es:

```
SO → notify-debouncer-full (60 ms) → vault_watch.rs: qué hay en cada ruta (+ contenido de las carpetas que aparecen)
   → "vault-cambios" → lib/vaultWatch.ts
        ├─ 1. árbol, en el acto: vaultStore.aplicarCambios (lib/arbolVivo.ts)   ← lo que ve el usuario
        └─ 2. índice, debounce 300 ms (tope 1 s): indexarRutas (solo esas rutas) → loadTree → grafo, vistas, pestañas
```

### Diseño elegido y por qué

- **El árbol se actualiza con los deltas del evento, no se arma aparte del índice.** Se
  estudió armar el árbol entero con `recorrer_vault` (como Obsidian), pero `loadTree` —el
  árbol desde SQLite— lo llaman ~15 operaciones de la app (crear, renombrar, mover, borrar,
  restaurar…) y el MCP: cambiarle la fuente habría cambiado el costo de cada una (un
  recorrido del disco en vez de dos `SELECT`) y la semántica de la papelera (el árbol
  excluye lo que está en ella). Lo menos invasivo fue **dejar `loadTree` como está y
  sumarle encima los cambios todavía no indexados**.
- **No hay ids que reconciliar**: en el índice del desktop el id de una nota es su ruta
  relativa (y el de una carpeta, la suya). La entrada que se agrega antes de indexar ya
  tiene el id definitivo: pestañas, enlaces y grafo la encuentran igual cuando el índice
  la alcanza.
- **Pendientes** (`lib/arbolVivo.ts`): cada cambio aplicado al árbol se anota hasta que su
  indexado termina; `loadTree` los vuelve a aplicar sobre lo que lee del índice. Funciona
  porque `aplicarCambios` es **idempotente** (aplicar lo que ya está no cambia nada, y
  devuelve `null` para no re-renderizar: es el caso de cada guardado propio). Se quitan
  por identidad: si mientras se indexaba llegó un cambio más nuevo de la misma ruta, ese
  sigue pendiente.
- **El evento dice qué hay en cada ruta** (`CambioVault`: `nota` con su tipo, `otro` con
  su extensión, `carpeta` o `ausente`). Un renombrado llega como origen `ausente` + destino.
  De una carpeta que **aparece**, el watcher manda también su contenido (el mismo
  recorrido del índice, con el `.mycignore`): el SO no avisa de lo que hay dentro de una
  carpeta movida o renombrada. De una que se va, el frontend quita todo lo que colgaba de
  ella.
- **Orden**: el explorador agrupa en el orden en que vienen del índice (`COLLATE NOCASE`),
  así que lo nuevo se inserta donde lo pondría SQLite (`compararNocase`); si no, saltaría de
  lugar al indexarse.
- **Una nota abierta antes de indexarse** se indexa a demanda (`getContenido` →
  `indexarNotaADemanda`): antes de esto habría dado «La nota no existe».

### Indexado dirigido (`FUN-M-14`) y esquema una vez por sesión

- `indexarRutas(vault, cambios)`: relee las notas nuevas, con otro `mtime` o incompletas
  (`DEF-121`); asegura las carpetas de lo que existe; borra la nota de una ruta que ya no es
  nota y, si lo que se fue era una carpeta, todo lo que colgaba de ella (por `substr`, no
  `LIKE`: una ruta puede tener `%` o `_`), **salvo lo que está en la papelera** (`DEF-046`).
  Re-resuelve solo las claves de enlace que pudieron cambiar. Comparte con el completo la
  escritura por tandas con el `mtime` al final (`escribirNotas`) y el borrado por conjuntos.
- El indexado completo (`indexarVault`) queda para la apertura, la importación,
  «Reindexar» de los ajustes y la reconciliación; acepta un recorrido ya hecho y devuelve
  las rutas que cambiaron.
- El esquema del índice se crea **una vez por executor** (índice abierto), no en cada
  pasada: eran 23 de las 41 sentencias de un reindexado del watcher.

### Reconciliación (decisión 5)

`reconciliar`: un `recorrer_vault`, `diferenciasConDisco` contra el árbol (aplicadas en el
acto), los otros archivos tal cual los vio el disco, e `indexarVault` incremental **con ese
mismo recorrido** (lo que cambió de contenido lo encuentra por `mtime`). Corre:

- al recuperar el foco la ventana (`focus` o `visibilitychange`) si pasaron **≥ 30 s** desde
  la última;
- con el botón **«Refrescar»** de la cabecera del explorador (`RefreshCw`, a la derecha de
  las acciones de creación; tooltip y nombre accesible; gira mientras corre salvo con
  movimiento reducido; `aria-disabled` en vez de `disabled` para no perder el foco);
- cuando cambia el `.mycignore` (cambia qué se ve: solo lo sabe un recorrido).

Va por la misma cola que los eventos del watcher: nunca dos indexados a la vez.

### Hallazgo: el temporal de la escritura atómica propia

`vault_fs::escribir_atomico` escribe `nota.md.tmp-<pid>` y lo renombra. Ese nombre no
termina en `.tmp`, así que desde `DEF-127` pasaba el filtro del watcher: la ráfaga de cada
guardado traía una ruta ajena con `mtime` 0 y `esEscrituraPropia` no podía descartarla
(`FUN-M-38`), y con el debounce corto el temporal podía asomar en el árbol. `es_temporal`
ahora reconoce `*.tmp-<dígitos>`. **No se comprobó en la app** si con 400 ms el guardado
realmente reindexaba (depende de cómo el debouncer funde la creación con el renombrado);
el filtro es correcto en cualquier caso.

### Cifras

| Medida | Antes | Después | Cómo |
|---|---|---|---|
| Del archivo en disco al evento del watcher | 402 ms (mediana), 502 máx | **71 ms**, 76 máx | `cargo test --lib vault_watch::tests::medir_latencia -- --ignored --nocapture` (10 archivos, esta máquina) |
| Del evento al árbol | debounce 300 ms + indexado completo + `loadTree` | **0,3–0,4 ms** (una imagen o una nota en un árbol de 2.000 notas) | `aplicarCambios`, node |
| Carpeta de 1.000 notas que entra / 1.000 borradas sueltas | — | 14 ms / 21 ms | ídem |
| Reconciliación sin diferencias (2.000 notas) | — | 2 ms (comparar) + el recorrido y el indexado incremental | ídem |
| Reindexado tras tocar 2 notas, vault de 2.000 | 26,8 ms · 41 → 18 sentencias (esquema) · 2 invokes · 170 KB de recorrido | **9,6 ms** · 16 sentencias · 1 invoke · sin recorrido | réplica con `better-sqlite3`, sin IPC |

En la app cada sentencia cuesta además un viaje por el puente IPC (4–5 ms medidos en
[[Rendimiento de la apertura del vault]]) y el recorrido del disco de un vault así, del
orden de 70–100 ms: **la latencia que ve el usuario pasa de ~1 s a ~70 ms**, y el indexado
de un cambio externo de ~300 ms a unos ~80. Las cifras de la app las confirma el usuario.

### Para probar en la app

1. Con el vault abierto, copiar desde el Explorador de Windows una imagen, un PDF y una
   nota `.md` a una carpeta del vault: aparecen al instante, en su lugar del orden.
2. Mover (o renombrar) desde Windows una carpeta con notas e imágenes adentro: aparece
   con su contenido y la vieja desaparece con todo lo suyo.
3. Borrar desde Windows una nota abierta en una pestaña; crear una nota y abrirla en el
   mismo segundo (debe abrir con su contenido, no «no existe»).
4. Buscar el texto de una nota agregada desde fuera (el índice la alcanzó) y ver el grafo.
5. Guardar notas en la app: el explorador no debe parpadear ni aparecer nada con
   `.tmp-` en el nombre.
6. «Refrescar» en la cabecera del explorador: gira y deja el árbol igual al disco. Con
   la app sin foco, cambiar cosas con un programa que no dispare eventos (o un `git
   checkout` grande) y volver a la ventana pasados 30 s.
7. Mandar una nota a la papelera y restaurarla; renombrar y mover desde la app y desde
   el MCP; importar una carpeta (C): todo debe seguir refrescando como antes.

### Riesgos y pendientes

- Una nota `.md` que no es UTF-8 aparece un momento (el evento) y desaparece al indexarse
  (el índice no la toma y la recarga del árbol la saca). Antes no aparecía nunca.
- El efecto del explorador que relista los otros archivos al cambiar las carpetas
  (`ExplorerPanel`) queda como red de seguridad: con el watcher activo es redundante y
  cuesta un recorrido por cambio de carpeta.
- `FUN-L-10` (indexado en Rust) sigue independiente.

## Implementación de C (2026-10-04, `FUN-S-26` + `DEF-128`)

Rama `feat/soltar-cualquier-archivo-desktop`. **Sin confirmar en la app.**

- **Cualquier archivo.** `ExplorerPanel.importarSoltados` ya no filtra `onlyMd`: todo lo
  soltado (archivos y carpetas) va a `useImportStore.run` → `importarArchivos`. Si leer lo
  soltado falla, sale un aviso en vez de nada. «Importar archivos…» (antes «Importar
  archivos .md») y su selector aceptan también cualquier tipo.
- **`DEF-128`.** El recorrido salió a `lib/recorrerSoltados.ts` (puro, probado con
  `scripts/test-soltar-archivos.mjs`): `leerTodasLasEntradas` repite `readEntries` hasta que
  vuelve vacío. Las carpetas **ocultas** (`.git/`, `.obsidian/`…) se saltan ya ahí —el
  default del `.mycignore` las descarta igual al copiar—, para no leer y mandar un `.git`
  entero por IPC. Las carpetas **vacías** de lo soltado no se crean (no hay archivo que las
  lleve a la carpeta temporal).
- **IPC binario.** El camino sigue siendo el de `FUN-M-40`: bajar a una carpeta temporal y
  `conflictos_de_copia` + `copiar_arbol` —así el diálogo de conflicto (reemplazar / renombrar /
  cancelar), el `.mycignore` y el indexado no se duplican—. Cambia el transporte:
  `crear_temporal_importacion` crea la carpeta y `escribir_trozo_importacion` recibe el
  **cuerpo crudo** (`tauri::ipc::Request`, `InvokeBody::Raw`) con `x-dir`, `x-ruta`
  (`encodeURIComponent`) y `x-desde` en encabezados. Un archivo por vez, en **trozos de 8 MB**
  leídos con `File.slice`: un archivo de 200 MB nunca está entero en memoria del webview, y un
  trozo fuera de orden es error (el archivo tiene que medir exactamente `x-desde`). La ruta se
  valida con `ruta_segura` dentro de la carpeta temporal, y esta con `temporal_valida`; la copia
  al vault la valida `preparar_copia`. Se retiró `escribir_temporal_importacion` (el JSON con
  `number[]`).
- **Fuera del hilo principal.** `escribir_trozo_importacion`, `conflictos_de_copia` y
  `copiar_arbol` son `#[tauri::command(async)]`: un comando sincrónico de Tauri corre en el
  hilo principal y copiar cientos de MB congelaba la ventana.
- **Progreso.** La barra de la importación aparece con más de 3 archivos **o** con 8 MB o más,
  y avanza por bytes («Importando… 0/1 · 45,2 MB de 200 MB»). El resumen final dice «2 notas y
  3 archivos importados» en vez de «0 nota(s) importada(s), 3 adjunto(s)».
- **Refresco.** Sin cambios: `importarCarpeta` reindexa una vez, `setOtros` con los archivos
  que no son notas y `loadTree`, así que lo copiado aparece en el explorador al terminar.
- El arrastre nativo de Tauri sigue apagado (`DEF-036`, `DEF-124`): todo va por el drop HTML5.

## Relacionadas

- [[BACKLOG]] — `FUN-M-42`, `FUN-S-26`, `FUN-M-14`, `FUN-L-10`, `FUN-L-11`.
- [[bugs-progreso]] — `DEF-127`, `DEF-128`, `DEF-126`.
- [[Rendimiento de la apertura del vault]] — el costo del IPC por sentencia.
- [[Drag and drop en Mycelium]] — por qué el arrastre nativo de Tauri está apagado.
