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

> [!tip] Checklist para un widget de bloque nuevo
> Lo aplicado al de propiedades del frontmatter (`FUN-M-04`, ver [[metadata-yaml]]):
> decoración desde un **StateField** (nunca un `ViewPlugin`); `estimatedHeight`
> estimado por número de filas; espaciado con `padding` y `margin: 0` también en el
> contenido interno (si el widget reusa `.mic-preview` hay que neutralizar además su
> `height: 100%` y su `overflow-y: auto`, que no son de contenido sino de panel); y
> **de solo lectura**: la interacción que edite el documento va fuera del editor, que
> es de donde salieron `DEF-031`/`DEF-037`.

> [!important] Lo de "solo lectura" ya no vale: `FUN-M-19` lo revirtió
> La causa de `DEF-031`/`DEF-037` fue el `margin` del widget, no la interactividad. Desde el
> 2026-08-16 el widget de propiedades **edita el documento** (ver [[edicion-en-el-render]]).
> **La regla del `padding` no se toca.**

## Widget de bloque INTERACTIVO: las seis reglas

Lo que hay que sostener cuando un widget deja de ser un adorno y pasa a editar el documento
(`FUN-M-19`; `lib/editor/propiedadesWidget.ts` es el caso de referencia):

1. **`padding`, nunca `margin`** — la de arriba, la única que ya costó cara.
2. **`updateDOM(dom, view, from)` obligatorio**: parchear el DOM en sitio y devolver `true`.
   Sin esto CodeMirror tira el DOM y lo reconstruye en cada pulsación, y el campo que se está
   editando **pierde el foco a la primera tecla**. Ojo con la firma en CodeMirror 6.43: el
   tercer argumento es el **widget anterior**, no una posición.
3. **`ignoreEvent()` al revés de lo habitual**: por defecto un widget de bloque devuelve
   `false` para que el clic lo tome el editor y coloque el cursor; si hay controles, tiene que
   devolver `true` **para lo que nace en ellos** o `eventBelongsToEditor` se queda el clic y
   las teclas y nunca llegan al campo. Conviene distinguir: `true` en los controles, `false`
   en el resto del widget, para no perder la forma de posicionar el cursor.
4. **`dispatch` al rango mínimo, con `userEvent` propio**: escribir el documento entero
   arruina el deshacer y mueve el cursor. Y `history` **solo agrupa `input.type` y `delete`**
   (regex `joinableUserEvent`), así que un `userEvent` como `input.propiedad` garantiza que
   cada operación sea un paso de `Ctrl+Z` entero — y al empezar por `input.` sigue contando
   como edición del usuario para el resto del editor.
5. **Todo cambio de alto pide medida** (`view.requestMeasure()`). Si el widget crece o
   encoge por interacción —abrir el editor de un campo, mostrar un error— eso pasa FUERA del
   ciclo de actualización de CodeMirror y su height-map se queda con el alto anterior: el
   mismo desfase de `DEF-031`/`DEF-037` por otra puerta.
6. **Si el bloque ya no se abre en crudo, es un átomo** (`EditorView.atomicRanges`). Un
   widget que reemplaza texto y NUNCA lo revela deja un rango donde el cursor puede entrar
   sin verse: el clic en un hueco de la tarjeta, o una flecha, dejan el cursor dentro del
   YAML invisible y lo siguiente que se teclee lo corrompe **a ciegas**. Declarando el rango
   atómico, el clic y las flechas caen en sus bordes. No hacía falta antes porque el bloque
   se abría al entrar el cursor: la interactividad es lo que crea el problema.

> [!tip] Lo que CodeMirror ya resuelve solo
> Las mutaciones del DOM **dentro** de un widget se ignoran (`readMutation` devuelve `null`
> para los tiles de widget), y la selección no se fuerza mientras el `activeElement` no sea
> el `contentDOM` — o sea que un `<input>` enfocado dentro de un widget no pelea con el
> editor. Lo que hay que cuidar es lo de arriba, no eso.

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
