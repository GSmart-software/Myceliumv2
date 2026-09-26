# Auditoría de CÓDIGO MUERTO — Mycelium `desktop-tauri` (2026-09-26)

> [!info] Informe de un agente auditor, guardado tal cual
> Parte de [[Auditoria de codigo 2026-09-26]], que consolida los tres informes y el plan. Los scripts y resultados que este informe cita como «scratchpad» están en `docs/aprendizajes/scripts-auditoria-2026-09-26/`.

Informe del agente de código muerto, guardado por el orquestador. Rutas relativas a `frontend/`. Scripts en este scratchpad: `knip.json`, `xref.js`, `analisis.js`, `stores.js`, `cargo-check.txt`.

## 1. Hallazgos confirmados

### Dependencias (`package.json`)
| Qué | Evidencia | Se borraría | Riesgo | Tam |
|---|---|---|---|---|
| `codemirror` (meta-paquete) | 0 imports; todo usa `@codemirror/*` | 1 línea | ninguno | S |
| `highlight.js` | 0 imports directos; llega transitivo por `rehype-highlight`→lowlight; `styles/editor.css` estiliza `.hljs-*` | 1 línea | ninguno | S |
| `yjs`, `y-websocket`, `y-indexeddb`, `y-codemirror.next` | solo se importan dinámicamente en `lib/collab/collab.ts:44-47` después de `if (!info.habilitada) return null`; `lib/api.ts:172` devuelve siempre `{habilitada:false}` → nunca se cargan. «Colaboración dormida» (`docs/MIGRACION-TAURI.md` T3.7); su reactivación es de la línea web | 4 deps + `lib/collab/` + cableado en `NoteEditor.tsx:22,254,260,526,578-583,756-757` + ruta `colaboracion` en `api.ts:170-172` | web-cloud las necesita, otra rama | M |
| script `deploy:pages` | despliega a Cloudflare Pages (web). `wrangler` sí lo usa `scripts/publicar.mjs` (R2): queda | 1 línea | ninguno | S |

### Capacidades Tauri (`src-tauri/capabilities/default.json`)
- `dialog:allow-confirm`, `dialog:allow-ask`: TS solo usa `open()`; `confirm/ask` los sustituyó `DialogoConfirmar` en 2.0.0; `dialog:default` ya incluye todo → 3 líneas redundantes. S.
- `sql:allow-load/execute/select/close`: incluidas en `sql:default`; `close()` nunca se invoca. S.
- `bundle.android` en `tauri.conf.json`: bloque sin efecto. S.

### Comandos Rust
Nada muerto: 55 `#[tauri::command]`, 55 registrados, 55 invocados por string. `cargo check`: 0 warnings.

### Exports/funciones sin uso alguno
| Ruta | Por qué | Riesgo | Tam |
|---|---|---|---|
| `lib/editor/viewRegistry.ts:28 insertRefAtPoint` | su llamador se quitó en `17d898e` | — | S |
| `lib/editor/wikilink.ts:46 parseWikilinkTarget` | 0 usos; se usa `partirWikilink` de `lib/wikilinks.ts` | idéntico con web → desalinea hasta reflejar | S |
| `lib/esporasVault.ts:35 existeCarpetaEsporas` | 0 usos | compartido con web | S |
| `lib/idb.ts:55 deleteCachedNote` | 0 usos | — | S |
| `lib/db/types.ts:25,31,51,59 RowVault, RowCarpeta, RowPapelera, RowContenido` | nunca referenciados | — | S |
| `lib/bases.ts:25 EXTENSION_BASE`, `lib/canvas.ts:22 EXTENSION_CANVAS` | nunca leídas; la real vive en `lib/extensionesDeTipo.ts` | archivos enteros a web | S |
| `stores/updaterStore.ts:61,253 limpiarAviso` | nadie la llama | — | S |
| `stores/preferencesStore.ts:200,251,259 hydrated` | se escribe, nunca se lee | compartido con web | S |

### Componentes / archivos / CSS
| Ruta | Evidencia | Riesgo | Tam |
|---|---|---|---|
| `scripts/smoke-{editor,excalidraw,explorer,fase7,fase8,fase9,fase9-pdf,fase10,panes,render,search}.mjs` + `smoke.mjs` (12) | del 2026-07-16, anteriores al rediseño 2.0.0: buscan textos que ya no existen; `smoke-fase7` pide seeds de `backend/` (web). Ningún doc los cita. `smoke-drawio.mjs` (2026-09-23) sí está vigente | hoy fallarían | M |
| `public/{file,globe,next,vercel,window}.svg` | boilerplate create-next-app, 0 referencias | — | S |
| `README.md` (frontend) | boilerplate create-next-app intacto; CLAUDE.md preserva a propósito solo el de la raíz | — | S |
| `app/page.module.css:23-45 .actions .cta .ctaSecondary` | botones de la landing con auth; `page.tsx` solo usa `.main/.brand/.title/.tagline` | — | S |
| `components/workspace/Panels.module.css:13 .panelRight` + `styles/tokens.css:354 --mic-panel-right-width` | panel derecho eliminado en `7d62b1a` | tokens.css compartido | S |
| `components/settings/Settings.module.css:91-99 .feedback .error` | en desktop sin uso desde `e08c5d3` (quitar login); **pero web-cloud las usa** en `AccountSection.tsx:158,192` y el archivo se trae entero (RAMAS: `components/settings/*` compartidos) | **LO USA WEB**: borrar hace diverger el CSS; dejar | S |
| `app/(vaults)/vaults/page.module.css:107 .autoLabel` | movido en `b9b17b1` | — | S |
| `components/editor/EditorToolbar.module.css:198 .relative` | sin uso desde `976c856` | compartido | S |
| `components/bases/BaseView.module.css:488 .panelCabecera` | sin uso desde `10382b5` | compartido | S |
| `components/explorer/ExplorerPanel.module.css:172 .sharedTitle` | sin uso desde `78f3f09` | — | S |
| `components/recordatorios/Recordatorios.module.css:156-166 .tituloMes` | reemplazado en `f913b31` | — | S |
| `styles/tokens.css:345 --mic-icon-size`, `:357 --mic-panel-max-width`, `:365 --mic-note-swap` | ningún `var()` ni `getPropertyValue` | compartido | S |
| `next.config.ts:4-6` | comentario sobre Cloudflare Pages y `NEXT_PUBLIC_API_URL` | cosmético | S |

### Ramas inalcanzables / dormidas por decisión
1. **Sharing latente** — `lib/capacidades.ts` `HAY_COMPARTIR=false` apaga `ShareModal.tsx`, `SharedSection.tsx`, `lib/db/sharing.ts`, `tree.ts:33 carpetasCompartidas`, `vaultStore.sharedCarpetaIds` + `vaultStore.ts:213-221`, rutas en `api.ts:89,94,139-141`, tipo `CarpetasCompartidasResponse`. ShareModal/SharedSection compartidos con web. M.
2. **Modo «SQLite clásico»** — `getVaultActual() === null` en `lib/db/{notas,carpetas,papelera,enlaces,contenido,estadoVault,tabla}.ts` (~20 ramas), `client.ts:29 DB_URL`, `lib.rs:22,104-108,156` (`001_init.sql`), `vaultSessionStore.ts:266-267`. `/workspace` exige vault abierto (`workspace/page.tsx:83`): la rama no corre en uso normal. Ojo: `indexer.ts:34` ESPEJA `001_init.sql`. L.

### Preferencias
Las 20 claves de `Preferencias` y las 4 de `PrefsVault` tienen consumidor. Sin efecto solo `hydrated`.

## 2. Candidatos no confirmados
- `lib/idb.ts`: se escribe en cada guardado (`NoteEditor.tsx:340`) y se lee al abrir (`:693`, `LinkedPreviewPane.tsx:33`, `export.ts:39`): no es muerto, tiene efecto (¿deseado?).
- Identidad interna (`authStore`, `auth.ts`, tablas `usuarios/vaults/membresias`, `/auth/refresh|me`): campos `avatarUrl`, `propietario_id`, `expiresInMinutes` nunca se leen fuera de `lib/db`; existe solo para transportar `tema/modoOscuro/preferencias_json`.
- `public/plantilla-estilos.css` sí se usa (`CustomCssSection.tsx:88,99`); no verificado si está al día con `tokens.css`.
- Deps no declaradas: `unist` (`lib/markdown.ts`), `@lezer/markdown` (`NoteEditor.tsx`, `EditorDetalle.tsx`): tipos de paquetes transitivos. Frágil, no muerto.
- ~66 `export` superfluos (lista en `xref.js` sobre `knip.json`). Va a complejidad.

## 3. Herramientas
- knip (`npx knip`, sin config): 30 archivos sin uso = todos `scripts/*.mjs` (FP); 84 exports + 24 tipos; deps `codemirror`, `highlight.js`, devDep `playwright` (FP). Cruce propio: de 108 símbolos, 30 con uso real (FP), 66 export superfluos, 12 realmente sin uso.
- cargo check: 0 warnings.
- Scripts propios: comandos Rust vs `invoke` (55/55); rutas `api()` vs dispatcher; clases `.module.css` (~50 candidatas → 8 confirmadas; descartadas las calculadas `layout_${mode}`, `dot_${sync}`, `dropZone_${edge}`, `nd_${edge}`, `ancla_${lado}`, `borde${d}`); custom properties (122 definidas, 20 sin `var()` → 4 confirmadas; 14 FP por plantillas `var(--mic-consola-${id})`); claves de 22 stores.

## 3b. Derivaciones del agente de COMPLEJIDAD (triple búsqueda: import · string · convención, + `git grep` en `web-cloud`)

Verificación en `web-cloud` (desde la raíz del repo: `git grep -l <símbolo> web-cloud -- frontend`): ninguno de los 12 exports muertos de desktop tiene consumidor en web (allí también están solo en su archivo de definición). Sí usa web `Settings.module.css .feedback/.error` (fila corregida arriba).

**1. Compartir / colaboración** — **confirmado muerto en desktop por decisión** (`HAY_COMPARTIR=false`, `lib/capacidades.ts`); vivo en web-cloud:
| Candidato | Veredicto | Evidencia |
|---|---|---|
| `lib/db/sharing.ts` (3 no-ops) | muerto (inalcanzable) | solo lo llama el dispatcher en rutas `compartido/miembros/compartir`; los call-sites (`ShareModal.tsx`, `SharedSection.tsx`, `ExplorerPanel.tsx:547-557`) están detrás de `HAY_COMPARTIR` |
| `lib/db/tree.ts:33 carpetasCompartidas` | **vivo pero inútil**: corre en cada `loadTree` (`vaultStore.ts:213`) y siempre devuelve `[]` | web no tiene el símbolo (allí lo resuelve .NET) |
| `SharedSection.tsx`, `ShareModal.tsx` | muertos (nunca se montan): `ExplorerPanel.tsx:929,941` los envuelve en `HAY_COMPARTIR &&` | compartidos con web (se traen enteros) → no borrar sin diverger |
| `uiStore.shareTarget` / `setShareTarget` | muerto: solo lo escribe `ExplorerPanel.tsx:552,557` (rama `HAY_COMPARTIR`) y lo lee `ShareModal.tsx:26-27` | `uiStore.ts` es compartido y en web `ShareModal` sí vive |
| `vaultStore.sharedCarpetaIds` | muerto: se llena con `[]` siempre; `vaultStore` ya diverge → se puede quitar con la llamada `:213-221` | — |
| `lib/collab/collab.ts` + `yjs`, `y-websocket`, `y-indexeddb`, `y-codemirror.next` | muertos: `api.ts:172` devuelve siempre `{habilitada:false}` → `return null` en `collab.ts:41` antes de los `import()` de `:44-47`. `NoteEditor` diverge, así que su cableado (`:22,254,260,526,578-583,756-757`) se puede quitar sin tocar web | web sí los usa (`NoteEditor.tsx`, `collab.ts`, `package.json` de web-cloud) |

**2. Modo «SQLite clásico»** — confirmado **inalcanzable**: `app/page.tsx` → `/vaults` o `abrir(ruta)`; `/vaults/page.tsx:77` solo hace `router.replace("/workspace")` tras abrir; `workspace/page.tsx:83` expulsa a `/vaults` sin vault. `setVaultActual(null)` solo ocurre al **cerrar** (`vaultSessionStore.ts:267`) y después no queda pantalla que llame a `api()`.
| Candidato | Veredicto | Evidencia |
|---|---|---|
| `lib/db/util.ts:26 tituloUnico` | muerto de facto: sus dos usos (`notas.ts:78,233`) solo alimentan la rama clásica. **Eficiencia**: en `crearNota` (`:78`) se calcula ANTES del `if (vault !== null)` → en modo carpeta hace la query `titulosEnCarpeta` y descarta el resultado | — |
| `lib/db/util.ts:8 nuevoId` | **vivo**: `lib/canvas.ts`, `components/canvas/CanvasView.tsx`, `scripts/test-canvas.mjs` (además de las ramas clásicas de `carpetas/notas/papelera.ts`) | — |
| `lib/db/ftsIndice.ts:88 ftsRetitular` | muerto de facto: único llamador `notas.ts:153`, después del `return` de la rama carpeta (`:144`) | — |
| `src-tauri/migrations/001_init.sql` + `lib.rs:22,104-108,156` (`DB_URL`, `add_migrations`) | inalcanzable en uso normal: `mycelium.db` solo se abre si `getExecutor()` corre sin `setExecutor(índice)`, o sea nunca dentro de un vault. `lib/db/indexer.ts:34` lo ESPEJA a mano → si se borra, el esquema TS pasa a ser la única fuente | `vault-en-carpeta.md §6` y «Procedimiento de vuelta» lo conservan a propósito → **dudoso: decisión de producto** (duda 1) |
| `ExecResult.lastInsertId` (`lib/db/client.ts:20,54`) | muerto: 0 lecturas fuera de `client.ts` (todas las PK son TEXT) | — |
| ramas `getVaultActual() === null` en `notas.ts` (:81,128,175,214), `carpetas.ts` (:112,142,189,237), `papelera.ts` (:43,82,138), `contenido.ts` (:41), `enlaces.ts` (:62,76,129,192,219,250), `estadoVault.ts` (:94) | inalcanzables (mismo motivo) | L; duda 1 |

**3. Identidad / caché**
| Candidato | Veredicto | Evidencia |
|---|---|---|
| `lib/idb.ts:55 deleteCachedNote` | **confirmado muerto** (0 llamadores en desktop y en web-cloud) | — |
| `lib/db/types.ts` `RowVault`, `RowCarpeta`, `RowPapelera`, `RowContenido` | **confirmados muertos** (0 referencias) | — |
| `lib/db/types.ts:40 RowNota` | muerto: `lib/db/tabla.ts:18` declara **su propio** `type RowNota` local, no importa el de `types.ts` | — |
| `lib/db/types.ts RowCssSnippet` | **vivo**: `lib/db/snippets.ts:8,16,23` | — |
| columnas `password_hash`, `github_id`, `email_verificado` (`lib/db/indexer.ts:52-79`) | muertas: nadie las lee; solo `auth.ts:30` inserta `email_verificado=1`. Copia de `001_init.sql` (web) | quitarlas toca el «espejo» y no altera índices existentes (`CREATE TABLE IF NOT EXISTS`) → migración |
| columna `avatar_url` | **viva de forma vacía**: `auth.ts:59,69` la lee y expone como `avatarUrl`, que ningún componente consume | — |

**4. `EXPIRES_IN_MINUTES`** (`lib/db/auth.ts:21,92`): **vivo pero inútil** — se devuelve en `session()` como `expiresInMinutes`, que nadie lee (`authStore.ts` lo tipa y lo ignora). Muerto en efecto, no en código.

**5. `take_opened_files` / `open-files` / `FileOpenBridge.tsx`**: **vivo con entrada real**. `tauri.conf.json:48-61` declara `fileAssociations` para `md` y `excalidraw`; `lib.rs:43,50` filtra esas extensiones; `lib.rs:146` emite `open-files` (segunda instancia, `tauri-plugin-single-instance`); `FileOpenBridge` se monta en `workspace/page.tsx:37`, invoca `take_opened_files` (`:78`) y escucha `open-files` (`:81`). Hueco funcional, no muerto: `.base`, `.canvas` y `.drawio` no están asociados.

**6.** `uiStore.liveTables`: **vivo** — `EditorToolbar.tsx:118,530`, `ExportMenu.tsx:34,96-97`, `lib/editor/livePreview.ts:269`. `prefs.graphContinuousSim`: **vivo** — `components/graph/MiniGraph.tsx:134` (`continuousSim`); toggle en `GraphSection.tsx`.

**7.** `leer_carpeta` / `recorrer` / `es_oculto` (`archivos.rs:86,139,181`): **vivos por `lib/import.ts:68`** (`invoke("leer_carpeta")`) ← `collectFromNativeFolder` ← `components/settings/VaultSection.tsx:266` (importar carpeta / vault de Obsidian). `recorrer_meta`, `recorrer_observables` y `recorrer_dirs` son otras funciones con sus propios comandos. Único llamador: la importación.

## 4. Para COMPLEJIDAD
- `api()`→dispatcher→`lib/db/*` simula rutas HTTP con encode/decode y `token` ignorado en ~25 archivos; identidad falsa solo para prefs.
- Doble camino clásico/carpeta en cada mutador.
- `lib/idb.ts`: segunda persistencia con semántica remota.
- `lib/terminal.ts` reexporta `terminalBase.ts` (dos módulos exportan `TERMINAL_TAB_PREFIX`).
- 66 export superfluos; `lib/db/types.ts` mezcla snake_case/camelCase.

## 5. Para EFICIENCIA
- `startCollab`: una llamada por montaje para `{habilitada:false}`.
- `loadTree` pide `carpetas-compartidas` en cada carga y obtiene `[]` (`vaultStore.ts:213`).
- `putCachedNote` en cada guardado + `getCachedNote` en cada apertura, además del disco.
- Cada apertura de vault: `restore()` = 2 rutas + `ensureSeed`.
- `public/drawio` pesa 110 MB (generado, fuera de git): confirmar cuánto entra al instalador.

## 6. Dudas para el usuario
1. ¿Se cierra el modo clásico o sigue como red de seguridad?
2. ¿Sharing y colaboración se quitan de desktop o se mantienen dormidos?
3. ¿Los 12 smoke tests de julio se borran o se reescriben para la UI 2.0.0?
4. Lo muerto en archivos compartidos con web: ¿limpiar en las dos ramas a la vez?
5. (nuevo) Los stores compartidos con web que llevan estado de sharing (`uiStore.shareTarget`) y las columnas `password_hash/github_id/email_verificado` del índice: ¿se limpian solo en desktop (haciendo divergir `uiStore.ts` e `indexer.ts`) o se dejan?
