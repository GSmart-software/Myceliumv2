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

## Regla de oro: implementación independiente por rama (sin migración)

Cada versión se implementa **por separado** en su rama. **No se migra código entre
`web-cloud` y `desktop-tauri`** (nada de cherry-pick ni merge entre ellas): así
pueden divergir libremente. El flujo lo coordina el **orquestador** con **subagentes
en worktrees** — ver [`CLAUDE.md`](../CLAUDE.md) en la raíz para el proceso completo.

- **Cambios que aplican a ambas** (aunque sean de UI): se especifican una vez y se
  implementan en **las dos ramas en paralelo** (un subagente por rama), lo más
  parecido posible. Por defecto, si se puede en las dos, se hace en las dos.
- **Cambios solo-desktop** (capa `lib/db`, Rust/Tauri, empaquetado): solo en
  `desktop-tauri`.
- **Cambios solo-web** (endpoints .NET, D1/R2): solo en `web-cloud`.
- Cada feature se hace en una **rama de feature** (`feat/<slug>-web`,
  `feat/<slug>-desktop`) y se fusiona a su rama principal correspondiente.

### Archivos que divergen entre las dos versiones

Estos difieren por diseño entre `web-cloud` y `desktop-tauri` (nunca se sincronizan
entre ramas):

- `frontend/lib/api.ts` (dispatcher vs cliente HTTP)
- `frontend/lib/db/*` (solo desktop)
- `frontend/lib/excalidraw.ts`, `frontend/lib/export.ts`,
  `frontend/components/editor/NoteEditor.tsx` (reenrutado de `fetch` → dispatcher)
- `frontend/app/page.tsx` (redirección directa al workspace en desktop)
- `frontend/src-tauri/*`, `scripts/migrate-legacy.py`, `.github/workflows/desktop-build.yml`
- **Terminal integrada (FUN-L-07, solo-desktop)**: `frontend/lib/terminal.ts`,
  `frontend/stores/terminalStore.ts`, `frontend/components/terminal/*`,
  `frontend/components/settings/TerminalSection.tsx` no existen en web, y además
  hicieron divergir archivos antes compartidos: `frontend/stores/tabsStore.ts`
  (sentinel `terminal:` en preview/reconcile), `frontend/stores/panelLayoutStore.ts`
  (sección `terminal`), `frontend/stores/sidebarViewerStore.ts` (reconcile),
  `frontend/components/panes/TabBar.tsx` y `EditorPane.tsx` (render/títulos de
  terminal), `frontend/components/workspace/Rail.tsx` (botón Consolas),
  `LeftPanel.tsx` (dock genérico + panel Consolas), `SettingsDrawer.tsx` (sección
  Terminal) y `frontend/components/explorer/SidebarNoteView.tsx` (consolas ancladas
  en el visor). Además, en desktop el `ExplorerDock` de DEF-023 P3 se generalizó a
  `frontend/components/workspace/SidebarDock.tsx` (el panel lateral entero es un
  espacio de pestañas, con cualquier sección activa); en web sigue existiendo
  `ExplorerDock` (solo explorador). Al reflejar features a web, aplicar los cambios
  a mano en esos archivos (no traerlos enteros).
- **Framework IA del vault (FUN-L-08, solo-desktop)**: `frontend/lib/ia/*` no existe
  en web; usa el comando Rust `leer_archivo_texto` (`src-tauri/src/vault_fs.rs`) y
  una sección nueva en `frontend/components/settings/VaultSection.tsx` (archivo ya
  divergente de por sí).

### Artefactos solo-web (no existen en `desktop-tauri`)

`desktop-tauri` se limpió de todo lo ajeno al escritorio; esto vive **solo en
`web-cloud`**: `backend/` (.NET), `wrangler.toml`/`.wrangler/` (Cloudflare),
`render.yaml` (Render), `DEPLOYMENT-PLAN.md`, `docs/DEPLOYMENT.md` y `legacy/`
(prototipo original). Ojo: los **datos locales** de la web
(`backend/src/Micelio.Api/micelio.local.db` y `.local-storage/`) están fuera de
git — viven solo en el directorio de trabajo; no borrar del disco.

## Pendiente en el remoto (`origin`)

`origin` tiene `desktop-cloud`, `main`, `deploy/cloudflare`. Los renombres se
hicieron **en local**. Para alinear el remoto (opcional):

```sh
git push origin web-cloud          # sube la rama renombrada
git push origin --delete desktop-cloud   # borra la antigua (acción destructiva: confirmar)
git push origin desktop-tauri      # sube la rama de escritorio (aún local)
```
