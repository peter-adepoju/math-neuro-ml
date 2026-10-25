---
summary: "Reasoning backwards from data: Bayes' rule and its normaliser, odds and likelihood ratios, evidence accumulated over time, posterior distributions for a probability and a rate, how to summarise them, decisions that weigh costs, calibration, and a Bayesian look at a mouse and its visual cortex."
---

::: objectives
- Apply Bayes' rule to discrete hypotheses, with normalisation by the law of total probability
- Use odds and likelihood ratios, and accumulate conditionally independent evidence sequentially
- Build posterior distributions over a parameter from a generative model (beta–binomial, gamma–Poisson), on a grid and exactly
- Summarise a posterior: MAP, posterior mean and median, posterior probabilities, credible intervals
- Choose actions by minimising expected loss, derive cost-dependent thresholds, and check calibration
:::

**Before you start.** This reading is the mathematical companion to the Lesson 19 teaching notebook. You need Lesson 16 (conditional probability, the law of total probability, confusion matrices), Lesson 18 (binomial and Poisson models, likelihood) and Lesson 8 (the sigmoid). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $P(H)$, $P(D\mid H)$, $P(H\mid D)$ | prior, likelihood, posterior |
| $P(D)=\sum_jP(D\mid H_j)P(H_j)$ | the evidence (normaliser) |
| $O=P/(1-P)$, $\mathrm{LR}=P(D\mid H_1)/P(D\mid H_0)$ | odds; likelihood ratio |
| $\operatorname{Beta}(\alpha,\beta)$, $\operatorname{Gamma}(a,b)$ | priors for a probability, and for a rate (shape $a$, rate $b$) |
| $c_{\text{miss}}$, $c_{\text{FA}}$ | the costs of a miss and of a false alarm |

## Bayes' rule and normalisation

::: note Why it is true: Bayes' rule
The product rule written two ways, $P(H_i\cap D)=P(D\mid H_i)P(H_i)=P(H_i\mid D)P(D)$, gives

$$P(H_i\mid D)=\frac{P(D\mid H_i)\,P(H_i)}{\sum_jP(D\mid H_j)\,P(H_j)}.$$

The denominator is the law of total probability; it only normalises. **Posterior ∝ likelihood × prior.**
:::

Lesson 16's spike detector (sensitivity and specificity 0.9, base rate 1%) gives $P(\text{spike}\mid\text{alarm})=0.009/0.108=0.083$. A second independent alarm raises it to 0.45, a third to 0.88.

{{ interactive: alarms | The probability of a real spike before any alarm (grey) and after one, two and three independent alarms (blue). Change the base rate, sensitivity and specificity, or press Play to sweep the base rate. }}

**Decoding.** With the encoding table of an orientation-tuned neuron and equal priors, $P(90^\circ\mid\text{high})=0.56$, although $P(\text{high}\mid90^\circ)=0.7$. If $90^\circ$ is shown on only 4% of trials, $45^\circ$ and $135^\circ$ (0.39 each) become more probable than $90^\circ$ (0.14).

{{ interactive: decode-orientation | Decoding a neuron's high response. For each orientation: the prior (grey), the likelihood P(high | θ) (orange) and the posterior P(θ | high) (blue). Make 90° rarer or commoner and watch the most probable orientation change. }}

The decoder must use the stimulus statistics of the situation it is used in.

::: quiz
? A test has sensitivity 0.8 and specificity 0.95, and the prevalence is 5%. What is $P(\text{condition}\mid\text{positive})$?
- [ ] 0.80
- [x] about 0.46
- [ ] 0.95
> $0.8\times0.05/(0.8\times0.05+0.05\times0.95)=0.04/0.0875=0.457$. The false positives from the 95% without the condition nearly match the true positives.
:::

## Odds, likelihood ratios and sequential evidence

::: keypoint
$$\frac{P(H_1\mid D)}{P(H_0\mid D)}=\mathrm{LR}\times\frac{P(H_1)}{P(H_0)}.$$

On the log scale, for observations that are conditionally independent given the hypothesis, $\log O_{\text{post}}=\log O_{\text{prior}}+\sum_t\log\mathrm{LR}_t$, and $P=\operatorname{sigmoid}(\log O)$. Updating one observation at a time gives the same result as updating with all of them at once.
:::

For Poisson counts $x_t$ in bins with means $\lambda_1$ and $\lambda_0$, $\log\mathrm{LR}_t=x_t\log(\lambda_1/\lambda_0)-(\lambda_1-\lambda_0)$: a silent bin is evidence for the lower rate.

The **sequential probability ratio test** accumulates evidence until $\lvert\sum\log\mathrm{LR}\rvert\ge a$. With rates 30 and 20 spikes/s in 20 ms bins, bounds giving posteriors 0.75, 0.90, 0.95, 0.99 and 0.999 yield accuracies 0.79, 0.91, 0.96, 0.985 and 0.999, at mean decision times of 360, 1010, 1380, 2340 and 3580 ms.

{{ interactive: sprt | Left: accumulated log-likelihood ratio on eight trials with the stimulus present, stopping at the bound ±a (dashed). Right: accuracy against mean decision time for a range of bounds (blue) and the current one (black). Slide or Play the bound. }}

This is a speed–accuracy trade-off, as in drift-diffusion models of decisions. Accuracy slightly exceeds the posterior at the bound, because discrete counts overshoot it.

::: quiz
? Evidence has likelihood ratio 6, and the prior probability is 0.1. What is the posterior probability?
- [ ] 0.6
- [x] 0.4
- [ ] 0.1
> Prior odds $0.1/0.9=1/9$; posterior odds $6/9$; posterior probability $(6/9)/(1+6/9)=0.4$.
:::

## Posterior distributions over a parameter

::: note Why it is true: beta–binomial and gamma–Poisson conjugacy
A Beta prior $\propto p^{\alpha-1}(1-p)^{\beta-1}$ times a binomial likelihood $\propto p^k(1-p)^{n-k}$ is $\propto p^{\alpha+k-1}(1-p)^{\beta+n-k-1}$: the posterior is $\operatorname{Beta}(\alpha+k,\ \beta+n-k)$. The prior acts like $\alpha$ earlier successes and $\beta$ failures.

A Gamma prior $\propto\lambda^{a-1}e^{-b\lambda}$ times a Poisson likelihood $\propto\lambda^{\sum x_i}e^{-m\lambda}$ gives $\operatorname{Gamma}(a+\sum x_i,\ b+m)$.
:::

A grid posterior (likelihood × prior, normalised by the trapezoid rule) matches the conjugate one to $10^{-14}$. With 4 trials the prior matters; with 120 trials all priors give nearly the same posterior.

{{ interactive: beta-posterior | Prior (grey dashed), likelihood (orange, rescaled) and posterior (blue) for k successes in n trials. Choose a flat, weak or strong prior and set the data; the black bar is the 95% credible interval. Press Play to add trials at a 3/4 success rate. }}

## Summarising a posterior

- The **MAP** is the posterior's mode; under a flat prior it equals the MLE.
- The **posterior mean** minimises the expected squared error; for the flat-prior beta–binomial it is $(k+1)/(n+2)$.
- The **posterior median** minimises the expected absolute error.
- **Posterior probabilities**, such as $P(p>0.5\mid D)$, answer direct questions.
- **Central credible intervals** contain the parameter with the stated posterior probability.

For 20 successes in 20 trials, the MLE is 1, but the posterior mean is 0.955 and the 95% interval $[0.84,\ 1.00]$. For 0 of 5, the MLE is 0, but the posterior mean is 0.14. For 4 spikes in five 100 ms windows with a Gamma(2, 0.2) prior, the posterior mean is 1.15 spikes per window, against an MLE of 0.8.

::: quiz
? With a flat Beta(1, 1) prior and 7 successes in 10 trials, what is the posterior mean?
- [ ] 0.7
- [x] 8/12 ≈ 0.667
- [ ] 0.5
> The posterior is Beta(8, 4), with mean $8/12=0.667$, pulled slightly from the MLE 0.7 towards the prior mean 0.5. Its mode is 0.7.
:::

## Decisions, costs and calibration

::: note Why it is true: the Bayes decision threshold
With $q=P(H_1\mid D)$, acting "present" has expected loss $(1-q)c_{\text{FA}}$, and acting "absent" has $q\,c_{\text{miss}}$. Act "present" if and only if $(1-q)c_{\text{FA}}<q\,c_{\text{miss}}$, that is,

$$q>\frac{c_{\text{FA}}}{c_{\text{FA}}+c_{\text{miss}}}\qquad\Longleftrightarrow\qquad\mathrm{LR}>\frac{c_{\text{FA}}}{c_{\text{miss}}}\cdot\frac{P(H_0)}{P(H_1)}.$$

Rare signals and cheap misses demand stronger evidence.
:::

{{ interactive: cost-threshold | Expected loss of acting "present" (vermilion) and "absent" (blue) against the posterior probability. The lines cross at the Bayes threshold (dashed). Change the costs, or press Play to sweep the cost of a miss. }}

::: keypoint
**Calibration**: among predictions of probability $q$, a fraction $q$ should come true. A reliability diagram plots the observed frequency against the stated probability.

Log loss, $-\frac1n\sum[y\log q+(1-y)\log(1-q)]$, and the Brier score, $\frac1n\sum(q-y)^2$, reward calibrated confidence. Accuracy does not measure calibration: a forecaster whose log-odds are four times too large makes the same decisions at 0.5, but has log loss 0.93 against 0.53.
:::

{{ interactive: calibration | A reliability diagram for 4000 forecasts. Multiply the forecaster's log-odds by the slider value: 1 is calibrated (on the diagonal), larger values are overconfident, smaller ones underconfident. Accuracy stays fixed while log loss and the Brier score change. }}

## Mini-lab: a Bayesian look at the mouse and its visual cortex

**A. Posterior choice probabilities** (Steinmetz et al., 2019, session 11; flat priors). Where Lesson 18's MLE was 0 or 1 with "SE 0", the posterior is informative: 0 of 21 right turns at $c=-1$ gives a posterior mean of 0.043 and a 95% interval of $[0.001,\ 0.154]$. At $c=0$, $P(p>0.5\mid\text{data})=0.98$: a rightward bias is very probable.

{{ figure: cell027_1.svg | The psychometric function again: Beta posterior means with 95% credible intervals (blue), and Lesson 18's maximum-likelihood estimates (vermilion crosses). }}

**B. A naive-Bayes decoder from 66 VISp neurons.** The model treats the neurons' Poisson counts as independent given whether a right grating is present, with means and prior estimated from a random half of the trials. On the other half its accuracy is 0.976 (4 errors, all misses), better than Lesson 16's summed-count threshold.

But the median $\lvert\log O\rvert$ is 49, a stated certainty of about $1-10^{-21}$. On the 166 test trials it states at above 99.9% certainty, it expects about 0.002 errors in total and makes 2. The model counts 66 neurons as independent witnesses, but among neurons firing at least one spike per window on full-contrast trials, 89% of pairs are positively correlated (mean 0.28). Multiplying correlated evidence as if it were independent inflates the log-odds: a good decision boundary with wrong probabilities.

{{ figure: cell030_1.svg | Left: the naive-Bayes decoder's log posterior odds on test trials, with (vermilion) and without (blue) a right grating, clipped at ±150. Right: pairwise noise correlations among 18 VISp neurons, mostly positive (mean dashed). }}

::: pitfall
A posterior is only as good as the generative model. Before using posteriors for cost-sensitive decisions, check calibration on held-out data, and model or correct for dependence (a covariance model, or recalibration fitted on separate data).
:::

## Where this appears in neuroscience and machine learning

**Neuroscience.** Perception as inference (cue combination, priors on stimulus statistics); Bayesian decoders of stimuli and movements (Kalman filters in brain–computer interfaces); evidence accumulation in decision making (drift diffusion, ramping activity in parietal cortex); psychometric fits with priors; firing rates from few spikes; simulation-based inference of model parameters.

**Machine learning.** Naive Bayes and generative classifiers; logistic regression, whose sigmoid output is a log-odds; weight decay as a Gaussian prior and MAP training; Bayesian neural networks and Gaussian processes; cost-sensitive operating points; calibration and temperature scaling of classifiers.

::: pitfall
**Common mistakes to avoid.**

- **Confusing $P(D\mid H)$ with $P(H\mid D)$**, or ignoring the base rate.
- **Multiplying likelihoods of dependent observations** as if they were independent.
- **Reporting a posterior without its prior**, or a point estimate without saying which one.
- **Treating a guessing tail probability as $P(\text{guessing}\mid\text{data})$.**
- **Choosing a threshold of 0.5 when costs are unequal.**
- **Judging probabilistic predictions by accuracy alone**, or trusting uncalibrated posteriors.
:::

## Lesson summary

- Bayes' rule: posterior ∝ likelihood × prior, normalised by the evidence.
- Odds form: posterior odds = LR × prior odds; log-LRs add for conditionally independent data; sequential updating equals batch updating.
- Conjugate updates: $\operatorname{Beta}(\alpha+k,\ \beta+n-k)$ and $\operatorname{Gamma}(a+\sum x,\ b+m)$; data overwhelm priors as they accumulate.
- Summaries: MAP, mean, median, posterior probabilities and credible intervals differ for skewed posteriors.
- Decisions: act if $P(H_1\mid D)>c_{\text{FA}}/(c_{\text{FA}}+c_{\text{miss}})$; this works only if the posteriors are calibrated.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
A test has sensitivity 0.8 and specificity 0.95; the prevalence is 5%. Find $P(\text{condition}\mid\text{positive})$.
---answer---
$0.8\times0.05/(0.8\times0.05+0.05\times0.95)=0.04/0.0875=0.457$.
:::

::: exercise
Convert the probabilities 0.2 and 0.75 to odds and log-odds; convert the log-odds 2 to a probability.
---answer---
0.2: odds 0.25, log-odds $-1.386$. 0.75: odds 3, log-odds 1.099. Log-odds 2: $1/(1+e^{-2})=0.881$.
:::

::: exercise
Evidence has $\mathrm{LR}=6$ and the prior is 0.1. Find the posterior. A second, independent piece of evidence has $\mathrm{LR}=3$; update again.
---answer---
Prior odds $1/9$; posterior odds $6/9$, so probability 0.4. Then odds $18/9=2$, so probability 0.667.
:::

::: exercise
For Poisson bins with $\lambda_1=1$ and $\lambda_0=0.5$, give $\log\mathrm{LR}$ for counts 0, 1 and 2.
---answer---
$\log\mathrm{LR}=x\log2-0.5$: $-0.5$, 0.193 and 0.886.
:::

::: exercise
With a Beta(1, 1) prior and 7 successes in 10 trials, give the posterior, its mean and its mode.
---answer---
Beta(8, 4); mean $8/12=0.667$; mode $7/10=0.7$.
:::

::: exercise
With a Beta(10, 10) prior and the same data, give the posterior mean. How many pseudo-trials does the prior represent?
---answer---
Beta(17, 13), with mean $17/30=0.567$. The prior represents 20 pseudo-trials (10 successes, 10 failures).
:::

::: exercise
Counts $2,0,3,1$ in four windows, with a Gamma(1, 0.5) prior. Give the posterior and its mean.
---answer---
$\operatorname{Gamma}(1+6,\ 0.5+4)=\operatorname{Gamma}(7,\ 4.5)$, with mean $7/4.5=1.56$ per window.
:::

::: exercise
Show that sequential beta–binomial updating gives the same posterior as batch updating.
---answer---
Each success adds 1 to $\alpha$ and each failure adds 1 to $\beta$. After all trials the posterior is $\operatorname{Beta}(\alpha+k,\ \beta+n-k)$, whatever the order.
:::

::: exercise
A miss costs 9 and a false alarm 1. Find the posterior threshold for acting "present".
---answer---
$1/(1+9)=0.1$.
:::

::: exercise
With the costs of the previous exercise and $P(H_1)=0.1$, find the likelihood-ratio threshold.
---answer---
$\mathrm{LR}>(1/9)\times(0.9/0.1)=1$.
:::

::: exercise
Forecasts of 0.9 come true 70% of the time. Is the forecaster over- or underconfident? What would temperature scaling do?
---answer---
Overconfident (stated 0.9, realised 0.7). Temperature scaling with $T>1$ divides the log-odds and pulls the forecasts towards 0.5, without changing their order.
:::

::: exercise
*(Challenge.)* Show that the posterior mean of the beta–binomial model is a weighted average of the prior mean and the MLE, and give the weights.
---answer---
$$\frac{\alpha+k}{\alpha+\beta+n}=\frac{\alpha+\beta}{\alpha+\beta+n}\cdot\frac{\alpha}{\alpha+\beta}+\frac{n}{\alpha+\beta+n}\cdot\frac kn.$$

The weights are proportional to the prior's pseudo-count $\alpha+\beta$ and to the number of trials $n$.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise that gives a second mouse the Bayesian treatment. Both open in Google Colab.

{{ colab: week5/lesson19/Lesson19_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week5/lesson19/Lesson19_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- J. K. Blitzstein and J. Hwang, *Introduction to Probability*, 2nd ed., CRC Press, 2019 (free online). Chapters 2 and 8.
- A. Gelman et al., *Bayesian Data Analysis*, 3rd ed., CRC Press, 2013 (free online). Chapters 1 and 2.
- J. I. Gold and M. N. Shadlen, "The neural basis of decision making", *Annual Review of Neuroscience* 30:535–574, 2007.
- D. C. Knill and A. Pouget, "The Bayesian brain", *Trends in Neurosciences* 27:712–719, 2004.
- C. Guo, G. Pleiss, Y. Sun and K. Q. Weinberger, "On calibration of modern neural networks", *ICML*, 2017.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The mini-lab data (released under CC0).
