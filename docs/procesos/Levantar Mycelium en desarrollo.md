# Levantar Mycelium en desarrollo

Cómo correr cada versión. Las dos viven en ramas distintas y **no** se levantan igual
(ver [[Arquitectura de Mycelium]]).

## Desktop (`desktop-tauri`)

Un solo comando: Tauri arranca `next dev` y abre la ventana nativa.

```sh
cd frontend
npm run tauri dev
```

- No hay login: entra directo al workspace (ver [[desktop-sin-login]]).
- Los datos viven en la **carpeta del vault** que elijas (ver [[vault-en-carpeta]]);
  el índice SQLite queda en `<vault>/.mycelium/`.
- Cuando cambiás **Rust**, hay que reiniciar (se recompila). Cambios de frontend
  recargan en caliente.
- La config de ventana (`tauri.conf.json`) tampoco recarga en caliente: reiniciar.

> [!warning] Si `tauri dev` falla con "beforeDevCommand terminated with non-zero"
> Suele quedar un `next dev` **huérfano** ocupando `:3000` de una ejecución anterior.
> Ver [[Compilacion y entorno de desarrollo]].

## Web (`web-cloud`)

Dos procesos: backend .NET + frontend Next.

```sh
# Backend — http://localhost:5279
cd backend/src/Micelio.Api
dotnet run

# Frontend — http://localhost:3000
cd frontend
npm install
npm run dev
```

Detalles verificados:

- Las rutas del backend **no** llevan prefijo `/api` (p. ej. `POST /auth/login`;
  `/api/health` no existe).
- Todo corre local con `Storage:Provider=local` en `appsettings.Development.json`.
- Credenciales de desarrollo: `dev@micelio.local` / `micelio123`.

> [!danger] No borrar los datos locales de la web
> `backend/src/Micelio.Api/micelio.local.db` y `.local-storage/blobs/` están **fuera de
> git** y contienen el vault real de pruebas del usuario. Aunque el README los describa
> como "desechables", **no se borran**.

## Cambiar de rama sin romper nada

Cuando hay que ver la otra versión sin abandonar la actual, usar un **worktree** en vez
de `git switch` (el usuario suele tener la app corriendo):

```sh
git worktree add "$TEMP/mycelium-web" web-cloud
# … trabajar …
git worktree remove --force "$TEMP/mycelium-web"
```

Un worktree recién creado **no tiene** `node_modules`: correr `npm ci`.

## Relacionadas

- [[Verificar antes de integrar]] — qué correr antes de dar algo por hecho.
- [[Reflejar cambios de desktop a web]] — el flujo que usa worktrees.
- [[Capa de datos del desktop]] / [[Capa de datos de la web]] — qué hay detrás.
- [[Generar instaladores desktop]] — build de producción.
- [[Mapa de documentacion]] — índice general.
