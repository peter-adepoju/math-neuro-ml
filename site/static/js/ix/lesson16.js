/* Lesson 16: Probability Rules. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h } = window.IX;
  function uni(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const bar = (P, x0, x1, y, col, op = 0.85) => P.path([[x0, 0], [x1, 0], [x1, y], [x0, y]], { close: true, fill: col, fillOpacity: op, color: col, width: 1 });
  const pct = v => fmt(v, 3);

  /* 1. Events as Boolean arrays. */
  IX.register("event-algebra", root => {
    const u = uni(16), n = 2000, L = [], R = [];
    for (let i = 0; i < n; i++) { L.push(u() < 0.5); R.push(u() < 0.5); }
    const ops = [
      { label: "L", f: (l, r) => l, tex: "L" }, { label: "R", f: (l, r) => r, tex: "R" },
      { label: "L and R", f: (l, r) => l && r }, { label: "L or R", f: (l, r) => l || r },
      { label: "not L", f: l => !l }, { label: "L but not R", f: (l, r) => l && !r },
      { label: "not (L or R)", f: (l, r) => !(l || r) }];
    let op = ops[2];
    buttons(root, ops, it => { op = it; draw(); }, { toggle: true, label: "Event", active: 2 });
    const grid = h("div", { style: "display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px;max-width:560px;margin:14px 0" }, root);
    const tiles = [];
    for (let i = 0; i < 40; i++) {
      const t = h("div", { style: "border:2px solid var(--line,#ccc);border-radius:6px;padding:4px 2px;text-align:center;font-size:12px;line-height:1.3" }, grid);
      h("div", { style: "font-size:10px;color:#777" }, t, "trial " + (i + 1));
      const s = h("div", { style: "display:flex;justify-content:center;gap:3px" }, t);
      h("span", { style: `display:inline-block;width:14px;height:14px;border-radius:3px;background:${L[i] ? C.blue : "transparent"};border:1px solid ${C.blue}` }, s);
      h("span", { style: `display:inline-block;width:14px;height:14px;border-radius:3px;background:${R[i] ? C.green : "transparent"};border:1px solid ${C.green}` }, s);
      tiles.push(t);
    }
    const out = readout(root);
    const PL = L.filter(Boolean).length / n, PR = R.filter(Boolean).length / n, PLR = L.filter((l, i) => l && R[i]).length / n, PoR = L.filter((l, i) => l || R[i]).length / n;
    function draw() {
      tiles.forEach((t, i) => { const on = op.f(L[i], R[i]); t.style.borderColor = on ? C.ink : "rgba(128,128,128,.25)"; t.style.background = on ? "rgba(0,0,0,.06)" : "transparent"; t.style.opacity = on ? 1 : 0.55; });
      const p = L.filter((l, i) => op.f(l, R[i])).length / n;
      out.innerHTML = `<p>Left square: <span class="k-blue">grating on the left (L)</span>; right square: <span class="k-green">grating on the right (R)</span>. Outlined trials are those where <b>${op.label}</b> is true. Over all ${n} simulated trials, P(${op.label}) = <b>${pct(p)}</b>.</p>
        <table><tr><td>P(L) + P(R) − P(L and R)</td><td>${pct(PL)} + ${pct(PR)} − ${pct(PLR)} = <b>${pct(PL + PR - PLR)}</b></td></tr><tr><td>P(L or R), counted directly</td><td><b>${pct(PoR)}</b></td></tr><tr><td>naive sum P(L) + P(R)</td><td>${pct(PL + PR)} (counts both-sides trials twice)</td></tr></table>`;
    }
    draw();
  });

  /* 2. Running proportions settle, with fluctuations ~ 1/sqrt(n). */
  IX.register("running-proportion", root => {
    const N = 5000, cols = [C.blue, C.orange, C.green, C.purple, C.sky], runs = cols.map((c, s) => { const u = uni(100 + s); let k = 0; const r = []; for (let i = 1; i <= N; i++) { k += u() < 0.5; r.push(k / i); } return r; });
    const P = Plane(root, { x: [0, Math.log10(N)], y: [0, 1.12], noXTicks: true, ytick: 0.2, frame: true, labels: ["number of trials n (log scale)", "proportion"], width: 640, height: 330, pad: 46, clip: true, title: "Running proportions" });
    ["1", "10", "100", "1000"].forEach((s, i) => P.text(s, i, 0, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back }));
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let m = 2.2;
    const sl = slider(ctl, { label: "Trials so far", min: 0.3, max: Math.log10(N), step: 0.02, value: m, format: v => String(Math.round(Math.pow(10, v))), onInput: v => { m = v; draw(); } });
    player(ctl, sl, { interval: 60 });
    const out = readout(root);
    function draw() {
      P.clear();
      const k = Math.round(Math.pow(10, m));
      const env = s => { const pts = []; for (let i = 1; i <= k; i = Math.max(i + 1, Math.round(i * 1.05))) pts.push([Math.log10(i), 0.5 + s * 2 * Math.sqrt(0.25 / i)]); return pts; };
      P.path(env(1), { color: C.muted, dash: "4 4", width: 1.2 }); P.path(env(-1), { color: C.muted, dash: "4 4", width: 1.2 });
      P.line([0, 0.5], [Math.log10(N), 0.5], { color: C.ink, width: 1 });
      runs.forEach((r, s) => { const pts = []; for (let i = 1; i <= k; i = Math.max(i + 1, Math.round(i * 1.02))) pts.push([Math.log10(i), r[i - 1]]); pts.push([Math.log10(k), r[k - 1]]); P.path(pts, { color: cols[s], width: 1.6 }); });
      const vals = runs.map(r => r[k - 1]), spread = Math.max(...vals) - Math.min(...vals);
      out.innerHTML = `<p>After <b>${k}</b> trials the five sessions give proportions from ${pct(Math.min(...vals))} to ${pct(Math.max(...vals))} (spread ${pct(spread)}). The dashed envelope is 0.5 ± 2√(p(1 − p)/n) = 0.5 ± ${fmt(2 * Math.sqrt(0.25 / k), 3)}. Each proportion obeys the axioms exactly, yet it is only an <b>estimate</b> of P = 0.5.</p>`;
    }
    draw();
  });

  /* 3. One table, three normalisations. */
  IX.register("conditioning-table", root => {
    const cnt = [[361, 153], [33, 468], [49, 445], [41, 450]], rows = ["none", "left only", "right only", "both"], colsN = ["no turn", "turn"], tot = 2000;
    const modes = [{ label: "Joint P(stimulus, response)" }, { label: "P(response | stimulus)" }, { label: "P(stimulus | response)" }];
    let md = 0;
    buttons(root, modes, (it, i) => { md = i; draw(); }, { toggle: true, label: "Divide by" });
    const P = Plane(root, { x: [-1.4, 2], y: [0, 4.6], noXTicks: true, noYTicks: true, labels: ["", ""], width: 520, height: 330, pad: 10, title: "Stimulus by response table" });
    const out = readout(root);
    const rs = cnt.map(r => r[0] + r[1]), cs = [0, 1].map(j => cnt.reduce((s, r) => s + r[j], 0));
    function draw() {
      P.clear();
      colsN.forEach((c, j) => P.text(c, j + 0.5, 4.3, { anchor: "middle", size: 13, color: C.muted, weight: 600 }));
      rows.forEach((r, i) => P.text(r, -0.1, 3.5 - i, { dy: 4, anchor: "end", size: 13, color: C.muted, weight: 600 }));
      cnt.forEach((r, i) => r.forEach((c, j) => {
        const v = md === 0 ? c / tot : md === 1 ? c / rs[i] : c / cs[j], y0 = 3 - i;
        P.path([[j + 0.04, y0 + 0.04], [j + 0.96, y0 + 0.04], [j + 0.96, y0 + 0.96], [j + 0.04, y0 + 0.96]], { close: true, fill: C.blue, fillOpacity: 0.08 + 0.8 * v, color: "none", width: 0 });
        P.text(fmt(v, 3), j + 0.5, y0 + 0.5, { dy: 0, anchor: "middle", size: 15, weight: 600, color: v > 0.5 ? "#fff" : C.ink });
        P.text(`(${c})`, j + 0.5, y0 + 0.5, { dy: 17, anchor: "middle", size: 11, color: v > 0.5 ? "#fff" : C.muted });
      }));
      const note = ["The whole table sums to 1. Row sums are P(stimulus), column sums are P(response): the marginals.", "Each <b>row</b> is divided by its row sum, so each row sums to 1. Read across: given no grating, the mouse turned on 0.298 of trials (the false-alarm rate).", "Each <b>column</b> is divided by its column sum, so each column sums to 1. Read down: of all the turns, only 0.101 came from blank trials."][md];
      out.innerHTML = `<p>${note} P(turn | none) = 0.298 and P(none | turn) = 0.101 share the numerator 153/2000 but have different denominators.</p>`;
    }
    draw();
  });

  /* 4. Conditional independence and confounding. */
  IX.register("confound", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 3], y: [0, 0.35], noXTicks: true, ytick: 0.05, frame: true, labels: ["", "probability"], width: 480, height: 320, pad: 46, title: "Joint against product" });
    const side = h("div", {}, L0);
    let d = 1;
    const sl = slider(side, { label: "Stimulus drive", min: 0, max: 1, step: 0.02, value: d, format: v => fmt(v, 2), onInput: v => { d = v; draw(); } });
    player(side, sl, { bounce: true, interval: 90 });
    const out = readout(side);
    function draw() {
      P.clear();
      const a1 = 0.35 + 0.25 * d, a0 = 0.35 - 0.25 * d, b1 = 0.35 + 0.15 * d, b0 = 0.35 - 0.15 * d;
      const pa = 0.5 * (a1 + a0), pb = 0.5 * (b1 + b0), pab = 0.5 * a1 * b1 + 0.5 * a0 * b0;
      const groups = [["pooled", pab, pa * pb], ["stimulus present", a1 * b1, a1 * b1], ["stimulus absent", a0 * b0, a0 * b0]];
      groups.forEach(([lab, j, p], g) => { bar(P, g + 0.15, g + 0.48, j, C.blue); bar(P, g + 0.52, g + 0.85, p, C.green); P.text(lab, g + 0.5, 0, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back }); });
      out.innerHTML = `<table><tr><td>P(A | stimulus), P(A | none)</td><td>${fmt(a1, 2)}, ${fmt(a0, 2)}</td></tr><tr><td>P(B | stimulus), P(B | none)</td><td>${fmt(b1, 2)}, ${fmt(b0, 2)}</td></tr><tr><td><span class="k-blue">pooled P(A and B)</span></td><td><b>${fmt(pab, 4)}</b></td></tr><tr><td><span class="k-green">pooled P(A) P(B)</span></td><td><b>${fmt(pa * pb, 4)}</b></td></tr></table>
        <p>Two unconnected neurons, A and B, independent within each condition (equal bars on the right), both driven by a stimulus shown on half the trials. Pooled, they look dependent: a mixture of two products is not a product. With no drive the gap vanishes.</p>`;
    }
    draw();
  });

  /* 5. How big is zero? Sampling noise in an estimated dependence gap. */
  IX.register("gap-noise", root => {
    const ns = [20, 50, 100, 200, 500, 1000, 2000], S = 800, cache = {};
    function sim(n) { if (cache[n]) return cache[n]; const u = uni(n * 7 + 3), g = []; for (let s = 0; s < S; s++) { let a = 0, b = 0, ab = 0; for (let i = 0; i < n; i++) { const x = u() < 0.35, y = u() < 0.35; a += x; b += y; ab += x && y; } g.push(ab / n - (a / n) * (b / n)); } g.sort((p, q) => p - q); return (cache[n] = g); }
    const P = Plane(root, { x: [-0.15, 0.15], y: [0, 0.4], xtick: 0.05, noYTicks: true, frame: true, labels: ["estimated P(A and B) − P(A)P(B)", ""], width: 640, height: 300, pad: 40, clip: true, title: "Gaps for truly independent events" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let k = 1;
    const sl = slider(ctl, { label: "Trials per session", min: 0, max: ns.length - 1, step: 1, value: k, format: v => String(ns[v]), onInput: v => { k = v; draw(); } });
    player(ctl, sl, { interval: 700 });
    const out = readout(root);
    function draw() {
      P.clear();
      const g = sim(ns[k]), w = 0.005, bins = {};
      g.forEach(v => { const b = Math.floor(v / w); bins[b] = (bins[b] || 0) + 1; });
      Object.entries(bins).forEach(([b, c]) => bar(P, b * w, (+b + 1) * w, c / S, C.blue, 0.6));
      P.line([0.0375, 0], [0.0375, 0.4], { color: C.vermilion, dash: "6 4", width: 2 });
      P.text("stimulus-driven pair", 0.0395, 0.37, { anchor: "start", size: 12, color: C.vermilion, halo: true });
      const lo = g[Math.floor(0.025 * S)], hi = g[Math.floor(0.975 * S)], half = (hi - lo) / 2;
      out.innerHTML = `<p>${S} simulated sessions of <b>${ns[k]}</b> trials, two independent events each with probability 0.35. The true gap is zero, yet 95% of the estimates lie within about <b>±${fmt(half, 3)}</b>. The stimulus-driven pair of the previous figure has a true gap of 0.0375 (dashed): ${0.0375 > half ? "clearly outside the noise at this sample size." : "hidden in the noise at this sample size."}</p>`;
    }
    draw();
  });

  /* 6. Simpson's paradox. */
  IX.register("simpson", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 4], y: [0, 1], noXTicks: true, ytick: 0.2, frame: true, labels: ["", "hit rate"], width: 480, height: 320, pad: 46, title: "Hit rates of two detectors" });
    const side = h("div", {}, L0);
    let ma = 0.8, mb = 0.2;
    const sa = slider(side, { label: "A: share low", min: 0, max: 1, step: 0.05, value: ma, format: v => fmt(v, 2), onInput: v => { ma = v; draw(); } });
    slider(side, { label: "B: share low", min: 0, max: 1, step: 0.05, value: mb, format: v => fmt(v, 2), onInput: v => { mb = v; draw(); } });
    player(side, sa, { bounce: true, interval: 150 });
    const out = readout(side);
    function draw() {
      P.clear();
      const A = [0.5, 0.95], B = [0.4, 0.9], pa = A[0] * ma + A[1] * (1 - ma), pb = B[0] * mb + B[1] * (1 - mb);
      const g = [["low contrast", A[0], B[0]], ["high contrast", A[1], B[1]], ["as tested", pa, pb], ["50/50 mix", 0.725, 0.65]];
      g.forEach(([lab, a, b], i) => { bar(P, i + 0.15, i + 0.48, a, C.blue); bar(P, i + 0.52, i + 0.85, b, C.green); P.text(lab, i + 0.5, 0, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back }); });
      out.innerHTML = `<table><tr><td><span class="k-blue">detector A</span> as tested</td><td>0.50 × ${fmt(ma, 2)} + 0.95 × ${fmt(1 - ma, 2)} = <b>${fmt(pa, 3)}</b></td></tr><tr><td><span class="k-green">detector B</span> as tested</td><td>0.40 × ${fmt(mb, 2)} + 0.90 × ${fmt(1 - mb, 2)} = <b>${fmt(pb, 3)}</b></td></tr></table>
        <p>A beats B at every contrast. ${pa < pb ? "Yet as tested <b>B looks better</b>, because B saw mostly easy trials." : "As tested A also looks better here, because the mixes are similar enough."} Each overall rate is a weighted average, Σ P(hit | c) P(c), and the weights differ. Compare within conditions, or on a common mix.</p>`;
    }
    draw();
  });

  /* 7. Base rate, precision and accuracy. */
  IX.register("base-rate", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "500 trials, sorted by outcome");
    h("p", { class: "ix-panel-title" }, b2, "Precision against base rate (log scale)");
    const Q = Plane(b1, { x: [0, 25], y: [0, 20], noXTicks: true, noYTicks: true, labels: ["", ""], width: 380, height: 320, pad: 8, title: "Icon array" });
    const R = Plane(b2, { x: [-3, 0], y: [0, 1], noXTicks: true, ytick: 0.2, frame: true, labels: ["base rate π", "precision"], width: 380, height: 320, pad: 44, clip: true, title: "Precision" });
    ["0.001", "0.01", "0.1", "1"].forEach((s, i) => R.text(s, i - 3, 0, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: R.back }));
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let lp = Math.log10(0.2), se = 0.9, sp = 0.9;
    const s1 = slider(ctl, { label: "Base rate π", min: -2.5, max: Math.log10(0.5), step: 0.05, value: lp, format: v => fmt(Math.pow(10, v), 3), onInput: v => { lp = v; draw(); } });
    player(ctl, s1, { bounce: true, interval: 120 });
    const ctl2 = h("div", { class: "ix-controls-row" }, root);
    slider(ctl2, { label: "Sensitivity", min: 0.5, max: 0.999, step: 0.001, value: se, format: v => fmt(v, 3), onInput: v => { se = v; draw(); } });
    slider(ctl2, { label: "Specificity", min: 0.5, max: 0.999, step: 0.001, value: sp, format: v => fmt(v, 3), onInput: v => { sp = v; draw(); } });
    const out = readout(root);
    const prec = (pi) => se * pi / (se * pi + (1 - sp) * (1 - pi));
    function draw() {
      Q.clear(); R.clear();
      const pi = Math.pow(10, lp), np = Math.round(500 * pi), tp = Math.round(se * np), fn = np - tp, fp = Math.round((1 - sp) * (500 - np)), tn = 500 - np - fp;
      const kinds = [[tp, C.blue], [fn, C.purple], [fp, C.vermilion], [tn, "#d9d9d9"]]; let i = 0;
      kinds.forEach(([c, col]) => { for (let k = 0; k < c; k++, i++) Q.dot([0.5 + (i % 25), 19.5 - Math.floor(i / 25)], { color: col, r: 5, sw: 0 }); });
      const pts = []; for (let x = -3; x <= 0.001; x += 0.02) pts.push([x, prec(Math.pow(10, x))]); R.path(pts, { color: C.blue, width: 2.2 });
      R.dot([lp, prec(pi)], { color: C.ink, r: 6 });
      const pr = prec(pi), acc = se * pi + sp * (1 - pi);
      out.innerHTML = `<p><span class="k-blue">hits ${tp}</span> · <span class="k-purple">misses ${fn}</span> · <span class="k-verm">false alarms ${fp}</span> · correct rejections ${tn} (grey)</p>
        <table><tr><td>precision P(present | yes)</td><td><b>${fmt(pr, 3)}</b></td></tr><tr><td>accuracy</td><td>${fmt(acc, 3)}</td></tr><tr><td>accuracy of a detector that always says no</td><td>${fmt(1 - pi, 3)}</td></tr></table>
        <p>Sensitivity and specificity condition on the truth, so they do not change with π. Precision does: when the signal is rare, the false alarms from the many absent trials swamp the hits. Raising specificity helps far more than raising sensitivity.</p>`;
    }
    draw();
  });

  /* 8. Moving a threshold trades hits for false alarms. */
  IX.register("threshold", root => {
    const pois = (lam, k) => { let p = Math.exp(-lam); for (let i = 1; i <= k; i++) p *= lam / i; return p; };
    const K = 18, p0 = [], p1 = []; for (let k = 0; k <= K; k++) { p0.push(pois(3, k)); p1.push(pois(8, k)); }
    const tail = (p, t) => p.slice(t).reduce((a, b) => a + b, 0);
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Spike-count distributions");
    h("p", { class: "ix-panel-title" }, b2, "Hit rate against false-alarm rate");
    const P = Plane(b1, { x: [-0.5, K + 0.5], y: [0, 0.3], xtick: 3, ytick: 0.05, frame: true, labels: ["spike count", "probability"], width: 380, height: 320, pad: 44, title: "Counts" });
    const Q = Plane(b2, { x: [0, 1], y: [0, 1], xtick: 0.2, ytick: 0.2, frame: true, labels: ["false-alarm rate", "hit rate"], width: 380, height: 320, pad: 44, title: "Trade-off" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let t = 6, cm = 1;
    const sl = slider(ctl, { label: "Threshold t", min: 0, max: 15, step: 1, value: t, onInput: v => { t = v; draw(); } });
    player(ctl, sl, { interval: 600 });
    buttons(ctl, [{ label: "miss costs 1" }, { label: "miss costs 5" }], (it, i) => { cm = i ? 5 : 1; draw(); }, { toggle: true, label: "Costs" });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      for (let k = 0; k <= K; k++) { bar(P, k - 0.42, k, p0[k], C.blue, 0.75); bar(P, k, k + 0.42, p1[k], C.orange, 0.75); }
      P.line([t - 0.5, 0], [t - 0.5, 0.27], { color: C.ink, dash: "6 4", width: 2 });
      P.text("yes →", t - 0.3, 0.255, { anchor: "start", size: 12, color: C.ink, halo: true });
      const roc = []; for (let s = K + 1; s >= 0; s--) roc.push([tail(p0, s), tail(p1, s)]);
      Q.line([0, 0], [1, 1], { color: C.axis, dash: "4 4", width: 1 });
      Q.path(roc, { color: C.green, width: 2 });
      const cost = s => 0.5 * cm * (1 - tail(p1, s)) + 0.5 * tail(p0, s); let best = 0; for (let s = 0; s <= 15; s++) if (cost(s) < cost(best)) best = s;
      Q.dot([tail(p0, best), tail(p1, best)], { fill: "#fff", stroke: C.ink, sw: 2, r: 7 });
      Q.dot([tail(p0, t), tail(p1, t)], { color: C.ink, r: 5 });
      out.innerHTML = `<table><tr><td>decision</td><td>"yes" if count ≥ ${t}</td></tr><tr><td>hit rate P(yes | <span class="k-orange">present</span>)</td><td><b>${fmt(tail(p1, t), 3)}</b></td></tr><tr><td>false-alarm rate P(yes | <span class="k-blue">absent</span>)</td><td><b>${fmt(tail(p0, t), 3)}</b></td></tr><tr><td>expected cost per trial (π = 0.5)</td><td>${fmt(cost(t), 3)} (best t = ${best}, open circle)</td></tr></table>
        <p>A model neuron fires Poisson counts with mean 3 without the stimulus and 8 with it. Raising t can only lose "yes" trials, so both rates fall together; the curve they trace is the ROC curve (Lesson 20). Making a miss cost five false alarms moves the best threshold down.</p>`;
    }
    draw();
  });

  /* 9. The mini-lab's pooling artefact (real counts). */
  IX.register("pooling", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 3], y: [0, 1], noXTicks: true, ytick: 0.2, frame: true, labels: ["", "P(VISp says yes)"], width: 480, height: 320, pad: 46, title: "Decisions with and without a left grating" });
    const side = h("div", {}, L0);
    const g = [["all trials", 0.569, 167, 0.370, 173], ["right grating shown", 0.824, 108, 0.877, 65], ["no right grating", 0.102, 59, 0.065, 108]];
    let sel = 0;
    buttons(side, g.map(x => ({ label: x[0] })), (it, i) => { sel = i; draw(); }, { toggle: true, label: "Trials" });
    const out = readout(side);
    function draw() {
      P.clear();
      g.forEach(([lab, a, na, b, nb], i) => {
        const op = i === sel ? 0.9 : 0.3;
        bar(P, i + 0.15, i + 0.48, a, C.blue, op); bar(P, i + 0.52, i + 0.85, b, C.green, op);
        P.text(`${na}`, i + 0.315, a, { dy: -6, anchor: "middle", size: 11, color: C.muted }); P.text(`${nb}`, i + 0.685, b, { dy: -6, anchor: "middle", size: 11, color: C.muted });
        P.text(lab, i + 0.5, 0, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back });
      });
      const [lab, a, , b] = g[sel];
      const msg = sel === 0 ? "Pooled, left-hemisphere V1 seems to respond to <b>left</b> gratings: 0.569 against 0.370." : `Within this group the left grating changes little (${a} against ${b}), and in the opposite direction in the two groups: within sampling noise.`;
      out.innerHTML = `<p><span class="k-blue">left grating shown</span> · <span class="k-green">no left grating</span> (numbers above the bars are trial counts). <b>${lab}:</b> ${msg}</p><p>The pooled difference comes from the task design: right gratings were more common on left-grating trials (P(R | L) = 0.65 against 0.38), and VISp responds to right gratings. The law of total probability passes that dependence through.</p>`;
    }
    draw();
  });
})();
