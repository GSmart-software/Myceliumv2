// Tres análisis: (1) archivos no alcanzables por import desde app/**, (2) clases de
// .module.css sin uso en sus importadores, (3) custom properties definidas y nunca leídas.
const fs = require("fs"), path = require("path");
function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (["node_modules", ".next", "out", "src-tauri", "drawio"].includes(e.name)) continue; walk(p, out); }
    else out.push(p.split(path.sep).join("/"));
  }
}
const all = []; ["app", "components", "lib", "stores", "styles", "public"].forEach(d => walk(d, all));
const src = all.filter(f => /\.(ts|tsx)$/.test(f));
const css = all.filter(f => /\.css$/.test(f));
const text = {}; for (const f of [...src, ...css]) text[f] = fs.readFileSync(f, "utf8");

// (1) grafo de imports
function resolve(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = spec.slice(2);
  else if (spec.startsWith(".")) base = path.posix.join(path.posix.dirname(from), spec);
  else return null;
  const cands = [base, base + ".ts", base + ".tsx", base + ".css", base + "/index.ts", base + "/index.tsx"];
  for (const c of cands) if (text[c] !== undefined) return c;
  return null;
}
const importRe = /(?:import|export)\s+(?:[^"'`;]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const edges = {};
for (const f of src) {
  edges[f] = new Set();
  let m; importRe.lastIndex = 0;
  while ((m = importRe.exec(text[f]))) { const r = resolve(f, m[1] || m[2]); if (r) edges[f].add(r); }
}
const seen = new Set();
const roots = src.filter(f => f.startsWith("app/"));
const stack = [...roots];
while (stack.length) { const f = stack.pop(); if (seen.has(f)) continue; seen.add(f); for (const t of edges[f] || []) stack.push(t); }
console.log("=== (1) NO ALCANZABLES desde app/** ===");
for (const f of [...src, ...css].sort()) if (!seen.has(f)) console.log("  " + f);

// (2) clases de module.css sin uso
console.log("=== (2) CLASES .module.css sin uso ===");
for (const c of css.filter(f => f.endsWith(".module.css"))) {
  const importers = src.filter(f => edges[f].has(c));
  const classes = new Set([...text[c].matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map(m => m[1]));
  // descartar pseudo/decimales falsos: exigir que aparezca como selector (precedido por espacio, inicio, coma, > o cierre)
  const real = [...classes].filter(k => new RegExp("(^|[\\s,>+~)\\]])\\." + k + "(?![A-Za-z0-9_-])", "m").test(text[c]));
  const body = importers.map(i => text[i]).join("\n");
  const unused = real.filter(k => !new RegExp("(styles|s|css|estilos|cls|clases|st|sx)\\.(" + k + ")(?![A-Za-z0-9_])|\\[\\s*[\"']" + k + "[\"']\\s*\\]|[\"'`]" + k + "[\"'`]").test(body));
  if (importers.length === 0) console.log("  SIN IMPORTADOR: " + c);
  else if (unused.length) console.log("  " + c + " (importado por " + importers.join(", ") + "): " + unused.join(", "));
}

// (3) custom properties definidas y nunca leídas
console.log("=== (3) CUSTOM PROPERTIES definidas y nunca leídas (var()) ===");
const allText = Object.values(text).join("\n") + fs.readFileSync("../frontend/lib/printStyles.ts", "utf8");
const defs = new Set();
for (const f of css) for (const m of text[f].matchAll(/^\s*(--[A-Za-z0-9_-]+)\s*:/gm)) defs.add(m[1]);
for (const f of src) for (const m of text[f].matchAll(/["'`](--[A-Za-z0-9_-]+)["'`]/g)) defs.add(m[1]);
const unusedVars = [...defs].filter(v => !new RegExp("var\\(\\s*" + v + "(?![A-Za-z0-9_-])").test(allText) && !new RegExp("getPropertyValue\\([\"'`]" + v + "[\"'`]").test(allText));
console.log("  definidas=" + defs.size + " sin var()=" + unusedVars.length);
unusedVars.sort().forEach(v => console.log("  " + v));
