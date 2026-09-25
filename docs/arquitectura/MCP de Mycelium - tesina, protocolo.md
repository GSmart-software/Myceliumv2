# MCP de Mycelium — tesina, protocolo

**Preparación de la segunda evaluación** · 2026-09-24/25 · `FUN-L-09`

La primera evaluación del MCP de memoria ([[MCP de Mycelium - evaluacion]], § 16) terminó en
empate con `grep` sobre el vault de Mycelium, de unas 115 notas. La hipótesis que queda por probar
es que **la ventaja del MCP crece con el tamaño del vault**. Esta nota describe cómo se preparó la
prueba sobre un vault diez veces más grande —la tesina del usuario— y qué dejó el piloto. La regla
con que se decide está escrita aparte y antes: [[MCP de Mycelium - tesina, regla de decision]].

> [!danger] Nada de la tesina en este repo
> Las preguntas, las claves, la copia del vault, los resultados y el sello viven en
> `C:\mycelium-eval\tesina\`, fuera del repo. El repo se publica y las claves llevan fragmentos
> del trabajo del usuario. Esta nota **describe, no cita**: no nombra notas, fuentes ni datos de
> la tesina.

---

## 1. El vault

- Un repo git propio, con el framework de IA de Mycelium instalado (`mycelium-ia 1.5.0`). Se
  usa el commit `bec7017`; el usuario tenía cambios sin commitear, que no entran (durante la
  preparación los commiteó en un commit posterior, que tampoco entra: la copia sale de
  `bec7017`).
- **1.328 notas `.md`** (21 títulos repetidos: 1.307 distintos), unos 20 MB de texto, **230 PDF**,
  y unos 80 archivos de texto que no son notas (`.html` archivados, `.txt`, `.mjs`, `.py`). La copia
  entera ocupa unos 470 MB y se prepara en unos 10 s.
- **Un solo tema**: el vocabulario se repite en cientos de notas. Es lo contrario del vault de
  Mycelium, donde un término suele llevar a una o dos notas.
- **El mismo dato vive en varias notas**: la versión que redacta la IA, el glosario, la
  investigación que lo respalda, la ficha de la fuente y la verificación. Por eso casi todas las
  claves usan alternativas en `notas_clave` (§ 9.4 de la evaluación): exigir una nota en
  particular castigaría una cita igual de legítima.

La tesina es **de solo lectura** para el arnés: sobre su repo solo corren `git archive`,
`git ls-tree`, `git show` y `git rev-parse`.

## 2. El arnés, para más de un vault

Hasta acá el arnés asumía el vault de Mycelium en cada script. Ahora un vault se describe con una
configuración (`eval/lib/vault.mjs`):

| Campo | Qué dice |
|---|---|
| `repo`, `commit_vault` | De dónde sale la copia (solo lectura) |
| `excluir` (+ `excluir_motivo`) | Qué rutas del commit no van a la copia, y por qué |
| `control` | `commit`: el `CLAUDE.md` y `.claude/` vienen en el commit · `checkout`: se copian de la instalación (el caso de Mycelium) |
| `preguntas`, `resultados`, `juicios`, `patron`, `corridas` | Dónde viven los datos de la evaluación |
| `mcp_config`, `app_mcp` | El servidor del brazo MCP y su registro de vaults propio |
| `sello` | La clave con que se sellan sus preguntas de reserva |
| `composicion` | Cuántas preguntas por clase exige el verificador (`null`: ninguna) |
| `regla` | `§9` (la del vault de Mycelium, congelada) o `costo-y-tiempo` (la de la tesina) |
| `c8` | Cómo se controla el vocabulario de una C8 (§ 5) |
| `protocolo` | Lo que pisa de `eval/config.json` (modelos, repeticiones) |

Todos los scripts aceptan `--vault <json>` (o `MYCELIUM_EVAL_VAULT`). **Sin eso, el vault es el de
Mycelium con las mismas rutas de siempre**: el informe, el verificador, la puntuación, el plan y el
juez dan la misma salida, byte por byte, que antes del cambio, y los 83 tests previos pasan sin
tocarlos. La configuración de la tesina es `C:\mycelium-eval\tesina\vault.json`.

**El tiempo, como métrica de primera clase** (pedido del usuario): el informe muestra, para los dos
vaults, `R` —razón de tiempo pareada con la construcción de `K` y las mismas réplicas del
*bootstrap*—, el tiempo en herramientas separado del resto (de la transcripción: cada `tool_use`
hasta su `tool_result`, como unión de intervalos) y la latencia interna del MCP (del campo `ms` de
su registro de búsquedas). En el vault de Mycelium lo muestra **sin usarlo**: la § 9 no lo incluye.
En la tesina decide, porque su regla lo dice. Sobre los datos ya corridos del § 16, `R` reproduce
el 0,76 [0,66, 0,85] de Haiku y el 0,63 [0,45, 0,74] de Sonnet, y el desglose dice de dónde sale:
**el `grep` del brazo base pasa 2,7 s de sus 32,7 s en herramientas** (Haiku; 4,2 de 20,9 con
Sonnet). El MCP no gana tiempo por buscar más rápido, sino por necesitar **menos turnos del
modelo**.

## 3. Qué se excluye de la copia, y por qué

| Excluido | Por qué |
|---|---|
| `.claude/metrics/` | 777 registros de sesiones anteriores de Claude Code sobre la tesina. `grep` encontraría ahí respuestas ya dadas y la evaluación mediría memoria de **conversaciones**, no del vault. No está en git; se excluye igual, por si un commit futuro lo trae |
| `.claude/settings.json` | No es protocolo de recuperación sino instrumentación: *hooks* de métricas en cada evento (escriben registros y disparan `stop_hook_summary`, con lo que el arnés descartaría **todas** las corridas), telemetría a un colector local y un modelo por defecto. La § 7 regla 4 pide correr sin *hooks*, y el corpus de Mycelium tampoco lleva ese archivo |
| Un archivo vacío con una frase de la tesina por nombre | Lo creó un comando de shell mal entrecomillado; el usuario ya lo borró en su copia de trabajo. No es una nota, y su único efecto sería que buscar por nombre de archivo encuentre una frase |

Se revisó si había **otra contaminación del mismo tipo** —transcripciones, exportaciones,
respuestas guardadas— y no la hay en el commit: los informes que el sistema de agentes de la tesina
escribió (investigaciones, verificaciones, reportes, capturas de páginas) **son el contenido del
vault**, no memoria de conversaciones, y se quedan. El grupo de control del brazo base es el de la
propia tesina: su `CLAUDE.md` y todo su `.claude/` salvo lo de la tabla.

## 4. Una clase nueva: C9 · dato solo en un PDF

**Definición.** El dato vive **en un PDF del vault y en ningún otro archivo de texto**: ni en una
nota ni en un `.html`, `.txt` o archivo de código (si estuviera en uno de esos, sería una C7). El
verificador lo comprueba: extrae el texto del PDF con `pdftotext` para confirmar que el dato está, y
busca la `prueba_fuera_indice` en todas las notas —también las de título repetido— y en todos los
demás textos para confirmar que no está.

**Cómo se puntúa: igual que C7.** El acierto sale de `aceptadas`/`requeridas`; `notas_clave` va
vacía, así que el acierto citado es el acierto; son admisibles el PDF (`fuentes_codigo`) y la nota
que el vault tiene sobre ese PDF, que es el camino legítimo para llegar a él. Un PDF citado sin su
extensión cuenta como el PDF, no como cita inventada (solo si existe un `.pdf` con ese nombre y
ninguna nota se llama así; el vault de Mycelium no tiene PDFs, así que su puntuación no cambia).

**Por qué medirla.** Ni `grep` ni el índice del MCP leen el texto de un PDF; `Read` sí lo lee
(renderiza las páginas), y en esta máquina el brazo base tiene además `pdftotext` en `Bash`. La
clase dice **si vale la pena que el MCP indexe PDFs**: si el brazo MCP pierde en C9 y no se repliega
a leer el PDF, indexarlos lo arreglaría; si los dos brazos llegan igual por `Read`, indexarlos suma
poco. «Se replegó» significa: un `Read` sobre un `.pdf` o un comando de shell que nombra un `.pdf`
(buscar con `Grep` no cuenta: no lee el texto comprimido). Con eso la regla de la tesina aplica su
bloqueante de C9, con la misma lógica que el de C7.

**Y C7 queda vacía, y es un hallazgo.** Se escribieron seis candidatas de dato fuera del índice que
no fuera PDF —páginas archivadas en `.html`, un script, un registro de configuración— y **las seis
estaban transcriptas en una nota**: el sistema de agentes de la tesina guarda cada página que
consulta como una captura en Markdown. En este vault, lo único que queda fuera del índice son los
PDF: C9 ocupa el lugar que en el vault de Mycelium ocupaba C7.

## 5. Cómo se escribieron las preguntas

**El sesgo contra el que existe este cuidado**: una pregunta escrita mirando la respuesta usa el
vocabulario de la nota y le regala el acierto a la búsqueda por palabras (§ 8, sesgo 1).

1. **Paso 1, desde la estructura.** Las preguntas del agente se escribieron mirando **solo**
   nombres de archivo, encabezados (un volcado de todos los encabezados del vault, sin cuerpos),
   el grafo de enlaces y las notas índice; ningún cuerpo de la nota que responde. Quedaron
   registradas antes de abrir nada (`trabajo/paso1-preguntas-desde-estructura.md`).
2. **Paso 2, las claves, aparte.** Recién ahí se leyó el vault para armar cada clave con el
   formato de la § 3 y las extensiones del § 9.4. Las admisibles salen de buscar en el corpus
   todas las notas que contienen el dato; las notas clave, a mano, como alternativas. Cada clave
   pasó el verificador (`eval/verificar-claves.mjs --vault …`) sin errores.
3. **Lo que no tuvo respuesta clara se descartó**, no se forzó. Lo que compartía más de dos
   palabras con el título de su nota se reformuló (§ 8).

**C8 · vocabulario propio, con control mecánico.** En el vault de Mycelium una C8 no podía compartir
ninguna palabra de contenido con el **texto** de su sección. Acá una sección tiene cientos o miles
de palabras y esa regla es imposible, así que la tesina declara `c8: "encabezados"`: la pregunta no
comparte palabras de contenido (fuera de las de parada) con el **título de la nota ni con la cadena
de encabezados** de la sección, **y** ordenando todas las notas por cuántas de las palabras de la
pregunta contienen —lo que haría quien encadena `grep -l`—, la nota que responde no puede quedar
entre las 10 primeras (los empates cuentan en contra). Las dos cosas las comprueba el verificador.
De tres C8 escritas, una no pasó con ninguna redacción —el capítulo que la responde es tan largo
que cualquier juego de palabras lo pone entre los tres primeros— y se descartó; otra se reformuló:
su primera redacción quedaba sexta, la final queda en el puesto 211. La tercera, en el 42.

**Las del usuario.** Escribió once, las que solo él puede escribir bien: las de **ausencia**, las
de **dato que vive solo en un PDF** y algunas con su propio vocabulario. El coordinador las verificó
contra el commit y fijó su clase. Una de las ausencias tiene una trampa deliberada: el nombre que
pregunta aparece una vez en el vault, pero como autor de otra cosa; queda como distractor.

| Clase | Del agente | Del usuario | Total | Desarrollo | Reserva |
|---|---|---|---|---|---|
| C1 hecho puntual | 6 | 2 | 8 | 5 | 3 |
| C2 decisión y porqué | 4 | 1 | 5 | 3 | 2 |
| C3 contradicción resuelta | 6 | 2 | 8 | 5 | 3 |
| C4 dos saltos | 3 | — | 3 | 2 | 1 |
| C5 ausencia | — | 3 | 3 | 2 | 1 |
| C6 enumeración | 4 | — | 4 | 3 | 1 |
| C7 fuera del índice (no PDF) | 0 | — | 0 | — | — |
| C8 vocabulario propio | 2 | — | 2 | 1 | 1 |
| C9 solo en un PDF | — | 3 | 3 | 2 | 1 |
| **Total** | **25** | **11** | **36** | **23** | **13** |

Del agente se escribieron 35 y **quedaron 25**: se descartaron diez (seis C7 cuyo dato estaba en
una nota, una C8 que no pasó el control de `grep`, dos cuya respuesta no era clara, y una que se
superponía con una del usuario: las dos se contestaban con el mismo dato, y si una caía en
desarrollo y la otra en reserva, la primera filtraba la segunda). Dos C4 se reclasificaron al
armar la clave, porque la respuesta resultó estar en una sola nota.

**Partición y sello.** Por clase, un tercio a reserva, elegido con la semilla `20260925`; las del
usuario quedan en los dos lados (6 en desarrollo, 5 en reserva). La reserva está **sellada con una
clave nueva, propia de la tesina**: `C:\mycelium-eval\tesina\sello.key`. **Hay que respaldarla**:
sin ella la reserva no se abre. Después de sellar se borraron los borradores en claro y se
redactaron los archivos de trabajo; lo único que conserva el texto de la reserva es
`preguntas.jsonl`, cifrado.

## 6. El piloto (2026-09-25)

Dos preguntas de **desarrollo** —una C1 que se contesta desde las notas y una C9 que solo está en
un PDF—, una corrida por brazo con Haiku, y base y MCP con Sonnet: **10 corridas, US$ 0,80**. El
servidor es el mismo binario evaluado en el vault de Mycelium (`fe9c375`), con un registro de vaults
propio de la tesina (`C:\mycelium-eval\tesina\app\`), nunca el app-data real.

| Modelo · brazo | Acierto citado | Costo (US$) | Tiempo | Turnos |
|---|---|---|---|---|
| Haiku · ciego | 0 de 2 | 0,016 · 0,028 | 7 s · 22 s | 2 · 7 |
| Haiku · base | 0 de 2 | 0,121 · 0,052 | 57 s · 36 s | 9 · 12 |
| Haiku · MCP | **2 de 2** | 0,065 · 0,052 | 19 s · 17 s | 5 · 5 |
| Sonnet · base | 2 de 2 | 0,167 · 0,123 | 26 s · 25 s | 10 · 10 |
| Sonnet · MCP | 2 de 2 | 0,101 · 0,081 | 11 s · 19 s | 5 · 7 |

Con dos preguntas no se concluye nada; es la escala del costo y lo que hay que mirar:

- **Costo por corrida, contra el vault de Mycelium**: el brazo base con Haiku cuesta alrededor de
  1,5 veces más (mediana 0,086 contra 0,055-0,064); el MCP, 1,5 veces más también (0,058 contra
  0,034-0,041).
- **En la C9, el brazo base con Haiku no abrió el PDF** y contestó con lo que el propio PDF descarta;
  el MCP encontró la nota sobre ese PDF y lo leyó con `Read`. Con Sonnet, los dos llegaron.
- **La latencia interna del MCP creció diez veces**: mediana 229 ms por búsqueda, contra 19-26 ms en
  el vault de Mycelium. Sigue siendo chica al lado de un turno del modelo.
- **Dos claves de desarrollo para revisar antes de la tanda**, que el piloto destapó: en la C1, una
  respuesta correcta citó una investigación que sostiene el dato y no está entre las alternativas; en
  la C9, la respuesta equivocada típica merece ser un distractor. Por la § 10, regla 2, se corrigen
  como versión `b`, no en el lugar.

### Cuánto costarían las tandas

| Tanda | Corridas | Estimación |
|---|---|---|
| **Desarrollo**: 23 preguntas × ciego, base y MCP × 5, Haiku | 346 | **US$ 19**, más ~US$ 1,5 de juez |
| **Decisión**: 13 selladas × tres brazos × 5, Haiku | 196 | ~US$ 11 |
| **Decisión**: la réplica con Sonnet | 196 | ~US$ 20 (el ciego con Sonnet no se midió: se estimó con la razón Sonnet/Haiku del § 16) |
| **Decisión, total** | 392 | **~US$ 31**, más ~US$ 2 de juez |

La del desarrollo es la que calcula el arnés (`correr.mjs --plan`) con las medianas del piloto; la de
decisión aplica esas medianas al tamaño del conjunto sellado. Las dos llevan el margen de error de
medir sobre dos preguntas.

### Cuánto tarda el MCP en indexar este vault en frío

Con `eval/medir-indexado.mjs --frio` (borra el índice del registro de la evaluación y mide desde que
arranca el proceso hasta que la primera búsqueda deja de contestar `INDEXANDO`), tres veces:

- **5,2-5,3 s** de indexado según el propio servidor (1.328 archivos, recorrido de 20 ms), y
  **5,5 s** hasta la primera búsqueda útil. `initialize` contesta en unos 60 ms: el arranque no
  bloquea la sesión.
- Índice de **55,8 MB** (más 6,3 MB de WAL).
- En caliente, revalidar los 1.328 archivos lleva **33 ms**.

En una tanda solo la primera corrida del brazo MCP encontraría el índice frío, y la absorbe el
calentamiento.

## Relacionadas

- [[MCP de Mycelium - tesina, regla de decision]] — cómo se decide, escrita antes de correr.
- [[MCP de Mycelium - evaluacion]] — el protocolo que esto extiende (§ 2 a § 10) y la decisión sobre
  el vault de Mycelium (§ 16).
- [[MCP de Mycelium - memoria]] — lo que se evalúa.
