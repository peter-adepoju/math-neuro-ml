/* Lesson 19: Bayesian Inference and Decisions. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h } = window.IX;
  function uni(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const bar = (P, x0, x1, y, col, op = 0.85) => P.path([[x0, 0], [x1, 0], [x1, y], [x0, y]], { close: true, fill: col, fillOpacity: op, color: col, width: 1 });
  const lgam = x => { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgam(1 - x); x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i = 1; i < 9; i++) a += c[i] / (x + i); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); };
  const betaPdf = (a, b, p) => p <= 0 || p >= 1 ? 0 : Math.exp((a - 1) * Math.log(p) + (b - 1) * Math.log(1 - p) + lgam(a + b) - lgam(a) - lgam(b));
  function poissonDraw(u, lam) { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= u(); } while (p > L); return k - 1; }

  /* 1. Bayes' rule with repeated alarms. */
  IX.register("alarms", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 4], y: [0, 1], noXTicks: true, ytick: 0.2, frame: true, labels: ["", "P(spike | alarms so far)"], width: 480, height: 320, pad: 48, title: "Posterior after each alarm" });
    const side = h("div", {}, L0);
    let pi = 0.01, se = 0.9, sp = 0.9;
    const sl = slider(side, { label: "Base rate", min: 0.001, max: 0.3, step: 0.001, value: pi, format: v => fmt(v, 3), onInput: v => { pi = v; draw(); } });
    slider(side, { label: "Sensitivity", min: 0.5, max: 0.999, step: 0.001, value: se, format: v => fmt(v, 3), onInput: v => { se = v; draw(); } });
    slider(side, { label: "Specificity", min: 0.5, max: 0.999, step: 0.001, value: sp, format: v => fmt(v, 3), onInput: v => { sp = v; draw(); } });
    player(side, sl, { bounce: true, interval: 80 });
    const out = readout(side);
    function draw() {
      P.clear();
      const q = [pi]; for (let i = 0; i < 3; i++) { const a = q[i]; q.push(se * a / (se * a + (1 - sp) * (1 - a))); }
      q.forEach((v, i) => { bar(P, i + 0.2, i + 0.8, v, i ? C.blue : C.muted, i ? 0.85 : 0.5); P.text(fmt(v, 3), i + 0.5, v, { dy: -6, anchor: "middle", size: 12, color: C.ink }); P.text(i ? i + (i > 1 ? " alarms" : " alarm") : "prior", i + 0.5, 0, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back }); });
      const LR = se / (1 - sp);
      out.innerHTML = `<p>Each independent alarm multiplies the odds of a spike by the likelihood ratio sensitivity / (1 − specificity) = <b>${fmt(LR, 1)}</b>.</p><p>One alarm: ${fmt(se * pi, 4)} / ${fmt(se * pi + (1 - sp) * (1 - pi), 4)} = <b>${fmt(q[1], 3)}</b>. The denominator, P(alarm), is the law of total probability: it only normalises. With a rare signal, one alarm is weak evidence however good the detector looks.</p>`;
    }
    draw();
  });

  /* 2. Decoding orientation: the prior matters. */
  IX.register("decode-orientation", root => {
    const th = [0, 45, 90, 135], lik = [0.05, 0.25, 0.7, 0.25];
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 4], y: [0, 1], noXTicks: true, ytick: 0.2, frame: true, labels: ["stimulus orientation", "probability"], width: 480, height: 320, pad: 48, title: "Prior and posterior over orientation" });
    const side = h("div", {}, L0);
    let p90 = 0.25;
    const sl = slider(side, { label: "Prior of 90°", min: 0.01, max: 0.9, step: 0.01, value: p90, format: v => fmt(v, 2), onInput: v => { p90 = v; draw(); } });
    player(side, sl, { bounce: true, interval: 90 });
    const out = readout(side);
    function draw() {
      P.clear();
      const pr = th.map((t, i) => i === 2 ? p90 : (1 - p90) / 3), un = pr.map((p, i) => p * lik[i]), Z = un.reduce((a, b) => a + b), po = un.map(v => v / Z);
      th.forEach((t, i) => { bar(P, i + 0.12, i + 0.36, pr[i], C.muted, 0.5); bar(P, i + 0.38, i + 0.62, lik[i], C.orange, 0.8); bar(P, i + 0.64, i + 0.88, po[i], C.blue); P.text(t + "°", i + 0.5, 0, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back }); });
      const best = po.indexOf(Math.max(...po));
      out.innerHTML = `<p>Grey: prior P(θ). <span class="k-orange">Orange</span>: likelihood P(high | θ), the neuron's encoding. <span class="k-blue">Blue</span>: posterior P(θ | high).</p><table><tr><td>P(high | 90°)</td><td>0.70</td></tr><tr><td>P(90° | high)</td><td><b>${fmt(po[2], 3)}</b></td></tr><tr><td>most probable orientation</td><td><b>${th[best]}°</b></td></tr></table><p>The same response means different things under different stimulus statistics: a decoder must use the prior of the situation it is used in.</p>`;
    }
    draw();
  });

  /* 3. Sequential evidence: the sequential probability ratio test. */
  IX.register("sprt", root => {
    const l1 = 0.6, l0 = 0.4, a1 = Math.log(l1 / l0), b1 = l1 - l0;
    const grid = h("div", { class: "ix-two" }, root);
    const b1d = h("div", {}, grid), b2d = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1d, "Accumulated log-likelihood ratio, eight trials");
    h("p", { class: "ix-panel-title" }, b2d, "Speed against accuracy");
    const P = Plane(b1d, { x: [0, 3000], y: [-8, 8], xtick: 1000, ytick: 2, frame: true, labels: ["time (ms)", ""], width: 380, height: 320, pad: 40, clip: true, title: "Evidence" });
    const Q = Plane(b2d, { x: [0, 4000], y: [0.7, 1.01], xtick: 1000, ytick: 0.05, frame: true, labels: ["mean decision time (ms)", "accuracy"], width: 380, height: 320, pad: 48, clip: true, title: "Trade-off" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let a = 2.2;
    const sl = slider(ctl, { label: "Bound a", min: 0.5, max: 7, step: 0.1, value: a, format: v => fmt(v, 1), onInput: v => { a = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 250 });
    const out = readout(root);
    function run(u, bound, keep) { let s = 0, t = 0; const path = keep ? [[0, 0]] : null; while (Math.abs(s) < bound && t < 2000) { const x = poissonDraw(u, l1); s += x * a1 - b1; t++; if (keep) path.push([t * 20, s]); } return { s, t, path }; }
    const curve = []; { for (let b = 0.5; b <= 7.01; b += 0.5) { const u = uni(Math.round(b * 10)); let ok = 0, T = 0; for (let i = 0; i < 1500; i++) { const r = run(u, b, false); ok += r.s > 0; T += r.t * 20; } curve.push([T / 1500, ok / 1500, b]); } }
    function draw() {
      P.clear(); Q.clear();
      [a, -a].forEach(y => P.line([0, y], [3000, y], { color: C.ink, dash: "6 4", width: 1.4 }));
      P.line([0, 0], [3000, 0], { color: C.axis, width: 1 });
      const u = uni(7);
      for (let i = 0; i < 8; i++) { const r = run(u, a, true); P.path(r.path, { color: r.s > 0 ? C.green : C.vermilion, width: 1.5 }); }
      const u2 = uni(31); let ok = 0, T = 0; for (let i = 0; i < 1500; i++) { const r = run(u2, a, false); ok += r.s > 0; T += r.t * 20; }
      Q.path(curve.map(c => [c[0], c[1]]), { color: C.blue, width: 2 }); curve.forEach(c => Q.dot([c[0], c[1]], { color: C.blue, r: 3.5, sw: 0 }));
      Q.dot([T / 1500, ok / 1500], { color: C.ink, r: 7 });
      const post = 1 / (1 + Math.exp(-a));
      out.innerHTML = `<table><tr><td>posterior at the bound, sigmoid(a)</td><td>${fmt(post, 3)}</td></tr><tr><td>accuracy (1500 simulated trials)</td><td><b>${fmt(ok / 1500, 3)}</b></td></tr><tr><td>mean decision time</td><td><b>${fmt(T / 1500, 0)} ms</b></td></tr></table>
        <p>A neuron fires at 30 spikes/s when the stimulus is present and 20 when absent; counts in 20 ms bins. Starting from even odds, each bin adds log LR = x log(30/20) − (0.6 − 0.4). The run stops when the sum reaches ±a: <span class="k-green">green</span> trials end correctly ("present"), <span class="k-verm">vermilion</span> trials wrongly. A higher bound buys accuracy with time.</p>`;
    }
    draw();
  });

  /* 4. Beta–binomial posterior and its summaries. */
  IX.register("beta-posterior", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 1], y: [0, 10], xtick: 0.2, ytick: 2, frame: true, labels: ["success probability p", "density"], width: 480, height: 330, pad: 48, clip: true, title: "Prior, likelihood and posterior" });
    const side = h("div", {}, L0);
    const priors = [{ label: "flat", a: 1, b: 1 }, { label: "weak", a: 2, b: 2 }, { label: "strong", a: 20, b: 20 }];
    let pr = priors[0], n = 4, k = 3;
    buttons(side, priors, it => { pr = it; draw(); }, { toggle: true, label: "Prior" });
    const sn = slider(side, { label: "Trials n", min: 0, max: 120, step: 1, value: n, onInput: v => { n = v; if (k > n) { k = n; sk.set(k); } draw(); } });
    const sk = slider(side, { label: "Successes k", min: 0, max: 120, step: 1, value: k, onInput: v => { k = Math.min(v, n); draw(); } });
    player(side, sn, { interval: 120, onStart: () => { n = 0; sn.set(0); draw(); } });
    const out = readout(side);
    function draw() {
      P.clear();
      const kk = Math.min(k, n), A = pr.a + kk, B = pr.b + n - kk, grid = [], cdf = []; let acc = 0, peak = 0;
      for (let i = 0; i <= 1000; i++) { const p = i / 1000, d = betaPdf(A, B, p); grid.push([p, d]); peak = Math.max(peak, d); }
      for (let i = 1; i <= 1000; i++) { acc += 0.0005 * (grid[i][1] + grid[i - 1][1]); cdf.push([grid[i][0], acc]); }
      const q = t => cdf.find(c => c[1] >= t * acc)[0];
      const lk = []; let lmax = 0; for (let i = 1; i < 1000; i++) { const p = i / 1000, v = Math.exp(kk * Math.log(p) + (n - kk) * Math.log(1 - p)); lk.push([p, v]); lmax = Math.max(lmax, v); }
      const sc = Math.min(peak, 10) * 0.9 / lmax;
      P.path(grid.map(([p]) => [p, betaPdf(pr.a, pr.b, p)]), { color: C.muted, width: 1.6, dash: "5 4" });
      if (n > 0) P.path(lk.map(([p, v]) => [p, v * sc]), { color: C.orange, width: 1.8 });
      P.path(grid, { color: C.blue, width: 2.6 });
      const lo = q(0.025), hi = q(0.975), mean = A / (A + B), med = q(0.5), map = A > 1 && B > 1 ? (A - 1) / (A + B - 2) : (A >= B ? 1 : 0);
      P.line([lo, 0.15], [hi, 0.15], { color: C.ink, width: 4 });
      const gt = 1 - cdf.find(c => c[0] >= 0.5)[1] / acc;
      out.innerHTML = `<table><tr><td>posterior</td><td>Beta(${A}, ${B})</td></tr><tr><td>MLE k/n</td><td>${n ? fmt(kk / n, 3) : "undefined"}</td></tr><tr><td>MAP / mean / median</td><td>${fmt(map, 3)} / <b>${fmt(mean, 3)}</b> / ${fmt(med, 3)}</td></tr><tr><td>95% credible interval (black bar)</td><td><b>[${fmt(lo, 3)}, ${fmt(hi, 3)}]</b></td></tr><tr><td>P(p &gt; 0.5 | data)</td><td>${fmt(gt, 4)}</td></tr></table>
        <p>Grey dashed: the prior, Beta(${pr.a}, ${pr.b}). <span class="k-orange">Orange</span>: the likelihood, rescaled to fit. <span class="k-blue">Blue</span>: the posterior, Beta(α + k, β + n − k). With few trials the prior matters; press Play to add trials at the same proportion and watch the data take over.</p>`;
    }
    draw();
    /* Play keeps the success proportion near 3/4 as n grows */
    sn.input.addEventListener("input", () => { if (document.activeElement !== sn.input) { k = Math.round(0.75 * n); sk.set(k); draw(); } });
  });

  /* 5. Costs set the decision threshold. */
  IX.register("cost-threshold", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 1], y: [0, 5], xtick: 0.2, ytick: 1, frame: true, labels: ["posterior q = P(present | data)", "expected loss"], width: 480, height: 320, pad: 48, clip: true, title: "Expected loss of each action" });
    const side = h("div", {}, L0);
    let cm = 4, cf = 1;
    const sl = slider(side, { label: "Cost of a miss", min: 0.2, max: 5, step: 0.1, value: cm, format: v => fmt(v, 1), onInput: v => { cm = v; draw(); } });
    slider(side, { label: "Cost of a false alarm", min: 0.2, max: 5, step: 0.1, value: cf, format: v => fmt(v, 1), onInput: v => { cf = v; draw(); } });
    player(side, sl, { bounce: true, interval: 90 });
    const out = readout(side);
    function draw() {
      P.clear();
      const t = cf / (cf + cm);
      P.line([0, cf], [1, 0], { color: C.vermilion, width: 2.4 }); P.line([0, 0], [1, cm], { color: C.blue, width: 2.4 });
      P.line([t, 0], [t, 5], { color: C.ink, dash: "6 4", width: 1.4 });
      P.text('act "present"', 0.05, cf * 0.95, { dy: -8, anchor: "start", size: 12, color: C.vermilion, halo: true }); P.text('act "absent"', 0.62, cm * 0.62, { dx: 8, dy: 12, anchor: "start", size: 12, color: C.blue, halo: true });
      out.innerHTML = `<p><span class="k-verm">Acting "present"</span> costs (1 − q) c_FA on average; <span class="k-blue">acting "absent"</span> costs q c_miss. The Bayes decision takes whichever line is lower.</p><table><tr><td>act "present" when q &gt;</td><td><b>c_FA / (c_FA + c_miss) = ${fmt(t, 3)}</b></td></tr></table><p>Expensive misses lower the threshold; expensive false alarms raise it. A threshold of 0.5 is right only when the costs are equal.</p>`;
    }
    draw();
  });

  /* 6. Calibration: reliability diagram for a forecaster with a temperature. */
  IX.register("calibration", root => {
    const u = uni(19), N = 4000, z = [], y = [];
    for (let i = 0; i < N; i++) { const lo = (u() * 2 - 1) * 2.5 + (u() * 2 - 1) * 0.5; z.push(lo); y.push(u() < 1 / (1 + Math.exp(-lo)) ? 1 : 0); }
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 1], y: [0, 1], xtick: 0.2, ytick: 0.2, frame: true, labels: ["stated probability", "observed frequency"], width: 400, height: 380, pad: 48, title: "Reliability diagram" });
    const side = h("div", {}, L0);
    let lt = 0;
    const sl = slider(side, { label: "Log-odds multiplier", min: -1, max: 1, step: 0.05, value: lt, format: v => fmt(Math.pow(4, v), 2), onInput: v => { lt = v; draw(); } });
    player(side, sl, { bounce: true, interval: 120 });
    const out = readout(side);
    function draw() {
      P.clear();
      const m = Math.pow(4, lt), q = z.map(v => 1 / (1 + Math.exp(-m * v)));
      P.line([0, 0], [1, 1], { color: C.muted, dash: "4 4", width: 1.4 });
      const pts = []; for (let b = 0; b < 10; b++) { const idx = q.map((v, i) => i).filter(i => q[i] >= b / 10 && q[i] < (b + 1) / 10); if (idx.length > 20) pts.push([idx.reduce((a, i) => a + q[i], 0) / idx.length, idx.reduce((a, i) => a + y[i], 0) / idx.length]); }
      P.path(pts, { color: C.blue, width: 2.2 }); pts.forEach(p => P.dot(p, { color: C.blue, r: 5 }));
      let ll = 0, br = 0, acc = 0; q.forEach((v, i) => { const c = Math.min(Math.max(v, 1e-12), 1 - 1e-12); ll -= y[i] ? Math.log(c) : Math.log(1 - c); br += (v - y[i]) ** 2; acc += (v > 0.5) === (y[i] === 1); });
      out.innerHTML = `<table><tr><td>accuracy at threshold 0.5</td><td>${fmt(acc / N, 3)}</td></tr><tr><td>log loss</td><td><b>${fmt(ll / N, 3)}</b></td></tr><tr><td>Brier score</td><td>${fmt(br / N, 3)}</td></tr></table>
        <p>${N} events, each forecast from its true log-odds multiplied by the slider value. At 1 the forecaster is calibrated: points lie on the diagonal. Above 1 it is overconfident (an S-shaped curve flatter than the diagonal); below 1, underconfident. Accuracy never changes, because the order of the forecasts never changes; log loss and the Brier score do.</p>`;
    }
    draw();
  });
})();
