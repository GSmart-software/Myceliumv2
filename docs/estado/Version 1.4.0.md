# Versión 1.4.0

**Solo desktop** (`desktop-tauri`) · 2026-08-03 · un minor sobre [[Version 1.3.0]]

Un solo tema: **Mycelium se actualiza solo**. Entran dos funcionalidades que comparten
toda la infraestructura — [[autoactualizacion]] (`FUN-L-14` · `UPDATER-AUTOACTUALIZACION`)
y la **selección de versión** (`FUN-M-16` · `UPDATER-SELECCION-VERSION`), que es su modo
avanzado.

> [!success] Publicada el 2026-08-03, con la mitad del circuito ya verificada
> El bucket existe, las claves están generadas y **esta versión está publicada**: sus dos
> instaladores, sus firmas y los tres manifiestos están en R2. Comprobado de verdad, no por
> deducción: los manifiestos responden y parsean, la firma del manifiesto es idéntica al
> `.sig`, y el `.exe` **descargado del bucket** tiene el mismo SHA-256 que el que se firmó
> — que es el fallo que solo aparecería cuando alguien intentara actualizar.
>
> **Lo que falta verificar es la otra mitad**: que un Mycelium instalado *detecte* esta
> versión, la descargue, verifique la firma, instale y reinicie. Eso no se puede probar
> desde acá — hace falta una `1.4.0` instalada y una `1.4.1` publicada después.

> [!warning] La 1.4.0 hay que instalarla a mano, una vez
> Es la primera versión que lleva la clave pública, así que ninguna anterior puede
> autoactualizarse a ella. El instalador está en `installers/v1.4.0/` y en el bucket. A
> partir de ella, ya no hace falta.

## El changelog que ve el usuario

Lo que sigue, y **solo** lo que sigue, es lo que `npm run publicar` copia al manifiesto y
lo que Mycelium renderiza en el diálogo de actualización. Los delimitadores son
comentarios HTML: no se ven al leer la nota. Sin ellos el script **no publica** — ver
[[Publicar una version]] § 2.

<!-- notas-release:inicio -->
## Mycelium se actualiza solo

- **Te avisa cuando hay una versión nueva**, una vez al día y sin interrumpir. Si no hay
  conexión no pasa nada: se reintenta al día siguiente.
- **Ves qué trae antes de decidir.** El resumen de cada versión aparece en el propio
  diálogo, con el mismo formato que tus notas.
- **Actualizás con un clic.** Se descarga con barra de progreso, se instala y Mycelium se
  reinicia solo. Podés seguir trabajando mientras descarga.
- **Nunca te obliga.** *Más tarde* vuelve a ofrecerla mañana; *Omitir esta versión* no la
  vuelve a mencionar y espera a la siguiente.
- En **Configuración → Vault → Actualizaciones** tenés un botón para buscar ahora mismo
  —que también te dice cuando **no** hay nada nuevo— y un interruptor para apagar la
  comprobación automática.

> Esta es la primera versión que puede actualizarse sola. Es la última vez que hace falta
> instalar Mycelium a mano.
<!-- notas-release:fin -->

## Por qué sube un minor y no dos

Un release, **un** incremento: el tamaño del salto lo decide el cambio más significativo,
no cuántos cambios lleva. Dos funcionalidades juntas suman **un** minor, y al subir el
minor el patch vuelve a `0`: de `1.3.0` se pasa a `1.4.0`. Ver [[Versionado del sistema]].

Y es minor y no patch porque el usuario puede hacer algo que antes no podía: **enterarse
de que existe una versión nueva e instalarla desde la app**, sin que se lo digan y sin
buscar un instalador.

`FRAMEWORK_IA_VERSION` **no cambia** (sigue en `1.4.0`, que es coincidencia de números):
actualizar la app no altera nada de lo que la IA debe saber del vault.

## Qué hace

- **Comprueba una vez al día**, en el primer arranque de la jornada, en segundo plano.
  Si no hay conexión, **silencio absoluto**: no es un error del usuario que su wifi esté
  caído, y se reintenta al día siguiente.
- **Muestra qué trae** antes de decidir: el changelog llega en Markdown dentro del
  manifiesto y se renderiza con el **motor de Mycelium**, el mismo que dibuja las notas.
- **Tres salidas**: *Actualizar* (descarga con progreso, instala y reinicia), *Más tarde*
  (mañana se vuelve a ofrecer) y *Omitir esta versión* (no se menciona más **esa**
  versión; se avisa cuando salga otra).
- **Nunca obliga y nunca bloquea.** No hay actualización silenciosa ni forzada, la app
  abre igual aunque el servidor no responda, y mientras descarga se puede seguir
  trabajando.
- Un botón **Buscar actualizaciones** en Configuración → Vault, que informa **también
  cuando no hay nada nuevo**, y un interruptor para apagar la comprobación automática.

### El modo avanzado (`FUN-M-16`)

**Siete clics sobre el número de versión** en el pie de Configuración. Es el gesto de
Android y Chrome para el modo desarrollador: imposible de encontrar por accidente,
trivial de recordar, y no agrega ninguna superficie visible. Con él aparecen:

- El **servidor de actualizaciones** configurable (§ "Endpoint configurable").
- La **lista de versiones publicadas**, con su fecha, marcando cuál está instalada, y con
  la posibilidad de instalar cualquiera —**incluida una anterior**— siempre con
  confirmación.

Elegir una versión a mano la deja **fijada**: la comprobación automática deja de avisar y
Configuración muestra que estás en una versión fijada, con el botón para volver a seguir
las actualizaciones. Si bajaste para investigar algo, que la app te empuje a subir cada
día es exactamente lo contrario de lo que necesitás.

> [!danger] Bajar de versión: qué se rompe y qué no
> **Las notas están a salvo.** Son archivos de texto en disco: ninguna versión puede
> corromperlas por ser vieja. El índice SQLite tampoco preocupa — es derivado y se
> reconstruye solo.
>
> **Lo que sí se pierde son las pestañas y parte de las preferencias**: los stores usan
> `persist` de Zustand con número de versión, y un desajuste sin `migrate` descarta el
> estado guardado (ver [[Estado con Zustand]]). Por eso el diálogo de confirmación lo
> **avisa antes**, no después.

## Las decisiones que valía la pena tomar

### Todo el motor vive en Rust, no en el webview

No es una preferencia de estilo: es lo único que funciona.

`UpdaterBuilder::version_comparator` —lo que permite instalar una versión **anterior** sin
salirse del plugin oficial— **solo existe del lado Rust**; el comando JS del plugin no lo
expone. El comparador **sustituye por completo** al `>` por defecto, así que devolviendo
`true` se instala cualquier versión. Del otro lado, el instalador NSIS lo permite porque
`bundle.windows.allowDowngrades` vale su default.

> [!danger] Nunca poner `bundle.windows.allowDowngrades` en `false`
> Es `true` por defecto y el proyecto **no lo define**, que es como tiene que seguir.
> Ponerlo en `false` mata `FUN-M-16` de raíz — y lo haría **en silencio**: el plugin
> aceptaría la versión y el fallo aparecería recién al instalar, en la máquina del usuario.

De paso, tener el motor en Rust resuelve otra cosa: la petición del manifiesto la hace
`reqwest` y no `fetch`, así que **no interviene ninguna política de navegador** y el
bucket no necesita configurar CORS.

### El estado del updater no vive en las preferencias del vault

La spec decía "en `Preferencias`, como el resto". Al implementarlo apareció el motivo por
el que no puede ser: las preferencias viven en la **fila del usuario dentro del índice
SQLite de cada vault** y se hidratan **después** de abrirlo.

Eso rompe dos cosas de esta funcionalidad:

- La comprobación ocurre **al arrancar**, cuando puede no haber ningún vault abierto.
- "Omití la 1.4.0" o "no busques actualizaciones" son decisiones **de la instalación**,
  no de un vault: con las preferencias del vault, omitir una versión en un vault y que
  otro te la siguiera ofreciendo sería un defecto, no una función.

Así que van a `actualizador.json` en el config-dir de la app, con el **mismo mecanismo**
que ya usaba `vaults.json` (`vault_config.rs`) para la lista de vaults y "abrir el último
al iniciar" — que son exactamente el mismo tipo de ajuste, global a la instalación.

### El botón manual no es una comodidad

Si en un mismo día se publican **dos** versiones, lo que ve el usuario depende de a qué
hora arrancó: puede no ver ninguna, ver solo la primera o ver solo la última. Con una
comprobación al día no hay forma de cubrir eso, y subir la frecuencia contradice lo que se
pidió. El botón lo resuelve sin tocar la cadencia; por eso **no se puede recortar** por
"poco usado".

### Guardar lo pendiente antes de reiniciar

Los editores guardan con **debounce**: entre la última tecla y la escritura real pasan
cientos de milisegundos. Actualizar cierra la app, así que perder la última frase que
escribió el usuario **por actualizar** era el peor resultado posible de esta funcionalidad.

`lib/guardadoPendiente.ts` es un registro donde cada editor montado deja una función que
vuelca **ya** lo que tenga pendiente. Antes de lanzar el instalador se ejecutan todas y se
**espera** a que terminen. Se registran el editor de notas y el de Excalidraw.

### Endpoint configurable

La URL del manifiesto queda **compilada dentro de cada copia**, así que cambiarla algún
día dejaría a las instalaciones existentes sin actualizaciones. Que se pueda fijar en
tiempo de ejecución convierte ese problema en cambiar un ajuste — y, mientras tanto, es lo
que permite **probar contra un bucket de pruebas** sin arriesgar a nadie.

### Degradar con elegancia sin claves

La clave pública y el endpoint salen de fábrica con **marcadores reconocibles**. Mientras
sigan así, el updater está **desactivado con su motivo a la vista** en Configuración: no
hace ninguna petición, no revienta y no falla en silencio. Es el estado en el que está
Mycelium hoy, y lo seguirá estando hasta que se haga [[Publicar una version]] § 1.

## Dónde vive el código

| Archivo | Qué hace |
|---|---|
| `frontend/src-tauri/src/actualizador.rs` | El motor: config persistida, comprobación, `versions.json`, descarga con progreso e instalación. 3 tests de unidad |
| `frontend/lib/updater.ts` | Tipa los comandos `updater_*` y aporta las dos cuentas del webview: qué día es hoy (huso local) y si una versión es anterior a otra |
| `frontend/stores/updaterStore.ts` | El flujo como una máquina de fases; la diferencia entre la comprobación silenciosa y la manual vive acá |
| `frontend/components/workspace/UpdateDialog.tsx` | El diálogo, con el changelog por `renderMarkdown` y el progreso de descarga |
| `frontend/components/settings/UpdaterSection.tsx` | Configuración: botón manual, interruptor, versión fijada, endpoint y lista de versiones |
| `frontend/lib/guardadoPendiente.ts` | Registro de guardados con debounce, para vaciarlos antes de reiniciar |

## Qué hay que hacer fuera del código

Esta es la primera funcionalidad que le deja a Mycelium **cosas que mantener fuera del
repositorio**: un bucket de R2 que tiene que seguir existiendo, una clave privada
custodiada durante toda la vida del producto, y un formato de manifiesto que hay que
mantener correcto en cada release. El paso a paso está en [[Publicar una version]].

> [!warning] Desde ahora, `tauri build` exige la clave de firma
> `bundle.createUpdaterArtifacts` pasó a `true` (es lo que genera los `.sig`), así que
> compilar **falla** si no están `TAURI_SIGNING_PRIVATE_KEY` y su contraseña. Es a
> propósito: una versión sin firmar no puede instalarse como actualización, y es mejor
> enterarse al compilar que al publicar.

## Cómo comprobarlo en la app

Los criterios completos están en [[autoactualizacion]] § 5. **Ninguno de los que tocan la
red se puede probar hasta que exista el bucket** ([[Publicar una version]] § 1); una vez
que exista, el § 4 de ese mismo documento explica cómo montar el ensayo contra un bucket
de pruebas sin arriesgar a nadie.

Lo que **sí** se puede comprobar hoy, sin bucket:

| Criterio | Cómo |
|---|---|
| 3 · Sin conexión no molesta | Abrir Mycelium: arranca normal y no aparece ningún error del updater |
| 11 · Con la comprobación apagada no hay red | Configuración → Vault → Actualizaciones → apagar el interruptor |
| 12 · El botón informa | "Buscar actualizaciones" sin configurar dice **por qué** no puede |
| 14 · El modo avanzado no existe hasta pedirlo | La sección de versiones no está; siete clics en el número de versión del pie y aparece |
| Degradación sin claves | Actualizaciones muestra el motivo, no un panel roto ni un error |

## Verificación

- `npx tsc --noEmit -p tsconfig.json` en verde (exit 0).
- `cargo check` en verde — **acá sí se tocó Rust** (plugin nuevo + módulo nuevo).
- `cargo test --lib actualizador` — 3 casos en verde.
- `node scripts/test-frontmatter.mjs` y `node scripts/test-esporas.mjs` — no-regresión.

Ver [[Verificar antes de integrar]]: nada de esto prueba comportamiento visible, y en esta
funcionalidad menos que en ninguna — el circuito real no se ha ejecutado nunca.

## Instaladores

**Todavía no generados**, y ahora además no se pueden generar sin la clave de firma
(§ "Qué hay que hacer fuera del código"). Procedimiento en [[Generar instaladores desktop]].

## Reflejo a web

**No aplica.** La web se actualiza sola al recargar la página: no hay nada que instalar.
Es una de las [[Diferencias funcionales aceptadas entre versiones]] que por naturaleza no
tiene equivalente en `web-cloud`, como la terminal o el framework de IA.

## Relacionadas

- [[Version 1.3.0]] — el release anterior.
- [[autoactualizacion]] — la spec, con los 19 criterios de aceptación.
- [[Publicar una version]] — lo que hay que hacer para que esto funcione de verdad.
- [[Generar instaladores desktop]] — el empaquetado, que ahora emite los `.sig`.
- [[Versionado del sistema]] — por qué dos funcionalidades suman un solo minor.
- [[Estado con Zustand]] — por qué bajar de versión pierde las pestañas.
- [[BACKLOG]] — `FUN-L-15`, la automatización de la publicación.
- [[Estado del proyecto]] — situación actual.
