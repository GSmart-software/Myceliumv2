# Auditoría: rendimiento, tanda 1 (`FUN-M-38` · `AUDITORIA-RENDIMIENTO-1`)

Tanda 1 de la [[Auditoria de codigo 2026-09-26]]: los ocho arreglos de rendimiento que no
necesitaban decisión del usuario. Salen de [[Auditoria de eficiencia 2026-09-26]] (H1–H10)
y amplían `FUN-M-13` (un solo recorrido) y `FUN-M-14` (el watcher y lo que escribe la
app). Cierra `DEF-111`. Antecedente: [[Rendimiento de la apertura del vault]].

> [!info] Alcance: **SOLO-DESKTOP**
> Todo es del vault en carpeta: Rust, `lib/db/*`, el watcher y los componentes que los
> usan. En web no hay recorrido, watcher ni índice local. Los componentes compartidos que
> se tocaron (`SearchPanel`, `NoteEditor`, `wikilink.ts`, `NotePanel`, `BarraEstado`,
> `RelinkView`, `vaultStore`) **no rompen** web, pero se reflejan solo si se decide.

> [!warning] Estado: 🛠️ implementado el 2026-09-26, **sin confirmar en la app**
> Verificado con `tsc`, `cargo check`, `cargo test` y réplicas headless (ver § Mediciones);
> **no se lanzó la app Tauri**. Lo que falta mirar está en § Qué confirmar.

## 1. Guardar no dispara un reindexado (H3 · amplía `FUN-M-14`)

**Qué hace.** `escribir_nota` (Rust) devuelve el `mtime` del archivo recién escrito, con el
mismo cálculo que el recorrido del índice (`archivos::mtime_ms`). `putContenido` lo guarda
en `notas.mtime` (en el `UPDATE` que ya hacía), y `crearNota` guarda el real en vez de
`Date.now()`. `escribirNota` anota `ruta → mtime` (60 s de vigencia); el evento del watcher
trae ahora `{ruta, mtime}` de cada ruta y `lib/vaultWatch.ts` descarta la ráfaga **entera**
si todas sus rutas son escrituras propias con el `mtime` anotado. Con una sola ruta ajena,
se reindexa como siempre.

**Criterio.** Guardar una nota no dispara `indexarVault`, `EVENTO_RECARGA` ni `markStale`
por el watcher. Un cambio externo simultáneo tiene otro `mtime` y sí reindexa.

**Archivos.** `vault_fs.rs`, `vault_watch.rs`, `archivos.rs` (`mtime_ms` pasa a
`pub(crate)`), `lib/db/vaultFs.ts`, `lib/db/contenido.ts`, `lib/db/notas.ts`,
`lib/vaultWatch.ts`.

**Lo que dependía del reindexado de cada guardado** y ahora avisa quien escribe:
- La barra de estado y el panel de conexiones (salientes/retroenlaces) se refrescaban con
  el `EVENTO_RECARGA` del watcher tras cada guardado. Ahora oyen también
  `EVENTO_NOTA_GUARDADA` **de la nota que muestran** (`BarraEstado.tsx`, `NotePanel.tsx`).
- Renombrar reescribe los `[[enlaces]]` de otras notas, y re-enlazar
  ([[auditoria-y-relinkeado]]) reescribe muchas: si alguna estaba abierta, el watcher la
  hacía recargar; sin eso, el editor la pisaría con los enlaces viejos en su próximo
  guardado. Ahora `renameNota` (`vaultStore.ts`) y `RelinkView.tsx` (aplicar y deshacer)
  emiten `EVENTO_RECARGA` ellos mismos.
- El grafo ya lo marcaba el editor al guardar (`NoteEditor.tsx`); dos pestañas de la misma
  nota ya se espejan por `publishDoc`.

## 2. Búsqueda: mínimo 2 caracteres y cancelación (H2 · cierra `DEF-111`)

**Qué hace.** `SearchPanel.tsx` no consulta con menos de 2 caracteres (muestra «Escribí al
menos 2 caracteres para buscar.») y numera cada consulta: una respuesta que llega cuando
ya se lanzó otra más nueva se descarta, sin tocar resultados, «Buscando…» ni «buscado».
Borrar hasta una letra también invalida lo que esté en vuelo. `buscar.ts` no se tocó.

**Criterio.** Una letra no consulta; «e» lenta no pisa a «es».

## 3. Indexado por tandas multi-fila (H1)

**Qué hace.** Por cada tanda de 250 notas, `indexarVault` escribe **una** sentencia por
tabla —upsert multi-fila de `notas`, `contenidos`, las dos de FTS (`fts_filas` y
`notas_fts`) y `DELETE … IN` + `INSERT` de `propiedades`— con la tanda como un único
parámetro JSON que SQLite despliega con `json_each(?)`. Las carpetas nuevas, igual (una
sentencia por cada 500). Sin `BEGIN`/`COMMIT`: el pool de `tauri-plugin-sql` no garantiza
la misma conexión, así que cada sentencia es correcta por sí sola (el `rowid` de FTS se
reserva con `MAX + posición + 1` en la misma sentencia).

**Criterio.** Mismo índice, fila por fila, con muchas menos sentencias.

**Archivos.** `lib/db/indexer.ts`, `lib/db/ftsIndice.ts` (`ftsPonerTanda`),
`lib/db/propiedades.ts` (`reindexarPropiedadesTanda`, `derivarIndice`).

## 4. Un solo recorrido del disco (H4/H8 · amplía `FUN-M-13`)

**Qué hace.** Comando Rust `recorrer_vault(origen) → {archivosMeta, otros, directorios}`,
un walker que reemplaza a los tres gemelos (`recorrer_meta` ×2 y `recorrer_dirs`);
`listar_archivos_meta`, `listar_otros_archivos` y `listar_directorios` quedan como
envoltorios. El indexador hace un solo recorrido y devuelve `otros`, que van a
`vaultStore.otros` desde la apertura (`vaultSessionStore`), el watcher y el guardado del
`.mycignore` (`VaultSection`). `ExplorerPanel` lee `otros` del store —ya no relanza
`listar_otros_archivos` tras cada cambio de `notas`/`carpetas`— salvo cuando cambia la
**lista de ids de carpetas** después de la carga inicial (renombrar, mover o borrar una
carpeta desde la app): sus archivos cambian de ruta y el watcher no avisa, porque solo
mira notas. Y se suscribe con
`useShallow` a todo el store **menos** `papelera`, `vaultId` y `otros` (los tres que no
lee), en vez de al store entero.

**Criterio.** Abrir un vault recorre el disco una vez para índice y explorador (antes tres:
meta, directorios y otros), y recargar el árbol no recorre el disco.

**Archivos.** `archivos.rs` (+ test `recorrer_vault_separa_notas_otros_y_directorios_en_una_pasada`),
`lib.rs`, `lib/db/indexer.ts`, `lib/otrosArchivos.ts` (`otrosDesdeMeta`),
`stores/vaultStore.ts`, `stores/vaultSessionStore.ts`, `components/settings/VaultSection.tsx`,
`lib/vaultWatch.ts`, `components/explorer/ExplorerPanel.tsx`.

## 5. `resolveWikilink` con un `Map` (H6)

**Qué hace.** `lib/editor/wikilink.ts` agrupa las notas por título en minúsculas una vez
por lista de notas (`WeakMap` con la lista como clave: el store crea una nueva en cada
cambio y nunca la muta) y `resolveWikilink` consulta el mapa. El autocompletado usa el
mismo índice para detectar títulos repetidos. Misma semántica, mismo orden de empate.

## 6. No reescribir FTS ni propiedades si no cambió lo indexable (H10)

**Qué hace.** Columna nueva `notas.hash_indexable` (`ALTER TABLE … ADD COLUMN` protegido,
como `papelera.ruta_papelera`). `derivarIndice(texto)` parsea el frontmatter **una** vez y
devuelve el texto indexable, las filas de propiedades y una huella de 64 bits de ambas
(`huellaDe` en `util.ts`; sobre las filas, no el YAML crudo: mover una propiedad de línea
no obliga a reindexar). El indexador la guarda; `putContenido` la compara y solo si cambió
reescribe `notas_fts` y `propiedades`. La huella se guarda **después** de reindexar: si
eso falla, el próximo guardado reintenta. En un índice anterior la columna queda `NULL` y
cada nota se reindexa una vez más al guardarla. Una nota renombrada también queda en `NULL`
(`rekeyIndice` no copia la columna), que es el lado seguro.

## 7. `mycignore::ignorada` con patrones precompilados (H9)

**Qué hace.** `parsear` descompone cada segmento una vez: `Literal` (sin `*`/`?`, se
compara con `==`) o `Glob` (`Vec<char>` del patrón; la ruta se recorre como `&str` por
límites de carácter, sin reservar memoria). Test nuevo
`comodines_precompilados_con_caracteres_de_varios_bytes`.

## 8. `renderNota` con debounce adaptativo (H5)

**Qué hace.** En `NoteEditor.tsx`, la vista previa (split/lectura) espera
`max(130 ms, 3 × duración del último render)`. En notas chicas no cambia nada; en una de
135–444 KB (0,5–1,9 s de render) los bloqueos se espacian a 1,5–5,7 s. Solo eso.

## Mediciones

Réplicas fuera de Tauri, sobre los tres vaults de la auditoría (**M** este repo, **T**
Tesina, **E** Trabajo y Estudio), `desktop-tauri` contra la rama. SQLite con
`better-sqlite3` en memoria (sin IPC ni `fsync`: en la app cada sentencia cuesta además
≈4–5 ms de puente y commit, `DEF-106`); `invoke` simulado que lee el vault real y **no
escribe** en él. Scripts en el scratchpad de la sesión (no se versionan: dependen de
`better-sqlite3`).

| Paso | M antes → después | T antes → después | E antes → después |
|---|---|---|---|
| Indexado frío, sentencias | 1.129 → **37** | 13.684 → **67** | 6.744 → **59** |
| Indexado frío, ms de SQL (en memoria) | 120 → 73 | 1.765 → 906 | 666 → 305 |
| Reapertura sin cambios, sentencias | 26 → 27 (el `ALTER` nuevo) | 26 → 27 | 26 → 27 |
| Guardar la nota mayor sin cambiar lo indexable, sentencias / ms SQL | 6 / 9,7 → **3 / 0,4** | 12 / 19 → **3 / 1,2** | 8 / 35 → **3 / 1,1** |
| Guardar con una letra más, sentencias | 6 → 6 | 12 → 7 | 8 → 7 |
| Reindexado del watcher tras ese guardado, sentencias / ms SQL | 31 / 8,9 → 27 / 1,1 | 37 / 21 → 27 / 3,2 | 33 / 37 → 27 / 5 |
| `resolveWikilink`, µs por llamada | 33 → **16** | 279 → **1,6** | 110 → **4** |
| `mycignore::ignorada`, todas las rutas (walker en release) | 2,78 → **0,05 ms** | 13,8 → **0,31 ms** | 18,1 → **1,2 ms** |

- **El índice resultante es idéntico** fila por fila (`notas`, `carpetas`, `propiedades`,
  y título + contenido de cada fila de `notas_fts`) en los tres vaults; 0 filas FTS
  huérfanas. `resolveWikilink` dio el **mismo resultado** en las 21.256 referencias
  probadas (cada título, en mayúsculas, con `.md`/`.excalidraw`, con espacios, con ruta
  parcial correcta e incorrecta, e inexistentes).
- La última fila del watcher es la réplica sin el filtro de escrituras propias; **en la app
  ese reindexado directamente no ocurre** (cambio 1), y con él tampoco la recarga del árbol,
  de los editores ni los dos escaneos del grafo.
- Recorrido del disco en la apertura: antes `listar_archivos_meta` + `listar_directorios`
  + `listar_otros_archivos` del explorador (T: 51 + 35 + 85 ms), ahora uno. El explorador
  además dejaba de recorrer el disco en cada recarga del árbol (T: 85 ms y 703 KB de JSON).
- Los milisegundos de SQL en memoria son ruidosos (±50 %); las **sentencias** son la cifra
  firme. Con 4–5 ms por sentencia en la app, el indexado frío de T pasa de ≈60 s de puente a
  ≈0,3 s.
- Búsqueda: la consulta no cambió (`"e"` sigue costando 1,5–3,3 s en T), pero ya no se
  lanza con una letra; `"pr"` ≈ 0,06–0,1 s.
- La base de comparación es `desktop-tauri` **después** de integrar `FUN-M-39` (la rama se
  rebasó sobre ella); el walker de `mycignore` es el de la auditoría con el `mycignore.rs`
  viejo y el nuevo.

## Cómo quedó

**Del intento anterior** (commit provisional sin verificar, reescrito en esta rama):
- **Se conservó**, revisado: el Rust entero (`recorrer_vault`, `escribir_nota` con `mtime`,
  el evento `{ruta, mtime}`, `mycignore` precompilado), `escriturasPropias` en
  `vaultFs.ts`, la ráfaga en `vaultWatch.ts`, el `Map` de `wikilink.ts`, el debounce
  adaptativo, `SearchPanel`, `otros` en `vaultStore`, la suscripción de `ExplorerPanel`, las
  sentencias multi-fila y la columna `hash_indexable`.
- **Se corrigió**: `putContenido` guardaba la huella **antes** de reindexar (un fallo dejaba
  la búsqueda desactualizada para siempre) y consultaba `hash_indexable`/`mtime` también en
  el modo clásico, cuya base no tiene esas columnas; la huella se calculaba sobre
  `JSON.stringify(fm.props)` —con números de línea y comentarios— y el frontmatter se
  parseaba dos veces por nota; `ftsPoner` de una nota pasaba el texto entero por JSON (se
  volvió a los parámetros sueltos; la tanda sí usa JSON).
- **Se agregó**: los avisos que dependían del reindexado de cada guardado (§ 1), la
  recarga de `otros` en el explorador cuando cambian las carpetas (§ 4: sin ella, los
  archivos de una carpeta renombrada desde la app desaparecían del árbol hasta el próximo
  indexado), el test de comodines de `mycignore` y las tildes de un comentario de
  `NoteEditor`.
- **Se adaptó** al rebasar sobre `FUN-M-39`: `parseWikilinkTarget` y `sharedCarpetaIds`
  ya no existen en `desktop-tauri`, y el intento anterior los conservaba.
- **Se descartó**: nada del código; el «stub» de `@tauri-apps/plugin-sql` que el agente
  anterior estaba armando no llegó al commit y no hace falta —`lib/db/client.ts` ya permite
  inyectar el executor con `setExecutor`, y la réplica usó eso con un alias de esbuild—.

**Desvíos.**
- El watcher todavía recorre el disco una vez al arrancar (`rutas_observables`, para la
  caché de ids del debouncer): no recibe la lista del indexador. Queda para `FUN-M-13`.
- `workspace/page.tsx` sigue pidiendo `listar_otros_archivos` **una vez** al entrar, para
  reconciliar pestañas de visor: esa reconciliación es destructiva y no debe correr contra
  un `otros` que todavía no llegó.
- Tras guardar, la barra de estado y el panel de conexiones siguen pidiendo sus
  `/conexiones` (dos escaneos del grafo) para la nota guardada: es lo que muestran, y sin
  eso sus cuentas quedarían viejas. El costo de fondo lo resuelve `DEF-109`.
- Guardar un cambio real del texto sigue reescribiendo FTS (la huella solo evita los
  guardados que no cambian lo indexable). Sacar el texto del IPC es `FUN-L-10`.
- Un PDF o una imagen que aparece **desde fuera** no refresca el explorador por sí solo: el
  watcher solo mira notas (como antes). Antes aparecía en la siguiente recarga del árbol
  —que ocurría con cada guardado—; ahora, con el siguiente cambio externo de una nota, un
  cambio de carpetas o al reabrir el vault.

## Qué confirmar en la app

1. Escribir en una nota con split abierto: los guardados no provocan parpadeo ni recarga
   del árbol, y F12 no muestra reindexados tras cada guardado.
2. Crear, editar y borrar un archivo **desde fuera** (otro editor, la terminal): aparece y
   se reindexa como antes.
3. Agregar un `[[enlace]]` y guardar: la barra de estado y el panel de conexiones
   actualizan sus cuentas.
4. Renombrar una nota enlazada desde otra que está **abierta**: la abierta muestra el
   enlace nuevo y no lo revierte al seguir escribiendo.
5. Búsqueda: con una letra aparece la ayuda y no busca; escribir rápido no deja resultados
   de una consulta anterior.
6. Abrir un vault grande en frío (borrando su `index-<hash>.db`): tarda segundos, no minutos.
7. El explorador muestra los archivos que no son notas (PDF, imágenes) al abrir, al cambiar
   el `.mycignore` y al renombrar o mover **desde la app** la carpeta que los contiene.
8. Notas con frontmatter: las tablas `.base` y la búsqueda `clave:valor` siguen viendo las
   propiedades tras guardar y tras reindexar.

## Relacionadas

- [[Auditoria de codigo 2026-09-26]] — el plan de las cuatro tandas.
- [[Auditoria de eficiencia 2026-09-26]] — hallazgos y mediciones de origen.
- [[Rendimiento de la apertura del vault]] — `FUN-M-12`, del que esto es continuación.
- [[bugs-progreso]] — `DEF-111`.
- [[auditoria-capa-de-datos]] — la tanda 3, que retira el modo clásico (y con él la rama
  `enCarpeta` de `putContenido`).
