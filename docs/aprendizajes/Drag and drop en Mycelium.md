# Drag and drop en Mycelium

En Mycelium conviven **tres sistemas de arrastre** distintos. Casi todos los bugs de
drag & drop salieron de no tener presente cuál estaba en juego. Parte de
[[Aprendizajes tecnicos]].

| Sistema | Dónde | Mecanismo |
|---|---|---|
| **@dnd-kit** (por puntero) | Árbol del explorador: mover notas y carpetas | `PointerSensor`, `DndContext` **dentro** de `ExplorerPanel` |
| **Drag nativo HTML5** | Pestañas del workspace: reordenar, mover de panel, anclar al lateral | `draggable` + `dataTransfer` + `dragging` en el store |
| **Drop del SO** | Arrastrar archivos desde el explorador de Windows | Eventos nativos con `dataTransfer.files` |

> [!warning] El `DndContext` no cubre el área de trabajo
> Vive dentro del explorador. Por eso un arrastre iniciado en el árbol **no** llega a
> los paneles del editor por los medios normales: hay que tender un puente explícito.

## El ghost del `DragOverlay` tapa el DOM

**Caso**: `DEF-023 Parte 2` — arrastrar un archivo del árbol al área de trabajo para
dividir el panel. Tres intentos fallidos, cada uno con su lección:

1. **`elementFromPoint` al soltar** → no funcionó. En el WebView de Tauri devuelve el
   *ghost* del `DragOverlay` (o el editor), nunca la zona de drop. Ver
   [[Tauri y el WebView]].
2. **Limpiar el estado antes del hit-test** → error de orden: al poner
   `draggingNota = null` **al inicio** de `onDragEnd`, zustand desmontaba las zonas de
   drop de forma **síncrona** y el hit-test posterior ya no las encontraba. Ver
   [[Estado con Zustand]].
3. **Overlay propio escuchando `pointermove`** → el ghost también bloquea esos
   eventos; el resaltado aparecía y se congelaba.

**Solución que funcionó**: no depender del DOM bajo el puntero. Usar el **tracking
propio de dnd-kit** (`activatorEvent + delta`, lo mismo que alimenta su detección de
colisiones) y resolver el panel por **geometría** (`getBoundingClientRect()` de los
cuerpos marcados con `data-pane-id`, con un umbral de 56 px para distinguir borde de
centro). `onDragMove` publica la zona para el previo visual; `onDragEnd` la recalcula
y actúa.

> [!important] Regla
> Con `@dnd-kit` + `DragOverlay`, **el DOM bajo el puntero no es observable**. Usá las
> coordenadas que da la propia librería y geometría de elementos, no hit-testing.

## La detección de colisiones usa rects, no el puntero

**Caso**: al soltar un archivo contra el borde izquierdo de un panel —pegado al
explorador— se ejecutaban **dos acciones a la vez**: se abría en el panel *y* se movía
de carpeta en el árbol.

**Causa**: la detección de colisiones de dnd-kit resuelve la carpeta destino por el
**rectángulo del elemento arrastrado/ghost**, que seguía solapando el explorador,
aunque el puntero ya estuviera sobre el panel.

**Fix**: que la decisión **siga al puntero**. La colisión personalizada
(`dropMasProfundo`) devuelve `[]` cuando `pointerCoordinates` cae sobre un panel; así
el explorador no propone ningún destino y solo actúa el área de trabajo.

## El editor cancela el arrastre

**Caso**: el resaltado de la zona de drop aparecía y **desaparecía en menos de un
segundo**, y al soltar no pasaba nada.

**Causa**: al mover el puntero al centro del panel llegaba a **CodeMirror**, que
iniciaba una selección de texto y disparaba `pointercancel` → dnd-kit **abortaba** el
arrastre. El drag ya estaba muerto antes de soltar.

**Mitigación**: cubrir el área con un overlay durante el arrastre (o resolver todo por
geometría, como se terminó haciendo).

> [!tip] Diagnóstico
> "El feedback aparece y se va solo" = evento **cancelado**, no CSS. Buscá quién más
> escucha el puntero en esa zona (editor, textarea, iframe).

## Drops del sistema operativo: Tauri los intercepta

Arrastrar archivos desde el explorador de Windows no hacía **nada** (ni feedback ni
importación) porque Tauri captura los drops de forma nativa antes de que lleguen al
webview. Se resuelve con `dragDropEnabled: false` en `tauri.conf.json` — detalle en
[[Tauri y el WebView]].

## Casos resueltos con estos hallazgos

- `DEF-034` / `DEF-032`: ghost que sigue al puntero al arrastrar; adjuntar un
  `.excalidraw` externo.
- `DEF-036` / `DEF-036b`: importar donde se suelta (no en la carpeta seleccionada) y
  feedback del destino.
- **Mover a la carpeta correcta**: la colisión `dropMasProfundo` elige la zona **más
  pequeña** bajo el puntero (la carpeta más profunda); la raíz solo gana si no hay
  ninguna carpeta debajo. Antes, soltar en el hueco de una carpeta mandaba el archivo
  a la raíz.
- `DEF-023 P2` y `P3`: arrastrar del árbol al área de trabajo y anclar pestañas en el
  panel lateral — ver [[def-023-visor-sidebar]].

## Relacionadas

- [[Aprendizajes tecnicos]] — mapa del área.
- [[Estado con Zustand]] — por qué el orden de `set()` importaba en el hit-test.
- [[Tauri y el WebView]] — límites del WebView que afectan al arrastre.
- [[CodeMirror y la vista en vivo]] — el editor como cancelador del drag.
