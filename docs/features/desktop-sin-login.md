# Desktop sin login (feat/sin-login-desktop)

## Objetivo

Eliminar el concepto de usuario/login de la experiencia de escritorio. Como en
Obsidian: se abre la app y se está en el vault local. Sin páginas de auth, sin
sección "Cuenta" en Configuración, sin avatar en la topbar.

## Decisión clave: el esquema NO cambia

Las tablas `usuarios`, `vaults` y `membresias` y el seed `local-user` se
conservan como **plomería interna**. El plugin sqlx valida el checksum de
`src-tauri/migrations/001_init.sql` contra las bases ya creadas: modificar esa
migración rompería todas las instalaciones existentes ("migration was
previously applied but has been modified"). Por eso `lib/db/auth.ts` sigue
sembrando la identidad interna y `session()`/`me()` mantienen la FORMA de sus
respuestas; solo desaparece todo lo visible al usuario.

## Qué se eliminó

- **Páginas de auth**: `app/(auth)/` completo (login, register,
  forgot-password, reset-password, verify-email, layout y css).
- **`stores/authStore.ts`**: `login`, `register`, `logout`, `setUser` y el
  timer de `scheduleRefresh` (la sesión local no expira). Quedan `user`,
  `vaults`, `accessToken`, `initialized`, `restore` y un nuevo campo `error`
  con el detalle del último fallo de `restore()`.
- **Configuración**: pestaña "Cuenta" (`AccountSection.tsx` borrado) y botón
  "Cerrar sesión" del drawer. La pestaña por defecto pasa a ser "Apariencia".
- **Topbar**: avatar/botón de usuario (Configuración sigue accesible desde el
  rail). El botón "Compartir" no se toca (el sharing latente es otro tema).
- **`lib/api.ts` (dispatcher)**: rutas muertas `login`, `logout`,
  `cerrar-todo`, `register`, `verify-email`, `forgot-password`,
  `reset-password`, `cambiar-password` y `perfil`. Se conservan `refresh`
  (lo usa `restore()`), `me`, `preferencias` y `css/snippets`.
- **`lib/db/auth.ts`**: `actualizarPerfil` (sin llamadores).
- **Smoke tests**: ya no pasan por `/login`; navegan directo a `/workspace`.

## Comportamiento del guard

`WorkspaceGuard` (`app/(workspace)/workspace/page.tsx`) llama a `restore()`
al cargar:

- **En curso**: estado de carga ("Cargando…"), igual que antes.
- **Éxito**: se monta el shell del workspace.
- **Fallo**: NUNCA redirige a login (no existe). Muestra un estado de error
  local dentro de la misma página: "No se pudo abrir el vault local.", el
  detalle del error (campo `error` del store) y un botón **Reintentar** que
  vuelve a llamar `restore()`.

## Relacionadas

- [[Arquitectura de Mycelium]] — el lugar de esta decisión en el conjunto.
- [[Diferencias funcionales aceptadas entre versiones]] — el login existe solo en web.
- [[Capa de datos de la web]] — la contraparte con usuarios.
- [[RAMAS]] — archivos que divergen por esto.
