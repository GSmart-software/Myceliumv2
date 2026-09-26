# Rendimiento del grafo

Análisis del costo por frame del grafo (`components/graph/MiniGraph.tsx`, usado por el
grafo global y el mini-grafo) y propuestas para mejorarlo **sin cambiar la
experiencia**. Parte de [[Aprendizajes tecnicos]].

> [!info] Contexto
> El usuario reporta caídas de rendimiento "cuando existen demasiados nodos" y sospecha
> de "los efectos y la estilización". La sospecha es **correcta a medias**: el glow es
> el costo dominante del *dibujo*, pero hay un segundo costo, cuadrático, en la
> *simulación*.

## Lo que ya está bien resuelto

No conviene rehacer lo que ya existe:

- **Idle-stop**: cuando el grafo se asienta (`alpha < 0.03`) y pasa el período de gracia
  (5 s sin interacción), se deja de simular y de pedir frames. Con `continuousSim` el
  usuario puede desactivarlo a conciencia.
- **Caché de layout y de vista**: las posiciones y el zoom/pan se guardan al desmontar,
  así volver a la pestaña no re-simula desde cero.
- **Texto reducido al alejar**: con `scale <= 0.5` solo se rotula el nodo apuntado y el
  central.

## Los dos costos dominantes

### 1. Repulsión O(n²) en `simulate()`

```js
for (let i = 0; i < active.length; i++)
  for (let j = i + 1; j < active.length; j++) { /* … fuerza … */ }
```

Cada frame compara **todos los pares**: `n(n-1)/2`. Para el vault de referencia (≈354
notas) son ~62.500 pares por frame; con 1.000 nodos, ~500.000 (30 M/s a 60 fps). Cada
par hace una raíz cuadrada y ~15 operaciones.

Detalle importante: la fuerza está **clampeada** (`Math.min(k*k/d2, 8)`) y decae con
1/d², así que la mayoría de esos pares aporta un valor despreciable — se paga el cálculo
sin efecto visible.

### 2. `shadowBlur` por nodo en `draw()`

```js
ctx.shadowColor = …; ctx.shadowBlur = isWhite ? 22 : refsFocus ? 16 : 12;
ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.fill();
```

`shadowBlur` es de las operaciones **más caras** del canvas 2D: obliga al motor a
rasterizar en un buffer aparte y aplicar un blur gaussiano **por cada `fill()`**. Son
tantos blurs por frame como nodos visibles.

## Costos secundarios

| Punto | Detalle |
|---|---|
| **Sin culling de viewport** | Se dibujan todos los nodos, aristas y textos, incluso fuera de la pantalla. Con zoom alto se paga mucho invisible. |
| **Aristas con 2–3 paths** | Base + flujo animado + flecha. Además, el modo *animado* mantiene el rAF corriendo siempre (no descansa nunca): 60 fps de dibujo permanente. |
| **`radius(n)` recalculado** | Se llama en el loop de nodos y otra vez en el de texto. |
| **`pick()` es O(n)** | En cada `mousemove` recorre todos los nodos. |
| **`Math.hypot`** | Más lento que `Math.sqrt(dx*dx+dy*dy)` en bucles calientes. |

> [!warning] Bug de fidelidad encontrado de paso
> `ctx.font = \`${12/scale}px var(--mic-font-sans, sans-serif)\`` — el canvas **no
> resuelve variables CSS**, así que la etiqueta cae siempre al `sans-serif` del sistema.
> Hay que resolver la fuente con `getComputedStyle` una vez y pasar el valor literal.

## Propuestas, por relación impacto/riesgo

### A. Sprites cacheados en vez de `shadowBlur` — alto impacto, riesgo bajo
Pre-renderizar el nodo **con su glow** en un canvas offscreen (uno por combinación de
color × radio × estado) y dibujarlo con `drawImage`. Las combinaciones son pocas
(radios discretizados, la paleta del usuario, 3 estados), así que el blur se calcula
una vez por combinación y no una vez por nodo por frame.

**Aspecto visual: idéntico.** Es la mejora más rentable.

### B. Culling por viewport — impacto medio-alto, riesgo bajo
Calcular el rectángulo visible en coordenadas de mundo y saltear lo que queda fuera
(nodos, aristas y textos). Un test de caja por elemento es ~gratis comparado con
dibujarlo. **Sin ningún cambio visual.**

### C. Degradación adaptativa — alto impacto, riesgo bajo
A partir de un umbral (p. ej. > 300 nodos visibles, o `scale < 0.35`), bajar
automáticamente los efectos: glow plano (sin blur) y rótulos solo en hover. Es lo que
hacen otras herramientas del rubro. Idealmente **configurable**, para que quien prefiera
fidelidad sobre fluidez pueda forzarlo.

**Único punto donde la experiencia cambia** — y solo en el escenario donde hoy la
experiencia ya es mala.

### D. Repulsión con estructura espacial — alto impacto con N grande, riesgo medio
Dos variantes:

- **Grid uniforme** (celda ≈ `k`): solo se comparan pares de celdas vecinas → O(n·k).
  Simple, pero **pierde la repulsión de larga distancia**, así que la *forma* del grafo
  puede cambiar (clusters más juntos).
- **Barnes-Hut (quadtree)**: agrupa los nodos lejanos en un centro de masa → O(n log n)
  **conservando** el efecto de larga distancia. Más código (~80 líneas), fidelidad de
  layout muy alta. Es lo que usa `d3-force`.

Recomendado Barnes-Hut si se encara, porque no altera la estética del layout.

### E. Micro-optimizaciones — impacto bajo, riesgo nulo
`pick()` sobre el grid, `sqrt` en vez de `hypot`, cachear `radius(n)` por frame,
agrupar los strokes de aristas por estilo para reducir cambios de estado del contexto, y
arreglar el `ctx.font` con `var()`.

## Plan sugerido

1. **A + B + E** (sin tocar la simulación ni el aspecto) → medir.
2. **C** con umbral configurable → cubre el caso extremo.
3. **D** (Barnes-Hut) solo si tras 1 y 2 la simulación sigue siendo el techo.

Medir antes/después con el mismo vault: nodos visibles, ms por frame de `simulate()` y
de `draw()` por separado (dos `performance.now()`), y fps sostenido mientras se arrastra
un nodo (el peor caso: mantiene `alpha` alto).

---

## Estado: A + B + E implementadas

Aplicadas en `MiniGraph.tsx` (beneficia al grafo global **y** al mini-grafo del panel
derecho, que comparten el componente). **Sin cambios en la simulación** (`D` sigue
pendiente) y sin cambios visuales buscados.

### A · Sprites cacheados en vez de `shadowBlur`

`nodeSprite(fill, shadow, rPix, blurPix)` mantiene un `Map` a nivel de módulo con
canvas offscreen donde el círculo y su glow ya están rasterizados; el dibujo por nodo
pasa a ser un `drawImage`. El blur gaussiano se calcula **una vez por combinación**
(color × radio × estado) en lugar de una vez por nodo y por frame.

> [!important] Por qué el sprite se genera en píxeles de PANTALLA
> `shadowBlur` **no** se transforma con la matriz del contexto (es espacio de
> dispositivo). Por eso el glow del código original medía 12 px de pantalla a
> cualquier zoom. El sprite replica eso: se rasteriza con `rPix = r · scale · dpr` y
> `blurPix` sin escalar, y luego se coloca en coordenadas de mundo con
> `ladoMundo = sprite.width / (scale · dpr)` — relación **1:1** con los píxeles
> reales, sin resampleo ni cambio de aspecto.

Detalles:
- `rPix` se redondea a 0.5 px para acotar cuántas variantes genera el zoom continuo.
- Caché con techo (`SPRITE_CACHE_MAX = 400`, `clear()` al superarlo): el zoom crea
  radios nuevos y sin techo crecería indefinidamente. Al cambiar de tema, los colores
  nuevos generan claves nuevas (los viejos se descartan en el próximo `clear`).
- Es **global al módulo** a propósito: dos grafos montados a la vez comparten sprites.

> [!warning] Único efecto visual posible
> El sprite se coloca en coordenadas de mundo, así que su origen puede caer en
> **subpíxel** y el navegador interpola. Sobre un glow difuso es imperceptible; si
> alguna vez se notara falta de nitidez en el disco, la alternativa es dibujar los
> nodos **fuera de la transformación** (posición de pantalla redondeada a entero), a
> costa de más código.

### B · Culling por viewport

Se calcula el rectángulo visible en coordenadas de mundo (`visL/visR/visT/visB`, con
40 px de margen para el glow y la etiqueta) y se descarta lo que queda afuera:

- **Nodos y etiquetas**: test de punto (`dentro(x, y)`).
- **Aristas**: test de caja envolvente de sus dos extremos contra la vista.

Sin cambio visual: solo se deja de rasterizar lo que no se ve. La ganancia crece con el
zoom (que es justo cuando más nodos quedan fuera de pantalla).

### E · Micro-optimizaciones

- **Radio precalculado**: `r` pasa a ser un campo de `SimNode`, calculado una vez al
  construir la simulación. Antes `radius(n)` se recalculaba **dos veces por nodo y por
  frame** (dibujo + etiqueta) y una vez por nodo en cada `pick()`.
- **`pick()` sin raíz cuadrada** en el descarte: compara distancias **al cuadrado**
  (este bucle corre en cada `mousemove`).
- **`Math.hypot` → `Math.sqrt`** en el bucle de aristas de `simulate()` (`hypot` es
  notablemente más lento en bucles calientes).

### Bug corregido de paso

`ctx.font` usaba `var(--mic-font-sans, sans-serif)`, que el canvas **no resuelve**: las
etiquetas caían siempre al `sans-serif` del sistema. Ahora la familia se lee
**computada** del canvas (`getComputedStyle(canvas).fontFamily`, heredada de `body`,
que sí usa el token), así que las etiquetas usan por fin la tipografía de Mycelium.

### Cómo medir la mejora

Con las devtools —ahora disponibles también en producción, ver
[[Generar instaladores desktop]]— grabar un *Performance profile* mientras se arrastra
un nodo (peor caso: mantiene `alpha` alto y fuerza simulación + dibujo cada frame) y
comparar el tiempo en `draw` vs `simulate`. Si `draw` ya no domina, el techo restante es
la repulsión O(n²) → propuesta **D**.

---

## Segundo análisis (2026-09-25): más de 1.000 documentos — `DEF-109`

Con A + B + E el grafo anda bien hasta unos cientos de notas, pero el usuario reporta que
**pasadas las 1.000 es inusable** ([[Bugs_errores_y_defectos]] · `DEF-109`). Se volvió a
razonar desde cero, midiendo con **réplicas fieles del código** (no estimaciones): la
simulación en Node, el dibujo en Chromium headless (Playwright, el mismo motor que WebView2)
y el armado del dato con los módulos reales compilados con esbuild. Los scripts no se
conservan en el repo; los números sí, acá.

### Hallazgo 1 · El flujo animado es el peor costo, y viene activo por defecto

`graphEdgeDirection` vale `"animated"` por defecto (`stores/preferencesStore.ts`), y con
flujo el bucle **redibuja el grafo entero a 60 fps para siempre** mientras sea visible: el
idle-stop solo para la simulación, no el dibujo. Cada arista se traza **dos veces** (base +
dash animado) con su propio `beginPath()`/`stroke()`.

Costo de `draw()` en Chromium, réplica con el mismo culling, sprites y etiquetas:

| Nodos (aristas) | Zoom 1 · flujo + etiquetas (default) | Zoom 1 · sin flujo | Zoom 0,3 (todo visible) · flujo | Zoom 0,3 · sin flujo |
|---|---|---|---|---|
| 1.000 (3.000) | 34 ms | 17 ms | 26 ms | 14 ms |
| 2.000 (6.000) | 49 ms | 21 ms | **719 ms** | 15 ms |
| 4.000 (12.000) | 50 ms | 19 ms | **2.118 ms** | 1.171 ms |

Dos cosas saltan:

- **El flujo duplica el frame** a cualquier tamaño (17 → 34 ms a 1.000 nodos), y como
  nunca descansa, el grafo de 1.000 notas vive a ~29 fps aunque esté quieto.
- **Hay un acantilado, no una pendiente.** De 2.000 a 4.000 nodos con todo visible el
  frame pasa de 26 a 719 y a 2.118 ms: ×28 por ×2. Medido cada componente por separado, el
  mismo dash de 6.000 aristas cuesta 40 ms —no 719—, así que el salto no es el costo
  intrínseco de las aristas sino **cuántas operaciones de path acumula un frame**: pasada
  cierta cantidad (del orden de las 10.000 entre base, dash y etiquetas) el canvas entra en
  un régimen decenas de veces más lento. La causa probable es que Chromium deje de acelerar
  por GPU un canvas con demasiadas operaciones caras por frame; **no se verificó** por
  dentro, pero el efecto se reprodujo en todas las corridas. Con más de 1.000 notas, alejar
  el zoom para abarcar el grafo es justo lo que se hace, y es justo lo que cae ahí.

> [!warning] Agrupar las aristas en UN solo path es PEOR, no mejor
> La propuesta E decía "agrupar los strokes por estilo". Se midió: un único `beginPath()`
> con 3.000 curvas y un solo `stroke()` tarda **68 ms** contra 20 ms de un stroke por
> arista (y 126 contra 39 con 12.000). Un path enorme con miles de subtrazos que se cruzan
> obliga al rasterizador a resolver el antialiasing de todo junto. **Descartado.** El
> camino es reducir *cuántas veces* se dibuja, no fusionar los trazos.

Alternativa medida para el flujo: **una partícula por arista** (un sprite de 8 px con
`drawImage` avanzando por la bézier) cuesta 5 ms donde el dash cuesta 25 (zoom 1, 3.000
aristas). Pero con 12.000 aristas visibles son 104 ms: hay que **acotar** el flujo (solo con
zoom ≥ 0,5, que es cuando se distingue, y con un techo de aristas), no solo abaratarlo.

### Hallazgo 2 · La repulsión O(n²), ahora con números

Réplica exacta de `simulate()` en Node (V8, el mismo motor):

| Nodos | ms/frame de `simulate()` | fps máximo (solo simular) | Tiempo hasta asentarse (700 frames) |
|---|---|---|---|
| 350 | 1,7 | 600 | 12 s (limitado por los 60 fps) |
| 1.000 | 13,7 | 73 | 12 s |
| 2.000 | 46,6 | 21 | 33 s |
| 4.000 | 144 | 7 | 101 s |

Sumado al dibujo, a 1.000 nodos el frame de apertura son ~48 ms (20 fps) durante los 12 s
del asentamiento, y 34 ms después, para siempre. A 2.000, medio minuto a 20 fps y luego el
acantilado del flujo en cuanto se aleja el zoom.

`alpha` decae ×0,995 por frame de 1 a 0,03: **700 frames**, sean lentos o rápidos. Con el
layout cacheado se arranca en 0,05 (casi nada), pero **cualquier nota nueva** lo sube a
0,4 → 517 frames de simulación completa.

Prototipo **Barnes-Hut** (quadtree en arrays tipados, θ = 0,9 como `d3-force`) contra la
repulsión de pares, misma distribución de nodos:

| Nodos | Pares | Barnes-Hut | Ganancia |
|---|---|---|---|
| 1.000 | 7,5 ms | 3,7 ms | ×2 |
| 2.000 | 29 ms | 7,6 ms | ×4 |
| 4.000 | 118 ms | 17 ms | ×7 |
| 8.000 | — | 32 ms | — |

A 1.000 nodos la ganancia es modesta (construir el árbol cuesta); a partir de 2.000 es lo
que separa "usable" de "no". Conserva la repulsión de larga distancia, así que la forma del
grafo no cambia (la del grid uniforme sí cambiaría).

### Hallazgo 3 · El dato del grafo se reconstruye entero, y lo piden tres consumidores

Esto no estaba en el primer análisis y explica la parte del reporte que **no** es el grafo:
"abrir o guardar cualquier nota produce una pausa".

`lib/db/grafo.ts` → `buildVaultGraph()` hace, **cada vez**: un `SELECT` del contenido
completo de todas las notas (cruza el puente IPC serializado como JSON), `sinCodigo()` sobre
cada una (recorre el texto carácter a carácter y hace `split("")`), la regex de wikilinks, y
`etiquetasDe()` (que vuelve a pasar por `sinCodigo`). Medido con los módulos reales:

| Notas (tamaño) | Aristas | Etiquetas | JSON ida y vuelta (cota inferior del IPC) | Total |
|---|---|---|---|---|
| 1.000 (3,6 MB) | 137 ms | 137 ms | 25 ms | **≈300 ms** |
| 2.000 (7,1 MB) | 291 ms | 233 ms | 45 ms | ≈570 ms |
| 4.000 (14,3 MB) | 475 ms | 427 ms | 79 ms | ≈980 ms |

Todo en el hilo principal. Y **no lo pide solo el grafo**:

| Consumidor | Cuándo llama | Qué usa del resultado |
|---|---|---|
| `GraphView` (`graphStore.fetch`) | al montar, y en cada `markStale` (guardar, crear, borrar, renombrar, cambio externo) | todo |
| `NotePanel` (`/notas/{id}/conexiones`) | al abrir cada nota y en cada recarga externa | salientes, retro y vecindario de UNA nota |
| `BarraEstado` (`/notas/{id}/conexiones`) | al abrir cada nota, **en cada guardado** (`guardadoEn`) y en cada recarga externa | **dos números** (cuántas salientes, cuántas retro) |
| `renameNota` (`/notas/{id}/conexiones`) | al renombrar | los retroenlaces |

Y `conexiones(notaId)` llama a `buildVaultGraph` **del vault entero** para responder por una
sola nota. Así, en un vault de 1.000 notas: **abrir una nota = 2 escaneos completos
(≈600 ms)**; **guardarla = 1 escaneo** por la barra de estado más otro si el grafo está
montado; **cada ráfaga del watcher = reindex + 3 escaneos**. Con un agente de IA
escribiendo en el vault —el caso de uso central de [[Mycelium como memoria de la IA]]—
eso es continuo.

La raíz es que **el índice SQLite no tiene tabla de enlaces**: guarda `notas`, `contenidos`,
`propiedades`, `notas_fts`… pero las aristas no se persisten y se rederivan del texto en
cada consulta. El indexador ya parsea cada nota cuando cambia (`reindexarPropiedades` es el
patrón exacto): extraer ahí los wikilinks a una tabla `enlaces (desde_id, hasta_titulo,
hasta_id)` convierte el grafo en un `SELECT` y las conexiones de una nota en dos consultas
por índice. Es incremental por naturaleza: solo se reescriben las filas de la nota que
cambió.

### Costos que se descartaron

- `pick()` O(n) en `mousemove`: 1.000 comparaciones al cuadrado por evento, despreciable.
- `computeRefs()` O(E) al cambiar el hover: 3.000 comparaciones, despreciable.
- Etiquetas: con zoom > 0,5 son ~300 `fillText` visibles, ≈2 ms. Reales, pero no el techo.
- El escaneo de `propiedades`/FTS en el guardado: ya es incremental por nota.

### Plan propuesto (pendiente de confirmar con el usuario)

Ordenado por impacto sobre riesgo, y por qué parte del reporte resuelve cada uno:

| # | Cambio | Resuelve | Alcance | Riesgo |
|---|---|---|---|---|
| 1 | **Capa estática + capa de flujo.** Aristas, nodos y etiquetas se dibujan a un canvas offscreen solo cuando la simulación se mueve o cambia la vista; en reposo cada frame es un `drawImage` de esa capa más el flujo encima. | El 60 fps eterno del default | Frontend (ambas) | Bajo: sin cambio visual |
| 2 | **Flujo acotado y barato.** No se dibuja con zoom < 0,5 (mismo umbral que ya apaga las etiquetas: a ese tamaño no se distingue) ni por encima de un techo de aristas visibles; y se reemplaza el dash por partículas (`drawImage`), 5× más barato. | El acantilado al alejar el zoom | Frontend (ambas) | Medio: el flujo cambia de aspecto (puntos en vez de guiones); a discutir |
| 3 | **Barnes-Hut en `simulate()`** (propuesta D del primer análisis, ya prototipada). | Los 12–100 s de asentamiento y el arrastre a tirones | Frontend (ambas) | Medio: ~80 líneas, mismo layout |
| 4 | **Tabla `enlaces` en el índice**, escrita por el indexador y por el `PUT` de contenido; `grafo()` y `conexiones()` pasan a consultas SQL. | La pausa al abrir/guardar notas; el grafo refresca en ms | **Solo desktop** (en web el grafo lo arma el backend .NET) | Medio: migración del índice (regenerar si falta la tabla, como se hizo con `propiedades`) |
| 5 | **Un solo consumidor del escaneo.** La barra de estado toma los dos números del `graphStore` (o de una consulta `COUNT` sobre `enlaces`) en vez de pedir `/conexiones`; `NotePanel` y `renameNota` consultan por índice. | Los escaneos redundantes | Frontend + datos | Bajo |
| 6 | **Presupuesto de frame.** Si un frame supera ~25 ms, degradar solo: apagar flujo, luego etiquetas. Configurable. | El caso extremo que 1–5 no alcancen | Frontend (ambas) | Bajo |

Sugerencia de orden: **1 + 2 + 3** en un cambio del frontend (es un solo archivo,
`MiniGraph.tsx`, compartido por las dos versiones: se implementa en desktop y se refleja a
web con [[Reflejar cambios de desktop a web]]) y **4 + 5** en otro, solo desktop, que
toca el indexador. El 6 queda como red si hiciera falta. Medir antes y después con el mismo
vault de prueba de `DEF-105`/`DEF-108` (3.340 notas), que es el tamaño que el reporte
describe.

> [!info] Lo que `FUN-L-23` ya aplicó de este plan (2026-09-26)
> Las tres disposiciones nuevas del grafo ([[grafo-disposiciones]]) se dibujan a una
> **capa estática** que solo se repinta al cambiar la vista o mover nodos, sin
> `requestAnimationFrame` en reposo: es la propuesta **1** de arriba, aplicada a lo nuevo.
> «Sustrato» comparte el motor `simulate()` del cúmulo (con `k = 45`), así que la
> propuesta **3** (Barnes-Hut) le llegaría sola. El cúmulo en sí sigue como estaba: las
> propuestas 1 a 6 sobre él siguen pendientes de decisión.

> [!important] Qué verificar en la app, no solo con `tsc`
> Que el flujo se vea igual con zoom ≥ 0,5; que el layout con Barnes-Hut sea
> indistinguible del actual (mismo vault, misma caché de posiciones); que al guardar una
> nota la barra de estado siga actualizando los números; y que un `[[enlace]]` escrito
> desde fuera (agente, otro editor) aparezca en el grafo tras el reindex del watcher.

## Relacionadas

- [[Como construye Obsidian su grafo]] — el modelo de referencia (2026-09-26): confirma
  el orden del plan: tabla de enlaces primero, worker y Barnes-Hut después, WebGL nunca.
- [[Aprendizajes tecnicos]] — mapa del área.
- [[Bugs_errores_y_defectos]] · `DEF-109` — el reporte que motivó el segundo análisis;
  estado en [[bugs-progreso]].
- [[Rendimiento de la apertura del vault]] — el otro análisis de rendimiento; comparte la
  raíz "el índice no persiste lo derivado" y el costo del puente IPC.
- [[Capa de datos del desktop]] — dónde encajaría la tabla `enlaces`.
- [[DESIGN_SYSTEM]] — los tokens de color que consume el grafo (y el patrón de
  re-leerlos al cambiar de tema).
- [[BACKLOG]] — donde entraría esta optimización como funcionalidad priorizable.
- [[Estado del proyecto]] — situación general.
