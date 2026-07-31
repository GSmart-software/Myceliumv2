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

## Relacionadas

- [[Aprendizajes tecnicos]] — mapa del área.
- [[DESIGN_SYSTEM]] — los tokens de color que consume el grafo (y el patrón de
  re-leerlos al cambiar de tema).
- [[BACKLOG]] — donde entraría esta optimización como funcionalidad priorizable.
- [[Estado del proyecto]] — situación general.
