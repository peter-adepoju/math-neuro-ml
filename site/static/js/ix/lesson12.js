/* Lesson 12: One-Dimensional Gradient Descent. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson12/data.json").then(r => r.json()));
  function curve(P, f, s = {}, x0 = P.opts.x[0], x1 = P.opts.x[1], n = 400) {
    const [y0, y1] = P.opts.y, span = y1 - y0; let seg = [];
    const flush = () => { if (seg.length > 1) P.path(seg, s); seg = []; };
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); if (!isFinite(y) || y < y0 - 2 * span || y > y1 + 2 * span) { flush(); continue; } seg.push([x, y]); }
    flush();
  }
  function rng(seed) { let a = seed >>> 0; const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; const n = () => { const u1 = u() || 1e-12, u2 = u(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }; n.u = u; return n; }
  const sup = v => String(v).split("").map(c => ({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" })[c] || c).join("");
  const clampY = (P, y) => Math.max(P.opts.y[0], Math.min(P.opts.y[1], y));

  /* 1. The delta rule learning a weight from its errors. */
  IX.register("delta-rule", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 200], y: [-0.5, 5], xtick: 25, ytick: 1, frame: true, labels: ["trial", "weight w"], width: 480, height: 330, pad: 44, clip: true, title: "The delta rule" });
    const side = h("div", {}, L);
    let e = Math.log10(0.1), n = 200;
    slider(side, { label: "Learning rate η", min: -2.3, max: -0.25, step: 0.05, value: e, format: v => fmt(Math.pow(10, v), 3), onInput: v => { e = v; draw(); } });
    const sn = slider(side, { label: "Trials", min: 0, max: 200, step: 2, value: n, onInput: v => { n = v; draw(); } });
    player(side, sn, { interval: 30 });
    const out = readout(side);
    const g = rng(42), X = [...Array(200)].map(() => g()), Y = X.map(x => 2.5 * x + g());
    function draw() {
      P.clear();
      P.line([0, 2.5], [200, 2.5], { color: C.ink, width: 1.2, dash: "3 4" });
      const eta = Math.pow(10, e); let w = 0; const ws = [[0, 0]];
      for (let k = 0; k < n; k++) { w += eta * (Y[k] - w * X[k]) * X[k]; ws.push([k + 1, w]); }
      P.path(ws, { color: C.blue, width: 2 });
      P.dot([n, clampY(P, w)], { color: C.blue, r: 5 });
      out.innerHTML = `<p class="big">w ← w + η (y − w x) x</p><table><tr><td>η</td><td>${fmt(eta, 3)}</td></tr><tr><td>weight after ${n} trials</td><td><b>${fmt(w, 2)}</b> (true 2.5)</td></tr></table>
        <p>${eta < 0.03 ? "Small steps: steady but slow; the weight is still climbing." : eta < 0.25 ? "Fast enough to arrive within about 10 trials, then it wanders around the true weight, pushed by the noise of each trial." : "Big steps learn within a few trials, then jump around wildly: each noisy trial moves the weight a long way."} Each trial is one downhill step on that trial's squared error.</p>`;
    }
    draw();
  });

  /* 2. Gradient descent on a parabola: the four regimes. */
  IX.register("gd-quadratic", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Steps on the loss L = (a/2)(θ − 1)², a = 4");
    h("p", { class: "ix-panel-title" }, b2, "Error |θₖ − θ*| (log scale)");
    const P = Plane(b1, { x: [-2, 4], y: [-0.5, 9], xtick: 1, ytick: 2, labels: ["θ", "loss"], width: 380, height: 320, pad: 34, clip: true, title: "Loss and iterates" });
    const Q = Plane(b2, { x: [0, 25], y: [-8, 3], xtick: 5, noYTicks: true, frame: true, labels: ["step k", ""], width: 380, height: 320, pad: 44, clip: true, title: "Error" });
    [-8, -4, 0].forEach(v => Q.text(v ? "10" + sup(v) : "1", 0, v, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: Q.back }));
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let ea = 0.2;
    const sl = slider(ctl, { label: "η a", min: 0.02, max: 2.2, step: 0.02, value: ea, format: v => fmt(v, 2), onInput: v => { ea = v; draw(); } });
    player(ctl, sl, { interval: 80 });
    const out = readout(root);
    const a = 4, L = t => a / 2 * (t - 1) ** 2;
    function draw() {
      P.clear(); Q.clear();
      curve(P, L, { color: C.ink, width: 2.4 });
      const eta = ea / a, q = 1 - ea; let t = 3; const ts = [t];
      for (let k = 0; k < 25; k++) { t = t - eta * a * (t - 1); ts.push(t); }
      const pts = ts.slice(0, 12).map(v => [v, L(v)]).filter(p => Math.abs(p[0]) < 50);
      P.path(pts, { color: C.orange, width: 1.4 }); pts.forEach((p, i) => P.dot(p, { color: i ? C.orange : C.ink, r: i ? 4 : 6 }));
      Q.line([0, 0], [25, 0], { color: C.muted, dash: "4 4", width: 1 });
      const ep = ts.map((v, k) => [k, Math.log10(Math.max(Math.abs(v - 1), 1e-9))]);
      Q.path(ep, { color: C.blue, width: 2 }); ep.forEach(p => Q.dot(p, { color: C.blue, r: 3 }));
      const steps = Math.abs(q) < 1e-9 ? 1 : Math.abs(q) < 1 ? Math.ceil(Math.log(1e-6) / Math.log(Math.abs(q))) : Infinity;
      const regime = Math.abs(q) < 1e-9 ? "one step: η = 1/a is the Newton step" : q > 0 ? "creeps in monotonically" : q > -1 + 1e-9 ? "oscillates, but converges" : Math.abs(q + 1) < 1e-9 ? "bounces for ever" : "diverges";
      out.innerHTML = `<table><tr><td>contraction factor q = 1 − ηa</td><td><b>${fmt(q, 2)}</b></td></tr><tr><td>behaviour</td><td><b>${regime}</b></td></tr><tr><td>steps for a 10⁶-fold reduction</td><td>${isFinite(steps) ? steps : "never"}</td></tr></table>
        <p>The error is multiplied by q at every step, so on a log scale it falls (or rises) along a straight line. The stability limit is ηa &lt; 2.</p>`;
    }
    draw();
  });

  /* 3. Which minimum? Gradient descent on the double well, by start and learning rate. */
  IX.register("double-well-lr", root => {
    const E = x => x ** 4 - 2 * x * x + 0.3 * x, dE = x => 4 * x ** 3 - 4 * x + 0.3;
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const P = Plane(left, { x: [-1.9, 1.9], y: [-2, 4], xtick: 0.5, ytick: 1, labels: ["x", "E(x)"], width: 480, height: 300, pad: 34, clip: true, title: "Path of one run" });
    const svg = el("svg", { viewBox: "0 0 480 70", class: "ix-svg", role: "img" }, left); el("title", {}, svg).textContent = "Outcome by starting point"; const g = el("g", {}, svg);
    let eta = 0.1, x0 = 1.7;
    const sl = slider(side, { label: "Learning rate η", min: 0.01, max: 0.27, step: 0.005, value: eta, format: v => fmt(v, 3), onInput: v => { eta = v; draw(); } });
    slider(side, { label: "Start x₀", min: -1.8, max: 1.8, step: 0.02, value: x0, format: v => fmt(v, 2), onInput: v => { x0 = v; draw(); } });
    player(side, sl, { interval: 120 });
    const out = readout(side);
    const cols = { global: C.blue, local: C.green, cycle: C.purple, diverged: C.ink };
    function run(x) { const xs = [x]; for (let k = 0; k < 400; k++) { x = x - eta * dE(x); if (!isFinite(x) || Math.abs(x) > 10) return { r: "diverged", xs }; if (k < 30) xs.push(x); } let y = x; for (let k = 0; k < 4; k++) y = y - eta * dE(y); if (Math.abs(y - x) > 1e-3) return { r: "cycle", xs }; return { r: Math.abs(x + 1.036) < 0.05 ? "global" : Math.abs(x - 0.96) < 0.05 ? "local" : "cycle", xs }; }
    function draw() {
      P.clear(); while (g.firstChild) g.removeChild(g.firstChild);
      curve(P, E, { color: C.ink, width: 2.4 });
      const R = run(x0), pts = R.xs.filter(v => Math.abs(v) < 2).map(v => [v, E(v)]);
      P.path(pts, { color: cols[R.r], width: 1.3, opacity: 0.8 }); pts.forEach((p, i) => P.dot(p, { color: cols[R.r], r: i ? 3.5 : 6 }));
      const cnt = { global: 0, local: 0, cycle: 0, diverged: 0 };
      for (let i = 0; i <= 180; i++) { const x = -1.8 + 3.6 * i / 180, r = run(x).r; cnt[r]++; el("rect", { x: 20 + i * 440 / 181, y: 10, width: 440 / 181 + 0.6, height: 22, fill: cols[r] }, g); }
      const tx = (s, x, y, a = "middle") => { const t = el("text", { x, y, "text-anchor": a, "font-size": 11, fill: C.muted, "font-family": "inherit" }, g); t.textContent = s; };
      tx("start −1.8", 20, 48, "start"); tx("start +1.8", 460, 48, "end"); tx("each stripe: where a run from that start ends", 240, 64);
      el("line", { x1: 20 + (1.8 + 0.0754) / 3.6 * 440, x2: 20 + (1.8 + 0.0754) / 3.6 * 440, y1: 6, y2: 36, stroke: "#fff", "stroke-width": 1.5, "stroke-dasharray": "3 2" }, g);
      out.innerHTML = `<table><tr><td><span class="k-blue">global minimum</span></td><td>${cnt.global}</td></tr><tr><td><span class="k-green">local minimum</span></td><td>${cnt.local}</td></tr><tr><td><span class="k-purple">stuck in a cycle</span></td><td>${cnt.cycle}</td></tr><tr><td>diverged</td><td>${cnt.diverged}</td></tr></table>
        <p>Out of 181 starting points. ${eta < 0.14 ? "Small steps: every start ends in the valley on its own side of the hilltop (dashed white line)." : eta < 0.225 ? "Large steps on the steep outer walls can jump over the hill into the other valley." : "Above 2/8.87 ≈ 0.225 the sharper, global minimum is no longer stable: runs end in a 2-cycle around it, while the flatter local minimum still attracts."}</p>`;
    }
    draw();
  });

  /* 4. SGD: the noise floor, batch size and schedules. */
  IX.register("sgd-noise", root => {
    let B = 1, eta = 0.1, decay = false;
    const bar = h("div", { class: "ix-controls-row" }, root);
    buttons(bar, [{ label: "1", v: 1 }, { label: "10", v: 10 }, { label: "50", v: 50 }], it => { B = it.v; draw(); }, { toggle: true, label: "Batch size" });
    buttons(bar, [{ label: "Constant" }, { label: "Decaying" }], (it, i) => { decay = i === 1; draw(); }, { toggle: true, label: "Schedule" });
    const P = Plane(root, { x: [0, 600], y: [1.4, 3.4], xtick: 100, ytick: 0.5, frame: true, labels: ["step k", "θ"], width: 780, height: 300, pad: 46, clip: true, title: "SGD iterates" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let seed = 1;
    const sl = slider(ctl, { label: "η", min: 0.01, max: 0.5, step: 0.01, value: eta, format: v => fmt(v, 2), onInput: v => { eta = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 120 });
    buttons(ctl, [{ label: "New seed" }], () => { seed++; draw(); });
    const out = readout(root);
    const a = 0.775, sg = 0.868, ts = 2.418;
    function draw() {
      P.clear(); P.line([0, ts], [600, ts], { color: C.ink, dash: "3 4", width: 1.2 });
      const g = rng(seed * 101 + B); let t = 1.5; const pts = [[0, t]], tail = [];
      for (let k = 0; k < 600; k++) { const ek = decay ? eta / (1 + k / 50) : eta, gr = a * (t - ts) + sg / Math.sqrt(B) * g(); t -= ek * gr; pts.push([k + 1, t]); if (k >= 400) tail.push(t); }
      P.path(pts, { color: B === 1 ? C.sky : B === 10 ? C.blue : C.green, width: 1.4 });
      const m = tail.reduce((s, v) => s + v, 0) / tail.length, sd = Math.sqrt(tail.reduce((s, v) => s + (v - m) ** 2, 0) / tail.length);
      const pred = Math.sqrt(eta * sg * sg / (B * a * (2 - eta * a)));
      out.innerHTML = `<table><tr><td>spread over the last 200 steps</td><td><b>${fmt(sd, 3)}</b></td></tr><tr><td>noise-floor prediction √(ησ²/(Ba(2 − ηa)))</td><td>${decay ? "— (decaying rate)" : fmt(pred, 3)}</td></tr></table>
        <p>A quadratic loss (curvature 0.775) with gradients that carry minibatch noise of SD 0.868/√B. ${decay ? "With a decaying rate η/(1 + k/50) the steps shrink, the noise is averaged away, and the iterates settle." : "With a constant rate SGD never settles: it jitters around θ* (dotted). Halving the spread needs a 4× smaller η or a 4× larger batch."}</p>`;
    }
    draw();
  });

  /* 5. A real neuron: full-batch gradient descent on a Poisson loss whose curvature grows. */
  IX.register("poisson-gd", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Loss and the gradient-descent path");
    h("p", { class: "ix-panel-title" }, b2, "Gain w at each step");
    const P = Plane(b1, { x: [-1, 2.2], y: [0.3, 0.8], xtick: 0.5, ytick: 0.1, frame: true, labels: ["gain w", "loss"], width: 380, height: 320, pad: 46, clip: true, title: "Poisson loss" });
    const Q = Plane(b2, { x: [0, 40], y: [-1.2, 2.4], xtick: 10, ytick: 0.5, frame: true, labels: ["step k", "w"], width: 380, height: 320, pad: 46, clip: true, title: "Iterates" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, eta = 1.4;
    const sl = slider(ctl, { label: "η", min: 0.1, max: 4.5, step: 0.05, value: eta, format: v => fmt(v, 2), onInput: v => { eta = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 120 });
    const out = readout(root);
    let cache = {};
    const Lf = w => { if (cache["L" + w] !== undefined) return cache["L" + w]; let s = 0; for (let i = 0; i < D.x.length; i++) { const z = D.c + w * D.x[i]; s += Math.exp(z) - D.y[i] * z; } return (cache["L" + w] = s / D.x.length); };
    const dL = w => { let s = 0; for (let i = 0; i < D.x.length; i++) s += (Math.exp(D.c + w * D.x[i]) - D.y[i]) * D.x[i]; return s / D.x.length; };
    let lossCurve = null;
    function draw() {
      if (!D) return; P.clear(); Q.clear();
      if (!lossCurve) { lossCurve = []; for (let w = -1; w <= 2.2001; w += 0.04) lossCurve.push([w, Lf(+w.toFixed(2))]); }
      P.path(lossCurve, { color: C.ink, width: 2.4 });
      let w = 0; const ws = [0];
      for (let k = 0; k < 40; k++) { w = w - eta * dL(w); if (!isFinite(w) || Math.abs(w) > 6) { ws.push(NaN); break; } ws.push(w); }
      const fin = ws.filter(isFinite);
      fin.slice(0, 15).forEach((v, i) => { if (v > -1 && v < 2.2) P.dot([v, Lf(+v.toFixed(3))], { color: C.orange, r: i ? 3.5 : 6 }); });
      Q.line([0, D.w], [40, D.w], { color: C.ink, dash: "3 4", width: 1.2 });
      Q.path(fin.map((v, k) => [k, v]), { color: C.orange, width: 1.6 }); fin.forEach((v, k) => Q.dot([k, clampY(Q, v)], { color: C.orange, r: 3 }));
      const last = fin.slice(-4), div = fin.length < ws.length;
      const conv = !div && Math.abs(last[3] - D.w) < 1e-3;
      out.innerHTML = `<table><tr><td>η</td><td>${fmt(eta, 2)}</td></tr><tr><td>stability limit at the start, 2/L″(0)</td><td>8.94</td></tr><tr><td>stability limit at the minimum, 2/L″(w*)</td><td>1.26</td></tr><tr><td>outcome</td><td><b>${div ? "diverges" : conv ? "converges to w* = 0.718" : "settles into a cycle: " + last.map(v => fmt(v, 2)).join(", ")}</b></td></tr></table>
        <p>Neuron 332's spike counts against standardised wheel speed, with a Poisson model e<sup>c + wx</sup>. The loss is convex, but its curvature grows seven-fold between w = 0 and the minimum, so a learning rate that is safe at the start can be far too large near the end. Slide η past 1.26 to see 2-cycles, then 3-cycles, then divergence.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });
})();
