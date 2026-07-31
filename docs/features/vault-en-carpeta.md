# Vault en carpeta: el sistema de archivos como fuente de verdad (desktop)

> Estado: **diseño aprobado, implementación por fases**.
> Alcance: **solo-desktop**. La versión web mantiene la BD como fuente de verdad
> (un navegador no tiene acceso al sistema de archivos del usuario).

## 1. Objetivo

Que las notas vivan como **archivos `.md` reales en una carpeta del usuario**, como
en Obsidian: se pueden abrir con cualquier editor, versionar con git, sincronizar
con Dropbox/Syncthing y sobreviven a que esta app desaparezca.

Hoy todo vive dentro de un único SQLite (`%APPDATA%/com.mycelium.desktop/mycelium.db`):
las notas en la tabla `notas`, el texto en `contenidos`, y las carpetas son un árbol
virtual (`carpetas.padre_id`). No hay ni un `.md` en disco.

## 2. La idea central: invertir quién manda

**No se elimina SQLite.** Cambia su rol:

| | Antes | Después |
|---|---|---|
| Fuente de verdad | SQLite | **Los archivos en disco** |
| Rol de SQLite | Almacén | **Índice derivado y reconstruible** |
| Si se borra el índice | Se pierden las notas | Se regenera releyendo la carpeta |

Es exactamente el modelo de Obsidian (su carpeta `.obsidian/` guarda caché e índices
desechables). La búsqueda FTS5 y el grafo de wikilinks **siguen resolviéndose en SQL**:
si consultaran el disco directamente, el rendimiento se hundiría.

### Por qué esto es viable aquí (hallazgo clave)

Los **wikilinks ya se resuelven por título, no por id** (`grafo.ts`:
`porTitulo.get(destino.toLowerCase())`). El contenido markdown **nunca contiene UUIDs**:
ya es portable y limpio. Los identificadores son un detalle interno de la BD, no
contaminan los archivos. Esto elimina el mayor obstáculo típico de esta migración.

## 3. Layout en disco

```
<carpeta del vault>/
  Proyectos/
    2026/
      plan.md
  notas sueltas.md
  adjuntos/
    diagrama.excalidraw
  .mycelium/            ← equivalente a .obsidian/ (todo desechable)
    index.db            ← el SQLite, ahora índice derivado
    config.json
    .trash/             ← papelera (retención de 30 días, como hoy)
```

- **Carpetas** = directorios reales (deja de existir el árbol virtual).
- **Notas markdown** = archivos `.md`; el **título es el nombre del archivo**.
- **Excalidraw** = archivos `.excalidraw` (ya se exportan así).
- **`.mycelium/`** se ignora al indexar, igual que `.git`/`.obsidian`.

## 4. Decisiones de diseño

### 4.1 Identidad de una nota → **la ruta relativa** (decidido)

Hoy la identidad es un UUID. Con archivos como verdad, la identidad natural es la
**ruta relativa** (`Proyectos/2026/plan.md`), como en Obsidian. **Decisión tomada:
identidad por ruta**, sin UUIDs en los archivos (los `.md` quedan puros).

- El índice mantiene una tabla `notas(ruta PRIMARY KEY, titulo, tipo, mtime, tamano)`.
- Se conserva un `id` estable **derivado de la ruta** para no romper el frontend
  (pestañas, rutas `?note=`, grafo), que hoy referencia notas por id.
- **Consecuencia asumida:** renombrar o mover una nota **desde fuera** de la app
  cambia su identidad. Las pestañas abiertas de esa nota se cierran o se reabren en
  la ruta nueva. Es el comportamiento de Obsidian y es aceptable.

*Alternativa descartada:* incrustar UUIDs en el frontmatter de cada `.md`. Sobrevive a
renombrados externos, pero ensucia los archivos y rompe la pureza que justifica todo
este cambio.

### 4.2 Escritura → **debounce obligatorio**

Hoy cada guardado es un `UPDATE`. Escribir un archivo en disco en cada pulsación es
inviable (y destroza los SSD y los clientes de sincronización).

- Se escribe con **debounce de ~800 ms** tras dejar de teclear, más un *flush* forzado
  al cambiar de nota, cerrar pestaña o cerrar la app.
- Escritura **atómica**: escribir a temporal + `rename` (evita archivos a medias si se
  corta la luz o el proceso muere).

### 4.3 Cambios externos → **watcher con validación por `mtime`**

- Watcher nativo en Rust (crate `notify`) sobre la carpeta del vault.
- Eventos con **debounce** (~300 ms) porque los editores generan ráfagas.
- Al arrancar no se relee todo: se compara `mtime`+tamaño contra el índice y **solo se
  reindexa lo que cambió**.
- **Ignorar los propios escritos** de la app (marca de escritura reciente) para no
  entrar en bucle watcher → reindex → watcher.

### 4.4 Papelera

Borrar mueve el archivo a `.mycelium/.trash/` conservando su ruta original (ya existe
la columna `ruta_original`). Se mantiene la retención de 30 días y la purga.

### 4.5 Conflictos de nombre

El sistema de archivos impone reglas que la BD no tenía: caracteres prohibidos
(`\ / : * ? " < > |`), nombres reservados en Windows (`CON`, `PRN`, `AUX`, `NUL`,
`COM1`…), límite de longitud de ruta y colisiones entre dos notas con el mismo título
en la misma carpeta. Hay que sanear al escribir y desambiguar con sufijos.

## 5. Rendimiento: qué se paga y cómo se mitiga

El usuario acepta **algo menos de rendimiento a cambio de portabilidad**. Costes reales:

| Operación | Antes | Después | Mitigación |
|---|---|---|---|
| Abrir una nota | `SELECT` (~1 ms) | leer archivo (~1-5 ms) | Imperceptible |
| Guardar | `UPDATE` por pulsación | escribir archivo | **Debounce 800 ms** + escritura atómica |
| Buscar (FTS5) | SQL | **igual** (el índice sigue en SQLite) | Sin cambio |
| Grafo/wikilinks | SQL | **igual** | Sin cambio |
| Arranque en frío | abrir DB | indexar el vault | Solo la 1ª vez; luego validación por `mtime` |
| Mover/renombrar carpeta | `UPDATE` | mover en disco + reindexar subárbol | Aceptable |

**Referencia con el vault actual** (354 notas, 459 KB): el indexado inicial es del
orden de cientos de milisegundos. El coste se nota a partir de **miles** de notas.

**Riesgo conocido — carpetas en la nube:** un vault dentro de Dropbox/OneDrive/Drive
genera eventos de watcher constantes y puede provocar reindexados espurios y conflictos
de escritura. Debe documentarse como escenario no recomendado o, al menos, con el
watcher menos agresivo.

## 5bis. Múltiples vaults y selector de arranque (decidido)

Modelo Obsidian completo: los vaults pueden vivir en **cualquier carpeta del
dispositivo** y Mycelium las abre. La app mantiene un **registro de vaults
vinculados** (en el config-dir, fuera de los vaults).

- **Registro** (`vaults.json` en el config-dir): lista de `{ ruta, nombre,
  ultimoAcceso }` + `abrirUltimo: bool` (ajuste **global**, no por vault).
- **Al arrancar:**
  - Si hay una ruta persistida en la sesión (recarga) → reabre ese vault.
  - Si no y `abrirUltimo` está activo → reabre el **último vault usado** (el de
    `ultimoAcceso` más reciente), sea cual sea.
  - Si no → muestra el **selector de vaults**: lista de vinculados (por acceso
    reciente), botón "Abrir", "Vincular carpeta…" (diálogo del SO) y quitar de la
    lista.
- **"Abrir el último vault al iniciar"** es un interruptor global en
  **Configuración → Vault** (no una opción por vault): si está activo, la próxima
  vez que se inicie se abre el último vault que se haya usado.
- **Salir del vault:** una acción dentro del workspace cierra la sesión del vault
  actual y vuelve al selector, para elegir/vincular otro.
- **Vincular** = añadir la carpeta al registro (no copia nada; solo la recuerda).
  **Desvincular** = quitarla del registro (los archivos en disco no se tocan).
- `nombre` por defecto = nombre de la carpeta; editable a futuro.

El "vault abierto" es estado de runtime (qué carpeta usa la sesión actual),
distinto del registro (qué vaults conoce la app).

## 6. Estrategia de arranque: **empezar vacío** (decidido)

No hay migración automática del vault SQLite actual. El modo carpeta es un modo
nuevo que **coexiste** con el SQLite clásico durante el desarrollo:

1. El usuario elige la carpeta del vault (diálogo nativo, ya disponible). Puede estar
   **vacía** o contener ya `.md`/`.excalidraw` (p. ej. una carpeta de Obsidian, o el
   resultado de "Exportar a carpeta" de la opción 1).
2. Se crea `.mycelium/index.db` y se indexa lo que haya (vacío → vault vacío).
3. **El `mycelium.db` clásico no se toca**: queda intacto y separado. Quien quiera
   sembrar la carpeta desde su vault SQLite usa "Exportar a carpeta" (opción 1),
   manualmente.

El modo activo (SQLite clásico vs carpeta) se resuelve por configuración: si hay una
carpeta de vault seleccionada, la app trabaja contra ella; si no, sigue con el SQLite
clásico. A futuro el modo carpeta puede volverse el único de desktop.

## 7. Fases de implementación

1. **Selección y persistencia del vault** — elegir carpeta, guardarla, arrancar contra ella.
2. **Índice derivado** — nuevo esquema (`ruta` como clave), indexador inicial y validación por `mtime`.
3. **Lectura desde disco** — `tree`, `getContenido`, `buscar`, `grafo` sobre el índice+archivos.
4. **Escritura a disco** — crear/renombrar/mover/borrar notas y carpetas, con debounce y escritura atómica.
5. **Watcher** — cambios externos reflejados en la UI.
6. **Migración** — asistente para pasar del vault SQLite al vault en carpeta.
7. **Endurecido** — nombres inválidos, colisiones, rutas largas, papelera, casos borde.

Cada fase se verifica con `cargo check`/`cargo test`, `tsc` y prueba en la app antes de
seguir. Se integra por ramas de feature según el flujo de `CLAUDE.md`.

### 7.1 Fase 2 — decisiones concretas del índice (implementadas)

La fase 2 construye **solo la infraestructura** del índice; queda lista pero
**inactiva** (el arranque y el dispatcher `lib/api.ts` siguen usando `mycelium.db`).
Decisiones tomadas:

- **Ubicación del índice → app-data, un archivo por vault.** El índice NO vive
  dentro del vault sino en el app-data de la app, con nombre relativo
  `sqlite:index-<hash>.db` (el plugin `tauri-plugin-sql` lo resuelve en app-data).
  `<hash>` = primeros 16 hex del SHA-256 de la **ruta absoluta** del vault
  (calculado en TS con `crypto.subtle.digest`, en `lib/db/client.ts`
  `abrirIndiceDeVault`). Motivo: evita el dolor de cargar SQLite en rutas
  absolutas arbitrarias en Windows, y el índice es desechable/reconstruible.
- **Identidad de nota = su ruta relativa POSIX** (sin barra inicial): en el índice
  `notas.id = ruta` (p. ej. `Proyectos/2026/plan.md`). `titulo` = nombre de
  archivo sin extensión; `tipo` = `markdown`|`excalidraw` por extensión.
- **Carpetas derivadas de las rutas**: `carpetas.id` = ruta POSIX de la carpeta
  (`Proyectos/2026`), `padre_id` = carpeta padre o `NULL` en raíz, `nombre` =
  basename.
- **`vault_id` = constante `"vault"`** en todas las filas (hay un índice por
  vault, no hace falta distinguir).
- **Esquema espejo de `001_init.sql`.** El esquema del índice se define en TS
  (`lib/db/indexer.ts`, `ESQUEMA_INDICE`) con `CREATE TABLE IF NOT EXISTS`
  espejando las columnas de `carpetas`, `notas`, `contenidos`, `notas_fts`,
  `papelera` y `diagramas`, y **debe mantenerse en sync** con `001_init.sql`. NO
  se usa `_sqlx_migrations` (el índice no se migra con sqlx). Diferencias
  intencionadas: se omiten `usuarios`/`vaults`/`membresias`/`css_snippets` y las
  FK hacia `vaults`/`usuarios` (`vault_id` queda TEXT plano), y `notas` añade una
  columna extra **`mtime INTEGER`** para la validación incremental.
- **Indexado incremental por `mtime`.** El comando Rust `listar_archivos_meta`
  devuelve por archivo `{ rutaRelativa, contenido, mtime (ms epoch), tipo }`
  (ignora ocultos y el dir `.mycelium`). `indexarVault` upserta carpetas y notas,
  se salta las notas cuyo `mtime` no cambió, reindexa FTS (delete+insert) y borra
  del índice lo que ya no existe en disco. Excalidraw guarda su escena en
  `contenidos` igual que el markdown (fase 2 no separa `diagramas`).

### 7.2 Fase 5 — watcher de cambios externos (implementada)

La fase 5 refleja en la UI los cambios hechos **desde fuera de la app** (editar un
`.md` con otro editor, `git pull`, sincronización con Syncthing/Dropbox…). Solo
actúa en modo carpeta; el SQLite clásico queda intacto.

- **Watcher nativo (Rust).** `src-tauri/src/vault_watch.rs` usa el crate
  **`notify-debouncer-full` 0.3** (que arrastra `notify` v6). Un estado gestionado
  por Tauri (`WatcherState = Mutex<Option<Debouncer<…>>>`) guarda el debouncer
  activo. Dos comandos:
  - `iniciar_watcher(app, state, vaultRuta)`: crea un debouncer (~400 ms) que
    observa la carpeta recursivamente. Filtra por ruta relativa lo que cae bajo un
    directorio oculto (`.mycelium`, `.git`, `.obsidian`, …) y lo que no es
    `.md`/`.excalidraw` (los **borrados** sí pasan aunque no tengan extensión: la
    ruta borrada puede ser una carpeta entera). Si queda algo relevante, emite el
    evento Tauri **`vault-cambios`** con las rutas relativas afectadas. Reemplaza
    cualquier watcher previo (al cambiar de vault).
  - `detener_watcher(state)`: descarta el debouncer (dropearlo detiene la
    observación). Se llama al salir del vault.
- **Arranque/parada (frontend).** `vaultSessionStore.abrir()` invoca
  `iniciar_watcher` tras indexar; `salir()` (ahora `async`) invoca
  `detener_watcher` antes de soltar el vault.
- **Reacción (frontend).** `lib/vaultWatch.ts::escucharCambiosVault()` escucha
  `vault-cambios` con un **debounce propio (~300 ms)** para agrupar ráfagas; en
  cada tanda reindexa (`indexarVault`, incremental) y refresca el árbol
  (`useVaultStore.loadTree`). Luego dispara el evento de DOM
  `micelio:vault-recargar`. El listener se engancha en `WorkspaceShell` solo cuando
  hay un vault de carpeta abierto y se limpia al desmontar/salir (sin listeners
  duplicados).
- **Nota abierta.** Cada `NoteEditor` escucha `micelio:vault-recargar` y recarga su
  contenido desde el índice **solo si no tiene cambios locales sin guardar**
  (`dirtyRef`). Si los tiene, **no se pisa** la edición local (un aviso de
  conflicto explícito queda pendiente). La recarga aplica el contenido como cambio
  "remoto" (marca `brokerApplyRef` para no ensuciar la nota) y actualiza el caché
  de IndexedDB. Cada instancia abierta de la misma nota se recarga por su cuenta.

**No hay bucle de realimentación (clave del diseño).** Cuando la propia app escribe
una nota (fase 4), el watcher dispara igual, pero el frontend solo llama a
`indexarVault`, que **SOLO lee** archivos y actualiza el índice —nunca escribe
archivos— y es **incremental por `mtime`**. Así "app escribe → watcher dispara →
reindexa" termina en un reindex idempotente (a lo sumo una relectura del archivo
recién escrito), sin realimentación. Por eso **no hace falta** rastrear los propios
escritos de la app.

**Carpetas en la nube (Dropbox/OneDrive/Drive).** Generan ráfagas de eventos y
posibles reindexados espurios. Los dos debounces (400 ms en Rust + 300 ms en el
frontend) lo mitigan. No se ofrece todavía un interruptor para desactivar el
watcher (queda para fase 6/7). Sigue siendo un escenario no recomendado (§5).

### 7.3 Fase 7 — endurecido de casos borde del sistema de archivos (implementada)

Endurece las cuatro esquinas que el modelo "archivos = verdad" hace visibles. Todo
actúa SOLO en modo carpeta (`getVaultActual() !== null`); el SQLite clásico queda
byte a byte igual.

- **Nombres inválidos → saneo centralizado.** Se extrajo un módulo **puro** sin
  dependencias `lib/db/nombres.ts` (`sanearNombre`, `esReservadoWindows`,
  `desambiguar`), reexportado desde `vaultFs.ts`. `sanearNombre`: reemplaza los
  prohibidos (`\ / : * ? " < > |`) por `-`, quita caracteres de control, colapsa
  espacios, recorta espacios/puntos finales (Windows los recorta), aplica un
  `fallback` si queda vacío ("Sin título" para notas, "Sin nombre" para carpetas) y
  añade `_` a los reservados de Windows (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`,
  `LPT1`–`LPT9`, case-insensitive). El título mostrado sigue al nombre saneado (como
  Obsidian). Test headless en `scripts/test-nombres.mjs`
  (`node --test`, transpila el `.ts` puro al vuelo con la devDep `typescript`).
- **Colisiones en la misma carpeta.**
  - *Crear / duplicar nota y crear carpeta*: la desambiguación se hace a nivel de
    **nombre de archivo** (no de título) con sufijo incremental estilo Obsidian
    (" 1", " 2"…) consultando el índice (`nombreNotaLibre`/`nombreCarpetaLibre` en
    `vaultFs.ts`). Así no se pisa un archivo real aunque dos títulos distintos
    saneen al mismo nombre o ya exista una carpeta con ese nombre.
  - *Renombrar / mover nota o carpeta*: si el destino ya existe en la misma carpeta
    se **rechaza** con `DbError(409, "Ya existe … con ese nombre …")` (`rutaOcupada`
    consulta el índice antes de tocar el disco), en vez de pisar.
  - *Red de seguridad en Rust*: `vault_fs::mover_ruta` ya NO sobrescribe un destino
    existente (devuelve error), salvo el renombrado que solo cambia
    mayúsculas/minúsculas en FS insensibles (origen y destino canonicalizan al mismo
    archivo).
- **Papelera: purga física.** `borrarPermanente`/`purgarExpiradas` ya borraban el
  archivo físico de `.mycelium/.trash` vía `borrar_definitivo` (retención de 30 días
  intacta). La fase 7 añade en Rust la **poda de subcarpetas vacías** de la papelera
  tras cada borrado, para no dejar un esqueleto de directorios.
- **Carpetas vacías sobreviven al reindex.** Nuevo comando Rust
  `archivos::listar_directorios` enumera TODOS los directorios reales (incluidos los
  vacíos), ignorando ocultos/`.mycelium`. `indexer.ts::indexarVault` los inserta
  además de las carpetas derivadas de las rutas de archivos, de modo que una carpeta
  sin notas persiste al reabrir el vault.

**Riesgo — carpetas en la nube (recordatorio).** Un vault dentro de
Dropbox/OneDrive/Drive sigue siendo escenario no recomendado (§5, §7.2): además de
los eventos espurios del watcher, la sincronización externa puede renombrar/duplicar
archivos con sufijos propios ("(conflicted copy)") que el saneo/desambiguación de
esta fase NO reconcilia. Sigue pendiente un interruptor para desactivar el watcher.

---

## 8. Cómo volver atrás (SQLite como fuente de verdad)

> Sección pedida explícitamente: si el rendimiento con vaults grandes resulta
> inaceptable, este es el camino de vuelta.

**La vuelta es viable por diseño** y esa es justamente la ventaja de que los archivos
sean texto plano: no hay nada propietario que rescatar.

### Señales que justificarían revertir
- Indexado inicial de varios segundos con vaults grandes (>5.000 notas).
- Watcher consumiendo CPU de forma sostenida, o eventos espurios en carpetas de nube.
- Corrupción o pérdida de datos por conflictos de sincronización externa.
- Latencia perceptible al guardar pese al debounce.

### Procedimiento de vuelta
1. **Importar la carpeta a SQLite**: `collectFromNativeFolder()` + el pipeline de
   importación **ya existen y quedan funcionando**. Un vault en carpeta se reimporta a
   un `mycelium.db` clásico sin escribir código nuevo.
2. **Volver a la capa de datos anterior**: la implementación pre-migración queda en el
   historial de git; el commit de la fase 3 es el punto de corte. No se borra código:
   se sustituye, y `git revert` del rango de fases lo restituye.
3. **Conservar el respaldo**: el `mycelium.db` original nunca se borra en la migración
   (§6.4), así que existe un punto de retorno inmediato para quien no haya escrito
   notas nuevas desde el cambio.

### Diseño que mantiene la puerta abierta
- **No incrustar UUIDs ni metadatos propietarios en los `.md`** (§4.1): los archivos
  siguen siendo markdown puro en ambas direcciones.
- **Mantener el contrato de `lib/api.ts` intacto**: el dispatcher expone las mismas
  rutas (`/notas/:id/contenido`, `/vaults/:id/tree`…). Cambiar de motor de
  almacenamiento no debe tocar los ~53 call-sites del frontend. Esta es la garantía
  más importante para poder ir y volver.
- **El índice es desechable**: nunca debe contener información que no se pueda
  reconstruir releyendo la carpeta. Al vivir en el app-data (`index-<hash>.db`,
  §7.1) y NO dentro del vault, **se puede borrar sin tocar los datos**: la próxima
  apertura del vault lo regenera releyendo la carpeta. Esto vale también como
  reinicio ante corrupción del índice.

### Alternativa intermedia (si el problema es solo rendimiento)
Antes de revertir del todo, se puede mantener el modelo de archivos pero **cachear más
agresivamente**: contenido en memoria para las notas abiertas, indexado incremental en
segundo plano y watcher desactivable por configuración. Es mucho menos costoso que
volver atrás.

## Relacionadas

- [[Capa de datos del desktop]] — cómo quedó la capa de datos tras estas fases.
- [[fs-nativo-desktop]] — la integración con el sistema de archivos que lo habilitó.
- [[mycignore]] — qué entra al índice del vault y qué no.
- [[Tauri y el WebView]] — watcher, escrituras atómicas y rutas validadas.
- [[Mapa de documentacion]] — índice general.
