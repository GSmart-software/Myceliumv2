> [!important] Este documento es el catálogo de defectos, no su seguimiento
> Acá se escribe **qué sucede**: el síntoma, tal como se observa al usar Mycelium. Todo
> `DEF-*` se registra acá **en cuanto se detecta**, sin importar si ya se está
> corrigiendo, si está pendiente o si se decidió no corregirlo. Un defecto que solo
> existe en el historial de commits o en una spec no está documentado.
>
> El **estado** de cada uno (implementado, confirmado, reflejado en web) y su
> trazabilidad viven en [[bugs-progreso]]. Las **causas raíz** encontradas al resolverlos
> van a [[Aprendizajes tecnicos]]. Acá no: acá va el problema.

> [!important] Un `DEF-*` presupone una funcionalidad ya consolidada
> Solo se registra acá lo que falla en algo **terminado y entregado**. Si el fallo aparece
> mientras se implementa una funcionalidad que todavía no cerró —y es lo que le impide
> funcionar—, **no lleva `DEF-*`: se corrige como parte de esa implementación** y se
> documenta en su spec. Numerarlo sería inventarle una vida propia a un problema que nunca
> llegó a existir para nadie.
>
> Ejemplos de esto último, ambos de `FUN-L-16` (ver [[ventanas-multiples]] § 5): el evento
> `open-files` difundido a todas las ventanas y la instancia única bloqueando el binario de
> desarrollo. Se corrigieron sin número.

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

> [!info] Lo de la herramienta de búsqueda nunca se corrigió: es el `DEF-059`
> Este reporte y el `DEF-031` describen **dos** situaciones: las tablas y el buscador abierto. Se
> corrigió la primera —el `margin` del widget de tabla— y se dieron por cerradas las dos. La
> segunda siguió viva hasta el 2026-08-17.

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

> [!note] Detalle detectado al confirmarlo (2026-08-13)
> Con la pantalla ya funcionando, al terminar la carga **asomaba de nuevo la pantalla de
> selección de vault** durante un instante, antes de entrar al workspace. Se anota acá y no
> como defecto propio porque es el mismo síntoma del mismo trabajo, y nunca llegó a
> publicarse.

# DEF-043
El ícono de las Esporas (plantillas) es una planta o un brote de planta, y no es representativo de una espora. Un círculo, o algo del estilo del ícono de un virus, comunicaría mejor la idea — aunque no sea literalmente una espora, se parece más que una planta.

# DEF-044
Al cambiar de vault se mantienen abiertas las pestañas del vault anterior. Como los archivos son distintos, esas pestañas muestran mal el contenido o directamente no muestran nada.

Cada vault debería tener su propio historial de pestañas abiertas. Ese registro no tendría que compartirse entre vaults.

# DEF-045
No hay forma de escribir un enlace con alias, `[[destino|alias]]`, **dentro de una tabla**. La barra vertical del alias se confunde con la que separa las celdas, así que la tabla se parte donde no debe.

Escaparla (`[[destino\|alias]]`) arregla la tabla pero **rompe el enlace en el grafo y en la vista en vivo**, que se quedan con la barra invertida pegada al destino y no encuentran la nota. Lo peor es que en la vista de lectura se ve todo bien, así que el enlace parece correcto y la conexión no existe.

Detectado al construir enlaces entre documentos que se referenciaban sin `[[wikilinks]]`.

# DEF-046
Al eliminar un archivo, **no aparece en la papelera de Mycelium**. Y cuando se destruye, tampoco está en la papelera de Windows. No hay forma de recuperarlo por ningún camino.

> [!danger] Esto es pérdida de datos, no un defecto de interfaz
> Un archivo eliminado por error hoy no se puede recuperar. Es el defecto más grave
> registrado hasta ahora.

# DEF-047
Al hacer clic derecho sobre un archivo que está muy abajo en el explorador, el menú de opciones se dibuja hacia abajo y **queda fuera de la pantalla**. Las opciones del final no se pueden ver ni pulsar.

# DEF-048
No hay ningún borde ni margen inferior en el sistema — es general de toda la pantalla, no de un componente concreto. Todo queda pegado al límite de la ventana y da la sensación de que el contenido sigue por detrás de la pantalla.

Alcanzaría con unos pocos píxeles de separación abajo para que no se produzca ese efecto.

# DEF-049
Cambiar el ancho de tabulación **no se nota en los documentos que ya existen**. Para que el cambio se vea hay que reindentar cada documento a mano, lo que deja la opción sin utilidad práctica.

# DEF-050
Al cambiar el ancho de tabulación, en la vista de lectura **desaparecen los indicadores para plegar y desplegar los títulos**.

# DEF-051
**Ninguna confirmación aparece, y la acción se ejecuta igual.** Borrar una carpeta la borra directo, sin preguntar; lo mismo al borrar una Espora o al eliminar algo definitivamente desde la papelera. No hay diálogo, no hay aviso y no hay vuelta atrás.

En el registro de la aplicación queda `dialog.confirm not allowed`.

> [!danger] Es destructivo, no cosmético
> No es que falte un cartel: es que **se borra sin que nadie lo confirme**, que es lo
> contrario de lo que el código creía estar haciendo.


# DEF-052
Al abrir un vault, la etapa **«Vigilando los cambios de la carpeta»** es, con diferencia, la que más tarda — bastante más que leer todos los archivos del vault, que es lo que uno esperaría que costara.

Se nota desde que existe la pantalla de carga (`DEF-042`): antes el tiempo estaba ahí igual, pero repartido dentro de un spinner mudo y sin forma de saber en qué se iba.

Relacionado, encontrado al arreglarlo: **los cambios hechos desde fuera de la app a un archivo `.base` o `.canvas` no refrescan nada**. Con un `.md` sí.

# DEF-053
El mismo problema del `DEF-047`, pero con el menú de **opciones del grafo**: si la pestaña del grafo es pequeña, el panel de opciones **se sale de la pantalla**, tanto por los lados como por abajo, y no se puede usar.

# DEF-054
El grafo solo se actualiza cuando el archivo se crea **desde la propia UI de Mycelium**. Si el documento lo genera algo de fuera —un agente de IA escribiendo en la carpeta, otro editor, un `git pull`— el grafo no se entera y sigue mostrando la foto anterior.

# DEF-055
Al cambiar de modo de visualización —de edición a **lectura**, o a cualquier otro— el documento **vuelve al principio**. La posición del scroll debería mantenerse: si estabas leyendo por la mitad de una nota larga, cambiar de modo debería dejarte donde estabas.

# DEF-056
El buscador del archivo (`Ctrl+F`) encuentra las coincidencias y salta a ellas, pero las deja **al borde superior** del área visible, que es justo donde está la barra de herramientas. La palabra encontrada queda **tapada**, más arriba de lo que se ve. Debería quedar **centrada** en la parte visible.

# DEF-057
En la **vista de lectura** el buscador de texto (`Ctrl+F`) no funciona: se abre la barra, se
escribe, y no encuentra nada ni resalta nada. En la vista de edición sí funciona.

*Viene de antes de las correcciones del `DEF-055`/`DEF-056`: no lo causaron ellas.*

# DEF-058
Al volver de la vista de lectura a la de edición, el **foco se queda en los botones que cambian de vista**: las flechas del teclado mueven el foco de un botón a otro en vez de mover el cursor, y hay que volver a hacer clic dentro del texto para poder escribir.

# DEF-059
Con el **buscador abierto**, moverse con las flechas del teclado hace que el documento **salte**: el cursor avanza una línea pero la vista se desplaza cientos de píxeles, y el cursor queda **por encima** de lo visible. Seleccionar texto sufre lo mismo. Al **cerrar** el buscador, las flechas vuelven a comportarse bien de inmediato.

Pasa en notas **sin tablas y sin frontmatter**, y también con el render de tablas de la vista en vivo desactivado.

*Es la mitad del `DEF-037` que nunca se corrigió: aquel describía este mismo síntoma junto al de las tablas, y lo que se arregló fue lo de las tablas.*

# DEF-060
El **panel de propiedades** se abre en **todas** las pestañas a la vez. Con la pantalla dividida en dos o más, abrirlo en una lo abre en todas, y en las que no hacía falta estorba.

# DEF-061
En el bloque de propiedades, el campo de la **clave** ocupa el 100 % del ancho, así que el ícono del tipo de dato no le entra al lado y queda **debajo**, como si fueran dos filas. (Clase `mic-prop-clave-input`.)

# DEF-062
En el modo de edición, **muchas veces los títulos no se renderizan** y quedan como texto normal: se ven los `#`, `##`, `###` sin aplicar el estilo de título.

# DEF-063
En una tabla, el texto de la celda vive en un `span` (`mic-tab-render`) que **no ocupa el ancho de la celda**, sino solo el de su contenido. Al hacer clic en la parte vacía de una celda **no se activa la edición**, y hay que apuntar justo al texto.

# DEF-064
**A veces las tablas no se renderizan** y se quedan en markdown crudo. Para que aparezcan hay que recargar el documento, cambiar de vista y volver, o apagar y encender el renderizado de tablas.

# DEF-065
Si se **pliega un título** y se cambia a otra pestaña, al volver el título está **desplegado** otra vez. El plegado debería sobrevivir al cambio de pestaña —pero solo mientras la pestaña siga abierta: al cerrarla y reabrirla, empezar de nuevo con todo desplegado, como ahora.

# DEF-066
El botón de la barra de herramientas se llama **«Exportar nota»**, pero su menú ya tiene más de una opción y va a tener más. El nombre describe una sola de las cosas que hace.

# DEF-067
El **menú de autocompletado** no tiene aplicados los estilos de Mycelium, a diferencia de otros controles —por ejemplo los campos del bloque de propiedades—.

# DEF-068
En los campos del bloque de propiedades, la **opción marcada se ve en blanco**. No queda claro si ese color se eligió a propósito: parece el color del texto del modo oscuro y no el de un elemento seleccionado.

# DEF-069
Al estar viendo un archivo, el explorador **lo marca a él pero no a las carpetas que lo contienen**. La carpeta que aparece marcada es la última que seleccionó el usuario, que puede no tener nada que ver.

# DEF-070
El **tipo** de una propiedad no se puede cambiar una vez creada. Para pasar, por ejemplo, de texto a fecha hay que **borrar la propiedad y volver a crearla**, perdiendo su valor.

# DEF-071
Un `[[wikilink]]` escrito en una propiedad de tipo texto **no se muestra como enlace en un archivo tabla** (`.base`): aparece como texto plano. No se puede hacer clic para ir al documento referenciado, así que desde una tabla no se navega.

# DEF-072
La **numeración de las consolas nunca se reutiliza**: si se abren tres y se cierra una, la siguiente es la 4 y no la 3. Peor, se pueden llegar a **repetir números** — con una consola 5 abierta y solo tres en total, la siguiente sería la 4 y la de después otra 5.

# DEF-073
**Abrir varias ventanas no funciona**, que es lo que prometía `FUN-L-16`. Dos formas:

1. Con Mycelium abierto, **doble clic en el acceso directo o en el ejecutable no abre nada**: se levanta la ventana que ya estaba.
2. El botón **«Abrir en una ventana nueva»** del selector de vaults **rompe la app**: la ventana original queda **congelada** y la nueva se abre **en blanco**.

# DEF-074
El texto envuelto en **guiones bajos** (`_texto_`, `__texto__`, `___texto___`) **no recibe el estilo propio de Mycelium**: se ve igual que el equivalente con asteriscos. Debería distinguirse — el guion bajo tiene su propio tratamiento visual, y esa es justamente la diferencia por la que existen las dos sintaxis en Mycelium, que en Markdown estándar son intercambiables.

El reporte lo emparenta con `DEF-062` y `DEF-064`, los otros dos casos de algo que **queda sin renderizar** en el editor.

# DEF-075
En la **vista de lectura**, los títulos que se pliegan **vuelven a quedar desplegados solos** al poco rato, sin que el usuario toque nada ni cambie de pestaña.

Es de la misma familia que `DEF-065` —el plegado se pierde al cambiar de pestaña— pero se dispara **sin ninguna acción**: acá el plegado no sobrevive a la simple permanencia en la nota.

# DEF-076
Un `[[wikilink]]` **dentro de una tabla no navega**: al hacerle clic no pasa nada, y el documento enlazado no se abre. Fuera de la tabla, el mismo enlace sí funciona.

El enlace se **ve** bien —con su estilo, y si el destino no existe, con el color de faltante—, así que nada indica que no vaya a ninguna parte.

# DEF-077
En la pestaña PROPIEDADES, el campo **«Nueva propiedad»** sugiere las claves que ya existen en el vault, y esa lista **no tiene los estilos de Mycelium**: aparece con la pinta del sistema en medio de un panel que sí los tiene.

# DEF-078
**Retirado el 2026-09-04, el mismo día que se registró.** Se anotó como que las opciones de *cualquier* `<select>` iban pegadas al borde, y no era cierto: pasaba **solo** en el selector de tipo de una propiedad, porque ese `<select>` —recién agregado por `FUN`/`DEF-070`, todavía sin consolidar— era el único de la app con `appearance: none` y `padding: 0`, y el navegador toma esas dos propiedades de la caja para dibujar la lista.

O sea que era una regresión de trabajo en curso, no un defecto de lo entregado, y [[CLAUDE]] es explícito: eso **no lleva número**, se corrige dentro de esa implementación. El número queda quemado a propósito: no se reutiliza.

# DEF-079
En la **terminal integrada**, con el CLI de Claude Code corriendo dentro, **no se puede copiar ni pegar con `Ctrl+C` / `Ctrl+V`**. Pegar con el botón derecho sí funciona, pero **pega el texto dos veces**.

# DEF-080
En el constructor de filtros de un archivo tabla (`.base`), una condición a la que **todavía no se le puso valor se borra sola**. No se puede dejarla a medias mientras se piensa el resto: desaparece.

Lo esperado es que se quede: **una condición sin valor no filtra**, pero tampoco se elimina.

# DEF-081
En el explorador, **dejar el puntero sobre un archivo o una carpeta no muestra su nombre completo**. Los nombres largos se cortan con puntos suspensivos y no hay forma de leer el resto sin abrir el archivo o ensanchar el panel.

# DEF-082
Un `[[wikilink]]` en una propiedad **tampoco navega desde el bloque de propiedades**, en la vista en vivo: se ve como enlace y al hacerle clic no pasa nada.

Es el hermano del `DEF-071` —que era el mismo problema dentro de un archivo tabla— en el otro sitio donde se muestran las propiedades. En la vista de **lectura** sí funciona.

# DEF-083
En la **terminal integrada**, el texto **se dibuja corrupto**: aparecen letras y símbolos en lugares que parecen aleatorios, se repite texto que está en otro lado, y a veces se ve texto que no existe.

Se detectó usando el CLI de Claude Code dentro de la consola. No se vio con la shell por defecto — pero eso puede ser solo porque se usa mucho menos, no una diferencia real.

> [!info] Probablemente emparentado con el `DEF-079`
> Los dos aparecen con la misma aplicación adentro: una TUI que toma la pantalla completa y redibuja por su cuenta. Conviene mirarlos juntos antes de tocar nada.

> [!info] Se encontró al procesar el `DEF-067`
> No lo reportó el usuario: salió de leer «menú de autocompletado» como el de este campo. El defecto era otro —el de `[[`—, pero este también existía, y por eso se registra aparte en vez de darlo por parte de aquel.

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
