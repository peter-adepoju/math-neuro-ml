---
summary: "Finding the dominant patterns in population activity: centring, variance, covariance and correlation, principal components, scores and loadings, explained variance and low-rank reconstruction, units and standardisation, leakage, denoising, the limits of PCA, and what PCA finds in real motor cortex."
---

::: objectives
- Why data are mean-centred, and how variance, covariance and correlation describe a population
- How the covariance matrix gives the variance along every direction, and why it is symmetric and positive semidefinite
- What principal components, eigenvalue ordering, scores and loadings are, and why the sign of a component is arbitrary
- How projection and low-rank reconstruction work, why the best rank-$k$ subspace is spanned by the top components, and how to read explained variance and scree plots
- Why PCA depends on units, and when to standardise
- How to avoid leakage by fitting PCA on training data only, and how low-rank reconstruction can denoise
- What PCA cannot do
- What PCA reveals about 437 neurons in mouse motor cortex
:::

**Before you start.** This reading is the mathematical companion to the Lesson 7 teaching notebook. You need projection onto a unit vector (Lesson 2), data matrices with one observation per row, centring and transposes (Lesson 3), orthogonal matrices and rank (Lesson 4), projection matrices and train/test evaluation (Lesson 5), and the eigen-decomposition of a symmetric matrix and the Rayleigh quotient (Lesson 6). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\mathbf{X}$, shape $(n, N)$ | data matrix: $n$ samples (time bins or trials) by $N$ variables (neurons) |
| $\bar{\mathbf{x}}$, $\mathbf{X}_c$ | the column means; the centred data $\mathbf{X}-\mathbf{1}\bar{\mathbf{x}}^{\mathsf T}$ |
| $s_i^2$, $C_{ij}$, $r_{ij}$ | variance, covariance, correlation |
| $\mathbf{C}$, shape $(N, N)$ | the covariance matrix $\mathbf{X}_c^{\mathsf T}\mathbf{X}_c/(n-1)$ |
| $\lambda_k$, $\mathbf{q}_k$ | the $k$-th largest eigenvalue of $\mathbf{C}$ and its unit eigenvector (the $k$-th principal component) |
| $\mathbf{Q}$, $\mathbf{Q}_k$ | all the components as columns; the first $k$ of them |
| $\mathbf{S}=\mathbf{X}_c\mathbf{Q}$ | scores: each sample's coordinates along the components |
| $\hat{\mathbf{X}}_k$ | the rank-$k$ reconstruction $\mathbf{1}\bar{\mathbf{x}}^{\mathsf T}+\mathbf{X}_c\mathbf{Q}_k\mathbf{Q}_k^{\mathsf T}$ |

## The problem: many neurons, few patterns

A recording of $N$ neurons gives, at each moment, a point in $\mathbb{R}^N$ (Lesson 1). For $N$ in the hundreds, nobody can look at that space. But neurons in a circuit share inputs and drive one another, so their activity moves together, and most of the variation often lies along a few directions. **Principal component analysis** (PCA) finds those directions.

The notebook simulates 60 neurons for 30 s in 50 ms bins: $\mathbf{X}$ has shape (600, 60), with rows for time bins, columns for neurons, and entries in spikes/s. Each neuron's rate is a baseline, plus its own mixture of two shared hidden signals, plus private noise:

$$x_{t,i}=b_i+w_{i1}z_1(t)+w_{i2}z_2(t)+\varepsilon_{t,i}.$$

{{ figure: cell007_1.svg | The simulated population. Left: 60 neurons over 30 s, rate as colour. Right: three of them. The two shared hidden signals are not visible by eye. }}

The heatmap looks like noise, yet apart from the noise the population lives in a two-dimensional subspace of $\mathbb{R}^{60}$. By the end of the section on reconstruction, PCA will have found that subspace from the data alone.

## Centring and variance

::: definition Definition: mean, variance, centring
For one variable with values $x_1,\dots,x_n$:

- the **mean** is $\bar x=\frac1n\sum_tx_t$;
- the (sample) **variance** is $s^2=\frac{1}{n-1}\sum_t(x_t-\bar x)^2$, in squared units, and the **standard deviation** is $s$;
- **centring** a data matrix subtracts each column's mean: $\mathbf{X}_c=\mathbf{X}-\mathbf{1}\bar{\mathbf{x}}^{\mathsf T}$, in NumPy `X - X.mean(axis=0)`.
:::

Dividing by $n-1$ makes $s^2$ an unbiased estimate of the population variance (Lesson 17); for hundreds of samples it hardly matters. `np.var` divides by $n$ unless given `ddof=1`; `np.cov` divides by $n-1$.

::: keypoint
PCA studies *variation*, so it starts from centred data. Without centring, the top eigenvector of $\mathbf{X}^{\mathsf T}\mathbf{X}$ mostly points from the origin to the mean: it describes the baseline firing rates, not how the population varies.
:::

{{ interactive: centring | Two of the simulated neurons, 300 time bins. The purple line is the top eigenvector of XᵀX for the data as shown. Slide (or Play) from raw rates to centred rates: as the mean (vermilion) moves to the origin, the top direction swings from "towards the mean" to "along the spread". }}

## Covariance and the covariance matrix

::: definition Definition: covariance and correlation
$$C_{ij}=\frac{1}{n-1}\sum_t(x_{t,i}-\bar x_i)(x_{t,j}-\bar x_j),\qquad r_{ij}=\frac{C_{ij}}{s_is_j}\in[-1,1].$$

$C_{ii}=s_i^2$. The **covariance matrix** collects all the pairs:

$$\mathbf{C}=\frac{1}{n-1}\mathbf{X}_c^{\mathsf T}\mathbf{X}_c,\qquad\text{shape }(N,N),\ \text{units (spikes/s)}^2 .$$
:::

A positive $C_{ij}$ means neurons $i$ and $j$ tend to be above their baselines together; a negative one, that one is up while the other is down; near zero, that there is no linear relation. The correlation is the covariance with the units divided out.

::: note Why it is true: the matrix formula
Entry $(i,j)$ of $\mathbf{X}_c^{\mathsf T}\mathbf{X}_c$ is the dot product of columns $i$ and $j$ of $\mathbf{X}_c$ (Lesson 4): $\sum_t(x_{t,i}-\bar x_i)(x_{t,j}-\bar x_j)$. Dividing by $n-1$ gives $C_{ij}$. Equivalently, $\mathbf{X}_c^{\mathsf T}\mathbf{X}_c=\sum_t(\mathbf{x}_t-\bar{\mathbf{x}})(\mathbf{x}_t-\bar{\mathbf{x}})^{\mathsf T}$, a sum of one outer product per sample.
:::

{{ figure: cell012_1.svg | The covariance matrix (left, in (spikes/s)²) and the correlation matrix (right, unitless) of the 60 simulated neurons; red is positive, blue negative. The stripes and blocks are groups of neurons that share a hidden signal with the same or opposite sign. }}

::: keypoint
**Variance along a direction.** For a unit vector $\mathbf{u}$, the scores $y_t=\mathbf{u}^{\mathsf T}(\mathbf{x}_t-\bar{\mathbf{x}})$, that is $\mathbf{y}=\mathbf{X}_c\mathbf{u}$, have mean zero and variance

$$\operatorname{Var}(y)=\mathbf{u}^{\mathsf T}\mathbf{C}\,\mathbf{u}.$$

So $\mathbf{C}$ holds the variance along *every* direction, not only along the neuron axes.
:::

::: note Why it is true: variance along u, symmetry and positive semidefiniteness
The scores have mean $\mathbf{u}^{\mathsf T}\big(\frac1n\sum_t(\mathbf{x}_t-\bar{\mathbf{x}})\big)=0$, so their variance is $\frac{1}{n-1}\lVert\mathbf{X}_c\mathbf{u}\rVert^2=\frac{1}{n-1}\mathbf{u}^{\mathsf T}\mathbf{X}_c^{\mathsf T}\mathbf{X}_c\mathbf{u}=\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}$.

**Symmetry:** $(\mathbf{X}_c^{\mathsf T}\mathbf{X}_c)^{\mathsf T}=\mathbf{X}_c^{\mathsf T}\mathbf{X}_c$.

**Positive semidefiniteness:** $\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}=\lVert\mathbf{X}_c\mathbf{u}\rVert^2/(n-1)\ge0$ for every $\mathbf{u}$, so no direction has negative variance, and (taking $\mathbf{u}$ to be an eigenvector) every eigenvalue is $\ge0$.
:::

::: note In practice
`np.cov(X, rowvar=False)` treats columns as variables, as here. Without `rowvar=False`, NumPy treats *rows* as variables and returns an $(n,n)$ matrix: a common and silent mistake. The same applies to `np.corrcoef`.
:::

## Principal axes

Which unit vector maximises $\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}$? Lesson 6 answered this for any symmetric matrix: the top eigenvector, and the maximum value is the top eigenvalue.

{{ interactive: var-direction | Turn the unit vector u (purple) and project the centred two-neuron data onto it. Right: the variance kept along u (purple) and the mean squared residual (vermilion, the thin segments on the left) for every angle. They always add up to the same total, so the direction that keeps the most variance is also the one with the smallest residual. }}

::: keypoint
**PCA.** Centre; form $\mathbf{C}$; eigen-decompose $\mathbf{C}=\mathbf{Q}\boldsymbol\Lambda\mathbf{Q}^{\mathsf T}$ with the eigenvalues **sorted**, $\lambda_1\ge\lambda_2\ge\cdots\ge\lambda_N\ge0$; project, $\mathbf{S}=\mathbf{X}_c\mathbf{Q}$.

- The **principal components** (principal axes) are the columns $\mathbf{q}_k$: orthonormal directions in neuron space.
- The **loadings** are their entries $Q_{ik}$: how much neuron $i$ contributes to component $k$. (Some software scales loadings by $\sqrt{\lambda_k}$.)
- The **scores** $\mathbf{S}$, shape $(n,N)$, are each sample's coordinates along the components, in the data's units.
- $\mathbf{q}_1$ maximises the variance $\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}$ over unit vectors; $\mathbf{q}_k$ maximises it over unit vectors orthogonal to $\mathbf{q}_1,\dots,\mathbf{q}_{k-1}$; the maximum values are $\lambda_1,\lambda_2,\dots$
:::

`np.linalg.eigh` returns eigenvalues in *increasing* order, so they must be reversed. Since $\mathbf{Q}$ is orthogonal, moving to scores is a rotation (possibly with a reflection) of the centred cloud (Lesson 4).

::: note Why it is true: the successive maximisation
Write a unit vector as $\mathbf{u}=\mathbf{Q}\mathbf{a}$ with $\lVert\mathbf{a}\rVert=1$. Then $\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}=\sum_k\lambda_ka_k^2$, a weighted average of the eigenvalues (Lesson 6). It is largest, $\lambda_1$, when all the weight is on $a_1$, that is, $\mathbf{u}=\mathbf{q}_1$. If $\mathbf{u}$ must be orthogonal to $\mathbf{q}_1,\dots,\mathbf{q}_{k-1}$, then $a_1=\cdots=a_{k-1}=0$, and the largest weighted average of the remaining eigenvalues is $\lambda_k$, at $\mathbf{u}=\mathbf{q}_k$.
:::

::: keypoint
Three facts:

1. $\sum_k\lambda_k=\operatorname{tr}\mathbf{C}=\sum_is_i^2$: PCA redistributes the total variance, without creating or losing any.
2. The scores on component $k$ have variance $\lambda_k$.
3. Scores on different components are uncorrelated: their covariance matrix is $\boldsymbol\Lambda$.
:::

::: note Why it is true: the three facts
**(1)** The trace equals the sum of the eigenvalues (Lesson 6), and the diagonal of $\mathbf{C}$ holds the variances.

**(2) and (3).** The scores are centred, so their covariance matrix is

$$\frac{1}{n-1}\mathbf{S}^{\mathsf T}\mathbf{S}=\frac{1}{n-1}\mathbf{Q}^{\mathsf T}\mathbf{X}_c^{\mathsf T}\mathbf{X}_c\mathbf{Q}=\mathbf{Q}^{\mathsf T}\mathbf{C}\mathbf{Q}=\mathbf{Q}^{\mathsf T}\mathbf{Q}\boldsymbol\Lambda\mathbf{Q}^{\mathsf T}\mathbf{Q}=\boldsymbol\Lambda,$$

which is diagonal with entries $\lambda_k$.
:::

{{ interactive: pc-rotate | The same two neurons, rotated into principal-component coordinates. The arrows are the principal axes, each two standard deviations (2√λₖ) long. As the cloud rotates, the readout shows its covariance matrix: at the end the off-diagonal entries are zero, and the variances are λ₁ = 33.7 and λ₂ = 12.6 (spikes/s)², which add up to the total 46.2. }}

### Sign indeterminacy

If $\mathbf{q}$ is a unit eigenvector, so is $-\mathbf{q}$. Flipping component $k$ flips its scores too, and each term $s_{tk}\mathbf{q}_k^{\mathsf T}$ of the reconstruction is unchanged, so both signs describe the data equally well. Software may return either, and the choice can change between data sets.

**Interpret the relative signs of loadings within a component** (which neurons rise together, which move oppositely), never the overall sign. To compare components across analyses, fix a convention such as "the largest loading is positive".

::: quiz
? The covariance matrix of two neurons is $\begin{pmatrix}4&0\\0&9\end{pmatrix}$ (spikes/s)². What is PC1?
- [ ] Neuron 1's axis, $(1,\ 0)$
- [x] Neuron 2's axis, $(0,\ 1)$
- [ ] The diagonal, $(1,\ 1)/\sqrt2$
> The matrix is already diagonal, so its eigenvectors are the axes. The larger eigenvalue, 9, belongs to $(0,\ 1)$: neuron 2 varies most.

? PCA on 50 neurons gives eigenvalues that sum to 200 (spikes/s)². What is the total variance of the 50 neurons?
- [ ] It depends on how many components you keep.
- [x] 200 (spikes/s)²
- [ ] 200/50 = 4 (spikes/s)²
> PCA only redistributes variance: the eigenvalues add up to the trace of $\mathbf{C}$, the sum of the neurons' variances.
:::

## Projection, reconstruction and explained variance

::: definition Definition: rank-k reconstruction
With $\mathbf{Q}_k$ the first $k$ components, shape $(N,k)$, the projection $\mathbf{S}_k=\mathbf{X}_c\mathbf{Q}_k$ gives $k$ numbers per sample. Mapping back,

$$\hat{\mathbf{X}}_k=\mathbf{1}\bar{\mathbf{x}}^{\mathsf T}+\mathbf{X}_c\mathbf{Q}_k\mathbf{Q}_k^{\mathsf T},$$

projects each centred sample onto the subspace spanned by $\mathbf{q}_1,\dots,\mathbf{q}_k$. ($\mathbf{Q}_k\mathbf{Q}_k^{\mathsf T}$ is the projection matrix of Lesson 5, simplified because the columns are orthonormal.)

The **explained-variance ratio** of component $k$ is $\lambda_k/\sum_j\lambda_j$; a **scree plot** shows these in order.
:::

::: keypoint
The squared reconstruction error equals the variance thrown away,

$$\lVert\mathbf{X}-\hat{\mathbf{X}}_k\rVert^2=(n-1)\sum_{j>k}\lambda_j ,$$

and no other $k$-dimensional subspace does better. Maximising the variance kept and minimising the squared reconstruction error are the same problem: you saw it in the variance-along-u figure above.
:::

::: note Why it is true: maximum variance is minimum error
For one centred sample $\mathbf{x}$ and a unit vector $\mathbf{u}$, Pythagoras splits $\mathbf{x}$ into its projection and a perpendicular residual: $\lVert\mathbf{x}\rVert^2=(\mathbf{u}^{\mathsf T}\mathbf{x})^2+\lVert\mathbf{x}-(\mathbf{u}^{\mathsf T}\mathbf{x})\mathbf{u}\rVert^2$. Summing over samples, the total $\sum_t\lVert\mathbf{x}_t\rVert^2$ does not depend on $\mathbf{u}$, so making the projected part large (variance along $\mathbf{u}$) is the same as making the residual part small.

For $k$ orthonormal directions $\mathbf{P}$ the same split gives

$$\lVert\mathbf{X}_c-\mathbf{X}_c\mathbf{P}\mathbf{P}^{\mathsf T}\rVert^2=\lVert\mathbf{X}_c\rVert^2-(n-1)\operatorname{tr}(\mathbf{P}^{\mathsf T}\mathbf{C}\mathbf{P}),$$

and $\operatorname{tr}(\mathbf{P}^{\mathsf T}\mathbf{C}\mathbf{P})=\sum_{j\le k}\mathbf{p}_j^{\mathsf T}\mathbf{C}\mathbf{p}_j$ is largest, equal to $\lambda_1+\cdots+\lambda_k$, for $\mathbf{P}=\mathbf{Q}_k$ (a full proof is the Eckart–Young theorem). Since $\lVert\mathbf{X}_c\rVert^2=(n-1)\operatorname{tr}\mathbf{C}=(n-1)\sum_j\lambda_j$, the minimum error is $(n-1)\sum_{j>k}\lambda_j$.
:::

{{ interactive: scree-denoise | The 60-neuron simulation. Left: the scree plot, with the kept components in blue. Two components carry 57% of the variance; each of the other 58 carries about 0.7%. Right: one neuron, recorded (grey), true (black) and reconstructed from the top k components (blue dashed). Press Play to add components one at a time. }}

**The noise floor.** The simulation's trailing eigenvalues sit near 9 (spikes/s)², the variance of the private noise. This is general: if each neuron adds independent noise of variance $\sigma^2$ to a signal with covariance $\mathbf{C}_s$, the covariance becomes $\mathbf{C}_s+\sigma^2\mathbf{I}$, whose eigenvalues are those of $\mathbf{C}_s$ plus $\sigma^2$ (Lesson 6). Signal dimensions stand out above a flat floor at $\sigma^2$; with finite data the floor is blurred a little.

{{ interactive: noise-floor | Eigenvalues of a 10-neuron signal (blue: 20, 5 and eight zeros) plus independent noise in every neuron (orange). The noise raises every eigenvalue by the same σ², so the more noise, the smaller the share the signal components seem to explain, but they still stand above the floor. }}

**Subspace, not components.** The top two scores explain the hidden signals with $R^2=0.97$ and $0.98$ (least squares, Lesson 5), but each score is a mixture of both signals. Any rotation within the top-two plane captures the same variance, so PCA identifies the *plane*; the individual axes inside it follow from the variance ordering, not from the biology.

{{ figure: cell022_1.svg | Scores on PC1 (top) and PC2 (bottom) over time. Both the slow rhythm and the on/off switching emerge from the noise, but mixed together in each score. }}

### PCA through the singular value decomposition

In practice, PCA is computed from the singular value decomposition $\mathbf{X}_c=\mathbf{U}\boldsymbol\Sigma\mathbf{V}^{\mathsf T}$ without forming $\mathbf{C}$. Then $\mathbf{X}_c^{\mathsf T}\mathbf{X}_c=\mathbf{V}\boldsymbol\Sigma^2\mathbf{V}^{\mathsf T}$, so the columns of $\mathbf{V}$ are the components, $\lambda_k=\sigma_k^2/(n-1)$, and the scores are $\mathbf{X}_c\mathbf{V}=\mathbf{U}\boldsymbol\Sigma$. Avoiding $\mathbf{X}_c^{\mathsf T}\mathbf{X}_c$ avoids squaring the condition number (Lesson 5); `sklearn.decomposition.PCA` works this way.

## Scale sensitivity and standardisation

::: keypoint
If variable $i$ is multiplied by $c$ (a change of units), row and column $i$ of $\mathbf{C}$ are multiplied by $c$, and $C_{ii}$ by $c^2$. PCA maximises variance, so the components change.

Standardising, $z_{t,i}=(x_{t,i}-\bar x_i)/s_i$, removes the units: the covariance of $\mathbf{Z}$ is the correlation matrix $\mathbf{R}=\mathbf{D}^{-1}\mathbf{C}\mathbf{D}^{-1}$ with $\mathbf{D}=\operatorname{diag}(s_i)$, and it does not change when any variable is rescaled.
:::

::: note Why it is true: rescaling and the correlation matrix
Rescaling multiplies column $i$ of $\mathbf{X}_c$ by $c$: $\mathbf{X}_c\mapsto\mathbf{X}_c\mathbf{E}$ with $\mathbf{E}=\operatorname{diag}(1,\dots,c,\dots,1)$, so $\mathbf{C}\mapsto\mathbf{E}\mathbf{C}\mathbf{E}$.

Standardising divides column $i$ by $s_i$, that is $\mathbf{Z}=\mathbf{X}_c\mathbf{D}^{-1}$, so $\operatorname{cov}(\mathbf{Z})=\mathbf{D}^{-1}\mathbf{C}\mathbf{D}^{-1}$, whose entries are $C_{ij}/(s_is_j)=r_{ij}$. A rescaled variable has $s_i\mapsto\lvert c\rvert s_i$, and the factors cancel (up to a sign that does not affect the eigenvalues).
:::

The notebook records a neuron's firing rate (spikes/s), pupil diameter (mm) and running speed, all driven partly by a hidden arousal state. With speed in cm/s, raw PC1 is almost pure speed (loading 0.99). With speed in m/s, raw PC1 is almost purely the firing rate. Standardised PCA gives the same PC1 in both units, with loadings $(0.63,\ 0.62,\ 0.47)$: the shared arousal pattern.

{{ interactive: scale | PC1 loadings for firing rate, pupil and running speed. Slide the units of speed from cm/s to m/s: raw PCA (blue) swings from "speed" to "rate", while standardised PCA (orange) stays put on the shared arousal pattern. }}

::: note In practice
**Standardise** when variables have different units.

**Consider not standardising** when all variables share a unit and their size carries meaning, such as the rates of neurons in one area: a neuron modulated by 20 spikes/s carries more signal than one modulated by 0.5. Raw PCA is then dominated by high-rate neurons, which may or may not be what you want. Standardising a nearly silent neuron inflates its noise to variance 1; **soft normalisation**, dividing by (range + a constant), is a common compromise.

Whatever the choice, report it.
:::

## Leakage

PCA is often a preprocessing step for a model that is then evaluated on held-out data (Lesson 5). Its mean, scaling, components and the chosen $k$ are all estimated from data, so they must be estimated from the **training data only** and applied unchanged to the test data. A leakage-free pipeline is:

1. split the data into training and test sets;
2. on the training set only, compute the mean and any scaling, fit PCA, and choose $k$;
3. transform the test set with those same mean, scaling and components;
4. evaluate once on the transformed test set.

Fitting on all the data lets the test samples pull the components towards their own noise. This is **leakage**.

{{ figure: cell031_1.svg | Fraction of the test variance kept by 10 components, averaged over 20 repeats (100 neurons, 60 training and 60 test trials, a 5-dimensional population). Fitted honestly on the training trials: 54%. Fitted on training plus test trials: an apparent 65%. }}

The inflation is largest when there are many variables and few samples, and for components beyond the true dimension, which fit noise.

## Denoising

If the signal lives in $d$ dimensions and independent noise spreads evenly over all $N$, the rank-$k$ reconstruction with $k\approx d$ keeps nearly all the signal but only about a fraction $k/N$ of the noise variance. In the simulation, the raw data are $3.0$ spikes/s (RMS) away from the noise-free rates; the rank-2 reconstruction is only $0.58$ spikes/s away. You saw this in the scree figure above: too few components lose signal; too many re-admit noise.

With real data there is no noise-free truth. Choose $k$ by **cross-validation**: fit on one part of the data and measure the error against an independent part, for example even against odd trials. Comparing the reconstruction with the data it was fitted to always favours the largest $k$.

::: quiz
? You compute PCA on all your trials, then split them in half to train and test a decoder on the top 10 scores. What is wrong?
- [ ] Nothing, as long as the decoder is trained on the training half.
- [x] The components were fitted using the test trials: leakage.
- [ ] 10 components is too few.
> The mean and the components are part of the model. They must be estimated from the training half only, then applied unchanged to the test half.

? Three variables are measured in spikes/s, mm and cm/s. Should you standardise before PCA?
- [x] Yes: otherwise the variable with the largest numbers in its units dominates.
- [ ] No: standardising always throws information away.
- [ ] It makes no difference to PCA.
> Raw PCA maximises variance, and variances in different units cannot be compared. Standardising makes PCA work on the correlation matrix, which has no units.
:::

## Limitations

::: pitfall
**Variance is not importance.** PCA never sees labels or behaviour; a low-variance direction can carry everything that distinguishes two conditions.

**PCA is linear.** Activity on a curved manifold needs more components than its intrinsic dimension: a one-dimensional ring needs two.

**Equal eigenvalues make components arbitrary.** If $\lambda_1=\lambda_2$, every unit vector in their plane has the same variance, so the individual components are not determined; with nearly equal eigenvalues they are unstable from sample to sample. Only the plane is meaningful.

**Scale and outliers.** Units change the answer, and because deviations are squared, a few artefactual samples can capture a whole component.
:::

{{ figure: cell037_1.svg | Left: two conditions (blue and vermilion). PC1 (arrow) carries 89% of the variance but none of the separation between them. Right: points on a one-dimensional ring in 8 neurons, coloured by their position round the ring, need two components. }}

For labelled conditions, use a method that sees the labels (linear discriminant analysis, a decoder, or demixed PCA). For curved manifolds, nonlinear methods exist (Isomap, UMAP, autoencoders), but PCA is the baseline they must beat.

## Mini-lab: the dominant patterns of motor cortex

The recording is the one from Lessons 5 and 6: 447 neurons in mouse primary motor cortex while the mouse turned a wheel left or right, or held it still, to report a visual choice ([Steinmetz et al., 2019](https://doi.org/10.1038/s41586-019-1787-x); data released under CC0); 342 trials of 2.5 s in 50 ms bins. Rates are smoothed within each trial with a Gaussian of standard deviation 2 bins (100 ms), and ten neurons that are silent throughout the training trials are dropped: $\mathbf{X}$ has shape (17100, 437), (trial, bin) by neuron, in spikes/s. PCA is fitted on the first 171 trials and applied unchanged to the rest.

**Dimensionality.** The first five components explain $49.2$, $6.9$, $5.3$, $2.8$ and $2.4\%$ of the training variance: one dominant pattern, then a slow decline with no sharp elbow. Two components are needed for 50%, 19 for 80% and 55 for 90%. On the test trials, 10 components capture 66% of the variance, against 74% on the training trials they were fitted to.

**Scale.** The absolute PC1 loadings correlate with the neurons' mean rates ($r=0.82$): raw PCA is dominated by high-rate neurons. After standardising, the correlation drops to $0.49$, and 175 rather than 19 components are needed for 80% of the variance.

{{ interactive: m1-scree | Cumulative explained variance for the 437 motor-cortex neurons, on a log scale of k: raw rates (blue), standardised rates (orange), and raw PCA applied to the held-out test trials (open circles). Dotted lines mark 50, 80 and 90%. }}

**Do the components relate to the movement?** PCA never saw the wheel. Averaging each score over the trials of each choice, bin by bin, gives its time course. PC1 drops sharply after the stimulus whenever the mouse turns, in either direction, and much less when it holds still (correlation with wheel speed $-0.80$). PC2 separates the two turn directions: it falls for one and rises for the other. PC3 rises late in the trial after both turns.

{{ interactive: m1-time | Left: the mean time course of one score for the 126 trials with one turn direction (blue), the 119 with the other (vermilion, dashed) and the 97 with no turn (grey, dotted); time from stimulus onset. Right: the same averages as trajectories in the PC1–PC2 plane. Press Play to watch them separate after the stimulus. }}

**Decoding from components.** A least-squares wheel-velocity decoder (Lesson 5) trained on the first half of the trials and tested on the rest reaches $R^2=0.71$ from the top 5 components, $0.73$ from 10, $0.78$ from 100, and only $0.68$ from all 437 dimensions. Dropping the lowest-variance components *improves* the decoder: they carry little movement information, and their weights only fit training noise.

{{ figure: cell047_1.svg | Test R² for wheel velocity from the top k components (log scale of k). }}

::: pitfall
Smoothing at 100 ms concentrates variance in slow, shared patterns, so the variance spectrum depends on preprocessing (as the timescales of Lesson 6 did). The raw-rate ranking is partly a ranking of firing rates. Within a trial, the stimulus, the movement, licking and the reward happen in a fixed order, so a component that changes with the movement may track any of them. This is one session from one mouse. And here variance and movement information happen to line up; the limitations above show that this is not guaranteed, and the last exercise in the notebook tests it directly against random and bottom-variance directions.
:::

## Where this appears in neuroscience and machine learning

**Population state spaces.** Plotting population activity in its top two or three components is the standard first look at a recording: trajectories through "neural state space" during reaching, decision-making or navigation. How many components carry most of the variance is used as an estimate of the *dimensionality* of neural activity.

**Spike sorting.** Each detected spike waveform (tens of samples on several electrode channels) is projected onto its first few principal components; spikes from different neurons form separate clusters there.

**Imaging and fMRI.** Low-rank reconstruction denoises calcium-imaging movies. Resting-state fMRI analyses start from the correlation matrix between brain regions, and its leading eigenvectors are large-scale networks. Noise correlations, the covariance of trial-to-trial fluctuations between neurons, limit how much information a population carries.

**Machine learning.** PCA is the classic tool for dimensionality reduction and visualisation, a preprocessing step before regression and classification (with standardisation and leakage handled by a pipeline), and a baseline for nonlinear methods. Low-rank approximations underpin compression and parameter-efficient fine-tuning of large models. Whitening, which rescales the components to unit variance, is used to condition features before optimisation (Lesson 15).

::: pitfall
**Common mistakes to avoid.**

- **Forgetting to centre**, so that PC1 describes the mean.
- **`np.cov(X)` without `rowvar=False`**: rows treated as variables, giving an $(n,n)$ matrix.
- **Not sorting the eigenvalues**: `eigh` returns them in increasing order.
- **Reading eigenvectors from rows**: components are the *columns* of `Q`.
- **Interpreting the overall sign of a component.** Only the relative signs of loadings mean anything.
- **Mixing units without standardising**, or standardising without thinking about silent or noisy channels.
- **Fitting PCA (or the scaling, or $k$) on all the data** and then reporting test performance.
- **Choosing $k$ by a fixed variance threshold alone**: with noise, 90% may need many noise components.
- **Treating individual components as biological signals.** PCA identifies a subspace; components inside it are ordered by variance, not by mechanism.
- **Assuming high variance means relevance.**
:::

## Lesson summary

- Centre first. Variance, covariance and correlation describe the spread and co-variation; $\mathbf{C}=\mathbf{X}_c^{\mathsf T}\mathbf{X}_c/(n-1)$ is symmetric and positive semidefinite, in squared units.
- The variance along a unit vector $\mathbf{u}$ is $\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}$.
- PCA: eigen-decompose $\mathbf{C}$ and sort the eigenvalues in decreasing order. Components are orthonormal; loadings are their entries; scores $\mathbf{S}=\mathbf{X}_c\mathbf{Q}$ are uncorrelated with variances $\lambda_k$; $\sum_k\lambda_k$ is the total variance. Signs are arbitrary.
- The rank-$k$ reconstruction $\mathbf{1}\bar{\mathbf{x}}^{\mathsf T}+\mathbf{X}_c\mathbf{Q}_k\mathbf{Q}_k^{\mathsf T}$ is the best rank-$k$ fit, with squared error $(n-1)\sum_{j>k}\lambda_j$; maximum variance and minimum error are the same problem.
- Explained-variance ratios and scree plots guide the choice of $k$; independent noise adds a flat floor $\sigma^2$ to the eigenvalues; cross-validation is the honest way to choose.
- PCA depends on units; standardised PCA is PCA of the correlation matrix.
- Fit the mean, scale, components and $k$ on training data only.
- PCA is linear, label-blind, ambiguous for equal eigenvalues and sensitive to outliers.
- In mouse motor cortex the top components track the movement (PC1 its speed, PC2 its direction), and 100 of 437 components decode wheel velocity better than all 437.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
Three time bins of two neurons have rates $(1,\ 1)$, $(2,\ 3)$ and $(3,\ 2)$ spikes/s. Compute the centred data, the covariance matrix and the correlation.
---answer---
**Centred data.** The means are $(2,\ 2)$, so $\mathbf{X}_c=\begin{pmatrix}-1&-1\\0&1\\1&0\end{pmatrix}$.

**Covariance.** $s_1^2=(1+0+1)/2=1$, $s_2^2=(1+1+0)/2=1$ and $C_{12}=(1+0+0)/2=0.5$, so $\mathbf{C}=\begin{pmatrix}1&0.5\\0.5&1\end{pmatrix}$ (spikes/s)².

**Correlation.** $r=0.5/(1\times1)=0.5$.
:::

::: exercise
For the data of the previous exercise, find the eigenvalues and principal components of $\mathbf{C}$, the explained-variance ratio of PC1, and the three PC1 scores.
---answer---
**Components.** (Use the result of the fourth exercise with $a=1$, $b=0.5$.) $\lambda_1=1.5$ along $\mathbf{q}_1=(1,\ 1)/\sqrt2$, and $\lambda_2=0.5$ along $(1,\ -1)/\sqrt2$.

**Explained variance.** PC1 explains $1.5/2=75\%$.

**Scores.** $\mathbf{X}_c\mathbf{q}_1=(-2,\ 1,\ 1)/\sqrt2\approx(-1.41,\ 0.71,\ 0.71)$. Their variance is $(2+0.5+0.5)/2=1.5=\lambda_1$.
:::

::: exercise
Show that $\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}\ge0$ for every $\mathbf{u}$. Show also that $\operatorname{rank}\mathbf{C}\le n-1$, and conclude that with fewer samples than variables, $\mathbf{C}$ has at least $N-n+1$ zero eigenvalues.
---answer---
**Non-negative.** $\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}=\lVert\mathbf{X}_c\mathbf{u}\rVert^2/(n-1)\ge0$.

**Rank.** Each column of $\mathbf{X}_c$ sums to zero, that is $\mathbf{1}^{\mathsf T}\mathbf{X}_c=\mathbf{0}^{\mathsf T}$, so the $n$ rows of $\mathbf{X}_c$ are dependent and $\operatorname{rank}\mathbf{X}_c\le n-1$. Then $\operatorname{rank}\mathbf{C}=\operatorname{rank}\mathbf{X}_c^{\mathsf T}\mathbf{X}_c\le n-1$.

**Zero eigenvalues.** An $N\times N$ matrix of rank at most $n-1$ has at least $N-(n-1)$ zero eigenvalues.
:::

::: exercise
Two neurons have equal variance $a$ and covariance $b$, so $\mathbf{C}=\begin{pmatrix}a&b\\b&a\end{pmatrix}$. Find the principal components and their variances. Describe PC1 in words when $b>0$ and when $b<0$. What happens when $b=0$?
---answer---
**Components.** Eigenvalue $a+b$ along $(1,\ 1)/\sqrt2$, and $a-b$ along $(1,\ -1)/\sqrt2$.

**$b>0$.** PC1 is $(1,\ 1)$: the neurons rise and fall together.

**$b<0$.** PC1 is $(1,\ -1)$: one rises as the other falls.

**$b=0$.** $\mathbf{C}=a\mathbf{I}$ and every direction has variance $a$: the components are arbitrary.
:::

::: exercise
A three-neuron population has $\mathbf{C}=\operatorname{diag}(9,\ 4,\ 1)$ (spikes/s)². What are the components, the explained-variance ratios, and the smallest $k$ that explains at least 90%?
---answer---
**Components.** The neuron axes $\mathbf{e}_1,\mathbf{e}_2,\mathbf{e}_3$.

**Ratios.** $9/14\approx64\%$, $4/14\approx29\%$ and $1/14\approx7\%$.

**Smallest k.** Cumulative: 64%, then 93%. So $k=2$.
:::

::: exercise
$\mathbf{C}=\begin{pmatrix}1&0.8\\0.8&1\end{pmatrix}$. Variable 1 is re-expressed in units ten times smaller, so its values are multiplied by 10. Write the new covariance matrix, find its top eigenvalue and the angle of PC1 from the variable-1 axis, and compare with the original PC1. What is the correlation matrix before and after?
---answer---
**New covariance.** Row and column 1 are multiplied by 10, and the corner by 100: $\mathbf{C}'=\begin{pmatrix}100&8\\8&1\end{pmatrix}$.

**Top eigenvalue.** $\operatorname{tr}=101$ and $\det=36$, so $\lambda_1=(101+\sqrt{10201-144})/2\approx100.64$.

**PC1.** Proportional to $(8,\ \lambda_1-100)=(8,\ 0.64)$, about $4.6^\circ$ from the variable-1 axis, against $45^\circ$ originally: PC1 has become "variable 1".

**Correlation.** $\begin{pmatrix}1&0.8\\0.8&1\end{pmatrix}$ in both cases.
:::

::: exercise
A 10-neuron signal has covariance with eigenvalues $20, 5, 0, \dots, 0$. Independent noise of variance 2 is added to every neuron. What are the eigenvalues of the new covariance matrix, and what fraction of the variance do the first two components explain?
---answer---
**Eigenvalues.** $\mathbf{C}_s+2\mathbf{I}$ has eigenvalues $22, 7, 2, 2, 2, 2, 2, 2, 2, 2$, with total $45$.

**Fraction.** The first two explain $29/45\approx64\%$; the other eight components, all noise, hold 36%.
:::

::: exercise
$n=101$ samples have covariance eigenvalues $50, 20, 5, 3, 2$. What is the squared error of the rank-2 reconstruction, and what fraction of the variance does it keep?
---answer---
**Error.** $(n-1)(5+3+2)=100\times10=1000$ (spikes/s)².

**Kept.** $70/80=87.5\%$.
:::

::: exercise
Show that replacing $\mathbf{q}_k$ by $-\mathbf{q}_k$ leaves the rank-$k$ reconstruction unchanged.
---answer---
The reconstruction is $\mathbf{1}\bar{\mathbf{x}}^{\mathsf T}+\sum_{j\le k}(\mathbf{X}_c\mathbf{q}_j)\mathbf{q}_j^{\mathsf T}$. Replacing $\mathbf{q}_k$ by $-\mathbf{q}_k$ changes its term to $(\mathbf{X}_c(-\mathbf{q}_k))(-\mathbf{q}_k)^{\mathsf T}=(\mathbf{X}_c\mathbf{q}_k)\mathbf{q}_k^{\mathsf T}$: the same.
:::

::: exercise
An analyst computes PCA on a whole data set, then splits it into training and test halves, trains a decoder on the top 10 scores, and reports the test $R^2$. Identify the leakage and describe the correct procedure. If the same analyst also tries $k=1,\dots,50$ and reports the best test $R^2$, what further problem arises?
---answer---
**The leakage.** The components (and the mean) were estimated using the test half, so they are partly tuned to its noise.

**Correct procedure.** Split first; fit the mean, any scaling and PCA on the training half; transform the test half with those parameters; then train and test the decoder.

**Choosing k on the test set.** This uses the test set for model selection too, so the reported $R^2$ is optimistically biased. Choose $k$ by cross-validation within the training half, and evaluate on the test half once.
:::

::: exercise
If $\lambda_1=\lambda_2$ with eigenvectors $\mathbf{q}_1$, $\mathbf{q}_2$, show that every unit vector $\mathbf{u}=\cos\theta\,\mathbf{q}_1+\sin\theta\,\mathbf{q}_2$ has variance $\lambda_1$, and is itself an eigenvector.
---answer---
$\mathbf{C}\mathbf{u}=\cos\theta\,\lambda_1\mathbf{q}_1+\sin\theta\,\lambda_1\mathbf{q}_2=\lambda_1\mathbf{u}$, so $\mathbf{u}$ is an eigenvector, and $\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}=\lambda_1\lVert\mathbf{u}\rVert^2=\lambda_1$.
:::

::: exercise
*(Challenge.)* Show that for centred data, $\sum_t\lVert\mathbf{x}_t\rVert^2=(n-1)\operatorname{tr}\mathbf{C}$, and use the Pythagoras split to prove that for $k=1$ the unit vector minimising $\sum_t\lVert\mathbf{x}_t-(\mathbf{u}^{\mathsf T}\mathbf{x}_t)\mathbf{u}\rVert^2$ is $\mathbf{q}_1$.
---answer---
**The total.** $\sum_t\lVert\mathbf{x}_t\rVert^2=\operatorname{tr}(\mathbf{X}_c^{\mathsf T}\mathbf{X}_c)=(n-1)\operatorname{tr}\mathbf{C}$.

**The split.** For a unit $\mathbf{u}$, $\lVert\mathbf{x}_t\rVert^2=(\mathbf{u}^{\mathsf T}\mathbf{x}_t)^2+\lVert\mathbf{x}_t-(\mathbf{u}^{\mathsf T}\mathbf{x}_t)\mathbf{u}\rVert^2$, because the projection and the residual are orthogonal.

**The minimum.** Summing, the error equals $(n-1)\operatorname{tr}\mathbf{C}-(n-1)\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}$, which is smallest where $\mathbf{u}^{\mathsf T}\mathbf{C}\mathbf{u}$ is largest: at $\mathbf{q}_1$ (Lesson 6). The minimum is $(n-1)(\lambda_2+\cdots+\lambda_N)$.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise on whether the directions of most variance are also the directions of most movement information. Both open in Google Colab.

{{ colab: week2/lesson7/Lesson7_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week2/lesson7/Lesson7_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Introduction to Linear Algebra*, 6th ed., Wellesley–Cambridge Press, 2023. Chapter 7, the singular value decomposition and PCA.
- I. T. Jolliffe and J. Cadima, "Principal component analysis: a review and recent developments", *Philosophical Transactions of the Royal Society A* 374:20150202, 2016.
- J. P. Cunningham and B. M. Yu, "Dimensionality reduction for large-scale neural recordings", *Nature Neuroscience* 17:1500–1509, 2014.
- M. M. Churchland et al., "Neural population dynamics during reaching", *Nature* 487:51–56, 2012. Soft normalisation and PCA of motor cortex.
- D. Kobak et al., "Demixed principal component analysis of neural population data", *eLife* 5:e10989, 2016.
- T. Hastie, R. Tibshirani and J. Friedman, *The Elements of Statistical Learning*, 2nd ed., Springer, 2009. Section 7.10.2, the wrong and right way to do cross-validation.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
