# Compilación y entorno de desarrollo

Trampas operativas al compilar, empaquetar y levantar Mycelium. Parte de
[[Aprendizajes tecnicos]].

## `cargo` se queda sin memoria en release

**Caso**: el primer `npx tauri build` para los instaladores v1.0.0 **falló**.

El error real estaba enterrado entre cientos de líneas de backtrace:

```
rustc-LLVM ERROR: out of memory
error: could not compile `sqlx-core` (lib)  ... (exit code: 0xc0000409, STATUS_STACK_BUFFER_OVERRUN)
error[E0786]: found invalid metadata files for crate `tauri_utils`
```

**Causa**: compilar en release con toda la paralelización (muchos crates + optimización
LLVM) agotó la memoria; rustc crasheó y dejó **metadata corrupta**, lo que encadenó
errores en otros crates (el `E0786` es consecuencia, no causa).

**Fix**: limitar la paralelización.

```sh
CARGO_BUILD_JOBS=2 npx tauri build     # funcionó: release en ~7m50s
```

Si vuelve a faltar memoria: `CARGO_BUILD_JOBS=1`, o cerrar aplicaciones pesadas.

> [!tip] Leer el log de abajo hacia arriba engaña
> El primer error **cronológico** es el que importa. Los `could not compile` finales y
> los `invalid metadata` son daño colateral.

## `| tee` oculta el código de salida

El mismo build "terminó con exit 0" cuando en realidad había fallado: el pipe hacía
que el exit code fuera el de `tee`, no el de `tauri build`.

```sh
npx tauri build 2>&1 | tee log.txt   # ✗ exit code de tee → falso éxito
npx tauri build                      # ✓ exit code real
```

> [!warning] No canalices comandos cuyo éxito necesitás evaluar
> (o usá `PIPESTATUS` / `set -o pipefail`).

## `cargo clean` falla si la app está corriendo

`cargo clean` (o borrar `target/`) da `Acceso denegado (os error 5)` sobre
`target/debug/deps/app.exe` si hay una instancia de `tauri dev` abierta: el ejecutable
está bloqueado. Cerrar la app primero.

Referencia de tamaños: `target/` llegó a **8.6 GB** (≈6.1 GB `debug` + 1.7 GB
`release`). Borrarlo libera mucho espacio, pero el siguiente build recompila todo
(varios minutos).

> [!important] Antes de borrar `target/`
> Los **instaladores** se generan dentro (`target/release/bundle/`). Copialos fuera
> antes (en este repo se preservan en `installers/v1.0.0/`). Ver
> [[Generar instaladores desktop]].

## `next dev` huérfano retiene el puerto 3000

Al matar `npm run tauri dev` de forma abrupta, el hijo `next dev` queda **huérfano**
ocupando `:3000`. El siguiente `tauri dev` falla con *"beforeDevCommand terminated with
non-zero"*.

```sh
netstat -ano | grep :3000    # obtener el PID
# luego terminar ese PID
```

## No modificar migraciones ya aplicadas (sqlx)

`tauri-plugin-sql` valida un **checksum** de cada migración. Editar
`src-tauri/migrations/001_init.sql` después de aplicada produce:

> migration 1 was previously applied but has been modified

Recuperación: resetear la base (`mycelium.db` en
`AppData/Roaming/com.mycelium.desktop`, con backup) y reimportar.

> [!warning] Regla
> Las migraciones aplicadas son **inmutables**. Todo cambio de esquema va en una
> migración nueva.

## Verificación antes de integrar

| Qué tocaste | Comando |
|---|---|
| Frontend (ambas versiones) | `cd frontend && npx tsc --noEmit -p tsconfig.json` |
| Rust / desktop | `cd frontend/src-tauri && cargo check` |
| Backend .NET (web) | `dotnet build` en `backend/` |
| Módulo Rust con tests | `cargo test --lib <modulo>` |

Detalle del flujo completo en [[Verificar antes de integrar]].

## Otros detalles

- **Consola Windows y UTF-8**: un `print` con `✔` reventó un script de Python por la
  codificación cp1252 de la consola. Evitar caracteres no ASCII en salida de scripts.
- **Rust disponible**: 1.96.1 al momento de estas notas; `edition = "2021"`.
- **`cargo check` completo tras borrar el cache**: ~4 min con `CARGO_BUILD_JOBS=2`.

## Relacionadas

- [[Aprendizajes tecnicos]] — mapa del área.
- [[Generar instaladores desktop]] — receta de empaquetado.
- [[Verificar antes de integrar]] — qué debe quedar verde.
- [[Levantar Mycelium en desarrollo]] — cómo correr cada versión.
- [[Tauri y el WebView]] — la otra mitad del mundo desktop.
