# MCP de Mycelium — la mitad de memoria

**Planificación** · 2026-09-23 · `FUN-L-09` `IA-MCP-MYCELIUM`

Esta nota decide **cómo el MCP encuentra información en el vault**: el modelo de datos, la
granularidad, el ranking, las herramientas y su formato de respuesta, cuándo se reindexa y
dónde corre el servidor. Parte de [[MCP de Mycelium - encuadre]], que fija los hechos y las
restricciones; las otras dos mitades son [[MCP de Mycelium - control]] (operar la app) y
[[MCP de Mycelium - evaluacion]] (medir si esto sirve).

> [!important] Solo se planifica
> No hay código todavía. Lo que sigue son decisiones con su porqué, no una implementación.

> [!success] Actualización 2026-09-24: la fase 1 está construida
> `vault_buscar` y `vault_leer` sobre el índice propio, en el crate compartido
> `mycelium-vault` y el binario `mycelium-mcp` (rama `feat/mcp-memoria`). Lo que se
> construyó **distinto** de lo que dice esta nota, y lo que se midió, está en el
> § 13. El resto de la nota sigue siendo el diseño.

> [!warning] Actualización 2026-09-24 (tarde): la fase 1 perdió y se rehizo
> La tanda de la fase 1 perdió contra `grep` y [[MCP de Mycelium - diagnostico fase 1]]
> explicó por qué. Lo rehecho —la búsqueda por **cobertura** en vez del Y, la lectura de
> notas enteras hasta 20 KB, el índice de secciones sin corte y las instrucciones en las
> descripciones— está en el **§ 14**, y reemplaza lo que dicen los §§ 4 («Lo que se
> pierde, y cómo se recupera») y 7 (`vault_leer`, el tope de ~8 KB).

> [!info] Cómo leer los números
> Todo lo medido se midió **sobre este repo** el 2026-09-23 (`docs/`, 93 notas) y sobre el
> vault personal `Trabajo y Estudio` (1220 notas), que sirve de segundo caso real. Lo
> estimado va marcado como **(est.)**. Los tokens se calculan a 4 bytes por token; en
> español con acentos el tokenizador rinde algo peor, así que las cifras de tokens son un
> **piso**, no un techo.

---

## 1. La v1 en una frase, y el número que la justifica

> [!success] La v1 es: **FTS5 por sección + una tabla de enlaces materializada + cinco
> herramientas que devuelven previews.**
> Nada más. Sin embeddings, sin comunidades, sin escritura, sin grafo de 3 saltos.

El objetivo del encuadre es «mejor que `grep`». Eso hay que medirlo, así que se midió con
una consulta real del vault —«enlaces»— contra `docs/`:

| Paso | Con `grep` | Con el MCP |
|---|---|---|
| **Localizar** | `grep -ril "enlaces" docs` → **35 archivos**. Leerlos cuesta **694 KB ≈ 173.000 tokens** | 10 previews ≈ **1,7 KB ≈ 420 tokens** (est.) |
| — variante barata | `grep -rn "enlaces" docs` → **25,6 KB ≈ 6.400 tokens** de líneas sueltas, sin orden ni contexto | — |
| **Leer lo elegido** | la nota entera: `BACKLOG.md` = **126.533 bytes ≈ 31.600 tokens** | la sección: `FUN-L-09` en `BACKLOG.md` = **698 bytes ≈ 175 tokens** |

El segundo renglón es el que decide el diseño. Responder «¿qué dice el backlog de
`FUN-L-09`?» cuesta hoy **31.600 tokens** o cuesta **175**: un factor de **181**. Y no es
un caso raro: la mediana de sección en `docs/` es de **556 bytes** y en el vault personal de
**392 bytes**, contra notas de **12,5 KB** y **4,6 KB** de media respectivamente.

> [!warning] `grep -rn` parece barato y no lo es
> Devuelve líneas sueltas sin jerarquía: el agente todavía no sabe cuál abrir, así que
> abre tres notas «por si acaso». El costo real de `grep` no son sus 6.400 tokens de
> salida, son las lecturas completas que provoca después.

---

## 2. Dónde corre y cómo lee

### Decisión: un binario propio, que **nunca** abre el índice de la app

El servidor MCP es un **ejecutable aparte** (`mycelium-mcp`), hablando **stdio**, que
mantiene **su propio índice SQLite** y **nunca** abre `index-<hash>.db`, el índice de la app.

El porqué está en las restricciones 3 y 4 del encuadre:

- **El índice de la app tiene dueño.** Abrirlo aunque fuera en solo lectura ata el MCP a un
  esquema que cambia cuando cambia la app (`lib/db/indexer.ts` es literalmente un
  `CREATE TABLE` por tabla, sin migraciones versionadas) y lo pone a competir con el pool
  de hasta 10 conexiones de `tauri-plugin-sql`.
- **Tiene que servir con la app cerrada**, y ahí el índice de la app está **viejo por
  definición**: solo se reindexa al abrir el vault y cuando el watcher dispara, o sea,
  mientras Mycelium corre. Si Claude Code escribe tres notas con la app cerrada —que es el
  caso de uso principal—, el índice de la app no las tiene. Leerlo daría respuestas
  silenciosamente incompletas, que es el peor resultado posible para una memoria.
- **El problema de los dos escritores (`FUN-L-16`) desaparece por construcción**: son dos
  archivos distintos. El MCP escribe el suyo y no toca el de nadie.

El único archivo de la app que el MCP lee es `vaults.json` (JSON de 780 bytes, solo
lectura), y solo como respaldo para resolver un vault por nombre.

**Alternativas descartadas:**

| Alternativa | Por qué no |
|---|---|
| Leer el índice de la app en solo lectura | Viejo con la app cerrada; acoplamiento a un esquema sin versionar; contención con el pool del plugin |
| Escribir en el índice de la app | Es exactamente el escenario de dos escritores que `FUN-L-16` tuvo que prohibir en la propia app |
| Sin índice: `grep`/`ripgrep` por debajo, envuelto en MCP | Da el paso 1 más barato pero no da el paso 2 (secciones), ni backlinks correctos, ni ranking. Es `grep` con otro nombre |
| Servidor HTTP compartido entre sesiones (como graphify) | Un proceso más que levantar y matar, y un puerto abierto en la máquina del usuario, a cambio de compartir un caché que ya es barato de reconstruir |

### Dónde vive el índice del MCP

En el app-data de Mycelium, al lado del de la app: `%APPDATA%/com.mycelium.desktop/mcp-<hash>.db`,
con **la misma función de hash** que `abrirIndiceDeVault` (primeros 8 bytes del SHA-256 de
la ruta absoluta del vault, en hexadecimal).

Dos razones, y la segunda es la fuerte:

1. Si algún día los dos índices convergen en uno (ver § 10), la migración es «borrar uno»,
   no «mover archivos y reescribir rutas».
2. **El vault es una carpeta de texto plano y tiene que seguir siéndolo.** Un `.db` de 8 MB
   dentro del vault se sincronizaría con Dropbox/OneDrive, aparecería en `git status` y
   rompería la promesa del producto. Que `.mycelium/` ya guarde la papelera no es motivo
   para meter ahí un blob binario que crece con el vault.

### Journal, concurrencia y solo lectura

- **`journal_mode=WAL`**, por el mismo motivo que ya lo usa la app: el reindexado son miles
  de statements sueltos sobre un caché reconstruible. Además WAL es lo que permite que una
  consulta se sirva mientras otra sesión reindexa.
- **`busy_timeout=5000`**. Dos sesiones de Claude Code en el mismo vault levantan dos
  servidores sobre el mismo archivo. WAL serializa a un escritor por vez; el timeout hace
  que el segundo espere en vez de fallar.
- **Cerrojo consultivo** en la tabla `meta`: una fila `reindex_en_curso = <pid>:<epoch>`,
  que caduca a los 30 s. Sirve para que dos servidores no hagan **la misma pasada**, no
  para corrección: la corrección la da WAL.
- **Cada nota se reindexa en una transacción propia.** El reindexado de 400 notas no es una
  transacción de 400 notas: si el proceso muere a la mitad, lo escrito es consistente y lo
  que falta se detecta por `mtime` en el próximo arranque.
- **Si no se puede escribir** el índice (volumen de solo lectura, permisos), se reintenta en
  el directorio temporal del sistema; si tampoco, **las herramientas devuelven un error
  explícito** diciendo que el índice no está disponible y que conviene usar `grep`. Nunca
  se devuelven resultados parciales sin avisar: una memoria que miente es peor que ninguna.

### En qué lenguaje

**Rust, como binario secundario del bundle de Tauri.** El costo y el porqué, sin adornos:

- **A favor**: no agrega ninguna dependencia de runtime. Un MCP en Node obligaría a que el
  usuario tenga Node instalado, y Mycelium se vende como un instalador que funciona sin red
  y sin nada más. Además ya existe en Rust lo más aburrido de escribir: el walker
  (`archivos.rs`) y el filtro `.mycignore` (`mycignore.rs`, con tests).
- **En contra**: hay que **portar a Rust el parseo** que hoy solo existe en TypeScript —
  `lib/wikilinks.ts` (~70 líneas), `lib/frontmatter.ts` y la parte de `lib/propiedades.ts`
  que deriva propiedades y tags. Son pocas líneas pero son **la** fuente de los casos
  borde ya resueltos (la barra escapada de `DEF-045`, el frontmatter no soportado).
- **Por qué el costo es una inversión y no un peaje**: ese port **es** la mitad de
  `FUN-L-10` (mover el indexado del vault a Rust). Si se hace bien, queda un crate
  compartido y la app deja de indexar desde el frontend.

> [!tip] Si hace falta validar antes de pagar el port
> Un prototipo desechable en Node contra el arnés de [[MCP de Mycelium - evaluacion]] sirve
> para calibrar el ranking sin comprometerse a Rust — reutilizando los parsers TS tal cual,
> que ya son puros y sin imports a propósito. Es un **prototipo**, no un producto, y hay
> que decirlo antes de escribirlo o se queda.

---

## 3. El modelo de datos

```mermaid
erDiagram
    NOTAS ||--o{ SECCIONES : "se parte en"
    SECCIONES ||--|| SECCIONES_FTS : "se indexa en"
    SECCIONES ||--o{ ENLACES : "contiene"
    NOTAS ||--o{ PROPIEDADES : "declara"
    NOTAS ||--o{ TAGS : "lleva"
    ENLACES }o..o| NOTAS : "resuelve por titulo_norm"

    NOTAS {
        text id PK "ruta relativa POSIX"
        text titulo "nombre sin extension"
        text titulo_norm "minusculas, indexado"
        text tipo "markdown, canvas, base..."
        int  mtime "epoch ms, valida lo incremental"
        int  bytes
        int  secciones "cuantas tiene"
    }
    SECCIONES {
        int  id PK
        text nota_id FK
        int  orden "0 es el preambulo"
        int  nivel "1 a 6; 0 si no hay encabezado"
        text encabezado "el texto del titulo"
        text ruta_encabezados "migas: Nota > H2 > H3"
        int  linea_ini
        int  linea_fin
        int  bytes
        int  parcial "1 si es un trozo de una seccion grande"
    }
    SECCIONES_FTS {
        int  seccion_id "UNINDEXED"
        text titulo_nota "columna con peso alto"
        text encabezados "columna con peso medio"
        text cuerpo "columna con peso base"
    }
    ENLACES {
        text origen_id FK
        int  seccion_id FK
        text destino_bruto "lo escrito entre corchetes"
        text destino_norm "ultimo segmento, sin ancla, minusculas"
        text alias "null si no hay"
        text ancla "seccion o bloque; null si no hay"
        int  embed "1 si lleva admiracion delante"
        int  linea
    }
    PROPIEDADES {
        text nota_id FK
        text clave
        text valor
        text tipo
        int  orden "una fila por elemento de lista"
    }
    TAGS {
        text nota_id FK
        text tag
        text fuente "frontmatter o cuerpo"
    }
    META {
        text clave PK
        text valor "version_esquema, ruta_vault, ultimo_indexado..."
    }
```

### Qué **no** está y por qué

- **No hay tabla `contenidos`.** El texto completo de la nota no se duplica en el índice: el
  único lugar donde vive el texto es la columna `cuerpo` del FTS, que es la que hace falta
  para que `snippet()` funcione. Cuando el agente pide el **detalle** de una sección, el
  servidor lo lee **del archivo en disco** con `linea_ini`/`linea_fin`. Así lo que se
  devuelve es lo que hay ahora mismo en el archivo, no lo que había cuando se indexó.
- **No hay tabla `papelera`.** Una nota en la papelera se movió físicamente a
  `.mycelium/.trash`, que `.mycignore` ignora siempre, así que el walker nunca la ve y no
  entra al índice. La complicación de `DEF-046` es un problema del índice de la app, no de
  este.
- **No hay `usuarios`/`vaults`/`membresias`/`css_snippets`.** El índice de la app las
  necesita porque **es** la base de datos de la app. Este índice es solo un caché de
  recuperación.
- **No hay `destino_id` en `ENLACES`.** Es la decisión de § 5 y la más consecuente de todas.

### Tamaño esperado

| Vault | Texto | Secciones | Índice estimado |
|---|---|---|---|
| `docs/` de este repo | 1,16 MB | 1.291 | **≈2–3 MB** (est.) |
| `Trabajo y Estudio` | 5,60 MB | 6.199 | **≈9–14 MB** (est.) |

La estimación asume que un FTS5 con contenido pesa entre 1× y 1,5× el texto indexado, más
el resto de las tablas. Como referencia real: los índices que la app ya tiene en app-data
para los vaults del usuario van de 1,2 MB a 67 MB. **Hay que confirmarlo midiendo**, no dar
la estimación por buena.

---

## 4. La granularidad: se indexa por sección

### Decisión: la unidad de recuperación es la **sección**, no la nota

Una sección es lo que hay entre un encabezado `#`…`######` y el siguiente **de cualquier
nivel** (no anidado: cada línea del archivo pertenece a exactamente una sección). El texto
anterior al primer encabezado es la sección `orden = 0`, con `nivel = 0`. Los encabezados
**dentro de un bloque de código** no cortan: hay que llevar el estado de la cerca —tres
acentos graves o tres virgulillas— al partir, o cualquier nota que documente Markdown se
parte en pedazos absurdos. Esta misma nota es un caso.

**El porqué, medido:**

| | `docs/` (93 notas) | `Trabajo y Estudio` (1220 notas) |
|---|---|---|
| Nota media | 12.513 bytes (**≈3.100 tokens**) | 4.591 bytes (**≈1.150 tokens**) |
| Sección media | 900 bytes (**≈225 tokens**) | 903 bytes (**≈225 tokens**) |
| Sección mediana | 556 bytes | 392 bytes |
| p90 | 1.593 bytes | 1.208 bytes |

Devolver la sección en vez de la nota divide el costo de la lectura por **14** en `docs/` y
por **5** en el vault personal. Y el caso peor —`BACKLOG.md`— lo divide por **181**.

> [!important] El dato que casi rompe la decisión: casi la mitad de las notas reales no
> tienen encabezados
> En `docs/` solo **1 de 93** notas no tiene ningún encabezado. En el vault personal son
> **575 de 1220 (47%)**. Una nota sin encabezados es **una sola sección igual a la nota
> entera**, y ahí la granularidad por sección no gana nada.
>
> No invalida la decisión —esas notas miden 4,6 KB de media, que es un tamaño que se puede
> devolver— pero sí obliga al tope de abajo, porque la sección **más grande** medida tiene
> **489 KB**.

### El tope: 4 KB por unidad indexada

Una sección que pasa de **4.096 bytes** se parte en trozos por límite de párrafo, que
comparten `nota_id` y `ruta_encabezados` y se marcan con `parcial = 1`. 4 KB son ~1.000
tokens: lo más grande que tiene sentido devolverle a un agente sin que vuelva a pagar lo que
veníamos evitando.

El tope afecta a **16 de 1.291 secciones (1,2%)** en `docs/` y a **67 de 6.199 (1,1%)** en el
vault personal. Es decir: **cuesta casi nada y cubre el caso patológico.**

### Lo que se pierde, y cómo se recupera

Indexar por sección rompe el `AND` implícito entre términos que hoy hace `buscar.ts`: si
«tauri» está en una sección y «sqlite» en otra de la misma nota, la consulta `tauri sqlite`
ya no casa. Es una regresión real.

> [!caution] Reemplazado en el § 14
> El respaldo de abajo se construyó y **falló** en la tanda: exigía el mismo Y un nivel más
> arriba. Ahora alcanza con un término y el orden premia la cobertura.

**Se resuelve sin una segunda tabla FTS**: `vault_buscar` primero consulta a nivel sección
con `AND`; si devuelve cero, emite **una subconsulta por término** e **intersecta por
`nota_id`**, devolviendo la mejor sección de cada término. Son 1–4 subconsultas sobre 6.000
filas: irrelevante en tiempo, y evita duplicar el índice.

**Alternativas descartadas:**

| Alternativa | Por qué no |
|---|---|
| Solo nota (como hoy) | Es el costo de 31.600 tokens del § 1. Es exactamente el problema |
| Dos tablas FTS (nota + sección) | Duplica el índice y el reindexado para resolver un caso que se arregla con dos subconsultas |
| *Chunks* de tamaño fijo con solape (RAG clásico) | Corta a mitad de frase, duplica texto en el solape y tira la estructura. El Markdown **ya trae** sus límites semánticos escritos: usarlos es gratis y es mejor |
| Por párrafo | Demasiado fino: pierde el contexto del encabezado y multiplica las filas por ~10 |

---

## 5. Los enlaces: materializados, pero **resueltos por join**

### Decisión: se guarda la arista tal como está escrita, no a dónde apunta

`ENLACES` guarda `destino_norm` (el destino normalizado: último segmento de la ruta, sin
ancla, en minúsculas) y **no** guarda un `destino_id`. La resolución es un `JOIN` contra
`notas.titulo_norm` **en el momento de la consulta**.

> [!success] Es lo que hace trivial el reindexado incremental
> Si se guardara `destino_id`, **crear** una nota obligaría a re-resolver todos los enlaces
> rotos que pudieran apuntarle, y **renombrar** una obligaría a re-resolver todos los que le
> apuntaban: un reindexado local se convertiría en una pasada global. Con el join, escribir
> una nota toca **solo las filas de esa nota**. Siempre.
>
> Y de yapa, la verdad que devuelve es la de este instante: crear la nota que faltaba
> repara sus backlinks **sin reindexar nada**.

El costo del join es una búsqueda por índice sobre `notas.titulo_norm`. Sobre 1.220 notas es
irrelevante (est.).

### Qué gana esto contra `grep`, en concreto

El protocolo de recuperación de `CLAUDE.md` propone hoy `grep -rl "\[\[Título" docs`. Eso:

- **No encuentra** `[[Carpeta/Título]]`, que es la misma arista escrita con ruta.
- **No encuentra** `[[Título\|alias]]` dentro de una tabla: la barra va escapada y es un
  caso real y documentado (`DEF-045`), en el que la vista de lectura muestra el enlace
  perfecto **mientras la conexión no existe**. Un `grep` ingenuo lo pierde en silencio.
- **Sí encuentra** los `[[…]]` que están dentro de bloques de código de ejemplo, que no son
  enlaces.

La tabla `ENLACES` los parte con `partirWikilink()`, que ya resuelve los tres casos. **Esto
no es "lo mismo pero más rápido": es un resultado distinto y correcto.**

### Enlaces rotos, alias y ambigüedad

- **Roto** = la fila existe y el `LEFT JOIN` devuelve `NULL`. No se borra ni se esconde: es
  información valiosa (es lo que `/vault-huerfanas` busca hoy con un escaneo completo) y se
  repara sola cuando aparece el destino.
- **Alias** (`[[destino|alias]]`): se guardan los dos. El destino manda para la arista; el
  alias se devuelve porque es **cómo se llama a esa idea en ese contexto**, y eso es
  vocabulario útil para la siguiente consulta.
- **Ambigüedad**: si dos notas comparten título, el join devuelve **las dos** y la respuesta
  las marca `ambiguo: true`. El grafo de la app resuelve a «la primera que aparezca», lo que
  esconde una violación de la regla dura nº1 del vault (títulos únicos). Devolver las dos y
  decirlo es más honesto y además es un diagnóstico. Es la idea de las aristas con confianza
  de graphify, en su versión más barata.
- **Refinamiento** cuando `destino_bruto` trae ruta (`[[Carpeta/Nota]]`): se prefiere el
  candidato cuyo `id` termine en esa ruta. El grafo actual tira esa información al quedarse
  con el último segmento.

### Lo que cuesta mantenerlo

Al reindexar una nota: `DELETE FROM enlaces WHERE origen_id = ?` + un `INSERT` por enlace.
La media de `docs/` es de **16 enlaces por nota** (1.517 enlaces / 93 notas). Es decir,
**~17 statements**, dentro de la misma transacción que ya reescribe sus secciones.

Comparado con lo que hay hoy, que es el punto: `grafo.ts` **carga el contenido de todas las
notas del vault en una sola consulta y escanea todo con una expresión regular** cada vez que
se le pide el grafo o los backlinks de una nota. Para `docs/` son 1,16 MB por pregunta; para
el vault personal, 5,6 MB. Con la tabla, un backlink es una búsqueda por índice.

---

## 6. El ranking

### Decisión: BM25 manda, y **el resto se calibra, no se inventa**

El puntaje es una suma ponderada de cuatro señales normalizadas a `[0,1]`:

| Señal | Qué es | De dónde sale |
|---|---|---|
| `rel` | Relevancia léxica | `-bm25(secciones_fts, 0, W_tit, W_enc, 1.0)`, normalizado dividiendo por el mejor del conjunto |
| `pop` | Cuánto la citan | `log1p(backlinks) / log1p(max_backlinks_del_vault)` |
| `prox` | Cercanía en el grafo | `0.5^d`, con `d` = saltos hasta la nota que el agente pasa en `cerca_de`; `0` si no pasó ninguna |
| `rec` | Recencia | `exp(-dias_desde_mtime / 90)` |

```
puntaje = w_rel·rel + w_pop·pop + w_prox·prox + w_rec·rec
```

> [!danger] La v1 sale con `w_rel = 1` y **todo lo demás en 0**
> Los pesos «razonables» que uno escribiría acá (0,60 / 0,15 / 0,15 / 0,10) son una opinión
> disfrazada de número. El encuadre es explícito: *lo que no se puede medir, no se decide*.
>
> Así que la v1 **calcula las cuatro señales y las devuelve en la respuesta**, pero solo
> `rel` ordena. El arnés de [[MCP de Mycelium - evaluacion]] registra las cuatro en cada
> consulta, y los pesos se ajustan **offline** sobre ese registro —una regresión sobre
> consultas ya ejecutadas— sin volver a correr la recuperación. Un peso entra a producción
> cuando muestra una mejora medida, no antes.

Esto es barato de construir (las cuatro señales son una consulta SQL cada una) y convierte
la calibración de un debate en un experimento.

### Por qué esas cuatro y no otras

- **`rel` primero** porque es lo único que sabe de qué habla la consulta. Las otras tres son
  *priors*: ordenan empates, no encuentran nada.
- **`pop`** es el equivalente honesto de PageRank a esta escala. El vault premia el enlace
  como unidad de valor; una nota muy citada suele ser el hub del tema.
- **`prox`** es **opt-in por consulta** (`cerca_de`), no un peso global. Es la diferencia
  entre «buscá "ranking"» y «buscá "ranking" mientras trabajo en `MCP de Mycelium - memoria`».
  El agente sabe en qué está; el índice no.
- **`rec`** es la más débil de las cuatro y hay que decirlo: el `mtime` de un vault versionado
  miente. Un `git clone` pone la misma fecha en todo y un `git pull` toca lo que no cambió.
  Candidata a quedar en 0 permanentemente.

**Alternativas descartadas:**

| Alternativa | Por qué no |
|---|---|
| Pesos fijos elegidos a ojo | Es el error que el encuadre prohíbe. Además nadie los vuelve a tocar |
| PageRank / detección de comunidades (Leiden, como graphify) | Un cálculo global que hay que rehacer al cambiar el grafo, para mejorar un *prior* que todavía no demostró aportar nada. Fase 2, si `pop` demuestra que la señal de grafo sirve |
| Un LLM que reordene los candidatos | Paga tokens justo en el paso que viene a abaratar tokens |
| `ORDER BY rank` a secas (lo de hoy) | Es la v1, con el nombre correcto: `w_rel = 1` **es** `ORDER BY rank`. La diferencia es que ahora las otras señales quedan registradas |

---

## 7. Las herramientas

Cinco, agrupadas por **intención** y no por tabla —la lección de engram—, con el prefijo
`vault_` para que sigan la línea de los comandos `/vault-*` que el usuario ya conoce.

> [!important] Esta mitad es **de solo lectura**
> No hay `vault_escribir`, `vault_crear` ni `vault_renombrar`. El agente ya escribe notas
> perfectamente con sus herramientas de archivos, y una herramienta de escritura acá
> reintroduciría el problema de los dos escritores por la puerta de atrás. Lo que se pueda
> **operar** de la app lo decide [[MCP de Mycelium - control]].

### `vault_contexto`

**Qué hace**: el *briefing* de una sesión. Se llama una vez, al empezar.

**Parámetros**: ninguno.

**Devuelve** (~400 tokens, est.): nombre y ruta del vault, cuántas notas y secciones, cuándo
se indexó por última vez, las notas mapa/índice detectadas, los 10 *hubs* por backlinks, el
vocabulario de tags con sus conteos y las claves de propiedad en uso.

**Por qué existe**: es lo más barato que se puede hacer contra el desajuste de vocabulario.
Un agente que sabe que el vault dice «retroenlaces» y no «inlinks» hace mejor la primera
consulta. Es también la razón principal por la que en § 9 se puede decir que no a los
embeddings.

### `vault_buscar`

**Parámetros**: `consulta` · `filtros?` (`propiedades`, `tags`, `carpeta`, `tipo`) ·
`cerca_de?` (nota que activa `prox`) · `ambito?` (`secciones` | `notas`, por defecto
`secciones`) · `limite?` (10 por defecto, 50 máximo).

**Devuelve**: **previews, nunca el texto completo.** Un bloque de texto compacto, dos líneas
por resultado:

```
12 resultados · mostrando 10 · índice al día (hace 3 s)

[1] docs/BACKLOG.md#s412 · BACKLOG › 1.3 Grandes › FUN-L-09
    …expone el vault a la IA como herramientas estructuradas: búsqueda en el «índice»,
    backlinks de una nota, vecindario del grafo… (rel .92 pop .41 prox .50 rec .08)

[2] docs/arquitectura/MCP de Mycelium - encuadre.md#s3 · Encuadre › Los dos objetivos
    …dar a Claude Code acceso a la «memoria» documental del vault… (rel .77 …)

Detalle: vault_leer(ref) · Quién lo cita: vault_vecinos(nota)
```

**Tres decisiones en ese formato:**

1. **Texto compacto, no JSON.** Un JSON con diez objetos repite las claves diez veces:
   ~150 tokens de llaves y comillas sobre un total de ~420. La `ref` está igual de
   disponible para copiar.
2. **Las migas (`ruta_encabezados`) van siempre.** Es lo que hace el preview
   autodescriptivo: «BACKLOG › 1.3 Grandes › FUN-L-09» dice qué es sin abrir nada.
3. **La última línea enseña el próximo paso.** Dejar la recuperación progresiva escrita en
   la respuesta es más fiable que confiar en que el agente recuerde la descripción de la
   herramienta. Es la misma intuición que los *hooks* de graphify, en su versión barata.

### `vault_leer`

**Parámetros**: `refs` (1 a 10) · `contexto?` (`0` | `1` | `2`: cuántas secciones vecinas
sumar) · `forzar?`.

**Devuelve**: el texto **leído del archivo en disco** en el momento de la llamada, con la
nota, las migas, el rango de líneas y los títulos a los que enlaza esa sección.

> [!warning] Pedir una nota entera dice lo que cuesta antes de cobrarlo
> Si la `ref` es una nota y no una sección, y la nota pasa de ~8 KB, **no** se devuelve
> entera: se devuelve su **índice de secciones** más la primera, y una línea que dice
> `para el texto completo: forzar=true (≈31.600 tokens)`. El agente casi siempre quiere una
> sección y no lo sabía. Si de verdad la quiere, la pide y la paga.

### `vault_vecinos`

**Parámetros**: `nota` · `direccion?` (`entrantes` | `salientes` | `ambas`) · `saltos?`
(1 o 2) · `limite?`.

**Devuelve**: entrantes (con el fragmento alrededor del enlace y el alias con el que la
llaman), salientes (con la `ref` de la sección donde está el enlace), y los **rotos**. Las
ambigüedades vienen marcadas.

Es la herramienta que hoy **no tiene sustituto correcto**: `grep "\[\[Título"` da un
resultado distinto y peor (§ 5), y `conexiones()` de la app escanea el vault entero para
contestarlo.

### `vault_salud`

**Parámetros**: ninguno.

**Devuelve**: notas huérfanas (sin entrantes ni salientes), enlaces rotos agrupados por
destino, títulos duplicados y frescura del índice. Tres consultas contra las tablas que ya
existen.

**Por qué entra en la v1 y no en fase 2**: es lo que hace `/vault-huerfanas` hoy con un
escaneo completo, cuesta ~30 líneas una vez que `ENLACES` existe, y es la demostración más
visible de que materializar las aristas valió la pena.

### Presupuesto de tokens de una sesión típica (est.)

| Paso | Tokens |
|---|---|
| `vault_contexto` (una vez) | ~400 |
| `vault_buscar` (10 previews) | ~420 |
| `vault_leer` de 2 secciones elegidas | ~450 |
| `vault_vecinos` de la mejor | ~250 |
| **Total** | **≈1.500** |

Contra los **173.000** del camino `grep` + leer candidatas del § 1, o los ~35.000 de un
`grep` seguido de abrir una sola nota grande. **Son estimaciones**: el número que vale es el
que mida [[MCP de Mycelium - evaluacion]].

---

## 8. El flujo de una consulta, de punta a punta

```mermaid
graph TD
    A["Claude Code · stdio JSON-RPC"] -->|vault_buscar| B["mycelium-mcp"]
    B --> C{"Ultima revalidacion hace mas de 2 s?"}
    C -->|no| F
    C -->|si| D["Walker: stat del arbol, respetando .mycignore"]
    D --> E{"Algun mtime cambio?"}
    E -->|no| F
    E -->|si| R["Reindexar SOLO esas notas, una transaccion cada una"]
    R --> F["Consulta FTS5 sobre secciones_fts"]
    F --> G{"Hubo resultados?"}
    G -->|no| H["Una subconsulta por termino, interseccion por nota_id"]
    G -->|si| I
    H --> I["Resolver enlaces por JOIN titulo_norm y calcular pop, prox, rec"]
    I --> J["Ordenar por puntaje y cortar en el limite"]
    J --> K["Previews: migas + snippet + senales"]
    K --> A

    A -->|vault_leer ref| L["Leer del ARCHIVO por linea_ini y linea_fin"]
    L --> A

    subgraph disco["En disco"]
        M["Vault: archivos .md"]
        N["mcp-hash.db en app-data"]
    end
    D -.lee.-> M
    L -.lee.-> M
    R -.escribe.-> N
    F -.lee.-> N
```

Dos cosas que el diagrama deja ver y conviene subrayar:

- **La revalidación está en el camino de la consulta**, no en un hilo aparte. Eso garantiza
  que lo que se responde refleja el disco en ese instante.
- **El índice nunca devuelve texto al agente.** El índice decide *qué* devolver; el texto
  sale siempre del archivo. Un índice viejo puede ordenar mal, pero no puede devolver
  contenido que ya no existe.

---

## 9. Actualización incremental

### Decisión: revalidación **perezosa**, con techo de 2 segundos

Antes de servir una consulta, si pasaron más de **2.000 ms** desde la última comprobación, se
recorre el árbol pidiendo solo `(ruta, mtime, tamaño)` y se reindexa lo que cambió. Es el
mismo truco de dos fases que `FUN-M-12` le puso a `indexarVault`: los metadatos son baratos,
el contenido es caro.

Costo: un `stat` de 93 archivos en `docs/`, de ~1.220 en el vault personal. **Estimado en
pocos milisegundos**; hay que medirlo, y el umbral de decisión es claro: **si la pasada
supera ~50 ms, se cambia por un watcher.**

**Por qué no un watcher desde el principio**, teniendo `notify` ya como dependencia y
`vault_watch.rs` escrito:

- El MCP es un proceso **ocioso entre llamadas**. No hay una pantalla que mantener viva: el
  único instante en el que la frescura importa es cuando llega una consulta, y ahí la
  revalidación perezosa da una garantía **más fuerte** que un watcher (el watcher tiene
  debounce y puede estar a mitad de ráfaga justo cuando llega la pregunta).
- Un watcher sobre una carpeta sincronizada en la nube genera ráfagas —está documentado en
  el propio `vault_watch.rs`— y obliga a un hilo, un debounce y un estado compartido.
- **Y el caso que más importa es el peor para el watcher**: el agente escribe una nota y
  pregunta por ella en el siguiente turno. Con revalidación perezosa está garantizado que la
  ve. Con watcher + debounce, depende de cuánto tardó el turno.

### Qué se reindexa cuando cambia una nota

**Solo esa nota.** En una transacción: borrar sus filas de `secciones`, `secciones_fts`,
`enlaces`, `propiedades` y `tags`; reparsear; reinsertar. Estimado en **menos de 5 ms** para
una nota de 12,5 KB (un parseo de un solo paso más ~40 inserts).

**Nada de otras notas se toca**, y eso es consecuencia directa de la decisión de § 5: como
los enlaces no guardan a dónde apuntan, escribir una nota no puede invalidar la resolución de
ninguna otra.

| Qué pasó en disco | Qué hace el índice |
|---|---|
| Nota modificada (`mtime` distinto) | Reindexa esa nota |
| Nota nueva | La indexa; los enlaces rotos que le apuntaban **se reparan solos** en el próximo join |
| Nota borrada | Borra sus filas; los enlaces que le apuntaban pasan a rotos **solos** |
| Nota renombrada / movida | Borrado + alta. Los backlinks al título viejo quedan rotos, que es **exactamente lo que pasó en el disco** |
| `.mycignore` cambió | Se detecta por su `mtime` y se fuerza una pasada completa |
| `meta.version_esquema` no coincide | Se descarta el índice y se reconstruye. Mismo patrón defensivo que el `forzarTodo` de `indexarVault` |

### El arranque en frío

Primera vez en un vault: hay que leer y parsear todo. Para `docs/` son 1,16 MB y 93
archivos; para el vault personal, 5,6 MB y 1.220. **Estimado en 1–3 segundos** en Rust, con
todo en un proceso y sin puente IPC de por medio —que es justo lo que hace lento al indexador
de hoy—. Como es al arrancar el servidor y no en la primera consulta, el agente casi nunca
lo espera. **Pendiente de medir.**

---

## 10. Embeddings: no, y qué haría cambiar de opinión

### Decisión: la v1 no lleva embeddings ni almacén de vectores

graphify los rechaza por principio. Acá el rechazo no es por principio sino por **este**
caso, y por tres motivos concretos:

1. **La restricción de local y sin conexión convierte «agregar embeddings» en «empaquetar un
   modelo».** Sin red, hay que meter un runtime ONNX y un modelo multilingüe en el
   instalador. La referencia de costo es fresca: draw.io llevó el instalador a **40,3 MB** y
   ese sobrecosto fue tema de discusión con el usuario. Un modelo multilingüe decente, aun
   cuantizado, está en el mismo orden o peor.
2. **La escala no lo pide.** 1.291 secciones en `docs/`, 6.199 en un vault personal de 1.220
   notas. BM25 sobre esos volúmenes no tiene un problema de precisión que un vector vaya a
   arreglar. (El almacenamiento, curiosamente, **no** es el problema: 6.199 × 384 floats son
   ~9 MB y un escaneo por fuerza bruta a esa escala es instantáneo. El problema es el modelo.)
3. **El vault tiene vocabulario controlado, y encima ya tiene un tesauro escrito.** Lo
   redactan dos autores —el usuario y el agente— con los mismos términos, los `[[enlaces]]`
   **son** las asociaciones, y el **léxico** de `FUN-M-17` ya guarda exactamente lo que un
   embedding vendría a aproximar: su tipo es
   `DestinoLexico = { titulo, formas[] }` — «un destino con las formas en que el corpus lo
   nombra»— en `.claude/enlaces-lexico.json`. Es un mapa de sinónimos **por vault,
   determinista, inspectable y curado por el usuario**. Antes de estimar sinónimos con un
   modelo de 300 MB conviene usar el archivo que ya los tiene escritos.

Lo que sí se pierde: el desajuste de vocabulario cuando el usuario pregunta con palabras que
la nota no usa («cómo evito que dos procesos escriban el índice» contra una nota que dice
«dos escritores»). Es real y es estrecho.

### Lo barato que hay que probar **antes**

**Expansión de consulta** a partir de material que ya existe: el léxico del vault, los
títulos de nota, los alias de los enlaces (§ 5) y el vocabulario de tags que devuelve
`vault_contexto`. Cero dependencias nuevas, cero MB en el instalador. Si eso cierra la brecha
de *recall*, los embeddings no se construyen nunca.

### Qué evidencia cambiaría la postura

> [!question] Los embeddings entran si pasa **1 o 2**, y además **3**
> 1. El arnés de [[MCP de Mycelium - evaluacion]] mide **recall@10 por debajo de 0,80** en la
>    clase de preguntas «con las palabras del usuario, no las del vault», **y** los fallos
>    son atribuibles a desajuste de vocabulario: la respuesta existe y no contiene ningún
>    término de la consulta. Si los fallos son de otra cosa, un vector no los arregla.
> 2. Aparece un vault de más de **~5.000 notas / ~25.000 secciones**, donde BM25 empieza a
>    perder precisión porque demasiadas secciones comparten vocabulario.
> 3. Existe un modelo con calidad aceptable en español que sume **menos de ~40 MB** al
>    instalador (el precio que ya se pagó por draw.io, que al menos es el tope conocido y
>    aceptado), y la expansión de consulta ya se probó y **no** alcanzó.

Y si entran, entran **como cuarta señal del ranking del § 6**, con su peso calibrado igual
que los otros — no como un sistema paralelo.

---

## 11. Lo que **no** entra en la v1

| Fase 2 | Qué evidencia lo justificaría |
|---|---|
| Watcher de archivos en vez de revalidación perezosa | La pasada de `stat` supera ~50 ms en un vault real |
| PageRank / comunidades en el grafo | `pop` demuestra en el arnés que la señal de grafo aporta, y se quiere más de ella |
| Indexar el contenido de `.canvas` (tarjetas de texto) | Se usan canvas con texto sustantivo. Hoy ni la app los indexa en FTS, y son prosa de verdad, a diferencia de `.base` y `.drawio` |
| Saltos de grafo > 2 en `vault_vecinos` | Alguien lo pide; a 3 saltos en un vault denso el vecindario es casi el vault entero |
| Un índice único compartido con la app (convergencia con `FUN-L-10`) | El port de los parsers a Rust está hecho y el indexador de la app ya vive ahí. Entonces «dos índices» pasa a ser deuda, no diseño |
| Embeddings | § 10 |

---

## 12. Preguntas abiertas

> [!question] No decididas a propósito. Una pregunta bien planteada vale más que una
> decisión inventada.

1. **¿Rust de entrada, o prototipo Node primero?** Está decidido que el producto es Rust
   (§ 2). Lo que **no** está decidido es si conviene pagar antes un prototipo desechable en
   Node para calibrar el ranking contra el arnés. Depende de cuándo esté listo el arnés.
2. **¿4 KB es el tope correcto?** Cubre el 98,8% de las secciones sin partirlas, pero el
   número sale de «~1.000 tokens suena bien», no de una medición de utilidad. El arnés puede
   contestarlo probando 2 KB, 4 KB y 8 KB.
3. **¿`secciones` o `notas` por defecto en `vault_buscar`?** La medición dice secciones, pero
   el 47% de notas sin encabezados del vault personal hace que en ese vault los dos modos
   coincidan casi siempre. Puede que el parámetro sobre.
4. **¿Qué hace el MCP con los tipos que no son `.md`?** Hoy un `.excalidraw`, `.base`,
   `.canvas` o `.drawio` existe en el árbol pero su contenido no entra al FTS. ¿Aparecen
   como notas sin cuerpo (para que `[[Mi base]]` resuelva y no cuente como roto) o no
   aparecen? Inclinación: **aparecen en `NOTAS`, sin secciones**, que es lo que hace hoy el
   grafo y evita falsos enlaces rotos. Falta confirmarlo.
5. **¿Cómo se registra el servidor en `.mcp.json`?** El generador de `FUN-L-08` es el lugar
   natural —ya escribe `CLAUDE.md`, dos skills y seis comandos— pero implica subir
   `FRAMEWORK_IA_VERSION` y toca terreno de [[MCP de Mycelium - control]]. Se decide allá.
6. **¿Y los comandos `/vault-*` que ya existen?** Con el MCP andando, `/vault-buscar` y
   `/vault-huerfanas` hacen a mano lo que una herramienta hace mejor. ¿Se reescriben para
   usar el MCP, se borran, o quedan como camino de respaldo para cuando el MCP no está?
   Inclinación: **reescribirlos** para que usen el MCP y caigan a `grep` si no responde.
7. **¿Cuánto pesa de verdad el índice?** Las cifras de § 3 son estimadas a 1–1,5× el texto.
   Es lo primero que hay que medir cuando exista el primer índice real.

---

## 13. Notas de implementación de la fase 1 (2026-09-24)

Lo construido para la fase 1 del [[MCP de Mycelium - plan]] (§ 6): `vault_buscar` y
`vault_leer`. Esta sección dice **qué quedó distinto de lo diseñado arriba y por qué**,
y los números medidos que reemplazan a las estimaciones.

### 13.1 Dónde está cada cosa

| Pieza | Dónde | Qué |
|---|---|---|
| Crate compartido | `frontend/src-tauri/crates/mycelium-vault` | `.mycignore`, `rutas` (`misma_ruta`, `hash_ruta`), `registro` (`vaults.json`), `tipos`, `recorrido` (el walker), `wikilinks`, `frontmatter`, `markdown` (código, enlaces, tags, secciones) y, detrás de la feature `indice`, el índice SQLite |
| Servidor | `frontend/src-tauri/crates/mycelium-mcp` | Binario delgado: resolución del vault, protocolo, formato de respuesta, registro de búsquedas |
| Prueba de equivalencia | `frontend/scripts/equivalencia-indice.mjs` | Parsers de TS contra los de Rust, sobre un vault real |

`src-tauri/` pasó a ser un **workspace** con la app como paquete raíz: `target/` y
`Cargo.lock` no se movieron y `tauri build` sigue compilando solo la app. Lo que la app
ya tenía en Rust y el MCP necesitaba —`mycignore.rs`, `misma_ruta`, el walker de
`listar_archivos_meta`, los tipos de archivo, el formato de `vaults.json`— **se movió** al
crate (no se copió) y la app lo usa desde ahí; sus 43 tests pasan igual.

### 13.2 Lo que se construyó distinto, y por qué

- **`secciones_fts` usa el `rowid`** (= `secciones.id`) en vez de una columna
  `seccion_id UNINDEXED`. Es lo mismo, sin una columna más en cada fila del FTS.
- **La `ref` es `ruta#s<orden>`**, y el orden `0` existe **solo** si hay preámbulo con
  contenido (frontmatter incluido): una nota que empieza con `#` arranca en `#s1`.
  `ENLACES` guarda `seccion_orden` en vez de `seccion_id`, y además `destino` (sin alias):
  así la sección de un enlace se resuelve por `(nota, orden)` sin otro join.
- **Los enlaces se materializan ya en la fase 1**, aunque `vault_vecinos` sea de la
  fase 2: la señal `pop` los necesita y `vault_leer` devuelve «a qué enlaza esta
  sección» (con rotos y ambiguos). Lo que queda para la fase 2 son las herramientas.
- **El código es texto buscable pero nunca estructura.** Plan § 3.1 dice que el código
  «no es texto indexable de la misma forma»: se implementó como que su texto **sí** va al
  FTS —un identificador entre acentos graves, `FUN-L-09`, `vault_buscar`, es justo lo que
  se busca— pero **nunca** produce enlaces, etiquetas ni cortes de sección.
- **Las migas omiten el H1-título.** Si un documento tiene un solo H1 y es su primer
  encabezado, hace de título y como ancestro no entra: `Nota > H2 > H3`, que es como las
  escribe el plan § 4.4. En el preview se omite además el título de la nota, que ya está
  en la `ref`.
- **Cinco señales, no cuatro**: `rel pop prox rec anc` (la quinta es la del plan § 4.1,
  el texto de los enlaces entrantes, sobre `enlaces_fts`). Todas en peso 0 salvo `rel`. En
  el preview van como `[1 .46 0 1 0]` con la leyenda una sola vez en la cabecera: los
  nombres repetidos diez veces eran ~80 tokens que no le sirven al agente. `anc` es una
  señal **de nota** aplicada igual a todas sus secciones; la regla de fusión que pide la
  revisión (§ 3.8) queda para la calibración.
- **BM25 con pesos de columna 4 · 2 · 1** (título · migas · cuerpo), tokenizador
  `unicode61 remove_diacritics 2` («indice» encuentra «Índice») y prefijo en cada término
  («enlace» encuentra «enlaces»). Los tres pesos quedan escritos en cada línea del registro
  de búsquedas: son parámetros de calibración, no decisiones.
- **Registro de búsquedas** (plan § 4.3): `mcp-<hash>-busquedas.jsonl`, al lado del índice.
  Una línea por `vault_buscar` con la consulta, la expresión FTS, los filtros, el modo, el
  total y la lista ordenada con `bm25`, las cinco señales y el puntaje. Rota a los 20 MB.
- **El arranque en frío no bloquea `initialize`** (revisión § 3.3): corre en un hilo, y una
  herramienta llamada antes devuelve `INDEXANDO (hechas/total)`.
- **`vault_leer` revalida la nota antes de resolver la `ref`** (revisión § 2.5); si cambió,
  la reindexa y lo avisa en la respuesta.
- **Transacciones `IMMEDIATE`**, y la comprobación de versión del esquema dentro de una:
  con dos sesiones en frío sobre el mismo índice, SQLite devuelve «locked» sin pasar por
  `busy_timeout` en dos puntos (el paso a WAL y una transacción que empieza leyendo y
  después escribe). Con `IMMEDIATE` la segunda sesión espera su turno.
- **Los tipos que no son `.md` entran como nodos sin secciones** (la inclinación de § 12.4
  y del plan § 8.4, que sigue abierta como decisión del usuario): `[[Mi base]]` resuelve y
  no cuenta como roto.
- **Nota de más de 8 KB pedida entera**: índice de secciones (hasta 40 filas; si hay más,
  solo hasta H3/H2/H1) + la primera sección + el precio de la entera. *(Reemplazado en el
  § 14: el tope es 20 KB y el índice va completo.)*

### 13.3 Decisiones de construcción

- **Protocolo a mano, no el SDK oficial (`rmcp`)**: la superficie es `initialize`, `ping`,
  `tools/list` y `tools/call` sobre JSON-RPC por línea (~150 líneas). El SDK trae tokio,
  macros y `schemars` para un servidor síncrono de una llamada a la vez, alarga la
  compilación en una máquina que ya compila Tauri con `CARGO_BUILD_JOBS=2` y su API cambia
  entre menores. Si hacen falta notificaciones, cancelación o HTTP, se migra: las
  herramientas no dependen del transporte.
- **rusqlite 0.32**, con la **misma** `libsqlite3-sys` 0.30 que sqlx: el crate declara
  `links = "sqlite3"` y un workspace no admite dos. La feature `indice` hace que la app no
  lo compile mientras siga indexando desde el frontend.
- **Empaquetado (sin cablear)**: el binario se llama `mycelium-mcp` y comparte `target/`
  con la app; va como `bundle.externalBin` (sidecar), que lo instala junto a
  `Mycelium.exe`. Así la ruta a registrar en Claude Code es estable entre versiones.

### 13.4 Medido (reemplaza las estimaciones de §§ 3, 7 y 9)

Binario de release, Windows, 2026-09-24. Tokens a 4 bytes por token, como en el resto de
la nota.

| Qué | Estimado | Medido |
|---|---|---|
| `vault_buscar` con 10 previews («enlaces») | ~420 tokens | **2.292 bytes ≈ 573 tokens** |
| `vault_buscar` con 5 previews («dos escritores») | — | 1.531 bytes ≈ 383 tokens |
| `vault_leer` de una sección (plan § 2.3) | ~225 tokens | 630 bytes ≈ 158 tokens |
| `vault_leer` de `BACKLOG.md` entero sin `forzar` | — | 2.635 bytes ≈ 659 tokens (contra ≈ 31.980 la nota entera) |
| `tools/list` (una vez por sesión) | — | 2.635 bytes ≈ 659 tokens |
| Índice, vault del repo sin copias (107 archivos) | 2–3 MB | **4,2 MB** |
| Índice, `Trabajo y Estudio` (1.223 archivos) | 9–14 MB | **16,4 MB** |
| Arranque en frío, 107 archivos | 1–3 s | **~0,33 s** (2,2–2,4 s en algunas corridas con la máquina cargada) |
| Arranque en frío, 1.223 archivos | 1–3 s | **3,95 s** |
| Revalidación sin cambios, 107 archivos | pocos ms | 2–3 ms |
| Revalidación sin cambios, 1.004 / 1.223 archivos | pocos ms | **48–62 ms** / **53–55 ms** |

> [!warning] A ~1.200 notas, la pasada de `stat` ya está en el umbral de § 9
> § 9 decidió cambiar a un watcher si la revalidación perezosa pasa de ~50 ms. En los dos
> vaults de más de mil archivos está **justo ahí** (48–62 ms). No se cambió: el umbral se
> fijó a ojo y el costo real es 50 ms por consulta como mucho una vez cada 2 s. Pero es la
> primera decisión que la medición pone en discusión.

> [!danger] El vault del repo indexa las copias de los worktrees
> El `.mycignore` de la raíz no ignora `.claude/`, así que cada worktree de un subagente
> (`.claude/worktrees/agent-*/docs/…`) entra al índice —**el de la app también**, porque es
> el mismo `.mycignore` y el mismo walker—: 1.004 archivos en vez de 107, y la búsqueda
> «enlaces» devolvía nueve copias de la misma sección. El MCP respeta el `.mycignore` a
> propósito; lo que falta es agregar `.claude/` ahí (decisión del usuario, que además
> tiene que ver con versionar ese archivo: revisión crítica § 3.2).

### 13.5 Prueba de equivalencia

`node scripts/equivalencia-indice.mjs <vault>` (plan § 3) transpila los parsers de la app
y compara archivo por archivo con `mycelium-mcp volcar`. Resultado el 2026-09-24:
**ninguna diferencia inesperada** en `docs/` (99 notas), en el vault raíz del repo (1.004
archivos, 588 filas de propiedades) ni en `Trabajo y Estudio` (1.223, 164 filas). Las
esperadas, listadas y no escondidas:

| Diferencia intencional | `docs/` | Vault raíz | `Trabajo y Estudio` |
|---|---|---|---|
| Enlaces que la app cuenta y están dentro de código | 111 | 1.014 | 49 |
| Etiquetas que la app cuenta y están dentro de código (casi todas colores `#0F6E56`) | 19 | 174 | 185 |
| `[[Nota#Sección]]` a notas que existen: la app no los resuelve, el MCP sí | 0 | 0 | 10 |

### 13.6 Pendiente o distinto del plan

- **`misma_ruta` sigue ignorando mayúsculas siempre.** El plan § 7.3 pide hacerlo solo
  donde el sistema de archivos no las distingue (no en Linux); es un cambio de
  comportamiento de la app y va aparte. Tampoco se tocó `vincular_vault` (deduplicar con
  esa normalización, § 7.3.3).
- **La app sigue parseando en TypeScript**: el crate ya tiene los parsers, pero pasar el
  indexador de la app a Rust es `FUN-L-10` y no entra en la fase 1. Hasta entonces, la
  prueba de equivalencia es lo que evita la deriva.
- **El ranking no está calibrado**: con BM25 y el título pesando 4, «enlaces» llena el
  top 10 con secciones de `enlaces-externos`. Es exactamente lo que la fase 3 viene a
  medir con el registro de búsquedas.
- **No se registró el servidor en Claude Code** (ni `.mcp.json` ni ámbito de usuario): se
  probó por stdio directo. Cómo se registra sigue siendo la pregunta 5 del § 12.

---

## 14. La fase 1, rehecha según el diagnóstico (2026-09-24)

La tanda de la fase 1 perdió **22,5 puntos** contra `grep` y la regla decidió «se rehace, y
antes se investiga por qué». [[MCP de Mycelium - diagnostico fase 1]] es esa investigación;
esta sección es lo que se cambió por ella, en la rama `feat/mcp-fase1b`, **sin correr
ninguna tanda**. La § 9 de [[MCP de Mycelium - evaluacion]] no se tocó.

### 14.1 La búsqueda: cobertura, no conjunción (causa 1 del diagnóstico)

**Por qué.** Los términos se combinaban con Y: una sola palabra de la consulta que la nota
no usara la sacaba de la lista. 58 de las 181 búsquedas de la tanda volvieron **vacías**, y
en 17 fallos la sección con el dato no apareció nunca (D08: las cinco corridas preguntaron
por «símbolos», y `titulo-renombra` no usa esa palabra). Es la causa de 11 de las 22 corridas
perdidas. El respaldo del § 4 —intersectar por nota— exigía el mismo Y un nivel más arriba.

**Qué se hizo** (`crates/mycelium-vault/src/indice/buscar.rs`):

- La expresión FTS5 pasa a **O** (`"a"* OR "b"* OR "c"*`): alcanza con un término.
- Cada término se consulta además por separado, para saber **qué secciones lo tienen**. Eso
  da la cobertura de cada candidata y el `idf` de cada término.
- El puntaje léxico es `bm25(O) · cobertura²`, con `cobertura = Σ idf(términos que tiene) /
  Σ idf(términos)`. `rel` es ese puntaje dividido por el mejor, y sigue siendo lo único que
  ordena (los pesos de la v1 no cambian).
- **Se sacó el respaldo por intersección.**
- La respuesta dice cuántas secciones tienen **todos** los términos y cuáles términos **no
  están en ningún lado** (`Sin coincidencias en el vault: «símbolos»`): es la palabra que el
  agente tiene que cambiar.

**Por qué así, y no un O a secas.** El diagnóstico lo advirtió: con O, las secciones que
repiten **un** término común —y lo tienen en el título, que pesa 4— suben, y D01 cae de 8 a 3
de 10. Las tres decisiones de la fórmula responden a eso:

| Decisión | Por qué |
|---|---|
| La cobertura **multiplica** al BM25 | Que una sección con casi todos los términos le gane a una que repite uno, sin volver a exigirlos todos |
| **Al cuadrado** | Que la cobertura mande: con la mitad del peso cubierto, una sección necesita 4 veces el BM25 de la completa para empatarle. Entre coberturas parecidas, ordena el BM25 |
| Pesada por **`idf`**, no contando términos | Con prefijo, «no»\*, «de»\* o «la»\* están en casi todas las secciones: contarlos como un término más haría ganar a las secciones largas. Un término ausente del vault pesa 0 (no distingue nada) |

> [!note] No se afinó: se eligió y se midió
> Antes de construirlo se probaron, sobre una copia del índice de la tanda, cinco formas
> razonables de combinar cobertura y BM25 (orden lexicográfico por cantidad de términos, por
> cobertura pesada, y la multiplicación con exponente 1, 2 y 3). **Todas** dan 87–88 de 133
> en el top 10 y D01 en 7–8 de 10; el O a secas, 76 con D01 en 3. El resultado no depende del
> exponente, así que no hay un número ajustado a estas 16 preguntas: se eligió la forma por
> el razonamiento de la tabla y se paró.

### 14.2 La lectura: más que una sección (causa 3)

**Por qué.** 8 corridas perdidas —todas contra la base— tenían el dato en **otra sección de
una nota que ya habían tocado**. En D11 el índice de `Bugs_errores_y_defectos` se cortaba en
40 filas, en `DEF-059`, justo antes de todos los defectos de consolas. En D03 `drawio.md`
(18 KB) pasaba el tope de 8 KB: el agente recibió el índice y eligió `#s4 #s5 #s9`, sin la
`#s19` del costo real.

**Qué se hizo** (`crates/mycelium-mcp/src/herramientas.rs`):

1. **El índice de secciones de una nota va completo.** Una fila son ~30 bytes: las 85
   secciones del catálogo de defectos son ~2.500 bytes contra los 37.000 de la nota.
2. **Una nota pedida sin `#sN` vuelve entera hasta 20 KB** (antes 8 KB).
3. Leer una sección de una nota que se devolvería entera agrega una línea con lo que cuesta
   pedirla toda: `(la nota tiene 20 secciones; entera: vault_leer(refs=["docs/features/drawio.md"]), ≈4.473 tokens)`.

> [!important] La tensión del umbral, y de qué lado se puso
> La base gana leyendo notas enteras (mediana de 27.500 caracteres por corrida); la ventaja
> de costo del MCP (`K = 0,53`) sale justamente de **no** hacerlo. **20 KB ≈ 5.000 tokens**
> sale del costo, no de una nota: es lo que el MCP metió en contexto en una corrida
> **entera** (mediana 5.533). Una lectura completa puede, como mucho, duplicar esa mediana
> y queda lejos de los 14.809 de la base. Las notas grandes de verdad —`BACKLOG` (128 KB),
> `bugs-progreso` (99 KB), el catálogo de defectos (37 KB), `autoactualizacion` (30 KB)—
> siguen detrás del índice.
>
> **Lo que se pierde**: una nota de 8–20 KB (24 de las 115 del corpus) pedida sin `#sN`
> cuesta 2.000–5.000 tokens en vez de un índice de ~300. Y el umbral **sí** cubre
> `drawio.md` (17,9 KB), el caso de D03: con 16 KB no lo cubriría. Eso se dice para que no
> se lea como una casualidad; la cota se eligió por el costo y sale del lado del MCP que
> más le importa a la regla, que es no volver a perder el dato.

### 14.3 Las instrucciones, en el servidor (causas 5 y 4)

**Por qué.** Las instrucciones del `initialize` decían «preferí esto a grep», y la
descripción de `vault_buscar` no decía que el código no está en el índice. En C7 el agente
del MCP leyó código en **0 de 10** corridas (la base, en 4), y en D13 creyó a una nota que
había quedado atrás del código. Además escribía consultas largas: con Y, cada término de más
era una condición más.

**Qué se hizo.** La descripción de `vault_buscar`, la de `vault_leer` y las instrucciones del
`initialize` dicen ahora que el índice tiene **solo las notas `.md`**; que el código, la
configuración y los otros tipos de archivo (`.ts`, `.rs`, `.json`, `.toml`, `.canvas`,
`.base`…) se buscan con `grep`/`Grep` y se leen con `Read`; que la documentación puede ir por
detrás del código y lo que funciona **hoy** se confirma en él; y que las consultas van con
**2 o 3 términos distintivos**, sacando términos en vez de agregar si no aparece lo buscado.

> [!warning] Va en el servidor, no en el `CLAUDE.md` ni en la skill
> Las descripciones de las herramientas y las instrucciones del servidor son lo único que ve
> **solo** el brazo MCP. El `CLAUDE.md` y la skill del corpus son el grupo de control y tienen
> que ser idénticos en los dos brazos: si se tocaran, la comparación con la línea base dejaría
> de valer (evaluación § 8.6).

### 14.4 El arnés: una corrida que sale a la red se descarta

D12 r3 (`2f42f55e`) hizo `curl` al bucket real de R2 y contestó desde fuera del corpus. Ahora
la lectura de la transcripción junta **todos** los `tool_use` (los de subagentes incluidos) y
el arnés descarta con el motivo `acceso a la red (…)` cualquier `curl`, `wget`,
`Invoke-WebRequest`/`iwr`, `Invoke-RestMethod`/`irm`, URL `http(s)` en un comando o
herramienta web (`eval/lib/red.mjs`). `eval/revisar-red.mjs` revisó las **258** corridas ya
hechas: **solo esa** salió a la red, y quedó descartada con una fila nueva (append-only). No
cambia ninguna decisión: el Δ de la fase 1 pasa de −22,5 a −22,2 puntos y la regla sigue en
la fila 1 (la corrida tenía acierto citado 0).

### 14.5 La prueba gratis: las mismas consultas, otro índice

`eval/repetir-busquedas.mjs` toma las 181 `vault_buscar` y las 129 `vault_leer` de las 80
corridas de la tanda, emparejadas una a una con el registro del servidor, y las repite contra
un índice **nuevo** del corpus `c0a33b8`, construido por el binario a probar en un directorio
de datos propio (nunca el app-data real ni `C:\mycelium-eval\app`). Mide contra las secciones
oro del apéndice del diagnóstico. No llama a la API.

```
node eval/repetir-busquedas.mjs --binario C:\mycelium-eval\bin\mycelium-mcp-c487c58.exe --etiqueta antes
node eval/repetir-busquedas.mjs --binario frontend\src-tauri\target\release\mycelium-mcp.exe --etiqueta despues
```

| | Antes (`c487c58`, el de la tanda) | Después |
|---|---|---|
| **Sección oro en el top 10** (133 búsquedas con oro) | 41 | **87** |
| Alguna sección de la nota oro en el top 10 | 53 | 108 |
| Búsquedas **vacías** (de 181) | 58 | **1** |
| D01 / D02 | 8 de 10 / 5 de 5 | **8 de 10 / 5 de 5** |
| Respuesta de `vault_buscar`: mediana · total de las 181 | ≈166 · ≈51.200 tokens | ≈636 · ≈116.800 tokens |
| `vault_leer` repetidas: mediana · total de las 129 | ≈1.197 · ≈203.700 tokens | ≈1.644 · ≈266.200 tokens |
| `tools/list` (una vez por sesión) | ≈648 tokens | ≈833 tokens |
| Las 8 corridas de granularidad: la lectura trae el dato | 0 de 8 | 6 de 8 |

Por pregunta, después: D03 7/11 · D04 11/15 · D05 6/7 · D06 8/13 · D07 7/7 · D08 **7/8** (antes
0/8) · D11 5/5 · D12 2/14 · D15 13/25 (antes 3/25) · D16 8/13.

> [!info] Cómo leer estos números
> - **41 y no 37.** El diagnóstico contó 37 con Y. La repetición con el binario de la tanda
>   devuelve **exactamente** las mismas listas que el registro (0 de 181 distintas), así que
>   la diferencia está en cómo se contó en el diagnóstico, no en la repetición. La meta del
>   diagnóstico (≥ 71, lo que daba el O a secas) se pasa igual por cualquiera de las dos.
> - **El costo sube, y es a propósito.** Sumando búsquedas, lecturas y `tools/list`, la
>   repetición mete ≈1.800 tokens más por corrida que la fase 1 (≈5.500 de mediana): del
>   orden de 7.300, la mitad de la base. Lo que cuesta de verdad lo dice solo la tanda: con
>   otras listas el agente va a leer otras cosas.
> - **Las 2 de granularidad que siguen sin el dato**: D11 r1 no pidió la nota, y D16 r3 pidió
>   tres secciones sueltas de `ventanas-multiples`, no la nota. Ahí solo ayuda la línea que
>   dice cuánto cuesta la nota entera.
> - **Es un diagnóstico, no una decisión.** Las consultas las escribió el agente mirando las
>   listas del servidor viejo, y son de las preguntas de **desarrollo**. La confirmación la
>   da una tanda nueva contra la misma línea base y, al final, las preguntas selladas.

### 14.6 Verificación

- `cargo test --workspace` (con `CARGO_BUILD_JOBS=2`): los 101 tests de antes, menos el de la intersección (que ya no existe), más 7 nuevos —la
  cobertura (el caso de D01 incluido: el test comprueba que un O a secas ponía otra sección
  primero), un término ausente que no vacía la lista, el `idf`, la nota de hasta 20 KB
  entera, la línea con el costo de la nota entera, el índice sin corte y las descripciones—.
- `node --test eval/test/`: los 72 de antes más 11 (detección de red y prueba gratis).

## 15. Cada resultado y cada lectura dicen cómo se cita la nota (2026-09-24)

**Por qué.** En la tanda de la fase 1b el MCP tuvo el dato correcto en 60 de 80 corridas, a
3 de la base, pero **12 perdieron por la cita** ([[MCP de Mycelium - evaluacion]] § 13). Las
«citas inventadas» subieron a 13 y eran notas **reales** citadas por su `# Título` visible
—«Atmósferas», «Canvas: notas en el espacio»— en vez de por el nombre del archivo
(`atmosferas`, `canvas`), que es lo único que resuelve como `[[enlace]]`. Fue un efecto
colateral del § 14.2: con la nota entera, lo primero que el agente ve es el `# Título`. **No
es un truco para la evaluación**: una cita que no resuelve no lleva a ningún lado. Es el
primero de los dos experimentos del § 13 de la evaluación, **solo**: las conexiones van en
otra tanda.

**Qué se hizo** (rama `feat/mcp-citas`, sin correr ninguna tanda):

- `vault_buscar`: cada resultado lleva `cita [[nombre]]` junto a su ref, y la última línea
  recuerda citar con eso y no con el `# título`.
- `vault_leer`: la línea **siguiente a la cabecera**, antes del texto, es la cita; si el H1
  dice otra cosa, lo nombra para descartarlo:
  `cita [[atmosferas]] (no «Atmósferas»: el # título no es enlace)`.
- Las **descripciones** de las dos herramientas lo dicen. El `CLAUDE.md` y la skill del
  corpus no se tocaron (grupo de control, § 14.3).
- `crates/mycelium-vault/src/indice/citar.rs` calcula la cita espejando `resolveWikilink`
  (`frontend/lib/editor/wikilink.ts`): nombre del archivo sin extensión, sin distinguir
  mayúsculas.

> [!important] Homónimas: como las resuelve la app
> La app **sí** desambigua: `[[Carpeta/nombre]]` se queda con las notas cuya carpeta termina
> en esos segmentos, y entre las que quedan gana la **menos profunda**. La cita es el destino
> más corto que resuelve a esa nota: el nombre solo si ella es la menos profunda, y si no con
> las carpetas justas delante (`docs/Plan.md` → `[[Plan]]`, `docs/viejo/Plan.md` →
> `[[viejo/Plan]]`). Un **empate de profundidad** no cuenta como resuelto —la app elegiría por
> el orden del árbol, que el índice no conoce—, así que ahí también va la carpeta. Solo dos
> notas que difieren **únicamente en mayúsculas** quedan sin cita que las separe, y la línea
> lo dice. `vault_leer` acepta la cita con carpeta (`viejo/Plan`) y la resuelve igual; un
> título solo con homónimas sigue devolviendo la lista de rutas.

**Lo que cuesta**, medido con la prueba gratis (§ 14.5) contra el binario `9d58453`: las 181
búsquedas devuelven **exactamente las mismas listas** (0 distintas), y la respuesta crece
≈90 tokens en una búsqueda de 10 resultados (mediana de 357 bytes; mediana de todas de ≈636 a
≈724 tokens). Una lectura crece ≈10–25 tokens por nota (mediana de las 129 de ≈1.644 a
≈1.659). `tools/list`, una vez por sesión, de ≈833 a ≈916.

**Verificación**: `cargo test -p mycelium-vault -p mycelium-mcp` —75 tests, 7 nuevos: la cita
de una nota común, acentos y mayúsculas del archivo contra el título visible, las homónimas
(puras y en el índice), la cita con carpeta en `vault_leer`, la línea antes del contenido y las
descripciones—; `node --test eval/test/`, 83.

## 16. Cada lectura termina con quién enlaza a la nota (2026-09-24)

**Por qué.** Es el segundo experimento del § 13 de [[MCP de Mycelium - evaluacion]], idea
del usuario: que la lectura traiga las notas conectadas. El **contenido** quedó descartado
(~16 enlaces × ~3.000 tokens ≈ 50.000 por lectura); se prueba una **lista compacta**. Apunta
a las **contradicciones resueltas** —la nota que corrige una decisión vieja suele enlazarla— y
a las **enumeraciones** —todo lo que apunta a un tema—. Un solo cambio sobre el servidor con
citas (`3ef9c8d`); el criterio de elección del § 14 de la evaluación ya está escrito y no se
toca.

**Qué se hizo** (rama `feat/mcp-conexiones`, sin correr ninguna tanda):

```
← conexiones: la enlazan 23 notas; las 10 que más hablan de ella (el resto: grep -rlF "[[terminal-integrada" --include=*.md):
  ↔ [[Mycelium como memoria de la IA]] [[…]] — dónde corre el asistente, con el cwd en el vault.
  ← [[Version 2.1.0]] Las consolas no pertenecían al vault · DEF-099 · desktop · [[…]]
  ← [[Bugs_errores_y_defectos]] …lo que se hizo. No lo es: es el CA7 de [[…]]. Cerrar la pestaña solo la oculta —la…
```

- **Al final** de cada lectura (sección, nota entera o índice de una nota grande), después de
  todo el contenido, y **una vez por llamada**: tres secciones de la misma nota no repiten la
  lista; va detrás del último bloque de esa nota.
- **Solo los entrantes.** Los salientes ya están en el texto leído y en la línea
  `→ enlaza a:`; repetirlos es pagar dos veces lo mismo. Los entrantes son lo que `grep` no
  da barato —y da mal, § 5—. Si la nota leída **también** enlaza a la que la cita, la línea
  lleva `↔` en vez de `←`. Sin entrantes, una línea: `← conexiones: ninguna nota la enlaza`.
- **Cita**: con la misma regla que el resto (`indice/citar.rs`), homónimas incluidas; los
  entrantes se resuelven como la app, así que un `[[Plan]]` que la app lleva a otra `Plan`
  no cuenta. Salen de la tabla `enlaces` (`Indice::entrantes`), no de escanear el vault.
- La **descripción** de `vault_leer` dice qué es la lista y cuándo seguirla (si el texto
  sugiere que la corrige, la reemplaza o la actualiza, o si la pregunta pide todo lo de un
  tema). El `CLAUDE.md` y la skill del corpus no se tocaron (grupo de control, § 14.3).

### El tope: 10, por el costo

Entrantes por nota en el corpus (115 notas `.md`, notas distintas que la enlazan):

| Mediana | p75 | p90 | p95 | Máximo | Sin entrantes |
|---|---|---|---|---|---|
| 7 | 10 | 21 | 26 | 67 (el mapa) · 61 (`BACKLOG`) | 14 |

**10 es el p75**: tres de cada cuatro notas salen con la lista **completa**, que es lo que
pide una enumeración. Medido sobre las 115: una línea cuesta **~26 tokens**, y la lista
entera **≈183 de mediana y ≈342 como máximo**. Un hub no convierte la lectura en cien líneas:
lo que queda afuera se cuenta y la cabecera dice cómo pedirlo.

### La pertinencia: quién **habla** de la nota, no quién la enumera

Se ordena por **especificidad** = enlaces de la otra nota a esta / notas distintas a las que
enlaza la otra. El mapa y el `BACKLOG` enlazan a todo, así que un enlace suyo dice poco y
quedan al fondo; una nota que enlaza a tres y a esta dos veces está hablando de ella —es la
misma idea que el `idf`, del lado de quien enlaza—. A igualdad: más enlaces, menos salientes,
ruta. **No** se usa la fecha (el `mtime` de un vault versionado miente, § 6) ni el nombre de la
sección (depende de las convenciones de este vault).

### La pista: el texto alrededor del enlace

~80 caracteres repartidos antes y después del enlace, cortando en palabra, con el enlace como
`[[…]]` (o `[[…|alias]]`, que es vocabulario). Se suman los renglones vecinos solo si es prosa
partida en renglones; las celdas de una tabla van separadas por `·`.

| Pista candidata | Por qué no, o por qué sí |
|---|---|
| El `# Título` de la nota que enlaza | Casi siempre repite su nombre, que ya va en la cita |
| El encabezado de la sección del enlace | El **34 %** de los enlaces entrantes del corpus están bajo `## Relacionadas`, que no dice nada |
| **El texto alrededor** | Dice la **relación**: «reemplaza a [[…]]», «es el CA7 de [[…]]», «DEF-099 · …». Es lo que decide si abrirla |

Si el texto no llega a 25 caracteres («Ver [[…]].») se le antepone el encabezado de la sección;
si el archivo cambió y el enlace ya no está en esa línea, queda solo el encabezado.

### Lo que cuesta, medido con la prueba gratis (§ 14.5)

| | Con citas (`3ef9c8d`) | Con conexiones |
|---|---|---|
| Listas de las 181 búsquedas | — | **idénticas** (0 distintas) |
| `vault_leer` repetidas: mediana · total de las 129 | ≈1.659 · ≈271.000 tokens | ≈2.033 · ≈312.900 tokens |
| `tools/list` (una vez por sesión) | ≈916 | ≈1.053 |

Una lectura crece **≈324 tokens de media** (+15 % del total): más que la mediana de la lista
porque las lecturas de la tanda van mucho a hubs y a veces traen varias notas. Con ~1,6
lecturas por corrida son **≈+520 tokens por corrida** sobre la mediana de 5.717 (~9 %): del
orden de 0,05 en `K`, lejos del techo de 0,7 del criterio de elección. Lo que cuesta de verdad
lo dice la tanda: si el agente sigue las conexiones, va a leer más notas.

**Verificación**: `cargo test --workspace` —121: los 114 de antes más 7 (el orden por
especificidad y la exclusión de la propia nota, los entrantes con homónimas, el fragmento, una
nota sin entrantes, una con más entrantes que el tope, que las citas de la lista resuelvan a la
nota que enlaza, y que la lista vaya después del contenido y una vez por nota)—; `node --test
eval/test/`, 83.

---

## Relacionadas

- [[MCP de Mycelium - encuadre]] — los hechos y las restricciones de las que parte todo esto.
- [[MCP de Mycelium - control]] — la otra mitad: operar la app, no solo leerla.
- [[MCP de Mycelium - evaluacion]] — quién dice si esto mejora algo, y con qué números.
- [[MCP de Mycelium - diagnostico fase 1]] — por qué perdió la fase 1; el § 14 es lo que se rehizo por él.
- [[Capa de datos del desktop]] — el índice de la app, que este diseño decide **no** abrir.
- [[Mycelium como memoria de la IA]] — la decisión de producto de la que sale `FUN-L-09`.
- [[ia-framework-vault]] — lo que hace de memoria hoy, sin MCP.
- [[Rendimiento de la apertura del vault]] — de dónde salen las lecciones de `FUN-M-12`.
- [[Rendimiento del grafo]] — el vault de referencia y el costo del grafo actual.
- [[BACKLOG]] — `FUN-L-09`, y `FUN-L-10` (el indexado en Rust con el que esto converge).
- [[Mapa de documentacion]] — índice general.
