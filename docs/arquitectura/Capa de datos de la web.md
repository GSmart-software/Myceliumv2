# Capa de datos de la web

Cómo persiste Mycelium en la versión web (`web-cloud`). Parte de
[[Arquitectura de Mycelium]]. Es la mitad **menos** trabajada en las sesiones recientes
(el foco estuvo en desktop), así que esta nota es más breve a propósito.

## Forma

- **Backend .NET 9** (minimal API) en `backend/src/Micelio.Api`, sin prefijo `/api` en
  las rutas (p. ej. `POST /auth/login`).
- **Puertos** `ID1Client` (datos) e `IBlobStorage` (archivos) con dos juegos de
  adaptadores:
  - **local** — SQLite (`micelio.local.db`) + disco (`.local-storage/blobs/`),
  - **Cloudflare** — D1 + R2, hoy **stubs** (ver `FUN-XL-03` en [[BACKLOG]]).
- Se elige con `Storage:Provider` en `appsettings`. Todo corre en modo `local`.
- El frontend habla con él vía `lib/api.ts` como **cliente HTTP** (en desktop el mismo
  archivo es un dispatcher local — es la costura de la arquitectura).

## Diferencias de fondo con el desktop

| | Web | Desktop |
|---|---|---|
| Fuente de verdad | Base de datos del backend | Archivos en la carpeta del vault |
| Identidad de nota | Id opaco (UUID) | **Ruta relativa** |
| Usuarios | Login email + contraseña | Sin login |
| Archivos en disco | No (blobs gestionados) | Sí, el vault es una carpeta |

> [!important] Por qué importa para reflejar cambios
> Que la web **no tenga carpeta en disco** hace que algunas funcionalidades no se
> puedan "reflejar", solo re-imaginar. Ejemplos: [[mycignore]] (no hay árbol de archivos
> que ignorar al indexar) y la [[terminal-integrada]] (no hay shell). Ver
> [[Diferencias funcionales aceptadas entre versiones]].

## Colaboración (preparada, no activa)

La arquitectura de doble modo está **implementada**: puerto `ICollabRelay` con
adaptadores `LocalCollabRelay` (deshabilitado) y `DurableObjectCollabRelay`, endpoint
`GET /notas/{id}/colaboracion`, y en el frontend Yjs + y-codemirror + y-websocket +
y-indexeddb cargados dinámicamente en el editor.

**En local viene deshabilitada** (no hay relay), así que las notas compartidas se editan
por turnos. Para activarla hace falta implementar el Durable Object y configurar
`Collab:RelayBaseUrl` con `Storage:Provider=cloudflare` (`FUN-XL-02` en [[BACKLOG]]).

## Datos locales de desarrollo

> [!danger] No borrar
> `backend/src/Micelio.Api/micelio.local.db` y `.local-storage/blobs/` están **fuera de
> git** y contienen el vault real de pruebas del usuario. El README los llama
> "desechables": **no lo son**. Ver [[Levantar Mycelium en desarrollo]].

## Relacionadas

- [[Capa de datos del desktop]] — la contraparte.
- [[RAMAS]] — artefactos que existen solo en esta rama (`backend/`, `legacy/`, wrangler…).
- [[BACKLOG]] — `FUN-XL-02`, `FUN-XL-03`, `FUN-M-09`, `FUN-M-10` son de esta línea.
- [[Arquitectura de Mycelium]] — visión general.
