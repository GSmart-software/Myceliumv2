# Avisos, confirmaciones y recientes

`FUN-M-33` · **ambas versiones** · desktop 2.0.0 (2026-09-20) · reflejada a web el 2026-09-22

Lo que salió de la crítica del cascarón (25/40): sus dos problemas de comportamiento más
graves y el que más molesta a diario.

## El borrado tenía dos caras opuestas

Borrar una **nota** no decía nada: la fila desaparecía del árbol, la pestaña se cerraba y
nadie contaba que había ido a la papelera ni ofrecía volver atrás. Borrar una **carpeta**
sí preguntaba, pero con el **diálogo nativo de Windows**, en una app que se sacó la barra
de título del sistema justo para no parecerse a eso (`FUN-M-31`).

Ahora:

- **La nota no pregunta y sí avisa.** Va a la papelera y aparece «*«Nombre» fue a la
  papelera*» con **Deshacer**, que la restaura con `restoreNota`. Preguntar antes de cada
  borrado enseña a decir que sí sin leer; ofrecer la vuelta atrás, no.
- **La pregunta la dibuja Mycelium.** `DialogoConfirmar` usa `useDialogoModal` (foco
  atrapado, Escape, foco devuelto) y **arranca con el foco en «Cancelar»**: lo que se abre
  con el teclado no debe poder confirmarse con un Enter de inercia. El botón que ejecuta
  dice el verbo («Eliminar», «Eliminar definitivamente»), no «Aceptar».

> [!info] `confirmar()` no cambió de forma
> Sigue siendo `await confirmar(mensaje, verbo)`. Por dentro ya no llama al plugin de
> diálogos de Tauri: deja la pregunta en `confirmarStore` y espera la respuesta. Si no hay
> interfaz montada devuelve `false` — ante la duda, no se ejecuta lo destructivo.

## Avisos

`avisar(texto, { etiqueta, hacer })` (en `stores/avisosStore.ts`) pone una tarjeta abajo a
la izquierda, sobre la barra de estado. Se va sola a los 9 segundos, se puede descartar, y
como mucho hay tres a la vez. Son efímeros y no se persisten: cuentan algo que **acaba**
de pasar.

## La paleta recuerda

Abrir la paleta sin escribir listaba el vault entero en orden alfabético, así que lo
primero que se veía era la chatarra de herramientas. Ahora muestra **las últimas notas
que se miraron** (`stores/recientesStore.ts`, persistido, hasta 20), y si todavía no hay
ninguna cae en la lista de antes.

El registro se hace donde la URL cambia de nota, no dentro de `openNote`: así cuenta
cualquier forma de llegar —clic en el árbol, enlace, paleta, historial—, que es lo que
«reciente» quiere decir.

## Teclado y rótulos

- **`Ctrl+Tab` / `Ctrl+Shift+Tab`** ciclan las pestañas del pane activo, con vuelta. Es el
  atajo que trae quien viene de VS Code.
- El disparador de la paleta decía `Ctrl+P` y abre **notas**; `Ctrl+P` abre **comandos**.
  Ahora dice `Ctrl+O`, y la ayuda al pie de la paleta muestra las dos teclas.

## Verificado en la app

Nota descartable creada, borrada (aviso + «Deshacer» → vuelve), borrada otra vez y
eliminada desde la papelera con el diálogo propio (texto, verbo y foco inicial
comprobados). `Ctrl+Tab` y `Ctrl+Shift+Tab` alternan entre las dos pestañas abiertas. La
paleta abre con las dos últimas notas vistas.

## En web

Reflejada entera el 2026-09-22 ([[Version 2.0.0 de web]]), sin adaptaciones: los avisos, el
diálogo propio, las recientes y `Ctrl+Tab` no dependen de la capa de datos.

Con ella, **`lib/confirmar.ts` deja de divergir**. Tenía dos cuerpos distintos —el diálogo
del plugin de Tauri en desktop, `window.confirm` en web— con la misma firma asíncrona. Ahora
la pregunta la dibuja Mycelium en las dos y el archivo es uno solo. Ver [[RAMAS]].

## Relacionadas

[[Rediseñar la UI con impeccable]] · [[marco-de-ventana]] · [[configuracion]] · [[BACKLOG]]
