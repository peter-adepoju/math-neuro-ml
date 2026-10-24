/* Lesson 14: Multivariable Gradients. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el, contours, heat } = window.IX;
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const mix = (a, b, t) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; };
  const seq = (v, lo, hi) => mix("#f4f8fb", "#0072b2", Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * 0.85);
  function curve(P, f, s = {}, x0 = P.opts.x[0], x1 = P.opts.x[1], n = 300) { const pts = []; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push([x, f(x)]); } P.path(pts, s); }
  function eig2(a, b, c) { const m = (a + c) / 2, r = Math.hypot((a - c) / 2, b), th = 0.5 * Math.atan2(2 * b, a - c); return { l: [m + r, m - r], v: [[Math.cos(th), Math.sin(th)], [-Math.sin(th), Math.cos(th)]] }; }

  /* 1. A place field: gradient, contours and directional derivatives. */
  IX.register("place-field", root => {
    const x0 = 60, y0 = 40, s = 15, r0 = 0.5, rm = 20;
    const r = (x, y) => r0 + rm * Math.exp(-((x - x0) ** 2 + (y - y0) ** 2) / (2 * s * s));
    const grad = (x, y) => { const g = rm * Math.exp(-((x - x0) ** 2 + (y - y0) ** 2) / (2 * s * s)); return [-g * (x - x0) / (s * s), -g * (y - y0) / (s * s)]; };
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Rate map (spikes/s) with contours");
    h("p", { class: "ix-panel-title" }, b2, "Slope along u, for every direction");
    const P = Plane(b1, { x: [0, 100], y: [0, 80], xtick: 20, ytick: 20, frame: true, labels: ["x (cm)", "y (cm)"], width: 400, height: 340, pad: 40, clip: true, title: "Place field" });
    const Q = Plane(b2, { x: [0, 360], y: [-1.3, 1.3], xtick: 90, ytick: 0.5, labels: ["direction of u (°)", "spikes/s per cm"], width: 400, height: 340, pad: 44, clip: true, title: "Directional derivative" });
    heat(P, r, v => seq(v, 0, 21), { layer: P.back, n: 50, m: 40 });
    contours(P, r, [2, 5, 8, 11, 14, 17, 20], { color: "#ffffff", width: 1.2, layer: P.back, n: 100, m: 80 });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let pt = [45, 50], th = 30;
    const sl = slider(ctl, { label: "Direction of u", min: 0, max: 360, step: 2, value: th, format: v => v + "°", onInput: v => { th = v; draw(); } });
    player(ctl, sl, { interval: 40 });
    h("p", { class: "ix-hint" }, root, "Drag the black point anywhere in the map.");
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      const g = grad(...pt), gl = Math.hypot(...g), u = [Math.cos(rad(th)), Math.sin(rad(th))], d = g[0] * u[0] + g[1] * u[1];
      const sc = 18 / Math.max(gl, 0.05);
      P.arrow(pt, [pt[0] + g[0] * sc, pt[1] + g[1] * sc], { color: C.vermilion, width: 3 });
      P.arrow(pt, [pt[0] + 14 * u[0], pt[1] + 14 * u[1]], { color: C.purple, width: 3 });
      const gdir = (deg(Math.atan2(g[1], g[0])) + 360) % 360;
      Q.line([0, 0], [360, 0], { color: C.axis, width: 1 });
      curve(Q, a => g[0] * Math.cos(rad(a)) + g[1] * Math.sin(rad(a)), { color: C.blue, width: 2.4 }, 0, 360);
      Q.line([gdir, -1.3], [gdir, 1.3], { color: C.vermilion, dash: "4 4", width: 1.2 });
      Q.dot([th, d], { color: C.purple, r: 6 });
      out.innerHTML = `<table><tr><td>position</td><td>(${fmt(pt[0], 1)}, ${fmt(pt[1], 1)}) cm, rate ${fmt(r(...pt), 2)} spikes/s</td></tr><tr><td>∂r/∂x, ∂r/∂y</td><td>${fmt(g[0], 3)}, ${fmt(g[1], 3)} spikes/s per cm</td></tr>
        <tr><td><span class="k-verm">gradient</span> length (steepest slope)</td><td><b>${fmt(gl, 3)}</b> at ${fmt(gdir, 0)}°</td></tr><tr><td><span class="k-purple">slope along u</span> = ∇r · u</td><td><b>${fmt(d, 3)}</b></td></tr></table>
        <p>The gradient (vermilion) points uphill, towards the field's centre, at right angles to the contours. As u turns, the slope along it traces a cosine (right): largest along the gradient, zero along a contour, most negative straight downhill.</p>`;
    }
    P.handle(pt, { color: C.ink, name: "position", snap: 0.5, onMove: p => { pt = p; draw(); } });
    draw();
  });

  /* 2. The Hessian classifies critical points. */
  IX.register("hessian", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-2, 2], y: [-2, 2], xtick: 1, ytick: 1, labels: ["x", "y"], width: 420, height: 420, pad: 30, clip: true, title: "Contours of a quadratic form" });
    const side = h("div", {}, L);
    const H = { a: 2, b: 0, c: 4 };
    buttons(side, [{ label: "Minimum", v: [2, 0, 4] }, { label: "Maximum", v: [-2, 0, -2] }, { label: "Saddle", v: [2, 0, -2] }, { label: "x² − 4xy + y²", v: [2, -4, 2] }], it => { [H.a, H.b, H.c] = it.v; sa.set(H.a); sb.set(H.b); sc.set(H.c); draw(); }, { label: "Examples" });
    const sa = slider(side, { label: "∂²f/∂x²", min: -4, max: 4, step: 0.1, value: H.a, format: v => fmt(v, 1), onInput: v => { H.a = v; draw(); } });
    const sb = slider(side, { label: "∂²f/∂x∂y", min: -4, max: 4, step: 0.1, value: H.b, format: v => fmt(v, 1), onInput: v => { H.b = v; draw(); } });
    const sc = slider(side, { label: "∂²f/∂y²", min: -4, max: 4, step: 0.1, value: H.c, format: v => fmt(v, 1), onInput: v => { H.c = v; draw(); } });
    player(side, sb, { bounce: true, interval: 70 });
    const out = readout(side);
    function draw() {
      P.clear();
      const f = (x, y) => 0.5 * (H.a * x * x + 2 * H.b * x * y + H.c * y * y);
      const lv = [-4, -2.5, -1.5, -0.8, -0.3, 0.3, 0.8, 1.5, 2.5, 4];
      contours(P, f, lv, { colorFn: v => v > 0 ? C.blue : C.vermilion, dashFn: v => v > 0 ? "" : "4 3", n: 80 });
      const E = eig2(H.a, H.b, H.c);
      E.v.forEach((v, i) => { const col = E.l[i] > 0 ? C.blue : C.vermilion; P.arrow([0, 0], [1.5 * v[0], 1.5 * v[1]], { color: col, width: 2.6 }); P.arrow([0, 0], [-1.5 * v[0], -1.5 * v[1]], { color: col, width: 2.6 }); });
      P.dot([0, 0], { color: C.ink, r: 5 });
      const det = H.a * H.c - H.b * H.b, kind = E.l[1] > 1e-9 ? "minimum" : E.l[0] < -1e-9 ? "maximum" : E.l[0] > 1e-9 && E.l[1] < -1e-9 ? "saddle" : "inconclusive (an eigenvalue is 0)";
      out.innerHTML = `<p>H = [[${fmt(H.a, 1)}, ${fmt(H.b, 1)}], [${fmt(H.b, 1)}, ${fmt(H.c, 1)}]], det H = ${fmt(det, 2)}</p><table><tr><td>eigenvalues</td><td>${fmt(E.l[0], 2)}, ${fmt(E.l[1], 2)}</td></tr><tr><td>the origin is a</td><td><b>${kind}</b></td></tr></table>
        <p>Contours of f = ½ hᵀHh: blue solid where f &gt; 0, vermilion dashed where f &lt; 0. The arrows are the eigenvectors: blue where the surface curves up, vermilion where it curves down. Press Play to sweep the mixed partial: once it is large enough, a minimum with positive diagonal entries turns into a saddle.</p>`;
    }
    draw();
  });

  /* 3. Two subfields: two maxima and a saddle that merge as they approach. */
  IX.register("two-subfields", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 100], y: [10, 70], xtick: 20, ytick: 20, frame: true, labels: ["x (cm)", "y (cm)"], width: 480, height: 330, pad: 40, clip: true, title: "Two place subfields" });
    const side = h("div", {}, L);
    let sep = 34;
    const sl = slider(side, { label: "Separation", min: 10, max: 50, step: 0.5, value: sep, format: v => fmt(v, 1) + " cm", onInput: v => { sep = v; draw(); } });
    player(side, sl, { bounce: true, interval: 70 });
    const out = readout(side);
    const s = 12, A1 = 12, A2 = 16;
    function draw() {
      P.clear();
      const c1 = [50 - sep / 2, 40], c2 = [50 + sep / 2, 42];
      const g = (x, y, c) => Math.exp(-((x - c[0]) ** 2 + (y - c[1]) ** 2) / (2 * s * s));
      const f = (x, y) => 0.5 + A1 * g(x, y, c1) + A2 * g(x, y, c2);
      heat(P, f, v => seq(v, 0, 17), { n: 50, m: 30 });
      contours(P, f, [1, 3, 5, 7, 9, 11, 13, 15], { color: "#ffffff", width: 1.1, n: 100, m: 60 });
      const gr = (x, y) => { const e = 1e-3; return [(f(x + e, y) - f(x - e, y)) / (2 * e), (f(x, y + e) - f(x, y - e)) / (2 * e)]; };
      const hs = (x, y) => { const e = 1e-2, a = (f(x + e, y) - 2 * f(x, y) + f(x - e, y)) / (e * e), c = (f(x, y + e) - 2 * f(x, y) + f(x, y - e)) / (e * e), b = (f(x + e, y + e) - f(x + e, y - e) - f(x - e, y + e) + f(x - e, y - e)) / (4 * e * e); return [a, b, c]; };
      const newton = p => { for (let k = 0; k < 40; k++) { const G = gr(...p), [a, b, c] = hs(...p), d = a * c - b * b; if (Math.abs(d) < 1e-12) break; p = [p[0] - (c * G[0] - b * G[1]) / d, p[1] - (-b * G[0] + a * G[1]) / d]; } return p; };
      const cands = [c1, c2, [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2]].map(p => newton(p.slice()));
      const uniq = []; cands.forEach(p => { if (isFinite(p[0]) && p[0] > 0 && p[0] < 100 && !uniq.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.5)) uniq.push(p); });
      const rows = uniq.map(p => { const [a, b, c] = hs(...p), E = eig2(a, b, c), kind = E.l[0] < 0 ? "maximum" : E.l[1] < 0 ? "saddle" : "minimum"; P.dot(p, { color: kind === "saddle" ? C.vermilion : C.green, r: 7 }); return `<tr><td>${kind} at (${fmt(p[0], 1)}, ${fmt(p[1], 1)})</td><td>eigenvalues ${fmt(E.l[0], 3)}, ${fmt(E.l[1], 3)}</td></tr>`; });
      out.innerHTML = `<table>${rows.join("")}</table><p>Green: maxima (both Hessian eigenvalues negative). Vermilion: a saddle (one positive, one negative): uphill towards each peak, downhill across the gap. Bring the subfields closer than about 2 widths (24 cm) and the saddle and the smaller peak merge: one peak is left.</p>`;
    }
    draw();
  });

  /* 4. Units change the shape of a loss. */
  IX.register("scaling", root => {
    let e = 0, std = false;
    const bar = h("div", { class: "ix-controls-row" }, root);
    buttons(bar, [{ label: "Raw units" }, { label: "Standardised" }], (it, i) => { std = i === 1; draw(); }, { toggle: true, label: "Features" });
    const L = layout(root, true);
    const P = Plane(L, { x: [-3, 3], y: [-3, 3], xtick: 1, ytick: 1, labels: ["weight on speed", "weight on distance"], width: 420, height: 420, pad: 30, clip: true, title: "Loss contours, equal axis scales" });
    const side = h("div", {}, L);
    const sl = slider(side, { label: "Distance unit", min: -2, max: 0, step: 0.05, value: 0, format: v => v > -0.03 ? "cm" : v < -1.97 ? "m" : "× " + fmt(Math.pow(10, -v), 1), onInput: v => { e = v; draw(); } });
    player(side, sl, { bounce: true, interval: 70 });
    const out = readout(side);
    function draw() {
      P.clear();
      const rho = 0.6, r = std ? 1 : 0.684 * Math.pow(10, e), H = [1, rho * r, r * r];
      const f = (x, y) => 0.5 * (H[0] * x * x + 2 * H[1] * x * y + H[2] * y * y);
      contours(P, f, [0.05, 0.2, 0.5, 1, 2], { color: C.blue, n: 90 });
      const E = eig2(...H), k = E.l[0] / E.l[1];
      const p = [1.6, 1.2], g = [H[0] * p[0] + H[1] * p[1], H[1] * p[0] + H[2] * p[1]], gl = Math.hypot(...g);
      P.arrow(p, [p[0] - 1.1 * g[0] / gl, p[1] - 1.1 * g[1] / gl], { color: C.vermilion, width: 3 });
      P.dot(p, { color: C.vermilion, r: 5 }); P.dot([0, 0], { color: C.ink, r: 5 });
      out.innerHTML = `<table><tr><td>Hessian condition number</td><td><b>${k > 1000 ? Math.round(k).toLocaleString("en-GB") : fmt(k, 1)}</b></td></tr></table>
        <p>Two correlated features (correlation 0.6). Measuring distance in metres instead of centimetres multiplies its weight by 100, and squeezes the loss into a long, thin valley: the condition number rises from 5 to about 34,000. Standardising gives 4; the rest is the correlation, which no rescaling removes. The vermilion arrow is the downhill direction −∇L from a point: in a long valley it points across the valley, not at the minimum (black).</p>`;
    }
    draw();
  });

  /* 5. A V1 neuron's contrast response as a surface: data and model. */
  IX.register("contrast-surface", root => {
    const lv = [0, 0.25, 0.5, 1];
    const R = [[6.6, 5, 9.8, 11.7], [36.4, 37.5, 28.8, 38.2], [50.5, 56.2, 50.7, 43.6], [62.4, 66.5, 75.6, 76]];   /* rows c_R, columns c_L, spikes/s */
    const N = [[108, 12, 26, 21], [11, 6, 13, 20], [19, 13, 7, 11], [35, 24, 9, 5]];
    const b = [0.8489, 0.4182, 1.7548], model = (cl, cr) => Math.exp(b[0] + b[1] * cl + b[2] * cr) / 0.2;
    let which = "data";
    buttons(root, [{ label: "Data" }, { label: "Log-linear model" }], (it, i) => { which = i ? "model" : "data"; draw(); }, { toggle: true, label: "Show" });
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Rate on the 16 stimuli, with its gradient");
    h("p", { class: "ix-panel-title" }, b2, "Slice: rate against right contrast, left = 0");
    const P = Plane(b1, { x: [-0.12, 1.12], y: [-0.12, 1.3], xtick: 0.25, ytick: 0.25, frame: true, labels: ["left contrast c_L", "right contrast c_R"], width: 400, height: 380, pad: 44, clip: true, title: "Rate surface" });
    const Q = Plane(b2, { x: [0, 1], y: [0, 80], xtick: 0.25, ytick: 20, frame: true, labels: ["right contrast c_R", "rate (spikes/s)"], width: 400, height: 380, pad: 44, clip: true, title: "Slice" });
    const out = readout(root);
    const grad1 = (vals, x) => vals.map((_, i) => { if (i === 0) return (vals[1] - vals[0]) / (x[1] - x[0]); if (i === vals.length - 1) return (vals[i] - vals[i - 1]) / (x[i] - x[i - 1]); const h1 = x[i] - x[i - 1], h2 = x[i + 1] - x[i]; return (h1 * h1 * vals[i + 1] - h2 * h2 * vals[i - 1] + (h2 * h2 - h1 * h1) * vals[i]) / (h1 * h2 * (h1 + h2)); });
    function draw() {
      P.clear(); Q.clear();
      const M = which === "data" ? R : lv.map(cr => lv.map(cl => model(cl, cr)));
      const dR = lv.map((_, j) => grad1(M.map(r => r[j]), lv)), dL = M.map(r => grad1(r, lv));
      M.forEach((row, i) => row.forEach((v, j) => { el("rect", { x: P.X(lv[j] - 0.1), y: P.Y(lv[i] + 0.1), width: P.X(0.2) - P.X(0), height: P.Y(0) - P.Y(0.2), fill: seq(v, 0, 80), rx: 3 }, P.layer); }));
      M.forEach((row, i) => row.forEach((v, j) => { const g = [dL[i][j], dR[j][i]], sc = 0.0024; P.arrow([lv[j], lv[i]], [lv[j] + g[0] * sc, lv[i] + g[1] * sc], { color: C.vermilion, width: 2.2 }); P.text(fmt(v, 0), lv[j], lv[i], { dx: -6, dy: 14, anchor: "end", size: 10.5, color: C.ink, halo: true }); }));
      R.map(r => r[0]).forEach((v, i) => { const se = Math.sqrt(v / (0.2 * N[i][0])); Q.line([lv[i], v - se], [lv[i], v + se], { color: C.ink, width: 1 }); Q.dot([lv[i], v], { color: C.ink, r: 5 }); });
      curve(Q, cr => model(0, cr), { color: C.blue, width: 2.4 }, 0, 1);
      let mg = [0, 0]; M.forEach((row, i) => row.forEach((_, j) => { mg[0] += dL[i][j] / 16; mg[1] += dR[j][i] / 16; }));
      out.innerHTML = `<table><tr><td>mean gradient (∂/∂c_L, ∂/∂c_R)</td><td><b>(${fmt(mg[0], 1)}, ${fmt(mg[1], 1)})</b> spikes/s per unit contrast</td></tr><tr><td>direction</td><td>${fmt(deg(Math.atan2(mg[1], mg[0])), 0)}° (0 = left only, 90 = right only)</td></tr></table>
        <p>Neuron 49 of a mouse visual cortex recording. ${which === "data" ? "The data's gradient arrows (vermilion) point up the right-contrast axis, the side of the visual field this hemisphere represents, and they <b>shrink</b> as c_R grows: the response saturates." : "The model's arrows point the same way (77°), but they <b>grow</b> with c_R: an exponential always curves upwards."} Right: with nothing on the left, the data (black, ± Poisson standard error) bend down while the model (blue) bends up. Same gradient direction, opposite curvature.</p>`;
    }
    draw();
  });
})();
