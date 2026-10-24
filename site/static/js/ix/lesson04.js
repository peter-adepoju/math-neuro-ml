/* Lesson 4: Matrix Transformations. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson04/data.json").then(r => r.json()));
  const svgBox = (host, W, H, title) => { const s = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ix-svg", role: "img" }, host); if (title) el("title", {}, s).textContent = title; return s; };
  function txt(p, s, x, y, a = {}) { const t = el("text", { x, y, "text-anchor": a.anchor || "start", "font-size": a.size || 12, fill: a.color || C.ink, "font-weight": a.weight || 400, "font-family": "inherit" }, p); t.textContent = s; return t; }
  const clear = g => { while (g.firstChild) g.removeChild(g.firstChild); };
  const mv = (A, x) => A.map(r => r.reduce((s, a, j) => s + a * x[j], 0));
  const mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, a, l) => s + a * B[l][j], 0)));
  const det = A => A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const mstr = A => "[[" + A.map(r => r.map(v => fmt(v, 2)).join(", ")).join("], [") + "]]";
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const Fshape = [[0, 0], [0, 1], [0.6, 1], [0.6, 0.85], [0.15, 0.85], [0.15, 0.55], [0.45, 0.55], [0.45, 0.4], [0.15, 0.4], [0.15, 0], [0, 0]];

  /* 1. W r in the row view and the column view. */
  IX.register("matvec", root => {
    const W = [[0.5, -0.2, 0.8, 0.1], [0, 0.6, -0.3, 0.4], [0.3, 0.3, 0.3, -0.5]];
    const cols = [C.blue, C.vermilion, C.green, C.purple];
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const SW = 460, SH = 330; const svg = svgBox(left, SW, SH, "W r, outputs of three postsynaptic neurons"); const g = el("g", {}, svg);
    let r = [2, 5, 1, 4], view = "col";
    buttons(side, [{ label: "Column view", v: "col" }, { label: "Row view", v: "row" }], it => { view = it.v; draw(); }, { toggle: true, label: "View" });
    const sls = r.map((v, j) => slider(side, { label: `r<sub>${j + 1}</sub>`, min: 0, max: 8, step: 0.5, value: v, format: x => x + " /s", onInput: x => { r[j] = x; draw(); } }));
    const out = readout(side);
    function draw() {
      clear(g);
      const z = mv(W, r), y0 = 190, sc = 22, bw = 90, X0 = 70;
      el("line", { x1: 40, x2: SW - 10, y1: y0, y2: y0, stroke: C.axis, "stroke-width": 1.3 }, g);
      [-4, -2, 2, 4, 6].forEach(v => txt(g, String(v), 34, y0 - v * sc + 4, { anchor: "end", color: C.muted, size: 11 }));
      const yl = txt(g, "input to the neuron (spikes/s)", 12, y0 - 20, { anchor: "middle", color: C.muted, size: 11 }); yl.setAttribute("transform", `rotate(-90 12 ${y0 - 20})`);
      for (let i = 0; i < 3; i++) {
        const x = X0 + i * (bw + 40);
        if (view === "col") {
          let pos = 0, neg = 0;
          for (let j = 0; j < 4; j++) {
            const c = W[i][j] * r[j]; if (Math.abs(c) < 1e-9) continue;
            const y1 = c >= 0 ? y0 - (pos + c) * sc : y0 - neg * sc, hh = Math.abs(c) * sc;
            el("rect", { x, y: y1, width: bw, height: hh, fill: cols[j], stroke: "#fff", "stroke-width": 1 }, g);
            if (c >= 0) pos += c; else neg += c;
          }
        } else {
          el("rect", { x, y: Math.min(y0, y0 - z[i] * sc), width: bw, height: Math.max(1, Math.abs(z[i]) * sc), fill: C.axis, rx: 3 }, g);
        }
        el("circle", { cx: x + bw / 2, cy: y0 - z[i] * sc, r: 6, fill: C.ink, stroke: "#fff", "stroke-width": 2 }, g);
        const top = Math.max(0, z[i], view === "col" ? W[i].reduce((s, w, j) => s + Math.max(0, w * r[j]), 0) : 0);
        txt(g, `z${"₁₂₃"[i]} = ${fmt(z[i], 2)}`, x + bw / 2, y0 - top * sc - 10, { anchor: "middle", weight: 700, size: 12.5 });
        txt(g, `post ${i + 1}`, x + bw / 2, SH - 18, { anchor: "middle", color: C.muted });
      }
      if (view === "col") [0, 1, 2, 3].forEach(j => { el("rect", { x: 70 + j * 92, y: 8, width: 12, height: 12, fill: cols[j] }, g); txt(g, `from pre ${j + 1}`, 86 + j * 92, 18, { size: 11 }); });
      out.innerHTML = view === "col"
        ? `<p>W r = ${r.map((x, j) => `${x}·<span style="color:${cols[j]};font-weight:700">col ${j + 1}</span>`).join(" + ")}</p><p>Each presynaptic neuron adds its own column of effects, scaled by its rate. Positive pieces stack up, negative pieces stack down, and the dot marks the total.</p>`
        : `<p>z<sub>i</sub> = (row i of W) · r</p><table>${W.map((row, i) => `<tr><td>post ${i + 1}</td><td>${row.map((w, j) => `${fmt(w, 1)}(${r[j]})`).join(" + ")} = <b>${fmt(z[i], 2)}</b></td></tr>`).join("")}</table>`;
    }
    draw();
  });

  /* 2. One entry of A B is one dot product. */
  IX.register("matmul", root => {
    const A = [[1, 0, 2], [-1, 3, 1]], B = [[3, 1], [2, 1], [1, 0]], P = mm(A, B);
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const svg = svgBox(left, 520, 220, "A times B"); const g = el("g", {}, svg);
    const out = readout(side);
    let pick = [0, 1];
    function grid(M, x0, y0, title, hl) {
      txt(g, title, x0, y0 - 10, { weight: 700 });
      M.forEach((row, i) => row.forEach((v, j) => {
        const on = hl(i, j), r = el("rect", { x: x0 + j * 44, y: y0 + i * 44, width: 42, height: 42, rx: 5, fill: on ? "#f3e6ee" : "#f5f7f9", stroke: on ? C.purple : C.axis, "stroke-width": on ? 2.5 : 1 }, g);
        txt(g, String(v), x0 + j * 44 + 21, y0 + i * 44 + 27, { anchor: "middle", size: 15, weight: 600 });
        return r;
      }));
    }
    function draw() {
      clear(g); const [i, j] = pick;
      grid(A, 10, 40, "A (2 × 3)", (a, b) => a === i);
      txt(g, "×", 152, 100, { size: 20, color: C.muted, anchor: "middle" });
      grid(B, 172, 40, "B (3 × 2)", (a, b) => b === j);
      txt(g, "=", 280, 100, { size: 20, color: C.muted, anchor: "middle" });
      txt(g, "C = A B (2 × 2)", 300, 30, { weight: 700 });
      P.forEach((row, a) => row.forEach((v, b) => {
        const on = a === i && b === j;
        const r = el("rect", { x: 300 + b * 44, y: 40 + a * 44, width: 42, height: 42, rx: 5, fill: on ? C.purple : "#fff", stroke: C.purple, "stroke-width": 1.5 }, g);
        r.style.cursor = "pointer"; r.addEventListener("click", () => { pick = [a, b]; draw(); });
        const t = txt(g, String(v), 300 + b * 44 + 21, 40 + a * 44 + 27, { anchor: "middle", size: 15, weight: 700, color: on ? "#fff" : C.ink }); t.style.pointerEvents = "none";
      }));
      txt(g, "click an entry of C", 300, 150, { color: C.muted, size: 11 });
      out.innerHTML = `<p><b>c<sub>${i + 1}${j + 1}</sub></b> = (row ${i + 1} of A) · (column ${j + 1} of B)</p>
        <p class="big">${A[i].map((a, l) => `(${a})(${B[l][j]})`).join(" + ")} = <b>${P[i][j]}</b></p>
        <p>The inner sizes match (3 and 3) and disappear; the outer sizes give the 2 × 2 shape of C.</p>`;
    }
    draw();
  });

  /* 3. A 2 x 2 matrix acting on the plane. */
  IX.register("transform", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-3, 3], y: [-3, 3], labels: ["x₁", "x₂"], width: 470, height: 470, title: "A 2 by 2 transformation" });
    const side = h("div", {}, L);
    const c30 = Math.cos(rad(30)), s30 = Math.sin(rad(30));
    const presets = [
      { label: "Identity", A: [[1, 0], [0, 1]] }, { label: "Scale × 1.5", A: [[1.5, 0], [0, 1.5]] }, { label: "Stretch x, squeeze y", A: [[1.8, 0], [0, 0.5]] },
      { label: "Rotate 30°", A: [[c30, -s30], [s30, c30]] }, { label: "Reflect in x-axis", A: [[1, 0], [0, -1]] }, { label: "Shear (k = 0.8)", A: [[1, 0.8], [0, 1]] },
      { label: "Project onto x-axis", A: [[1, 0], [0, 0]] }, { label: "Project onto 30° line", A: [[c30 * c30, c30 * s30], [c30 * s30, s30 * s30]] }];
    let A = [[1, 0.8], [0, 1]], t = 1;
    buttons(side, presets, it => { A = it.A.map(r => r.slice()); sync(); t = 0; tl.set(0); go(); }, { label: "Matrix" });
    const tl = slider(side, { label: "Morph from I", min: 0, max: 1, step: 0.02, value: 1, format: v => Math.round(v * 100) + "%", onInput: v => { t = v; draw(); } });
    const pl = player(side, tl, { interval: 30 });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag the blue and orange arrow tips to set the two columns yourself.");
    function go() { pl.click(); }
    function M() { return [[1 + (A[0][0] - 1) * t, A[0][1] * t], [A[1][0] * t, 1 + (A[1][1] - 1) * t]]; }
    function draw() {
      P.clear(); const B = M();
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) P.dot([i * 0.5, j * 0.5], { color: "#c3cad1", r: 2, sw: 0 });
      for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) { const q = mv(B, [i * 0.5, j * 0.5]); if (Math.abs(q[0]) <= 3 && Math.abs(q[1]) <= 3) P.dot(q, { color: C.muted, r: 2.6, sw: 0 }); }
      const sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(p => mv(B, p));
      P.path(sq, { close: true, color: "#b37800", width: 1.5, fill: C.yellow, fillOpacity: 0.55 });
      P.path(Fshape.map(p => mv(B, [p[0] * 1.2 - 2.4, p[1] * 1.2 + 1.2])), { color: C.ink, width: 1.8, fill: C.ink, fillOpacity: 0.12 });
      P.arrow([0, 0], [B[0][0], B[1][0]], { color: C.blue, width: 3.5 });
      P.arrow([0, 0], [B[0][1], B[1][1]], { color: C.orange, width: 3.5 });
      const d = det(B), RtR = mm([[B[0][0], B[1][0]], [B[0][1], B[1][1]]], B), ortho = Math.abs(RtR[0][0] - 1) < 0.02 && Math.abs(RtR[1][1] - 1) < 0.02 && Math.abs(RtR[0][1]) < 0.02;
      const angles = Math.abs(RtR[0][1]) < 0.02 && Math.abs(RtR[0][0] - RtR[1][1]) < 0.02;
      out.innerHTML = `<p>A = [[<span class="k-blue">${fmt(B[0][0], 2)}</span>, <span class="k-orange">${fmt(B[0][1], 2)}</span>], [<span class="k-blue">${fmt(B[1][0], 2)}</span>, <span class="k-orange">${fmt(B[1][1], 2)}</span>]]</p>
        <table><tr><td>Columns</td><td><span class="k-blue">A e₁ = (${fmt(B[0][0], 2)}, ${fmt(B[1][0], 2)})</span>, <span class="k-orange">A e₂ = (${fmt(B[0][1], 2)}, ${fmt(B[1][1], 2)})</span></td></tr>
        <tr><td>det A</td><td><b>${fmt(d, 3)}</b>: areas × ${fmt(Math.abs(d), 3)}${d < -1e-9 ? ", orientation flipped" : ""}${Math.abs(d) < 1e-6 ? " (the plane is squashed flat: no inverse)" : ""}</td></tr>
        <tr><td>Keeps lengths?</td><td>${ortho ? "yes (Aᵀ A = I)" : "no"}</td></tr><tr><td>Keeps angles?</td><td>${angles ? "yes" : "no"}</td></tr></table>`;
    }
    const sync = () => { he1.set([A[0][0], A[1][0]], true); he2.set([A[0][1], A[1][1]], true); };
    const he1 = P.handle([A[0][0], A[1][0]], { color: C.blue, name: "column 1, A e1", snap: 0.1, onMove: p => { A[0][0] = p[0]; A[1][0] = p[1]; t = 1; tl.set(1); draw(); } });
    const he2 = P.handle([A[0][1], A[1][1]], { color: C.orange, name: "column 2, A e2", snap: 0.1, onMove: p => { A[0][1] = p[0]; A[1][1] = p[1]; t = 1; tl.set(1); draw(); } });
    draw();
  });

  /* 4. Composition in two orders. */
  IX.register("compose", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "R S: stretch first, then rotate");
    h("p", { class: "ix-panel-title" }, b2, "S R: rotate first, then stretch");
    const P1 = Plane(b1, { x: [-1.4, 2], y: [-0.6, 2], xtick: 1, ytick: 1, labels: ["", ""], width: 380, height: 300, pad: 30, title: "Stretch then rotate" });
    const P2 = Plane(b2, { x: [-1.4, 2], y: [-0.6, 2], xtick: 1, ytick: 1, labels: ["", ""], width: 380, height: 300, pad: 30, title: "Rotate then stretch" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let th = 35, t = 2;
    slider(ctl, { label: "Rotation angle", min: 0, max: 90, step: 5, value: th, format: v => v + "°", onInput: v => { th = v; draw(); } });
    const st = slider(ctl, { label: "Stage", min: 0, max: 2, step: 0.04, value: t, format: v => v < 0.02 ? "start" : v < 1.02 ? "first stage" : "both stages", onInput: v => { t = v; draw(); } });
    player(ctl, st, { interval: 40 });
    const out = readout(root);
    const S = [[1.8, 0], [0, 0.5]];
    const lerp = (M, k) => [[1 + (M[0][0] - 1) * k, M[0][1] * k], [M[1][0] * k, 1 + (M[1][1] - 1) * k]];
    const Rk = k => { const a = rad(th) * k; return [[Math.cos(a), -Math.sin(a)], [Math.sin(a), Math.cos(a)]]; };
    function draw() {
      const k1 = Math.min(1, t), k2 = Math.max(0, t - 1);
      [[P1, p => mv(Rk(ease(k2)), mv(lerp(S, ease(k1)), p)), C.blue], [P2, p => mv(lerp(S, ease(k2)), mv(Rk(ease(k1)), p)), C.vermilion]].forEach(([P, f, col]) => {
        P.clear(); P.path(Fshape, { color: C.axis, width: 1.2, dash: "4 4" }); P.path(Fshape.map(f), { color: col, width: 2, fill: col, fillOpacity: 0.3 });
      });
      const R = Rk(1);
      out.innerHTML = `<p>R S = ${mstr(mm(R, S))} &nbsp; but &nbsp; S R = ${mstr(mm(S, R))}.</p><p>The dashed outline is the original F. ${th === 0 ? "With no rotation the two orders agree: a special case." : "The same two stages in a different order give a different shape: matrix multiplication is not commutative."}</p>`;
    }
    draw();
  });

  /* 5. A nearly singular matrix amplifies noise. */
  IX.register("near-singular", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "The unit square under A");
    h("p", { class: "ix-panel-title" }, b2, "Recovering x from a slightly wrong y");
    const P1 = Plane(b1, { x: [-0.5, 2], y: [-0.5, 2], xtick: 1, ytick: 1, labels: ["", ""], width: 360, height: 330, pad: 34, title: "Unit square image" });
    const P2 = Plane(b2, { x: [-4, 6], y: [-4, 6], xtick: 2, ytick: 2, labels: ["x₁", "x₂"], width: 360, height: 330, pad: 34, title: "Possible x" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let d = 1.2;
    const sl = slider(ctl, { label: "d", min: 0.31, max: 1.5, step: 0.01, value: d, onInput: v => { d = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 50 });
    const out = readout(root);
    function draw() {
      const A = [[1, 0.6], [0.5, d]], D = det(A), inv = [[A[1][1] / D, -A[0][1] / D], [-A[1][0] / D, A[0][0] / D]];
      P1.clear();
      P1.path([[0, 0], [1, 0], [1, 1], [0, 1]], { close: true, color: C.axis, dash: "4 4", width: 1.2 });
      P1.path([[0, 0], [1, 0], [1, 1], [0, 1]].map(p => mv(A, p)), { close: true, color: "#b37800", width: 1.8, fill: C.yellow, fillOpacity: 0.6 });
      P1.arrow([0, 0], [A[0][0], A[1][0]], { color: C.blue, width: 3 }); P1.arrow([0, 0], [A[0][1], A[1][1]], { color: C.orange, width: 3 });
      P2.clear();
      const x = [1, 2], y = mv(A, x), e = 0.01;
      const corners = [[e, e], [e, -e], [-e, -e], [-e, e]].map(q => mv(inv, [y[0] + q[0], y[1] + q[1]]));
      const cl = p => [Math.max(-4, Math.min(6, p[0])), Math.max(-4, Math.min(6, p[1]))];
      P2.path(corners.map(cl), { close: true, color: C.purple, width: 2, fill: C.purple, fillOpacity: 0.25 });
      const sx = 0.3; P2.path([[x[0] - sx, x[1] - sx], [x[0] + sx, x[1] - sx], [x[0] + sx, x[1] + sx], [x[0] - sx, x[1] + sx]], { close: true, color: C.ink, dash: "3 3", width: 1 });
      P2.dot(x, { color: C.ink, r: 5 });
      const spread = Math.max(...corners.map(c => Math.hypot(c[0] - 1, c[1] - 2)));
      out.innerHTML = `<p>A = [[1, 0.6], [0.5, ${fmt(d, 2)}]], &nbsp; det A = <b>${fmt(D, 3)}</b>, &nbsp; A⁻¹ = ${mstr(inv)}</p>
        <p>An error of only ±0.01 in each entry of y can move the recovered x by up to <b>${fmt(spread, 2)}</b> from the true x = (1, 2) (black dot; the dashed box shows a ±0.3 scale for comparison). ${D < 0.05 ? "The determinant is close to zero, so the inverse has huge entries and amplifies the noise enormously." : "With a healthy determinant the error stays tiny."}</p>`;
    }
    draw();
  });

  /* 6. One ReLU layer folds the plane. */
  IX.register("relu-layer", root => {
    const W1 = [[1, -0.6], [0.7, 1]];
    const grid = h("div", { class: "ix-three" }, root);
    const names = ["Input x", "Pre-activation z = W₁ x + b", "Activation a = ReLU(z)"];
    const Ps = names.map(n => { const b = h("div", {}, grid); h("p", { class: "ix-panel-title" }, b, n); return Plane(b, { x: [-3, 3], y: [-3, 3], xtick: 1, ytick: 1, labels: ["", ""], width: 300, height: 300, pad: 30, title: n }); });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let b0 = -0.2; const b1 = -0.3;
    const sl = slider(ctl, { label: "Bias b₁", min: -1.5, max: 1.5, step: 0.1, value: b0, onInput: v => { b0 = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 90 });
    const out = readout(root);
    const pts = []; for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) pts.push([i * 0.375, j * 0.375]);
    function draw() {
      Ps.forEach(P => P.clear());
      let folded = 0;
      pts.forEach(p => {
        const col = p[0] * p[1] >= 0 ? C.blue : C.vermilion, z = mv(W1, p).map((v, k) => v + (k ? b1 : b0)), a = z.map(v => Math.max(0, v));
        if (z[0] < 0 || z[1] < 0) folded++;
        Ps[0].dot(p, { color: col, r: 3.2, sw: 0 }); Ps[1].dot(z, { color: col, r: 3.2, sw: 0 }); Ps[2].dot(a, { color: col, r: 3.2, sw: 0, opacity: 0.85 });
      });
      out.innerHTML = `<p>W₁ = [[1, −0.6], [0.7, 1]], b = (${fmt(b0, 1)}, −0.3). <b>${folded} of ${pts.length}</b> inputs have at least one negative pre-activation, so ReLU moves them onto an axis.</p>
        <p>The middle panel is still a straight grid (the affine stage only shears, turns and shifts). The right panel is folded: points that were far apart can land on top of each other, which no matrix can do.</p>`;
    }
    draw();
  });

  /* 7. The population vector and D E. */
  IX.register("pop-vector", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-1.5, 1.5], y: [-1.5, 1.5], xtick: 99, ytick: 99, labels: ["", ""], width: 440, height: 440, pad: 26, title: "Preferred directions and decoded movement" });
    const side = h("div", {}, L);
    let phis = [], th = 45;
    const sets = [
      { label: "8 evenly spread", f: () => [...Array(8).keys()].map(k => 45 * k) },
      { label: "Clustered near 90°", f: () => [60, 75, 85, 95, 105, 120, 0, 180] },
      { label: "4, then remove 180°", f: () => [0, 90, 270] },
      { label: "20 random", f: () => { let s = 11; return [...Array(20)].map(() => { s = (s * 16807) % 2147483647; return (s / 2147483647) * 360; }); } }];
    buttons(side, sets, it => { phis = it.f(); draw(); }, { label: "Neurons" });
    const sl = slider(side, { label: "True direction", min: 0, max: 360, step: 3, value: th, format: v => v + "°", onInput: v => { th = v; draw(); } });
    player(side, sl, { interval: 60 });
    const out = readout(side);
    function draw() {
      P.clear();
      const pts = []; for (let a = 0; a <= 360; a += 4) pts.push([Math.cos(rad(a)), Math.sin(rad(a))]);
      P.path(pts, { color: C.axis, width: 1, dash: "3 4" });
      const N = phis.length; const DE = [[0, 0], [0, 0]];
      phis.forEach(p => { const u = [Math.cos(rad(p)), Math.sin(rad(p))]; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) DE[i][j] += 2 / N * u[i] * u[j]; P.dot(u, { color: C.green, r: 6 }); });
      const d = [Math.cos(rad(th)), Math.sin(rad(th))], dh = mv(DE, d);
      P.arrow([0, 0], [d[0] * 1.3, d[1] * 1.3], { color: C.ink, width: 2.5, dash: "6 4" }); P.arrow([0, 0], dh, { color: C.purple, width: 3.5 });
      const ang = (deg(Math.atan2(dh[1], dh[0])) + 360) % 360; let err = ang - th; err = ((err + 540) % 360) - 180;
      out.innerHTML = `<p><span class="k-green">${N} neurons</span> (green dots). D E = ${mstr(DE)}</p>
        <table><tr><td>True direction</td><td><b>${th}°</b> (black)</td></tr><tr><td><span class="k-purple">Decoded</span></td><td><b>${fmt(ang, 1)}°</b>, error ${fmt(err, 1)}°</td></tr></table>
        <p>${Math.abs(DE[0][1]) < 0.01 && Math.abs(DE[0][0] - 1) < 0.01 && Math.abs(DE[1][1] - 1) < 0.01 ? "D E is the identity: the doubled preferred directions average to zero, so decoding undoes encoding at every angle." : "D E is not the identity, so the decoder stretches behavioural space along the axis the preferred directions favour."}</p>`;
    }
    phis = sets[0].f(); draw();
  });

  /* 8. Decoding the real stimuli with D and with (D E)^-1 D. */
  IX.register("decode-real", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-3, 5.5], y: [-0.4, 1.6], xtick: 1, ytick: 0.5, labels: ["left contrast c_L", "right contrast c_R"], width: 520, height: 360, pad: 46, title: "Decoded against true stimuli" });
    const side = h("div", {}, L);
    let D = null, which = "plain";
    buttons(side, [{ label: "D (two projections)", v: "plain" }, { label: "(D E)⁻¹ D (corrected)", v: "corr" }], it => { which = it.v; draw(); }, { toggle: true, label: "Decoder" });
    const out = readout(side);
    function draw() {
      if (!D) return; P.clear();
      const T = D.C, O = D[which], col = which === "plain" ? C.vermilion : C.blue;
      for (let k = 0; k < 16; k++) P.line([T[0][k], T[1][k]], [O[0][k], O[1][k]], { color: col, width: 1, opacity: 0.6 });
      for (let k = 0; k < 16; k++) el("circle", { cx: P.X(T[0][k]), cy: P.Y(T[1][k]), r: 6, fill: "#fff", stroke: C.ink, "stroke-width": 1.6 }, P.layer);
      for (let k = 0; k < 16; k++) P.dot([O[0][k], O[1][k]], { color: col, r: 4.5 });
      const e = which === "plain" ? D.err_plain : D.err_corr;
      out.innerHTML = `<p>D E = ${mstr(D.DE)}</p><table><tr><td>Mean |error|, left</td><td><b>${fmt(e[0], 2)}</b></td></tr><tr><td>Mean |error|, right</td><td><b>${fmt(e[1], 2)}</b></td></tr></table>
        <p>${which === "plain" ? "The left readout is dragged sideways by the right contrast: the leak of 6.12 in D E." : "The leak is gone, so the decoded points sit over their true columns, but they scatter: inverting a matrix with determinant 0.34 amplifies the noise."}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });
})();
