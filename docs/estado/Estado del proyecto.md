# Estado del proyecto

**Actualizado**: 2026-08-02 · rama activa `desktop-tauri`

Foto de dónde está Mycelium hoy. Para el detalle de cada tema, seguir los enlaces.

## Resumen

- **Versión: desktop `1.2.0`** ([[Version 1.2.0]]) · **web `1.0.0`** ([[Version 1.0.0]]).
  Las líneas se separaron: todo lo nuevo es solo-desktop.
- [[Version 1.0.0]] fue el primer release final en **ambas** versiones, con instaladores
  de escritorio generados.
- **Todos los bugs `DEF-*`** del reporte original cerrados y reflejados
  ([[bugs-progreso]]).
- Desde entonces, el foco está en la línea de **IA sobre el vault**
  ([[Mycelium como memoria de la IA]]), que avanza **solo en desktop**.

- **Instaladores de 1.1.0 generados** (MSI 9.8 MB y NSIS 8.4 MB, preservados en
  `installers/v1.1.0/`). Son los primeros que incluyen las **devtools en producción**.
  Ver [[Generar instaladores desktop]]. **Los de 1.1.1 todavía no se generaron.**

## Implementado después de 1.0.0 (solo desktop)

| Funcionalidad | Estado |
|---|---|
| [[terminal-integrada]] (`FUN-L-07`) | Implementada y confirmada por el usuario en lo esencial; pasó por varias iteraciones (panel de consolas, shells de fondo, renombrar, selector de shell, tema reactivo) |
| [[ia-framework-vault]] (`FUN-L-08`) | Implementada, framework en **v1.3.0** (describe las propiedades del frontmatter); pendiente de prueba de los comandos nuevos. **El vault de este repo tiene instalada la v1.2.0**: hay que regenerar desde Configuración → Vault |
| [[metadata-yaml]] (`FUN-M-04`) | Implementada en desktop (1.2.0), **sin confirmar**: el frontmatter pasa a ser propiedades (tarjeta en lectura y en vivo, pestaña PROPIEDADES, tabla `propiedades` en el índice, filtro `clave:valor`). Ver [[Version 1.2.0]] |
| [[mycignore]] (`FUN-M-11`) | Implementada en desktop (parser con tests); **parte web pendiente**. Su default se amplió en 1.1.1 |
| Rendimiento de la apertura del vault (`FUN-M-12`) | Implementada en desktop (1.1.1), **sin confirmar por el usuario**: no se pudo medir el efecto real. Ver [[Rendimiento de la apertura del vault]] |
| Navegación por pestaña (`DEF-039/040/041`) | Implementada en desktop (1.1.5), **sin confirmar**: scroll conservado, historial propio por pestaña con botones. `DEF-041` quedó endurecido sin causa raíz confirmada. Ver [[Version 1.1.5]] |
| Dock de pestañas del panel lateral | Generalizado a cualquier sección (`SidebarDock`) |

## Pendiente / próximos pasos

1. **Comprobar 1.2.0 en la app** (`FUN-M-04`, metadatos YAML): el paso a paso de los 12
   criterios está en [[Version 1.2.0]]. Lo más delicado es la **no-regresión** de
   `DEF-031`/`DEF-037` — hay un widget de bloque nuevo en la vista en vivo. Después,
   **reflejar a web**.
2. **Comprobar 1.1.5 en la app** (`DEF-039/040/041`): el paso a paso está en
   [[Version 1.1.5]]. `DEF-041` es el que más riesgo tiene de seguir vivo: se endureció
   sin haber reproducido la causa raíz. Después, **reflejar a web**.
3. **Verificar 1.1.1 en la app**: abrir un vault grande y comprobar que el indexado es
   más rápido y que se ve el avance. El `.mycignore` de este vault **ya se amplió**
   (2026-08-01) con `node_modules/`, `target/`, `out/`, `dist/`, `installers/`,
   `installer/`, `backend/` y `scripts/`: pasó de 1830 archivos indexados a **63**, de
   4020 directorios a **110** y de 14 MB a **495 KB**. Hacía falta a mano porque el
   archivo ya existía y un `.mycignore` presente reemplaza al default (ver [[mycignore]]).
4. **Probar** `/vault-buscar` y `/vault-recordar` del framework v1.3.0 en un vault real (hay que **regenerarlo** antes: este vault tiene la v1.2.0).
5. **`.mycignore` en web** — requiere decidir la semántica (filtro de importación +
   visualización) y tocar el backend .NET. Registrado en [[BACKLOG]].
6. **Reflejar a web** lo que corresponda de la línea de IA: por naturaleza, poco o nada
   (ver [[Diferencias funcionales aceptadas entre versiones]]).
7. **Backlog de funcionalidades**: [[BACKLOG]] tiene el inventario completo con tamaños
   (`FUN-S/M/L/XL`) y un secuenciado tentativo por versiones. Con `FUN-M-04` hecho queda
   **desbloqueado `FUN-L-03`** (archivos tabla): la tabla `propiedades` del índice es de
   donde leería. Sus dos continuaciones directas son `FUN-M-15` (enlaces por `aliases`) y
   `FUN-S-08` (`cssclasses`), que la spec dejó fuera a propósito.
8. **`FUN-L-09`** — servidor MCP de Mycelium, el paso siguiente de la línea de IA.
9. **Continuaciones de `FUN-M-12`**: `FUN-M-14` (reindex dirigido por el watcher, el más
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
