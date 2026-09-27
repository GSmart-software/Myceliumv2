# Corrector ortográfico (`FUN-L-12` · `EDITOR-CORRECTOR-ORTOGRAFICO`)

Subraya las palabras mal escritas mientras se escribe en el editor. Implementado el
2026-09-27 en las dos versiones: desktop `85ee186`, web `7b419c4`. **Sin confirmar en la
app.**

## 1. La decisión: el corrector del sistema

El [[BACKLOG]] lo planteaba con un motor propio: varios idiomas a la vez, elegidos en
Mycelium, y un diccionario personal. Antes de especificarlo se investigó qué permite
WebView2, el motor de la ventana de desktop:

- **No deja elegir el idioma del corrector desde la app.** Usa el del sistema operativo. La
  única opción de idioma que expone (`CoreWebView2EnvironmentOptions.Language`) cambia los
  menús, no el corrector
  ([WebView2Feedback #3758](https://github.com/MicrosoftEdge/WebView2Feedback/issues/3758)).
- Las sugerencias del menú contextual no se pueden leer como texto, así que tampoco se
  puede armar un menú propio con ellas
  ([#2340](https://github.com/MicrosoftEdge/WebView2Feedback/issues/2340)).

Un motor propio —diccionarios Hunspell en un *worker*, con sus licencias GPL/LGPL/MPL que
revisar, sugerencias y menú propios— era un trabajo L. El usuario lo descartó el
2026-09-27: **«si toma el idioma del sistema, dejémoslo solo con el idioma del sistema, es lo
más simple y evita generarnos complejidades problemáticas»**.

> [!info] Qué quedó afuera, a propósito
> - **Elegir idiomas en Mycelium.** El idioma es el de Windows (o el del navegador, en
>   web). Para sumar otro, se configura en el sistema.
> - **El diccionario personal por vault.** «Agregar al diccionario», en el menú nativo,
>   guarda en el diccionario del sistema, que es global.
>
> Si algún día hacen falta, el camino es el motor propio que describe el BACKLOG.

## 2. Qué hace Mycelium

El corrector lo dibuja el sistema: el subrayado, las sugerencias del clic derecho y
«Agregar al diccionario». Mycelium hace dos cosas (`lib/editor/ortografia.ts`):

1. **Encenderlo.** CodeMirror pone `spellcheck="false"` en su área editable por defecto, y
   por eso nunca hubo subrayados. La extensión lo pisa según la preferencia, que se lee en
   cada actualización de la vista.
2. **Excluir lo que no es prosa**, marcándolo con `spellcheck="false"`:
   - código en línea y bloques de código (renglón por renglón);
   - URLs, autoenlaces y HTML;
   - `[[enlaces]]` y embeds `![[…]]`;
   - etiquetas `#…`;
   - fórmulas `$…$` y bloques `$$`;
   - el frontmatter, cuando se ve en crudo.

## 3. Dónde rige

- El editor de notas, en vivo y en crudo.
- El detalle de los recordatorios ([[calendario-recordatorios]]).
- **No** en el editor de CSS, los campos de las bases, el canvas ni el título: ya tenían
  `spellcheck` apagado a propósito.

**Configuración → Editor → «Corrector ortográfico»**, activado por defecto. Al cambiarlo, los
editores abiertos se refrescan al instante (`refrescarCorrector`).

## 4. Qué falta confirmar en la app

- Que WebView2 subraye dentro del editor y que el clic derecho muestre las sugerencias. Se
  implementó sin poder levantar la app: la de desarrollo abierta era de otra sesión.
- Que las exclusiones se respeten: un bloque de código o un `[[enlace]]` con palabras
  «inventadas» no debe subrayarse.
- Que el menú contextual nativo esté habilitado en la app **empaquetada**, no solo en
  desarrollo.

## 5. Lo que mostró la app: el sistema no revisa el texto existente

Probado el 2026-09-27, apenas implementado: **solo se marca lo que se tipea**. Al abrir una
nota no se subraya nada hasta editar cada renglón. Se reprodujo en Edge (el motor de
WebView2) con CodeMirror **y con un `textarea` común**: el texto que ya estaba no se revisa
nunca, ni con un clic sobre el párrafo, ni esperando, ni alternando `spellcheck`. Edge y
WebView2 usan el corrector de Windows, y ese camino solo revisa lo que se escribe. Coincide
con [electron #53608](https://github.com/electron/electron/issues/53608). Forzarlo exigiría
reescribir cada renglón, lo que marcaría la nota como modificada: descartado.

**Obsidian** no tiene el problema porque su corrector es el de Chromium que trae Electron,
con **diccionarios Hunspell** que la app elige (`session.setSpellCheckerLanguages`) y un
diccionario personal. WebView2 no ofrece esas APIs. El equivalente para Mycelium es un motor
propio con diccionarios Hunspell.

## 6. La investigación del motor propio (2026-09-27)

Medida por un subagente fuera del repo, con los diccionarios reales, en Node y en Edge
headless (scripts en `%TEMP%\corrector-investigacion`). **No** se probó dentro de la app.

| Motor | Carga `es` | Memoria | Revisión | `suggest` | Peso (brotli) | Estado |
|---|---|---|---|---|---|---|
| **spellbook → WASM** (Rust, MPL-2.0) | 55–90 ms | 6,6 MB | 5.000 palabras en ~25 ms | 23–35 ms | 80 KB | **recomendado**; activo, «alfa» |
| hunspell-asm | 128 ms | ~18 MB | similar | 19 ms | 220 KB | abandonado |
| nspell | ~1 s | 49 MB | rápida | 7 ms | 6 KB | no carga el italiano |
| typo-js | 1,35 s | 62 MB | rápida | **804 ms** | 7 KB | descartado |

**Diccionarios** (wooorm/dictionaries, `.aff` + `.dic`):

| Diccionario | Licencia | gzip |
|---|---|---|
| `es` (España) · `es-AR` y otras variantes | GPL-3+ **o** LGPL-3+ **o** MPL-1.1+ | ~228 KB |
| `en` (EE. UU.) | MIT/BSD | ~190 KB |
| `it` | **solo GPL-3**: riesgo legal a revisar | ~351 KB |

- **Calidad**: con `es` detectó 20/20 errores típicos. Con el de España se marca el voseo
  («tenés», «vení»); con `es-AR`, solo «podés». Faltan «vámonos», «pónganselo»,
  anglicismos y nombres propios: el **diccionario personal** pasa a ser necesario.
- **Mycelium no tiene archivo LICENSE** (`Cargo.toml`: `license = ""`).
- **Diseño decidido por el usuario**: los diccionarios **no** van en el instalador; se suben
  a R2 junto a los instaladores, con un manifiesto (`id`, versión, URL, `sha256`, licencia,
  fuente), y el usuario elige cuáles descargar en Configuración. Se sirven en gzip
  (`DecompressionStream`; Edge no descomprime brotli), se escriben en `.part` y se activan
  tras verificar el hash. Desktop los guarda en la carpeta local de datos de la app; web, en
  la Cache API, con CORS en R2.
- **Arquitectura recomendada**: el mismo motor WASM en un *worker* para las dos versiones;
  Rust en desktop solo para descargar y verificar. Un `ViewPlugin` revisa lo visible con
  debounce, reutilizando las exclusiones de `ortografia.ts`, con caché de palabras,
  subrayado propio y menú propio (sugerencias, «Agregar al diccionario», «Ignorar»).
- **Tamaño**: L en total (compartido M, desktop S–M, web S, servidor S).

**Pendiente de decisión del usuario**: seguir con el motor propio; variantes regionales del
español; si el italiano entra ahora o tras revisar su licencia.

## Relacionadas

- [[BACKLOG]] — `FUN-L-12`.
- [[CodeMirror y la vista en vivo]] — cómo se decora el editor.
- [[calendario-recordatorios]] — el otro editor donde rige.
