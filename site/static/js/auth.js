/* MAMBA accounts (Supabase): sign-in, synced progress, quiz answers, and the data calls used by the
   "My progress" and instructor dashboard pages. Loaded only when course.yaml has Supabase keys. */
(function () {
  "use strict";
  const M = window.MAMBA;
  if (!M || !M.sb || !M.sb.url || !window.supabase) return;
  const sb = window.supabase.createClient(M.sb.url, M.sb.key, { auth: { persistSession: true, detectSessionInUrl: true } });
  const ANON = "mamba-progress-v1";
  let user = null, profile = null, ready = false;
  const listeners = [];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- the account area in the top bar ---------- */
  const area = document.getElementById("account");
  function paintArea() {
    if (!area) return;
    if (!user) {
      area.innerHTML = `<button class="acct-signin" type="button">Sign in</button>`;
      area.querySelector("button").addEventListener("click", () => openDialog("signin"));
      return;
    }
    const name = (profile && profile.full_name) || user.email;
    const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
    const staff = profile && (profile.role === "tutor" || profile.role === "instructor");
    area.innerHTML = `<button class="acct-btn" type="button" aria-haspopup="true" aria-expanded="false"><span class="acct-avatar">${esc(initials)}</span><span class="sr">Account menu</span></button>
      <div class="acct-menu" hidden><p class="acct-name">${esc(name)}</p><p class="acct-email">${esc(user.email)}</p>
      <a href="${M.root}account.html">My progress and scores</a><a href="#" data-install${matchMedia("(display-mode: standalone)").matches || navigator.standalone ? " hidden" : ""}>Install the app</a>${staff ? `<a href="${M.root}dashboard.html">Instructor dashboard</a>` : ""}
      <button type="button" class="acct-out">Sign out</button></div>`;
    const btn = area.querySelector(".acct-btn"), menu = area.querySelector(".acct-menu");
    btn.addEventListener("click", e => { e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute("aria-expanded", String(!menu.hidden)); });
    document.addEventListener("click", e => { if (!area.contains(e.target)) { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
    area.querySelector(".acct-out").addEventListener("click", async () => { await sb.auth.signOut(); await setUser(null); location.reload(); });
  }

  /* ---------- the sign-in / create-account dialog ---------- */
  let dlg = null;
  function buildDialog() {
    dlg = document.createElement("dialog");
    dlg.className = "auth-dialog";
    dlg.innerHTML = `<form method="dialog" class="auth-close-form"><button class="auth-x" aria-label="Close">×</button></form>
      <div class="auth-tabs" role="tablist"><button type="button" role="tab" data-tab="signin">Sign in</button><button type="button" role="tab" data-tab="signup">Create account</button></div>
      <button type="button" class="btn auth-google"><svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Continue with Google</button>
      <p class="auth-or"><span>or with your email</span></p>
      <form class="auth-form" novalidate>
        <label data-only="signup">Full name<input name="name" autocomplete="name"></label>
        <label>Email<input name="email" type="email" autocomplete="email" required></label>
        <label data-hide="reset">Password<input name="password" type="password" autocomplete="current-password" minlength="8"></label>
        <p class="auth-msg" role="status"></p>
        <button class="btn btn-primary auth-submit" type="submit">Sign in</button>
        <button class="auth-link" type="button" data-only="signin">Forgot your password?</button>
      </form>`;
    document.body.appendChild(dlg);
    dlg.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => setMode(b.dataset.tab)));
    dlg.querySelector(".auth-google").addEventListener("click", async () => {
      const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href.split("#")[0] } });
      if (error) msg(error.message, true);
    });
    dlg.querySelector(".auth-link").addEventListener("click", () => setMode("reset"));
    dlg.querySelector(".auth-form").addEventListener("submit", submit);
  }
  let mode = "signin";
  function setMode(m) {
    mode = m;
    dlg.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === m || (m === "reset" && b.dataset.tab === "signin"))));
    dlg.querySelectorAll("[data-only]").forEach(e => { e.hidden = e.dataset.only !== m; });
    dlg.querySelectorAll("[data-hide]").forEach(e => { e.hidden = e.dataset.hide === m; });
    dlg.querySelector(".auth-submit").textContent = { signin: "Sign in", signup: "Create account", reset: "Send reset link", newpw: "Save new password" }[m];
    dlg.querySelectorAll(".auth-tabs, .auth-google, .auth-or, label:has(input[name=email])").forEach(e => { e.hidden = m === "newpw"; });
    dlg.querySelector('input[name="password"]').autocomplete = m === "signup" ? "new-password" : "current-password";
    msg("");
  }
  function msg(t, bad) { const p = dlg.querySelector(".auth-msg"); p.textContent = t; p.className = "auth-msg" + (bad ? " bad" : t ? " ok" : ""); }
  async function submit(e) {
    e.preventDefault();
    const f = e.target, email = f.email.value.trim(), pw = f.password.value, name = f.name.value.trim();
    if (!email && mode !== "newpw") return msg("Enter your email address.", true);
    const btn = dlg.querySelector(".auth-submit"); btn.disabled = true;
    try {
      if (mode === "newpw") {
        if (pw.length < 8) throw new Error("Choose a password of at least 8 characters.");
        const { error } = await sb.auth.updateUser({ password: pw });
        if (error) throw error;
        msg("Password saved. You are signed in.");
      } else if (mode === "reset") {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] });
        if (error) throw error;
        msg("If an account uses that email, a reset link is on its way. Check your inbox.");
      } else if (mode === "signup") {
        if (!name) throw new Error("Enter your full name, as tutors will see it.");
        if (pw.length < 8) throw new Error("Choose a password of at least 8 characters.");
        const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { full_name: name }, emailRedirectTo: location.href.split("#")[0] } });
        if (error) throw error;
        if (data.session) { dlg.close(); } else msg("Account created. Open the confirmation link we emailed you, then sign in.");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) throw new Error(error.message === "Invalid login credentials" ? "That email and password do not match an account." : error.message);
        dlg.close();
      }
    } catch (err) { msg(err.message, true); }
    btn.disabled = false;
  }
  function openDialog(m) { if (!dlg) buildDialog(); setMode(m || "signin"); dlg.showModal(); }
  document.addEventListener("click", e => { const a = e.target.closest("[data-signin]"); if (a) { e.preventDefault(); openDialog("signin"); } });

  /* ---------- progress and quiz answers ---------- */
  async function syncProgress() {
    const { data, error } = await sb.from("progress").select("lesson_slug").eq("user_id", user.id);
    if (error) return;
    const remote = new Set(data.map(r => r.lesson_slug));
    const local = store.get(ANON).filter(s => !remote.has(s));     // lessons ticked before signing in
    if (local.length) {
      await sb.from("progress").upsert(local.map(s => ({ user_id: user.id, lesson_slug: s })), { onConflict: "user_id,lesson_slug" });
      local.forEach(s => remote.add(s));
    }
    store.del(ANON);
    window.MAMBA_setDone && window.MAMBA_setDone([...remote]);
  }
  const backend = {
    async saveProgress(slug, done) {
      if (!user) return;
      const q = done ? sb.from("progress").upsert({ user_id: user.id, lesson_slug: slug }, { onConflict: "user_id,lesson_slug" })
                     : sb.from("progress").delete().eq("user_id", user.id).eq("lesson_slug", slug);
      const { error } = await q;
      if (error) console.warn("progress not saved", error.message);
    },
    async recordQuiz(qid, slug, correct) {
      if (!user) return;
      const { error } = await sb.from("quiz_answers").upsert(
        { user_id: user.id, question_id: qid, lesson_slug: slug, first_correct: correct, last_correct: correct },
        { onConflict: "user_id,question_id" });
      if (error) console.warn("answer not saved", error.message);
      paintScore();
    }
  };
  async function paintScore() {
    const box = document.querySelector("[data-quiz-score]");
    const slug = document.querySelector("main.lesson")?.dataset.slug;
    if (!box || !slug || !user) return;
    const { data } = await sb.from("quiz_answers").select("first_correct").eq("user_id", user.id).eq("lesson_slug", slug);
    const n = (M.quizCounts || {})[slug] || 0;
    if (!data) return;
    box.hidden = false;
    box.textContent = `Your self-check score: ${data.filter(r => r.first_correct).length} of ${n} (first attempts; ${data.length} of ${n} answered).`;
  }

  /* ---------- start ---------- */
  async function setUser(u) {
    user = u;
    profile = null;
    if (user) {
      const { data } = await sb.from("profiles").select("id, full_name, role, email").eq("id", user.id).maybeSingle();
      profile = data;
      window.MAMBA_backend = backend;
      document.querySelectorAll("[data-auth-note]").forEach(n => { n.textContent = "Mark it complete to tick it off in the course outline. Your progress and self-check answers are saved to your account."; });
      await syncProgress();
      paintScore();
    } else {
      window.MAMBA_backend = null;
      window.MAMBA_setDone && window.MAMBA_setDone(null);
    }
    paintArea();
    ready = true;
    listeners.forEach(f => f(user, profile));
  }
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") openDialog("newpw");
    const u = session ? session.user : null;
    if ((u && u.id) !== (user && user.id)) setUser(u);
  });
  sb.auth.getSession().then(({ data }) => setUser(data.session ? data.session.user : null));

  window.MAMBA_AUTH = { sb, onUser: f => { listeners.push(f); if (ready) f(user, profile); }, open: openDialog, esc };
})();
