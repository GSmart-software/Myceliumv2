# Mycelium como app local (un ejecutable, datos en Cloudflare)

Este modo corre **todo en tu máquina** desde un **solo ejecutable**: el backend
.NET sirve a la vez la interfaz y la API en `http://localhost:5279`, y guarda los
datos en **Cloudflare (D1 + R2)**. No usa Render ni Pages.

> Compartir y colaboración en tiempo real quedan **deshabilitados** en este modo
> (no hay relay). Todo lo demás (notas, carpetas, búsqueda, grafo, export) funciona.

Es uno de los tres modos del proyecto; no afecta a los otros:

| Modo | Cómo corre | Datos | Sirve la UI |
|---|---|---|---|
| Local (dev) | `dotnet run` + `npm run dev` | SQLite local | front en `:3000` |
| Deploy | Render + Cloudflare Pages | Cloudflare | Pages |
| **Desktop (este)** | **un exe** | **Cloudflare** | el propio exe, `:5279` |

---

## Requisitos previos

- Tener creados los recursos de Cloudflare (igual que en `docs/DEPLOYMENT.md`,
  partes 1–3): la **D1** con el esquema aplicado, el **bucket R2**, un **token R2**
  (Access Key ID + Secret) y un **token D1 con permiso Edit**.
- Para **construir** el ejecutable: **Node/npm** y el **SDK .NET 9**.
  Para **usarlo** ya construido: nada (el exe es autocontenido).

---

## 1. Construir el ejecutable

Desde la raíz del repo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-desktop.ps1
```

El script:
1. buildea el frontend estático apuntando al mismo origen,
2. lo copia a `wwwroot/`,
3. publica el backend como **exe autocontenido single-file** en `dist/desktop/`,
4. quita `appsettings.Production.json` del artefacto,
5. deja la plantilla `appsettings.Local.example.json`.

Resultado: `dist/desktop/` con `Micelio.Api.exe`, `wwwroot/` y los `appsettings`.

---

## 2. Configurar tus credenciales

En `dist/desktop/`:

1. Copiá `appsettings.Local.example.json` → **`appsettings.Local.json`**.
2. Completá los valores:

```jsonc
{
  "Urls": "http://localhost:5279",
  "Hosting": { "ServeFrontend": true },
  "Storage": { "Provider": "cloudflare" },
  "Cloudflare": {
    "AccountId": "tu-account-id",
    "ApiToken": "token-D1-Edit",
    "D1": { "DatabaseId": "id-de-tu-D1" },
    "R2": {
      "Bucket": "micelio-blobs",
      "AccessKeyId": "access-key-de-R2",
      "SecretAccessKey": "secret-de-R2"
    }
  },
  "Jwt": { "Secret": "un-secreto-largo-y-aleatorio", "Issuer": "micelio" }
}
```

> `appsettings.Local.json` está **gitignored**: nunca se sube al repo. Es el único
> lugar con secretos. (También sirve para probar el modo cloudflare con
> `dotnet run` en desarrollo.)

Para generar un `Jwt:Secret`:
```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```

---

## 3. Ejecutar

Doble clic en **`dist/desktop/Micelio.Api.exe`** (o ejecutarlo por consola).
Se abre el navegador en **http://localhost:5279** con la app. Listo.

- La UI y la API comparten origen → no hay CORS y las cookies de sesión funcionan
  sobre `http` localhost.
- Las notas se guardan en tu **D1** (metadatos) y **R2** (contenido `.md`/`.css`).

### Verificar una cuenta nueva

El email está deshabilitado: al registrarte, la cuenta queda sin verificar.
Verificala a mano contra tu D1:

```bash
wrangler d1 execute micelio-prod --remote \
  --command "UPDATE usuarios SET email_verificado = 1 WHERE email = 'tu@email.com'"
```

---

## Distribución

`dist/desktop/` se distribuye como **carpeta/zip** (el exe + `wwwroot/` +
`appsettings*.json`). El exe es autocontenido: **no requiere instalar .NET**. Quien
lo reciba solo necesita poner su `appsettings.Local.json` con las credenciales.

---

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| Arranca pero no carga la UI | falta `Hosting:ServeFrontend: true` o el `wwwroot/` | revisá `appsettings.Local.json`; reconstruí con el script |
| `Falta configurar Jwt:Secret` | no pusiste `Jwt:Secret` | completalo en `appsettings.Local.json` |
| Error al crear/leer notas | credenciales D1/R2 incorrectas | revisá `AccountId`, `ApiToken`, `D1:DatabaseId`, R2 keys |
| El primer arranque tarda unos segundos | el single-file se autoextrae la 1ª vez | normal; los siguientes son rápidos |
| Export PDF lento la 1ª vez | PuppeteerSharp descarga Chromium al primer uso | normal (igual que en modo local) |
