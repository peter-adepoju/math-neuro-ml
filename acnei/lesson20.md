**Learning objectives**

- Distinguish the spread of data (SD) from the sampling variability of an estimate (SE); define bias and mean squared error
- Construct and interpret confidence intervals, and check their coverage by simulation
- Compute bootstrap standard errors and percentile intervals, resampling the right units
- Use covariance and correlation correctly: nonlinearity, outliers, confounding, partial correlation, signal and noise correlation
- Evaluate a decoder across all thresholds with ROC curves and AUC, and separate discrimination from calibration

**Before you start.** This reading is the mathematical companion to the Lesson 20 teaching notebook. You need Lesson 17 (expectation, variance, covariance, the variance of a sum), Lesson 18 (binomial, Poisson, the CLT) and Lesson 19 (calibration, the naive-Bayes decoder). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\theta$, $\hat\theta$ | a true quantity and its estimate from data |
| $\operatorname{bias}=\mathbb{E}[\hat\theta]-\theta$, $\operatorname{SE}=\sqrt{\operatorname{Var}(\hat\theta)}$ | the systematic and random error of an estimator |
| $\operatorname{MSE}=\mathbb{E}[(\hat\theta-\theta)^2]$ | mean squared error; RMSE $=\sqrt{\operatorname{MSE}}$ |
| $s$, $\bar x$ | the sample SD ($n-1$ divisor) and sample mean |
| $\hat\theta^{*}_b$, $b=1,\dots,B$ | the estimate recomputed on bootstrap resample $b$ |
| $r$, $\rho_{\text{S}}$ | Pearson and Spearman correlation |
| FA, hit, AUC | false-alarm rate, hit rate, area under the ROC curve |

## Sampling variability, bias and standard error

An estimate computed from data is a random variable: repeat the experiment and it changes. Its distribution over repeated experiments is the **sampling distribution**, and its SD is the **standard error**. The SD of the data does not shrink with more trials; the SE of the mean does.

**Interactive figure.** Left: the spike counts of one experiment with n trials (blue). Right: the means of 2000 such experiments (green). Slide or Play n: the data stay as spread out, while the means close in on the truth (black line).

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=20&ix=sd-se&t=Left%3A%20the%20spike%20counts%20of%20one%20experiment%20with%20n%20trials%20%28blue%29.)

**Why it is true: SE(x̄) = σ/√n and MSE = bias² + SE²**

For independent $x_i$ with variance $\sigma^2$, $\operatorname{Var}(\bar x)=\frac1{n^2}\sum_i\operatorname{Var}(x_i)=\sigma^2/n$ (Lesson 17: variances of independent variables add).

For any estimator, write $\hat\theta-\theta=(\hat\theta-\mathbb{E}\hat\theta)+(\mathbb{E}\hat\theta-\theta)$. Squaring and taking expectations, the cross term has mean 0, so $\operatorname{MSE}=\operatorname{SE}^2+\operatorname{bias}^2$.

For a proportion, $\operatorname{SE}(\hat p)=\sqrt{p(1-p)/n}$; for a difference of independent estimates, $\operatorname{SE}(\hat\theta_1-\hat\theta_2)=\sqrt{\operatorname{SE}_1^2+\operatorname{SE}_2^2}$.

**Two decoders.** Accuracies of 0.80 and 0.75, from 50 and 30 test trials, have SEs 0.057 and 0.080; the difference has SE 0.098, about twice the gap. Two equally good decoders tested this way show a gap of at least 0.05 in favour of one of them in 31% of comparisons.

**Estimating a rate from intervals** (true rate 20 spikes/s).

- From $n=5$ interspike intervals, $1/\bar T$ has bias $+5.05$ spikes/s: because $1/x$ is convex, $\mathbb{E}[1/\bar T]>1/\mathbb{E}[\bar T]$.
- $(n-1)/\sum T_i$ is unbiased (bias 0.04, SE 11.4).
- $\overline{1/T}$ has no finite mean, and its simulated mean grows with the number of simulations.

The bias of $1/\bar T$ shrinks like $1/n$ while its SE shrinks like $1/\sqrt n$, so for large $n$ the noise dominates. Similarly, the variance with divisor $n$ is biased by $-\sigma^2/n$ but has the smaller MSE.

## Confidence intervals and coverage

**Key point**

A 95% confidence interval is a **procedure** that, over repeated experiments, contains the true value 95% of the time: its **coverage**. A particular interval either contains $\theta$ or it does not. "95% probability that $\theta$ lies in this interval" is a statement about a Bayesian credible interval, and needs a prior (Lesson 19).

The usual interval $\hat\theta\pm1.96\,\operatorname{SE}$ relies on the CLT; check its coverage by simulation.

Coverage depends on the situation:

- The **Wald** interval for a proportion, $\hat p\pm1.96\sqrt{\hat p(1-\hat p)/n}$, has coverage 0.958 at $p=0.5$, $n=20$, but only 0.636 at $p=0.95$, $n=20$, because $\hat p=1$ (which is frequent) gives zero width.
- The **Wilson** interval inverts the test, using the SE at the candidate $p$:

  $$\frac{\hat p+\frac{z^2}{2n}\pm z\sqrt{\frac{\hat p(1-\hat p)}{n}+\frac{z^2}{4n^2}}}{1+z^2/n}.$$

  Its coverage is 0.926 at $p=0.95$, $n=20$, and it stays inside $[0,\ 1]$.
- Mean ± 1.96 SE for skewed (exponential) data with $n=15$ has coverage 0.889.

**Interactive figure.** Fifty simulated experiments, each with its 95% interval for a success probability: blue intervals cover the true value (black line), vermilion ones miss. Switch between the Wald and Wilson intervals and change p and n; the readout gives coverage over 4000 experiments.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=20&ix=coverage&t=Fifty%20simulated%20experiments%2C%20each%20with%20its%2095%25%20interval%20for%20a%E2%80%A6)

## The nonparametric bootstrap

**Key point**

Treat the sample as a stand-in for the population. Draw $B$ resamples of size $n$ **with replacement**, and recompute the estimate on each: $\hat\theta^*_1,\dots,\hat\theta^*_B$. Their SD estimates the SE; their 2.5th and 97.5th percentiles give a 95% **percentile interval**.

It needs no formula, so it works for medians, CVs, correlations, AUCs and Fano factors.

For 40 exponential interspike intervals, the bootstrap SE of the mean is 2.83 ms against the analytic 2.90. For the median, which has no simple SE formula, the bootstrap distribution is lumpy and asymmetric, and the percentile interval covered the true median in 95.0% of simulated experiments.

**Interactive figure.** The bootstrap distribution of the mean (sky blue) or median (green) of one sample of 40 interspike intervals. The vermilion line is the sample's own estimate, the dashed lines the 95% percentile interval. Press Play to watch the distribution build up resample by resample, or draw a new sample.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=20&ix=bootstrap&t=The%20bootstrap%20distribution%20of%20the%20mean%20%28sky%20blue%29%20or%20median%E2%80%A6)

**Common pitfall**

**Resample the independent units.** Bins within a trial, trials within a neuron and neurons within a mouse are dependent. Resampling the lower level as if it were independent understates the SE (in the exercise notebook, by a factor of about 2.3). Resample at the level your conclusion generalises over, with a hierarchical bootstrap for nested data.

The bootstrap also cannot show variability the sample does not contain: tiny samples, extremes, and quantities decided by a few observations give intervals that are too narrow.

## Covariance, correlation, confounding and nonlinearity

**Why it is true: Pearson's r and partial correlation**

$$r=\frac{\operatorname{Cov}(x,y)}{\sigma_x\sigma_y}=\frac1n\sum_iz_{x,i}\,z_{y,i},$$

the mean product of z-scores. $-1\le r\le1$ by the Cauchy–Schwarz inequality, with $\lvert r\rvert=1$ only for an exact straight line. Spearman's $\rho_{\text S}$ is Pearson's $r$ of the ranks.

The **partial correlation** given $z$ is the correlation of the residuals of $x$ and of $y$ after regressing each on $z$.

Four ways $r$ misleads, from the notebook:

- **Linear data:** $r=0.66$, a fair summary.
- **A tuning curve:** strong but symmetric dependence, $r=-0.09$.
- **30 unrelated points and one outlier:** $r=0.72$ ($-0.02$ without it; Spearman $-0.01$).
- **Two "neurons" that both respond to a stimulus but never interact:** pooled $r=0.70$; within each condition $-0.06$ and $-0.09$; partial correlation $-0.07$.

**Interactive figure.** Four data sets and their Pearson and Spearman correlations. In the outlier data, drag the black point and watch one observation create or destroy a correlation. In the shared-stimulus data, compare the pooled value with the values within each condition.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=20&ix=correlation&t=Four%20data%20sets%20and%20their%20Pearson%20and%20Spearman%20correlations.)

In neuroscience, a correlation pooled across stimuli mixes **signal correlation** (shared tuning) with **noise correlation** (shared trial-to-trial variability at a fixed stimulus).

## ROC curves and AUC

For a score $s$ and a threshold $t$, plot $(\text{FA},\ \text{hit})=\big(P(s\ge t\mid\text{absent}),\ P(s\ge t\mid\text{present})\big)$ for every $t$: the **ROC curve**. Its area is the **AUC**: 0.5 for chance, 1 for perfect ranking.

**Why it is true: AUC = P(s₁ > s₀)**

Lower the threshold past the scores one at a time. Passing a present-trial score raises the hit rate by $1/n_1$. Passing an absent-trial score moves right by $1/n_0$, adding a strip whose height is the current hit rate: the fraction of present trials scored above that absent trial.

Summing the strips gives the fraction of (present, absent) pairs ranked correctly, with ties counting ½: the Mann–Whitney statistic. Hence the area equals $P(s_1>s_0)+\tfrac12P(s_1=s_0)$.

**Interactive figure.** Left: decoder scores on absent (blue) and present (orange) trials, and a threshold (dashed). Right: the ROC curve (green) and the current threshold's point (black). Change the separation, threshold and base rate: the AUC follows the separation only, while accuracy depends on all three.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=20&ix=roc&t=Left%3A%20decoder%20scores%20on%20absent%20%28blue%29%20and%20present%20%28orange%29%20trials%2C%E2%80%A6)

Consequences:

- AUC is unchanged by any increasing transformation of the score: it depends only on the ranking.
- It does not depend on the base rate, because hit and false-alarm rates are each computed within one class.
- It ignores calibration entirely.

In the notebook, AUC is 0.786 for a weak and 0.962 for a strong stimulus. Changing the base rate from 0.29 to 0.57 leaves AUC at 0.96, but changes the accuracy at a fixed threshold from 0.907 to 0.879.

## Dispersion checks with error bars

A Fano factor from few trials is noisy: its SE is about 0.5 from 8 Poisson trials. Two different intervals answer two questions:

- a **bootstrap interval** (resampling trials) says how precisely this neuron's Fano factor is known;
- a **Poisson null range** (Fano factors from simulated Poisson neurons with the same mean and trial count) says what chance alone produces.

A claim of super- or sub-Poisson variability needs the second; the size of the effect is reported with the first.

## Mini-lab: error bars on earlier conclusions

**Decoders** (Steinmetz et al., 2019, session 11; Lesson 19's split, 170 test trials). AUC of the summed VISp count: 0.963 [95% bootstrap 0.937, 0.984]. Naive-Bayes decoder: 0.999 [0.996, 1.000]. Paired difference: 0.035 [0.016, 0.061].

Resampling the same test trials for both decoders (a **paired** bootstrap) cancels the trial-to-trial difficulty they share. The naive-Bayes decoder ranks trials almost perfectly, although Lesson 19 showed its probabilities are badly miscalibrated: AUC and calibration measure different things.

**Signal and noise correlation** (neurons 141 and 190). Pooled over 340 trials, $r=0.791$ [0.747, 0.831], mostly shared tuning to the right grating. Within conditions it is much smaller: 0.162 [0.006, 0.369] with no right grating (167 trials) and 0.374 [0.167, 0.570] at right contrast 1 (73 trials). The partial correlation after removing the right-contrast means is 0.317 [0.193, 0.434]: a real noise correlation, smaller than the pooled value suggests.

**Dispersion.** The median Fano factor of 162 neurons on blank trials, 1.50 (Lesson 17), has a 95% interval of [1.41, 1.56] when resampling trials and [1.41, 1.61] when resampling neurons: well above 1 whichever level is resampled.

![Left: counts of two VISp neurons with no right grating (green) and at right contrast 1 (vermilion), jittered. Right: bootstrap distributions of the median Fano factor, resampling trials (blue) and resampling neurons (pink, dashed).](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson20/cell027_1.svg)
*Left: counts of two VISp neurons with no right grating (green) and at right contrast 1 (vermilion), jittered. Right: bootstrap distributions of the median Fano factor, resampling trials (blue) and resampling neurons (pink, dashed).*

## Where this appears in neuroscience and machine learning

**Neuroscience.** Error bars on tuning curves and psychometric functions; choice probability and detect probability (AUCs between a neuron's responses on two kinds of trial); signal and noise correlations; hierarchical bootstraps for nested data (trials, neurons, animals); the effective sample size in recordings with slow drifts.

**Machine learning.** Confidence intervals for test accuracy and AUC; paired comparisons of models on the same test set; bootstrap and cross-validation estimates of generalisation; ROC and precision–recall curves for imbalanced problems; feature correlation and confounding ("shortcut learning").

**Common pitfall**

**Common mistakes to avoid.**

- **Error bars without a definition**: say whether they are SD, SE or CI, and over what units.
- **Reading a 95% CI as a 95% probability** that the true value is inside.
- **Resampling dependent units** (bins, or trials pooled across animals) as if they were independent.
- **Reading $r\approx0$ as "no relationship"**, or a pooled $r$ as a direct interaction.
- **Comparing two models with unpaired intervals** when both were tested on the same trials.
- **Treating a high AUC as calibrated probabilities.**

## Lesson summary

- An estimate has a sampling distribution: bias is its offset and SE its spread, with $\operatorname{MSE}=\operatorname{bias}^2+\operatorname{SE}^2$ and $\operatorname{SE}(\bar x)=\sigma/\sqrt n$.
- A 95% CI covers the truth in 95% of repeated experiments if its assumptions hold; check by simulation (Wald fails near 0 and 1).
- The bootstrap resamples the independent units with replacement; its SD is an SE and its percentiles give an interval.
- Correlation is linear, and sensitive to outliers and to shared drivers; condition on, or regress out, the confounder.
- AUC $=P(s_1>s_0)$: rank-based, free of the base rate, blind to calibration.

## Further reading

- B. Efron and R. J. Tibshirani, *An Introduction to the Bootstrap*, Chapman & Hall, 1993. Chapters 1–6 and 13.
- L. D. Brown, T. T. Cai and A. DasGupta, "Interval estimation for a binomial proportion", *Statistical Science* 16:101–133, 2001.
- M. R. Cohen and A. Kohn, "Measuring and interpreting neuronal correlations", *Nature Neuroscience* 14:811–819, 2011.
- V. Saravanan, G. J. Berman and S. J. Sober, "Application of the hierarchical bootstrap to multi-level data in neuroscience", *Neurons, Behavior, Data analysis and Theory* 3(5), 2020.
- T. Fawcett, "An introduction to ROC analysis", *Pattern Recognition Letters* 27:861–874, 2006.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The mini-lab data (released under CC0).
