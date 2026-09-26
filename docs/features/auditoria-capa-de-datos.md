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

## Cómo quedó

> [!success] Implementado el 2026-09-26 en `feat/auditoria-capa-datos-desktop`
> Verificado con `tsc` (sin errores), `cargo check`, `cargo test --lib` (51/51: los 49
> de antes con los de `prefs_vault` reescritos, más 2 nuevos), los tests headless
> (`node --test scripts/test-*.mjs`: 440/440, con 16 del nuevo `test-capa-datos.mjs`) y
> `next build` (exit 0; solo los dos avisos previos de `::highlight` en `editor.css`). Un índice real de cada época abre
> sin error con el esquema nuevo (criterio 6, abajo). **Falta confirmarlo en la app.**

### Cifras

- `frontend/`: 37 archivos, +1284 / −1518. Sin contar lo nuevo (`lib/db/legado.ts`, 178
  líneas, y `scripts/test-capa-datos.mjs`, 382), **−794 líneas netas**.
- Borrados 6 archivos: `lib/db/auth.ts`, `lib/db/preferencias.ts`, `lib/db/snippets.ts`,
  `src-tauri/migrations/001_init.sql`, `src-tauri/tests/data_layer.rs` (y la carpeta
  `migrations/`).
- 4 tablas fuera del esquema del índice (`usuarios`, `vaults`, `membresias`,
  `css_snippets`) y 3 índices SQL suyos.
- 7 manejadores de ruta fuera del dispatcher (todas las de autenticación).
- Comandos Rust: −2 (`leer_prefs_vault`, `escribir_prefs_vault`), +1
  (`borrar_estado_vault`, solo para legados).
- Commits: `f0b6913` (parte 1) y `f97aaeb` (partes 2 y 3, juntas porque la fila
  `usuarios` era el transporte de la apariencia: H2 pedía hacerlas a la vez).

### 1. El modo clásico, fuera

- `lib/db/vaultContext.ts`: `getVaultActual()` devuelve `string` y **lanza** un
  `DbError(409)` sin vault. Aloja además `LOCAL_VAULT_ID` (antes en `auth.ts`).
- Sin ramas `vault === null` en `notas.ts`, `carpetas.ts`, `papelera.ts`,
  `contenido.ts`, `enlaces.ts` ni `estadoVault.ts` (25 líneas que lo preguntaban en la
  base: 4 + 5 + 6 + 1 + 4 + 5, contando el `enCarpeta` de `contenido.ts`). Con
  ellas se fueron `ftsRetitular` (`ftsIndice.ts`), `tituloUnico` (`util.ts`) y
  `titulosEnCarpeta`, la consulta que `crearNota` corría y descartaba. `nuevoId` de
  `util.ts` queda: lo usan las filas de la papelera (el del canvas es otro, en
  `lib/canvas.ts`). `ExecResult.lastInsertId` ya no existía (lo quitó `FUN-M-39`).
- `lib/db/client.ts`: sin `DB_URL` ni executor por defecto. `getExecutor()` lanza si no
  hay índice abierto; `setExecutor(null)` al cerrar el vault ya no «vuelve» a nada.
- Rust: `lib.rs` sin `DB_URL`, sin `Migration`/`add_migrations` (el plugin SQL se
  registra sin migraciones); `migrations/001_init.sql` borrado. El `mycelium.db` del
  app-data se ignora (no se borra).
- `WorkspaceGuard` (`workspace/page.tsx`): decide por `vaultSessionStore.rutaActual`, ya
  no por `authStore.user`. Sin vault que reabrir (`?vault=` o `sessionStorage`), o si
  no se pudo, va a `/vaults`. La pantalla «No se pudo abrir el vault local» con
  «Reintentar» desapareció con su CSS: el único fallo posible ya redirigía a la
  selección.
- Comentarios de H14: la cabecera y el esquema de `indexer.ts` ya no hablan de
  `mycelium.db`, `ensureSeed` ni de «espejar» `001_init.sql`; `ArchivoLeido` (TS y Rust)
  explica por qué va en `snake_case` (la comparten `leer_archivos` y `leer_carpeta`, que
  sí sigue viva en `lib/import.ts`); la cabecera de `archivos.rs` ya no dice «tres
  comandos»; `nombres.ts`, `api.ts`, `ExplorerPanel.tsx` y `AppTopbar.tsx` ya no
  mencionan el modo clásico. `vaultMode.ts`, `vault_config.rs` y `sharing.ts` ya los había
  resuelto `FUN-M-39`.
- [[vault-en-carpeta]] § 6 ya remitía a la decisión; se agregó un aviso en § 8
  («Cómo volver atrás»), cuyo procedimiento presuponía `mycelium.db`.
  [[desktop-sin-login]] ya tenía su aviso de «superada».

### 2. La identidad, fuera

- `stores/authStore.ts`: fachada de constantes creada con `zustand` (mismo hook, misma
  forma): `user` fijo, `vaults = [{ id: LOCAL_VAULT_ID, nombre: "Mi Vault", … }]`,
  `accessToken = "local"`, `initialized = true`, `error = null`, `restore()` resuelve
  `true` sin hacer nada. `User` perdió `tema`/`modoOscuro`/`preferencias`: la apariencia
  ya no viaja en el usuario. Ningún componente compartido cambió.
- Borrados `lib/db/auth.ts` (`ensureSeed`, `session`, `me`, `EXPIRES_IN_MINUTES`),
  `lib/db/preferencias.ts` y `lib/db/snippets.ts`; el dispatcher perdió **todas** las
  rutas de autenticación (7 manejadores: `refresh`, `me`, `preferencias` y los cuatro de
  `css/snippets`). `types.ts` perdió `RowUsuario`, `RowCssSnippet`, `UserDto`,
  `VaultDto`, `SessionResponse`, `MeResponse`, `SnippetsResponse` y `CssSnippetDto`.
- Esquema del índice: sin `usuarios`, `vaults`, `membresias` ni `css_snippets` (y sus
  tres índices). `ApiOptions.token` queda opcional, documentado como ignorado.
- `vaultSessionStore`: sin la etapa «identidad» (`ETAPAS` tiene cuatro) ni el
  `restore()` de cada apertura.

> [!important] Decisión: **no** se hace `DROP TABLE` de las tablas viejas
> Un índice creado antes conserva `usuarios`, `vaults`, `membresias` y `css_snippets`
> (`CREATE TABLE IF NOT EXISTS` no borra nada). Se dejan, por dos motivos:
> 1. **Son la única copia** de la apariencia y los snippets de quien actualiza desde la
>    **2.1.0**: `DEF-107` (que los sacó a `.mycelium/`) todavía no salió en ningún
>    release. La migración única (§ 3) los lee de ahí; borrarlas al abrir, antes o
>    después de una migración que pudo fallar, sería perderlos.
> 2. No estorban: nadie más las lee, `carpetas` y `notas` del índice nunca tuvieron
>    clave foránea hacia `vaults`, y reconstruir el índice (borrarlo) las elimina.
>
> Retirarlas es opcional y se puede hacer cuando ya no quede ningún índice de la 2.1.0.

### 3. Un solo mecanismo de preferencias por vault

- `prefsVaultStore`: `PrefsVault` suma `tema`, `modoOscuro` y `preferencias` (el objeto
  entero de `preferencesStore`), saneados en `normalizar`; exporta
  `sanearContraDefectos`, con el que `preferencesStore` sanea cada clave de
  `preferencias` contra su `DEFAULT_PREFS`. Lee y escribe con `leer/escribir_estado_vault`
  (`nombre: "preferencias.json"`). Detalle y tabla de claves en [[preferencias-por-vault]] § 7.
- `preferencesStore`: solo cambian `persistPrefs` (tres `set` sobre `prefsVaultStore`,
  que ya difiere el guardado 400 ms; se fue su temporizador propio) y `hydrateFromUser`
  (lee de `prefsVaultStore.prefs`). Nombre conservado por la forma compartida con web.
- `cssStore`: lee y escribe `.mycelium/snippets.json` directo (`leerSnippets` /
  `guardarSnippets`, con una cola para que dos cambios seguidos no se guarden en
  desorden). El formato sigue siendo `{ version: 1, snippets: [...] }`, sin `creadoEn`:
  el orden es el de la lista. Un snippet sin `id` o sin CSS en un archivo editado a mano
  se descarta.
- `lib/db/estadoVault.ts`: solo la papelera (`respaldarPapelera`,
  `restaurarEstadoVault`). Se fueron `respaldarApariencia`, `respaldarSnippets` y la
  copia `apariencia.json`/`snippets.json` ↔ tablas.
- `vaultSessionStore.abrir`, etapa «ajustes»: `migrarEstadoLegado` → `await
  prefsVaultStore.cargar` → `hydrateFromUser` → `await cssStore.load`. La carga de las
  preferencias del vault **se espera** (antes era `void`): trae el tema, y aplicarlo
  antes de mostrar el workspace evita un parpadeo con la apariencia del vault anterior.
  El `useEffect` del guard que hidrataba y cargaba el CSS desapareció. `salir()` vacía
  también los snippets.
- **Migración única** (`lib/db/legado.ts`, nuevo): si `preferencias.json` no tiene
  `tema`, toma la apariencia de `apariencia.json` o, si no existe, de la fila `usuarios`
  del índice viejo; la funde con lo que el archivo tenía y **borra** `apariencia.json`.
  Si no existe `snippets.json`, lo arma desde `css_snippets`. Cada parte es best-effort:
  un fallo se registra y el vault abre con los valores por defecto.
- Rust (`prefs_vault.rs`): `leer_estado_vault` / `escribir_estado_vault` con
  `preferencias.json` en `ESTADOS`; `leer/escribir_prefs_vault` y sus funciones privadas,
  fuera. **Desvío**: se agregó `borrar_estado_vault`, restringido a una lista `LEGADOS`
  que hoy solo tiene `apariencia.json`, que además se puede **leer** pero no
  **escribir**. Hacía falta un comando para que la migración borre el archivo (criterio
  3) sin abrir una puerta para borrar estados vigentes. Tests del módulo: 10 (dos nuevos:
  el legado se lee y se borra pero no se escribe; un estado vigente no se puede borrar).
- `CustomCssSection.tsx`: el texto dice que los snippets «se guardan dentro del vault
  abierto y viajan con su carpeta» (antes: «en esta máquina, junto al vault»).

### Desvíos respecto de esta spec

- **Migración también desde el índice viejo**, no solo desde `apariencia.json`. La spec
  pedía migrar `apariencia.json`; pero `DEF-107` no salió en ningún release, así que
  quien actualiza desde la 2.1.0 tiene su tema y sus snippets solo en `usuarios` y
  `css_snippets`. Sin esta segunda fuente, perdería los dos.
- **`borrar_estado_vault`** (arriba): un comando más, acotado a los legados.
- **`tabla.ts`** no tenía una rama `vault === null`, sino la composición de `file.path`
  a partir de carpeta + título (sin extensión). Se conservó el comportamiento —cambiarlo
  a `f.id` alteraría el valor de `file.path` que las bases ya guardadas comparan— y se
  corrigió el comentario, que lo atribuía al modo clásico.
- **`src-tauri/tests/data_layer.rs` borrado**, con las dev-dependencies `sqlx` y `tokio`
  (el `Cargo.lock` pierde `tokio-macros`): era el smoke test de la fase 0 y aplicaba
  `001_init.sql`, un esquema que ya no existe. Lo que probaba hoy lo cubren los tests
  headless y la verificación del criterio 6.
- **La pantalla de error del guard** se quitó (arriba): no está en la spec, pero con
  `authStore` constante ya no había ningún fallo que la mostrara.

### Criterio 6, con índices reales

Se copiaron al scratchpad tres índices del app-data (solo lectura sobre los originales):
uno de julio (fase 3, sin `propiedades`, `fts_filas` ni `hash_indexable`), uno de agosto y
uno de septiembre (con `css_snippets` con una fila). Sobre cada copia, con
`foreign_keys=ON` como sqlx, se aplicó el `ESQUEMA_INDICE` nuevo sacado del propio
`indexer.ts`, los `ALTER` defensivos y `crearFtsFilas`, y después las consultas de la
migración y un ciclo crear carpeta → crear nota → guardar → FTS → papelera → buscar.
Los tres abrieron sin error (y uno recién creado, también).

### Qué confirmar en la app

1. **Arranque**: en frío con «abrir el último»; recargar (F5) con un vault abierto;
   «Abrir en ventana nueva» desde el selector (`?vault=`). Y pegar `/workspace` sin vault
   (p. ej. tras «Salir del vault» y volver atrás): debe ir a la selección.
2. **Apariencia por vault**: cambiar tema, modo oscuro, atmósfera y tipografía; cerrar y
   reabrir el vault → se conservan. Abrir otro vault → trae los suyos. Mirar
   `.mycelium/preferencias.json`: tiene `tema`, `modoOscuro` y `preferencias`.
3. **Snippets**: importar, activar/desactivar, renombrar, editar y borrar (con
   «Deshacer»); cerrar y reabrir → se conservan en `.mycelium/snippets.json`.
4. **Migración**: un vault que tenga `.mycelium/apariencia.json` abre con su apariencia y
   el archivo desaparece. Uno que no se abría desde la 2.1.0 (sin `preferencias.json` con
   `tema`) abre con el tema y los snippets que tenía.
5. **Papelera**: borrar, recuperar y borrar para siempre siguen funcionando, y
   `.mycelium/papelera.json` se actualiza.
6. La pantalla de carga muestra cuatro etapas (sin «Preparando el vault»).

## Relacionadas

- [[El modo SQLite clasico queda muerto]] — la decisión D1.
- [[Auditoria de codigo 2026-09-26]] — el plan completo.
- [[preferencias-por-vault]] — la funcionalidad que absorbe la apariencia.
- [[Capa de datos del desktop]] — a actualizar al cerrar.
- [[BACKLOG]] — `FUN-L-24`.
