# Enlaces a páginas web (`FUN-S-20` · `LINK-EXTERNO-NAVEGADOR`)

Que `[texto](https://…)` **abra el navegador predeterminado** y Mycelium no se mueva.
Corrige [[Bugs_errores_y_defectos|DEF-101]], implementado el 2026-09-23.

## 1. De dónde sale

Del usuario: «si tengo un link de una página web, al hacerle clic me abriera el navegador
predeterminado». Al probarlo apareció el defecto, que es peor que la falta:

| Vista | Qué hacía |
|---|---|
| **Lectura** | **Navegaba la ventana** a esa página. La app desaparecía: sin barra de dirección ni botón de volver, porque el marco es propio ([[marco-de-ventana]]). La única salida era cerrar Mycelium. |
| **Edición en vivo** | Nada. |

> [!danger] Era el defecto que más lejos dejaba al usuario
> Cualquier otro se ve y se sigue trabajando. Este **se llevaba la aplicación entera** con
> un clic en algo que en cualquier documento es inofensivo, y basta con que una nota
> importada traiga un enlace.

## 2. Qué hace ahora

Un clic en un enlace a una página web abre el navegador del sistema. La ventana de
Mycelium **no se mueve**. Vale igual en las cinco vistas donde se puede hacer clic en uno.

## 3. La causa raíz, y por qué el arreglo va en un solo sitio

Nadie interceptaba el clic: en lectura el `<a href>` llegaba al navegador embebido, que
hacía lo suyo —navegar—; en la vista en vivo no hay `<a>` en absoluto, porque el live
preview oculta el `(url)` y deja el texto marcado.

Los clics en enlaces se atienden en **cinco** lugares distintos:

| Dónde | Qué es |
|---|---|
| `components/editor/NoteEditor.tsx` | La vista de lectura |
| `lib/editor/livePreview.ts` | La edición en vivo |
| `lib/editor/tablaWidget.ts` | Una celda de tabla |
| `lib/editor/propiedadesWidget.ts` | Una propiedad del frontmatter (las de tipo URL son justo esto) |
| `components/canvas/CanvasView.tsx` | Una tarjeta del canvas |

> [!important] Arreglar uno solo era peor que no arreglar ninguno
> Dejaría enlaces que abren bien en una vista y **se llevan la app** en otra, según dónde
> estuviera el usuario. Es la misma forma del defecto de las tres copias de la extensión
> ([[drawio]] § 9), así que la decisión vive en **`lib/enlacesExternos.ts`** y los cinco la
> llaman.

## 4. Qué se considera «un enlace externo»

Solo se abren **`http`, `https` y `mailto`**.

> [!danger] La lista corta es parte del trabajo, no una precaución de más
> Una nota puede venir importada, escrita por otra persona o generada por una IA.
> Entregarle al sistema un `file://`, un `javascript:` o un protocolo registrado por otra
> aplicación (`ms-msdt:`, `search-ms:`, que han sido vector real en Windows) es abrirle una
> puerta a cualquiera que consiga que abras una nota. Lo que no está en la lista **no se
> abre y no se intenta**.

### Casos borde, decididos

| Caso | Qué pasa | Por qué |
|---|---|---|
| `#wikilink:…`, `#tag:…` | Lo atiende quien lo puso | Son la navegación interna de Mycelium |
| `#un-titulo` (ancla) | No se toca | Es un salto dentro de la misma nota |
| `otra-nota.md`, `./imagen.png` | No se toca | Rutas relativas: son del vault |
| `mailto:` | **Se abre** | Lo atiende el cliente de correo, que es lo esperable |
| `file://`, `javascript:`, `ms-msdt:` | **No se abre**, se anota en consola | § 4 |
| Un enlace en una celda o en una propiedad | Se abre | Son dos de los cinco sitios |

## 5. La red de seguridad, en Rust

`src-tauri/src/navegacion.rs` registra un plugin con `on_navigation` que devuelve `false`
para todo lo que no sea el origen de la app, y deriva ese destino al navegador.

Va como **plugin** y no como `WebviewWindowBuilder::on_navigation` porque la ventana
principal la crea `tauri.conf.json`: un `on_navigation` por constructor dejaría fuera justo
la ventana donde se reportó el defecto.

> [!important] Solo el documento de arriba, no los iframes
> En Windows `on_navigation` se conecta a `NavigationStarting` de WebView2, que **solo
> dispara para el documento principal** —los iframes usan `FrameNavigationStarting`, que
> wry no engancha—. Por eso no estorba al iframe de [[drawio]] ni al del reproductor de
> [[video-embebido]], que cargan orígenes ajenos por diseño.
>
> Si algún día wry enganchara también los iframes, **el vídeo dejaría de cargar**. Queda
> dicho porque el síntoma (un recuadro vacío) no apunta ni de lejos a ese archivo.

## 6. Criterios de aceptación

1. **CA1** — En lectura, un clic en `[texto](https://…)` abre el navegador y la ventana de
   Mycelium sigue mostrando la nota.
2. **CA2** — En edición en vivo, el mismo enlace hace lo mismo (antes no hacía nada).
3. **CA3** — Lo mismo en una celda de tabla, en una propiedad de tipo URL y en una tarjeta
   de canvas.
4. **CA4** — Un `[[wikilink]]`, un `#tag` y un ancla siguen navegando dentro de la app.
5. **CA5** — Un `file://` o un `javascript:` **no** abren nada.
6. **CA6** — Aunque un camino se olvide, la ventana nunca termina en una página ajena.

## 7. El permiso: habilitar el comando NO alcanza

> [!danger] `opener:allow-open-url` habilita el comando **con el alcance vacío**
> Con solo ese permiso en `capabilities/default.json`, cada llamada se rechaza y el clic
> **no hace nada** — que es como lo encontró el usuario el 2026-09-23, después de que el
> arreglo ya había tapado la navegación. O sea: el defecto grave estaba corregido y el
> enlace seguía sin abrir.
>
> Lo dice el propio plugin, en `permissions/autogenerated/commands/open_url.toml`:
> *«Enables the open_url command **without any pre-configured scope**»*. Los esquemas los
> trae **`opener:allow-default-urls`** (`mailto:`, `tel:`, `http://`, `https://`), que es
> un permiso aparte. Su conjunto `default` incluye los dos.
>
> Hacen falta **los dos**: `opener:allow-open-url` (el comando) y
> `opener:allow-default-urls` (a dónde). Un permiso que se llama «allow» y no alcanza para
> nada es el tipo de cosa que se busca durante una hora en el lugar equivocado.

## 8. Verificación

- `scripts/test-enlaces-externos.mjs` — 13 tests, la mitad sobre la lista de esquemas y
  sobre que el manejador **siempre** corta la navegación.
- `cargo test --lib navegacion` — 4 tests, incluido que un host parecido
  (`localhost.evil.com`) no se confunde con el propio.

> [!warning] Lo que falta confirmar en la app
> Que el navegador abra de verdad y que la ventana no se mueva **no se puede probar sin la
> app corriendo**: el plugin `opener` necesita Tauri. Los tests cubren la decisión, no el
> efecto.

## Relacionadas

- [[Bugs_errores_y_defectos]] — `DEF-101`, el síntoma como se observó.
- [[bugs-progreso]] — su estado.
- [[video-embebido]] — se implementó en la misma tanda y comparte el asunto del iframe.
- [[drawio]] — de donde sale la lección de la respuesta repetida en varios sitios.
- [[marco-de-ventana]] — por qué quedarse sin barra de dirección era tan grave.
- [[BACKLOG]] — `FUN-S-20`.
- [[Mapa de documentacion]] — índice general.
