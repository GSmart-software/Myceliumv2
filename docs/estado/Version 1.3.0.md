# Versión 1.3.0

**Solo desktop** (`desktop-tauri`) · 2026-08-03 · un minor sobre [[Version 1.2.0]]

> [!note] `DEF-043` entró en esta misma versión, sin subir el número
> Al probarla, el usuario reportó que el ícono de las Esporas (`Sprout`, un brote de
> planta) no evocaba una espora; se cambió a `CircleDot`. **No se subió a `1.3.1`** porque
> `1.3.0` nunca se distribuyó: no se generó instalador y el usuario la está probando en
> desarrollo. Quemar un número en una compilación que no salió no aporta nada — la regla
> de un release, un incremento, aplica a lo que se **publica**. Ver
> [[Versionado del sistema]].

Un solo tema: **las Esporas**, las plantillas de notas. Spec en [[esporas-plantillas]]
(`FUN-M-03` · `TEMPLATES-ESPORAS`).

> [!warning] Implementado, **sin confirmar por el usuario**
> El código está en `desktop-tauri` y la verificación automática está en verde, pero el
> comportamiento visible **todavía no lo probó el usuario en la app**. El paso a paso de
> los 13 criterios está más abajo. Hasta esa confirmación no se refleja a `web-cloud`
> (ver [[Reflejar cambios de desktop a web]]).

## Por qué sube un minor y no un patch

El usuario puede hacer algo que antes no podía: **crear notas ya con su estructura**, en
vez de rehacerla a mano cada vez. Eso es funcionalidad nueva → **minor**, y al subir el
minor el patch vuelve a `0`: de `1.2.0` se pasa a `1.3.0`. Ver [[Versionado del sistema]].

## Qué es una Espora

**Una Espora es una nota normal del vault** que vive en una carpeta designada. No hay
formato especial, ni registro, ni base de datos: si el archivo está en esa carpeta, es
una plantilla. Es el único concepto del modelo de contenido que depende de **dónde** está
la nota y no de lo que contiene (ver [[Arquitectura de Mycelium]]).

- **Carpeta por defecto**: `Esporas/` en la raíz, **configurable** en Configuración →
  Vault. Cambiarla **no mueve nada**: solo cambia dónde se buscan.
- Se crea desde el panel la primera vez; si la carpeta configurada no existe, el panel lo
  dice y ofrece crearla — nunca falla en silencio.
- Al ser notas normales, se editan con el editor de siempre, viajan en la exportación y
  se ven en el grafo. **No se les da trato especial**: esconderlas sería decidir por el
  usuario.
- La lista es **plana**: las subcarpetas de la carpeta de Esporas no se recorren.

## Variables

Se sustituyen sobre el **texto crudo**, así que también aplican **dentro del
frontmatter**: una Espora con `fecha: {{fecha}}` produce una propiedad de tipo fecha ya
rellena. Es la sinergia natural con [[metadata-yaml]].

| Token | Sustituye por | Ejemplo |
|---|---|---|
| `{{titulo}}` | Título final de la nota destino | `Reunión 2` |
| `{{fecha}}` | Fecha de hoy en ISO | `2026-08-03` |
| `{{hora}}` | Hora actual, 24 h | `15:04` |
| `{{fecha:FORMATO}}` | Fecha/hora con formato propio | `{{fecha:DD/MM/AAAA}}` → `03/08/2026` |

Tokens de formato: `AAAA` año · `MM` mes · `DD` día · `hh` hora · `mm` minuto · `ss`
segundo. Todo lo demás se copia literal, así que `{{fecha:AAAA-MM-DD hh:mm}}` funciona.
Un token **desconocido se deja tal cual**: es preferible que el usuario vea `{{autor}}`
escrito en su nota y entienda que no existe, a que desaparezca en silencio.

`{{titulo}}` se resuelve con el título **final** de la nota, después de sanear y
desambiguar: crear dos notas de la Espora `Reunión` da `Reunión` y `Reunión 2`, y cada
una lleva su propio título dentro.

## Las tres vías de uso

Las tres comparten el mismo núcleo —listar las Esporas + sustituir variables—; lo que
cambia es qué se hace con el resultado.

1. **Panel de Esporas** (icono `CircleDot` en el rail). Un clic en una Espora **crea la
   nota** en la carpeta activa del explorador, con el nombre de la plantilla, y la abre.
   Sin diálogo. Cada fila trae además editar, renombrar y borrar (a la papelera), y hay
   un botón "Nueva Espora". Si la carpeta no existe o está vacía, el panel **explica qué
   es una Espora** y ofrece crear la primera.
2. **"Insertar Espora"** en la barra del editor. Es la única vía que sirve para notas que
   **ya existen**: mete el cuerpo en la posición del cursor y `{{titulo}}` se resuelve con
   el título de esa nota.
3. **"Nueva desde Espora ▸"** en el clic derecho de una carpeta del explorador. Crea
   **en esa carpeta**, no en la activa. Sin Esporas la entrada aparece **deshabilitada**
   con el motivo en el `title`, no oculta: es la forma de que se descubra.

> [!important] Crear una nota sigue siendo un clic
> El backlog planteaba que "Nueva nota" abriera un menú con nombre y selector de
> plantilla. Se **descartó**: crear una nota es la acción más frecuente de la app y
> pasaría de un clic a clic + Enter, siempre, para algo que se usa de vez en cuando.

## Las dos decisiones que valía la pena tomar

### Insertar es una transacción del editor, no una escritura del archivo

La inserción se despacha como **una transacción sobre el CodeMirror de la nota**. Si
llamara a `putContenido` mientras el editor tiene el documento montado, el siguiente
autoguardado del editor —debounce de 800 ms sobre **su** estado— pisaría el cambio y el
usuario no podría deshacerlo con `Ctrl+Z`. Es la misma causa raíz que llevó al panel de
propiedades de [[Version 1.2.0]] a la misma solución.

La transacción lleva los **dos** cambios juntos (el frontmatter fusionado y el cuerpo en
el cursor), así que `Ctrl+Z` deshace la inserción entera en **un** paso.

### Si la Espora tiene frontmatter, sus propiedades se fusionan

Insertar el bloque `---` en medio de un documento lo convertiría en una línea horizontal
y un título fantasma — exactamente lo que `FUN-M-04` vino a arreglar. Así que al
insertar: el **cuerpo** va al cursor y las **propiedades** se añaden al frontmatter de la
nota destino con `ponerPropiedad` de `lib/frontmatter.ts` (creando el bloque si no
tenía).

- Ante una clave que la nota ya tiene, **gana la de la nota**: la plantilla aporta lo que
  falta, no pisa lo que el usuario escribió.
- Excepción: `tags`, donde los dos conjuntos se **unen** sin duplicados.
- Si el frontmatter de la nota destino es **no soportado**, no se toca: se inserta solo
  el cuerpo y el menú avisa de que las propiedades no se pudieron fusionar.

## Dónde vive el código

| Archivo | Qué hace |
|---|---|
| `frontend/lib/esporas.ts` | Lógica **pura**: sustitución de variables y saneo de la ruta configurada. Sin imports, para que el test la transpile e importe sin build (igual que `lib/frontmatter.ts`). |
| `frontend/scripts/test-esporas.mjs` | 15 casos: cada token, el formato propio, token desconocido intacto, llaves sueltas, sustitución dentro del frontmatter, CRLF y las rutas rechazadas. |
| `frontend/lib/esporasVault.ts` | Lo que toca el vault: listar, crear la nota, crear la carpeta que falte, fusionar propiedades e insertar por transacción. |
| `frontend/components/explorer/EsporasPanel.tsx` | El panel del rail. |
| `frontend/components/editor/EsporaMenu.tsx` | La lista para insertar, en un portal a `<body>`. |
| `frontend/components/explorer/ContextMenu.tsx` | Gana submenús, entradas deshabilitadas y `title` propio. |

> [!note] Listar es una consulta al árbol, no al índice
> Una Espora es "una nota cuya carpeta es exactamente la configurada", y en desktop el
> **id de una carpeta es su ruta**, así que la lista sale del árbol que `vaultStore` ya
> tiene en memoria: sin query nueva, sin tabla nueva y reactiva a cualquier cambio del
> vault. Es también lo único que **no** se puede copiar tal cual a web, donde el id de
> una carpeta es un UUID (ver [[RAMAS]]).

`crearNota` (`lib/db/notas.ts`) **no cambió de forma**: sigue creando el archivo vacío y
el contenido se escribe después con `putContenido`. Es a propósito — web tiene el mismo
endpoint en .NET y cambiar la firma alejaría las dos versiones sin necesidad.

## El framework de IA sube a 1.4.0

Que exista una carpeta de plantillas cambia **cómo debe tratar la IA esas notas**: son
moldes, no memoria. Así que no debe consolidar conocimiento ahí, ni citarlas como fuente,
ni reportarlas como huérfanas — y, al revés, gana una herramienta: si el usuario pide una
nota de un tipo que ya tiene Espora, conviene partir de ella.

Se actualizan el `CLAUDE.md` generado (regla dura 10 y "qué es Mycelium por fuera"), la
skill `mycelium-vault` (sección nueva con las variables y cómo tratarlas) y los comandos
`/vault-nota` y `/vault-huerfanas`. Ver [[ia-framework-vault]].

> [!warning] Hay que regenerarlo en este vault
> El vault de este repo tiene instalada la **v1.2.0**. Configuración → Vault detecta la
> versión instalada y ofrece actualizar. Ver [[Generar el framework de IA en un vault]].

## Cómo comprobarlo en la app

Preparación: abrí el panel **Esporas** del rail y creá la carpeta si te la ofrece. Después
creá una Espora llamada `Reunión` con este contenido exacto:

```md
---
fecha: {{fecha}}
tipo: reunion
tags: [reunion, trabajo]
---

# {{titulo}}

Creada el {{fecha:DD/MM/AAAA}} a las {{hora}}. Autor: {{autor}}

## Asistentes

## Temas

## Acuerdos
```

| # | Criterio | Cómo comprobarlo |
|---|---|---|
| 1 | Estado vacío explicado | Con la carpeta configurada **inexistente** (poné `Plantillas` en Configuración → Vault), el panel explica qué es una Espora y ofrece crearla o cambiarla. Con la carpeta creada pero **vacía**, explica qué es y ofrece crear la primera. Nunca un panel vacío ni un error. |
| 2 | "Nueva Espora" | El botón crea una plantilla en la carpeta configurada y la abre para editarla. |
| 3 | Un clic crea la nota | Clic en una carpeta del explorador para hacerla la activa, y después clic en `Reunión` en el panel: se crea ahí una nota `Reunión`, se abre, y el contenido tiene la fecha y la hora **ya sustituidas**. |
| 4 | Desambiguación | Repetí el paso 3: la segunda nota se llama `Reunión 2` y **ninguna pisa a la otra**. Dentro, el `# {{titulo}}` de cada una dice su propio nombre (`Reunión` y `Reunión 2`). |
| 5 | Propiedad de tipo fecha | En la nota creada, abrí el panel y la pestaña **PROPIEDADES**: `fecha` tiene que aparecer como propiedad **de tipo fecha** con la fecha de hoy (el icono `▤` y un selector de fecha). |
| 6 | Token inexistente | En esa misma nota, `{{autor}}` tiene que estar escrito **tal cual**, sin sustituir. |
| 7 | Formato propio | `{{fecha:DD/MM/AAAA}}` produjo la fecha con ese formato (`03/08/2026`), no en ISO. |
| 8 | Insertar sin `---` suelto | Abrí una nota cualquiera **sin** frontmatter, poné el cursor en medio del texto y usá **Insertar Espora** (icono de brote en la barra de formato). El cuerpo tiene que entrar en el cursor y **no** puede quedar un `---` suelto ni un título fantasma: en modo lectura (`Ctrl+3`) tiene que verse una tarjeta de propiedades arriba. |
| 9 | Fusión de propiedades | Preparate una nota con este frontmatter: `tipo: nota propia` + `tags: [propio]`. Insertale la Espora: `tipo` **sigue diciendo** `nota propia` (gana la nota), `fecha` se **añadió** (la nota no la tenía) y `tags` quedó con `propio`, `reunion` y `trabajo`, **sin duplicados**. |
| 10 | Deshacer en un paso | `Ctrl+Z` justo después de insertar tiene que deshacer **toda** la inserción —cuerpo y propiedades— de una sola vez. |
| 11 | Clic derecho en una carpeta | Con **otra** carpeta activa, clic derecho sobre una carpeta cualquiera → **Nueva desde Espora ▸ Reunión**: la nota se crea **en esa carpeta**, no en la activa. Después renombrá la carpeta de Esporas para que no exista: la entrada tiene que aparecer **deshabilitada** (apagada), no oculta, y el tooltip explica por qué. |
| 12 | Cambiar la carpeta | Creá una carpeta `Plantillas` con una nota adentro, poné `Plantillas` en Configuración → Vault y cerrá el diálogo: el panel de Esporas tiene que listar esa nota **sin reiniciar**, y la carpeta `Esporas/` tiene que seguir donde estaba con sus archivos intactos. |
| 13 | **No-regresión de "Nueva nota"** | El botón "+" del explorador tiene que seguir funcionando **exactamente igual que antes**: un clic, sin diálogo, nota vacía llamada "Sin título". |

## Verificación

- `npx tsc --noEmit -p tsconfig.json` en verde (exit 0).
- `node scripts/test-esporas.mjs` — 15 casos, todos en verde.
- `node scripts/test-frontmatter.mjs` — 36 casos en verde (no-regresión: la fusión de
  propiedades entra por su terreno).
- No se tocó Rust, así que no hizo falta `cargo check`.

Ver [[Verificar antes de integrar]]: nada de esto prueba comportamiento visible.

## Instaladores

**Todavía no generados**, igual que los de [[Version 1.1.1]], [[Version 1.1.5]] y
[[Version 1.2.0]]. Procedimiento en [[Generar instaladores desktop]].

## Reflejo a web

Pendiente y **explícitamente diferido** hasta que el usuario confirme el comportamiento en
desktop. Casi todo es **compartido** —las plantillas son notas del vault, así que la capa
de datos no cambia—; lo que hay que aplicar a mano son los archivos que ya divergían
(`VaultSection.tsx`, el dock del panel lateral, `Rail.tsx`, `panelLayoutStore.ts`). La
lista está en [[RAMAS]]; la receta, en [[Reflejar cambios de desktop a web]].

## Relacionadas

- [[Version 1.4.0]] — el release siguiente: Mycelium empieza a actualizarse solo.
- [[Version 1.2.0]] — el release anterior, cuyas propiedades usan las Esporas.
- [[esporas-plantillas]] — la spec, con los 13 criterios de aceptación completos.
- [[metadata-yaml]] — las propiedades que las Esporas rellenan y fusionan.
- [[Versionado del sistema]] — por qué un minor y por qué el patch vuelve a `0`.
- [[ia-framework-vault]] — el framework que subió a `1.4.0` con esta funcionalidad.
- [[BACKLOG]] — `FUN-M-07` (Daily Note) ya tiene de dónde tomar la plantilla.
- [[Arquitectura de Mycelium]] — el modelo de contenido gana el concepto de molde.
- [[Estado del proyecto]] — situación actual.
