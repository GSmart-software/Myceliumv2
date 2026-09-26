// Extrae el grafo de un vault real con la MISMA resolución de enlaces que Mycelium
// (lib/sinCodigo + lib/wikilinks compilados con esbuild desde el repo).
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { execFileSync } from "node:child_process";
import { sinCodigo } from "./lib/sinCodigo.js";
import { destinoDeWikilink } from "./lib/wikilinks.js";

const VAULT = process.argv[2];
const SALIDA = process.argv[3];
const WIKILINK_RE = /\[\[([^[\]]+)\]\]/g;

// .mycignore de este vault + las carpetas con punto (lo que el usuario considera el vault).
const ignorar = new Set(["node_modules", "target", "dist", "out", ".mycelium"]);
let ocultosMd = 0;
const archivos = [];
(function caminar(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (ignorar.has(e.name)) continue;
      if (e.name.startsWith(".")) { ocultosMd += contarMd(join(dir, e.name)); continue; }
      caminar(join(dir, e.name));
    } else if (e.name.endsWith(".md")) archivos.push(join(dir, e.name));
  }
})(VAULT);
function contarMd(dir) {
  let n = 0;
  try { for (const e of readdirSync(dir, { withFileTypes: true })) n += e.isDirectory() ? contarMd(join(dir, e.name)) : e.name.endsWith(".md") ? 1 : 0; } catch {}
  return n;
}

// Fecha de alta por git (primer commit que agregó el archivo); si no, mtime.
const alta = new Map();
try {
  const log = execFileSync("git", ["-c", "core.quotepath=false", "log", "--diff-filter=A", "--format=@%aI", "--name-only", "--", "*.md"], { cwd: VAULT, encoding: "utf8", maxBuffer: 64 << 20 });
  let fecha = null;
  for (const l of log.split("\n")) {
    if (l.startsWith("@")) fecha = l.slice(1);
    else if (l.endsWith(".md") && fecha) { const k = l.trim(); if (!alta.has(k)) alta.set(k, fecha); } // la más antigua manda (log va de nuevo a viejo → sobreescribir)
  }
  // El log va de nuevo a viejo: la ÚLTIMA vista es la más antigua. Recorrer de nuevo al revés.
  alta.clear(); fecha = null;
  const lineas = log.split("\n");
  for (let i = lineas.length - 1; i >= 0; i--) { /* no-op: se rehace abajo */ }
  let f2 = null; const pares = [];
  for (const l of lineas) { if (l.startsWith("@")) f2 = l.slice(1); else if (l.endsWith(".md") && f2) pares.push([l.trim(), f2]); }
  for (let i = pares.length - 1; i >= 0; i--) alta.set(pares[i][0], pares[i][1]);
} catch (e) { console.error("sin git:", e.message); }

const nodos = [];
const porTitulo = new Map();
const porPrefijo = new Map();
const contenidos = [];
for (const abs of archivos) {
  const rel = relative(VAULT, abs).split(sep).join("/");
  const titulo = rel.slice(rel.lastIndexOf("/") + 1, -3);
  const texto = readFileSync(abs, "utf8");
  const fm = /^---\n([\s\S]*?)\n---/.exec(texto);
  const tipo = fm ? (/^tipo:\s*(.+)$/m.exec(fm[1])?.[1] ?? "").trim() : "";
  const st = statSync(abs);
  const creado = alta.get(rel) ?? (st.birthtimeMs > 0 && st.birthtimeMs < st.mtimeMs ? st.birthtime : st.mtime).toISOString();
  const partes = rel.split("/");
  const area = partes.length === 1 ? "(raíz)" : partes[0] === "Docs" && partes.length > 2 ? `Docs / ${partes[1]}` : partes[0];
  const sub = partes.length === 1 ? "" : partes[0] === "Docs" && partes.length > 3 ? partes[2] : partes.length > 2 ? partes[1] : "";
  const id = nodos.length;
  nodos.push({ id, ruta: rel, titulo, tipo, creado, area, sub });
  const k = titulo.toLowerCase();
  if (!porTitulo.has(k)) porTitulo.set(k, id);
  // Prefijo de ID («FTE-0051 …» → FTE-0051): lo que un [[FTE-0051]] pretende apuntar.
  const pid = /^([A-Z]{2,4}-[0-9]{4})(?=[ .]|$)/.exec(titulo);
  if (pid && !porPrefijo.has(pid[1])) porPrefijo.set(pid[1], id);
  contenidos.push(texto);
}

const aristas = []; const vistas = new Set(); let rotos = 0, rotosSoloId = 0, adjuntos = 0;
const sinDestino = new Map();
nodos.forEach((n, i) => {
  const texto = sinCodigo(contenidos[i]);
  for (let m = WIKILINK_RE.exec(texto); m !== null; m = WIKILINK_RE.exec(texto)) {
    const destino = destinoDeWikilink(m[1]);
    if (/\.(png|jpe?g|gif|svg|webp|pdf|excalidraw|canvas|base|ipynb|zip|docx|txt)$/i.test(destino)) { adjuntos++; continue; } // embeds de archivos, no notas
    let t = porTitulo.get(destino.toLowerCase()), porId = 0;
    if (t === undefined && /^[A-Z]{2,4}-\d{4}$/.test(destino) && porPrefijo.has(destino)) { t = porPrefijo.get(destino); porId = 1; }
    if (t === undefined) { rotos++; if (/^[A-Z]{2,4}-\d{4}$/.test(destino)) rotosSoloId++; sinDestino.set(destino, (sinDestino.get(destino) ?? 0) + 1); continue; }
    if (t === i) continue;
    const k = i * 100000 + t; if (vistas.has(k)) { if (!porId) { const idx = aristas.findIndex((a) => a[0] === i && a[1] === t); if (idx >= 0) aristas[idx][2] = 0; } continue; }
    vistas.add(k); aristas.push([i, t, porId]);
  }
});

// Áreas con un tono cada una, de mayor a menor.
const conteo = new Map(); for (const n of nodos) conteo.set(n.area, (conteo.get(n.area) ?? 0) + 1);
const HUES = [158, 28, 190, 88, 340, 262, 48, 210, 120, 10, 300, 70];
const areas = [...conteo.entries()].sort((a, b) => b[1] - a[1]).map(([n], i) => ({ n, hue: HUES[i % HUES.length] }));
const areaIdx = new Map(areas.map((a, i) => [a.n, i]));
const grado = new Int32Array(nodos.length); for (const [s, t, p] of aristas) if (!p) { grado[s]++; grado[t]++; }
const porIdN = aristas.filter((a) => a[2]).length;
// Raíz: una nota de la raíz del vault que sea índice; si no, la más enlazada.
let raiz = nodos.findIndex((n) => n.area === "(raíz)" && /índice|mapa/i.test(n.titulo));
if (raiz < 0) raiz = nodos.reduce((m, n) => (grado[n.id] > grado[m] ? n.id : m), 0);

const salida = {
  nombre: VAULT.split(/[\\/]/).pop(),
  areas,
  nodos: nodos.map((n) => [n.titulo, areaIdx.get(n.area), n.sub, n.creado.slice(0, 10), n.tipo, n.ruta]),
  aristas,
  raiz,
  rotos, rotosSoloId, ocultosMd, porIdN, adjuntos,
};
writeFileSync(SALIDA, JSON.stringify(salida));
console.log(`notas ${nodos.length} · aristas ${aristas.length} (por prefijo de ID: ${porIdN}) · raíz «${nodos[raiz].titulo}» · enlaces sin destino ${rotos} (solo ID: ${rotosSoloId}) · md en carpetas ocultas ${ocultosMd} · enlaces a adjuntos ${adjuntos}`);
console.log("áreas:", areas.map((a) => `${a.n} (${conteo.get(a.n)})`).join(" · "));
console.log("grados: máx", Math.max(...grado), "· sin enlaces", [...grado].filter((g) => g === 0).length, "· con fecha git", nodos.filter((n) => alta.has(n.ruta)).length);
console.log("sin destino más citados:", [...sinDestino.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([d, c]) => `${d} ×${c}`).join(" · "));
console.log("JSON:", (JSON.stringify(salida).length / 1024).toFixed(0), "KB");
