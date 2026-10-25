/* Lesson 23: Coupled ODEs and the Wilson–Cowan Model. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, contours, heat } = window.IX;
  const eig2 = J => { const tr = J[0][0] + J[1][1], det = J[0][0] * J[1][1] - J[0][1] * J[1][0], disc = tr * tr - 4 * det; return { tr, det, disc, re: disc >= 0 ? [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2] : [tr / 2, tr / 2], im: disc < 0 ? Math.sqrt(-disc) / 2 : 0 }; };
  const classify = e => e.det < 0 ? "saddle" : Math.abs(e.tr) < 1e-12 ? "centre" : (e.tr < 0 ? "stable " : "unstable ") + (e.disc >= 0 ? "node" : "focus");
  const fmtEig = e => e.im ? `${fmt(e.re[0], 4)} ± ${fmt(e.im, 4)}i` : `${fmt(e.re[0], 4)}, ${fmt(e.re[1], 4)}`;
  function jac(F, x, hh = 1e-6) { const J = [[0, 0], [0, 0]]; for (let j = 0; j < 2; j++) { const a = x.slice(), b = x.slice(); a[j] += hh; b[j] -= hh; const fa = F(a), fb = F(b); J[0][j] = (fa[0] - fb[0]) / (2 * hh); J[1][j] = (fa[1] - fb[1]) / (2 * hh); } return J; }
  function fixedPoints(F, lo = -0.02, hi = 1.02) {
    const pts = [];
    for (let a = 0; a <= 1.0001; a += 0.1) for (let b = 0; b <= 1.0001; b += 0.1) {
      let x = [a, b];
      for (let k = 0; k < 60; k++) { const f = F(x), J = jac(F, x), d = J[0][0] * J[1][1] - J[0][1] * J[1][0]; if (Math.abs(d) < 1e-14) break; const dx = [(J[1][1] * f[0] - J[0][1] * f[1]) / d, (-J[1][0] * f[0] + J[0][0] * f[1]) / d]; x = [x[0] - dx[0], x[1] - dx[1]]; if (!isFinite(x[0]) || x[0] < lo - 0.5 || x[0] > hi + 0.5) break; }
      const f = F(x); if (isFinite(x[0]) && Math.hypot(...f) < 1e-10 && x[0] > lo && x[0] < hi && x[1] > lo && x[1] < hi && !pts.some(p => Math.hypot(p[0] - x[0], p[1] - x[1]) < 1e-4)) pts.push(x);
    }
    return pts;
  }
  function traj(F, x0, T, dt = 0.2) { let x = x0.slice(); const pts = [x.slice()]; for (let t = 0; t < T; t += dt) { const f = F(x); x = [x[0] + dt * f[0], x[1] + dt * f[1]]; pts.push(x.slice()); } return pts; }
  const fpDot = (P, x, st) => P.dot(x, st ? { color: C.green, r: 7 } : { fill: "#fff", stroke: C.ink, sw: 2, r: 7 });

  /* 1. A sag from a second, slow variable. */
  IX.register("sag-model", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 500], y: [-11, 0.5], xtick: 100, ytick: 2, frame: true, labels: ["time (ms)", "u = V − E_L (mV)"], width: 480, height: 320, pad: 48, clip: true, title: "Response to −100 pA" });
    const side = h("div", {}, L0);
    let g = 0.5;
    const sl = slider(side, { label: "Coupling g", min: 0, max: 4, step: 0.05, value: g, format: v => fmt(v, 2), onInput: v => { g = v; draw(); } });
    player(side, sl, { bounce: true, interval: 90 });
    const out = readout(side);
    const tm = 30, tw = 150, RI = -10;
    function draw() {
      P.clear();
      let u = 0, w = 0; const pts = [[0, 0]], ws = [[0, 0]];
      for (let t = 0; t < 500; t += 0.1) { const du = (-u - w + RI) / tm, dw = (-w + g * u) / tw; u += 0.1 * du; w += 0.1 * dw; pts.push([t + 0.1, u]); ws.push([t + 0.1, w]); }
      P.line([0, RI / (1 + g)], [500, RI / (1 + g)], { color: C.muted, dash: "4 4", width: 1.2 });
      P.path(ws, { color: C.orange, width: 1.6, dash: "6 4" });
      P.path(pts, { color: C.blue, width: 2.6 });
      const e = eig2([[-1 / tm, -1 / tm], [g / tw, -1 / tw]]), gs = tm * tw * e.tr * e.tr / 4 - 1;
      out.innerHTML = `<table><tr><td>Jacobian eigenvalues (1/ms)</td><td>${fmtEig(e)}</td></tr><tr><td>type</td><td><b>${classify(e)}</b></td></tr><tr><td>steady deflection R I/(1 + g)</td><td>${fmt(RI / (1 + g), 2)} mV</td></tr></table>
        <p>τ_m u̇ = −u − w + R I, τ_w ẇ = −w + g u, with τ_m = 30 ms, τ_w = 150 ms. The slow variable <span class="k-orange">w</span> (dashed) builds up and pulls the voltage <span class="k-blue">u</span> back: a sag. Above g* = ${fmt(gs, 2)} the eigenvalues become complex and the response rings, but the trace stays negative and the determinant positive: always stable.</p>`;
    }
    draw();
  });

  /* 2. Linear phase portraits and the trace–determinant plane. */
  IX.register("linear-portraits", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Phase portrait of ẋ = J x");
    h("p", { class: "ix-panel-title" }, b2, "Trace–determinant plane");
    const P = Plane(b1, { x: [-2, 2], y: [-2, 2], xtick: 1, ytick: 1, labels: ["x₁", "x₂"], width: 380, height: 360, pad: 28, clip: true, title: "Portrait" });
    const Q = Plane(b2, { x: [-3, 3], y: [-2, 4.6], xtick: 1, ytick: 1, labels: ["trace", "det"], width: 380, height: 360, pad: 28, clip: true, title: "Classification" });
    const presets = [{ label: "stable node", J: [[-2, 0], [0, -0.5]] }, { label: "stable focus", J: [[-0.5, 2], [-2, -0.5]] }, { label: "saddle", J: [[1, 2], [3, -1]] }, { label: "centre", J: [[0, 1], [-1, 0]] }, { label: "unstable focus", J: [[0.3, 1.5], [-1.5, 0.3]] }];
    let J = presets[1].J.map(r => r.slice());
    const sls = [];
    buttons(root, presets, it => { J = it.J.map(r => r.slice()); sls.forEach((s, k) => s.set(J[k >> 1][k & 1])); draw(); }, { toggle: true, label: "Example", active: 1 });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    ["J₁₁", "J₁₂", "J₂₁", "J₂₂"].forEach((lab, k) => sls.push(slider(ctl, { label: lab, min: -3, max: 3, step: 0.1, value: J[k >> 1][k & 1], format: v => fmt(v, 1), onInput: v => { J[k >> 1][k & 1] = v; draw(); } })));
    player(ctl, sls[3], { bounce: true, interval: 120 });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      const F = x => [J[0][0] * x[0] + J[0][1] * x[1], J[1][0] * x[0] + J[1][1] * x[1]];
      for (let a = -1.8; a <= 1.81; a += 0.4) for (let b = -1.8; b <= 1.81; b += 0.4) { const f = F([a, b]), n = Math.hypot(...f) || 1; P.line([a - 0.12 * f[0] / n, b - 0.12 * f[1] / n], [a + 0.12 * f[0] / n, b + 0.12 * f[1] / n], { color: C.axis, width: 1 }); }
      const e = eig2(J);
      if (e.disc >= 0 && Math.abs(J[0][1]) + Math.abs(e.re[0] - J[0][0]) > 1e-9) e.re.forEach(l => { let v = Math.abs(J[0][1]) > 1e-9 ? [J[0][1], l - J[0][0]] : [l - J[1][1], J[1][0]]; const n = Math.hypot(...v); if (n > 1e-9) { v = [v[0] / n, v[1] / n]; P.line([-3 * v[0], -3 * v[1]], [3 * v[0], 3 * v[1]], { color: C.vermilion, dash: "5 4", width: 1.4 }); } });
      const starts = []; for (let k = 0; k < 12; k++) { const a = 2 * Math.PI * k / 12; starts.push([1.7 * Math.cos(a), 1.7 * Math.sin(a)]); }
      starts.forEach(s => { const pts = traj(F, s, 5, 0.01).filter(p => Math.abs(p[0]) < 4 && Math.abs(p[1]) < 4); P.path(pts, { color: C.blue, width: 1.3 }); });
      P.dot([0, 0], { color: C.ink, r: 4 });
      const par = []; for (let t = -3; t <= 3; t += 0.05) par.push([t, t * t / 4]);
      Q.line([-3, 0], [3, 0], { color: C.axis, width: 1 }); Q.line([0, -2], [0, 4], { color: C.axis, width: 1 });
      Q.path(par, { color: C.ink, width: 1.6 });
      [["saddle", -1.8, -1.2], ["stable node", -2.6, 0.6], ["stable focus", -1.4, 3.4], ["unstable focus", 1.4, 3.4], ["unstable node", 2.6, 0.6]].forEach(([s, x, y]) => Q.text(s, x, y, { anchor: "middle", size: 12, color: C.muted, layer: Q.back }));
      Q.dot([e.tr, e.det], { color: C.vermilion, r: 7 });
      out.innerHTML = `<table><tr><td>trace τ, determinant Δ</td><td>${fmt(e.tr, 2)}, ${fmt(e.det, 2)}</td></tr><tr><td>eigenvalues</td><td>${fmtEig(e)}</td></tr><tr><td>type</td><td><b>${classify(e)}</b></td></tr></table>
        <p>Trajectories (blue) of a linear system from 12 starts; vermilion dashed lines are the eigenvector directions when the eigenvalues are real. Stable if and only if τ &lt; 0 and Δ &gt; 0; oscillating (a focus) above the parabola τ² = 4Δ; a saddle whenever Δ &lt; 0, whatever the trace.</p>`;
    }
    draw();
  });

  /* 3. A decision circuit: nullclines, fixed points and basins. */
  IX.register("decision", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [-0.02, 1.02], y: [-0.02, 1.02], xtick: 0.2, ytick: 0.2, labels: ["r₁", "r₂"], width: 440, height: 420, pad: 34, clip: true, title: "Decision circuit phase plane" });
    const side = h("div", {}, L0);
    h("p", { class: "ix-hint" }, side, "Drag the black start point.");
    let dI = 0, st = [0.15, 0.3];
    const sl = slider(side, { label: "Input bias I₁ − I₂", min: -0.1, max: 0.1, step: 0.005, value: dI, format: v => fmt(v, 3), onInput: v => { dI = v; draw(); } });
    player(side, sl, { bounce: true, interval: 400 });
    const out = readout(side);
    const Fs = u => 1 / (1 + Math.exp(-(u - 0.5) / 0.1)), ws = 0.6, wc = 1, tau = 10;
    function draw() {
      P.clear();
      const I1 = 0.45 + dI / 2, I2 = 0.45 - dI / 2, F = x => [(-x[0] + Fs(ws * x[0] - wc * x[1] + I1)) / tau, (-x[1] + Fs(ws * x[1] - wc * x[0] + I2)) / tau];
      heat(P, (a, b) => { let x = [a, b]; for (let k = 0; k < 150; k++) { const f = F(x); x = [x[0] + 2 * f[0], x[1] + 2 * f[1]]; } return x[0] - x[1]; }, v => v > 0.1 ? "rgba(86,180,233,0.22)" : v < -0.1 ? "rgba(0,158,115,0.18)" : "rgba(0,0,0,0.05)", { n: 34, layer: P.back });
      contours(P, (a, b) => -a + Fs(ws * a - wc * b + I1), [0], { color: C.blue, width: 2, n: 90 });
      contours(P, (a, b) => -b + Fs(ws * b - wc * a + I2), [0], { color: C.vermilion, width: 2, n: 90, dashFn: () => "7 5" });
      const tr = traj(F, st, 400, 0.5); P.path(tr, { color: C.ink, width: 1.8 });
      const fps = fixedPoints(F); let txt = "";
      fps.forEach(x => { const e = eig2(jac(F, x)), s = e.re[0] < 0 && e.re[1] < 0; fpDot(P, x, s); txt += `<tr><td>(${fmt(x[0], 3)}, ${fmt(x[1], 3)})</td><td>${classify(e)}</td></tr>`; });
      const end = tr[tr.length - 1], who = end[0] > end[1] + 0.1 ? "choice 1" : end[1] > end[0] + 0.1 ? "choice 2" : "undecided";
      out.innerHTML = `<table>${txt}</table><p>Nullclines: <span class="k-blue">ṙ₁ = 0</span> (solid) and <span class="k-verm">ṙ₂ = 0</span> (dashed); fixed points where they cross (filled: stable, open: saddle). Shading shows the basins: sky blue ends at choice 1, green at choice 2. From your start the circuit chooses <b>${who}</b>.</p><p>With equal inputs the diagonal splits the plane in two; a bias towards one population enlarges its basin.</p>`;
    }
    P.handle(st, { color: C.ink, name: "start", onMove: q => { st = q; draw(); } });
    draw();
  });

  /* 4. The Wilson–Cowan model: bistability and a limit cycle. */
  IX.register("wilson-cowan", root => {
    const base = { tE: 10, tI: 20, aE: 1.2, thE: 2.8, aI: 1, thI: 4, Q: 0 };
    const sets = [{ label: "Set A: bistable", p: Object.assign({}, base, { wEE: 9, wEI: 4, wIE: 13, wII: 11, P: 0 }) }, { label: "Set B: oscillating", p: Object.assign({}, base, { wEE: 6.4, wEI: 4.8, wIE: 6, wII: 1.2, P: 0.9 }) }];
    let si = 1, p = Object.assign({}, sets[1].p), st = [0.1, 0.05];
    buttons(root, sets, (it, i) => { si = i; p = Object.assign({}, it.p); sP.set(p.P); draw(); }, { toggle: true, label: "Parameters", active: 1 });
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Phase plane");
    h("p", { class: "ix-panel-title" }, b2, "Time course");
    const P = Plane(b1, { x: [-0.02, 1], y: [-0.02, 1], xtick: 0.2, ytick: 0.2, labels: ["r_E", "r_I"], width: 380, height: 360, pad: 30, clip: true, title: "Phase plane" });
    const Q = Plane(b2, { x: [0, 600], y: [-0.02, 1], xtick: 100, ytick: 0.2, frame: true, labels: ["time (ms)", "activity"], width: 380, height: 360, pad: 44, clip: true, title: "Time course" });
    h("p", { class: "ix-hint" }, root, "Drag the black point in the phase plane to choose the start.");
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const sP = slider(ctl, { label: "External drive P", min: 0, max: 2, step: 0.025, value: p.P, format: v => fmt(v, 3), onInput: v => { p.P = v; draw(); } });
    player(ctl, sP, { bounce: true, interval: 250 });
    const out = readout(root);
    const Fw = (x, a, th) => 1 / (1 + Math.exp(-a * (x - th))) - 1 / (1 + Math.exp(a * th));
    function draw() {
      P.clear(); Q.clear();
      const F = x => [(-x[0] + Fw(p.wEE * x[0] - p.wEI * x[1] + p.P, p.aE, p.thE)) / p.tE, (-x[1] + Fw(p.wIE * x[0] - p.wII * x[1] + p.Q, p.aI, p.thI)) / p.tI];
      contours(P, (a, b) => -a + Fw(p.wEE * a - p.wEI * b + p.P, p.aE, p.thE), [0], { color: C.blue, width: 2, n: 100 });
      contours(P, (a, b) => -b + Fw(p.wIE * a - p.wII * b + p.Q, p.aI, p.thI), [0], { color: C.vermilion, width: 2, n: 100, dashFn: () => "7 5" });
      const tr = traj(F, st, 600, 0.1); P.path(tr, { color: C.ink, width: 1.6 });
      Q.path(tr.map((x, k) => [k * 0.1, x[0]]), { color: C.blue, width: 2 }); Q.path(tr.map((x, k) => [k * 0.1, x[1]]), { color: C.vermilion, width: 1.6, dash: "6 4" });
      const fps = fixedPoints(F); let txt = "";
      fps.forEach(x => { const e = eig2(jac(F, x)), s = e.re[0] < 0 && e.re[1] < 0; fpDot(P, x, s); txt += `<tr><td>(${fmt(x[0], 3)}, ${fmt(x[1], 3)})</td><td>${fmtEig(e)}</td><td>${classify(e)}</td></tr>`; });
      const late = tr.slice(3000).map(x => x[0]), amp = Math.max(...late) - Math.min(...late);
      out.innerHTML = `<table><tr><td><b>fixed point</b></td><td><b>eigenvalues (1/ms)</b></td><td><b>type</b></td></tr>${txt}</table>
        <p>Nullclines: <span class="k-blue">ṙ_E = 0</span> (solid) and <span class="k-verm">ṙ_I = 0</span> (dashed). Right: r_E (blue) and r_I (vermilion dashed) from the chosen start. ${amp > 0.05 ? `<b>Sustained oscillation</b>: r_E swings by ${fmt(amp, 2)} after transients. Excitation recruits inhibition with a delay, inhibition shuts excitation down, and the cycle repeats.` : "The activity settles on a stable fixed point."} ${si === 0 ? "Set A has a low and a high stable state separated by a saddle: start on either side of it." : "In Set B, sweep P: a saddle-node near P = 0.7 starts the rhythm, and a Hopf bifurcation near P = 1 ends it."}</p>`;
    }
    P.handle(st, { color: C.ink, name: "start", onMove: q => { st = q; draw(); } });
    draw();
  });
})();
