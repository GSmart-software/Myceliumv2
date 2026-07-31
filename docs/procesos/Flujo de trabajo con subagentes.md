# Flujo de trabajo con subagentes

Convención del proyecto para trabajo no trivial: quien atiende el pedido actúa como
**orquestador** (decide, especifica y delega) y el trabajo grande lo hacen
**subagentes**, cada uno en **una sola rama** dentro de su propio **git worktree**.

> [!info] La fuente normativa es [[CLAUDE]] (raíz del repo)
> Esta nota resume el flujo y lo conecta con el resto de la memoria; el contrato exacto
> del subagente vive en `CLAUDE.md`.

## Los cinco pasos

1. **Clasificar el alcance**: `AMBAS (igual)` · `AMBAS (difiere)` · `SOLO-WEB` ·
   `SOLO-DESKTOP` · `IMPOSIBLE en una` (decirlo explícitamente y por qué). Por defecto,
   **si se puede hacer en las dos, se hace en las dos** — ver
   [[Diferencias funcionales aceptadas entre versiones]].
2. **Especificar**: una **spec de comportamiento compartida** (qué hace, UI, criterios
   de aceptación, casos borde) y, si difiere, notas de implementación por versión. Si
   no es trivial, se guarda en `docs/features/<slug>.md`.
3. **Crear ramas de feature**: `feat/<slug>-web` (desde `web-cloud`) y
   `feat/<slug>-desktop` (desde `desktop-tauri`). Trabajar en ramas de feature evita el
   conflicto de "rama ya usada por otro worktree".
4. **Delegar**: un subagente por rama, con `isolation: "worktree"`, pasándole la spec +
   sus notas + el contrato.
5. **Integrar**: el orquestador revisa y hace `merge --no-ff` de cada rama de feature a
   **su** principal. Borra las ramas de feature. **Nunca** fusiona una principal con la
   otra.

> [!important] Confirmar el plan antes de lanzar subagentes
> El flujo está pre-autorizado como convención, pero el **plan** se acuerda con el
> usuario primero.

## Cuándo NO orquestar

- Cambios triviales de **una sola** versión (un typo, un ajuste de CSS): hacerlo
  directo en la rama.
- Exploración, lectura o preguntas: responderlas directamente.

En la práctica, buena parte de la fase de bugs (`DEF-*`) se hizo **directo**: eran
cambios chicos, iterativos y con confirmación del usuario en cada paso, donde el
ida y vuelta rápido valía más que delegar.

## Qué debe devolver un subagente

Qué cambió, archivos tocados, **resultado de la verificación** y dudas. El contrato le
exige: trabajar solo en su rama, seguir la spec, igualar el estilo del repo (nombres y
comentarios en español), leer `frontend/AGENTS.md` antes de escribir código de Next,
verificar ([[Verificar antes de integrar]]), commitear según
[[Convenciones de commits]] y no tocar el remoto.

## Relacionadas

- [[Implementacion independiente por rama]] — la regla que hace necesario un agente por rama.
- [[Reflejar cambios de desktop a web]] — alternativa usada cuando el cambio ya está hecho y confirmado en desktop.
- [[Verificar antes de integrar]] · [[Convenciones de commits]] — obligaciones del contrato.
- [[Mapa de documentacion]] — índice general.
