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
| `marco.rs` | `src-tauri/src/` | El menú de anclaje de Windows 11. |

> [!warning] Sin barra del sistema, Windows deja de atender los bordes
> Una ventana sin decoración **no se puede redimensionar**: el marco que atendía el
> arrastre era el del sistema. Se repone con ocho franjas transparentes de 6px que al
> pulsarlas llaman a `startResizeDragging`, y desde ahí el arrastre vuelve a ser nativo.

Los permisos del webview son explícitos (`capabilities/default.json`):
`core:window:allow-minimize`, `allow-toggle-maximize`, `allow-close`,
`allow-start-dragging`, `allow-start-resize-dragging` y `allow-is-maximized`.

## El menú de anclaje de Windows 11

Es el desplegable con los diseños de pantalla (mitad y mitad, tres columnas, 2×2) que
aparece al dejar el puntero sobre el botón de maximizar de cualquier ventana. **No lo
dibuja la app**: lo dibuja Windows, y solo lo ofrece cuando la ventana contesta
`HTMAXBUTTON` al mensaje con el que pregunta qué hay bajo el puntero (`WM_NCHITTEST`).
Esa respuesta la daba el marco del sistema, así que se fue con él.

Se repone en `src-tauri/src/marco.rs`: se engancha un *subclass* al procedimiento de la
ventana y se contesta `HTMAXBUTTON` cuando el puntero cae sobre el rectángulo del botón,
que el frontend informa con `marco_zona_maximizar` (en píxeles CSS; Rust los pasa a
físicos con el factor de escala de la ventana) al montarse y cada vez que cambia de sitio
o de tamaño.

> [!warning] Contestar eso tiene dos consecuencias, y hay que atender las dos
> Para Windows, ese rectángulo deja de ser área de cliente:
> 1. **El clic no llega al webview**. Lo atiende Rust (`WM_NCLBUTTONUP`) alternando
>    maximizar y restaurar; el `onClick` del botón sigue existiendo para el teclado.
> 2. **No hay `:hover` de CSS**. Rust avisa con el evento `marco://hover-maximizar` y el
>    componente pinta la clase `.hover`. Se emite solo al cambiar: `WM_NCHITTEST` llega
>    con cada movimiento del puntero.

Todo esto es **solo Windows** (`#[cfg(target_os = "windows")]`). En el resto los comandos
existen y no hacen nada, para que el frontend no tenga que preguntar dónde corre.

## Lo que falta

- **El estado maximizada** se sigue por `onResized`, que es el evento que hay; no existe
  uno propio de «cambió el estado de la ventana».

## Relacionadas

[[Rediseñar la UI con impeccable]] · [[DESIGN]] · [[BACKLOG]] · [[Generar instaladores desktop]]
