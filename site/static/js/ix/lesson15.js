/* Lesson 15: Multidimensional Optimisation. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el, contours } = window.IX;
  const rad = d => d * Math.PI / 180;
  const sup = v => String(v).split("").map(c => ({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" })[c] || c).join("");
  /* H = R diag(l1, l2) R^T with rotation by th degrees */
  const Hrot = (l1, l2, th) => { const c = Math.cos(rad(th)), s = Math.sin(rad(th)); return [[l1 * c * c + l2 * s * s, (l1 - l2) * c * s], [(l1 - l2) * c * s, l1 * s * s + l2 * c * c]]; };
  const mv = (A, x) => [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
  const quad = H => (x, y) => 0.5 * (H[0][0] * x * x + 2 * H[0][1] * x * y + H[1][1] * y * y);
  function logAxis(P, vals, x0) { vals.forEach(v => P.text(v ? "10" + sup(v) : "1", x0, v, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: P.back })); }
  function run(H, e0, eta, beta, n) { let e = e0.slice(), v = [0, 0]; const es = [e.slice()]; for (let k = 0; k < n; k++) { const g = mv(H, e); v = [beta * v[0] + g[0], beta * v[1] + g[1]]; e = [e[0] - eta * v[0], e[1] - eta * v[1]]; es.push(e.slice()); if (!isFinite(e[0]) || Math.abs(e[0]) > 1e6) break; } return es; }
  function stepsTo(H, e0, eta, beta, tol = 1e-6, cap = 20000) { let e = e0.slice(), v = [0, 0]; for (let k = 0; k < cap; k++) { const g = mv(H, e); if (Math.hypot(...g) < tol) return k; v = [beta * v[0] + g[0], beta * v[1] + g[1]]; e = [e[0] - eta * v[0], e[1] - eta * v[1]]; if (!isFinite(e[0]) || Math.abs(e[0]) > 1e8) return -1; } return Infinity; }

  /* 1. Eigenmodes: each eigen-direction contracts by its own factor 1 − ηλ. */
  IX.register("gd-modes", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Path on a valley with curvatures 1 and 10");
    h("p", { class: "ix-panel-title" }, b2, "Error in each eigen-direction (log scale)");
    const P = Plane(b1, { x: [-2.5, 2.5], y: [-2.5, 2.5], xtick: 1, ytick: 1, labels: ["θ₁", "θ₂"], width: 380, height: 380, pad: 30, clip: true, title: "Path" });
    const Q = Plane(b2, { x: [0, 40], y: [-8, 2], xtick: 10, noYTicks: true, frame: true, labels: ["step k", ""], width: 380, height: 380, pad: 44, clip: true, title: "Per-mode error" });
    logAxis(Q, [-8, -6, -4, -2, 0, 2], 0);
    const H = Hrot(1, 10, 120), f = quad(H);
    contours(P, f, [0.05, 0.2, 0.5, 1, 2, 4, 8], { color: C.axis, layer: P.back, n: 80 });
    const q1 = [Math.cos(rad(120)), Math.sin(rad(120))], q2 = [-q1[1], q1[0]];
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let r = 0.5;
    const sl = slider(ctl, { label: "η × λ_max", min: 0.05, max: 2.1, step: 0.01, value: r, format: v => fmt(v, 2), onInput: v => { r = v; draw(); } });
    player(ctl, sl, { interval: 90 });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      const eta = r / 10, e0 = [2 * q1[0] + 1.2 * q2[0], 2 * q1[1] + 1.2 * q2[1]], es = run(H, e0, eta, 0, 40);
      P.path(es.filter(e => Math.abs(e[0]) < 5 && Math.abs(e[1]) < 5), { color: C.purple, width: 1.6 }); es.slice(0, 41).forEach((e, i) => { if (Math.abs(e[0]) < 5) P.dot(e, { color: C.purple, r: i ? 2.8 : 5, sw: 0 }); });
      P.dot([0, 0], { color: C.ink, r: 4 });
      const z = es.map(e => [Math.abs(e[0] * q1[0] + e[1] * q1[1]), Math.abs(e[0] * q2[0] + e[1] * q2[1])]);
      [[0, C.blue], [1, C.vermilion]].forEach(([i, col]) => { const pts = z.map((v, k) => [k, Math.log10(Math.max(v[i], 1e-9))]); Q.path(pts, { color: col, width: 2 }); });
      const m1 = 1 - eta * 1, m2 = 1 - eta * 10, rho = Math.max(Math.abs(m1), Math.abs(m2));
      out.innerHTML = `<table><tr><td><span class="k-blue">flat mode</span> (λ = 1): multiplier 1 − η</td><td><b>${fmt(m1, 3)}</b></td></tr><tr><td><span class="k-verm">sharp mode</span> (λ = 10): multiplier 1 − 10η</td><td><b>${fmt(m2, 3)}</b></td></tr><tr><td>spectral radius ρ</td><td>${fmt(rho, 3)} ${rho < 1 ? "(converges)" : rho === 1 ? "(marginal)" : "(diverges)"}</td></tr></table>
        <p>Gradient descent on a quadratic is two independent one-dimensional problems, one per eigen-direction. ${r < 1 ? "Below ηλ_max = 1 both modes creep in from one side." : r < 2 ? "Between 1 and 2 the sharp mode flips sign each step (the zig-zag) but still shrinks; the flat mode sets the pace." : "Beyond ηλ_max = 2 the sharp mode grows: divergence."} The best constant step balances the two: ηλ_max = 2·10/11 ≈ 1.82.</p>`;
    }
    draw();
  });

  /* 2. Momentum on an ill-conditioned valley. */
  IX.register("momentum", root => {
    const H = [[1, 0], [0, 100]], f = quad(H), e0 = [-9, 0.9];
    const L = layout(root, true);
    const P = Plane(L, { x: [-10, 2], y: [-1.5, 1.5], xtick: 2, ytick: 0.5, labels: ["θ₁ (flat)", "θ₂ (sharp)"], width: 480, height: 280, pad: 34, clip: true, title: "Vanilla and momentum paths" });
    contours(P, f, [0.1, 1, 5, 15, 30, 50], { color: C.axis, layer: P.back, n: 120, m: 60 });
    const side = h("div", {}, L);
    let er = 1, beta = 0.9;
    slider(side, { label: "η × λ_max", min: 0.1, max: 4, step: 0.05, value: er, format: v => fmt(v, 2), onInput: v => { er = v; draw(); } });
    const sb = slider(side, { label: "Momentum β", min: 0, max: 0.95, step: 0.01, value: beta, format: v => fmt(v, 2), onInput: v => { beta = v; draw(); } });
    player(side, sb, { interval: 90, onStart: () => { sb.set(0); beta = 0; draw(); } });
    const out = readout(side);
    function draw() {
      P.clear();
      const eta = er / 100, a = run(H, e0, eta, 0, 60), b = run(H, e0, eta, beta, 60);
      const ok = e => Math.abs(e[0]) < 30 && Math.abs(e[1]) < 5;
      P.path(a.filter(ok), { color: C.vermilion, width: 1.4 }); P.path(b.filter(ok), { color: C.blue, width: 2 });
      P.dot(e0, { color: C.ink, r: 5 }); P.dot([0, 0], { color: C.ink, r: 4 });
      const sa = stepsTo(H, e0, eta, 0), sbb = stepsTo(H, e0, eta, beta), fmtS = s => s === -1 ? "diverges" : isFinite(s) ? s + " steps" : "> 20,000";
      out.innerHTML = `<table><tr><td><span class="k-verm">vanilla</span> (β = 0)</td><td><b>${fmtS(sa)}</b></td></tr><tr><td><span class="k-blue">momentum</span> (β = ${fmt(beta, 2)})</td><td><b>${fmtS(sbb)}</b></td></tr><tr><td>momentum stable if ηλ_max &lt;</td><td>2(1 + β) = ${fmt(2 * (1 + beta), 2)}</td></tr></table>
        <p>Steps until the gradient norm falls below 10⁻⁶, on curvatures 1 and 100 (first 60 steps drawn). Across the narrow valley the alternating gradients cancel in the momentum; along it they add up, so progress along the flat direction speeds up. Too much momentum overshoots and rings. Step counts depend on the start and the tolerance: in the notebook's runs, tuned momentum (η = 0.033, β = 0.67) needed 143 steps against 1152 for the best vanilla step.</p>`;
    }
    draw();
  });

  /* 3. Scaling is preconditioning. */
  IX.register("precondition", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "In the new coordinates z = D⁻¹θ");
    h("p", { class: "ix-panel-title" }, b2, "Gradient norm against step (log scale)");
    const P = Plane(b1, { x: [-3, 3], y: [-3, 3], xtick: 1, ytick: 1, labels: ["z₁", "z₂"], width: 380, height: 380, pad: 30, clip: true, title: "Rescaled loss" });
    const Q = Plane(b2, { x: [0, 200], y: [-6, 3], xtick: 50, noYTicks: true, frame: true, labels: ["step k", ""], width: 380, height: 380, pad: 44, clip: true, title: "Convergence" });
    logAxis(Q, [-6, -4, -2, 0, 2], 0);
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let t = 0;
    const sl = slider(ctl, { label: "Rescale θ₁", min: 0, max: 1, step: 0.02, value: 0, format: v => "d₁ = " + fmt(Math.pow(1 / 20, v), 3), onInput: v => { t = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 80 });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      const d1 = Math.pow(1 / 20, t), Hz = [[400 * d1 * d1, 0], [0, 1]], f = quad(Hz);
      contours(P, f, [0.1, 0.5, 1.5, 3, 6], { color: C.axis, n: 90 });
      const lmax = Math.max(Hz[0][0], 1), eta = 1 / lmax, z0 = [0.11 / d1, 2.2];
      const es = run(Hz, z0, eta, 0, 200);
      P.path(es.filter(e => Math.abs(e[0]) < 4 && Math.abs(e[1]) < 4), { color: C.orange, width: 1.8 }); es.slice(0, 60).forEach((e, i) => P.dot(e, { color: C.orange, r: i ? 2.6 : 5, sw: 0 }));
      Q.path(es.map((e, k) => [k, Math.log10(Math.max(Math.hypot(...mv(Hz, e)), 1e-9))]), { color: C.blue, width: 2 });
      const k = Hz[0][0] / Hz[1][1], st = stepsTo(Hz, z0, eta, 0);
      out.innerHTML = `<table><tr><td>Hessian in z: diag(${fmt(Hz[0][0], 2)}, 1)</td><td>condition number <b>${fmt(Math.max(k, 1 / k), 1)}</b></td></tr><tr><td>steps to |∇L| &lt; 10⁻⁶ with η = 1/λ_max</td><td><b>${isFinite(st) ? st : "> 20,000"}</b></td></tr></table>
        <p>The loss has curvatures 400 and 1. Writing θ₁ = d₁ z₁ changes nothing about the minimum, but the Hessian becomes D H D: at d₁ = 1/20 the bowl is round, and one step is enough (7798 steps without rescaling). A gradient step in z, mapped back to θ, is a <b>preconditioned</b> step with P = D Dᵀ. Standardising features does exactly this.</p>`;
    }
    draw();
  });

  /* 4. Debugging an optimiser from its history. */
  IX.register("debug", root => {
    const g = th => [th[0] - 2 + 0.8 * (th[1] + 1), 4 * (th[1] + 1) + 0.8 * (th[0] - 2)], Lf = th => 0.5 * ((th[0] - 2) ** 2 + 4 * (th[1] + 1) ** 2 + 1.6 * (th[0] - 2) * (th[1] + 1));
    const bugs = [
      { label: "Correct", step: (th, eta) => { const G = g(th); return [th[0] - eta * G[0], th[1] - eta * G[1]]; } },
      { label: "Sign error", step: (th, eta) => { const G = g(th); return [th[0] + eta * G[0], th[1] + eta * G[1]]; } },
      { label: "Sequential update", step: (th, eta) => { const a = th[0] - eta * g(th)[0]; const b = th[1] - eta * g([a, th[1]])[1]; return [a, b]; } },
      { label: "Sum instead of mean (n = 50)", step: (th, eta) => { const G = g(th); return [th[0] - 50 * eta * G[0], th[1] - 50 * eta * G[1]]; } },
      { label: "Missing .copy()", step: null }];
    let B = bugs[0];
    buttons(root, bugs, it => { B = it; draw(); }, { toggle: true, label: "Optimiser" });
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Path");
    h("p", { class: "ix-panel-title" }, b2, "Objective history (log scale)");
    const P = Plane(b1, { x: [-1, 4], y: [-3, 1.5], xtick: 1, ytick: 1, labels: ["θ₁", "θ₂"], width: 380, height: 320, pad: 30, clip: true, title: "Path" });
    const Q = Plane(b2, { x: [0, 60], y: [-12, 8], xtick: 10, noYTicks: true, frame: true, labels: ["iteration", ""], width: 380, height: 320, pad: 44, clip: true, title: "History" });
    logAxis(Q, [-12, -8, -4, 0, 4, 8], 0);
    contours(P, (x, y) => Lf([x, y]), [0.1, 0.5, 1.5, 3, 6], { color: C.axis, layer: P.back, n: 80 });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let n = 60;
    const sl = slider(ctl, { label: "Iterations shown", min: 1, max: 60, step: 1, value: n, onInput: v => { n = v; draw(); } });
    player(ctl, sl, { interval: 70 });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      const eta = 0.2; let th = [0, 0]; const hist = [th.slice()];
      if (B.step) for (let k = 0; k < n; k++) { th = B.step(th, eta); hist.push(th.slice()); if (!isFinite(th[0]) || Math.abs(th[0]) > 1e12) break; }
      else { const store = [th]; for (let k = 0; k < n; k++) { const G = g(th); th[0] -= eta * G[0]; th[1] -= eta * G[1]; store.push(th); } store.forEach(s => hist.push(s)); hist.shift(); }
      const ok = p => Math.abs(p[0]) < 20 && Math.abs(p[1]) < 20;
      P.path(hist.filter(ok), { color: C.orange, width: 1.6 }); hist.filter(ok).forEach((p, i) => P.dot(p, { color: C.orange, r: i ? 2.6 : 5, sw: 0 }));
      P.dot([2, -1], { color: C.ink, r: 4 });
      Q.path(hist.map((p, k) => [k, Math.log10(Math.max(Lf(p), 1e-12))]).filter(p => isFinite(p[1])), { color: C.blue, width: 2 });
      const msg = { "Correct": "The objective falls steadily, the gradient norm with it, and the path ends at the minimum (black).", "Sign error": "The objective <b>rises</b> from the very first step, although the step size is sensible: the update climbs instead of descending.", "Sequential update": "It converges, but by a different path: the second component used an already-updated first one. The first step disagrees with a hand calculation.", "Sum instead of mean (n = 50)": "The gradient is 50 times too large for its objective, so a step size that suits the mean explodes.", "Missing .copy()": "Every stored iterate is the same array, so the history shows the final value at every iteration: a flat line that hides the whole run." }[B.label];
      out.innerHTML = `<p><b>${B.label}.</b> ${msg} More iterations fix none of these bugs: read the histories, and check the gradient first.</p>`;
    }
    draw();
  });

  /* 5. A nonconvex objective: starts, basins and a saddle. */
  IX.register("saddle-starts", root => {
    const Lf = (x, y) => (x * x - 1) ** 2 + 2 * y * y + 0.3 * x, G = (x, y) => [4 * x * (x * x - 1) + 0.3, 4 * y];
    const L = layout(root, true);
    const P = Plane(L, { x: [-1.8, 1.8], y: [-1.4, 1.4], xtick: 0.5, ytick: 0.5, labels: ["x", "y"], width: 480, height: 380, pad: 30, clip: true, title: "Gradient descent from a start you choose" });
    contours(P, Lf, [-0.25, -0.1, 0.1, 0.3, 0.6, 1, 1.6, 2.5], { colorFn: v => v < 0 ? C.blue : C.axis, layer: P.back, n: 100 });
    const side = h("div", {}, L);
    h("p", { class: "ix-hint" }, side, "Drag the black start point.");
    let st = [0.3, 1.2], eta = 0.05;
    const sl = slider(side, { label: "Learning rate η", min: 0.01, max: 0.2, step: 0.005, value: eta, format: v => fmt(v, 3), onInput: v => { eta = v; draw(); } });
    player(side, sl, { bounce: true, interval: 100 });
    buttons(side, [{ label: "Start on the saddle" }], () => { st = [0.0754, 0]; hd.set(st, true); draw(); });
    const out = readout(side);
    function draw() {
      P.clear();
      let p = st.slice(); const path = [p.slice()]; let k = 0;
      for (; k < 3000; k++) { const g = G(...p); if (Math.hypot(...g) < 1e-8) break; p = [p[0] - eta * g[0], p[1] - eta * g[1]]; if (!isFinite(p[0]) || Math.abs(p[0]) > 20) break; if (k < 200) path.push(p.slice()); }
      P.path(path.filter(q => Math.abs(q[0]) < 3), { color: C.orange, width: 1.8 });
      [[-1.0356, 0, C.green], [0.9601, 0, C.green], [0.0754, 0, C.vermilion]].forEach(([x, y, c]) => P.dot([x, y], { fill: "#fff", stroke: c, sw: 2.2, r: 6 }));
      P.dot(p, { color: C.orange, r: 6 });
      const ended = Math.abs(p[0] + 1.0356) < 0.01 ? "the deeper minimum (L = −0.305)" : Math.abs(p[0] - 0.9601) < 0.01 ? "the shallower minimum (L = +0.294)" : Math.abs(p[0] - 0.0754) < 0.01 && Math.abs(p[1]) < 0.01 ? "<b>the saddle</b>, with zero gradient, although it is not a minimum" : "somewhere else (diverged or cycling)";
      out.innerHTML = `<p>L = (x² − 1)² + 2y² + 0.3x. Open circles: two minima (green) and a saddle (vermilion).</p><p>From (${fmt(st[0], 2)}, ${fmt(st[1], 2)}) gradient descent stops after ${k} steps at ${ended}.</p>
        <p>Which minimum you reach depends on the basin you start in. Started exactly on the saddle, the gradient is zero and the run stops at once: a small gradient norm alone does not prove a minimum. One run is never evidence of a global minimum.</p>`;
    }
    const hd = P.handle(st, { color: C.ink, name: "start", snap: 0.02, onMove: q => { st = q; draw(); } });
    draw();
  });

  /* 6. Ridge strength chosen on validation data (real decoder results). */
  IX.register("ridge-validation", root => {
    const lam = [1, 30, 100, 300, 1000, 3000, 10000, 30000], tr = [0.944, 0.942, 0.938, 0.928, 0.906, 0.869, 0.782, 0.623], va = [0.211, 0.464, 0.630, 0.726, 0.762, 0.766, 0.714, 0.573], kap = [3829, 1725.5, 756.6, 291, 92.9, 57.2, 61.3, 73];
    const L = layout(root, true);
    const P = Plane(L, { x: [-0.3, 4.8], y: [0, 1.1], noXTicks: true, ytick: 0.2, frame: true, labels: ["ridge strength λ (log scale)", "R²"], width: 480, height: 330, pad: 46, clip: true, title: "Training and validation R²" });
    ["0", "10", "100", "1000", "10⁴"].forEach((s, i) => P.text(s, i, 0, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back }));
    const side = h("div", {}, L);
    let i = 0;
    const sl = slider(side, { label: "λ", min: 0, max: 7, step: 1, value: 0, format: v => v === 0 ? "0" : String(lam[v]), onInput: v => { i = v; draw(); } });
    player(side, sl, { interval: 700 });
    const out = readout(side);
    const X = k => k === 0 ? 0 : Math.log10(lam[k]);
    function draw() {
      P.clear();
      [[tr, C.blue], [va, C.vermilion]].forEach(([y, c]) => { P.path(y.map((v, k) => [X(k), v]), { color: c, width: 2.2 }); y.forEach((v, k) => P.dot([X(k), v], { color: c, r: k === i ? 7 : 4 })); });
      P.line([X(i), 0], [X(i), 1], { color: C.axis, width: 1 });
      out.innerHTML = `<table><tr><td>λ</td><td><b>${i ? lam[i] : 0}</b></td></tr><tr><td><span class="k-blue">training R²</span></td><td>${tr[i]}</td></tr><tr><td><span class="k-verm">validation R²</span></td><td><b>${va[i]}</b></td></tr><tr><td>Hessian condition number</td><td>${kap[i]}</td></tr></table>
        <p>A 422-parameter linear decoder of wheel velocity, trained on only 34 trials. Without a penalty it fits the training trials almost perfectly but generalises poorly. Validation picks λ = 3000; on the test trials, used once, ridge reaches R² = 0.61 against −1.19 for plain least squares. The penalty also improves the conditioning.</p>`;
    }
    draw();
  });
})();
