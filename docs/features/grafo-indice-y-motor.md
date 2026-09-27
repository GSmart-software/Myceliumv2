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

## Cómo quedó · Parte B

Implementada el 2026-09-26 en `feat/grafo-motor-desktop` (B1–B5, con el worker adentro).
**Sin confirmar en la app**: lo medido es con réplicas y con el componente real en
Chromium headless, no en WebView2.

### Archivos

| Archivo | Qué |
|---|---|
| `frontend/components/graph/fisica.ts` | **Nuevo.** El motor de fuerzas, puro (sin DOM ni imports): posiciones, velocidades y aristas en arrays tipados; `repulsionBarnesHut` (quadtree con centro de masa, θ = 0,9, las hojas par a par con la fórmula exacta de siempre), `repulsionPares` (la de antes, como referencia), `paso` (repulsión → resortes → gravedad, rozamiento e integración, en el mismo orden y con las mismas constantes), `enfriar` y `constantesDe(disposicion)` (cúmulo 80/8/1, sustrato 45/6/0,7). |
| `frontend/components/graph/sim.worker.ts` | **Nuevo.** El worker: importa `fisica.ts` y responde cada pedido de paso con las posiciones en un `Float32Array` transferido. Exporta los tipos del protocolo. |
| `frontend/components/graph/motorFisica.ts` | **Nuevo.** Esconde dónde corre la física detrás de `tomar()` / `avanzar(alpha, fijo, activos)` / `colocar(i, x, y)`: en el worker o, como respaldo, en el hilo principal con el mismo módulo. |
| `frontend/components/graph/MiniGraph.tsx` | Solo el camino del cúmulo y el `simulate()` que comparte el sustrato: `SimNode` pierde `vx`/`vy` y gana `i` (su índice en el motor); lo que el hilo principal mueve a mano (arrastre, nodos que aparecen en la construcción temporal) pasa por `colocar`; el dibujo del cúmulo en tres pasadas con capas en reposo; el flujo acotado. El camino micelio (`tickMicelio`, `hifas.ts`, `disposiciones.ts`) no cambió salvo recibir las posiciones del motor. |
| `frontend/scripts/test-fisica.mjs` | **Nuevo.** 10 tests headless del motor (ver Verificación). |
| `frontend/tsconfig.json` | `exclude` suma `out`: Turbopack deja en `out/_next/static/media/` una copia cruda de `sim.worker.ts` y `tsc` fallaba sobre ella después de un `next build`. |

### B1 · Capa estática y reposo real

El dibujo del cúmulo va en tres pasadas, siempre en este orden: **aristas base** (que
además guarda la geometría de las visibles), **flujo**, y **flechas + nodos + nombres**.

- **En reposo**, las dos pasadas quietas se pintan a dos canvas offscreen que solo se
  repintan si algo las ensucia (vista, tamaño, foco, lo revelado, una opción, el
  movimiento reducido). Cada frame es copiar la capa de aristas, el flujo con la
  geometría guardada y la capa de nodos. Sin flujo, no hay `requestAnimationFrame`.
- **Mientras la simulación está activa** se dibuja directo, como antes. Es un desvío de
  la spec, medido: con las capas también durante la simulación, arrastrar a 1.000 nodos
  pasó de 13 a **60 ms** de JS por frame (y a 2.000, de 42 a 106), porque copiar una
  capa offscreen obliga a rasterizarla en ese momento, y con los nodos moviéndose se
  repintaba en cada frame igual. Un frame activo sin nada nuevo (el paso del worker
  todavía no volvió) y sin flujo no dibuja.

### B2 · Flujo acotado

`FLUJO_ZOOM_MIN = 0.5` y `FLUJO_MAX_ARISTAS = 1500` (aristas **visibles**, después del
culling). Fuera de eso queda el trazo base y la flecha si la opción la pide; la opción
del menú no cambia. Los guiones son los de siempre (mismo patrón, ancho, alfa, color y
velocidad).

### B3 · Barnes-Hut y repulsión acotada

Réplica en Node sobre un vault sintético (cada nota enlaza a 1–3 anteriores con
preferencia por los hubs, 15 % sueltas), 700 pasos desde cero y 400 pasos desde la caché
de posiciones (alpha 0,05, como al volver a la pestaña):

| Nodos | ms/paso pares → BH | Radio RMS del cúmulo asentado | Desde la caché: desplazamiento medio por nodo |
|---|---|---|---|
| 1.000 | 8,6 → 2,0 | 793 → 777 (−2 %) | pares 16,7 px · BH 19,5 px |
| 2.000 | 29 → 4,8 | 1.008 → 990 (−1,8 %) | 17,6 · 22,3 |
| 4.000 | 119 → 12 | 1.272 → 1.249 (−1,8 %) | 20,7 · 26,1 |
| 1.000, sustrato | 7,2 → 2,2 | 478 → 469 | 10,3 · 11,8 |

La energía cinética final queda en el mismo orden (1.000: 6,3 → 5,1; 2.000: 14 → 18) y la
longitud media de arista cambia menos de un 2 %. El −2 % de radio es el sesgo conocido de
θ = 0,9 (una celda lejana empuja algo menos que sus nodos sueltos; con θ = 0,5 baja a
−0,5 % pero cuesta el doble). El ruido entre dos semillas distintas con pares es del
0,1 %, así que el −2 % es real, pero **a simple vista es indistinguible**: desde la caché
cada nodo se mueve 3–5 px más que lo que ya se movía con la física anterior.

> [!warning] `distanciaMax` queda implementada pero **apagada** (`Infinity`)
> Desvío de la spec, medido a 1.000 nodos: cortar la repulsión a `4·k` achica el cúmulo
> un **30 %** (radio 793 → 550) y desde la caché mueve cada nodo 160 px; `8·k` −19 %,
> `12·k` −10 %, `16·k` −6 %. La gravedad (`0,004·x`) solo se equilibra con la **suma** de
> muchas repulsiones lejanas y débiles, y el corte se la quita. Y el ahorro es de un 10 %
> sobre Barnes-Hut (1,8 contra 2,0 ms), porque las celdas lejanas ya se calculan como un
> solo nodo. En Obsidian funciona porque su layout se calibró con el corte; acá cambiaría
> la forma del grafo de todos los vaults.

### B4 · Worker

- **Entró.** Turbopack (Next 16.2.9) reconoce `new Worker(new URL("./sim.worker.ts",
  import.meta.url), { type: "module" })`: genera un bootstrap
  `out/_next/static/chunks/turbopack-worker-*.js` que carga los chunks del worker con
  `importScripts` (worker clásico, mismo origen; el `type: "module"` lo descarta el
  runtime). Funciona con `output: export`: probado sirviendo `out/` como estático y
  arrancando el worker con la misma URL que arma el runtime (responde con
  `Float32Array`, 2,4 ms por paso a 500 nodos). La CSP de Tauri está en `null`.
  La doc de Next en `node_modules` solo lo menciona de pasada (los *magic comments*
  «funcionan con `new Worker()`»); lo demás salió de probar el build.
- **Protocolo**, con un cambio respecto de la spec: el hilo principal **pide** cada paso
  (`{ tipo: "paso", alpha, fijo, activos, colocados, buffer }`) y no pide otro hasta
  recibir la respuesta, así que hay como mucho un mensaje por frame por construcción. La
  energía (`alpha`) y el reposo los sigue llevando el hilo principal —es el que sabe si
  hay arrastre o paneo—, por eso no hace falta un aviso de «asentado»: el hilo principal
  deja de pedir. `alpha` baja un escalón por paso **dado** (no por frame), como antes.
  `iniciar` lleva posiciones, aristas, centro y constantes; `constantes` existe en el
  protocolo pero hoy cambiar de disposición reconstruye todo. El buffer de la respuesta
  se devuelve con el pedido siguiente (sin reservar uno por frame). Sin
  `SharedArrayBuffer`: exigiría cabeceras COOP/COEP en Tauri.
- **Respaldo en el hilo principal** con el mismo `fisica.ts`: sin `Worker`, con
  `prefers-reduced-motion` (leído al construir), si el worker falla al crearse o en
  marcha (el estado del hilo principal se mantiene espejado y sigue desde ahí), y con
  **menos de 200 nodos** (desvío: el mini-grafo del panel; ahí un paso cuesta menos de
  medio milisegundo y no vale un worker por grafo).
- Nota: Turbopack además copia la fuente cruda de `sim.worker.ts` a
  `out/_next/static/media/` (un módulo de URL que nadie usa, 3 KB). Es inocuo; por eso el
  `exclude` de `tsconfig.json`.

### B5 · Mediciones

Componente **real** (`MiniGraph.tsx` empaquetado con esbuild, stores sustituidos) en
Chromium headless de Playwright, 1.600 × 900, dpr 1, vault sintético con la caché de
posiciones ya asentada. «rAF/s» = frames por segundo que el bucle llegó a pedir; «JS» =
tiempo del callback en el hilo principal. **En headless el canvas rasteriza por software**
y eso limita los fps (sobre todo con nombres a zoom 1), así que los fps absolutos no son
los de WebView2 con GPU; la comparación antes/después sí vale.

| Caso | 1.000 nodos antes → después | 2.000 nodos antes → después |
|---|---|---|
| Reposo sin flujo | 0 rAF → 0 rAF (ya era así) | 0 → 0 |
| Tiempo hasta el reposo (zoom 1 / 0,3) | 39 / 27 s → 32 / 21 s | 78 / 66 s → 52 / 36 s |
| Reposo **con flujo**, zoom 1 | 7 rAF/s, 7,2 ms JS → **16,7 rAF/s, 0,85 ms** | 4,3 rAF/s, 9,4 ms → **0 rAF** (más de 1.500 aristas a la vista: sin guiones) |
| Reposo con flujo, zoom 0,3 (todo visible) | 17,7 rAF/s, 5,4 ms → **0 rAF** | 6,7 rAF/s, 12,3 ms → **0 rAF** |
| Arrastre, zoom 1 | 8,2 rAF/s, 12,9 ms → 8,8 rAF/s, **4,7 ms** (sin worker 5,6) | 3,8 rAF/s, 42,5 ms → 8,4 rAF/s, **5,9 ms** (sin worker 9,2) |
| Arrastre, zoom 0,3 (todo visible) | 14,1 rAF/s, 13,1 ms → **31,3 rAF/s, 3,9 ms** (sin worker 5,4) | 5,9 rAF/s, 42,4 ms → **14,8 rAF/s, 6,9 ms** (sin worker 10,6) |

Contra los criterios: (1) sin flujo, en reposo no hay rAF; con flujo, el frame de reposo
cuesta 0,85 ms de JS (< 5 ms). (2) Todo visible a 2.000 nodos: 6,9 ms de JS por frame
incluso arrastrando (< 20 ms); el resto del frame en headless es rasterizado por software.
(3) Arrastre a 2.000 nodos: el hilo principal pasó de 42 a 6–7 ms por frame; que llegue a
más de 30 fps en WebView2 **hay que confirmarlo en la app** (en headless el techo lo pone
el rasterizado). (4)–(6) ver abajo.

### Lo que se apartó de la spec

- Capas solo en reposo; directo mientras simula (B1, medido arriba).
- `distanciaMax` apagada (B3, medido arriba).
- Protocolo del worker por pedido, sin aviso de asentado (B4).
- Worker solo desde 200 nodos (B4).
- **Orden de pintado del flujo**: antes cada arista se dibujaba entera (base, guiones,
  flecha) antes de la siguiente; ahora todas las bases, después todos los guiones,
  después todas las flechas. La única diferencia posible es que el guion de una arista
  quede por encima de la base tenue (alfa 0,22) de otra que la cruza. No se notó en las
  capturas.

### Verificación

- `npx tsc --noEmit -p tsconfig.json`: sin errores (también después de `next build`).
- `node --test scripts/test-*.mjs`: **468 en verde** (458 + 10 nuevos de
  `test-fisica.mjs`: Barnes-Hut con θ = 0 es exactamente los pares; con θ = 0,9 error
  relativo < 8 % y sesgo < 3 %, y converge al bajar θ; `distanciaMax` corta y dentro del
  corte coincide con los pares filtrados a mano; determinismo con semilla; `paso()` con
  pares reproduce **número por número** el `simulate()` anterior; nodos superpuestos se
  separan; activos, arrastrado y centro; el árbol crece con 5.000 nodos apretados; y
  Barnes-Hut es varias veces más rápido a 2.000 nodos).
- `npx next build`: verde, con `turbopack-worker-*.js` en `out/_next/static/chunks/`.
- Capturas del componente real: cúmulo a zoom 1 con flujo y con flecha + flujo, cúmulo a
  zoom 0,3, sustrato con worker y anillo: se ven como antes.

### Queda por confirmar en la app

1. Con el flujo animado (el valor por defecto) y el grafo quieto, el perfilador muestra
   frames de menos de 5 ms; con el flujo apagado, ninguno.
2. Los guiones se ven igual que antes con zoom ≥ 0,5; al alejar por debajo de 0,5
   desaparecen y vuelven al acercar. En un vault grande, con más de 1.500 aristas en
   pantalla, no hay guiones (decisión de la spec); ver si el techo resulta bajo.
3. Arrastrar un nodo a 2.000 notas va fluido; hover, brillo de las aristas, colores de
   grupo, flecha y nombres, como siempre.
4. El layout con la caché de posiciones de un vault real es indistinguible del de antes.
5. El sustrato se asienta y se detiene como antes; la construcción temporal funciona en
   cúmulo y sustrato (los nodos que aparecen pasan al worker con `colocar`).
6. El worker carga en Tauri: en las devtools, sin errores en la consola al abrir el grafo
   global (si fallara, cae en silencio al hilo principal y el grafo anda igual, más lento).
7. El mini-grafo del panel (menos de 200 nodos, sin worker) sigue igual.

---

## Parte C · Ciclo de asentamiento (segunda pasada, 2026-09-26)

El usuario probó la Parte B en la app con la Tesina y **sigue lejos de Obsidian**: el
grafo tarda decenas de segundos en asentarse y pierde fps mientras tanto. El propio
informe de la Parte B lo anticipaba: «tiempo hasta asentarse 39 → 32 s a 1.000 nodos, 78 →
52 s a 2.000». Obsidian asienta el mismo vault en pocos segundos. No es la repulsión: es
el ciclo.

### Diagnóstico (código integrado en `a2235d9`)

| Qué | Mycelium | Obsidian / `d3-force` |
|---|---|---|
| Quién marca el ritmo de la física | El hilo principal: pide **un paso por frame** al worker y no pide otro hasta el `requestAnimationFrame` siguiente (`motorFisica.ts`, `sim.worker.ts`) | El worker corre **libre** (`run: true`) y el hilo principal dibuja las posiciones que le llegan |
| Pasos hasta asentarse | `alpha ×= 0,995` por paso: 1 → 0,03 son **700 pasos** (`MiniGraph.tsx:432`), más 5 s de gracia | `alphaDecay ≈ 0,0228`: **~300 pasos** a `alphaMin 0,001`; y Obsidian arranca en `alpha 0,3` |
| Posiciones iniciales | Al azar en un disco de radio 50–140 (`MiniGraph.tsx:272`): 1.300 nodos apretados que deben expandirse a empujones | Filotaxis (`d3`): radio `10·√i`, ya repartidos, poca energía que disipar |
| Nombres durante la simulación | Con `scale > 0,5`, **todos** los visibles con `fillText` en cada frame (`MiniGraph.tsx:837`) | Texto como texturas en GPU y atenuado por zoom |

### Qué cambiar (solo `cumulo` y `sustrato`; `fisica.ts` no cambia salvo constantes)

1. **Worker libre.** Protocolo nuevo: `{ tipo: "correr", alpha, alphaObjetivo }` y `{ tipo:
   "parar" }`. El worker itera por su cuenta (bucle con `setTimeout(0)` o
   `MessageChannel`), tantos pasos como pueda, y **publica posiciones como máximo cada
   16 ms** (un `Float32Array` transferido; si el principal no consumió el anterior, se
   descarta el viejo). Lleva él `alpha` y avisa `{ tipo: "asentado" }` al bajar de
   `alphaMin`. Arrastre: `{ tipo: "fijar", id, x, y }` sube `alphaObjetivo` a 0,3 mientras
   dura, como Obsidian. En el hilo principal (fallback), varios pasos por frame dentro
   de un presupuesto de 6 ms.
2. **Decaimiento como `d3`**: `alpha += (alphaObjetivo − alpha) · alphaDecay` con
   `alphaDecay = 1 − 0,001^(1/300)` y `alphaMin = 0,001`; `velocityDecay 0,4` en vez del
   `×0,85` actual, ajustando `k`/fuerzas para que el layout final sea el mismo (medilo:
   radio del cúmulo y energía, como en la Parte B). Arranque en frío `alpha 1`; con caché
   de posiciones, `0,05`; nodos nuevos, `0,3`. `IDLE_GRACE_MS` baja a 1.000.
3. **Siembra en filotaxis** para los nodos sin caché: radio `k/4 · √i`, ángulo
   `i · 2,3999` (ángulo áureo), centrada en el nodo central si lo hay. Los nodos nuevos
   con vecinos ya colocados siguen naciendo junto a ellos.
4. **Nombres mientras simula**: con `alpha > 0,05` solo hubs (los 24 de más grado),
   hover y centro; el resto aparece al asentarse, en la capa estática, y con el mismo
   «sin pisarse» de `hifas.ts`. Con `scale > 0,5` en reposo, todos como hoy.
5. **Verificable por el usuario**: una línea en consola al construir el grafo («grafo:
   física en worker/hilo principal, N nodos») y otra al asentarse con el tiempo total,
   para que la comprobación en F12 sea inmediata.

> [!important] Lo que la prueba del usuario agregó (2026-09-26, `tauri dev`, Tesina)
> «Los nodos tardan mucho en reubicarse, con tirones muy grandes; mover un nodo genera un
> bajo rendimiento gigantesco; no son solo los nodos, son también las líneas». Además del
> ciclo, **el dibujo durante el movimiento** es el otro techo: mientras `alpha` es alto,
> el cúmulo dibuja directo en cada frame las 3.275 curvas bézier con un `stroke()` cada
> una, los sprites con glow y los nombres, a fidelidad completa y a la DPR real de
> WebView2 (más píxeles que el headless donde se midió la Parte B).

6. **Fidelidad reducida mientras simula** (o mientras se arrastra): aristas como líneas
   rectas agrupadas en paths de ~256 segmentos por `stroke()` (un solo path con miles de
   subtrazos se midió peor; el punto medio son lotes chicos), sin flujo ni flecha; nodos
   como discos planos sin sprite; nombres solo hubs, hover y centro. Al asentarse, **un**
   repintado a fidelidad completa en la capa estática.
7. **Presupuesto de frame adaptativo**: si el último `draw()` superó ~12 ms, se salta el
   dibujo de la siguiente actualización de posiciones. La física no se frena.
8. **Sin basura por frame**: dos buffers de posiciones en ping-pong entre el worker y el
   hilo principal (transferidos), no un `Float32Array` nuevo por mensaje: el GC a 60
   mensajes/s es una fuente de tirones.
9. **Medición con el grafo real de la Tesina** (1.306 nodos, 3.275 aristas, grado máximo
   320; se extrae con `docs/design/demos/extraer-vault.mjs`), en Playwright con
   `deviceScaleFactor 1.5`: tiempo hasta asentarse, `draw()` p50/p95 simulando y
   arrastrando, y frames largos (>50 ms), antes y después.

### Criterios

1. Tesina (1.306 notas, sin caché de posiciones): **asentado en menos de 8 s** en la app,
   con la consola diciéndolo; con caché, menos de 1 s.
2. Mientras asienta, el hilo principal no supera 8 ms por frame a 1.300 nodos
   (perfilador); los nombres completos aparecen al asentarse.
3. El layout final es del mismo tipo que hoy (radio ±5 %, mismos cúmulos), medido en Node.
4. Arrastrar responde sin retraso perceptible (el worker sube `alphaObjetivo`, no espera
   al frame).
5. Todo lo anterior de la Parte B sigue (0 rAF en reposo sin flujo; flujo acotado).
6. **Ningún frame de más de 50 ms** mientras el grafo se mueve o se arrastra, con el
   grafo real de la Tesina a DPR 1,5.

## Cómo quedó · Parte C

Implementada el 2026-09-26 en `feat/grafo-asentamiento-desktop`: los cinco cambios de
arriba más cuatro que sumó el orquestador tras la prueba del usuario con la Tesina («los
nodos tardan mucho en reubicarse, con tirones muy grandes; mover un nodo genera un bajo
rendimiento gigantesco»): **fidelidad reducida mientras se mueve**, **presupuesto de frame
adaptativo**, **buffers en ping-pong** y **medir con el grafo real de la Tesina**.
**Sin confirmar en la app**: lo medido es con réplicas en Node y con el componente real en
Chromium headless, no en WebView2.

### Archivos

| Archivo | Qué |
|---|---|
| `frontend/components/graph/fisica.ts` | Constantes del ciclo de `d3-force` (`ALPHA_MIN`, `ALPHA_DECAY`, `enfriar(alpha, objetivo)`), y en `ConstantesFisica` tres campos: `ganancia` (12), `rozamiento` (0,4, el `velocityDecay`) y `velocidadMax` (`k`). En `paso`, la **inercia de los hubs** (ver abajo). Las fuerzas, Barnes-Hut y su orden no cambiaron. |
| `frontend/components/graph/cicloFisica.ts` | **Nuevo.** El ciclo, puro: `crearCiclo`, `calentar`, `fijar`/`soltar` (arrastre con `alphaObjetivo` 0,3), `colocarEn`, `avanzarCiclo(presupuesto)` y `sembrarFilotaxis`. Lo usan el worker, el respaldo del hilo principal y los tests. |
| `frontend/components/graph/sim.worker.ts` | Reescrito: corre **libre** (tandas de 8 ms cediendo con `MessageChannel`), publica como mucho cada 16 ms en **dos buffers en ping-pong**, lleva `alpha` y publica la última posición con `asentado: true`. Protocolo nuevo: `iniciar`, `correr`, `parar`, `fijar`, `soltar`, `colocar`, `activos`, `devolver`. |
| `frontend/components/graph/motorFisica.ts` | Reescrito: `correr`/`fijar`/`soltar`/`colocar`/`activos`/`avanzar`/`tomar`, `corriendo`, `alpha` y el aviso `alAsentar`. Respaldo en el hilo principal con 6 ms de física por frame. `colocar`/`fijar` llevan un número de secuencia: lo que el hilo principal movió no lo pisa una publicación vieja. |
| `frontend/components/graph/MiniGraph.tsx` | Solo el cúmulo (y lo que comparte el sustrato): la siembra, el motor nuevo, los nombres, el dibujo en tres modos (`rapido`, `directo`, `reposo`), el presupuesto adaptativo y la consola. |
| `frontend/scripts/test-fisica.mjs` | Ajustado: constantes nuevas, el decaimiento, y el test «número por número» contra el `simulate()` viejo ahora pasa las constantes de antes explícitas. 11 tests. |
| `frontend/scripts/test-ciclo.mjs` | **Nuevo.** 8 tests del ciclo y la siembra (ver Verificación). |

### El ciclo (cambios 1 y 2)

- **Worker libre.** El hilo principal ya no pide pasos: el worker los da solo y avisa al
  asentarse. Era la causa de los decenas de segundos: un paso por frame, y con frames lentos
  (rasterizado) pocos pasos por segundo. Los 300 pasos de la Tesina son **0,9 s** de
  física (3 ms por paso en Node).
- **Decaimiento de `d3`**: `alpha += (objetivo − alpha)·(1 − 0,001^(1/300))`; asentado al
  bajar de 0,001. Desde 1 son 300 pasos; desde la caché (0,05) 170; desde 0,3 (nodos nuevos,
  al soltar un arrastre) 248. `IDLE_GRACE_MS` 5.000 → 1.000.
- **`resize` ya no da energía.** Antes `alpha = max(alpha, 0,3)` en cada `resize`, y montar
  el componente dispara uno: **con caché el grafo re-simulaba desde 0,3** (460 pasos) cada vez
  que se abría la pestaña. Por eso la Parte B medía 38 s «con caché». El tamaño del lienzo no
  cambia el layout.
- **Ganancia 12.** Con 300 pasos en vez de ~1.000 (700 hasta `REST` más la gracia) y el
  rozamiento de `d3` (se pierde el 40 % de la velocidad por paso, no el 15 %), el grafo no
  llegaba a expandirse: −11 % de radio con ganancia 2. Multiplicar TODAS las fuerzas por
  igual no mueve el equilibrio (fuerza nula = reposo), solo acelera el camino. Medido en la
  réplica (siembra en filotaxis, ciclo nuevo, contra el ciclo de antes con su siembra; radio
  RMS del cúmulo asentado):

  | Grafo | Radio antes | Ganancia 2 | 6 | 10 | **12** | 14 | Arista media antes → 12 |
  |---|---|---|---|---|---|---|---|
  | Tesina (1.306, grado máx. 320) | 953 | −10,6 % | −4,2 % | −3,0 % | **−2,3 %** | −1,9 % | 223 → 241 |
  | Sintético 1.000 | 779 | −13,1 % | −5,2 % | −2,5 % | **−1,8 %** | −0,7 % | 359 → 370 |
  | Sintético 2.000 | 990 | −12,7 % | −5,2 % | −2,4 % | **−1,8 %** | −1,3 % | 436 → 452 |
  | Tesina, sustrato | 576 | | | | **−2,2 %** | | 135 → 145 |

  La energía final baja (|v| medio 0,02 → 0,008 px/paso en la Tesina). Desde la caché con
  alpha 0,05 cada nodo se mueve 7–13 px (la Parte B medía 17–22 px con el ciclo viejo). La
  correlación de distancias entre pares contra el layout de antes es 0,35, pero entre dos
  semillas del **mismo** ciclo viejo es 0,5–0,6: el cúmulo tiene muchos mínimos locales, y
  con el ciclo viejo arrancado desde la filotaxis la correlación con el nuevo sube a 0,8–0,9.
  Es decir: mismo tipo de layout, distinta disposición concreta según la siembra.
- **Inercia de los hubs** (desvío: `fisica.ts` cambia algo más que constantes). Con la
  ganancia, el hub de 320 enlaces de la Tesina **vibraba** de un paso al otro a 80 px (el
  tope) mientras se arrastraba: sus resortes suman `0,01·320·alpha·ganancia` = 11,5 con
  alpha 0,3, y con el rozamiento de `d3` el integrador diverge por encima de ~5,3. Cada nodo
  reparte ahora la fuerza del paso en `m = grado·0,01·ganancia/2,5` pasos (si `m > 1`): no
  cambia dónde está el equilibrio, solo cómo se llega. Con alpha 0,3 sostenida, velocidad
  máxima de un nodo: ciclo viejo 14 px/paso; ganancia 10 sin inercia 80 (el hub); con
  inercia 22. Hay un test que falla sin ella.
- **Tope de velocidad** en `k` por paso: red de seguridad (sin él, la ganancia 4 ya hacía
  estallar la Tesina desde la filotaxis: radios de 10¹⁹).
- **Arrastre**: `fijar` sube `alphaObjetivo` a 0,3 en el worker (no espera a un frame);
  `soltar` lo baja a 0 y el grafo se asienta en 248 pasos.
- **Simulación continua** (`graphContinuousSim`): el objetivo no baja de 0,002 (la misma
  fuerza efectiva que el piso 0,02 de antes) y, ya casi quieto, el worker da un paso cada
  16 ms en vez de correr libre.
- **Respaldo en el hilo principal** (sin `Worker`, movimiento reducido, menos de 200 nodos
  o fallo del worker): los pasos que quepan en 6 ms por frame.

### Siembra (cambio 3)

Filotaxis `k/4·√i` con el ángulo áureo: el nodo central primero (cae en el origen) y
después por cantidad de enlaces, así los hubs nacen donde la gravedad los terminaría
llevando. Los nodos sin caché que tienen algún vecino con caché nacen junto a él (±`k/8`).
El sustrato conserva su propia siembra (`siembraSustrato`, sin tocar).

### El dibujo mientras se mueve (cambios 4 y 6–8)

- **Tres modos** en `draw`: `rapido` (se mueve, 200 nodos o más), `directo` (se mueve en
  grafos chicos, o simulación continua casi quieta) y `reposo`.
- **`rapido`**: aristas rectas, sin flujo ni flecha; nodos como discos planos agrupados por
  color; solo los nombres de los 24 hubs, el apuntado y el centro. Al asentarse, un único
  repintado a fidelidad completa.
- **Desvío: un `stroke()` por arista, sin lotes.** El encargo pedía lotes de ~256
  segmentos. Medido con la Tesina asentada (1.600 × 900 a dpr 1,5, rasterizado forzado con
  `getImageData`; mediana de 5):

  | Qué | Zoom 0,35 raster / JS | Zoom 1 raster / JS |
  |---|---|---|
  | Aristas bézier, un stroke c/u (fidelidad completa) | 53,6 / 3,3 ms | 133 / 3,8 ms |
  | **Aristas rectas, un stroke c/u** | **35,5 / 1,5 ms** | **128 / 1,8 ms** |
  | Rectas en lotes de 16 | 45,2 / 1,1 | 149 / 1,0 |
  | Rectas en lotes de 64 | 58,4 / 0,5 | 161 / 0,5 |
  | Rectas en lotes de 256 | 75,1 / 0,3 | 195 / 0,6 |
  | Nodos: sprite con glow (`drawImage`) | 29,1 / 3,1 | 15,6 / 2,7 |
  | **Nodos: disco, un `fill()` c/u** | **6,1 / 0,5** | **10,2 / 0,7** |
  | Discos en lotes de 256 | 8,1 / 0,8 | 12,8 / 1,0 |

  Agrupar empeora el rasterizado de forma monótona y ahorra un milisegundo de JS: es el
  mismo fenómeno que `DEF-109` midió con un único path (68 contra 20 ms). En el banco del
  componente, pasar de lotes de 256 a un trazo por arista subió el asentamiento a zoom 0,35
  de 30 a 36 fps y el arrastre de 11 a 15.
- **Nombres sin pisarse** en reposo (modo «todos», zoom > 0,5): se escriben por
  importancia (apuntado, centro y después por enlaces) y se salta el que caería encima de
  uno ya escrito, con una rejilla de 96 px en pantalla (el `ocupados` de `hifas.ts` compara
  todos contra todos). Los anchos se miden una vez por nodo. Los modos «vecinos» y
  «apuntado» no cambian.
- **Presupuesto adaptativo**: si un `draw()` en movimiento pasó de 12 ms, el siguiente lote
  de posiciones no se pinta (queda sucio para el próximo frame). La física no se entera.
- **Reposo sin capas cuando no hay flujo** (desvío, no estaba pedido): las capas de la Parte
  B solo sirven para animar el flujo encima; si el flujo no se puede ver (opción, movimiento
  reducido, zoom < 0,5 o más de 1.500 aristas a la vista, que ahora se cuentan antes de
  pintar), el reposo pinta **directo**. Medido: el frame en que el grafo se asienta a zoom 1
  costaba **256 ms de JS** con capas (162 de ellos copiando la capa de aristas, que obliga a
  rasterizarla ahí) y ahora 28–41 ms; a zoom 0,35, de 94 a 14 ms.
- **Ping-pong**: dos `Float32Array` que van y vuelven; si llegan dos publicaciones antes de
  un frame, la vieja se devuelve sin copiar.

### Consola (cambio 5)

Solo el grafo global (sin nodo central; el del panel se reconstruye con cada nota):

```
grafo: física en worker, 1306 nodos, 3275 aristas
grafo: asentado en 1.4 s, 300 pasos
```

Tras un arrastre, «asentado en…» cuenta desde que se suelta.

### Mediciones

Componente **real** (`MiniGraph.tsx` empaquetado con esbuild, stores sustituidos) con el
grafo de la Tesina extraído con `docs/design/demos/extraer-vault.mjs` (1.306 nodos, 3.275
aristas, grado máximo 320, 559 sin enlaces), Chromium headless de Playwright, 1.600 × 900,
**`deviceScaleFactor` 1,5**. «Antes» = `desktop-tauri` en `4ac1ba9` (Parte B). «JS» = tiempo
del callback de `requestAnimationFrame` (física local + `draw()`); «huecos» = intervalos
entre frames de más de 50 ms. Antes no había consola: su asentamiento es cuando el bucle se
detuvo menos los 5 s de gracia.

| Caso | Antes | Después (worker) |
|---|---|---|
| Sin caché, zoom 0,35: asentado | **58 s**, 12 fps | **1,4 s**, 36 fps |
| — JS p50 / p95 / máx; frames > 50 ms de JS | 7,0 / 9,0 / 87 ms; 1 | 0,1 / 3,4 / 14 ms; 0 |
| — huecos > 50 ms | 761 de 766 frames | 10 de 85 |
| Con caché, zoom 0,35: asentado | 38 s | **0,9 s** |
| Arrastre 4 s, zoom 0,35: JS p50 / p95 / máx | 7,6 / 9,5 / 12 ms, 13 fps | 2,6 / 6,8 / 11 ms, 15 fps |
| Tras soltar, zoom 0,35: asentado | 42 s | 1,4 s |
| Sin caché, zoom 1: asentado | **114 s**, 6 fps | **2,0 s**, 19 fps |
| — JS p50 / p95 / máx; frames > 50 ms de JS | 8,2 / 10,9 / 218 ms; 2 | 0,2 / 5,4 / 41 ms; 0 |
| Con caché, zoom 1: asentado | 77 s | 1,3 s |
| Arrastre 4 s, zoom 1: JS p50 / p95 / máx | 9,5 / 10,6 / 12 ms, 6 fps | 2,8 / 5,1 / 6,3 ms, 7 fps |
| Tras soltar, zoom 1: asentado | 84 s | 1,2 s |

**Respaldo en el hilo principal** (sin `Worker`), zoom 0,35: asentado en 11 s sin caché y
6,7 s con caché (a ~20 fps de headless, uno o dos pasos por frame); JS p50 / p95 9,9 / 12,6 ms.
En WebView2 a 60 fps serían ~2,5 s.

Contra los criterios: (1) **< 8 s sin caché y < 1 s con caché**: 1,4–2,0 s y 0,9–1,3 s en
headless, con la consola diciéndolo. (2) **< 8 ms por frame mientras asienta**: p95 3,4–5,4 ms
de JS; los nombres completos aparecen al asentarse. (3) **Radio ±5 %**: −1,8 a −2,3 % (tabla
de la ganancia). (4) **Arrastre sin retraso**: `fijar` llega al worker entre tandas de 8 ms.
(5) **Parte B**: sin flujo, 0 rAF en reposo (el bucle se detiene 1 s después de asentarse);
flujo acotado igual. **Ningún frame de más de 50 ms de JS mientras se mueve** (el máximo en
movimiento es 14 ms); el de 28–41 ms a zoom 1 es el repintado a fidelidad completa, una vez,
al asentarse.

> [!warning] Los huecos de más de 50 ms que quedan son del rasterizado por software de headless
> En headless el canvas se rasteriza por CPU: a zoom 1 las 3.275 aristas rectas cuestan
> 128 ms de rasterizado (tabla de arriba) aunque el JS del frame sea de 3 ms. Eso limita los
> fps del banco (7 al arrastrar a zoom 1) y no es lo que pasa en WebView2 con GPU. Probar
> Chromium con GPU (`--use-angle=d3d11`) no dio frames utilizables en headless. **Los fps y
> los frames largos reales solo se ven en la app** (perfilador de F12).

### Lo que se apartó del encargo

- Inercia de los hubs y tope de velocidad en `fisica.ts` (medido arriba; sin ellos la
  ganancia no es estable con hubs).
- Un trazo por arista y un relleno por disco, sin lotes (medido arriba).
- Reposo directo sin capas cuando el flujo no se puede ver (medido arriba).
- Fidelidad reducida solo desde 200 nodos: el mini-grafo del panel se asienta en pocos
  frames y alternar discos y sprites se vería como un parpadeo.
- En modo `rapido` los nombres son solo hubs/apuntado/centro durante **todo** el
  movimiento, no solo con `alpha > 0,05` (desde 0,05 hasta asentarse son ~0,5 s).
- La filotaxis ordena por enlaces (el orden del índice queda para `d3`); la réplica no
  mostró diferencia de radio entre los dos órdenes y así los hubs nacen al centro.

### Verificación

- `npx tsc --noEmit -p tsconfig.json`: sin errores (también después de `next build`).
- `node --test scripts/test-*.mjs`: **485 en verde, 7 saltados** (476 de antes + 1 nuevo en `test-fisica.mjs`, el decaimiento, + 8 de `test-ciclo.mjs`: pasos hasta `alphaMin` desde 1, 0,05 y 0,3; `calentar`; arrastre que no se asienta y se asienta al soltar; simulación continua; presupuesto por tanda; filotaxis —radio, ángulo áureo, distancia mínima—; hub de 400 enlaces sin vibrar —falla sin la inercia—; y radio ±5 % contra el ciclo de antes).
- `npx next build`: verde, con `turbopack-worker-*.js` en `out/_next/static/chunks/` y el ciclo empaquetado en los chunks del worker.

### Qué confirmar en la app (y qué mirar en F12)

1. Abrir el grafo global con la Tesina **sin caché** (primera vez tras reiniciar la app, o
   cambiando de disposición y volviendo): en la consola, `grafo: física en worker, 1306
   nodos, 3275 aristas` y, a los pocos segundos, `grafo: asentado en X s, 300 pasos` con
   **X < 8**. Si dice «hilo principal», el worker no cargó (y el grafo anda igual, más lento).
2. Cerrar y volver a abrir la pestaña del grafo (con caché): `asentado en` **menos de 1 s**,
   170 pasos, y el grafo casi no se mueve.
3. Mientras se asienta, se ven líneas rectas y discos planos, con los nombres de los hubs;
   al asentarse, un único cambio a curvas, brillo y todos los nombres que entran sin
   pisarse. Ver si ese cambio molesta.
4. Arrastrar un nodo (incluido el hub de 320 enlaces): responde sin retraso, el resto se
   reacomoda sin tirones ni vibración; al soltar, `asentado en ~1 s, 248 pasos`.
5. Perfilador de F12 (Performance) mientras asienta y mientras se arrastra: ningún frame
   de más de 50 ms; tareas del hilo principal de pocos milisegundos.
6. El layout asentado se ve del mismo tipo que antes (mismo tamaño, hubs al centro).
7. Sustrato: se asienta rápido y se detiene; la construcción temporal crece y se asienta.
8. Mini-grafo del panel: igual que antes (sin discos planos).

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
