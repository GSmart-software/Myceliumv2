# Versión 2.0.0

**Solo desktop** (`desktop-tauri`) · 2026-09-21 · sobre [[Version 1.7.0]]

> [!success] Publicada el 2026-09-21 a las 13:57 (UTC)
> Con `npm run publicar`, reutilizando los instaladores del ensayo. Verificado: los tres
> manifiestos responden y parsean, la firma de los dos `latest.json` es idéntica al `.sig`,
> y el `.exe` descargado del bucket tiene el mismo SHA-256 que el firmado
> (`4214906a05307090…`). `versions.json` quedó con 2.0.0, 1.7.0, 1.6.2, 1.5.0 y 1.4.0.

El **rediseño de la interfaz** hecho en el experimento de impeccable, integrado a
`desktop-tauri` el 2026-09-21 ([[Rediseñar la UI con impeccable]]), más las correcciones
que llegaron después de la 1.7.0.

Entran: el rediseño (`FUN-M-30` atmósferas, `FUN-M-31` marco de ventana, `FUN-M-32`
configuración, `FUN-M-33` avisos y deshacer, `FUN-M-34` y `FUN-M-35` ajustes) y las
correcciones `DEF-085` a `DEF-088` y `DEF-090` a `DEF-098`.

> [!warning] `DEF-089` NO entra
> Un `[[enlace]]` dentro de código en línea se sigue decorando como enlace en la edición en
> vivo. Está registrado y pendiente; el changelog no lo menciona.

> [!info] La 1.7.0 SÍ se publicó (2026-09-06), y el changelog parte de ella
> Al preparar esta versión se dio por hecho que la 1.7.0 no se había publicado, y se
> escribió un changelog que la repetía entera. El ensayo de `npm run publicar` lo destapó:
> el `versions.json` del bucket ya tenía la 1.7.0, y su `latest.json` la servía desde el
> 2026-09-06 a las 03:28. Se corrigió **antes** de publicar. Quien actualice desde la 1.6.2
> se salta el changelog de la 1.7.0, como con cualquier app que se actualiza tarde.

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

### Las tablas, más cómodas

- Al volver a la pestaña de una tabla, **sigue en la vista y en el lugar donde la dejaste**,
  sin volver a cargar.
- La tabla **se actualiza sola** cuando cambian las notas que muestra, las cambies vos, una
  IA o la consola.

### Correcciones

- En una nota con propiedades, **los títulos vuelven a verse con formato** en la edición en
  vivo.
- **La consola ya no desfasa el texto** cuando aparecen emojis como ✅, ⚠️ o 🟡.
- La vista de lectura **limita el ancho del texto** para que los renglones no se estiren a
  toda la pantalla, y el código y los enlaces **se leen bien en los temas claros**.
- Plegar un título ya no hace desaparecer su flecha.
- La ventana se llama por el nombre del vault, no por su ruta completa.
<!-- notas-release:fin -->

## Cómo comprobarlo en la app

- **Al abrir**: la ventana no tiene la barra de Windows y el ícono en la barra de tareas es
  el de Mycelium. Pasar el puntero por maximizar abre el menú de anclaje.
- **El aspecto cambió solo**: Niebla en oscuro, Bosque en claro. Configuración → Apariencia
  deja volver a Abisal.
- **Configuración** abre centrada, con cuatro categorías y buscador.
- **La paleta**: `Ctrl+O`, escribir un nombre que no existe, y que ofrezca crearlo.
- **Una tabla `.base`**: cambiar de pestaña y volver; cambiar una propiedad desde otro panel.
- **La consola**: una línea con ✅ ⚠️ 🟡 seguida de texto, sin desfase.
- **Actualizar desde la 1.7.0**: el diálogo muestra este changelog, y nada de la 1.7.0.

## Relacionadas

- [[Version 1.7.0]] — la versión anterior, publicada el 2026-09-06.
- [[Rediseñar la UI con impeccable]] — el experimento que da forma a esta versión.
- [[Versionado del sistema]] — el criterio del número, y por qué acá se apartó de él.
- [[Publicar una version]] — cómo se publica.
- [[bugs-progreso]] — las correcciones que entran.
- [[BACKLOG]] — el inventario.
- [[Mapa de documentacion]] — índice general.
