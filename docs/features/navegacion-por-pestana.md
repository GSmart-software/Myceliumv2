# Navegación por pestaña: scroll, historial y previsualización

Spec de cuatro arreglos a la navegación entre documentos, reportados por el usuario al
leer varias notas largas en paralelo (`DEF-039`, `DEF-040`, `DEF-041` + los botones).

> [!info] Alcance: **SOLO-DESKTOP por ahora**
> Es UI compartida, así que aplica por naturaleza a las dos versiones, pero se implementa
> primero en `desktop-tauri`. **Cuando esté confirmado por el usuario se refleja a web**
> con la receta de [[Reflejar cambios de desktop a web]] — ojo que `tabsStore.ts` y
> `TabBar.tsx` ya divergen entre ramas por la terminal (ver [[RAMAS]]).

> [!important] Nada de esto es funcionalidad nueva
> Los tres primeros son defectos. Los botones tampoco cuentan como funcionalidad: la
> navegación hacia atrás **ya existe**, solo que hoy es una capacidad oculta que exige
> botones especiales del ratón. Ponerle botones es hacer visible lo que ya está. Por eso
> todo se versiona como **patch** (ver [[Versionado del sistema]]).

---

## `DEF-039` · El scroll no se conserva al volver a una pestaña

**Síntoma**: estar leyendo una `FUN-*` concreta del BACKLOG, cambiar a otro documento y
volver → el documento aparece desde el principio. Entorpece leer varias notas en paralelo.

**El mecanismo ya existe y no funciona.** `NoteEditor.tsx` guarda cursor y scroll por
instancia de pestaña (`instanceCache`, HU-25 CA10): al desmontar hace
`instanceCache.set(instanceId, { doc, anchor, head, scrollTop })` y al montar restaura.
`EditorPane` monta **solo** la pestaña activa (`<NoteEditor key={activeTab.id}>`), así que
cambiar de pestaña desmonta y vuelve a montar: el ciclo se ejecuta.

> [!tip] Hipótesis principal (confirmar antes de arreglar)
> La restauración hace `viewRef.current.scrollDOM.scrollTop = cached.scrollTop`
> **inmediatamente** después de crear la vista. CodeMirror solo renderiza el viewport y
> estima el resto con su height-map, así que en ese momento `scrollHeight` es apenas el
> del viewport: el navegador **recorta** la asignación a ~0 y el documento queda al
> principio. Encaja con que el efecto sea peor cuanto más largo el documento.
>
> Segunda hipótesis: la guarda `cached.doc === content` falla porque el contenido montado
> difiere del guardado (p. ej. por el bloque de título). Verificar cuál de las dos es,
> **antes** de tocar nada — ver el principio 1 de [[Aprendizajes tecnicos]].

**Criterios de aceptación**

1. Abrir una nota larga, bajar hasta la mitad, cambiar de pestaña y volver → queda en la
   misma posición, sin salto visible.
2. Vale en los cuatro modos (`live`, `split`, `read`, `raw`). **Ojo**: en `read` el
   scroller visible **no** es el de CodeMirror sino el del preview; hoy `instanceCache`
   solo guarda el de CodeMirror. Hay que cubrir los dos.
3. El cursor también se restaura (ya lo hacía; no romperlo).
4. Volver a una nota **modificada en disco desde fuera** no restaura una posición
   inválida: si el documento cambió, se prefiere el inicio antes que una posición
   arbitraria.

**Nota de implementación**: para posicionar de forma fiable conviene apoyarse en el
height-map en vez de pelearlo — `EditorView.scrollIntoView(pos, { y: "start" })` sobre un
offset del documento resuelve la posición correcta aunque las líneas no estén renderizadas.
Si se sigue con `scrollTop`, hay que reaplicarlo tras `requestMeasure`/rAF hasta que
estabilice. Contexto del height-map en [[CodeMirror y la vista en vivo]].

---

## `DEF-040` · El historial es global, no por pestaña

**Síntoma** (ejemplo del usuario): con `RAMAS` y `HUs` abiertos, estando en `RAMAS` se
abre `BACKLOG` (reemplaza), luego se mira `HUs` y se reemplaza por `DESIGN_SYSTEM`. Al
volver a `BACKLOG` y pulsar "atrás" aparece `DESIGN_SYSTEM`, cuando debería aparecer
`RAMAS`, que es lo que esa pestaña mostraba antes.

**Causa raíz, confirmada**: **no hay historial propio**. El único "historial" del store es
`closedHistory` (reabrir cerradas con `Ctrl+Shift+T`). El botón extra del ratón navega el
historial **del WebView**, que se alimenta de los `router.push('/workspace?note=…')` que
se disparan en cada apertura (`workspace/page.tsx` → `syncUrlWithTabs`, `NoteEditor`,
`NotePanel`, `ExplorerPanel`…). Es una lista plana y global de URLs, en el orden en que se
pulsaron notas, sin ninguna relación con qué pane o pestaña las mostró.

**Diseño pedido**: cada pestaña lleva **su propia línea de historial** — la secuencia de
documentos que esa pestaña mostró.

- El historial vive **en la pestaña**: `Tab` gana `historial: string[]` (notaIds) e
  `indice: number` (posición actual dentro de esa línea).
- **Al reemplazar una pestaña de previsualización**, la pestaña nueva **hereda** el
  historial de la saliente con la nota saliente añadida al final. Es exactamente lo que
  hace falta para que el ejemplo de arriba devuelva `RAMAS`.
- **Activar otra pestaña ya abierta NO es navegación**: no agrega entradas a ninguna línea.
- Atrás/adelante **reemplazan el documento en la pestaña actual**, nunca abren una nueva
  ni roban el foco a otro pane.
- Navegar hacia atrás y luego abrir un documento distinto **trunca** la rama de adelante
  (comportamiento estándar de un historial).
- Tope de entradas por pestaña: **50**, descartando las más viejas.

**Además, dejar de contaminar el historial del WebView**: los `router.push` de apertura
pasan a `router.replace`. Con el historial propio, la pila del WebView solo compite y
confunde. Verificar que la URL sigue reflejando la nota activa (hay lógica que la lee al
arrancar).

**Botones del ratón y teclado**: interceptar los botones auxiliares (`button === 3`
atrás / `button === 4` adelante) con `preventDefault()` y enrutarlos al historial de la
pestaña activa. Sumar `Alt+←` / `Alt+→`.

**Criterios de aceptación**

1. El ejemplo del usuario, literal: volver a `BACKLOG` y pulsar atrás muestra `RAMAS`.
2. Dos panes abiertos: el historial de uno no interfiere con el del otro.
3. Atrás en una pestaña sin historial previo no hace nada (y su botón se ve deshabilitado).
4. El botón extra del ratón ya **no** navega el historial del WebView (no se sale del
   workspace ni salta a `/vaults`).
5. Cerrar y reabrir la app conserva las pestañas; el historial puede perderse o no, pero
   **no puede romper la restauración de pestañas** (ver la advertencia de persistencia).

> [!danger] Persistencia: NO subir la versión del `persist` sin `migrate`
> `tabsStore` persiste `root` (con las pestañas) en la versión **1**. Si se le suben
> campos a `Tab` y se cambia la versión sin escribir `migrate`, Zustand **descarta** el
> estado guardado y el usuario **pierde todas sus pestañas abiertas**. Ya pasó con
> `sidebarViewerStore` entre 1.0.0 y 1.1.0 (ver [[Estado con Zustand]]).
>
> Camino seguro: **no tocar la versión** y tratar `historial`/`indice` ausentes como
> `[]` / `0` al leer. Si hiciera falta migrar, escribir el `migrate`.

---

## `DEF-041` · La pestaña de previsualización no reemplaza

**Síntoma**: con "pestañas de previsualización" activo en Configuración, abrir un
documento que no se modificó abre **una pestaña nueva** en vez de reemplazar la actual.

**Estado del análisis**: el mecanismo existe en `tabsStore.openNote` (líneas ~221-249):
`replace` exige `previewEnabled && activeTab?.preview === true`. O sea, solo reemplaza si
la pestaña **activa** es ella misma de previsualización. Los caminos que crean pestañas
permanentes (`preview: false`) son `openNoteBackground`, `openNotaInPane` y `pinTab`, que
se dispara al editar (`NoteEditor.tsx` ~314) o con doble clic en la pestaña.

> [!warning] Acá NO hay causa raíz confirmada: encontrala antes de tocar código
> Las hipótesis a descartar: (a) algo marca la pestaña como permanente sin que el usuario
> edite —revisar si alguna transacción de carga dispara `isUserEvent("input")`, p. ej. al
> insertar el bloque de título—; (b) el camino por el que el usuario abre no es
> `openNote`; (c) el flag `preview` se pierde al rehidratar el store. **Reproducí primero**
> y dejá escrito el paso a paso que falla.

**Criterios de aceptación**

1. Con la preferencia activa: abrir A (pestaña de previsualización), abrir B sin tocar A →
   B **reemplaza** a A, sigue habiendo una sola pestaña.
2. Editar A la vuelve permanente; abrir B entonces sí crea pestaña nueva.
3. Doble clic en la pestaña la fija como permanente (no romper lo que ya anda).
4. Con la preferencia desactivada, cada apertura crea pestaña nueva.
5. El grafo y las terminales nunca se reemplazan (reemplazar una terminal mata su sesión).

---

## Botones de atrás/adelante

Dos flechas que operan sobre el historial de **la pestaña activa** del pane.

- Van en la `TabBar` de cada pane, a la izquierda de las pestañas.
- **Deshabilitadas** cuando no hay a dónde ir, con el estado visual que ya use el proyecto
  para controles inertes.
- `title`/tooltip con el nombre del documento al que llevan ("Atrás: RAMAS").
- Sin rediseñar la barra: seguir el [[DESIGN_SYSTEM]] y el estilo de los controles que ya
  viven ahí.

---

## Versionado

Cuatro unidades, **todas patch**: `1.1.1` → **`1.1.5`**. Tres defectos (`DEF-039`,
`DEF-040`, `DEF-041`) y una mejora de lo existente (los botones). Ninguna suma minor: no
hay capacidad nueva, se corrige y se hace visible lo que ya existía. Los cuatro archivos
de versión, como siempre, en [[Versionado del sistema]].

`FRAMEWORK_IA_VERSION` **no** cambia: nada de esto afecta a lo que la IA debe saber del
vault.

## Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json`
- `cd frontend/src-tauri && cargo check` (si se tocara Rust; probablemente no haga falta)
- No hay tests automáticos de esta capa: la prueba real es el usuario. Dejar escrito el
  **paso a paso de reproducción** de cada defecto para que pueda verificarlos uno por uno.

> [!warning] `tsc` verde no prueba comportamiento
> Es exactamente el tipo de cambio que compila y sigue roto. Ver
> [[Verificar antes de integrar]].

## Documentación a actualizar

- [[bugs-progreso]] — alta de `DEF-039`, `DEF-040`, `DEF-041` con su estado.
- [[Estado del proyecto]] y [[Versionado del sistema]] — versión nueva.
- `docs/estado/Version 1.1.5.md` — nota de release, con la estructura de [[Version 1.1.1]].
- [[RAMAS]] — si la divergencia de `tabsStore.ts`/`TabBar.tsx` crece, anotarlo para el
  reflejo futuro a web.

## Relacionadas

- [[Estado con Zustand]] — la trampa de `persist` sin `migrate`.
- [[CodeMirror y la vista en vivo]] — el height-map, clave para el scroll.
- [[Reflejar cambios de desktop a web]] — cómo se llevará a web más adelante.
- [[def-023-visor-sidebar]] — el otro trabajo grande sobre panes y pestañas.
- [[Mapa de documentacion]] — índice general.
