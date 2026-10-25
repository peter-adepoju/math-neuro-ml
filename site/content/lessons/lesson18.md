---
summary: "Three models for neural data: the binomial for yes/no trials, the Poisson for counts, the Gaussian and the central limit theorem for sums; likelihood, maximum-likelihood estimates and standard errors from curvature; checking a fit by simulating it; and a mouse's choices and motor-cortex counts put to the test."
---

::: objectives
- Derive the binomial distribution from independent Bernoulli trials, with its mean and variance, and recognise when its assumptions fail
- Obtain the Poisson distribution as the limit of many rare chances; use rate × interval, mean = variance and interval scaling
- Work with Gaussians through standardisation, and state the central limit theorem and its conditions
- Write down a likelihood, find maximum-likelihood estimates for the three models, and get standard errors from the curvature
- Check a fitted model against simulations of itself, and read the result
:::

**Before you start.** This reading is the mathematical companion to the Lesson 18 teaching notebook. You need Lesson 17 (PMF, PDF, expectation, variance of sums, Fano factor) and Lesson 11 (derivatives at a maximum, Taylor expansion). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Model | PMF or PDF | Mean | Variance | Arises from |
|---|---|---|---|---|
| Bernoulli($p$) | $P(1)=p$ | $p$ | $p(1-p)$ | one yes/no trial |
| Binomial($n,p$) | $\binom nkp^k(1-p)^{n-k}$ | $np$ | $np(1-p)$ | $n$ independent trials with the same $p$ |
| Poisson($\lambda$) | $\lambda^ke^{-\lambda}/k!$ | $\lambda$ | $\lambda$ | many rare independent chances; $\lambda=rw$ |
| $\mathcal N(\mu,\sigma^2)$ | $\frac1{\sigma\sqrt{2\pi}}e^{-(x-\mu)^2/2\sigma^2}$ | $\mu$ | $\sigma^2$ | sums of many independent terms |

## Bernoulli trials and the binomial

A guessing mouse scores at least 9 of 10 with probability $\big(\binom{10}{9}+\binom{10}{10}\big)/2^{10}=11/1024\approx0.011$, and at least 42 of 49 with probability $1.8\times10^{-7}$.

::: note Why it is true: the binomial PMF, mean and variance
Each sequence of $n$ independent trials with $k$ successes has probability $p^k(1-p)^{n-k}$, and $\binom nk$ sequences have $k$ successes.

$K=\sum_iB_i$ with independent Bernoulli $B_i$ ($\mathbb{E}[B_i]=p$, $\operatorname{Var}(B_i)=p-p^2$), so $\mathbb{E}[K]=np$ and $\operatorname{Var}(K)=np(1-p)$. The Fano factor $1-p$ is below 1.
:::

::: keypoint
The binomial needs a fixed $n$, independence and the same $p$ on every trial. If $p$ varies across trials, the law of total variance adds $\operatorname{Var}(\mathbb{E}[K\mid p])$. In the notebook's quantal synapse ($n=10$, mean $p=0.3$) the variance rises from 2.0 with a fixed $p$ to 5.3 with the same mean.
:::

{{ interactive: binomial | Quantal release at ten sites. Blue: Binomial(10, p). Vermilion: the same average p, but varying from one action potential to the next by the chosen spread. Slide p, or press Play. }}

::: quiz
? $K\sim\text{Binomial}(5,\ 0.2)$. What is $P(K=0)$?
- [x] $0.8^5\approx0.328$
- [ ] $0.2^5\approx0.0003$
- [ ] $1-0.2\times5=0$
> No success in five independent trials: $(1-p)^5=0.8^5=0.328$.
:::

## The Poisson distribution

::: note Why it is true: the Poisson as a limit of binomials
Split a window $w$ into $n$ bins, each with spike probability $\lambda/n$ ($\lambda=rw$). Then

$$\binom nk\Big(\frac\lambda n\Big)^k\Big(1-\frac\lambda n\Big)^{n-k}=\underbrace{\frac{n(n-1)\cdots(n-k+1)}{n^k}}_{\to1}\,\frac{\lambda^k}{k!}\,\underbrace{\Big(1-\frac\lambda n\Big)^n}_{\to e^{-\lambda}}\underbrace{\Big(1-\frac\lambda n\Big)^{-k}}_{\to1}\to\frac{\lambda^ke^{-\lambda}}{k!}.$$

The binomial variance $\lambda(1-\lambda/n)\to\lambda$: mean = variance.
:::

The total variation distance between Binomial($n,\ 4/n$) and Poisson(4) is 0.40 for $n=5$, 0.056 for $n=20$ and 0.005 for $n=200$.

{{ interactive: poisson-limit | Binomial(n, λ/n) (orange) against Poisson(λ) (blue). Slide or Play the number of bins: with many rare chances the two become indistinguishable. }}

::: keypoint
- **Rate × interval:** $\lambda=rw$.
- **Interval scaling:** the mean and the variance both grow in proportion to $w$, so the Fano factor is 1 at every window.
- **Sums** of independent Poisson counts are Poisson.
- **Intervals** are exponential: $P(T>t)=P(N(t)=0)=e^{-rt}$, with mean $1/r$ and CV 1.

A simulated 20 spikes/s process gives Fano factors of 0.999–1.018 from 10 ms to 1 s, and $P(T>100\text{ ms})=0.133$ ($e^{-2}=0.135$).
:::

The Poisson assumes a constant rate and independence. Refractoriness breaks independence (Fano factor below 1 at short windows); rate changes break constancy (Fano factor above 1 at long windows).

::: quiz
? A Poisson neuron fires at 20 spikes/s. What is the probability of no spike in a 150 ms window?
- [ ] 0.15
- [x] $e^{-3}\approx0.050$
- [ ] $e^{-20}$
> $\lambda=rw=20\times0.15=3$, and $P(N=0)=e^{-\lambda}=e^{-3}\approx0.050$.
:::

## The Gaussian and the central limit theorem

::: definition Definition: the Gaussian and standardisation
$X\sim\mathcal N(\mu,\sigma^2)$ has location $\mu$ and scale $\sigma$. Then $Z=(X-\mu)/\sigma\sim\mathcal N(0,1)$, and $P(X\le x)=\Phi\big((x-\mu)/\sigma\big)$, with $\Phi$ computed numerically. 68.3%, 95.0% and 99.7% of the probability lie within 1, 1.96 and 3 SDs.
:::

For a membrane potential $V\sim\mathcal N(-65\text{ mV},\ (4\text{ mV})^2)$: $P(V>-55\text{ mV})=P(Z>2.5)=0.0062$, and 95% of values lie in $[-72.8,\ -57.2]$ mV.

{{ interactive: gaussian | A Gaussian membrane potential. The vermilion area is the probability of exceeding the threshold; dashed lines bound the central 95%. Change the mean, SD and threshold, or press Play to sweep the SD. }}

::: keypoint
**The central limit theorem.** For independent, identically distributed $X_i$ with mean $\mu$ and finite variance $\sigma^2$,

$$\sum_{i=1}^nX_i\approx\mathcal N(n\mu,\ n\sigma^2)\quad\text{and}\quad\frac{\bar X-\mu}{\sigma/\sqrt n}\approx\mathcal N(0,1)\quad\text{for large } n.$$

The skewness of the sum falls like $1/\sqrt n$: for exponential intervals 2.05, 0.90 and 0.29 at $n=1$, 5 and 50. Poisson($\lambda$) and Binomial($n,p$) look Gaussian when $\lambda$ or $np(1-p)$ is large. The CLT needs independence (or weak dependence).
:::

{{ interactive: clt | Standardised sums of n exponential intervals (sky blue) against the standard normal density (vermilion). Slide or Play n. }}

## Likelihood and parameter estimation

::: definition Definition: likelihood and maximum likelihood
The **likelihood** is $L(\theta)=P(\text{data}\mid\theta)$, read as a function of $\theta$. For independent observations, $\ell(\theta)=\log L(\theta)=\sum_i\log P(x_i\mid\theta)$. The **maximum-likelihood estimate** (MLE) $\hat\theta$ maximises $\ell$.

The likelihood is not a probability distribution over $\theta$; Bayes' rule (Lesson 19) makes one.
:::

::: note Why it is true: three MLEs
**Binomial.** $\ell(p)=k\log p+(n-k)\log(1-p)+c$ and $\ell'(p)=k/p-(n-k)/(1-p)=0$ give $\hat p=k/n$.

**Poisson.** $\ell(\lambda)=\sum_i(x_i\log\lambda-\lambda-\log x_i!)$ and $\ell'=\sum x_i/\lambda-m=0$ give $\hat\lambda=\bar x$.

**Gaussian.** $\hat\mu=\bar x$ and $\hat\sigma^2=\frac1m\sum(x_i-\bar x)^2$ (divisor $m$, slightly biased).
:::

::: note Why it is true: standard error from curvature
Near $\hat\theta$, $\ell(\theta)\approx\ell(\hat\theta)+\frac12\ell''(\hat\theta)(\theta-\hat\theta)^2$: a Gaussian-shaped likelihood with SD $1/\sqrt{-\ell''(\hat\theta)}$.

**Binomial:** $-\ell''(\hat p)=n/(\hat p(1-\hat p))$, so $\operatorname{SE}=\sqrt{\hat p(1-\hat p)/n}$. **Poisson:** $-\ell''(\hat\lambda)=m/\hat\lambda$, so $\operatorname{SE}=\sqrt{\hat\lambda/m}$.
:::

{{ interactive: likelihood | The binomial log-likelihood (blue) for k successes in n trials, with its quadratic approximation at the peak (vermilion dashed). The black bar is ±1 standard error. Switch between 10, 100 and 1000 trials. }}

In the notebook, 7/10, 70/100 and 700/1000 all give $\hat p=0.7$, with SE 0.145, 0.046 and 0.014. For 40 Poisson counts the grid maximum equals the sample mean (3.55), and the curvature SE equals $\sqrt{\hat\lambda/m}=0.298$. Across 20,000 repeated experiments the SD of $\hat p$ (100 trials) is 0.0459 against 0.0458, and of $\hat\lambda$ (40 trials) 0.282 against 0.283.

::: quiz
? A mouse is correct on 18 of 24 trials. What is the standard error of $\hat p$?
- [ ] 0.75
- [x] about 0.088
- [ ] about 0.031
> $\hat p=0.75$ and $\operatorname{SE}=\sqrt{0.75\times0.25/24}\approx0.088$.
:::

## Checking the fit

Maximum likelihood finds the best member of a family; it never says whether the family fits. Check a property the model forces but was not fitted to (for a Poisson: variance = mean, and $P(0)=e^{-\lambda}$), and compare it with **simulations of the fitted model at the same sample size**. For Gaussian models, a **QQ plot** plots the sorted standardised data against $\Phi^{-1}((i-0.5)/n)$.

{{ interactive: poisson-check | 200 trials of counts with mean 4 (orange bars) and the Poisson fitted to them (black). Raise the trial-to-trial variability of the rate: the mean still fits, but the observed variance leaves the range that 300 simulations of the fitted model produce. }}

In the notebook, 200 Poisson counts have variance 3.7, inside the fitted model's 95% range of 3.2–4.9. Counts whose rate varies across trials (gamma–Poisson, mean 4) have variance 14.2 and 10% zeros, against at most 4% under the fitted Poisson: the mean fits, the variability does not.

## Mini-lab: fitting models to a mouse's choices and its motor cortex

**A. Binomial choices** (Steinmetz et al., 2019, session 11). At each contrast difference $c=c_R-c_L$, the right turns among turn trials are Binomial($n_c,\ p_c$). The mouse turns towards the higher contrast at every non-zero $c$. At $c=0$ it turns right on 62% of 76 turns (SE 0.056): a rightward bias about 2.1 SE above 0.5.

{{ interactive: psychometric | The mouse's psychometric function: right-turn proportions with ±1.96 SE bars and trial counts. Step through the levels, and compare one p per level with a single p for all levels (vermilion). }}

The one-$p$ model is worse than the per-level model by 98 log-likelihood units. On the hardest unequal trials ($\lvert c\rvert=0.25$) the mouse is correct 42 of 49 times ($P=1.8\times10^{-7}$ under guessing). At $c=\pm1$ and $-0.75$ every choice went one way, so $\hat p$ is 0 or 1 and the formula gives $\operatorname{SE}=0$: the curvature argument fails at the boundary.

**B. Poisson counts** (Steinmetz et al., 2019, session 10: 447 neurons in primary motor cortex, 342 trials of fifty 50 ms bins). Three of the four highest-rate neurons (34–68 spikes/s) are **over**-dispersed already in 50 ms bins (Fano factors 1.6–2.9).

- The highest-rate one, neuron 434, has far more empty bins than a Poisson with its mean (24% against 3.4%) and far more full ones (12% of bins with 8 or more spikes, against 2.3%). It is nearly silent while the wheel is still and fires fast while it turns, so its counts mix two rates.
- Neuron 433 is under-dispersed (Fano factor 0.63), the signature of refractoriness.
- The mean count scales exactly with the window (67.8 spikes/s at every window), but the Fano factor grows with it, to 35 for neuron 434 over a whole 2.5 s trial: the count over a long window depends on how much the mouse moved.

On 2000 bins, the observed variance (10.2) lies far above the fitted Poisson's 95% range (3.2–3.7).

{{ figure: cell031_1.svg | Motor-cortex counts. Left: neuron 434's counts per 50 ms (blue) against the Poisson with the same mean (black). Middle: mean count against window for four neurons, a slope-1 line on log axes. Right: their Fano factors grow with the window, unlike a Poisson's. }}

**C. When sums become Gaussian.** Here neither sum does. One neuron's counts summed over 1.25 s stay skewed (skewness 0.74 at 50 ms, 0.71 at 1.25 s): within a trial the neuron is mostly at rest or mostly moving, so the 25 terms are not independent draws from one distribution. The summed count of all 447 neurons per 50 ms is bimodal (rest and movement) and far from Gaussian: the neurons rise and fall together (population variance 2457 against a sum of individual variances of 129), so the CLT's independence condition fails.

{{ figure: cell033_1.svg | Left: QQ plots of summed counts against the standard normal; a Gaussian would follow the line. Right: the bimodal distribution of the summed population count (vermilion) against a Gaussian with the same mean and SD (black). }}

::: pitfall
Choices are pooled over the session, turn trials only, with no smooth psychometric curve fitted. Counts come from high-rate neurons only, with the movement ignored; a speed-dependent rate, as in Lesson 12's Poisson model, is the natural next model.
:::

## Where this appears in neuroscience and machine learning

**Neuroscience.** Choices and psychometric functions are binomial; quantal synaptic release is analysed with variance–mean methods; spike counts, miniature events and photon counts are modelled as Poisson; membrane-potential noise and trial averages as Gaussian (by the CLT). Tuning curves and GLMs are fitted by maximum likelihood, and Fano factors serve as a Poisson check.

**Machine learning.** Cross-entropy is the negative Bernoulli log-likelihood, and mean squared error is the negative Gaussian log-likelihood (up to constants), so least squares (Lesson 5) is maximum likelihood under Gaussian noise. Poisson regression handles counts. Accuracy on $n$ test examples is binomial, with $\operatorname{SE}=\sqrt{\hat p(1-\hat p)/n}$. Posterior predictive and calibration checks generalise the simulation check.

::: pitfall
**Common mistakes to avoid.**

- **Assuming spike counts are Poisson** without checking the variance against the mean (both directions of failure occur).
- **Forgetting the binomial's assumptions**: a fixed $n$, independence, the same $p$.
- **Applying the CLT to dependent terms**, or to small, skewed counts.
- **Treating the likelihood as a probability distribution over the parameter.**
- **Quoting SE = 0 when $\hat p$ is 0 or 1.**
- **Equating "fitted" with "fits"**: maximum likelihood always returns an answer.
:::

## Lesson summary

- Binomial: $n$ independent trials with the same $p$; mean $np$, variance $np(1-p)$; a varying $p$ inflates the variance.
- Poisson: the limit of many rare chances; $\lambda=rw$; mean = variance at every window; exponential intervals.
- Gaussian: location and scale; standardise to use $\Phi$; the CLT makes sums of many independent terms Gaussian.
- Likelihood: $\ell(\theta)=\sum\log P(x_i\mid\theta)$; the MLEs are $k/n$, $\bar x$ and $(\bar x,\hat\sigma^2)$; $\operatorname{SE}\approx1/\sqrt{-\ell''}$.
- Check fits by simulating the fitted model at the same sample size; real spike counts fail the Poisson in both directions.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
$K\sim\text{Binomial}(5,\ 0.2)$. Find $P(K=0)$, $P(K=1)$, $\mathbb{E}[K]$ and $\operatorname{Var}(K)$.
---answer---
$P(K=0)=0.8^5=0.328$; $P(K=1)=5\times0.2\times0.8^4=0.410$; $\mathbb{E}[K]=1$; $\operatorname{Var}(K)=0.8$.
:::

::: exercise
A guessing subject answers 10 two-choice trials. Find $P(\text{at least 8 correct})$.
---answer---
$\big(\binom{10}8+\binom{10}9+\binom{10}{10}\big)/1024=(45+10+1)/1024=0.055$.
:::

::: exercise
A neuron fires at 20 spikes/s (Poisson). In a 150 ms window, find $P(N=0)$, $P(N=1)$ and $P(N\ge2)$.
---answer---
$\lambda=3$: $P(N=0)=e^{-3}=0.050$; $P(N=1)=3e^{-3}=0.149$; $P(N\ge2)=1-4e^{-3}=0.801$.
:::

::: exercise
A Poisson neuron fires at 10 spikes/s. Find $P(\text{no spike in 200 ms})$ and the mean interval.
---answer---
$e^{-10\times0.2}=e^{-2}=0.135$; the mean interval is $1/r=100$ ms.
:::

::: exercise
Independent Poisson counts with means 2 and 3 are added. What is the distribution of the sum, and its variance?
---answer---
Poisson(5), with variance 5.
:::

::: exercise
$V\sim\mathcal N(-65,\ 5^2)$ mV. Find $P(V>-55)$ and $P(-70<V<-60)$.
---answer---
$P(Z>2)=0.023$ and $P(-1<Z<1)=0.683$.
:::

::: exercise
Intervals have mean 50 ms and SD 50 ms. Approximate the distribution of the mean of 100 intervals, and $P(\text{mean}>60\text{ ms})$.
---answer---
By the CLT, approximately $\mathcal N\big(50,\ (50/\sqrt{100})^2\big)=\mathcal N(50,\ 5^2)$, so $P(\text{mean}>60)=P(Z>2)=0.023$.
:::

::: exercise
A mouse is correct on 18 of 24 trials. Give $\hat p$ and its SE.
---answer---
$\hat p=0.75$ and $\operatorname{SE}=\sqrt{0.75\times0.25/24}=0.088$.
:::

::: exercise
Counts $3,5,2,4,6$ are modelled as Poisson. Give $\hat\lambda$ and its SE.
---answer---
$\hat\lambda=\bar x=4$ and $\operatorname{SE}=\sqrt{4/5}=0.89$.
:::

::: exercise
Derive the binomial MLE and its SE from the log-likelihood.
---answer---
**MLE.** $\ell(p)=k\log p+(n-k)\log(1-p)+c$, and $\ell'=k/p-(n-k)/(1-p)=0$ gives $\hat p=k/n$.

**SE.** $\ell''=-k/p^2-(n-k)/(1-p)^2$, which at $\hat p$ equals $-n/(\hat p(1-\hat p))$, so $\operatorname{SE}=\sqrt{\hat p(1-\hat p)/n}$.
:::

::: exercise
Counts over 500 trials have mean 5 and variance 2.5. Is a Poisson model plausible? Explain.
---answer---
No. The Fano factor is 0.5. With 500 Poisson(5) counts the sample variance is about $5\pm0.33$ (the SD of the sample variance is about $\sqrt{(\lambda+2\lambda^2)/m}$), so 2.5 is far outside. The counts are under-dispersed: more regular than Poisson.
:::

::: exercise
*(Challenge.)* Show that the sum of independent Poisson($\lambda_1$) and Poisson($\lambda_2$) counts is Poisson($\lambda_1+\lambda_2$).
---answer---
$$P(N_1+N_2=k)=\sum_{j=0}^k\frac{\lambda_1^je^{-\lambda_1}}{j!}\frac{\lambda_2^{k-j}e^{-\lambda_2}}{(k-j)!}=\frac{e^{-(\lambda_1+\lambda_2)}}{k!}\sum_j\binom kj\lambda_1^j\lambda_2^{k-j}=\frac{(\lambda_1+\lambda_2)^ke^{-(\lambda_1+\lambda_2)}}{k!},$$

by the binomial theorem.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise on a second mouse's choices and counts. Both open in Google Colab.

{{ colab: week5/lesson18/Lesson18_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week5/lesson18/Lesson18_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- J. K. Blitzstein and J. Hwang, *Introduction to Probability*, 2nd ed., CRC Press, 2019 (free online). Chapters 3–5 and 10.
- P. Dayan and L. F. Abbott, *Theoretical Neuroscience*, MIT Press, 2001. Chapter 1.
- J. del Castillo and B. Katz, "Quantal components of the end-plate potential", *Journal of Physiology* 124:560–573, 1954.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The mini-lab data (released under CC0).
