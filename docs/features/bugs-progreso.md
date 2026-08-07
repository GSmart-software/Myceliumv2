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
| DEF-018 | Se pierde el progreso de exportar vault al cerrar el menú | ambas (frontend) | 🛠️🌐 ⏳ pend. evaluación |
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
| DEF-039 | Al volver a una pestaña se pierde la posición de lectura | ambas (frontend) | 🛠️ desktop (1.1.5), sin confirmar |
| DEF-040 | El historial de atrás/adelante es global en vez de por pestaña | ambas (frontend) | 🛠️ desktop (1.1.5), sin confirmar |
| DEF-041 | La pestaña de previsualización no reemplaza, abre una nueva | ambas (frontend) | 🛠️ desktop (1.1.5), **endurecido sin causa raíz confirmada** |
| DEF-042 | El progreso del indexado sale en todos los botones de vault; falta una pantalla de carga | ambas (frontend) | ⬜ pendiente |
| DEF-043 | El ícono de las Esporas es un brote de planta, no evoca una espora | ambas (frontend) | 🛠️ desktop, sin confirmar — `Sprout` → `CircleDot` |
| DEF-044 | Al cambiar de vault siguen abiertas las pestañas del vault anterior | ambas (frontend) | ⬜ pendiente — bloque F de la agrupación |
| DEF-045 | `[[destino\|alias]]` dentro de una tabla: o rompe la tabla, o rompe el grafo | ambas (frontend) | ⬜ pendiente — causa raíz ya identificada |
| DEF-046 | Lo eliminado no aparece en la papelera, ni en la de Windows: no hay recuperación | desktop | 🛠️ corregido, sin confirmar — la limpieza del indexador ya no borra lo que está en la papelera |
| DEF-047 | El menú contextual se sale de la pantalla en los archivos de abajo | ambas (frontend) | ⬜ pendiente |
| DEF-048 | Falta margen inferior en toda la app: el contenido queda pegado al borde | ambas (frontend) | ⬜ pendiente |
| DEF-049 | El ancho de tabulación no cambia nada en los documentos ya escritos | ambas (frontend) | ⬜ pendiente — **hueco de diseño de `FUN-S-02`**, no un fallo de código |
| DEF-050 | Al cambiar la tabulación desaparecen los indicadores de plegado en lectura | ambas (frontend) | ⬜ pendiente — regresión de `FUN-S-02` |

## Notas por bug

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

  > [!warning] No arreglarlo tocando solo el código
  > La corrección honesta empieza por revisar [[Version 1.5.0]] y la entrada de `FUN-S-02`:
  > hay que decidir **qué significa** "ancho de tabulación" en un editor de markdown antes
  > de volver a implementarlo. Si se arregla solo el síntoma, se vuelve a entregar algo que
  > técnicamente cumple y en la práctica no.

- **DEF-050 — regresión de `FUN-S-02`, sin causa raíz confirmada.** Lo que se descartó
  leyendo el código: `attachHeadingFolds` (`lib/editor/headingFold.ts`) **es idempotente**
  para las flechas —salta las cabeceras que ya tienen una (línea 79)—, así que volver a
  ejecutarlo no debería borrarlas.
  Dos pistas para quien lo tome: (a) el `Set` de secciones plegadas se **recrea** en cada
  llamada, y los manejadores de clic viejos siguen apuntando al anterior — reejecutarlo
  resetea el estado de plegado; (b) `NoteEditor` ahora está suscrito a `tabWidth`, así que
  cambiarlo **re-renderiza el componente**, y el efecto que llama a `attachHeadingFolds`
  depende de `vaultNotas`/`vaultCarpetas`, que pueden traer referencias nuevas. Hay que
  reproducirlo antes de tocar nada.

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
  - *Tampoco está en la papelera de Windows* → `borrar_definitivo` (`vault_fs.rs:195`) usa
    `std::fs::remove_file`, que borra de verdad. Es una decisión de diseño no declarada, no
    un fallo: si se quiere que vaya a la papelera del sistema hace falta un crate que la
    use. Como red de seguridad **la papelera propia ya alcanza**, siempre que funcione.

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
- **DEF-018** (desktop `ae3f3df`, web `c3109c1`) — ⏳ PENDIENTE DE EVALUACIÓN (el
  usuario aún no confirmó en runtime): el progreso de export pasó de estado local de
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
