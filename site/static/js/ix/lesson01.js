/* Lesson 1: Vectors as Representations. Interactive figures. */
(function () {
  "use strict";
  const { Plane, controls, slider, buttons, player, readout, layout, bars, fmt, tex, C, h } = window.IX;
  const norm = v => Math.hypot(...v);
  const vec = v => "(" + v.map(x => fmt(x, 2)).join(", ") + ")";

  /* 1. Three views of one vector: a list, an arrow that can start anywhere, a point. */
  IX.register("vector-views", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-6, 6], y: [-5, 5], labels: ["x₁", "x₂"], title: "The vector v as an arrow and as a point" });
    const side = h("div", {}, L);
    let view = "all";
    buttons(side, [{ label: "All three", v: "all" }, { label: "Arrow", v: "arrow" }, { label: "Point", v: "point" }], it => { view = it.v; draw(); }, { toggle: true, label: "Show" });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag the blue dot to change v. Drag the orange dot to move where the arrow starts: the arrow moves, but v does not change.");
    let v = [4, -2], s = [-3, 2];
    function draw() {
      P.clear();
      if (view !== "point") {
        P.arrow([0, 0], v, { color: C.blue, width: 2, dash: "5 5", opacity: 0.5 });
        P.arrow(s, [s[0] + v[0], s[1] + v[1]], { color: C.blue, width: 3.5, label: "v" });
        P.dot(s, { color: C.orange, r: 4 });
      }
      if (view !== "arrow") {
        P.line([v[0], 0], v, { dash: "4 4" }); P.line([0, v[1]], v, { dash: "4 4" });
        P.dot(v, { color: C.vermilion, r: 7 });
        P.text(`(${fmt(v[0], 1)}, ${fmt(v[1], 1)})`, v[0], v[1], { dx: 10, dy: v[1] >= 0 ? -10 : 20, weight: 600, color: C.vermilion, halo: true });
      }
      out.innerHTML = `<table>
        <tr><td>As a list</td><td><span class="big">[${fmt(v[0], 1)}, ${fmt(v[1], 1)}]</span><br>two numbers, in order</td></tr>
        <tr><td>As an arrow</td><td><span class="k-blue">move ${fmt(v[0], 1)} along x₁ and ${fmt(v[1], 1)} along x₂</span>, from wherever you start: here from (${fmt(s[0], 1)}, ${fmt(s[1], 1)}) to (${fmt(s[0] + v[0], 1)}, ${fmt(s[1] + v[1], 1)})</td></tr>
        <tr><td>As a point</td><td><span class="k-verm">the location (${fmt(v[0], 1)}, ${fmt(v[1], 1)})</span>: a state, measured from the origin</td></tr></table>`;
    }
    const hv = P.handle(v, { color: C.blue, name: "tip of v", snap: 0.5, onMove: p => { v = p; hs.set([Math.min(s[0], 6 - v[0]), s[1]], true); draw(); } });
    const hs = P.handle(s, { color: C.orange, name: "start of the arrow", snap: 0.5,
      constrain: q => [Math.max(-6 - Math.min(0, v[0]), Math.min(6 - Math.max(0, v[0]), q[0])), Math.max(-5 - Math.min(0, v[1]), Math.min(5 - Math.max(0, v[1]), q[1]))],
      onMove: p => { s = p; draw(); } });
    draw();
  });

  /* 2. A population response as bars, as a list and as a point in state space. */
  IX.register("population-vector", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), right = h("div", {}, L);
    const P = Plane(left, { x: [0, 60], y: [0, 60], grid: 10, tick: 10, labels: ["N1 (spikes/s)", "N2 (spikes/s)"], width: 460, height: 400, title: "State space of neurons N1 and N2" });
    const B = bars(right, { labels: ["N1", "N2", "N3"], max: 60, colors: [C.blue, C.orange, C.green], title: "Firing rates (spikes/s)", height: 190 });
    const out = readout(right);
    let r = [12, 4, 19];
    const presets = [{ label: "Stimulus 1", r: [12, 4, 19] }, { label: "Stimulus 2", r: [50, 8, 33] }];
    const sl = ["N1", "N2", "N3"].map((n, i) => slider(right, { label: n, min: 0, max: 60, step: 1, value: r[i], format: v => v + " /s", onInput: v => { r[i] = v; sync(); draw(); } }));
    let anim = null;
    function moveTo(target) {          // glide from the current state to a preset, so the change of state is visible
      cancelAnimationFrame(anim); const from = r.slice(), t0 = performance.now(), dur = 900;
      const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stepf = now => {
        const k = reduce ? 1 : Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        r = from.map((a, i) => Math.round(a + (target[i] - a) * e)); sl.forEach((s, i) => s.set(r[i])); sync(); draw();
        if (k < 1) anim = requestAnimationFrame(stepf);
      };
      anim = requestAnimationFrame(stepf);
    }
    buttons(right, presets, it => moveTo(it.r), { label: "Go to" });
    const hd = P.handle([r[0], r[1]], { color: C.vermilion, name: "state of N1 and N2", snap: 1, onMove: p => { r[0] = p[0]; r[1] = p[1]; sl[0].set(p[0]); sl[1].set(p[1]); draw(); } });
    function sync() { hd.set([r[0], r[1]], true); }
    function draw() {
      P.clear();
      presets.forEach((pr, i) => { P.dot([pr.r[0], pr.r[1]], { fill: "#fff", stroke: C.muted, sw: 1.5, r: 5 }); P.text(pr.label, pr.r[0], pr.r[1], { dx: 8, dy: -6, size: 12, color: C.muted }); });
      P.line([r[0], 0], [r[0], r[1]], { dash: "4 4" }); P.line([0, r[1]], [r[0], r[1]], { dash: "4 4" });
      P.arrow([0, 0], [r[0], r[1]], { color: C.vermilion, width: 2, opacity: 0.45 });
      B.update(r);
      out.innerHTML = `<p class="big">r = (<span class="k-blue">${r[0]}</span>, <span class="k-orange">${r[1]}</span>, <span class="k-green">${r[2]}</span>) spikes/s</p>
        <p>One population state is one vector with three coordinates. The plane shows N1 and N2 only; N3 would need a third axis, and 100 neurons would need 100 axes, but the mathematics does not change.</p>`;
    }
    draw();
  });

  /* 3. Addition, subtraction and scaling. */
  IX.register("add-scale", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-6, 6], y: [-5, 5], title: "Vector arithmetic" });
    const side = h("div", {}, L);
    let mode = "add", u = [3, 1], v = [1, 3], c = 1.5;
    buttons(side, [{ label: "u + v", m: "add" }, { label: "u − v", m: "sub" }, { label: "c u", m: "scale" }], it => { mode = it.m; draw(); }, { toggle: true, label: "Operation" });
    const cs = slider(side, { label: "c", min: -2, max: 2.5, step: 0.1, value: c, onInput: x => { c = x; draw(); } });
    const cplay = player(side, cs, { bounce: true, interval: 90 });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag the tips of u (blue) and v (orange).");
    function draw() {
      P.clear();
      cs.input.disabled = mode !== "scale"; cplay.disabled = mode !== "scale";
      if (mode === "add") {
        const w = [u[0] + v[0], u[1] + v[1]];
        P.path([[0, 0], u, w, v], { close: true, fill: C.green, fillOpacity: 0.07, color: "none" });
        P.arrow(u, w, { color: C.orange, width: 2, dash: "6 5", opacity: 0.7 });
        P.arrow(v, w, { color: C.blue, width: 2, dash: "6 5", opacity: 0.7 });
        P.arrow([0, 0], w, { color: C.green, width: 3.5, label: "u + v" });
        out.innerHTML = `<p><span class="k-blue">u</span> + <span class="k-orange">v</span> = ${vec(u)} + ${vec(v)} = <span class="k-green">${vec(w)}</span></p><p>Walk along u then v, or along v then u: both routes end at the same point, the far corner of the parallelogram.</p>`;
      } else if (mode === "sub") {
        const w = [u[0] - v[0], u[1] - v[1]];
        P.arrow(v, u, { color: C.green, width: 3.5, label: "u − v" });
        P.arrow([0, 0], w, { color: C.green, width: 2, dash: "6 5", opacity: 0.6 });
        out.innerHTML = `<p><span class="k-blue">u</span> − <span class="k-orange">v</span> = ${vec(u)} − ${vec(v)} = <span class="k-green">${vec(w)}</span></p><p>The difference is the arrow that starts at v's tip and ends at u's tip: the change of state from v to u. The dashed copy starts at the origin.</p>`;
      } else {
        const w = [c * u[0], c * u[1]];
        P.line([-12 * u[0], -12 * u[1]], [12 * u[0], 12 * u[1]], { dash: "3 5", color: C.grid, width: 1.5 });
        P.arrow([0, 0], w, { color: C.green, width: 3.5, label: `${fmt(c, 1)} u` });
        out.innerHTML = `<p>${fmt(c, 1)} × ${vec(u)} = <span class="k-green">${vec(w)}</span></p><p>${c < 0 ? "A negative scalar flips the arrow to point the opposite way." : c === 0 ? "Scaling by 0 gives the zero vector." : "A positive scalar stretches or shrinks the arrow without turning it: the same pattern at a different strength."} Length: ${fmt(Math.abs(c), 1)} × ${fmt(norm(u))} = ${fmt(norm(w))}.</p>`;
      }
      P.arrow([0, 0], u, { color: C.blue, width: 3, label: "u", ldx: 6, ldy: 16 });
      if (mode !== "scale") P.arrow([0, 0], v, { color: C.orange, width: 3, label: "v", ldx: -18, ldy: -4 });
      hv.g.style.display = mode === "scale" ? "none" : "";
    }
    const hu = P.handle(u, { color: C.blue, name: "tip of u", snap: 0.5, onMove: p => { u = p; draw(); } });
    const hv = P.handle(v, { color: C.orange, name: "tip of v", snap: 0.5, onMove: p => { v = p; draw(); } });
    draw();
  });

  /* 4. The norm from Pythagoras, in two and three dimensions. */
  IX.register("norm-pythagoras", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-1, 7], y: [-1, 6], labels: ["v₁", "v₂"], width: 480, height: 380, title: "Length of v by Pythagoras" });
    const side = h("div", {}, L);
    let v = [3, 4], v3 = 0;
    const s3 = slider(side, { label: "v₃ (third coordinate)", min: 0, max: 12, step: 1, value: 0, onInput: x => { v3 = x; draw(); } });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag the tip of v. Add a third coordinate with the slider to apply Pythagoras a second time.");
    function draw() {
      P.clear();
      P.path([[0, 0], [v[0], 0], v], { color: "none", fill: C.green, fillOpacity: 0.08 });
      P.line([0, 0], [v[0], 0], { color: C.blue, width: 4 });
      P.line([v[0], 0], v, { color: C.orange, width: 4 });
      if (Math.abs(v[0]) > 0.3 && Math.abs(v[1]) > 0.3) {
        const sx = Math.sign(v[0]) * 0.3, sy = Math.sign(v[1]) * 0.3;
        P.path([[v[0] - sx, 0], [v[0] - sx, sy], [v[0], sy]], { color: C.muted, width: 1.2 });
      }
      P.arrow([0, 0], v, { color: C.green, width: 3.5 });
      P.text(`|v₁| = ${fmt(Math.abs(v[0]), 1)}`, v[0] / 2, 0, { dy: 18, anchor: "middle", color: C.blue, weight: 600, halo: true });
      P.text(`|v₂| = ${fmt(Math.abs(v[1]), 1)}`, v[0], v[1] / 2, { dx: 8, color: "#b37800", weight: 600, halo: true });
      const n2 = Math.hypot(v[0], v[1]), n3 = Math.hypot(v[0], v[1], v3);
      P.text(`${fmt(n2, 2)}`, v[0] / 2, v[1] / 2, { dx: -12, dy: -8, anchor: "end", color: C.green, weight: 700, halo: true });
      let html = `<div>${tex(`\\lVert\\mathbf v\\rVert=\\sqrt{${fmt(v[0], 1)}^2+${fmt(v[1], 1)}^2}=\\sqrt{${fmt(v[0] ** 2 + v[1] ** 2, 2)}}=${fmt(n2, 3)}`, true)}</div>`;
      if (v3 > 0) html += `<p>With a third coordinate, the floor diagonal (${fmt(n2, 2)}) and the vertical side (${v3}) form a second right-angled triangle:</p>
        <div>${tex(`\\lVert\\mathbf v\\rVert=\\sqrt{${fmt(n2, 2)}^2+${v3}^2}=\\sqrt{${fmt(v[0] ** 2 + v[1] ** 2 + v3 ** 2, 2)}}=${fmt(n3, 3)}`, true)}</div>
        <p>Each extra coordinate adds one more squared term under the root.</p>`;
      else html += `<p>The two coordinates are the short sides of a right-angled triangle; the vector is the hypotenuse.</p>`;
      out.innerHTML = html;
    }
    P.handle(v, { color: C.green, name: "tip of v", snap: 0.5, onMove: p => { v = p; draw(); } });
    draw();
  });

  /* 5. The triangle inequality. */
  IX.register("triangle-inequality", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-6, 6], y: [-5, 5], title: "Triangle inequality" });
    const side = h("div", {}, L);
    const B = bars(side, { labels: ["‖u‖ + ‖v‖", "‖u + v‖"], colors: [C.orange, C.green], height: 180, format: x => fmt(x, 2) });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag u and v. Try to make the direct route as long as the detour.");
    let u = [3, 1], v = [-1, 3];
    function draw() {
      P.clear();
      const w = [u[0] + v[0], u[1] + v[1]];
      P.arrow([0, 0], u, { color: C.blue, width: 3, label: "u", ldx: 4, ldy: 16 });
      P.arrow(u, w, { color: C.orange, width: 3, label: "v" });
      P.arrow([0, 0], w, { color: C.green, width: 3.5, label: "u + v", ldx: -60, ldy: -6 });
      const a = norm(u) + norm(v), b = norm(w);
      B.update([a, b]);
      const eq = a - b < 0.02;
      out.innerHTML = `<p>Detour ${fmt(norm(u))} + ${fmt(norm(v))} = <b>${fmt(a)}</b>; direct route <b>${fmt(b)}</b>.</p>
        <p class="ix-msg ${eq ? "ok" : ""}">${eq ? "Equal: u and v point the same way, so the detour is a straight line." : "The direct route is shorter. Equality needs u and v to point in the same direction."}</p>`;
    }
    P.handle(u, { color: C.blue, name: "tip of u", snap: 0.5, onMove: p => { u = p; hv.set([u[0] + v[0], u[1] + v[1]], true); v = [hv.p[0] - u[0], hv.p[1] - u[1]]; draw(); } });
    const hv = P.handle([u[0] + v[0], u[1] + v[1]], { color: C.orange, name: "tip of v", snap: 0.5, onMove: p => { v = [p[0] - u[0], p[1] - u[1]]; draw(); } });
    draw();
  });

  /* 6. Unit balls of the L1, L2 and L-infinity norms, and the p-norm family. */
  IX.register("unit-balls", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-1.6, 1.6], y: [-1.4, 1.4], grid: 0.5, tick: 0.5, width: 480, height: 420, title: "Vectors of length 1 under different norms" });
    const side = h("div", {}, L);
    let p = 2, x = [0.6, 0.6];
    const sp = slider(side, { label: "p", min: 1, max: 10, step: 0.1, value: 2, onInput: q => { p = q; draw(); } });
    player(side, sp, { bounce: true, interval: 60 });
    buttons(side, [{ label: "p = 1", v: 1 }, { label: "p = 2", v: 2 }, { label: "p = ∞", v: Infinity }], it => { p = it.v; if (isFinite(p)) sp.set(p); draw(); }, { label: "Jump to" });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag the point. The bold curve is every vector whose p-norm equals 1.");
    const pn = (v, q) => isFinite(q) ? (Math.abs(v[0]) ** q + Math.abs(v[1]) ** q) ** (1 / q) : Math.max(Math.abs(v[0]), Math.abs(v[1]));
    function ball(q) {
      const pts = [];
      for (let k = 0; k <= 360; k++) { const t = k / 360 * 2 * Math.PI, d = [Math.cos(t), Math.sin(t)], r = 1 / pn(d, q); pts.push([d[0] * r, d[1] * r]); }
      return pts;
    }
    function draw() {
      P.clear();
      P.path(ball(1), { color: C.orange, width: 1.3, dash: "5 4", opacity: 0.8 });
      P.path(ball(2), { color: C.blue, width: 1.3, dash: "5 4", opacity: 0.8 });
      P.path(ball(Infinity), { color: C.green, width: 1.3, dash: "5 4", opacity: 0.8 });
      P.path(ball(p), { color: C.vermilion, width: 3.2, fill: C.vermilion, fillOpacity: 0.06 });
      P.arrow([0, 0], x, { color: C.ink, width: 2.2 });
      const l1 = pn(x, 1), l2 = pn(x, 2), li = pn(x, Infinity), lp = pn(x, p);
      out.innerHTML = `<table>
        <tr><td><span class="k-orange">L₁</span> (Manhattan)</td><td>|${fmt(x[0])}| + |${fmt(x[1])}| = <b>${fmt(l1, 3)}</b></td></tr>
        <tr><td><span class="k-blue">L₂</span> (Euclidean)</td><td>√(${fmt(x[0])}² + ${fmt(x[1])}²) = <b>${fmt(l2, 3)}</b></td></tr>
        <tr><td><span class="k-green">L∞</span> (largest)</td><td>max(|${fmt(x[0])}|, |${fmt(x[1])}|) = <b>${fmt(li, 3)}</b></td></tr>
        <tr><td><span class="k-verm">L<sub>${isFinite(p) ? fmt(p, 1) : "∞"}</sub></span></td><td><b>${fmt(lp, 3)}</b> ${lp <= 1 ? "(inside the bold curve)" : "(outside the bold curve)"}</td></tr></table>
        <p>For every vector, L∞ ≤ L₂ ≤ L₁: here ${fmt(li, 2)} ≤ ${fmt(l2, 2)} ≤ ${fmt(l1, 2)}.</p>`;
    }
    P.handle(x, { color: C.ink, name: "vector x", snap: 0.05, onMove: q => { x = q; draw(); } });
    draw();
  });

  /* 7. Feature scaling: units change which feature dominates a distance. */
  IX.register("feature-scale", root => {
    const L = layout(root, true);
    const left = h("div", {}, L), side = h("div", {}, L);
    const d = { size: 114, beds: 1, age: 35 };          // differences between the two houses in the notes
    let unit = "ft", ageUnit = "years", std = false;
    const sd = { size: 400, beds: 0.8, age: 20 };        // illustrative spreads across a dataset (for standardising)
    const B = bars(left, { labels: ["size", "bedrooms", "age"], colors: [C.blue, C.orange, C.green], max: 100, title: "Share of the squared distance (%)", height: 240, width: 420, format: x => fmt(x, 1) + "%" });
    buttons(side, [{ label: "square feet", v: "ft" }, { label: "square metres", v: "m" }], it => { unit = it.v; draw(); }, { toggle: true, label: "Size in" });
    buttons(side, [{ label: "years", v: "years" }, { label: "decades", v: "decades" }], it => { ageUnit = it.v; draw(); }, { toggle: true, label: "Age in" });
    buttons(side, [{ label: "raw units", v: false }, { label: "standardised", v: true }], it => { std = it.v; draw(); }, { toggle: true, label: "Features" });
    const out = readout(side);
    function draw() {
      let a = unit === "ft" ? d.size : d.size * 0.092903, b = d.beds, c = ageUnit === "years" ? d.age : d.age / 10;
      if (std) { a = d.size / sd.size; b = d.beds / sd.beds; c = d.age / sd.age; }
      const sq = [a * a, b * b, c * c], tot = sq.reduce((x, y) => x + y);
      B.update(sq.map(s => 100 * s / tot));
      out.innerHTML = `<p>Differences between the two houses: size ${fmt(a, 2)} ${std ? "SD" : unit === "ft" ? "sq ft" : "m²"}, bedrooms ${fmt(b, 2)}${std ? " SD" : ""}, age ${fmt(c, 2)} ${std ? "SD" : ageUnit}.</p>
        <p>Distance = √(${fmt(a, 2)}² + ${fmt(b, 2)}² + ${fmt(c, 2)}²) = <b>${fmt(Math.sqrt(tot), 2)}</b></p>
        <p>${std ? "Standardised (dividing each difference by that feature's spread across the dataset, here assumed to be 400 sq ft, 0.8 bedrooms and 20 years), each feature contributes on a comparable scale." : "Same two houses, different units, a different answer to which feature matters. Nothing about the houses changed."}</p>`;
    }
    draw();
  });

  /* 8. Normalisation: strength times pattern. */
  IX.register("normalise", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-5, 5], y: [-4, 4], title: "Normalising a vector" });
    const side = h("div", {}, L);
    let v = [3, 4], c = 1;
    const sc = slider(side, { label: "strength ×", min: 0.2, max: 1.2, step: 0.05, value: 1, onInput: x => { c = x; hv.set([c * v[0], c * v[1]], true); draw(); } });
    player(side, sc, { bounce: true, interval: 90 });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag v, or change its strength with the slider: the green unit vector does not move unless the direction changes.");
    function draw() {
      P.clear();
      const w = [c * v[0], c * v[1]], n = norm(w);
      P.path(Array.from({ length: 121 }, (_, k) => [Math.cos(k * Math.PI / 60), Math.sin(k * Math.PI / 60)]), { color: C.muted, width: 1.4, dash: "4 4" });
      P.text("unit circle", 0.75, -0.75, { dx: 4, dy: 14, size: 12, color: C.muted });
      if (n < 1e-9) { out.innerHTML = `<p class="ix-msg no">The zero vector has no direction, so it cannot be normalised.</p>`; return; }
      const u = [w[0] / n, w[1] / n];
      P.line([0, 0], [u[0] * 9, u[1] * 9], { dash: "2 6", color: C.grid, width: 2 });
      P.arrow([0, 0], w, { color: C.blue, width: 3, label: "v" });
      P.arrow([0, 0], u, { color: C.green, width: 4, label: "v̂", ldx: u[0] > 0 ? -22 : 8, ldy: 18 });
      out.innerHTML = `<table><tr><td>v</td><td>${vec(w)}</td></tr><tr><td>strength ‖v‖</td><td><b>${fmt(n, 3)}</b></td></tr>
        <tr><td>pattern v̂ = v / ‖v‖</td><td class="k-green">${vec(u)}</td></tr><tr><td>check ‖v̂‖</td><td>${fmt(norm(u), 3)}</td></tr></table>
        <p>v = ${fmt(n, 2)} × ${vec(u)}: strength times pattern.</p>`;
    }
    const hv = P.handle(v, { color: C.blue, name: "tip of v", snap: 0.25, onMove: p => { v = [p[0] / c, p[1] / c]; draw(); } });
    draw();
  });

  /* 9. Linear combinations, span, basis and coordinates. */
  IX.register("span-basis", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [-6, 6], y: [-5, 5], title: "Linear combinations of two vectors" });
    const side = h("div", {}, L);
    let b1 = [2, 1], b2 = [-1, 2], a = 1.5, b = 1, t = [3, 4];
    const sa = slider(side, { label: "α (weight on b₁)", min: -3, max: 3, step: 0.1, value: a, onInput: x => { a = x; draw(); } });
    const sb = slider(side, { label: "β (weight on b₂)", min: -3, max: 3, step: 0.1, value: b, onInput: x => { b = x; draw(); } });
    buttons(side, [{ label: "Standard basis", v: [[1, 0], [0, 1]] }, { label: "Make them parallel", v: [[2, 1], [-2, -1]] }], it => {
      b1 = it.v[0].slice(); b2 = it.v[1].slice(); h1.set(b1, true); h2.set(b2, true); draw(); }, { label: "Try" });
    const out = readout(side);
    h("p", { class: "ix-hint" }, side, "Drag b₁ and b₂, change the weights, and drag the purple target to find its coordinates in this basis.");
    function draw() {
      P.clear();
      const det = b1[0] * b2[1] - b1[1] * b2[0];
      const dep = Math.abs(det) < 1e-6;
      if (!dep) {   // the coordinate lattice of this basis
        for (let k = -8; k <= 8; k++) {
          P.line([k * b1[0] - 12 * b2[0], k * b1[1] - 12 * b2[1]], [k * b1[0] + 12 * b2[0], k * b1[1] + 12 * b2[1]], { color: "#dbe8f2", width: 1 });
          P.line([k * b2[0] - 12 * b1[0], k * b2[1] - 12 * b1[1]], [k * b2[0] + 12 * b1[0], k * b2[1] + 12 * b1[1]], { color: "#f5e3c5", width: 1 });
        }
      } else if (norm(b1) > 0) {
        P.line([-20 * b1[0], -20 * b1[1]], [20 * b1[0], 20 * b1[1]], { color: C.purple, width: 6, opacity: 0.25 });
      }
      const s1 = [a * b1[0], a * b1[1]], w = [s1[0] + b * b2[0], s1[1] + b * b2[1]];
      P.arrow([0, 0], s1, { color: C.blue, width: 2, dash: "6 4", opacity: 0.8 });
      P.arrow(s1, w, { color: C.orange, width: 2, dash: "6 4", opacity: 0.8 });
      P.arrow([0, 0], w, { color: C.green, width: 3.5, label: "αb₁ + βb₂", ldx: 10 });
      P.arrow([0, 0], b1, { color: C.blue, width: 3.5, label: "b₁", ldx: 4, ldy: 18 });
      P.arrow([0, 0], b2, { color: C.orange, width: 3.5, label: "b₂", ldx: -24, ldy: -4 });
      let msg;
      if (dep) {
        const onLine = norm(b1) > 0 ? Math.abs(b1[0] * t[1] - b1[1] * t[0]) < 1e-6 : norm(t) < 1e-6;
        msg = `<p class="ix-msg no">b₁ and b₂ are parallel (linearly dependent): together they span only a line, not the plane.</p>
               <p>The purple target ${vec(t)} is ${onLine ? "on that line, so it can be reached, but in many ways." : "off that line, so no weights reach it."}</p>`;
      } else {
        const ca = (t[0] * b2[1] - t[1] * b2[0]) / det, cb = (b1[0] * t[1] - b1[1] * t[0]) / det;
        msg = `<p class="ix-msg ok">b₁ and b₂ are independent: they form a basis, and every point of the plane is reached in exactly one way.</p>
               <p>Target ${vec(t)} = <b>${fmt(ca, 2)}</b> b₁ + <b>${fmt(cb, 2)}</b> b₂, so its coordinates in this basis are (${fmt(ca, 2)}, ${fmt(cb, 2)}).</p>`;
      }
      out.innerHTML = `<p>${fmt(a, 1)} × ${vec(b1)} + ${fmt(b, 1)} × ${vec(b2)} = <span class="k-green">${vec(w)}</span></p>` + msg;
    }
    const h1 = P.handle(b1, { color: C.blue, name: "tip of b1", snap: 0.5, onMove: p => { b1 = p; draw(); } });
    const h2 = P.handle(b2, { color: C.orange, name: "tip of b2", snap: 0.5, onMove: p => { b2 = p; draw(); } });
    P.handle(t, { color: C.purple, name: "target point", snap: 0.5, onMove: p => { t = p; draw(); } });
    draw();
  });

  /* 10. A trajectory through state space: steps, speed, path length and displacement. */
  IX.register("trajectory", root => {
    const L = layout(root, true);
    const P = Plane(L, { x: [0, 50], y: [0, 50], grid: 10, tick: 10, labels: ["N1 (spikes/s)", "N2 (spikes/s)"], width: 480, height: 420, title: "A two-neuron trajectory" });
    const side = h("div", {}, L);
    const dt = 0.1, T = 41;   // a simulated recording: 41 bins of 100 ms
    const traj = Array.from({ length: T }, (_, k) => {
      const s = k / (T - 1);
      return [12 + 26 * s + 7 * Math.sin(2.5 * Math.PI * s), 12 + 20 * Math.sin(Math.PI * s) + 6 * Math.sin(4 * Math.PI * s)];
    });
    let t = 10;
    const st = slider(side, { label: "time bin t", min: 0, max: T - 1, step: 1, value: t, format: v => `${v} (${fmt(v * dt, 1)} s)`, onInput: v => { t = v; draw(); } });
    player(side, st, { interval: 160 });
    const out = readout(side);
    function draw() {
      P.clear();
      P.path(traj, { color: C.grid, width: 2 });
      P.path(traj.slice(0, t + 1), { color: C.blue, width: 2.5 });
      traj.slice(0, t + 1).forEach(p => P.dot(p, { r: 2.6, color: C.blue, sw: 0 }));
      if (t > 0) {
        P.arrow([0, 0].map((_, i) => traj[0][i]), traj[t], { color: C.green, width: 2, dash: "6 5" });
        P.arrow(traj[t - 1], traj[t], { color: C.vermilion, width: 3.5 });
      }
      P.dot(traj[0], { r: 6, color: C.ink }); P.text("start", traj[0][0], traj[0][1], { dx: 8, dy: 16, size: 12, color: C.muted });
      P.dot(traj[t], { r: 7, color: C.vermilion });
      let path = 0; for (let k = 1; k <= t; k++) path += norm([traj[k][0] - traj[k - 1][0], traj[k][1] - traj[k - 1][1]]);
      const disp = norm([traj[t][0] - traj[0][0], traj[t][1] - traj[0][1]]);
      const step = t > 0 ? norm([traj[t][0] - traj[t - 1][0], traj[t][1] - traj[t - 1][1]]) : 0;
      out.innerHTML = `<table><tr><td>state r(t)</td><td>${vec(traj[t])} spikes/s</td></tr>
        <tr><td><span class="k-verm">last step</span> ‖r(t) − r(t−1)‖</td><td>${fmt(step, 2)} spikes/s</td></tr>
        <tr><td>speed</td><td>${fmt(step / dt, 1)} (spikes/s) per second</td></tr>
        <tr><td><span class="k-blue">path length</span> (sum of steps)</td><td>${fmt(path, 1)} spikes/s</td></tr>
        <tr><td><span class="k-green">net displacement</span></td><td>${fmt(disp, 1)} spikes/s</td></tr>
        <tr><td>path ÷ displacement</td><td>${t > 0 && disp > 0 ? fmt(path / disp, 2) : "–"}</td></tr></table>
        <p>By the triangle inequality the path is never shorter than the displacement. A ratio near 1 means the population moved fairly directly.</p>`;
    }
    draw();
  });
})();
