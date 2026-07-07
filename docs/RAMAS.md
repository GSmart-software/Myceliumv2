# Ramas y flujo de trabajo (web + desktop)

Mycelium se mantiene en **dos versiones** que comparten casi todo el frontend y
solo divergen en la capa de datos.

## Ramas

| Rama | Versión | Capa de datos | Notas |
|---|---|---|---|
| **`desktop-tauri`** | **Desktop** (app Tauri) | `frontend/lib/db/*` → SQLite nativo (`tauri-plugin-sql`); `lib/api.ts` = dispatcher local | Rama principal de trabajo del escritorio. Antes se llamaba `reestructuracion`. |
| **`web-cloud`** | **Web** (Next.js + .NET) | backend `.NET` → D1/blobs; `lib/api.ts` = cliente HTTP | Antes se llamaba `desktop-cloud`. En `origin` sigue como `desktop-cloud` (pendiente de renombrar en el remoto). |

**Topología lineal:** `desktop-tauri` = `web-cloud` + la capa Tauri encima (contiene
toda la historia de la web). Comparten el 100% del frontend salvo unos ~17 commits
(capa de datos y ajustes desktop).

## Regla de oro

> **La web es "aguas arriba"; el desktop, "aguas abajo".**

- **Cambios compartidos** (UI, editor, grafo, render, stores…): hacerlos en
  **`web-cloud`** y **fusionar hacia adelante** (`web-cloud` → `desktop-tauri`).
  Al ser archivos que no divergen, el merge no genera conflictos.
- **Cambios solo-desktop** (capa `lib/db`, Rust/Tauri, empaquetado): solo en
  `desktop-tauri`.
- **Cambios solo-web** (endpoints .NET, D1/R2): solo en `web-cloud`.
- **Evitar** hacer un cambio compartido primero en `desktop-tauri`: habría que
  backportearlo a mano a la web (fuente de deriva).

**Por defecto**, si un cambio se puede aplicar a ambas versiones, se aplica a las
dos (empezando por `web-cloud`), salvo que se indique lo contrario.

### Archivos que SÍ divergen (conflictos esperables al fusionar)

Solo estos difieren entre ramas; al fusionar `web-cloud → desktop-tauri`, si un
cambio web los toca, se resuelve **conservando la versión desktop**:

- `frontend/lib/api.ts` (dispatcher vs cliente HTTP)
- `frontend/lib/db/*` (solo desktop)
- `frontend/lib/excalidraw.ts`, `frontend/lib/export.ts`,
  `frontend/components/editor/NoteEditor.tsx` (reenrutado de `fetch` → dispatcher)
- `frontend/app/page.tsx` (redirección directa al workspace en desktop)
- `frontend/src-tauri/*`, `scripts/migrate-legacy.py`, `.github/workflows/desktop-build.yml`

## Pendiente en el remoto (`origin`)

`origin` tiene `desktop-cloud`, `main`, `deploy/cloudflare`. Los renombres se
hicieron **en local**. Para alinear el remoto (opcional):

```sh
git push origin web-cloud          # sube la rama renombrada
git push origin --delete desktop-cloud   # borra la antigua (acción destructiva: confirmar)
git push origin desktop-tauri      # sube la rama de escritorio (aún local)
```
