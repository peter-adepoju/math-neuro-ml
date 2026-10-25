/* Lesson 21: ODEs and the Passive Membrane. Interactive figures. */
(function () {
  "use strict";
  const { Plane, slider, buttons, player, readout, layout, fmt, C, h } = window.IX;

  /* 1. A perfect capacitor against a leaky membrane. */
  IX.register("capacitor-leak", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 100], y: [-75, -10], xtick: 20, ytick: 10, frame: true, labels: ["time since current onset (ms)", "V (mV)"], width: 480, height: 320, pad: 48, clip: true, title: "Charging a membrane" });
    const side = h("div", {}, L0);
    let I = 100, R = 200;
    slider(side, { label: "Current I (pA)", min: 0, max: 200, step: 5, value: I, onInput: v => { I = v; draw(); } });
    const sr = slider(side, { label: "Leak R (MΩ)", min: 20, max: 1000, step: 10, value: R, onInput: v => { R = v; draw(); } });
    player(side, sr, { bounce: true, interval: 90 });
    const out = readout(side);
    function draw() {
      P.clear();
      const Cm = 100, EL = -70, tau = R * Cm / 1000, Vinf = EL + R * I / 1000;
      P.line([0, EL], [100, EL + I / Cm * 100], { color: C.orange, width: 2, dash: "7 5" });
      const pts = []; for (let t = 0; t <= 100; t += 0.5) pts.push([t, Vinf + (EL - Vinf) * Math.exp(-t / tau)]);
      P.path(pts, { color: C.blue, width: 2.6 });
      P.line([0, Vinf], [100, Vinf], { color: C.muted, dash: "3 4", width: 1.2 });
      out.innerHTML = `<table><tr><td>τ_m = R C</td><td><b>${fmt(tau, 1)} ms</b></td></tr><tr><td>steady level E_L + R I</td><td><b>${fmt(Vinf, 1)} mV</b></td></tr><tr><td>after 50 ms: <span class="k-orange">capacitor</span> / <span class="k-blue">membrane</span></td><td>${fmt(I / Cm * 50, 1)} / ${fmt((Vinf - EL) * (1 - Math.exp(-50 / tau)), 1)} mV moved</td></tr></table>
        <p>A capacitor of 100 pF alone charges at a constant rate I/C (orange dashed). With a leak, the outflow grows with the distance from rest, until it balances the input at the steady level (grey). The bigger the leak resistance, the longer and higher the climb.</p>`;
    }
    draw();
  });

  /* 2. Direction field: solutions never cross. */
  IX.register("direction-field", root => {
    const modes = [{ label: "constant 100 pA" }, { label: "150 pA pulse, 20–60 ms" }];
    let md = 0;
    buttons(root, modes, (it, i) => { md = i; draw(); }, { toggle: true, label: "Input" });
    const P = Plane(root, { x: [0, 100], y: [-95, -35], xtick: 20, ytick: 10, frame: true, labels: ["time (ms)", "V (mV)"], width: 640, height: 330, pad: 48, clip: true, title: "Direction field of the membrane equation" });
    h("p", { class: "ix-hint" }, root, "Drag the black point to choose the starting voltage.");
    const out = readout(root);
    const tau = 20, R = 200, EL = -70, Iof = t => md === 0 ? 100 : t >= 20 && t < 60 ? 150 : 0, f = (V, t) => (-(V - EL) + R * Iof(t) / 1000) / tau;
    let v0 = -90;
    function sol(V0) { const pts = [[0, V0]]; let V = V0; for (let t = 0; t < 100; t += 0.1) { V += 0.1 * f(V, t); pts.push([t + 0.1, V]); } return pts; }
    function draw() {
      P.clear();
      for (let t = 2.5; t < 100; t += 5) for (let V = -92.5; V < -35; V += 5) { const s = f(V, t), L = 1.8, k = L / Math.hypot(1, s * 2); P.line([t - k, V - k * s], [t + k, V + k * s], { color: C.axis, width: 1 }); }
      [-90, -70, -55, -40].forEach((v, i) => P.path(sol(v), { color: [C.sky, C.green, C.purple, C.orange][i], width: 1.4, opacity: 0.7 }));
      P.path(sol(v0), { color: C.blue, width: 2.8 });
      out.innerHTML = `<p>Each short line is the slope dV/dt that the equation prescribes at that time and voltage. A solution is a curve tangent to these slopes everywhere; from your start (${fmt(v0, 1)} mV, thick blue) and from four others (thin), the curves never cross. ${md === 0 ? "The equation is autonomous: the slopes are the same at every time, and every solution relaxes to −50 mV." : "With the pulse the equation is non-autonomous: the slopes change at 20 and 60 ms, and so does the target."}</p>`;
    }
    P.handle([0, v0], { color: C.ink, name: "start", constrain: q => [0, Math.max(-94, Math.min(-36, q[1]))], onMove: q => { v0 = q[1]; draw(); } });
    draw();
  });

  /* 3. The relaxation equation and its time constant. */
  IX.register("relaxation", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 100], y: [0, 1.1], xtick: 20, ytick: 0.2, frame: true, labels: ["time (ms)", "fraction of the way"], width: 480, height: 320, pad: 48, clip: true, title: "Exponential approach" });
    const side = h("div", {}, L0);
    let tau = 20;
    const sl = slider(side, { label: "Time constant τ (ms)", min: 2, max: 50, step: 1, value: tau, onInput: v => { tau = v; draw(); } });
    player(side, sl, { bounce: true, interval: 90 });
    const out = readout(side);
    function draw() {
      P.clear();
      const pts = []; for (let t = 0; t <= 100; t += 0.5) pts.push([t, 1 - Math.exp(-t / tau)]);
      P.line([0, 1], [100, 1], { color: C.muted, dash: "3 4", width: 1.2 });
      P.line([0, 0], [tau, 1], { color: C.vermilion, dash: "6 4", width: 1.6 });
      P.path(pts, { color: C.blue, width: 2.6 });
      [1, 3, 5].forEach(k => { const t = k * tau; if (t <= 100) { P.dot([t, 1 - Math.exp(-k)], { color: C.ink, r: 4.5 }); P.text(k === 1 ? "τ: 63%" : k + "τ: " + fmt(100 * (1 - Math.exp(-k)), 0) + "%", t, 1 - Math.exp(-k), { dx: t > 70 ? -6 : 6, dy: 16, anchor: t > 70 ? "end" : "start", size: 12, color: C.ink, halo: true }); } });
      out.innerHTML = `<p>x(t) = x∞ + (x₀ − x∞) e^(−t/τ), drawn as the fraction of the distance covered. After τ the response is 63% complete, after 3τ 95%, after 5τ over 99%. The half-life is τ ln 2 = ${fmt(tau * Math.LN2, 1)} ms.</p><p>The <span class="k-verm">initial slope</span>, if it were kept up, would arrive in exactly τ.</p>`;
    }
    draw();
  });

  /* 4. The phase line of a recurrent rate unit. */
  IX.register("phase-line", root => {
    const L0 = layout(root, true);
    const P = Plane(L0, { x: [0, 1], y: [-0.3, 0.3], xtick: 0.2, ytick: 0.1, frame: true, labels: ["rate r (fraction of maximum)", "τ dr/dt"], width: 480, height: 320, pad: 48, clip: true, title: "Phase line" });
    const side = h("div", {}, L0);
    let w = 1, I = 0;
    const sw = slider(side, { label: "Recurrent weight w", min: 0, max: 1.5, step: 0.01, value: w, format: v => fmt(v, 2), onInput: v => { w = v; draw(); } });
    slider(side, { label: "Input I", min: -0.5, max: 0.8, step: 0.01, value: I, format: v => fmt(v, 2), onInput: v => { I = v; draw(); } });
    player(side, sw, { bounce: true, interval: 90 });
    const out = readout(side);
    const F = x => 1 / (1 + Math.exp(-(x - 0.5) / 0.08));
    function draw() {
      P.clear();
      const g = r => -r + F(w * r + I), pts = []; for (let r = 0; r <= 1.0001; r += 0.002) pts.push([r, g(r)]);
      P.line([0, 0], [1, 0], { color: C.ink, width: 1.2 });
      P.path(pts, { color: C.blue, width: 2.4 });
      for (let r = 0.05; r < 1; r += 0.1) { const s = Math.sign(g(r)); if (Math.abs(g(r)) > 0.004) P.text(s > 0 ? "▶" : "◀", r, 0, { dy: 5, anchor: "middle", size: 12, color: C.orange }); }
      const eq = []; for (let r = 0; r < 1; r += 0.0005) { if (g(r) * g(r + 0.0005) <= 0) { const z = r + 0.00025, sl = (g(z + 1e-4) - g(z - 1e-4)) / 2e-4; eq.push([z, sl < 0]); } }
      eq.forEach(([r, st]) => P.dot([r, 0], st ? { color: C.green, r: 7, stroke: "#fff" } : { fill: "#fff", stroke: C.ink, sw: 2, r: 7 }));
      out.innerHTML = `<p>τ dr/dt = −r + F(w r + I), with a sigmoid F. Where the curve is above zero, r grows (arrows right); below, it shrinks. Equilibria are the zero crossings: <span class="k-green">stable</span> (filled) where the slope is negative, unstable (open) where it is positive.</p><p>${eq.length > 1 ? `<b>${eq.length} equilibria</b>: the unit is bistable. The unstable one is a threshold, and the unit remembers which side it started on: a model of persistent activity.` : "One equilibrium: every start ends in the same place."}</p>`;
    }
    draw();
  });

  /* 5. The membrane as integrator and low-pass filter. */
  IX.register("membrane-filter", root => {
    const modes = [{ label: "pulses of equal charge" }, { label: "two brief pulses" }, { label: "sinusoidal current" }];
    let md = 0, par = [10, 10, 8];
    const grid = buttons(root, modes, (it, i) => { md = i; sl.set(par[i]); setLabel(); draw(); }, { toggle: true, label: "Input" });
    void grid;
    const P = Plane(root, { x: [0, 200], y: [-72, -45], xtick: 25, ytick: 5, frame: true, labels: ["time (ms)", "V (mV)"], width: 640, height: 300, pad: 48, clip: true, title: "Membrane response" });
    const ctl = h("div", { class: "ix-controls-row" }, root);
    const sl = slider(ctl, { label: "Pulse duration (ms)", min: 1, max: 60, step: 1, value: par[0], onInput: v => { par[md] = v; draw(); } });
    const lab = sl.input.closest("label") ? sl.input.closest("label").querySelector("span") : null;
    function setLabel() { if (lab) lab.textContent = ["Pulse duration (ms)", "Gap between pulses (ms)", "Frequency (Hz)"][md]; }
    player(ctl, sl, { bounce: true, interval: 120 });
    const out = readout(root);
    const tau = 20, R = 200, EL = -70;
    function draw() {
      P.clear();
      const p = par[md], Iof = t => { if (md === 0) return t >= 20 && t < 20 + p ? 2000 / p : 0; if (md === 1) return (t >= 20 && t < 21) || (t >= 20 + p && t < 21 + p) ? 400 : 0; return t >= 20 ? 50 * Math.sin(2 * Math.PI * p * (t - 20) / 1000) : 0; };
      let V = EL, peak = EL; const pts = [[0, V]], ipts = [];
      for (let t = 0; t < 200; t += 0.05) { const Ii = Iof(t); V += 0.05 * (-(V - EL) + R * Ii / 1000) / tau; pts.push([t + 0.05, V]); peak = Math.max(peak, V); }
      for (let t = 0; t < 200; t += 0.25) ipts.push([t, -71 + Iof(t) / (md === 2 ? 25 : md === 1 ? 100 : 250)]);
      P.path(ipts, { color: C.muted, width: 1.2 });
      P.path(pts, { color: C.blue, width: 2.4 });
      let msg;
      if (md === 0) msg = `A charge of 2 pC delivered over ${p} ms (grey: the current, scaled). Peak deflection <b>${fmt(peak - EL, 1)} mV</b>; with no leak it would be Q/C = 20 mV. Inputs much shorter than τ_m = 20 ms are integrated; long ones leak away as they arrive.`;
      else if (md === 1) msg = `Two 1 ms pulses ${p} ms apart. Peak <b>${fmt(peak - EL, 1)} mV</b>, against ${fmt(4 * (1 - Math.exp(-1 / 20)) * 20 / 1, 1)} mV for one pulse alone. The first pulse's effect has decayed to e^(−${p}/20) = ${fmt(Math.exp(-p / 20), 2)} when the second arrives: τ_m is the integration window.`;
      else { const amp = R * 50 / 1000 / Math.sqrt(1 + (2 * Math.PI * p * tau / 1000) ** 2); msg = `A ${p} Hz sinusoidal current of 50 pA. Steady amplitude R I₀ / √(1 + (2π f τ_m)²) = <b>${fmt(amp, 2)} mV</b>, against ${fmt(R * 50 / 1000, 0)} mV for very slow input: the membrane is a low-pass filter with cutoff 1/(2π τ_m) ≈ 8 Hz.`; }
      out.innerHTML = `<p>${msg}</p>`;
    }
    draw();
  });

  /* 6. Euler's method: accuracy and stability. */
  IX.register("euler-steps", root => {
    const grid = h("div", { class: "ix-two" }, root);
    const b1 = h("div", {}, grid), b2 = h("div", {}, grid);
    h("p", { class: "ix-panel-title" }, b1, "Exact solution and Euler steps");
    h("p", { class: "ix-panel-title" }, b2, "Global error against step (log–log)");
    const P = Plane(b1, { x: [0, 100], y: [-90, -20], xtick: 20, ytick: 10, frame: true, labels: ["time (ms)", "V (mV)"], width: 380, height: 320, pad: 44, clip: true, title: "Steps" });
    const Q = Plane(b2, { x: [-1.5, 1.8], y: [-2.5, 2.5], noXTicks: true, noYTicks: true, frame: true, labels: ["Δt (ms)", "max error (mV)"], width: 380, height: 320, pad: 44, clip: true, title: "Error" });
    ["0.1", "1", "10"].forEach((s, i) => Q.text(s, i - 1, -2.5, { dy: 18, anchor: "middle", size: 12, color: C.muted, layer: Q.back }));
    ["0.01", "0.1", "1", "10", "100"].forEach((s, i) => Q.text(s, -1.5, i - 2, { dx: -6, dy: 4, anchor: "end", size: 12, color: C.muted, layer: Q.back }));
    const ctl = h("div", { class: "ix-controls-row" }, root);
    let r = 0.5, expo = false;
    const sl = slider(ctl, { label: "Step Δt / τ", min: 0.05, max: 2.6, step: 0.05, value: r, format: v => fmt(v, 2), onInput: v => { r = v; draw(); } });
    player(ctl, sl, { bounce: true, interval: 120 });
    buttons(ctl, [{ label: "Euler" }, { label: "exponential update" }], (it, i) => { expo = i === 1; draw(); }, { toggle: true, label: "Method" });
    const out = readout(root);
    const tau = 20, Vinf = -50, V0 = -70, ex = t => Vinf + (V0 - Vinf) * Math.exp(-t / tau);
    function steps(dt) { const pts = [[0, V0]]; let V = V0; for (let t = 0; t < 100 - 1e-9; t += dt) { V = expo ? Vinf + (V - Vinf) * Math.exp(-dt / tau) : V + dt * (-(V - Vinf)) / tau; pts.push([t + dt, V]); } return pts; }
    const err = dt => Math.max(...steps(dt).map(([t, V]) => Math.abs(V - ex(t))));
    function draw() {
      P.clear(); Q.clear();
      const pts = []; for (let t = 0; t <= 100; t += 0.5) pts.push([t, ex(t)]); P.path(pts, { color: C.ink, width: 2.4 });
      const dt = r * tau, s = steps(dt); P.path(s, { color: C.vermilion, width: 1.6, dash: "5 4" }); s.forEach(p => P.dot(p, { color: C.vermilion, r: 4, sw: 0 }));
      const e = []; for (let l = -1.2; l <= 1.73; l += 0.05) { const d = Math.pow(10, l); if (!expo || true) e.push([l, Math.log10(Math.max(err(d), 1e-12))]); }
      Q.path(e, { color: C.blue, width: 2 });
      const cur = err(dt); Q.dot([Math.log10(dt), Math.log10(Math.max(cur, 1e-12))], { color: C.vermilion, r: 6 });
      const m = 1 - r;
      out.innerHTML = `<table><tr><td>Δt</td><td>${fmt(dt, 1)} ms</td></tr><tr><td>${expo ? "factor per step e^(−Δt/τ)" : "factor per step 1 − Δt/τ"}</td><td><b>${fmt(expo ? Math.exp(-r) : m, 2)}</b></td></tr><tr><td>max error over 100 ms</td><td><b>${fmt(cur, 3)} mV</b></td></tr></table>
        <p>${expo ? "The exponential update is exact for constant input, so the error is at rounding level for every step: always stable." : r < 1 ? "Below Δt = τ the steps approach monotonically; halving Δt halves the error (slope 1 on the right: first order)." : r < 2 ? "Between τ and 2τ the factor is negative: the steps overshoot and oscillate while decaying. The oscillation is a numerical artefact, not in the model." : "Beyond 2τ the factor exceeds 1 in size: the steps grow without bound, although the true solution decays."} Keep Δt below a tenth of the fastest time constant, and check by halving it.</p>`;
    }
    draw();
  });
})();
