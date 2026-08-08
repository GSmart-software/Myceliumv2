// Smoke test de las propiedades del frontmatter (FUN-M-04) contra el backend
// .NET: guarda una nota con frontmatter y la va a buscar por sus propiedades.
//
// A diferencia de los demás `smoke-*.mjs`, este NO usa Playwright ni necesita el
// front levantado: habla directo con la API, que es donde vive la mitad de
// FUN-M-04 que no se puede reflejar del escritorio (allá el índice es SQLite
// local; acá es D1 + blobs).
//
//   cd backend/src/Micelio.Api && dotnet run     # en otra consola
//   node frontend/scripts/smoke-propiedades.mjs
const API = "http://localhost:5279";

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
const token = login.accessToken ?? login.access_token;
if (!token) throw new Error("login sin token: " + JSON.stringify(login));
const me = await j("/auth/me", { token });
const vaultId = (me.vaults ?? [])[0]?.id;
if (!vaultId) throw new Error("sin vault: " + JSON.stringify(me));

// Nota con frontmatter: escalares, lista en bloque, tags con `#`, y un valor
// entrecomillado que NO debe leerse como número.
const contenido = [
  "---",
  "estado: activo",
  "prioridad: 3",
  "publicado: true",
  'version: "1.0"',
  "revisado: 2026-08-08",
  "tags:",
  "  - #idea",
  "  - proyecto",
  "---",
  "",
  "Cuerpo de la nota con la palabra murcielago y un #tagDelCuerpo.",
].join("\n");

const nota = await j(`/vaults/${vaultId}/notas`, {
  method: "POST",
  token,
  body: { titulo: `Prueba propiedades ${Date.now()}`, carpetaId: null, tipo: "markdown" },
});
await j(`/notas/${nota.id}/contenido`, { method: "PUT", token, body: { contenido } });

// 1. Propiedades indexadas de la nota, con sus tipos.
const props = await j(`/notas/${nota.id}/propiedades`, { token });
igual(
  "propiedades de la nota",
  props.map((p) => `${p.clave}=${p.valor}:${p.tipo}`),
  [
    "estado=activo:texto",
    "prioridad=3:numero",
    "publicado=true:casilla",
    "version=1.0:texto",
    "revisado=2026-08-08:fecha",
    "tags=idea:lista",
    "tags=proyecto:lista",
  ],
);

// 2. Claves del vault (autocompletado del panel).
const { claves } = await j(`/vaults/${vaultId}/propiedades/claves`, { token });
igual(
  "claves del vault",
  ["estado", "prioridad", "publicado", "revisado", "tags", "version"].every((c) => claves.includes(c)),
  true,
);

// 3. Notas por propiedad.
const porProp = await j(`/vaults/${vaultId}/propiedades?clave=estado&valor=activo`, { token });
igual("notas con estado:activo", porProp.notas.some((n) => n.id === nota.id), true);
const otroValor = await j(`/vaults/${vaultId}/propiedades?clave=estado&valor=archivado`, { token });
igual("notas con estado:archivado", otroValor.notas.some((n) => n.id === nota.id), false);

// 4. Filtro `clave:valor` en la búsqueda, solo y combinado con texto.
const solo = await j(`/vaults/${vaultId}/buscar?q=${encodeURIComponent("estado:activo")}`, { token });
igual("buscar estado:activo", solo.resultados.some((r) => r.nota_id === nota.id), true);

const combinado = await j(
  `/vaults/${vaultId}/buscar?q=${encodeURIComponent("murcielago estado:activo")}`, { token });
igual("buscar murcielago + estado:activo", combinado.resultados.some((r) => r.nota_id === nota.id), true);

const contradictorio = await j(
  `/vaults/${vaultId}/buscar?q=${encodeURIComponent("murcielago estado:archivado")}`, { token });
igual("filtro que no casa descarta la nota", contradictorio.resultados.some((r) => r.nota_id === nota.id), false);

// 5. Mayúsculas: el filtro no distingue.
const mayus = await j(`/vaults/${vaultId}/buscar?q=${encodeURIComponent("Estado:Activo")}`, { token });
igual("filtro sin distinguir mayúsculas", mayus.resultados.some((r) => r.nota_id === nota.id), true);

// 6. El FTS indexa VALORES pero no CLAVES: «activo» encuentra, «prioridad» no.
const porValor = await j(`/vaults/${vaultId}/buscar?q=activo&exacto=true`, { token });
igual("el valor va al índice de texto", porValor.resultados.some((r) => r.nota_id === nota.id), true);
const porClave = await j(`/vaults/${vaultId}/buscar?q=prioridad&exacto=true`, { token });
igual("la clave NO va al índice de texto", porClave.resultados.some((r) => r.nota_id === nota.id), false);

// 7. Grafo: las etiquetas salen del frontmatter Y del cuerpo.
const grafo = await j(`/vaults/${vaultId}/grafo`, { token });
const nodo = grafo.nodos.find((n) => n.id === nota.id);
igual("etiquetas del grafo", [...(nodo?.tags ?? [])].sort(), ["idea", "proyecto", "tagDelCuerpo"]);

// 8. Un `https://…` en una propiedad no se confunde con un filtro.
const url = await j(`/vaults/${vaultId}/buscar?q=${encodeURIComponent("https://ejemplo.com")}`, { token });
igual("una URL no es un filtro", Array.isArray(url.resultados), true);

console.log(JSON.stringify(checks, null, 2));
const fallos = Object.values(checks).filter((v) => v !== "OK").length;
console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLO(S)`);
process.exit(fallos === 0 ? 0 : 1);
