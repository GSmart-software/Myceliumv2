# Versión 1.7.0

**Desktop** (`desktop-tauri`) · 2026-09-05 · sobre [[Version 1.6.2]]
**Web** (`web-cloud`) sale a la vez como **1.3.0**, con la parte que le aplica.

Trece funcionalidades elegidas por el usuario y trabajadas en una sola tanda, más
las correcciones que vinieron con ellas.

> [!important] Un release, UN incremento
> Trece funcionalidades suman **un** minor, no trece: el tamaño del salto lo decide
> el cambio más significativo, nunca cuántos entran. Y absorbe las correcciones
> —`DEF-080`, `DEF-081`, `DEF-084`—, así que no hay patch aparte. Ver
> [[Versionado del sistema]].

> [!important] Las dos líneas no comparten numeración
> Desktop va por `1.7.0` y web por `1.3.0`. Cada una cuenta lo suyo desde que se
> separaron en la 1.1.0; ver [[Diferencias funcionales aceptadas entre versiones]].

## Qué entra

| Qué | ID | Dónde |
|---|---|---|
| Negar y agrupar condiciones en los filtros de una tabla | `FUN-M-27` | ambas · [[bases-tabla]] |
| Buscador en el desplegable de campos del filtro | `FUN-S-16` | ambas · [[bases-tabla]] |
| Ordenar una tabla por cualquier columna | `FUN-S-15` | ambas · [[bases-tabla]] |
| Buscar dentro de una tabla | `FUN-S-14` | ambas · [[bases-tabla]] |
| Ancho de columna ajustable | `FUN-M-25` | ambas · [[bases-tabla]] |
| Números de línea en el editor, por vault | `FUN-M-28` | ambas · [[numeros-de-linea]] |
| Tres modos para los nombres del grafo, por vault | `FUN-M-21` | ambas · [[preferencias-por-vault]] |
| El almacén de preferencias del vault, y su porte a web | `FUN-M-29` | ambas · [[preferencias-por-vault]] |
| Ícono del tipo de documento en cada pestaña | `FUN-S-11` | ambas · [[marcas-en-las-pestanas]] |
| Un color por consola, en su pestaña | `FUN-S-12` | desktop · [[marcas-en-las-pestanas]] |
| Resaltado de sintaxis en los archivos de código | `FUN-S-09` | desktop · [[otros-tipos-de-archivo]] |
| Elegir dónde busca el panel del vault, y ver los resultados por carpeta | `FUN-M-20` | ambas · [[busqueda-modos-y-arbol]] |
| Guías verticales de indentación en el explorador | `FUN-S-17` | ambas · [[busqueda-modos-y-arbol]] |
| El título de la nota renombra el archivo | `FUN-M-24` | ambas · [[titulo-renombra]] |

Correcciones: `DEF-080` (una condición a medias se borraba sola), `DEF-081` (el
explorador no mostraba el nombre completo) y `DEF-084` (renombrar reescribía los
`[[enlaces]]` con un nombre que nunca existió). Detalle en [[bugs-progreso]].

## Lo que este release deja aprendido

Tres cosas que no se ven en la lista y valen más que varias de sus filas:

- **Las preferencias del vault existen** ([[preferencias-por-vault]]). Hasta ahora
  todo ajuste era del usuario. `FUN-M-28` y `FUN-M-21` decían «persiste por vault»
  y eso simplemente no existía; se construyó el almacén y las dos fueron encima.
  Después `FUN-M-25` lo heredó sin trabajo, y su consumo forzó portarlo a web
  (`FUN-M-29`) para no volver divergente a `BaseView.tsx`.
- **La sangría de un árbol tiene que darla el anidamiento**, no un `padding` por
  nivel. Salió del árbol de resultados de `FUN-M-20` y de ahí nació `FUN-S-17`, que
  se sumó a la tanda sobre la marcha. Con padding se ve igual, pero no hay ningún
  elemento que abarque la rama del que colgar la guía.
- **`opacity` no atenúa: compone el subárbol entero**, y de eso no escapa ni un
  `position: fixed`. Costó un desplegable translúcido en `FUN-S-16` y quedó como
  regla en [[DESIGN_SYSTEM]].

## El framework de IA sube a 1.5.0

`FRAMEWORK_IA_VERSION` se versiona aparte, y arrastraba una deuda desde la 1.6.0:
los templates describían un vault que ya no existía —solo notas, diagramas y
Esporas—. Ahora la IA sabe que puede crear y editar `.base` y `.canvas`, con la
sintaxis de los dos, y —lo que más importa para recuperar— que **Mycelium indexa
`.md` y nada más**: un `grep` encuentra igual un `.py`, así que citarlo con un
`[[enlace]]` no resolvería.

Corrige además la regla que decía que renombrar rompe los enlaces. Ya no es
cierto… salvo para la IA, que renombra con `mv` desde la terminal y ahí no se
dispara nada. La regla pasa a decir esa diferencia.

Quien ya tenga el framework instalado lo actualiza desde **Configuración → Vault**.

<!-- notas-release:inicio -->
## Las tablas dejan de ser de mirar y pasan a ser de trabajar

- **Filtros de verdad.** Ahora podés **negar** una condición («los que NO empiezan
  por X») y **agrupar** varias («A y (B o C)»). Los grupos se anidan, y cada uno
  decide si se cumplen todas sus condiciones o alguna.
- **Encontrar el campo.** El desplegable que elige por qué propiedad filtrar tiene
  buscador: escribís y la lista se acorta.
- **Ordenar por una columna.** Un clic en su cabecera: ascendente, descendente, y
  otra vez para volver al orden original. Con <kbd>Shift</kbd> ordenás por varias a
  la vez.
- **Buscar dentro de la tabla**, sin tocar los filtros, con coincidencia parcial o
  exacta.
- **Ancho de columna.** Arrastrá el borde de una cabecera. Se guarda para ese vault.

Y una condición a medio escribir **ya no se borra sola**: se queda a la vista,
marcada, mientras la terminás.

## Ajustes que pertenecen al vault, no a vos

Algunas cosas no son una preferencia tuya sino de **este** vault, y ahora se
guardan con él:

- **Números de línea** al costado del editor, apagados por defecto, en
  Configuración.
- **Los nombres del grafo**: todos, solo el nodo que apuntás y sus vecinos, o solo
  el apuntado. Con muchos nodos, todos los nombres a la vez estorban.
- **El ancho de las columnas** de cada tabla.

En el escritorio viajan **dentro de la carpeta del vault**: copiarla a otra máquina
se lleva también sus ajustes.

## Saber qué estás mirando

- **Cada pestaña lleva el ícono de lo que contiene**: nota, dibujo, lienzo, tabla,
  consola o un archivo que Mycelium no indexa. Se puede apagar en Configuración.
- **Cada consola puede tener su color**, que se ve en su pestaña y se atenúa cuando
  no es la que estás mirando. Con tres consolas abiertas, se distinguen de un
  vistazo.
- **El código se ve coloreado** al abrirlo: palabras clave, cadenas, tipos y
  comentarios, según el lenguaje. Los mismos colores que dentro de una nota.

## Buscar en el vault

- **Elegí dónde busca**: en el nombre del archivo, en su contenido, o en los dos.
- **Los resultados se pueden agrupar por carpeta**, con la cuenta de cada una.
- **Líneas de indentación** en el explorador y en esos resultados: se ve de un
  vistazo hasta dónde llega el contenido de cada carpeta.

## Renombrar sin salir de la nota

Hacé clic en el **título** que está arriba del documento y escribí: eso renombra el
archivo. <kbd>Enter</kbd> confirma, <kbd>Esc</kbd> o salir del campo descartan.

Si el nombre no sirve —lleva caracteres que un archivo no admite, o ya lo usa otra
nota de la misma carpeta— **te lo dice y no lo cambia**, en vez de corregirlo por su
cuenta.

Los `[[enlaces]]` que apuntaban a esa nota se reparan solos, como al renombrar desde
el explorador. Esta versión corrige además un caso en el que se reparaban mal.

## Y algunos detalles

- El explorador muestra el nombre completo al dejar el puntero encima, cuando no
  entra.
<!-- notas-release:fin -->

## Relacionadas

- [[Versionado del sistema]] — por qué trece funcionalidades son un solo minor.
- [[BACKLOG]] — la tanda completa y qué quedó fuera.
- [[bugs-progreso]] — las correcciones que entran.
- [[Estado del proyecto]] — dónde está todo hoy.
- [[Generar instaladores desktop]] · [[Publicar una version]] — lo que falta para
  que esto llegue a alguien.
- [[Mapa de documentacion]] — índice general.
