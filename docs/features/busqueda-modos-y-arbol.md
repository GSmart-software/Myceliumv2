# Buscar en el vault: dónde y cómo se ve (`FUN-M-20` · `FUN-S-17`)

Dos cosas sobre el panel de búsqueda de [[HUs]] (HU-21), y una tercera que salió
de mirarlas: **elegir en qué parte de la nota se busca**, **ver los resultados
agrupados por carpeta**, y —a partir de eso— **las guías de indentación del
explorador**.

| | Alcance | Estado |
|---|---|---|
| `FUN-M-20` · modos y árbol | ambas | Confirmada y reflejada el 2026-09-05 |
| `FUN-S-17` · guías en el explorador | ambas | Confirmada y reflejada el 2026-09-05 |

---

## 1. Dónde busca (`FUN-M-20`)

Tres modos: **nombre y contenido** (el de siempre), **solo el nombre**, **solo el
contenido**.

### Se resuelve en la consulta, no filtrando después

`notas_fts` ya tiene el título y el cuerpo en **columnas separadas**, así que
restringir es gratis: se hace con el operador de columna de FTS5. Filtrar el
resultado después habría sido peor de una forma poco obvia — el `LIMIT 50` se
aplica en la consulta, así que se traerían 50 candidatos de los que podrían
sobrevivir tres.

> [!important] El filtro se aplica a CADA término, no a la consulta
> `titulo : "a"* "b"*` restringe **solo el primero**: el operador de columna
> alcanza a la frase que le sigue, no a lo que venga después, así que `b` se
> buscaría en todo el documento. Se genera `titulo : "a"* titulo : "b"*`.
>
> Un resultado que casi cumple el filtro es peor que ninguno: nadie lo mira dos
> veces, y enseña a desconfiar del filtro entero. La sintaxis se verificó contra
> FTS5 real antes de escribirla.

### Buscando solo por nombre no hay fragmento

La coincidencia **es** el título, que ya se ve encima del resultado. Un `snippet`
del cuerpo ahí sería el principio del documento sin nada marcado: ruido que se
lee como si el resaltado se hubiera roto.

### El control es un botón que cicla

Y no un desplegable. Son **tres** opciones y una es la de siempre: recorrerlas
cuesta un clic, y así el control ocupa lo mismo que el de la vista y los dos
caben dentro del propio campo de búsqueda. Con seis opciones esto no escalaría
—ciclar entre seis es peor que elegir— pero con tres, elegir de una lista es más
trabajo que probar.

Van **dentro del campo** y no en Configuración porque se tocan mientras se busca,
mirando lo que devolvió la búsqueda anterior.

> [!note] El recuadro pasó a ser la fila, no el `<input>`
> La «x» de limpiar se le superponía al input con `position: absolute`. Con dos
> controles más eso deja de escalar: habría que reservarles sitio a mano en el
> `padding` del input y recalcularlo cada vez que se agregue uno. Con la fila
> como caja, los controles se acomodan solos. Es el mismo patrón que el buscador
> de campos de [[bases-tabla]].

---

## 2. Los resultados por carpeta (`FUN-M-20`)

Vista de árbol al estilo de VS Code, con el ícono del tipo en cada resultado
—del mismo mapa que el explorador y las pestañas, ver [[marcas-en-las-pestanas]]—
y la cuenta total por carpeta.

> [!important] Es el árbol DE LOS RESULTADOS, no el del vault filtrado
> Una carpeta entra si tiene resultados propios **o** si alguna descendiente los
> tiene. Mostrar las vacías convertiría diez coincidencias en cien filas que hay
> que recorrer para encontrarlas — exactamente lo que la vista viene a evitar.

Dentro de cada carpeta se conserva **el orden en que llegaron** los resultados: el
backend los devuelve por relevancia (`ORDER BY rank`), y reordenarlos
alfabéticamente tiraría esa información sin decirlo. Las carpetas sí van por
nombre, que es como se las busca con la vista.

Las carpetas empiezan **abiertas**: quien busca quiere ver las coincidencias, no
la estructura. Plegar es para apartar una carpeta que estorba, no para tener que
abrirlas una por una.

En árbol la ruta **no** se repite en cada resultado —la dice la carpeta que lo
contiene—; en lista sí, porque ahí es lo único que lo ubica.

El agrupado es una función pura (`agruparEnArbol`, en `lib/search.ts`) y tiene
tests: poda de ramas vacías, resultados en la raíz, una carpeta que el índice
todavía no conoce (se queda en la raíz en vez de perderse), y el orden.

---

## 3. Las guías de indentación (`FUN-S-17`)

Una línea vertical por nivel que dibuja hasta dónde llega el contenido de cada
carpeta. Salió de ver el árbol de resultados: al tenerlas ahí, su ausencia en el
**explorador** —que es donde más carpetas anidadas hay— pasó a ser lo raro.

> [!important] La sangría tiene que darla el ANIDAMIENTO, no un `padding` por nivel
> Es la única decisión de esta funcionalidad, y vale para los dos árboles.
>
> Con `paddingLeft: nivel * 14` en cada fila la sangría **se ve igual**, pero no
> hay ningún elemento que abarque la rama, y sin él no hay de qué colgar la
> línea. Anidando contenedores —cada uno con su `border-left`— la guía sale sola
> y llega **exactamente** hasta donde llega el contenido de esa carpeta, que es
> lo único que la hace útil.
>
> Por eso `FUN-S-17` no fue un cambio de CSS: fue reestructurar el render. En el
> explorador `depth` viajaba por cinco componentes (`renderCarpeta`,
> `renderNota`, `FolderRow`, `NoteRow`, `OtroRow`) y desapareció de todos.

Los 14 px de cada nivel son los mismos de antes, repartidos como **11 de margen +
2 de relleno + 1 de línea**; el margen deja la guía centrada bajo la flecha de la
carpeta que abre la rama.

Lo que quedaba del cálculo por fila —su base, sin el factor por nivel— pasó a dos
clases: `.rowCarpeta` (4 px, donde arranca su flecha) y `.rowHoja` (22 px, corrida
el ancho de esa flecha para que los **nombres** queden en la misma columna).

---

## 4. Dónde se guarda lo que el usuario elige

Los tres ajustes —modo, vista y **búsqueda exacta** (`DEF-035`)— viven en
`preferencesStore`, o sea en las preferencias **del usuario**: describen cómo se
busca, no qué contiene el vault, así que acompañan a la persona.

> [!warning] Ninguno puede ser estado local
> `busquedaExacta` lo era, y se perdía al cambiar de sección del rail —el panel
> se desmonta—, sin necesidad siquiera de cerrar la app. Una elección que se
> pierde sola es peor que no poder hacerla: enseña a no confiar en el control.

---

## 5. Archivos implicados

| Archivo | Qué |
|---|---|
| `frontend/components/explorer/SearchPanel.tsx` + `.module.css` | Los controles, la lista y el árbol |
| `frontend/lib/search.ts` | `agruparEnArbol`, puro y compartido |
| `frontend/lib/db/fts.ts` + `buscar.ts` (desktop) | El filtro de columna en la consulta FTS |
| `backend/…/SearchEndpoints.cs` (web) | Lo mismo, en C#. **No es un reflejo**: allá la consulta la arma el backend |
| `frontend/components/explorer/ExplorerPanel.tsx` + `.module.css` | `FUN-S-17`. **Diverge**: en web no existe `OtroRow` |
| `frontend/scripts/test-search.mjs` | **Nuevo.** 17 casos; los 7 de FTS se saltan en web, donde esa mitad es C# |

## 6. Verificación

- `tsc` y `next build` en las dos ramas; `dotnet build` en web.
- `node --test scripts/test-search.mjs`.
- En la app: un término que exista **solo** en un título y **solo** en el cuerpo
  de otra nota, para comprobar los tres modos; dos términos a la vez, que es
  donde se rompería si el filtro no se aplicara a cada uno.
- El árbol con carpetas anidadas de tres o cuatro niveles, plegando una del
  medio.
- Al quitar `depth` del explorador: arrastrar y soltar, la sombra que sigue al
  puntero, el resaltado de la carpeta del archivo abierto y el renombrado en
  línea.

## Relacionadas

- [[HUs]] — HU-21, la búsqueda que esto amplía.
- [[metadata-yaml]] — los filtros `clave:valor` que conviven con estos modos.
- [[marcas-en-las-pestanas]] — el mapa de íconos por tipo que reusa el árbol.
- [[bases-tabla]] — el buscador de campos, mismo patrón de campo con controles dentro.
- [[RAMAS]] — qué se trajo entero y qué se implementó aparte.
- [[BACKLOG]] — `FUN-M-20` y `FUN-S-17`.
- [[Mapa de documentacion]] — índice general.
