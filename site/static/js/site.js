/* MAMBA course site: maths, progress, quizzes, lazy Plotly figures, search, outline drawer. */
(function () {
  "use strict";
  const M = window.MAMBA || { root: "", lessons: [], ready: [] };
  const KEY = "mamba-progress-v1";

  // ---------- progress (stored in this browser only) ----------
  // Signed out: progress lives in this browser. Signed in (auth.js): it comes from the learner's account.
  let accountDone = null;
  function loadDone() {
    if (accountDone) return new Set(accountDone);
    try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) { return new Set(); }
  }
  function saveDone(s) {
    if (accountDone) { accountDone = [...s]; return; }
    try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch (e) { /* storage unavailable */ }
  }
  window.MAMBA_setDone = list => { accountDone = list ? list.slice() : null; paintProgress(); };
  function paintProgress() {
    const done = loadDone();
    document.querySelectorAll("[data-slug]").forEach(el => {
      if (el.tagName === "LI") el.classList.toggle("done", done.has(el.dataset.slug));
    });
    const n = M.lessons.filter(s => done.has(s)).length;
    const fill = document.getElementById("progress-fill");
    const text = document.getElementById("progress-text");
    if (fill) fill.style.width = (100 * n / Math.max(1, M.lessons.length)) + "%";
    if (text) text.textContent = `${n} of ${M.lessons.length} lessons complete`;
    const btn = document.getElementById("mark-complete");
    if (btn) {
      const isDone = done.has(btn.dataset.slug);
      btn.textContent = isDone ? "Completed. Click to undo" : "Mark as complete";
      btn.classList.toggle("is-done", isDone);
      btn.setAttribute("aria-pressed", String(isDone));
    }
    const start = document.getElementById("start-btn");
    if (start && n > 0) {
      const nextSlug = M.ready.find(s => !done.has(s));
      if (nextSlug) { start.textContent = "Continue learning"; start.href = M.root + "lessons/" + nextSlug + ".html"; }
    }
  }
  function initProgress() {
    const btn = document.getElementById("mark-complete");
    if (btn) btn.addEventListener("click", () => {
      const done = loadDone();
      const now = !done.has(btn.dataset.slug);
      now ? done.add(btn.dataset.slug) : done.delete(btn.dataset.slug);
      saveDone(done); paintProgress();
      if (window.MAMBA_backend) window.MAMBA_backend.saveProgress(btn.dataset.slug, now);
    });
    paintProgress();
  }

  // ---------- maths ----------
  function renderMath(root) {
    if (!window.katex) return;
    (root || document).querySelectorAll(".math-tex:not(.rendered)").forEach(el => {
      try {
        katex.render(el.textContent, el, { displayMode: el.classList.contains("display"), throwOnError: false, strict: "ignore",
          macros: { "\\R": "\\mathbb{R}", "\\vect": "\\mathbf{#1}", "\\norm": "\\lVert #1 \\rVert" } });
        el.classList.add("rendered");
      } catch (e) { /* leave the TeX visible */ }
    });
  }
  window.MAMBA_renderMath = renderMath;

  // ---------- quizzes ----------
  function initQuizzes() {
    document.querySelectorAll(".quiz-q").forEach(q => {
      const btn = q.querySelector(".quiz-check");
      const fb = q.querySelector(".quiz-feedback");
      q.addEventListener("change", () => { btn.disabled = false; });
      btn.addEventListener("click", () => {
        const picked = q.querySelector("input:checked");
        if (!picked) return;
        q.querySelectorAll("label").forEach(l => l.classList.remove("right", "wrong"));
        const ok = picked.value === "1";
        const slug = document.querySelector("main.lesson")?.dataset.slug;
        if (window.MAMBA_backend && slug) window.MAMBA_backend.recordQuiz(q.dataset.qid, slug, ok);
        picked.closest("label").classList.add(ok ? "right" : "wrong");
        if (!ok) { const r = q.querySelector('input[value="1"]'); if (r) r.closest("label").classList.add("right"); }
        const v = fb.querySelector(".quiz-verdict");
        v.textContent = ok ? "Correct." : "Not quite. The correct answer is highlighted.";
        v.className = "quiz-verdict " + (ok ? "ok" : "no");
        fb.hidden = false;
      });
    });
  }

  // ---------- Plotly figures exported from the notebooks ----------
  /* Notebook figures are laid out for a wide notebook. On the page: the caption replaces the title, the legend sits in
     one row above the plot so it never squeezes it, and the Play/Pause buttons and time slider sit in one row below. */
  function tidyLayout(L0) {
    const L = JSON.parse(JSON.stringify(L0));
    delete L.width; L.autosize = true;
    L.title = { text: "" };
    L.font = Object.assign({}, L.font, { size: 13 });
    L.legend = { orientation: "h", x: 0, xanchor: "left", y: 1.0, yanchor: "bottom", font: { size: 12.5 }, itemwidth: 30, bgcolor: "rgba(255,255,255,0)" };
    const anim = (L.updatemenus || []).length > 0;
    L.margin = { l: 60, r: 20, t: 40, b: anim ? 110 : 50 };
    if (anim) {
      L.updatemenus = L.updatemenus.map(u => Object.assign(u, { type: "buttons", direction: "left", showactive: false, x: 0, xanchor: "left", y: 0, yanchor: "top", pad: { t: 62, r: 10 } }));
      L.sliders = (L.sliders || []).map(s => Object.assign(s, { x: 0.2, len: 0.8, xanchor: "left", y: 0, yanchor: "top", pad: { t: 48, b: 0 },
        currentvalue: Object.assign({}, s.currentvalue, { visible: true, xanchor: "right", font: { size: 12.5 }, offset: 8 }) }));
    }
    if (L.scene) { L.scene.domain = { x: [0, 1], y: [0, 1] }; L.scene.camera = Object.assign({}, L.scene.camera, { eye: { x: 1.7, y: 1.7, z: 1.05 } }); }
    if (!L.height || L.height > 620) L.height = anim ? 640 : 560;
    return L;
  }

  function loadPlotly(holder) {
    if (holder.dataset.state) return;
    holder.dataset.state = "loading";
    const go = () => fetch(holder.dataset.src).then(r => r.json()).then(fig => {
      holder.innerHTML = ""; holder.classList.add("loaded");
      const div = document.createElement("div"); holder.appendChild(div);
      const layout = tidyLayout(fig.layout || {});
      Plotly.newPlot(div, fig.data, layout, { responsive: true, displaylogo: false, scrollZoom: false, displayModeBar: false });
      if (fig.frames && fig.frames.length) Plotly.addFrames(div, fig.frames);
    }).catch(() => { holder.textContent = "This figure could not be loaded."; });
    if (window.Plotly) go(); else window.addEventListener("load", go, { once: true });
  }
  function initPlotly() {
    const holders = document.querySelectorAll(".plotly-holder");
    holders.forEach(h => h.querySelector(".plotly-load")?.addEventListener("click", () => loadPlotly(h)));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { loadPlotly(e.target); io.unobserve(e.target); } }), { rootMargin: "400px" });
      holders.forEach(h => io.observe(h));
    }
  }

  // ---------- search ----------
  function initSearch() {
    const input = document.getElementById("q"), box = document.getElementById("search-results");
    if (!input) return;
    let index = null, active = -1;
    const get = () => index ? Promise.resolve(index) : fetch(M.root + "static/search.json").then(r => r.json()).then(j => (index = j));
    const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    function snippet(text, terms) {
      const low = text.toLowerCase(); let at = -1;
      for (const t of terms) { at = low.indexOf(t); if (at >= 0) break; }
      if (at < 0) return "";
      const s = text.slice(Math.max(0, at - 60), at + 120);
      let h = esc(s);
      terms.forEach(t => { h = h.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
      return "…" + h + "…";
    }
    input.addEventListener("input", () => get().then(idx => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { box.hidden = true; return; }
      const terms = q.split(/\s+/).filter(Boolean);
      const scored = idx.map(d => {
        const t = d.t.toLowerCase(), h = d.h.join(" ").toLowerCase(), x = (d.x || "").toLowerCase();
        let s = 0;
        for (const w of terms) { if (t.includes(w)) s += 10; if (h.includes(w)) s += 4; if (x.includes(w)) s += 1; else if (!t.includes(w) && !h.includes(w)) return null; }
        return { d, s };
      }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 8);
      box.innerHTML = scored.length ? scored.map(({ d }) =>
        `<a href="${M.root}${d.u}"><span class="r-t">${esc(d.t)}</span><span class="r-s">${d.p ? esc(d.p) + ". " : ""}${snippet(d.x || d.h.join(", "), terms)}</span></a>`).join("")
        : `<p class="none">No lessons match “${esc(input.value)}”. Try a shorter or different word.</p>`;
      box.hidden = false; active = -1;
    }));
    input.addEventListener("keydown", e => {
      const links = [...box.querySelectorAll("a")];
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); if (!links.length) return;
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        links.forEach((l, i) => l.classList.toggle("active", i === active));
      } else if (e.key === "Enter" && active >= 0) { links[active].click(); }
      else if (e.key === "Escape") { box.hidden = true; }
    });
    document.addEventListener("click", e => { if (!e.target.closest(".search")) box.hidden = true; });
  }

  // ---------- outline drawer and table of contents ----------
  function initOutline() {
    const btn = document.querySelector(".menu-btn"), nav = document.getElementById("outline");
    if (btn && nav) btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", String(open));
    });
    const links = [...document.querySelectorAll(".toc a")];
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map(links.map(a => [decodeURIComponent(a.hash.slice(1)), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { links.forEach(a => a.classList.remove("active")); map.get(e.target.id)?.classList.add("active"); }
    }), { rootMargin: "-20% 0px -70% 0px" });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  function init() {
    renderMath(); initProgress(); initQuizzes(); initPlotly(); initSearch(); initOutline();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.addEventListener("load", () => renderMath());
})();
