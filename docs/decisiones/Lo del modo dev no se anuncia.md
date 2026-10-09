# Lo del modo dev no se anuncia

**Decisión** · vigente · 2026-10-08 · `FUN-S-36` · solo desktop

El **modo desarrollador** ([[modo-dev]]) es oculto: se enciende con el comando `>dev` de la
paleta, que no aparece en ninguna lista. El usuario fijó el 2026-10-08 que el secreto
alcanza **a todo lo que pertenece al modo**, no solo a su nombre: nada de eso sale en el
**changelog** de una versión ni en la **ayuda integrada**.

> [!info] Palabras del usuario
> *«Es importante saber que esta función dev al ser oculta no puede aparecer en el changelog
> de nuevos cambios cuando se publique la nueva versión. Y todo lo que pertenezca a
> funcionalidad de dev no puede aparecer en el changelog.»*

## Por qué

Anunciar una opción de desarrollador revela que existe un modo que la muestra, y deja al
usuario buscando algo que no encuentra. Un changelog que diga «ahora podés volver a una
versión anterior desde Versiones publicadas» desarma el modo igual que uno que diga `>dev`.

## Qué cubre

- El modo en sí, con sus nombres de ahora y de antes (el **modo avanzado** de `FUN-M-16`, que
  reemplazó), el comando `>dev` y el indicador «· dev» del pie de Configuración.
- Lo que habilita: los **comandos de desarrollador** de la paleta y las opciones ocultas del
  actualizador, «Versiones publicadas» y «Servidor de actualizaciones».
- Los IDs `FUN-S-36` y `FUN-M-16`.
- **Toda funcionalidad futura** que quede detrás del modo.

**No cubre F12 / Ctrl+Shift+I**: las herramientas de desarrollador son de todos (decisión
del mismo día al definir `FUN-S-36`) y la ayuda las documenta para escribir CSS propio.

## Cómo se hace cumplir

| Dónde | Qué hace |
|---|---|
| `frontend/scripts/secreto-dev.mjs` | **La lista única** de patrones (`SECRETO_DEV`) con lo que no se puede nombrar |
| `npm run publicar` (`scripts/publicar.mjs`) | Rechaza el changelog que toque la lista, **antes de compilar**, y dice qué quitar |
| `scripts/test-modo-dev.mjs` | Falla si una página de `frontend/ayuda/` toca la lista; prueba además qué frases atrapa y cuáles deja pasar |
| `npm run versionar` (`scripts/versionar.mjs`) | El esqueleto de la nota de release lo recuerda dentro del hueco del changelog |

La nota de release (`docs/estado/Version X.Y.Z.md`) **sí** puede documentar lo del modo dev,
pero **fuera** de los delimitadores `notas-release`: esa parte es interna y no se publica
([[Publicar una version]]).

> [!important] Al agregar algo detrás del modo dev
> Sumá su ID y los nombres con que se ve en la app a `secreto-dev.mjs` (si un patrón no lo
> cubre ya) y corré `node --test scripts/test-modo-dev.mjs`. Sin eso, el control no lo conoce
> y se cuela en el próximo changelog. Un control automático **no reemplaza** releer el
> changelog: una frase como «mejoras para desarrolladores» tampoco va, aunque no la atrape.

## Relacionadas

- [[modo-dev]] — la spec del modo y cómo agregar un comando de desarrollador.
- [[Publicar una version]] — dónde se escribe el changelog y cuándo se comprueba.
- [[autoactualizacion]] — las opciones del actualizador que quedan detrás.
- [[BACKLOG]] — `FUN-S-36`.
- [[Mapa de documentacion]] — índice general.
