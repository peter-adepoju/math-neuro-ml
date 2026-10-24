/* Lesson 7: Covariance and PCA. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson07/data.json").then(r => r.json()));
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  /* symmetric 2 x 2 eigen-decomposition, largest first: {l: [l1, l2], v: [[x, y], [x, y]]} */
  function eigS2(a, b, c) {
    const m = (a + c) / 2, r = Math.hypot((a - c) / 2, b), l1 = m + r, l2 = m - r;
    const th = 0.5 * Math.atan2(2 * b, a - c);
    return { l: [l1, l2], v: [[Math.cos(th), Math.sin(th)], [-Math.sin(th), Math.cos(th)]] };
  }
  /* Jacobi eigen-decomposition of a small symmetric matrix; eigenvalues sorted, largest first */
  function jacobi(A0) {
    const n = A0.length, A = A0.map(r => r.slice()), V = A0.map((_, i) => A0.map((_, j) => +(i === j)));
    for (let sweep = 0; sweep < 60; sweep++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2;
      if (off < 1e-20) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const th = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]), c = Math.cos(th), s = Math.sin(th);
        for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    const idx = [...Array(n).keys()].sort((i, j) => A[j][j] - A[i][i]);
    return { l: idx.map(i => A[i][i]), v: idx.map(i => V.map(r => r[i])) };
  }
  const tex = (P, s, x, y, a) => P.text(s, x, y, Object.assign({ halo: true }, a));

  /* 1. Centring: the top direction of X^T X points at the mean until the data are centred. */
  IX.register("centring", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-16, 24], y: [-14, 34], xtick: 5, ytick: 5, labels: ["neuron 0 (spikes/s)", "neuron 1 (spikes/s)"], width: 440, height: 480, pad: 40, clip: true, title: "Two neurons, raw or centred" });
    const side = h("div", {}, L);
    let D = null, t = 0;
    const sl = slider(side, { label: "Centring", min: 0, max: 1, step: 0.02, value: 0, format: v => Math.round(v * 100) + "%", onInput: v => { t = v; draw(); } });
    player(side, sl, { interval: 40 });
    const out = readout(side);
    function draw() {
      if (!D) return; P.clear();
      const n = D.pair.length, mu = [0, 1].map(j => D.pair.reduce((s, p) => s + p[j], 0) / n), e = ease(t);
      const pts = D.pair.map(p => [p[0] - e * mu[0], p[1] - e * mu[1]]);
      let a = 0, b = 0, c = 0; pts.forEach(p => { a += p[0] * p[0]; b += p[0] * p[1]; c += p[1] * p[1]; });
      const E = eigS2(a, b, c), v = E.v[0];
      pts.forEach(p => P.dot(p, { color: C.blue, r: 2.6, sw: 0, opacity: 0.6 }));
      P.line([-60 * v[0], -60 * v[1]], [60 * v[0], 60 * v[1]], { color: C.purple, width: 3 });
      const m = [mu[0] * (1 - e), mu[1] * (1 - e)];
      P.dot(m, { color: C.vermilion, r: 7, sw: 2 });
      P.text("mean", m[0], m[1], { dx: 10, dy: -8, color: C.vermilion, weight: 700, halo: true });
      const ang = (deg(Math.atan2(v[1], v[0])) + 180) % 180;
      out.innerHTML = `<p>Purple: the top eigenvector of XᵀX for the data as shown, at ${fmt(ang, 0)}° from the neuron-0 axis.</p>
        <p>${t < 0.05 ? "With raw rates it points from the origin towards the mean (vermilion): it describes the baseline firing rates, not how the neurons vary." : t > 0.95 ? "After centring, the mean is at the origin and the top direction follows the long axis of the cloud: the direction of greatest variation." : "Subtracting the mean slides the cloud towards the origin, and the top direction swings round."}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 2. Variance along a direction, and the residual that goes with it. */
  IX.register("var-direction", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Centred data projected onto u");
    h("p", { class: "ix-panel-title" }, b2, "Variance kept and residual, for every angle");
    const P = Plane(b1, { x: [-16, 16], y: [-16, 16], xtick: 5, ytick: 5, labels: ["neuron 0", "neuron 1"], width: 380, height: 380, pad: 34, clip: true, title: "Projection onto u" });
    const Q = Plane(b2, { x: [0, 180], y: [0, 50], xtick: 45, ytick: 10, labels: ["angle of u (degrees)", "(spikes/s)²"], width: 400, height: 380, pad: 44, frame: true, title: "Variance against angle" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, th = 30;
    const sl = slider(ctl, { label: "Angle of u", min: 0, max: 180, step: 1, value: th, format: v => v + "°", onInput: v => { th = v; draw(); } });
    player(ctl, sl, { interval: 45 });
    const out = readout(root);
    function draw() {
      if (!D) return; P.clear(); Q.clear();
      const [[a, b], [, c]] = D.C2, tot = a + c, n = D.pair.length;
      const mu = [0, 1].map(j => D.pair.reduce((s, p) => s + p[j], 0) / n), pts = D.pair.map(p => [p[0] - mu[0], p[1] - mu[1]]);
      const u = [Math.cos(rad(th)), Math.sin(rad(th))];
      P.line([-30 * u[0], -30 * u[1]], [30 * u[0], 30 * u[1]], { color: C.purple, width: 2 });
      pts.forEach((p, i) => { if (i % 3) return; const s = p[0] * u[0] + p[1] * u[1]; P.line(p, [s * u[0], s * u[1]], { color: C.vermilion, width: 0.8, opacity: 0.45 }); });
      pts.forEach(p => P.dot(p, { color: C.blue, r: 2.2, sw: 0, opacity: 0.5 }));
      pts.forEach((p, i) => { if (i % 2) return; const s = p[0] * u[0] + p[1] * u[1]; P.dot([s * u[0], s * u[1]], { color: C.purple, r: 2.2, sw: 0 }); });
      P.arrow([0, 0], [8 * u[0], 8 * u[1]], { color: C.purple, width: 3.5 });
      const vv = A => { const w = [Math.cos(rad(A)), Math.sin(rad(A))]; return a * w[0] * w[0] + 2 * b * w[0] * w[1] + c * w[1] * w[1]; };
      const angs = [...Array(181).keys()];
      Q.line([0, tot], [180, tot], { color: C.muted, width: 1.2, dash: "5 4" });
      Q.text(`total ${fmt(tot, 1)}`, 178, tot, { dy: -6, anchor: "end", color: C.muted, size: 12 });
      Q.path(angs.map(A => [A, vv(A)]), { color: C.purple, width: 2.4 });
      Q.path(angs.map(A => [A, tot - vv(A)]), { color: C.vermilion, width: 2.4 });
      const v = vv(th);
      Q.line([th, 0], [th, 50], { color: C.axis, width: 1 });
      Q.dot([th, v], { color: C.purple, r: 6 }); Q.dot([th, tot - v], { color: C.vermilion, r: 6 });
      const E = eigS2(a, b, c), best = (deg(Math.atan2(E.v[0][1], E.v[0][0])) + 180) % 180;
      out.innerHTML = `<table><tr><td><span class="k-purple">variance along u</span>, uᵀCu</td><td><b>${fmt(v, 1)}</b> (spikes/s)²</td></tr><tr><td><span class="k-verm">mean squared residual</span></td><td><b>${fmt(tot - v, 1)}</b></td></tr><tr><td>sum</td><td>${fmt(tot, 1)}, whatever the angle</td></tr></table>
        <p>${Math.abs(th - best) < 1.5 ? `This is PC1, at ${fmt(best, 0)}°: the most variance kept, and so the smallest residual. Maximising one is minimising the other.` : `The variance along u is largest (${fmt(E.l[0], 1)}) at ${fmt(best, 0)}° and smallest (${fmt(E.l[1], 1)}) at right angles to it.`}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 3. Moving to score coordinates is a rotation that makes the covariance diagonal. */
  IX.register("pc-rotate", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-16, 16], y: [-16, 16], xtick: 5, ytick: 5, labels: ["", ""], width: 440, height: 440, pad: 30, clip: true, title: "Rotating into principal-component coordinates" });
    const side = h("div", {}, L);
    let D = null, t = 0;
    const sl = slider(side, { label: "Rotate", min: 0, max: 1, step: 0.02, value: 0, format: v => Math.round(v * 100) + "%", onInput: v => { t = v; draw(); } });
    player(side, sl, { interval: 40 });
    const out = readout(side);
    function draw() {
      if (!D) return; P.clear();
      const [[a, b], [, c]] = D.C2, E = eigS2(a, b, c);
      const v1 = E.v[0];
      const phi = Math.atan2(v1[1], v1[0]), r = -phi * ease(t), cr = Math.cos(r), sr = Math.sin(r);
      const rot = p => [cr * p[0] - sr * p[1], sr * p[0] + cr * p[1]];
      const n = D.pair.length, mu = [0, 1].map(j => D.pair.reduce((s, p) => s + p[j], 0) / n);
      D.pair.forEach(p => P.dot(rot([p[0] - mu[0], p[1] - mu[1]]), { color: C.blue, r: 2.5, sw: 0, opacity: 0.55 }));
      const q1 = rot(v1), q2 = rot([-v1[1], v1[0]]), s1 = 2 * Math.sqrt(E.l[0]), s2 = 2 * Math.sqrt(E.l[1]);
      P.arrow([0, 0], [q1[0] * s1, q1[1] * s1], { color: C.orange, width: 3.5 });
      P.arrow([0, 0], [q2[0] * s2, q2[1] * s2], { color: C.green, width: 3.5 });
      tex(P, "PC1", q1[0] * s1, q1[1] * s1, { dx: 6, dy: -6, color: "#a87400", weight: 700 });
      tex(P, "PC2", q2[0] * s2, q2[1] * s2, { dx: 6, dy: -6, color: C.green, weight: 700 });
      const cs = Math.cos(r), sn = Math.sin(r);
      const R = [[cs, -sn], [sn, cs]], RC = [[R[0][0] * a + R[0][1] * b, R[0][0] * b + R[0][1] * c], [R[1][0] * a + R[1][1] * b, R[1][0] * b + R[1][1] * c]];
      const M = [[RC[0][0] * R[0][0] + RC[0][1] * R[0][1], RC[0][0] * R[1][0] + RC[0][1] * R[1][1]], [RC[1][0] * R[0][0] + RC[1][1] * R[0][1], RC[1][0] * R[1][0] + RC[1][1] * R[1][1]]];
      out.innerHTML = `<p>Covariance of the points as shown, (spikes/s)²:</p><p class="big">[[${fmt(M[0][0], 1)}, <b>${fmt(M[0][1], 1)}</b>], [<b>${fmt(M[1][0], 1)}</b>, ${fmt(M[1][1], 1)}]]</p>
        <p>${t > 0.98 ? `In score coordinates the covariance is diagonal: the scores are uncorrelated, with variances λ₁ = ${fmt(E.l[0], 1)} and λ₂ = ${fmt(E.l[1], 1)}. They add up to the same total, ${fmt(a + c, 1)}.` : "Rotating the cloud changes the variances and the off-diagonal covariance, but never their total. Rotate all the way: the arrows (each two standard deviations long) become the axes."}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 4. Scree plot and denoising by low-rank reconstruction. */
  IX.register("scree-denoise", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Scree plot: share of the variance per component");
    h("p", { class: "ix-panel-title" }, b2, "Neuron 5: recorded, true and reconstructed");
    const P = Plane(b1, { x: [0, 20.8], y: [0, 0.4], xtick: 5, ytick: 0.1, labels: ["component k", ""], width: 400, height: 320, pad: 40, frame: true, title: "Scree plot" });
    const Q = Plane(b2, { x: [0, 15], y: [-2, 26], xtick: 5, ytick: 5, labels: ["time (s)", "rate (spikes/s)"], width: 400, height: 320, pad: 40, clip: true, frame: true, title: "Reconstruction" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let D = null, k = 0;
    const sl = slider(ctl, { label: "Components kept k", min: 0, max: 30, step: 1, value: 0, onInput: v => { k = v; draw(); } });
    player(ctl, sl, { interval: 500 });
    const out = readout(root);
    function draw() {
      if (!D) return; P.clear(); Q.clear();
      D.evr.slice(0, 20).forEach((v, i) => el("rect", { x: P.X(i + 0.6), y: P.Y(v), width: P.X(1.4) - P.X(0.6), height: P.Y(0) - P.Y(v), fill: i < k ? C.blue : C.axis }, P.layer));
      const T = i => i * 0.05;
      Q.path(D.x5.map((v, i) => [T(i), v]), { color: C.axis, width: 1 });
      Q.path(D.c5.map((v, i) => [T(i), v]), { color: C.ink, width: 2.2 });
      Q.path(D.rec5[k].map((v, i) => [T(i), v]), { color: C.blue, width: 2, dash: "6 3" });
      const kept = D.evr.slice(0, k).reduce((s, v) => s + v, 0);
      out.innerHTML = `<table><tr><td>variance kept</td><td><b>${fmt(100 * kept, 1)}%</b></td></tr><tr><td>RMS error against the true rates</td><td><b>${fmt(D.err[k], 2)}</b> spikes/s (raw data: 3.01)</td></tr></table>
        <p>Grey: recorded. Black: the true, noise-free rate. Blue dashed: the rank-${k} reconstruction. ${k === 0 ? "With no components, every neuron is replaced by its mean." : k === 2 ? "Two components hold the whole shared signal: the reconstruction is closest to the truth (0.58 spikes/s), far closer than the recording itself." : k > 2 ? "Each extra component is mostly noise: the error creeps back up as the reconstruction re-admits it." : "One component is not enough: part of the signal is still missing."}</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 5. Independent noise adds a flat floor to the eigenvalues. */
  IX.register("noise-floor", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 10.8], y: [0, 32], xtick: 1, ytick: 5, labels: ["component", "eigenvalue (spikes/s)²"], width: 460, height: 340, pad: 44, frame: true, title: "Eigenvalues of signal plus noise" });
    const side = h("div", {}, L);
    let s2 = 2;
    const sl = slider(side, { label: "Noise variance σ²", min: 0, max: 10, step: 0.25, value: s2, format: v => fmt(v, 2), onInput: v => { s2 = v; draw(); } });
    player(side, sl, { bounce: true, interval: 80 });
    const out = readout(side);
    const sig = [20, 5, 0, 0, 0, 0, 0, 0, 0, 0];
    function draw() {
      P.clear();
      sig.forEach((v, i) => {
        const x0 = P.X(i + 0.6), w = P.X(1.4) - P.X(0.6);
        if (v > 0) el("rect", { x: x0, y: P.Y(v), width: w, height: P.Y(0) - P.Y(v), fill: C.blue }, P.layer);
        el("rect", { x: x0, y: P.Y(v + s2), width: w, height: P.Y(v) - P.Y(v + s2), fill: C.orange }, P.layer);
      });
      if (s2 > 0) P.line([0, s2], [10.8, s2], { color: "#a87400", width: 1.3, dash: "5 4" });
      const tot = 25 + 10 * s2;
      out.innerHTML = `<p>Eigenvalues: ${sig.map(v => fmt(v + s2, 2)).join(", ")}</p><table><tr><td>first two explain</td><td><b>${fmt(100 * (25 + 2 * s2) / tot, 0)}%</b></td></tr></table>
        <p>A 10-neuron signal with eigenvalues 20 and 5 (<span class="k-blue">blue</span>), plus independent noise of variance σ² in every neuron (<span class="k-orange">orange</span>). The noise lifts every eigenvalue by exactly σ², making a flat floor; the signal components stand out above it.</p>`;
    }
    draw();
  });

  /* 6. Units change raw PCA, not standardised PCA. */
  IX.register("scale", root => {
    const L = layout(root, true);
    const svg = el("svg", { viewBox: "0 0 460 320", class: "ix-svg", role: "img" }, L); el("title", {}, svg).textContent = "PC1 loadings";
    const g = el("g", {}, svg);
    const side = h("div", {}, L);
    let D = null, e = 0;
    const sl = slider(side, { label: "Speed units", min: -2, max: 0, step: 0.05, value: 0, format: v => v > -0.03 ? "cm/s" : v < -1.97 ? "m/s" : `× ${fmt(Math.pow(10, v), 3)}`, onInput: v => { e = v; draw(); } });
    player(side, sl, { bounce: true, interval: 60 });
    const out = readout(side);
    const names = ["rate", "pupil", "speed"];
    function pc1(M) { const r = jacobi(M); let v = r.v[0]; const i = v.reduce((b, x, j) => Math.abs(x) > Math.abs(v[b]) ? j : b, 0); if (v[i] < 0) v = v.map(x => -x); return { v, frac: r.l[0] / r.l.reduce((s, x) => s + x, 0) }; }
    function draw() {
      if (!D) return; while (g.firstChild) g.removeChild(g.firstChild);
      const f = Math.pow(10, e), E = [1, 1, f];
      const M = D.C3.map((r, i) => r.map((v, j) => v * E[i] * E[j]));
      const sd = [0, 1, 2].map(i => Math.sqrt(M[i][i])), R = M.map((r, i) => r.map((v, j) => v / (sd[i] * sd[j])));
      const raw = pc1(M), std = pc1(R), y0 = 270, sc = 220;
      const T = (s, x, y, a = {}) => { const t = el("text", { x, y, "text-anchor": a.anchor || "middle", "font-size": a.size || 12, fill: a.color || C.ink, "font-weight": a.weight || 400, "font-family": "inherit" }, g); t.textContent = s; };
      el("line", { x1: 30, x2: 450, y1: y0, y2: y0, stroke: C.axis, "stroke-width": 1.3 }, g);
      [0, 0.5, 1].forEach(v => { T(fmt(v, 1), 22, y0 - v * sc + 4, { anchor: "end", color: C.muted, size: 11 }); });
      names.forEach((n, i) => {
        const x = 60 + i * 135;
        [[raw.v[i], C.blue, 0], [std.v[i], C.orange, 1]].forEach(([v, col, k]) => {
          el("rect", { x: x + k * 52, y: v >= 0 ? y0 - v * sc : y0, width: 46, height: Math.max(1, Math.abs(v) * sc), fill: col }, g);
          T(fmt(v, 2), x + k * 52 + 23, (v >= 0 ? y0 - v * sc : y0) - 5, { size: 11, weight: 600 });
        });
        T(n, x + 49, y0 + 20, { color: C.muted });
      });
      el("rect", { x: 40, y: 8, width: 12, height: 12, fill: C.blue }, g); T("raw PCA", 58, 18, { anchor: "start", size: 12 });
      el("rect", { x: 140, y: 8, width: 12, height: 12, fill: C.orange }, g); T("standardised PCA", 158, 18, { anchor: "start", size: 12 });
      out.innerHTML = `<table><tr><td>speed variance</td><td>${fmt(M[2][2], 3)} (units²)</td></tr><tr><td><span class="k-blue">raw PC1</span></td><td>${fmt(100 * raw.frac, 0)}% of the variance</td></tr><tr><td><span class="k-orange">standardised PC1</span></td><td>${fmt(100 * std.frac, 0)}%</td></tr></table>
        <p>${e > -0.1 ? "With speed in cm/s, its variance dwarfs the others, so raw PC1 is almost pure speed." : e < -1.9 ? "With speed in m/s, its variance is tiny, and raw PC1 becomes almost pure firing rate." : "Changing the units of one variable swings the raw PC1 from one variable to another."} Standardised PCA does not move: it finds the shared arousal pattern in every unit.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 7. Motor cortex: how many components, raw or standardised, training or test. */
  IX.register("m1-scree", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 2.7], y: [0, 1.02], noXTicks: true, ytick: 0.2, labels: ["components k (log scale)", "cumulative variance"], width: 480, height: 360, pad: 46, frame: true, clip: true, title: "Cumulative explained variance" });
    [1, 10, 100, 437].forEach(k => P.text(String(k), Math.log10(k), 0, { dy: 18, anchor: "middle", color: C.muted, size: 12, layer: P.back }));
    const side = h("div", {}, L);
    let D = null, e = 1;
    const sl = slider(side, { label: "k", min: 0, max: 2.64, step: 0.02, value: e, format: v => String(Math.round(Math.pow(10, v))), onInput: v => { e = v; draw(); } });
    player(side, sl, { interval: 60 });
    const out = readout(side);
    function draw() {
      if (!D) return; P.clear();
      const k = Math.round(Math.pow(10, e));
      [0.5, 0.8, 0.9].forEach(v => P.line([0, v], [2.7, v], { color: C.axis, width: 0.8, dash: "2 4" }));
      P.path(D.cum_m.map((v, i) => [Math.log10(i + 1), v]), { color: C.blue, width: 2.4 });
      P.path(D.cum_z.map((v, i) => [Math.log10(i + 1), v]), { color: C.orange, width: 2.4 });
      D.kt.slice(0, -1).forEach((kk, i) => P.dot([Math.log10(kk), D.test[i]], { fill: "#fff", stroke: C.blue, sw: 2, r: 5 }));
      P.line([e, 0], [e, 1.02], { color: C.ink, width: 1.2 });
      P.dot([e, D.cum_m[k - 1]], { color: C.blue, r: 6 }); P.dot([e, D.cum_z[k - 1]], { color: C.orange, r: 6 });
      out.innerHTML = `<table><tr><td>k</td><td><b>${k}</b> of 437</td></tr><tr><td><span class="k-blue">raw, training trials</span></td><td>${fmt(100 * D.cum_m[k - 1], 1)}%</td></tr><tr><td><span class="k-orange">standardised, training</span></td><td>${fmt(100 * D.cum_z[k - 1], 1)}%</td></tr></table>
        <p>Open circles: raw PCA applied to the held-out test trials, which always keeps less than on the trials it was fitted to (66% against 74% at k = 10). There is no sharp elbow: one big component, then a long slow tail. Standardising gives every neuron equal weight, so far more components are needed (175 rather than 19 for 80%).</p>`;
    }
    data().then(d => { D = d; draw(); });
  });

  /* 8. Motor cortex: the components follow the movement. */
  IX.register("m1-time", root => {
    const cols = [C.blue, C.vermilion, C.muted], dash = ["", "7 4", "2 3"], names = ["turn one way (126)", "turn the other way (119)", "no turn (97)"];
    let D = null, pc = 0, ti = 49;
    buttons(root, [{ label: "PC1" }, { label: "PC2" }, { label: "PC3" }], (it, i) => { pc = i; draw(); }, { toggle: true, label: "Left panel" });
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    const ttl = h("p", { class: "ix-panel-title" }, b1, "");
    h("p", { class: "ix-panel-title" }, b2, "Average trajectories in the PC1–PC2 plane");
    const P = Plane(b1, { x: [-0.5, 2], y: [-160, 115], xtick: 0.5, ytick: 50, labels: ["time from stimulus (s)", ""], width: 400, height: 340, pad: 44, frame: true, clip: true, title: "Mean score over time" });
    const Q = Plane(b2, { x: [-160, 115], y: [-80, 60], xtick: 50, ytick: 20, labels: ["PC1 score", "PC2 score"], width: 400, height: 340, pad: 44, frame: true, clip: true, title: "PC1 against PC2" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const sl = slider(ctl, { label: "Time", min: 0, max: 49, step: 1, value: ti, format: v => (v * 0.05 - 0.5 >= 0 ? "+" : "") + fmt(v * 0.05 - 0.5, 2) + " s", onInput: v => { ti = v; draw(); } });
    player(ctl, sl, { interval: 110 });
    const out = readout(root);
    const T = i => i * 0.05 - 0.5;
    function draw() {
      if (!D) return; P.clear(); Q.clear();
      ttl.textContent = `PC${pc + 1}: mean score for each choice`;
      P.line([0, -160], [0, 115], { color: C.axis, width: 1, dash: "3 3" });
      P.line([T(ti), -160], [T(ti), 115], { color: C.ink, width: 1 });
      D.tc.forEach((c, j) => { P.path(c[pc].map((v, i) => [T(i), v]), { color: cols[j], width: 2.4, dash: dash[j] }); P.dot([T(ti), c[pc][ti]], { color: cols[j], r: 5 }); });
      D.tc.forEach((c, j) => { Q.path(c[0].slice(0, ti + 1).map((v, i) => [v, c[1][i]]), { color: cols[j], width: 2.4, dash: dash[j] }); Q.dot([c[0][ti], c[1][ti]], { color: cols[j], r: 6 }); Q.dot([c[0][10], c[1][10]], { fill: "#fff", stroke: cols[j], sw: 2, r: 4 }); });
      out.innerHTML = `<p>${names.map((n, j) => `<span style="color:${cols[j]};font-weight:700">${["——", "– –", "···"][j]} ${n}</span>`).join(" &nbsp; ")}</p>
        <p>${pc === 0 ? "PC1 drops sharply after the stimulus whenever the mouse turns, in either direction, and much less when it holds still: it tracks movement <i>speed</i> (correlation −0.80)." : pc === 1 ? "PC2 separates the two turn directions: it falls for one and rises for the other. It tracks movement <i>direction</i>." : "PC3 rises late in the trial after both turns."} PCA never saw the wheel. On the right, the open circles mark stimulus onset; press Play to watch the three average trajectories separate.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });
})();
