# Versión 2.1.0

**Solo desktop** (`desktop-tauri`) · 2026-09-23 · sobre [[Version 2.0.0]]

> [!success] Publicada el 2026-09-23 a las 21:27 (UTC)
> Con `npm run publicar`. Verificado: los tres manifiestos responden y parsean, la firma de
> los dos `latest.json` es idéntica al `.sig`, y el `.exe` del bucket tiene el mismo SHA-256
> que el firmado (`b9fc2d15eedd36cf…`). `versions.json` quedó con 2.1.0, 2.0.0, 1.7.0,
> 1.6.2, 1.5.0 y 1.4.0. Comprobado además fuera del script: el `latest.json` público sirve
> la 2.1.0 y el instalador responde 200.

**draw.io como tipo de archivo del vault** (`FUN-L-20`), más dos cosas chicas que salieron
de probarlo: los **enlaces web** abren el navegador (`FUN-S-20`, que corrige `DEF-101`) y los
**vídeos de YouTube** se ven dentro de la nota (`FUN-S-21`). Entran también `DEF-099` y
`DEF-100`, el ámbito de las consolas.

> [!info] La web sale a la vez como `2.1.0` ([[Version 2.1.0 de web]])
> Le llega el vídeo embebido y los enlaces externos —allá, en pestaña nueva—, más un defecto
> latente que se cerró de paso: los enlaces a un `.canvas` o a un `.base` volvieron a
> resolver. draw.io y lo de las consolas **no**: son solo-desktop. Ver
> [[Diferencias funcionales aceptadas entre versiones]].
>
> Su numeración es **propia**: que coincida con la de escritorio viene de la 2.0.0, donde
> las dos subieron a major por el mismo motivo el mismo día. No están sincronizadas.

## Por qué sube este dígito

**Minor**: el usuario puede hacer algo que antes no podía —crear y editar diagramas de
draw.io, ver un vídeo dentro de una nota— y eso manda sobre el resto. Las correcciones que
viajan con la versión quedan **absorbidas**, como dice [[Versionado del sistema]]: un
release, un incremento.

## Qué entra

| Qué | ID | Dónde |
|---|---|---|
| draw.io como tipo de archivo del vault | `FUN-L-20` | desktop · [[drawio]] |
| Un enlace web abre el navegador predeterminado | `FUN-S-20` | ambas (difiere) · [[enlaces-externos]] |
| El reproductor de YouTube dentro de la nota | `FUN-S-21` | ambas · [[video-embebido]] |
| Un clic en un enlace se llevaba la ventana de Mycelium | `DEF-101` | ambas (difiere) |
| Las consolas no pertenecían al vault | `DEF-099` | desktop · [[terminal-integrada]] |
| Varias ventanas compartían la lista de consolas | `DEF-100` | desktop |

## El instalador pasa de 10,2 MB a 40,3 MB

Es el precio de que draw.io funcione **sin conexión**: la webapp va empaquetada en vez de
cargarse desde su sitio público. Se recortó de 147 MB a 102 MB —fuera las fuentes sin
minificar, un bundle que no referenciaba nadie y las traducciones que no se usan— y el resto
son, sobre todo, las **bibliotecas de formas**, que son justamente el motivo de traer
draw.io. El usuario lo aceptó con el número medido delante. Ver [[drawio]] § 3.

> [!warning] La webapp no está en git: la baja el build
> `scripts/preparar-drawio.mjs` descarga la release fijada, la verifica por SHA-256 y la
> extrae en `frontend/public/drawio/`. Ahora corre dentro de `npm run build`, porque
> compilar desde un checkout limpio daba una app con el editor **en blanco**, sin ningún
> error a la vista.

## Lo que este release deja aprendido

- **Una pregunta que se contesta en tres archivos se contesta mal en dos.** «Qué extensión
  tiene este tipo» estaba repetida en el explorador, en `extDeTipo` y en la resolución de
  wikilinks; agregar `.drawio` tocó una sola. El archivo se creaba bien, se listaba sin
  extensión y los embeds no resolvían: un descuido con tres caras. Ahora vive en
  `lib/extensionesDeTipo.ts`, tipado para que **un tipo nuevo no compile** hasta contestarla.
- **La vista de lectura y la de edición en vivo no comparten código.** Lo pagaron los dos
  embeds de esta versión: el de draw.io se dibujaba al leer y desaparecía al editar. Todo lo
  que se vea dentro de una nota hay que hacerlo **dos veces**, o no está hecho.
- **Un ajuste de seguridad que no se prueba contra lo que protege puede no proteger de nada
  y romper la función.** El `sandbox` del reproductor negaba `allow-same-origin` con un
  argumento falso —creía que se lo daba a la app, cuando el iframe conserva su propio
  origen— y dejaba el vídeo **en negro**. Dos tests lo fijaban, y pasaban en verde sobre un
  reproductor que no reproducía: medían la decisión, no el efecto.
- **«Allow» no siempre alcanza.** `opener:allow-open-url` habilita el comando **con el
  alcance vacío**; los esquemas los trae `opener:allow-default-urls`. Con uno solo, el clic
  no hace nada y no hay error a la vista.

<!-- notas-release:inicio -->
## Diagramas, enlaces y vídeo

### draw.io, dentro de Mycelium

- **Un tipo de archivo más del vault.** Creá un diagrama desde el explorador, editalo en su
  pestaña y guardalo como un archivo más de tu carpeta, con todas las bibliotecas de figuras
  de draw.io: UML, entidad-relación, redes, BPMN, nube.
- **Funciona sin conexión.** El editor viaja **dentro** de Mycelium, así que no depende de
  internet ni manda tus diagramas a ningún lado. Por eso esta actualización pesa bastante
  más que las anteriores.
- **Dentro de una nota**: `![[diagrama.drawio]]` muestra el dibujo, y un clic lo abre para
  editarlo.
- Al volver a la pestaña de un diagrama, **sigue donde lo dejaste**: no se recarga.

### Los enlaces ya no se llevan la aplicación

- Un clic en un enlace a una página web **abre tu navegador**, y Mycelium se queda donde
  está. Antes, en la vista de lectura, la ventana entera se iba a esa página y no había forma
  de volver; en la vista de edición no pasaba nada. Vale también para los enlaces dentro de
  tablas y de las propiedades de una nota.

### Vídeos de YouTube en la nota

- Pegá el enlace de un vídeo como una imagen —`![](https://youtu.be/…)`— y se ve el
  **reproductor**, en lectura y mientras editás. Funciona con las direcciones largas, las
  cortas y los *shorts*, y también con Vimeo.
- Va por `youtube-nocookie.com`: el mismo reproductor, sin cookies de seguimiento antes de
  que le des play. Sin internet, en vez de un hueco vas a ver un recuadro con el enlace.

### Las consolas son de cada vault

- Al cambiar de vault ya no te siguen las consolas del anterior —que además seguían
  apuntando a la carpeta vieja—. Cada vault tiene las suyas, y si abrís dos ventanas, cada
  una ve solo las de su vault. Al volver a un vault, sus consolas están donde las dejaste.
<!-- notas-release:fin -->

## Cómo comprobarlo en la app

- **Un diagrama**: «Nuevo» en el explorador → diagrama; dibujar dos cajas y conectarlas;
  cambiar de pestaña y volver (no se recarga); `![[nombre.drawio]]` en una nota, en lectura
  **y** en edición.
- **Sin conexión**: cortar la red y abrir un diagrama — tiene que funcionar igual.
- **Un enlace**: `[Anthropic](https://www.anthropic.com)` en una nota, clic en las dos
  vistas, y también dentro de una tabla y de una propiedad. La ventana no se mueve.
- **Un vídeo**: `![](https://www.youtube.com/watch?v=…)` en las dos vistas.
- **Las consolas**: abrir una, cambiar de vault (el panel queda vacío), volver (está otra
  vez); con dos ventanas, cada una ve las suyas.

## Relacionadas

- [[Version 2.0.0]] — la versión anterior.
- [[drawio]] · [[enlaces-externos]] · [[video-embebido]] — las specs de lo que entra.
- [[terminal-integrada]] — el ámbito de las consolas (CA8).
- [[Versionado del sistema]] — el criterio del número.
- [[bugs-progreso]] — las correcciones que entran.
- [[BACKLOG]] — el inventario.
- [[Publicar una version]] — cómo se publica.
- [[Mapa de documentacion]] — índice general.
