# Progreso de bugs (docs/Bugs_errores_y_defectos.md)

Flujo: se arregla **uno a la vez**, primero en `desktop-tauri` (versión en uso),
el usuario **confirma en la app**, luego se refleja en `web-cloud` (salvo que el
bug sea específico de un sistema). No se avanza al siguiente hasta confirmar.

Estados: ⬜ pendiente · 🔧 en curso · ✅ confirmado (desktop) · 🌐 reflejado en web

| Bug | Descripción corta | Alcance | Estado |
|---|---|---|---|
| DEF-015 | Colapsar títulos `#` también en vista de lectura | ambas (frontend) | ✅ (falta 🌐 web) |
| DEF-015b | Ícono de plegar/desplegar personalizado y centrado vertical | ambas (frontend) | ✅ (falta 🌐 web) |
| DEF-018 | Se pierde el progreso de exportar vault al cerrar el menú | ambas (frontend) | ⬜ |
| DEF-021 | Callout con tipo "contamina" las `>` siguientes separadas | ambas (frontend) | ⬜ |
| DEF-022 | No se renderizan callouts anidados en edición en vivo | ambas (frontend) | ⬜ |
| DEF-023 | Explorer estilo Obsidian: paneles compartidos/archivos redimensionables con scroll propio | ambas (frontend) | ⬜ |
| DEF-024 | Opciones al exportar PDF (fondo blanco, colores, callouts, estilos) | ambas | ⬜ |
| DEF-026 | Caret no visible en el editor CSS | ambas (frontend) | ⬜ |
| DEF-030 | El grafo no actualiza colores al cambiar de tema | ambas (frontend) | ⬜ |
| DEF-031 | Problemas de selección/scroll al trabajar con tablas | ambas (frontend) | ⬜ |
| DEF-032 | No se adjunta un `.excalidraw` externo en un markdown | ambas (frontend) | ⬜ |
| DEF-034 | Falta "sombra" (ícono+nombre) siguiendo el puntero al arrastrar | ambas (frontend) | ⬜ |
| DEF-036 | Import cae en el path seleccionado, no donde se soltó | ambas (frontend) | ⬜ |
| DEF-036b | Falta feedback del lugar donde se sueltan los archivos | ambas (frontend) | ⬜ |
| DEF-037 | Conflictos de scroll/selección al abrir el buscador en el archivo | ambas (frontend) | ⬜ |
| DEF-038 | Límite de zoom-out del grafo insuficiente con muchos nodos | ambas (frontend) | ⬜ |

## Notas por bug
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
