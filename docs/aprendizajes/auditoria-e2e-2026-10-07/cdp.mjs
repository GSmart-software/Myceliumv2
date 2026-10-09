// Uso: node cdp.mjs <paso.mjs> [captura.png]
// El paso exporta `default async ({ page, log }) => valor`. Se conecta a la ventana de
// desarrollo por CDP, corre el paso, junta errores de consola y sale sin cerrar la app.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const require = createRequire("C:/Trabajo/GSmart/Mycelium/frontend/package.json");
const { chromium } = require("playwright");

const [paso, captura] = process.argv.slice(2);
const browser = await chromium.connectOverCDP("http://localhost:9222");
const pages = browser.contexts().flatMap((c) => c.pages());
const page = pages.find((p) => p.url().includes("localhost:3000")) ?? pages[0];
const errores = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errores.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
page.on("pageerror", (e) => errores.push(`[pageerror] ${e.message.slice(0, 300)}`));
const log = (...a) => console.log(...a);
try {
  const mod = await import(pathToFileURL(paso).href + "?t=" + Date.now());
  const r = await mod.default({ page, log, browser });
  if (r !== undefined) console.log(typeof r === "string" ? r : JSON.stringify(r, null, 1));
} catch (e) {
  console.log("FALLO DEL PASO:", e.message.split("\n").slice(0, 6).join("\n"));
}
await page.waitForTimeout(300);
if (captura) await page.screenshot({ path: captura });
if (errores.length) console.log("CONSOLA:\n" + [...new Set(errores)].join("\n"));
process.exit(0);
