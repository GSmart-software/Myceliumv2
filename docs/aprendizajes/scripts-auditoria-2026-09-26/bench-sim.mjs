// Réplica fiel de simulate() de MiniGraph.tsx para medir el costo por frame.
function makeGraph(N, avgDeg) {
  const sim = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, r = 50 + Math.random() * 90;
    sim.push({ id: String(i), x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, r: 6 });
  }
  const edges = [];
  for (let i = 0; i < N * avgDeg; i++) {
    const s = sim[Math.floor(Math.random() * N)], t = sim[Math.floor(Math.random() * N)];
    if (s !== t) edges.push({ s, t });
  }
  return { sim, edges };
}
function simulate(sim, simEdges, alpha) {
  const active = sim, k = 80;
  for (let i = 0; i < active.length; i++) {
    const a = active[i];
    for (let j = i + 1; j < active.length; j++) {
      const b = active[j];
      let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
      const d = Math.sqrt(d2);
      const f = Math.min((k * k) / d2, 8) * alpha;
      a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    }
  }
  for (const e of simEdges) {
    const dx = e.t.x - e.s.x, dy = e.t.y - e.s.y;
    const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const f = ((d - k) / d) * 0.02 * alpha * 10;
    e.s.vx += dx * f * 0.05; e.s.vy += dy * f * 0.05; e.t.vx -= dx * f * 0.05; e.t.vy -= dy * f * 0.05;
  }
  for (const n of active) {
    n.vx -= n.x * 0.004 * alpha; n.vy -= n.y * 0.004 * alpha;
    n.vx *= 0.85; n.vy *= 0.85; n.x += n.vx; n.y += n.vy;
  }
}
for (const N of [350, 1000, 2000, 4000]) {
  const { sim, edges } = makeGraph(N, 3);
  for (let i = 0; i < 20; i++) simulate(sim, edges, 1); // warm-up
  const t0 = performance.now();
  const F = 60;
  for (let i = 0; i < F; i++) simulate(sim, edges, 0.5);
  const ms = (performance.now() - t0) / F;
  // frames hasta asentarse: alpha 1 -> 0.03 con *0.995
  const frames = Math.ceil(Math.log(0.03) / Math.log(0.995));
  console.log(`N=${N} aristas=${edges.length}: ${ms.toFixed(2)} ms/frame de simulate → ${(1000/ms).toFixed(0)} fps máx; asentarse = ${frames} frames ≈ ${(frames*Math.max(ms,16.7)/1000).toFixed(1)} s`);
}
