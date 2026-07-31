# Verificar antes de integrar

Nada se integra ni se considera terminado sin que la verificación quede **verde**. Es
una convención firme del proyecto (ver [[CLAUDE]] en la raíz) y la usan tanto el
orquestador como los subagentes.

## Qué correr según lo que toques

| Tocaste | Comando | Dónde |
|---|---|---|
| Frontend (cualquier versión) | `npx tsc --noEmit -p tsconfig.json` | `frontend/` |
| Rust / desktop | `cargo check` | `frontend/src-tauri/` |
| Módulo Rust con tests | `cargo test --lib <modulo>` | `frontend/src-tauri/` |
| Backend .NET (solo web) | `dotnet build` | `backend/` |
| Reflejo a web | `npm ci` + `tsc` + `npx next build` | worktree de `web-cloud` |
| Smoke tests (si aplica) | `node scripts/smoke-*.mjs` | `frontend/` |

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
