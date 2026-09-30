# Skills de IA para las herramientas del vault

`FUN-L-26` · **solo desktop** (el framework de IA no existe en web) · pedida por el usuario el
2026-09-30 · amplía [[ia-framework-vault]] (`FUN-L-08`)

## Qué se pide

Que la IA que trabaja sobre el vault (Claude Code con el framework que genera Mycelium)
**conozca y sepa usar** cada herramienta de Mycelium, no solo que sepa que existe. En
palabras del usuario: *«no solo importa poner símbolos y texto, importa mucho el poder
manejar bien las flechas y conexiones, entender el espacio y las coordenadas donde se
ubican los elementos»*.

Hoy el framework (`1.6.0`) nombra los formatos y da un ejemplo mínimo de `.base` y de
`.canvas` dentro de la skill `mycelium-vault`; `.drawio` y `.excalidraw` figuran como «no
editar a mano», y el calendario no aparece.

## Decisiones del usuario (2026-09-30)

| Tema | Decisión |
|---|---|
| Formato | **Una skill por herramienta**, cada una con el formato, la geometría y recetas |
| Herramientas | `.drawio`, `.canvas`, `.base`, `.excalidraw`, Esporas y el calendario |
| Calendario | **Solo lectura**: la IA consulta qué hay agendado; no crea ni edita recordatorios |
| Diccionarios del corrector | Fuera de alcance |
| Cómo se prueba | **Evaluación ciega**: un agente que solo lee la skill genera archivos reales a partir de pedidos; se abren en Mycelium con Playwright, se capturan y se verifican flechas, superposiciones y texto; la skill se corrige hasta que salgan bien. El usuario confirma al final con sus propios pedidos |

## Las skills

Van en `.claude/skills/<nombre>/SKILL.md`, generadas por `lib/ia/framework.ts` como las dos
que ya existen. Cada una responde, para su formato: **qué es**, **cuándo usarlo** (frente a
los otros), **el formato** (lo que Mycelium dibuja de verdad, no el estándar entero),
**la geometría** (sistema de coordenadas, tamaños, cómo se engancha una flecha, cómo
evitar superposiciones, cómo calcular una disposición legible) y **recetas** probadas
(organigrama, flujo, mapa de ideas, ER…), más **cómo leer y modificar** un archivo ajeno
sin romperlo.

| Skill | Formato | Lo difícil que tiene que enseñar |
|---|---|---|
| `mycelium-drawio` | XML de mxGraph | `mxCell` vértices y aristas, `parent`, `source`/`target`, `mxGeometry`, estilos y puertos (`exitX/entryX`), texto que entre, capas y páginas, archivos comprimidos |
| `mycelium-canvas` | JSON Canvas | coordenadas y tamaños, `fromSide`/`toSide` coherentes con la posición relativa, grupos que contengan a sus nodos, colores, nodos `file` por ruta |
| `mycelium-excalidraw` | JSON de Excalidraw | flechas **enlazadas** (`startBinding`/`endBinding` y `boundElements` recíprocos), puntos relativos, texto dentro de contenedores (`containerId`), ids y `seed` |
| `mycelium-base` | YAML | filtros, orden, columnas y vistas que Mycelium soporta; sale de `mycelium-vault` |
| `mycelium-esporas` | Notas plantilla | variables, dónde viven, cómo crear una; sale de `mycelium-vault` |
| `mycelium-calendario` | `.mycelium/recordatorios.json` | **leer**: ocurrencias, repeticiones, completados; nunca escribir |

`mycelium-vault` queda como referencia de la sintaxis de notas y remite a cada skill;
`CLAUDE.md` las lista en «Tus herramientas aquí» y actualiza la tabla de «Qué puede haber
en el vault»: `.drawio` y `.excalidraw` pasan a **editables con su skill**.

> [!important] Excepción a «No toques `.mycelium/`»
> El calendario vive en `.mycelium/recordatorios.json`. La regla dura se amplía: **leer**
> ese archivo está permitido; escribir en `.mycelium/`, no.

## Lo que la app tiene que hacer

Hoy solo las notas y las bases se recargan cuando el archivo cambia en disco. Un `.canvas`,
un `.drawio` o un `.excalidraw` abiertos en una pestaña **no se enteran** de lo que escribe
la IA: el usuario tiene que cerrarlos y reabrirlos, y si guarda antes, pisa lo de la IA.

- **Recargar desde disco** las pestañas de `.canvas`, `.drawio` y `.excalidraw` cuando el
  watcher avisa que su archivo cambió, con el mismo cuidado que el editor de notas
  ([[bugs-progreso]] `DEF-117`): no recargar si hay cambios propios sin guardar, e ignorar
  el eco del guardado propio.
- El framework dice hoy «Mycelium detecta tus cambios en disco y refresca la UI solo»:
  después de esto, será cierto también para estos formatos.

El calendario **no** cambia: es de solo lectura para la IA.

## Cómo se prueba

1. **Validadores estáticos** por formato (scripts headless en `frontend/scripts/`): parsean
   el archivo y comprueban lo que se puede medir sin mirar — cada flecha apunta a elementos
   que existen, los enlaces son recíprocos, los extremos caen sobre el borde de su forma,
   no hay formas superpuestas, el texto cabe en su caja según su tamaño de fuente, los
   grupos contienen a sus hijos.
2. **Evaluación ciega**: por skill, un agente nuevo que **solo** lee la skill resuelve
   pedidos realistas (p. ej. «un diagrama ER de estas tres notas», «un flujo de decisión
   de diez pasos», «un organigrama de doce personas») y deja los archivos en un vault de
   prueba. Los validadores corren sobre lo generado.
3. **Revisión visual** en la app real (Tauri + WebView2 vía CDP, como en
   [[Ver la UI con Playwright]]): se abre cada archivo, se captura y se revisa. Lo que
   falle vuelve a la skill como regla o como receta, y se repite.
4. **El usuario confirma** con sus propios pedidos.

## Criterios de aceptación

1. Cada skill existe, se genera con el framework y `CLAUDE.md` la lista.
2. Para cada formato, los pedidos de la evaluación ciega producen archivos que **pasan el
   validador** y que **se ven bien en Mycelium**: sin flechas sueltas, sin cajas
   encimadas, sin texto cortado.
3. La IA puede **modificar** un archivo existente (agregar un nodo, mover una rama)
   conservando lo que no entiende.
4. Con el archivo abierto en una pestaña, lo que escribe la IA aparece solo.
5. Consultada por el calendario («¿qué tengo esta semana?»), la IA responde leyendo
   `recordatorios.json`, con las repeticiones bien expandidas, y no lo modifica.
6. `FRAMEWORK_IA_VERSION` sube a `1.7.0` (minor: la IA gana capacidades nuevas), con su
   entrada en el historial.

## Plan de ejecución

| Parte | Qué | Cómo |
|---|---|---|
| A | Recarga desde disco de canvas, draw.io y excalidraw | Un agente, rama `feat/ia-skills-recarga-desktop` |
| B | Investigación + borrador de skill + validador, por formato | Agentes en paralelo, **sin abrir la app** (el formato real que dibuja Mycelium se lee del código) |
| C | Evaluación ciega + revisión visual | En serie: una sola app abierta por vez (la máquina se queda sin memoria con dos) |
| D | Integrar las skills al framework, `1.7.0`, templates de `CLAUDE.md` | Orquestador |

## Relacionadas

- [[ia-framework-vault]] — el framework: qué genera y cómo se versiona.
- [[calendario-recordatorios]] — el formato de `recordatorios.json`.
- [[Ver la UI con Playwright]] — cómo se maneja la app real desde un script.
- [[BACKLOG]] — `FUN-L-26`.
