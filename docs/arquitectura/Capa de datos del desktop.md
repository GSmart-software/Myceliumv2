# Capa de datos del desktop

Cómo persiste Mycelium en la versión de escritorio (`desktop-tauri`). Parte de
[[Arquitectura de Mycelium]].

## Modelo: la carpeta es la verdad, SQLite es el índice

Desde el [[vault-en-carpeta]], el vault es una **carpeta real** del sistema:

- Los `.md` y `.excalidraw` **en disco** son la fuente de verdad.
- `<vault>/.mycelium/` guarda el **índice SQLite derivado** (búsqueda, grafo, metadatos)
  y la **papelera** (`.mycelium/.trash/`).
- El índice se puede **reconstruir** desde los archivos: es caché, no origen.

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
| Repos de datos (árbol, notas, papelera, contenido + FTS, preferencias) | `frontend/lib/db/*` (TS, sobre `tauri-plugin-sql`) |
| Dispatcher que emula la API HTTP | `frontend/lib/api.ts` |
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

## Migraciones

El esquema vive en `src-tauri/migrations/001_init.sql`, aplicado por
`tauri-plugin-sql`.

> [!danger] No modificar una migración ya aplicada
> sqlx valida su checksum: editarla rompe la app con *"migration 1 was previously
> applied but has been modified"*. Todo cambio de esquema va en una migración **nueva**.
> Ver [[Compilacion y entorno de desarrollo]].

## Futuro

`FUN-XL-01` en [[BACKLOG]] propone el modelo *local-first con guardado a la nube a
conciencia* (nunca automático), que sería una rearquitectura de esta capa.

## Relacionadas

- [[Capa de datos de la web]] — la contraparte, para entender la divergencia.
- [[vault-en-carpeta]] — la spec completa del modelo actual (7 fases).
- [[mycignore]] — qué entra al índice y qué no.
- [[Arquitectura de Mycelium]] — visión general.
