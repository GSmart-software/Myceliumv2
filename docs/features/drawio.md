# Diagramas de draw.io dentro de Mycelium (`FUN-L-20` · `FILES-DRAWIO`)

**Idea registrada el 2026-09-22** desde la [[Bandeja de entrada]]. Sin implementar: esta
nota fija qué se pide, qué hay que decidir antes de empezar y dónde toca el código.

> Pedido textual: «Quiero integrar la herramienta de draw.io en mycelium, así como se
> implementó excalidraw».

## 1. Qué se pide

Un **tipo de archivo más del vault**, con el mismo trato que un `.excalidraw`: se crea desde
el explorador, se abre en su pestaña, se edita dentro de Mycelium y se guarda como archivo
en la carpeta del vault. Nada de abrir el navegador ni de exportar a mano.

## 2. Por qué, si ya está Excalidraw

Son dos herramientas para dos trabajos distintos, como ya pasó con [[canvas]]:

| | **Excalidraw** | **draw.io** |
|---|---|---|
| Qué manipula | Trazos a mano alzada | Figuras y conectores que se **enganchan** |
| Para qué sirve | Pensar en voz alta, un boceto | Un diagrama formal que se mantiene |
| Qué trae | Lápiz, formas sueltas | Bibliotecas: UML, ER, red, BPMN, nube |

Un diagrama de arquitectura que hay que **retocar dentro de seis meses** en Excalidraw es
mover trazos; en draw.io es mover una caja y que las flechas la sigan. Ninguna reemplaza a
la otra, igual que el canvas no reemplazó a Excalidraw.

## 3. La decisión que hay que tomar primero: cómo se embebe

> [!important] draw.io no es una librería, es una aplicación web
> Excalidraw se integró como componente React (`@excalidraw/excalidraw`) y por eso fue
> barato. draw.io **no publica un componente equivalente**: lo que ofrece es su aplicación
> entera en **modo embebido** —un `iframe` con `?embed=1&proto=json` que habla por
> `postMessage` (`init`, `load`, `save`, `export`, `autosave`, `exit`)—. El archivo lo sigue
> guardando Mycelium; el iframe solo edita y devuelve el XML.

De ahí salen dos caminos, y hay que elegir **antes** de escribir código:

| | `iframe` al sitio público (`embed.diagrams.net`) | La webapp **empaquetada** en Mycelium |
|---|---|---|
| Sin internet | No funciona | Funciona |
| Instalador | Igual que hoy | Crece (la webapp son varios MB) |
| Mantenimiento | Lo actualizan ellos | Lo actualizamos nosotros |
| Tauri | Hay que abrir la CSP a ese origen | Todo local |

> [!warning] Mycelium funciona sin conexión, y eso no se negocia
> El vault es una carpeta en el disco; el índice, la búsqueda, el grafo y la terminal no
> tocan la red. Un editor que exige internet metería la primera excepción a esa promesa —y
> justo en la parte donde se pierde trabajo si falla—. Así que el camino por defecto es
> **empaquetar**, y antes de comprometerse hay que comprobar tres cosas: la licencia del
> empaquetado (draw.io se publica como Apache-2.0, hay que confirmar qué implica
> redistribuirla), el peso real que le suma al instalador, y que el modo embebido funcione
> servido desde el esquema propio de Tauri y no desde `https://`.

## 4. El archivo

- **`.drawio`** es la extensión nativa: XML de mxGraph, texto plano, versionable en git.
- **`.drawio.svg`** es la alternativa: un SVG normal —se ve en cualquier visor y se embebe
  en una nota como imagen— que lleva el XML **incrustado** dentro, así que sigue siendo
  editable. Es lo que usa la gente que trabaja draw.io dentro de Obsidian.
- **Queda abierto** cuál de los dos es el formato de guardado. El SVG da vista previa
  gratis; el XML es más simple de escribir y de diferenciar.

En cualquiera de los dos casos, el contenido **no entra al índice de búsqueda**: Mycelium
indexa `.md` y nada más. Vale lo mismo que para `.excalidraw` y `.canvas` — ver
[[ia-framework-vault]] § qué puede haber en el vault.

## 5. Dónde toca (el molde ya existe)

Excalidraw y el canvas ya abrieron el camino de «un segundo tipo de archivo». La lista de
sitios es la misma que documenta [[canvas]] § 7:

| Sitio | Qué hay que hacer |
|---|---|
| `src-tauri/src/archivos.rs` | Que la extensión entre al índice y al árbol |
| `NotaTipo` y el explorador | Un tipo más, con su ícono |
| `lib/iconosDeTipo.ts` | El ícono del tipo, **en un solo lugar** (`FUN-S-11`) |
| `tabsStore` + pestaña | Abrirlo como pestaña propia, con su centinela |
| Menú «Nuevo» | Crear un diagrama vacío |
| Embeds `![[diagrama.drawio]]` | Mostrarlo dentro de una nota |
| Exportación a PDF | Que salga dibujado, no como un hueco |
| Papelera y renombrado | Que se comporte como cualquier otro archivo |

## 6. Criterios de aceptación (borrador)

1. **CA1 — Crear**: desde el menú «Nuevo» del explorador sale un diagrama vacío, con nombre
   editable, en la carpeta donde se pidió.
2. **CA2 — Editar**: al abrirlo se ve el editor de draw.io completo, con sus bibliotecas de
   figuras, dentro de una pestaña normal del área de trabajo.
3. **CA3 — Guardar**: los cambios llegan al archivo del vault. El estado «sin guardar» se ve
   como en una nota, y cerrar la pestaña no pierde trabajo.
4. **CA4 — Sin conexión**: todo lo anterior funciona con la máquina desconectada.
5. **CA5 — En una nota**: `![[diagrama.drawio]]` muestra el diagrama dentro de la nota.
6. **CA6 — Tema**: el editor no desentona con el tema y el modo activos de Mycelium (al
   menos, que siga a claro/oscuro).

## 7. Abierto

- `iframe` remoto o webapp empaquetada (§ 3). **Bloquea todo lo demás.**
- `.drawio` o `.drawio.svg` (§ 4).
- Si el embed en una nota es interactivo o una imagen que al hacer clic abre la pestaña.
- Si aplica también a `web-cloud`. En teoría sí —es frontend—, pero el foco actual es
  desktop y la decisión se toma al implementar. Ver
  [[Diferencias funcionales aceptadas entre versiones]].

## Relacionadas

- [[BACKLOG]] — `FUN-L-20`, su tamaño y por qué va sola.
- [[canvas]] — el molde: el último tipo de archivo que se agregó, y todos los sitios que
  hubo que tocar.
- [[otros-tipos-de-archivo]] — lo que hoy se **ve** sin ser markdown.
- [[ia-framework-vault]] — qué indexa Mycelium y qué solo guarda.
- [[Bandeja de entrada]] — de dónde salió la idea.
- [[Mapa de documentacion]] — índice general.
