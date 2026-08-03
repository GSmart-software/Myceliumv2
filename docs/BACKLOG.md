# Backlog de funcionalidades — Mycelium

Consolidación de las ideas de [`Ideas Mycelium.md`](Ideas%20Mycelium.md) y de las
implementaciones diferidas (antes en `FUTURE_IMPLEMENTATIONS.md`, ahora integradas
aquí — ese documento fue eliminado), con **IDs numeradas por tamaño** y un **nombre
descriptivo**. El objetivo es planificar el **versionado** (qué entra en cada release)
y **priorizar** qué implementar antes.

> Este documento no reemplaza a `Roadmap general.md` (roadmap de HUs del producto);
> es el backlog vivo de mejoras/ideas post‑1.0.

> [!tip] Las ideas nuevas entran por [[Bandeja de entrada]]
> Ahí el usuario las anota en crudo; acá llegan ya definidas, con ID, nombre y tamaño.

## Cómo leerlo

- **ID**: `FUN-TIER-NN` — la letra es el **tamaño** (`S`/`M`/`L`/`XL`) y el número es
  correlativo dentro de ese tamaño. Ejemplos: `FUN-S-01`, `FUN-M-03`, `FUN-XL-02`. Estable para
  referenciar en commits/PRs. El ID comunica de por sí la complejidad.
- **Nombre**: etiqueta descriptiva `AREA-CONCEPTO` (legible, para saber de qué trata).
- **Orig.**: ID original en `Ideas Mycelium.md` (o la HU) para cruzar con las notas.
- **Tamaño** (complejidad/esfuerzo, no prioridad):
  - **S** — pequeño: unas horas, uno o dos archivos, sin tocar datos.
  - **M** — intermedio: varios componentes/estado, sin rearquitectura.
  - **L** — grande: subsistema nuevo o que cruza frontend + backend/datos.
  - **XL** — muy grande: rearquitectura o dependencia de infraestructura (nube).
- **Aplica**: `ambas` · `web` · `desktop` (las dos versiones divergen en la capa de
  datos; ver `RAMAS.md`).
- **Estado**: ⬜ pendiente · 🟡 implementado con errores/ajustes · 🟢 implementado ·
  🔵 diferido (referenciado por una HU, fuera del alcance actual).

### Relación tamaño ↔ versión (SemVer, guía)

| Tamaño / tipo | Impacto de versión sugerido |
|---|---|
| Corrección (🟡) o ajuste trivial | **patch** (`1.0.x`) |
| Optimización o mejora de lo existente, sin funcionalidad nueva | **patch** (`1.0.x`) |
| Funcionalidad nueva compatible (S/M/L) | **minor** (`1.x.0`) |
| Rearquitectura / cambio de almacenamiento / nube (XL) | **major** (`x.0.0`) |

> [!warning] El tamaño mide ESFUERZO, no impacto de versión
> `S/M/L/XL` dice cuánto cuesta implementar algo, no cuánto cambia para el usuario. Un
> `FUN-M` puede ser **patch** si nadie puede hacer nada que antes no pudiera — es el
> caso de `FUN-M-12`, que salió en [[Version 1.1.1]]. Criterio completo en
> [[Versionado del sistema]].

> [!important] La tabla dice QUÉ dígito sube, no cuántas veces
> Un release sube **un** incremento, del tamaño del cambio más significativo que lleve.
> Si entran tres `FUN-*` juntas, la versión sube **un** minor, no tres — y ese minor
> absorbe las correcciones que vengan con ellas.

---

## 1. Pendientes (backlog priorizable)

### 1.1 Rápidas — tamaño S

| ID | Nombre | Descripción | Aplica | Orig. |
|---|---|---|---|---|
| `FUN-S-01` | `EDITOR-CHECKBOX-ESTILOS` | Estilos de checkbox según el símbolo: `x`=X, `-`=tachado, `*`=estrella, `+`=check | ambas | C-M-06 |
| `FUN-S-02` | `EDITOR-TAB-WIDTH` | Configurar cuánto espacio ocupa una tabulación | ambas | C-M-10 |
| `FUN-S-03` | `EXPLORER-EXTENSIONES` | Mostrar la extensión de los archivos no‑markdown para poder identificarlos | ambas | C-M-12 |
| `FUN-S-04` | `TRASH-MULTISELECT` | Seleccionar varios archivos para borrar en la papelera | ambas | C-M-14 |
| `FUN-S-05` | `VAULT-EJEMPLO-DEFAULT` | Al crear un vault nuevo, generar un archivo de ejemplo por defecto | ambas | C-G-02 |
| `FUN-S-08` | `NOTE-CSSCLASSES` | Aplicar a la nota las clases CSS que declare su propiedad `cssclasses`: hoy se parsea e indexa pero **no tiene comportamiento**. Continuación de `FUN-M-04` | ambas | — |
| `FUN-S-09` | `CODE-RESALTADO-SINTAXIS` | Colorear los archivos de código al visualizarlos según su lenguaje (palabras reservadas, tipos, cadenas). **Depende de `FUN-L-11`**: sin visor de código no hay nada que colorear | ambas | — |

### 1.2 Intermedias — tamaño M

| ID | Nombre | Descripción | Aplica | Orig. |
|---|---|---|---|---|
| `FUN-M-01` | `TRASH-PREVIEW` | Visualizar el contenido de los archivos en la papelera | ambas | C-M-13 |
| `FUN-M-02` | `GRAPH-BUSCADOR-FILTRO` | Buscar por nombre en el grafo: atenúa los nodos que no coinciden | ambas | C-I-03 |
| `FUN-M-03` 🛠️ | `TEMPLATES-ESPORAS` | Plantillas ("Esporas") para crear notas rápido: panel en el rail, "Insertar Espora" en la barra del editor y submenú en el clic derecho de una carpeta. **Implementado en desktop** (sin confirmar); spec en `docs/features/esporas-plantillas.md`. Salió en [[Version 1.3.0]]. Pendiente el reflejo a web | ambas | C-I-04 |
| `FUN-M-04` 🟢 | `METADATA-YAML` | Manejar metadatos YAML (frontmatter `---`) de las notas como **propiedades** consultables (prerequisito de `FUN-L-03`). **Confirmado en desktop** el 2026-08-02; spec en `docs/features/metadata-yaml.md`. Salió en [[Version 1.2.0]]. Pendiente el reflejo a web | ambas | C-I-07a |
| `FUN-M-11` 🛠️ | `VAULT-MYCIGNORE` | `.mycignore` por vault (estilo `.gitignore`) para decidir qué archivos/carpetas ignora Mycelium; por defecto `.*/` + carpetas de build. **Implementado en desktop** (sin confirmar); parte **web** pendiente (otra semántica). Spec en `docs/features/mycignore.md` | ambas | — |
| `FUN-M-12` 🛠️ | `VAULT-INDEX-PERF` | Rendimiento de la apertura del vault: default de `.mycignore` con `node_modules/`/`target/`/`dist/`/`out/`, metadatos sin contenido + `leer_archivos` en tandas, carpetas incrementales, WAL y progreso visible. **Implementado en desktop** (sin confirmar); spec en `docs/features/rendimiento-apertura-vault.md`. Salió en [[Version 1.1.1]] | desktop | — |
| `FUN-M-13` | `VAULT-INDEX-UN-RECORRIDO` | Fusionar `listar_archivos_meta` y `listar_directorios` en un solo comando que devuelva `{archivos, directorios}`: hoy el vault se recorre **dos veces** por apertura. Continuación de `FUN-M-12` | desktop | — |
| `FUN-M-14` | `VAULT-WATCH-REINDEX-DIRIGIDO` | El watcher emite `vault-cambios` **con las rutas afectadas** y `lib/vaultWatch.ts` las descarta: reindexa el vault entero ante cualquier cambio. Usar esas rutas para reindexar solo lo tocado. Continuación de `FUN-M-12` | desktop | — |
| `FUN-M-15` | `LINKS-POR-ALIAS` | Resolver `[[enlaces]]` por la propiedad `aliases` de la nota destino: hoy se parsea e indexa pero **no tiene comportamiento**. Toca la resolución de wikilinks, el autocompletado y el grafo. Continuación de `FUN-M-04` | ambas | — |
| `FUN-M-16` 🛠️ | `UPDATER-SELECCION-VERSION` | Elegir e instalar **cualquier versión publicada**, incluida una anterior, desde un modo avanzado oculto (siete clics en el número de versión). Deja la app fijada en esa versión. Herramienta de desarrollo, no para el usuario normal. **Implementado en desktop** (sin confirmar y **sin probar de extremo a extremo**: falta el bucket). Spec en `docs/features/autoactualizacion.md` § 4.3. Salió en [[Version 1.4.0]] | desktop | — |

### 1.3 Grandes — tamaño L

| ID | Nombre | Descripción | Aplica | Orig. |
|---|---|---|---|---|
| `FUN-L-01` | `MACROS-HOTKEYS` | Configurar acciones de Mycelium por macros/atajos (escribir, crear con plantilla, abrir, etc.) | ambas | C-I-05 |
| `FUN-L-02` | `SHARING-PUBLICOS-GLOBALES` | Carpeta "Estado Mycelium" con 3 archivos públicos (Ayudas / Bugs / Ideas): editables por autorizados, visibles por todos | web | C-I-06 |
| `FUN-L-03` | `FILES-BASES-TABLA` | Tipo de archivo tipo "bases" (tabla) que agrega notas por metadatos, con filtros y columnas configurables. Depende de `FUN-M-04` | ambas | C-I-07b |
| `FUN-L-04` | `VAULT-MULTIPLE` | Un usuario con varios vaults, seleccionables en Configuración → Vault | ambas | C-G-01 |
| `FUN-L-07` 🛠️ | `TERMINAL-INTEGRADA` | Consola nativa integrada (estilo VS Code): abre en la raíz del vault (o en la carpeta elegida), como pestaña normal del workspace (dividir, varias instancias). **Implementada** (sin confirmar); spec en `docs/features/terminal-integrada.md` | desktop | — |
| `FUN-L-08` 🛠️ | `IA-FRAMEWORK-VAULT` | Framework IA versionado generado en el vault (CLAUDE.md + 2 skills + 6 comandos en `.claude/`) para que Claude Code use el vault como **memoria**: recuperar antes de responder y consolidar lo que valga recordar, navegando por vínculos. Botón opt‑in en Configuración → Vault. **Implementada** (sin confirmar); spec en `docs/features/ia-framework-vault.md` | desktop | — |
| `FUN-L-09` | `IA-MCP-MYCELIUM` | Servidor MCP de Mycelium: exponer a la IA el índice del vault (búsqueda, backlinks, grafo, metadatos) como herramientas estructuradas, en vez de grep sobre archivos | desktop | — |
| `FUN-L-10` | `VAULT-INDEX-EN-RUST` | Mover el indexado entero a Rust: el walker lee y escribe el índice en el mismo proceso, en **una** transacción, sin pasar contenido por IPC. Resuelve de raíz lo que `FUN-M-12` mitigó desde el frontend (incluido el `BEGIN`/`COMMIT` que el pool de `tauri-plugin-sql` impide). Continuación de `FUN-M-12` | desktop | — |
| `FUN-L-11` | `FILES-OTROS-TIPOS` | Ver en Mycelium los archivos que hoy ignora: PDF, código de cualquier lenguaje y texto plano. Aparecen en el explorador y se abren en un visor propio, como una pestaña más | ambas | — |
| `FUN-L-12` | `EDITOR-CORRECTOR-ORTOGRAFICO` | Corrector ortográfico activable en Configuración, con **varios idiomas simultáneos** (p. ej. español e inglés) y arquitectura preparada para sumar idiomas | ambas | — |
| `FUN-L-13` | `UI-IDIOMAS` | La interfaz en varios idiomas (español, inglés, italiano) y preparada para agregar más. Hoy todos los textos están escritos en español dentro de los componentes | ambas | — |
| `FUN-L-14` 🛠️ | `UPDATER-AUTOACTUALIZACION` | Mycelium comprueba una vez al día si hay versión nueva, muestra su changelog y ofrece instalarla con un clic. Nunca obliga ni bloquea. `tauri-plugin-updater` + instaladores firmados en Cloudflare R2. **Implementado en desktop** (sin confirmar y **sin probar de extremo a extremo**: falta crear el bucket y generar la clave, ver [[Publicar una version]] § 1). Spec en `docs/features/autoactualizacion.md`. Salió en [[Version 1.4.0]] | desktop | — |
| `FUN-L-15` 🛠️ | `RELEASE-SCRIPT-PUBLICACION` | Un `npm run publicar` que compruebe, compile, firme, suba a R2 con `wrangler`, escriba los tres manifiestos y **verifique lo publicado**, en vez de hacer esos cuatro pasos a mano. Tiene modo `--simulacro`. **Script local, no CI**: usar el workflow obligaría a alinear `origin` y a poner la clave de firma como secreto de GitHub. **Implementado en desktop** (sin confirmar); el proceso, en [[Publicar una version]] § 2 | desktop | — |

### 1.4 Muy grandes — tamaño XL

| ID | Nombre | Descripción | Aplica | Orig. |
|---|---|---|---|---|
| `FUN-XL-01` | `STORAGE-LOCAL-FIRST-NUBE` | Almacenamiento local con guardado a la nube **a conciencia** (nunca automático); compartidos sí se sincronizan solos. Reduce servidor/costos | desktop | C-G-03 |

> **`FUN-L-04` (`VAULT-MULTIPLE`)**: en **desktop** ya existe la base (lista/selección de
> vaults en carpeta, entrar/salir de vault — ver `docs/features/vault-en-carpeta.md`);
> falta revisar/completar la experiencia y llevarlo a **web**. Reclasificar a `FUN-M` si en
> desktop ya está cubierto.

---

## 2. Con errores / a ajustar (🟡)

| ID | Nombre | Descripción | Aplica | Orig. |
|---|---|---|---|---|
| `FUN-S-06` | `EDITOR-CALLOUT-TITULO-COLOR` | El título del callout debe conservar el color de la etiqueta. Bug: al aplicar negrita/cursiva/color/links dentro del título, se pierde ese estilo (el color solo debería aplicarse cuando no hay otro elemento con estilo propio) | ambas | C-M-04 |

---

## 3. Diferidas — referenciadas por HUs (🔵)

Implementaciones referenciadas por las HUs y diferidas fuera del alcance actual (antes
en `FUTURE_IMPLEMENTATIONS.md`, hoy consolidadas aquí). Varias son **solo web**
(login/nube/colaboración no aplican al desktop local sin login).

| ID | Nombre | Descripción | Aplica | Orig. |
|---|---|---|---|---|
| `FUN-M-05` | `TAGS-PANEL` | Panel de tags del rail (listado, conteo, filtrado por tag); hoy es placeholder | ambas | HU-28 |
| `FUN-M-06` | `TAGS-GRAFO-NODOS` | Mostrar tags como nodos en el mini‑grafo y el grafo global | ambas | HU-30 |
| `FUN-M-07` | `DAILY-NOTE` | Nota diaria (crear/abrir la del día con plantilla); ícono del rail es placeholder | ambas | HU-28 |
| `FUN-M-08` | `LINKS-REESCRITURA-RENOMBRAR` | Reescribir los `[[enlaces]]` que apuntan al título viejo al renombrar una nota | ambas | HU-23 |
| `FUN-M-09` | `EXPORT-ZIP-SERVIDOR` | Exportar ZIP de vaults ≥ 200 MB en el servidor con progreso (hoy 100% cliente) | web | HU-09 |
| `FUN-M-10` | `AUTH-OAUTH-GITHUB` | Login con GitHub (requiere registrar OAuth App + credenciales) | web | HU-32 |
| `FUN-S-07` | `COLLAB-PRESENCIA-AJUSTES` | Afinar timeout de cursor (5 s) y agrupado "+N más" (8 cursores) | web | HU-06 |
| `FUN-L-05` | `IMPORT-ADJUNTOS` | Subsistema de adjuntos (`.png/.jpg/.pdf/.svg/.excalidraw` sueltos) en importación Obsidian | ambas | HU-07/11 |
| `FUN-L-06` | `COLLAB-HISTORIAL-VERSIONES` | Registrar qué miembro hizo cada cambio (historial) | web | HU-37 |
| `FUN-XL-02` | `COLLAB-REALTIME` | Edición simultánea en tiempo real + presencia (arquitectura lista; requiere Durable Object + Cloudflare) | web | HU-05/06/37 |
| `FUN-XL-03` | `INFRA-CLOUDFLARE` | Integración D1 / R2 / Durable Objects (hoy adaptadores stub, todo local) | web | — |

---

## 4. Implementadas (registro) 🟢

De `Ideas Mycelium.md` → "Completados", más dos que el antiguo
`FUTURE_IMPLEMENTATIONS.md` listaba como pendientes pero **ya están hechas** (ver §6).
Estas ya no necesitan ID de backlog; se listan por nombre para referencia.

| Nombre | Descripción | Orig. |
|---|---|---|
| `EDITOR-AUTOCOMPLETE-ENLACES` | Autocompletado al escribir referencias `[[…]]` | C-M-01 |
| `EDITOR-AUTOCLOSE-PARES` | Autocerrar `()[]{} ** __ "" ''` (con opción y envolver selección) | C-M-02 |
| `EDITOR-TITULO-ARCHIVO` | Nombre del archivo como título superior (editable, no fixed, con opción de ocultar) | C-M-03 |
| `EDITOR-ENFASIS-ESTILOS` | Estilos distintos para `*` `_` `**` `__` `***` `___` (glow/accent/gradiente) | C-M-05 |
| `EDITOR-PANEL-METADATOS` | Panel de metadatos mostrable/ocultable, junto al botón de buscar | C-I-01 |
| `GRAPH-INTENSIDAD-CONEXIONES` | Ajuste de intensidad de color de las conexiones | C-M-11 |
| `GRAPH-DIRECCION-ENLACES` | Indicador de dirección en enlaces (animación/flecha, configurable) | C-M-07 |
| `GRAPH-COLOR-NODOS` | Color de nodos por path/etiquetas (regla desactivable) | C-M-09 |
| `GRAPH-EXCLUIR-NODOS` | Excluir carpetas/archivos del grafo (por nombre o path) | C-M-08 |
| `GRAPH-CONSTRUCCION-TEMPORAL` | Construcción temporal del grafo (nodos por orden de creación) | C-I-02 |
| `TABS-PERSISTENCIA` | Persistencia de pestañas abiertas al salir del sistema | C-M-12 |
| `TABS-PINNING` | Fijar pestañas (doble clic pasa la pestaña de preview a permanente) | HU-25 |

---

## 5. Detalle de las ideas

Ampliación de **qué es** y **para qué** de cada funcionalidad, según la interpretación
actual (nivel de idea/objetivo, **no** de diseño de implementación). Pensado para
revisar y ajustar: los apartados **A definir** marcan decisiones abiertas.

### Pendientes — tamaño S

#### `FUN-S-01` · `EDITOR-CHECKBOX-ESTILOS` (C-M-06)
- **Qué es**: en listas de tareas, el símbolo que va dentro de `[ ]` determina un
  estado visual distinto: `x` → una X, `-` → texto tachado, `*` → estrella, `+` →
  check. Cada símbolo representa un "tipo" de marca con su ícono/estilo propio.
- **Objetivo**: expresar estados de tarea más ricos que solo hecho/no hecho (p. ej.
  cancelado, destacado, en curso), como los estados de tarea de Obsidian, sin salir del
  Markdown estándar.
- **A definir**: el set exacto de símbolos y qué significa cada uno; si es configurable;
  si el estilo alcanza a toda la línea (p. ej. tachar el texto de un ítem descartado).

#### `FUN-S-02` · `EDITOR-TAB-WIDTH` (C-M-10)
- **Qué es**: opción en Configuración para elegir cuánto "vale" una tabulación en el
  editor (p. ej. 2 / 4 / 8 espacios).
- **Objetivo**: adaptar la indentación al gusto del usuario y a la coherencia con otras
  herramientas; impacta sobre todo en listas anidadas y bloques de código.
- **A definir**: valores admitidos; si inserta espacios o tab real; si es global o por
  vault.

#### `FUN-S-03` · `EXPLORER-EXTENSIONES` (C-M-12)
- **Qué es**: mostrar en el árbol del explorador la extensión de los archivos que **no**
  son markdown (`.excalidraw`, `.png`, `.pdf`, …) para poder identificarlos; los `.md`
  pueden seguir mostrándose sin extensión por ser el caso dominante.
- **Objetivo**: que el usuario distinga de un vistazo el tipo de archivo cuando maneja
  algo distinto a notas (hoy todos se ven igual).
- **A definir**: si los `.md` también pueden mostrar extensión (opción); combinación con
  íconos por tipo.

#### `FUN-S-04` · `TRASH-MULTISELECT` (C-M-14)
- **Qué es**: en la papelera, seleccionar varios archivos a la vez (checkboxes o
  Ctrl/Shift‑clic) para borrarlos definitivamente o restaurarlos en lote.
- **Objetivo**: gestionar/vaciar la papelera de forma eficiente sin repetir la acción
  archivo por archivo.
- **A definir**: si el lote aplica también a restaurar; confirmación antes del borrado
  definitivo; "seleccionar todo".

#### `FUN-S-05` · `VAULT-EJEMPLO-DEFAULT` (C-G-02)
- **Qué es**: al crear un vault nuevo (cuenta nueva o vault nuevo), generar
  automáticamente una nota de ejemplo/bienvenida.
- **Objetivo**: que el vault no arranque vacío; sirve de onboarding (muestra formato,
  callouts, enlaces `[[ ]]`, grafo) y evita la "pantalla en blanco" inicial.
- **A definir**: contenido de esa nota (mini‑guía de Mycelium); si es una sola o un
  pequeño set de ejemplo.

#### `FUN-S-08` · `NOTE-CSSCLASSES` (—)
- **Qué es**: que la propiedad `cssclasses` de una nota aplique esas clases al contenedor
  de la nota (edición y lectura), para que un snippet CSS del usuario pueda darle un
  aspecto propio. Hoy `FUN-M-04` la parsea y la indexa como cualquier otra clave, pero
  **no tiene comportamiento**: quedó reservada a propósito para no darle otro significado
  después.
- **Objetivo**: notas con estilo propio (fichas, portadas, diarios) sin tocar el código.
- **A definir**: dónde se cuelgan las clases (`.mic-preview`, el host de CodeMirror, o
  ambos) y si se saneen los nombres de clase.

#### `FUN-S-09` · `CODE-RESALTADO-SINTAXIS` (—)
- **Qué es**: que un archivo de código abierto en Mycelium se vea **coloreado según su
  lenguaje** — palabras reservadas, tipos, cadenas, comentarios— en vez de como un bloque
  de texto plano.
- **Objetivo**: poder leer código dentro del vault sin abrir otro editor.
- **Es S solo porque la infraestructura ya está**: el proyecto usa `highlight.js` (vía
  `rehype-highlight`, para los bloques cercados) y tiene `@codemirror/language-data`, que
  carga gramáticas de decenas de lenguajes bajo demanda. Lo que falta es el visor.
- **A definir**: si el resaltado lo hace CodeMirror o `highlight.js` (conviene el mismo
  motor que use el visor de `FUN-L-11`, para no mantener dos paletas), y de dónde sale el
  lenguaje (extensión del archivo).
- **Depende de `FUN-L-11`**: sin visor de código no hay nada que colorear.

### Pendientes — tamaño M

#### `FUN-M-01` · `TRASH-PREVIEW` (C-M-13)
- **Qué es**: poder ver el contenido de un archivo que está en la papelera (en solo
  lectura) antes de decidir si restaurarlo o borrarlo.
- **Objetivo**: decidir con información — muchas veces el nombre no basta para recordar
  qué contenía el archivo.
- **A definir**: si desde el preview se puede restaurar directamente; cómo se muestra
  (panel lateral, modal o el visor del explorador).

#### `FUN-M-02` · `GRAPH-BUSCADOR-FILTRO` (C-I-03)
- **Qué es**: un buscador dentro del grafo que, al escribir, **atenúa** los nodos que no
  coinciden por nombre y deja iluminados los que sí (y, potencialmente, sus vecinos).
- **Objetivo**: ubicar rápido una nota y sus conexiones en grafos grandes, sin perderla
  entre cientos de nodos.
- **A definir**: coincidencia parcial vs exacta; si además centra/hace zoom al
  resultado; si permite buscar por tag o path además del nombre.

#### `FUN-M-03` · `TEMPLATES-ESPORAS` (C-I-04) — 🛠️ desktop
- **Qué es**: plantillas reutilizables para crear notas ya con una estructura base. Un
  botón nuevo en el rail izquierdo permite ver/gestionar (crear, editar, borrar) las
  plantillas. Al crear un archivo, aparece un menú (como el de crear carpeta) con el
  nombre (por defecto "nuevo archivo") y un selector de plantilla (por defecto
  "ninguna"). Nombre propuesto para las plantillas: **"Esporas"**.
- **Objetivo**: acelerar la creación de notas recurrentes (reuniones, diario, fichas) y
  mantener consistencia de formato en el vault.
- **Implementado en desktop** — spec en [[esporas-plantillas]], release en
  [[Version 1.3.0]]. Pendiente la confirmación del usuario en la app y el reflejo a web.
  Lo que se construyó: se valida el nombre **"Esporas"**. Cada
  plantilla es una **nota normal** en una carpeta del vault (`Esporas/` por defecto,
  configurable en Configuración → Vault). Admiten variables `{{titulo}}`, `{{fecha}}`,
  `{{hora}}` y `{{fecha:FORMATO}}` con tokens en español (`AAAA-MM-DD hh:mm`); un token
  desconocido se deja tal cual. **Se descartó el diálogo al crear una nota**: crear sigue
  siendo un clic, y la plantilla se elige por tres vías — panel del rail (un clic crea la
  nota), "Insertar Espora" en la barra del editor (única vía que sirve para notas ya
  existentes, y fusiona el frontmatter) y submenú "Nueva desde Espora" en el clic derecho
  del explorador. `FUN-M-07` (Daily Note) reutiliza la lista y la sustitución.

#### `FUN-M-04` · `METADATA-YAML` (C-I-07a) — 🛠️ desktop
- **Qué es**: manejar el frontmatter YAML al inicio de una nota (bloque entre `---`)
  como **propiedades** estructuradas (pares clave/valor), con un estilo visual propio en
  edición y lectura.
- **Objetivo**: dar a las notas atributos consultables (autor, fecha, estado, tags,
  imagen, etc.). Es la **base** de `FUN-L-03` (archivos tabla) y potencia búsqueda,
  filtros y el panel de metadatos ya existente.
- **Confirmado en desktop** el 2026-08-02 — spec en [[metadata-yaml]],
  release en [[Version 1.2.0]]. Se adopta el subconjunto de *Propiedades* de Obsidian
  (mapa plano; texto, número, casilla, fecha, fecha-hora y listas), con parser propio en
  `lib/frontmatter.ts` para poder editar sin reescribir el bloque. `tags` es la única
  clave con comportamiento (se une a los `#tag` del cuerpo); `aliases` y `cssclasses`
  quedan **reservadas sin comportamiento** → continuaciones `FUN-M-15` y `FUN-S-08`. Se
  editan en la pestaña **PROPIEDADES** del panel de la nota; el widget de la vista en
  vivo es de solo lectura. Lo que cae fuera del subconjunto se muestra crudo y **no se
  reescribe nunca**. Las propiedades se indexan en la tabla `propiedades` y se filtran
  desde el buscador con `clave:valor`.
- **Pendiente**: confirmación del usuario en la app y **reflejo a `web-cloud`** (el
  parseo, el render y el panel son compartidos; el índice diverge — allá toca el backend
  .NET). Ver [[Reflejar cambios de desktop a web]].

#### `FUN-M-11` · `VAULT-MYCIGNORE` (—) — 🛠️ desktop
- **Qué es**: un archivo `.mycignore` en la raíz de cada vault, con sintaxis tipo
  `.gitignore`, que decide qué archivos y carpetas **ignora Mycelium**. Antes la
  regla era fija (ignorar todo directorio que empiece con `.`); ahora eso es el
  **valor por defecto** (`.*/`) y el usuario puede cambiarlo por vault.
- **Objetivo**: poder ver en la app documentación que hoy queda oculta (p. ej.
  `.claude/`, `.github/`) o esconder carpetas de trabajo que no son notas — decisión
  del usuario, no del sistema.
- **Estado**: implementado en **desktop** (indexado + watcher + editor en
  Configuración → Vault; parser con tests). Spec: `docs/features/mycignore.md`.
- **Parte web (pendiente)**: en web no hay carpeta en disco (las notas viven en la
  DB), así que no hay árbol de archivos que ignorar al indexar. El equivalente sería
  (a) patrones de ignore al **importar** un vault de Obsidian — hoy `.obsidian/` está
  fijo — y (b) filtro de visualización del árbol, con la configuración guardada como
  preferencia del vault en el backend. **Requiere tocar el backend .NET.**

#### `FUN-M-12` · `VAULT-INDEX-PERF` (—) — 🛠️ desktop
- **Qué es**: la apertura de un vault grande tardaba porque el indexador hacía mucho
  más trabajo del necesario. Medido sobre este mismo repo usado como vault: 1830
  archivos indexados (1577 de `node_modules`), **14 MB por IPC en cada apertura**, 4020
  upserts de carpeta aunque no cambiara nada y ~11.340 statements SQL en frío, cada uno
  con su transacción implícita. Diagnóstico en
  [[Rendimiento de la apertura del vault]].
- **Qué entró** (cinco cambios): default de `.mycignore` con `node_modules/`, `target/`,
  `dist/` y `out/` · `listar_archivos_meta` sin `contenido` + comando nuevo
  `leer_archivos(rutas)` pedido en tandas de 250 · upsert de carpetas solo si son nuevas
  · `PRAGMA journal_mode=WAL` en el índice · `onProgress` conectado a la UI del selector
  de vaults.
- **Estado**: implementado en **desktop** (sin confirmar). Spec:
  `docs/features/rendimiento-apertura-vault.md`. Release: [[Version 1.1.1]] — **patch**,
  porque no agrega funcionalidad.
- **Solo desktop**: en web no hay carpeta que recorrer ni índice derivado; no hay nada
  que reflejar. Ver [[Diferencias funcionales aceptadas entre versiones]].
- **Continuaciones**: `FUN-M-13` (un solo recorrido), `FUN-M-14` (reindex dirigido por
  el watcher) y `FUN-L-10` (indexado en Rust).

#### `FUN-M-13` · `VAULT-INDEX-UN-RECORRIDO` (—)
- **Qué es**: `indexarVault` llama a `listar_archivos_meta` y a `listar_directorios`,
  que recorren **el mismo árbol dos veces** (4020 directorios × 2 en el vault medido).
  Fusionarlos en un comando que devuelva `{archivos, directorios}` de una pasada.
- **Objetivo**: la mitad del trabajo de disco por apertura. Quedó fuera de `FUN-M-12`
  por esfuerzo: cambia la firma de dos comandos y su llamador.
- **A definir**: si el comando nuevo reemplaza a los dos o convive con ellos (el watcher
  y otras rutas también los usan).

#### `FUN-M-14` · `VAULT-WATCH-REINDEX-DIRIGIDO` (—)
- **Qué es**: el watcher nativo emite `vault-cambios` **con las rutas afectadas**, pero
  `lib/vaultWatch.ts` las ignora y llama a `indexarVault(ruta)` entero. En un vault que
  además es un repo, un `npm install` desde la [[terminal-integrada]] dispara ráfagas y
  cada una paga el recorrido completo.
- **Objetivo**: reindexar solo lo que cambió. Probablemente buena parte de la lentitud
  percibida *después* de abrir viene de acá; `FUN-M-12` lo alivió pero no lo resolvió.
- **A definir**: cómo se agrupan las ráfagas y qué hacer con renombres/borrados de
  carpetas enteras (donde el reindex completo es más simple).

#### `FUN-M-15` · `LINKS-POR-ALIAS` (—)
- **Qué es**: que `[[Otro nombre]]` resuelva a la nota que declara `Otro nombre` en su
  propiedad `aliases`. Hoy `FUN-M-04` la parsea y la indexa como cualquier otra clave,
  pero **no tiene comportamiento**: quedó reservada a propósito.
- **Objetivo**: poder renombrar o referirse a una nota por varios nombres sin romper la
  memoria (es el mecanismo que en Obsidian evita los enlaces rotos por sinónimos).
- **Por qué es M y no S**: no alcanza con el parser — toca la **resolución** de wikilinks
  (`lib/editor/wikilink.ts`), el autocompletado de `[[`, el feedback de "archivo
  inexistente" y la construcción del grafo (`lib/db/grafo.ts` resuelve por título).
- **A definir**: qué gana si un alias colisiona con el título real de otra nota, y si el
  autocompletado ofrece el alias o el título.

### Pendientes — tamaño L

#### `FUN-L-01` · `MACROS-HOTKEYS` (C-I-05)
- **Qué es**: permitir configurar **macros** (secuencias de acciones) disparadas por
  atajos de teclado. Ejemplos de acciones: insertar un texto/snippet, crear un archivo a
  partir de una plantilla, abrir un archivo concreto, aplicar formato, etc.
- **Objetivo**: acelerar flujos repetitivos y personalizar Mycelium a la forma de
  trabajar de cada usuario (potenciar la productividad tipo "power user").
- **A definir**: catálogo de acciones disponibles; si las macros encadenan varias
  acciones o son 1:1; editor de atajos y prevención de conflictos. *Conviene acordar el
  alcance antes de encarar.*

#### `FUN-L-02` · `SHARING-PUBLICOS-GLOBALES` (C-I-06)
- **Qué es**: una carpeta **"Estado Mycelium"** con 3 archivos públicos para todos los
  usuarios: *Ayudas Mycelium*, *Bugs Mycelium* e *Ideas y Sugerencias Mycelium*.
  Cualquiera puede **verlos**; solo usuarios **autorizados** pueden editarlos. Aparecen
  en el apartado **Compartidos**.
- **Objetivo**: canal oficial dentro del propio producto para ayuda, reporte de bugs y
  recolección de ideas, visible para toda la comunidad de usuarios.
- **A definir**: modelo de permisos (quién es "autorizado"); si los usuarios pueden
  proponer/comentar o solo leer; naturaleza **web** (requiere backend + roles).

#### `FUN-L-03` · `FILES-BASES-TABLA` (C-I-07b)
- **Qué es**: un tipo de archivo nuevo (equivalente a las *Bases* de Obsidian —
  **hay que buscarle un nombre propio**) que **agrega** un conjunto de notas y muestra
  sus metadatos (`FUN-M-04`) en formato de **tabla**. Incluye filtros para elegir qué
  notas entran (por path, nombre, etiquetas, u otros atributos) y selección de qué
  columnas/parámetros mostrar (por defecto, solo el nombre).
- **Objetivo**: convertir el vault en algo consultable como una base de datos ligera
  (índices, catálogos, seguimientos) sin salir de Markdown.
- **A definir**: el nombre del tipo de archivo; sintaxis de filtros; vista de **tarjetas**
  queda fuera de alcance salvo que resulte barata.
- **Desbloqueada**: `FUN-M-04` ya dejó las propiedades indexadas en la tabla
  `propiedades` (una fila por elemento de lista, filtrable con `=`) y consultables desde
  `lib/db/propiedades.ts`. Es de ahí de donde leería la tabla.

#### `FUN-L-04` · `VAULT-MULTIPLE` (C-G-01)
- **Qué es**: que un usuario tenga varios vaults y pueda alternar entre ellos desde
  Configuración → Vault (lista de vaults, abrir/cerrar, marcar uno por defecto).
- **Objetivo**: separar contextos (trabajo, personal, proyectos) sin mezclar notas ni
  grafos.
- **Nota**: en **desktop** ya hay base (vaults en carpeta, entrar/salir; ver
  `docs/features/vault-en-carpeta.md`); falta pulir y llevarlo a **web**.
- **A definir**: en web, cómo se modela "varios vaults" por cuenta; límite; si se puede
  mover contenido entre vaults.

#### `FUN-L-05` · `IMPORT-ADJUNTOS` (HU-07/11)
- **Qué es**: un subsistema de **adjuntos** (imágenes, PDF, SVG, `.excalidraw` sueltos):
  almacenarlos, referenciarlos desde las notas (p. ej. `![[imagen.png]]`) y
  preservarlos al importar/exportar.
- **Objetivo**: hoy la importación de Obsidian omite los adjuntos, así que las notas con
  imágenes pierden contenido. Es la base para notas verdaderamente ricas.
- **A definir**: dónde se guardan (carpeta de adjuntos), límites de tamaño,
  deduplicación, y su relación con la capa de datos de cada versión.

#### `FUN-L-06` · `COLLAB-HISTORIAL-VERSIONES` (HU-37)
- **Qué es**: historial de cambios de una nota compartida, registrando **qué miembro**
  hizo cada cambio, con posibilidad de ver y restaurar versiones anteriores.
- **Objetivo**: trazabilidad y recuperación ante errores en trabajo colaborativo. Solo
  **web**.
- **A definir**: granularidad (por sesión, por intervalo), retención, y la UI para
  comparar/restaurar.

#### `FUN-L-07` · `TERMINAL-INTEGRADA` (—)
- **Qué es**: una consola **totalmente funcional y nativa** integrada en Mycelium, al
  estilo de la terminal de VS Code. No es una consola simulada: es la shell real del
  sistema, así que sirve para trabajar con el sistema de archivos del vault, gestionar
  un repositorio **git** si el vault lo es, o correr herramientas de línea de comandos
  (por ejemplo, usar **Claude Code** desde adentro de Mycelium). El directorio de
  trabajo inicial es la **raíz del vault**; si se abre desde el clic derecho sobre una
  carpeta del explorador, abre en la ruta de **esa carpeta**.
- **Cómo se integra**: un botón nuevo en la barra lateral de herramientas (el rail,
  donde está el botón del grafo general) abre la consola. La consola vive como una
  **pestaña más del workspace**: se puede mover de panel, dividir la pantalla con ella,
  y abrir **varias consolas** a la vez (cada una con su propia sesión).
- **Objetivo**: convertir a Mycelium en un entorno de trabajo completo para usuarios
  técnicos — versionar el vault con git, automatizar con scripts o asistentes de IA por
  terminal, sin salir de la aplicación.
- **Alcance por versión** (definido): **solo desktop**. Web no incluye esta
  funcionalidad — genera una diferencia funcional entre versiones y es aceptable/normal.
- **Persistencia de sesión** (definido): al reabrir la app se **restauran las
  terminales** como estaban — cantidad, posición (panel/pestaña) y **directorio de
  trabajo** de cada una; opcionalmente también el texto de la última sesión
  (*scrollback*) como historial. El **proceso** en sí no sobrevive al cierre (un
  programa corriendo muere al cerrar Mycelium; mantenerlo vivo requeriría procesos en
  segundo plano — fuera de alcance, igual que en VS Code). Esta restauración será
  **configurable** en Opciones (activarla/desactivarla; con o sin scrollback).
- **Shell por defecto** (definido): configurable en Opciones — se elige **qué shell se
  inicia** al abrir una terminal, estilo perfiles de VS Code — en Windows: PowerShell /
  cmd / Git Bash / WSL; en Unix: bash / zsh / fish. Si no se configura, se usa la shell
  del sistema.
- **Menú contextual** (definido): se incluye el ítem **"Abrir terminal aquí"** en el
  clic derecho de las carpetas del explorador — abre una terminal nueva con el
  directorio de trabajo en esa carpeta.
- **Selector por terminal** (definido): además del default, al abrir una terminal se
  puede elegir puntualmente **otra shell** para esa instancia (como el desplegable "+"
  de VS Code); las demás terminales siguen usando la shell por defecto.

#### `FUN-L-08` · `IA-FRAMEWORK-VAULT` (—) — 🛠️
- **Qué es**: un conjunto **versionado** de instrucciones para asistentes de IA por
  terminal (Claude Code) que se genera DENTRO del vault: `CLAUDE.md`, dos skills
  (`mycelium-vault` = sintaxis y exploración; `mycelium-memoria` = técnicas de
  recuperación y consolidación) y seis comandos (`/vault-buscar`, `/vault-recordar`,
  `/vault-mapa`, `/vault-vincular`, `/vault-huerfanas`, `/vault-nota`). Botón
  **opt‑in** en Configuración → Vault que genera/actualiza (muestra versión instalada
  vs disponible); `FRAMEWORK_IA_VERSION` evoluciona junto con Mycelium.
- **Eje**: el vault **es la memoria de largo plazo de la IA**, no un cajón de
  documentos. Se le imponen dos obligaciones: **recuperar antes de responder**
  (buscar en la red, expandir por backlinks, citar procedencia, admitir lo que no
  está) y **consolidar lo que valga recordar** (escribir autosuficiente, enlazado y
  sin duplicar). El `CLAUDE.md` incluye el mapa de **cuándo usar cada
  skill/comando**.
- **Objetivo**: que Mycelium sea el entorno de documentación de proyectos de IA: el
  asistente corre en la terminal integrada (`FUN-L-07`), usa la documentación como
  memoria persistente entre sesiones y la mantiene navegable (grafo) con las mismas
  convenciones que el usuario ve en la app.
- **Alcance actual** (definido): la IA **entiende**, no controla. Solo desktop
  (vault en carpeta). Spec: `docs/features/ia-framework-vault.md`.
- **Futuras extensiones del framework** (ideas):
  - Aviso automático al abrir un vault con framework desactualizado ("hay v1.1").
  - Comandos adicionales: `/vault-resumen` (responder con evidencia citando
    `[[notas]]`), `/vault-canvas` (generar `.excalidraw` desde texto), auditoría
    periódica estilo `/emerge`.
  - Integración con metadatos YAML (`FUN-M-04`) y archivos tabla (`FUN-L-03`)
    cuando existan: enseñar a la IA a consultarlos/llenarlos.
  - Plantillas Esporas (`FUN-M-03`) utilizables por la IA al crear notas.
  - Control de la app (abrir notas/grafo desde la IA) — versión posterior, junto a
    `FUN-L-09`.

#### `FUN-L-09` · `IA-MCP-MYCELIUM` (—)
- **Qué es**: un **servidor MCP** (Model Context Protocol) provisto por Mycelium que
  expone el vault a la IA como herramientas estructuradas: búsqueda en el índice,
  backlinks de una nota, vecindario del grafo, metadatos, tags. La IA deja de
  depender de `grep` sobre archivos y consulta el mismo índice que usa la app.
- **Objetivo**: respuestas más precisas y baratas (menos lectura bruta), y el paso
  previo natural a que la IA pueda **operar** Mycelium de forma controlada.
- **A definir**: transporte (stdio local), qué herramientas expone la v1, y cómo se
  registra en `.claude/` (el generador de `FUN-L-08` añadiría la config MCP).

#### `FUN-L-10` · `VAULT-INDEX-EN-RUST` (—)
- **Qué es**: mover el indexado del vault del frontend a **Rust**: que el walker lea los
  archivos y escriba el índice SQLite en el mismo proceso, en **una sola transacción**,
  sin que el contenido cruce el puente IPC.
- **Objetivo**: resolver de raíz lo que `FUN-M-12` mitigó desde el frontend. Es la única
  forma de tener una transacción real: `tauri-plugin-sql` 2.4.0 mantiene un
  `Pool<Sqlite>` de hasta 10 conexiones, así que un `BEGIN` desde JS puede acabar en una
  conexión y los `INSERT` en otra (ver [[Rendimiento de la apertura del vault]]).
- **A definir**: qué crate SQLite usa (el `sqlx` del plugin o `rusqlite` propio), cómo
  convive con el esquema que hoy declara `lib/db/indexer.ts`, y cómo reporta progreso al
  frontend (eventos Tauri).

#### `FUN-L-11` · `FILES-OTROS-TIPOS` (—)
- **Qué es**: que Mycelium deje de ignorar los archivos que no son `.md` ni
  `.excalidraw`. Hoy un PDF, un archivo de código o un `.txt` que estén en la carpeta del
  vault **no aparecen en el explorador** y no hay forma de verlos. Deberían listarse y
  abrirse en un visor propio, como una pestaña más del área de trabajo.
- **Objetivo**: que el vault sea la carpeta de trabajo completa y no haya que salir a otro
  programa para mirar un adjunto que ya está ahí.
- **Es L porque cruza todas las capas**: el indexador decide hoy qué extensiones entran;
  el explorador y el árbol asumen dos tipos (`markdown`/`excalidraw`, ver `NotaTipo`); el
  sistema de pestañas y panes tiene que saber renderizar algo que no es un editor; y en
  **web** los archivos viven en el backend, así que servir un PDF o un binario es trabajo
  aparte del de desktop.
- **Decidido** (usuario, 2026-08-03):
  - **Nada se oculta por no tener visor.** Los tipos que Mycelium no sabe mostrar se
    listan igual en el explorador, **atenuados en gris**. El usuario tiene que ver que el
    archivo está ahí.
  - **Abrirlos abre una pestaña igual**, y esa pestaña dice que el documento no se puede
    visualizar. Ni un error, ni un clic que no hace nada.
  - **`.mycignore` sigue mandando.** Ver el callout de abajo.
- **A definir**: qué tipos tienen visor propio en la primera versión; si los PDF se
  muestran embebidos o se delegan al sistema operativo; y qué se hace con un binario muy
  grande (abrirlo o avisar antes).
- **Relación**: `FUN-S-09` (resaltado de sintaxis) depende de esta; `FUN-S-03` (mostrar la
  extensión) se vuelve prácticamente necesaria en cuanto el explorador lista PDF, código y
  texto plano; `FUN-L-05` (adjuntos en la importación) toca el mismo terreno desde el otro
  lado.

> [!warning] Soportar un tipo **no** es motivo para saltarse `.mycignore`
> Que Mycelium aprenda a leer y mostrar un tipo de archivo no lo exime de la regla del
> usuario: lo que esté ignorado en `.mycignore` **sigue sin aparecer**, tenga visor o no.
> Son dos preguntas distintas — *¿sé mostrarlo?* y *¿el usuario quiere verlo?*— y la
> segunda gana siempre. Es una tentación real al implementar esto ("ya que soportamos PDF,
> indexémoslos todos"): no. Ver [[mycignore]].

#### `FUN-L-12` · `EDITOR-CORRECTOR-ORTOGRAFICO` (—)
- **Qué es**: subrayar las palabras mal escritas mientras se escribe, con la posibilidad
  de activarlo o desactivarlo en Configuración. Debe admitir **varios idiomas a la vez**
  (una palabra es correcta si lo es en alguno de los activos) y estar construido para
  sumar idiomas después, no solo español.
- **Objetivo**: escribir en el vault sin errores tipográficos, y sin que un vault
  bilingüe se llene de subrayados falsos.
- **A definir**: de dónde salen los diccionarios y con qué motor (un Hunspell en Rust del
  lado desktop, o algo en JS que sirva también a web); cómo se descargan/empaquetan sin
  inflar el instalador; si hay diccionario personal del usuario ("añadir palabra"); si
  ofrece sugerencias al hacer clic derecho o solo marca; y qué pasa con el código, las
  URLs y los `[[enlaces]]`, que no deben corregirse.
- **Ojo con el rendimiento**: es análisis sobre el texto en vivo dentro de CodeMirror.
  Vale la advertencia de [[CodeMirror y la vista en vivo]] sobre decorar documentos largos.

#### `FUN-L-13` · `UI-IDIOMAS` (—)
- **Qué es**: que la interfaz se pueda ver en **español, inglés e italiano**, elegible en
  Configuración, y que agregar un idioma nuevo sea sumar un archivo de traducción y no
  tocar componentes.
- **Objetivo**: que Mycelium no dependa de saber español.
- **Es L por volumen, no por dificultad**: hoy **todos** los textos están escritos en
  español directamente dentro de los componentes. Hay que extraerlos a claves, montar la
  capa de traducción y revisar cada pantalla. Mecánico, pero toca casi todo el frontend.
- **Decidido** (usuario, 2026-08-03): **se traduce la interfaz y nada más**. No se tocan
  los documentos del usuario ni lo que produce la IA sobre el vault — el framework
  (`FRAMEWORK_IA_VERSION`) genera texto en el idioma del vault, no en el de la interfaz, y
  cambiar el idioma de la UI no debe alterar una sola letra del contenido.
- **A definir**: qué librería (o si alcanza un diccionario propio, dado que no hay SSR en
  desktop); cómo se manejan plurales y fechas; y si el idioma sale del sistema operativo
  la primera vez.

#### `FUN-L-14` · `UPDATER-AUTOACTUALIZACION` (—)
- **Qué es**: que Mycelium avise, una vez al día en el primer arranque, de que hay una
  versión nueva; muestre **qué trae** y ofrezca instalarla con un clic. Nunca obliga, nunca
  bloquea y sin conexión no dice nada.
- **Objetivo**: hoy publicar es compilar, hacer llegar el instalador y que el usuario
  reinstale a mano — y no tiene forma de enterarse de que existe una versión nueva.
- **Spec completa**: [[autoactualizacion]]. Decisiones ya tomadas: plugin oficial
  `tauri-plugin-updater` (descarga, verifica firma, instala), **Cloudflare R2** con
  manifiesto estático, changelog en Markdown renderizado en el propio diálogo, y tres
  salidas — actualizar, más tarde, omitir esta versión.
- **Es `L` y no `XL`** aunque toque la nube: no hay rearquitectura ni cambia dónde viven los
  datos; la parte de infraestructura es un bucket con archivos estáticos. Lo que sí es nuevo
  es el **compromiso operativo**: un bucket que mantener y una clave privada que custodiar
  de por vida.
- **A definir**: si se usa un dominio propio delante del bucket o se arranca con la URL
  `r2.dev` (**no bloquea**: se puede empezar sin dominio y migrar después; ver la spec) y
  dónde vive la copia de seguridad de la clave privada.
- **Implementado** en [[Version 1.4.0]] (2026-08-03), junto con `FUN-M-16`. Lo que decía
  "a definir" **sigue sin definirse y ahora es lo único que falta**: el código está y
  degrada con elegancia sin claves, pero hasta que exista el bucket y la clave de firma el
  circuito real no se ha ejecutado ni una vez. Los pasos, en [[Publicar una version]] § 1.

#### `FUN-L-15` · `RELEASE-SCRIPT-PUBLICACION` (—)
- **Qué es**: un `npm run publicar` que haga de una sola vez lo que `FUN-L-14` deja como
  cuatro pasos manuales: compilar, firmar, subir el instalador y su `.sig` a R2 con
  `wrangler`, y reescribir `latest.json` y `versions.json`.
- **Objetivo**: que publicar no dependa de recordar una secuencia, donde un `.sig` mal
  pegado o una URL equivocada rompe la actualización de **todos** los usuarios a la vez.
- **Script local, no CI** (decisión del usuario, 2026-08-03): el workflow que ya existe
  parecía el camino natural, pero arrastra una decisión ajena a esta funcionalidad —obliga a
  alinear `origin`, hoy 204 commits por detrás y público (ver [[RAMAS]])— y exige meter la
  clave privada de firma como secreto de GitHub. El script consigue lo que importa sin tocar
  el remoto y sin que la clave salga de la máquina.
- **Lo que estaba "a definir", resuelto al implementarlo (2026-08-03)**:
  - **No** publica las versiones anteriores que están en `installers/`. Nunca hizo falta:
    solo la `1.4.0` en adelante puede autoactualizarse, y las anteriores no tienen manifiesto
    ni firma que subir.
  - Si `wrangler` no está instalado o no está autenticado, **falla en las comprobaciones
    previas** con el comando exacto que hay que ejecutar. Todo lo que puede fallar se
    comprueba **antes de compilar**: descubrir que falta una variable de entorno después de
    diez minutos de `tauri build` es el peor momento posible.
- **Implementado** (2026-08-03, sin confirmar). Además de lo pedido, el script **verifica lo
  publicado**: que los tres JSON respondan y parseen, que la firma del manifiesto sea la del
  `.sig` generado y que el `.exe` **descargado del bucket** tenga el mismo SHA-256 que el que
  se firmó — la única comprobación que atrapa una subida truncada, que a la vista deja un
  archivo perfectamente válido y solo falla cuando un usuario intenta actualizar. Tiene
  `--simulacro` (todo menos subir), `--sin-compilar` (rehacer un manifiesto sin esperar diez
  minutos) y `--forzar` (republicar encima de una versión existente, que por defecto aborta).
  El changelog sale de una sección delimitada de la nota de release. Todo en
  [[Publicar una version]] § 2.
- **Dependía de `FUN-L-14`**: primero el circuito a mano, comprobado de extremo a extremo.
  Se respetó el orden — la `1.4.0` se publicó a mano el 2026-08-03 y recién después se
  automatizó lo que ya se sabía que funcionaba.

> [!note] Lo que se pierde al no usar CI, para tenerlo presente
> El instalador sale de la compilación local en vez de una máquina limpia, y se renuncia a
> generar de paso las versiones de Linux y macOS que el workflow sabe construir y que hoy
> nadie compila. Ninguna de las dos cosas es un problema hoy: solo se distribuye Windows y
> la compilación local ya es la que se viene usando.

### Pendientes — tamaño XL

#### `FUN-XL-01` · `STORAGE-LOCAL-FIRST-NUBE` (C-G-03)
- **Qué es**: rearquitectura del almacenamiento en **desktop** hacia un modelo
  *local‑first*: los markdowns y archivos viven en local y hay un botón para **guardar
  en la nube a conciencia** (nunca automático). Los archivos **compartidos** sí se
  suben y actualizan solos contra la nube (manejando datos temporales).
- **Objetivo**: reducir tiempos de espera y mejorar la velocidad de uso; reducir el uso
  del servidor y, por ende, los costos.
- **A definir**: qué se sincroniza y cuándo; resolución de conflictos local↔nube;
  interacción con `FUN-XL-03`. Impacto **major**.

#### `FUN-XL-02` · `COLLAB-REALTIME` (HU-05/06/37)
- **Qué es**: edición **simultánea en tiempo real** de notas compartidas, con
  cursores/presencia de cada participante. La arquitectura ya está preparada (CRDT);
  falta el relay en la nube.
- **Objetivo**: colaboración fluida tipo documento en vivo sobre las notas compartidas.
  Solo **web**; depende de `FUN-XL-03`.
- **A definir**: activación y despliegue del relay; ver también `FUN-S-07`.

#### `FUN-XL-03` · `INFRA-CLOUDFLARE` (—)
- **Qué es**: integrar el backend con Cloudflare — D1 (datos), R2 (blobs) y Durable
  Objects (colaboración). Hoy son adaptadores stub y todo corre en modo local.
- **Objetivo**: habilitar la nube real (persistencia gestionada, escalado, colaboración)
  para la versión **web**. Es prerequisito de la colaboración en tiempo real y del
  guardado en nube.
- **A definir**: alcance del despliegue, costos y migración de datos local → nube.

### Diferidas — mejoras M/S

#### `FUN-M-05` · `TAGS-PANEL` (HU-28)
- **Qué es**: el ícono de tags del rail abre un panel con todos los tags del vault, su
  conteo de uso, y al hacer clic filtra/lista las notas que lo usan. Hoy es un
  placeholder.
- **Objetivo**: navegar el vault por temas/etiquetas, no solo por carpetas.
- **A definir**: soporte de tags anidados (`#a/b`); orden (alfabético o por frecuencia).

#### `FUN-M-06` · `TAGS-GRAFO-NODOS` (HU-30)
- **Qué es**: mostrar los tags como **nodos** del grafo (mini y global), conectados a
  las notas que los usan.
- **Objetivo**: visualizar agrupaciones temáticas y cómo un tag "puentea" notas que no
  están enlazadas directamente.
- **A definir**: estilo diferenciado para nodos‑tag; opción para mostrarlos/ocultarlos.

#### `FUN-M-07` · `DAILY-NOTE` (HU-28)
- **Qué es**: el ícono de calendario del rail crea/abre la **nota del día** (una nota por
  fecha), opcionalmente a partir de una plantilla (`FUN-M-03`). Hoy es placeholder.
- **Objetivo**: registro diario / bitácora rápida (journaling), un patrón central en
  herramientas tipo Obsidian.
- **Ya tiene de dónde tomar la plantilla**: `FUN-M-03` ([[Version 1.3.0]]) dejó hechas las
  dos mitades que esta unidad necesitaba. `lib/esporasVault.ts` lista las Esporas de la
  carpeta configurada y crea una nota a partir de una (`crearNotaDesdeEspora`), y
  `lib/esporas.ts` sustituye `{{titulo}}`, `{{fecha}}`, `{{hora}}` y `{{fecha:FORMATO}}`
  — que es exactamente lo que hace falta para nombrar la nota del día y rellenarla. Lo que
  queda es la preferencia de qué Espora usar, la carpeta destino y el formato del nombre.
- **A definir**: formato de nombre/fecha, carpeta destino y plantilla por defecto.

#### `FUN-M-08` · `LINKS-REESCRITURA-RENOMBRAR` (HU-23)
- **Qué es**: al renombrar una nota, actualizar automáticamente todos los `[[enlaces]]`
  que apuntaban a su título anterior para que sigan apuntando a ella.
- **Objetivo**: evitar enlaces rotos al reorganizar el vault; hoy renombrar deja los
  enlaces viejos colgando.
- **A definir**: alcance (títulos, alias, embeds `![[ ]]`); si es automático o pide
  confirmación mostrando cuántos enlaces cambiarían.

#### `FUN-M-09` · `EXPORT-ZIP-SERVIDOR` (HU-09)
- **Qué es**: para vaults muy grandes (≈ ≥ 200 MB), delegar la generación del ZIP al
  **servidor** con indicador de progreso, en vez de hacerla 100% en el cliente.
- **Objetivo**: evitar que el navegador se sature o agote memoria con vaults grandes.
  Solo **web** (el desktop exporta a carpeta nativa).
- **A definir**: umbral exacto, indicador de progreso y entrega del resultado.

#### `FUN-M-10` · `AUTH-OAUTH-GITHUB` (HU-32)
- **Qué es**: agregar "Iniciar sesión con GitHub" además de email + contraseña.
- **Objetivo**: login más rápido y sin gestionar otra contraseña. Solo **web** (el
  desktop es local, sin login).
- **A definir**: requiere registrar una OAuth App de GitHub y credenciales; cómo se
  vincula la cuenta de GitHub con el usuario de Mycelium.

#### `FUN-S-07` · `COLLAB-PRESENCIA-AJUSTES` (HU-06)
- **Qué es**: afinar detalles de la presencia en edición colaborativa: cuánto tiempo
  permanece visible el cursor de otro usuario tras su inactividad (hoy 5 s) y a partir de
  cuántos cursores se agrupan como "+N más" (hoy 8).
- **Objetivo**: que la presencia se sienta natural — ni cursores "fantasma" ni saturación
  visual en notas muy concurridas. Solo **web**.
- **A definir**: los valores finales; si se exponen como configuración.

### Con errores / a ajustar

#### `FUN-S-06` · `EDITOR-CALLOUT-TITULO-COLOR` (C-M-04) — 🟡
- **Qué es**: el título de un callout debe conservar el **color de su etiqueta** (el
  color representativo del tipo, p. ej. *question*). Bug actual: cuando el título lleva
  otro estilo (negrita, cursiva, color propio, link), ese estilo se pierde y se fuerza
  el color del callout.
- **Objetivo**: que el color de la etiqueta se aplique **solo** cuando el título no tiene
  otro elemento con estilo propio; si lo tiene, respetar ese estilo.
- **A definir**: prioridad exacta cuando conviven varios estilos en el título.

---

## 6. Notas de reconciliación

- **IDs originales duplicados**: en `Ideas Mycelium.md` el código `C-M-12` estaba usado
  **dos veces** — para "añadir extensiones de archivos" (hoy `FUN-S-03`) y para
  "persistencia de pestañas" (hoy implementado, `TABS-PERSISTENCIA`).
- **Ítems ya implementados que el antiguo `FUTURE_IMPLEMENTATIONS.md` listaba como
  pendientes**: la **persistencia de pestañas/splits al recargar** (`TABS-PERSISTENCIA`,
  el store usa `persist`) y el **pinning de pestañas** (`TABS-PINNING`, `pinTab` +
  pestañas de preview). Ya reflejados como 🟢 en §4.
- **`FUTURE_IMPLEMENTATIONS.md` eliminado**: su contenido quedó consolidado en este
  backlog (§3). Las referencias de otros documentos se repuntaron a `BACKLOG.md`.

---

## 7. Agrupación en releases

Cada bloque de abajo es **un release candidato**: lo que conviene trabajar junto porque
comparte subsistema, diseño o código, de modo que hacerlo por separado significaría
tocar los mismos archivos dos veces y probar lo mismo dos veces.

> [!important] Esto NO es un orden de trabajo
> No hay prioridad implícita: el orden lo decide el usuario cuando toque. Por eso
> **ningún bloque lleva número de versión** — el número depende de cuándo salga, no de
> qué contiene. Lo que sí se puede saber de antemano es **qué dígito** movería, y eso sí
> está anotado (ver [[Versionado del sistema]]).
>
> Y no se agrupa por agrupar: lo que no tiene parentesco real **va solo**, aunque sea
> pequeño. Un release de una sola unidad es perfectamente válido.

### Bloques

#### A · Abrir el vault: rendimiento y feedback — `FUN-M-13` + `FUN-M-14` + `FUN-L-10` + `DEF-042` · patch · desktop
Las tres `FUN-*` son continuaciones de `FUN-M-12` sobre el mismo recorrido: walker en
Rust, indexador en TS y watcher. **`FUN-L-10` absorbe a `FUN-M-13`**: si el indexado
entero se mueve a Rust, el doble recorrido desaparece solo — hacerlas separadas es trabajo
tirado. Ninguna agrega capacidad: el usuario obtiene lo mismo, más rápido → **patch**.

**`DEF-042` entra acá** aunque sea un defecto: la pantalla de carga que pide es la salida
visible de este mismo código. El progreso lo emite `indexarVault` por su `onProgress`, que
es justo lo que `FUN-L-10` va a reescribir para que lo emita Rust por eventos. Arreglar el
feedback antes y volver a tocarlo después sería hacerlo dos veces — y al revés, mover el
indexado sin rehacer la pantalla dejaría el defecto vivo.
Ver [[Rendimiento de la apertura del vault]].

#### B · Etiquetas — `FUN-M-05` + `FUN-M-06` · minor · ambas
Las dos necesitan lo mismo y hoy inexistente: una **agregación de etiquetas del vault**
(qué etiquetas hay, cuántas notas cada una). Esa es la parte difícil y es compartida; el
panel del rail y los nodos del grafo son la superficie. Además `FUN-M-04` ya dejó las
etiquetas del frontmatter unidas a las del cuerpo (`etiquetasDe`), así que el insumo está.
*Alternativa razonable*: llevar `FUN-M-06` al bloque del grafo (`FUN-M-02`) si al
diseñarlo pesa más el dibujado que la agregación.

#### C · Los enlaces dejan de romperse — `FUN-M-08` + `FUN-M-15` · minor · ambas
Las dos cambian **a qué apunta un `[[enlace]]`** y obligan a tocar la misma capa:
resolución de wikilinks, autocompletado y grafo. `FUN-M-08` reescribe los enlaces al
renombrar; `FUN-M-15` los resuelve por `aliases`. Separadas, esa capa se toca dos veces.

#### D · Papelera — `FUN-S-04` + `FUN-M-01` · minor · ambas
Mismo panel, misma sesión de trabajo: seleccionar varios para borrar y previsualizar
antes de decidir. Las dos existen por el mismo motivo — decidir con información y sin
ir de a uno.

#### E · Estilos propios al renderizar markdown — `FUN-S-01` + `FUN-S-06` 🟡 · minor · ambas
Las dos son la misma pregunta: **cuándo un elemento conserva su estilo propio y cuándo
gana el del contenedor**. `FUN-S-01` da estilo al checkbox según su símbolo; `FUN-S-06`
corrige que el título de un callout pierda su formato. Comparten `lib/markdown.ts`,
`livePreview.ts` y `editor.css`. El minor de `FUN-S-01` **absorbe** la corrección.

#### F · Gestión de vaults — `FUN-S-05` + `FUN-L-04` · minor · ambas
Las dos son el ciclo de vida del vault: tener varios y poder alternar (`FUN-L-04`) y qué
encuentra el usuario al crear uno nuevo (`FUN-S-05`). El archivo de ejemplo solo tiene
sentido en el flujo de creación que `FUN-L-04` va a tocar igual.

#### G · Poner la web al día — reflejos pendientes · minor · **web**
El reflejo de `FUN-M-03` (Esporas) y `FUN-M-04` (metadatos YAML) más la **parte web de
`FUN-M-11`** (`.mycignore`, que necesita decidir su semántica y tocar el backend .NET).
Van juntas porque es **una sola sesión de trabajo**: un worktree de `web-cloud`, la misma
receta de [[Reflejar cambios de desktop a web]] y una única verificación con
`npm ci` + `tsc` + `next build`. Sube la versión **de web**, no la de desktop.

#### H · Identidad y permisos — `FUN-M-10` + `FUN-L-02` · minor · **web**
`FUN-M-10` resuelve *quién sos* (login con GitHub) y `FUN-L-02` *qué podés* (carpeta
pública con contenido editable solo por autorizados). El modelo de roles que necesita
`FUN-L-02` se apoya en la identidad que trae `FUN-M-10`; al revés no tiene sentido.

#### J · El vault deja de ser solo markdown — `FUN-L-11` + `FUN-S-09` + `FUN-S-03` · minor · ambas
`FUN-S-09` **no existe sin** `FUN-L-11`: sin visor de código no hay nada que colorear.
Y al revés, un visor de código sin resaltado es un `<pre>` gris que nadie va a querer usar,
así que separarlas obliga a entregar media funcionalidad. Además el motor de resaltado se
elige **al construir el visor**, no después.

`FUN-S-03` (mostrar la extensión de los archivos no markdown) **se sumó acá el 2026-08-03**,
al decidirse que los tipos sin visor se listan en gris en vez de ocultarse: en cuanto el
explorador muestra PDF, código y texto plano —soportados o no—, la extensión deja de ser
un detalle cómodo y pasa a ser la única forma de distinguirlos. Estaba clasificada como
acompañante suelta y ahora tiene un parentesco real.

#### L · Distribución — `FUN-L-14` + `FUN-M-16` + `FUN-L-15` · minor · desktop
`FUN-M-16` (elegir versión, incluida una anterior) reutiliza **todo** lo de `FUN-L-14`: el
mismo bucket, la misma clave, el mismo diálogo de confirmación y el mismo verificador de
firma. Solo suma un índice `versions.json` y la interfaz escondida. Hacerla aparte
significaría volver a entrar en el mismo código semanas después.

`FUN-L-15` automatiza en un script local exactamente los pasos que `FUN-L-14` introduce a
mano (firmar, subir a R2, escribir los dos JSON), sobre el mismo bucket, la misma clave y el
mismo formato de manifiesto. Van juntas en el sentido de que se diseñan juntas — pero **se
entregan en ese orden**: primero el circuito a mano, y solo cuando está comprobado de
extremo a extremo se automatiza. Automatizar un proceso que todavía no se sabe si funciona
es multiplicar el fallo, y acá un fallo rompe la actualización de todos los usuarios a la vez.
*Si el bloque se hace muy grande*, `FUN-L-14` sola ya es entregable y útil.

**El bloque está completo** (2026-08-03): `FUN-L-14` y `FUN-M-16` salieron en
[[Version 1.4.0]], esa versión se publicó a mano para comprobar el circuito de punta a punta,
y con eso comprobado se implementó `FUN-L-15`. El orden previsto se cumplió tal cual.

#### K · Idiomas — `FUN-L-12` + `FUN-L-13` · minor · ambas
Las dos introducen la misma noción, que hoy no existe: **qué idiomas conoce Mycelium**.
`FUN-L-13` traduce la interfaz y `FUN-L-12` corrige la ortografía del texto del usuario —
distintas por dentro, pero comparten el registro de idiomas disponibles, el selector de
Configuración y la decisión de qué idiomas se soportan, que conviene contestar una sola
vez.
*Son separables*: si una de las dos se vuelve urgente sola, no hay dependencia técnica
que lo impida. Lo que se pierde es diseñar dos veces el mismo selector.

#### I · Colaboración real — `FUN-XL-03` + `FUN-XL-02` + `FUN-L-06` + `FUN-S-07` · major · **web**
`FUN-XL-03` (D1/R2/Durable Objects) es **prerrequisito duro** de `FUN-XL-02`: sin Durable
Objects no hay edición simultánea. `FUN-L-06` (historial de quién cambió qué) y
`FUN-S-07` (afinar presencia) son parte de la misma experiencia y carecen de sentido
sueltas. Es rearquitectura → **major**.

### Van solas

No tienen parentesco suficiente con nada: cada una es su propio release.

| ID | Por qué va sola | Dígito |
|---|---|---|
| `FUN-L-03` `FILES-BASES-TABLA` | Tipo de archivo nuevo y subsistema propio. Ya está desbloqueada (`FUN-M-04` hecho); consumirla no la emparenta con sus continuaciones | minor |
| `FUN-L-09` `IA-MCP-MYCELIUM` | Único pendiente de la línea de IA; `FUN-L-07` y `FUN-L-08` ya salieron | minor |
| `FUN-L-01` `MACROS-HOTKEYS` | Capa transversal de comandos: no comparte código con ninguna funcionalidad concreta | minor |
| `FUN-L-05` `IMPORT-ADJUNTOS` | Subsistema de importación, aislado del resto | minor |
| `FUN-M-02` `GRAPH-BUSCADOR-FILTRO` | Solo toca el grafo (ver la alternativa del bloque B) | minor |
| `FUN-M-07` `DAILY-NOTE` | Ya tiene todo lo que necesitaba: `FUN-M-03` le dio plantillas y sustitución de variables | minor |
| `FUN-M-09` `EXPORT-ZIP-SERVIDOR` (web) | Exportación en servidor; independiente de identidad y de colaboración | minor |
| `FUN-XL-01` `STORAGE-LOCAL-FIRST-NUBE` | Rearquitectura de almacenamiento del desktop. Necesita que exista infraestructura de nube, pero es trabajo aparte del bloque I | major |

### Las dos que pueden viajar de acompañantes

`FUN-S-02` (ancho de tabulación) y `FUN-S-08` (`cssclasses`) no tienen parentesco con nada,
pero son **de un archivo y un rato**. Forzarles un bloque sería agrupar por agrupar; darles
un release propio a cada una es correcto pero desproporcionado. Lo natural es que **se
sumen a cualquier release que ya esté saliendo**: las dos aportan capacidad nueva (minor),
así que quedan absorbidas por cualquier bloque de su tamaño o mayor.

*(`FUN-S-03` estaba acá y pasó al bloque J el 2026-08-03: al listarse los archivos sin
visor, ver la extensión dejó de ser un extra.)*

> [!note] Lo que no entra en esta agrupación
> **Defectos**: solo hay uno abierto, `DEF-042`, y está en el bloque A. Los otros 23
> `DEF-*` están implementados; `DEF-039`, `DEF-040` y `DEF-041` esperan confirmación en la
> app, que es verificación y no trabajo pendiente. Ver [[bugs-progreso]].
> **`FUN-M-11`** aparece solo en el bloque G porque su parte desktop ya está hecha.

---

## Relacionadas

- [[Mapa de documentacion]] — índice general de la documentación.
- [[Estado del proyecto]] — qué de este backlog ya está hecho y qué sigue.
- [[Versionado del sistema]] — cómo se traduce el tamaño (`S/M/L/XL`) en versiones.
- [[Ideas Mycelium]] — las notas originales del usuario que dieron origen a esta lista.
- [[Diferencias funcionales aceptadas entre versiones]] — por qué algunas entradas son de una sola versión.
- [[Mycelium como memoria de la IA]] — el objetivo detrás de `FUN-L-07`, `FUN-L-08` y `FUN-L-09`.
- [[Rendimiento de la apertura del vault]] — el diagnóstico detrás de `FUN-M-12` y sus continuaciones.
- [[Version 1.1.1]] — el release donde salió `FUN-M-12`.
