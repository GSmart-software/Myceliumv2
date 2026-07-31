# Mycelium como memoria de la IA

**Decisión de producto** · 2026-07-31 · vigente

El objetivo de integrar una terminal y un framework de instrucciones en Mycelium **no
es** tener una consola por tenerla, ni "ayudar a ordenar documentos". Es que Mycelium
funcione como **sistema de memoria de largo plazo para asistentes de IA** que
desarrollan proyectos documentados en el propio vault.

> [!info] Planteo del usuario
> *"El objetivo principal es poder realizar proyectos completos de IA pudiendo trabajar
> claramente con la documentación que se genera en estos proyectos… Mycelium es un
> sistema de memorias, la IA debe poder entenderlo de esta manera y poder utilizarlo
> como tal."*

Este mismo repositorio es el primer caso de uso: la documentación de Mycelium se
mantiene **en Mycelium**, con esta red de notas.

## Qué implica

1. **La IA debe recuperar antes de responder.** Si el vault puede saberlo, se busca ahí
   y se responde con esa evidencia, citando notas con `[[enlaces]]`.
2. **La IA debe consolidar lo que valga recordar.** Lo que no queda escrito **y
   enlazado** se pierde entre sesiones.
3. **El enlace es la unidad de valor.** Una nota sin enlaces es un recuerdo que no se
   puede evocar. Por eso el grafo no es decorativo: es la vista de la memoria.
4. **La IA entiende Mycelium, no lo controla** (por ahora): trabaja sobre los archivos,
   sin operar la aplicación.

## Cómo se materializa

- [[ia-framework-vault]] — el framework versionado que se genera **dentro** del vault:
  `CLAUDE.md`, las skills `mycelium-vault` (sintaxis) y `mycelium-memoria` (técnicas de
  recuperación/consolidación), y seis comandos `/vault-*`.
- [[terminal-integrada]] — dónde corre el asistente, con el cwd en el vault.
- [[Generar el framework de IA en un vault]] — el procedimiento, opt-in.

## Referencias que inspiraron el diseño

Se estudiaron dos enfoques opuestos para conectar Claude Code con Obsidian:

- **`claude-obsidian`** (AgriciDaniel): muy completo — 15 skills, MOCs, *provenance
  ledgers*, lint de enlaces, aprobación por hash. Rico pero pesado.
- **Enfoque minimalista** (D. Rowse): sin convenciones impuestas; la potencia sale de
  que el contenido es texto plano accesible, y los comandos emergen del uso.

Mycelium tomó el **punto medio**: convenciones claras y verificadas contra el código
real + pocos comandos de alto valor, todo **versionado** para que evolucione con la app.

## Evolución prevista

- `FUN-L-09` en [[BACKLOG]] — un **servidor MCP** que exponga el índice del vault
  (búsqueda, backlinks, vecindario del grafo, metadatos) como herramientas
  estructuradas, en vez de `grep` sobre archivos.
- Más adelante: que la IA pueda **operar** Mycelium (abrir notas, el grafo) de forma
  controlada.
- Integración con metadatos YAML (`FUN-M-04`) y archivos tabla (`FUN-L-03`) cuando
  existan.

## Relacionadas

- [[ia-framework-vault]] — la especificación.
- [[terminal-integrada]] — el entorno donde corre.
- [[Estado del proyecto]] — qué está listo de esta línea.
- [[BACKLOG]] — las extensiones futuras del framework.
