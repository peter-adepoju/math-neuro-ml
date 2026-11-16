# ACNEI export

Lesson Markdown as deployed to the ACNEI classroom (acnei.org), generated from
`site/content/lessons/lessonNN.md` by `/home/claude/acnei-build/transform.js`.

Differences from the website source: YAML frontmatter stripped; `:::` admonitions
rendered as bold-label blocks (ACNEI's blockquote CSS adds decorative quotation
marks, so no `>` is used); `{{ figure }}` as GitHub Pages images; `{{ interactive }}`
/ `{{ plotly }}` as links to the widget host; quiz/exercise blocks and the
Exercises / Practise-in-Python sections removed (quizzes live in ACNEI's own quiz UI).
