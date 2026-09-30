# Versión 2.2.0

**Solo desktop** (`desktop-tauri`) · 2026-09-27 · sobre [[Version 2.1.0]]

> [!success] Publicada el 2026-09-28 a las 01:02 (UTC)
> La publicó el usuario con `npm run publicar`, sobre la compilación del ensayo del
> 2026-09-27 (la firma del `latest.json` publicado coincide con la de
> `installers/v2.2.0/`). Los diccionarios del corrector se subieron antes con
> `npm run publicar-diccionarios` ([[Publicar los diccionarios del corrector]]).

Tres funcionalidades nuevas: el **calendario con recordatorios** (`FUN-L-22`), el
**corrector ortográfico** con motor propio (`FUN-L-12`) y **abrir otro vault desde la barra
superior** (`FUN-S-24`). El **grafo** se reconstruyó para vaults grandes (`FUN-L-25`, que
cierra `DEF-109`). Las disposiciones del grafo (`FUN-L-23`) entraron y se retiraron el
2026-09-27 sin publicarse.

Con ellas viajan absorbidos:

- los arreglos del índice que salieron del incidente de un vault de 11.780 notas (`DEF-105` a
  `DEF-108`);
- las tandas de rendimiento y de limpieza de la [[Auditoria de codigo 2026-09-26]]
  (`FUN-M-38`, `FUN-M-39`, `FUN-M-40`, `FUN-L-24`);
- las correcciones `DEF-089`, `DEF-102` a `DEF-104` y `DEF-110` a `DEF-117`;
- la fórmula a medio margen (`FUN-S-22`).

## Por qué sube este dígito

**Minor, y uno solo**: el usuario puede hacer cosas que antes no podía (poner recordatorios
que avisan, corregir la ortografía, abrir otro vault sin salir del actual), y eso manda.
Que sean tres funcionalidades no suma tres incrementos: el salto lo decide el cambio más
significativo ([[Versionado del sistema]]). Las correcciones viajan absorbidas.

<!-- notas-release:inicio -->
## Recordatorios, corrector ortográfico y un grafo para vaults grandes

### Calendario con recordatorios

- Anotá un título, un detalle (con enlaces a tus notas), un color y una fecha, con hora o
  sin ella, y si querés que se repita cada día, semana, mes o año.
- Cuando llega el momento, Mycelium avisa con una tarjeta y, si la ventana no está al
  frente, con una notificación de Windows. Lo que venció mientras la app estaba cerrada se
  avisa al abrirla.
- Marcá un recordatorio como **completado** y se distingue de los pendientes. Un clic en el nombre del mes
  salta a cualquier mes y año.
- Se abre como pestaña o como panel lateral, y los recordatorios son de cada vault.

### Corrector ortográfico

- Las palabras mal escritas se subrayan mientras escribís. Un clic derecho ofrece
  sugerencias y permite **agregar la palabra** al diccionario del vault o al de Mycelium,
  que vale para todos tus vaults.
- Elegí qué idiomas usar —español, inglés, italiano— en **Configuración → Editor**. Los
  diccionarios se descargan una sola vez; el español llega en la variante de tu región.
- Todo corre en tu computadora: nada de lo que escribís sale de ella. Desde Configuración
  podés ver y quitar las palabras que agregaste.

### Otro vault, sin salir del actual

- Desde el nombre del vault, en la barra superior, abrí cualquier otro en una ventana
  nueva, o una carpeta que todavía no esté en la lista. Si ya estaba abierto, su ventana
  pasa al frente.

### El grafo aguanta vaults grandes

- Con más de mil notas el grafo abría a tirones y se congelaba al alejar el zoom. Ahora
  aparece ya ubicado, con un fundido desde el centro, se mueve suave, agrupa las notas
  relacionadas y no recalcula nada mientras está quieto. Los nodos pasan a ser discos
  lisos, sin brillo.

### Más rápido y más firme

- **Vaults grandes, índice sano.** Abrir un vault de miles de notas ya no tarda minutos, lo
  que se crea desde fuera de la app aparece aunque la escritura no pare, el índice se
  achica al borrar notas, y reconstruirlo ya no pierde tu tema, tus snippets ni la papelera.
- **Guardar es más liviano** y la búsqueda responde más rápido: arranca con dos letras y
  una búsqueda vieja ya no pisa a la nueva.
- **Nada se deshace solo.** Lo último que escribiste ya no desaparece al guardarse, el
  cursor y el scroll se quedan donde estaban, y Ctrl+Z en el editor ya no devuelve a su
  carpeta el último archivo que moviste.
- **Un dibujo soltado sobre una nota es un archivo del vault**, y ya no se pierde al
  reconstruir el índice. Importar una carpeta copia también sus adjuntos.
- **El PDF vuelve a respetar tus opciones de estilo**: fondo, colores, callouts y los
  estilos de Mycelium.
- **Código es código.** Un `[[enlace]]` o un `#tag` escrito dentro de un bloque de código
  ya no cuenta como enlace ni como etiqueta, ni en el grafo ni en el editor.
- Mientras se abre un vault ya se puede cerrar o minimizar la ventana; renombrar una nota
  ya no le borra las propiedades; y las fórmulas se ven mientras escribís.
<!-- notas-release:fin -->

## Qué entra

| Qué | ID | Dónde |
|---|---|---|
| Calendario con recordatorios que avisan; completar y selector de mes | `FUN-L-22` | desktop · [[calendario-recordatorios]] (web reflejada, sin publicar) |
| Corrector ortográfico con motor propio, diccionarios descargables, diccionario del vault y de Mycelium | `FUN-L-12` | desktop · [[corrector-ortografico]] (web pendiente) |
| Abrir otro vault desde la barra superior | `FUN-S-24` | desktop |
| El grafo aguanta vaults grandes: índice de enlaces, worker, precálculo y revelado, fuerzas como d3 | `FUN-L-25` · `DEF-109` | desktop · [[grafo-indice-y-motor]] (web: partes B–G) |
| ~~Disposiciones del grafo elegibles por vault~~ (retirada el 2026-09-27) | `FUN-L-23` | — |
| Rendimiento: guardar sin reindexar, indexado por tandas, un solo recorrido del disco, búsqueda cancelable | `FUN-M-38` · `DEF-111` | desktop · [[auditoria-rendimiento-1]] |
| Limpieza: dependencias, permisos y código sin uso; compartir y colaboración fuera de desktop | `FUN-M-39` | ambas · [[auditoria-limpieza-1]] |
| Editor y enlaces: un solo resolutor de wikilinks, el dibujo soltado es archivo, sin caché IndexedDB, importar carpeta desde Rust | `FUN-M-40` · `DEF-112` · `DEF-113` | desktop · [[auditoria-editor-y-enlaces]] |
| Capa de datos: sin modo SQLite clásico, preferencias por vault en `.mycelium/` | `FUN-L-24` | desktop · [[auditoria-capa-de-datos]] |
| La tabla de búsqueda se escribe por rowid y lo borrado se limpia por conjuntos | `DEF-105` | desktop |
| Lo creado desde fuera aparece aunque la escritura no pare | `DEF-106` | desktop |
| Apariencia, snippets y papelera viven en `.mycelium`, no solo en el índice | `DEF-107` | desktop |
| El índice se compacta después de una limpieza grande | `DEF-108` | desktop |
| Renombrar o mover una nota conserva sus propiedades en el índice | `DEF-110` | desktop |
| Los botones de la ventana también mientras se abre un vault | `DEF-114` | desktop |
| El flujo animado del grafo se ve en vaults grandes | `DEF-115` | ambas |
| Las opciones de estilo del PDF vuelven a hacer efecto | `DEF-116` | ambas |
| No se revierte lo escrito, el cursor ni el último movimiento de archivo | `DEF-117` | ambas |
| Lo que está dentro de código no se decora como enlace ni etiqueta | `DEF-089` | ambas |
| Los enlaces y etiquetas dentro de código no cuentan en el grafo | `DEF-102` | ambas |
| Fórmulas KaTeX en vivo y la hoja a medio margen | `DEF-103` · `FUN-S-22` | ambas |
| El divisor de paneles sigue al puntero aunque pase sobre un iframe | `DEF-104` | ambas |

## Cómo comprobarlo en la app

1. Calendario: crear un recordatorio para dentro de dos minutos con un `[[enlace]]`;
   minimizar la ventana; debe llegar la notificación de Windows y, al volver, la tarjeta
   con «Abrir», «Listo» y «Posponer». Cerrar la app con uno vencido y reabrir: avisa.
2. Corrector: Configuración → Editor → descargar español; escribir «ola manuel» y ver el
   subrayado; clic derecho → agregar al diccionario de Mycelium; verla en la lista y
   quitarla.
3. Otro vault: desde el nombre del vault en la barra superior, abrir otro en ventana nueva.
4. Grafo: abrir el grafo de un vault de más de mil notas; aparece ubicado y se mueve suave.
5. Índice: en un vault grande, reabrir y medir; crear un archivo desde fuera mientras un
   script escribe otros; borrar muchas notas y ver que `index-<hash>.db` se achica.
6. Escribir sin parar durante un autoguardado: no se pierde nada ni salta el cursor.

## Relacionadas

- [[Version 2.1.0]] — la versión anterior.
- [[Versionado del sistema]] — el criterio del número.
- [[Publicar una version]] — el proceso.
- [[BACKLOG]] — el inventario.
- [[Mapa de documentacion]] — índice general.
