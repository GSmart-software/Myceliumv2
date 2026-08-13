# Canvas: notas en el espacio (`FUN-L-18` · `FILES-CANVAS`)

Spec de un tipo de archivo nuevo —el **canvas**— para disponer notas y textos en un lienzo
infinito, conectarlos con flechas, y que los `[[enlaces]]` que se escriban dentro **funcionen
de verdad**.

> [!info] De dónde sale
> De preguntar si se podían poner referencias en un dibujo de Excalidraw. Se puede, pero
> **por efecto colateral**: el grafo escanea el contenido de todos los archivos sin mirar el
> tipo, así que un `[[Algo]]` escrito como texto en un dibujo acaba en el JSON y cuenta como
> arista — pero no es clicable, nadie lo diseñó, y cualquiera podría filtrar el grafo por
> `tipo = 'markdown'` mañana y romperlo sin enterarse.
>
> El canvas es la respuesta hecha a propósito.

---

## 1. En qué se diferencia de Excalidraw

Conviene que quede claro desde el principio, porque a primera vista hacen lo mismo
(rectángulos, texto, flechas):

| | **Excalidraw** | **Canvas** |
|---|---|---|
| Qué manipula | trazos y formas | **contenido** |
| Una caja es… | un rectángulo dibujado | una **tarjeta**: markdown, o una nota del vault |
| El texto es… | texto dibujado | markdown, con `[[enlaces]]` que navegan |
| Para qué sirve | dibujar un diagrama | **pensar con las notas puestas en el espacio** |

Excalidraw se queda como está. No se reemplaza ni se toca.

---

## 2. El formato: `.canvas` (JSON Canvas)

Se adopta el formato **JSON Canvas**, el mismo que usa Obsidian, para que un canvas hecho en
Mycelium se abra en Obsidian y al revés. Es el mismo criterio que ya se tomó en
[[metadata-yaml]], donde se adoptó el subconjunto de *Propiedades* de Obsidian
explícitamente **para que el vault sea intercambiable**.

```json
{
  "nodes": [
    { "id": "a", "type": "text", "text": "Idea suelta, ver [[BACKLOG]]",
      "x": 0, "y": 0, "width": 240, "height": 100 },
    { "id": "b", "type": "file", "file": "docs/BACKLOG.md",
      "x": 320, "y": 0, "width": 400, "height": 300 }
  ],
  "edges": [
    { "id": "e1", "fromNode": "a", "fromSide": "right",
      "toNode": "b", "toSide": "left" }
  ]
}
```

> [!success] Verificado contra la especificación publicada (2026-08-08)
> Se contrastó antes de escribir código, como pedía esta nota. El ejemplo de arriba era
> correcto; lo que faltaba y ahora está implementado: `subpath` en los nodos `file`,
> `background`/`backgroundStyle` en los `group`, `label` y `color` en las aristas, y los
> **valores por defecto** de los extremos — `fromEnd` es `none` y `toEnd` es `arrow`, así
> que una flecha normal no necesita escribirlos. El color es un hex (`"#FF0000"`) o un
> preset `"1"`–`"6"`.

---

## 3. Los elementos

Los tres que se pidieron, más uno que el formato regala:

| Elemento | Nodo | Qué es |
|---|---|---|
| **Texto suelto** | `text` sin marco visible | markdown, sin caja alrededor |
| **Tarjeta con texto** | `text` | markdown dentro de una caja |
| **Tarjeta de nota** | `file` | **es** una nota del vault, con su contenido en vivo |
| Flecha | `edge` | une dos nodos por un lado concreto |

### La tensión con "texto suelto"

> [!important] JSON Canvas no tiene texto sin caja — hay que decidirlo
> Todos sus nodos de texto son tarjetas. Para dar "texto suelto" hay dos caminos:
>
> **(a) Una tarjeta sin fondo ni borde** — sigue siendo un `text` válido; Mycelium lo dibuja
> sin marco. En Obsidian se vería como una tarjeta normal: se degrada bien y **no rompe la
> interoperabilidad**.
>
> **(b) Salirse del formato** con un tipo propio. Obsidian lo ignoraría o lo rompería.
>
> **Se elige (a).** El "texto suelto" es una decisión de presentación de Mycelium, no un
> tipo de dato nuevo. Queda registrado por si en algún momento se quiere revisar.

### La tarjeta de nota es la nota

Una tarjeta `file` **no es una copia**: muestra el archivo real. Editarla edita la nota, y
editar la nota se ve en el canvas. Es lo que convierte el canvas en una forma de mirar la
memoria y no en un tablero aparte.

---

## 4. Los `[[enlaces]]` — el punto de todo esto

Dentro de una tarjeta de texto se escribe markdown, así que se escriben `[[enlaces]]`. Y
tienen que **funcionar como en una nota**: resolver, avisar si el destino no existe,
autocompletar al escribir `[[`, y **navegar al hacer clic**.

Eso significa reutilizar `resolveWikilink` (`lib/editor/wikilink.ts`) y el renderizador
(`lib/markdown.ts`), no reimplementar nada. Es exactamente lo que Excalidraw no puede dar.

---

## 5. Qué llega al grafo

**Decisión del usuario: las flechas son disposición visual y no cuentan como conexión.**

Es la opción sin ambigüedad: una conexión del grafo se crea de **una sola** manera —un
`[[enlace]]`— y no hay que resolver qué pasa cuando una flecha y un enlace se contradicen.

| Elemento del canvas | ¿Arista en el grafo? |
|---|---|
| `[[enlace]]` en una tarjeta de texto | **Sí** |
| Tarjeta de nota (`file`) | **Sí** — el canvas referencia esa nota (ver abajo) |
| Flecha entre dos tarjetas | **No** |

> [!note] Lo de la tarjeta de nota es interpretación mía — conviene confirmarlo
> El usuario decidió sobre las **flechas**. Una tarjeta `file` no es una flecha: es una
> referencia explícita a una nota, equivalente a un embed `![[nota]]`, que hoy **sí** cuenta.
> Por coherencia debería contar.
>
> Ojo con el detalle técnico: el `.canvas` guarda `"file": "docs/BACKLOG.md"` —una **ruta**,
> no un `[[wikilink]]`—, así que `WIKILINK_RE` no lo encuentra. Que cuente **exige tocar
> `buildVaultGraph`** para que lea los nodos `file` de los `.canvas`. No sale gratis.

---

## 6. Cómo se construye

Un lienzo infinito con desplazamiento, zoom, nodos arrastrables y aristas que se enganchan a
los lados es mucho trabajo desde cero, y es un problema resuelto.

**Recomendación: una librería de nodos y aristas** (React Flow / `@xyflow/react` es la
candidata natural: MIT, y permite que cada nodo sea un componente React propio — que es
justo lo que hace falta para que una tarjeta renderice markdown o embeba el editor de una
nota).

La alternativa es construirlo a mano, y convierte esto de `L` en `XL` sin aportar nada
distintivo: el valor de la funcionalidad está en las tarjetas y los enlaces, no en el
motor de pan y zoom.

> [!warning] Es una dependencia nueva y hay que evaluarla antes
> El proyecto es cuidadoso con esto (`FUN-M-04` y `FUN-M-03` se hicieron **sin** agregar
> dependencias). Acá probablemente se justifique, pero hay que mirar el peso que suma al
> instalador y comprobar que funciona dentro del WebView.

---

## 7. Puntos de enganche en el código

Excalidraw es el molde: ya existe un segundo tipo de archivo y todos los sitios que hay que
tocar están señalados por él.

| Dónde | Qué cambia |
|---|---|
| `src-tauri/src/archivos.rs` | La extensión `.canvas` entra al índice (hoy solo `.md` y `.excalidraw`) |
| `lib/db/types.ts` | `NotaTipo` gana `"canvas"` |
| `components/panes/EditorPane.tsx` · `explorer/SidebarNoteView.tsx` | Renderizar el editor de canvas según el tipo |
| `components/explorer/ExplorerPanel.tsx` | Icono propio en el árbol |
| `lib/db/grafo.ts` | Leer los nodos `file` de los `.canvas` (§ 5) |
| `lib/db/notas.ts` | Crear un `.canvas` vacío |

El contenido se guarda en `contenidos` como el resto, y se escribe con `putContenido`: no
hace falta tabla nueva.

---

## 8. Criterios de aceptación

1. Se puede crear un canvas desde el explorador; aparece con icono propio.
2. Se pueden añadir texto suelto, tarjetas de texto y tarjetas de nota; y flechas entre ellas.
3. El lienzo se desplaza y hace zoom; los nodos se arrastran y se redimensionan.
4. Un `[[enlace]]` escrito en una tarjeta **navega al hacer clic**, avisa si el destino no
   existe y autocompleta al escribir `[[`.
5. Una tarjeta de nota muestra el contenido **real**; editarla cambia el archivo, y cambiar
   el archivo se refleja en el canvas.
6. Los `[[enlaces]]` de las tarjetas aparecen en el grafo, en SALIENTES y en los retroenlaces.
7. Una flecha **no** crea ninguna arista en el grafo.
8. El archivo guardado es JSON Canvas válido y **Obsidian lo abre** mostrando lo mismo.
9. Un `.canvas` creado en Obsidian se abre en Mycelium sin perder nada.
10. Borrar una nota que estaba en un canvas no rompe el canvas: la tarjeta avisa de que el
    destino ya no existe.
11. El canvas se abre como pestaña normal: se divide, se ancla en el panel lateral y
    persiste al reiniciar.

---

## 9. Lo que se implementó (2026-08-08)

| Pieza | Dónde |
|---|---|
| Formato: parser, serializador y geometría | `frontend/lib/canvas.ts` (puro, 26 tests) |
| El lienzo | `frontend/components/canvas/CanvasView.tsx` |
| Tipo de archivo | `NotaTipo`, `extDeTipo`, `archivos.rs`, explorador (ícono e íconos de arrastre), `EditorPane`, `SidebarNoteView` |
| Qué llega al grafo | `lib/db/grafo.ts` lee los canvas con `referenciasDe()` |

### Sin librería de nodos — se cambió la recomendación de la spec

La § 6 recomendaba React Flow. **Se construyó a mano**, por tres razones concretas:

1. El proyecto **ya tiene esta maquinaria**: `MiniGraph.tsx` hace pan, zoom, arrastre y
   hover por su cuenta desde hace versiones.
2. `FUN-M-04` y `FUN-M-03` se hicieron sin sumar dependencias, y es una preferencia
   sostenida del proyecto.
3. Lo que hace falta acá está **acotado**: cajas rectangulares, cuatro anclas fijas y
   beziers. El miedo al `XL` era construir un editor de nodos de propósito general.

Y una razón de método: no puedo probar React Flow dentro del WebView de Tauri sin correr la
app, así que la alternativa era meter en el instalador una dependencia sin verificar.

> [!note] Si el canvas crece (agrupar, selección múltiple, alineado), conviene revisarlo
> La decisión se tomó para *esta* unidad de trabajo, no para siempre.

### La decisión que gobierna el módulo: no perder nada ajeno

Un `.canvas` de Obsidian puede traer nodos `link` y `group`, colores, `subpath`,
`background`… Mycelium todavía no los **edita**, pero guardarlo sin ellos le borraría
trabajo al usuario en silencio. Por eso el parser **conserva el objeto crudo** de cada nodo
y arista, y al serializar escribe encima solo los campos que maneja. Incluso una extensión
futura del formato sobrevive a una edición — hay un test que lo fija.

### Sobre la duda de la § 5, resuelta

La spec dejaba anotado que «que la tarjeta de nota cuente es interpretación mía, conviene
confirmarlo». Se implementó **que sí cuente**, por coherencia con los embeds, y con el
trabajo que la propia nota advertía: `grafo.ts` no busca wikilinks en el JSON crudo —eso
encontraría también los de las rutas y los escapes— sino que **entiende el formato** y saca
los `[[enlaces]]` de las tarjetas de texto y las rutas de las tarjetas de nota. Las flechas
siguen sin contar.

### Lo que quedó fuera de esta unidad

- **Crear** nodos `link` y `group`: se leen, se dibujan y se conservan, pero no hay botón.
- **Web**: es frontend puro y `lib/canvas.ts` es compartible, pero el tipo de archivo toca
  la capa de datos de cada rama. Queda como reflejo pendiente.
- Deshacer con <kbd>Ctrl</kbd>+<kbd>Z</kbd> dentro del lienzo, selección múltiple y alineado.

---

## 10. Lo que NO entra

- **Que las flechas sean conexiones del grafo.** Decidido: son visuales.
- **Nodos `link`** (una URL como tarjeta) y **`group`** (agrupar nodos): están en el formato
  y se pueden leer sin romper nada, pero crearlos no entra en esta unidad.
- **Edición colaborativa** del canvas.
- **Convertir un Excalidraw en canvas** o al revés.

## 11. Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json` · `cargo check` (se toca Rust).
- **La prueba que más importa es la interoperabilidad**: crear un canvas en Mycelium, abrirlo
  en Obsidian, modificarlo ahí, y volver a abrirlo en Mycelium. Si el formato está mal
  interpretado, se ve enseguida.
- Un canvas con muchas tarjetas de nota: comprobar que no se relentiza (cada tarjeta lee un
  archivo).

## 12. Documentación a actualizar

- [[BACKLOG]] — `FUN-L-18`.
- [[Arquitectura de Mycelium]] — el modelo de contenido gana un tercer tipo de archivo.
- [[ia-framework-vault]] — la IA debería saber que existen los `.canvas` y qué son; sube
  `FRAMEWORK_IA_VERSION`.
- Nota de release cuando salga.

## Relacionadas

- [[metadata-yaml]] — el precedente de adoptar un formato de Obsidian por interoperabilidad.
- [[BACKLOG]] — `FUN-L-11` (ver otros tipos de archivo) toca el mismo terreno: añadir tipos.
- [[Arquitectura de Mycelium]] — el modelo de contenido.
- [[Mapa de documentacion]] — índice general.
