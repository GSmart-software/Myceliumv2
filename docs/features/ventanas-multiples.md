# Varios vaults a la vez, uno por ventana (`FUN-L-16` · `VAULT-VENTANAS-MULTIPLES`)

Poder tener **varios vaults abiertos simultáneamente**, cada uno en su propia ventana.
Hasta ahora abrir uno cerraba el anterior: solo se podía mirar uno a la vez.

> [!info] Estado
> Implementada en desktop el 2026-08-13. **Solo-desktop** por naturaleza: en web no hay
> ventanas nativas ni carpeta que vigilar.

---

## 1. Por qué era `L` y no `M`

Tauri sabe abrir varias ventanas, y cada una es un webview con su **propio contexto de
JavaScript**: los stores del frontend no se pisan entre sí, y eso sale gratis.

Lo que costaba era todo lo que en **Rust** era global a la app y en realidad pertenece a una
ventana:

| Estado | Qué pasaba con dos ventanas |
|---|---|
| `WatcherState` | Era **un** `Option`. La segunda ventana le robaba el watcher a la primera, que dejaba de enterarse de los cambios de su carpeta **sin ningún aviso** |
| Eventos del watcher | `app.emit` los mandaba a **todas** las ventanas: cada una reindexaba su vault por cambios de la carpeta ajena |
| Sesiones de terminal | El mapa es global; la salida se emitía con `app.emit`, así que llegaba a ventanas que no eran su dueña |
| Nada sabía **qué vault** tenía cada ventana | Sin eso no se puede impedir abrir el mismo dos veces |

La corrección es la misma en los tres casos: **la ventana pasa a ser el ámbito**. El watcher
se guarda en un mapa `etiqueta → debouncer`, los eventos se emiten con `window.emit` en vez
de `app.emit`, y cada sesión de terminal recuerda su ventana.

---

## 2. Las decisiones que el backlog dejaba abiertas

### ¿Dos ventanas pueden abrir el MISMO vault? **No**

Es la que más importa, porque es la única con riesgo de datos. Cada ventana abre el índice
SQLite de su vault y lanza su propio watcher sobre la carpeta: dos ventanas sobre el mismo
vault serían **dos indexadores escribiendo el mismo índice** y dos watchers reaccionando a
los escritos del otro.

Coordinar eso es un problema de concurrencia real, no un detalle de interfaz. Así que se
impide: si el vault ya está abierto, **se levanta esa ventana** en lugar de duplicarlo. Y si
se intenta abrir en la misma ventana, `registrar_vault` falla con un motivo legible.

La comparación de rutas tolera mayúsculas y las barras de Windows: `C:\Notas\Vault` y
`c:/notas/vault` son la misma carpeta y no deben poder abrirse dos veces.

### ¿Qué pasa con las terminales al cerrar una ventana? **Mueren con ella**

Sus shells son suyas. Al cerrarse, se matan sus procesos: dejarlos vivos sería dejar
procesos sin nadie que los lea ni pueda cerrarlos.

### ¿El grafo y la búsqueda son por ventana? **Sí, y sale gratis**

Viven en stores de JavaScript, y cada ventana tiene su propio contexto.

### ¿Cada ventana recuerda su vault al reabrir la app? **Todavía no**

Al arrancar se abre una sola ventana, con el último vault si el ajuste está activo. Restaurar
el juego de ventanas es trabajo aparte.

---

## 3. Cómo se usa

En el selector de vaults, cada uno tiene ahora dos acciones: **Abrir** (en esta ventana,
como siempre) y **Abrir en una ventana nueva**.

---

## 4. Dos trampas del empaquetado que costaron encontrar

> [!warning] La ventana nueva nace sin permisos si su etiqueta no está en la capability
> `capabilities/default.json` listaba `"windows": ["main"]`. Cualquier ventana con otra
> etiqueta habría arrancado **sin permisos**: sin SQL, sin diálogos, incapaz de abrir nada.
> Por eso las etiquetas son `vault-<timestamp>` y la capability lista `vault-*`.

> [!warning] La ruta del workspace NO es la misma en desarrollo que empaquetada
> Y hay que distinguirlas con `tauri::is_dev()`, o la ventana abre en blanco justo en uno
> de los dos entornos:
>
> | | Qué resuelve | Qué falla |
> |---|---|---|
> | **Empaquetado** | `workspace.html` — el export genera el archivo suelto | `/workspace`: no hay `workspace/index.html` |
> | **Desarrollo** | `/workspace` — el servidor de Next sirve la ruta | `workspace.html`: no conoce ningún `.html` |
>
> Nunca se había notado porque la ventana principal llega al workspace navegando por el
> cliente, sin pedirle el archivo a nadie. **Consecuencia práctica**: sin esto la
> funcionalidad solo se podría probar tras compilar e instalar, que es justo lo que no
> conviene para iterar.

El vault viaja en la URL y no en un estado compartido porque la ventana nueva arranca con su
`sessionStorage` vacío: tiene que saber por sí misma qué abrir.

---

## 5. La instancia única, que hasta ahora nadie había mirado

`tauri-plugin-single-instance` está desde las asociaciones de archivo: doble clic en un `.md`
tiene que abrirlo en el Mycelium que ya corre, no lanzar otro. Al arrancar crea un mutex
—con nombre derivado del `identifier`— y si ya existe **reenvía su `argv` a la instancia
viva, le enfoca la ventana y hace `std::process::exit(0)`**.

Con `FUN-L-16` dejó de ser un detalle de comodidad y pasó a ser **carga estructural**:
`VentanasState` vive en el proceso, así que la garantía de «un vault en una sola ventana»
vale *mientras haya un solo proceso*. Dos Mycelium serían exactamente los dos indexadores
sobre el mismo índice que la § 2 se propuso evitar, y ninguno sabría del otro.

Eso deja dos cosas que arreglar, las dos encontradas al intentar levantar un segundo
Mycelium desde la consola:

### El evento `open-files` llegaba a todas las ventanas

El callback emitía con `app.emit`, que es difusión a la app entera. Cada webview tiene su
`FileOpenBridge`, y ese puente **crea la nota** si no encuentra una con ese título — así que
con dos ventanas abiertas, abrir un `.md` desde el explorador de Windows lo importaba en
**los dos vaults**, una copia en cada uno.

Es la misma clase de fallo que la § 1 corrigió en el watcher y en la terminal —estado global
a la app que en realidad pertenece a una ventana—, pero este puente había quedado fuera de
esa revisión. Ahora se resuelve **una** ventana destino (la que tiene el foco; si ninguna, la
principal) y se emite solo ahí.

### En desarrollo el plugin no se registra

> [!warning] El mutex se nombra **solo** con el `identifier`
> No lleva la versión —la feature `semver` del plugin no está activada— ni distingue el
> binario de desarrollo del instalado. Con el plugin activo en `tauri dev`, **los dos se
> excluyen entre sí**: no se puede tener Mycelium abierto mientras se lo desarrolla, y el
> segundo lanzamiento se cierra solo sin decir por qué. El único mensaje visible es el aviso
> de que el puerto 3000 está ocupado, que es ruido: `next dev` lo ve, avisa y se pasa al 3001
> él solo.

Por eso ahora se registra con `if !tauri::is_dev()`. Perder la instancia única en desarrollo
no cuesta nada —las asociaciones de archivo apuntan al ejecutable **instalado**, así que ese
camino no se puede ejercitar en `tauri dev` de todos modos— y a cambio se puede tener el
Mycelium instalado abierto al lado del que se está desarrollando.

Para levantar un segundo Mycelium de desarrollo hay `npm run tauri:otra`, que **ejecuta
directamente el binario ya compilado** (`src-tauri/target/debug/app.exe`). Como está
construido en modo desarrollo, se conecta solo al `next dev` que ya esté en marcha.

> [!warning] No sirve un segundo `tauri dev`
> El primer intento fue `tauri dev` con el `beforeDevCommand` anulado, para no pelear por el
> puerto 3000. **No funciona**: `tauri dev` siempre corre `cargo run`, que **reenlaza el
> binario**, y Windows no deja reemplazar un `.exe` que se está ejecutando — falla con
> «Acceso denegado (os error 5)». El puerto era solo la mitad del problema.

**Es una herramienta de desarrollo, no un modo de uso**: dos procesos tienen cada uno su
`VentanasState`, así que **sí pueden abrir el mismo vault** — justo lo que la instancia única
impide en producción.

---

## 6. Verificación

Se puede probar **en desarrollo** (`npm run tauri dev`), sin compilar ni instalar: la
ventana nueva resuelve su URL según el entorno (§ 4). Lo único que sigue exigiendo el
paquete es el instalador en sí.

- `cargo check` y `cargo test --lib` (26 tests, dos nuevos: comparación de rutas y el
  escapado de la URL) · `npx tsc --noEmit` · `npx next build`.
- A mano, que es donde esto se prueba de verdad:
  1. Abrir el vault A en la ventana principal.
  2. Volver al selector y abrir **B en una ventana nueva**: dos ventanas, cada una con lo suyo.
  3. Crear un archivo en la carpeta de A **desde fuera** → solo la ventana de A se refresca.
  4. Intentar abrir A en la ventana de B → se levanta la ventana de A, no se duplica.
  5. Abrir una terminal en cada ventana → la salida no se cruza.
  6. Cerrar la ventana de B → sus shells mueren y B se puede volver a abrir.

Lo de la § 5 se comprueba aparte, y una de las dos cosas **solo en el paquete**:

- En desarrollo: con `tauri dev` corriendo, abrir el Mycelium **instalado** → arranca, no se
  cierra solo. Y `npm run tauri:otra` levanta un segundo Mycelium de desarrollo sin tocar el
  puerto.
- **Instalado** (la instancia única no existe en desarrollo): con dos ventanas abiertas sobre
  vaults distintos, doble clic en un `.md` de fuera del vault → aparece en **una sola**
  ventana, la que tenía el foco. Antes se importaba en las dos.

## Relacionadas

- [[BACKLOG]] — `FUN-L-16` y `FUN-L-04`, su prerrequisito natural.
- [[vault-en-carpeta]] — el vault como carpeta real, sobre el que se apoya todo esto.
- [[terminal-integrada]] — las sesiones que ahora pertenecen a una ventana.
- [[Bugs_errores_y_defectos]] — `DEF-044`, que ya había hecho el estado de pestañas por vault.
- [[Mapa de documentacion]] — índice general.
