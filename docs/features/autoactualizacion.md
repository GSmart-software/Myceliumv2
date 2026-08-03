# Autoactualización (`FUN-L-14` · `UPDATER-AUTOACTUALIZACION`)

Spec de la actualización asistida del escritorio: Mycelium comprueba una vez al día si hay
una versión nueva, muestra **qué trae** y ofrece instalarla. Nunca obliga y nunca bloquea.

> [!info] Alcance: **SOLO-DESKTOP**, por naturaleza
> La web se actualiza sola al recargar la página: no hay nada que instalar. Esta es una de
> las [[Diferencias funcionales aceptadas entre versiones]] que no tiene equivalente en
> `web-cloud`, como la terminal o el framework de IA.

> [!important] Funcionalidad nueva → **minor** cuando salga
> Y la primera que le da a Mycelium una **dependencia de infraestructura propia**: un
> bucket que hay que mantener y una clave que hay que custodiar. Ver el § 6.

---

## 1. Qué es y por qué

Hoy publicar una versión es: compilar, copiar el instalador a `installers/v<version>/`,
hacérselo llegar al usuario y que lo instale a mano. El usuario no tiene forma de enterarse
de que existe una versión nueva salvo que se lo digan.

**Objetivo**: que el usuario se entere solo y actualice con un clic — sin que eso se
convierta en una app que interrumpe, insiste o se actualiza por su cuenta. La actualización
es una oferta, no un trámite.

Reglas que fija el usuario y que la implementación no puede negociar:

1. **No bloqueante siempre.** Ni al arrancar ni al actualizar. Si no hay conexión, no pasa
   nada y no se avisa de nada: no es un error del usuario que su wifi esté caído.
2. **Nunca obliga.** No hay actualización silenciosa ni forzada.
3. **Una comprobación al día**, en el primer arranque de la jornada. No en cada apertura.
4. **Se ve qué trae** antes de decidir.

---

## 2. Estado de partida (verificado en el repo)

| Pieza | Cómo está hoy |
|---|---|
| `tauri-plugin-updater` | **No está**, ni el crate ni el paquete npm. Hay que añadirlo |
| `bundle.createUpdaterArtifacts` | Existe en la CLI 2.11 y está en **`false`** (su valor por defecto). Es lo que genera los `.sig` |
| Firma | **No hay claves.** El workflow dice explícitamente "SIN firmar" |
| `bundle.targets` | `"all"` → en Windows produce **MSI (WiX) y NSIS** |
| `bundle.windows.wix.upgradeCode` | Fijado. **No se toca nunca**: es la identidad de la app para Windows |
| `bundle.windows.allowDowngrades` | No está definido → vale su defecto, **`true`**. Es lo que hace posible `FUN-M-16`; no tocarlo |
| CI | `.github/workflows/desktop-build.yml` ya usa `tauri-apps/tauri-action` y crea un Release en borrador al empujar un tag `v*` |
| Notas de release | Ya existen y están bien escritas: `docs/estado/Version X.Y.Z.md` |
| Preferencias | `stores/preferencesStore.ts` (tipo `Preferencias`, guardado con debounce) |

Dos cosas que salen de acá y ahorran trabajo: el **changelog ya está escrito** (las notas de
release son la fuente), y **el CI ya sabe compilar y publicar** — hay que enseñarle a firmar
y a subir a R2, no a construir.

---

## 3. Las piezas

### 3.1 El plugin y la firma

Se usa el **plugin oficial** `tauri-plugin-updater` (crate + `@tauri-apps/plugin-updater`).
Hace lo que hay que hacer y no conviene reimplementarlo: descarga, **verifica la firma**,
instala y reinicia.

- `bundle.createUpdaterArtifacts: true` en `tauri.conf.json`.
- Claves con `npx tauri signer generate`. La **pública** va en la config del plugin (se
  compila dentro de la app); la **privada** firma cada release y vive fuera del repo.
- Endpoint del updater: la URL del manifiesto en R2 (§ 3.2).

> [!danger] La clave privada es el activo más delicado del proyecto
> **Si se pierde**: ningún Mycelium ya instalado podrá volver a actualizarse jamás. La
> pública está compilada dentro de cada copia, así que una clave nueva no valida nada de lo
> que ya está en el mundo — habría que redistribuir a mano y empezar de cero.
>
> **Si se filtra**: cualquiera puede publicar una actualización que todas las instalaciones
> aceptarán como legítima y ejecutarán. Es ejecución de código arbitrario en la máquina del
> usuario, con su confianza.
>
> No entra en el repo, ni siquiera cifrada. Copia de seguridad fuera de la máquina de
> desarrollo. En CI, como secreto (`TAURI_SIGNING_PRIVATE_KEY` y su contraseña).

> [!warning] Los usuarios de hoy no se van a autoactualizar
> La clave pública se **compila** en el binario. La primera versión que la incluya es la
> primera que puede recibir actualizaciones; `1.3.0` y anteriores no tienen forma de
> verificar nada. Esa primera versión con updater hay que **instalarla a mano** — es la
> última vez.

### 3.2 Cloudflare R2 y el manifiesto

Un bucket de R2 con dominio público, sin Worker ni lógica: el updater de Tauri solo
necesita una URL que devuelva JSON.

**Qué hay que dar de alta, y nada más:**

| Pieza | Para qué | Coste |
|---|---|---|
| Cuenta de Cloudflare | — | Gratis |
| **Un bucket de R2** | Instaladores, `.sig`, `latest.json` y `versions.json` | Nivel gratuito: 10 GB y **egress gratis** |
| **Un dominio propio** en Cloudflare | Que la URL del manifiesto sea nuestra y no `r2.dev` | El registro del dominio |

Ni D1, ni Pages, ni KV, ni Workers. Cada versión ocupa ~18 MB entre MSI y NSIS: con 10 GB
entran cientos de versiones, y como R2 no cobra transferencia da igual cuánta gente
descargue.

> [!info] Sin dominio propio también se puede empezar
> El dominio es la única pieza con coste, y **no bloquea**. Se puede arrancar con la URL
> `pub-<hash>.r2.dev` que da Cloudflare: el updater la consulta igual y todo el circuito
> funciona. Lo que compra el dominio es **permanencia**, no funcionalidad.
>
> Cloudflare documenta que el acceso por `r2.dev` *"is rate-limited and should only be used
> for development purposes"* — con la escala de este proyecto, el límite no es el problema;
> la permanencia sí, porque la URL queda compilada en cada copia.
>
> **Qué pasa si algún día hay que cambiarla**: las copias instaladas dejan de detectar
> actualizaciones y necesitan **una reinstalación manual, una sola vez** — o sea, se vuelve
> a la situación de hoy. No se pierde nada ni se rompe nada.
>
> **Y migrar después es barato**: se publica una versión cuyo endpoint apunta al dominio
> nuevo, se mantiene vivo el manifiesto viejo hasta que todos la recojan, y cada copia queda
> apuntando sola a la URL nueva al instalarla. Solo quien no actualizó en esa ventana
> reinstala a mano.
>
> Para el dominio **no hace falta transferir nada**: Cloudflare admite *partial (CNAME)
> setup*, así que un dominio registrado en otro sitio se añade a la cuenta sin moverlo.

> [!tip] Mitigación que conviene igual: endpoint configurable
> El updater permite fijar los endpoints en tiempo de ejecución, así que Mycelium puede
> leerlo de una preferencia con el valor compilado como defecto. Cambiar de URL pasa a ser
> cambiar un ajuste en vez de reinstalar — y sirve además para **probar contra un bucket de
> pruebas** antes de publicar de verdad, que es justo lo que hace falta para verificar
> `FUN-L-14` de extremo a extremo sin arriesgar a los usuarios reales.

> [!note] Acá no hay problema de CORS
> Suele ser la primera preocupación y no aplica: la petición del manifiesto la hace el lado
> **Rust** del plugin, no el webview, así que no interviene ninguna política de navegador.

```
mycelium-releases/
├── latest.json                       ← el manifiesto que consulta la app
├── versions.json                     ← índice de todo lo publicado (FUN-M-16)
├── 1.4.0/
│   ├── Mycelium_1.4.0_x64-setup.exe
│   └── Mycelium_1.4.0_x64-setup.exe.sig
└── 1.3.0/
    └── …                             ← las versiones viejas se conservan
```

`latest.json` con el formato que espera el plugin:

```json
{
  "version": "1.4.0",
  "notes": "## Qué entra\n\n- Ver PDF y código en el vault…",
  "pub_date": "2026-08-10T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "<contenido del .sig>",
      "url": "https://<dominio>/1.4.0/Mycelium_1.4.0_x64-setup.exe"
    }
  }
}
```

- **`notes` lleva Markdown**, que es lo que la app renderiza (§ 4.2). Sale de la nota de
  release correspondiente.
- Se conservan las versiones anteriores en el bucket: sirven de archivo y permiten volver
  atrás si una versión sale mal.
- **R2 no cobra egress** y el nivel gratuito son 10 GB: con instaladores de ~9 MB esto no
  va a costar nada en mucho tiempo.

> [!important] Preferir un **dominio propio** a la URL `r2.dev`
> La URL del manifiesto queda **compilada dentro de cada copia de Mycelium**: las versiones
> ya instaladas seguirán consultando esa dirección. Con un dominio propio delante del
> bucket, mudar el almacenamiento el día de mañana es cambiar un DNS.
>
> No es bloqueante —ver el callout de abajo sobre empezar sin dominio— pero **si hay dominio
> disponible, se usa desde el principio**: es la opción que no hay que deshacer después.

> [!note] Un bucket público **no** expone ninguna credencial
> Pregunta que surgió al revisar la spec, y conviene dejarla contestada porque va a volver:
> sin Worker, ¿no queda una API key pública?
>
> **No.** R2 tiene dos accesos y solo uno usa claves. **Leer** el manifiesto y el instalador
> es un `GET` anónimo a una URL pública — la app no lleva token, no firma peticiones y no
> habla con la API S3. **Escribir** en el bucket sí necesita un token de R2, pero ese vive
> en la máquina de quien publica o como secreto del CI, y nunca viaja dentro de la app. Un
> Worker sería igual de público y anónimo: no cambia nada en ese frente.
>
> **La protección no es el transporte, es la firma.** Si alguien reemplazara el instalador
> dentro del bucket, Mycelium lo rechazaría igual: no coincidiría con la firma verificada
> contra la clave pública compilada en la app (criterio de aceptación 10). Por eso el bucket
> puede ser completamente público sin debilitar nada. Lo que hay que proteger es **escribir**
> —el token de R2 y, sobre todo, la clave privada de firma—, no leer.
>
> Corolario para quien implemente: **el cliente nunca lleva credenciales**. Si una solución
> las necesita para descargar, está mal diseñada.
>
> Un Worker tendrá sentido el día que se quieran canales beta/estable, despliegue gradual o
> contar instalaciones. Para seguridad, no aporta.

> [!important] El canal de actualización es **NSIS**, no MSI
> Los dos se siguen generando, pero el manifiesto apunta al `-setup.exe`. El motivo es
> concreto y está verificado en el schema de la CLI: el NSIS de Tauri instala por defecto
> en modo **`currentUser`**, así que actualizar **no dispara UAC**. El MSI instala por
> máquina y pediría elevación en cada actualización, lo que convierte "un clic" en "un clic
> y un diálogo del sistema".
>
> El MSI se sigue publicando para la instalación inicial y el despliegue silencioso.

### 3.3 El proceso de release cambia

[[Generar instaladores desktop]] pasa a tener un paso más y deja de terminar en
`installers/v<version>/`:

1. Consolidar la versión en los cuatro archivos **y `Cargo.lock`**.
2. Compilar (`CARGO_BUILD_JOBS=2 npx tauri build`) — ahora también emite los `.sig`.
3. Subir instalador y `.sig` a R2 bajo `<version>/`.
4. Escribir `latest.json` con la versión, la firma y las notas de la release.

Automatizar estos cuatro pasos **no entra en esta unidad**: primero se hacen a mano y se
comprueba que el circuito completo funciona. La continuación es `FUN-L-15` en el [[BACKLOG]].

> [!important] La automatización va en un **script local**, no en GitHub Actions
> Era lo natural —el workflow ya existe y ya usa `tauri-action`— pero arrastra una decisión
> que no tiene nada que ver con actualizar la app: usarlo obliga a **alinear `origin`**, que
> está 204 commits por detrás y es un repo público (ver [[RAMAS]]), y a meter la **clave
> privada de firma** como secreto de GitHub.
>
> Un `npm run publicar` que compile, firme, suba a R2 con `wrangler` y escriba los dos JSON
> consigue lo mismo que importa —que no haya pasos manuales que olvidar ni `.sig` que pegar
> mal— **sin tocar el remoto y sin que la clave salga de la máquina**. Decisión del usuario,
> 2026-08-03.

---

## 4. Comportamiento en la app

### 4.1 Cuándo comprueba

- Al arrancar, **si la última comprobación no fue hoy**. La fecha se guarda en
  `Preferencias` (`preferencesStore`), como el resto.
- **En segundo plano y sin bloquear** el arranque: si tarda o falla, Mycelium abre igual.
- **Sin conexión: silencio absoluto.** Ni aviso, ni icono de error, ni entrada en el log
  visible. Se reintenta al día siguiente.
- Además, un botón **"Buscar actualizaciones"** en Configuración → Vault (o su propia
  sección), que comprueba en el momento e informa también cuando **no** hay nada nuevo —
  ahí sí, porque lo pidió el usuario explícitamente.

> [!important] El botón manual no es una comodidad: tapa un agujero de la cadencia diaria
> Si en un mismo día se publican **dos** versiones, lo que ve el usuario depende de a qué
> hora arrancó: puede no ver ninguna (arrancó antes de las dos), ver solo la primera, o ver
> solo la última. Con una comprobación al día no hay forma de cubrir eso, y subir la
> frecuencia contradice lo que se pidió.
>
> El botón lo resuelve sin tocar la cadencia. Por eso **no se puede recortar** por
> "poco usado": es lo que hace que la comprobación diaria sea aceptable.
- Y un interruptor para **desactivar la comprobación automática**. "No obligar" incluye no
  obligar a que la app hable con un servidor.

### 4.2 El diálogo

```
╭─ Hay una versión nueva ───────────────╮
│                                       │
│  Mycelium 1.4.0    (tenés la 1.3.0)   │
│  ─────────────────────────────────    │
│  ## Qué entra                         │
│  • Ver PDF y código en el vault       │
│  • Resaltado de sintaxis              │
│                                       │
│  ### Correcciones                     │
│  • El ícono de Esporas ya no es…      │
│                                       │
│  [ Omitir esta versión ]              │
│         [ Más tarde ]  [ Actualizar ] │
╰───────────────────────────────────────╯
```

- Las notas se renderizan **con el motor de Mycelium** (`renderMarkdown`), no como texto
  plano. Es coherente con el resto de la app y sale gratis.
- **Tres salidas**, decisión del usuario:
  - **Actualizar** — descarga con progreso visible, instala y reinicia.
  - **Más tarde** — se cierra; mañana en el primer arranque se vuelve a ofrecer.
  - **Omitir esta versión** — no se vuelve a mencionar **esa** versión; se avisa cuando
    salga otra. Se guarda el número omitido en `Preferencias`.
- El diálogo **no roba el foco de golpe ni interrumpe la escritura**: aparece cuando la app
  ya está usable.
- Mientras descarga, se puede seguir trabajando. La instalación (que cierra la app) solo
  ocurre cuando la descarga terminó y el usuario lo confirma.

> [!warning] Cuidado con reiniciar sobre trabajo sin guardar
> El editor guarda con debounce de 800 ms. Antes de reiniciar hay que **forzar el guardado
> pendiente** y esperar a que termine. Perder la última frase que escribió el usuario por
> actualizar sería el peor resultado posible de esta funcionalidad.

### 4.3 Selección de versión — `FUN-M-16`, modo avanzado

Poder elegir **cualquier versión publicada** e instalarla, incluida una anterior a la
actual. Es una herramienta de desarrollo —para revisar cómo se comportaba algo, o volver
atrás si una versión sale mal— **no** una función para el usuario normal.

Se registra como **`FUN-M-16` · `UPDATER-SELECCION-VERSION`**, aparte de `FUN-L-14`: comparte
toda la infraestructura pero es un entregable distinto, y si `FUN-L-14` se hace grande, esto
se puede cortar sin dañarla.

**Cómo se llega**: pulsando **siete veces sobre el número de versión** en el pie de
Configuración se activa el **modo avanzado**, y con él aparece la sección de versiones. Es
el gesto de Android y Chrome para el modo desarrollador: imposible de encontrar por
accidente, trivial de recordar, y no agrega ninguna superficie visible. Queda activado de
forma persistente hasta que se apague.

**Qué hace**: lee `versions.json` del bucket (§ 3.2), lista lo publicado con su fecha y sus
notas, y permite instalar la que se elija — **siempre con confirmación**, y con la
advertencia visible si es anterior a la instalada.

> [!success] Verificado el 2026-08-03: se puede, y sin salir del plugin
> Se comprobó **antes de construir nada**, contra el código real, porque si no fuera posible
> esta unidad no existiría. Hay **dos** portones y los dos se pueden abrir:
>
> **1. El plugin.** `UpdaterBuilder` expone
> `version_comparator(Fn(Version, RemoteRelease) -> bool)`. En `updater.rs` la decisión es:
>
> ```rust
> let should_update = match self.version_comparator.as_ref() {
>     Some(comparator) => comparator(self.current_version.clone(), release.clone()),
>     None => release.version > self.current_version,
> };
> ```
>
> El comparador **sustituye por completo** al `>` por defecto: no hay una comprobación
> adicional cableada. Devolviendo `true` se instala cualquier versión, incluida una anterior.
>
> **2. El instalador.** El NSIS de Tauri compara versiones (`SemverCompare`) y trata el
> caso "downgrading" según el define `ALLOWDOWNGRADES`. Con `false`, **aborta las
> instalaciones silenciosas con error** — que es justo como instala el updater. Sale de
> `bundle.windows.allowDowngrades`, que **por defecto es `true`** y el proyecto no lo
> define, así que hoy los downgrades están permitidos.
>
> Comprobado en la CLI instalada (2.11), no en la documentación: la plantilla NSIS y el
> `allow_downgrades` están dentro del binario de la CLI de este repo.

> [!danger] Nunca poner `bundle.windows.allowDowngrades` en `false`
> Es `true` por defecto y hay que dejarlo así. Ponerlo en `false` mata `FUN-M-16` de raíz —
> y lo haría en silencio: el plugin aceptaría la versión y el fallo aparecería recién al
> instalar, en la máquina del usuario. Si alguna vez alguien lo agrega a `tauri.conf.json`,
> que sea con esta nota delante.

**Elegir una versión la deja fijada.** La comprobación automática se apaga, el aviso diario
deja de aparecer, y en Configuración se ve un indicador de que estás en una versión fijada
con un botón para volver a seguir las actualizaciones. Si bajaste para investigar algo, que
la app te empuje a subir cada día es exactamente lo contrario de lo que necesitás.

> [!danger] Bajar de versión: qué se rompe y qué no
> **Las notas están a salvo.** Son archivos de texto en disco: ninguna versión puede
> corromperlas por ser vieja. El índice SQLite tampoco preocupa — es derivado y se
> reconstruye solo desde la carpeta.
>
> **Lo que sí se pierde son las pestañas y parte de las preferencias.** Los stores usan
> `persist` de Zustand con número de versión, y un desajuste sin `migrate` **descarta el
> estado guardado**: ya pasó entre 1.0.0 y 1.1.0 (ver [[Estado con Zustand]]). Al bajar, una
> app vieja se encuentra un estado más nuevo — el mismo caso al revés. Molesto, no
> catastrófico, pero hay que **avisarlo en el diálogo de confirmación**, no descubrirlo
> después.
>
> **El contenido nuevo se ve mal en una versión vieja**: una nota con propiedades vuelve a
> mostrar la línea horizontal y el título fantasma en 1.1.5. No destruye nada. Es
> precisamente por esto que la función va escondida.
>
> Todo esto se sostiene mientras **el vault siga siendo texto plano**. El día que una
> versión cambie el formato en disco, bajar de versión dejará de ser seguro y habrá que
> decirlo acá.

---

## 5. Criterios de aceptación

1. Con una versión nueva publicada en R2, abrir Mycelium muestra el diálogo con el número
   correcto y el changelog **renderizado** (títulos y viñetas, no `##` en crudo).
2. El arranque **no se retrasa** por la comprobación: la app es usable antes de que aparezca
   el diálogo.
3. Sin conexión: Mycelium abre normalmente y **no muestra ningún error**.
4. Cerrar el diálogo con "Más tarde" y reabrir la app **el mismo día** no vuelve a
   preguntar. Simulando el día siguiente, sí.
5. "Omitir esta versión" y reabrir al día siguiente: no aparece. Al publicar una versión
   posterior, vuelve a aparecer.
6. "Actualizar" descarga con progreso visible, instala y Mycelium vuelve a abrir **en la
   versión nueva** (comprobable en el pie de Configuración).
7. Al actualizar con una nota a medio escribir, el texto está **completo** después del
   reinicio.
8. Actualizar **no pide UAC**.
9. Actualizar **no borra ni toca el vault**, ni las preferencias, ni los snippets CSS, ni
   las pestañas abiertas.
10. Un manifiesto con **firma inválida** hace que la actualización se rechace con un
    mensaje claro, y la app sigue funcionando en su versión actual.
11. Con la comprobación automática desactivada, no se hace ninguna petición de red al
    arrancar. El botón manual sigue funcionando.
12. El botón manual, cuando ya se está en la última versión, lo dice en vez de no hacer nada.
13. Publicando **dos versiones el mismo día**, el botón manual encuentra la segunda sin
    esperar al día siguiente. Es el escenario que justifica el botón.

### De la selección de versión (`FUN-M-16`)

14. La sección de versiones **no existe** hasta pulsar siete veces el número de versión.
    Un usuario que no lo sepa no puede llegar ahí.
15. Activado el modo avanzado, la lista muestra todas las versiones publicadas con su fecha,
    y marca cuál está instalada.
16. Elegir una versión **anterior** avisa de que puede perder las pestañas abiertas **antes**
    de instalar, y exige confirmación.
17. Tras instalar una versión elegida a mano, la app queda **fijada**: al día siguiente no
    aparece el aviso de actualización, y Configuración muestra que está fijada con la forma
    de volver a seguir las actualizaciones.
18. Quitar la fijación devuelve el comportamiento normal: al día siguiente vuelve a ofrecer
    la última.
19. Bajar de versión y volver a subir **no pierde ni modifica ninguna nota** del vault.

---

## 5 bis. Cómo quedó implementado (2026-08-03)

Salió en [[Version 1.4.0]], junto con `FUN-M-16`. Lo que sigue son las **tres cosas que no
salieron como decía esta spec**, con el motivo; el resto se implementó tal cual.

### El estado del updater NO vive en `Preferencias`

La spec decía "la fecha se guarda en `Preferencias` (`preferencesStore`), como el resto"
(§ 4.1). Al implementarlo apareció por qué no puede ser: las preferencias viven en la
**fila del usuario dentro del índice SQLite de cada vault** (`lib/db/preferencias.ts`) y
se hidratan **después** de abrir uno.

- La comprobación ocurre **al arrancar**, cuando puede no haber ningún vault abierto.
- "Omití la 1.4.0", "no busques actualizaciones" o "estoy fijado en la 1.2.0" son
  decisiones **de la instalación**, no de un vault. Con preferencias por vault, omitir una
  versión en uno y que otro te la siguiera ofreciendo sería un defecto, no una función.

Van a **`actualizador.json` en el config-dir de la app**, con el mismo mecanismo y el
mismo estilo que `vaults.json` (`vault_config.rs`) — que guarda exactamente el mismo tipo
de ajuste global: la lista de vaults y "abrir el último al iniciar". El espíritu de la
spec ("persistilo como el resto, no inventes un mecanismo") se cumple; lo que cambia es
cuál de los dos mecanismos que ya existían es el que corresponde.

### Todo el motor vive en Rust, no en el webview

La spec no lo decía en un sentido ni en otro, pero solo hay un camino: el comando JS del
plugin **no expone `version_comparator`**, que es lo único que permite instalar una
versión anterior. Así que `updater_*` son comandos propios en
`src-tauri/src/actualizador.rs` y el paquete npm `@tauri-apps/plugin-updater` **no se
instala**. Efecto colateral bienvenido: la petición la hace `reqwest` y no `fetch`, así
que el bucket no necesita CORS.

### El bucket lleva un manifiesto por versión

La estructura del § 3.2 gana un archivo: **`<version>/latest.json`**, que es el **mismo
manifiesto** que la raíz, copiado dentro de la carpeta de su versión.

```
mycelium-releases/
├── latest.json                       ← lo que consulta la app cada día
├── versions.json                     ← el índice del modo avanzado
└── 1.4.0/
    ├── latest.json                   ← el MISMO manifiesto, para reinstalar esta versión
    ├── Mycelium_1.4.0_x64-setup.exe
    └── Mycelium_1.4.0_x64-setup.exe.sig
```

Hace falta porque el plugin solo sabe leer **un manifiesto por URL**: para instalar la
`1.2.0` cuando la última es la `1.4.0`, tiene que existir un manifiesto que anuncie la
`1.2.0`. Sin él, esa versión aparece en la lista pero no se puede instalar.

`versions.json` quedó así (solo `version` es obligatorio; `manifest` es opcional y por
defecto se asume `<version>/latest.json`):

```json
{
  "versions": [
    { "version": "1.4.0", "pub_date": "2026-08-10T12:00:00Z", "notes": "## Qué entra\n\n- …" }
  ]
}
```

### Y una cosa que la spec pedía y conviene subrayar que está

El **endpoint configurable** del callout del § 3.2 no quedó como "mitigación que conviene
igual": está implementado y es lo que hace posible el § 4 de [[Publicar una version]] —
ensayar el circuito completo contra un bucket de pruebas sin arriesgar a nadie.

## 6. Riesgos y compromiso operativo

Esta es la primera funcionalidad que le deja a Mycelium **cosas que mantener fuera del
código**:

- **Un bucket de R2** que tiene que seguir existiendo y respondiendo. Si `latest.json` deja
  de estar disponible, la comprobación falla — silenciosamente, que es el comportamiento
  correcto, pero nadie se actualiza más.
- **Una clave privada** custodiada durante toda la vida del producto (ver el aviso del § 3.1).
- **Un formato de manifiesto** que hay que mantener correcto en cada release. Un `.sig`
  pegado mal o una URL equivocada rompe la actualización de todos.

Por eso el criterio 10 no es un detalle: la app tiene que **sobrevivir a un manifiesto
roto** sin quedar inservible.

> [!note] Por qué es `L` y no `XL`
> El [[BACKLOG]] clasifica como `XL` lo que depende de infraestructura de nube, y esto
> depende. Pero no hay rearquitectura ni cambia dónde viven los datos: el plugin oficial
> hace el trabajo pesado y la parte de nube es **un bucket con archivos estáticos**, no un
> servicio. El esfuerzo es de `L`; lo que sí es nuevo —y por eso está escrito arriba— es el
> compromiso operativo permanente.

---

## 7. Versionado

**Minor** cuando salga: el usuario puede hacer algo que antes no podía (enterarse y
actualizar desde la app). Los cuatro archivos de siempre más `Cargo.lock`.

`FRAMEWORK_IA_VERSION` **no cambia**: no afecta a lo que la IA debe saber del vault.

## 8. Verificación

- `cd frontend && npx tsc --noEmit -p tsconfig.json`
- `cd frontend/src-tauri && cargo check` — acá **sí** se toca Rust (plugin nuevo).
- **La prueba real es de extremo a extremo y no la sustituye ningún compilador**: publicar
  una versión de prueba en R2 y actualizar desde una instalación real. Hasta que eso no se
  haga, la funcionalidad no está verificada.
- Probar también el camino desgraciado: manifiesto inexistente, JSON mal formado, firma
  inválida, y descarga interrumpida a mitad.

## 9. Documentación actualizada (hecho)

- [[Generar instaladores desktop]] — el proceso gana los pasos de firma y publicación.
- [[BACKLOG]] — `FUN-L-14` y su continuación (automatizar la publicación en el workflow).
- [[Arquitectura de Mycelium]] — Mycelium pasa a tener una dependencia externa propia.
- [[Diferencias funcionales aceptadas entre versiones]] — solo-desktop por naturaleza.
- [[Estado del proyecto]] y la nota de release correspondiente ([[Version 1.4.0]]).
- **[[Publicar una version]]** — el proceso nuevo, con la puesta en marcha del bucket, la
  custodia de la clave, los cinco pasos de una publicación, cómo probarlo sin arriesgar a
  nadie y qué hacer cuando algo sale mal.

## Relacionadas

- [[Generar instaladores desktop]] — de dónde salen los artefactos que se publican.
- [[Versionado del sistema]] — qué número lleva cada release que se publique.
- [[Diferencias funcionales aceptadas entre versiones]] — por qué esto no va a web.
- [[Publicar una version]] — el proceso operativo que sostiene esta funcionalidad.
- [[Version 1.4.0]] — el release en el que salió, con las decisiones de implementación.
- [[Estado con Zustand]] — por qué bajar de versión pierde las pestañas.
- [[BACKLOG]] — `FUN-L-14` en la agrupación en releases; `FUN-L-15`, la continuación.
- [[Mapa de documentacion]] — índice general.
