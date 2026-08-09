// Smoke test de las bases (`FUN-L-03`) contra el backend .NET: crea notas con
// frontmatter, pide `/vaults/{id}/tabla` y evalúa una base real sobre lo que
// devuelve — con el MISMO `lib/bases.ts` que usa la app.
//
// Prueba la cadena entera menos el pintado: endpoint → datos → filtro → filas.
// No usa Playwright ni necesita el front levantado.
//
//   cd backend/src/Micelio.Api && dotnet run     # en otra consola
//   node frontend/scripts/smoke-bases.mjs
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const API = "http://localhost:5279";

const rutaTs = fileURLToPath(new URL("../lib/bases.ts", import.meta.url));
const { outputText } = ts.transpileModule(await readFile(rutaTs, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { parsearBase, construirTabla } = await import(
  `data:text/javascript,${encodeURIComponent(outputText)}`
);

const j = async (path, opts = {}) => {
  const r = await fetch(API + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${path}: ${texto.slice(0, 300)}`);
  return texto ? JSON.parse(texto) : null;
};

const checks = {};
const igual = (nombre, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  checks[nombre] = ok ? "OK" : `FALLO: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`;
};

const login = await j("/auth/login", {
  method: "POST",
  body: { email: "dev@micelio.local", password: "micelio123" },
});
const token = login.accessToken;
const me = await j("/auth/me", { token });
const vaultId = me.vaults[0].id;

// Una carpeta y tres notas: dos que deben entrar y una que no.
const marca = Date.now();
await j(`/vaults/${vaultId}/carpetas`, {
  method: "POST",
  token,
  body: { nombre: `Proyectos ${marca}`, padreId: null },
});
const arbol = await j(`/vaults/${vaultId}/tree`, { token });
const carpeta = arbol.carpetas.find((c) => c.nombre === `Proyectos ${marca}`);

const crear = async (titulo, contenido, carpetaId) => {
  const n = await j(`/vaults/${vaultId}/notas`, {
    method: "POST",
    token,
    body: { titulo, carpetaId, tipo: "markdown" },
  });
  await j(`/notas/${n.id}/contenido`, { method: "PUT", token, body: { contenido } });
  return n.id;
};

const fm = (props, cuerpo = "") => `---\n${props}\n---\n\n${cuerpo}`;

const idActiva = await crear(
  `Activa ${marca}`,
  fm("estado: activo\nprioridad: 3\ntags:\n  - proyecto", "Cuerpo con #urgente."),
  carpeta.id,
);
const idPausada = await crear(
  `Pausada ${marca}`,
  fm("estado: pausado\nprioridad: 1"),
  carpeta.id,
);
const idArchivada = await crear(
  `Archivada ${marca}`,
  fm("estado: archivado\nprioridad: 9"),
  carpeta.id,
);
// Fuera de la carpeta: no debe entrar aunque su estado sea "activo".
const idFuera = await crear(`Suelta ${marca}`, fm("estado: activo\nprioridad: 5"), null);

// ── El endpoint ───────────────────────────────────────────────────────────────

const { notas } = await j(`/vaults/${vaultId}/tabla`, { token });
const activa = notas.find((n) => n.id === idActiva);

igual("el endpoint devuelve la nota", activa !== undefined, true);
igual("la carpeta se resuelve a su RUTA, no al UUID", activa.carpeta, `Proyectos ${marca}`);
igual("la ruta incluye la carpeta", activa.ruta, `Proyectos ${marca}/Activa ${marca}`);
igual(
  "las propiedades llegan una fila por valor",
  activa.props.map((p) => `${p.clave}=${p.valor}`),
  ["estado=activo", "prioridad=3", "tags=proyecto"],
);
igual(
  "las etiquetas salen del frontmatter Y del cuerpo",
  [...activa.tags].sort(),
  ["proyecto", "urgente"],
);

// ── La base, evaluada con el módulo compartido ───────────────────────────────

const base = parsearBase(`
filters:
  and:
    - file.inFolder("Proyectos ${marca}")
    - estado != "archivado"

views:
  - type: table
    name: Activos
    order:
      - file.name
      - estado
      - prioridad
    sort:
      - property: prioridad
        direction: DESC
`);

const t = construirTabla(base, base.vistas[0], notas);
igual("la tabla se pudo construir", t.ok, true);
const ids = t.filas.map((f) => f.nota.id);
igual("entran las dos que cumplen", ids, [idActiva, idPausada]);
igual("no entra la archivada", ids.includes(idArchivada), false);
igual("no entra la de fuera de la carpeta", ids.includes(idFuera), false);
igual("las celdas traen los valores pedidos", t.filas[0].celdas[2], ["3"]);

// Filtro que Mycelium no entiende: NO debe devolver una tabla a medias.
const rota = parsearBase(`
filters:
  and:
    - file.inFolder("Proyectos ${marca}")
    - price.toFixed(2) > 1
views:
  - type: table
`);
const tr = construirTabla(rota, rota.vistas[0], notas);
igual("un filtro desconocido no produce filas", tr.ok, false);
igual("y se dice cuál fue", tr.expresion, "price.toFixed(2) > 1");

const sinFiltrar = construirTabla(rota, rota.vistas[0], notas, { ignorarFiltros: true });
igual("«ver sin filtrar» sí devuelve filas", sinFiltrar.ok && sinFiltrar.filas.length > 0, true);

console.log(JSON.stringify(checks, null, 2));
const fallos = Object.values(checks).filter((v) => v !== "OK").length;
console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
