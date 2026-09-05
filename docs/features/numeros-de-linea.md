# Números de línea (`FUN-M-28`)

El número de cada línea al costado del texto, como en el visor de archivos de
código. **Apagado por defecto** y por vault (ver [[preferencias-por-vault]]).

> [!info] Estado
> Implementado en desktop el 2026-09-05. Solo en las vistas de **edición**.

---

## 1. Dónde sí y dónde no

| Vista | Números | Por qué |
|---|---|---|
| Edición en vivo | Sí | Cada línea del archivo es una línea en pantalla |
| Raw | Sí | Ídem |
| **Lectura** | **No** | Ver abajo |
| Visor de otros archivos | Sí, desde `FUN-M-26` | Es un editor de texto plano |

> [!important] En lectura no es que falten: no se pueden poner
> Ahí un párrafo de varias líneas **se reajusta al ancho** y se convierte en un
> solo bloque. La línea 4 del archivo no existe como posición en lo renderizado:
> quedó en medio de un renglón que mezcla contenido de la 3 y la 5.
>
> Se llegó a implementar una versión que mostraba **un número por bloque** —la
> granularidad máxima veraz, que para listas y tablas ya era uno por ítem y por
> fila—. Se descartó por decisión del usuario: prefirió no tenerlos antes que
> tener algo que se lee como si contara líneas y no las cuenta. El texto de
> Configuración lo dice, para que la ausencia no parezca un olvido.

## 2. Lo que costó, y por qué

### El orden de los márgenes es el orden en que se declaran

`foldGutter()` estaba primero, así que el número quedaba a la **derecha** de su
columna y la flecha de plegar a la izquierda — el número lejos de la línea que
numera. Basta con declarar el de números antes.

### Un bloque renderizado se queda sin número

Una tabla, un callout o la tarjeta de propiedades son **widgets de bloque**: un
solo bloque que reemplaza varias líneas. El margen no dibuja nada para esos —su
`widgetMarker` por defecto devuelve `null`— así que la numeración se cortaba ahí
y volvía más abajo, contando bien pero sin nada a la vista en el medio.

CodeMirror tiene una faceta para justo esto: **`lineNumberWidgetMarker`**. Se le
dan las dos líneas que el bloque abarca, como `34-40`.

> [!tip] Un widget que no reemplaza texto no lleva número
> El título del documento se **inserta** en la posición 0 (`from === to`), no
> reemplaza nada, así que no cubre ninguna línea. Sin esa guarda mostraba un «1»
> propio y la línea 1 de verdad mostraba otro justo debajo. La regla es general,
> no un caso especial del título.

### El rango necesitaba sitio, y se lo dimos

El ancho del margen lo fija **lo más largo que haya a la vista**. Un rango es más
ancho que cualquier número, así que el margen se ensanchaba al entrar una tabla
en pantalla y se angostaba al salir: **el texto saltaba de lado al hacer scroll**.

La solución no fue achicar el rango sino reservarle el sitio de antemano: con los
números activos, `.cm-scroller` **cede su relleno izquierdo** al margen —el texto
termina donde estaba— y el margen toma un ancho **mínimo fijo**
(`--mic-ancho-numeros`). Como el mínimo ya supera un rango corriente, el margen
no cambia de tamaño con lo que entre o salga de pantalla.

En `ch` y no en `rem`: lo que importa es cuántos dígitos entran, y el margen usa
la tipografía del editor, así que cambiar el tamaño de fuente lo acompaña solo.

### El fondo del rango marca cuánto ocupa

La casilla del margen mide exactamente lo que mide el bloque, así que teñirla
dibuja de un vistazo qué tramo del archivo cubren esas líneas: un `34-40` arriba
de una tabla alta no decía dónde termina.

> [!warning] Un tinte que se adapta al color no se adapta a cuánto se NOTA
> Se empezó con una mezcla del color del texto, que se aclara en oscuro y se
> oscurece en claro con una sola fórmula. Funcionaba en claro, pero en oscuro la
> tinta es casi blanca sobre un fondo casi negro y **la misma proporción pesa
> mucho más**: se leía como un bloque marcado en vez de como un matiz.
>
> En oscuro va `--mic-raw-mist`, el color de los paneles del tema: apenas por
> encima del lienzo del editor. Y por ser un color del tema y no una mezcla,
> cualquier tema que se agregue trae el suyo sin calibrar un porcentaje.

### El centrado

El número se apoyaba arriba de su línea, y en una más alta que las demás —un
título, una que envuelve— quedaba despegado del texto que numera. Va centrado en
vertical y alineado a la derecha en horizontal, que es lo que mantiene pegados al
texto los números de distinto largo.

## 3. Cambiarlo no recrea el editor

Va en un **compartimento** propio y se prende y apaga reconfigurando. Recrear la
vista perdería el cursor, el scroll y el deshacer de cada editor abierto. Es el
mismo patrón que el ancho de tabulación (`FUN-S-02`).

## Relacionadas

- [[preferencias-por-vault]] — dónde se guarda el ajuste y por qué ahí.
- [[CodeMirror y la vista en vivo]] — los widgets de bloque y sus reglas.
- [[BACKLOG]] — `FUN-M-28`.
- [[Mapa de documentacion]] — índice general.
