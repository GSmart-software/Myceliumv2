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

## Relacionadas

- [[terminal-integrada]] — especificación funcional y criterios de aceptación.
- [[Tauri y el WebView]] — ConPTY, `portable-pty`, el proceso que sobrevive al F5.
- [[Estado con Zustand]] — ids sentinela `terminal:<uuid>` y qué persistir.
- [[Aprendizajes tecnicos]] — mapa del área.
