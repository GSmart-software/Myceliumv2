# Implementaciones futuras

Funcionalidades referenciadas por las HUs pero explícitamente fuera del alcance
de la versión actual. Cada entrada indica la HU que la menciona.

## Tags
- **Panel de tags del rail** (HU-28): el ícono `Tag` del rail abre hoy un panel
  placeholder. La UI completa (listado de tags del vault, conteo, filtrado por tag)
  queda para una versión futura.
- **Tags como nodos del grafo** (HU-30): el mini-grafo del panel derecho y el grafo
  global no muestran tags como nodos en esta versión.

## Daily Note
- **Ícono `CalendarDays` del rail** (HU-28): placeholder sin efecto. La funcionalidad
  de nota diaria (crear/abrir la nota del día con plantilla) queda para futuro.

## Pestañas
- **Pinning de pestañas** (HU-25): sin fijar pestañas en esta versión.
- **Persistencia de pestañas y splits al recargar** (HU-25, HU-26): el layout de
  panes y las pestañas abiertas no se restauran tras recargar la página.

## Notas y enlaces
- **Reescritura de `[[enlaces]]` al renombrar una nota** (HU-23): renombrar
  actualiza `notas.titulo`, pero los `[[enlaces]]` que apuntan al título viejo
  no se reescriben todavía.

## Colaboración
- **Edición simultánea en tiempo real + presencia** (HU-05/HU-06/HU-37): la
  compartición de carpetas con roles (HU-35/HU-36) está completa y el control
  de acceso por rol efectivo se aplica en el backend. La edición concurrente
  Yjs (CRDT), el relay de updates y los cursores de presencia quedan diferidos
  a la integración Cloudflare: el roadmap define el relay como puerto
  `ICollabRelay` (adaptador local WebSocket en .NET y futuro Durable Object).
  Hoy las notas compartidas son editables por turnos (cada cliente sincroniza
  su contenido vía HU-04); el merge CRDT en vivo es el paso siguiente.
- **Historial de versiones** (HU-37): registrar qué miembro realizó cada cambio
  queda para una implementación futura.

## Import / Export
- **Adjuntos en la importación** (HU-07/HU-11): la importación de Obsidian
  preserva notas `.md` y la estructura de carpetas, pero los adjuntos
  (`.png`, `.jpg`, `.pdf`, `.svg`, `.excalidraw` sueltos) se reportan como
  omitidos en el resumen porque aún no existe un subsistema de adjuntos.
- **Exportar ZIP de vaults ≥ 200 MB en el servidor** (HU-09 CA5): la
  exportación ZIP corre 100% en el cliente (JSZip). La rama de compresión
  delegada al servidor con polling de progreso queda diferida.

## Auth
- **OAuth de GitHub** (HU-32 CA2): requiere registrar una OAuth App de GitHub y
  sus credenciales (`Auth:GitHub:ClientId/ClientSecret`). El flujo
  email+contraseña está completo; el botón de GitHub se agrega al integrar
  las credenciales.

## Infraestructura
- **Integración Cloudflare (D1, R2, Durable Objects)**: los adaptadores
  `Adapters/Cloudflare` del backend son stubs. Todo corre en modo local
  (`Storage:Provider=local`) hasta que se active la integración.
