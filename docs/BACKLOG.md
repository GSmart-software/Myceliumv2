# Backlog de funcionalidades — Mycelium

Consolidación de las ideas de [`Ideas Mycelium.md`](Ideas%20Mycelium.md) y de las
implementaciones diferidas (antes en `FUTURE_IMPLEMENTATIONS.md`, ahora integradas
aquí — ese documento fue eliminado), con **IDs descriptivas** y **clasificación por
tamaño**. El objetivo es planificar el **versionado** (qué entra en cada release) y
**priorizar** qué implementar antes.

> Este documento no reemplaza a `Roadmap general.md` (roadmap de HUs del producto);
> es el backlog vivo de mejoras/ideas post‑1.0.

## Cómo leerlo

- **ID descriptiva**: `AREA-CONCEPTO` (estable, para referenciar en commits/PRs). Se
  conserva el **ID original** de `Ideas Mycelium.md` para cruzar con tus notas.
- **Tamaño** (complejidad/esfuerzo, no prioridad):
  - **S** — pequeño: unas horas, un archivo o dos, sin tocar datos.
  - **M** — intermedio: varios componentes/estado, sin rearquitectura.
  - **L** — grande: subsistema nuevo o que cruza frontend+backend/datos.
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

| ID | Descripción | Aplica | Orig. |
|---|---|---|---|
| `EDITOR-CHECKBOX-ESTILOS` | Estilos de checkbox según el símbolo: `x`=X, `-`=tachado, `*`=estrella, `+`=check | ambas | C-M-06 |
| `EDITOR-TAB-WIDTH` | Configurar cuánto espacio ocupa una tabulación | ambas | C-M-10 |
| `EXPLORER-EXTENSIONES` | Mostrar la extensión de los archivos no‑markdown para poder identificarlos | ambas | C-M-12 |
| `TRASH-MULTISELECT` | Seleccionar varios archivos para borrar en la papelera | ambas | C-M-14 |
| `VAULT-EJEMPLO-DEFAULT` | Al crear un vault nuevo, generar un archivo de ejemplo por defecto | ambas | C-G-02 |

### 1.2 Intermedias — tamaño M

| ID | Descripción | Aplica | Orig. |
|---|---|---|---|
| `TRASH-PREVIEW` | Visualizar el contenido de los archivos en la papelera | ambas | C-M-13 |
| `GRAPH-BUSCADOR-FILTRO` | Buscar por nombre en el grafo: atenúa los nodos que no coinciden | ambas | C-I-03 |
| `TEMPLATES-ESPORAS` | Plantillas ("Esporas") para crear notas rápido: botón en el rail + selección de plantilla al crear archivo | ambas | C-I-04 |
| `METADATA-YAML` | Manejar metadatos YAML (frontmatter `---`) de las notas (prerequisito de `FILES-BASES`) | ambas | C-I-07a |

### 1.3 Grandes — tamaño L

| ID | Descripción | Aplica | Orig. |
|---|---|---|---|
| `MACROS-HOTKEYS` | Configurar acciones de Mycelium por macros/atajos (escribir, crear con plantilla, abrir, etc.) | ambas | C-I-05 |
| `SHARING-PUBLICOS-GLOBALES` | Carpeta "Estado Mycelium" con 3 archivos públicos (Ayudas / Bugs / Ideas): editables por autorizados, visibles por todos | web | C-I-06 |
| `FILES-BASES-TABLA` | Tipo de archivo tipo "bases" (tabla) que agrega notas por metadatos, con filtros y columnas configurables. Depende de `METADATA-YAML` | ambas | C-I-07b |
| `VAULT-MULTIPLE` | Un usuario con varios vaults, seleccionables en Configuración → Vault | ambas | C-G-01 |

### 1.4 Muy grandes — tamaño XL

| ID | Descripción | Aplica | Orig. |
|---|---|---|---|
| `STORAGE-LOCAL-FIRST-NUBE` | Almacenamiento local con guardado a la nube **a conciencia** (nunca automático); compartidos sí se sincronizan solos. Reduce servidor/costos | desktop | C-G-03 |

> **`VAULT-MULTIPLE`**: en **desktop** ya existe la base (lista/selección de vaults en
> carpeta, entrar/salir de vault — ver `docs/features/vault-en-carpeta.md`); falta
> revisar/completar la experiencia y llevarlo a **web**. Reclasificar a M si en desktop
> ya está cubierto.

---

## 2. Con errores / a ajustar (🟡)

| ID | Descripción | Tamaño | Aplica | Orig. |
|---|---|---|---|---|
| `EDITOR-CALLOUT-TITULO-COLOR` | El título del callout debe conservar el color de la etiqueta. Bug: al aplicar negrita/cursiva/color/links dentro del título, se pierde ese estilo (el color solo debería aplicarse cuando no hay otro elemento con estilo propio) | S–M | ambas | C-M-04 |

---

## 3. Diferidas — referenciadas por HUs (🔵)

Implementaciones referenciadas por las HUs y diferidas fuera del alcance actual (antes
en `FUTURE_IMPLEMENTATIONS.md`, hoy consolidadas aquí). Varias son **solo web**
(login/nube/colaboración no aplican al desktop local sin login).

| ID | Descripción | Tamaño | Aplica | HU |
|---|---|---|---|---|
| `TAGS-PANEL` | Panel de tags del rail (listado, conteo, filtrado por tag); hoy es placeholder | M | ambas | HU-28 |
| `TAGS-GRAFO-NODOS` | Mostrar tags como nodos en el mini‑grafo y el grafo global | M | ambas | HU-30 |
| `DAILY-NOTE` | Nota diaria (crear/abrir la del día con plantilla); ícono del rail es placeholder | M | ambas | HU-28 |
| `LINKS-REESCRITURA-RENOMBRAR` | Reescribir los `[[enlaces]]` que apuntan al título viejo al renombrar una nota | M | ambas | HU-23 |
| `IMPORT-ADJUNTOS` | Subsistema de adjuntos (`.png/.jpg/.pdf/.svg/.excalidraw` sueltos) en importación Obsidian | L | ambas | HU-07/11 |
| `EXPORT-ZIP-SERVIDOR` | Exportar ZIP de vaults ≥ 200 MB en el servidor con progreso (hoy 100% cliente) | M | web | HU-09 |
| `AUTH-OAUTH-GITHUB` | Login con GitHub (requiere registrar OAuth App + credenciales) | M | web | HU-32 |
| `COLLAB-REALTIME` | Edición simultánea en tiempo real + presencia (arquitectura lista; requiere Durable Object + Cloudflare) | XL | web | HU-05/06/37 |
| `COLLAB-PRESENCIA-AJUSTES` | Afinar timeout de cursor (5 s) y agrupado "+N más" (8 cursores) | S | web | HU-06 |
| `COLLAB-HISTORIAL-VERSIONES` | Registrar qué miembro hizo cada cambio (historial) | L | web | HU-37 |
| `INFRA-CLOUDFLARE` | Integración D1 / R2 / Durable Objects (hoy adaptadores stub, todo local) | XL | web | — |

---

## 4. Implementadas (registro) 🟢

De `Ideas Mycelium.md` → "Completados", más dos que el antiguo
`FUTURE_IMPLEMENTATIONS.md` listaba como pendientes pero **ya están hechas** (ver §6).

| ID | Descripción | Orig. |
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

## 5. Detalle de funcionalidades no triviales

### `TEMPLATES-ESPORAS` (C-I-04)
Botón nuevo en el rail izquierdo para ver/gestionar plantillas reutilizables. Al crear
un archivo, mostrar un menú (como el de crear carpeta) con: nombre (por defecto "nuevo
archivo") y plantilla (por defecto "ninguna"). Nombre propuesto para las plantillas:
**"Esporas"** — *a validar si es adecuado.*

### `SHARING-PUBLICOS-GLOBALES` (C-I-06)
Carpeta **"Estado Mycelium"** con 3 archivos: *Ayudas Mycelium*, *Bugs Mycelium*,
*Ideas y Sugerencias Mycelium*. Visibles para todos; editables solo por usuarios
autorizados. Aparecen en el apartado **Compartidos**. Requiere backend + roles →
naturaleza **web**.

### `METADATA-YAML` + `FILES-BASES-TABLA` (C-I-07)
1. **`METADATA-YAML`**: manejar el frontmatter YAML (`---\nname: data\n---`) como
   metadatos de la nota, con estilo propio en edición/lectura. Hoy Mycelium no los
   maneja. Es **prerequisito** de lo siguiente.
2. **`FILES-BASES-TABLA`**: tipo de archivo (equivalente a *Bases* de Obsidian, **hay
   que buscarle un nombre propio**) que agrupa notas y muestra sus metadatos como
   **tabla**. Filtros para incluir/excluir (path, nombre, etiquetas…) y selección de
   qué parámetros mostrar (por defecto, solo el nombre). Vista de tarjetas: fuera de
   alcance salvo que sea barata.

### `STORAGE-LOCAL-FIRST-NUBE` (C-G-03)
Markdowns y archivos viven en local; botón para **guardar en la nube a conciencia**
(nunca automático). Los **compartidos** sí se suben/actualizan solos (manejar datos
temporales). Objetivo: reducir esperas y uso de servidor → menores costos. Es una
**rearquitectura** de la capa de datos desktop (XL, impacto **major**).

### `MACROS-HOTKEYS` (C-I-05)
Sistema de macros/atajos para encadenar acciones (escribir texto, crear archivo con
plantilla, abrir archivo, etc.). Requiere un registro de acciones + editor de atajos.
*A discutir el alcance antes de implementar.*

### `EDITOR-CALLOUT-TITULO-COLOR` (C-M-04) — 🟡
El color del título del callout debe aplicarse **solo** cuando el título no tiene otro
estilo propio (negrita/cursiva/color/link). Hoy el color pisa esos estilos.

---

## 6. Notas de reconciliación

- **IDs originales duplicados**: en `Ideas Mycelium.md` el código `C-M-12` estaba usado
  **dos veces** — para "añadir extensiones de archivos" (pendiente) y para "persistencia
  de pestañas" (completado). Acá se separaron en `EXPLORER-EXTENSIONES` y
  `TABS-PERSISTENCIA` respectivamente.
- **Ítems ya implementados que el antiguo `FUTURE_IMPLEMENTATIONS.md` listaba como
  pendientes**: la **persistencia de pestañas/splits al recargar** (`TABS-PERSISTENCIA`,
  el store usa `persist`) y el **pinning de pestañas** (`TABS-PINNING`, `pinTab` +
  pestañas de preview). Ya reflejados como 🟢 en §4.
- **`FUTURE_IMPLEMENTATIONS.md` eliminado**: su contenido quedó consolidado en este
  backlog (§3). Las referencias de otros documentos se repuntaron a `BACKLOG.md`.
- **Aplicabilidad por versión**: colaboración, OAuth GitHub, export ZIP server‑side e
  infraestructura Cloudflare son de la línea **web**; el desktop es local sin login.

---

## 7. Propuesta de secuenciado por versiones (borrador a acordar)

Tentativo, ordenado por relación valor/esfuerzo (primero las S). **A definir juntos.**

- **`1.0.x` (patch)** — correcciones: `EDITOR-CALLOUT-TITULO-COLOR`.
- **`1.1.0` (minor)** — quick wins S: `EDITOR-CHECKBOX-ESTILOS`, `EDITOR-TAB-WIDTH`,
  `EXPLORER-EXTENSIONES`, `TRASH-MULTISELECT`, `VAULT-EJEMPLO-DEFAULT`.
- **`1.2.0` (minor)** — M: `GRAPH-BUSCADOR-FILTRO`, `TEMPLATES-ESPORAS`,
  `METADATA-YAML`, `TRASH-PREVIEW`, `TAGS-PANEL`, `DAILY-NOTE`.
- **`1.3.0`+ (minor)** — L: `FILES-BASES-TABLA`, `MACROS-HOTKEYS`,
  `LINKS-REESCRITURA-RENOMBRAR`, `IMPORT-ADJUNTOS`, `VAULT-MULTIPLE`,
  `SHARING-PUBLICOS-GLOBALES`.
- **`2.0.0` (major)** — XL / rearquitectura y nube: `STORAGE-LOCAL-FIRST-NUBE`,
  `INFRA-CLOUDFLARE`, `COLLAB-REALTIME`.
