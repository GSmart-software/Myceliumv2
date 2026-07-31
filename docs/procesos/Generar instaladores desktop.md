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
