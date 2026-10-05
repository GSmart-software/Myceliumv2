# Instaladores de macOS y Linux (`FUN-L-28` · `INSTALADORES-MAC-LINUX`)

Spec para que Mycelium desktop se distribuya también en **macOS (Apple Silicon)** y
**Linux (x64)**, no solo en Windows, y para que esas instalaciones se **autoactualicen** igual
que la de Windows ([[autoactualizacion]]). Era parte de la propuesta original
([[MIGRACION-TAURI]]: «app de escritorio real (Win/Linux/macOS)») y nunca se hizo: desde la
[[Version 1.0.0]] solo se compiló Windows, en local.

> [!info] Alcance: **SOLO-DESKTOP**, por naturaleza
> La web no tiene instaladores. Ver [[Diferencias funcionales aceptadas entre versiones]].

> [!important] Funcionalidad nueva → **minor** cuando salga
> Quien usa mac o linux puede hacer algo que antes no podía: instalar Mycelium.

---

## 1. Decisiones (usuario, 2026-10-05)

| Tema | Decisión | Por qué |
|---|---|---|
| Dónde se compila mac/linux | **GitHub Actions** | macOS no se puede compilar desde Windows; el repo es público y los minutos de macOS no cuestan |
| Cuándo se compila | **Al fusionar un PR hacia la rama `despliegues`** (push a `despliegues`) + ejecución manual | `desktop-tauri` recibe pushes normales **sin** generar versión; `despliegues` es la rama de lo que se publica. Un build por versión |
| Windows | ~~Sigue compilándose en local~~ → **también en GitHub Actions** desde el 2026-10-05 (ver § 1.1); el build local queda como **respaldo** | El circuito local era el probado desde la [[Version 1.4.0]]; con CI andando, compilar acá solo agregaba diez minutos y una PC encendida |
| Firma de macOS | **Ad-hoc** (`signingIdentity: "-"`), sin cuenta Apple Developer | Gratis. La primera vez el usuario abre con clic derecho → Abrir (o `xattr -cr /Applications/Mycelium.app`) |
| Arquitecturas | **Solo Apple Silicon** (`aarch64-apple-darwin`) y Linux `x86_64` | Intel Mac queda fuera; un universal obligaría a compilar el sidecar dos veces |
| Autoactualización | **Sí, desde el inicio** | Mismo `latest.json`, con tres plataformas |
| La clave privada de firma del updater | **No sale de la PC del usuario** | Decisión vigente de [[Publicar una version]] § «Lo que este proceso todavía no hace». CI compila **sin** firmar; firma el script local |

### 1.1 Windows también en CI: la «opción 2» (usuario, 2026-10-05)

Con mac y linux ya compilando en Actions, el usuario eligió entre tres formas de seguir:

| Opción | Qué es | Resultado |
|---|---|---|
| 1. Todo automático en CI | La clave privada como *secret* del repo, publicación desde Actions con un paso de aprobación manual | **Descartada**: la clave saldría de la PC del usuario, y el repo es público |
| **2. CI compila los tres, se firma local** | Actions compila Windows, macOS y Linux **sin** clave; el usuario baja los tres artefactos y corre `npm run publicar -- --ci <carpeta>`, que firma, sube y verifica **sin compilar nada** | **Elegida** |
| 3. Windows local | Lo de antes: Actions compila mac/linux y Windows se compila en la PC durante `publicar` | Queda como **respaldo** (`npm run publicar` sin `--ci`) para cuando CI no esté disponible |

La clave privada sigue sin salir de la PC y publicar sigue siendo un acto manual: lo único
que cambia es dónde se compila Windows.

## 2. El circuito

```
desktop-tauri ──PR manual──► despliegues ──(merge = push)──► GitHub Actions
                                                              ├─ windows-latest → -setup.exe (NSIS), .msi
                                                              ├─ macos-latest   → .dmg, .app.tar.gz
                                                              └─ ubuntu-22.04  → .deb, .rpm, .AppImage
                                                              (sin clave; artefactos del run)

PC del usuario:  descargar los TRES artefactos del run a una carpeta
                 npm run publicar -- --ci <carpeta>
                   · NO compila nada
                   · firma con `tauri signer sign` el -setup.exe, el .msi, el .app.tar.gz,
                     el .AppImage, el .deb y el .rpm, y verifica cada firma contra la pubkey
                   · sube todo a R2 bajo <version>/
                   · latest.json con windows-x86_64, windows-x86_64-msi, darwin-aarch64,
                     linux-x86_64, linux-x86_64-deb, linux-x86_64-rpm
                   · versions.json actualizado
                   · verifica por SHA-256 lo publicado

Respaldo (CI caído):  npm run publicar   → compila Windows acá y publica solo Windows
```

## 3. Parte A — workflow de CI (`feat/instaladores-ci-desktop`, Windows en `feat/windows-en-ci-desktop`)

> [!info] Windows entró en la matriz el 2026-10-05 (§ 1.1)
> `windows-latest` / `x86_64-pc-windows-msvc`, mismo build sin clave, artefacto
> `mycelium-<version>-windows-x86_64` con `Mycelium_<v>_x64-setup.exe` y
> `Mycelium_<v>_x64_en-US.msi`. El sidecar se comprueba en los scripts que genera el bundler
> (`.nsi` del NSIS y `.wxs` del MSI): `target/release/mycelium-mcp.exe` existe siempre
> porque ahí lo compila `preparar-mcp`, así que su existencia no prueba nada. Sin
> `CARGO_BUILD_JOBS`: el límite de 2 es por la memoria de la PC local, no del runner. Lo que
> sigue de esta sección describe la versión original (solo mac/linux).

> [!warning] Corregido 2026-10-05: tuberías hacia `grep -q`/`head` con `pipefail`
> El primer run real falló en Linux con «el sidecar no quedó dentro del .deb» **estando**.
> Actions corre `shell: bash` como `bash -eo pipefail`: `dpkg-deb -c … | grep -q` corta la
> tubería en la primera coincidencia, el `tar` interno recibe SIGPIPE y el pipeline entero
> falla. Lo mismo amenazaba a `tar -tzf … | head` en mac. Ahora se guarda el listado entero
> en una variable y se busca con here-strings (`grep -q … <<<"$listado"`).

Archivos: `.github/workflows/desktop-build.yml`, `frontend/src-tauri/tauri.conf.json` (y lo
mínimo que haga falta en `scripts/` o Rust para que compile fuera de Windows).

- **Disparadores**: `push` a `despliegues` y `workflow_dispatch`. **Nada** en push a
  `desktop-tauri` ni en tags. Matriz: `macos-latest` (`aarch64-apple-darwin`) y
  `ubuntu-22.04` (x64). ~~Windows sale de la matriz.~~ Desde el 2026-10-05, también
  `windows-latest` (§ 1.1).
- **Node 24** (el de desarrollo), `npm ci`, Rust stable, cache de Rust.
- **Sin clave de firma**: en CI se apaga `bundle.createUpdaterArtifacts` (override por
  `--config` o equivalente, **sin** cambiar el `tauri.conf.json` del build local, que lo
  necesita en `true`). El artefacto de actualización de mac (`Mycelium.app.tar.gz`) se arma
  en CI igual que lo arma el bundler de Tauri; el de linux es el propio `.AppImage`.
- **Firma ad-hoc de macOS**: `bundle.macOS.signingIdentity: "-"`, comprobando que no
  rompe el build local de Windows.
- **Sidecar `mycelium-mcp`**: `preparar-mcp.mjs` usa el triple del host; comprobar que en los
  dos runners el host coincide con el target y que el binario queda dentro del paquete
  (`Mycelium.app/Contents/MacOS/mycelium-mcp`, y en el `.deb`/AppImage).
- **Control de versión**: el job falla si `APP_VERSION` (`lib/version.ts`), `package.json`
  y `tauri.conf.json` no coinciden.
- **Artefactos con nombre estable**: `mycelium-<version>-macos-aarch64` y
  `mycelium-<version>-linux-x86_64`, con solo los archivos distribuibles (no todo `target/`).
- `cargo check` en verde para Linux y macOS es lo que se busca; si algo de Rust no compila
  fuera de Windows (`#[cfg]` faltante), se arregla acá.

## 4. Parte B — publicación multiplataforma (`feat/publicar-multiplataforma-desktop`)

Archivo: `frontend/scripts/publicar.mjs`.

> [!important] Desde el 2026-10-05 (§ 1.1), `--ci` es el circuito normal y no compila
> - Con `--ci`, el `-setup.exe` y el `.msi` vienen del artefacto
>   `mycelium-<version>-windows-x86_64`; **los tres artefactos son obligatorios** (error claro
>   si falta uno o si es de otra versión). No hay paso de compilar: comprobar → preparar y
>   firmar (copiar a `installers/v<v>/`, `tauri signer sign`, verificar contra la pubkey) →
>   manifiestos → subir → verificar. Cinco pasos.
> - `--sin-compilar` con `--ci` **se ignora con un aviso** (no se rechaza): no hay nada que
>   compilar, y así el comando de recuperación de siempre no se rompe por una opción de más.
> - **Sin `--ci`** queda el respaldo de siempre: compila Windows acá y publica solo Windows.
>   Se mantiene la negativa a republicar así una versión que ya tiene mac/linux.
> - **Windows gana `windows-x86_64-msi`** (en los dos modos): el `.msi` se firma igual que el
>   resto. `tauri-plugin-updater` 2.10 (`Updater::get_urls`) busca `{os}-{arch}-{instalador}`
>   antes que `{os}-{arch}`, y una copia instalada con el MSI pregunta por
>   `windows-x86_64-msi`. Sin esa entrada caía en `windows-x86_64`, bajaba el NSIS y lo
>   ejecutaba (el tipo lo decide `WindowsUpdaterType` por los bytes del archivo): el NSIS
>   instala por usuario en `%LOCALAPPDATA%` y el MSI había instalado por máquina en
>   `Program Files`, así que quedaban **dos Mycelium** (el aviso de
>   [[Generar instaladores desktop]]). Con su entrada, esa copia se actualiza con
>   `msiexec /i` sobre sí misma (*major upgrade* por el `upgradeCode` fijo), a costa de un
>   UAC por actualización, que es lo que implica haber elegido el MSI.
>   `windows-x86_64-nsis` no se agrega: sería un duplicado de `windows-x86_64`, que ya es el
>   NSIS y además es el fallback de cualquier copia que no informe su tipo.
>
> Lo que sigue describe la versión original de esta parte (Windows compilado local).

- Opción nueva **`--ci <carpeta>`**: la carpeta donde el usuario descomprimió los artefactos
  del run (los dos zips de la Parte A). Sin `--ci`, el script hace **exactamente** lo de
  hoy: solo Windows.
- Con `--ci`: localizar los artefactos de la **misma versión** (fallar si son de otra),
  firmar con `npx tauri signer sign` usando las mismas variables
  `TAURI_SIGNING_PRIVATE_KEY[_PASSWORD]`, subir instaladores + artefactos de actualización
  bajo `<version>/`, y escribir en `latest.json` (y en lo que lea `versions.json` /
  `FUN-M-16`) las entradas `darwin-aarch64` (url del `.app.tar.gz`) y `linux-x86_64` (url del
  `.AppImage`), con el **contenido** del `.sig`.
- Verificación igual que con el `.exe`: lo descargado del bucket tiene el SHA-256 de lo que
  se firmó; la firma del manifiesto publicado es la del `.sig`.
- `--simulacro` y `--sin-compilar` siguen funcionando con `--ci`.
- Instaladores para la primera instalación (`.dmg`, `.deb`, `.rpm`) también se suben, aunque
  el updater no los use.

> [!info] Implementado (2026-10-05): el `.deb` y el `.rpm` **sí** los usa el updater
> `tauri-plugin-updater` 2.10 (`Updater::get_urls`) busca `{os}-{arch}-{instalador}` antes
> que `{os}-{arch}`, con el tipo de paquete con que se instaló esa copia. Con solo
> `linux-x86_64` → AppImage, una instalación por `.deb` bajaría el AppImage y `install_deb`
> lo rechazaría (`InvalidUpdaterFormat`) en cada actualización. Por eso el script firma
> también el `.deb` y el `.rpm` y el manifiesto lleva `linux-x86_64-deb` y
> `linux-x86_64-rpm`; `darwin-aarch64-app` no hace falta (`.dmg` y `.app` cuentan como
> `app`). Además verifica cada firma contra la `pubkey` de la app antes de subir. Detalle y
> uso en [[Publicar una version]] § 2, paso 3.

## 5. Criterios de aceptación

1. Un PR fusionado a `despliegues` produce, sin intervención, los artefactos de **Windows**,
   mac y linux.
2. Un push a `desktop-tauri` no dispara nada.
3. El `.dmg` instala y abre en un Mac Apple Silicon (con el paso de clic derecho → Abrir).
4. El `.deb` y el `.AppImage` abren en Ubuntu (o WSLg).
5. `npm run publicar -- --ci <carpeta> --simulacro` **no compila** y arma un `latest.json`
   con las seis claves (`windows-x86_64`, `windows-x86_64-msi`, `darwin-aarch64`,
   `linux-x86_64`, `linux-x86_64-deb`, `linux-x86_64-rpm`) y sus firmas.
6. Una instalación de mac/linux de la versión N se actualiza sola a la N+1.
7. El `-setup.exe` y el `.msi` de CI instalan y abren en Windows, con el MCP funcionando; una
   copia instalada con el NSIS se actualiza con el NSIS y una instalada con el MSI, con el
   MSI (sin quedar dos Mycelium).
8. `npm run publicar` sin `--ci` sigue sirviendo de respaldo: compila Windows acá y publica
   solo Windows (las dos claves de Windows).

## 6. Lo que solo se ve en la app (a probar en mac y linux)

Nunca se ejecutó Mycelium fuera de Windows. Se esperan defectos de plataforma, que **no
llevan `DEF-*`** mientras esta funcionalidad esté abierta (ver [[Bugs_errores_y_defectos]]):
se anotan acá.

- **Marco propio** (`decorations: false`, [[marco-de-ventana]]): en mac no hay semáforo
  nativo; ver si los botones propios funcionan y si conviene `titleBarStyle: Overlay`.
- **Terminal integrada** ([[terminal-integrada]]): shell por defecto (`zsh`/`bash`).
- **Canal del MCP** ([[mcp-control]]): socket unix y ruta del sidecar.
- **Notificaciones** de recordatorios: el plugin en vez del toast de Windows.
- **Atajos**: `Ctrl` vs `Cmd` en mac.
- **Updater en mac**: reemplaza el `.app` en `/Applications`; con firma ad-hoc puede volver
  a pedir el permiso de Gatekeeper.

## Relacionadas

- [[Generar instaladores desktop]] · [[Publicar una version]] · [[autoactualizacion]]
- [[BACKLOG]] — `FUN-L-28`
