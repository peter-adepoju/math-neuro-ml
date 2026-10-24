/* Lesson 5: Linear Systems and Least Squares. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson05/data.json").then(r => r.json()));
  const svgBox = (host, W, H, title) => { const s = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ix-svg", role: "img" }, host); if (title) el("title", {}, s).textContent = title; return s; };
  function txt(p, s, x, y, a = {}) { const t = el("text", { x, y, "text-anchor": a.anchor || "start", "font-size": a.size || 12, fill: a.color || C.ink, "font-weight": a.weight || 400, "font-family": "inherit" }, p); t.textContent = s; if (a.halo) { t.setAttribute("paint-order", "stroke"); t.setAttribute("stroke", "#fff"); t.setAttribute("stroke-width", 4); } return t; }
  const clear = g => { while (g.firstChild) g.removeChild(g.firstChild); };
  const mv = (A, x) => A.map(r => r.reduce((s, a, j) => s + a * x[j], 0));
  const det = A => A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const solve2 = (A, b) => { const d = det(A); return [(b[0] * A[1][1] - A[0][1] * b[1]) / d, (A[0][0] * b[1] - A[1][0] * b[0]) / d]; };
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const norm = a => Math.sqrt(dot(a, a));
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  function cond2(A) {          /* ratio of the largest to the smallest stretch of a 2 x 2 matrix */
    const a = A[0][0] * A[0][0] + A[1][0] * A[1][0], b = A[0][0] * A[0][1] + A[1][0] * A[1][1], c = A[0][1] * A[0][1] + A[1][1] * A[1][1];
    const m = (a + c) / 2, r = Math.sqrt(((a - c) / 2) ** 2 + b * b);
    return Math.sqrt((m + r) / Math.max(m - r, 1e-300));
  }
  /* The line a1 w1 + a2 w2 = c, drawn across the plot (the plot clips it). */
  function eqLine(P, a, c, s) {
    const [x0, x1] = P.opts.x, [y0, y1] = P.opts.y, ext = 50;
    if (Math.abs(a[1]) > 1e-9) P.line([x0 - ext, (c - a[0] * (x0 - ext)) / a[1]], [x1 + ext, (c - a[0] * (x1 + ext)) / a[1]], s);
    else P.line([c / a[0], y0 - ext], [c / a[0], y1 + ext], s);
  }
  function tween(from, to, ms, step, done) {
    const t0 = performance.now();
    const f = now => { const k = Math.min(1, (now - t0) / ms), e = ease(k); step(from.map((v, i) => v + (to[i] - v) * e)); if (k < 1) requestAnimationFrame(f); else if (done) done(); };
    requestAnimationFrame(f);
  }

  /* 1. Row picture and column picture of a 2 x 2 system, with the rank test. */
  IX.register("row-col", root => {
    const cases = [
      { label: "One solution", A: [[3, 1], [1, 2]], b: [7, 4] },
      { label: "No solution", A: [[3, 1], [1.5, 0.5]], b: [7, 2] },
      { label: "Infinitely many", A: [[3, 1], [1.5, 0.5]], b: [7, 3.5] }];
    buttons(root, cases, it => { A = it.A; b = it.b.slice(); hb.set(b, true); draw(); }, { toggle: true, label: "Experiments" });
    const grid = h("div", { class: "ix-two" }, root);
    const g1 = h("div", {}, grid), g2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, g1, "Row picture: one line per experiment");
    h("p", { class: "ix-panel-title" }, g2, "Column picture: mix the columns to reach b");
    const R = Plane(g1, { x: [-1, 4], y: [-2, 5], xtick: 1, ytick: 1, labels: ["w₁", "w₂"], width: 380, height: 360, pad: 34, clip: true, title: "Row picture" });
    const Cp = Plane(g2, { x: [-2, 9], y: [-3, 6], xtick: 2, ytick: 2, labels: ["", ""], width: 380, height: 360, pad: 34, clip: true, title: "Column picture" });
    h("p", { class: "ix-hint" }, root, "Drag the black point b in the column picture.");
    const out = readout(root);
    let A = cases[0].A, b = cases[0].b.slice();
    const cf = v => v === 1 ? "" : fmt(v);
    function draw() {
      R.clear(); Cp.clear();
      eqLine(R, A[0], b[0], { color: C.blue, width: 2.5 });
      eqLine(R, A[1], b[1], { color: C.orange, width: 2.5, dash: Math.abs(det(A)) < 1e-9 ? "7 5" : "" });
      R.text(`${cf(A[0][0])}w₁ + ${cf(A[0][1])}w₂ = ${fmt(b[0])}`, 1.3, 4.55, { color: C.blue, weight: 600, size: 13, halo: true });
      R.text(`${cf(A[1][0])}w₁ + ${cf(A[1][1])}w₂ = ${fmt(b[1])}`, 1.3, 4.05, { color: "#a87400", weight: 600, size: 13, halo: true });
      const a1 = [A[0][0], A[1][0]], a2 = [A[0][1], A[1][1]], d = det(A);
      const rk = Math.abs(d) > 1e-9 ? 2 : 1;
      const off = Math.abs(a1[0] * b[1] - a1[1] * b[0]) > 1e-6;          // b off the line spanned by the columns?
      const rkAug = rk === 2 ? 2 : (off ? 2 : 1);
      let verdict;
      if (rk === 2) {
        const w = solve2(A, b);
        R.dot(w, { color: C.ink, r: 6 });
        R.text(`(${fmt(w[0], 2)}, ${fmt(w[1], 2)})`, w[0], w[1], { dx: 10, dy: 18, weight: 600, halo: true });
        Cp.line([0, 0], a1, { color: C.blue, width: 1.2, dash: "3 3" }); Cp.line([0, 0], a2, { color: C.orange, width: 1.2, dash: "3 3" });
        const p1 = [w[0] * a1[0], w[0] * a1[1]];
        Cp.arrow([0, 0], p1, { color: C.blue, width: 3 });
        Cp.arrow(p1, b, { color: C.orange, width: 3 });
        Cp.text(`${fmt(w[0], 2)} × column 1`, p1[0] / 2, p1[1] / 2, { dx: 6, dy: 20, color: C.blue, weight: 600, halo: true });
        Cp.text(`${fmt(w[1], 2)} × column 2`, (p1[0] + b[0]) / 2, (p1[1] + b[1]) / 2, { dx: -10, dy: -10, anchor: "end", color: "#a87400", weight: 600, halo: true });
        verdict = `rank A = 2 = number of unknowns, so there is exactly <b>one solution</b>, w = (${fmt(w[0], 2)}, ${fmt(w[1], 2)}). Wherever you drag b, the two columns can be mixed to reach it.`;
      } else {
        Cp.line([-a1[0] * 10, -a1[1] * 10], [a1[0] * 10, a1[1] * 10], { color: C.purple, width: 2 });
        Cp.text("every mixture of the columns lies on this line", 8.6, 8.6 * a1[1] / a1[0], { anchor: "end", dy: 22, color: C.purple, size: 12, halo: true });
        Cp.arrow([0, 0], a1, { color: C.blue, width: 3 }); Cp.arrow([0, 0], a2, { color: C.orange, width: 3 });
        verdict = off
          ? `The columns point the same way, so rank A = 1, but b sits off their line, so rank [A | b] = 2. The ranks differ: <b>no solution</b>. In the row picture the lines are parallel and never meet.`
          : `rank A = rank [A | b] = 1, which is less than 2 unknowns: <b>infinitely many solutions</b>. Both equations describe the same line, and every point on it works.`;
      }
      Cp.text("b", b[0], b[1], { dx: 12, dy: -10, weight: 700, size: 15, halo: true });
      out.innerHTML = `<p>A = [[${A[0].map(v => fmt(v)).join(", ")}], [${A[1].map(v => fmt(v)).join(", ")}]], &nbsp; b = (${fmt(b[0], 2)}, ${fmt(b[1], 2)}), &nbsp; det A = ${fmt(d, 2)}</p>
        <table><tr><td>rank A</td><td><b>${rk}</b></td></tr><tr><td>rank [A | b]</td><td><b>${rkAug}</b></td></tr></table><p>${verdict}</p>`;
    }
    const hb = Cp.handle(b, { color: C.ink, name: "the measurements b", snap: 0.25, onMove: p => { b = p.slice(); draw(); } });
    draw();
  });

  /* 2. Gaussian elimination, one step at a time. */
  IX.register("elimination", root => {
    const S = [
      { M: [[2, 1, 1, 4], [4, 3, 3, 10], [8, 7, 9, 24]], hl: -1, op: "Start: the augmented matrix [A | b]. The first pivot is the 2 in the top-left corner.", x: [] },
      { M: [[2, 1, 1, 4], [0, 1, 1, 2], [8, 7, 9, 24]], hl: 1, op: "R₂ − 2 R₁: subtract twice row 1 from row 2, so the entry below the pivot becomes 0.", x: [] },
      { M: [[2, 1, 1, 4], [0, 1, 1, 2], [0, 3, 5, 8]], hl: 2, op: "R₃ − 4 R₁: the second zero in column 1. The next pivot is the 1 in row 2.", x: [] },
      { M: [[2, 1, 1, 4], [0, 1, 1, 2], [0, 0, 2, 2]], hl: 2, op: "R₃ − 3 R₂: the matrix is now upper triangular. Elimination is finished.", x: [] },
      { M: [[2, 1, 1, 4], [0, 1, 1, 2], [0, 0, 2, 2]], hl: 2, op: "Back substitution, bottom row: 2 x₃ = 2, so x₃ = 1.", x: [null, null, 1] },
      { M: [[2, 1, 1, 4], [0, 1, 1, 2], [0, 0, 2, 2]], hl: 1, op: "Middle row: x₂ + x₃ = 2, so x₂ = 2 − 1 = 1.", x: [null, 1, 1] },
      { M: [[2, 1, 1, 4], [0, 1, 1, 2], [0, 0, 2, 2]], hl: 0, op: "Top row: 2 x₁ + x₂ + x₃ = 4, so x₁ = (4 − 1 − 1)/2 = 1. Solved: x = (1, 1, 1).", x: [1, 1, 1] }];
    const svg = svgBox(root, 560, 210, "Augmented matrix during elimination"); const g = el("g", {}, svg);
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const sl = slider(ctl, { label: "Step", min: 0, max: 6, step: 1, value: 0, format: v => v === 0 ? "start" : v <= 3 ? `elimination ${v}` : `back-sub ${v - 3}`, onInput: v => draw(v) });
    player(ctl, sl, { interval: 1400 });
    const out = readout(root);
    const pivots = [[0, 0], [1, 1], [2, 2]];
    function draw(k) {
      clear(g); const s = S[k], cw = 58, ch = 46, x0 = 40, y0 = 30;
      el("path", { d: `M${x0 - 8} ${y0 - 6} h-6 v${3 * ch + 12} h6`, stroke: C.ink, fill: "none", "stroke-width": 1.6 }, g);
      el("path", { d: `M${x0 + 4 * cw + 8} ${y0 - 6} h6 v${3 * ch + 12} h-6`, stroke: C.ink, fill: "none", "stroke-width": 1.6 }, g);
      el("line", { x1: x0 + 3 * cw + 2, x2: x0 + 3 * cw + 2, y1: y0 - 4, y2: y0 + 3 * ch + 4, stroke: C.muted, "stroke-width": 1.4, "stroke-dasharray": "4 3" }, g);
      if (s.hl >= 0) el("rect", { x: x0 - 4, y: y0 + s.hl * ch + 2, width: 4 * cw + 8, height: ch - 4, rx: 6, fill: C.yellow, "fill-opacity": 0.45 }, g);
      s.M.forEach((row, i) => row.forEach((v, j) => {
        const cx = x0 + j * cw + cw / 2, cy = y0 + i * ch + ch / 2 + 6;
        const isPivot = k >= 1 && pivots.some(p => p[0] === i && p[1] === j) && (i === 0 || k >= (i === 1 ? 2 : 3));
        if (isPivot) el("circle", { cx, cy: cy - 5, r: 17, fill: "none", stroke: C.purple, "stroke-width": 2 }, g);
        const zeroMade = j < i && v === 0;
        txt(g, String(v), cx, cy, { anchor: "middle", size: 18, weight: zeroMade ? 700 : 500, color: zeroMade ? C.green : C.ink });
      }));
      ["x₁", "x₂", "x₃", "b"].forEach((l, j) => txt(g, l, x0 + j * cw + cw / 2, y0 - 12, { anchor: "middle", color: C.muted, size: 12 }));
      txt(g, "Solution", 350, 40, { weight: 700, size: 13 });
      ["x₁", "x₂", "x₃"].forEach((l, i) => {
        const v = s.x[i];
        txt(g, `${l} = ${v == null ? "?" : v}`, 350, y0 + i * ch + ch / 2 + 6, { size: 17, weight: v == null ? 400 : 700, color: v == null ? C.muted : C.blue });
      });
      out.innerHTML = `<p>${s.op}</p><p class="ix-hint">Purple circles mark pivots; green zeros are entries elimination has cleared; the highlighted row is the one that just changed.</p>`;
    }
    draw(0);
  });

  /* 3. Conditioning: the same nudge to one measurement, two experiments. */
  IX.register("conditioning", root => {
    const sets = [
      { title: "Well conditioned", A: [[3, 1], [1, 2]], b: [7, 4] },
      { title: "Ill conditioned (nearly parallel)", A: [[3, 1], [5.9, 2]], b: [7, 13.8] }];
    const grid = h("div", { class: "ix-two" }, root);
    const Ps = sets.map(s => { const d = h("div", {}, grid); h("p", { class: "ix-panel-title" }, d, s.title); return Plane(d, { x: [-1, 5], y: [-6, 8], xtick: 1, ytick: 2, labels: ["w₁", "w₂"], width: 380, height: 380, pad: 34, clip: true, title: s.title }); });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let db = 0;
    const sl = slider(ctl, { label: "Change in b₂", min: -0.2, max: 0.2, step: 0.01, value: 0, format: v => (v >= 0 ? "+" : "") + fmt(v, 2), onInput: v => { db = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 70 });
    const out = readout(root);
    function draw() {
      const rows = sets.map((s, i) => {
        const P = Ps[i]; P.clear();
        const b2 = [s.b[0], s.b[1] + db], w0 = solve2(s.A, s.b), w = solve2(s.A, b2);
        eqLine(P, s.A[0], s.b[0], { color: C.blue, width: 2.5 });
        eqLine(P, s.A[1], s.b[1], { color: C.orange, width: 1.5, dash: "3 4" });
        eqLine(P, s.A[1], b2[1], { color: C.orange, width: 2.5 });
        P.dot(w0, { fill: "#fff", stroke: C.ink, sw: 2, r: 6 });
        P.dot(w, { color: C.ink, r: 6 });
        const dx = norm([w[0] - w0[0], w[1] - w0[1]]) / norm(w0), dbr = Math.abs(db) / norm(s.b);
        return { s, w, dx, dbr, k: cond2(s.A) };
      });
      out.innerHTML = `<p>Dotted orange: the second experiment as first measured. Solid orange: after changing b₂ by ${fmt(db, 2)}. Open dot: original solution; black dot: new solution.</p>
        <table><tr><th></th><th>κ(A)</th><th>new solution</th><th>change in b</th><th>change in w</th></tr>
        ${rows.map(r => `<tr><td>${r.s.title.split(" (")[0]}</td><td>${fmt(r.k, 0)}</td><td>(${fmt(r.w[0], 2)}, ${fmt(r.w[1], 2)})</td><td>${fmt(100 * r.dbr, 1)}%</td><td><b>${fmt(100 * r.dx, 0)}%</b></td></tr>`).join("")}</table>
        <p>${Math.abs(db) < 0.005 ? "Press Play or move the slider." : `The same small change moves the ill-conditioned answer about ${fmt(rows[1].dx / Math.max(rows[1].dbr, 1e-12), 0)} times further, in relative terms, than it moved the data.`}</p>`;
    }
    draw();
  });

  /* 4. One equation, two unknowns: a line of solutions and the shortest one. */
  IX.register("null-line", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-1, 4], y: [-2, 4], xtick: 1, ytick: 1, labels: ["w₁", "w₂"], width: 440, height: 440, pad: 34, clip: true, title: "Solutions of 3 w1 + w2 = 7" });
    const side = h("div", {}, L);
    const xs = [2.1, 0.7], nd = [1, -3];
    let s = -0.1 / 1;     // start at (2, 1)
    const sl = slider(side, { label: "Move along", min: -0.6, max: 0.6, step: 0.02, value: s, format: v => (v >= 0 ? "+" : "") + fmt(v, 2) + " × (1, −3)", onInput: v => { s = v; hd.set(pt(), true); draw(); } });
    player(side, sl, { bounce: true, interval: 60 });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "You can also drag the purple point; it stays on the line.");
    const pt = () => [xs[0] + s * nd[0], xs[1] + s * nd[1]];
    function draw() {
      P.clear();
      eqLine(P, [3, 1], 7, { color: C.blue, width: 2.5 });
      P.line([0, 0], xs, { color: C.green, width: 1.6, dash: "5 4" });
      const u = [nd[0] / norm(nd), nd[1] / norm(nd)], v = [xs[0] / norm(xs), xs[1] / norm(xs)], q = 0.18;
      P.path([[xs[0] + u[0] * q, xs[1] + u[1] * q], [xs[0] + u[0] * q - v[0] * q, xs[1] + u[1] * q - v[1] * q], [xs[0] - v[0] * q, xs[1] - v[1] * q]], { color: C.green, width: 1.4 });
      P.dot(xs, { color: C.green, r: 6 });
      P.text("shortest: (2.1, 0.7)", xs[0], xs[1], { dx: 12, dy: 4, color: C.green, weight: 600, halo: true });
      const w = pt();
      P.arrow([0, 0], w, { color: C.purple, width: 3 });
      P.text("3w₁ + w₂ = 7", 0.9, 3.75, { color: C.blue, weight: 600, halo: true });
      const lw = norm(w);
      out.innerHTML = `<table><tr><td><span class="k-purple">w</span></td><td><b>(${fmt(w[0], 2)}, ${fmt(w[1], 2)})</b></td></tr>
        <tr><td>3w₁ + w₂</td><td>${fmt(3 * w[0] + w[1], 2)} (always 7)</td></tr>
        <tr><td>length ‖w‖</td><td><b>${fmt(lw, 3)}</b></td></tr><tr><td><span class="k-green">shortest length</span></td><td>2.214</td></tr></table>
        <p>Every point on the blue line fits the measurement exactly; moving along the null direction (1, −3) changes nothing the data can see. The data cannot choose among them, so the pseudoinverse picks the shortest, the one at right angles to the line.</p>`;
    }
    const hd = P.handle(pt(), { color: C.purple, name: "a solution w", snap: 0, constrain: q => { const t = dot([q[0] - xs[0], q[1] - xs[1]], nd) / dot(nd, nd); const tc = Math.max(-0.6, Math.min(0.6, t)); return [xs[0] + tc * nd[0], xs[1] + tc * nd[1]]; }, onMove: p => { s = dot([p[0] - xs[0], p[1] - xs[1]], nd) / dot(nd, nd); sl.set(s); draw(); } });
    draw();
  });

  /* 5. Fit a line by hand, then let least squares do it. */
  IX.register("line-fit", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 0.65], y: [0, 40], xtick: 0.1, ytick: 10, labels: ["contrast", "rate (spikes/s)"], width: 480, height: 400, pad: 44, clip: true, title: "Contrast-response data and a straight line" });
    const side = h("div", {}, L);
    let D = null, b0 = 16, b1 = 10;
    const s0 = slider(side, { label: "Intercept β₀", min: 0, max: 25, step: 0.1, value: b0, format: v => fmt(v, 1), onInput: v => { b0 = v; draw(); } });
    const s1 = slider(side, { label: "Slope β₁", min: 0, max: 50, step: 0.1, value: b1, format: v => fmt(v, 1), onInput: v => { b1 = v; draw(); } });
    const bs = buttons(side, [{ label: "Least squares" }, { label: "Reset" }], (it, i) => {
      const to = i === 0 ? D.beta : [16, 10];
      tween([b0, b1], to, 900, v => { b0 = v[0]; b1 = v[1]; s0.set(b0); s1.set(b1); draw(); });
    }, { label: "Jump to" });
    const out = readout(side);
    const sse = (a, b) => D.contrast.reduce((s, c, i) => s + (D.rate[i] - a - b * c) ** 2, 0);
    function draw() {
      if (!D) return; P.clear();
      const res = D.contrast.map((c, i) => D.rate[i] - b0 - b1 * c);
      D.contrast.forEach((c, i) => { const jit = ((i % 5) - 2) * 0.004; P.line([c + jit, D.rate[i]], [c + jit, b0 + b1 * c], { color: C.vermilion, width: 1.6 }); });
      P.line([0, b0], [0.65, b0 + b1 * 0.65], { color: C.ink, width: 2.5 });
      D.contrast.forEach((c, i) => { const jit = ((i % 5) - 2) * 0.004; P.dot([c + jit, D.rate[i]], { color: C.blue, r: 4.5 }); });
      const E = sse(b0, b1), Eb = sse(D.beta[0], D.beta[1]);
      const s1r = res.reduce((a, b) => a + b, 0), scr = res.reduce((a, r, i) => a + r * D.contrast[i], 0);
      out.innerHTML = `<table><tr><td>Your SSE</td><td><b>${fmt(E, 1)}</b></td></tr><tr><td>Least-squares SSE</td><td>${fmt(Eb, 1)}</td></tr>
        <tr><td>Σ residuals</td><td>${fmt(s1r, 2)}</td></tr><tr><td>Σ contrast × residual</td><td>${fmt(scr, 2)}</td></tr></table>
        <p>${E - Eb < 0.05 ? `This is the least-squares line: intercept ${fmt(D.beta[0], 2)} spikes/s, slope ${fmt(D.beta[1], 2)} spikes/s per unit contrast. Both sums are zero: the residual is orthogonal to the column of ones and to the contrast column.` : "The vermilion segments are the residuals. Their squares add up to the SSE. Move the sliders to make it as small as you can."}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 6. Least squares in 3-D: the residual is perpendicular to the column space. */
  IX.register("projection", root => {
    const A = [[3, 1], [1, 2], [2, 2]], b = [7, 4, 6.5], xh = [2, 10 / 9];
    const col = j => A.map(r => r[j]), a1 = col(0), a2 = col(1);
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const W = 460, H = 420; const svg = svgBox(left, W, H, "Column-space plane, b, and the residual");
    const defs = el("defs", {}, svg), g = el("g", {}, svg);
    const mk = {};
    const marker = c => { if (mk[c]) return mk[c]; const id = "l5p" + Object.keys(mk).length; const m = el("marker", { id, viewBox: "0 0 10 10", refX: 8.5, refY: 5, markerWidth: 11, markerHeight: 11, markerUnits: "userSpaceOnUse", orient: "auto" }, defs); el("path", { d: "M0 0L10 5L0 10z", fill: c }, m); return (mk[c] = `url(#${id})`); };
    let az = 35, x = [1, 2.5];
    const s1 = slider(side, { label: "x₁", min: -0.5, max: 3, step: 0.05, value: x[0], format: v => fmt(v, 2), onInput: v => { x[0] = v; draw(); } });
    const s2 = slider(side, { label: "x₂", min: -0.5, max: 3, step: 0.05, value: x[1], format: v => fmt(v, 2), onInput: v => { x[1] = v; draw(); } });
    buttons(side, [{ label: "Least-squares x̂" }], () => tween(x.slice(), xh, 900, v => { x = v; s1.set(x[0]); s2.set(x[1]); draw(); }), { label: "Jump to" });
    const sa = slider(side, { label: "View angle", min: 0, max: 90, step: 1, value: az, format: v => v + "°", onInput: v => { az = v; draw(); } });
    player(side, sa, { bounce: true, interval: 60 });
    const out = readout(side);
    function pr(p) {
      const f = az * Math.PI / 180, e = 0.75;
      const xr = p[0] * Math.cos(f) - p[1] * Math.sin(f), yr = p[0] * Math.sin(f) + p[1] * Math.cos(f);
      return [W / 2 - 60 + 19 * xr, H - 90 - 19 * (p[2] * Math.cos(e) + yr * Math.sin(e))];
    }
    const ln = (p, q, c, w, a = {}) => { const P1 = pr(p), P2 = pr(q); const l = el("line", { x1: P1[0], y1: P1[1], x2: P2[0], y2: P2[1], stroke: c, "stroke-width": w, "stroke-linecap": "round", "stroke-dasharray": a.dash || "" }, g); if (a.head) l.setAttribute("marker-end", marker(c)); return l; };
    const lab = (s, p, c, dx = 8, dy = -8) => { const q = pr(p); txt(g, s, q[0] + dx, q[1] + dy, { color: c, weight: 700, size: 14, halo: true }); };
    function draw() {
      clear(g);
      [[[0, 0, 0], [9, 0, 0], "1"], [[0, 0, 0], [0, 7, 0], "2"], [[0, 0, 0], [0, 0, 8], "3"]].forEach(([p, q, n]) => { ln(p, q, C.axis, 1.2); lab(n, q, C.muted, 4, 4); });
      const S = (s, t) => [0, 1, 2].map(i => s * a1[i] + t * a2[i]);
      const corners = [S(-0.3, -0.3), S(2.6, -0.3), S(2.6, 2.6), S(-0.3, 2.6)].map(pr);
      el("path", { d: corners.map((c, i) => (i ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1)).join("") + "Z", fill: C.sky, "fill-opacity": 0.22, stroke: C.sky, "stroke-width": 1 }, g);
      ln([0, 0, 0], a1, C.blue, 3, { head: true }); lab("a₁", a1, C.blue, 8, 14);
      ln([0, 0, 0], a2, C.orange, 3, { head: true }); lab("a₂", a2, "#a87400", -22, -4);
      const Ax = S(x[0], x[1]), r = b.map((v, i) => v - Ax[i]);
      ln([0, 0, 0], b, C.ink, 1.4, { dash: "4 4" });
      ln(Ax, b, C.vermilion, 3);
      const q = pr(Ax); el("circle", { cx: q[0], cy: q[1], r: 6, fill: C.green, stroke: "#fff", "stroke-width": 1.5 }, g); lab("A x", Ax, C.green, 8, 16);
      const qb = pr(b); el("circle", { cx: qb[0], cy: qb[1], r: 6, fill: C.ink, stroke: "#fff", "stroke-width": 1.5 }, g); lab("b", b, C.ink);
      const rn = norm(r), r1 = dot(r, a1), r2 = dot(r, a2), best = Math.abs(x[0] - xh[0]) < 0.02 && Math.abs(x[1] - xh[1]) < 0.02;
      out.innerHTML = `<table><tr><td>x</td><td>(${fmt(x[0], 2)}, ${fmt(x[1], 2)})</td></tr>
        <tr><td><span class="k-verm">‖r‖</span></td><td><b>${fmt(rn, 3)}</b> (smallest possible: 0.373)</td></tr>
        <tr><td>r · a₁</td><td>${fmt(r1, 2)}</td></tr><tr><td>r · a₂</td><td>${fmt(r2, 2)}</td></tr></table>
        <p>${best ? "At x̂ = (2, 1.111) the residual (−0.111, −0.222, 0.278) is perpendicular to both columns, so it is perpendicular to the whole plane: A x̂ is the projection of b." : "The green point A x can only move within the blue plane (the column space). The residual is shortest when it meets the plane at a right angle, which is when both dot products are zero."}</p>`;
    }
    draw();
  });

  /* 7. Polynomial degree: training error falls, test error does not. */
  IX.register("overfit", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const g1 = h("div", {}, grid), g2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, g1, "The fitted curve");
    h("p", { class: "ix-panel-title" }, g2, "Error against degree (log scale)");
    const P = Plane(g1, { x: [0, 1], y: [0, 55], xtick: 0.2, ytick: 10, labels: ["contrast", "rate (spikes/s)"], width: 400, height: 340, pad: 40, clip: true, title: "Polynomial fit" });
    const Q = Plane(g2, { x: [0, 12.5], y: [0.3, 2.4], xtick: 2, ytick: 99, labels: ["degree", ""], width: 400, height: 340, pad: 40, title: "Training and test error" });
    [3, 10, 30, 100].forEach(v => Q.text(String(v), 0, Math.log10(v), { dx: -6, dy: 4, anchor: "end", size: 13, color: C.muted, layer: Q.back }));
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, deg = 1;
    const sl = slider(ctl, { label: "Degree", min: 0, max: 12, step: 1, value: deg, onInput: v => { deg = v; draw(); } });
    player(ctl, sl, { interval: 800 });
    const out = readout(root);
    function draw() {
      if (!D) return; P.clear(); Q.clear();
      P.path(D.cf.map((c, i) => [c, D.nr[i]]), { color: C.muted, width: 1.5, dash: "5 4" });
      D.cte.forEach((c, i) => P.dot([c, D.yte[i]], { color: C.vermilion, r: 2.6, sw: 0, opacity: 0.55 }));
      P.path(D.cf.map((c, i) => [c, D.curves[deg][i]]), { color: C.ink, width: 2.5 });
      D.ctr.forEach((c, i) => P.dot([c, D.ytr[i]], { color: C.blue, r: 4.5 }));
      Q.line([0, Math.log10(9)], [12.5, Math.log10(9)], { color: C.muted, dash: "4 4", width: 1.2 });
      Q.text("noise level", 12.4, Math.log10(9), { anchor: "end", dy: 16, color: C.muted, size: 12 });
      Q.line([deg, 0.3], [deg, 2.4], { color: C.axis, width: 1.2 });
      [[D.mtr, C.blue], [D.mte, C.vermilion]].forEach(([m, c]) => { Q.path(m.map((v, i) => [i, Math.log10(v)]), { color: c, width: 2.2 }); m.forEach((v, i) => Q.dot([i, Math.log10(v)], { color: c, r: i === deg ? 6 : 3.5 })); });
      const best = D.mte.indexOf(Math.min(...D.mte));
      out.innerHTML = `<p><span class="k-blue">Training error</span> ${fmt(D.mtr[deg], 2)} &nbsp;·&nbsp; <span class="k-verm">Test error</span> ${fmt(D.mte[deg], 2)} &nbsp;(spikes/s)²</p>
        <p>${deg < 3 ? "Too simple: the curve cannot follow the saturating response, so both errors are high." : deg <= 7 ? `About right: the test error is near its minimum (lowest at degree ${best}, ${fmt(D.mte[best], 2)}).` : "Too flexible: the curve chases the noise in the 20 training trials (blue). Training error keeps falling while the error on the 100 new trials (vermilion) roughly doubles."}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 8. Indicator coding and the dummy-variable trap. */
  IX.register("dummy-trap", root => {
    const cond = ["left", "right", "no-go"], cc = [C.blue, C.orange, C.green];
    const B = { i: 10.07, c: 11.84, r: 6.21, n: -4.25 };
    let D = null, trap = false, sh = 0;
    buttons(root, [{ label: "Left as reference (K − 1)" }, { label: "All three indicators (trap)" }], (it, i) => { trap = i === 1; if (!trap) { sh = 0; sl.set(0); } draw(); }, { toggle: true, label: "Design" });
    const grid = h("div", { class: "ix-two" }, root);
    const g1 = h("div", {}, grid), g2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, g1, "Data and fitted lines");
    h("p", { class: "ix-panel-title" }, g2, "Coefficients");
    const P = Plane(g1, { x: [0, 1.05], y: [0, 35], xtick: 0.2, ytick: 10, labels: ["contrast", "rate (spikes/s)"], width: 400, height: 330, pad: 40, clip: true, title: "Three conditions, parallel lines" });
    const svg = svgBox(g2, 400, 330, "Coefficient values"); const g = el("g", {}, svg);
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const sl = slider(ctl, { label: "Shift c", min: -10, max: 10, step: 0.25, value: 0, format: v => fmt(v, 2), onInput: v => { sh = trap ? v : 0; if (!trap) sl.set(0); draw(); } });
    player(ctl, sl, { bounce: true, interval: 60, onStart: () => { if (!trap) { trap = true; root.querySelectorAll(".ix-buttons .ix-btn").forEach((b, k) => b.setAttribute("aria-pressed", String(k === 1))); } } });
    const out = readout(root);
    function coefs() {
      return trap ? [["intercept", B.i + sh, C.ink], ["contrast", B.c, C.purple], ["left", -sh, cc[0]], ["right", B.r - sh, cc[1]], ["no-go", B.n - sh, cc[2]]]
                  : [["intercept", B.i, C.ink], ["contrast", B.c, C.purple], ["left", null, cc[0]], ["right", B.r, cc[1]], ["no-go", B.n, cc[2]]];
    }
    function draw() {
      if (!D) return; P.clear(); clear(g);
      D.dc.forEach((c, i) => { const j = ((i * 7) % 9 - 4) * 0.006; P.dot([c + j, D.dr[i]], { color: cc[D.dk[i]], r: 3.6, sw: 1 }); });
      const off = [0, B.r, B.n];
      off.forEach((o, k) => { P.line([0, B.i + o], [1.05, B.i + o + B.c * 1.05], { color: cc[k], width: 2.5 }); P.text(cond[k], 1.03, B.i + o + B.c * 1.03, { anchor: "end", dy: k === 2 ? 18 : -8, color: k === 1 ? "#a87400" : cc[k], weight: 700, halo: true }); });
      const cs = coefs(), y0 = 175, sc = 6.5, bw = 52;
      el("line", { x1: 20, x2: 390, y1: y0, y2: y0, stroke: C.axis, "stroke-width": 1.3 }, g);
      cs.forEach(([n, v, c], k) => {
        const x = 30 + k * 72;
        if (v == null) { txt(g, "reference", x + bw / 2, y0 - 8, { anchor: "middle", color: C.muted, size: 11 }); }
        else {
          el("rect", { x, y: v >= 0 ? y0 - v * sc : y0, width: bw, height: Math.max(1, Math.abs(v) * sc), fill: c, "fill-opacity": 0.85, rx: 2 }, g);
          txt(g, fmt(v, 2), x + bw / 2, v >= 0 ? y0 - v * sc - 6 : y0 - v * sc + 16, { anchor: "middle", size: 12, weight: 700 });
        }
        txt(g, n, x + bw / 2, 318, { anchor: "middle", size: 12, color: C.muted });
      });
      const fit = [0, 1, 2].map(k => cs[0][1] + cs[1][1] * 0.5 + (k === 0 ? (cs[2][1] || 0) : cs[k + 2][1]));
      out.innerHTML = trap
        ? `<p>Columns: intercept, contrast, is_left, is_right, is_nogo. The three indicators add up to the column of ones, so X has <b>5 columns but rank 4</b>, and κ(XᵀX) jumps from 19 to about 4 × 10¹⁶.</p>
           <p>Adding c to the intercept and subtracting c from every indicator leaves every prediction unchanged (rate at contrast 0.5: ${fit.map((v, k) => `${cond[k]} ${fmt(v, 2)}`).join(", ")} spikes/s). Press Play: the bars slide, the lines do not move. No single coefficient means anything on its own.</p>`
        : `<p>Columns: intercept, contrast, is_right, is_nogo. Left is the <b>reference</b>: the intercept (${B.i} spikes/s) is the left rate at zero contrast, and each indicator coefficient is a difference from left (true values 10, 12, +6, −4).</p><p>X has 4 columns and rank 4, so the coefficients are unique. Switch to the trap to see what goes wrong.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 9. Decoding real wheel velocity from motor cortex. */
  IX.register("decoder", root => {
    const P = Plane(root, { x: [0, 25], y: [-2600, 1600], xtick: 2.5, ytick: 1000, labels: ["time, 10 held-out trials end to end (s)", "wheel velocity (steps/s)"], width: 820, height: 360, pad: 54, clip: true, frame: true, title: "True and decoded wheel velocity" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, which = "ls";
    buttons(ctl, [{ label: "Least squares", v: "ls" }, { label: "Projection", v: "pj" }, { label: "Both", v: "both" }], it => { which = it.v; draw(); }, { toggle: true, label: "Decoder" });
    const out = readout(root);
    const T = i => i * 0.05;
    function draw() {
      if (!D) return; P.clear();
      for (let k = 1; k < 10; k++) P.line([k * 2.5, -2600], [k * 2.5, 1600], { color: C.axis, width: 0.8, dash: "2 4" });
      if (which !== "ls") P.path(D.vpj.map((v, i) => [T(i), v]), { color: C.vermilion, width: 1.3 });
      if (which !== "pj") P.path(D.vls.map((v, i) => [T(i), v]), { color: C.blue, width: 1.3 });
      P.path(D.vt.map((v, i) => [T(i), v]), { color: C.ink, width: 1.8 });
      out.innerHTML = `<p>Black: the true wheel velocity. Dotted lines separate trials.</p>
        <table><tr><th></th><th>test R²</th><th>correlation</th><th>spread (SD)</th></tr>
        <tr><td><span class="k-blue">Least squares</span></td><td><b>${fmt(D.r2ls, 2)}</b></td><td>0.87</td><td>403</td></tr>
        <tr><td><span class="k-verm">Projection</span></td><td><b>${fmt(D.r2pj, 2)}</b></td><td>0.57</td><td>717</td></tr>
        <tr><td>True velocity</td><td></td><td></td><td>410 steps/s</td></tr></table>
        <p>Both decoders use one 50 ms bin of 437 neurons. The projection decoder follows the timing of the turns but its swings are far too big, so its R² is below zero; least squares gets the scale right.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });
})();
