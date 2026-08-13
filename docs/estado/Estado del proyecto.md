# Estado del proyecto

**Actualizado**: 2026-08-03 · rama activa `desktop-tauri`

Foto de dónde está Mycelium hoy. Para el detalle de cada tema, seguir los enlaces.

## Resumen

- **Versión: desktop `1.6.1`** ([[Version 1.6.1]], **sin publicar**) · **web `1.1.0`**
  ([[Version 1.1.0 de web]], 2026-08-08). Las dos líneas **no comparten numeración**.
  Web se puso al día con todo lo que le aplicaba; lo que sigue solo en desktop es lo que
  por naturaleza no le aplica (terminal, framework de IA, autoactualización).
- [[Version 1.0.0]] fue el primer release final en **ambas** versiones, con instaladores
  de escritorio generados.
- **Todos los bugs `DEF-*`** del reporte original cerrados y reflejados
  ([[bugs-progreso]]).
- Desde entonces, el foco está en la línea de **IA sobre el vault**
  ([[Mycelium como memoria de la IA]]), que avanza **solo en desktop**.

- **Ya no hacen falta instaladores manuales**: desde la 1.4.0 la app se autoactualiza, y el
  circuito quedó verificado con la 1.5.0. Los instaladores generados se preservan en
  `installers/v<version>/` (fuera de git). Ver [[Generar instaladores desktop]] y
  [[Publicar una version]].
- **La 1.5.0 publicada en R2 está desactualizada**: no lleva las correcciones del
  2026-08-03. Hasta que salga una `1.5.1`, quien se actualice recibe una versión que borra
  sin preguntar (`DEF-051`).

## Implementado después de 1.0.0

| Funcionalidad | Estado |
|---|---|
| [[terminal-integrada]] (`FUN-L-07`) | Implementada y confirmada por el usuario en lo esencial; pasó por varias iteraciones (panel de consolas, shells de fondo, renombrar, selector de shell, tema reactivo) |
| [[ia-framework-vault]] (`FUN-L-08`) | Implementada, framework en **v1.4.0** (describe las propiedades del frontmatter y las Esporas); pendiente de prueba de los comandos nuevos. **El vault de este repo tiene instalada la v1.2.0**: hay que regenerar desde Configuración → Vault |
| [[metadata-yaml]] (`FUN-M-04`) | **Confirmada** en desktop (1.2.0) el 2026-08-02 y **reflejada en web** el 2026-08-08 (el índice, reimplementado en el backend .NET): el frontmatter pasa a ser propiedades (tarjeta en lectura y en vivo, pestaña PROPIEDADES, tabla `propiedades` en el índice, filtro `clave:valor`). Ver [[Version 1.2.0]] y [[Version 1.1.0 de web]] |
| [[esporas-plantillas]] (`FUN-M-03`) | **Confirmada** en desktop (1.3.0) el 2026-08-03 y **reflejada en web** el 2026-08-08: las notas de una carpeta configurable son plantillas con variables, usables desde el panel del rail, la barra del editor y el clic derecho de una carpeta. Ver [[Version 1.3.0]] y [[Version 1.1.0 de web]] |
| [[autoactualizacion]] (`FUN-L-14` + `FUN-M-16`) | **Circuito confirmado de punta a punta** el 2026-08-03: se publicaron la 1.4.0 y la 1.5.0 en R2 y el usuario comprobó en la app que una instalación **detecta y aplica** la versión posterior. Mycelium comprueba una vez al día, muestra el changelog renderizado y ofrece instalar. Lo único que sigue **sin probar** es el modo avanzado (`FUN-M-16`, siete clics en el número de versión, para instalar una versión cualquiera o anterior): su diálogo de confirmación estuvo roto hasta `DEF-051`. Ver [[Version 1.4.0]] |
| Clave privada de firma | **Respaldada fuera de la máquina** (2026-08-08). Era el riesgo abierto del circuito de actualización: si se perdía, nadie podría volver a actualizarse y `tauri build` dejaría de compilar. Sigue sin decidirse si el `pubkey` y el `endpoint` se commitean — hoy son una modificación local, así que un checkout limpio compila con el updater apagado |
| [[Publicar una version]] (`FUN-L-15`) | `npm run publicar` compila, firma, sube y **verifica** (incluido el SHA-256 del instalador ya publicado). **Confirmado en uso real**: publicó la 1.4.0 y la 1.5.0 |
| [[mycignore]] (`FUN-M-11`) | Implementada en desktop (parser con tests); **parte web pendiente**. Su default se amplió en 1.1.1 |
| Rendimiento de la apertura del vault (`FUN-M-12`) | Implementada en desktop (1.1.1), **sin confirmar por el usuario**: no se pudo medir el efecto real. Ver [[Rendimiento de la apertura del vault]] |
| Navegación por pestaña (`DEF-039/040/041`) | **Confirmada** en desktop (1.1.5) el 2026-08-03 y **reflejada en web** el 2026-08-08: scroll conservado, historial propio por pestaña con botones. `DEF-041` quedó endurecido sin causa raíz confirmada, pero el síntoma no reapareció. Ver [[Version 1.1.5]] |
| [[bases-tabla]] (`FUN-L-03`) | Sale en la [[Version 1.6.0]]. **Implementada en las dos ramas** el 2026-08-08, **sin confirmar**: el archivo `.base` (formato de Obsidian) agrega notas por sus propiedades y las muestra en una tabla de solo lectura, con filtros. Se implementa un subconjunto cerrado del lenguaje de Bases; lo que no se entiende **no se ignora**, se declara. Sin release todavía |
| [[auditoria-y-relinkeado]] (`FUN-L-17`) | Sale en la [[Version 1.6.0]]. **Implementada en desktop** el 2026-08-08, **sin confirmar**: pantalla que audita las referencias sin estructura del vault y las convierte en `[[enlaces]]`, con simulacro, respaldo y deshacer. Con ella salió el **núcleo de `FUN-M-17`**, que no existía. Hoy **solo-desktop**: llevarla a web no es un reflejo (§ 17 de la spec) |
| [[canvas]] (`FUN-L-18`) | Sale en la [[Version 1.6.0]]. **Implementado en desktop** el 2026-08-08, **sin confirmar**: tipo de archivo `.canvas` (JSON Canvas, el de Obsidian) con lienzo infinito, tarjetas de markdown y de nota, y flechas. Construido **sin librería de nodos**; el parser conserva lo que todavía no edita para no borrar trabajo de un canvas ajeno. **Reflejado a web** el mismo día, salvo que allá un canvas todavía no aporta aristas al grafo |
| [[ventanas-multiples]] (`FUN-L-16`) | **Implementada en desktop** el 2026-08-13, **sin confirmar**: varios vaults a la vez, uno por ventana. La ventana pasa a ser el ámbito del watcher y de las terminales, que eran globales. Sale en la [[Version 1.6.1]] |
| Dock de pestañas del panel lateral | Generalizado a cualquier sección (`SidebarDock`) |

## Pendiente / próximos pasos

0. **Publicar la 1.6.0.** El número ya está puesto en los cinco archivos
   ([[Version 1.6.0]]) pero **no se generó instalador ni se subió a R2**: el usuario pidió
   corregir defectos antes. Hasta que se publique, quien se actualice sigue recibiendo la
   1.5.0 de R2, que **no** lleva las correcciones del 2026-08-03 y borra sin preguntar
   (`DEF-051`). El proceso está en [[Publicar una version]].

   > [!note] La `1.5.1` que estaba prevista ya no existe
   > Al entrar tres funcionalidades el salto pasó a **minor**, y un minor **absorbe** las
   > correcciones que vengan con él. Un release, un incremento ([[Versionado del sistema]]).
1. **Probar el modo avanzado del updater** (`FUN-M-16`): siete clics en el número de
   versión del pie → lista de versiones publicadas → instalar una anterior. Es lo único de
   la [[Version 1.4.0]] sin confirmar; su diálogo estuvo roto hasta `DEF-051`, así que
   nunca llegó a hacer nada.
2. **Probar la web en la app**: el reflejo del 2026-08-08 ([[Version 1.1.0 de web]]) pasó
   `tsc`, `next build`, `dotnet build` y un smoke contra la API, pero **nadie lo miró en
   pantalla**. Lo primero, un `POST /vaults/{id}/reindexar`: las notas guardadas antes no
   tienen sus propiedades en el índice.
3. **`.mycignore` en web** (`FUN-M-11`): lo único del bloque G que quedó fuera, porque no
   es un reflejo — en web la semántica sería otra (filtro de importación, con la config en
   el backend). Hay que definirla antes de implementarla.
4. **Verificar 1.1.1 en la app**: abrir un vault grande y comprobar que el indexado es
   más rápido y que se ve el avance. El `.mycignore` de este vault **ya se amplió**
   (2026-08-01) con `node_modules/`, `target/`, `out/`, `dist/`, `installers/`,
   `installer/`, `backend/` y `scripts/`: pasó de 1830 archivos indexados a **63**, de
   4020 directorios a **110** y de 14 MB a **495 KB**. Hacía falta a mano porque el
   archivo ya existía y un `.mycignore` presente reemplaza al default (ver [[mycignore]]).
5. **Probar** `/vault-buscar` y `/vault-recordar` del framework v1.4.0 en un vault real (hay que **regenerarlo** antes: este vault tiene la v1.2.0).
6. **Reflejar a web** lo que corresponda de la línea de IA: por naturaleza, poco o nada
   (ver [[Diferencias funcionales aceptadas entre versiones]]).
7. **Backlog de funcionalidades**: [[BACKLOG]] tiene el inventario completo con tamaños
   (`FUN-S/M/L/XL`) y, en su § 7, **la agrupación en releases**: qué conviene trabajar
   junto porque comparte subsistema, qué va solo y qué puede viajar de acompañante. No
   impone orden — el orden lo decidís vos. Con `FUN-M-04` hecho queda
   **desbloqueado `FUN-L-03`** (archivos tabla): la tabla `propiedades` del índice es de
   donde leería. Sus dos continuaciones directas son `FUN-M-15` (enlaces por `aliases`) y
   `FUN-S-08` (`cssclasses`), que la spec dejó fuera a propósito. Con `FUN-M-03` hecho,
   **`FUN-M-07`** (Daily Note) ya tiene de dónde tomar la plantilla y la sustitución.
8. **`FUN-L-09`** — servidor MCP de Mycelium, el paso siguiente de la línea de IA.
10. **Continuaciones de `FUN-M-12`**: `FUN-M-14` (reindex dirigido por el watcher, el más
   valioso de los tres), `FUN-M-13` (un solo recorrido) y `FUN-L-10` (indexado en Rust).

## Deuda y cosas a tener en cuenta

> [!warning] Documentación desactualizada
> - [[DESKTOP-LOCAL]] describe el empaquetado **pre-Tauri** (datos en Cloudflare, Inno
>   Setup). Reemplazado por [[Generar instaladores desktop]]; se conserva como historia.
> - [[Roadmap general]] es un documento de *brainstorming* previo, con líneas truncadas.
>   Útil como contexto histórico, no como referencia.
> - El [[README]] describe la estructura de la línea **web** (menciona `backend/`,
>   `legacy/`), que no existen en `desktop-tauri`.

> [!info] Pendientes operativos
> - **Ramas históricas limpiadas (2026-08-01)**: `local` y `deploy/cloudflare` se
>   **borraron** tras verificar que no tenían commits propios (eran ancestros de las dos
>   ramas de trabajo). `main` se mantiene porque es la rama por defecto en GitHub.
>   Detalle y verificación en [[RAMAS]]; el contenido de la línea de despliegue quedó
>   documentado en [[Despliegue de la web en Cloudflare]].
> - **`origin` desalineado a propósito**: tiene `desktop-cloud`, `main`,
>   `deploy/cloudflare`; los renombres se hicieron en local. Ninguna remota tiene trabajo
>   exclusivo, pero `origin/main` está **204 commits** por detrás: el repo público es una
>   foto de junio. Los comandos para alinearlo están en [[RAMAS]], **pendientes de
>   confirmación** del usuario (nada de `push` sin pedirlo — ver
>   [[Convenciones de commits]]).
> - **`DEF-018`** quedó marcado como evaluado y correcto por el usuario.
> - `frontend/src-tauri/Cargo.toml` puede aparecer como modificado por diferencia de
>   fin de línea (CRLF/LF): es ruido del working tree, no un cambio real.

## Relacionadas

- [[Mapa de documentacion]] — índice general de la documentación.
- [[Arquitectura de Mycelium]] — cómo está construido.
- [[BACKLOG]] — qué falta y con qué tamaño.
- [[HUs]] — historias de usuario del producto.
- [[Aprendizajes tecnicos]] — lo aprendido en el camino.
