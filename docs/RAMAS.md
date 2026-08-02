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
- **Navegación por pestaña (`DEF-039/040/041`, desktop 1.1.5, pendiente de reflejo)**:
  aleja todavía más los archivos que la terminal ya había hecho divergir.
  `frontend/stores/tabsStore.ts` (historial por pestaña en `Tab`, `navegarHistorial`,
  depuración de las líneas en renombres/papelera/reconcile),
  `frontend/components/panes/TabBar.tsx` + `panes.module.css` (botones atrás/adelante),
  `frontend/app/(workspace)/workspace/page.tsx` (botones 3/4 del ratón y `Alt+←/→`) y
  `frontend/components/editor/NoteEditor.tsx` (captura del scroll en vivo). Además,
  **todos** los `router.push('/workspace?note=…')` pasaron a `router.replace` en una
  decena de archivos: al reflejar, ese cambio sí es mecánico y aplica igual en web.
  Ver [[navegacion-por-pestana]] y [[Version 1.1.5]].
- **Metadatos YAML (`FUN-M-04`, desktop 1.2.0, pendiente de reflejo)**: la mayor parte
  es **compartida** y se puede traer entera con `git checkout desktop-tauri -- <archivo>`
  — `frontend/lib/frontmatter.ts` (parser puro, sin dependencias),
  `frontend/scripts/test-frontmatter.mjs`, `frontend/components/editor/PropiedadesTab.tsx`,
  `frontend/lib/editor/livePreview.ts` (widget de bloque), `frontend/lib/markdown.ts`
  (`renderNota` + tarjeta), `frontend/lib/printStyles.ts`, `frontend/styles/editor.css`,
  `frontend/components/editor/NotePanel.module.css` y `frontend/lib/search.ts`.
  Lo que **diverge de verdad es el índice**: `frontend/lib/db/propiedades.ts`,
  `indexer.ts`, `contenido.ts`, `grafo.ts`, `buscar.ts` y `fts.ts` son solo-desktop, y en
  web hay que llevar la tabla `propiedades`, el cambio de contenido del FTS (cuerpo +
  valores, sin claves), las etiquetas del grafo y el filtro `clave:valor` **al backend
  .NET**. `frontend/lib/api.ts`, `NoteEditor.tsx` y `NotePanel.tsx` ya divergían: aplicar
  a mano (el panel recibe `paneId`, `reloadFromDisk` publica en el `docBroker`).
  Ver [[metadata-yaml]] y [[Version 1.2.0]].
- **Framework IA del vault (FUN-L-08, solo-desktop)**: `frontend/lib/ia/*` no existe
  en web; usa el comando Rust `leer_archivo_texto` (`src-tauri/src/vault_fs.rs`) y
  una sección nueva en `frontend/components/settings/VaultSection.tsx` (archivo ya
  divergente de por sí).
- **`.mycignore` (FUN-M-11)**: en desktop vive en `src-tauri/src/mycignore.rs` +
  los walkers de `archivos.rs` + el watcher, con editor en `VaultSection.tsx`. En
  **web** la funcionalidad es distinta por naturaleza (no hay carpeta en disco):
  filtro de importación/visualización con la config en el backend — pendiente.

### Artefactos solo-web (no existen en `desktop-tauri`)

`desktop-tauri` se limpió de todo lo ajeno al escritorio; esto vive **solo en
`web-cloud`**: `backend/` (.NET), `wrangler.toml`/`.wrangler/` (Cloudflare),
`render.yaml` (Render), `DEPLOYMENT-PLAN.md`, `docs/DEPLOYMENT.md` y `legacy/`
(prototipo original). Ojo: los **datos locales** de la web
(`backend/src/Micelio.Api/micelio.local.db` y `.local-storage/`) están fuera de
git — viven solo en el directorio de trabajo; no borrar del disco.

## Ramas históricas en local (`local`, `main`, `deploy/cloudflare`)

Además de las dos ramas de trabajo existen tres etiquetas viejas. **Auditadas el
2026-08-01: ninguna tiene commits propios.** Las tres son *ancestros estrictos* de
`web-cloud` **y** de `desktop-tauri`, o sea que todo su contenido ya está integrado y
borrarlas no pierde absolutamente nada.

| Rama | Punta | Fecha | Commits propios | Qué era |
|---|---|---|---|---|
| `local` | `ad14407` | 2026-06-17 | **0** | Etiqueta de trabajo previa a los renombres. Apunta **al mismo commit que `main`**: es un duplicado exacto, sin significado propio. |
| `main` | `ad14407` | 2026-06-17 | **0** | La rama por defecto original del repo, congelada en *"preparación despliegue"*. 176 commits por detrás de `desktop-tauri`. |
| `deploy/cloudflare` | `e2b19fc` | 2026-06-17 | **0** | La línea de despliegue (adaptadores D1/R2, Render, Pages). **Ya integrada en `web-cloud`** — ver [[Despliegue de la web en Cloudflare]]. |

Verificación (devuelve `N 0`: nada exclusivo de la rama vieja):

```sh
git rev-list --left-right --count desktop-tauri...local          # 176  0
git rev-list --left-right --count web-cloud...deploy/cloudflare  #  77  0
git merge-base --is-ancestor deploy/cloudflare web-cloud && echo integrada
```

> [!tip] Qué pasa si se borran
> Nada: los commits siguen siendo alcanzables desde `web-cloud`/`desktop-tauri`, así que
> Git no los recolecta. Lo único que desaparece es la **etiqueta**. Por eso conviene
> usar `git branch -d` (minúscula), que **se niega** a borrar una rama no integrada: es
> la red de seguridad. Los SHA quedan anotados en esta tabla y en
> [[Despliegue de la web en Cloudflare]] por si hace falta volver a mirarlos.

### Qué se decidió (2026-08-01)

- ✅ **`local` borrada** — era un duplicado exacto de `main`, cero información.
- ✅ **`deploy/cloudflare` borrada** — su contenido vive en `web-cloud` y su conocimiento
  quedó documentado en [[Despliegue de la web en Cloudflare]] antes de borrarla.

`git branch -d` aceptó las dos sin protestar, que es la prueba de que estaban
integradas. **Quedan tres ramas locales: `desktop-tauri`, `web-cloud` y `main`.**

- ⏸️ **`main` se mantiene, por ahora.** Borrarla en local sería igual de inocuo, pero
  sigue siendo la rama por defecto del repo en GitHub y `origin/main` está aún más atrás
  (`a4374bd`, 2026-06-11). Antes de tocarla hay que resolver qué muestra el remoto (ver
  abajo) — es la cara pública del proyecto.

## Pendiente en el remoto (`origin`)

`origin` (`GSmart-software/Myceliumv2`) tiene `desktop-cloud`, `main` y
`deploy/cloudflare`. Los renombres se hicieron **en local**. Las tres remotas también
están **contenidas en `web-cloud`** (cero commits propios), así que el remoto no guarda
trabajo que no esté acá: está simplemente **desactualizado**, no divergente.

> [!warning] El remoto muestra una foto vieja del proyecto
> `origin/main` está en `a4374bd` (2026-06-11, HU-16/HU-17), **204 commits** por detrás
> de `desktop-tauri`. Nada de lo hecho desde entonces (Tauri, 1.0.0, 1.1.0, terminal,
> framework de IA) está publicado.

Para alinear el remoto (opcional, **nada de esto se hace sin pedirlo** — ver
[[Convenciones de commits]]):

```sh
git push origin web-cloud          # sube la rama renombrada
git push origin --delete desktop-cloud   # borra la antigua (acción destructiva: confirmar)
git push origin desktop-tauri      # sube la rama de escritorio (aún local)
git push origin --delete deploy/cloudflare   # ya integrada en web-cloud
```

## Relacionadas

- [[Dos ramas en vez de monorepo]] — por qué existe esta estructura.
- [[Implementacion independiente por rama]] — la regla de oro que la sostiene.
- [[Reflejar cambios de desktop a web]] — el procedimiento para cruzar cambios.
- [[Diferencias funcionales aceptadas entre versiones]] — divergencias intencionales.
- [[Convenciones de commits]] — reglas del remoto (`origin` desalineado a propósito).
- [[Mapa de documentacion]] — índice general.
