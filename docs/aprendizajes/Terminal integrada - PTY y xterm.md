# Terminal integrada — aprendizajes de PTY y xterm

Notas de implementación de la consola integrada que **no** son parte de su
especificación funcional (esa vive en [[terminal-integrada]]). Parte de
[[Aprendizajes tecnicos]].

## La sesión no puede vivir en el componente

Una terminal tiene que sobrevivir a que el usuario **mueva su pestaña de panel**, lo
que en React es un *remount*. Si la instancia de xterm se crea en el componente, cada
movimiento reinicia la sesión.

**Patrón** (el mismo que usa el editor, ver [[CodeMirror y la vista en vivo]]): las
instancias viven en un `Map` **a nivel de módulo** (`lib/terminal.ts`). El componente
solo **adjunta el DOM**:

```ts
if (inst.term.element) cont.appendChild(inst.term.element); // remount
else inst.term.open(cont);                                  // primera vez
```

## Ciclo de vida: pestaña ≠ proceso

Primer diseño (equivocado): cerrar la pestaña mataba el shell. El usuario lo reportó
como confuso — al cerrar y crear otra, la numeración seguía creciendo y no quedaba
claro si algo se había cerrado de verdad.

**Modelo final**: separar las dos cosas.

| Acción | Efecto |
|---|---|
| Cerrar la **pestaña** | Solo la oculta; el shell **sigue corriendo** de fondo |
| **Finalizar** desde el panel de Consolas | Mata el proceso y la quita de la lista |
| `exit` en la shell | El proceso muere → se cierra la pestaña y sale de la lista |

Consecuencia: hace falta un **inventario visible** (el panel de Consolas) o el usuario
pierde de vista las sesiones abiertas.

> [!tip] Principio
> Si un recurso vive más que su vista, tiene que existir un lugar donde **verlo y
> cerrarlo**. Ocultar sin inventario es perder el recurso.

## El tema no sigue las variables CSS

xterm recibe sus colores como **objeto de configuración**, no como CSS: se fijan al
crear la instancia y **no reaccionan** a un cambio de tema de Mycelium.

**Fix**: un `MutationObserver` sobre `data-theme` / `data-dark` en `<html>` (los
atributos que toca el selector de tema) que recalcula los colores desde los tokens y
los reasigna a **todas** las instancias vivas, incluidas las ocultas de fondo.

> [!important] Generalizable
> Cualquier componente que **copie** valores de los tokens CSS a su propia
> configuración (canvas, WebGL, xterm) necesita re-leerlos al cambiar el tema. Fue el
> mismo problema del grafo en `DEF-030`, que se arregló agregando `tema`/`modoOscuro`
> a las dependencias del efecto de simulación.

## El contenedor tiene que estirar al hijo

**Síntoma** (visible en una captura del usuario): una consola anclada en el panel
lateral se veía con **~2 columnas** de ancho, con el texto cayendo en vertical.

**Causa**: el contenedor era `display: flex` (row) y el hijo (el div de la terminal)
no tenía ancho propio, así que tomaba el ancho del contenido; el addon `fit` calculaba
`cols ≈ 2`.

**Fix**: `.viewerGraph > * { flex: 1 1 auto; min-width: 0; min-height: 0; }`. También
arregló el grafo anclado.

> [!warning] `min-width: 0` en hijos flex
> Sin él, un hijo con contenido ancho no se deja encoger y rompe el layout. Es el
> complemento obligado de `flex: 1` cuando el hijo mide su propio contenido.

## Detección de shells

`terminal_shells` busca en el PATH (con `PATHEXT` en Windows) y, para **Git Bash**,
también en rutas típicas de instalación, porque no suele estar en el PATH. En Unix, la
shell de login (`$SHELL`) va primera como sugerida.

## El ancho de los caracteres: xterm viene con una tabla de 2010

Sin addon de Unicode, xterm decide cuántas celdas ocupa cada carácter con la tabla de
**Unicode 6**. Ahí casi todos los emojis ocupan **una**. Los programas que corren en la
consola —Node con `string-width`, el CLI de una IA, Windows Terminal— les dan **dos**. Cuando
el terminal y el programa no coinciden, cada emoji corre una celda el resto de la línea, y un
programa que redibuja la pantalla termina escribiendo encima de lo que no era (`DEF-098`).

> [!important] Medirlo, no suponerlo: `unicode11` no alcanza
> La respuesta habitual es cargar `@xterm/addon-unicode11`. Medido con cada símbolo del
> reporte, cuántas celdas avanza el cursor:
>
> | Símbolo | Unicode 6 (por defecto) | `unicode11` | `unicode-graphemes` |
> |---|---|---|---|
> | ✅ ❌ 🟡 🟨 🟦 🚀 | 1 | 2 | 2 |
> | ☑️ ⚠️ (con U+FE0F) | 1 | **1** | 2 |
> | ✔ ☑ ⚠ (sin U+FE0F) | 1 | 1 | 1 |
>
> ☑️ y ⚠️ son un carácter de **texto** seguido de un selector invisible, U+FE0F, que lo pide
> en versión emoji. Mirando carácter por carácter, el primero ocupa una celda y el selector
> cero. Solo leyendo el **grupo** entero se sabe que ocupa dos, y eso lo hace
> `@xterm/addon-unicode-graphemes` (`activeVersion = "15-graphemes"`).

Se mide sin la app, con Playwright: un `Terminal` en un HTML que carga los `.js` de
`node_modules`, escribir el símbolo y leer `term.buffer.active.cursorX`. Es la API pública, y
mide exactamente lo que importa: cuánto avanzó el cursor.

`term.unicode` es API «propuesta» y exige `allowProposedApi: true` en el `Terminal`; sin eso,
fijar la versión tira una excepción.

> [!warning] El otro lado, ConPTY, no se puede medir así
> En Windows la salida pasa por ConPTY, que tiene su propia tabla de anchos. Si alguna vez un
> emoji aparece con una celda **de más** —el desfase al revés—, el desacuerdo es de ConPTY y
> no de xterm.

## El `localStorage` no es de la ventana ni del vault: es del origen

Las consolas se guardaban en una clave única (`mic-terminales`), y eso las volvía de la
**instalación**. De ahí salieron dos defectos que parecían distintos y eran el mismo
(`DEF-099` y `DEF-100`): al cambiar de vault seguían las consolas del anterior —con el cwd
en la carpeta que se acababa de dejar— y dos ventanas, cada una con su vault, veían la
misma lista.

> [!important] Todo lo persistido tiene un ámbito, y hay que elegirlo a propósito
> El almacenamiento del navegador es por **origen**: todas las ventanas de Mycelium son el
> mismo. Así que la clave no separa nada por sí sola; **la separación se escribe en el
> nombre de la clave**. `DEF-044` ya lo había resuelto para las pestañas (`micelio-tabs` →
> `micelio-tabs:<ruta>`) y el remedio es el mismo: `mic-consolas:<ruta>`.
>
> Con eso, lo de las dos ventanas se cae solo: no pueden chocar porque un vault se abre en
> **una** ventana (`FUN-L-16`), así que nunca comparten clave.

Dos detalles que no son evidentes:

- **Las preferencias no van con las sesiones.** La shell por defecto y el «restaurar al
  abrir» se configuran junto al resto de los ajustes del usuario: si viajaran dentro de la
  clave del vault, entrar a uno nuevo las reiniciaría en silencio. Salieron a su propia
  clave, fuera del `partialize`.
- **El orden al cambiar de almacén no es intercambiable**, igual que en `tabsStore`: leer lo
  guardado, reapuntar el `persist`, y recién entonces rehidratar o vaciar. Vaciar antes de
  reapuntar escribe la lista vacía **en la clave del vault que se está dejando**.

Y una consecuencia de fondo: la lista sobrevive, el **proceso** no. Al cambiar de vault se
matan los PTY, porque su cwd es de la carpeta anterior — que es exactamente lo que el
usuario veía. Volver al vault es como volver a abrir la app (CA6): están sus consolas, con
su título y su cwd, listas para arrancar de nuevo.

## Relacionadas

- [[terminal-integrada]] — especificación funcional y criterios de aceptación.
- [[Tauri y el WebView]] — ConPTY, `portable-pty`, el proceso que sobrevive al F5.
- [[Estado con Zustand]] — ids sentinela `terminal:<uuid>` y qué persistir.
- [[bugs-progreso]] — `DEF-099` y `DEF-100`, el ámbito de las consolas.
- [[Aprendizajes tecnicos]] — mapa del área.
