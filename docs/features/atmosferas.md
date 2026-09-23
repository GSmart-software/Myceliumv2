# Atmósferas

`FUN-M-30` · **ambas versiones** · desktop 2.0.0 (2026-09-19) · reflejada a web el 2026-09-22

> [!info] Qué es
> Un **tercer eje del estilo**, al lado del **Tema** (qué colores: Bioluminiscencia o
> Cantarela) y el **Modo** (claro u oscuro). La atmósfera decide **cómo se reparten** esos
> colores en la pantalla: fondos, marco (barra superior, rail, barra de estado), títulos y
> bordes. Se elige **una por modo**.

## Por qué existe

Nació de una exploración de color dentro de [[Rediseñar la UI con impeccable]]. El prototipo
del cascarón había cambiado mucho la UX y poco la UI; el usuario pidió explorar colores de
elementos y fondos. Se hicieron tres variantes contra la actual y se compararon en los dos
temas y los dos modos. El usuario prefirió **Niebla en oscuro** y **Bosque en claro**, y
propuso que las cuatro quedaran elegibles como un estilo aparte.

Nombres decididos por el usuario el 2026-09-19: el eje es **Atmósfera**; lo que había
antes pasa a llamarse **Abisal** (así lo llamaba el código desde el prototipo legacy).

## Las cuatro atmósferas

| Atmósfera | Idea | Defecto |
|---|---|---|
| **Abisal** | Lo de siempre: marco casi negro, títulos en color alternado, brillo del tema en todo lo activo. | — |
| **Niebla** | Sobria, grises fríos con un matiz del tema. En oscuro la nota es lo más claro (como VS Code); en claro el marco también es claro (como Obsidian). | **oscuro** |
| **Bosque** | El color del tema en el marco, con cuerpo; la nota casi neutra. | **claro** |
| **Papel** | Editorial y cálida: papel y carbón tibio, títulos en la tinta. | — |

## Comportamiento

- Configuración → Apariencia: debajo de Tema y Modo, **«Atmósfera en modo oscuro»** y
  **«Atmósfera en modo claro»**, cuatro muestras cada uno. Las dos se eligen siempre; la del
  otro modo rige cuando se cambie de modo.
- Cada muestra es una **ventana en miniatura pintada con esa combinación** (tema actual ×
  ese modo × esa atmósfera), aunque la app esté en el otro modo.
- La paleta (<kbd>Ctrl</kbd>+<kbd>P</kbd>, «atmósfera») cambia la del **modo en uso**.
- Se guarda con las demás preferencias (`atmosferaOscuro`, `atmosferaClaro` en el JSON de
  preferencias): sobrevive a reiniciar. Quien ya tenía preferencias guardadas recibe los
  valores por defecto, porque las claves nuevas se completan con `DEFAULT_PREFS`.

## Cómo está hecho

- `styles/atmosferas.css`: cada atmósfera redefine los tokens **semánticos** con fórmulas
  sobre los raw del tema (`color-mix` con `--mic-raw-accent`, `--mic-raw-glow`…). Por eso una
  sola definición sirve para los dos temas y el matiz se conserva. Abisal no tiene reglas: es
  `tokens.css` tal cual.
- `data-atmosfera` en `<html>`, puesto por `applyToDom` (`stores/preferencesStore.ts`) según
  el modo. `app/layout.tsx` arranca con `niebla` para no destellar antes de hidratar.
- `lib/atmosferas.ts`: la lista, los defectos y la validación.
- `--mic-marco-texto` (nuevo en `tokens.css`): el texto neutro sobre el marco, que ahora
  puede ser claro u oscuro según la atmósfera.

> [!warning] Los selectores no llevan `html` a propósito
> Las muestras de Configuración repiten `data-theme`, `data-dark` y `data-atmosfera` en un
> `<span>` para pintarse solas. Como el semántico de `:root` se hereda **ya calculado** con el
> modo de la app, `.muestra` repone los de Abisal desde los raw (ver `Settings.module.css`).

## Verificación

Contraste medido en los **16 combos** (2 temas × 2 modos × 4 atmósferas): texto, títulos,
enlaces, árbol, pestañas, «Formato» y barra de estado, todos ≥4.5:1. La barra de estado era
el caso límite; se ajustó `--mic-marco-texto` en Bosque, Niebla claro y Papel claro.

## Relacionadas

[[Rediseñar la UI con impeccable]] · [[DESIGN]] · [[BACKLOG]]
