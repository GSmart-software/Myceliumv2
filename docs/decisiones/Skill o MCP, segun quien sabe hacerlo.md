# Skill o MCP, según quién sabe hacerlo

**Decisión** · vigente · 2026-10-01 · `FUN-L-09` · reemplaza dos filas de [[ia-skills-herramientas]]

Para cada cosa que la IA del vault puede hacer en Mycelium hay dos caminos: una **skill**
(le enseña a hacerlo con sus herramientas de siempre: leer, escribir, ejecutar) o una
herramienta del **MCP** (Mycelium lo hace, y la IA solo lo pide). El usuario fijó el
criterio el 2026-10-01: **lo que es valioso por MCP va por MCP; lo que es valioso como
skill se queda como skill.**

> [!info] Palabras del usuario
> *«Las decisiones de que la IA no toque el calendario y el diccionario quiero que lo
> reemplacemos con esto según tus sugerencias. Lo que es valioso por MCP, hazlo; lo que es
> valioso con skill, que se quede como skill. Importante, el calendario no lo modifica si no
> es por MCP, sí lo puede leer sin MCP, pero siempre preferible el MCP.»*

## El criterio

- Una **skill es conocimiento**. Conviene cuando el trabajo es **contenido** que la IA
  piensa y escribe: un diagrama, un lienzo, una tabla, una nota desde una Espora. Lo
  difícil es decidir qué poner y dónde, y eso lo hace el modelo; pasarlo por una herramienta
  solo mueve el mismo texto de un archivo a un parámetro.
- Un **MCP es una capacidad**. Conviene cuando la acción tiene **reglas, estado o efectos
  que la IA no ve**: un archivo interno de la app, algo que la app tiene que agendar o
  mostrar, una reparación que solo la app sabe hacer.

La evaluación del MCP de búsqueda lo mostró del otro lado: buscar es algo que el modelo ya
hace bien con `grep`, y el MCP no le ganó en exactitud en ningún vault
([[MCP de Mycelium - tesina, protocolo]] § 9).

## Qué va por dónde

| Qué | Por | Por qué |
|---|---|---|
| **Modificar el calendario** | **MCP, y solo MCP** | Vive en `.mycelium/recordatorios.json`; la app no vuelve a leerlo si cambia (no lo agendaría, y al guardar pisaría lo de la IA); el formato tiene ids, versión, paleta, repeticiones y ocurrencias atendidas que un JSON a mano rompe |
| **Leer el calendario** | MCP, preferido; la skill si el MCP no está | El MCP devuelve las ocurrencias calculadas por la misma lógica que usa la app; el script de la skill la reimplementa |
| **Diccionario del vault** | **MCP** | Vive en `.mycelium/`; antes estaba fuera de alcance |
| Renombrar y mover | MCP | La app repara los enlaces entrantes; un `mv` los rompe |
| Papelera | MCP | Archivo interno con estado |
| Abrir algo en pantalla, saber qué está abierto | MCP | No hay archivo que lo haga |
| `.drawio`, `.excalidraw`, `.canvas`, `.base`, Esporas | **Skill** | Contenido; el modelo lo escribe bien con la skill ([[ia-skills-herramientas]]) |

> [!important] Cambia la regla dura de `.mycelium/`
> Con la decisión del 2026-09-30 la IA podía **leer** `.mycelium/recordatorios.json` y no
> escribir nada en `.mycelium/`. Eso sigue: **escribir en `.mycelium/` nunca**, ni el
> calendario ni el diccionario. Lo que cambia es que ahora hay un camino para modificarlos,
> y es el MCP.

## Lo que reemplaza

- [[ia-skills-herramientas]], «Calendario: **solo lectura**» → la IA lo lee (preferible por
  MCP) y lo **modifica por MCP**.
- [[ia-skills-herramientas]], «Diccionarios del corrector: fuera de alcance» → el del vault,
  **por MCP**.

## Relacionadas

- [[mcp-control]] — la spec de lo que se construye con esto.
- [[MCP de Mycelium - control]] — el diseño de septiembre, del que sale.
- [[Mycelium como memoria de la IA]] — la otra mitad: la memoria sigue siendo `grep` y las
  skills.
