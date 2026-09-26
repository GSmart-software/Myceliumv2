# Auditoría: capa de datos (`FUN-L-24` · `AUDITORIA-CAPA-DATOS`)

Tanda 3 de la [[Auditoria de codigo 2026-09-26]]: la simplificación de la capa de datos
de desktop que las decisiones **D1** ([[El modo SQLite clasico queda muerto]]) y **D3**
(tema, tipografía y atmósfera son **por vault**) habilitan. Reúne los hallazgos H1, H2,
H3, H10 y H14 de [[Auditoria de complejidad 2026-09-26]] y la rama «clásico» de
[[Auditoria de codigo muerto 2026-09-26]].

> [!info] Alcance: **SOLO-DESKTOP**
> Todo vive en `lib/db/*`, los stores que ya divergen de web (`authStore`,
> `vaultSessionStore`) y Rust. `preferencesStore` y `cssStore` son idénticos a web: la
> divergencia se acota a las funciones de persistencia (ver § 3) y se anota en [[RAMAS]].

> [!warning] Orden: después de `FUN-M-38` y `FUN-M-39`
> Las tandas 1 y 2 tocan `indexer.ts`, `contenido.ts`, `vaultStore` y `NoteEditor`. Esta
> se lanza cuando esas dos estén integradas, sobre `desktop-tauri` actualizado.

## 1. Retirar el modo clásico (D1 · compl. H1 + H14)

- `lib/db/vaultContext.ts`: `getVaultActual()` **lanza** (`DbError` con mensaje claro) si
  no hay vault; `setVaultActual(null)` solo al cerrar el vault.
- Borrar las ramas `getVaultActual() === null` de `notas.ts`, `carpetas.ts`,
  `papelera.ts`, `contenido.ts`, `enlaces.ts`, `estadoVault.ts`, `tabla.ts` (y donde
  aparezcan); con ellas, `ftsRetitular`, `tituloUnico` (y la consulta
  `titulosEnCarpeta` que `crearNota` corría y descartaba), `ExecResult.lastInsertId`.
  `nuevoId` **queda** (lo usa el canvas).
- `lib/db/client.ts`: sin executor por defecto ni `DB_URL`; `getExecutor()` lanza si no
  se abrió un índice (los tests inyectan con `setExecutor`).
- Rust `lib.rs`: quitar `add_migrations`/`001_init.sql` y toda referencia a
  `mycelium.db`. El archivo viejo en el app-data se ignora, no se borra.
- `WorkspaceGuard` sin vault → `router.replace("/vaults")` (ya lo hace; confirmar que no
  quede otro camino).
- `lib/db/indexer.ts`: el esquema TS deja de «espejar» nada; quitar el comentario de
  sincronización obligatoria.
- Comentarios de H14 (`indexer.ts`, `vaultMode.ts`, `vault_config.rs`, `client.ts`,
  `archivos.rs`, `sharing.ts` si sobrevivió): describir el estado real.
- [[vault-en-carpeta]] § 6 y [[desktop-sin-login]]: nota al pie que remite a la decisión.

## 2. Retirar la identidad interna (compl. H2)

- `stores/authStore.ts` pasa a **fachada síncrona con constantes**: `user` fijo,
  `vaults = [{ id: LOCAL_VAULT_ID, … }]`, `accessToken = "local"`, `initialized = true`,
  `restore()` sin efecto. Así los componentes idénticos a web que leen `useAuthStore`
  no cambian.
- Borrar `lib/db/auth.ts` (`ensureSeed`, `session`, `me`, `EXPIRES_IN_MINUTES`), las
  rutas `/auth/refresh`, `/auth/me` y `/auth/preferencias` del dispatcher, y las tablas
  `usuarios`, `vaults`, `membresias` del esquema del índice (los índices existentes las
  conservan vacías: `CREATE TABLE IF NOT EXISTS` no las borra y nadie las lee; documentar
  que un `DROP TABLE IF EXISTS` al abrir es opcional).
- `ApiOptions.token` queda opcional e **ignorado**: no se tocan los 58 llamadores.
- La etapa «identidad» de la pantalla de carga (`vaultSessionStore`) desaparece.

## 3. Un solo mecanismo de preferencias por vault (D3 · compl. H3 + H10)

- **Persistencia**: `preferencesStore.persistPrefs` e `hydrateFromUser` (desktop) y
  `cssStore` leen y escriben **directo** un JSON de `.mycelium/` con el comando de
  estado del vault; desaparecen `lib/db/preferencias.ts`, la fila `usuarios` como
  transporte, `respaldarApariencia`, `respaldarSnippets` y la tabla `css_snippets` como
  copia (queda solo la **papelera** en `estadoVault.ts`, que sí necesita filas en
  `notas`).
- **Archivos**: `apariencia.json` se **funde** en `preferencias.json` (las claves de
  apariencia pasan a `PrefsVault`: tema, modo oscuro, atmósfera, tipografía, tamaño del
  editor, lo que hoy viaje en `preferencias_json`); `snippets.json` sigue aparte.
  Migración única al abrir: si existe `apariencia.json` y `preferencias.json` no tiene
  esas claves, se copian y se borra `apariencia.json`.
- **Rust** (`prefs_vault.rs`): un solo par `leer_estado_vault(nombre)` /
  `escribir_estado_vault(nombre)` con `preferencias.json` en la lista cerrada;
  `leer/escribir_prefs_vault` desaparecen. Tests del módulo actualizados.
- `prefsVaultStore` se convierte en **el** store de preferencias por vault;
  `preferencesStore` conserva su API para los componentes compartidos pero, en desktop,
  delega la persistencia en el mismo archivo. Documentar la regla en
  [[preferencias-por-vault]] y la divergencia en [[RAMAS]].

## 4. Criterios de aceptación

1. Arranque frío, recarga con vault abierto y ventana nueva (`?vault=`) funcionan; sin
   vault, el workspace redirige a la selección.
2. Tema, modo oscuro, atmósfera, tipografía y snippets CSS **persisten al cerrar y
   reabrir** el vault, y otro vault tiene los suyos.
3. Un vault con `apariencia.json` viejo conserva su apariencia al abrirlo con esta
   versión, y el archivo desaparece tras la migración.
4. No queda ninguna referencia a `mycelium.db`, `001_init.sql`, `ensureSeed`,
   `/auth/`, `apariencia.json` (salvo la migración) ni `getVaultActual() === null`.
5. `tsc`, `cargo check`, `cargo test --lib prefs_vault`, tests headless de repos, `next
   build`.
6. Un índice creado por la versión anterior (con las tablas viejas) abre sin error.

## 5. Casos borde

- Vault sin `.mycelium/` todavía: se crea al escribir, como hoy.
- `preferencias.json` editado a mano con claves de apariencia inválidas: `normalizar`
  las descarta y cae al defecto, como con las demás.
- Dos ventanas del mismo vault (`FUN-L-16` lo impide): sin cambio.
- Web: **no se refleja**; `preferencesStore` y `cssStore` divergen en la persistencia y
  se anotan en [[RAMAS]] con el motivo.

## 6. Versionado

Patch o absorbido por el minor que esté abierto: el usuario no gana nada que antes no
pudiera hacer. Si sale con la `2.2.0`, viaja absorbido.

## Relacionadas

- [[El modo SQLite clasico queda muerto]] — la decisión D1.
- [[Auditoria de codigo 2026-09-26]] — el plan completo.
- [[preferencias-por-vault]] — la funcionalidad que absorbe la apariencia.
- [[Capa de datos del desktop]] — a actualizar al cerrar.
- [[BACKLOG]] — `FUN-L-24`.
