# Estado del proyecto

**Actualizado**: 2026-08-03 · rama activa `desktop-tauri`

Foto de dónde está Mycelium hoy. Para el detalle de cada tema, seguir los enlaces.

## Resumen

- **Versión: desktop `1.5.0`** ([[Version 1.5.0]]) · **web `1.1.0`**
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

## Implementado después de 1.0.0 (solo desktop)

| Funcionalidad | Estado |
|---|---|
| [[terminal-integrada]] (`FUN-L-07`) | Implementada y confirmada por el usuario en lo esencial; pasó por varias iteraciones (panel de consolas, shells de fondo, renombrar, selector de shell, tema reactivo) |
| [[ia-framework-vault]] (`FUN-L-08`) | Implementada, framework en **v1.4.0** (describe las propiedades del frontmatter y las Esporas); pendiente de prueba de los comandos nuevos. **El vault de este repo tiene instalada la v1.2.0**: hay que regenerar desde Configuración → Vault |
| [[metadata-yaml]] (`FUN-M-04`) | **Confirmada** en desktop (1.2.0) el 2026-08-02 y **reflejada en web** el 2026-08-08 (el índice, reimplementado en el backend .NET): el frontmatter pasa a ser propiedades (tarjeta en lectura y en vivo, pestaña PROPIEDADES, tabla `propiedades` en el índice, filtro `clave:valor`). Ver [[Version 1.2.0]] y [[Version 1.1.0 de web]] |
| [[esporas-plantillas]] (`FUN-M-03`) | **Confirmada** en desktop (1.3.0) el 2026-08-03 y **reflejada en web** el 2026-08-08: las notas de una carpeta configurable son plantillas con variables, usables desde el panel del rail, la barra del editor y el clic derecho de una carpeta. Ver [[Version 1.3.0]] y [[Version 1.1.0 de web]] |
| [[autoactualizacion]] (`FUN-L-14` + `FUN-M-16`) | **Circuito confirmado de punta a punta** el 2026-08-03: se publicaron la 1.4.0 y la 1.5.0 en R2 y el usuario comprobó en la app que una instalación **detecta y aplica** la versión posterior. Mycelium comprueba una vez al día, muestra el changelog renderizado y ofrece instalar. Lo único que sigue **sin probar** es el modo avanzado (`FUN-M-16`, siete clics en el número de versión, para instalar una versión cualquiera o anterior): su diálogo de confirmación estuvo roto hasta `DEF-051`. Ver [[Version 1.4.0]] |
| [[Publicar una version]] (`FUN-L-15`) | `npm run publicar` compila, firma, sube y **verifica** (incluido el SHA-256 del instalador ya publicado). **Confirmado en uso real**: publicó la 1.4.0 y la 1.5.0 |
| [[mycignore]] (`FUN-M-11`) | Implementada en desktop (parser con tests); **parte web pendiente**. Su default se amplió en 1.1.1 |
| Rendimiento de la apertura del vault (`FUN-M-12`) | Implementada en desktop (1.1.1), **sin confirmar por el usuario**: no se pudo medir el efecto real. Ver [[Rendimiento de la apertura del vault]] |
| Navegación por pestaña (`DEF-039/040/041`) | **Confirmada** en desktop (1.1.5) el 2026-08-03 y **reflejada en web** el 2026-08-08: scroll conservado, historial propio por pestaña con botones. `DEF-041` quedó endurecido sin causa raíz confirmada, pero el síntoma no reapareció. Ver [[Version 1.1.5]] |
| Dock de pestañas del panel lateral | Generalizado a cualquier sección (`SidebarDock`) |

## Pendiente / próximos pasos

0. **Copia de seguridad de la clave privada de firma** fuera de la máquina: si se pierde,
   **nadie** puede volver a actualizarse y no hay forma de recuperarlo. Es lo más urgente
   que queda del circuito de actualización, que por lo demás ya está confirmado de punta a
   punta (se publicaron la 1.4.0 y la 1.5.0, y una instalación detectó y aplicó la
   posterior). Sigue abierto decidir si el `pubkey` y el `endpoint` se commitean (hoy son
   una modificación local: un checkout limpio compila con el updater apagado).
   Ojo: desde ahora `tauri build` **falla sin la clave**, así que esto bloquea también
   generar cualquier instalador.
1. **Publicar una 1.5.1**: la 1.5.0 que está en R2 **no** lleva las correcciones del
   2026-08-03 (`DEF-046`, `DEF-049`, `DEF-050`, `DEF-051` y la papelera del sistema
   operativo). Quien se actualice hoy recibe una versión con el borrado sin confirmar.
2. **Probar el modo avanzado del updater** (`FUN-M-16`): siete clics en el número de
   versión del pie → lista de versiones publicadas → instalar una anterior. Es lo único de
   la [[Version 1.4.0]] sin confirmar; su diálogo estuvo roto hasta `DEF-051`, así que
   nunca llegó a hacer nada.
3. **Probar la web en la app**: el reflejo del 2026-08-08 ([[Version 1.1.0 de web]]) pasó
   `tsc`, `next build`, `dotnet build` y un smoke contra la API, pero **nadie lo miró en
   pantalla**. Lo primero, un `POST /vaults/{id}/reindexar`: las notas guardadas antes no
   tienen sus propiedades en el índice.
4. **`.mycignore` en web** (`FUN-M-11`): lo único del bloque G que quedó fuera, porque no
   es un reflejo — en web la semántica sería otra (filtro de importación, con la config en
   el backend). Hay que definirla antes de implementarla.
5. **Verificar 1.1.1 en la app**: abrir un vault grande y comprobar que el indexado es
   más rápido y que se ve el avance. El `.mycignore` de este vault **ya se amplió**
   (2026-08-01) con `node_modules/`, `target/`, `out/`, `dist/`, `installers/`,
   `installer/`, `backend/` y `scripts/`: pasó de 1830 archivos indexados a **63**, de
   4020 directorios a **110** y de 14 MB a **495 KB**. Hacía falta a mano porque el
   archivo ya existía y un `.mycignore` presente reemplaza al default (ver [[mycignore]]).
6. **Probar** `/vault-buscar` y `/vault-recordar` del framework v1.4.0 en un vault real (hay que **regenerarlo** antes: este vault tiene la v1.2.0).
7. **Reflejar a web** lo que corresponda de la línea de IA: por naturaleza, poco o nada
   (ver [[Diferencias funcionales aceptadas entre versiones]]).
8. **Backlog de funcionalidades**: [[BACKLOG]] tiene el inventario completo con tamaños
   (`FUN-S/M/L/XL`) y, en su § 7, **la agrupación en releases**: qué conviene trabajar
   junto porque comparte subsistema, qué va solo y qué puede viajar de acompañante. No
   impone orden — el orden lo decidís vos. Con `FUN-M-04` hecho queda
   **desbloqueado `FUN-L-03`** (archivos tabla): la tabla `propiedades` del índice es de
   donde leería. Sus dos continuaciones directas son `FUN-M-15` (enlaces por `aliases`) y
   `FUN-S-08` (`cssclasses`), que la spec dejó fuera a propósito. Con `FUN-M-03` hecho,
   **`FUN-M-07`** (Daily Note) ya tiene de dónde tomar la plantilla y la sustitución.
9. **`FUN-L-09`** — servidor MCP de Mycelium, el paso siguiente de la línea de IA.
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
