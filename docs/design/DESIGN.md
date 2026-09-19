---
name: Mycelium
description: Tu red de conocimiento, viva y conectada
colors:
  hifa: "#19e6ff"
  brote: "#3dffc4"
  esporo: "#04090e"
  esporo-profundo: "#0b1d27"
  lienzo: "#071219"
  niebla: "#0a1a24"
  humus: "#c6e7e1"
  humus-tenue: "#6e9a99"
  borde: "#16343f"
  hifa-claro: "#0E7C8C"
  brote-claro: "#16B8C9"
  esporo-claro: "#0C4A57"
  esporo-profundo-claro: "#08323D"
  lienzo-claro: "#F1F6F7"
  niebla-claro: "#E3EEF1"
  humus-claro: "#1F2D30"
  humus-tenue-claro: "#59696C"
  brote-texto-claro: "#1B6C75"
  brote-marco-claro: "#68CED9"
  brote-marco-acento-claro: "#3FC3D1"
  enlace-roto: "#3FC4D1"
  enlace-roto-claro: "#30737E"
  ambar: "#C9821E"
  precaucion: "#D95040"
  error: "#E5484D"
  info: "#3D8BFF"
  exito: "#3CA06B"
  pregunta: "#B07CE8"
typography:
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
  reading:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  editor:
    fontFamily: "JetBrains Mono, Fira Code, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  dialog-title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
  meta:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  pill: "999px"
spacing:
  gap-inferior: "6px"
  panel-handle: "4px"
  tab-bar: "34px"
  toolbar: "40px"
  topbar: "52px"
  statusbar: "24px"
  rail: "56px"
  editor-min: "420px"
  ancho-lectura: "42rem"
components:
  button-primary:
    backgroundColor: "{colors.hifa}"
    textColor: "{colors.lienzo}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.45rem 0.75rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.humus}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.45rem 0.75rem"
  menu-trigger:
    backgroundColor: "transparent"
    textColor: "{colors.humus-tenue}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "28px"
    padding: "0 0.4rem 0 0.55rem"
  rail-button:
    textColor: "{colors.brote}"
    rounded: "{rounded.md}"
    size: "40px"
  tab:
    backgroundColor: "{colors.niebla}"
    textColor: "{colors.humus-tenue}"
    height: "34px"
    padding: "0 0.6rem"
  tab-active:
    backgroundColor: "{colors.lienzo}"
    textColor: "{colors.humus}"
  palette-trigger:
    backgroundColor: "{colors.niebla}"
    textColor: "{colors.humus-tenue}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "30px"
    padding: "0 0.75rem"
  palette:
    backgroundColor: "{colors.niebla}"
    rounded: "{rounded.md}"
    width: "min(600px, 100%)"
  palette-option:
    textColor: "{colors.humus}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.25rem 0.6rem"
  statusbar:
    backgroundColor: "{colors.esporo}"
    textColor: "{colors.humus-tenue}"
    typography: "{typography.meta}"
    height: "24px"
    padding: "0 0.75rem"
  statusbar-item:
    rounded: "{rounded.sm}"
    height: "20px"
    padding: "0 0.4rem"
  menu-item:
    textColor: "{colors.humus}"
    rounded: "{rounded.sm}"
    padding: "0.4rem 0.6rem"
  tag-pill:
    textColor: "{colors.brote}"
    rounded: "{rounded.sm}"
    padding: "0.05em 0.4em"
  tag-pill-claro:
    textColor: "{colors.brote-texto-claro}"
    rounded: "{rounded.sm}"
    padding: "0.05em 0.4em"
  rail-button-claro:
    textColor: "{colors.brote-marco-claro}"
    rounded: "{rounded.md}"
    size: "40px"
  wikilink-missing:
    textColor: "{colors.enlace-roto}"
  wikilink-missing-claro:
    textColor: "{colors.enlace-roto-claro}"
  dialog:
    backgroundColor: "{colors.niebla}"
    rounded: "{rounded.lg}"
    padding: "1.1rem"
    width: "min(420px, 92vw)"
---

# Design System: Mycelium

> [!info] Qué es este archivo
> Es el sistema visual **tal como está implementado**, escrito para que cualquier agente
> que diseñe una pantalla nueva no se salga de la marca. Lo que manda es el código:
> `frontend/styles/tokens.css`. La explicación larga, con el porqué de cada regla, vive en
> [[DESIGN_SYSTEM]]. Ojo: **sus valores de color del modo oscuro están desactualizados**;
> ante una diferencia, vale este archivo. Producto y usuarios: [[PRODUCT]].
> Extraído del código el 2026-09-18; actualizado el 2026-09-19 con los cambios de
> `colorize`, `harden`, `animate`, `adapt` y `optimize` (ver
> [[Auditoria de UI 2026-09-19]]). Ampliado el 2026-09-19 con el **rediseño del
> cascarón** (dirección «estándar de la categoría», vara VS Code y Obsidian; contrato en
> `.impeccable/surfaces/frontend-app-workspace-workspace-page-tsx.md`, seed `f12c8d73`):
> paleta de notas y comandos, barra de estado, barra del editor mínima, «Nuevo ▾» y la
> medida única de la nota.

## Overview

**Creative North Star: "El bosque bioluminiscente"**

Mycelium es un bosque de noche. El marco es oscuro y profundo —el rail, la barra superior
y el lienzo del grafo son casi negros, teñidos de azul petróleo— y lo que tiene valor
**emite luz**: los nodos del grafo, las etiquetas, el cursor, la barra que marca dónde
estás. La luz no es decoración, es información: brilla lo que está vivo, lo que está
conectado, lo que tiene el foco. Por eso el modo oscuro de Bioluminiscencia es el que
viene por defecto, y el claro es su versión diurna, no al revés.

Conviven dos densidades, y cada una tiene su lugar. **El marco es denso y técnico**, como
un IDE: texto de interfaz de 13px, controles de 22 a 40px, pestañas de 34px, mucho a la
vista y nada que pida atención en reposo. **La nota es serena**: en lectura cambia a una
serif, respira con interlineado de 1.7 y se limita a una medida de 42rem (unos 80
caracteres de serif), la misma en vivo que en lectura. Lo orgánico
del micelio se ve en los detalles, no en la cantidad: esquinas suaves, el degradé
brote→hifa (en el logo, el título del documento y el énfasis triple), el halo del
isotipo, títulos que alternan los dos colores de la marca.

**El cascarón es el estándar de la categoría**, hecho con el oficio de VS Code y
Obsidian: rail de actividad, árbol, pestañas, editor y barra de estado, y una paleta que
salta a cualquier nota o comando desde el centro de la barra superior. No se inventa un
marco nuevo; se ejecuta bien el que ya se conoce. Lo que el rediseño sacó define lo que
no vuelve: la tira de íconos sin nombre y los controles que no hacen nada.

Hay tres cosas que Mycelium nunca debe parecer: **un clon gris de Obsidian** (violeta y
grises neutros sin identidad), **un SaaS corporativo** (tarjetas blancas flotando con
sombras suaves, degradé violeta-azul) y **un neón gamer** (brillo saturado en todas
partes, donde el glow deja de señalar y pasa a ser ruido).

**Key Characteristics:**
- Marco oscuro, contenido que brilla: la luz se reserva para lo que tiene significado.
- Dos colores de marca por tema (Hifa y Brote) y el resto es tono del mismo matiz.
- Marco compacto (13px, controles chicos) frente a una lectura amplia (serif, 42rem).
- Cascarón estándar: rail, árbol, pestañas, editor, barra de estado y paleta (Ctrl+P).
- Los grupos de acciones van detrás de un botón con rótulo («Formato ▾», «Nuevo ▾»),
  no en una fila de íconos.
- Plano por defecto: las zonas se separan por tono; solo lo que flota tiene sombra.
- Todo sale de tokens: dos temas × claro/oscuro = cuatro combinaciones, siempre las cuatro.
- Brote nunca se usa en crudo como primer plano: cada uso pide su rol (texto, foco, marco).

## Colors

La paleta es **monocromática por tema**: un matiz dominante en seis a ocho tonos, más dos
colores de marca que brillan sobre él. Los valores del frontmatter son los del tema por
defecto, **Bioluminiscencia**, en oscuro (sin sufijo) y en claro (sufijo `-claro`).

### Primary
- **Hifa** (acento): el color de la acción. Botones primarios, enlaces `[[wiki]]`, el
  borde inferior de la pestaña activa, el interruptor encendido, los títulos H1/H3/H5. En
  oscuro es un cian abisal intenso, y el texto que va encima es oscuro (Lienzo). En claro
  baja a un teal legible sobre fondo blanco.
- **Brote** (glow): el color de la luz. Nodos del grafo, etiquetas, cursor, el anillo de
  foco, la barra indicadora del rail, los íconos del marco, el hover (Brote al 14–15%).
  Títulos H2/H4. En oscuro es verde agua; en claro, cian.

### Neutral
- **Esporo**: el marco, o sea rail, barra superior y barra lateral. Es lo más profundo de
  la pantalla, oscuro **también en modo claro**.
- **Esporo profundo**: lienzo del grafo, fondo del código en oscuro, y la base de la que
  se tiñen todas las sombras y velos.
- **Fondo de código** (`--mic-bg-code`): en oscuro es Esporo profundo; en claro, un tinte
  de la tinta al 7% sobre Lienzo. El código es un fragmento del mismo valor que su modo:
  claro en claro, oscuro en oscuro, para que cada paleta de sintaxis (`--mic-syntax-*`,
  con juego claro y oscuro) quede sobre el fondo para el que se diseñó. La misma paleta
  colorea los bloques en vivo, en lectura (highlight.js solo pone clases) y en el visor.
- **Lienzo**: el fondo del editor y del contenido principal. Es donde está la nota.
- **Niebla**: paneles laterales, barra de pestañas, modales, campos.
- **Humus**: la tinta del texto principal.
- **Humus tenue**: texto secundario, placeholders, íconos inactivos sobre fondo claro.
- **Borde**: en oscuro es un teal apagado propio; en claro sale de mezclar Humus al 16%.

### Brote por rol
Brote se diseñó para brillar sobre oscuro. En claro, puesto tal cual como texto, foco o
ícono no llega al mínimo de contraste (un `#tag` daba 1.95:1). Por eso cada uso pide un
**rol**, definido en `tokens.css`: en oscuro todos valen Brote, y en claro cada uno se
calibra para el fondo donde se dibuja.

| Rol | Token | Oscuro | Claro | Dónde |
|---|---|---|---|---|
| Texto | `--mic-glow-texto` | Brote | Brote 45% + tinta (**Brote texto**) | etiquetas, hover de enlaces, énfasis, íconos sobre el contenido |
| Foco | `--mic-focus` | Brote | Hifa | anillo de foco con teclado |
| Marco | `--mic-marco-glow` | Brote | Brote 60% + Niebla (**Brote marco**) | íconos, texto y foco sobre Esporo |
| Marco, segundo color | `--mic-marco-acento` | Hifa | Brote 80% + Niebla | segundo color del logo |
| Ícono del marco en reposo | `--mic-marco-inactivo` | 55% | 70% | opacidad de rail y botón de salir |
| Título de callout | `--mic-callout-tinta` | 85% | 50% | color del tipo mezclado con la tinta |

Los hex del frontmatter con sufijo `-claro` son esas mezclas resueltas en Bioluminiscencia;
en Cantarela salen de la misma fórmula. Sobre el marco (rail y barra superior) el foco se
redefine como `--mic-marco-glow`: Hifa en claro queda a 2:1 sobre Esporo.

El **enlace roto** (`[[nota]]` que no existe) va en Hifa 55% + Humus tenue, con subrayado
punteado: se distingue por la forma, no por oscurecerse.

### Secundario: el tema Cantarela
Es el mismo sistema en ámbar y marrón: el dorado de los hongos comestibles. Tiene la misma
estructura, así que ningún componente distingue entre los dos temas.

| Rol | Cantarela claro | Cantarela oscuro |
|---|---|---|
| Esporo (marco) | `#5A3408` | `#130d02` |
| Esporo profundo | `#3E2405` | `#2c200a` |
| Hifa (acento) | `#9A6212` | `#c77f2e` |
| Brote (glow) | `#D99A1F` | `#ffc247` |
| Niebla | `#FAF0DC` | `#241a08` |
| Lienzo | `#FBF7EE` | `#1b1305` |
| Humus | `#2C2620` | `#f6e8c8` |
| Humus tenue | `#6B5E4C` | `#ac9468` |
| Borde | Humus al 16% | `#40300f` |

### Colores de estado y de callout
Son fijos y no siguen al tema. Se usan en los bordes de los callouts, en las acciones
destructivas y en los estados: **Ámbar** (warning), **Precaución** (caution y el ítem
"borrar" de un menú), **Error** (error, danger), **Info**, **Éxito** (success y "sincronizado")
y **Pregunta**. Las seis marcas de color de las consolas (`--mic-consola-*`) son de
identidad, no de estado. Están calibradas para contrastar al menos 3.79:1 sobre los ocho
fondos posibles.

### Atmósferas: el tercer eje
Además del **Tema** (qué colores) y el **Modo** (claro u oscuro), el usuario elige una
**Atmósfera** para cada modo: cómo se reparten los colores del tema en fondos, marco,
títulos y bordes. Son cuatro: **Abisal** (la de siempre, descrita en esta sección),
**Niebla** (grises fríos; defecto en oscuro), **Bosque** (el tema en el marco; defecto en
claro) y **Papel** (editorial, cálida). Viven en `styles/atmosferas.css` como fórmulas
sobre los raw del tema, así que una sola definición sirve para Bioluminiscencia y
Cantarela. Detalle y decisiones en [[atmosferas]] (`FUN-M-30`).

Con las atmósferas, el marco **no siempre es oscuro**: en Niebla y Papel claros es claro.
Por eso el texto neutro sobre el marco es un token propio, `--mic-marco-texto`, y cada
atmósfera lo calibra.

### Named Rules
**The Two Voices Rule.** Cada tema tiene exactamente dos colores de marca, Hifa (lo que se
hace) y Brote (lo que brilla). Un tercer color de marca rompe el sistema. Si hace falta
distinguir más cosas, se usa tono y mezcla, no un color nuevo.

**The Token-Only Rule.** Ningún componente lleva un hex escrito a mano. Se usan los
tokens semánticos (`--mic-bg-*`, `--mic-text-*`, `--mic-accent`, `--mic-glow`). Si falta
uno, se crea en `tokens.css` mapeado en los dos temas, y recién después se usa.

**The Four Combos Rule.** Todo color se verifica en las cuatro combinaciones: Bio claro,
Bio oscuro, Cantarela claro, Cantarela oscuro — **por cada atmósfera**, o sea dieciséis. Un color de marca en crudo casi siempre
falla en alguna. Por eso los títulos **se mezclan con la tinta** (`color-mix` con Humus)
en vez de usar Hifa o Brote puros.

**The Frame Rule.** Sobre el marco nunca va un color calibrado para el lienzo: el marco
usa `--mic-marco-glow` (a `--mic-marco-inactivo` en reposo, al 100% activo o con hover)
y `--mic-marco-texto` para el texto neutro. Cada atmósfera los define según el marco sea
oscuro (Abisal, Bosque y todas en oscuro) o claro (Niebla y Papel en claro).

**The Role Rule.** Brote no se escribe en crudo como color de primer plano. Texto,
anillo de foco e íconos usan su rol (`--mic-glow-texto`, `--mic-focus`,
`--mic-marco-glow`); Brote en crudo queda para fondos tenues (hover al 14–15%, tintes) y
para el grafo, que siempre se dibuja sobre oscuro.

## Typography

**Interfaz:** Geist (con system-ui)
**Lectura:** Source Serif 4 (con Georgia)
**Edición y código:** JetBrains Mono (con Fira Code)

**Character:** una sans neutra y compacta para el marco, que no compite. Una serif con
cuerpo para leer, que es lo que convierte la nota en un documento. Y una mono para
escribir, donde cada carácter del markdown cuenta. Quien usa la app puede cambiar las
familias de edición y de lectura desde Configuración (Inter, Lora, Fira Code, Source Code
Pro); la interfaz siempre va en Geist.

### Hierarchy
- **Headline** (700, 1.75rem): el H1 de una nota, en lectura y en vivo, con color Hifa
  mezclado con la tinta.
- **Title** (600, 1.375rem): el H2, en Brote mezclado. El H3 va en 1.125rem y del H4 al
  H6 van en 1rem. Se distinguen por **color** además de por tamaño: la rampa alterna
  Hifa y Brote y pierde intensidad en cada nivel, hasta que el H6 queda en Humus tenue.
- **Reading** (400, 16px, interlineado 1.7): el cuerpo de la nota en lectura, a la
  medida de lectura (42rem).
- **Editor** (400, 16px, interlineado 1.65): la mono del editor en vivo y en crudo.
- **Body** (400, 0.8125rem): **el tamaño de la interfaz**. Pestañas, menús, botones,
  árbol de archivos, campos.
- **Dialog title** (600, 0.95rem): el título de un modal.
- **Label** (600, 0.75rem): encabezados de sección de un panel, metadatos, avisos. Por
  debajo hay 0.6875rem, solo para contadores, atajos (`kbd`) y detalles mínimos.
- **Meta** (400, 0.75rem, cifras tabulares en la barra de estado): el texto de la barra
  de estado y el detalle a la derecha de una opción de la paleta. Informa, no rotula.

### Named Rules
**The Two Densities Rule.** La interfaz habla en 13px y la nota en 16px. No se agranda
el marco para que "respire", ni se achica la nota para que entre más.

**The Semibold Ceiling Rule.** En la interfaz, el énfasis máximo es 600. El 700 es para
el contenido y la marca: el H1 de una nota, el título del documento, el énfasis triple y
el logo.

## Layout

El workspace es una **grilla fija de marco** de tres filas: barra superior de 52px,
el cuerpo, y la **barra de estado** de 24px (`--mic-statusbar-height`, área `estado`) que
cruza todo el ancho al pie. En el cuerpo: rail vertical de 56px a la izquierda, un panel
izquierdo de 240px y uno derecho de 280px, los dos redimensionables entre 160 y 480px
con un tirador de 4px. Entre ellos, el área de panes, que se puede partir en filas y
columnas, cada una con su barra de pestañas de 34px y la barra del editor de 40px. Al
pie de toda pantalla de altura completa quedan 6px de aire (`--mic-gap-inferior`), para
que nada parezca seguir por detrás del borde de la ventana.

Qué va en cada zona, y nada más:

- **Barra superior:** el logo a la izquierda y, al centro, el disparador de la paleta
  («Ir a una nota o comando… Ctrl+P»); a la derecha, salir del vault. No hay
  «Compartir»: en desktop no existe.
- **Rail:** arriba Explorador, Búsqueda, Esporas, Grafo (con el isotipo) y Consolas;
  abajo Papelera y Configuración. Una sección que todavía no existe no ocupa lugar.
- **Panel izquierdo:** el árbol. **Pane:** pestañas, barra del editor y la nota.
- **Barra de estado:** lo que se quiere saber de la nota activa sin abrir nada.

**La medida de la nota** (`--mic-ancho-lectura: 42rem`) es la misma en vivo
(`.cm-content`) y en lectura: una sola hoja, centrada, que no cambia de ancho al cambiar
de modo. Va en **rem y no en ch** porque el `ch` de la mono del editor es más ancho que
el de la serif de lectura: con 72ch la hoja saltaba al cambiar de modo. 42rem son unos 80
caracteres de serif y unos 70 de mono.

El ritmo de separación es corto y en rem: 0.25 / 0.35 / 0.5 / 0.75 / 1rem.

**Ventana angosta.** Es una app de escritorio con ventana mínima de 640×480, así que lo
angosto es media pantalla, no un teléfono. La regla es repartir, no esconder: la nota
conserva siempre al menos 420px (`--mic-editor-min-width`, unos 50 caracteres a 16px) y
el panel izquierdo cede ancho hasta su mínimo para dárselos, sin cambiar la preferencia
guardada. Por debajo de 768px la barra superior se compacta: el logo queda en su isotipo
y el disparador de la paleta pierde el atajo y recorta su texto, pero no se esconde.

**Movimiento.** Corto y de estado: 120ms para hover y opacidad, 160ms para paneles y
cambio de nota; la paleta aparece en 120ms bajando 4px. El único movimiento de autor es
el flujo por las aristas del grafo. Toda animación tiene alternativa con
`prefers-reduced-motion`: se quita el desplazamiento y se conserva lo que informa (el
cajón entra con fundido en vez de deslizarse, la paleta aparece sin animar, el flujo del
grafo pasa a flechas).

## Elevation & Depth

**Plano por defecto, sombra solo al flotar.** Las zonas se separan por **tono**: Esporo
(marco) → Niebla (paneles, pestañas) → Lienzo (contenido). No hay bordes gruesos ni
tarjetas elevadas. Solo tiene sombra lo que flota por encima del plano: menús
contextuales, submenús, desplegables, avisos, modales y la paleta. En reposo, la
pantalla principal no tiene nada flotando: **la paleta es la única superficie de trabajo
que flota sobre el cascarón**, plana (Niebla, borde de 1px, 8px de radio) con sombra de
modal, sobre un velo leve de Lienzo al 35%. Esa sombra **nunca es negra
genérica**: se tiñe con Esporo profundo, así que en Cantarela es marrón y en
Bioluminiscencia, azul petróleo.

### Shadow Vocabulary
- **Menú** (`0 8px 24px color-mix(in srgb, var(--mic-raw-base-deep) 20%, transparent)`):
  menús contextuales, submenús, listas de sugerencias.
- **Aviso** (`0 6px 20px color-mix(in srgb, var(--mic-raw-base-deep) 30%, transparent)`):
  barras de progreso y avisos flotantes.
- **Modal** (`0 12px 32px color-mix(in srgb, var(--mic-raw-base-deep) 35%, transparent)`),
  sobre un velo de Esporo profundo al 40%.
- **Diálogo grande** (`0 16px 48px color-mix(in srgb, var(--mic-raw-base-deep) 45%, transparent)`):
  actualización, editor de CSS.
- **Pane con foco** (`inset 0 1px 0 color-mix(in srgb, var(--mic-glow) 35%, transparent)`):
  una línea de luz de 1px arriba del pane activo. No es elevación, es señal.

### Named Rules
**The Tinted Shadow Rule.** Una sombra se tiñe siempre con `--mic-raw-base-deep`. Una
`rgba(0,0,0,…)` desentona con el tema cálido.

**The No-Opacity-Container Rule.** Nada se "apaga" con `opacity` sobre un contenedor. Crea
un contexto de composición y vuelve translúcido todo lo que cuelga de él, incluidos
menús y tooltips. Se atenúa la hoja concreta (el ícono, la etiqueta) o se usa color y
borde. Lo que se dibuja encima de otras cosas va en un portal a `document.body`.

## Shapes

Esquinas suaves, nunca vivas: el micelio es orgánico. Hay tres radios y una píldora.
**Suave** (4px) para botones, ítems de menú, controles chicos y etiquetas; es por lejos
el más usado. **Redondeado** (8px) para campos de búsqueda, botones del rail, menús y
avisos. **Amplio** (16px) solo para modales. **Píldora** (999px) para interruptores,
chips de propiedades y contadores. La barra del rail activo (3px, redondeada del lado que
mira al contenido) es la marca lateral del sistema: señala dónde estás, como en VS Code.
No es un recurso para decorar tarjetas, callouts ni filas: el borde de 3px de los
callouts es una deuda (ver Components), no una forma que se copie.

## Components

### Buttons
Precisos y silenciosos: chicos, sin cuerpo en reposo, se encienden al pasar el mouse.
- **Shape:** esquina suave (4px); el botón con contorno de la barra superior, 8px.
- **Primary:** fondo Hifa, texto Lienzo, 600, `0.45rem 0.75rem`. Es uno por diálogo,
  la acción que cierra el flujo.
- **Hover:** el primario se oscurece (Hifa mezclado al 85% con negro). El resto de los
  clickeables toma Brote al 15% de fondo y pasa a Humus si estaba en Humus tenue.
- **Focus:** anillo global de 2px en `--mic-focus`, separado 2px. No se reemplaza por
  componente: si un contexto necesita otro color (el marco), redefine el token.
- **Secondary:** transparente, con borde de 1px y texto Humus.
- **Botón de menú con rótulo** («Formato ▾», «Nuevo ▾»): texto de 13px en Humus tenue
  más un chevron de 14px, 28px de alto, esquina suave. Con hover o abierto
  (`aria-expanded`) toma Brote al 15% de fondo y el texto pasa a Humus. Ver *Menú
  emergente con rótulo*.
- **Ícono del marco** (salir del vault): Brote del marco a opacidad de reposo; con hover,
  opacidad plena y borde al 40%.
- **Deshabilitado / inerte:** opacidad 0.35–0.45 **sobre el botón**, con cursor normal.

### Chips
- **Etiqueta (`#tag`):** fondo Brote al 15%, texto en `--mic-glow-texto`, esquina suave,
  al 0.9em del texto que la rodea.
- **Pastilla de propiedad:** píldora con fondo Humus tenue al 18%.

### Inputs / Fields
- **Style:** sin borde, fondo Niebla, esquina redondeada (8px).
- **Disparador de la paleta:** en la barra superior, un **botón** con forma de campo
  (no un campo que no busca): 30px de alto, como mucho 480px de ancho, lupa, el texto
  «Ir a una nota o comando…» en Humus tenue y el atajo `Ctrl+P` en un `kbd` de 11px con
  borde fino. Con hover, Niebla mezclada al 20% con el Brote del marco.
- **Focus:** el anillo global. Si el campo anula su outline para no dibujarlo adentro, la
  caja que lo contiene lo muestra con `:focus-within`; ningún campo queda sin foco visible.
- **Interruptor:** píldora de 34×18px que se llena de Hifa al encenderse.
- **Controles nativos:** `color-scheme` sigue al modo oscuro, y la lista de un `<select>`
  usa Niebla con la opción marcada en Hifa. Si no, el navegador la pinta en blanco.

### Navigation
- **Rail:** botones de 40px sobre Esporo, íconos Lucide de 20px en Brote del marco a
  opacidad de reposo (55% oscuro, 70% claro). El activo va a opacidad plena, con una barra
  de 3px pegada al borde izquierdo.
- **Grafo en el rail:** su ícono es el isotipo de Mycelium (tres nodos unidos por hifas)
  dibujado en trazo de línea, con la grilla de 24 y el grosor 2 de los íconos Lucide. No
  se usa `Share2`: es el ícono de «Compartir» y hacía ver la función insignia como una
  acción genérica.
- **Pestañas:** 34px de alto, texto de 13px en Humus tenue, separadas por una línea de
  1px. Ancho flexible entre 72 y 260px: con espacio libre el título se lee entero, con
  muchas pestañas ceden todas por igual. La activa toma el fondo Lienzo, un borde
  inferior de 2px en Hifa y el texto en Humus. Una pestaña de vista previa lleva el
  título en cursiva, y las consolas suman una barra de color de 3px a la izquierda.
- **Pestañas con teclado:** patrón `tablist` con *roving tabindex*: una sola parada de
  Tab (la activa), flechas izquierda/derecha con vuelta, Inicio y Fin, Supr cierra y deja
  el foco en la que queda activa. La cruz de cerrar sale del orden de Tab. El anillo de
  foco va **hacia adentro** (`outline-offset: -2px`), porque la barra recorta lo que
  sobresale.
- **Menú contextual:** fondo Lienzo, borde fino, radio de 8px, sombra de menú. Ítems de
  13px con esquina suave; los destructivos, en Precaución. Una entrada que no se puede
  usar **se muestra atenuada con el motivo, nunca se oculta**.

### Barra del editor
Mínima, de 40px: a la izquierda «Formato ▾», único punto de entrada al formato; a la
derecha buscar en la nota, el panel de enlaces (`aria-pressed`), los modos (vivo,
lectura, lado a lado, crudo) y «…» al extremo derecho, como en VS Code y Obsidian. Los
íconos son de 16px. No hay tira de íconos de formato ni punto de color de
sincronización: el estado de guardado vive en la barra de estado, dicho con palabras.

### Explorador
«Nueva nota», lo que más se usa, queda como ícono; el resto de lo que se puede crear
(dibujo, base, lienzo, carpeta, importar) va detrás de «Nuevo ▾». El menú es `fixed`
respecto de la ventana, calculado desde el botón, porque el panel lateral recorta lo que
se sale.

### Menú emergente con rótulo (sistema)
Un grupo de acciones se ofrece como **un botón con texto y chevron** que abre un menú,
nunca como una fila de íconos sin nombre. Ejemplos: «Formato ▾» en la barra del editor,
«Nuevo ▾» en el explorador. El menú usa la forma del menú contextual (Lienzo, borde fino,
radio de 8px, sombra de menú, ítems de 13px con ícono de 15px en Humus tenue) y el
comportamiento de `useMenuEmergente`: clic afuera y Tab cierran, Escape cierra y
devuelve el foco al botón, flechas, Inicio y Fin recorren los ítems con vuelta, al abrir
el foco va al primero, y hay uno solo abierto a la vez. Si el menú puede quedar recortado
por su contenedor, va `fixed` o en un portal; si es largo, se desplaza (como mucho 70vh).

### Paleta de notas y comandos (signature)
El camino corto a cualquier nota o acción, como el selector rápido de Obsidian y la
paleta de VS Code. Se abre con Ctrl+O (notas) o Ctrl+P / Ctrl+Shift+P (comandos: el texto
empieza con «>»), y desde el disparador de la barra superior. Un solo campo de 40px y
14px, sin anillo: el foco lo marca la línea inferior, que pasa a `--mic-focus`. Debajo,
la lista de opciones (30px, 13px, ícono de 15px) con el detalle a la derecha en Meta; la
activa toma `--mic-focus` al 16% de fondo y su ícono ese color. Sin coincidencia exacta
ofrece «Crear nota «…»». Al pie, una línea de ayuda con los atajos en `kbd`. Es un
`combobox` con `aria-activedescendant`: el foco no deja el campo. Al abrir una nota, el
foco va a la nota abierta. Mide como mucho 600×460px y cuelga debajo de la barra
superior, centrada.

### Barra de estado (signature)
24px, fondo Esporo con una línea superior de Brote del marco al 14%, texto Meta
alineado a la derecha: «12 enlaces · 5 te citan · 843 palabras · Guardado 14:02». Solo lo
que no se ve en la nota misma, y solo para notas de texto (en el grafo o una consola
queda vacía: no se inventan ceros).
- **Enlaces · te citan** es un botón que abre el panel de enlaces, que arranca cerrado.
  Abierto, lleva `aria-pressed` y se marca con **color y fondo**, no solo con color.
- **Guardado** dice la hora si fue hoy y la fecha si fue otro día; «Guardando…» mientras
  escribe y «Sin guardar» en `--mic-sync-warn` si falla. Sin `role="status"`, para no
  anunciar cada tecla.
- **Color:** en reposo, neutro (Humus tenue en oscuro; Niebla al 78% con el marco en
  claro). El Brote del marco aparece solo con hover o presionado, al 12–14% de fondo.
  Contraste medido en reposo: 6.42 (Bio oscuro), 5.76 (Bio claro), 6.62 (Cantarela
  oscuro), 6.54 (Cantarela claro).
- Separador «·» generado por CSS, que el lector de pantalla no lee. Cifras tabulares.

### Callout (signature)
Fondo del color del tipo al 8%, título con el color del tipo mezclado con la tinta según
`--mic-callout-tinta`, esquinas redondeadas del lado derecho. Tiene diez tipos, que se
pueden plegar y anidar. Es el componente que más identifica a las notas de Mycelium. Hoy
lleva además un borde izquierdo de 3px en el color del tipo: es una **deuda**, no parte
de la firma (ver abajo).

### Logo (signature)
El isotipo (tres nodos unidos por hifas) con un halo de Brote, y la palabra con un degradé
de Brote a Hifa, en los colores del marco. En una ventana angosta queda solo el isotipo.

### Degradé de marca (signature)
El degradé Brote → Hifa (`linear-gradient(90deg, glow, accent)`, recortado al texto) es
la firma tipográfica de Mycelium y tiene **tres usos, y solo tres**: la palabra del logo,
el título del documento (el nombre de la nota arriba del contenido) y el énfasis triple
(`***texto***` / `___texto___`). Siempre en peso 700.

### Grafo (signature)
Nodos con halo sobre un lienzo que es oscuro en cualquier tema, aristas curvas y, si se
elige, un flujo animado que recorre las aristas en la dirección del enlace. Con
movimiento reducido el flujo pasa a flechas y el bucle se detiene; y un grafo que no se
ve no anima ni dibuja.

### Deudas conocidas (no son reglas)
Lo que el build lleva y el sistema **no** adopta. No se copia a superficies nuevas.
- **Franja lateral de 3px en los callouts**, en vivo y en lectura (`styles/editor.css`,
  `:where(.mic-live-callout)` hacia la línea 393 y `.mic-preview .mic-callout` hacia la
  998). Un borde de color de más de 1px al costado de un bloque es un recurso gastado; la
  identidad del callout está en el fondo tintado y el título en color.
- **Celda sombreada fantasma** a la izquierda del encabezado de una tabla en modo vivo.

## Do's and Don'ts

### Do:
- **Do** usar solo tokens `var(--mic-*)` y verificar cada color nuevo en los cuatro
  combos de tema y modo.
- **Do** separar zonas por tono (Esporo → Niebla → Lienzo) antes de pensar en un borde o
  una sombra.
- **Do** reservar el brillo de Brote para lo que tiene significado: foco, selección,
  conexión, lo activo.
- **Do** mantener la interfaz en 13px y la lectura en 16px con serif, a la misma medida
  (42rem) en vivo y en lectura.
- **Do** teñir las sombras con Esporo profundo y darles sombra solo a los elementos que
  flotan.
- **Do** mostrar atenuada, y con su motivo, la acción que no está disponible, en vez de
  ocultarla.
- **Do** usar el rol de Brote que corresponda (`--mic-glow-texto`, `--mic-focus`,
  `--mic-marco-glow`) cada vez que Brote vaya en primer plano.
- **Do** dar a toda animación una alternativa con `prefers-reduced-motion` que conserve
  lo que informa, y detener todo bucle que no esté a la vista.
- **Do** repartir el espacio en una ventana angosta —la nota conserva 420px— en vez de
  esconder funciones.
- **Do** agrupar acciones detrás de un botón con rótulo y chevron («Formato ▾», «Nuevo
  ▾») con el comportamiento de `useMenuEmergente`.
- **Do** llevar a la paleta (Ctrl+P) las acciones que no merecen un lugar fijo en el
  marco, y a la barra de estado lo que se quiere saber de la nota sin abrir nada.
- **Do** hacer navegable con teclado cada grupo del marco (pestañas con flechas, menús
  con flechas y Escape), con el anillo hacia adentro donde el contenedor recorta.

### Don't:
- **Don't** parecer un clon gris de Obsidian: nada de violeta ni de grises neutros sin
  matiz. El neutro de Mycelium siempre tiene el tono de su tema.
- **Don't** parecer un SaaS corporativo: nada de tarjetas blancas elevadas con sombras
  suaves ni degradés violeta-azul.
- **Don't** convertirlo en neón gamer: el glow saturado en todas partes deja de
  señalar. El degradé de marca tiene tres usos (logo, título del documento, énfasis
  triple) y ninguno más.
- **Don't** escribir Brote en crudo como color de texto, foco o ícono: en claro no llega
  al contraste mínimo.
- **Don't** escribir un hex a mano en un componente ni usar `rgba(0,0,0,…)` para una
  sombra.
- **Don't** poner sobre Esporo un color calibrado para fondo claro (el Humus tenue del
  modo claro incluido).
- **Don't** volver a una tira de íconos sin nombre para el formato o para crear: es lo
  que el rediseño del cascarón sacó.
- **Don't** mostrar un control que no hace nada ni una sección que todavía no existe
  (un buscador que no busca, «Compartir» en desktop, Tags en el rail). Lo que no se
  puede usar *en este contexto* se atenúa con su motivo; lo que no existe, no se muestra.
- **Don't** decir un estado solo con un color (el viejo punto de sincronización): se dice
  con palabras.
- **Don't** atenuar con `opacity` una fila, un panel o cualquier contenedor.
- **Don't** tratar el modo oscuro como un tema aparte: es un modificador (`data-dark`)
  sobre el tema activo.
