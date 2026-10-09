// Test manual de la búsqueda (DEF-144/145/146/148/152), como test-search.ps1:
// casos portados de scripts/test-busqueda-propiedades.mjs de desktop.
//
// Contra un backend en modo local con una base y unos blobs VACÍOS (el
// resultado esperado cuenta las notas del vault seed):
//   node test-busqueda.mjs http://localhost:5279 crear      # crea las notas de prueba
//   node test-busqueda.mjs http://localhost:5279 verificar  # los casos
//   node test-busqueda.mjs http://localhost:5279 mostrar    # resultados y fragmentos
//   node test-busqueda.mjs http://localhost:5279 renombrar  # renombrar y duplicar
//                                                            # (deja una copia: va al final)
import assert from "node:assert/strict";

const [base, modo] = process.argv.slice(2);

async function api(ruta, { method = "GET", body, token } = {}) {
  const r = await fetch(base + ruta, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${method} ${ruta} → ${r.status} ${txt}`);
  return txt ? JSON.parse(txt) : null;
}

const login = await api("/auth/login", { method: "POST", body: { email: "dev@micelio.local", password: "micelio123" } });
const token = login.accessToken;
const me = await api("/auth/me", { token });
const v = me.vaults[0].id;

const CANVAS = JSON.stringify({
  nodes: [
    { id: "a", type: "text", text: "Albahaca **intercalada**\nentre [[Tomate]]", x: 0, y: 0, width: 250, height: 60 },
    { id: "b", type: "file", file: "Huerta/Zanahoria.md", x: 0, y: 100, width: 250, height: 60 },
    { id: "g", type: "group", label: "Cultivos", x: 0, y: 0, width: 500, height: 500 },
  ],
  edges: [{ id: "e", fromNode: "a", toNode: "b", label: "rota con" }],
});
const EXCALIDRAW = JSON.stringify({
  type: "excalidraw",
  elements: [
    { type: "text", text: "Compostera", originalText: "Compostera", isDeleted: false, width: 100 },
    { type: "text", text: "Borrado", originalText: "Borrado", isDeleted: true },
    { type: "image", fileId: "x" },
  ],
  files: { x: { dataURL: "data:image/png;base64,QUJDwidthREVG" } },
});

const NOTAS = [
  ["Tomate", "markdown", "---\nfamilia: solanáceas\nestado: creciendo\nbancal: Bancal 1\nluz: semi-sombra\n---\nRojo, de verano. Cuidado con el [[Pulgón|pulgones]]. Habla de la huerta.\n\n| Asociación | Bien |\n|---|---|\n| Tomate | [[Albahaca]] |\n\n- [ ] Probar **Ají** con cebolla\n"],
  ["Ají", "markdown", "---\nfamilia: Solanáceas\nbancal: Bancal 1\nestado: inactivo\ntags: [Picante, huerta]\n---\nPicante. #Solanáceas\n"],
  ["Caléndula", "markdown", "---\nbancal: bancal 1\nestado: activo\n---\nFlor. **Repele** a los [[Pulgón|pulgones]] de las plantas vecinas. #cultivo\n"],
  ["Lechuga", "markdown", "---\nbancal: Bancal 10\nestado: Activo\n---\nHoja. Riego diario.\n"],
  ["Zapallo", "markdown", "---\nfamilia: cucurbitáceas\nestado: planificado\nbancal: Bancal 3\ntags: [verano, cultivo]\n---\nRastrero. Se siembra en primavera.\n"],
  ["Pulgón", "markdown", "Plaga. #plaga\n"],
  ["Riego", "markdown", "Cada dos días. #huerta/riego\n"],
  ["Riego goteo", "markdown", "Por goteo. #huerta/riego/goteo\n"],
  ["Huertas", "markdown", "Otra etiqueta que empieza igual. #huertas #huerta-urbana\n"],
  ["Código", "markdown", "Un tag en código no cuenta:\n\n```\n#huerta\n```\n"],
  ["Hash", "markdown", "---\ntags: [\"#cosecha\"]\n---\nCon el numeral en la propiedad.\n"],
  ["Porcentaje", "markdown", "---\navance: 50%\ncodigo: a_b\n---\n"],
  ["Papa", "markdown", "---\nfamília: Solanáceas\n---\nTubérculo.\n"],
  ["Tomates cherry", "markdown", "Pequeños.\n"],
  ["Tómate un respiro", "markdown", "Descanso.\n"],
  ["Riego del tomate", "markdown", "Cada mañana.\n"],
  ...Array.from({ length: 3 }, (_, i) => [`Nota ${i + 1}`, "markdown", "tomate tomate tomate tomate. Más tomate.\n"]),
  ["Tablero", "canvas", CANVAS],
  ["Boceto", "excalidraw", EXCALIDRAW],
];

const buscar = async (q, exacto = false, campo = "ambos") =>
  (await api(`/vaults/${v}/buscar?q=${encodeURIComponent(q)}&exacto=${exacto}&campo=${campo}`, { token })).resultados;
const titulos = async (q, exacto = false, campo) => (await buscar(q, exacto, campo)).map((r) => r.titulo).sort();
const orden = async (q, exacto = false, campo) => (await buscar(q, exacto, campo)).map((r) => r.titulo);
const frag = async (q, titulo, campo) => (await buscar(q, false, campo)).find((r) => r.titulo === titulo)?.fragmento;

if (modo === "crear") {
  for (const [titulo, tipo, contenido] of NOTAS) {
    const n = await api(`/vaults/${v}/notas`, { method: "POST", token, body: { titulo, tipo } });
    await api(`/notas/${n.id}/contenido`, { method: "PUT", token, body: { contenido } });
  }
  console.log(`creadas ${NOTAS.length} notas`);
}

if (modo === "mostrar" || modo === "crear") {
  for (const q of ["familia:solanaceas", 'bancal:"Bancal 1"', "bancal:Bancal", "tomate", "tag:solanaceas", "cucurbitaceas", "pulgon"]) {
    const r = await buscar(q);
    console.log(`\n# ${q}`);
    for (const x of r) console.log(`  ${x.titulo} — ${JSON.stringify(x.fragmento)}`);
  }
}

let fallos = 0;
async function caso(nombre, fn) {
  try {
    await fn();
    console.log(`ok   ${nombre}`);
  } catch (e) {
    fallos++;
    console.log(`FAIL ${nombre}\n     ${e.message.split("\n").join("\n     ")}`);
  }
}

if (modo === "verificar") {
  // DEF-144
  await caso("clave:valor sin tilde encuentra el valor con tilde (DEF-144)", async () => {
    assert.deepEqual(await titulos("familia:solanaceas"), ["Ají", "Papa", "Tomate"]);
    assert.deepEqual(await titulos("familia:solanáceas"), ["Ají", "Papa", "Tomate"]);
    assert.deepEqual(await titulos("familia:SOLANACEAS"), ["Ají", "Papa", "Tomate"]);
    assert.deepEqual(await titulos("familia:cucurbitaceas"), ["Zapallo"]);
    assert.deepEqual(await titulos("FAMÍLIA:solanaceas"), ["Ají", "Papa", "Tomate"]);
  });
  // DEF-145
  await caso("sin comillas: principio de una palabra del valor (DEF-145)", async () => {
    assert.deepEqual(await titulos("familia:solan"), ["Ají", "Papa", "Tomate"]);
    assert.deepEqual(await titulos("familia:solan", true), []);
    assert.deepEqual(await titulos("familia:solanaceas", true), ["Ají", "Papa", "Tomate"]);
    assert.deepEqual(await titulos("familia:anaceas"), []);
    assert.deepEqual(await titulos("bancal:Bancal"), ["Ají", "Caléndula", "Lechuga", "Tomate", "Zapallo"]);
    assert.deepEqual(await titulos("bancal:1"), ["Ají", "Caléndula", "Lechuga", "Tomate"]);
    assert.deepEqual(await titulos("bancal:1", true), ["Ají", "Caléndula", "Tomate"]);
    assert.deepEqual(await titulos("estado:crec"), ["Tomate"]);
    assert.deepEqual(await titulos("estado:activo"), ["Caléndula", "Lechuga"]);
    assert.deepEqual(await titulos("luz:sombra"), ["Tomate"]);
    assert.deepEqual(await titulos("avance:50%"), ["Porcentaje"]);
    assert.deepEqual(await titulos("avance:5%"), []);
    assert.deepEqual(await titulos("codigo:a_b"), ["Porcentaje"]);
  });
  await caso('clave:"valor con espacios" es el valor entero (DEF-145)', async () => {
    assert.deepEqual(await titulos('bancal:"Bancal 1"'), ["Ají", "Caléndula", "Tomate"]);
    assert.deepEqual(await titulos('bancal:"bancal 10"'), ["Lechuga"]);
    assert.deepEqual(await titulos('bancal:"Bancal"'), []);
    assert.deepEqual(await titulos('bancal:"Bancal 1" pulgon'), ["Caléndula", "Tomate"]);
    const r = await buscar('bancal:"Bancal 1"');
    assert.ok(r.every((x) => /^bancal: «[Bb]ancal 1»$/.test(x.fragmento)), JSON.stringify(r));
  });
  await caso("las listas se filtran elemento a elemento", async () => {
    assert.deepEqual(await titulos("tags:picante"), ["Ají"]);
    assert.deepEqual(await titulos('tags:"huerta"'), ["Ají"]);
    const r = await buscar("tags:HUERTA");
    assert.deepEqual(r.map((x) => [x.titulo, x.fragmento]), [["Ají", "tags: «huerta»"]]);
  });
  await caso("filtro + texto ignoran tildes", async () => {
    assert.deepEqual(await titulos("familia:solanaceas pulgon"), ["Tomate"]);
    assert.deepEqual(await titulos("Familia:Solanáceas picante"), ["Ají"]);
  });
  // DEF-152
  await caso("tag:x trae solo las notas con la etiqueta (DEF-152)", async () => {
    assert.deepEqual(await titulos("tag:solanaceas"), ["Ají"]);
    assert.deepEqual(await titulos("tag:SOLANÁCEAS"), ["Ají"]);
    assert.deepEqual(await titulos("tag:picante"), ["Ají"]);
    assert.deepEqual(await titulos("tag:Plaga"), ["Pulgón"]);
    assert.ok(!(await titulos("tag:huerta")).includes("Código"));
    assert.ok(!(await titulos("tag:huerta")).includes("Tomate"));
    assert.deepEqual(await titulos("tag:cosecha"), ["Hash"]);
    assert.deepEqual(await titulos("tag:#cosecha"), ["Hash"]);
  });
  await caso("tag:x trae las anidadas, no por prefijo de palabra", async () => {
    assert.deepEqual(await titulos("tag:huerta"), ["Ají", "Riego", "Riego goteo"]);
    assert.deepEqual(await titulos("tag:huerta/riego"), ["Riego", "Riego goteo"]);
    assert.deepEqual(await titulos("tag:Huerta/Riego/goteo"), ["Riego goteo"]);
    assert.deepEqual(await titulos("tag:huert"), []);
    assert.deepEqual(await titulos("tag:huertas"), ["Huertas"]);
    assert.deepEqual(await titulos("tag:huerta-urbana"), ["Huertas"]);
    assert.deepEqual(await titulos("tag:huerta", true), ["Ají", "Riego", "Riego goteo"]);
  });
  await caso("tag: con texto, clave:valor y otra etiqueta es AND", async () => {
    assert.deepEqual(await titulos("tag:huerta goteo"), ["Riego goteo"]);
    assert.deepEqual(await titulos("tag:huerta picante"), ["Ají"]);
    assert.deepEqual(await titulos("tags:picante tag:huerta"), ["Ají"]);
    assert.deepEqual(await titulos("familia:solanaceas tag:huerta"), ["Ají"]);
    assert.deepEqual(await titulos("estado:creciendo tag:huerta"), []);
    assert.deepEqual(await titulos("tag:huerta tag:picante"), ["Ají"]);
    assert.deepEqual(await titulos("tag:huerta tag:huertas"), []);
  });
  await caso("fragmento de tag: a secas", async () => {
    assert.equal(await frag("tag:picante", "Ají"), "tags: «Picante»");
    assert.match(await frag("tag:solanaceas", "Ají"), /#«Solanáceas»/);
    assert.equal(await frag("tag:huerta", "Ají"), "tags: «huerta»");
    assert.match(await frag("tag:huerta", "Riego"), /#«huerta»\/riego/);
    assert.equal(await frag("tag:cosecha", "Hash"), "tags: «cosecha»");
  });
  // DEF-146
  await caso("el título idéntico sale primero (DEF-146)", async () => {
    for (const q of ["tomate", "Tomate", "TOMATE", "tomaté"]) assert.equal((await orden(q))[0], "Tomate", q);
    assert.equal((await orden("tomate", true))[0], "Tomate");
    assert.equal((await orden("tomate", false, "nombre"))[0], "Tomate");
    const r = await orden("tomate");
    assert.deepEqual(r.slice(0, 4), ["Tomate", "Tomates cherry", "Tómate un respiro", "Riego del tomate"]);
    assert.deepEqual((await orden("tomate", true)).slice(0, 3), ["Tomate", "Tómate un respiro", "Riego del tomate"]);
    assert.equal((await orden("riego del tomate"))[0], "Riego del tomate");
    assert.equal((await orden('"riego del"'))[0], "Riego del tomate");
    assert.equal((await orden("tomate -"))[0], "Tomate");
    assert.ok(Array.isArray(await orden("tag:tomate")));
  });
  // DEF-148
  await caso("propiedad: «clave: valor», no el frontmatter aplastado (DEF-148)", async () => {
    assert.equal(await frag("cucurbitaceas", "Zapallo"), "familia: «cucurbitáceas»");
    assert.equal(await frag("planif", "Zapallo"), "estado: «planificado»");
    assert.equal(await frag("verano", "Zapallo"), "tags: «verano»");
    assert.equal(await frag("cucurbitaceas", "Zapallo", "contenido"), "familia: «cucurbitáceas»");
    assert.match(await frag("rastrero", "Zapallo"), /^«Rastrero»\. Se siembra/);
  });
  await caso("enlaces y markdown legibles", async () => {
    const f = await frag("repele", "Caléndula");
    assert.ok(!/\[\[|\]\]|\*\*|##/.test(f), f);
    assert.match(f, /«Repele» a los pulgones de las plantas vecinas\. #cultivo/);
    const t = await frag("albahaca", "Tomate");
    assert.ok(!/\[\[|\]\]|---|\[ \]/.test(t), t);
    assert.match(t, /Tomate · «Albahaca»/);
    assert.match(t, /Probar Ají con cebolla/);
  });
  await caso("el destino de un enlace con alias se sigue encontrando", async () => {
    assert.ok((await titulos("pulgon")).includes("Caléndula"));
    assert.ok((await titulos("pulgon")).includes("Pulgón"));
    assert.match(await frag("pulgon", "Caléndula"), /«pulgones»/);
    const exacta = (await buscar("pulgón", true)).find((r) => r.titulo === "Caléndula");
    assert.ok(exacta, "con búsqueda exacta");
    assert.ok((await titulos("pulgon", false, "contenido")).includes("Caléndula"));
  });
  await caso("canvas por el texto de sus tarjetas", async () => {
    const f = await frag("intercalada", "Tablero");
    assert.ok(!/\\n|\[\[|"text"|\*\*/.test(f), f);
    assert.match(f, /Albahaca «intercalada»/);
    assert.ok((await titulos("zanahoria")).includes("Tablero"));
    assert.ok((await titulos("cultivos")).includes("Tablero"));
    assert.ok((await titulos("rota")).includes("Tablero"));
    assert.ok(!(await titulos("width")).includes("Tablero"));
  });
  await caso("excalidraw por sus textos, sin JSON ni base64", async () => {
    assert.ok((await titulos("compostera")).includes("Boceto"));
    assert.equal(await frag("compostera", "Boceto"), "«Compostera»");
    assert.ok(!(await titulos("width")).includes("Boceto"));
    assert.ok(!(await titulos("borrado")).includes("Boceto"));
    assert.ok(!(await titulos("dataurl")).includes("Boceto"));
  });
  console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} caso(s) fallaron`);
  process.exitCode = fallos === 0 ? 0 : 1;
}

if (modo === "renombrar") {
  // Renombrar actualiza el título de la fila de búsqueda (DEF-146) y duplicar
  // indexa la copia (DEF-148).
  const tree = await api(`/vaults/${v}/tree`, { token });
  const notas = tree.notas ?? tree.Notas;
  const pulgon = notas.find((n) => n.titulo === "Pulgón");
  await api(`/notas/${pulgon.id}`, { method: "PATCH", token, body: { titulo: "Pulgón verde" } });
  await caso("renombrar actualiza el título buscable", async () => {
    assert.equal((await orden("pulgon verde"))[0], "Pulgón verde");
    assert.ok((await titulos("verde", false, "nombre")).includes("Pulgón verde"));
  });
  const zapallo = notas.find((n) => n.titulo === "Zapallo");
  const copia = await api(`/notas/${zapallo.id}/duplicar`, { method: "POST", token });
  await caso("duplicar indexa la copia", async () => {
    assert.ok((await titulos("rastrero")).includes(copia.titulo), JSON.stringify(await titulos("rastrero")));
    assert.ok((await titulos("familia:cucurbitaceas")).includes(copia.titulo));
  });
  await api(`/notas/${pulgon.id}`, { method: "PATCH", token, body: { titulo: "Pulgón" } });
  process.exitCode = fallos === 0 ? 0 : 1;
}
