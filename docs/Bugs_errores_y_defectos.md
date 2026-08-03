> [!important] Este documento es el catálogo de defectos, no su seguimiento
> Acá se escribe **qué sucede**: el síntoma, tal como se observa al usar Mycelium. Todo
> `DEF-*` se registra acá **en cuanto se detecta**, sin importar si ya se está
> corrigiendo, si está pendiente o si se decidió no corregirlo. Un defecto que solo
> existe en el historial de commits o en una spec no está documentado.
>
> El **estado** de cada uno (implementado, confirmado, reflejado en web) y su
> trazabilidad viven en [[bugs-progreso]]. Las **causas raíz** encontradas al resolverlos
> van a [[Aprendizajes tecnicos]]. Acá no: acá va el problema.

> [!tip] El usuario no escribe acá: escribe en la bandeja
> Las entradas de este catálogo ya están **definidas** (con su `DEF-NNN` y el síntoma
> redactado). Lo que el usuario anota en crudo va a [[Bandeja de entrada]], y de ahí se
> convierte en una entrada de acá.

# DEF-015
Los títulos marcados con # se pueden colapsar en la vista de edición pero no en la de lectura. 

## DEF-015b
Me gustaría que el ícono para plegar y desplegar (tanto de los títulos como los callouts) tenga un estilo especial personalizado para el sistema. Actualmente es un v medio oscurecido que no es que esté mal, pero no es muy visible. Es importante que este símbolo aparezca en el centro de la línea donde se está escribiendo (alineado en vertical, no centro horizontal)

# DEF-017
Un embed de un dibujo (`![[archivo.excalidraw]]`) no se dibuja en la vista de edición en vivo: ahí se ve el texto del embed y el dibujo recién aparece en la vista de lectura o en la dividida.
Además, el botón "Insertar diagrama" saca del markdown: crea el archivo y lo abre en una pestaña aparte, en lugar de dejar dibujar sin salir de la nota que se está escribiendo.

*Reconstruido a posteriori — ver el aviso al pie sobre los defectos sin reporte original.*

# DEF-018
En el servicio web (desconozco si sucede en el desktop) cuando se cierrra el menú de opciones, se pierde la visual de progreso al exportar un vault

# DEF-020
El panel de Configuración entra con una animación de despliegue, pero al cerrarlo desaparece de golpe, sin la animación de salida. El corte se nota y queda inconsistente con la entrada.

*Reconstruido a posteriori — ver el aviso al pie sobre los defectos sin reporte original.*

# DEF-021
En la visualización en vivo, cuando se escribe un callout con un tipo, por ejemplo "question", todas las notas siguientes que tengan > tendrán el mismo estilo del callout previo. Esto no debería suceder, cada vez que pongo > debería tener su estilo por defecto ya que no es un callout y no eredar el estilo de un Callout previo si tiene un espacio vacío entre medias que separa el callout de la nota >, ya que la nota no forma parte de ese Callout

# DEF-022
En la vista de edición en vivo, no se renderizan los Callouts que se ponen dentro de otro Callout

# DEF-023
En el explorador, donde se visualizan todos los archivos; este debe funcionar como obsidian, donde se pueden arrastrar archivos o ventanas a esa sección y se visualizan, como si fuera una separación de visualización como cualquier otro (adjuntar imagen). 
Además de esto, la división de la sección entre compartidos y archivos debe poder editarse. Actualmente es un único scroll para toda esa pantalla, quiero que estas dos secciones estén siempre visibles y se pueda ajustar el tamaño de cada sección, teniendo cada uno un scroll propio

# DEF-024
Al exportar un PDF de un documento, este le agrega el estilo visual de obsidian, esto puede generar problemas de visual. Por ejemplo, el fondo del PDF no es blanco, lo cual le quita profesionalidad. 
Sería bueno incluir opciones al querer exportar, por ejemplo:
- Decidir si incluir los colores del texto o no
- Decidir si utilizar el fondo blanco para el PDF (lo normal) o si incluir los colores de fondo de Mycelium
- Estilar los Callouts
- Aplicar los estilos de Mycelium

# DEF-026
el indicador de esxritura no es visible en el editor CSS. Tuve que agregar el siguiente código CSS en un snippet para solucionarlo:
```css
.cm-content.cm-lineWrapping{
    caret-color: var(--mic-accent);
}
```
Aplica esta corrección directamente en el sistema real para no tener que ajustarlo desde un snippet

# DEF-030
Los grafos no actualizan los colores cuando se cambia el tema, para que se suceda se debe cerrar y volver a abrir el grafo. Esto no debería ser así, debería actualizarse solo

# DEF-031
Al trabajar con tablas, surgen problemas al desplazarse en la posición para escribir. No se selecciona donde se hace clic. Cuando se pulsan las teclas de dirección, de repente salta todo el documento; no se puede seleccionar correctamente el texto que está cerca de las tablas.
Parace estar relacionado con el error `DEF-037`

# DEF-032
No se peude añadir un archivo excalidraw como multimedia en los markdowns si este excalidraw se generó fuera del propio markdown.
Esto parecía estar arreglado pero parece haberse roto, quizas al intentar aplicar una solución para `DEF-034`

# DEF-033
En la sección "Compartido" del panel lateral, el clic con la rueda del ratón no abre la nota en una pestaña nueva en segundo plano, como sí pasa en el explorador normal. En Compartido la rueda no hace nada (y encima dispara el auto-scroll del navegador).

*Reconstruido a posteriori — ver el aviso al pie sobre los defectos sin reporte original.*

# DEF-034
Cuando se arrastra un archivo/carpeta, este se oscurece como feedback de que se está arrastrando/interactuando, sin embargo, no hay feedback de a donde se está desplazando el archivo/carpeta. Me gustaría que, como en sistemas tradicionales, se viera la "sombra" del archivo/carpeta siguiendo el puntero, tomando como sombra el ícono y el nombre del archivo/carpeta.
*Este defecto ya se intentó corregir anteriormente, pero pareciera que rompió el sistema de arrastrar archivo al markdown para vincularlo*

- Se está marcando bien el lugar a donde se arrastra el archivo, pero no existe esta "sombra" del archivo

# DEF-035
La búsqueda del vault solo encuentra la palabra completa: si escribo "perr" no aparece "perro". Debería encontrar por coincidencia mientras se escribe, y dejar la búsqueda exacta como una opción que se pueda activar.

*Reconstruido a posteriori — ver el aviso al pie sobre los defectos sin reporte original.*

# DEF-036
Al importar archivo, este se importa en el path seleccionado, no al lugar exacto donde se arrastró el archivo.

## DEF-036b 
Tampoco hay un feedback que muestre y se auto-ajuste indicando el lugar donde se están arrastrando los archivos. 
Relacionado al `DEF-034`

# DEF-037
Cuando se habre la herramienta de búsqueda en el mismo archivo, surgen conflictos con el scrill. Al seleccionar intentar seleccionar un texto, no lo selecciona correctamente o surjen dificultades; al presionar las flechas del teclado para desplazarse, esto funciona mal; al darle a siguiente coinsidiencia en el buscador, no se desplaza al lugar correcto, la coinciddencia queda fuera de la pantalla por la parte superior.
Pareciera que la renderización genera conflictos al abrir el buscador ya que es como si el texto visible estuviera más abajo que el texto real entonces al intentar seleccionar un texto, este selecciona más texto hacia abajo. 
Es un error difícil de explicar, pero es muy problemático.
Parece estar relacionado con el error `DEF-031`

# DEF-038
El grafo se puede alejar pero con un límite, no es que esto esté mal, pero si hay mucha cantidad de nodos, no se puede ver el grafo completo. Debería ampliarse ese límite para poder visualizar el grafo completo cuando hay mucha cantidad de nodos

# DEF-039
Al cambiar entre pestañas, el documento siempre se vuelve a cargar desde el principio. Por ejemplo, si estoy mirando una `FUN-TIER-NN` concreta del BACKLOG, cambio a otro documento y vuelvo al BACKLOG, me muestra otra vez el inicio del documento en lugar de dejarme donde estaba leyendo.
Esto entorpece la experiencia y la lectura de múltiples documentos en paralelo.

# DEF-040
El "historial" o "secuencia" de documentos abiertos es **general**, no propio de cada pestaña. Al volver hacia atrás (con el botón extra del ratón o con las teclas correspondientes) se recorre el orden en que se abrieron las notas en todo el sistema, sin relación con la pestaña en la que estoy.

Ejemplo: tengo abiertos dos documentos, `RAMAS` y `HUs`. Estoy en `RAMAS` y cambio a `BACKLOG` (como no estoy haciendo modificaciones, no abre una pestaña nueva, solo la reemplaza). Luego miro `HUs` y lo reemplazo por `DESIGN_SYSTEM`. Si ahora vuelvo a `BACKLOG` y doy al botón de atrás, me muestra `DESIGN_SYSTEM`, cuando debería mostrarme `RAMAS`, que era el archivo previo **de esa pestaña**.

Cada pestaña debería tener su propia línea de historial.

# DEF-041
A pesar de tener activa la opción de pestaña de previsualización, siempre se abre una pestaña nueva en lugar de reemplazar la que estoy viendo y no modifiqué.

# DEF-042
Al abrir Mycelium y seleccionar un vault, **todos** los botones de abrir reemplazan su contenido con el progreso del indexado (cuántos archivos van, etc.). No tiene sentido: si elijo abrir el vault 1, el botón del vault 2 no debería mostrar ese feedback.

Al pulsar "abrir", la pantalla de selección de vault debería desaparecer y dar paso a una **pantalla de carga** con el feedback de qué está haciendo Mycelium. Lo más descriptivo posible: en qué etapa está, cómo va el progreso y si se congeló.

Esa pantalla de carga también debe aparecer cuando el vault se abre **automáticamente** por configuración.


---

> [!warning] Defectos sin reporte original
> El catálogo nació incompleto: se creó con los defectos que estaban abiertos en ese
> momento, así que varios `DEF-*` ya corregidos nunca llegaron a escribirse acá.
> `DEF-017`, `DEF-020`, `DEF-033` y `DEF-035` se **reconstruyeron a posteriori** (2026-08-02)
> a partir del commit que los corrigió (`aed1d0b`, `d0c159f`, `e87406a`, `e9903e7`
> respectivamente) y de los comentarios que dejaron en el código: describen el síntoma tal
> como se deduce del arreglo, no las palabras del reporte, que se perdió.
>
> **Sin ningún rastro** quedan `DEF-001` a `DEF-014`, `DEF-016`, `DEF-019`, `DEF-025`,
> `DEF-027`, `DEF-028` y `DEF-029`: no aparecen en ninguna nota, commit ni comentario del
> repo. Se dan por cerrados antes de que existiera este catálogo y sus números **no se
> reutilizan**. Si alguno reaparece, se registra con un `DEF-*` nuevo.

## Relacionadas

- [[bugs-progreso]] — estado y trazabilidad de cada `DEF-*` de esta lista.
- [[Aprendizajes tecnicos]] — causas raíz encontradas al resolverlos.
- [[Version 1.0.0]] — el release que cerró los defectos hasta el `DEF-038`. Los
  posteriores se detectaron usando el sistema y se registran acá igual.
- [[navegacion-por-pestana]] — spec de `DEF-039`, `DEF-040` y `DEF-041`.
- [[Mapa de documentacion]] — índice general.
