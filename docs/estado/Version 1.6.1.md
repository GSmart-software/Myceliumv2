# Versión 1.6.1

> [!warning] Esta versión **nunca se publicó**
> Nadie la tiene instalada: quedó absorbida por la [[Version 1.6.2]], que es la que salta
> desde la 1.5.0 y cuyo changelog cubre las tres. Esta nota se conserva por el detalle de qué
> entró y por qué, no como un release que alguien haya recibido.

**Solo desktop** (`desktop-tauri`) · 2026-08-13 · sobre [[Version 1.6.0]]

Dos cosas: **varios vaults abiertos a la vez, uno por ventana** (`FUN-L-16`) y la tanda de
correcciones que vino con ella (`DEF-042`, `DEF-044`, `DEF-047`, `DEF-048`, `DEF-052`,
`DEF-053`, `DEF-054`).

> [!important] El dígito lo eligió el usuario, no la regla
> Por [[Versionado del sistema]] esto sería **minor**: `FUN-L-16` es capacidad nueva —se
> puede hacer algo que antes no se podía—. El usuario decidió mantener `1.6.x`, y queda
> anotado acá para que dentro de un tiempo no parezca un descuido ni siente precedente. La
> regla sigue siendo la de siempre.

## Qué entra

| Qué | ID |
|---|---|
| Varios vaults a la vez, uno por ventana | `FUN-L-16` · [[ventanas-multiples]] |
| Pantalla de carga al abrir un vault, con etapas y aviso de atasco | `DEF-042` |
| Cada vault recuerda sus propias pestañas | `DEF-044` |
| El menú contextual y las opciones del grafo caben en pantalla | `DEF-047` · `DEF-053` |
| Aire bajo el área de contenido | `DEF-048` |
| Abrir un vault deja de recorrer lo que `.mycignore` ignora | `DEF-052` |
| El grafo se actualiza también con cambios hechos desde fuera | `DEF-054` |

`DEF-052` y `DEF-054` los encontró el usuario **gracias a** la pantalla de carga de
`DEF-042`: hasta entonces el tiempo y la desactualización estaban ahí, pero repartidos
dentro de un spinner mudo.

<!-- notas-release:inicio -->
## Varios vaults a la vez

- **Una ventana por vault.** Desde el selector, «Abrir en una ventana nueva» te deja
  consultar dos vaults en paralelo — trabajo y personal, o uno de referencia mientras
  escribís en otro. Cada ventana lleva sus pestañas, su grafo y sus consolas.
- Un mismo vault no se abre dos veces: si ya está abierto, se levanta su ventana.

## Y varias cosas que molestaban

- Al abrir un vault ahora hay una **pantalla de carga** que dice en qué está trabajando, cómo
  va y si algo se atascó — en vez de escribir el progreso en todos los botones a la vez.
- **Abrir un vault es bastante más rápido**: se dejaron de recorrer las carpetas que
  `.mycignore` ignora.
- Cada vault **recuerda sus propias pestañas**; ya no aparecen las del anterior.
- El **grafo se actualiza** también cuando el archivo lo crea algo de fuera de Mycelium.
- El menú del clic derecho y las opciones del grafo **ya no se salen de la pantalla**.
- El contenido deja un poco de aire abajo, en vez de morir pegado al borde.
<!-- notas-release:fin -->

## Cómo comprobarlo en la app

Los pasos de `FUN-L-16` están en [[ventanas-multiples]] § 5. En resumen: abrir A en la
ventana principal, B en una nueva, crear un archivo en la carpeta de A desde fuera y
comprobar que **solo** se refresca la ventana de A; abrir una consola en cada una y ver que
la salida no se cruza; cerrar la de B y comprobar que sus shells mueren y que B se puede
volver a abrir.

## Lo que sigue pendiente

- **Publicar.** Ni la 1.6.0 ni esta se subieron a R2: quien se actualice sigue recibiendo la
  1.5.0, que borra sin preguntar (`DEF-051`).
- Restaurar el **juego de ventanas** al arrancar: hoy se abre una sola.
- El **framework de IA** sigue en `1.4.0` y no conoce los `.base`, los `.canvas` ni el
  léxico de referencias. Decisión del usuario: se deja así hasta que haga falta.
- `FUN-M-16` (modo avanzado del updater) sigue sin probarse.

## Relacionadas

- [[Version 1.6.0]] — la versión anterior.
- [[ventanas-multiples]] — la spec de `FUN-L-16`.
- [[Versionado del sistema]] — la regla que acá se dejó de lado a propósito.
- [[bugs-progreso]] — la trazabilidad de los `DEF-*`.
- [[Mapa de documentacion]] — índice general.
