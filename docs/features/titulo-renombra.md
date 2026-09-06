# El título renombra el archivo (`FUN-M-24`)

El título que se ve arriba de la nota deja de ser un adorno de solo lectura: un
clic lo abre para escribir y renombra el archivo, como en Obsidian. Antes había
que salir al explorador, buscarlo y usar su menú.

Confirmada en desktop y reflejada a web el 2026-09-05.

> [!info] Se hizo en este orden a propósito
> La ficha del [[BACKLOG]] llevaba un bloqueo: mientras los `[[enlaces]]` no se
> reescribieran al renombrar, poner el renombrado en el título volvería
> **cotidiano y accidental** algo que hasta entonces era deliberado, y una
> molestia conocida se convertiría en pérdida de datos diaria. `FUN-M-08` se hizo
> antes (2026-09-03) y el bloqueo se levantó.
>
> No fue exceso de celo: al implementar esto salió `DEF-084`, que es exactamente
> ese riesgo por otra puerta — el renombrado reescribía los enlaces con un nombre
> que nunca existió en disco. Ver [[bugs-progreso]].

---

## 1. Dónde se edita, y dónde no

**Solo en las vistas de edición** (en vivo y raw). En lectura el título sigue
siendo texto.

> [!important] Una vista de solo lectura con un elemento editable es una mentira
> Si todo lo demás no se toca y el título sí, el usuario no concluye «este
> elemento es especial»: concluye que no sabe qué se puede tocar. Por eso la
> señal de «esto se escribe» —el cursor de texto y el fondo al pasar el puntero—
> vive en una clase aparte (`.mic-doc-title-editable`) que **solo** pone el
> editor, separada de la que pinta el degradado.

En modo dividido conviven las dos: la mitad izquierda se edita, la derecha no.

## 2. Qué pasa vive fuera del widget

`lib/tituloEditable.ts` tiene las reglas —qué cuenta como «no cambió», qué se
manda a renombrar, qué se muestra cuando falla— y `lib/editor/docTitle.ts` solo
dibuja.

No es separación por gusto: el widget es **DOM a mano dentro de CodeMirror**, el
peor sitio posible para dejar una regla, porque desde ahí no se puede probar
nada. El módulo es puro y sin imports, así que corre headless
(`scripts/test-titulo.mjs`, 14 casos).

## 3. Un nombre inválido se RECHAZA, no se corrige

Es la decisión de producto de esta funcionalidad, y **cambia respecto de lo que
hace el resto de la aplicación**.

| Situación | Política | Por qué |
|---|---|---|
| Importar un archivo, crear desde una plantilla | `sanearNombre` **corrige** (`? : * \| " < > \ /` → `-`) | El nombre ya viene dado y tiene que aterrizar en algún sitio |
| Renombrar desde el título | **Rechaza** y dice el motivo | Hay alguien mirando que **acaba de escribirlo** |

Cambiarle las letras a alguien en silencio le deja un archivo que no se llama
como pidió y ninguna forma de saber por qué. Y se dice **cuáles** son los
caracteres: «tiene caracteres inválidos» obliga a buscarlos a ojo.

Se rechazan además los nombres reservados de Windows (`CON`, `PRN`, `LPT1`…) y
los que terminan en punto, que Windows recorta en silencio — y entonces el nombre
en disco dejaría de coincidir con el del índice. Las reglas son las de Windows
aunque el vault viva en otro sistema: un nombre que solo funciona en Linux
convierte el vault en una carpeta que no se puede copiar a otra máquina, y eso se
descubre tarde y mal.

Un espacio sobrante al final **se recorta**, no se rechaza: es un resbalón al
teclear, no una intención. El punto final sí puede ser intencional.

### Lo que NO se adelanta

Si el nombre **ya está ocupado** depende de la carpeta, y eso solo lo sabe quien
renombra de verdad. Su mensaje es el que se muestra.

> [!warning] La lista de caracteres está escrita dos veces, y hay un test que lo vigila
> `lib/tituloEditable.ts` y `lib/db/nombres.ts` llevan el mismo juego. No se puede
> evitar: `lib/db/` es solo-desktop y los dos módulos son puros —cada uno se
> transpila solo para su test headless—, así que ninguno puede importar al otro.
>
> Lo que sí se puede evitar es que se separen sin que nadie lo note. Un test
> recorre 30 caracteres y comprueba que **todo lo que uno rechaza es exactamente
> lo que el otro sustituye**. Se salta en `web-cloud`, donde el segundo módulo no
> existe.

## 4. Salir del campo descarta

<kbd>Enter</kbd> confirma · <kbd>Esc</kbd> descarta · **salir del campo también
descarta**.

Eso último difiere del renombrado del explorador, que confirma al perder el foco,
y es deliberado: renombrar mueve el archivo en disco y reescribe los enlaces que
le apuntan. No puede pasar por un clic distraído en cualquier otro sitio.
Confirmar es siempre un acto.

## 5. Lo que exigió CodeMirror

De las **seis reglas del widget de bloque interactivo**
([[CodeMirror y la vista en vivo]]) aplican tres:

| Regla | Por qué acá |
|---|---|
| 2 · `updateDOM` obligatorio | Sin él CodeMirror tira el DOM y lo reconstruye, y el campo **pierde el foco a la primera tecla**. Pasa de verdad: el autoguardado dispara transacciones mientras se teclea el nombre |
| 3 · `ignoreEvent()` en `true` | Acá vale para todo el widget y no solo para los controles: el título entero **es** el control, y un clic en él abre la edición en vez de colocar el cursor |
| 5 · `requestMeasure()` en cada cambio de alto | Abrir el campo o mostrar un error pasa **fuera** del ciclo de actualización, y el height-map se quedaría con el alto anterior |

La **4** y la **6** no aplican, y queda escrito para que no parezca olvido:
renombrar no edita el documento —no hay `dispatch` de texto que agrupar en el
deshacer— y este widget no reemplaza ningún rango, así que no esconde texto en el
que el cursor pueda entrar a ciegas.

## 6. Dos detalles de CSS que costaron

Los dos son la misma trampa: **`background-clip: text` recorta TODAS las capas de
fondo**, no solo la que pinta las letras.

- **El degradado bajó del contenedor al texto.** Con un campo y un cartel de error
  dentro del título, el recorte del contenedor los teñía a ellos también — y un
  error en degradado no se lee.
- **La caja del campo va en un contenedor, no en el `<input>`.** Un
  `background-color` en el propio campo se habría recortado contra las letras y
  no se vería. El campo conserva el degradado; el contenedor pone el marco.

Para que entrar a editar no mueva el texto ni un píxel, el estado en reposo lleva
el **mismo relleno y un borde transparente del mismo grosor** que la caja: lo
único que aparece al hacer clic es el marco.

## 7. Archivos implicados

| Archivo | Qué |
|---|---|
| `frontend/lib/tituloEditable.ts` | **Nuevo.** Las reglas. Puro y sin imports |
| `frontend/scripts/test-titulo.mjs` | **Nuevo.** 14 casos, uno de ellos la guarda contra la deriva de las dos listas |
| `frontend/lib/editor/docTitle.ts` | El widget, ahora interactivo. **Compartido** |
| `frontend/styles/editor.css` | El campo, la caja y el cartel de error. **Compartido** |
| `frontend/components/editor/NoteEditor.tsx` | El facet `renombrarPorTitulo` y el título de lectura. **Diverge** |

## 8. Verificación

- `tsc`, `next build` y `node --test scripts/test-titulo.mjs` en las dos ramas.
- En la app: renombrar y comprobar que los `[[enlaces]]` entrantes siguen
  funcionando; un nombre ya usado en la carpeta; caracteres inválidos; salir del
  campo sin confirmar; y que el campo **no pierda el foco** al escribir con
  cambios sin guardar.
- Que plegar por títulos siga funcionando: `headingFold` busca el primer hijo que
  no sea el título, y ese bloque cambió por dentro.

## Relacionadas

- [[bugs-progreso]] — `DEF-084`, que salió de implementar esto.
- [[CodeMirror y la vista en vivo]] — las seis reglas del widget interactivo.
- [[edicion-en-el-render]] — `FUN-M-19` y `FUN-L-19`, de donde salen esas reglas.
- [[BACKLOG]] — `FUN-M-24` y el bloqueo de `FUN-M-08` que hubo que levantar antes.
- [[Mapa de documentacion]] — índice general.
