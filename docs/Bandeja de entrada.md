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

*(vacío)*

## Ideas sin procesar

*(vacío)*

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
| 2026-08-17 | El panel de metadatos se abre en todas las pestañas | `DEF-060` |
| 2026-08-17 | Al exportar no hay feedback de que se esté descargando | `FUN-M-22` `EXPORT-FEEDBACK-DESCARGA` — **reclasificada**: es UI nueva, no un arreglo |
| 2026-08-17 | El input de la clave al 100 % empuja el ícono del tipo abajo | `DEF-061` (con tu prueba del 90 % anotada) |
| 2026-08-17 | En edición, a veces los títulos no se renderizan | `DEF-062` |
| 2026-08-17 | El span de la celda no ocupa la celda: el clic en el hueco no edita | `DEF-063` (con tu prueba del 100 % anotada) |
| 2026-08-17 | A veces las tablas no se renderizan hasta forzar un repintado | `DEF-064` |
| 2026-08-17 | El plegado de un título se pierde al cambiar de pestaña | `DEF-065` |
| 2026-08-17 | «Exportar nota» ya no describe lo que hace ese menú | `DEF-066` |
| 2026-08-17 | El menú de autocompletado no lleva los estilos de Mycelium | `DEF-067` |
| 2026-08-17 | La opción marcada de un campo se ve en blanco | `DEF-068` |
| 2026-08-17 | El explorador no marca las carpetas que contienen el archivo abierto | `DEF-069` |
| 2026-08-17 | Buscar por nombre, por contenido o por los dos, y ver los resultados como árbol | `FUN-M-20` `SEARCH-MODOS-Y-ARBOL` |
| 2026-08-17 | Tres modos para los nombres del grafo, persistentes por vault | `FUN-M-21` `GRAPH-NOMBRES-SEGUN-FOCO` |
| 2026-08-17 | El ícono del tipo de documento en cada pestaña | `FUN-S-11` `TABS-ICONO-TIPO` |
| 2026-08-17 | Colores por consola, reflejados en su pestaña y atenuados sin foco | `FUN-S-12` `TERMINAL-COLOR-POR-CONSOLA` |
| 2026-08-18 | El tipo de un atributo del YAML no se puede cambiar sin borrarlo | `DEF-070` |
| 2026-08-18 | Un wikilink en una propiedad no enlaza dentro de una base | `DEF-071` |
| 2026-08-18 | La rueda sobre las flechas de historial debería abrir en pestaña nueva | `FUN-S-13` `TABS-HISTORIAL-RUEDA` — **reclasificada**: no falla nada, es un gesto nuevo |
| 2026-08-18 | La numeración de las consolas no se reutiliza y puede repetirse | `DEF-072` |
| 2026-08-18 | Zoom y desplazamiento en los Mermaid, con dibujo efímero y puntero láser | `FUN-M-23` `MERMAID-VISOR` |
| 2026-08-18 | Buscador dentro de las tablas, por coincidencia o exacto | `FUN-S-14` `BASES-BUSCADOR` |
| 2026-08-18 | Ordenar las tablas por cualquiera de los campos mostrados | `FUN-S-15` `BASES-ORDENAR` |
| 2026-08-18 | Ajustar el ancho de las columnas de las tablas | `FUN-M-25` `BASES-ANCHO-COLUMNAS` |
| 2026-09-03 | Lo que va entre guiones bajos no se renderiza con su estilo propio | `DEF-074` (queda por acotar en qué vista) |
| 2026-09-03 | En lectura, los títulos plegados se vuelven a desplegar solos | `DEF-075` |
| 2026-09-04 | En la terminal no se copia ni pega con Ctrl+C/Ctrl+V, y el botón derecho pega dos veces | `DEF-079` |
| 2026-09-04 | Los filtros de las `.base` necesitan lógica: negar, `o`, agrupar | `FUN-M-27` `BASES-FILTROS-LOGICOS` — **es funcionalidad**: el motor ya sabe `and`/`or`/`not`, lo que falta es la interfaz |
| 2026-09-04 | Una condición de filtro sin valor se borra sola | `DEF-080` (causa localizada: `filtroDeCondiciones` descarta las de valor vacío) |
| 2026-09-04 | Falta el globo con el nombre completo al pasar el puntero por el explorador | `DEF-081` |
| 2026-09-04 | La consola dibuja el texto corrupto: símbolos y texto repetido donde no va | `DEF-083` (probablemente emparentado con el `DEF-079`) |
| 2026-09-04 | Números de línea en los markdown, apagados por defecto y por vault | `FUN-M-28` `EDITOR-NUMEROS-DE-LINEA` — es M por el «por vault»: hoy las preferencias son por USUARIO |
| 2026-09-04 | El desplegable de campos del filtro necesita buscador | `FUN-S-16` `BASES-FILTRO-BUSCADOR` · bloque **O**, con el resto del constructor |

> [!note] Esta tabla se puede vaciar cuando moleste
> Es una comodidad para que veas en qué terminó cada cosa, no un registro canónico. La
> trazabilidad real vive en [[Bugs_errores_y_defectos]], [[BACKLOG]] y el historial de
> commits.

## Relacionadas

- [[Bugs_errores_y_defectos]] — el catálogo de defectos ya definidos.
- [[BACKLOG]] — el inventario de funcionalidades con IDs, tamaños y agrupación en releases.
- [[Ideas Mycelium]] — el documento donde anotabas ideas antes que esta bandeja.
- [[Mapa de documentacion]] — índice general.
