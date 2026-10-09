-- Migración de una base D1 YA EXISTENTE al índice de búsqueda de DEF-144,
-- DEF-148 y DEF-152 (una base nueva no la necesita: schema.sql ya lo trae).
-- En modo local la hace sola LocalDbInitializer al arrancar.
--
-- Se corre UNA vez y ANTES de volver a aplicar schema.sql (que crea un índice
-- sobre columnas que esto agrega):
--   wrangler d1 execute micelio-prod --remote --file=backend/migrations/d1/2026-10-busqueda.sql
--
-- Después, para cada vault, POST /vaults/{vaultId}/reindexar: relee los
-- archivos y llena `notas_fts` (con `extra`), las columnas plegadas de
-- `propiedades` y `etiquetas`. Hasta entonces la búsqueda no encuentra las
-- notas que no se hayan guardado de nuevo.

-- `notas_fts` gana `extra` (DEF-148). Una tabla FTS5 no admite ADD COLUMN: se
-- rehace vacía y la llena /reindexar.
DROP TABLE IF EXISTS notas_fts;
CREATE VIRTUAL TABLE notas_fts USING fts5(
  nota_id UNINDEXED,
  titulo,
  contenido,
  extra
);

-- Clave y valor plegados (DEF-144). Los llena /reindexar.
ALTER TABLE propiedades ADD COLUMN clave_plegada TEXT NOT NULL DEFAULT '';
ALTER TABLE propiedades ADD COLUMN valor_plegado TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_propiedades_plegado ON propiedades(clave_plegada, valor_plegado);

-- Etiquetas por nota (DEF-152). La llena /reindexar.
CREATE TABLE IF NOT EXISTS etiquetas (
  nota_id     TEXT NOT NULL REFERENCES notas(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  tag_plegado TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_etiquetas_nota    ON etiquetas(nota_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_plegado ON etiquetas(tag_plegado, nota_id);
