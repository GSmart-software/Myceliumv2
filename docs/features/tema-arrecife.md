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

## Relacionadas

- [[modo-dev]] — el modo que lo esconde.
- [[Lo del modo dev no se anuncia]] — por qué no se nombra.
- [[Los temas los define Mycelium, no el usuario]] — Arrecife es una excepción hecha por el
  usuario, no un creador de temas.
- [[DESIGN_SYSTEM]] — los tokens `--mic-*` sobre los que se mapea.
- [[BACKLOG]] — `FUN-M-51`.
