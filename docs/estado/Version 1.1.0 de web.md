# Versión 1.1.0 de web

**Solo web** (`web-cloud`) · 2026-08-08 · un minor sobre [[Version 1.0.0]]

> [!important] Esta numeración es de web, no de desktop
> Las dos líneas **no comparten numeración**: cada una cuenta lo suyo. Que exista
> también una [[Version 1.1.0]] de escritorio es coincidencia — aquella salió el
> 2026-08-01 con la terminal integrada y el framework de IA, que en web no existen.
> Ver [[Versionado del sistema]].

Un solo tema: **poner la web al día**. Web estuvo siete releases de escritorio por
detrás (de la 1.1.0 a la 1.5.0), porque el foco de ese período —la línea de IA sobre
el vault— por naturaleza no le aplica. Lo que sí le aplicaba se refleja acá, de una
vez, siguiendo [[Reflejar cambios de desktop a web]]: es el **bloque G** de la
agrupación del [[BACKLOG]].

## Por qué sube un minor y no cuatro

El usuario puede hacer cosas que antes no podía —propiedades, plantillas, elegir la
tabulación—, así que es **minor**. Y es **uno solo**: el tamaño del salto lo decide el
cambio más significativo, no cuántos cambios trae. Las correcciones que vienen con
ellas (`DEF-039`/`040`/`041`, `DEF-043`, `DEF-049`, `DEF-050`) quedan **absorbidas**.

## Qué entra

| Qué | ID | De dónde viene |
|---|---|---|
| Propiedades del frontmatter YAML | `FUN-M-04` | [[Version 1.2.0]] |
| Esporas (plantillas de notas) | `FUN-M-03` · `DEF-043` | [[Version 1.3.0]] |
| Ancho de tabulación configurable | `FUN-S-02` · `DEF-049` · `DEF-050` | [[Version 1.5.0]], ya rehecha |
| Navegación por pestaña | `DEF-039` · `DEF-040` · `DEF-041` | [[Version 1.1.5]] |
| Grafo: rendimiento y reordenar reglas | — | [[Version 1.1.0]] |

## Lo que NO se refleja, y por qué

Ver [[Diferencias funcionales aceptadas entre versiones]].

- [[terminal-integrada]] (`FUN-L-07`) y el [[ia-framework-vault]] (`FUN-L-08`): viven
  sobre procesos y archivos del sistema. En web no hay ni una cosa ni la otra.
- [[autoactualizacion]] (`FUN-L-14` + `FUN-M-16`): **no hay nada que reflejar** — la web
  se actualiza sola al recargar.
- [[mycignore]] (`FUN-M-11`): en web la semántica sería **otra** (no hay carpeta en
  disco: sería un filtro de importación). Eso no es un reflejo, es una funcionalidad
  nueva; sigue pendiente de definir.
- Rendimiento de la apertura del vault (`FUN-M-12`): es del indexador SQLite local.
- `DEF-046` (la papelera del indexador) y `DEF-051` (permisos de diálogo de Tauri): los
  dos son de la capa nativa. `DEF-051` en particular **no puede pasar en web**, porque
  el `confirm` del navegador sí devuelve un booleano; lo que sí se escribió es la
  versión de web de `lib/confirmar.ts`, con el mismo contrato asíncrono, para que los
  componentes compartidos no tengan que saber dónde corren.

## Lo único que no fue un reflejo: el índice de propiedades

`FUN-M-04` tiene una mitad que **no se puede traer** de desktop: allá el índice es
SQLite local (`lib/db/*`), acá es **D1 + blobs** y vive en el backend .NET. Se
implementó de nuevo:

- Tabla `propiedades` en los dos esquemas (`d1/schema.sql` y `local/local_schema.sql`),
  con **una fila por elemento de lista** — así `clave='tags' AND valor='activo'`
  funciona sin `LIKE`.
- `Frontmatter.cs`: port del subconjunto de `lib/frontmatter.ts` que hace falta para
  indexar (separar el bloque, leer el mapa plano, resolver etiquetas). **No** porta la
  edición quirúrgica: eso pasa entero en el cliente, que manda el archivo completo.
- `TouchNotaContenidoAsync` reescribe FTS y propiedades **en el mismo batch**: el índice
  de una nota no puede quedar medio escrito.
- Endpoints nuevos: `GET /vaults/{id}/propiedades/claves`, `GET /vaults/{id}/propiedades`,
  `GET /notas/{id}/propiedades` y `POST /vaults/{id}/reindexar`.
- Filtro `clave:valor` en `GET /vaults/{id}/buscar`, combinable con texto o solo.
- Las etiquetas del grafo salen ahora del frontmatter **y** del cuerpo.

> [!warning] Las reglas del parser tienen que coincidir con las del cliente
> Hasta en los casos raros. Si el servidor leyera una propiedad que el cliente no,
> la nota aparecería en un filtro y el usuario **no podría verla en el panel** ni
> entender por qué salió. Por eso el orden de inferencia de tipos, el trato de las
> comillas y los motivos de "no soportado" son los mismos, y en el mismo orden.

> [!important] Hay que reindexar una vez
> Las notas guardadas **antes** de esta versión tienen el YAML crudo dentro del índice
> de texto y ninguna fila en `propiedades`: ni el filtro `clave:valor` ni el
> autocompletado del panel las ven. Un `POST /vaults/{id}/reindexar` lo arregla. A
> partir de ahí, guardar una nota ya la reindexa sola.

## El único punto donde las dos capas de datos no son intercambiables

En desktop el id de una carpeta **es su ruta**, así que las Esporas se resuelven
comparando `carpetaId` con la ruta configurada. Acá el id es un **UUID** sin relación
con el nombre, y esa comparación no encontraría nada: `idCarpetaEsporas()` resuelve la
ruta recorriendo el árbol segmento a segmento desde la raíz. Estaba anticipado en
[[RAMAS]] y en [[esporas-plantillas]].

## Verificación

- `npx tsc --noEmit` · `npx next build` · `dotnet build` — los tres en verde.
- `node scripts/test-frontmatter.mjs` (36) y `node scripts/test-esporas.mjs` (15).
- `node scripts/smoke-propiedades.mjs` — **contra la API de verdad**, con el backend
  levantado: 12 comprobaciones del comportamiento indexado (tipos de cada propiedad,
  filtros solos y combinados, mayúsculas, que la clave **no** entre al FTS pero el
  valor sí, que las etiquetas del grafo salgan de las dos fuentes, y que un
  `https://…` no se confunda con un filtro). Es el único de los `smoke-*` que no
  necesita Playwright ni el front levantado.
- **Sin probar en la app**: los `smoke-*.mjs` de Playwright fijan `localhost:3000` en
  el código y ese puerto lo tenía ocupado el Mycelium en marcha. Ver
  [[Verificar antes de integrar]]: nada de esto prueba comportamiento visible.

## Relacionadas

- [[Reflejar cambios de desktop a web]] — la receta que se siguió.
- [[RAMAS]] — qué archivos divergen entre las dos ramas.
- [[metadata-yaml]] · [[esporas-plantillas]] — las specs compartidas.
- [[Diferencias funcionales aceptadas entre versiones]] — qué no se refleja y por qué.
- [[Versionado del sistema]] — por qué esto es un minor y uno solo.
- [[Mapa de documentacion]] — índice general.
