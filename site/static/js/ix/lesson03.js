/* Lesson 3: Matrices as Datasets. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson03/data.json").then(r => r.json()));
  const svgBox = (host, W, H, title) => { const s = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ix-svg", role: "img" }, host); if (title) el("title", {}, s).textContent = title; return s; };
  function txt(p, s, x, y, a = {}) {
    const t = el("text", { x, y, "text-anchor": a.anchor || "start", "font-size": a.size || 12, fill: a.color || C.ink, "font-weight": a.weight || 400, "font-family": "inherit" }, p);
    t.textContent = s; return t;
  }
  const clear = g => { while (g.firstChild) g.removeChild(g.firstChild); };
  const slate = f => { const k = Math.max(0, Math.min(1, f)); return `rgb(${Math.round(255 - k * 196)},${Math.round(255 - k * 181)},${Math.round(255 - k * 165)})`; };   // white -> slate
  const diverge = v => { const t = Math.max(-1, Math.min(1, v)), c1 = t < 0 ? [0, 114, 178] : [213, 94, 0], k = Math.abs(t); return `rgb(${[255, 255, 255].map((x, i) => Math.round(x + (c1[i] - x) * k)).join(",")})`; };
  const signed = v => diverge(-v);   // positive blue (excitatory), negative vermilion (inhibitory)
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function tween(dur, f, done) { const t0 = performance.now(); const st = now => { const k = reduce() ? 1 : Math.min(1, (now - t0) / dur); f(ease(k)); if (k < 1) requestAnimationFrame(st); else if (done) done(); }; requestAnimationFrame(st); }

  /* 1. The recording as a matrix: rows, columns and reductions. */
  IX.register("matrix-explorer", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const cw = 52, ch = 15, X0 = 52, Y0 = 34, W = X0 + 6 * cw + 70, H = Y0 + 24 * ch + 46;
    const svg = svgBox(left, W, H, "The simulated recording, 24 trials by 6 neurons"); const g = el("g", {}, svg);
    let D = null, mode = "row", sel = 1, col = 3, leftOnly = false;
    buttons(side, [{ label: "A row", m: "row" }, { label: "A column", m: "col" }, { label: "Mean, axis=0", m: "ax0" }, { label: "Mean, axis=1", m: "ax1" }], it => { mode = it.m; draw(); }, { toggle: true, label: "Show" });
    buttons(side, [{ label: "All trials" }, { label: "Left trials only" }], (it, i) => { leftOnly = i === 1; draw(); }, { toggle: true, label: "Rows" });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Click any cell to choose its row and its column.");
    function draw() {
      if (!D) return; clear(g);
      const R = D.rates, n = R.length, mx = 90;
      const keep = R.map((r, i) => !leftOnly || D.cond[i] === "left");
      for (let j = 0; j < 6; j++) { txt(g, D.ids[j], X0 + j * cw + cw / 2, Y0 - 18, { anchor: "middle", weight: 600 }); txt(g, `(${D.areas[j]})`, X0 + j * cw + cw / 2, Y0 - 5, { anchor: "middle", color: C.muted, size: 10.5 }); }
      for (let i = 0; i < n; i++) {
        txt(g, `${i + 1} ${D.cond[i] === "left" ? "L" : "R"}`, X0 - 6, Y0 + i * ch + ch - 3, { anchor: "end", size: 10.5, color: keep[i] ? C.ink : "#c3cad1" });
        for (let j = 0; j < 6; j++) {
          const r = el("rect", { x: X0 + j * cw, y: Y0 + i * ch, width: cw - 1, height: ch - 1, fill: slate(R[i][j] / mx), opacity: keep[i] ? 1 : 0.18 }, g);
          r.style.cursor = "pointer"; r.addEventListener("click", () => { sel = i; col = j; draw(); });
        }
      }
      const box = (x, y, w, hh, c) => el("rect", { x, y, width: w, height: hh, fill: "none", stroke: c, "stroke-width": 3, rx: 2 }, g);
      const rows = R.filter((r, i) => keep[i]);
      let html = "";
      if (mode === "row") { box(X0 - 2, Y0 + sel * ch - 1, 6 * cw + 2, ch + 1, C.vermilion); html = `<p><span class="k-verm">Row ${sel + 1}</span>: trial ${sel + 1}'s population vector, shape (6,)</p><p class="big">(${R[sel].map(v => fmt(v, 1)).join(", ")}) spikes/s</p><p>Trial ${sel + 1} is a <b>${D.cond[sel]}</b> trial. In NumPy: <code>rates[${sel}]</code>.</p>`; }
      if (mode === "col") { box(X0 + col * cw - 1, Y0 - 1, cw + 1, n * ch + 1, C.green); html = `<p><span class="k-green">Column ${col + 1}</span>: neuron ${D.ids[col]} (${D.areas[col]}) on every trial, shape (24,)</p><p>${R.map(r => fmt(r[col], 1)).slice(0, 8).join(", ")}, … spikes/s</p><p>In NumPy: <code>rates[:, ${col}]</code>.</p>`; }
      if (mode === "ax0") {
        const m = [0, 1, 2, 3, 4, 5].map(j => mean(rows.map(r => r[j])));
        m.forEach((v, j) => { el("rect", { x: X0 + j * cw, y: Y0 + n * ch + 8, width: cw - 1, height: 20, fill: slate(v / mx), stroke: C.purple, "stroke-width": 2 }, g); txt(g, fmt(v, 1), X0 + j * cw + cw / 2, Y0 + n * ch + 22, { anchor: "middle", weight: 600, size: 11, color: v > 50 ? "#fff" : C.ink }); });
        txt(g, "mean", X0 - 6, Y0 + n * ch + 22, { anchor: "end", color: "#a8558a", weight: 700 });
        html = `<p><span class="k-purple">rates${leftOnly ? "[is_left]" : ""}.mean(axis=0)</span>: the rows disappear, one mean per neuron, shape (6,)</p><p class="big">(${m.map(v => fmt(v, 1)).join(", ")})</p><p>${leftOnly ? "Averaging only the left rows gives the left condition's mean population vector." : "This is the mean population vector of the whole session."}</p>`;
      }
      if (mode === "ax1") {
        R.forEach((r, i) => { if (!keep[i]) return; const v = mean(r); el("rect", { x: X0 + 6 * cw + 8, y: Y0 + i * ch, width: 40, height: ch - 1, fill: slate(v / mx), stroke: C.purple, "stroke-width": 1.5 }, g); txt(g, fmt(v, 1), X0 + 6 * cw + 28, Y0 + i * ch + ch - 3, { anchor: "middle", size: 10, weight: 600 }); });
        txt(g, "mean", X0 + 6 * cw + 28, Y0 - 5, { anchor: "middle", color: "#a8558a", weight: 700 });
        html = `<p><span class="k-purple">rates${leftOnly ? "[is_left]" : ""}.mean(axis=1)</span>: the columns disappear, one mean per trial, shape (${rows.length},)</p><p>Each number is the whole population's average activity on one trial.</p>`;
      }
      out.innerHTML = `<p>rates${leftOnly ? "[is_left]" : ""} has shape <b>(${rows.length}, 6)</b>: (trials, neurons), spikes/s. Darker cells fire faster.</p>` + html;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 2. The transpose as a reflection in the main diagonal. */
  IX.register("transpose", root => {
    const R = [[12, 4, 19], [50, 8, 33], [14, 5, 21], [48, 9, 30]];
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const c = 62, X0 = 70, Y0 = 50, W = X0 + 4 * c + 30, H = Y0 + 4 * c + 44;
    const svg = svgBox(left, W, H, "R and its transpose"); const g = el("g", {}, svg);
    let t = 0, pick = [1, 2];
    const sl = slider(side, { label: "Reflect", min: 0, max: 1, step: 0.02, value: 0, format: v => Math.round(v * 100) + "%", onInput: v => { t = v; draw(); } });
    player(side, sl, { bounce: true, interval: 35 });
    const out = readout(side);
    function draw() {
      clear(g);
      el("line", { x1: X0 - 20, y1: Y0 - 20, x2: X0 + 4 * c, y2: Y0 + 4 * c, stroke: C.axis, "stroke-dasharray": "5 5", "stroke-width": 1.5 }, g);
      txt(g, "main diagonal", X0 + 4 * c + 22, Y0 + 4 * c + 34, { anchor: "end", color: C.muted, size: 11 });
      const rows = t < 0.5 ? 4 : 3, cols = t < 0.5 ? 3 : 4;
      txt(g, t < 0.5 ? "R: 4 × 3 (trials, neurons)" : "Rᵀ: 3 × 4 (neurons, trials)", X0, 22, { weight: 700, size: 14 });
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        const x = (1 - t) * j + t * i, y = (1 - t) * i + t * j, k = 1 - 0.45 * Math.sin(Math.PI * t), sz = (c - 6) * k, o = (c - sz) / 2;
        const on = pick[0] === i && pick[1] === j, diag = i === j;
        const r = el("rect", { x: X0 + x * c + o, y: Y0 + y * c + o, width: sz, height: sz, rx: 6, fill: on ? C.purple : diag ? "#e7eef4" : "#f5f7f9", stroke: on ? C.purple : C.axis, "stroke-width": 1.2 }, g);
        r.style.cursor = "pointer"; r.addEventListener("click", () => { pick = [i, j]; draw(); });
        txt(g, String(R[i][j]), X0 + x * c + c / 2, Y0 + y * c + c / 2 + 6 * k, { anchor: "middle", size: 17 * k, weight: 700, color: on ? "#fff" : C.ink });
      }
      for (let k = 0; k < rows; k++) txt(g, String(k + 1), X0 - 10, Y0 + k * c + c / 2 + 5, { anchor: "end", color: C.muted });
      for (let k = 0; k < cols; k++) txt(g, String(k + 1), X0 + k * c + c / 2, Y0 + 4 * c + 2 + 14, { anchor: "middle", color: C.muted });
      const [i, j] = pick;
      out.innerHTML = `<p>The <span class="k-purple">chosen entry</span> ${R[i][j]} sits at row ${i + 1}, column ${j + 1} of R, so it lands at row ${j + 1}, column ${i + 1} of Rᵀ: (Rᵀ)<sub>${j + 1}${i + 1}</sub> = r<sub>${i + 1}${j + 1}</sub>.</p>
        <p>${i === j ? "It is on the main diagonal, so the reflection leaves it where it is." : "Entries off the diagonal swap sides."} The shape swaps from 4 × 3 to 3 × 4, and reflecting twice brings every entry home.</p>`;
    }
    draw();
  });

  /* 3. A pair of neurons: symmetric and antisymmetric parts of their connections. */
  IX.register("pair-split", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const W = 550, H = 330; const svg = svgBox(left, W, H, "Two neurons and the split of their connection matrix"); const g = el("g", {}, svg);
    const defs = el("defs", {}, svg);
    const mk = (id, col) => { const m = el("marker", { id, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 13, markerHeight: 13, markerUnits: "userSpaceOnUse", orient: "auto" }, defs); el("path", { d: "M0 0L10 5L0 10z", fill: col }, m); };
    const uid = "ps" + Math.random().toString(36).slice(2, 7);
    mk(uid + "b", C.blue); mk(uid + "v", C.vermilion); mk(uid + "k", C.ink);
    let a21 = 0.8, a12 = 0;
    const s1 = slider(side, { label: "N1 → N2", min: -1, max: 1, step: 0.1, value: a21, onInput: v => { a21 = v; draw(); } });
    const s2 = slider(side, { label: "N2 → N1", min: -1, max: 1, step: 0.1, value: a12, onInput: v => { a12 = v; draw(); } });
    buttons(side, [{ label: "+0.8 and 0", v: [0.8, 0] }, { label: "+0.4 and −0.4", v: [0.4, -0.4] }, { label: "+0.5 and +0.5", v: [0.5, 0.5] }], it => { [a21, a12] = it.v; s1.set(a21); s2.set(a12); draw(); }, { label: "Examples" });
    const out = readout(side);
    function mat(x, y, M, title) {
      txt(g, title, x + 52, y - 10, { anchor: "middle", weight: 700, size: 12.5 });
      M.forEach((row, i) => row.forEach((v, j) => {
        el("rect", { x: x + j * 52, y: y + i * 40, width: 50, height: 38, rx: 4, fill: signed(v), stroke: C.axis }, g);
        txt(g, fmt(v, 2), x + j * 52 + 25, y + i * 40 + 24, { anchor: "middle", weight: 600, color: Math.abs(v) > 0.6 ? "#fff" : C.ink });
      }));
    }
    function arrow(x1, y1, x2, y2, w, off) {
      if (Math.abs(w) < 0.05) return;
      const nx = -(y2 - y1), ny = x2 - x1, n = Math.hypot(nx, ny), ox = nx / n * off, oy = ny / n * off;
      el("line", { x1: x1 + ox, y1: y1 + oy, x2: x2 + ox, y2: y2 + oy, stroke: w > 0 ? C.blue : C.vermilion, "stroke-width": 1.5 + 6 * Math.abs(w), "marker-end": `url(#${uid}${w > 0 ? "b" : "v"})` }, g);
    }
    function draw() {
      clear(g);
      const A = [[0, a12], [a21, 0]], S = [[0, (a12 + a21) / 2], [(a12 + a21) / 2, 0]], K = [[0, (a12 - a21) / 2], [(a21 - a12) / 2, 0]];
      txt(g, "Circuit", 20, 22, { weight: 700, size: 12.5 });
      const p1 = [60, 110], p2 = [220, 110];
      arrow(p1[0] + 24, p1[1], p2[0] - 30, p2[1], a21, -10); arrow(p2[0] - 24, p2[1], p1[0] + 30, p1[1], a12, -10);
      [[p1, "N1"], [p2, "N2"]].forEach(([p, n]) => { el("circle", { cx: p[0], cy: p[1], r: 22, fill: "#fff", stroke: C.ink, "stroke-width": 1.5 }, g); txt(g, n, p[0], p[1] + 5, { anchor: "middle", weight: 700 }); });
      txt(g, "Undirected view (symmetric part only)", 20, 200, { weight: 700, size: 12.5 });
      const q1 = [60, 260], q2 = [220, 260], s = S[0][1];
      if (Math.abs(s) >= 0.05) el("line", { x1: q1[0] + 22, y1: q1[1], x2: q2[0] - 22, y2: q2[1], stroke: s > 0 ? C.blue : C.vermilion, "stroke-width": 1.5 + 6 * Math.abs(s) }, g);
      else txt(g, "no link", 140, 252, { anchor: "middle", color: C.muted });
      [[q1, "N1"], [q2, "N2"]].forEach(([p, n]) => { el("circle", { cx: p[0], cy: p[1], r: 22, fill: "#fff", stroke: C.ink, "stroke-width": 1.5 }, g); txt(g, n, p[0], p[1] + 5, { anchor: "middle", weight: 700 }); });
      mat(300, 40, A, "A (row = target)"); mat(300, 170, S, "Symmetric part S"); mat(435, 170, K, "Antisymmetric K");
      txt(g, "+", 419, 215, { size: 20, weight: 700, color: C.muted, anchor: "middle" }); txt(g, "A = S + K", 352, 265, { anchor: "middle", color: C.muted, size: 12 });
      out.innerHTML = `<p>A = S + K. <b>S</b> holds the average coupling of the pair, ${fmt((a12 + a21) / 2, 2)}, whichever way the signal travels. <b>K</b> holds the imbalance, ±${fmt(Math.abs(a21 - a12) / 2, 2)}, and its diagonal is always zero.</p>
        <p>${Math.abs(a12 + a21) < 0.05 && Math.abs(a21 - a12) > 0.05 ? "The symmetric part is zero: an undirected analysis would call this pair unconnected, although both connections exist." : "Blue is excitatory, vermilion inhibitory; thicker means stronger."}</p>`;
    }
    draw();
  });

  /* 4. The six-neuron circuit and its adjacency matrix, linked. */
  IX.register("adjacency", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const W = 560, H = 330; const svg = svgBox(left, W, H, "Circuit and adjacency matrix"); const g = el("g", {}, svg);
    const defs = el("defs", {}, svg); const uid = "ad" + Math.random().toString(36).slice(2, 7);
    [["b", C.blue], ["v", C.vermilion]].forEach(([k, col]) => { const m = el("marker", { id: uid + k, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 13, markerHeight: 13, markerUnits: "userSpaceOnUse", orient: "auto" }, defs); el("path", { d: "M0 0L10 5L0 10z", fill: col }, m); });
    let A0 = null, node = 0, cell = null, lesion = false;
    buttons(side, [{ label: "Intact" }, { label: "Lesion N1" }], (it, i) => { lesion = i === 1; draw(); }, { toggle: true, label: "Circuit" });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Click a neuron in the circuit, or an entry of the matrix.");
    const pos = [[90, 50], [190, 95], [190, 205], [90, 250], [30, 150], [250, 290]].map(([x, y]) => [x + 10, y]);
    const P = [[100, 45], [205, 95], [205, 205], [100, 255], [40, 150], [255, 285]];
    function draw() {
      if (!A0) return; clear(g);
      const A = A0.map(r => r.map((v, j) => lesion && j === 0 ? 0 : v));
      const edges = []; A.forEach((r, i) => r.forEach((v, j) => { if (v) edges.push([j, i, v]); }));
      edges.forEach(([j, i, v]) => {
        const rel = cell ? (cell[0] === i && cell[1] === j) : (i === node || j === node);
        const [x1, y1] = P[j], [x2, y2] = P[i], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, off = A[j][i] ? 5 : 0;
        el("line", { x1: x1 + ux * 20 - uy * off, y1: y1 + uy * 20 + ux * off, x2: x2 - ux * 24 - uy * off, y2: y2 - uy * 24 + ux * off, stroke: v > 0 ? C.blue : C.vermilion, "stroke-width": 1.5 + 3 * Math.abs(v), opacity: rel ? 1 : 0.2, "marker-end": `url(#${uid}${v > 0 ? "b" : "v"})` }, g);
      });
      P.forEach((p, k) => {
        const c = el("circle", { cx: p[0], cy: p[1], r: 18, fill: k === node && !cell ? "#f3e6ee" : "#fff", stroke: C.ink, "stroke-width": k === node && !cell ? 2.5 : 1.3 }, g);
        c.style.cursor = "pointer"; c.addEventListener("click", () => { node = k; cell = null; draw(); });
        const t = txt(g, `N${k + 1}`, p[0], p[1] + 4, { anchor: "middle", weight: 700 }); t.style.pointerEvents = "none";
      });
      const X0 = 330, Y0 = 50, c = 34;
      txt(g, "source j →", X0 + 3 * c, Y0 - 26, { anchor: "middle", color: C.muted, size: 11 });
      const tl = txt(g, "target i →", X0 - 34, Y0 + 3 * c, { anchor: "middle", color: C.muted, size: 11 }); tl.setAttribute("transform", `rotate(-90 ${X0 - 34} ${Y0 + 3 * c})`);
      for (let k = 0; k < 6; k++) { txt(g, `N${k + 1}`, X0 + k * c + c / 2, Y0 - 8, { anchor: "middle", size: 11, color: C.muted }); txt(g, `N${k + 1}`, X0 - 6, Y0 + k * c + c / 2 + 4, { anchor: "end", size: 11, color: C.muted }); }
      A.forEach((r, i) => r.forEach((v, j) => {
        const R = el("rect", { x: X0 + j * c, y: Y0 + i * c, width: c - 2, height: c - 2, rx: 3, fill: signed(v), stroke: C.grid }, g);
        R.style.cursor = "pointer"; R.addEventListener("click", () => { cell = [i, j]; draw(); });
        if (v) txt(g, fmt(v, 1), X0 + j * c + c / 2 - 1, Y0 + i * c + c / 2 + 4, { anchor: "middle", size: 11, weight: 600, color: Math.abs(v) > 0.6 ? "#fff" : C.ink }).style.pointerEvents = "none";
      }));
      if (cell) el("rect", { x: X0 + cell[1] * c - 1, y: Y0 + cell[0] * c - 1, width: c, height: c, fill: "none", stroke: C.ink, "stroke-width": 2.5 }, g);
      else { el("rect", { x: X0 - 1, y: Y0 + node * c - 1, width: 6 * c, height: c, fill: "none", stroke: C.purple, "stroke-width": 2.5 }, g); el("rect", { x: X0 + node * c - 1, y: Y0 - 1, width: c, height: 6 * c, fill: "none", stroke: C.green, "stroke-width": 2.5, "stroke-dasharray": "5 3" }, g); }
      const sin = A[node].reduce((s, v) => s + v, 0), sout = A.reduce((s, r) => s + r[node], 0), nnz = A.flat().filter(v => v).length;
      out.innerHTML = cell
        ? `<p>Entry a<sub>${cell[0] + 1}${cell[1] + 1}</sub> = <b>${fmt(A[cell[0]][cell[1]], 2)}</b>: ${A[cell[0]][cell[1]] ? `the connection <b>from N${cell[1] + 1} to N${cell[0] + 1}</b> (${A[cell[0]][cell[1]] > 0 ? "excitatory" : "inhibitory"})` : `no connection from N${cell[1] + 1} to N${cell[0] + 1}`}. Row = target, column = source.</p>`
        : `<p><b>N${node + 1}</b> <span class="k-purple">receives</span> (row ${node + 1}): in-strength <b>${fmt(sin, 2)}</b><br>N${node + 1} <span class="k-green">sends</span> (column ${node + 1}, dashed): out-strength <b>${fmt(sout, 2)}</b></p>`;
      out.innerHTML += `<p>${nnz} connections of 36 possible: density ${fmt(nnz / 36, 2)}.${lesion ? " The lesion is A ⊙ M with a mask M that is 0 in column N1: N1's outgoing connections are gone." : ""}</p>`;
    }
    data().then(d => { A0 = d.A; draw(); });
  });

  /* 5. Memory: dense against CSR storage. */
  IX.register("sparse-memory", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const P = Plane(left, { x: [-4, 0], y: [-3, 5], xtick: 99, ytick: 99, labels: ["", ""], width: 500, height: 380, pad: 56, title: "Memory needed against density" });
    let lgN = 3.3, lgD = -2;
    const sN = slider(side, { label: "Neurons n", min: 2, max: 5, step: 0.1, value: lgN, format: v => Math.round(10 ** v).toLocaleString(), onInput: v => { lgN = v; draw(); } });
    const sD = slider(side, { label: "Density", min: -4, max: 0, step: 0.05, value: lgD, format: v => (10 ** v * 100 < 1 ? (10 ** v * 100).toPrecision(2) : fmt(10 ** v * 100, 1)) + "%", onInput: v => { lgD = v; draw(); } });
    const out = readout(side);
    const mb = b => b / 1e6;
    function draw() {
      P.clear();
      const n = 10 ** lgN, dense = 8 * n * n, csr = d => 12 * d * n * n + 4 * (n + 1);
      for (let k = -3; k <= 5; k++) { P.line([-4, k], [0, k], { color: C.grid, width: 1 }); P.text(k === 0 ? "1 MB" : k > 0 ? `10${"⁰¹²³⁴⁵"[k]} MB` : `10⁻${"⁰¹²³"[-k]} MB`, -4, k, { dx: -6, dy: 4, anchor: "end", size: 11, color: C.muted }); }
      for (let k = -4; k <= 0; k++) P.text(k === 0 ? "100%" : `${fmt(10 ** k * 100, 2)}%`, k, -3, { dy: 18, anchor: "middle", size: 11, color: C.muted });
      P.text("density of connections", -2, -3, { dy: 38, anchor: "middle", color: C.muted, size: 13 });
      const yD = Math.log10(mb(dense)), clampY = y => Math.max(-3, Math.min(5, y));
      P.line([-4, clampY(yD)], [0, clampY(yD)], { color: C.vermilion, width: 3 });
      const pts = []; for (let x = -4; x <= 0.0001; x += 0.05) pts.push([x, clampY(Math.log10(mb(csr(10 ** x))))]);
      P.path(pts, { color: C.blue, width: 3 });
      P.line([Math.log10(2 / 3), -3], [Math.log10(2 / 3), 5], { color: C.muted, dash: "4 4" });
      P.text("2/3", Math.log10(2 / 3), 5, { dx: -4, dy: 14, anchor: "end", size: 11, color: C.muted });
      P.dot([lgD, clampY(Math.log10(mb(csr(10 ** lgD))))], { color: C.blue, r: 6 }); P.dot([lgD, clampY(yD)], { color: C.vermilion, r: 6 });
      const c = csr(10 ** lgD), f = v => v >= 1e9 ? fmt(v / 1e9, 2) + " GB" : v >= 1e6 ? fmt(v / 1e6, 2) + " MB" : fmt(v / 1e3, 1) + " kB";
      out.innerHTML = `<table><tr><td><span class="k-verm">Dense</span></td><td>8n² = <b>${f(dense)}</b>, whatever the density</td></tr>
        <tr><td><span class="k-blue">CSR</span></td><td>12 nnz + 4(n + 1) = <b>${f(c)}</b> (nnz ≈ ${Math.round(10 ** lgD * n * n).toLocaleString()})</td></tr></table>
        <p>${c < dense ? `CSR is <b>${fmt(dense / c, dense / c > 100 ? 0 : 1)} times</b> smaller.` : "Above a density of 2/3, dense storage is smaller."}</p>`;
    }
    draw();
  });

  /* 6. rates * w versus rates @ w. */
  IX.register("star-vs-at", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const lb = h("div", {}, grid), rb = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, lb, "rates * w: shape (24, 6)");
    h("p", { class: "ix-panel-title" }, rb, "rates @ w: shape (24,), one sum per trial");
    const c1 = 44, ch = 13, X0 = 40, Y0 = 22;
    const S1 = svgBox(lb, X0 + 6 * c1 + 10, Y0 + 24 * ch + 10, "Elementwise product"); const g1 = el("g", {}, S1);
    const S2 = svgBox(rb, 360, Y0 + 24 * ch + 30, "Weighted sum per trial"); const g2 = el("g", {}, S2);
    const ctl = h("div", { class: "ix-weights" }, root);
    let D = null, w = [1, -1, 0, 0.05, -0.5, 0];
    const sls = w.map((v, j) => slider(ctl, { label: `w<sub>${j + 1}</sub>`, min: -1, max: 1, step: 0.05, value: v, onInput: x => { w[j] = x; draw(); } }));
    buttons(root, ["Notebook weights", "All zero except N4"], (it, i) => { w = i === 0 ? [1, -1, 0, 0.05, -0.5, 0] : [0, 0, 0, 0.05, 0, 0]; sls.forEach((s, j) => s.set(w[j])); draw(); });
    const out = readout(root);
    function draw() {
      if (!D) return; clear(g1); clear(g2);
      const R = D.rates, P = R.map(r => r.map((x, j) => x * w[j])), z = P.map(r => r.reduce((s, x) => s + x, 0));
      const mx = Math.max(1, ...P.flat().map(Math.abs));
      for (let j = 0; j < 6; j++) txt(g1, D.ids[j], X0 + j * c1 + c1 / 2, Y0 - 6, { anchor: "middle", size: 11, weight: 600 });
      P.forEach((r, i) => { txt(g1, String(i + 1), X0 - 6, Y0 + i * ch + ch - 2, { anchor: "end", size: 9.5, color: C.muted }); r.forEach((v, j) => el("rect", { x: X0 + j * c1, y: Y0 + i * ch, width: c1 - 1, height: ch - 1, fill: diverge(v / mx) }, g1)); });
      const zm = Math.max(10, ...z.map(Math.abs)), mid = 190, sc = 150 / zm;
      el("line", { x1: mid, x2: mid, y1: Y0 - 4, y2: Y0 + 24 * ch, stroke: C.ink }, g2);
      let right = 0;
      z.forEach((v, i) => {
        const L = D.cond[i] === "left"; if ((v > 0) === L) right++;
        el("rect", { x: v >= 0 ? mid : mid + v * sc, y: Y0 + i * ch + 1, width: Math.max(1, Math.abs(v) * sc), height: ch - 3, fill: C.purple, opacity: 0.85 }, g2);
        txt(g2, L ? "L" : "R", 14, Y0 + i * ch + ch - 2, { size: 10, weight: 700, color: C.ink });
      });
      txt(g2, "0", mid, Y0 + 24 * ch + 14, { anchor: "middle", color: C.muted }); txt(g2, fmt(zm, 0), mid + 150, Y0 + 24 * ch + 14, { anchor: "middle", color: C.muted }); txt(g2, fmt(-zm, 0), mid - 150, Y0 + 24 * ch + 14, { anchor: "middle", color: C.muted });
      out.innerHTML = `<p>Trial 1: products (${P[0].map(v => fmt(v, 2)).join(", ")}) → their sum is <b>${fmt(z[0], 2)}</b> spikes/s.</p>
        <p>The left matrix keeps every product; the bars add each row. With "positive sum = left", <b>${right} of 24</b> trials are classified correctly.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 7. Raw, centred and z-scored columns. */
  IX.register("centring", root => {
    const W = 640, H = 340, X0 = 60, Y0 = 20, PW = W - X0 - 20, PH = H - Y0 - 50;
    const svg = svgBox(root, W, H, "Each neuron's trials: raw, centred or z-scored"); const g = el("g", {}, svg), ax = el("g", {}, svg);
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const out = readout(root);
    let D = null, mode = 0, pos = null;
    buttons(ctl, [{ label: "Raw rates" }, { label: "Centred" }, { label: "Z-scored" }], (it, i) => { go(i); }, { toggle: true, label: "Show" });
    const ranges = [[0, 100], [-40, 40], [-3, 3]], units = ["spikes/s", "spikes/s from the neuron's mean", "standard deviations"];
    function vals(m) {
      const R = D.rates, cols = [0, 1, 2, 3, 4, 5].map(j => R.map(r => r[j]));
      return cols.map(cv => { const mu = mean(cv), s = sd(cv); return cv.map(x => m === 0 ? x : m === 1 ? x - mu : (x - mu) / s); });
    }
    const jit = i => ((i * 37) % 24) / 23 - 0.5;
    function target(m) { const V = vals(m), [lo, hi] = ranges[m]; return V.map((cv, j) => cv.map((y, i) => [X0 + (j + 0.5) * PW / 6 + jit(i) * 34, Y0 + PH - (Math.max(lo, Math.min(hi, y)) - lo) / (hi - lo) * PH])); }
    function axes(m) {
      clear(ax); const [lo, hi] = ranges[m], step = m === 0 ? 20 : m === 1 ? 20 : 1;
      el("line", { x1: X0, x2: X0, y1: Y0, y2: Y0 + PH, stroke: C.axis }, ax);
      for (let y = lo; y <= hi + 1e-9; y += step) { const py = Y0 + PH - (y - lo) / (hi - lo) * PH; txt(ax, String(y), X0 - 6, py + 4, { anchor: "end", color: C.muted, size: 11 }); if (y === 0) el("line", { x1: X0, x2: X0 + PW, y1: py, y2: py, stroke: C.axis, "stroke-dasharray": "4 4" }, ax); }
      D.ids.forEach((n, j) => txt(ax, n, X0 + (j + 0.5) * PW / 6, Y0 + PH + 20, { anchor: "middle", weight: 600 }));
      const yl = txt(ax, units[m], 16, Y0 + PH / 2, { anchor: "middle", color: C.muted, size: 11.5 }); yl.setAttribute("transform", `rotate(-90 16 ${Y0 + PH / 2})`);
    }
    function paint(p) { clear(g); p.forEach((cv, j) => cv.forEach((q, i) => el("circle", { cx: q[0], cy: q[1], r: 4, fill: D.cond[i] === "left" ? C.blue : C.orange, opacity: 0.85 }, g))); }
    function go(m) {
      const from = pos, to = target(m); mode = m; axes(m);
      if (!from) { pos = to; paint(to); } else tween(650, k => { pos = from.map((cv, j) => cv.map((q, i) => [q[0] + (to[j][i][0] - q[0]) * k, q[1] + (to[j][i][1] - q[1]) * k])); paint(pos); });
      const V = vals(m);
      out.innerHTML = `<p>Column means: (${V.map(cv => fmt(mean(cv), 1)).join(", ")}) &nbsp;·&nbsp; column SDs: (${V.map(cv => fmt(sd(cv), 2)).join(", ")})</p>
        <p>${m === 0 ? "In raw rates N4 dwarfs everything: any distance or dot product would be mostly N4." : m === 1 ? "Centring moves every column to mean 0 but keeps its units and its spread." : "Z-scoring gives every column mean 0 and SD 1. N3 and N6, which carry no condition information, are stretched to the same size as the rest."}</p>`;
    }
    data().then(d => { D = d; go(0); });
  });

  /* 8. Missing data: three remedies for neuron N3. */
  IX.register("missing", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const P = Plane(left, { x: [0, 25], y: [0, 22], xtick: 5, ytick: 5, labels: ["trial", "N3 (spikes/s)"], width: 500, height: 330, pad: 46, title: "Neuron N3 with missing entries" });
    const out = readout(side);
    let D = null, how = "drop";
    buttons(side, [{ label: "Leave out the gaps", v: "drop" }, { label: "Fill with 0", v: "zero" }, { label: "Fill with the mean", v: "mean" }], it => { how = it.v; draw(); }, { toggle: true, label: "Handle" });
    const miss = new Set([4, 5, 6, 7, 8, 13]);
    function draw() {
      if (!D) return; P.clear();
      const col = D.rates.map(r => r[2]), obs = col.filter((v, i) => !miss.has(i)), mo = mean(obs), so = sd(obs);
      const fill = how === "zero" ? 0 : how === "mean" ? mo : null;
      const used = how === "drop" ? obs : col.map((v, i) => miss.has(i) ? fill : v);
      const m = mean(used), s = sd(used);
      P.path([[0, m - s], [25, m - s], [25, m + s], [0, m + s]], { color: "none", fill: C.purple, fillOpacity: 0.1, close: true });
      P.line([0, mo], [25, mo], { color: C.muted, dash: "5 4", width: 1.5 });
      P.line([0, m], [25, m], { color: C.purple, width: 2.5 });
      col.forEach((v, i) => {
        if (!miss.has(i)) P.dot([i + 1, v], { color: C.ink, r: 4.5 });
        else if (fill != null) el("circle", { cx: P.X(i + 1), cy: P.Y(fill), r: 5, fill: "#fff", stroke: C.purple, "stroke-width": 2 }, P.layer);
        else P.text("–", i + 1, 0.6, { anchor: "middle", color: C.muted });
      });
      const k = 6, n = 24;
      out.innerHTML = `<table><tr><td>Observed</td><td>mean <b>${fmt(mo, 2)}</b>, SD ${fmt(so, 2)} (18 trials; dashed line)</td></tr>
        <tr><td><span class="k-purple">${how === "drop" ? "Gaps left out" : how === "zero" ? "Gaps filled with 0" : "Gaps filled with the mean"}</span></td><td>mean <b>${fmt(m, 2)}</b>, SD ${fmt(s, 2)} (${used.length} values; solid line and band)</td></tr></table>
        <p>${how === "zero" ? `The mean drops to (m − k)/m = 18/24 of the observed mean: ${fmt(18 / 24 * mo, 2)} spikes/s. Zero is a real rate, so each gap became a fake silent trial.` : how === "mean" ? `The mean is unchanged, but the SD shrinks by √(18/24): ${fmt(so * Math.sqrt(18 / 24), 2)}. The data look more consistent than they are.` : "Using only the 18 observed trials keeps both numbers honest, at the cost of six trials."}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 9. Keeping labels aligned with rows. */
  IX.register("alignment", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const cw = 44, ch = 13, X0 = 36, Y0 = 26, W = X0 + 6 * cw + 20, H = Y0 + 24 * ch + 12;
    const svg = svgBox(left, W, H, "Matrix with its label strip"); const g = el("g", {}, svg);
    const out = readout(side);
    let D = null, rowY = null, labY = null;
    const B = h("div", {}, side);
    buttons(side, [{ label: "Original order", v: "orig" }, { label: "Sort both by condition", v: "both" }, { label: "Sort matrix only (by N1)", v: "data" }], it => go(it.v), { toggle: true, label: "Order" });
    const bsvg = svgBox(B, 340, 170, "Left minus right difference for each neuron"); const bg = el("g", {}, bsvg);
    function order(v) {
      const n = D.rates.length, idx = [...Array(n).keys()];
      if (v === "both") return { rows: idx.slice().sort((a, b) => (D.cond[a] > D.cond[b]) - (D.cond[a] < D.cond[b]) || a - b), labs: null };
      if (v === "data") return { rows: idx.slice().sort((a, b) => D.rates[a][0] - D.rates[b][0]), labs: idx };
      return { rows: idx, labs: idx };
    }
    function paint() {
      clear(g); const R = D.rates;
      D.ids.forEach((n, j) => txt(g, n, X0 + 18 + j * cw + cw / 2, Y0 - 8, { anchor: "middle", size: 11, weight: 600 }));
      txt(g, "label", X0 + 6, Y0 - 8, { anchor: "middle", size: 10, color: C.muted });
      R.forEach((r, i) => r.forEach((v, j) => el("rect", { x: X0 + 18 + j * cw, y: rowY[i], width: cw - 1, height: ch - 1, fill: slate(v / 90) }, g)));
      D.cond.forEach((c, i) => el("rect", { x: X0, y: labY[i], width: 12, height: ch - 1, fill: c === "left" ? C.blue : C.orange }, g));
    }
    function diffs(rows, labs) {
      const lab = i => D.cond[labs ? labs[i] : rows[i]];
      return [0, 1, 2, 3, 4, 5].map(j => { const Lv = [], Rv = []; rows.forEach((ri, pos) => (lab(pos) === "left" ? Lv : Rv).push(D.rates[ri][j])); return mean(Lv) - mean(Rv); });
    }
    function bars(d) {
      clear(bg); const y0 = 85, sc = 70 / 45;
      el("line", { x1: 20, x2: 330, y1: y0, y2: y0, stroke: C.axis }, bg);
      d.forEach((v, j) => { const x = 30 + j * 50; el("rect", { x, y: v >= 0 ? y0 - v * sc : y0, width: 30, height: Math.max(1, Math.abs(v) * sc), fill: C.ink, rx: 2 }, bg); txt(bg, D.ids[j], x + 15, 165, { anchor: "middle", size: 11, color: C.muted }); txt(bg, fmt(v, 1), x + 15, v >= 0 ? y0 - v * sc - 4 : y0 + Math.abs(v) * sc + 12, { anchor: "middle", size: 10.5, weight: 600 }); });
      txt(bg, "left − right (spikes/s)", 20, 12, { size: 11, color: C.muted });
    }
    function go(v) {
      const { rows, labs } = order(v);
      const newRowY = Array(24), newLabY = Array(24);
      rows.forEach((ri, pos) => { newRowY[ri] = Y0 + pos * ch; });
      if (labs) labs.forEach((li, pos) => { newLabY[li] = Y0 + pos * ch; }); else rows.forEach((ri, pos) => { newLabY[ri] = Y0 + pos * ch; });
      const fr = rowY.slice(), fl = labY.slice();
      tween(700, k => { rowY = fr.map((y, i) => y + (newRowY[i] - y) * k); labY = fl.map((y, i) => y + (newLabY[i] - y) * k); paint(); });
      const d = diffs(rows, labs); bars(d);
      out.innerHTML = v === "data"
        ? `<p>The rows were sorted by N1's rate, but the label strip stayed where it was. Each label now sits next to a different trial, and the condition differences collapse towards zero. No error was raised.</p>`
        : `<p>${v === "both" ? "Matrix and labels were reordered with the same index array, so every row keeps its own label." : "Each row sits next to its own label."} N1 and N4 prefer left; N2 and N5 prefer right.</p>`;
    }
    data().then(d => { D = d; rowY = d.rates.map((r, i) => Y0 + i * ch); labY = rowY.slice(); paint(); go("orig"); });
  });
})();
