# Versión 1.1.1

**Solo desktop** (`desktop-tauri`) · 2026-08-01 · patch sobre [[Version 1.1.0]]

Un solo tema: **abrir un vault grande tarda menos**. Web sigue en `1.0.0` — nada de esto
existe ahí (no hay carpeta que recorrer ni índice derivado). Ver
[[Diferencias funcionales aceptadas entre versiones]].

## Por qué patch y no minor

Porque **nadie puede hacer nada que no pudiera antes**. Es la misma funcionalidad, más
rápida y mejor comunicada:

- el default nuevo de `.mycignore` no agrega una capacidad, **corrige un defecto**
  (indexar 1577 README de `node_modules` en un vault donde hay ~50 notas);
- el progreso en la UI es la misma operación, contada;
- el resto es puro rendimiento, sin cambio de comportamiento observable.

> [!warning] Que el trabajo sea grande no lo hace minor
> `FUN-M-12` tocó Rust, el indexador, la capa de datos, la UI y el framework de IA. El
> tamaño del [[BACKLOG]] (`FUN-S/M/L/XL`) mide **esfuerzo**, no impacto de versión. Este
> release es el caso testigo de esa distinción, y por él se agregó la fila
> "optimización sin funcionalidad nueva → patch" a [[Versionado del sistema]].

## Qué entra

### `FUN-M-12` · `VAULT-INDEX-PERF`

Los cinco cambios de la spec (`docs/features/rendimiento-apertura-vault.md`), motivados
por el diagnóstico de [[Rendimiento de la apertura del vault]]:

1. **El default de `.mycignore` cubre las carpetas de build.** Pasa de `.*/` a incluir
   `node_modules/`, `target/`, `dist/` y `out/`. Es el arreglo de mayor impacto y el más
   barato: abrir un repo como vault —el caso de uso central de
   [[Mycelium como memoria de la IA]]— dejaba entrar miles de README de dependencias.
   `build/` y `vendor/` quedan fuera a propósito (probablemente sean notas de verdad).
   Ver [[mycignore]].
2. **Los metadatos viajan sin el contenido.** `listar_archivos_meta` devuelve solo
   `(ruta, mtime, tipo)`; el comando nuevo `leer_archivos(origen, rutas)` trae el texto
   **solo** de lo que hay que reindexar, en tandas de 250. Antes se serializaban 14 MB
   por IPC en cada apertura para descartarlos casi enteros.
3. **Las carpetas se upsertan solo si son nuevas.** El `id` de una carpeta *es* su ruta
   POSIX y `nombre`/`padre_id` se derivan de ella: si el id ya existe, no puede haber
   cambiado. Eran 4020 statements en toda apertura, cambiara algo o no.
4. **WAL en el índice.** `PRAGMA journal_mode=WAL` al abrir, best-effort. El índice es
   un caché reconstruible: no hace falta pagar un fsync por statement.
5. **Progreso visible.** `indexarVault` ya aceptaba `onProgress` y **ningún llamador lo
   usaba**. Ahora el selector de vaults muestra `Indexando 240/1830` en vez de un
   spinner mudo.

Además, micro-optimizaciones de los walkers Rust: `entrada.file_type()` en vez de
`ruta.is_dir()` (ahorra un `stat` por entrada, notorio en Windows) y `rel_posix`
calculado una sola vez por entrada.

> [!warning] Un vault que YA tiene `.mycignore` no se beneficia solo
> El archivo presente **reemplaza al default por completo** (la sintaxis no tiene
> negaciones). Los vaults con `.mycignore` propio —incluido el de este repo— necesitan
> que se les agreguen las líneas a mano. No se implementó migración automática:
> reescribir un archivo del usuario sin pedirlo va contra la política del proyecto.

### Framework de IA a `v1.2.1`

También patch: no gana instrucciones, **corrige** las que quedaron desactualizadas. Sus
templates describían el default viejo de `.mycignore` en dos lugares (la regla 9 del
`CLAUDE.md` generado y la sección `.mycignore` de la skill `mycelium-vault`). Si el
texto no acompaña al cambio, el framework miente. Ver
[[Generar el framework de IA en un vault]].

## Qué NO entra (a propósito)

Las tres continuaciones registradas en [[BACKLOG]]:

- `FUN-M-13` — fusionar los dos recorridos de disco en un solo comando.
- `FUN-M-14` — reindex dirigido por las rutas que ya emite el watcher (hoy reindexa el
  vault entero ante cualquier cambio; probablemente la mayor mejora que queda).
- `FUN-L-10` — mover el indexado entero a Rust, en una sola transacción.

> [!note] Por qué no se envolvió el indexado en una transacción
> `tauri-plugin-sql` 2.4.0 mantiene un `Pool<Sqlite>` de sqlx de hasta 10 conexiones:
> cada `execute()` toma una cualquiera, así que un `BEGIN` desde el frontend puede
> acabar en una conexión y los `INSERT` en otra. La transacción real requiere el
> indexado en Rust (`FUN-L-10`).

## Verificación

`npx tsc --noEmit`, `cargo check` y `cargo test --lib` (mycignore + archivos) en verde,
con dos tests Rust nuevos: que el default ignore `node_modules/` y que `leer_archivos`
devuelva lo pedido **y rechace** rutas con `..`. Ver [[Verificar antes de integrar]].

> [!important] Sin medición posterior
> Las cifras de [[Rendimiento de la apertura del vault]] son **previas** al arreglo. No
> se volvió a medir: la mejora real la confirma el usuario abriendo la app.

## Instaladores

**Todavía no generados.** Cuando se generen van a `installers/v1.1.1/`; procedimiento en
[[Generar instaladores desktop]].

## Relacionadas

- [[Version 1.1.0]] — el release anterior.
- [[Rendimiento de la apertura del vault]] — el diagnóstico que lo motivó.
- [[mycignore]] — la funcionalidad cuyo default cambió.
- [[Versionado del sistema]] — el criterio patch/minor que este release aclaró.
- [[Estado del proyecto]] — situación actual.
- [[BACKLOG]] — qué sigue.
