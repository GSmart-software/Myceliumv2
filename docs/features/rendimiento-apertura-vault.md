# Rendimiento de la apertura del vault (`FUN-M-12` · `VAULT-INDEX-PERF`)

Spec de la optimización del indexado al abrir un vault. El diagnóstico, con las
mediciones que la motivan, está en [[Rendimiento de la apertura del vault]].

> [!info] Alcance: **SOLO-DESKTOP**
> Todo lo que se toca —el indexador del vault en carpeta, `.mycignore`, los comandos
> Rust— **no existe en `web-cloud`**: ahí los datos viven en el backend .NET y no hay
> carpeta que recorrer. No hay nada que reflejar. Ver
> [[Diferencias funcionales aceptadas entre versiones]].

## Problema

Abrir un vault grande tarda. Medido sobre este repo usado como vault: 1830 archivos
indexados (1577 de ellos `node_modules`), 14 MB transferidos por IPC en **cada**
apertura, 4020 upserts de carpeta aunque no cambie nada, y ~11.340 statements SQL
sueltos en la apertura fría, cada uno con su transacción implícita y su fsync.

## Alcance de este trabajo

Entran los cinco cambios de mejor impacto sobre esfuerzo. **Quedan fuera a propósito**
(registrados como continuación en [[BACKLOG]]): fusionar los dos recorridos de disco en
un solo comando, mover el indexado entero a Rust, y el reindex dirigido por rutas del
watcher.

---

### 1. El default de `.mycignore` cubre las carpetas de build

`src-tauri/src/mycignore.rs`, constante `DEFAULT`: pasa de `".*/"` a incluir además
`node_modules/`, `target/`, `dist/` y `out/`.

- **Criterio**: un vault **sin** `.mycignore` que contenga `node_modules/` no indexa
  nada de ahí.
- **Escape**: la sintaxis no tiene negaciones, pero un `.mycignore` presente
  **reemplaza el default por completo** — quien tenga notas en una carpeta llamada
  `dist` escribe su propio archivo sin esa línea. Documentarlo en el comentario de la
  constante.
- `build/` y `vendor/` se dejan fuera: más probable que sean carpetas legítimas de notas.
- La plantilla `IGNORE_DEFAULT` de `components/settings/VaultSection.tsx` (línea ~140)
  dice ser "mismo comportamiento que sin archivo": **debe reflejar el default nuevo**.

> [!warning] Un vault que YA tiene `.mycignore` no se beneficia solo
> El archivo presente reemplaza al default. Los vaults existentes con `.mycignore`
> propio necesitan editarlo a mano. No se implementa migración automática: reescribir un
> archivo del usuario sin pedirlo va contra la política del proyecto.

### 2. Los metadatos viajan sin el contenido

Hoy `listar_archivos_meta` devuelve el `contenido` de todos los archivos y el indexador
recién después decide, por `mtime`, cuáles reindexar.

- `ArchivoMeta` (`src-tauri/src/archivos.rs`) **pierde el campo `contenido`**; conserva
  `rutaRelativa`, `mtime` y `tipo`.
- Comando nuevo `leer_archivos(origen: String, rutas: Vec<String>) -> Vec<ArchivoLeido>`:
  devuelve el contenido **solo** de las rutas pedidas. Debe resolver cada ruta con la
  función existente **`ruta_segura`** (defensa contra path traversal ya usada por
  `vault_fs`) y saltar en silencio lo que no sea UTF-8, igual que hoy.
- `leer_carpeta` (importación) **no se toca**: ahí el contenido sí hace falta.
- `lib/db/indexer.ts` pasa a dos fases: (a) pedir metas y calcular la lista de rutas a
  reindexar comparando `mtime`; (b) pedir el contenido **en tandas** (250 rutas por
  llamada) e ir escribiendo el índice tanda a tanda.
- **Criterio**: abrir un vault donde no cambió ningún archivo transfiere **0 bytes** de
  contenido.

### 3. Las carpetas se upsertan solo si son nuevas

`indexarVault` ya consulta `carpetasExistentes` para la limpieza; usar ese mismo conjunto
para saltar el upsert de las que ya están.

> [!note] Por qué saltarlas es seguro
> El `id` de una carpeta **es** su ruta POSIX, y `nombre` y `padre_id` se derivan de esa
> ruta. Si el id ya existe, sus otras columnas no pueden haber cambiado. No hace falta
> "refrescarlas".

- **Criterio**: reabrir un vault sin cambios ejecuta **0** statements sobre `carpetas`.

### 4. WAL en el índice

En `abrirIndiceDeVault` (`lib/db/client.ts`), tras abrir la base: `PRAGMA journal_mode=WAL`.

- Va con **`select`**, no con `execute`: el pragma devuelve una fila.
- Envolver en `try/catch`: si falla, el índice sigue funcionando (es best-effort).
- `PRAGMA synchronous=NORMAL` puede intentarse a continuación, pero **documentar en un
  comentario** que es por conexión y el plugin usa un pool de hasta 10, así que solo
  afecta a la que lo ejecutó. WAL, en cambio, se guarda en la cabecera del archivo y
  **sí** persiste.

> [!danger] No intentar `BEGIN`/`COMMIT` desde el frontend
> `tauri-plugin-sql` 2.4.0 mantiene un `Pool<Sqlite>` de sqlx: cada `execute()` toma una
> conexión cualquiera, así que el `BEGIN` puede acabar en una conexión y los `INSERT` en
> otra. La transacción real requiere mover el indexado a Rust — está fuera de alcance.

### 5. Progreso visible

`indexarVault` ya acepta `onProgress(hechas, total)` y **ningún llamador lo usa**.

- `stores/vaultSessionStore.ts`: guardar el progreso en el store (p. ej.
  `progreso: { hechas: number; total: number } | null`) y limpiarlo al terminar o fallar.
- `app/(vaults)/vaults/page.tsx`: mostrarlo donde hoy está el spinner de `abriendo`
  (texto tipo `Indexando 240/1830`). Sin rediseñar la pantalla.
- El progreso debe avanzar **por tanda** (ver punto 2), no quedarse en 0 hasta el final.

---

## Criterios de aceptación

1. Un vault sin `.mycignore` que contenga `node_modules/`, `target/`, `dist/` u `out/`
   no indexa nada de esas carpetas.
2. Reabrir un vault sin cambios en disco: 0 bytes de contenido por IPC y 0 statements
   sobre `carpetas`.
3. Editar **una** nota fuera de la app y reabrir: se reindexa **solo** esa nota.
4. El índice del vault queda en `journal_mode=WAL`.
5. Durante la apertura el usuario ve el avance, no un spinner mudo.
6. Nada de lo anterior cambia el contenido del índice: mismas notas, mismas carpetas,
   misma búsqueda FTS y mismo grafo que antes del cambio.

## Casos borde

- **Vault vacío** o sin carpetas: no debe fallar ninguna de las dos fases.
- **Archivo borrado entre la fase de metas y la de contenido**: `leer_archivos` lo
  omite; el indexador no debe romperse por recibir menos archivos de los que pidió.
- **Nota con `mtime` idéntico pero contenido distinto** (posible con herramientas que
  preservan fechas): sigue sin detectarse, igual que hoy. Es una limitación conocida del
  diseño incremental, no una regresión.
- **`.mycignore` editado desde Configuración**: `guardarIgnore` ya reindexa; debe seguir
  funcionando con el flujo de dos fases.

## Versionado

| Qué | De | A |
|---|---|---|
| App desktop (`APP_VERSION` + `package.json` + `Cargo.toml` + `tauri.conf.json`) | 1.1.0 | **1.1.1** |
| `FRAMEWORK_IA_VERSION` (`lib/ia/framework.ts`) | 1.2.0 | **1.2.1** |

**Patch, no minor.** La pregunta que decide es "¿el usuario puede hacer algo que antes
no podía?", y la respuesta es no: es la misma funcionalidad, más rápida. El cambio del
default de `.mycignore` no agrega una capacidad sino que **corrige un defecto** (indexar
1577 README de `node_modules`), y el progreso en la UI es la misma operación mejor
comunicada. El framework de IA sube igual —sus templates describían el default viejo—,
también en patch: corrige un texto, no suma instrucciones. Web permanece en **1.0.0**.

> [!warning] Que el trabajo sea grande no lo hace minor
> `FUN-M-12` toca Rust, el indexador, la UI y el framework, y aun así es patch. El
> tamaño del [[BACKLOG]] (`FUN-S/M/L/XL`) mide **esfuerzo**, no impacto de versión.
> Criterio y tabla en [[Versionado del sistema]].

> [!important] El framework de IA **debe** subir de versión
> Sus templates documentan el default de `.mycignore` en dos lugares —la regla 9 de
> `CLAUDE.md` ("por defecto, todo directorio que empieza con `.`") y la sección
> `.mycignore` de la skill `mycelium-vault`—. Si el default cambia y el texto no, el
> framework miente. La regla está en [[Versionado del sistema]] y el procedimiento en
> [[Generar el framework de IA en un vault]].

## Documentación a actualizar

- [[BACKLOG]] — alta de `FUN-M-12` · `VAULT-INDEX-PERF` (desktop, implementado) y las
  tres continuaciones que quedan fuera de alcance.
- [[Rendimiento de la apertura del vault]] — marcar qué propuestas quedaron hechas.
- [[Versionado del sistema]] y [[Estado del proyecto]] — versiones nuevas.
- [[Version 1.1.1]] — nota de release, con la estructura de [[Version 1.1.0]].
- [[mycignore]] — el default nuevo.

## Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json`
- `cd frontend/src-tauri && cargo check`
- `cargo test --lib mycignore` y `cargo test --lib archivos`
- Tests Rust nuevos: que el default ignore `node_modules/`, y que `leer_archivos`
  devuelva el contenido pedido **y rechace** una ruta con `..`.

Ver [[Verificar antes de integrar]].

## Relacionadas

- [[Rendimiento de la apertura del vault]] — el diagnóstico y las mediciones.
- [[mycignore]] — la funcionalidad que decide qué se indexa.
- [[vault-en-carpeta]] — la arquitectura del índice derivado.
- [[Capa de datos del desktop]] — dónde encaja el indexador.
- [[Mapa de documentacion]] — índice general.
