# FUN-M-51 — Tema Arrecife (solo modo dev)

**Solo desktop.** Pedido por el usuario el 2026-10-08. Fila en [[BACKLOG]] (`FUN-M-51` ·
`TEMA-ARRECIFE`). Primera funcionalidad que vive **detrás del modo desarrollador**
([[modo-dev]]) sin ser una herramienta de desarrollo: es una prueba de que el modo sirve para
esconder cosas que no son para todos.

Un **tercer tema**, al lado de Bioluminiscencia y Cantarela, con el branding de **Arrecife**,
otro proyecto del usuario (un gestor de credenciales). No tiene que ver con Mycelium: es para
que el usuario vea su otra marca aplicada. Fuente de los valores:
`C:\Trabajo\GSmart\Arrecife\Proyecto Arrecife\spec\design\arrecife-ui-spec.md` (§1–§6,
§11) y su `arrecife-mockup.html`. Lo que sigue es la parte que aplica a Mycelium, copiada y
ajustada.

> [!warning] Es secreto, como todo el modo dev
> Ni la ayuda, ni el changelog, ni el buscador de Configuración sin el modo nombran a
> Arrecife. Va a `frontend/scripts/secreto-dev.mjs` ([[Lo del modo dev no se anuncia]]).

## Decisiones del usuario (2026-10-08)

1. **Colores + forma.** No solo la paleta: también el gradiente de marca, los radios, los
   bordes de 1.5px y Geist en la interfaz. Que se parezca de verdad a Arrecife.
2. **Apagar el modo dev no lo saca.** Si el vault tiene Arrecife, sigue pintándose así. Sin
   el modo, la muestra de Arrecife no aparece en Configuración: al elegir otro tema ya no se
   puede volver sin `>dev`.
3. **Las atmósferas no aplican.** Con Arrecife activo, el selector de atmósfera **sigue
   visible pero deshabilitado** (atenuado, no seleccionable), para que se vea que no aplica;
   con un aviso corto de por qué. La atmósfera guardada no se pierde: vuelve al cambiar de
   tema.

## Valores de Arrecife

### Constantes (los dos modos)

| Token Arrecife | Valor | Uso |
|---|---|---|
| `cyan` | `#3AB8D8` | Acento primario |
| `purple` | `#7444E4` | Acento secundario |
| `gradient.brand` | `linear-gradient(135deg, #3AB8D8 0%, #7444E4 100%)` | Botones primarios, indicadores de selección, barras de progreso, el título del documento si se pinta con gradiente. **Siempre 135°** |
| `gradient.subtle` | `linear-gradient(125deg, rgba(58,184,216,0.10), rgba(116,68,228,0.10))` | Ítem de navegación activo, selección suave (pestaña activa, ítem activo del árbol) |
| `warning` | `#FFB300` | Avisos (fondos 14–16%, bordes 38–40%) |
| `ok` | `#3ECF8E` | Éxito |
| `danger` | `#E5484D` | Destructivo |
| foco | borde `cyan` + halo `0 0 0 3px rgba(58,184,216,0.25)` | Foco visible |

### Oscuro (el predeterminado de Arrecife)

| Token | Valor | Rol |
|---|---|---|
| `bg` | `#14171E` | Fondo principal (el de la nota) |
| `patch` | `#191D26` | Barra lateral, barras superiores, fondo de inputs |
| `surface` | `#1D222C` | Cards, filas, chips |
| `surface2` | `#252A34` | Pistas de switch, fondos secundarios |
| `border` | `#2B313D` | Todos los bordes, **1.5px** |
| `text` | `#8A9095` | Texto secundario |
| `textStrong` | `#F7F9FC` | Texto principal y títulos |
| `hover` | `rgba(247,249,252,0.07)` | Hover |
| `shadow` | `0 8px 28px rgba(0,0,0,0.45)` | Elevación |

### Claro

| Token | Valor |
|---|---|
| `bg` | `#EEF1F6` (nunca blanco puro de fondo) |
| `patch` | `#F6F8FB` |
| `surface` | `#FFFFFF` |
| `surface2` | `#E7EBF2` |
| `border` | `#D9DFE9` |
| `text` | `#5C6672` |
| `textStrong` | `#1A212C` |
| `hover` | `rgba(26,33,44,0.06)` |
| `shadow` | `0 8px 24px rgba(26,33,44,0.10)` |

Los acentos, gradientes y semánticos **no cambian** entre modos.

### Forma

- **Radio base 16px.** Botones e inputs 12px; filas 14px; chips y etiquetas píldora (999px);
  botones de ícono 12px; casillas 7px.
- **Borde siempre 1.5px.**
- **Tipografía de la interfaz: Geist** (400/500/600/700). Mycelium ya trae Geist: no se
  descarga nada. **El texto de las notas no se toca**: la tipografía del editor la elige el
  usuario en Configuración y Arrecife no la pisa (Arrecife no tiene editor de documentos;
  §3 de su spec es para su propia UI).
- Transiciones 150–250ms; hover del botón primario `brightness(1.1)` + `translateY(-1px)`;
  respetar `prefers-reduced-motion`.

## Cómo encaja en Mycelium

- **Tema = `data-theme="arrecife"`**, como los otros dos (`styles/tokens.css`), con su bloque
  claro y su bloque `[data-dark='true']`. Los roles de Arrecife se **mapean a los tokens
  semánticos `--mic-*` que ya existen** (fondos, texto, bordes, acento, glow, hover,
  selección, foco, callouts, enlaces, tags…): no se inventan variables públicas nuevas si una
  existente cumple el rol. La correspondencia elegida se documenta en una tabla en esta nota.
  Donde Mycelium necesite un color que Arrecife no define (p. ej. colores de callouts, el
  glow, el grafo), se deriva de `cyan`/`purple`/semánticos y se dice cuál.
- **La forma** se aplica con reglas acotadas a `[data-theme='arrecife']` (radios, grosor de
  borde, gradiente en el botón primario y en los indicadores de selección, Geist en la UI),
  sin tocar el aspecto de los otros dos temas. Lo que no se pueda llevar sin romper un layout
  se deja y se anota.
- **Atmósferas**: sus reglas en `styles/atmosferas.css` no deben pisar a Arrecife (p. ej.
  aplicar la atmósfera solo si el tema no es Arrecife, o no emitir `data-atmosfera` con
  Arrecife). En Configuración el selector queda deshabilitado y atenuado con Arrecife.
- **Persistencia**: el tema es del vault (`prefsVaultStore`, `prefs_vault.rs`); hay que
  aceptar `"arrecife"` como valor válido al leer (hoy solo acepta los dos temas y cae al
  predeterminado). El tipo `Tema` crece.
- **Visibilidad**: la muestra de Arrecife en Configuración → Apariencia solo existe con el
  modo dev (`useUpdaterStore`, `estado.dev`), y lleva la marca «dev» de la paleta. Su alias
  en el buscador de Configuración, `soloDev`. Con el tema activo y el modo apagado, la
  muestra **no** aparece (decisión 2) y ningún tema figura seleccionado… salvo que se decida
  mostrarla solo en ese caso: **no**, la decisión del usuario es que no aparezca.
- **Exportar a PDF** (`lib/printStyles.ts`) lleva los tokens de cada tema: sumar Arrecife.
- **Plantilla de snippets** (`public/plantilla-estilos.css`): no se publicita Arrecife (es
  secreto). Si la plantilla enumera los temas, no se agrega.

## Criterios de aceptación

1. Con el modo dev, Configuración → Apariencia muestra tres temas; el tercero, «Arrecife»,
   con la marca «dev» y su muestra (fondo `#14171E`, acentos cian y violeta).
2. Elegido Arrecife, toda la app toma su paleta en oscuro y en claro, con el gradiente en el
   botón primario y la selección, radios y bordes de la spec, y Geist en la UI. Las notas
   conservan su tipografía.
3. El selector de atmósfera queda atenuado y no responde, con un texto que dice por qué; al
   volver a otro tema, la atmósfera que estaba vuelve.
4. Se apaga el modo dev: la app sigue en Arrecife; la muestra desaparece.
5. Reiniciar la app con el vault en Arrecife: arranca en Arrecife (no cae al predeterminado).
6. Ni la ayuda, ni el buscador de Configuración sin el modo, ni el changelog mencionan
   Arrecife; `secreto-dev.mjs` lo cubre y `test-modo-dev.mjs` pasa.
7. Contraste: texto principal y secundario sobre sus fondos ≥ 4.5:1 en los dos modos
   (medido, no estimado).

## Implementación (2026-10-08)

🛠️ **Implementada en desktop** (rama `feat/tema-arrecife-desktop`), **sin confirmar en la
app**. Lo visual —que se parezca a Arrecife— lo decide el usuario mirándolo.

### Correspondencia de colores

Un tema de Mycelium son ocho raw por modo ([[Los temas los define Mycelium, no el usuario]]);
todo lo demás se calcula de ellos. Así quedaron (`styles/tokens.css`):

| Raw de Mycelium | Rol en Mycelium | Oscuro | Claro | De dónde sale |
|---|---|---|---|---|
| `--mic-raw-canvas` | Nota, fondo principal | `#14171E` | `#EEF1F6` | `bg` |
| `--mic-raw-mist` | Paneles, pestañas, menús | `#1D222C` | `#FFFFFF` | `surface` |
| `--mic-raw-base` | Marco: rail, barras | `#191D26` | `#F6F8FB` | `patch` |
| `--mic-raw-base-deep` | Código (oscuro), velos y sombras | `#0F1218` | `#1A212C` | **derivado** (ver abajo) |
| `--mic-raw-ink` | Texto principal | `#F7F9FC` | `#1A212C` | `textStrong` |
| `--mic-raw-ink-muted` | Texto secundario | `#8A9095` | `#5C6672` | `text` |
| `--mic-raw-accent` | Botones, enlaces, títulos | `#3AB8D8` | `#2A6D82` | `cyan` (claro: **derivado**) |
| `--mic-raw-glow` | Etiquetas, cursor, nodos | `#9B7AEB` | `#7444E4` | `purple` (oscuro: **derivado**) |

Y los semánticos que Arrecife fija por su cuenta:

| Token | Valor | De dónde sale |
|---|---|---|
| `--mic-border` | `#2B313D` / `#D9DFE9` | `border` |
| `--mic-bg-hover` | `rgba(247,249,252,.07)` / `rgba(26,33,44,.06)` | `hover` |
| `--mic-focus` (oscuro) | `#3AB8D8` | foco cian; en claro sigue la regla de Mycelium (el acento, `#2A6D82`) |
| `--mic-marco-glow` · `--mic-marco-acento` | el acento · el glow | íconos del rail en cian, segundo color del logo en violeta |
| `--mic-marco-texto` (claro) | el texto secundario | el marco de Arrecife es **claro** en claro, no oscuro como el de los otros dos |
| `--mic-amber-icon` (callout warning) · `--mic-sync-warn` | `#FFB300` | `warning` |
| `--mic-callout-success-border` · `--mic-sync-ok` | `#3ECF8E` | `ok` |
| `--mic-callout-error/danger-border` | `#E5484D` | `danger` (ya era el de Mycelium) |
| note/tip · important (callouts) | el glow · el acento | sin cambio de fórmula |
| info, question, caution (callouts), consola, recordatorios, sintaxis, Mermaid | los de Mycelium | Arrecife no los define |

**Derivados**, porque el crudo de la marca no se lee como texto en ese modo:

- **Acento en claro**: el cian `#3AB8D8` da **2.05:1** sobre `bg` claro. Se usa mezclado al
  50% con `textStrong` → `#2A6D82` (5.14 sobre bg, 5.47 sobre patch, 5.82 sobre surface). Sin
  esto, el H1 (acento al 88%) quedaba en 2.51:1.
- **Glow en oscuro**: el violeta `#7444E4` da **3.15:1** sobre `bg` oscuro. Se usa mezclado al
  70% con `textStrong` → `#9B7AEB` (5.45 / 5.12 / 4.84, y 4.83 sobre su propia píldora).
- **base-deep**: Arrecife no tiene un fondo más hondo que `bg`. En oscuro, `bg` oscurecido
  (`#0F1218`) para bloques de código, velos y sombras; en claro, `textStrong`, que es el color
  de la sombra de Arrecife.

**El gradiente y la muestra usan los acentos crudos** (`#3AB8D8` → `#7444E4`, 135°): los
derivados son solo para lo que se lee como texto.

### Contraste medido (WCAG 2.x, con los hex)

| Texto | Fondo | Oscuro | Claro |
|---|---|---|---|
| principal (`textStrong`) | canvas (`bg`) | 17.00 | 14.29 |
| principal | mist (`surface`) | 15.11 | 16.18 |
| principal | base (`patch`) | 15.99 | 15.21 |
| secundario (`text`) | canvas (`bg`) | 5.55 | 5.15 |
| secundario | mist (`surface`) | 4.94 | 5.84 |
| secundario | base (`patch`) | 5.22 | 5.49 |
| enlace | canvas | 7.71 (cian) | 6.90 (acento al 72% con la tinta) |
| glow como texto (etiqueta) | canvas | 5.45 | 9.35 (al 45% con la tinta) |

Todo ≥4.5:1 sobre los fondos lisos; lo comprueba `scripts/test-temas.mjs` con los valores de
`tokens.css`.

> [!warning] Donde el texto secundario de Arrecife no llega (sin cambiar)
> Sobre fondos **compuestos** del modo oscuro, `text` `#8A9095` queda por debajo de 4.5:1:
> hover sobre un panel (`surface` + 7% de blanco) **4.04**, hover sobre el marco **4.32**,
> la selección suave sobre un panel **4.38**. Sobre `surface2` (`#252A34`) sería 4.46, pero
> ese fondo no se usa. **Ajuste mínimo propuesto, no aplicado**: `#959BA0` en oscuro (4.64 /
> 5.03 en los compuestos, 6.38 sobre bg). No se cambió porque el valor es el de la marca y
> pasa sobre todos los fondos lisos; lo decide el usuario. En claro todos pasan (hover 4.61
> sobre bg, 5.20 sobre surface; selección 5.21).

> [!warning] El texto blanco sobre el gradiente no llega a 4.5:1 en el extremo cian
> Es la regla de Arrecife (§6.1: texto `#FFFFFF` 600 sobre el gradiente) y se respetó: blanco
> sobre `#3AB8D8` **2.33:1**, sobre el punto medio 3.86, sobre `#7444E4` 5.69. Ningún color
> único pasa en los dos extremos (el `patch` oscuro da 7.25 sobre cian y 2.96 sobre violeta).
> Afecta solo a los botones primarios; queda anotado para que el usuario decida.

### Forma (`styles/arrecife.css` + los módulos)

Todo bajo `:root[data-theme='arrecife']`: los otros dos temas no cambian (lo comprueba
`test-temas.mjs`). Lo global va en `styles/arrecife.css`; lo de cada componente, en su
`.module.css` con `:global(:root[data-theme='arrecife']) .clase` y el comentario
«Arrecife (`FUN-M-51`)», para que un renombre de clase no lo rompa en silencio. Las variables
de la marca son `--arrecife-*` (gradiente, gradiente suave, sombra del botón, halo, transición),
no `--mic-*`: no son tokens públicos y la plantilla de snippets no las ofrece.

Lo que se llevó:

- **Radios**: `--mic-radius-sm/md/lg` pasan de 4/8/16 a **8/12/16**. El chico va a 8 y no a 12
  porque también lo usan cosas de 16px de alto (código en línea, la marca «dev») que con 12
  quedarían en píldora; botones primarios e inputs toman 12 explícito.
- **Botón primario**: gradiente, texto blanco, radio 12, sombra `0 4px 16px` violeta, hover
  `brightness(1.1)` + `translateY(-1px)`. En Configuración (Actualizaciones, editor de CSS,
  diccionarios), el diálogo de actualización, bases, recordatorios, importar, reparar
  referencias, Esporas, guardar dibujo, confirmar enlace, «Abrir» de la lista de vaults.
- **Indicadores de selección con el gradiente**: la barra del rail, el interruptor encendido
  (Configuración y opciones del grafo), las barras de progreso (actualización, apertura del
  vault), el marco de la muestra elegida en Apariencia.
- **Selección suave** (`gradient.subtle`): pestaña activa, nota abierta en el árbol, categoría
  elegida de Configuración, opción marcada de la paleta.
- **Inputs de texto**: borde 1.5px, radio 12, foco con borde en el color de foco y halo cian
  de 3px. No toca casillas, radios, deslizadores ni los de Excalidraw.
- **Movimiento**: transiciones de 150–250ms; con «reducir movimiento» del sistema, ni
  transición ni elevación.
- **Geist en la UI**: ya lo era (`--mic-font-sans`) en los tres temas; no hizo falta nada. La
  tipografía de las notas (editor y lectura) **no se toca**.

Lo que **no** se llevó, y por qué:

- **Bordes de 1.5px en todo**: solo los inputs. El resto de los filetes de la app son cientos
  de reglas `1px solid var(--mic-border)` en los módulos; llevarlos a 1.5px exige tocarlas una
  por una o un selector global que también adelgazaría los bordes de 2–4px (pestañas, callouts).
- **El halo de foco en botones y demás**: siguen con el contorno de Mycelium (`outline` en
  `--mic-focus`, que en oscuro ya es cian). El halo está solo en los inputs.
- **Sombras de Arrecife** (`0 8px 28px`): Mycelium tiñe sus sombras con `base-deep`, que quedó
  derivado; no se reemplazaron una por una.
- **El ítem del autocompletado y la opción elegida de un `<select>`** siguen con el acento:
  con el gradiente, el texto blanco caía a 2.3:1 en el extremo cian, y la lista nativa del
  `<select>` no garantiza pintar un gradiente.
- Los comandos «Atmósfera: …» de la paleta siguen listados con Arrecife; cambian la
  preferencia guardada, que se verá al volver a otro tema.

### Atmósferas, visibilidad, persistencia

- **Atmósferas**: `preferencesStore.applyToDom` no emite `data-atmosfera` con Arrecife
  (`atmosferaEnUso` devuelve `null`), así que ninguna regla de `atmosferas.css` lo alcanza. En
  Apariencia los dos selectores siguen visibles, con cada muestra atenuada (opacidad en la hoja,
  no en el grupo) y `disabled`, el rótulo en gris y un aviso: «Este tema trae sus propios
  fondos: las atmósferas no se le aplican. La que elegiste vuelve al cambiar de tema.» No nombra
  al tema. Las preferencias guardadas no se tocan.
- **Visibilidad**: `lib/temas.ts` tiene el catálogo de muestras (`TEMAS`, Arrecife con
  `soloDev`) y `temasVisibles(dev)`, que usa el mismo `comandosDisponibles` de la paleta.
  Apariencia lee `estado.dev` de `useUpdaterStore` (y lo carga si todavía no está). La muestra
  lleva la marca «dev» con el estilo de la paleta. En el buscador de Configuración, la entrada
  `{ rotulo: "Tema", alias: ["arrecife"], soloDev: true }`; el buscador ahora no repite un
  rótulo que llega por dos entradas.
- **Persistencia**: `prefsVaultStore.normalizar` valida con `temaValido`, que acepta los tres
  temas **sin mirar el modo dev**. `prefs_vault.rs` no valida el tema (guarda el JSON tal cual),
  así que Rust no cambió. El tipo `Tema` vive ahora en `lib/temas.ts` y `preferencesStore` lo
  reexporta.
- **PDF**: `lib/printStyles.ts` lleva los raw de Arrecife; el test verifica que sean los mismos
  de `tokens.css`. En desktop el PDF usa el CSS de la ventana, así que hereda también la forma.

### Secreto

`frontend/scripts/secreto-dev.mjs` atrapa `\barrecife\b` y `FUN-M-51`; `test-modo-dev.mjs`
prueba que los atrapa (y que deja pasar «arrecifes»), que la plantilla de snippets no nombra
nada del modo dev, y que la muestra y la entrada del buscador son `soloDev`. La ayuda y la
plantilla no mencionan a Arrecife.

### Archivos

- `frontend/lib/temas.ts` (nuevo) — tipo `Tema`, catálogo de muestras, `temaValido`,
  `temasVisibles`, `admiteAtmosfera`, `atmosferaEnUso`.
- `frontend/styles/tokens.css` — paleta clara y oscura, semánticos propios.
- `frontend/styles/arrecife.css` (nuevo, importado en `app/layout.tsx`) — variables de marca,
  radios, inputs.
- 20 `.module.css` — botones primarios, interruptores, progreso, selección.
- `frontend/components/settings/AppearanceSection.tsx` + `Settings.module.css` — muestras
  según el modo dev, marca «dev», selector de atmósfera deshabilitado.
- `frontend/components/settings/VentanaAjustes.tsx` — alias `soloDev`.
- `frontend/stores/preferencesStore.ts`, `frontend/stores/prefsVaultStore.ts`,
  `frontend/lib/printStyles.ts`.
- Tests: `scripts/test-temas.mjs` (nuevo), `scripts/test-modo-dev.mjs`,
  `scripts/test-capa-datos.mjs` (el tema `arrecife` se conserva al leer).

## Relacionadas

- [[tema-gsmart]] — el segundo tema de marca (`FUN-M-52`), que sigue esta estructura.
- [[modo-dev]] — el modo que lo esconde.
- [[Lo del modo dev no se anuncia]] — por qué no se nombra.
- [[Los temas los define Mycelium, no el usuario]] — Arrecife es una excepción hecha por el
  usuario, no un creador de temas.
- [[DESIGN_SYSTEM]] — los tokens `--mic-*` sobre los que se mapea.
- [[BACKLOG]] — `FUN-M-51`.
