# Sistema de diseño — Mycelium

## Concepto de marca

El micelio es la red subterránea de filamentos que conecta los árboles del
bosque. Cada nota es un nodo; cada enlace `[[...]]` es una hifa que conecta.
El graph view es, literalmente, un micelio. Toda la identidad refuerza la idea
de una **red viva y conectada**.

Tagline: "Tu red de conocimiento, viva y conectada".

## Lenguaje de formas

- Esquinas muy redondeadas, sin aristas duras (el micelio es orgánico).
- Motivo gráfico recurrente: nodos conectados por filamentos curvos. Usar en
  logo, estados vacíos y loaders.
- Crecimiento radial para animaciones (guardado, sync, creación) — expansión
  desde un centro, como un micelio que se extiende.

## Arquitectura de tokens (dos capas)

El código usa SOLO tokens semánticos. Los temas redefinen los tokens "raw".
Un usuario crea un tema propio redefiniendo ~6 colores raw y todo se recalcula.

```css
:root {
  --mic-bg-canvas:     var(--mic-raw-canvas);
  --mic-bg-surface:    var(--mic-raw-mist);
  --mic-bg-sidebar:    var(--mic-raw-base);
  --mic-bg-code:       var(--mic-raw-base-deep);
  --mic-text-primary:  var(--mic-raw-ink);
  --mic-text-muted:    var(--mic-raw-ink-muted);
  --mic-accent:        var(--mic-raw-accent);   /* botones, links activos */
  --mic-glow:          var(--mic-raw-glow);     /* nodos, tags, cursor */
}
```

## Tema por defecto: Bioluminiscencia (verde-cian)

Evoca los hongos que brillan en la oscuridad. Es la identidad central.

```css
[data-theme="bioluminiscencia"] {
  --mic-raw-base:       #085041;
  --mic-raw-base-deep:  #04342C;
  --mic-raw-accent:     #0F6E56;
  --mic-raw-glow:       #5DCAA5;
  --mic-raw-mist:       #E1F5EE;
  --mic-raw-canvas:     #F1EFE8;
  --mic-raw-ink:        #2C2C2A;
  --mic-raw-ink-muted:  #5F5E5A;
}
```

Nombres de marca de los colores: Esporo (#085041), Hifa (#1D9E75 / acento),
Brote (#5DCAA5 / glow), Niebla (#E1F5EE), Humus (#2C2C2A), Lienzo (#F1EFE8).

## Tema secundario incluido: Cantarela (ámbar)

El dorado cálido de los hongos comestibles del sotobosque. Acogedor, ideal para
lectura prolongada. Viene de fábrica, seleccionable, pero NO es el predeterminado.

```css
[data-theme="cantarela"] {
  --mic-raw-base:       #633806;
  --mic-raw-base-deep:  #412402;
  --mic-raw-accent:     #854F0B;
  --mic-raw-glow:       #EF9F27;
  --mic-raw-mist:       #FAEEDA;
  --mic-raw-canvas:     #FAF6EE;
  --mic-raw-ink:        #2C2C2A;
  --mic-raw-ink-muted:  #5F5E5A;
}
```

## Dark Mode

El modo oscuro es **ortogonal** al selector de tema: se activa con el atributo `data-dark="true"` en `<html>`, independientemente del tema activo. Solo se sobreescriben los tokens que cambian visualmente; `raw-accent` y `raw-glow` permanecen iguales en ambos modos.

```css
[data-theme="bioluminiscencia"][data-dark="true"] {
  --mic-raw-canvas:     #04342C;
  --mic-raw-mist:       #085041;
  --mic-raw-ink:        #E1F5EE;
  --mic-raw-ink-muted:  rgba(225, 245, 238, 0.55);
}

[data-theme="cantarela"][data-dark="true"] {
  --mic-raw-canvas:     #412402;
  --mic-raw-mist:       #633806;
  --mic-raw-ink:        #FAEEDA;
  --mic-raw-ink-muted:  rgba(250, 238, 218, 0.55);
}
```

Hay 4 combinaciones posibles: Bio Claro · Bio Oscuro · Cant Claro · Cant Oscuro. El toggle vive en el settings drawer, accesible desde el ícono de configuración en la parte **inferior** del rail.

### Reglas para agentes — dark mode

- NUNCA asumir que el modo oscuro es un tema separado. Es un modifier (`data-dark="true"`) aplicado sobre el tema activo.
- Verificar contraste en las 4 combinaciones al diseñar cualquier componente nuevo.
- `--mic-raw-base` y `--mic-raw-base-deep` NO cambian con dark mode — siguen siendo los colores oscuros del sidebar/rail, que ya son oscuros en modo claro también.

## Controles nativos: `<select>`, fechas y todo lo que dibuja el navegador

> [!important] Regla — todo desplegable nuevo
> Un `<select>` tiene **dos partes y solo una está en el documento**. La caja cerrada se
> estila como cualquier otra; **la lista desplegada la dibuja el navegador fuera del DOM**, y
> ninguna regla de un `.module.css` la alcanza. Por eso el mismo defecto reaparecía en cada
> funcionalidad con un desplegable: el control se veía bien y la lista salía en blanco, con
> el texto casi invisible en modo oscuro.
>
> Ya está resuelto **globalmente**, y por eso no hay que hacer nada por componente:
>
> | Dónde | Qué hace |
> |---|---|
> | `styles/tokens.css` | `color-scheme: light` en `:root` y `color-scheme: dark` en `[data-dark='true']` |
> | `app/globals.css` | `select option` con `--mic-text-primary` sobre `--mic-bg-surface` |
>
> `color-scheme` es la pieza que no se puede omitir: es lo único que le dice al navegador
> **con qué luz dibujar lo suyo** — esta lista, el calendario de un `input[type="date"]`, los
> spinners de un `number`, los controles nativos. Sin ella no hay CSS que arregle el popup,
> porque el popup no está en la página.

Qué hacer al construir un desplegable:

- **Usar `<select>` a secas.** Hereda el arreglo. Estilá la caja cerrada en tu `.module.css`
  como cualquier otra caja (fondo `--mic-bg-base`, borde `--mic-border`).
- **No repitas `option { … }`** en el módulo del componente: ya está en `globals.css`, y
  duplicarlo hace que la próxima corrección tenga que aplicarse en N sitios.
- **Si el desplegable NO es un `<select>`** —un menú propio en un `<div>`, un combo con
  buscador— entonces sí vive en el documento y va estilado con tokens como cualquier panel.
  El caso de referencia es `GraphOptionsMenu`, que además se **acota a la pantalla**
  (`DEF-047`/`DEF-053`).
- **Probalo en modo oscuro antes de darlo por terminado**, y con la lista **abierta**. Con la
  lista cerrada este defecto no se ve: es exactamente lo que lo dejó pasar tantas veces.

## Tipografía

- Geist Sans — interfaz y títulos. Geométrica, clara, moderna sin ser fría.
- Source Serif (u otra serif de lectura) — modo lectura. Calidez editorial.
- JetBrains Mono — código y bloques de sintaxis. Con ligaduras.

## Temas personalizados (paridad con Obsidian)

Los dos temas oficiales son el piso, no el techo. El usuario puede escribir CSS
propio que redefina los tokens raw. Su CSS se guarda en R2
(`usuarios/{userId}/temas/custom.css`) y se carga al iniciar sesión. Si el CSS
tiene errores, se muestran con número de línea sin romper la interfaz.

## Reglas para agentes

- NUNCA hardcodear un color hex en un componente. Usar `var(--mic-*)`.
- Si un componente necesita un color que no existe como token, agregar el token
  semántico primero, mapeado en ambos temas, y recién después usarlo.
- Soportar modo claro y oscuro. Verificar contraste de texto sobre cada fondo.
- Texto sobre fondo de color: usar un tono claro de la MISMA familia, nunca
  negro puro ni gris genérico.

---

## Tokens de tipografía

Agregar en `:root` junto a los tokens de color. Las tres familias son las únicas
fuentes del proyecto — no introducir otras.

```css
:root {
  --mic-font-sans:  'Geist Sans', system-ui, sans-serif;   /* interfaz, labels, UI */
  --mic-font-serif: 'Source Serif 4', Georgia, serif;       /* modo lectura del preview */
  --mic-font-mono:  'JetBrains Mono', 'Fira Code', monospace; /* editor, código, hints */
}
```

Escala de tamaños de referencia (sin tokens extra — usar rem directamente):

| Uso | Tamaño |
|-----|--------|
| UI base (labels, menús, tabs) | `0.875rem` (14 px) |
| Labels pequeños, tabs, tooltip | `0.8125rem` (13 px) |
| Hints, atajos de teclado, badges | `0.75rem` (12 px) |
| Títulos de panel (explorador, etc.) | `0.875rem` + `font-weight: 600` |
| Título de nota en preview h1 | `1.75rem` + `font-weight: 700` |

Tokens contextuales de tipografía (HU-14) — sobreescritos por `preferencesStore`:

```css
:root {
  --mic-editor-font-family:  var(--mic-font-mono);   /* fuente del editor CodeMirror */
  --mic-editor-font-size:    16px;
  --mic-preview-font-family: var(--mic-font-serif);  /* fuente del preview renderizado */
  --mic-preview-font-size:   16px;
}
```

---

## Tokens de callout (HU-03)

Definidos por tema (dentro de cada bloque `[data-theme="..."]`). Los componentes que renderizan callouts usan estos tokens — NUNCA colores hex directos.

| Tipo | Token de borde | Color referencia |
|------|---------------|-----------------|
| `NOTE` | `--mic-callout-note-border` | `var(--mic-raw-glow)` |
| `TIP` | `--mic-callout-tip-border` | `var(--mic-raw-glow)` |
| `IMPORTANT` | `--mic-callout-important-border` | `var(--mic-raw-accent)` |
| `WARNING` | `--mic-callout-warning-border` | `var(--mic-amber-icon)` |
| `CAUTION` | `--mic-callout-caution-border` | `#D95040` (rojo fijo) |

El fondo de todos los tipos usa `--mic-callout-bg: var(--mic-raw-mist)`.

---

## Tokens de métrica

Todos son métricas (dimensiones, radios, duración), no colores. Viven en `:root`
sin redefinición por tema, salvo que un tema futuro lo requiera explícitamente.

```css
:root {
  /* Radio de esquinas */
  --mic-radius-sm: 4px;
  --mic-radius-md: 8px;
  --mic-radius-lg: 16px;

  /* Shell del workspace */
  --mic-topbar-height:  52px;
  --mic-toolbar-height: 40px;   /* barra de herramientas del editor */
  --mic-rail-width:     56px;
  --mic-icon-size:     20px;    /* íconos Lucide dentro del rail */

  /* Paneles laterales (los valores de runtime se inyectan como inline style) */
  --mic-panel-left-width:  240px;   /* fallback; sobreescrito por panelLayoutStore */
  --mic-panel-right-width: 280px;   /* fallback */
  --mic-panel-handle-width: 4px;    /* columna del resize handle en el grid */
  --mic-panel-min-width:   160px;
  --mic-panel-max-width:   480px;
  --mic-panel-transition:  160ms ease;

  /* Animaciones */
  --mic-note-swap: 160ms ease;      /* transición de swap de contenido de nota (HU-20) */
}
```

---

## Layout del workspace

El workspace es un grid CSS de **4 columnas y 2 filas** definido en
`app/(workspace)/page.tsx`. Esta es la única fuente de verdad del layout global.

```
┌───────────────────────────────────────────────────────────┐
│               AppTopbar  (52 px, grid-column 1/-1)        │
├──────┬───────────────┬──────────────────┬─────────────────┤
│      │               │                  │                 │
│ Rail │  Left panel   │  Editor / tabs   │  Right panel    │
│ 56px │  (240 px def) │      (1fr)       │  (280 px def)   │
│      │               │                  │                 │
└──────┴───────────────┴──────────────────┴─────────────────┘
```

```css
.mic-workspace {
  display: grid;
  grid-template-columns: var(--mic-rail-width)
                         var(--mic-panel-left-width)
                         1fr
                         var(--mic-panel-right-width);
  grid-template-rows: var(--mic-topbar-height) 1fr;
  height: 100vh;
  min-height: 0;
}
```

### Fondo por zona

| Zona | Token de fondo | Observación |
|------|---------------|-------------|
| AppTopbar | `--mic-bg-sidebar` | Mismo color que el rail → banda oscura continua a todo el ancho |
| Rail | `--mic-bg-sidebar` | Unificado con el topbar visualmente |
| Left panel | `--mic-bg-surface` | Tono intermedio |
| Editor (pane código) | `--mic-bg-surface` | Mismo que left panel |
| Preview (pane renderizado) | `--mic-bg-canvas` | El tono más claro, cálido |
| Right panel | `--mic-bg-surface` | Igual que left panel |

El efecto buscado: la banda `topbar + rail` forma un marco oscuro continuo en la
parte superior e izquierda. El contenido principal (editor + preview) descansa
sobre el canvas. Los paneles laterales son el nivel intermedio.

### Comportamiento de colapso

- Un panel colapsado tiene `width: 0; overflow: hidden` — el track del grid NO
  cambia, el panel encoge hacia cero.
- Ambos paneles colapsados → el editor ocupa el `1fr` más los anchos de panel,
  dando full width sin reshape del grid.
- El rail NUNCA colapsa. El topbar NUNCA colapsa.

---

## Estados visuales comunes

Todos los componentes interactivos siguen estos patrones. No inventar variantes.

### Hover (sobre cualquier elemento clickeable)

```css
background-color: color-mix(in srgb, var(--mic-glow) 15%, transparent);
color: var(--mic-text-primary);  /* si el texto estaba en --mic-text-muted */
```

### Focus visible (accesibilidad — todos los elementos focusables)

```css
outline: 2px solid var(--mic-glow);
outline-offset: 2px;
```

### Activo / seleccionado — variantes por contexto

| Contexto | Indicador visual |
|----------|-----------------|
| Íconos del rail | `color: var(--mic-glow)` a opacidad plena + barra lateral izquierda de 3 px en `--mic-glow` |
| Pestañas del editor | `background: var(--mic-bg-canvas)` + `border-bottom: 2px solid var(--mic-accent)` |
| Tabs del panel derecho (Grafo/Salientes/Retro) | `border-bottom: 2px solid var(--mic-accent)` + `color: var(--mic-text-primary)` |
| Botones de modo (Editor/Dividido/Lectura) | `border: 1px solid var(--mic-accent)` + `background: var(--mic-bg-surface)` |
| Ítem de archivo en el explorador | `background: color-mix(in srgb, var(--mic-glow) 12%, transparent)` |

### Barra indicadora del rail (patrón `::before`)

```css
/* Se aplica al botón activo del rail con aria-pressed="true" */
.mic-rail-button[aria-pressed='true']::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  border-radius: 0 var(--mic-radius-sm) var(--mic-radius-sm) 0;
  background-color: var(--mic-glow);
}
```

### Íconos sobre fondo oscuro (rail y topbar)

Sobre `--mic-bg-sidebar`, los colores calibrados para fondo claro no funcionan:
- Inactivo: `color: var(--mic-glow)` con `opacity: 0.55`
- Activo / hover: `color: var(--mic-glow)` con `opacity: 1`
- **NUNCA** usar `--mic-text-muted` sobre `--mic-bg-sidebar` — está calibrado para
  fondo claro y genera contraste insuficiente.

---

## Tipografía en el preview de Markdown

El área `.mic-preview` aplica estas reglas. Todos los estilos usan tokens `--mic-*`.

```css
.mic-preview {
  font-family: var(--mic-font-sans);
  font-size: 0.9375rem;   /* 15px — ligeramente mayor que UI para legibilidad */
  line-height: 1.7;
  color: var(--mic-text-primary);
  background: var(--mic-bg-canvas);
  padding: var(--mic-radius-lg);
}

/* Modo lectura: serif + columna centrada */
.mic-layout--read .mic-preview {
  font-family: var(--mic-font-serif);
  max-width: 72ch;
  margin: 0 auto;
}

/* Headings */
.mic-preview h1 { font-size: 1.75rem;  font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; }
.mic-preview h2 { font-size: 1.375rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.4rem; }
.mic-preview h3 { font-size: 1.125rem; font-weight: 600; margin-top: 1rem;    margin-bottom: 0.3rem; }
.mic-preview h4,
.mic-preview h5,
.mic-preview h6 { font-size: 1rem;     font-weight: 600; margin-top: 0.75rem; }

/* Párrafos y listas */
.mic-preview p   { margin-bottom: 0.85rem; }
.mic-preview ul,
.mic-preview ol  { padding-left: 1.5rem; margin-bottom: 0.85rem; }
.mic-preview li  { margin-bottom: 0.25rem; }

/* Links */
.mic-preview a       { color: var(--mic-accent); text-decoration: underline; }
.mic-preview a:hover { color: var(--mic-glow); }

/* Código inline */
.mic-preview code {
  font-family: var(--mic-font-mono);
  font-size: 0.9em;
  background: var(--mic-bg-code);
  padding: 0.1em 0.35em;
  border-radius: var(--mic-radius-sm);
}

/* Bloque de código */
.mic-preview pre {
  font-family: var(--mic-font-mono);
  font-size: 0.875rem;
  background: var(--mic-bg-code);
  padding: var(--mic-radius-md) var(--mic-radius-lg);
  border-radius: var(--mic-radius-md);
  overflow-x: auto;
  margin-bottom: 0.85rem;
}
.mic-preview pre code { background: none; padding: 0; }

/* Blockquote base (HU-03 extiende con callouts tipados) */
.mic-preview blockquote {
  border-left: 3px solid var(--mic-accent);
  padding: var(--mic-radius-sm) var(--mic-radius-md);
  margin: 0 0 0.85rem 0;
  color: var(--mic-text-muted);
  background: color-mix(in srgb, var(--mic-accent) 6%, transparent);
  border-radius: 0 var(--mic-radius-sm) var(--mic-radius-sm) 0;
}

/* Tablas */
.mic-preview table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.85rem;
  font-size: 0.875rem;
}
.mic-preview th,
.mic-preview td {
  padding: var(--mic-radius-sm) var(--mic-radius-md);
  border: 1px solid color-mix(in srgb, var(--mic-text-muted) 30%, transparent);
  text-align: left;
}
.mic-preview th {
  background: var(--mic-bg-surface);
  font-weight: 600;
}

/* Separador */
.mic-preview hr {
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--mic-text-muted) 30%, transparent);
  margin: 1.5rem 0;
}
```

---

## Referencia visual del workspace

El resultado esperado al completar las HUs de shell (HU-28, HU-29, HU-01, HU-02,
HU-25) es esta composición:

```
┌─ Mycelium ─── [Buscar en la nota…  ⌘F] ─────────── [Compartir] [AG] ─┐
├──┬─ Explorador ───────────────┬─ Red de conocimiento ──┬─ Grafo ───────┤
│🗂│  📄 Red de conocimiento    │ # Red de conocimiento  │ Salientes (2) │
│🔍│  📄 Ideas sueltas          │                        │ Retro (2)     │
│📊│  📁 Proyectos              │ El micelio es la…      │               │
│🏷│    📄 Roadmap              │                        │  [grafo]      │
│  │  📁 Diario                 │ ## La metáfora…        │               │
│🗑│  📁 Compartido 👥          │                        │               │
│⚙│    📄 Guía de estilo 👥    │ > [!NOTE]              │               │
└──┴────────────────────────────┴────────────────────────┴───────────────┘
```

Puntos clave de la composición:
- Topbar y rail comparten `--mic-bg-sidebar` → **banda oscura continua** en el perímetro izquierdo y superior.
- **Modo por defecto: `live`** — vista única, el CodeMirror renderiza el markdown inline (WYSIWYG). El usuario no ve `#` ni `**` a menos que el cursor esté en esa línea.
- El modo `split` muestra editor (izq, `--mic-bg-surface`) + preview (der, `--mic-bg-canvas`) — dos niveles de claridad.
- Las carpetas compartidas muestran un ícono de personas (`Users` de Lucide) junto al nombre. Cada nota dentro de una carpeta compartida también muestra el ícono.
- El panel derecho inicia colapsado; al activar el ícono de grafo en el rail se expande con las tabs Grafo / Salientes / Retro. Debajo de los tabs: sección fija de metadatos (Creada, Modificada, Ruta, Tamaño).
- Los modos del editor viven en la barra de herramientas de HU-02 como iconos Lucide: `PenLine` (live) · `Columns2` (split) · `Eye` (read) · `Code` (raw).
- El rail tiene **dos grupos**: superior (🗂 Explorer · 🔍 Búsqueda vault · 📊 Grafo · 🏷 Tags) y fondo (🗑 Papelera · ⚙ Configuración). Daily Note (`📅`) NO está en el rail actual — ver `docs/BACKLOG.md`.
- La barra de búsqueda del topbar busca en la **nota activa** (in-note search, equivalente a Ctrl+F). La búsqueda del vault se activa desde el ícono 🔍 del rail.

## Modos del editor

| Modo | Atajo | Descripción | UX |
|------|-------|-------------|-----|
| `live` | Ctrl+1 | **Default.** Una sola vista. CodeMirror renderiza markdown inline. La línea con el cursor muestra el raw; el resto se ve renderizado. | WYSIWYG, estilo Obsidian live preview |
| `split` | Ctrl+2 | Dos paneles: CodeMirror raw (izq) + Preview renderizado (der). | Para verificar el output sin salir del editor |
| `read` | Ctrl+3 | Solo el preview renderizado. Sin cursor de edición. | Lectura, usa fuente serif en `--mic-bg-canvas` |
| `raw` | Ctrl+4 | Solo CodeMirror sin decoraciones. Markdown puro visible. | Edición avanzada, depuración de sintaxis |

En mobile (`<768px`) solo se muestran `live`, `read` — split y raw se ocultan.

---

## Relacionadas

- [[Arquitectura de Mycelium]] — dónde encaja el sistema de diseño.
- [[CodeMirror y la vista en vivo]] — las decoraciones del editor que consumen estos tokens.
- [[Terminal integrada - PTY y xterm]] — caso de un componente que **copia** los tokens y debe re-leerlos al cambiar de tema.
- [[Mapa de documentacion]] — índice general.
