import { chromium } from "file:///C:/Trabajo/GSmart/Mycelium/frontend/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ args: ["--enable-gpu-rasterization"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto("file:///C:/Users/gabip/AppData/Local/Temp/claude/C--Trabajo-GSmart-Mycelium/35d63067-2716-48fb-8f9b-ba1d860cbbba/scratchpad/draw-bench.html");
const casos = [
  ["scale 1 · flujo + etiquetas (default)", { scale: 1, showFlow: true, showArrow: false, labels: true }],
  ["scale 1 · sin flujo, con etiquetas",   { scale: 1, showFlow: false, showArrow: false, labels: true }],
  ["scale 1 · flujo, sin etiquetas",       { scale: 1, showFlow: true, showArrow: false, labels: false }],
  ["scale 1 · sin flujo ni etiquetas",     { scale: 1, showFlow: false, showArrow: false, labels: false }],
  ["scale 0.3 (todo visible) · flujo",     { scale: 0.3, showFlow: true, showArrow: false, labels: true }],
  ["scale 0.3 (todo visible) · sin flujo", { scale: 0.3, showFlow: false, showArrow: false, labels: true }],
];
for (const N of [1000, 2000, 4000]) {
  console.log(`\n== N=${N}, ${N*3} aristas ==`);
  for (const [nombre, opts] of casos) {
    const r = await page.evaluate(([n, o]) => window.bench(n, 3, o), [N, opts]);
    console.log(`${nombre.padEnd(42)} ${String(r.ms).padStart(7)} ms/frame  (visibles: ${r.nodosVis} nodos, ${r.aristasVis} aristas)`);
  }
}
await browser.close();
