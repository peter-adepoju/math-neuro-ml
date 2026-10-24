/* Course project page. The text is not in the public site: it is read from the database (table protected_pages), which
   returns it only to tutors, the instructor, learners a tutor has given access, or everyone once the project is opened. */
(function () {
  "use strict";
  const root = document.getElementById("project-root");
  const COLAB = /\{\{\s*colab:\s*(https:\/\/colab\.research\.google\.com\/[^\s}]+)\s+([^}]*?)\s*\}\}/g;
  function render(md) {
    const mdi = window.markdownit({ html: false, linkify: false, typographer: false });
    let html = mdi.render(md).replace(COLAB, (_, url, label) =>
      `<a class="btn btn-colab" href="${url}" target="_blank" rel="noopener">${label || "Open in Colab"}</a>`);
    html = html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, "</table></div>");
    return html;
  }
  function start() {
    const A = window.MAMBA_AUTH;
    if (!A) return;
    A.onUser(async (user, me) => {
      if (!user) {
        root.innerHTML = `<div class="empty-state"><p>The course project is for learners on the course. Sign in to see it once your tutor has released it.</p>
          <button class="btn btn-primary" type="button" data-signin>Sign in</button></div>`;
        return;
      }
      const { data, error } = await A.sb.from("protected_pages").select("body, updated_at").eq("slug", "project").maybeSingle();
      if (error) { root.innerHTML = `<p class="ix-msg no">The project could not be loaded: ${A.esc(error.message)}. Reload the page to try again.</p>`; return; }
      if (!data) {
        const staff = me && (me.role === "tutor" || me.role === "instructor");
        root.innerHTML = staff
          ? `<div class="empty-state"><p>No project text has been added yet. Add it in Supabase: Table Editor → protected_pages, row <code>project</code>.</p></div>`
          : `<div class="empty-state"><p>The course project opens later in the course. Your tutor will release it when the time comes, and it will appear here.</p></div>`;
        return;
      }
      const go = () => { root.innerHTML = render(data.body); if (window.MAMBA_renderMath) window.MAMBA_renderMath(root); };
      if (window.markdownit) go(); else window.addEventListener("load", go, { once: true });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
