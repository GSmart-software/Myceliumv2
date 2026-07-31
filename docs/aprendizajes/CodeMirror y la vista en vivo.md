# CodeMirror y la vista en vivo

Aprendizajes sobre el editor (CodeMirror 6) y la **vista en vivo** de Mycelium, donde
el Markdown se decora y algunos bloques se reemplazan por widgets. Parte de
[[Aprendizajes tecnicos]].

## El height-map: CodeMirror no mide márgenes

**Caso**: `DEF-031` / `DEF-037` — al trabajar con tablas, el clic no seleccionaba
donde se hacía, las flechas hacían "saltar" el documento y el gutter de plegado
quedaba desfasado respecto a las líneas.

**Dos hipótesis equivocadas** antes de dar con la causa: primero se sospechó del
`height`/`overflow` del contenedor de la tabla; después, del `estimatedHeight` del
widget. El usuario reportó "sigue pasando" en ambos casos.

**Causa raíz**: el widget de tabla espaciaba con `margin`. CodeMirror mide los
bloques con `offsetHeight`, que **excluye los márgenes**, así que su *height-map*
quedaba más corto que el layout real **por cada tabla**. Ese error acumulado es lo
que desplazaba el mapeo posición ↔ coordenada (de ahí el clic mal ubicado, el salto
del scroll y el gutter corrido).

**Fix**: reemplazar `margin` por `padding` en el widget (`.mic-live-table`).

> [!important] Regla general
> En un widget de bloque de CodeMirror, **nunca separes con `margin`**: usá `padding`
> (o un contenedor interno). Todo espaciado tiene que quedar dentro de lo que
> `offsetHeight` puede ver, o el height-map se desincroniza.

## Widgets de bloque: `estimatedHeight`

Aun con el `margin` corregido, conviene declarar `estimatedHeight` en widgets que
tardan en renderizar: reduce el reflow inicial. **No** resuelve por sí solo un
desfase (fue la hipótesis #2 del caso anterior), pero ayuda al primer pintado.

## Decoraciones que dependen de la profundidad

**Caso**: `DEF-021` y `DEF-022` — callouts. Dos problemas distintos con la misma
raíz conceptual: el estado del parser se llevaba en variables planas.

- `DEF-021`: un callout con tipo (`> [!question]`) "contaminaba" las citas `>`
  siguientes, incluso separadas por una línea vacía. El tipo activo no se reseteaba
  al cortarse el bloque.
- `DEF-022`: no se renderizaban callouts **anidados**.

**Solución**: modelar el estado **por profundidad de blockquote**, no como un valor
único. En `lib/editor/livePreview.ts`:

- `CALLOUT_HEAD_RE = /^((?:\s*>\s*)+)\[!([\w-]+)\]([-+]?)/` — cuenta los `>` para
  saber la profundidad.
- `tipos[]` y `colapsado[]` como **pilas** indexadas por profundidad.
- Una línea vacía (o una que no continúa a esa profundidad) **cierra** el nivel.
- El DOM lleva `data-callout-depth` para que el CSS indente por nivel.

> [!tip] Principio
> Cuando una decoración dependa de una estructura anidada (citas, listas), el estado
> del recorrido debe ser una **pila por nivel**. Un `let tipoActual` funciona en el
> caso simple y falla en cuanto hay anidación o cortes.

## Otros detalles del editor

- **Caret invisible en el editor CSS** (`DEF-026`): CodeMirror necesitaba
  `caret-color` explícito en `.cm-content.cm-lineWrapping`; el color heredado lo
  volvía invisible sobre el fondo del modal.
- **El editor puede robar el puntero**: durante un arrastre, CodeMirror inicia
  selección de texto y dispara `pointercancel`, abortando el drag. Ver el caso
  completo en [[Drag and drop en Mycelium]].
- **Instancias que sobreviven al remount**: el editor mantiene un caché de instancias
  por `instanceId` a nivel de módulo, para que mover una pestaña de panel no reinicie
  el estado. El mismo patrón se reutilizó para la terminal (ver
  [[Terminal integrada - PTY y xterm]]).

## Relacionadas

- [[Aprendizajes tecnicos]] — mapa del área.
- [[Drag and drop en Mycelium]] — el editor como participante involuntario del arrastre.
- [[DESIGN_SYSTEM]] — tokens y estilos que usan estas decoraciones.
- [[bugs-progreso]] — trazabilidad de `DEF-021`, `DEF-022`, `DEF-026`, `DEF-031/037`.
