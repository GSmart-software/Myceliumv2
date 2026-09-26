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
