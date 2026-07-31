# Generar instaladores desktop

Empaquetado de la versión de escritorio con Tauri. Hecho por primera vez para la
[[Version 1.0.0]].

> [!info] Este documento reemplaza a [[DESKTOP-LOCAL]]
> Ese doc describe el empaquetado de la era **pre-Tauri** (ejecutable que apuntaba a
> datos en Cloudflare, instalador con Inno Setup) y está **obsoleto**. Se conserva como
> registro histórico.

## Antes de empezar

- Rama `desktop-tauri`, árbol limpio.
- Versión consolidada en los **tres** archivos (ver [[Versionado del sistema]]):
  `frontend/package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`.
- Rust y Node instalados; `tsc` en verde.

## Comando

```sh
cd frontend
CARGO_BUILD_JOBS=2 npx tauri build
```

Qué hace: corre `next build` (config `output: "export"` → `out/`), compila Rust en
release y empaqueta desde `frontendDist: "../out"`. Con `bundle.targets: "all"`, en
Windows genera **MSI** (WiX) y **NSIS**.

> [!warning] `CARGO_BUILD_JOBS=2` no es opcional aquí
> Sin límite de paralelización, el release agotó la memoria y crasheó rustc
> (`rustc-LLVM ERROR: out of memory`). Con 2 jobs tardó ~7m50s y funcionó. Detalle en
> [[Compilacion y entorno de desarrollo]].
>
> Tampoco canalices el comando con `| tee`: enmascara el código de salida y un fallo
> se ve como éxito.

## Salidas

```
frontend/src-tauri/target/release/bundle/
├── msi/Mycelium_<version>_x64_en-US.msi        (~9.6 MB en 1.0.0)
└── nsis/Mycelium_<version>_x64-setup.exe       (~8.3 MB en 1.0.0)
```

También queda el ejecutable suelto en `target/release/app.exe`.

Ambos son x64 e incluyen la asociación de archivos `.md` declarada en
`tauri.conf.json`. El NSIS es el instalador interactivo clásico; el MSI sirve mejor
para despliegue silencioso.

## Preservar los instaladores

> [!important] Los instaladores viven dentro de `target/`
> Si después vas a limpiar el cache de Rust, **copialos fuera primero**. En este repo
> se preservan en `installers/v<version>/` (carpeta sin trackear en git: son
> artefactos de build).

```sh
mkdir -p installers/v1.0.0
cp frontend/src-tauri/target/release/bundle/msi/*.msi installers/v1.0.0/
cp frontend/src-tauri/target/release/bundle/nsis/*-setup.exe installers/v1.0.0/
```

## Instalar una versión nueva sobre una anterior

Verificado contra el schema de la CLI de Tauri y la config del proyecto (que **no**
define bloques `wix`/`nsis`, así que aplican los defaults).

### Se trata como una actualización, no como otra app

- **MSI (WiX)**: el `upgradeCode` no está seteado, así que Tauri lo genera de forma
  **determinística** (UUID v5 sobre `"<productName>.exe.app.x64"`). Como `productName`
  sigue siendo `Mycelium`, el código es **el mismo** entre versiones → Windows hace una
  *major upgrade*: desinstala la anterior e instala la nueva. No quedan duplicados.
- **NSIS**: detecta la instalación previa por su clave de registro y actualiza en el
  sitio. Su `installMode` por defecto es **`currentUser`**, así que instala en
  `%LOCALAPPDATA%` sin pedir permisos de administrador.

> [!warning] No mezclar MSI y NSIS
> Son mecanismos distintos con ubicaciones distintas (MSI per-machine en
> `Program Files`, NSIS por usuario en `%LOCALAPPDATA%`). Si instalás una versión con
> uno y la siguiente con el otro, **pueden coexistir** y aparecer dos Mycelium
> instalados. Usá siempre el mismo tipo de instalador.

### Los datos del usuario se conservan

Ninguno de los dos instaladores toca:

- **El vault**: vive en la carpeta que eligió el usuario, fuera de la instalación
  (ver [[vault-en-carpeta]]), con su índice en `<vault>/.mycelium/`.
- **`AppData/Roaming/com.mycelium.desktop/`**: la base del modo SQLite clásico, la
  lista de vaults conocidos y el `localStorage` del WebView2 (donde viven los stores
  persistidos: pestañas, layout, preferencias, terminales…).
- Tampoco se borran al **desinstalar**: `deleteAppDataOnUninstall` no está configurado
  y su default es `false`.

Las **asociaciones de archivo** (`.md`, `.excalidraw`) se re-registran apuntando al
ejecutable nuevo.

### Lo único que se resetea al pasar de 1.0.0 a 1.1.0

`sidebarViewerStore` subió su versión de persistencia (`1` → `2`, al sumar el alto y el
modo del dock) y **no tiene `migrate`**. Zustand, ante una versión distinta sin
migración, **descarta** el estado guardado y usa los valores por defecto. Efecto
concreto: **las pestañas que estuvieran ancladas en el panel lateral vuelven a vacío**.
Todo lo demás (pestañas del workspace, layout de paneles, preferencias, tema, vaults)
se conserva.

> [!tip] Si en el futuro un cambio de estructura persistida no debe perder datos
> Escribir un `migrate` en el `persist` (como hace `panelLayoutStore`) en vez de solo
> subir la versión. Ver [[Estado con Zustand]].

### Recomendación pendiente: fijar el `upgradeCode`

La doc de Tauri recomienda **declarar** `bundle.windows.wix.upgradeCode` en la config,
porque hoy se deriva del `productName`: si algún día se renombra el producto, el código
cambiaría y las actualizaciones dejarían de reconocerse (quedarían dos apps instaladas).
Se obtiene con:

```sh
npx tauri inspect wix-upgrade-code
```

## Limpiar el cache después

`target/` llegó a **8.6 GB**. Para liberar espacio:

1. **Cerrar la app** (si `tauri dev` corre, `cargo clean` falla con *Acceso denegado*
   sobre `target/debug/deps/app.exe`).
2. `cargo clean --manifest-path frontend/src-tauri/Cargo.toml` o borrar `target/`.

El siguiente build recompila todo desde cero (varios minutos).

## Relacionadas

- [[Version 1.0.0]] — el release que se empaquetó con este proceso.
- [[Versionado del sistema]] — dónde vive la versión y cómo se sube.
- [[Compilacion y entorno de desarrollo]] — los errores que aparecieron acá.
- [[DESKTOP-LOCAL]] — proceso histórico (obsoleto).
- [[Mapa de documentacion]] — índice general.
