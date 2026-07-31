# Versión 1.0.0

**Primera versión final** de Mycelium, consolidada el 2026-07-28 en **ambas líneas**:
`desktop-tauri` (`17eceb5`) y `web-cloud` (`5a9e4f4`).

## Qué significó

El hito no fue una funcionalidad nueva, sino **cerrar el backlog de bugs
preexistentes** y declarar el producto terminado en su primera forma completa:

- Todos los `DEF-*` reportados en [[Bugs_errores_y_defectos]] resueltos y reflejados en
  las dos versiones (detalle y trazabilidad en [[bugs-progreso]]).
- Versión visible en la app: se agregó "Mycelium v1.0.0" al pie del drawer de
  Configuración, desde `APP_VERSION` (ver [[Versionado del sistema]]).
- **Instaladores** de escritorio generados por primera vez (ver
  [[Generar instaladores desktop]]):
  - `Mycelium_1.0.0_x64_en-US.msi` (9.6 MB)
  - `Mycelium_1.0.0_x64-setup.exe` (8.3 MB)
  - preservados en `installers/v1.0.0/`.

## Lo que entró en el camino a 1.0.0

Resumen de las áreas cerradas antes del release. La lista completa con IDs está en
[[bugs-progreso]].

- **Editor / vista en vivo**: plegado de títulos también en lectura, chevron propio
  centrado, callouts que ya no "contaminan" las citas siguientes, callouts **anidados**,
  caret visible en el editor CSS, y el desfase del gutter con tablas (el bug más difícil
  del lote — ver [[CodeMirror y la vista en vivo]]).
- **Grafo**: colores que se actualizan al cambiar de tema, más zoom-out disponible.
- **Explorador y drag & drop**: importar donde se suelta, feedback del destino, mover a
  la carpeta correcta, adjuntar `.excalidraw` externos, ghost que sigue al puntero (ver
  [[Drag and drop en Mycelium]]).
- **Explorador estilo Obsidian** (`DEF-023`, tres partes): paneles redimensionables,
  arrastrar archivos al área de trabajo y el panel lateral como visor con pestañas
  ancladas (ver [[def-023-visor-sidebar]]).
- **Exportación PDF con opciones** (`DEF-024`): fondo blanco, colores, callouts,
  estilos — implementada distinto en cada versión (cliente vs backend).
- **Progreso de exportación global** (`DEF-018`): ya no se pierde al cerrar el menú.

## Después de 1.0.0

Desktop siguió avanzando con la línea de IA, que web no tiene:
[[terminal-integrada]], [[ia-framework-vault]], [[mycignore]]. Ver
[[Diferencias funcionales aceptadas entre versiones]] y [[Estado del proyecto]].

## Relacionadas

- [[Estado del proyecto]] — situación actual, posterior a este release.
- [[Versionado del sistema]] — cómo se numeró y dónde vive la versión.
- [[bugs-progreso]] — la trazabilidad completa de los bugs cerrados.
- [[Generar instaladores desktop]] — cómo se empaquetó.
