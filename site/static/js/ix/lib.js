/* MAMBA interactive-figure toolkit: SVG planes with draggable points, sliders, buttons and readouts.
   Each lesson file registers figures with IX.register("name", el => {...}); figures in the page are
   <div class="ix" data-ix="name">. Everything here is plain JavaScript and SVG, no external libraries. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const C = { blue: "#0072B2", orange: "#E69F00", green: "#009E73", vermilion: "#D55E00", purple: "#CC79A7",
              sky: "#56B4E9", yellow: "#F0E442", ink: "#1d232a", muted: "#6b7680", grid: "#e6ebef", axis: "#9aa6b1" };
  const registry = {};
  let uid = 0;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, attrs, parent, text) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) { if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  const fmt = (x, d = 2) => {
    if (!isFinite(x)) return "∞";
    const s = (Math.round(x * 10 ** d) / 10 ** d).toFixed(d);
    return s.replace(/\.?0+$/, "") === "-0" ? "0" : s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  };
  function tex(s, display) {
    if (window.katex) { try { return katex.renderToString(s, { throwOnError: false, displayMode: !!display }); } catch (e) {} }
    return s;
  }

  /* A 2D coordinate plane. opts: {x:[min,max], y:[min,max], width, height, grid:1, labels:["x","y"], unit} */
  function Plane(host, opts) {
    const o = Object.assign({ x: [-5, 5], y: [-5, 5], width: 520, height: 420, grid: 1, labels: ["x₁", "x₂"], pad: 42 }, opts);
    const W = o.width, H = o.height, P = o.pad;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ix-svg", role: "img" }, host);
    if (o.title) el("title", {}, svg).textContent = o.title;
    const sx = (W - 2 * P) / (o.x[1] - o.x[0]), sy = (H - 2 * P) / (o.y[1] - o.y[0]);
    const X = x => P + (x - o.x[0]) * sx, Y = y => H - P - (y - o.y[0]) * sy;
    const iX = px => o.x[0] + (px - P) / sx, iY = py => o.y[0] + (H - P - py) / sy;
    const id = "ix" + (++uid);
    const defs = el("defs", {}, svg);
    const markers = {};
    function marker(color) {
      if (markers[color]) return markers[color];
      const mid = `${id}-m${Object.keys(markers).length}`;
      const m = el("marker", { id: mid, viewBox: "0 0 10 10", refX: 8.5, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
      el("path", { d: "M0 0L10 5L0 10z", fill: color }, m);
      return (markers[color] = `url(#${mid})`);
    }
    const back = el("g", {}, svg), layer = el("g", {}, svg), top = el("g", {}, svg);
    if (o.clip) {   /* keep drawn lines inside the plot area */
      const cp = el("clipPath", { id: id + "-clip" }, defs);
      el("rect", { x: P - 2, y: P - 2, width: W - 2 * P + 4, height: H - 2 * P + 4 }, cp);
      layer.setAttribute("clip-path", `url(#${id}-clip)`);
    }
    function axes() {
      if (o.gridLines) {
        for (let x = Math.ceil(o.x[0] / o.grid) * o.grid; x <= o.x[1] + 1e-9; x += o.grid)
          el("line", { x1: X(x), x2: X(x), y1: Y(o.y[0]), y2: Y(o.y[1]), stroke: C.grid, "stroke-width": 1 }, back);
        for (let y = Math.ceil(o.y[0] / o.grid) * o.grid; y <= o.y[1] + 1e-9; y += o.grid)
          el("line", { y1: Y(y), y2: Y(y), x1: X(o.x[0]), x2: X(o.x[1]), stroke: C.grid, "stroke-width": 1 }, back);
      }
      const x0 = o.frame ? o.x[0] : Math.min(Math.max(0, o.x[0]), o.x[1]), y0 = o.frame ? o.y[0] : Math.min(Math.max(0, o.y[0]), o.y[1]);   /* frame: axes along the bottom and left edges */
      el("line", { x1: X(o.x[0]), x2: X(o.x[1]), y1: Y(y0), y2: Y(y0), stroke: C.axis, "stroke-width": 1.3 }, back);
      el("line", { y1: Y(o.y[0]), y2: Y(o.y[1]), x1: X(x0), x2: X(x0), stroke: C.axis, "stroke-width": 1.3 }, back);
      const tick = o.tick || o.grid * (Math.abs(o.x[1] - o.x[0]) > 12 * o.grid ? 5 : 2);
      const xt = o.xtick || tick, yt = o.ytick || tick;
      for (let x = Math.ceil(o.x[0] / xt - 1e-9) * xt; x <= o.x[1] + 1e-9; x += xt) if (Math.abs(x) > 1e-9 || o.frame)
        text(fmt(x), x, y0, { dy: 18, anchor: "middle", size: 13, color: C.muted, layer: back });
      for (let y = Math.ceil(o.y[0] / yt - 1e-9) * yt; y <= o.y[1] + 1e-9; y += yt) if (Math.abs(y) > 1e-9 || o.frame)
        text(fmt(y), x0, y, { dx: -6, dy: 4, anchor: "end", size: 13, color: C.muted, layer: back });
      text(o.labels[0], o.x[1], y0, { dx: 0, dy: 34, anchor: "end", size: 14, color: C.muted, layer: back });
      text(o.labels[1], x0, o.y[1], { dx: 8, dy: 12, anchor: "start", size: 14, color: C.muted, layer: back });
    }
    function text(s, x, y, a = {}) {
      const t = el("text", { x: X(x) + (a.dx || 0), y: Y(y) + (a.dy || 0), "text-anchor": a.anchor || "start",
        "font-size": a.size || 13, fill: a.color || C.ink, "font-weight": a.weight || 400, "font-family": "inherit" }, a.layer || layer);
      t.textContent = s;
      if (a.halo) { t.setAttribute("paint-order", "stroke"); t.setAttribute("stroke", "#fff"); t.setAttribute("stroke-width", 4); }
      return t;
    }
    function arrow(a, b, s = {}) {
      const color = s.color || C.blue;
      const len = Math.hypot(X(b[0]) - X(a[0]), Y(b[1]) - Y(a[1]));
      const ln = el("line", { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), stroke: color, "stroke-width": s.width || 3,
        "stroke-linecap": "round", "stroke-dasharray": s.dash || "", opacity: s.opacity || 1 }, s.layer || layer);
      if (len > 6 && !s.noHead) ln.setAttribute("marker-end", marker(color));
      if (s.label) text(s.label, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, { dx: s.ldx ?? 8, dy: s.ldy ?? -8, color, weight: 600, size: 16, halo: true });
      return ln;
    }
    function line(a, b, s = {}) {
      return el("line", { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), stroke: s.color || C.muted, "stroke-width": s.width || 1.5,
        "stroke-dasharray": s.dash || "", opacity: s.opacity || 1 }, s.layer || layer);
    }
    function path(pts, s = {}) {
      const d = pts.map((p, i) => (i ? "L" : "M") + X(p[0]).toFixed(2) + " " + Y(p[1]).toFixed(2)).join("") + (s.close ? "Z" : "");
      return el("path", { d, fill: s.fill || "none", "fill-opacity": s.fillOpacity ?? 1, stroke: s.color || C.blue, "stroke-width": s.width || 2,
        "stroke-dasharray": s.dash || "", "stroke-linejoin": "round", opacity: s.opacity || 1 }, s.layer || layer);
    }
    function dot(p, s = {}) {
      return el("circle", { cx: X(p[0]), cy: Y(p[1]), r: s.r || 5, fill: s.fill || s.color || C.blue, stroke: s.stroke || "#fff",
        "stroke-width": s.sw ?? 1.5, opacity: s.opacity || 1 }, s.layer || layer);
    }
    /* A draggable point. Keyboard: focus it and use the arrow keys (Shift for bigger steps). */
    function handle(p, s = {}) {
      const g = el("g", { class: "ix-handle", tabindex: 0, role: "slider", "aria-label": s.name || "draggable point" }, top);
      el("circle", { r: 16, fill: "transparent" }, g);
      const c = el("circle", { r: s.r || 8, fill: s.color || C.blue, stroke: "#fff", "stroke-width": 2.5 }, g);
      const state = { p: p.slice(), g };
      const snap = s.snap ?? 0.1;
      const clamp = q => [Math.min(o.x[1], Math.max(o.x[0], q[0])), Math.min(o.y[1], Math.max(o.y[0], q[1]))];
      const round = q => snap ? q.map(v => Math.round(v / snap) * snap) : q;
      function place() {
        g.setAttribute("transform", `translate(${X(state.p[0])},${Y(state.p[1])})`);
        g.setAttribute("aria-valuetext", `(${fmt(state.p[0])}, ${fmt(state.p[1])})`);
      }
      function set(q, silent) { state.p = round(clamp(s.constrain ? s.constrain(q) : q)); place(); if (!silent && s.onMove) s.onMove(state.p); }
      state.set = set;
      function toLocal(ev) {
        const r = svg.getBoundingClientRect();
        return [iX((ev.clientX - r.left) * W / r.width), iY((ev.clientY - r.top) * H / r.height)];
      }
      g.addEventListener("pointerdown", ev => {
        ev.preventDefault(); g.setPointerCapture(ev.pointerId); g.classList.add("drag");
        const mv = e => set(toLocal(e));
        const up = () => { g.removeEventListener("pointermove", mv); g.removeEventListener("pointerup", up); g.classList.remove("drag"); };
        g.addEventListener("pointermove", mv); g.addEventListener("pointerup", up);
      });
      g.addEventListener("keydown", ev => {
        const st = (ev.shiftKey ? 10 : 1) * (snap || 0.1);
        const d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[ev.key];
        if (d) { ev.preventDefault(); set([state.p[0] + d[0], state.p[1] + d[1]]); }
      });
      place();
      return state;
    }
    function clear() { while (layer.firstChild) layer.removeChild(layer.firstChild); }
    axes();
    return { svg, X, Y, iX, iY, text, arrow, line, path, dot, handle, clear, layer, back, top, opts: o, marker };
  }

  /* Controls */
  function controls(host) { return h("div", { class: "ix-controls" }, host); }
  function slider(host, s) {
    const wrap = h("label", { class: "ix-slider" }, host);
    const lab = h("span", { class: "ix-slabel" }, wrap); lab.innerHTML = s.label;
    const inp = h("input", { type: "range", min: s.min, max: s.max, step: s.step || 0.1, value: s.value }, wrap);
    const out = h("output", {}, wrap);
    const show = () => { out.textContent = (s.format || (v => fmt(v)))(+inp.value); };
    inp.addEventListener("input", () => { show(); s.onInput && s.onInput(+inp.value); });
    show();
    return { input: inp, get value() { return +inp.value; }, set(v) { inp.value = v; show(); } };
  }
  function buttons(host, items, onPick, opts = {}) {
    const g = h("div", { class: "ix-buttons", role: opts.toggle ? "radiogroup" : "group" }, host);
    if (opts.label) h("span", { class: "ix-slabel" }, g, opts.label);
    const row = h("div", { class: "ix-btns" }, g);
    const bs = items.map((it, i) => {
      const b = h("button", { type: "button", class: "ix-btn" }, row, it.label || it);
      if (opts.toggle) b.setAttribute("aria-pressed", String(i === (opts.active || 0)));
      b.addEventListener("click", () => {
        if (opts.toggle) bs.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        onPick(it, i);
      });
      return b;
    });
    return bs;
  }
  /* A Play/Pause button that sweeps a slider from min to max (and optionally back). */
  function player(host, sl, o = {}) {
    const b = h("button", { type: "button", class: "ix-btn ix-play", "aria-pressed": "false" }, host, "▶ Play");
    let timer = null, dir = 1;
    const inp = sl.input, min = +inp.min, max = +inp.max, step = o.step || +inp.step || 1;
    function stop() { clearInterval(timer); timer = null; b.textContent = "▶ Play"; b.setAttribute("aria-pressed", "false"); }
    b.addEventListener("click", () => {
      if (timer) return stop();
      if (o.onStart) o.onStart();
      if (!o.bounce && +inp.value >= max) { inp.value = min; inp.dispatchEvent(new Event("input")); }
      b.textContent = "❚❚ Pause"; b.setAttribute("aria-pressed", "true");
      const tick = () => {
        let v = +inp.value + dir * step;
        if (v > max || v < min) {
          if (o.bounce) { dir = -dir; v = +inp.value + dir * step; } else { stop(); return; }
        }
        inp.value = v; inp.dispatchEvent(new Event("input"));
      };
      timer = setInterval(tick, o.interval || 120);
      if ((o.interval || 120) > 400) tick();   /* slow players take their first step at once */
    });
    inp.addEventListener("pointerdown", () => timer && stop());
    return b;
  }
  function readout(host, cls) { return h("div", { class: "ix-readout " + (cls || "") }, host); }
  function layout(root, cols) { return h("div", { class: "ix-layout" + (cols ? " ix-cols" : "") }, root); }

  /* Small bar chart in SVG: values with labels; returns update(values). */
  function bars(host, s) {
    const W = s.width || 300, H = s.height || 220, P = 30;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "ix-svg ix-bars", role: "img" }, host);
    if (s.title) { const t = el("text", { x: 4, y: 14, "font-size": 13, fill: C.ink, "font-weight": 600 }, svg); t.textContent = s.title; }
    const g = el("g", {}, svg);
    function update(vals) {
      while (g.firstChild) g.removeChild(g.firstChild);
      const max = s.max || Math.max(1e-9, ...vals.map(Math.abs));
      const n = vals.length, bw = (W - 2 * P) / n;
      const y0 = s.min < 0 ? H / 2 : H - P;
      const scale = (s.min < 0 ? (H / 2 - P) : (H - 2 * P - 6)) / max;
      el("line", { x1: P - 6, x2: W - P + 6, y1: y0, y2: y0, stroke: C.axis }, g);
      vals.forEach((v, i) => {
        const x = P + i * bw + bw * 0.18, w = bw * 0.64, hgt = Math.abs(v) * scale;
        el("rect", { x, y: v >= 0 ? y0 - hgt : y0, width: w, height: Math.max(0.5, hgt), rx: 3, fill: (s.colors && s.colors[i]) || s.color || C.blue }, g);
        const lt = el("text", { x: x + w / 2, y: y0 + (v >= 0 || s.min >= 0 ? 15 : -6), "text-anchor": "middle", "font-size": 12, fill: C.muted }, g);
        lt.textContent = s.labels ? s.labels[i] : i + 1;
        const vt = el("text", { x: x + w / 2, y: v >= 0 ? y0 - hgt - 5 : y0 + hgt + 14, "text-anchor": "middle", "font-size": 12, fill: C.ink, "font-weight": 600 }, g);
        vt.textContent = (s.format || (x => fmt(x, 1)))(v);
      });
    }
    return { svg, update };
  }

  function mountAll() {
    document.querySelectorAll(".ix[data-ix]").forEach(host => {
      const f = registry[host.dataset.ix];
      if (!f || host.dataset.mounted) return;
      host.dataset.mounted = "1";
      try { f(host); } catch (e) { console.error(e); host.textContent = "This interactive figure could not start."; }
      if (window.MAMBA_renderMath) window.MAMBA_renderMath(host);
    });
  }
  window.IX = { register: (n, f) => { registry[n] = f; if (document.readyState !== "loading") mountAll(); },
                Plane, controls, slider, buttons, player, readout, layout, bars, el, h, fmt, tex, C, mountAll };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll); else mountAll();
})();
