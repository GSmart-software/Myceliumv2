-- Esquema Cloudflare D1 (producción). Espejo de migrations/local/local_schema.sql
-- (SQLite puro, D1-compatible, FTS5 incluido). En modo cloudflare el
-- LocalDbInitializer NO corre, así que este esquema se aplica manualmente:
--   wrangler d1 execute micelio-prod --remote --file=backend/migrations/d1/schema.sql
-- Idempotente: todo es CREATE ... IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS usuarios (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,
  nombre           TEXT NOT NULL,
  password_hash    TEXT,                 -- NULL si la cuenta es solo OAuth
  github_id        TEXT,
  avatar_url       TEXT,
  email_verificado INTEGER NOT NULL DEFAULT 0,
  tema             TEXT NOT NULL DEFAULT 'bioluminiscencia',
  modo_oscuro      INTEGER NOT NULL DEFAULT 1,
  preferencias_json TEXT,                -- tipografía y demás preferencias (HU-14)
  creado_en        TEXT NOT NULL,
  actualizado_en   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          TEXT PRIMARY KEY,
  usuario_id  TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expira_en   TEXT NOT NULL,
  revocado    INTEGER NOT NULL DEFAULT 0,
  creado_en   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Verificación de email y reset de contraseña (HU-32)
CREATE TABLE IF NOT EXISTS tokens_un_uso (
  id          TEXT PRIMARY KEY,
  usuario_id  TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('verificar_email', 'reset_password')),
  token_hash  TEXT NOT NULL,
  expira_en   TEXT NOT NULL,
  usado       INTEGER NOT NULL DEFAULT 0,
  creado_en   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tokens_un_uso_usuario ON tokens_un_uso(usuario_id);

CREATE TABLE IF NOT EXISTS vaults (
  id             TEXT PRIMARY KEY,
  nombre         TEXT NOT NULL,
  propietario_id TEXT NOT NULL REFERENCES usuarios(id),
  creado_en      TEXT NOT NULL
);

-- Membresías sobre vaults o carpetas compartidas (HU-33 / HU-35)
CREATE TABLE IF NOT EXISTS membresias (
  id           TEXT PRIMARY KEY,
  usuario_id   TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  recurso_tipo TEXT NOT NULL CHECK (recurso_tipo IN ('vault', 'carpeta')),
  recurso_id   TEXT NOT NULL,
  rol          TEXT NOT NULL CHECK (rol IN ('lector', 'editor', 'propietario')),
  creado_en    TEXT NOT NULL,
  UNIQUE (usuario_id, recurso_tipo, recurso_id)
);

CREATE INDEX IF NOT EXISTS idx_membresias_usuario ON membresias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_membresias_recurso ON membresias(recurso_tipo, recurso_id);

CREATE TABLE IF NOT EXISTS carpetas (
  id             TEXT PRIMARY KEY,
  vault_id       TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  padre_id       TEXT REFERENCES carpetas(id) ON DELETE CASCADE,
  nombre         TEXT NOT NULL,
  creado_en      TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_carpetas_vault ON carpetas(vault_id);
CREATE INDEX IF NOT EXISTS idx_carpetas_padre ON carpetas(padre_id);

-- El título de la nota ES el nombre del archivo (HU-23). r2_key es ID-based
-- e invariante ante renombres. El contenido .md vive en blob storage (HU-04).
CREATE TABLE IF NOT EXISTS notas (
  id             TEXT PRIMARY KEY,
  vault_id       TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  carpeta_id     TEXT REFERENCES carpetas(id) ON DELETE SET NULL,
  titulo         TEXT NOT NULL,
  tipo           TEXT NOT NULL DEFAULT 'markdown',  -- 'markdown' | 'excalidraw' (HU-16)
  r2_key         TEXT NOT NULL,
  tamano_bytes   INTEGER NOT NULL DEFAULT 0,
  creado_en      TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notas_vault ON notas(vault_id);
CREATE INDEX IF NOT EXISTS idx_notas_carpeta ON notas(carpeta_id);

-- Papelera: retiene 30 días, luego eliminación permanente (HU-23)
CREATE TABLE IF NOT EXISTS papelera (
  id                  TEXT PRIMARY KEY,
  nota_id             TEXT NOT NULL UNIQUE REFERENCES notas(id) ON DELETE CASCADE,
  ruta_original       TEXT NOT NULL,
  carpeta_original_id TEXT,
  eliminado_en        TEXT NOT NULL
);

-- Índice full-text del contenido de notas (HU-21). Se actualiza al guardar.
-- `contenido` es el texto LEGIBLE de la nota y `extra` lo que se busca sin
-- mostrarse —valores de propiedades, destinos de enlaces con alias—; el
-- fragmento de un resultado sale de `contenido` (DEF-148). Una base anterior,
-- sin `extra`, se migra con migrations/d1/2026-10-busqueda.sql.
CREATE VIRTUAL TABLE IF NOT EXISTS notas_fts USING fts5(
  nota_id UNINDEXED,
  titulo,
  contenido,
  extra
);

-- Propiedades del frontmatter YAML de cada nota (FUN-M-04). El índice NO es la
-- fuente de verdad —lo son los archivos—, pero es lo que las hace CONSULTABLES.
-- Una fila POR ELEMENTO de lista, así `clave='tags' AND valor='activo'` funciona
-- sin LIKE. Se reescribe entera (delete + insert) al guardar contenido.
-- `clave_plegada` y `valor_plegado` son la clave y el valor sin tildes ni
-- mayúsculas (DEF-144): las compara el filtro `clave:valor` de la búsqueda.
-- Se pliegan en el backend porque `NOCASE`/`lower()` de SQLite solo entienden ASCII.
CREATE TABLE IF NOT EXISTS propiedades (
  nota_id       TEXT NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  clave         TEXT NOT NULL,
  valor         TEXT NOT NULL,
  tipo          TEXT NOT NULL,
  orden         INTEGER NOT NULL DEFAULT 0,
  clave_plegada TEXT NOT NULL DEFAULT '',
  valor_plegado TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_propiedades_nota  ON propiedades(nota_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_clave ON propiedades(clave);
CREATE INDEX IF NOT EXISTS idx_propiedades_plegado ON propiedades(clave_plegada, valor_plegado);

-- Etiquetas de cada nota (DEF-152): `tags:` del frontmatter más los `#tag` del
-- cuerpo fuera del código, una fila por etiqueta. Es lo que filtra `tag:x` en
-- la búsqueda —antes `tag:x` buscaba la palabra x en todo el texto—.
-- `tag_plegado` va sin tildes, mayúsculas, `#` inicial ni `/` final; el índice
-- trae `nota_id` para que el filtro no toque la tabla.
CREATE TABLE IF NOT EXISTS etiquetas (
  nota_id     TEXT NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  tag_plegado TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_etiquetas_nota    ON etiquetas(nota_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_plegado ON etiquetas(tag_plegado, nota_id);

-- Snippets de CSS personalizado por usuario (estilo Obsidian, HU-13/15).
-- El contenido vive en blob (usuarios/{id}/css/{snippetId}.css).
CREATE TABLE IF NOT EXISTS css_snippets (
  id          TEXT PRIMARY KEY,
  usuario_id  TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  activo      INTEGER NOT NULL DEFAULT 1,
  r2_key      TEXT NOT NULL,
  creado_en   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_css_snippets_usuario ON css_snippets(usuario_id);

-- Recordatorios del calendario (FUN-L-22). Son DEL VAULT, como en desktop, donde
-- viven en `.mycelium/recordatorios.json`. Acá se guarda ese mismo documento JSON
-- entero ({version, recordatorios, ocurrencias}) por vault: el modelo
-- (`lib/recordatorios.ts`) es el mismo en las dos versiones y el servidor no
-- interpreta nada. No son notas: no entran al árbol, al FTS ni al grafo.
-- Concurrencia: última escritura gana (el cliente reemplaza el documento).
CREATE TABLE IF NOT EXISTS recordatorios_vault (
  vault_id       TEXT PRIMARY KEY REFERENCES vaults(id) ON DELETE CASCADE,
  datos          TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

-- Diccionarios personales del corrector ortográfico (FUN-L-12). Texto plano,
-- una palabra por renglón, el mismo formato que en desktop
-- (`lib/ortografia/palabras.ts`); el servidor no lo interpreta, solo lo guarda.
-- El DEL VAULT es en desktop `.mycelium/diccionario.txt`: viaja con el vault y
-- vale para todos los que lo editan. Concurrencia: última escritura gana.
CREATE TABLE IF NOT EXISTS diccionario_vault (
  vault_id       TEXT PRIMARY KEY REFERENCES vaults(id) ON DELETE CASCADE,
  palabras       TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

-- El DE MYCELIUM es del usuario (en desktop, `diccionario-personal.txt` de la
-- instalación): vale en todos sus vaults y en cualquier navegador.
CREATE TABLE IF NOT EXISTS diccionario_usuario (
  usuario_id     TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  palabras       TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);
