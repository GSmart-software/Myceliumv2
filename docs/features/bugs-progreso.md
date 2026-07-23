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
| DEF-023 | Explorer estilo Obsidian: paneles compartidos/archivos redimensionables con scroll propio | ambas (frontend) | ⬜ |
| DEF-024 | Opciones al exportar PDF (fondo blanco, colores, callouts, estilos) | ambas | ⬜ |
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
