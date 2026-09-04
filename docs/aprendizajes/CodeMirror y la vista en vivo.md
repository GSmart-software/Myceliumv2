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

> [!info] Aplicadas por segunda vez en `FUN-L-19` (tablas, 2026-08-16)
> Las seis salieron enteras de la primera mitad y no hubo que agregar ninguna. Lo que sí
> apareció al aplicarlas a un widget que **ya existía**:
>
> - **El átomo tiene un efecto lateral: no se puede TECLEAR una tabla nueva.** Al cerrar la
>   fila de guiones el bloque se vuelve widget con el cursor adentro, y como el rango es
>   atómico la tecla siguiente cae fuera. Se resolvió dejando en crudo la tabla que se está
>   tecleando, hasta que el cursor sale — y solo para lo que teclea el usuario, no para lo
>   que escribe el widget (que lleva su propio `userEvent`) ni para el deshacer.
> - **La posición del bloque no se puede guardar en el widget.** Mientras el contenido no
>   cambie, CodeMirror reusa el widget aunque el texto de más arriba se mueva, así que el
>   `dispatch` iría a un rango viejo. Se resuelve con `view.posAtDOM(dom)` en el momento de
>   la operación. (En `FUN-M-19` no se notó: el frontmatter siempre arranca en 0.)
> - **Los controles que aparecen al pasar el puntero no pueden cambiar el alto**: si lo
>   cambian, la quinta regla obliga a medir en cada `mouseover`. Reservarles el lugar con
>   `visibility` y sacar el menú del flujo con `position: absolute` lo evita de raíz.

> [!tip] Lo que CodeMirror ya resuelve solo
> Las mutaciones del DOM **dentro** de un widget se ignoran (`readMutation` devuelve `null`
> para los tiles de widget), y la selección no se fuerza mientras el `activeElement` no sea
> el `contentDOM` — o sea que un `<input>` enfocado dentro de un widget no pelea con el
> editor. Lo que hay que cuidar es lo de arriba, no eso.

## Desplazar a una posición: no siempre alcanza con pedírselo

**Caso**: `DEF-056` — el buscador saltaba a la coincidencia y la dejaba fuera de la pantalla,
por arriba.

`EditorView.scrollIntoView` puede **no cumplirse y darse por cumplido**. Medido en la app: la
coincidencia quedaba 149 px por encima del área visible, con margen de sobra para desplazarse,
y el valor era idéntico en el frame siguiente y a los 300 ms. Ni `y: "center"` ni
`scrollMargins` cambiaban nada, porque los dos le pedían amablemente a quien ya estaba
ignorando la petición.

> [!tip] Si hay que desplazar con precisión, calculalo
> Las medidas de CodeMirror **sí** son fiables (`lineBlockAt` coincidió con `coordsAtPos` en
> 2 px), así que se pueden usar sin él:
>
> ```ts
> const sc = view.scrollDOM;
> const bloque = view.lineBlockAt(pos);
> // Offset del inicio del documento dentro del contenido del scroller (el
> // padding del editor), deducido de lo medido en vez de fijarlo a mano.
> const origen = view.documentTop - sc.getBoundingClientRect().top + sc.scrollTop;
> sc.scrollTop = origen + bloque.top - (sc.clientHeight - bloque.height) / 2;
> ```
>
> En el **frame siguiente**, para no pelear con el desplazamiento que la operación anterior
> dejó pendiente.

> [!warning] Medí antes del segundo intento, no del cuarto
> Este defecto costó **tres arreglos equivocados**, todos partiendo de suponer la causa a
> partir del síntoma: la barra tapando, los `estimatedHeight` de los widgets, el contenedor
> desplazándose solo. Los tres eran plausibles y los tres falsos. Dos diagnósticos —una ronda
> cada uno, escribiendo en la consola dónde cree CM que está la posición y dónde está de
> verdad— dieron la respuesta.
>
> El editor es el peor sitio para razonar por analogía: hay tres sistemas de coordenadas
> (height-map, DOM y viewport) y el síntoma no distingue cuál falló. **Un arreglo que no
> cambia nada no es mala suerte: es la señal de que la causa está en otro lado.**

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

## El árbol de sintaxis llega **incompleto**, y nadie te avisa

**Caso**: `DEF-062` (los `#` de un título a la vista), `DEF-064` (una tabla en markdown
pelado) y `DEF-074` (`_texto_` sin su color). Tres síntomas distintos, **un solo
defecto**, abierto meses porque cada uno parecía cosa suya.

CodeMirror **no parsea el documento entero al abrirlo**. Gasta unos 20 ms al aplicar el
estado, prioriza el viewport y sigue en segundo plano dentro de `requestIdleCallback`.
Medido con la configuración real del editor (`markdown({ extensions: GFM })`), al crear
el `EditorState`:

| Documento | Árbol parseado | Títulos vistos | Tablas vistas |
|---|---|---|---|
| 2 KB | **13 %** | 3 de 20 | 2 de 20 |
| 6 KB | 49 % | 30 de 60 | 29 de 60 |
| 15 KB | 20 % | 30 de 150 | 29 de 150 |
| 40 KB | **7 %** | 30 de 400 | 29 de 400 |

El tope es el mismo en los tres últimos —unos **3000 caracteres**— porque es lo que
entra en el presupuesto inicial. Una nota de 2 KB ya nace con el 87 % sin parsear: no
hace falta un documento grande para verlo.

**Lo que faltaba**: cuando el parser avanza, despacha una transacción con el efecto
`Language.setState` (`@codemirror/language`, `ParseWorker.work`). Esa transacción **no
cambia el documento, ni la selección, ni el viewport**, y esas tres eran las únicas
condiciones que disparaban el recálculo de las decoraciones. Así que lo que nació crudo
**se quedaba crudo para siempre**: no había nada que lo volviera a intentar.

De ahí los rodeos que el usuario había aprendido solo —teclear, cambiar de vista y
volver, apagar y encender el renderizado de tablas—: los tres son, sin saberlo, formas
de provocar la transacción que faltaba.

> [!tip] Principio
> **Toda decoración que lea `syntaxTree` debe recalcularse cuando el árbol cambia.**
> La comprobación es por identidad —el árbol es inmutable— y es la que hace el propio
> CodeMirror en `TreeHighlighter.update`: `tree != this.tree`.
>
> ```ts
> const arbolCambio = (tr: Transaction) =>
>   syntaxTree(tr.startState) !== syntaxTree(tr.state);   // StateField
>
> syntaxTree(update.startState) !== syntaxTree(update.state)  // ViewPlugin
> ```

> [!warning] La pista estaba en la asimetría, y se leyó al revés
> El reporte de `DEF-074` decía que `*cursiva*` se veía bien y `_cursiva_` no. Eso
> parecía apuntar a un fallo del propio código del `_`, y por eso se registró aparte
> de `DEF-062` y `DEF-064`. Era exactamente lo contrario: **la asimetría es la firma de
> esta causa**. La cursiva la pone el resaltador de CodeMirror, que **sí** se recupera
> solo; el color propio del `_` lo ponía el live preview, que **no**. Lo mismo con los
> títulos: el tamaño venía del resaltador, y lo que faltaba —los `#` ocultos, la clase
> `mic-live-h*`— era lo nuestro.
>
> **Cuando parte de un renderizado aparece y parte no, sospechá de quién recalcula y
> quién no, antes que del código de lo que falta.**

Un `StateField` que detecta su bloque **leyendo líneas** en vez del árbol no necesita
nada de esto: `frontmatterField` busca el `---` de la primera línea y quedó intacto.

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
- [[bugs-progreso]] — trazabilidad de `DEF-021`, `DEF-022`, `DEF-026`, `DEF-031/037`,
  `DEF-062/064/074`.
