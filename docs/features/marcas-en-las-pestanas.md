# Marcas en las pestañas (`FUN-S-11` · `FUN-S-12`)

Dos marcas visuales sobre la misma tira de pestañas: el **ícono del tipo** de
documento, y un **color por consola**. Se hicieron juntas porque comparten el
sitio y porque una necesita a la otra para no contradecirla — `FUN-S-11` incluye
la consola entre los tipos, y `FUN-S-12` la pinta.

| | Alcance | Estado |
|---|---|---|
| `FUN-S-11` · ícono del tipo | ambas | Confirmado en desktop y reflejado a web el 2026-09-05 |
| `FUN-S-12` · color por consola | solo desktop (no hay terminal en web) | Confirmado el 2026-09-05 |

## 1. El problema

Una pestaña solo decía su nombre. Con seis abiertas —una nota, un dibujo, una
tabla, dos consolas y el grafo— hay que **leer** cada título para saber qué es
cada una, y en el caso de las consolas ni eso alcanza: se llaman «Terminal 1» y
«Terminal 2».

## 2. `FUN-S-11` — el ícono del tipo

Junto al nombre, el ícono de lo que la pestaña contiene: nota, dibujo, lienzo,
tabla, consola, el grafo, las referencias del vault, o un archivo que Mycelium
lista pero no indexa.

Vale para las **dos tiras**: las pestañas del área de trabajo (`TabBar`) y las
ancladas en el panel lateral (`SidebarDock`). Son la misma cosa en dos sitios.

### La respuesta tiene que ser la misma en todas partes

El mapa `tipo → ícono` vive en **`frontend/lib/iconosDeTipo.ts`**, y esa es la
decisión que importa de esta funcionalidad. Antes la pregunta se contestaba en
tres lugares distintos dentro de `ExplorerPanel.tsx` —la fila del árbol, la
sombra que sigue al puntero al arrastrar, y los botones de crear— y la pestaña
habría sido el cuarto.

> [!important] Un ícono distinto no se lee como una variante, se lee como un error
> Si un archivo es una tabla en el árbol y un documento en su pestaña, el usuario
> no concluye «son dos vistas con criterios distintos»: concluye que una de las
> dos está mal, y deja de confiar en las dos. Por eso el mapa se centralizó en el
> mismo cambio en que apareció el cuarto consumidor, y no después.

Lo que **sí** quedó duplicado, a propósito, es el reparto de los ids especiales
—grafo, referencias, consola, archivo suelto— entre `TabBar` y `SidebarDock`. Es
la misma duplicación que ya tenía `tituloDe`, y por el mismo motivo: el dock no
conoce panes ni historial, y compartir el reparto obligaría a pasarle a un módulo
común cosas que solo existen en uno de los dos. Lo que se comparte es el mapa por
tipo, que es la parte que puede contradecirse.

### El interruptor

Configuración → Editor → «Ícono del tipo en las pestañas», encendido por defecto.
No es un adorno configurable por gusto: con muchas pestañas abiertas cada ícono
resta ancho al título, que es lo que de verdad las distingue entre sí. Cuando el
espacio aprieta, lo que se recorta con puntos suspensivos es el título y **no** el
ícono — un ícono a medio dibujar no dice nada.

Es una preferencia **del usuario** (`preferencesStore`) y no del vault: es una
elección de densidad visual, y acompaña a la persona.

## 3. `FUN-S-12` — un color por consola

Se elige desde el panel de consolas, en la misma fila donde se renombra. Seis
colores más «sin color». La marca aparece en la pestaña de esa consola, en las
dos tiras, y **se atenúa cuando no tiene el foco**: así se distinguen entre sí de
un vistazo sin perder cuál se está viendo.

### La marca es una barra, no el ícono

El ícono también toma el color, pero el portador es una **barra de 3 px** en el
borde izquierdo de la pestaña. El motivo es concreto: el ícono se puede apagar
desde Configuración (`FUN-S-11`), y **el color no puede depender de otra
preferencia para existir**. Con las dos activas, las dos marcas se refuerzan.

### La atenuación no es `opacity`

Es una mezcla con el fondo (`color-mix`) calculada en el componente. `opacity`
compone el subárbol entero, y la marca vive **dentro** de la pestaña: apagarla
apagaría de paso el título, que es justo lo que no puede pasar cuando el objetivo
es «sin perder cuál se está viendo». Ver [[DESIGN_SYSTEM]] § Estados visuales
comunes.

### La lista es cerrada, y no sigue al tema

Seis colores fijos en vez de un selector libre, por dos razones:

- Un selector libre deja elegir el gris del fondo o el celeste de la marca, y con
  eso la consola queda **peor** identificada que sin color.
- Son marcas de **identidad**, no del lenguaje visual de Mycelium. Si siguieran al
  tema, la consola «verde» sería otra en Cantarela y el usuario perdería
  exactamente lo que eligió.

Por eso viven en la capa semántica de `tokens.css` (`--mic-consola-*`) y no entre
los tokens de tema.

> [!important] Los seis valores están medidos, no elegidos a ojo
> Un solo valor por color tiene que servir para los **ocho** fondos posibles: dos
> temas × claro/oscuro × canvas/mist. Se midió el contraste de cada candidato
> contra los ocho, y el peor caso de la paleta elegida queda en **3.79:1**, por
> encima del 3:1 que pide WCAG 1.4.11 para un objeto gráfico. El par más parecido
> entre sí (cian/verde) está a 74 de distancia en RGB, que es lo que de verdad se
> les pide: distinguirse **entre ellos**.
>
> Consecuencia visible: el ámbar tira a oliva y no a dorado. Un ámbar brillante
> desaparece sobre el fondo claro, y ahí el color deja de identificar nada.

### Dónde se guarda

En `terminalStore`, junto al resto de la sesión, que ya se persiste para poder
restaurar las consolas al reabrir la app. No hizo falta almacén nuevo.

## 4. Archivos implicados

| Archivo | Qué |
|---|---|
| `frontend/lib/iconosDeTipo.ts` | **Nuevo.** El mapa `tipo → ícono` y los íconos de los ids especiales |
| `frontend/components/panes/TabBar.tsx` | Las pestañas del área de trabajo. **Diverge** entre ramas |
| `frontend/components/workspace/SidebarDock.tsx` | Las pestañas ancladas. **Solo desktop** |
| `frontend/components/explorer/ExplorerPanel.tsx` | Pasa a consumir el mapa en sus tres sitios. **Diverge** |
| `frontend/stores/preferencesStore.ts` · `components/settings/EditorSection.tsx` | El interruptor |
| `frontend/stores/terminalStore.ts` · `components/terminal/TerminalPanel.tsx` | El color y su selector (`FUN-S-12`) |
| `frontend/styles/tokens.css` | `--mic-consola-*` |

## 5. Verificación

- `tsc` y `next build` en las dos ramas.
- A ojo, y con la lista abierta: los ocho tipos en las dos tiras, el interruptor
  apagado y encendido, y los seis colores **en los cuatro combos tema × modo**.
  Este es el tipo de cambio que solo se ve mal en el combo que nadie probó.

## Relacionadas

- [[navegacion-por-pestana]] — el comportamiento de las pestañas: scroll, historial
  y previsualización.
- [[terminal-integrada]] — las consolas que `FUN-S-12` colorea.
- [[DESIGN_SYSTEM]] — la regla de por qué la atenuación no es `opacity`.
- [[RAMAS]] — qué se reflejó a web y qué no.
- [[BACKLOG]] — `FUN-S-11` y `FUN-S-12`.
- [[Mapa de documentacion]] — índice general.
