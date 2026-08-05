# Auditoría y re-enlazado de un vault (`FUN-M-17` · `VAULT-RELINKEADO`)

Spec de cómo se adopta en Mycelium un vault que viene de un proyecto Markdown: **descubrir**
cómo se referencian entre sí sus documentos y **convertir** esas referencias en
`[[wikilinks]]`.

> [!info] Esto arregla el **caso de entrada** de Mycelium
> No es un caso raro: es lo que le pasa a cualquiera que adopte Mycelium sobre un proyecto
> que ya tenía. Abre el vault, mira el grafo y no hay ni una conexión — aunque sus
> documentos se referencien entre sí desde siempre.

---

## 1. El caso real que lo motivó

El usuario corrió `/vault-huerfanas` sobre un vault de **+200 documentos**. Lo que pasó:

1. El comando reportó **todo huérfano**. Es literalmente cierto y prácticamente inútil.
2. Empezó una conversión que exigió leer y editar decenas de documentos.
3. A mitad de camino, la IA **improvisó un script** de auditoría — reconociendo sola que
   estaba haciendo trabajo mecánico a mano.
4. Intentó un segundo script para aplicar los cambios. **No funcionó.**
5. Terminó editando a mano.

### El diagnóstico, comprobado en el código

**El framework no conoce las referencias sin estructura.** Ni un comando ni una skill
contemplan que un documento nombre a otro sin `[[corchetes]]`. `/vault-huerfanas` busca
huérfanas y `[[enlaces]]` rotos, nada más. Por eso no pudo dar el diagnóstico útil, que no
era *"todo está huérfano"* sino:

> *«Tus documentos se referencian entre sí desde siempre, pero con una notación que Mycelium
> no reconoce. No te falta estructura: te falta traducir cómo la nombrás.»*

**Y no le da ninguna herramienta.** Los únicos comandos que ofrece el framework son `grep`
de a uno, en una skill que `/vault-huerfanas` ni siquiera manda leer. La IA improvisó un
script porque no había ninguno — y su instinto era correcto.

**Su paso 3 es cuadrático por construcción**: *"para cada huérfana, proponé desde qué nota
convendría enlazarla"*. Con 200 huérfanas eso no se puede hacer, y menos como primer paso.

**Y cierra bloqueando la única salida**: *"NO apliques cambios automáticamente"*, sin
matices y sin ofrecer un camino intermedio.

### Cómo son las referencias de verdad

Casi ninguna tiene forma de enlace. Son el nombre suelto en la prosa, o algo entre backticks:

```markdown
Ver `HU-009` para el detalle del login. Depende de `RF-012`.
El despliegue se describe en Guia de despliegue.
```

Esto **descarta que un script las detecte**: las formas varían sin límite (`HU-009`,
`HU009`, `HU 009`, "la historia 009") y cada patrón que se agregue traerá falsos positivos.
Decidir qué es una referencia es juicio.

---

## 2. La separación que gobierna todo el diseño

> [!danger] La auditoría no modifica documentos. Nunca.
> Son dos operaciones con perfiles de riesgo opuestos. Mezclarlas haría que alguien corra un
> diagnóstico y se encuentre el corpus reescrito.

| | **Auditoría** | **Enlazado** |
|---|---|---|
| Qué hace | Diagnostica y **descubre** formas de referencia | **Aplica** el léxico al corpus |
| ¿Escribe en documentos? | **No** | Sí |
| Qué escribe | solo el léxico | documentos · `aliases` · respaldo · manifiesto |
| Cuándo se corre | a menudo | rara vez |
| Reversibilidad | no le hace falta | respaldo y `--deshacer`, obligatorios |

Consecuencia concreta: **escribir `aliases` en el frontmatter pertenece al enlazado**, no a
la auditoría, porque es modificar un documento.

---

## 3. El léxico: la memoria de cómo se nombran las cosas

`.claude/enlaces-lexico.json` registra **cómo se nombró históricamente cada documento**.

```json
{
  "version": 1,
  "destinos": {
    "HU/HU-009 Gestion de usuarios.md": {
      "titulo": "HU-009 Gestion de usuarios",
      "formas": ["HU-009", "HU009", "HU 009"]
    }
  },
  "descartadas": [
    { "forma": "Estado", "motivo": "palabra común, no es una referencia" }
  ]
}
```

Tres propiedades que lo hacen funcionar:

**El costo se paga por forma, no por documento ni por aparición.** Descubrir que `HU-009` es
una referencia cubre sus 47 apariciones en 12 documentos, y sirve para los documentos que se
agreguen después. No hay que re-descubrirlo en cada archivo.

**Guarda también lo descartado.** Que «Estado» *no* sea una referencia es una decisión que
costó juicio, y sin registrarla se volvería a plantear en cada pasada.

**Decrece con el tiempo.** La segunda auditoría es barata porque casi todo ya está
registrado. Encaja con la premisa del proyecto —el vault es la memoria— aplicada a la
nomenclatura del propio corpus.

> [!important] El léxico es además el mecanismo de seguridad
> **Solo se toca lo que está en él.** Un backtick con un identificador de código que nadie
> declaró como forma queda intacto. Por eso los backticks pueden dejar de ser zona prohibida
> sin volverse peligrosos: el filtro no es sintáctico, es el léxico.

### Dos sitios, una sola dirección de escritura

| Dónde | Quién escribe | Para qué |
|---|---|---|
| `.claude/enlaces-lexico.json` | la **IA**, en la auditoría | memoria durable; es lo que lee el script |
| `aliases:` en el frontmatter del destino | el **script**, en el enlazado | cara visible: se ve y se corrige en la pestaña PROPIEDADES, viaja con la nota, y alimenta `FUN-M-15` |

---

## 4. El reparto: qué es juicio y qué es mecánico

| Trabajo | Quién | Por qué |
|---|---|---|
| Decidir qué cadena es una referencia | **IA** | Varía sin límite |
| Saber qué notas existen | script | Es un hecho, no una opinión |
| Proponer formas candidatas | script | Conteo y patrones sobre texto |
| Encontrar dónde aparece una cadena conocida | script | Es `grep`; el modelo lo hace peor y más caro |
| Aplicar una decisión a sus N apariciones | script | Mecánico, y es donde se cometen los errores a mano |
| Verificar que no quedaron enlaces rotos | script | Comprobable y exhaustivo |

> [!important] La lección de fondo
> El error no fue de la IA: fue **pedirle a un modelo trabajo mecánico a escala**. Y la
> corrección tampoco es "que el script adivine mejor" — es invertir la dirección: **la IA
> descubre las formas, el script las aplica.**

---

## 5. Los dos comandos

### `/vault-huerfanas` — la auditoría *(se amplía, no se duplica)*

Ya es el comando de salud del grafo. Gana un **paso 0**: antes de declarar nada huérfano,
detectar referencias sin estructura, porque ese suele ser el diagnóstico real. Registra lo
descubierto en el léxico y **no toca un solo documento**.

Hay que corregirle además dos cosas que ya tiene: eliminar el paso cuadrático, y matizar el
*"NO apliques cambios automáticamente"* — que hoy bloquea sin ofrecer alternativa.

### `/vault-referencias` — el enlazado *(nuevo)*

Lee el léxico y genera los enlaces. Modifica, con respaldo y deshacer.

> [!note] Por qué un comando nuevo y no un parámetro
> **Por el riesgo, no por comodidad.** Un comando que a veces solo mira y a veces reescribe
> 200 archivos es peligroso: la separación tiene que estar en el nombre, no en un parámetro
> que se puede olvidar. Se suman la cadencia (auditar es rutina, enlazar es excepcional) y
> la reversibilidad (uno no necesita respaldo, el otro no puede correr sin él).
>
> **Sobre el nombre**: `/vault-enlazar` sería lo natural, pero ya existe `/vault-vincular` y
> se confundirían. Son cosas distintas: `/vault-vincular` es **semántico y de a una nota**
> (decide dónde *convendría* enlazar); este es **mecánico y de todo el vault** (aplica formas
> ya decididas).

No hace falta un tercero: descubrir es parte de auditar, y aplicar es todo lo que hace el
segundo.

---

## 6. El flujo

```
AUDITORÍA  (no modifica documentos)          ENLAZADO  (modifica)
──────────────────────────────────           ─────────────────────
script: inventario + candidatas
   │
   ▼
IA: decide qué es referencia  ──▶  léxico  ──▶  script: reemplaza
   ▲                              (memoria)         + escribe aliases
   │                                   │            + respaldo
   └── informe de lo no cubierto ◀─────┴───────────────────┘
```

| Fase | Comando | Quién | Coste |
|---|---|---|---|
| **0 · Inventario** — notas, títulos, rutas | huérfanas | script | segundos |
| **1 · Candidatas** — cadenas repetidas entre backticks, patrones `XX-000`, títulos mencionados | huérfanas | script | segundos |
| **2 · Descubrimiento** — decidir cuáles son referencias; escribir el léxico | huérfanas | **IA** | la parte cara, **una vez por forma** |
| **3 · Aplicación** — reemplazo, `aliases`, respaldo, manifiesto | referencias | script | segundos |
| **4 · Cobertura** — qué quedó sin cubrir | referencias | script | segundos |

Se itera: lo no cubierto vuelve a la auditoría, que extiende el léxico. Converge, y cada
vuelta es más barata que la anterior.

> [!tip] Dónde entran los subagentes
> En la **fase 2**, y solo si el corpus es grande: hay que leer de verdad para descubrir las
> formas, y eso se reparte. Cada subagente recibe el inventario de la fase 0 y un
> subconjunto de documentos, y devuelve formas candidatas; el orquestador consolida el
> léxico. **Lo que se reparte es *leer*, no *editar*** — editar sigue siendo del script.

---

## 7. Reglas de reescritura

```
`HU-009`                     →  [[HU-009]]
HU-009                       →  [[HU-009]]
[HU-009](HU/HU-009 Ges…md)   →  [[HU-009]]
```

**Los backticks se quitan.** Un `[[enlace]]` entre backticks no funciona: se ve literal.
Nunca fueron código — eran referencias.

**Todas las apariciones**, no solo la primera: la regla queda uniforme y re-ejecutable. El
grafo es idéntico en cualquier caso, porque `grafo.ts` deduplica las aristas; lo que cambia
es solo cómo se lee el documento.

**Los enlaces Markdown** `[texto](otra.md)` siguen cubiertos, pero como **un caso más** del
mismo mecanismo — no como el caso central. Sus destinos que no son notas (`.png`, `.pdf`),
los externos (`http`) y las anclas puras quedan intactos.

**Coincidencia**: límites de palabra (que `HU-009` no coincida dentro de `HU-0091`), sin
distinguir mayúsculas pero **preservando el texto original**, y **forma más larga primero**.

### Zonas prohibidas

| Zona | Por qué |
|---|---|
| Frontmatter | Es metadato; el enlazado solo toca `aliases`, y a propósito |
| Bloques cercados (```` ``` ````, `~~~`) | Es código de verdad |
| Wikilinks y embeds ya presentes | Idempotencia |
| URLs | Un `HU-009` dentro de una URL no es una referencia |

**Los backticks ya no son zona prohibida** — son la fuente principal. Lo que los vuelve
seguros es el léxico (§ 3).

---

## 8. Seguridad y reversibilidad *(solo el enlazado)*

**Hoy no hay undo de contenido en Mycelium**: `putContenido` sobrescribe y el único historial
es el de CodeMirror, en memoria. Así que antes de escribir nada:

1. **Respaldo** de cada archivo en `.mycelium/relink-<timestamp>/` con `copiar_archivo`.
   `.mycelium/` está siempre fuera del índice y del `.mycignore`: las copias son invisibles.
2. **Manifiesto** con archivo, número de reemplazos y hash SHA-256 antes y después.
3. **`--deshacer <timestamp>`**. El hash "después" permite detectar si el usuario ya editó
   ese archivo, y en ese caso **avisar en vez de pisarlo**.
4. **`--simulacro`**, como en `publicar.mjs` y `versionar.mjs`.

---

## 9. Dependencia: `FUN-M-15` habilita la versión buena

`aliases` **ya existe**: `FUN-M-04` la parsea y la indexa, y `FUN-M-15` es la funcionalidad
pendiente que la hace **resolver**. El léxico no inventa ninguna estructura nueva.

Con `aliases` funcional, la reescritura es `HU-009` → `[[HU-009]]`, **sin alias**: texto casi
idéntico al original y mucho menos invasivo que `[[HU-009 Gestion de usuarios|HU-009]]`.

Y como no lleva barra vertical, **`DEF-045` deja de bloquear** — el defecto de los alias
dentro de tablas no se toca. Sigue valiendo la pena arreglarlo, pero por su cuenta.

> [!warning] Sin `FUN-M-15`, esto se puede hacer igual — peor
> Habría que escribir `[[HU-009 Gestion de usuarios|HU-009]]` en cada aparición: más ruido
> en el texto, y `DEF-045` vuelve a bloquear dentro de tablas. Hacer `FUN-M-15` primero es
> lo que hace que el resultado sea limpio.

---

## 10. Qué cambia en el framework de IA

Sube `FRAMEWORK_IA_VERSION` a **`1.5.0`**.

| Pieza | Cambio |
|---|---|
| `/vault-huerfanas` | Paso 0 nuevo; descubrimiento y escritura del léxico; **queda explícito que no modifica documentos**; se elimina el paso cuadrático; se matiza el "NO apliques cambios" |
| `/vault-referencias` | Nuevo: aplica el léxico, con respaldo y deshacer |
| `/vault-vincular` | Nota de escala: con muchas notas, primero la auditoría; este comando es para el trabajo semántico de a una |
| skill `mycelium-vault` | Las referencias sin estructura como algo que Mycelium **no** cuenta; el léxico; `aliases` |
| `CLAUDE.md` generado | Que existen herramientas en `.claude/` y **hay que usarlas en vez de improvisar una** |

> [!important] La instrucción que faltaba
> «Antes de hacer trabajo repetitivo sobre muchas notas, mirá si hay una herramienta. Si no
> la hay y el trabajo es mecánico, **decilo** en vez de hacerlo a mano nota por nota.»
> Es exactamente lo que la IA intuyó sola a mitad del trabajo; el framework tiene que decirlo
> desde el principio.

---

## 11. El consumo

| | Sin herramienta | Con este diseño |
|---|---|---|
| Descubrir | leer 200 notas y decidir en cada una | leer para descubrir **formas**: se paga una vez por forma |
| Aplicar | editar N archivos a mano | segundos, y sin errores de transcripción |
| Segunda pasada | todo otra vez | casi gratis: el léxico ya lo sabe |

Lo que baja el costo no es que el modelo lea menos —en la primera pasada tiene que leer—,
sino que **cada cosa que aprende se registra y no se vuelve a aprender**, y que **no edita**.

---

## 12. Lo que NO entra

- **Que el script adivine referencias.** Es lo que se descartó: las formas varían sin límite.
- **Menciones que requieren interpretación** ("el documento anterior", "ver arriba"). Si la
  IA las detecta, van al informe, no al léxico.
- **Un hook que avise al escribir una referencia sin enlazar.** Es prevención, no corrección
  — `FUN-S-10`.
- **La pantalla de la app** — `FUN-L-17`, para quien nunca usa la IA.

---

## 13. Criterios de aceptación

### De la auditoría — el más importante primero

1. **Correr la auditoría completa no cambia ni un byte de ningún documento.** Es la garantía
   que sostiene toda la separación.
2. Sobre un vault sin wikilinks, el informe dice cuántas referencias sin estructura hay y de
   qué formas, en vez de limitarse a "todo huérfano".
3. El léxico queda escrito con las formas descubiertas y las descartadas.
4. Volver a correrla **no vuelve a proponer** lo ya descartado.

### Del enlazado

5. `` `HU-009` `` pasa a `[[HU-009]]`, sin backticks.
6. `HU-009` en prosa pasa a `[[HU-009]]`; `HU-0091` **no se toca** (límites de palabra).
7. Una forma que no está en el léxico **no se toca**, esté entre backticks o no.
8. Nada dentro de un bloque de código cercado, del frontmatter o de una URL se modifica.
9. La nota destino queda con su `aliases` poblado, visible en la pestaña PROPIEDADES.
10. `--simulacro` produce el mismo informe sin escribir.
11. `--deshacer` devuelve todos los archivos a su hash exacto.
12. Si un archivo cambió después de la conversión, `--deshacer` **avisa y no lo pisa**.
13. Volver a aplicar no cambia nada (idempotente).
14. Un archivo con CRLF conserva sus finales de línea.
15. Tras aplicar, el grafo muestra las conexiones nuevas.

---

## 14. Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json`
- `node scripts/test-enlaces.mjs` — **la pieza central**. El núcleo (`lib/enlaces.ts`) va
  **puro y sin imports**, como `lib/frontmatter.ts` y `lib/db/nombres.ts`, para poder
  testearlo headless con el patrón de `test-frontmatter.mjs`. Un test por caso borde.
- **La prueba que importa**: correr la auditoría sobre el vault real y comprobar con `git
  status` (o hashes) que **no cambió nada**.
- Después, el enlazado **sobre una copia** del vault de +200 documentos: comparar el grafo
  antes y después y revisar a mano una muestra.

> [!note] El criterio de éxito no es "0 sin cubrir"
> Es que **lo no cubierto esté listado** y que nada se haya convertido mal. Un residuo
> visible es un resultado correcto; una conversión equivocada y silenciosa, no.

## 15. Qué reutiliza

| Pieza | Para qué |
|---|---|
| `lib/frontmatter.ts` (`cuerpoDe`, `ponerPropiedad`) | Saltar el frontmatter; escribir `aliases` |
| `lib/editor/wikilink.ts` (`resolveWikilink`) | Resolver rutas y desambiguar. Hay que romper antes su dependencia con `@/stores/vaultStore` |
| `lib/db/contenido.ts` (`putContenido`) | Escribir el archivo y reindexar en un solo llamado |
| `copiar_archivo` (Rust) | El respaldo en `.mycelium/` |
| `frontend/scripts/publicar.mjs` | El molde: Node puro, `--simulacro`, salida legible |

## 16. Documentación a actualizar

- [[BACKLOG]] — `FUN-M-17`, el bloque **M** (con `FUN-M-15` encabezándolo), más `FUN-L-17` y
  `FUN-S-10` como continuaciones.
- [[ia-framework-vault]] — historial del framework hasta `1.5.0`.
- [[Versionado del sistema]] — el salto de `FRAMEWORK_IA_VERSION`.
- [[Aprendizajes tecnicos]] — la lección de fondo: no darle trabajo mecánico a escala a un
  modelo, y que la corrección no es que el script adivine mejor sino invertir la dirección.

## Relacionadas

- [[BACKLOG]] — `FUN-M-15` (el prerrequisito) y el bloque M.
- [[metadata-yaml]] — `FUN-M-04`, que ya parsea e indexa `aliases`.
- [[Bugs_errores_y_defectos]] — `DEF-045`, que este diseño esquiva.
- [[ia-framework-vault]] — el framework que gana el comando y las herramientas.
- [[Mycelium como memoria de la IA]] — el objetivo de fondo.
- [[Mapa de documentacion]] — índice general.
