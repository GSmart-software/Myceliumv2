# Vídeo embebido en una nota (`FUN-S-21` · `EMBED-VIDEO`)

`![](https://youtu.be/ID)` muestra el reproductor dentro de la nota, como en Obsidian.
Pedido por el usuario el 2026-09-23; implementado ese mismo día.

**Reflejado a `web-cloud` el 2026-09-23** (`7ac7616`) sin adaptar nada: `lib/video.ts` y
`scripts/test-video.mjs` quedaron **idénticos** en las dos ramas. Lo único que hubo que
hacer fue quitarle draw.io a los tres archivos compartidos que lo llevan mezclado — ver
[[RAMAS]].

## 1. Qué reconoce

| Forma | Ejemplo |
|---|---|
| YouTube, la larga | `youtube.com/watch?v=ID` |
| YouTube, la corta | `youtu.be/ID` |
| Shorts | `youtube.com/shorts/ID` |
| Embed / directo | `youtube.com/embed/ID` · `youtube.com/live/ID` |
| Vimeo | `vimeo.com/123456789` · `player.vimeo.com/video/123456789` |

Tiene que ser un **embed** (`![](…)`). Un enlace normal a YouTube (`[mirá](…)`) sigue
siendo un enlace y lo abre el navegador — ver [[enlaces-externos]].

## 2. Por `youtube-nocookie.com`

Es el mismo reproductor, servido por Google **sin las cookies de seguimiento** hasta que el
usuario le da al play. No es privacidad completa —la petición del vídeo sale igual— pero es
gratis y estrictamente mejor. Se le suma `rel=0`: al terminar no sugiere vídeos de otros
canales.

## 3. Esto hace que la app cargue contenido remoto

> [!important] No contradice la decisión de empaquetar draw.io, y conviene dejarlo escrito
> [[drawio]] empaquetó la webapp entera —100 MB en el instalador— justamente para **no
> depender de la red**. Acá pasa lo contrario y las dos cosas son correctas:
>
> - Allí se trataba de que **la aplicación** funcione sin conexión. El vault es una carpeta
>   en el disco, y el índice, la búsqueda, el grafo y la terminal no tocan la red: un editor
>   de diagramas que exigiera internet habría sido la primera excepción, justo donde se
>   pierde trabajo si falla.
> - Acá la conexión **la pide el usuario**, explícitamente, al pegar el enlace de un vídeo
>   que vive en YouTube. Nadie espera ver un vídeo remoto sin conexión.
>
> La diferencia práctica: un vídeo sin red degrada a un recuadro con su enlace; el editor de
> diagramas sin red habría sido trabajo perdido.
>
> Queda escrito porque dentro de seis meses, leyendo solo el código, parece un descuido.

## 4. Los dos caminos

Como [[drawio]], y por la misma razón: **la vista en vivo no comparte código con la de
lectura**.

| Vista | Dónde |
|---|---|
| Lectura | `lib/markdown.ts`, plugin `remarkVideo` |
| Edición en vivo | `lib/editor/livePreview.ts`, `VideoWidget` |

Lo que **sí** comparten es la detección: `lib/video.ts`. Es lo único que impide que el
vídeo se vea en una vista y desaparezca en la otra, que fue exactamente el defecto que
costó `FUN-L-20`.

## 5. Seguridad del iframe

El `sandbox` es `allow-scripts allow-popups allow-presentation allow-same-origin`.

> [!warning] `allow-same-origin` hace falta, y cuesta creerlo hasta que se mide
> La primera versión lo negaba, con este argumento: «con él, YouTube alcanzaría el
> `localStorage` y el DOM de la app». **El argumento es falso y el resultado fue un
> reproductor negro**, que es como lo encontró el usuario el 2026-09-23.
>
> Medido con el reproductor real, misma página servida por http, mismo vídeo:
>
> | `sandbox` | Lo que se ve | Peticiones del reproductor |
> |---|---|---|
> | Sin `allow-same-origin` | Un cuadro liso (captura de 1,3 KB) | **0** |
> | Con `allow-same-origin` | El póster dibujado (153 KB) | 1 |
>
> Lo que concede **no** es acceso a Mycelium: significa «no le pongas un origen opaco a
> este documento», así que el iframe conserva **el suyo**, `youtube-nocookie.com`. Sigue
> siendo un origen distinto del de la app, y la política de mismo origen le impide igual
> tocar su `localStorage`, sus cookies o su DOM. Lo que se rompía era **YouTube consigo
> mismo**: sin origen propio no llega a su almacenamiento y no arranca.
>
> La línea que de verdad no se cruza es **`allow-top-navigation`**: con eso el iframe podría
> llevarse la ventana entera, que es el `DEF-101` por otra puerta. Eso está fijado por dos
> tests —la constante y el HTML que sale de `renderNota`—, junto con que `allow-scripts` y
> `allow-same-origin` **estén**, para que nadie los saque «por seguridad» y devuelva el
> recuadro negro.

> [!tip] La lección, más allá de este iframe
> Un ajuste de seguridad que **no se probó contra lo que protege** puede terminar
> protegiendo de nada y rompiendo la función. Los dos tests originales pasaban en verde
> sobre un reproductor que no reproducía: medían la decisión, no el efecto.

El `allow` se queda en lo que el reproductor necesita (`accelerometer`, `encrypted-media`,
`picture-in-picture`, `fullscreen`): **ni cámara, ni micrófono, ni ubicación**.

La comparación del host es por **host completo**, no por sufijo: si no,
`youtube.com.evil.net` se colaría como reproductor en una nota importada.

## 6. Sin conexión

Un recuadro con el enlace y el motivo («Sin conexión: no se pudo cargar el reproductor»),
nunca un hueco en blanco. Se decide con `navigator.onLine`, que **no** sabe si YouTube
responde pero sí sabe que no hay red, que es el caso que se pedía atender.

## 7. Criterios de aceptación

1. **CA1** — `![](https://www.youtube.com/watch?v=ID)` muestra el reproductor en lectura.
2. **CA2** — Lo mismo en edición en vivo, sin tener que cambiar de vista.
3. **CA3** — `youtu.be/ID` y `/shorts/ID` se ven igual que la forma larga.
4. **CA4** — El reproductor se sirve desde `youtube-nocookie.com`.
5. **CA5** — Sin conexión aparece el recuadro con el enlace, no un hueco.
6. **CA6** — Una imagen normal (`![alt](foto.png)`) se sigue viendo como imagen.
7. **CA7** — El iframe no puede tocar nada de la app.

## 8. Lo que no entra

- Reproducir **archivos de vídeo del vault** (`![](video.mp4)`): es otro trabajo, con
  `<video>` y el protocolo de assets.
- Controlar el momento de inicio (`?t=90`): el parámetro se ignora, el vídeo arranca al
  principio. Se reconoce el enlace igual.
- Miniatura con play diferido en vez del iframe.

## 9. Verificación

- `scripts/test-video.mjs` — 12 tests: las formas que la gente pega, los ids con forma
  rara, los hosts que solo se parecen, y el sandbox.
- `scripts/test-embeds.mjs` — el pipeline **de verdad**: que `renderNota` emite el iframe
  con su sandbox, que una imagen sigue siendo imagen y que un enlace sigue siendo enlace.

> [!warning] Lo que falta confirmar en la app
> Que el vídeo **se vea y se reproduzca** necesita la app corriendo y conexión. Los tests
> cubren que el HTML correcto se genera, no que YouTube lo pinte.

## Relacionadas

- [[enlaces-externos]] — la otra mitad de la tanda: un enlace a YouTube que no es embed.
- [[drawio]] — de donde sale la lección de los dos caminos, y el contraste sobre la red.
- [[BACKLOG]] — `FUN-S-21`.
- [[Mapa de documentacion]] — índice general.
