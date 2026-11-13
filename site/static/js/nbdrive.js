/* MAMBA notebook: a copy of every page in the learner's own Google Drive, as a Google Doc and a Word file, in a
   "MAMBA notebook" folder. Saved automatically a minute after typing stops. Uses Google Identity Services with the
   drive.file scope, so the site can only see the files it made. Needs a Google OAuth client id in course.yaml. */
(function () {
  "use strict";
  const CLIENT = window.MAMBA_GOOGLE || "";
  const box = document.getElementById("nb-drive");
  if (!box) return;
  if (!CLIENT) { box.hidden = true; return; }
  box.hidden = false;
  const API = "https://www.googleapis.com/drive/v3", UP = "https://www.googleapis.com/upload/drive/v3";
  const SCOPE = "https://www.googleapis.com/auth/drive.file";
  const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document", GDOC = "application/vnd.google-apps.document", FOLDER = "application/vnd.google-apps.folder";
  const KEY = "mamba-drive", MAPKEY = "mamba-drive-map", TOKKEY = "mamba-drive-token";
  const NB = () => window.MAMBA_notebook, store = window.MAMBA_NB;
  const ls = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  let cfg = ls.get(KEY, { on: false }), map = ls.get(MAPKEY, {});
  let tok = (() => { try { const t = JSON.parse(sessionStorage.getItem(TOKKEY)); return t && t.exp > Date.now() + 60000 ? t : null; } catch (e) { return null; } })();
  let client = null, busy = false, again = false, timer = null, state = "idle", lastDone = cfg.last || null, error = "";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function gis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.onload = res; s.onerror = () => rej(new Error("Google sign-in could not load")); document.head.appendChild(s); });
  }
  let pending = null;
  async function ensureClient() {
    await gis();
    if (client) return;
    client = google.accounts.oauth2.initTokenClient({ client_id: CLIENT, scope: SCOPE, callback: r => {
      const p = pending; pending = null;
      if (r.error || !google.accounts.oauth2.hasGrantedAllScopes(r, SCOPE)) { p && p.rej(new Error(r.error === "access_denied" || !r.error ? "Google Drive access was not given." : r.error)); return; }
      tok = { v: r.access_token, exp: Date.now() + (r.expires_in - 60) * 1000 };
      try { sessionStorage.setItem(TOKKEY, JSON.stringify(tok)); } catch (e) {}
      p && p.res(tok.v);
    }, error_callback: e => { const p = pending; pending = null; p && p.rej(new Error(e && e.type === "popup_closed" ? "The Google window was closed." : "Google sign-in did not finish.")); } });
  }
  /** a token: must be called from a click or key press the first time each hour, as it may open Google's window */
  async function askToken(first) {
    await ensureClient();
    return new Promise((res, rej) => { pending = { res, rej }; client.requestAccessToken({ prompt: first ? "consent" : "", login_hint: cfg.email || undefined }); });
  }
  const valid = () => tok && tok.exp > Date.now();

  async function call(url, opts) {
    if (!valid()) throw Object.assign(new Error("reconnect"), { reconnect: true });
    const r = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: "Bearer " + tok.v }, (opts && opts.headers) || {}) }));
    if (r.status === 401) { tok = null; throw Object.assign(new Error("reconnect"), { reconnect: true }); }
    if (!r.ok) { let m = r.status + ""; try { m = (await r.json()).error.message; } catch (e) {} throw new Error(m); }
    return r.status === 204 ? null : r.json();
  }
  function multipart(meta, blob) {
    const fd = new FormData();
    fd.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
    fd.append("file", blob);
    return fd;
  }
  const q = s => encodeURIComponent(s);

  async function folder() {
    if (cfg.folder) {
      try { const f = await call(`${API}/files/${cfg.folder}?fields=id,trashed`); if (!f.trashed) return cfg.folder; } catch (e) { if (e.reconnect) throw e; }
    }
    const found = await call(`${API}/files?q=${q(`mimeType='${FOLDER}' and appProperties has { key='mamba' and value='notebook' } and trashed=false`)}&fields=files(id)&spaces=drive`);
    const id = found.files[0] ? found.files[0].id : (await call(`${API}/files?fields=id`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "MAMBA notebook", mimeType: FOLDER, appProperties: { mamba: "notebook" }, description: "Your notes from MAMBA: Mathematical Sciences for Brain Data. Updated automatically by the course website." }) })).id;
    cfg.folder = id; ls.set(KEY, cfg);
    return id;
  }
  /** what is already in the folder (made on any device), so pages are updated rather than copied */
  async function known(fid) {
    const out = {}; let tokn = "";
    do {
      const r = await call(`${API}/files?q=${q(`'${fid}' in parents and trashed=false`)}&fields=nextPageToken,files(id,mimeType,appProperties)&pageSize=1000${tokn ? "&pageToken=" + tokn : ""}`);
      r.files.forEach(f => { const pid = f.appProperties && f.appProperties.mambaPage; if (!pid) return; out[pid] = out[pid] || {}; out[pid][f.mimeType === GDOC ? "doc" : "word"] = f.id; });
      tokn = r.nextPageToken || "";
    } while (tokn);
    return out;
  }
  const safeName = t => (t || "Untitled page").replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 120) || "Untitled page";

  async function upload(page, fid, ids) {
    const blob = await NB().docxBlob([page]);
    const name = safeName(page.title);
    const one = async (kind, id) => {
      const meta = { name: kind === "word" ? name + ".docx" : name };
      if (id) {
        try { return (await call(`${UP}/files/${id}?uploadType=multipart&fields=id`, { method: "PATCH", body: multipart(meta, blob) })).id; }
        catch (e) { if (e.reconnect) throw e; /* gone or not convertible: make a new one */ }
      }
      Object.assign(meta, { parents: [fid], mimeType: kind === "doc" ? GDOC : DOCX, appProperties: { mambaPage: page.id, kind } });
      return (await call(`${UP}/files?uploadType=multipart&fields=id`, { method: "POST", body: multipart(meta, blob) })).id;
    };
    const doc = await one("doc", ids.doc), word = await one("word", ids.word);
    return { doc, word };
  }

  /** bring Drive up to date: every page whose latest version isn't there yet, and deleted pages to the bin */
  async function run() {
    if (!cfg.on) return;
    if (busy) { again = true; return; }
    if (!valid()) { paint("reconnect"); return; }
    busy = true; paint("saving");
    try {
      await NB().saveNow();
      const all = await store.all(true);
      const todo = all.filter(p => !p.deleted && (!map[p.id] || map[p.id].saved !== p.updated));
      const gone = all.filter(p => p.deleted && map[p.id] && !map[p.id].trashed);
      if (todo.length || gone.length) {
        const fid = await folder();
        const there = await known(fid);
        for (const p of todo) {
          const ids = Object.assign({}, there[p.id] || {}, map[p.id] || {});
          const r = await upload(p, fid, ids);
          map[p.id] = { doc: r.doc, word: r.word, saved: p.updated }; ls.set(MAPKEY, map);
        }
        for (const p of gone) {
          for (const id of [map[p.id].doc, map[p.id].word].filter(Boolean)) { try { await call(`${API}/files/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trashed: true }) }); } catch (e) { if (e.reconnect) throw e; } }
          map[p.id].trashed = true; ls.set(MAPKEY, map);
        }
      }
      lastDone = new Date().toISOString(); cfg.last = lastDone; ls.set(KEY, cfg); error = "";
      paint("done");
    } catch (e) {
      if (e.reconnect) paint("reconnect");
      else { error = e.message || String(e); console.warn("Drive save failed", e); paint("error"); }
    }
    busy = false;
    if (again) { again = false; schedule(5000); }
  }
  function schedule(ms) { clearTimeout(timer); if (cfg.on) timer = setTimeout(run, ms == null ? 60000 : ms); }

  async function connect() {
    try {
      paint("connecting");
      await askToken(!cfg.email);
      const me = await call(`${API}/about?fields=user(emailAddress,displayName)`);
      cfg = Object.assign(cfg, { on: true, email: me.user.emailAddress });
      ls.set(KEY, cfg);
      NB().toast("Google Drive connected. Your pages are being saved there now.");
      run();
    } catch (e) { error = e.message; paint(cfg.on ? "reconnect" : "off"); NB().toast(e.message || "Google Drive could not be connected."); }
  }
  async function reconnect() { try { await askToken(false); run(); } catch (e) { NB().toast(e.message); paint("reconnect"); } }
  function disconnect() {
    if (tok && window.google) try { google.accounts.oauth2.revoke(tok.v, () => {}); } catch (e) {}
    tok = null; try { sessionStorage.removeItem(TOKKEY); } catch (e) {}
    cfg = { on: false }; map = {}; ls.set(KEY, cfg); ls.set(MAPKEY, map);
    paint("off"); NB().toast("Google Drive disconnected. The files already there stay in your Drive.");
  }

  function ago(iso) {
    if (!iso) return ""; const s = (Date.now() - new Date(iso)) / 1000;
    return s < 60 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : s < 86400 ? Math.round(s / 3600) + " h ago" : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  const DRIVE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 3.5h7.6l6 10.4-3.8 6.6H6l-3.8-6.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.2 3.5l6 10.4M15.8 3.5l-6 10.4M2.2 13.9h19.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  function paint(s) {
    if (s) state = s;
    if (!cfg.on && state !== "connecting") {
      box.innerHTML = `<p class="nbd-head">${DRIVE_ICON}Google Drive</p><p class="nbd-text">Keep a Google Doc and a Word copy of every page in your own Drive, saved as you write.</p>
        <button type="button" class="btn btn-small nbd-connect" data-d="connect">Save to Google Drive</button>`;
      return;
    }
    const folderLink = cfg.folder ? `<a href="https://drive.google.com/drive/folders/${esc(cfg.folder)}" target="_blank" rel="noopener">Open folder</a>` : "";
    const line = { connecting: "Connecting…", saving: "Saving to Drive…", done: `Saved ${ago(lastDone)}`, idle: lastDone ? `Saved ${ago(lastDone)}` : "Connected",
      reconnect: "Paused: Google needs you to confirm again", error: "Last save failed" }[state] || "";
    box.innerHTML = `<p class="nbd-head">${DRIVE_ICON}Google Drive <span class="nbd-state" data-s="${state}">${esc(line)}</span></p>
      ${cfg.email ? `<p class="nbd-text">${esc(cfg.email)}</p>` : ""}
      ${state === "error" ? `<p class="nbd-text nbd-err">${esc(error)}</p>` : ""}
      <p class="nbd-acts">${state === "reconnect" ? `<button type="button" class="btn btn-small" data-d="reconnect">Continue saving</button>` : `<button type="button" class="nbd-link" data-d="now">Save now</button>`}
      ${folderLink}<button type="button" class="nbd-link" data-d="off">Disconnect</button></p>`;
  }
  box.addEventListener("click", e => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    ({ connect, reconnect, now: () => valid() ? run() : reconnect(), off: disconnect })[b.dataset.d]();
  });
  document.addEventListener("nb:saved", () => schedule());
  if (store) store.onChange(m => { if (m.from !== "editor") schedule(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && cfg.on && valid()) run(); });
  setInterval(() => { if (state === "done" || state === "idle") paint(); }, 60000);

  // on a return visit the hour's permission has usually run out: the first tap or key press quietly renews it
  if (cfg.on) {
    paint(valid() ? "idle" : "reconnect");
    if (valid()) schedule(3000);
    else {
      gis().then(ensureClient).catch(() => {});
      const renew = () => { document.removeEventListener("pointerdown", renew, true); document.removeEventListener("keydown", renew, true);
        if (!valid()) askToken(false).then(() => run()).catch(() => paint("reconnect")); };
      document.addEventListener("pointerdown", renew, true); document.addEventListener("keydown", renew, true);
    }
  } else paint("off");
  window.MAMBA_drive = { run, get state() { return state; }, get map() { return map; } };
})();
