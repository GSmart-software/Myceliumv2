# Versión 1.2.0

**Solo desktop** (`desktop-tauri`) · 2026-08-02 · un minor sobre [[Version 1.1.5]]

Un solo tema: **el frontmatter YAML deja de ser texto y pasa a ser propiedades**. Spec
en [[metadata-yaml]] (`FUN-M-04` · `METADATA-YAML`).

> [!success] Confirmado por el usuario el 2026-08-02
> El usuario probó los metadatos YAML en la app y **funcionan**. Se deja el paso a paso de
> los 12 criterios más abajo como guía de regresión para el reflejo a web y para cualquier
> cambio futuro sobre esta funcionalidad.
>
> Queda pendiente el **reflejo a `web-cloud`** (ver [[Reflejar cambios de desktop a web]]).
> El usuario dejó dicho que hará ajustes más adelante si los ve pertinentes: si aparecen,
> se registran como `DEF-*` en [[Bugs_errores_y_defectos]], no como retoques sueltos.

## Por qué sube un minor y no un patch

El usuario puede hacer algo que antes no podía: **dar atributos a sus notas y
consultarlos**. Eso es funcionalidad nueva → **minor**, y al subir el minor el patch
vuelve a `0`: de `1.1.5` se pasa a `1.2.0`, no a `1.2.5`. Ver [[Versionado del sistema]].

Es el caso inverso a [[Version 1.1.1]]: los dos son un `FUN-M` del [[BACKLOG]], pero
aquel no agregaba ninguna capacidad (lo mismo, más rápido) y este sí. El tamaño mide
**esfuerzo**, no impacto de versión.

## Qué entra

### Las notas tienen propiedades

El bloque entre `---` al inicio de un archivo pasa a ser un **mapa plano** de
propiedades. Se adopta el subconjunto de *Propiedades* de Obsidian para que un vault sea
intercambiable entre las dos apps:

| Tipo | Se escribe | Ejemplo |
|---|---|---|
| Texto | escalar suelto o entrecomillado | `estado: activo` |
| Número | entero o decimal | `prioridad: 3` |
| Casilla | `true` / `false` | `publicado: false` |
| Fecha | `YYYY-MM-DD` | `vence: 2026-08-30` |
| Fecha y hora | `YYYY-MM-DDTHH:mm` | `reunion: 2026-08-30T15:00` |
| Lista | en línea `[a, b]` o en bloque con `- ` | `tags: [proyecto, activo]` |

`tags` es la **única clave con comportamiento**: sus valores son etiquetas de la nota y
se unen a los `#tag` del cuerpo. `aliases` y `cssclasses` quedan **reservadas sin
comportamiento**, para no darles otro significado después: sus continuaciones se
registraron como `FUN-M-15` y `FUN-S-08`.

### Lo que ve el usuario

- **Lectura y dividido**: el bloque deja de renderizarse como markdown y aparece como
  **tarjeta de propiedades** arriba del contenido. Antes se rompía visualmente: el primer
  `---` salía como línea horizontal y el segundo convertía la última línea de metadatos
  en un título `<h2>` fantasma. La causa era que se le pasaba el texto **entero** de la
  nota a `renderMarkdown`; ahora `renderNota` compone la tarjeta y le pasa solo el cuerpo.
- **Vista en vivo**: la misma tarjeta como **widget de bloque de solo lectura**. Poner el
  cursor dentro revela el YAML crudo; sacarlo lo vuelve a plegar, igual que las tablas y
  los callouts.
- **Pestaña PROPIEDADES** en el panel de la nota, junto a GRAFO / SALIENTES / RETRO: una
  fila por propiedad con el icono de su tipo, la clave editable y el editor de valor que
  corresponda. Añadir una propiedad ofrece **autocompletado con las claves que ya existen
  en el vault** — es lo que evita que el mismo atributo termine como `estado`, `Estado` y
  `status`.
- **Búsqueda**: `clave:valor` filtra por propiedad (`estado:activo`), combinable con
  términos de texto o solo. Buscar `tags` deja de devolver todas las notas que tienen esa
  clave.
- **Grafo**: los grupos de color por etiqueta ven también las de `tags:`.

### Lo que NO se soporta, y qué pasa con ello

Mapas anidados, escalares multilínea (`|`, `>`), anclas y alias (`&`/`*`), etiquetas
(`!!`), listas de mapas y claves repetidas. Esa nota **no se rompe ni se reescribe
nunca**: se muestra el YAML crudo con el motivo, y el panel queda en solo lectura. Es
preferible no tocar los metadatos de alguien antes que reformatearlos mal.

## Las tres decisiones que valía la pena tomar

### Parser propio, no `js-yaml`

`frontend/lib/frontmatter.ts` es un parser por líneas, sin dependencia nueva. El motivo
de peso es el **round-trip**: el panel edita valores y hay que volver a escribir el
bloque, y un `dump()` de YAML reordena claves, normaliza comillas y **borra los
comentarios** — el usuario vería su frontmatter reescrito entero por cambiar un valor.
Acá cada propiedad conoce **su rango de líneas**, así que editar toca solo esas líneas y
todo lo demás (comentarios, espaciado, orden, CRLF) queda intacto.

Como es lógica pura sobre strings, es lo más barato de testear del proyecto:
`frontend/scripts/test-frontmatter.mjs`, 36 casos, con el mismo truco de transpilación de
`test-nombres.mjs` (sin framework ni build).

> [!note] Dos desviaciones deliberadas de YAML estricto
> Un `#` solo abre comentario si va **precedido de espacio**, así `tags: #idea` y
> `- #idea` son etiquetas y no comentarios; y el espacio tras los dos puntos es opcional,
> así `clave:valor` se lee igual que `clave: valor`. En los dos casos se prefiere leer de
> más antes que descartar en silencio algo que el usuario escribió.

### El widget de la vista en vivo es de SOLO LECTURA

No lleva controles ni edita el documento: se edita en el panel o escribiendo el YAML a
mano. Es una decisión de riesgo — los widgets interactivos dentro de CodeMirror son de
donde salieron `DEF-031` y `DEF-037`.

> [!danger] `estimatedHeight` y `padding`, no `margin`
> La decoración viene de un **StateField** (una de bloque en un `ViewPlugin` rompe el
> layout), declara `estimatedHeight` y se espacia con `padding`. CodeMirror mide los
> bloques con `offsetHeight`, que **no incluye los márgenes**, y ese desfase acumulado es
> exactamente la causa raíz de `DEF-031`/`DEF-037`: gutter corrido, clic que selecciona
> de más, scroll del buscador roto. Ver [[CodeMirror y la vista en vivo]].

### El panel NO escribe el archivo

Despacha una **transacción sobre el CodeMirror de esa nota** (`aplicarTextoMinimo`, que
reduce el cambio al rango que difiere) y deja que el flujo de guardado normal haga el
resto. Si llamara a `putContenido` mientras el editor tiene el documento montado, el
siguiente autoguardado del editor —debounce de 800 ms sobre **su** estado— pisaría el
cambio, y el usuario no podría deshacerlo con `Ctrl+Z`. Así el undo es de una sola acción
y ni el scroll ni el cursor se mueven.

Tampoco lleva estado propio del frontmatter: las propiedades se derivan del texto actual
del editor, así que **editar el YAML a mano actualiza el panel**.

## El índice

Tabla nueva en el índice del vault, con **una fila por elemento** de lista para poder
filtrar con `=` en vez de `LIKE` (que es lo que va a necesitar `FUN-L-03`):

```sql
propiedades (nota_id, clave, valor, tipo, orden)
```

Se reescribe en los dos caminos que ya reindexaban: `putContenido` y `indexarVault`.
Lo que **cambia en lo que ya existía**:

- **FTS**: se indexa el cuerpo más los **valores** de las propiedades, sin las claves ni
  la sintaxis YAML. Buscar «activo» sigue encontrando la nota; los `snippet()` dejan de
  mostrar YAML.
- **Etiquetas del grafo**: salen de `etiquetasDe` (unión de `tags:` y los `#tag` del
  cuerpo).
- **Enlaces**: `WIKILINK_RE` sigue corriendo sobre el texto **completo**, así que un
  `[[enlace]]` en una propiedad sigue contando como saliente. Es el comportamiento
  correcto y no se tocó.

> [!info] Los vaults que ya existen se reindexan solos, una vez
> El reindexado es incremental por `mtime`, así que ninguna nota vieja llegaría a indexar
> sus propiedades. Al abrir un vault se pregunta por `sqlite_master` **antes** de crear el
> esquema: si la tabla `propiedades` todavía no existía, se fuerza una reindexación
> completa. Al existir ya la tabla, no vuelve a dispararse.

## El framework de IA sube a 1.3.0

Esta vez sí, y es lo importante: hasta `1.2.1` los templates **afirmaban lo contrario de
lo que ahora es cierto** ("el frontmatter YAML todavía no se interpreta"), en la regla
dura 6 del `CLAUDE.md` generado y en las precauciones de la skill `mycelium-vault`. Unas
instrucciones que mienten sobre el sistema son peores que no tenerlas.

> [!warning] Hay que regenerarlo en este vault
> El vault de este repo tiene instalada la **v1.2.0**. Configuración → Vault detecta la
> versión instalada y ofrece actualizar. Ver [[Generar el framework de IA en un vault]].

## Cómo comprobarlo en la app

Creá una nota de prueba (p. ej. `Prueba propiedades.md`) con **los seis tipos**:

```md
---
estado: activo
prioridad: 3
publicado: false
vence: 2026-08-30
reunion: 2026-08-30T15:00
tags: [proyecto, activo]
relacionada: "[[Mapa de documentacion]]"
---

# Prueba de propiedades

Texto con un #tag del cuerpo.
```

Y otra (`Prueba propiedades no soportadas.md`) con YAML que Mycelium no interpreta:

```md
---
autor:
  nombre: Ana
  rol: editora
---

# Frontmatter no soportado
```

| # | Criterio | Cómo comprobarlo |
|---|---|---|
| 1 | Tarjeta en lectura | Abrí la primera nota en modo **lectura** (`Ctrl+3`): arriba tiene que verse una tarjeta con una fila por propiedad. Ni línea horizontal ni título fantasma. |
| 2 | Tarjeta en vivo | En modo **vivo** (`Ctrl+1`) se ve la misma tarjeta. Hacé clic en ella o subí con las flechas: aparece el YAML crudo. Bajá el cursor: se vuelve a plegar. |
| 3 | **No-regresión `DEF-031`/`DEF-037`** | Con un documento largo **con** frontmatter (pegá bastante texto debajo) y otro **sin** él: el gutter de plegado tiene que quedar alineado con las líneas, el clic tiene que seleccionar donde se hace clic, y `Ctrl+F` + una coincidencia lejana tiene que saltar a la línea correcta. **Es lo más delicado del release.** |
| 4 | Editar desde el panel | Abrí el panel de la nota y la pestaña **PROPIEDADES**. Cambiá `estado` a `cerrado` y salí del campo. En modo `raw` (`Ctrl+4`) tiene que haber cambiado **solo esa línea**. `Ctrl+Z` en el editor lo deshace **en un paso**. |
| 5 | Crear el bloque | En una nota **sin** frontmatter, añadí una propiedad desde el panel: el bloque `---` tiene que aparecer al principio, con una línea en blanco antes del contenido, **sin comerse la primera línea**. |
| 6 | Del editor al panel | Escribí `autor: Ana` a mano dentro del bloque en modo `raw`: la fila tiene que aparecer en el panel. |
| 7 | No soportado | Abrí la segunda nota: en lectura y en vivo se ve el YAML crudo con el aviso; el panel está en solo lectura con el motivo. Editá el cuerpo, guardá, cerrá y reabrí: **el frontmatter no se modificó**. |
| 8 | Etiquetas | Las de `tags:` se ven como pastillas; en lectura, hacer clic se comporta como un `#tag`. Buscar `tag:proyecto` encuentra la nota. |
| 9 | Búsqueda | Buscar `activo` encuentra la nota; buscar `estado:activo` también; buscar `tags` **ya no** devuelve todas las notas que tienen esa clave. |
| 10 | Enlaces en propiedades | La pestaña **SALIENTES** del panel tiene que listar `Mapa de documentacion`, y el enlace tiene que verse en el grafo. |
| 11 | Vault existente | Cerrá y reabrí la app con este vault: las propiedades de las notas que ya existían tienen que estar indexadas sin tocar nada (comprobalo buscando `estado:activo`). |
| 12 | CRLF | En un archivo guardado con CRLF, editá una propiedad desde el panel y comprobá que el archivo **no** se convirtió a LF (`file` o el indicador de fin de línea de tu editor). |

## Verificación

- `npx tsc --noEmit -p tsconfig.json` en verde (exit 0).
- `node scripts/test-frontmatter.mjs` — 36 casos, todos en verde.
- No se tocó Rust, así que no hizo falta `cargo check`.

Ver [[Verificar antes de integrar]]: nada de esto prueba comportamiento visible.

## Instaladores

**Todavía no generados**, igual que los de [[Version 1.1.1]] y [[Version 1.1.5]].
Procedimiento en [[Generar instaladores desktop]].

## Reflejo a web

Pendiente y **explícitamente diferido** hasta que el usuario confirme el comportamiento
en desktop. La mayor parte (parser, render, widget, panel) es **compartida** y se puede
traer entera; el **índice diverge de verdad**: en web la tabla `propiedades`, el cambio
de contenido del FTS y el filtro `clave:valor` hay que llevarlos al backend .NET. La
lista de archivos está en [[RAMAS]]; la receta, en [[Reflejar cambios de desktop a web]].

## Relacionadas

- [[Version 1.1.5]] — el release anterior.
- [[metadata-yaml]] — la spec, con los 12 criterios de aceptación completos.
- [[CodeMirror y la vista en vivo]] — el height-map: por qué el widget lleva
  `estimatedHeight` y se espacia con `padding`.
- [[Versionado del sistema]] — por qué un minor y por qué el patch vuelve a `0`.
- [[ia-framework-vault]] — el framework que subió a `1.3.0` con esta funcionalidad.
- [[BACKLOG]] — `FUN-L-03` (archivos tabla) queda desbloqueado; `FUN-M-15` y `FUN-S-08`
  son las continuaciones que esta spec dejó fuera.
- [[Estado del proyecto]] — situación actual.
