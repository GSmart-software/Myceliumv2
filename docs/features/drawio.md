# Diagramas de draw.io dentro de Mycelium (`FUN-L-20` · `FILES-DRAWIO`)

**Idea registrada el 2026-09-22** desde la [[Bandeja de entrada]]; **decisiones tomadas por
el usuario el 2026-09-23** (§ 3 y § 4) y en implementación desde entonces.

> Pedido textual: «Quiero integrar la herramienta de draw.io en mycelium, así como se
> implementó excalidraw».

## 1. Qué se pide

Un **tipo de archivo más del vault**, con el mismo trato que un `.excalidraw`: se crea desde
el explorador, se abre en su pestaña, se edita dentro de Mycelium y se guarda como archivo
en la carpeta del vault. Nada de abrir el navegador ni de exportar a mano.

## 2. Por qué, si ya está Excalidraw

Son dos herramientas para dos trabajos distintos, como ya pasó con [[canvas]]:

| | **Excalidraw** | **draw.io** |
|---|---|---|
| Qué manipula | Trazos a mano alzada | Figuras y conectores que se **enganchan** |
| Para qué sirve | Pensar en voz alta, un boceto | Un diagrama formal que se mantiene |
| Qué trae | Lápiz, formas sueltas | Bibliotecas: UML, ER, red, BPMN, nube |

Un diagrama de arquitectura que hay que **retocar dentro de seis meses** en Excalidraw es
mover trazos; en draw.io es mover una caja y que las flechas la sigan. Ninguna reemplaza a
la otra, igual que el canvas no reemplazó a Excalidraw.

## 3. Cómo se embebe

> [!important] draw.io no es una librería, es una aplicación web
> Excalidraw se integró como componente React (`@excalidraw/excalidraw`) y por eso fue
> barato. draw.io **no publica un componente equivalente**: lo que ofrece es su aplicación
> entera en **modo embebido** —un `iframe` con `?embed=1&proto=json` que habla por
> `postMessage` (`init`, `load`, `save`, `export`, `autosave`, `exit`)—. El archivo lo sigue
> guardando Mycelium; el iframe solo edita y devuelve el XML.

De ahí salen dos caminos:

| | `iframe` al sitio público (`embed.diagrams.net`) | La webapp **empaquetada** en Mycelium |
|---|---|---|
| Sin internet | No funciona | Funciona |
| Instalador | Igual que hoy | Crece (la webapp son varios MB) |
| Mantenimiento | Lo actualizan ellos | Lo actualizamos nosotros |
| Tauri | Hay que abrir la CSP a ese origen | Todo local |

> [!success] Decidido (usuario, 2026-09-23): **empaquetada y recortada**
> Mycelium funciona sin conexión y eso no se negocia: el vault es una carpeta en el disco, y
> el índice, la búsqueda, el grafo y la terminal no tocan la red. Un editor que exige
> internet sería la primera excepción, justo donde se pierde trabajo si falla.
>
> Los números sobre los que se decidió: la release **`v31.4.6`** (2026-09-16) publica un
> único `draw.war` de **51,3 MB** —un zip—, con licencia **Apache-2.0**; el instalador de
> Mycelium hoy pesa **10,2 MB**. Se empaqueta **recortada** (fuera MathJax y los idiomas que
> no se usan), apuntando a un instalador de **~30-35 MB**.
>
> El recorte es la parte con riesgo, así que se hace **al revés de como tienta**: primero
> funcionando con la webapp entera, y recién entonces se saca de a poco, probando después de
> cada quita las bibliotecas de formas, las plantillas y la exportación. Lo que quede fuera
> se anota acá.

### Lo que quedó fuera, y lo que se probó y se devolvió (2026-09-23)

La webapp pasó de **147 MB a 102 MB** sin comprimir, y de **51,3 a 33,7 MB** comprimida
—que es lo que paga el instalador—. El orden fue el que pedía la spec: entera y funcionando
primero, y después una quita por vez con el smoke corriendo entre medio.

| Qué salió | Cuánto | Por qué se puede |
|---|---|---|
| `js/integrate.min.js` | 22 MB | Es el bundle del modo «integrate», el de `embed.diagrams.net`. **Ningún** archivo del paquete lo referencia: `index.html` carga `js/app.min.js` vía `bootstrap.js`. |
| `js/diagramly/` + `js/grapheditor/` | 14 MB | Las fuentes **sin minificar**. `bootstrap.js` solo las pide en la rama `dev=1`; en producción manda `app.min.js`, que ya las trae adentro. |
| `resources/dia_*.txt` salvo `es` | 6 MB | Las traducciones que no se usan. La UI va en español y el fallback de draw.io es el inglés. |
| `META-INF/` + `WEB-INF/` | 5 MB | El andamiaje de la app Java del `.war`. Mycelium sirve estáticos, no hay servlet container. |

> [!warning] MathJax se probó, se rompió y **se devolvió**
> Era el primer candidato de esta nota, pero sacarlo no sale gratis: draw.io lo pide **al
> arrancar** (`js/PreConfig.js` define `DRAW_MATH_URL`), así que sin él quedaba un **404 en
> cada apertura** del editor y las fórmulas dentro de las figuras dejaban de dibujarse en
> silencio. A cambio ahorraba **~1 MB comprimido sobre 33**. El peso real está en
> `stencils/` (42 MB), que es justo lo que no se puede tocar.
>
> Los dos *viewers* tampoco salieron: están referenciados —`viewer.min.js` desde
> `js/PreConfig.js`, y `viewer-static.min.js` desde `app.min.js`, que es lo que sostiene la
> exportación a HTML—.
>
> Esto es la regla «si algo se rompe, revertí esa quita» aplicada: la lista de candidatos no
> manda sobre lo que se ve al probar.

Lo que encontró el problema fue un check nuevo del smoke: **los 404**. Los demás
—bibliotecas de formas, plantillas, exportación— seguían verdes con MathJax afuera, que es
exactamente la forma en que una quita rompe algo sin avisar.

## 4. El archivo

- **`.drawio`** es la extensión nativa: XML de mxGraph, texto plano, versionable en git.
- **`.drawio.svg`** es la alternativa: un SVG normal —se ve en cualquier visor y se embebe
  en una nota como imagen— que lleva el XML **incrustado** dentro, así que sigue siendo
  editable. Es lo que usa la gente que trabaja draw.io dentro de Obsidian.
- **Decidido: `.drawio`.** El SVG da vista previa gratis, pero paga dos cosas que acá
  molestan: la doble extensión deja al archivo pareciendo una imagen —que es un tipo que el
  visor de `FUN-L-11` ya atiende, así que habría que desambiguar por nombre— y guarda dos
  representaciones del mismo diagrama, que pueden desincronizarse. El XML es un solo
  documento, se diferencia en git y lo entiende cualquier draw.io. La vista previa la
  resuelve el visor que ya viene en el paquete, sin pedirle nada al formato.

En cualquiera de los dos casos, el contenido **no entra al índice de búsqueda**: Mycelium
indexa `.md` y nada más. Vale lo mismo que para `.excalidraw` y `.canvas` — ver
[[ia-framework-vault]] § qué puede haber en el vault.

## 5. Dónde toca (el molde ya existe)

Excalidraw y el canvas ya abrieron el camino de «un segundo tipo de archivo». La lista de
sitios es la misma que documenta [[canvas]] § 7:

| Sitio | Qué hay que hacer |
|---|---|
| `src-tauri/src/archivos.rs` | Que la extensión entre al índice y al árbol |
| `NotaTipo` y el explorador | Un tipo más, con su ícono |
| `lib/iconosDeTipo.ts` | El ícono del tipo, **en un solo lugar** (`FUN-S-11`) |
| `tabsStore` + pestaña | Abrirlo como pestaña propia, con su centinela |
| Menú «Nuevo» | Crear un diagrama vacío |
| Embeds `![[diagrama.drawio]]` | Mostrarlo dentro de una nota |
| Exportación a PDF | Que salga dibujado, no como un hueco |
| Papelera y renombrado | Que se comporte como cualquier otro archivo |

## 6. Criterios de aceptación (borrador)

1. **CA1 — Crear**: desde el menú «Nuevo» del explorador sale un diagrama vacío, con nombre
   editable, en la carpeta donde se pidió.
2. **CA2 — Editar**: al abrirlo se ve el editor de draw.io completo, con sus bibliotecas de
   figuras, dentro de una pestaña normal del área de trabajo.
3. **CA3 — Guardar**: los cambios llegan al archivo del vault. El estado «sin guardar» se ve
   como en una nota, y cerrar la pestaña no pierde trabajo.
4. **CA4 — Sin conexión**: todo lo anterior funciona con la máquina desconectada.
5. **CA5 — En una nota**: `![[diagrama.drawio]]` muestra el diagrama dentro de la nota.
6. **CA6 — Tema**: el editor no desentona con el tema y el modo activos de Mycelium (al
   menos, que siga a claro/oscuro).
7. **CA7 — Nada sale a la red**: con la máquina conectada, abrir y editar un diagrama no
   dispara ninguna petición a un dominio ajeno.

## 7. Cómo se empaqueta

- La webapp **no entra a git**: la baja un script, `frontend/scripts/preparar-drawio.mjs`,
  desde la release **fijada** `v31.4.6` —una versión pinchada, para que el build sea
  reproducible—, la verifica por SHA-256, la extrae y descarta lo que no se usa.
- Queda en **`frontend/public/drawio/`**, o sea dentro del export estático de Next. Así el
  editor se sirve del **mismo origen** que la app: no hay que abrir la CSP, ni sumar rutas al
  protocolo de assets de Tauri, y el `postMessage` entre la app y el iframe es directo. La
  carpeta va al `.gitignore`.
- El iframe se abre con `embed=1&proto=json&offline=1&stealth=1`: modo embebido, sin salidas
  a la red. Que **no** haya ninguna petición externa es parte de la verificación.

## 8. Lo que estaba abierto, y cómo se resolvió

- **El embed en una nota es una imagen que al hacer clic abre la pestaña**, no un editor.
  Es la misma decisión que ya tomó Excalidraw con sus embeds, y evita cargar la webapp
  entera una vez por cada diagrama de la nota. El SVG lo dibuja la propia webapp —el XML de
  mxGraph no lo entiende nadie más—: hay **un** iframe oculto que actúa de servicio de
  dibujo y atiende los pedidos encolados.
- **Qué quedó afuera del recorte**: § 3, con lo que se probó y se devolvió.

## 9. Lo que se implementó (2026-09-23)

| Pieza | Dónde |
|---|---|
| Protocolo y formato (puro, 9 tests) | `frontend/lib/drawio.ts` · `frontend/scripts/test-drawio.mjs` |
| El editor | `frontend/components/drawio/DrawioView.tsx` |
| Vistas previas de los embeds | `frontend/lib/drawioRender.ts` |
| Tipo de archivo | `NotaTipo`, `extDeTipo`, `archivos.rs`, `iconosDeTipo.ts`, `EditorPane`, `SidebarNoteView`, menú «Nuevo» |
| La webapp empaquetada | `frontend/scripts/preparar-drawio.mjs` (`npm run preparar-drawio`) |
| Que el puente funciona | `frontend/scripts/smoke-drawio.mjs` |

### Tres cosas que solo se supieron probando

1. **No existe `action: 'save'`.** El guardado es una *acción del editor* (el botón, o
   Ctrl+S), no una acción del protocolo: se dispara con
   `{action:'invokeAction', actionName:'save'}`. Está en `js/diagramly/Menus.js`, donde el
   modo embebido reemplaza `actions.get('save')` por el que hace `postMessage`.
2. **`offline=1` *enciende* el service worker**, al revés de lo que sugiere el nombre
   (`js/diagramly/Editor.js`). Acá no aporta nada —la webapp se sirve del disco— y
   arriesgaba servir una versión vieja tras actualizar el paquete, así que va con `pwa=0`.
3. **`merge` entra con `ignoreChange`**, así que un cambio venido del host no rebota como
   `autosave`. El autosave solo lo disparan los cambios reales del modelo.

### Decisiones de implementación

- **El XML vive en un ref del componente, no en el iframe.** Por eso cambiar de claro a
  oscuro puede rehacer el iframe —draw.io lee el tema al arrancar— sin perder nada.
- **Solo se atienden los mensajes cuyo `source` es nuestro iframe.** Por la ventana pasan
  `postMessage` de otras cosas, y confundir uno ajeno con un guardado escribiría el archivo.
- **Un `.drawio` no aporta aristas al grafo.** Es XML: escanearlo como prosa encontraría
  `[[…]]` dentro de los estilos y las etiquetas de las figuras. Es destino válido, no
  fuente. Mismo criterio que las bases y los canvas.

### Lo que quedó fuera de esta unidad

- **`.drawio.svg`**: descartado en § 4, no se implementó ninguna variante.
- **Medir el instalador**: el recorte se midió sobre la webapp comprimida (33,7 MB), no
  sobre un `tauri build` completo. Ver § 10.

## 10. Verificación

| Qué | Resultado |
|---|---|
| `npx tsc --noEmit` | verde |
| `cargo check` · `cargo test --lib archivos` | verde · 9 tests, incluido el del tipo `.drawio` |
| `npx next build` | verde — **es la prueba de que el export estático se banca la webapp**: 102 MB de estáticos en `public/`, y Next los copia sin atragantarse (~70 s) |
| `node --test scripts/test-drawio.mjs` | 9/9 |
| `node scripts/smoke-drawio.mjs` | 12/12, sin peticiones externas (CA7), sin 404 y sin errores de consola |

> [!warning] Lo que la verificación automática **no** prueba
> `tsc` en verde no prueba comportamiento. Lo que falta confirmar en la app es lo visible:
> que el editor se vea bien dentro de la pestaña, que el tema oscuro no desentone (CA6), y
> que crear/editar/guardar se sienta como una nota (CA1–CA3).
>
> **El tamaño del instalador no se midió**: hace falta un `tauri build` completo. Sobre el
> instalador de hoy (10,2 MB) y 33,7 MB de webapp comprimida, la estimación es **~35-42 MB**
> según cuánto mejore LZMA sobre deflate. El objetivo de § 3 era 30-35 MB: puede quedar
> justo por encima.

> [!info] Solo desktop, por decisión del usuario (2026-09-23)
> En teoría aplica a las dos versiones —el editor es frontend—, pero en `web-cloud` habría
> que sumar el tipo de archivo al backend .NET y decidir dónde vive la webapp. El foco está
> en desktop. Queda anotado en
> [[Diferencias funcionales aceptadas entre versiones]].

## Relacionadas

- [[BACKLOG]] — `FUN-L-20`, su tamaño y por qué va sola.
- [[canvas]] — el molde: el último tipo de archivo que se agregó, y todos los sitios que
  hubo que tocar.
- [[otros-tipos-de-archivo]] — lo que hoy se **ve** sin ser markdown.
- [[ia-framework-vault]] — qué indexa Mycelium y qué solo guarda.
- [[Bandeja de entrada]] — de dónde salió la idea.
- [[Mapa de documentacion]] — índice general.
