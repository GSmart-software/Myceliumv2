"""Réplica del índice SQLite de Mycelium (esquema de lib/db/indexer.ts) para medir
el costo SQL puro —sin el puente IPC— de: indexado frío, guardado de una nota,
árbol del explorador, SELECT del grafo y búsqueda FTS5 con snippet.

    python medir-sqlite.py notas-<nombre>.json
"""
import json, os, sqlite3, sys, time, random

ruta = sys.argv[1]
nombre = os.path.basename(ruta)[6:-5]
datos = json.load(open(ruta, encoding="utf8"))
notas, dirs = datos["notas"], datos["dirs"]
db_path = os.path.join(os.path.dirname(ruta), f"indice-{nombre}.db")
for ext in ("", "-wal", "-shm"):
    if os.path.exists(db_path + ext): os.remove(db_path + ext)

ESQUEMA = [
 "CREATE TABLE carpetas (id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, padre_id TEXT REFERENCES carpetas(id) ON DELETE CASCADE, nombre TEXT NOT NULL, creado_en TEXT NOT NULL, actualizado_en TEXT NOT NULL)",
 "CREATE INDEX idx_carpetas_vault ON carpetas(vault_id)",
 "CREATE INDEX idx_carpetas_padre ON carpetas(padre_id)",
 "CREATE TABLE notas (id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, carpeta_id TEXT REFERENCES carpetas(id) ON DELETE SET NULL, titulo TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'markdown', tamano_bytes INTEGER NOT NULL DEFAULT 0, mtime INTEGER NOT NULL DEFAULT 0, creado_en TEXT NOT NULL, actualizado_en TEXT NOT NULL)",
 "CREATE INDEX idx_notas_vault ON notas(vault_id)",
 "CREATE INDEX idx_notas_carpeta ON notas(carpeta_id)",
 "CREATE TABLE contenidos (nota_id TEXT PRIMARY KEY REFERENCES notas(id) ON DELETE CASCADE, contenido TEXT NOT NULL DEFAULT '', actualizado_en TEXT NOT NULL)",
 "CREATE TABLE papelera (id TEXT PRIMARY KEY, nota_id TEXT NOT NULL UNIQUE, ruta_original TEXT NOT NULL, carpeta_original_id TEXT, eliminado_en TEXT NOT NULL, ruta_papelera TEXT)",
 "CREATE VIRTUAL TABLE notas_fts USING fts5(nota_id UNINDEXED, titulo, contenido)",
 "CREATE TABLE propiedades (nota_id TEXT NOT NULL, clave TEXT NOT NULL, valor TEXT NOT NULL, tipo TEXT NOT NULL, orden INTEGER NOT NULL)",
 "CREATE INDEX idx_propiedades_nota ON propiedades(nota_id)",
 "CREATE INDEX idx_propiedades_clave ON propiedades(clave, valor)",
 "CREATE TABLE fts_filas (nota_id TEXT PRIMARY KEY, fila INTEGER NOT NULL UNIQUE)",
]
VAULT = "local"; NOW = "2026-09-26T00:00:00Z"

def abrir():
    c = sqlite3.connect(db_path, isolation_level=None)  # autocommit: cada statement su transacción, como el plugin
    c.execute("PRAGMA journal_mode=WAL"); c.execute("PRAGMA synchronous=NORMAL")
    return c

def carpetas_de(ruta):
    partes = ruta.split("/")[:-1]; out = []
    for i in range(len(partes)):
        out.append(("/".join(partes[:i+1]), "/".join(partes[:i]) or None, partes[i]))
    return out

def indexar_nota(c, n):
    """Las mismas sentencias que indexarVault por nota: notas, contenidos, fts_filas, notas_fts, DELETE propiedades, N INSERT."""
    c.execute("INSERT INTO notas (id, vault_id, carpeta_id, titulo, tipo, tamano_bytes, mtime, creado_en, actualizado_en) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET carpeta_id=excluded.carpeta_id, titulo=excluded.titulo, tipo=excluded.tipo, tamano_bytes=excluded.tamano_bytes, mtime=excluded.mtime, actualizado_en=excluded.actualizado_en",
              (n["id"], VAULT, n["carpetaId"], n["titulo"], n["tipo"], len(n["contenido"].encode()), n["mtime"], NOW, NOW))
    c.execute("INSERT INTO contenidos (nota_id, contenido, actualizado_en) VALUES (?,?,?) ON CONFLICT(nota_id) DO UPDATE SET contenido=excluded.contenido, actualizado_en=excluded.actualizado_en", (n["id"], n["contenido"], NOW))
    c.execute("INSERT INTO fts_filas (nota_id, fila) VALUES (?, (SELECT COALESCE(MAX(fila),0)+1 FROM fts_filas)) ON CONFLICT(nota_id) DO NOTHING", (n["id"],))
    c.execute("INSERT OR REPLACE INTO notas_fts (rowid, nota_id, titulo, contenido) VALUES ((SELECT fila FROM fts_filas WHERE nota_id=?),?,?,?)", (n["id"], n["id"], n["titulo"], n["indexable"]))
    c.execute("DELETE FROM propiedades WHERE nota_id = ?", (n["id"],))
    k = 5
    for (clave, valor, tipo, orden) in n["props"]:
        c.execute("INSERT INTO propiedades (nota_id, clave, valor, tipo, orden) VALUES (?,?,?,?,?)", (n["id"], clave, valor, tipo, orden)); k += 1
    return k

def ms(t): return f"{(time.perf_counter()-t)*1000:.1f} ms"

c = abrir()
for s in ESQUEMA: c.execute(s)

# carpetas (solo nuevas, ordenadas por profundidad)
carpetas = {}
for n in notas:
    for cid, padre, nom in carpetas_de(n["id"]): carpetas[cid] = (padre, nom)
for d in dirs:
    partes = d.split("/")
    for i in range(len(partes)): carpetas["/".join(partes[:i+1])] = ("/".join(partes[:i]) or None, partes[i])
t = time.perf_counter()
for cid, (padre, nom) in sorted(carpetas.items(), key=lambda kv: kv[0].count("/")):
    c.execute("INSERT INTO carpetas (id, vault_id, padre_id, nombre, creado_en, actualizado_en) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET padre_id=excluded.padre_id, nombre=excluded.nombre, actualizado_en=excluded.actualizado_en", (cid, VAULT, padre, nom, NOW, NOW))
print(f"== {nombre}: {len(notas)} notas, {len(carpetas)} carpetas")
print(f"carpetas (autocommit, {len(carpetas)} stmts)      : {ms(t)}")

# indexado frío, autocommit (una transacción implícita por statement, como tauri-plugin-sql)
t = time.perf_counter(); stmts = 0
for n in notas: stmts += indexar_nota(c, n)
frio_auto = time.perf_counter() - t
print(f"indexado frío AUTOCOMMIT ({stmts} stmts)  : {frio_auto*1000:.0f} ms  → {frio_auto*1000/len(notas):.2f} ms/nota (SQL puro, sin IPC)")
c.close()

# indexado frío en UNA transacción (lo que haría FUN-L-10 en Rust)
for ext in ("", "-wal", "-shm"):
    if os.path.exists(db_path + ext): os.remove(db_path + ext)
c = abrir()
for s in ESQUEMA: c.execute(s)
t = time.perf_counter(); c.execute("BEGIN")
for cid, (padre, nom) in sorted(carpetas.items(), key=lambda kv: kv[0].count("/")):
    c.execute("INSERT INTO carpetas (id, vault_id, padre_id, nombre, creado_en, actualizado_en) VALUES (?,?,?,?,?,?)", (cid, VAULT, padre, nom, NOW, NOW))
for n in notas: indexar_nota(c, n)
c.execute("COMMIT")
print(f"indexado frío UNA TRANSACCIÓN              : {ms(t)}")
c.execute("PRAGMA wal_checkpoint(TRUNCATE)")
print(f"tamaño del índice                          : {os.path.getsize(db_path)/1e6:.1f} MB (contenido {sum(len(n['contenido'].encode()) for n in notas)/1e6:.1f} MB: se guarda dos veces, contenidos + notas_fts)")

# apertura en caliente: lo que consulta indexarVault antes de decidir
t = time.perf_counter()
c.execute("SELECT id, mtime FROM notas").fetchall(); c.execute("SELECT id FROM carpetas").fetchall(); c.execute("SELECT nota_id FROM papelera").fetchall()
print(f"apertura en caliente (3 SELECT de estado)  : {ms(t)}")

# tree()
t = time.perf_counter()
for _ in range(5):
    c.execute("SELECT id, padre_id, nombre FROM carpetas WHERE vault_id = ? ORDER BY nombre COLLATE NOCASE", (VAULT,)).fetchall()
    filas = c.execute("SELECT id, carpeta_id, titulo, tipo, actualizado_en FROM notas WHERE vault_id = ? AND id NOT IN (SELECT nota_id FROM papelera) ORDER BY titulo COLLATE NOCASE", (VAULT,)).fetchall()
print(f"tree() ×5 ({len(filas)} filas)                  : {ms(t)} → {(time.perf_counter()-t)*200:.1f} ms cada uno")

# buildVaultGraph SELECT (contenido completo)
t = time.perf_counter()
filas = c.execute("SELECT n.id, n.titulo, n.creado_en, n.tipo, c.contenido FROM notas n LEFT JOIN contenidos c ON c.nota_id = n.id WHERE n.vault_id = ? AND n.id NOT IN (SELECT nota_id FROM papelera)", (VAULT,)).fetchall()
tj = time.perf_counter(); js = json.dumps([list(f) for f in filas]); json.loads(js)
print(f"SELECT del grafo ({len(filas)} filas, {len(js)/1e6:.1f} MB JSON): SQL {(tj-t)*1000:.1f} ms + JSON ida/vuelta {ms(tj)}")

# guardar una nota (putContenido): SQL puro
n = max(notas, key=lambda n: len(n["contenido"]))
t = time.perf_counter()
for _ in range(20):
    c.execute("SELECT titulo FROM notas WHERE id = ?", (n["id"],)).fetchall()
    c.execute("INSERT INTO contenidos (nota_id, contenido, actualizado_en) VALUES (?,?,?) ON CONFLICT(nota_id) DO UPDATE SET contenido=excluded.contenido, actualizado_en=excluded.actualizado_en", (n["id"], n["contenido"], NOW))
    c.execute("UPDATE notas SET tamano_bytes = ?, actualizado_en = ? WHERE id = ?", (1, NOW, n["id"]))
    c.execute("INSERT INTO fts_filas (nota_id, fila) VALUES (?, (SELECT COALESCE(MAX(fila),0)+1 FROM fts_filas)) ON CONFLICT(nota_id) DO NOTHING", (n["id"],))
    c.execute("INSERT OR REPLACE INTO notas_fts (rowid, nota_id, titulo, contenido) VALUES ((SELECT fila FROM fts_filas WHERE nota_id=?),?,?,?)", (n["id"], n["id"], n["titulo"], n["indexable"]))
    c.execute("DELETE FROM propiedades WHERE nota_id = ?", (n["id"],))
    for (clave, valor, tipo, orden) in n["props"]:
        c.execute("INSERT INTO propiedades (nota_id, clave, valor, tipo, orden) VALUES (?,?,?,?,?)", (n["id"], clave, valor, tipo, orden))
print(f"putContenido ×20 (nota más grande, {len(n['contenido'])} chars, {6+len(n['props'])} stmts): {ms(t)} → {(time.perf_counter()-t)*50:.1f} ms cada uno")

# búsqueda FTS5: réplica de buildFtsQuery (prefijo) + snippet + ORDER BY rank LIMIT 50
def fts_q(raw, prefix=True):
    return " ".join('"' + p.replace('"', '""') + '"' + ("*" if prefix else "") for p in raw.split())
def buscar(q, con_snippet=True):
    frag = "snippet(notas_fts, 2, '«', '»', '…', 10) AS fragmento" if con_snippet else "'' AS fragmento"
    return c.execute(f"SELECT f.nota_id, n.titulo, n.carpeta_id, {frag} FROM notas_fts f JOIN notas n ON n.id = f.nota_id WHERE notas_fts MATCH ? AND n.vault_id = ? AND n.id NOT IN (SELECT nota_id FROM papelera) ORDER BY rank LIMIT 50", (fts_q(q), VAULT)).fetchall()
def cuenta(q):
    return c.execute("SELECT COUNT(*) FROM notas_fts WHERE notas_fts MATCH ?", (fts_q(q),)).fetchone()[0]
print("búsqueda FTS5 (prefijo, como al teclear):")
for q in ["a", "e", "de", "pro", "proyecto", "la de", "que"]:
    ts = []
    for _ in range(5):
        t = time.perf_counter(); buscar(q); ts.append(time.perf_counter() - t)
    t = time.perf_counter(); buscar(q, False); sin = time.perf_counter() - t
    print(f"  {q!r:12} coincide {cuenta(q):5d} notas · con snippet {min(ts)*1000:7.1f} ms · sin snippet {sin*1000:6.1f} ms")
c.close()
