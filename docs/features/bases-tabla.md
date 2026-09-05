# Bases: el vault como tabla consultable (`FUN-L-03` · `FILES-BASES-TABLA`)

Spec de un tipo de archivo nuevo —la **base**— que **agrega** notas del vault y las
muestra en una tabla, con filtros por metadatos y columnas configurables. Es la
continuación natural de [[metadata-yaml]]: aquella hizo que las propiedades existieran y
se pudieran consultar; esta las convierte en una vista.

> [!info] Estado
> Spec escrita el 2026-08-08. Decisiones tomadas por el usuario: **formato `.base` de
> Obsidian**, tabla de **solo lectura**, e implementación **en las dos versiones a la vez**.

---

## 1. El formato: `.base` de Obsidian

Se adopta el formato de las **Bases** de Obsidian. Es la tercera vez que el proyecto elige
interoperabilidad sobre formato propio —antes fue el subconjunto de *Propiedades* en
[[metadata-yaml]] y JSON Canvas en [[canvas]]— y por el mismo motivo: **el vault tiene que
seguir siendo intercambiable**. Una base hecha en Mycelium se abre en Obsidian y al revés.

El esquema se verificó contra la documentación publicada antes de escribir esta spec, no
de memoria (es la trampa que [[canvas]] dejó anotada):

```yaml
filters:
  and:
    - file.inFolder("Proyectos")
    - estado != "archivado"

properties:
  estado:
    displayName: Estado

views:
  - type: table
    name: Activos
    limit: 50
    order:
      - file.name
      - estado
      - prioridad
    sort:
      - property: prioridad
        direction: DESC
```

### Qué se soporta, y qué NO

El lenguaje completo de Bases incluye **fórmulas** (`(price / age).toFixed(2)`), métodos
encadenados sobre listas, fechas y objetos, y semántica de JavaScript. Implementarlo entero
no es un `L`: es un intérprete de expresiones, y sería un `XL` por sí solo.

Se implementa un **subconjunto cerrado**, con la misma política que ya se usó para el
frontmatter: *lo que cae fuera no se interpreta ni se adivina, se declara*.

| | Soportado en v1 |
|---|---|
| Claves de nivel superior | `filters`, `views`, `properties` (solo `displayName`) |
| Vistas | `type: table` |
| Combinadores | `and`, `or`, `not` (anidables) |
| Comparadores | `==`, `!=`, `>`, `<`, `>=`, `<=` |
| Funciones de archivo | `file.hasTag(…)`, `file.inFolder(…)`, `file.hasProperty(…)` |
| Métodos de valor | `.isEmpty()`, `.contains(…)`, `.startsWith(…)`, `.endsWith(…)` |
| Campos de archivo | `file.name`, `file.path`, `file.folder`, `file.ext`, `file.ctime`, `file.mtime`, `file.size`, `file.tags` |
| Propiedades | `note.<clave>` y `<clave>` a secas |

Fuera de v1: `formulas`, `summaries`, `groupBy`, las vistas `cards`/`list`/`map`, y
cualquier método no listado. **No fallan en silencio**: ver § 4.

---

## 2. La decisión que gobierna el diseño: un filtro que no se entiende NO se ignora

Es la regla más importante de esta spec, y la que separa una tabla en la que se puede
confiar de una que miente.

Si una base filtra con una expresión que Mycelium no sabe evaluar, hay tres salidas
posibles y dos son incorrectas:

| Salida | Qué pasa |
|---|---|
| Ignorar el filtro y mostrar el resto | Dentro de un `and`, **ensancha** el resultado: aparecen notas que deberían estar ocultas |
| Descartar las filas que no se pueden decidir | Dentro de un `or`, **estrecha**: desaparecen notas que deberían salir |
| **Negarse a evaluar la vista** | La tabla no muestra un resultado a medias haciéndolo pasar por completo |

Se toma la tercera. Una vista con un filtro no soportado muestra **el motivo y la
expresión exacta** que no se entendió, y un botón «Ver sin filtrar» que enseña las filas
dejando claro, con un aviso permanente, que el filtro no se aplicó.

> [!danger] Por qué esto no es exceso de celo
> Una tabla es una herramienta de decisión: se mira para saber qué queda por hacer. Una
> fila de más o de menos no se nota —no hay nada que la delate— y contamina la decisión.
> Un error visible es infinitamente preferible a un resultado plausible y equivocado.

Lo mismo con las vistas: una `type: cards` no se dibuja como tabla «aproximada», se
declara no soportada y se ofrece abrir el archivo como texto.

---

## 3. Arquitectura: el lenguaje vive en UN solo sitio

La restricción que más forma le da a la implementación es que esto va **en las dos
versiones**, y las capas de datos divergen (SQLite local vs D1 + backend .NET).

La tentación sería traducir los filtros a SQL. Sería un error: obligaría a escribir el
**mismo intérprete dos veces**, en TypeScript y en C#, y a mantenerlos sincronizados para
siempre. Ya se sabe lo que cuesta eso — [[Version 1.1.0 de web]] tuvo que portar el parser
de frontmatter a C# justamente porque el índice no se podía compartir, y ahí quedó anotado
que las reglas tienen que coincidir *hasta en los casos raros*.

Así que el filtrado **no baja a la base de datos**:

```
                    ┌─────────────────────────────┐
  lib/bases.ts      │  parser + evaluador, PURO   │  ← uno solo, compartido
  (sin imports)     │  y sin dependencias         │
                    └──────────────┬──────────────┘
                                   │ se alimenta de
                    ┌──────────────┴──────────────┐
                    │  GET /vaults/{id}/tabla     │  ← lo único que diverge
                    └──────┬───────────────┬──────┘
                           │               │
              desktop: SQLite local   web: D1 + blobs
```

`GET /vaults/{id}/tabla` devuelve, por nota, todo lo que el evaluador necesita: `id`,
`nombre`, `ruta`, `carpeta`, `ext`, `ctime`, `mtime`, `size`, `tags[]` y sus propiedades.
Es la **única** pieza que se implementa dos veces, y es una consulta, no lógica.

> [!tip] Esto abarata «las dos a la vez»
> El intérprete —que es el 80% del trabajo y el 100% del riesgo de divergencia— se escribe
> una vez y se prueba una vez. Hacer las dos versiones cuesta poco más que hacer una.

`lib/bases.ts` es **puro y sin imports**, igual que `lib/frontmatter.ts` y `lib/esporas.ts`,
para poder probarlo headless con el patrón de `scripts/test-frontmatter.mjs`.

### Las etiquetas

`file.tags` son las del frontmatter **más** los `#tag` del cuerpo, igual que en el grafo
(lo resuelve `etiquetasDe`). En desktop salen del índice local; en web hay que leer los
blobs, que es exactamente lo que `GET /vaults/{id}/grafo` ya hace hoy. Se acepta ese coste
por consistencia con lo que ya existe; materializar las etiquetas en el índice es una
mejora posterior que beneficiaría a los dos endpoints a la vez.

---

## 4. Comportamiento

### Crear y abrir

Una base es un archivo más del vault: aparece en el explorador, se renombra, se mueve, se
manda a la papelera. Se crea desde el **botón de la barra del explorador** (crea en la
carpeta activa) o desde «Nueva base» en el clic derecho de una carpeta (crea en esa).

Tiene **ícono propio** en el árbol: markdown, dibujo y base se distinguen de un vistazo.

Al abrirla, el pane muestra la tabla. Si tiene varias vistas, una pestaña por vista.

### Editar la base

La tabla es de solo lectura respecto de **las notas**; lo que sí se edita es **la base**,
que es la definición de la consulta. Tres controles en la cabecera:

| Control | Qué hace |
|---|---|
| **Filtros** | Condiciones `propiedad · operador · valor` en grupos anidables; cada grupo une por «todas» (`and`) o «alguna» (`or`), y tanto una condición como un grupo entero se pueden **negar** (ver abajo) |
| **Columnas** | Casillas con los campos del archivo y todas las claves de propiedad del vault |
| **Fuente** | El YAML crudo, editable. <kbd>Ctrl</kbd>+<kbd>S</kbd> guarda |

> [!danger] Los controles solo aparecen si Mycelium entiende el archivo ENTERO
> Escriben el YAML **regenerándolo desde el modelo**, así que lo que el modelo no
> represente desaparecería al guardar: `formulas`, `groupBy`, `summaries`, un filtro
> anidado. Sería perder trabajo por haber pulsado un botón.
>
> Por eso `motivosNoEditable()` audita el archivo y, si encuentra algo, **deshabilita los
> controles con el motivo** y deja solo la edición de la fuente — que no reescribe nada.
> El mismo criterio, un escalón más abajo: el constructor de filtros se declara incapaz
> (`arbolDeFiltro()` devuelve `null`) ante una expresión que no sabe representar, en vez
> de enseñar una versión simplificada que al guardar destruiría el original. Lo que
> cambió con `FUN-M-27` es **dónde cae esa línea**, no que exista: los anidamientos y el
> `not` pasaron a ser representables, así que ya no la disparan.

### El constructor de filtros — `FUN-M-27` · `FUN-S-16` · `DEF-080`

El primer constructor armaba **una lista plana** unida toda por `and` o toda por `or`. El
motor nunca tuvo esa limitación —`Filtro` tiene `and`, `or` y `not`, y `evaluar` los
resuelve desde el día uno—: la limitación era de la interfaz, y dejaba fuera cosas tan
corrientes como «los que **no** empiezan por X» o «A y (B o C)».

Se reemplazó por un **árbol**, porque el filtro lo es:

```ts
type NodoFiltro =
  | { tipo: "grupo"; combinador: "and" | "or"; negado: boolean; hijos: NodoFiltro[] }
  | { tipo: "cond";                            negado: boolean; cond: Condicion };
```

`arbolDeFiltro()` lee el YAML a este árbol y `filtroDeArbol()` lo devuelve. La UI
(`components/bases/FiltrosBuilder.tsx`) es recursiva por la misma razón que el dato: un
grupo dibuja sus condiciones y sus grupos hijos, con el mismo componente.

Tres decisiones que no son obvias:

- **`not` de un solo hijo es una marca, no un nivel.** Para quien filtra, «no es activo»
  es **una** condición, no dos anidadas. Al leer, un `not` con un único hijo se colapsa en
  el `negado` de ese hijo; al escribir, se vuelve a envolver. Un `not` de varios hijos sí
  es un grupo negado, porque niega su conjunción.
- **La guarda sigue en pie.** `arbolDeFiltro()` devuelve `null` ante cualquier expresión
  fuera del subconjunto representable (`file.hasTag("a", "b")`, por ejemplo). Es la misma
  regla del § 2: antes que enseñar una versión simplificada que al guardar destruiría el
  original, el constructor se declara incapaz.
- **Lo incompleto se conserva en pantalla (`DEF-080`).** Una condición sin valor **no se
  escribe en el archivo** —un filtro a medias en disco cambiaría lo que la tabla muestra y
  lo que otra app lee— pero **tampoco se borra de la pantalla** mientras se la termina de
  armar. Los dos lados consultan la misma función, `condicionAplicable()`: si la regla
  viviera duplicada, el constructor perdería justo lo que el archivo descarta.

  > [!warning] Acá NO va `opacity`
  > La marca de «incompleta» es un **borde punteado**, no una atenuación, y por dos
  > motivos independientes. Uno de producto: atenuar la fila apaga también el campo de
  > valor que el usuario está tecleando, que es lo último que conviene volver ilegible.
  > Uno técnico: `opacity` **compone todo el subárbol**, y de eso no escapa ni un
  > `position: fixed` — el buscador de campos se veía transparente por heredar la
  > atenuación de su fila. Está también en [[Aprendizajes tecnicos]].

**El buscador de campos** (`FUN-S-16`) es el otro cambio del constructor. Un `<select>`
alcanza con cinco propiedades y deja de alcanzar con cincuenta: hay que recorrer la lista
con la vista. Se dibuja a mano —la lista de un `<select>` la pinta el navegador fuera del
documento y no admite un campo de texto adentro— siguiendo el patrón ya probado de
`SugerenciasClave` (`DEF-077`): input que filtra sin acentos ni mayúsculas, ↑/↓ para
moverse, <kbd>Enter</kbd> elige, <kbd>Esc</kbd> cierra, el clic se atiende en `mousedown`
para llegar antes que el `blur`. Va en un **portal colgado del `body`**, como
`GraphOptionsMenu` (`DEF-053`): así no depende de la opacidad, el `transform` ni el
`overflow` de ningún ancestro.

### La tabla

- Una fila por nota; una columna por entrada de `order`. Sin `order`, solo el nombre.
- La cabecera usa `displayName` si `properties` lo define; si no, la clave tal cual.
- Los valores se pintan **con el mismo lenguaje visual que la tarjeta de propiedades** de
  [[metadata-yaml]]: casillas como casilla, fechas en formato local, listas como píldoras,
  y las etiquetas siguen siendo clicables.
- Clic en una fila → abre la nota. Es una pestaña de previsualización, como en el
  explorador.
- Ordenar por una columna desde su cabecera. El orden inicial sale de `sort`.
- `limit` recorta las filas y se dice cuántas se ocultaron; nunca se recorta en silencio.

### Estados

| Situación | Qué se ve |
|---|---|
| Ninguna nota casa | «Ninguna nota cumple los filtros», con los filtros a la vista |
| Un filtro no se entiende | El motivo, la expresión, y «Ver sin filtrar» (§ 2) |
| El YAML no parsea | El error del parser y el archivo como texto |
| Vista no soportada | El tipo pedido y por qué; el resto de las vistas siguen funcionando |

### Cómo se llama en la UI

Se llaman **bases**, en minúscula, y el archivo es `.base`. Se descartó buscarle un nombre
micológico propio —como se hizo con las Esporas— por una razón concreta: la extensión que
el usuario ve escrita **dice `base`**, y ponerle otro nombre en la interfaz obligaría a
traducir mentalmente entre lo que la app dice y lo que el explorador de archivos muestra.
Es una decisión reversible de una línea si más adelante pesa más la identidad.

---

## 5. Lo que NO hace

- **No edita las notas.** Cambiar el valor de una propiedad se hace en la nota. Decisión
  del usuario, y además acota el riesgo: escribir desde la tabla tocaría el frontmatter de
  N archivos y habría que resolver el conflicto con el editor abierto y el deshacer — que
  es de donde salieron `DEF-031`/`DEF-037`. La **base** sí se edita (ver arriba).
- **No agrega ni resume** (`summaries`, `groupBy`): fuera de v1.
- **No es una vista de tarjetas**: el backlog ya la dejaba fuera de alcance.
- **No aporta aristas al grafo.** Una base **sí** es un destino válido —`[[Mi base]]`
  navega, y aparece como nodo—, pero su contenido **no se escanea**: es la definición de
  una consulta, no prosa, y un `[[…]]` dentro de un valor del YAML crearía una arista
  fantasma. Es el mismo efecto colateral que ya arrastra Excalidraw y que nadie diseñó
  (ver [[canvas]]); acá se evitó a propósito.

  > [!warning] En desktop hay que excluirlas a mano; en web sale gratis, y eso es frágil
  > En desktop el grafo lee `contenidos` para **todas** las notas, así que hubo que añadir
  > un `tipo !== "base"` explícito en `lib/db/grafo.ts`. En web no hizo falta, pero **no
  > porque alguien lo decidiera**: el escaneo lee la clave `…/{id}.md` y el blob de una
  > base es `…/{id}.base`, así que no lo encuentra. El día que alguien "arregle" el grafo
  > de web para usar el `r2_key` real, las bases —y los Excalidraw— empezarán a aportar
  > aristas fantasma sin que nadie toque nada relacionado. Si eso pasa, el filtro por tipo
  > hay que ponerlo también allá.

---

## 6. Archivos implicados

| Archivo | Qué |
|---|---|
| `frontend/lib/bases.ts` | **Nuevo.** Parser del `.base` + evaluador de filtros. Puro, sin imports |
| `frontend/scripts/test-bases.mjs` | **Nuevo.** Un test por caso borde |
| `frontend/components/bases/BaseView.tsx` + `.module.css` | **Nuevo.** La tabla |
| `frontend/components/bases/FiltrosBuilder.tsx` | **Nuevo** (`FUN-M-27`). El constructor de filtros, recursivo, y el buscador de campos (`FUN-S-16`) |
| `frontend/lib/db/tabla.ts` (desktop) | **Nuevo.** La consulta local |
| `backend/…/TablaEndpoints.cs` (web) | **Nuevo.** El endpoint equivalente |
| `NotaTipo`, `vaultFs.ts`, `notas.ts`, `EditorPane.tsx`, `ExplorerPanel.tsx` | Tipo de archivo nuevo: extensión, creación, ícono, enrutado del pane |

---

## 7. Verificación

- `tsc`, `next build`, `cargo check` y `dotnet build`.
- `node scripts/test-bases.mjs`, con al menos: precedencia de `and`/`or`/`not` anidados ·
  cada comparador · cada función de archivo · propiedad ausente (no es lo mismo que vacía)
  · comparar número contra texto · fechas · listas con `contains` · **filtro no soportado
  dentro de un `and` y dentro de un `or`** (§ 2) · YAML inválido · `limit` · `sort` por
  varias columnas · el **árbol de filtros** en las dos direcciones, con el `not` de un
  hijo colapsado y la guarda intacta (`FUN-M-27`).
- La prueba que importa: una base sobre el vault real, comprobando a mano una muestra de
  las filas — y en particular que **no aparece ninguna nota que el filtro excluía**.

---

## Relacionadas

- [[metadata-yaml]] — las propiedades que esta funcionalidad consulta; sin ella no hay nada.
- [[canvas]] — el otro tipo de archivo nuevo, con el mismo criterio de interoperabilidad.
- [[Version 1.1.0 de web]] — por qué duplicar un parser entre TS y C# es algo a evitar.
- [[RAMAS]] — qué diverge entre las dos versiones.
- [[BACKLOG]] — `FUN-L-03` y sus continuaciones.
- [[Mapa de documentacion]] — índice general.
