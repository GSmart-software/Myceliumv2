# Versión 2.0.0 de web

**Solo web** (`web-cloud`) · 2026-09-22 · un major sobre la 1.3.0 · commit `e412a8c`

> [!important] Esta numeración es de web, no de desktop
> Las dos líneas **no comparten numeración**. Que exista también una [[Version 2.0.0]] de
> escritorio —publicada el 2026-09-21— y que las dos digan `2.0.0` es **casualidad**: web
> venía de `1.3.0` y desktop de `1.7.0`. Se eligió el mismo número porque el criterio fue
> el mismo, no porque las líneas se hayan sincronizado. Ver [[Versionado del sistema]].

Un solo tema: **el rediseño de la interfaz llega a web**. Es el reflejo del experimento de
impeccable ([[Rediseñar la UI con impeccable]]), integrado a desktop el 2026-09-21 y usado
por el usuario antes de pedir el reflejo.

## Por qué major, y no minor

Por la regla sería **minor**: web gana funcionalidad y por dentro no hay rearquitectura —el
backend .NET, los formatos y los datos no se tocan—. Lo decidió el usuario, con el mismo
criterio que en desktop: lo que ve quien entra **cambia entero y de una vez** —la barra
superior es otra cosa, Configuración se mudó de sitio, y el aspecto por defecto es distinto
porque la atmósfera nueva se aplica sola—. Queda anotado para que no siente precedente.

## Qué entra

| Qué | ID | Spec |
|---|---|---|
| Paleta de notas y comandos en la barra superior (cierra `DEF-090`) | — | [[Rediseñar la UI con impeccable]] |
| Atmósferas: tercer eje del estilo, una por modo | `FUN-M-30` | [[atmosferas]] |
| Configuración en ventana centrada, con categorías y buscador | `FUN-M-32` | [[configuracion]] |
| Avisos con «Deshacer», diálogo propio, recientes, `Ctrl+Tab` | `FUN-M-33` | [[avisos-y-confirmaciones]] |
| Los ajustes dejan de perder lo escrito | `FUN-M-34` | [[configuracion]] |
| Un solo interruptor, buscador con sinónimos, `Ctrl+,` | `FUN-M-35` | [[configuracion]] |
| Barra de estado al pie, teclado en pestañas y árbol, «Saltar a la nota» | — | [[Rediseñar la UI con impeccable]] |
| Correcciones que viajan con el rediseño | `DEF-091` `DEF-092` `DEF-093` `DEF-095` `DEF-096` `DEF-097` | [[bugs-progreso]] |

**Una diferencia propia de web**: la categoría **Cuenta**. El perfil (`AccountSection`) y
«Cerrar sesión» vivían en el pie del panel viejo, visibles desde cualquier pestaña —también
desde Apariencia—; ahora están donde se decide sobre la cuenta.

## Lo que NO se refleja, y por qué

Ver [[Diferencias funcionales aceptadas entre versiones]].

- **Marco de ventana propio** (`FUN-M-31`): acá la ventana es la del navegador. Con él se
  quedan en desktop los botones de minimizar/maximizar/cerrar, las franjas de
  redimensionado, el menú de anclaje de Windows 11 y el ícono de la aplicación.
- **Terminal integrada** (`FUN-L-07`): por eso el explorador no ofrece «Abrir terminal
  aquí» y la paleta no tiene «Nueva consola».
- **Autoactualización** (`FUN-L-14` + `FUN-M-16`): la web se actualiza al recargar, así que
  el pie de Configuración solo dice la versión — no esconde el modo avanzado.
- **Visor de archivos sueltos** (`FUN-L-11`) y el editor del `.mycignore` (`FUN-M-11`):
  dependen de una carpeta en disco.

## Verificación

`npx tsc --noEmit` y `npx next build` en un worktree limpio de `web-cloud` con `npm ci`,
como pide [[Reflejar cambios de desktop a web]]. **Falta la prueba en la app**: el backend
.NET no se levantó en esta sesión, así que lo visible está sin confirmar. El aviso de
`::highlight()` del build ya existía antes del reflejo.

## Relacionadas

[[RAMAS]] · [[Version 2.0.0]] · [[Version 1.1.0 de web]] · [[Estado del proyecto]] ·
[[Mapa de documentacion]]
