# Versión 1.6.2

**Solo desktop** (`desktop-tauri`) · 2026-08-16 · sobre [[Version 1.6.1]]

Las dos mitades de [[edicion-en-el-render]] —`FUN-M-19` (propiedades) y `FUN-L-19`
(tablas)— y la corrección global de los desplegables en modo oscuro.

> [!important] Es un **patch**, y lo decidió el usuario
> Por [[Versionado del sistema]] esto parecía minor: aparecen operaciones que antes no
> existían (agregar una propiedad, insertar una columna) sin salir del editor. El usuario lo
> clasificó como **ajuste de algo que ya existía**: editar tablas y propiedades ya se podía
> —el bloque se abría en crudo—, y lo que cambia es que ya no hace falta abrirlo.
>
> Queda anotado para que dentro de un tiempo no parezca un descuido. Es la segunda vez que
> el dígito lo elige el usuario en vez de la regla; la primera fue la [[Version 1.6.1]].

> [!important] Este release entrega también la 1.6.0 y la 1.6.1
> Ninguna de las dos se publicó nunca, así que **nadie las tiene**: quien actualice salta de
> la 1.5.0 a esta. Por eso el changelog de acá abajo cubre las tres, y no solo lo que se hizo
> en la 1.6.2 — si no, el usuario recibiría las bases, los canvas y las ventanas múltiples
> sin que nada se lo contara.
>
> **No se renumeró nada**: el salto `1.5.0` → `1.6.2` ya dice lo correcto —un minor por las
> funcionalidades nuevas, más los parches— y renumerar reescribiría cuatro notas y el rastro
> de commits sin que ningún usuario notara la diferencia. Ver [[Version 1.6.0]] y
> [[Version 1.6.1]] para el detalle de cada una.

## Qué entra

| Qué | ID |
|---|---|
| Las propiedades se editan renderizadas, sin abrir el YAML | `FUN-M-19` · [[edicion-en-el-render]] |
| Las tablas se editan renderizadas, filas y columnas incluidas | `FUN-L-19` · [[edicion-en-el-render]] |
| La lista desplegada de los `<select>` deja de salir en blanco en modo oscuro | — |
| El separador NUL de las claves compuestas vuelve a su sitio, escrito como escape | — |

<!-- notas-release:inicio -->
> Esta actualización trae de una vez todo lo que se hizo desde la 1.5.0: las versiones
> 1.6.0 y 1.6.1 nunca llegaron a publicarse.

## Tu vault, de tres maneras nuevas

- **Tablas.** Un archivo de tipo *base* reúne tus notas por sus propiedades y las muestra
  en una tabla, con filtros y columnas que elegís vos. Sirve para índices, catálogos y
  seguimientos, sin salir de Markdown.
- **Lienzos.** Un *canvas* te deja poner notas y textos en el espacio y unirlos con
  flechas. Las tarjetas pueden ser una nota de verdad —se ve su contenido en vivo— y los
  enlaces que escribas dentro funcionan y navegan. También podés pintarlas.
- **Adoptar un proyecto que ya tenías.** Si abriste Mycelium sobre documentos que se
  referencian entre sí «a mano» y el grafo se veía vacío, hay una pantalla que los
  encuentra y los convierte en enlaces de verdad. Audita sin tocar nada, y al convertir
  deja respaldo y permite deshacer.

Los dos tipos de archivo usan el mismo formato que Obsidian, así que se abren allá y al
revés.

## Varios vaults a la vez

- **Una ventana por vault.** Desde el selector, «Abrir en una ventana nueva» te deja
  consultar dos vaults en paralelo — trabajo y personal, o uno de referencia mientras
  escribís en otro. Cada ventana lleva sus pestañas, su grafo y sus consolas.
- Un mismo vault no se abre dos veces: si ya está abierto, se levanta su ventana.

## El editor deja de esconder lo que estás editando

- **Las tablas ya no desaparecen al escribir en ellas.** Poné el cursor en una celda y la
  tabla sigue ahí: solo esa celda pasa a texto. Los tiradores del borde insertan, eliminan y
  mueven filas y columnas, y cambian la alineación de una columna — todo sin ver un `|`.
- **Las propiedades tampoco.** El bloque de arriba de la nota se edita como lo que es: una
  casilla se marca, una fecha se elige, una lista se arma con pastillas. Se pueden **agregar
  y quitar propiedades** ahí mismo, y en una nota que no tiene ninguna, crear la primera.
- Los dos bloques conservan un **«Editar como texto»** para cuando haga falta el markdown
  crudo.

## Abrir un vault, más rápido y con menos misterio

- Al abrir un vault ahora hay una **pantalla de carga** que dice en qué está trabajando, cómo
  va y si algo se atascó — en vez de escribir el progreso en todos los botones a la vez.
- **Es bastante más rápido**: se dejaron de recorrer las carpetas que `.mycignore` ignora.
- Cada vault **recuerda sus propias pestañas**; ya no aparecen las del anterior.
- El **grafo se actualiza** también cuando el archivo lo crea algo de fuera de Mycelium.

## Y un montón de cosas que molestaban

- Lo que mandás a la papelera **vuelve a poder recuperarse**, y al borrarlo del todo va a la
  papelera del sistema.
- Vuelve a **preguntarse antes de borrar** una carpeta o una plantilla.
- El **ancho de tabulación** se nota en los documentos que ya tenías escritos.
- Al cambiar entre edición y lectura **no se pierde el sitio**: seguís donde estabas.
- El **buscador** (`Ctrl+F`) centra la coincidencia en vez de dejarla fuera de la pantalla, y
  ahora también funciona en la vista de lectura.
- Y con el buscador abierto, **el documento ya no salta**: moverse con las flechas o
  seleccionar dejaba el cursor fuera de la pantalla, por encima del borde. Era un defecto
  viejo, de los que se notan todos los días.
- Al volver de lectura a edición **se puede escribir directamente**, sin tener que hacer clic
  en el texto primero.
- Los **desplegables en modo oscuro** ya no abren una lista blanca ilegible.
- El menú del clic derecho y las opciones del grafo **ya no se salen de la pantalla**.
- El contenido deja un poco de aire abajo, en vez de morir pegado al borde.
<!-- notas-release:fin -->

## Cómo comprobarlo en la app

Los pasos están en [[edicion-en-el-render]] § 7. El que no hay que saltarse es el último:
una nota larga con **varias tablas**, bajar hasta el final y comprobar que el clic cae donde
se hace y que el gutter sigue alineado. Es el síntoma de `DEF-031`/`DEF-037`, que nacieron en
este mismo widget.

Dos comportamientos que sorprenden si no se los espera, y son intencionales:

- **Una tabla que estás tecleando se queda en crudo** hasta que sacás el cursor. Sin eso, al
  cerrar la fila de guiones el bloque se volvería widget con el cursor adentro y la tecla
  siguiente caería fuera de la tabla.
- **`Ctrl+Z` con el foco dentro de un campo del widget** aplica el deshacer del campo, no el
  del documento. Hay que hacer clic en el documento primero.

## Lo que sigue pendiente

- **El reflejo a `web-cloud`** de las dos mitades, que se hace junto porque comparten
  archivos. Web sigue en `1.0.0`.
- **Publicar.** Ni la 1.6.0, ni la 1.6.1, ni esta se subieron a R2: quien se actualice sigue
  recibiendo la 1.5.0, que borra sin preguntar (`DEF-051`).
- El **framework de IA** sigue en `1.4.0` y no conoce nada de esto.
- `FUN-M-16` (modo avanzado del updater) sigue sin probarse.

## Relacionadas

- [[Version 1.6.1]] — la versión anterior.
- [[edicion-en-el-render]] — la spec de las dos mitades.
- [[CodeMirror y la vista en vivo]] — las seis reglas del widget interactivo, que salieron de acá.
- [[DESIGN_SYSTEM]] — la regla de los desplegables y `color-scheme`.
- [[Versionado del sistema]] — la regla que acá se dejó de lado a propósito.
- [[Mapa de documentacion]] — índice general.
