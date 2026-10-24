/* Lesson 9: Derivatives and Sensitivity. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson09/data.json").then(r => r.json()));
  const sig = x => 1 / (1 + Math.exp(-x));
  function curve(P, f, s = {}, x0 = P.opts.x[0], x1 = P.opts.x[1], n = 400) {
    const [y0, y1] = P.opts.y, span = y1 - y0; let seg = [];
    const flush = () => { if (seg.length > 1) P.path(seg, s); seg = []; };
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); if (!isFinite(y) || y < y0 - 2 * span || y > y1 + 2 * span) { flush(); continue; } seg.push([x, y]); }
    flush();
  }
  const sup = v => String(v).split("").map(c => ({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" })[c] || c).join("");
  function rng(seed) { let a = seed >>> 0; const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return () => { const u1 = u() || 1e-12, u2 = u(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }; }
  const r0 = 44.8, A = 59.8, s0 = 11.0, rs = s => r0 + A * (1 - Math.exp(-s / s0)), drs = s => A / s0 * Math.exp(-s / s0);

  /* 1. Secants turn into the tangent. */
  IX.register("secant", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 40], y: [40, 120], xtick: 5, ytick: 10, frame: true, labels: ["running speed s (cm/s)", "rate (spikes/s)"], width: 480, height: 380, pad: 46, clip: true, title: "Secant and tangent" });
    const side = h("div", {}, L);
    let s = 5, e = 20;
    slider(side, { label: "Speed s", min: 0, max: 35, step: 0.5, value: s, format: v => fmt(v, 1) + " cm/s", onInput: v => { s = v; draw(); } });
    const sh = slider(side, { label: "Step h", min: 0, max: 3, step: 0.05, value: 0, format: v => fmt(20 * Math.pow(10, -v), 3), onInput: v => { e = 20 * Math.pow(10, -v); draw(); } });
    player(side, sh, { interval: 60 });
    const out = readout(side);
    function draw() {
      P.clear(); curve(P, rs, { color: C.ink, width: 2.4 });
      const m = (rs(s + e) - rs(s)) / e, d = drs(s);
      P.line([s - 50, rs(s) - 50 * m], [s + 50, rs(s) + 50 * m], { color: C.orange, width: 2, dash: "6 4" });
      P.line([s - 50, rs(s) - 50 * d], [s + 50, rs(s) + 50 * d], { color: C.blue, width: 2.6 });
      P.dot([s + e, rs(s + e)], { color: C.orange, r: 6 }); P.dot([s, rs(s)], { color: C.ink, r: 6 });
      out.innerHTML = `<table><tr><td><span class="k-orange">secant slope</span>, h = ${fmt(e, 3)}</td><td><b>${fmt(m, 4)}</b></td></tr><tr><td><span class="k-blue">tangent slope r′(${fmt(s, 1)})</span></td><td><b>${fmt(d, 4)}</b></td></tr></table>
        <p>Units: spikes/s per cm/s. ${e > 1 ? "A big step averages the slope over a long stretch of the curve. Press Play to shrink h." : "As h shrinks, the secant turns into the tangent, and its slope approaches the derivative."} At this speed, 1 cm/s more raises the rate by about ${fmt(d, 2)} spikes/s.</p>`;
    }
    draw();
  });

  /* 2. A function and its derivative. */
  IX.register("f-and-fprime", root => {
    const fs = [
      { label: "Gaussian bump", f: x => Math.exp(-x * x / 2), d: x => -x * Math.exp(-x * x / 2), y: [-0.1, 1.1], dy: [-0.7, 0.7] },
      { label: "logistic σ", f: sig, d: x => sig(x) * (1 - sig(x)), y: [-0.1, 1.1], dy: [-0.05, 0.3] },
      { label: "tanh", f: Math.tanh, d: x => 1 - Math.tanh(x) ** 2, y: [-1.1, 1.1], dy: [-0.1, 1.1] },
      { label: "ReLU", f: x => Math.max(0, x), d: x => x > 0 ? 1 : x < 0 ? 0 : NaN, y: [-0.5, 4], dy: [-0.2, 1.2] },
      { label: "softplus", f: x => Math.log1p(Math.exp(-Math.abs(x))) + Math.max(x, 0), d: sig, y: [-0.5, 4], dy: [-0.1, 1.1] }];
    let F = fs[0], x = -1;
    buttons(root, fs, it => { F = it; build(); }, { toggle: true, label: "Function" });
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "f(x) and its tangent");
    h("p", { class: "ix-panel-title" }, b2, "f′(x): the slope at every x");
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const sl = slider(ctl, { label: "x", min: -4, max: 4, step: 0.05, value: x, format: v => fmt(v, 2), onInput: v => { x = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 40 });
    const out = readout(root);
    let P, Q;
    function build() {
      b1.querySelectorAll("svg").forEach(s => s.remove()); b2.querySelectorAll("svg").forEach(s => s.remove());
      P = Plane(b1, { x: [-4, 4], y: F.y, xtick: 1, ytick: F.y[1] > 2 ? 1 : 0.5, labels: ["x", ""], width: 380, height: 280, pad: 34, clip: true, title: "f" });
      Q = Plane(b2, { x: [-4, 4], y: F.dy, xtick: 1, ytick: F.dy[1] > 0.5 ? 0.5 : 0.1, labels: ["x", ""], width: 380, height: 280, pad: 34, clip: true, title: "f prime" });
      draw();
    }
    function draw() {
      P.clear(); Q.clear();
      curve(P, F.f, { color: C.ink, width: 2.4 }); curve(Q, F.d, { color: C.vermilion, width: 2.4 }, -4, 4, 800);
      const y = F.f(x), d = F.d(x);
      if (isFinite(d)) P.line([x - 1.2, y - 1.2 * d], [x + 1.2, y + 1.2 * d], { color: C.blue, width: 2.6 });
      P.dot([x, y], { color: C.blue, r: 6 }); if (isFinite(d)) Q.dot([x, d], { color: C.blue, r: 6 });
      Q.line([x, F.dy[0]], [x, F.dy[1]], { color: C.axis, width: 1 });
      out.innerHTML = `<p>At x = ${fmt(x, 2)}: f = ${fmt(y, 4)}, slope f′ = <b>${isFinite(d) ? fmt(d, 4) : "undefined (a corner)"}</b>.</p>
        <p>${F.label === "logistic σ" ? "σ′ = σ(1 − σ) is never more than 1/4, and is tiny where σ saturates: σ′(5) = 0.0067." : F.label === "ReLU" ? "ReLU′ is 0 on the left and 1 on the right; at 0 there is a corner and no single tangent." : F.label === "softplus" ? "The slope of softplus is exactly the logistic sigmoid." : F.label === "tanh" ? "tanh′ = 1 − tanh² is 1 at the centre and dies away as tanh saturates." : "The slope is zero at the peak and largest where the bump is steepest."} The blue tangent's slope is the blue dot on the right.</p>`;
    }
    build();
  });

  /* 3. Local linear approximation. */
  IX.register("linear-approx", root => {
    const fs = [{ label: "√x at 4", f: Math.sqrt, d: x => 0.5 / Math.sqrt(x), d2: x => -0.25 * Math.pow(x, -1.5), a: 4, x: [0, 9], y: [0, 3.5] },
                { label: "eˣ at 0", f: Math.exp, d: Math.exp, d2: Math.exp, a: 0, x: [-2, 2], y: [-0.5, 6] }];
    let F = fs[0], dx = 0.1;
    buttons(root, fs, it => { F = it; build(); }, { toggle: true, label: "Function" });
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const sl = slider(side, { label: "Step Δx", min: -2, max: 2, step: 0.02, value: dx, format: v => fmt(v, 2), onInput: v => { dx = v; draw(); } });
    player(side, sl, { bounce: true, interval: 50 });
    const out = readout(side);
    let P;
    function build() { left.innerHTML = ""; P = Plane(left, { x: F.x, y: F.y, xtick: 1, ytick: 1, labels: ["x", ""], width: 460, height: 340, pad: 36, clip: true, title: "Tangent-line approximation" }); draw(); }
    function draw() {
      P.clear(); const a = F.a, fa = F.f(a), d = F.d(a), x = a + dx;
      curve(P, F.f, { color: C.ink, width: 2.4 }, Math.max(F.x[0], 1e-6), F.x[1]);
      P.line([a - 10, fa - 10 * d], [a + 10, fa + 10 * d], { color: C.blue, width: 2 });
      P.line([x, F.f(x)], [x, fa + d * dx], { color: C.vermilion, width: 3 });
      P.dot([a, fa], { color: C.ink, r: 6 }); P.dot([x, fa + d * dx], { color: C.blue, r: 5 }); P.dot([x, F.f(x)], { color: C.ink, r: 5 });
      const err = F.f(x) - fa - d * dx;
      out.innerHTML = `<table><tr><td>exact f(a + Δx)</td><td>${fmt(F.f(x), 5)}</td></tr><tr><td><span class="k-blue">f(a) + f′(a)Δx</span></td><td>${fmt(fa + d * dx, 5)}</td></tr><tr><td><span class="k-verm">error</span></td><td><b>${fmt(err, 5)}</b></td></tr><tr><td>½ f″(a) Δx²</td><td>${fmt(0.5 * F.d2(a) * dx * dx, 5)}</td></tr></table>
        <p>Near a, the curve hugs its tangent. Halve Δx and the error drops about four times: it shrinks like Δx².</p>`;
    }
    build();
  });

  /* 4. Sensitivity and the discrimination threshold. */
  IX.register("sensitivity", root => {
    const p = { r0: 2, rm: 30, c50: 15, n: 2.5 };
    const r = c => p.r0 + p.rm * Math.pow(c, p.n) / (Math.pow(c, p.n) + Math.pow(p.c50, p.n));
    const dr = c => p.rm * p.n * Math.pow(c, p.n - 1) * Math.pow(p.c50, p.n) / (Math.pow(c, p.n) + Math.pow(p.c50, p.n)) ** 2;
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Response and its tangent");
    h("p", { class: "ix-panel-title" }, b2, "Discrimination threshold = noise / slope");
    const P = Plane(b1, { x: [0, 100], y: [0, 35], xtick: 20, ytick: 10, frame: true, labels: ["contrast c (%)", "rate (spikes/s)"], width: 380, height: 320, pad: 42, clip: true, title: "Contrast response" });
    const Q = Plane(b2, { x: [0, 100], y: [-1, 2.2], xtick: 20, noYTicks: true, frame: true, labels: ["contrast c (%)", "threshold (% contrast)"], width: 380, height: 320, pad: 42, clip: true, title: "Threshold" });
    [0.1, 1, 10, 100].forEach(v => Q.text(String(v), 0, Math.log10(v), { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: Q.back }));
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let c = 15, nz = 1;
    const sl = slider(ctl, { label: "Contrast", min: 1, max: 95, step: 0.5, value: c, format: v => fmt(v, 1) + "%", onInput: v => { c = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 50 });
    slider(ctl, { label: "Noise δr", min: 0.25, max: 3, step: 0.25, value: nz, format: v => fmt(v, 2) + " /s", onInput: v => { nz = v; draw(); } });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      curve(P, r, { color: C.ink, width: 2.4 }, 0.01, 100);
      const s = dr(c);
      P.line([c - 30, r(c) - 30 * s], [c + 30, r(c) + 30 * s], { color: C.blue, width: 2.4 });
      el("rect", { x: P.X(c - nz / s / 2), y: P.Y(r(c) + nz / 2), width: Math.max(1, P.X(c + nz / s / 2) - P.X(c - nz / s / 2)), height: P.Y(r(c) - nz / 2) - P.Y(r(c) + nz / 2), fill: C.orange, "fill-opacity": 0.35 }, P.layer);
      P.dot([c, r(c)], { color: C.blue, r: 6 });
      curve(Q, x => Math.log10(nz / dr(x)), { color: C.green, width: 2.4 }, 0.5, 100);
      Q.dot([c, Math.log10(nz / s)], { color: C.blue, r: 6 });
      out.innerHTML = `<table><tr><td>slope r′(c)</td><td><b>${fmt(s, 3)}</b> spikes/s per %</td></tr><tr><td>smallest detectable change δr / r′</td><td><b>${fmt(nz / s, 2)}%</b> contrast</td></tr></table>
        <p>The orange box shows how much contrast change it takes to move the rate by the noise δr. The neuron discriminates best where it is <b>steepest</b> (10.7% contrast), not where it fires most: at 80% contrast the curve is nearly flat and the threshold is enormous.</p>`;
    }
    draw();
  });

  /* 5. The step-size trade-off for numerical derivatives, computed live. */
  IX.register("fd-error", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-16, -1], y: [-13, 0.5], noXTicks: true, noYTicks: true, frame: true, labels: ["step h", "error"], width: 480, height: 360, pad: 50, clip: true, title: "Error of numerical derivatives of e^x at 1" });
    [-16, -12, -8, -4, -1].forEach(v => P.text("10" + sup(v), v, -13, { dy: 18, anchor: "middle", color: C.muted, size: 12, layer: P.back }));
    [-12, -8, -4, 0].forEach(v => P.text(v ? "10" + sup(v) : "1", -16, v, { dx: -6, dy: 4, anchor: "end", color: C.muted, size: 12, layer: P.back }));
    const side = h("div", {}, L);
    let e = 2;
    const sl = slider(side, { label: "Shrink h", min: 1, max: 16, step: 0.25, value: e, format: v => "1e−" + fmt(v, 2), onInput: v => { e = v; draw(); } });
    player(side, sl, { interval: 100 });
    const out = readout(side);
    const f = Math.exp, x = 1, exact = Math.E;
    const fw = hh => Math.abs((f(x + hh) - f(x)) / hh - exact), ce = hh => Math.abs((f(x + hh) - f(x - hh)) / (2 * hh) - exact);
    function draw() {
      P.clear();
      const pts = []; for (let k = 1; k <= 16.001; k += 0.25) pts.push(-k);
      const lg = v => Math.log10(Math.max(v, 1e-14));
      P.path(pts.map(p => [p, lg(fw(Math.pow(10, p)))]), { color: C.vermilion, width: 2 });
      P.path(pts.map(p => [p, lg(ce(Math.pow(10, p)))]), { color: C.blue, width: 2 });
      P.path(pts.map(p => [p, lg(2.2e-16 * Math.E / Math.pow(10, p))]), { color: C.muted, width: 1.2, dash: "5 4" });
      const hh = Math.pow(10, -e);
      P.line([-e, -13], [-e, 0.5], { color: C.axis, width: 1 });
      P.dot([-e, lg(fw(hh))], { color: C.vermilion, r: 6 }); P.dot([-e, lg(ce(hh))], { color: C.blue, r: 6 });
      out.innerHTML = `<table><tr><td><span class="k-verm">forward error</span></td><td><b>${fw(hh).toExponential(1)}</b></td></tr><tr><td><span class="k-blue">central error</span></td><td><b>${ce(hh).toExponential(1)}</b></td></tr></table>
        <p>Computed live in your browser. Moving right (smaller h), truncation error falls: like h for forward, like h² for central. Then rounding error, which grows like 1/h (grey dashed), takes over. The central difference is best near h ≈ 10⁻⁵ (error ~10⁻¹¹); the forward difference near 10⁻⁸ (~10⁻⁸).</p>`;
    }
    draw();
  });

  /* 6. Differentiating noisy data. */
  IX.register("noisy-derivative", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 50], y: [-1.5, 2.5], xtick: 10, ytick: 0.5, frame: true, labels: ["time (ms)", "dV/dt (mV/ms)"], width: 480, height: 360, pad: 46, clip: true, title: "Derivative estimates of a noisy charging curve" });
    const side = h("div", {}, L);
    let sd = 0.2, k = 1;
    slider(side, { label: "Noise σ", min: 0, max: 0.5, step: 0.02, value: sd, format: v => fmt(v, 2) + " mV", onInput: v => { sd = v; draw(); } });
    const sk = slider(side, { label: "Step h", min: 1, max: 40, step: 1, value: k, format: v => fmt(v * 0.1, 1) + " ms", onInput: v => { k = v; draw(); } });
    player(side, sk, { interval: 120 });
    const out = readout(side);
    const dt = 0.1, n = 501, tt = [...Array(n).keys()].map(i => i * dt), g = rng(42), z = tt.map(() => g());
    function draw() {
      P.clear();
      const V = tt.map((t, i) => 10 * (1 - Math.exp(-t / 10)) + sd * z[i]);
      const D = []; let se = 0, m = 0;
      for (let i = k; i < n - k; i++) { const d = (V[i + k] - V[i - k]) / (2 * k * dt), tr = Math.exp(-tt[i] / 10); D.push([tt[i], d]); se += (d - tr) ** 2; m++; }
      P.path(D, { color: C.orange, width: 1.2 });
      curve(P, t => Math.exp(-t / 10), { color: C.ink, width: 2.4 }, 0, 50);
      const rms = Math.sqrt(se / m), pred = sd / (Math.SQRT2 * k * dt);
      out.innerHTML = `<table><tr><td>RMS error</td><td><b>${fmt(rms, 3)}</b> mV/ms</td></tr><tr><td>noise predicted σ/(√2 h)</td><td>${fmt(pred, 3)} mV/ms</td></tr></table>
        <p>V = 10(1 − e<sup>−t/10 ms</sup>) mV sampled every 0.1 ms, plus noise. Black: the true derivative (at most 1 mV/ms). Orange: the central difference. Halving the step doubles the noise; a longer step quiets it but blurs fast changes and loses the ends of the trace.</p>`;
    }
    draw();
  });

  /* 7. A real action potential: dV/dt, phase plot, and threshold, for each step. */
  IX.register("ap-derivative", root => {
    const grid = h("div", { class: "ix-three" }, root);
    const bs = ["Voltage", "dV/dt", "Phase plot"].map(t => { const b = h("div", {}, grid); h("p", { class: "ix-panel-title" }, b, t); return b; });
    const P = Plane(bs[0], { x: [-3, 3], y: [-50, 65], xtick: 1, ytick: 20, frame: true, labels: ["ms from peak", "mV"], width: 300, height: 290, pad: 40, clip: true, title: "Voltage" });
    const Q = Plane(bs[1], { x: [-3, 3], y: [-60, 350], xtick: 1, ytick: 100, frame: true, labels: ["ms from peak", "mV/ms"], width: 300, height: 290, pad: 40, clip: true, title: "dV/dt" });
    const R = Plane(bs[2], { x: [-50, 65], y: [-60, 350], xtick: 25, ytick: 100, frame: true, labels: ["V (mV)", "dV/dt"], width: 300, height: 290, pad: 40, clip: true, title: "Phase plot" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, k = 1;
    const ks = [1, 2, 4, 8, 16];
    const sl = slider(ctl, { label: "Step h", min: 0, max: 4, step: 1, value: 0, format: v => fmt(ks[v] * 0.05, 2) + " ms", onInput: v => { k = ks[v]; draw(); } });
    player(ctl, sl, { interval: 900 });
    const out = readout(root);
    function draw() {
      if (!D) return; P.clear(); Q.clear(); R.clear();
      const v = D.v, n = v.length, t = i => (i - D.pk) * 0.05;
      const d = v.map((_, i) => i >= k && i < n - k ? (v[i + k] - v[i - k]) / (2 * k * 0.05) : NaN);
      P.path(v.map((x, i) => [t(i), x]), { color: C.ink, width: 2 });
      const dd = d.map((x, i) => [t(i), x]).filter(p => isFinite(p[1]));
      Q.line([-3, 20], [3, 20], { color: C.muted, dash: "3 3", width: 1 });
      Q.path(dd, { color: C.blue, width: 2 });
      R.line([-50, 20], [65, 20], { color: C.muted, dash: "3 3", width: 1 });
      R.path(v.map((x, i) => [x, d[i]]).filter(p => isFinite(p[1])), { color: C.blue, width: 2 });
      let th = NaN; for (let i = k; i < D.pk; i++) if (d[i] > 20) { th = v[i]; break; }
      const b = D.base, bd = []; for (let i = k; i < b.length - k; i++) bd.push((b[i + k] - b[i - k]) / (2 * k * 0.05));
      const mu = bd.reduce((s, x) => s + x, 0) / bd.length, nsd = Math.sqrt(bd.reduce((s, x) => s + (x - mu) ** 2, 0) / bd.length);
      const pkd = Math.max(...dd.map(p => p[1]));
      if (isFinite(th)) { P.dot([t(v.indexOf(th)), th], { color: C.vermilion, r: 5 }); R.dot([th, 20], { color: C.vermilion, r: 5 }); }
      out.innerHTML = `<table><tr><td>peak dV/dt</td><td><b>${fmt(pkd, 0)}</b> mV/ms</td></tr><tr><td>baseline noise in dV/dt</td><td>${fmt(nsd, 2)} mV/ms</td></tr><tr><td><span class="k-verm">threshold</span>: V where dV/dt first exceeds 20 mV/ms</td><td><b>${fmt(th, 1)}</b> mV</td></tr></table>
        <p>The first spike of the 150 pA sweep of a real cell, recorded at 20 kHz. A longer step quiets the baseline noise but blunts the fast upstroke: the peak rate of rise falls, and the threshold moves. On this clean recording the smallest step is best. Always report the step with any derivative-based measurement.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 8. The gain of an f-I curve, by finite differences. */
  IX.register("fi-gain", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "f–I curve: spikes in 0.5 s ÷ 0.5 s");
    h("p", { class: "ix-panel-title" }, b2, "Gain: forward difference over the step");
    const P = Plane(b1, { x: [0, 300], y: [0, 15], xtick: 50, ytick: 5, frame: true, labels: ["current (pA)", "rate (spikes/s)"], width: 380, height: 300, pad: 42, clip: true, title: "f-I curve" });
    const Q = Plane(b2, { x: [0, 300], y: [0, 0.45], xtick: 50, ytick: 0.1, frame: true, labels: ["current, step midpoint (pA)", "Hz/pA"], width: 380, height: 300, pad: 42, clip: true, title: "Gain" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, st = 1;
    const steps = [1, 2, 5, 10];
    const sl = slider(ctl, { label: "Step", min: 0, max: 3, step: 1, value: 0, format: v => steps[v] * 10 + " pA", onInput: v => { st = steps[v]; draw(); } });
    player(ctl, sl, { interval: 900 });
    const out = readout(root);
    function draw() {
      if (!D) return; P.clear(); Q.clear();
      const rate = D.nspk.map(n => n / 0.5);
      P.path(D.I.map((x, i) => [x, rate[i]]), { color: C.ink, width: 1.6 }); D.I.forEach((x, i) => P.dot([x, rate[i]], { color: C.ink, r: 3.5 }));
      const g = []; for (let i = 0; i + st < D.I.length; i++) { if (D.I[i] < 70) continue; g.push([(D.I[i] + D.I[i + st]) / 2, (rate[i + st] - rate[i]) / (D.I[i + st] - D.I[i])]); }
      Q.path(g, { color: C.blue, width: 1.8 }); g.forEach(p => Q.dot(p, { color: C.blue, r: 3.5 }));
      const vals = g.map(p => p[1]), lo = Math.min(...vals), hi = Math.max(...vals);
      out.innerHTML = `<p>Gain estimates above rheobase range from <b>${fmt(lo, 2)}</b> to <b>${fmt(hi, 2)}</b> Hz/pA with a ${st * 10} pA step.</p>
        <p>The rate is a whole number of spikes in 0.5 s, so it moves in jumps of 2 spikes/s. Over a 10 pA step the gain is either 0 or 0.2 Hz/pA: counting noise. Over 100 pA it settles near 0.05 Hz/pA, one extra spike/s per 20 pA. At rheobase (60 → 70 pA) the curve jumps and has no derivative.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });
})();
