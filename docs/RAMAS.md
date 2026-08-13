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
- **Navegación por pestaña (`DEF-039/040/041`, desktop 1.1.5, ✅ reflejada 2026-08-08)**:
  aleja todavía más los archivos que la terminal ya había hecho divergir.
  `frontend/stores/tabsStore.ts` (historial por pestaña en `Tab`, `navegarHistorial`,
  depuración de las líneas en renombres/papelera/reconcile),
  `frontend/components/panes/TabBar.tsx` + `panes.module.css` (botones atrás/adelante),
  `frontend/app/(workspace)/workspace/page.tsx` (botones 3/4 del ratón y `Alt+←/→`) y
  `frontend/components/editor/NoteEditor.tsx` (captura del scroll en vivo). Además,
  **todos** los `router.push('/workspace?note=…')` pasaron a `router.replace` en una
  decena de archivos: al reflejar, ese cambio sí es mecánico y aplica igual en web.
  Ver [[navegacion-por-pestana]], [[Version 1.1.5]] y [[Version 1.1.0 de web]].
- **Metadatos YAML (`FUN-M-04`, desktop 1.2.0, ✅ reflejado 2026-08-08)**: la mayor parte
  es **compartida** y se puede traer entera con `git checkout desktop-tauri -- <archivo>`
  — `frontend/lib/frontmatter.ts` (parser puro, sin dependencias),
  `frontend/scripts/test-frontmatter.mjs`, `frontend/components/editor/PropiedadesTab.tsx`,
  `frontend/lib/editor/livePreview.ts` (widget de bloque), `frontend/lib/markdown.ts`
  (`renderNota` + tarjeta), `frontend/lib/printStyles.ts`, `frontend/styles/editor.css`,
  `frontend/components/editor/NotePanel.module.css` y `frontend/lib/search.ts`.
  Lo que **diverge de verdad es el índice**: `frontend/lib/db/propiedades.ts`,
  `indexer.ts`, `contenido.ts`, `grafo.ts`, `buscar.ts` y `fts.ts` son solo-desktop, y en
  web se llevó al **backend .NET**: `Frontmatter.cs` (port del parser), la tabla
  `propiedades` en los dos esquemas, el contenido del FTS (cuerpo + valores, sin claves),
  las etiquetas del grafo, el filtro `clave:valor` y cuatro endpoints nuevos
  (`propiedades/claves`, `propiedades`, `notas/{id}/propiedades`, `reindexar`).
  `frontend/lib/api.ts`, `NoteEditor.tsx` y `NotePanel.tsx` ya divergían y se aplicaron a
  mano. Ver [[metadata-yaml]], [[Version 1.2.0]] y [[Version 1.1.0 de web]].
- **Esporas (`FUN-M-03`, desktop 1.3.0, ✅ reflejadas 2026-08-08)**: casi todo es
  **compartido** y se puede traer entero con `git checkout desktop-tauri -- <archivo>`,
  porque las plantillas son **notas del vault** y no tocan la capa de datos:
  `frontend/lib/esporas.ts` (lógica pura, sin dependencias),
  `frontend/scripts/test-esporas.mjs`, `frontend/lib/esporasVault.ts`,
  `frontend/components/explorer/EsporasPanel.tsx` + su `.module.css`,
  `frontend/components/editor/EsporaMenu.tsx` + su `.module.css`,
  `frontend/components/explorer/ContextMenu.tsx` + su `.module.css` (submenús, entradas
  deshabilitadas) y `frontend/components/editor/EditorToolbar.tsx`.
  Lo que hay que **aplicar a mano** en cada rama, por ser archivos ya divergentes:
  `frontend/components/settings/VaultSection.tsx` (el campo de la carpeta: desktop tiene
  export-a-carpeta, framework IA y `.mycignore`; web solo ZIP),
  `frontend/components/workspace/LeftPanel.tsx` (en desktop la sección va dentro del
  `SidebarDock` genérico; en **web** el panel lateral sigue siendo `ExplorerDock`),
  `frontend/components/workspace/Rail.tsx` (desktop tiene además el botón de consolas) y
  `frontend/stores/panelLayoutStore.ts` (`RailSection` incluye `terminal` solo en
  desktop). `frontend/stores/vaultStore.ts` (`createNota` acepta un título) y
  `frontend/stores/preferencesStore.ts` (`carpetaEsporas`) son cambios de una línea que
  aplican igual en las dos. Ver [[esporas-plantillas]] y [[Version 1.3.0]].
  > [!warning] En desktop el id de una carpeta **es su ruta**
  > `listarEsporas` busca las notas cuya `carpetaId` sea exactamente la ruta
  > configurada (`Esporas`). En **web** el id de una carpeta es un **UUID**, así que
  > esa comparación no encuentra nada. Se resolvió con `idCarpetaEsporas()`, que recorre
  > el árbol segmento a segmento desde la raíz. Fue el único punto de las Esporas donde
  > las dos capas de datos no resultaron intercambiables — la advertencia se cumplió.
- **Confirmación del usuario (`DEF-051`)**: `frontend/lib/confirmar.ts` existe en las dos
  ramas con **la misma firma asíncrona**, pero por dentro son cosas distintas: en desktop
  el diálogo del plugin de Tauri (el WebView intercepta `window.confirm` y devuelve una
  promesa siempre "truthy"), en web el `confirm` del navegador, que sí devuelve un
  booleano. La forma asíncrona la impone el escritorio y web se adapta, para que los
  componentes compartidos no tengan que saber dónde corren. **No se sincroniza.**
- **Ancho de tabulación (`FUN-S-02`, ✅ reflejado 2026-08-08)**: todo compartido
  (`lib/editor/tabWidth.ts`, `headingFold.ts`, `styles/editor.css`, `preferencesStore.ts`,
  `EditorSection.tsx`), se trae entero.
- **Bases (`FUN-L-03`, las dos ramas, 2026-08-08)**: casi todo es **compartido** y se trae
  entero — `frontend/lib/bases.ts` (parser del `.base` + evaluador, puro y sin imports),
  `frontend/scripts/test-bases.mjs` y `frontend/components/bases/*`. Es deliberado: el
  filtrado **no baja a SQL** para no tener que escribir el intérprete otra vez en C#.
  Lo que **diverge** es solo la consulta que lo alimenta: `frontend/lib/db/tabla.ts`
  (desktop, SQLite local) vs `backend/…/TablaEndpoints.cs` (web, D1 + blobs). Y el tipo de
  archivo toca archivos ya divergentes: `NotaTipo` en `stores/vaultStore.ts` y
  `lib/db/types.ts`, `extDeTipo` en `lib/db/vaultFs.ts`, `tipo_de`/`es_importable` en
  `src-tauri/src/archivos.rs` (solo desktop), y `VaultEndpoints`/`VaultRepository` en .NET.
  Ver [[bases-tabla]].
  > [!warning] En web hay que reconstruir la ruta de la carpeta
  > Misma trampa que con las Esporas: acá el id de una carpeta es un **UUID** y no dice
  > nada del nombre, así que `file.folder` y `file.inFolder()` no significarían nada sin
  > subir por los padres hasta la raíz. En desktop el id **es** la ruta y sale gratis.
- **Auditoría y re-enlazado (`FUN-L-17` + núcleo de `FUN-M-17`, 2026-08-08, hoy solo-desktop)**:
  `frontend/lib/enlaces.ts` (núcleo puro), `scripts/test-enlaces.mjs` y
  `components/enlaces/RelinkView.tsx` son **compartibles** y se traerían enteros. Lo que
  **no** existe en web es su cimiento: `frontend/lib/db/enlaces.ts` respalda en
  `.mycelium/` y lee el léxico de `.claude/`, dos rutas del sistema de archivos. Llevarlo a
  web **no es un reflejo**: hay que decidir dónde vive el léxico y cómo se respalda sin
  disco. Ver [[auditoria-y-relinkeado]] § 17.
- **Canvas (`FUN-L-18`, desktop 2026-08-08, pendiente de reflejo)**: `frontend/lib/canvas.ts`,
  `scripts/test-canvas.mjs` y `components/canvas/*` son **compartidos** y se traen enteros.
  Lo que hay que aplicar a mano es el tipo de archivo, que toca los mismos sitios que ya
  tocaron las bases: `NotaTipo` en `stores/vaultStore.ts` y `lib/db/types.ts`, `extDeTipo`,
  el explorador, `EditorPane`, `SidebarNoteView`, y en web además `VaultEndpoints`/
  `VaultRepository`. `src-tauri/src/archivos.rs` es solo-desktop. En `lib/db/grafo.ts` (y su
  equivalente .NET) los canvas se leen con `referenciasDe()`, no como prosa. Ver [[canvas]].
- **Framework IA del vault (FUN-L-08, solo-desktop)**: `frontend/lib/ia/*` no existe
  en web; usa el comando Rust `leer_archivo_texto` (`src-tauri/src/vault_fs.rs`) y
  una sección nueva en `frontend/components/settings/VaultSection.tsx` (archivo ya
  divergente de por sí).
- **Autoactualización (FUN-L-14 + FUN-M-16, solo-desktop)**: nada de esto existe en web
  y **no hay nada que reflejar** — la web se actualiza sola al recargar. Archivos
  exclusivos: `src-tauri/src/actualizador.rs`, `frontend/lib/updater.ts`,
  `frontend/stores/updaterStore.ts`, `frontend/components/workspace/UpdateDialog.tsx` y
  `frontend/components/settings/UpdaterSection.tsx`, más el bloque `plugins.updater` de
  `tauri.conf.json`. Toca además tres archivos compartidos: `SettingsDrawer.tsx` (los
  siete clics en el número de versión y la sección nueva), `workspace/page.tsx` (monta el
  diálogo y dispara la comprobación) y los dos editores, que registran su guardado
  pendiente. `frontend/lib/guardadoPendiente.ts` **sí es genérico** y podría reflejarse
  el día que web lo necesite, pero hoy no tiene quien lo llame allá.
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
