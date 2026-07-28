# Progreso de bugs (docs/Bugs_errores_y_defectos.md)

Flujo: se arregla **uno a la vez**, primero en `desktop-tauri` (versión en uso),
el usuario **confirma en la app**, luego se refleja en `web-cloud` (salvo que el
bug sea específico de un sistema). No se avanza al siguiente hasta confirmar.

Estados: ⬜ pendiente · 🔧 en curso · 🛠️ implementado (sin confirmar) · ⏳ pend. evaluación · ✅ confirmado (desktop) · 🌐 reflejado en web

| Bug | Descripción corta | Alcance | Estado |
|---|---|---|---|
| DEF-015 | Colapsar títulos `#` también en vista de lectura | ambas (frontend) | ✅ 🌐 |
| DEF-015b | Ícono de plegar/desplegar personalizado y centrado vertical | ambas (frontend) | ✅ 🌐 |
| DEF-018 | Se pierde el progreso de exportar vault al cerrar el menú | ambas (frontend) | 🛠️🌐 ⏳ pend. evaluación |
| DEF-021 | Callout con tipo "contamina" las `>` siguientes separadas | ambas (frontend) | ✅ 🌐 |
| DEF-022 | No se renderizan callouts anidados en edición en vivo | ambas (frontend) | ✅ 🌐 |
| DEF-023 | Explorer estilo Obsidian: paneles redimensionables (P1) + arrastrar al área de trabajo (P2) + explorador como visor con pestañas (P3) | ambas (frontend) | P1 ✅🌐 · P2 ✅🌐 · P3 ✅🌐 |
| DEF-024 | Opciones al exportar PDF (fondo blanco, colores, callouts, estilos) | ambas (difiere) | ✅🌐 |
| DEF-026 | Caret no visible en el editor CSS | ambas (frontend) | ✅ 🌐 |
| DEF-030 | El grafo no actualiza colores al cambiar de tema | ambas (frontend) | ✅ 🌐 |
| DEF-031 | Problemas de selección/scroll al trabajar con tablas | ambas (frontend) | ✅ 🌐 |
| DEF-032 | No se adjunta un `.excalidraw` externo en un markdown | ambas (frontend) | ✅ 🌐 (ya estaba) |
| DEF-034 | Falta "sombra" (ícono+nombre) siguiendo el puntero al arrastrar | ambas (frontend) | ✅ 🌐 (ya estaba) |
| DEF-036 | Import cae en el path seleccionado, no donde se soltó | ambas (frontend) | ✅ 🌐 |
| DEF-036b | Falta feedback del lugar donde se sueltan los archivos | ambas (frontend) | ✅ 🌐 |
| DEF-037 | Conflictos de scroll/selección al abrir el buscador en el archivo | ambas (frontend) | ✅ 🌐 |
| DEF-038 | Límite de zoom-out del grafo insuficiente con muchos nodos | ambas (frontend) | ✅ 🌐 |

## Notas por bug
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
