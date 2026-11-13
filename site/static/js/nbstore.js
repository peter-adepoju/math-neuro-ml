/* MAMBA notebook: where the notebook's pages are kept (this device's IndexedDB, and the learner's account when signed in),
   and the clean-up that turns lesson content into notebook content. Loaded on every page so a lesson can add to it. */
(function () {
  "use strict";
  const M = window.MAMBA || {};
  const DB = "mamba-notebook", STORE = "pages";
  const bc = "BroadcastChannel" in window ? new BroadcastChannel("mamba-notebook") : null;
  const listeners = [];
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(STORE, { keyPath: "id" }); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode), s = t.objectStore(STORE);
      let out; Promise.resolve(fn(s)).then(v => { out = v; });
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  }
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const now = () => new Date().toISOString();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  async function all(withDeleted) {
    const rows = await tx("readonly", s => req(s.getAll()));
    return rows.filter(p => withDeleted || !p.deleted);
  }
  const get = id => tx("readonly", s => req(s.get(id)));
  async function put(page, opts) {
    const p = Object.assign({}, page);
    if (!(opts && opts.remote)) { p.updated = now(); p.dirty = true; }
    await tx("readwrite", s => req(s.put(p)));
    if (!(opts && opts.quiet)) announce(p.id, opts && opts.from);
    if (!(opts && opts.remote)) schedulePush();
    return p;
  }
  function create(fields) {
    const t = now();
    return put(Object.assign({ id: uid(), title: "Untitled page", html: "<p></p>", lesson: null, sort: Date.now(), deleted: false, created: t }, fields));
  }
  async function remove(id) { const p = await get(id); if (p) await put(Object.assign(p, { deleted: true, html: "" })); }
  function announce(id, from) {
    const msg = { type: "changed", id, from: from || null };
    if (bc) bc.postMessage(msg);
    listeners.forEach(f => f(msg));
  }
  if (bc) bc.onmessage = e => listeners.forEach(f => f(e.data));

  /* ---------- turning lesson content into notebook content ---------- */
  const MACROS = [[/\\R(?![a-zA-Z])/g, "\\mathbb{R}"], [/\\vect\{([^{}]*)\}/g, "\\mathbf{$1}"], [/\\norm\{([^{}]*)\}/g, "\\lVert $1 \\rVert"]];
  const expandTex = t => MACROS.reduce((s, [re, to]) => s.replace(re, to), String(t || "").trim());
  const KEEP = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "STRONG", "B", "EM", "I", "U", "S", "CODE", "PRE",
    "BLOCKQUOTE", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "A", "IMG", "BR", "SUB", "SUP", "FIGURE", "FIGCAPTION", "HR", "SPAN", "DIV", "MARK"]);
  const DROP = "script,style,button,input,select,textarea,svg,canvas,iframe,noscript,.ix-fig,.ix,.quiz,.plotly-holder,.sr,.anchor,summary";
  const HEAD_DOWN = { H1: "h3", H2: "h3", H3: "h4", H4: "h5" };

  function mathOf(el) {
    const a = el.querySelector('annotation[encoding="application/x-tex"]');
    return a ? a.textContent : null;
  }
  async function toDataUrl(src) {
    try {
      const r = await fetch(src); if (!r.ok) return null;
      const b = await r.blob();
      if (/svg/.test(b.type)) return await svgToPng(b);
      return await shrink(b);
    } catch (e) { return null; }
  }
  function blobToDataUrl(b) { return new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); }); }
  /** images go in as data, no wider than 1600 px, so the notebook keeps them and exports carry them */
  async function shrink(blob, max) {
    max = max || 1600;
    if (!/^image\/(png|jpeg|webp|gif|bmp)/.test(blob.type) || blob.type === "image/gif") return blobToDataUrl(blob);
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      if (img.naturalWidth <= max && blob.type !== "image/webp" && blob.size < 1.5e6) return blobToDataUrl(blob);
      const k = Math.min(1, max / img.naturalWidth), c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL(blob.type === "image/png" ? "image/png" : "image/jpeg", 0.88);
    } finally { URL.revokeObjectURL(url); }
  }
  async function svgToPng(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const w = img.naturalWidth || 800, h = img.naturalHeight || 500, k = Math.min(2, 1600 / w), c = document.createElement("canvas");
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/png");
    } finally { URL.revokeObjectURL(url); }
  }

  /** Clean HTML (a fragment or a string) into what the notebook keeps: plain structure, maths as TeX, images as data. */
  async function clean(input, base) {
    const box = document.createElement("div");
    if (typeof input === "string") box.innerHTML = new DOMParser().parseFromString(input, "text/html").body.innerHTML;
    else box.appendChild(input);
    // maths first: KaTeX (from the lessons, or pasted) becomes an equation the notebook can edit and Word can read
    box.querySelectorAll(".katex-display, .katex").forEach(k => {
      if (!box.contains(k)) return;
      const tex = mathOf(k); if (tex == null) return;
      const display = k.classList.contains("katex-display") || !!k.closest(".math-tex.display");
      const el = document.createElement(display ? "div" : "span");
      el.className = "nb-math"; el.setAttribute("data-tex", expandTex(tex)); if (display) el.setAttribute("data-display", "1");
      el.textContent = expandTex(tex);
      (k.closest(".math-tex") && box.contains(k.closest(".math-tex")) ? k.closest(".math-tex") : k).replaceWith(el);
    });
    box.querySelectorAll(".math-tex:not(.rendered)").forEach(m => {   // TeX not yet drawn
      const display = m.classList.contains("display"), el = document.createElement(display ? "div" : "span");
      el.className = "nb-math"; el.setAttribute("data-tex", expandTex(m.textContent)); if (display) el.setAttribute("data-display", "1");
      el.textContent = expandTex(m.textContent); m.replaceWith(el);
    });
    box.querySelectorAll(DROP).forEach(n => { if (!n.closest || !n.closest('figure.image')) n.remove(); });
    const walk = node => {
      [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 8) { ch.remove(); return; }
        if (ch.nodeType !== 1) return;
        if (ch.classList.contains("nb-math")) { [...ch.attributes].forEach(a => { if (!/^(class|data-tex|data-display)$/.test(a.name)) ch.removeAttribute(a.name); }); return; }
        walk(ch);
        if (!KEEP.has(ch.tagName)) { ch.replaceWith(...ch.childNodes); return; }
        let el = ch;
        if (HEAD_DOWN[ch.tagName]) { el = document.createElement(HEAD_DOWN[ch.tagName]); el.append(...ch.childNodes); ch.replaceWith(el); }
        const keepAttr = { A: ["href"], IMG: ["src", "alt", "width", "height"], TD: ["colspan", "rowspan"], TH: ["colspan", "rowspan"], FIGURE: el.classList.contains("image") ? ["class"] : [] }[el.tagName] || [];
        if (el.tagName === "FIGURE" && el.classList.contains("image")) el.className = "image";
        [...el.attributes].forEach(a => { if (!keepAttr.includes(a.name)) el.removeAttribute(a.name); });
        if (el.tagName === "A" && el.getAttribute("href")) {
          try { const u = new URL(el.getAttribute("href"), base || location.href); if (!/^https?:$/.test(u.protocol)) el.removeAttribute("href"); else el.setAttribute("href", u.href); } catch (e) { el.removeAttribute("href"); }
        }
        if ((el.tagName === "SPAN" || el.tagName === "DIV") && !el.attributes.length) {
          if (el.tagName === "DIV" && !el.querySelector("p,div,ul,ol,table,figure,h3,h4,h5,blockquote,pre")) { const p = document.createElement("p"); p.append(...el.childNodes); el.replaceWith(p); }
          else el.replaceWith(...el.childNodes);
        }
      });
    };
    walk(box);
    for (const img of box.querySelectorAll("img")) {
      const src = img.getAttribute("src") || "";
      if (/^data:/.test(src)) continue;
      let abs; try { abs = new URL(src, base || location.href).href; } catch (e) { img.remove(); continue; }
      const data = await toDataUrl(abs);
      if (data) img.setAttribute("src", data); else img.setAttribute("src", abs);
    }
    box.querySelectorAll("p,li,figcaption,h3,h4,h5").forEach(p => { if (!p.textContent.trim() && !p.querySelector("img,.nb-math,br")) p.remove(); });
    return box.innerHTML.trim();
  }

  /* ---------- adding from a lesson ---------- */
  async function addClip(c) {
    const pages = await all();
    let page = pages.find(p => p.lesson === c.slug);
    if (!page) {
      const n = (M.lessons || []).indexOf(c.slug);
      page = await create({ title: (M.titles && M.titles[c.slug]) || c.slug, lesson: c.slug, html: "", sort: n >= 0 ? n : 999 });
    }
    const id = "clip-" + uid().slice(0, 8);
    const src = c.url ? `<p class="nb-src">From <a href="${esc(c.url)}">${esc(c.label)}</a></p>` : "";
    const block = `<blockquote class="nb-clip" id="${id}">${c.html}${src}</blockquote><p>&nbsp;</p>`;
    const before = page.html || "";
    const html = (before.trim() === "<p></p>" || before.trim() === "<p>&nbsp;</p>" ? "" : before) + block;
    await put(Object.assign(page, { html }));
    return { page: page.id, clip: id, undo: async () => { const p = await get(page.id); if (p) await put(Object.assign(p, { html: before })); } };
  }
  const esc = s => String(s ?? "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  /* ---------- the learner's account: last change wins, page by page ---------- */
  let pushTimer = null, syncing = null, syncState = "local", tableMissing = false;
  const syncListeners = [];
  function setSync(s) { syncState = s; syncListeners.forEach(f => f(s)); }
  function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(() => sync(), 2500); }
  const auth = () => window.MAMBA_AUTH;
  let currentUser = null;
  function watchAuth() {
    if (!auth()) return false;
    auth().onUser(u => { currentUser = u; if (u) sync(); else setSync("local"); });
    return true;
  }
  if (!watchAuth()) document.addEventListener("DOMContentLoaded", () => { if (!watchAuth()) setTimeout(watchAuth, 1500); });

  async function sync() {
    if (!currentUser || tableMissing || !auth()) return;
    if (syncing) return syncing;
    syncing = (async () => {
      const sb = auth().sb;
      setSync("syncing");
      try {
        const { data: meta, error } = await sb.from("notebook_pages").select("id, updated_at").eq("user_id", currentUser.id);
        if (error) { if (/notebook_pages/.test(error.message) || error.code === "42P01" || error.code === "PGRST205") tableMissing = true; throw error; }
        const local = await all(true), byId = new Map(local.map(p => [p.id, p]));
        const pull = meta.filter(r => { const l = byId.get(r.id); return !l || (!l.dirty && new Date(r.updated_at) > new Date(l.updated)) || (l.dirty && new Date(r.updated_at) > new Date(l.updated)); }).map(r => r.id);
        for (let i = 0; i < pull.length; i += 20) {
          const { data, error: e2 } = await sb.from("notebook_pages").select("*").eq("user_id", currentUser.id).in("id", pull.slice(i, i + 20));
          if (e2) throw e2;
          for (const r of data) {
            await put({ id: r.id, title: r.title, html: r.html, lesson: r.lesson_slug, sort: r.sort, deleted: r.deleted, created: r.created_at, updated: r.updated_at, dirty: false }, { remote: true, from: "sync" });
          }
        }
        const remote = new Map(meta.map(r => [r.id, r.updated_at]));
        const push = (await all(true)).filter(p => p.dirty && (!remote.has(p.id) || new Date(p.updated) >= new Date(remote.get(p.id))));
        for (const p of push) {
          const { error: e3 } = await sb.from("notebook_pages").upsert({ user_id: currentUser.id, id: p.id, title: p.title, html: p.html || "", lesson_slug: p.lesson,
            sort: p.sort || 0, deleted: !!p.deleted, created_at: p.created, updated_at: p.updated }, { onConflict: "user_id,id" });
          if (e3) throw e3;
          const fresh = await get(p.id);
          if (fresh && fresh.updated === p.updated) await put(Object.assign(fresh, { dirty: false }), { remote: true, quiet: true });
        }
        setSync("synced");
      } catch (e) { console.warn("notebook not synced", e && e.message); setSync(tableMissing ? "local" : "error"); }
      finally { syncing = null; }
    })();
    return syncing;
  }
  window.addEventListener("online", () => sync());

  window.MAMBA_NB = { all, get, put, create, remove, addClip, clean, shrink, blobToDataUrl, expandTex, sync, uid,
    onChange: f => listeners.push(f), onSync: f => { syncListeners.push(f); f(syncState); }, signedIn: () => !!currentUser };
})();
