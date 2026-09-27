# Capa de datos del desktop

Cómo persiste Mycelium en la versión de escritorio (`desktop-tauri`). Parte de
[[Arquitectura de Mycelium]].

## Modelo: la carpeta es la verdad, SQLite es el índice

Desde el [[vault-en-carpeta]], el vault es una **carpeta real** del sistema:

- Los `.md` y `.excalidraw` **en disco** son la fuente de verdad.
- El **índice SQLite derivado** (búsqueda, grafo, metadatos) vive en el **app-data** de la
  aplicación, un archivo por vault: `%APPDATA%/com.mycelium.desktop/index-<hash>.db`, con el
  *hash* de la ruta del vault. **No** vive dentro del vault.
- `<vault>/.mycelium/` guarda la **papelera** (`.mycelium/.trash/` y su registro,
  `papelera.json`), las **preferencias del vault** con su apariencia —tema, modo oscuro,
  atmósferas, tipografía— (`preferencias.json`, [[preferencias-por-vault]]), los **snippets
  CSS** (`snippets.json`) y los **recordatorios** (`recordatorios.json`). Todo pasa por un
  solo par de comandos Rust, `leer_estado_vault` / `escribir_estado_vault`, con una lista
  cerrada de nombres (`src-tauri/src/prefs_vault.rs`).

> [!important] Solo hay vault en carpeta, y no hay identidad (desde `FUN-L-24`, 2026-09-26)
> El «modo SQLite clásico» —notas dentro de `mycelium.db`, sin carpeta— se retiró
> ([[El modo SQLite clasico queda muerto]]): no hay otra base, ni migración sqlx, ni rama
> `vault === null` en los repos. Sin vault abierto, `getVaultActual()` y `getExecutor()`
> **lanzan**, y el workspace redirige a la selección de vaults. Un `mycelium.db` que quede
> en el app-data de una instalación vieja se ignora.
>
> Tampoco hay identidad interna: `authStore` es una fachada de constantes (el vault es
> siempre `LOCAL_VAULT_ID`, porque cada vault tiene su propio índice) y el esquema del
> índice ya no crea `usuarios`, `vaults`, `membresias` ni `css_snippets`. Ver
> [[auditoria-capa-de-datos]].

> [!warning] Esta nota dijo durante dos meses que el índice vivía en `.mycelium/`
> Fue el diseño inicial, pero al implementarlo (2026-07-20, fase 2 de [[vault-en-carpeta]])
> se decidió ponerlo en el app-data —ahí está escrito, § «Ubicación del índice»— y esta
> nota, junto con otras cuatro, nunca se actualizó. Lo detectó la revisión crítica del
> diseño del MCP el 2026-09-23, verificado en `lib/db/client.ts` (`sqlite:index-${hash}.db`,
> que `tauri-plugin-sql` resuelve en el app-data) y en el disco.
- El índice se puede **reconstruir** desde los archivos: es caché, no origen. La única
  tabla que no se deriva de ningún archivo, `papelera`, se respalda en
  `.mycelium/papelera.json` en cada cambio y se rellena desde él al abrir (`DEF-107`,
  `lib/db/estadoVault.ts`); lo demás que es del vault ni siquiera pasa por el índice.

> [!important] Consecuencia de diseño
> El **id de una nota o carpeta es su ruta relativa**. Eso hace que renombrar o mover
> **cambie el id**, y por eso existe `remapNota` / `remapCarpeta` en el store de
> pestañas: la pestaña abierta debe seguir a la nota.
>
> Ese mismo detalle causó un bug notable: `lib/api.ts` segmentaba la URL con
> `split('/')`, así que **cualquier** operación por id de una nota en subcarpeta
> (mover, renombrar, borrar) fallaba. Corregido en `1634128`.

## Reparto TypeScript / Rust

| Responsabilidad | Dónde |
|---|---|
| Repos de datos (árbol, notas, papelera, contenido + FTS, propiedades, enlaces, bases) | `frontend/lib/db/*` (TS, sobre `tauri-plugin-sql`) |
| Dispatcher que emula la API HTTP (sin rutas de autenticación) | `frontend/lib/api.ts` |
| Preferencias + apariencia y snippets CSS del vault | `stores/prefsVaultStore.ts` (con `preferencesStore`) y `stores/cssStore.ts`, directo contra `.mycelium/` |
| Archivos de estado de `.mycelium/` | `src-tauri/src/prefs_vault.rs` |
| Lectura/escritura de archivos, papelera, revelar en el SO | `src-tauri/src/vault_fs.rs` |
| Recorrido del vault para indexar | `src-tauri/src/archivos.rs` |
| Watcher de cambios externos | `src-tauri/src/vault_watch.rs` |
| Qué se ignora | `src-tauri/src/mycignore.rs` (ver [[mycignore]]) |
| Vaults conocidos y "abrir el último" | `src-tauri/src/vault_config.rs` |
| Terminal integrada (PTY) | `src-tauri/src/terminal.rs` (ver [[terminal-integrada]]) |

Detalle histórico de cómo se construyó cada pieza: [[MIGRACION-TAURI]] y
[[fs-nativo-desktop]].

## Escrituras seguras

Toda escritura pasa por dos garantías en Rust (ver [[Tauri y el WebView]]):

- **Atomicidad**: `escribir_nota` escribe a un temporal hermano y hace `rename`, así un
  corte de luz nunca deja un archivo a medias.
- **Ruta validada**: `ruta_segura` rechaza `..`, rutas absolutas y prefijos de unidad
  (defensa contra *path traversal*, porque las rutas se arman con títulos del usuario).
- **Nombres saneados**: `lib/db/nombres.ts` limpia caracteres prohibidos en Windows
  (`\ / : * ? " < > |`), control y nombres reservados (`CON`, `NUL`…).

## Sincronización con cambios externos

El watcher nativo (debounce ~400 ms) emite `vault-cambios`; el frontend reindexa
**incremental por `mtime`** y refresca el árbol. Así se reflejan ediciones hechas con
otro editor, un `git pull` o una sincronización tipo Dropbox.

No hay bucle de realimentación: el indexador **solo lee**, así que el ciclo
"app escribe → watcher dispara → reindexa" termina en un reindex idempotente.

## Esquema y migraciones

El esquema del índice vive en `frontend/lib/db/indexer.ts` (`ESQUEMA_INDICE`) y se crea
al abrir cada vault con `CREATE TABLE IF NOT EXISTS`. **No hay migraciones sqlx**: un
cambio de columnas va como `ALTER TABLE` defensivo en `crearEsquemaIndice` (así entraron
`papelera.ruta_papelera`, `notas.hash_indexable` y `notas.hash_enlaces`), que es lo que
permite abrir sin error un índice creado por una versión anterior. Y como el índice es
desechable, el remedio ante uno roto es borrarlo: se reconstruye releyendo la carpeta.

| Tabla | Qué guarda | Quién la escribe |
|---|---|---|
| `carpetas`, `notas` | El árbol: id = ruta, título, tipo, `mtime` y las dos huellas | Indexador; los repos al crear, renombrar, mover |
| `contenidos` | El texto de cada nota | Indexador y guardado |
| `notas_fts` + `fts_filas` | La búsqueda (FTS5) y qué `rowid` le toca a cada nota (`DEF-105`) | Indexador y guardado, si cambió `hash_indexable` |
| `propiedades` | El frontmatter, una fila por elemento ([[metadata-yaml]]) | Ídem |
| `enlaces` | Cada `[[enlace]]`, embed y referencia de canvas de una nota: lo escrito (`destino_texto`), su `clave` y `clave_ancla` de re-resolución, la nota a la que resuelve (`destino_id`, NULL si está roto), `tipo` y cuántas veces (`n`) | Indexador y guardado, si cambió `hash_enlaces`; re-resolución dirigida al crear, renombrar, mover, borrar o recuperar ([[grafo-indice-y-motor]]) |
| `etiquetas` | Las etiquetas de cada nota (frontmatter + `#tags` del cuerpo) | Ídem |
| `papelera` | Qué nota se borró y dónde quedó su archivo | Los repos de la papelera; se respalda en `papelera.json` |

> [!important] Lo que el índice DERIVA lleva versión: `PRAGMA user_version` (`FUN-L-25`)
> Una tabla nueva que se llena leyendo los archivos necesita una pasada completa en los
> índices de antes, porque el reindexado incremental por `mtime` no vuelve a leer lo que
> no cambió. `VERSION_DERIVADO` en `indexer.ts` es ese número (hoy `1`: `enlaces` y
> `etiquetas`); si el índice tiene uno menor, `indexarVault` relee todo y lo escribe al
> terminar. **No sirve preguntar si la tabla existe**: es lo que se hizo con
> `propiedades` y dejó de andar sin que nadie lo notara, porque la apertura crea el
> esquema antes de indexar.

> [!info] Hasta el 2026-09-26 había una migración sqlx, `001_init.sql`
> Era de `mycelium.db`, la base del modo clásico, y sqlx validaba su checksum —por eso
> la identidad interna no se podía quitar del esquema ([[desktop-sin-login]])—. Se borró
> con `FUN-L-24` junto con el modo. Los índices de antes conservan las tablas viejas
> (`usuarios`, `vaults`, `membresias`, `css_snippets`) sin que nadie las lea, salvo la
> **migración única** de `lib/db/legado.ts`, que saca de ahí la apariencia y los snippets
> de quien actualiza desde la 2.1.0. Por eso no se hace `DROP TABLE`: ver
> [[auditoria-capa-de-datos]] § Cómo quedó.

## Futuro

`FUN-XL-01` en [[BACKLOG]] propone el modelo *local-first con guardado a la nube a
conciencia* (nunca automático), que sería una rearquitectura de esta capa.

## Relacionadas

- [[Capa de datos de la web]] — la contraparte, para entender la divergencia.
- [[vault-en-carpeta]] — la spec completa del modelo actual (7 fases).
- [[mycignore]] — qué entra al índice y qué no.
- [[auditoria-capa-de-datos]] — `FUN-L-24`: la simplificación que dejó esta capa así.
- [[grafo-indice-y-motor]] — `FUN-L-25`: las tablas `enlaces` y `etiquetas`.
- [[El modo SQLite clasico queda muerto]] — por qué ya no hay `mycelium.db`.
- [[Arquitectura de Mycelium]] — visión general.
