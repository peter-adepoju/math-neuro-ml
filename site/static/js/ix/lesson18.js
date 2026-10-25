/* Lesson 18: Distributions and Likelihood. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h } = window.IX;
  function uni(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const bar = (P, x0, x1, y, col, op = 0.85) => P.path([[x0, 0], [x1, 0], [x1, y], [x0, y]], { close: true, fill: col, fillOpacity: op, color: col, width: 1 });
  const lgam = x => { /* Lanczos log-gamma */ const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgam(1 - x); x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i = 1; i < 9; i++) a += c[i] / (x + i); return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); };
  const binom = (n, p, k) => k < 0 || k > n ? 0 : Math.exp(lgam(n + 1) - lgam(k + 1) - lgam(n - k + 1) + (k ? k * Math.log(p) : 0) + (n - k ? (n - k) * Math.log(1 - p) : 0));
  const pois = (l, k) => Math.exp(k * Math.log(l) - l - lgam(k + 1));
  const erf = x => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
  const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
  function poissonDraw(u, lam) { if (lam > 30) { const z = Math.sqrt(-2 * Math.log(u() || 1e-12)) * Math.cos(2 * Math.PI * u()); return Math.max(0, Math.round(lam + Math.sqrt(lam) * z)); } const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= u(); } while (p > L); return k - 1; }
  function gammaDraw(u, k) { if (k < 1) return gammaDraw(u, k + 1) * Math.pow(u() || 1e-12, 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = Math.sqrt(-2 * Math.log(u() || 1e-12)) * Math.cos(2 * Math.PI * u()); v = 1 + c * x; } while (v <= 0); v = v * v * v; const w = u(); if (Math.log(w || 1e-12) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v; } }

  /* 1. Binomial, and what happens when p varies. */
  IX.register("binomial", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [-0.6, 10.6], y: [0, 0.45], xtick: 1, ytick: 0.1, frame: true, labels: ["vesicles released k", "probability"], width: 480, height: 320, pad: 48, title: "Quantal release" });
    const side = h("div", {}, L0);
    let p = 0.3, s = 0;
    const sp = slider(side, { label: "Release probability p", min: 0.05, max: 0.95, step: 0.01, value: p, format: v => fmt(v, 2), onInput: v => { p = v; draw(); } });
    slider(side, { label: "Spread of p", min: 0, max: 1, step: 0.02, value: s, format: v => fmt(v, 2), onInput: v => { s = v; draw(); } });
    player(side, sp, { bounce: true, interval: 120 });
    const out = readout(side);
    function draw() {
      P.clear();
      const n = 10, fixed = [], mix = new Array(n + 1).fill(0);
      for (let k = 0; k <= n; k++) fixed.push(binom(n, p, k));
      /* p ~ Beta with mean p; concentration falls as the spread rises */
      const conc = s > 0 ? Math.max(0.3, 1 / (s * s) - 1) : Infinity; let Z = 0;
      if (isFinite(conc)) { const a = p * conc, b = (1 - p) * conc; for (let i = 1; i < 400; i++) { const q = i / 400, w = Math.exp((a - 1) * Math.log(q) + (b - 1) * Math.log(1 - q)); Z += w; for (let k = 0; k <= n; k++) mix[k] += w * binom(n, q, k); } for (let k = 0; k <= n; k++) mix[k] /= Z; } else fixed.forEach((v, k) => (mix[k] = v));
      for (let k = 0; k <= n; k++) { bar(P, k - 0.4, k, fixed[k], C.blue); bar(P, k, k + 0.4, mix[k], C.vermilion, 0.8); }
      const m = mix.reduce((a, v, k) => a + k * v, 0), V = mix.reduce((a, v, k) => a + (k - m) ** 2 * v, 0);
      out.innerHTML = `<table><tr><td><span class="k-blue">fixed p</span>: mean np, variance np(1 − p)</td><td>${fmt(n * p, 2)}, <b>${fmt(n * p * (1 - p), 2)}</b></td></tr><tr><td><span class="k-verm">p varies</span>: mean, variance</td><td>${fmt(m, 2)}, <b>${fmt(V, 2)}</b></td></tr></table>
        <p>Ten release sites, each releasing a vesicle with probability p, independently: Binomial(10, p). If p itself changes from one action potential to the next (with the same average), the mean stays put but the variance grows: the law of total variance adds Var(E[K | p]).</p>`;
    }
    draw();
  });

  /* 2. Poisson as the limit of many rare chances. */
  IX.register("poisson-limit", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [-0.6, 16.6], y: [0, 0.45], xtick: 2, ytick: 0.1, frame: true, labels: ["spike count k", "probability"], width: 480, height: 320, pad: 48, title: "Binomial against Poisson" });
    const side = h("div", {}, L0);
    const ns = [5, 10, 20, 50, 200, 1000];
    let ni = 0, lam = 4;
    const sl = slider(side, { label: "Bins n", min: 0, max: ns.length - 1, step: 1, value: ni, format: v => String(ns[v]), onInput: v => { ni = v; draw(); } });
    slider(side, { label: "Expected count λ", min: 0.5, max: 4.5, step: 0.1, value: lam, format: v => fmt(v, 1), onInput: v => { lam = v; draw(); } });
    player(side, sl, { interval: 700 });
    const out = readout(side);
    function draw() {
      P.clear();
      const n = ns[ni], p = lam / n; let tv = 0;
      for (let k = 0; k <= 16; k++) { const b = binom(n, p, k), q = pois(lam, k); tv += Math.abs(b - q); bar(P, k - 0.4, k, b, C.orange); bar(P, k, k + 0.4, q, C.blue); }
      out.innerHTML = `<table><tr><td>chance per bin, p = λ/n</td><td>${fmt(p, 4)}</td></tr><tr><td><span class="k-orange">binomial</span> variance np(1 − p)</td><td>${fmt(n * p * (1 - p), 3)}</td></tr><tr><td><span class="k-blue">Poisson</span> variance λ</td><td>${fmt(lam, 3)}</td></tr><tr><td>total variation distance</td><td><b>${fmt(tv / 2, 4)}</b></td></tr></table>
        <p>Split the window into n bins, each with a small chance of a spike. As n grows with λ = np fixed, Binomial(n, λ/n) approaches Poisson(λ), whose mean equals its variance.</p>`;
    }
    draw();
  });

  /* 3. Gaussian probabilities by standardisation. */
  IX.register("gaussian", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [-85, -45], y: [0, 0.2], xtick: 5, ytick: 0.05, frame: true, labels: ["membrane potential V (mV)", "density (per mV)"], width: 480, height: 320, pad: 48, clip: true, title: "Gaussian membrane potential" });
    const side = h("div", {}, L0);
    let mu = -65, sg = 4, th = -55;
    slider(side, { label: "Mean μ (mV)", min: -75, max: -55, step: 0.5, value: mu, format: v => fmt(v, 1), onInput: v => { mu = v; draw(); } });
    const ss = slider(side, { label: "SD σ (mV)", min: 1, max: 10, step: 0.1, value: sg, format: v => fmt(v, 1), onInput: v => { sg = v; draw(); } });
    slider(side, { label: "Threshold (mV)", min: -75, max: -45, step: 0.5, value: th, format: v => fmt(v, 1), onInput: v => { th = v; draw(); } });
    player(side, ss, { bounce: true, interval: 100 });
    const out = readout(side);
    function draw() {
      P.clear();
      const f = x => Math.exp(-0.5 * ((x - mu) / sg) ** 2) / (sg * Math.sqrt(2 * Math.PI));
      const area = [[th, 0]]; for (let x = th; x <= -45; x += 0.1) area.push([x, f(x)]); area.push([-45, 0]);
      P.path(area, { close: true, fill: C.vermilion, fillOpacity: 0.35, color: "none", width: 0 });
      const pts = []; for (let x = -85; x <= -45; x += 0.1) pts.push([x, f(x)]);
      P.path(pts, { color: C.blue, width: 2.4 });
      [-1.96, 1.96].forEach(z => P.line([mu + z * sg, 0], [mu + z * sg, f(mu + z * sg)], { color: C.ink, dash: "4 4", width: 1.2 }));
      P.line([th, 0], [th, 0.19], { color: C.vermilion, width: 2 });
      const z = (th - mu) / sg;
      out.innerHTML = `<table><tr><td>z = (threshold − μ)/σ</td><td>${fmt(z, 2)}</td></tr><tr><td><span class="k-verm">P(V &gt; threshold)</span> = 1 − Φ(z)</td><td><b>${fmt(1 - Phi(z), 4)}</b></td></tr><tr><td>95% of values in (dashed)</td><td>[${fmt(mu - 1.96 * sg, 1)}, ${fmt(mu + 1.96 * sg, 1)}] mV</td></tr></table>
        <p>Every Gaussian probability is a standard-normal one after z = (x − μ)/σ. Within 1, 1.96 and 3 SDs lie 68.3%, 95.0% and 99.7% of the probability.</p>`;
    }
    draw();
  });

  /* 4. The central limit theorem for sums of exponential intervals. */
  IX.register("clt", root => {
    const P = Plane(root, { x: [-4, 5], y: [0, 0.8], xtick: 1, ytick: 0.2, frame: true, labels: ["standardised sum (S − nμ)/(σ√n)", "density"], width: 640, height: 300, pad: 48, clip: true, title: "Sums of exponential intervals" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const ns = [1, 2, 3, 5, 10, 20, 50, 100];
    let i = 0;
    const sl = slider(ctl, { label: "Intervals summed n", min: 0, max: ns.length - 1, step: 1, value: i, format: v => String(ns[v]), onInput: v => { i = v; draw(); } });
    player(ctl, sl, { interval: 700 });
    const out = readout(root);
    const cache = {};
    function sim(n) { if (cache[n]) return cache[n]; const u = uni(n + 18), z = []; for (let s = 0; s < 6000; s++) { let S = 0; for (let j = 0; j < n; j++) S -= Math.log(u() || 1e-12); z.push((S - n) / Math.sqrt(n)); } const m = z.reduce((a, b) => a + b) / z.length, sd = Math.sqrt(z.reduce((a, b) => a + (b - m) ** 2, 0) / z.length), sk = z.reduce((a, b) => a + ((b - m) / sd) ** 3, 0) / z.length; return (cache[n] = { z, sk }); }
    function draw() {
      P.clear();
      const n = ns[i], s = sim(n), w = 0.2, bins = {};
      s.z.forEach(v => { const b = Math.floor(v / w); bins[b] = (bins[b] || 0) + 1; });
      Object.entries(bins).forEach(([b, c]) => bar(P, b * w, (+b + 1) * w, c / (s.z.length * w), C.sky, 0.7));
      const pts = []; for (let x = -4; x <= 5; x += 0.05) pts.push([x, Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)]);
      P.path(pts, { color: C.vermilion, width: 2.4 });
      out.innerHTML = `<p>6000 simulated sums of <b>${n}</b> exponential intervals, standardised (sky blue), against the standard normal density (vermilion). Skewness <b>${fmt(s.sk, 2)}</b> (theory 2/√n = ${fmt(2 / Math.sqrt(n), 2)}). The sum of many independent terms with finite variance looks Gaussian, whatever the shape of each term.</p>`;
    }
    draw();
  });

  /* 5. Likelihood: more data, a sharper peak. */
  IX.register("likelihood", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 1], y: [-6, 0.4], xtick: 0.2, ytick: 1, frame: true, labels: ["success probability p", "log-likelihood − maximum"], width: 480, height: 330, pad: 48, clip: true, title: "Binomial log-likelihood" });
    const side = h("div", {}, L0);
    const ns = [10, 100, 1000];
    let ni = 0, ph = 0.7;
    buttons(side, ns.map(n => ({ label: String(n) })), (it, i) => { ni = i; draw(); }, { toggle: true, label: "Trials n" });
    const sl = slider(side, { label: "Proportion k/n", min: 0.1, max: 0.9, step: 0.1, value: ph, format: v => fmt(v, 1), onInput: v => { ph = v; draw(); } });
    player(side, sl, { bounce: true, interval: 500 });
    const out = readout(side);
    function draw() {
      P.clear();
      const n = ns[ni], k = Math.round(ph * n), p0 = k / n, ell = p => k * Math.log(p) + (n - k) * Math.log(1 - p), m = ell(p0), se = Math.sqrt(p0 * (1 - p0) / n);
      const pts = [], q = []; for (let p = 0.002; p < 0.999; p += 0.002) { pts.push([p, ell(p) - m]); q.push([p, -0.5 * ((p - p0) / se) ** 2]); }
      P.path(q, { color: C.vermilion, width: 1.6, dash: "6 4" }); P.path(pts, { color: C.blue, width: 2.4 });
      P.line([p0 - se, -0.5], [p0 + se, -0.5], { color: C.ink, width: 2 }); P.dot([p0, 0], { color: C.ink, r: 5 });
      P.text("± 1 SE", p0 - se, -0.5, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.ink, halo: true });
      out.innerHTML = `<table><tr><td>data</td><td>${k} of ${n}</td></tr><tr><td>MLE p̂ = k/n</td><td><b>${fmt(p0, 2)}</b></td></tr><tr><td>SE = √(p̂(1 − p̂)/n)</td><td><b>${fmt(se, 3)}</b></td></tr></table>
        <p><span class="k-blue">Blue</span>: the log-likelihood, shifted so its peak is 0. <span class="k-verm">Vermilion dashed</span>: its quadratic approximation at the peak, whose width (where it has fallen by ½) is one standard error. Ten times the data makes the peak √10 times narrower. The likelihood is a function of p, not a probability distribution over p.</p>`;
    }
    draw();
  });

  /* 6. Checking a fitted Poisson against simulations of itself. */
  IX.register("poisson-check", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [-0.6, 16.6], y: [0, 0.3], xtick: 2, ytick: 0.05, frame: true, labels: ["count", "proportion of trials"], width: 480, height: 320, pad: 48, clip: true, title: "Observed counts and the fitted Poisson" });
    const side = h("div", {}, L0);
    let od = 0;
    const sl = slider(side, { label: "Rate variability", min: 0, max: 1, step: 0.05, value: od, format: v => fmt(v, 2), onInput: v => { od = v; draw(); } });
    player(side, sl, { bounce: true, interval: 300 });
    const out = readout(side);
    function draw() {
      P.clear();
      const u = uni(2400 + Math.round(od * 100)), x = [];
      for (let i = 0; i < 200; i++) { let lam = 4; if (od > 0) { const k = 1 / (od * od * 0.75); lam = gammaDraw(u, k) * 4 / k; } x.push(poissonDraw(u, lam)); }
      const m = x.reduce((a, b) => a + b) / 200, v = x.reduce((a, b) => a + (b - m) ** 2, 0) / 199, p0 = x.filter(c => c === 0).length / 200;
      const sims = []; const us = uni(99); for (let s = 0; s < 300; s++) { const y = []; for (let i = 0; i < 200; i++) y.push(poissonDraw(us, m)); const my = y.reduce((a, b) => a + b) / 200; sims.push(y.reduce((a, b) => a + (b - my) ** 2, 0) / 199); }
      sims.sort((a, b) => a - b); const lo = sims[7], hi = sims[292];
      for (let k = 0; k <= 16; k++) bar(P, k - 0.4, k + 0.4, x.filter(c => c === k).length / 200, C.orange, 0.6);
      const pts = []; for (let k = 0; k <= 16; k++) pts.push([k, pois(m, k)]); P.path(pts, { color: C.ink, width: 1.6 }); pts.forEach(p => P.dot(p, { color: C.ink, r: 3, sw: 0 }));
      const ok = v >= lo && v <= hi;
      out.innerHTML = `<table><tr><td>fitted λ̂ = mean</td><td>${fmt(m, 2)}</td></tr><tr><td>observed variance</td><td><b>${fmt(v, 2)}</b></td></tr><tr><td>fitted Poisson, 95% of simulated variances</td><td>[${fmt(lo, 2)}, ${fmt(hi, 2)}]</td></tr><tr><td>observed P(0) vs Poisson e^(−λ̂)</td><td>${fmt(p0, 3)} vs ${fmt(Math.exp(-m), 3)}</td></tr></table>
        <p>200 trials of counts with mean 4 (orange), and the fitted Poisson (black). ${ok ? "The variance lies inside the range the fitted model produces: no evidence against it." : "<b>The variance is outside the range the fitted model produces</b>: the mean fits, the variability does not."} Maximum likelihood always returns a best fit; only a check like this says whether it fits.</p>`;
    }
    draw();
  });

  /* 7. The mouse's psychometric function (real counts). */
  IX.register("psychometric", root => {
    const c = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1], n = [21, 20, 37, 24, 76, 24, 28, 24, 22], k = [0, 0, 1, 4, 47, 22, 23, 22, 22];
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [-1.15, 1.15], y: [-0.1, 1.15], xtick: 0.25, ytick: 0.2, frame: true, labels: ["contrast difference right − left", "P(right | turned)"], width: 480, height: 340, pad: 48, clip: true, title: "Psychometric function" });
    const side = h("div", {}, L0);
    let model = 0, sel = 4;
    buttons(side, [{ label: "one p per level" }, { label: "one p for all" }], (it, i) => { model = i; draw(); }, { toggle: true, label: "Model" });
    const sl = slider(side, { label: "Level", min: 0, max: 8, step: 1, value: sel, format: v => (c[v] > 0 ? "+" : "") + c[v], onInput: v => { sel = v; draw(); } });
    player(side, sl, { bounce: true, interval: 600 });
    const out = readout(side);
    const ll = (kk, nn, p) => (kk ? kk * Math.log(p) : 0) + (nn - kk ? (nn - kk) * Math.log(1 - p) : 0);
    function draw() {
      P.clear();
      const pAll = k.reduce((a, b) => a + b) / n.reduce((a, b) => a + b);
      if (model === 1) P.line([-1.15, pAll], [1.15, pAll], { color: C.vermilion, dash: "6 4", width: 2 });
      c.forEach((x, i) => { const p = k[i] / n[i], se = Math.sqrt(p * (1 - p) / n[i]); P.line([x, Math.max(-0.1, p - 1.96 * se)], [x, Math.min(1.15, p + 1.96 * se)], { color: C.blue, width: 2 }); P.dot([x, p], { color: C.blue, r: i === sel ? 8 : 5 }); P.text("n=" + n[i], x, p, { dx: x > 0.6 ? -8 : 8, dy: 14, anchor: x > 0.6 ? "end" : "start", size: 11, color: C.muted }); });
      const L1 = c.reduce((a, _, i) => a + ll(k[i], n[i], k[i] / n[i]), 0), L2 = c.reduce((a, _, i) => a + ll(k[i], n[i], pAll), 0);
      const p = k[sel] / n[sel], se = Math.sqrt(p * (1 - p) / n[sel]);
      out.innerHTML = `<table><tr><td>level ${c[sel] > 0 ? "+" : ""}${c[sel]}</td><td>${k[sel]} right of ${n[sel]} turns</td></tr><tr><td>p̂ ± SE</td><td><b>${fmt(p, 3)} ± ${fmt(se, 3)}</b>${se === 0 ? " (SE = 0: the formula fails at 0 or 1)" : ""}</td></tr><tr><td>log-likelihood, one p per level</td><td>${fmt(L1, 1)}</td></tr><tr><td>log-likelihood, one p for all (${fmt(pAll, 2)})</td><td>${fmt(L2, 1)}</td></tr></table>
        <p>Each level is a binomial experiment; bars are ±1.96 SE. The one-p model is ${fmt(L1 - L2, 0)} log-likelihood units worse. At c = 0 the mouse turns right on 62% of turns, about 2 SE above 0.5: a rightward bias.</p>`;
    }
    draw();
  });
})();
