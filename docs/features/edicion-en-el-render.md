# Editar en el render: propiedades y tablas (`FUN-M-19` · `FUN-L-19`)

Que el bloque de propiedades y las tablas **sigan renderizados con el cursor dentro**, y que
se puedan editar ahí mismo —incluida la estructura: agregar y quitar campos, filas y
columnas— sin pasar por la vista en crudo.

> [!info] Estado
> Especificada el 2026-08-15. Se entrega en dos partes: primero las propiedades
> (`FUN-M-19`), después las tablas (`FUN-L-19`). Aplica a **ambas** versiones: es frontend
> puro y el comportamiento es idéntico.
>
> - **Parte 1 (propiedades, `FUN-M-19`): confirmada en la app** por el usuario el 2026-08-16.
>   Reflejo a `web-cloud` pendiente.
> - **Parte 2 (tablas, `FUN-L-19`): implementada en `desktop-tauri`** el 2026-08-16,
>   **sin confirmar en la app**. `scripts/test-tablas.mjs` (30 tests), `tsc` y `next build`
>   en verde; el comportamiento lo confirma el usuario con la lista del § 7. Reflejo a
>   `web-cloud` pendiente.
>
> Las dos salen juntas en la **[[Version 1.6.2]]**, y como **patch**: el usuario las
> clasificó como ajuste de algo que ya existía, no como funcionalidad nueva.

---

## 1. El criterio que se revisa

Al principio se decidió que un bloque renderizado **se abriera en crudo al entrar el
cursor**. Era la regla general de la vista en vivo y funcionaba: un mismo mecanismo servía
para ver el resultado y para editar la fuente, sin inventar interfaz nueva.

Lo que cambió desde entonces:

- **Existe la vista raw** del archivo entero. Ver el markdown ya no depende de que el editor
  se abra solo; hay una vista dedicada a eso.
- **Las propiedades tienen tipos** (`FUN-M-04`): una casilla, una fecha, una lista. Verlas
  como texto YAML mientras se las edita es peor que verlas como lo que son.
- **Se usa a diario.** Escribir en una tabla de seis columnas significa hoy que la tabla
  desaparece justo cuando hay que mirarla, y reaparece cuando ya no hace falta.

> [!important] No se elimina el "ver la fuente": se le cambia el **grano**
> Hoy el cursor abre **todo el bloque**. Después de esto, abre **solo la celda o el valor**
> donde está. Es el mismo principio que ya rige para lo inline —negrita, enlaces y wikilinks
> muestran su fuente cuando el cursor está en su línea— aplicado a un grano más fino. No es
> una excepción al modelo de la vista en vivo: es el modelo, mejor afinado.

---

## 2. La decisión que se invierte, y cómo se acota

`FUN-M-04` dejó el widget de propiedades **de solo lectura a propósito**, y el motivo está
escrito en [[metadata-yaml]] § y en [[CodeMirror y la vista en vivo]]: *los widgets
interactivos dentro de CodeMirror son de donde salieron `DEF-031` y `DEF-037`*.

Conviene ser exacto sobre qué causó aquello, porque la conclusión que se sacó es más amplia
que la causa. La raíz de `DEF-031`/`DEF-037` **no fue la interactividad**: fue que el widget
de tabla espaciaba con `margin`, que `offsetHeight` no mide, así que el height-map de
CodeMirror quedaba más corto que el layout real y el mapeo posición ↔ coordenada se corría.
Se corrigió pasando a `padding`. Lo de "solo lectura" fue una precaución razonable con el
susto todavía fresco, no la corrección del defecto.

Eso no la vuelve gratis. Lo que sí es cierto y sigue vigente:

| Riesgo | Cómo se acota |
|---|---|
| El height-map se desincroniza | Espaciado con `padding`, nunca `margin`; `estimatedHeight` declarado y **recalculado** al cambiar filas |
| El widget se reconstruye al escribir y se pierde el foco | `updateDOM()` obligatorio: parchea en sitio y devuelve `true`. Reconstruir en cada tecla es un defecto, no un detalle |
| Los eventos se los queda CodeMirror | `ignoreEvent()` pasa a devolver `true` para lo que nace en los controles (hoy devuelve `false` a propósito, para que el clic coloque el cursor) |
| Un cambio del widget rompe el deshacer | Los `dispatch` tocan **el rango mínimo**, con `userEvent` propio, para que Ctrl+Z revierta la operación y no el documento |
| El bloque cambia de alto al interactuar | `view.requestMeasure()` en cada cambio de alto: pasa fuera del ciclo de actualización de CodeMirror y su height-map no se entera solo *(agregada al implementar `FUN-M-19`)* |
| El cursor entra en un bloque que ya no se abre | El rango va a `EditorView.atomicRanges`: si no, el clic en un hueco deja el cursor dentro del texto invisible y la tecla siguiente lo corrompe a ciegas *(agregada al implementar `FUN-M-19`)* |

> [!warning] La regla del `margin` no se toca
> Sigue valiendo para todo widget de bloque, y es la única de las cuatro que ya costó cara.

---

## 3. Comportamiento compartido

Vale para los dos bloques.

1. **El render no desaparece.** Ni al entrar el cursor, ni al escribir, ni al seleccionar.
2. **Se edita en el grano fino.** Al poner el cursor en una celda o en el valor de una
   propiedad, **solo eso** pasa a texto editable; el resto del bloque sigue renderizado.
3. **Al salir, se confirma.** `Enter` o quitar el foco escriben el cambio en el documento.
   `Escape` descarta y vuelve al valor anterior.
4. **Editar como texto.** Cada bloque tiene un control que revela su markdown crudo —el
   comportamiento de hoy— hasta que el cursor sale del bloque. Es la salida para lo que los
   controles no cubren: una tabla mal formada, un pegado raro, un YAML que Mycelium no
   interpreta.
5. **Lo que Mycelium no entiende no se toca.** Un frontmatter no soportado o una tabla que
   el parser no reconoce se muestran en crudo y sin controles, con el motivo a la vista. La
   guarda ya existe en `lib/frontmatter.ts` (`guardaEdicion`) y **lanza**: no alcanza con
   esconder el botón.
6. **Teclado.** `Tab` / `Shift+Tab` mueven a la celda o al campo siguiente y anterior;
   `Enter` confirma; `Escape` sale al editor. Nada exige el ratón.
7. **El documento manda.** El widget nunca guarda estado propio que no esté en el texto: si
   el archivo cambia desde fuera, el render se rehace desde el documento.

---

## 4. Parte 1 — Propiedades (`FUN-M-19` · `EDITOR-PROPIEDADES-EN-SITIO`)

Es la mitad barata: **el motor ya existe** y la interfaz también, en otra parte.

- `lib/frontmatter.ts` ya tiene `ponerPropiedad`, `quitarPropiedad` y `renombrarPropiedad`,
  puras y con tests (`scripts/test-frontmatter.mjs`).
- La pestaña **PROPIEDADES** (`components/editor/PropiedadesTab.tsx`) ya resuelve la UI por
  tipo: casilla, fecha, número, lista, texto.

Lo que falta es llevar eso al widget del editor.

### Qué se puede hacer en el bloque

| Operación | Cómo |
|---|---|
| Cambiar un valor | Clic en el valor → editor del tipo (casilla, fecha, texto, ítems de lista) |
| Renombrar una clave | Clic en la clave |
| **Agregar** una propiedad | Botón «+ Agregar propiedad» al pie del bloque |
| **Quitar** una propiedad | Menú de la fila |
| Nota sin frontmatter | El bloque no existe: el botón de agregar vive en la barra de la nota, y crear la primera propiedad **crea el bloque** (`ponerPropiedad` ya lo hace) |

### La única decisión nueva

`ponerPropiedad` y compañía reciben y devuelven **el documento entero**. Despachar eso como
un cambio de todo el documento arruinaría el deshacer y el cursor. Como solo cambian líneas
del frontmatter, el `dispatch` reemplaza **el rango del bloque** (de la posición 0 a
`cuerpoDesde`) con el bloque nuevo. Contenido, mínimo y sin tocar el cuerpo de la nota.

### Cómo quedó implementado (2026-08-16)

| Pieza | Dónde |
|---|---|
| DOM de la tarjeta editable, con sus controles y el parcheo en sitio | `lib/editor/propiedadesWidget.ts` (nuevo) |
| Widget de bloque: `toDOM`, `updateDOM`, `ignoreEvent`, `estimatedHeight`, y el estado «ver como texto» | `lib/editor/livePreview.ts` |
| `dispatch` al rango del bloque + crear el bloque desde la barra | `aplicarEdicionFrontmatter` y `insertarBloquePropiedades`, en `lib/editor/commands.ts` |
| Metadatos de tipo compartidos con el panel (`TIPOS_PROPIEDAD`, `NOMBRE_TIPO`, `valorInicialDe`, `valorComoTexto`) | `lib/frontmatter.ts` (siguen puros y con tests) |
| El valor renderizado, el mismo que la vista de lectura | `valorPropiedadHtml` e `ICONO_TIPO`, exportados de `lib/markdown.ts` |

Decisiones que la spec dejaba abiertas y se resolvieron al implementar:

- **El valor se ve renderizado y pasa a `<input>` al recibir el foco**, no antes. Es el
  "grano fino" del § 3.2: los wikilinks y las etiquetas de una propiedad se siguen viendo
  como tales mientras no se las edita. Las **casillas** y las **listas** son la excepción
  razonable: su control ya es su propio render, así que están siempre vivos (la casilla se
  marca de un clic; las listas son pastillas con `×` y un `+`, igual que el panel).
- **La clave es siempre un `<input>` plano** (como en la pestaña PROPIEDADES): no hay nada
  que renderizar en un nombre, y así se ve dónde se puede escribir.
- **`ignoreEvent()` distingue**: `true` para lo que nace en un control (`input`, `select`,
  `button`, el valor enfocable), `false` para el resto de la tarjeta, donde el clic sigue
  siendo de CodeMirror. Devolver `true` a todo dejaría el bloque sin forma de recibir el
  cursor.
- **Cada cambio de alto pide medida** (`view.requestMeasure()`). Abrir el editor de un valor
  cambia la altura del bloque FUERA del ciclo de actualización de CodeMirror: sin eso, su
  height-map se queda con el alto viejo, que es el desfase de `DEF-031`/`DEF-037` por otra
  puerta. No estaba en la spec y es la quinta regla de la tabla del § 2.
- **El bloque pasa a ser un átomo** (`EditorView.atomicRanges`). Es una regla nueva que la
  spec no tenía y que **solo aparece al dejar de abrir el bloque en crudo**: si el cursor
  puede entrar en un rango reemplazado que nunca se revela, un clic en un hueco de la
  tarjeta lo deja dentro del YAML invisible y la tecla siguiente lo corrompe a ciegas. Con
  el rango declarado atómico, el clic y las flechas caen en sus bordes. Mientras se edita
  como texto no hay decoración y por tanto tampoco átomo. Lo mismo va a hacer falta en
  `FUN-L-19`.
- **`userEvent: "input.propiedad"`**: `history` solo agrupa `input.type` y `delete`, así que
  cada operación es un paso de deshacer entero; y como empieza por `input.`, el editor la
  sigue tratando como edición del usuario (marca la nota sucia, fija la pestaña).
- **Nota sin frontmatter**: el botón de la barra («Propiedades de la nota») crea el bloque
  **vacío** —que es frontmatter válido— y enfoca el campo de la tarjeta. Así la primera
  propiedad se agrega en el mismo sitio que todas las demás, en vez de tener dos flujos.

---

## 5. Parte 2 — Tablas (`FUN-L-19` · `EDITOR-TABLAS-EN-SITIO`)

Acá no hay motor: hay que escribirlo.

### `lib/tablas.ts` — módulo **puro y sin imports**

Mismo patrón que `lib/frontmatter.ts`, `lib/bases.ts`, `lib/canvas.ts` y `lib/enlaces.ts`:
sin imports, para poder testearlo headless transpilándolo (`scripts/test-tablas.mjs`).

```ts
type Alineacion = "izquierda" | "centro" | "derecha" | "sin";
type Tabla = { encabezado: string[]; alineaciones: Alineacion[]; filas: string[][] };

parsear(md: string): Tabla | null          // null = no es una tabla que sepamos reescribir
serializar(t: Tabla): string
insertarFila(t, indice): Tabla             // indice = posición final de la fila nueva
eliminarFila(t, indice): Tabla
moverFila(t, desde, hasta): Tabla
insertarColumna(t, indice): Tabla
eliminarColumna(t, indice): Tabla
moverColumna(t, desde, hasta): Tabla
alinear(t, columna, a: Alineacion): Tabla
ponerCelda(t, fila, columna, texto): Tabla
```

Reglas que el módulo debe respetar, y que son la mitad del trabajo:

- **Las celdas guardan markdown**, no texto plano: `**negrita**`, `[[wikilinks]]`, `` `código` ``.
- **`|` dentro de una celda va escapado** (`\|`). Partir por `|` a lo bruto rompe cualquier
  tabla que contenga un enlace con pipe o un alias de wikilink — y ahí está `DEF-045`.
- **Filas irregulares**: una fila con menos celdas que el encabezado se completa; con más,
  las de sobra no se tiran en silencio (se conservan o se rechaza la tabla, pero no se
  pierde texto del usuario).
- **Se preserva el fin de línea** del documento (CRLF/LF), como en `frontmatter.ts`.
- **Idempotencia**: `serializar(parsear(md))` sobre una tabla ya normalizada no cambia nada.
- La tabla se **realinea** al serializar (columnas parejas). Es lo que hace legible el crudo,
  y ya no hay que escribirlo a mano.

### Qué se puede hacer en el bloque

| Operación | Gesto |
|---|---|
| Escribir en una celda | Clic → esa celda pasa a texto editable |
| Insertar fila / columna | Tirador al borde de la fila o la columna, antes o después |
| Eliminar fila / columna | Menú del tirador |
| Mover fila / columna | Menú del tirador (o arrastrar el tirador, si sale barato) |
| Alinear una columna | Menú del tirador de la columna: izquierda · centro · derecha · sin |

Los tiradores aparecen **al pasar el puntero o al enfocar** una fila o columna; no están
siempre a la vista. Con teclado se llega por el menú contextual de la celda.

### El ajuste `liveTables`

Existe un ajuste que **desactiva** el render de tablas en la vista en vivo
(`useUiStore.liveTables`). Se conserva tal cual: con él apagado no hay widget, no hay
controles y se escribe markdown a mano, que es exactamente lo que quiere quien lo apaga.

### Cómo quedó implementado (2026-08-16)

| Pieza | Dónde |
|---|---|
| Motor puro: `parsear`/`serializar` y las nueve operaciones | `lib/tablas.ts` (nuevo) + `scripts/test-tablas.mjs` (30 tests) |
| DOM de la tabla editable, sus tiradores y el parcheo en sitio | `lib/editor/tablaWidget.ts` (nuevo) |
| Widget de bloque: `toDOM`, `updateDOM`, `ignoreEvent`, `estimatedHeight`, `destroy`, el estado «ver como texto» y el átomo | `lib/editor/livePreview.ts` |
| `dispatch` al rango de la tabla con `userEvent: "input.tabla"` | `aplicarEdicionTabla`, en `lib/editor/commands.ts` |
| El markdown de una celda renderizado como en la vista de lectura | `renderMarkdownEnLinea`, exportado de `lib/markdown.ts` |
| Estilos (todo `padding`, nunca `margin`) | `styles/editor.css`, al final del archivo |

Decisiones que la spec dejaba abiertas y se resolvieron al implementar:

- **La `Tabla` lleva su `eol` y su `sangria`.** La firma de arriba no los tenía, pero
  preservar el CRLF y el `> ` de una cita exige que viajen con la estructura: si no,
  `serializar` tendría que adivinarlos. Con eso, una tabla **dentro de un callout o una
  cita sí tiene controles**: cada línea se reescribe con su prefijo intacto, y el widget la
  dibuja dentro de su cita. Si el prefijo **no es idéntico** en todas las líneas, `parsear`
  devuelve `null` y la tabla queda como hasta ahora (renderizada y sin controles).
- **En la estructura el `|` va SIN escapar; el escape es cosa de `serializar`.** Así una
  celda contiene `[[destino|alias]]` de verdad —que es lo que quieren el render y el
  grafo— y el `\|` existe solo en el documento.
- **Una fila con celdas de más ENSANCHA la tabla** (columnas nuevas vacías) en vez de que
  se descarten. Es visible y reversible; perder texto no lo es.
- **Se elimina la última fila, pero no la última columna.** Sin filas de datos sigue
  habiendo tabla; sin columnas, no. Borrar el bloque entero es trabajo del editor.
- **`ponerCelda(t, -1, columna, texto)` escribe el encabezado**: la estructura lo guarda
  aparte de las filas, así que el índice negativo es lo que lo nombra.
- **Los tiradores no cambian el alto al aparecer.** Ocupan su lugar siempre
  (`visibility`) y el menú es absoluto: si el hover empujara el layout habría que medir en
  cada `mouseover`, que es la quinta regla por la puerta de atrás.
- **Teclado**: `Tab`/`Shift+Tab` recorren las celdas (del encabezado hacia abajo) y tras la
  última llevan al pie; `Enter` confirma; `Escape` descarta y devuelve el foco al editor;
  **`Alt+Enter` abre el menú de la fila y `Alt+Shift+Enter` el de la columna**, que es la
  entrada por teclado a los tiradores. Dentro del menú, `Tab` recorre y `Escape` vuelve a
  la celda.
- **Una tabla que se está TECLEANDO se queda en crudo hasta que el cursor sale.** No es una
  excepción al § 3.1: ahí el cursor ya estaba en el texto, no entró a un render. Sin esto,
  al terminar de escribir la fila de guiones el bloque se volvería widget con el cursor
  adentro y —como el rango es atómico— la tecla siguiente caería fuera de la tabla. Solo
  cuenta lo que teclea el usuario: las ediciones del widget (`input.tabla`) y el deshacer
  quedan afuera.
- **La posición de la tabla se resuelve en cada operación** (`view.posAtDOM` + los rangos
  del `StateField`), nunca se guarda en el widget: mientras la tabla no cambie, CodeMirror
  reusa el mismo widget aunque el texto de más arriba se mueva.

### El menú de los tiradores, corregido al probarlo (2026-08-16)

Dos defectos que el usuario encontró en la primera prueba. Sin `DEF-*`, porque la
funcionalidad todavía no estaba consolidada (ver [[Bugs_errores_y_defectos]]).

1. **El menú cerrado seguía dibujándose vacío** sobre la tabla: el borde, el fondo y el
   padding, sin ítems. Se ocultaba con el atributo `hidden`, que es solo un `display: none`
   de la hoja del navegador — y **cualquier `display` de autor le gana**. Con el
   `display: flex` de la caja, `hidden` no hacía nada. Se agrega `.mic-tab-menu[hidden]`.
2. **El menú quedaba recortado.** Era `position: absolute` dentro de `.mic-tab-caja`, que
   lleva `overflow-x: auto` para las tablas anchas, así que se veía a medias y con el scroll
   de la tabla en vez de flotar por encima. Pasa a `position: fixed` —escapa del recorte
   porque ningún ancestro tiene `transform`— con el mismo `z-index` y el mismo acotado a la
   ventana que `ContextMenu` y `GraphOptionsMenu` (`DEF-047`/`DEF-053`): si no entra abajo se
   abre hacia arriba, y si es más alto que la ventana **se desplaza él**, no la tabla.

> [!tip] Un menú fijo no acompaña al scroll
> Por eso desplazar **cierra** el menú, como en los otros dos. Y enfocar el primer ítem usa
> `focus({ preventScroll: true })`: sin eso el propio foco desplaza el contenedor y el menú
> se cerraría solo al abrirse.

---

## 6. Casos borde

- Tabla **dentro de un callout** o de una cita: hoy se renderiza; los controles no deben
  romper la indentación de los `>` al reescribir. *(Resuelto: la `sangria` viaja con la
  estructura y se reescribe igual; si el prefijo varía entre líneas, no hay controles.)*
- Tabla con una sola columna, o sin filas de datos.
- Celda vacía, y celda que solo tiene espacios.
- Eliminar **la última** fila o la última columna: la tabla no puede quedar inválida.
- Frontmatter **vacío** (`---` / `---`): es válido y hay que poder agregarle la primera
  propiedad.
- `tags`: tiene comportamiento propio en `frontmatter.ts` (siempre lista). El widget lo
  respeta, no lo reimplementa.
- Dos vistas de la **misma nota** abiertas en paralelo: editar en una tiene que reflejarse en
  la otra, porque las dos leen el mismo documento.
- Deshacer (`Ctrl+Z`) después de «eliminar columna» devuelve la columna, no medio documento.

---

## 7. Verificación

- `node scripts/test-tablas.mjs` (parte 2) y `scripts/test-frontmatter.mjs` (sin regresiones)
  · `npx tsc --noEmit -p tsconfig.json`.

> [!warning] Lo que falta probar de la parte 2, en la app
> `scripts/test-tablas.mjs` prueba el motor, no la interfaz. De la lista de abajo, a las
> tablas les tocan **todos** los puntos — y además: una tabla **dentro de un callout**
> (los `>` tienen que quedar intactos), una tabla **mal formada** (tiene que verse
> renderizada, sin controles y con el motivo), **escribir una tabla nueva a mano** (se
> queda en crudo hasta que el cursor sale), el ajuste **`liveTables` apagado** (ni widget
> ni controles) y la **misma nota en dos paneles** a la vez.

> [!warning] Lo que falta probar de la parte 1, en la app
> `tsc` verde y 41 tests en verde **no** prueban comportamiento. De la lista de abajo, a las
> propiedades les tocan los puntos 1, 2, 3 (agregar y quitar), 4, 6 y 7 — y además:
> frontmatter **vacío** (`---`/`---`) y nota **sin** frontmatter (botón «Propiedades de la
> nota» en la barra), un frontmatter **no soportado** (tiene que verse crudo, sin controles,
> con el motivo), `tags`, y la **misma nota en dos paneles** a la vez.
- Casos que el test del módulo debe cubrir: `|` escapado · celdas con wikilinks y con alias ·
  filas irregulares · CRLF · idempotencia · eliminar la última fila/columna · alineaciones.
- **A mano, que es donde esto se prueba de verdad** — y todo con el bloque **renderizado**:
  1. Poner el cursor en una tabla y en el bloque de propiedades: no desaparecen.
  2. Escribir en una celda y en un valor; confirmar con `Enter` y con el foco; descartar con
     `Escape`.
  3. Insertar, eliminar, mover y alinear; agregar y quitar una propiedad.
  4. `Ctrl+Z` después de cada operación de estructura.
  5. Recorrer una tabla entera con `Tab` sin tocar el ratón.
  6. «Editar como texto» y volver.
  7. Una nota larga con varias tablas: bajar hasta el final y comprobar que el clic cae donde
     se hace y que el gutter de plegado sigue alineado — es el síntoma de `DEF-031`/`DEF-037`
     y el que hay que vigilar.

## Relacionadas

- [[BACKLOG]] — `FUN-M-19` y `FUN-L-19`.
- [[metadata-yaml]] — `FUN-M-04`, el motor de propiedades y el widget que acá deja de ser de
  solo lectura.
- [[CodeMirror y la vista en vivo]] — el height-map, la regla del `padding` y el checklist de
  widgets de bloque, que esta funcionalidad amplía.
- [[Bugs_errores_y_defectos]] — `DEF-031` y `DEF-037`, el antecedente; `DEF-045`, que es
  exactamente el problema del `|` dentro de una celda.
- [[Mapa de documentacion]] — índice general.
