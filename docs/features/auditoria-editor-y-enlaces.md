# Auditoría: editor y enlaces (`FUN-M-40` · `AUDITORIA-EDITOR-ENLACES`)

Tanda 4 de la [[Auditoria de codigo 2026-09-26]]: las decisiones **D6** a **D9**, que el
usuario dio por aprobadas el 2026-09-26. Reúne H4, H5, H6 y H7 de
[[Auditoria de complejidad 2026-09-26]] y cierra `DEF-112` y `DEF-113`.

> [!info] Alcance: **desktop**, con dos piezas a reflejar
> D6 y D7 tocan `NoteEditor.tsx` y `lib/idb.ts`; `NoteEditor` ya diverge y `idb.ts` es
> idéntico a web (allá la caché sí tiene sentido: es la línea con red). D8 toca
> `lib/wikilinks.ts` y `lib/editor/wikilink.ts` (idénticos a web: **reflejar**). D9 es
> solo-desktop (importación por Rust).

> [!warning] Orden: después de `FUN-M-38`, `FUN-M-39` y `FUN-L-24`
> Comparte archivos con las tres tandas anteriores.

## D6 · El diagrama Excalidraw soltado sobre el editor es un archivo del vault (compl. H4 · `DEF-112`)

- El drop de un `.excalidraw` sobre el editor (`NoteEditor.tsx` ~1279-1298) crea un
  archivo del vault con `crearNota(tipo excalidraw)` + `putContenido`, en la carpeta de
  la nota, con el nombre del archivo soltado (desambiguado como cualquier creación), e
  inserta `![[título.excalidraw]]`. Es lo mismo que hace la barra de herramientas.
- Borrar `lib/db/diagramas.ts`, la tabla `diagramas`, las rutas `diagramas` de
  `api.ts`, `loadDiagram`/`saveDiagram`, la prop `diagId` de `ExcalidrawModal`, el
  repunte en `rekeyIndice`, la copia en `duplicarNota`, y la lectura doble de
  `lib/excalidraw.ts`; `EXCALIDRAW_RE` queda en un solo módulo.
- **Migración** única al abrir el vault: si `diagramas` tiene filas, exportar cada una a
  `<carpeta de la nota>/<uuid>.excalidraw` (o un nombre derivado del título de la nota) y
  reescribir el embed `![[<uuid>.excalidraw]]` en el contenido; después, `DROP TABLE`.
- Criterio: soltar un `.excalidraw` deja un archivo visible en el explorador; borrar el
  índice y reabrir no pierde ningún diagrama.

## D7 · Sin caché IndexedDB ni estados «offline» y «conflicto» en desktop (compl. H5 · `DEF-113`)

- `NoteEditor.tsx`: la carga lee con `api()` y listo; se quitan `saveLocal`, la
  lectura de caché, `navigator.onLine`, el banner de conflicto y las refs asociadas.
  Se conservan `instanceCache` (estado de pestaña) y `guardadoPendiente`.
- `LinkedPreviewPane.tsx` y `lib/export.ts`: sin la rama de caché.
- `lib/idb.ts` se elimina de desktop; `syncStore` queda en `local | syncing | synced |
  error`. Si algún componente idéntico a web importa `idb.ts`, se deja un módulo vacío
  con la misma firma y se anota en [[RAMAS]].
- Criterio: abrir la misma ruta relativa en dos vaults muestra el contenido correcto
  desde el primer frame y no hay conflicto fantasma.

## D8 · Un solo resolutor de `[[wikilink]]` (compl. H6)

- `resolveWikilink` (hoy en `lib/editor/wikilink.ts`) pasa a `lib/wikilinks.ts` como
  función pura sobre `{ id, titulo, carpetaId }[]` + carpetas, con una variante que
  recibe el `Map` por título que introduce `FUN-M-38` (cambio 5).
- `lib/db/grafo.ts` la usa para resolver aristas y conexiones, en vez de `porTitulo`
  «primera nota con ese título». Mismo criterio que el editor: pista de carpeta, sin
  extensión, empate → ruta más corta.
- Hacerlo **antes** de `FUN-M-15` (alias), que así toca un solo sitio.
- Criterio: con dos notas homónimas en carpetas distintas, el clic y el grafo van a la
  misma; `![[x.excalidraw]]` cuenta como arista.
- **Reflejar a web**: `lib/wikilinks.ts` y `lib/editor/wikilink.ts` son idénticos; el
  backend .NET arma el grafo con su propia regla (ver [[RAMAS]] § quién arma el grafo).

## D9 · Importar carpeta con un comando Rust que respeta `.mycignore` (compl. H7)

- Comando `copiar_arbol(origen, destino_rel)` en `archivos.rs`: copia el árbol completo
  (adjuntos incluidos: imágenes, PDF, lo que sea) respetando `.mycignore` del **origen**
  si lo tiene y el default si no; devuelve cuántos archivos copió y cuáles omitió. Sigue
  `indexarVault`.
- Conflictos de nombre: por basename, con la misma política que la importación actual
  (preguntar: conservar ambos / reemplazar / omitir), pero **reemplazar reemplaza** (hoy
  duplica).
- El zip se extrae a disco y sigue el mismo camino.
- Borrar `leer_carpeta`, `recorrer`, `es_oculto` de `archivos.rs`, `collectFromNativeFolder`
  y la tubería por nota de `lib/import.ts`.
- Criterio: importar un vault de Obsidian con `.obsidian/`, imágenes pegadas y PDF deja
  todo en su sitio y `.obsidian/` no entra al índice.

## Criterios de aceptación generales

`tsc`, `cargo check`, `cargo test --lib archivos` (con test nuevo de `copiar_arbol` que
rechace `..` y respete `.mycignore`), tests headless, `next build`. Lo visible lo
confirma el usuario: drop de Excalidraw, apertura cruzada de dos vaults, homónimos en el
grafo, importación de un vault Obsidian.

## Versionado

Minor si sale sola (importar con adjuntos es capacidad nueva); absorbida si viaja con la
`2.2.0`.

## Relacionadas

- [[Auditoria de codigo 2026-09-26]] — el plan completo.
- [[Bugs_errores_y_defectos]] — `DEF-112`, `DEF-113`.
- [[auditoria-capa-de-datos]] — la tanda anterior.
- [[BACKLOG]] — `FUN-M-40`, `FUN-M-15`.
