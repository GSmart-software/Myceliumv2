# Configuración

`FUN-M-32` (+ `FUN-M-34`, `FUN-M-35`) · **ambas versiones** · desktop 2.0.0 (2026-09-20) · reflejada a web el 2026-09-22

> [!info] Qué es
> Configuración deja de ser un panel que entra desde la derecha y pasa a ser una **ventana
> centrada** (980×700) con las categorías a la izquierda, un **buscador de ajustes** arriba
> y el contenido a la derecha. Las opciones son exactamente las mismas.

## Por qué

El panel medía 440px y tenía tres pestañas. Funcionó mientras hubo pocos ajustes; hoy hay
ocho secciones y unas veinticinco opciones, de tipos muy distintos —muestras de color,
interruptores, deslizadores, listas de versiones, el editor de `.mycignore`, los snippets
de CSS—, y cada uno que entraba apretaba más a los demás. El usuario lo describió como
«tosca y desorganizada» el 2026-09-20 y pidió rediseñarla sin restricciones.

La forma la eligió él entre tres: ventana centrada con menú lateral (la de Obsidian y VS
Code, que es la que aguanta que sigan entrando opciones), pestaña del área de trabajo, o
seguir como panel lateral reorganizado.

## Cómo está organizada

| Grupo | Categorías |
|---|---|
| **Aspecto** | Apariencia (tema, modo, atmósferas) · Tipografía · Snippets CSS |
| **Trabajo** | Editor · Grafo · Consolas |
| **Vault** | Vault (Esporas, referencias, exportar, importar, IA, `.mycignore`) |
| **Sistema** | Actualizaciones |

Cada categoría abre con su nombre y una línea que dice qué se decide ahí. Las secciones
son los mismos componentes de antes (`components/settings/*Section.tsx`): lo que cambió es
dónde viven y cuánto sitio tienen.

## El buscador

Filtra por nombre de ajuste y muestra los resultados **en lugar de** la lista de
categorías, cada uno con la suya al lado. Al elegir uno, abre su categoría, se desplaza
hasta él y lo señala un momento.

El índice es la lista de rótulos de `VentanaAjustes.tsx` (el campo `ajustes` de cada
categoría) y el salto busca ese rótulo **en el DOM**, comparando por prefijo y sin tildes.
Se hizo así para que las secciones no tengan que registrar nada; el precio es que si se
renombra un ajuste hay que renombrarlo también en el índice.

> [!warning] El salto va en un efecto, no en `requestAnimationFrame`
> Con la ventana en segundo plano el navegador **pausa** esos cuadros y el salto no
> ocurría. Y la marca se consume desde una referencia, no desde estado: cambiar el estado
> volvía a disparar el efecto y su limpieza quitaba el resaltado en el mismo instante en
> que se ponía.

## Teclado y accesibilidad

- `role="dialog"` + `aria-modal`, con `useDialogoModal`: el foco arranca en el buscador,
  Tab queda atrapado dentro, Escape cierra y al cerrar el foco vuelve a donde estaba.
- Escape con texto en el buscador **lo limpia primero** y no cierra la ventana.
- Flechas, Inicio y Fin recorren las categorías desde la que tiene el foco.
- Los siete clics sobre la versión que activan el modo avanzado (`FUN-M-16`) siguen ahí,
  ahora en el pie de la ventana.

## Lo que se ajustó de las secciones

Los controles se acotan (`Settings.module.css`): un ajuste mide como mucho 420px y un
interruptor 560px, porque un desplegable de 700px no se lee mejor que uno de 380. Las
explicaciones quedan en medida de lectura (62ch) y cada interruptor tiene aire respecto de
la explicación del anterior.

## Segunda tanda: no perder lo escrito (`FUN-M-34`, 2026-09-20)

La crítica de impeccable sobre la ventana recién hecha dio **19/40**, y sus cuatro hallazgos
más graves eran todos la misma clase de cosa: trabajo del usuario que se evapora sin avisar.

### El borrador del `.mycignore`

Era estado local de `VaultSection`. La ventana **desmonta la sección al cambiar de
categoría**, así que ir a mirar una opción de Apariencia y volver borraba lo escrito; y
Escape, el clic en el velo y la × lo tiraban sin preguntar. Ahora el texto vive en
`stores/borradoresStore.ts` (`mycignore` + `mycignoreSucio`) y **cerrar pregunta** si hay algo
sin guardar. La guardia está en `cerrar()` de `VentanaAjustes`, por donde pasan los tres
caminos de salida; cada apertura arranca con el borrador limpio.

### Esporas validaba tarde

El error de la carpeta de Esporas se fijaba en el `blur`, y salir del campo suele ser **el
mismo clic** que cambia de categoría: la sección se desmontaba con el error recién puesto y
nunca se leía. Ahora valida en cada tecla y el mensaje aparece mientras se escribe. Escape en
ese campo también deja de cerrar la ventana: deshace lo tecleado y se queda ahí.

### Borrar un snippet de CSS

Se borraba de un clic, sin red — el único borrado de la app que quedaba así después de
[[avisos-y-confirmaciones]]. Ahora pregunta con el diálogo propio y, hecho, el aviso ofrece
**Deshacer**: el contenido viaja en el aviso y se vuelve a crear con el mismo nombre.

### Lo que termina, se cuenta

Exportar el vault o generar las instrucciones de IA dejaba el resultado en un párrafo al pie
de la sección, a unos 900px de scroll del botón que lo disparó. Ahora también sale como
aviso flotante. El error se queda **además** en el panel, porque conviene poder releerlo.

> [!warning] Los avisos tienen que pasar por encima de la ventana
> `Avisos` estaba en `z-index: 55` y Configuración en 70: los avisos que produce la propia
> ventana quedaban tapados por ella. Pasaron a 90.

### Los tres chicos del cascarón

De la misma tanda, fuera de Configuración: el **botón de enlaces se fue a la izquierda** de la
barra de estado, junto al isotipo — es lo único que se pulsa ahí, y estaba perdido entre
cuatro rotulitos de solo lectura, con un separador «·» huérfano que ahora se suprime; más
`DEF-096` («Raw» → «Crudo») y `DEF-097` (el título deja de ir centrado).

### Verificado en la app

Borrador que sobrevive al cambio de categoría; la pregunta al cerrar y el descarte; el error
de Esporas apareciendo al teclear `../fuera` y yendose al corregir; el botón de enlaces a
12px del borde izquierdo con su isotipo; el modo «Crudo» y el título alineado a la izquierda.

## Tercera tanda: que se pueda leer y encontrar (`FUN-M-35`, 2026-09-20)

Lo que quedaba de la misma crítica, una vez tapados los agujeros por donde se perdía
trabajo.

### Un solo interruptor

Doce ajustes de sí o no y **dos formas** de preguntarlo: nueve eran un botón con la palabra
«Activado» y tres la píldora del sistema, con tres tratamientos de foco entre ambas. Con dos
formas para la misma decisión la columna de la derecha deja de poder leerse de un vistazo,
que es justo lo único que una lista de ajustes tiene que permitir. Ahora todos pasan por
`components/settings/Interruptor.tsx`: rótulo a la izquierda, píldora a la derecha,
explicación debajo en medida de lectura, y un estado apagado visible para el que todavía no
se puede tocar. Con él se fueron la clase `.toggle` y el parche `style={{ color: … }}` que
se repetía en diecisiete párrafos.

### El buscador dejaba de servir justo cuando hacía falta

El índice era una lista de rótulos exactos: quien no supiera que el ajuste se llama
«Archivos ignorados (.mycignore)» no lo encontraba, porque «ignorar», «indexar» o
«excluir» no devolvían nada. Cada entrada pasa a ser `{ rotulo, alias?, soloAvanzado? }`:

- los **alias** son cómo lo llamaría quien no sabe cómo se llama — se busca por ellos, pero
  lo que se muestra y a lo que se salta es siempre el rótulo;
- **`soloAvanzado`** saca del índice lo que vive tras los siete clics mientras no esté
  encendido: ofrecerlo era mandar a un salto que no llegaba a ningún lado;
- faltaba **«Shell por defecto»**, que no estaba indexado.

### Lo demás

- **Los snippets no están en ninguna cuenta.** El texto prometía respaldo «en cualquier
  dispositivo», herencia de la línea web, en la versión cuyo principio es que nada sale de
  la máquina. Se guardan en el índice local del vault abierto, y eso es lo que dice ahora.
- **El modo avanzado se alcanza con el teclado**: los siete clics vivían en el `<footer>`, así
  que sin ratón era inalcanzable. Ahora el número de versión es un `<button>`.
- **La marca del salto tiene color propio** (`--mic-marca`, el acento) y un fondo teñido.
  Usaba `--mic-focus` sin que el foco estuviera ahí: dos anillos iguales se leen como dos
  focos.
- **Los cuatro grupos sobreviven a la ventana angosta**: bajo 720px las categorías pasan a
  fichas en fila y el nombre del grupo se ocultaba, dejando ocho fichas sueltas. Ahora ocupa
  su propio renglón.
- **Las listas de snippets y de versiones** respetan el mismo tope de 560px que un ajuste.
- **`Ctrl+,` abre Configuración**, el atajo de VS Code y Obsidian; el engranaje del rail y el
  comando de la paleta lo anuncian.

### Verificado en la app

Cero botones «Activado/Desactivado» y cinco interruptores en Editor; «ignorar» → Archivos
ignorados, «plantillas» → Carpeta de Esporas, «powershell» → Shell por defecto, «sangria» →
Ancho de tabulación; el salto marca la fila (`--mic-marca` = `#19e6ff` contra `--mic-focus`
= `#3dffc4`); el pie es un `<button>`; el engranaje dice «Configuración (Ctrl+,)». La
ventana angosta queda sin comprobar en vivo: exige achicar la ventana real del usuario.

## En web

Reflejada el 2026-09-22 ([[Version 2.0.0 de web]]). Tres diferencias, todas por lo que
existe en cada versión:

- **«Cuenta» es una categoría más** (perfil y «Cerrar sesión»). En el panel viejo colgaban
  del pie, a la vista desde cualquier pestaña —también desde Apariencia—.
- **No hay Consolas ni Actualizaciones**: la terminal y el actualizador son de desktop. El
  pie, por lo mismo, solo dice la versión y no esconde el modo avanzado.
- **La guardia del cierre no tiene qué custodiar**: el borrador que se perdía era el del
  `.mycignore`, que no existe en web. `cerrar()` queda como el sitio donde ponerla el día
  que web gane un ajuste que se escriba a mano.

## Relacionadas

[[Rediseñar la UI con impeccable]] · [[avisos-y-confirmaciones]] · [[atmosferas]] · [[DESIGN]] · [[BACKLOG]]
