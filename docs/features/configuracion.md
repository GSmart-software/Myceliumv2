# Configuración

`FUN-M-32` · desktop · rama `experimento/ui-impeccable` · 2026-09-20

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

## Relacionadas

[[Rediseñar la UI con impeccable]] · [[atmosferas]] · [[DESIGN]] · [[BACKLOG]]
