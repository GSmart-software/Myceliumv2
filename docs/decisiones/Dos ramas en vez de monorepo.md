# Dos ramas en vez de monorepo

**Decisión** · 2026-07-15 · vigente

Mycelium se mantiene en **dos ramas** (`web-cloud` y `desktop-tauri`) con el flujo de
orquestador + subagentes. El plan de **monorepo** (`packages/shared` + `apps/web` +
`apps/desktop`) queda **cancelado**.

> [!info] Estado
> El refactor a monorepo llegó a estar **aprobado y planificado** (Fase 1 sin arrancar).
> El usuario lo canceló tras evaluarlo. **No retomarlo** sin uno de los gatillos de
> abajo.

## Por qué se canceló

1. **El flujo de ramas ya estaba probado**: se había validado con una funcionalidad real
   implementada en las dos versiones, obteniendo diffs equivalentes.
2. **El argumento original era un bug, no la arquitectura**: la motivación fue el
   problema de checksum de sqlx (una migración modificada tras aplicarse), que se
   resolvió reseteando la base — nada que un monorepo hubiera evitado. Ver
   [[Compilacion y entorno de desarrollo]].
3. **Costo/riesgo alto sin dolor real que lo amortice**: mover todo el código a
   paquetes compartidos era caro y riesgoso para el beneficio observado.

## Cuándo reconsiderarlo

Solo si aparece alguno de estos síntomas:

- Las dos implementaciones **divergen sin querer** (se pretendía paridad y no la hay).
- Los **archivos divergentes se multiplican** más allá de lo manejable — la lista vive
  en [[RAMAS]].
- Se necesita **correr las dos versiones lado a lado constantemente**. Para esto, la
  solución barata es un **worktree permanente** de `web-cloud`, no un refactor.

## Consecuencias

- Rige la regla de [[Implementacion independiente por rama]]: nada de merge ni
  cherry-pick entre las principales.
- Llevar una funcionalidad de una versión a la otra es un proceso manual y verificado:
  [[Reflejar cambios de desktop a web]].
- Se acepta que las versiones **no sean idénticas**:
  [[Diferencias funcionales aceptadas entre versiones]].

## Relacionadas

- [[RAMAS]] — el estado operativo de las ramas y los archivos divergentes.
- [[Arquitectura de Mycelium]] — la forma que resultó de esta decisión.
- [[Mapa de documentacion]] — índice general.
