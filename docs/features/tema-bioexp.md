# FUN-M-53 — Bioluminiscencia experimental (solo modo dev)

> [!warning] Retirado el 2026-10-09
> El usuario lo retiró; su estilo de detalles pasó a la atmósfera [[atmosfera-aurora]].
> Se quitó del código entero el mismo día que se implementó (rama
> `feat/quitar-bioexp-desktop`): `styles/bioexp.css`, la fuente Space Grotesk, su paleta en
> `tokens.css` y en el PDF, la muestra, el alias del buscador y las reglas de los módulos. Un
> vault que lo tenía guardado abre con el tema por defecto (`temaValido`, con test). Nunca se
> publicó; `secreto-dev.mjs` lo sigue atrapando para que un changelog no lo nombre. Lo que
> sigue es el registro de lo que fue. Fila en [[BACKLOG]] (§3.1, retiradas).

**Solo desktop.** Pedido por el usuario el 2026-10-09, después de los dos temas de marca,
[[tema-arrecife]] y [[tema-gsmart]]: «quiero ver cómo queda» Bioluminiscencia —el tema por
defecto de Mycelium— con el mismo estilo de detalles visuales que esos dos. Fila en
[[BACKLOG]] (`FUN-M-53` · `TEMA-BIOEXP`).

Un **quinto tema**, `data-theme="bioexp"`, que en Apariencia se ve como **«Biolum. exp.»**.
No es la marca de nadie: es una variante **experimental** de la propia de Mycelium. Toma la
paleta de Bioluminiscencia (verde agua `#3DFFC4` y cian `#19E6FF` sobre el azul-negro
`#071219`) y le pone la forma de los temas de marca: degradados, resplandores, barras
activas, títulos en degradado, pastillas, selección, barras de desplazamiento, rail con
lavado y brillo de fondo en el lienzo.

> [!warning] Es secreto, como todo el modo dev
> Ni la ayuda, ni el changelog, ni el buscador de Configuración sin el modo lo nombran. Va a
> `frontend/scripts/secreto-dev.mjs` ([[Lo del modo dev no se anuncia]]) con un cuidado que
> los otros dos no necesitaban: **«Bioluminiscencia» a secas es el tema público** y tiene que
> poder nombrarse.

## Decisiones

Las mismas que para Arrecife y GSmart (2026-10-08), que valen para todo tema con forma propia:

1. **Colores + forma + presencia de marca**, en los mismos lugares que los otros dos (un test
   lo compara regla por regla).
2. **Solo con el modo dev**; apagarlo no saca el tema (`temaValido` lo acepta siempre).
3. **Sin atmósferas**: está en `TEMAS_DE_MARCA`, así que `admiteAtmosfera` da `false` y el
   selector queda atenuado y deshabilitado sin tocar Apariencia. «De marca», en `lib/temas.ts`,
   quiere decir «trae su propia forma», no «es de otro»: el comentario de cabecera lo aclara.
4. **El modo oscuro es el protagonista**; el claro existe y se lee.
5. **Nombre corto en la muestra.** «Bioluminiscencia (exp.)» no entra: con cinco muestras en
   los 460px de la fila, el ancho mínimo de cada una lo fija su palabra más larga, y dos
   «Bioluminiscencia» la desbordaban (~510px estimados). «Biolum. exp.» la deja en ~455px.
   El buscador lo encuentra por «bioexp», «biolum. exp.» y «experimental», todo `soloDev`.

## Lo propio del tema: la luz

Arrecife y GSmart son marcas con degradado; la bioluminiscencia es **luz que sale del
abismo**. Lo que lo distingue de los otros dos es que en oscuro las cosas **irradian**:

- el título de la nota, el nombre de la app y el H1 de lectura, con un `drop-shadow` verde
  agua (con `filter` y no con `text-shadow`: con `background-clip: text`, la sombra de texto
  se pinta encima del degradado);
- los títulos lisos (H1–H3 en vivo, H2–H3 en lectura), con un halo de su propio color;
- el isotipo de la barra, con dos halos (el primer color y uno más ancho del segundo);
- la barra activa del rail y su ícono, y el borde izquierdo de la nota abierta del árbol;
- los botones primarios, con un filete de luz y sombra cian;
- ~~el foco de los inputs, con halo y resplandor~~: quitado por `DEF-155`, el foco es solo el borde en el cian.

En claro no hay abismo del que salir: los mismos lugares llevan sombras suaves o nada. Lo que
cambia con el modo va en **variables por modo** (`--bioexp-resplandor`, `--bioexp-brillo`,
`--bioexp-brillo-icono`, `--bioexp-brillo-logo`, `--bioexp-ambiente`,
`--bioexp-sombra-boton`, `--bioexp-gradiente-texto`, `--bioexp-gradiente-suave`) y no en reglas
`[data-dark]` de los módulos: ahí toda regla del tema empieza con
`:global(:root[data-theme='bioexp'])` y nada más (lo exige `test-temas.mjs`).

Sin animaciones: un resplandor que «respira» en la barra superior repintaría todo el tiempo.

## Implementación (2026-10-09)

🛠️ **Implementada en desktop** (rama `feat/tema-bioexp-desktop`), **sin confirmar en la
app**. Lo visual lo decide el usuario mirándolo; acá está lo que se midió.

### Correspondencia de colores

Los ocho raw por modo ([[Los temas los define Mycelium, no el usuario]]), en
`styles/tokens.css`:

| Raw de Mycelium | Rol | Oscuro | Claro | De dónde sale |
|---|---|---|---|---|
| `--mic-raw-canvas` | Nota, fondo principal | `#071219` | `#EEF6F6` | Bioluminiscencia oscuro · claro: un blanco con un velo de agua |
| `--mic-raw-mist` | Paneles laterales, pestañas | `#0A1A24` | `#FFFFFF` | Bioluminiscencia · claro: blanco, como GSmart |
| `--mic-raw-base` | Marco: rail, barra superior | `#04090E` | `#DCECEE` | Bioluminiscencia · claro: **marco claro** |
| `--mic-raw-base-deep` | Código (oscuro), velos y sombras | `#0B1D27` | `#062A33` | Bioluminiscencia · claro: el tinte del abismo |
| `--mic-raw-ink` | Texto | `#C6E7E1` | `#0F2529` | Bioluminiscencia · claro: un poco más hondo que el suyo |
| `--mic-raw-ink-muted` | Texto secundario | `#7FA9A7` | `#475F63` | **aclarado** (ver abajo) |
| `--mic-raw-accent` | Botones, enlaces, H1 | `#19E6FF` | `#00707F` | cian · claro: **derivado** |
| `--mic-raw-glow` | Segundo tono: H2, íconos de nota, viñetas | `#3DFFC4` | `#00704F` | verde agua · claro: **derivado** |

- **El secundario en oscuro** pasa de `#6E9A99` (el de Bioluminiscencia) a `#7FA9A7`. Sobre los
  fondos lisos el original pasa (6.1:1), pero este tema pone encima hover, selección suave y
  brillo de fondo, y ahí quedaba al borde (4.6:1). Con el nuevo, 5.5–6.0.
- **En claro el marco es claro**, no el teal oscuro de Bioluminiscencia claro: sobre un marco
  oscuro el filete, el lavado del rail y el halo de la barra activa no se verían. Lleva las
  mismas fórmulas de marco claro que Arrecife y GSmart (íconos en el acento, segundo color del
  logo en el glow, texto de la barra de estado en el secundario).
- **Los acentos en claro**: en crudo no se leen (cian 1.39:1, verde agua 1.17:1 sobre el
  fondo). Se oscurecen **conservando el tono** —187° el cian, 162° el verde agua— en vez de
  mezclarlos con la tinta, que los volvía grises: `#00707F` y `#00704F`.

Semánticos propios: borde `#16343F` y hover `rgba(25,230,255,.10)` en oscuro (los de
Bioluminiscencia); `#C7DEE1` y `rgba(15,37,41,.06)` en claro. Foco en oscuro: el cian. El
marco oscuro usa explícitamente los valores de `:root` (íconos en verde agua, segundo color del
logo en cian). Callouts, estados de sync, consola, recordatorios, sintaxis y Mermaid: los de
Mycelium, que son los de Bioluminiscencia.

### El degradado

| Variable | Valor | Uso |
|---|---|---|
| `--bioexp-gradiente` | `120deg, #3DFFC4 → #19E6FF → #3D8BFF` | superficies: botones, interruptores, barras de progreso, filete de la barra, línea de la pestaña activa, marco de la muestra |
| `--bioexp-gradiente-vertical` | lo mismo a 180° | barra activa del rail y de la nota abierta, barras de desplazamiento al pasar |
| `--bioexp-gradiente-suave` | los tres al 8–12% (oscuro) / sus derivados al 7–10% (claro) | selección: pestaña activa, nota abierta, rail, categoría de Configuración, opción de la paleta |
| `--bioexp-gradiente-texto` | oscuro `#3DFFC4 → #19E6FF → #6FA8FF` · claro `#00704F → #00707F → #2257C9` | texto: nombre de la app, título de la nota, H1 de lectura |
| `--bioexp-sobre-degradado` | `#03141A` | texto sobre el degradado |

**El tercer tono** es `#3D8BFF`, el azul de los callouts «info» de Mycelium (ya es de la casa).
Sin él, verde agua y cian están a dos pasos de tono y el degradado casi no se ve; con él tiene
recorrido —verde agua, cian, azul: luz que baja hacia el fondo— y sigue siendo de la paleta.

**Texto oscuro sobre el degradado**, al revés que Arrecife y GSmart (texto claro): las tres
paradas son claras, así que el oscuro pasa en todas (14.6 / 12.3 / 5.7:1). Es el primer tema
con forma cuyo botón primario se lee entero.

### Contraste medido (WCAG 2.x, con los hex)

Cada celda: sobre fondo / paneles / marco.

| Texto | Oscuro | Claro |
|---|---|---|
| principal | 14.35 / 13.42 / 15.15 | 14.54 / 15.95 / 13.12 |
| secundario | 7.33 / 6.86 / 7.74 | 6.21 / 6.81 / 5.60 |
| acento (H1) | 12.44 / 11.64 / 13.14 | 5.28 / 5.79 / 4.77 |
| glow (H2) | 14.69 / 13.74 / 15.51 | 5.58 / 6.12 / 5.04 |
| enlace | 12.44 / 11.64 / 13.14 | 7.10 / 7.79 / 6.40 (acento al 72% con la tinta) |
| etiqueta (`--mic-glow-texto`) | 14.69 / 13.74 / 15.51 | 9.71 / 10.65 / 8.76 |
| degradado de texto: 1ª · 2ª · 3ª parada | 14.69 · 12.44 · 7.86 (sobre fondo) | 5.58 · 5.28 · 5.85 (sobre fondo) |
| H3 (azul) | 7.86 / 7.35 / 8.30 | 5.85 / 6.41 / 5.28 |
| H4 · H5 | 14.31 · 12.78 (sobre fondo) | 6.83 · 8.07 (sobre fondo) |
| secundario sobre hover (fondo / paneles) | 6.05 / 5.54 | 5.53 / 6.07 |
| secundario sobre la selección suave | 5.62 | 5.40 |
| etiqueta sobre su pastilla | 9.32 | 9.26 |
| `#03141A` sobre el degradado (3 paradas) | 14.57 / 12.34 / 5.66 | igual |

Todo texto ≥4.5:1 en los dos modos, también sobre los fondos compuestos (medidos a mano con
las mismas fórmulas). Lo de los fondos lisos, el degradado y los títulos lo comprueba
`scripts/test-temas.mjs` con los valores de `tokens.css` y `bioexp.css`.

> [!warning] Lo que queda por debajo, y por qué no se cambió
> - **El borde del botón primario en claro**: un degradado tan claro sobre un fondo claro
>   apenas se separa (el verde agua da 1.17:1 contra el fondo). Lo marca un filete de 1px y una
>   sombra en el cian legible (`--bioexp-sombra-boton`). Si se ve lavado, es lo primero a mirar.
> - **El brillo de fondo** (`.paneBody::after`) va **encima** del texto (como en Arrecife y
>   GSmart): tiñe texto y fondo a la vez en el centro de cada foco. En oscuro no importa (el
>   secundario queda en 6.0–6.2). En claro sí: al 12% el cian legible bajaba a 4.1:1, así que
>   el brillo claro va al **6%** (cian 4.6, verde agua 4.9, secundario 5.4 en el peor punto, y
>   más lejos del foco, lo de la tabla). Si se lo quiere más visible en claro, hay que sacarlo
>   de encima del texto, no subirle la opacidad.

### Forma y letras (`styles/bioexp.css` + los módulos)

Misma estructura que los otros dos: todo bajo `:root[data-theme='bioexp']`; lo de cada
componente en su `.module.css` con `:global(:root[data-theme='bioexp'])` y el comentario
«Bioluminiscencia experimental (`FUN-M-53`)»; variables `--bioexp-*`, que no son tokens
públicos.

**Por componente** (el gemelo de cada regla de Arrecife y de GSmart, más lo propio):

| Dónde | Qué |
|---|---|
| Botones primarios (Configuración, editor de CSS, diccionarios, actualización, bases, recordatorios, importar, reparar referencias, Esporas, guardar dibujo, confirmar enlace, «Abrir» de los vaults, la acción de inicio) | el degradado, texto oscuro, radio 12, sombra de luz, sube 1px al pasar |
| Interruptores, barras de progreso (actualización, apertura del vault), marco de la muestra elegida | el degradado |
| Barra superior (`AppTopbar`) | nombre en Space Grotesk con el degradado de texto y su resplandor; filete de 2px del degradado; **isotipo con doble halo** (los tres puntos ya siguen al tema por `DEF-154`) |
| Rail | lavado vertical verde agua → cian → azul; botón activo con la selección suave y el ícono en el cian; **barra activa encendida** y **ícono activo con halo** (oscuro) |
| Pestañas (`panes`) | la activa con la selección suave y una línea de 2px del degradado; **brillo de fondo del lienzo** en tres focos (verde agua arriba a la izquierda, velo cian a la derecha, azul abajo) |
| Explorador | nota abierta con la barra vertical del degradado, la selección suave y **un borde de luz** a la izquierda; íconos de nota en el verde agua; cabeceras de sección en Space Grotesk espaciada |
| Configuración, paleta, menú de vaults | categoría y opción marcadas con la selección suave; títulos de grupo y de sección en Space Grotesk espaciada |
| Visor de archivos | el código en la mono empaquetada (como en GSmart) |
| Notas (`bioexp.css`) | título del documento y H1 de lectura en el degradado, ajustados al texto (`width: fit-content`), con resplandor; H1–H5 en cian, verde agua, azul y mezclas; halo en los títulos lisos (oscuro); etiquetas en pastilla con el degradado al 14–18% y filete; selección de texto en cian; barras de desplazamiento en el degradado; viñetas en el verde agua |
| Inputs de texto | radio 12; foco con el borde en el cian (sin halo: `DEF-155`) |

- **Radios** 8/12/16 (de 4/8/16), como Arrecife y GSmart; botones e inputs 12 explícito.
- **Space Grotesk** solo en títulos y etiquetas: el nombre de la app, el título de la nota, los
  H1 y H2 (vivo y lectura), las cabeceras del explorador, los títulos de grupo de
  Configuración, las secciones del menú de vaults y los títulos de los menús de tabla. Las
  etiquetas en mayúsculas van con `letter-spacing: .18em` y **conservan tamaño y peso**: Space
  Grotesk no es ancha como la letra de títulos de GSmart. Tiene pesos de 300 a 700, así que los
  títulos conservan su negrita.
- **Por qué una letra de títulos.** Un tema experimental tiene que notarse también en la
  tipografía, y los títulos son el único lugar donde se puede sin tocar la lectura. Space
  Grotesk es una grotesca geométrica con rasgos propios (la «a», la «G», la «t») que le da un
  aire técnico, de instrumento, y se lee bien en negrita a 30px. La interfaz sigue en Geist
  (`--mic-font-sans` no se toca) y el cuerpo de las notas, en la fuente que elige el usuario.
- **Sin red**: Space Grotesk se carga en `app/layout.tsx` con `next/font/google`,
  `preload: false` y `display: "swap"`, como `--font-space-grotesk`, que solo lee
  `bioexp.css`. `next/font` la descarga al compilar (lo verificó `next build` con las de
  GSmart; acá se verificó `tsc`, no un `next build`).

### Secreto, persistencia, PDF

- `secreto-dev.mjs` atrapa `\bbioexp\b`, `bioluminiscencia\s*\(?\s*exp` («Bioluminiscencia
  (exp.)», «Bioluminiscencia experimental»), `\bbiolum\.?\s*exp` («Biolum. exp.») y `FUN-M-53`.
  `test-modo-dev.mjs` comprueba que **no** atrapa «Bioluminiscencia», «el tema
  Bioluminiscencia» ni «tema experimental».
- La muestra y la entrada del buscador son `soloDev`; la entrada pública del tema no lleva
  ningún alias de la variante (también lo prueba el test).
- `temaValido` acepta `bioexp` sin mirar el modo (`test-capa-datos.mjs`).
- `printStyles.ts` lleva sus raw (el test los compara con `tokens.css`).
- La ayuda y la plantilla de snippets no lo nombran.

### Archivos

- `frontend/styles/bioexp.css` (nuevo, importado en `app/layout.tsx`) y `styles/tokens.css`.
- `frontend/app/layout.tsx` — Space Grotesk.
- `frontend/lib/temas.ts` (muestra, `TEMAS_DE_MARCA`, cabecera), `lib/printStyles.ts`.
- 23 `.module.css` — los gemelos de las reglas de Arrecife y GSmart, más el isotipo y el ícono
  del rail.
- `components/settings/VentanaAjustes.tsx` (alias), comentarios en `AppearanceSection.tsx`,
  `preferencesStore.ts`, `prefsVaultStore.ts`.
- `scripts/secreto-dev.mjs`; tests en `test-temas.mjs` (paridad con Arrecife **y** GSmart,
  contraste, degradado, letra), `test-modo-dev.mjs`, `test-capa-datos.mjs`.

### Qué mirar en la app

1. **Oscuro**: si el resplandor de los títulos y del isotipo suma o empasta (son
   `--bioexp-resplandor` y `--bioexp-brillo-logo`, una línea cada uno).
2. **Claro**: si los botones primarios —degradado claro sobre fondo claro— se distinguen.
3. **El brillo de fondo** del lienzo: tres focos en vez de dos; si molesta al leer, se baja en
   `--bioexp-ambiente`.
4. **La muestra «Biolum. exp.»** en Apariencia con el modo dev: que la fila de cinco no
   desborde (el ancho se estimó, no se midió).
5. **Space Grotesk** en el título de la nota y en las cabeceras en mayúsculas.

## Relacionadas

- [[tema-arrecife]] · [[tema-gsmart]] — los temas cuya forma sigue este.
- [[atmosfera-aurora]] — la misma forma, pública y con los colores del tema puesto (`FUN-M-54`).
- [[modo-dev]] · [[Lo del modo dev no se anuncia]].
- [[BACKLOG]] — `FUN-M-53`.
