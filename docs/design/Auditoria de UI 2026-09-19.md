# Auditoría de UI 2026-09-19

Línea base técnica de la interfaz **antes** de cualquier cambio de diseño: el paso 4 de
[[Rediseñar la UI con impeccable]]. Sirve para comparar con números después de cada
arreglo (volver a correr `/impeccable audit frontend`).

- **Rama**: `experimento/ui-impeccable`, idéntica a `desktop-tauri` en la UI.
- **Cómo se midió**: `/impeccable audit` con la app real enganchada por CDP
  ([[Ver la UI con Playwright]]), la nota [[Mapa de documentacion]] abierta en vivo, las
  cuatro combinaciones tema × modo, la ventana en su mínimo (640×480), el árbol
  accesible, más lectura del código y el detector mecánico de impeccable.
- El contraste se calculó sobre **colores computados**, componiendo las transparencias
  hasta el fondo opaco. Nada se estimó leyendo CSS.

## Puntaje: 14/20 (Bueno)

| Dimensión | Puntaje | Hallazgo principal |
|---|---|---|
| Accesibilidad | 2 | En claro, Brote no alcanza el mínimo: `#tag` a 1.95:1, anillo de foco a 2.2:1 |
| Rendimiento | 3 | Excalidraw y Mermaid diferidos; xterm entra en el paquete inicial |
| Responsive | 3 | Funciona a 640px; recortes menores en la búsqueda y el título |
| Theming | 3 | Tokens casi perfectos; los temas claros están mal calibrados en el glow |
| Integridad | 3 | Sistema coherente y propio; tres degradés no documentados |

> [!important] El patrón de fondo
> Casi todos los problemas graves tienen **una sola causa**: Brote (`--mic-glow`) se
> diseñó para brillar sobre oscuro, y en los temas **claros** se sigue usando igual
> como texto, anillo de foco y gráfico. Los temas oscuros pasan todas las mediciones de
> texto salvo el enlace roto.

## Mediciones clave

Contraste medido (mínimos WCAG: 4.5:1 texto, 3:1 gráficos y foco).

| Elemento | Bio oscuro | Bio claro | Cant. oscuro | Cant. claro |
|---|---|---|---|---|
| `#tag` (texto Brote sobre Brote 15%) | 10.27 | **1.95** | 8.24 | **2.03** |
| Anillo de foco sobre lienzo | 14.69 | **2.21** | 11.44 | **2.29** |
| Título de callout | ok | **2.03** | ok | **2.12** |
| Enlace roto `[[…]]` | **2.24** | **1.01**¹ | **1.38** | **1.03**¹ |
| Logo, fin del degradé (Hifa) sobre el marco | 13.14 | **2.01** | 5.99 | **2.14** |
| Ícono inactivo del rail (Brote 55%) | 5.07 | **2.30** | 4.28 | **2.41** |
| Texto de "Compartir" | ok | **4.10** | ok | **4.45** |
| Borde de "Compartir" (Brote 40%) | 3.14 | **1.85** | **2.80** | **1.92** |
| Enlace (Hifa) sobre lienzo | 12.44 | 4.50 | 5.70 | 4.76 |

¹ Dentro de un fragmento de código, cuyo fondo es Esporo profundo también en claro.

## Hallazgos

**P1**
- `#tag` ilegible en claro (`styles/editor.css:590`).
- Enlace roto casi invisible en todos los temas: `color-mix(accent 40%, #000)` en
  `styles/editor.css:579`, el único color del editor que no sale de un token.
- Anillo de foco invisible en claro (`app/globals.css`, `:focus-visible`), incumple
  WCAG 1.4.11.
- Título de callout ilegible en claro.

**P2**
- En claro, el marco (logo, íconos del rail, "Compartir") usa los tonos calibrados para
  fondo claro sobre Esporo, justo lo que prohíbe *The Dark Frame Rule* de [[DESIGN]].
- La búsqueda de la barra superior anula el foco sin reemplazo
  (`AppTopbar.module.css:71`).
- ~~Los chevrons de plegado no son botones: no se alcanzan con teclado.~~ **Falso
  positivo**, verificado en `harden`: el margen es `aria-hidden` y plegar funciona con
  Ctrl+Shift+[ / ]. El árbol de Playwright los listaba igual. Lo que sí había era
  `DEF-088`: la flecha de una sección plegada no se veía.
- `prefers-reduced-motion` solo en `AperturaVault`; el grafo y los paneles animan
  sin alternativa.
- No hay landmark `main`, y el contenido del editor no tiene nombre accesible.
- A 640px el explorador sigue en 240px.

**P3**
- La búsqueda compacta muestra una "B" recortada.
- El título del documento corta la palabra al medio (falta `hyphens: auto`).
- xterm en el paquete inicial vía `lib/terminal.ts`.
- `transition: width` en tres barras de progreso y `transition: all` en
  `panes.module.css:363`.
- `#eafff8` fijo en `MiniGraph.tsx:159`.

## Detector mecánico

Dio 14 avisos:
- **8 son falsos positivos.** Callouts, citas y grupos de filtro con borde lateral son
  convenciones de Markdown o de estructura; el chevron está dibujado con bordes.
- **4 son texto con degradé.** El logo es intencional; el título del documento y el
  énfasis triple (`***texto***`) no están registrados en [[DESIGN]].
- **3 son `transition: width`.**

## Lo que funciona bien

- La arquitectura de tokens: cero hex en componentes y el porqué documentado en
  `tokens.css`.
- Los temas oscuros.
- Los controles nativos (`color-scheme`, la lista del `<select>`).
- Los 81 botones del workspace tienen nombre accesible.
- La carga diferida de Excalidraw y Mermaid.
- El grafo solo anima cuando hace falta.

## Plan que salió de acá

`colorize` (temas claros y enlace roto) → `harden` (foco, chevrons, semántica) →
`animate` (movimiento reducido) → `adapt` (640px) → `optimize` → `document` → `polish`.

## Relacionadas

- [[Rediseñar la UI con impeccable]] — el proceso del que esta es la línea base.
- [[DESIGN]] · [[PRODUCT]] — lo que impeccable lee.
- [[DESIGN_SYSTEM]] — el sistema de diseño, con las reglas de modo oscuro.
