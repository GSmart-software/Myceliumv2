# FUN-L-08 — Framework IA del vault (solo desktop)

**HU:** Como usuario que desarrolla proyectos (de IA u otros) documentándolos en
Mycelium, quiero generar en mi vault un conjunto de instrucciones para asistentes
de IA por terminal (Claude Code, corriendo en la terminal integrada FUN-L-07), para
que la IA **use el vault como su memoria de largo plazo**: que busque en él antes de
responder y que consolide en él lo que valga recordar, aprovechando los vínculos
`[[...]]` — la red navegable que visualiza el grafo.

Referencias estudiadas: `claude-obsidian` (AgriciDaniel) y el enfoque minimalista
de D. Rowse. Este framework toma el punto medio: convenciones claras + pocos
comandos de alto valor.

## Eje: el vault es memoria, no un cajón de documentos

El framework enseña dos **protocolos** y los hace obligatorios:

- **RECUPERAR antes de responder**: entradas (mapas/MOCs) → búsqueda léxica en
  contenido y nombres de archivo → lectura completa de candidatas → **expansión por
  asociación** (enlaces salientes + backlinks, 1–2 saltos) → facetas (`#tags`) →
  respuesta **citando procedencia** con `[[enlaces]]`, y decir explícitamente lo que
  la memoria NO contiene.
- **CONSOLIDAR lo que valga recordar**: buscar antes de crear (ampliar > duplicar),
  una idea por nota, título pensado como consulta futura, contenido autosuficiente
  (fecha, contexto, **por qué**), asociaciones explicadas y entrada a la red desde su
  mapa/nota madre (nada huérfano).

Además, el núcleo incluye **un puntero por skill y comando** (cuándo cargar cada uno), para
que la IA sepa qué herramienta corresponde a cada situación.

## Qué genera (v2.0.0)

| Archivo en el vault | Rol |
|---|---|
| `CLAUDE.md` — **solo el bloque** `<!-- mycelium:inicio vX -->` … `<!-- mycelium:fin -->` | El **núcleo** (2,2 KB): las dos obligaciones (recuperar/consolidar), doce reglas duras de una línea y un puntero por skill y comando. Lo de fuera del bloque es del usuario (ver § «Framework 2.0.0», abajo) |
| `.claude/skills/mycelium-vault/SKILL.md` | Referencia **técnica**: sintaxis verificada (wikilinks/alias/embeds/tags/callouts/Mermaid/KaTeX), **tipos de archivo y cuáles están en la memoria**, qué es de Mycelium y qué del usuario en `CLAUDE.md` y `.claude/`, recetas de `grep` (backlinks, salientes, tags), propiedades, `.mycignore` (con negaciones), **qué ve el usuario** en la app, precauciones |
| `.claude/skills/mycelium-memoria/SKILL.md` | **Técnicas de memoria**: cómo está construida (nota/enlace/tag/carpeta/grafo/MOC), recuperación en seis movimientos, señales de que falta recuperar más, cuándo crear vs ampliar, cómo redactar para recuperación futura, mantenimiento y antipatrones |
| `.claude/skills/mycelium-operar/SKILL.md` | **Nueva en la 2.0.0**: el criterio para usar el MCP de control ([[mcp-control]]) —la línea divisoria, antes de escribir, renombrar/mover/borrar, qué pregunta y qué no, `RECHAZADO` y los demás errores, el diccionario del vault— y qué hacer sin las herramientas (`mv`/`rm` y los enlaces a mano, el hook) |
| `.claude/commands/mycelium/vault-buscar.md` | `/vault-buscar <pregunta>`: responde con evidencia del vault y citas (solo lee) |
| `.claude/commands/mycelium/vault-recordar.md` | `/vault-recordar <qué>`: consolida un hecho/decisión/aprendizaje (crea o amplía + enlaza) |
| `.claude/commands/mycelium/vault-mapa.md` | `/vault-mapa`: genera/actualiza el MOC "Mapa del vault" (puerta de entrada de la memoria) |
| `.claude/commands/mycelium/vault-vincular.md` | `/vault-vincular <nota>`: refuerza asociaciones (con la razón de cada vínculo) |
| `.claude/commands/mycelium/vault-huerfanas.md` | `/vault-huerfanas`: audita salud de la memoria — huérfanas + enlaces rotos (reporta, no aplica solo) |
| `.claude/commands/mycelium/vault-nota.md` | `/vault-nota <título>`: crea una nota siguiendo las convenciones (sin dejarla huérfana) |
| `.claude/skills/mycelium-{drawio,canvas,excalidraw,base,esporas,calendario}/SKILL.md` | **Una skill por herramienta** (desde la 1.7.0, [[ia-skills-herramientas]]): formato, geometría, recetas y cómo modificar sin romper |
| `.claude/skills/mycelium-{drawio,canvas,excalidraw}/validar-<formato>.mjs` | El **validador** de cada formato, sin dependencias: la IA lo corre con `node` sobre lo que escribió |
| `.claude/mycelium-ia.json` | Marcador de versión del framework (desde la 2.0.0, sin huellas: ya no hacen falta) |
| `.mcp.json` | **No es un template**: el servidor MCP de control (`mycelium`), con la ruta del binario instalado y `MYCELIUM_VAULT`. Solo si el control está encendido; se **fusiona** con el del usuario ([[mcp-control]] § «Cómo quedó — Parte 1») |
| `.claude/hooks/mycelium-mv-rm.mjs` + su entrada en `.claude/settings.json` | **Tampoco es un template**: el hook `PreToolUse` que, con el control encendido, frena `mv`/`rm` sobre notas y le recuerda a la IA `mycelium_renombrar` / `_mover` / `_borrar` (con un escape, `MYCELIUM_SIN_MCP=1`, para cuando el MCP no responde). Lo instala `lib/mcpControl.ts` junto con el `.mcp.json`; el `settings.json` se **fusiona** con el del usuario ([[mcp-control]] § «Cómo quedó — Parte 3») |

Contenido **verificado contra el código real** de Mycelium: `[[Título|alias]]`,
`![[embed]]`, `![[X.excalidraw]]`, `#tag`, callouts (10 tipos, plegables `-/+`,
anidados), `.mycelium/.trash`, **propiedades del frontmatter** con su subconjunto
soportado (`FUN-M-04`, desde la v1.3.0 del framework), las **Esporas** y sus
variables (`FUN-M-03`, desde la v1.4.0), los **tipos de archivo del vault** con la
sintaxis de `.base` y `.canvas` (desde la v1.5.0), y que renombrar **sí** reescribe
los enlaces —pero solo por Mycelium: un `mv` de la IA no dispara nada (`FUN-M-08`)—.
Desde la Parte 3 del MCP de control (todavía en la `1.7.0`), la **regla dura 2** se
invierte: para renombrar o mover, la IA usa `mycelium_renombrar` / `mycelium_mover`, y
para borrar `mycelium_borrar` (papelera); `mv` solo si el MCP no está, y entonces los
enlaces los arregla ella con grep.

## Versionado

- `FRAMEWORK_IA_VERSION` en `frontend/lib/ia/framework.ts` (hoy `2.1.0`),
  independiente de la versión de la app. **Al agregar funciones a Mycelium que la
  IA deba conocer, subir la versión y actualizar los templates.**
  - `1.0.0` — primera versión.
  - `1.1.0` — `.mycignore` (visibilidad configurable) + política de no pisar
    archivos del usuario.
  - `1.2.0` — reenfoque a **memoria**: protocolos de recuperación/consolidación,
    skill `mycelium-memoria`, comandos `/vault-buscar` y `/vault-recordar`, y mapa
    de cuándo usar cada herramienta. **Es la instalada en el vault de este repo.**
  - `1.2.1` — corrección de texto: el default de `.mycignore` había cambiado
    (`FUN-M-12`) y los templates lo describían mal. Patch, sin instrucciones nuevas.
  - `1.3.0` — **propiedades del frontmatter** (`FUN-M-04`): hasta acá los templates
    afirmaban que "el frontmatter YAML todavía no se interpreta (se ve como
    texto)", en la regla dura 6 del `CLAUDE.md` y en las precauciones de la skill
    `mycelium-vault`. Ahora describen el subconjunto soportado, que `tags:` son
    etiquetas de la nota, que hay que reusar las claves que ya existen en el vault
    y que los valores se consultan con `clave:valor`. Ver [[metadata-yaml]].
  - `1.4.0` — **Esporas** (`FUN-M-03`): el vault puede tener una carpeta cuyas
    notas no son conocimiento sino **moldes**. La IA tiene que saberlo para no
    tratarlas como notas normales —no consolidar ahí, no citarlas como fuente, no
    reportarlas como huérfanas— y para poder partir de una al crear una nota. Se
    agregan la regla dura 10 del `CLAUDE.md`, una sección en la skill
    `mycelium-vault` (qué es una Espora, dónde vive, sus variables) y ajustes en
    `/vault-nota` y `/vault-huerfanas`. Ver [[esporas-plantillas]].
  - `1.5.0` — **el vault dejó de ser solo notas**, y los templates seguían
    describiendo uno que sí lo era. Se documentan los tipos de archivo que la IA
    puede crear y editar —`.base` ([[bases-tabla]]) y `.canvas` ([[canvas]]), con
    su sintaxis en la skill— y los que el vault **guarda pero no indexa** (PDF,
    imágenes, código: [[otros-tipos-de-archivo]]).

    > [!important] Lo que más importa de esta versión no es lo que la IA puede escribir
    > Es lo que **no puede citar**. Mycelium indexa `.md` y nada más, pero un `grep`
    > encuentra igual un `.py` o un `.csv`. Sin esta instrucción, la IA puede
    > presentar como evidencia de la memoria algo que la memoria no tiene, y
    > enlazarlo con un `[[…]]` que no resuelve.

    Corrige además la regla dura 2, que mentía desde `FUN-M-08`: renombrar **sí**
    repara los enlaces entrantes. Pero solo cuando pasa por la app; un `mv` desde
    la terminal —que es como renombra la IA— no dispara nada, y la regla pasa a
    decir esa diferencia. Ver [[titulo-renombra]].
  - `1.6.0` — **diagramas de draw.io** (`FUN-L-20`): el vault gana `.drawio`. La IA
    sabe que existe, que no se indexa y —hasta la 1.7.0— que no se edita a mano.
  - `1.7.0` — **una skill por herramienta** (`FUN-L-26`, [[ia-skills-herramientas]]):
    `mycelium-drawio`, `mycelium-canvas`, `mycelium-excalidraw`, `mycelium-base`,
    `mycelium-esporas` y `mycelium-calendario`. La IA pasa de saber que esos formatos
    existen a **crearlos y modificarlos** —geometría, flechas enganchadas, texto que
    entra— y a **consultar el calendario** (solo lectura). Las tres de dibujo llevan su
    validador (`.claude/skills/<skill>/validar-<formato>.mjs`). Cambios en los
    templates:
    - `CLAUDE.md`: `.drawio` y `.excalidraw` pasan de «no editar a mano» a «crear y
      editar con su skill»; «Tus herramientas aquí» lista las seis; la regla 8 admite
      **leer** `.mycelium/recordatorios.json` y `.mycelium/preferencias.json` (escribir
      en `.mycelium/`, nunca); la regla 10 remite a `mycelium-esporas`; «por fuera»
      nombra el calendario y aclara qué se recarga desde disco (lienzos, diagramas y
      dibujos incluidos; no con cambios sin guardar ni el modal de Excalidraw).
    - `mycelium-vault` adelgaza: las secciones de `.base`, `.canvas` y Esporas se
      reducen a una tabla que remite a cada skill. Se corrigen dos errores: decía que
      el `.canvas` no aporta aristas al grafo (sí: `[[enlaces]]` de sus tarjetas y
      notas de sus nodos `file`), y en «Precauciones» y en `mycelium-memoria` que
      renombrar no repara enlaces (sí, desde la app; un `mv`, no).
    - `/vault-nota` remite a `mycelium-esporas` y exige expandir las variables con
      `date`; `/vault-huerfanas` cuenta como enlace entrante la aparición en un lienzo.

    La misma `1.7.0` —todavía sin publicar— suma el **MCP de control** (`FUN-L-09`,
    [[mcp-control]]) por partes, **sin subir la versión**. Parte 1: la sección
    «Operar Mycelium» del `CLAUDE.md` (la línea divisoria: el contenido se lee y
    escribe en los archivos; mostrar y saber qué está abierto pasa por
    `mycelium_estado`/`mycelium_abrir`), con una tabla a la que las partes 2–4
    agregan filas; «Tus herramientas aquí» la nombra y «por fuera» deja de decir que
    la IA no controla la app. Al generar con el control encendido se escribe además
    el `.mcp.json`. Parte 2: las cinco del calendario y la regla 8. Parte 3: las
    cuatro de archivos (`mycelium_renombrar`, `_mover`, `_borrar`, `_papelera`), la
    regla dura 2 al revés (la herramienta primero, `mv` solo sin MCP), qué hacer con
    un `RECHAZADO`, y el **hook** de `mv`/`rm` en `.claude/settings.json` —que, como
    el `.mcp.json`, se instala solo con el control encendido y se fusiona con el del
    usuario—. Su script (`scripts/hook-mv-rm.mjs`) viaja por el mismo generador que
    los validadores (`HOOK_MV_RM` en `lib/ia/skillsGeneradas.ts`).

    El texto de las skills y los validadores **no vive en `framework.ts`**: lo genera
    `scripts/generar-skills-ia.mjs` en `lib/ia/skillsGeneradas.ts` a partir de
    `lib/ia/borradores/` y `scripts/validar-*.mjs` (ver
    [[Generar el framework de IA en un vault]]).
  - `1.8.0` — **estados de tarea** (`FUN-S-01`, [[estados-de-tarea]]): la skill
    `mycelium-vault` suma la fila «Tarea» a la tabla de sintaxis y una sección con los
    nueve símbolos (`[ ]`, `[x]`, `[-]`, `[/]`, `[>]`, `[*]`, `[!]`, `[?]`, `[+]`) y
    cómo se ve cada uno; el `CLAUDE.md` los nombra entre lo que ve el usuario. Minor:
    conocimiento nuevo sobre la sintaxis del vault. 2026-10-04, sin publicar.
  - `1.8.1` — la tabla de sintaxis decía que `![[Título]]` de una nota muestra su contenido y
    que una `#etiqueta` es una píldora clicable (`DEF-131`). Patch.
  - `2.0.0` — **instrucciones por capas** (`FUN-L-29`, 2026-10-06): bloque gestionado en
    `CLAUDE.md`, núcleo de 2,2 KB (era ~20 KB), skill nueva `mycelium-operar`, comandos en
    `.claude/commands/mycelium/` y la regla «no edites lo que lleva prefijo `mycelium`».
    Desaparecen la copia `CLAUDE (mycelium-ia vX).md` y `Conflictos instrucciones IA.md`.
    Major: cambia dónde y cómo se instala, y qué es de quién. Detalle abajo.
  - `2.1.0` — lo que cambió con los defectos de la [[Auditoria e2e 2026-10-07]]: la sintaxis
    `[[Nota#Encabezado]]`, `[[#Encabezado]]` y `[[Nota#^bloque]]` (`DEF-141`); en una nota con
    cambios sin guardar, un cambio externo ya no se pierde: el usuario ve una barra y elige
    (`DEF-138`); la nota creada desde una Espora se llama «Espora 1», «Espora 2»… (`DEF-140`).
    Minor: conocimiento nuevo sobre la app. 2026-10-08, sin publicar.
- Cada archivo de `.claude/` lleva el marcador `<!-- mycelium-ia vX -->` (los `.mjs`, en un
  comentario de su primera línea); el bloque de `CLAUDE.md` lleva la versión en su marcador
  de inicio; la versión instalada vive en `.claude/mycelium-ia.json`.
- Configuración → Vault muestra instalada vs disponible y ofrece
  Generar / Actualizar / Regenerar. **Solo se genera si el usuario lo pide.**

## Framework 2.0.0: instrucciones por capas

`FUN-L-29`, implementada en desktop el 2026-10-06; propuesta y decisiones del usuario en
[[ia-vaults-intensivos]] § 1. Resuelve dos problemas: el `CLAUDE.md` generado pesaba ~20 KB
(~5.500 tokens) y se cargaba en **cada** sesión, y la regeneración chocaba con lo del
usuario —«no edites `.claude/`» no se podía cumplir y la copia `CLAUDE (mycelium-ia vX).md`
con su `Conflictos instrucciones IA.md` no la integraba nadie—.

### El bloque gestionado

```md
<!-- mycelium:inicio v2.0.0 — lo escribe Mycelium (Configuración → Vault); lo tuyo, fuera del bloque -->
# Este vault es tu memoria
…el núcleo…
<!-- mycelium:fin -->
```

- Cada marcador va **en su propia línea**. El de inicio lleva la versión (se ve sin abrir la
  app) y un aviso para quien abra el archivo a mano; se reconoce por el prefijo
  `<!-- mycelium:inicio v` **al principio de una línea** (tras un BOM, si es la primera): uno
  citado en medio de un párrafo o entre backticks no es el bloque.
- Al regenerar se reemplaza desde el `<` del inicio hasta el `>` del fin. Lo de antes y lo
  de después —incluido el salto que sigue al fin— queda **byte a byte** igual.
- El bloque se escribe con los saltos de línea del archivo: CRLF si el archivo los tiene.
- **Bloque roto** (inicio sin fin): error, y no se escribe **nada** (ni `CLAUDE.md` ni
  `.claude/`). Adivinar dónde terminaba podría comerse texto del usuario.

### Migración de `CLAUDE.md`

`planificarClaudeMd` (pura, en `lib/ia/framework.ts`) decide; `generarFramework` escribe
solo si cambió.

| `CLAUDE.md` que hay | Resultado | Acción (aviso) |
|---|---|---|
| No existe, o vacío | El bloque solo | `creado` |
| Con bloque | Se reemplaza el bloque; lo demás, byte a byte | `actualizado` |
| Propio, sin bloque | El bloque **al principio**, una línea en blanco y lo del usuario intacto (decisión del usuario). Si hay BOM, sigue primero | `insertado` |
| El que generó **entero** una 1.x, sin tocar (su huella está en `HUELLAS_CLAUDE_MD_PREVIAS` —todas las 1.x, sacadas del historial de git— o es la que registró la 1.6–1.8 en `mycelium-ia.json`; CRLF no cuenta como edición) | El bloque solo | `reemplazado` |
| Uno de una 1.x **editado** (marca vieja `<!-- mycelium-ia v` en la primera línea, huella desconocida) | Como «propio»: el bloque arriba y **todo** lo que había debajo, incluidas las instrucciones viejas | `insertado-sobre-anterior`: el aviso le dice al usuario que borre la sección vieja, que empieza en «# Este vault es tu memoria» |

> [!info] Por qué el editado no vuelve al archivo de conflicto
> Las dos opciones seguras eran insertar el bloque arriba sin descartar nada, o dejar el
> archivo como estaba y escribir la copia al lado (la regla de la 1.x, solo para este caso).
> Se eligió la primera: no se puede separar lo editado de lo generado sin el texto viejo
> (solo hay huellas), la copia al lado es justo lo que «nadie integra», y con el bloque
> arriba la IA ya recibe las instrucciones nuevas desde la primera sesión. El costo —las
> instrucciones viejas duplicadas debajo hasta que el usuario las borre— es visible en el
> único archivo del usuario y el aviso dice qué borrar. Es el mismo trato que recibe un
> `CLAUDE.md` propio en el que alguien copió a mano la sección de memoria (el caso de este
> repo).

Lo que dejó la 1.x y **no** se toca: una copia `CLAUDE (mycelium-ia vX).md` o un
`Conflictos instrucciones IA.md` que ya existan. Desde la 2.0.0 son archivos del usuario, que
puede borrarlos.

### El prefijo `mycelium`

Todo lo que Mycelium escribe en `.claude/` lleva `mycelium` en la ruta, y la regla para la IA
(regla dura 10 del núcleo) pasa de «no edites `.claude/`» a **«no edites lo que lleva prefijo
`mycelium`»**:

| Ruta | Qué |
|---|---|
| `.claude/skills/mycelium-*/` | Las nueve skills y sus scripts |
| `.claude/commands/mycelium/vault-*.md` | Los seis comandos |
| `.claude/hooks/mycelium-mv-rm.mjs` | El hook de `mv`/`rm` (con el control encendido; su entrada en `settings.json` se fusiona) |
| `.claude/mycelium-ia.json` | La versión instalada |

Con eso **ya no hay conflictos**: lo que lleva el prefijo es de Mycelium y se pisa al
regenerar aunque se haya editado; lo demás no se toca nunca. El mecanismo de copia al lado
(`rutaAlternativa`, `RUTAS_PROTEGIDAS`, el reporte) se eliminó.

**Comandos en una subcarpeta.** Claude Code nombra un comando por su archivo; la subcarpeta
solo aparece en la descripción («(project:mycelium)»). Así los comandos siguen siendo
`/vault-buscar`, etc. —la ayuda, la costumbre del usuario y los textos de las skills siguen
valiendo— y el archivo vive en un espacio de Mycelium. Se descartó renombrarlos a
`/mycelium-buscar`: cambiaba el nombre que el usuario ya usa sin ganar nada.

**Migración de los comandos sueltos de la 1.x** (`.claude/commands/vault-*.md`): al
regenerar, los que siguen tal cual los escribió Mycelium —su huella, **sin la línea de
marca**, está en `HUELLAS_COMANDOS_ANTERIORES`— se borran con el comando Rust
`ia_borrar_anterior` (lista cerrada de esas seis rutas; no pasa por la papelera porque no son
notas del índice). Los editados se quedan donde están, ya como del usuario, y el aviso los
nombra. Si conviven con el de Mycelium del mismo nombre, Claude Code muestra los dos.

### El núcleo

2.138 bytes de núcleo, **2.269** con los marcadores (era ~20 KB). `scripts/test-framework-ia.mjs`
falla si el bloque pasa de **2.560 bytes**: lo que no entra va a una skill.

- Las **dos obligaciones**: recuperar antes de responder (buscar, leer entero, seguir enlaces
  y backlinks, citar con `[[ ]]`, decir si no está) y consolidar lo que valga recordar
  (escribir y enlazar, con fecha y motivo).
- **Doce reglas duras**, una línea cada una: títulos únicos · renombrar/mover/borrar por MCP
  (`mv`/`rm` solo sin MCP, y los enlaces a mano) · nada huérfano · no duplicar · usar las
  carpetas existentes · propiedades planas y claves reusadas · idioma del vault · solo los
  `.md` son memoria · `.mycelium/` no se escribe, calendario y diccionario solo por MCP · lo
  que lleva prefijo `mycelium` no se edita (lo demás es del usuario) · `.mycignore` oculta de
  la app · las Esporas son moldes.
- **Un puntero por skill** (las nueve) y la lista de los seis comandos.

### Dónde quedó cada regla del `CLAUDE.md` 1.8.1

Ninguna se perdió. Casi todas se comprueban por una frase clave en la tabla `DONDE_QUEDO` de
`scripts/test-framework-ia.mjs` (si una frase se reescribe, se cambia la
fila, no se borra).

| Sección del 1.8.1 | Regla o afirmación | Dónde quedó |
|---|---|---|
| Intro | El vault es memoria de largo plazo, en red, compartida | Núcleo (intro) |
| Intro | Obligación 1: recuperar antes de responder, citando | Núcleo |
| Intro | Obligación 2: consolidar y enlazar | Núcleo |
| Cómo está construida la memoria | Tabla nota/enlace/tag/carpeta/grafo/MOC | `mycelium-memoria` |
| Cómo está construida la memoria | «El enlace es la unidad de valor» | `mycelium-memoria` |
| Qué puede haber en el vault | Tabla de tipos de archivo (qué es, qué podés) | `mycelium-vault` |
| Qué puede haber en el vault | Lienzos/diagramas/dibujos se rompen; validador; `dibujo.mjs` | `mycelium-vault` (y cada skill) |
| Qué puede haber en el vault | Solo las notas están en la memoria; citar «según el archivo» | Núcleo, regla 8 (corta) · `mycelium-vault` (completa) · `mycelium-memoria` |
| Qué puede haber en el vault | `.base` y `.canvas` son nodos; el canvas aporta aristas; el YAML del `.base` no se escanea | `mycelium-vault` |
| Protocolo de recuperación | Entradas → léxico → leer entero → expandir 1–2 saltos → facetas → citar y decir lo que falta, ofrecer la nota | `mycelium-memoria` («seis movimientos»; facetas y «ofrecé crear» se agregaron) · resumen en el núcleo |
| Protocolo de consolidación | Buscar antes de crear; ampliar | Núcleo, regla 4 · `mycelium-memoria` |
| Protocolo de consolidación | Una idea por nota, título único | Núcleo, regla 1 · `mycelium-memoria` |
| Protocolo de consolidación | Enlazar hacia afuera y hacia adentro | Núcleo, regla 3 · `mycelium-memoria` |
| Protocolo de consolidación | Contexto suficiente: fecha y motivo | Núcleo, obligación 2 · `mycelium-memoria` |
| Protocolo de consolidación | Callouts para lo que salta a la vista | `mycelium-memoria` |
| Tus herramientas aquí | Tabla skill → cuándo | Núcleo (puntero por skill) + la `description` de cada skill |
| Tus herramientas aquí | Los seis comandos | Núcleo (lista) + la `description` de cada comando |
| Tus herramientas aquí | Fila «herramientas `mycelium_*`» | Núcleo → `mycelium-operar` |
| Regla 1 | Títulos únicos | Núcleo, regla 1 |
| Regla 2 | Renombrar/mover con la herramienta; borrar a la papelera; `mv`/`rm` solo sin MCP | Núcleo, regla 2 · `mycelium-operar` |
| Regla 2 | Sin MCP: buscar `[[viejo` (alias, embeds, con carpeta); `rm` no pasa por la papelera | `mycelium-operar` § «Sin las herramientas» · `mycelium-vault` § Precauciones |
| Regla 2 | Caracteres prohibidos en el nombre | `mycelium-operar` · `mycelium-vault` · `description` de `mycelium_renombrar` |
| Regla 3 | Nada huérfano | Núcleo, regla 3 |
| Regla 4 | No dupliques | Núcleo, regla 4 |
| Regla 5 | Usar las carpetas existentes | Núcleo, regla 5 · `mycelium-memoria` |
| Regla 6 | Subconjunto del frontmatter, `tags:`, `clave:valor`, lo no soportado, moderación, reusar claves | Núcleo, regla 6 (corta) · `mycelium-vault` § Propiedades |
| Regla 7 | Idioma del vault | Núcleo, regla 7 |
| Regla 8 | No escribir en `.mycelium/`; leer solo `recordatorios.json` y `preferencias.json` | Núcleo, regla 9 · `mycelium-vault` |
| Regla 8 | Calendario y diccionario solo por MCP; sin las herramientas, decírselo y no tocar | Núcleo, regla 9 · `mycelium-vault` · `mycelium-operar` |
| Regla 8 | «No edites `.claude/`» y la política de conflictos | **Reemplazada** por la regla 10 del núcleo (prefijo `mycelium`) · `mycelium-vault`. Los conflictos ya no existen |
| Regla 9 | `.mycignore`: lo ignorado no se ve; el default; no esconder documentación | Núcleo, regla 11 · `mycelium-vault` § `.mycignore` (ahora con negaciones `!`, `FUN-S-30`) |
| Regla 10 | Esporas: moldes; no consolidar, citar ni reportar como huérfanas; partir de ella y expandir las variables | Núcleo, regla 12 · `mycelium-vault` · `mycelium-esporas` |
| Operar Mycelium | Qué es el MCP y dónde se enciende | `mycelium-operar` |
| Operar Mycelium | La línea divisoria (contenido por archivos, operar por Mycelium) | `mycelium-operar` |
| Operar Mycelium | Tabla «Querés… / Herramienta» | **Eliminada**: lo dice la `description` de cada herramienta del MCP |
| Operar Mycelium | Mirar `mycelium_estado` antes de escribir lo que el usuario edita | `mycelium-operar` · `description` de `mycelium_estado` (agregado) · `mycelium-vault` § Qué ve el usuario |
| Operar Mycelium | `mycelium_abrir` no roba el foco | `mycelium-operar` · `description` de `mycelium_abrir` |
| Operar Mycelium | Los errores dicen qué hacer (`NO_ENCONTRADO`, `AMBIGUO`, `APP_CERRADA`, `MCP_DESACTIVADO`) | `mycelium-operar` |
| Operar Mycelium | Lo reversible no pregunta; contar el efecto, no repetir la llamada | `mycelium-operar` |
| Operar Mycelium | Lo grande pregunta; `RECHAZADO` es una respuesta, no insistir ni por otro camino | `mycelium-operar` · `description` de `mycelium_renombrar` (agregado: «ni en partes ni con `mv`») |
| Operar Mycelium | El diccionario del vault: términos propios, una errata se corrige, mayúsculas, el de Mycelium no es tuyo | `mycelium-operar` · `description` de `mycelium_diccionario` (agregado) |
| Operar Mycelium | `CAMBIOS_SIN_GUARDAR`: esperar y repetir | `mycelium-operar` · `description` de `mycelium_borrar` |
| Operar Mycelium | Sin las herramientas; el hook y `MYCELIUM_SIN_MCP=1` | `mycelium-operar` § «Sin las herramientas» |
| Qué es Mycelium por fuera | Lo que ve el usuario (editor, callouts, tareas, propiedades, Esporas, bases, lienzos, diagramas, dibujos, calendario, grafo, búsqueda, visor, terminal, exportación, papelera, Mermaid, KaTeX) | `mycelium-vault` § Qué ve el usuario |
| Qué es Mycelium por fuera | Renombrar escribiendo en el título; recarga desde disco salvo cambios sin guardar; el modal de Excalidraw pisa | `mycelium-vault` § Qué ve el usuario |

Se corrigió de paso: `mycelium-vault` decía que `.mycignore` no tiene negaciones (`FUN-S-30`
las agrega); la tabla de sintaxis mantiene lo corregido en `DEF-131` (un test lo vigila).

## UI

Configuración → Vault → "Asistente IA (Claude Code)": descripción + estado de
versión + botón. Desde la 2.0.0 la línea dice «un bloque en `CLAUDE.md`, sin tocar lo
demás» y el «Más» explica el prefijo `mycelium`; el aviso al generar dice qué pasó con
`CLAUDE.md` (las cinco acciones de la tabla de migración) y qué comandos viejos editados
quedaron como del usuario. Solo con **vault en carpeta** (los archivos se escriben en
disco); en SQLite clásico se muestra el motivo.

## Implementación

- Escritura: reutiliza el comando Rust `escribir_nota` (atómico, `ruta_segura`).
- Lectura de versión: comando Rust nuevo `leer_archivo_texto` (devuelve `None` si
  no existe).
- Regenerar sobrescribe SOLO los archivos del framework; no toca el resto.
- Borrar los comandos sueltos de la 1.x: comando Rust `ia_borrar_anterior`, que solo acepta
  esa lista cerrada de seis rutas (el frontend lo llama si la huella coincide).
- El watcher del vault ignora `.claude/` (directorios ocultos), así que generar no
  dispara reindexados.

## Alcance actual (definido)

La IA **entiende** Mycelium (documentos, vínculos, extensiones, metadatos y
funciones). **Controlarlo** es opt-in y va por el MCP de control (`FUN-L-09`,
[[mcp-control]]): con «Dejar que la IA controle Mycelium» encendido en
Configuración → Vault, la IA puede mostrar notas, el grafo o el calendario y saber
qué está abierto (Parte 1), leer y modificar el calendario (Parte 2) y renombrar,
mover o mandar a la papelera sin romper enlaces (Parte 3) y agregar o quitar
palabras del diccionario del vault (Parte 4, `mycelium_diccionario`; la regla 8 dice
que `.mycelium/diccionario.txt` no se escribe a mano).

## Relacionadas

- [[ia-skills-herramientas]] — `FUN-L-26`: una skill por herramienta (draw.io, canvas, excalidraw, base, Esporas, calendario) para la `1.7.0`.
- [[mcp-control]] — `FUN-L-09`: el MCP de control; su Parte 1 agrega «Operar Mycelium» y el `.mcp.json`.
- [[Mycelium como memoria de la IA]] — la decisión de producto que lo motiva.
- [[Generar el framework de IA en un vault]] — el procedimiento y qué es de quién.
- [[ia-vaults-intensivos]] — `FUN-L-29`: la propuesta y las decisiones del usuario detrás de la 2.0.0.
- [[terminal-integrada]] — dónde corre el asistente.
- [[mycignore]] — por qué `.claude/` no se ve en la app por defecto.
- [[Versionado del sistema]] — cómo se versiona el framework (independiente de la app).
