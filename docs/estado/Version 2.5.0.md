# Versión 2.5.0

**Solo desktop** (`desktop-tauri`) · 2026-10-09 · sobre [[Version 2.4.0]]

> [!success] Publicada el 2026-10-09 a las 14:33 (UTC)
> Por el circuito de CI: PR #4 de `desktop-tauri` a `despliegues`, artefactos de Windows, macOS y
> Linux, `npm run publicar -- --ci`, ensayo primero. Las seis firmas verifican con la `pubkey` de la
> app y lo que quedó en el bucket coincide con lo firmado (sha256 del `.exe` `c25f38c0…`).

La versión de la **ayuda y la apariencia**. Llega la ayuda integrada, una wiki en su propia
ventana con F1 (`FUN-L-27`). También llegan la atmósfera **Aurora** (`FUN-M-54`), la letra por
defecto Geist Sans a 14px y una Configuración más liviana (`FUN-M-41`). Los enlaces a
encabezados `[[Nota#Encabezado]]` ya funcionan (`DEF-141`), el lienzo deshace y rehace
(`DEF-137`), y la búsqueda recibe cinco correcciones (`DEF-144`, `DEF-145`, `DEF-146`,
`DEF-148`, `DEF-152`). Absorbe `DEF-130` a `DEF-154` y las negaciones del `.mycignore`
(`FUN-S-30`). Es la versión del framework de IA `2.1.0`, con las instrucciones por capas de
`FUN-L-29`.

## Por qué sube este dígito

**Minor, y uno solo**: el usuario puede hacer cosas que antes no podía —abrir la ayuda,
elegir Aurora, enlazar a un encabezado, deshacer en el lienzo, negar reglas del
`.mycignore`— y eso manda. Las correcciones viajan absorbidas ([[Versionado del sistema]]).

<!-- notas-release:inicio -->
## Ayuda integrada y una atmósfera nueva

### Ayuda dentro de Mycelium

- Apretá **F1**, o buscala en la paleta o en Configuración: se abre una **ayuda** en su
  propia ventana, con buscador. Son 34 páginas en 8 temas, con ejemplos que se ven como en
  tus notas.

### Apariencia

- Nueva atmósfera, **Aurora**: degradados, brillos y luces con los colores de tu tema, en
  oscuro y en claro.
- Los vaults nuevos escriben y leen en **Geist Sans a 14px**. Si ya elegiste otra letra, se
  queda la tuya.
- Las tarjetas de tema tienen todas el mismo tamaño.
- **Configuración más liviana**: una línea por ajuste, y el resto de la explicación plegado
  detrás de «Más».
- El logo de la barra superior sigue los colores del tema en sus tres puntos.

### Notas y enlaces

- `[[Nota#Encabezado]]` lleva al encabezado, en vivo y en lectura.
- En la vista en vivo, una dirección web suelta se ve y se abre con un clic.
- **Enter** en el título de la nota te lleva al cuerpo.
- Si un archivo cambia por fuera mientras tenés cambios sin guardar, Mycelium te avisa y
  elegís qué hacer: ya no se pierde nada en silencio.
- Dos notas con el mismo título no cambian a dónde llevan tus enlaces. Una nota creada desde
  una Espora ya no nace con el título de la plantilla.
- Las tablas respetan la alineación de columnas en lectura, y los diagramas Mermaid siguen
  tu tema.

### Búsqueda

- `clave:valor` ignora tildes y mayúsculas, y acepta valores con espacios entre comillas.
- `tag:x` trae solo las notas con esa etiqueta.
- La nota cuyo título coincide sale primero, y los fragmentos se leen como texto.

### Lienzos, dibujos y grafo

- En el lienzo, **Ctrl+Z** y **Ctrl+Y** deshacen y rehacen. Borrar una tarjeta con Supr se
  puede deshacer.
- Las flechas entre tarjetas de un grupo ya no quedan tapadas, y las tarjetas nuevas
  aparecen en un lugar libre.
- El editor de dibujos está en español, y su letra a mano se ve también sin internet.
- En el grafo, «Nombres: Todos» muestra todos los nombres sin tapar nodos.

### Y además

- El explorador despliega las carpetas de la nota que abrís.
- La papelera muestra de qué carpeta viene cada cosa, con Recuperar y Eliminar siempre a mano.
- La X del editor de CSS pregunta antes de descartar cambios.
- El `.mycignore` admite excepciones con `!`, como en git.
- Las instrucciones para la IA del vault ocupan mucho menos.
<!-- notas-release:fin -->

## Qué entra

| Qué | ID | Dónde |
|---|---|---|
| Ayuda integrada (F1), 34 páginas en 8 temas (la de Apariencia llegó con Aurora) | `FUN-L-27` | [[ayuda-integrada]] |
| Configuración: una línea por ajuste, filetes entre ajustes | `FUN-M-41` | [[BACKLOG]] |
| Atmósfera Aurora | `FUN-M-54` | [[atmosfera-aurora]] |
| Letra por defecto Geist Sans 14px en editor y lectura (decisión del usuario, sin ID) | — | `stores/preferencesStore.ts` |
| Tarjetas de tema de tamaño fijo, con scroll (sin ID) | — | `components/settings/Settings.module.css` |
| Negaciones en `.mycignore` | `FUN-S-30` | [[BACKLOG]] |
| Framework de IA por capas | `FUN-L-29` | [[BACKLOG]] |
| Lo del modo desarrollador: el comando oculto y los temas de marca. **No se anuncia** ([[Lo del modo dev no se anuncia]]) | `FUN-S-36`, `FUN-M-51`, `FUN-M-52`, `DEF-155` | [[modo-dev]] |
| Correcciones: CSS, URL sueltas, embed de dibujo, plantilla de snippets, homónimos, foco al crear, errores nativos, deshacer en el lienzo, cambio externo, Enter en el título, Esporas, enlaces a encabezados, Mermaid, tablas, búsqueda ×5, Excalidraw en español y sin red, grafo, flechas del lienzo, lote de 14 detalles, logo | `DEF-130`, `DEF-132` a `DEF-154` | [[bugs-progreso]] |

> [!info] Confirmación en la app
> El usuario confirmó `DEF-155` y Arrecife. El resto de esta versión se publica **sin una
> confirmación ítem por ítem**: el usuario decidió publicar el 2026-10-09, con el reflejo a
> web en curso.

## Cómo comprobarlo en la app

1. **Ayuda**: F1, buscar «enlaces» y abrir la página.
2. **Aurora**: Configuración → Apariencia → atmósfera Aurora, en oscuro y en claro, con
   Bioluminiscencia y con Cantarela.
3. **Letra**: crear un vault nuevo; el editor y la lectura salen en Geist Sans a 14px.
4. **Enlaces**: `[[Nota#Encabezado]]` en vivo y en lectura.
5. **Búsqueda**: `estado:"en curso"`, `tag:x`, un título exacto.
6. **Lienzo**: borrar una tarjeta con Supr y deshacer con Ctrl+Z.

## Relacionadas

- [[Version 2.4.0]] — la versión anterior.
- [[Versionado del sistema]] — el criterio del número.
- [[atmosfera-aurora]] — la atmósfera nueva.
- [[ayuda-integrada]] — la ayuda.
- [[BACKLOG]] — el inventario.
- [[Mapa de documentacion]] — índice general.
