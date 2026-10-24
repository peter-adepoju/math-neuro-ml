"""First-pass conversion of a MAMBA study-notes .tex file to the site's Markdown. The output is then edited by hand.
Usage: python tex2md.py NOTES.tex OUT.md"""
import re, subprocess, sys
src = open(sys.argv[1]).read()
body = src.split(r"\begin{document}", 1)[1].split(r"\end{document}", 1)[0]
body = re.sub(r"(?m)^\s*%.*$", "", body)
body = re.sub(r"\\lessontitle\{.*?\}\s*\{.*?\}\s*\{.*?\}", "", body, flags=re.S)
for cmd in ["newpage", "clearpage", "centering", "small", "normalsize", "hfill", "raggedright"]:
    body = body.replace("\\" + cmd, "")
body = re.sub(r"\\(enlargethispage|vspace)\*?\{[^}]*\}", "", body)
body = re.sub(r"\\notebook\{[^}]*\}", "", body)
stash = []
def put(x):
    stash.append(x); return f"\n\nXXS{len(stash) - 1}XX\n\n"
# code
body = re.sub(r"\\begin\{pycode\}(.*?)\\end\{pycode\}", lambda m: put(("code", m.group(1).strip("\n"))), body, flags=re.S)
# figures
def fig(m):
    t = m.group(1)
    names = re.findall(r"\\includegraphics(?:\[[^]]*\])?\{([^}]*)\}", t)
    cap = re.search(r"\\caption\{(.*)\}", t, re.S)
    lab = re.search(r"\\label\{([^}]*)\}", t)
    return put(("fig", names, cap.group(1) if cap else "", lab.group(1) if lab else ""))
body = re.sub(r"\\begin\{figure\}(?:\[[^]]*\])?(.*?)\\end\{figure\}", fig, body, flags=re.S)
# boxes
def beg(m):
    kind, arg = m.group(1), (m.group(2) or "")
    return put(("begin", kind, arg))
body = re.sub(r"\\begin\{(keypoint|pitfall|inpractice|tryit|learn)\}", lambda m: put(("begin", m.group(1), "")), body)
def balanced_args(text):
    out, i = [], 0
    pat = re.compile(r"\\begin\{(definition|worked|why)\}\{")
    while True:
        m = pat.search(text, i)
        if not m:
            out.append(text[i:]); break
        depth, j = 1, m.end()
        while depth:
            depth += {"{": 1, "}": -1}.get(text[j], 0); j += 1
        out.append(text[i:m.start()]); out.append(put(("begin", m.group(1), text[m.end():j - 1]))); i = j
    return "".join(out)
body = balanced_args(body)
body = re.sub(r"\\end\{(keypoint|pitfall|inpractice|tryit|learn|definition|worked|why)\}", lambda m: put(("end", m.group(1))), body)
# macros
body = re.sub(r"\\vect\{", r"\\mathbf{", body)
body = re.sub(r"\\unit\{([^}]*)\}", r"\\hat{\\mathbf{\1}}", body)
body = re.sub(r"\\norm\{((?:[^{}]|\{[^{}]*\})*)\}", r"\\lVert \1 \\rVert", body)
body = re.sub(r"\\code\{", r"\\texttt{", body)
body = re.sub(r"\\textcolor\{[^}]*\}\{", "{", body)
md = subprocess.run(["pandoc", "-f", "latex", "-t", "markdown-smart-raw_tex+tex_math_dollars", "--wrap=none"], input=body, capture_output=True, text=True).stdout
def tex_inline(s):
    s = re.sub(r"\\vect\{", r"\\mathbf{", s)
    return subprocess.run(["pandoc", "-f", "latex", "-t", "markdown-smart+tex_math_dollars", "--wrap=none"], input=s, capture_output=True, text=True).stdout.strip()
LABEL = {"keypoint": "keypoint", "pitfall": "pitfall", "inpractice": "note", "tryit": "note", "learn": "objectives",
         "definition": "definition", "worked": "example", "why": "note"}
TITLE = {"inpractice": "In practice", "tryit": "Try it", "definition": "Definition: ", "worked": "Worked example: ", "why": "Why it is true: "}
def back(m):
    x = stash[int(m.group(1))]
    if x[0] == "code":
        return "```python\n" + x[1] + "\n```"
    if x[0] == "fig":
        return "\n".join(f"{{{{ figure: {n} | {tex_inline(x[2])} }}}}" for n in x[1]) + (f"  <!-- label: {x[3]} -->" if x[3] else "")
    if x[0] == "begin":
        t = TITLE.get(x[1], "")
        if t.endswith(": "):
            t += tex_inline(x[2]).replace("\n", " ")
        return f"::: {LABEL[x[1]]} {t}".rstrip()
    return ":::"
md = re.sub(r"XXS(\d+)XX", back, md)
open(sys.argv[2], "w").write(md)
print("wrote", sys.argv[2], len(md.splitlines()), "lines")
