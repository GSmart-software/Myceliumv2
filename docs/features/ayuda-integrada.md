# Ayuda integrada

`FUN-L-27` · **ambas** · pedida por el usuario el 2026-10-03 · implementada en desktop el 2026-10-06 (partes A y B), sin confirmar en la app · **parte A hecha** el 2026-10-06, sin
confirmar en la app (ver § «Implementación de la parte A»)

## Qué se pide

Un apartado en Configuración, «como una wiki o ayuda», para conocer **todo lo que se puede
hacer con Mycelium**: cada herramienta disponible y los estilos especiales que Mycelium
agrega al markdown (el ejemplo del usuario: varios `_` alrededor de un texto lo estilan
distinto que `*`).

## Comportamiento

- **Dónde**: una sección «Ayuda» en la ventana de Configuración, con un índice a la
  izquierda y la página a la derecha, y un buscador por título y contenido.
- **Qué páginas**:
  - **Herramientas**: notas y edición (lectura, en vivo, títulos que renombran), propiedades,
    Esporas, bases, lienzos, dibujos de Excalidraw, draw.io, calendario, grafo, búsqueda,
    terminal, corrector ortográfico, papelera, varios vaults y ventanas, IA del vault
    (framework de instrucciones y MCP), atajos de teclado. Solo las que existen en la versión
    que se está usando: web no muestra la terminal ni draw.io.
  - **Sintaxis propia de Mycelium**: énfasis con `_`, `__`, `___` frente a `*`; callouts y sus
    tipos (y plegables); embeds `![[…]]` de notas, dibujos, diagramas y videos; KaTeX en línea
    y en bloque; Mermaid; tablas editables en el render; enlaces con alias y carpeta.
- **Cada página**: qué es, para qué sirve, cómo se usa en dos o tres pasos, y **ejemplos que
  se ven renderizados** con el mismo motor del editor —el ejemplo es la verdad, no una
  captura—, junto al texto que los produce, con un botón para copiarlo.
- **Desde los ajustes**: una explicación larga de un ajuste (ver `FUN-M-41`) puede llevar un
  «Más en la ayuda» que abre la página correspondiente.

## Lo difícil: que no envejezca

La plantilla de snippets quedó desactualizada sin que nadie lo notara (`DEF-123`). La ayuda
tiene el mismo riesgo multiplicado. Defensas:

1. **Los ejemplos se renderizan en vivo**: si una sintaxis deja de funcionar, la página lo
   muestra roto en vez de mentir.
2. **Una sola fuente donde se pueda**: la referencia de sintaxis comparte material con la
   skill `mycelium-vault` del framework de IA, que ya describe esa misma sintaxis (verificada
   contra Mycelium). Generar las dos desde el mismo texto evita que digan cosas distintas.
3. **Un test** que recorra las páginas y compruebe que cada herramienta registrada en la app
   (por ejemplo, cada tipo de archivo de `lib/extensionesDeTipo`) tiene su página, y que cada
   ejemplo renderiza sin error.
4. **Regla de proceso**: una funcionalidad nueva no se da por terminada sin su página de
   ayuda (sumarlo a [[Verificar antes de integrar]] al implementar esto).

## Criterios de aceptación

1. Configuración tiene una sección «Ayuda» con índice y buscador.
2. Hay una página por cada herramienta disponible en esa versión, y una referencia de la
   sintaxis propia de Mycelium.
3. Los ejemplos se ven renderizados con el motor real y se pueden copiar.
4. El test de cobertura falla si una herramienta no tiene página.
5. Funciona sin conexión (el contenido viaja con la app).

## A decidir al especificar en detalle

- Si la ayuda se abre también como **pestaña** del área de trabajo (para tenerla al lado de
  la nota) además de dentro de Configuración.
- Relación con `FUN-S-05` (vault de ejemplo por defecto): un vault de ejemplo enseña
  haciendo; la ayuda, explicando. Pueden compartir ejemplos.
- Idioma: hoy la interfaz es solo en español; con `FUN-L-13` (idiomas de la interfaz) la
  ayuda tendría que traducirse.

## Decisiones (usuario, 2026-10-06)

1. **Una ventana sobre la app**, como la de edición de snippets de CSS: índice de temas y
   subtemas a la izquierda, con buscador por título y contenido, y la página a la derecha. Ni
   pestaña del área de trabajo ni sección dentro de Configuración (esa duda de «A decidir»
   queda resuelta).
2. **Se abre desde** Configuración (una entrada «Ayuda»), la barra superior (el comando
   «Ayuda» de la paleta) y la tecla **F1**, desde cualquier parte de la app.
3. **Primero desktop**; web se refleja cuando se confirme, mostrando solo las páginas de lo que
   existe ahí (sin terminal, draw.io, visor de archivos ni MCP).
4. **Temas y subtemas** (punto de partida aprobado):
   - **Primeros pasos**: qué es un vault · abrir y cambiar de vault · la interfaz (rail,
     explorador, pestañas, paneles).
   - **Escribir notas**: vista en vivo y lectura · el título renombra el archivo · énfasis
     (`_`, `__`, `___` y `*`) · tareas y sus estados · callouts · tablas · imágenes y
     archivos embebidos · fórmulas (KaTeX) y diagramas Mermaid · propiedades.
   - **Enlazar y organizar**: enlaces `[[ ]]`, alias y embeds · etiquetas · grafo · búsqueda ·
     Esporas.
   - **Tipos de archivo**: bases · lienzos · Excalidraw · draw.io · otros archivos (visor,
     soltar desde el sistema, menú).
   - **Herramientas**: calendario · terminal · corrector · papelera · exportar e importar.
   - **Configuración**: `.mycignore` · CSS y snippets · actualizaciones.
   - **IA**: instrucciones de IA del vault · control de la IA (MCP).
   - **Atajos de teclado**.

## Plan de trabajo

- **Parte A — la ventana y el circuito del contenido**: la ventana, el índice, el buscador,
  el render con el motor real, el botón de copiar en los ejemplos, los tres accesos, cómo
  viajan las páginas con la app (Markdown en el repo → módulo generado) y el test de
  cobertura. Con dos o tres páginas de muestra que fijen el tono.
- **Parte B — el contenido**: el resto de las páginas, en paralelo por tema una vez que la A
  fije el formato.

## Implementación de la parte A

Hecha en desktop el **2026-10-06** (rama `feat/ayuda-integrada-desktop`), **sin confirmar
en la app**. Es lo que tiene que leer quien escriba la parte B.

### Dónde vive todo

| Pieza | Archivo |
|---|---|
| Las páginas (fuente de verdad) | `frontend/ayuda/<NN-tema>/<NN-subtema>.md` |
| El generador (y su `--comprobar`) | `frontend/scripts/generar-ayuda.mjs` |
| El módulo generado — **no se edita** | `frontend/lib/ayuda/paginasGeneradas.ts` |
| Índice, orden, vecinas, enlaces `ayuda:`, buscador, `VERSION_AYUDA` | `frontend/lib/ayuda/indice.ts` |
| Partir los bloques ```` ```ejemplo ```` | `frontend/lib/ayuda/ejemplos.ts` |
| Página → HTML con `renderMarkdown` (el motor de la vista de lectura) | `frontend/lib/ayuda/render.ts` |
| La ventana | `frontend/components/ayuda/VentanaAyuda.tsx` + `.module.css` |
| F1 y el montaje en toda la app (layout raíz, carga diferida) | `frontend/components/ayuda/AyudaGlobal.tsx`, `app/layout.tsx` |
| Estado (`ayudaAbierta`, `ayudaPagina`, `abrirAyuda(pagina?)`) | `frontend/stores/uiStore.ts` |
| Accesos: botón en Configuración y comando de la paleta | `components/settings/VentanaAjustes.tsx`, `components/workspace/PaletaComandos.tsx` |
| Test de cobertura | `frontend/scripts/test-ayuda.mjs` |

`frontend/` está en el `.mycignore` del vault del repo, así que las páginas no aparecen como
notas del vault de documentación; aun así el test exige nombres de archivo únicos entre temas.

### El formato de una página

```markdown
---
titulo: Énfasis
tema: Escribir notas
sinonimos: [negrita, cursiva, guion bajo]
solo: desktop
cubre: [markdown]
estado: pendiente
---

Cuerpo en Markdown, sin repetir el título (la ventana lo pone arriba).
```

- **Nombre y orden**: carpeta `NN-slug` por tema y archivo `NN-slug.md` por subtema. Los
  números dan el orden (no hay clave `orden`: estaría repetida); el resto da el **id** de la
  página, `<tema>/<subtema>` sin números: `escribir-notas/enfasis`.
- **Frontmatter** (mapa plano; el generador rechaza claves desconocidas o repetidas):
  - `titulo` y `tema` — obligatorios. Todas las páginas de una carpeta llevan el mismo
    `tema`: es el nombre que se ve en el índice.
  - `sinonimos` — palabras con las que alguien la buscaría sin saber cómo se llama.
  - `solo: desktop` (o `web`) — la página no existe en la otra versión.
  - `cubre` — tipos de archivo de `lib/extensionesDeTipo` que documenta (el test lo exige).
  - `estado: pendiente` — está en el índice como «Pronto» pero no se escribió; su cuerpo
    se ignora (hoy lleva la guía «Para la parte B: …» de qué cubrir). Al escribirla, se
    **borra esta línea**.
- **Enlaces entre páginas**: `[texto](ayuda:escribir-notas/tareas)`. Navegan dentro de la
  ventana. El test exige que el destino exista y que una página de las dos versiones no
  enlace a una `solo:` de una. Los externos (`https://…`) abren el navegador como en una nota.
- **Ejemplos**: un bloque con la info `ejemplo` se muestra como «Escribís» (la fuente, con
  «Copiar» siempre visible) y «Se ve» (el render real). Para mostrar un bloque de código
  dentro de un ejemplo, la valla de afuera va más larga (```` ````ejemplo ````). En los
  ejemplos, los `[[enlaces]]`, las `#etiquetas` y las casillas **no hacen nada**: se miran.
- **Sin HTML crudo** (`<kbd>`, `<br>`…): el motor lo descarta y el texto desaparece; el test
  lo rechaza. Las teclas van en negrita: **Ctrl+P**.
- **Tono** (fijado por las tres páginas de muestra): español rioplatense, de vos, segunda
  persona. Primero qué es (un párrafo), «Para qué sirve», «Cómo se usa» en 2–3 pasos
  numerados, ejemplos, y un callout solo si hay una trampa real. Cortas. **Nada que no esté
  verificado en el código**: el énfasis se comprobó en `remarkEmphasisStyle` y
  `livePreview`; las tareas, en `lib/estadosTarea.ts` y [[estados-de-tarea]].

### Cómo agregar o escribir una página

1. Crear (o completar, quitando `estado: pendiente`) el `.md` en su carpeta. Un tema nuevo
   es una carpeta nueva con el número que le toque.
2. `cd frontend && npm run generar-ayuda` — regenera `lib/ayuda/paginasGeneradas.ts`. Si el
   frontmatter tiene algo mal, el script dice qué y en qué archivo.
3. `node --test scripts/test-ayuda.mjs` — formato, enlaces, cobertura y que cada ejemplo
   renderice. Si la página muestra una sintaxis propia, conviene sumar ahí una aserción de
   que el ejemplo produce lo que la página dice (como las de Énfasis y Tareas).
4. Commitear el `.md` **y** el módulo generado juntos.

`npm run dev` regenera el módulo al arrancar; `npm run build` (el que corre `tauri build` y
CI) lo **comprueba** y falla si quedó viejo. El test «ninguna página del índice está
pendiente» está marcado `todo` (no falla): la parte B le quita el `todo` al terminar.

### Decisiones de la parte A

- **Configuración: botón al pie de la lista de categorías, no una categoría.** Una
  categoría promete un panel de ajustes en esa misma ventana; la ayuda vive en la suya
  (decisión 1). El botón cierra Configuración y abre la ayuda. Además, buscar «ayuda»,
  «atajos», «manual», «wiki»… en el buscador de Configuración ofrece «Abrir la ayuda».
- **Una ventana modal a la vez.** Configuración, la paleta y la ayuda tienen cada una su
  Escape y su trampa de foco; abrir una cierra las otras (`uiStore`). Con **otro** diálogo
  modal abierto (el editor de un snippet, una confirmación, la exportación a PDF…), F1 no
  hace nada: abrir la ayuda encima se pelearía con él por el teclado y podría perder lo que
  hay a medio hacer ahí. Configuración y la paleta llevan `data-cede-a-la-ayuda`.
- **F1 se escucha en captura sobre `window`**, en el layout raíz: funciona en el selector de
  vaults, en el editor y **con la terminal enfocada** (xterm corta la propagación de sus
  teclas en su `textarea`; en burbuja, F1 se iba al shell como `ESC O P`). Se resigna F1
  dentro de la terminal, que casi ningún programa de consola usa. CodeMirror no usa F1.
  Con la ayuda abierta, F1 lleva al buscador. Solo F1 a secas: con Ctrl, Alt o Shift la
  tecla sigue su camino (a la terminal, por ejemplo).
- **Las páginas no escritas se ven en el índice como «Pronto»** y abren un aviso. Así el
  índice aprobado se ve entero desde ya y la parte B solo completa archivos; «anterior /
  siguiente» las saltea. El buscador las encuentra por título, no por contenido.
- **Un tema de una sola página con su mismo nombre** («Atajos de teclado») se muestra como
  hoja del índice, sin plegar y sin migas repetidas.
- **La última página leída** se recuerda en `localStorage` (`mic-ayuda-ultima-pagina`, con
  try/catch): es una comodidad del usuario en esa máquina, no del vault.
- **Ancho de lectura** = `--mic-ancho-lectura` (el de la vista de lectura, ~70 caracteres).
- **Árbol**: patrón de árbol de WAI-ARIA en filas planas con `aria-level`, el del
  explorador (copiado y no importado: importarlo traería `ExplorerPanel` entero).

### Notas para el reflejo a web

Todo es frontend. En web, `VERSION_AYUDA` (`lib/ayuda/indice.ts`) pasa a `"web"` y
desaparecen las páginas `solo: desktop` (draw.io, otros archivos, terminal, `.mycignore`,
actualizaciones, IA). La página «Qué es un vault» habla de una carpeta de la computadora:
en web habrá que escribir su versión (`solo: web`) o generalizarla.

## Parte B: hecha (2026-10-06)

Las 30 páginas que faltaban, escritas por cuatro subagentes en paralelo, uno por grupo de
temas, con la regla de que toda afirmación salga del código o de la documentación y de dejar
afuera lo que no se pudiera confirmar. El test «ninguna página pendiente» quedó activo.

Lo que encontraron al verificar contra el código:

- `DEF-130`: la X del editor de un snippet de CSS cierra sin guardar ni preguntar.
- `DEF-131`: la skill de sintaxis de la IA promete el embed de una nota (`FUN-M-37`, sin hacer)
  y etiquetas clicables.
- `[[Nota#Encabezado]]` no resuelve (el `#` no se quita al buscar la nota): no se documentó.
- Mermaid se dibuja en lectura, dividido, PDF y la ayuda, pero **no en la vista en vivo**: la
  página lo avisa.
- El clic en un enlace roto no crea la nota (Obsidian sí): la página lo describe como es.

**Para web**: «Qué es un vault», «La interfaz» y «Atajos de teclado» nombran cosas que web no
tiene (carpeta del equipo, consolas, actividad de la IA, F12); hay que escribir su variante
`solo: web` o recortarlas. «CSS y snippets» dice que los snippets viven en el vault, y en web
son del usuario. «Imágenes y embebidos» menciona draw.io «en la versión de escritorio».

## Relacionadas

- [[BACKLOG]] — `FUN-L-27`, bloque **P** de la agrupación.
- [[Verificar antes de integrar]] — la regla «sin página de ayuda no está terminada».
- [[estados-de-tarea]] — de donde sale la página «Tareas y sus estados».
- [[ia-framework-vault]] — la skill `mycelium-vault`, la otra descripción de la sintaxis.
- [[Bugs_errores_y_defectos]] — `DEF-123`, la plantilla de snippets desactualizada.
