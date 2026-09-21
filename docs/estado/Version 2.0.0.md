# Versión 2.0.0

**Solo desktop** (`desktop-tauri`) · 2026-09-21 · sobre [[Version 1.7.0]]

El **rediseño de la interfaz** hecho en el experimento de impeccable, integrado a
`desktop-tauri` el 2026-09-21 ([[Rediseñar la UI con impeccable]]), más todo lo que traía
la 1.7.0 —que nunca llegó a publicarse— y las correcciones de después.

Entran: el rediseño (`FUN-M-30` atmósferas, `FUN-M-31` marco de ventana, `FUN-M-32`
configuración, `FUN-M-33` avisos y deshacer, `FUN-M-34` y `FUN-M-35` ajustes), la tanda
de la [[Version 1.7.0]] (trece funcionalidades), y las correcciones `DEF-084` a `DEF-088`,
`DEF-090` a `DEF-098`.

> [!important] Este release entrega también la 1.7.0
> La 1.7.0 se numeró pero **nunca se publicó**, así que nadie la tiene: quien actualice salta
> de la 1.6.2 a esta. Por eso el changelog de abajo cubre las dos. Es el mismo caso que la
> [[Version 1.6.2]], que entregó la 1.6.0 y la 1.6.1.

> [!warning] `DEF-089` NO entra
> Un `[[enlace]]` dentro de código en línea se sigue decorando como enlace en la edición en
> vivo. Está registrado y pendiente; el changelog no lo menciona.

## Por qué sube este dígito

**Major, por decisión del usuario.** La regla de [[Versionado del sistema]] reserva el major
para una rearquitectura, y por dentro esto no lo es: los datos, el vault y los formatos son
los mismos.

Lo que lo justifica es lo que ve quien actualiza. Cambia **toda la interfaz a la vez**: la
ventana deja la barra de Windows y trae su propio marco, la configuración se muda de un
panel lateral a una ventana con categorías, la barra superior pasa a ser una paleta, y el
aspecto por defecto cambia —la atmósfera nueva se aplica sola—. Quien abra la 2.0.0 no va a
encontrar las cosas donde estaban. Eso es un cambio de hábitos que rompe, aunque no rompa
ningún archivo, y es el sentido en que un usuario lee un «2».

Queda anotado para que no parezca un descuido ni siente precedente: el criterio de siempre
sigue siendo el de [[Versionado del sistema]]. Es la tercera vez que el dígito lo elige el
usuario en vez de la regla, después de la [[Version 1.6.1]] y la [[Version 1.6.2]].

<!-- notas-release:inicio -->
## Mycelium, rediseñado

Esta actualización trae de una vez todo lo que se hizo desde la 1.6.2: la versión 1.7.0
nunca llegó a publicarse.

### Una interfaz nueva

- **La ventana es de Mycelium.** Deja la barra de título de Windows: minimizar, maximizar y
  cerrar pasan a la barra superior, y el menú para anclar la ventana a un lado de la
  pantalla sigue ahí, al pasar el puntero por el botón de maximizar.
- **La barra superior es una paleta.** Escribí para ir a cualquier nota, o empezá con `>`
  para buscar un comando. Si la nota no existe, te ofrece crearla. Abre con tus notas
  **recientes**. `Ctrl+O` para notas, `Ctrl+P` para comandos, `Ctrl+Tab` para moverte entre
  pestañas.
- **Atmósferas.** Un tercer ajuste de estilo, al lado del tema y del modo: decide cómo se
  reparten los colores. Hay cuatro —Abisal, Niebla, Bosque y Papel— y cada modo recuerda la
  suya. Al actualizar vas a ver **Niebla** en oscuro y **Bosque** en claro; la de siempre es
  **Abisal**, en Configuración → Apariencia.
- **Configuración en una ventana propia**, con categorías y un buscador que entiende lo que
  querés decir aunque no uses el nombre exacto del ajuste. Lo que escribiste ya no se pierde
  al cambiar de sección.
- **Borrar tiene vuelta atrás.** Una nota borrada va a la papelera con un aviso y un botón
  para deshacer, y las confirmaciones las pregunta Mycelium, con el botón que dice
  exactamente qué va a pasar.
- **Toda la interfaz se usa con teclado**, y respeta la opción de reducir el movimiento de
  Windows.

### Tablas que se trabajan

- **Filtros de verdad**: negar una condición y agrupar varias («A y (B o C)»).
- **Ordenar** por cualquier columna con un clic en su cabecera, **buscar** dentro de la tabla
  y **ajustar el ancho** de las columnas arrastrando el borde.
- La tabla **se actualiza sola** cuando cambian las notas que muestra, las cambies vos, una
  IA o la consola. Y al volver a su pestaña sigue en la vista y el lugar donde la dejaste.

### Buscar, renombrar y ubicarte

- **Elegí dónde busca** el panel de búsqueda: en el nombre, en el contenido o en los dos, y
  agrupá los resultados por carpeta.
- **Renombrá una nota escribiendo en su título**, arriba del documento. Si el nombre no sirve,
  te dice por qué en vez de cambiarlo por su cuenta, y los enlaces que apuntaban a ella se
  reparan solos.
- **Líneas de indentación** en el explorador, que muestran hasta dónde llega cada carpeta.
- **Cada pestaña lleva el ícono de lo que contiene**, y cada consola puede tener su color.
- **El código se ve coloreado** al abrir un archivo de código del vault.
- **Números de línea** en el editor y otros ajustes que ahora son **de cada vault**, y viajan
  con él si copiás la carpeta.

### Correcciones

- En una nota con propiedades, **los títulos vuelven a verse con formato** en la edición en
  vivo.
- **La consola ya no desfasa el texto** cuando aparecen emojis como ✅, ⚠️ o 🟡.
- Renombrar con un carácter que un archivo no admite **ya no rompe los enlaces** que
  apuntaban a la nota.
- La vista de lectura **limita el ancho del texto** para que los renglones no se estiren a
  toda la pantalla, y el código y los enlaces **se leen bien en los temas claros**.
- Plegar un título ya no hace desaparecer su flecha.
<!-- notas-release:fin -->

## Cómo comprobarlo en la app

- **Al abrir**: la ventana no tiene la barra de Windows y el ícono en la barra de tareas es
  el de Mycelium. Pasar el puntero por maximizar abre el menú de anclaje.
- **El aspecto cambió solo**: Niebla en oscuro, Bosque en claro. Configuración → Apariencia
  deja volver a Abisal.
- **Configuración** abre centrada, con cuatro categorías y buscador.
- **La paleta**: `Ctrl+O`, escribir un nombre que no existe, y que ofrezca crearlo.
- **Una tabla `.base`**: ordenar, buscar, cambiar un ancho; cambiar de pestaña y volver.
- **La consola**: una línea con ✅ ⚠️ 🟡 seguida de texto, sin desfase.
- **Actualizar desde la 1.6.2**: el diálogo tiene que mostrar este changelog entero.

## Relacionadas

- [[Version 1.7.0]] — la versión anterior, que nunca se publicó y entra acá.
- [[Rediseñar la UI con impeccable]] — el experimento que da forma a esta versión.
- [[Versionado del sistema]] — el criterio del número, y por qué acá se apartó de él.
- [[Publicar una version]] — cómo se publica.
- [[bugs-progreso]] — las correcciones que entran.
- [[BACKLOG]] — el inventario.
- [[Mapa de documentacion]] — índice general.
