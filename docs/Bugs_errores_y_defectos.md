# DEF-015
Los títulos marcados con # se pueden colapsar en la vista de edición pero no en la de lectura. 

## DEF-015b
Me gustaría que el ícono para plegar y desplegar (tanto de los títulos como los callouts) tenga un estilo especial personalizado para el sistema. Actualmente es un v medio oscurecido que no es que esté mal, pero no es muy visible. Es importante que este símbolo aparezca en el centro de la línea donde se está escribiendo (alineado en vertical, no centro horizontal)

# DEF-018
En el servicio web (desconozco si sucede en el desktop) cuando se cierrra el menú de opciones, se pierde la visual de progreso al exportar un vault

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

# DEF-034
Cuando se arrastra un archivo/carpeta, este se oscurece como feedback de que se está arrastrando/interactuando, sin embargo, no hay feedback de a donde se está desplazando el archivo/carpeta. Me gustaría que, como en sistemas tradicionales, se viera la "sombra" del archivo/carpeta siguiendo el puntero, tomando como sombra el ícono y el nombre del archivo/carpeta.
*Este defecto ya se intentó corregir anteriormente, pero pareciera que rompió el sistema de arrastrar archivo al markdown para vincularlo*

- Se está marcando bien el lugar a donde se arrastra el archivo, pero no existe esta "sombra" del archivo

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

