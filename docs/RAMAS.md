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
- **Reflejo a web del 2026-09-27** (`FUN-M-39`, `FUN-M-40` D8, `FUN-L-25` B–G,
  `DEF-111`/`FUN-M-38`), rama `feat/reflejo-2026-09-27-web`. Esta nota de `web-cloud` es
  una copia vieja de la de desktop: el orquestador sincroniza lo de abajo con
  `docs/RAMAS.md` de `desktop-tauri`, que es la lista viva.
  - **Limpieza (`FUN-M-39`)**. Vuelven a ser **idénticos** a desktop (traídos enteros,
    cada símbolo comprobado con `git grep` sobre `web-cloud`): `lib/bases.ts`,
    `lib/canvas.ts`, `lib/editor/viewRegistry.ts`, `styles/tokens.css`,
    `BaseView.module.css`, `EditorToolbar.module.css`, `ExplorerPanel.module.css`,
    `Recordatorios.module.css`, `workspace/Panels.module.css`; los cinco SVG de
    `public/` se borraron. **A mano**, en archivos que divergen:
    `preferencesStore.hydrated`, `idb.deleteCachedNote` (el resto de `lib/idb.ts` se
    queda: la caché IndexedDB está viva en web) y `esporasVault.existeCarpetaEsporas`.
    **No se trajeron**: `stores/uiStore.ts` (web usa `shareTarget`), `next.config.ts`
    (el comentario de Cloudflare Pages rige acá), `frontend/README.md`,
    `components/recordatorios/comun.ts` y **`lib/pestanas.ts`** — este último importa
    `lib/otrosArchivos` y `lib/terminalBase`, que no existen en web, y sus consumidores
    (`TabBar`, `EditorPane`, `SidebarNoteView`, `tabsStore`, `sidebarViewerStore`) ya
    divergían; en web `SidebarDock` no existe. Queda **pendiente**: reflejarlo es una
    adaptación (una versión sin `terminal`/`archivo`), no un `checkout`. Tampoco se
    borraron los 12 `smoke-*.mjs` de julio (D5) ni se trajo `TITULO_POR_DEFECTO` de
    `lib/extensionesDeTipo.ts` (H11): los dos quedan a decisión.
  - **Resolutor único (`FUN-M-40` D8)**. `lib/wikilinks.ts` y `lib/editor/wikilink.ts`
    son **idénticos** a desktop. `scripts/test-wikilinks.mjs` **diverge**: la copia de
    web no trae las dos pruebas del grafo, que en desktop cubren `lib/enlacesNota.ts`
    (solo-desktop). **Backend**: `Features/Vaults/ResolutorWikilinks.cs` (nuevo) porta
    `resolveWikilinkEnIndice` a C# —pista de carpeta, sin extensión de nota
    (`md|excalidraw|base|canvas`), empate a la ruta más corta y después por id en orden
    ordinal— y `SearchEndpoints` lo usa en `/vaults/{id}/grafo` y en
    `/notas/{id}/conexiones`. Con eso el clic y la arista van a la misma homónima, y
    `![[Dibujo.excalidraw]]` cuenta como arista. La lista de extensiones y la regla
    viven **dos veces** (TS y C#), igual que `SEPARADOR_ALIAS`: tocar una sin la otra
    vuelve a separar el clic del grafo. En web el id es un UUID, así que el segundo
    criterio del empate no es «por ruta» como en desktop, pero es el mismo en las dos
    puntas.
  - **D6, D7 y D9 no se reflejan**: web conserva los diagramas embebidos, la caché
    IndexedDB y la importación por nota. Por eso **no** se trajeron
    `lib/editor/livePreview.ts`, `components/recordatorios/EditorDetalle.tsx` (los dos
    conservan el parámetro `notaId`), `ExcalidrawModal.tsx`, `lib/markdown.ts` (sigue
    con su propia expresión del embed), `LinkedPreviewPane.tsx`, `EditorToolbar.tsx`
    (`SyncState` con `offline`), `lib/import.ts`, `importStore.ts` ni
    `ImportDialogs.tsx`.
  - **Motor del cúmulo (`FUN-L-25` B–G, con `DEF-115`)**. Idénticos a desktop:
    `components/graph/MiniGraph.tsx`, `fisica.ts`, `cicloFisica.ts`, `motorFisica.ts`,
    `sim.worker.ts`, `revelado.ts`, `scripts/test-{fisica,ciclo,revelado}.mjs` y
    `tsconfig.json` (`out` en el `exclude`: web también exporta a `out/`).
    `GraphView.tsx`, `GraphOptionsMenu.tsx` (+ CSS) y la parte del grafo de
    `prefsVaultStore.ts` ya eran los mismos; `graphStore.ts` solo difiere en `reset()`,
    que es del cambio de vault de desktop. `next build` emite
    `out/_next/static/chunks/turbopack-worker-*.js`; el worker carga sus chunks con
    `importScripts` desde el mismo origen, que en Cloudflare Pages es el propio sitio.
    **Parte A no aplica** (en web el grafo lo arma el backend; `GraphDataDto` no
    cambió) y **nada de `FUN-L-23`** (retirada).
  - **`DEF-111` + debounce de la vista previa (`FUN-M-38`)**: `SearchPanel.tsx` vuelve a
    ser idéntico (descarta respuestas viejas; busca desde 2 caracteres, que en web
    también pega contra FTS5); `NoteEditor.tsx` recibió el debounce adaptativo con
    parche de tres vías, limpio. El resto de `FUN-M-38` es de la capa de datos de
    desktop.
  - `DEF-102`/`DEF-089` (código dentro de bloques) ya estaban en web desde el
    2026-09-25 (`18a2c58`, `5ee9fb3`): no se tocaron.

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
