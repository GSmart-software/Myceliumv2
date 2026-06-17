# Guía de despliegue — Mycelium (Cloudflare D1 + R2, Render, Cloudflare Pages)

Esta guía lista **todo lo que tenés que hacer vos** para poner Mycelium en
producción. El código ya está preparado en la rama `deploy/cloudflare`:

- **Datos** → Cloudflare **D1** (base) + **R2** (blobs de notas/CSS).
- **Backend** (.NET 9) → **Render** (contenedor Docker).
- **Frontend** (Next.js, export estático) → **Cloudflare Pages**.

> ⚠️ El backend .NET **no** corre en Cloudflare Workers (solo JS/Wasm). Por eso el
> compute va en Render y Cloudflare solo guarda los datos.

El orden importa: primero los recursos de Cloudflare (para tener los ids/credenciales),
luego Render (necesita esos ids), y al final Pages (necesita la URL de Render).

---

## 0. Prerrequisitos

- Cuenta en **Cloudflare** y en **Render**.
- **Node 18+** y **wrangler**: `npm i -g wrangler` y luego `wrangler login`.
- La rama publicada en GitHub: `git push -u origin deploy/cloudflare`.
- Anotá tu **Account ID** de Cloudflare (Dashboard → cualquier dominio → barra lateral,
  o `wrangler whoami`).

---

## 1. Cloudflare D1 (base de datos)

```bash
# 1.1 Crear la base
wrangler d1 create micelio-prod
```

Copiá el `database_id` que imprime y pegalo en **`wrangler.toml`** (campo
`database_id`) y guardalo para Render (`Cloudflare__D1__DatabaseId`).

```bash
# 1.2 Aplicar el esquema (tablas + FTS5). Idempotente.
wrangler d1 execute micelio-prod --remote --file=backend/migrations/d1/schema.sql

# 1.3 Verificar
wrangler d1 execute micelio-prod --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

---

## 2. Cloudflare R2 (almacenamiento de blobs)

```bash
# 2.1 Crear el bucket
wrangler r2 bucket create micelio-blobs
```

**2.2 Crear un token de API de R2** (credenciales S3):
Dashboard → **R2** → **Manage R2 API Tokens** → *Create API Token* →
permiso **Object Read & Write** sobre `micelio-blobs`.
Guardá el **Access Key ID** y el **Secret Access Key** (el secret se muestra una sola vez).

→ Irán a Render como `Cloudflare__R2__AccessKeyId` y `Cloudflare__R2__SecretAccessKey`.

---

## 3. Token de API para D1

El backend habla con D1 por HTTP, necesita un token de cuenta:
Dashboard → **My Profile** → **API Tokens** → *Create Token* →
plantilla **Account / D1 → Edit** (o un token custom con permiso `D1:Edit`).
Guardalo → irá a Render como `Cloudflare__ApiToken`.

> Resumen de lo que tenés que tener anotado al terminar el paso 3:
> `AccountId`, `D1 DatabaseId`, `D1 ApiToken`, `R2 AccessKeyId`, `R2 SecretAccessKey`.

---

## 4. Backend en Render

1. **Subí la rama** a GitHub si no lo hiciste: `git push -u origin deploy/cloudflare`.
2. En Render: **New** → **Blueprint** → conectá el repo → Render detecta
   `render.yaml` y propone el servicio `micelio-api`.
   (Alternativa manual: **New → Web Service → Docker**, *Root Directory* = `backend`,
   *Dockerfile Path* = `./Dockerfile`, *Health Check Path* = `/health`.)
3. **Cargá las variables de entorno** marcadas `sync: false` (ver tabla en §8).
   Generá un `Jwt__Secret` largo y aleatorio, por ejemplo:
   ```bash
   openssl rand -base64 48
   ```
4. `Cors__FrontendOrigin` todavía no lo sabés (es la URL de Pages). Dejá un
   placeholder y volvé a este punto tras el paso 5 (o ponelo ya si vas a usar
   dominio propio).
5. **Deploy**. Cuando termine, Render te da una URL tipo
   `https://micelio-api.onrender.com`. Probá `GET /health` → debe responder
   `{"status":"ok","storageProvider":"cloudflare"}`.

> 💤 **Cold start**: en el plan free Render duerme el servicio tras inactividad;
> la primera request tarda ~30 s. El plan `starter` (en `render.yaml`) lo evita.

---

## 5. Frontend en Cloudflare Pages

1. Dashboard → **Workers & Pages** → **Create** → **Pages** → *Connect to Git* →
   elegí el repo y la rama `deploy/cloudflare`.
2. Build settings:
   - **Framework preset**: None (o Next.js static).
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Root directory**: `frontend`
3. **Variable de entorno de build**: `NEXT_PUBLIC_API_URL` = la URL de Render del
   paso 4 (p. ej. `https://micelio-api.onrender.com`). **Sin barra final.**
4. **Save and Deploy**. Pages te da una URL tipo `https://micelio.pages.dev`.

> Alternativa por CLI (desde `frontend/`): poné la URL en `.env.production` y corré
> `npm run deploy:pages`.

---

## 6. Conectar backend ↔ frontend (CORS + cookies)

1. Volvé a Render y poné `Cors__FrontendOrigin` = la URL exacta de Pages
   (`https://micelio.pages.dev`, **sin barra final**). Redeploy.
2. **Cookies cross-site**: como `*.pages.dev` y `*.onrender.com` son dominios
   distintos, ya quedó configurado `Auth__CookieSameSite=None` y
   `Auth__CookieSecure=true` (en `render.yaml`). Esto funciona en Chrome y Firefox.
   - ⚠️ **Safari** bloquea cookies de terceros → la sesión no persistirá ahí.
   - ✅ **Recomendado**: usá un **dominio propio** con subdominios
     (`app.midominio.com` para Pages, `api.midominio.com` para Render). Entonces
     cambiá en Render a `Auth__CookieSameSite=Lax` y agregá
     `Auth__CookieDomain=.midominio.com`. Las cookies pasan a ser de primera parte
     y funcionan en todos los navegadores.

---

## 7. Verificación (smoke test)

1. `GET https://<render>/health` → `storageProvider: "cloudflare"`.
2. Abrí la URL de Pages → **Registrate** con un email/clave.
3. La cuenta queda **sin verificar** (email deshabilitado). Verificala a mano:
   ```bash
   wrangler d1 execute micelio-prod --remote \
     --command "UPDATE usuarios SET email_verificado = 1 WHERE email = 'tu@email.com'"
   ```
4. Iniciá sesión, creá una nota, escribí algo, recargá la página → debe persistir.
   - Comprobá en D1: `wrangler d1 execute micelio-prod --remote --command "SELECT titulo FROM notas"`.
   - Comprobá en R2: `wrangler r2 object get micelio-blobs/<r2_key>` (la key está en `notas.r2_key`).
5. Probá la **búsqueda global** (FTS5) y el **grafo**.
6. En DevTools (pestaña Application → Cookies) confirmá que `micelio_refresh`
   se setea con `Secure` y el `SameSite` esperado, y que al recargar la sesión
   sigue activa (`/auth/refresh`).

---

## 8. Variables de entorno (referencia)

### Render (backend) — notación con doble guion bajo

| Variable | Valor | ¿Secreto? |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` | no |
| `Storage__Provider` | `cloudflare` | no |
| `Cloudflare__AccountId` | tu Account ID | sí |
| `Cloudflare__ApiToken` | token D1:Edit (paso 3) | **sí** |
| `Cloudflare__D1__DatabaseId` | id de la D1 (paso 1) | sí |
| `Cloudflare__R2__Bucket` | `micelio-blobs` | no |
| `Cloudflare__R2__AccessKeyId` | token R2 (paso 2) | **sí** |
| `Cloudflare__R2__SecretAccessKey` | token R2 (paso 2) | **sí** |
| `Jwt__Secret` | aleatorio largo (`openssl rand -base64 48`) | **sí** |
| `Jwt__Issuer` | `micelio` | no |
| `Cors__FrontendOrigin` | URL de Pages, sin barra final | no |
| `Auth__CookieSameSite` | `None` (o `Lax` con dominio propio) | no |
| `Auth__CookieSecure` | `true` | no |
| `Auth__CookieDomain` | *(solo con dominio propio)* `.midominio.com` | no |

### Cloudflare Pages (frontend)

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend en Render, sin barra final |

---

## 9. Conmutar entre local y despliegue

No hace falta tocar código. El proveedor se elige por configuración:

**Backend**
- **Local**: `appsettings.Development.json` ya fuerza `Storage:Provider=local`
  (SQLite + disco). `dotnet run` y listo (usuario seed `dev@micelio.local` / `micelio123`).
- **Producción**: `ASPNETCORE_ENVIRONMENT=Production` + las env vars de §8 →
  `Storage:Provider=cloudflare`.

**Frontend**
- **Local**: `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:5279` (`npm run dev`).
- **Producción**: `.env.production` / variable en Pages → URL de Render.

> ⚠️ **Gotcha**: en un `next build` local, `.env.local` **tiene prioridad** sobre
> `.env.production`. En el CI de Pages no existe `.env.local`, así que ahí manda la
> variable del dashboard / `.env.production`. (Por eso un build local apunta a
> localhost aunque exista `.env.production`.)

---

## 10. Aplicar cambios después del primer deploy

- **Backend**: push a `deploy/cloudflare` → Render redeploya solo (`autoDeploy: true`).
- **Frontend**: push → Pages rebuild automático. O manual: `npm run deploy:pages`.
- **Cambios de esquema**: agregá las sentencias a `backend/migrations/d1/schema.sql`
  (con `IF NOT EXISTS` / `ALTER`) y reaplicá con `wrangler d1 execute ... --file=...`.
- **Rollback**: Render guarda releases anteriores (botón *Rollback*); Pages guarda
  cada deployment (*Deployments → Rollback*).

---

## 11. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| La sesión no persiste al recargar | cookie cross-site bloqueada | usar dominio propio + `SameSite=Lax` + `CookieDomain`; en Safari es obligatorio |
| `CORS` / preflight falla | `Cors__FrontendOrigin` mal | URL exacta de Pages, sin barra final; redeploy del backend |
| `500` al loguear | falta `Jwt__Secret` o credenciales D1 | revisar env vars en Render; ver logs |
| Primera request lentísima | cold start del plan free de Render | plan `starter` o un ping periódico |
| Export PDF falla | Chromium en el contenedor | el Dockerfile instala Chromium + `PUPPETEER_EXECUTABLE_PATH`; revisar logs de Puppeteer |
| `D1 HTTP 4xx` en logs | token/ids D1 incorrectos | revisar `Cloudflare__ApiToken`, `AccountId`, `D1__DatabaseId` |

---

## 12. Diferido (no incluido en este despliegue)

- **Colaboración en tiempo real** (HU-05/06/37): requiere un **Durable Object**
  (relay y-websocket) + `Collab:RelayBaseUrl`. Hasta entonces, las notas
  compartidas se editan por turnos. Es la única pieza que necesitaría compute en
  Cloudflare (Workers/DO).
- **Email transaccional** (Resend) y verificación automática: por ahora el admin
  verifica las cuentas a mano en D1 (paso 7.3).
