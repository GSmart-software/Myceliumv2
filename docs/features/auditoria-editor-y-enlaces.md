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

## Cómo quedó

> [!success] Implementado el 2026-09-26 en `feat/auditoria-editor-enlaces-desktop`
> Verificado con `tsc` (sin errores), `cargo check` + `cargo test --lib` (55/55: los 51 de antes, con el de exportar e importar reescrito, más 4 de `copiar_arbol` y la carpeta temporal), los
> tests headless (`node --test scripts/test-*.mjs`: 458/458, 18 nuevos) y `next build`
> (exit 0; solo los dos avisos previos de `::highlight` en `editor.css`). **Falta confirmarlo en la app.**

Commits, en este orden (D8 primero porque D6 usa `refUnivoca`): D8 resolutor único · D6
dibujo soltado = archivo (`DEF-112`) · D7 sin caché ni conflicto (`DEF-113`) · un
renombre en `grafo.ts` · D9 importar con Rust · esta documentación. `frontend/`: 33
archivos, +1.753 / −818 (los tests nuevos son ~490 de esas líneas). Borrados
`lib/db/diagramas.ts` y `lib/idb.ts`.

### D8 · Un solo resolutor

- `lib/wikilinks.ts`: `resolveWikilink(ref, notas, carpetas)` (con el índice por título en
  caché por lista, lo de `FUN-M-38`), `resolveWikilinkEnIndice(ref, índice, carpetas)` e
  `indexarPorTitulo` para quien resuelve muchos enlaces contra la misma lista,
  `folderSegments` (ahora con un índice por id, antes un `find` por paso) y
  `refUnivoca(nota, notas, carpetas)`: la referencia más corta que vuelve a esa nota.
  Genéricos sobre `{ id, titulo, carpetaId }` y `{ id, nombre, padreId }`.
- **Desvío**: el empate a la misma profundidad se desempata **por ruta**. Antes ganaba el
  primero de la lista, y el editor (orden del store) y el grafo (orden del `SELECT`)
  podían elegir distinto justo en el caso que D8 quería cerrar.
- `lib/editor/wikilink.ts` reexporta; `lib/db/grafo.ts` lee las carpetas y resuelve cada
  `[[…]]` con su ruta como pista, y las tarjetas de canvas con el mismo resolutor (sin
  pista: `referenciasDe` sigue devolviendo solo el título, porque `lib/canvas.ts` es puro
  y sin imports). Fuera `destinoDeWikilink`, que solo usaba el grafo.

### D6 · El dibujo soltado es un archivo

- El drop crea el archivo con `createNota(carpeta de la nota, "excalidraw", nombre del
  archivo)` + `PUT contenido` (el JSON tal cual vino) e inserta el embed. La barra y el
  drop comparten `insertarEmbedDeDibujo`, que usa `refUnivoca`: **desvío** pequeño —si ya
  hay otro «Dibujo sin título» en otra carpeta, el embed lleva la ruta; antes apuntaba al
  de la raíz—. Un archivo que no es JSON o un fallo al crear se avisan (`avisar`).
- Fuera la tabla del esquema, `lib/db/diagramas.ts`, sus rutas de `api.ts`,
  `loadDiagram`/`saveDiagram`, la rama «legado» de `renderExcalidrawInto`, `diagId` y el
  segundo modal de `NoteEditor`, el repunte en `rekeyIndice`, la copia en `duplicarNota` y
  el `DELETE` del indexador. `notaId` dejó de viajar por `liveExtensions`/`livePreview`/
  `buildDecorations`, que solo lo usaban para esa rama. `EXCALIDRAW_RE` vive en
  `lib/wikilinks.ts` (lo usan `markdown.ts` y `livePreview.ts`; la copia de `export.ts`,
  que solo aceptaba un uuid, desapareció con los adjuntos).
- **Arreglos de paso**: exportar un dibujo a PNG/SVG desde el menú contextual buscaba
  siempre en la tabla, así que con los dibujos de archivo **no exportaba nada**; ahora
  resuelve el archivo y el descargado lleva su título. `recolectarArchivosVault` (export a
  zip o carpeta) guardaba todo como `.md`, dibujos incluidos; ahora cada archivo lleva la
  extensión de su tipo.
- **Migración** (`migrarDiagramasEmbebidos` en `lib/db/legado.ts`), **antes** del
  indexado al abrir, para trabajar sobre el disco: cada fila cuya nota existe y **todavía
  muestra** el embed se exporta a `«nota» - dibujo.excalidraw` (desambiguado contra el
  índice y el disco) en la carpeta de la nota; el embed se reescribe con la ruta
  (`Carpeta/«nota» - dibujo`), para que dos homónimas no apunten al mismo dibujo; las
  filas de cada nota se borran al quedar escrita y al final `DROP TABLE`. **Desvío**: las
  filas cuya nota ya no las muestra no se exportan (borrar el embed nunca borraba la
  fila); eso además hace reanudable una migración cortada sin duplicar archivos.

### D7 · Sin caché ni conflicto

- `NoteEditor` carga con `api()`. Fuera `saveLocal`, la lectura de IndexedDB,
  `navigator.onLine`, el listener de `online`, el banner de conflicto y
  `remoteUpdatedAtRef`/`conflictUpdatedAtRef`/`localSaveTimer`. `reloadFromDisk` compara
  el texto en vez de `actualizadoEn`.
- **Lo que cubría la caché y hubo que resolver aparte**: volver a una pestaña mientras su
  guardado de salida todavía corre. `instanceCache` guarda `sucio` y el guardado de
  salida lo limpia al terminar bien: si al volver sigue sucia, manda el texto de la
  pestaña (y se guarda de nuevo); si no, manda el disco —con lo que un cambio externo
  hecho mientras la pestaña estaba oculta se aplica, como antes—.
- `LinkedPreviewPane` pinta primero el texto vivo del editor de origen (o el del disco);
  `lib/export.ts` sin respaldo de caché. `SyncState` = `local | syncing | synced | error`.
- **Riesgo aceptado**: IndexedDB guardaba cada 250 ms; ahora lo no guardado vive hasta el
  guardado periódico (10 s), el de salir de la nota y el de cerrar la app. Un cierre
  brusco puede perder hasta 10 s de escritura (antes, en teoría, se recuperaba al
  reabrir — con la contaminación entre vaults de `DEF-113`).

### D9 · Importar con Rust

- `copiar_arbol(vault_ruta, origen, destino_rel, decisiones)` y `conflictos_de_copia`
  (mismo recorrido) en `archivos.rs`. Copia todo lo no ignorado —notas, imágenes, PDF,
  carpetas vacías— con el `.mycignore` del origen o el default; `ruta_segura` para el
  destino; rechaza copiar una carpeta dentro de sí misma. **Desvío**: el `.mycignore` de
  la raíz del origen no se copia (en la raíz del vault reemplazaría el suyo).
- Firma con `vault_ruta` y `decisiones` además de `(origen, destino_rel)`: la primera
  porque `destino_rel` es relativo al vault; la segunda porque el diálogo pregunta antes
  de copiar. Conflicto sin decisión (apareció entre las dos llamadas) → se conservan los
  dos. «Reemplazar» pisa; «renombrar» deja `nota 1.md`.
- El `.zip` —y también lo soltado o elegido en el explorador— se baja por tandas de 4 MB
  a una carpeta temporal (`escribir_temporal_importacion`) y sigue el mismo camino; al
  final `borrar_temporal_importacion` (solo acepta `mycelium-import-*` del temporal del
  sistema). Sin crates nuevos: el `zip` lo sigue abriendo JSZip.
- Después, un `indexarVault` + `loadTree`. El resumen cuenta notas y adjuntos por
  extensión. El diálogo de conflicto nombra la ruta del archivo («Ya existe «Notas/foto.png»
  en la carpeta destino»).
- Borrados `leer_carpeta`, `recorrer`, `es_oculto`, `collectFromNativeFolder` y la
  tubería por nota. El soltado en el explorador sigue filtrando solo `.md` (como antes):
  quitar ese filtro es decisión aparte.

### Qué confirmar en la app

1. **Dibujos**: soltar un `.excalidraw` sobre una nota → aparece el archivo en el
   explorador, en la carpeta de la nota, y el embed se dibuja en vivo y en lectura; clic
   → modal → guardar. Menú contextual → exportar PNG y SVG. Insertar desde la barra en
   una carpeta cuando ya existe «Dibujo sin título» en la raíz → el embed lleva la ruta.
2. **Migración**: un vault de la 2.1.0 con un dibujo soltado (`![[<uuid>.excalidraw]]`)
   → al abrir aparece `«nota» - dibujo.excalidraw` y el embed apunta a él; cerrar, borrar
   el `index-<hash>.db` y reabrir → el dibujo sigue.
3. **Dos vaults** con `Notas/plan.md` distinto: abrir uno, cambiar al otro → se ve el
   texto correcto desde el primer frame, sin aviso de conflicto.
4. **Pestañas**: escribir, cambiar de pestaña enseguida y volver → el texto está; editar
   la nota desde fuera con la pestaña oculta y volver → se ve lo de fuera. El punto de la
   pestaña y la barra de estado pasan por «Guardando…» y «Guardado».
5. **Homónimos**: `Plan` en la raíz y en `Proyectos/`; `[[Plan]]` y `[[Proyectos/Plan]]`
   → el clic y el grafo (y el panel de conexiones) van a la misma nota en cada caso; un
   `![[x.excalidraw]]` aparece como arista.
6. **Importar un vault de Obsidian** (carpeta y `.zip`) con `.obsidian/`, imágenes
   pegadas y un PDF → todo en su sitio, `.obsidian/` fuera; importar otra vez y elegir
   «Reemplazar» → no quedan duplicados.

## Reflejo a web (2026-09-27)

Integrado en `web-cloud` (`46464b6`). **D8 sí**: `lib/wikilinks.ts` y `lib/editor/wikilink.ts`
idénticos; `test-wikilinks.mjs` sin las dos pruebas del grafo (dependen de
`lib/enlacesNota.ts`, solo-desktop). **Backend .NET**: `ResolutorWikilinks.cs` porta la regla
del editor (pista de carpeta, sin extensión, empate a la ruta más corta y después por id) y
`SearchEndpoints` la usa en el grafo y en las conexiones; `![[x.excalidraw]]` pasa a contar
como arista en web. La regla vive dos veces (TS y C#). **D6, D7 y D9 no se reflejan**: web
conserva los diagramas embebidos, la caché IndexedDB y la importación por nota. Detalle en
[[RAMAS]].

## Relacionadas

- [[Auditoria de codigo 2026-09-26]] — el plan completo.
- [[RAMAS]] — qué diverge y qué hay que reflejar a web.
- [[HUs]] — HU-16 (nota sobre el CA4).
- [[Bugs_errores_y_defectos]] — `DEF-112`, `DEF-113`.
- [[auditoria-capa-de-datos]] — la tanda anterior.
- [[BACKLOG]] — `FUN-M-40`, `FUN-M-15`.
