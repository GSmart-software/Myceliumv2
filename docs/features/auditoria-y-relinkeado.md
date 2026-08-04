# Auditoría y re-enlazado de un vault (`FUN-M-17` · `VAULT-RELINKEADO`)

Spec de la herramienta que convierte las referencias Markdown de un proyecto existente
(`[texto](otra.md)`) en `[[wikilinks]]`, y del flujo de trabajo de la IA alrededor.

> [!info] Esto arregla el **caso de entrada** de Mycelium
> No es un caso raro: es lo que le pasa a cualquiera que adopte Mycelium sobre un proyecto
> Markdown que ya tenía. Abre el vault, mira el grafo y no hay ni una conexión — aunque sus
> documentos se referencien entre sí desde siempre.

---

## 1. El caso real que lo motivó

El usuario corrió `/vault-huerfanas` sobre un vault de **+200 documentos** migrado de un
proyecto donde las referencias eran enlaces Markdown normales. Lo que pasó:

1. El comando reportó **todo huérfano**. Es literalmente cierto y prácticamente inútil.
2. Empezó una conversión que exigió leer y editar decenas de documentos.
3. A mitad de camino, la IA **improvisó un script** de auditoría — reconociendo sola que
   estaba haciendo trabajo mecánico a mano.
4. Intentó un segundo script para aplicar los cambios. **No funcionó.**
5. Terminó editando a mano.

### El diagnóstico, comprobado en el código

**El framework no conoce los enlaces Markdown.** Ni un comando ni una skill mencionan
`[texto](archivo.md)`. `/vault-huerfanas` busca huérfanas y `[[enlaces]]` rotos, nada más.
Por eso no pudo dar el diagnóstico útil, que no era *"todo está huérfano"* sino:

> *«Hay 340 referencias entre tus notas escritas en formato Markdown. Mycelium no las
> cuenta como enlaces. No te falta estructura: te falta traducir la sintaxis.»*

**Y no le da ninguna herramienta.** Los únicos comandos que ofrece el framework son `grep`
de a uno, en una skill que `/vault-huerfanas` ni siquiera manda leer. La IA improvisó un
script porque no había ninguno.

**Su paso 3 es cuadrático por construcción**: *"para cada huérfana, proponé desde qué nota
convendría enlazarla"*. Con 200 huérfanas eso no se puede hacer, y menos como primer paso.

**Y cierra bloqueando la única salida**: *"NO apliques cambios automáticamente"*. Sin
matices, para un trabajo cuya inmensa mayoría es determinista y reversible.

> [!important] La lección de fondo
> El error no fue de la IA: fue **pedirle a un modelo que hiciera trabajo mecánico a
> escala**. Convertir `[texto](x.md)` en `[[X|texto]]` no requiere juicio — la referencia ya
> existe y solo cambia de sintaxis. Todo el diseño sale de separar eso de lo que sí requiere
> criterio.

---

## 2. El principio: separar lo mecánico del juicio

| | Lo hace | Por qué |
|---|---|---|
| Encontrar las referencias Markdown | **Código** | Escaneo de texto con reglas fijas |
| Resolver a qué nota apunta cada una | **Código** | La ruta del `.md` ya dice exactamente cuál es |
| Reescribir las que son inequívocas | **Código** | Transformación mecánica y verificable |
| Decidir los casos ambiguos | **IA** | Dos notas con el mismo título: hace falta leer y entender |
| Los destinos que no existen | **IA** | ¿Typo? ¿nota que hay que crear? ¿referencia externa? |
| Enlazar menciones en prosa | **IA** | Que un documento nombre a otro no significa que deba enlazarlo |
| Construir mapas y estructura | **IA** | Es el trabajo que de verdad aporta criterio |

El código deja a la IA **una lista corta de excepciones** en vez de 200 documentos. Ese es
el ahorro de consumo, y de paso la mejora de calidad: el modelo dedica su atención a lo que
solo él puede resolver.

---

## 3. Arquitectura: un núcleo puro, tres consumidores

```
        frontend/lib/enlaces.ts          ← el núcleo, PURO y sin imports
    (detectar · resolver · clasificar · reescribir)
                     │
      ┌──────────────┼──────────────────────┐
      │              │                      │
  script del      la app                 servidor MCP
    vault      (auditoría con UI)         (FUN-L-09)
   ── HOY ──      ── después ──            ── después ──
```

**Por qué el núcleo va aparte y puro** (sin un solo `import`, como `lib/frontmatter.ts` y
`lib/db/nombres.ts`):

- Es **testeable headless** con el patrón que ya existe: `scripts/test-frontmatter.mjs`
  transpila el `.ts` con `ts.transpileModule` y lo importa por `data:` URL. Solo funciona si
  el módulo es puro. Y esto necesita tests de verdad: es un transformador de texto con
  decenas de casos borde sobre los documentos del usuario.
- Los tres consumidores comparten **exactamente** las mismas reglas. Si la lógica se
  duplicara, divergirían — que es precisamente lo que le pasó a los cuatro parsers de
  wikilink del repo y lo que causó `DEF-045`.

**Por qué el script va generado en el vault** y no en el repo: el usuario que sufre esto no
es un desarrollador de Mycelium, es alguien que abrió su carpeta con Mycelium. Y **Node está
garantizado**: el framework asume que la IA corre en la terminal integrada
(`framework.ts:185`) y Claude Code se distribuye por npm.

> [!note] La app cubre a quien nunca usa la IA
> Ese usuario tiene el mismo problema y ninguna solución. Queda registrado como continuación
> (`FUN-L-17`), consumiendo este mismo núcleo: comando Rust + pantalla de auditoría.

---

## 4. Qué detecta y qué no toca

### Se convierte

Un enlace Markdown **cuyo destino es una nota del vault**:

```
[la guía de despliegue](procesos/Desplegar.md)   →   [[Desplegar|la guía de despliegue]]
[BACKLOG](../BACKLOG.md)                         →   [[BACKLOG]]
[mapa](Mapa%20de%20documentacion.md)             →   [[Mapa de documentacion|mapa]]
```

- **El texto visible nunca cambia.** Si el texto ya es igual al título, se omite el alias
  (`[[BACKLOG]]` es más limpio que `[[BACKLOG|BACKLOG]]`).
- Los destinos vienen **URL-encoded** muy a menudo (`%20` por los espacios): hay que
  decodificarlos antes de resolver. Es el fallo más probable si se pasa por alto.

### No se toca, y se dice por qué

| Caso | Qué se hace |
|---|---|
| Enlaces externos (`http`, `https`, `mailto`) | Se ignoran, no se cuentan |
| Anclas puras (`[x](#seccion)`) | Se ignoran: son internas al documento |
| Imágenes (`![alt](img.png)`) | Se ignoran |
| Destinos que no son notas (`.png`, `.pdf`, `.zip`) | Se ignoran: un `[[archivo.pdf]]` no es lo mismo |
| Wikilinks y embeds ya presentes | Se ignoran |
| **Con ancla** (`[x](otra.md#seccion)`) | **NO se convierte** — se reporta |
| Dentro de una tabla y necesitaría alias | **NO se convierte** — se reporta (ver § 8) |

> [!warning] El ancla se reporta, no se convierte
> Los cuatro parsers de wikilink del repo **no manejan `[[nota#sección]]`**: el `#` queda
> dentro del destino y el enlace no resuelve. Convertirlo perdería la sección en silencio, y
> perder información sin avisar es peor que no convertir.

### Zonas prohibidas

El escaneo tiene que **saber dónde no mirar**, y hoy ningún módulo del repo resuelve esto:

- **Frontmatter YAML** — se salta con `cuerpoDe()` de `lib/frontmatter.ts`.
- **Bloques de código** cercados con ``` o `~~~`, incluidos los indentados dentro de listas.
- **Código inline** entre backticks. *Este es el que más importa*: la documentación de un
  proyecto está llena de `` `[texto](ruta.md)` `` como ejemplo — convertirlos corrompería
  los ejemplos.
- **Wikilinks y embeds** existentes.

Se resuelve como ya hace `lib/markdown.ts`: se recogen los rangos prohibidos en una pasada,
y los reemplazos que caen dentro se descartan (`if (m.start < cursor) continue`).

---

## 5. Cómo se resuelve el destino

Un enlace Markdown apunta por **ruta relativa al archivo que lo contiene** — distinto de un
wikilink, que resuelve por título. El orden:

1. Decodificar el porcentaje (`%20` → espacio) y separar ancla y query.
2. Resolver la ruta contra la carpeta de la nota origen; normalizar `.` y `..`.
3. Buscar esa ruta en el índice: **`notas.id` ES la ruta relativa POSIX**, así que es una
   búsqueda exacta.

| Nivel | Qué pasó | Acción |
|---|---|---|
| **Exacto** | La ruta resuelta es una nota del vault | **Se aplica** |
| **Por título** | La ruta no existe, pero hay una nota con ese nombre (archivo movido, mayúsculas distintas) | Se reporta |
| **Ambiguo** | Varias notas coinciden por título | Se reporta |
| **Roto** | No hay nada que coincida | Se reporta como enlace roto |

Solo el nivel **exacto** se aplica solo, y va a ser la enorme mayoría: la ruta del `.md` ya
identifica el archivo sin lugar a duda.

Para los niveles 2 y 3 el núcleo reutiliza **`resolveWikilink`** de `lib/editor/wikilink.ts`
— que ya sabe de pistas de carpeta, extensiones y desempate por profundidad. Hay que romper
antes su dependencia con `@/stores/vaultStore`, que solo usa `wikilinkCompletions`.

---

## 6. Seguridad y reversibilidad

Aplicar sin preguntar solo es aceptable si deshacer es trivial. **Hoy no hay undo de
contenido en Mycelium**: `putContenido` sobrescribe y el único historial es el de CodeMirror,
en memoria.

Antes de escribir nada:

1. **Copia de seguridad** de cada archivo a modificar en `.mycelium/relink-<timestamp>/`,
   con `copiar_archivo`. `.mycelium/` está siempre fuera del índice y del `.mycignore`, así
   que las copias son invisibles para la app y el grafo.
2. **Manifiesto** `manifiesto.json` con: archivo, número de reemplazos, y hash SHA-256 antes
   y después.
3. Escritura con **`putContenido`** (escribe el archivo atómicamente y reindexa FTS y
   propiedades de una vez) o `escribir_nota` desde el script.
4. **`--deshacer <timestamp>`** restaura desde el manifiesto. El hash "después" permite
   detectar si el usuario ya editó ese archivo, y en ese caso no pisarlo sin avisar.

Y `--simulacro` como en `publicar.mjs` y `versionar.mjs`: es el patrón establecido del repo.

---

## 7. El flujo completo

### Fase 1 — Diagnóstico · **script** · segundos, ~0 tokens

```sh
node .claude/scripts/vault-enlaces.mjs --auditar
```

```
340 referencias Markdown en 187 de 214 notas

  318  resuelven exacto        → se convierten solas
   14  ambiguas                → decide la IA
    6  destino inexistente     → decide la IA
    2  con ancla (#seccion)    → decide la IA

Ninguna nota tiene [[wikilinks]] todavía.
Esto NO es un problema de estructura: es de sintaxis.
```

### Fase 2 — Conversión · **script**

```sh
node .claude/scripts/vault-enlaces.mjs --aplicar
```

Respaldo, conversión de las 318, manifiesto. **El grafo pasa de 0 a ~318 aristas.**

### Fase 3 — Excepciones · **IA** · ~2k tokens

La IA lee el informe de 22 casos, abre solo las notas implicadas y decide. Aquí sí aporta:
distinguir dos notas homónimas o reconocer un typo requiere entender el contenido.

### Fase 4 — Estructura · **IA**

Recién ahora `/vault-huerfanas` da un diagnóstico real, sobre un grafo que existe: qué quedó
de verdad aislado, qué área necesita un mapa, dónde falta un `[[enlace]]` conceptual que
nunca fue un enlace Markdown.

---

## 8. Dependencia: `DEF-045` bloquea la cobertura completa

Una conversión masiva **produce alias**, y `DEF-045` dice que un `[[destino|alias]]` dentro
de una tabla o rompe la tabla, o —si se escapa con `\|`— rompe el enlace en el grafo.

Mientras no esté arreglado:

- Dentro de una tabla, si el texto visible **es igual** al título → se convierte a
  `[[Titulo]]`. Sin barra, sin problema.
- Si necesitaría alias → **no se convierte**, y se reporta agrupado como *"esperan a
  `DEF-045`"*.

Arreglar `DEF-045` primero es lo sensato: es pequeño (normalizar `\|` en los tres
consumidores de texto crudo) y sin él esta herramienta deja un hueco visible justo en las
tablas, que es donde más enlaces suele haber en documentación.

---

## 9. Qué cambia en el framework de IA

Sube `FRAMEWORK_IA_VERSION` a **`1.5.0`** (capacidad nueva que la IA debe conocer).

| Pieza | Cambio |
|---|---|
| **`/vault-huerfanas`** | **Paso 0 nuevo**: antes de declarar nada huérfano, comprobar si hay referencias Markdown. Si las hay, ese *es* el diagnóstico y hay que remitir a la herramienta. Se elimina el paso cuadrático: agrupar por área en vez de una propuesta por huérfana. Y el "NO apliques cambios automáticamente" pasa a matizarse: lo determinista y reversible sí se aplica. |
| **`/vault-enlaces`** (nuevo) | El flujo de las cuatro fases, para el vault que se adopta desde Markdown |
| **`/vault-vincular`** | Nota de escala: con muchas notas, primero la herramienta; este comando es para el trabajo semántico de a una |
| **skill `mycelium-vault`** | Documentar los enlaces Markdown como algo que Mycelium **no** cuenta; la herramienta; y `\|` en tablas cuando `DEF-045` esté |
| **`CLAUDE.md` generado** | Que existen scripts en `.claude/scripts/` y que **hay que usarlos en vez de improvisar uno** |

> [!important] La instrucción que faltaba
> «Antes de hacer trabajo repetitivo sobre muchas notas, mirá si hay una herramienta. Si no
> la hay y el trabajo es mecánico, **decilo** en vez de hacerlo a mano nota por nota.»
> Es exactamente lo que la IA intuyó sola a mitad del trabajo; el framework tiene que decirlo
> desde el principio.

---

## 10. El consumo

| | Leyendo con el modelo | Con la herramienta |
|---|---|---|
| Diagnóstico | 200 notas × ~2.000 tokens = **~400.000** | ~0 (lo hace el script) |
| Conversión | releer + reescribir cada nota | ~0 (lo hace el script) |
| Excepciones | — | informe de 22 casos ≈ **~2.000** |

Dos órdenes de magnitud, y **es el mismo trabajo hecho mejor**: el script no se cansa en la
nota 150 ni se salta un bloque de código.

---

## 11. Lo que NO entra, y por qué

- **Menciones en prosa** — que un documento nombre a otro no significa que deba enlazarlo.
  Eso es criterio, y es el trabajo de `/vault-vincular`.
- **Un hook que avise al escribir un enlace Markdown nuevo.** Tiene valor real —evita que el
  problema vuelva a crecer— pero es *prevención*, no la corrección que hace falta ahora. Se
  registra como `FUN-S-10`.
- **Subagentes.** Con este diseño las excepciones son pocas y caben en el contexto principal.
  Un subagente serviría si fueran cientos; el objetivo del diseño es que no lo sean. Decirlo
  explícito para que nadie lo agregue por costumbre.
- **La pantalla de la app** — `FUN-L-17`.

---

## 12. Criterios de aceptación

1. Sobre un vault sin ningún wikilink pero con enlaces Markdown, `--auditar` reporta el
   número correcto y **no modifica nada**.
2. Un `[texto](otra.md)` se convierte en `[[Otra|texto]]`; si el texto es igual al título,
   en `[[Otra]]`.
3. Los destinos con `%20` resuelven.
4. Las rutas relativas con `../` resuelven contra la carpeta de la nota origen.
5. **Nada dentro de un bloque de código, de código inline o del frontmatter se modifica.**
6. Los enlaces externos, las imágenes y los destinos que no son notas quedan intactos.
7. Los enlaces con ancla no se convierten y aparecen en el informe.
8. Dentro de una tabla no se genera ningún alias mientras `DEF-045` siga abierto.
9. `--simulacro` produce el mismo informe sin escribir.
10. `--deshacer` devuelve todos los archivos a su contenido exacto (mismo hash).
11. Si un archivo cambió después de la conversión, `--deshacer` avisa y no lo pisa.
12. Tras `--aplicar`, el grafo del vault muestra las conexiones nuevas.
13. Un archivo con CRLF conserva sus finales de línea.
14. Volver a correr `--aplicar` no cambia nada (idempotente).

## 13. Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json`
- `node scripts/test-enlaces.mjs` — **la pieza central**: el núcleo es puro, así que cada
  caso borde de arriba es un test barato. Al estilo de `test-frontmatter.mjs`.
- Prueba real sobre una **copia** de un vault grande, comparando el grafo antes y después.

## 14. Documentación a actualizar

- [[BACKLOG]] — `FUN-M-17`, más `FUN-L-17` (app) y `FUN-S-10` (hook) como continuaciones.
- [[ia-framework-vault]] — historial del framework hasta `1.5.0`.
- [[Versionado del sistema]] — el salto de `FRAMEWORK_IA_VERSION`.
- [[Aprendizajes tecnicos]] — la lección de fondo: no darle trabajo mecánico a escala a un
  modelo; darle una herramienta y las excepciones.
- Nota de release cuando salga.

## Relacionadas

- [[Bugs_errores_y_defectos]] — `DEF-045`, que bloquea la cobertura en tablas.
- [[ia-framework-vault]] — el framework que gana el comando y la herramienta.
- [[Mycelium como memoria de la IA]] — el objetivo de fondo: que el vault sea navegable.
- [[esporas-plantillas]] · [[metadata-yaml]] — las otras dos piezas con núcleo puro y tests.
- [[Mapa de documentacion]] — índice general.
