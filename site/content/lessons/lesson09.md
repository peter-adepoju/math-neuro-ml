---
summary: "How fast does a response change? The derivative as the limit of secant slopes, its rules, the derivatives of activation functions, linear approximation and sensitivity, finite differences and their errors, differentiating noisy data, and the rate of rise of a real action potential."
---

::: objectives
- How the difference quotient (a secant slope) becomes the derivative (a tangent slope) in the limit, and what units a derivative has
- Where derivatives fail to exist: corners and jumps
- The power, sum, product, quotient, exponential, logarithm and trigonometric rules, and the derivatives of the sigmoid, tanh, ReLU and softplus
- The local linear approximation $\Delta f\approx f'(x)\Delta x$, sensitivity, and why neurons discriminate best where their tuning curves are steepest
- Forward, backward and central differences, their errors, the step-size trade-off with rounding, and how `np.gradient` handles boundaries and irregular sampling
- Why differentiation amplifies noise, and how a larger step or smoothing helps
- How fast a real action potential rises, how the step size and noise change the answer, and why spike thresholds depend on how they are defined
:::

**Before you start.** This reading is the mathematical companion to the Lesson 9 teaching notebook. You need Lesson 8 (functions, limits, continuity and the limits of floating-point arithmetic) and the least-squares fitting of Lesson 5. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $f'(x)$, $\dfrac{df}{dx}$ | the derivative of $f$ at $x$ |
| $f''(x)$ | the second derivative (the derivative of $f'$) |
| $h$ | the step in a difference quotient or finite difference |
| $\Delta x$, $\Delta f$ | a (small) change of input and the resulting change of output |
| $\sigma$ | the standard deviation of measurement noise (and, for activation functions, the logistic function; the context decides) |

## The problem: where is a neuron most sensitive?

Many neurons in mouse visual cortex change their rate with running speed, often rising steeply and then levelling off (Saleem et al., 2013). Take a model neuron of this kind, with the saturating function of Lesson 8 and parameters chosen for illustration:

$$r(s)=r_0+A(1-e^{-s/s_0}),\qquad r_0=44.8\text{ spikes/s},\quad A=59.8\text{ spikes/s},\quad s_0=11.0\text{ cm/s}.$$

The same 2 cm/s increase of speed raises the rate by 9.1 spikes/s from 1 cm/s, by 4.0 from 10 cm/s, and by only 0.65 from 30 cm/s. The ratio "change of rate / change of speed" depends on where it is measured, and on the size of the step. The derivative removes the dependence on the step and gives one number for each speed: the **sensitivity**, in spikes/s per cm/s.

## From secant to tangent

::: definition Definition: derivative
The **difference quotient** $\dfrac{f(x+h)-f(x)}{h}$ is the slope of the **secant** line through $(x,f(x))$ and $(x+h,f(x+h))$. The **derivative** is its limit,

$$f'(x)=\frac{df}{dx}(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h},$$

the slope of the **tangent** line. If the limit exists, $f$ is **differentiable** at $x$. The derivative has the units of the output per unit of the input.
:::

For the motivating neuron at $s=5$ cm/s, the secant slopes are 2.27, 2.77, 3.16, 3.30 and 3.44 spikes/s per cm/s for $h=10, 5, 2, 1, 0.1$, approaching the derivative, $3.45$.

{{ interactive: secant | The model neuron's response to running speed (black). The orange dashed secant joins s and s + h; the blue line is the tangent at s. Press Play to shrink h: the secant swings into the tangent, and its slope approaches the derivative. }}

::: keypoint
Computing $f'(x)$ at every $x$ gives a function $f'$: positive where $f$ rises, negative where it falls, zero at peaks and troughs, and largest in size where $f$ is steepest.

Differentiable implies continuous, but a continuous function can fail to be differentiable at a **corner**: ReLU at 0 has left slope 0 and right slope 1, so no single tangent exists. At a jump, the difference quotient grows without bound.
:::

::: note Why it is true: differentiable implies continuous
$f(x+h)-f(x)=\dfrac{f(x+h)-f(x)}{h}\cdot h$. If $f$ is differentiable at $x$, the first factor tends to $f'(x)$ and the second to 0, so $f(x+h)-f(x)\to f'(x)\cdot0=0$: $f$ is continuous at $x$.

The converse fails: for $f(x)=\lvert x\rvert$ at 0 the quotient is $\lvert h\rvert/h=\pm1$, with different one-sided limits.
:::

## Derivative rules

| Rule | Formula |
|---|---|
| constant | $(c)'=0$ |
| power | $(x^n)'=nx^{n-1}$ |
| linearity | $(af+bg)'=af'+bg'$ |
| product | $(fg)'=f'g+fg'$ |
| quotient | $(f/g)'=(f'g-fg')/g^2$ |
| exponential | $(e^x)'=e^x$, $\ (e^{ax})'=ae^{ax}$ |
| logarithm | $(\ln x)'=1/x$ $\ (x>0)$ |
| trigonometric | $(\sin x)'=\cos x$, $\ (\cos x)'=-\sin x$ (radians) |

::: note Why it is true: power, product and quotient rules
**Power** (whole numbers $n$): $(x+h)^n=x^n+nx^{n-1}h+(\text{terms with }h^2,h^3,\dots)$, so $\frac{(x+h)^n-x^n}{h}=nx^{n-1}+(\text{terms with }h)\to nx^{n-1}$. The rule holds for all real $n$ (where $x^n$ is defined); an exercise checks it for $n=-1$.

**Product**: add and subtract $f(x+h)g(x)$:

$$\frac{f(x+h)g(x+h)-f(x)g(x)}{h}=f(x+h)\frac{g(x+h)-g(x)}{h}+g(x)\frac{f(x+h)-f(x)}{h}\to fg'+gf',$$

using the continuity of $f$.

**Quotient**: write $f=(f/g)\,g$ and apply the product rule: $f'=(f/g)'g+(f/g)g'$, then solve for $(f/g)'$.
:::

::: note Why it is true: exponential and logarithm
$\frac{e^{x+h}-e^x}{h}=e^x\frac{e^h-1}{h}\to e^x\cdot1$, using the limit $\frac{e^h-1}{h}\to1$ from Lesson 8, which is the defining property of the number $e$. For $e^{ax}$, $\frac{e^{a(x+h)}-e^{ax}}{h}=ae^{ax}\frac{e^{ah}-1}{ah}\to ae^{ax}$.

$\ln$ is the inverse of $\exp$, and the slope of an inverse is the reciprocal of the original slope (the mirror image swaps rise and run), so $(\ln y)'=1/e^x=1/y$ at $y=e^x$.
:::

**The motivating neuron.** By linearity and the exponential rule, $r'(s)=\frac{A}{s_0}e^{-s/s_0}$. The sensitivity is $A/s_0\approx5.4$ spikes/s per cm/s at $s=0$, and it halves every $s_0\ln2\approx7.6$ cm/s.

::: note In practice
Check a hand-derived derivative against the central difference $\frac{f(x+h)-f(x-h)}{2h}$ with $h\approx10^{-5}$, at several points. Agreement to about $10^{-10}$ (relative) is expected; anything worse than about $10^{-6}$ signals a mistake. In the notebook, five functions (including products and quotients) agree to better than $10^{-9}$.
:::

### Activation functions

::: keypoint
- $\sigma'(x)=\sigma(x)\big(1-\sigma(x)\big)\le\tfrac14$;
- $\tanh'x=1-\tanh^2x\le1$;
- $\operatorname{ReLU}'(x)=0$ for $x<0$ and $1$ for $x>0$ (undefined at 0; software uses 0);
- $\operatorname{softplus}'(x)=\sigma(x)$.
:::

::: note Why it is true: the sigmoid's derivative
$\sigma=1/(1+e^{-x})$. By the quotient rule, with $(e^{-x})'=-e^{-x}$:

$$\sigma'=\frac{e^{-x}}{(1+e^{-x})^2}=\frac{1}{1+e^{-x}}\cdot\frac{e^{-x}}{1+e^{-x}}=\sigma(1-\sigma).$$

With $p=\sigma\in(0,1)$, $p(1-p)$ is largest, $\tfrac14$, at $p=\tfrac12$ ($x=0$). Since $\tanh x=2\sigma(2x)-1$ (Lesson 8), $\tanh'x=4\sigma'(2x)=4\sigma(2x)(1-\sigma(2x))=1-\tanh^2x$.
:::

{{ interactive: f-and-fprime | A function (left) with its tangent at x, and its derivative (right). Pick a function and sweep x: the slope of the blue tangent on the left is the height of the blue dot on the right. }}

Saturated sigmoids have tiny slopes: $\sigma'(5)=0.0067$ and $\sigma'(10)=4.5\times10^{-5}$. Learning signals are multiplied by these slopes layer after layer (Lesson 10), which is why deep sigmoid networks suffer from vanishing gradients, and why ReLU, with slope exactly 1 when active, trains better.

::: quiz
? What is the derivative of $3x^4-2x+7$?
- [ ] $12x^3-2x$
- [x] $12x^3-2$
- [ ] $3x^3-2$
- [ ] $12x^3-2+7$
> Power rule term by term: $3\cdot4x^3=12x^3$, $-2x\mapsto-2$, and the constant 7 has slope 0.

? $\sigma(x)=0.9$. What is $\sigma'(x)$?
- [ ] 0.9
- [ ] 0.1
- [x] 0.09
- [ ] 0.25
> $\sigma'=\sigma(1-\sigma)=0.9\times0.1=0.09$. No need to know $x$.

? Where does ReLU have no derivative?
- [x] Only at $x=0$
- [ ] For all $x<0$
- [ ] Nowhere: it is continuous
> For $x<0$ the slope is 0, for $x>0$ it is 1. At the corner $x=0$ the one-sided slopes disagree. Continuous does not mean differentiable.
:::

## Local linear approximation and sensitivity

::: keypoint
Near $x$, a differentiable function is close to its tangent:

$$f(x+\Delta x)\approx f(x)+f'(x)\,\Delta x,\qquad\Delta f\approx f'(x)\,\Delta x .$$

The derivative is a **sensitivity**: output change per unit input change. The approximation is good for small $\Delta x$; its error is about $\tfrac12f''(x)\,\Delta x^2$, shrinking with the square of the step (Lesson 11).
:::

{{ interactive: linear-approx | The tangent line (blue) as an approximation to the curve. Move Δx: the vermilion segment is the error, which is tiny for small steps and grows like Δx² (compare it with ½f″Δx² in the readout). }}

::: note Why it is true: why the error shrinks like Δx²
The error $E(\Delta x)=f(x+\Delta x)-f(x)-f'(x)\Delta x$ satisfies $E/\Delta x=\frac{f(x+\Delta x)-f(x)}{\Delta x}-f'(x)\to0$: the error vanishes faster than $\Delta x$.

If $f'$ is itself differentiable, the slope changes along the step at rate $f''$, so the tangent misses the curve by about $\tfrac12f''(x)\Delta x^2$ (the area under a linearly growing slope error). Lesson 11 makes this exact with Taylor's theorem.
:::

**Relative sensitivity.** To compare inputs with different units, the elasticity $\frac{x}{f}\frac{df}{dx}$ (percentage change of output per percentage change of input) is unitless.

**Discrimination.** If a neuron's rate has noise of size $\delta r$, a stimulus change is detectable only if it changes the rate by more than $\delta r$, so the smallest detectable change is about

$$\delta x\approx\frac{\delta r}{\lvert f'(x)\rvert}.$$

A neuron discriminates best where its response is **steepest**, not where it is largest. For a Naka–Rushton contrast-response function ($r_0=2$, $r_{\max}=30$, $c_{50}=15\%$, $n=2.5$), the quotient rule gives

$$r'(c)=r_{\max}\frac{nc^{n-1}c_{50}^n}{(c^n+c_{50}^n)^2}.$$

It is steepest at $c=10.7\%$ (1.47 spikes/s per %). With 1 spike/s of noise, the threshold is 0.8% at 15% contrast, but 7.3% at 40% and 72% at 80%.

{{ interactive: sensitivity | Left: a contrast-response function and its tangent; the orange box is the contrast change needed to move the rate by the noise δr. Right: that threshold, δr / slope, at every contrast (log scale). It is smallest where the curve is steepest, and huge where the curve has flattened. }}

## Finite differences

::: keypoint
With step $h$:

- the forward $\frac{f(x+h)-f(x)}{h}$ and backward $\frac{f(x)-f(x-h)}{h}$ differences have error $\approx\tfrac12\lvert f''(x)\rvert\,h$;
- the central difference $\frac{f(x+h)-f(x-h)}{2h}$ has error $\approx\tfrac16\lvert f'''(x)\rvert\,h^2$.

A forward difference is a central difference for the midpoint $x+h/2$, so it estimates $f'(x+h/2)$ with error proportional to $h^2$.
:::

::: note Why it is true: the error orders
Extending the linear approximation by curvature terms (Taylor's theorem, Lesson 11): $f(x\pm h)=f(x)\pm f'(x)h+\tfrac12f''(x)h^2\pm\tfrac16f'''(x)h^3+\cdots$ Then

$$\frac{f(x+h)-f(x)}{h}=f'(x)+\tfrac12f''(x)h+\cdots,\qquad
\frac{f(x+h)-f(x-h)}{2h}=f'(x)+\tfrac16f'''(x)h^2+\cdots,$$

because in the central difference the even terms ($f(x)$ and $\tfrac12f''h^2$) cancel. Applying the central formula around the midpoint $m=x+h/2$ with half-step $h/2$ gives $\frac{f(m+h/2)-f(m-h/2)}{h}$, which is exactly the forward difference.
:::

### The step-size trade-off

Each computed value of $f$ carries a rounding error of relative size $\varepsilon\approx10^{-16}$, which a difference quotient divides by $h$. The total error is roughly truncation plus rounding:

$$\text{forward: }\tfrac12\lvert f''\rvert h+\frac{2\varepsilon\lvert f\rvert}{h},\qquad
\text{central: }\tfrac16\lvert f'''\rvert h^2+\frac{\varepsilon\lvert f\rvert}{h}.$$

Minimising over $h$ gives $h_{\text{opt}}\sim\sqrt\varepsilon\approx10^{-8}$ (forward) and $h_{\text{opt}}\sim\varepsilon^{1/3}\approx10^{-5}$ (central), with best errors of about $10^{-8}$ and $10^{-11}$ respectively.

{{ interactive: fd-error | The error of forward (vermilion) and central (blue) differences of eˣ at x = 1, computed live in your browser. Shrink h: truncation error falls until rounding error (grey dashed, growing like 1/h) takes over, giving a V shape for each method. }}

::: note In practice
`np.gradient(y, t)` returns central differences inside and one-sided differences at the two ends, where there is only one neighbour; `edge_order=2` uses a second-order one-sided formula there. Pass the actual sample times `t` if the spacing is irregular.

`np.diff(y)/dt` returns $n-1$ forward differences that belong to the **midpoints** of the intervals. For a decaying exponential sampled 21 times, the first-order end error is 0.21, against 0.0025 inside, and 0.020 with `edge_order=2`.
:::

{{ figure: cell026_1.svg | Finite differences of e^(−3t) on 21 samples. Black: the true derivative. Blue dots: np.gradient (edge_order = 1), whose first value is visibly off. Green squares: edge_order = 2 at the two ends. Vermilion triangles: np.diff / dt, plotted at the midpoints of the steps, where it belongs. }}

## Differentiating noisy data

::: keypoint
If each sample carries independent noise of standard deviation $\sigma$, a central difference over step $h$ has noise of standard deviation $\dfrac{\sigma}{\sqrt2\,h}$. Halving the step doubles the noise. A second difference divides by $h^2$ and is far worse. The remedies are a longer step, or smoothing before differentiating, both at the cost of time resolution.
:::

::: note Why it is true: the noise formula
The central difference is $(y_{i+1}-y_{i-1})/(2h)$. If $y_{i\pm1}$ carry independent noises with variance $\sigma^2$, their difference has variance $2\sigma^2$ (variances of independent quantities add, Lesson 17), so the quotient has variance $2\sigma^2/(4h^2)=\sigma^2/(2h^2)$ and standard deviation $\sigma/(\sqrt2h)$.
:::

In the notebook, a charging membrane, $V=10(1-e^{-t/10\,\text{ms}})$ mV, sampled every 0.1 ms with 0.2 mV of noise, gives a one-sample derivative error of 1.37 mV/ms. The formula predicts $0.2/(\sqrt2\times0.1)=1.4$: larger than the true derivative itself (at most 1 mV/ms). A 1 ms step reduces the error to 0.14, a 4 ms step to 0.035, and a 1 ms Gaussian smoothing to 0.021.

{{ interactive: noisy-derivative | The derivative of a noisy charging curve. Black: the true derivative. Orange: the central difference for the chosen step. Press Play to lengthen the step: the noise falls as σ/(√2 h) predicts, but fast changes blur and the ends of the trace are lost. }}

The price is resolution: the 4 ms step gives no estimate in the first and last 4 ms, smoothing distorts the start of the trace, and either would flatten a millisecond-scale spike.

::: quiz
? A signal sampled every 1 ms has noise $\sigma=0.4$. What is the noise of a central-difference derivative with $h=2$ ms?
- [ ] 0.2 per ms
- [x] about 0.14 per ms
- [ ] 0.8 per ms
> $\sigma/(\sqrt2h)=0.4/(1.414\times2)\approx0.14$.

? Which finite difference has error proportional to $h^2$?
- [ ] forward
- [ ] backward
- [x] central
> In the central difference the curvature terms cancel, so the leading error is $\tfrac16f'''h^2$.
:::

## Mini-lab: how fast does a real action potential rise?

**Data.** A whole-cell current-clamp recording distributed with the pyABF package (sample file `18711001.abf`, MIT licence; the cell type and preparation are not documented): 29 sweeps with current steps of 10–290 pA for 0.5 s, sampled at 20 kHz ($h_0=0.05$ ms). The first spikes appear at 70 pA. There is no independent "true" $dV/dt$, so methods are judged by their agreement, by the noise in the quiet baseline before the step, and by simulated noise.

**Alignment.** The first spike at 150 pA rises at up to 332 mV/ms and repolarises at up to $-42$ mV/ms. Plotted at the start of its step, the forward difference differs from the central difference by 9.7 mV/ms (RMS over the 6 ms around the spike); compared with the central estimate half a sample later, by only 3.2 mV/ms. A forward difference belongs to the midpoint, and on a fast upstroke even half a sample (0.025 ms) is visible.

**Step size.** A central difference over $k$ samples on each side has step $h=kh_0$. For $k=1, 2, 4, 8, 16$ the baseline noise falls as $\sigma/(\sqrt2h)$ predicts (0.36, 0.20, 0.11, 0.06, 0.03 mV/ms), but the mean peak rate of rise over all spikes falls too (211, 194, 157, 95, 49 mV/ms): an upstroke lasting a fraction of a millisecond cannot be resolved by a step of similar length. On this clean recording truncation dominates, and the smallest step is best.

{{ interactive: ap-derivative | One real action potential (left), its rate of rise dV/dt (middle) and the phase plot of dV/dt against V (right), for central differences with the chosen step. The vermilion dot marks a common threshold definition: the voltage where dV/dt first exceeds 20 mV/ms (dotted line). Press Play to lengthen the step and watch the peak blunt and the threshold move. }}

With added white noise of 0.2 mV, the one-sample error is 2.8 mV/ms, as $0.2/(\sqrt2\times0.05)$ predicts, and $h=0.1$ ms is best; with 1 mV of noise, $h=0.2$ ms.

{{ figure: cell036_1.svg | RMS error of dV/dt against the step, with no added noise (blue), 0.2 mV (vermilion) and 1.0 mV (green). Noise favours larger steps; fast spikes favour smaller ones. }}

**Second derivative and threshold.** The baseline noise of $d^2V/dt^2$ falls from 5.9 to 0.5 mV/ms² between $h=0.05$ and 0.2 ms: a factor of 12 for a factor of 4 in $h$. Two common threshold definitions give different answers.

- The voltage at which $dV/dt$ first exceeds 20 mV/ms moves slowly and smoothly with the step, from $-24.6$ to $-28.2$ mV over a 16-fold change.
- The voltage at the largest $d^2V/dt^2$ is less stable ($-19.6$, $-17.6$, $-22.4$ mV for the three smallest steps). It lies on the steep upstroke, where $dV/dt\approx90$ mV/ms and $V$ moves about 4.5 mV per sample, so a one-sample shift changes it by several mV.

The two agree only for $h\ge0.4$ ms, where both are blunted. Biology adds its own variation: the first spike of each sweep starts at $-33.0$ mV, later spikes at $-22.3$ mV.

{{ figure: cell038_1.svg | Left: the second derivative before the first spike at three steps (blue 0.05 ms, vermilion 0.2 ms, green 0.8 ms). Right: the two threshold definitions against the step (mean ± SD over spikes): dV/dt first above 20 mV/ms (blue) and the largest d²V/dt² (vermilion). }}

**Sensitivity to current.** The derivative of the f–I curve is the neuron's **gain**. The rate jumps from 0 to 4 spikes/s between 60 and 70 pA (the rheobase), where the curve has no derivative. Above it, forward differences over 10 pA give either 0 or 0.2 Hz/pA, because each rate is a whole number of spikes in 0.5 s; over 100 pA they give 0.04–0.06 Hz/pA, about one extra spike/s per 20 pA. Counting noise and a curving slope trade off exactly as noise and truncation do for $dV/dt$.

{{ interactive: fi-gain | Left: the cell's f–I curve. Right: its gain estimated by forward differences over the chosen current step, plotted at the step midpoints. Small steps give jumpy estimates (counting noise); large steps give smooth ones but blur any change of slope. }}

::: pitfall
One cell of undocumented type; the amplifier's filter has already smoothed the fastest changes; the added noise is simulated and white; the reference for the noise comparison is itself a finite difference; and the 20 mV/ms criterion is a convention. Report the definition and the step with any spike threshold. The last exercise in the notebook repeats the threshold analysis on a second, noisier cell.
:::

## Where this appears in neuroscience and machine learning

**Kinematics and physiology.** Velocity and acceleration from tracked position; spike detection and thresholds from $dV/dt$; the capacitive current $C_m\,dV/dt$; phase plots of $dV/dt$ against $V$ for action potentials; the rate of rise of calcium signals as a proxy for spiking. All need a careful choice of the differentiation step.

**Sensitivity and coding.** Discrimination thresholds are inversely proportional to tuning-curve slopes; population sensitivity (the Fisher information) sums squared slopes divided by noise variances. This is why neurons are most informative on the flanks of their tuning curves.

**Machine learning.** Training adjusts each weight in proportion to the derivative of the loss with respect to it (Lessons 10, 12 and 15). The derivatives of activations decide whether those signals survive through many layers (vanishing gradients), and central-difference gradient checks are the standard test of a hand-written gradient.

::: pitfall
**Common mistakes to avoid.**

- **Forgetting units**: a derivative is per unit of input (spikes/s per cm/s, mV/ms).
- **Treating a corner as differentiable**: ReLU and $\lvert x\rvert$ have no derivative at 0.
- **Dropping the inner factor**: $(e^{ax})'=ae^{ax}$, not $e^{ax}$; $(\ln(1+x^2))'=\frac{2x}{1+x^2}$.
- **Using degrees in $(\sin x)'=\cos x$**: the rule assumes radians.
- **Extrapolating the linear approximation** to large steps.
- **Misaligning forward differences**: they belong to the midpoints of their intervals.
- **Making $h$ ever smaller** on exact functions (rounding takes over below about $10^{-5}$ for central differences) or on data (noise takes over).
- **Ignoring irregular sample times**, or trusting the one-sided end values of `np.gradient`.
- **Differentiating noisy data twice** without smoothing.
- **Quoting a derivative-based measurement without its definition and step**, such as a spike threshold or a peak rate of rise: both change with the step.
:::

## Lesson summary

- $f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}$: the tangent slope, in output units per input unit. Differentiable implies continuous; corners and jumps have no derivative.
- Rules: power, linearity, product, quotient, $e^{ax}$, $\ln$, $\sin$, $\cos$. Check them with a central difference at $h\approx10^{-5}$.
- $\sigma'=\sigma(1-\sigma)\le\tfrac14$, $\tanh'=1-\tanh^2$, ReLU′ is a step, softplus′ $=\sigma$. Saturation means tiny slopes.
- $\Delta f\approx f'(x)\Delta x$, with error $\approx\tfrac12f''\Delta x^2$. Discrimination threshold $\approx$ noise / slope.
- Forward and backward differences have error $\propto h$, central $\propto h^2$; forward differences belong to midpoints. Rounding error $\propto\varepsilon/h$ sets an optimal $h$.
- Noise in a central difference is $\sigma/(\sqrt2h)$: use longer steps or smoothing, trading resolution for noise; second derivatives are much noisier.
- On a real action potential recorded at 20 kHz, the smallest step gives the best $dV/dt$ (truncation dominates); added noise moves the best step, second derivatives amplify noise much more, and threshold definitions disagree by several mV.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
From the definition, find the derivative of $f(x)=3x^2-x$ and of $g(x)=\sqrt x$ (multiply by $\frac{\sqrt{x+h}+\sqrt x}{\sqrt{x+h}+\sqrt x}$).
---answer---
**First.** $\dfrac{3(x+h)^2-(x+h)-3x^2+x}{h}=6x+3h-1\to6x-1$.

**Second.** $\dfrac{\sqrt{x+h}-\sqrt x}{h}=\dfrac{(x+h)-x}{h(\sqrt{x+h}+\sqrt x)}=\dfrac{1}{\sqrt{x+h}+\sqrt x}\to\dfrac{1}{2\sqrt x}$.
:::

::: exercise
Differentiate: (a) $5x^4-3x^{-2}+2$; (b) $x^3e^{2x}$; (c) $\dfrac{x}{1+x^2}$; (d) $\ln x\cdot\cos x$.
---answer---
**(a)** $20x^3+6x^{-3}$.

**(b)** $3x^2e^{2x}+2x^3e^{2x}=x^2e^{2x}(3+2x)$.

**(c)** $\dfrac{(1+x^2)-2x^2}{(1+x^2)^2}=\dfrac{1-x^2}{(1+x^2)^2}$.

**(d)** $\dfrac{\cos x}{x}-\ln x\,\sin x$.
:::

::: exercise
A membrane potential relaxes as $V(t)=-70+15e^{-t/20}$ (mV, $t$ in ms). Find $dV/dt$ at $t=0$ and $t=20$ ms, with units. What is $dV/dt$ at $t=0$ as a fraction of the initial distance from $-70$ mV?
---answer---
**Derivative.** $V'(t)=-\frac{15}{20}e^{-t/20}$ mV/ms: $-0.75$ mV/ms at $t=0$, and $-0.75e^{-1}\approx-0.28$ mV/ms at 20 ms.

**Fraction.** At $t=0$, $\lvert V'\rvert/15=1/20$ per ms $=1/\tau$: the distance to rest shrinks at 5% per ms.
:::

::: exercise
Show that $\frac{d}{dx}\sigma(kx)=k\,\sigma(kx)(1-\sigma(kx))$ (use $(e^{-kx})'=-ke^{-kx}$), and that its value at 0 is $k/4$. What happens as $k\to\infty$?
---answer---
**Derivative.** $\sigma(kx)=1/(1+e^{-kx})$; by the quotient rule its derivative is $\dfrac{ke^{-kx}}{(1+e^{-kx})^2}=k\sigma(kx)(1-\sigma(kx))$.

**At 0.** $k\cdot\tfrac12\cdot\tfrac12=k/4$.

**As $k\to\infty$.** The slope at 0 grows without bound while the slope everywhere else tends to 0: the limit is the step function, which has no derivative at 0 (Lesson 8).
:::

::: exercise
Use the linear approximation to estimate $\sqrt{4.1}$ and $e^{0.05}$, and compare with the exact values.
---answer---
$\sqrt{4.1}\approx2+\frac{1}{2\sqrt4}(0.1)=2.025$ (exact $2.02485$).

$e^{0.05}\approx1+0.05=1.05$ (exact $1.05127$).
:::

::: exercise
A tuning curve is $r(\theta)=10+30\cos(\theta-\theta_0)$ ($\theta$ in radians), with response noise 3 spikes/s. Where is the discrimination threshold smallest, and what is it there (in degrees)? Where is it infinite?
---answer---
**Slope.** $\lvert r'\rvert=30\lvert\sin(\theta-\theta_0)\rvert$, largest (30 spikes/s per radian) at $\theta=\theta_0\pm\pi/2$.

**Smallest threshold.** $3/30=0.1$ rad $\approx5.7^\circ$, on the flanks.

**Infinite** where $r'=0$: at the peak $\theta_0$ and the trough $\theta_0+\pi$.
:::

::: exercise
Prove $(1/x)'=-1/x^2$ with the quotient rule, and check that it agrees with the power rule for $n=-1$.
---answer---
**Quotient rule.** $(1/x)'=\dfrac{0\cdot x-1\cdot1}{x^2}=-\dfrac{1}{x^2}$.

**Power rule.** $(x^{-1})'=(-1)x^{-2}$: the same.
:::

::: exercise
Estimate $f'(1)$ for $f(x)=x^3$ with forward and central differences at $h=0.1$, and compare the errors with $\tfrac12f''(1)h$ and $\tfrac16f'''(1)h^2$.
---answer---
The exact value is $f'(1)=3$.

**Forward.** $(1.331-1)/0.1=3.31$: error 0.31, against $\tfrac12f''(1)h=\tfrac12\cdot6\cdot0.1=0.3$.

**Central.** $(1.331-0.729)/0.2=3.01$: error 0.01, against $\tfrac16f'''(1)h^2=\tfrac16\cdot6\cdot0.01=0.01$ (exact, since $f'''$ is constant).
:::

::: exercise
A position signal is sampled every 10 ms with noise of standard deviation 0.1 mm. What is the noise standard deviation of a central-difference velocity with $h=10$ ms, and with $h=50$ ms? By how much does the second reduce it?
---answer---
**At $h=10$ ms.** $\sigma/(\sqrt2h)=0.1/(\sqrt2\times10)\approx0.0071$ mm/ms $=7.1$ mm/s.

**At $h=50$ ms.** $1.4$ mm/s: five times smaller, at the cost of a 100 ms window.
:::

::: exercise
A velocity is computed as the forward difference of position samples at 0 and 50 ms and assigned to time 0 in a data table. If the true velocity is $v(t)=20\sin(2\pi t)$ cm/s ($t$ in s), roughly how large is the timing error, and what systematic error does it cause near $t=0$?
---answer---
**Timing.** The estimate belongs to 25 ms but is labelled 0: a 25 ms lag.

**Error.** Near $t=0$, $v'(0)=40\pi\approx126$ cm/s², so the labelled value is too large by about $126\times0.025\approx3.1$ cm/s: a systematic error caused by the label alone.
:::

::: exercise
For $f(x)=\lvert x\rvert$, compute the forward and backward difference quotients at 0. What does the central difference give, and why is that misleading?
---answer---
**Forward:** $\lvert h\rvert/h=1$. **Backward:** $(0-\lvert-h\rvert)/h=-1$.

**Central:** $(\lvert h\rvert-\lvert-h\rvert)/(2h)=0$. That looks like a well-defined slope of 0, although the function has a corner and no derivative there: central differences can hide non-differentiability.
:::

::: exercise
*(Challenge.)* Minimise $E(h)=\tfrac16Mh^2+\varepsilon/h$ over $h>0$ (where $M=\lvert f'''\rvert$), and show $h_{\text{opt}}=(3\varepsilon/M)^{1/3}$. Evaluate it for $\varepsilon=10^{-16}$, $M=1$.
---answer---
**Minimise.** $E'(h)=\tfrac13Mh-\varepsilon/h^2=0$ gives $h^3=3\varepsilon/M$.

**Value.** With $\varepsilon=10^{-16}$ and $M=1$: $h_{\text{opt}}=(3\times10^{-16})^{1/3}\approx6.7\times10^{-6}$, consistent with the notebook's best central step of about $10^{-5}$.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise on where a spike starts. Both open in Google Colab.

{{ colab: week3/lesson9/Lesson9_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week3/lesson9/Lesson9_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Calculus*, 3rd ed., Wellesley–Cambridge Press, 2017 (free from MIT OpenCourseWare). Chapters 2–4: derivatives and their rules.
- R. L. Burden and J. D. Faires, *Numerical Analysis*, 9th ed., Brooks/Cole, 2011. Section 4.1, numerical differentiation and round-off error.
- H. S. Seung and H. Sompolinsky, "Simple models for reading neuronal population codes", *PNAS* 90:10749–10753, 1993; and N. A. Butts and M. S. Goldman, "Tuning curves, neuronal variability, and sensory coding", *PLoS Biology* 4:e92, 2006. Why slopes, not peaks, carry information.
- A. B. Saleem et al., "Integration of visual motion and locomotion in mouse visual cortex", *Nature Neuroscience* 16:1864–1869, 2013.
- M. Sekerli et al., "Estimating action potential thresholds from neuronal time-series: new metrics and evaluation of methodologies", *IEEE Transactions on Biomedical Engineering* 51:1665–1672, 2004.
- S. W. Harden, the pyABF Python package, sample files `18711001.abf` and `171116sh_0018.abf` (MIT licence): the data used in the mini-lab and the notebook's last exercise.
- 3Blue1Brown, *Essence of Calculus*, chapters 2–4: derivatives, their rules, and the chain rule, animated.
