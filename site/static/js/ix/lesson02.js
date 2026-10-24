/* Lesson 2: Dot Products and Projection. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const norm = v => Math.sqrt(dot(v, v));
  const vec = (v, d = 2) => "(" + v.map(x => fmt(x, d)).join(", ") + ")";
  const deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;
  const angleOf = (u, v) => deg(Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (norm(u) * norm(v))))));
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson02/data.json").then(r => r.json()));
  function rng(seed) {                       // small seeded generator, so every visitor sees the same simulated trials
    let a = seed >>> 0;
    const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    return () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
  }
  function svgBox(host, W, H, title) {
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ix-svg", role: "img" }, host);
    if (title) el("title", {}, svg).textContent = title;
    return svg;
  }
  function txt(parent, s, x, y, a = {}) {
    const t = el("text", { x, y, "text-anchor": a.anchor || "start", "font-size": a.size || 13, fill: a.color || C.ink, "font-weight": a.weight || 400, "font-family": "inherit" }, parent);
    t.textContent = s;
    return t;
  }

  /* 1. A neuron's total input: one bar per contribution w_i x_i, and their sum. */
  IX.register("contributions", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const W = 500, H = 340, P = 46;
    const svg = svgBox(left, W, H, "Contributions of four inputs to the dot product");
    const g = el("g", {}, svg);
    const ex = { w: [0.8, -0.5, 0.3, 0], x: [20, 10, 5, 15] };
    let w = ex.w.slice(), x = ex.x.slice();
    h("p", { class: "ix-panel-title" }, side, "Weights");
    const ws = w.map((v, i) => slider(side, { label: `w<sub>${i + 1}</sub>`, min: -1, max: 1, step: 0.1, value: v, onInput: a => { w[i] = a; draw(); } }));
    h("p", { class: "ix-panel-title" }, side, "Input rates (spikes/s)");
    const xs = x.map((v, i) => slider(side, { label: `x<sub>${i + 1}</sub>`, min: 0, max: 30, step: 1, value: v, onInput: a => { x[i] = a; draw(); } }));
    buttons(side, ["Back to the worked example"], () => { w = ex.w.slice(); x = ex.x.slice(); ws.forEach((s, i) => s.set(w[i])); xs.forEach((s, i) => s.set(x[i])); draw(); });
    const out = readout(side);
    function draw() {
      while (g.firstChild) g.removeChild(g.firstChild);
      const c = w.map((wi, i) => wi * x[i]), z = c.reduce((a, b) => a + b, 0);
      const lim = 30, y0 = H / 2, sc = (H / 2 - P) / lim, bw = (W - 2 * P) / 4;
      const Y = v => y0 - Math.max(-lim, Math.min(lim, v)) * sc;
      el("line", { x1: P, x2: W - P / 2, y1: y0, y2: y0, stroke: C.axis, "stroke-width": 1.3 }, g);
      el("line", { x1: P, x2: P, y1: P / 2, y2: H - P / 2, stroke: C.axis, "stroke-width": 1.3 }, g);
      [-30, -15, 15, 30].forEach(v => txt(g, String(v), P - 6, Y(v) + 4, { anchor: "end", color: C.muted }));
      const yl = txt(g, "contribution w·x (spikes/s)", 14, H / 2, { anchor: "middle", color: C.muted }); yl.setAttribute("transform", `rotate(-90 14 ${H / 2})`);
      c.forEach((v, i) => {
        const x0 = P + i * bw + bw * 0.2, bwid = bw * 0.6;
        el("rect", { x: x0, y: Math.min(Y(v), y0), width: bwid, height: Math.max(0.8, Math.abs(Y(v) - y0)), rx: 3, fill: v >= 0 ? C.blue : C.vermilion }, g);
        txt(g, fmt(v, 1), x0 + bwid / 2, v >= 0 ? Y(v) - 6 : Y(v) + 16, { anchor: "middle", weight: 600 });
        txt(g, `input ${i + 1}`, x0 + bwid / 2, v >= 0 ? y0 + 18 : y0 - 8, { anchor: "middle", color: C.muted });
      });
      el("line", { x1: P, x2: W - P / 2, y1: Y(z), y2: Y(z), stroke: C.green, "stroke-width": 2.5, "stroke-dasharray": "7 5" }, g);
      txt(g, `total z = ${fmt(z, 1)}`, W - P / 2, Y(z) + (z >= 0 ? -8 : 18), { anchor: "end", color: "#007a58", weight: 700 });
      out.innerHTML = `<p>z = ${c.map((v, i) => `<span class="${v >= 0 ? "k-blue" : "k-verm"}">(${fmt(w[i], 1)})(${x[i]})</span>`).join(" + ")}</p>
        <p class="big">= <span class="k-green">${fmt(z, 1)} spikes/s</span></p>
        <p>${x.some((xi, i) => xi > 0 && w[i] === 0) ? "An active input with weight 0 contributes nothing. " : ""}${c.some(v => v < 0) ? "Negative weights turn activity into a negative contribution." : "Every contribution is positive or zero here."}</p>`;
    }
    draw();
  });

  /* 2. The dot product two ways: sum of products and lengths times cosine. */
  IX.register("dot-angle", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-5, 5], y: [-5, 5], labels: ["x₁", "x₂"], width: 480, height: 460, title: "The angle between u and v" });
    const side = h("div", {}, L);
    let u = [3, 1], v = [1, 3], tri = false;
    const rot = slider(side, { label: "Direction of v", min: 0, max: 360, step: 3, value: Math.round(deg(Math.atan2(v[1], v[0]))), format: a => a + "°",
      onInput: a => { const n = norm(v); v = [n * Math.cos(rad(a)), n * Math.sin(rad(a))]; hv.set(v, true); draw(); } });
    player(side, rot, { interval: 70 });
    buttons(side, [{ label: "Off" }, { label: "On" }], (it, i) => { tri = i === 1; draw(); }, { toggle: true, label: "Triangle" });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag the tips of u and v, or use the arrow keys after clicking a tip.");
    function draw() {
      P.clear();
      const nu = norm(u), nv = norm(v), d = dot(u, v), th = angleOf(u, v);
      if (nu > 0.2 && nv > 0.2) {                                 // the angle arc
        const a0 = Math.atan2(u[1], u[0]); let a1 = Math.atan2(v[1], v[0]); let da = a1 - a0;
        while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        const r = Math.min(1.1, nu, nv) * 0.8, pts = [];
        for (let k = 0; k <= 30; k++) { const a = a0 + da * k / 30; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
        P.path([[0, 0], ...pts, [0, 0]], { color: C.purple, width: 1.5, fill: C.purple, fillOpacity: 0.15 });
        const am = a0 + da / 2; P.text(`θ = ${fmt(th, 0)}°`, (r + 0.75) * Math.cos(am), (r + 0.75) * Math.sin(am), { anchor: "middle", dy: 4, color: "#a8558a", weight: 700, halo: true });
        if (Math.abs(th - 90) < 1.5) { const e1 = [u[0] / nu * 0.45, u[1] / nu * 0.45], e2 = [v[0] / nv * 0.45, v[1] / nv * 0.45]; P.path([e1, [e1[0] + e2[0], e1[1] + e2[1]], e2], { color: C.ink, width: 1.3 }); }
      }
      if (tri) P.arrow(v, u, { color: C.ink, width: 2, dash: "6 5", label: "u − v", ldx: 6, ldy: 16 });
      P.arrow([0, 0], u, { color: C.blue, width: 3.5, label: "u", ldx: 6, ldy: 16 });
      P.arrow([0, 0], v, { color: C.orange, width: 3.5, label: "v", ldx: -18, ldy: -4 });
      const sign = Math.abs(d) < 0.05 ? "zero: a right angle" : d > 0 ? "positive: an acute angle, pointing broadly the same way" : "negative: an obtuse angle, pointing broadly opposite ways";
      out.innerHTML = `<table>
        <tr><td>Sum of products</td><td>(${fmt(u[0], 1)})(${fmt(v[0], 1)}) + (${fmt(u[1], 1)})(${fmt(v[1], 1)}) = <b>${fmt(d, 2)}</b></td></tr>
        <tr><td>Lengths × cosine</td><td>${fmt(nu, 2)} × ${fmt(nv, 2)} × cos ${fmt(th, 0)}° = <b>${fmt(nu * nv * Math.cos(rad(th)), 2)}</b></td></tr>
        <tr><td>Sign</td><td>${sign}</td></tr></table>
        ${tri ? `<p>‖u − v‖² = ${fmt(dot([u[0] - v[0], u[1] - v[1]], [u[0] - v[0], u[1] - v[1]]), 2)} = ‖u‖² + ‖v‖² − 2 u·v = ${fmt(nu * nu, 2)} + ${fmt(nv * nv, 2)} − ${fmt(2 * d, 2)}</p>` : ""}`;
    }
    const hu = P.handle(u, { color: C.blue, name: "tip of u", snap: 0.5, onMove: p => { u = p; draw(); } });
    const hv = P.handle(v, { color: C.orange, name: "tip of v", snap: 0.5, onMove: p => { v = p; rot.set(((Math.round(deg(Math.atan2(v[1], v[0]))) % 360) + 360) % 360); draw(); } });
    draw();
  });

  /* 3. Strength versus pattern: rescale r_B and track three comparisons with r_A. */
  IX.register("strength-pattern", root => {
    const rA = [10, 30, 20], rB = [30, 10, 20];
    const meas = [
      { name: "Dot product", html: "Dot product r<sub>A</sub> · s r<sub>B</sub>", f: s => s * dot(rA, rB), y: [0, 3200], tick: 1000, color: C.blue, cls: "k-blue", unit: "(spikes/s)²" },
      { name: "Cosine similarity", html: "Cosine similarity", f: () => dot(rA, rB) / (norm(rA) * norm(rB)), y: [0, 1], tick: 0.25, color: C.green, cls: "k-green", unit: "" },
      { name: "Distance", html: "Distance ‖r<sub>A</sub> − s r<sub>B</sub>‖", f: s => norm(rA.map((a, i) => a - s * rB[i])), y: [0, 80], tick: 20, color: C.vermilion, cls: "k-verm", unit: "spikes/s" }];
    const grid = h("div", { class: "ix-three" }, root);
    const planes = meas.map(m => {
      const box = h("div", {}, grid);
      h("p", { class: "ix-panel-title" }, box).innerHTML = m.html;
      return Plane(box, { x: [0, 3.2], y: m.y, xtick: 1, ytick: m.tick, labels: ["scale factor s", ""], width: 330, height: 250, pad: 44, title: m.name });
    });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let s = 1;
    const sl = slider(ctl, { label: "Scale factor s", min: 0.2, max: 3, step: 0.05, value: 1, format: v => fmt(v, 2) + " ×", onInput: v => { s = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 60 });
    const out = readout(root);
    function draw() {
      meas.forEach((m, k) => {
        const P = planes[k]; P.clear();
        const pts = []; for (let t = 0.2; t <= 3.0001; t += 0.05) pts.push([t, m.f(t)]);
        P.path(pts, { color: m.color, width: 2.5 });
        P.line([s, m.y[0]], [s, m.f(s)], { dash: "3 4", color: C.muted });
        P.dot([s, m.f(s)], { color: m.color, r: 6 });
      });
      const sb = rB.map(x => +(s * x).toFixed(1));
      out.innerHTML = `<p>s r<sub>B</sub> = ${vec(sb, 1)} spikes/s. &nbsp; <span class="k-blue">dot product ${fmt(meas[0].f(s), 0)}</span> · <span class="k-green">cosine similarity ${fmt(meas[1].f(s), 3)}</span> · <span class="k-verm">distance ${fmt(meas[2].f(s), 1)} spikes/s</span></p>
        <p>Only the cosine similarity ignores how strongly the population fires. It compares the pattern alone.</p>`;
    }
    draw();
  });

  /* 4. A similarity matrix of five population responses, raw or mean-centred. */
  IX.register("similarity-matrix", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const names = ["Grating 0°", "Grating 0° (high contrast)", "Grating 45°", "Grating 90°", "Blank screen"];
    const short = ["0°", "0° high", "45°", "90°", "Blank"];
    let R = null, centred = false, pick = [0, 4];
    const W = 470, H = 440, P0 = 92, cell = (W - P0 - 14) / 5;
    const svg = svgBox(left, W, H, "Cosine similarity matrix");
    const g = el("g", {}, svg);
    buttons(side, [{ label: "Raw rates" }, { label: "Mean-centred" }], (it, i) => { centred = i === 1; draw(); }, { toggle: true, label: "Compare" });
    const out = readout(side);
    const barsBox = h("div", {}, side);
    function prep(r) { if (!centred) return r; const m = r.reduce((a, b) => a + b, 0) / r.length; return r.map(x => x - m); }
    function cs(a, b) { return dot(a, b) / (norm(a) * norm(b)); }
    function colour(v) {                         // diverging: blue below 0, white at 0, vermilion above
      const t = Math.max(-1, Math.min(1, v)), c0 = [255, 255, 255], c1 = t < 0 ? [0, 114, 178] : [213, 94, 0], k = Math.abs(t);
      return `rgb(${c0.map((x, i) => Math.round(x + (c1[i] - x) * k)).join(",")})`;
    }
    function draw() {
      if (!R) return;
      while (g.firstChild) g.removeChild(g.firstChild);
      const V = R.map(prep);
      for (let i = 0; i < 5; i++) {
        txt(g, short[i], P0 - 8, 20 + i * cell + cell / 2 + 4, { anchor: "end", color: C.ink });
        const t = txt(g, short[i], P0 + i * cell + cell / 2, 20 + 5 * cell + 18, { anchor: "middle", color: C.ink });
        for (let j = 0; j < 5; j++) {
          const v = cs(V[i], V[j]);
          const r = el("rect", { x: P0 + j * cell, y: 20 + i * cell, width: cell - 2, height: cell - 2, rx: 3, fill: colour(v), class: "ix-cell", tabindex: 0, role: "button", "aria-label": `${names[i]} and ${names[j]}: ${fmt(v, 2)}` }, g);
          if ((pick[0] === i && pick[1] === j) || (pick[0] === j && pick[1] === i)) { r.setAttribute("stroke", C.ink); r.setAttribute("stroke-width", 3); }
          txt(g, fmt(v, 2), P0 + j * cell + cell / 2 - 1, 20 + i * cell + cell / 2 + 5, { anchor: "middle", weight: 600, color: Math.abs(v) > 0.6 ? "#fff" : C.ink });
          const go = () => { pick = [i, j]; draw(); };
          r.addEventListener("click", go); r.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
        }
      }
      const [i, j] = pick, a = V[i], b = V[j], v = cs(a, b);
      out.innerHTML = `<p><b>${names[i]}</b> and <b>${names[j]}</b>: cosine similarity <b>${fmt(v, 2)}</b>${centred ? " (this is their Pearson correlation)" : ""}.</p>
        <p>${centred ? "Each response has had its own mean across the four neurons subtracted, so a flat response no longer shares a positive level with the others." : "Raw firing rates are never negative, so no two responses can be more than 90° apart: every similarity is 0 or more."}</p>`;
      barsBox.innerHTML = "";
      const lim = centred ? 40 : 75, BW = 300, BH = 170, y0 = centred ? BH / 2 : BH - 26, sc = (centred ? BH / 2 - 18 : BH - 46) / lim;
      const bsvg = svgBox(barsBox, BW, BH + 22, "The two responses neuron by neuron");
      el("line", { x1: 26, x2: BW - 6, y1: y0, y2: y0, stroke: C.axis }, bsvg);
      for (let n = 0; n < 4; n++) {
        const x0 = 34 + n * 66;
        [[a[n], C.green], [b[n], C.purple]].forEach(([val, col], k) => {
          const hh = Math.abs(val) * sc;
          el("rect", { x: x0 + k * 26, y: val >= 0 ? y0 - hh : y0, width: 22, height: Math.max(0.8, hh), rx: 2, fill: col }, bsvg);
        });
        txt(bsvg, `N${n + 1}`, x0 + 24, BH + 14, { anchor: "middle", color: C.muted });
      }
      txt(bsvg, `${short[i]}`, 30, 14, { color: "#007a58", weight: 700 });
      txt(bsvg, `${short[j]}`, 120, 14, { color: "#a8558a", weight: 700 });
      txt(bsvg, centred ? "spikes/s from own mean" : "spikes/s", BW - 6, 14, { anchor: "end", color: C.muted });
    }
    data().then(d => { R = d.sim.responses; draw(); });
  });

  /* 5. Projection onto a line, the residual, and the closest point. */
  IX.register("projection", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-1, 6], y: [-1, 5.5], labels: ["x₁", "x₂"], width: 480, height: 420, title: "Projection of u onto the line through v" });
    const side = h("div", {}, L);
    let u = [3, 4], v = [2, 0.5], s = 0.5;
    const ss = slider(side, { label: "Position s", min: -0.5, max: 3, step: 0.02, value: s, format: x => fmt(x, 2), onInput: x => { s = x; draw(); } });
    player(side, ss, { bounce: true, interval: 40 });
    buttons(side, ["Jump to the projection"], () => { const t = dot(u, v) / dot(v, v); s = Math.max(-0.5, Math.min(3, t)); ss.set(s); draw(); });
    const out = readout(side);
    h("p", { class: "ix-panel-title" }, side, "Distance from u to the point s v");
    const D = Plane(side, { x: [-0.5, 3], y: [0, 8], xtick: 1, ytick: 2, labels: ["s", ""], width: 320, height: 190, pad: 34, title: "Distance from u to s v" });
    function draw() {
      P.clear(); D.clear();
      const vv = dot(v, v); if (vv < 1e-9) return;
      const t = dot(u, v) / vv, p = [t * v[0], t * v[1]], e = [u[0] - p[0], u[1] - p[1]], q = [s * v[0], s * v[1]];
      const nv = Math.sqrt(vv), dir = [v[0] / nv, v[1] / nv];
      P.line([-20 * dir[0], -20 * dir[1]], [20 * dir[0], 20 * dir[1]], { color: C.axis, dash: "2 5" });
      P.line(u, q, { color: C.purple, width: 2, dash: "2 4" });
      P.arrow([0, 0], p, { color: C.green, width: 4 });
      P.text("proj", p[0], p[1], { dx: 6, dy: 20, color: "#007a58", weight: 600, size: 15, halo: true });
      P.line(p, u, { color: C.ink, width: 2.5, dash: "6 4" });
      const ne = norm(e);
      if (ne > 0.35) {                                            // right-angle mark where the residual meets the line
        const a = [-dir[0] * 0.25, -dir[1] * 0.25], b = [e[0] / ne * 0.25, e[1] / ne * 0.25];
        P.path([[p[0] + a[0], p[1] + a[1]], [p[0] + a[0] + b[0], p[1] + a[1] + b[1]], [p[0] + b[0], p[1] + b[1]]], { color: C.muted, width: 1.3 });
      }
      P.arrow([0, 0], v, { color: C.orange, width: 3.5, label: "v", ldx: 2, ldy: -10 });
      P.arrow([0, 0], u, { color: C.blue, width: 3.5, label: "u", ldx: -20, ldy: 0 });
      P.dot(q, { color: C.purple, r: 6 });
      const dq = norm([u[0] - q[0], u[1] - q[1]]);
      out.innerHTML = `<table>
        <tr><td>t = u·v / v·v</td><td>${fmt(dot(u, v), 2)} / ${fmt(vv, 2)} = <b>${fmt(t, 3)}</b></td></tr>
        <tr><td>Scalar projection</td><td>u·v / ‖v‖ = <b>${fmt(dot(u, v) / nv, 3)}</b></td></tr>
        <tr><td><span class="k-green">Vector projection</span></td><td>t v = ${vec(p, 3)}</td></tr>
        <tr><td><b>Projection error</b> (dashed)</td><td>‖u − proj‖ = <b>${fmt(ne, 3)}</b> (residual · v = ${fmt(dot(e, v), 3)})</td></tr>
        <tr><td><span class="k-purple">Purple point</span></td><td>distance to u = <b>${fmt(dq, 3)}</b> ${Math.abs(s - t) < 0.015 ? "= the projection error: the minimum" : "≥ " + fmt(ne, 3)}</td></tr></table>`;
      const curve = []; for (let k = -0.5; k <= 3.0001; k += 0.02) curve.push([k, Math.min(8, norm([u[0] - k * v[0], u[1] - k * v[1]]))]);
      D.path(curve, { color: C.purple, width: 2.2 });
      if (t >= -0.5 && t <= 3) { D.line([t, 0], [t, ne], { dash: "3 4", color: C.green }); D.dot([t, ne], { color: C.green, r: 5 }); }
      D.dot([s, Math.min(8, dq)], { color: C.purple, r: 5 });
    }
    P.handle(u, { color: C.blue, name: "tip of u", snap: 0.25, onMove: p => { u = p; draw(); } });
    P.handle(v, { color: C.orange, name: "tip of v", snap: 0.25, onMove: p => { v = p; draw(); } });
    draw();
  });

  /* 6. Projecting two conditions' trials onto an axis. */
  IX.register("task-axis", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const P = Plane(left, { x: [0, 50], y: [0, 45], grid: 10, tick: 10, labels: ["N1 (spikes/s)", "N2 (spikes/s)"], width: 480, height: 430, title: "Trials of two stimuli in the state space of two neurons" });
    h("p", { class: "ix-panel-title" }, left, "Coordinate of every trial along the axis (spikes/s, measured from the midpoint)");
    const HB = Plane(left, { x: [-30, 30], y: [0, 20], xtick: 10, ytick: 100, labels: ["coordinate along the axis (spikes/s)", ""], width: 480, height: 230, pad: 40, title: "Histogram of coordinates along the axis" });
    let A = null, B = null, m = [24, 23], best = 0, ang = 0;
    const sl = slider(side, { label: "Axis direction", min: -180, max: 180, step: 2, value: 90, format: a => a + "°", onInput: a => { ang = a; hd.set(endPt(), true); draw(); } });
    player(side, sl, { bounce: true, interval: 60 });
    buttons(side, ["Best axis: mean B → mean A"], () => { ang = Math.round(best); sl.set(ang); hd.set(endPt(), true); draw(); });
    const out = readout(side);
    function clip(c, d, xr, yr) {           // the part of the line c + t d inside the plot
      let t0 = -1e9, t1 = 1e9;
      for (const [k, r] of [[0, xr], [1, yr]]) {
        if (Math.abs(d[k]) < 1e-12) { if (c[k] < r[0] || c[k] > r[1]) return null; continue; }
        const ta = (r[0] - c[k]) / d[k], tb = (r[1] - c[k]) / d[k]; t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb));
      }
      return t0 < t1 ? [[c[0] + t0 * d[0], c[1] + t0 * d[1]], [c[0] + t1 * d[0], c[1] + t1 * d[1]]] : null;
    }
    const endPt = () => [m[0] + 14 * Math.cos(rad(ang)), m[1] + 14 * Math.sin(rad(ang))];
    const hd = P.handle([m[0], m[1] + 14], { color: C.green, name: "end of the axis", snap: 0.5,
      onMove: p => { ang = Math.round(deg(Math.atan2(p[1] - m[1], p[0] - m[0]))); sl.set(ang); hd.set(endPt(), true); draw(); } });
    function draw() {
      if (!A) return;
      P.clear(); HB.clear();
      const a = [Math.cos(rad(ang)), Math.sin(rad(ang))];
      const seg = clip(m, a, [0, 50], [0, 45]); if (seg) P.line(seg[0], seg[1], { color: C.green, width: 2.5 });
      A.forEach(r => P.dot(r, { color: C.blue, r: 4, opacity: 0.85 }));
      B.forEach(r => P.dot(r, { color: C.orange, r: 4, opacity: 0.85 }));
      [A[3], B[5]].forEach(r => {                                  // two trials dropped onto the axis
        const c = dot([r[0] - m[0], r[1] - m[1]], a), q = [m[0] + c * a[0], m[1] + c * a[1]];
        P.line(r, q, { color: C.ink, dash: "3 3", width: 1.3 }); P.dot(q, { color: C.ink, r: 3.5 });
      });
      const cA = A.map(r => dot([r[0] - m[0], r[1] - m[1]], a)), cB = B.map(r => dot([r[0] - m[0], r[1] - m[1]], a));
      const bins = 24, lo = -30, wdt = 60 / bins, hA = Array(bins).fill(0), hB = Array(bins).fill(0);
      cA.forEach(c => { const k = Math.floor((c - lo) / wdt); if (k >= 0 && k < bins) hA[k]++; });
      cB.forEach(c => { const k = Math.floor((c - lo) / wdt); if (k >= 0 && k < bins) hB[k]++; });
      for (let k = 0; k < bins; k++) {
        const x0 = lo + k * wdt;
        if (hA[k]) HB.path([[x0, 0], [x0, hA[k]], [x0 + wdt, hA[k]], [x0 + wdt, 0]], { color: "#fff", width: 0.8, fill: C.blue, close: true });
        if (hB[k]) HB.path([[x0, hA[k]], [x0, hA[k] + hB[k]], [x0 + wdt, hA[k] + hB[k]], [x0 + wdt, hA[k]]], { color: "#fff", width: 0.8, fill: C.orange, close: true });
      }
      HB.line([0, 0], [0, 20], { color: C.ink, dash: "4 4" });
      const mean = x => x.reduce((s, y) => s + y, 0) / x.length, sd = x => { const mu = mean(x); return Math.sqrt(x.reduce((s, y) => s + (y - mu) ** 2, 0) / (x.length - 1)); };
      const sep = Math.abs(mean(cA) - mean(cB)) / Math.sqrt((sd(cA) ** 2 + sd(cB) ** 2) / 2);
      const acc = (cA.filter(c => c > 0).length + cB.filter(c => c <= 0).length) / 80;
      out.innerHTML = `<p>Axis â = ${vec(a, 3)}</p>
        <table><tr><td>Separation</td><td><b>${fmt(sep, 2)}</b> standard deviations between the two clouds' centres along the axis</td></tr>
        <tr><td>Split at the midpoint</td><td><b>${fmt(Math.max(acc, 1 - acc) * 100, 0)}%</b> of trials on the side of their own stimulus</td></tr></table>
        <p>${Math.abs(ang - best) < 4 ? "This is the mean-difference axis: neuron 1 fires more for A, neuron 2 more for B." : "Turn the axis: along some directions the two clouds land on top of each other."}</p>`;
    }
    data().then(d => {
      A = d.task.A; B = d.task.B;
      const mA = [0, 1].map(k => A.reduce((s, r) => s + r[k], 0) / A.length), mB = [0, 1].map(k => B.reduce((s, r) => s + r[k], 0) / B.length);
      m = [(mA[0] + mB[0]) / 2, (mA[1] + mB[1]) / 2];
      best = deg(Math.atan2(mA[1] - mB[1], mA[0] - mB[0]));
      ang = 90; hd.set(endPt(), true); draw();
    });
  });

  /* 7. A dot-product neuron has a cosine tuning curve. */
  IX.register("tuning", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const lb = h("div", {}, grid), rb = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, lb, "Weight vector w and input x");
    const P = Plane(lb, { x: [-3.5, 3.5], y: [-3.5, 3.5], labels: ["input 1", "input 2"], width: 400, height: 400, title: "Weight vector and input" });
    h("p", { class: "ix-panel-title" }, rb, "Tuning curve: z = w · x as the input turns");
    const T = Plane(rb, { x: [0, 360], y: [-8, 8], xtick: 90, ytick: 4, labels: ["", ""], width: 420, height: 330, pad: 44, title: "Tuning curve" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let w = [1.9, 1.6], phi = 0; const R = 2.5;
    const sl = slider(ctl, { label: "Input direction φ", min: 0, max: 360, step: 4, value: 0, format: a => a + "°", onInput: a => { phi = a; draw(); } });
    player(ctl, sl, { interval: 60 });
    const out = readout(root);
    function draw() {
      P.clear(); T.clear();
      const pts = []; for (let a = 0; a <= 360; a += 5) pts.push([R * Math.cos(rad(a)), R * Math.sin(rad(a))]);
      P.path(pts, { color: C.axis, width: 1, dash: "3 4" });
      const x = [R * Math.cos(rad(phi)), R * Math.sin(rad(phi))], z = dot(w, x), pw = (deg(Math.atan2(w[1], w[0])) + 360) % 360;
      P.arrow([0, 0], x, { color: C.blue, width: 3 });
      P.text("x", x[0] * 1.18, x[1] * 1.18, { anchor: "middle", dy: 5, color: C.blue, weight: 700, size: 16, halo: true });
      P.arrow([0, 0], w, { color: C.green, width: 3.5 });
      const nw0 = norm(w) || 1; P.text("w", w[0] + 0.45 * w[0] / nw0, w[1] + 0.45 * w[1] / nw0, { anchor: "middle", dy: 5, color: "#007a58", weight: 700, size: 16, halo: true });
      const curve = []; for (let a = 0; a <= 360; a += 3) curve.push([a, dot(w, [R * Math.cos(rad(a)), R * Math.sin(rad(a))])]);
      T.path(curve, { color: C.purple, width: 1.2, dash: "3 4", opacity: 0.6 });
      const done = curve.filter(p => p[0] <= phi); if (done.length > 1) T.path(done, { color: C.purple, width: 3 });
      T.line([pw, -8], [pw, 8], { color: C.green, dash: "6 4", width: 1.8 });
      T.text("preferred direction", pw, 8, { dx: 6, dy: 14, color: "#007a58", size: 12, halo: true, anchor: pw > 250 ? "end" : "start" });
      T.dot([phi, z], { color: C.purple, r: 6 });
      T.text("input direction φ (degrees)", 180, -8, { anchor: "middle", dy: 32, color: C.muted, size: 14 });
      out.innerHTML = `<p>z = ‖w‖ ‖x‖ cos(φ − φ<sub>w</sub>) = ${fmt(norm(w), 2)} × ${R} × cos(${phi}° − ${fmt(pw, 0)}°) = <b>${fmt(z, 2)}</b></p>
        <p>${Math.abs(((phi - pw + 540) % 360) - 180) < 6 ? "The input points along w: the largest response." : Math.abs(Math.abs(((phi - pw + 540) % 360) - 180) - 90) < 4 ? "The input is orthogonal to w: no response." : z < 0 ? "The input points away from w: a negative response." : "The input leans towards w: a positive response."} Drag the tip of w to move the peak; a longer w makes the curve taller.</p>`;
    }
    P.handle(w, { color: C.green, name: "tip of w", snap: 0.1, onMove: p => { w = p; draw(); } });
    draw();
  });

  /* 8. A linear classifier: w turns the boundary, b slides it. */
  IX.register("classifier", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-3.5, 3.5], y: [-3, 3], labels: ["feature 1", "feature 2"], width: 500, height: 440, title: "A linear classifier" });
    const side = h("div", {}, L);
    const n = rng(7), pts = [];
    for (let k = 0; k < 30; k++) pts.push({ x: [1 + 0.75 * n(), 0.8 + 0.75 * n()], y: 1 });
    for (let k = 0; k < 30; k++) pts.push({ x: [-1 + 0.75 * n(), -0.6 + 0.75 * n()], y: 0 });
    let w = [1, 0.8], b = -0.2, sel = 0;
    const bs = slider(side, { label: "Bias b", min: -4, max: 4, step: 0.1, value: b, onInput: v => { b = v; draw(); } });
    player(side, bs, { bounce: true, interval: 60 });
    buttons(side, ["Reset"], () => { w = [1, 0.8]; b = -0.2; bs.set(b); hw.set(w, true); draw(); });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag the green tip of w. Click any trial to inspect it.");
    const dots = el("g", {}, P.top);
    function draw() {
      P.clear(); while (dots.firstChild) dots.removeChild(dots.firstChild);
      const ww = dot(w, w); if (ww < 1e-6) return;
      const nw = Math.sqrt(ww), wh = [w[0] / nw, w[1] / nw], x0 = [-b * w[0] / ww, -b * w[1] / ww], t = [-wh[1], wh[0]];
      const far = 12, A1 = [x0[0] - far * t[0], x0[1] - far * t[1]], A2 = [x0[0] + far * t[0], x0[1] + far * t[1]];
      P.path([A1, A2, [A2[0] + far * wh[0], A2[1] + far * wh[1]], [A1[0] + far * wh[0], A1[1] + far * wh[1]]], { color: "none", fill: C.blue, fillOpacity: 0.06, close: true });
      P.path([A1, A2, [A2[0] - far * wh[0], A2[1] - far * wh[1]], [A1[0] - far * wh[0], A1[1] - far * wh[1]]], { color: "none", fill: C.orange, fillOpacity: 0.07, close: true });
      P.line(A1, A2, { color: C.ink, width: 2.5 });
      let right = 0;
      pts.forEach((p, k) => {
        const z = dot(w, p.x) + b; if ((z > 0) === (p.y === 1)) right++;
        const sh = p.y === 1
          ? el("circle", { cx: P.X(p.x[0]), cy: P.Y(p.x[1]), r: 5.5, fill: C.blue, stroke: "#fff", "stroke-width": 1.2 }, dots)
          : el("rect", { x: P.X(p.x[0]) - 5, y: P.Y(p.x[1]) - 5, width: 10, height: 10, fill: C.orange, stroke: "#fff", "stroke-width": 1.2 }, dots);
        sh.style.cursor = "pointer"; sh.addEventListener("click", () => { sel = k; draw(); });
      });
      const p = pts[sel], z = dot(w, p.x) + b, d = z / nw, foot = [p.x[0] - d * wh[0], p.x[1] - d * wh[1]];
      P.line(p.x, foot, { color: C.purple, width: 2.2, dash: "4 3" });
      el("circle", { cx: P.X(p.x[0]), cy: P.Y(p.x[1]), r: 10, fill: "none", stroke: C.purple, "stroke-width": 2.5 }, dots);
      P.arrow([0, 0], w, { color: C.green, width: 4, label: "w", ldx: 8, ldy: -6 });
      out.innerHTML = `<table>
        <tr><td>w, b</td><td>w = ${vec(w, 2)}, b = ${fmt(b, 1)}</td></tr>
        <tr><td>Boundary</td><td>${fmt(-b / nw, 2)} from the origin along ŵ, at right angles to w</td></tr>
        <tr><td>Accuracy</td><td><b>${right} of ${pts.length}</b> trials on the correct side</td></tr>
        <tr><td><span class="k-purple">Chosen trial</span></td><td>${p.y === 1 ? "class 1 (circle)" : "class 0 (square)"}: z = w·x + b = <b>${fmt(z, 2)}</b>; signed distance z/‖w‖ = <b>${fmt(d, 2)}</b> → predicted class ${z > 0 ? 1 : 0}</td></tr></table>`;
    }
    const hw = P.handle(w, { color: C.green, name: "tip of w", snap: 0.1, onMove: q => { w = q; draw(); } });
    draw();
  });

  /* 9. Real VISp neurons: response table, model fit and weight vectors. */
  IX.register("v1-neuron", root => {
    const top = h("div", { class: "ix-controls-row" }, root);
    const lab = h("label", { class: "ix-select" }, top, "Neuron ");
    const sel = h("select", {}, lab);
    const grid = h("div", { class: "ix-three" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid), b3 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Mean rate for each stimulus (spikes/s)");
    const HM = svgBox(b1, 300, 300, "Response table as a 4 by 4 grid"); const hg = el("g", {}, HM);
    h("p", { class: "ix-panel-title" }, b2, "Right grating alone: data and model");
    const F = Plane(b2, { x: [0, 1.05], y: [0, 90], xtick: 0.25, ytick: 20, labels: ["right contrast", "spikes/s"], width: 340, height: 300, pad: 40, title: "Response to the right grating" });
    h("p", { class: "ix-panel-title" }, b3, "Weight vectors (spikes/s per unit contrast)");
    const Wp = Plane(b3, { x: [-25, 70], y: [-25, 70], xtick: 20, ytick: 20, labels: ["w_L", "w_R"], width: 320, height: 300, pad: 40, title: "Weight vectors of the well-fitted neurons" });
    const out = readout(root);
    let D = null;
    function draw() {
      if (!D) return;
      const i = +sel.value, v = D.v1, t = v.table[i], lv = v.levels, cb = 0.4375;
      while (hg.firstChild) hg.removeChild(hg.firstChild);
      const mx = Math.max(...t, 1), cell = 52, X0 = 60, Y0 = 18;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const k = r * 4 + c, val = t[k], f = val / mx;
        el("rect", { x: X0 + c * cell, y: Y0 + (3 - r) * cell, width: cell - 2, height: cell - 2, rx: 3, fill: `rgb(${Math.round(255 - f * 255)},${Math.round(255 - f * 141)},${Math.round(255 - f * 77)})` }, hg);
        txt(hg, fmt(val, 0), X0 + c * cell + cell / 2 - 1, Y0 + (3 - r) * cell + cell / 2 + 5, { anchor: "middle", weight: 600, color: f > 0.55 ? "#fff" : C.ink });
      }
      lv.forEach((l, k) => { txt(hg, String(l), X0 + k * cell + cell / 2, Y0 + 4 * cell + 16, { anchor: "middle", color: C.muted }); txt(hg, String(l), X0 - 8, Y0 + (3 - k) * cell + cell / 2 + 4, { anchor: "end", color: C.muted }); });
      txt(hg, "right contrast →", X0 + 2 * cell, Y0 + 4 * cell + 34, { anchor: "middle", color: C.muted });
      const yl = txt(hg, "left contrast →", 16, Y0 + 2 * cell, { anchor: "middle", color: C.muted }); yl.setAttribute("transform", `rotate(-90 16 ${Y0 + 2 * cell})`);
      F.clear();
      const b = v.b[i], wL = v.wL[i], wR = v.wR[i];
      F.path([[0, b + wL * (0 - cb) + wR * (0 - cb)], [1, b + wL * (0 - cb) + wR * (1 - cb)]], { color: C.green, width: 2.5 });
      for (let c = 0; c < 4; c++) F.dot([lv[c], Math.min(90, t[c])], { color: C.ink, r: 6 });
      Wp.clear();
      v.fit.forEach((f, k) => { if (f > 0.8 && k !== i) Wp.line([0, 0], [v.wL[k], v.wR[k]], { color: C.axis, width: 1.6 }); });
      Wp.arrow([0, 0], [wL, wR], { color: C.purple, width: 3.5 });
      const ang = deg(Math.atan2(wR, wL));
      out.innerHTML = `<p><b>Neuron ${i}</b>: baseline b = ${fmt(b, 1)} spikes/s, <span class="k-purple">w = (${fmt(wL, 1)}, ${fmt(wR, 1)})</span> spikes/s per unit contrast, pointing at <b>${fmt(ang, 0)}°</b>, fit similarity <b>${fmt(v.fit[i], 2)}</b>.</p>
        <p>${v.fit[i] > 0.8 ? (ang > 60 && ang < 120 ? "It responds to the right grating and almost ignores the left: the contralateral side for probes in the left hemisphere. " : "") + (t[3] < b + wR * (1 - cb) - 5 ? "The black dots bend over at high contrast, which the straight green line cannot follow." : "") : "A poor fit: this neuron fires but barely changes with contrast, so its response table is mostly noise."}</p>`;
    }
    data().then(d => {
      D = d; const v = d.v1;
      const order = v.fit.map((f, k) => [f, k]).filter(([f]) => f > 0.8).sort((a, b) => b[0] - a[0]).map(([, k]) => k);
      if (!order.includes(49)) order.unshift(49);
      order.forEach(k => { const o = h("option", { value: k }, sel, `Neuron ${k} (fit ${fmt(v.fit[k], 2)})`); if (k === 49) o.selected = true; });
      h("option", { value: 44 }, sel, `Neuron 44 (fit ${fmt(v.fit[44], 2)}): active but untuned`);
      sel.addEventListener("change", draw); draw();
    });
  });
})();
