> [!warning] Documento histórico — las ideas nuevas van a la bandeja
> Estas son las notas originales del usuario, con los códigos `C-M-*`/`C-I-*`/`C-G-*` que
> dieron origen al [[BACKLOG]]. Se conservan como registro: la columna **Orig.** del
> backlog apunta acá.
>
> **No agregues ideas nuevas a este archivo.** Van a [[Bandeja de entrada]], que es donde
> el usuario anota en crudo y desde donde se convierten en `FUN-*`. Lo que figura abajo
> como "Pendientes" ya está consolidado en el backlog con su ID y su tamaño; ese es el
> documento vivo.

# Pendientes
## Cambios Menores

>[!note] [C-M-06] Checkbox con distintos estilos según el símbolo puesto
>X marcado con una X
>- marcado con texto tachado
> * marcado con una estrella
> + marcado con el símbolo check

>[!note] [C-M-10] Configurar cuanto espacio ocupa una tabulación 

> [!note] C-M-12 añadir las extensiones de los archivos.
>  La mayoria de los archivos manejados serán markdowns, pero al manipular otros tipos de archivos no se los puede identificar. 

> [!note] C-M-13 Visualizar contenido de archivos de la papelera

>[!note] C-M-14 Seleccionar varios archivos para borrar en la papelera



## Cambios intermedios

>[!note] [C-I-03] Buscador de archivos por coincidencia de nombre en el grafo de conexiones
>Se debe "apagar" los nodos del grafo y dejar iluminado solo los nodos que coincidan con el nombre escrito

>[!note] [C-I-04] Plantillas para crear rápidamente markdowns
> Se debe tener en la barra herramientas de la izquierda un nuevo botón para ver todas las plantillas. Se podrán crear nuevas plantillas que se podrán utilizar tantas veces como se requiera
> Al momento de crear un archivo, ahora se mostrará un menú (como se hace para crear una carpeta). En este menú se escribirá el nombre del archivo (por defecto "nuevo archivo") y se podrá seleccionar una plantilla (por defecto "ninguna"). Estas plantillas se llamaran Esporas
>
> Debatir con la IA si el nombre "Esporas" es adecuado

> [!note] [C-I-05] Permitir configurar acciones de Mycelium mediante macros (hotkeys).
> Por ejemplo, escribir algo en la nota, crear un nuevo archivo con una plantilla, abrir un archivo, etc.
> (Esto es conveniente discutirlo con la IA)

> [!note] [C-I-06] Archivos compartidos para todo el mundo
> Permitir tener tres archivos públicos/compartidos para todo el mundo.
> Habrá una carpeta "Estado Mycelium", esta contendrá 3 archivos:
> - Ayudas Mycelium
> - Bugs Mycelium
> - Ideas y SUgerencias Mycelium
> Estos archivos solo podrán editarlos usuarios autorizados, pero podrán verlos todo el mundo.
> Deben aparecer en el apartado de Compartidos

>[!note] C-I-07 incluir archivos de estructura tabla
>Actualmente, obsidian cuenta con un tipo de archivo llamados Bases, que cumplen la función de tener una tabla o etiquetas y que permite mostrar distintos parámetros.
>Estos parámetros se escriben al inicio del markdown como cabecera.
>Estos parámetros tienen un estilo especial cuando se trabaja con markdowns. Siempre tienen esta estructura:
```yaml
---
name: data
---
```
> Como se puede observar, siempre están en formato yaml.
> Son metadatos de los archivos y actualmente Mycelium no los está manejando (debería)
> 
> Una vez funcional la estructura yaml de metadatos, este tipo de archivo (llamado bases en obsidian) debe poder detectar estos metadatos para mostrarlos en formato de tablas.
> En obsidian también se pueden mostrar como tarjetas, pero dejemposlo de lado si esto agrega demasiada complejidad a este feature y quedemonos únicamente con las tablas.
> Este tipo de archivos debe poder tener filtros para indicar que archivos incluir y cuales no (filtros por path, nombres de archivos, etiquetas, etc.), todo lo que pueda diferenciarlos.
> Se debe poder indicar que parámetros de metadatos mostrar y cuales no. Por ejemplo, si el archivo tiene el parámetro imagen y no se quiere mostrar en este archivo base, no se lo marca como parámetro a mostrar. Por defecto solo se muestra el nombre del archivo
> 
>
> __Es importante importante encontrarles un nombre especial para este tipo de archivos ya que bases es algo propio de obsidian__

## Cambios grandes

> [!note] [C-G-01] Que un usuario pueda tener varios vaults
> Que se puedan seleccionar en la ventana de opciones, en Vault

>[!note] [C-G-02] Al crear un nuevo vault (ya sea por nueva cuenta o que un usuario creó un nuevo vault) se debe crear por defecto un archivo de ejemplo

>[!note] [C-G-03] Transformar el funcionamiento de almacenamiento (en sistema desktop)
> Markdowns y archivos en general se almacenan en local. Botón para guardar en la nube. Nunca se guarda en la nube automáticamente, se guarda a conciencia.
>
> Archivos compartidos se suben automáticamente a la nube.
>Archivos compartidos se actualizan automáticamente con la nube. (Manejar datos temporales)
>
>__(Objetivo):__ Reducir tiempos de espera y mejorar velocidad de uso.
>_Reduce:_ uso del servidor, por ende, reduce costos

> [!note] 

# Implementados

## A evaluar
>[!warning] 




## Con errores

>[!error] [C-M-04] Títulos en los callouts
>Los títulos de los callouts deben tener el mismo color que el nombre de la etiqueta. Cuando no se escribe un título en el callout, se escribe el nobmre de la etiqueta con un color representativo, pero cuando se escribe el título, este color cambia a gris. Debe mantener el mismo color representativo del callout.
>_Funciona, pero si se pone en negrita, cursiva, colores, links, etc. el estilo de estos se elimina para mostralos con colores. El color de los títulos debe estar solo cuando no se aplica color con otro elemento__

## Completados
>[!success] [C-M-01] Autocompletado al escribir referencias a otros archivos

>[!success] [C-M-02] autocerrar parentesis y llaves
> Con opción en configuración para desactivar esto. Debe autocerrar cuando se pone un (), [], {}, **, __,"", ''.
>
>Cuando se tiene un texto seleccionado, no se debe reemplazar el texto sino que se agrega el símbolo de apertura al inicio del texto seleccionado y al final del texto seleccionado se agrega el símbolo de cierre.

> [!success] [C-M-03] Nombre archivo mostrado como título en pantalla de visualización (todas las visualizaciones)
> Estos títulos no estarán escritos con # para poder ser editados. Sino que es el nombre del archivo y que debe aparecer centrado en la parte superior. Aplica un estilo especial para diferenciar este título de los titulos escritos en el documento. Agrega una opción para deshabilitar el mostrar estos títulos de archivos
> _No es que esté mal, pero no es el estilo buscado y tampoco debe estar fixed, solo debe estar arriba del archivo. Estilar a mano puede ser una opción_

> [!success]  [C-M-05]
> Que el texto englobado por *texto* tenga un estilo distinto al texto engloabado por _texto_
> Si tiene *texto* estará en cursiva. Si tiene **texto** que tenga negrita y Si tiene ***texto*** cursiva y negrita
> Si tiene _texto_ estará en cursiva pero con color `--mic-glow`, si tiene __texto__ estará en negrita pero con color `--mic-accent`. Si está con ___texto___, quiero que esté en negrita sin cursiva y un gradiente entre `--mic-glow` y `--mic-accent`.
> Esto debe ser así para las vistas de lectura y edición en vivo. Es posible hacerlo? Son estilos dentro del sistema mycelium por lo que entiendo que solo será un estilo visual que se verá en este sistema y no en otras herramientas.



> [!success] [C-M-11] ajuste de intencidad de color de las conecciones de los nodos

>[!success] [C-M-07] Incluir indicatorio de dirección en enlaces del grafo
>Puede ser animación en el enlace
>Puede ser simplemente una flecha
>Añadir una opción en configuración para eliminar este indicador de dirección. Si se implementan los dos tipos de indicadores. La opción debe permitir modificar que indicador se utiliza o si se quiere quitar. Prioridad: animación en el enlace.


> [!success] [C-M-09] opción en el grafo para asignar colores a los nodos
> Poder asignar un color distinto a los nodos dependiendo del path donde se ubican o dependiendo de las etiquetas. Esta opción de configuración debe estar dentro de la pantalla del grafo
> con opción para desactivar regla indibidual

>[!success] [C-M-08] Exluir directorios y archivos en grafo de conexiones
>Una opción para indicar explícitamente que carpetas y archivos no se deben mostrar en el grafo. Esta opción debe estar dentro de la misma ventana del grafo. La idea sería indicar nombres del archivo (oculta todas las coincidencias) o indicar el path exacto (coincidencia exacta). Para las carpetas sería el path exacto
>con opción para desactivar regla indibidual

> [!success] [C-I-01] Panel de metadatos en los archivos visibles
> Este panel se debe poder mostrar u ocultar a gusto. Agregar el botón en el panel de opciones del archivo. Al lado del botón de buscar

> [!success] [C-M-12] persistencia de pestañas aviertas al salir del sistema

>[!success] [C-I-02] Construcción temporal del grafo
>Implementar un botón para que los nodos en el grafo aparezcan uno por uno en orden de creación del archivo para generar una representación visual del historial de creación de contenido


---

## Relacionadas

- [[BACKLOG]] — estas ideas consolidadas con IDs, tamaños y agrupación en releases.
- [[Bandeja de entrada]] — donde van las ideas **nuevas**, en crudo.
- [[Mapa de documentacion]] — índice general.
