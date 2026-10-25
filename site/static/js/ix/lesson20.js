/* Lesson 20: Inference and Model Checking. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h } = window.IX;
  function uni(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = u => Math.sqrt(-2 * Math.log(u() || 1e-12)) * Math.cos(2 * Math.PI * u());
  const bar = (P, x0, x1, y, col, op = 0.85) => P.path([[x0, 0], [x1, 0], [x1, y], [x0, y]], { close: true, fill: col, fillOpacity: op, color: col, width: 1 });
  const erf = x => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); };
  const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
  const median = a => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n % 2 ? b[(n - 1) / 2] : 0.5 * (b[n / 2 - 1] + b[n / 2]); };
  function hist(P, vals, lo, w, col, op, norm) { const bins = {}; vals.forEach(v => { const b = Math.floor((v - lo) / w); bins[b] = (bins[b] || 0) + 1; }); Object.entries(bins).forEach(([b, c]) => bar(P, lo + b * w, lo + (+b + 1) * w, c / (norm || vals.length), col, op)); }

  /* 1. SD of the data against SE of the mean. */
  IX.register("sd-se", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "One experiment: the data");
    h("p", { class: "ix-panel-title" }, b2, "2000 experiments: their means");
    const P = Plane(b1, { x: [0, 60], y: [0, 0.35], xtick: 10, noYTicks: true, frame: true, labels: ["spike count", ""], width: 380, height: 280, pad: 36, clip: true, title: "Data" });
    const Q = Plane(b2, { x: [0, 60], y: [0, 0.6], xtick: 10, noYTicks: true, frame: true, labels: ["sample mean", ""], width: 380, height: 280, pad: 36, clip: true, title: "Sampling distribution" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const ns = [4, 9, 16, 36, 64, 144, 256];
    let i = 2;
    const sl = slider(ctl, { label: "Trials n", min: 0, max: ns.length - 1, step: 1, value: i, format: v => String(ns[v]), onInput: v => { i = v; draw(); } });
    player(ctl, sl, { interval: 700 });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      const n = ns[i], u = uni(n), x = []; for (let k = 0; k < n; k++) x.push(30 + 8 * gauss(u));
      hist(P, x, 0, 2, C.blue, 0.7);
      const ms = []; const u2 = uni(n + 500); for (let e = 0; e < 2000; e++) { let s = 0; for (let k = 0; k < n; k++) s += 30 + 8 * gauss(u2); ms.push(s / n); }
      hist(Q, ms, 0, 0.5, C.green, 0.7, 2000 * 0.5 * 4);
      [P, Q].forEach(R => R.line([30, 0], [30, 0.6], { color: C.ink, width: 1.2 }));
      out.innerHTML = `<table><tr><td><span class="k-blue">SD of the data</span> (σ = 8)</td><td><b>${fmt(sd(x), 2)}</b> spikes</td></tr><tr><td><span class="k-green">SD of the means = SE</span></td><td><b>${fmt(sd(ms), 2)}</b> (σ/√n = ${fmt(8 / Math.sqrt(n), 2)})</td></tr></table>
        <p>More trials do not make the data less spread out; they make the <b>estimate</b> less variable. Four times the trials halve the standard error. (Right-hand bars are scaled to fit.)</p>`;
    }
    draw();
  });

  /* 2. Confidence intervals and their coverage. */
  IX.register("coverage", root => {
    const kinds = [{ label: "Wald" }, { label: "Wilson" }];
    let kind = 0, p = 0.95, n = 20;
    buttons(root, kinds, (it, i) => { kind = i; draw(); }, { toggle: true, label: "Interval for a proportion" });
    const P = Plane(root, { x: [-1, 50], y: [0.4, 1.14], noXTicks: true, ytick: 0.1, frame: true, labels: ["50 repeated experiments", "95% interval for p"], width: 640, height: 300, pad: 48, clip: true, title: "Fifty intervals" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const sp = slider(ctl, { label: "True p", min: 0.5, max: 0.99, step: 0.01, value: p, format: v => fmt(v, 2), onInput: v => { p = v; draw(); } });
    slider(ctl, { label: "Trials n", min: 5, max: 200, step: 1, value: n, onInput: v => { n = v; draw(); } });
    player(ctl, sp, { bounce: true, interval: 150 });
    const out = readout(root);
    const z = 1.96;
    const ci = (k, nn) => { const ph = k / nn; if (kind === 0) { const s = Math.sqrt(ph * (1 - ph) / nn); return [ph - z * s, ph + z * s]; } const d = 1 + z * z / nn, c = (ph + z * z / (2 * nn)) / d, hw = z * Math.sqrt(ph * (1 - ph) / nn + z * z / (4 * nn * nn)) / d; return [c - hw, c + hw]; };
    function draw() {
      P.clear();
      P.line([-1, p], [50, p], { color: C.ink, width: 1.2 });
      const u = uni(2020);
      for (let e = 0; e < 50; e++) { let k = 0; for (let t = 0; t < n; t++) k += u() < p; const [lo, hi] = ci(k, n), hit = lo <= p && p <= hi; P.line([e, Math.max(lo, 0.4)], [e, Math.min(hi, 1.05)], { color: hit ? C.blue : C.vermilion, width: 2 }); P.dot([e, k / n], { color: hit ? C.blue : C.vermilion, r: 2.6, sw: 0 }); }
      const u2 = uni(77); let cov = 0; for (let e = 0; e < 4000; e++) { let k = 0; for (let t = 0; t < n; t++) k += u2() < p; const [lo, hi] = ci(k, n); cov += lo <= p && p <= hi; }
      out.innerHTML = `<p>Each experiment: n = ${n} trials, each a success with probability ${fmt(p, 2)}; its ${kinds[kind].label} interval is <span class="k-blue">blue</span> if it covers the true p (black line) and <span class="k-verm">vermilion</span> if it misses. Coverage over 4000 experiments: <b>${fmt(cov / 4000, 3)}</b> (nominal 0.95).</p><p>A 95% interval is a procedure that covers the truth in 95% of experiments, if its assumptions hold. The Wald interval collapses to zero width when every trial succeeds, which is common when p is near 1; the Wilson interval does not.</p>`;
    }
    draw();
  });

  /* 3. The bootstrap. */
  IX.register("bootstrap", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 40], y: [0, 0.4], xtick: 5, noYTicks: true, frame: true, labels: ["bootstrap estimate (ms)", ""], width: 480, height: 320, pad: 40, clip: true, title: "Bootstrap distribution" });
    const side = h("div", {}, L0);
    let stat = 0, B = 1000, seed = 1;
    buttons(side, [{ label: "mean" }, { label: "median" }], (it, i) => { stat = i; draw(); }, { toggle: true, label: "Statistic" });
    const sl = slider(side, { label: "Resamples B", min: 10, max: 4000, step: 10, value: B, onInput: v => { B = v; draw(); } });
    player(side, sl, { interval: 60, onStart: () => { B = 10; sl.set(10); draw(); } });
    buttons(side, [{ label: "New sample of 40" }], () => { seed++; draw(); });
    const out = readout(side);
    function draw() {
      P.clear();
      const u = uni(seed * 101), x = []; for (let i = 0; i < 40; i++) x.push(-20 * Math.log(u() || 1e-12));
      const f = stat ? median : mean, est = f(x), ub = uni(seed * 7 + stat), bs = [];
      for (let b = 0; b < B; b++) { const r = []; for (let i = 0; i < 40; i++) r.push(x[Math.floor(ub() * 40)]); bs.push(f(r)); }
      bs.sort((a, b) => a - b);
      hist(P, bs, 0, 0.5, stat ? C.green : C.sky, 0.75, B * 1.25);
      const lo = bs[Math.floor(0.025 * B)], hi = bs[Math.min(B - 1, Math.floor(0.975 * B))];
      [lo, hi].forEach(v => P.line([v, 0], [v, 0.4], { color: C.ink, dash: "5 4", width: 1.4 }));
      P.line([est, 0], [est, 0.4], { color: C.vermilion, width: 2 });
      out.innerHTML = `<table><tr><td>estimate from the sample (vermilion)</td><td><b>${fmt(est, 2)} ms</b></td></tr><tr><td>bootstrap SE (SD of the ${B} estimates)</td><td><b>${fmt(sd(bs), 2)} ms</b></td></tr>${stat ? "" : `<tr><td>analytic SE, s/√n</td><td>${fmt(sd(x) / Math.sqrt(40), 2)} ms</td></tr>`}<tr><td>95% percentile interval (dashed)</td><td>[${fmt(lo, 1)}, ${fmt(hi, 1)}] ms</td></tr></table>
        <p>One sample of 40 interspike intervals (true mean 20 ms, true median 13.9 ms). Resample it with replacement, recompute the statistic each time, and read the spread. ${stat ? "The median needs no formula; its bootstrap distribution is lumpy because only a few sample values can be the median." : "For the mean the bootstrap SE matches the formula."}</p>`;
    }
    draw();
  });

  /* 4. Four ways a correlation misleads. */
  IX.register("correlation", root => {
    const sets = [{ label: "linear" }, { label: "tuning curve" }, { label: "one outlier" }, { label: "shared stimulus" }];
    let si = 2;
    buttons(root, sets, (it, i) => { si = i; draw(); }, { toggle: true, label: "Data", active: 2 });
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [-3, 9], y: [-3, 12], xtick: 3, ytick: 3, frame: true, labels: ["x", "y"], width: 460, height: 340, pad: 40, clip: true, title: "Scatter" });
    const side = h("div", {}, L0);
    h("p", { class: "ix-hint" }, side, "In the outlier data, drag the black point.");
    const out = readout(side);
    let op = [8, 8];
    const u = uni(20), base = { linear: [], tuning: [], cloud: [], stim: [] };
    for (let i = 0; i < 150; i++) { const x = gauss(u); base.linear.push([1.5 + 1.2 * x, 4 + 1.2 * x + 1.4 * gauss(u)]); }
    for (let i = 0; i < 150; i++) { const x = -2.5 + u() * 11; base.tuning.push([x, 1 + 9 * Math.exp(-((x - 3) ** 2) / 6) + 0.8 * gauss(u)]); }
    for (let i = 0; i < 30; i++) base.cloud.push([gauss(u) * 0.8, gauss(u) * 0.8]);
    for (let i = 0; i < 200; i++) { const s = i < 100 ? 0 : 1; base.stim.push([0 + 4 * s + gauss(u), 1 + 5 * s + gauss(u), s]); }
    const pear = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0, syy = 0; pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }); return sxy / Math.sqrt(sxx * syy); };
    const ranks = a => { const idx = a.map((v, i) => i).sort((i, j) => a[i] - a[j]), r = new Array(a.length); idx.forEach((i, k) => (r[i] = k)); return r; };
    const spear = pts => { const rx = ranks(pts.map(p => p[0])), ry = ranks(pts.map(p => p[1])); return pear(rx.map((v, i) => [v, ry[i]])); };
    let hd = null;
    function draw() {
      P.clear();
      const key = ["linear", "tuning", "cloud", "stim"][si]; let pts = base[key].map(p => p.slice());
      if (si === 2) pts = pts.concat([op]);
      pts.forEach(p => P.dot(p, { color: si === 3 ? (p[2] ? C.orange : C.blue) : C.blue, r: 3.5, sw: 0 }));
      if (hd) hd.g && (hd.g.style.display = si === 2 ? "" : "none");
      let extra = "";
      if (si === 2) extra = `<tr><td>without the black point</td><td>r = ${fmt(pear(base.cloud), 2)}</td></tr>`;
      if (si === 3) extra = `<tr><td>within <span class="k-blue">stimulus off</span></td><td>r = ${fmt(pear(base.stim.filter(p => !p[2])), 2)}</td></tr><tr><td>within <span class="k-orange">stimulus on</span></td><td>r = ${fmt(pear(base.stim.filter(p => p[2])), 2)}</td></tr>`;
      const msg = ["Linear data: Pearson's r describes it well.", "A tuning curve: strong dependence, but symmetric, so r is near zero. Zero correlation is not independence.", "Thirty unrelated points and one outlier: a single point can create (or destroy) a correlation. Spearman's rank correlation is less sensitive.", "Two neurons that never interact but both respond to a stimulus: pooled, they look strongly correlated; within each condition they are not. Pooled correlation mixes signal and noise correlation."][si];
      out.innerHTML = `<table><tr><td>Pearson r (all points)</td><td><b>${fmt(pear(pts), 2)}</b></td></tr><tr><td>Spearman (ranks)</td><td>${fmt(spear(pts), 2)}</td></tr>${extra}</table><p>${msg}</p>`;
    }
    hd = P.handle(op, { color: C.ink, name: "outlier", snap: 0.1, onMove: q => { op = q; draw(); } });
    draw();
  });

  /* 5. ROC curves and AUC. */
  IX.register("roc", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Score distributions");
    h("p", { class: "ix-panel-title" }, b2, "ROC curve");
    const P = Plane(b1, { x: [-4, 7], y: [0, 0.5], xtick: 2, noYTicks: true, frame: true, labels: ["decoder score", ""], width: 380, height: 300, pad: 36, clip: true, title: "Scores" });
    const Q = Plane(b2, { x: [0, 1], y: [0, 1], xtick: 0.2, ytick: 0.2, frame: true, labels: ["false-alarm rate", "hit rate"], width: 380, height: 300, pad: 44, title: "ROC" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let d = 1.5, t = 0.75, pi = 0.3;
    slider(ctl, { label: "Separation d′", min: 0, max: 4, step: 0.05, value: d, format: v => fmt(v, 2), onInput: v => { d = v; draw(); } });
    const st = slider(ctl, { label: "Threshold", min: -3, max: 6, step: 0.05, value: t, format: v => fmt(v, 2), onInput: v => { t = v; draw(); } });
    player(ctl, st, { bounce: true, interval: 60 });
    const ctl2 = h("div", { class: "ix-controls-row" }, root);
    slider(ctl2, { label: "Base rate", min: 0.05, max: 0.95, step: 0.01, value: pi, format: v => fmt(v, 2), onInput: v => { pi = v; draw(); } });
    const out = readout(root);
    const pdf = (x, m) => Math.exp(-0.5 * (x - m) ** 2) / Math.sqrt(2 * Math.PI);
    function draw() {
      P.clear(); Q.clear();
      const a = [], b = []; for (let x = -4; x <= 7; x += 0.05) { a.push([x, pdf(x, 0)]); b.push([x, pdf(x, d)]); }
      P.path(a, { color: C.blue, width: 2.2 }); P.path(b, { color: C.orange, width: 2.2 });
      P.line([t, 0], [t, 0.48], { color: C.ink, dash: "5 4", width: 1.6 });
      const roc = []; for (let s = 7; s >= -4; s -= 0.05) roc.push([1 - Phi(s), 1 - Phi(s - d)]);
      Q.line([0, 0], [1, 1], { color: C.axis, dash: "4 4", width: 1 }); Q.path(roc, { color: C.green, width: 2.4 });
      const fa = 1 - Phi(t), hit = 1 - Phi(t - d); Q.dot([fa, hit], { color: C.ink, r: 6 });
      const auc = Phi(d / Math.SQRT2), acc = pi * hit + (1 - pi) * (1 - fa);
      out.innerHTML = `<table><tr><td>hit rate, false-alarm rate</td><td>${fmt(hit, 3)}, ${fmt(fa, 3)}</td></tr><tr><td>AUC = P(score present &gt; score absent)</td><td><b>${fmt(auc, 3)}</b></td></tr><tr><td>accuracy at this threshold and base rate</td><td><b>${fmt(acc, 3)}</b></td></tr></table>
        <p><span class="k-blue">Blue</span>: scores on absent trials; <span class="k-orange">orange</span>: present trials. Each threshold is one point on the ROC curve (green). The AUC depends only on how well the two distributions are separated: not on the threshold, not on the base rate, and not on any increasing transformation of the score. Accuracy depends on all three.</p>`;
    }
    draw();
  });
})();
