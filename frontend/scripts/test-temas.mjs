// Test de la atmósfera Aurora (`FUN-M-54`): que esté en el catálogo de
// `lib/atmosferas.ts` y se valide, y lo que el CSS tiene que cumplir —su hoja y
// sus reglas en los módulos acotadas a la atmósfera, que cubra los componentes
// y selectores de `AURORA_CUBRE` y el contraste de sus degradados en los dos
// temas y los dos modos, calculado desde las fórmulas de `styles/aurora.css`—.
//
// El módulo se transpila a una carpeta temporal DENTRO de `frontend/`.
//
//   node --test scripts/test-temas.mjs
import assert from "node:assert/strict";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, test } from "node:test";
import ts from "typescript";

const AQUI = dirname(fileURLToPath(import.meta.url));
const FRONTEND = join(AQUI, "..");
const TMP = join(FRONTEND, ".tmp-test-temas");

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
{
  const fuente = await readFile(join(FRONTEND, "lib/atmosferas.ts"), "utf8");
  const { outputText } = ts.transpileModule(fuente, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  await writeFile(join(TMP, "atmosferas.mjs"), outputText);
}
const { ATMOSFERAS, atmosferaValida } = await import(pathToFileURL(join(TMP, "atmosferas.mjs")).href);

after(() => rm(TMP, { recursive: true, force: true }));

// Sin los `\r`: el checkout de Windows convierte a CRLF (autocrlf) y los
// `indexOf` de abajo buscan saltos `\n` a secas.
const leer = async (ruta) => (await readFile(join(FRONTEND, ruta), "utf8")).replace(/\r\n/g, "\n");

// ── Utilidades de CSS ────────────────────────────────────────────────────────

/** Los `--mic-raw-*` del primer bloque cuyo selector es exactamente `selector`. */
function rawsDe(css, selector) {
  const i = css.indexOf(`${selector} {`);
  assert.ok(i >= 0, `falta el bloque ${selector}`);
  const cuerpo = css.slice(i, css.indexOf("}", i));
  const salida = {};
  for (const m of cuerpo.matchAll(/--mic-raw-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) salida[m[1]] = m[2].toUpperCase();
  return salida;
}

const tokens = await leer("styles/tokens.css");

// Contraste WCAG 2.x (no a ojo): luminancia relativa de sRGB.
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** El cuerpo del primer bloque de `css` (sin comentarios) con el selector exacto `selector` que declara `variable`. */
function bloqueDe(css, selector, variable) {
  const limpio = sinComentarios(css);
  for (let i = limpio.indexOf(`${selector} {`); i >= 0; i = limpio.indexOf(`${selector} {`, i + 1)) {
    const cuerpo = limpio.slice(i, limpio.indexOf("}", i));
    if (cuerpo.includes(variable)) return cuerpo;
  }
  assert.fail(`falta ${selector} con ${variable}`);
}

/** Los selectores de una hoja (sin comentarios ni @media), con los espacios normalizados. */
const selectoresDe = (css) =>
  [...sinComentarios(css).matchAll(/([^{}]+)\{/g)]
    .map((m) => m[1].trim().replace(/\s+/g, " "))
    .filter((s) => s && !s.startsWith("@media"));

const modulos = [];
const recorrer = async (dir) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) await recorrer(ruta);
    else if (e.name.endsWith(".module.css")) modulos.push(ruta);
  }
};
await recorrer(join(FRONTEND, "components"));
await recorrer(join(FRONTEND, "app"));

/** Las reglas de los módulos que nombran `nombre`, por archivo. Cada una tiene que ir acotada. */
async function reglasDeModulos(nombre) {
  const salida = new Map();
  for (const ruta of modulos) {
    const texto = sinComentarios(await readFile(ruta, "utf8"));
    for (const m of texto.matchAll(/([^{}]+)\{/g)) {
      const sel = m[1].trim().replace(/\s+/g, " ");
      if (!new RegExp(nombre, "i").test(sel)) continue;
      const archivo = relative(FRONTEND, ruta);
      if (!salida.has(archivo)) salida.set(archivo, new Set());
      salida.get(archivo).add(sel);
    }
  }
  return salida;
}

// ── Atmósfera Aurora (`FUN-M-54`) ────────────────────────────────────────────
//
// La quinta atmósfera: degradados, brillos y resplandores con los colores del
// tema que esté puesto. Lo que Aurora deja afuera a propósito —la letra de los
// títulos, el radio y el foco de los inputs: una atmósfera reparte color, no
// cambia la letra ni la forma de los controles— lo vigila el test de su hoja
// (sin `font-family`, sin `:focus`).

const auroraCss = await leer("styles/aurora.css");
const AURORA = ":root[data-atmosfera='aurora']";
const AURORA_MODULO = ":global(:root[data-atmosfera='aurora'])";

/** Lo que Aurora tiene que cubrir: los selectores de su hoja y, por módulo, los de cada componente. */
const AURORA_CUBRE = {
  hoja: [
    // Las variables: comunes, y las paradas de cada modo.
    AURORA,
    `${AURORA}[data-dark='true']`,
    `${AURORA}:not([data-dark='true'])`,
    // Títulos en degradado y en color.
    `${AURORA} :is(.mic-doc-title-texto, .mic-doc-title-campo)`,
    `${AURORA} .mic-preview h1`,
    `${AURORA}[data-dark='true'] :is(.mic-live-h1, .mic-live-h2, .mic-live-h3), ${AURORA}[data-dark='true'] .mic-preview :is(h2, h3)`,
    `${AURORA} .mic-preview :is(h1, h2, h3)`,
    // Etiquetas, selección, barras de desplazamiento y viñetas.
    `${AURORA} :is(.mic-tag-cm, .mic-tag-pill)`,
    `${AURORA} ::selection`,
    `${AURORA} *::-webkit-scrollbar-thumb`,
    `${AURORA} *::-webkit-scrollbar-thumb:hover`,
    `${AURORA} :is(.mic-vineta, .mic-preview li)::marker, ${AURORA} .mic-vineta`,
  ],
  // Por módulo, lo que va detrás de `AURORA_MODULO`.
  modulos: {
    "components/bases/BaseView.module.css": [".botonPrimario", ".botonPrimario:hover:not(:disabled)"],
    "components/editor/EditorToolbar.module.css": [".linkConfirm", ".linkConfirm:hover:not(:disabled)"],
    "components/editor/ExcalidrawModal.module.css": [".save", ".save:hover:not(:disabled)"],
    "components/explorer/EsporasPanel.module.css": [".primario", ".primario:hover:not(:disabled)"],
    "components/explorer/ExplorerPanel.module.css": [".rowHoja.rowActive", ".noteIcon"],
    "components/explorer/ImportDialogs.module.css": [".btnPrimary", ".btnPrimary:hover:not(:disabled)"],
    "components/graph/GraphOptionsMenu.module.css": [".switch input:checked + .switchTrack"],
    "components/panes/panes.module.css": [".tabActive", ".paneBody::after"],
    "components/recordatorios/Recordatorios.module.css": [".botonPrimario", ".botonPrimario:hover:not(:disabled)"],
    "components/settings/CssEditorModal.module.css": [".primaryBtn", ".primaryBtn:hover:not(:disabled)"],
    "components/settings/DiccionariosCorrector.module.css": [".botonPrimario", ".botonPrimario:hover:not(:disabled)"],
    "components/settings/Settings.module.css": [
      ".primaryBtn",
      ".primaryBtn:hover:not(:disabled)",
      ".switch input:checked + .switchTrack",
      ".swatchActive",
    ],
    "components/settings/VentanaAjustes.module.css": [".categoriaActiva"],
    "components/workspace/AppTopbar.module.css": [".logoFull", ".topbar", ".logoMark"],
    "components/workspace/PaletaComandos.module.css": [".opcionActiva"],
    "components/workspace/Rail.module.css": [
      ".button[aria-pressed='true']::before",
      ".button[aria-pressed='true']",
      ".button[aria-pressed='true'] svg",
      ".rail",
    ],
    "app/page.module.css": [".cta", ".cta:hover:not(:disabled)"],
  },
};

test("Aurora está en el catálogo de atmósferas y se valida", () => {
  const aurora = ATMOSFERAS.find((a) => a.id === "aurora");
  assert.ok(aurora, "falta Aurora en ATMOSFERAS");
  assert.equal(aurora.nombre, "Aurora");
  assert.ok(aurora.descripcion.length > 0 && aurora.descripcion.length <= 60, "una línea corta");
  assert.deepEqual(ATMOSFERAS.map((a) => a.id), ["abisal", "niebla", "bosque", "papel", "aurora"]);
  assert.equal(atmosferaValida("aurora", "niebla"), "aurora");
  assert.equal(atmosferaValida("Aurora", "niebla"), "niebla");
});

test("Aurora: su hoja va acotada a la atmósfera, no redefine tokens y no cambia la letra", async () => {
  const layout = await leer("app/layout.tsx");
  assert.match(layout, /import "\.\.\/styles\/aurora\.css";/);
  const selectores = selectoresDe(auroraCss);
  assert.ok(selectores.length > 0);
  for (const lista of selectores) {
    for (const s of lista.split(/,(?![^()]*\))/).map((x) => x.trim())) {
      assert.ok(s.startsWith(AURORA), `regla sin acotar: ${s}`);
    }
  }
  const css = sinComentarios(auroraCss);
  // Sin colores propios ni fondos: los tokens son los del tema (y los fondos, los de Abisal).
  assert.doesNotMatch(css, /--mic-[a-z0-9-]+\s*:/, "Aurora no redefine tokens --mic-*");
  assert.doesNotMatch(css, /data-theme/, "Aurora no depende de un tema");
  assert.doesNotMatch(css, /font-family|letter-spacing|--font-/, "una atmósfera no cambia la letra");
  // Sin halo en el foco de los inputs.
  assert.doesNotMatch(css, /:focus/);
  // atmosferas.css no la nombra: sus reglas viven aparte.
  assert.doesNotMatch(await leer("styles/atmosferas.css"), /aurora/i);
});

test("Aurora: en los módulos, toda regla va bajo el :global acotado (salvo su muestra en Apariencia)", async () => {
  let reglas = 0;
  for (const [archivo, sels] of await reglasDeModulos("aurora")) {
    for (const sel of sels) {
      reglas++;
      for (const s of sel.split(/,(?![^()]*\))/).map((x) => x.trim())) {
        if (archivo.endsWith("Settings.module.css") && s.startsWith(".muestra[data-atmosfera='aurora']")) continue;
        assert.ok(s.startsWith(AURORA_MODULO), `${archivo}: ${s}`);
        assert.doesNotMatch(s, /data-dark/, `${archivo}: lo que cambia con el modo va en variables: ${s}`);
      }
    }
  }
  assert.ok(reglas >= 30, `se esperaban las reglas de Aurora en los módulos (hay ${reglas})`);
});

test("Aurora lleva la luz en todos los componentes y selectores de su lista", async () => {
  const deAurora = new Set(selectoresDe(auroraCss));
  for (const s of AURORA_CUBRE.hoja) assert.ok(deAurora.has(s), `styles/aurora.css no tiene: ${s}`);
  // Las claves con barras normales: `relative` da barras invertidas en Windows.
  const aurora = new Map([...(await reglasDeModulos("aurora"))].map(([archivo, sels]) => [archivo.replaceAll("\\", "/"), sels]));
  for (const [archivo, sufijos] of Object.entries(AURORA_CUBRE.modulos)) {
    for (const sufijo of sufijos) {
      const s = `${AURORA_MODULO} ${sufijo}`;
      assert.ok(aurora.get(archivo)?.has(s), `${archivo} no tiene: ${s}`);
    }
  }
});

// Contraste: se resuelven las fórmulas de aurora.css (y las de tokens.css que
// usa) con los raw de cada tema y modo, como lo haría el navegador.
const AURORA_PALETAS = [
  ["bioluminiscencia", "claro", "[data-theme='bioluminiscencia']"],
  ["bioluminiscencia", "oscuro", "[data-theme='bioluminiscencia'][data-dark='true']"],
  ["cantarela", "claro", "[data-theme='cantarela']"],
  ["cantarela", "oscuro", "[data-theme='cantarela'][data-dark='true']"],
];

/** Las declaraciones `--x: valor;` de un cuerpo de bloque. */
const declaraciones = (cuerpo) =>
  Object.fromEntries([...cuerpo.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().replace(/\s+/g, " ")]));

const hexDe = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
const rgbDe = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** `color-mix(in srgb, a p, b)` con colores opacos. */
const mezclar = (a, p, b) => hexDe(rgbDe(a).map((v, i) => v * p + rgbDe(b)[i] * (1 - p)));

function resolver(expr, vars) {
  const e = expr.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(e)) return e.toUpperCase();
  let m = e.match(/^var\((--[a-z0-9-]+)\)$/);
  if (m) {
    assert.ok(vars[m[1]], `sin valor para ${m[1]}`);
    return resolver(vars[m[1]], vars);
  }
  m = e.match(/^color-mix\(in srgb, (var\([^)]+\)|#[0-9a-fA-F]{6}) (\d+)%, (var\([^)]+\)|#[0-9a-fA-F]{6})\)$/);
  assert.ok(m, `fórmula no soportada: ${e}`);
  return mezclar(resolver(m[1], vars), Number(m[2]) / 100, resolver(m[3], vars));
}

/** Las variables de una combinación tema × modo con Aurora puesta. */
function varsAurora(selectorTema, oscuro) {
  const raw = rawsDe(tokens, selectorTema);
  const vars = Object.fromEntries(Object.entries(raw).map(([k, v]) => [`--mic-raw-${k}`, v]));
  Object.assign(vars, {
    "--mic-glow": "var(--mic-raw-glow)",
    "--mic-accent": "var(--mic-raw-accent)",
    "--mic-text-primary": "var(--mic-raw-ink)",
    "--mic-text-muted": "var(--mic-raw-ink-muted)",
    "--mic-bg-canvas": "var(--mic-raw-canvas)",
    "--mic-bg-surface": "var(--mic-raw-mist)",
    "--mic-bg-sidebar": "var(--mic-raw-base)",
  });
  // Los roles del glow (texto, enlace, marco) de tokens.css, y los de claro encima.
  Object.assign(vars, declaraciones(bloqueDe(tokens, ":root", "--mic-glow-texto:")));
  if (!oscuro) Object.assign(vars, declaraciones(bloqueDe(tokens, ":root:not([data-dark='true'])", "--mic-glow-texto:")));
  Object.assign(vars, declaraciones(bloqueDe(auroraCss, AURORA, "--aurora-degradado:")));
  const modo = oscuro ? `${AURORA}[data-dark='true']` : `${AURORA}:not([data-dark='true'])`;
  Object.assign(vars, declaraciones(bloqueDe(auroraCss, modo, "--aurora-desde:")));
  return vars;
}

const porcentaje = (texto, re) => {
  const m = texto.match(re);
  assert.ok(m, `no se encontró ${re}`);
  return Number(m[1]) / 100;
};

for (const [tema, modo, selectorTema] of AURORA_PALETAS) {
  const oscuro = modo === "oscuro";
  test(`contraste de Aurora con ${tema} en ${modo}: botones, títulos en degradado, marco, selección, etiquetas y luz`, () => {
    const v = varsAurora(selectorTema, oscuro);
    const c = (n) => resolver(`var(${n})`, v);
    const [canvas, mist, base, ink, muted] = ["--mic-raw-canvas", "--mic-raw-mist", "--mic-raw-base", "--mic-raw-ink", "--mic-raw-ink-muted"].map(c);
    const glow = c("--mic-glow"), accent = c("--mic-accent"), glowTexto = c("--mic-glow-texto"), enlace = c("--mic-enlace");
    const fallos = [];
    const exigir = (que, a, b) => {
      const r = contraste(a, b);
      if (r < 4.5) fallos.push(`${que}: ${a} sobre ${b} = ${r.toFixed(2)}:1`);
    };

    // El texto del botón sobre cada parada del degradado.
    const desde = c("--aurora-desde"), hasta = c("--aurora-hasta"), sobre = c("--aurora-sobre-degradado");
    exigir("botón, 1ª parada", sobre, desde);
    exigir("botón, 2ª parada", sobre, hasta);

    // Las paradas del degradado de texto (título de la nota, H1 de lectura).
    const m = v["--aurora-degradado-texto"].match(/^linear-gradient\(90deg, (var\([^)]+\)) 0%, (var\([^)]+\)) 100%\)$/);
    assert.ok(m, "el degradado de texto tiene dos paradas");
    for (const parada of [resolver(m[1], v), resolver(m[2], v)]) {
      exigir("título en degradado / nota", parada, canvas);
      exigir("título en degradado / paneles", parada, mist);
    }

    // El nombre de la app, en el degradado del marco, sobre el marco.
    exigir("nombre sobre el marco, 1ª parada", c("--mic-marco-glow"), base);
    exigir("nombre sobre el marco, 2ª parada", c("--mic-marco-acento"), base);

    // La selección suave (pestaña, nota abierta, categoría, opción de la paleta).
    const suaveGlow = porcentaje(v["--aurora-degradado-suave"], /var\(--mic-glow\) (\d+)%/);
    const suaveAcento = porcentaje(v["--aurora-suave-hasta"], /^(\d+)%$/);
    for (const fondo of [canvas, mist]) {
      for (const [color, p] of [[glow, suaveGlow], [accent, suaveAcento]]) {
        const bg = mezclar(color, p, fondo);
        exigir("principal sobre la selección suave", ink, bg);
        exigir("secundario sobre la selección suave", muted, bg);
      }
    }

    // Las etiquetas sobre su pastilla.
    const pastilla = [
      [glow, porcentaje(v["--aurora-pastilla-desde"], /^(\d+)%$/)],
      [accent, porcentaje(v["--aurora-pastilla-hasta"], /^(\d+)%$/)],
    ];
    for (const fondo of [canvas, mist]) {
      for (const [color, p] of pastilla) exigir("etiqueta sobre su pastilla", glowTexto, mezclar(color, p, fondo));
    }

    // La luz ambiente va ENCIMA del texto: tiñe texto y fondo a la vez.
    const amb = v["--aurora-ambiente"];
    for (const [color, p] of [
      [glow, porcentaje(amb, /var\(--mic-glow\) (\d+)%/)],
      [accent, porcentaje(amb, /var\(--mic-accent\) (\d+)%/)],
    ]) {
      const bg = mezclar(color, p, canvas);
      for (const [que, texto] of [["principal", ink], ["secundario", muted], ["enlace", enlace], ["etiqueta", glowTexto], ["título 1", resolver(m[1], v)], ["título 2", resolver(m[2], v)]]) {
        exigir(`${que} bajo la luz ambiente`, mezclar(color, p, texto), bg);
      }
    }

    assert.deepEqual(fallos, [], `${tema} ${modo}`);
  });
}

test("Aurora: el degradado va del glow al acento del tema (en claro, hundidos en el tono de base)", () => {
  const oscuro = declaraciones(bloqueDe(auroraCss, `${AURORA}[data-dark='true']`, "--aurora-desde:"));
  assert.equal(oscuro["--aurora-desde"], "var(--mic-glow)");
  assert.equal(oscuro["--aurora-hasta"], "var(--mic-accent)");
  const claro = declaraciones(bloqueDe(auroraCss, `${AURORA}:not([data-dark='true'])`, "--aurora-desde:"));
  assert.match(claro["--aurora-desde"], /^color-mix\(in srgb, var\(--mic-glow\) \d+%, var\(--mic-raw-base-deep\)\)$/);
  assert.match(claro["--aurora-hasta"], /^color-mix\(in srgb, var\(--mic-accent\) \d+%, var\(--mic-raw-base-deep\)\)$/);
  // Con Bioluminiscencia, del verde agua al cian; con Cantarela, del dorado al ámbar.
  const bio = varsAurora("[data-theme='bioluminiscencia'][data-dark='true']", true);
  assert.deepEqual([resolver("var(--aurora-desde)", bio), resolver("var(--aurora-hasta)", bio)], ["#3DFFC4", "#19E6FF"]);
  const can = varsAurora("[data-theme='cantarela'][data-dark='true']", true);
  assert.deepEqual([resolver("var(--aurora-desde)", can), resolver("var(--aurora-hasta)", can)], ["#FFC247", "#C77F2E"]);
});
