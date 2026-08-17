# Bandeja de entrada

> [!important] Escribí acá sin pensar en el formato
> Este es el **único sitio** donde tenés que anotar lo que encontrás o se te ocurre. No
> hace falta ID, ni categoría, ni redacción cuidada: escribilo como te salga, aunque sea
> media frase. Yo lo tomo, lo defino bien y lo documento donde corresponde.
>
> Cuando quieras que lo procese, decímelo: **"revisá la bandeja"**.

## Cómo escribir una entrada

Separá cada entrada con una línea `---`. Nada más es obligatorio.

Dicho eso, hay dos cosas que si las ponés me ahorran preguntarte:

- **Un defecto** se define solo con tres datos: **qué hiciste**, **qué esperabas** y **qué
  pasó en cambio**. Con eso alcanza. Si sabés reproducirlo, el paso a paso vale oro.
- **Una idea** se define con **qué querés poder hacer** y **para qué**. El *cómo* lo
  decidimos después — si ya lo tenés pensado escribilo igual, pero no hace falta.

Si no sabés si es un defecto o una idea, escribilo en cualquiera de las dos: eso lo
clasifico yo.

---

## Defectos sin procesar

1. cuando abro le panel de metadatos en un markdown, este panel se habre en todas las pestañas, esto hace que sea un poco incómodo debido a que si tengo la pantalla dividida en dos o más pestañas, todas van a abrir el panel de metadatos convirtiendose en un estorbo. Estaba pensando en hacer que el panel de metadatos se mostrara únicamente en la pestaña seleccionada y no en todas, para evitar esta incomodidad sin generar demasiada complejidad.

---

2. al exportar un documento, no hay ningún feedback de que se esté descargando o de que se hubiera descargado ya. Me gustaría agregar este feedback como una card que sale desde el lado inferior derecho que indica que se está descargando, y que cuando termine la descarga esta card permanezca unos 10 o 15 segundos con la posibilidad de cerrarlo antes manualmente y que tenga un botón para abrir la carpeta donde se descargó

---

3. en el renderizado de yampl, el input de la clave e un atributo tiene un tamaño del 100% en width, esto hace que se vea como un column con respecto al ícono del tipo de dato que maneja. Estuve probando y lo ideal sería que en lugar de 100% width, tuviera un 90% de width. Con esto se resolvería el problema. La clase en cuestión es `mic-prop-clave-inpút`

---

4. En el modo de edición, muchas veces los títulos no se renderizan y quedan como texto normal. Esto se puede identificar porque se ven los "#", "##", "###", etc. Pero sin renderizarse ni marcarse realmente como título

---

5. el span que contiene el texto de una tabla (`mic-tab-render`) no tiene un width definido por lo que ocupa solo el tamaño de su contenido, si el contenido de la celda no ocupa toda la celda, entonces este span tampoco ocupa toda la celda. Esto es un poco incómodo a la hora de usarlo ya que si el usuario hace clic en una parte vacía de la celda, este no se activa para escribir. Una solución que prové es poner le width en 100%.

--- 

6. en ocaciones el renderizado de las tablas no funciona, quedan sin renderizar y toca recargar el documento, cambiar de vista y volver a la edición, o desactivar y volver a activar el renderizado. Esto es una incomodidad que vale la pena solucionar

---

7. si se tiene "plegado" un título, cuando se cambia a otra pestaña y se vuelve, este título vuelve a estar desplegado. Me gustaría que esto no sucediera, al volver a la pestaña, continuara plegado. Pero que esto sea únicamente un estado de la pestaña. Si se cierra la pestaña, al volver a abrirla todo estaría nuevamente desplegado (como funciona actualmente)
 
---

8. El botón de la barra de herramientas al abrir una pestaña de una nota, está el botón donde están las opciones de exportar. Este botón tiene el nombre de "exportar nota", sin embargo, contiene otra opción más y puede que agregue más opciones en el futuro por lo que este nombre se debe cambiar a algo más descriptivo como "más", "opciones", "otros", "más herramientas", "más opciones", etc. Algo que sea más descriptivo, no tiene por que ser alguna de las opciones que nombré yo.

---

9. el menú de autocompletado no tiene aplicado los estilos visuales de mycelium como si lo tiene aplicado por ejemplo un input (ejemplo, el input en los yaml de los frontmater)

---

10. el estilo de los inputs (como el del yaml de los frontmater) la opción marcada se ve en blanco, no estoy seguro de si se eligió ese color realmente para las opcion seleccionada o si esto es un bug. Tengo esta duda ya que el color utilizado pareciera ser el color del texto en el modo oscuro de mycelium y no es tan representativo del estilo mycelium

---

11. cuando se está viendo un archivo. Este se marca en el explorador como feedback de cual es el archivo visto, pero no se marca las carpetas y subcarpetas que los contienen. La carpeta que queda marcada es la última que seleccionó el usuario

## Ideas sin procesar

1. Ampliar la herramienta de busqueda (search). Actualmente permite buscar por contenido y muestra todos los resultados. Eso funciona bien y debería seguir funcionando bien. Pero quiero ampliar el funcionamiento de la herramienta.
Quiero que tamibén se pueda buscar por nombre de archivo (no contenido), por contenido (no nombre), y por los dos. Además, quiero agregar una funcionalidad que me gustó mucho y que está presente en VS Code y es que los resultados de la búsqueda se pueden mostrar en lista (como ya se hace) o mostrarlos con el modo de "view as tree" que ajusta todos los resultados mostrando el arbol de directorios de cada resultado, y si más de un archivo están en la misma carpeta, no se duplican la carpeta en el resultado sino que se muestran los dos archivos dentro de la carpeta, por eso es "view as tree". La forma normal de la vista es "view as list" que es la forma que funciona normalmente

---

2. en el grafo, al hacer zoom se meustran todos los nombres de los archivos. Esto no está mal, el problema es que cuando hay mucha densidad de nodos, al aparecer todos estos nombres se entorpece la visual. Me gustaría tener una opción para ocultar todos los nombres y que solamente se muestre el nombre del nodo al cual se apunta con el puntero del ratón y los nodos relacionados. Esta opción se debe poder configurar en las opciones del grafo.
Quiero tres opciones, mostrar todos los nombres, mostrar nombres del nodo apuntado y nodos relacionados, mostrar nombre solo del nodo apuntado. Esta configuración debe persistir por vault

---


---

## Qué hago yo al procesarla

| Lo que escribiste | Qué hago | Dónde queda |
|---|---|---|
| Un defecto | Le asigno el `DEF-NNN` libre siguiente y escribo **qué sucede** —el síntoma, sin lenguaje de solución— | [[Bugs_errores_y_defectos]], y su estado en [[bugs-progreso]] |
| Una idea | La clasifico por esfuerzo (`FUN-S/M/L/XL`), le doy nombre e ID, y la ubico en la agrupación en releases | [[BACKLOG]] |
| Una idea que no es trivial | Además escribo la especificación de comportamiento con criterios de aceptación | `docs/features/<slug>.md` |

Después **muevo la entrada** de acá a la tabla de abajo. Así, lo que sigue en las dos
secciones de arriba es siempre lo que está **sin procesar**: no tenés que marcar nada.

Si algo de lo que escribís ya existe documentado, no lo duplico: amplío lo que hay y te
lo digo.

## Procesado

| Fecha | Lo que escribiste | Quedó como |
|---|---|---|
| 2026-08-03 | El progreso del indexado sale en el botón de **todos** los vaults, no solo el que abrís; falta una pantalla de carga descriptiva | `DEF-042` en [[Bugs_errores_y_defectos]] · bloque **A** de la agrupación |
| 2026-08-03 | Ver PDF, código y texto plano: hoy ni aparecen en el explorador | `FUN-L-11` `FILES-OTROS-TIPOS` · bloque **J** |
| 2026-08-03 | Colorear el código según el lenguaje al visualizarlo | `FUN-S-09` `CODE-RESALTADO-SINTAXIS` · bloque **J** (depende de `FUN-L-11`) |
| 2026-08-03 | Corrector ortográfico activable, con varios idiomas a la vez | `FUN-L-12` `EDITOR-CORRECTOR-ORTOGRAFICO` · bloque **K** |
| 2026-08-03 | La interfaz en español, inglés e italiano, ampliable | `FUN-L-13` `UI-IDIOMAS` · bloque **K** |
| 2026-08-03 | El ícono de las Esporas es un brote de planta, poco representativo | `DEF-043` · **ya corregido**: `Sprout` → `CircleDot`, dentro de [[Version 1.3.0]] |
| 2026-08-03 | Que Mycelium avise de versiones nuevas y se actualice solo, sin obligar | `FUN-L-14` + `FUN-L-15` · bloque **L** · spec en [[autoactualizacion]] |
| 2026-08-03 | Al cambiar de vault siguen abiertas las pestañas del anterior | `DEF-044` · bloque **F** |
| 2026-08-03 | Varios vaults abiertos a la vez, cada uno en su ventana | `FUN-L-16` `VAULT-VENTANAS-MULTIPLES` · bloque **F** |
| 2026-08-03 | ¿Se pueden poner referencias en un Excalidraw? → mejor un canvas como el de Obsidian | `FUN-L-18` `FILES-CANVAS` · spec en [[canvas]] |

> [!note] Esta tabla se puede vaciar cuando moleste
> Es una comodidad para que veas en qué terminó cada cosa, no un registro canónico. La
> trazabilidad real vive en [[Bugs_errores_y_defectos]], [[BACKLOG]] y el historial de
> commits.

## Relacionadas

- [[Bugs_errores_y_defectos]] — el catálogo de defectos ya definidos.
- [[BACKLOG]] — el inventario de funcionalidades con IDs, tamaños y agrupación en releases.
- [[Ideas Mycelium]] — el documento donde anotabas ideas antes que esta bandeja.
- [[Mapa de documentacion]] — índice general.
