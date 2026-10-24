/* Lesson 6: Eigenstructure and Stability. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson06/data.json").then(r => r.json()));
  const mv = (A, x) => A.map(r => r.reduce((s, a, j) => s + a * x[j], 0));
  const mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, a, l) => s + a * B[l][j], 0)));
  const inv2 = A => { const d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]; };
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const norm = a => Math.hypot(a[0], a[1]);
  const Rot = t => [[Math.cos(rad(t)), -Math.sin(rad(t))], [Math.sin(rad(t)), Math.cos(rad(t))]];
  const scale = (A, s) => A.map(r => r.map(v => v * s));
  /* eigenvalues of a 2 x 2 matrix from trace and determinant: [{re, im}, {re, im}] */
  function eig2(tr, dt) {
    const disc = tr * tr - 4 * dt;
    if (disc >= 0) { const s = Math.sqrt(disc); return [{ re: (tr + s) / 2, im: 0 }, { re: (tr - s) / 2, im: 0 }]; }
    const s = Math.sqrt(-disc); return [{ re: tr / 2, im: s / 2 }, { re: tr / 2, im: -s / 2 }];
  }
  const cstr = z => Math.abs(z.im) < 1e-9 ? fmt(z.re, 3) : `${fmt(z.re, 3)} ${z.im < 0 ? "−" : "+"} ${fmt(Math.abs(z.im), 3)}i`;
  const mod = z => Math.hypot(z.re, z.im);
  const circle = (P, r = 1, s = {}) => { const pts = []; for (let a = 0; a <= 360; a += 3) pts.push([r * Math.cos(rad(a)), r * Math.sin(rad(a))]); return P.path(pts, Object.assign({ color: C.axis, width: 1.2 }, s)); };
  function supLabel(P, v) { const sup = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" }; return "10" + String(v).split("").map(c => sup[c]).join(""); }

  /* 1. Hunting for eigenvectors: turn the input round the unit circle. */
  IX.register("eig-hunt", root => {
    const mats = [
      { label: "[[2, 1], [1, 2]]", A: [[2, 1], [1, 2]] },
      { label: "W decay", A: [[0.6, 0.2], [0.1, 0.7]] },
      { label: "Shear", A: [[1, 1], [0, 1]] },
      { label: "Rotation 30°", A: Rot(30) }];
    const L = layout(root, true);
    const P = Plane(L, { x: [-3.2, 3.2], y: [-3.2, 3.2], xtick: 1, ytick: 1, labels: ["x₁", "x₂"], width: 440, height: 440, pad: 30, clip: true, title: "Input x and output A x" });
    const side = h("div", {}, L);
    let A = mats[0].A, th = 10, showEv = false;
    buttons(side, mats, it => { A = it.A; draw(); }, { toggle: true, label: "Matrix" });
    const sl = slider(side, { label: "Direction of x", min: 0, max: 360, step: 1, value: th, format: v => v + "°", onInput: v => { th = v; draw(); } });
    player(side, sl, { interval: 40 });
    buttons(side, [{ label: "Hide" }, { label: "Show" }], (it, i) => { showEv = i === 1; draw(); }, { toggle: true, label: "Eigenvectors" });
    const out = readout(side);
    function draw() {
      P.clear(); circle(P);
      const outs = []; for (let a = 0; a <= 360; a += 4) outs.push(mv(A, [Math.cos(rad(a)), Math.sin(rad(a))]));
      P.path(outs, { color: C.sky, width: 1.2, dash: "4 4" });
      const tr = A[0][0] + A[1][1], dt = A[0][0] * A[1][1] - A[0][1] * A[1][0], ev = eig2(tr, dt);
      if (showEv && ev[0].im === 0) ev.forEach(z => {
        const B = [[A[0][0] - z.re, A[0][1]], [A[1][0], A[1][1] - z.re]];
        let v = Math.abs(B[0][1]) > 1e-9 || Math.abs(B[0][0]) > 1e-9 ? [-B[0][1], B[0][0]] : [-B[1][1], B[1][0]];
        const n = norm(v) || 1; v = [v[0] / n, v[1] / n];
        P.line([-4 * v[0], -4 * v[1]], [4 * v[0], 4 * v[1]], { color: C.green, width: 1.5, dash: "6 4" });
      });
      const x = [Math.cos(rad(th)), Math.sin(rad(th))], y = mv(A, x);
      const cosang = (x[0] * y[0] + x[1] * y[1]) / (norm(y) || 1e-12), ang = deg(Math.acos(Math.max(-1, Math.min(1, cosang))));
      const par = norm(y) > 1e-9 && (ang < 1.5 || ang > 178.5);
      P.arrow([0, 0], y, { color: par ? C.green : C.blue, width: 4 });
      P.arrow([0, 0], x, { color: C.ink, width: 2 });
      out.innerHTML = `<table><tr><td>x</td><td>(${fmt(x[0], 2)}, ${fmt(x[1], 2)})</td></tr><tr><td><span class="k-blue">A x</span></td><td>(${fmt(y[0], 2)}, ${fmt(y[1], 2)})</td></tr>
        <tr><td>angle between them</td><td><b>${fmt(ang, 1)}°</b></td></tr><tr><td>eigenvalues</td><td>${ev.map(cstr).join(", ")}</td></tr></table>
        <p>${par ? `<span class="k-green"><b>Eigenvector found.</b></span> A x points along x, stretched by ${fmt((ang > 90 ? -1 : 1) * norm(y), 3)}.` : ev[0].im !== 0 ? "This matrix turns every direction: its eigenvalues are complex, and there is no real eigenvector to find." : "A x is turned away from x. Keep turning: A x goes green when it lines up with x."}</p>`;
    }
    draw();
  });

  /* 2. The trace-determinant plane, the eigenvalues, and what repeated application does. */
  IX.register("trace-det", root => {
    const presets = [
      { label: "W decay", t: 1.3, d: 0.4 }, { label: "W grow", t: 1.9, d: 0.82 },
      { label: "W osc", t: 1.785, d: 0.9025 }, { label: "Rotation 20°", t: 1.879, d: 1 }];
    buttons(root, presets, it => { tr = it.t; dt = it.d; hd.set([tr, dt], true); draw(); }, { label: "Jump to" });
    const grid = h("div", { class: "ix-three" }, root);
    const titles = ["Trace–determinant plane", "Eigenvalues (complex plane)", "x_t over 30 steps"];
    const boxes = titles.map(t => { const b = h("div", {}, grid); h("p", { class: "ix-panel-title" }, b, t); return b; });
    const T = Plane(boxes[0], { x: [-2.6, 2.6], y: [-1.3, 1.7], xtick: 1, ytick: 1, labels: ["trace", "det"], width: 320, height: 300, pad: 30, clip: true, title: "Trace-determinant plane" });
    const E = Plane(boxes[1], { x: [-1.6, 1.6], y: [-1.6, 1.6], xtick: 1, ytick: 1, labels: ["real", "imag"], width: 300, height: 300, pad: 30, clip: true, title: "Eigenvalues" });
    const S = Plane(boxes[2], { x: [-2, 2], y: [-2, 2], xtick: 1, ytick: 1, labels: ["", ""], width: 300, height: 300, pad: 30, clip: true, title: "Trajectory" });
    h("p", { class: "ix-hint" }, root, "Drag the purple point in the trace–determinant plane.");
    const out = readout(root);
    let tr = 1.3, dt = 0.4;
    const pts = []; for (let t = -2.6; t <= 2.6; t += 0.05) pts.push([t, t * t / 4]);
    T.path([[-2, 1], [2, 1], [0, -1]], { close: true, color: C.green, width: 1, fill: C.green, fillOpacity: 0.12, layer: T.back });
    T.path(pts, { color: C.muted, width: 1.4, dash: "5 4", layer: T.back });
    T.text("complex", -1.25, 1.45, { anchor: "middle", color: C.muted, size: 11, layer: T.back });
    T.text("real", -2.1, -0.85, { anchor: "middle", color: C.muted, size: 11, layer: T.back });
    function draw() {
      T.clear(); E.clear(); S.clear(); circle(E);
      presets.forEach(p => T.dot([p.t, p.d], { color: C.muted, r: 3, sw: 0 }));
      const ev = eig2(tr, dt), rho = Math.max(mod(ev[0]), mod(ev[1]));
      const col = rho < 1 - 1e-9 ? C.blue : rho > 1 + 1e-9 ? C.vermilion : C.ink;
      ev.forEach(z => E.dot([z.re, z.im], { color: col, r: 6 }));
      let A;
      if (ev[0].im !== 0) { const r = Math.sqrt(dt), th = deg(Math.acos(Math.max(-1, Math.min(1, tr / (2 * r))))); A = scale(Rot(th), r); }
      else { const V = [[1, -0.45], [0.45, 1]]; A = mm(mm(V, [[ev[0].re, 0], [0, ev[1].re]]), inv2(V)); }
      let x = [1.2, 0.6]; const tra = [x];
      for (let k = 0; k < 30; k++) { x = mv(A, x); if (norm(x) > 50) break; tra.push(x); }
      S.path(tra, { color: col, width: 1.3, opacity: 0.6 }); tra.forEach((p, k) => S.dot(p, { color: col, r: k ? 2.8 : 5, sw: 0 }));
      const disc = tr * tr - 4 * dt;
      const kind = Math.abs(disc) < 1e-3 ? "a repeated real eigenvalue" : disc > 0 ? "two real eigenvalues" : "a complex pair (rotation)";
      const fate = rho < 1 - 1e-9 ? (disc < 0 ? "spirals in to zero" : "decays to zero") : rho > 1 + 1e-9 ? (disc < 0 ? "spirals outwards" : "grows without bound") : (disc < 0 ? "circles for ever" : "persists (marginal)");
      out.innerHTML = `<table><tr><td>trace, det</td><td>${fmt(tr, 2)}, ${fmt(dt, 2)}</td></tr><tr><td>discriminant tr² − 4 det</td><td>${fmt(disc, 3)}: ${kind}</td></tr>
        <tr><td>eigenvalues</td><td>${ev.map(cstr).join(" and ")}</td></tr><tr><td>spectral radius ρ</td><td><b>${fmt(rho, 3)}</b></td></tr></table>
        <p>Activity <b>${fate}</b>. Inside the green triangle both eigenvalues are inside the unit circle; above the dashed parabola they are complex. Blue: stable; vermilion: unstable.</p>`;
    }
    const hd = T.handle([tr, dt], { color: C.purple, name: "trace and determinant", snap: 0.01, onMove: p => { tr = p[0]; dt = p[1]; draw(); } });
    draw();
  });

  /* 3. Complex eigenvalues: rotate and scale, step after step. */
  IX.register("spiral", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-2.4, 2.4], y: [-2.4, 2.4], xtick: 1, ytick: 1, labels: ["neuron 1", "neuron 2"], width: 440, height: 440, pad: 30, clip: true, title: "Repeated rotation and scaling" });
    const side = h("div", {}, L);
    let r = 0.95, th = 20, n = 40;
    slider(side, { label: "Modulus r", min: 0.85, max: 1.06, step: 0.01, value: r, format: v => fmt(v, 2), onInput: v => { r = v; draw(); } });
    slider(side, { label: "Angle θ", min: 5, max: 90, step: 1, value: th, format: v => v + "°", onInput: v => { th = v; draw(); } });
    const sn = slider(side, { label: "Steps", min: 0, max: 60, step: 1, value: n, onInput: v => { n = v; draw(); } });
    player(side, sn, { interval: 90 });
    const out = readout(side);
    function draw() {
      P.clear(); circle(P);
      const A = scale(Rot(th), r); let x = [1, 0]; const tra = [x];
      for (let k = 0; k < n; k++) { x = mv(A, x); tra.push(x); }
      P.path(tra, { color: C.blue, width: 1.4 }); tra.forEach((p, k) => P.dot(p, { color: k === n ? C.vermilion : C.blue, r: k === n ? 6 : 3, sw: 0 }));
      P.dot([1, 0], { color: C.ink, r: 5 });
      const tau = r < 1 ? -0.05 / Math.log(r) : Infinity;
      out.innerHTML = `<p>Eigenvalues r e<sup>±iθ</sup> = ${fmt(r * Math.cos(rad(th)), 3)} ± ${fmt(r * Math.sin(rad(th)), 3)}i</p>
        <table><tr><td>steps per turn</td><td><b>${fmt(360 / th, 1)}</b></td></tr><tr><td>size after ${n} steps</td><td>r<sup>${n}</sup> = ${fmt(Math.pow(r, n), 3)}</td></tr>
        <tr><td>with Δt = 50 ms: τ</td><td>${r < 1 ? fmt(tau, 2) + " s" : r === 1 ? "never decays" : "grows"}</td></tr><tr><td>frequency f</td><td>${fmt(th / 360 / 0.05, 2)} Hz</td></tr></table>
        <p>The angle sets how fast it turns; only r decides whether it spirals in (r &lt; 1), circles (r = 1) or spirals out (r &gt; 1). The vermilion dot is the current step.</p>`;
    }
    draw();
  });

  /* 4. Two modes decaying independently. */
  IX.register("modes", root => {
    const v1 = [0.949, 0.316], v2 = [-0.707, 0.707], c = [0.474, 1.202], l = [0.9, 0.5];
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Neuron 2 over time: the sum of two modes");
    h("p", { class: "ix-panel-title" }, b2, "State space: the fast mode dies first");
    const P = Plane(b1, { x: [0, 25], y: [-0.1, 1.05], xtick: 5, ytick: 0.5, labels: ["step t", ""], width: 400, height: 320, pad: 36, clip: true, title: "Neuron 2 trajectory" });
    const Q = Plane(b2, { x: [-0.8, 1.2], y: [-0.4, 1.1], xtick: 0.5, ytick: 0.5, labels: ["neuron 1", "neuron 2"], width: 400, height: 320, pad: 36, clip: true, title: "State space" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let t = 0;
    const sl = slider(ctl, { label: "Step t", min: 0, max: 25, step: 1, value: 0, onInput: v => { t = v; draw(); } });
    player(ctl, sl, { interval: 450 });
    const out = readout(root);
    const mode = (k, s) => [c[k] * Math.pow(l[k], s) * (k ? v2 : v1)[0], c[k] * Math.pow(l[k], s) * (k ? v2 : v1)[1]];
    const xAt = s => { const a = mode(0, s), b = mode(1, s); return [a[0] + b[0], a[1] + b[1]]; };
    function draw() {
      P.clear(); Q.clear();
      const ss = [...Array(26).keys()];
      P.path(ss.map(s => [s, mode(0, s)[1]]), { color: C.blue, width: 2, dash: "6 4" });
      P.path(ss.map(s => [s, mode(1, s)[1]]), { color: C.vermilion, width: 2, dash: "6 4" });
      P.path(ss.map(s => [s, xAt(s)[1]]), { color: C.ink, width: 2.4 });
      P.line([t, -0.1], [t, 1.05], { color: C.axis, width: 1 });
      [[xAt(t)[1], C.ink], [mode(0, t)[1], C.blue], [mode(1, t)[1], C.vermilion]].forEach(([y, col]) => P.dot([t, y], { color: col, r: 5 }));
      Q.line([-3 * v1[0], -3 * v1[1]], [3 * v1[0], 3 * v1[1]], { color: C.blue, width: 1.2, dash: "3 4" });
      Q.line([-3 * v2[0], -3 * v2[1]], [3 * v2[0], 3 * v2[1]], { color: C.vermilion, width: 1.2, dash: "3 4" });
      const tr = ss.slice(0, t + 1).map(xAt);
      Q.path(tr, { color: C.ink, width: 1.2 }); tr.forEach(p => Q.dot(p, { color: C.ink, r: 2.8, sw: 0 }));
      const a = mode(0, t), x = xAt(t);
      Q.arrow([0, 0], a, { color: C.blue, width: 3 }); Q.arrow(a, x, { color: C.vermilion, width: 3 });
      Q.dot(x, { color: C.ink, r: 5 });
      out.innerHTML = `<p>x<sub>t</sub> = <span class="k-blue">${fmt(c[0], 3)} × 0.9<sup>${t}</sup> v₁</span> + <span class="k-verm">${fmt(c[1], 3)} × 0.5<sup>${t}</sup> v₂</span> = <span class="k-blue">${fmt(c[0] * Math.pow(0.9, t), 3)} v₁</span> + <span class="k-verm">${fmt(c[1] * Math.pow(0.5, t), 4)} v₂</span></p>
        <p>Blue: the slow mode (λ = 0.9), along v₁. Vermilion: the fast mode (λ = 0.5), along v₂. Black: the actual activity, the sum of the two. ${t >= 6 ? "The fast mode is now negligible: the state lies on the slow eigenvector." : "Step forward: each mode shrinks by its own factor, and neither affects the other."}</p>`;
    }
    draw();
  });

  /* 5. Power iteration. */
  IX.register("power-iter", root => {
    const V = [[0.949, -0.707], [0.316, 0.707]], Vi = inv2(V);
    let ratio = 0.8, k = 0;
    buttons(root, [{ label: "0.5", v: 0.5 }, { label: "0.8", v: 0.8 }, { label: "0.95", v: 0.95 }], it => { ratio = it.v; draw(); }, { toggle: true, active: 1, label: "|λ₂ / λ₁|" });
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Each step: multiply by A, rescale to length 1");
    h("p", { class: "ix-panel-title" }, b2, "Angle to the dominant eigenvector (log scale)");
    const P = Plane(b1, { x: [-1.3, 1.3], y: [-1.3, 1.3], xtick: 1, ytick: 1, labels: ["", ""], width: 360, height: 340, pad: 30, title: "Power iteration" });
    const Q = Plane(b2, { x: [0, 30.5], y: [-6, 2.3], xtick: 5, noYTicks: true, labels: ["iteration k", ""], width: 400, height: 340, pad: 44, frame: true, title: "Error in degrees" });
    [-6, -4, -2, 0, 2].forEach(v => Q.text(supLabel(Q, v) + "°", 0, v, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: Q.back }));
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const sl = slider(ctl, { label: "Iteration k", min: 0, max: 30, step: 1, value: 0, onInput: v => { k = v; draw(); } });
    player(ctl, sl, { interval: 300 });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear(); circle(P);
      const A = mm(mm(V, [[1, 0], [0, ratio]]), Vi);
      P.line([-1.3 * V[0][0], -1.3 * V[1][0]], [1.3 * V[0][0], 1.3 * V[1][0]], { color: C.green, width: 1.5, dash: "6 4" });
      let u = [0, 1]; const us = [u], errs = [];
      const err = u => { const c = Math.abs(u[0] * V[0][0] + u[1] * V[1][0]); return deg(Math.acos(Math.min(1, c))); };
      errs.push(err(u));
      for (let i = 0; i < 30; i++) { u = mv(A, u); const n = norm(u); u = [u[0] / n, u[1] / n]; us.push(u); errs.push(err(u)); }
      us.slice(0, k).forEach((p, i) => P.dot(p, { color: C.purple, r: 3.5, sw: 0, opacity: 0.25 + 0.6 * i / Math.max(k, 1) }));
      P.arrow([0, 0], us[k], { color: C.purple, width: 3.5 });
      Q.path(errs.map((e, i) => [i, Math.log10(errs[0]) + i * Math.log10(ratio)]), { color: C.muted, width: 1.2, dash: "5 4" });
      const pts = errs.slice(0, k + 1).map((e, i) => [i, Math.log10(Math.max(e, 1e-7))]);
      Q.path(pts, { color: C.purple, width: 2 }); pts.forEach(p => Q.dot(p, { color: C.purple, r: 3.5, sw: 0 }));
      out.innerHTML = `<p>After ${k} step${k === 1 ? "" : "s"} the direction is <b>${fmt(errs[k], errs[k] < 0.01 ? 6 : 2)}°</b> from the dominant eigenvector (green dashed line).</p>
        <p>The error shrinks by the factor |λ₂/λ₁| = ${ratio} at every step (grey dashed line). ${ratio >= 0.95 ? "With the top two eigenvalues this close, convergence is slow." : "Well-separated eigenvalues give fast convergence."}</p>`;
    }
    draw();
  });

  /* 6. A random recurrent network: the gain moves the eigenvalue disc through the unit circle. */
  IX.register("random-net", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Eigenvalues of the 100 × 100 weight matrix");
    h("p", { class: "ix-panel-title" }, b2, "Size of activity ‖x_t‖ (log scale)");
    const P = Plane(b1, { x: [-1.5, 1.5], y: [-1.5, 1.5], xtick: 1, ytick: 1, labels: ["real", "imag"], width: 360, height: 360, pad: 30, clip: true, title: "Eigenvalues" });
    const Q = Plane(b2, { x: [0, 150], y: [-10, 10], xtick: 50, ytick: 99, labels: ["time step t", ""], width: 400, height: 360, pad: 46, clip: true, title: "Size of activity" });
    [-10, -5, 5, 10].forEach(v => Q.text(supLabel(Q, v), 0, v, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: Q.back }));
    Q.text("1", 0, 0, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: Q.back });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, g = 0.8;
    const sl = slider(ctl, { label: "Gain g", min: 0.6, max: 1.25, step: 0.01, value: g, format: v => fmt(v, 2), onInput: v => { g = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 70 });
    const out = readout(root);
    function draw() {
      if (!D) return; P.clear(); Q.clear(); circle(P, 1, { color: C.ink, width: 1.4 });
      let outside = 0;
      D.l0re.forEach((re, i) => { const z = [g * re, g * D.l0im[i]], o = Math.hypot(z[0], z[1]) > 1 + 1e-9; if (o) outside++; P.dot(z, { color: o ? C.vermilion : C.blue, r: 3.6, sw: 0 }); });
      const L = D.lognorm.map((v, t) => [t, v + t * Math.log10(g)]);
      Q.path(L, { color: g > 1.0001 ? C.vermilion : C.blue, width: 2 });
      out.innerHTML = `<p>Spectral radius ρ = g = <b>${fmt(g, 2)}</b>. ${outside ? `<span class="k-verm">${outside} eigenvalue${outside > 1 ? "s" : ""} outside the unit circle</span>: activity grows by about ${fmt(g, 2)} per step.` : Math.abs(g - 1) < 0.005 ? "The dominant eigenvalue sits on the unit circle: after the other 99 modes die away, the size of activity levels off." : "All 100 eigenvalues are inside the unit circle: every mode decays, and activity shrinks by about " + fmt(g, 2) + " per step."}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 7. A two-neuron rate network: recurrence makes slow timescales, and mu = 1 holds a memory. */
  IX.register("integrator", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 1], y: [-0.2, 3], xtick: 0.2, ytick: 1, labels: ["time (s)", "neuron 1 rate (relative)"], width: 480, height: 360, pad: 44, clip: true, title: "Response to a brief input pulse" });
    const side = h("div", {}, L);
    let mu = 0.95, dir = 1;
    buttons(side, [{ label: "Along (1, 1)" }, { label: "Along (1, −1)" }], (it, i) => { dir = i ? -1 : 1; draw(); }, { toggle: true, label: "Input" });
    const sl = slider(side, { label: "μ along (1, 1)", min: 0.5, max: 1.03, step: 0.01, value: mu, format: v => fmt(v, 2), onInput: v => { mu = v; draw(); } });
    player(side, sl, { bounce: true, interval: 80 });
    const out = readout(side);
    const tn = 0.02, dt = 0.001;
    function draw() {
      P.clear();
      el("rect", { x: P.X(0.1), y: P.Y(3), width: P.X(0.15) - P.X(0.1), height: P.Y(-0.2) - P.Y(3), fill: C.axis, "fill-opacity": 0.25 }, P.layer);
      const a = mu - 0.25, W = [[a, 0.25], [0.25, a]];        // eigenvalues mu along (1,1) and mu - 0.5 along (1,-1)
      let x = [0, 0]; const pts = [];
      for (let k = 0; k < 1000; k++) {
        const t = k * dt, u = t > 0.1 && t < 0.15 ? 1 : 0, Wx = mv(W, x);
        x = [x[0] + dt / tn * (-x[0] + Wx[0] + u), x[1] + dt / tn * (-x[1] + Wx[1] + u * dir)];
        pts.push([t, x[0]]);
      }
      P.path(pts, { color: C.purple, width: 2.5 });
      const m = dir === 1 ? mu : mu - 0.5, tau = tn / (1 - m);
      out.innerHTML = `<table><tr><td>W</td><td>[[${fmt(a, 2)}, 0.25], [0.25, ${fmt(a, 2)}]]</td></tr><tr><td>μ for this input</td><td><b>${fmt(m, 2)}</b></td></tr>
        <tr><td>timescale τ<sub>n</sub>/(1 − μ)</td><td><b>${m < 0.995 ? fmt(tau * 1000, 0) + " ms" : m <= 1.005 ? "∞: held" : "negative: grows"}</b></td></tr></table>
        <p>Each neuron forgets in τ<sub>n</sub> = 20 ms on its own. ${m > 1.005 ? "With μ above 1 the mode is unstable: the input is amplified without limit." : m >= 0.995 ? "With μ = 1 the network integrates: it holds the input for as long as you like." : m > 0.85 ? "Recurrent excitation along this pattern makes the memory last far longer than one neuron could." : "Far from μ = 1 the input fades almost as fast as a single neuron forgets."} The grey band is the 50 ms input pulse.</p>`;
    }
    draw();
  });

  /* 8. Euler simulation can invent instability. */
  IX.register("euler", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 0.3], y: [-1.6, 1.6], xtick: 0.05, ytick: 0.5, labels: ["time (s)", "x"], width: 480, height: 340, pad: 44, clip: true, title: "Exact decay and Euler steps" });
    const side = h("div", {}, L);
    let dt = 5;
    const sl = slider(side, { label: "Step Δt", min: 1, max: 60, step: 1, value: dt, format: v => v + " ms", onInput: v => { dt = v; draw(); } });
    player(side, sl, { interval: 140 });
    const out = readout(side);
    const lam = -50;
    function draw() {
      P.clear();
      const ex = []; for (let t = 0; t <= 0.3; t += 0.002) ex.push([t, Math.exp(lam * t)]);
      P.path(ex, { color: C.ink, width: 2.2 });
      const h_ = dt / 1000, f = 1 + h_ * lam; let x = 1; const pts = [[0, 1]];
      for (let t = h_; t <= 0.3 + 1e-9; t += h_) { x *= f; pts.push([t, x]); if (Math.abs(x) > 50) break; }
      P.path(pts, { color: C.vermilion, width: 1.6 }); pts.forEach(p => P.dot(p, { color: C.vermilion, r: 3.5, sw: 0 }));
      const verdict = Math.abs(f) < 1 ? (f > 0 ? (dt <= 3 ? "accurate" : "stable, but too slow to decay") : "stable, but the sign flips every step") : "unstable, although the real system decays";
      out.innerHTML = `<table><tr><td>Euler factor 1 + Δt λ</td><td><b>${fmt(f, 3)}</b></td></tr><tr><td>exact factor e<sup>λΔt</sup></td><td>${fmt(Math.exp(lam * h_), 3)}</td></tr></table>
        <p>λ = −50 s⁻¹, a neuron's leak with τ<sub>n</sub> = 20 ms. Black: the exact decay. Vermilion: the Euler simulation. At Δt = ${dt} ms it is <b>${verdict}</b>. Euler is stable only for Δt &lt; 2/|λ| = 40 ms.</p>`;
    }
    draw();
  });

  /* 9. Eigenvalues of dynamics fitted to real motor cortex, and two controls. */
  IX.register("eig-real", root => {
    const sets = [{ k: "real", label: "Real activity", col: C.blue }, { k: "noise", label: "Smoothed noise", col: C.orange }, { k: "shuf", label: "Time-shuffled", col: C.green }];
    const on = { real: true, noise: true, shuf: true };
    const bar = h("div", { class: "ix-controls-row" }, root);
    sets.forEach(s => buttons(bar, [{ label: "Show" }, { label: "Hide" }], (it, i) => { on[s.k] = i === 0; draw(); }, { toggle: true, label: s.label }));
    bar.querySelectorAll(".ix-slabel").forEach((e, i) => { e.style.color = sets[i].col; e.style.fontWeight = 700; });
    const P = Plane(root, { x: [-0.05, 1.05], y: [-0.2, 0.2], xtick: 0.2, ytick: 0.1, labels: ["real part", "imaginary part"], width: 700, height: 340, pad: 46, clip: true, frame: true, title: "Eigenvalues of fitted dynamics matrices" });
    const out = readout(root);
    let D = null, pick = null;
    function info(re, im, s) {
      const m = Math.hypot(re, im), tau = -0.05 / Math.log(m), f = Math.abs(Math.atan2(im, re)) / (2 * Math.PI * 0.05);
      return `<p><b style="color:${s.col}">${s.label}</b>: λ = ${fmt(re, 3)} ${im < 0 ? "−" : "+"} ${fmt(Math.abs(im), 3)}i, |λ| = ${fmt(m, 3)}, so τ = −Δt / ln|λ| = <b>${fmt(tau, 2)} s</b> and f = <b>${fmt(f, 2)} Hz</b> (Δt = 50 ms).</p>`;
    }
    function draw() {
      if (!D) return; P.clear();
      const arc = []; for (let a = -12; a <= 12; a += 0.5) arc.push([Math.cos(rad(a)), Math.sin(rad(a))]);
      P.path(arc, { color: C.ink, width: 1.4 }); P.text("unit circle", 0.96, -0.17, { anchor: "end", color: C.muted, size: 11 });
      sets.forEach(s => { if (!on[s.k]) return; D[s.k + "re"].forEach((re, i) => {
        const im = D[s.k + "im"][i], d = P.dot([re, im], { color: s.col, r: 6, sw: 1.5 });
        d.style.cursor = "pointer"; d.addEventListener("click", () => { pick = [re, im, s]; draw(); });
      }); });
      if (pick) P.dot([pick[0], pick[1]], { fill: "none", stroke: C.ink, sw: 2, r: 10 });
      out.innerHTML = (pick ? info(...pick) : "") + `<table><tr><th>fitted to</th><th>spectral radius</th><th>slowest τ</th></tr><tr><td>real activity</td><td>0.927</td><td>0.66 s</td></tr><tr><td>smoothed white noise</td><td>0.794</td><td>0.22 s</td></tr><tr><td>time-shuffled activity</td><td>0.505</td><td>0.07 s</td></tr></table>
        <p>Click any eigenvalue to read its timescale and frequency. The real activity's eigenvalues sit closest to the unit circle and slightly off the real axis: slow, gently rotating modes.</p>`;
    }
    data().then(d => { D = d; const i = d.realre.map((r, j) => Math.hypot(r, d.realim[j])).reduce((b, v, j, a) => v > a[b] ? j : b, 0); pick = [d.realre[i], d.realim[i], sets[0]]; draw(); });
  });
})();
