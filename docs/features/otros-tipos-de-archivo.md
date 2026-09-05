# Abrir los archivos que no son notas (`FUN-L-11` · `FILES-OTROS-TIPOS`)

Un vault no tiene solo markdown. Tiene el PDF que descargaste, la captura que pegaste, el
`.json` de configuración, el script que acompaña a la nota que lo explica. Mycelium ya los
**lista** (`FUN-S-03`); esto es poder **abrirlos**.

> [!info] Estado
> Especificada el 2026-08-18. **Implementada en desktop** el 2026-08-22 (sin confirmar).
>
> **Solo-desktop**, y no por comodidad: en web los archivos que no son notas no existen en
> ninguna parte. No hay carpeta que recorrer, y subirlos a R2 sería una funcionalidad entera
> —almacenamiento, cuota, permisos—. Se anota en [[Diferencias funcionales aceptadas entre versiones]].

---

## 1. Qué entra, y qué no

**Cuatro visores, todos de solo lectura**:

| Tipo | Qué se ve |
|---|---|
| Texto plano y código | Lector monoespaciado con números de línea |
| PDF | El documento, paginado |
| Imágenes | La imagen, con zoom y desplazamiento |

**De solo lectura, a propósito.** Se leen, se buscan y se cierran; no se guardan cambios.
Estos archivos Mycelium no los indexa ni los respalda: escribir en algo que no está bajo su
cuidado es la peor combinación posible. Si después hace falta editarlos, se agrega encima sin
rehacer nada.

**Fuera de alcance en v1**: el resaltado de sintaxis del código y la edición. Las dos
llegaron después, encima de esto y sin rehacer nada: `FUN-M-26` (editar, 2026-09-03) y
`FUN-S-09` (resaltado, 2026-09-05, § 8).

---

## 2. Cómo se abre: una pestaña más

El workspace ya sabe tener pestañas que **no son notas**: la terminal lo hace desde
`FUN-L-07`, con un centinela `terminal:` en `tabsStore`. Este es el mismo caso y usa el mismo
mecanismo, con `archivo:<ruta relativa>`.

Que sea el mismo mecanismo importa más de lo que parece: `tabsStore` ya sabe reconciliar
—descartar pestañas cuyo destino desapareció—, dividir el panel, arrastrar entre paneles y
persistir por vault (`DEF-044`). Nada de eso hay que rehacerlo, **y nada de eso debe
duplicarse**.

> [!warning] Una pestaña puede sobrevivir a su archivo
> Las pestañas persisten por vault. Si el archivo se borró o se renombró desde fuera, al
> reabrir el vault esa pestaña apunta a la nada. `reconcileNotes` ya resuelve el caso para las
> notas; hay que cubrir el centinela nuevo o quedan pestañas fantasma que fallan al pintarse.

---

## 3. Cómo llega el contenido

Dos caminos, según el tipo, y la diferencia no es un detalle:

**Texto y código** → el comando `leer_archivos` que ya existe (lee UTF-8 por ruta relativa).
Se reutiliza tal cual.

**PDF e imágenes** → el **protocolo `asset:` de Tauri**, con su ámbito acotado a la carpeta
del vault abierto, y `convertFileSrc` para obtener la URL.

> [!important] Por qué no mandarlos por IPC
> Lo directo sería un comando que devuelva los bytes y armar un `blob:`. **No se hace**: un
> PDF de 30 MB pasaría por IPC serializado en base64 —un tercio más de peso—, se duplicaría en
> memoria y bloquearía el hilo. El protocolo `asset:` los sirve como los sirve un servidor web,
> en trozos y sin copiar. El precio es declarar un ámbito, y ese ámbito **debe ser la carpeta
> del vault y nada más**: abrirlo entero equivaldría a dejar que cualquier página del webview
> lea el disco.

---

## 4. Lo que no se puede dar por sentado

- **Un `.txt` puede no ser UTF-8**, y un archivo sin extensión conocida puede ser binario. Si
  el contenido no decodifica, **se dice** —«Mycelium no puede mostrar este archivo»— en vez de
  volcar caracteres de reemplazo, que es peor que no abrirlo.
- **El tamaño no tiene techo natural**: un log de 500 MB no se pinta. Hay que cortar por
  tamaño, avisar de que se muestra un fragmento y ofrecer abrirlo con la aplicación del
  sistema.
- **Abrir con el sistema** es la salida para todo lo que no se pueda mostrar: ya existe
  `revelarEnSistema` en `lib/db/vaultFs.ts` y esto es su pariente.

---

## 5. Lo que NO cambia

Estos archivos siguen **fuera** del índice: no entran en la búsqueda del vault, no aparecen en
el autocompletado de `[[`, no son nodos del grafo y no cuentan como notas. Es la misma
decisión que en `FUN-S-03`, y por el mismo motivo: un PDF no es una nota. Abrirlo no lo
convierte en una.

---

## 6. Verificación

- `cd frontend/src-tauri && cargo check` y `cargo test --lib` · `npx tsc --noEmit` · `npx next build`.
- A mano, que es donde esto se prueba:
  1. Abrir un `.txt`, un archivo de código, un PDF y una imagen desde el explorador.
  2. Un archivo **binario** con extensión de texto → mensaje claro, sin basura en pantalla.
  3. Un archivo **muy grande** → aviso y opción de abrirlo con el sistema.
  4. Dividir el panel con un visor abierto, y arrastrar su pestaña a otro panel.
  5. Cerrar el vault, **borrar el archivo desde fuera** y reabrir → la pestaña no reaparece rota.
  6. Comprobar que ninguno de esos archivos aparece en la búsqueda, en el grafo ni al escribir `[[`.

---

## 7. Cómo quedó implementado (2026-08-22)

| Pieza | Dónde |
|---|---|
| Pestaña `archivo:<ruta>` | `lib/otrosArchivos.ts` (prefijo y helpers) · `stores/tabsStore.ts` (`esSentinela`) |
| Visor por tipo | `components/visor/VisorArchivo.tsx` |
| Texto/código | comando Rust `leer_archivo_visor` (`src-tauri/src/archivos.rs`) |
| PDF e imagen | protocolo `asset:` + `convertFileSrc`; ámbito en `ventanas::registrar_vault` |
| Abrir con el sistema | comando Rust `abrir_con_sistema` (`src-tauri/src/vault_fs.rs`) |
| Pestañas fantasma | `tabsStore.reconcileArchivos` desde `app/(workspace)/workspace/page.tsx` |

Tres decisiones que la spec no fijaba y hubo que tomar:

- **`leer_archivos` no se reutilizó**, aunque la § 3 lo daba por hecho. Ese comando omite
  **en silencio** lo que no es UTF-8 —que es lo correcto para el indexador, que solo quiere
  lo que puede indexar— y no tiene noción de tamaño. El visor necesita justo lo contrario:
  distinguir «no existe» de «no es texto» de «es demasiado grande», porque cada caso se le
  cuenta al usuario distinto (§ 4). De ahí `leer_archivo_visor`, que devuelve el fragmento
  más `bytes`, `truncado` y `binario`.
- **El ámbito del protocolo `asset:` se abre en runtime**, al registrar el vault, y no en
  `tauri.conf.json`: la carpeta la elige el usuario. Es de la app y no de la ventana, así
  que con varios vaults abiertos (`FUN-L-16`) quedan permitidas todas sus carpetas —siguen
  siendo carpetas que el usuario abrió—. Revocar al cerrar **no** es opción: el `forbid` del
  scope tiene prioridad sobre el `allow`, así que prohibir una carpeta impediría reabrirla
  en toda la corrida.
- **El corte por tamaño es de 2 MB** (`MAX_BYTES_VISOR`), con tope duro de 8 MB en Rust, y
  se corta en el último salto de línea. Un carácter multibyte partido por el corte **no**
  cuenta como «no es UTF-8»: se distingue por `Utf8Error::error_len() == None`.

## 7. Editar los archivos de texto (`FUN-M-26`)

Añadido el 2026-08-18, encima de lo anterior. **El visor sigue abriéndose en solo lectura**;
editar es un modo al que se entra a propósito, con un botón. «Abrir con el sistema» se queda
donde está.

### Por qué no se edita de entrada

Estos archivos **no tienen la red de seguridad que tienen las notas**: no se indexan, no van a
la papelera de Mycelium, no hay historial ni respaldo. Un guardado equivocado no se deshace
desde la app. Por eso el modo de solo lectura es el default y editar es una decisión
consciente, no el estado en el que te encontrás sin querer.

### Lo que NO se puede editar, y hay que impedirlo

> [!danger] Un archivo truncado no se guarda jamás
> El visor corta a 2 MB y muestra el principio. Si se pudiera editar y guardar **ese
> fragmento**, se borraría todo el resto del archivo — silenciosamente y sin vuelta atrás. El
> botón de editar **no existe** para un archivo truncado; no alcanza con deshabilitarlo.

Tampoco se edita lo que no decodificó como UTF-8: si Mycelium no pudo leerlo, no puede
reescribirlo sin destruirlo.

### Cómo se guarda

- **Guardado explícito** (`Ctrl+S`), no automático. Las notas se autoguardan porque tienen
  papelera e historial detrás; esto no. Que el usuario decida cuándo escribir es parte de la
  misma prudencia.
- **Indicador de cambios sin guardar**, y aviso al cerrar la pestaña con cambios pendientes.
- **Escritura atómica**, como la de `vault_fs`: escribir a un temporal y renombrar. Un corte a
  mitad de escritura no debe dejar el archivo a medias.
- **Detección de conflicto**: se guarda el `mtime` al abrir y se comprueba antes de escribir.
  Si el archivo cambió desde fuera, **no se pisa**: se avisa y se deja elegir.

### El editor

CodeMirror en configuración mínima —deshacer, selección, números de línea y el resaltado de
`FUN-S-09`— y **sin** vista en vivo ni markdown. Es el mismo motor que ya usa el editor de
notas: no se suma nada al bundle y el deshacer viene resuelto.

### Lo que sigue igual

No entran al índice: ni búsqueda del vault, ni autocompletado de `[[`, ni grafo. Editar un
`.json` no lo convierte en una nota.

---

## 8. Resaltado de sintaxis (`FUN-S-09`, 2026-09-05)

Un archivo de código se ve **coloreado según su lenguaje**. Lo que costó no fue pintar: fue
elegir con qué.

### El lector cambia de motor

El lector eran dos `<pre>` —números y contenido— con el scroll sincronizado a mano, y
estaban elegidos **por rendimiento**: un elemento por línea era un panel que tardaba
segundos con 2 MB. Pasa a ser CodeMirror en solo lectura.

> [!important] CodeMirror resolvió el motivo por el que no se usaba
> Dibuja **solo las líneas visibles**, así que el archivo grande le cuesta menos que a los
> dos `<pre>`, que obligaban al navegador a maquetar el texto entero. Lo que parecía la
> opción pesada era la liviana.
>
> Y siendo el mismo motor que el modo edición, leer y editar el mismo archivo dejan de
> **poder** verse distinto. Con dos implementaciones era cuestión de tiempo.

Lo que se paga a cambio: **la búsqueda pasa del DOM a CodeMirror**. No es una preferencia,
es obligatorio — `buscarEnDom` recorre nodos y fuera del viewport no hay ninguno. Buscar
algo del final de un archivo largo no habría encontrado nada.

Eso obligó a un ajuste en `SearchBar`: una prop `sinReemplazo`. `modoLectura` no servía,
porque ese flag dice **dónde** se busca (en el DOM en vez de en el editor), y acá hace falta
buscar en un editor **sin** ofrecer un reemplazo que sobre un documento de solo lectura no
escribiría nada y solo parecería roto.

### El lenguaje sale del nombre del archivo

No del contenido. Es lo único que se sabe con certeza antes de leerlo, y la heurística por
contenido acierta poco justo en los archivos cortos, que son la mayoría de los que se abren
de paso. Se busca por **nombre completo** y no solo por extensión, así que `Dockerfile` y
`Makefile` también se reconocen.

### La gramática se carga bajo demanda

`@codemirror/language-data` no trae las gramáticas: trae descriptores con un `load()` que
las importa. Un vault con un `.rs`, un `.py` y un `.go` no paga por los otros cuarenta
lenguajes, y **el bundle no crece por soportarlos**.

Por eso no puede ser una extensión a secas: cuando la gramática llega, la vista ya está
montada, y hay que **reconfigurar un compartimento** en vez de recrearla. Una gramática que
no cargue deja el archivo en texto plano — exactamente lo que se veía antes.

### Los colores son los de siempre

Salen de `--mic-syntax-*` (`tokens.css`), que ya tenía juego claro y oscuro. La lista de
reglas `token → color` se subió a `lib/editor/paletaSintaxis.ts`: vivía dentro de
`livePreview` y el visor iba a ser la segunda copia.

> [!important] Que el mismo código se vea igual en un archivo y pegado en una nota no es cosmética
> Un fragmento pegado en una nota y el archivo del que salió son lo mismo. Si una `keyword`
> es azul en un lado y verde en el otro, el lector deja de leer color y pasa a leer «esto es
> otra cosa» — que es justo lo contrario de lo que el resaltado existe para decir.

El editor de CSS personalizado (`cssExtensions`) conserva su propia lista, y **no** por
descuido: ahí los mismos tags significan otra cosa —`propertyName` es una propiedad CSS,
`className` un selector, `atom` un valor como `flex`— y unificarlos perdería justo lo que
hace legible una hoja de estilos. Comparten los tokens, que es donde vive la coherencia.

### Qué se reflejó a web

`FUN-S-09` es **solo-desktop** por herencia: sin el visor de `FUN-L-11`, en web no hay nada
que colorear. Sí viajaron `paletaSintaxis.ts`, `livePreview.ts` y `SearchBar.tsx`, que son
compartidos — y con `SearchBar` se **cerró** una divergencia que arrastraba de `FUN-L-11`:
allá nunca había recibido la prop `placeholder`.

## Relacionadas

- [[BACKLOG]] — `FUN-L-11`, `FUN-M-26` (editar) y `FUN-S-09` (resaltado), las dos que
  llegaron encima.
- [[terminal-integrada]] — el precedente de una pestaña que no es una nota.
- [[Diferencias funcionales aceptadas entre versiones]] — por qué esto no va a web.
- [[Mapa de documentacion]] — índice general.
