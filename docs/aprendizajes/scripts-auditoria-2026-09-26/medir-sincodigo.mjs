// Compara `sinCodigo` real (compilado de lib/sinCodigo.ts) con una variante que
// evita `split("")` y el escaneo carácter a carácter, verificando que devuelvan
// EXACTAMENTE lo mismo sobre todas las notas del vault.
//   node medir-sincodigo.mjs notas-<nombre>.json
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
const { sinCodigo } = await import(new URL("./ts/sinCodigo.js", import.meta.url));
const { notas } = JSON.parse(readFileSync(process.argv[2], "utf8"));

// ── Variante rápida: misma semántica, sin arrays de caracteres ─────────────
const APERTURA = /^ {0,3}(`{3,}|~{3,})/;
const blanquear = (s) => s.replace(/[^\n]/g, " ");
function sinBloques(texto) {
  const lineas = texto.split("\n");
  let cerco = null;
  let cierre = null;
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    if (cerco === null) {
      if (l.indexOf("`") === -1 && l.indexOf("~") === -1) continue; // atajo: nada que abrir
      const m = APERTURA.exec(l);
      if (m && !(m[1][0] === "`" && l.slice(m[0].length).includes("`"))) {
        cerco = m[1];
        cierre = new RegExp(`^ {0,3}${cerco[0] === "\`" ? "\`" : "~"}{${cerco.length},}\\s*$`);
        lineas[i] = blanquear(l);
      }
      continue;
    }
    if (cierre.test(l)) cerco = null;
    lineas[i] = blanquear(l);
  }
  return lineas.join("\n");
}
const FIN_PARRAFO = /\n[ \t]*(\n|$)/g;
function sinCodigoEnLinea(texto) {
  let out = "";
  let ultimo = 0; // hasta dónde ya se copió
  let i = texto.indexOf("`");
  while (i !== -1) {
    let n = 1;
    while (texto.charCodeAt(i + n) === 96) n++;
    // fin del párrafo (renglón en blanco) a partir de i: hasta ahí se busca el cierre
    FIN_PARRAFO.lastIndex = i + n;
    const fp = FIN_PARRAFO.exec(texto);
    const limite = fp ? fp.index : texto.length;
    let j = i + n;
    let cierre = -1;
    while (j < limite) {
      const k = texto.indexOf("`", j);
      if (k === -1 || k >= limite) break;
      let m = 1;
      while (texto.charCodeAt(k + m) === 96) m++;
      if (m === n) { cierre = k; break; }
      j = k + m;
    }
    if (cierre < 0) { i = texto.indexOf("`", i + n); continue; }
    out += texto.slice(ultimo, i) + blanquear(texto.slice(i, cierre + n));
    ultimo = cierre + n;
    i = texto.indexOf("`", ultimo);
  }
  return ultimo === 0 ? texto : out + texto.slice(ultimo);
}
function sinCodigoRapido(texto) {
  if (!texto.includes("`") && !texto.includes("~~~")) return texto;
  return sinCodigoEnLinea(sinBloques(texto));
}

// ── Equivalencia ──────────────────────────────────────────────────────────
let distintas = 0;
for (const n of notas) {
  const a = sinCodigo(n.contenido), b = sinCodigoRapido(n.contenido);
  if (a !== b) { distintas++; if (distintas <= 3) { const p = [...a].findIndex((c, i) => c !== b[i]); console.log(`DIFIERE ${n.id} en ${p}: …${JSON.stringify(n.contenido.slice(Math.max(0, p - 40), p + 40))}`); } }
}
console.log(`== ${process.argv[2]}: ${notas.length} notas · salidas distintas: ${distintas}`);

function medir(et, f) {
  const ts = [];
  for (let i = 0; i < 5; i++) { const t = performance.now(); f(); ts.push(performance.now() - t); }
  ts.sort((a, b) => a - b);
  console.log(`${et.padEnd(28)} min ${ts[0].toFixed(1)} ms · med ${ts[2].toFixed(1)} ms`);
}
medir("sinCodigo (actual)", () => notas.forEach((n) => sinCodigo(n.contenido)));
medir("sinCodigo (variante)", () => notas.forEach((n) => sinCodigoRapido(n.contenido)));
// la nota más grande, sola (lo que pagaría una vista en vivo o el panel de una nota)
const max = notas.reduce((a, b) => (a.contenido.length > b.contenido.length ? a : b));
medir(`actual, nota max (${max.contenido.length})`, () => sinCodigo(max.contenido));
medir(`variante, nota max`, () => sinCodigoRapido(max.contenido));
