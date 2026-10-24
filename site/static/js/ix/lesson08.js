/* Lesson 8: Functions, Limits and Continuity. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson08/data.json").then(r => r.json()));
  const rad = d => d * Math.PI / 180;
  const sig = x => 1 / (1 + Math.exp(-x));
  const NR = (c, r0, rm, c50, n) => r0 + rm * Math.pow(c, n) / (Math.pow(c, n) + Math.pow(c50, n));
  /* Draw y = f(x) on a plane, breaking the line where f is not finite or leaves the plot by a lot. */
  function curve(P, f, s = {}, x0 = P.opts.x[0], x1 = P.opts.x[1], n = 400) {
    const [y0, y1] = P.opts.y, span = y1 - y0; let seg = [];
    const flush = () => { if (seg.length > 1) P.path(seg, s); seg = []; };
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = f(x);
      if (!isFinite(y) || y < y0 - 2 * span || y > y1 + 2 * span) { flush(); continue; }
      if (s.breakAt && seg.length && s.breakAt(seg[seg.length - 1][0], x)) flush();
      seg.push([x, y]);
    }
    flush();
  }
  const band = (P, x0, x1, col, op = 0.18) => el("rect", { x: P.X(x0), y: P.Y(P.opts.y[1]), width: P.X(x1) - P.X(x0), height: P.Y(P.opts.y[0]) - P.Y(P.opts.y[1]), fill: col, "fill-opacity": op }, P.layer);

  /* 1. Four measurements, three functions, three stories. */
  IX.register("three-stories", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 200], y: [-40, 45], xtick: 25, ytick: 10, labels: ["contrast (%)", "rate (spikes/s)"], width: 480, height: 380, pad: 44, clip: true, title: "Three fitted functions" });
    const side = h("div", {}, L);
    let D = null, c = 10;
    const sl = slider(side, { label: "Contrast", min: 0, max: 200, step: 1, value: c, format: v => v + "%", onInput: v => { c = v; draw(); } });
    player(side, sl, { interval: 40 });
    const out = readout(side);
    function fs() {
      return [
        { n: "saturating", col: C.blue, f: x => NR(x, ...D.nr) },
        { n: "logarithmic", col: C.green, f: x => D.logc[0] * Math.log1p(x / 2) + D.logc[1] },
        { n: "quadratic", col: C.vermilion, f: x => (D.quadc[0] * x + D.quadc[1]) * x + D.quadc[2] }];
    }
    function draw() {
      if (!D) return; P.clear();
      band(P, 100, 200, C.axis, 0.2);
      P.text("contrast above 100% is impossible", 150, 41, { anchor: "middle", color: C.muted, size: 12 });
      const F = fs();
      F.forEach(o => curve(P, o.f, { color: o.col, width: 2.4 }));
      P.line([c, -40], [c, 45], { color: C.ink, width: 1 });
      F.forEach(o => P.dot([c, o.f(c)], { color: o.col, r: 5.5 }));
      [[0, 4], [25, 21], [50, 27], [100, 30]].forEach(p => P.dot(p, { color: C.ink, r: 6 }));
      out.innerHTML = `<p>Predicted rate at <b>${c}%</b> contrast:</p><table>${F.map(o => `<tr><td><span style="color:${o.col};font-weight:700">${o.n}</span></td><td><b>${fmt(o.f(c), 1)}</b> spikes/s</td></tr>`).join("")}</table>
        <p>${c > 100 ? "Beyond the data the three stories part company completely; the parabola even predicts a negative rate." : c > 0 && c < 25 ? "Between the measurements at 0% and 25%, the functions already disagree by several spikes/s." : "All three pass close to the four black measurements."}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 2. The Naka-Rushton function: four parameters, four roles. */
  IX.register("naka-rushton", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 100], y: [0, 60], xtick: 20, ytick: 10, labels: ["contrast c (%)", "rate (spikes/s)"], width: 480, height: 360, pad: 44, clip: true, title: "Contrast-response function" });
    const side = h("div", {}, L);
    const p = { r0: 2, rm: 30, c50: 15, n: 2.5 };
    slider(side, { label: "r₀ baseline", min: 0, max: 15, step: 0.5, value: p.r0, onInput: v => { p.r0 = v; draw(); } });
    slider(side, { label: "r<sub>max</sub> gain", min: 5, max: 45, step: 1, value: p.rm, onInput: v => { p.rm = v; draw(); } });
    const s3 = slider(side, { label: "c₅₀", min: 2, max: 80, step: 1, value: p.c50, format: v => v + "%", onInput: v => { p.c50 = v; draw(); } });
    slider(side, { label: "n steepness", min: 0.5, max: 6, step: 0.1, value: p.n, format: v => fmt(v, 1), onInput: v => { p.n = v; draw(); } });
    player(side, s3, { bounce: true, interval: 60 });
    const out = readout(side);
    function draw() {
      P.clear();
      P.line([0, p.r0], [100, p.r0], { color: C.muted, dash: "4 4", width: 1.2 });
      P.line([0, p.r0 + p.rm], [100, p.r0 + p.rm], { color: C.muted, dash: "4 4", width: 1.2 });
      curve(P, c => NR(c, p.r0, p.rm, p.c50, p.n), { color: C.blue, width: 2.8 }, 0.001, 100);
      P.line([p.c50, 0], [p.c50, p.r0 + p.rm / 2], { color: C.orange, dash: "3 3", width: 1.2 });
      P.dot([p.c50, p.r0 + p.rm / 2], { color: C.orange, r: 6 });
      out.innerHTML = `<p>r(c) = ${fmt(p.r0, 1)} + ${p.rm} c<sup>${fmt(p.n, 1)}</sup> / (c<sup>${fmt(p.n, 1)}</sup> + ${p.c50}<sup>${fmt(p.n, 1)}</sup>)</p>
        <table><tr><td>r₀</td><td>raise: the rate at zero contrast</td></tr><tr><td>r<sub>max</sub></td><td>vertical stretch: the range above baseline</td></tr><tr><td>c₅₀</td><td>shift: the contrast giving half the range (<span class="k-orange">orange dot</span>)</td></tr><tr><td>n</td><td>steepness of the rise</td></tr></table>
        <p>The dashed lines are the two limits, r₀ and r₀ + r<sub>max</sub>. The variable is c; the four parameters describe one neuron.</p>`;
    }
    draw();
  });

  /* 3. Shift, stretch, scale and raise. */
  IX.register("transforms", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-6, 6], y: [-0.6, 2.2], xtick: 2, ytick: 0.5, labels: ["x", ""], width: 480, height: 340, pad: 40, clip: true, title: "Transforming a Gaussian bump" });
    const side = h("div", {}, L);
    const t = { a: 0, s: 1, A: 1, b: 0 };
    const sa = slider(side, { label: "Shift a", min: -3, max: 3, step: 0.1, value: 0, format: v => fmt(v, 1), onInput: v => { t.a = v; draw(); } });
    slider(side, { label: "Stretch s", min: 0.4, max: 2.5, step: 0.05, value: 1, format: v => fmt(v, 2), onInput: v => { t.s = v; draw(); } });
    slider(side, { label: "Scale A", min: 0.3, max: 2, step: 0.05, value: 1, format: v => fmt(v, 2), onInput: v => { t.A = v; draw(); } });
    slider(side, { label: "Raise b", min: -0.5, max: 1, step: 0.05, value: 0, format: v => fmt(v, 2), onInput: v => { t.b = v; draw(); } });
    player(side, sa, { bounce: true, interval: 50 });
    const out = readout(side);
    const f = x => Math.exp(-x * x / 2);
    function draw() {
      P.clear();
      curve(P, f, { color: C.ink, width: 1.6, dash: "5 4" });
      curve(P, x => t.A * f((x - t.a) / t.s) + t.b, { color: C.blue, width: 3 });
      out.innerHTML = `<p class="big">g(x) = ${fmt(t.A, 2)} · f((x − ${fmt(t.a, 1)}) / ${fmt(t.s, 2)}) + ${fmt(t.b, 2)}</p>
        <p>Dashed: the original f(x) = e<sup>−x²/2</sup>. Blue: the transformed graph. Note that <b>x − a</b> moves the graph to the <b>right</b> when a &gt; 0. In neuroscience, a shift is a preferred stimulus or threshold, a stretch a tuning width, a scale a gain, and a raise a baseline.</p>`;
    }
    draw();
  });

  /* 4. Inverses and the horizontal line test. */
  IX.register("inverse", root => {
    const fns = [
      { label: "Contrast response", x: [0, 100], y: [0, 36], xl: "contrast (%)", f: c => NR(c, 2, 30, 15, 2.5), unit: "%", xt: 20 },
      { label: "Cosine direction tuning", x: [0, 360], y: [0, 40], xl: "movement direction (°)", f: th => 20 + 15 * Math.cos(rad(th - 90)), unit: "°", xt: 90 }];
    let F = fns[0], y = 17;
    buttons(root, fns, it => { F = it; build(); }, { toggle: true, label: "Function" });
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const sl = slider(side, { label: "Rate y", min: 1, max: 38, step: 0.5, value: y, format: v => fmt(v, 1) + " /s", onInput: v => { y = v; draw(); } });
    player(side, sl, { bounce: true, interval: 60 });
    const out = readout(side);
    let P;
    function build() { left.innerHTML = ""; P = Plane(left, { x: F.x, y: F.y, xtick: F.xt, ytick: 10, labels: [F.xl, "rate (spikes/s)"], width: 480, height: 340, pad: 44, clip: true, title: F.label }); draw(); }
    function draw() {
      P.clear(); curve(P, F.f, { color: C.blue, width: 2.8 });
      P.line([F.x[0], y], [F.x[1], y], { color: C.orange, width: 1.8, dash: "6 4" });
      const sols = []; const n = 2000;
      for (let i = 0; i < n; i++) { const a = F.x[0] + (F.x[1] - F.x[0]) * i / n, b = a + (F.x[1] - F.x[0]) / n, fa = F.f(a) - y, fb = F.f(b) - y; if (fa === 0 || fa * fb < 0) sols.push(a + (b - a) * Math.abs(fa) / (Math.abs(fa) + Math.abs(fb))); }
      sols.forEach(x => { P.line([x, y], [x, F.y[0]], { color: C.orange, width: 1.2 }); P.dot([x, y], { color: C.vermilion, r: 6 }); });
      out.innerHTML = `<p>Inputs that give ${fmt(y, 1)} spikes/s: <b>${sols.length ? sols.map(x => fmt(x, 1) + F.unit).join(" and ") : "none"}</b></p>
        <p>${sols.length > 1 ? "The horizontal line meets the graph twice: this function fails the horizontal line test, so the rate alone cannot tell you the input. It has no inverse on this domain." : sols.length === 1 ? "Exactly one input: the function is one-to-one, and its inverse reads the input back from the rate." : "This rate is outside the function's range, so no input produces it."}</p>`;
    }
    build();
  });

  /* 5. A gallery of function families. */
  IX.register("gallery", root => {
    const fam = [
      { label: "affine", f: x => 0.5 + 0.4 * x, dom: "ℝ → ℝ", use: "weighted sums; local approximations", form: "0.5 + 0.4x" },
      { label: "polynomial", f: x => 0.05 * x ** 3 - 0.3 * x ** 2 + 0.5, dom: "ℝ → ℝ", use: "Taylor approximations; features", form: "0.05x³ − 0.3x² + 0.5" },
      { label: "exponential", f: x => Math.exp(x / 2), dom: "ℝ → (0, ∞)", use: "decay, growth, Poisson link", form: "e<sup>x/2</sup>" },
      { label: "logarithm", f: x => x > 0 ? Math.log(x) : NaN, dom: "(0, ∞) → ℝ", use: "intensity perception; log-likelihoods", form: "ln x" },
      { label: "logistic σ", f: sig, dom: "ℝ → (0, 1)", use: "probabilities; classifiers; gates", form: "1 / (1 + e<sup>−x</sup>)" },
      { label: "tanh", f: Math.tanh, dom: "ℝ → (−1, 1)", use: "rate models; recurrent networks", form: "tanh x = 2σ(2x) − 1" },
      { label: "ReLU", f: x => Math.max(0, x), dom: "ℝ → [0, ∞)", use: "threshold-linear units", form: "max(0, x)" },
      { label: "softplus", f: x => Math.log1p(Math.exp(-Math.abs(x))) + Math.max(x, 0), dom: "ℝ → (0, ∞)", use: "a smooth ReLU", form: "ln(1 + e<sup>x</sup>)" },
      { label: "Gaussian", f: x => Math.exp(-((x - 1) ** 2) / 2), dom: "ℝ → (0, 1]", use: "place fields; orientation tuning", form: "e<sup>−(x−1)²/2</sup>" }];
    let F = fam[4], k = 1;
    buttons(root, fam, it => { F = it; draw(); }, { toggle: true, active: 4, label: "Family" });
    const L = layout(root, true);
    const P = Plane(L, { x: [-4, 6], y: [-2, 4], xtick: 1, ytick: 1, labels: ["x", ""], width: 480, height: 340, pad: 36, clip: true, title: "Function family" });
    const side = h("div", {}, L);
    const sl = slider(side, { label: "Input gain k", min: 0.25, max: 8, step: 0.05, value: 1, format: v => fmt(v, 2), onInput: v => { k = v; draw(); } });
    player(side, sl, { bounce: true, interval: 50 });
    const out = readout(side);
    function draw() {
      P.clear();
      curve(P, F.f, { color: C.axis, width: 1.4, dash: "4 4" });
      curve(P, x => F.f(k * x), { color: C.blue, width: 3 }, -4, 6, 800);
      out.innerHTML = `<table><tr><td>formula</td><td><b>${F.form}</b></td></tr><tr><td>domain → range</td><td>${F.dom}</td></tr><tr><td>typical use</td><td>${F.use}</td></tr></table>
        <p>Blue: f(kx). Dashed: f(x). The input gain squeezes the graph horizontally by 1/k. ${F.label.startsWith("logistic") || F.label === "tanh" ? "Turn k up: the S-curve gets ever steeper and approaches a step, the limit as k → ∞." : ""}</p>`;
    }
    draw();
  });

  /* 6. Zooming in on a limit. */
  IX.register("limit-zoom", root => {
    const fns = [
      { label: "sin(x)/x at 0", a: 0, Lm: 1, f: x => Math.sin(x) / x },
      { label: "(x²−1)/(x−1) at 1", a: 1, Lm: 2, f: x => (x * x - 1) / (x - 1) },
      { label: "(eˣ−1)/x at 0", a: 0, Lm: 1, f: x => (Math.exp(x) - 1) / x },
      { label: "x sin(1/x) at 0", a: 0, Lm: 0, f: x => x * Math.sin(1 / x) }];
    let F = fns[0], z = 0;
    buttons(root, fns, it => { F = it; draw(); }, { toggle: true, label: "Function" });
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const sl = slider(side, { label: "Zoom", min: 0, max: 3, step: 0.05, value: 0, format: v => "×" + fmt(Math.pow(10, v), v > 1 ? 0 : 1), onInput: v => { z = v; draw(); } });
    player(side, sl, { interval: 50 });
    const out = readout(side);
    function draw() {
      left.innerHTML = "";
      const w = 3 * Math.pow(10, -z), xs = []; for (let i = 0; i <= 600; i++) { const x = F.a - w + 2 * w * i / 600; if (x !== F.a) xs.push([x, F.f(x)]); }
      let e = Math.max(...xs.map(p => Math.abs(p[1] - F.Lm))); e = Math.max(e, 1e-6) * 1.15;
      const P = Plane(left, { x: [F.a - w, F.a + w], y: [F.Lm - e * 1.6, F.Lm + e * 1.6], noXTicks: true, noYTicks: true, frame: true, labels: ["", ""], width: 460, height: 340, pad: 30, clip: true, title: "Zooming towards the limit" });
      el("rect", { x: P.X(F.a - w), y: P.Y(F.Lm + e), width: P.X(F.a + w) - P.X(F.a - w), height: P.Y(F.Lm - e) - P.Y(F.Lm + e), fill: C.green, "fill-opacity": 0.1 }, P.layer);
      P.line([F.a - w, F.Lm], [F.a + w, F.Lm], { color: C.green, width: 1.2, dash: "5 4" });
      P.path(xs, { color: C.blue, width: 2.4 });
      P.dot([F.a, F.Lm], { fill: "#fff", stroke: C.blue, sw: 2, r: 6 });
      P.text(`x from ${fmt(F.a - w, 4)} to ${fmt(F.a + w, 4)}`, F.a, F.Lm - e * 1.5, { anchor: "middle", color: C.muted, size: 12, halo: true });
      const h1 = w / 3;
      out.innerHTML = `<table><tr><td>window around a = ${F.a}</td><td>± ${fmt(w, 5)}</td></tr><tr><td>f stays within</td><td><b>± ${e < 1e-4 ? e.toExponential(1) : fmt(e, 5)}</b> of L = ${F.Lm}</td></tr>
        <tr><td>f(a − ${fmt(h1, 5)})</td><td>${fmt(F.f(F.a - h1), 8)}</td></tr><tr><td>f(a + ${fmt(h1, 5)})</td><td>${fmt(F.f(F.a + h1), 8)}</td></tr><tr><td>f(a)</td><td>undefined (0/0)</td></tr></table>
        <p>Zoom in: the green band (±ε) needed to contain the graph keeps shrinking. That is what "the limit is L" means: any band, however thin, is respected once x is close enough to a. The open circle is the point the function never takes.</p>`;
    }
    draw();
  });

  /* 7. Approaching a point from the left and from the right. */
  IX.register("approach", root => {
    const cases = [
      { label: "Step neuron", a: 1, x: [0, 2], y: [-5, 50], f: x => x >= 1 ? 40 : 0, val: 40, kind: "jump", xl: "input current (nA)" },
      { label: "Integrate-and-fire", a: 1, x: [0.8, 1.6], y: [-3, 45], f: x => x > 1 ? 1 / (0.002 + 0.02 * Math.log(x / (x - 1))) : 0, val: 0, kind: "continuous", xl: "input current (nA)" },
      { label: "Removable", a: 1, x: [-1, 3], y: [-1, 5], f: x => (x * x - 1) / (x - 1), val: 3, kind: "removable", xl: "x" },
      { label: "Infinite (1/x)", a: 0, x: [-2, 2], y: [-10, 10], f: x => 1 / x, val: NaN, kind: "infinite", xl: "x" },
      { label: "ReLU corner", a: 0, x: [-2, 2], y: [-0.5, 2], f: x => Math.max(0, x), val: 0, kind: "corner", xl: "x" }];
    let F = cases[0], e = 0;
    buttons(root, cases, it => { F = it; build(); }, { toggle: true, label: "Function" });
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const sl = slider(side, { label: "Distance h", min: 0, max: 3, step: 0.05, value: 0, format: v => fmt(0.3 * Math.pow(10, -v), 4), onInput: v => { e = v; draw(); } });
    player(side, sl, { interval: 60 });
    const out = readout(side);
    let P;
    function build() { left.innerHTML = ""; P = Plane(left, { x: F.x, y: F.y, frame: true, xtick: (F.x[1] - F.x[0]) / 4, ytick: (F.y[1] - F.y[0]) / 5 > 5 ? 10 : (F.y[1] - F.y[0]) > 6 ? 5 : 1, labels: [F.xl, ""], width: 460, height: 340, pad: 40, clip: true, title: F.label }); draw(); }
    function draw() {
      P.clear();
      curve(P, F.f, { color: C.blue, width: 2.6, breakAt: (u, v) => (u - F.a) * (v - F.a) <= 0 }, F.x[0], F.x[1], 800);
      if (isFinite(F.val)) P.dot([F.a, F.val], { color: C.ink, r: 5.5 });
      if (F.kind === "removable") P.dot([F.a, 2], { fill: "#fff", stroke: C.blue, sw: 2, r: 5.5 });
      if (F.kind === "jump") P.dot([F.a, 0], { fill: "#fff", stroke: C.blue, sw: 2, r: 5.5 });
      const hh = 0.3 * Math.pow(10, -e), l = F.f(F.a - hh), r = F.f(F.a + hh);
      [[F.a - hh, l, C.orange], [F.a + hh, r, C.purple]].forEach(([x, y, c]) => { if (isFinite(y)) { P.line([x, F.y[0]], [x, Math.max(F.y[0], Math.min(F.y[1], y))], { color: c, width: 1, dash: "3 3" }); P.dot([x, Math.max(F.y[0], Math.min(F.y[1], y))], { color: c, r: 6 }); } });
      const verdict = { jump: "Left limit 0, right limit 40: they differ, so there is no limit. A <b>jump</b> discontinuity.", continuous: "Both one-sided limits are 0 and f(1) = 0: <b>continuous</b>. But the right side approaches 0 only logarithmically slowly: still about 7 spikes/s at 0.001 nA above threshold.", removable: "Both sides approach 2, but f(1) has been set to 3. A <b>removable</b> discontinuity: redefine f(1) = 2 and it is gone.", infinite: "Left side → −∞, right side → +∞: an <b>infinite</b> discontinuity (a vertical asymptote).", corner: "Both sides approach 0 = f(0): <b>continuous</b>, but with a corner. Continuous is not the same as smooth." }[F.kind];
      out.innerHTML = `<table><tr><td><span class="k-orange">f(a − h)</span></td><td>${isFinite(l) ? fmt(l, 4) : "—"}</td></tr><tr><td><span class="k-purple">f(a + h)</span></td><td>${isFinite(r) ? fmt(r, 4) : "—"}</td></tr><tr><td>f(a)</td><td>${isFinite(F.val) ? F.val : "undefined"}</td></tr></table><p>${verdict}</p><p class="ix-hint">Press Play to shrink h towards 0.</p>`;
    }
    build();
  });

  /* 8. Approaching a limit on a computer. */
  IX.register("float-limit", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-17.5, -0.5], y: [-17, 1], noXTicks: true, noYTicks: true, frame: true, labels: ["h", "error"], width: 480, height: 340, pad: 50, title: "Rounding error in ((1 + h) − 1)/h" });
    [-16, -12, -8, -4, -1].forEach(v => P.text("10" + String(v).split("").map(c => ({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 4: "⁴", 6: "⁶", 8: "⁸" })[c] || c).join(""), v, -17, { dy: 18, anchor: "middle", color: C.muted, size: 12, layer: P.back }));
    [-15, -10, -5, 0].forEach(v => P.text(v === 0 ? "1" : "10" + String(v).split("").map(c => ({ "-": "⁻", 0: "⁰", 1: "¹", 5: "⁵" })[c] || c).join(""), -17.5, v, { dx: -6, dy: 4, anchor: "end", color: C.muted, size: 12, layer: P.back }));
    const side = h("div", {}, L);
    let e = -1;
    const sl = slider(side, { label: "Shrink h", min: 1, max: 17, step: 0.25, value: 1, format: v => "1e−" + fmt(v, 2), onInput: v => { e = -v; draw(); } });
    player(side, sl, { interval: 120 });
    const out = readout(side);
    const err = x => { const hh = Math.pow(10, x), v = ((1 + hh) - 1) / hh; return { v, er: Math.abs(v - 1) }; };
    function draw() {
      P.clear();
      const pts = []; for (let x = -1; x >= -17; x -= 0.25) pts.push([x, Math.log10(Math.max(err(x).er, 1e-16))]);
      P.path(pts, { color: C.axis, width: 1 });
      pts.filter(p => p[0] >= e).forEach(p => P.dot(p, { color: C.vermilion, r: 3.5, sw: 0 }));
      const r = err(e);
      P.dot([e, Math.log10(Math.max(r.er, 1e-16))], { color: C.ink, r: 6 });
      out.innerHTML = `<table><tr><td>h</td><td>10<sup>${fmt(e, 2)}</sup></td></tr><tr><td>computed ((1 + h) − 1)/h</td><td><b>${r.v.toPrecision(16)}</b></td></tr><tr><td>exact value</td><td>1</td></tr></table>
        <p>Your browser computes this with the same 16-digit floating-point numbers as NumPy. ${e > -8 ? "For moderate h the answer is essentially exact." : e > -15.9 ? "Below about 10⁻⁸ the subtraction of two nearly equal numbers leaves mostly rounding error: shrinking h makes the answer <b>worse</b>." : "At h = 10⁻¹⁶, 1 + h rounds to exactly 1, and the computed value collapses."}</p>`;
    }
    draw();
  });

  /* 9. Bisection, and how it fails on a jump. */
  IX.register("bisection", root => {
    const cases = [
      { label: "Contrast response (target 20 spikes/s)", f: c => NR(c, 2, 30, 15, 2.5), a: 0, b: 100, y: 20, x: [0, 100], yr: [0, 35], xl: "contrast (%)" },
      { label: "Step neuron (target 20 spikes/s)", f: x => x >= 1 ? 40 : 0, a: 0, b: 3, y: 20, x: [0, 3], yr: [-4, 45], xl: "input current (nA)" }];
    let F = cases[0], k = 0;
    buttons(root, cases, it => { F = it; build(); }, { toggle: true, label: "Solve f(x) = y for" });
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const sl = slider(side, { label: "Step", min: 0, max: 20, step: 1, value: 0, onInput: v => { k = v; draw(); } });
    player(side, sl, { interval: 450 });
    const out = readout(side);
    let P;
    function build() { left.innerHTML = ""; P = Plane(left, { x: F.x, y: F.yr, frame: true, xtick: F.x[1] > 10 ? 20 : 0.5, ytick: 10, labels: [F.xl, "rate"], width: 460, height: 340, pad: 40, clip: true, title: "Bisection" }); draw(); }
    function draw() {
      P.clear();
      let a = F.a, b = F.b; const hist = [];
      for (let i = 0; i < k; i++) { const m = (a + b) / 2; hist.push([a, b, m]); if ((F.f(a) - F.y) * (F.f(m) - F.y) <= 0) b = m; else a = m; }
      band(P, a, b, C.orange, 0.22);
      curve(P, F.f, { color: C.blue, width: 2.6, breakAt: (u, v) => F.x[1] < 10 && (u - 1) * (v - 1) <= 0 && u !== 1 }, F.x[0], F.x[1], 900);
      P.line([F.x[0], F.y], [F.x[1], F.y], { color: C.green, width: 1.4, dash: "5 4" });
      const m = (a + b) / 2; P.dot([m, F.f(m)], { color: C.ink, r: 5 });
      out.innerHTML = `<table><tr><td>interval after ${k} steps</td><td>[${fmt(a, 6)}, ${fmt(b, 6)}]</td></tr><tr><td>width</td><td>${(b - a).toExponential(2)}</td></tr><tr><td>midpoint</td><td><b>${fmt(m, 6)}</b>, where f = ${fmt(F.f(m), 3)}</td></tr></table>
        <p>${F.x[1] > 10 ? "Each step keeps the half (orange) where f − 20 still changes sign; the intermediate value theorem guarantees a solution inside. It halves the uncertainty every time: the answer is 17.64%." : "The signs still change across the jump, so bisection homes in on x = 1, but there f jumps from 0 to 40: no input gives 20 spikes/s. Without continuity the guarantee is gone."}</p>`;
    }
    build();
  });

  /* 10. Aliasing. */
  IX.register("aliasing", root => {
    const P = Plane(root, { x: [0, 2], y: [-1.3, 1.3], xtick: 0.25, ytick: 1, labels: ["time (s)", ""], width: 780, height: 300, pad: 40, clip: true, frame: true, title: "A 9 Hz rhythm and its samples" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let fs = 10;
    const sl = slider(ctl, { label: "Sampling rate", min: 4, max: 40, step: 0.5, value: fs, format: v => fmt(v, 1) + " Hz", onInput: v => { fs = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 120 });
    const out = readout(root);
    const f = 9;
    function draw() {
      P.clear();
      curve(P, t => Math.sin(2 * Math.PI * f * t), { color: C.axis, width: 1.2 }, 0, 2, 1200);
      const pts = []; for (let t = 0; t <= 2 + 1e-9; t += 1 / fs) pts.push([t, Math.sin(2 * Math.PI * f * t)]);
      P.path(pts, { color: C.vermilion, width: 2 }); pts.forEach(p => P.dot(p, { color: C.vermilion, r: 4 }));
      const k = Math.round(f / fs), app = Math.abs(f - k * fs);
      out.innerHTML = `<p>Grey: the true 9 Hz rhythm. Vermilion: what you see if you sample at ${fmt(fs, 1)} Hz and join the dots. ${fs > 18 ? `Above the Nyquist rate (18 Hz): the samples follow the true rhythm.` : `Below the Nyquist rate of 18 Hz, the samples look like a <b>${fmt(app, 1)} Hz</b> rhythm instead: aliasing.`}</p>`;
    }
    draw();
  });

  /* 11. A real neuron's speed response, and five fitted families. */
  IX.register("speed-fit", root => {
    const fam = [
      { k: "constant", col: C.sky, f: (s, p) => p[0] },
      { k: "linear", col: C.blue, f: (s, p) => p[0] + p[1] * s },
      { k: "threshold-linear", col: C.orange, f: (s, p) => p[0] + p[1] * Math.max(s - p[2], 0) },
      { k: "saturating exponential", col: C.green, f: (s, p) => p[0] + p[1] * (1 - Math.exp(-s / p[2])), dash: "6 5" },
      { k: "logistic", col: C.purple, f: (s, p) => p[0] + p[1] / (1 + Math.exp(-p[2] * (s - p[3]))) }];
    const holder = h("div", {}, root);
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, xm = 2200;
    const sl = slider(ctl, { label: "Show speeds up to", min: 2200, max: 5000, step: 50, value: xm, format: v => v + " steps/s", onInput: v => { xm = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 40 });
    const out = readout(root);
    function draw() {
      if (!D) return; holder.innerHTML = "";
      const ymax = Math.min(150, Math.max(60, ...fam.map(F => F.f(xm, D.fits[F.k].p))) * 1.05);
      const P = Plane(holder, { x: [0, xm], y: [-5, ymax], xtick: 500, ytick: ymax > 80 ? 20 : 10, frame: true, labels: ["wheel speed (steps/s)", "rate (spikes/s)"], width: 780, height: 360, pad: 50, clip: true, title: "Speed response of one motor-cortex neuron" });
      band(P, D.p99, xm, C.axis, 0.25);
      fam.forEach(F => curve(P, s => F.f(s, D.fits[F.k].p), { color: F.col, width: 2.4, dash: F.dash || "" }, 0, xm, 500));
      D.mq.forEach((m, i) => { P.line([m, D.yq[i] - D.eq[i]], [m, D.yq[i] + D.eq[i]], { color: C.ink, width: 1.4 }); P.dot([m, D.yq[i]], { color: C.ink, r: 4.5 }); });
      D.mt.forEach((m, i) => P.dot([m, D.yt[i]], { fill: "#fff", stroke: C.ink, sw: 1.6, r: 4 }));
      out.innerHTML = `<table><tr><th>family</th><th>test R²</th><th>rate at ${xm} steps/s</th></tr>${fam.map(F => `<tr><td><span style="color:${F.col};font-weight:700">${F.k}</span></td><td>${fmt(D.fits[F.k].r2, 3)}</td><td>${fmt(F.f(xm, D.fits[F.k].p), 1)}</td></tr>`).join("")}</table>
        <p>Black dots: training trials, averaged in equal-count speed bins (± s.e.m.); open circles: test trials. Grey: beyond the 99th percentile of speed. Within the data the curves nearly agree; slide to faster speeds and they part company. The saturating exponential (dashed) lies exactly on the straight line: its bend is far beyond the data.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });
})();
