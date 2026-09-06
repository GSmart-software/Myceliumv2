# Mapa de documentación

Puerta de entrada a la documentación de Mycelium. Este vault **es** la memoria del
proyecto: si buscás algo, arrancá desde acá y seguí los enlaces.

> [!tip] Cómo está organizado
> Las **áreas** son carpetas; las **asociaciones**, los `[[enlaces]]`. Cada nota enlaza
> a sus vecinas, así que casi cualquier punto de entrada te lleva al resto.

## Empezar por acá

| Si querés… | Leé |
|---|---|
| **Anotar un defecto o una idea** | [[Bandeja de entrada]] — escribí ahí sin formato |
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
- [[Publicar una version]] — bucket, claves de firma y los cinco pasos de una
  publicación, para que la actualización llegue sola (`FUN-L-14`).
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
- [[marcas-en-las-pestanas]] — el ícono del tipo en cada pestaña y el color por consola
  (`FUN-S-11` · `FUN-S-12`).
- [[busqueda-modos-y-arbol]] — elegir dónde busca el panel del vault, ver los resultados
  por carpeta, y las guías de indentación (`FUN-M-20` · `FUN-S-17`).
- [[titulo-renombra]] — escribir en el título de la nota renombra el archivo (`FUN-M-24`).
- [[metadata-yaml]] — frontmatter YAML como propiedades: ver, editar e indexar (`FUN-M-04`).
- [[ventanas-multiples]] — varios vaults abiertos a la vez, uno por ventana (`FUN-L-16`).
- [[auditoria-y-relinkeado]] — adoptar un vault que ya existía: descubrir cómo se
  referencian sus documentos y convertirlo en enlaces (`FUN-M-17` · `FUN-L-17`).
- [[canvas]] — el archivo `.canvas`: notas y textos en el espacio, unidos por flechas
  (`FUN-L-18`).
- [[bases-tabla]] — el archivo `.base`: agregar notas por sus propiedades en una tabla
  (`FUN-L-03`). Continuación directa de [[metadata-yaml]].
- [[edicion-en-el-render]] — las propiedades y las tablas dejan de abrirse en crudo con el
  cursor dentro y se editan renderizadas (`FUN-M-19` · `FUN-L-19`).
- [[otros-tipos-de-archivo]] — abrir texto, código, PDF e imágenes en un visor propio
  (`FUN-L-11`). Solo-desktop.
- [[preferencias-por-vault]] — ajustes que son del vault y no de la persona, guardados
  dentro de su carpeta (`FUN-M-28` · `FUN-M-21`).
- [[numeros-de-linea]] — el número de línea al costado del texto, y por qué no está en la
  vista de lectura (`FUN-M-28`).
- [[esporas-plantillas]] — plantillas de notas ("Esporas") con variables (`FUN-M-03`).
- [[autoactualizacion]] — aviso diario de versión nueva, actualización con un clic y
  selección de versión en modo avanzado (`FUN-L-14` + `FUN-M-16`).
- [[auditoria-y-relinkeado]] — adoptar un vault que viene de otro proyecto: descubrir cómo
  se referencian sus documentos y convertir esas referencias en `[[wikilinks]]` (`FUN-M-17`).
- [[canvas]] — notas y textos en un lienzo infinito, con `[[enlaces]]` que funcionan
  (`FUN-L-18`).

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
- [[Bandeja de entrada]] — donde el usuario anota en crudo lo que después se convierte en
  un `DEF-*` o un `FUN-*`.

## Estado y releases

- [[Estado del proyecto]] — situación actual, pendientes y deuda.
- [[Version 1.7.0]] — release actual: trece funcionalidades en una tanda. Las tablas se
  vuelven de trabajar, aparecen las preferencias **del vault**, y el título renombra el
  archivo. Web sale a la vez como `1.3.0`. **Sin publicar todavía.**
- [[Version 1.6.2]] — desktop: las tablas y las propiedades se editan
  renderizadas, sin abrir el crudo. **Publicada el 2026-08-17**, y con ella llegaron también
  la 1.6.0 y la 1.6.1, que nunca habían salido.
- [[Version 1.6.1]] — varios vaults a la vez, uno por ventana,
  y una tanda de correcciones. **Nunca se publicó**: absorbida por la 1.6.2.
- [[Version 1.6.0]] — bases, canvas y la pantalla de
  referencias. **Nunca se publicó**: absorbida por la 1.6.2.
- [[Version 1.5.0]] — la anterior (ancho de tabulación). Salió fallando y se
  **rehizo y confirmó** el 2026-08-03; el binario publicado en R2 todavía no lleva esas
  correcciones (hace falta una `1.5.1`).
- [[Version 1.4.0]] — autoactualización y selección de versión; **confirmada de punta a
  punta**: una instalación detectó y aplicó la versión posterior. Sin probar solo el modo
  avanzado (`FUN-M-16`).
- [[Version 1.3.0]] — Esporas, **confirmadas en la app**.
- [[Version 1.2.0]] — metadatos YAML, **confirmado en la app**.
- [[Version 1.1.0 de web]] — la web al día: propiedades, Esporas, tabulación y navegación
  por pestaña. **Numeración propia**: no tiene relación con la 1.1.0 de escritorio.
- [[Version 1.1.5]] — navegación por pestaña, **confirmada en la app**.
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
