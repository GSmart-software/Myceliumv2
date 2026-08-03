# Esporas: plantillas de notas (`FUN-M-03` · `TEMPLATES-ESPORAS`)

Spec de las **Esporas**: notas plantilla reutilizables para crear documentos ya con su
estructura, o para insertar una estructura dentro de una nota que ya existe.

> [!warning] Implementado en desktop el 2026-08-03 — [[Version 1.3.0]]
> Todo lo que describe esta spec está en `desktop-tauri` y la verificación automática
> quedó en verde, pero el usuario **todavía no lo confirmó en la app**. El paso a paso de
> los 13 criterios, con la plantilla de prueba, está en [[Version 1.3.0]].
> Decisiones que la spec no cubría y hubo que tomar al implementar: la lista del panel se
> deriva del árbol que ya tiene `vaultStore` (una Espora es una nota cuya `carpetaId` es
> exactamente la carpeta configurada), la plantilla nueva se llama `Nueva Espora` y se
> renombra inline —no hay diálogo de nombre—, y al insertar se descartan los saltos de
> línea iniciales del cuerpo, que son el separador del bloque de frontmatter y no
> contenido del usuario.

> [!info] Alcance: **desktop primero, reflejo a web después**
> Aplica a las dos versiones. Se implementa en `desktop-tauri`, el usuario lo confirma en
> la app y recién ahí se refleja a `web-cloud` con la receta de
> [[Reflejar cambios de desktop a web]]. Como las plantillas son **notas del vault**, casi
> todo es frontend compartido; lo que diverge es listar la carpeta (`lib/db` vs backend
> .NET) y el panel del rail (en desktop el panel lateral es el `SidebarDock` genérico; en
> web sigue siendo `ExplorerDock`). Ver [[RAMAS]].

> [!important] Funcionalidad nueva → **minor**
> `1.2.0` → **`1.3.0`**. Una funcionalidad, un minor, y el patch vuelve a `0`. Ver
> [[Versionado del sistema]].

> [!warning] Decisión del usuario: **no hay diálogo al crear una nota**
> El backlog planteaba que "Nueva nota" abriera un menú con nombre y selector de plantilla.
> Se **descartó**: crear una nota es la acción más frecuente de la app y pasaría de un clic
> a clic + Enter, siempre, para algo que se usa de vez en cuando. Crear una nota sigue
> funcionando exactamente igual que hoy. La plantilla se elige por las tres vías del § 3.

---

## Estado de partida

- No existe ningún concepto de plantilla. `crearNota` (`lib/db/notas.ts`) crea el archivo
  **vacío**; el nombre por defecto es "Sin título" y el saneo/desambiguación lo resuelve
  `nombreNotaLibre`.
- El rail (`components/workspace/Rail.tsx`) tiene las secciones `explorer`, `search`,
  `tags`, `trash` y `terminal` (`RailSection` en `panelLayoutStore`), más grafo y
  configuración. Añadir una sección es el patrón que ya está.
- El menú contextual de una carpeta en el explorador (`ExplorerPanel.tsx` ~línea 328) ya
  tiene "Nueva nota" y "Nuevo dibujo".
- Las preferencias viven en `stores/preferencesStore.ts` (tipo `Preferencias`, guardado con
  debounce) y se editan en `SettingsDrawer` (pestañas Apariencia / Editor / Vault).
- **`FUN-M-04` acaba de entrar**: `lib/frontmatter.ts` sabe leer y editar propiedades. Es
  lo que hace posible el § 3.2 (insertar una Espora fusionando sus propiedades).

> [!note] `window.prompt` funciona — comprobado, no era un defecto
> "Nueva carpeta" es el único sitio que lo usa (`ExplorerPanel.tsx`, dos llamadas) y se
> sospechó que WebView2 no lo implementara, lo que la habría dejado muerta en silencio. El
> usuario lo verificó en la app el 2026-08-03 y **funciona**; queda registrado en
> [[Tauri y el WebView]]. Aun así, **esta spec no usa `window.prompt` en ningún caso**: es
> un cuadro del sistema, no sigue el [[DESIGN_SYSTEM]] y no admite validación ni un
> selector. Se tolera donde ya está, no se extiende.

---

## 1. Qué es una Espora

**Una Espora es una nota normal del vault** que vive en una carpeta designada. No hay
formato especial, ni registro, ni base de datos: si el archivo está en esa carpeta, es una
plantilla.

- **Carpeta por defecto**: `Esporas/` en la raíz del vault. **Configurable** en
  Configuración → Vault (una ruta de carpeta del vault).
- Se crea **sola** la primera vez que el usuario crea una Espora. Si la carpeta configurada
  no existe, el panel lo dice y ofrece crearla; nunca falla en silencio.
- Al ser notas normales: se editan con el editor de siempre, viajan en la exportación, se
  ven en el grafo y se pueden ocultar con `.mycignore` si el usuario no las quiere en el
  árbol. **No se les da trato especial** en búsqueda ni en el grafo — esconderlas sería
  decidir por el usuario.
- El **nombre del archivo es el nombre de la plantilla**, como en todo el vault.
- Las subcarpetas de la carpeta de Esporas **no** se recorren: la lista es plana. Si hace
  falta agrupar, será otra unidad.

---

## 2. Variables

Al usar una Espora, su texto se sustituye antes de escribirse. Los tokens van entre llaves
dobles y en **español**, como el resto de la interfaz:

| Token | Sustituye por | Ejemplo |
|---|---|---|
| `{{titulo}}` | Título final de la nota destino | `Reunión 2` |
| `{{fecha}}` | Fecha de hoy en ISO | `2026-08-02` |
| `{{hora}}` | Hora actual, 24 h | `15:04` |
| `{{fecha:FORMATO}}` | Fecha/hora con formato propio | `{{fecha:DD/MM/AAAA}}` → `02/08/2026` |

**Tokens de formato** (para `{{fecha:…}}`): `AAAA` año · `MM` mes · `DD` día · `hh` hora ·
`mm` minuto · `ss` segundo. Todo lo demás del formato se copia literal, así que
`{{fecha:AAAA-MM-DD hh:mm}}` funciona.

Reglas:

- Un token **desconocido se deja tal cual**, sin tocar. Es preferible que el usuario vea
  `{{autor}}` escrito en su nota y entienda que no existe, a que desaparezca en silencio.
- La sustitución se hace sobre el **texto crudo**, así que también aplica **dentro del
  frontmatter**: una Espora con `fecha: {{fecha}}` produce una propiedad de tipo fecha ya
  rellena. Es la sinergia natural con [[metadata-yaml]] y conviene que las plantillas de
  ejemplo la muestren.
- `{{titulo}}` se resuelve con el título **final** de la nota (después de sanear y
  desambiguar), no con el que se pidió.
- **No hay `{{cursor}}`** en esta unidad: obligaría a acoplar la creación con el editor.
  Si se pide, es una continuación.

> [!tip] Es lógica pura sobre strings — testeala
> Igual que el parser de `FUN-M-04`, la sustitución no necesita ni React ni CodeMirror.
> `frontend/scripts/test-esporas.mjs` al estilo de `test-frontmatter.mjs`: cada token, el
> formato propio, token desconocido intacto, llaves sueltas que no son token, y sustitución
> dentro del frontmatter.

---

## 3. Las tres vías de uso

Las tres comparten el mismo núcleo: **listar las Esporas** + **sustituir variables**. Lo
que cambia es qué se hace con el resultado.

### 3.1 Panel de Esporas: un clic crea la nota

Botón nuevo en el rail (icono `Sprout` de lucide; si no existiera, `FileStack`) que abre el
panel **Esporas** en el panel lateral, como cualquier otra sección.

- Lista las plantillas de la carpeta configurada, por nombre.
- **Un clic en una Espora crea la nota** en la **carpeta activa** del explorador
  (`vaultStore.activeFolderId`, la misma que usa "Nueva nota" hoy), con el contenido ya
  sustituido, y la abre. Sin diálogo.
- **El nombre de la nota nueva es el nombre de la plantilla**, desambiguado por el
  mecanismo que ya existe (`Reunión`, `Reunión 2`, …). Es más útil que "Sin título" y no
  cuesta nada.
- Cada fila tiene, además: **editar** (abre la plantilla como nota normal), **renombrar** y
  **borrar** (a la papelera, como cualquier nota).
- Botón **"Nueva Espora"**: crea una plantilla vacía en la carpeta y la abre para editarla.
- Si la carpeta no existe o está vacía, el panel explica qué es una Espora y ofrece crear
  la primera. **Nada de un panel vacío sin explicación.**

### 3.2 "Insertar Espora" en la nota abierta

Un botón en la barra del editor (`EditorToolbar`) que abre la lista y **inserta** la Espora
en la posición del cursor. Es la única vía que sirve para notas que **ya existen**.

- La inserción se hace **despachando una transacción sobre el CodeMirror de la nota**, no
  reescribiendo el archivo por debajo — misma razón que en [[metadata-yaml]]: el
  autoguardado del editor pisaría el cambio y `Ctrl+Z` no lo desharía. Debe deshacerse en
  **un** paso.
- `{{titulo}}` se resuelve con el título de la nota en la que se inserta.

> [!important] Si la Espora tiene frontmatter, sus propiedades se **fusionan**
> Insertar el bloque `---` en medio de un documento lo convertiría en una línea horizontal
> y un título fantasma — exactamente lo que `FUN-M-04` vino a arreglar. Así que al insertar:
> el **cuerpo** de la Espora va al cursor, y sus **propiedades** se añaden al frontmatter de
> la nota destino con `ponerPropiedad` de `lib/frontmatter.ts` (creando el bloque si no
> tenía).
>
> Ante una clave que ya existe en la nota destino, **gana la de la nota**: la plantilla
> aporta lo que falta, no pisa lo que el usuario ya escribió. Excepción: `tags`, donde los
> dos conjuntos se **unen** sin duplicados.
>
> Si el frontmatter de la nota destino es **no soportado** (§ 1 de [[metadata-yaml]]), no se
> toca: se inserta solo el cuerpo y se avisa de que las propiedades no se pudieron fusionar.

### 3.3 Submenú en el clic derecho del explorador

En el menú contextual de una carpeta, junto a "Nueva nota" y "Nuevo dibujo":
**"Nueva desde Espora ▸"** con el submenú de plantillas. Al elegir una, crea la nota **en
esa carpeta** (no en la activa) y la abre. Sin diálogo.

- Si no hay Esporas, la entrada aparece **deshabilitada** con el motivo en el `title`, no
  oculta: es la forma de que se descubra la funcionalidad.

---

## 4. Configuración

En Configuración → **Vault**, un campo nuevo: **carpeta de Esporas**, con `Esporas` por
defecto.

- Se guarda en `Preferencias` (`stores/preferencesStore.ts`), como el resto.
- Cambiar la carpeta **no mueve nada**: solo cambia dónde se buscan las plantillas. Si la
  nueva no existe, el panel ofrece crearla.
- Validar que la ruta sea de una carpeta del vault; nada de rutas absolutas ni `..`.

> [!warning] `VaultSection.tsx` diverge entre ramas
> Desktop tiene export-a-carpeta y el toggle de abrir-último; web solo ZIP. Al reflejar,
> este campo se aplica **a mano** en cada rama, no se copia el archivo. Ver [[RAMAS]].

---

## 5. Criterios de aceptación

1. Con la carpeta de Esporas vacía o inexistente, el panel explica qué es una Espora y
   ofrece crear la primera; no aparece un panel vacío ni un error.
2. "Nueva Espora" crea una plantilla en la carpeta configurada y la abre para editarla.
3. Un clic en una Espora del panel crea la nota en la carpeta activa, con el nombre de la
   plantilla, la abre, y el contenido tiene las variables ya sustituidas.
4. Crear dos notas de la misma Espora da `Reunión` y `Reunión 2`; ninguna pisa a la otra.
5. Una Espora con `fecha: {{fecha}}` en el frontmatter produce una nota cuya pestaña
   PROPIEDADES muestra una propiedad **de tipo fecha** con la fecha de hoy.
6. `{{autor}}` (token inexistente) llega a la nota **escrito tal cual**.
7. `{{fecha:DD/MM/AAAA}}` produce la fecha con ese formato.
8. "Insertar Espora" en medio de una nota mete el cuerpo en el cursor y **no** deja un
   `---` suelto ni un título fantasma.
9. Al insertar, las propiedades de la Espora que la nota no tenía se añaden a su
   frontmatter; las que ya tenía **no** se pisan; los `tags` de ambas se unen sin duplicar.
10. `Ctrl+Z` después de insertar deshace la inserción en **un** paso.
11. El clic derecho en una carpeta ofrece "Nueva desde Espora" y crea **en esa carpeta**,
    no en la activa. Sin Esporas, la entrada está deshabilitada, no oculta.
12. Cambiar la carpeta de Esporas en Configuración cambia la lista del panel sin reiniciar,
    y **no mueve ningún archivo**.
13. Crear una nota con el botón "+" de siempre sigue funcionando **exactamente igual que
    antes**: un clic, sin diálogo, nota vacía.

---

## 6. Versionado

`1.2.0` → **`1.3.0`** en los cuatro archivos de siempre (`lib/version.ts`,
`package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`) **y `Cargo.lock`**,
que también lleva la versión del paquete. Ver [[Versionado del sistema]].

> [!important] `FRAMEWORK_IA_VERSION`: `1.3.0` → **`1.4.0`**
> Es una capacidad del vault que la IA debe conocer: que exista una carpeta de plantillas
> cambia cómo debe tratar esas notas (no son conocimiento del vault, son moldes) y le da
> una herramienta al crear notas. Minor, porque es conocimiento nuevo, no una corrección.
> Actualizar los templates de `lib/ia/framework.ts`: qué es una Espora, dónde vive, que la
> carpeta es configurable y qué variables admite. Ver [[ia-framework-vault]].

## 7. Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json`
- `node frontend/scripts/test-esporas.mjs`
- No se toca Rust: no hace falta `cargo check`.
- Prueba manual del usuario sobre los 13 criterios.

> [!warning] `tsc` verde no prueba comportamiento
> Ver [[Verificar antes de integrar]].

## 8. Documentación a actualizar

- [[BACKLOG]] — `FUN-M-03` a implementado; anotar en `FUN-M-07` (Daily Note) que ya tiene
  de dónde tomar la plantilla y la sustitución de variables.
- [[Arquitectura de Mycelium]] — el modelo de contenido gana un concepto: una carpeta cuyas
  notas son moldes.
- [[Estado del proyecto]] y `docs/estado/Version 1.3.0.md` — release, con la estructura de
  [[Version 1.2.0]].
- [[RAMAS]] — los archivos que diverjan (`VaultSection.tsx`, el dock del panel lateral).
- [[ia-framework-vault]] — historial del framework hasta `1.4.0`.
- Si aparece una causa raíz nueva, [[Aprendizajes tecnicos]].

## Relacionadas

- [[Version 1.3.0]] — el release donde salió, con el paso a paso de los 13 criterios.
- [[metadata-yaml]] — las propiedades que las Esporas rellenan y fusionan (`FUN-M-04`).
- [[BACKLOG]] — `FUN-M-03` y su consumidor `FUN-M-07` (Daily Note).
- [[Reflejar cambios de desktop a web]] — cómo llegará a `web-cloud`.
- [[RAMAS]] — qué diverge entre versiones.
- [[Verificar antes de integrar]] — qué debe quedar verde.
- [[Mapa de documentacion]] — índice general.
