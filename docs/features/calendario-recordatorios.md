# Calendario y recordatorios (`FUN-L-22` · `CALENDARIO-RECORDATORIOS`)

Un **calendario** dentro de Mycelium donde se ponen **recordatorios**: un título, un
detalle en markdown, un color, una fecha —con hora o sin ella— y, si hace falta, una
repetición. Cuando llega el momento, **avisa**. Pedido por el usuario el 2026-09-25 en la
bandeja.

**Desktop primero y web después**, el mismo día (2026-09-25): el usuario decidió empezar solo
por desktop y, confirmado ahí, pidió reflejarlo. Cómo se adaptó a web, en § «Cómo quedó en
web».

> [!important] No es la nota diaria
> `FUN-M-07` (`DAILY-NOTE`) crea **una nota por fecha**, un archivo del vault. Un
> recordatorio **no es un archivo**: no aparece en el explorador, ni en la búsqueda, ni en
> el grafo. Las dos cosas pueden convivir, y el calendario no crea notas.

## 1. Decisiones tomadas

Las cuatro las eligió el usuario el 2026-09-25, entre alternativas:

| Tema | Decisión | Por qué |
|---|---|---|
| Alcance | **De cada vault** | Viajan con el vault, y un `[[enlace]]` a una nota siempre resuelve. Abrir otro vault no muestra ni avisa los de este |
| Aviso | **En la app y en Windows** | La tarjeta propia tiene el detalle y los botones; la notificación del sistema cubre la ventana minimizada o tapada |
| Colores | **Paleta fija** | Sigue [[Los temas los define Mycelium, no el usuario]]: un color libre puede quedar ilegible en otro tema |
| Versiones | **Solo desktop** | Web casi duplica el trabajo; queda pendiente |

## 2. Qué es un recordatorio

| Campo | Qué es |
|---|---|
| **Título** | Obligatorio. Una línea |
| **Fecha** | Obligatoria. El día del recordatorio (o de su primera vez, si se repite) |
| **Hora** | Opcional. Sin hora es «todo el día» |
| **Repetición** | Ninguna · cada día · cada semana (el mismo día de la semana) · cada mes (la misma fecha) · cada año (la misma fecha) |
| **Color** | Uno de la paleta (§ 6). Por defecto, el primero |
| **Detalle** | Markdown libre, opcional. Puede tener `[[enlaces]]` a notas del vault |

**Casos de la repetición**, como los resuelve Google Calendar:

- **Cada mes el día 31** (o 29, 30): los meses que no tienen ese día, **no hay** ocurrencia.
  No se corre al último día del mes.
- **Cada año el 29 de febrero**: solo en los años bisiestos.
- **La repetición empieza en la fecha** del recordatorio: no hay ocurrencias antes.
- No hay fecha de fin en esta versión: un recordatorio que se repite se borra o se deja de
  repetir editándolo.

## 3. Dónde vive

En `.mycelium/recordatorios.json`, dentro del vault, junto a `papelera.json` y los demás
archivos de estado (`DEF-107`). **No es un archivo del vault**: `.mycelium/` está ignorado
siempre, así que no aparece en el explorador, la búsqueda ni el grafo — que es justo lo
pedido.

- Se lee y escribe con `leer_estado_vault` / `escribir_estado_vault`, agregando
  `recordatorios.json` a su **lista cerrada** de nombres en `prefs_vault.rs`.
- El archivo guarda los recordatorios y, aparte, **qué ocurrencias ya se atendieron**
  (descartadas) y cuáles están **pospuestas** y hasta cuándo (§ 5).
- Tiene `version`, como los demás archivos de estado, por si cambia su forma.
- Un archivo corrupto no impide abrir el vault: se avisa en la consola y el calendario
  arranca vacío **sin sobrescribirlo**, para no perder lo que se pueda recuperar a mano.

## 4. Las vistas

El calendario se abre **como pestaña** o **como panel lateral**, a elección.

### 4.1 Como pestaña

- Se abre como la del grafo: una pestaña con id propio (`CALENDAR_TAB_ID`), que se puede
  mover, dividir y cerrar como cualquier otra.
- **La grilla del mes** ocupa el centro: siete columnas, las semanas del mes, con los
  recordatorios de cada día como **chips del color** del recordatorio (hora + título). Si no
  entran, «+N más». El día de hoy, marcado.
- **La lista** va en un **lateral que se puede esconder**, con un selector **Día · Semana ·
  Mes**: los recordatorios de ese período, en orden, con color, fecha, hora y título.
- Navegación: mes anterior, siguiente y «Hoy».

### 4.2 Como panel lateral

- Un ítem nuevo en el **rail**, «Calendario», que abre el panel izquierdo como los demás.
- Como tiene menos lugar: **arriba un mes compacto** —los días con recordatorios llevan
  puntos de su color— y **abajo la lista**, con el mismo selector Día · Semana · Mes.
- Tocar un día en el mes compacto pone la lista en ese día.
- Desde el panel hay un botón para **abrirlo como pestaña**.

### 4.3 Crear, ver y editar

- **Crear**: con un botón «Nuevo recordatorio» (panel y pestaña) o con **doble clic en un
  día** de la grilla, que lo crea con esa fecha.
- Se edita en un **formulario** con los campos del § 2. El detalle usa el **mismo editor
  markdown** de la app, con el mismo live preview, pero **sin archivo** detrás: lo que se
  escribe se guarda en el JSON.
- Los **`[[enlaces]]` del detalle se pueden seguir**: abren la nota, como en una nota
  cualquiera. Enlazar a una nota que no existe se ve como enlace roto, igual que en el
  editor.
- **Ver** un recordatorio (clic en un chip o en la lista) muestra su detalle renderizado,
  con Editar y Eliminar.
- **Eliminar** pregunta con `DialogoConfirmar`, porque no hay papelera para recordatorios.
  En uno que se repite, se elimina **la serie entera**.

> [!info] Los recordatorios no entran al grafo, pero sus enlaces sí existen
> El grafo y los retroenlaces solo leen notas, y un recordatorio no es una nota: no aparece
> ni como nodo ni como arista, y una nota citada solo desde un recordatorio sigue con «0 te
> citan». Es lo que pidió el usuario.
>
> **Fuera de esta versión**: renombrar una nota **no** actualiza los `[[enlaces]]` que la
> nombran desde un recordatorio. Queda anotado para después.

## 5. Los avisos

### 5.1 Cuándo avisa

- **Con hora**: a esa hora, si Mycelium está abierto con ese vault.
- **Sin hora** («todo el día»): al abrir el vault ese día, o a medianoche si ya estaba
  abierto.
- **Los que pasaron con la app cerrada** se avisan **al abrir el vault**, marcados como
  vencidos («era a las 10:00», «era ayer»). Es el caso del pedido: «cuando se inicia
  Mycelium y hay un recordatorio puesto, sale la notificación».
- **Uno que se repite y se perdió varias veces** (un recordatorio diario con la app cerrada
  una semana) avisa **una sola vez**, por su ocurrencia más reciente. No siete.
- **Hacia atrás, como mucho 30 días**: lo vencido antes de eso no se avisa. Sin este tope,
  el primer arranque avisaría cosas de hace meses.
- Se revisa **una vez por minuto** y al volver de la suspensión del equipo. No hace falta
  más precisión: nadie espera un recordatorio al segundo.

### 5.2 Cómo se ve

- **Una tarjeta de recordatorio** abajo a la derecha, **del color** del recordatorio, con el
  título, la fecha y la hora, y el **detalle renderizado** (recortado si es largo, con «Ver
  todo»). **No se va sola**, a diferencia de los avisos del § de [[avisos-y-confirmaciones]]:
  un recordatorio que desaparece a los nueve segundos no sirve.
- Tres acciones:
  - **Listo**: se descarta esa ocurrencia. Si se repite, la próxima avisará igual.
  - **Posponer**: 10 minutos · 1 hora · mañana a esta hora. Vuelve a avisar entonces.
  - **Abrir**: abre el calendario en ese día con el recordatorio seleccionado.
- Si hay varios a la vez, se **apilan** (como mucho tres a la vista, con «y N más»).
- **Además, una notificación de Windows** —título y primer renglón del detalle— cuando la
  ventana está minimizada, sin foco o tapada. Hacerle clic trae la ventana al frente con la
  tarjeta. Con la ventana al frente no se manda: la tarjeta ya se ve.

### 5.3 Qué guarda

Se persiste en `recordatorios.json`, por ocurrencia: **descartada** o **pospuesta hasta**.
Así, reabrir la app no vuelve a avisar lo que ya se atendió, y lo pospuesto avisa cuando
toca, aunque la app se haya cerrado entre tanto.

## 6. Colores

**Ocho colores de la paleta de Mycelium**, como tokens por tema y modo
(`--mic-recordatorio-1` … `--mic-recordatorio-8`), elegidos para leerse sobre el fondo del
calendario en claro y en oscuro. En el formulario se elige entre ocho círculos, con su
nombre accesible («Hifa», «Espora», …). No hay selector libre.

## 7. Implementación (desktop)

| Pieza | Dónde |
|---|---|
| Modelo, repetición y ocurrencias (puro, testeable) | `lib/recordatorios.ts` + `scripts/test-recordatorios.mjs` |
| Persistencia | `stores/recordatoriosStore.ts` sobre `leer/escribir_estado_vault`; se carga al abrir el vault y se vacía al salir |
| Programador de avisos | `lib/avisosRecordatorio.ts`: revisa cada minuto y al volver de suspensión |
| Tarjeta de aviso | `components/recordatorios/TarjetaRecordatorio.tsx`, montada en el workspace |
| Notificación de Windows | `tauri-plugin-notification` (Cargo, npm y permiso en la capability) |
| Vista pestaña | `components/recordatorios/CalendarioVista.tsx`, con `CALENDAR_TAB_ID` en `tabsStore` |
| Panel lateral | sección `calendar` en `panelLayoutStore`, ítem en `Rail.tsx`, caso en `LeftPanel.tsx` |
| Formulario y detalle | `components/recordatorios/` con el editor markdown de la app |
| Colores | tokens en `styles/tokens.css`, por tema y modo |
| Lista cerrada de Rust | `recordatorios.json` en `ESTADOS` de `prefs_vault.rs` |

**Fechas**: se guardan como fecha local `AAAA-MM-DD` y hora `HH:MM`, no como instantes UTC.
Un recordatorio «a las 10» es a las 10 de donde esté el usuario; con UTC cambiaría de hora
al viajar o con el horario de verano.

## 8. Criterios de aceptación

1. Se crea un recordatorio con título, fecha, hora, color y un detalle con un `[[enlace]]`;
   aparece en la grilla ese día, del color elegido, y en la lista.
2. El recordatorio **no** aparece en el explorador, en la búsqueda ni en el grafo; la nota
   enlazada sigue con «0 te citan».
3. El `[[enlace]]` del detalle abre la nota.
4. Uno **sin hora** avisa al abrir el vault ese día; uno **con hora** avisa a esa hora con la
   app abierta.
5. Uno que venció con la app cerrada avisa al abrirla, marcado como vencido.
6. Uno **diario** perdido durante varios días avisa una sola vez.
7. **Listo** no vuelve a avisar esa ocurrencia, ni al reabrir la app. **Posponer** vuelve a
   avisar a su hora, aunque la app se cierre entre medio.
8. Con la ventana minimizada llega la notificación de Windows, y su clic trae la ventana.
9. Repetición: cada semana cae el mismo día de la semana; cada mes, la misma fecha (y se
   saltea en los meses sin ese día); cada año, la misma fecha (el 29 de febrero, solo en
   bisiestos).
10. El calendario se abre como pestaña (con la lista escondible y Día · Semana · Mes) y como
    panel lateral (mes compacto arriba, lista abajo).
11. Los recordatorios son **del vault**: abrir otro vault no los muestra ni los avisa, y
    copiar la carpeta del vault se los lleva.
12. Borrar el índice del vault no los pierde: viven en `.mycelium/`.
13. Los ocho colores se leen en los dos temas, en claro y en oscuro.

## Cómo quedó

Implementado en desktop el 2026-09-25, rama `feat/calendario-desktop`. **Sin confirmar en
la app**: los tests puros y `tsc`/`cargo check` están verdes, pero lo visible —y la
notificación de Windows— falta probarlo.

### Archivos

| Pieza | Archivo |
|---|---|
| Modelo puro (repetición, ocurrencias, qué avisa, lectura del archivo) | `frontend/lib/recordatorios.ts` |
| Tests (23) | `frontend/scripts/test-recordatorios.mjs` |
| Store del vault + modal | `frontend/stores/recordatoriosStore.ts` (carga/vacía desde `vaultSessionStore`) |
| Programador y notificación | `frontend/lib/avisosRecordatorio.ts` |
| Vistas | `frontend/components/recordatorios/`: `CalendarioVista` (pestaña), `CalendarioPanel` (panel y anclado en el costado), `ListaRecordatorios`, `ModalRecordatorio` (ver y editar), `EditorDetalle`, `TarjetaRecordatorio` (tarjetas + monta el modal), `comun.ts` |
| Pestaña y panel | `CALENDAR_TAB_ID` en `tabsStore`; `calendario` en `RailSection`, `Rail`, `LeftPanel`; `EditorPane`, `TabBar`, `SidebarDock`, `SidebarNoteView`, `sidebarViewerStore`; dos comandos en la paleta |
| Colores | `--mic-recordatorio-1..8` en `styles/tokens.css` |
| Rust | `recordatorios.json` en `ESTADOS` (`prefs_vault.rs`, con test); `src-tauri/src/recordatorios.rs` (comando `notificar_recordatorio`); `tauri-plugin-notification` + `tauri-winrt-notification` en `Cargo.toml` |

### Decisiones que hubo que tomar

- **La notificación de Windows no va por la API JS del plugin.** En escritorio esa API no
  avisa del clic, y sin manejador Windows resuelve el clic **relanzando el ejecutable**,
  que la instancia única convierte en una ventana nueva (`DEF-073`). El toast lo arma
  `recordatorios.rs` con `tauri-winrt-notification` —la crate que el plugin usa por
  debajo— y le cuelga un `on_activated` que desminimiza y enfoca la ventana que lo pidió.
  El plugin queda registrado para los demás sistemas; por eso **no** se agregó
  `@tauri-apps/plugin-notification` a `package.json` ni su permiso a la capability: la
  webview solo invoca un comando propio. `isFocused`/`isMinimized` ya vienen en
  `core:default`.
- **`vigenteDesde`**: un recordatorio no avisa por ocurrencias anteriores a que existiera
  (o a que se le cambiara la fecha, la hora o la repetición). Sin esto, crear a las 11 uno
  diario «a las 9» avisaba en el acto. Consecuencia: uno **de todo el día para hoy**
  creado hoy no avisa hoy —su momento es la medianoche, anterior a crearlo—.
- **Vencido**: con hora, si llega más de dos minutos tarde (un tic del programador es un
  minuto); de todo el día, si su día ya no es hoy. Se marca «Era a las 10:00», «Era ayer a
  las 10:00» o «Era el 20 de septiembre».
- **Pospuesto y repetición**: si una ocurrencia pospuesta queda detrás de otra más nueva
  del mismo recordatorio, manda la nueva (sigue valiendo «una sola vez por la más
  reciente»).
- **«Abrir» no descarta**: abre la pestaña en ese día con el recordatorio resaltado y la
  tarjeta sigue hasta Listo o Posponer. El panel lateral no resalta: «Abrir» va a la
  pestaña.
- **Archivo dañado**: el calendario arranca vacío y **no se escribe** mientras tanto; si
  se crea o cambia algo, se avisa una vez que no se está guardando.
- **Limpieza**: al cargar y al borrar se tira el estado de ocurrencias de más de 31 días
  (salvo las pospuestas a futuro) y el de recordatorios borrados; si no, uno diario
  sumaría una entrada por día para siempre.
- **Semana de lunes a domingo**; los días de meses vecinos que asoman en la grilla también
  muestran sus recordatorios.
- **Al guardar** el formulario se pasa a «ver» el recordatorio; seguir un `[[enlace]]`
  desde el formulario abre la nota detrás **sin cerrarlo**, para no perder lo escrito.
- **Nombres de los colores**: Hifa, Musgo, Liquen, Yesca, Amanita, Coral, Espora, Bruma.
  Un juego de valores para claro y otro para oscuro, medidos contra lienzo y niebla de los
  dos temas (peor caso 3.78:1 en claro, 6.0:1 en oscuro); no hizo falta uno por tema.

### Qué falta o no se pudo

- **Probar en la app** los criterios visibles: 1–5, 7 y 8 (la notificación y su clic, en
  especial con la app **instalada**, que es la que tiene AppUserModelID; en desarrollo el
  toast sale a nombre de PowerShell) y 10–13.
- Si Windows quita el toast del centro de actividades después de cerrarse Mycelium, un
  clic ahí relanza la app como cualquier acceso directo (ventana nueva). No hay forma de
  evitarlo sin registrar un activador COM.
- Renombrar una nota **no** actualiza los `[[enlaces]]` de los recordatorios (ya estaba
  fuera de esta versión, § 4.3).
- Los tests puros cubren los criterios **6, 7 y 9** enteros y la lógica de **4 y 5**
  (cuándo toca y cuándo es vencido); el resto es de UI o de integración.

## Saltar lejos: el selector de mes y año

Pedido por el usuario el 2026-09-25, al probar la primera versión: con solo «mes anterior /
siguiente», ir cinco años atrás eran sesenta clics. Es parte de `FUN-L-22`, que todavía no
estaba cerrada, así que no lleva número propio.

- **El título del mes es un botón** («septiembre 2026») que abre un selector, en la pestaña y
  en el panel (`components/recordatorios/SelectorMes.tsx`).
- **El año** se mueve de a uno (`‹ ›`) o de a diez (`« »`), o se escribe; en el campo, las
  flechas ↑ ↓ también lo cambian. Solo salta con un año completo: escribir «20» camino a
  «2021» no lleva al año 20.
- **Los doce meses** en una grilla: el que se está mirando va relleno, y el de hoy,
  contorneado. Elegir uno lleva ahí y cierra.
- **«Ir a hoy»** al pie: el panel no tiene botón «Hoy» propio y quedaba varado en el año al
  que se había saltado.
- Se cierra con Escape (devolviendo el foco al título) o haciendo clic afuera.

Verificado con Playwright el mismo día: de septiembre de 2026 a marzo de 2021 en cinco
clics, a diciembre de 1998 escribiendo el año, y de vuelta con «Ir a hoy».

## Marcar como completado

Pedido por el usuario el 2026-09-27: poder marcar un recordatorio como completado, y que su
color se ponga más oscuro. Parte de `FUN-L-22`, sin número propio. En desktop `d8c9ed0`,
en web `0030a69` (los componentes y el modelo son idénticos en las dos).

- **Es por ocurrencia**: en uno que se repite, completar el del lunes no completa el del
  martes. Se guarda en `ocurrencias[clave].completada`.
- **Dónde se marca**: una casilla a la izquierda de cada ítem de la lista, y el botón
  «Marcar como completado» en el detalle, que marca la ocurrencia del día desde el que se
  abrió.
- **Cómo se ve**: el color del recordatorio **se oscurece** —mezclado con negro, para que se
  lea apagado en claro y en oscuro— en el chip, la lista, el punto del mes compacto (si todo
  lo de ese color ese día está completado) y el borde del detalle. Para no depender solo del
  color, el chip lleva un ✓ y el título va **tachado y apagado**.
- **No es «Listo»**: «Listo» descarta un aviso; completado es un estado visible. Una
  ocurrencia completada **tampoco avisa**. «Listo» y «Posponer» ya no borran la marca al
  reemplazar el estado de aviso.
- **Se conserva**: la limpieza de estados de más de 31 días no la tira. Lo completado es
  historia y se ve en el calendario aunque sea de hace un año.

Seis tests nuevos (29 en total). **Sin probar en la app**: la de desarrollo abierta era de
otra sesión.

> [!warning] Lo rompió en el formulario, el mismo día (`7935f5d` desktop · `c899a83` web)
> La casilla de la lista se llamó `.casilla`, pero ese nombre **ya era** el de la etiqueta
> «Todo el día» del formulario, en el mismo módulo CSS. La segunda definición le cambió el
> tamaño, el borde y el color: el texto quedaba negro sobre el fondo oscuro, en una columna
> angosta, con un recuadro de más encima del checkbox. Lo vio el usuario; pasó a llamarse
> `.casillaCompletar`.
>
> **La lección**: `Recordatorios.module.css` es **un solo módulo** para la pestaña, el panel,
> el modal y la tarjeta. Antes de agregarle una clase, buscar si el nombre ya existe
> (`grep -n "^.nombre" Recordatorios.module.css`): en un CSS Module dos reglas con el mismo
> nombre no chocan, se suman, y `tsc` no lo ve.

## Cómo quedó en web

Reflejado a `web-cloud` el 2026-09-25 (merge `07a7727`, rama `feat/calendario-web`),
**adaptado**: no fue copiar código, porque en web no hay carpeta de vault ni Rust.

- **Iguales a desktop**: el modelo (`lib/recordatorios.ts`) y sus 23 tests, todos los
  componentes de `components/recordatorios/` —vistas, formulario, tarjetas, selector de mes
  y año— y los tokens de color.
- **Guardado**: un **documento JSON por vault**, con el mismo formato que
  `recordatorios.json`, en la tabla `recordatorios_vault` (en `d1/schema.sql` y en
  `local_schema.sql`). Endpoints `GET` y `PUT /vaults/{id}/recordatorios`
  (`RecordatoriosEndpoints.cs`): el servidor no interpreta el documento, solo lo guarda. Leer
  pide acceso al vault; escribir, rol editor o propietario. Cuerpo: objeto JSON de hasta 1 MB.
- **Avisos**: la misma tarjeta, y en lugar de la notificación de Windows, la del
  **navegador** cuando la pestaña está oculta o sin foco. El permiso se pide al guardar el
  primer recordatorio con hora, no al cargar la página.
- **Ciclo del vault**: en web no hay `vaultSessionStore`; los recordatorios se cargan y se
  vacían con el `vaultId` del workspace.

> [!warning] Limitaciones de web
> - **Varios dispositivos**: gana la última escritura. Dos navegadores editando el
>   calendario a la vez pueden pisarse.
> - **D1 en producción**: la tabla nueva hay que aplicarla a mano con
>   `wrangler d1 execute … schema.sql`, como el resto del esquema, al desplegar.
> - Quien solo tiene una **carpeta compartida** (sin rol en el vault) ve el calendario vacío:
>   los recordatorios son del vault.

Verificado: `dotnet build`, `npm ci`, `tsc`, `next build` y los 14 scripts de test; los
endpoints, contra el backend local con curl (200, 400, 401, 403 y 413 donde corresponde). **Sin
probar en el navegador** todavía.

## Relacionadas

- [[BACKLOG]] — `FUN-L-22`, y `FUN-M-07` (nota diaria), que es otra cosa.
- [[avisos-y-confirmaciones]] — los avisos efímeros y `DialogoConfirmar`.
- [[preferencias-por-vault]] — `.mycelium/` como el lugar de lo que es del vault.
- [[Los temas los define Mycelium, no el usuario]] — por qué la paleta es fija.
