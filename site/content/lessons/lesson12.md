---
summary: "Learning one step at a time: the gradient-descent update, the learning rate and its stability limit on a quadratic, stopping rules, initialisation on non-convex losses, stochastic gradients and their noise floor, schedules and reproducibility, and a real neuron's Poisson fit that cycles when the learning rate is chosen too early."
---

::: objectives
- The update rule $\theta\leftarrow\theta-\eta\,dL/d\theta$, why it decreases the loss, and the units of the learning rate
- The convex quadratic: the contraction factor $1-\eta a$, the four regimes, the stability limit $\eta<2/a$, and the number of steps to converge
- Initialisation, iteration budgets, tolerances and stopping rules, and how each rule can be fooled
- Stochastic (minibatch) gradients: unbiasedness, variance $\sigma_g^2/B$, the noise floor of a constant learning rate, schedules and the Robbins–Monro conditions
- Reproducibility: seeds, generators, and reporting the spread over runs
- How a learning rate chosen from the curvature at the start makes a real neuron's Poisson fit cycle or diverge, and how SGD behaves on real spike counts
:::

**Before you start.** This reading is the mathematical companion to the Lesson 12 teaching notebook. You need Lesson 9 (derivatives and the linear approximation), Lesson 11 (critical points, curvature, Taylor approximation, convexity and Newton's method), and basic averages and variances. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\theta_k$ | the parameter after $k$ steps; $\theta_0$ is the initial value |
| $\eta$, $\eta_k$ | the learning rate (step size), constant or following a schedule |
| $\theta^*$, $e_k=\theta_k-\theta^*$ | the minimiser, and the error after $k$ steps |
| $a$ | the curvature of a quadratic loss ($L''$) |
| $q=1-\eta a$ | the contraction factor of one step on a quadratic |
| $B$, $\sigma_g^2$ | the minibatch size; the variance of per-example gradients |
| $g_k$ | a (stochastic) gradient estimate at step $k$ |

## The problem: a synapse that learns from its errors

A model neuron predicts a target rate $y$ (spikes/s) from an input $x$ as $\hat y=wx$. The **delta rule** (Widrow and Hoff, 1960) changes the weight after each trial by

$$w\leftarrow w+\eta\,(y-wx)\,x .$$

Since $\frac{d}{dw}\tfrac12(y-wx)^2=-(y-wx)x$, this is a downhill step on the squared error of the current trial. The same structure, $V\leftarrow V+\alpha(\lambda-V)$, is the Rescorla–Wagner model of conditioning.

With 200 noisy trials and a true weight of 2.5, a learning rate of 0.01 is still at 1.88 after 200 trials; 0.1 reaches the right range within about 10 trials and then wanders between about 1.8 and 2.8; and 0.5 learns within a few trials but then jumps around wildly. Speed against stability, and the role of noise, are the themes of this lesson.

{{ interactive: delta-rule | The delta rule learning a synaptic weight from 200 noisy trials (true weight 2.5, dotted). Move the learning rate and press Play to replay the trials: small rates are slow but steady; large rates learn fast but are thrown around by every noisy trial. }}

## The update rule

::: definition Definition: gradient descent
From an initial value $\theta_0$, repeat

$$\theta_{k+1}=\theta_k-\eta\,L'(\theta_k),\qquad k=0,1,2,\dots$$

with a learning rate $\eta>0$.
:::

::: note Why it is true: each small step lowers the loss
By the linear approximation (Lesson 9), $L(\theta+h)\approx L(\theta)+L'(\theta)h$. With $h=-\eta L'(\theta)$,

$$L(\theta_{k+1})\approx L(\theta_k)-\eta\,L'(\theta_k)^2 ,$$

a decrease whenever $L'(\theta_k)\neq0$. Including the curvature term (Lesson 11), $L(\theta_{k+1})\approx L(\theta_k)-\eta L'^2\big(1-\tfrac12\eta L''\big)$: the decrease is guaranteed only while $\eta L''<2$.
:::

Gradient descent stops moving only where $L'=0$, at critical points.

**Units.** With $\theta$ in units $u$ and $L$ in units $\ell$, $\eta$ has units $u^2/\ell$. Changing the units of a parameter (ms to s) or the scale of the loss (a sum instead of a mean) changes the right learning rate; averaging the loss over examples keeps it independent of the size of the data set.

For the notebook's gain problem (the mean squared error of $\hat y=wx$ over 200 trials), $\eta=0.3$ moves $w$ from $-1$ to 2.35 in 15 steps, against the exact $w^*=2.418$, and $\lvert w_k-w^*\rvert$ falls by the same factor at every step.

## The convex quadratic: learning rate and convergence

For $L(\theta)=\frac a2(\theta-\theta^*)^2$ with $a>0$, $L'(\theta)=a(\theta-\theta^*)$, and the error obeys

$$e_{k+1}=(1-\eta a)\,e_k,\qquad e_k=(1-\eta a)^k e_0 .$$

::: keypoint
With $q=1-\eta a$:

- $0<\eta<1/a$: the iterates creep in monotonically;
- $\eta=1/a$: they land on $\theta^*$ in one step (the Newton step of Lesson 11);
- $1/a<\eta<2/a$: they oscillate but converge;
- $\eta=2/a$: they bounce for ever;
- $\eta>2/a$: they diverge.

**Stability limit**: $\eta<2/a$. Near any smooth minimum the loss is a parabola with $a=L''(\theta^*)$ (Lesson 11), so $\eta<2/L''(\theta^*)$ is needed for the minimum to be reachable at all.
:::

{{ interactive: gd-quadratic | Gradient descent on a parabola of curvature 4, starting from θ = 3. Left: the steps on the loss curve (orange). Right: the error on a log scale, a straight line whose slope is set by q = 1 − ηa. Press Play to sweep ηa through all four regimes. }}

**Rate of convergence.** Reducing the error by a factor $\varepsilon$ takes $k\approx\ln\varepsilon/\ln\lvert q\rvert$ steps. For $a=4$ and $\varepsilon=10^{-6}$: 131 steps at $\eta=0.025$, 20 at $\eta=0.125$, 1 at $\eta=0.25$, and 62 at $\eta=0.45$. The error shrinks by a constant factor per step, a fixed number of digits per step: **linear convergence**. For small $\eta a$, $\ln\lvert q\rvert\approx-\eta a$ and $k\approx\ln(1/\varepsilon)/(\eta a)$: halving the learning rate doubles the number of steps.

::: note In practice
When a loss has changing curvature, the relevant $a$ is the **largest curvature the iterates meet**, not the curvature at the start. A standard heuristic is to try a learning rate, double it until the loss stops decreasing steadily, then back off by a factor of 2–10.
:::

::: quiz
? On a quadratic with curvature $a=5$, which learning rate converges fastest?
- [ ] 0.01
- [x] 0.2
- [ ] 0.35
- [ ] 0.5
> $\eta=1/a=0.2$ gives $q=0$: one step. 0.35 gives $q=-0.75$ (slow oscillation); 0.5 gives $q=-1.5$ (divergence).

? Gradient descent on a quadratic multiplies the error by $q=-0.5$ each step. What do the iterates do?
- [ ] Creep in from one side
- [x] Jump from side to side, halving the error each time
- [ ] Diverge
> A negative $q$ flips the sign of the error each step; $\lvert q\rvert<1$ shrinks it.
:::

## Initialisation, iteration, tolerance and stopping

A usable routine needs an initial value, a maximum number of iterations, and a stopping rule.

::: definition Definition: stopping rules
- **Gradient**: $\lvert L'(\theta_k)\rvert<g_{\text{tol}}$.
- **Step**: $\lvert\theta_{k+1}-\theta_k\rvert<x_{\text{tol}}$.
- **Loss change**: $\lvert L(\theta_{k+1})-L(\theta_k)\rvert<f_{\text{tol}}$ (absolute, or relative to $\lvert L\rvert$).
- **Validation**: stop when the loss on held-out data stops improving (early stopping).

Always also cap the number of iterations, and check for non-finite values.
:::

Each tolerance has units: $g_{\text{tol}}$ in loss per parameter unit, $x_{\text{tol}}$ in parameter units, $f_{\text{tol}}$ in loss units. Relative tolerances avoid having to know the scale in advance.

**Flat-bottomed losses fool step rules.** For $L=\theta^4/4$ (a minimum at 0 with zero curvature) from $\theta_0=1$ with $\eta=0.1$, the step rule with $x_{\text{tol}}=10^{-3}$ stops after 102 steps at $\theta=0.21$; the gradient rule with $g_{\text{tol}}=10^{-6}$ needs 49,989 steps to reach $\theta=0.01$. For $L=\theta^2/2$ every rule stops within 132 steps, at most $9\times10^{-3}$ from 0. Where the curvature vanishes, the steps shrink faster than the remaining distance: convergence is **sublinear**.

**Initialisation on non-convex losses.** On Lesson 11's double well $E(x)=x^4-2x^2+0.3x$, small learning rates send every start to the minimum on its own side of the hilltop. For $\eta\ge0.15$, large steps on the steep outer walls ($E''$ reaches 35 at $\lvert x\rvert=1.8$) jump over the hill (18 of 181 starts at $\eta=0.15$, 31 at $\eta=0.2$). At $\eta=0.25$ the left, global minimum (curvature 8.87, limit 0.225) is no longer stable: 94 starts end in a 2-cycle around it and none settles there, while the right minimum (curvature 7.06, limit 0.283) still attracts 80.

{{ interactive: double-well-lr | Gradient descent on the double well. Top: the path of one run from the chosen start. Bottom: where runs from 181 starting points end, coloured by outcome (the dashed white line marks the hilltop). Press Play to raise the learning rate: first some runs jump the hill, then the sharp global minimum stops being reachable at all. }}

**The learning rate can decide which minimum is found**, and sharp minima are lost first.

## Stochastic gradients, noise, schedules and reproducibility

For a loss averaged over $n$ examples, $L=\frac1n\sum_i\ell_i$, **stochastic gradient descent** (SGD) uses a random minibatch $\mathcal B_k$ of size $B$:

$$g_k=\frac1B\sum_{i\in\mathcal B_k}\ell_i'(\theta_k),\qquad \theta_{k+1}=\theta_k-\eta_k\,g_k .$$

::: keypoint
$g_k$ is **unbiased** ($\mathbb E[g_k]=L'(\theta_k)$) with variance $\sigma_g^2/B$ (for batches drawn with replacement). With a constant $\eta$, SGD never settles: on a quadratic of curvature $a$ the iterates fluctuate around $\theta^*$ with

$$\operatorname{Var}(\theta)=\frac{\eta\,\sigma_g^2}{B\,a\,(2-\eta a)}\approx\frac{\eta\,\sigma_g^2}{2aB}.$$

Halving the spread needs a 4-fold smaller $\eta$ or a 4-fold larger batch.
:::

::: note Why it is true: the noise floor
Near $\theta^*$, $g_k=a e_k+\xi_k$, with noise $\xi_k$ of variance $\sigma_g^2/B$, independent of $e_k$. Then $e_{k+1}=(1-\eta a)e_k-\eta\xi_k$, so the variance obeys $v_{k+1}=(1-\eta a)^2v_k+\eta^2\sigma_g^2/B$. At equilibrium $v\big(1-(1-\eta a)^2\big)=\eta^2\sigma_g^2/B$, and $1-(1-\eta a)^2=\eta a(2-\eta a)$.
:::

In the notebook's gain problem ($a=0.775$, per-trial gradient SD 0.868, $\eta=0.1$), the measured spreads for $B=1$, 10 and 50 are 0.233, 0.067 and 0.030, against predictions of 0.220, 0.070 and 0.031.

{{ interactive: sgd-noise | SGD on the gain problem, simulated in your browser. With a constant learning rate the iterates jitter around θ* (dotted) with a spread close to the noise-floor formula; larger batches jitter less; a decaying schedule settles. Try a new seed to see how much a single run depends on chance. }}

**Schedules.** Large steps early give fast progress; small steps late average out the noise. Examples: $\eta_k=\eta_0/(1+k/\tau)$, step decay, cosine decay. The **Robbins–Monro conditions**

$$\sum_k\eta_k=\infty,\qquad \sum_k\eta_k^2<\infty$$

guarantee convergence for convex problems: the steps can travel any distance, but the noise they inject is finite. $\eta_k\propto1/k$ satisfies both; a constant rate fails the second; $\eta_k\propto1/k^2$ fails the first (the iterates may stall before arriving). For estimating a mean, $\eta_k=1/(k+1)$ turns SGD into the running average exactly.

::: keypoint
**Reproducibility.** Create one generator, `rng = np.random.default_rng(seed)`, and pass it to everything random (batch order, initialisation). Record the seed, batch size, schedule and number of steps. The same seed reproduces a run bit for bit; several seeds measure how much the result depends on chance, and that spread belongs in the report.
:::

::: quiz
? SGD with a constant learning rate has settled into a noise floor of spread 0.2. How could you halve it?
- [ ] Double the batch size
- [x] Quadruple the batch size, or quarter the learning rate
- [ ] Run twice as many steps
> The variance is proportional to $\eta/B$, so the spread is proportional to $\sqrt{\eta/B}$. More steps at the same rate do not shrink the floor.

? Which schedule satisfies both Robbins–Monro conditions?
- [ ] $\eta_k=0.05$
- [x] $\eta_k=1/(k+1)$
- [ ] $\eta_k=1/(k+1)^2$
> $\sum1/(k+1)$ diverges and $\sum1/(k+1)^2$ converges. A constant rate fails the second condition; $1/(k+1)^2$ fails the first.
:::

## Mini-lab: learning how strongly a neuron follows the wheel

**Data and model.** Neuron 332 of a mouse motor-cortex recording ([Steinmetz et al., 2019](https://doi.org/10.1038/s41586-019-1787-x); data released under CC0), the neuron most correlated with wheel speed in the training trials. $y_t$ is its spike count per 50 ms bin (mean 0.224, that is 4.5 spikes/s); $x_t$ is the wheel speed in the same bin, standardised. It is skewed: many still bins, and a few very fast turns, up to 4.5 standard deviations above the mean. A one-parameter Poisson model with a fixed offset $c=\ln\bar y$:

$$\lambda_t=e^{c+wx_t},\quad L(w)=\frac1n\sum_t(\lambda_t-y_t\ln\lambda_t),\quad L'(w)=\frac1n\sum_t(\lambda_t-y_t)x_t,\quad L''(w)=\frac1n\sum_t\lambda_tx_t^2 .$$

The loss is convex. Newton's method gives $w^*=0.718$: the expected count doubles ($e^{w^*}=2.05$) per standard deviation of speed. The training loss falls from 0.559 to 0.335, the test loss from 0.509 to 0.319.

**The curvature grows during the fit**: $L''(0)=0.224$ but $L''(w^*)=1.592$, seven times more, because $\lambda_t$ grows exponentially in bins with large $x_t$. The stability limit is 8.94 at the start but only 1.26 at the minimum. Full-batch gradient descent from 0:

- $\eta=0.31$, $0.63$ and $1.19$ ($0.5$, $1$ and $1.9$ times $1/L''(w^*)$) converge, the last with a damped oscillation;
- $\eta=1.4$, just above the local limit, settles into a **2-cycle** between 0.47 and 0.86, never converging and never diverging: the step is short where the curvature is small and overshoots where it is large;
- $\eta=2.0$ settles into a **3-cycle**, $-0.87\to0.30\to1.05$;
- $\eta=1/L''(0)=4.47$, sensible at the start, overshoots to 2.1 on its first step and then diverges.

{{ interactive: poisson-gd | Full-batch gradient descent on neuron 332's real Poisson loss, computed in your browser from all 8550 training bins. Left: the loss and the first steps of the path. Right: the gain at each step, with w* dotted. Press Play to sweep the learning rate through convergence, damped oscillation, cycles and divergence. }}

**SGD on real counts** (minibatches of bins drawn with replacement, 2 epochs, 20 seeds). The per-bin gradient SD at $w^*$ is 1.19.

- With $\eta=0.05$, the final values spread by 0.048 with batch 10 (prediction 0.047) and by 0.013 with batch 100 (prediction 0.015).
- A decaying rate $0.05/(1+kB/2000)$ cuts the spread to 0.014 with batch 10, although with batch 100 its 170 steps end short, at 0.65.
- A small constant rate (0.01, batch 100) is biased towards the start (0.58).
- With batch 1, the heavy-tailed per-bin gradients (a few fast-turning bins with many spikes) throw $w$ around: its last epoch spreads by about 0.5.

{{ figure: cell032_1.svg | SGD on neuron 332's real counts: batch 10 (blue) and batch 100 (vermilion), constant learning rate (thin lines, several seeds) and decaying learning rate (thick dashed); w* from the full-batch fit is dotted. }}

::: pitfall
One neuron; a one-parameter model with the offset fixed; the neuron was chosen on the same training data; consecutive bins are correlated. The last exercise in the notebook repeats the full-batch analysis for 330 neurons: with $\eta=1/L''(0)$, 127 converge, 163 cycle and 40 diverge, and the rule "converges exactly when $L''(w^*)/L''(0)<2$" predicts 99% of the cases. Halving $\eta$ whenever the loss would rise fixes all of them.
:::

## Where this appears in neuroscience and machine learning

**Learning in brains, and models of it.** The delta rule and Rescorla–Wagner learning are gradient descent on a prediction error; temporal-difference learning, whose error signal resembles phasic dopamine, extends them over time. People adapt their learning rate to the volatility of the environment, learning faster when outcomes change often (Behrens et al., 2007): a schedule set by an estimate of how fast the target moves. Synaptic plasticity driven by noisy, trial-by-trial signals is often modelled as stochastic gradient descent, and the instabilities of too-fast plasticity are kept in check by homeostatic mechanisms.

**Fitting models to neural data.** Generalised linear models, tuning curves and biophysical models are fitted by gradient-based optimisers; their stopping rules and tolerances decide how close to the optimum the reported parameters are.

**Machine learning.** Neural networks are trained by SGD and its variants (momentum, Adam; Lesson 15) with minibatches, learning-rate warm-up and decay, gradient clipping and early stopping. "The loss exploded" almost always means a learning rate above $2/L''$ somewhere. Results are reported over several seeds because the randomness of SGD changes the answer.

::: pitfall
**Common mistakes to avoid.**

- **Treating $\eta$ as unitless**: rescaling parameters, or summing instead of averaging the loss, changes the right learning rate.
- **Choosing $\eta$ from the curvature at the start** when the curvature grows towards the minimum.
- **Concluding "converged" because the steps became small**, on a loss with a flat bottom.
- **Monitoring only the parameter, not the loss**: a 2-cycle or a slow divergence is obvious in the loss history.
- **No iteration cap**, or no check for `nan`/`inf`.
- **Comparing a final SGD iterate with a constant learning rate to the exact answer** without allowing for the noise floor.
- **Reporting one SGD run** without the seed or the spread over seeds; using the global `np.random.seed` in some places and a generator in others.
- **Using batch size 1 with an exponential link and a large $\eta$**: a single extreme example can blow the fit up.
:::

## Lesson summary

- The update rule $\theta\leftarrow\theta-\eta L'(\theta)$ is a downhill step that lowers the loss while $\eta L''<2$; it stops only at critical points. $\eta$ has units.
- On a quadratic, $e_{k+1}=(1-\eta a)e_k$: monotone, one-step, oscillating, cycling or diverging as $\eta a$ passes 1 and 2. Linear convergence in about $\ln(1/\varepsilon)/(\eta a)$ steps for small $\eta a$.
- The stability limit is set by the largest curvature met along the way.
- Stopping rules (gradient, step, loss change, validation) each have units and failure modes; combine them with an iteration cap and report which one fired. Initialisation, and for large steps the learning rate, decide which minimum a non-convex fit finds.
- SGD: unbiased minibatch gradients with variance $\sigma_g^2/B$; a constant $\eta$ leaves a noise floor of about $\sqrt{\eta\sigma_g^2/(2aB)}$; decaying schedules that satisfy Robbins–Monro converge.
- Seed everything through one generator, and report the spread over seeds.
- On a real neuron, learning rates above the stability limit at the minimum produced 2-cycles, 3-cycles and divergence, even though they were safe at the start; SGD noise matched the noise-floor formula, and batch size 1 was very noisy because per-bin gradients are heavy-tailed.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
Take three gradient-descent steps on $L(\theta)=(\theta-1)^2$ from $\theta_0=5$ with $\eta=0.25$. By what factor does the error shrink per step?
---answer---
$L'=2(\theta-1)$.

**Steps.** $\theta_1=5-0.25\cdot8=3$; $\theta_2=3-0.25\cdot4=2$; $\theta_3=2-0.25\cdot2=1.5$.

**Factor.** The errors are 4, 2, 1, 0.5: a factor $1-2\eta=0.5$ per step.
:::

::: exercise
For $L(\theta)=3\theta^2$, give the stability limit and the learning rate that converges in one step.
---answer---
$a=L''=6$: stable for $\eta<2/6=1/3$; one step at $\eta=1/6$.
:::

::: exercise
With contraction factor $q=0.9$, how many steps reduce the error 1000-fold?
---answer---
$\ln(10^{-3})/\ln0.9=65.6$, so 66 steps.
:::

::: exercise
The Rescorla–Wagner rule $V\leftarrow V+\alpha(\lambda-V)$ updates the associative strength $V$ towards the reward $\lambda$. Show that it is gradient descent on a loss, and find $V$ after 5 trials from $V_0=0$ with $\alpha=0.3$ and $\lambda=1$.
---answer---
**Gradient descent.** $\frac{d}{dV}\tfrac12(\lambda-V)^2=-(\lambda-V)$, so the rule is $V\leftarrow V-\alpha\frac{d}{dV}\tfrac12(\lambda-V)^2$, with $\eta=\alpha$.

**After 5 trials.** $V_k=\lambda\big(1-(1-\alpha)^k\big)$, so $V_5=1-0.7^5=0.832$.
:::

::: exercise
The delta rule $w\leftarrow w+\eta(y-wx)x$ is applied with the same input $x=2$ on every trial. For which $\eta$ does it converge?
---answer---
The per-trial loss $\tfrac12(y-wx)^2$ has curvature $x^2=4$, so $0<\eta<2/4=0.5$ (with one-step convergence at $\eta=0.25$).
:::

::: exercise
A gain $\theta$ is measured in mV and the loss in (spikes/s)². What are the units of $L'$ and of $\eta$?
---answer---
$L'$: (spikes/s)²/mV. $\eta$: mV²/(spikes/s)².
:::

::: exercise
Run gradient descent on $L(\theta)=\lvert\theta\rvert$ from $\theta_0=0.35$ with $\eta=0.1$ (use $L'=\operatorname{sign}\theta$). What happens, and what would fix it?
---answer---
$0.35\to0.25\to0.15\to0.05\to-0.05\to0.05\to\dots$ It reaches the neighbourhood of 0 and then bounces between $\pm0.05$ for ever, because the slope never shrinks near the corner. A decaying learning rate (or a smoothed loss) fixes it.
:::

::: exercise
Per-example gradients have variance $\sigma_g^2=4$. What is the standard deviation of a minibatch gradient with $B=16$? On a quadratic with $a=1$ and $\eta=0.1$, estimate the SD of the SGD iterates around $\theta^*$.
---answer---
**Minibatch gradient:** $\sqrt{4/16}=0.5$.

**Noise floor:** $\sqrt{\eta\sigma_g^2/(Ba(2-\eta a))}=\sqrt{0.1\cdot4/(16\cdot1.9)}=0.115$ (the approximation $\sqrt{\eta\sigma_g^2/(2aB)}$ gives 0.112).
:::

::: exercise
Which of these schedules satisfy the Robbins–Monro conditions: (a) $\eta_k=0.1$; (b) $\eta_k=1/(k+1)$; (c) $\eta_k=1/(k+1)^2$; (d) $\eta_k=1/\sqrt{k+1}$? What goes wrong with each one that does not?
---answer---
**(a) No:** $\sum\eta_k^2=\infty$, so a noise floor remains.

**(b) Yes.**

**(c) No:** $\sum\eta_k=\pi^2/6$ is finite, so the iterates can travel only a bounded distance and may stall before the minimum.

**(d) No:** $\sum1/(k+1)=\infty$ for the squares, so the noise is not averaged away completely (in practice it still decays slowly, and averaging the iterates helps).
:::

::: exercise
The Poisson baseline loss $L(b)=e^b-\bar yb$ (with $\bar y=4$) has $L''(b)=e^b$. What is the largest learning rate that is stable at the minimum? Starting from $b_0=3$ with $\eta=0.4$, compute $b_1$ and explain what happens next.
---answer---
**Limit.** At the minimum $e^{b^*}=\bar y=4$, so the limit is $2/4=0.5$.

**First step.** $L'(3)=e^3-4=16.09$, so $b_1=3-0.4\cdot16.09=-3.43$.

**Next.** There the curvature is tiny ($e^{-3.43}=0.03$) and the slope is about $-3.97$, so the next steps are short ($+1.59$, then shorter), and the iterate crawls back towards $b^*=\ln4=1.386$. The first step overshot because the curvature at the start (20) was far above the limit.
:::

::: exercise
Compute two steps of gradient descent on $L=\theta^4/4$ from $\theta_0=1$ with $\eta=0.1$, and explain why convergence to 0 is sublinear.
---answer---
**Steps.** $\theta_1=1-0.1\cdot1=0.9$; $\theta_2=0.9-0.1\cdot0.729=0.827$.

**Why sublinear.** The step $0.1\theta^3$ is cubic in the distance, so the relative progress per step, $0.1\theta^2$, shrinks to zero: there is no constant contraction factor.
:::

::: exercise
*(Challenge.)* Derive the stationary variance of SGD on $L=\frac a2(\theta-\theta^*)^2$ with minibatch noise of variance $\sigma_g^2/B$ and constant $\eta$. What happens as $\eta a\to2$?
---answer---
**Derivation.** $e_{k+1}=(1-\eta a)e_k-\eta\xi_k$, so $v=(1-\eta a)^2v+\eta^2\sigma_g^2/B$ and

$$v=\frac{\eta\sigma_g^2}{Ba(2-\eta a)}.$$

**As $\eta a\to2$** the variance grows without bound: the deterministic part no longer damps the injected noise (at $\eta a=2$ it merely flips its sign).
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise that finds a learning rate for every neuron. Both open in Google Colab.

{{ colab: week4/lesson12/Lesson12_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week4/lesson12/Lesson12_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- B. Widrow and M. E. Hoff, "Adaptive switching circuits", *IRE WESCON Convention Record* 4:96–104, 1960.
- R. A. Rescorla and A. R. Wagner, "A theory of Pavlovian conditioning", in *Classical Conditioning II*, Appleton-Century-Crofts, 1972.
- H. Robbins and S. Monro, "A stochastic approximation method", *Annals of Mathematical Statistics* 22:400–407, 1951.
- L. Bottou, F. E. Curtis and J. Nocedal, "Optimization methods for large-scale machine learning", *SIAM Review* 60:223–311, 2018.
- I. Goodfellow, Y. Bengio and A. Courville, *Deep Learning*, MIT Press, 2016. Section 4.3 (gradient-based optimisation) and Chapter 8 (SGD and schedules).
- T. E. J. Behrens, M. W. Woolrich, M. E. Walton and M. F. S. Rushworth, "Learning the value of information in an uncertain world", *Nature Neuroscience* 10:1214–1221, 2007.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
