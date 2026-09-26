// Prototipo Barnes-Hut (quadtree) contra la repulsión de pares de MiniGraph, para
// cuantificar la ganancia a igual N. theta=0.9 como d3-force.
function makeGraph(N) {
  const sim = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, r = 50 + Math.random() * 900;
    sim.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0 });
  }
  return sim;
}
const k = 80;
function pares(sim, alpha) {
  for (let i = 0; i < sim.length; i++) {
    const a = sim[i];
    for (let j = i + 1; j < sim.length; j++) {
      const b = sim[j];
      let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < 1) { dx = 0.5; dy = 0.5; d2 = 1; }
      const d = Math.sqrt(d2);
      const f = Math.min((k * k) / d2, 8) * alpha;
      a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    }
  }
}
// Quadtree plano en arrays tipados (sin objetos por nodo): estilo d3-quadtree pero
// con centro de masa acumulado.
function barnesHut(sim, alpha, theta = 0.9) {
  const N = sim.length;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of sim) { if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x; if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y; }
  const size = Math.max(maxX - minX, maxY - minY) + 1;
  // arrays: child[4*i+q], mass, cx, cy, leafIdx (-1 = interno, -2 = vacío)
  const CAP = N * 4 + 16;
  const child = new Int32Array(CAP * 4).fill(-1);
  const mass = new Float64Array(CAP), cx = new Float64Array(CAP), cy = new Float64Array(CAP);
  const leaf = new Int32Array(CAP).fill(-2);
  const half = new Float64Array(CAP), ox = new Float64Array(CAP), oy = new Float64Array(CAP);
  let count = 1; half[0] = size / 2; ox[0] = minX + size / 2; oy[0] = minY + size / 2;
  const insert = (i) => {
    let node = 0;
    const x = sim[i].x, y = sim[i].y;
    for (let depth = 0; depth < 40; depth++) {
      mass[node]++; cx[node] += x; cy[node] += y;
      const q = (x >= ox[node] ? 1 : 0) + (y >= oy[node] ? 2 : 0);
      let c = child[node * 4 + q];
      if (c === -1) {
        c = count++; child[node * 4 + q] = c;
        half[c] = half[node] / 2; ox[c] = ox[node] + (q & 1 ? half[c] : -half[c]); oy[c] = oy[node] + (q & 2 ? half[c] : -half[c]);
        leaf[c] = i; mass[c] = 1; cx[c] = x; cy[c] = y; return;
      }
      if (leaf[c] >= 0) {
        const other = leaf[c];
        if (sim[other].x === x && sim[other].y === y) { mass[c]++; cx[c] += x; cy[c] += y; return; }
        leaf[c] = -1; // se vuelve interno: reinsertar al que estaba
        mass[c] = 0; cx[c] = 0; cy[c] = 0;
        // reinsertar other bajo c
        let n2 = c; const x2 = sim[other].x, y2 = sim[other].y;
        mass[n2]++; cx[n2] += x2; cy[n2] += y2;
        const q2 = (x2 >= ox[n2] ? 1 : 0) + (y2 >= oy[n2] ? 2 : 0);
        const c2 = count++; child[n2 * 4 + q2] = c2;
        half[c2] = half[n2] / 2; ox[c2] = ox[n2] + (q2 & 1 ? half[c2] : -half[c2]); oy[c2] = oy[n2] + (q2 & 2 ? half[c2] : -half[c2]);
        leaf[c2] = other; mass[c2] = 1; cx[c2] = x2; cy[c2] = y2;
      }
      node = c;
    }
  };
  for (let i = 0; i < N; i++) insert(i);
  const stack = new Int32Array(256);
  for (let i = 0; i < N; i++) {
    const a = sim[i];
    let sp = 0; stack[sp++] = 0;
    while (sp > 0) {
      const node = stack[--sp];
      const m = mass[node]; if (m === 0) continue;
      const mx = cx[node] / m, my = cy[node] / m;
      let dx = a.x - mx, dy = a.y - my, d2 = dx * dx + dy * dy;
      const w = half[node] * 2;
      if (leaf[node] >= 0 || w * w < theta * theta * d2) {
        if (leaf[node] === i) continue;
        if (d2 < 1) { dx = 0.5; dy = 0.5; d2 = 1; }
        const d = Math.sqrt(d2);
        const f = Math.min((k * k) / d2, 8) * alpha * m;
        a.vx += (dx / d) * f; a.vy += (dy / d) * f;
      } else {
        for (let q = 0; q < 4; q++) { const c = child[node * 4 + q]; if (c !== -1) stack[sp++] = c; }
      }
    }
  }
}
for (const N of [1000, 2000, 4000, 8000]) {
  const A = makeGraph(N), B = A.map(n => ({ ...n }));
  const bench = (fn, sim) => { for (let i = 0; i < 5; i++) fn(sim, 0.5); const t0 = performance.now(); for (let i = 0; i < 20; i++) fn(sim, 0.5); return (performance.now() - t0) / 20; };
  const tp = N <= 4000 ? bench(pares, A) : NaN;
  const tb = bench(barnesHut, B);
  console.log(`N=${N}: pares ${isNaN(tp) ? "—" : tp.toFixed(1)} ms · Barnes-Hut ${tb.toFixed(1)} ms` + (isNaN(tp) ? "" : ` → ×${(tp / tb).toFixed(1)}`));
}
