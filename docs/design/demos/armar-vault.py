import json
import sys
JSON, OUT, NOMBRE, RAIZ_TXT = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
src = open("micelio-del-vault.html", encoding="utf-8").read()
datos = open(JSON, encoding="utf-8").read()
s = src
def rep(a, b, count=1):
    global s
    assert a in s, "NO ENCONTRADO: " + a[:70]
    s = s.replace(a, b, count)

# 1) Datos reales en vez del generador
ini = s.index("const AREAS = [")
fin = s.index("// ───────────────────────── componentes y estadísticas")
s = s[:ini] + "const DATOS = " + datos + """;
const AREAS = DATOS.areas;
let usarPrefijo = true;
// El vault real: nodos y aristas ya resueltas como lo hace Mycelium (título exacto,
// sin distinguir mayúsculas), más las que solo resuelven por prefijo de ID (opcionales).
function cargarVault() {
  const nodos = DATOS.nodos.map((d, i) => ({ id: i, titulo: d[0], area: d[1], sub: d[2], fecha: d[3], creado: Date.parse(d[3]), tipo: d[4], ruta: d[5], out: [], in: [], grado: 0, mapa: d[4] === "índice" || i === DATOS.raiz, huerfana: false }));
  const aristas = [];
  for (const [a, b, p] of DATOS.aristas) { if (p && !usarPrefijo) continue; aristas.push([a, b]); nodos[a].out.push(b); nodos[b].in.push(a); nodos[a].grado++; nodos[b].grado++; }
  for (const n of nodos) n.huerfana = n.grado === 0;
  // Orden cronológico estable: por fecha de alta y, a igual fecha, por ruta.
  const orden = nodos.map((n) => n.id).sort((x, y) => (nodos[x].creado - nodos[y].creado) || (nodos[x].ruta < nodos[y].ruta ? -1 : 1));
  const nuevoId = new Int32Array(nodos.length); orden.forEach((viejo, i) => (nuevoId[viejo] = i));
  const ordenados = orden.map((viejo, i) => { const n = nodos[viejo]; n.id = i; n.out = n.out.map((v) => nuevoId[v]); n.in = n.in.map((v) => nuevoId[v]); return n; });
  return { nodos: ordenados, aristas: aristas.map(([a, b]) => [nuevoId[a], nuevoId[b]]), raiz: nuevoId[DATOS.raiz] };
}

""" + s[fin:]

# 2) construir() con el vault real
rep("""function construir(N) {
  g = generarVault(N, 7);
  comps = componentes(g);""", """function construir() {
  g = cargarVault();
  const N = g.nodos.length;
  comps = componentes(g);""")
rep("""  const slider = document.getElementById("reveal"); slider.max = N; slider.value = N;
  const huerf = comps.listas.filter((l) => l.length === 1).length;
  document.getElementById("stats").innerHTML =
    `<span>notas</span><span>${N.toLocaleString("es")}</span>` +
    `<span>enlaces</span><span>${g.aristas.length.toLocaleString("es")}</span>` +
    `<span>carpetas</span><span>${AREAS.length} áreas</span>` +
    `<span>hubs (≥ 20)</span><span>${g.nodos.filter((n) => n.grado >= 20).length}</span>` +
    `<span>islas</span><span>${comps.listas.length - 1 - huerf}</span>` +
    `<span>huérfanas</span><span>${huerf}</span>`;""", """  const slider = document.getElementById("reveal"); slider.max = N; slider.value = N;
  const huerf = comps.listas.filter((l) => l.length === 1).length;
  const fmt = (n) => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
  document.getElementById("stats").innerHTML =
    `<span>notas</span><span>${fmt(N)}</span>` +
    `<span>enlaces</span><span>${fmt(g.aristas.length)}</span>` +
    `<span>carpetas</span><span>${AREAS.length} áreas</span>` +
    `<span>hubs (≥ 20)</span><span>${g.nodos.filter((n) => n.grado >= 20).length}</span>` +
    `<span>islas</span><span>${comps.listas.length - 1 - huerf}</span>` +
    `<span>sin enlaces</span><span>${huerf}</span>` +
    `<span>solo por ID</span><span>${DATOS.porIdN}${usarPrefijo ? "" : " (apagados)"}</span>` +
    `<span>rotos</span><span>${DATOS.rotos}</span>`;""")
rep("""    <div class="eyebrow">Vault sintético</div>""", """    <div class="eyebrow">Vault «""" + NOMBRE + """», tal como está en disco</div>""")

# 3) Cabecera: interruptor de prefijo en vez del selector de tamaño
rep("""    <label class="size">Notas
      <select id="tamano">
        <option value="800">800</option>
        <option value="1500" selected>1.500</option>
        <option value="3000">3.000</option>
      </select>
    </label>""", """    <label class="size" title="Un [[FTE-0051]] no resuelve en Mycelium porque ninguna nota se titula así; con esto se lo lleva a la nota que empieza por ese ID">
      <input type="checkbox" id="prefijo" checked> Resolver [[ID]] por prefijo
    </label>""")
rep("""document.getElementById("tamano").addEventListener("change", (ev) => construir(+ev.target.value));""",
    """document.getElementById("prefijo").addEventListener("change", (ev) => { usarPrefijo = ev.target.checked; construir(); });""")
rep("""construir(1500);""", """if (!DATOS.porIdN) document.getElementById("prefijo").closest("label").hidden = true;
construir();""")

# 4) Etiquetas recortadas y ficha con ruta
rep("""    const t = g.nodos[u].titulo, dx = radio(u) * s + 5;""", """    const tt = g.nodos[u].titulo, t = tt.length > 46 ? tt.slice(0, 44).trimEnd() + "…" : tt, dx = radio(u) * s + 5;""")
rep("""  const n = g.nodos[u], ruta = n.area < 0 ? "raíz" : `${AREAS[n.area].n}${n.sub ? " / " + n.sub : ""}`;
  el.innerHTML = `<div class="t">${n.titulo}</div><div class="r">${ruta}</div><div class="r">creada ${n.fecha}</div>` +""",
    """  const n = g.nodos[u];
  el.innerHTML = `<div class="t">${n.titulo}</div><div class="r">${n.ruta.slice(0, n.ruta.lastIndexOf("/") + 1) || "(raíz)"}</div><div class="r">${n.tipo ? "tipo: " + n.tipo + " · " : ""}alta ${n.fecha}</div>` +""")
rep("""    `<div class="r">${n.out.length} salientes · ${n.in.length} entrantes${n.huerfana ? " · huérfana" : ""}${n.mapa ? " · mapa" : ""}</div>`;""",
    """    `<div class="r">${n.out.length} salientes · ${n.in.length} entrantes${n.huerfana ? " · sin enlaces" : ""}${n.mapa ? " · índice" : ""}</div>`;""")
rep("""const tinte = (area, l = 62, a = 1) => area < 0 ? `hsla(150,20%,${l}%,${a})` : `hsla(${AREAS[area].hue},34%,${l}%,${a})`;""",
    """const tinte = (area, l = 62, a = 1) => `hsla(${AREAS[area].hue},34%,${l}%,${a})`;""")
rep("""ctx.fillText(a.area < 0 ? "Raíz" : AREAS[a.area].n, x, y);""", """ctx.fillText(AREAS[a.area].n, x, y);""")
rep("""const n = g.nodos[u], a = (n.area < 0 ? 0 : (n.area / AREAS.length) * TAU) + (rnd() - 0.5) * 0.9, r = 80 + rnd() * 380;""",
    """const n = g.nodos[u], a = (n.area / AREAS.length) * TAU + (rnd() - 0.5) * 0.9, r = 80 + rnd() * 380;""")
rep("""    } else if (n.area >= 0 && centroArea[n.area].n > 0) {""", """    } else if (centroArea[n.area].n > 0) {""")
rep("""    if (n.area >= 0) { const c = centroArea[n.area]; c.x += x; c.y += y; c.n++; }""", """    { const c = centroArea[n.area]; c.x += x; c.y += y; c.n++; }""")
rep("""const misma = g.nodos[sI].area === g.nodos[tI].area && g.nodos[sI].area >= 0;""", """const misma = g.nodos[sI].area === g.nodos[tI].area;""")
# textos
rep("""<p>El mapa del vault es la espora de origen. De él salen los mapas de cada área y de cada mapa, sus notas: cada nivel de distancia es un anillo.""",
    """<p>""" + RAIZ_TXT + """ es la espora de origen; cada nivel de distancia desde ahí es un anillo.""")
rep("""<p class="m">Se lee como una jerarquía de distancia al centro: qué tan lejos del mapa está cada nota. Depende de tener un mapa raíz; sin uno, se toma la nota más enlazada.</p>""",
    """<p class="m">Se lee como una jerarquía de distancia al centro: qué tan lejos del índice está cada nota. Sin una nota índice se tomaría la más enlazada.</p>""")
rep("""<p class="m">El lugar de una nota es estable: agregar notas nuevas no mueve las viejas, así que el mapa mental se conserva entre sesiones.</p>""",
    """<p class="m">El lugar de una nota es estable: agregar notas nuevas no mueve las viejas. Acá las fechas son las de alta en git del vault y, para lo que git no cubre, la fecha de creación del archivo.</p>""")
rep("""<p class="m" style="font-size:12px">Vale en las cuatro vistas: se revelan las notas por fecha de creación. En «Crecimiento» además el lugar de cada nota depende de ese orden.</p>""",
    """<p class="m" style="font-size:12px">Vale en las cuatro vistas: se revelan las notas por fecha de creación (git o archivo). En «Crecimiento» además el lugar de cada nota depende de ese orden.</p>""")
rep("""<title>Micelio del vault</title>""", """<title>Micelio de """ + NOMBRE + """</title>""")
rep("""<h1>Micelio <em>del vault</em></h1>""", """<h1>Micelio <em>de """ + NOMBRE + """</em></h1>""")
rep('''aria-label="Grafo del vault dibujado como micelio"''', '''aria-label="Grafo del vault ''' + NOMBRE + ''' dibujado como micelio"''')
open(OUT, "w", encoding="utf-8").write(s)
print("ok", len(s) // 1024, "KB")
