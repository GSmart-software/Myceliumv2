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

## Qué entra

| Qué | ID |
|---|---|
| Las propiedades se editan renderizadas, sin abrir el YAML | `FUN-M-19` · [[edicion-en-el-render]] |
| Las tablas se editan renderizadas, filas y columnas incluidas | `FUN-L-19` · [[edicion-en-el-render]] |
| La lista desplegada de los `<select>` deja de salir en blanco en modo oscuro | — |
| El separador NUL de las claves compuestas vuelve a su sitio, escrito como escape | — |

<!-- notas-release:inicio -->
## El editor deja de esconder lo que estás editando

- **Las tablas ya no desaparecen al escribir en ellas.** Poné el cursor en una celda y la
  tabla sigue ahí: solo esa celda pasa a texto. Los tiradores del borde insertan, eliminan y
  mueven filas y columnas, y cambian la alineación de una columna — todo sin ver un `|`.
- **Las propiedades tampoco.** El bloque de arriba de la nota se edita como lo que es: una
  casilla se marca, una fecha se elige, una lista se arma con pastillas. Se pueden **agregar
  y quitar propiedades** ahí mismo, y en una nota que no tiene ninguna, crear la primera.
- Los dos bloques conservan un **«Editar como texto»** para cuando haga falta el markdown
  crudo: una tabla mal formada, un pegado raro, un YAML que Mycelium no interpreta.

## Y dos cosas que se veían mal

- Los **desplegables en modo oscuro** ya no abren una lista blanca ilegible. Pasaba en todos
  los de la app, y de paso se arregló el calendario de los campos de fecha.
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
