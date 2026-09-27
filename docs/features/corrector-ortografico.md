# Corrector ortográfico (`FUN-L-12` · `EDITOR-CORRECTOR-ORTOGRAFICO`)

Subraya las palabras mal escritas del editor —**también las que ya estaban escritas**—,
sugiere correcciones con el clic derecho y deja agregar palabras a un diccionario del vault.
Motor propio con diccionarios Hunspell que el usuario descarga. **Especificado el
2026-09-27; en implementación.**

> [!important] Historia corta
> Primero se implementó con el corrector **del sistema** (desktop `85ee186`, web
> `7b419c4`): el usuario lo eligió por simple. Al probarlo resultó que Edge/WebView2 **solo
> revisa lo que se tipea**: una nota abierta no mostraba ningún error hasta editar cada
> renglón. Se investigó un motor propio y cómo lo hace Obsidian, y el usuario decidió ir por
> el motor propio. Los §§ H1–H6, al final, son ese recorrido; el resto es la especificación
> vigente.

## 1. Decisiones del usuario (2026-09-27)

| Tema | Decisión |
|---|---|
| Motor | **Propio**: `spellbook` (Rust, compatible con Hunspell) compilado a WebAssembly, en un *worker*. El mismo en desktop y web |
| Idiomas | **Español, inglés e italiano**. Se pueden tener varios activos a la vez: una palabra está bien si lo está en alguno |
| Español | **Uno solo visible**, «Español», que por debajo es la **variante de la región del sistema** (es-AR, es-ES, es-MX…), porque con el de España el voseo sale todo marcado. Sin región conocida o sin variante: es-ES |
| Diccionarios | **No van en el instalador.** Se publican en R2, junto a los instaladores, y el usuario **elige cuáles descargar** en Configuración |
| Italiano | Entra ahora, aunque su diccionario es GPL-3 solo (§ 8) |
| Diccionario personal | **Por vault**: «Agregar al diccionario» guarda en el vault y viaja con él |

## 2. Qué ve el usuario

### 2.1 En el editor

- Las palabras mal escritas llevan un **subrayado ondulado** propio (no el del sistema, que
  se apaga para no tener dos). Aparecen **también en lo ya escrito**: al abrir una nota, lo
  visible se revisa enseguida.
- **Clic derecho sobre una palabra marcada**: un menú propio con **hasta 5 sugerencias**
  (elegir una la reemplaza), **«Agregar al diccionario del vault»** e **«Ignorar»** (no la
  marca más en esta sesión, en ningún editor). Sobre cualquier otra cosa, el menú de
  siempre.
- **No se corrige lo que no es prosa**: código, URLs, HTML, `[[enlaces]]`, etiquetas,
  fórmulas y frontmatter. Ya está calculado en `lib/editor/ortografia.ts`.
- Rige en el editor de notas —en vivo y en crudo— y en el detalle de los recordatorios.

### 2.2 En Configuración → Editor → «Corrector ortográfico»

- El **interruptor** de siempre (activado por defecto).
- La **lista de diccionarios disponibles** —la del manifiesto de R2—: Español, Inglés,
  Italiano. Cada uno con su tamaño de descarga y su estado:
  - *No descargado* → botón **Descargar**.
  - *Descargando* → progreso, y **Cancelar**.
  - *Descargado* → casilla **Activo** y botón **Quitar**; si el manifiesto trae una versión
    nueva, **Actualizar**.
  - *Error* → el motivo y **Reintentar**.
- La primera vez que se enciende el corrector sin ningún diccionario, se **propone
  descargar el del idioma del sistema**, con su tamaño. Nunca se descarga nada sin que el
  usuario lo pida.
- Sin conexión, la lista muestra lo ya descargado y dice que no se pudo consultar el resto.
- Un enlace **«Licencias de los diccionarios»** con la licencia, la fuente y el autor de
  cada uno (§ 8).
- El diccionario del vault: cuántas palabras tiene y una forma de **verlas y quitar** una.

## 3. Arquitectura (compartida por las dos versiones)

```
CodeMirror ── ViewPlugin ──(palabras únicas no cacheadas)──▶ Worker
   ▲  decora             ◀──(correctas / incorrectas)────────   │ spellbook.wasm
   │                                                          │ + diccionarios activos
   └── menú propio ──(suggest palabra)──▶ Worker ──▶ sugerencias
```

- **Motor**: un crate Rust mínimo sobre `spellbook` que expone *cargar diccionario*,
  *revisar*, *sugerir* y *agregar palabra*, compilado a `wasm32-unknown-unknown`. **El
  `.wasm` se commitea** (≈ 80 KB con brotli) junto a su fuente y un script para
  regenerarlo, así ni el build de la app ni el de web necesitan la cadena de Rust para WASM.
  La fuente del crate se publica igual (spellbook es MPL-2.0).
- **Worker**: carga el WASM y los diccionarios activos; una palabra es correcta si lo es en
  **alguno**, o si está en el diccionario del vault o en «Ignorar». Un solo worker; al cambiar
  los diccionarios activos se recarga.
- **Qué se revisa**: lo visible (`view.visibleRanges`) con un margen, con **debounce de
  ~300 ms** después de escribir o desplazarse. Se extraen las palabras (letras Unicode, con
  apóstrofo interno), se **descartan los rangos excluidos** y se mandan al worker solo las
  **únicas que no estén en el caché** del hilo principal (`palabra → correcta`), que se vacía
  al cambiar de diccionarios.
- **Decoración**: `Decoration.mark({ class: "mic-error-ortografico" })`, subrayado ondulado
  con un token de color del tema.
- **`ortografia.ts` se refactoriza**: el cálculo de rangos excluidos pasa a una función
  reutilizable, y el `spellcheck` del sistema vuelve a quedar **apagado** siempre.
- **Rendimiento**: el editor nunca espera al worker. Medido fuera de la app: revisar un
  viewport cuesta < 5 ms en el worker y la ida y vuelta de 300 palabras, ~2,5 ms.

## 4. Los diccionarios en R2

Junto a los instaladores, en el mismo bucket:

```
diccionarios/
├── manifiesto.json
├── es-AR/1.0.0/{es-AR.aff.gz, es-AR.dic.gz, LICENSE.txt}
├── es-ES/1.0.0/…
├── es-MX/1.0.0/…            (y las demás variantes de español que se publiquen)
├── en-US/1.0.0/…
└── it-IT/1.0.0/…
```

`manifiesto.json`:

```json
{
  "version": 1,
  "idiomas": [
    {
      "id": "es",
      "nombre": "Español",
      "variantes": [
        { "region": "AR", "id": "es-AR", "version": "1.0.0", "aff": "…/es-AR.aff.gz",
          "dic": "…/es-AR.dic.gz", "sha256Aff": "…", "sha256Dic": "…", "bytes": 226000 }
      ],
      "porDefecto": "es-ES",
      "licencia": "GPL-3.0+ OR LGPL-3.0+ OR MPL-1.1+",
      "urlLicencia": "…/LICENSE.txt",
      "urlFuente": "https://github.com/sbosio/rla-es",
      "autor": "Santiago Bosio (RLA-ES)"
    }
  ]
}
```

- Las rutas llevan la **versión**: son inmutables y cacheables.
- Van en **gzip** y se descomprimen con `DecompressionStream('gzip')` (Edge no descomprime
  brotli).
- El **hash** es del archivo descomprimido y se verifica antes de activar.
- Un script `frontend/scripts/publicar-diccionarios.mjs` arma los archivos y el manifiesto a
  partir de los paquetes `dictionary-*`, con `--simulacro` como `publicar.mjs`. **Subir a
  R2 lo hace el usuario** (credenciales suyas); para desarrollo, la URL del manifiesto se
  puede apuntar a una carpeta local.
- Web necesita **CORS** en el bucket para el origen de la app web.

## 5. Notas por versión

### Desktop

- **Descarga y verificación en Rust** (`reqwest` ya viene con el updater): escribe en
  `archivo.part`, verifica el `sha256` y recién entonces renombra. Si algo falla, se borra el
  `.part` y se conserva la versión anterior buena.
- **Dónde**: `%LOCALAPPDATA%\<identificador>\diccionarios\<id>\<version>\` — son de la
  **instalación**, no del vault, y no van en la carpeta *roaming*.
- El worker recibe los bytes por un comando que los lee, o por el protocolo `asset:` ya
  activado.
- **Diccionario del vault**: `.mycelium/diccionario.txt`, una palabra por renglón, por los
  comandos `leer/escribir_estado_vault` (se agrega a su lista cerrada).
- **Idioma del sistema**: la región del sistema operativo (un comando propio, o
  `Intl.DateTimeFormat().resolvedOptions().locale`, que en la PC del usuario da `es-AR`).

### Web

- La descarga la hace el navegador (`fetch` a R2, con CORS) y los guarda en la **Cache API**
  por URL versionada.
- **Diccionario del vault**: en el backend, como los recordatorios —un documento por vault,
  `GET/PUT /vaults/{id}/diccionario`—, con los mismos permisos.
- **Idioma**: `navigator.languages`, con *fallback* a `Intl`.

## 6. Criterios de aceptación

1. Con Español descargado y activo, **al abrir una nota** con errores ya escritos, se marcan
   sin editar nada.
2. Escribir una palabra mal la marca al dejar de tipear; corregirla la desmarca.
3. En la PC del usuario (región AR), «tenés», «vení», «decime» no se marcan.
4. Con Español e Inglés activos, una palabra inglesa bien escrita no se marca.
5. El código, las URLs, los `[[enlaces]]`, las etiquetas, las fórmulas y el frontmatter no se
   marcan nunca.
6. Clic derecho sobre una marca: hasta 5 sugerencias; elegir una reemplaza la palabra.
7. «Agregar al diccionario del vault» la desmarca en todas las notas de ese vault, persiste
   al reabrir, y **no** afecta a otro vault.
8. «Ignorar» la desmarca hasta cerrar la app.
9. Descargar muestra el progreso; una descarga cortada no deja un diccionario roto; un
   hash que no coincide se rechaza.
10. Quitar un diccionario lo borra del disco y deja de usarse.
11. Sin conexión, lo descargado sigue funcionando.
12. Una nota larga no traba el editor al abrirla ni al desplazarse.
13. Con el corrector apagado no hay subrayados y el worker no está cargado.
14. Las licencias de cada diccionario se pueden ver desde Configuración.

## 7. Fuera de esta versión

- Elegir a mano la variante regional del español (se decide por la región del sistema).
- Gramática, homófonos («haber si», «echo de menos»): ningún diccionario Hunspell los ve.
- Más idiomas que los tres: el manifiesto los admite, pero no se publican ahora.

## 8. Licencias

| Pieza | Licencia | Qué exige |
|---|---|---|
| `spellbook` | MPL-2.0 | Indicar dónde está su fuente; publicar cambios solo si se modifican sus archivos |
| Español (RLA-ES) | GPL-3+ o LGPL-3+ o MPL-1.1+ | Acompañar el texto de la licencia y ofrecer la fuente (un enlace alcanza) |
| Inglés (SCOWL) | MIT/BSD | Conservar el aviso de copyright |
| Italiano | **solo GPL-3** | Ofrecer la fuente y la licencia. Se distribuye **aparte y opcional**, sin modificar |

> [!warning] A revisar por fuera del código
> - **Mycelium no tiene archivo LICENSE** (`Cargo.toml`: `license = ""`).
> - La GPL-3 del italiano: el usuario decidió incluirlo ahora; distribuirlo como descarga
>   separada y sin modificar es la posición más defendible, pero no se consultó a un
>   abogado.

---

# Historia

## H1. La decisión: el corrector del sistema

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

## H2. Qué hace Mycelium

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

## H3. Dónde rige

- El editor de notas, en vivo y en crudo.
- El detalle de los recordatorios ([[calendario-recordatorios]]).
- **No** en el editor de CSS, los campos de las bases, el canvas ni el título: ya tenían
  `spellcheck` apagado a propósito.

**Configuración → Editor → «Corrector ortográfico»**, activado por defecto. Al cambiarlo, los
editores abiertos se refrescan al instante (`refrescarCorrector`).

## H4. Qué falta confirmar en la app

- Que WebView2 subraye dentro del editor y que el clic derecho muestre las sugerencias. Se
  implementó sin poder levantar la app: la de desarrollo abierta era de otra sesión.
- Que las exclusiones se respeten: un bloque de código o un `[[enlace]]` con palabras
  «inventadas» no debe subrayarse.
- Que el menú contextual nativo esté habilitado en la app **empaquetada**, no solo en
  desarrollo.

## H5. Lo que mostró la app: el sistema no revisa el texto existente

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

## H6. La investigación del motor propio (2026-09-27)

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

**Decidido el mismo día**: motor propio, las tres lenguas, el español por región del sistema.
La especificación vigente es la de arriba.

## Relacionadas

- [[BACKLOG]] — `FUN-L-12`.
- [[CodeMirror y la vista en vivo]] — cómo se decora el editor.
- [[calendario-recordatorios]] — el otro editor donde rige.
