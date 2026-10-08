# Notas con el mismo título (`DEF-134`)

Dos notas de carpetas distintas pueden llamarse igual, como en Obsidian. Lo que no puede
pasar es que una operación de Mycelium cambie **en silencio** a dónde lleva un `[[enlace]]`
que ya existía. Spec del arreglo de `DEF-134`, detectado en la [[Auditoria e2e 2026-10-07]]
(`H38`); estado en [[bugs-progreso]].

Implementado en desktop el 2026-10-07, sin confirmar en la app. Web pendiente.

> [!important] Decisión del usuario (2026-10-07)
> «Como en Obsidian, lo permite, pero todas las referencias a estas notas deben pasar a tener
> la dirección completa para enrutar al documento que corresponde. Además, debe mostrar una
> notificación de que coincide con otra nota.»

## El defecto

`[[Tomate]]` sin ruta resuelve a la homónima **más cercana a la raíz** (`lib/wikilinks.ts`,
regla 5). Renombrar `Riego de verano.md` (raíz) a «Tomate» con `Cultivos/Tomate.md` ya
enlazada desde 17 notas dejaba esos 17 enlaces llevando a la nota de riego. Y un segundo
renombre de la de riego **los reescribía** con el nombre nuevo, porque el índice decía que
apuntaban a ella. El vault quedaba con los enlaces cambiados y nada lo señalaba.

## Comportamiento

1. Se **permite** que dos notas compartan título en carpetas distintas (en la misma carpeta
   sigue siendo imposible: es el mismo archivo).
2. Cuando una operación deja dos notas con el mismo título —o cambia cuál gana un
   `[[Título]]` sin ruta—, Mycelium **antes** de aplicarla anota a qué archivo apunta cada
   enlace de las notas que enlazan a algo involucrado, y **después** reescribe con su ruta
   los que, si no, cambiarían de destino.
3. Se conserva todo lo demás del enlace: el `!` de un embed, el alias (`|texto`, también
   escapado `\|` dentro de una tabla), el ancla (`#sección`, `^bloque`), el espaciado y el
   texto alrededor. Lo que está en bloques de código no se toca.
4. Un **aviso** (el sistema de `stores/avisosStore.ts`) cuenta la coincidencia y en cuántas
   notas se escribió la ruta:
   - «Hay otra nota llamada «Tomate» (en Cultivos). Para que ningún enlace cambie de
     destino, se escribieron con su ruta en 17 notas.»
   - Sin nada que reescribir: «… Ningún enlace cambió de destino.»
   - Varias homónimas: «Hay otras 2 notas llamadas «Tomate» (en la raíz, Huerta/Viejo)…»;
     varias notas a la vez (una carpeta): «3 notas coinciden en título con otras del vault
     («A», «B», «C»)…».

## Qué es «involucrada»

Lo que cambia de ruta (la nota, o las notas de la carpeta) **y** toda nota que, antes de la
operación, ya se llamaba como queda lo tocado. Son las únicas cuyos enlaces pueden cambiar de
ganador: sacar un candidato de un título nunca cambia el ganador de los demás.

## La forma con ruta

`formaUnivoca` (`lib/homonimos.ts`) prueba formas y se queda con la primera que el
resolvedor manda a la nota, en el vault de después:

| Nota | Forma | Si no alcanza |
|---|---|---|
| En carpeta | ruta completa desde la raíz: `[[Cultivos/Tomate]]` | con extensión: `[[Cultivos/Tomate.canvas]]` |
| En la raíz | el título: `[[Tomate]]` | con extensión: `[[Tomate.canvas]]` |

> [!info] Por qué no hay una sintaxis de «raíz»
> El resolvedor desempata por profundidad, así que una nota de la raíz le gana a cualquier
> homónima del mismo tipo que esté en una carpeta: `[[Tomate]]` **ya es** su ruta completa.
> Lo único que le gana es una nota markdown cuando la de la raíz no lo es (regla 4: `[[x]]`
> prefiere `x.md`), y para eso alcanza con la extensión, que el resolvedor ya entiende. Se
> descartó inventar `[[/Tomate]]`: hoy se lee igual que `[[Tomate]]` (los segmentos vacíos se
> ignoran) y ningún otro programa la entendería.

Un enlace solo se reescribe si **dejaría** de llevar a su nota. Uno que ya llevaba ruta y
sigue resolviendo bien queda como estaba; uno de la nota que se renombra prueba primero la
reparación de siempre (título nuevo, o ruta nueva si tenía pista) y solo si esa forma
resolvería a otra va con la ruta completa.

## Operaciones cubiertas

| Operación | Dónde | Notas |
|---|---|---|
| Renombrar una nota | `renameNota`: explorador, título del editor, Esporas, MCP | Involucra la renombrada y las que ya se llamaban como el nombre nuevo (pedido y saneado). El aviso sale si cambió el título (no si solo cambian mayúsculas) |
| Crear una nota | `createNota`: «Nueva nota», paleta «Crear nota «X»», Esporas, dibujos | Si queda más cerca de la raíz, los enlaces a la otra van con ruta. Con un título por defecto («Sin título», «Sin título 3»…) se repara igual pero **no se avisa** salvo que se haya reescrito algo: crear notas sin nombre en varias carpetas es cotidiano |
| Duplicar | `duplicateNota` | La copia se llama «X (copia)»; si existe otra así en otra carpeta, es una homónima nueva |
| Mover una nota o carpeta | `moverConReparacion` (explorador, arrastrar, Ctrl+Z, MCP) | Cambia la profundidad y por ende el ganador. Avisa solo si hubo que reescribir: la coincidencia ya existía |
| Renombrar una carpeta | `renameCarpeta` | No cambia profundidades, pero sí qué pistas calzan; se trata igual que mover |

**No cubiertas**, a propósito:

- **Importar** (`lib/import.ts`): copia un árbol entero con el comando nativo y reindexa;
  equivale a archivos que llegan de afuera, como los que deja el explorador del sistema o la
  IA con `mv`. Los enlaces de lo importado son de su vault de origen. Si trae homónimas de
  notas existentes, el resolvedor decide como siempre.
- **Recuperar de la papelera**: la nota vuelve a su ruta y vuelve a ser candidata, que es lo
  esperable al deshacer un borrado.
- **Abrir un archivo del SO** (`FileOpenBridge`): si ya hay una nota con ese título, abre esa
  en vez de crear otra.

## Deshacer

No hay un deshacer propio de la reparación: lo que se reescribe es parte de la operación.
Deshacer un renombrado o un movimiento (registro de actividad de la IA, Ctrl+Z del
explorador) **repite la operación al revés con la misma reparación**, así que ningún enlace
cambia de destino tampoco al deshacer; los que tomaron la ruta la conservan (siguen siendo
correctos). La simulación del MCP que decide si preguntar (`alcance` en
`lib/mcpArchivos.ts`) cuenta también estas notas.

## Implementación (desktop)

- `lib/homonimos.ts` — puro: `involucradas`, `trasTraslados`, `resolutorDe`,
  `formaUnivoca`, `planHomonimos`, `repararTexto`, `coincidencias`, `textoAviso`.
- `lib/enlaces.ts` — `cambiarDestinos` se exporta y la lógica por destino de
  `reescribirEnlacesMovidos` sale a `destinoTrasCambio`, para reusarla.
- `lib/repararEnlaces.ts` — `leerPrevia` (antes) y `repararTrasOperacion` (después);
  `repararEntrantes` acepta el plan y devuelve `conRuta`.
- `stores/vaultStore.ts` — las cinco operaciones de arriba y el aviso.
- Pruebas: `scripts/test-homonimos.mjs` (renombrar a un homónimo, crear, mover que cambia el
  ganador en los dos sentidos, alias escapado y código, el segundo renombre, la nota de la
  raíz que no es markdown, dibujo homónimo que no cuenta, textos del aviso).

## Casos borde

- **El título que obtiene el archivo** no siempre es el pedido (`DEF-084`: saneo; al crear,
  sufijo si choca en la misma carpeta). Las involucradas se calculan con el pedido y el
  saneado; si el sufijo produjo un título que **también** existe en otra carpeta
  («Tomate 1»), esos enlaces no se miran. Improbable y sin pérdida: solo deja el caso viejo.
- **Un dibujo, lienzo o tabla** con el título de una nota no es coincidencia para el aviso:
  `[[x]]` va a la nota y `![[x.excalidraw]]` al dibujo. Igual se comprueba la resolución.
- **Lo que la IA escribe a mano** (sin el MCP) no pasa por acá. El autocompletado de `[[` ya
  inserta la ruta cuando el título está repetido (`lib/editor/wikilink.ts`).
- Relacionados: `DEF-140` (usar una Espora crea una homónima de la Espora: con esto, los
  enlaces a la Espora no se pierden y aparece el aviso) y `DEF-141` (`[[Nota#Encabezado]]`
  se ve roto; el ancla se conserva al reescribir).

## Relacionadas

- [[titulo-renombra]] — renombrar desde el título; reparación de enlaces (`FUN-M-08`).
- [[mcp-control]] — renombrar y mover desde la IA, con el mismo código.
- [[bugs-progreso]] · [[Aprendizajes tecnicos]]
