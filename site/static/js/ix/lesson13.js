/* Lesson 13: Integration and Accumulation. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h, el } = window.IX;
  let dataP = null;
  const data = () => dataP || (dataP = fetch((window.MAMBA ? MAMBA.root : "../") + "assets/lesson13/data.json").then(r => r.json()));
  function curve(P, f, s = {}, x0 = P.opts.x[0], x1 = P.opts.x[1], n = 400) {
    const [y0, y1] = P.opts.y, span = y1 - y0; let seg = [];
    const flush = () => { if (seg.length > 1) P.path(seg, s); seg = []; };
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); if (!isFinite(y) || y < y0 - 2 * span || y > y1 + 2 * span) { flush(); continue; } seg.push([x, y]); }
    flush();
  }
  function fillUnder(P, f, x0, x1, s = {}, n = 200) { const pts = [[x0, 0]]; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push([x, f(x)]); } pts.push([x1, 0]); return P.path(pts, Object.assign({ close: true, width: 0, color: "none" }, s)); }
  function rng(seed) { let a = seed >>> 0; const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; const n = () => { const u1 = u() || 1e-12, u2 = u(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }; n.u = u; return n; }
  const sup = v => String(v).split("").map(c => ({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" })[c] || c).join("");
  /* the evoked rate (spikes/s, t in ms) and its exact accumulation (spikes) */
  const r0 = 5, A = 60, tau = 40;
  const rate = t => r0 + A * (t / tau) * Math.exp(1 - t / tau);
  const count = t => (r0 * t + A * Math.E * tau * (1 - Math.exp(-t / tau) * (1 + t / tau))) / 1000;

  /* 1. Area under the rate, and the accumulation whose slope is the rate. */
  IX.register("accumulate", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Rate r(t): the shaded area so far");
    h("p", { class: "ix-panel-title" }, b2, "Accumulated count N(t): its slope is r(t)");
    const P = Plane(b1, { x: [0, 300], y: [0, 70], xtick: 50, ytick: 10, frame: true, labels: ["time after stimulus (ms)", "spikes/s"], width: 380, height: 300, pad: 42, clip: true, title: "Rate" });
    const Q = Plane(b2, { x: [0, 300], y: [0, 9], xtick: 50, ytick: 2, frame: true, labels: ["time after stimulus (ms)", "spikes"], width: 380, height: 300, pad: 42, clip: true, title: "Accumulation" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let T = 60;
    const sl = slider(ctl, { label: "Upper limit t", min: 0, max: 300, step: 2, value: T, format: v => v + " ms", onInput: v => { T = v; draw(); } });
    player(ctl, sl, { interval: 40 });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      if (T > 0) fillUnder(P, rate, 0, T, { fill: C.sky, fillOpacity: 0.45 });
      curve(P, rate, { color: C.blue, width: 2.4 }, 0, 300);
      P.line([T, 0], [T, rate(T)], { color: C.ink, width: 1.4 });
      curve(Q, count, { color: C.green, width: 2.4 }, 0, 300);
      const s = rate(T) / 1000;
      Q.line([T - 60, count(T) - 60 * s], [T + 60, count(T) + 60 * s], { color: C.orange, width: 2.2 });
      Q.dot([T, count(T)], { color: C.green, r: 6 });
      out.innerHTML = `<table><tr><td>area so far = N(${T} ms)</td><td><b>${fmt(count(T), 3)}</b> spikes</td></tr><tr><td>slope of N at ${T} ms (orange)</td><td><b>${fmt(rate(T), 1)}</b> spikes/s = r(${T} ms)</td></tr></table>
        <p>The expected spike count up to t is the area under the rate (left), in spikes/s × s. The Fundamental Theorem of Calculus says the slope of that accumulation is the rate itself: integrating and differentiating undo each other. Over 300 ms the area is 7.993 spikes; 2000 simulated trials average 7.94.</p>`;
    }
    draw();
  });

  /* 2. Riemann sums and the trapezoid rule. */
  IX.register("riemann", root => {
    const f = x => 1 + Math.sin(x) + 0.3 * x, Fx = x => x - Math.cos(x) + 0.15 * x * x, exact = Fx(6) - Fx(0);
    let rule = "left", n = 8;
    buttons(root, [{ label: "Left" }, { label: "Right" }, { label: "Midpoint" }, { label: "Trapezoid" }], it => { rule = it.label.toLowerCase(); draw(); }, { toggle: true, label: "Rule" });
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 6.2], y: [0, 3], xtick: 1, ytick: 1, labels: ["x", "f(x)"], width: 480, height: 330, pad: 34, clip: true, title: "Approximating the area" });
    const side = h("div", {}, L);
    const sl = slider(side, { label: "Pieces n", min: 1, max: 64, step: 1, value: n, onInput: v => { n = v; draw(); } });
    player(side, sl, { interval: 150 });
    const out = readout(side);
    function draw() {
      P.clear();
      const hh = 6 / n; let S = 0;
      for (let i = 0; i < n; i++) {
        const a = i * hh, b = a + hh;
        if (rule === "trapezoid") { S += (f(a) + f(b)) / 2 * hh; P.path([[a, 0], [a, f(a)], [b, f(b)], [b, 0]], { close: true, color: C.blue, width: 0.8, fill: C.sky, fillOpacity: 0.5 }); }
        else { const xs = rule === "left" ? a : rule === "right" ? b : (a + b) / 2, v = f(xs); S += v * hh; P.path([[a, 0], [a, v], [b, v], [b, 0]], { close: true, color: C.blue, width: 0.8, fill: C.sky, fillOpacity: 0.5 }); if (n <= 32) P.dot([xs, v], { color: C.orange, r: 3.2, sw: 0 }); }
      }
      curve(P, f, { color: C.ink, width: 2.4 }, 0, 6);
      out.innerHTML = `<table><tr><td>${rule} sum, n = ${n}</td><td><b>${fmt(S, 4)}</b></td></tr><tr><td>exact integral</td><td>${fmt(exact, 4)}</td></tr><tr><td>error</td><td><b>${(S - exact).toExponential(2)}</b></td></tr></table>
        <p>f(x) = 1 + sin x + 0.3x on [0, 6]. ${rule === "left" || rule === "right" ? "Left and right sums err by about (h/2)(f(b) − f(a)): doubling n halves the error." : "The midpoint and trapezoid rules cancel that first-order error: doubling n quarters the error."} Press Play to add pieces.</p>`;
    }
    draw();
  });

  /* 3. Quadrature error against the sampling interval, computed live. */
  IX.register("quad-error", root => {
    let kink = false;
    buttons(root, [{ label: "Smooth: eˣ sin 3x" }, { label: "With a kink: max(x − 0.7, 0)" }], (it, i) => { kink = i === 1; draw(); }, { toggle: true, label: "Integrand on [0, 1]" });
    const L = layout(root, true);
    const P = Plane(L, { x: [-3.1, 0.1], y: [-14, 1], noXTicks: true, noYTicks: true, frame: true, labels: ["sampling interval h", "|error|"], width: 480, height: 340, pad: 50, clip: true, title: "Quadrature error" });
    [-3, -2, -1, 0].forEach(v => P.text(v ? "10" + sup(v) : "1", v, -14, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back }));
    [-12, -8, -4, 0].forEach(v => P.text(v ? "10" + sup(v) : "1", -3.1, v, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: P.back }));
    const side = h("div", {}, L);
    let e = -1;
    const sl = slider(side, { label: "Step h", min: -3, max: 0, step: 0.1, value: -1, format: v => fmt(Math.pow(10, v), 4), onInput: v => { e = v; draw(); } });
    player(side, sl, { bounce: true, interval: 120 });
    const out = readout(side);
    const rules = [["left", C.blue], ["trapezoid", C.vermilion], ["Simpson", C.green]];
    function est(f, n, r) { const hh = 1 / n; let s = 0; if (r === "left") { for (let i = 0; i < n; i++) s += f(i * hh); return s * hh; } if (r === "trapezoid") { for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 0.5 : 1) * f(i * hh); return s * hh; } for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(i * hh); return s * hh / 3; }
    function draw() {
      P.clear();
      const f = kink ? x => Math.max(x - 0.7, 0) : x => Math.exp(x) * Math.sin(3 * x);
      const ex = kink ? 0.045 : (Math.exp(1) * (Math.sin(3) - 3 * Math.cos(3)) + 3) / 10;
      const ns = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024], cur = Math.max(2, 2 * Math.round(Math.pow(10, -e) / 2));
      const res = {};
      rules.forEach(([r, col]) => { const pts = ns.map(n => [Math.log10(1 / n), Math.log10(Math.max(Math.abs(est(f, n, r) - ex), 1e-15))]); P.path(pts, { color: col, width: 2 }); pts.forEach(p => P.dot(p, { color: col, r: 3.5 })); const v = Math.abs(est(f, cur, r) - ex); res[r] = v; P.dot([Math.log10(1 / cur), Math.log10(Math.max(v, 1e-15))], { color: col, r: 7, stroke: "#fff", sw: 2 }); });
      P.line([Math.log10(1 / cur), -14], [Math.log10(1 / cur), 1], { color: C.axis, width: 1 });
      out.innerHTML = `<table>${rules.map(([r, col]) => `<tr><td><span style="color:${col};font-weight:700">${r}</span></td><td>${res[r].toExponential(1)}</td></tr>`).join("")}</table>
        <p>With h = 1/${cur}. On a log–log plot each rule's error falls along a straight line whose slope is its order: about 1 for the left sum, 2 for the trapezoid, 4 for Simpson. ${kink ? "With a kink between samples, Simpson's advantage vanishes: it falls back to order 2." : "Switch to the kinked integrand to see a higher-order rule lose its advantage."}</p>`;
    }
    draw();
  });

  /* 4. Noise averages, bias accumulates. */
  IX.register("noise-bias", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 60], y: [-25, 25], xtick: 10, ytick: 5, frame: true, labels: ["integration time (s)", "error of the integral"], width: 480, height: 340, pad: 46, clip: true, title: "Integrated error" });
    const side = h("div", {}, L);
    let sd = 2, bias = 0.1, seed = 3;
    slider(side, { label: "Noise SD σ", min: 0, max: 4, step: 0.1, value: sd, format: v => fmt(v, 1), onInput: v => { sd = v; draw(); } });
    const sb = slider(side, { label: "Bias", min: 0, max: 0.4, step: 0.01, value: bias, format: v => fmt(v, 2), onInput: v => { bias = v; draw(); } });
    player(side, sb, { bounce: true, interval: 90 });
    buttons(side, [{ label: "New noise" }], () => { seed++; draw(); });
    const out = readout(side);
    const hstep = 0.05;
    function draw() {
      P.clear();
      const g = rng(seed), N = 1200;
      for (let r = 0; r < 12; r++) { let s = 0; const pts = [[0, 0]]; for (let k = 1; k <= N; k++) { s += (sd * g() + bias) * hstep; if (k % 6 === 0) pts.push([k * hstep, s]); } P.path(pts, { color: C.sky, width: 1, opacity: 0.8 }); }
      P.path([...Array(61).keys()].map(t => [t, bias * t + 2 * sd * Math.sqrt(hstep * t)]), { color: C.blue, width: 2, dash: "6 4" });
      P.path([...Array(61).keys()].map(t => [t, bias * t - 2 * sd * Math.sqrt(hstep * t)]), { color: C.blue, width: 2, dash: "6 4" });
      P.line([0, 0], [60, bias * 60], { color: C.vermilion, width: 2.4 });
      const cross = sd > 0 && bias > 0 ? sd * sd * hstep / (bias * bias) : Infinity;
      out.innerHTML = `<table><tr><td>after 60 s: noise SD σ√(hT)</td><td><b>${fmt(sd * Math.sqrt(hstep * 60), 2)}</b></td></tr><tr><td>after 60 s: bias × T</td><td><b>${fmt(bias * 60, 2)}</b></td></tr><tr><td>bias overtakes noise after</td><td>${isFinite(cross) ? fmt(cross, 0) + " s" : "never"}</td></tr></table>
        <p>Twelve runs of integrating a signal sampled every 50 ms with independent noise (light blue). Noise grows only like √T (dashed: ±2 SD around the drift); a constant bias grows like T (vermilion) and eventually dominates.</p>`;
    }
    draw();
  });

  /* 5. Irregular sampling: use the true times. */
  IX.register("irregular", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 300], y: [0, 70], xtick: 50, ytick: 10, frame: true, labels: ["time (ms)", "spikes/s"], width: 480, height: 320, pad: 42, clip: true, title: "Irregular samples of the rate" });
    const side = h("div", {}, L);
    let frac = 0.4, assume = false, seed = 1;
    buttons(side, [{ label: "True times" }, { label: "Assume 5 ms apart" }], (it, i) => { assume = i === 1; draw(); }, { toggle: true, label: "Spacing" });
    const sl = slider(side, { label: "Fraction kept", min: 0.1, max: 1, step: 0.05, value: frac, format: v => Math.round(v * 100) + "%", onInput: v => { frac = v; draw(); } });
    player(side, sl, { bounce: true, interval: 150 });
    const out = readout(side);
    function draw() {
      P.clear();
      const g = rng(seed), ts = [0]; for (let t = 5; t < 300; t += 5) if (g.u() < frac) ts.push(t); ts.push(300);
      const tt = assume ? ts.map((_, i) => i * 5) : ts, v = ts.map(rate);
      let S = 0; for (let i = 0; i + 1 < tt.length; i++) S += (v[i] + v[i + 1]) / 2 * (tt[i + 1] - tt[i]);
      curve(P, rate, { color: C.axis, width: 1.6 }, 0, 300);
      P.path(tt.map((t, i) => [t, v[i]]), { color: assume ? C.vermilion : C.blue, width: 2 });
      tt.forEach((t, i) => P.dot([t, v[i]], { color: assume ? C.vermilion : C.blue, r: 3.5 }));
      out.innerHTML = `<table><tr><td>samples kept</td><td>${ts.length}</td></tr><tr><td>trapezoid integral</td><td><b>${fmt(S / 1000, 3)}</b> spikes</td></tr><tr><td>exact</td><td>7.993</td></tr></table>
        <p>${assume ? "Pretending the kept samples are still 5 ms apart squeezes the curve into a shorter time and badly underestimates the area." : "The trapezoid rule with the true sample times works for any spacing: the estimate stays close to the exact count."} Grey: the true rate.</p>`;
    }
    draw();
  });

  /* 6. A real wheel: integrating velocity samples back to position. */
  IX.register("wheel-integrate", root => {
    let D = null, k = 5, rule = "trapezoid";
    buttons(root, [{ label: "Trapezoid" }, { label: "Left Riemann" }], (it, i) => { rule = i ? "left" : "trapezoid"; draw(); }, { toggle: true, label: "Rule" });
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Wheel position: exact and integrated");
    h("p", { class: "ix-panel-title" }, b2, "The velocity samples used");
    const P = Plane(b1, { x: [-0.5, 2], y: [-2100, 200], xtick: 0.5, ytick: 500, frame: true, labels: ["time from stimulus (s)", "steps"], width: 400, height: 320, pad: 50, clip: true, title: "Position" });
    const Q = Plane(b2, { x: [-0.5, 2], y: [-2500, 900], xtick: 0.5, ytick: 1000, frame: true, labels: ["time from stimulus (s)", "steps/s"], width: 400, height: 320, pad: 50, clip: true, title: "Velocity" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const ks = [1, 2, 5, 10, 20];
    const sl = slider(ctl, { label: "Sample every", min: 0, max: 4, step: 1, value: 2, format: v => ks[v] * 10 + " ms", onInput: v => { k = ks[v]; draw(); } });
    player(ctl, sl, { interval: 900 });
    const out = readout(root);
    function draw() {
      if (!D) return; P.clear(); Q.clear();
      const c = D.c, vel = c.map(x => x / 0.01), tm = c.map((_, i) => -0.5 + (i + 0.5) * 0.01);
      let p = 0; const ex = [[-0.5, 0]]; c.forEach((x, i) => { p += x; ex.push([-0.5 + (i + 1) * 0.01, p]); });
      P.path(ex, { color: C.ink, width: 2.2 });
      const idx = []; for (let i = 0; i < 250; i += k) idx.push(i); if (idx[idx.length - 1] !== 249) idx.push(249);
      const est = [[tm[idx[0]], 0]]; let s = 0;
      for (let j = 0; j + 1 < idx.length; j++) { const a = idx[j], b = idx[j + 1], dt = tm[b] - tm[a]; s += rule === "left" ? vel[a] * dt : (vel[a] + vel[b]) / 2 * dt; est.push([tm[b], s]); }
      const exAt = t => { const i = Math.round((t + 0.5) / 0.01); return ex[Math.max(0, Math.min(250, i))][1]; };
      const off = exAt(tm[idx[0]]) - 0;
      P.path(est.map(q => [q[0], q[1] + off]), { color: C.orange, width: 2, dash: "5 3" }); est.forEach(q => P.dot([q[0], q[1] + off], { color: C.orange, r: 3 }));
      Q.path(tm.map((t, i) => [t, vel[i]]), { color: C.blue, width: 1.2 }); idx.forEach(i => Q.dot([tm[i], vel[i]], { color: C.orange, r: 3 }));
      const errs = est.map(q => q[1] + off - (exAt(q[0] - 0.005) + exAt(q[0] + 0.005)) / 2), rms = Math.sqrt(errs.reduce((a, b) => a + b * b, 0) / errs.length);
      out.innerHTML = `<p>Trial ${D.trial}, the largest turn of the session. The exact position (black) is the running total of the encoder counts. Integrating velocity samples every ${k * 10} ms with the ${rule === "left" ? "left Riemann sum" : "trapezoid rule"} (orange) misses by an RMS of about <b>${fmt(rms, 0)}</b> steps in this trial.</p>
        <p>Over all 342 trials the trapezoid error grows from 4.5 steps at 20 ms to 79 at 200 ms; the left sum is worse at every interval. The wheel turns in brisk movements lasting a few hundred milliseconds, so coarse samples miss them.</p>`;
    }
    data().then(d => { D = d; draw(); });
  });
})();
