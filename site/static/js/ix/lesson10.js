/* Lesson 10: The Chain Rule and Backpropagation. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  const sig = x => 1 / (1 + Math.exp(-x));
  function curve(P, f, s = {}, x0 = P.opts.x[0], x1 = P.opts.x[1], n = 400) {
    const [y0, y1] = P.opts.y, span = y1 - y0; let seg = [];
    const flush = () => { if (seg.length > 1) P.path(seg, s); seg = []; };
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); if (!isFinite(y) || y < y0 - 2 * span || y > y1 + 2 * span) { flush(); continue; } seg.push([x, y]); }
    flush();
  }
  function rng(seed) { let a = seed >>> 0; const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return () => { const u1 = u() || 1e-12, u2 = u(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }; }
  const sup = v => String(v).split("").map(c => ({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" })[c] || c).join("");
  function txt(p, s, x, y, a = {}) { const t = el("text", { x, y, "text-anchor": a.anchor || "middle", "font-size": a.size || 12, fill: a.color || C.ink, "font-weight": a.weight || 400, "font-family": "inherit" }, p); t.textContent = s; if (a.halo) { t.setAttribute("paint-order", "stroke"); t.setAttribute("stroke", "#fff"); t.setAttribute("stroke-width", 4); } return t; }

  /* 1. Two links of a chain: a weight reaches the rate through the drive. */
  IX.register("chain-neuron", root => {
    const rmax = 50, x = 2, b = -3;
    const grid = h("div", { class: "ix-three" }, root);
    const ttl = ["Link 1: z = wx + b", "Link 2: r = rₘₐₓ σ(z)", "The whole chain: r(w)"];
    const bx = ttl.map(t => { const d = h("div", {}, grid); h("p", { class: "ix-panel-title" }, d, t); return d; });
    const P1 = Plane(bx[0], { x: [-1, 4], y: [-5, 5], xtick: 1, ytick: 2, labels: ["w", "z"], width: 300, height: 260, pad: 32, clip: true, title: "link 1" });
    const P2 = Plane(bx[1], { x: [-5, 5], y: [-3, 55], xtick: 2, ytick: 10, labels: ["z", "r"], width: 300, height: 260, pad: 32, clip: true, title: "link 2" });
    const P3 = Plane(bx[2], { x: [-1, 4], y: [-3, 55], xtick: 1, ytick: 10, labels: ["w", "r"], width: 300, height: 260, pad: 32, clip: true, title: "chain" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let w = 1.5;
    const sl = slider(ctl, { label: "Weight w", min: -1, max: 4, step: 0.05, value: w, format: v => fmt(v, 2), onInput: v => { w = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 50 });
    const out = readout(root);
    const tan = (P, x0, y0, m, L) => P.line([x0 - L, y0 - L * m], [x0 + L, y0 + L * m], { color: C.orange, width: 2.4 });
    function draw() {
      [P1, P2, P3].forEach(P => P.clear());
      const z = w * x + b, r = rmax * sig(z), s1 = x, s2 = rmax * sig(z) * (1 - sig(z));
      curve(P1, v => v * x + b, { color: C.blue, width: 2.4 }); tan(P1, w, z, s1, 0.6); P1.dot([w, z], { color: C.ink, r: 5.5 });
      curve(P2, v => rmax * sig(v), { color: C.green, width: 2.4 }); tan(P2, z, r, s2, 1.2); P2.dot([z, r], { color: C.ink, r: 5.5 });
      curve(P3, v => rmax * sig(v * x + b), { color: C.ink, width: 2.4 }); curve(P3, v => rmax * sig(v * x + b) * (1 - sig(v * x + b)) * x, { color: C.purple, width: 2, dash: "5 4" });
      tan(P3, w, r, s1 * s2, 0.5); P3.dot([w, r], { color: C.ink, r: 5.5 });
      out.innerHTML = `<p class="big">dr/dw = <span class="k-orange">rₘₐₓσ′(z)</span> × <span class="k-orange">x</span> = ${fmt(s2, 2)} × ${x} = <b>${fmt(s1 * s2, 2)}</b> spikes/s per unit weight</p>
        <p>The orange lines are the tangents of each link; the slope of the whole chain is the product of the two. Purple dashed (right): dr/dw at every w. ${Math.abs(z) > 2.5 ? "Here the sigmoid is saturated, so its slope is small and stalls the whole product: a plastic synapse onto a saturated neuron barely changes its output." : "In the sigmoid's sensitive range, a change of weight passes through strongly."}</p>`;
    }
    draw();
  });

  /* 2. A three-link chain and the product of its local slopes. */
  IX.register("chain-links", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const P = Plane(left, { x: [-2.2, 2.2], y: [-1, 3], xtick: 1, ytick: 1, labels: ["x", "y"], width: 440, height: 300, pad: 34, clip: true, title: "y = exp(sin(x squared))" });
    const svg = el("svg", { viewBox: "0 0 440 150", class: "ix-svg", role: "img" }, left); el("title", {}, svg).textContent = "local slopes"; const g = el("g", {}, svg);
    let x = 0.2;
    const sl = slider(side, { label: "x", min: -2.2, max: 2.2, step: 0.01, value: x, format: v => fmt(v, 2), onInput: v => { x = v; draw(); } });
    player(side, sl, { bounce: true, interval: 30 });
    const out = readout(side);
    const f = t => Math.exp(Math.sin(t * t));
    function draw() {
      P.clear(); while (g.firstChild) g.removeChild(g.firstChild);
      const u = x * x, v = Math.sin(u), y = Math.exp(v), d1 = 2 * x, d2 = Math.cos(u), d3 = Math.exp(v), d = d1 * d2 * d3;
      curve(P, f, { color: C.ink, width: 2.4 }, -2.2, 2.2, 600);
      P.line([x - 0.5, y - 0.5 * d], [x + 0.5, y + 0.5 * d], { color: C.blue, width: 2.4 }); P.dot([x, y], { color: C.blue, r: 6 });
      const items = [["u = x²", "2x", d1, C.purple], ["v = sin u", "cos u", d2, C.green], ["y = eᵛ", "eᵛ", d3, C.orange], ["dy/dx", "product", d, C.blue]];
      const y0 = 85, sc = 14;
      el("line", { x1: 10, x2: 430, y1: y0, y2: y0, stroke: C.axis, "stroke-width": 1 }, g);
      items.forEach(([n, l, val, col], i) => {
        const cx = 60 + i * 105, hh = Math.max(-5, Math.min(5, val)) * sc;
        el("rect", { x: cx - 22, y: hh >= 0 ? y0 - hh : y0, width: 44, height: Math.max(1, Math.abs(hh)), fill: col, "fill-opacity": i === 3 ? 1 : 0.8 }, g);
        txt(g, fmt(val, 2), cx, hh >= 0 ? y0 - hh - 4 : y0 - hh + 13, { weight: 700, size: 12 });
        txt(g, l, cx, 148, { color: C.muted, size: 11 });
        if (i < 3) txt(g, i < 2 ? "×" : "=", cx + 52, y0 + 4, { color: C.muted, size: 16 });
      });
      out.innerHTML = `<p>dy/dx = 2x · cos(x²) · e<sup>sin(x²)</sup></p><p class="big">${fmt(d1, 2)} × ${fmt(d2, 2)} × ${fmt(d3, 2)} = <b>${fmt(d, 3)}</b></p>
        <p>${Math.abs(d2) < 0.08 ? "Here cos(x²) ≈ 0: one flat link stalls the whole chain, however large the other factors." : "Each link scales a small nudge by its own local slope; the bars multiply to the slope of the blue tangent."}</p>`;
    }
    draw();
  });

  /* 3. Forward and backward passes through a computation graph. */
  IX.register("backprop-graph", root => {
    const svg = el("svg", { viewBox: "0 0 760 300", class: "ix-svg", role: "img" }, root); el("title", {}, svg).textContent = "Computation graph of one neuron's loss";
    const defs = el("defs", {}, svg), g = el("g", {}, svg);
    ["#9aa6b1", C.orange].forEach((c, i) => { const m = el("marker", { id: "l10m" + i, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 9, markerHeight: 9, markerUnits: "userSpaceOnUse", orient: "auto" }, defs); el("path", { d: "M0 0L10 5L0 10z", fill: c }, m); });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let w = 1.2, st = 0;
    slider(ctl, { label: "Weight w", min: -1, max: 3, step: 0.1, value: w, format: v => fmt(v, 1), onInput: v => { w = v; draw(); } });
    const sl = slider(ctl, { label: "Step", min: 0, max: 10, step: 1, value: 0, format: v => v === 0 ? "start" : v <= 5 ? `forward ${v}` : `backward ${v - 5}`, onInput: v => { st = v; draw(); } });
    player(ctl, sl, { interval: 1100 });
    const out = readout(root);
    const x = 2, b = -1, y = 30, rmax = 50;
    const N = { w: [50, 50], x: [50, 140], b: [50, 240], m: [190, 90], s: [320, 150], sg: [440, 150], r: [560, 150], L: [690, 150], y: [560, 250] };
    const lab = { w: "w", x: "x", b: "b", m: "×", s: "+", sg: "σ", r: "× rₘₐₓ", L: "½(r − y)²", y: "y" };
    function arrow(a, c, col, mk, dy = 0) { const [x1, y1] = N[a], [x2, y2] = N[c], dx = x2 - x1, dyy = y2 - y1, l = Math.hypot(dx, dyy), ux = dx / l, uy = dyy / l; el("line", { x1: x1 + ux * 30, y1: y1 + uy * 22 + dy, x2: x2 - ux * 32, y2: y2 - uy * 24 + dy, stroke: col, "stroke-width": 1.6, "marker-end": `url(#${mk})` }, g); return [(x1 + x2) / 2, (y1 + y2) / 2 + dy]; }
    function draw() {
      while (g.firstChild) g.removeChild(g.firstChild);
      const m = w * x, z = m + b, s = sig(z), r = rmax * s, Lv = 0.5 * (r - y) ** 2;
      const dr = r - y, ds = dr * rmax, dz = ds * s * (1 - s), dw = dz * x, db = dz;
      const fw = [["w", "m"], ["x", "m"], ["m", "s"], ["b", "s"], ["s", "sg"], ["sg", "r"], ["r", "L"], ["y", "L"]];
      const fval = { m: m, s: z, sg: s, r: r, L: Lv };
      const order = ["m", "s", "sg", "r", "L"];
      fw.forEach(([a, c]) => arrow(a, c, "#9aa6b1", "l10m0"));
      Object.entries(N).forEach(([k, [cx, cy]]) => {
        const inp = ["w", "x", "b", "y"].includes(k);
        el("ellipse", { cx, cy, rx: k === "L" ? 54 : 34, ry: 22, fill: inp ? "#dbeaf5" : "#f7e6c4" }, g);
        txt(g, lab[k], cx, cy + 4, { size: 13, weight: 600 });
      });
      [["w", w], ["x", x], ["b", b], ["y", y]].forEach(([k, v]) => txt(g, "= " + fmt(v, 2), N[k][0], N[k][1] + 38, { color: C.muted, size: 11 }));
      order.forEach((k, i) => { if (st > i) txt(g, (k === "s" ? "z = " : k === "sg" ? "σ = " : k === "L" ? "L = " : k === "r" ? "r = " : "wx = ") + fmt(fval[k], 3), N[k][0], N[k][1] - 30, { color: C.ink, size: 11.5, weight: 600, halo: true }); });
      const back = [["L", "r", "∂L/∂r", dr], ["r", "sg", "∂L/∂σ", ds], ["sg", "s", "∂L/∂z", dz], ["s", "m", "∂L/∂(wx)", dz], ["m", "w", "∂L/∂w", dw]];
      back.forEach(([a, c, t, v], i) => { if (st > 5 + i) { const p = arrow(a, c, C.orange, "l10m1", 14); txt(g, `${t} = ${fmt(v, 2)}`, p[0], p[1] + 22, { color: "#a35a00", size: 10.5, weight: 600, halo: true }); } });
      if (st >= 9) { const p = arrow("s", "b", C.orange, "l10m1", 14); txt(g, `∂L/∂b = ${fmt(db, 2)}`, p[0] + 30, p[1] + 10, { color: "#a35a00", size: 10.5, weight: 600, halo: true }); }
      const h2 = 1e-5, Lf = ww => 0.5 * (rmax * sig(ww * x + b) - y) ** 2, num = (Lf(w + h2) - Lf(w - h2)) / (2 * h2);
      out.innerHTML = st <= 5 ? `<p><b>Forward pass</b>: evaluate each node from the inputs to the loss, storing every value. ${st === 5 ? `The loss is L = ${fmt(Lv, 3)}.` : ""}</p>`
        : `<p><b>Backward pass</b>: start from ∂L/∂L = 1 and, node by node in reverse, multiply by each local derivative (orange).</p><table><tr><td>∂L/∂w (backprop)</td><td><b>${fmt(dw, 3)}</b></td></tr><tr><td>∂L/∂w (central difference)</td><td>${fmt(num, 3)}</td></tr><tr><td>∂L/∂b</td><td>${fmt(db, 3)}</td></tr></table>`;
    }
    draw();
  });

  /* 4. Gradients of a linear layer: outer product and transposed weights. */
  IX.register("layer-grad", root => {
    const W = [[1, 2], [0, -1], [3, 1]];
    const svg = el("svg", { viewBox: "0 0 760 230", class: "ix-svg", role: "img" }, root); el("title", {}, svg).textContent = "Layer gradients";
    const g = el("g", {}, svg);
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const a = [2, 1], d = [1, 0, -1];
    a.forEach((v, i) => slider(ctl, { label: `a${"₁₂"[i]}`, min: -2, max: 2, step: 0.5, value: v, format: x => fmt(x, 1), onInput: x => { a[i] = x; draw(); } }));
    d.forEach((v, i) => slider(ctl, { label: `δ${"₁₂₃"[i]}`, min: -2, max: 2, step: 0.5, value: v, format: x => fmt(x, 1), onInput: x => { d[i] = x; draw(); } }));
    const out = readout(root);
    const col = v => v > 0 ? `rgba(0,114,178,${Math.min(1, Math.abs(v) / 4) * 0.8 + 0.08})` : v < 0 ? `rgba(213,94,0,${Math.min(1, Math.abs(v) / 4) * 0.8 + 0.08})` : "#f5f7f9";
    function grid(M, x0, y0, t) {
      txt(g, t, x0 + M[0].length * 22, y0 - 12, { weight: 700, size: 12 });
      M.forEach((row, i) => row.forEach((v, j) => { el("rect", { x: x0 + j * 44, y: y0 + i * 44, width: 42, height: 42, rx: 4, fill: col(v), stroke: C.axis }, g); txt(g, fmt(v, 1), x0 + j * 44 + 21, y0 + i * 44 + 26, { size: 13, weight: 600 }); }));
    }
    function draw() {
      while (g.firstChild) g.removeChild(g.firstChild);
      const dW = d.map(di => a.map(aj => di * aj)), da = [0, 1].map(j => d.reduce((s, di, i) => s + di * W[i][j], 0));
      grid(d.map(v => [v]), 20, 50, "δ (3)"); txt(g, "×", 85, 120, { size: 18, color: C.muted });
      grid([a], 105, 50, "aᵀ (1 × 2)"); txt(g, "=", 215, 120, { size: 18, color: C.muted });
      grid(dW, 240, 50, "∂L/∂W = δ aᵀ");
      grid(W.map(r => r), 400, 50, "W (3 × 2)");
      grid([da], 560, 50, "∂L/∂a = Wᵀδ");
      txt(g, "Blue positive, vermilion negative.", 600, 215, { color: C.muted, size: 11 });
      out.innerHTML = `<p>Each weight's gradient is <b>(error at its target) × (activity at its source)</b>: the outer product δaᵀ, shaped like W. This is Hebb's rule, with an error in place of the postsynaptic activity. The error sent back to the inputs travels through the <b>transpose</b> of the forward weights: ∂L/∂a = Wᵀδ = (${da.map(v => fmt(v, 1)).join(", ")}).</p>`;
    }
    draw();
  });

  /* 5. Vanishing and exploding error signals in a deep random network (computed in the browser). */
  IX.register("vanishing", root => {
    let act = "sigmoid", scale = 1;
    buttons(root, [{ label: "sigmoid" }, { label: "tanh" }, { label: "ReLU" }], it => { act = it.label.toLowerCase(); draw(); }, { toggle: true, label: "Activation" });
    const L = layout(root, true);
    const P = Plane(L, { x: [0.5, 12.5], y: [-9, 4], xtick: 1, noYTicks: true, frame: true, labels: ["layer (1 = closest to the input)", "error-signal size"], width: 480, height: 340, pad: 50, clip: true, title: "Error signal per layer" });
    [-8, -6, -4, -2, 0, 2, 4].forEach(v => P.text(v ? "10" + sup(v) : "1", 0.5, v, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: P.back }));
    const side = h("div", {}, L);
    const sl = slider(side, { label: "Weight scale", min: 0.4, max: 2.2, step: 0.05, value: 1, format: v => "× " + fmt(v, 2), onInput: v => { scale = v; draw(); } });
    player(side, sl, { bounce: true, interval: 90 });
    const out = readout(side);
    const n = 64, Ls = 12, g0 = rng(7);
    const Z = [...Array(Ls)].map(() => [...Array(n)].map(() => [...Array(n)].map(() => g0())));
    const x0 = [...Array(n)].map(() => g0()), dL = [...Array(n)].map(() => g0());
    function draw() {
      P.clear();
      const phi = { sigmoid: sig, tanh: Math.tanh, relu: v => Math.max(0, v) }[act];
      const dphi = { sigmoid: v => sig(v) * (1 - sig(v)), tanh: v => 1 - Math.tanh(v) ** 2, relu: v => v > 0 ? 1 : 0 }[act];
      const sd = scale * Math.sqrt((act === "relu" ? 2 : 1) / n);
      const zs = []; let a = x0;
      for (let k = 0; k < Ls; k++) { const z = Z[k].map(row => row.reduce((s, wv, j) => s + wv * sd * a[j], 0)); zs.push(z); a = z.map(phi); }
      let d = dL.map((v, i) => v * dphi(zs[Ls - 1][i])); const nrm = [Math.hypot(...d)];
      for (let k = Ls - 1; k > 0; k--) { const back = [...Array(n)].map((_, j) => Z[k].reduce((s, row, i) => s + row[j] * sd * d[i], 0)); d = back.map((v, j) => v * dphi(zs[k - 1][j])); nrm.unshift(Math.hypot(...d)); }
      const rel = nrm.map(v => Math.log10(Math.max(v / nrm[Ls - 1], 1e-12)));
      P.line([0.5, 0], [12.5, 0], { color: C.muted, width: 1, dash: "4 4" });
      const col = { sigmoid: C.blue, tanh: C.orange, relu: C.green }[act];
      P.path(rel.map((v, i) => [i + 1, v]), { color: col, width: 2.4 }); rel.forEach((v, i) => P.dot([i + 1, v], { color: col, r: 4.5 }));
      const r1 = Math.pow(10, rel[0]);
      out.innerHTML = `<p>First layer / last layer: <b>${r1 < 0.01 || r1 > 100 ? r1.toExponential(1) : fmt(r1, 2)}</b></p>
        <p>A random 12-layer network, 64 units wide, computed in your browser, with ${act === "relu" ? "He" : "Xavier"} initialisation times the weight scale. The error signal is multiplied at each layer by roughly (weight scale) × (activation slope). ${act === "sigmoid" ? "Sigmoid slopes are at most ¼, so the signal vanishes geometrically." : r1 < 0.05 ? "Weights too small: the signal vanishes." : r1 > 20 ? "Weights too large: the signal explodes." : "With the right initialisation each factor is close to 1, and the signal survives all 12 layers."}</p>`;
    }
    draw();
  });

  /* 6. Backpropagation through time in one dimension. */
  IX.register("bptt", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 100], y: [-10, 10], xtick: 20, noYTicks: true, frame: true, labels: ["time steps back, T", "∂x_T / ∂x_0"], width: 460, height: 300, pad: 50, clip: true, title: "Gradient through time" });
    [-10, -5, 0, 5, 10].forEach(v => P.text(v ? "10" + sup(v) : "1", 0, v, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: P.back }));
    const side = h("div", {}, L);
    let w = 0.9;
    const sl = slider(side, { label: "Recurrent weight w", min: 0.7, max: 1.3, step: 0.01, value: w, format: v => fmt(v, 2), onInput: v => { w = v; draw(); } });
    player(side, sl, { bounce: true, interval: 80 });
    const out = readout(side);
    function draw() {
      P.clear(); P.line([0, 0], [100, 0], { color: C.muted, dash: "4 4", width: 1 });
      curve(P, T => T * Math.log10(Math.abs(w)), { color: Math.abs(w) > 1 ? C.vermilion : C.blue, width: 2.6 }, 0, 100);
      out.innerHTML = `<p>For x<sub>t+1</sub> = w x<sub>t</sub>, the gradient over T steps is ∂x<sub>T</sub>/∂x<sub>0</sub> = w<sup>T</sup>. After 50 steps: <b>${fmt(Math.pow(w, 50), 4)}</b>.</p>
        <p>Below 1 it vanishes; above 1 it explodes; only |w| = 1 keeps it of size 1. In a network, the role of |w| is played by the spectral radius of the recurrent matrix (Lesson 6).</p>`;
    }
    draw();
  });
})();
