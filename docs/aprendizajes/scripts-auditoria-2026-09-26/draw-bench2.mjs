import { chromium } from "file:///C:/Trabajo/GSmart/Mycelium/frontend/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ args: ["--enable-gpu-rasterization"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto("file:///C:/Users/gabip/AppData/Local/Temp/claude/C--Trabajo-GSmart-Mycelium/35d63067-2716-48fb-8f9b-ba1d860cbbba/scratchpad/draw-bench2.html");
for (const [N, scale] of [[1000, 1], [1000, 0.3], [2000, 0.3], [4000, 0.15]]) {
  const r = await page.evaluate(([n, s]) => window.bench(n, s), [N, scale]);
  console.log(JSON.stringify(r));
}
await browser.close();
