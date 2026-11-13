/* MAMBA notebook page: a Word-style editor (TinyMCE 6, MIT licence) over the pages kept by nbstore.js, with equations,
   checklists, callouts and images, and exports to Word, PDF, Markdown, a web page, plain text and a backup file. */
(function () {
  "use strict";
  const M = window.MAMBA || {};
  const NB = window.MAMBA_NB;
  const $ = s => document.querySelector(s);
  const CDN = "https://cdn.jsdelivr.net/npm/";
  const LIB = {
    tinymce: CDN + "tinymce@6.8.6/tinymce.min.js",
    docx: [CDN + "docx@9.14.0/dist/index.iife.js", CDN + "docx@9.14.0/dist/math.iife.js", CDN + "docx@9.14.0/dist/html.iife.js"],
    turndown: [CDN + "turndown@7.2.4/dist/turndown.js", CDN + "turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js"],
    mammoth: CDN + "mammoth@1.13.0/mammoth.browser.min.js"
  };
  const KATEX_CSS = CDN + "katex@0.16.11/dist/katex.min.css";
  const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=swap";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const loaded = {};
  function script(src) {
    if (!loaded[src]) loaded[src] = new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error("Could not load " + src)); }; document.head.appendChild(s); });
    return loaded[src];
  }
  async function scripts(list) { for (const s of [].concat(list)) await script(s); }
  const isPhone = () => matchMedia("(max-width: 680px)").matches;
  const dark = () => document.documentElement.getAttribute("data-theme") === "dark";

  let pages = [], current = null, editor = null, dirty = false, saveTimer = null, lastSaved = "", loading = false;

  /* ---------------------------------------------------------------- maths */
  function tex2html(tex, display, mathml) {
    try { return katex.renderToString(tex, { displayMode: !!display, throwOnError: false, strict: "ignore", output: mathml ? "htmlAndMathml" : "html" }); }
    catch (e) { return esc(tex); }
  }
  function drawMath(root) {
    if (!window.katex || !root) return;
    root.querySelectorAll(".nb-math").forEach(el => {
      const tex = el.getAttribute("data-tex") || el.textContent;
      if (el.getAttribute("data-r") === tex) return;
      el.setAttribute("data-tex", tex);
      el.innerHTML = tex2html(tex, el.getAttribute("data-display") === "1");
      el.setAttribute("data-r", tex); el.setAttribute("contenteditable", "false");
    });
  }
  /** pasted KaTeX (copied from a lesson) becomes an equation */
  function mathFromPaste(html) {
    if (!/katex/.test(html)) return html;
    const d = new DOMParser().parseFromString(html, "text/html");
    d.querySelectorAll(".katex-display, .katex").forEach(k => {
      if (!d.body.contains(k)) return;
      const a = k.querySelector('annotation[encoding="application/x-tex"]'); if (!a) return;
      const disp = k.classList.contains("katex-display"), el = d.createElement(disp ? "div" : "span"), tex = NB.expandTex(a.textContent);
      el.className = "nb-math"; el.setAttribute("data-tex", tex); if (disp) el.setAttribute("data-display", "1"); el.textContent = tex;
      k.replaceWith(el);
    });
    return d.body.innerHTML;
  }

  /* ---------------------------------------------------------------- the look of a page, in the editor and in exports */
  const PAGE_CSS = (dk) => `
    body { font-family: Jost, "Helvetica Neue", Arial, sans-serif; font-size: 16px; line-height: 1.65; color: ${dk ? "#e3e9ef" : "#1d232a"}; background: ${dk ? "#10181f" : "#fff"}; margin: 1rem 1.25rem 3rem; overflow-wrap: break-word; }
    h1, h2, h3, h4 { font-family: "Cormorant Garamond", Georgia, serif; font-weight: 600; line-height: 1.2; margin: 1.2em 0 .4em; }
    h1 { font-size: 2.2em; } h2 { font-size: 1.75em; } h3 { font-size: 1.4em; } h4 { font-size: 1.2em; }
    a { color: ${dk ? "#6cb8ee" : "#0062a8"}; }
    img { max-width: 100%; height: auto; }
    figure.image { display: table; margin: 1em auto; } figure.image figcaption { font-size: .9em; color: ${dk ? "#9fb0bf" : "#6b7680"}; text-align: center; }
    table { border-collapse: collapse; } td, th { border: 1px solid ${dk ? "#3a4a59" : "#c3cad1"}; padding: .35em .6em; vertical-align: top; }
    th { background: ${dk ? "#17222d" : "#f3f6f9"}; }
    code { font-family: "JetBrains Mono", Consolas, monospace; font-size: .9em; background: ${dk ? "#17222d" : "#f3f5f7"}; padding: .1em .3em; border-radius: 3px; }
    pre { font-family: "JetBrains Mono", Consolas, monospace; font-size: .88em; background: ${dk ? "#17222d" : "#f5f7f9"}; padding: .8em 1em; border-radius: 6px; overflow-x: auto; }
    blockquote { margin: 1em 0; padding: .5em 1em; border-left: 4px solid ${dk ? "#4aa8e8" : "#00508a"}; background: ${dk ? "#14212c" : "#f2f7fb"}; }
    blockquote.nb-clip { border-left-color: ${dk ? "#4aa8e8" : "#00508a"}; }
    .nb-src { font-size: .82em; color: ${dk ? "#9fb0bf" : "#5d6872"}; margin: .4em 0 0; }
    .nb-math { cursor: pointer; } .nb-math[data-display="1"] { display: block; text-align: center; margin: .6em 0; overflow-x: auto; }
    .nb-math:hover { outline: 1px dashed ${dk ? "#4aa8e8" : "#9cc3e0"}; outline-offset: 2px; }
    ul.nb-check { list-style: none; padding-left: .2em; } ul.nb-check li { position: relative; padding-left: 1.8em; }
    ul.nb-check li::before { content: ""; position: absolute; left: 0; top: .3em; width: 1em; height: 1em; border: 1.5px solid ${dk ? "#9fb0bf" : "#6b7680"}; border-radius: 3px; cursor: pointer; }
    ul.nb-check li[data-done="1"] { color: ${dk ? "#9fb0bf" : "#6b7680"}; text-decoration: line-through; }
    ul.nb-check li[data-done="1"]::before { background: ${dk ? "#4aa8e8" : "#00508a"}; border-color: ${dk ? "#4aa8e8" : "#00508a"}; box-shadow: inset 0 0 0 2px ${dk ? "#10181f" : "#fff"}; }
    .nb-box { margin: 1em 0; padding: .7em 1em; border-radius: 6px; border: 1px solid; }
    .nb-key { background: ${dk ? "#13283a" : "#eaf3fa"}; border-color: ${dk ? "#2c5677" : "#9cc3e0"}; }
    .nb-def { background: ${dk ? "#122b24" : "#e8f6f1"}; border-color: ${dk ? "#2b6150" : "#8fd0b8"}; }
    .nb-q { background: ${dk ? "#2b2614" : "#fdf5e1"}; border-color: ${dk ? "#6b5a26" : "#e9c46a"}; }
    .nb-warn { background: ${dk ? "#2e1c14" : "#fcebe1"}; border-color: ${dk ? "#7a4428" : "#eaa47a"}; }
    hr { border: 0; border-top: 1px solid ${dk ? "#2a3846" : "#d5dbe0"}; margin: 1.5em 0; }
    .nb-flash { animation: nbflash 2.2s ease-out; } @keyframes nbflash { 0%, 40% { background: ${dk ? "#1f4466" : "#fff2c2"}; } }`;

  /* ---------------------------------------------------------------- pages list */
  const plain = h => { const d = document.createElement("div"); d.innerHTML = (h || "").replace(/<(br|\/p|\/li|\/h\d|\/div)>/g, " $&"); return d.textContent.replace(/\s+/g, " ").trim(); };
  function sorted(list) {
    const L = list.filter(p => p.lesson).sort((a, b) => (a.sort - b.sort) || a.title.localeCompare(b.title));
    const O = list.filter(p => !p.lesson).sort((a, b) => b.created.localeCompare(a.created));
    return { L, O };
  }
  function when(iso) {
    const d = new Date(iso), s = (Date.now() - d) / 1000;
    if (s < 60) return "just now"; if (s < 3600) return Math.round(s / 60) + " min ago"; if (s < 86400) return Math.round(s / 3600) + " h ago";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
  }
  function paintList() {
    const q = ($("#nb-search").value || "").trim().toLowerCase();
    const hit = p => !q || p.title.toLowerCase().includes(q) || plain(p.html).toLowerCase().includes(q);
    const { L, O } = sorted(pages.filter(hit));
    const row = p => {
      let snip = "";
      if (q) { const t = plain(p.html), i = t.toLowerCase().indexOf(q); if (i >= 0) snip = `<span class="nb-snip">…${esc(t.slice(Math.max(0, i - 30), i + 60))}…</span>`; }
      return `<li><button type="button" class="nb-item${current && p.id === current.id ? " on" : ""}" data-id="${p.id}"><span class="nb-item-t">${esc(p.title || "Untitled page")}</span>${snip}<span class="nb-item-m">${when(p.updated)}</span></button></li>`;
    };
    $("#nb-list").innerHTML =
      (L.length ? `<p class="nb-group">From the lessons</p><ul>${L.map(row).join("")}</ul>` : "") +
      (O.length ? `<p class="nb-group">My pages</p><ul>${O.map(row).join("")}</ul>` : "") +
      (!L.length && !O.length ? `<p class="nb-empty">${q ? "Nothing matches that search." : "No pages yet."}</p>` : "");
    $("#nb-count").textContent = `${pages.length} page${pages.length === 1 ? "" : "s"}`;
  }
  async function reload() { pages = await NB.all(); paintList(); }

  /* ---------------------------------------------------------------- opening and saving */
  async function open(id, opts) {
    await saveNow();
    const p = pages.find(x => x.id === id) || (await NB.get(id));
    if (!p || p.deleted) return;
    current = p;
    $("#nb-title").value = p.title || "";
    $("#nb-title").readOnly = false;
    if (editor) { loading = true; editor.setContent(p.html || "<p></p>"); loading = false; editor.undoManager.clear(); editor.undoManager.add(); lastSaved = editor.getContent(); dirty = false; editor.nodeChanged(); }
    history.replaceState(null, "", "#page=" + encodeURIComponent(p.id));
    try { localStorage.setItem("mamba-nb-last", p.id); } catch (e) {}
    paintList(); closeSide();
    if (opts && opts.clip && editor) {
      const el = editor.getBody().querySelector("#" + CSS.escape(opts.clip));
      if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("nb-flash"); setTimeout(() => el.classList.remove("nb-flash"), 2300); }
    } else if (opts && opts.end && editor) {
      editor.getWin().scrollTo(0, editor.getBody().scrollHeight);
    }
    if (opts && opts.focusTitle) { $("#nb-title").focus(); $("#nb-title").select(); }
  }
  function changed() { dirty = true; status("Saving…"); clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 700); }
  async function saveNow() {
    clearTimeout(saveTimer);
    if (!current || !editor) return;
    const html = editor.getContent(), title = $("#nb-title").value.trim() || "Untitled page";
    if (!dirty && html === lastSaved && title === current.title) return;
    current = await NB.put(Object.assign({}, current, { html, title }), { from: "editor" });
    lastSaved = html; dirty = false;
    const i = pages.findIndex(p => p.id === current.id); if (i >= 0) pages[i] = current; else pages.push(current);
    paintList(); status();
    document.dispatchEvent(new CustomEvent("nb:saved", { detail: current }));
  }
  let syncWord = "local";
  function status(msg) {
    const el = $("#nb-status");
    if (msg) { el.textContent = msg; el.dataset.state = "saving"; return; }
    el.dataset.state = syncWord;
    el.textContent = { local: NB.signedIn() ? "Saved" : "Saved on this device", syncing: "Saved, syncing…", synced: "Saved to your account", error: "Saved on this device (sync failed)" }[syncWord] || "Saved";
  }
  NB.onSync(s => { syncWord = s; if (!dirty) status(); paintSignIn(); });
  function paintSignIn() {
    const n = $("#nb-signin-note"); if (!n) return;
    n.hidden = NB.signedIn() || !M.sb;
  }

  NB.onChange(async msg => {
    if (msg.from === "editor") return;
    await reload();
    if (current && msg.id === current.id) {
      const p = pages.find(x => x.id === current.id);
      if (!p) { current = null; pickStart(); return; }
      if (!dirty && editor && p.html !== editor.getContent()) { const y = editor.getWin().scrollY; current = p; loading = true; editor.setContent(p.html || "<p></p>"); loading = false; lastSaved = editor.getContent(); editor.getWin().scrollTo(0, y); $("#nb-title").value = p.title; }
    }
  });

  async function newPage() {
    await saveNow();
    const p = await NB.create({ title: "Untitled page", html: "<p></p>" });
    pages.push(p); await open(p.id, { focusTitle: true });
  }
  async function pickStart() {
    const h = new URLSearchParams(location.hash.slice(1));
    let id = h.get("page");
    if (!id || !pages.some(p => p.id === id)) { try { id = localStorage.getItem("mamba-nb-last"); } catch (e) { id = null; } }
    if (!id || !pages.some(p => p.id === id)) { const { L, O } = sorted(pages); id = (O[0] || L[0] || {}).id; }
    if (!id) { const p = await NB.create({ title: "My first page", html: WELCOME }); pages.push(p); id = p.id; }
    await open(id, { clip: h.get("clip") });
  }
  const WELCOME = `<h2>Welcome to your notebook</h2><p>This is your own record of what you learn in MAMBA. A few things it can do:</p>
    <ul><li>In any lesson, select some text and press <strong>Add to notebook</strong>. It lands on that lesson's page here, formulas and figures included, with a link back to where it came from.</li>
    <li>Write your own notes in between, with headings, lists, tables, colours, highlights, images and equations (the <strong>Σ</strong> button; click an equation to change it).</li>
    <li>Everything saves as you type. ${M.sb ? "Sign in and it is kept in your account too, on every device you use." : "It is kept in this browser."}</li>
    ${window.MAMBA_GOOGLE ? "<li>Connect <strong>Google Drive</strong> (bottom left) and every page is also saved to your own Drive as a Google Doc and a Word file.</li>" : ""}
    <li>Use <strong>Export</strong> to download a page or the whole notebook as a Word document, a PDF, Markdown or a web page, or a backup you can restore later.</li></ul>
    <ul class="nb-check"><li data-done="1">Open the notebook</li><li data-done="0">Add something from Lesson 1</li></ul><p>&nbsp;</p>`;

  /* ---------------------------------------------------------------- the editor */
  async function startEditor() {
    try { await script(LIB.tinymce); }
    catch (e) { $("#nb-editor-wrap").innerHTML = `<p class="nb-offline">The editor could not load. Check your connection and reload the page. Your notes are safe on this device.</p>`; return; }
    const content = current ? current.html : "";
    const dk = dark(), phone = isPhone();
    const base = LIB.tinymce.replace(/\/tinymce\.min\.js$/, "");
    await tinymce.init({
      selector: "#nb-editor", base_url: base, suffix: ".min", height: "100%",
      skin: dk ? "oxide-dark" : "oxide", content_css: [dk ? "dark" : "default", FONTS, KATEX_CSS], content_style: PAGE_CSS(dk),
      plugins: "advlist autolink lists link image charmap anchor searchreplace visualblocks visualchars code fullscreen insertdatetime table help wordcount emoticons pagebreak nonbreaking quickbars codesample directionality accordion",
      menubar: "file edit view insert format table tools help",
      menu: {
        file: { title: "File", items: "nbnew | nbexportdocx nbexportpdf nbexportmd nbexporthtml nbexporttxt | nbbackup nbopen" },
        insert: { title: "Insert", items: "image link nbequation | table codesample accordion | nbchecklist nbcallouts | charmap emoticons hr pagebreak nonbreaking anchor | insertdatetime" }
      },
      toolbar: phone
        ? "undo redo | blocks | bold italic underline | forecolor backcolor | bullist numlist nbchecklist | nbequation image table link | alignleft aligncenter alignright | outdent indent | nbcallouts removeformat"
        : "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough subscript superscript | forecolor backcolor | alignleft aligncenter alignright alignjustify lineheight | bullist numlist nbchecklist outdent indent | nbequation image table link codesample nbcallouts | searchreplace removeformat fullscreen",
      toolbar_mode: phone ? "scrolling" : "wrap", toolbar_sticky: true,
      quickbars_selection_toolbar: phone ? false : "bold italic underline | backcolor | quicklink h2 h3 blockquote | nbequation",
      quickbars_insert_toolbar: false,
      contextmenu: false, browser_spellcheck: true, statusbar: true, elementpath: false, branding: false, promotion: false, resize: false,
      block_formats: "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Quote=blockquote; Code block=pre",
      font_family_formats: "Jost=Jost,sans-serif; Cormorant Garamond=Cormorant Garamond,serif; JetBrains Mono=JetBrains Mono,monospace; Arial=arial,helvetica,sans-serif; Calibri=calibri,sans-serif; Cambria=cambria,serif; Georgia=georgia,serif; Times New Roman=times new roman,times,serif; Verdana=verdana,sans-serif; Courier New=courier new,courier,monospace",
      font_size_formats: "8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 24pt 28pt 36pt 48pt",
      line_height_formats: "1 1.15 1.5 1.65 2 2.5 3",
      color_map: ["1D232A", "Ink", "6B7680", "Grey", "00508A", "Blue", "0072B2", "Mid blue", "009E73", "Green", "D55E00", "Vermilion", "CC79A7", "Pink", "B37800", "Ochre",
        "FFF2A8", "Yellow highlight", "C9F2D9", "Green highlight", "CFE6FA", "Blue highlight", "F8D3E6", "Pink highlight", "FFD9B8", "Orange highlight", "FFFFFF", "White"],
      color_cols: 8, custom_colors: true,
      table_default_attributes: {}, table_default_styles: { "border-collapse": "collapse", width: "100%" }, table_header_type: "sectionCells",
      image_caption: true, image_advtab: true, image_title: true, object_resizing: "img,table", file_picker_types: "image",
      file_picker_callback: (cb) => pickFile("image/*", async f => cb(await NB.shrink(f), { alt: f.name.replace(/\.[^.]+$/, "") })),
      images_upload_handler: (info) => NB.shrink(info.blob()), automatic_uploads: true, paste_data_images: true, images_file_types: "jpeg,jpg,png,gif,webp,bmp,svg",
      paste_preprocess: (ed, args) => { args.content = mathFromPaste(args.content); },
      convert_urls: false, relative_urls: false, remove_script_host: false, link_default_target: "_blank", link_assume_external_targets: "https", link_title: false,
      codesample_languages: [{ text: "Python", value: "python" }, { text: "Plain text", value: "markup" }, { text: "JavaScript", value: "javascript" }, { text: "C", value: "c" }],
      pagebreak_separator: '<div class="nb-pagebreak" style="break-after: page; page-break-after: always;"></div>', pagebreak_split_block: true,
      insertdatetime_formats: ["%d %B %Y", "%H:%M", "%d/%m/%Y", "%A %d %B %Y, %H:%M"],
      noneditable_class: "nb-math",
      extended_valid_elements: "span[class|style|data-tex|data-r|contenteditable|title|id|dir|lang],div[class|style|data-tex|data-display|data-r|contenteditable|id|dir],blockquote[class|id|style|cite],li[class|style|data-done|value],ul[class|style|id]",
      style_formats: [
        { title: "Callouts", items: [
          { title: "Key idea", block: "div", classes: "nb-box nb-key", wrapper: true },
          { title: "Definition", block: "div", classes: "nb-box nb-def", wrapper: true },
          { title: "Question to revisit", block: "div", classes: "nb-box nb-q", wrapper: true },
          { title: "Watch out", block: "div", classes: "nb-box nb-warn", wrapper: true }] },
        { title: "Headings", items: [{ title: "Heading 1", format: "h1" }, { title: "Heading 2", format: "h2" }, { title: "Heading 3", format: "h3" }, { title: "Heading 4", format: "h4" }] },
        { title: "Inline", items: [{ title: "Bold", format: "bold" }, { title: "Italic", format: "italic" }, { title: "Underline", format: "underline" }, { title: "Strikethrough", format: "strikethrough" }, { title: "Superscript", format: "superscript" }, { title: "Subscript", format: "subscript" }, { title: "Code", format: "code" }] },
        { title: "Blocks", items: [{ title: "Paragraph", format: "p" }, { title: "Quote", format: "blockquote" }, { title: "Code block", format: "pre" }] }
      ],
      setup: ed => setup(ed),
      init_instance_callback: ed => {
        editor = ed;
        loading = true; ed.setContent(content || "<p></p>"); loading = false; ed.undoManager.clear(); ed.undoManager.add(); lastSaved = ed.getContent(); dirty = false; setTimeout(() => ed.nodeChanged(), 50);
        ed.on("input change undo redo SetContent ExecCommand KeyUp", e => { if (loading) return; if (e.type === "setcontent" && !e.paste && !e.selection) return; if (ed.getContent() !== lastSaved) changed(); });
        $("#nb-editor-wrap").classList.add("ready");
      }
    });
  }

  function setup(ed) {
    ed.ui.registry.addIcon("nbsigma", '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 5h12v3h-1.5l-.5-1.5H9.8l4.4 5.5-4.4 5.5H16l.5-1.5H18v3H6v-1.2l5.2-5.8L6 6.2z" fill="currentColor"/></svg>');
    ed.ui.registry.addIcon("nbcheck", '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="6" height="6" rx="1"/><path d="M5 7.6l1.3 1.3 2.2-2.5"/><rect x="3.5" y="13.5" width="6" height="6" rx="1"/><path d="M13 7.5h8M13 16.5h8"/></svg>');
    ed.ui.registry.addIcon("nbbox", '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M7.5 10h9M7.5 14h6"/></svg>');
    ed.ui.registry.addButton("nbequation", { icon: "nbsigma", tooltip: "Equation", onAction: () => eqOpen(null) });
    ed.ui.registry.addMenuItem("nbequation", { icon: "nbsigma", text: "Equation…", onAction: () => eqOpen(null) });
    ed.ui.registry.addToggleButton("nbchecklist", { icon: "nbcheck", tooltip: "Checklist", onAction: () => toggleChecklist(ed),
      onSetup: api => { const f = () => api.setActive(!!ed.dom.getParent(ed.selection.getNode(), "ul.nb-check")); ed.on("NodeChange", f); return () => ed.off("NodeChange", f); } });
    ed.ui.registry.addMenuItem("nbchecklist", { icon: "nbcheck", text: "Checklist", onAction: () => toggleChecklist(ed) });
    const boxes = [["Key idea", "nb-key"], ["Definition", "nb-def"], ["Question to revisit", "nb-q"], ["Watch out", "nb-warn"]];
    const boxItems = () => boxes.map(([t, c]) => ({ type: "menuitem", text: t, onAction: () => callout(ed, c) })).concat([{ type: "separator" }, { type: "menuitem", text: "Remove box", onAction: () => callout(ed, null) }]);
    ed.ui.registry.addMenuButton("nbcallouts", { icon: "nbbox", tooltip: "Callout box", fetch: cb => cb(boxItems()) });
    ed.ui.registry.addNestedMenuItem("nbcallouts", { icon: "nbbox", text: "Callout box", getSubmenuItems: boxItems });
    const fileItem = (name, text, fn, icon) => ed.ui.registry.addMenuItem(name, { text, icon, onAction: fn });
    fileItem("nbnew", "New page", newPage, "new-document");
    fileItem("nbexportdocx", "Export as Word (.docx)", () => exportAs("docx"));
    fileItem("nbexportpdf", "Export as PDF / print", () => exportAs("pdf"), "print");
    fileItem("nbexportmd", "Export as Markdown (.md)", () => exportAs("md"));
    fileItem("nbexporthtml", "Export as web page (.html)", () => exportAs("html"));
    fileItem("nbexporttxt", "Export as plain text (.txt)", () => exportAs("txt"));
    fileItem("nbbackup", "Download a backup of the notebook", backup, "save");
    fileItem("nbopen", "Open a file or restore a backup…", importFile, "upload");
    ed.addShortcut("meta+s", "Save", () => { saveNow().then(() => toast("Saved")); });
    ed.addShortcut("meta+shift+e", "Equation", () => eqOpen(null));

    // maths: drawn in the editor, kept as TeX in the page
    ed.on("SetContent", () => drawMath(ed.getBody()));
    ed.on("NodeChange", () => drawMath(ed.getBody()));
    ed.on("PreInit", () => {
      ed.serializer.addNodeFilter("span,div", nodes => nodes.forEach(n => {
        if (!/(^|\s)nb-math(\s|$)/.test(n.attr("class") || "")) return;
        const tex = n.attr("data-tex") || "";
        while (n.firstChild) n.firstChild.remove();
        const t = new tinymce.html.Node("#text", 3); t.value = tex; n.append(t);
        n.attr("data-r", null); n.attr("contenteditable", null);
      }));
      ed.parser.addNodeFilter("span,div", nodes => nodes.forEach(n => { if (/(^|\s)nb-math(\s|$)/.test(n.attr("class") || "")) n.attr("data-r", null); }));
    });
    ed.on("click", e => {
      const m = e.target.closest && e.target.closest(".nb-math");
      if (m) { eqOpen(m); return; }
      const li = e.target.closest && e.target.closest("ul.nb-check > li");
      if (li && e.target === li) {
        const x = e.clientX - li.getBoundingClientRect().left;
        if (x < 26) { ed.undoManager.transact(() => li.setAttribute("data-done", li.getAttribute("data-done") === "1" ? "0" : "1")); changed(); }
      }
    });
    ed.on("PastePostProcess", e => { setTimeout(() => inlineImages(ed), 50); });
  }
  async function inlineImages(ed) {
    for (const img of ed.getBody().querySelectorAll("img")) {
      const src = img.getAttribute("src") || "";
      if (/^(data|blob):/.test(src)) continue;
      try { const r = await fetch(src); if (!r.ok) continue; const d = await NB.shrink(await r.blob()); img.setAttribute("src", d); img.setAttribute("data-mce-src", d); changed(); } catch (e) { /* keeps the address */ }
    }
  }
  function toggleChecklist(ed) {
    const ul = ed.dom.getParent(ed.selection.getNode(), "ul");
    if (ul && ul.classList.contains("nb-check")) { ed.undoManager.transact(() => { ul.classList.remove("nb-check"); ul.querySelectorAll(":scope > li").forEach(li => li.removeAttribute("data-done")); }); changed(); return; }
    ed.undoManager.transact(() => {
      if (!ul) ed.execCommand("InsertUnorderedList");
      const u = ed.dom.getParent(ed.selection.getNode(), "ul");
      if (u) { u.classList.add("nb-check"); u.querySelectorAll(":scope > li").forEach(li => { if (!li.hasAttribute("data-done")) li.setAttribute("data-done", "0"); }); }
    });
    changed();
  }
  function callout(ed, cls) {
    const box = ed.dom.getParent(ed.selection.getNode(), "div.nb-box");
    ed.undoManager.transact(() => {
      if (box) {
        if (!cls) { ed.dom.remove(box, true); return; }
        box.className = "nb-box " + cls; return;
      }
      if (!cls) return;
      ed.formatter.register("nbtmp", { block: "div", classes: "nb-box " + cls, wrapper: true });
      ed.formatter.apply("nbtmp");
    });
    changed();
  }

  /* ---------------------------------------------------------------- the equation dialog */
  let eqTarget = null;
  const SNIPPETS = [["a/b", "\\frac{a}{b}"], ["x²", "x^{2}"], ["xᵢ", "x_{i}"], ["√", "\\sqrt{x}"], ["Σ", "\\sum_{i=1}^{n}"], ["∫", "\\int_{a}^{b} f(x)\\,dx"],
    ["∂", "\\frac{\\partial f}{\\partial x}"], ["d/dt", "\\frac{dx}{dt}"], ["lim", "\\lim_{x \\to 0}"], ["matrix", "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}"],
    ["vector", "\\mathbf{x}"], ["hat", "\\hat{\\beta}"], ["‖x‖", "\\lVert x \\rVert"], ["Aᵀ", "A^{\\top}"], ["ℝⁿ", "\\mathbb{R}^{n}"], ["P(A|B)", "P(A \\mid B)"],
    ["E[X]", "\\mathbb{E}[X]"], ["∼ N", "X \\sim \\mathcal{N}(\\mu, \\sigma^{2})"], ["≤", "\\leq"], ["≈", "\\approx"], ["→", "\\to"], ["±", "\\pm"], ["×", "\\times"], ["·", "\\cdot"],
    ["α", "\\alpha"], ["β", "\\beta"], ["θ", "\\theta"], ["λ", "\\lambda"], ["μ", "\\mu"], ["σ", "\\sigma"], ["τ", "\\tau"], ["ω", "\\omega"], ["Δ", "\\Delta"], ["∞", "\\infty"]];
  function eqSetup() {
    const pal = $("#eq-pal");
    pal.innerHTML = SNIPPETS.map(([l, t], i) => `<button type="button" data-i="${i}" title="${esc(t)}">${esc(l)}</button>`).join("");
    pal.addEventListener("click", e => {
      const b = e.target.closest("button[data-i]"); if (!b) return;
      const ta = $("#eq-tex"), t = SNIPPETS[+b.dataset.i][1], a = ta.selectionStart, z = ta.selectionEnd;
      ta.value = ta.value.slice(0, a) + t + ta.value.slice(z); ta.focus(); ta.selectionStart = ta.selectionEnd = a + t.length; eqPreview();
    });
    $("#eq-tex").addEventListener("input", eqPreview);
    $("#eq-display").addEventListener("change", eqPreview);
    $("#eq-ok").addEventListener("click", eqSave);
    $("#eq-del").addEventListener("click", () => { if (eqTarget && editor) { editor.undoManager.transact(() => eqTarget.remove()); changed(); } $("#nb-eq").close(); });
    $("#eq-tex").addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); eqSave(); } });
  }
  function eqPreview() {
    const tex = $("#eq-tex").value.trim(), out = $("#eq-preview");
    if (!tex) { out.innerHTML = '<span class="muted">Your equation appears here.</span>'; return; }
    try { out.innerHTML = katex.renderToString(tex, { displayMode: $("#eq-display").checked, throwOnError: true, strict: "ignore" }); out.classList.remove("bad"); }
    catch (e) { out.textContent = e.message.replace(/^KaTeX parse error: /, ""); out.classList.add("bad"); }
  }
  function eqOpen(el) {
    if (!editor) return;
    eqTarget = el;
    editor.selection && (editor.__bm = editor.selection.getBookmark(2, true));
    $("#eq-tex").value = el ? el.getAttribute("data-tex") || "" : "";
    $("#eq-display").checked = el ? el.getAttribute("data-display") === "1" : false;
    $("#eq-del").hidden = !el; $("#eq-ok").textContent = el ? "Update" : "Insert";
    eqPreview(); $("#nb-eq").showModal(); setTimeout(() => $("#eq-tex").focus(), 30);
  }
  function eqSave() {
    const tex = $("#eq-tex").value.trim(), disp = $("#eq-display").checked;
    $("#nb-eq").close();
    if (!tex || !editor) return;
    editor.focus();
    if (eqTarget) {
      editor.undoManager.transact(() => {
        if ((eqTarget.tagName === "DIV") !== disp) {
          const n = editor.dom.create(disp ? "div" : "span", { class: "nb-math", "data-tex": tex, ...(disp ? { "data-display": "1" } : {}) }, esc(tex));
          eqTarget.replaceWith(n);
        } else { eqTarget.setAttribute("data-tex", tex); eqTarget.removeAttribute("data-r"); }
      });
    } else {
      if (editor.__bm) editor.selection.moveToBookmark(editor.__bm);
      const t = esc(tex);
      editor.insertContent(disp ? `<div class="nb-math" data-display="1" data-tex="${t}">${t}</div><p>&nbsp;</p>` : `<span class="nb-math" data-tex="${t}">${t}</span>&nbsp;`);
    }
    drawMath(editor.getBody()); changed();
  }

  /* ---------------------------------------------------------------- export */
  function pagesFor(scope) {
    if (scope === "page" && current) return [Object.assign({}, current, { html: editor ? editor.getContent() : current.html, title: $("#nb-title").value || current.title })];
    const { L, O } = sorted(pages);
    return L.concat(O.slice().reverse());
  }
  /** pages as one HTML document body, with maths drawn (and its MathML kept, which Word turns into equations) */
  function exportBody(list, opts) {
    const d = document.createElement("div");
    list.forEach((p, i) => {
      const sec = document.createElement("section"); sec.className = "nb-export-page";
      if (i > 0 && opts.breaks) sec.style.pageBreakBefore = "always";
      sec.innerHTML = `<h1>${esc(p.title || "Untitled page")}</h1>` + (p.html || "");
      d.appendChild(sec);
    });
    d.querySelectorAll(".nb-math").forEach(m => {
      const tex = m.getAttribute("data-tex") || m.textContent, disp = m.getAttribute("data-display") === "1";
      if (opts.math === "tex") { m.textContent = disp ? `$$${tex}$$` : `$${tex}$`; return; }
      m.innerHTML = tex2html(tex, disp, true);
    });
    if (opts.checkboxes) d.querySelectorAll("ul.nb-check > li").forEach(li => {
      const c = document.createElement("input"); c.type = "checkbox"; if (li.getAttribute("data-done") === "1") c.setAttribute("checked", "");
      li.insertBefore(document.createTextNode(" "), li.firstChild); li.insertBefore(c, li.firstChild);
    });
    d.querySelectorAll(".nb-flash").forEach(e => e.classList.remove("nb-flash"));
    return d;
  }
  function fileName(list, ext) {
    const base = list.length === 1 ? list[0].title : "MAMBA notebook";
    const day = new Date().toISOString().slice(0, 10);
    return `${base.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "notebook"} ${day}.${ext}`;
  }
  function download(blob, name) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function standalone(list, forPrint) {
    const body = exportBody(list, { breaks: true, checkboxes: false });
    const title = list.length === 1 ? list[0].title : "My MAMBA notebook";
    return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<link rel="stylesheet" href="${FONTS}"><link rel="stylesheet" href="${KATEX_CSS}">
<style>${PAGE_CSS(false)} body { max-width: 46rem; margin: 2rem auto; padding: 0 1.25rem; } .nb-math { cursor: auto; } .nb-math:hover { outline: 0; }
.nb-export-page + .nb-export-page { margin-top: 3rem; border-top: 1px solid #d5dbe0; padding-top: 1rem; }
.nb-doc-foot { margin-top: 3rem; font-size: .8em; color: #6b7680; }
@media print { body { margin: 0; max-width: none; padding: 0; font-size: 11.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .nb-export-page + .nb-export-page { border: 0; margin: 0; padding: 0; break-before: page; }
  blockquote, figure, table, .nb-box, pre, .nb-math { break-inside: avoid; } h1, h2, h3, h4 { break-after: avoid; } a { color: inherit; } @page { margin: 18mm 16mm; } .nb-doc-foot { display: none; } }</style></head>
<body>${body.innerHTML}<p class="nb-doc-foot">Exported from MAMBA: Mathematical Sciences for Brain Data, ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.</p>${forPrint ? "" : ""}</body></html>`;
  }

  async function exportAs(fmt, scope) {
    scope = scope || ($("#nb-export").open ? ($("input[name=nb-scope]:checked") || {}).value : null) || "page";
    await saveNow();
    const list = pagesFor(scope);
    if (!list.length) { toast("There is nothing to export yet."); return; }
    try {
      if (fmt === "docx") await toDocx(list);
      else if (fmt === "pdf") await toPdf(list);
      else if (fmt === "md") await toMarkdown(list);
      else if (fmt === "html") download(new Blob([standalone(list)], { type: "text/html" }), fileName(list, "html"));
      else if (fmt === "txt") {
        const d = exportBody(list, { math: "tex" }); d.style.cssText = "position:fixed;left:-9999px;white-space:normal"; document.body.appendChild(d);
        const txt = [...d.children].map(s => s.innerText.trim()).join("\n\n\n"); d.remove();
        download(new Blob([txt], { type: "text/plain" }), fileName(list, "txt"));
      }
      if ($("#nb-export").open) $("#nb-export").close();
    } catch (e) { console.error(e); toast("That export did not work: " + (e.message || e)); }
  }
  async function toDocx(list) {
    toast("Preparing the Word document…", 20000);
    const blob = await docxBlob(list);
    download(blob, fileName(list, "docx"));
    toast("Word document downloaded");
  }
  async function docxBlob(list) {
    await scripts(LIB.docx);
    const { Document, Packer, Paragraph, TextRun, Footer, AlignmentType, PageNumber, HeadingLevel } = window.docx;
    const body = exportBody(list, { breaks: true, checkboxes: true });
    body.querySelectorAll("section").forEach((s, i) => { if (i > 0) s.insertAdjacentHTML("afterbegin", '<p style="page-break-before: always"></p>'); s.replaceWith(...s.childNodes); });
    const css = PAGE_CSS(false).replace(/font-family: Jost[^;]*;/, "font-family: Calibri, Arial, sans-serif;").replace(/font-family: "Cormorant Garamond"[^;]*;/, "font-family: Cambria, Georgia, serif;");
    const warnings = [];
    const content = window.docxHtml.htmlToContent(body.innerHTML, { stylesheet: css, maxImageWidth: 601, onWarning: w => warnings.push(w) });
    const title = list.length === 1 ? list[0].title : "My MAMBA notebook";
    const doc = new Document({
      creator: "MAMBA notebook", title, description: "Notes from MAMBA: Mathematical Sciences for Brain Data",
      styles: { default: { document: { run: { font: "Calibri", size: 22 } }, heading1: { run: { font: "Cambria", size: 36, color: "1D232A" } },
        heading2: { run: { font: "Cambria", size: 30, color: "1D232A" } }, heading3: { run: { font: "Cambria", size: 26, color: "1D232A" } }, heading4: { run: { font: "Cambria", size: 24, color: "1D232A" } } } },
      sections: [{
        properties: {},
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "6B7680" })] })] }) },
        children: content
      }]
    });
    if (warnings.length) console.info("Word export notes:", warnings);
    return Packer.toBlob(doc);
  }
  async function toPdf(list) {
    const html = standalone(list, true);
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios) {
      const w = window.open("", "_blank");
      if (!w) { toast("Allow pop-ups to print, or export as a web page."); return; }
      w.document.write(html.replace("</body>", "<script>window.onload=function(){setTimeout(function(){print()},500)}<\/script></body>")); w.document.close();
      return;
    }
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(f);
    f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
    toast("Opening print. Choose “Save as PDF” as the printer.", 5000);
    await new Promise(r => { if (f.contentDocument.readyState === "complete") r(); else f.contentWindow.addEventListener("load", r); setTimeout(r, 4000); });
    try { await f.contentDocument.fonts.ready; } catch (e) {}
    await Promise.all([...f.contentDocument.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    f.contentWindow.focus(); f.contentWindow.print();
    setTimeout(() => f.remove(), 60000);
  }
  async function toMarkdown(list) {
    await scripts(LIB.turndown);
    const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" });
    td.use(turndownPluginGfm.gfm);
    td.addRule("nbmath", { filter: n => n.classList && n.classList.contains("nb-math"),
      replacement: (c, n) => { const t = n.getAttribute("data-tex") || n.textContent; return n.getAttribute("data-display") === "1" ? `\n\n$$\n${t}\n$$\n\n` : `$${t}$`; } });
    td.addRule("nbcheck", { filter: n => n.nodeName === "LI" && n.parentNode && n.parentNode.classList && n.parentNode.classList.contains("nb-check"),
      replacement: (c, n) => `- [${n.getAttribute("data-done") === "1" ? "x" : " "}] ${c.trim()}\n` });
    td.addRule("nbbreak", { filter: n => n.classList && n.classList.contains("nb-pagebreak"), replacement: () => "\n\n---\n\n" });
    const d = document.createElement("div");
    const md = list.map(p => { d.innerHTML = p.html || ""; return `# ${p.title || "Untitled page"}\n\n` + td.turndown(d); }).join("\n\n---\n\n");
    download(new Blob([md + "\n"], { type: "text/markdown" }), fileName(list, "md"));
  }
  async function backup() {
    await saveNow();
    const all = await NB.all();
    const data = { format: "mamba-notebook", version: 1, exported: new Date().toISOString(), pages: all.map(p => ({ id: p.id, title: p.title, html: p.html, lesson: p.lesson, sort: p.sort, created: p.created, updated: p.updated })) };
    download(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }), `MAMBA notebook backup ${new Date().toISOString().slice(0, 10)}.json`);
    if ($("#nb-export").open) $("#nb-export").close();
  }

  /* ---------------------------------------------------------------- import */
  function pickFile(accept, fn) {
    const i = document.createElement("input"); i.type = "file"; i.accept = accept;
    i.onchange = () => { if (i.files[0]) fn(i.files[0]); }; i.click();
  }
  function importFile() {
    pickFile(".json,.docx,.html,.htm,.txt,.md", async f => {
      try {
        const name = f.name.replace(/\.[^.]+$/, "");
        if (/\.json$/i.test(f.name)) {
          const data = JSON.parse(await f.text());
          if (data.format !== "mamba-notebook" || !Array.isArray(data.pages)) throw new Error("This is not a MAMBA notebook backup.");
          let n = 0;
          for (const p of data.pages) {
            const have = await NB.get(p.id);
            if (have && !have.deleted && new Date(have.updated) >= new Date(p.updated)) continue;
            await NB.put({ id: p.id, title: p.title, html: p.html, lesson: p.lesson || null, sort: p.sort || 0, deleted: false, created: p.created || new Date().toISOString() }); n++;
          }
          await reload(); toast(n ? `Restored ${n} page${n === 1 ? "" : "s"} from the backup` : "Everything in that backup is already here");
          if (!current && pages[0]) open(pages[0].id);
          return;
        }
        let html;
        if (/\.docx$/i.test(f.name)) { toast("Reading the Word document…", 15000); await script(LIB.mammoth); html = (await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() })).value; }
        else if (/\.html?$/i.test(f.name)) html = await f.text();
        else html = (await f.text()).split(/\n{2,}/).map(b => `<p>${esc(b).replace(/\n/g, "<br>")}</p>`).join("");
        const clean = await NB.clean(mathFromPaste(html), location.href);
        const p = await NB.create({ title: name, html: clean || "<p></p>" });
        pages.push(p); await open(p.id); toast(`Opened “${name}” as a new page`);
      } catch (e) { console.error(e); toast(e.message || "That file could not be opened."); }
    });
    if ($("#nb-export").open) $("#nb-export").close();
  }

  /* ---------------------------------------------------------------- page actions, side panel, toasts */
  let toastT = null;
  function toast(msg, ms) { const t = $("#nb-toast"); t.textContent = msg; t.hidden = false; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove("on"); setTimeout(() => { t.hidden = true; }, 250); }, ms || 3500); }
  function openSide() { document.body.classList.add("nb-side-open"); $("#nb-pages-btn").setAttribute("aria-expanded", "true"); }
  function closeSide() { document.body.classList.remove("nb-side-open"); $("#nb-pages-btn").setAttribute("aria-expanded", "false"); }
  async function deleteCurrent() {
    if (!current) return;
    $("#nb-del-name").textContent = current.title || "Untitled page";
    $("#nb-del").showModal();
  }

  function wire() {
    $("#nb-search").addEventListener("input", paintList);
    $("#nb-list").addEventListener("click", e => { const b = e.target.closest(".nb-item"); if (b) open(b.dataset.id); });
    $("#nb-new").addEventListener("click", newPage);
    $("#nb-pages-btn").addEventListener("click", () => document.body.classList.contains("nb-side-open") ? closeSide() : openSide());
    $("#nb-side-close").addEventListener("click", closeSide);
    $("#nb-scrim").addEventListener("click", closeSide);
    $("#nb-title").addEventListener("input", () => { if (current) { dirty = true; changed(); } });
    $("#nb-title").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); editor && editor.focus(); } });
    $("#nb-export-btn").addEventListener("click", () => { $("#nb-export").showModal(); });
    $("#nb-export").addEventListener("click", e => {
      const b = e.target.closest("[data-fmt]"); if (b) exportAs(b.dataset.fmt);
      if (e.target.closest("[data-backup]")) backup();
      if (e.target.closest("[data-import]")) importFile();
    });
    $("#nb-more").addEventListener("click", e => { e.stopPropagation(); const m = $("#nb-more-menu"); m.hidden = !m.hidden; });
    document.addEventListener("click", e => { if (!e.target.closest("#nb-more-menu")) $("#nb-more-menu").hidden = true; });
    $("#nb-more-menu").addEventListener("click", async e => {
      const a = e.target.closest("[data-act]"); if (!a) return; $("#nb-more-menu").hidden = true;
      if (a.dataset.act === "delete") deleteCurrent();
      if (a.dataset.act === "duplicate" && current) { await saveNow(); const p = await NB.create({ title: current.title + " (copy)", html: current.html }); pages.push(p); open(p.id); }
      if (a.dataset.act === "lesson" && current && current.lesson) location.href = M.root + "lessons/" + current.lesson + ".html";
    });
    $("#nb-del-ok").addEventListener("click", async () => {
      $("#nb-del").close(); if (!current) return;
      const gone = current; await NB.remove(gone.id); current = null; await reload();
      pickStart(); toast(`Deleted “${gone.title}”`);
    });
    document.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveNow().then(() => toast("Saved")); } });
    addEventListener("beforeunload", () => { if (dirty) saveNow(); });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveNow(); });
    addEventListener("hashchange", () => { const h = new URLSearchParams(location.hash.slice(1)); const id = h.get("page"); if (id && (!current || id !== current.id)) open(id, { clip: h.get("clip") }); });
    // the editor is redrawn in the new colours when the theme changes
    new MutationObserver(async () => {
      if (!editor) return; const want = dark() ? "oxide-dark" : "oxide"; if (editor.options.get("skin") === want) return;
      await saveNow(); const ed = editor; editor = null; ed.remove(); $("#nb-editor").value = ""; $("#nb-editor-wrap").classList.remove("ready"); await startEditor();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    let wasPhone = isPhone();
    matchMedia("(max-width: 680px)").addEventListener("change", async () => {
      if (!editor || isPhone() === wasPhone) return; wasPhone = isPhone();
      await saveNow(); const ed = editor; editor = null; ed.remove(); $("#nb-editor-wrap").classList.remove("ready"); await startEditor();
    });
    eqSetup();
  }

  async function start() {
    if (!NB) return;
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    wire(); paintSignIn();
    await reload();
    await pickStart();
    await startEditor();
    status();
    NB.sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.MAMBA_notebook = { exportAs, get editor() { return editor; }, open, saveNow, docxBlob, toast, get pages() { return pages; }, get current() { return current; } };
})();
