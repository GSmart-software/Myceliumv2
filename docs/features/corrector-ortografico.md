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

## Relacionadas

- [[BACKLOG]] — `FUN-L-12`.
- [[CodeMirror y la vista en vivo]] — cómo se decora el editor.
- [[calendario-recordatorios]] — el otro editor donde rige.
