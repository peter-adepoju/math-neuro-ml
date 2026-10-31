/* MAMBA as an app: install prompt, offline use, and the phone layout's tab bar, search and lesson contents sheet. */
(function () {
  "use strict";
  const M = window.MAMBA || { root: "" };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // ---------- service worker: installable, and lessons work offline ----------
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    window.addEventListener("load", () => navigator.serviceWorker.register(M.root + "sw.js").catch(() => {}));
  }

  // ---------- "Get the app" ----------
  let deferred = null;
  const canInstall = () => !isStandalone();
  function paintInstall() {
    $$("[data-install]").forEach(el => { el.hidden = !canInstall(); });
    $$("[data-install-box]").forEach(el => { el.hidden = !canInstall(); });
  }
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; paintInstall(); });
  window.addEventListener("appinstalled", () => { deferred = null; paintInstall(); });

  function sheet(title, steps, note) {
    const wrap = document.createElement("div");
    wrap.className = "sheet-wrap";
    wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="sheet-grip" aria-hidden="true"></div>
      <div class="sheet-head"><img src="${M.root}static/img/app-192.png" alt="" width="48" height="48"><div><strong>${title}</strong><span>Free, and no app store needed</span></div></div>
      <ol class="sheet-steps">${steps.map(s => `<li>${s}</li>`).join("")}</ol>
      ${note ? `<p class="sheet-note">${note}</p>` : ""}
      <button type="button" class="btn btn-primary sheet-done">Got it</button></div>`;
    const close = () => wrap.remove();
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    wrap.querySelector(".sheet-done").addEventListener("click", close);
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    document.body.appendChild(wrap);
    wrap.querySelector(".sheet-done").focus();
  }
  const SHARE = '<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:-3px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  async function install() {
    if (isStandalone()) return;
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch (e) { /* dismissed */ }
      deferred = null; paintInstall();
      return;
    }
    if (isIOS()) {
      sheet("Install MAMBA on your iPhone", [
        "Open this site in <strong>Safari</strong> (other browsers on iPhone cannot install apps).",
        `Tap the <strong>Share</strong> button ${SHARE} at the bottom of the screen.`,
        "Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>."
      ], "MAMBA then opens full screen from its own icon, like any app. Your progress and sign-in come with it.");
      return;
    }
    sheet("Install MAMBA", [
      "Open your browser's menu (the <strong>&#8942;</strong> or <strong>&hellip;</strong> button).",
      "Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.",
      "Confirm, and MAMBA appears with your other apps."
    ], "Works in Chrome, Edge and Samsung Internet on Android, and in Chrome and Edge on computers.");
  }
  window.MAMBA_install = install;

  // ---------- save every lesson for offline use ----------
  async function saveOffline(btn, status) {
    if (!("caches" in window)) { status.textContent = "This browser cannot save pages for offline use."; return; }
    btn.disabled = true;
    try {
      const list = await fetch(M.root + "static/offline.json").then(r => r.json());
      const keys = await caches.keys();
      const name = keys.filter(k => k.startsWith("mamba-site-")).pop() || "mamba-site-manual";
      const cache = await caches.open(name), cdn = await caches.open("mamba-cdn-v1");
      let done = 0, failed = 0;
      const one = u => /^https?:/.test(u) ? cdn.match(u).then(hit => hit || cdn.add(u)) : cache.add(M.root + u);
      for (let i = 0; i < list.length; i += 6) {
        await Promise.all(list.slice(i, i + 6).map(u => one(u).then(() => done++, () => failed++)));
        status.textContent = `Saving… ${done + failed} of ${list.length} files`;
      }
      try { localStorage.setItem("mamba-offline-saved", String(Date.now())); } catch (e) { /* storage unavailable */ }
      status.textContent = failed ? `Saved ${done} files; ${failed} could not be saved. Try again on a better connection.` : "All lessons are saved on this device. They will open without a connection.";
      btn.textContent = "Update the saved lessons";
    } catch (e) {
      status.textContent = "Saving failed. Check your connection and try again.";
    }
    btn.disabled = false;
  }

  // ---------- phone layout ----------
  function initTabs() {
    const tab = document.body.dataset.tab;
    $$(".tab").forEach(t => { if (t.dataset.tab === tab) t.setAttribute("aria-current", "page"); });
  }

  function initPhoneSearch() {
    const btn = $(".search-open"), input = $("#q");
    if (!btn || !input) return;
    const set = open => {
      document.body.classList.toggle("search-mode", open);
      btn.setAttribute("aria-expanded", String(open));
      if (open) setTimeout(() => input.focus(), 30); else { input.blur(); const r = $("#search-results"); if (r) r.hidden = true; }
    };
    btn.addEventListener("click", e => { e.stopPropagation(); set(!document.body.classList.contains("search-mode")); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
    document.addEventListener("click", e => { if (document.body.classList.contains("search-mode") && !e.target.closest(".search") && !e.target.closest(".search-open")) set(false); });
  }

  function initLessonBar() {
    const bar = $(".lesson-bar"), sheetEl = $("#toc-sheet"), back = $(".toc-backdrop");
    if (!bar || !sheetEl) return;
    const where = $(".lb-where", bar), fill = $(".lb-fill", bar), dflt = where.dataset.default;
    const set = open => {
      document.body.classList.toggle("toc-open", open);
      bar.setAttribute("aria-expanded", String(open));
      if (back) back.hidden = !open;
    };
    bar.addEventListener("click", () => set(!document.body.classList.contains("toc-open")));
    if (back) back.addEventListener("click", () => set(false));
    $$("a", sheetEl).forEach(a => a.addEventListener("click", () => set(false)));
    document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
    // swipe the sheet down to close it
    let y0 = null;
    sheetEl.addEventListener("touchstart", e => { y0 = sheetEl.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    sheetEl.addEventListener("touchmove", e => { if (y0 !== null && e.touches[0].clientY - y0 > 70) { set(false); y0 = null; } }, { passive: true });
    // the bar shows the section being read and how far through the lesson you are
    const article = $(".prose");
    const heads = $$(".toc a").map(a => [a, document.getElementById(decodeURIComponent(a.hash.slice(1)))]).filter(x => x[1]);
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      if (article) {
        const r = article.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight * 0.6)));
        fill.style.width = (100 * p).toFixed(1) + "%";
      }
      let cur = null;
      for (const [a, h] of heads) if (h.getBoundingClientRect().top < 130) cur = a;
      where.textContent = cur && scrollY > 400 ? cur.textContent : dflt;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  function init() {
    if (isStandalone()) document.documentElement.classList.add("standalone");
    initTabs(); initPhoneSearch(); initLessonBar();
    document.addEventListener("click", e => { const t = e.target.closest("[data-install]"); if (t) { e.preventDefault(); install(); } });
    paintInstall();
    const save = $("#save-offline"), box = $("#offline-box");
    if (save && box && "caches" in window && "serviceWorker" in navigator) {
      box.hidden = false;
      const status = $("#offline-status");
      try { const t = localStorage.getItem("mamba-offline-saved"); if (t) { status.textContent = "Lessons were saved on this device on " + new Date(+t).toLocaleDateString() + "."; save.textContent = "Update the saved lessons"; } } catch (e) { /* storage unavailable */ }
      save.addEventListener("click", () => saveOffline(save, status));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
