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

## Cómo lo hace Mycelium hoy

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
