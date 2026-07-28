# DEF-023 P3 — El explorador como visor con pestañas (estilo Obsidian)

## Objetivo
La sección **Explorador** del panel izquierdo debe poder alojar **documentos** además
del árbol de archivos, con una **barra de pestañas** arriba:
- Pestaña permanente **Explorador** (ícono de carpeta): muestra el árbol
  (Archivos/Compartido + toolbar). **No se puede cerrar.**
- Una pestaña por documento **anclado**; cada una con título y botón de cerrar.

La seleccionada ocupa el panel (árbol o documento).

## Cómo se ancla un documento
- **NO** se arrastra un archivo del árbol al propio explorador (eso sigue siendo
  "mover dentro del explorador").
- Se arrastra una **pestaña ya abierta del área de trabajo** (drag nativo de la
  `TabBar`, `tabsStore.dragging`) y se suelta sobre el panel del explorador → se
  **ancla** como pestaña del explorador y se **quita** del pane de origen (se mueve).

## Visor
- Por defecto **solo lectura**: render de `renderMarkdown` en `mic-preview
  mic-layout-read`, con Mermaid/Excalidraw y actualización en vivo (mismo patrón que
  `LinkedPreviewPane`).
- Botón **Ver/Editar** por documento: al editar, monta el `NoteEditor` (paneId
  sintético `sidebar`); al volver a ver, render de solo lectura.

## Arquitectura (todo compartido → reflejo trivial; NO toca `ExplorerPanel`)
- `stores/sidebarViewerStore.ts` (nuevo): `tabs: string[]` (notaIds anclados),
  `activeTab: "explorer" | notaId`, `editing: Record<notaId, boolean>`;
  acciones `dock`, `cerrar`, `activar`, `toggleEdit`. Persistido (`mic-sidebar-viewer`).
- `components/explorer/ExplorerDock.tsx` (nuevo): barra de pestañas + zona de drop de
  pestañas del workspace + render de `ExplorerPanel` (árbol) o `SidebarNoteView`.
- `components/explorer/SidebarNoteView.tsx` (nuevo): visor read-only + toggle editar.
- `components/workspace/LeftPanel.tsx`: en la sección `explorer` renderiza
  `ExplorerDock` (sin el `<h2>` porque el dock aporta su propia cabecera de pestañas).

## Relación con DEF-023 P2 (ya hecho)
Se mantiene arrastrar un archivo del árbol al **área de trabajo central** (divide/abre
ahí). Esta P3 es independiente: fuente = pestaña del workspace; destino = explorador.

## Criterios de aceptación
1. La sección Explorador muestra una barra de pestañas con "Explorador" (carpeta) fija.
2. Arrastrar una pestaña del workspace al explorador la ancla ahí y la quita del origen.
3. La pestaña Explorador nunca se cierra; las de documentos sí.
4. El documento anclado se ve en solo lectura y permite alternar a edición.
5. Cambiar de pestaña alterna entre árbol y documento. Se recuerda al reabrir.
