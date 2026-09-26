# Disposiciones del grafo (`FUN-L-23` · `GRAPH-DISPOSICIONES`)

El grafo global gana **tres disposiciones** además de la actual, y el usuario elige cuál
usa **cada vault** desde el menú del grafo. Vienen de la exploración de representaciones
inspiradas en el micelio del 2026-09-25/26 ([[Representaciones de micelio para el grafo]]):
se probaron cuatro sobre un vault sintético y sobre dos vaults reales, y el usuario decidió
el 2026-09-26 **conservar la actual y sumar tres**: «Anillo de colonias», «Crecimiento» y
«Sustrato». El «Rizoma radial» quedó **descartado**: presupone una nota raíz de la que
cuelga todo, y los vaults que se trabajan con Mycelium no se estructuran así.

> [!info] Alcance: **AMBAS (igual)**
> Todo vive en el frontend compartido —`components/graph/MiniGraph.tsx`, `GraphView.tsx`,
> `GraphOptionsMenu.tsx`, `stores/prefsVaultStore.ts`— y el dato que consume (nodos con
> `creadoEn`, aristas, carpetas) ya lo dan las dos versiones. Se implementa en desktop y se
> refleja a web con [[Reflejar cambios de desktop a web]].

> [!important] Solo el grafo global
> El **mini-grafo** del panel de una nota (`NotePanel.tsx`) sigue como está: es un
> vecindario de un salto con la nota al centro, y ninguna de las disposiciones nuevas tiene
> sentido ahí.

## 1. Las cuatro disposiciones

| Disposición | Valor de la preferencia | Cómo se colocan los nodos | Física |
|---|---|---|---|
| **Cúmulo** (la actual) | `cumulo` | Repulsión entre todos + resortes en las aristas + gravedad al centro, como hoy | Sí, continua hasta asentarse |
| **Anillo de colonias** | `anillo` | Todos los nodos en una circunferencia, agrupados por **carpeta de primer nivel** y, dentro, por subcarpeta y título | No |
| **Crecimiento** | `crecimiento` | En **orden de creación**: cada nota brota cerca de las notas que ya enlazaba (o enlazan a ella); sin vecinas, cerca de las notas de su carpeta; sin nada, en la frontera de la colonia | No |
| **Sustrato** | `sustrato` | La misma simulación del cúmulo, con repulsión y reposo más cortos, dibujada como micelio | Sí, la del cúmulo |

Las cuatro comparten **todo lo demás**: zoom y desplazamiento, apuntar y hacer clic para
abrir, el foco en blanco y los que lo referencian en `--mic-accent`, los grupos de color,
las reglas de exclusión, los modos de nombres (`FUN-M-21`), la construcción temporal y la
caché de vista al cambiar de pestaña.

### 1.1 Anillo de colonias

- **Orden**: por carpeta de primer nivel (las notas de la raíz forman una «colonia» propia
  llamada «Raíz»), luego subcarpeta, luego título. Un hueco pequeño entre colonias.
- **Radio**: `max(420, N · 2,3 / 2π)` unidades de mundo, para que los nodos no se pisen
  con cualquier N.
- **Arcos**: cada colonia lleva un arco fuera del anillo con su **tinte** (ver § 3) y su
  nombre por fuera, en pantalla, siempre legible (tamaño fijo, no escala con el zoom).
- **Aristas**: las que unen dos notas de la **misma colonia** se curvan cerca del borde
  (cuadrática con control a `R · max(0,12; 1 − 1,6 · separación angular)`) y llevan el
  tinte de la colonia; las que **cruzan** colonias pasan por el centro (cúbica con controles
  a `0,12 · R` de cada extremo) en el color de hifa tenue. Son trazos, no hifas ahusadas.
- **Nombres**: en modo «todos», los hubs solo se rotulan con zoom ≥ 1; los vecinos del
  foco y el foco, siempre. Con muchos nodos cada punto es pequeño: la vista es para leer
  **carpetas**, no notas.

### 1.2 Crecimiento

- **Orden**: por `creadoEn` ascendente; a igual fecha, por `id`. Es el mismo orden que ya
  usa la construcción temporal.
- **Colocación**, nota por nota:
  1. Si tiene vecinas ya colocadas (en cualquiera de las dos direcciones): en el centroide
     de esas vecinas, desplazada de 26 a 56 unidades en una dirección **al azar**, con un
     35 % de probabilidad sesgada hacia afuera de la colonia (desde el origen) para que el
     micelio avance en vez de apretarse.
  2. Si no, pero su carpeta ya tiene notas colocadas: en el centroide de esas notas, a
     30–120 unidades en dirección al azar.
  3. Si no: en la frontera actual de la colonia (radio máximo alcanzado + 20), en un ángulo
     al azar.
  4. Si el sitio está a menos de 14 unidades de otra nota, se empuja hacia afuera en
     espiral (hasta 40 intentos) con una rejilla de 22 unidades.
- **El azar es determinista**: generador con semilla fija, para que el mismo vault dé el
  mismo dibujo en cada apertura.
- **Estabilidad**: una nota solo se coloca mirando a las **anteriores**, así que agregar
  notas nuevas **no mueve** las existentes. Una nota con fecha anterior a otras ya
  colocadas (p. ej. importada con su fecha original) sí puede desplazar a las que le siguen:
  limitación aceptada.
- **Aristas**: hifas ahusadas de la nota **más vieja** a la **más nueva** (así se ve hacia
  dónde creció), con leve curvatura determinista por arista. Grosor en la base
  `0,6 + min(grado de la vieja, 40) · 0,05`, punta `0,35`.
- **Construcción temporal**: las hifas de las notas recién reveladas **crecen** (se dibujan
  parcialmente durante ~420 ms). Con `prefers-reduced-motion` aparecen completas.

### 1.3 Sustrato

- **Simulación**: la de `simulate()` del cúmulo, con `k = 45` (repulsión y reposo; el
  cúmulo usa 80), fuerza de repulsión al 70 % y tope 6. Comparte el idle-stop, la
  simulación continua opcional y la caché de posiciones. Cualquier mejora al motor
  (`DEF-109`) le llega sola.
- **Sustrato**: un halo difuso por nodo bajo todo lo demás (sprite radial de
  `rgba(glow, 0,10)` con radio `18 + min(grado, 60) · 1,2`), que da cuerpo a las zonas
  densas.
- **Aristas**: hifas ahusadas de la nota más vieja a la más nueva, como en Crecimiento,
  en color tenue (§ 3).

### 1.4 Lo que NO cambia en el cúmulo

La disposición actual conserva **exactamente** su simulación, su dibujo, sus opciones de
indicador de dirección y su brillo de hover. Este trabajo no la toca; el rendimiento del
cúmulo es `DEF-109` y va aparte.

## 2. Dibujo de las disposiciones nuevas

- **Hifa ahusada**: un polígono relleno a lo largo de una bézier cuadrática, con ancho que
  va de `w0` a `w1` y un leve ondular (`sin` con amplitud `min(largo · 0,045; 6)`) para
  que no parezca una línea. Ocho segmentos por hifa.
- **Esporas y cuerpos fructíferos**: los nodos con 20 o más conexiones se dibujan como
  cuerpos fructíferos (disco crema `#F2E4C4` con glow, como el nodo central de hoy); el
  resto, como esporas pequeñas del color del glow (o del grupo de color, si tienen).
  El radio sigue la fórmula actual (`4 + conexiones · 1,6`, tope 15) **dividida por 2**
  en estas disposiciones, porque hay muchos más nodos en pantalla que en el mini-grafo
  para el que se calibró.
- **Nombres**: en pantalla, no en el mundo (11 px fijos, con fondo semitransparente), y
  **sin pisarse**: una etiqueta que solaparía a otra ya puesta no se dibuja, salvo la del
  foco y sus vecinas.
- **Indicador de dirección y brillo de hover**: en las tres disposiciones nuevas **no
  aplican** (las hifas ya son direccionales por forma y no llevan flujo animado). El menú
  muestra esas dos opciones **desactivadas** cuando la disposición no es el cúmulo, con una
  ayuda que lo diga.

### 2.1 Capa estática

Las tres disposiciones nuevas se dibujan a un **canvas offscreen** que solo se vuelve a
pintar cuando cambia la vista (zoom, desplazamiento, tamaño), la simulación mueve nodos
(Sustrato mientras no está en reposo), cambia lo revelado o cambia la preferencia. Cada
frame del canvas visible es: copiar esa capa + el resaltado del foco + los nombres. En
reposo **no hay redibujo** hasta la próxima interacción (no hay flujo animado que lo
obligue).

## 3. Color

Todo sale de los tokens, como hoy (`DEF-030`: se releen al cambiar de tema):

| Elemento | Color |
|---|---|
| Hifas (Crecimiento, Sustrato) | `--mic-glow` al 20–24 % de opacidad. **Tenues a propósito**: donde se juntan muchas no deben tapar las esporas |
| Aristas de cruce (Anillo) | `--mic-glow` al 7 % |
| Aristas de colonia (Anillo) y arcos | tinte de la colonia |
| Esporas | `--mic-glow` (o el grupo de color) |
| Cuerpos fructíferos | crema `#F2E4C4`, como el nodo central de hoy |
| Foco y sus hifas | blanco `#EAFFF8` y `--mic-accent`, como hoy |

**Tinte de colonia** (solo Anillo): una paleta fija de 12 matices HSL (`158, 28, 190, 88,
340, 262, 48, 210, 120, 10, 300, 70`, saturación 34 %), asignada a las carpetas de primer
nivel **en orden de tamaño** (la más grande, el primero). Es determinista para un vault
dado y sigue [[Los temas los define Mycelium, no el usuario]].

## 4. Preferencia y menú

- Clave nueva en `PrefsVault` (`stores/prefsVaultStore.ts`): `disposicionGrafo:
  "cumulo" | "anillo" | "crecimiento" | "sustrato"`, por defecto **`cumulo`** (un vault
  existente no cambia de aspecto al actualizar). Se sanea como las demás: un valor
  desconocido cae al defecto. Persiste en `.mycelium/preferencias.json` como
  [[preferencias-por-vault]].
- En `GraphOptionsMenu.tsx`, una sección **«Disposición»** arriba de «Nombres», con los
  cuatro valores como botones de radio (mismo patrón que «Nombres»), cada uno con su ayuda
  en una línea:
  - Cúmulo — «Los nodos se repelen y los enlaces los atraen».
  - Anillo de colonias — «Las notas en un anillo, agrupadas por carpeta».
  - Crecimiento — «Cada nota brota junto a las que ya enlazaba, en orden de creación».
  - Sustrato — «El cúmulo dibujado como micelio: hifas, esporas y halo».
- Cambiar la disposición **reconstruye el layout** de esa disposición y **conserva** el
  zoom y el desplazamiento si la nueva disposición ocupa un tamaño parecido; si no,
  recentra. Concretamente: al cambiar de disposición se recentra siempre (la primera vez)
  y después cada disposición recuerda su propia vista mientras la pestaña viva.
- La caché de posiciones de `graphStore` pasa a guardarse **por disposición** (solo la
  usan Cúmulo y Sustrato; las otras dos son deterministas y se recalculan en
  milisegundos).

## 5. Criterios de aceptación

1. En el menú del grafo hay una sección «Disposición» con las cuatro opciones; la elegida
   persiste al cerrar y reabrir el vault, y otro vault no la hereda.
2. Con `cumulo` el grafo se ve y se comporta **igual que antes** de este cambio (mismo
   dibujo, mismas opciones activas).
3. `anillo`: las notas de cada carpeta de primer nivel ocupan un arco contiguo con su
   nombre; los enlaces dentro de la carpeta se curvan por el borde y los de cruce por el
   centro; clic en un nodo abre la nota.
4. `crecimiento`: reabrir el vault da el **mismo** dibujo; crear una nota nueva y enlazarla
   la hace aparecer junto a la nota enlazada **sin mover** las demás; la construcción
   temporal la muestra brotando.
5. `sustrato`: se asienta y se detiene como el cúmulo; con el grafo quieto no hay
   redibujo por frame (verificable con el perfilador: sin `requestAnimationFrame` en reposo).
6. Grupos de color, reglas de exclusión, modos de nombres y construcción temporal
   funcionan en las cuatro disposiciones.
7. Con la disposición ≠ cúmulo, «Indicador de dirección» y «Brillo de conexiones» se ven
   desactivados con su ayuda.
8. Cambiar el tema recolorea sin reabrir (como hoy, `DEF-030`).
9. Con más de 1.000 notas, cambiar a `anillo` o `crecimiento` tarda menos de un segundo y
   el desplazamiento va fluido.

## 6. Casos borde

- **Vault sin carpetas** (todo en la raíz): el anillo es una sola colonia «Raíz».
- **Notas sin `creadoEn`** (índices viejos o backend sin fecha): en Crecimiento van al
  final del orden, entre sí por `id`.
- **Nodo aislado** (sin enlaces): en Crecimiento cae en la frontera; en Anillo ocupa su
  lugar por carpeta; en Sustrato flota como hoy.
- **Exclusión que deja pocos nodos**: el anillo se dibuja con el radio mínimo (420).
- **Construcción temporal en Anillo**: las posiciones no dependen del orden, así que las
  notas simplemente aparecen en su sitio del anillo.
- **Mini-grafo**: no cambia. Si algún día se quisiera, es otra funcionalidad.

## 7. Versionado

| Qué | De | A |
|---|---|---|
| App desktop (`APP_VERSION` + `package.json` + `Cargo.toml` + `tauri.conf.json`) | 2.1.0 | **2.2.0** |
| Web, al reflejar | 2.1.0 | **2.2.0** |

**Minor**: el usuario puede hacer algo que antes no podía (elegir cómo se dispone su
grafo). Es el **mismo** incremento que ya tiene pendiente el calendario (`FUN-L-22`): un
release lleva un solo salto, decidido por su cambio más significativo, y dos
funcionalidades juntas siguen siendo **un** minor ([[Versionado del sistema]]). El
framework de IA **no** sube: la IA no necesita saber cómo se dibuja el grafo.

## 8. Documentación a actualizar

- [[BACKLOG]] — `FUN-L-23` (esta funcionalidad).
- [[Representaciones de micelio para el grafo]] — la exploración de la que sale; marcar
  qué se adoptó y qué se descartó.
- [[Rendimiento del grafo]] — nota de que Sustrato comparte el motor del cúmulo y que la
  capa estática de las disposiciones nuevas es la propuesta 1 de `DEF-109` aplicada.
- [[preferencias-por-vault]] — la clave nueva.
- [[Version 2.2.0]] — nota de release, compartida con el calendario.

## 9. Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json`.
- En la app, con el vault de prueba de `DEF-105` (3.340 notas) y con uno chico: los nueve
  criterios de arriba.
- Playwright si se puede automatizar el cambio de disposición y la lectura de la
  preferencia; lo visual lo confirma el usuario.

Ver [[Verificar antes de integrar]].

## Cómo quedó

Implementado en desktop el 2026-09-26 (rama `feat/grafo-disposiciones-desktop`).

### Archivos

| Archivo | Qué |
|---|---|
| `frontend/components/graph/disposiciones.ts` | **Nuevo, puro** (sin imports): `indexarGrafo` (nodos → enteros, orden de creación, colonias con tinte por tamaño), `layoutAnillo`, `layoutCrecimiento`, `siembraSustrato`, `limitesDe`, `hubsDe` y el azar determinista (`mulberry32`, `hashCadena`). |
| `frontend/components/graph/hifas.ts` | **Nuevo**: el dibujo. `hifa()` (polígono ahusado con ondular), `spriteBrillo`, `conAlpha`, `dibujarCapaEstatica` (halo, arcos, hifas, esporas y cuerpos fructíferos al canvas offscreen) y `dibujarSobrecapa` (copia + foco + nombres en pantalla sin pisarse). |
| `frontend/components/graph/MiniGraph.tsx` | Host. Prop `disposicion` (sin indicar = `cumulo`, que es lo que sigue usando el mini-grafo del panel). Con otra disposición el layout sale de `disposiciones.ts`, el radio se divide por 2, el orden de revelado es `g.rango`, el bucle es `tickMicelio` (capa estática + sobrecapa, sin rAF en reposo) y pulsar un nodo no lo arrastra en anillo/crecimiento. **El cúmulo conserva `simulate`, `draw` y `tick`**; en su camino solo cambió que las constantes del motor (`k`, tope, factor) se leen de la disposición —con los mismos valores de antes— y que la construcción temporal se extrajo a `avanzarConstruccion` sin cambiarla. |
| `frontend/components/graph/GraphView.tsx` | Lee `disposicionGrafo`, rellena `carpeta` en cada nodo (`folderPath` con `/`) y la caché de posiciones y de vista del store va por disposición. |
| `frontend/components/graph/GraphOptionsMenu.tsx` + `.module.css` | Sección «Disposición» arriba de «Nombres» (mismo patrón de radios). «Indicador de dirección» y «Brillo de conexiones» quedan `disabled` con `title` «Solo aplica a la disposición «Cúmulo»» cuando la disposición no es el cúmulo. |
| `frontend/stores/prefsVaultStore.ts` | Clave `disposicionGrafo` (`DISPOSICIONES_GRAFO`, `esDisposicionGrafo`), default `cumulo`, saneada en `normalizar`. |
| `frontend/stores/graphStore.ts` | `positions` y `view` pasan a `Partial<Record<DisposicionGrafo, …>>`; `savePositions(disposicion, …)` y `saveView(disposicion, …)`. Sin entrada de vista = esa disposición todavía no se encuadró. |
| `frontend/scripts/test-disposiciones.mjs` | Test headless (`node --test`) del módulo puro: colonias y tintes, orden de creación, arcos del anillo, determinismo y estabilidad del crecimiento, siembra del sustrato, y que 3.000 notas se disponen en menos de un segundo. |

### Lo que se apartó de la spec, y por qué

- **El azar del crecimiento es determinista por nota**, no un solo generador
  con semilla fija recorrido en orden: la semilla de cada nota sale de
  `hashCadena(id) ^ SEMILLA`. Es más estable que lo que pedía la spec: una nota
  importada con fecha vieja tampoco altera el azar de las que la siguen (solo
  el de las que la enlazan, que tienen una vecina más). El test «agregar una
  nota nueva no mueve a las existentes» lo cubre.
- **Los cuerpos fructíferos también toman el color del grupo** si el nodo cae
  en una regla de color. La spec los dejaba siempre crema, pero entonces un hub
  dentro de una carpeta coloreada parecería fuera de su grupo (criterio 6).
- **Las notas sin `creadoEn` van al final** del orden de revelado en las
  disposiciones nuevas (§ 6). El cúmulo sigue poniéndolas al principio
  (`t = 0`), como siempre: no se tocó.
- **La colonia «Raíz» recibe un matiz de la paleta** como cualquier otra, en su
  posición por tamaño, en vez del gris aparte de la demo.
- **La vista se guarda solo si llegó a encuadrarse**: si el lienzo nunca tuvo
  tamaño (pestaña oculta), no se cachea una vista `{1, 0, 0}` que después
  impediría el encuadre.
- Las callbacks de guardado (`onPositions`, `onView`) se **capturan al montar**
  el efecto y no se leen de la ref en el cleanup: al cambiar de disposición la
  ref ya apuntaba a la callback de la disposición nueva y guardaba el layout
  del cúmulo bajo la clave del anillo.
- Los sprites de brillo y el halo usan un caché propio en `hifas.ts` (no el
  `nodeSprite` de `MiniGraph.tsx`, que es privado) para no tocar el cúmulo.

### Verificación

- `npx tsc --noEmit -p tsconfig.json`: verde.
- `node --test scripts/test-disposiciones.mjs`: 17/17.
- **No se automatizó con Playwright**: los `smoke-*.mjs` necesitan la app
  corriendo con el IPC de Tauri, y la preferencia se persiste por
  `escribir_prefs_vault`. Lo visual no está verificado.

### Queda por confirmar en la app

1. Que el menú muestre «Disposición» y que la elegida persista en
   `.mycelium/preferencias.json` sin que otro vault la herede (criterio 1).
2. Que el cúmulo se vea y se comporte igual que antes (criterio 2).
3. Los tres dibujos, con el vault de prueba de `DEF-105` (3.340 notas) y con
   uno chico: arcos y nombres del anillo, brote y crecimiento de las hifas en la
   construcción temporal, halo y reposo del sustrato (sin rAF en reposo, en el
   perfilador).
4. Cambio de tema (recolorea sin reabrir), grupos de color, reglas de exclusión
   y los tres modos de nombres en las cuatro disposiciones.
5. La legibilidad de las etiquetas en pantalla (11 px con fondo
   semitransparente) sobre el tapiz de hifas, y si los umbrales de zoom para
   rotular «todos» (≥ 1,8) y los hubs (≥ 1,0 en anillo, ≥ 0,35 en el resto) son
   los que gustan.

## Relacionadas

- [[Representaciones de micelio para el grafo]] — la exploración y las demos.
- [[Rendimiento del grafo]] — `DEF-109`, el trabajo hermano sobre el cúmulo.
- [[preferencias-por-vault]] — dónde persiste la disposición.
- [[Mapa de documentacion]] — índice general.
