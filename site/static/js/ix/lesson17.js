/* Lesson 17: Random Variables and Variability. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h } = window.IX;
  function uni(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const bar = (P, x0, x1, y, col, op = 0.85) => P.path([[x0, 0], [x1, 0], [x1, y], [x0, y]], { close: true, fill: col, fillOpacity: op, color: col, width: 1 });
  function poisson(u, lam) { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= u(); } while (p > L); return k - 1; }
  function gammaDraw(u, k) { /* Marsaglia–Tsang, with boost for k < 1 */
    if (k < 1) return gammaDraw(u, k + 1) * Math.pow(u() || 1e-12, 1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) { let x, v; do { const u1 = u() || 1e-12, u2 = u(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0); v = v * v * v; const w = u(); if (Math.log(w || 1e-12) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v; }
  }

  /* 1. PMF and CDF of a discrete count. */
  IX.register("pmf-cdf", root => {
    const p = [0.24, 0.41, 0.26, 0.08, 0.01], F = p.map((_, k) => p.slice(0, k + 1).reduce((a, b) => a + b, 0));
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "PMF: P(X = k)");
    h("p", { class: "ix-panel-title" }, b2, "CDF: F(x) = P(X ≤ x)");
    const P = Plane(b1, { x: [-0.7, 4.7], y: [0, 0.5], xtick: 1, ytick: 0.1, frame: true, labels: ["vesicles released k", ""], width: 380, height: 300, pad: 44, title: "PMF" });
    const Q = Plane(b2, { x: [-1, 5], y: [0, 1.1], xtick: 1, ytick: 0.2, frame: true, labels: ["x", ""], width: 380, height: 300, pad: 44, title: "CDF" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let a = 0.5, b = 3.5;
    const sa = slider(ctl, { label: "a", min: -1, max: 5, step: 0.5, value: a, format: v => fmt(v, 1), onInput: v => { a = v; draw(); } });
    slider(ctl, { label: "b", min: -1, max: 5, step: 0.5, value: b, format: v => fmt(v, 1), onInput: v => { b = v; draw(); } });
    player(ctl, sa, { bounce: true, interval: 500 });
    const out = readout(root);
    const Fx = x => x < 0 ? 0 : F[Math.min(4, Math.floor(x))];
    function draw() {
      P.clear(); Q.clear();
      p.forEach((v, k) => bar(P, k - 0.35, k + 0.35, v, C.blue, k > a && k <= b ? 0.9 : 0.25));
      for (let k = -1; k <= 4; k++) { const y = Fx(k), x1 = k + 1; Q.line([k, y], [x1, y], { color: C.blue, width: 2.4 }); if (k >= 0) { Q.dot([k, y], { color: C.blue, r: 4, sw: 0 }); Q.dot([k, Fx(k - 1)], { fill: "#fff", stroke: C.blue, sw: 1.5, r: 4 }); } }
      const lo = Math.min(a, b), hi = Math.max(a, b), Fa = Fx(lo), Fb = Fx(hi);
      [[lo, Fa], [hi, Fb]].forEach(([x, y]) => { Q.line([x, 0], [x, y], { color: C.vermilion, dash: "4 4", width: 1.4 }); Q.dot([x, y], { color: C.vermilion, r: 5 }); });
      Q.line([4.6, Fa], [4.6, Fb], { color: C.vermilion, width: 4 });
      out.innerHTML = `<p>P(${fmt(lo, 1)} &lt; X ≤ ${fmt(hi, 1)}) = F(${fmt(hi, 1)}) − F(${fmt(lo, 1)}) = ${fmt(Fb, 2)} − ${fmt(Fa, 2)} = <b>${fmt(Fb - Fa, 2)}</b>: the sum of the highlighted bars, and the vermilion rise of the CDF. The CDF is a step function, defined between the integers too; each jump is one bar of the PMF. Open circles mark the value just before a jump.</p>`;
    }
    draw();
  });

  /* 2. A density is not a probability. */
  IX.register("isi-density", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 100], y: [0, 0.12], xtick: 20, ytick: 0.02, frame: true, labels: ["interval t (ms)", "density (per ms)"], width: 480, height: 320, pad: 48, clip: true, title: "Refractory exponential density" });
    const side = h("div", {}, L0);
    let lam = 0.05, tau = 2, a = 5, b = 20;
    const sl = slider(side, { label: "Hazard λ (per ms)", min: 0.01, max: 0.12, step: 0.002, value: lam, format: v => fmt(v, 3), onInput: v => { lam = v; draw(); } });
    slider(side, { label: "Refractory τ (ms)", min: 0, max: 10, step: 0.5, value: tau, format: v => fmt(v, 1), onInput: v => { tau = v; draw(); } });
    slider(side, { label: "From a (ms)", min: 0, max: 100, step: 1, value: a, onInput: v => { a = v; draw(); } });
    slider(side, { label: "To b (ms)", min: 0, max: 100, step: 1, value: b, onInput: v => { b = v; draw(); } });
    player(side, sl, { bounce: true, interval: 90 });
    const out = readout(side);
    const f = t => t < tau ? 0 : lam * Math.exp(-lam * (t - tau)), Fc = t => t < tau ? 0 : 1 - Math.exp(-lam * (t - tau));
    function draw() {
      P.clear();
      const lo = Math.min(a, b), hi = Math.max(a, b), area = [[lo, 0]];
      for (let t = lo; t <= hi + 1e-9; t += 0.25) area.push([t, f(t)]); area.push([hi, 0]);
      P.path(area, { close: true, fill: C.orange, fillOpacity: 0.45, color: "none", width: 0 });
      const pts = [[0, 0], [tau, 0]]; for (let t = tau; t <= 100; t += 0.25) pts.push([t, f(t)]);
      P.path(pts, { color: C.blue, width: 2.4 });
      const med = tau + Math.log(2) / lam;
      P.line([med, 0], [med, f(med)], { color: C.ink, dash: "4 4", width: 1.4 }); P.text("median", med, f(med), { dx: 4, dy: -6, anchor: "start", size: 12, color: C.ink, halo: true });
      out.innerHTML = `<table><tr><td><span class="k-orange">P(${lo} &lt; T ≤ ${hi} ms)</span></td><td><b>${fmt(Fc(hi) - Fc(lo), 3)}</b></td></tr><tr><td>peak density</td><td>${fmt(lam, 3)} per ms = <b>${fmt(lam * 1000, 0)} per s</b></td></tr><tr><td>median, τ + ln2/λ</td><td>${fmt(med, 1)} ms</td></tr><tr><td>mean, τ + 1/λ</td><td>${fmt(tau + 1 / lam, 1)} ms</td></tr></table>
        <p>Only areas are probabilities. The same curve, measured per second, peaks at ${fmt(lam * 1000, 0)}: a density has units of 1/(units of t) and can exceed 1.</p>`;
    }
    draw();
  });

  /* 3. Jensen: the mean of 1/T is not 1/(mean T). */
  IX.register("jensen", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 100], y: [0, 125], xtick: 20, ytick: 20, frame: true, labels: ["interval T (ms)", "rate 1/T (spikes/s)"], width: 480, height: 330, pad: 48, clip: true, title: "Jensen's inequality for 1/T" });
    const side = h("div", {}, L0);
    let d = 40;
    const sl = slider(side, { label: "Spread ±d (ms)", min: 0, max: 40, step: 1, value: d, onInput: v => { d = v; draw(); } });
    player(side, sl, { bounce: true, interval: 90 });
    const out = readout(side);
    function draw() {
      P.clear();
      const g = t => 1000 / t, pts = []; for (let t = 10; t <= 100; t += 0.5) pts.push([t, g(t)]);
      P.path(pts, { color: C.blue, width: 2.2 });
      const t1 = 50 - d, t2 = 50 + d, E = 0.5 * (g(t1) + g(t2));
      P.line([t1, g(t1)], [t2, g(t2)], { color: C.vermilion, width: 1.6, dash: "5 4" });
      [t1, t2].forEach(t => P.dot([t, g(t)], { color: C.vermilion, r: 6 }));
      P.dot([50, E], { color: C.vermilion, r: 7 }); P.dot([50, g(50)], { color: C.ink, r: 6 });
      P.text("E[1/T]", 50, E, { dx: 8, dy: -4, anchor: "start", size: 13, color: C.vermilion, halo: true, weight: 600 });
      P.text("1/E[T]", 50, g(50), { dx: 8, dy: 14, anchor: "start", size: 13, color: C.ink, halo: true, weight: 600 });
      out.innerHTML = `<table><tr><td>intervals</td><td>${t1} or ${t2} ms, equally likely</td></tr><tr><td>1/E[T]: the firing rate</td><td><b>${fmt(g(50), 1)}</b> spikes/s</td></tr><tr><td><span class="k-verm">E[1/T]</span>: mean "instantaneous rate"</td><td><b>${fmt(E, 1)}</b> spikes/s</td></tr></table>
        <p>1/t is convex, so the chord between the two outcomes lies above the curve and its midpoint, E[1/T], is above 1/E[T]. The more spread, the bigger the gap; the short intervals dominate. Averaging instantaneous rates overstates the firing rate.</p>`;
    }
    draw();
  });

  /* 4. Correlations put a floor under population averaging. */
  IX.register("population-floor", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, Math.log10(1000)], y: [-3, 0], noXTicks: true, noYTicks: true, frame: true, labels: ["number of neurons n (log scale)", ""], width: 480, height: 330, pad: 48, clip: true, title: "Variance of a population average" });
    ["1", "10", "100", "1000"].forEach((s, i) => P.text(s, i, -3, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back }));
    ["0.001", "0.01", "0.1", "1"].forEach((s, i) => P.text(s, 0, i - 3, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: P.back }));
    const side = h("div", {}, L0);
    let c = 0.1, ln = 2;
    const sc = slider(side, { label: "Correlation c", min: 0, max: 0.4, step: 0.005, value: c, format: v => fmt(v, 3), onInput: v => { c = v; draw(); } });
    slider(side, { label: "Neurons n", min: 0, max: 3, step: 0.05, value: ln, format: v => String(Math.round(Math.pow(10, v))), onInput: v => { ln = v; draw(); } });
    player(side, sc, { bounce: true, interval: 80 });
    const out = readout(side);
    const V = (n, cc) => 1 / n + (n - 1) / n * cc;
    function draw() {
      P.clear();
      const curve = cc => { const pts = []; for (let x = 0; x <= 3.001; x += 0.02) pts.push([x, Math.log10(Math.max(V(Math.pow(10, x), cc), 1e-3))]); return pts; };
      P.path(curve(0), { color: C.muted, width: 1.6, dash: "5 4" });
      P.path(curve(c), { color: C.blue, width: 2.4 });
      if (c > 0) P.line([0, Math.log10(c)], [3, Math.log10(c)], { color: C.vermilion, dash: "4 4", width: 1.4 });
      const n = Math.round(Math.pow(10, ln)), v = V(n, c);
      P.dot([Math.log10(n), Math.log10(v)], { color: C.ink, r: 6 });
      out.innerHTML = `<table><tr><td>n</td><td>${n}</td></tr><tr><td>Var(average) / σ²</td><td><b>${fmt(v, 4)}</b></td></tr><tr><td>if independent (grey dashed): 1/n</td><td>${fmt(1 / n, 4)}</td></tr><tr><td><span class="k-verm">floor c</span></td><td>${fmt(c, 3)}</td></tr></table>
        <p>Var(X̄) = σ²/n + (n − 1)c/n. Independent neurons average away their noise like 1/n; with shared variability the variance can never fall below the covariance c, however many neurons you record.</p>`;
    }
    draw();
  });

  /* 5. CV and Fano factor of a renewal train. */
  IX.register("cv-fano", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Two seconds of the train, 20 spikes/s");
    h("p", { class: "ix-panel-title" }, b2, "Fano factor against counting window");
    const P = Plane(b1, { x: [0, 2], y: [0, 5], xtick: 0.5, noYTicks: true, frame: true, labels: ["time (s)", ""], width: 380, height: 300, pad: 36, title: "Raster" });
    const Q = Plane(b2, { x: [-2, 1], y: [-1, 1], noXTicks: true, noYTicks: true, frame: true, labels: ["window (s, log scale)", ""], width: 380, height: 300, pad: 44, clip: true, title: "Fano factor" });
    ["0.01", "0.1", "1", "10"].forEach((s, i) => Q.text(s, i - 2, -1, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: Q.back }));
    ["0.1", "1", "10"].forEach((s, i) => Q.text(s, -2, i - 1, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: Q.back }));
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const ks = [0.25, 0.5, 1, 2, 5, 10];
    let ki = 2;
    const sl = slider(ctl, { label: "Gamma order k", min: 0, max: ks.length - 1, step: 1, value: ki, format: v => String(ks[v]), onInput: v => { ki = v; draw(); } });
    player(ctl, sl, { interval: 800 });
    const out = readout(root);
    const cache = {};
    function sim(k) {
      if (cache[k]) return cache[k];
      const u = uni(1700 + Math.round(k * 100)), rate = 20, Tt = 400, sp = []; let t = 0;
      while (t < Tt) { t += gammaDraw(u, k) / (k * rate); sp.push(t); }
      const isi = sp.slice(1).map((s, i) => s - sp[i]), m = isi.reduce((a, b) => a + b) / isi.length, sd = Math.sqrt(isi.reduce((a, b) => a + (b - m) ** 2, 0) / (isi.length - 1));
      const ws = []; for (let x = -2; x <= 1.001; x += 0.25) ws.push(Math.pow(10, x));
      const ff = ws.map(w => { const nb = Math.floor(Tt / w), c = new Array(nb).fill(0); sp.forEach(s => { const i = Math.floor(s / w); if (i < nb) c[i]++; }); const mu = c.reduce((a, b) => a + b) / nb, v = c.reduce((a, b) => a + (b - mu) ** 2, 0) / (nb - 1); return [Math.log10(w), Math.log10(v / mu)]; });
      return (cache[k] = { sp, cv: sd / m, ff });
    }
    function draw() {
      P.clear(); Q.clear();
      const k = ks[ki], s = sim(k);
      for (let r = 0; r < 4; r++) s.sp.filter(t => t >= 10 + 2 * r && t < 12 + 2 * r).forEach(t => P.line([t - 10 - 2 * r, r + 0.6], [t - 10 - 2 * r, r + 1.4], { color: C.ink, width: 1.4 }));
      Q.line([-2, 0], [1, 0], { color: C.muted, dash: "4 4", width: 1.2 });
      Q.line([-2, Math.log10(s.cv ** 2)], [1, Math.log10(s.cv ** 2)], { color: C.vermilion, dash: "6 4", width: 1.4 });
      Q.path(s.ff, { color: C.blue, width: 2.2 }); s.ff.forEach(p => Q.dot(p, { color: C.blue, r: 3.5, sw: 0 }));
      const last = Math.pow(10, s.ff[s.ff.length - 1][1]);
      out.innerHTML = `<table><tr><td>interval CV</td><td><b>${fmt(s.cv, 2)}</b> (theory 1/√k = ${fmt(1 / Math.sqrt(k), 2)})</td></tr><tr><td><span class="k-verm">CV²</span></td><td>${fmt(s.cv ** 2, 2)}</td></tr><tr><td>Fano factor at 10 s windows</td><td><b>${fmt(last, 2)}</b></td></tr></table>
        <p>Intervals drawn from a gamma distribution of order k (400 s simulated; four 2-s rows shown). k = 1 is the Poisson process: CV 1, Fano factor 1 at every window (grey). ${k > 1 ? "Larger k is more regular: CV and long-window Fano factor below 1." : k < 1 ? "Smaller k is burstier: CV above 1." : ""} For a renewal train the Fano factor approaches CV² for long windows; for very short windows it approaches 1.</p>`;
    }
    draw();
  });

  /* 6. Estimates vary: the spread of Fano factors from a Poisson neuron. */
  IX.register("ff-spread", root => {
    const ns = [5, 10, 20, 30, 50, 100, 200], S = 1500, cache = {};
    function sim(n) { if (cache[n]) return cache[n]; const u = uni(n * 13 + 1), out = []; for (let s = 0; s < S; s++) { let m = 0; const x = []; for (let i = 0; i < n; i++) { const c = poisson(u, 4); x.push(c); m += c; } m /= n; const v = x.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1); out.push(m > 0 ? v / m : 0); } out.sort((a, b) => a - b); return (cache[n] = out); }
    const P = Plane(root, { x: [0, 3], y: [0, 0.3], xtick: 0.5, noYTicks: true, frame: true, labels: ["estimated Fano factor (true value 1)", ""], width: 640, height: 300, pad: 40, clip: true, title: "Fano factor estimates" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let k = 1;
    const sl = slider(ctl, { label: "Trials", min: 0, max: ns.length - 1, step: 1, value: k, format: v => String(ns[v]), onInput: v => { k = v; draw(); } });
    player(ctl, sl, { interval: 700 });
    const out = readout(root);
    function draw() {
      P.clear();
      const g = sim(ns[k]), w = 0.05, bins = {};
      g.forEach(v => { const b = Math.floor(v / w); bins[b] = (bins[b] || 0) + 1; });
      Object.entries(bins).forEach(([b, c]) => { if (b * w < 3) bar(P, b * w, (+b + 1) * w, c / S, C.blue, 0.6); });
      const lo = g[Math.floor(0.025 * S)], hi = g[Math.floor(0.975 * S)];
      [lo, hi].forEach(x => P.line([x, 0], [x, 0.3], { color: C.vermilion, dash: "5 4", width: 1.6 }));
      P.line([1, 0], [1, 0.3], { color: C.ink, width: 1.4 });
      out.innerHTML = `<p>${S} simulated experiments, each with <b>${ns[k]}</b> trials of a Poisson neuron with mean 4 spikes. 95% of the estimated Fano factors lie in <b>[${fmt(lo, 2)}, ${fmt(hi, 2)}]</b> (vermilion). A single neuron's Fano factor of 1.4 from 20 trials is not evidence of super-Poisson variability; a whole population shifted above this range is.</p>`;
    }
    draw();
  });

  /* 7. The law of total variance: a hidden state adds variance. */
  IX.register("total-variance", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [-0.5, 20.5], y: [0, 0.22], xtick: 5, ytick: 0.05, frame: true, labels: ["spike count", "probability"], width: 480, height: 320, pad: 48, title: "Count distribution" });
    const side = h("div", {}, L0);
    let m1 = 8, m0 = 2, q = 0.5;
    const s1 = slider(side, { label: "Engaged mean", min: 0.5, max: 14, step: 0.5, value: m1, format: v => fmt(v, 1), onInput: v => { m1 = v; draw(); } });
    slider(side, { label: "Disengaged mean", min: 0.5, max: 14, step: 0.5, value: m0, format: v => fmt(v, 1), onInput: v => { m0 = v; draw(); } });
    slider(side, { label: "Share engaged", min: 0, max: 1, step: 0.05, value: q, format: v => fmt(v, 2), onInput: v => { q = v; draw(); } });
    player(side, s1, { bounce: true, interval: 200 });
    const out = readout(side);
    const pm = (lam, k) => { let p = Math.exp(-lam); for (let i = 1; i <= k; i++) p *= lam / i; return p; };
    function draw() {
      P.clear();
      const E = q * m1 + (1 - q) * m0, within = E, between = q * (m1 - E) ** 2 + (1 - q) * (m0 - E) ** 2, V = within + between;
      for (let k = 0; k <= 20; k++) { bar(P, k - 0.4, k, q * pm(m1, k) + (1 - q) * pm(m0, k), C.blue, 0.75); bar(P, k, k + 0.4, pm(E, k), C.muted, 0.45); }
      out.innerHTML = `<table><tr><td>E[N]</td><td>${fmt(E, 2)}</td></tr><tr><td>E[Var(N | S)] (within states)</td><td>${fmt(within, 2)}</td></tr><tr><td>Var(E[N | S]) (between states)</td><td>${fmt(between, 2)}</td></tr><tr><td>Var(N)</td><td><b>${fmt(V, 2)}</b></td></tr><tr><td>Fano factor</td><td><b>${fmt(V / E, 2)}</b></td></tr></table>
        <p><span class="k-blue">Blue</span>: counts from a neuron that is Poisson in each of two hidden states. Grey: a single Poisson neuron with the same mean. Each state alone has Fano factor 1, yet the mixture is wider: Var(N) = E[Var(N | S)] + Var(E[N | S]).</p>`;
    }
    draw();
  });
})();
