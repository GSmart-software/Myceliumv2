# Verificar antes de integrar

Nada se integra ni se considera terminado sin que la verificación quede **verde**. Es
una convención firme del proyecto (ver [[CLAUDE]] en la raíz) y la usan tanto el
orquestador como los subagentes.

## Qué correr según lo que toques

| Tocaste | Comando | Dónde |
|---|---|---|
| Frontend (cualquier versión) | `npx tsc --noEmit -p tsconfig.json` | `frontend/` |
| Rust / desktop | `cargo check` (solo la app) · `cargo check --workspace` (todo) | `frontend/src-tauri/` |
| Módulo Rust con tests | `cargo test --lib <modulo>` (app) | `frontend/src-tauri/` |
| Servidor MCP (`crates/`) | `cargo test -p mycelium-vault -p mycelium-mcp` | `frontend/src-tauri/` |
| Backend .NET (solo web) | `dotnet build` | `backend/` |
| Reflejo a web | `npm ci` + `tsc` + `npx next build` | worktree de `web-cloud` |
| Módulo con tests headless | `node --test scripts/test-<modulo>.mjs` | `frontend/` |
| Smoke tests (si aplica) | `node scripts/smoke-*.mjs` | `frontend/` |
| Páginas de la ayuda (`frontend/ayuda/`) | `npm run generar-ayuda` + `node --test scripts/test-ayuda.mjs` | `frontend/` |

> [!important] Una funcionalidad nueva no se da por terminada sin su página de ayuda
> Regla de [[ayuda-integrada]] (`FUN-L-27`, 2026-10-06). Si el usuario puede hacer algo
> que antes no podía, la ayuda integrada (F1) tiene que contarlo: una página nueva o un
> párrafo en la que corresponde, con un ejemplo ```` ```ejemplo ```` si es sintaxis. Si
> cambia una sintaxis o un atajo, se corrige la página en el mismo cambio. Un tipo de
> archivo nuevo en `lib/extensionesDeTipo` hace fallar `scripts/test-ayuda.mjs` hasta
> que una página lo declare en `cubre:`. Cómo se escribe una página: [[ayuda-integrada]]
> § «Implementación de la parte A».

> [!info] `src-tauri/` es un workspace desde `FUN-L-09`
> La app es el paquete raíz; en `crates/` viven `mycelium-mcp` (el servidor del
> [[mcp-control]]) y `mycelium-vault` (lo que el servidor necesita de los vaults: el
> registro `vaults.json` y la comparación y el hash de rutas). En la raíz,
> `cargo check`/`cargo test` tocan **solo la app**, que **no** depende de esos crates;
> para ellos, `-p` o `--workspace`. La extracción de 2026-09-24 —`.mycignore`, walker y
> parsers compartidos con la app, y la prueba de equivalencia TS↔Rust— era del MCP de
> memoria y no entró ([[MCP de Mycelium - memoria]] § 13 queda como registro).

> [!tip] `next build` solo en el reflejo a web
> En desktop alcanza `tsc` + `cargo check` para el ciclo normal; `next build` se corre
> cuando se refleja a web (ahí es la garantía de que el bundle compila) y antes de
> empaquetar. Ver [[Reflejar cambios de desktop a web]].

## Trampas al interpretar el resultado

- **No canalices el comando** cuyo éxito querés evaluar: `| tee` devuelve **su**
  código de salida y puede reportar éxito sobre un build fallido.
- **Filtrar la salida con `grep` cambia el exit code.** `tsc ... | grep -v "npm notice"`
  devolvió 1 con el proyecto en verde. Corré el comando limpio y mirá `$?`.
- **El primer error cronológico es el que importa**: en Rust, los `could not compile`
  del final suelen ser daño colateral (metadata corrupta) de un crash anterior.

Detalle de estos casos en [[Compilacion y entorno de desarrollo]].

## Después de verificar

1. **Commit** siguiendo [[Convenciones de commits]].
2. **Confirmación del usuario en la app** cuando el cambio es visible: el flujo
   acordado es *arreglar en desktop → el usuario confirma en la app → reflejar a web*.
   Verificación en verde ≠ funciona; varios bugs pasaron `tsc` y seguían rotos (ver
   [[Aprendizajes tecnicos]]).
3. **Registrar** en [[bugs-progreso]] o en la spec correspondiente.

> [!warning] `tsc` verde no prueba comportamiento
> Los tres intentos fallidos del arrastre al área de trabajo compilaban perfecto. La
> prueba real es el usuario ejecutando la app.

## Relacionadas

- [[Reflejar cambios de desktop a web]] — verificación reforzada del reflejo.
- [[Compilacion y entorno de desarrollo]] — errores de compilación y sus causas.
- [[Levantar Mycelium en desarrollo]] — cómo correr la app para la confirmación manual.
- [[Convenciones de commits]] — cómo se registra el cambio.
- [[Mapa de documentacion]] — índice general.
