# Progreso de bugs (docs/Bugs_errores_y_defectos.md)

Flujo: se arregla **uno a la vez**, primero en `desktop-tauri` (versión en uso),
el usuario **confirma en la app**, luego se refleja en `web-cloud` (salvo que el
bug sea específico de un sistema). No se avanza al siguiente hasta confirmar.

Estados: ⬜ pendiente · 🔧 en curso · 🛠️ implementado (sin confirmar) · ⏳ pend. evaluación · ✅ confirmado (desktop) · 🌐 reflejado en web

| Bug | Descripción corta | Alcance | Estado |
|---|---|---|---|
| DEF-015 | Colapsar títulos `#` también en vista de lectura | ambas (frontend) | ✅ 🌐 |
| DEF-015b | Ícono de plegar/desplegar personalizado y centrado vertical | ambas (frontend) | ✅ 🌐 |
| DEF-017 | El embed `.excalidraw` no se dibuja en la vista en vivo; crear diagrama abre pestaña | ambas (frontend) | ✅ 🌐 (pre-separación) |
| DEF-018 | Se pierde el progreso de exportar vault al cerrar el menú | ambas (frontend) | ✅ 🌐 |
| DEF-020 | El panel de Configuración se cierra de golpe, sin animación de salida | ambas (frontend) | ✅ 🌐 (pre-separación) |
| DEF-021 | Callout con tipo "contamina" las `>` siguientes separadas | ambas (frontend) | ✅ 🌐 |
| DEF-022 | No se renderizan callouts anidados en edición en vivo | ambas (frontend) | ✅ 🌐 |
| DEF-023 | Explorer estilo Obsidian: paneles redimensionables (P1) + arrastrar al área de trabajo (P2) + explorador como visor con pestañas (P3) | ambas (frontend) | P1 ✅🌐 · P2 ✅🌐 · P3 ✅🌐 |
| DEF-024 | Opciones al exportar PDF (fondo blanco, colores, callouts, estilos) | ambas (difiere) | ✅🌐 |
| DEF-026 | Caret no visible en el editor CSS | ambas (frontend) | ✅ 🌐 |
| DEF-030 | El grafo no actualiza colores al cambiar de tema | ambas (frontend) | ✅ 🌐 |
| DEF-031 | Problemas de selección/scroll al trabajar con tablas | ambas (frontend) | ✅ 🌐 |
| DEF-032 | No se adjunta un `.excalidraw` externo en un markdown | ambas (frontend) | ✅ 🌐 (ya estaba) |
| DEF-033 | En "Compartido" el clic con la rueda no abre en pestaña nueva | ambas (frontend) | ✅ 🌐 (pre-separación) |
| DEF-034 | Falta "sombra" (ícono+nombre) siguiendo el puntero al arrastrar | ambas (frontend) | ✅ 🌐 (ya estaba) |
| DEF-035 | La búsqueda solo encuentra la palabra exacta, no por coincidencia | ambas (difiere) | ✅ 🌐 (pre-separación) |
| DEF-036 | Import cae en el path seleccionado, no donde se soltó | ambas (frontend) | ✅ 🌐 |
| DEF-036b | Falta feedback del lugar donde se sueltan los archivos | ambas (frontend) | ✅ 🌐 |
| DEF-037 | Conflictos de scroll/selección al abrir el buscador en el archivo | ambas (frontend) | ✅ 🌐 |
| DEF-038 | Límite de zoom-out del grafo insuficiente con muchos nodos | ambas (frontend) | ✅ 🌐 |
| DEF-039 | Al volver a una pestaña se pierde la posición de lectura | ambas (frontend) | ✅ 🌐 (web: 2026-08-08) |
| DEF-040 | El historial de atrás/adelante es global en vez de por pestaña | ambas (frontend) | ✅ 🌐 (web: 2026-08-08) |
| DEF-041 | La pestaña de previsualización no reemplaza, abre una nueva | ambas (frontend) | ✅ 🌐 (web: 2026-08-08) — se confirmó pese a haberse endurecido sin causa raíz |
| DEF-042 | El progreso del indexado sale en todos los botones de vault; falta una pantalla de carga | desktop | ✅ desktop (2026-08-13) — pantalla propia, con etapas y aviso de atasco |
| DEF-043 | El ícono de las Esporas es un brote de planta, no evoca una espora | ambas (frontend) | ✅ 🌐 (web: 2026-08-08) |
| DEF-044 | Al cambiar de vault siguen abiertas las pestañas del vault anterior | desktop | ✅ desktop (2026-08-13) — un almacén por vault, y el árbol se vacía al cambiar |
| DEF-045 | `[[destino\|alias]]` dentro de una tabla: o rompe la tabla, o rompe el grafo | ambas (frontend) | ⬜ pendiente — causa raíz ya identificada |
| DEF-046 | Lo eliminado no aparece en la papelera, ni en la de Windows: no hay recuperación | desktop | ✅ desktop (2026-08-03) — las dos mitades |
| DEF-047 | El menú contextual se sale de la pantalla en los archivos de abajo | ambas (frontend) | ✅ desktop · 🌐 (2026-08-13) — se mide y se vuelca |
| DEF-048 | Falta margen inferior en toda la app: el contenido queda pegado al borde | ambas (frontend) | 🛠️🌐 (2026-08-13) — token `--mic-gap-inferior`; sin confirmar |
| DEF-049 | El ancho de tabulación no cambia nada en los documentos ya escritos | ambas (frontend) | ✅ 🌐 (web: 2026-08-08) |
| DEF-050 | Al cambiar la tabulación desaparecen los indicadores de plegado en lectura | ambas (frontend) | ✅ 🌐 (web: 2026-08-08) |
| DEF-051 | Ninguna confirmación aparece y se borra igual: carpeta, Espora o papelera, sin preguntar | desktop | ✅ desktop (2026-08-03) — permiso + `confirmar()` que espera. **No aplica a web**: el `confirm` del navegador sí devuelve un booleano |
| DEF-052 | Abrir un vault se va casi todo en «vigilando los cambios», más que en leer los archivos | desktop | ✅ desktop (2026-08-13) — el poblado del caché respeta `.mycignore` |
| DEF-053 | Las opciones del grafo se salen de la pantalla si la pestaña es pequeña | ambas (frontend) | 🛠️ desktop (2026-08-13) — portal y posición acotada |

## Notas por bug

- **DEF-052 — el watcher recorre el vault ENTERO, y sin `.mycignore`** (causa raíz
  confirmada el 2026-08-13 leyendo la fuente del crate). `iniciar_watcher` hace dos cosas:
  `watch()`, que en Windows es un solo handle y no cuesta nada, y
  `debouncer.cache().add_root(base, Recursive)`, que es lo caro. En
  `notify-debouncer-full 0.3.2`, `add_root` → `add_path` → `WalkDir` con
  `max_depth(usize::MAX)` y `follow_links(true)`, **llamando a `get_file_id()` en cada
  entrada** — una llamada al sistema por archivo y por carpeta.

  Ese recorrido **no conoce el `.mycignore`**: entra en `node_modules/`, `target/`, `.git/`
  y todo lo demás. Es exactamente el coste que `FUN-M-12` le quitó al indexador —en este
  vault, de 1830 archivos y 4020 directorios a 63 y 110— pero que el watcher sigue pagando
  íntegro. Por eso «vigilar» tarda más que «leer los archivos»: el indexador mira 63 y el
  watcher mira 1830.

  Para qué sirve ese caché: **coser renombrados** cuando el sistema no emite pares de
  eventos. En Windows `ReadDirectoryChangesW` sí los emite, así que aporta poco.

  **Corregido conservando el caché**, que era la opción que el usuario eligió con un
  criterio que vale la pena dejar escrito: *si `.mycignore` ignora algo, Mycelium no
  debería tomarlo en cuenta para nada*. El root se registra como `NonRecursive` —para que
  el `rescan()` tras un desbordamiento del SO siga acotado, en vez de quedarse sin ningún
  root y dejar la caché muerta— y el poblado se hace con `archivos::rutas_observables()`,
  el mismo recorrido filtrado que usa el indexador.

  **Salió un segundo defecto de paso**: `vault_watch::es_nota` era una copia de la lista de
  extensiones con `.md` y `.excalidraw`, y se quedó atrás al aparecer las bases
  (`FUN-L-03`) y los canvas (`FUN-L-18`) — editarlos desde fuera **no disparaba
  reindexado**. Ahora el watcher usa `archivos::es_importable`, la misma lista que el
  indexador: dos listas de extensiones separadas por medio archivo se desincronizan siempre.

- **DEF-053 — el mismo problema del `DEF-047`, y encima recortado.** El panel de opciones
  era `position: absolute` **dentro del grafo**: 300 px de ancho y hasta `70vh` de alto
  —medido contra la ventana, no contra el pane— así que con la pestaña pequeña se salía por
  los lados y por abajo. Y como el área de contenido tiene `overflow: hidden`, lo que
  sobresalía no solo quedaba fuera: quedaba **recortado**, sin forma de alcanzarlo.

  Se saca a un portal sobre el `body` con posición fija, se mide y se acota a la ventana
  —abriendo hacia arriba si abajo no hay sitio— y el `max-height` pasa a salir del espacio
  realmente disponible en vez de un `70vh` fijo. Al vivir en un portal, el cierre por clic
  fuera tiene que preguntarle **también al panel**: si no, pulsar dentro lo cerraría.

- **DEF-047 — el menú se dibujaba en el punto del clic, sin mirar si cabía.** La posición
  era literalmente `left: x; top: y`. Ahora el menú **se mide ya montado** y se reubica:
  vuelca al otro lado del cursor y, si ni así entra —menú más alto que la ventana—, se
  arrima al borde. Se mide en vez de estimar el alto porque este depende de cuántas
  entradas tenga cada menú (el de una carpeta y el de una nota no son iguales) y cualquier
  número fijo se queda corto en cuanto se agrega una opción. `useLayoutEffect` lo hace
  antes de pintar, así que no se ve saltar. Los submenús —el de Esporas puede ser largo—
  además se acotan con `max-height` y se desplazan dentro.

- **DEF-048 — no había ningún aire abajo.** Se resuelve con un token,
  `--mic-gap-inferior`, y va como token y no como valor suelto para que cualquier pantalla
  futura tenga dónde mirar.

  **Corregido el alcance tras probarlo**: se aplicó primero al shell entero, y así el rail
  y el panel lateral quedaban despegados también. El usuario lo acotó a lo que de verdad
  pedía: **solo el área de contenido** —las pestañas abiertas: notas, consolas, grafo,
  bases, canvas—. Va en `.editorArea`, cuyo fondo pasa a ser el del lienzo para que la
  franja lea como un margen y no como una prolongación del pane.

- **DEF-044 — había UNA sola clave de `localStorage` para las pestañas de todos los
  vaults.** `tabsStore` persistía en `micelio-tabs`, sin más, así que al cambiar de vault el
  layout restaurado era el del anterior. Y `reconcileNotes` no lo salvaba: en modo carpeta
  el id de una nota **es su ruta**, y dos vaults comparten rutas con facilidad
  (`Indice.md`), de modo que la pestaña sobrevivía a la reconciliación y pasaba a mostrar
  *otra* nota — que es el «muestran mal el contenido» del reporte.

  Ahora cada vault tiene su clave (`micelio-tabs:<ruta>`), y `usarAlmacenDeVault()` la
  cambia al abrir y la suelta al salir. **El orden de esa función no es intercambiable**:
  se lee lo guardado, después se reapunta el `persist` y solo entonces se rehidrata o se
  resetea. Resetear antes de reapuntar escribiría el layout vacío en la clave del vault que
  se está cerrando —borrándole las pestañas—; y rehidratar después de un reset escribiría
  el vacío en la clave nueva antes de poder leerla, con el mismo daño sobre el vault al que
  se entra.

  > [!note] La primera apertura tras actualizar sale sin pestañas
  > Las que había vivían en la clave común y no se pueden repartir: no hay forma de saber a
  > qué vault pertenecía cada una. Esa clave queda como la del modo SQLite clásico.

  **Segunda causa, encontrada al confirmarlo.** Con las claves por vault ya puestas, el
  usuario probó: abrir A, dejar una pestaña, cerrar, abrir **B**, cerrar, volver a A → sin
  pestañas. Y sin pasar por B sí funcionaba. Esa diferencia era la pista: `vaultStore`
  **no se vaciaba al cambiar de vault**, así que al montar el workspace `reconcileNotes`
  —que descarta las pestañas cuya nota no esté en la lista— corría contra las notas del
  vault ANTERIOR y se llevaba por delante las que se acababan de restaurar. Peor: dejaba
  además el layout vacío guardado en la clave del vault nuevo, así que el daño era
  permanente. Sin pasar por B, la lista obsoleta era la del propio A y no borraba nada.

  Se arregla en la raíz —`vaultStore.reset()` al abrir y al salir, exactamente por el mismo
  motivo por el que ya existía `graphStore.reset()`— y se refuerza el sitio destructivo: la
  reconciliación exige ahora que el árbol sea el del vault activo, no solo que no esté
  vacío.

  **Alcance**: se marca solo-desktop porque en web no se puede reproducir — cambiar de
  vault es `FUN-L-04` y todavía no existe. Cuando llegue, tiene que llamar a lo mismo.

- **DEF-042 — el progreso se pintaba en todos los botones porque la etiqueta era una
  sola.** `etiquetaAbrir` se calculaba una vez, a nivel de página, y se usaba dentro del
  `map` de la lista: no había forma de que un botón supiera si el vault que se estaba
  abriendo era el suyo. La corrección no fue pasarle el id a cada botón sino **quitar el
  progreso de la lista entera**: mientras se abre un vault el selector desaparece y da paso
  a una pantalla propia, que es lo que pedía el defecto. El mismo camino cubre la apertura
  automática, que antes mostraba un «Cargando…» mudo.

  La pantalla lee **solo el store**, a propósito: el [[BACKLOG]] emparentaba este defecto
  con `FUN-L-10` (mover el indexado a Rust) para no tocar el feedback dos veces. Con la
  pantalla desacoplada de quién produce el progreso, a `FUN-L-10` le basta con alimentar el
  mismo store.

  **Segunda pasada**: al confirmarlo apareció un parpadeo del selector justo antes de
  entrar. Era una carrera entre dos pasos que parecían uno: el store pone `abriendo: false`
  en cuanto termina, pero el `router.replace("/workspace")` corre **después**, y en ese
  hueco la página volvía a pintar la lista. La página sostiene ahora la pantalla con una
  bandera propia hasta que la navegación se lleve la página —no hasta que el store diga que
  terminó— y el store deja de limpiar `etapa`/`rutaAbriendo` al acabar bien, para que esos
  milisegundos no se vean como un salto a una pantalla con todo otra vez pendiente.

- **DEF-051 — `dialog:default` no incluye `allow-confirm`** (encontrado el 2026-08-03 en el
  log de arranque, no reportado: `dialog.confirm not allowed. Command not found`).

  Tauri **enruta `window.confirm` al plugin de diálogos**, y ese comando no estaba
  permitido. Como el error se lanza, el manejador entero muere: la confirmación no aparece
  y la acción tampoco se ejecuta. Silencioso de los dos lados.

  Afectaba a **cinco** sitios, y ninguno era menor:
  `EsporasPanel` (borrar una Espora) · `ExplorerPanel` (borrar una carpeta) · `TrashPanel`
  (**vaciar la papelera / borrar definitivo**) · `UpdaterSection` (**instalar una versión
  elegida**, `FUN-M-16`) · `VaultSection`.

  > [!warning] La trampa: el conjunto `default` dice que están todos y no es cierto
  > La descripción de `dialog:default` en el propio plugin afirma *"All dialog types are
  > enabled"*, pero su lista real es `["allow-message", "allow-save", "allow-open"]` — sin
  > `confirm` ni `ask`. Leer la descripción y no la lista es lo que dejó esto pasar.
  > Comprobado en `~/.cargo/registry/…/tauri-plugin-dialog-2.7.2/permissions/default.toml`.

  **El permiso era solo la mitad.** Con él concedido, la confirmación seguía sin aparecer y
  además **la acción se ejecutaba igual**: borrar una carpeta la borraba sin preguntar. La
  causa de fondo es que el `window.confirm` de Tauri es **asíncrono** —devuelve una promesa,
  no un booleano— y **una promesa siempre es *truthy***, así que todo
  `if (window.confirm(…))` se cumplía siempre.

  > [!danger] TypeScript no puede avisar de esto
  > El tipo de `window.confirm` dice `boolean`, así que `if (window.confirm(…))` compila sin
  > una queja. El fallo solo se ve ejecutando, y se manifiesta como *"borra sin preguntar"*,
  > que es lo contrario de lo que uno buscaría al leer el código.

  Corregido en dos pasos: los permisos `dialog:allow-confirm` y `dialog:allow-ask` en
  `src-tauri/capabilities/default.json`, y un helper único `lib/confirmar.ts` que llama al
  plugin y **espera** la respuesta. Los cinco sitios pasan por él; ya no queda ningún
  `window.confirm` en la app. Ante un fallo del diálogo devuelve `false`: en la duda, no se
  ejecuta la acción destructiva.

- **Regresión del arreglo de `DEF-046`: "error desconocido" al crear una Espora.** Detectada
  por el usuario al probar. Al conservar la fila de `notas` de lo que está en la papelera
  —que es justo lo que arregló el defecto— el nombre volvía a considerarse libre, porque
  `basenamesOcupados` (`lib/db/vaultFs.ts`) excluía a propósito las notas de la papelera.
  Resultado: `crearNota` intentaba insertar una fila con un `id` que ya existía y el choque
  de clave salía como "error desconocido".

  Corregido quitando esa exclusión: **lo que está en la papelera ocupa su nombre**. Además
  de evitar el choque, previene el problema simétrico — si el nombre se reutilizara,
  recuperar después la nota de la papelera chocaría contra la nueva.

  > [!note] Por qué nadie lo había visto
  > `window.prompt` **sí** funciona (se comprobó con "Nueva carpeta", ver
  > [[Tauri y el WebView]]), así que la conclusión razonable era que los diálogos del
  > navegador estaban bien. `confirm` falla y `prompt` no: no hay forma de deducirlo sin
  > mirar los permisos o el log.

- **DEF-049 — el ancho de tabulación casi no tiene efecto, y la culpa es de la spec.**
  CodeMirror separa dos cosas y `FUN-S-02` fijó las dos, pero ninguna hace lo que el usuario
  esperaba sobre contenido que **ya está escrito**:
  - `tabSize` cambia cuánto ocupa un **tabulador literal** (`\t`). El markdown se indenta
    casi siempre con **espacios**, así que en la práctica no hay tabuladores que reescalar
    y no se ve ningún cambio.
  - `indentUnit` cambia lo que inserta la tecla Tab **de ahí en adelante**. No toca nada de
    lo ya escrito.

  O sea que la funcionalidad hace exactamente lo que dice su spec y aun así **no sirve para
  lo que se pidió**. Lo que el usuario espera es que cambie **cómo se ve la sangría** de sus
  documentos — sobre todo las listas anidadas—, y eso es otra cosa: se controla por CSS
  (el `padding-left` de las listas y el ancho de la sangría en el editor), no por `tabSize`.

  **Corregido el 2026-08-03** rehaciendo la funcionalidad, no parcheándola. Lo que se
  decidió: el ajuste manda sobre **tres** cosas y cada una llega hasta donde puede.
  - **Al leer** (lectura y dividido): la sangría de las listas y los tabuladores salen de
    una variable CSS `--mic-tab-width`. Cambiar el ajuste reacomoda **todos** los documentos
    al instante, sin editarlos. Esto es lo que faltaba.
  - **Al escribir**: lo que inserta Tab, como antes.
  - El valor pasa a **escribirse libre** (1–16, por defecto 4).

  > [!important] El defecto 4 deja la app exactamente como se veía
  > El `padding-left` de las listas está calibrado (`0.375rem` por unidad) para que 4 dé los
  > mismos `1.5rem` de siempre. Un cambio de presentación global no debe reacomodarle los
  > documentos a nadie que no lo haya pedido.

  > [!note] Lo que sigue sin poder hacer, y por qué
  > En la **vista en vivo** la sangría ya escrita con espacios no se reescala: dos espacios
  > ocupan dos espacios, y no hay forma de renderizarlos como ocho sin cambiar el texto. Eso
  > es `FUN-M-18` (reindentar), que al ser una edición masiva reutiliza el respaldo y el
  > deshacer de [[auditoria-y-relinkeado]] en vez de inventar los suyos. La opción lo dice
  > en su propio texto, para no volver a prometer lo que no cumple.

- **DEF-050 — las flechas se inyectan después de que React pinte, y un re-render se las
  lleva.** Confirmado por reproducción: seguía pasando tras rehacer `FUN-S-02`, así que no
  dependía de `tabSize` ni del compartimento.

  El mecanismo: `attachHeadingFolds` añade las flechas al DOM **después** del render. Si
  algo reescribe el HTML del preview —cambiar cualquier preferencia a la que `NoteEditor`
  esté suscrito basta para re-renderizarlo— las flechas se van con él. Y el efecto que las
  repone **no volvía a correr**, porque sus dependencias (`previewHtml`, `mode`, …) seguían
  exactamente iguales: el contenido no había cambiado.

  **Corregido** haciendo la reposición auto-reparable en vez de perseguir cada causa:
  - `attachHeadingFolds` pasa a ser **idempotente de verdad**. Ya saltaba las cabeceras con
    flecha, pero recreaba el conjunto de secciones plegadas en cada llamada, así que
    repetirla reseteaba el plegado. Ahora ese conjunto vive en un `WeakMap` por contenedor
    —`WeakMap` para no retener nodos de notas ya cerradas— y se limpia de los que dejaron
    de colgar del DOM.
  - Se llama desde un efecto **sin lista de dependencias**, es decir, tras cada render. Como
    repetirla no cuesta ni pierde estado, repone lo que falte sin importar qué se lo llevó.

  > [!note] Por qué auto-reparable y no "arreglar la causa"
  > La causa concreta —qué re-render exacto reescribe el HTML— es de las internas de React
  > y podría cambiar entre versiones. Un efecto que repone lo que falta sobrevive a eso; una
  > corrección atada al re-render de hoy, no.

- **DEF-046 — el indexador borra la papelera** (causa raíz confirmada el 2026-08-03 leyendo
  el código y el disco). El ciclo completo:
  1. `borrarNota` (`lib/db/papelera.ts`) hace lo correcto: mueve el archivo a
     `.mycelium/.trash`, inserta la fila en `papelera` y **conserva** la fila de `notas`
     "para poder recuperarla" (así lo dice su propio comentario).
  2. Mover el archivo dispara el watcher (`vault-cambios`) → corre `indexarVault`.
  3. La limpieza final de `indexarVault` (`lib/db/indexer.ts`) recorre las notas del índice
     y, para toda la que ya no está en su ruta de disco, ejecuta
     **`DELETE FROM papelera`** y `DELETE FROM notas`.
  4. Una nota recién enviada a la papelera **ya no está en su ruta** —está en `.trash`, que
     `.mycignore` ignora siempre—, así que entra en esa limpieza y su entrada de papelera
     desaparece a los segundos.

  > [!success] Los archivos NO se perdieron
  > Solo se perdió el registro. Siguen físicamente en `<vault>/.mycelium/.trash/`. En este
  > repo se comprobó: había 4 archivos ahí que no aparecían en la papelera de la app.

  **Corregido el 2026-08-03**: la limpieza de `indexarVault` ahora carga primero las notas
  que están en `papelera` y las **salta**. Su ausencia de la ruta original es intencional,
  no es un archivo desaparecido. Un archivo borrado desde fuera de Mycelium (el explorador
  de Windows) sigue limpiándose como antes, porque ese no tiene fila en `papelera`.

  > [!note] Lo ya huérfano sigue invisible — pendiente
  > El arreglo evita que vuelva a pasar, pero **no reconcilia** lo que quedó sin registro
  > durante el período con el defecto. Esos archivos siguen en `.mycelium/.trash` y hay que
  > sacarlos a mano. Reconciliar tiene sus propios casos borde (el sufijo de timestamp que
  > `borrar_a_papelera` agrega ante colisiones, y qué hacer si la ruta original está
  > ocupada), así que se deja como continuación en vez de improvisarlo acá.

  Las dos partes del defecto tienen causas **distintas**, y conviene no confundirlas:
  - *No aparece en la papelera* → lo de arriba. La limpieza del indexador tiene que
    **excluir las notas que están en la papelera**, no tratarlas como borradas.
  - *Tampoco está en la papelera de Windows* → `borrar_definitivo` usaba
    `std::fs::remove_file`, que borra de verdad. **Corregido el 2026-08-03** a pedido del
    usuario: ahora usa el crate `trash`, así que sacar algo de la papelera de Mycelium lo
    manda a la del sistema y queda una última red de recuperación fuera de la app.

    > [!note] Si el sistema no puede aceptarlo, se borra igual
    > Una unidad de red o un sistema de archivos sin papelera harían fallar el envío. En ese
    > caso se borra permanentemente —el usuario pidió sacarlo de ahí y la operación tiene que
    > completarse— pero **el motivo se registra en el log**: lo que no se hace es fingir que
    > fue a la papelera del sistema cuando no fue.

- **DEF-045 — causa raíz ya localizada** (2026-08-03, comprobada ejecutando el pipeline real):
  hay **cuatro** sitios que interpretan `[[destino|alias]]`, y no leen lo mismo.
  - `lib/markdown.ts` (lectura) corre **después** de `remark-gfm`, sobre el *text node*. GFM
    ya resolvió el escape: el nodo contiene `[[Destino|alias]]` sin la barra invertida, así
    que `indexOf("|")` parte bien y el destino sale `Destino`. **Acá `\|` funciona.**
  - `lib/db/grafo.ts`, `lib/editor/wikilink.ts` y `lib/editor/livePreview.ts` corren sobre el
    **texto crudo** del archivo, donde la barra invertida sigue ahí. Los tres hacen el mismo
    `inner.indexOf("|")` + `slice(0, pipe)`, así que el destino sale **`Destino\`** y no
    resuelve.
  - **El arreglo es pequeño y compartido**: normalizar `\|` → `|` antes de partir, en los
    tres consumidores de texto crudo. Conviene un helper único —hoy la lógica de partir
    destino/alias está copiada cuatro veces— para que no vuelvan a divergir.
  - **Hasta que se arregle, no documentar `\|` como solución**: en lectura se ve bien y el
    grafo pierde la conexión en silencio, que es peor que el fallo visible. Dentro de tablas,
    `[[Destino]]` sin alias funciona en los cuatro sitios.

- **DEF-017 / DEF-020 / DEF-033 / DEF-035 — corregidos antes de existir el catálogo**
  (auditoría del 2026-08-02): estaban resueltos y con commit, pero **el defecto en sí
  nunca se había escrito** en [[Bugs_errores_y_defectos]]; se registró ahí a partir del
  commit y de los comentarios del código. Los cuatro son **anteriores a la separación de
  ramas** (1.1.0), así que están en `desktop-tauri` y en `web-cloud` por herencia, no por
  reflejo.
  - `DEF-017` (`aed1d0b`) — el embed `![[x.excalidraw]]` solo se dibujaba en lectura/
    dividido. Widget inline en `livePreview` (las block deben venir de un `StateField`, no
    de un plugin) + `renderExcalidrawInto` compartido; "Insertar diagrama" pasa a abrir el
    `ExcalidrawModal` embebido en vez de una pestaña.
  - `DEF-020` (`d0c159f`) — el `SettingsDrawer` se desmontaba al instante al cerrar. Ahora
    se mantiene montado durante la animación de salida y se desmonta en `onAnimationEnd`.
  - `DEF-033` (`e87406a`) — las filas de `SharedSection` solo tenían `onClick`; les
    faltaban el `onMouseDown` (que evita el auto-scroll del navegador) y el `onAuxClick` →
    `openNoteBackground` que sí tienen las del explorador.
  - `DEF-035` (`e9903e7`) — la query FTS5 entrecomillaba cada término, forzando palabra
    completa. Ahora cada término va como prefijo (`"perr"*`) y el toggle "Búsqueda exacta"
    (apagado por defecto) restringe. **Diverge**: `BuildFtsQuery(raw, prefix)` en el
    backend .NET (web) y `lib/db/fts.ts` + `lib/db/buscar.ts` en desktop.
- **DEF-039 / DEF-040 / DEF-041** (desktop, merge `05ebc0a`, [[Version 1.1.5]]):
  reportados por el usuario al leer varias notas largas en paralelo. Spec y criterios en
  [[navegacion-por-pestana]].
  - `DEF-039` — la causa raíz **no era la restauración sino el guardado**: el scroll se
    leía en la limpieza del `useEffect` y React 18+ la ejecuta después de desprender el
    nodo, así que `scrollTop` valía siempre `0`. Ahora se captura en vivo con
    `EditorView.scrollSnapshot()` y se restaura por el `scrollTo` del constructor.
  - `DEF-040` — **no existía historial propio**: el botón del ratón navegaba el del
    WebView, alimentado por los `router.push` de cada apertura. Ahora cada pestaña lleva
    su línea, heredada al reemplazar una pestaña de previsualización.
  - `DEF-041` — **sin causa raíz confirmada**. Se corrigió que `splitWithTab` perdiera el
    flag `preview` al duplicar, se comparó la preferencia con `=== true` y se evita
    reabrir la nota ya activa. Si el defecto persiste, volver acá.
  - **Reflejo a web diferido** hasta que el usuario confirme en la app.
- **DEF-024** (desktop `8fa7e55`, web `4be8562`): diálogo de opciones al exportar PDF
  (tamaño + fondo blanco/texto negro por defecto, incluir colores, estilar callouts,
  estilos de Mycelium; se recuerdan en `pdfExportStore`). `buildPrintCss(opts)` en
  `printStyles.ts` compone el CSS por capas (compartido). **Diverge la salida**:
  desktop imprime en cliente (iframe + `window.print()`, `@page margin: 16mm`; el
  encabezado/pie del navegador se quita en el diálogo de impresión — perfeccionar con
  export nativo = follow-up); web envía `css: buildPrintCss(opts)` al backend .NET
  (PuppeteerSharp), sin encabezado de navegador. Con fondo blanco se ignora el modo
  oscuro. `export.ts` diverge (a mano); `ExportMenu`/`TabBar`/`EditorToolbar`/
  `ImportDialogs` + `PdfExportDialog`/`pdfExportStore`/`printStyles` traídos enteros.
- **DEF-023 Parte 1** (desktop `ac5d214`, web `4d1152d`): división Archivos/Compartido
  redimensionable con scroll propio (divisor arrastrable persistido en
  `mic-split-compartido`; alto de Compartido inline). El colapso de Compartido se
  elevó de `SharedSection` a props del `ExplorerPanel`. `ExplorerPanel.tsx` diverge
  (a mano); `SharedSection.tsx` + CSS traídos enteros. **Parte 2** (arrastrar
  ventanas/archivos al explorador para verlos como panel dividido) = feature grande
  aparte (ver abajo la **Parte 2**).
- **DEF-023 Parte 2** (desktop `8ad81ed` + fix `pendiente-commit`): arrastrar un
  archivo del explorador al área de trabajo (paridad Obsidian). Modelo final:
  **borde de un pane = dividir** (abre la nota en un pane nuevo a ese lado) · **resto
  del pane (barra de pestañas o cuerpo) = abrir como pestaña** en ese pane. Se
  **eliminó** la inserción de `[[enlace]]` al soltar sobre el editor (a pedido del
  usuario: se puede escribir a mano y chocaba con abrir/dividir; el ghost DEF-034 se
  mantiene). Núcleo técnico: el explorador arrastra con **@dnd-kit** (por puntero) y
  no alcanza a los panes. **Causa raíz de los intentos fallidos**: el ghost del
  `DragOverlay` de dnd-kit tapa el DOM bajo el puntero y bloquea los `pointermove`/
  `elementFromPoint` sobre los panes (por eso el resaltado se veía y desaparecía en
  <1s y al soltar no había objetivo). **Solución final**: no depender de eventos de
  puntero sobre los panes; usar el **tracking propio de dnd-kit** (el mismo que hace
  funcionar el drop en carpetas). El explorador computa el punto con
  `activatorEvent + delta` y ubica el pane por **geometría** (`getBoundingClientRect`
  de los cuerpos `[data-pane-id]`, umbral 56px para borde vs centro): en `onDragMove`
  publica `notaDropTarget` (para el previo visual) y en `onDragEnd` recalcula y abre
  (borde = `splitPaneWithNota`, centro = `openNotaInPane`). Compartido: `tabsStore`
  (`draggingNota`, `notaDropTarget`, `openNotaInPane`, `splitPaneWithNota`),
  `EditorPane` (cuerpo con `data-pane-id` + previo `.noteDropHint`); en `ExplorerPanel`
  (divergente) el cableado (`paneObjetivoEnPunto` + `onDragMove` + `limpiarDragNota`).
  Confirmado por el usuario en desktop (`73a6f42`) y reflejado en web (`91180e9`,
  verificado con `tsc` + `next build`; conflicto solo en el import de
  `insertRefAtPoint`, resuelto quitándolo como en desktop).
- **DEF-023 Parte 3** (objetivo real del bug; spec en `def-023-visor-sidebar.md`):
  el explorador funciona como visor con **pestañas arriba** (estilo Obsidian): pestaña
  permanente "Explorador" (árbol, no cerrable) + documentos anclados. Se ancla
  arrastrando una **pestaña del área de trabajo** al panel (drag nativo,
  `tabsStore.dragging`); no se arrastra del árbol al árbol. Visor en **solo lectura**
  (patrón `LinkedPreviewPane`) con toggle **Ver/Editar** (monta `NoteEditor`). Todo en
  archivos NUEVOS/compartidos (`sidebarViewerStore`, `ExplorerDock`, `SidebarNoteView`)
  + `LeftPanel`; **NO toca `ExplorerPanel`** (divergente) → reflejo trivial. Se puede
  anclar cualquier archivo visible, **incluido el grafo**. Dos disposiciones con toggle
  (persistido en `mode`): **split** = árbol arriba siempre (NO como pestaña) + docs
  abajo con sus pestañas, divisor redimensionable (`docsHeight`); **full** = barra de
  pestañas arriba con el **Explorador como pestaña** (carpeta) + documentos, la
  seleccionada ocupa todo. El árbol (`ExplorerPanel`) se mantiene montado en el mismo
  lugar en ambos modos. **Devolver al workspace**: se arrastra la pestaña del documento
  del sidebar a un pane (`draggingSidebarNota` + zona `sidebarReturnZone` en
  `EditorPane`; al soltar `openNotaInPane` + `cerrar`). Confirmado en desktop
  (`612dd0a`) y reflejado en web (`814508e`, verificado con `tsc` + `next build`; todos
  los archivos son nuevos/compartidos → se trajeron enteros, sin conflictos). Con esto
  DEF-023 (P1+P2+P3) queda **completo** en ambas versiones.
  **Ajuste**: al soltar contra el explorador se hacían dos acciones (abrir + mover),
  porque la colisión de dnd-kit marca carpeta por el rect del ghost, no por el
  puntero. Corregido: `dropMasProfundo` devuelve `[]` (sin colisión) cuando
  `pointerCoordinates` cae sobre un pane, así la decisión sigue al PUNTERO —
  puntero sobre pane = solo abrir/dividir; sobre explorador = solo mover.
  `tsc` verde; pendiente de prueba del usuario y reflejo a web.
- **Ajuste extra (no numerado) — zona de drop de carpeta** (desktop `aaa2143`, web
  `2269f7f`): pedido del usuario tras DEF-036. El arrastre interno solo tenía como
  droppable la LÍNEA de la carpeta, así que soltar en el hueco de su contenido caía
  en la raíz. Ahora cada carpeta tiene `FolderDropZone` (fila + contenido expandido)
  y un `collisionDetection` propio que elige la zona MÁS PEQUEÑA bajo el puntero (la
  carpeta más profunda); la raíz solo fuera de toda carpeta. `FolderRow` ya no crea
  su droppable: recibe `dropOver` de la zona (sirve para el resaltado interno y el
  del SO).
- **Cluster drag&drop**: DEF-032 y DEF-034 **ya estaban implementados** (doc
  desactualizada) — confirmado por el usuario en la app; no requirieron cambios.
  DEF-036/036b (desktop `3ef835f`, web `9c9a53e`): cada carpeta pasa a ser zona de
  drop del SO (la más interna gana con `stopPropagation`) e importa ahí, con
  resaltado del destino. CLAVE desktop: Tauri interceptaba los drops de archivos a
  nivel nativo → hubo que poner `dragDropEnabled: false` en `tauri.conf.json` (su
  doc dice que es *necesario* para usar HTML5 drag&drop en Windows); sin eso el
  webview nunca recibía `dragover`/`drop` y la importación por arrastre no
  funcionaba en desktop (bug preexistente). Ese ajuste es solo-desktop.
- **DEF-015/015b** (desktop `5705f0d`): DEF-015 ya estaba implementado; el bug real
  era que la flecha en lectura apuntaba al div del título del documento (no al de
  contenido) y era invisible (opacity 0). Ícono rehecho como chevron CSS centrado.
  Pendiente: reflejar en `web-cloud`. El desfase del gutter con **tablas renderizadas**
  NO es de este bug: es la raíz de DEF-031/DEF-037 (widget de tabla rompe la medición
  vertical de CodeMirror).
- **Estrategia web**: los fixes confirmados en desktop se reflejan en `web-cloud` en
  lote en un checkpoint (para no alternar de rama en cada bug). Archivos divergentes a
  vigilar al reflejar: `NoteEditor.tsx` difiere entre ramas (aplicar el cambio a mano,
  no copiar el archivo).
- **DEF-018** (desktop `ae3f3df`, web `c3109c1`) — ✅ evaluado y correcto por el usuario;
  la tabla decía "pendiente" y [[Estado del proyecto]] decía lo contrario, así que se
  unifica acá: el progreso de export pasó de estado local de
  `VaultSection` a `exportStore` (global) mostrado por `ImportDialogs` a nivel de app.
  `VaultSection.tsx` diverge entre ramas (desktop tiene export-a-carpeta + toggle
  abrir-último; web solo ZIP) → se aplicó a mano en cada una; `exportStore.ts` (nuevo)
  e `ImportDialogs.tsx` son compartidos. Reflejo web verificado con tsc + next build.
- **DEF-031/037** (desktop `97417f4`, web `e372ef4`): raíz = el widget de tabla en vivo
  espaciaba con `margin`, que CodeMirror NO mide (offsetHeight excluye márgenes) → el
  height-map quedaba más corto que el layout real por cada tabla, y ese desfase
  acumulado rompía gutter, selección con clic/flechas (DEF-031) y scroll del buscador
  (DEF-037). Fix: espaciado por `padding` + neutralizar height/overflow heredados +
  `estimatedHeight` en el widget. **Reflejo web** hecho vía worktree temporal (sin
  tocar el checkout desktop), verificado con tsc + next build; los 3 archivos
  compartidos eran idénticos al baseline → se trajeron enteros; en `NoteEditor.tsx`
  (divergente) se aplicó solo la línea `className="mic-preview-body"` a mano.

---

## Relacionadas

- [[Bugs_errores_y_defectos]] — el reporte original de cada `DEF-*`.
- [[Aprendizajes tecnicos]] — las causas raíz que salieron de resolverlos.
- [[Version 1.0.0]] — el release que cerró este backlog.
- [[Reflejar cambios de desktop a web]] — el proceso con el que se reflejó cada fix.
- [[Mapa de documentacion]] — índice general.
