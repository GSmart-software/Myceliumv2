const fs = require("fs"), path = require("path");
const r = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const items = [];
const unusedFiles = [];
for (const i of r.issues) {
  for (const x of (i.exports || [])) items.push([i.file, x.line, x.name, "export"]);
  for (const x of (i.types || [])) items.push([i.file, x.line, x.name, "type"]);
  for (const x of (i.files || [])) unusedFiles.push(x.name || x);
}
function walk(d, out) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (["node_modules", ".next", "out", "src-tauri"].includes(e.name)) continue; walk(p, out); }
    else if (/\.(ts|tsx|mjs|js|css)$/.test(e.name)) out.push(p);
  }
}
const files = []; walk(".", files);
const texts = Object.fromEntries(files.map(f => [f.split(path.sep).join("/"), fs.readFileSync(f, "utf8")]));
console.log("UNUSED FILES (" + unusedFiles.length + "):"); unusedFiles.forEach(f => console.log("  " + f));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const out = [];
for (const [file, line, name, kind] of items) {
  const re = new RegExp("(^|[^A-Za-z0-9_$])" + esc(name) + "($|[^A-Za-z0-9_$])");
  const users = Object.keys(texts).filter(f => f !== file && re.test(texts[f]));
  const self = (texts[file] || "").split("\n").filter(l => re.test(l)).length;
  out.push((users.length === 0 ? "DEAD " : "used ") + file + ":" + line + " " + name + " [" + kind + "] self=" + self + " users=" + users.join(","));
}
out.sort().forEach(l => console.log(l));
