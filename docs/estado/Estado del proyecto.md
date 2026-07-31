# Estado del proyecto

**Actualizado**: 2026-07-31 · rama activa `desktop-tauri`

Foto de dónde está Mycelium hoy. Para el detalle de cada tema, seguir los enlaces.

## Resumen

- **Versión: desktop `1.1.0`** ([[Version 1.1.0]]) · **web `1.0.0`** ([[Version 1.0.0]]).
  Las líneas se separaron: todo lo nuevo es solo-desktop.
- [[Version 1.0.0]] fue el primer release final en **ambas** versiones, con instaladores
  de escritorio generados.
- **Todos los bugs `DEF-*`** del reporte original cerrados y reflejados
  ([[bugs-progreso]]).
- Desde entonces, el foco está en la línea de **IA sobre el vault**
  ([[Mycelium como memoria de la IA]]), que avanza **solo en desktop**.

- **Instaladores de 1.1.0 generados** (MSI 9.8 MB y NSIS 8.4 MB, preservados en
  `installers/v1.1.0/`). Son los primeros que incluyen las **devtools en producción**.
  Ver [[Generar instaladores desktop]].

## Implementado después de 1.0.0 (solo desktop)

| Funcionalidad | Estado |
|---|---|
| [[terminal-integrada]] (`FUN-L-07`) | Implementada y confirmada por el usuario en lo esencial; pasó por varias iteraciones (panel de consolas, shells de fondo, renombrar, selector de shell, tema reactivo) |
| [[ia-framework-vault]] (`FUN-L-08`) | Implementada, framework en **v1.2.0** (reenfoque a memoria); pendiente de prueba de los comandos nuevos |
| [[mycignore]] (`FUN-M-11`) | Implementada en desktop (parser con tests); **parte web pendiente** |
| Dock de pestañas del panel lateral | Generalizado a cualquier sección (`SidebarDock`) |

## Pendiente / próximos pasos

1. **Probar** `/vault-buscar` y `/vault-recordar` del framework v1.2.0 en un vault real.
2. **`.mycignore` en web** — requiere decidir la semántica (filtro de importación +
   visualización) y tocar el backend .NET. Registrado en [[BACKLOG]].
3. **Reflejar a web** lo que corresponda de la línea de IA: por naturaleza, poco o nada
   (ver [[Diferencias funcionales aceptadas entre versiones]]).
4. **Backlog de funcionalidades**: [[BACKLOG]] tiene el inventario completo con tamaños
   (`FUN-S/M/L/XL`) y un secuenciado tentativo por versiones. Lo próximo natural en
   valor/esfuerzo son las `FUN-S-*` y `FUN-M-04` (metadatos YAML), que desbloquea
   `FUN-L-03` (archivos tabla).
5. **`FUN-L-09`** — servidor MCP de Mycelium, el paso siguiente de la línea de IA.

## Deuda y cosas a tener en cuenta

> [!warning] Documentación desactualizada
> - [[DESKTOP-LOCAL]] describe el empaquetado **pre-Tauri** (datos en Cloudflare, Inno
>   Setup). Reemplazado por [[Generar instaladores desktop]]; se conserva como historia.
> - [[Roadmap general]] es un documento de *brainstorming* previo, con líneas truncadas.
>   Útil como contexto histórico, no como referencia.
> - El [[README]] describe la estructura de la línea **web** (menciona `backend/`,
>   `legacy/`), que no existen en `desktop-tauri`.

> [!info] Pendientes operativos
> - **`origin` desalineado a propósito**: tiene `desktop-cloud`, `main`,
>   `deploy/cloudflare`; los renombres se hicieron en local. Los comandos para alinearlo
>   están en [[RAMAS]], **pendientes de confirmación** del usuario (nada de `push` sin
>   pedirlo — ver [[Convenciones de commits]]).
> - **`DEF-018`** quedó marcado como evaluado y correcto por el usuario.
> - `frontend/src-tauri/Cargo.toml` puede aparecer como modificado por diferencia de
>   fin de línea (CRLF/LF): es ruido del working tree, no un cambio real.

## Relacionadas

- [[Mapa de documentacion]] — índice general de la documentación.
- [[Arquitectura de Mycelium]] — cómo está construido.
- [[BACKLOG]] — qué falta y con qué tamaño.
- [[HUs]] — historias de usuario del producto.
- [[Aprendizajes tecnicos]] — lo aprendido en el camino.
