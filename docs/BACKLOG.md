# Backlog de funcionalidades — Mycelium

Consolidación de las ideas de [`Ideas Mycelium.md`](Ideas%20Mycelium.md) y de las
implementaciones diferidas (antes en `FUTURE_IMPLEMENTATIONS.md`, ahora integradas
aquí — ese documento fue eliminado), con **IDs numeradas por tamaño** y un **nombre
descriptivo**. El objetivo es planificar el **versionado** (qué entra en cada release)
y **priorizar** qué implementar antes.

> Este documento no reemplaza a `Roadmap general.md` (roadmap de HUs del producto);
> es el backlog vivo de mejoras/ideas post‑1.0.

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
| Funcionalidad nueva compatible (S/M/L) | **minor** (`1.x.0`) |
| Rearquitectura / cambio de almacenamiento / nube (XL) | **major** (`x.0.0`) |

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

### 1.2 Intermedias — tamaño M

| ID | Nombre | Descripción | Aplica | Orig. |
|---|---|---|---|---|
| `FUN-M-01` | `TRASH-PREVIEW` | Visualizar el contenido de los archivos en la papelera | ambas | C-M-13 |
| `FUN-M-02` | `GRAPH-BUSCADOR-FILTRO` | Buscar por nombre en el grafo: atenúa los nodos que no coinciden | ambas | C-I-03 |
| `FUN-M-03` | `TEMPLATES-ESPORAS` | Plantillas ("Esporas") para crear notas rápido: botón en el rail + selección de plantilla al crear archivo | ambas | C-I-04 |
| `FUN-M-04` | `METADATA-YAML` | Manejar metadatos YAML (frontmatter `---`) de las notas (prerequisito de `FUN-L-03`) | ambas | C-I-07a |

### 1.3 Grandes — tamaño L

| ID | Nombre | Descripción | Aplica | Orig. |
|---|---|---|---|---|
| `FUN-L-01` | `MACROS-HOTKEYS` | Configurar acciones de Mycelium por macros/atajos (escribir, crear con plantilla, abrir, etc.) | ambas | C-I-05 |
| `FUN-L-02` | `SHARING-PUBLICOS-GLOBALES` | Carpeta "Estado Mycelium" con 3 archivos públicos (Ayudas / Bugs / Ideas): editables por autorizados, visibles por todos | web | C-I-06 |
| `FUN-L-03` | `FILES-BASES-TABLA` | Tipo de archivo tipo "bases" (tabla) que agrega notas por metadatos, con filtros y columnas configurables. Depende de `FUN-M-04` | ambas | C-I-07b |
| `FUN-L-04` | `VAULT-MULTIPLE` | Un usuario con varios vaults, seleccionables en Configuración → Vault | ambas | C-G-01 |
| `FUN-L-07` 🛠️ | `TERMINAL-INTEGRADA` | Consola nativa integrada (estilo VS Code): abre en la raíz del vault (o en la carpeta elegida), como pestaña normal del workspace (dividir, varias instancias). **Implementada** (sin confirmar); spec en `docs/features/terminal-integrada.md` | desktop | — |

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

#### `FUN-M-03` · `TEMPLATES-ESPORAS` (C-I-04)
- **Qué es**: plantillas reutilizables para crear notas ya con una estructura base. Un
  botón nuevo en el rail izquierdo permite ver/gestionar (crear, editar, borrar) las
  plantillas. Al crear un archivo, aparece un menú (como el de crear carpeta) con el
  nombre (por defecto "nuevo archivo") y un selector de plantilla (por defecto
  "ninguna"). Nombre propuesto para las plantillas: **"Esporas"**.
- **Objetivo**: acelerar la creación de notas recurrentes (reuniones, diario, fichas) y
  mantener consistencia de formato en el vault.
- **A definir**: validar el nombre "Esporas"; si las plantillas admiten variables
  (fecha, título); dónde se almacenan; relación con `FUN-M-07` (Daily Note usaría una).

#### `FUN-M-04` · `METADATA-YAML` (C-I-07a)
- **Qué es**: manejar el frontmatter YAML al inicio de una nota (bloque entre `---`)
  como **metadatos** estructurados (pares clave/valor), con un estilo visual propio en
  edición y lectura. Hoy Mycelium no interpreta ese bloque.
- **Objetivo**: dar a las notas atributos consultables (autor, fecha, estado, tags,
  imagen, etc.). Es la **base** de `FUN-L-03` (archivos tabla) y potencia búsqueda,
  filtros y el panel de metadatos ya existente.
- **A definir**: qué claves son "conocidas" vs libres; cómo se muestran/editan;
  validación mínima del YAML.

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
  queda fuera de alcance salvo que resulte barata. Depende de `FUN-M-04`.

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

## 7. Propuesta de secuenciado por versiones (borrador a acordar)

Tentativo, ordenado por relación valor/esfuerzo (primero las S). **A definir juntos.**

- **`1.0.x` (patch)** — correcciones: `FUN-S-06` (`EDITOR-CALLOUT-TITULO-COLOR`).
- **`1.1.0` (minor)** — quick wins S: `FUN-S-01`, `FUN-S-02`, `FUN-S-03`, `FUN-S-04`, `FUN-S-05`.
- **`1.2.0` (minor)** — M: `FUN-M-02` (grafo buscador), `FUN-M-03` (Esporas), `FUN-M-04` (YAML),
  `FUN-M-01` (preview papelera), `FUN-M-05` (tags panel), `FUN-M-07` (daily note).
- **`1.3.0`+ (minor)** — L: `FUN-L-03` (bases/tablas), `FUN-L-01` (macros),
  `FUN-M-08` (reescritura de enlaces), `FUN-L-05` (adjuntos), `FUN-L-04` (vaults múltiples),
  `FUN-L-02` (públicos globales), `FUN-L-07` (terminal integrada).
- **`2.0.0` (major)** — XL / rearquitectura y nube: `FUN-XL-01` (storage local‑first),
  `FUN-XL-03` (Cloudflare), `FUN-XL-02` (colaboración en tiempo real).
