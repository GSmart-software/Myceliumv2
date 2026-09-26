"""Tercera tanda: (a) búsqueda con snippet acotado por `rowid IN (top-50)`;
(b) indexado frío con INSERT MULTI-FILA por tanda de 250 en AUTOCOMMIT (lo que
JS puede hacer hoy con tauri-plugin-sql sin BEGIN/COMMIT).
    python medir-sqlite3.py notas-<nombre>.json
"""
import json, os, sqlite3, sys, time
ruta = sys.argv[1]; nombre = os.path.basename(ruta)[6:-5]
datos = json.load(open(ruta, encoding="utf8")); notas = datos["notas"]
db_path = os.path.join(os.path.dirname(ruta), f"indice-{nombre}.db")
c = sqlite3.connect(db_path, isolation_level=None)
VAULT = "local"
def fts_q(raw): return " ".join('"' + p + '"*' for p in raw.split())
ACTUAL = "SELECT f.nota_id, n.titulo, n.carpeta_id, snippet(notas_fts, 2, '«', '»', '…', 10) FROM notas_fts f JOIN notas n ON n.id = f.nota_id WHERE notas_fts MATCH ? AND n.vault_id = ? AND n.id NOT IN (SELECT nota_id FROM papelera) ORDER BY rank LIMIT 50"
ROWID = """WITH top AS (
           SELECT f.rowid AS fila, rank FROM notas_fts f JOIN notas n ON n.id = f.nota_id
            WHERE notas_fts MATCH ? AND n.vault_id = ? AND n.id NOT IN (SELECT nota_id FROM papelera)
            ORDER BY rank LIMIT 50)
         SELECT f.nota_id, n.titulo, n.carpeta_id, snippet(notas_fts, 2, '«', '»', '…', 10)
           FROM notas_fts f JOIN notas n ON n.id = f.nota_id JOIN top ON top.fila = f.rowid
          WHERE notas_fts MATCH ? AND f.rowid IN (SELECT fila FROM top) ORDER BY top.rank"""
print(f"== {nombre}")
def t(sql, params):
    best = 1e9
    for _ in range(3):
        t0 = time.perf_counter(); r = c.execute(sql, params).fetchall(); best = min(best, time.perf_counter() - t0)
    return best * 1000, r
for q in ["a", "e", "de", "la de", "que", "proyecto"]:
    ta, ra = t(ACTUAL, (fts_q(q), VAULT))
    tc, rc = t(ROWID, (fts_q(q), VAULT, fts_q(q)))
    mismo = [r[0] for r in ra] == [r[0] for r in rc] and all(a[3] == b[3] for a, b in zip(ra, rc))
    print(f"  {q!r:12} actual {ta:7.1f} ms · snippet por rowid IN top-50 {tc:6.1f} ms · mismo: {mismo}")
# ¿y si el mínimo fueran 2 caracteres? (lo que escribe alguien antes del debounce)
for q in ["es", "co", "pr"]:
    ta, _ = t(ACTUAL, (fts_q(q), VAULT)); tc, _ = t(ROWID, (fts_q(q), VAULT, fts_q(q)))
    print(f"  {q!r:12} actual {ta:7.1f} ms · por rowid {tc:6.1f} ms")
c.close()

# (b) multi-fila por tanda, autocommit
db2 = db_path.replace(".db", "-multifila.db")
for ext in ("", "-wal", "-shm"):
    if os.path.exists(db2 + ext): os.remove(db2 + ext)
src = open(os.path.join(os.path.dirname(__file__), "medir-sqlite.py"), encoding="utf8").read()
ns = {}
exec("ESQUEMA = " + src.split("ESQUEMA = ")[1].split("VAULT = ")[0], ns)
NOW = "2026-09-26T00:00:00Z"
c = sqlite3.connect(db2, isolation_level=None); c.execute("PRAGMA journal_mode=WAL"); c.execute("PRAGMA synchronous=NORMAL")
for s in ns["ESQUEMA"]: c.execute(s)
t0 = time.perf_counter(); stmts = 0
for i in range(0, len(notas), 250):
    tanda = notas[i:i+250]
    # 1) notas
    c.execute("INSERT INTO notas (id, vault_id, carpeta_id, titulo, tipo, tamano_bytes, mtime, creado_en, actualizado_en) VALUES " + ",".join(["(?,?,?,?,?,?,?,?,?)"] * len(tanda)) + " ON CONFLICT(id) DO UPDATE SET carpeta_id=excluded.carpeta_id, titulo=excluded.titulo, tipo=excluded.tipo, tamano_bytes=excluded.tamano_bytes, mtime=excluded.mtime, actualizado_en=excluded.actualizado_en",
              [v for n in tanda for v in (n["id"], VAULT, n["carpetaId"], n["titulo"], n["tipo"], len(n["contenido"].encode()), n["mtime"], NOW, NOW)])
    # 2) contenidos
    c.execute("INSERT INTO contenidos (nota_id, contenido, actualizado_en) VALUES " + ",".join(["(?,?,?)"] * len(tanda)) + " ON CONFLICT(nota_id) DO UPDATE SET contenido=excluded.contenido, actualizado_en=excluded.actualizado_en",
              [v for n in tanda for v in (n["id"], n["contenido"], NOW)])
    # 3) fts_filas: una fila por nota nueva (MAX+1 correlativo dentro de la misma sentencia)
    c.execute("INSERT OR IGNORE INTO fts_filas (nota_id, fila) SELECT value, (SELECT COALESCE(MAX(fila),0) FROM fts_filas) + key FROM json_each(?)", (json.dumps([n["id"] for n in tanda]),))
    # 4) notas_fts
    c.execute("INSERT OR REPLACE INTO notas_fts (rowid, nota_id, titulo, contenido) VALUES " + ",".join(["((SELECT fila FROM fts_filas WHERE nota_id=?),?,?,?)"] * len(tanda)),
              [v for n in tanda for v in (n["id"], n["id"], n["titulo"], n["indexable"])])
    # 5) propiedades: un DELETE … IN (…) y un INSERT multi-fila
    c.execute("DELETE FROM propiedades WHERE nota_id IN (" + ",".join("?" * len(tanda)) + ")", [n["id"] for n in tanda])
    props = [(n["id"], *p) for n in tanda for p in n["props"]]
    stmts += 5
    for j in range(0, len(props), 3000):
        parte = props[j:j+3000]
        c.execute("INSERT INTO propiedades (nota_id, clave, valor, tipo, orden) VALUES " + ",".join(["(?,?,?,?,?)"] * len(parte)), [v for p in parte for v in p]); stmts += 1
dt = time.perf_counter() - t0
n_fts = c.execute("SELECT COUNT(*) FROM notas_fts").fetchone()[0]; n_p = c.execute("SELECT COUNT(*) FROM propiedades").fetchone()[0]
print(f"  indexado frío MULTI-FILA por tanda de 250, autocommit: {dt*1000:.0f} ms en {stmts} sentencias (filas fts {n_fts}, propiedades {n_p})")
c.close()
