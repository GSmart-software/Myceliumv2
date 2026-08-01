# Rendimiento de la apertura del vault

Análisis de por qué abrir un vault grande tarda, medido sobre **este mismo repositorio**
usado como vault (el peor caso real: documentación + código). Parte de
[[Aprendizajes tecnicos]]; el camino que se analiza es `abrir()` en
`stores/vaultSessionStore.ts` → `indexarVault()` en `lib/db/indexer.ts` →
`listar_archivos_meta` / `listar_directorios` en `src-tauri/src/archivos.rs`.

> [!info] Contexto
> El usuario reporta que "abrir un vault con mucho contenido tarda bastante". La causa
> no es una sola: hay **un problema de configuración** que multiplica el trabajo por 40,
> y encima **tres problemas estructurales** en el indexador que hacen que ese trabajo
> cueste más de lo que debería.

> [!success] Estado: las propuestas 0, 1, 2, 3 y 6 están implementadas
> Salieron en [[Version 1.1.1]] como `FUN-M-12` · `VAULT-INDEX-PERF` (spec:
> `docs/features/rendimiento-apertura-vault.md`). Las mediciones de abajo son las
> **previas** al arreglo y se conservan como referencia; **no** se volvieron a medir.
> Quedan pendientes la 4 (parcialmente: se hicieron sus micro-optimizaciones, no la
> fusión de comandos → `FUN-M-13`), la 5 (`FUN-L-10`) y el reindex dirigido del watcher
> (`FUN-M-14`). Ver [[BACKLOG]].

## Las mediciones (2026-08-01, este repo como vault)

| Métrica | Valor |
|---|---|
| Archivos que indexa | **1830** `.md`/`.excalidraw` |
| — de los cuales `frontend/node_modules` | **1577** (86%) |
| — `backend/` (resto de la línea web en disco) | 206 |
| — **documentación real** (`docs/` + raíz) | **≈50** |
| Contenido leído y transferido por IPC | **14 MB** (`docs/` solo: 424 KB) |
| Directorios recorridos | **4020**, y se recorren **dos veces** |
| Índice SQLite resultante | **32,7 MB** (`index-a6180df….db`) |
| Statements SQL en apertura fría | **≈11.340**, uno por round-trip IPC |
| Statements SQL en apertura **en caliente** (nada cambió) | **≈4020** |

## El problema de configuración: `.mycignore` no cubre lo que importa

El default cuando un vault no tiene `.mycignore` es `.*/` — solo directorios ocultos
(`src-tauri/src/mycignore.rs`, constante `DEFAULT`). Eso deja entrar `node_modules/`,
`target/`, `out/`, `dist/`, `.next/`… El `.mycignore` de este vault añade `.git/` y
`.github/`, pero **no** `node_modules/`, así que el 86% de lo que se indexa son README
de dependencias.

> [!important] Es el arreglo de mayor impacto y el más barato
> Añadir `node_modules/`, `target/`, `out/`, `dist/`, `installers/` al `.mycignore`
> lleva 1830 archivos → ~50, 14 MB → 424 KB y 4020 directorios → ~30. **Factor ~40, sin
> tocar una línea de código.** Y el *default* debería incluirlos: cualquiera que abra un
> repo como vault —el caso de uso central de [[Mycelium como memoria de la IA]]— choca
> con lo mismo. Ver [[mycignore]].

## Los tres problemas estructurales del indexador

### 1. Se transfiere todo el contenido aunque no haga falta

`listar_archivos_meta` devuelve `{rutaRelativa, contenido, mtime, tipo}` de **todos** los
archivos, y el indexador recién entonces decide, comparando `mtime`, cuáles reindexar:

```ts
const previo = mtimePorId.get(id);
if (previo !== undefined && previo === a.mtime) { … continue; }  // ya se leyó el contenido
```

O sea: en una apertura donde **no cambió nada**, se leen del disco y se serializan a JSON
por el puente IPC los 14 MB completos… para descartarlos. El `mtime` pesa 8 bytes; el
contenido, todo lo demás.

**Arreglo**: que el comando devuelva solo `(ruta, mtime, tipo)` y un comando nuevo
—`leer_archivos(rutas[])`— traiga el contenido **solo de lo que se va a reindexar**.
Apertura en caliente: de 14 MB a prácticamente cero.

### 2. Las carpetas se reescriben siempre, aunque no cambien

Las notas son incrementales por `mtime`; **las carpetas no**. El paso 1 de
`indexarVault` recorre todas las carpetas derivadas y ejecuta un upsert por cada una,
en cada apertura:

```ts
for (const c of carpetasOrdenadas) {
  await execute(`INSERT INTO carpetas … ON CONFLICT(id) DO UPDATE SET …`, […]);
}
```

Con 4020 directorios son **4020 statements en toda apertura**, incluso si el vault no se
tocó desde la anterior. Es el costo dominante de una reapertura en caliente.

**Arreglo**: comparar el conjunto de carpetas en disco contra `carpetasExistentes` (que
ya se consulta unas líneas más abajo, para la limpieza) y upsertar solo las nuevas.

### 3. Cada statement es un round-trip con su propia transacción

`execute()` (`lib/db/client.ts`) llama al plugin una vez por statement. En una apertura
fría se hacen ~4020 upserts de carpeta + 4 statements por nota (`notas`, `contenidos`,
`DELETE` FTS, `INSERT` FTS) × 1830 = **≈11.340 llamadas**, cada una un cruce del puente
IPC y —al no haber transacción explícita— **su propia transacción implícita de SQLite**.

Y no hay ningún `PRAGMA` configurado en el proyecto: el índice queda con
`journal_mode=delete` y `synchronous=FULL`, es decir **un fsync por statement**. Sobre
un caché reconstruible por definición, eso es durabilidad que no se necesita pagar.

> [!warning] La solución obvia —`BEGIN`/`COMMIT` desde JS— NO es fiable acá
> `tauri-plugin-sql` 2.4.0 guarda un `Pool<Sqlite>` de sqlx (`src/wrapper.rs`, vía
> `Pool::connect`, que por defecto abre **hasta 10 conexiones**). Cada `execute()` toma
> *una conexión cualquiera* del pool, así que un `BEGIN` puede acabar en una conexión y
> los `INSERT` en otra. Envolver el reindex en una transacción desde el frontend no está
> garantizado.
>
> Lo que **sí** funciona desde JS: `PRAGMA journal_mode=WAL`, porque WAL se guarda en la
> cabecera del archivo y persiste entre conexiones. `synchronous` es por conexión, así
> que desde JS solo afectaría a la conexión que lo ejecutó.

## Propuestas, por impacto sobre esfuerzo

| # | Cambio | Impacto | Esfuerzo | Estado |
|---|---|---|---|---|
| 0 | **`.mycignore`**: sumar `node_modules/`, `target/`, `out/`, `dist/` — en este vault y en el **default** de `mycignore.rs` | ~40× en vaults sobre repos | Trivial | ✅ 1.1.1 |
| 1 | **Separar metadatos de contenido**: `listar_archivos_meta` sin `contenido` + `leer_archivos(rutas)` | 14 MB → ~0 por IPC en caliente | Bajo | ✅ 1.1.1 |
| 2 | **Carpetas incrementales**: upsert solo de las nuevas | 4020 → 0 statements en caliente | Bajo | ✅ 1.1.1 |
| 3 | **`PRAGMA journal_mode=WAL`** al abrir el índice | Menos fsync en frío | Trivial | ✅ 1.1.1 |
| 4 | **Un solo recorrido**: fusionar `listar_archivos_meta` + `listar_directorios` en un comando que devuelva `{archivos, directorios}`; usar `entrada.file_type()` en vez de `ruta.is_dir()` (evita un `stat` extra por entrada en Windows) y calcular `rel_posix` una sola vez por entrada en vez de dos | Mitad de trabajo de disco | Medio | ⚠️ parcial: las micro-optimizaciones sí, la fusión no → `FUN-M-13` |
| 5 | **Indexar en Rust**: que el walker lea y escriba el índice en el mismo proceso, en **una** transacción, sin pasar contenido por IPC | Resuelve 1, 3 y 4 de raíz | Alto | ⬜ `FUN-L-10` |
| 6 | **Conectar `onProgress`**: el parámetro existe en `indexarVault` y **ningún llamador lo usa**; hoy el usuario ve un spinner sin información | Percepción, no velocidad | Trivial | ✅ 1.1.1 |

El orden natural es 0 → 1 → 2 → 3 (barato y resuelve el caso reportado) y dejar 4/5 para
cuando haya un vault genuinamente grande de *notas*, no de ruido. Fue exactamente lo que
se hizo en `FUN-M-12`.

> [!warning] El default nuevo no rescata a los vaults que YA tienen `.mycignore`
> Un `.mycignore` presente **reemplaza al default por completo** (la sintaxis no tiene
> negaciones). Este mismo vault es el caso: su archivo lista `.git/` y `.github/`, así
> que sigue indexando `node_modules` hasta que se le agreguen las líneas a mano. No se
> implementó migración automática: reescribir un archivo del usuario sin pedirlo va
> contra la política del proyecto. Ver [[mycignore]].

## Un problema hermano: el watcher reindexa todo ante cualquier cambio

El watcher nativo emite `vault-cambios` **con las rutas afectadas**, pero
`lib/vaultWatch.ts` las ignora y llama a `indexarVault(ruta)` entero. En un vault que
además es un repo de código, un `npm install` o un `cargo build` desde la
[[terminal-integrada]] dispara ráfagas de eventos y **cada una** paga los dos recorridos
+ los 14 MB + los 4020 upserts. Es probable que buena parte de la lentitud percibida
*después* de abrir venga de acá. Un reindex dirigido por las rutas del evento es la
mejora natural, y el arreglo 0 ya lo alivia mucho. Registrado como `FUN-M-14` en
[[BACKLOG]]: sigue pendiente después de 1.1.1.

## Nota al margen: los índices se acumulan

En `AppData/Roaming/com.mycelium.desktop/` hay un `index-<hash>.db` por vault abierto
alguna vez (hoy cinco, 58 MB en total) y nada los limpia. No afecta a la velocidad de
apertura, pero conviene tenerlo en el radar. Ver [[Capa de datos del desktop]].

## Relacionadas

- [[Version 1.1.1]] — el release que implementó las propuestas 0, 1, 2, 3 y 6.
- [[BACKLOG]] — `FUN-M-12` (hecho) y sus continuaciones `FUN-M-13`, `FUN-M-14`, `FUN-L-10`.
- [[Capa de datos del desktop]] — la carpeta como verdad y el índice como caché derivado.
- [[vault-en-carpeta]] — la spec donde se decidió esta arquitectura.
- [[mycignore]] — qué ignora el indexador y cómo se configura.
- [[Rendimiento del grafo]] — el otro análisis de rendimiento, del lado del dibujo.
- [[Tauri y el WebView]] — el puente IPC y sus costos.
- [[Aprendizajes tecnicos]] — mapa del área.
