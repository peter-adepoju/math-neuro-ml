**Learning objectives**

- Describe a random variable by its PMF (discrete), PDF (continuous) and CDF, and compute probabilities of ranges from them
- Compute expectations, variances, standard deviations and moments, and recognise when $\mathbb{E}[g(X)]\ne g(\mathbb{E}[X])$
- Apply linear and nonlinear transformations, including unit changes and standardisation
- Use covariance to compute the variance of a sum, and explain why shared variability limits population averaging
- Measure spiking variability with the CV of interspike intervals and the Fano factor of spike counts, and interpret both correctly
- Quantify sampling variability: the standard error of a mean and the spread of estimated CVs and Fano factors

**Before you start.** This reading is the mathematical companion to the Lesson 17 teaching notebook. You need Lesson 16 (events, conditional probability), Lesson 13 (integrals, the Fundamental Theorem) and Lesson 7 (covariance matrices). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $X$, $x$ | a random variable; a value it can take |
| $p_X(k)=P(X=k)$ | the probability mass function (discrete $X$) |
| $f_X(x)$ | the probability density function (continuous $X$); units 1/(units of $x$) |
| $F_X(x)=P(X\le x)$ | the cumulative distribution function |
| $\mu=\mathbb{E}[X]$, $\sigma^2=\operatorname{Var}(X)$, $\sigma=\operatorname{SD}(X)$ | mean, variance, standard deviation |
| $\operatorname{Cov}(X,Y)$, $\rho$ | covariance; correlation $\operatorname{Cov}/(\sigma_X\sigma_Y)$ |
| $T$, $N(w)$ | an interspike interval; the spike count in a window of length $w$ |
| $\mathrm{CV}=\operatorname{SD}(T)/\mathbb{E}[T]$, $\mathrm{FF}=\operatorname{Var}(N)/\mathbb{E}[N]$ | coefficient of variation; Fano factor |

## Random variables, PMFs and CDFs

Counts $A=(3,5,4,4,4)$ and $B=(0,9,1,8,2)$ both have a mean of 4 spikes per 200 ms, but sample variances 0.5 and 17.5, and Fano factors 0.125 and 4.4. A mean alone cannot tell a regular neuron from a bursty one.

**Definition: random variable, PMF and CDF**

A **random variable** assigns a number to each outcome. A discrete $X$ has a **PMF** $p_X(k)=P(X=k)\ge0$ with $\sum_kp_X(k)=1$.

Every random variable has a **CDF** $F_X(x)=P(X\le x)$, which never decreases, rises from 0 to 1, and gives $P(a<X\le b)=F_X(b)-F_X(a)$. The $q$-quantile is the smallest $x$ with $F_X(x)\ge q$; the median is the 0.5-quantile.

For a discrete variable the CDF is a step function, defined between the possible values too, with jumps $p_X(k)=F_X(k)-F_X(k-1)$. For vesicle release with PMF $(0.24,\ 0.41,\ 0.26,\ 0.08,\ 0.01)$ on $k=0,\dots,4$: $F=(0.24,\ 0.65,\ 0.91,\ 0.99,\ 1)$, $P(X\ge2)=0.35$ and the median is 1.

**Interactive figure.** The number of vesicles released by one action potential: its PMF (left) and CDF (right). Set a and b: the highlighted bars add up to P(a < X ≤ b), which is also the rise of the CDF between a and b (vermilion).

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=17&ix=pmf-cdf&t=The%20number%20of%20vesicles%20released%20by%20one%20action%20potential%3A%20its%20PMF%E2%80%A6)

The **empirical CDF**, the fraction of observations at or below $x$, summarises a sample without any choice of bins.

## Continuous variables, densities and CDFs

**Definition: probability density function**

A continuous $X$ has $P(X=x)=0$ for every single $x$; probabilities of intervals come from a density $f_X\ge0$:

$$P(a<X\le b)=\int_a^bf_X(x)\,dx=F_X(b)-F_X(a),\qquad \int_{-\infty}^{\infty}f_X(x)\,dx=1,\qquad f_X=F_X'.$$

**Example.** An interval density with a refractory period $\tau=2$ ms and hazard $\lambda=0.05$ per ms: $f(t)=\lambda e^{-\lambda(t-\tau)}$ and $F(t)=1-e^{-\lambda(t-\tau)}$ for $t\ge\tau$, zero below. Then $P(5<T\le20)=0.45$, and the median is $\tau+\ln2/\lambda=15.9$ ms.

**Interactive figure.** The refractory interval density. The orange area is the probability that an interval falls between a and b; the dashed line marks the median. Change the hazard and the refractory period, or press Play to sweep the hazard.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=17&ix=isi-density&t=The%20refractory%20interval%20density.)

**Key point**

A density is not a probability. Its units are 1/(units of $x$), and it can exceed 1: the same density peaks at 0.05 per ms, which is 50 per s. Only areas are probabilities.

A histogram estimates a density only when it is normalised to area 1 (`density=True`: height = count / ($n$ × bin width)).

## Expectation, variance and moments

**Definition: expectation and variance**

$\mathbb{E}[X]=\sum_kk\,p_X(k)$ or $\int x\,f_X(x)\,dx$, and $\mathbb{E}[g(X)]=\sum_kg(k)p_X(k)$ or $\int g(x)f_X(x)\,dx$.

$\operatorname{Var}(X)=\mathbb{E}[(X-\mu)^2]$ and $\operatorname{SD}(X)=\sqrt{\operatorname{Var}(X)}$. The $m$-th moment is $\mathbb{E}[X^m]$; the skewness is $\mathbb{E}[(X-\mu)^3]/\sigma^3$.

**Why it is true: the shortcut formula**

Expanding and using linearity, $\mathbb{E}[(X-\mu)^2]=\mathbb{E}[X^2]-2\mu\mathbb{E}[X]+\mu^2=\mathbb{E}[X^2]-\mu^2$. It is exact, but numerically poor when $\mu\gg\sigma$ (a difference of two nearly equal large numbers), so software uses the centred form.

Expectation is **linear**: $\mathbb{E}[aX+bY+c]=a\mathbb{E}[X]+b\mathbb{E}[Y]+c$, always. But $\mathbb{E}[g(X)]\ne g(\mathbb{E}[X])$ for a nonlinear $g$; for a convex $g$, $\mathbb{E}[g(X)]\ge g(\mathbb{E}[X])$ (**Jensen's inequality**).

For the refractory intervals, $\mathbb{E}[T]=22$ ms, the SD is 20 ms and the skewness 2. The firing rate is $1/\mathbb{E}[T]=45.5$ spikes/s, but the mean "instantaneous rate" $\mathbb{E}[1/T]$ is 101 spikes/s.

**Interactive figure.** The rate 1/T against the interval T (blue). Intervals are 50 − d or 50 + d ms with equal probability. The midpoint of the chord (vermilion) is E[1/T]; the black dot is 1/E[T]. Slide or Play the spread.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=17&ix=jensen&t=The%20rate%201%2FT%20against%20the%20interval%20T%20%28blue%29.)

**From data.** The sample mean is $\bar x=\frac1n\sum x_i$ and the sample variance $s^2=\frac1{n-1}\sum(x_i-\bar x)^2$ (`ddof=1`); `np.var` divides by $n$ by default.

## Transformations and standardisation

**Key point**

If $Y=aX+b$, then $\mathbb{E}[Y]=a\mu+b$, $\operatorname{Var}(Y)=a^2\sigma^2$ and $\operatorname{SD}(Y)=\lvert a\rvert\sigma$. Counts in 200 ms windows times 5 give spikes/s: the mean is multiplied by 5 and the variance by 25.

The **z-score** $Z=(X-\mu)/\sigma$ is unitless, with mean 0 and SD 1. With data, compute $\mu$ and $\sigma$ on training data only.

**Why it is true: the CDF of an increasing transformation, and inverse-CDF sampling**

For an increasing $g$, $F_{g(X)}(y)=P(g(X)\le y)=P(X\le g^{-1}(y))=F_X(g^{-1}(y))$. So quantiles transform, $\text{median}(g(X))=g(\text{median}(X))$, but means do not.

If $U$ is uniform on $(0,1)$ and $X=F^{-1}(U)$, then $P(X\le x)=P(U\le F(x))=F(x)$: any distribution can be simulated from uniform numbers.

Log-transformed intervals compress the long tail and resolve bursts and refractoriness. In the notebook, the mean of $\log_{10}T$ is 1.18 while $\log_{10}$ of the mean is 1.34; the medians transform exactly.

![20,000 simulated intervals as a density on a linear axis (left: a long right tail, skewness about 2) and on a log axis (right: the tail compressed, short intervals resolved).](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson17/cell018_1.svg)
*20,000 simulated intervals as a density on a linear axis (left: a long right tail, skewness about 2) and on a log axis (right: the tail compressed, short intervals resolved).*

## Covariance and the variance of a sum

**Definition: covariance and correlation**

$\operatorname{Cov}(X,Y)=\mathbb{E}[(X-\mu_X)(Y-\mu_Y)]=\mathbb{E}[XY]-\mu_X\mu_Y$, and $\rho=\operatorname{Cov}(X,Y)/(\sigma_X\sigma_Y)\in[-1,\ 1]$.

Independence implies $\operatorname{Cov}=0$, but not the other way round: for $X$ symmetric about 0, $\operatorname{Cov}(X,X^2)=0$.

**Why it is true: the variance of a sum**

$$\operatorname{Var}\Big(\sum_iX_i\Big)=\mathbb{E}\Big[\Big(\sum_i(X_i-\mu_i)\Big)^2\Big]=\sum_i\sum_j\operatorname{Cov}(X_i,X_j)=\sum_i\operatorname{Var}(X_i)+\sum_{i\ne j}\operatorname{Cov}(X_i,X_j)=\mathbf 1^{\mathsf T}\boldsymbol\Sigma\mathbf 1.$$

For the average of $n$ neurons with variance $\sigma^2$ and pairwise covariance $c$: $\operatorname{Var}(\bar X)=\sigma^2/n+\frac{n-1}{n}c\to c$.

With 50 simulated neurons sharing a trial-by-trial gain (mean pairwise correlation 0.16), the 2450 covariances contribute 1983 spikes² to the variance of the summed count, against 245 from the variances. **Small noise correlations dominate population variability.**

**Interactive figure.** The variance of an average of n neurons, in units of σ², on log–log axes. Grey dashed: independent neurons. Blue: neurons with pairwise correlation c, which levels off at the floor c (vermilion). Set n and c, or press Play to sweep c.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=17&ix=population-floor&t=The%20variance%20of%20an%20average%20of%20n%20neurons%2C%20in%20units%20of%20%CF%83%C2%B2%2C%20on%E2%80%A6)

## Spiking variability: CV and Fano factor

**Definition: coefficient of variation and Fano factor**

$\mathrm{CV}=\operatorname{SD}(T)/\mathbb{E}[T]$ for interspike intervals, and $\mathrm{FF}(w)=\operatorname{Var}(N(w))/\mathbb{E}[N(w)]$ for spike counts in windows of length $w$. A Poisson process has $\mathrm{CV}=1$ and $\mathrm{FF}(w)=1$ for every $w$ (Lesson 18).

Values below 1 mean more regular than Poisson (refractoriness, steady drive); values above 1 mean more variable (bursts, rate fluctuations, shared changes of state). The Fano factor is unitless only for **counts**: computed on rates in spikes/s from windows of length $w$, it is multiplied by $1/w$.

For a **renewal** process (independent, identically distributed intervals), $\mathrm{FF}(w)\to\mathrm{CV}^2$ for long windows, since $\operatorname{Var}(N)\approx w\sigma_T^2/\mu_T^3$ and $\mathbb{E}[N]\approx w/\mu_T$.

**Interactive figure.** A renewal train at 20 spikes/s with gamma-distributed intervals of order k. Left: four 2-s stretches of the train. Right: the Fano factor against counting window (blue), with the Poisson value 1 (grey) and CV² (vermilion). Slide or Play through k, from bursty to regular.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=17&ix=cv-fano&t=A%20renewal%20train%20at%2020%20spikes%2Fs%20with%20gamma-distributed%20intervals%20of%E2%80%A6)

At 20 spikes/s, the Poisson train has CV 1.00 and FF ≈ 1 at all windows, and the gamma(5) train has CV 0.45 with FF falling to $0.18\approx\mathrm{CV}^2$ at 5 s. A bursty train in which short intervals follow short intervals is not renewal: with CV 2.13, its FF rises from 1.3 at 5 ms to 3.2, below $\mathrm{CV}^2=4.5$.

![Three simulated trains at the same rate, Poisson (blue), regular gamma of order 5 (vermilion) and bursty (green): rasters, interval densities on a log axis, and Fano factors against window.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson17/cell024_1.svg)
*Three simulated trains at the same rate, Poisson (blue), regular gamma of order 5 (vermilion) and bursty (green): rasters, interval densities on a log axis, and Fano factors against window.*

## Sampling variability

**Why it is true: the standard error of the mean, and the n − 1**

For independent $X_i$ with variance $\sigma^2$, $\operatorname{Var}(\sum_iX_i)=n\sigma^2$, so $\operatorname{Var}(\bar X)=\sigma^2/n$ and $\operatorname{SE}(\bar X)=\sigma/\sqrt n$: four times the data halves the error.

Deviations from the fitted $\bar X$ are slightly too small: $\mathbb{E}\big[\frac1n\sum(X_i-\bar X)^2\big]=\frac{n-1}n\sigma^2$, so the unbiased estimate divides by $n-1$.

Every estimate has a spread. For a Poisson neuron with a mean of 4 spikes, 95% of Fano factors estimated from 10 trials lie in $[0.31,\ 2.11]$, and from 100 trials in $[0.74,\ 1.30]$.

**Interactive figure.** Fano factors estimated from a Poisson neuron (mean 4 spikes, true value 1, black line), in 1500 simulated experiments. Vermilion lines bound the central 95%. Slide or Play the number of trials.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=17&ix=ff-spread&t=Fano%20factors%20estimated%20from%20a%20Poisson%20neuron%20%28mean%204%20spikes%2C%20true%E2%80%A6)

**Key point**

A single neuron's Fano factor of 1.4 from 20 trials is not evidence of super-Poisson variability; a whole population shifted above the null spread is.

## Mini-lab: how variable are real neurons?

**A. Motor-cortex spike trains at 10 ms resolution.** Four neurons in mouse primary motor cortex (Steinmetz et al., 2019; session 10, mouse Hench; data CC0), at the 75th, 90th, 95th and 99th percentiles of rate among 447 neurons, over 342 trials of 2.5 s. The file holds counts in 10 ms bins, so every interval is a multiple of 10 ms, and two spikes in one bin give "0 ms". Intervals are taken within trials.

- Neuron 332 fires 4.1 spikes/s, but its mean interval within trials is 42 ms ($1/\mathbb{E}[T]=24$ spikes/s). Intervals within trials sample only the bouts of activity, mostly during wheel turns, and miss the silences across trial boundaries. Rate $=1/\mathbb{E}[T]$ holds only for one unbroken recording.
- Medians are 20–30 ms, means 34–62 ms, CVs 1.3–1.9.
- 4–8% of intervals are 0 ms and 19–31% are 10 ms: the shortest intervals, which dominate $\mathbb{E}[1/T]$, are unresolved. Even without the 0 ms intervals, $\mathbb{E}[1/T]$ is about twice $1/\mathbb{E}[T]$ (51 against 24 spikes/s for neuron 332).
- The Fano factor is about 1 at 10 ms (0.89–1.03), 1.9–3.4 at 100 ms and 8–18 over a whole trial: rates change with the movement within and across trials. There is no single "Fano factor of the neuron".

![Four motor-cortex neurons: interval densities at 10 ms resolution (log scale), empirical CDFs, and Fano factors against window.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson17/cell033_1.svg)
*Four motor-cortex neurons: interval densities at 10 ms resolution (log scale), empirical CDFs, and Fano factors against window.*

**B. Trial-to-trial variability in a mouse.** The 108 no-grating trials of Steinmetz et al. (2019), session 11, with counts 50–250 ms after onset, for the 162 neurons with a mean of at least 1 spike. The median Fano factor is 1.50 (quartiles 1.15 and 2.17), and 86% are above 1, against a matched Poisson null with 95% range $[0.76,\ 1.29]$ and 47% above 1.

The summed count's variance (4555) is 6.3 times the sum of the individual variances (728): small positive covariances (mean 0.15 spikes²) dominate, and the population Fano factor is 10.5.

![Left: variance against mean count for 162 neurons on blank trials (log–log), with the Poisson line and its 95% range for 108 trials (grey band). Right: their Fano factors (blue) against Poisson neurons with the same means and trial count (black outline).](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson17/cell036_1.svg)
*Left: variance against mean count for 162 neurons on blank trials (log–log), with the Poisson line and its 95% range for 108 trials (grey band). Right: their Fano factors (blue) against Poisson neurons with the same means and trial count (black outline).*

**Key point**

"Identical" trials are not identical brain states. If the mean count depends on a hidden state $S$, the **law of total variance** gives

$$\operatorname{Var}(N)=\mathbb{E}[\operatorname{Var}(N\mid S)]+\operatorname{Var}(\mathbb{E}[N\mid S]).$$

State fluctuations add variance even when each state is Poisson, and they add it to many neurons at once, creating covariance.

**Interactive figure.** A neuron that is Poisson within each of two hidden states (engaged, disengaged). Blue: its count distribution over all trials. Grey: a single Poisson neuron with the same mean. The readout splits the variance into within-state and between-state parts.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=17&ix=total-variance&t=A%20neuron%20that%20is%20Poisson%20within%20each%20of%20two%20hidden%20states%E2%80%A6)

**Common pitfall**

One session, one window, neurons with a mean below 1 excluded, and trials spread over the session (slow drifts included). For the motor-cortex neurons, spike times are known only to 10 ms, and intervals are pooled over stimulus, movement and reward periods, so the CV and FF mix intrinsic irregularity with behaviour-driven rate changes.

## Where this appears in neuroscience and machine learning

**Neuroscience.** Interval and count distributions characterise firing patterns (regular, Poisson-like, bursty). Fano factors and their reduction after stimulus onset ("variability quenching") are standard measures of cortical variability. Noise correlations set how much information a population average carries; z-scored responses compare neurons with different rates; and square-root or log transforms of counts and intervals precede many analyses.

**Machine learning.** Losses are expectations over data. Feature standardisation and batch and layer normalisation are linear transformations; covariance matrices underlie PCA and Gaussian models. Ensembles of correlated models reduce variance less than independent ones, hitting the same floor as correlated neurons. Mini-batch gradients have a standard error proportional to $1/\sqrt{\text{batch size}}$ (Lesson 12). Inverse-CDF sampling and Jensen's inequality appear throughout probabilistic modelling.

**Common pitfall**

**Common mistakes to avoid.**

- **Reading density heights or unnormalised histogram bars as probabilities.**
- **Assuming $\mathbb{E}[g(X)]=g(\mathbb{E}[X])$**: averaging 1/ISI to get a firing rate, or confusing the log of the mean with the mean of the logs.
- **Dividing by $n$ instead of $n-1$**, or not saying which.
- **Taking zero covariance as independence.**
- **Computing a Fano factor on rates**, or quoting one without its window.
- **Interpreting a single noisy CV or Fano factor** without its sampling spread.
- **Standardising with statistics that include test data.**

## Lesson summary

- A random variable is described by its PMF or PDF and its CDF; $P(a<X\le b)=F(b)-F(a)$; densities have units and can exceed 1.
- $\mathbb{E}$ is linear and $\operatorname{Var}=\mathbb{E}[(X-\mu)^2]$; $\mathbb{E}[g(X)]\ne g(\mathbb{E}[X])$ for nonlinear $g$ (Jensen).
- $Y=aX+b$ has mean $a\mu+b$ and SD $\lvert a\rvert\sigma$; z-scores are unitless; quantiles transform under increasing maps, means do not.
- $\operatorname{Var}(\sum X_i)=\sum_{i,j}\operatorname{Cov}(X_i,X_j)$; shared variability puts a floor under population averages.
- The CV (of intervals) and the FF (of counts) compare with the Poisson value 1; the FF depends on the window and is defined for counts.
- Statistics vary across experiments: $\operatorname{SE}=\sigma/\sqrt n$, and estimated CVs and FFs have wide spreads at small $n$.

## Further reading

- J. K. Blitzstein and J. Hwang, *Introduction to Probability*, 2nd ed., CRC Press, 2019 (free online). Chapters 3–7.
- P. Dayan and L. F. Abbott, *Theoretical Neuroscience*, MIT Press, 2001. Chapter 1 (spike-train statistics, CV, Fano factor).
- M. M. Churchland et al., "Stimulus onset quenches neural variability", *Nature Neuroscience* 13:369–378, 2010.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The mini-lab data (released under CC0).
