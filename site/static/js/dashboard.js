/* Instructor dashboard: every learner's progress and self-check scores, tutor-entered marks, roles and CSV export.
   The database only returns other people's records to tutors and the instructor (see site/supabase/schema.sql). */
(function () {
  "use strict";
  const root = document.getElementById("dash-root");
  function start() {
    const A = window.MAMBA_AUTH;
    if (!A) { root.innerHTML = ""; return; }
    const esc = A.esc, sb = A.sb, META = window.MAMBA_META || [];
    const totalQ = META.reduce((a, l) => a + l.quiz, 0);

    async function all(table, cols, order) {      // fetch every row, 1000 at a time
      let out = [], from = 0;
      for (;;) {
        let q = sb.from(table).select(cols).range(from, from + 999);
        if (order) q = q.order(order);
        const { data, error } = await q;
        if (error) throw error;
        out = out.concat(data);
        if (data.length < 1000) return out;
        from += 1000;
      }
    }
    function csv(name, header, rows) {
      const cell = v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const text = [header, ...rows].map(r => r.map(cell).join(",")).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }

    A.onUser(async (user, me) => {
      if (!user) { root.innerHTML = `<div class="empty-state"><p>Sign in with a tutor or instructor account to open the dashboard.</p><button class="btn btn-primary" type="button" data-signin>Sign in</button></div>`; return; }
      if (!me || (me.role !== "tutor" && me.role !== "instructor")) { root.innerHTML = `<p>This page is for tutors and the instructor. Your account is a learner account; <a href="${MAMBA.root}account.html">see your own progress</a>.</p>`; return; }
      root.innerHTML = `<p class="muted">Loading every learner's records…</p>`;
      let P, PR, QA, MK;
      try {
        [P, PR, QA, MK] = await Promise.all([all("profiles", "id, full_name, email, role, created_at", "created_at"), all("progress", "user_id, lesson_slug, completed_at"),
          all("quiz_answers", "user_id, question_id, lesson_slug, first_correct, last_correct, attempts, last_at"), all("marks", "id, learner_id, item, score, max_score, comment, entered_by, entered_at", "entered_at")]);
      } catch (e) { root.innerHTML = `<p class="ix-msg no">The records could not be loaded: ${esc(e.message)}.</p>`; return; }
      const byId = new Map(P.map(p => [p.id, p]));
      const name = id => { const p = byId.get(id); return p ? (p.full_name || p.email) : "unknown"; };
      const stats = new Map(P.map(p => [p.id, { done: new Set(), right: 0, answered: 0, quiz: {}, marks: [], last: p.created_at }]));
      const touch = (s, t) => { if (t && t > s.last) s.last = t; };
      PR.forEach(r => { const s = stats.get(r.user_id); if (s) { s.done.add(r.lesson_slug); touch(s, r.completed_at); } });
      QA.forEach(r => { const s = stats.get(r.user_id); if (!s) return; s.answered++; if (r.first_correct) s.right++;
        const q = s.quiz[r.lesson_slug] = s.quiz[r.lesson_slug] || { right: 0, n: 0 }; q.n++; if (r.first_correct) q.right++; touch(s, r.last_at); });
      MK.forEach(m => { const s = stats.get(m.learner_id); if (s) s.marks.push(m); });
      const learners = P.filter(p => p.role === "learner");
      const avg = f => learners.length ? learners.reduce((a, p) => a + f(stats.get(p.id)), 0) / learners.length : 0;

      root.innerHTML = `
        <div class="stat-row">
          <div class="stat"><strong>${learners.length}</strong> learners</div>
          <div class="stat"><strong>${avg(s => s.done.size).toFixed(1)}</strong> lessons completed on average</div>
          <div class="stat"><strong>${(100 * avg(s => s.answered ? s.right / s.answered : 0)).toFixed(0)}%</strong> self-check questions right first time</div>
          <div class="stat"><strong>${MK.length}</strong> marks recorded</div>
        </div>
        <section class="dash-sec"><div class="dash-head"><h2>Learners</h2>
          <div class="dash-tools"><input type="search" id="flt" placeholder="Filter by name or email"><button class="btn btn-small" id="csv-learners" type="button">Download learners (CSV)</button><button class="btn btn-small" id="csv-answers" type="button">Download all answers (CSV)</button></div></div>
          <div class="table-scroll"><table class="data-table" id="ltable"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Lessons completed</th><th>Self-check, first attempts</th><th>Marks</th><th>Last active</th></tr></thead><tbody></tbody></table></div>
          <div id="detail"></div></section>
        <section class="dash-sec"><h2>Enter a mark</h2>
          <form id="mark-form" class="mark-form">
            <label>Learner<select name="learner" required><option value="">Choose a learner</option>${learners.slice().sort((a, b) => name(a.id).localeCompare(name(b.id))).map(p => `<option value="${p.id}">${esc(name(p.id))} (${esc(p.email)})</option>`).join("")}</select></label>
            <label>Item<input name="item" list="items" required placeholder="e.g. Lesson 1 exercises"></label>
            <datalist id="items">${META.map(l => `<option value="Lesson ${l.n} exercises">`).join("")}<option value="Project"><option value="Project peer reviews"></datalist>
            <label>Score<input name="score" type="number" step="any" min="0" required></label>
            <label>Out of<input name="max" type="number" step="any" min="1" value="100" required></label>
            <label class="wide">Comment (optional)<input name="comment"></label>
            <button class="btn btn-primary" type="submit">Save mark</button><span class="form-msg" role="status"></span>
          </form></section>
        <section class="dash-sec"><div class="dash-head"><h2>Marks</h2><div class="dash-tools"><button class="btn btn-small" id="csv-marks" type="button">Download marks (CSV)</button></div></div>
          <div class="table-scroll"><table class="data-table"><thead><tr><th>Learner</th><th>Item</th><th>Mark</th><th>Comment</th><th>Entered by</th><th>Date</th><th></th></tr></thead><tbody id="mtable"></tbody></table></div></section>`;

      const tbody = root.querySelector("#ltable tbody");
      function paintLearners() {
        const f = root.querySelector("#flt").value.trim().toLowerCase();
        tbody.innerHTML = P.filter(p => !f || (p.full_name || "").toLowerCase().includes(f) || (p.email || "").toLowerCase().includes(f)).map(p => {
          const s = stats.get(p.id);
          const role = me.role === "instructor" && p.id !== me.id
            ? `<select data-role="${p.id}">${["learner", "tutor", "instructor"].map(r => `<option ${r === p.role ? "selected" : ""}>${r}</option>`).join("")}</select>` : esc(p.role);
          return `<tr data-id="${p.id}"><td><button class="link-btn" data-show="${p.id}">${esc(p.full_name || "(no name)")}</button></td><td>${esc(p.email)}</td><td>${role}</td>
            <td>${s.done.size} of ${META.length}</td><td>${s.right} of ${totalQ}${s.answered < totalQ ? ` <span class="muted">(${s.answered} answered)</span>` : ""}</td>
            <td>${s.marks.length}</td><td class="muted">${new Date(s.last).toLocaleDateString()}</td></tr>`;
        }).join("") || `<tr><td colspan="7" class="muted">No one matches that filter.</td></tr>`;
      }
      function showDetail(id) {
        const s = stats.get(id), p = byId.get(id);
        root.querySelector("#detail").innerHTML = `<div class="detail-box"><h3>${esc(p.full_name || p.email)}</h3>
          <table class="data-table"><thead><tr><th>Lesson</th><th>Completed</th><th>Self-check</th></tr></thead><tbody>${META.map(l => {
            const q = s.quiz[l.slug];
            return `<tr><td>${l.n}. ${esc(l.title)}</td><td>${s.done.has(l.slug) ? '<span class="pill ok">Yes</span>' : '<span class="muted">No</span>'}</td><td>${l.quiz ? (q ? `${q.right} of ${l.quiz}` : `<span class="muted">not started</span>`) : "–"}</td></tr>`;
          }).join("")}</tbody></table></div>`;
        root.querySelector("#detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      function paintMarks() {
        root.querySelector("#mtable").innerHTML = MK.slice().reverse().map(m => `<tr><td>${esc(name(m.learner_id))}</td><td>${esc(m.item)}</td><td><b>${+m.score}</b> / ${+m.max_score}</td>
          <td>${esc(m.comment || "")}</td><td class="muted">${esc(name(m.entered_by))}</td><td class="muted">${new Date(m.entered_at).toLocaleDateString()}</td>
          <td><button class="link-btn danger" data-del="${m.id}">Delete</button></td></tr>`).join("") || `<tr><td colspan="7" class="muted">No marks yet. Use the form above to enter the first one.</td></tr>`;
      }
      paintLearners(); paintMarks();
      root.querySelector("#flt").addEventListener("input", paintLearners);
      root.addEventListener("click", async e => {
        const show = e.target.closest("[data-show]"); if (show) showDetail(show.dataset.show);
        const del = e.target.closest("[data-del]");
        if (del && confirmDelete(del)) {
          const { error } = await sb.from("marks").delete().eq("id", +del.dataset.del);
          if (error) { del.textContent = "Not deleted"; return; }
          const i = MK.findIndex(m => m.id === +del.dataset.del); const m = MK.splice(i, 1)[0];
          const s = stats.get(m.learner_id); s.marks = s.marks.filter(x => x.id !== m.id); paintMarks(); paintLearners();
        }
      });
      function confirmDelete(btn) {          // two clicks, no pop-up: the first arms the button
        if (btn.dataset.armed) return true;
        btn.dataset.armed = "1"; btn.textContent = "Click again to delete"; setTimeout(() => { delete btn.dataset.armed; btn.textContent = "Delete"; }, 4000);
        return false;
      }
      root.addEventListener("change", async e => {
        const sel = e.target.closest("[data-role]"); if (!sel) return;
        const { error } = await sb.from("profiles").update({ role: sel.value }).eq("id", sel.dataset.role);
        if (error) { alertRow(sel, error.message); return; }
        byId.get(sel.dataset.role).role = sel.value;
      });
      function alertRow(el, text) { const td = el.closest("td"); td.insertAdjacentHTML("beforeend", `<span class="ix-msg no"> ${esc(text)}</span>`); }
      root.querySelector("#mark-form").addEventListener("submit", async e => {
        e.preventDefault();
        const f = e.target, msg = f.querySelector(".form-msg");
        const row = { learner_id: f.learner.value, item: f.item.value.trim(), score: +f.score.value, max_score: +f.max.value, comment: f.comment.value.trim() || null, entered_by: me.id || user.id };
        if (!row.learner_id || !row.item) { msg.textContent = "Choose a learner and name the item."; msg.className = "form-msg bad"; return; }
        if (row.score > row.max_score) { msg.textContent = "The score is larger than the maximum."; msg.className = "form-msg bad"; return; }
        const { data, error } = await sb.from("marks").insert(row).select().single();
        if (error) { msg.textContent = "Not saved: " + error.message; msg.className = "form-msg bad"; return; }
        MK.push(data); stats.get(data.learner_id).marks.push(data);
        paintMarks(); paintLearners();
        msg.textContent = `Saved: ${name(data.learner_id)}, ${data.item}, ${+data.score} / ${+data.max_score}.`; msg.className = "form-msg ok";
        f.score.value = ""; f.comment.value = "";
      });
      root.querySelector("#csv-learners").addEventListener("click", () => csv("mamba_learners.csv",
        ["name", "email", "role", "lessons_completed", ...META.map(l => `L${l.n}_completed`), "selfcheck_right_first", "selfcheck_answered", ...META.filter(l => l.quiz).map(l => `L${l.n}_selfcheck`)],
        P.map(p => { const s = stats.get(p.id); return [p.full_name, p.email, p.role, s.done.size, ...META.map(l => s.done.has(l.slug) ? 1 : 0), s.right, s.answered,
          ...META.filter(l => l.quiz).map(l => (s.quiz[l.slug] || { right: "" }).right)]; })));
      root.querySelector("#csv-answers").addEventListener("click", () => csv("mamba_selfcheck_answers.csv",
        ["name", "email", "lesson", "question", "first_attempt_correct", "last_attempt_correct", "attempts", "last_answered"],
        QA.map(r => [name(r.user_id), (byId.get(r.user_id) || {}).email, r.lesson_slug, r.question_id, r.first_correct ? 1 : 0, r.last_correct ? 1 : 0, r.attempts, r.last_at])));
      root.querySelector("#csv-marks").addEventListener("click", () => csv("mamba_marks.csv",
        ["name", "email", "item", "score", "max_score", "comment", "entered_by", "entered_at"],
        MK.map(m => [name(m.learner_id), (byId.get(m.learner_id) || {}).email, m.item, m.score, m.max_score, m.comment, name(m.entered_by), m.entered_at])));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
