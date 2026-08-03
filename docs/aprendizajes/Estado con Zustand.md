# Estado con Zustand

Mycelium maneja el estado de UI con **zustand**, varios stores con `persist`. Estas
son las trampas que aparecieron al usarlo. Parte de [[Aprendizajes tecnicos]].

## `set()` puede desmontar DOM en el mismo handler

**Caso**: en el arrastre del explorador al área de trabajo, el hit-test posterior
"no encontraba" las zonas de drop.

**Causa**: zustand se integra con React vía `useSyncExternalStore`. Un `set()` que
cambia **qué se renderiza** aplica el re-render de forma **síncrona**: al ejecutar
`setDraggingNota(null)` al inicio del handler, las zonas de drop se desmontaban ahí
mismo y el `elementFromPoint` de dos líneas más abajo ya no las veía.

> [!important] Regla
> Si un handler necesita **leer el DOM** que depende de un estado, hacelo **antes** de
> llamar a `set()`. El re-render no espera al final de tu función.

Ver el caso completo en [[Drag and drop en Mycelium]].

## Persistir solo lo que tiene sentido persistir

Patrón usado en todos los stores: `persist` + `partialize` para excluir el estado
**transitorio**.

- `tabsStore`: persiste `root`, `activePaneId`, `closedHistory`. **No** persiste
  `dragging`, `draggingNota`, `notaDropTarget`, `draggingSidebarNota` — un arrastre a
  medio hacer no debe sobrevivir a un reinicio.
- `terminalStore`: persiste sesiones (shell, cwd, título, scrollback) y preferencias;
  el proceso vivo no es serializable (ver [[terminal-integrada]]).
- `panelLayoutStore`: usa `version` + `migrate` para descartar valores viejos cuando
  cambia un default (p. ej. el ancho del panel derecho de 280 → 340).

> [!tip] Cuando cambies un default persistido
> Subí `version` y escribí un `migrate`. Si no, los usuarios existentes se quedan con
> el valor viejo guardado y "el cambio no se ve".

## Ids sentinela en lugar de tipos paralelos

El árbol de pestañas guarda `notaId`, pero no todas las pestañas son notas. En vez de
agregar un campo `tipo`, se usan **ids sentinela**:

- `graph:global` → la pestaña del grafo.
- `terminal:<uuid>` → una consola integrada.

Esto mantiene un solo tipo `Tab` y permite reutilizar toda la maquinaria de paneles.
El precio: cada lugar que trate a las pestañas como notas debe **excluir los
sentinela**. Los tres que importaron:

1. `openNote`: las terminales no pueden ser pestaña de **preview** (si no, abrir otra
   nota reemplaza la pestaña y **mata la sesión**).
2. `reconcileNotes`: al descartar pestañas de notas borradas, conservar los sentinela.
3. `sidebarViewerStore.reconcile`: lo mismo para las pestañas ancladas en el lateral.

> [!warning] Al agregar un tipo nuevo de pestaña
> Revisá esos tres puntos. Un olvido se manifiesta como "la pestaña desaparece sola"
> o "la sesión se reinicia al abrir otra nota".

## Estado que vive fuera del store

No todo va al store. Las instancias de CodeMirror y de xterm viven en un **caché a
nivel de módulo** (`Map` por id), porque deben sobrevivir al *remount* del componente
cuando la pestaña se mueve de panel. El store guarda solo los **datos**; el objeto
vivo se recupera del caché.

Ver [[Terminal integrada - PTY y xterm]] y
[[CodeMirror y la vista en vivo]].

## Consecuencia inesperada: bajar de versión

Desde la [[Version 1.4.0]] se puede **instalar una versión anterior** desde el modo
avanzado ([[autoactualizacion]] § 4.3). Una app vieja se encuentra entonces un estado
persistido **más nuevo**, que es el mismo desajuste al revés: sin `migrate`, Zustand lo
**descarta** y el usuario pierde las pestañas abiertas y parte de las preferencias.

No es catastrófico —las notas son archivos de texto y el índice SQLite se reconstruye—,
pero es la razón por la que el diálogo de confirmación lo **avisa antes** de instalar. Y
es un argumento más para escribir `migrate` en vez de solo subir la versión: cada store
que lo tenga es un store que sobrevive al viaje en las dos direcciones.

## Relacionadas

- [[Version 1.4.0]] — donde esto pasó de ser un tropiezo entre releases a un aviso en la UI.
- [[Aprendizajes tecnicos]] — mapa del área.
- [[Drag and drop en Mycelium]] — donde se descubrió el problema de orden.
- [[Arquitectura de Mycelium]] — qué stores existen y qué rol cumplen.
