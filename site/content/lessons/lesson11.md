---
summary: "Valleys, peaks and flat directions: critical points and the first-derivative test, curvature and the second-derivative test, Taylor approximation and Newton's method, convexity, flat and sharp directions of a loss, ridge regularisation, and the loss landscape of a real speed-tuned neuron."
---

::: objectives
- What a critical point is, and how the sign changes of $f'$ classify it (the first-derivative test); why endpoints and corners must also be checked
- The second derivative as curvature: convex and concave regions, inflection points, the second-derivative test, and its finite-difference estimate
- Taylor approximation: why every smooth valley looks like a parabola near its bottom, and Newton's method as "jump to the bottom of the parabola"
- Convex and non-convex objectives: why every local minimum of a convex function is global, which standard losses are convex, and why convexity depends on the parameterisation
- Flat and sharp directions of a loss with several parameters, the Hessian's eigenvalues as curvatures, parameter trade-offs, and ridge regularisation
- How the curvature of a real neuron's tuning-curve loss predicts (and fails to predict) how well its parameters are determined
:::

**Before you start.** This reading is the mathematical companion to the Lesson 11 teaching notebook. You need Lesson 9 (derivatives, the linear approximation, central differences), Lesson 8 (bisection, the saturating speed-tuning fit), Lesson 5 (least squares, collinearity, the condition number) and Lesson 6 (eigenvalues and eigenvectors of symmetric matrices). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $x^*$ | a critical point: $f'(x^*)=0$ |
| $f''(x)$ | the second derivative: the rate of change of the slope; curvature |
| $f^{(k)}(x)$ | the $k$-th derivative |
| $\boldsymbol\theta$ | a vector of model parameters |
| $\mathbf{H}$, $H_{ij}=\partial^2L/\partial\theta_i\partial\theta_j$ | the Hessian: the symmetric matrix of second derivatives of a loss $L(\boldsymbol\theta)$ |
| $\lambda_{\min}$, $\lambda_{\max}$ | the smallest and largest eigenvalues of $\mathbf{H}$ (curvatures); $\kappa=\lambda_{\max}/\lambda_{\min}$ is the condition number |
| $\lambda$ (ridge) | the regularisation strength (the context distinguishes it from an eigenvalue) |

## The problem: a landscape with two valleys

Many neural models describe a state that slides downhill on an "energy" curve: a memory network that can hold one of two patterns, or a decision circuit choosing between two options. Take

$$E(x)=x^4-2x^2+0.3x,\qquad \Delta x\propto-E'(x).$$

$E'(x)=4x^3-4x+0.3$ is zero at $x\approx-1.036$, $0.075$ and $0.960$. Starting points to the left of the hilltop end in the left valley ($E=-1.305$); those to the right end in the right valley ($E=-0.706$). The left valley is the **global** minimum; the right one is only a **local** minimum, and a state that starts on the right never learns that a deeper valley exists.

{{ interactive: double-well | A ball sliding downhill on a double-well energy. Pick a starting point and press Play: it settles into whichever valley it started above. Green dots are minima, open vermilion dots maxima. Increase the tilt and the shallower valley shrinks, until (past |c| ≈ 1.54) it disappears altogether. }}

## Critical points and the first-derivative test

::: definition Definition: critical point
A point $x^*$ where $f'(x^*)=0$: the tangent is horizontal.

A **local minimum** is a point lower than all nearby points; a **global minimum** is lower than (or equal to) every point of the domain. Maxima likewise.
:::

::: keypoint
**First-derivative test.** As $x$ increases through a critical point:

- $f'$ changes from $-$ to $+$: a local **minimum**;
- $f'$ changes from $+$ to $-$: a local **maximum**;
- no change of sign: neither (a stationary inflection, like $x^3$ at 0).
:::

::: note Why it is true: a minimum of a differentiable function has f′ = 0
If $f'(x^*)>0$, the linear approximation $f(x^*+h)\approx f(x^*)+f'(x^*)h$ (Lesson 9) shows that a small step to the left ($h<0$) lowers $f$, so $x^*$ is not a minimum; if $f'(x^*)<0$, a small step to the right lowers it. So at an interior minimum $f'(x^*)$ can be neither positive nor negative.
:::

The argument needs an *interior* point where $f$ is differentiable. So the candidates for a global minimum on $[a,b]$ are: the critical points, the **endpoints** $a$ and $b$, and points where $f'$ does not exist (the corner of $\lvert x\rvert$ or ReLU). On $[-3,3]$, $f(x)=x^3-3x$ has critical points at $\pm1$ ($f=\mp2$), but its global minimum is $f(-3)=-18$, at an endpoint.

**Finding critical points numerically.** Evaluate $f'$ on a grid, locate sign changes, and refine each by bisection (Lesson 8). A grid that is too coarse misses pairs of nearby critical points; points where $f'$ touches zero without changing sign are missed too, but they are not extrema.

## The second derivative and curvature

The **second derivative** $f''=(f')'$ measures how fast the slope changes. Its units are output units per (input unit)²: acceleration (cm/s²) is the second derivative of position.

::: keypoint
$f''>0$: the slope increases and the graph bends **up** (convex: it "holds water"). $f''<0$: it bends **down** (concave). Where $f''$ changes sign the graph has an **inflection point**.

**Second-derivative test.** If $f'(x^*)=0$ and $f''(x^*)>0$, $x^*$ is a local minimum; if $f''(x^*)<0$, a local maximum; if $f''(x^*)=0$, the test says nothing (use sign changes instead: $x^4$ has a minimum at 0, $-x^4$ a maximum, $x^3$ neither).
:::

For the double well, $E''(x)=12x^2-4$: $+8.87$ and $+7.06$ at the two valleys, $-3.93$ at the hilltop, with inflection points at $x=\pm1/\sqrt3$.

{{ interactive: curvature | Slope and curvature. The blue line is the tangent at x; the orange dashed parabola also matches the curvature there (the second-order Taylor approximation). Green shading marks where f″ > 0 (bends up), purple where f″ < 0. Sweep x to find the critical points and read their curvature. }}

**Inflection points are the steepest points.** Where $\lvert f'\rvert$ is largest, $f'$ has a critical point, so $(f')'=f''=0$. The sigmoid has $\sigma''=\sigma(1-\sigma)(1-2\sigma)$, zero at $z=0$: the input where a sigmoidal neuron is most sensitive (Lesson 9) and its gradient largest (Lesson 10). For a Hill function $c^2/(c^2+K^2)$ the steepest point is at $c=K/\sqrt3$, below the half-activation point $K$.

**Numerically,**

$$f''(x)\approx\frac{f(x+h)-2f(x)+f(x-h)}{h^2},$$

with a truncation error proportional to $h^2$ and a rounding error proportional to $\varepsilon_{\text{mach}}/h^2$. The best step is about $\varepsilon_{\text{mach}}^{1/4}\approx10^{-4}$, much larger than for first differences, and the attainable accuracy (about $10^{-8}$ relative) is much worse. Second differences of noisy data are noisier still (Lesson 9).

::: quiz
? At a critical point, $f''(x^*)=-2$. What is it?
- [ ] A local minimum
- [x] A local maximum
- [ ] An inflection point
- [ ] Nothing can be said
> The graph bends down there, so the horizontal tangent sits at the top of a hump.

? $f(x)=x^4$ at $x=0$: $f'(0)=0$ and $f''(0)=0$. What is $x=0$?
- [x] A minimum
- [ ] A maximum
- [ ] An inflection point
> The second-derivative test is inconclusive, but $f'=4x^3$ changes from negative to positive at 0, so it is a minimum.
:::

## Taylor approximation and Newton's method

::: keypoint
**Taylor polynomial of order $n$** around $x$:

$$f(x+h)\approx f(x)+f'(x)h+\tfrac12f''(x)h^2+\dots+\frac{f^{(n)}(x)}{n!}h^n,$$

with an error proportional to $h^{n+1}$ for small $h$ (if $f$ is smooth enough). Order 1 is Lesson 9's linear approximation; order 2 adds curvature.
:::

::: note Why it is true: the coefficients are f⁽ᵏ⁾/k!
Look for a polynomial $p(h)=c_0+c_1h+c_2h^2+\dots+c_nh^n$ that matches $f(x+h)$ and its first $n$ derivatives at $h=0$. Differentiating $p$ $k$ times and setting $h=0$ leaves only $k!\,c_k$. Matching requires $k!\,c_k=f^{(k)}(x)$, so $c_k=f^{(k)}(x)/k!$.
:::

{{ interactive: taylor | Taylor polynomials of sin x (black) around a centre a (vermilion dot). Press Play to add terms one at a time: each term matches one more derivative at a, and the stretch over which the polynomial (blue) hugs the curve grows. }}

**Every valley is a parabola near its bottom.** At a minimum $f'(x^*)=0$, so

$$f(x)\approx f(x^*)+\tfrac12f''(x^*)(x-x^*)^2 .$$

The width of the valley is set by the curvature: the loss rises by $\Delta$ at a distance $\sqrt{2\Delta/f''(x^*)}$ from the bottom. A large $f''$ makes a narrow, **sharp** valley; a small one a wide, **flat** valley. In the double well, the loss rises by 0.1 within 0.150 of the left minimum and within 0.168 of the right one.

A useful special case: $\cos\theta\approx1-\theta^2/2$ near 0, so a von Mises tuning curve $e^{\kappa(\cos\theta-1)}\approx e^{-\kappa\theta^2/2}$ is close to a Gaussian bump of width $1/\sqrt\kappa$ radians.

::: definition Definition: Newton's method
Minimise the quadratic approximation instead of $f$: setting $\frac{d}{dh}\big[f+f'h+\tfrac12f''h^2\big]=f'+f''h=0$ gives the step $h=-f'/f''$, and the iteration

$$x\leftarrow x-\frac{f'(x)}{f''(x)}.$$
:::

Near a minimum Newton's method converges very fast: in the double well from $x=1.5$ it reaches $0.960150$ to six decimals in five steps, the number of correct digits roughly doubling at each step. But it seeks *any* critical point: from $x=0.3$ and from $x=-0.05$ it converges to the **maximum** at 0.0754, because where $f''<0$ the parabola opens downwards. Far from the minimum the quadratic model can also be poor, giving huge or tiny steps. Gradient descent (Lesson 12) uses only $f'$ and takes cautious steps.

{{ interactive: newton | Newton's method on the double well. At each step the orange dashed parabola matches E, E′ and E″ at the current point, and Newton jumps to its vertex (open circle). Start at 1.5 for fast convergence to a minimum; start at 0.3 to watch it climb to the hilltop instead. }}

## Convex and non-convex objectives

::: definition Definition: convex function
$f$ is **convex** if every chord lies on or above the graph:

$$f\big((1-t)a+tb\big)\le(1-t)f(a)+tf(b)\qquad\text{for all }a,b\text{ and }0\le t\le1.$$

For a twice-differentiable $f$ of one variable this is equivalent to $f''(x)\ge0$ everywhere. **Strictly convex** means strict inequality, which is implied by $f''>0$.
:::

{{ interactive: convex-chord | Move the two points and watch the chord between them. Green: the chord lies on or above the graph. Vermilion: it dips below, so the function is not convex there. For x², |x| + x² and eˣ no chord ever dips below. }}

::: keypoint
**For a convex function, every local minimum is a global minimum.** A strictly convex function has at most one minimum. Any method that walks downhill and stops at a point with zero slope has found the answer.
:::

::: note Why it is true: local means global for convex f
Suppose $x^*$ is a local minimum and some point $b$ has $f(b)<f(x^*)$. For small $t>0$, the point $x_t=(1-t)x^*+tb$ is close to $x^*$, and by convexity $f(x_t)\le(1-t)f(x^*)+tf(b)<f(x^*)$. So points arbitrarily close to $x^*$ are lower than $x^*$, contradicting that it is a local minimum.
:::

**Which losses are convex?**

- **Convex:** least squares in the coefficients of a linear model (its Hessian $\frac2n\mathbf{X}^{\mathsf T}\mathbf{X}$ satisfies $\mathbf{v}^{\mathsf T}\mathbf{X}^{\mathsf T}\mathbf{X}\mathbf{v}=\lVert\mathbf{X}\mathbf{v}\rVert^2\ge0$ for every direction $\mathbf{v}$); the Poisson loss $\lambda-y\ln\lambda$ with $\lambda=e^{\mathbf{w}\cdot\mathbf{x}}$; logistic regression; absolute error; ridge and lasso penalties; and sums of convex functions.
- **Not convex:** squared error through a saturating nonlinearity (the loss flattens when the sigmoid saturates, so it must bend down somewhere); neural networks; models with nonlinear parameters, such as Lesson 8's speed scale $s_0$.

**Convexity depends on the parameterisation.** The cosine tuning curve $b+a\cos(\theta-\theta_p)$ is not convex in $\theta_p$. But $a\cos(\theta-\theta_p)=c_1\cos\theta+c_2\sin\theta$ with $c_1=a\cos\theta_p$, $c_2=a\sin\theta_p$, and least squares in $(b,c_1,c_2)$ is convex, with a unique solution (Lessons 2 and 4). The last exercise in the notebook uses the same idea for the peak time of a response: a parabola $c_0+c_1t+c_2t^2$ is linear in its coefficients, and its peak $-c_1/(2c_2)$ agrees with a non-convex grid search to within a median 0.06 s for well-tuned mouse motor-cortex neurons.

**Non-convex losses: start in many places.** Downhill methods find a local minimum that depends on the start. The practical defences are multiple random starts (compare the final losses), good initial guesses from a simpler convex model, and reparameterisation.

::: quiz
? Which of these is convex on the whole real line?
- [ ] $x^3$
- [x] $e^x$
- [ ] $\sin x$
- [ ] $x^4-2x^2$
> $(e^x)''=e^x>0$ everywhere. The others all have regions where $f''<0$.

? A convex loss has a point where its gradient is zero. What do you know?
- [ ] It might be a saddle or a maximum.
- [x] It is a global minimum.
- [ ] It is a local minimum, but there may be a deeper one.
> For a convex function, any point with zero slope is a global minimum.
:::

## Flat and sharp directions, trade-offs and regularisation

With several parameters $\boldsymbol\theta$, the quadratic approximation near a minimum $\boldsymbol\theta^*$ is

$$L(\boldsymbol\theta)\approx L(\boldsymbol\theta^*)+\tfrac12(\boldsymbol\theta-\boldsymbol\theta^*)^{\mathsf T}\mathbf{H}(\boldsymbol\theta-\boldsymbol\theta^*),$$

with $\mathbf{H}$ the Hessian (developed properly in Lesson 14). $\mathbf{H}$ is symmetric, so (Lesson 6) it has perpendicular eigenvectors $\mathbf{u}_i$ with real eigenvalues $\lambda_i$. Moving a distance $\varepsilon$ along $\mathbf{u}_i$ raises the loss by $\tfrac12\lambda_i\varepsilon^2$: the eigenvalues are the **curvatures along the eigen-directions**. At a minimum all $\lambda_i\ge0$, and the contours near it are ellipses with axes along the $\mathbf{u}_i$, longest along the flattest direction.

::: keypoint
**Sharp direction** (large $\lambda_i$): the data pin this combination of parameters down.

**Flat direction** (small $\lambda_i$): the loss barely changes, so parameters **trade off** against each other, and the combination is poorly determined.

The ratio $\lambda_{\max}/\lambda_{\min}$ is the condition number (Lesson 5); it also slows down gradient descent (Lessons 12 and 15).
:::

**Collinear regressors.** Two inputs with correlation 0.99 and true weights $(2,\ 1)$: the Hessian of $\frac{1}{2n}\lVert\mathbf{y}-\mathbf{X}\mathbf{w}\rVert^2$ is $\mathbf{X}^{\mathsf T}\mathbf{X}/n$, with eigenvalues 0.010 and 1.73 (condition number 169) and flat direction $(1,\ -1)/\sqrt2$. The data determine $w_1+w_2$ (the fit gives 2.92; the truth is 3) but not $w_1-w_2$ (fitted 2.76; true 1): the least-squares estimate $(2.84,\ 0.08)$ sits far along the valley. For unit-variance inputs with correlation $\rho$ the condition number is $(1+\rho)/(1-\rho)$.

::: keypoint
**Ridge regularisation** adds $\frac\lambda2\lVert\boldsymbol\theta\rVert^2$ to the loss, so the Hessian becomes $\mathbf{H}+\lambda\mathbf{I}$: the same eigenvectors, and every eigenvalue increased by $\lambda$. Flat directions sharpen most (relatively); the minimum becomes unique and stable, at the cost of shrinking the estimate (bias).
:::

{{ interactive: ridge-valley | Loss contours for two collinear regressors: a long, flat valley (green arrow) across a sharp one (purple). The least-squares minimum (vermilion) lies far from the true weights (black). Add a ridge penalty: every curvature rises by λ, the valley rounds off, and the minimum is pulled in. }}

With $\lambda=0.05$ and $0.3$ the condition number falls to 30 and 6.5, and the weights become $(1.65,\ 1.18)$ and $(1.28,\ 1.20)$. Over 500 simulated data sets (in the exercise notebook), the mean squared error of the weights falls from 0.56 (least squares) to 0.26 at $\lambda=0.01$, then rises again for large $\lambda$ as bias dominates. Lesson 15 chooses $\lambda$ by validation.

::: note In practice
Flatness is not scale-free: measuring a parameter in different units changes its curvature by the square of the conversion factor. Compare curvatures only between parameters in comparable units, or standardise first.
:::

## Mini-lab: the loss landscape of a speed-tuned neuron

**Data and model.** Neuron 332 of a mouse motor-cortex recording ([Steinmetz et al., 2019](https://doi.org/10.1038/s41586-019-1787-x); data released under CC0): its rate in spikes/s against wheel speed in the same 50 ms bin (encoder steps/s), training trials only (8550 bins). The neuron is almost silent at rest and fires more and more steeply as the turn gets faster (Lesson 8), so the model is the accelerating exponential

$$r(s)=r_0+A(e^{s/s_0}-1).$$

Least squares gives $r_0=-0.24$ spikes/s, $A=14.8$ spikes/s and $s_0=1265$ steps/s, with a mean squared error of 94.5 (spikes/s)².

**Profile over $s_0$.** For a fixed $s_0$ the model is linear in $(r_0,A)$, so they can be re-fitted exactly by least squares, leaving the loss as a function of $s_0$ alone. Its minimum is at about 1270 steps/s, with curvature $6.4\times10^{-6}$ (spikes/s)²/(step/s)². The valley is lopsided: moving to $s_0=500$ raises the loss by 12%, but moving to 2000 raises it by only 0.73%. On that flat side the profile levels off and is no longer convex, but there is a single valley.

{{ interactive: profile-s0 | Left: the loss as a function of s₀, with r₀ and A refitted for each value. Right: the best curve for the chosen s₀ (blue) against the binned training data (black) and the overall best fit (vermilion dashed). Press Play to sweep s₀: on the flat side, quite different curves fit almost equally well. }}

**The $(A,s_0)$ landscape** is a long curved valley: a curve that starts rising later but more steeply (larger $A$ with larger $s_0$) fits almost as well. The Hessian of the loss in $(r_0,A,s_0)$ has eigenvalues $7.2\times10^{-6}$, 0.75 and 2.33; the flattest direction is almost purely $s_0$, partly because $s_0$ is measured in much larger units than the others.

{{ figure: cell030_1.svg | Left: the profile of the loss over s₀ (black) with its quadratic (Taylor) approximation at the minimum (blue dashed). Right: loss contours over (A, s₀), a long curved valley, with the fitted minimum marked. }}

**Curvature and uncertainty.** For least squares with $n$ independent residuals of variance $\hat\sigma^2$, the estimates have approximate covariance

$$\operatorname{Cov}(\hat{\boldsymbol\theta})\approx\frac{2\hat\sigma^2}{n}\mathbf{H}^{-1},$$

with $\mathbf{H}$ the Hessian of the *mean* squared error (Lessons 17–20 explain why). Small curvatures become large variances; trade-offs become correlations. This gives standard errors $(0.13,\ 1.15,\ 55)$ for $(r_0,A,s_0)$ (`curve_fit` gives 0.13, 1.29 and 63), and a correlation of 0.99 between $\hat A$ and $\hat s_0$.

**Check by refitting on 8 consecutive chunks.** The chunk-to-chunk spread implies standard errors $(0.12,\ 6.2,\ 275)$, and the chunk estimates lie along the flat valley, from $(A,s_0)\approx(1,\ 480)$ to $(57,\ 2900)$ (correlation of $A$ and $s_0$: 0.99). Curvature predicts the uncertainty of $r_0$ well, but underestimates that of $A$ and $s_0$ about five-fold. Neighbouring bins are correlated, the neuron's response may change across the session, and the fast turns that pin down the steep part of the curve are rare and unevenly spread over the chunks. None of this shows up in the shape of the loss at its minimum.

{{ figure: cell032_1.svg | Left: the estimates from 8 separate chunks of the session (green) spread along the flat valley; the fit to all training trials is marked too. Right: the ratio of chunk-based to curvature-based standard errors for each parameter; 1 (dashed) would mean curvature is exactly right. }}

::: pitfall
One neuron and one model; second derivatives by finite differences with a fixed relative step; consecutive chunks mix sampling noise with changes across the session. The curvature-based formula assumes a correct model with independent, stationary noise. On simulated data that satisfy these assumptions (in the exercise notebook) it agrees with repeated simulation to within about 15%.
:::

## Where this appears in neuroscience and machine learning

**Attractor networks.** In Hopfield-type networks, stored memories are minima of an energy function, and recall is downhill motion into the nearest valley. Decision models settle into one of two wells. Tilting the energy (a bias, like $0.3x$ above) changes the relative depth of the valleys, and a large enough tilt removes one of them altogether (the last exercise; bifurcations in Lesson 23). The stability of fixed points of dynamical systems is decided by curvature-like quantities, the eigenvalues of the Jacobian (Lessons 6 and 23).

**Degeneracy and sloppy models.** Very different combinations of ion-channel conductances produce nearly identical rhythms in the crustacean stomatogastric ganglion (Prinz, Bucher and Marder, 2004): the loss measuring a model's match to the rhythm has long flat valleys. Many biophysical and systems-biology models are "sloppy" in this sense, with Hessian eigenvalues spread over many orders of magnitude (Gutenkunst et al., 2007). Flat directions mean that individual parameters cannot be identified from data, but also that circuits can be robust to changes in their components.

**Machine learning.** Linear and logistic regression, GLMs and support vector machines are convex and fit reliably; neural networks are not. Second-order (Newton and quasi-Newton) optimisers use curvature; adaptive optimisers such as Adam approximate it per parameter. The Hessian's spectrum explains ill-conditioning and slow training. Weight decay is ridge regularisation. Whether "flat" minima generalise better than "sharp" ones is debated, partly because flatness depends on the parameterisation. The **Laplace approximation** replaces a posterior distribution by a Gaussian whose covariance is the inverse Hessian at its peak: the Bayesian version of the uncertainty formula in the mini-lab (Lesson 19).

::: pitfall
**Common mistakes to avoid.**

- **Forgetting endpoints and corners** when looking for a global minimum on a bounded domain.
- **Treating $f'(x^*)=0$ as a minimum** without checking: it could be a maximum, or neither.
- **Reading $f''(x^*)=0$ as "not an extremum".** The second-derivative test is merely inconclusive there.
- **Using too small a step** for a second difference: rounding error grows like $1/h^2$.
- **Trusting a quadratic approximation far from its centre**, for example a Newton step taken where $f''$ is tiny or negative.
- **Assuming a fitted minimum is the global one** for a non-convex loss, with a single start.
- **Interpreting individual parameters along a flat direction**, such as two weights of collinear regressors, or $A$ and $s_0$ separately.
- **Comparing curvatures of parameters in different units.**
- **Taking curvature-based standard errors at face value** when the noise is correlated or the system drifts.
:::

## Lesson summary

- Critical points have $f'=0$; classify them by the sign changes of $f'$ or by the sign of $f''$. Global extrema can also sit at endpoints and corners.
- $f''$ is curvature: positive bends up, negative bends down; inflection points (sign changes of $f''$) are where $f$ is steepest.
- Taylor: $f(x+h)\approx f+f'h+\tfrac12f''h^2+\dots$; every smooth valley is a parabola near its bottom, with a width set by $f''$. Newton's method jumps to the parabola's vertex: fast near a minimum, but it finds any critical point.
- Convex functions ($f''\ge0$, chords above the graph) have no spurious local minima. Least-squares, Poisson and logistic losses of linear models are convex; neural networks and nonlinear parameters are not. Reparameterising can restore convexity.
- With several parameters, the Hessian's eigenvalues are the curvatures along its eigenvectors. Flat directions mean trade-offs and large, correlated uncertainty. Ridge adds $\lambda$ to every curvature.
- For a mouse motor-cortex neuron's speed response, amplitude and speed scale trade off along a long flat valley. Curvature predicts the uncertainty of $r_0$ well but underestimates that of $A$ and $s_0$ about five-fold, because the bins are correlated and the informative fast turns are rare.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
Find and classify all critical points of $f(x)=2x^3-9x^2+12x$, using both tests.
---answer---
**Critical points.** $f'=6x^2-18x+12=6(x-1)(x-2)$: $x=1$ and $x=2$.

**First-derivative test.** $f'$ goes from $+$ to $-$ at 1 and from $-$ to $+$ at 2.

**Second-derivative test.** $f''=12x-18$ is $-6$ at 1 and $+6$ at 2.

**Result.** A local maximum $f(1)=5$ and a local minimum $f(2)=4$ (neither is global on $\mathbb{R}$).
:::

::: exercise
For the alpha function $g(t)=g_{\max}\frac{t}{\tau}e^{1-t/\tau}$ ($t\ge0$), find the time at which the conductance *decays* fastest.
---answer---
$g'\propto(1-t/\tau)e^{-t/\tau}$ and $g''\propto\frac1\tau(t/\tau-2)e^{-t/\tau}$, which is zero (and changes sign) at $t=2\tau$: the inflection point, where $g'$ is most negative.
:::

::: exercise
Show that the value of $m$ minimising $\sum_{i=1}^n(x_i-m)^2$ is the mean of the $x_i$, and that it is a minimum. (Which $m$ minimises $\sum\lvert x_i-m\rvert$?)
---answer---
**Squared error.** $\frac{d}{dm}\sum(x_i-m)^2=-2\sum(x_i-m)=0$ gives $m=\bar x$. The second derivative is $2n>0$, so it is a minimum (and global, since the function is convex).

**Absolute error.** $\sum\lvert x_i-m\rvert$ is minimised by the **median**: its slope is (number of $x_i$ below $m$) − (number above), which changes sign at the median.
:::

::: exercise
Use the second-order Taylor polynomial of $e^x$ around 0 to approximate $e^{0.1}$. Estimate the error from the next term and compare it with the true error.
---answer---
**Approximation.** $1+0.1+0.005=1.105$.

**Error.** The next term is $0.1^3/6\approx1.67\times10^{-4}$; the true value is $1.105171$, an error of $1.71\times10^{-4}$.
:::

::: exercise
Write the second-order Taylor approximation of $\cos\theta$ around 0 and evaluate it at $30^\circ$. Use it to explain why a von Mises bump $e^{\kappa(\cos\theta-1)}$ looks like a Gaussian for large $\kappa$, and give the Gaussian's width.
---answer---
**Approximation.** $\cos\theta\approx1-\theta^2/2$; at $30^\circ=0.5236$ rad this gives $0.8629$, against $0.8660$.

**Von Mises.** $\kappa(\cos\theta-1)\approx-\kappa\theta^2/2$, so $e^{\kappa(\cos\theta-1)}\approx e^{-\theta^2/(2\cdot(1/\kappa))}$: a Gaussian with standard deviation $1/\sqrt\kappa$ radians. For large $\kappa$ the bump is narrow, so only small $\theta$ matter, and the approximation is good.
:::

::: exercise
Take two Newton steps for minimising $f(x)=x^2-\ln x$ ($x>0$) from $x=1$, and compare with the exact minimiser.
---answer---
$f'=2x-1/x$ and $f''=2+1/x^2$.

**Step 1.** From 1: $x=1-1/3=0.6667$.

**Step 2.** $f'=-0.1667$, $f''=4.25$, so $x=0.7059$.

**Exact.** $x^*=1/\sqrt2=0.7071$ (a third step gives $0.707106$).
:::

::: exercise
Which are convex on the stated domain? (a) $e^x$ on $\mathbb{R}$; (b) $x^3$ on $\mathbb{R}$; (c) $\lvert x\rvert+x^2$; (d) $\ln(1+e^x)$; (e) $-\ln x$ on $x>0$; (f) $\sin x$ on $[0,\pi]$.
---answer---
**(a)** Yes: $f''=e^x>0$. **(b)** No: $f''=6x<0$ for $x<0$. **(c)** Yes: a sum of convex functions. **(d)** Yes: $f''=\sigma(1-\sigma)>0$. **(e)** Yes: $f''=1/x^2>0$. **(f)** No: $f''=-\sin x\le0$ there (it is concave).
:::

::: exercise
Show that if $f$ and $g$ are convex then $f+g$ is convex. Explain why adding a ridge penalty $\lambda w^2$ ($\lambda>0$) to a convex loss gives a strictly convex one.
---answer---
**Sum.** Add the two chord inequalities: $(f+g)((1-t)a+tb)\le(1-t)(f+g)(a)+t(f+g)(b)$. Or: $(f+g)''=f''+g''\ge0$.

**Ridge.** $(L+\lambda w^2)''=L''+2\lambda\ge2\lambda>0$: strictly convex, so the minimum is unique.
:::

::: exercise
For $L(w_1,w_2)=(w_1+w_2-3)^2+0.01(w_1-w_2)^2$, find the Hessian, its eigenvalues and eigenvectors, and the condition number. Which combination of weights is well determined?
---answer---
**Hessian.** $\mathbf{H}=\begin{pmatrix}2.02&1.98\\1.98&2.02\end{pmatrix}$.

**Eigen-decomposition.** Eigenvalue 4 along $(1,\ 1)/\sqrt2$ and 0.04 along $(1,\ -1)/\sqrt2$; condition number 100.

**Meaning.** The sum $w_1+w_2$ is well determined; the difference poorly.
:::

::: exercise
Add the penalty $0.1(w_1^2+w_2^2)$ to the loss of the previous exercise. What are the new curvatures and condition number?
---answer---
The penalty's Hessian is $0.2\mathbf{I}$, so the curvatures become 4.2 and 0.24, and the condition number is 17.5.
:::

::: exercise
In the mini-lab the profile loss over $s_0$ has curvature $6.44\times10^{-6}$ (spikes/s)²/(step/s)² at its minimum, the residual variance is 94.5 (spikes/s)² and $n=8550$. Estimate the standard error of $s_0$ from $\sqrt{2\hat\sigma^2/(n\,L'')}$, check its units, and compare with the mini-lab's values.
---answer---
**Estimate.** $\sqrt{2\times94.5/(8550\times6.44\times10^{-6})}=59$ steps/s.

**Units.** The square root of (spikes/s)² divided by (spikes/s)²/(step/s)² is step/s.

**Comparison.** It is close to the Hessian-based value of 55 (the profile's curvature already accounts for refitting $r_0$ and $A$; the small difference comes from the finite-difference steps), and about five times smaller than the chunk-based 275.
:::

::: exercise
*(Challenge.)* For $E(x)=x^4-2x^2+cx$, find the range of $c$ for which $E$ has two local minima. What happens to a bistable memory as the bias $c$ grows past this range?
---answer---
**Condition.** $E'(x)=4x^3-4x+c$. Two minima require three critical points, so the cubic $4x^3-4x$ must take the value $-c$ three times. It has a local maximum $8/(3\sqrt3)$ at $x=-1/\sqrt3$ and a local minimum $-8/(3\sqrt3)$ at $1/\sqrt3$, so the condition is $\lvert c\rvert<8/(3\sqrt3)\approx1.54$.

**Beyond it.** As $\lvert c\rvert$ passes 1.54, the shallower valley merges with the hilltop and disappears: the system can no longer hold that state and slides into the other one (a saddle-node bifurcation, Lesson 23). You can watch this in the double-well figure at the top of the page.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise on whether fitting a response's peak time is convex. Both open in Google Colab.

{{ colab: week3/lesson11/Lesson11_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week3/lesson11/Lesson11_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Calculus*, 3rd ed., Wellesley–Cambridge Press, 2017 (free online). Chapters on maxima and minima, second derivatives and Taylor series.
- S. Boyd and L. Vandenberghe, *Convex Optimization*, Cambridge University Press, 2004 (free online). Chapters 2–3 for convex functions; Chapter 9 for Newton's method.
- I. Goodfellow, Y. Bengio and A. Courville, *Deep Learning*, MIT Press, 2016. Section 4.3 (curvature, the Hessian and the condition number) and Chapter 8 (non-convex optimisation).
- A. A. Prinz, D. Bucher and E. Marder, "Similar network activity from disparate circuit parameters", *Nature Neuroscience* 7:1345–1352, 2004.
- R. N. Gutenkunst et al., "Universally sloppy parameter sensitivities in systems biology models", *PLoS Computational Biology* 3:e189, 2007.
- J. J. Hopfield, "Neural networks and physical systems with emergent collective computational abilities", *PNAS* 79:2554–2558, 1982.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
