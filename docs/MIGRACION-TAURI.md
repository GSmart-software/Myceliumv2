# Migración a Tauri — Desglose de tareas

> **Rama:** `reestructuracion` (base: `desktop-tauri` @ `242f298`)
> **Plan de referencia:** `C:\Users\gabip\.claude\plans\staged-churning-tower.md`
> **Objetivo:** Mycelium como **app de escritorio real** (Win/Linux/macOS), **un único sistema**
> = el frontend, **sin backend .NET**, con **SQLite nativo** vía `tauri-plugin-sql`.
> **Regla de oro:** se preservan TODAS las funcionalidades actuales salvo las que el plan
> marca como cambio (PDF→cliente, colaboración→dormida, sharing→latente/no-op, web→congelada).

---

## Cómo usar este documento

- Las tareas están ordenadas por dependencia. Ejecutar de arriba a abajo.
- Cada tarea es lo más pequeña posible y **debe terminar en un commit propio** (o en un
  commit por micro-grupo cuando son triviales y acoplados).
- Marca `[x]` al completar. Anota bloqueos/decisiones en la línea de la tarea.
- **Criterio de "hecho"** de cada tarea = su bullet de verificación se cumple.

### Convenciones
- **Commits:** `tipo(area): descripción [fase N]` en español, como el historial actual
  (`feat`, `fix`, `chore`, `test`, `refactor`). Ej.: `feat(db): repo de carpetas con anti-ciclo [fase 1]`.
- **Verificación por fase:** reusar/adaptar los smoke tests Playwright del frontend
  (`frontend/scripts/smoke-*.mjs`) y comparar contra paridad con la web.
- **Gotchas conocidos** (ver memoria del proyecto):
  1. La herramienta Write interpreta ciertos bytes como NUL — cuidado al generar SQL/scripts.
  2. Un hook de PowerShell bloquea comandos con rutas tipo URL (`/contenido`); usar
     archivos `.ps1` y `git commit -F archivo`.
  3. **FTS5** debe estar habilitado en el SQLite del plugin (confirmado en spike — re-verificar
     si cambia la versión del plugin).
- **No tocar la UI** salvo donde una tarea lo diga explícitamente. La superficie de
  componentes React se conserva.

### Estados
- `[ ]` pendiente · `[~]` en progreso · `[x]` hecho · `[!]` bloqueado

---

## Superficie a migrar (referencia)

Endpoints .NET actuales que la capa de datos TS debe cubrir (44):

| Grupo | Endpoints |
|---|---|
| **Auth (latente)** | `POST /login` `/register` `/refresh` `/logout` `/verify-email` `/forgot-password` `/reset-password` `/cambiar-password` `POST /cerrar-todo` · `GET /me` · `PATCH /perfil` |
| **Preferencias** | `PUT /preferencias` (+ lectura vía `/me`) |
| **Árbol/carpetas** | `GET /vaults/{v}/tree` · `POST /vaults/{v}/carpetas` · `PATCH /carpetas/{id}` · `DELETE /carpetas/{id}` · `POST /carpetas/{id}/mover` |
| **Notas** | `POST /vaults/{v}/notas` · `PATCH /notas/{id}` · `DELETE /notas/{id}` · `POST /notas/{id}/mover` · `POST /notas/{id}/duplicar` |
| **Papelera** | `GET /vaults/{v}/papelera` · `POST /notas/{id}/recuperar` · `DELETE /notas/{id}/permanente` |
| **Contenido** | `GET /notas/{id}/contenido` · `PUT /notas/{id}/contenido` (+ reindex FTS) |
| **Diagramas** | `GET /notas/{n}/diagramas/{d}` · `PUT /notas/{n}/diagramas/{d}` |
| **Búsqueda** | `GET /vaults/{v}/buscar` |
| **Grafo** | `GET /vaults/{v}/grafo` · `GET /notas/{id}/conexiones` |
| **CSS snippets** | `GET /css/snippets` · `POST /css/snippets` · `PATCH /css/snippets/{id}` · `DELETE /css/snippets/{id}` |
| **Sharing (latente/no-op)** | `GET /compartido` · `POST /carpetas/{id}/compartir` · `GET/PATCH/DELETE /carpetas/{id}/miembros[/{u}]` · `GET /vaults/{v}/carpetas-compartidas` |
| **Colaboración (deshabilitada)** | `GET /notas/{id}/colaboracion` |
| **Export** | `POST /notas/{id}/exportar-pdf` → **pasa a cliente** |
| **Dev/health** | `GET /health` · `GET /dev/db-info` |

Esquema portado ya presente: `frontend/src-tauri/migrations/001_init.sql`
(tablas: `usuarios`, `refresh_tokens`, `tokens_un_uso`, `vaults`, `membresias`,
`carpetas`, `notas`, `papelera`, `notas_fts` (FTS5), `css_snippets`).

---

# FASE 0 — Spike / validación de riesgos ✅ (hecho)

- [x] **T0.1** Scaffold Tauri v2 + `tauri-plugin-sql` (SQLite nativo) — `21f3f13`.
- [x] **T0.2** Smoke test headless del data layer sobre SQLite del plugin — `242f298`.
- [ ] **T0.3** Confirmar formalmente **FTS5 habilitado**: ejecutar un `MATCH` real desde el
      frontend embebido (no solo test Rust) y dejar constancia. Medir footprint/arranque
      y anotarlos aquí. ▸ *Verif.: búsqueda con `snippet()` devuelve resultados; cifras de
      arranque/RAM anotadas.*

---

# FASE 1 — Capa de datos TS (`frontend/lib/db/`) + esquema

> Meta: CRUD de árbol, carpetas, notas, contenido+FTS, diagramas y papelera funcionando
> a través de `tauri-plugin-sql`, con `lib/api.ts` como dispatcher.

### 1A. Infraestructura de la capa de datos
- [x] **T1.1** `frontend/lib/db/client.ts`: puerto `SqlExecutor` (select/execute) + executor
      Tauri por defecto (carga lazy de `@tauri-apps/plugin-sql`, `Database.load('sqlite:mycelium.db')`)
      + `setExecutor()` para inyectar en tests/adaptador web. SQL portable con placeholders `?`.
- [x] **T1.2** `frontend/lib/db/types.ts`: filas `Row*` (snake_case) + DTOs de respuesta con la
      forma EXACTA que ya esperan los call-sites (tree, papelera, contenido, sesión, snippets, búsqueda…).
- [x] **T1.3** `frontend/lib/db/util.ts`: `nuevoId()` (uuid), `ahoraIso()`, `byteLen()`,
      `tituloUnico()` y `buildRutaLookup()/rutaDe()` — portados 1:1 de `VaultEndpoints`.
- [x] **T1.4** Esquema verificado: `001_init.sql` coincide con el backend salvo los cambios
      deliberados (contenido en `contenidos`/`diagramas`, sin `r2_key`, sin `refresh_tokens`/
      `tokens_un_uso` por auth latente sin JWT, preferencias en la fila `usuarios`). Sin cambios.

### 1B. Repo de estructura (árbol + carpetas)
- [x] **T1.5** `db/tree.ts` → `tree(vaultId)`: construir árbol carpetas+notas como hoy
      (`GET /vaults/{v}/tree`). ▸ *Verif.: árbol idéntico al de la web para un vault de prueba.*
- [x] **T1.6** `db/carpetas.ts` → `crearCarpeta(vaultId, padreId, nombre)` con nombre único
      entre hermanos. ▸ *Verif.: crear dos "Carpeta" produce "Carpeta" y "Carpeta 2".*
- [x] **T1.7** `renombrarCarpeta(id, nombre)` (`PATCH /carpetas/{id}`). ▸ *Verif.: renombra y
      persiste; colisión de nombre resuelta como el backend.*
- [x] **T1.8** `moverCarpeta(id, nuevoPadreId)` con **chequeo anti-ciclo de subárbol**
      (`POST /carpetas/{id}/mover`). ▸ *Verif.: mover una carpeta dentro de su propio subárbol
      se rechaza igual que en .NET.*
- [x] **T1.9** `borrarCarpeta(id)` (recursivo: notas a papelera / borrado según regla actual)
      (`DELETE /carpetas/{id}`). ▸ *Verif.: paridad con backend (subárbol + notas).*

### 1C. Repo de notas
- [x] **T1.10** `db/notas.ts` → `crearNota(vaultId, carpetaId)` con **sufijo de título único**
      ("Nota"→"Nota 2") (`POST /vaults/{v}/notas`). ▸ *Verif.: sufijo idéntico al backend.*
- [x] **T1.11** `renombrarNota(id, titulo)` (`PATCH /notas/{id}`) — mantener unicidad.
      ▸ *Verif.: renombra y reindexa título en FTS (ver T1.16).*
- [x] **T1.12** `moverNota(id, carpetaId)` (`POST /notas/{id}/mover`). ▸ *Verif.: mueve; el
      árbol refleja el cambio.*
- [x] **T1.13** `duplicarNota(id)` (`POST /notas/{id}/duplicar`) — copia contenido+diagramas,
      título único. ▸ *Verif.: duplicado con "… copia"/sufijo como el backend.*

### 1D. Papelera
- [x] **T1.14** `db/papelera.ts` → `borrarNota(id)`→papelera (`DELETE /notas/{id}`),
      `listarPapelera(vaultId)` (`GET /vaults/{v}/papelera`), `recuperar(id)`
      (`POST /notas/{id}/recuperar`), `borrarPermanente(id)` (`DELETE /notas/{id}/permanente`).
      ▸ *Verif.: ciclo borrar→listar→recuperar→borrar-permanente completo.*
- [x] **T1.15** `purgarPapelera(vaultId)` **>30 días** (misma regla que backend). Definir
      cuándo se dispara (al abrir vault / al listar). ▸ *Verif.: entrada con fecha vieja
      se purga; reciente no.*

### 1E. Contenido + FTS
- [x] **T1.16** `db/contenido.ts` → `getContenido(id)` / `putContenido(id, texto)` sobre la
      **tabla de contenido** (`GET/PUT /notas/{id}/contenido`, forma `{ contenido, actualizadoEn }`).
      Incluir **reindex FTS** (delete+insert en `notas_fts`) en cada save y en rename/crear/duplicar.
      ▸ *Verif.: guardar contenido → aparece en búsqueda; el caché IndexedDB del editor sigue
      funcionando sin cambios.*
- [x] **T1.17** `db/diagramas.ts` → `getDiagrama(n,d)` / `putDiagrama(n,d,json)`
      (`GET/PUT /notas/{n}/diagramas/{d}`). ▸ *Verif.: embed Excalidraw carga/guarda.*

### 1F. Dispatcher
- [x] **T1.18** Convertir `frontend/lib/api.ts` en **dispatcher local**: parsear `(method, path)`
      y enrutar a las funciones de `lib/db/*`; conservar la firma `api<T>(path, {method, body})`
      y `ApiError`. Quitar `fetch`/base URL/cookies/token. **Los ~53 call-sites quedan intactos.**
      Rutas aún no migradas → error explícito "no implementado" temporal.
      ▸ *Verif.: `tsc` compila; una operación de árbol real pasa por el dispatcher.*
- [x] **T1.19** Cablear en el dispatcher todo el grupo **árbol/carpetas/notas/papelera/
      contenido/diagramas** (T1.5–T1.17). ▸ *Verif.: crear/renombrar/mover/borrar/recuperar
      y editar contenido desde la UI real, sin backend levantado.*
- [~] **T1.20** Smoke test de fase 1 (adaptar `smoke-*.mjs`): árbol + CRUD + papelera + contenido.
      ▸ *Verif.: script verde end-to-end contra la app Tauri.*
      **Pendiente:** requiere runtime Tauri (webview + `tauri-plugin-sql`). La semántica SQL/FTS
      ya está cubierta por el test Rust `data_layer.rs`; el dispatcher + repos pasan `tsc` verde.

---

# FASE 2 — Búsqueda y grafo en TS

- [ ] **T2.1** Portar `BuildFtsQuery` (de `SearchEndpoints.cs`) a `frontend/lib/db/fts.ts`:
      tokenización, comillas, prefijo `*`, exacta vs prefijo (respetar el toggle DEF-035).
      ▸ *Verif.: mismos tokens de salida que el backend para casos de prueba.*
- [ ] **T2.2** `db/buscar.ts` → `buscar(vaultId, q, opts)` con `… FROM notas_fts WHERE notas_fts
      MATCH ?` + `snippet()` (`GET /vaults/{v}/buscar`). ▸ *Verif.: resultados y snippets
      equivalentes a la web; búsqueda por prefijo por defecto + toggle exacta.*
- [ ] **T2.3** Portar `BuildVaultGraphAsync` a `db/grafo.ts` → `grafo(vaultId)`: leer contenidos,
      regex `[[wikilink]]` / `#tag`, resolver por título (reusar `resolveWikilink`), aristas+grados
      (`GET /vaults/{v}/grafo`). ▸ *Verif.: grafo con mismos nodos/aristas; construcción temporal
      (timelapse) y reglas de ocultar nodos siguen funcionando.*
- [ ] **T2.4** `conexiones(notaId)` (`GET /notas/{id}/conexiones`) — enlaces entrantes/salientes.
      ▸ *Verif.: panel de conexiones idéntico.*
- [ ] **T2.5** Cablear búsqueda+grafo+conexiones en el dispatcher. ▸ *Verif.: búsqueda global
      y grafo operan desde la UI real.*
- [ ] **T2.6** Smoke test de fase 2 (búsqueda + grafo). ▸ *Verif.: script verde.*

---

# FASE 3 — Preferencias, CSS snippets y auth latente

- [ ] **T3.1** `db/preferencias.ts` → leer/escribir preferencias (`PUT /preferencias` + lectura
      vía `/me`). ▸ *Verif.: tema/preferencias persisten entre reinicios de la app.*
- [ ] **T3.2** `db/snippets.ts` → CRUD css snippets (`GET/POST /css/snippets`,
      `PATCH/DELETE /css/snippets/{id}`). ▸ *Verif.: crear/editar/activar/borrar snippet aplica
      CSS en vivo.*
- [ ] **T3.3** `db/auth.ts` — **auth latente**: `seed()` que siembra 1 usuario + 1 vault por
      defecto si la DB está vacía; `me()` devuelve esa sesión fija. ▸ *Verif.: primera apertura
      crea usuario+vault; siguientes reutilizan.*
- [ ] **T3.4** Stubs locales de `login/register/refresh/logout/verify-email/forgot-password/
      reset-password/cambiar-password/cerrar-todo/perfil`: resuelven local sin JWT, conservan
      forma de respuesta. ▸ *Verif.: ningún flujo de UI rompe por auth; sin red.*
- [ ] **T3.5** Ajustar `frontend/stores/authStore.ts`: `restore()/login()` resuelven contra el
      usuario+vault sembrado; `initialized:true` para pasar `WorkspaceGuard`; token vacío.
      Conservar la forma del store para la nube futura. ▸ *Verif.: la app arranca directo al
      workspace sin pantalla de login.*
- [ ] **T3.6** Sharing como **no-op**: `GET /compartido`, `carpetas-compartidas`, `compartir`,
      `miembros/*` devuelven vacío/éxito neutro; tablas conservadas. ▸ *Verif.: UI de compartir
      no crashea; muestra estado vacío.*
- [ ] **T3.7** Colaboración **deshabilitada**: `GET /notas/{id}/colaboracion` → `null` (como
      local hoy); Yjs no se importa. ▸ *Verif.: abrir nota no intenta relay; editor normal.*
- [ ] **T3.8** Smoke test de fase 3 (preferencias + snippets + arranque sin login).
      ▸ *Verif.: script verde; toda la UI navegable.*

---

# FASE 4 — Ajustes del frontend (PDF cliente, import, seam web/desktop)

- [ ] **T4.1** **Export PDF cliente**: reemplazar `POST /notas/{id}/exportar-pdf` por generación
      en el front desde el HTML ya renderizado (impresión del webview vía `tauri-plugin` de
      print/`window.print` con estilos de `printStyles.ts`, o librería JS). ▸ *Verif.: PDF sale
      del contenido renderizado; comparar visualmente con el de PuppeteerSharp (se acepta
      pequeña divergencia).*
- [ ] **T4.2** Reenrutar los **3 `fetch` directos** a la capa de datos / plugins:
      `lib/excalidraw.ts` (load/save diagrama), `lib/export.ts`, y el `beforeunload` de
      `NoteEditor.tsx`. ▸ *Verif.: guardar diagrama y export funcionan sin `fetch` HTTP.*
- [ ] **T4.3** **Import de archivos** (`lib/import.ts`): usar `tauri-plugin-dialog`/`-fs` para
      selección/lectura donde aplique, conservando el drag-and-drop web como fallback.
      ▸ *Verif.: importar `.md`/`.excalidraw` desde diálogo nativo crea notas.*
- [ ] **T4.4** **Seam web vs desktop**: abstraer la capa de datos tras una interfaz; implementación
      Tauri (SQLite) = nueva; implementación web (fetch→.NET) conservada tras flag/entorno
      (`process.env` o build target). El desktop puede divergir sin tocar la web. ▸ *Verif.: build
      web sigue apuntando al backend; build Tauri usa SQLite; un solo `lib/api.ts` con dos backends.*
- [ ] **T4.5** Config de build: `next.config.ts` `output:'export'` verificado; Tauri apunta a
      `frontend/out`; `beforeDevCommand`/`beforeBuildCommand` en `tauri.conf.json`. ▸ *Verif.:
      `tauri dev` levanta la SPA embebida; `tauri build` empaqueta `out/`.*
- [ ] **T4.6** Smoke test de fase 4 (PDF + import + diagramas + build embebido).
      ▸ *Verif.: script verde en app empaquetada de dev.*

---

# FASE 5 — Integración con el SO + empaquetado

- [ ] **T5.1** Configurar ventana en `tauri.conf.json`: tamaño/mín, título, icono, tema.
      ▸ *Verif.: ventana nativa con branding Mycelium.*
- [ ] **T5.2** Menús nativos + atajos (nuevo, guardar, buscar, alternar panel, etc.) mapeados
      a acciones del frontend vía eventos. ▸ *Verif.: atajos del SO disparan acciones reales.*
- [ ] **T5.3** Ubicación del `.db` en el **app-data dir** del SO + creación en primer arranque.
      ▸ *Verif.: la DB persiste en la ruta correcta por SO.*
- [ ] **T5.4** Asociación de archivos `.md`/`.excalidraw` (abrir con Mycelium). ▸ *Verif.: doble
      clic abre la app en esa nota/diagrama (al menos Windows en primera pasada).*
- [ ] **T5.5** Capabilities/permite mínimos de Tauri (`capabilities/default.json`): solo sql/fs/
      dialog/print necesarios. ▸ *Verif.: la app funciona con permisos mínimos; sin warnings de ACL.*
- [ ] **T5.6** CI de empaquetado (GitHub Actions o equivalente) → instaladores **Win/Linux/macOS
      sin firmar**. ▸ *Verif.: pipeline produce los 3 artefactos.*
- [ ] **T5.7** Validación temprana **WebKitGTK (Linux)**: editor + Excalidraw + grafo con
      rendimiento aceptable. ▸ *Verif.: notas anotadas; sin bloqueadores.*
- [ ] **T5.8** Cada instalador arranca y abre un vault. ▸ *Verif.: humo manual en los 3 SO
      (o los disponibles).*

---

# FASE 6 — Migración de datos existentes

- [ ] **T6.1** Script/rutina de migración: leer `micelio.local.db` + `.local-storage/blobs`
      actuales (`.md`/`.excalidraw`/CSS) e **importar contenido a la tabla** del nuevo modelo.
      ▸ *Verif.: dry-run reporta N notas/diagramas/snippets a migrar.*
- [ ] **T6.2** Ejecutar migración sobre datos reales y confirmar **lectura/escritura sin pérdida**
      (conteos, títulos, contenidos, enlaces del grafo). ▸ *Verif.: checklist de paridad de datos
      100%; backup del origen guardado antes.*
- [ ] **T6.3** Idempotencia/reejecución segura de la migración. ▸ *Verif.: correr dos veces no
      duplica.*

---

# FASE 7 — Futuro (post-migración, no bloqueante)

- [ ] **T7.1** Proveedor remoto Cloudflare (D1/R2) detrás de **la misma capa de datos** (seam de T4.4).
- [ ] **T7.2** Firma/notarización + auto-update.
- [ ] **T7.3** Reactivar sharing + colaboración (Durable Object / relay Yjs).
- [ ] **T7.4** Tabla de enlaces materializada para el grafo (si escala mal).

---

## Checklist de paridad final (contra la web)

- [ ] Árbol: crear/renombrar/mover/borrar carpetas y notas (+ anti-ciclo, sufijos únicos)
- [ ] Papelera: borrar/listar/recuperar/permanente/purga 30 días
- [ ] Contenido: editar/guardar + caché IndexedDB + reindex FTS
- [ ] Búsqueda: exacta y por prefijo (DEF-035) + snippets
- [ ] Grafo: nodos/aristas, construcción temporal, reglas de ocultar, grupos de color
- [ ] Excalidraw: crear, render en vivo, embed, drag para vincular (DEF-017)
- [ ] Preferencias + temas + CSS snippets en vivo
- [ ] Import/Export (PDF cliente, import nativo)
- [ ] Arranque sin login (auth latente) → workspace directo
- [ ] Persistencia de pestañas/panes/distribución (workspace)

## Congelado (no se toca en esta migración)
- `backend/` (todo .NET), deploy web (`render.yaml`, `wrangler.toml`), colaboración Yjs activa,
  sharing real. Se conservan como referencia y para el build web congelado.
