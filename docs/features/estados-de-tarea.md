# Estados de tarea y color del título de callout (`FUN-S-01` + `FUN-S-06`)

Bloque **E · Estilos propios al renderizar markdown** del [[BACKLOG]]: las dos responden a
la misma pregunta —cuándo un elemento conserva su estilo propio y cuándo gana el del
contenedor— y tocan los mismos archivos (`lib/markdown.ts`, `lib/editor/livePreview.ts`,
`styles/editor.css`). El minor de `FUN-S-01` absorbe la corrección de `FUN-S-06`.

Decisiones del usuario del **2026-10-04**. **Implementado en desktop** el mismo día (rama
`feat/estados-de-tarea-desktop`), **sin confirmar en la app**. Sin reflejar a web.

---

## Parte 1 · Estados de tarea (`FUN-S-01` · `EDITOR-CHECKBOX-ESTILOS`)

### 1.1 Qué hace (comportamiento compartido)

El carácter dentro de `[ ]` de una lista de tareas es su **estado**, con los símbolos de
los temas de Obsidian: el vault sigue siendo intercambiable.

| Símbolo | Estado | Casilla | Texto del ítem |
|---|---|---|---|
| `[ ]` | Pendiente | vacía, borde gris | — |
| `[x]` / `[X]` | Hecha | llena (acento) con check | apagado (gris), **sin tachar** — decisión del usuario del 2026-10-04 |
| `[-]` | Cancelada | borde gris con una cruz | tachado y **más** atenuado |
| `[/]` | En curso | medio llena (acento) | — |
| `[>]` | Pospuesta | flecha en un círculo | — |
| `[*]` | Destacada | estrella | — |
| `[!]` | Importante | signo de exclamación en un círculo | — |
| `[?]` | Pregunta | signo de pregunta en un círculo | — |
| `[+]` | Agregada | llena (verde) con check | — |
| cualquier otro | se ve como **hecha** | | apagado, sin tachar |

Ese es también el orden del menú. Un símbolo es **un** carácter cualquiera salvo `[`, `]`,
`\` y tabulador; tiene que ir seguido de espacio o tabulador (como en GFM). `- []`,
`- [xx]` o un `[x]` fuera de una lista no son tareas.

**Alcance del estilo.** Solo hecha y cancelada cambian el texto, y solo el **propio** del
ítem: las subtareas llevan su estado. Lo que trae color propio dentro del texto (un enlace,
un `_énfasis_`) conserva su color: en hecha se apaga igual (opacidad) y en cancelada queda tachado. El resto de los estados cambian solo la
casilla.

**Colores.** Tokens nuevos `--mic-tarea-*` en `tokens.css`, que salen de los colores de
callout mezclados con la tinta según `--mic-callout-tinta` —el mismo criterio que el título
de un callout—: casi puros en oscuro, oscurecidos en claro para pasar 3:1 sobre el lienzo.
Hecha y en curso usan el acento; cancelada, el gris del texto atenuado. Ver
[[DESIGN_SYSTEM]].

**Interacción.**

- **Clic** en la casilla: pendiente → hecha; **cualquier otro estado → pendiente**. Es lo
  que hace Obsidian (todo lo que no es un espacio cuenta como marcado, y desmarcar escribe
  un espacio). Para llegar a los demás está el menú.
- **Clic derecho** en la casilla: menú con los nueve estados, cada uno con su ícono —la
  misma casilla, dibujada por las mismas reglas— y su nombre; el vigente marcado
  (`menuitemradio` con `aria-checked`). Es el `ContextMenu` de la app, con flechas, Inicio,
  Fin, Enter y Escape.
- **Teclado**: en lectura la casilla es un `<input>` enfocable; <kbd>Espacio</kbd> alterna
  y la tecla de menú (o <kbd>Shift</kbd>+<kbd>F10</kbd>) abre el menú junto a la casilla.
  En vivo la casilla no recibe el foco —es un widget dentro de un `contenteditable`—: con el
  cursor en la línea el marcador se ve en crudo y el símbolo se edita a mano.

**Dónde se ve.** En vivo, en lectura y dividido, en la barra lateral y el panel vinculado
(mismo HTML que lectura, sin clic) y en la **exportación a PDF**, que imprime ese HTML con
todo el CSS de la ventana y `print-color-adjust: exact`, así que salen los fondos y los
íconos. Dentro de citas y callouts también. Las tablas no aplican: GFM no admite listas en
una celda.

**Compatibilidad con snippets de Obsidian.** El `<li>` y la casilla llevan `data-task="<símbolo>"`
y el `<li>` marcado la clase `is-checked`, como en Obsidian: un snippet escrito para sus
temas (`input[data-task="-"]`, `li[data-task="?"]`) se aplica igual. El estilo propio usa
`data-estado="<id>"`.

### 1.2 Criterios de aceptación

1. Cada símbolo de la tabla se ve con su casilla en vivo y en lectura, igual en las dos, en
   claro y en oscuro.
2. `- [x] madre` con `- [ ] hija` debajo: la madre apagada, la hija no.
3. Clic en `[ ]` → `[x]`; clic en `[x]`, `[-]`, `[?]`… → `[ ]`. En vivo el clic no lleva el
   cursor a la línea.
4. Clic derecho → menú; elegir un estado reescribe **solo** ese carácter del documento.
5. Una tarea dentro de `> ` o de un callout se alterna desde lectura (antes no: ver 1.4).
6. El PDF muestra los íconos.
7. Las dos vistas reconocen exactamente las mismas tareas (test).

### 1.3 Diseño

| Pieza | Archivo |
|---|---|
| Lógica pura: símbolos, estados, clic, estilo del texto, cambio en el texto | `lib/estadosTarea.ts` |
| Parser de la vista en vivo: `TaskList` de `@lezer/markdown` con la condición de arriba (`GFM_MYCELIUM`) y `cambiarSimboloTarea` | `lib/editor/tareas.ts` |
| Casilla interactiva y tachado del texto en vivo | `lib/editor/livePreview.ts` (`CheckboxWidget`, caso `TaskMarker`) |
| Tarea en lectura (plugin remark) y casilla + texto envuelto (plugin rehype) | `lib/markdown.ts` (`remarkEstadosTarea`, `rehypeTaskCheckbox`) |
| Clic y menú en lectura | `components/editor/NoteEditor.tsx` (`casillaDeTarea`) |
| Menú de estados | `components/editor/MenuEstadosTarea.tsx`, sobre `MenuFlotante.tsx` (ex `MenuOrtografia.tsx`) y `ContextMenu` (`icono`, `marcado`) |
| Dibujo de la casilla y del texto | `styles/editor.css` § Estados de tarea; tokens en `styles/tokens.css` |
| Que la IA lo sepa | `lib/ia/framework.ts` (skill `mycelium-vault`, framework **1.8.0**) |
| Test | `scripts/test-estados-tarea.mjs` |

Decisiones que no salen del código a simple vista:

- **Ningún parser reconocía los estados.** `@lezer/markdown` (`/^\[[ xX]\][ \t]/`) y
  `remark-gfm` solo aceptan espacio y `x`: `- [-] algo` llegaba a las dos vistas como texto.
  En vivo se reemplaza el `TaskList` de `GFM` por uno igual con otra condición (mismos nodos
  `Task`/`TaskMarker`). En lectura, un plugin remark convierte el ítem en tarea: recorta el
  marcador del primer texto del párrafo y, si el parser lo partió (el `*` de `[*] algo*`
  puede abrir un énfasis), vuelve a parsear el párrafo sin él. **Los dos usan la misma
  expresión** (`MARCADOR_TAREA_RE`); el test lo verifica sobre un documento con citas,
  callouts, numeradas, subtareas, código y casos que no son tarea.
- **La casilla de lectura escribe por posición, no por orden.** Antes `data-task` era un
  índice y el editor contaba tareas con una regex de línea (`^\s*[-*+]…\[[ xX]\]`), que no
  veía las de dentro de una cita o un callout: desde la primera de esas, el clic alternaba
  **otra** tarea. Ahora cada casilla lleva `data-task-pos`, la posición de su `[` en el
  documento (con el desplazamiento del frontmatter, como `data-linea` de `DEF-055`, y con
  los saltos normalizados a `\n` como los cuenta CodeMirror). Antes de escribir se comprueba
  que ahí siga habiendo un marcador: si el documento cambió y el preview todavía no, no se
  toca nada.
- **El tachado va en un `span`, no en el `<li>`.** `text-decoration` se propaga a los
  descendientes y no se puede anular desde ellos: en el `<li>` tacharía las subtareas. El
  plugin rehype envuelve el texto propio del ítem en `span.mic-tarea-texto`; en vivo la
  marca cubre solo el nodo `Task`, que no incluye las sublistas.
- **Una sola definición del dibujo para tres sitios.** La casilla de vivo
  (`span.mic-live-check`), la de lectura (`input.mic-task-check`) y el ícono del menú
  (`span.mic-tarea-icono`) comparten reglas por `data-estado`, con `:is(...)` para que la
  especificidad no dependa de cuál de las tres es. Los íconos son máscaras SVG en `data:`
  —como los de los callouts—, sin fuentes externas.
- **La casilla en vivo es interactiva.** Antes era `pointer-events: none` y el clic solo
  abría la línea en crudo. Ahora `ignoreEvent()` devuelve `true` (CodeMirror no procesa sus
  eventos), `mousedown` hace `preventDefault` (el cursor no entra a la línea, que haría
  desaparecer la casilla bajo el puntero) y la posición se pide al DOM en el momento
  (`posAtDOM`).

### 1.4 Notas por versión

- **Desktop** — lo de arriba.
- **Web** — misma spec. Todo es frontend; no hay datos ni backend involucrados. Ver
  «Reflejar a web» abajo.

### 1.5 Reflejar a web

Medido con `git diff desktop-tauri web-cloud --stat -- <archivo>` el 2026-10-04 (antes de
esta rama):

| Archivo | Estado entre ramas | Cómo traerlo |
|---|---|---|
| `lib/estadosTarea.ts`, `lib/editor/tareas.ts`, `components/editor/MenuEstadosTarea.tsx`, `scripts/test-estados-tarea.mjs` | nuevos | enteros |
| `components/editor/MenuFlotante.tsx` (renombrado), `lib/editor/ortografia.ts`, `components/explorer/ContextMenu.tsx` + `.module.css`, `styles/tokens.css`, `scripts/test-embeds.mjs`, `frontend/.gitignore` | idénticos | enteros (`git checkout desktop-tauri -- …`, y borrar `MenuOrtografia.tsx`) |
| `lib/markdown.ts` | **divergente** (112 líneas: draw.io y otros) | a mano: `remarkEstadosTarea`, `rehypeTaskCheckbox`, `offsetDeCaracteres`, el `.use` y `renderNota` |
| `lib/editor/livePreview.ts` | **divergente** (242) | a mano: `CheckboxWidget`, el caso `TaskMarker`, los imports, y la regla de cita de `FUN-S-06` |
| `styles/editor.css` | **divergente** (104) | a mano: la sección «Estados de tarea» y el bloque del título del callout |
| `components/editor/NoteEditor.tsx` | **divergente** (503) | a mano: `casillaDeTarea` en lugar de `TASK_RE`/`toggleTaskInDoc`, el clic, el menú y `GFM_MYCELIUM` |
| `components/recordatorios/EditorDetalle.tsx` | divergente (1 línea) | a mano: `GFM_MYCELIUM` |
| `lib/ia/framework.ts` | **no aplica**: el framework de IA es solo-desktop | — |

Verificar con `npm ci`, `tsc`, `next build` y `node --test scripts/test-estados-tarea.mjs`.

---

## Parte 2 · Color del título de callout (`FUN-S-06` · `EDITOR-CALLOUT-TITULO-COLOR`)

### 2.1 Qué hace

El título de un callout lleva el color de su tipo **solo en el texto sin color propio**.
Un `[enlace](url)`, un `_énfasis_` o `__fuerte__`, un `[[wikilink]]`, una `#etiqueta` o un
color puesto por un snippet conservan el suyo. La negrita y la cursiva de `**`/`*` no
tienen color propio: llevan el del callout. Solo en vivo; lectura ya se comportaba así y no
se toca.

### 2.2 Qué ve el DOM (la causa)

La línea de la cabecera es `div.cm-line.mic-live-callout-head[data-callout]`, con el color
del tipo. Adentro, el resaltado de sintaxis marca **todo** el contenido de una cita con
`tags.quote` (la regla es `Blockquote/...`, heredable) y le suma la etiqueta del nodo
propio. Medido con `highlightTree` sobre
`> [!question] Título [enlace](https://x.y) **negrita** _énfasis_ __fuerte__ [[Nota]] #tag`:

| Texto | Clases del resaltado (una por regla de `micelioHighlight`) | Marcas propias que lo envuelven |
|---|---|---|
| `Título`, `#tag` (texto) | cita | — (el `#tag` va en `.mic-tag-cm`) |
| `enlace` | cita + **enlace** | `.mic-enlace-externo` (sin color) |
| `negrita` | cita + strong | — |
| `énfasis` | cita + emphasis | `.mic-em-cm-us` |
| `fuerte` | cita + strong | `.mic-strong-cm-us` |
| `Nota` | cita + enlace | `.mic-wikilink-cm` |

Los spans del resaltado van **siempre adentro** de nuestras marcas: el resaltador tiene
`Prec.high`, y en CodeMirror la decoración de más precedencia crea el nodo **interior**.

La regla vieja, `.cm-editor .mic-live-callout-head span { color: inherit }`, ganaba a
todos: al span de cita + enlace (perdía el acento), a la marca `.mic-em-cm-us` (0,2,1 contra
0,2,0) y por herencia a todo lo de adentro.

### 2.3 El arreglo

La regla de cita del resaltado pasa a `color: var(--mic-cita-color, var(--mic-text-muted))`
y la cabecera define `--mic-cita-color: currentColor`, que en `color` equivale a heredar.
Así, sin tocar especificidad:

- texto de cita a secas → hereda el color de la cabecera (y si un snippet cambia ese color,
  lo sigue, como antes);
- cita + enlace → la regla de enlace va **después** en el mismo `HighlightStyle` y gana:
  conserva su color;
- cita dentro de una marca con color (`.mic-em-cm-us`, `.mic-wikilink-cm`, `.mic-tag-cm`) →
  hereda el de la marca.

Fuera de un callout la variable no existe y la cita sigue gris. El cuerpo del callout no
cambia (seguía y sigue en el gris de la cita).

### 2.4 Criterios de aceptación

1. `> [!question] Hay un [[enlace]] y _énfasis_`: el título en violeta, el enlace con su
   color y el énfasis con el suyo, en claro y en oscuro.
2. Un título sin nada adentro se ve como antes.
3. Una cita común (`> texto`) sigue gris.
4. Lectura, igual que antes.

---

## Cómo probarlo en la app

En una nota nueva, en **vivo**, **lectura** y **dividido**, y en **claro y oscuro**:

```markdown
- [ ] pendiente
- [x] hecha con [[un enlace]]
  - [ ] subtarea pendiente (no tachada)
- [-] cancelada
- [/] en curso
- [>] pospuesta
- [*] destacada
- [!] importante
- [?] pregunta
- [+] agregada
- [k] desconocida (se ve como hecha)

> [!note] Callout con tareas
> - [ ] dentro del callout
> - [?] otra

> [!question] Título con [[enlace]], _énfasis_, __fuerte__ y #tag
> Cuerpo.
```

1. Mirar los íconos, el apagado de hecha y desconocida y el tachado de cancelada (la subtarea, ni uno ni otro).
2. Clic en varias casillas, en vivo y en lectura: pendiente ↔ hecha, especial → pendiente;
   en vivo el cursor no entra a la línea.
3. Clic derecho en una casilla: menú con íconos, el vigente marcado; elegir otro estado.
   En lectura, con <kbd>Tab</kbd> hasta la casilla, <kbd>Espacio</kbd> y la tecla de menú.
4. Alternar las tareas **dentro del callout** desde lectura (antes alternaba otra).
5. Exportar a PDF y ver los íconos.
6. El título del último callout: enlace, énfasis, fuerte y tag con su color.

## Relacionadas

- [[BACKLOG]] — `FUN-S-01`, `FUN-S-06`, bloque E.
- [[CodeMirror y la vista en vivo]] — el resaltado va adentro de las marcas.
- [[Aprendizajes tecnicos]] — principio 18.
- [[corrector-ortografico]] — el otro usuario de `MenuFlotante`.
- [[DESIGN_SYSTEM]] — tokens `--mic-tarea-*`.
- [[ia-framework-vault]] — framework de IA 1.8.0.
