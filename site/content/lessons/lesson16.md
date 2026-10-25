---
summary: "The language of chance: events as Boolean arrays, the axioms and the rules they imply, joint, marginal and conditional probabilities, independence and confounding, the law of total probability and Simpson's paradox, confusion matrices and base rates, thresholds, and what a mouse and its visual cortex detected."
---

::: objectives
- Describe outcomes and events as sets, and compute with them as Boolean arrays
- State the three axioms of probability and derive the complement rule, monotonicity and inclusion–exclusion from them
- Compute joint, marginal and conditional probabilities from a table, and keep $P(A\mid B)$ and $P(B\mid A)$ apart
- Test independence, recognise conditional independence and confounding, and apply the law of total probability (including Simpson's paradox)
- Read a confusion matrix: hit and false-alarm rates, sensitivity, specificity, precision and accuracy, and the effect of the base rate
- Choose a decision threshold on training trials and report its trade-off honestly on test trials
:::

**Before you start.** This reading is the mathematical companion to the Lesson 16 teaching notebook. You need only Python's Boolean arrays (Lesson 3: masks and indexing) and the habit of stating shapes and axes. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\Omega$ | the sample space: the set of all possible outcomes of one trial |
| $A, B\subseteq\Omega$ | events; in code, Boolean arrays of shape `(n,)`, one entry per trial |
| $A^c$, $A\cap B$, $A\cup B$, $A\setminus B$ | complement (`~A`), intersection (`A & B`), union (`A \| B`), difference (`A & ~B`) |
| $P(A)$, $\hat P(A)$ | a probability; the empirical proportion `A.mean()` |
| $p_{ij}=P(X=x_i, Y=y_j)$ | a joint probability table; rows index $X$, columns index $Y$ |
| $P(A\mid B)$ | the probability of $A$ given $B$ (defined when $P(B)>0$) |
| TP, FN, FP, TN | hits, misses, false alarms, correct rejections |
| $\pi$ | the base rate (prevalence), $P(\text{signal present})$ |

## Outcomes, events and event algebra

A mouse saw a grating on 232 trials and turned the wheel on 218 of them (0.94). On 108 blank trials it turned the wheel on 58 (0.54). The first number alone says nothing about detection: a mouse that always turns scores 1.00 on it. Both numbers are conditional probabilities, and this lesson is about computing and combining them correctly.

::: definition Definition: sample space and events
The **sample space** $\Omega$ is the set of possible outcomes of one trial. An **event** is a subset of $\Omega$: a statement that is true or false on each trial.

Events combine as sets: the complement $A^c$ (not $A$), the intersection $A\cap B$ ($A$ and $B$), the union $A\cup B$ ($A$ or $B$ or both), and the difference $A\setminus B=A\cap B^c$. $A$ and $B$ are **disjoint** if $A\cap B=\varnothing$.
:::

With $n$ recorded trials an event is a Boolean array of shape `(n,)`, aligned with every other per-trial array.

{{ interactive: event-algebra | Forty simulated trials, each with a grating on the left (blue square), on the right (green square), both or neither. Pick an event: the outlined trials are those where it is true, and the readout gives its proportion over 2000 trials, with inclusion–exclusion checked. }}

**De Morgan's laws**, $(A\cup B)^c=A^c\cap B^c$ and $(A\cap B)^c=A^c\cup B^c$, hold trial by trial, exactly. Any event splits into disjoint pieces, $A=(A\cap B)\cup(A\cap B^c)$; this split gives the law of total probability later in the lesson.

## The axioms and their consequences

::: definition Definition: Kolmogorov's axioms
A probability assigns to each event a number $P(A)$ such that

1. $P(A)\ge0$;
2. $P(\Omega)=1$;
3. $P(A_1\cup A_2\cup\cdots)=P(A_1)+P(A_2)+\cdots$ for pairwise disjoint events.
:::

::: note Why it is true: the derived rules
**Complement.** $A$ and $A^c$ are disjoint with union $\Omega$, so $P(A)+P(A^c)=1$; in particular $P(\varnothing)=0$.

**Monotonicity.** If $A\subseteq B$, then $B=A\cup(B\setminus A)$ with disjoint pieces, so $P(B)=P(A)+P(B\setminus A)\ge P(A)$; hence $P(A)\le1$.

**Inclusion–exclusion.** $A\cup B=A\cup(B\setminus A)$ and $B=(B\setminus A)\cup(A\cap B)$, both disjoint, so

$$P(A\cup B)=P(A)+P(B)-P(A\cap B)\le P(A)+P(B)\quad\text{(the union bound)}.$$
:::

**Long-run frequency.** For repeatable trials, $P(A)$ is the long-run proportion of trials on which $A$ happens. The empirical proportion $\hat P(A)$ satisfies the axioms exactly on the recorded trials, but it is an **estimate**. Its typical fluctuation is about $\sqrt{p(1-p)/n}$ (derived in Lesson 17).

{{ interactive: running-proportion | Five simulated sessions of an event with probability 0.5: the running proportion after each trial, on a log scale of trials. The dashed envelope is 0.5 ± 2√(p(1 − p)/n). Press Play to add trials. }}

::: pitfall
Additivity needs disjoint events. "Grating on the left" and "grating on the right" overlap (both-sides trials), so $P(L\cup R)\ne P(L)+P(R)$. In the notebook's simulation $P(L)+P(R)=0.99$, while $P(L\cup R)=0.74$.
:::

::: quiz
? $P(A)=0.4$, $P(B)=0.5$ and $P(A\cup B)=0.7$. What is $P(A\cap B)$?
- [ ] 0.9
- [x] 0.2
- [ ] 0.1
> Inclusion–exclusion: $P(A\cap B)=P(A)+P(B)-P(A\cup B)=0.4+0.5-0.7=0.2$.
:::

## Joint, marginal and conditional probabilities

For two categorical variables $X$ (rows) and $Y$ (columns), the joint table $p_{ij}=P(X=x_i, Y=y_j)$ sums to 1. **Marginals** sum out the other variable: $P(X=x_i)=\sum_jp_{ij}$ (row sums, `axis=1`) and $P(Y=y_j)=\sum_ip_{ij}$ (column sums, `axis=0`).

::: definition Definition: conditional probability
For $P(B)>0$,

$$P(A\mid B)=\frac{P(A\cap B)}{P(B)}.$$

Rearranged, this is the **product rule** $P(A\cap B)=P(A\mid B)P(B)=P(B\mid A)P(A)$, and, for three events, the **chain rule** $P(A\cap B\cap C)=P(A\mid B\cap C)\,P(B\mid C)\,P(C)$.
:::

Conditioning means keeping only the trials where $B$ happened and rescaling them to total 1. For a table, $P(Y\mid X)$ divides each row by its row sum, and $P(X\mid Y)$ each column by its column sum. A row with zero total has no conditional distribution: return `NaN`, not a silent zero.

{{ interactive: conditioning-table | One table of counts from 2000 simulated trials (stimulus by response), divided three ways. Joint: the whole table sums to 1. Given the stimulus: each row sums to 1. Given the response: each column sums to 1. Counts are in brackets. }}

::: keypoint
$P(A\mid B)$ and $P(B\mid A)$ share the numerator $P(A\cap B)$ and differ in the denominator. In the simulated mouse, $P(\text{turn}\mid\text{no grating})\approx0.30$ but $P(\text{no grating}\mid\text{turn})\approx0.10$.

Encoding, $P(\text{response}\mid\text{stimulus})$, and decoding, $P(\text{stimulus}\mid\text{response})$, are different questions. Lesson 19 connects them with Bayes' rule.
:::

::: quiz
? In a table with stimuli as rows and responses as columns, how do you get $P(\text{response}\mid\text{stimulus})$?
- [ ] Divide each column by its column sum
- [x] Divide each row by its row sum
- [ ] Divide every entry by the grand total
> Conditioning on the stimulus keeps one row and rescales it to sum to 1. In NumPy: `table / table.sum(axis=1, keepdims=True)`.
:::

## Independence and the law of total probability

::: definition Definition: independence
$A$ and $B$ are **independent** if $P(A\cap B)=P(A)P(B)$, equivalently $P(A\mid B)=P(A)$ when $P(B)>0$.

They are **independent given $C$** if $P(A\cap B\mid C)=P(A\mid C)P(B\mid C)$.
:::

Independent is not the same as disjoint: disjoint events with positive probabilities are dependent, because $P(A\mid B)=0\ne P(A)$. Independence is a statement about probabilities, not about mechanisms.

::: note Why it is true: the law of total probability
If $B_1,\dots,B_m$ partition $\Omega$, then $A=\bigcup_i(A\cap B_i)$ with disjoint pieces, so by additivity and the product rule

$$P(A)=\sum_{i=1}^mP(A\cap B_i)=\sum_{i=1}^mP(A\mid B_i)\,P(B_i).$$

An overall probability is a weighted average of conditional ones, weighted by how common each condition is.
:::

**Confounding.** Two unconnected neurons that each spike more when a stimulus is present, independently given the stimulus, are dependent overall. In the notebook, $P(A\cap B)=0.160$ exactly, against $P(A)P(B)=0.1225$, while within each stimulus condition the joint equals the product. Pooling two conditions mixes two products, and a mixture of products is not a product.

{{ interactive: confound | Two neurons, A and B, both driven by a stimulus shown on half the trials. Blue bars: P(A and B); green bars: P(A) P(B), pooled and within each condition. Slide or Play the stimulus drive: within conditions the bars always match; pooled, they separate as the drive grows. }}

**How big is "zero"?** Estimated gaps $\hat P(A\cap B)-\hat P(A)\hat P(B)$ are never exactly zero. For independent events with probabilities near 0.35, 95% of simulated sessions fall within $\pm0.063$ at $n=50$ and $\pm0.014$ at $n=1000$. The stimulus-driven gap of 0.0375 is invisible at the first sample size and clear at the second.

{{ interactive: gap-noise | Estimated dependence gaps for two truly independent events, from 800 simulated sessions, against the true gap of the stimulus-driven pair (dashed). Slide or Play the number of trials per session and watch the spread shrink. }}

::: keypoint
**Simpson's paradox.** Detector A hits 0.50 of low-contrast and 0.95 of high-contrast gratings; detector B hits 0.40 and 0.90. Yet B's overall hit rate is 0.80 and A's only 0.59, because B was tested mostly on high contrast (80% of trials) and A mostly on low (80%). Each overall rate is $\sum_cP(\text{hit}\mid c)P(c)$ with different weights. On a common 50/50 mix, A scores 0.725 and B 0.650. Compare within conditions, or standardise to a common mix.
:::

{{ interactive: simpson | Hit rates of detectors A (blue) and B (green) at each contrast, as tested, and on a common 50/50 mix. Change the share of low-contrast trials each detector was tested on, or press Play to sweep A's. }}

::: quiz
? Two events are disjoint and each has probability 0.3. Are they independent?
- [ ] Yes: disjoint events never influence each other
- [x] No: knowing one happened makes the other impossible
- [ ] Only if their probabilities are equal
> $P(A\cap B)=0$, but $P(A)P(B)=0.09$. Learning that $B$ happened drops the probability of $A$ from 0.3 to 0, which is strong dependence.
:::

## Detection and the confusion matrix

| | **decision: yes** | **decision: no** |
|---|---|---|
| **truth: present** | hit (TP) | miss (FN) |
| **truth: absent** | false alarm (FP) | correct rejection (TN) |

| Name | Counts | Conditional probability |
|---|---|---|
| hit rate, sensitivity, recall | TP / (TP + FN) | $P(\text{yes}\mid\text{present})$ |
| false-alarm rate | FP / (FP + TN) | $P(\text{yes}\mid\text{absent})$ |
| specificity | TN / (FP + TN) | $P(\text{no}\mid\text{absent})=1-$ false-alarm rate |
| precision (positive predictive value) | TP / (TP + FP) | $P(\text{present}\mid\text{yes})$ |
| accuracy | (TP + TN) / $n$ | $P(\text{correct})$ |

The course writes the confusion matrix with the truth in rows and the decision in columns. Check the layout of any software you use: scikit-learn's `confusion_matrix` with labels `[0, 1]` returns `[[TN, FP], [FN, TP]]`.

::: note Why it is true: accuracy and precision depend on the base rate
With $\pi=P(\text{present})$, the product rule gives $P(\text{present}\cap\text{yes})=\text{sens}\cdot\pi$ and $P(\text{absent}\cap\text{yes})=(1-\text{spec})(1-\pi)$, and the law of total probability adds them to give $P(\text{yes})$. Hence

$$\text{accuracy}=\text{sens}\cdot\pi+\text{spec}\cdot(1-\pi),\qquad \text{precision}=\frac{\text{sens}\cdot\pi}{\text{sens}\cdot\pi+(1-\text{spec})(1-\pi)}.$$

Sensitivity and specificity condition on the truth and do not depend on $\pi$; precision and accuracy do.
:::

A detector with sensitivity and specificity 0.9 has precision 0.90 at $\pi=0.5$, 0.69 at 0.2, 0.32 at 0.05 and 0.08 at 0.01, while its accuracy stays 0.9 and a detector that always says "no" scores $1-\pi$.

{{ interactive: base-rate | Left: 500 trials sorted into hits (blue), misses (purple), false alarms (vermilion) and correct rejections (grey). Right: precision against base rate for the current sensitivity and specificity; the black dot is the current base rate. Press Play to sweep the base rate. }}

When the signal is rare, raising specificity helps precision far more than raising sensitivity. A detector that always says yes has hit rate 1 and accuracy $\pi$: **report hit and false-alarm rates together, with the base rate.**

::: quiz
? A spike detector has sensitivity 0.99 and specificity 0.99, and true spikes occur in 1% of time bins. Roughly what fraction of its detections are real spikes?
- [ ] 99%
- [x] 50%
- [ ] 1%
> Per 10,000 bins: 100 true spikes give 99 hits; 9,900 empty bins give 99 false alarms. Precision $=99/198=0.5$.
:::

## Thresholds and trade-offs

A detector that says "yes" when a score reaches a threshold, $\text{score}\ge t$, can only lose "yes" trials as $t$ rises, so the hit rate and the false-alarm rate both fall (or stay put). Plotting the hit rate against the false-alarm rate as $t$ moves traces the ROC curve, analysed in Lesson 20.

{{ interactive: threshold | Left: spike-count distributions of a model neuron without (blue) and with (orange) the stimulus; trials at or right of the dashed line get "yes". Right: hit rate against false-alarm rate for every threshold (green); the black dot is the current threshold and the open circle the cheapest one. Switch the cost of a miss. }}

The best $t$ depends on costs and base rates; one criterion minimises $c_{\text{miss}}\,\text{FN}+c_{\text{FA}}\,\text{FP}$. In the notebook's simulated neuron, equal costs give $t=7$ spikes (test hit and false-alarm rates 0.68 and 0.04); if a miss costs five false alarms, $t=5$ (0.90 and 0.16).

::: keypoint
Choose the threshold on training trials and report its rates on separate test trials: rates measured on the trials used to choose $t$ are optimistic. State the tie rule ("$\ge t$" or "$>t$"): with integer counts, many trials sit exactly on the threshold.
:::

## Mini-lab: what the mouse saw, what it did, and what V1 knew

**Data.** One Neuropixels session of Steinmetz et al. (2019) (mouse Lederberg, in Neuromatch Academy's trial-binned release): 340 trials, 698 neurons, spikes counted 50–250 ms after stimulus onset. Gratings of contrast 0, 0.25, 0.5 or 1 appeared on each side; the mouse turned a wheel towards the higher contrast, or held still when there was no grating. The recordings were in the left hemisphere, so VISp represents right gratings.

**The design itself has dependence.** $P(R\mid L)=0.65$ against $P(R\mid L^c)=0.38$. The gap $\hat P(L\cap R)-\hat P(L)\hat P(R)=0.068$ is far beyond the $\pm0.026$ that independent events give in 340 trials.

**Behaviour.** The mouse turned correctly on 94% of left-higher and 80% of right-higher trials. On blank trials it held still on only 46% and turned right on 37%; conversely, only 28% of right turns came from blank trials. As a grating detector: hit rate 0.94, false-alarm rate 0.54, accuracy 0.79. The law of total probability reproduces $P(\text{turn})=0.94\times0.68+0.54\times0.32=0.81$.

{{ figure: cell041_1.svg | The session's stimulus–response tables, conditioned on the stimulus (left; rows sum to 1) and on the response (right; columns sum to 1). Counts in brackets. }}

**VISp as a detector of right gratings.** The score is the total spike count of the 66 VISp neurons. The threshold, chosen on a random half of the trials, is "yes" if at least 31 spikes. On the held-out half: hit rate 0.81, false-alarm rate 0.08, precision 0.91. The hit rate is 0.55 at contrast 0.25 and 0.95–0.97 at 0.5 and 1; weighted by $P(\text{contrast}\mid\text{right grating})$ these reproduce the overall 0.81. A sensitivity means little without the stimulus mix it was measured on.

{{ figure: cell046_1.svg | Left: the VISp score by right-grating contrast, with the threshold chosen on the training half (dashed). Right: hit rate against false-alarm rate on the test half for every threshold (green), the chosen threshold (square) and the mouse's own behaviour (diamond). }}

**An artefact of pooling.** Pooled over all trials, the detector says "yes" on 57% of left-grating trials and 37% of the others, as if left-hemisphere V1 responded to left gratings.

{{ interactive: pooling | The VISp detector's "yes" rate on trials with and without a left grating, pooled and split by whether a right grating was shown. Trial counts above the bars. Pick a group to highlight it. }}

Given the right grating, the left grating changes little (0.82 against 0.88 with a right grating; 0.10 against 0.07 without), in opposite directions and within sampling noise. The pooled effect is the design's $P(R\mid L)\ne P(R\mid L^c)$ passed through the law of total probability: the confounding seen earlier.

::: pitfall
One session and one time window; summing spikes weights all neurons equally; a random split puts neighbouring trials on both sides; and with 30–60 trials per contrast, every rate carries several percentage points of sampling noise.
:::

## Where this appears in neuroscience and machine learning

**Neuroscience.** Trial selection is event algebra on Boolean masks. Tuning curves are conditional probabilities of response given stimulus; decoding asks the reverse. The distinction between signal correlations (or state-driven co-firing) and noise correlations is the distinction between marginal and conditional dependence. Psychophysics and signal detection theory report hit and false-alarm rates. Spike detection, spike sorting and seizure detection are detection problems with rare signals, where precision and false alarms per hour matter more than accuracy. Pooling across animals, sessions or difficulty levels invites Simpson's paradox.

**Machine learning.** Classifier evaluation is the confusion matrix: recall is sensitivity, precision is positive predictive value, and class imbalance makes accuracy misleading. Decision thresholds are chosen on validation data. Naive Bayes and graphical models are built from conditional independence; mixture models and marginal likelihoods use the law of total probability; and performance differences across subgroups are often Simpson-type mixtures.

::: pitfall
**Common mistakes to avoid.**

- **Adding probabilities of overlapping events**, forgetting $-P(A\cap B)$.
- **Swapping $P(A\mid B)$ and $P(B\mid A)$**, or normalising a table along the wrong axis.
- **Treating disjoint as independent**, or "no connection" as independent.
- **Pooling over conditions with different mixes** and comparing the pooled rates.
- **Reporting a hit rate (or accuracy) alone**, without the false-alarm rate and the base rate.
- **Reading a confusion matrix in the wrong layout.**
- **Choosing and evaluating a threshold on the same trials**, or leaving the tie rule unstated.
- **Reading a small estimated difference as real** without asking what chance alone produces at that sample size.
:::

## Lesson summary

- Events are sets of outcomes (Boolean arrays in code); the three axioms imply the complement rule, monotonicity and inclusion–exclusion.
- $P(A\mid B)=P(A\cap B)/P(B)$: restrict and rescale. The product and chain rules build joints from conditionals; $P(A\mid B)\ne P(B\mid A)$.
- Independence means $P(A\cap B)=P(A)P(B)$. Shared causes create marginal dependence between conditionally independent events.
- The law of total probability, $P(A)=\sum_iP(A\mid B_i)P(B_i)$, makes overall rates depend on the mix (Simpson's paradox).
- In a confusion matrix, hit and false-alarm rates condition on the truth and precision on the decision; precision and accuracy depend on the base rate.
- Thresholds trade hits for false alarms: choose on training trials, report on test trials, and state the tie rule.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
$P(A)=0.4$, $P(B)=0.5$ and $P(A\cup B)=0.7$. Find $P(A\cap B)$, $P(A\mid B)$ and $P(B\mid A)$. Are $A$ and $B$ independent?
---answer---
$P(A\cap B)=0.4+0.5-0.7=0.2$; $P(A\mid B)=0.2/0.5=0.4$; $P(B\mid A)=0.2/0.4=0.5$.

Since $P(A)P(B)=0.2=P(A\cap B)$, they are independent.
:::

::: exercise
$A$ and $B$ are disjoint, with $P(A)=0.3$ and $P(B)=0.2$. Find $P(A\cup B)$ and $P(A\mid B)$. Are they independent?
---answer---
$P(A\cup B)=0.5$ and $P(A\mid B)=0/0.2=0\ne P(A)$: dependent.
:::

::: exercise
In 200 trials: signal present and "yes" 45; present and "no" 5; absent and "yes" 15; absent and "no" 135. Give the marginals, the hit and false-alarm rates, specificity, precision and accuracy.
---answer---
**Marginals.** $P(\text{present})=50/200=0.25$ and $P(\text{yes})=60/200=0.3$.

**Rates.** Hit rate $45/50=0.9$; false-alarm rate $15/150=0.1$; specificity 0.9; precision $45/60=0.75$; accuracy $180/200=0.9$.
:::

::: exercise
The detector of the previous exercise is used where the signal is present on 5% of trials. Find its precision and accuracy.
---answer---
$P(\text{present}\cap\text{yes})=0.9\times0.05=0.045$ and $P(\text{absent}\cap\text{yes})=0.1\times0.95=0.095$, so precision is $0.045/0.140=0.32$. Accuracy is $0.9\times0.05+0.9\times0.95=0.9$.
:::

::: exercise
A neuron spikes with probability 0.8 to its preferred stimulus, 0.3 to the orthogonal one and 0.1 on blank trials, shown on 25%, 25% and 50% of trials. Find $P(\text{spike})$ and $P(\text{preferred}\mid\text{spike})$.
---answer---
$P(\text{spike})=0.8\times0.25+0.3\times0.25+0.1\times0.5=0.325$, and $P(\text{preferred}\mid\text{spike})=0.2/0.325\approx0.615$.
:::

::: exercise
$P(A)=0.5$, $P(B\mid A)=0.6$ and $P(C\mid A\cap B)=0.7$. Find $P(A\cap B\cap C)$.
---answer---
By the chain rule, $0.7\times0.6\times0.5=0.21$.
:::

::: exercise
Show that if $A$ and $B$ are independent, so are $A$ and $B^c$.
---answer---
$P(A\cap B^c)=P(A)-P(A\cap B)=P(A)-P(A)P(B)=P(A)\,(1-P(B))=P(A)P(B^c)$.
:::

::: exercise
Detector X hits 0.60 at low and 0.95 at high contrast, and was tested on 90% low-contrast trials. Detector Y hits 0.55 and 0.90, tested on 10% low. Compute both pooled hit rates, and both rates on a 50/50 mix.
---answer---
**Pooled.** X: $0.6\times0.9+0.95\times0.1=0.635$. Y: $0.55\times0.1+0.9\times0.9=0.865$.

**On a 50/50 mix.** X: 0.775. Y: 0.725. X is better at both contrasts but worse pooled.
:::

::: exercise
Ten independent detectors each have a false-alarm rate of 0.05. Find $P(\text{at least one false alarm})$ and compare it with the union bound.
---answer---
$1-0.95^{10}\approx0.401$. The union bound gives 0.5: a valid but loose upper bound.
:::

::: exercise
A count takes values 0–4 with probabilities $(0.4,\ 0.3,\ 0.2,\ 0.1,\ 0)$ when the signal is absent and $(0.05,\ 0.15,\ 0.3,\ 0.3,\ 0.2)$ when it is present. With "yes" if count $\ge t$, give the hit and false-alarm rates for $t=1,2,3,4$, and the error-minimising $t$ for base rates 0.5 and 0.2.
---answer---
**Rates.** Hit rates for $t=1,2,3,4$: 0.95, 0.80, 0.50, 0.20. False-alarm rates: 0.60, 0.30, 0.10, 0.

**Best threshold.** The error probability is $\pi(1-\text{hit})+(1-\pi)\,\text{FA}$. For $\pi=0.5$: 0.325, 0.25, 0.30, 0.40, so $t=2$. For $\pi=0.2$: 0.49, 0.28, 0.18, 0.16, so $t=4$. Rarer signals favour a stricter threshold.
:::

::: exercise
Why can a sensitivity measured in one experiment differ in another, with the same neurons and the same threshold?
---answer---
The overall hit rate is $\sum_cP(\text{yes}\mid c)\,P(c\mid\text{present})$. A different mix of stimulus strengths (contrasts, signal-to-noise ratios) changes the weights, and so the sensitivity, even if every $P(\text{yes}\mid c)$ is unchanged.
:::

::: exercise
*(Challenge.)* Derive inclusion–exclusion for three events, $P(A\cup B\cup C)$.
---answer---
Apply two-event inclusion–exclusion to $(A\cup B)\cup C$, and use $(A\cup B)\cap C=(A\cap C)\cup(B\cap C)$:

$$P(A\cup B\cup C)=P(A)+P(B)+P(C)-P(A\cap B)-P(A\cap C)-P(B\cap C)+P(A\cap B\cap C).$$
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise on a second mouse and a second detector. Both open in Google Colab.

{{ colab: week5/lesson16/Lesson16_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week5/lesson16/Lesson16_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- J. K. Blitzstein and J. Hwang, *Introduction to Probability*, 2nd ed., CRC Press, 2019 (free online). Chapters 1 and 2.
- D. M. Green and J. A. Swets, *Signal Detection Theory and Psychophysics*, Wiley, 1966.
- T. Fawcett, "An introduction to ROC analysis", *Pattern Recognition Letters* 27:861–874, 2006.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The mini-lab data, in Neuromatch Academy's trial-binned release (CC-BY).
