---
summary: "Describing how a neuron responds: functions, variables and parameters, the four transformations, composition and inverses, the families of functions used in neuroscience and machine learning, limits and asymptotes, continuity and bisection, sampling pitfalls, and a real motor-cortex neuron's response to speed."
---

::: objectives
- What a function is: domain, rule, range and units; the difference between variables and parameters
- The four standard transformations (shift, stretch, scale, raise) and the parameters that perform them
- How functions compose, when they can be inverted, and how to invert them numerically
- The families that recur in neuroscience and machine learning: linear, polynomial, exponential, logarithmic, sigmoid, tanh, ReLU, softplus, piecewise, Gaussian and cosine
- What a limit is, one-sided limits, limits at infinity, and horizontal and vertical asymptotes, and why floating-point arithmetic limits how closely a computer can approach one
- What continuity means, the three kinds of discontinuity, the intermediate value theorem and bisection
- How sampling and plotting can misrepresent a function: aliasing, missed peaks and false lines
- How to describe a real motor-cortex neuron's response to wheel speed, and why its fitted limits cannot all be trusted
:::

**Before you start.** This reading is the mathematical companion to the Lesson 8 teaching notebook, and the first lesson on calculus. You need vectors and weighted sums (Lessons 1–2), least squares and train/test evaluation (Lesson 5), and the exponential timescales of Lesson 6. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $f: D\to Y$ | a function from the domain $D$ to the codomain $Y$ |
| $f(x;\theta)$ | a function of the variable $x$ with parameters $\theta$ |
| $f\circ g$, $f^{-1}$ | composition $f(g(x))$; the inverse function |
| $\sigma(x)$, $\operatorname{logit}(p)$ | the logistic sigmoid $1/(1+e^{-x})$; its inverse $\ln\frac{p}{1-p}$ |
| $\lim_{x\to a}f(x)$ | the limit of $f$ as $x$ approaches $a$ |
| $x\to a^-$, $x\to a^+$ | approach from the left, from the right |
| $f_s$, $\Delta t$ | the sampling rate (samples per second) and the sampling interval $1/f_s$ |

## The problem: four measurements, three stories

A visual neuron's rate is measured at contrasts 0, 25, 50 and 100%: 4, 21, 27 and 30 spikes/s. A saturating (Naka–Rushton) function passes exactly through all four points, a logarithmic function within 1.0 spikes/s and a parabola within 1.7 spikes/s.

Yet at 10% contrast they predict 11.4, 16.1 and 11.2 spikes/s, and at 200% (an impossible input) 31.2, 35.1 and $-33.8$.

{{ interactive: three-stories | The same four measurements (black) fitted by a saturating function (blue), a logarithm (green) and a parabola (vermilion). Move the contrast, or press Play, to compare their predictions between and beyond the data; the grey region is contrast above 100%, which cannot exist. }}

Data constrain a function only near where they were taken. Which claims are justified depends on the function's domain, its behaviour at its edges, and how densely it was sampled: the topics of this lesson.

## Functions, variables and parameters

::: definition Definition: function
A function $f: D\to Y$ assigns to every input $x$ in the **domain** $D$ exactly one output $f(x)$ in the **codomain** $Y$. The set of outputs actually produced is the **range**. Inputs and outputs carry units.
:::

The contrast-response function $r: [0,100]\to[0,\infty)$ takes contrast in % and returns a rate in spikes/s. "Exactly one output" rules out, for instance, a relation that gives two rates for the same contrast.

**Variables and parameters.** In the Naka–Rushton function

$$r(c;\,r_0,r_{\max},c_{50},n)=r_0+r_{\max}\frac{c^n}{c^n+c_{50}^n},$$

$c$ is the **variable**, which changes from stimulus to stimulus. The **parameters** are fixed for one neuron and differ between neurons:

- $r_0$, the spontaneous rate (spikes/s);
- $r_{\max}$, the maximum response above baseline (spikes/s);
- $c_{50}$, the contrast giving half of $r_{\max}$ (%);
- $n$, the steepness (unitless).

Fitting chooses the parameters; using the model varies the variable.

{{ interactive: naka-rushton | The Naka–Rushton contrast-response function. Each slider is one parameter: the baseline raises the curve, the gain stretches it vertically, c₅₀ shifts the half-maximum point (orange) left or right, and n sets how steeply it rises. The dashed lines are the curve's limits, r₀ and r₀ + rₘₐₓ. }}

::: note In practice
Write functions of arrays **vectorised**: `r0 + rmax * c**n / (c**n + c50**n)` works for one contrast or a million at once, with no Python loop. Putting `np.asarray(c, dtype=float)` at the top makes the function accept lists and integers safely.
:::

### Four transformations

::: keypoint
For any function $f$:

- $f(x-a)$ shifts the graph **right** by $a$;
- $f(x/s)$ stretches it **horizontally** by $s$;
- $Af(x)$ stretches it **vertically** by $A$;
- $f(x)+b$ shifts it **up** by $b$.

Thresholds, preferred stimuli and $c_{50}$ are shifts; tuning widths and time constants are horizontal stretches; gains are vertical stretches; baselines are vertical shifts.
:::

{{ interactive: transforms | The four transformations applied to a Gaussian bump (dashed). Try a positive shift a: the bump moves right, even though the formula subtracts a. }}

::: note Why it is true: the shift goes right
The graph of $g(x)=f(x-a)$ contains the point $(x_0+a,\,f(x_0))$ for every point $(x_0,\,f(x_0))$ on the graph of $f$, because $g(x_0+a)=f(x_0)$. Every point moves $a$ to the right. Similarly, $g(x)=f(x/s)$ contains $(sx_0,\,f(x_0))$: horizontal distances are multiplied by $s$.
:::

## Composition and inverses

::: definition Definition: composition
$(f\circ g)(x)=f(g(x))$: apply $g$ first, then $f$. It is defined where $x$ is in the domain of $g$ and $g(x)$ is in the domain of $f$.
:::

An artificial neuron is the composition of an affine map $z=\mathbf{w}\cdot\mathbf{x}+b$ (Lesson 2) with an activation $\phi$: its output is $\phi(\mathbf{w}\cdot\mathbf{x}+b)$. A deep network is a long chain of such compositions. Order matters: with $g(x)=2x-1$, $\operatorname{relu}(g(0))=0$ but $g(\operatorname{relu}(0))=-1$.

{{ figure: cell016_1.svg | Left: the affine map g(x) = 2x − 1. Middle: ReLU applied after g. Right: g applied after ReLU. The same two functions in a different order give different results. }}

::: definition Definition: inverse
If $f: D\to Y$ is **one-to-one** (different inputs give different outputs), it has an inverse $f^{-1}$, defined on the range of $f$, with $f^{-1}(f(x))=x$ and $f(f^{-1}(y))=y$. Its graph is the mirror image of the graph of $f$ in the line $y=x$.
:::

A function is one-to-one exactly when every horizontal line meets its graph at most once: the **horizontal line test**. A strictly increasing (or decreasing) function always passes. A cosine direction-tuning curve fails it: a rate of 27 spikes/s occurs at both $28^\circ$ and $152^\circ$, so one neuron's rate cannot tell them apart. Restricting the domain to an interval on which the function only rises or only falls (here $[-90^\circ,90^\circ]$ or $[90^\circ,270^\circ]$) restores invertibility.

{{ interactive: inverse | The horizontal line test. Move the rate y (orange dashed line) and see which inputs produce it. The contrast-response function gives exactly one input for each rate in its range; the cosine tuning curve gives two. }}

::: keypoint
$$(f\circ g)^{-1}=g^{-1}\circ f^{-1}:$$

to undo "first $g$, then $f$", undo $f$ first. For the logistic neuron $p=\sigma(wc+b)$,

$$\sigma^{-1}(p)=\operatorname{logit}(p)=\ln\frac{p}{1-p},\qquad c=\frac{\operatorname{logit}(p)-b}{w}.$$
:::

::: note Why it is true: the logit inverts the sigmoid
Solve $p=1/(1+e^{-z})$ for $z$: $1+e^{-z}=1/p$, so $e^{-z}=(1-p)/p$, and taking logarithms, $-z=\ln\frac{1-p}{p}$, that is $z=\ln\frac{p}{1-p}$. This needs $0<p<1$, which is exactly the range of $\sigma$.

For the order of inverses: $g^{-1}(f^{-1}(f(g(x))))=g^{-1}(g(x))=x$.
:::

Without a formula, an increasing function can be inverted numerically. `np.interp(r, r_grid, c_grid)` swaps the roles of input and output on a fine grid, and bisection (later in this lesson) solves $f(x)=y$ to any precision. For the contrast-response function with $r_0=2$, $r_{\max}=30$, $c_{50}=15\%$ and $n=2.5$, rates of 5, 17 and 30 spikes/s come from 6.2, 15.0 and 43.1% contrast.

## A gallery of function families

| Family | Formula | Domain → range | Typical use |
|---|---|---|---|
| affine | $a+bx$ | $\mathbb{R}\to\mathbb{R}$ | weighted sums; local approximations |
| polynomial | $\sum_{k\le d}a_kx^k$ | $\mathbb{R}\to\mathbb{R}$ | Taylor approximations; features |
| exponential | $Ae^{x/s}$, $Ae^{-t/\tau}$ | $\mathbb{R}\to(0,\infty)$ | decay, growth, Poisson link |
| logarithm | $\ln x$ | $(0,\infty)\to\mathbb{R}$ | intensity perception; log-likelihoods |
| logistic | $\sigma(x)=\frac{1}{1+e^{-x}}$ | $\mathbb{R}\to(0,1)$ | probabilities; classifiers; gates |
| tanh | $\tanh x$ | $\mathbb{R}\to(-1,1)$ | rate models; recurrent networks |
| ReLU | $\max(0,x)$ | $\mathbb{R}\to[0,\infty)$ | threshold-linear units |
| softplus | $\ln(1+e^x)$ | $\mathbb{R}\to(0,\infty)$ | a smooth ReLU |
| piecewise | different rules on intervals | | threshold–linear–saturating |
| Gaussian bump | $e^{-(x-\mu)^2/2s^2}$ | $\mathbb{R}\to(0,1]$ | place fields; orientation tuning |
| cosine | $a+b\cos(\theta-\theta_{\text{pref}})$ | angles $\to[a-b,a+b]$ | direction tuning |

{{ interactive: gallery | Pick a family. The input gain k squeezes the graph horizontally (blue, against the dashed original). For the logistic and tanh, turn k up: the S-curve becomes ever steeper and approaches a step function, its limit as k → ∞. Sigmoid and tanh are the same shape: tanh x = 2σ(2x) − 1. }}

::: pitfall
Formulas do not know their domains. `np.log` of a negative number returns `nan`; a fitted polynomial happily predicts negative firing rates; `np.exp(1000)` overflows to `inf`. The softplus is best computed as `np.log1p(np.exp(-abs(x))) + np.maximum(x, 0)`, which never overflows.
:::

### Exponentials and logarithms

::: keypoint
$e^{a+b}=e^ae^b$ and $\ln(ab)=\ln a+\ln b$; $\ln e^x=x$, and $e^{\ln y}=y$ for $y>0$.

A quantity that loses the same *fraction* in every equal time step decays exponentially, $V(t)=V_0e^{-t/\tau}$, and

$$\ln V(t)=\ln V_0-\frac{t}{\tau}$$

is a straight line in $t$. The half-life is $\tau\ln2\approx0.69\,\tau$.
:::

::: note Why it is true: half-life and the meaning of τ
$V(t)/V_0=e^{-t/\tau}$. At $t=\tau$ this is $e^{-1}\approx0.37$: in one time constant the distance to rest shrinks by 63%. Setting $e^{-t/\tau}=\tfrac12$ gives $t=\tau\ln2$.

Over successive equal intervals $\Delta$, the ratio $V(t+\Delta)/V(t)=e^{-\Delta/\tau}$ is the same every time: the defining property of exponential decay, and of the discrete-time modes $\lambda^t$ of Lesson 6, with $\lambda=e^{-\Delta t/\tau}$.
:::

The notebook fits a straight line to $\ln V$ for a noisy simulated decay with $\tau=20$ ms and recovers $\tau=20.1$ ms. This works only if the decay is towards zero; an additive baseline must be subtracted first, since $\ln(b+Ae^{-t/\tau})$ is not linear in $t$.

{{ figure: cell022_1.svg | A noisy exponential decay of membrane depolarisation (τ = 20 ms). Left: on a linear axis, a curve. Right: on a logarithmic axis, a straight line with slope −1/τ; the orange line is the least-squares fit. }}

::: quiz
? The graph of $f(x-3)$ is the graph of $f(x)$…
- [ ] shifted left by 3
- [x] shifted right by 3
- [ ] shifted up by 3
- [ ] stretched by 3
> $f(x-3)$ at $x=x_0+3$ equals $f(x_0)$: every point moves 3 to the right.

? A neuron's rate follows a cosine tuning curve over all directions. Can you recover the direction from the rate alone?
- [ ] Yes, using the inverse cosine.
- [x] No: most rates occur at two different directions.
- [ ] Only if the neuron fires fast enough.
> The cosine curve fails the horizontal line test on the full circle, so it has no inverse there. Several neurons with different preferred directions are needed.

? A current decays from 200 pA to 50 pA in 12 ms. What is its half-life?
- [ ] 3 ms
- [x] 6 ms
- [ ] 12 ms
> 200 → 100 → 50 is two halvings in 12 ms, so each halving takes 6 ms.
:::

## Limits

::: definition Definition: limit
$\lim_{x\to a}f(x)=L$ means that $f(x)$ can be made as close to $L$ as we like by taking $x$ close enough to $a$, with $x\ne a$. Precisely: for every $\varepsilon>0$ there is a $\delta>0$ such that $0<\lvert x-a\rvert<\delta$ implies $\lvert f(x)-L\rvert<\varepsilon$.
:::

The value $f(a)$ plays no part: it may differ from $L$, or be undefined. $\frac{\sin x}{x}$ is undefined at 0 but tends to 1. $\frac{e^x-1}{x}$ also tends to 1, and that limit is the slope of $e^x$ at 0: a first derivative (Lesson 9).

{{ interactive: limit-zoom | Zoom in on a point where the formula gives 0/0 (open circle). The green band (±ε) is the smallest band that contains the graph in the current window (±δ). As you zoom in, it keeps shrinking towards the limit L: that is the ε–δ definition in action. }}

::: keypoint
**Limit laws.** If $\lim f=L$ and $\lim g=M$ (as $x\to a$), then $\lim(f\pm g)=L\pm M$, $\lim(fg)=LM$, and $\lim f/g=L/M$ provided $M\ne0$.

**Squeeze theorem.** If $g(x)\le f(x)\le h(x)$ near $a$, and $g$ and $h$ both tend to $L$, then so does $f$.
:::

::: note Why it is true: three limits from the notebook
**A cancellation.** $\dfrac{x^2-1}{x-1}=\dfrac{(x-1)(x+1)}{x-1}=x+1$ for $x\ne1$, and the limit only looks at $x\ne1$, so it equals $\lim_{x\to1}(x+1)=2$.

**A squeeze.** For $\frac{\sin x}{x}$, a geometric argument with the unit circle gives $\cos x\le\frac{\sin x}{x}\le1$ for $0<\lvert x\rvert<\pi/2$. Both bounds tend to 1 as $x\to0$, so by the squeeze theorem $\frac{\sin x}{x}\to1$.

**Another squeeze.** For $x\sin(1/x)$: $-\lvert x\rvert\le x\sin(1/x)\le\lvert x\rvert$, and $\pm\lvert x\rvert\to0$, so the limit is 0 although $\sin(1/x)$ oscillates ever faster.
:::

### One-sided limits

$\lim_{x\to a^-}f(x)$ uses only $x<a$; $\lim_{x\to a^+}f(x)$ only $x>a$. The two-sided limit exists if and only if both one-sided limits exist and are equal.

A step-function neuron firing at 40 spikes/s above its threshold current has left limit 0 and right limit 40 there: no limit. An integrate-and-fire neuron's rate tends to 0 from both sides of threshold: it starts firing arbitrarily slowly. But it gets there only logarithmically slowly, so it still fires about 7 spikes/s just 0.001 nA above threshold.

{{ interactive: approach | Approach the point a from the left (orange) and from the right (purple) by shrinking the distance h. Compare the step neuron, the integrate-and-fire neuron, and three textbook cases: whether the two sides agree, and whether they agree with the value at a (black dot), decides the kind of point. }}

### Limits at infinity and asymptotes

$\lim_{x\to\infty}f(x)=L$ means that $f(x)$ gets arbitrarily close to $L$ for all large enough $x$; the line $y=L$ is a **horizontal asymptote**. If $f(x)$ grows without bound as $x\to a$, the line $x=a$ is a **vertical asymptote**, written $\lim_{x\to a}f(x)=\infty$ (shorthand: the limit does not exist as a number).

::: note Why it is true: the limits of two response functions
**Naka–Rushton.** Divide the numerator and denominator by $c^n$: $\frac{c^n}{c^n+c_{50}^n}=\frac{1}{1+(c_{50}/c)^n}$. As $c\to\infty$, $(c_{50}/c)^n\to0$, so $r\to r_0+r_{\max}$; at $c=0$ the fraction is 0, so $r(0)=r_0$.

**Shifted logistic** $r_0+\frac{A}{1+e^{-k(x-x_{50})}}$ with $k>0$. As $x\to\infty$, $e^{-k(x-x_{50})}\to0$ and $r\to r_0+A$; as $x\to-\infty$ the exponential grows without bound and $r\to r_0$. At $x=0$ the value is $r_0+A/(1+e^{kx_{50}})$, which is *not* $r_0$ unless $kx_{50}$ is large.

A parameter called "baseline" is a limit, not necessarily a value the neuron ever shows.
:::

### Limits on a computer

Floating-point numbers carry about 16 significant digits. Approaching a limit with ever smaller $h$ eventually fails: $\big((1+h)-1\big)/h$ is exactly 1 mathematically, but the computed value drifts once $h<10^{-8}$, and becomes 0 at $h=10^{-16}$, where $1+h$ rounds to 1. This is **catastrophic cancellation**: subtracting nearly equal numbers leaves only rounding error. Rewriting the formula to avoid the subtraction (for example $1-\cos h=2\sin^2(h/2)$) cures it. Lesson 9 meets the same trade-off in numerical derivatives.

{{ interactive: float-limit | Your browser computes ((1 + h) − 1)/h live, in the same 16-digit arithmetic NumPy uses. Shrink h and watch the error (vertical axis, log scale) grow instead of shrinking once h is below about 10⁻⁸. }}

## Continuity

::: definition Definition: continuity
$f$ is continuous at $a$ if $f(a)$ is defined, $\lim_{x\to a}f(x)$ exists, and $\lim_{x\to a}f(x)=f(a)$. It is continuous on an interval if it is continuous at every point of it.
:::

By the limit laws, sums, products and quotients (where the denominator is nonzero) of continuous functions are continuous, and so are compositions: if $g$ is continuous at $a$ and $f$ at $g(a)$, then $f\circ g$ is continuous at $a$. Polynomials, $e^x$, $\ln x$ (for $x>0$), $\sigma$, $\tanh$ and ReLU are all continuous on their domains.

::: keypoint
Three kinds of discontinuity (all in the figure above):

- **removable**: the limit exists but $f(a)$ is undefined or different (fix it by defining $f(a)=L$);
- **jump**: the one-sided limits exist but differ (step activations; the voltage reset after a spike);
- **infinite**: the function grows without bound ($1/x$ at 0).

Continuous is not smooth: ReLU is continuous at 0 but has a corner there.
:::

::: keypoint
**Intermediate value theorem.** If $f$ is continuous on $[a,b]$ and $y$ lies between $f(a)$ and $f(b)$, then $f(x)=y$ for at least one $x$ in $[a,b]$.
:::

::: note Why it is true: bisection works, and how fast
Suppose $f$ is continuous and $f(a)-y$ and $f(b)-y$ have opposite signs. Evaluate at the midpoint $m$; one of $[a,m]$ and $[m,b]$ still has opposite signs at its ends, and by the intermediate value theorem it contains a solution. Keep that half and repeat.

After $n$ steps the solution lies in an interval of length $(b-a)/2^n$: 40 steps on $[0,100]$ locate it to within $10^{-10}$.

On a function with a jump over $y$ the signs still change, but no solution exists, and bisection converges to the jump instead.
:::

{{ interactive: bisection | Bisection solving f(x) = 20 spikes/s. The orange band is the interval still known to contain the answer; each step halves it. On the contrast-response function it converges to 17.64%. On the step neuron it converges to the jump at 1 nA, where no input gives 20 spikes/s. }}

**Why learning needs continuity.** With a step activation, small changes of the weights either leave the output unchanged or flip it entirely, so there is no gradual signal saying which way to adjust them. Continuous, smooth activations such as $\sigma$ make the output change gradually with the weights, which gradient-based learning (Lessons 10 and 12) requires. The step is the limit of $\sigma(kx)$ as $k\to\infty$, as the gallery above showed.

::: quiz
? $\lim_{x\to2^-}f(x)=5$, $\lim_{x\to2^+}f(x)=5$, and $f(2)=7$. What kind of point is $x=2$?
- [ ] Continuous
- [x] A removable discontinuity
- [ ] A jump discontinuity
- [ ] An infinite discontinuity
> The limit exists (both sides give 5) but disagrees with the value. Redefining $f(2)=5$ removes it.

? Bisection on $[0, 1]$ is run for 10 steps. How wide is the final interval?
- [ ] 0.1
- [ ] 0.01
- [x] about 0.001
> Each step halves the width: $1/2^{10}=1/1024\approx0.001$.
:::

## Sampling and plotting pitfalls

A computer evaluates a function only at the points you choose, and `plt.plot` joins them with straight lines.

::: keypoint
**Nyquist.** A sinusoid of frequency $f$ is represented faithfully only if it is sampled at $f_s>2f$. Sampled more slowly, it **aliases**: its samples are identical to those of a slower sinusoid at $\lvert f-kf_s\rvert$ (for the integer $k$ that brings it below $f_s/2$).
:::

::: note Why it is true: aliasing
At the sample times $t_j=j/f_s$, $\sin(2\pi ft_j)=\sin\big(2\pi(f-kf_s)t_j+2\pi kj\big)=\sin\big(2\pi(f-kf_s)t_j\big)$, since $kj$ is an integer and sine has period $2\pi$. The samples cannot tell $f$ from $f-kf_s$. A 9 Hz rhythm sampled at 10 Hz looks like $\lvert9-10\rvert=1$ Hz.
:::

{{ interactive: aliasing | A 9 Hz rhythm (grey) and what you see when you sample it and join the dots (vermilion). Slide the sampling rate: above 18 Hz the samples follow the rhythm; below it they trace out a slower, false rhythm. At exactly 9 Hz every sample lands on the same phase, and the rhythm vanishes. }}

Two other pitfalls: a feature narrower than the sampling interval can fall between grid points and vanish; and joining points across a jump or a vertical asymptote draws steep line segments that are not part of the function. Mask such points with `np.nan`, or plot the pieces separately.

{{ figure: cell041_1.svg | Left: aliasing, a 9 Hz rhythm (grey) sampled at 10 Hz (vermilion) looks like 1 Hz. Middle: a narrow peak missed by a 21-point grid (vermilion) and caught by a 5001-point grid (blue). Right: tan x plotted naively (vermilion) draws false vertical lines across its asymptotes; masked with NaN (blue), it does not. }}

::: note In practice
Spike waveforms (about 1 ms long) need sampling at 20–30 kHz. A 1 kHz LFP recording cannot show anything above 500 Hz, and without an analogue low-pass filter before digitising, higher frequencies alias into lower ones. A 50 ms bin cannot resolve a 10 ms burst.

Along a stimulus axis the same rule applies: sample densely where the response changes quickly, and never trust a fitted curve between or beyond the points that support it.
:::

## Mini-lab: a motor-cortex neuron's response to speed

The recording: 447 neurons in mouse primary motor cortex while the mouse turned a wheel with its front paws to report a visual choice ([Steinmetz et al., 2019](https://doi.org/10.1038/s41586-019-1787-x); data released under CC0); 342 trials of 2.5 s in 50 ms bins. The variable is wheel speed $s$ (encoder steps/s), paired with the neuron's rate in the same bin. We analyse the neuron most correlated with speed in the training trials (the first 171): neuron 332, with correlation 0.69 and a mean rate of 4.1 spikes/s. The training trials are used for fitting and the rest for testing.

**Estimating the function by binning.** One 50 ms bin holds a whole number of spikes, so single-bin "rates" are multiples of 20 spikes/s. Averaging over bins with similar speeds estimates $f(s)$. Speed is very skewed: the wheel is completely still in 36% of bins, half are slower than 40 steps/s, and 99% are slower than 1720.

- Four equal-width bins hide the shape.
- Forty equal-width bins are noisy at high speed, where some hold only 4 samples.
- Fifteen equal-count bins of the moving bins, plus the still bins as their own group, show clearly that the neuron is almost silent at rest and at slow speeds, and rises steeply at fast turns.

{{ figure: cell048_1.svg | The same neuron's speed response with three binning schemes (mean ± standard error): four equal-width bins (left), forty equal-width bins (middle) and fifteen equal-count bins (right). }}

**Fitting five families.** Parameters were fitted by least squares on single training bins, using `scipy.optimize.curve_fit` (Lessons 12–15 explain how it works). Test $R^2$ on the held-out trials:

| family | test $R^2$ |
|---|---|
| constant | $-0.003$ |
| linear | 0.444 |
| threshold-linear (threshold 432 steps/s) | 0.457 |
| saturating exponential $r_0+A(1-e^{-s/s_0})$ | 0.444 |
| logistic | 0.462 |

The saturating exponential found no bend: its best $s_0$ is about $1.5\times10^7$ steps/s, far beyond the data, where $r_0+A(1-e^{-s/s_0})\approx r_0+(A/s_0)s$, so it reproduces the straight line exactly. A saturation the data cannot locate is not identifiable.

{{ interactive: speed-fit | The five fitted functions against the binned training data (black, ± s.e.m.) and test data (open circles). Within the data they nearly agree; slide to speeds beyond the data (grey: beyond the 99th percentile) and they disagree completely. }}

**Reading the limits.**

| family | $s\to0^+$ | $s=3000$ | $s\to\infty$ |
|---|---|---|---|
| linear (and saturating exponential) | $-1.2$ | 64.7 | unbounded |
| threshold-linear | 0.8 | 83.8 | unbounded |
| logistic | 0.4 | 50.4 | 50.5 |
| measured (wheel still) | 0.08 | – | – |

Near $s=0$, where data are dense, the threshold-linear and logistic fits stay within 1 spikes/s of the measured rate; the straight line predicts a negative rate, which no neuron can have. As $s\to\infty$ the logistic levels off at about 50 spikes/s, and the linear fits have no ceiling. Only 2.4% of bins are faster than 1500 steps/s, so the data do not determine whether, or where, the rate saturates: the choice of family does.

::: pitfall
Test $R^2$ values are modest mainly because single bins are dominated by spiking noise. The turn direction, the stimulus and the reward also drive the neuron, so $f(s)$ is an average over all of them. The encoder's steps are not converted to a physical speed. The last exercise in the notebook tests extrapolation from slow to fast turns on eight neurons.
:::

## Where this appears in neuroscience and machine learning

**Response functions.** Tuning curves, contrast-response functions and f-I curves are functions of a stimulus or input, summarised by parameters (preferred stimulus, width, $c_{50}$, gain, threshold, baseline). Comparing parameters across conditions is how experiments describe **gain modulation**. Attention, locomotion or arousal can scale a response ($Af$: multiplicative gain) or shift it ($f(x-a)$: a change in sensitivity), and the two are told apart by fitting the parameters in each condition.

**Exponentials and logarithms.** Membrane potentials, synaptic currents and calcium indicators decay exponentially. Perceived intensity grows roughly logarithmically with stimulus intensity (Weber–Fechner), and log-likelihoods (Lesson 18) turn products of probabilities into sums.

**Activation functions.** Sigmoid, tanh, ReLU and softplus are the nonlinear stages of artificial neurons; their limits (saturation) and corners decide how gradients flow (vanishing gradients, Lesson 10). Continuity of activations and losses is what makes gradient-based learning possible.

**Sampling.** Choosing sampling rates for spikes, LFPs and imaging; choosing time bins; spacing stimulus values; and, in machine learning, the warning that a model is only trustworthy on inputs like those it was trained on.

::: pitfall
**Common mistakes to avoid.**

- **Ignoring the domain**: evaluating a model at impossible inputs (contrast above 100%, negative time constants), or trusting a fitted function beyond the data.
- **Confusing variables and parameters**, for example fitting a parameter that should be fixed by the design.
- **Shifting the wrong way**: $f(x-a)$ moves the graph right, not left.
- **Inverting in the wrong order**: $(f\circ g)^{-1}=g^{-1}\circ f^{-1}$.
- **Inverting a function that is not one-to-one**, such as a cosine tuning curve over all directions.
- **Reading a limit from a parameter name**: a logistic's "baseline" is its limit at $-\infty$, not its value at zero input.
- **Shrinking $h$ for ever** when approximating a limit numerically: below about $10^{-8}$, rounding error takes over.
- **Using bisection on a discontinuous function**, or on an interval where the signs do not change.
- **Undersampling**: fewer than two samples per cycle, or a grid coarser than the narrowest feature.
- **Joining points across a jump or an asymptote** in a plot.
:::

## Lesson summary

- A function maps each input in its domain to exactly one output; state domains and units. Variables change with each input; parameters with each neuron or model.
- $f(x-a)$, $f(x/s)$, $Af(x)$, $f(x)+b$: shift right, stretch horizontally, stretch vertically, raise.
- $(f\circ g)(x)=f(g(x))$, and order matters. One-to-one functions have inverses, mirror images in $y=x$; $(f\circ g)^{-1}=g^{-1}\circ f^{-1}$; the logit inverts $\sigma$.
- The function families in the gallery recur everywhere. $e^{a+b}=e^ae^b$, $\ln(ab)=\ln a+\ln b$; an exponential decay is a straight line on a log axis.
- $\lim_{x\to a}f(x)$ ignores $f(a)$. One-sided limits must agree for a limit to exist. Horizontal asymptotes are limits at infinity; vertical asymptotes are unbounded growth. Floating point limits how small $h$ can usefully be.
- Continuity: the limit equals the value. Discontinuities are removable, jump or infinite. The intermediate value theorem justifies bisection, which halves the uncertainty at each step.
- Sample above the Nyquist rate and finer than the narrowest feature; mask jumps when plotting.
- A mouse motor-cortex neuron is nearly silent at rest and rises steeply with wheel speed, but the data cannot say whether or where it saturates: limits beyond the sampled range reflect the chosen family.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
A tuning curve is $r(\theta)=5+20e^{-(\theta-60)^2/(2\cdot15^2)}$ (spikes/s, $\theta$ in degrees). Name each parameter's role among the four transformations, give the range of $r$, and give the rate at the preferred direction and $15^\circ$ away from it.
---answer---
**Roles.** 5: baseline (raise). 20: gain (vertical stretch). 60: preferred direction (shift right). 15: width (horizontal stretch).

**Range.** $(5,\ 25]$ spikes/s.

**Rates.** At $60^\circ$: 25 spikes/s. At $45^\circ$ or $75^\circ$: $5+20e^{-1/2}\approx17.1$ spikes/s.
:::

::: exercise
Write $h(x)=\ln(1+e^{2x-3})$ as a composition of three functions. What is $h$ called in machine learning (up to the inner map)? Is $h$ one-to-one? If so, find $h^{-1}$.
---answer---
**Composition.** $g(x)=2x-3$ (affine), then $u\mapsto1+e^u$, then the logarithm: $h$ is the softplus of an affine map.

**One-to-one.** Softplus is strictly increasing with range $(0,\infty)$, so yes.

**Inverse.** From $y=\ln(1+e^{2x-3})$, $e^y-1=e^{2x-3}$, so $h^{-1}(y)=\dfrac{3+\ln(e^y-1)}{2}$ for $y>0$.
:::

::: exercise
Solve $\sigma(z)=0.8$ for $z$ exactly. A neuron fires with probability $\sigma(0.12c-4)$ at contrast $c$ (%). Which contrast gives probability 0.8?
---answer---
**The logit.** $z=\operatorname{logit}(0.8)=\ln(0.8/0.2)=\ln4\approx1.386$.

**The contrast.** $0.12c-4=1.386$ gives $c\approx44.9\%$.
:::

::: exercise
A synaptic current decays from 200 pA to 50 pA in 12 ms. Assuming exponential decay to zero, find $\tau$ and the half-life.
---answer---
**Time constant.** $50/200=e^{-12/\tau}$, so $\tau=12/\ln4\approx8.66$ ms.

**Half-life.** $\tau\ln2=6$ ms: two halvings in 12 ms.
:::

::: exercise
Evaluate $\lim_{x\to3}\dfrac{x^2-9}{x-3}$, $\lim_{x\to0}\dfrac{\sqrt{1+x}-1}{x}$ (multiply by $\sqrt{1+x}+1$), and $\lim_{x\to\infty}\dfrac{3x^2+1}{2x^2-x}$.
---answer---
**First.** Cancel $x-3$: $x+3\to6$.

**Second.** $\dfrac{(\sqrt{1+x}-1)(\sqrt{1+x}+1)}{x(\sqrt{1+x}+1)}=\dfrac{1}{\sqrt{1+x}+1}\to\dfrac12$.

**Third.** Divide by $x^2$: $\dfrac{3+1/x^2}{2-1/x}\to\dfrac32$.
:::

::: exercise
Find $\lim_{c\to\infty}$ and $\lim_{c\to0^+}$ of $r(c)=2+30\dfrac{c^{2.5}}{c^{2.5}+15^{2.5}}$. At what contrast is the rate exactly halfway between these two limits?
---answer---
**Limits.** As $c\to\infty$: 32 spikes/s. As $c\to0^+$: 2 spikes/s.

**Halfway.** The rate is 17 when $\dfrac{c^{2.5}}{c^{2.5}+15^{2.5}}=\dfrac12$, that is at $c=15\%=c_{50}$.
:::

::: exercise
For $f(x)=\dfrac{\lvert x-2\rvert}{x-2}$, give the one-sided limits at 2. Classify the discontinuity. Can it be removed?
---answer---
Left limit $-1$, right limit $+1$: a **jump**. It cannot be removed, since no value of $f(2)$ makes the one-sided limits agree.
:::

::: exercise
For which value of $k$ is $f(x)=\begin{cases}kx+1 & x<2\\ x^2-1 & x\ge2\end{cases}$ continuous at 2?
---answer---
The right side gives $f(2)=2^2-1=3$; the left limit is $2k+1$. Continuity needs $2k+1=3$, so $k=1$.
:::

::: exercise
Use the intermediate value theorem to show that $x^3+x-1=0$ has a solution in $[0,\ 1]$. How many bisection steps guarantee it to within $10^{-6}$?
---answer---
**Existence.** $f(0)=-1<0$ and $f(1)=1>0$, and $f$ is continuous, so it has a zero in $[0,\ 1]$.

**Steps.** We need $1/2^n<10^{-6}$: $n\ge20$ ($2^{20}\approx1.05\times10^6$).
:::

::: exercise
Show that $\sigma(-x)=1-\sigma(x)$ and $\tanh x=2\sigma(2x)-1$.
---answer---
**First identity.** $\sigma(-x)=\dfrac{1}{1+e^x}=\dfrac{e^{-x}}{e^{-x}+1}=1-\dfrac{1}{1+e^{-x}}=1-\sigma(x)$.

**Second identity.** $2\sigma(2x)-1=\dfrac{2-(1+e^{-2x})}{1+e^{-2x}}=\dfrac{1-e^{-2x}}{1+e^{-2x}}=\dfrac{e^x-e^{-x}}{e^x+e^{-x}}=\tanh x$.
:::

::: exercise
A 7 Hz theta rhythm is sampled at 8 Hz, and a 30 Hz beta rhythm at 40 Hz. What frequencies appear? What is the minimum sampling rate for each?
---answer---
**Apparent frequencies.** $\lvert7-8\rvert=1$ Hz and $\lvert30-40\rvert=10$ Hz.

**Minimum rates.** Above 14 Hz and above 60 Hz (in practice, several times more).
:::

::: exercise
*(Challenge.)* For the saturating exponential $r(s)=r_0+A(1-e^{-s/s_0})$, use $e^{-u}\approx1-u$ for small $u$ to show that for $s\ll s_0$ it is approximately linear in $s$, with slope $A/s_0$. Explain why fitting it only to speeds well below $s_0$ cannot determine $A$ and $s_0$ separately, and what this means for its limit as $s\to\infty$.
---answer---
**Linear for slow speeds.** With $u=s/s_0$ small, $1-e^{-u}\approx u$, so $r\approx r_0+(A/s_0)s$: a straight line.

**Not identifiable.** Data at $s\ll s_0$ determine only $r_0$ and the ratio $A/s_0$; doubling both $A$ and $s_0$ leaves the slow-speed predictions unchanged.

**The limit.** The ceiling $\lim_{s\to\infty}r=r_0+A$ is therefore not determined by slow data at all, and a fit tends to push $s_0$ (and $A$) beyond the data, which is exactly what the mini-lab found.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise on whether you can trust a response function outside the range you sampled. Both open in Google Colab.

{{ colab: week3/lesson8/Lesson8_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week3/lesson8/Lesson8_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Calculus*, 3rd ed., Wellesley–Cambridge Press, 2017 (free online from MIT OpenCourseWare). Chapters 1–2: functions, limits and continuity.
- D. J. Heeger, "Normalization of cell responses in cat striate cortex", *Visual Neuroscience* 9:181–197, 1992; and D. G. Albrecht and D. B. Hamilton, "Striate cortex of monkey and cat: contrast response function", *Journal of Neurophysiology* 48:217–237, 1982. The Naka–Rushton contrast-response function.
- P. Dayan and L. F. Abbott, *Theoretical Neuroscience*, MIT Press, 2001. Chapter 1 (tuning curves) and Chapter 5 (f-I curves of integrate-and-fire neurons).
- D. Goldberg, "What every computer scientist should know about floating-point arithmetic", *ACM Computing Surveys* 23:5–48, 1991.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
- 3Blue1Brown, *Essence of Calculus* (video series), chapter 7, "Limits, L'Hôpital's rule, and epsilon delta definitions".
