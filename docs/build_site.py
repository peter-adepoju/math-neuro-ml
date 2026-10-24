"""Build the MAMBA course website (docs/index.html) for GitHub Pages.

Run from the repository root:  python docs/build_site.py
Re-run it whenever lessons, study notes or starter notebooks are added: links to study-note PDFs and notebooks
are created only for files that exist in the repository.
"""
import glob, html, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "peter-adepoju/math-neuro-ml"
BRANCH = "main"
GH = f"https://github.com/{REPO}"
COLAB = f"https://colab.research.google.com/github/{REPO}/blob/{BRANCH}"
BLOB = f"{GH}/blob/{BRANCH}"
TREE = f"{GH}/tree/{BRANCH}"

# Week: (topic, colour from the Okabe-Ito palette, Friday date, Saturday date)
WEEKS = {
    1: ("Linear algebra I", "#0072B2", "5 Feb", "6 Feb"),
    2: ("Linear algebra II", "#56B4E9", "12 Feb", "13 Feb"),
    3: ("Calculus I", "#009E73", "19 Feb", "20 Feb"),
    4: ("Calculus II", "#E69F00", "26 Feb", "27 Feb"),
    5: ("Probability", "#CC79A7", "5 Mar", "6 Mar"),
    6: ("Differential equations", "#D55E00", "12 Mar", "13 Mar"),
    7: ("Project week", "#17212B", "19 Mar", "20 Mar"),
}

# Lesson: (week, day, title, topics, real data used in the mini-lab)
LESSONS = {
    1: (1, "Fri", "Vectors as representations", ["scalars and vectors, shape and orientation", "addition, scaling, norms and distances", "bases, coordinates, unit vectors and normalisation"], "visual-cortex population vectors"),
    2: (1, "Fri", "Dot products and projection", ["dot product and the angle between vectors", "cosine similarity and orthogonality", "projections and projection error", "weighted sums: the first stage of a neuron or classifier"], "contrast tuning as a dot product"),
    3: (1, "Sat", "Matrices as datasets", ["entries, dimensions, rows, columns, transpose", "identity, diagonal, symmetric, sparse and adjacency matrices", "elementwise versus matrix operations", "centring, scaling and missing data"], "a recording from raw counts to condition averages"),
    4: (1, "Sat", "Matrix transformations", ["matrix products and composition", "rank, inverses, rotations, shears and projections", "affine maps y = Wx + b", "moving between neural and behavioural coordinates"], "encoding and decoding matrices"),
    5: (2, "Fri", "Linear systems and least squares", ["solving Ax = b, and when not to invert", "over- and underdetermined systems", "normal equations and the pseudoinverse", "design matrices and train/test separation"], "decoding wheel movement from motor cortex"),
    6: (2, "Fri", "Eigenstructure and stability", ["the eigenvalue equation", "real, complex and repeated eigenvalues", "stability in discrete and continuous time", "dominant modes and timescales"], "dynamics of motor-cortex activity within a trial"),
    7: (2, "Sat", "Covariance and PCA", ["covariance matrices and scale", "principal axes, scores and loadings", "explained variance and low-rank reconstruction", "standardisation and leakage"], "principal components of motor cortex"),
    8: (3, "Fri", "Functions, limits and continuity", ["parameters versus variables", "linear, exponential, sigmoid, ReLU and piecewise functions", "limits, continuity and asymptotes", "sampling and plot-resolution pitfalls"], "a neuron's firing against wheel speed"),
    9: (3, "Fri", "Derivatives and sensitivity", ["the derivative as a limit", "derivative rules and activation derivatives", "local linear approximation and units", "finite differences and noisy data"], "the rate of rise of real action potentials"),
    10: (3, "Sat", "Chain rule and backpropagation", ["the chain rule", "computation graphs and reverse accumulation", "gradient checking", "vanishing and exploding gradients"], "a small network decoding wheel movement"),
    11: (3, "Sat", "Critical points and curvature", ["critical points and the second derivative", "Taylor approximation", "convex and non-convex objectives", "flat and sharp directions"], "the loss landscape of a neuron's speed response"),
    12: (4, "Fri", "1D gradient descent", ["the update rule and the learning rate", "convergence and stopping", "stochastic gradients and schedules", "reproducibility"], "how strongly a motor-cortex neuron follows the wheel"),
    13: (4, "Fri", "Integration and accumulation", ["antiderivatives and definite integrals", "Riemann sums and average value", "the fundamental theorem", "numerical quadrature and irregular sampling"], "wheel position from wheel velocity"),
    14: (4, "Sat", "Multivariable gradients", ["partial derivatives", "gradients, directional derivatives and contour maps", "the Hessian", "feature scaling and units"], "a visual neuron's response surface"),
    15: (4, "Sat", "Multidimensional optimisation", ["gradient descent in many dimensions", "conditioning and elongated valleys", "preconditioning and momentum", "regularisation and validation"], "training a motor-cortex decoder"),
    16: (5, "Fri", "Probability rules", ["axioms and events", "joint, conditional and marginal probability", "independence and total probability", "confusion matrices and thresholds"], "what the mouse saw, what it did, and what visual cortex knew"),
    17: (5, "Fri", "Random variables and variability", ["mass, density and cumulative distributions", "expectation, variance and covariance", "transformations and standardisation", "CV and Fano factor"], "how variable real neurons are"),
    18: (5, "Sat", "Binomial, Poisson and Gaussian", ["Bernoulli and binomial trials", "Poisson counts", "the Gaussian and the central limit theorem", "likelihood and goodness of fit"], "models of a mouse's choices and its motor cortex"),
    19: (5, "Sat", "Bayesian inference and decisions", ["Bayes' rule, odds and likelihood ratios", "posterior updating", "MAP versus posterior mean", "expected loss and calibration"], "a Bayesian look at the mouse and its visual cortex"),
    20: (6, "Fri", "Inference and model checking", ["sampling variability and standard errors", "the bootstrap", "correlation and confounding", "ROC curves and dispersion checks"], "error bars on earlier conclusions"),
    21: (6, "Fri", "ODEs and the passive membrane", ["first-order ODEs and initial-value problems", "equilibria and time constants", "the membrane equation", "Euler's method and its error"], "fitting the membrane equation to a real neuron"),
    22: (6, "Sat", "Leaky integrate-and-fire neurons", ["threshold, reset and refractory period", "rheobase and the f–I curve", "deterministic and noisy drive", "time-step sensitivity"], "does a real neuron behave like a LIF?"),
    23: (6, "Sat", "Coupled ODEs and Wilson–Cowan", ["coupled rate equations", "phase planes, nullclines and fixed points", "the Jacobian and stability", "excitatory–inhibitory oscillations"], "a two-variable model of a sagging neuron"),
}

PROJECTS = [
    (1, "Choice from visual cortex", "How well does visual cortex predict which way the mouse turns, and do other areas do better?", "Steinmetz s11, s25"),
    (2, "How many dimensions does motor cortex need?", "How many principal components are needed to decode wheel movement, and does the answer hold in a second mouse?", "Steinmetz s10, s28"),
    (3, "How sure are we of a psychometric curve?", "How precisely can we estimate a mouse's sensitivity to contrast and its bias?", "Steinmetz s11, s25"),
    (4, "Are motor-cortex spike counts Poisson?", "How much more variable than Poisson are the counts, and how much of that does movement explain?", "Steinmetz s10, s28"),
    (5, "Is variability shared across brain areas?", "When the mouse sees nothing, do neurons in different areas fluctuate together?", "Steinmetz s11, s25"),
    (6, "How do action potentials change during a train?", "How do threshold, height, rate of rise and width change from spike to spike?", "patch clamp, 20 kHz"),
    (7, "How much of a real neuron does a LIF model capture?", "With measured passive properties, how well does a LIF reproduce a real f–I curve?", "patch clamp, 10 kHz"),
    (8, "When does an excitatory–inhibitory circuit oscillate?", "Which couplings and inputs give a stable state, oscillations or two stable states?", "simulation"),
]

DATASETS = [
    ("Mouse visual decision task, Neuropixels (sessions 11 and 25)", "Spike counts of 698 and 1056 neurons across the brain, 200 ms after the stimulus, with contrasts and choices", "CC0", "Steinmetz et al. 2019"),
    ("Mouse motor cortex with wheel movement (sessions 10 and 28)", "Spike counts of 447 and 180 neurons in 10 ms bins over 2.5 s trials, with wheel velocity", "CC0", "Steinmetz et al. 2019"),
    ("Whole-cell current clamp (two cells)", "Membrane potential during current steps, at 10 kHz and 20 kHz", "MIT", "pyABF sample files"),
]


def esc(s):
    return html.escape(s, quote=True)


def exists(rel):
    return os.path.exists(os.path.join(ROOT, rel))


def lesson_links(n, week):
    folder = f"week{week}/lesson{n}"
    out = []
    for kind, label in [("Teaching_Notebook", "Teaching notebook"), ("Exercises_Notebook", "Exercises")]:
        rel = f"{folder}/Lesson{n}_{kind}.ipynb"
        if exists(rel):
            out.append(f'<a class="btn" href="{COLAB}/{rel}">{label}<span class="sr"> for lesson {n}</span> <span class="via">in Colab</span></a>')
    pdfs = sorted(glob.glob(os.path.join(ROOT, folder, "*Study*.pdf")))
    if pdfs:
        rel = os.path.relpath(pdfs[0], ROOT)
        out.append(f'<a class="btn" href="{BLOB}/{rel}">Study notes<span class="sr"> for lesson {n}</span> <span class="via">PDF</span></a>')
    if os.path.isdir(os.path.join(ROOT, folder)):
        out.append(f'<a class="quiet" href="{TREE}/{folder}">Files on GitHub<span class="sr"> for lesson {n}</span></a>')
    return "\n".join(out)


def hero_svg():
    """A real spike raster: one 2.5 s trial of mouse motor cortex (Steinmetz et al. 2019, session 10, CC0)."""
    d = np.load(os.path.join(ROOT, "data", "steinmetz_s10_hench_mop.npz"))
    trial = 113
    S = d["spikes"][trial]                                   # (447, 250) counts per 10 ms bin
    wheel = d["wheel"][trial].astype(float)                  # (250,) encoder steps per 10 ms bin
    active = np.flatnonzero(S.sum(axis=1) > 0)
    sm = np.array([np.convolve(S[j], np.ones(9) / 9, mode="same") for j in active])
    order = active[np.argsort(np.argmax(sm, axis=1), kind="stable")]   # sorted by time of peak firing
    W, top, row = 1000, 8, 1.3
    h_r = top + row * len(order)
    ticks = []
    for i, j in enumerate(order):
        y = top + i * row
        for b in np.flatnonzero(S[j]):
            ticks.append(f"M{b * 4 + 2} {y:.1f}v{row * 0.9:.1f}")
    base = h_r + 70
    v = wheel / max(1, np.abs(wheel).max()) * 44
    trace = "M" + " L".join(f"{b * 4 + 2} {base - v[b]:.1f}" for b in range(250))
    H = base + 52
    onset = 0.5 / 2.5 * W
    return f"""<svg class="raster" viewBox="0 0 {W} {H:.0f}" role="img" aria-labelledby="raster-title raster-desc">
<title id="raster-title">Spikes of {len(order)} motor-cortex neurons during one trial</title>
<desc id="raster-desc">Each row is one neuron of a mouse's primary motor cortex, each tick a spike, over 2.5 seconds; the line below is the wheel the mouse turned. Rows are sorted by when each neuron fired most.</desc>
<g class="reveal">
<path class="spikes" d="{''.join(ticks)}"/>
<path class="wheel" d="{trace}"/>
</g>
<line class="onset" x1="{onset:.0f}" x2="{onset:.0f}" y1="0" y2="{H - 20:.0f}"/>
<text class="lab" x="{onset + 6:.0f}" y="{H - 8:.0f}">grating appears</text>
<text class="lab" x="{W - 4}" y="{H - 8:.0f}" text-anchor="end">2.5 s</text>
<text class="lab" x="4" y="{base - 52:.0f}">wheel</text>
</svg>""", len(order), int(S.sum())


def build():
    svg, n_neu, n_spk = hero_svg()

    sched = []
    for w, (topic, col, fri, sat) in WEEKS.items():
        if w == 7:
            days = [("Fri", fri, "Project analysis; presentation development and rehearsal"),
                    ("Sat", sat, "Project presentations; peer review and course reflection")]
            body = "".join(f'<li><span class="day">{d} {dt}</span>{esc(t)}</li>' for d, dt, t in days)
        else:
            body = ""
            for d, dt in [("Fri", fri), ("Sat", sat)]:
                items = [f'<a href="#lesson-{n}">{n}. {esc(v[2])}</a>' for n, v in LESSONS.items() if v[0] == w and v[1] == d]
                if w == 2 and d == "Sat":
                    items.append('<a href="#project">Project discussion</a>')
                body += f'<li><span class="day">{d} {dt}</span>{"".join(f"<span>{x}</span>" for x in items)}</li>'
        sched.append(f'<li class="week" style="--wk:{col}"><h3><span class="wkno">Week {w}</span> {esc(topic)}</h3><ul>{body}</ul></li>')

    lessons_html = []
    for w in range(1, 7):
        topic, col = WEEKS[w][0], WEEKS[w][1]
        rows = []
        for n, (wk, day, title, topics, data) in LESSONS.items():
            if wk != w:
                continue
            date = WEEKS[w][2] if day == "Fri" else WEEKS[w][3]
            rows.append(f"""<li class="lesson" id="lesson-{n}">
<div class="lnum" aria-hidden="true">{n}</div>
<div class="lbody">
<h4>{esc(title)}</h4>
<p class="meta">Lesson {n}, {'Friday' if day == 'Fri' else 'Saturday'} {date}</p>
<p class="minilab">Mini-lab: {esc(data[0].upper() + data[1:])}</p>
<details><summary>Topics</summary><ul>{''.join(f'<li>{esc(t)}</li>' for t in topics)}</ul></details>
<div class="links">{lesson_links(n, w)}</div>
</div>
</li>""")
        lessons_html.append(f'<section class="wkgroup" style="--wk:{col}" aria-labelledby="wk{w}"><h3 id="wk{w}"><span class="wkno">Week {w}</span> {esc(topic)}</h3><ol class="lessons">{"".join(rows)}</ol></section>')

    proj_rows = []
    for n, title, q, data in PROJECTS:
        rel = f"project/Project{n}_Starter.ipynb"
        link = f'<a href="{COLAB}/{rel}">Open starter<span class="sr"> for project {n}</span></a>' if exists(rel) else "Starter notebook to come"
        proj_rows.append(f"<tr><td>{n}</td><td><strong>{esc(title)}</strong><br><span class='q'>{esc(q)}</span></td><td>{esc(data)}</td><td>{link}</td></tr>")

    data_rows = "".join(f"<tr><td><strong>{esc(a)}</strong><br><span class='q'>{esc(b)}</span></td><td>{c}</td><td>{esc(e)}</td></tr>" for a, b, c, e in DATASETS)

    page = TEMPLATE.format(svg=svg, n_neu=n_neu, n_spk=n_spk, schedule="".join(sched), lessons="".join(lessons_html),
                           projects="".join(proj_rows), data_rows=data_rows, gh=GH, tree=TREE)
    with open(os.path.join(ROOT, "docs", "index.html"), "w") as f:
        f.write(page)
    open(os.path.join(ROOT, "docs", ".nojekyll"), "w").close()
    print("wrote docs/index.html")


TEMPLATE = """<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MAMBA: Mathematical Sciences for Brain Data</title>
<meta name="description" content="A seven-week online bridge course in the mathematics of neural data and machine learning: linear algebra, calculus, probability and differential equations, taught with Python and real recordings.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Literata:opsz,wght@7..72,500;7..72,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<a class="skip" href="#main">Skip to the lessons</a>
<header class="site">
<a class="mark" href="#top" aria-label="MAMBA home">MAMBA</a>
<nav aria-label="Sections">
<a href="#schedule">Schedule</a><a href="#lessons">Lessons</a><a href="#data">Data</a><a href="#project">Project week</a><a href="#about">About</a>
</nav>
</header>

<main id="top">
<section class="hero">
<div class="hero-text">
<h1>Mathematical Sciences for Brain&nbsp;Data</h1>
<p class="lede">A seven-week online bridge course in the mathematics behind neural data analysis and machine learning: linear algebra, calculus, probability and differential equations, learned in Python on real recordings.</p>
<p class="when">Live sessions on Fridays and Saturdays, 5 February to 20 March 2027.</p>
<p class="actions"><a class="btn solid" href="#lessons">Browse the lessons</a> <a class="btn" href="{gh}">Course repository</a></p>
</div>
<figure class="hero-fig">
{svg}
<figcaption>One trial from the recording used in Lessons 5–15: {n_neu} neurons in a mouse's primary motor cortex fire {n_spk} spikes while it turns a wheel to report what it saw. Data from Steinmetz et al. (2019), CC0. Spike times are binned at 10&nbsp;ms.</figcaption>
</figure>
</section>

<section id="schedule" class="band">
<h2>Seven weeks, two sessions a week</h2>
<p class="intro">Each session teaches one or two lessons. Every lesson has a teaching notebook, an exercise notebook and study notes, and ends with a mini-lab on real data.</p>
<ol class="schedule">{schedule}</ol>
</section>

<section id="lessons" class="band" aria-labelledby="lessons-h">
<h2 id="lessons-h">Lessons</h2>
<p class="intro" id="main">Notebooks open in Google Colab, so you need only a browser and a Google account. Study notes are added as each lesson is finalised.</p>
{lessons}
</section>

<section id="data" class="band">
<h2>The data</h2>
<p class="intro">Every real-data exercise uses openly licensed recordings, stored in the repository's <a href="{tree}/data">data folder</a> so the notebooks run without accounts or large downloads.</p>
<div class="tablewrap"><table>
<thead><tr><th scope="col">Recording</th><th scope="col">Licence</th><th scope="col">Source</th></tr></thead>
<tbody>{data_rows}</tbody>
</table></div>
<p class="note">N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, <cite>Distributed coding of choice, action and engagement across the mouse brain</cite>, Nature 576:266–273, 2019, as packaged by Neuromatch Academy. S. W. Harden, pyABF. The Wilson–Cowan parameters of Lesson 23 are adapted from Neuromatch Academy (CC-BY).</p>
</section>

<section id="project" class="band">
<h2>Project week</h2>
<p class="intro">In teams of two or three, learners choose a question in Week 2, work on it between sessions, and present it on Saturday 20 March. Each option comes with a starter notebook that loads the data and works the first step.</p>
<div class="tablewrap"><table class="projects">
<thead><tr><th scope="col">Option</th><th scope="col">Question</th><th scope="col">Data</th><th scope="col">Starter</th></tr></thead>
<tbody>{projects}</tbody>
</table></div>
</section>

<section id="about" class="band about">
<h2>Who the course is for</h2>
<div class="cols">
<div>
<p>Undergraduate and early postgraduate learners in neuroscience, psychology, biomedical science, data science, engineering, computer science, mathematics and related fields, anywhere in the world. The course is run by ACNEI and taught online.</p>
<p>You should be comfortable with arithmetic, elementary algebra, graphs and scientific notation, and write Python at an intermediate level. You do not need any previous course in linear algebra, calculus, probability or differential equations.</p>
</div>
<div>
<h3>By the end you will be able to</h3>
<ul class="outcomes">
<li>describe stimuli, neural responses and datasets as vectors and matrices, with explicit shapes and units</li>
<li>fit and analyse linear models with least squares, eigenvalues, covariance and PCA</li>
<li>use derivatives, gradients and integrals to study sensitivity, accumulation and learning</li>
<li>describe variability and uncertainty with probability, Bayes' rule and the bootstrap</li>
<li>simulate and interpret differential-equation models of membranes, spiking neurons and populations</li>
</ul>
</div>
</div>
<h3>Key dates</h3>
<dl class="dates">
<div><dt>23 Nov – 27 Dec 2026</dt><dd>Applications open</dd></div>
<div><dt>by 15 Jan 2027</dt><dd>Decisions sent</dd></div>
<div><dt>11 – 29 Jan 2027</dt><dd>Refresher materials released</dd></div>
<div><dt>30 Jan – 4 Feb 2027</dt><dd>Orientation</dd></div>
<div><dt>5 Feb – 20 Mar 2027</dt><dd>Live teaching</dd></div>
</dl>
</section>
</main>

<footer class="site">
<p>MAMBA: Mathematical Sciences for Brain Data, run by ACNEI. Course materials and data on <a href="{gh}">GitHub</a>.</p>
</footer>
</body>
</html>
"""

if __name__ == "__main__":
    build()
