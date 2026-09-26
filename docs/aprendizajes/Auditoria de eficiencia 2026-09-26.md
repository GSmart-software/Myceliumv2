# Auditoría de EFICIENCIA — Mycelium (`desktop-tauri`, 2026-09-26)

> [!info] Informe de un agente auditor, guardado tal cual
> Parte de [[Auditoria de codigo 2026-09-26]], que consolida los tres informes y el plan. Los scripts y resultados que este informe cita como «scratchpad» están en `docs/aprendizajes/scripts-auditoria-2026-09-26/`.

Agente de rendimiento. El grafo (`DEF-109`, [[Rendimiento del grafo]]) queda fuera; se cita.
Todo se midió con **réplicas** fuera de Tauri (sin IPC): walker en Rust standalone, helpers TS
compilados con esbuild y corridos en Node, índice SQLite/FTS5 replicado en Python (sqlite 3.32).
Lo que en la app pasa además por el puente IPC cuesta **más** que lo de acá.

Scripts (todos en este scratchpad `…/35d63067-…/scratchpad/`):
- `walker/src/main.rs` → `walker-resultados.txt` — réplica fiel de `archivos.rs` + `mycignore.rs`.
- `medir-helpers.mjs` → `helpers-{mycelium,tesina,trabajo}.txt` — `separarFrontmatter`, `textoIndexable`,
  `sinCodigo`, `etiquetasDe`, regex de wikilinks, `resolveWikilink`, `renderNota`, `JSON.parse`.
- `medir-sqlite.py` / `medir-sqlite2.py` / `medir-sqlite3.py` → `sqlite*-{…}.txt` — índice, guardado, tree, grafo, FTS.
- `medir-sincodigo.mjs` → `sincodigo-{…}.txt` — variante de `sinCodigo` (equivalencia + tiempos).
- `fileid/src/main.rs` → `fileid-resultados.txt` — costo de `file_id::get_file_id` (caché del watcher).

## 1. Mediciones

Vaults: **M** = este repo (`.mycignore` completo: 180 archivos indexables, 38 dirs, 2,0 MB) ·
**T** = Tesina (1.329 archivos, 445 dirs, 20,3 MB; su `.mycignore` NO tiene `.*/` → recorre `.git/`) ·
**E** = Trabajo y Estudio (1.223 archivos, 436 dirs, 5,6 MB; sin `.mycignore`, default).

### Disco / Rust (`walker`)
| Operación | M | T | E |
|---|---|---|---|
| `listar_archivos_meta` (recorrido 1) | 7 ms | 69 ms | 107 ms |
| `listar_directorios` (recorrido 2) | 3,6 ms | 51 ms | 67 ms |
| `listar_otros_archivos` (recorrido 3, explorador) | 6,7 ms · 165 otros | 100 ms · **6.199 otros** (`.git/objects`) | 71 ms · 396 otros |
| `rutas_observables` (recorrido 4, arranque del watcher) | 10 ms | 121 ms | 90 ms |
| walker **fusionado** archivos+dirs (FUN-M-13) | 11 ms | 141 ms | 91 ms |
| `mycignore::ignorada` sobre todas las rutas | 3,3 ms (13 patrones) | 12,7 ms | 25 ms (5 patrones) |
| `leer_archivos` de TODO | 12 ms | 179 ms | 118 ms |
| serde_json de ese `leer_archivos` (lado Rust) | 3 ms · 2,1 MB | 68 ms · 20,9 MB | 17 ms · 5,9 MB |
| `JSON.parse` de lo mismo (lado JS) | 4,5 ms | 55 ms | 16 ms |
| `get_file_id` por ruta (caché del watcher, `add_path`) | 32 µs × 128 = 4 ms | 55 µs × 1.464 = 81 ms | 44 µs × 1.659 = 73 ms |
| Tamaño de nota: mediana / p90 / máx | 6,5 / 25 / 138 KB | 7 / 37 / 444 KB | 1,5 / 7 / 519 KB |

### Helpers TS (`medir-helpers.mjs`), sobre TODAS las notas del vault
| Operación | M | T | E |
|---|---|---|---|
| `separarFrontmatter` | 2,8 ms | 75 ms | 11 ms |
| `textoIndexable` | 2,7 ms | 110 ms | 16 ms |
| `sinCodigo` | 76 ms (107/116 con backtick) | **1.160 ms** (1.213/1.306) | 356 ms (440/1.223) |
| `etiquetasDe(contenido, sinCodigo)` | 80 ms | 1.006 ms | 379 ms |
| wikilinks: `sinCodigo` + regex + `destinoDeWikilink` | 82 ms · 1.608 enlaces | 797 ms · 6.722 | 356 ms · 2.308 |
| filas de `propiedades` (INSERT c/u) | 7 | **6.966** (765 notas con frontmatter) | 164 |
| statements de un indexado frío (5/nota + 1/propiedad) | 587 | **13.496** | 6.279 |
| `resolveWikilink` (una llamada) | 0,02 ms | **0,34 ms** | 0,15 ms |
| `renderNota` p50 / p90 / máx | 59 / 108 / **553 ms** (BACKLOG.md, 135 KB) | 39 / 88 / **1.853 ms** (444 KB) | 9 / 19 / 187 ms (519 KB) |

### SQLite puro (`medir-sqlite*.py`), sin IPC
| Operación | M | T | E |
|---|---|---|---|
| Indexado frío **autocommit por statement** (como el plugin) | 326 ms (587 st.) | 8,2 s (13.496 st.) | **15,8 s** (6.279 st.) |
| Indexado frío, una transacción por tanda de 250 | 157 ms | 3,4 s | 0,7 s |
| Indexado frío, **INSERT multi-fila por tanda, autocommit** (posible desde JS hoy) | 182 ms · 6 st. | 2,9 s · **36 st.** | 624 ms · 28 st. |
| Indexado frío, UNA transacción entera | 183 ms | 15,4 s (WAL de 55 MB) | 5,1 s |
| Tamaño del índice vs contenido | 4,1 MB / 1,5 | 55 MB / 20 | 19 MB / 5,6 |
| `tree()` | 0,8 ms | 8,7 ms | 16 ms |
| `SELECT` del grafo + JSON ida/vuelta | 9 + 26 ms | 134 + **427 ms** (22 MB) | 76 + 103 ms |
| `putContenido` (nota máx., SQL solo) | 19 ms | 101 ms | **375 ms** |
| FTS `"e"*` con `snippet` / sin snippet | 343 / 16 ms | **2.332 / 84 ms** | 75 / 27 ms |
| FTS `"la de"` con snippet | 287 ms | **3.066 ms** | 56 ms |
| FTS `"pr"*` / `"proyecto"*` con snippet | 28 / 17 ms | 80 / 21 ms | 14 / 5 ms |
| snippet solo para los 50 del top (CTE o `rowid IN`) | igual o peor | igual o peor | peor |

Referencia cruzada: `DEF-106` midió **97 s** para 3.200 notas en la app (≈30 ms/nota, ≈6 statements)
→ el puente IPC + commit cuesta ≈ **4–5 ms por statement**, 2–4× el SQL puro.

## 2. Hallazgos (por impacto/esfuerzo)

### H1 · Indexado: 5+N statements IPC por nota → multi-fila por tanda — `lib/db/indexer.ts:375-401`, `lib/db/propiedades.ts:313-326`, `lib/db/ftsIndice.ts:318-330`
- **Cuesta**: T = 13.496 viajes IPC en frío (6.966 son `INSERT INTO propiedades` de a uno). Medido: SQL solo 8,2 s (T) / 15,8 s (E) en autocommit por statement; en la app, ≈30 ms/nota (`DEF-106`).
- **Arreglo**: por tanda de 250, UNA sentencia multi-fila para `notas`, `contenidos`, `fts_filas` (`INSERT … SELECT … FROM json_each(?)`), `notas_fts` y `propiedades` (+ un `DELETE … IN`). Medido: **36 statements y 2,9 s** (T), 28 y 0,6 s (E). No necesita `BEGIN/COMMIT` (el pool lo impide) ni Rust. Reduce también el trabajo de cada ráfaga del watcher. `reindexarPropiedades` en `putContenido` igual: un solo `INSERT` con todas las filas.
- **Riesgo**: bajo (mismas filas; `SQLITE_MAX_VARIABLE_NUMBER` 32.766 ≥ 250×9). Tamaño **M**. ID: es la alternativa barata a `FUN-L-10` (que sigue valiendo para sacar el contenido del IPC).

### H2 · Búsqueda: una letra tecleada cuesta hasta 2–3 s y las respuestas se pisan — `lib/db/buscar.ts:246-265`, `components/explorer/SearchPanel.tsx:107-131`
- **Cuesta**: `snippet()` se evalúa para TODAS las notas que coinciden antes del `ORDER BY rank LIMIT 50`; con prefijo de 1 letra coinciden todas: T `"e"*` **2,3 s**, `"la de"` 3,1 s; sin snippet 84 ms. El debounce de 200 ms dispara con la primera letra.
- **Además (defecto)**: el efecto limpia el `setTimeout` pero **no cancela la petición en vuelo**: `"e"` (2,3 s) puede resolver después de `"es"` (0,2 s) y pisar los resultados con los viejos. No hay bandera `cancelado` como sí tiene `BarraEstado`.
- **Arreglo**: (a) no consultar con menos de 2–3 caracteres (medido: `"pr"*` 80 ms, `"es"*` 237 ms vs `"e"*` 2.332); (b) bandera de cancelación/`seq` en el efecto; (c) opcional: fragmento calculado en JS sobre `contenidos` de los 50 devueltos (la variante SQL con `rowid IN` NO ayuda: medido peor).
- **Riesgo**: bajo. Tamaño **S**. Sin ID (defecto nuevo: proponer `DEF-*` para la carrera).

### H3 · Cada guardado dispara un reindexado completo, y la nota se reindexa DOS veces — `lib/db/contenido.ts:46-60`, `lib/vaultWatch.ts:69-104`, `src-tauri/src/vault_fs.rs:55-74`
- **Cuesta**: `putContenido` escribe el archivo (tmp + rename = 2–3 eventos) y **no actualiza `notas.mtime`** → 700 ms después el watcher reindexa: 2 recorridos (T 120 ms, E 175 ms) + `leer_archivos` de esa nota por IPC + otra vez los 5+N statements + `loadTree` (T 8,7 ms SQL + render) + `listar_otros_archivos` (H4, T 100 ms) + `markStale` + `refreshAllLiveViews` (todas las vistas rehacen decoraciones) + `EVENTO_RECARGA` → cada editor abierto hace `GET contenido` (IPC con el texto entero) y `BarraEstado` + `NotePanel` piden `/conexiones` = **2 escaneos completos del grafo** (T ≈ 2 × 0,8–1,2 s por `sinCodigo`). Total por guardado en T: del orden de **2–3 s de trabajo** de fondo, en el hilo principal en su mayoría.
- **Arreglo**: (1) `escribir_nota` devuelve el `mtime` resultante y `putContenido` lo guarda en `notas.mtime` (una columna en el `UPDATE` que ya hace) → el reindex del watcher pasa a no-op para esa nota; (2) `FUN-M-14` (reindex dirigido por rutas) y además **ignorar las rutas escritas por la propia app** (anotar `ruta → mtime` al escribir; si la ráfaga solo trae esas, no reindexar ni disparar `EVENTO_RECARGA`).
- **Riesgo**: bajo para (1); medio para (2) (no perder cambios externos simultáneos: comparar mtime). Tamaño **S** (1) / **M** (2). ID: `FUN-M-14` (ampliar).

### H4 · Explorador: recorrido completo del disco tras cada cambio del árbol y suscripción al store entero — `components/explorer/ExplorerPanel.tsx:141`, `:236-245`
- **Cuesta**: `useEffect([rutaVault, store.notas, store.carpetas])` llama `listar_otros_archivos` (recorrido 3: T 100 ms, E 71 ms, + JSON 62–703 KB) tras **cada** `loadTree` (crear, renombrar, mover, borrar, cada ráfaga del watcher, cada guardado vía H3). `const store = useVaultStore()` re-renderiza el panel entero ante cualquier `set` (`lastMove`, `papelera`, `activeFolderId`, `sharedCarpetaIds`…).
- **Arreglo**: que `listar_archivos_meta` y `listar_otros_archivos` sean UN comando (`{notas, otros, dirs}`: es el mismo `recorrer_meta` con otro filtro; encaja con `FUN-M-13`), guardar `otros` en `vaultStore` y refrescarlos solo desde el indexador/watcher; selectores por campo en `ExplorerPanel`.
- **Riesgo**: bajo. Tamaño **S/M**. ID: sumar a `FUN-M-13`.

### H5 · `renderNota` bloquea el hilo 0,5–1,9 s en notas grandes — `components/editor/NoteEditor.tsx:386-393`, `:543-545`, `lib/markdown.ts:406-423`
- **Cuesta**: en modo lectura/split, cada pausa de 130 ms re-renderiza el documento ENTERO con unified: BACKLOG.md (135 KB) **553 ms**; «Estado de la tesina» (444 KB) **1,85 s**; p90 de T 88 ms. Todo síncrono en el hilo principal → tirones al escribir en split.
- **Arreglo**: (a) debounce adaptativo (`max(130, 3 × duración del último render)`); (b) no re-renderizar si el modo es `edit` (ya) ni si la pestaña no está visible; (c) Worker: `markdown.ts` corre en Node sin DOM (lo probé), así que el pipeline es portable a un Web Worker y el hilo principal solo inyecta HTML.
- **Riesgo**: bajo (a), medio (c). Tamaño **S** (a) / **L** (c). Sin ID.

### H6 · `resolveWikilink` es O(notas) con `toLowerCase()` por nota, y se llama por cada `[[enlace]]` visible — `lib/editor/wikilink.ts:57-100`, `lib/editor/livePreview.ts:1421`, `NoteEditor.tsx:331-335`
- **Cuesta**: 0,34 ms por llamada en T (1.306 notas). `buildDecorations` corre en cada `docChanged`/`viewportChanged` y llama `noteExists` por wikilink visible: un índice con 100 enlaces a la vista = **34 ms por tecla** solo en resolver. `openByTitle` y el autocompletado también lo usan.
- **Arreglo**: `Map<tituloMinúsculas, TreeNota[]>` derivado una vez por `loadTree` en `vaultStore` (y otro por título sin extensión); `resolveWikilink` consulta el mapa → O(1). Mismo resultado.
- **Riesgo**: bajo. Tamaño **S**. Sin ID.

### H7 · `sinCodigo` cuesta 40–80 ms por MB y se corre sobre el vault entero — `lib/sinCodigo.ts:30-93`
- **Cuesta**: T 1,16 s por pasada (es ~85 % del costo de armar aristas y etiquetas del grafo). Probé una variante sin `split("")` con salida **idéntica** en las 2.645 notas: gana 25–45 % en T/E pero **pierde** en M (código denso): el `split("")` no es el cuello; lo son la `new RegExp` por línea dentro de un cerco y el rescan por cada tanda de backticks sin cierre. → **Descartado como micro-optimización**: la salida real es no correrlo sobre todo el vault (tabla `enlaces`, plan `DEF-109` #4). Dato nuevo para esa nota: la porción de `sinCodigo` en el escaneo.

### H8 · Apertura del vault: cuatro recorridos del disco + un `open()` por archivo — `lib/db/indexer.ts:291-299`, `components/explorer/ExplorerPanel.tsx:236`, `src-tauri/src/vault_watch.rs:159-161`
- **Cuesta** (T): meta 69 + dirs 51 + `rutas_observables` 121 + otros 100 = **340 ms** de disco + `get_file_id` 81 ms (55 µs/archivo) = ~420 ms antes de contar IPC. E: 107+67+90+71 = 335 + 73.
- **Arreglo**: un solo recorrido que devuelva `{archivos, otros, dirs}` y que el watcher reciba esa lista en vez de recorrer de nuevo (`rutas_observables` existe solo para eso). Tamaño **M**. ID: `FUN-M-13` (ampliado: fusiona 4, no 2).

### H9 · `mycignore::ignorada` reserva memoria por patrón y por segmento — `src-tauri/src/mycignore.rs:259-270`
- **Cuesta**: 7–15 µs por ruta (`chars().collect::<Vec<_>>()` dos veces por patrón y por segmento): 3,3 ms de los 7 ms del recorrido en M (13 patrones); 25 ms en E. Se paga en los 4 recorridos y en cada ráfaga del watcher.
- **Arreglo**: precompilar los segmentos a `Vec<char>` en `parsear` y atajo `==` cuando el patrón no tiene `*`/`?`. Riesgo nulo, **S**, sin ID. Los tests de `mycignore` ya existen (`cargo test --lib mycignore`).

### H10 · Guardar una nota grande: 100–375 ms de SQL + 2 × el texto por IPC — `lib/db/contenido.ts:31-63`
- **Cuesta**: la nota de 519 KB (E) = **375 ms** de SQL por guardado (FTS5 re-tokeniza el texto entero + `contenidos`), cada 10 s mientras se edita (`SYNC_INTERVAL_MS`), más el texto por IPC dos veces (`escribir_nota` y el `INSERT`). Además `saveLocal` escribe el texto entero en IndexedDB cada 250 ms.
- **Arreglo**: no reescribir FTS/propiedades si el `textoIndexable` no cambió (hash barato); a futuro, `FUN-L-10` (el contenido no cruza el IPC). Tamaño **S** (hash). Sin ID.

### H11 · `.mycignore` de la Tesina sin `.*/`: el vault recorre e indexa `.git/` — vault del usuario, no código
- **Cuesta**: 445 dirs (≈290 de `.git/objects`) y **6.199 «otros archivos»** en cada recorrido y en el explorador; `carpetas` del índice con basura. Su archivo salió de una plantilla vieja (el encabezado dice «Esto es el comportamiento por defecto» sin `.*/`; la actual, `VaultSection.tsx:218`, sí lo trae). Mismo caso que el de `DEF-108`. → **Duda para el usuario** (no se toca el vault).

### H12 · Menores (S, sin ID)
- `stores/tabsStore.ts:688-690` + `ExplorerPanel.tsx:374-378`: `setNotaDropTarget` en cada `onDragMove` → `persist` serializa `root`+`closedHistory` a `localStorage` por movimiento del ratón (partialize no evita el `setItem`). Comparar antes de `set`.
- `components/panes/TabBar.tsx:37`: `useTabsStore()` entero: cada barra se re-renderiza con cada `dragging`/`draggingNota`.
- `app/(workspace)/workspace/page.tsx:200` y `ExplorerPanel.tsx:203`: dos `loadTree` al entrar (el `treeSeq` descarta uno, pero los dos viajes IPC se hacen).
- `NoteEditor.tsx:454-458`: `contentAttributes` busca el título con `notas.find` en cada actualización de la vista (≈10 µs; irrelevante, se anota por completitud).

## 3. Para el agente de COMPLEJIDAD
- Cuatro walkers en Rust con la misma forma (`recorrer`, `recorrer_meta`, `recorrer_dirs`, `recorrer_observables`) que difieren en el filtro y en lo que acumulan: uno solo parametrizado (H8).
- `carpetasDeRuta` y `carpetasDeDir` en `indexer.ts:208-240` son la misma función salvo el `pop()`.
- `vaultWatch.ts` recibe las rutas del evento y las descarta; la firma del payload existe solo por un comentario («informativo»).
- `NotePanel` tiene caché de conexiones y `BarraEstado` no; los dos piden lo mismo por caminos distintos (ya en `DEF-109` #5).

## 4. Para el agente de CÓDIGO MUERTO
- `src-tauri/src/archivos.rs:86` `es_oculto`: solo lo usa `recorrer` (`leer_carpeta`, importación); el indexador ya no. Verificar si `leer_carpeta` tiene llamador en el frontend.
- `lib/db/tree.ts:96` `carpetasCompartidas` devuelve `{ids: []}` siempre y `vaultStore.loadTree` hace un viaje IPC extra para eso en cada recarga.
- `SYNC_INTERVAL_MS` comentado como «throttle de sync a R2» (`NoteEditor.tsx:66`): herencia web.

## 5. Dudas para el usuario
1. Tesina: ¿agregar `.*/` a su `.mycignore`? (H11: hoy indexa `.git/`).
2. ¿El guardado cada 10 s con reindexado completo por el watcher se percibe como «pausa al guardar»? Si sí, H3 (1) es el arreglo de una línea y media.
3. ¿Vale un mínimo de 2 caracteres para buscar (H2)? Cambia una conducta visible.

### Nota sobre H8 / `FUN-M-13`
La fusión meta+dirs sola rinde poco: T 141 ms fusionado vs 69+51 = 120 (ruido; OneDrive), E 91 vs 174
(−80 ms). La ganancia real está en **eliminar los recorridos 3 y 4** (`listar_otros_archivos` en cada
recarga del árbol y `rutas_observables` al arrancar el watcher), que son la misma pasada.

## 6. Derivaciones de los otros agentes (respuesta)

### Del agente de COMPLEJIDAD
1. `conexiones()` reconstruye el grafo entero (`grafo.ts:171-204`) → **incorporado** solo con lo nuevo: la porción de `sinCodigo` en ese escaneo (H7: ≈85 %, T 1,16 s por pasada) y que **cada guardado lo dispara dos veces** vía `EVENTO_RECARGA` (H3). El resto es `DEF-109`.
2. `ExplorerPanel.tsx:141` store entero + `:236-245` `listar_otros_archivos` por cambio de árbol → **incorporado** (H4), medido: recorrido T 100 ms / E 71 ms + JSON 703 KB (T) por cada `loadTree`.
3. `putContenido` no actualiza `mtime` → **incorporado** (H3), medido el costo de la pasada que provoca.
4. `startCollab` por montaje → **descartado como costo**: el dispatcher devuelve `{habilitada:false}` sin SQL (µs) y `lib/collab/collab.ts` no importa yjs estáticamente. Es código inerte, no lento.
5. `estadoVault.ts:220-231` `DELETE`+`INSERT` de snippets por apertura → **descartado como costo**: N snippets (0–5) → ≤ 6 statements ≈ 30 ms de IPC una vez por apertura.
6. `basenamesOcupados` 2 consultas por creación → **descartado** (indexadas, <1 ms, acción de usuario). `subtreeIds` O(n²) → **descartado como costo**: solo se llama al soltar un arrastre y al confirmar «Eliminar» (`ExplorerPanel.tsx:418, :578`), no en render; con 436 carpetas son ~10⁵ iteraciones ≈ 1 ms.
7. `indexer.ts:326-328` `sort` con `split` por comparación → **descartado**: ordena solo las carpetas NUEVAS (en caliente, 0; en frío T 445 → <1 ms).

### Del agente de CÓDIGO MUERTO
1. `startCollab` → igual que arriba (4): **descartado como costo**.
2. `loadTree` pide `carpetas-compartidas` siempre `[]` → **descartado como costo** (sin SQL, un salto async); sí es un viaje de dispatcher inútil por recarga: lo dejo en §4.
3. `putCachedNote`/`getCachedNote` (IndexedDB) → **descartado como costo**: escritura asíncrona cada 250 ms de pausa (clon de ≤500 KB, <1 ms de hilo principal); la lectura al abrir añade unos ms antes del `GET contenido` (`NoteEditor.tsx:693`). Cumple un papel: es lo único que guarda lo escrito entre dos `syncNow` (10 s) si la app muere. Decisión de diseño, no de rendimiento.
4. `authStore.restore()` + `ensureSeed` por apertura → **descartado como costo**: 3–4 SELECT locales (<5 ms + IPC).
5. `public/drawio` 110 MB → **fuera de mi alcance** (tamaño de instalador/disco, no rendimiento en uso: el `iframe` se carga solo al abrir un `.drawio`). Dato: `frontendDist: ../out` mete `out/drawio` entero; `stencils/` 42 MB, `js/` 34 MB, `img/`+`images/` 18 MB; `preparar-drawio.mjs` ya poda algo (`:90-116`) y deja `stencils/` a propósito.
