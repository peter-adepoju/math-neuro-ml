---
summary: "Adding up small changes: antiderivatives and the definite integral as signed area, Riemann sums and average values, the Fundamental Theorem of Calculus, numerical quadrature and its errors, how integration averages noise but accumulates bias, irregular sampling, and integrating real wheel velocity back to position."
---

::: objectives
- Antiderivatives and the definite integral as signed area, with units
- Riemann sums as the definition of the integral; signed area and the average value of a function
- The Fundamental Theorem of Calculus: accumulation and rate undo each other
- Numerical quadrature (Riemann, trapezoid, Simpson), its error orders, and why the sampling interval of data limits accuracy
- How integration averages noise but accumulates bias, and how to integrate irregularly sampled data
- How integrating wheel velocity recovers wheel position, and why integrating decoded velocity makes a brain–computer-interface cursor drift
:::

**Before you start.** This reading is the mathematical companion to the Lesson 13 teaching notebook. You need Lesson 9 (derivatives and their rules, differences of samples) and Lesson 11 (Taylor approximation). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\int f(x)\,dx=F(x)+C$ | an antiderivative (indefinite integral): $F'=f$ |
| $\int_a^b f(x)\,dx$ | the definite integral: signed area from $a$ to $b$ |
| $A(x)=\int_a^x f(s)\,ds$ | the accumulation function |
| $\bar f=\frac{1}{b-a}\int_a^b f$ | the average value |
| $h$, $h_i=t_{i+1}-t_i$ | the sampling interval (equal, or irregular) |
| $S_n$ | a Riemann sum with $n$ pieces |

## The problem: how many spikes does a stimulus evoke?

A neuron responds to a stimulus with rate $r(t)=r_0+A\frac t\tau e^{1-t/\tau}$, with $r_0=5$ spikes/s, $A=60$ spikes/s and $\tau=40$ ms. Over a short interval $\Delta t$ the expected count is about $r(t)\Delta t$; adding these pieces over 300 ms gives 7.993 expected spikes, which is the **area under the rate curve**. 2000 simulated trials average 7.94.

Units matter: spikes/s times ms must be converted to seconds before it is a count.

{{ interactive: accumulate | Left: the evoked firing rate, with the area up to time t shaded. Right: that area as a function of t, the accumulated expected count N(t). Press Play: the orange tangent shows that the slope of N at every moment equals the rate at that moment. }}

## Antiderivatives and the definite integral

::: definition Definition: antiderivative
$F$ is an antiderivative of $f$ if $F'=f$. All antiderivatives of $f$ differ by constants: $\int f(x)\,dx=F(x)+C$.
:::

Reading the derivative table backwards:

- $\int x^n\,dx=\frac{x^{n+1}}{n+1}+C$ ($n\neq-1$);
- $\int\frac1x\,dx=\ln\lvert x\rvert+C$;
- $\int e^{kx}\,dx=\frac1ke^{kx}+C$;
- $\int\cos\omega x\,dx=\frac1\omega\sin\omega x+C$;
- $\int\sigma(x)\,dx=\ln(1+e^x)+C$.

Some functions, such as $e^{-x^2}$, have no antiderivative in closed form and must be integrated numerically.

::: definition Definition: definite integral
$\int_a^bf(x)\,dx$ is the **signed area** between the graph and the axis on $[a,b]$ (positive above, negative below), defined as the limit of Riemann sums (next section).

It is linear, additive over adjacent intervals ($\int_a^b+\int_b^c=\int_a^c$), changes sign when the limits are swapped, and has units [units of $f$] × [units of $x$].
:::

**Examples.**

- A synaptic current $I_0e^{-t/\tau}$ delivers charge $\int_0^\infty I_0e^{-t/\tau}dt=I_0\tau$: 500 fC for $I_0=100$ pA and $\tau=5$ ms.
- An alpha conductance $g_{\max}\frac t\tau e^{1-t/\tau}$ has area $g_{\max}e\tau$.
- A difference of exponentials $I_0(e^{-t/\tau_d}-e^{-t/\tau_r})$ delivers $I_0(\tau_d-\tau_r)$.

## Riemann sums, signed area and average value

::: keypoint
Split $[a,b]$ into $n$ pieces of width $h=(b-a)/n$ and add rectangles: $S_n=\sum_{i=0}^{n-1}f(x_i^\star)\,h$, with $x_i^\star$ the left end, the right end or the midpoint of piece $i$. For continuous $f$ all choices converge to the same limit as $n\to\infty$, and that limit is $\int_a^bf$.
:::

For $f(x)=1+\sin x+0.3x$ on $[0,6]$ (exact 11.440), $n=8$ gives 10.868 (left), 12.008 (right) and 11.441 (midpoint). As $n$ grows the left and right errors shrink like $1/n$, the midpoint error like $1/n^2$.

{{ interactive: riemann | Approximating the area under f(x) = 1 + sin x + 0.3x by rectangles or trapezoids. Choose a rule and press Play to add pieces: the left and right errors halve when n doubles; the midpoint and trapezoid errors quarter. }}

::: note Why it is true: the left-sum error is about −(h/2)(f(b) − f(a))
On piece $i$, $f(x)\approx f(x_i)+f'(x_i)(x-x_i)$, so the exact area of the piece exceeds the rectangle $f(x_i)h$ by about $\frac12f'(x_i)h^2$. Summing, the left sum falls short by $\frac h2\sum f'(x_i)h\approx\frac h2\int_a^bf'=\frac h2\big(f(b)-f(a)\big)$ (using the Fundamental Theorem below).

The right sum errs by the same amount in the other direction, so their average (the trapezoid rule) cancels the $h$ term. If $f(b)=f(a)$ (a whole period of an oscillation, say), the left sum looks deceptively accurate.
:::

**Signed area.** During an action potential, an inward (negative) sodium current and an outward potassium current carry $-156$ fC and $+170$ fC in the notebook's example: a net charge of only 14 fC, from a total area of 326 fC.

{{ figure: cell016_1.svg | A model membrane current during an action potential. The inward current (vermilion area, −156 fC) and the outward current (blue area, +170 fC) nearly cancel; the green dashed line is the average value, 2.4 pA over 6 ms. }}

::: definition Definition: average value
$\bar f=\frac1{b-a}\int_a^bf(x)\,dx$: the height of the rectangle on $[a,b]$ with the same area.

The mean of equally spaced samples is its Riemann-sum approximation. The mean firing rate over a trial is the average value of the rate. For unequally spaced samples, a plain mean is biased towards densely sampled periods.
:::

## The Fundamental Theorem: accumulation and rate

::: keypoint
**Fundamental Theorem of Calculus.**

1. If $f$ is continuous and $A(x)=\int_a^xf(s)\,ds$, then $A'(x)=f(x)$.
2. If $F$ is any antiderivative of $f$, then $\int_a^bf(x)\,dx=F(b)-F(a)$.

Integration and differentiation undo each other.
:::

::: note Why it is true: the Fundamental Theorem
**(1)** $A(x+h)-A(x)=\int_x^{x+h}f$ is a thin strip. For continuous $f$ it lies between $h\min f$ and $h\max f$ on $[x,x+h]$, and both bounds divided by $h$ tend to $f(x)$ as $h\to0$. Hence $A'(x)=f(x)$.

**(2)** $A$ and $F$ are both antiderivatives of $f$, so $A=F+C$; $A(a)=0$ fixes $C=-F(a)$, and $x=b$ gives $\int_a^bf=F(b)-F(a)$.
:::

**Pairs of rate and accumulation**: velocity and position; firing rate and expected count; current and charge; the gradient steps of Lesson 12 and the total parameter change.

For data, `np.cumsum` (or `cumulative_trapezoid`) and `np.diff` (or `np.gradient`) are the discrete versions: integrating the stimulus-evoked rate and differentiating the result recovers the rate to within 0.2 spikes/s, as in the first figure. A PSTH is a forward difference of the trial-averaged cumulative spike count.

::: quiz
? A rate of 20 spikes/s is sustained for 250 ms. How many spikes are expected?
- [ ] 5000
- [ ] 80
- [x] 5
> 20 spikes/s × 0.25 s = 5 spikes. Convert ms to s before multiplying.

? $\frac{d}{dx}\int_0^x\sqrt{1+s^4}\,ds$ equals…
- [ ] 0
- [x] $\sqrt{1+x^4}$
- [ ] $\sqrt{1+x^4}-1$
> Part 1 of the Fundamental Theorem: the slope of the accumulated area is the integrand at the upper limit. No antiderivative is needed.

? Inward charge −150 fC and outward charge +150 fC flow during a spike. What is the net charge?
- [x] 0 fC
- [ ] 300 fC
- [ ] −150 fC
> The integral is a signed area: equal and opposite contributions cancel. The total (unsigned) charge moved is 300 fC.
:::

## Numerical quadrature, sampling interval and error

| Rule | Formula, for equally spaced samples $f_0,\dots,f_n$ | Error |
|---|---|---|
| left Riemann | $h(f_0+\dots+f_{n-1})$ | $\propto h$ |
| midpoint | $h\sum f(t_i+h/2)$ (needs values between samples) | $\propto h^2$ |
| trapezoid | $h\big(\tfrac12f_0+f_1+\dots+f_{n-1}+\tfrac12f_n\big)$ | $\approx-\frac{(b-a)h^2}{12}\overline{f''}$ |
| Simpson ($n$ even) | $\frac h3(f_0+4f_1+2f_2+4f_3+\dots+4f_{n-1}+f_n)$ | $\propto h^4$ |

::: note Why it is true: the trapezoid error on one piece
Replacing $f$ on $[x_i,x_i+h]$ by the straight line through its end points misses the curvature. With $f\approx f(x_i)+f'(x_i)u+\frac12f''u^2$ ($0\le u\le h$), the exact area exceeds the trapezoid by $\frac12f''\big(\frac{h^3}3-\frac{h^3}2\big)=-\frac{h^3}{12}f''$.

Over $n=(b-a)/h$ pieces the error is about $-\frac{(b-a)h^2}{12}\overline{f''}$: halving $h$ quarters it. Simpson's rule fits parabolas through triples of samples, which cancels the $h^2$ term as well.
:::

The measured orders in the notebook are 1.1, 2.0 and 4.1 for left, trapezoid and Simpson. They hold only for smooth integrands: with a kink between samples (a ReLU-like $\max(x-0.7,0)$), Simpson falls back to $h^2$.

{{ interactive: quad-error | Quadrature error against the sampling interval for the left sum (blue), trapezoid (vermilion) and Simpson's rule (green), computed live on [0, 1]. Each rule's error is a straight line on these log–log axes, with slope equal to its order. Switch to the kinked integrand to see Simpson lose its advantage. }}

::: keypoint
**With data, the sampling interval is fixed and limits the accuracy.** Higher-order rules help only if the signal is smooth on the scale of $h$. Above the Nyquist frequency (half the sampling rate) the samples alias (Lesson 8): a 9.2 Hz oscillation sampled at 10 Hz looks like a 0.8 Hz wave, and its integral over 2 s comes out as 2.287 instead of 1.975, whatever rule is used.
:::

**Noise averages, bias accumulates.** Independent errors of SD $\sigma$ in each sample give an integral error of SD $\sigma h\sqrt n=\sigma\sqrt{h(b-a)}$, growing like the square root of the duration. In the notebook ($\sigma=2$, $h=0.05$) the simulated SDs are 0.43, 0.83, 1.79, 3.68 and 7.25 for 1, 4, 16, 64 and 256 s, against 0.45, 0.89, 1.79, 3.58 and 7.16 predicted. A constant offset $\delta$ gives an error $\delta(b-a)$, growing linearly: a bias of 0.1 overtakes noise of SD 2 after about 20 s.

{{ interactive: noise-bias | Twelve runs of integrating a signal with independent noise and a constant bias. The noise makes the runs spread like √T (blue dashed: ±2 SD); the bias makes them all drift like T (vermilion). Press Play to raise the bias. }}

**Irregular sampling.** The trapezoid rule works for any spacing: $\int f\approx\sum_i\frac{f_i+f_{i+1}}2h_i$ (`np.trapezoid(f, t)`). Keeping a random 40% of 5 ms samples of the evoked rate gives 7.960 against the exact 7.993; pretending the kept samples are still 5 ms apart gives 4.029. Never assume regular spacing.

{{ interactive: irregular | A random subset of 5 ms samples of the evoked rate. With the true sample times, the trapezoid rule still recovers the area; assume the samples are 5 ms apart and the curve is squeezed into too short a time, losing about half the spikes. }}

::: quiz
? A trapezoid integral has error 0.004 with step $h$. Roughly what is the error with step $h/2$?
- [ ] 0.002
- [x] 0.001
- [ ] 0.00025
> The trapezoid error is proportional to $h^2$, so halving $h$ quarters it. (Simpson's rule, with error proportional to $h^4$, would fall 16-fold.)

? You integrate a velocity with a small constant bias for ten times longer. The error due to the bias…
- [ ] stays the same
- [ ] grows about 3 times ($\sqrt{10}$)
- [x] grows 10 times
> Bias accumulates linearly with time; only independent noise grows like the square root.
:::

## Mini-lab: from wheel velocity to wheel position

**Data.** A mouse motor-cortex recording ([Steinmetz et al., 2019](https://doi.org/10.1038/s41586-019-1787-x); data released under CC0): 342 trials of 2.5 s in which the mouse turned a wheel, with the wheel's rotary encoder stored as counts per 10 ms bin (a velocity), and 447 neurons. The wheel's position since the start of a trial is the running total of the counts, so it is known exactly; the median trial ends 352 encoder steps from where it started.

**Integrating velocity samples.** Treat each 10 ms rate as a point sample at its bin centre. The trapezoid rule on all of them reproduces the position exactly (each count is the integral over its bin, and the trapezoid between two centres adds half of each). Sampling more sparsely, the RMS error over all trials grows: 4.5 steps at 20 ms, 8.1 at 50 ms, 18 at 100 ms and 79 at 200 ms (the left Riemann sum is worse at each: 6.5, 14, 30 and 90), because the wheel turns in brisk movements lasting a few hundred milliseconds. Keeping a random half of the samples gives 8.1 steps with the true times (largest gap 160 ms), and 209 steps if the remaining samples are wrongly assumed to be 10 ms apart.

{{ interactive: wheel-integrate | The trial with the largest turn. Left: the exact wheel position (black) and the integral of velocity samples taken at the chosen interval (orange). Right: the velocity, with the samples used. Press Play to sample more and more coarsely. }}

**Integrating decoded velocity.** A linear decoder of wheel velocity from the neurons' smoothed rates (Lesson 5), trained on the first 171 trials, reaches a test $R^2$ of 0.67. Its mean error on the held-out trials is a bias of $+27.8$ steps/s, against a velocity standard deviation of 410.

Joining the held-out trials end to end and integrating the decoded velocity from the true starting position, the median position error at the end of a window grows from 62 steps (1 s) and 385 steps (10 s) to 908 (30 s) and 1930 (60 s): beyond about 20 s it is close to $\lvert\text{bias}\rvert\times$ duration. A linear decoder of the within-trial position itself does not drift, but it is hardly better than guessing (RMS error 342 against a spread of 351 steps).

{{ figure: cell031_1.svg | Left: the position error from integrating decoded velocity (blue) grows with the window, approaching |bias| × duration (vermilion dashed); the dotted line is the error of a direct position decoder. Right: 60 s of joined held-out trials, true accumulated turning (black) and the integrated decoded velocity (vermilion), which drifts away. }}

::: pitfall
The bias arises from non-stationarity: on the training trials the decoder's errors average exactly zero (least squares with an intercept), but on the held-out trials the relation between activity and movement has shifted slightly. One session, one linear decoder, recorded rather than intended movements; the trials were joined end to end, ignoring the wheel's movement between them; and the bias is estimated from all the held-out trials.
:::

## Where this appears in neuroscience and machine learning

**Spike counts and charges.** Expected counts are integrals of rates; PSTHs are differences of cumulative counts; synaptic charge is the integral of current; and the membrane equation $C\,dV/dt=I$ (Lesson 21) makes voltage an integral of current.

**Path integration.** Animals estimate their position by integrating self-motion, and the errors accumulate exactly as in the mini-lab; grid cells in entorhinal cortex are re-anchored by landmarks to correct the drift.

**Evidence accumulation.** In the drift–diffusion model of decisions, neurons in parietal cortex integrate noisy evidence; the signal grows like $T$ and the noise like $\sqrt T$, so accuracy improves with viewing time. A leaky integrator stops improving after a few time constants (explored in the exercise notebook).

**Brain–computer interfaces.** Velocity decoders are integrated to move cursors; users correct the drift in closed loop, and decoders are recalibrated as neurons drift.

**Statistics and machine learning.** Probabilities are integrals of densities, expectations are averages, $\mathbb E[X]=\int x\,p(x)\,dx$ (Lesson 17), and Bayesian normalising constants are integrals (Lesson 19). In many dimensions they are computed by Monte Carlo sampling, whose error is proportional to $N^{-1/2}$ whatever the dimension.

::: pitfall
**Common mistakes to avoid.**

- **Forgetting units**: spikes/s integrated over ms is not a count until the ms become s.
- **Confusing signed and total area**: net charge is not total charge.
- **Forgetting the constant** in an antiderivative, or the starting value of an accumulation.
- **Assuming regular spacing** for irregular samples, or averaging unequally spaced samples without time weights.
- **Trusting a higher-order rule on undersampled, kinked or noisy data.**
- **Integrating a biased signal over long times** and expecting the error to average out.
- **Judging a rule's accuracy on a special case**, such as a whole period of an oscillation, where the left sum looks exact.
:::

## Lesson summary

- $\int f\,dx=F+C$ with $F'=f$; $\int_a^bf$ is the signed area, with units [f] × [x].
- Riemann sums define the integral; left and right errors are proportional to $h$, midpoint errors to $h^2$. The average value is $\frac1{b-a}\int_a^bf$.
- Fundamental Theorem: $\frac{d}{dx}\int_a^xf=f$ and $\int_a^bf=F(b)-F(a)$; cumulative sums and differences are its discrete form.
- Trapezoid error $\propto h^2$, Simpson $\propto h^4$ for smooth integrands; with data, the sampling interval sets the accuracy; aliasing cannot be undone.
- Integration averages noise ($\propto\sqrt T$) but accumulates bias ($\propto T$). Use the trapezoid rule with true times for irregular samples.
- Integrated recorded velocity reproduces the wheel's position; integrated decoded velocity drifts by about $\lvert\text{bias}\rvert\times T$.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
Compute $\int_0^2(3x^2-2x+1)\,dx$.
---answer---
$[x^3-x^2+x]_0^2=8-4+2=6$.
:::

::: exercise
After a stimulus a neuron's rate rises by $50e^{-t/\tau}$ spikes/s, with $\tau=20$ ms. How many extra spikes does it fire on average?
---answer---
$\int_0^\infty50e^{-t/\tau}dt=50\tau=50\times0.02=1$ extra spike.
:::

::: exercise
Find the average value of $\sin x$ over $[0,\pi]$ and over $[0,2\pi]$.
---answer---
**Over $[0,\pi]$:** $\frac1\pi\int_0^\pi\sin x\,dx=\frac2\pi\approx0.637$.

**Over $[0,2\pi]$:** the positive and negative halves cancel: 0.
:::

::: exercise
For $f(x)=x^2$ on $[0,2]$ with $n=4$, compute the left, right, midpoint and trapezoid sums and compare with the exact value.
---answer---
$h=0.5$.

- **Left:** $0.5(0+0.25+1+2.25)=1.75$.
- **Right:** $0.5(0.25+1+2.25+4)=3.75$.
- **Midpoint:** $0.5(0.0625+0.5625+1.5625+3.0625)=2.625$.
- **Trapezoid:** $2.75$.
- **Exact:** $8/3=2.667$.

The midpoint error ($-0.042$) is half the trapezoid error ($+0.083$), with the opposite sign.
:::

::: exercise
Find $\frac{d}{dx}\int_0^xe^{-s^2}ds$ and $\frac{d}{dx}\int_0^{x^2}\cos s\,ds$.
---answer---
**First:** $e^{-x^2}$ (part 1 of the theorem).

**Second:** with $u=x^2$, the chain rule gives $\cos(x^2)\cdot2x$.
:::

::: exercise
A cell has capacitance 100 pF. What charge changes its voltage by 10 mV? For how long must a constant 50 pA current flow to deliver it?
---answer---
**Charge:** $Q=CV=100\text{ pF}\times10\text{ mV}=1$ pC $=1000$ fC.

**Time:** $t=Q/I=1000\text{ fC}/50\text{ pA}=20$ ms.
:::

::: exercise
Samples at times 0, 0.1, 0.3 and 0.6 s have values 2, 4, 3 and 1. Compute the trapezoid integral with the true times, and with the spacing wrongly assumed to be 0.2 s.
---answer---
**True times:** $0.1\cdot\frac{2+4}2+0.2\cdot\frac{4+3}2+0.3\cdot\frac{3+1}2=0.3+0.7+0.6=1.6$.

**Assumed 0.2 s:** $0.2(3+3.5+2)=1.7$.
:::

::: exercise
A trapezoid integral has error $10^{-3}$ with $h=0.1$. Estimate the error with $h=0.025$. What would Simpson's rule's error do over the same change of $h$?
---answer---
**Trapezoid:** error $\propto h^2$, so $10^{-3}/16\approx6.3\times10^{-5}$.

**Simpson:** error $\propto h^4$, so it falls by $4^4=256$ over the same change.
:::

::: exercise
A velocity signal sampled every 50 ms has independent noise of SD 3 cm/s and a bias of 0.2 cm/s. After integrating for 60 s, what are the SD of the position error due to noise, and the error due to bias?
---answer---
**Noise:** $3\sqrt{0.05\times60}=3\sqrt3\approx5.2$ cm.

**Bias:** $0.2\times60=12$ cm.
:::

::: exercise
A neuron's rate rises linearly, $r(t)=20+10t$ spikes/s, over $[0,2]$ s. Find the expected count and the average rate.
---answer---
**Count:** $\int_0^2(20+10t)\,dt=40+20=60$ spikes.

**Average:** $60/2=30$ spikes/s.
:::

::: exercise
Show that $\int_a^b\big(f(x)-\bar f\big)\,dx=0$.
---answer---
$\int_a^bf-\bar f(b-a)=\int_a^bf-\int_a^bf=0$: the average value is the constant that leaves no net area.
:::

::: exercise
*(Challenge.)* For $f(x)=x^2$ on a single piece $[0,h]$, compute the errors of the midpoint and trapezoid rules. Show that $\frac13(2M+T)$, where $M$ and $T$ are the two estimates, is exact, and relate this to Simpson's rule.
---answer---
**Exact:** $h^3/3$.

**Midpoint:** $M=h(h/2)^2=h^3/4$, error $-h^3/12$. **Trapezoid:** $T=h\frac{0+h^2}2=h^3/2$, error $+h^3/6$.

**Combination.** The trapezoid error is $-2$ times the midpoint error, so $\frac13(2M+T)=\frac13\big(\frac{h^3}2+\frac{h^3}2\big)=\frac{h^3}3$, exact.

**Simpson.** Simpson's rule on $[0,2h]$ is exactly this combination (midpoint and trapezoid on the double piece), so it is exact for parabolas, and its leading error comes from fourth derivatives.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, including evidence accumulation with noise and leak, and a real-data exercise on path length, sampling and firing. Both open in Google Colab.

{{ colab: week4/lesson13/Lesson13_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week4/lesson13/Lesson13_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Calculus*, 3rd ed., Wellesley–Cambridge Press, 2017 (free online). Chapters on integrals and the Fundamental Theorem, with substitution and integration by parts.
- W. H. Press et al., *Numerical Recipes*, 3rd ed., Cambridge University Press, 2007. Chapter 4, integration of functions.
- P. Dayan and L. F. Abbott, *Theoretical Neuroscience*, MIT Press, 2001. Chapter 1: firing rates, spike counts and the PSTH.
- J. I. Gold and M. N. Shadlen, "The neural basis of decision making", *Annual Review of Neuroscience* 30:535–574, 2007.
- B. L. McNaughton et al., "Path integration and the neural basis of the 'cognitive map'", *Nature Reviews Neuroscience* 7:663–678, 2006.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
- 3Blue1Brown, *Essence of Calculus*, chapters 8–9: integration and the Fundamental Theorem, animated.
