# MCP de Mycelium — la regla de decisión para la tesina

**Pre-registro** · escrita el 2026-09-24, **antes de cualquier tanda** sobre la tesina ·
`FUN-L-09`

La segunda evaluación del MCP de memoria corre sobre la tesina del usuario —1.329 notas, 20 MB
de texto, 230 PDFs, un solo tema—, para probar si su ventaja crece con el tamaño del vault. Esta
nota fija **cómo se decide**, antes de ver un solo número. Se congela junto con el conjunto de
preguntas y no se toca después.

> [!important] Qué la distingue de la regla del vault de Mycelium
> Es la regla de [[MCP de Mycelium - evaluacion]] § 9 con **un cambio**: el **tiempo** pasa a
> decidir, junto al costo. Lo decidió el usuario el 2026-09-24 al ver, **después** de la
> decisión del § 16, que el MCP había sido un cuarto a un tercio más rápido en las preguntas
> selladas (§ 16 bis). Aquella decisión no se reabre; esta regla es la que vale **para la
> tesina**, y está escrita antes de correrla.
>
> Entre tres opciones —el tiempo solo como dato, costo **o** tiempo, costo **y** tiempo— el
> usuario eligió la **más exigente**.

## Las magnitudes

- **`Δ`** — diferencia pareada en **acierto citado** (MCP − base), con IC 95 % por *bootstrap*
  remuestreando preguntas. Métrica principal, como en el § 9.
- **`K`** — razón de **costo** MCP/base, pareada por pregunta (mediana de las repeticiones, y
  mediana de las razones), recalculada de los tokens con pesos congelados.
- **`R`** — razón de **tiempo de reloj** MCP/base (`ms_total`), con la misma construcción que
  `K`. Válida porque los brazos corren **intercalados**: una deriva del servicio afecta a los
  dos por igual.

## Primero, la validez

Los mismos filtros del § 9.2 —piso del brazo base al 50 %, adopción del MCP ≥ 50 %,
compactación < 20 %—. Además:

- **Ninguna corrida puede salir a la red**: las que lo hagan se descartan y se repiten.
- **La copia del corpus excluye** los registros de sesiones anteriores de Claude Code.

## La decisión, en orden: la primera fila que se cumple decide

| # | Resultado | Qué se hace |
|---|---|---|
| 1 | `Δ ≤ −5 pts` | **No entra.** Empeora la recuperación |
| 2 | `Δ ≥ +10 pts` con IC sin el 0 | **Entra.** Salvo que `K > 2` o `R > 2`: entonces solo con decisión explícita del usuario |
| 3 | `Δ > 0` con IC sin el 0, pero `< +10` | **Entra si `K ≤ 1` y `R ≤ 1`**: más exacto sin costar ni tardar más |
| 4 | Empate en exactitud, **`K ≤ 0,6`** con IC sin el 1 **y** **`R ≤ 0,75`** con IC sin el 1 | **Entra**: igual de exacto, y claramente más barato **y** más rápido |
| 5 | `K > 1` o `R > 1` | **Se rehace**: sin acertar más, cuesta o tarda más que `grep` |
| 6 | **Ninguna de las anteriores** | **No entra como está**: la ventaja no está demostrada en las dos cosas |

**Por qué 0,75 para el tiempo**: un cuarto menos de espera se nota al usarlo; por debajo de
eso, no paga lo que el MCP suma en mantenimiento. Es un juicio, igual que el 0,6 del costo, y
queda escrito como juicio.

**Bloqueantes de clase**, fuera del orden de la tabla: si el MCP pierde por **más de 30
puntos** en **C7** (dato fuera del índice) o en **C9** (dato solo en un PDF) **sin caer a
`grep` ni leer el PDF**, hay que garantizar ese repliegue antes de seguir, gane lo que gane en el
resto.

## Lo que se completa al congelar

El commit de la tesina que se usa como corpus, el conjunto de preguntas sellado con su
compromiso, y los pesos de costo vigentes. Con eso anotado, esta regla queda cerrada.

## Relacionadas

- [[MCP de Mycelium - evaluacion]] — la regla original (§ 9), la decisión sobre el vault de
  Mycelium (§ 16) y el hallazgo del tiempo (§ 16 bis).
- [[MCP de Mycelium - plan]] — el diseño completo.
