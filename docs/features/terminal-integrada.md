# FUN-L-07 — Terminal integrada (solo desktop)

**HU:** Como usuario técnico de Mycelium desktop, quiero una terminal nativa integrada
en la app (estilo VS Code) para trabajar con el sistema de archivos del vault,
gestionar git y correr herramientas CLI (p. ej. Claude Code) sin salir de Mycelium.

Solo **desktop** (la shell nativa requiere acceso al sistema; web no la incluye — la
diferencia funcional entre versiones es aceptada). Idea y decisiones: `docs/BACKLOG.md`.

## Criterios de aceptación

1. **CA1 — Panel de consolas**: el botón del rail (junto al del grafo) abre el panel
   **Consolas** en la barra lateral (como el explorador). Desde ahí se **crean**
   consolas nuevas ("Nueva terminal": clic = shell por defecto; clic derecho = elegir
   shell), se **reabren** las iniciadas y se **finalizan**. Cerrar la **pestaña** de
   una consola solo la oculta (el shell sigue corriendo de fondo y aparece en el
   panel); **Finalizar** desde el panel es lo que termina el proceso y la quita de la
   lista. Un punto indica si el proceso está corriendo.
2. **CA2 — Pestaña como cualquier otra**: la terminal vive en el área de panes: se
   puede mover entre paneles, dividir la pantalla con ella y abrir **varias terminales**
   a la vez (cada una con su sesión independiente). Mover la pestaña de panel NO
   reinicia la sesión. También puede **anclarse en el visor del explorador**
   (DEF-023 P3) y sigue funcionando como consola.
3. **CA3 — Shell real (PTY)**: es la shell nativa del SO vía pseudo‑terminal
   (ConPTY en Windows): programas interactivos, colores, Ctrl+C, etc.
4. **CA4 — Directorio de trabajo**: abre en la **raíz del vault** (modo carpeta). En el
   menú contextual de una carpeta del explorador hay **"Abrir terminal aquí"**, que abre
   con cwd en esa carpeta (solo visible en vault de carpeta). Sin vault de carpeta
   (SQLite clásico), abre en el directorio del usuario.
5. **CA5 — Shell configurable**: en Configuración → Editor → Terminal se elige la shell
   que se inicia por defecto entre las **detectadas** (Windows: PowerShell 7 / Windows
   PowerShell / cmd / Git Bash / WSL; Unix: `$SHELL`, bash, zsh, fish). Sin configurar,
   la del sistema.
6. **CA6 — Persistencia configurable**: al reabrir la app se **restauran** las
   terminales (cantidad, posición en el layout de panes, shell y cwd **inicial**) y,
   opcionalmente, el texto de la última sesión (*scrollback*) como historial. El
   proceso NO sobrevive al cierre (se recrea una shell nueva). Dos opciones en
   Configuración: "Restaurar terminales al abrir" y "Restaurar el historial".
   Desactivada la primera, las pestañas de terminal persistidas se cierran al arrancar.
7. **CA7 — Cierre**: cerrar la pestaña NO termina la shell (solo la oculta; se reabre
   desde el panel de Consolas). El proceso termina al **Finalizar** desde el panel o
   si muere por sí mismo (`exit`), en cuyo caso la pestaña se cierra sola y la consola
   desaparece de la lista.

## Notas de implementación

- **Rust** (`src-tauri/src/terminal.rs`): crate `portable-pty` (PTY multiplataforma,
  ConPTY en Windows). Comandos: `terminal_shells` (detección), `terminal_abrir`,
  `terminal_escribir`, `terminal_redimensionar`, `terminal_cerrar`. Salida por evento
  `terminal-datos` (`{id, datos}`); fin de proceso por `terminal-salida` (`{id}`).
  Estado: mapa `id → sesión` (master PTY + writer + child) en un `Mutex` gestionado.
- **Frontend**: `@xterm/xterm` + `@xterm/addon-fit` (+ `@xterm/addon-serialize` para el
  scrollback). Las pestañas de terminal usan el sentinel `terminal:<uuid>` en
  `tabsStore` (mismo patrón que `graph:global`). Las instancias xterm viven en un
  caché a nivel de módulo (patrón `instanceCache` del NoteEditor) para sobrevivir a
  los remounts al mover la pestaña. Un watcher sobre `tabsStore` mata el PTY cuando la
  pestaña desaparece. `stores/terminalStore.ts` (persistido) guarda sesiones
  (shell/cwd/título/scrollback) y las preferencias.
- **Divergencia**: este feature toca archivos hasta ahora compartidos (`tabsStore`,
  `TabBar`, `EditorPane`, `Rail`, `SettingsDrawer`) que quedan **divergentes** de
  `web-cloud`; queda registrado en `docs/RAMAS.md`.
- **Limitación conocida**: el cwd restaurado es el **inicial** de cada terminal (no se
  rastrea el `cd` posterior del usuario).
