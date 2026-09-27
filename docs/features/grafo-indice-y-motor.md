# Grafo: índice de enlaces y motor del cúmulo (`FUN-L-25` · `GRAFO-INDICE-Y-MOTOR`)

La implementación del plan de `DEF-109` ([[Rendimiento del grafo]] § Segundo análisis),
en el orden que confirmó el estudio de [[Como construye Obsidian su grafo]]: **primero el
índice de enlaces**, después el dibujo y la física del cúmulo. Aprobada por el usuario el
2026-09-26 («implementamos lo que propones»). Se implementa en **dos partes en paralelo**,
cada una con su subagente, porque tocan capas distintas.

> [!info] Alcance
> **Parte A (índice de enlaces): SOLO-DESKTOP** (`lib/db/*`, indexador, Rust si hace
> falta; en web el grafo lo arma el backend .NET con su propia regla).
> **Parte B (motor del cúmulo): AMBAS (igual)** (`components/graph/MiniGraph.tsx` y
> vecinos, compartidos): se implementa en desktop y se refleja a web.

> [!important] Decisión sobre el flujo animado
> Se **conservan los guiones** (sin cambio visual) y solo se **acotan**: no se dibujan con
> zoom < 0,5 (el mismo umbral que ya apaga los nombres) ni por encima de un techo de
> aristas visibles. Pasar a partículas queda como ajuste posterior si el usuario lo pide.

---

## Parte A · Tabla de enlaces en el índice (solo desktop)

### A1. Esquema

Dos tablas nuevas en `ESQUEMA_INDICE` (`lib/db/indexer.ts`), escritas por el indexador y
por el guardado, nunca leídas del texto en consulta:

```sql
CREATE TABLE IF NOT EXISTS enlaces (
  desde_id      TEXT NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  destino_texto TEXT NOT NULL,          -- lo escrito en el [[…]], sin alias ni #sección
  destino_id    TEXT,                   -- nota resuelta, NULL si no resuelve (roto)
  tipo          TEXT NOT NULL,          -- 'enlace' | 'embed' | 'canvas'
  n             INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_enlaces_desde   ON enlaces(desde_id);
CREATE INDEX IF NOT EXISTS idx_enlaces_destino ON enlaces(destino_id);
CREATE INDEX IF NOT EXISTS idx_enlaces_texto   ON enlaces(lower(destino_texto));
CREATE TABLE IF NOT EXISTS etiquetas (
  nota_id TEXT NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_etiquetas_nota ON etiquetas(nota_id);
```

`etiquetas` guarda lo que hoy calcula `etiquetasDe(contenido, sinCodigo)` en `grafo()`
(frontmatter + `#tags` del cuerpo, que las reglas de color del grafo consumen): es la
otra mitad del escaneo por nota (137 ms por cada 1.000 notas, medido).

### A2. Quién escribe

- **Indexador** (`indexarVault`): en la misma tanda multi-fila que `FUN-M-38` introdujo,
  una sentencia para `enlaces` y una para `etiquetas` por tanda de 250 (`DELETE … IN` +
  `INSERT … SELECT FROM json_each(?)`). La extracción por nota reutiliza exactamente lo
  que hoy hace `buildVaultGraph` en `lib/db/grafo.ts` (`sinCodigo` + regex de wikilinks,
  `referenciasDe` para canvas, tipos `base`/`canvas`/`drawio` que no se escanean), movida
  a una función pura `derivarEnlaces(contenido, tipo)` en `lib/enlacesNota.ts` (o el
  nombre que encaje) con tests headless.
- **Guardado** (`putContenido`): reescribe las filas de esa nota, **solo si el hash
  indexable cambió** (la huella que `FUN-M-38` ya calcula), en la misma pasada que
  `propiedades` y FTS.
- **Resolución** (`destino_id`): con el resolutor único de `FUN-M-40`
  (`resolveWikilinkEnIndice` sobre el mapa por título), al escribir. Y **re-resolución
  dirigida** como hace Obsidian: al crear, renombrar, mover o borrar una nota, se
  re-resuelven **solo** las filas cuyo `lower(destino_texto)` coincide con el título
  viejo o el nuevo (una `UPDATE … WHERE` por título, no un escaneo). `rekeyIndice`
  (`vaultFs.ts`) repunta `desde_id` y `destino_id` como hace con `contenidos`.
- **Migración**: si al abrir el índice no existe `enlaces` (índice de una versión
  anterior), se crea y se **fuerza una pasada completa** del indexador, como se hizo con
  `propiedades` en `FUN-M-04` (el indexador ya tiene ese mecanismo: úsalo).

### A3. Quién lee

| Consumidor | Hoy | Pasa a |
|---|---|---|
| `grafo(vaultId)` (`GraphView`) | `SELECT` del contenido completo + escaneo | `SELECT id, titulo, creado_en FROM notas` + `SELECT desde_id, destino_id FROM enlaces WHERE destino_id IS NOT NULL` + `SELECT nota_id, tag FROM etiquetas`; `conexiones` por nodo con `GROUP BY`. **Cero contenido leído** |
| `conexiones(notaId)` (`NotePanel`, `renameNota`) | grafo entero | salientes: `enlaces WHERE desde_id = ?`; retro: `enlaces WHERE destino_id = ?`; el fragmento de contexto (`fragmentAround`) se calcula leyendo **solo** el contenido de las notas retro (una consulta `IN`) |
| `BarraEstado` (dos números) | `/conexiones` completo | ruta nueva `GET /notas/{id}/conexiones/conteo` → dos `SELECT COUNT(*)`; o el mismo `conexiones` si ya es barato. Elegí lo más simple y decilo |
| Enlaces rotos (`RelinkView`, auditoría `FUN-M-17`) | escaneo propio | **no se toca** en esta tanda; anotá si `enlaces WHERE destino_id IS NULL` les serviría (es exactamente `unresolvedLinks`) |

### A4. Criterios

1. Con la Tesina (1.306 notas), `grafo()` responde en **menos de 50 ms** de SQL (hoy
   ≈300 ms de escaneo) y `conexiones()` en menos de 10 ms; medilo con la réplica
   headless de `FUN-M-38` (`better-sqlite3` sobre el índice real, solo lectura).
2. El grafo resultante es **idéntico** al de hoy sobre los tres vaults de prueba (mismos
   nodos, mismas aristas, mismas etiquetas): comparalo arista por arista en un test.
3. Guardar una nota con un `[[enlace]]` nuevo lo muestra en el grafo y en las conexiones
   sin reindexar el vault. Renombrar una nota citada por otras conserva las aristas
   (re-resolución dirigida) y un enlace roto pasa a resolver cuando aparece la nota.
4. Un índice de la versión anterior abre, migra y queda con `enlaces` completa.
5. Tests headless nuevos: `derivarEnlaces` (casos de `sinCodigo`, alias, `#sección`,
   embed, canvas, tipos excluidos), la re-resolución dirigida, y la comparación del grafo.

## Cómo quedó · Parte A

> [!success] Implementada en `feat/grafo-indice-desktop` (2026-09-26), sin confirmar en la app
> `grafo()` ya no lee contenido y `conexiones()` lee solo el de quien cita. Sobre los
> índices reales de los tres vaults, el grafo sale **idéntico** al del escaneo (Tesina y
> este repo) o idéntico más **9 aristas `[[x#sección]]`** que antes se perdían (Trabajo y
> Estudio). `tsc`, `next build` y 473 tests en verde.

### Archivos

| Archivo | Qué |
|---|---|
| `lib/enlacesNota.ts` (nuevo, puro) | `derivarEnlaces(contenido, tipo)` y `derivarEtiquetas(contenido, tipo)`: lo que hacía `buildVaultGraph`, movido sin reescribir (`sinCodigo`, `referenciasDe`, `base`/`canvas`/`drawio` fuera del escaneo, `etiquetasDe`). Más `resolverEnlace`, `claveDeEnlace`, `claveSinAncla`, `clavesDeTitulo` y `cortesDeAncla` |
| `lib/db/enlacesIndice.ts` (nuevo) | Escritura por tandas (`DELETE … IN` + `INSERT … SELECT FROM json_each`), `crearResolutor` (el resolutor único sobre `notas` sin papelera + `carpetas`) y la re-resolución dirigida (`reResolverClaves`, `reResolverTitulos`: `UPDATE … FROM json_each` que solo toca las filas que cambian) |
| `lib/db/indexer.ts` | Las dos tablas y sus índices en `ESQUEMA_INDICE`; `notas.hash_enlaces`; `VERSION_DERIVADO` en `PRAGMA user_version`; el indexador escribe `enlaces`/`etiquetas` en la misma tanda y resuelve al final |
| `lib/db/contenido.ts` | `putContenido` reescribe las filas de la nota, ya resueltas, si cambió `hash_enlaces` |
| `lib/db/vaultFs.ts` | `rekeyIndice` repunta `desde_id`, `destino_id`, `etiquetas` (y `propiedades`, ver desvíos) y re-resuelve los títulos viejos y nuevos |
| `lib/db/notas.ts`, `lib/db/papelera.ts` | Re-resolución al crear, duplicar (la copia hereda las filas), mandar a la papelera y recuperar |
| `lib/db/grafo.ts` | `grafo()` = tres `SELECT` (notas, aristas, etiquetas); `conexiones()` = salientes y citantes por índice, el contenido de los citantes con prosa en una consulta `IN`, y el grado de los vecinos contado en SQL |
| `scripts/test-enlaces-nota.mjs` (nuevo) | 15 tests: la extracción, el ancla, y —con SQLite— la comparación arista por arista con el escaneo de antes (copiado en el test como referencia), las consultas que NO leen contenido, la migración, el guardado, crear/duplicar, renombrar/mover y papelera |
| `scripts/test-wikilinks.mjs` | Sus dos tests del grafo pasan de un doble del SQL viejo a la resolución de la tabla |

`GraphView`, `MiniGraph`, `NotePanel`, `BarraEstado`, `vaultStore` y `RelinkView` **no
cambian**: `GraphDataDto` y la respuesta de `/conexiones` tienen la misma forma.

### Decisiones y desvíos de la spec

1. **El ancla se guarda y se resuelve por partes, no se quita.** La spec decía guardar
   `destino_texto` «sin `#sección`». El primer intento lo hizo y la comparación sobre la
   Tesina perdió 2 aristas: títulos con `#` («…Q# y Quantum Development Kit…»,
   «…(#P-completeness)»). Y Trabajo y Estudio tiene una carpeta `C#`. Ahora se guarda con
   el ancla y se resuelve **entero primero**, y si no, cortando en el último `#` del último
   segmento y después en el primero (`cortesDeAncla`): `[[Nota#Sección]]`,
   `[[Nota#H1#H2]]`, `[[C#/Nota#Sección]]` y `[[Q# y Quantum#Intro]]` resuelven, y todo
   lo que resolvía antes resuelve igual. Un `[[#Sección]]` suelto (salto dentro de la
   misma nota) no genera fila.
2. **`clave` y `clave_ancla` en vez de un índice sobre `lower(destino_texto)`.** El
   `lower()` de SQLite solo pasa a minúsculas el ASCII, y el resolutor usa el
   `toLowerCase()` de JS: la re-resolución de un título con tildes no habría encontrado sus
   filas. `clave` es el último segmento en minúsculas calculado en JS; `clave_ancla`, lo
   mismo cortado en el primer `#` (NULL sin ancla). Para el corte en el último `#`,
   `clavesDeTitulo` de un título con `#` agrega su propio corte en el primero, que es la
   `clave_ancla` de esas filas: no hace falta una tercera columna.
3. **Huella propia, `hash_enlaces`**, en vez de reusar `hash_indexable`: casi todo
   guardado cambia el texto indexable y casi ninguno los enlaces. Guardar prosa no toca
   `enlaces` (hay un test que cuenta las sentencias).
4. **Migración por `PRAGMA user_version`**, no por «¿existe la tabla?». El mecanismo de
   `propiedades` (`FUN-M-04`) está **roto sin que se note**: `vaultSessionStore` llama a
   `crearEsquemaIndice()` antes que a `indexarVault()`, así que cuando el indexador
   pregunta, la tabla ya existe. Y aunque el orden fuera el bueno, cerrar la app a mitad de
   la pasada dejaría la tabla a medio llenar para siempre. `user_version` se escribe solo
   al terminar la pasada completa. La consulta vieja de `propiedades` se dejó (no molesta).
5. **Un cuarto `tipo`, `archivo`**: la tarjeta de nota de un canvas guarda una ruta, no
   un título, y resuelve distinto (el id de una nota es su ruta). Los tipos quedan
   `enlace | embed | canvas | archivo`.
6. **`rekeyIndice` ahora repunta `propiedades`.** No era de esta tanda pero estaba al lado:
   renombrar o mover una nota borraba en cascada sus propiedades (el `DELETE` de la fila
   vieja) y, como el `mtime` se copia, el indexador no las volvía a leer hasta que el
   archivo cambiara. Las bases y los filtros `clave:valor` dejaban de ver esa nota.
   `hash_indexable` se sigue dejando en NULL a propósito (`ftsPoner` indexa ahí el texto
   crudo; el próximo guardado lo corrige); `hash_enlaces` sí se copia.
7. **El grado de los vecinos se cuenta en SQL** (`GROUP BY` sobre salientes y entrantes
   distintos). Traer los pares para contarlos en JS eran 2.274 filas en la nota más
   conectada de la Tesina.
8. **`BarraEstado` sigue usando `conexiones`**: con la tabla cuesta 1–5 ms en una nota
   típica (tabla de abajo), y una ruta de conteo sería otra superficie para el mismo
   dato. Si en la app se nota, la ruta es trivial ahora.
9. **Enlaces rotos (`RelinkView`, auditoría `FUN-M-17`): no se tocaron.** `SELECT desde_id,
   destino_texto FROM enlaces WHERE destino_id IS NULL` es exactamente la lista de enlaces
   sin resolver (`unresolvedLinks` de Obsidian): 295 filas en la Tesina, 430 en Trabajo y
   Estudio. Serviría para el **inventario** de la auditoría; el re-enlazado necesita
   además las posiciones en el texto, que la tabla no guarda.

> [!warning] Queda una diferencia entre el grafo y el editor: `[[Nota#Sección]]`
> El grafo, las conexiones y los retroenlaces ya la cuentan como enlace a `Nota`. El
> editor —clic, vista en vivo, lectura— le pasa a `resolveWikilink` el destino **con** el
> ancla (`livePreview.ts`, `markdown.ts`), así que la sigue marcando como inexistente.
> Era así antes de esta tanda (el grafo tampoco la contaba). Alinearlo es usar
> `resolverEnlace`/`cortesDeAncla` de `lib/enlacesNota.ts` en esos dos puntos; queda fuera
> de esta parte, que no toca el editor.

### Mediciones

Réplica headless (`better-sqlite3` en memoria, sin IPC; mediana de 5–15 corridas) sobre
**copias** de los índices reales (`%APPDATA%/com.mycelium.desktop/index-*.db`) de los
tres vaults, en el scratchpad de la sesión (no se versiona: depende de `better-sqlite3`).
El indexador corrió de verdad —la migración de un índice de la 2.1.0—, con `recorrer_vault`
y `leer_archivos` servidos desde el propio índice (mismos archivos, `mtime` y contenido
que ve el escaneo). «Antes» es `lib/db/grafo.ts` de `desktop-tauri` sobre el mismo índice.

| | Este repo (193 notas) | Tesina (1.329) | Trabajo y Estudio (1.225) |
|---|---|---|---|
| `grafo()` antes → después | 181 → **3,9 ms** | 1.648 → **24,6 ms** | 670 → **10,9 ms** |
| `conexiones()` de la nota más conectada, antes → después | 95 → 11,9 ms (180 conex.) | 855 → 12,7 ms (320) | 328 → 6,0 ms (213) |
| `conexiones()` de todas las notas: mediana / p90 / peor | 5,0 / 7,7 / 20 ms | 3,3 / 5,8 / 18 ms | 0,6 / 1,8 / 16 ms |
| Consultas de `conexiones()` | 5 (+1 de contenido si hay citantes con prosa) | ídem | ídem |
| Migración (pasada completa): sentencias | 66 | 117 | 109 |
| Reapertura sin cambios: sentencias | 28 (antes 27: `PRAGMA user_version`) | 28 | 28 |
| Filas de `enlaces` (sin resolver) / `etiquetas` | 1.211 (2) / 17 | 3.404 (295) / 3.936 | 2.242 (430) / 305 |
| Grafo contra el escaneo de antes | **idéntico** | **idéntico** | idéntico **+ 9 aristas `[[x#sección]]`** |
| `conexiones()` contra el de antes (muestra) | 32/32 idénticas | 24/24 idénticas | 38/40: las 2 difieren solo en el grado de vecinos que tocan esas 9 aristas |

- «Idéntico» es: mismos nodos (id, título, `creadoEn`), mismas aristas una por una, mismas
  etiquetas nodo por nodo y en el mismo orden, mismo grado. Y en `conexiones`, mismos
  salientes y retroenlaces **en el mismo orden** y con el mismo fragmento.
- **Criterio 1**: `grafo()` < 50 ms en la Tesina, cumplido (24,6 ms; hasta el más grande de
  los tres). `conexiones()` < 10 ms: cumplido en la mediana y el p90 de los tres vaults;
  **no** en las notas-hub (12–20 ms). Ahí lo que pesa es lo que la spec pide leer: el
  contenido de las notas que citan (543 KB en `Fuentes.md` de la Tesina) y sus 309
  salientes. Si molestara, el fragmento se puede sacar en SQL con `instr`/`substr` sin
  traer el texto entero.
- La cifra de «antes» de la Tesina (1,6 s) es mayor que los ≈300 ms de `DEF-109` porque
  esta réplica transpila y corre en otra carga de la máquina; lo firme es la proporción
  (×40–×70) y que el grafo ya no lee contenido.

### Verificación

- `npx tsc --noEmit -p tsconfig.json`: verde. `npx next build`: verde.
- `node --test scripts/test-*.mjs`: **473 tests, 466 en verde y 7 saltados** (los de SQLite
  de `test-enlaces-nota.mjs`, que se saltan sin `better-sqlite3`); con
  `MYCELIUM_BETTER_SQLITE3=<ruta>/node_modules/better-sqlite3`, **473 en verde**. Antes, 458.
- Rust: sin cambios (no se corrió `cargo`).

### Qué confirmar en la app

1. **Abrir la Tesina con esta versión**: la primera apertura relee todo una vez (la
   migración: barra de progreso completa, como un índice nuevo); la segunda, no.
2. **El grafo** abre sin la pausa de antes y se ve igual (mismos nodos, aristas y colores
   por etiqueta). En Trabajo y Estudio aparecen las aristas de los `[[x#sección]]`.
3. **Escribir `[[Otra nota]]` y guardar**: la arista aparece en el grafo y en el panel de
   conexiones sin reindexar; escribir prosa no cambia nada.
4. **Crear una nota con el título de un enlace roto**: el enlace deja de estar roto en el
   grafo. **Renombrar** una nota citada: las aristas se conservan (el renombrado reescribe
   los entrantes). **Mover** una nota y **mandarla a la papelera y recuperarla**: las
   aristas van y vuelven.
5. La **barra de estado** (enlaces/retroenlaces) sigue al día al guardar.

---

## Parte B · Motor del cúmulo (frontend compartido)

Sobre `components/graph/MiniGraph.tsx`, **solo el camino `cumulo`** (y `sustrato`, que
comparte `simulate()`); las otras disposiciones de `FUN-L-23` no se tocan. `hifas.ts` y
`disposiciones.ts` no se tocan.

### B1. Capa estática y reposo real (propuesta 1 de `DEF-109`)

- Aristas base, nodos (sprites) y nombres se dibujan a un **canvas offscreen** que solo
  se repinta cuando la simulación movió nodos, cambió la vista (zoom, desplazamiento,
  tamaño), el foco, lo revelado o las opciones. En reposo, cada frame es un `drawImage`
  de esa capa más el flujo animado y el resaltado del foco.
- Con flujo animado activo y grafo en reposo, el bucle sigue (el flujo se mueve) pero
  **solo** dibuja el flujo sobre la capa copiada; sin flujo, **no hay
  `requestAnimationFrame`** en reposo (como ya hacen las disposiciones nuevas).

### B2. Flujo acotado (propuesta 2, decisión de arriba)

- Los guiones animados **no se dibujan** con `scale < 0,5` ni cuando las aristas
  visibles superan un techo (`FLUJO_MAX_ARISTAS = 1.500`); en esos casos la arista se
  dibuja solo con su trazo base (y flecha si la opción lo pide). La opción del menú no
  cambia de valor: se respeta en cuanto el zoom o el recorte lo permiten.
- Medido en `DEF-109`: con todo visible y flujo, 719 ms/frame a 2.000 nodos; sin flujo,
  15 ms.

### B3. Barnes-Hut y repulsión acotada (propuesta 3)

- `simulate()` reemplaza el bucle par a par por un **quadtree** (arrays tipados, `θ =
  0,9`, centro de masa por celda), como el prototipo de `DEF-109` (×4 a 2.000 nodos, ×7 a
  4.000) y como hace Obsidian. Además, **`distanciaMax`** para la repulsión (p. ej. `4·k`):
  los nodos más lejos no se calculan, con la misma clamp de fuerza que hoy.
- El layout resultante debe ser **indistinguible** del actual con la caché de posiciones
  de un vault (mismo `k`, misma gravedad, mismos resortes): comparalo visualmente y con
  una réplica en Node (energía final y radio del cúmulo con el mismo vault sintético).

### B4. Simulación en un Web Worker (propuesta 4)

- La física corre en un worker (`components/graph/sim.worker.ts`): el hilo principal
  manda `{ nodos: [id, x, y…], aristas: [[s, t]…], constantes }` al construir,
  `{ alpha, forzar: {id, x, y} }` al arrastrar y `{ constantes }` al cambiar opciones;
  el worker devuelve posiciones en un `Float32Array` transferido (`postMessage(buf,
  [buf.buffer])`) a un ritmo acotado (un mensaje por frame como máximo) y avisa cuando
  se asienta (`alpha < REST`) para que el hilo principal pare de pedir frames.
- Con `prefers-reduced-motion` o si el worker no está disponible, **cae al hilo
  principal** con el mismo `simulate()` (el módulo de física es puro y se importa desde
  los dos lados).
- Next.js: consultá `node_modules/next/dist/docs/` para la forma vigente de empaquetar
  un worker (`new Worker(new URL("./sim.worker.ts", import.meta.url))` o la que
  documente) y verificá que funciona en Tauri (`npx next build` + que el archivo del
  worker salga en `out/`). Si no se puede empaquetar limpio en esta versión, **B4 queda
  fuera** y se documenta; B1–B3 no dependen de él.

### B5. Criterios

1. Con `cumulo`, un vault de 1.000 notas quieto no ejecuta `requestAnimationFrame` sin
   flujo, y con flujo el frame en reposo cuesta menos de 5 ms (perfilador).
2. Con todo el grafo visible (zoom bajo), el frame no supera 20 ms a 2.000 nodos.
3. Arrastrar un nodo a 2.000 nodos va fluido (más de 30 fps).
4. Mismo aspecto: sprites, colores, glow de hover, flecha, nombres y grupos de color
   como hoy; guiones idénticos cuando se muestran.
5. `sustrato` sigue funcionando (comparte `simulate()`).
6. Todo lo de `FUN-L-23` (menú, disposiciones, construcción temporal) sigue igual.

---

## Versionado

Es la corrección de `DEF-109` más mejoras internas: **patch**, absorbido por la `2.2.0`
si sale con ella. No sube el framework de IA.

## Documentación

- «## Cómo quedó» en esta spec, por parte. `DEF-109` en [[bugs-progreso]] (implementado,
  sin confirmar). [[Rendimiento del grafo]]: qué propuestas quedaron hechas.
  [[Capa de datos del desktop]]: las tablas nuevas. [[RAMAS]]: `MiniGraph.tsx` y el
  worker a reflejar.

## Relacionadas

- [[Rendimiento del grafo]] — `DEF-109`, el diagnóstico y el plan.
- [[Como construye Obsidian su grafo]] — el modelo de referencia y el orden.
- [[grafo-disposiciones]] — `FUN-L-23`, que ya aplicó la capa estática a lo nuevo.
- [[auditoria-editor-y-enlaces]] — `FUN-M-40`, el resolutor único que llena la tabla.
- [[BACKLOG]] — `FUN-L-25`.
