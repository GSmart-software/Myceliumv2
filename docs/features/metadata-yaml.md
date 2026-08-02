# Metadatos YAML (`FUN-M-04` · `METADATA-YAML`)

Spec de la interpretación del **frontmatter YAML** de las notas: el bloque entre `---`
al inicio de un archivo deja de ser texto suelto y pasa a ser un conjunto de
**propiedades** (clave → valor) que Mycelium muestra, permite editar e indexa.

Es la base de [[BACKLOG|`FUN-L-03`]] (archivos tabla): sin propiedades consultables no
hay nada que agregar en una tabla.

> [!success] Confirmado en desktop el 2026-08-02 — [[Version 1.2.0]]
> Todo lo que describe esta spec está en `desktop-tauri` y el usuario lo **confirmó en la
> app**: los metadatos YAML funcionan. Queda pendiente el **reflejo a `web-cloud`**.
> El paso a paso de los 12 criterios, con las notas de prueba, está en [[Version 1.2.0]].
> Diferencias con lo especificado, todas por el lado de leer de más antes que descartar
> en silencio: un `#` solo abre comentario si va **precedido de espacio** (así
> `tags: #idea` y `- #idea` son etiquetas), el espacio tras los dos puntos es **opcional**
> (`clave:valor` se lee igual que `clave: valor`), y una lista conserva el estilo que ya
> tenía en el archivo (en bloque sigue en bloque, en línea sigue en línea) en vez de
> normalizarse. El comentario al final de la línea de una propiedad **sí** se conserva al
> editar su valor.

> [!info] Alcance: **desktop primero, reflejo a web después**
> Aplica a las dos versiones por naturaleza (es el formato de las notas, no la capa de
> datos). Se implementa en `desktop-tauri`, **el usuario lo confirma en la app** y recién
> ahí se refleja a `web-cloud` con la receta de [[Reflejar cambios de desktop a web]].
> La parte de **índice diverge de verdad**: en desktop es una tabla SQLite escrita desde
> TS; en web hay que tocar el backend .NET. El resto (parseo, render, panel) es frontend
> compartido.

> [!important] Esto SÍ es funcionalidad nueva
> El usuario puede hacer algo que antes no podía: dar atributos a sus notas y
> consultarlos. Sube **minor**: `1.1.5` → **`1.2.0`** (una sola funcionalidad = un solo
> minor). Ver [[Versionado del sistema]].

---

## Estado de partida

Hoy Mycelium **no interpreta** el bloque. Como el frontmatter es texto común:

- En **lectura** se rompe visualmente: `renderMarkdown` (`lib/markdown.ts`) no tiene
  `remark-frontmatter`, así que el primer `---` sale como línea horizontal y el segundo
  convierte la última línea de metadatos en un **título `<h2>`**.
- En la **vista en vivo** se ve el YAML crudo, sin estilo propio.
- El bloque **entra al índice FTS** (`putContenido` en `lib/db/contenido.ts` indexa el
  texto entero), así que buscar "tags" encuentra cualquier nota que tenga la clave.
- El grafo (`lib/db/grafo.ts`) escanea el texto completo, así que un `[[enlace]]` dentro
  de una propiedad **ya cuenta** como enlace saliente. Los `#tag` del frontmatter no
  cuentan, porque en YAML se escriben sin `#`.
- No hay ninguna dependencia de YAML en `package.json`.

---

## 1. El modelo: qué YAML se soporta

Se adopta el subconjunto de **Propiedades de Obsidian**, para que un vault sea
intercambiable entre las dos apps. Un frontmatter válido para Mycelium es un **mapa
plano** en el que cada valor es uno de estos tipos:

| Tipo | Se escribe | Ejemplo |
|---|---|---|
| Texto | escalar suelto o entrecomillado | `estado: activo` |
| Número | entero o decimal | `prioridad: 3` |
| Casilla | `true` / `false` | `publicado: false` |
| Fecha | `YYYY-MM-DD` | `vence: 2026-08-30` |
| Fecha y hora | `YYYY-MM-DDTHH:mm` (segundos opcionales) | `reunion: 2026-08-30T15:00` |
| Lista | en línea `[a, b]` o en bloque con `- ` | `tags: [proyecto, activo]` |

**Reglas de detección del bloque**

1. Solo cuenta si el archivo **empieza** exactamente con `---` en su primera línea (sin
   espacios delante) y esa línea contiene solo eso.
2. Se cierra en la primera línea posterior que sea exactamente `---` o `...`.
3. Sin cierre, **no hay frontmatter**: el texto es contenido normal (no adivinar).
4. Un `---` que no está en la primera línea es una línea horizontal, como siempre.
5. El bloque vacío (`---` / `---`) es frontmatter válido, sin propiedades.

**Inferencia de tipo**: por el literal, en este orden — casilla, número, fecha/hora,
fecha, lista, texto. Un escalar entrecomillado es **siempre** texto (`version: "1.0"` es
texto, no número). Las claves conocidas (abajo) fuerzan su tipo.

> [!warning] Lo que NO se soporta, y qué hacer con ello
> Mapas anidados, escalares multilínea (`|`, `>`), anclas/alias (`&`/`*`), etiquetas
> (`!!`), listas de mapas, y claves duplicadas.
>
> Cuando el bloque contiene algo de eso, **no se rompe ni se reescribe nunca**: se marca
> como *no soportado*, se muestra el YAML crudo con un aviso ("Mycelium no interpreta este
> frontmatter") y el panel de propiedades queda en **solo lectura** para esa nota. Es
> preferible no tocar los metadatos de alguien antes que reformatearlos mal.

### Claves conocidas

Una sola clave tiene comportamiento en esta unidad:

- **`tags`** — siempre lista de texto (aunque venga como escalar: `tags: idea` → `[idea]`).
  Las etiquetas del frontmatter se **unen** a los `#tag` del cuerpo: son las etiquetas de
  la nota, sin distinguir de dónde salieron. Se aceptan con y sin `#` (`- #idea` = `- idea`).

Dos claves quedan **reservadas**: se parsean y se indexan como cualquier otra, pero **no
tienen comportamiento** todavía. Están reservadas para no darles otro significado después:

- `aliases` — resolver `[[enlaces]]` por alias es una funcionalidad propia (toca la
  resolución de wikilinks, el autocompletado y el grafo). **Fuera de alcance**: se registra
  en el [[BACKLOG]] como continuación.
- `cssclasses` — aplicar clases CSS a la nota. **Fuera de alcance** por lo mismo.

Cualquier otra clave es **libre**: el usuario inventa las que quiera y Mycelium las trata
igual (las muestra, las indexa, las ofrece en el autocompletado).

---

## 2. Parseo: implementación propia, sin dependencia

**Decisión**: `frontend/lib/frontmatter.ts` con un parser propio por líneas, en vez de
`js-yaml` o `remark-frontmatter`.

Tres razones, en orden de peso:

1. **Round-trip**. El panel edita propiedades y hay que **volver a escribir** el bloque.
   Un `dump()` de YAML reordena claves, normaliza comillas y **borra los comentarios**:
   el usuario vería su frontmatter reescrito entero por cambiar un valor. Un parser por
   líneas devuelve la **posición** de cada propiedad, así que editar un valor toca **solo
   esa línea** y todo lo demás queda intacto.
2. **El subconjunto soportado es chico y cerrado** (la tabla de arriba). Lo que no entra,
   no se intenta interpretar — y esa frontera hay que trazarla igual aunque parsee otro.
3. Sin dependencia nueva en el bundle ni en el instalador.

**API mínima** (nombres orientativos, en español como el resto de `lib/`):

```ts
type TipoPropiedad = "texto" | "numero" | "casilla" | "fecha" | "fechaHora" | "lista";

type Propiedad = {
  clave: string;
  tipo: TipoPropiedad;
  valor: string | number | boolean | string[];
  desdeLinea: number;  // líneas 0-based dentro del documento
  hastaLinea: number;  // inclusive; una lista en bloque ocupa varias
};

type Frontmatter =
  | { hay: false; cuerpoDesde: 0 }
  | { hay: true; soportado: true;  props: Propiedad[]; crudo: string; cuerpoDesde: number }
  | { hay: true; soportado: false; motivo: string;     crudo: string; cuerpoDesde: number };

separarFrontmatter(texto: string): Frontmatter
cuerpoDe(texto: string): string           // el markdown sin el bloque
etiquetasDe(texto: string): string[]      // unión de `tags` + los `#tag` del cuerpo

// Edición quirúrgica: devuelven el texto completo con UN cambio mínimo.
ponerPropiedad(texto: string, clave: string, valor: …): string
quitarPropiedad(texto: string, clave: string): string
renombrarPropiedad(texto: string, clave: string, nueva: string): string
```

`ponerPropiedad` sobre una nota **sin** frontmatter crea el bloque al principio del
documento, seguido de una línea en blanco. Sobre una nota con bloque **no soportado**,
lanza (el panel ya está en solo lectura, pero la guarda va en la capa de datos, no solo
en la UI).

> [!tip] Esto merece tests de verdad
> Es lógica pura sobre strings, sin React ni CodeMirror: es lo más barato de testear del
> proyecto y lo que más se va a romper por un caso borde. Añadir
> `frontend/scripts/test-frontmatter.mjs` siguiendo el estilo de
> `frontend/scripts/test-nombres.mjs`, cubriendo como mínimo: sin bloque · bloque vacío ·
> `---` que no está en la primera línea · sin cierre · cierre con `...` · los seis tipos ·
> lista en línea y en bloque · comillas · comentarios preservados al editar · bloque no
> soportado · CRLF.

---

## 3. Qué ve el usuario

### 3.1 Vista de lectura y dividida

El bloque **deja de renderizarse como markdown**. En su lugar, arriba del contenido, una
**tarjeta de propiedades**: una fila por propiedad, con la clave a la izquierda y el valor
formateado a la derecha.

- `renderMarkdown` recibe el **cuerpo**, no el texto completo (`cuerpoDe(texto)`). Con eso
  desaparece solo la línea horizontal y el `<h2>` fantasma.
- La tarjeta se compone aparte y se antepone al HTML del cuerpo.
- **Listas** → una "pastilla" por elemento. Las de `tags` usan la pastilla de etiqueta que
  ya existe (`.mic-tag-pill`) y **navegan igual que un `#tag`** (href `#tag:` — el
  workspace ya intercepta ese esquema).
- **Casillas** → checkbox deshabilitado. **Fechas** → formato local, como `NotePanel`.
- Un `[[enlace]]` en un valor se renderiza como wikilink y navega.
- Frontmatter **no soportado** → bloque de código con el YAML crudo y el aviso.
- Sin frontmatter → no se muestra nada (ni un hueco).

### 3.2 Vista en vivo (`live`)

Mismo diseño, como **widget de bloque** que reemplaza las líneas del frontmatter.

- **El widget es de solo lectura**: no lleva controles, no captura eventos. Se edita en el
  panel (3.3) o escribiendo el YAML a mano. Es una decisión deliberada de riesgo: los
  widgets interactivos dentro de CodeMirror son de donde salieron `DEF-031` y `DEF-037`.
- Poner el cursor **dentro del bloque revela la fuente** (deja de renderizarse), igual que
  las tablas y los callouts. Sacarlo lo vuelve a plegar.
- Decoración de **bloque** → debe venir de un `StateField`, no de un `ViewPlugin`
  (comentado en `livePreview.ts`, y es la trampa de [[CodeMirror y la vista en vivo]]).

> [!danger] `estimatedHeight` es obligatorio
> Un widget de bloque sin `estimatedHeight` desalinea el height-map de CodeMirror y
> reaparecen el gutter corrido, la selección con clic que agarra de más y el scroll roto
> del buscador. Es **exactamente** la causa raíz de `DEF-031`/`DEF-037`. Estimar por
> número de filas, como hace `TableWidget`, y **espaciar con `padding`, nunca con
> `margin`** (CodeMirror no mide los márgenes).

En modo `raw` no se toca nada: se ve el texto tal cual.

### 3.3 Panel de propiedades

Pestaña nueva **PROPIEDADES** en `NotePanel`, junto a GRAFO / SALIENTES / RETRO. Es el
lugar donde se editan.

```
┌─ editor ──────────┬─ NotePanel ────────┐
│ ---               │ PROPIEDADES GRAFO …│
│ tags: [a, b]      │ ┌────────────────┐ │
│ estado: activo    │ │ tags   [a][b]+ │ │
│ ---               │ │ estado activo  │ │
│ # Mi nota         │ │ + Añadir       │ │
│ Texto…            │ └────────────────┘ │
└───────────────────┴────────────────────┘
```

- Una fila por propiedad: **icono del tipo** + clave (editable) + editor de valor según el
  tipo (texto, número, casilla, fecha, o pastillas con `+`/`×` para las listas).
- **Añadir propiedad**: pide clave y tipo, con **autocompletado de las claves que ya
  existen en el vault** (viene del índice, § 4). Es lo que evita que el mismo atributo
  termine como `estado`, `Estado` y `status`.
- **Quitar** y **renombrar** una propiedad.
- Si no hay frontmatter, el panel muestra solo "Añadir propiedad" y el bloque se crea al
  usarla.
- Frontmatter **no soportado** → solo lectura, con el motivo a la vista.

**Cómo escribe el panel** — esto es lo delicado:

> [!warning] El panel NO puede escribir el archivo por su cuenta
> Si el panel llamara a `putContenido` mientras el editor tiene el documento montado, el
> siguiente autoguardado del editor (debounce de 800 ms sobre su propio estado)
> **pisaría** el cambio. Y el usuario no podría deshacerlo con `Ctrl+Z`.
>
> El panel debe **despachar una transacción sobre el CodeMirror de esa nota** y dejar que
> el flujo de guardado normal haga el resto. `NotePanel` vive dentro del editor de su nota,
> así que la vista siempre existe; `lib/editor/viewRegistry.ts` es el camino para
> obtenerla. La transacción cambia **solo el rango de la propiedad** (de ahí las posiciones
> que devuelve el parser), así que el undo es de una sola acción y el scroll y el cursor no
> se mueven.

Al revés, editar el YAML a mano en el editor **actualiza el panel** (ya se re-renderiza
con el contenido; alcanza con derivar las propiedades del texto actual, sin estado propio
duplicado).

---

## 4. Índice: propiedades consultables

Tabla nueva en el índice SQLite del vault (`lib/db/indexer.ts`, constante
`ESQUEMA_INDICE`):

```sql
CREATE TABLE IF NOT EXISTS propiedades (
  nota_id TEXT NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  clave   TEXT NOT NULL,
  valor   TEXT NOT NULL,   -- normalizado a texto; las listas van a fila por elemento
  tipo    TEXT NOT NULL,
  orden   INTEGER NOT NULL -- posición dentro de la lista (0 si es escalar)
);
CREATE INDEX IF NOT EXISTS idx_propiedades_nota  ON propiedades(nota_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_clave ON propiedades(clave, valor);
```

- **Una fila por elemento** de lista: así `WHERE clave='tags' AND valor='activo'` funciona
  sin `LIKE`, que es lo que va a necesitar `FUN-L-03`.
- Se reescribe (delete + insert por nota) en los **dos** caminos que ya reindexan:
  `putContenido` (`lib/db/contenido.ts`) y el indexado del vault (`indexarVault`).
- La tabla es nueva, así que `CREATE TABLE IF NOT EXISTS` alcanza para los índices ya
  creados: no hace falta el `ALTER` defensivo (ver el comentario de `crearEsquemaIndice`).
  Sí hay que poblarla para los vaults existentes → **forzar una reindexación** de las notas
  cuyo `mtime` no cambió. Lo más simple y honesto: si la tabla está vacía y hay notas,
  reindexar todo una vez.

**Lo que cambia en lo que ya existe**

- **FTS**: pasa a indexar el **cuerpo** más los **valores** de las propiedades, sin las
  claves ni la sintaxis YAML. Buscar "activo" sigue encontrando la nota; buscar "tags" deja
  de devolver todas las notas que tienen esa clave. Los `snippet()` dejan de mostrar YAML.
- **Etiquetas del grafo**: `lib/db/grafo.ts` toma las etiquetas de `etiquetasDe(texto)`
  (unión frontmatter + cuerpo) en vez de solo `TAG_RE` sobre el texto. Los grupos de color
  por etiqueta empiezan a ver las del frontmatter.
- **Enlaces**: `WIKILINK_RE` sigue corriendo sobre el **texto completo**, así que un
  `[[enlace]]` en una propiedad sigue contando como enlace saliente. Es el comportamiento
  actual y el correcto: **no cambiarlo**.

**Consulta**: `lib/db/propiedades.ts` con `propiedadesDeNota(notaId)`,
`clavesDelVault(vaultId)` (para el autocompletado) y `notasConPropiedad(clave, valor?)`.

**En el buscador**: se acepta el filtro `clave:valor` (p. ej. `estado:activo`), que
restringe por la tabla `propiedades`. `tag:` — que **ya existe** en `lib/search.ts` — pasa
a contemplar también las etiquetas del frontmatter. Con esto las propiedades quedan
consultables de verdad y no solo guardadas.

---

## 5. Criterios de aceptación

1. Una nota que empieza con `---` / `tags: [a, b]` / `estado: activo` / `---` muestra en
   **lectura** una tarjeta de propiedades: ni línea horizontal ni título fantasma.
2. La misma nota en **vista en vivo** muestra la tarjeta; al poner el cursor dentro
   aparece el YAML crudo y al salir vuelve a plegarse.
3. Con documentos largos **con y sin** frontmatter: el gutter queda alineado, el clic
   selecciona donde se hace clic y el buscador del archivo salta a la coincidencia
   correcta (la no-regresión de `DEF-031`/`DEF-037`).
4. La pestaña PROPIEDADES lista las propiedades con su tipo; cambiar un valor ahí modifica
   **solo** esa línea del archivo, y `Ctrl+Z` en el editor lo deshace en un paso.
5. Añadir una propiedad a una nota **sin** frontmatter crea el bloque al principio, sin
   comerse la primera línea del contenido.
6. Editar el YAML a mano refleja el cambio en el panel.
7. Un frontmatter con un mapa anidado se muestra crudo con su aviso, el panel queda en
   solo lectura y **el archivo no se modifica** al abrirlo, editarlo y guardarlo.
8. Las etiquetas de `tags:` aparecen como pastillas, navegan como un `#tag` y salen en la
   búsqueda `tag:`.
9. Buscar el valor de una propiedad (`activo`) encuentra la nota; buscar `estado:activo`
   la encuentra; buscar `tags` ya **no** devuelve todas las notas que tienen esa clave.
10. Un `[[enlace]]` dentro de una propiedad sigue contando en SALIENTES y en el grafo.
11. Reabrir la app con un vault que ya existía: las propiedades aparecen indexadas sin que
    el usuario tenga que tocar nada.
12. Un archivo con CRLF no se convierte a LF al editar una propiedad.

---

## 6. Versionado

`1.1.5` → **`1.2.0`**. Una funcionalidad = un minor, y el patch vuelve a `0`. Los cuatro
archivos de siempre: `frontend/lib/version.ts` (con su entrada en el comentario del
historial), `frontend/package.json`, `frontend/src-tauri/Cargo.toml` y
`frontend/src-tauri/tauri.conf.json`. Ver [[Versionado del sistema]].

> [!important] Esta vez **sí** cambia `FRAMEWORK_IA_VERSION`
> El framework de IA le dice hoy a la IA lo contrario de lo que va a ser cierto:
> `lib/ia/framework.ts` afirma "el frontmatter YAML todavía no se interpreta (se ve como
> texto)" en la regla dura 6 del `CLAUDE.md` generado y en la skill del vault. Al entrar
> esta funcionalidad hay que **subir `FRAMEWORK_IA_VERSION` de `1.2.1` a `1.3.0`** y
> reescribir esos dos pasajes: qué subconjunto se soporta, que `tags:` cuenta como
> etiquetas y que las propiedades se pueden consultar. Ver [[ia-framework-vault]].

## 7. Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json`
- `node frontend/scripts/test-frontmatter.mjs` (el script nuevo del § 2)
- No hace falta `cargo check`: no se toca Rust.
- Prueba manual del usuario sobre los 12 criterios, con **una nota de prueba que tenga los
  seis tipos** y otra con YAML no soportado.

> [!warning] `tsc` verde no prueba comportamiento
> Ver [[Verificar antes de integrar]]. Lo visible lo confirma el usuario en la app.

## 8. Documentación a actualizar

- [[BACKLOG]] — `FUN-M-04` a implementado; altas de las continuaciones que esta spec deja
  fuera a propósito: **resolver `[[enlaces]]` por `aliases`** y **aplicar `cssclasses`**.
- [[Arquitectura de Mycelium]] — el modelo de contenido dice "el frontmatter YAML todavía
  **no se interpreta**"; pasa a describir el subconjunto soportado.
- [[Estado del proyecto]] — deja de ser el próximo paso natural; `FUN-L-03` queda
  desbloqueado.
- [[Versionado del sistema]] y `docs/estado/Version 1.2.0.md` — release, con la estructura
  de [[Version 1.1.5]].
- [[RAMAS]] — anotar qué archivos nuevos son compartidos (`lib/frontmatter.ts`, el panel)
  y cuáles divergen para el reflejo (`lib/db/*`, y en web el backend .NET).
- [[Aprendizajes tecnicos]] — si aparece una causa raíz nueva (sobre todo si el widget
  vuelve a desalinear el height-map).

## Relacionadas

- [[BACKLOG]] — `FUN-M-04` y su continuación `FUN-L-03` (archivos tabla).
- [[CodeMirror y la vista en vivo]] — el height-map y por qué el widget es de solo lectura.
- [[Capa de datos del desktop]] — dónde vive el índice que gana la tabla `propiedades`.
- [[ia-framework-vault]] — los templates que afirman que el frontmatter no se interpreta.
- [[Reflejar cambios de desktop a web]] — cómo llegará a `web-cloud`.
- [[Verificar antes de integrar]] — qué debe quedar verde.
- [[Mapa de documentacion]] — índice general.
