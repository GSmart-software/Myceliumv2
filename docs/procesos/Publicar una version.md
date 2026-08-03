# Publicar una versión

Cómo hacer que una versión nueva de Mycelium **llegue sola** a quien ya lo tiene
instalado. Es el otro extremo de [[autoactualizacion]] (`FUN-L-14`): la app sabe
preguntar, y acá está lo que hay que dejar preparado para que la respuesta exista.

Este documento está escrito para seguirlo **paso a paso, con las manos**. No hace falta
haber leído la spec.

> [!important] Hoy Mycelium NO se puede autoactualizar todavía
> Falta lo único que no puede hacer un programa por vos: **crear el bucket y generar la
> clave de firma**. Hasta entonces, Configuración → Vault → Actualizaciones muestra el
> motivo y no consulta nada. La § 1 es exactamente lo que falta.

---

## 0. Las tres piezas, en una frase cada una

| Pieza | Qué es | Dónde vive |
|---|---|---|
| **El bucket** | Una carpeta pública en internet con los instaladores y dos archivos JSON | Cloudflare R2 |
| **La clave privada** | Con lo que firmás cada instalador | Tu máquina + una copia de seguridad **fuera** de ella |
| **La clave pública** | Con lo que cada Mycelium instalado comprueba esa firma | Compilada dentro de la app (`tauri.conf.json`) |

La app **nunca lleva credenciales**: descargar el manifiesto y el instalador es un `GET`
anónimo a una URL pública. Lo que hay que proteger es **escribir** en el bucket y, sobre
todo, la clave privada.

---

## 1. Puesta en marcha (una sola vez)

### 1.1 Crear el bucket en Cloudflare R2

1. Entrá a [dash.cloudflare.com](https://dash.cloudflare.com) con tu cuenta (si no tenés,
   creala: es gratis).
2. En el menú lateral, **R2 Object Storage** → **Create bucket**.
3. Nombre: `mycelium-releases`. Ubicación: la que te ofrezca por defecto.
4. Creado el bucket, entrá en él → pestaña **Settings** → **Public access**.
5. Activá el acceso público. Tenés dos caminos:
   - **Con dominio propio** (recomendado): *Custom Domains* → **Connect Domain** →
     `actualizaciones.tudominio.com`. El dominio tiene que estar en tu cuenta de
     Cloudflare, pero **no hace falta transferirlo**: Cloudflare admite *partial (CNAME)
     setup*, así que un dominio registrado en otro sitio se añade sin moverlo.
   - **Sin dominio**: *R2.dev subdomain* → **Allow Access**. Te queda una URL
     `https://pub-<hash>.r2.dev`.

> [!warning] La URL queda **compilada dentro de cada copia** de Mycelium
> Las versiones ya instaladas seguirán consultando esa dirección para siempre. Si algún
> día hay que cambiarla, las copias instaladas dejan de detectar actualizaciones y
> necesitan **una reinstalación manual, una sola vez** — o sea, se vuelve a la situación
> de antes de `FUN-L-14`. No se pierde nada, pero se pierde el automatismo.
>
> Por eso, **si hay dominio disponible, usalo desde el principio**: es la opción que no
> hay que deshacer después. Cloudflare además documenta que `r2.dev` *"is rate-limited
> and should only be used for development purposes"*.
>
> Mitigación que ya está construida: el endpoint es **configurable en tiempo de
> ejecución** (§ 4), así que cambiar de URL puede ser cambiar un ajuste en vez de
> reinstalar.

6. Anotá la **URL base** que te quedó. En todo lo que sigue se la llama `<BASE>`:
   - con dominio: `https://actualizaciones.tudominio.com`
   - sin dominio: `https://pub-<hash>.r2.dev`

7. Para poder **subir** archivos desde tu máquina, instalá `wrangler` y autenticate:

   ```sh
   npm install -g wrangler
   wrangler login
   ```

### 1.2 Generar el par de claves de firma

Desde `frontend/`:

En **PowerShell**:

```powershell
npx tauri signer generate -w "$env:USERPROFILE\.tauri\mycelium.key"
```

> [!warning] No copies este comando con `%USERPROFILE%`
> Esa forma solo funciona en `cmd.exe`. En PowerShell y en Git Bash **no se expande**, y en
> vez de escribir en tu perfil te crea una carpeta llamada literalmente `%USERPROFILE%`.
> Si te pasó, borrá esa carpeta y repetí el comando de arriba.

Te va a pedir una contraseña. **Ponela** y anotala donde guardes tus contraseñas: sin ella
la clave privada no sirve.

Eso deja dos archivos:

| Archivo | Qué es | Qué hacer con él |
|---|---|---|
| `%USERPROFILE%\.tauri\mycelium.key` | La **privada**. Firma cada instalador | Nunca sale de tu máquina. Copia de seguridad fuera de ella |
| `%USERPROFILE%\.tauri\mycelium.key.pub` | La **pública**. Verifica la firma | Se pega en `tauri.conf.json` |

### 1.3 Pegar la clave pública en la configuración

Abrí `frontend/src-tauri/tauri.conf.json` y reemplazá los dos marcadores del bloque
`plugins.updater`:

```json
"plugins": {
  "updater": {
    "endpoints": ["<BASE>/latest.json"],
    "pubkey": "<el contenido ENTERO de mycelium.key.pub, en una línea>",
    "windows": { "installMode": "passive" }
  }
}
```

- `pubkey` es el contenido del `.pub` **tal cual**, sin comillas extra ni saltos de línea.
- `endpoints` lleva la URL completa del `latest.json`, no la del bucket.

> [!tip] Cómo saber que quedó bien
> Compilá y abrí Mycelium: en Configuración → Vault → **Actualizaciones** ya no tiene que
> aparecer el aviso de "Actualizaciones desactivadas". Mientras los marcadores sigan ahí,
> el updater está apagado a propósito.

### 1.4 Guardar la clave privada donde corresponde

> [!danger] La clave privada es el activo más delicado del proyecto
> **Si se pierde**: ningún Mycelium ya instalado podrá volver a actualizarse jamás. La
> pública está compilada dentro de cada copia, así que una clave nueva no valida nada de
> lo que ya está en el mundo — habría que redistribuir a mano y empezar de cero.
>
> **Si se filtra**: cualquiera puede publicar una actualización que todas las
> instalaciones aceptarán como legítima y ejecutarán. Es ejecución de código arbitrario en
> la máquina del usuario, con su confianza.
>
> No entra en el repositorio, **ni siquiera cifrada**. Copia de seguridad **fuera** de la
> máquina de desarrollo (gestor de contraseñas, disco cifrado, caja fuerte — lo que uses
> para lo que no se puede perder).

Para no tener que escribir la ruta y la contraseña en cada publicación, dejalas en
variables de entorno del usuario (PowerShell, una sola vez):

```powershell
[Environment]::SetEnvironmentVariable('TAURI_SIGNING_PRIVATE_KEY', "$env:USERPROFILE\.tauri\mycelium.key", 'User')
[Environment]::SetEnvironmentVariable('TAURI_SIGNING_PRIVATE_KEY_PASSWORD', 'tu-contraseña', 'User')
```

> [!warning] Desde ahora, `tauri build` **exige** la clave
> `bundle.createUpdaterArtifacts` está en `true`: es lo que genera los `.sig`. Sin esas
> dos variables, la compilación **falla** pidiéndolas. Es a propósito — una versión sin
> firmar no puede instalarse como actualización, así que es mejor enterarse al compilar
> que al publicar.

---

## 2. Publicar una versión

Cinco pasos. El primero es el de siempre; los otros cuatro son lo que suma `FUN-L-14`.

### Paso 1 — Consolidar la versión

Subir el número en **cuatro archivos y el `Cargo.lock`** (ver [[Versionado del sistema]]):

- `frontend/lib/version.ts` (`APP_VERSION`)
- `frontend/package.json`
- `frontend/src-tauri/Cargo.toml`
- `frontend/src-tauri/tauri.conf.json`
- `frontend/src-tauri/Cargo.lock` (la entrada `name = "app"`)

Y escribir la nota de release `docs/estado/Version X.Y.Z.md`: **de ahí sale el changelog**
que va a ver el usuario en el diálogo.

### Paso 2 — Compilar

```sh
cd frontend
CARGO_BUILD_JOBS=2 npx tauri build
```

Detalles y avisos en [[Generar instaladores desktop]] — el límite de jobs **no es
opcional**. Con la firma configurada, además de los instaladores aparece el `.sig`:

```
frontend/src-tauri/target/release/bundle/
├── msi/Mycelium_1.4.0_x64_en-US.msi
└── nsis/
    ├── Mycelium_1.4.0_x64-setup.exe
    └── Mycelium_1.4.0_x64-setup.exe.sig     ← esto es nuevo
```

> [!important] El canal de actualización es el **NSIS**, no el MSI
> Los dos se siguen generando, pero **el manifiesto apunta al `-setup.exe`**. El NSIS de
> Tauri instala en modo `currentUser`, así que actualizar **no dispara UAC**; el MSI
> instala por máquina y pediría elevación en cada actualización. El MSI se sigue
> publicando para la instalación inicial y el despliegue silencioso.

### Paso 3 — Subir los archivos al bucket

Con `<VER>` = la versión que estás publicando (p. ej. `1.4.0`):

```sh
cd frontend/src-tauri/target/release/bundle
wrangler r2 object put mycelium-releases/<VER>/Mycelium_<VER>_x64-setup.exe     --file nsis/Mycelium_<VER>_x64-setup.exe     --remote
wrangler r2 object put mycelium-releases/<VER>/Mycelium_<VER>_x64-setup.exe.sig --file nsis/Mycelium_<VER>_x64-setup.exe.sig --remote
wrangler r2 object put mycelium-releases/<VER>/Mycelium_<VER>_x64_en-US.msi     --file msi/Mycelium_<VER>_x64_en-US.msi      --remote
```

Las versiones anteriores **se conservan**: sirven de archivo y son lo que hace posible
volver atrás (`FUN-M-16`). Cada versión ocupa ~18 MB entre MSI y NSIS; el nivel gratuito
son 10 GB y R2 **no cobra transferencia**.

### Paso 4 — Escribir el manifiesto (`latest.json`)

Este es el archivo que consulta la app. Formato **exacto** que espera el plugin:

```json
{
  "version": "1.4.0",
  "notes": "## Qué entra\n\n- Mycelium avisa cuando hay una versión nueva\n- Modo avanzado para elegir versión\n\n### Correcciones\n\n- …",
  "pub_date": "2026-08-10T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "<el contenido ENTERO del archivo .sig, en una línea>",
      "url": "<BASE>/1.4.0/Mycelium_1.4.0_x64-setup.exe"
    }
  }
}
```

Cuatro cosas que hay que hacer bien y son las que más se rompen:

1. **`version`** sin la `v` delante y exactamente igual que la del instalador.
2. **`signature`** es el contenido del `.sig` **completo**, pegado como una sola línea de
   JSON. No es una ruta ni un hash: es el archivo entero.
3. **`notes`** lleva **Markdown**, y es lo que Mycelium **renderiza** en el diálogo
   (títulos, viñetas, negritas). Sale de la nota de release. Como es JSON, los saltos de
   línea van escritos `\n`.
4. **`url`** apunta al `-setup.exe` (NSIS), no al MSI.

> [!tip] Convertir la nota de release a `notes` sin pelearse con el JSON
> ```powershell
> $notas = Get-Content "docs/estado/Version 1.4.0.md" -Raw
> $firma = Get-Content "frontend/src-tauri/target/release/bundle/nsis/Mycelium_1.4.0_x64-setup.exe.sig" -Raw
> $m = [ordered]@{
>   version   = "1.4.0"
>   notes     = $notas
>   pub_date  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
>   platforms = @{ "windows-x86_64" = @{ signature = $firma.Trim(); url = "<BASE>/1.4.0/Mycelium_1.4.0_x64-setup.exe" } }
> }
> $m | ConvertTo-Json -Depth 5 | Out-File latest.json -Encoding utf8
> ```
> `ConvertTo-Json` escapa los saltos de línea y las comillas por vos, que es justo donde
> se rompe cuando se hace a mano.

El **mismo archivo** se sube a **dos** sitios:

```sh
wrangler r2 object put mycelium-releases/latest.json       --file latest.json --content-type application/json --remote
wrangler r2 object put mycelium-releases/<VER>/latest.json --file latest.json --content-type application/json --remote
```

- La copia de la raíz es lo que consulta la comprobación diaria.
- La copia dentro de `<VER>/` es lo que permite reinstalar **esa** versión concreta desde
  el modo avanzado, incluso cuando ya no sea la última. **Si te la salteás, esa versión
  aparecerá en la lista pero no se podrá instalar.**

### Paso 5 — Actualizar el índice de versiones (`versions.json`)

Es lo que lee el modo avanzado (`FUN-M-16`). Se **añade** la versión nueva arriba,
conservando las anteriores:

```json
{
  "versions": [
    {
      "version": "1.4.0",
      "pub_date": "2026-08-10T12:00:00Z",
      "notes": "## Qué entra\n\n- …"
    },
    {
      "version": "1.3.0",
      "pub_date": "2026-08-03T10:00:00Z",
      "notes": "## Esporas\n\n- …"
    }
  ]
}
```

- Solo `version` es obligatorio; `pub_date` y `notes` es lo que se ve en la lista y en el
  diálogo de confirmación.
- **`manifest` es opcional**: si no está, Mycelium busca el manifiesto en
  `<BASE>/<version>/latest.json`, que es exactamente lo que dejó el paso 4. Solo hace
  falta ponerlo si una versión vieja tiene su manifiesto en otro sitio; se admite ruta
  relativa a la base (`1.3.0/manifest.json`) o URL absoluta.

```sh
wrangler r2 object put mycelium-releases/versions.json --file versions.json --content-type application/json --remote
```

### Resumen: qué queda en el bucket

```
mycelium-releases/
├── latest.json                       ← lo que consulta la app cada día
├── versions.json                     ← el índice del modo avanzado
├── 1.4.0/
│   ├── latest.json                   ← el mismo manifiesto, para reinstalar esta versión
│   ├── Mycelium_1.4.0_x64-setup.exe
│   ├── Mycelium_1.4.0_x64-setup.exe.sig
│   └── Mycelium_1.4.0_x64_en-US.msi
└── 1.3.0/
    └── …                             ← las versiones viejas se conservan
```

---

## 3. La primera vez hay que instalar a mano

> [!warning] Los usuarios de hoy no se van a autoactualizar solos
> La clave pública se **compila** en el binario. La primera versión que la incluya es la
> primera que puede recibir actualizaciones: la `1.3.0` y anteriores no tienen forma de
> verificar nada, así que no van a enterarse de nada.
>
> Esa primera versión con updater hay que **instalarla a mano**, como hasta ahora. Es la
> última vez.

---

## 4. Probarlo sin arriesgar a nadie

El endpoint es **configurable en tiempo de ejecución**, y eso es lo que permite ensayar el
circuito completo contra un bucket de pruebas antes de tocar el de producción.

1. Creá un segundo bucket público, `mycelium-releases-pruebas`, con la misma estructura
   (§ 1.1). **La clave de firma es la misma**: lo que cambia es dónde están los archivos.
2. En Mycelium: Configuración → Vault → pie del panel → **siete clics sobre el número de
   versión**. Aparece "modo avanzado" y, con él, el campo **Servidor de actualizaciones**.
3. Pegá ahí `https://<BASE-DE-PRUEBAS>/latest.json` y salí del campo.
4. **Buscar actualizaciones**. A partir de acá todo mira al bucket de pruebas.
5. Para volver a producción, vaciá el campo: se usa el compilado.

Qué conviene probar, además del camino feliz:

| Escenario | Cómo montarlo | Qué tiene que pasar |
|---|---|---|
| No hay nada nuevo | Publicar en pruebas la **misma** versión instalada | El botón lo dice, no se queda mudo |
| Manifiesto inexistente | Apuntar el endpoint a una URL que no existe | El botón manual informa del fallo; el arranque **no dice nada** |
| JSON mal formado | Subir un `latest.json` con una coma de más | Mensaje claro, la app sigue funcionando |
| **Firma inválida** | Publicar el `.sig` de **otra** versión | La descarga se rechaza con un mensaje y la app sigue en su versión |
| Sin conexión | Cortar el wifi y abrir Mycelium | Abre normalmente, **sin ningún error** |
| Bajar de versión | Publicar dos versiones en pruebas y elegir la vieja | Avisa de que se pierden las pestañas y pide confirmación |

---

## 5. Cuando algo sale mal

### Publiqué una versión rota

1. **Lo primero**: reescribí `latest.json` con el manifiesto de la versión **anterior**
   (está en `<BASE>/<version-anterior>/latest.json`, tal cual). A partir de ese momento
   nadie más se actualiza a la rota.
2. **No borres** la versión rota del bucket: quien ya la instaló puede volver atrás desde
   el modo avanzado, y para eso su manifiesto tiene que seguir estando.
3. Publicá la corrección como una versión **nueva** (un patch). Nunca reescribas los
   archivos de una versión ya publicada con contenido distinto: alguien puede tenerla a
   medio descargar, y la firma dejaría de coincidir.

### "La actualización se rechazó" / firma inválida

Es el sistema haciendo su trabajo: el instalador descargado no coincide con la firma que
verifica la clave pública compilada en la app. Causas, por frecuencia:

1. El `signature` del manifiesto es de **otra** versión (lo más común: copiar el JSON
   anterior y olvidar cambiar la firma).
2. Se pegó la **ruta** del `.sig` en vez de su **contenido**.
3. Se subió el instalador de una compilación y el `.sig` de otra.
4. La clave pública de `tauri.conf.json` no es la pareja de la privada que firmó.

Solución: volver a generar el manifiesto desde los archivos de **esa** compilación
(§ 2 paso 4) y volver a subirlo. No hace falta recompilar.

### Nadie detecta la actualización

Comprobá, en este orden:

1. `<BASE>/latest.json` abierto en el navegador: ¿devuelve el JSON o un 404?
2. ¿La `version` del manifiesto es **mayor** que la instalada? Con una igual o menor, la
   comprobación normal responde correctamente "no hay nada nuevo".
3. ¿El usuario tiene la comprobación automática desactivada, o una **versión fijada**?
   Las dos cosas se ven en Configuración → Vault → Actualizaciones.
4. ¿Omitió esa versión? También se ve ahí, y el botón manual la vuelve a ofrecer.
5. ¿La app es anterior a la primera con updater? Entonces no hay nada que comprobar (§ 3).

### La app dice "Actualizaciones desactivadas"

La clave pública o el endpoint siguen siendo los marcadores de ejemplo. Es el estado de
fábrica, no un error: hacé la § 1.

### Perdí la clave privada

No hay solución técnica: las copias instaladas solo confían en la pública que llevan
dentro. Hay que generar un par nuevo, publicar una versión con la pública nueva y hacer
que cada usuario la instale **a mano**, una última vez. Por eso la copia de seguridad de
la § 1.4 no es una formalidad.

---

## Lo que este proceso todavía no hace

Los pasos 2 a 5 son manuales a propósito: primero se comprueba que el circuito funciona de
extremo a extremo, y recién después se automatiza. Esa automatización es `FUN-L-15` en el
[[BACKLOG]] — un `npm run publicar` que compile, firme, suba a R2 y escriba los dos JSON —
y va a ser un **script local, no GitHub Actions**: usar el workflow obligaría a alinear
`origin` (ver [[RAMAS]]) y a meter la clave privada como secreto de un repo público.

## Relacionadas

- [[autoactualizacion]] — la spec: qué hace la app con todo esto.
- [[Generar instaladores desktop]] — el empaquetado, que ahora emite también los `.sig`.
- [[Versionado del sistema]] — qué número lleva cada release.
- [[BACKLOG]] — `FUN-L-15`, la automatización de este proceso.
- [[Mapa de documentacion]] — índice general.
