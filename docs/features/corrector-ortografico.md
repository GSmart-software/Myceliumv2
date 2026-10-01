# Corrector ortográfico (`FUN-L-12` · `EDITOR-CORRECTOR-ORTOGRAFICO`)

Subraya las palabras mal escritas del editor —**también las que ya estaban escritas**—,
sugiere correcciones con el clic derecho y deja agregar palabras a dos diccionarios propios:
el del vault y el de Mycelium.
Motor propio con diccionarios Hunspell que el usuario descarga. **Especificado el
2026-09-27; implementado en desktop el mismo día, sin confirmar en la app (§ 9).**

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
| Diccionarios personales | **Dos** (cambio del 2026-09-27): el **del vault**, que viaja con él, y el **de Mycelium**, que vale para todos los vaults de esta instalación. Así el usuario va corrigiendo los falsos positivos donde corresponde: el nombre de un proyecto en su vault, un anglicismo que usa siempre en Mycelium. Los dos se ven y se editan en Configuración |

## 2. Qué ve el usuario

### 2.1 En el editor

- Las palabras mal escritas llevan un **subrayado ondulado** propio (no el del sistema, que
  se apaga para no tener dos). Aparecen **también en lo ya escrito**: al abrir una nota, lo
  visible se revisa enseguida.
- **Clic derecho sobre una palabra marcada**: un menú propio con **hasta 5 sugerencias**
  (elegir una la reemplaza), **«Agregar al diccionario del vault»**, **«Agregar al diccionario
  de Mycelium»** e **«Ignorar»** (no la
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
- Los **dos diccionarios personales** —el del vault y el de Mycelium—, cada uno con cuántas
  palabras tiene y una lista para **verlas y quitar** las que no se quieran. Sin vault
  abierto, el del vault no se muestra.

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
  **alguno**, o si está en el diccionario del vault, en el de Mycelium o en «Ignorar». Un solo worker; al cambiar
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
  puede apuntar a una carpeta local. El paso a paso —subir, actualizar un diccionario,
  agregar un idioma— está en [[Publicar los diccionarios del corrector]].
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
- **Diccionario de Mycelium**: `diccionario-personal.txt` en la carpeta de configuración de
  la app (`%APPDATA%\com.mycelium.desktop\`, junto a `vaults.json`), **no** junto a los
  diccionarios descargados: son palabras del usuario y tienen que sobrevivir a que se borre o
  actualice un diccionario.
- **Idioma del sistema**: la región del sistema operativo (un comando propio, o
  `Intl.DateTimeFormat().resolvedOptions().locale`, que en la PC del usuario da `es-AR`).

### Web

> [!info] Reflejado a web el 2026-09-30 (`8a4c2d1`, `bc9d5f2`; merge `79f8b8d`), sin probar en la app
> Motor, worker, menú y Configuración son idénticos a desktop. Diverge `lib/ortografia/diccionarios.ts`:
> el navegador baja de R2, descomprime con `DecompressionStream`, verifica el sha256 y guarda en
> la Cache API (`mycelium-diccionarios-v1`) con un registro que se escribe al final; la
> configuración va a `localStorage` y las pestañas se avisan por `BroadcastChannel`. Backend:
> tablas `diccionario_vault` y `diccionario_usuario` (D1) y `GET/PUT /vaults/{id}/diccionario` y
> `/auth/diccionario`. **Falta, del lado del usuario**: aplicar el esquema en D1 de producción
> (`wrangler d1 execute micelio-prod --remote --file=backend/migrations/d1/schema.sql`) y la
> política de **CORS** del bucket de R2 para el origen de la app web (`GET`/`HEAD`).

- La descarga la hace el navegador (`fetch` a R2, con CORS) y los guarda en la **Cache API**
  por URL versionada.
- **Diccionario del vault**: en el backend, como los recordatorios —un documento por vault,
  `GET/PUT /vaults/{id}/diccionario`—, con los mismos permisos.
- **Diccionario de Mycelium**: del **usuario**, en el backend junto a sus preferencias, así lo
  sigue en cualquier navegador.
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
   al reabrir, y **no** afecta a otro vault. «Agregar al diccionario de Mycelium» la desmarca
   en **todos** los vaults y persiste al reabrir la app.
7b. En Configuración se ven las palabras de los dos diccionarios; quitar una vuelve a
   marcarla.
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

## 9. Cómo quedó (desktop)

Implementado el 2026-09-27 en `feat/corrector-desktop`, **sin probar dentro de la app**
(la de desarrollo estaba abierta en otra sesión). Sí se probó fuera: el mismo código en
Edge headless —el motor de WebView2— con Tauri simulado y los diccionarios reales.

### Las piezas

| Pieza | Dónde |
|---|---|
| Motor (spellbook → WASM, API C sin wasm-bindgen: cargar varios, revisar, sugerir, agregar) | `frontend/wasm/ortografia/` → `public/ortografia/motor.wasm` (328 KB; 106 KB en gzip). Se regenera con `npm run wasm:ortografia` |
| Lado JS del motor | `lib/ortografia/motor.ts` |
| Worker (correcta en **alguno** de los cargados, o en los diccionarios personales / ignoradas) | `lib/ortografia/corrector.worker.ts` |
| Servicio de la ventana: arranca/apaga el worker, caché, recarga, «Agregar», «Ignorar», propuesta de descarga | `lib/ortografia/corrector.ts` |
| Palabras, exclusiones, caché, archivo del vault | `lib/ortografia/palabras.ts` (puro) |
| Idioma y región del sistema, variante | `lib/ortografia/idioma.ts` (puro) |
| Manifiesto y estado de cada idioma | `lib/ortografia/manifiesto.ts` (puro) |
| **Capa desktop** (lo único que diverge de web) | `lib/ortografia/diccionarios.ts` |
| Extensión de CodeMirror y menú propio | `lib/editor/ortografia.ts`, `components/editor/MenuOrtografia.tsx` |
| Lo que no es prosa | `lib/editor/ortografiaExclusiones.ts` |
| Configuración → Editor | `components/settings/DiccionariosCorrector.tsx` |
| Descarga, verificación, lectura (Rust) | `src-tauri/src/diccionarios.rs` |
| Diccionario del vault | `.mycelium/diccionario.txt` (`prefs_vault.rs`, lista `ESTADOS`) |
| Diccionario de Mycelium | `diccionario-personal.txt` en `app_config_dir` (`%APPDATA%\com.mycelium.desktop\`), comandos `diccionario_personal_leer/escribir` en `diccionarios.rs` |
| Armar y publicar los diccionarios | `scripts/publicar-diccionarios.mjs` |
| Tests | `scripts/test-ortografia.mjs` (22; 2 se saltean sin `.diccionarios-fuente`) y `cargo test --lib diccionarios` (12) |

### Decisiones tomadas al implementar

- **Desktop descomprime en Rust**, no con `DecompressionStream`: el gzip se descomprime
  mientras baja (`flate2`), se calcula el `sha256` de lo descomprimido (`sha2`) y se
  guardan `.aff`/`.dic` planos. Verificar el hash de lo descomprimido obligaba a
  descomprimir en Rust de todos modos. Web sí usará `DecompressionStream`.
- **Los bytes van al worker por un comando** (`diccionarios_leer`, `ipc::Response`
  crudo), no por `asset:`: el ámbito de `asset:` se abre carpeta por carpeta para los
  vaults y no hacía falta sumarle `%LOCALAPPDATA%`. El worker no puede invocar a Tauri,
  así que el hilo principal los lee y se los **transfiere**.
- **La configuración es de la instalación**: `diccionarios/config.json` (`activas`,
  `propuestaHecha`, `urlManifiesto` opcional), junto a los diccionarios. Lo que se activa
  es la **lengua** (`es`), no la variante; la variante sale de la región del sistema al
  descargar.
- **Todas las variantes de español** de wooorm/dictionaries (España + 21 regiones), no
  solo AR/ES/MX: cuesta lo mismo y cubre a cualquier hispanohablante.
- **Palabras personales en el worker como conjunto**, con la regla de mayúsculas de
  Hunspell (`casa` vale «Casa» y «CASA»), y además **agregadas a cada diccionario** para
  que las sugerencias las propongan. Quitar una recarga los diccionarios desde sus bytes:
  spellbook no sabe «desagregar».
- **Qué se revisa**: lo visible ± 3.000 caracteres. Se descartan los tokens con dígitos o
  `_`, los `camelCase` y las letras sueltas. A las exclusiones de antes se sumaron URLs y
  correos sueltos y el tipo de los callouts (`[!warning]`).
- **Una marca sobre algo que se está editando se quita al instante** y se vuelve a decidir
  al dejar de tipear, para que no quede subrayada media palabra.
- **La propuesta de descarga** sale una sola vez por instalación como aviso flotante (con
  «Descargar») y, mientras no haya ninguno, también arriba de la lista en Configuración.
- **URL del manifiesto**: por defecto `…r2.dev/diccionarios/manifiesto.json`; la cambia
  la variable `MYCELIUM_DICCIONARIOS` (una URL o una carpeta local) o `urlManifiesto` en
  `config.json`. Las URLs del manifiesto son relativas, así que la misma carpeta sirve
  desde R2, desde un servidor local o desde el disco (`file://`).

### Cómo probarlo localmente

1. `cd frontend && npm run publicar-diccionarios -- --simulacro` → deja todo en
   `frontend/.diccionarios/` (fuera de git).
2. Arrancar la app con la variable apuntando ahí:
   `set MYCELIUM_DICCIONARIOS=C:\…\frontend\.diccionarios` y `npm run tauri dev` (en
   PowerShell, `$env:MYCELIUM_DICCIONARIOS = "…"`).
3. Configuración → Editor: descargar Español (y Inglés), abrir una nota con errores.

Para publicarlos de verdad: el mismo script **sin** `--simulacro` (necesita `wrangler`
autenticado). **Ya se subieron a R2** con `npm run publicar-diccionarios`, antes de la
[[Version 2.2.0]] (ver [[Publicar los diccionarios del corrector]]); sin ellos, la app
instalada mostraría «No se pudo consultar la lista de diccionarios».

### Qué cubren los tests y qué falta probar en la app

- **Cubierto sin la app**: criterio 3 (voseo con es-AR, con los diccionarios reales), 4
  (es + en), 5 (exclusiones, con un `EditorState` real), la validación del manifiesto,
  el *fallback* de región, la caché y, en Rust, 9 (descarga cortada, hash distinto,
  cancelación: nada queda a medias y la versión anterior sigue) y 10 (listar/borrar). En
  Edge headless: 1, 2, 6, 7 (el archivo se escribe y la marca se va) y 8, y el
  desplazamiento hasta el final de una nota de 400 renglones sin trabas.
- **Falta en la app**: todo lo que depende de Tauri de verdad —la descarga real con su
  progreso y «Cancelar», los eventos entre ventanas, que el worker y el `.wasm` carguen
  desde `tauri.localhost` en la app **empaquetada** (en `next build` quedan en `out/`)—, el
  criterio 11 (sin conexión), 12 con una nota larga real, 13 (apagar termina el worker:
  se ve en el administrador de tareas del devtools), 14 (licencias) y el menú en modo
  oscuro.

### Lo que no se hizo

- Web (otra rama).
- ~~Subir los diccionarios a R2 (lo hace el usuario con sus credenciales).~~ Hecho antes de
  la [[Version 2.2.0]].
- El `LICENSE.txt` de cada diccionario lleva autor, fuente, licencia, las URLs del texto
  completo de cada licencia y el aviso que trae el paquete, pero **no el texto completo
  de la GPL/LGPL/MPL** (los paquetes no lo incluyen). Revisarlo junto con la advertencia
  del § 8.

### Probado en la app (2026-09-27, con Playwright)

Integrado en `desktop-tauri` (merge `9f643d2`) y probado en `tauri dev` con los diccionarios
generados por `publicar-diccionarios.mjs --simulacro` y `MYCELIUM_DICCIONARIOS` apuntando a
esa carpeta. Todo esto **funcionó**:

- **Configuración**: la lista sale del manifiesto local, detecta la región `AR` y propone
  Español con su tamaño. Descargar baja la variante `es-AR` a
  `%LOCALAPPDATA%\com.mycelium.desktop\diccionarios\es-AR\1.0.0\` con su `LICENSE.txt`;
  Inglés, `en-US`.
- **Criterio 1**: al abrir una nota **sin editarla** se marcan «tezto», «muchoz», «erorres»,
  «arbol», «pais», «tambien», «habia» — justo lo que el corrector del sistema no hacía.
- **Criterios 3, 4 y 5**: el voseo («tenés», «decís», «vení»), una frase en inglés, el código
  en línea y en bloque, el `[[enlace]]` y la etiqueta no se marcan.
- **Criterio 6**: el clic derecho ofrece sugerencias; elegir «texto» reemplazó la palabra.
- **Criterio 7**: «Agregar al diccionario del vault» escribió `.mycelium/diccionario.txt` y
  desmarcó la palabra.
- **Criterio 13**: apagar el interruptor deja cero marcas; encenderlo, vuelven.
- El `spellcheck` del sistema queda en `false`.

Ajuste al probar: el menú no separaba las sugerencias de las acciones; ahora lleva una
divisoria (`separadorAntes` en `ContextMenu`, `fe4e544`).

**Falta**: la confirmación del usuario, la app **empaquetada**, sin conexión (11), una nota
larga real (12), las licencias (14) y la subida real a R2.

### El diccionario de Mycelium (2026-09-27, `feat/corrector-diccionario-mycelium`)

El segundo diccionario personal (§ 1), **sin probar en la app**:

- **Rust** (`diccionarios.rs`): `diccionario_personal_leer` devuelve el texto o `null` si no
  hay archivo —un archivo **ilegible** es error, no «vacío», para que el próximo «Agregar»
  no lo pise—; `diccionario_personal_escribir` crea la carpeta si falta, escribe con
  `escribir_atomico` y emite `diccionario-personal-cambiado` a todas las ventanas.
- **Mismo formato que el del vault**: `leerDiccionarioPersonal` / `escribirDiccionarioPersonal`
  en `palabras.ts` (antes `…Vault`).
- **El worker no cambió**: sigue recibiendo un solo conjunto `personales`, que ahora es
  vault + Mycelium + ignoradas. Quién guarda dónde lo sabe `corrector.ts`, con una API
  única para los dos: `palabrasDe`, `agregarA`, `quitarDe` (`"vault" | "mycelium"`) y
  `suscribirPersonales`.
- **Se carga al iniciar el corrector**, con o sin vault; si no se puede leer, el corrector
  arranca igual sin esas palabras.
- **Otra ventana** que agrega o quita: el evento hace que cada ventana relea solo esas
  palabras (sin recargar los diccionarios); la que escribió ve que no cambió nada y no
  vacía el caché dos veces.
- **Una respuesta vieja no ensucia el caché**: una revisión pedida antes de un
  «Agregar»/«Quitar» vuelve con el resultado anterior; se descarta por `epocaPersonales`
  (aparte de `generacion`, que cortaría una carga en curso). Vale también para el del vault.
- **Menú**: sugerencias, divisoria, «Agregar al diccionario del vault» (deshabilitada sin
  vault), «Agregar al diccionario de Mycelium», «Ignorar». Un fallo al guardar se avisa.
- **Configuración**: «Diccionarios personales», una caja por diccionario con su cantidad,
  dónde se guarda y «Ver y quitar». La lista está en orden alfabético, se desplaza dentro
  de su caja (12rem) y, desde 12 palabras, tiene un filtro que no distingue tildes ni
  mayúsculas (`filtrarPalabras`). Sin vault, solo se ve la de Mycelium.

**A probar en la app**: agregar a Mycelium desde un vault y verla desmarcada en otro
(criterio 7), reabrir la app y que siga, quitarla en Configuración y que se vuelva a marcar
(7b), con dos ventanas abiertas, y la lista con muchas palabras en modo oscuro. El orden de las sugerencias lo da
el motor: para «tezto», «texto» sale cuarta, detrás de «teto», «tote» y «testo».

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
