/* Lesson 11: Critical Points and Curvature. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson11/data.json").then(r => r.json()));
  const sig = x => 1 / (1 + Math.exp(-x));
  function curve(P, f, s = {}, x0 = P.opts.x[0], x1 = P.opts.x[1], n = 400) {
    const [y0, y1] = P.opts.y, span = y1 - y0; let seg = [];
    const flush = () => { if (seg.length > 1) P.path(seg, s); seg = []; };
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); if (!isFinite(y) || y < y0 - 2 * span || y > y1 + 2 * span) { flush(); continue; } seg.push([x, y]); }
    flush();
  }
  /* real roots of 4x^3 - 4x + c = 0 on [-2, 2], by bracketing and bisection */
  function roots(fp, a = -2, b = 2, n = 800) {
    const out = [];
    for (let i = 0; i < n; i++) { let l = a + (b - a) * i / n, r = l + (b - a) / n; if (fp(l) * fp(r) > 0) continue; for (let k = 0; k < 50; k++) { const m = (l + r) / 2; if (fp(l) * fp(m) <= 0) r = m; else l = m; } out.push((l + r) / 2); }
    return out;
  }

  /* 1. Downhill on a tilted double well. */
  IX.register("double-well", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-1.8, 1.8], y: [-2.6, 3], xtick: 0.5, ytick: 1, labels: ["state x", "energy E(x)"], width: 480, height: 360, pad: 40, clip: true, title: "A double-well energy" });
    const side = h("div", {}, L);
    let c = 0.3, x0 = 0.4, t = 0;
    slider(side, { label: "Tilt c", min: -2, max: 2, step: 0.05, value: c, format: v => fmt(v, 2), onInput: v => { c = v; draw(); } });
    slider(side, { label: "Start x₀", min: -1.7, max: 1.7, step: 0.05, value: x0, format: v => fmt(v, 2), onInput: v => { x0 = v; st.set(0); t = 0; draw(); } });
    const st = slider(side, { label: "Time", min: 0, max: 60, step: 1, value: 0, onInput: v => { t = v; draw(); } });
    player(side, st, { interval: 60 });
    const out = readout(side);
    function draw() {
      P.clear();
      const E = x => x ** 4 - 2 * x * x + c * x, dE = x => 4 * x ** 3 - 4 * x + c;
      curve(P, E, { color: C.ink, width: 2.6 });
      const cps = roots(dE);
      cps.forEach(x => { const mn = 12 * x * x - 4 > 0; P.dot([x, E(x)], { fill: mn ? C.green : "#fff", stroke: mn ? C.green : C.vermilion, sw: 2, r: 6 }); });
      let x = x0; const tr = [[x, E(x)]];
      for (let k = 0; k < t; k++) { x = x - 0.02 * dE(x); tr.push([x, E(x)]); }
      tr.forEach(p => P.dot(p, { color: C.blue, r: 2.5, sw: 0, opacity: 0.6 }));
      P.dot([x, E(x)], { color: C.blue, r: 8 });
      const mins = cps.filter(v => 12 * v * v - 4 > 0);
      out.innerHTML = `<table><tr><td>critical points</td><td>${cps.map(v => fmt(v, 3)).join(", ")}</td></tr><tr><td>local minima</td><td><b>${mins.length}</b></td></tr><tr><td>ball now at</td><td>x = ${fmt(x, 3)}, E = ${fmt(E(x), 3)}</td></tr></table>
        <p>Green dots: minima (valleys). Open vermilion dots: maxima (hilltops). The ball (blue) slides downhill, Δx ∝ −E′(x), and stops in whichever valley it started above. ${mins.length < 2 ? "With this much tilt the shallower valley has <b>disappeared</b>: only one state can be held (Exercise 12)." : "The deeper valley is the global minimum; a ball that starts on the other side never finds it."}</p>`;
    }
    draw();
  });

  /* 2. Slope, curvature and the local parabola. */
  IX.register("curvature", root => {
    const fs = [
      { label: "double well", f: x => x ** 4 - 2 * x * x + 0.3 * x, d: x => 4 * x ** 3 - 4 * x + 0.3, d2: x => 12 * x * x - 4, x: [-1.8, 1.8], y: [-2, 3] },
      { label: "sigmoid", f: sig, d: x => sig(x) * (1 - sig(x)), d2: x => sig(x) * (1 - sig(x)) * (1 - 2 * sig(x)), x: [-6, 6], y: [-0.3, 1.3] },
      { label: "x³", f: x => x ** 3, d: x => 3 * x * x, d2: x => 6 * x, x: [-1.6, 1.6], y: [-3, 3] },
      { label: "x⁴", f: x => x ** 4, d: x => 4 * x ** 3, d2: x => 12 * x * x, x: [-1.6, 1.6], y: [-1, 4] }];
    let F = fs[0], x = 0;
    const xa = v => F.x[0] + (v + 1) / 2 * (F.x[1] - F.x[0]);
    buttons(root, fs, it => { F = it; x = xa(sl.value); build(); }, { toggle: true, label: "Function" });
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const sl = slider(side, { label: "x", min: -1, max: 1, step: 0.005, value: 0, format: v => fmt(xa(v), 2), onInput: v => { x = xa(v); draw(); } });
    player(side, sl, { bounce: true, interval: 40 });
    const out = readout(side);
    let P;
    function build() { left.innerHTML = ""; P = Plane(left, { x: F.x, y: F.y, xtick: F.x[1] > 3 ? 2 : 0.5, ytick: F.y[1] > 2 ? 1 : 0.5, labels: ["x", ""], width: 480, height: 360, pad: 36, clip: true, title: "Slope and curvature" }); draw(); }
    function draw() {
      P.clear();
      const w = (F.x[1] - F.x[0]) / 120;
      let st = F.x[0], sg = F.d2(F.x[0] + w / 2) > 0;
      const band = (u, v, pos) => el("rect", { x: P.X(u), y: P.Y(F.y[1]), width: P.X(v) - P.X(u), height: P.Y(F.y[0]) - P.Y(F.y[1]), fill: pos ? C.green : C.purple, "fill-opacity": 0.1 }, P.layer);
      for (let i = 1; i <= 120; i++) { const a = F.x[0] + i * w, s = i < 120 ? F.d2(a + w / 2) > 0 : !sg; if (s !== sg) { band(st, a, sg); st = a; sg = s; } }
      curve(P, F.f, { color: C.ink, width: 2.6 });
      const f0 = F.f(x), d = F.d(x), d2 = F.d2(x);
      curve(P, t => f0 + d * (t - x) + 0.5 * d2 * (t - x) ** 2, { color: C.orange, width: 2, dash: "6 4" });
      P.line([x - 5, f0 - 5 * d], [x + 5, f0 + 5 * d], { color: C.blue, width: 1.8 });
      P.dot([x, f0], { color: C.ink, r: 6 });
      out.innerHTML = `<table><tr><td>f′(x), slope</td><td><b>${fmt(d, 3)}</b></td></tr><tr><td>f″(x), curvature</td><td><b>${fmt(d2, 3)}</b> (${d2 > 1e-6 ? "bends up" : d2 < -1e-6 ? "bends down" : "inflection"})</td></tr></table>
        <p>Blue: the tangent (slope). Orange dashed: the second-order Taylor parabola, which also matches the curvature. Green shading: f″ &gt; 0 (convex, holds water); purple: f″ &lt; 0. ${Math.abs(d) < 0.03 ? (d2 > 0.05 ? "Here f′ ≈ 0 and f″ &gt; 0: a <b>minimum</b>." : d2 < -0.05 ? "Here f′ ≈ 0 and f″ &lt; 0: a <b>maximum</b>." : "Here f′ ≈ 0 and f″ ≈ 0: the second-derivative test says nothing.") : "Sweep x to find where the slope is zero, and read the curvature there."}</p>`;
    }
    build();
  });

  /* 3. Taylor polynomials of sin x. */
  IX.register("taylor", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-5, 7], y: [-2, 2], xtick: 1, ytick: 1, labels: ["x", ""], width: 480, height: 320, pad: 34, clip: true, title: "Taylor polynomials of sin x" });
    const side = h("div", {}, L);
    let a = 0.8, n = 1;
    slider(side, { label: "Centre a", min: -3, max: 4, step: 0.05, value: a, format: v => fmt(v, 2), onInput: v => { a = v; draw(); } });
    const sn = slider(side, { label: "Order n", min: 0, max: 15, step: 1, value: n, onInput: v => { n = v; draw(); } });
    player(side, sn, { interval: 700 });
    const out = readout(side);
    const der = (k, x) => [Math.sin, Math.cos, t => -Math.sin(t), t => -Math.cos(t)][k % 4](x);
    function draw() {
      P.clear();
      curve(P, Math.sin, { color: C.ink, width: 2.6 });
      const coef = []; let fact = 1; for (let k = 0; k <= n; k++) { if (k) fact *= k; coef.push(der(k, a) / fact); }
      const p = x => coef.reduce((s, c, k) => s + c * Math.pow(x - a, k), 0);
      curve(P, p, { color: C.blue, width: 2.4 }, -5, 7, 800);
      P.dot([a, Math.sin(a)], { color: C.vermilion, r: 6 });
      let good = 0; for (let r = 0.05; r < 12; r += 0.05) { if (Math.abs(p(a + r) - Math.sin(a + r)) < 0.01 && Math.abs(p(a - r) - Math.sin(a - r)) < 0.01) good = r; else break; }
      out.innerHTML = `<p>Order ${n}: f(a + h) ≈ ${coef.slice(0, 4).map((c, k) => `${k ? (c < 0 ? " − " : " + ") : ""}${fmt(k ? Math.abs(c) : c, 3)}${k ? "h" + (k > 1 ? "<sup>" + k + "</sup>" : "") : ""}`).join("")}${n > 3 ? " + …" : ""}</p>
        <p>Black: sin x. Blue: its Taylor polynomial around a (vermilion dot). It matches sin x to within 0.01 for |h| up to about <b>${fmt(good, 2)}</b>. Each extra term matches one more derivative at a, and the region of good agreement grows.</p>`;
    }
    draw();
  });

  /* 4. Newton's method on the double well. */
  IX.register("newton", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-1.8, 1.8], y: [-2, 3], xtick: 0.5, ytick: 1, labels: ["x", "E(x)"], width: 480, height: 360, pad: 36, clip: true, title: "Newton's method" });
    const side = h("div", {}, L);
    const E = x => x ** 4 - 2 * x * x + 0.3 * x, dE = x => 4 * x ** 3 - 4 * x + 0.3, d2E = x => 12 * x * x - 4;
    let x0 = 1.5, k = 0;
    slider(side, { label: "Start x₀", min: -1.7, max: 1.7, step: 0.05, value: x0, format: v => fmt(v, 2), onInput: v => { x0 = v; sk.set(0); k = 0; draw(); } });
    const sk = slider(side, { label: "Newton steps", min: 0, max: 6, step: 1, value: 0, onInput: v => { k = v; draw(); } });
    player(side, sk, { interval: 1000 });
    const out = readout(side);
    function draw() {
      P.clear(); curve(P, E, { color: C.ink, width: 2.6 });
      const xs = [x0]; for (let i = 0; i < 6; i++) { const x = xs[i], s = d2E(x); xs.push(Math.abs(s) < 1e-9 ? x : x - dE(x) / s); }
      const x = xs[k], q = t => E(x) + dE(x) * (t - x) + 0.5 * d2E(x) * (t - x) ** 2;
      curve(P, q, { color: C.orange, width: 2, dash: "6 4" });
      xs.slice(0, k + 1).forEach((v, i) => P.dot([v, E(v)], { color: C.blue, r: i === k ? 7 : 4, opacity: i === k ? 1 : 0.5 }));
      if (k < 6) { const nx = xs[k + 1]; if (isFinite(nx) && Math.abs(nx) < 3) P.dot([nx, q(nx)], { fill: "#fff", stroke: C.orange, sw: 2, r: 5 }); }
      out.innerHTML = `<p>${xs.slice(0, k + 1).map(v => fmt(v, 6)).join(" → ")}</p>
        <p>Orange dashed: the parabola matching E, E′ and E″ at the current point. Newton jumps to its vertex (open circle): x ← x − E′/E″. ${d2E(xs[k]) < 0 ? "Here E″ &lt; 0, so the parabola opens <b>downwards</b> and its vertex is a maximum: Newton heads for the hilltop." : "Near a minimum the number of correct digits roughly doubles at each step."} Try starting at 0.3: Newton converges to the <b>maximum</b> at 0.0754.</p>`;
    }
    draw();
  });

  /* 5. Convexity: do chords lie above the graph? */
  IX.register("convex-chord", root => {
    const fs = [
      { label: "x²", f: x => x * x, x: [-2, 2], y: [-0.5, 4.5] },
      { label: "double well", f: x => x ** 4 - 2 * x * x + 0.3 * x, x: [-1.8, 1.8], y: [-1.8, 3] },
      { label: "|x| + x²", f: x => Math.abs(x) + x * x, x: [-2, 2], y: [-0.5, 6.5] },
      { label: "eˣ", f: Math.exp, x: [-2, 2], y: [-0.5, 7.5] },
      { label: "sin x on [0, π]", f: Math.sin, x: [0, Math.PI], y: [-0.2, 1.2] }];
    let F = fs[1], a = -1, b = 1;
    buttons(root, fs, it => { F = it; a = F.x[0] + 0.25 * (F.x[1] - F.x[0]); b = F.x[0] + 0.75 * (F.x[1] - F.x[0]); build(); }, { toggle: true, active: 1, label: "Function" });
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const sa = slider(side, { label: "Point a", min: 0, max: 1, step: 0.01, value: 0.22, format: v => fmt(F.x[0] + v * (F.x[1] - F.x[0]), 2), onInput: v => { a = F.x[0] + v * (F.x[1] - F.x[0]); draw(); } });
    slider(side, { label: "Point b", min: 0, max: 1, step: 0.01, value: 0.78, format: v => fmt(F.x[0] + v * (F.x[1] - F.x[0]), 2), onInput: v => { b = F.x[0] + v * (F.x[1] - F.x[0]); draw(); } });
    player(side, sa, { bounce: true, interval: 50 });
    const out = readout(side);
    let P;
    function build() { left.innerHTML = ""; P = Plane(left, { x: F.x, y: F.y, xtick: 0.5, ytick: 1, labels: ["", ""], width: 480, height: 340, pad: 34, clip: true, title: "Chords and the graph" }); draw(); }
    function draw() {
      P.clear(); curve(P, F.f, { color: C.ink, width: 2.6 });
      let below = false; for (let i = 1; i < 100; i++) { const t = i / 100, x = (1 - t) * a + t * b; if ((1 - t) * F.f(a) + t * F.f(b) < F.f(x) - 1e-9) { below = true; break; } }
      const col = below ? C.vermilion : C.green;
      P.line([a, F.f(a)], [b, F.f(b)], { color: col, width: 3 });
      P.dot([a, F.f(a)], { color: col, r: 6 }); P.dot([b, F.f(b)], { color: col, r: 6 });
      out.innerHTML = `<p>${below ? "<span class='k-verm'><b>This chord dips below the graph</b></span>: the function is <b>not convex</b> on this stretch." : "<span class='k-green'><b>This chord lies on or above the graph.</b></span>"}</p>
        <p>A function is convex if <i>every</i> chord lies on or above its graph. Move the two points: for x², |x| + x² and eˣ you will never find a bad chord; for the double well and sin x you will. For a convex function every local minimum is the global minimum.</p>`;
    }
    build();
  });

  /* 6. Flat and sharp directions, and what a ridge penalty does. */
  IX.register("ridge-valley", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-1, 5], y: [-2, 4], xtick: 1, ytick: 1, labels: ["weight w₁", "weight w₂"], width: 440, height: 440, pad: 36, clip: true, title: "Loss contours for two collinear regressors" });
    const side = h("div", {}, L);
    let lam = 0;
    const sl = slider(side, { label: "Ridge λ", min: 0, max: 0.4, step: 0.005, value: 0, format: v => fmt(v, 3), onInput: v => { lam = v; draw(); } });
    player(side, sl, { bounce: true, interval: 70 });
    const out = readout(side);
    const n0 = Math.hypot(0.705, 0.71), us = [0.705 / n0, 0.71 / n0], uf = [-0.71 / n0, 0.705 / n0], l1 = 1.7302, l2 = 0.0102, wh = [2.844, 0.076];
    function draw() {
      P.clear();
      const cs = wh[0] * us[0] + wh[1] * us[1], cf = wh[0] * uf[0] + wh[1] * uf[1];
      const ms = cs * l1 / (l1 + lam), mf = cf * l2 / (l2 + lam), m = [ms * us[0] + mf * uf[0], ms * us[1] + mf * uf[1]];
      const a1 = l1 + lam, a2 = l2 + lam;
      [0.002, 0.01, 0.03, 0.08, 0.2, 0.5].forEach((lev, i) => {
        const pts = []; for (let t = 0; t <= 360; t += 4) { const r = t * Math.PI / 180, ps = Math.sqrt(2 * lev / a1) * Math.cos(r), pf = Math.sqrt(2 * lev / a2) * Math.sin(r); pts.push([m[0] + ps * us[0] + pf * uf[0], m[1] + ps * us[1] + pf * uf[1]]); }
        P.path(pts, { color: C.blue, width: 1.3, opacity: 0.85 - i * 0.1 });
      });
      P.arrow(m, [m[0] + 0.9 * uf[0], m[1] + 0.9 * uf[1]], { color: C.green, width: 2.2 });
      P.text("flat", m[0] + 0.9 * uf[0], m[1] + 0.9 * uf[1], { dx: -6, dy: -8, anchor: "end", color: C.green, weight: 700, halo: true });
      P.arrow(m, [m[0] + 0.5 * us[0], m[1] + 0.5 * us[1]], { color: C.purple, width: 2.2 });
      P.text("sharp", m[0] + 0.5 * us[0], m[1] + 0.5 * us[1], { dx: 6, dy: -4, color: C.purple, weight: 700, halo: true });
      P.dot([2, 1], { color: C.ink, r: 6 }); P.text("true (2, 1)", 2, 1, { dx: 8, dy: 16, size: 12, halo: true });
      P.dot(m, { color: C.vermilion, r: 7 });
      out.innerHTML = `<table><tr><td>curvatures (Hessian eigenvalues)</td><td>${fmt(a2, 3)} and ${fmt(a1, 3)}</td></tr><tr><td>condition number</td><td><b>${fmt(a1 / a2, 1)}</b></td></tr><tr><td><span class="k-verm">minimum</span></td><td>(${fmt(m[0], 2)}, ${fmt(m[1], 2)})</td></tr></table>
        <p>Two inputs with correlation 0.99. The data pin down w₁ + w₂ (the sharp direction) but hardly w₁ − w₂ (the flat one), so the least-squares minimum lies far along the valley from the true weights. A ridge penalty adds λ to every curvature: the flat direction sharpens most, the valley rounds off, and the estimate is pulled in (with some bias).</p>`;
    }
    draw();
  });

  /* 7. A real neuron: the profile of the loss over s0, and the curves it allows. */
  IX.register("profile-s0", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Profile of the loss over s₀");
    h("p", { class: "ix-panel-title" }, b2, "The best curve for this s₀");
    const P = Plane(b1, { x: [300, 3500], y: [94, 110], xtick: 500, ytick: 4, frame: true, labels: ["speed scale s₀ (steps/s)", "loss (spikes/s)²"], width: 400, height: 320, pad: 46, clip: true, title: "Profile loss" });
    const Q = Plane(b2, { x: [0, 2200], y: [-2, 45], xtick: 500, ytick: 10, frame: true, labels: ["wheel speed (steps/s)", "rate (spikes/s)"], width: 400, height: 320, pad: 46, clip: true, title: "Fit" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, i = 0;
    const sl = slider(ctl, { label: "s₀", min: 0, max: 160, step: 1, value: 48, format: v => D ? fmt(D.s0[v], 0) : "", onInput: v => { i = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 60 });
    const out = readout(root);
    function draw() {
      if (!D) return; P.clear(); Q.clear();
      P.path(D.s0.map((s, k) => [s, D.loss[k]]), { color: C.ink, width: 2.4 });
      const best = D.loss.indexOf(Math.min(...D.loss));
      P.dot([D.s0[best], D.loss[best]], { color: C.vermilion, r: 6 });
      P.line([D.s0[i], 94], [D.s0[i], 110], { color: C.axis, width: 1 });
      P.dot([D.s0[i], D.loss[i]], { color: C.blue, r: 6 });
      const s0 = D.s0[i], r0 = D.r0[i], A = D.A[i];
      curve(Q, s => D.p[0] + D.p[1] * (Math.exp(s / D.p[2]) - 1), { color: C.vermilion, width: 1.6, dash: "5 4" }, 0, 2200);
      curve(Q, s => r0 + A * (Math.exp(s / s0) - 1), { color: C.blue, width: 2.6 }, 0, 2200);
      D.bm.forEach((m, k) => Q.dot([m, D.by[k]], { color: C.ink, r: 4.5 }));
      out.innerHTML = `<table><tr><td>s₀</td><td><b>${fmt(s0, 0)}</b> steps/s</td></tr><tr><td>best r₀, A for this s₀</td><td>${fmt(r0, 2)}, ${fmt(A, 2)} spikes/s</td></tr><tr><td>loss</td><td>${fmt(D.loss[i], 2)} (minimum ${fmt(D.loss[best], 2)}, +${fmt(100 * (D.loss[i] / D.loss[best] - 1), 2)}%)</td></tr></table>
        <p>For each s₀ the model r₀ + A(e<sup>s/s₀</sup> − 1) is linear in r₀ and A, so they are refitted exactly. To the right of the minimum the valley is very flat: a curve that starts rising later but more steeply (bigger A, bigger s₀) fits almost as well. Black dots: the training data, averaged in speed bins; vermilion dashed: the overall best fit.</p>`;
    }
    data().then(d => { D = d; i = 48; draw(); });
  });
})();
