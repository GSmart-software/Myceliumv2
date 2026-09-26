import { sinCodigo } from "./lib/sinCodigo.js";
import { etiquetasDe } from "./lib/frontmatter.js";
import { destinoDeWikilink } from "./lib/wikilinks.js";
const WIKILINK_RE = /\[\[([^[\]]+)\]\]/g;
// Nota sintética realista: ~3 KB, frontmatter, 6 enlaces, un bloque de código y código en línea.
const nota = (i, N) => `---\ntags: [proyecto, nota${i % 7}]\n---\n# Nota ${i}\n\nTexto con [[Nota ${(i*7)%N}]] y [[Nota ${(i*13)%N}|alias]] y \`código en línea\` y #tag${i%5}.\n` +
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(40) + `\n\n\`\`\`ts\nconst x = "[[no cuenta]]";\n\`\`\`\n\n` +
  `Más texto [[Nota ${(i*3)%N}]] [[Nota ${(i*5)%N}]] [[Nota ${(i*11)%N}]] [[Nota ${(i*17)%N}]].\n` + "Otro párrafo largo para llegar a un tamaño realista. ".repeat(20);
for (const N of [1000, 2000, 4000]) {
  const contenidos = new Map(); const porTitulo = new Map();
  for (let i = 0; i < N; i++) { contenidos.set(`id${i}`, nota(i, N)); porTitulo.set(`nota ${i}`, `id${i}`); }
  const bytes = [...contenidos.values()].reduce((s, c) => s + c.length, 0);
  const t0 = performance.now();
  const aristas = []; const vistas = new Set();
  for (const [notaId, contenido] of contenidos) {
    const texto = sinCodigo(contenido);
    for (let m = WIKILINK_RE.exec(texto); m !== null; m = WIKILINK_RE.exec(texto)) {
      const destinoId = porTitulo.get(destinoDeWikilink(m[1]).toLowerCase());
      if (destinoId && destinoId !== notaId) { const k = `${notaId}\u0000${destinoId}`; if (!vistas.has(k)) { vistas.add(k); aristas.push({ from: notaId, to: destinoId }); } }
    }
  }
  const t1 = performance.now();
  for (const [, contenido] of contenidos) etiquetasDe(contenido, sinCodigo);
  const t2 = performance.now();
  // Costo de serializar el contenido como JSON (aproxima el puente IPC del plugin SQL)
  const filas = [...contenidos].map(([id, contenido]) => ({ id, titulo: id, creado_en: "2026", tipo: "markdown", contenido }));
  const t3 = performance.now(); const json = JSON.stringify(filas); JSON.parse(json); const t4 = performance.now();
  console.log(`N=${N} (${(bytes/1e6).toFixed(1)} MB): aristas ${(t1-t0).toFixed(0)} ms · tags ${(t2-t1).toFixed(0)} ms · JSON ida+vuelta ${(t4-t3).toFixed(0)} ms · ${aristas.length} aristas`);
}
