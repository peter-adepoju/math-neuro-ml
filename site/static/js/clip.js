/* MAMBA notebook: select text in a lesson and add it to the notebook, with its formulas, images and a link back. */
(function () {
  "use strict";
  const M = window.MAMBA || {};
  const art = document.querySelector("main.lesson .prose");
  if (!art) return;
  const slug = document.querySelector("main.lesson").dataset.slug;
  const touch = matchMedia("(pointer: coarse)").matches;

  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "clip-btn"; btn.hidden = true;
  btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9.5 13h6M12.5 10v6"/></svg><span>Add to notebook</span>`;
  document.body.appendChild(btn);

  const toast = document.createElement("div");
  toast.className = "clip-toast"; toast.setAttribute("role", "status"); toast.hidden = true;
  document.body.appendChild(toast);
  let toastTimer = null;
  function say(html, ms) {
    toast.innerHTML = html; toast.hidden = false; toast.classList.add("on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.classList.remove("on"); setTimeout(() => { toast.hidden = true; }, 250); }, ms || 6000);
  }

  function selRange() {
    const s = getSelection();
    if (!s || s.rangeCount === 0 || s.isCollapsed) return null;
    const r = s.getRangeAt(0);
    if (!art.contains(r.commonAncestorContainer)) return null;
    if (!s.toString().trim() && !r.cloneContents().querySelector("img,.katex")) return null;
    return r;
  }
  let shown = null;
  function place() {
    const r = selRange();
    if (!r) { btn.hidden = true; shown = null; return; }
    const rects = r.getClientRects(), box = r.getBoundingClientRect();
    const last = rects.length ? rects[rects.length - 1] : box;
    btn.hidden = false;
    const bw = btn.offsetWidth, bh = btn.offsetHeight, vw = document.documentElement.clientWidth;
    // on touch screens the phone's own menu sits above the selection, so the button goes below it
    let top = touch ? last.bottom + 14 : box.top - bh - 10, left = touch ? last.left + last.width / 2 - bw / 2 : box.left + box.width / 2 - bw / 2;
    if (top < 64) top = last.bottom + 10;
    if (top + bh > innerHeight - 76) top = Math.max(64, box.top - bh - 10);
    top = Math.max(64, Math.min(innerHeight - bh - (touch ? 80 : 12), top));
    left = Math.max(8, Math.min(vw - bw - 8, left));
    btn.style.top = top + "px"; btn.style.left = left + "px";
    shown = r.cloneRange();
  }
  let t = null;
  document.addEventListener("selectionchange", () => { clearTimeout(t); t = setTimeout(place, touch ? 350 : 120); });
  addEventListener("scroll", () => { if (!btn.hidden) place(); }, { passive: true });
  btn.addEventListener("mousedown", e => e.preventDefault());     // keep the selection

  function widen(r) {
    // never cut a formula in half: take the whole of any formula the selection starts or ends inside
    const whole = n => { const el = n.nodeType === 1 ? n : n.parentElement; return el && (el.closest(".katex-display") || el.closest(".katex")); };
    const a = whole(r.startContainer), b = whole(r.endContainer);
    if (a) r.setStartBefore(a.closest(".math-tex") || a);
    if (b) r.setEndAfter(b.closest(".math-tex") || b);
    return r;
  }
  function section(r) {
    let best = null;
    art.querySelectorAll("h2[id], h3[id]").forEach(h => {
      if (h.compareDocumentPosition(r.startContainer) & Node.DOCUMENT_POSITION_FOLLOWING || h.contains(r.startContainer)) best = h;
    });
    return best;
  }

  /* ---------- figures: a picture of the figure as it is now (sliders and all), with its caption ---------- */
  function svgPng(svg) {
    const r = svg.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    if (w < 60 || h < 40) return Promise.resolve(null);
    const c = svg.cloneNode(true);
    c.setAttribute("xmlns", "http://www.w3.org/2000/svg"); c.setAttribute("width", w); c.setAttribute("height", h);
    c.style.fontFamily = getComputedStyle(svg).fontFamily || "sans-serif"; c.style.maxWidth = "none";
    c.querySelectorAll("foreignObject").forEach(f => f.remove());
    const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(c));
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const k = 2, cv = document.createElement("canvas"); cv.width = w * k; cv.height = h * k;
        const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
        try { res({ src: cv.toDataURL("image/png"), w }); } catch (e) { res(null); }
      };
      img.onerror = () => res(null); img.src = src;
    });
  }
  async function snapshot(fig) {
    const shots = [];
    const plot = fig.querySelector(".js-plotly-plot");
    if (plot && window.Plotly) {
      try { const r = plot.getBoundingClientRect(); shots.push({ src: await Plotly.toImage(plot, { format: "png", width: Math.round(r.width), height: Math.round(r.height), scale: 2 }), w: Math.round(r.width) }); } catch (e) {}
    } else {
      for (const svg of fig.querySelectorAll("svg")) {
        if (svg.closest("button") || (svg.parentElement && svg.parentElement.closest("svg"))) continue;
        const s = await svgPng(svg); if (s) shots.push(s);
      }
      fig.querySelectorAll(".fig-frame img").forEach(i => shots.push({ src: i.currentSrc || i.src, w: Math.min(i.naturalWidth || 700, 700) }));
    }
    const cap = fig.querySelector("figcaption");
    const capHtml = cap ? cap.innerHTML.replace(/<button[\s\S]*?<\/button>/g, "") : "";
    const alt = cap ? cap.textContent.replace(/Add to notebook/g, "").trim().slice(0, 200) : "Figure";
    if (!shots.length) return cap ? `<p><em>[An interactive figure: open the lesson to use it.]</em></p><p>${capHtml}</p>` : "";
    return shots.map((s, i) => `<figure class="image"><img src="${s.src}" alt="${alt.replace(/"/g, "&quot;")}" width="${Math.min(s.w, 700)}">${i === shots.length - 1 && cap ? `<figcaption>${capHtml}</figcaption>` : ""}</figure>`).join("");
  }
  async function swapFigures(frag) {
    for (const f of [...frag.querySelectorAll("figure[id]")]) {
      const live = document.getElementById(f.id);
      const tpl = document.createElement("template"); tpl.innerHTML = live ? await snapshot(live) : "";
      f.replaceWith(tpl.content);
    }
  }
  art.querySelectorAll("figure[id]").forEach(fig => {
    const cap = fig.querySelector("figcaption"); if (!cap) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "fig-clip"; b.title = "Add this figure to your notebook";
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Add to notebook`;
    cap.appendChild(b);
    b.addEventListener("click", async () => {
      b.disabled = true;
      try {
        const frag = document.createDocumentFragment(); const box = document.createElement("div"); box.innerHTML = await snapshot(fig); frag.append(...box.childNodes);
        const html = await window.MAMBA_NB.clean(frag, location.href);
        const h = section({ startContainer: fig }), lessonTitle = (M.titles && M.titles[slug]) || document.title;
        const label = `${lessonTitle} · ${h ? h.textContent.trim() + " · " : ""}${/^interactive/.test(fig.id) ? "interactive figure" : "figure"}`;
        const res = await window.MAMBA_NB.addClip({ slug, html, label, url: location.origin + location.pathname + "#" + fig.id });
        say(`<span>Figure added to your notebook</span><a href="${M.root}notebook.html#page=${encodeURIComponent(res.page)}&clip=${res.clip}">Open</a><button type="button" data-undo>Undo</button>`);
        toast.querySelector("[data-undo]").onclick = async () => { await res.undo(); say("<span>Removed from your notebook</span>", 2500); };
      } catch (e) { console.warn(e); say("<span>That figure could not be added.</span>", 4000); }
      b.disabled = false;
    });
  });

  btn.addEventListener("click", async () => {
    const r = shown || selRange();
    if (!r || !window.MAMBA_NB) return;
    btn.disabled = true;
    try {
      widen(r);
      let frag = r.cloneContents();
      // a selection inside one paragraph comes out as bare text: give it its paragraph back
      if (![...frag.childNodes].some(n => n.nodeType === 1 && /^(P|H\d|UL|OL|LI|TABLE|DIV|BLOCKQUOTE|FIGURE|PRE)$/.test(n.tagName))) {
        const p = document.createElement("p"); p.appendChild(frag); frag = document.createDocumentFragment(); frag.appendChild(p);
      }
      await swapFigures(frag);
      const html = await window.MAMBA_NB.clean(frag, location.href);
      if (!html) { btn.disabled = false; return; }
      const h = section(r), lessonTitle = (M.titles && M.titles[slug]) || document.title;
      const label = h ? `${lessonTitle} · ${h.textContent.trim()}` : lessonTitle;
      const url = location.origin + location.pathname + (h ? "#" + h.id : "");
      const res = await window.MAMBA_NB.addClip({ slug, html, label, url });
      getSelection().removeAllRanges(); btn.hidden = true; shown = null;
      say(`<span>Added to your notebook</span><a href="${M.root}notebook.html#page=${encodeURIComponent(res.page)}&clip=${res.clip}">Open</a><button type="button" data-undo>Undo</button>`);
      toast.querySelector("[data-undo]").onclick = async () => { await res.undo(); say("<span>Removed from your notebook</span>", 2500); };
    } catch (e) {
      console.warn(e); say("<span>That could not be added. Try a smaller selection.</span>", 4000);
    }
    btn.disabled = false;
  });
})();
