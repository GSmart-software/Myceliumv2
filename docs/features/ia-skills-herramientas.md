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

## Cómo quedó

Partes A, B y D integradas en `desktop-tauri` (2026-09-30). **Falta la parte C** (evaluación
ciega + revisión visual en la app) y la confirmación del usuario.

### Las seis skills (framework `1.7.0`)

| Skill (`.claude/skills/<skill>/SKILL.md`) | Validador que viaja con ella | Cómo lo corre la IA |
|---|---|---|
| `mycelium-drawio` | `validar-drawio.mjs` | `node .claude/skills/mycelium-drawio/validar-drawio.mjs [--mapa] archivo.drawio` |
| `mycelium-canvas` | `validar-canvas.mjs` | `node .claude/skills/mycelium-canvas/validar-canvas.mjs --vault . "Ruta.canvas"` |
| `mycelium-excalidraw` | `validar-excalidraw.mjs` | `node .claude/skills/mycelium-excalidraw/validar-excalidraw.mjs "Ruta.excalidraw"` |
| `mycelium-base` | — | Revisión a mano con las tablas de la skill; la app muestra el motivo si no entiende un filtro |
| `mycelium-esporas` | — | Expande las variables con `date`; no corre scripts |
| `mycelium-calendario` | — | Un script de Node **dentro de la skill** (heredoc a `node -`), no un archivo aparte |

- Solo viajan los validadores **sin dependencias** (solo `node:*`): los de bases y Esporas
  (`validar-base.mjs`, `validar-espora.mjs`) transpilan módulos del repo y se quedan en
  `frontend/scripts/` como herramientas de desarrollo.
- El borrador de Excalidraw decía `validar.mjs`; se unificó a `validar-<formato>.mjs` en los
  tres.
- En el vault, cada `.mjs` lleva en su **primera línea** (en lugar del shebang)
  `// <!-- mycelium-ia vX --> generado por Mycelium …`: con esa marca `generarFramework` lo
  reconoce como suyo y lo sobrescribe al actualizar, como al resto de `.claude/`.
- Probado de punta a punta: framework generado en una carpeta temporal fuera del repo, y
  los tres validadores corridos **desde ahí** sobre fixtures buenos (exit 0) y malos (exit 1)
  sin nada del repo.

### El generador

Los borradores (`frontend/lib/ia/borradores/*.md`) y los validadores son la **fuente de
verdad**. `node scripts/generar-skills-ia.mjs` los lee y escribe
`frontend/lib/ia/skillsGeneradas.ts` con cada contenido como `JSON.stringify` —nada de
escapar backticks ni `${…}` a mano—. La marca de versión de los borradores es
`<!-- mycelium-ia v{{VERSION_IA}} -->`; `framework.ts` reemplaza `{{VERSION_IA}}` por
`FRAMEWORK_IA_VERSION`. El generador además **rechaza** un validador que importe algo fuera de
`node:*` y un borrador que mande a correr un `.claude/skills/…/*.mjs` que no se genera.
`scripts/test-skills-generadas.mjs` falla si `skillsGeneradas.ts` quedó desactualizado.

> [!info] El bundle crece ~216 KB
> Las skills y los validadores entran al chunk de la app (sin comprimir: el chunk que
> contiene el framework pasó de 726 KB a 942 KB; el total de `out/_next/static/chunks`, de
> 13,71 MB a 13,93 MB, +1,6 %). Si molestara, `skillsGeneradas` se puede cargar con
> `import()` dentro de `generarFramework`.

### Decisiones de la parte A (recarga desde disco)

- El watcher emite `EVENTO_RECARGA` con `detail.rutas` (las rutas que cambiaron); cada vista
  se recarga solo si la toca (`avisoTocaA`).
- **draw.io** recarga mandando otra acción `load` al iframe, no `merge`: se pierde el zoom y
  el deshacer, pero `merge` podía **resucitar** celdas borradas desde fuera.
- **Excalidraw** solo marca el dibujo como sucio si cambia la suma de versiones de los
  elementos (`versionDeEscena`): mover la cámara ya no dispara un guardado.
- El **editor modal** de Excalidraw (el que se abre desde un embed en una nota) **no**
  recarga: si está abierto, cerrarlo pisa lo escrito desde fuera. La skill y el `CLAUDE.md`
  se lo advierten a la IA.
- Ninguna vista recarga con cambios propios sin guardar; el lienzo tampoco con una tarjeta
  en edición.

### Encuadre al abrir (2026-09-30)

Un dibujo o lienzo grande abría mirando a (0, 0) al 100 %: quedaba cortado, y en Excalidraw
lo de arriba lo tapaba la barra de herramientas. Ahora **al abrir** se encuadra todo lo
dibujado, con margen y **sin agrandar más allá del 100 %** un dibujo chico. Rama
`fix/def-119-y-encuadre-desktop`, **sin confirmar en la app**.

- **Excalidraw** (pestaña y modal del embed): `scrollToContent` con `fitToContent` (que ya
  limita el zoom a 1), `viewportZoomFactor: 0.9` y `canvasOffsets` de 64 px arriba (la barra
  de herramientas flota sobre esa franja) y 56 px abajo (zoom y deshacer). Se dispara en la
  primera `onChange` que trae elementos, en el cuadro siguiente (`encuadrarDibujo` en
  `lib/excalidraw.ts`). Un dibujo en blanco no se encuadra: si no, el primer trazo movería
  la vista.
- **Canvas**: `cajaDeNodos` + `encuadrar` (`lib/canvas.ts`, testeados en
  `scripts/test-canvas.mjs`), en un efecto de layout para que el primer cuadro ya salga
  encuadrado. Margen 48 px, escala entre 0,2 (el tope de la rueda) y 1.
- **Solo en la primera apertura**: la recarga desde disco de la parte A conserva la cámara
  y no re-encuadra. Estas dos vistas se remontan al cambiar de pestaña (`key` de la pestaña
  en `EditorPane`) y ya perdían la cámara al volver; ahora al volver se re-encuadran, en vez
  de volver a (0, 0).
- **draw.io queda como está.** Su protocolo embebido no tiene una acción de encuadre, y la
  única vía sería mandar `invokeAction` de «ajustar» después de cada `load` — pero la recarga
  desde disco también es un `load`, y distinguir la primera apertura desde el `iframe`
  compartido no es trivial. Además, draw.io ya abre mostrando la página.

### Canvas tras la segunda evaluación ciega (2026-09-30)

Todo pasaba el validador, pero el mapa radial de 6 ramas × 3 ideas medía ~2420 × 1590 y,
con el encuadre al abrir, se veía al ~44 % (ilegible). Cambios en `mycelium-canvas`:

- **Tamaño máximo ~1800 × 1200** en los dos ejes (abre al ~59 % en ~1150 × 800 de lienzo),
  con la fórmula del encuadre y qué hacer si se pasa.
- El radial queda **solo para ramas**; con ideas por rama, **mapa en peine** (ramas en dos
  columnas a los costados del centro, ideas apiladas hacia afuera): el 6 × 3 mide
  1760 × 1190. Un segundo anillo radial nunca entraba (medido de 3 a 8 ramas × 1–3 ideas).
- Notas relacionadas: salientes incluyendo las **propiedades** (`proyecto: "[[X]]"`),
  hermanas y dos saltos en una segunda columna colgada de la vecina, y no inventar si la
  nota casi no tiene enlaces. Flujo: **rama que se reúne** (codo `bottom → right`).
  Tablero: estado fuera de la paleta sin color, compactar el origen, orden de las movidas,
  respetar medidas existentes. Scripts de modificación **no idempotentes**. Lienzo
  huérfano: enlazarlo desde la nota natural, o ofrecerlo.
- Validador: aviso `TITULO_ANGOSTO` (título `# …` que no cubre la fila de grupos que
  encabeza). Fixtures nuevos `bueno-mapa-peine` y `bueno-flujo-reunion`; `bueno-mapa-radial`
  pasó a ser solo ramas.

### Hallazgos de la parte B que NO se arreglaron

Salieron al leer el código para escribir las skills. Las skills los esquivan (le dicen a la
IA qué no hacer), pero la app sigue igual. **Pendientes de confirmar en la app en la parte
C** antes de registrarlos como `DEF-*`:

| Formato | Hallazgo |
|---|---|
| Excalidraw | Un `.excalidraw` con **JSON inválido abre vacío y el autoguardado lo pisa** a los ~800 ms: pérdida de datos. → Registrado como `DEF-119`; ahora avisa y no monta el editor |
| Excalidraw | Una flecha **sin `points`** deja el dibujo entero en blanco (Excalidraw no carga ningún elemento). → `DEF-119`: `restoreElements` tira y la vista lo muestra como ilegible |
| draw.io | XML **mal formado** abre un diagrama vacío («No es un archivo de diagrama») y **guardar lo pisa**. → `DEF-119` |
| Canvas | Un nodo `file` a una **imagen o PDF** muestra «La nota … ya no existe» |
| Canvas | Un **salto de línea simple** en una tarjeta de texto no corta el renglón (render sin `breaks`) |
| Canvas | `label` y `color` de las **aristas** no se dibujan |
| Canvas | Abre en **(0, 0)** sin ajustar al contenido: lo que está en negativo queda fuera de vista. → Resuelto: ver «Encuadre al abrir» |
| Bases | `![[x.base]]` **no dibuja la tabla** embebida |
| Bases | Varias sintaxis se equivocan **en silencio** (comentario al final de línea, `: ` dentro de una expresión, `sort` en línea, `&&`/`!`): 0 filas o todas, sin error |
| Esporas | Un **token desconocido sin comillas** en el frontmatter (`autor: {{autor}}`) deja la nota creada **sin propiedades** |
| Esporas | Las **subcarpetas** de la carpeta de Esporas no se listan |
| Esporas | La numeración de títulos repetidos empieza en **1** (`Reunión 1`) y la spec dice **2** |

## Pasada final en la app (2026-10-01)

Tres vueltas de corrección de las skills, cada una seguida de una evaluación ciega. En la
app real, con el framework regenerado:

- **Herramientas que viajan con las skills**: los validadores de draw.io, canvas y
  Excalidraw, el generador `dibujo.mjs` y `consultar.mjs` del calendario corren desde
  `.claude/skills/…` del vault sin nada del repo. Los 12 archivos de la segunda evaluación
  pasan sin errores ni avisos.
- **Recetas nuevas vistas en la app**: el mapa en peine (el radial de 6×3 abre al 47 % en
  vez del 34 %) y la red con íconos y etiquetas al costado.
- **Defectos que salieron de la evaluación**, todos arreglados y comprobados en la app:
  `DEF-119` (dibujo ilegible), `DEF-120` (embeds de homónimos), `DEF-121` (índice sin
  contenido: la reparación al abrir rehízo el archivo dañado) y `DEF-122` (enlaces de las
  pestañas restauradas, encontrado en esta pasada).

**Pendiente**: la confirmación del usuario con sus propios pedidos.

## Relacionadas

- [[ia-framework-vault]] — el framework: qué genera y cómo se versiona.
- [[Generar el framework de IA en un vault]] — cómo regenerar las skills tras tocar un borrador.
- [[calendario-recordatorios]] — el formato de `recordatorios.json`.
- [[Ver la UI con Playwright]] — cómo se maneja la app real desde un script.
- [[BACKLOG]] — `FUN-L-26`.
