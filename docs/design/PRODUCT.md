# Product

<!-- impeccable:product-schema 1 -->

Registro de producto para el trabajo de diseño (skill `impeccable`). Recoge solo lo
confirmado; el detalle vive en [[Mapa de documentacion]]. Creado el 2026-09-18.

## Platform

web

> [!info] Por qué `web`
> Las dos versiones comparten el mismo frontend React/Next.js: en desktop lo sirve Tauri
> dentro de un WebView (Windows), en web corre en el navegador. El lenguaje de diseño es
> uno solo y no adopta el de ningún sistema operativo. Ver [[Arquitectura de Mycelium]].

## Users

**Público amplio que toma notas** al estilo Obsidian: personas que escriben, enlazan y
recorren su propio conocimiento en notas Markdown. La IA es un diferencial del producto,
no un requisito para usarlo. El primer caso de uso real es el propio autor, que documenta
este repositorio dentro de Mycelium.

## Product Purpose

Mycelium es un sistema de gestión de conocimiento: notas Markdown con `[[enlaces]]`, un
grafo de conexiones y edición en vivo. Existe para que el conocimiento funcione como una
**red viva y conectada** — una nota sin enlaces es un recuerdo que no se puede evocar.
Tagline: *"Tu red de conocimiento, viva y conectada"*.

## Positioning

- **Memoria para la IA.** El vault está pensado para ser la memoria de largo plazo de
  asistentes de IA que trabajan sobre él: framework de instrucciones versionado que se
  genera dentro del vault, terminal integrada con el asistente corriendo en el vault, y
  comandos `/vault-*` para recuperar y consolidar. Ver [[Mycelium como memoria de la IA]].
- **En español y con identidad propia.** Hecho en y para hispanohablantes, con su propio
  vocabulario (micelio, hifas, Esporas para las plantillas) en lugar de una traducción.

## Operating Context

- Dos versiones: **desktop** (Tauri, la carpeta del usuario es la verdad, SQLite como
  índice, sin cuenta) y **web** (Next.js + backend .NET, con login). Divergen solo en la
  capa de datos. Ver [[Capa de datos del desktop]] · [[Capa de datos de la web]].
- Uso de escritorio: sesiones de escritura y lectura largas, pestañas, panel lateral,
  grafo global y mini-grafo por nota, y en desktop una terminal integrada donde corre el
  asistente de IA.
- La línea de IA avanza **solo en desktop**; web queda por detrás a propósito
  ([[Diferencias funcionales aceptadas entre versiones]]).

## Capabilities and Constraints

- Editor CodeMirror 6 con modos vivo, dividido, lectura y crudo; callouts (10 tipos,
  plegables y anidables), Mermaid, KaTeX, Excalidraw.
- Frontmatter YAML como propiedades; archivos `.base` (tablas) y `.canvas` (lienzos)
  compatibles con los formatos de Obsidian, conservando lo que todavía no se entiende.
- Esporas (plantillas con variables), búsqueda por nombre y contenido, `.mycignore`,
  varias ventanas (un vault por ventana), autoactualización.
- La interfaz está hoy **solo en español**; varios idiomas es un pendiente (`FUN-L-13`
  en [[BACKLOG]]).
- Temas por tokens de dos capas: un tema propio redefine unos pocos colores *raw*.
  El sistema visual vigente está en [[DESIGN_SYSTEM]].

## Brand Commitments

- Nombre **Mycelium** y la metáfora del micelio: cada nota es un nodo, cada enlace una
  hifa; el grafo es literalmente un micelio.
- Tagline *"Tu red de conocimiento, viva y conectada"*.
- Vocabulario propio en español (Esporas, papelera propia, "vault").

## Evidence on Hand

- La documentación de este repositorio (`docs/`) es un vault real mantenido con
  Mycelium: es el caso de uso existente.
- **No hay** usuarios externos, testimonios, métricas de uso ni casos de estudio. No se
  deben inventar.

## Product Principles

1. **El enlace es la unidad de valor.** Todo lo que facilite conectar y recorrer
   conexiones pesa más que lo que solo almacena.
2. **Texto plano primero.** La carpeta y sus archivos son la verdad; nada queda
   atrapado en un formato propio ni se pierde lo que Mycelium no entiende.
3. **Útil sin IA, mejor con IA.** Quien solo toma notas no debe tropezar con la IA; quien
   la usa encuentra un vault preparado para ser su memoria.
4. **Local y respetuoso en desktop.** Sin cuenta; nada del vault sale de la máquina.

## Accessibility & Inclusion

Sin estándar formal establecido. Buenas prácticas razonables (contraste legible,
operación por teclado) como piso.
