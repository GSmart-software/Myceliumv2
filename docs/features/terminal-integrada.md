# FUN-L-07 — Terminal integrada (solo desktop)

**HU:** Como usuario técnico de Mycelium desktop, quiero una terminal nativa integrada
en la app (estilo VS Code) para trabajar con el sistema de archivos del vault,
gestionar git y correr herramientas CLI (p. ej. Claude Code) sin salir de Mycelium.

Solo **desktop** (la shell nativa requiere acceso al sistema; web no la incluye — la
diferencia funcional entre versiones es aceptada). Idea y decisiones: `docs/BACKLOG.md`.

## Criterios de aceptación

1. **CA1 — Abrir desde el rail**: un botón nuevo en el rail (junto al del grafo) abre
   una terminal nueva como **pestaña del workspace**. Clic = shell por defecto;
   **clic derecho** = menú para elegir la shell de ESA terminal (selector puntual).
2. **CA2 — Pestaña como cualquier otra**: la terminal vive en el área de panes: se
   puede mover entre paneles, dividir la pantalla con ella y abrir **varias terminales**
   a la vez (cada una con su sesión independiente). Mover la pestaña de panel NO
   reinicia la sesión.
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
7. **CA7 — Cierre**: cerrar la pestaña termina el proceso de la shell; si el proceso
   termina por sí mismo (`exit`), la pestaña se cierra sola.

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
