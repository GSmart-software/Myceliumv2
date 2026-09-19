# Marco de ventana propio

`FUN-M-31` · desktop · rama `experimento/ui-impeccable` · 2026-09-19

> [!info] Qué es
> Mycelium deja de usar la barra de título de Windows: la ventana va sin decoración
> (`decorations: false`) y el marco lo dibuja la app. Los botones de minimizar, maximizar
> y cerrar viven **dentro de la barra superior**, como en VS Code y Obsidian. Además, el
> ícono de la aplicación deja de ser el de Tauri.

## Por qué

Eran las dos marcas ajenas que quedaban a la vista: el ícono de Tauri en la barra de
tareas y en el alt-tab, y una barra de título gris con el nombre de la carpeta encima de
la interfaz. Pedido por el usuario el 2026-09-19, al cerrar el experimento de UI.

## Ícono

`src-tauri/icono-mycelium.svg` es la **fuente**: el isotipo —tres nodos unidos por hifas,
con las proporciones del logo de la barra superior— sobre un cuadrado Esporo con esquinas
redondeadas. El fondo importa: en la barra de tareas el verde agua solo, sin fondo, se
pierde contra un escritorio claro.

De ahí salen todos los tamaños con `npx tauri icon src-tauri/icono-mycelium.svg`, que
escribe `src-tauri/icons/` (incluidos `icon.ico` y `icon.icns`). Genera también íconos de
Android e iOS: **se borran**, este proyecto es solo desktop.

## Marco

| Pieza | Dónde | Qué hace |
|---|---|---|
| `decorations: false` | `tauri.conf.json` y los dos `WebviewWindowBuilder` de `ventanas.rs` | Saca la barra del sistema. Va en los tres lugares: cada ventana la pide por su cuenta. |
| `shadow: true` | ídem | Conserva la sombra, para que la ventana siga despegada del fondo. |
| `ControlesVentana` | `components/ventana/` | Minimizar, maximizar/restaurar y cerrar. 46×32px, las medidas de Windows; lo propio es el color y el trazo. |
| `data-tauri-drag-region` | barra superior del workspace y franja del selector de vaults | El fondo libre arrastra la ventana; doble clic maximiza. |
| `BordesRedimensionado` | `components/ventana/`, montado en el layout | Las ocho zonas del borde. |

> [!warning] Sin barra del sistema, Windows deja de atender los bordes
> Una ventana sin decoración **no se puede redimensionar**: el marco que atendía el
> arrastre era el del sistema. Se repone con ocho franjas transparentes de 6px que al
> pulsarlas llaman a `startResizeDragging`, y desde ahí el arrastre vuelve a ser nativo.

Los permisos del webview son explícitos (`capabilities/default.json`):
`core:window:allow-minimize`, `allow-toggle-maximize`, `allow-close`,
`allow-start-dragging`, `allow-start-resize-dragging` y `allow-is-maximized`.

## Lo que falta

- **Menú de anclaje de Windows 11** (el que aparece al pasar el puntero sobre maximizar):
  necesita responder `HTMAXBUTTON` a `WM_NCHITTEST`, o sea subclasear la ventana desde
  Rust. No está hecho: maximizar funciona con clic y con doble clic en la barra, y el
  anclado por teclado (`Win`+flechas) tampoco se toca.
- **El estado maximizada** se sigue por `onResized`, que es el evento que hay; no existe
  uno propio de «cambió el estado de la ventana».

## Relacionadas

[[Rediseñar la UI con impeccable]] · [[DESIGN]] · [[BACKLOG]] · [[Generar instaladores desktop]]
