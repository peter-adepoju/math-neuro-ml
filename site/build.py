"""Build the MAMBA course website.

    python site/build.py            # writes site/_build/
    python site/build.py --serve    # builds, then serves http://localhost:8000

Content lives in site/course.yaml (course page, syllabus) and site/content/ (one Markdown file per lesson or page).
See site/README.md for the Markdown conventions (maths, boxes, figures, interactives, quizzes, exercises).
"""
import html, json, os, re, shutil, sys
import yaml
from jinja2 import Environment, FileSystemLoader
from markdown_it import MarkdownIt
from mdit_py_plugins.dollarmath import dollarmath_plugin
from mdit_py_plugins.front_matter import front_matter_plugin
from mdit_py_plugins.anchors import anchors_plugin

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "_build")
REPO_ROOT = os.path.dirname(HERE)

C = yaml.safe_load(open(os.path.join(HERE, "course.yaml")))
C["supabase"] = C.get("supabase") or {}
if os.environ.get("MAMBA_SUPABASE_URL"):            # for local testing against another project
    C["supabase"] = {"url": os.environ["MAMBA_SUPABASE_URL"], "anon_key": os.environ.get("MAMBA_SUPABASE_KEY", "")}
PARTS = {p["id"]: p for p in C["parts"]}
for i, p in enumerate(C["parts"]):
    p["number"] = i + 1
    p["roman"] = ["I", "II", "III", "IV", "V"][i]
    p["lessons"] = [l for l in C["lessons"] if l["part"] == p["id"]]
for l in C["lessons"]:
    l["slug"] = f"lesson{l['n']:02d}"
    l["url"] = f"lessons/{l['slug']}.html"
    l["ready"] = bool(l.get("file")) and os.path.exists(os.path.join(HERE, "content", "lessons", l["file"]))
    l["colour"] = PARTS[l["part"]]["colour"]
    found = [d for d in sorted(os.listdir(REPO_ROOT)) if d.startswith("week") and os.path.isdir(os.path.join(REPO_ROOT, d, f"lesson{l['n']}"))]
    l["nb_dir"] = f"{found[0]}/lesson{l['n']}" if found else None
REPO = C["repo"]; BRANCH = C["branch"]
COLAB = f"https://colab.research.google.com/github/{REPO}/blob/{BRANCH}"
EDIT = f"https://github.com/{REPO}/edit/{BRANCH}/site"


def md_renderer():
    md = (MarkdownIt("commonmark", {"html": True, "typographer": False})
          .use(dollarmath_plugin, double_inline=True).use(front_matter_plugin)
          .use(anchors_plugin, min_level=2, max_level=3, permalink=False).enable("table"))
    def math_inline(self, tokens, idx, options, env):
        return f'<span class="math-tex">{html.escape(tokens[idx].content)}</span>'
    def math_block(self, tokens, idx, options, env):
        return f'<div class="math-tex display">{html.escape(tokens[idx].content)}</div>\n'
    md.add_render_rule("math_inline", math_inline)
    md.add_render_rule("math_inline_double", math_block)
    md.add_render_rule("math_block", math_block)
    return md


MD = md_renderer()
BLOCK = re.compile(r"^::: *(\w+)(.*?)\n(.*?)\n:::[ \t]*$", re.S | re.M)
SHORT = re.compile(r"\{\{\s*(\w+)\s*:\s*([^|}]+?)\s*(?:\|\s*(.*?))?\s*\}\}", re.S)


class Ctx:
    def __init__(self, slug):
        self.slug, self.fig, self.ix, self.quiz, self.ex = slug, 0, 0, 0, 0


def render_md(text, ctx):
    """Markdown with the course's extra blocks and shortcodes."""
    stash = []

    def keep(h):
        stash.append(h)
        return f"\n\nSTASH{len(stash) - 1}STASH\n\n"

    def keep_inline(h):                      # for shortcodes that may sit inside a table row or a sentence
        stash.append(h)
        return f"STASH{len(stash) - 1}STASH"

    def block(m):
        kind, arg, body = m.group(1), m.group(2).strip(), m.group(3)
        if kind in ("keypoint", "pitfall", "note", "definition", "example"):
            label = {"keypoint": "Key point", "pitfall": "Common pitfall", "note": "Note", "definition": "Definition", "example": "Worked example"}[kind]
            title = arg or label
            return keep(f'<aside class="box box-{kind}"><p class="box-title">{html.escape(title)}</p>{render_md(body, ctx)}</aside>')
        if kind == "quiz":
            return keep(render_quiz(body, ctx))
        if kind == "exercise":
            ctx.ex += 1
            q, _, a = body.partition("---answer---")
            ans = f'<details class="answer"><summary>Show answer</summary>{render_md(a.strip(), ctx)}</details>' if a.strip() else ""
            return keep(f'<div class="exercise" id="exercise-{ctx.ex}"><p class="ex-num">Exercise {ctx.ex}</p>{render_md(q.strip(), ctx)}{ans}</div>')
        if kind == "objectives":
            return keep(f'<section class="objectives"><h2 class="obj-title">What you will learn</h2>{render_md(body, ctx)}</section>')
        return m.group(0)

    text = BLOCK.sub(block, text)

    def short(m):
        kind, arg, cap = m.group(1), m.group(2).strip(), (m.group(3) or "").strip()
        capt = f'<figcaption>{render_inline(cap)}</figcaption>' if cap else ""
        if kind == "figure":
            ctx.fig += 1
            path = os.path.join(HERE, "assets", ctx.slug, arg)
            svg = open(path).read()
            svg = re.sub(r"<\?xml.*?\?>|<!DOCTYPE.*?>", "", svg, flags=re.S)
            mw = re.search(r'<svg[^>]*? width="([\d.]+)pt"', svg)
            maxw = f' style="max-width:{float(mw.group(1)) * 1.25:.0f}px"' if mw else ""
            svg = re.sub(r'<svg([^>]*?) width="[^"]*" height="[^"]*"', r'<svg\1' + maxw, svg, count=1)
            svg = svg.replace("<svg", f'<svg role="img" aria-label="Figure {ctx.fig}"', 1)
            return keep(f'<figure class="nbfig" id="figure-{ctx.fig}"><div class="fig-frame">{svg}</div>{capt}</figure>')
        if kind == "plotly":
            ctx.fig += 1
            return keep(f'<figure class="plotly-fig" id="figure-{ctx.fig}"><div class="plotly-holder" data-src="../assets/{ctx.slug}/{arg}" role="img" aria-label="Interactive figure {ctx.fig}"><button class="plotly-load">Load interactive figure</button></div>{capt}</figure>')
        if kind == "interactive":
            ctx.ix += 1
            return keep(f'<figure class="ix-fig" id="interactive-{ctx.ix}"><div class="ix" data-ix="{html.escape(arg)}"><noscript>This interactive figure needs JavaScript.</noscript></div>{capt}</figure>')
        if kind == "colab":
            nb, _, label = arg.partition(" ")
            return keep_inline(f'<a class="btn btn-colab" href="{COLAB}/{nb}">{html.escape(label or "Open in Colab")}</a>')
        return m.group(0)

    text = SHORT.sub(short, text)
    out = MD.render(text)
    for i, h in enumerate(stash):
        out = out.replace(f"<p>STASH{i}STASH</p>", h).replace(f"STASH{i}STASH", h)
    return out


def render_inline(text):
    return MD.renderInline(text) if hasattr(MD, "renderInline") else MD.render(text)


def render_quiz(body, ctx):
    qs = [q.strip() for q in re.split(r"^\?\s", "\n" + body, flags=re.M) if q.strip()]
    items = []
    for q in qs:
        lines = q.split("\n")
        stem, opts, expl = [], [], []
        for ln in lines:
            m = re.match(r"^- \[( |x)\] (.*)$", ln)
            if m:
                opts.append((m.group(1) == "x", m.group(2)))
            elif ln.startswith(">"):
                expl.append(ln[1:].strip())
            elif not opts:
                stem.append(ln)
        ctx.quiz += 1
        qid = f"{ctx.slug}-q{ctx.quiz}"
        o_html = "".join(
            f'<li><label><input type="radio" name="{qid}" value="{int(ok)}"><span>{render_inline(t)}</span></label></li>' for ok, t in opts)
        items.append(f'<div class="quiz-q" data-qid="{qid}"><p class="quiz-num">Question {ctx.quiz}</p><div class="quiz-stem">{render_md(chr(10).join(stem), ctx)}</div>'
                     f'<ul class="quiz-opts">{o_html}</ul><button class="btn btn-small quiz-check" disabled>Check answer</button>'
                     f'<div class="quiz-feedback" hidden><p class="quiz-verdict"></p>{render_md(" ".join(expl), ctx)}</div></div>')
    return f'<section class="quiz">{"".join(items)}</section>'


def toc_from_html(h):
    return [(m.group(2), int(m.group(1)), re.sub("<[^>]+>", "", m.group(3)))
            for m in re.finditer(r'<h([23]) id="([^"]+)">(.*?)</h\1>', h)]


def plain(h):
    t = re.sub(r"<(script|style|svg)[\s\S]*?</\1>", " ", h)
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def build():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, "lessons"))
    shutil.copytree(os.path.join(HERE, "static"), os.path.join(OUT, "static"))
    shutil.copytree(os.path.join(HERE, "assets"), os.path.join(OUT, "assets"),
                    ignore=shutil.ignore_patterns("*.svg"))       # SVG figures are inlined in the pages
    env = Environment(loader=FileSystemLoader(os.path.join(HERE, "templates")), autoescape=False)
    accounts = bool((C.get("supabase") or {}).get("url") and (C.get("supabase") or {}).get("anon_key"))
    quiz_counts = {}
    for l in C["lessons"]:
        if l["ready"]:
            quiz_counts[l["slug"]] = len(re.findall(r"^\?\s", open(os.path.join(HERE, "content", "lessons", l["file"])).read(), re.M))
    lesson_meta = [{"slug": l["slug"], "n": l["n"], "title": l["title"], "part": PARTS[l["part"]]["title"], "url": l["url"],
                    "ready": l["ready"], "quiz": quiz_counts.get(l["slug"], 0)} for l in C["lessons"]]
    common = dict(accounts=accounts, quiz_counts=quiz_counts, lesson_meta=lesson_meta, C=C, parts=C["parts"], lessons=C["lessons"], colab=COLAB, edit=EDIT, n_ready=sum(l["ready"] for l in C["lessons"]),
                  total_minutes=sum(l["minutes"] for l in C["lessons"]))
    search = []

    lessons = C["lessons"]
    for i, l in enumerate(lessons):
        if not l["ready"]:
            continue
        src = open(os.path.join(HERE, "content", "lessons", l["file"])).read()
        fm, body = {}, src
        m = re.match(r"^---\n(.*?)\n---\n", src, re.S)
        if m:
            fm, body = yaml.safe_load(m.group(1)) or {}, src[m.end():]
        ctx = Ctx(l["slug"])
        content = render_md(body, ctx)
        toc = toc_from_html(content)
        prev = next((x for x in reversed(lessons[:i]) if x["ready"]), None)
        nxt = next((x for x in lessons[i + 1:] if x["ready"]), None)
        page = env.get_template("lesson.html").render(
            **common, root="../", L=l, part=PARTS[l["part"]], fm=fm, content=content, toc=toc, prev=prev, next=nxt,
            nextl=lessons[i + 1] if i + 1 < len(lessons) else None, n_fig=ctx.fig, n_ix=ctx.ix, n_quiz=ctx.quiz, n_ex=ctx.ex,
            edit_url=f"{EDIT}/content/lessons/{l['file']}", ix_script=f"static/js/ix/{l['slug']}.js"
            if os.path.exists(os.path.join(HERE, "static", "js", "ix", f"{l['slug']}.js")) else None)
        open(os.path.join(OUT, l["url"]), "w").write(page)
        search.append({"t": f"Lesson {l['n']}: {l['title']}", "u": l["url"], "p": PARTS[l["part"]]["title"],
                       "h": [t for _, _, t in toc], "x": plain(content)[:20000]})

    for name in ["account", "dashboard", "project"]:      # project: text comes from the database after sign-in
        open(os.path.join(OUT, f"{name}.html"), "w").write(env.get_template(f"{name}.html").render(**common, root=""))
    for name in ["index", "resources", "privacy"]:
        extra = {}
        if name != "index":
            src = open(os.path.join(HERE, "content", "pages", f"{name}.md")).read()
            m = re.match(r"^---\n(.*?)\n---\n", src, re.S)
            fm = yaml.safe_load(m.group(1)) if m else {}
            body = src[m.end():] if m else src
            ctx = Ctx(name)
            extra = dict(fm=fm, content=render_md(body, ctx), edit_url=f"{EDIT}/content/pages/{name}.md")
            search.append({"t": fm.get("title", name), "u": f"{name}.html", "p": "", "h": [], "x": plain(extra["content"])[:20000]})
        tpl = "index.html" if name == "index" else "page.html"
        open(os.path.join(OUT, f"{name}.html"), "w").write(env.get_template(tpl).render(**common, root="", **extra))
    for l in lessons:
        search.append({"t": f"Lesson {l['n']}: {l['title']}", "u": l["url"] if l["ready"] else "index.html#syllabus",
                       "p": PARTS[l["part"]]["title"], "h": l["topics"], "x": ""} if not l["ready"] else None)
    search = [s for s in search if s]
    open(os.path.join(OUT, "static", "search.json"), "w").write(json.dumps(search))
    open(os.path.join(OUT, ".nojekyll"), "w").close()
    print(f"built {sum(l['ready'] for l in lessons)} lesson page(s) into {OUT}")


if __name__ == "__main__":
    build()
    if "--serve" in sys.argv:
        import http.server, functools
        http.server.ThreadingHTTPServer(("", 8000), functools.partial(http.server.SimpleHTTPRequestHandler, directory=OUT)).serve_forever()
