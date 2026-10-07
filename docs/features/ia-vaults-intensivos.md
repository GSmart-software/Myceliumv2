# Mycelium para vaults con agentes

**Solo desktop** (web no tiene MCP, framework de IA ni `.mycignore`) · registrado el
2026-10-06 · `FUN-L-29`, `FUN-L-30`, `FUN-M-44`, `FUN-M-45`, `FUN-M-46`, `FUN-L-31`,
`FUN-M-47`, `FUN-S-29`, `FUN-S-30` · `FUN-L-29` **implementada en desktop** (2026-10-06, sin
confirmar en la app) · `FUN-S-30` en implementación (2026-10-06)

## De dónde sale

Un documento de propuestas («Propuestas de integración IA para Mycelium», 2026-10-06) escrito
desde otra sesión, sobre un vault de **uso intensivo con agentes**: unas 1.075 notas, varias
sesiones de Claude Code trabajando a la vez durante semanas, subagentes y normas de
documentación propias. Las cifras se midieron sobre ese vault.

Su diagnóstico: con agentes escribiendo mucho, **la memoria del vault se degrada sin que nadie
lo note** —enlaces rotos, huérfanas, títulos repetidos, estados copiados a mano que se
desalinean—, y el vault terminó construyéndose sus propias herramientas (un auditor en Python,
scripts, hooks) para ver algo que Mycelium ya sabe porque tiene el índice.

La línea «el contenido va por los archivos, operar la app va por Mycelium» **se conserva**: la
propuesta es que Mycelium **exponga lo que ya calcula** y **valide** lo que el agente escribe,
en vez de que el agente lo reimplemente con `grep`.

> [!info] La propuesta 9 se descartó
> Pedía un diagnóstico de `.mycignore` porque un comentario del vault decía que unos
> repositorios anidados estaban excluidos sin ninguna regla debajo. El usuario aclaró
> (2026-10-06) que eso era así a sabiendas: no hay nada que diagnosticar. Mycelium **no**
> excluye solo los repositorios git anidados —ignora su carpeta `.git`, no el resto—, y se
> deja así.

## Las ocho propuestas

| # | ID | Qué | Tamaño |
|---|---|---|---|
| 1 | `FUN-L-29` `IA-INSTRUCCIONES-POR-CAPAS` | Instrucciones de IA en un **bloque gestionado** dentro de `CLAUDE.md` y un núcleo corto | L |
| 2 | `FUN-L-30` `VAULT-SALUD` | Salud del grafo: herramienta MCP, validar una nota y panel en la app | L |
| 3 | `FUN-M-44` `VAULT-VERIFICADORES` | Los chequeos de 2 y 5 marcados en el editor al guardar | M |
| 4 | `FUN-M-45` `MCP-CONSULTAR-INDICE` | Búsqueda, enlaces y vistas `.base` desde el agente | M |
| 4b | `FUN-S-29` `EMBED-BASE` | Embeber una vista `.base` en una nota | S |
| 5 | `FUN-M-46` `PROPIEDADES-ESQUEMAS` | Esquemas de propiedades: claves obligatorias y valores permitidos | M |
| 6 | `FUN-L-31` `MCP-SESIONES` | Coordinación entre sesiones de IA | L |
| 7 | `FUN-M-47` `RENOMBRE-ALIAS` | Conservar el nombre anterior como alias y detectar renombres hechos por fuera | M |
| 8 | `FUN-S-30` `MYCIGNORE-NEGACIONES` | Negaciones `!` en `.mycignore`, para ver `.claude/*.md` en el vault | S |

### 1 · Instrucciones de IA por capas — `FUN-L-29`

> [!success] Implementada en desktop el 2026-10-06 — framework de IA 2.0.0
> Sin confirmar en la app. El formato del bloque, la migración desde la 1.x, el prefijo, qué
> quedó en el núcleo (2,2 KB) y **dónde quedó cada regla** del `CLAUDE.md` anterior están en
> [[ia-framework-vault]] § «Framework 2.0.0: instrucciones por capas». Falta el punto 3 de
> las decisiones —aplicarlo a este repo—, que hace el orquestador al integrar.

- **Problema**: el bloque que genera Mycelium en `CLAUDE.md` pesa ~20 KB (~5.500 tokens) y se
  carga en **cada** sesión; repite lo que ya dicen las descripciones de las herramientas MCP y
  las skills. Y la regeneración choca con lo que escribe el usuario: «no edites `.claude/`» no
  se puede cumplir (ahí viven sus agentes, comandos y hooks), y el archivo de conflicto
  `CLAUDE (mycelium-ia vX).md` + `Conflictos instrucciones IA.md` **nadie lo integra**.
- **Propuesta**: (a) un **bloque gestionado** `<!-- mycelium:inicio -->` … `<!-- mycelium:fin -->`
  dentro de `CLAUDE.md`: Mycelium reescribe solo eso, el resto es del usuario, y desaparece el
  archivo de conflicto; (b) los archivos de Mycelium con prefijo propio (`.claude/skills/mycelium-*`,
  `.claude/mycelium/`), con la regla «no edites lo que lleva prefijo `mycelium`»; (c) un
  **núcleo de ~2 KB** siempre cargado (las dos obligaciones, las reglas duras, un puntero por
  skill) y el resto en skills y en la `description` de cada tool.
- **Lectura del orquestador**: la de más impacto. El bloque gestionado resuelve de raíz lo que
  `DEF-118` resolvió con huellas, y el trabajo a mano que este mismo repo hace en cada salto del
  framework. Achicar el núcleo es rehacer el framework: `FRAMEWORK_IA_VERSION` **2.0.0**.
  Migración: un `CLAUDE.md` existente sin bloque necesita una regla para insertar el bloque sin
  perder lo del usuario.

- **Decisiones del usuario (2026-10-06)**, al encargarla:
  1. Un `CLAUDE.md` propio, sin bloque, recibe el bloque **al principio**; lo del usuario queda
     debajo, intacto. Uno que generó Mycelium entero (con la marca vieja) se reemplaza por el
     bloque solo.
  2. **Núcleo de ~2 KB**: las dos obligaciones, las reglas duras en una línea cada una y un
     puntero por skill; el resto, a skills.
  3. Al terminar, **se aplica a este repo**: el `CLAUDE.md` del proyecto deja de llevar la
     sección de memoria copiada a mano y pasa a tener el bloque gestionado arriba.

### 2 · Salud del grafo — `FUN-L-30`

- **Problema** (medido): 89 huérfanas, 31 títulos duplicados (`README` ×10) —cada uno es un
  enlace ambiguo—, enlaces rotos (6 a una nota renombrada). La regla «nada huérfano» no se
  puede comprobar barato; un auditor con `grep` cuenta como roto un enlace dentro de un bloque
  de código y no sabe el criterio del índice.
- **Propuesta**: tool `mycelium_salud` (alcance: carpeta, nota o vault) con enlaces y embeds
  rotos, huérfanas, títulos duplicados y notas sin enlace saliente, cada uno con ruta y línea,
  **con el mismo criterio que el índice**; tool `mycelium_validar_nota(ruta)` como chequeo de
  cierre (título único, enlaces que resuelven, alguien la enlaza, propiedades válidas según
  `FUN-M-46`); y un **panel de salud** en la app con lo mismo.
- **Lectura**: muy valiosa y base de 3 y 5. El índice ya tiene enlaces y destinos (tabla de
  enlaces, `reResolverTitulos`); falta la consulta y la superficie.

### 3 · Verificadores al guardar — `FUN-M-44`

- **Problema**: detectar no alcanza si nada lo pone a la vista; el auditor del vault tiene 15
  incumplimientos abiertos porque solo corre cuando alguien se acuerda.
- **Propuesta original**: verificadores registrados en las preferencias del vault (un comando +
  un glob) que corren al guardar y se muestran como diagnóstico en el editor; los de 2 y 5
  incluidos; tool `mycelium_diagnosticos` para que el agente lea lo marcado.
- **Lectura y recorte**: sí a los **chequeos incluidos** como diagnósticos del editor y a la
  tool. **No a ejecutar comandos guardados en el vault**: el vault viaja, y un comando que corre
  al guardar le da a quien te pase un vault ejecución de código en tu PC. Si algún día se
  quieren comandos propios, que vivan en la configuración **de la máquina** y pidan aprobación
  la primera vez, nunca en el vault.

### 4 · Consultar el índice — `FUN-M-45` y `FUN-S-29`

- **Problema**: el agente busca con `grep` y termina citando como memoria archivos que no lo son;
  y no puede leer una vista `.base`, así que mantiene a mano tablas que la vista ya deriva (en
  ese vault, una tabla manual de 111 filas junto a 109 fichas y su `.base`).
- **Propuesta** (`FUN-M-45`): tools `mycelium_buscar` (la búsqueda de la app: nombre, contenido,
  `clave:valor`, `tag:`; **solo notas indexadas**), `mycelium_enlaces(nota)` (salientes y
  backlinks) y `mycelium_base(ruta, vista)` (evalúa la vista y devuelve sus filas).
- **Aparte** (`FUN-S-29`): embeber una vista `.base` en una nota (`![[tabla.base#Vista]]`), para
  que una nota índice muestre la tabla derivada en vez de una copia. Va con los otros embeds
  pendientes (`FUN-S-19` lienzos, `FUN-M-37` notas).

### 5 · Esquemas de propiedades — `FUN-M-46`

- **Problema**: el vocabulario cerrado vive en prosa y un auditor; y un error de YAML pasa en
  silencio: `Issue: #24` sin comillas es un comentario, la propiedad queda nula y la nota se ve
  bien.
- **Propuesta**: esquemas por carpeta o por valor de `tipo` (claves obligatorias, tipo de cada
  una, valores permitidos); avisos en el editor y en la pestaña de propiedades; **aviso
  específico** cuando un valor empieza con `#` sin comillas; validación también en
  `mycelium_validar_nota`.
- **Lectura**: dónde se declaran los esquemas es la decisión (un archivo del vault, p. ej.
  `.mycelium/esquemas` no —es interno—; mejor un archivo visible). El aviso del `#` es barato y
  se puede adelantar.

### 6 · Coordinación entre sesiones — `FUN-L-31`

- **Problema**: varias sesiones sobre el mismo vault no se ven entre sí (cuatro ramas el mismo
  día, dos expedientes sobre el mismo problema). `mycelium_estado` muestra lo que tiene abierto
  el usuario, no lo que tomaron las otras sesiones.
- **Propuesta**: registro de sesiones activas con MCP (id, título o tarea), tool
  `mycelium_reservar(nota | carpeta, motivo)` con vencimiento —aviso, no bloqueo—,
  `mycelium_estado` que lo incluya, y el registro de actividad agrupado por sesión.
- **Lectura**: buena idea y la más incierta: depende de cómo se identifica cada sesión de Claude
  Code ante el sidecar del MCP. **Investigar antes de especificar.**

### 7 · Alias al renombrar — `FUN-M-47`

- **Problema**: `mycelium_renombrar` repara bien, pero un renombre hecho por fuera (git, `mv`)
  deja enlaces rotos, y los enlaces viejos dentro de texto que no se reescribe (evidencia
  verbatim) se rompen sin remedio.
- **Propuesta**: opción «conservar el nombre anterior como alias» al renombrar; y al ver en disco
  un borrado + una creación con contenido casi idéntico, ofrecer «parece un renombre: ¿reparo N
  enlaces?».
- **Lectura**: **depende de `FUN-M-15`** (resolver enlaces por `aliases`), pendiente. Con el
  árbol en vivo de la 2.4.0 (`FUN-M-42`) el par borrado/creación ya llega en la misma ráfaga,
  así que la detección es factible.

### 8 · Notas de instrucciones visibles — `FUN-S-30` 🛠️

- **Problema**: las normas de trabajo del vault viven en `.claude/` y el default de `.mycignore`
  oculta todo lo que empieza con punto: no se encuentran, no se enlazan, no están en el grafo.
- **Propuesta**: excepciones en `.mycignore` (`!.claude/*.md`) o una vista aparte.
- **Lectura**: el `.mycignore` hoy **no admite negaciones** (`mycignore.rs`: «subconjunto de
  gitignore, sin negaciones»). Agregarlas como en gitignore lo resuelve sin una vista especial.
  Cuidado con el orden de evaluación (la última regla que coincide gana) y con que una carpeta
  ignorada no se recorre: `!` dentro de una carpeta ignorada no la vuelve a abrir, igual que en
  git.
- **Estado**: 🛠️ **implementada en desktop el 2026-10-06**, sin confirmar en la app. Con la
  semántica estricta de git: `!.claude/*.md` debajo de `.*/` **no** alcanza (la carpeta sigue
  ignorada); lo que se escribe es `!.claude/`, o `!.claude/` + `.claude/*` + `!.claude/*.md`
  para ver solo las notas de primer nivel. Recetas, semántica y por qué no se relajó la regla
  de git en [[mycignore]] § Negaciones.

## Orden propuesto

1. **`FUN-M-45` y `FUN-L-30`**: exponen lo que el índice ya sabe; base de lo demás.
2. **`FUN-L-29`**: además resuelve el archivo de conflicto y el trabajo manual de este repo.
3. **`FUN-S-30`**: chico y desbloquea enlazar las normas.
4. **`FUN-M-46`** (el aviso del `#` se puede adelantar), **`FUN-M-15` → `FUN-M-47`**,
   **`FUN-M-44`** sin comandos externos, **`FUN-S-29`** con los otros embeds, y **`FUN-L-31`**
   después de investigarla.

## Lo que ya funciona y conviene preservar (según el documento)

- La división «contenido por archivos, operar la app por MCP».
- `mycelium_renombrar` / `mover` / `borrar` con reparación de enlaces, papelera, registro de
  actividad y Deshacer.
- Que lo de alcance grande le pregunte al usuario, con `RECHAZADO` como respuesta y no error.
- Los validadores de las skills de lienzos, diagramas y dibujos: 2, 3 y 5 extienden la misma
  idea a las notas.

## Relacionadas

- [[BACKLOG]] — las fichas, en el bloque **Q** de la agrupación.
- [[mcp-control]] — el MCP de control (`FUN-L-09`), donde viven las tools nuevas.
- [[ia-framework-vault]] — el framework de instrucciones que `FUN-L-29` reorganiza.
- [[mycignore]] — la sintaxis que `FUN-S-30` amplía.
- [[Mycelium como memoria de la IA]] — el objetivo detrás de todo esto.
