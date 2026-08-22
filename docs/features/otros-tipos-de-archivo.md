# Abrir los archivos que no son notas (`FUN-L-11` · `FILES-OTROS-TIPOS`)

Un vault no tiene solo markdown. Tiene el PDF que descargaste, la captura que pegaste, el
`.json` de configuración, el script que acompaña a la nota que lo explica. Mycelium ya los
**lista** (`FUN-S-03`); esto es poder **abrirlos**.

> [!info] Estado
> Especificada el 2026-08-18. **Sin implementar.**
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

**Fuera de alcance**: el resaltado de sintaxis del código, que es `FUN-S-09` y depende de
esto; y editar, que no tiene ítem porque todavía nadie lo pidió.

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

## Relacionadas

- [[BACKLOG]] — `FUN-L-11`, y `FUN-S-09` (resaltado) que depende de este.
- [[terminal-integrada]] — el precedente de una pestaña que no es una nota.
- [[Diferencias funcionales aceptadas entre versiones]] — por qué esto no va a web.
- [[Mapa de documentacion]] — índice general.
