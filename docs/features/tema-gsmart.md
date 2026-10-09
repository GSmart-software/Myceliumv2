# FUN-M-52 — Tema GSmart (solo modo dev)

**Solo desktop.** Pedido por el usuario el 2026-10-08, después de aprobar el tema Arrecife
([[tema-arrecife]]) en la app («ahora sí que me gusta»). Fila en [[BACKLOG]] (`FUN-M-52` ·
`TEMA-GSMART`).

Un **cuarto tema**, con la marca personal del usuario, **GSmart**. Fuente única de los
valores: la skill `gsmart-marca` (`~/.claude/skills/gsmart-marca/SKILL.md` y su `tokens.css`).
Lo de abajo es la parte que aplica a Mycelium.

> [!warning] Es secreto, como todo el modo dev
> Ni la ayuda, ni el changelog, ni el buscador de Configuración sin el modo nombran a GSmart.
> Va a `frontend/scripts/secreto-dev.mjs` ([[Lo del modo dev no se anuncia]]).

## Decisiones

Las mismas que el usuario tomó para Arrecife (2026-10-08), que valen para todo tema de marca:

1. **Colores + forma + presencia de marca.** No solo la paleta: el degradado de la marca
   donde Arrecife lleva el suyo, con el mismo nivel de presencia que el usuario aprobó en la
   segunda vuelta de Arrecife (`571decb`): nombre de la app y título de la nota en degradado,
   filete bajo la barra superior, rail con lavado vertical y botón activo resaltado, línea en
   la pestaña activa, barra de la nota abierta del árbol, íconos de nota y carpeta en los dos
   tonos, viñetas, etiquetas en pastilla, selección de texto, barras de desplazamiento y
   brillo ambiental sobre el lienzo.
2. **Apagar el modo dev no lo saca.** La muestra solo aparece con el modo.
3. **Las atmósferas no aplican**: selector atenuado y deshabilitado, como con Arrecife.

## Valores de GSmart

| Rol | Oscuro (el preferido) | Claro |
|---|---|---|
| Degradado de marca | `#2b4aa6` → `#12a8e8` (en la skill va a 90°) | igual |
| Acento (enlaces, bordes activos) | `#3b9be8` | `#1f6fc4` |
| Aguamarina (las líneas de la G) | `#a3ece2` | — (sobre claro no se lee: derivar) |
| Fondo | `#1e2023` | `#f3f5f8` |
| Fondo 2 | `#25282b` | `#e8ecf1` |
| Panel | `#2e3134` | `#ffffff` |
| Panel 2 | `#373a3e` | `#eef2f6` |
| Borde | `#44484d` | `#d3d9e0` |
| Texto · secundario · terciario | `#eceff2` · `#b3b9c0` · `#868c93` | `#1b1f24` · `#4a525b` · `#78808a` |
| Código | `#18191b` | `#eef2f6` |
| Texto sobre el degradado | `#f2fbff` | igual |
| Éxito · aviso · error | `#34c38f` · `#e0a63a` · `#e5534b` | igual |
| Sombra | `0 12px 34px rgba(0,0,0,.38)` | `0 10px 26px rgba(20,30,60,.09)` |

**Grises fríos, nunca verdosos ni cálidos.** El segundo color de la marca, donde Arrecife usa
el violeta (íconos de nota, H2, el «glow»), sale de la propia paleta: el **aguamarina**
`#a3ece2` o el **cian** `#12a8e8` en oscuro, y un derivado legible en claro. Que la elección
quede anotada con su contraste.

### Forma y letras

- Esquinas de 12 a 20 (`12` controles, `16` base, `20` grande); bordes finos de **1 px** (no
  1.5 como Arrecife).
- **Manrope** para la interfaz (en lugar de Geist).
- **Michroma** para títulos y etiquetas, **nunca en párrafos**: el nombre de la app, el título
  de la nota, los títulos de sección en mayúsculas (como «ARCHIVOS») con espaciado amplio
  (`letter-spacing: .3em` en la marca; ajustarlo si no entra). Los H1 y H2 de la nota pueden
  ir en Michroma: son títulos.
- **JetBrains Mono** para el código de la interfaz que hoy usa la mono del sistema.
- **El cuerpo de las notas no se toca**: su tipografía la elige el usuario en Configuración.
- Las tres familias tienen que funcionar **sin red** (la app es local). Cargarlas con
  `next/font/google` sin precarga —se empaquetan al compilar—, o con archivos en el repo; nunca
  un `<link>` a Google Fonts en ejecución (ver `DEF-153`, las fuentes de Excalidraw).

## Cómo encaja

- `data-theme="gsmart"`, con la misma estructura que Arrecife: colores en `styles/tokens.css`
  sobre los `--mic-raw-*` y semánticos existentes, forma en un `styles/gsmart.css` propio,
  reglas por componente con `:global(:root[data-theme='gsmart'])`. Si conviene, compartir con
  Arrecife lo que es igual en los dos (p. ej. qué temas son «de marca» y no admiten
  atmósferas) en `lib/temas.ts`, sin cambiar cómo se ve Arrecife.
- El catálogo de `lib/temas.ts` gana la muestra «GSmart», `soloDev`. Persistencia, PDF
  (`lib/printStyles.ts`) y buscador de Configuración, como Arrecife.
- El logo de Mycelium se queda: es un tema, no un cambio de producto.

## Criterios de aceptación

1. Con el modo dev, Apariencia muestra «GSmart» con la marca «dev».
2. Elegido, la app toma la paleta de GSmart en oscuro y en claro, con el degradado
   azul profundo → cian en los mismos lugares que Arrecife, Manrope en la UI y Michroma en
   títulos y etiquetas; el cuerpo de las notas conserva su tipografía.
3. Atmósferas atenuadas y deshabilitadas; apagar el modo no saca el tema; reiniciar lo
   conserva.
4. Sin red, las tres familias se ven igual.
5. Ni la ayuda ni el changelog lo nombran; `test-modo-dev.mjs` lo comprueba.
6. Contraste medido ≥ 4.5:1 para texto principal y secundario sobre sus fondos, en los dos
   modos.
7. Bioluminiscencia, Cantarela y Arrecife no cambian.

## Implementación (2026-10-09)

🛠️ **Implementada en desktop** (rama `feat/tema-gsmart-desktop`), **sin confirmar en la
app**. Lo visual lo decide el usuario mirándolo; acá está lo que se midió.

### Correspondencia de colores

Los ocho raw por modo ([[Los temas los define Mycelium, no el usuario]]), en
`styles/tokens.css`:

| Raw de Mycelium | Rol en Mycelium | Oscuro | Claro | De dónde sale |
|---|---|---|---|---|
| `--mic-raw-canvas` | Nota, fondo principal | `#1E2023` | `#F3F5F8` | fondo |
| `--mic-raw-mist` | Paneles laterales, pestañas, menús | `#25282B` | `#FFFFFF` | oscuro: fondo 2 · claro: panel |
| `--mic-raw-base` | Marco: rail, barra superior | `#2E3134` | `#E8ECF1` | oscuro: panel · claro: fondo 2 |
| `--mic-raw-base-deep` | Código (oscuro), velos y sombras | `#18191B` | `#141E3C` | código · claro: el color de la sombra de la marca (`rgba(20,30,60,.09)`) |
| `--mic-raw-ink` | Texto principal | `#ECEFF2` | `#1B1F24` | texto |
| `--mic-raw-ink-muted` | Texto secundario | `#B3B9C0` | `#4A525B` | secundario |
| `--mic-raw-accent` | Botones, enlaces, títulos | `#3B9BE8` | `#1F6FC4` | acento |
| `--mic-raw-glow` | Segundo tono: etiquetas, íconos de nota, H2 | `#A3ECE2` | `#166A5E` | aguamarina (claro: **derivado**) |

**Por qué mist y base se cruzan entre modos.** En oscuro el orden es el de un editor: la nota
en el fondo, los paneles un tono más claros (fondo 2) y el marco en el panel. En claro, con el
mismo orden, el acento quedaría como texto sobre el fondo 2 de los paneles a **4.29:1**; con
los paneles en blanco da 5.09. El marco claro solo pinta íconos con el acento (objeto gráfico,
≥3:1).

**El segundo tono: el aguamarina**, no el cian. El cian `#12a8e8` queda a un paso del acento
`#3b9be8` (los dos azules) y no se lee como «otro color»; el aguamarina de las líneas de la G sí
(12.2:1 sobre la nota oscura). Sobre claro no se lee (1.23:1): se usa oscurecido **conservando
su tono y saturación** (HSL 172°, 66%, L 25%) → `#166A5E`, 5.9 / 6.5 / 5.4 sobre fondo / panel /
fondo 2 y 4.8 sobre su propia pastilla. Mezclarlo con la tinta lo volvía gris.

Semánticos propios:

| Token | Valor | De dónde sale |
|---|---|---|
| `--mic-border` | `#44484D` / `#D3D9E0` | borde |
| `--mic-bg-hover` | `rgba(236,239,242,.06)` / `rgba(27,31,36,.06)` | la tinta al 6% (la marca no define hover) |
| `--mic-focus` (oscuro) | `#3B9BE8` | el acento («bordes activos»); en claro sigue la regla de Mycelium (el acento) |
| `--mic-marco-glow` · `--mic-marco-acento` | el acento · el aguamarina | íconos del marco y segundo color del logo |
| `--mic-marco-texto` (claro) | el secundario | el marco claro, como en Arrecife |
| `--mic-amber-icon` · `--mic-sync-warn` | `#E0A63A` | aviso |
| `--mic-callout-success-border` · `--mic-sync-ok` | `#34C38F` | éxito |
| `--mic-callout-error/danger-border` | `#E5534B` | error |
| info, question, caution, consola, recordatorios, sintaxis, Mermaid | los de Mycelium | la marca no los define |

**El degradado** va en crudo (`#2B4AA6` → `#12A8E8`, 90°) en todo lo que es superficie:
botones, barras, filetes, interruptores, el marco de la muestra. **Como texto** (nombre de la
app, título de la nota, H1 de lectura) en crudo no se lee —el azul profundo da 2.05:1 sobre el
fondo oscuro y el cian 2.47:1 sobre el claro—, así que se usa `--gsmart-degradado-texto`, con la
punta que no llega corregida y la otra tal cual:

- oscuro: `#7B91CA` (el azul profundo al 60% con `#f2fbff`) → `#12A8E8`;
- claro: `#2B4AA6` → `#16719A` (el cian al 60% con la tinta).

Los títulos de la nota alternan los dos tonos, con el cian en el H3: oscuro H1 `#3B9BE8`, H2
`#A3ECE2`, H3 `#12A8E8`; claro H1 `#1F6FC4`, H2 `#166A5E`, H3 `#16719A`; H4 y H5 mezclados con
la tinta.

### Contraste medido (WCAG 2.x, con los hex)

Cada celda: sobre fondo / paneles (mist) / marco (base).

| Texto | Oscuro | Claro |
|---|---|---|
| principal | 14.15 / 12.84 / 11.34 | 15.16 / 16.56 / 13.96 |
| secundario | 8.26 / 7.49 / 6.61 | 7.26 / 7.93 / 6.68 |
| acento | 5.47 / 4.97 / 4.39 | 4.66 / 5.09 / 4.29 |
| aguamarina (glow) | 12.17 / 11.05 / 9.75 | 5.90 / 6.45 / 5.43 |
| enlace | 5.47 / 4.97 / 4.39 | 6.56 / 7.16 / 6.04 (acento al 72% con la tinta) |
| etiqueta (`--mic-glow-texto`) | 12.17 / 11.05 / 9.75 | 10.30 / 11.25 / 9.48 |
| degradado de texto, punta azul | 5.24 / 4.76 / 4.20 | 7.30 / 7.98 / 6.72 |
| degradado de texto, punta cian | 6.06 / 5.50 / 4.85 | 4.98 / 5.44 / 4.58 |
| H3 (cian) | 6.06 / 5.50 / 4.85 | 4.98 / 5.44 / 4.58 |
| H4 · H5 | 12.70 · 8.51 (sobre fondo) | 7.24 · 7.68 (sobre fondo) |
| secundario sobre hover | 7.08 / 6.33 / 5.61 | 6.46 / 7.07 / 5.98 |
| secundario sobre la selección suave | 7.54 / 6.94 / 6.20 | 5.66 / 6.12 / 5.23 |

Texto principal y secundario ≥4.5:1 sobre los tres fondos en los dos modos, y sin la salvedad de
Arrecife: los grises de GSmart pasan también sobre los fondos compuestos (hover, selección). Lo
comprueba `scripts/test-temas.mjs` con los valores de `tokens.css` y de `gsmart.css`.

> [!warning] Lo que queda por debajo de 4.5:1, y por qué no se cambió
> - **El acento sobre el marco** (4.39 oscuro, 4.29 claro): ahí solo pinta íconos (≥3:1).
> - **El nombre de la app sobre el marco oscuro**: la punta azul del degradado de texto da
>   4.20. Es texto de 1rem; si se quiere 4.5, la punta va a `#859ACE` (4.68).
> - **El texto `#f2fbff` sobre el degradado** de los botones: 7.60 en el azul profundo, 4.33 en
>   el medio y **2.57 en el cian**. Es la regla de la marca (texto claro sobre el degradado),
>   como pasó con Arrecife (2.33). Ningún color único pasa en las dos puntas.
> - **El terciario** de la marca (`#868c93` / `#78808a`, 4.81 / 3.66 sobre el fondo) no se
>   usa: Mycelium tiene dos niveles de texto, no tres.

### Forma y letras (`styles/gsmart.css` + los módulos)

Misma estructura que Arrecife: todo bajo `:root[data-theme='gsmart']`; lo de cada componente en
su `.module.css` con `:global(:root[data-theme='gsmart'])` y el comentario «GSmart
(`FUN-M-52`)»; variables `--gsmart-*` (degradado, degradado vertical, degradado de texto,
selección suave, texto sobre el degradado, sombra del botón, halo, transición, radio de
control, letra de títulos, espaciado de etiquetas), que no son tokens públicos.

**Presencia de la marca, en los mismos lugares que Arrecife** (`571decb` y `f23c538`; un test
compara regla por regla): botones primarios con el degradado y texto `#f2fbff` (Configuración,
editor de CSS, diccionarios, actualización, bases, recordatorios, importar, reparar
referencias, Esporas, guardar dibujo, confirmar enlace, «Abrir» de los vaults, la acción de
inicio); interruptores, barras de progreso y el marco de la muestra elegida en el degradado;
selección suave en la pestaña activa, la nota abierta del árbol, la categoría de
Configuración y la opción marcada de la paleta; nombre de la app y título de la nota en el
degradado; filete de 2px bajo la barra superior; rail con lavado vertical (azul profundo →
cian) y botón activo resaltado en el acento con su barra en el degradado vertical; línea del
degradado en la pestaña activa; barra de la nota abierta del árbol en el degradado; íconos de
carpeta en el acento y de nota en aguamarina; viñetas en el cian; etiquetas en pastilla con el
degradado al 18%; selección de texto en el acento; barras de desplazamiento en el degradado; y
el brillo ambiental sobre el lienzo (azul profundo arriba a la izquierda, cian abajo a la
derecha).

- **Radios** 8/12/16 (de 4/8/16), como Arrecife; botones e inputs 12 explícito.
- **Bordes de 1px**: son los de Mycelium; no hizo falta tocar nada. Los inputs de texto llevan
  radio 12 y el foco en el acento con halo de 3px.
- **Manrope** en toda la interfaz: `--mic-font-sans` bajo el tema. La tipografía de las notas
  (`--mic-editor-font-family`, `--mic-preview-font-family`) es una preferencia aparte y no se
  toca.
- **Michroma**, sin negrita (tiene un solo peso): el nombre de la app, el título de la nota, los
  H1 y H2 (en vivo y en lectura), las cabeceras de sección del explorador («ARCHIVOS»), los
  títulos de grupo de Configuración, las secciones del menú de vaults y los títulos de los
  menús de tabla. Las etiquetas en mayúsculas llevan `letter-spacing: .3em` y bajan de 11 a
  10px para entrar en el mismo lugar.
- **JetBrains Mono**: ya era la mono de Mycelium (`--mic-font-mono`). El visor de archivos la
  pedía por nombre —«JetBrains Mono», que solo existe si está instalada— y bajo el tema usa la
  empaquetada.

**Las letras sin red.** Manrope y Michroma se cargan en `app/layout.tsx` con `next/font/google`,
`preload: false` y `display: "swap"`, como variables (`--font-manrope`, `--font-michroma`) que
solo lee `gsmart.css`. `next/font` las descarga **al compilar** y las sirve con la app:
verificado con `next build` —los `@font-face` apuntan a `/_next/static/media/*.woff2`, no hay
ningún `fonts.googleapis`/`fonts.gstatic` en `out/`, y el HTML sigue precargando solo las siete
fuentes de antes—. Sin el tema, el navegador no baja ninguna de las dos.

### Lo que no se llevó

- **Radio de 20** para lo grande: `--mic-radius-lg` es además el relleno de la hoja de lectura
  (`editor.css`); subirlo movería el texto de las notas. Los diálogos quedan en 16.
- **Panel 2** (`#373a3e` / `#eef2f6`) y el **terciario**: Mycelium no tiene esos roles.
- **La terminal**: xterm dibuja su propia letra («JetBrains Mono» por nombre) y su fondo es fijo
  en los cuatro temas; no se tocó.
- **El ícono destacado** de la marca (blanco en una caja con el degradado) y los **avisos con
  barra de color**: los callouts de Mycelium ya tienen su forma.
- Igual que en Arrecife: el ítem del autocompletado y la opción de un `<select>` siguen con el
  acento, y los comandos «Atmósfera: …» de la paleta siguen listados.
- El **logo de Mycelium** se queda (decisión de la spec).

### Lo compartido con Arrecife

`lib/temas.ts` gana `TEMAS_DE_MARCA` (`["arrecife", "gsmart"]`): `admiteAtmosfera` mira esa
lista en vez de comparar con un nombre, así que un tema de marca nuevo se suma en un solo lugar.
Arrecife se ve igual: sus reglas no cambiaron. Las reglas de forma **no** se unificaron en un
selector común: cada tema tiene las suyas, como pide la estructura de Arrecife, y el test de
paridad avisa si una aparece en uno y no en el otro.

### Secreto, persistencia, PDF

Como Arrecife: `secreto-dev.mjs` atrapa `\bgsmart\b` y `FUN-M-52` (`test-modo-dev.mjs` prueba que
deja pasar «gsmartphone» y «smart»); la muestra y el alias «gsmart» del buscador son `soloDev`;
`temaValido` acepta `gsmart` sin mirar el modo (`test-capa-datos.mjs`); `printStyles.ts` lleva
sus raw (el test los compara con `tokens.css`). La ayuda y la plantilla de snippets no lo
nombran.

### Archivos

- `frontend/styles/gsmart.css` (nuevo, importado en `app/layout.tsx`) y `styles/tokens.css`.
- `frontend/app/layout.tsx` — Manrope y Michroma.
- `frontend/lib/temas.ts` (muestra, `TEMAS_DE_MARCA`), `lib/printStyles.ts`.
- 23 `.module.css` — los gemelos de las reglas de Arrecife, las etiquetas en Michroma y el visor.
- `components/settings/VentanaAjustes.tsx` (alias), comentarios en `AppearanceSection.tsx`,
  `preferencesStore.ts`, `prefsVaultStore.ts`.
- `scripts/secreto-dev.mjs`; tests en `test-temas.mjs`, `test-modo-dev.mjs`,
  `test-capa-datos.mjs`.

## Relacionadas

- [[tema-arrecife]] — el primer tema de marca; este sigue su estructura.
- [[modo-dev]] · [[Lo del modo dev no se anuncia]].
- [[BACKLOG]] — `FUN-M-52`.
