/* Lesson 22: Leaky Integrate-and-Fire Neurons. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h } = window.IX;
  function uni(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = u => Math.sqrt(-2 * Math.log(u() || 1e-12)) * Math.cos(2 * Math.PI * u());
  const bar = (P, x0, x1, y, col, op = 0.85) => P.path([[x0, 0], [x1, 0], [x1, y], [x0, y]], { close: true, fill: col, fillOpacity: op, color: col, width: 1 });
  const D = { EL: -70, th: -50, Vr: -65, tau: 20, R: 100, tref: 2 };
  const rateF = (I, p) => { const Vi = p.EL + p.R * I / 1000; if (Vi <= p.th) return 0; return 1000 / (p.tref + p.tau * Math.log((Vi - p.Vr) / (Vi - p.th))); };
  /* Simulate an LIF (exact update between steps, interpolated crossings); returns {V: [[t,V]], spikes} */
  function lif(Iof, T, p, opts = {}) {
    const dt = opts.dt || 0.05, u = opts.u, sg = opts.sigma || 0, pts = [], spk = []; let V = p.EL, ref = 0;
    for (let t = 0; t < T; t += dt) {
      if (ref > 0) { ref -= dt; V = p.Vr; if (ref < 0) { const Vi0 = p.EL + p.R * Iof(t) / 1000; V = Vi0 + (p.Vr - Vi0) * Math.exp(ref / p.tau); ref = 0; } if (opts.keep) pts.push([t + dt, V]); continue; }
      const Vi = p.EL + p.R * Iof(t) / 1000;
      let Vn = Vi + (V - Vi) * Math.exp(-dt / p.tau);
      if (sg) Vn += sg * Math.sqrt(2 * dt / p.tau) * gauss(u);
      if (opts.jumps) Vn += opts.jumps(t, dt);
      if (Vn >= p.th) { const ts = t + dt * (p.th - V) / Math.max(Vn - V, 1e-9); spk.push(ts); if (opts.keep) { pts.push([ts, p.th]); pts.push([ts, 20]); pts.push([ts, p.Vr]); } V = p.Vr; ref = p.tref - (t + dt - ts); continue; }
      V = Vn; if (opts.keep) pts.push([t + dt, V]);
    }
    return { pts, spk };
  }
  const isiStats = s => { const d = s.slice(1).map((v, i) => v - s[i]); if (d.length < 2) return { m: NaN, cv: NaN, d }; const m = d.reduce((a, b) => a + b) / d.length, sd = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / (d.length - 1)); return { m, cv: sd / m, d }; };

  /* 1. Threshold, reset and a regular spike train. */
  IX.register("lif-trace", root => {
    const P = Plane(root, { x: [0, 300], y: [-75, 25], xtick: 50, ytick: 20, frame: true, labels: ["time (ms)", "V (mV)"], width: 640, height: 280, pad: 48, clip: true, title: "LIF response to a current step" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let I = 250;
    const sl = slider(ctl, { label: "Step current I (pA)", min: 0, max: 600, step: 5, value: I, onInput: v => { I = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 80 });
    const out = readout(root);
    function draw() {
      P.clear();
      P.line([0, D.th], [300, D.th], { color: C.muted, dash: "4 4", width: 1.2 });
      P.text("threshold θ", 300, D.th, { dy: -6, anchor: "end", size: 12, color: C.muted, halo: true });
      const r = lif(t => t >= 50 && t < 250 ? I : 0, 300, D, { keep: true, dt: 0.05 });
      P.path(r.pts, { color: C.blue, width: 1.8 });
      const Vi = D.EL + D.R * I / 1000, st = isiStats(r.spk);
      out.innerHTML = `<table><tr><td>V∞ = E_L + R I</td><td>${fmt(Vi, 1)} mV</td></tr><tr><td>rheobase (θ − E_L)/R</td><td>200 pA</td></tr><tr><td>spikes in the 200 ms step</td><td><b>${r.spk.length}</b>${r.spk.length > 1 ? `, ISI ${fmt(st.m, 1)} ms` : ""}</td></tr></table>
        <p>Between spikes the LIF is Lesson 21's passive membrane. When V reaches θ = −50 mV a spike is recorded (drawn as a vertical line), V is reset to −65 mV and held there for 2 ms. ${I <= 200 ? "Below rheobase V∞ stays under threshold: no spikes, however long the step." : "Above rheobase the climb from reset to threshold repeats exactly: a perfectly regular train."}</p>`;
    }
    draw();
  });

  /* 2. The F–I curve and its parameters. */
  IX.register("fi-curve", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 1000], y: [0, 320], xtick: 200, ytick: 50, frame: true, labels: ["injected current I (pA)", "rate (spikes/s)"], width: 480, height: 330, pad: 48, clip: true, title: "F–I curve" });
    const side = h("div", {}, L0);
    const p = Object.assign({}, D);
    const st = slider(side, { label: "τ_m (ms)", min: 5, max: 50, step: 1, value: p.tau, onInput: v => { p.tau = v; draw(); } });
    slider(side, { label: "R_m (MΩ)", min: 50, max: 300, step: 5, value: p.R, onInput: v => { p.R = v; draw(); } });
    slider(side, { label: "V_reset (mV)", min: -70, max: -52, step: 0.5, value: p.Vr, format: v => fmt(v, 1), onInput: v => { p.Vr = v; draw(); } });
    slider(side, { label: "t_ref (ms)", min: 0, max: 10, step: 0.5, value: p.tref, format: v => fmt(v, 1), onInput: v => { p.tref = v; draw(); } });
    player(side, st, { bounce: true, interval: 90 });
    const out = readout(side);
    const curve = q => { const pts = []; for (let I = 0; I <= 1000; I += 1) pts.push([I, rateF(I, q)]); return pts; };
    function draw() {
      P.clear();
      P.path(curve(D), { color: C.muted, width: 1.6, dash: "6 4" });
      P.path(curve(p), { color: C.blue, width: 2.6 });
      const rh = (p.th - p.EL) / p.R * 1000; P.line([rh, 0], [rh, 320], { color: C.vermilion, dash: "4 4", width: 1.4 });
      if (p.tref > 0) P.line([0, 1000 / p.tref], [1000, 1000 / p.tref], { color: C.ink, dash: "2 4", width: 1 });
      out.innerHTML = `<table><tr><td><span class="k-verm">rheobase</span> (θ − E_L)/R_m</td><td><b>${fmt(rh, 0)} pA</b></td></tr><tr><td>rate at 300 pA</td><td><b>${fmt(rateF(300, p), 1)}</b> spikes/s</td></tr><tr><td>ceiling 1/t_ref</td><td>${p.tref > 0 ? fmt(1000 / p.tref, 0) + " spikes/s" : "none"}</td></tr></table>
        <p>T(I) = t_ref + τ_m ln[(V∞ − V_reset)/(V∞ − θ)], f = 1/T. Grey dashed: the default neuron. The rate rises from zero with infinite slope at rheobase, then roughly linearly. R_m sets the rheobase; τ_m leaves it alone but stretches every interval; a reset nearer threshold shortens intervals.</p>`;
    }
    draw();
  });

  /* 3. Mean-driven against fluctuation-driven firing. */
  IX.register("noise-drive", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Membrane potential, first 500 ms");
    h("p", { class: "ix-panel-title" }, b2, "Interspike intervals over 5 s");
    const P = Plane(b1, { x: [0, 500], y: [-75, 25], xtick: 100, ytick: 20, frame: true, labels: ["time (ms)", "V (mV)"], width: 380, height: 300, pad: 44, clip: true, title: "Trace" });
    const Q = Plane(b2, { x: [0, 200], y: [0, 0.5], xtick: 50, noYTicks: true, frame: true, labels: ["ISI (ms)", ""], width: 380, height: 300, pad: 36, clip: true, title: "ISI histogram" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let I = 170, sg = 4;
    slider(ctl, { label: "Mean current (pA)", min: 100, max: 350, step: 5, value: I, onInput: v => { I = v; draw(); } });
    const ss = slider(ctl, { label: "Noise σ (mV)", min: 0, max: 6, step: 0.25, value: sg, format: v => fmt(v, 2), onInput: v => { sg = v; draw(); } });
    player(ctl, ss, { bounce: true, interval: 250 });
    const out = readout(root);
    function draw() {
      P.clear(); Q.clear();
      const r = lif(() => I, 5000, D, { dt: 0.1, sigma: sg, u: uni(22), keep: true });
      P.line([0, D.th], [500, D.th], { color: C.muted, dash: "4 4", width: 1.2 });
      P.path(r.pts.filter(q => q[0] <= 500), { color: I > 200 ? C.blue : C.vermilion, width: 1.4 });
      const st = isiStats(r.spk), bins = {}; st.d.forEach(v => { const b = Math.floor(v / 5); bins[b] = (bins[b] || 0) + 1; });
      Object.entries(bins).forEach(([b, c]) => bar(Q, b * 5, b * 5 + 5, c / Math.max(st.d.length, 1), I > 200 ? C.blue : C.vermilion, 0.75));
      out.innerHTML = `<table><tr><td>mean current vs rheobase</td><td>${I} pA ${I > 200 ? "&gt;" : "≤"} 200 pA</td></tr><tr><td>rate</td><td><b>${fmt(r.spk.length / 5, 1)}</b> spikes/s</td></tr><tr><td>ISI CV</td><td><b>${isFinite(st.cv) ? fmt(st.cv, 2) : "–"}</b></td></tr></table>
        <p>Gaussian membrane noise of SD σ, added by Euler–Maruyama with the √Δt scaling. <span class="k-blue">Mean-driven</span> (above rheobase): the mean alone reaches threshold, and noise only jitters a regular train (low CV). <span class="k-verm">Fluctuation-driven</span> (below rheobase): only the fluctuations reach threshold, so spikes are irregular, with CV approaching 1.</p>`;
    }
    draw();
  });

  /* 4. Noise smooths the F–I curve. */
  IX.register("noise-fi", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 500], y: [0, 105], xtick: 100, ytick: 20, frame: true, labels: ["mean current (pA)", "rate (spikes/s)"], width: 480, height: 320, pad: 48, clip: true, title: "F–I curve with noise" });
    const side = h("div", {}, L0);
    const sgs = [0, 1, 2, 3, 5, 7];
    let k = 4;
    const sl = slider(side, { label: "Noise σ (mV)", min: 0, max: sgs.length - 1, step: 1, value: k, format: v => String(sgs[v]), onInput: v => { k = v; draw(); } });
    player(side, sl, { interval: 700 });
    const out = readout(side);
    const cache = {};
    function sim(sg) { if (cache[sg]) return cache[sg]; const pts = []; for (let I = 0; I <= 500; I += 25) { const r = lif(() => I, 3000, D, { dt: 0.1, sigma: sg, u: uni(I + 7) }); pts.push([I, r.spk.length / 3]); } return (cache[sg] = pts); }
    function draw() {
      P.clear();
      const f = []; for (let I = 0; I <= 500; I += 1) f.push([I, rateF(I, D)]); P.path(f, { color: C.ink, width: 2 });
      P.line([200, 0], [200, 105], { color: C.muted, dash: "4 4", width: 1 });
      const s = sim(sgs[k]); P.path(s, { color: C.green, width: 2, dash: "6 4" }); s.forEach(q => P.dot(q, { color: C.green, r: 4, sw: 0 }));
      const at = I => s.find(q => q[0] === I)[1];
      out.innerHTML = `<table><tr><td>rate at 150 pA (below rheobase)</td><td><b>${fmt(at(150), 1)}</b> spikes/s</td></tr><tr><td>rate at 200 pA (rheobase)</td><td>${fmt(at(200), 1)}</td></tr><tr><td>rate at 400 pA</td><td>${fmt(at(400), 1)} (formula ${fmt(rateF(400, D), 1)})</td></tr></table>
        <p>Black: the noise-free formula. <span class="k-green">Green</span>: simulated rates over 3 s with membrane noise σ. Noise lets the neuron fire below rheobase and rounds off the sharp corner; well above rheobase it changes little. The mean input alone does not decide the output rate.</p>`;
    }
    draw();
  });

  /* 5. Poisson synaptic drive and Campbell's theorem. */
  IX.register("poisson-drive", root => {
    const P = Plane(root, { x: [0, 500], y: [-75, 25], xtick: 100, ytick: 20, frame: true, labels: ["time (ms)", "V (mV)"], width: 640, height: 260, pad: 48, clip: true, title: "LIF driven by Poisson inputs" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let lam = 2000, J = 0.5;
    const sl = slider(ctl, { label: "Input rate λ (per s)", min: 500, max: 4000, step: 100, value: lam, onInput: v => { lam = v; draw(); } });
    slider(ctl, { label: "Jump J (mV)", min: 0.1, max: 2, step: 0.05, value: J, format: v => fmt(v, 2), onInput: v => { J = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 300 });
    const out = readout(root);
    function draw() {
      P.clear();
      const u = uni(2200), jumps = (t, dt) => { const m = lam * dt / 1000; let k = 0, p = Math.exp(-m), s = p, x = u(); while (x > s) { k++; p *= m / k; s += p; } return k * J; };
      const r = lif(() => 0, 5000, D, { dt: 0.1, jumps, keep: true });
      P.line([0, D.th], [500, D.th], { color: C.muted, dash: "4 4", width: 1.2 });
      P.path(r.pts.filter(q => q[0] <= 500), { color: C.blue, width: 1.3 });
      const mu = J * lam * D.tau / 1000, sdv = Math.sqrt(J * J * lam * D.tau / 1000 / 2), st = isiStats(r.spk);
      out.innerHTML = `<table><tr><td>Campbell: mean depolarisation J λ τ_m</td><td><b>${fmt(mu, 1)} mV</b> (mean V∞ = ${fmt(D.EL + mu, 1)} mV)</td></tr><tr><td>Campbell: SD √(J² λ τ_m / 2)</td><td>${fmt(sdv, 2)} mV</td></tr><tr><td>output rate over 5 s</td><td><b>${fmt(r.spk.length / 5, 1)}</b> spikes/s</td></tr><tr><td>ISI CV</td><td>${isFinite(st.cv) ? fmt(st.cv, 2) : "–"}</td></tr></table>
        <p>Each input arrives at a Poisson time and kicks V up by J. Many small kicks per τ_m look like Gaussian noise (the diffusion approximation). Fewer, larger kicks with the same mean give bigger fluctuations and more irregular output.</p>`;
    }
    draw();
  });

  /* 6. Event handling: grid-locked against interpolated spike times. */
  IX.register("event-timing", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [-2, 0.2], y: [-6.5, 0.5], noXTicks: true, noYTicks: true, frame: true, labels: ["time step Δt (ms, log scale)", "|rate error| (spikes/s)"], width: 480, height: 330, pad: 52, clip: true, title: "Rate error against time step" });
    ["0.01", "0.1", "1"].forEach((s, i) => P.text(s, i - 2, -6.5, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: P.back }));
    [["10⁻⁶", -6], ["10⁻⁴", -4], ["10⁻²", -2], ["1", 0]].forEach(([lab, v]) => P.text(lab, -2, v, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: P.back }));
    const side = h("div", {}, L0);
    const dts = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];
    let k = 0;
    const sl = slider(side, { label: "Δt (ms)", min: 0, max: dts.length - 1, step: 1, value: k, format: v => String(dts[v]), onInput: v => { k = v; draw(); } });
    player(side, sl, { interval: 600 });
    const out = readout(side);
    const truth = rateF(300, D);
    function exactRate(dt) { const r = lif(() => 300, 2000, D, { dt }); const s = r.spk; return (s.length - 1) / (s[s.length - 1] - s[0]) * 1000; }
    function gridRate2(dt) { let V = D.EL, ref = 0; const s = []; for (let t = 0; t < 2000; t += dt) { if (ref > 0) { ref -= dt; V = D.Vr; continue; } V += dt * (-(V - D.EL) + D.R * 0.3) / D.tau; if (V >= D.th) { s.push(t + dt); V = D.Vr; ref = D.tref; } } return (s.length - 1) / (s[s.length - 1] - s[0]) * 1000; }
    const eg = dts.map(d => Math.abs(gridRate2(d) - truth)), ee = dts.map(d => Math.abs(exactRate(d) - truth));
    function draw() {
      P.clear();
      const L = v => Math.log10(Math.max(v, 1e-7));
      P.path(dts.map((d, i) => [Math.log10(d), L(eg[i])]), { color: C.vermilion, width: 2 }); dts.forEach((d, i) => P.dot([Math.log10(d), L(eg[i])], { color: C.vermilion, r: i === k ? 7 : 4 }));
      P.path(dts.map((d, i) => [Math.log10(d), L(ee[i])]), { color: C.blue, width: 2, dash: "6 4" }); dts.forEach((d, i) => P.dot([Math.log10(d), L(ee[i])], { color: C.blue, r: i === k ? 7 : 4 }));
      out.innerHTML = `<table><tr><td>formula at 300 pA</td><td>${fmt(truth, 3)} spikes/s</td></tr><tr><td><span class="k-verm">Euler, spikes on the grid</span></td><td><b>${fmt(eg[k], 3)}</b> off</td></tr><tr><td><span class="k-blue">exact update + interpolated crossing</span></td><td><b>${fmt(ee[k], 5)}</b> off</td></tr></table>
        <p>Detecting the threshold only at grid points delays each spike, and so each reset, by up to Δt: a first-order error that does not average out. Interpolating the crossing time and starting the reset from it makes the error fall like Δt². Always rerun with half the step.</p>`;
    }
    draw();
  });
})();
