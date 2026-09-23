# MCP de Mycelium — encuadre del diseño

**Planificación** · abierta el 2026-09-23 · `FUN-L-09` `IA-MCP-MYCELIUM`

Esta nota es el **terreno común** de un diseño que se reparte en tres. No decide nada: fija
los hechos verificados, las restricciones y el reparto, para que las tres partes no se
contradigan. Las decisiones viven en las notas hijas.

> [!important] Solo se planifica
> Pedido del usuario (2026-09-23): *«Nuestro objetivo por el momento es solo planificar, no
> construir»*. Nada de código. Cada decisión, justificada; los diagramas, en las notas.

## 1. Los dos objetivos

1. **Memoria**: dar a Claude Code acceso a la memoria documental del vault —encontrar
   información **rápido y barato**, mejor que con `grep`—.
2. **Control**: que Claude Code pueda **operar Mycelium**, no solo escribir archivos. Ya no
   «crear una nota», sino manejar las herramientas de la app.

Y una tercera pieza que los mide: **cómo evaluamos** si el MCP mejora algo, con números
comparables **con MCP y sin MCP**.

## 2. Qué hay hoy, verificado en el código

> [!warning] Las conexiones entre archivos **no están almacenadas**
> Es la corrección más importante del encuadre. El índice **no tiene tabla de enlaces**:
> `lib/db/grafo.ts` carga **todos** los contenidos del vault en una sola consulta y escanea
> los `[[…]]` con una expresión regular **cada vez** que se pide el grafo o los backlinks.
> Sirve para dibujar el grafo; como base de un MCP es el peor caso: recalcular el vault
> entero para contestar «quién apunta acá».

El índice SQLite (`frontend/lib/db/indexer.ts`, vía `tauri-plugin-sql`) tiene:

| Tabla | Qué guarda |
|---|---|
| `notas` · `contenidos` · `carpetas` | El árbol y el texto |
| `notas_fts` (FTS5) | `nota_id UNINDEXED, titulo, contenido` — búsqueda léxica |
| `propiedades` | Frontmatter YAML, **una fila por elemento** de lista (`FUN-M-04`) |
| `papelera` · `diagramas` · `css_snippets` | Lo demás |

Otros hechos que condicionan el diseño:

- **Solo se indexa `.md`.** Un `.excalidraw`, `.base`, `.canvas` o `.drawio` existe en el
  árbol pero su contenido **no** entra al FTS.
- **El indexado corre en el frontend** (TypeScript). Moverlo a Rust es `FUN-L-10`, pendiente.
- **`.mycignore`** decide qué se indexa (`FUN-M-11`).
- **Un vault se abre en una sola ventana** (`FUN-L-16`) porque dos indexadores sobre el
  mismo índice se pisan. Cualquier proceso nuevo que escriba el índice hereda ese problema.
- **La terminal integrada** corre con el cwd en el vault: es donde vive hoy el asistente.
- **El framework de IA** (`FUN-L-08`, hoy `1.6.0`) genera `CLAUDE.md`, dos skills y seis
  comandos `/vault-*` dentro del vault. Es el lugar natural donde registrar el MCP.
- Versión actual: **desktop 2.1.0**, publicada el 2026-09-23.

## 3. Las dos referencias que pidió estudiar el usuario

Resumen de lo que hace cada una, para no repetir el estudio tres veces. **Son insumo, no
molde**: lo que se copie hay que justificarlo contra *nuestro* caso.

### engram (Gentleman-Programming)

- **SQLite + FTS5**, un archivo (`~/.engram/engram.db`), un binario, sin dependencias.
  Local por defecto; la nube es opcional.
- **Recuperación progresiva**, que es su idea más aprovechable: `mem_search` devuelve
  **previews, no el registro completo**; el detalle se pide aparte (`mem_get_observation`,
  `mem_timeline`). El agente paga tokens solo por lo que decide abrir.
- **Herramientas agrupadas por intención**, no por tabla: confirmar proyecto, buscar,
  inspeccionar, guardar, cerrar sesión, diagnosticar (`mem_doctor`, `mem_judge`).
- **`topic_key` estable** (`architecture/auth-model`) para que lo que se guarda se acumule
  en vez de duplicarse.
- **Contrato operacional**: seis principios sobre cuándo guardar y cuándo buscar. La calidad
  no sale solo del esquema: sale de que el agente sepa cuándo usar cada cosa.

### graphify (Graphify-Labs)

- **Grafo real, no índice vectorial.** Explícito: *«Not a vector index. No embeddings, no
  vector store: a real graph you traverse.»* Las respuestas se resuelven **recorriendo
  aristas**.
- **Extracción determinista** con tree-sitter para código (sin LLM, nada sale de la
  máquina); solo lo semántico va a un proveedor.
- **Aristas con confianza**: `EXTRACTED` / `INFERRED` / `AMBIGUOUS`. El consumidor sabe
  cuánto fiarse de cada relación.
- **Herramientas de grafo**: `query_graph`, `get_node`, `get_neighbors`, `shortest_path`.
  Servidor **dual**: stdio local y HTTP compartido.
- **Re-extracción incremental** (`--update`), presupuesto de tokens por *chunk*, y bisección
  del *chunk* cuando una llamada falla.
- **Empujan al agente a usar la herramienta** con hooks (`PreToolUse`) y archivos de
  instrucciones, en vez de confiar en que se acuerde.
- **Detección de comunidades** (Leiden) para exponer la estructura implícita.

## 4. Restricciones que el diseño no puede romper

1. **Local y sin conexión.** Vale la misma regla que decidió empaquetar draw.io: el vault es
   una carpeta en el disco y Mycelium funciona sin red. Un MCP que dependa de un servicio
   remoto para responder **no entra**. Si alguna parte necesita red, tiene que ser opcional
   y degradar.
2. **Nada de telemetría.** Lo que se mida, se mide local.
3. **El índice tiene dueño.** La app escribe; cualquier proceso nuevo empieza siendo
   **lector**. Si el diseño necesita escribir, hay que decir cómo se evita el problema de
   los dos escritores (`FUN-L-16`) y qué pasa con el modo de journal de SQLite.
4. **Tiene que servir con la app cerrada.** Claude Code corre en la terminal integrada, pero
   también fuera. Un diseño que solo funcione con Mycelium abierto limita el caso de uso
   principal — decidilo explícitamente, no por omisión.
5. **El costo es parte del diseño, no una optimización posterior.** «Barato» significa
   tokens y latencia medibles, no una impresión.
6. **Lo que no se puede medir, no se decide.** Si una opción promete ser más rápida, el plan
   tiene que decir **cómo se comprueba** con el arnés de evaluación.

## 5. El reparto

| Parte | Nota | Qué decide |
|---|---|---|
| Memoria | [[MCP de Mycelium - memoria]] | Modelo de datos, índices, herramientas de recuperación, ranking, formato de respuesta |
| Control | [[MCP de Mycelium - control]] | Qué se puede operar de la app, el canal, permisos y seguridad |
| Evaluación | [[MCP de Mycelium - evaluacion]] | Cómo se mide con y sin MCP: preguntas, métricas, captura, comparación |

## 6. Convenciones para las tres notas

- **Cada decisión, justificada**, y con las alternativas que se descartaron y por qué. El
  formato es el del vault: prosa con callouts, no una plantilla rígida.
- **Diagramas en Mermaid**, que Mycelium renderiza en la nota. Al menos uno por parte.
- **Enlazar** al encuadre y entre sí; nada huérfano.
- Marcar lo que es **decisión** y lo que es **pregunta abierta**: una pregunta abierta bien
  planteada vale más que una decisión inventada.

## Relacionadas

- [[Mycelium como memoria de la IA]] — la decisión de producto de la que sale todo esto.
- [[ia-framework-vault]] — lo que hoy hace de memoria, sin MCP.
- [[Capa de datos del desktop]] — el índice que el MCP va a leer.
- [[BACKLOG]] — `FUN-L-09`.
- [[Mapa de documentacion]] — índice general.
