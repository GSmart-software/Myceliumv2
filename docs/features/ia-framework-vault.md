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

Además, el `CLAUDE.md` incluye un **mapa de cuándo usar cada skill/comando**, para
que la IA sepa qué herramienta corresponde a cada situación.

## Qué genera (v1.7.0)

| Archivo en el vault | Rol |
|---|---|
| `CLAUDE.md` | Eje de memoria: obligaciones (recuperar/consolidar), anatomía de la memoria (nota/enlace/tag/carpeta/grafo/MOC), los dos protocolos, **tabla de herramientas y cuándo usarlas**, reglas duras, y qué es Mycelium por fuera (conocer, no controlar) |
| `.claude/skills/mycelium-vault/SKILL.md` | Referencia **técnica**: sintaxis verificada (wikilinks/alias/embeds/tags/callouts/Mermaid/KaTeX), estructura, recetas de `grep` para recorrer el vault (backlinks, salientes, tags), `.mycignore`, precauciones |
| `.claude/skills/mycelium-memoria/SKILL.md` | **Técnicas de memoria**: recuperación en cinco movimientos, señales de que falta recuperar más, cuándo crear vs ampliar (tabla de decisión), cómo redactar para recuperación futura, mantenimiento (huérfanas, enlaces rotos, hubs) y antipatrones |
| `.claude/commands/vault-buscar.md` | `/vault-buscar <pregunta>`: responde con evidencia del vault y citas (solo lee) |
| `.claude/commands/vault-recordar.md` | `/vault-recordar <qué>`: consolida un hecho/decisión/aprendizaje (crea o amplía + enlaza) |
| `.claude/commands/vault-mapa.md` | `/vault-mapa`: genera/actualiza el MOC "Mapa del vault" (puerta de entrada de la memoria) |
| `.claude/commands/vault-vincular.md` | `/vault-vincular <nota>`: refuerza asociaciones (con la razón de cada vínculo) |
| `.claude/commands/vault-huerfanas.md` | `/vault-huerfanas`: audita salud de la memoria — huérfanas + enlaces rotos (reporta, no aplica solo) |
| `.claude/commands/vault-nota.md` | `/vault-nota <título>`: crea una nota siguiendo las convenciones (sin dejarla huérfana) |
| `.claude/skills/mycelium-{drawio,canvas,excalidraw,base,esporas,calendario}/SKILL.md` | **Una skill por herramienta** (desde la 1.7.0, [[ia-skills-herramientas]]): formato, geometría, recetas y cómo modificar sin romper |
| `.claude/skills/mycelium-{drawio,canvas,excalidraw}/validar-<formato>.mjs` | El **validador** de cada formato, sin dependencias: la IA lo corre con `node` sobre lo que escribió |
| `.claude/mycelium-ia.json` | Marcador de versión del framework (y huellas de lo generado, `DEF-118`) |

Contenido **verificado contra el código real** de Mycelium: `[[Título|alias]]`,
`![[embed]]`, `![[X.excalidraw]]`, `#tag`, callouts (10 tipos, plegables `-/+`,
anidados), `.mycelium/.trash`, **propiedades del frontmatter** con su subconjunto
soportado (`FUN-M-04`, desde la v1.3.0 del framework), las **Esporas** y sus
variables (`FUN-M-03`, desde la v1.4.0), los **tipos de archivo del vault** con la
sintaxis de `.base` y `.canvas` (desde la v1.5.0), y que renombrar **sí** reescribe
los enlaces —pero solo desde la app: un `mv` de la IA no dispara nada, y ahí los
actualiza ella con grep (`FUN-M-08`).

## Versionado

- `FRAMEWORK_IA_VERSION` en `frontend/lib/ia/framework.ts` (hoy `1.7.0`),
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

    El texto de las skills y los validadores **no vive en `framework.ts`**: lo genera
    `scripts/generar-skills-ia.mjs` en `lib/ia/skillsGeneradas.ts` a partir de
    `lib/ia/borradores/` y `scripts/validar-*.mjs` (ver
    [[Generar el framework de IA en un vault]]).
- Cada archivo generado lleva el marcador `<!-- mycelium-ia vX -->`; la versión
  instalada vive en `.claude/mycelium-ia.json`.
- Configuración → Vault muestra instalada vs disponible y ofrece
  Generar / Actualizar / Regenerar. **Solo se genera si el usuario lo pide.**

## Conflictos: nunca se pisa un archivo del usuario

Un `CLAUDE.md` (o cualquier destino) **preexistente y ajeno al framework NO se
sobrescribe**. La detección es por la marca `<!-- mycelium-ia v` en el contenido:

| Situación | Acción |
|---|---|
| La ruta está libre | Se escribe normalmente |
| Existe y **tiene** la marca (lo generó el framework) | Se sobrescribe (es la actualización esperada) |
| Existe y **no** tiene la marca (es del usuario) | **No se toca**: la versión nueva se escribe al lado como `nombre (mycelium-ia vX).md`; si también existe, `… (1)`, `… (2)`, … |

Cuando hay conflictos: la UI los lista en su mensaje y se escribe un reporte
resumido en la raíz del vault, `Conflictos instrucciones IA.md`, con archivo
original → archivo generado.

## UI

Configuración → Vault → "Asistente IA (Claude Code)": descripción + estado de
versión + botón. Solo con **vault en carpeta** (los archivos se escriben en
disco); en SQLite clásico se muestra el motivo.

## Implementación

- Escritura: reutiliza el comando Rust `escribir_nota` (atómico, `ruta_segura`).
- Lectura de versión: comando Rust nuevo `leer_archivo_texto` (devuelve `None` si
  no existe).
- Regenerar sobrescribe SOLO los archivos del framework; no toca el resto.
- El watcher del vault ignora `.claude/` (directorios ocultos), así que generar no
  dispara reindexados.

## Alcance actual (definido)

La IA **entiende** Mycelium (documentos, vínculos, extensiones, metadatos y
funciones) pero **no lo controla**. Control de la app, MCP y demás quedan como
extensiones futuras (ver BACKLOG `FUN-L-08`/`FUN-L-09`).

## Relacionadas

- [[ia-skills-herramientas]] — `FUN-L-26`: una skill por herramienta (draw.io, canvas, excalidraw, base, Esporas, calendario) para la `1.7.0`.
- [[Mycelium como memoria de la IA]] — la decisión de producto que lo motiva.
- [[Generar el framework de IA en un vault]] — el procedimiento y la política de conflictos.
- [[terminal-integrada]] — dónde corre el asistente.
- [[mycignore]] — por qué `.claude/` no se ve en la app por defecto.
- [[Versionado del sistema]] — cómo se versiona el framework (independiente de la app).
