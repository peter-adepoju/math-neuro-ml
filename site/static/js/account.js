/* "My progress and scores": a learner's own completion, self-check scores and marks. */
(function () {
  "use strict";
  const root = document.getElementById("account-root");
  function start() {
    const A = window.MAMBA_AUTH;
    if (!A) { root.innerHTML = ""; return; }
    const esc = A.esc, META = window.MAMBA_META || [];
    A.onUser(async (user, profile) => {
      if (!user) {
        root.innerHTML = `<div class="empty-state"><p>Sign in to see the lessons you have completed, your self-check scores and the marks your tutors have recorded.</p><button class="btn btn-primary" type="button" data-signin>Sign in or create an account</button></div>`;
        return;
      }
      const [pr, qa, mk] = await Promise.all([
        A.sb.from("progress").select("lesson_slug, completed_at").eq("user_id", user.id),
        A.sb.from("quiz_answers").select("lesson_slug, first_correct").eq("user_id", user.id),
        A.sb.from("marks").select("item, score, max_score, comment, entered_at").eq("learner_id", user.id).order("entered_at")
      ]);
      if (pr.error || qa.error || mk.error) { root.innerHTML = `<p class="ix-msg no">Your records could not be loaded: ${esc((pr.error || qa.error || mk.error).message)}. Reload the page to try again.</p>`; return; }
      const done = new Map(pr.data.map(r => [r.lesson_slug, r.completed_at]));
      const quiz = {};
      qa.data.forEach(r => { const q = quiz[r.lesson_slug] = quiz[r.lesson_slug] || { right: 0, n: 0 }; q.n++; if (r.first_correct) q.right++; });
      const totalQ = META.reduce((a, l) => a + l.quiz, 0), right = qa.data.filter(r => r.first_correct).length;
      let rows = "", part = "";
      META.forEach(l => {
        if (l.part !== part) { part = l.part; rows += `<tr class="part-row"><th colspan="3">${esc(part)}</th></tr>`; }
        const d = done.get(l.slug), q = quiz[l.slug];
        rows += `<tr><td>${l.ready ? `<a href="${MAMBA.root}${l.url}">${l.n}. ${esc(l.title)}</a>` : `${l.n}. ${esc(l.title)} <em class="muted">coming soon</em>`}</td>
          <td>${d ? `<span class="pill ok">Completed</span> <span class="muted">${new Date(d).toLocaleDateString()}</span>` : `<span class="muted">Not yet</span>`}</td>
          <td>${l.quiz ? (q ? `${q.right} of ${l.quiz}` + (q.n < l.quiz ? ` <span class="muted">(${q.n} answered)</span>` : "") : `<span class="muted">0 of ${l.quiz}</span>`) : "–"}</td></tr>`;
      });
      const marks = mk.data.length ? `<table class="data-table"><thead><tr><th>Item</th><th>Mark</th><th>Comment</th><th>Date</th></tr></thead><tbody>${mk.data.map(m =>
        `<tr><td>${esc(m.item)}</td><td><b>${+m.score}</b> / ${+m.max_score}</td><td>${esc(m.comment || "")}</td><td class="muted">${new Date(m.entered_at).toLocaleDateString()}</td></tr>`).join("")}</tbody></table>`
        : `<p class="muted">No marks have been recorded yet. Your tutor enters exercise and project marks here.</p>`;
      root.innerHTML = `<p>Signed in as <b>${esc((profile && profile.full_name) || user.email)}</b> (${esc(user.email)}).</p>
        <div class="stat-row"><div class="stat"><strong>${done.size}</strong> of ${META.length} lessons completed</div>
        <div class="stat"><strong>${right}</strong> of ${totalQ} self-check questions right first time</div>
        <div class="stat"><strong>${mk.data.length}</strong> marks recorded</div></div>
        <h2>Lessons</h2><table class="data-table"><thead><tr><th>Lesson</th><th>Status</th><th>Self-check (first attempts)</th></tr></thead><tbody>${rows}</tbody></table>
        <h2>Marks</h2>${marks}`;
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
