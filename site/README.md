# The MAMBA course website

The website is built from the files in this folder and published with GitHub Pages. Every time a change under `site/` is pushed to `main`, the workflow in `.github/workflows/site.yml` rebuilds the site and publishes it (about a minute).

**One-time set-up:** in the repository go to Settings → Pages → Build and deployment, and set Source to "GitHub Actions". The site is then at `https://peter-adepoju.github.io/math-neuro-ml/`.

## Where things are

| File or folder | What it holds |
|---|---|
| `course.yaml` | the course page: title, description, outcomes, skills, instructor, FAQ, the four parts, and the list of lessons |
| `content/lessons/lessonNN.md` | one lesson page each, in Markdown |
| `content/pages/project.md`, `resources.md` | the project and resources pages |
| `assets/lessonNN/` | figures taken from the executed teaching notebooks (SVG) and the notebooks' Plotly figures (JSON) |
| `static/js/ix/lessonNN.js` | the hand-built interactive figures of each lesson |
| `static/css/site.css`, `static/js/site.js`, `templates/` | the look and behaviour of every page |
| `tools/` | helpers for adding a lesson (see below) |

## Editing a lesson

Open `content/lessons/lessonNN.md` on GitHub and click the pencil icon. Commit the change, and the site rebuilds itself.

The lesson is ordinary Markdown with a few additions:

| You write | You get |
|---|---|
| `$\mathbf{v}$` and `$$ \lVert \mathbf{v} \rVert = \sqrt{v_1^2 + v_2^2} $$` | inline and display maths (KaTeX) |
| `## Section` and `### Subsection` | headings, also listed in "On this page" |
| `::: keypoint` … `:::` | a green key-point box (also `pitfall`, `note`, `definition`, `example`, `objectives`); text after the box name becomes its title, e.g. `::: definition Definition: span` |
| `{{ figure: cell014_1.svg \| caption }}` | a figure from `assets/lessonNN/` |
| `{{ plotly: cell074_1.json \| caption }}` | an interactive Plotly figure from the notebook |
| `{{ interactive: span-basis \| caption }}` | a hand-built interactive figure registered in `static/js/ix/lessonNN.js` |
| `{{ colab: week1/lesson1/Lesson1_Teaching_Notebook.ipynb Open the teaching notebook }}` | an "Open in Colab" button |

A self-check quiz:

```
::: quiz
? The question, with maths if needed: what is $\lVert (3, 4) \rVert$?
- [ ] 7
- [x] 5
> The explanation shown after the learner checks an answer.

? The next question starts with "? ".
- [x] right answer
- [ ] wrong answer
> Explanation.
:::
```

A pen-and-paper exercise with a hidden answer:

```
::: exercise
The question.
---answer---
The worked answer.
:::
```

## Adding a lesson

1. Write `content/lessons/lessonNN.md` (a first draft can be made from the study notes with `python site/tools/tex2md.py LessonN_StudyNotes.tex draft.md`).
2. Export the notebook's figures: `python site/tools/extract_nb.py weekW/lessonN/LessonN_Teaching_Notebook.ipynb site/assets/lessonNN` re-runs the notebook and saves every Matplotlib figure as SVG and every Plotly figure as JSON, named by notebook cell. Keep only the ones the lesson uses.
3. Add the lesson's interactive figures to `static/js/ix/lessonNN.js`.
4. In `course.yaml`, add `file: lessonNN.md` to the lesson's entry. It then appears in the syllabus and sidebar.

To preview locally: `pip install markdown-it-py mdit-py-plugins pyyaml jinja2`, then `python site/build.py --serve` and open `http://localhost:8000`.

## Learner accounts (Supabase)

Accounts let learners sign up, keep their "Mark as complete" ticks and self-check answers across devices, and see the marks tutors enter. Without keys the site still works and progress stays in each browser.

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste the whole of `supabase/schema.sql` and run it. It creates the tables (`profiles`, `progress`, `quiz_answers`, `marks`) and the rules that stop learners reading or changing anyone else's records.
3. **Authentication → URL Configuration**: set *Site URL* to `https://peter-adepoju.github.io/math-neuro-ml/` and add `https://peter-adepoju.github.io/math-neuro-ml/**` under *Redirect URLs*.
4. **Google sign-in**: in Google Cloud Console create an OAuth client (type *Web application*) with the redirect URI shown in Supabase under **Authentication → Providers → Google**; paste the client ID and secret into that provider and enable it.
5. **Project Settings → API**: copy the *Project URL* and the *anon public* key into `course.yaml` under `supabase:` and commit. The *service_role* key must never go in the repository.
6. Sign up on the site, then in the SQL Editor run
   `update public.profiles set role = 'instructor' where email = 'your@email';`
   The *Instructor dashboard* appears in your account menu. From there you can make other people tutors, enter marks and export CSV files.

Self-check scores count each learner's **first** answer to each question; later attempts are recorded but do not change the score.
