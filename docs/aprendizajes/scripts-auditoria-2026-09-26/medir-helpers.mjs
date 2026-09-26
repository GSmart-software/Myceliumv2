// Mide el costo de los helpers de texto de Mycelium (compilados con esbuild desde
// frontend/lib) sobre las notas reales de un vault, y vuelca un JSON con lo que
// el índice escribiría por nota (para medir-sqlite.py).
//
//   node medir-helpers.mjs "<ruta del vault>" <nombre-corto>
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { performance } from "node:perf_hooks";

const S = new URL("./ts/", import.meta.url);
const fm = await import(new URL("frontmatter.js", S));
const { sinCodigo } = await import(new URL("sinCodigo.js", S));
const { destinoDeWikilink } = await import(new URL("wikilinks.js", S));
const { resolveWikilink } = await import(new URL("wikilink.js", S));
let renderNota = null;
try {
  ({ renderNota } = await import(new URL("markdown.js", S)));
} catch (e) {
  console.log("renderNota no importable en Node:", String(e).slice(0, 120));
}

const [vault, nombre] = process.argv.slice(2);
// Reglas del .mycignore de cada vault (replicadas a mano: ver walker Rust).
const IGN_DIRS = new Set(["node_modules", "target", "dist", "out", ".mycelium"]);
if (nombre === "mycelium") for (const d of ["installers", "installer", "backend", "scripts", "frontend"]) IGN_DIRS.add(d);
const IMPORTABLE = /\.(md|excalidraw|base|canvas|drawio)$/i;

const archivos = [];
const dirs = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith(".") || IGN_DIRS.has(e.name)) continue;
      dirs.push(relative(vault, p).replaceAll("\\", "/"));
      walk(p);
    } else if (IMPORTABLE.test(e.name)) {
      archivos.push(relative(vault, p).replaceAll("\\", "/"));
    }
  }
})(vault);

const notas = archivos.map((ruta) => ({
  id: ruta,
  titulo: ruta.slice(ruta.lastIndexOf("/") + 1).replace(/\.[^.]+$/, ""),
  carpetaId: ruta.includes("/") ? ruta.slice(0, ruta.lastIndexOf("/")) : null,
  tipo: (ruta.match(/\.(excalidraw|base|canvas|drawio)$/i)?.[1] ?? "markdown").toLowerCase(),
  contenido: readFileSync(join(vault, ruta), "utf8"),
  mtime: statSync(join(vault, ruta)).mtimeMs,
}));
const md = notas.filter((n) => n.tipo === "markdown");
const bytes = notas.reduce((a, n) => a + Buffer.byteLength(n.contenido), 0);
console.log(`== ${nombre}: ${notas.length} notas (${md.length} md), ${dirs.length} dirs, ${(bytes / 1e6).toFixed(1)} MB`);

function medir(etiqueta, f, reps = 5) {
  const ts = [];
  let r;
  for (let i = 0; i < reps; i++) {
    const t = performance.now();
    r = f();
    ts.push(performance.now() - t);
  }
  ts.sort((a, b) => a - b);
  console.log(`${etiqueta.padEnd(46)} min ${ts[0].toFixed(1)} ms · med ${ts[ts.length >> 1].toFixed(1)} ms`);
  return r;
}

// ── Lo que hace el indexador por nota ──────────────────────────────────────
const conFm = medir("separarFrontmatter (todas)", () => notas.filter((n) => fm.separarFrontmatter(n.contenido).hay).length);
function valoresDe(p) {
  return Array.isArray(p.valor) ? p.valor.map(String) : [typeof p.valor === "boolean" ? String(p.valor) : String(p.valor)];
}
function textoIndexable(texto) {
  const f = fm.separarFrontmatter(texto);
  const cuerpo = fm.cuerpoDe(texto, f);
  if (!f.hay || !f.soportado || f.props.length === 0) return cuerpo;
  const valores = f.props.flatMap(valoresDe).filter((v) => v.length > 0);
  return valores.length === 0 ? cuerpo : `${valores.join(" ")}\n${cuerpo}`;
}
medir("textoIndexable (todas)", () => notas.map((n) => textoIndexable(n.contenido)).length);
let inserts = 0;
const propsPorNota = new Map();
for (const n of notas) {
  const f = fm.separarFrontmatter(n.contenido);
  const filas = [];
  if (f.hay && f.soportado) {
    for (const p of f.props) valoresDe(p).forEach((v, i) => filas.push([p.clave, v, p.tipo, i]));
  }
  propsPorNota.set(n.id, filas);
  inserts += filas.length;
}
console.log(`  notas con frontmatter: ${conFm} · filas de propiedades: ${inserts} · statements por indexado frío ≈ ${notas.length * 5 + inserts} (5/nota + 1/propiedad)`);

// ── Lo que hace el grafo / la tabla ────────────────────────────────────────
const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;
const conBacktick = notas.filter((n) => n.contenido.includes("`")).length;
medir(`sinCodigo (todas; ${conBacktick} con backtick)`, () => notas.map((n) => sinCodigo(n.contenido)).length);
medir("etiquetasDe(contenido, sinCodigo) (todas)", () => md.map((n) => fm.etiquetasDe(n.contenido, sinCodigo)).length);
let aristas = 0;
medir("wikilinks: sinCodigo + regex + destino (todas)", () => {
  aristas = 0;
  for (const n of md) {
    const t = sinCodigo(n.contenido);
    for (let m = WIKILINK_RE.exec(t); m !== null; m = WIKILINK_RE.exec(t)) { destinoDeWikilink(m[1]); aristas++; }
  }
  return aristas;
});
console.log(`  wikilinks encontrados: ${aristas}`);

// ── IPC: JSON ida y vuelta de leer_archivos (lado JS) ─────────────────────
const json = JSON.stringify(notas.map((n) => ({ ruta_relativa: n.id, contenido: n.contenido })));
medir(`JSON.parse de leer_archivos(todo) (${(json.length / 1e6).toFixed(1)} MB)`, () => JSON.parse(json).length);

// ── resolveWikilink (vista en vivo: una llamada por [[enlace]] visible) ─────
const treeNotas = notas.map((n) => ({ id: n.id, titulo: n.titulo, carpetaId: n.carpetaId, tipo: n.tipo, actualizadoEn: "" }));
const treeCarpetas = dirs.map((d) => ({ id: d, padreId: d.includes("/") ? d.slice(0, d.lastIndexOf("/")) : null, nombre: d.slice(d.lastIndexOf("/") + 1) }));
const titulos = treeNotas.map((n) => n.titulo);
medir("resolveWikilink ×1000 (títulos existentes)", () => { for (let i = 0; i < 1000; i++) resolveWikilink(titulos[i % titulos.length], treeNotas, treeCarpetas); });
medir("resolveWikilink ×1000 (inexistentes)", () => { for (let i = 0; i < 1000; i++) resolveWikilink("no-existe-" + i, treeNotas, treeCarpetas); });

// ── renderNota (vista de lectura / split, tras 130 ms de debounce) ─────────
if (renderNota) {
  const orden = [...md].sort((a, b) => a.contenido.length - b.contenido.length);
  const p50 = orden[orden.length >> 1], p90 = orden[Math.floor(orden.length * 0.9)], max = orden[orden.length - 1];
  for (const [et, n] of [["p50", p50], ["p90", p90], ["max", max]]) {
    try {
      medir(`renderNota ${et} (${n.contenido.length} chars: ${n.id.slice(0, 40)})`, () => renderNota(n.contenido, true).length, 3);
    } catch (e) {
      console.log(`renderNota ${et} falló: ${String(e).slice(0, 100)}`);
      break;
    }
  }
}

// ── Volcado para medir-sqlite.py ───────────────────────────────────────────
writeFileSync(new URL(`notas-${nombre}.json`, import.meta.url), JSON.stringify({
  dirs,
  notas: notas.map((n) => ({ id: n.id, titulo: n.titulo, carpetaId: n.carpetaId, tipo: n.tipo, mtime: Math.floor(n.mtime), contenido: n.contenido, indexable: textoIndexable(n.contenido), props: propsPorNota.get(n.id) })),
}));
