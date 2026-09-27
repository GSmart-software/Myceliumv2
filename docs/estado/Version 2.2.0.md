# Versión 2.2.0

**Solo desktop** (`desktop-tauri`) · 2026-09-26 · sobre [[Version 2.1.0]]

> [!warning] En preparación, sin publicar
> El número ya está puesto en los cinco archivos (`7ef495d`), pero las dos funcionalidades
> que la motivan están **implementadas y sin confirmar en la app** por el usuario. Se
> publica con `npm run publicar` cuando las confirme; hasta entonces este documento es el
> borrador de la nota de release.

Una funcionalidad nueva, el **calendario con recordatorios** (`FUN-L-22`), y una
reconstrucción del **grafo** para vaults grandes (`FUN-L-25`, que cierra `DEF-109`). Las
disposiciones del grafo (`FUN-L-23`) entraron y se retiraron el 2026-09-27 sin publicarse. Con ellas viajan absorbidos los arreglos del
índice que salieron del incidente de un vault de 11.780 notas (`DEF-105` a `DEF-108`) y
otros cuatro defectos cerrados después de la `2.1.0` (`DEF-089`, `DEF-102`, `DEF-103`,
`DEF-104`), más la fórmula a medio margen (`FUN-S-22`).

## Por qué sube este dígito

**Minor, y uno solo**: el usuario puede hacer dos cosas que antes no podía (poner
recordatorios que avisan; elegir cómo se dispone su grafo), y eso manda. Que sean dos
funcionalidades no suma dos incrementos: el salto lo decide el cambio más significativo
([[Versionado del sistema]]). Las correcciones viajan absorbidas.

<!-- notas-release:inicio -->
## Recordatorios y tres formas nuevas de ver tu grafo

- **Calendario con recordatorios.** Anotá un título, un detalle (con enlaces a tus notas),
  un color y una fecha, con hora o sin ella, y si querés que se repita cada día, semana,
  mes o año. Cuando llega el momento, Mycelium avisa con una tarjeta y, si la ventana no
  está al frente, con una notificación de Windows. Lo que venció mientras la app estaba
  cerrada se avisa al abrirla. Se abre como pestaña o como panel lateral, y los
  recordatorios son de cada vault.
- **El grafo, a tu manera.** Además del cúmulo de siempre, tres disposiciones para elegir
  desde el menú del grafo: **Anillo de colonias** (las notas en un anillo, agrupadas por
  carpeta, para ver qué carpetas se hablan entre sí), **Crecimiento** (cada nota brota
  junto a las que ya enlazaba, en orden de creación, y agregar notas no mueve las que ya
  estaban) y **Sustrato** (el cúmulo dibujado como micelio). La elección se guarda por
  vault.
- **Vaults grandes, índice sano.** Abrir un vault de miles de notas ya no tarda minutos,
  lo que se crea desde fuera de la app aparece aunque la escritura no pare, el índice se
  achica al borrar notas, y reconstruirlo ya no pierde tu tema, tus snippets ni la
  papelera.
- **El grafo aguanta vaults grandes.** Con más de mil notas el grafo abría a tirones y se
  congelaba al alejar el zoom. Ahora aparece ya ubicado, con un fundido desde el centro, se
  mueve suave, agrupa las notas relacionadas y no recalcula nada mientras está quieto. Los
  nodos pasan a ser discos lisos, sin brillo.
- **Código es código.** Un `[[enlace]]` o un `#tag` escrito dentro de un bloque de código
  ya no cuenta como enlace ni como etiqueta, ni en el grafo ni en el editor.
<!-- notas-release:fin -->

## Qué entra

| Qué | ID | Dónde |
|---|---|---|
| Calendario con recordatorios que avisan | `FUN-L-22` | desktop · [[calendario-recordatorios]] (web reflejada, sin publicar) |
| El grafo aguanta vaults grandes: índice de enlaces, worker, precálculo y revelado, fuerzas como d3 | `FUN-L-25` · `DEF-109` | desktop · [[grafo-indice-y-motor]] (web pendiente) |
| ~~Disposiciones del grafo elegibles por vault~~ (retirada el 2026-09-27) | `FUN-L-23` | — |
| La tabla de búsqueda se escribe por rowid y lo borrado se limpia por conjuntos | `DEF-105` | desktop |
| Lo creado desde fuera aparece aunque la escritura no pare | `DEF-106` | desktop |
| Apariencia, snippets y papelera viven en `.mycelium`, no solo en el índice | `DEF-107` | desktop |
| El índice se compacta después de una limpieza grande | `DEF-108` | desktop |
| Lo que está dentro de código no se decora como enlace ni etiqueta | `DEF-089` | ambas |
| Los enlaces y etiquetas dentro de código no cuentan en el grafo | `DEF-102` | ambas |
| Fórmulas KaTeX en vivo y la hoja a medio margen | `DEF-103` · `FUN-S-22` | ambas |
| El divisor de paneles sigue al puntero aunque pase sobre un iframe | `DEF-104` | ambas |

## Cómo comprobarlo en la app

1. Calendario: crear un recordatorio para dentro de dos minutos con un `[[enlace]]`;
   minimizar la ventana; debe llegar la notificación de Windows y, al volver, la tarjeta
   con «Abrir», «Listo» y «Posponer». Cerrar la app con uno vencido y reabrir: avisa.
2. Grafo: abrir el grafo, menú de opciones → «Disposición»; probar las cuatro; cerrar y
   reabrir el vault: la elegida persiste; abrir otro vault: no la hereda. Con
   «Crecimiento», crear una nota enlazada a otra: aparece junto a ella sin mover el resto.
3. Índice: en un vault grande, reabrir y medir; crear un archivo desde fuera mientras un
   script escribe otros; borrar muchas notas y ver que `index-<hash>.db` se achica.

## Relacionadas

- [[Version 2.1.0]] — la versión anterior.
- [[Versionado del sistema]] — el criterio del número.
- [[BACKLOG]] — el inventario.
- [[Mapa de documentacion]] — índice general.
