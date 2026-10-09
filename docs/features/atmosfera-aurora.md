# FUN-M-54 — Atmósfera Aurora

**Pública** · desktop implementada el 2026-10-09 (rama `feat/atmosfera-aurora-desktop`),
**sin confirmar en la app** · web pendiente ([[Reflejar cambios de desktop a web]]). Fila en
[[BACKLOG]] (`FUN-M-54` · `ATMOSFERA-AURORA`). Es la quinta de las [[atmosferas]].

> [!info] Qué es
> Una atmósfera nueva que lleva **el estilo de detalles gráficos del tema experimental del
> modo dev** —degradados, brillos, resplandores— pero **sin colores propios**: reparte los
> del tema puesto, `--mic-glow` y `--mic-accent`. Con Bioluminiscencia el degradado va del
> verde agua al cian; con Cantarela, del dorado al ámbar. La puede elegir cualquiera, sin el
> modo dev, para el modo oscuro y para el claro.

## Decisiones

1. **El modelo fue [[tema-bioexp]]**: cada regla de `styles/bioexp.css` y de sus módulos tuvo su
   gemelo en Aurora, con los colores fijos cambiados por los del tema.
   > [!info] Desde el 2026-10-09 el modelo ya no existe
   > El tema Bioluminiscencia experimental se **retiró** (`FUN-M-53`) y su estilo quedó solo
   > en Aurora. La paridad regla por regla de `scripts/test-temas.mjs` (con su lista
   > `AURORA_SIN_GEMELO`) se reemplazó por una **lista explícita** de lo que Aurora tiene que
   > cubrir, `AURORA_CUBRE`: los selectores de `styles/aurora.css` y, por módulo, los de cada
   > componente, sacados de las reglas de Aurora de ese día. Lo que se dejó afuera a propósito
   > (letra, radio y foco de los inputs) lo sigue vigilando el test de su hoja: sin
   > `font-family` ni `:focus`.
2. **Los fondos y el marco son los de Abisal** (`tokens.css` tal cual). Aurora no redefine
   ningún token `--mic-*` (lo prueba el test): pone la luz encima. Por eso Mermaid, la terminal
   y el PDF ven los colores de Abisal, y `smoke-mermaid-tema.mjs` no la recorre.
3. **No cambia la letra.** Una atmósfera reparte color, no tipografía: sin Space Grotesk, sin el
   espaciado de las cabeceras, sin la mono del visor.
4. **No cambia la forma de los controles**: sin el radio de 12px de botones e inputs. La única
   forma que cambia es la de las **etiquetas**, en pastilla (radio completo), porque el pedido
   la nombra y con 4px de radio el degradado se leía como un resaltado y no como una etiqueta.
5. **Sin halo en el foco de los inputs** (`DEF-155`): el foco es el borde, como en las demás.
6. **Nunca encima de un tema de marca**: con ellos `atmosferaEnUso` da `null` y `<html>` no lleva
   `data-atmosfera`, así que ninguna regla de Aurora los alcanza (test).
7. **Lo que cambia con el modo va en variables** (`--aurora-*`, por modo en `styles/aurora.css`),
   no en reglas `[data-dark]` de los módulos: ahí toda regla empieza con
   `:global(:root[data-atmosfera='aurora'])` y nada más (test).

## El degradado y las variables por modo

| Variable | Oscuro | Claro |
|---|---|---|
| `--aurora-desde` → `--aurora-hasta` | `--mic-glow` → `--mic-accent`, crudos | glow al 57% y acento al 70%, hundidos en `--mic-raw-base-deep` (conservan el matiz) |
| `--aurora-sobre-degradado` | `--mic-raw-base` (el marco, casi negro) | `#ffffff` |
| `--aurora-hover` | `brightness(1.1)` | `brightness(0.92)`: aclarar le bajaba el contraste al texto blanco |
| `--aurora-degradado-texto` | glow → acento | `--mic-glow-texto` → `--mic-enlace` (las variantes legibles de `tokens.css`) |
| `--aurora-degradado-marco` | `--mic-marco-glow` → `--mic-marco-acento` (= glow → acento) | los mismos tokens, que en claro son el glow aclarado: el marco de Abisal sigue oscuro |
| `--aurora-degradado-suave` | glow 8% → acento 6% | glow 8% → acento 5% |
| `--aurora-sombra-boton` | filete de glow al 35% y sombra de acento al 35% | filete y sombra en la 2ª parada, 35% / 25% |
| `--aurora-resplandor` | `drop-shadow` 10px de glow al 35% | sombra blanca de 1px |
| `--aurora-resplandor-marco` | igual, con `--mic-marco-glow` | `drop-shadow` 6px de `--mic-marco-glow` al 30% (sobre el marco oscuro no cabe la sombra blanca) |
| `--aurora-brillo` / `-icono` / `-logo` | halos de la barra activa, el ícono activo y el isotipo | halos tenues; el ícono, sin halo |
| `--aurora-borde-luz` | `inset` de glow al 70% | al 45% |
| `--aurora-ambiente` | glow 11% arriba a la izquierda, acento 10% abajo a la derecha | 6% y 6% |
| `--aurora-pastilla-desde/-hasta` | 18% / 14% | 14% / 10% |

**Por qué en claro el degradado se hunde.** Los crudos del modo claro no llevan ni texto claro
ni oscuro en las dos paradas: el cian de Bioluminiscencia claro (`#16B8C9`) da 2.4:1 con blanco
y el teal (`#0E7C8C`) 3.6:1 con la tinta. Mezclados con el `base-deep` del tema conservan el
matiz y llevan texto blanco: `#107E8D → #0C6674` (Bioluminiscencia) y `#966714 → #7E4F0E`
(Cantarela). En Bioluminiscencia claro el recorrido es corto porque el glow y el acento de ese
tema son dos tonos del mismo cian: es lo primero a mirar en la app.

## Qué lleva (la lista `AURORA_CUBRE` del test)

| Dónde | Qué |
|---|---|
| Botones primarios (Configuración, editor de CSS, diccionarios, actualización, bases, recordatorios, importar, reparar referencias, Esporas, guardar dibujo, confirmar enlace, «Abrir» de los vaults, la acción de inicio) | el degradado, su texto, sombra de luz, sube 1px al pasar (salvo «reducir movimiento») |
| Interruptores, barras de progreso, marco de la muestra elegida | el degradado |
| Pestaña activa | selección suave y una línea de 2px del degradado |
| Nota abierta del árbol | barra vertical del degradado, selección suave y borde de luz; los íconos de nota en `--mic-glow-texto` |
| Categoría de Configuración, opción de la paleta | selección suave |
| Barra superior | nombre en el degradado del marco con su resplandor; filete de 2px del mismo degradado; isotipo con doble halo |
| Rail | lavado vertical; botón activo con selección suave e ícono en `--mic-marco-acento`; barra activa encendida e ícono activo con halo (oscuro) |
| Lienzo de las notas | luz ambiente (`.paneBody::after`) |
| Notas (`styles/aurora.css`) | título de la nota y H1 de lectura en el degradado de texto, `width: fit-content`, con resplandor; halo de su color en los títulos lisos (oscuro); etiquetas en pastilla; selección de texto en el acento; barras de desplazamiento; viñetas en `--mic-glow-texto` |
| Muestra en Apariencia | el título en degradado, un filete bajo el marco y un brillo en el lienzo (Aurora no cambia tokens, así que su muestra no se diferenciaría de la de Abisal sin esto) |

**Lo que no lleva** (lo que el tema retirado tenía y Aurora no): el radio y el foco de los inputs, y la letra de
títulos de la nota, del menú de tablas, de las cabeceras del explorador, de los grupos de
Configuración, de las secciones del menú de vaults y del código del visor. Tampoco los colores
fijos de los títulos (`--mic-h1`…`--mic-h5`): quedan los de Abisal, que ya son del tema.

## Contraste medido (WCAG 2.x)

Calculado con las fórmulas de `styles/aurora.css` resueltas sobre los raw de `tokens.css`, y
comprobado por `scripts/test-temas.mjs` en las cuatro combinaciones. Cada parada se mide por
separado. Lo de las selecciones, pastillas y luz es el **peor** punto.

| Texto | Biolum. oscuro | Biolum. claro | Cantarela oscuro | Cantarela claro |
|---|---|---|---|---|
| texto del botón sobre 1ª · 2ª parada | 15.51 · 13.14 | 4.78 · 6.63 | 12.02 · 5.99 | 4.94 · 6.97 |
| título en degradado sobre la nota (1ª · 2ª) | 14.69 · 12.44 | 5.59 · 6.08 | 11.44 · 5.70 | 5.93 · 6.48 |
| título en degradado sobre los paneles | 13.74 · 11.64 | 5.15 · 5.60 | 10.65 · 5.30 | 5.61 · 6.12 |
| nombre de la app sobre el marco | 15.51 · 13.14 | 5.35 · 4.66 | 12.02 · 5.99 | 6.10 · 5.22 |
| secundario sobre la selección suave | 4.74 | 4.55 | 4.95 | 5.24 |
| etiqueta sobre su pastilla | 8.55 | 4.57 | 6.97 | 4.96 |
| secundario bajo la luz ambiente | 5.29 | 4.74 | 5.39 | 5.26 |
| enlace bajo la luz ambiente | 9.96 | 5.39 | 4.94 | 5.76 |

> [!warning] Lo que quedó cerca del límite
> - **Bioluminiscencia claro**: el secundario sobre la selección suave (4.55) y la etiqueta
>   sobre su pastilla en los paneles (4.57). Con la selección al 12/9% de Bioluminiscencia
>   experimental bajaba a 4.3, por eso va al 8/5%. Subirla rompe el test.
> - **Cantarela oscuro**: el acento crudo como texto bajo la luz ambiente (4.94). Ya era el
>   punto bajo de Cantarela oscuro (5.70 sin luz).

## Impresión

El PDF lleva el CSS de la ventana y su `data-atmosfera` (`DEF-116`). En `@media print`, Aurora
les quita el resplandor y el halo a los títulos; la luz ambiente es del lienzo de la app y no
llega al PDF. Además, «sin colores» (`lib/printStyles.ts`) fija `-webkit-text-fill-color` en la
tinta: el H1 de lectura en degradado pinta el texto con el fondo recortado y relleno
transparente, y el `color` solo no lo alcanzaba.

## Archivos

- `frontend/styles/aurora.css` (nuevo, importado en `app/layout.tsx` después de los temas).
- `frontend/lib/atmosferas.ts` — la quinta entrada.
- 21 `.module.css` — las reglas de cada componente (nacieron como gemelos de las del tema
  experimental, hoy retirado); en `Settings.module.css` además la muestra y la grilla de cinco
  columnas (máx. 700px).
- `components/settings/VentanaAjustes.tsx` — «aurora» y «degradado» en el buscador.
- `lib/printStyles.ts`, `public/plantilla-estilos.css`, `ayuda/06-configuracion/04-apariencia.md`.
- `scripts/test-temas.mjs` — catálogo, acotado, cobertura (`AURORA_CUBRE`), contraste.

## Qué mirar en la app

1. **Bioluminiscencia claro**: si el degradado de los botones se nota (glow y acento son dos
   cianes cercanos) o se ve plano.
2. **Oscuro**: si el resplandor de los títulos y del isotipo suma o empasta
   (`--aurora-resplandor`, `--aurora-brillo-logo`).
3. **La luz ambiente** del lienzo: si molesta al leer, se baja en `--aurora-ambiente`.
4. **Apariencia**: la fila de cinco muestras de atmósfera, que no desborde, y que la de Aurora
   se distinga.
5. **El nombre de la app** sobre el marco en claro, con el degradado del marco.

## Relacionadas

[[atmosferas]] · [[tema-bioexp]] · [[BACKLOG]] · [[Reflejar cambios de desktop a web]]
