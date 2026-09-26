// Heurística: para cada store, claves declaradas en el tipo de estado (`  nombre:` o
// `  nombre(` a 2 espacios dentro del bloque `type XState = {...}`) y cuántos archivos
// distintos del propio store las mencionan.
const fs = require("fs"), path = require("path");
function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (["node_modules", ".next", "out", "src-tauri", "drawio", "public"].includes(e.name)) continue; walk(p, out); }
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p.split(path.sep).join("/"));
  }
}
const files = []; ["app", "components", "lib", "stores"].forEach(d => walk(d, files));
const text = Object.fromEntries(files.map(f => [f, fs.readFileSync(f, "utf8")]));
for (const store of files.filter(f => f.startsWith("stores/"))) {
  const src = text[store];
  const m = src.match(/type \w+State\s*=\s*\{([\s\S]*?)\n\};/);
  if (!m) { console.log(store + ": (sin type *State)"); continue; }
  const keys = [...m[1].matchAll(/^\s{2}(?:readonly\s+)?([A-Za-z_]\w*)\??\s*[:(<]/gm)].map(x => x[1]);
  const dead = [];
  for (const k of keys) {
    const re = new RegExp("(^|[^A-Za-z0-9_$])" + k + "($|[^A-Za-z0-9_$])");
    const users = files.filter(f => f !== store && re.test(text[f]));
    const selfUses = (src.match(new RegExp("(^|[^A-Za-z0-9_$])" + k + "($|[^A-Za-z0-9_$])", "g")) || []).length;
    if (users.length === 0) dead.push(k + "(self=" + selfUses + ")");
  }
  console.log(store + ": " + keys.length + " claves; sin uso externo: " + (dead.join(", ") || "-"));
}
