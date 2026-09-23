# Versión 2.1.0 de web

**Solo web** (`web-cloud`) · 2026-09-23 · un minor sobre la [[Version 2.0.0 de web]]

> [!important] Esta numeración es de web, no de desktop
> Las dos líneas **no comparten numeración**. Que exista también una [[Version 2.1.0]] de
> escritorio con el mismo número es **continuación de la casualidad** que empezó en la
> 2.0.0: las dos venían de ahí y las dos suben un minor a la vez, porque el reflejo se hizo
> el mismo día. No están sincronizadas. Ver [[Versionado del sistema]].

El **reflejo** de la tanda que salió en la [[Version 2.1.0]] de escritorio, con lo que a web
le aplica.

## Qué entra

| Qué | ID | Spec |
|---|---|---|
| El reproductor de YouTube (y Vimeo) dentro de la nota | `FUN-S-21` | [[video-embebido]] |
| Un enlace web abre una **pestaña nueva** en vez de llevarse la sesión | `FUN-S-20` · `DEF-101` | [[enlaces-externos]] |
| Los enlaces a un `.canvas` o a un `.base` vuelven a resolver | `FUN-S-03` | — |

## Lo que NO le llega, y por qué

- **draw.io** (`FUN-L-20`): la webapp va **empaquetada dentro del instalador** para que
  funcione sin conexión, y eso no tiene equivalente en web. Además el tipo de archivo vive
  en la carpeta del vault, que allá no existe. Decisión del usuario, anotada en
  [[Diferencias funcionales aceptadas entre versiones]].
- **`DEF-099`/`DEF-100`** (el ámbito de las consolas): la terminal es solo-desktop.

## Dos diferencias de comportamiento, a propósito

- **El enlace externo abre una pestaña nueva**, no el navegador del sistema: en web *ya
  estás* en el navegador. Lo que sí es igual es la parte que decide —solo `http:`, `https:`
  y `mailto:`— y que el manejador sea uno solo para todas las vistas. Se abre con
  `noopener,noreferrer`, que no es adorno: sin `noopener`, la página destino recibe un
  `window.opener` con el que puede redirigir la pestaña de Mycelium.
- **El `DEF-101` no era grave acá.** En una pestaña del navegador, navegar es lo normal y el
  botón de atrás vuelve; en escritorio la ventana no tiene barra de dirección y el usuario
  se quedaba sin aplicación. Se refleja igual porque abrir en pestaña nueva es lo correcto
  para una app de una sola página.

## Un defecto latente que se cerró de paso

La resolución de enlaces recortaba extensiones de una lista escrita a mano que solo conocía
`.excalidraw` y `.md`. En web eso dejaba `[[Lienzo.canvas]]` y `[[Tareas.base]]` estilizados
como **inexistentes**, aunque el archivo estuviera ahí. Vino arreglado con
`lib/extensionesDeTipo.ts`, que en web tiene **cuatro** entradas en vez de cinco: allá no
existe el tipo `drawio`.

## Verificación

`npm ci` · `tsc` · `next build` · `node --test`: **344 tests, 336 pasan, 0 fallan**, 8
`skip` preexistentes. Repetido sobre el árbol final, después de repartir los commits.

> [!warning] Sin publicar
> Esta versión **no se desplegó**: el usuario pidió publicar la de escritorio. El despliegue
> de web es aparte (`npm run deploy:pages`).

## Relacionadas

- [[Version 2.1.0]] — la de escritorio, de donde viene el reflejo.
- [[Version 2.0.0 de web]] — la anterior de esta línea.
- [[video-embebido]] · [[enlaces-externos]] — las specs.
- [[RAMAS]] — qué quedó compartido y qué divergiendo después de este reflejo.
- [[Reflejar cambios de desktop a web]] — la receta que se siguió.
- [[Mapa de documentacion]] — índice general.
