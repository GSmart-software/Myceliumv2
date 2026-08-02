# Mapa de documentación

Puerta de entrada a la documentación de Mycelium. Este vault **es** la memoria del
proyecto: si buscás algo, arrancá desde acá y seguí los enlaces.

> [!tip] Cómo está organizado
> Las **áreas** son carpetas; las **asociaciones**, los `[[enlaces]]`. Cada nota enlaza
> a sus vecinas, así que casi cualquier punto de entrada te lleva al resto.

## Empezar por acá

| Si querés… | Leé |
|---|---|
| Entender qué es y cómo está construido | [[Arquitectura de Mycelium]] |
| Saber en qué punto está todo hoy | [[Estado del proyecto]] |
| Correr el proyecto | [[Levantar Mycelium en desarrollo]] |
| Saber qué falta hacer | [[BACKLOG]] |
| Entender el objetivo de la línea de IA | [[Mycelium como memoria de la IA]] |

## Arquitectura

- [[Arquitectura de Mycelium]] — dos versiones, capas, frontend compartido, modelo de contenido.
- [[Capa de datos del desktop]] — la carpeta como verdad, SQLite como índice, reparto TS/Rust.
- [[Capa de datos de la web]] — backend .NET, puertos y adaptadores, colaboración latente.
- [[RAMAS]] — ramas (incluidas las históricas), archivos divergentes y artefactos exclusivos de cada versión.
- [[Despliegue de la web en Cloudflare]] — D1/R2 + Render + Pages: qué se preparó, dónde vive y en qué quedó.
- [[DESIGN_SYSTEM]] — tokens, temas, layout y estados visuales.
- [[MIGRACION-TAURI]] — desglose por fases de la migración a Tauri (historia).

## Decisiones

- [[Dos ramas en vez de monorepo]] — por qué se canceló el monorepo y cuándo reconsiderarlo.
- [[Implementacion independiente por rama]] — la regla de oro: nada de merge entre versiones.
- [[Diferencias funcionales aceptadas entre versiones]] — qué existe solo en una y por qué.
- [[Mycelium como memoria de la IA]] — el objetivo de fondo de la terminal y el framework.

## Procesos

- [[Levantar Mycelium en desarrollo]] — cómo correr desktop y web.
- [[Verificar antes de integrar]] — qué debe quedar verde.
- [[Reflejar cambios de desktop a web]] — la receta del reflejo, con sus trampas.
- [[Flujo de trabajo con subagentes]] — orquestador + un agente por rama.
- [[Convenciones de commits]] — formato, alcance y reglas del remoto.
- [[Generar instaladores desktop]] — empaquetado con Tauri.
- [[Generar el framework de IA en un vault]] — instalar las instrucciones de IA.

## Funcionalidades (especificaciones)

- [[vault-en-carpeta]] — el vault como carpeta real (7 fases).
- [[fs-nativo-desktop]] — integración con el sistema de archivos.
- [[desktop-sin-login]] — eliminación de usuarios en la versión de escritorio.
- [[def-023-visor-sidebar]] — el panel lateral como visor con pestañas.
- [[terminal-integrada]] — consola nativa integrada (`FUN-L-07`).
- [[ia-framework-vault]] — framework de IA versionado (`FUN-L-08`).
- [[mycignore]] — qué ignora Mycelium, configurable por vault (`FUN-M-11`).
- [[rendimiento-apertura-vault]] — optimización del indexado al abrir (`FUN-M-12`).
- [[navegacion-por-pestana]] — scroll, historial por pestaña y previsualización (`DEF-039/040/041`).
- [[metadata-yaml]] — frontmatter YAML como propiedades: ver, editar e indexar (`FUN-M-04`).

## Aprendizajes técnicos

- [[Aprendizajes tecnicos]] — **mapa del área** (leer primero).
- [[CodeMirror y la vista en vivo]] · [[Drag and drop en Mycelium]] · [[Estado con Zustand]]
- [[Tauri y el WebView]] · [[Terminal integrada - PTY y xterm]] · [[Compilacion y entorno de desarrollo]]
- [[Rendimiento del grafo]] — análisis del costo por frame y propuestas de optimización.
- [[Rendimiento de la apertura del vault]] — por qué tarda abrir un vault grande y cómo acelerarlo.

## Producto y planificación

- [[HUs]] — historias de usuario con criterios de aceptación.
- [[BACKLOG]] — inventario de ideas con IDs, tamaños y secuenciado por versiones.
- [[Ideas Mycelium]] — notas originales del usuario (fuente del backlog).
- [[bugs-progreso]] — checklist y trazabilidad de los bugs `DEF-*`.
- [[Bugs_errores_y_defectos]] — el reporte original de bugs.

## Estado y releases

- [[Estado del proyecto]] — situación actual, pendientes y deuda.
- [[Version 1.2.0]] — release actual de desktop (metadatos YAML), **sin confirmar en la app**.
- [[Version 1.1.5]] — navegación por pestaña, **sin confirmar en la app**.
- [[Version 1.1.1]] — rendimiento de la apertura del vault.
- [[Version 1.1.0]] — línea de IA, grafo, devtools.
- [[Version 1.0.0]] — el primer release final, común a las dos versiones.
- [[Versionado del sistema]] — dónde vive la versión y con qué criterio se sube.

## Documentos históricos

> [!warning] Desactualizados a propósito
> Se conservan como registro, **no** como referencia.

- [[DESKTOP-LOCAL]] — empaquetado pre-Tauri (datos en Cloudflare, Inno Setup).
- [[Roadmap general]] — brainstorming previo al proyecto actual, con líneas truncadas.

## Fuera de `docs/` (raíz del repo)

- [[README]] — presentación del repo (describe la estructura de la línea **web**).
- [[CLAUDE]] — instrucciones vivas: framework de memoria + guía de trabajo del proyecto.
- [[Conflictos instrucciones IA]] y [[CLAUDE (mycelium-ia v1.2.0)]] /
  [[CLAUDE (mycelium-ia v1.1.0)]] — salidas del generador del framework cuando encontró
  archivos existentes (no los pisó); ver [[Generar el framework de IA en un vault]].
