# Auditoría: limpieza (`FUN-M-39` · `AUDITORIA-LIMPIEZA-1`)

Tanda 2 de la [[Auditoria de codigo 2026-09-26]]: borrar lo que el
[[Auditoria de codigo muerto 2026-09-26|informe de código muerto]] confirmó sin uso, quitar de
desktop compartir y colaboración, y cuatro simplificaciones chicas del
[[Auditoria de complejidad 2026-09-26|informe de complejidad]] (H9, H11, H13, H14). Rama
`feat/auditoria-limpieza-desktop`, 2026-09-26.

> [!info] Alcance: **SOLO-DESKTOP**, con archivos compartidos que pasan a diverger
> Se hizo en `desktop-tauri`. Lo muerto en archivos idénticos a web se limpió acá igual
> (decisión **D4**); la lista de los que dejan de ser idénticos está en § «Cómo quedó» y en
> [[RAMAS]], para que el orquestador los refleje.

## Decisiones del usuario (2026-09-26)

- **D2** · Compartir y colaboración **se quitan de desktop**. No está decidido que desktop
  los tenga; si algún día se decide, se reescriben. Quedan en `web-cloud`, donde viven de
  verdad (hay backend y membresías).
- **D4** · Lo muerto en archivos idénticos a web se limpia en desktop igual, y se anota qué
  archivos pasan a diverger.
- **D5** · Los 12 smoke tests de julio **se borran** (no se reescriben).

## Qué se borró y por qué

### Compartir y colaboración (D2 · compl. H12)
`lib/db/sharing.ts` (tres no-ops), `lib/collab/collab.ts`, `SharedSection.tsx`,
`ShareModal.tsx` + su CSS, `lib/capacidades.ts` (su único lector era `HAY_COMPARTIR`), las
rutas `compartido`/`carpetas-compartidas`/`miembros`/`compartir`/`colaboracion` del
dispatcher (`lib/api.ts`), `tree.ts carpetasCompartidas`, `uiStore.shareTarget`,
`vaultStore.sharedCarpetaIds`, la sección «Compartido» del explorador con su divisor
persistido y el cableado de `startCollab` en `NoteEditor`.

Efecto medible: **una llamada inerte menos por cada `loadTree`** (la de carpetas
compartidas, que siempre devolvía `[]`) y **una llamada `/colaboracion` menos por cada nota
que se abre** (siempre respondía `habilitada: false`).

### Dependencias, permisos, empaquetado
- `package.json`: `yjs`, `y-websocket`, `y-indexeddb`, `y-codemirror.next` (solo los
  importaba `lib/collab`), `codemirror` (meta-paquete: todo importa `@codemirror/*`),
  `highlight.js` (llega transitivo por `rehype-highlight`; `editor.css` sigue estilando
  `.hljs-*`), y el script `deploy:pages` (Cloudflare Pages es de web). `package-lock.json`
  regenerado.
- `capabilities/default.json`: `dialog:allow-confirm` y `dialog:allow-ask` (el frontend solo
  usa `open()`; los diálogos son `DialogoConfirmar`), y `sql:allow-load/select/close`, que
  `sql:default` ya incluye.
- `tauri.conf.json`: el bloque `bundle.android` (no hay build Android).

### Exports, tipos, CSS y assets sin uso
`insertRefAtPoint`, `parseWikilinkTarget`, `existeCarpetaEsporas`, `deleteCachedNote`, los
tipos `RowVault/RowCarpeta/RowNota/RowPapelera/RowContenido`, `EXTENSION_BASE` y
`EXTENSION_CANVAS`, `updaterStore.limpiarAviso`, `preferencesStore.hydrated` (se escribía y
nunca se leía) y `ExecResult.lastInsertId` (todas las PK son TEXT; estaba previsto en
`FUN-L-24` y cayó acá). Seis clases CSS (`.sharedTitle`, `.panelRight`, `.autoLabel`,
`.relative`, `.panelCabecera` de `BaseView`, `.tituloMes`), cuatro custom properties
(`--mic-icon-size`, `--mic-panel-right-width`, `--mic-panel-max-width`, `--mic-note-swap`),
los cinco SVG de create-next-app, el README boilerplate del frontend (ahora apunta a
`docs/`) y el comentario de `next.config.ts` sobre Cloudflare Pages.

### Smoke tests (D5)
Los 12 `scripts/smoke*.mjs` del 2026-07-16: anteriores al rediseño 2.0.0, buscaban textos y
selectores que ya no existen, y `smoke-fase7` pedía seeds de `backend/` (web). Se conservan
`smoke-drawio.mjs` (2026-09-23, vigente) y todos los `test-*.mjs` headless.

### Simplificaciones de complejidad
- **H9 · tipo de pestaña en un solo sitio**: `lib/pestanas.ts` es dueño de los tres ids
  sentinela, de `tipoDePestana()`, de `esSentinela` y de la tabla de título/ícono.
  `EditorPane`, `TabBar`, `SidebarDock`, `SidebarNoteView`, `tabsStore` y
  `sidebarViewerStore` consultan ahí. Corrige de paso una inconsistencia real: anclar
  «Referencias del vault» en el costado caía en la rama de nota («…» y un editor vacío).
  [[Estado con Zustand]] actualizado.
- **H11 · constantes duplicadas**:
  - La plantilla del `.mycignore` que ofrece Configuración → Vault sale del comando Rust
    `mycignore_default()` (cabecera comentada + `mycignore::DEFAULT`); `VaultSection.tsx`
    ya no tiene su copia «que DEBE espejar». Test nuevo en `mycignore.rs`
    (`la_plantilla_equivale_al_default`).
  - `TITULO_POR_DEFECTO` («Dibujo sin título»…) vive junto a `EXTENSION_POR_TIPO` en
    `lib/extensionesDeTipo.ts`, con `Record<NotaTipo, …>` para que un tipo nuevo no compile
    sin título. Lo consumen `vaultStore.createNota`, `lib/db/notas.crearNota` y el
    fallback de «insertar dibujo» de `NoteEditor` (una tercera copia que el informe no
    listaba).
  - `carpetasDeRuta(ruta)` pasa a ser `carpetasDeDir(carpetaDeArchivo(ruta))`.
- **H13 · `pendingMoves`**: fuera de `vaultStore`, con su gracia de 60 s. Existía para una
  réplica del backend que iba por detrás del `UPDATE`; en desktop `loadTree` lee SQLite
  local. Queda el movimiento optimista con reversión si falla.
- **H14 · comentarios que mentían**: `vaultMode.ts`, `vault_config.rs` («la conmutación
  real llega en fases posteriores») y `client.ts` («la web podría inyectar otro
  executor») describen el estado real. `sharing.ts` se borró entero.

## Cifras

- **71 archivos** de `frontend/` tocados: **23 borrados** (6 de compartir/colaboración,
  5 SVG, 12 smoke tests), 1 nuevo (`lib/pestanas.ts`).
- Sin contar `package-lock.json`: **+279 / −2151 líneas**. El lockfile, −150.
- **6 dependencias** fuera (`yjs`, `y-websocket`, `y-indexeddb`, `y-codemirror.next`,
  `codemirror`, `highlight.js`) y 1 script; **5 permisos** de Tauri y el bloque android.
- `knip` pasa de 144 a 136 avisos respecto de la línea base de la auditoría: 25 resueltos,
  17 «nuevos» que son todos de `FUN-L-23` (disposiciones del grafo, entró antes de la
  auditoría pero después de la corrida de `knip`) y ninguno de esta limpieza.

## Cómo quedó

> [!warning] Desvíos respecto del informe
> - `purgarExpiradas` **se queda**: la llama `listarPapelera` (el informe la daba por
>   muerta; § 3b la corrige). `RowCssSnippet` también está vivo.
> - `sql:allow-execute` **se queda**: el informe decía que `sql:default` lo cubre, pero en
>   `tauri-plugin-sql` 2.4.0 el default es solo `close/load/select`.
> - `Settings.module.css .feedback/.error` y `app/page.module.css .actions/.cta/.ctaSecondary`
>   se conservan: están muertas en desktop pero **web las usa** y los archivos se traen
>   enteros.
> - H14 quedó **a medias a propósito**: los comentarios de `lib/db/indexer.ts` (cabecera
>   «nada de esto se activa todavía» y el de `ArchivoLeido`/`leer_carpeta`) y de
>   `archivos.rs` («acotada a estos tres comandos») están en archivos que trabaja en
>   paralelo `FUN-M-38`. Pasan a `FUN-L-24` ([[auditoria-capa-de-datos]], que ya los lista),
>   o se corrigen tras integrar las dos tandas.
> - El comentario de `lib/editor/docBroker.ts` («será reemplazado por la fuente Yjs») se
>   dejó: es futuro de web, y el archivo es idéntico entre ramas.

### Archivos compartidos con web que ahora divergen (D4)

Eran **idénticos** en `web-cloud` antes de esta tanda:

| Archivo | Qué pasa |
|---|---|
| `lib/bases.ts`, `lib/canvas.ts`, `lib/editor/wikilink.ts`, `lib/editor/viewRegistry.ts`, `lib/idb.ts`, `stores/preferencesStore.ts`, `styles/tokens.css`, `BaseView.module.css`, `EditorToolbar.module.css`, `ExplorerPanel.module.css`, `Recordatorios.module.css`, `Panels.module.css`, `public/*.svg` | **Reflejables tal cual**: lo borrado está muerto también en web (`git grep` sobre `web-cloud`). Traerlos enteros los vuelve a igualar |
| `stores/uiStore.ts` | **Diverge**: web usa `shareTarget` |
| `next.config.ts` | **Diverge**: el comentario de web (Cloudflare Pages) es cierto allá |
| `frontend/README.md` | **Diverge**: el de desktop nombra la línea `desktop-tauri` |
| `components/recordatorios/comun.ts` | **Diverge** mientras web no tenga `lib/pestanas.ts` |
| `SharedSection.tsx`, `ShareModal.module.css` | Borrados en desktop; en web **se quedan** |

### Qué debe confirmar el usuario en la app
- Explorador: sin sección «Compartido» ni «Compartir» en el menú contextual; arrastrar una
  nota y una carpeta a otra carpeta, y **Ctrl+Z** para deshacer (H13).
- Pestañas: grafo, referencias, calendario, consola y un archivo no indexado, cada una en
  el área de panes **y anclada en el costado** (título, ícono y vista); en particular
  «Referencias del vault» anclada, que antes salía vacía (H9).
- Configuración → Vault → `.mycignore` en un vault **sin** el archivo: la plantilla aparece
  igual que antes (cabecera + `.*/`, `node_modules/`, `target/`, `dist/`, `out/`).
- Crear un dibujo, una base, un lienzo y un diagrama sin nombre: nacen como «Dibujo sin
  título», etc.; «insertar dibujo» desde el editor inserta el embed correcto.
- Abrir una nota: nada de colaboración en la consola de devtools.

## Relacionadas
- [[Auditoria de codigo 2026-09-26]] (plan de tandas y decisiones)
- [[auditoria-capa-de-datos]] (tanda 3, `FUN-L-24`)
- [[RAMAS]] · [[Estado con Zustand]]
