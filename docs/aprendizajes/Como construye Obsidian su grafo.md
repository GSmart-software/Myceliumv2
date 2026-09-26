# Como construye Obsidian su grafo

Estudio del 2026-09-26, pedido por el usuario, de **por qué el grafo de Obsidian es tan
fluido** con vaults grandes frente al de Mycelium antes de `FUN-M-38` y `DEF-109`. Parte de
[[Aprendizajes tecnicos]].

> [!info] Cómo se estudió, y hasta dónde
> Obsidian es de código cerrado. Se miró la instalación local (`Obsidian 1.6.x`, julio de
> 2024, en `AppData/Local/Programs/Obsidian`): la lista de archivos de sus bundles
> (`obsidian.asar`), los **nombres y cadenas** del código minificado (qué librerías, qué
> workers, qué estructuras y qué mensajes) y la API pública tipada de
> [`obsidianmd/obsidian-api`](https://github.com/obsidianmd/obsidian-api) (`MetadataCache`).
> No se descompiló lógica ni se copió código: lo que sigue es arquitectura, verificable
> con esas cadenas. Los bundles extraídos no se guardan en el repo.

## La respuesta corta

Obsidian no es más rápido «construyendo el grafo»: **no lo construye**. Mantiene un índice
de enlaces **persistente e incremental** desde que abre el vault, y el grafo es una lectura
de ese índice. Después, la física corre **en un worker** con un algoritmo O(n log n), y el
dibujo va por **WebGL**. Son tres decisiones, y Mycelium tenía la contraria en las tres.

## 1. El índice de enlaces es persistente e incremental

- `MetadataCache` guarda por archivo un `CachedMetadata` (`links`, `embeds`, `tags`,
  `headings`, `frontmatter`, `sections`) y dos mapas planos, públicos en la API:
  `resolvedLinks[origen][destino] = cuántas veces` y `unresolvedLinks[origen][texto] =
  cuántas veces`.
- El **parseo del markdown** lo hace un worker aparte (`worker.js`, nombre «Metadata
  Cache Worker»): el hilo de la interfaz no toca texto.
- La caché **se persiste en IndexedDB** (biblioteca `idb`; `saveFileCache` hace
  `db.transaction("file").store.put(cache, ruta)`). Al reabrir el vault, lo que no cambió
  **no se vuelve a parsear**.
- Al cambiar un archivo, se reparsea **solo ese archivo** y se recalcula **solo su fila**
  de `resolvedLinks` (`resolveLinks`: por cada `link` del cache, `getFirstLinkpathDest`
  → `resolvedLinks[ruta][destino]++`). Hay una cola (`linkResolverQueue`) y un evento
  `resolved` cuando termina.
- Al renombrar o borrar, `updateRelatedLinks(nombre)` recorre los mapas y re-resuelve
  **solo los archivos cuya fila menciona ese nombre**, resuelto o no. Así un enlace que
  estaba roto pasa a resolver cuando aparece la nota, sin escanear el vault.

**Contraste con Mycelium (antes de la auditoría):** `lib/db/grafo.ts` reconstruía el grafo
entero por consulta —`SELECT` del contenido completo de todas las notas por IPC,
`sinCodigo` y regex sobre cada una— y lo pedían tres consumidores por cada nota abierta y
por cada guardado (`DEF-109`, hallazgo 3). El índice SQLite **no tiene tabla de enlaces**:
persiste el texto y rederiva las aristas cada vez. `FUN-M-38` quitó el reindexado por
guardado y bajó el costo del indexado, pero la tabla de enlaces (propuesta 4 de `DEF-109`)
sigue siendo lo que separa a Mycelium de este modelo.

## 2. El grafo se arma leyendo el índice, en O(nodos + aristas)

La función que arma los nodos del grafo (`app.js`, la que recibe `metadataCache` y las
opciones de la vista) hace exactamente esto: recorre `getCachedFiles()`, y por cada ruta
toma `resolvedLinks[ruta]` (y `unresolvedLinks[ruta]` si no está `hideUnresolved`, y los
tags del cache si `showTags`), aplicando el filtro de búsqueda y el de «ignorados» del
usuario. No lee ningún contenido. Con 10.000 notas y 30.000 enlaces son 40.000 pasos sobre
mapas en memoria.

Detalle útil: la **construcción temporal** («timelapse») se resuelve ahí mismo, ordenando
las rutas por `min(ctime, mtime)` y cortando la lista en el nodo `i`: no hay una segunda
estructura.

## 3. La física corre en un worker, con Barnes-Hut y repulsión acotada

- Hay un segundo worker, **`sim.js`, «Graph Worker»** (17 KB). Es un `d3-force`
  empaquetado: en su código están `alphaTarget`, `theta`, `distanceMin`, `distanceMax`,
  `strength(-1000)`, `visitAfter`, `addAll`, `x0/y1` —el quadtree de `forceManyBody`—,
  `forceLink` con `iterations` y un `forceCenter`. Es decir, **Barnes-Hut** para la
  repulsión (O(n log n), la propuesta 3 de `DEF-109` que Mycelium prototipó) y no el par
  a par O(n²) que Mycelium tiene en `simulate()`.
- La repulsión está **acotada por distancia** (`distanceMin(30)`, `distanceMax`): los
  nodos muy lejanos no se calculan. Los sliders de la interfaz (`centerStrength`,
  `repelStrength`, `linkStrength`, `linkDistance`) se mandan al worker con
  `postMessage({forces, alpha: 0.3, run: true})`; el «repel» de la interfaz va al cubo
  (`repelStrength: e*e*e`) para que el slider sea perceptualmente lineal.
- El hilo de la interfaz **no simula**: manda `{nodes, links, alpha, run}` y, al
  arrastrar, `{forceNode: {id, x, y}, alphaTarget: 0.3}`. El worker devuelve las
  posiciones en un `Float32Array` plano (`[x0, y0, x1, y1, …]`) y, si el navegador lo
  permite, por **`SharedArrayBuffer`**: sin copia, con un contador de versión al final del
  buffer para saber si hay un frame nuevo.

**Contraste:** en Mycelium la simulación corre en el hilo de la interfaz, dentro del mismo
`requestAnimationFrame` que dibuja. A 2.000 nodos son 47 ms por frame de física antes de
dibujar nada (`DEF-109`, hallazgo 2), y cada frame lento se nota en toda la app.

## 4. El dibujo es WebGL, no canvas 2D

- Obsidian usa **PixiJS** (`lib/pixi.min.js`, `PIXI.Application`): las aristas son un
  `PIXI.Graphics` (`lineStyle` + trazos en un solo objeto), los nodos círculos
  (`drawCircle`) y las etiquetas `PIXI.Text`. Pixi manda los vértices a la GPU en lotes; no
  hay un `stroke()` por arista ni `shadowBlur`.
- No hay flujo animado por defecto en las aristas: la animación que existe es la del
  layout, y cuando la simulación se asienta el grafo **deja de repintarse**.

**Contraste:** Mycelium dibuja con canvas 2D, un `beginPath`/`stroke` por arista y, con el
flujo animado por defecto, **redibuja todo a 60 fps para siempre**; pasadas ~10.000
operaciones de path por frame Chromium cae a un régimen decenas de veces más lento
(`DEF-109`, hallazgo 1). Con `FUN-L-23` las tres disposiciones nuevas ya se dibujan a una
capa estática; el cúmulo sigue como estaba.

## Qué copiar y qué no

| Decisión de Obsidian | Mycelium hoy | Qué haría falta |
|---|---|---|
| Índice de enlaces persistente e incremental por archivo | Rederiva del texto en cada consulta | Tabla `enlaces` escrita por el indexador y por `putContenido` (`DEF-109` #4). Es **lo más importante** y ya está en el plan |
| Re-resolver solo lo afectado al renombrar | `renameNota` pide `conexiones` (grafo entero) | Cae solo con la tabla: los entrantes son un `SELECT` |
| Grafo = lectura del índice | `buildVaultGraph` + `sinCodigo` + regex | Ídem |
| Física en worker | En el hilo de la interfaz | Un worker con `postMessage` de posiciones; `simulate()` ya es puro y se puede mover. Segundo paso, después de la tabla |
| Barnes-Hut + repulsión acotada por distancia | Par a par O(n²) | Prototipado en `DEF-109` (×4 a 2.000 nodos, ×7 a 4.000). El `distanceMax` es un ahorro extra barato |
| WebGL (Pixi) | Canvas 2D | **No hace falta** para el tamaño que Mycelium apunta: capa estática + sin flujo en reposo (`DEF-109` #1 y #2) rinden lo suficiente sin una dependencia de 476 KB. Reevaluar solo si después de eso el dibujo vuelve a ser el techo |
| Parseo en worker + IndexedDB | Indexado en el hilo de la interfaz, por IPC, a SQLite | `FUN-M-38` bajó el costo (13.684 → 67 sentencias); `FUN-L-10` (indexar en Rust) es el equivalente natural en Tauri: el proceso nativo es «el worker» |

> [!important] El orden importa
> Ninguna de las mejoras de dibujo o de física compensa reconstruir el grafo desde el texto
> por cada nota que se abre. Primero la tabla de enlaces; después el worker y Barnes-Hut;
> WebGL, probablemente nunca.

## Relacionadas

- [[Rendimiento del grafo]] — `DEF-109`: el diagnóstico y el plan de Mycelium, al que esta
  nota le da el modelo de referencia.
- [[Auditoria de codigo 2026-09-26]] — de dónde salió `FUN-M-38`, que ya aplicó una parte.
- [[grafo-disposiciones]] — `FUN-L-23`, las disposiciones con capa estática.
- [[Rendimiento de la apertura del vault]] — el indexador, el equivalente de su
  `MetadataCache`.
- [[Aprendizajes tecnicos]] — mapa del área.
