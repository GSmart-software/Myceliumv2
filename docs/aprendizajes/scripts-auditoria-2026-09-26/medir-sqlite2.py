"""Segunda tanda sobre el índice ya construido por medir-sqlite.py (indice-<nombre>.db):
 - búsqueda: snippet solo para las 50 filas devueltas (CTE) vs. la consulta actual;
 - indexado frío por TANDAS (una transacción cada 250 notas) vs autocommit.
    python medir-sqlite2.py notas-<nombre>.json
"""
import json, os, sqlite3, sys, time
sys.path.insert(0, os.path.dirname(__file__))
ruta = sys.argv[1]; nombre = os.path.basename(ruta)[6:-5]
datos = json.load(open(ruta, encoding="utf8")); notas = datos["notas"]
db_path = os.path.join(os.path.dirname(ruta), f"indice-{nombre}.db")
c = sqlite3.connect(db_path, isolation_level=None)
VAULT = "local"
def fts_q(raw): return " ".join('"' + p + '"*' for p in raw.split())
ACTUAL = "SELECT f.nota_id, n.titulo, n.carpeta_id, snippet(notas_fts, 2, '«', '»', '…', 10) FROM notas_fts f JOIN notas n ON n.id = f.nota_id WHERE notas_fts MATCH ? AND n.vault_id = ? AND n.id NOT IN (SELECT nota_id FROM papelera) ORDER BY rank LIMIT 50"
# Variante: primero los 50 mejores rowid por rank (sin snippet), después el snippet solo de esos.
CTE = """WITH top AS (
           SELECT f.rowid AS fila, rank FROM notas_fts f JOIN notas n ON n.id = f.nota_id
            WHERE notas_fts MATCH ? AND n.vault_id = ? AND n.id NOT IN (SELECT nota_id FROM papelera)
            ORDER BY rank LIMIT 50)
         SELECT f.nota_id, n.titulo, n.carpeta_id, snippet(notas_fts, 2, '«', '»', '…', 10)
           FROM notas_fts f JOIN top ON top.fila = f.rowid JOIN notas n ON n.id = f.nota_id
          WHERE notas_fts MATCH ? ORDER BY top.rank"""
print(f"== {nombre}")
for q in ["a", "e", "de", "la de", "que", "proyecto"]:
    def t(sql, params):
        best = 1e9
        for _ in range(3):
            t0 = time.perf_counter(); r = c.execute(sql, params).fetchall(); best = min(best, time.perf_counter() - t0)
        return best * 1000, r
    ta, ra = t(ACTUAL, (fts_q(q), VAULT))
    tc, rc = t(CTE, (fts_q(q), VAULT, fts_q(q)))
    mismo = [r[0] for r in ra] == [r[0] for r in rc] and all(a[3] == b[3] for a, b in zip(ra, rc))
    print(f"  {q!r:12} actual {ta:7.1f} ms · snippet solo top-50 {tc:6.1f} ms · mismo resultado: {mismo}")
c.close()

# indexado por tandas de 250 (una transacción por tanda), índice nuevo
from importlib import import_module
m = import_module("medir_sqlite_lib") if False else None
db2 = db_path.replace(".db", "-tandas.db")
for ext in ("", "-wal", "-shm"):
    if os.path.exists(db2 + ext): os.remove(db2 + ext)
src = open(os.path.join(os.path.dirname(__file__), "medir-sqlite.py"), encoding="utf8").read()
# reutilizar ESQUEMA e indexar_nota del otro script sin ejecutar su main: se extraen por exec acotado
ns = {}
exec(src.split("def ms(t)")[0].split("ruta = sys.argv[1]")[0] + "\n" + "ESQUEMA = " + src.split("ESQUEMA = ")[1].split("VAULT = ")[0] + "\nVAULT='local'; NOW='2026-09-26T00:00:00Z'\n" + "def indexar_nota" + src.split("def indexar_nota")[1].split("def ms(t)")[0], ns)
c = sqlite3.connect(db2, isolation_level=None); c.execute("PRAGMA journal_mode=WAL"); c.execute("PRAGMA synchronous=NORMAL")
for s in ns["ESQUEMA"]: c.execute(s)
t0 = time.perf_counter()
for i in range(0, len(notas), 250):
    c.execute("BEGIN")
    for n in notas[i:i+250]: ns["indexar_nota"](c, n)
    c.execute("COMMIT")
print(f"  indexado frío en TANDAS de 250 (una transacción por tanda): {(time.perf_counter()-t0)*1000:.0f} ms")
c.close()
