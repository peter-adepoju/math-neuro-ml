---
summary: "Gradient descent with many parameters: a vector optimiser you can trust, eigenmodes and learning-rate regimes, condition numbers and narrow valleys, scaling as preconditioning, debugging from histories, heavy-ball momentum, starts and saddles, and a motor-cortex decoder trained by gradient descent."
---

::: objectives
- The simultaneous vector update $\boldsymbol\theta_{k+1}=\boldsymbol\theta_k-\eta\nabla L(\boldsymbol\theta_k)$, and what makes an optimiser trustworthy: histories, stop reasons, finite checks and gradient checks
- The exact error recursion on a quadratic, $\mathbf e_{k+1}=(\mathbf I-\eta\mathbf H)\mathbf e_k$, its eigenmodes, the stability interval $0<\eta<2/\lambda_{\max}$ and the spectral radius
- The condition number, why elongated valleys make gradient descent zig-zag and crawl, and why it depends on units and parameterisation
- Scaling, standardisation (with training statistics only) and preconditioning as changes of geometry
- Heavy-ball momentum: one convention, its stable region, and when it helps
- Regularisation and validation monitoring: optimisation, prediction and scientific conclusions are separate questions
:::

**Before you start.** This reading is the mathematical companion to the Lesson 15 teaching notebook. You need Lesson 6 (eigendecomposition of symmetric matrices), Lessons 11 and 12 (curvature, one-dimensional gradient descent, stopping rules) and Lesson 14 (gradients, Hessians, units). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $L:\mathbb{R}^p\to\mathbb{R}$ | the objective (loss) being minimised |
| $\boldsymbol\theta\in\mathbb{R}^p$, $\boldsymbol\theta_k$ | parameters (NumPy shape `(p,)`); the iterate at step $k$ (an algorithmic index, not time) |
| $\eta$, $\beta$ | learning rate; momentum coefficient |
| $\mathbf H=\mathbf Q\boldsymbol\Lambda\mathbf Q^{\mathsf T}$ | the Hessian, with eigenvalues $\lambda_i$ and orthonormal eigenvectors (the columns of $\mathbf Q$) |
| $\mathbf e_k=\boldsymbol\theta_k-\boldsymbol\theta^\star$, $\mathbf z_k=\mathbf Q^{\mathsf T}\mathbf e_k$ | the error, and the error in eigen-coordinates |
| $\rho=\max_i\lvert1-\eta\lambda_i\rvert$ | the spectral radius of $\mathbf I-\eta\mathbf H$ |
| $\kappa=\lambda_{\max}/\lambda_{\min}$ | the condition number (positive-definite $\mathbf H$ only) |
| $\mathbf D$, $\mathbf P=\mathbf D\mathbf D^{\mathsf T}$ | a change of scale, and the preconditioner it corresponds to |

## A vector optimiser you can trust

Take $L=\frac12\big[(\theta_1-2)^2+4(\theta_2+1)^2\big]$. Its gradient is $\big(\theta_1-2,\ 4(\theta_2+1)\big)$. From $(0,\ 0)$ with $\eta=0.1$, one step gives $(0.2,\ -0.4)$, and the two errors shrink by $1-0.1\times1=0.9$ and $1-0.1\times4=0.6$. **The more curved direction converges faster.**

::: definition Definition: vector gradient descent
$$\boldsymbol\theta_{k+1}=\boldsymbol\theta_k-\eta\nabla L(\boldsymbol\theta_k).$$

The whole gradient is computed at $\boldsymbol\theta_k$, then all components are updated together. Updating the components one at a time, with partly updated values, is a different algorithm.
:::

::: keypoint
A trustworthy optimiser:

- records aligned histories of parameters, objective, gradient norm and step size, **including iteration 0**, storing copies rather than references;
- checks for non-finite values and divergence;
- stops on explicit, scale-aware tolerances, with a hard cap on iterations;
- returns its **stop reason**.

Running out of iterations is not convergence, and a small change in the objective detects a stall, not convergence. Check the gradient against central differences first: more iterations never fix a wrong gradient.
:::

Read paths and histories together. With $\eta=0.05$ the path is smooth but unfinished after 200 steps; $\eta=0.2$ converges in 66; $\eta=0.45$ zig-zags but converges in 69; $\eta=0.52$ multiplies the steep error by $-1.08$ each step and diverges.

{{ figure: cell010_1.svg | Four learning rates on the same quadratic: paths (left), objective (middle) and gradient norm (right), with the stop reason of each run in the legend. }}

::: quiz
? An optimiser returns "max steps reached" with a gradient norm of 12. What can you conclude?
- [ ] It converged, just slowly
- [x] Nothing about convergence: it ran out of iterations
- [ ] The gradient is wrong
> Running out of iterations is not convergence. The large gradient norm says the run is far from a stationary point; the cause (step too small, bad scaling, a wrong gradient) needs further checks.

? Why must the history store `theta.copy()` rather than `theta`?
- [ ] Copies use less memory
- [x] Otherwise every entry refers to the same array, which keeps changing
- [ ] NumPy forbids storing arrays in lists
> An in-place update changes the one array that every list entry points to, so the whole history ends up showing the final value.
:::

## Quadratics, eigenmodes and learning-rate regimes

::: note Why it is true: the error recursion
For $L=\frac12(\boldsymbol\theta-\boldsymbol\theta^\star)^{\mathsf T}\mathbf H(\boldsymbol\theta-\boldsymbol\theta^\star)$ with $\mathbf H$ symmetric positive definite, $\nabla L=\mathbf H(\boldsymbol\theta-\boldsymbol\theta^\star)$, so

$$\mathbf e_{k+1}=\boldsymbol\theta_k-\eta\mathbf H\mathbf e_k-\boldsymbol\theta^\star=(\mathbf I-\eta\mathbf H)\mathbf e_k .$$

With $\mathbf H=\mathbf Q\boldsymbol\Lambda\mathbf Q^{\mathsf T}$ and $\mathbf z_k=\mathbf Q^{\mathsf T}\mathbf e_k$, this becomes $\mathbf z_{k+1}=(\mathbf I-\eta\boldsymbol\Lambda)\mathbf z_k$, that is $z_{i,k+1}=(1-\eta\lambda_i)z_{i,k}$. Each eigen-direction is an independent one-dimensional problem, exactly as in Lesson 12.
:::

::: keypoint
For constant-step gradient descent on a quadratic, the iterates converge from every start **if and only if** $0<\eta<2/\lambda_{\max}$.

- Below $1/\lambda_{\max}$ every multiplier $1-\eta\lambda_i$ is positive: smooth approach.
- Between $1/\lambda_{\max}$ and $2/\lambda_{\max}$ the sharp modes flip sign each step but shrink: a stable zig-zag.
- At $\eta=2/\lambda_{\max}$ the sharpest mode bounces forever: a boundary, not a safe choice.
- Beyond it at least one mode grows: divergence.

The late-stage contraction per step is $\rho=\max_i\lvert1-\eta\lambda_i\rvert$. For nonlinear objectives these thresholds are local guidance only.
:::

{{ interactive: gd-modes | Left: gradient descent on a rotated valley with curvatures 1 and 10. Right: the size of the error along each eigen-direction, on a log scale, so a constant multiplier draws a straight line. Slide or Play the step size, measured as ηλ_max, through the four regimes. }}

In the notebook (eigenvalues 1 and 10, rotated by 30°), the measured eigen-coordinate ratios match $1-\eta\lambda_i$ to machine precision. With a cap of 400 steps: $\eta=0.01$ ($\rho=0.99$) does not reach tolerance; $\eta=0.1$ converges in 178 steps; $\eta=0.16$ ($\rho=0.84$, oscillating) in 108; $\eta=0.2$ ($\rho=1$) ends with $L=67$; $\eta=0.21$ diverges.

::: note Why it is true: the best constant step
The worst multiplier $\max\big(\lvert1-\eta\lambda_{\min}\rvert,\ \lvert1-\eta\lambda_{\max}\rvert\big)$ is smallest when the two are balanced, $1-\eta\lambda_{\min}=-(1-\eta\lambda_{\max})$. That gives

$$\eta_\star=\frac{2}{\lambda_{\max}+\lambda_{\min}},\qquad \rho_\star=\frac{\lambda_{\max}-\lambda_{\min}}{\lambda_{\max}+\lambda_{\min}}=\frac{\kappa-1}{\kappa+1}.$$
:::

::: quiz
? A quadratic has Hessian eigenvalues 2 and 50. Which learning rates converge from every start?
- [ ] $0<\eta<1$
- [x] $0<\eta<0.04$
- [ ] $0<\eta<0.02$
> Stability needs $\eta<2/\lambda_{\max}=2/50=0.04$. Below $1/50=0.02$ the approach is smooth; between 0.02 and 0.04 the sharp mode zig-zags but still shrinks.
:::

## Conditioning and narrow valleys

::: keypoint
For a symmetric positive-definite Hessian, $\kappa=\lambda_{\max}/\lambda_{\min}$. One learning rate serves every direction. Stability caps it at $2/\lambda_{\max}$, so the flattest mode contracts at best by $1-2/\kappa$ per step, and raising $\eta$ to speed up the flat direction destabilises the sharp one. **The zig-zag is the sharp mode's sign flip; the slow tail is the flat mode.**
:::

$\kappa$ is infinite for a singular Hessian, which has a flat direction and no unique minimiser, and meaningless for an indefinite one, which has no minimum at all. It depends on units and parameterisation (Lesson 14): unequal scales give axis-aligned valleys, coupled parameters give rotated ones. With $\eta=1.8/\lambda_{\max}$ and the same start in eigen-coordinates, a round bowl ($\kappa=1$) needs 69 steps; both $\kappa=100$ valleys, axis-aligned and rotated, need 799, with a flat-mode multiplier of 0.982.

{{ figure: cell017_1.svg | A round bowl (κ = 1), an axis-aligned valley and a rotated valley (both κ = 100), from the same eigen-coordinate start, with the error in each eigen-direction (right; thick: flat mode, thin: sharp mode). Rotation changes the picture but not the step count. }}

## Scaling, standardisation and preconditioning

::: note Why it is true: scaling is preconditioning
Write $\boldsymbol\theta=\mathbf D\mathbf z$ with $\mathbf D$ invertible, and $\tilde L(\mathbf z)=L(\mathbf D\mathbf z)$. By the chain rule, $\nabla_{\mathbf z}\tilde L=\mathbf D^{\mathsf T}\nabla_{\boldsymbol\theta}L$, and the Hessian becomes $\mathbf D^{\mathsf T}\mathbf H\mathbf D$. A gradient step in $\mathbf z$, mapped back, is

$$\boldsymbol\theta_{k+1}=\mathbf D\mathbf z_{k+1}=\mathbf D\big(\mathbf z_k-\eta\mathbf D^{\mathsf T}\nabla_{\boldsymbol\theta}L\big)=\boldsymbol\theta_k-\eta\,\mathbf D\mathbf D^{\mathsf T}\nabla_{\boldsymbol\theta}L(\boldsymbol\theta_k):$$

preconditioned gradient descent with $\mathbf P=\mathbf D\mathbf D^{\mathsf T}$.
:::

The objective and its minimiser do not change; the path and the speed do. For $\mathbf H=\operatorname{diag}(400,\ 1)$, the scaling $\mathbf D=\operatorname{diag}(1/20,\ 1)$ makes $\mathbf D^{\mathsf T}\mathbf H\mathbf D=\mathbf I$, and 7798 steps become 1.

{{ interactive: precondition | Rescale the first parameter and watch the valley turn into a round bowl. The step size is always 1/λ_max for the current coordinates. Left: the path in the rescaled coordinates. Right: the gradient norm on a log scale. }}

A diagonal $\mathbf D$ can only equalise scales; it cannot remove coupling between parameters (a rotated valley). Preconditioning with the inverse Hessian (Newton's method) is ideal on a quadratic but usually too expensive or unsafe; adaptive methods such as Adam estimate a diagonal preconditioner as they go.

**Least squares.** For $L=\frac1{2n}\lVert\widetilde{\mathbf X}\boldsymbol\theta-\mathbf y\rVert^2$, $\nabla L=\frac1n\widetilde{\mathbf X}^{\mathsf T}(\widetilde{\mathbf X}\boldsymbol\theta-\mathbf y)$ and $\mathbf H=\frac1n\widetilde{\mathbf X}^{\mathsf T}\widetilde{\mathbf X}$. The loss is convex, with a unique minimiser only when $\widetilde{\mathbf X}$ has full column rank, and $\kappa(\widetilde{\mathbf X}^{\mathsf T}\widetilde{\mathbf X})=\kappa(\widetilde{\mathbf X})^2$: solve with `lstsq` or an SVD rather than the normal equations.

::: keypoint
**Standardise with training statistics only.** Apply the same transform to the validation and test rows, drop or handle features with zero spread, and map the coefficients back: $w_j=\tilde w_j/s_j$ and $b=\tilde b-\sum_j\tilde w_j\mu_j/s_j$.

In the notebook's example (contrast, duration in ms, and a constant luminance column that is dropped), $\kappa$ falls from about $2.6\times10^6$ to 1.5, and gradient descent goes from "not converged after 20,000 steps" to 14 steps. Predictions after mapping back agree to $10^{-14}$. Standardisation does not fix collinearity, rank deficiency, outliers or leakage.
:::

::: quiz
? With $\boldsymbol\theta=\mathbf D\mathbf z$ and $\mathbf D=\operatorname{diag}(10,\ 0.1)$, the gradient in $\boldsymbol\theta$ is $(0.2,\ 5)$. What is the gradient in $\mathbf z$?
- [ ] $(0.02,\ 50)$
- [x] $(2,\ 0.5)$
- [ ] $(0.2,\ 5)$
> $\nabla_{\mathbf z}\tilde L=\mathbf D^{\mathsf T}\nabla_{\boldsymbol\theta}L=(10\times0.2,\ 0.1\times5)=(2,\ 0.5)$.
:::

## Stopping and debugging

Diagnose from evidence, not from reading code alone. Each bug leaves a fingerprint in the histories:

- **Sign error:** the objective rises from the first step, although the step size is sensible.
- **Sequential update:** it converges by a different path, and the first step disagrees with a hand calculation (only visible when the parameters are coupled).
- **Missing `.copy()`:** all stored iterates are identical.
- **Sum instead of mean:** the gradient is $n$ times too large for its objective, and explodes at a learning rate that suits the mean.
- **False success:** "converged" with a large gradient norm, after merely running out of steps.

{{ interactive: debug | Pick an optimiser, correct or buggy, and read its path (left) and objective history (right, log scale). The black dot is the true minimum. Press Play to watch the iterations accumulate. }}

More iterations fix none of these bugs, and a smaller learning rate merely hides the sum-versus-mean mismatch.

## Momentum

::: definition Definition: heavy-ball momentum (the convention of this course)
$$\mathbf v_{k+1}=\beta\mathbf v_k+\nabla L(\boldsymbol\theta_k),\qquad \boldsymbol\theta_{k+1}=\boldsymbol\theta_k-\eta\mathbf v_{k+1},\qquad \mathbf v_0=\mathbf 0,\ 0\le\beta<1 .$$

$\beta=0$ is vanilla gradient descent. Other texts use $\mathbf v_{k+1}=\beta\mathbf v_k+(1-\beta)\nabla L$, which rescales the effective learning rate; never mix the two conventions.
:::

$\mathbf v$ is optimiser state, not a physical velocity. Across a narrow valley the alternating gradient components cancel in $\mathbf v$; along it they add up, so progress along the flat direction speeds up, towards an effective step of $\eta/(1-\beta)$.

::: keypoint
On a quadratic, each mode is stable with momentum if and only if $0<\eta\lambda<2(1+\beta)$. Well-tuned momentum needs about $\sqrt\kappa$ steps per digit of accuracy instead of $\kappa$.

On $\operatorname{diag}(1,\ 100)$: vanilla gradient descent with $\eta=1/\lambda_{\max}$ takes 1902 steps, and 1152 with the best constant step; momentum with $\beta=0.9$ at $\eta=1/\lambda_{\max}$ takes 392; tuned momentum ($\eta=0.033$, $\beta=0.67$) takes 143.
:::

{{ interactive: momentum | Vanilla gradient descent (vermilion) and heavy-ball momentum (blue) on a valley with curvatures 1 and 100. Set the step size and β, or press Play to sweep β; the readout counts steps until the gradient norm falls below 10⁻⁶. }}

Momentum is not universally faster. On a round bowl it gives no benefit, too much of it overshoots and rings, the objective need not fall at every step, and a fair comparison tunes each method separately.

::: quiz
? With $\beta=0.5$, which values of $\eta\lambda_{\max}$ are stable for heavy-ball momentum on a quadratic?
- [ ] Below 2
- [x] Below 3
- [ ] Below 4
> The condition is $\eta\lambda<2(1+\beta)=2\times1.5=3$. Momentum widens the stable range compared with vanilla gradient descent (below 2).
:::

## Nonconvex objectives: starts and saddles

On $L=(x^2-1)^2+2y^2+0.3x$ there are two minima: a deeper one at $x=-1.036$ ($L=-0.305$) and a shallower one at $x=0.960$ ($L=0.294$), separated by a saddle at $x=0.075$. Where gradient descent ends depends on the basin it starts in.

{{ interactive: saddle-starts | Drag the black start point anywhere on the landscape and gradient descent runs from it (orange). Open circles mark the two minima (green) and the saddle (vermilion); blue contours are below zero. The button starts the run exactly on the saddle. }}

Started exactly at the saddle, gradient descent stops at once: the gradient is zero there, yet the point is not a minimum. A perturbation of $10^{-6}$ sends it to one of the minima. **A small gradient norm alone is ambiguous, and one run is never evidence of a global minimum.**

## Mini-lab: training a motor-cortex decoder by gradient descent

**Set-up.** A linear decoder of wheel velocity from the smoothed firing rates of mouse primary motor-cortex neurons (Steinmetz et al., 2019; data CC0). 26 of 447 neurons are silent in the training trials and are dropped, leaving $p=422$ parameters with the intercept. The loss is $\frac1{2n}\lVert\widetilde{\mathbf X}\mathbf W-\mathbf Y\rVert_F^2$.

The trials are split in recording order: training on the first 10% (34 trials, 1700 bins of 50 ms, deliberately little data), validation on the next 10%, and the test set (the second half) used once.

**Conditioning.** Raw rates give $\kappa\approx4.7\times10^6$; standardised with training statistics, $\kappa\approx3800$. On raw rates, gradient descent with $\eta=1/\lambda_{\max}$ is still 61% above the optimum after 3000 steps (22% with momentum $\beta=0.9$). Standardised, it is within 1% of the optimum after about 2500 steps, and about 250 with momentum.

{{ figure: cell038_1.svg | Left: excess training loss against iteration for raw and standardised rates, with and without momentum (log–log axes). Right: validation R² over the same runs; the dotted line is the fully converged least-squares fit. Better optimisation is not always a better model. }}

**Optimisation is not the goal.** The least-squares optimum fits the training trials almost perfectly ($R^2=0.94$) but generalises poorly (validation $R^2=0.21$). Validation $R^2$ peaks at 0.75 after only 20 steps of plain gradient descent, then falls: with so little data the decoder overfits. Stopping early, or adding a ridge penalty $\frac{\lambda}{2n}\lVert\mathbf W\rVert^2$ (intercept unpenalised), both help.

{{ interactive: ridge-validation | Ridge regularisation on the decoder: training R² (blue) and validation R² (vermilion) for each penalty strength, with λ = 0 drawn at the left edge. Slide or Play through λ; the readout also gives the conditioning of the penalised problem. }}

::: keypoint
Keep three questions apart.

- **Optimisation:** did the algorithm reach the minimum of the objective as written? Check the gradient norm and a reference solution.
- **Prediction:** does the fit generalise? Use validation data for decisions and the test set once.
- **Science:** what do the parameters mean? With correlated neurons, individual weights are weakly identified whatever the optimiser does.
:::

::: pitfall
This is one session and a linear decoder of a single time bin. Splits in recording order mix overfitting with changes across the session, and the validation set informed several decisions, so its score is optimistic.
:::

## Where this appears in neuroscience and machine learning

**Neuroscience.** GLMs, decoders, receptive-field models and biophysical models are fitted by gradient-based optimisers, often with parameters in different units (mV, ms, nS), where scaling or reparameterisation decides whether the fit works at all. Flat valleys signal parameter compensation and weak identifiability (Lesson 11), not optimiser failure. Fitting histories and stop reasons belong in methods sections.

**Machine learning.** Neural-network training is stochastic gradient descent with momentum or adaptive diagonal preconditioning (Adam, RMSProp), with normalisation layers that improve conditioning, weight decay (ridge) and early stopping. "The loss exploded" usually means a step beyond $2/\lambda_{\max}$ somewhere. Two-dimensional contour plots are slices of a high-dimensional landscape. Backpropagation computes the gradients; the optimiser decides the updates.

::: pitfall
**Common mistakes to avoid.**

- **Updating components sequentially** instead of simultaneously.
- **Storing references** (no `.copy()`) in histories, or omitting iteration 0.
- **Calling "max steps reached" convergence**, or stopping on a small change in the objective alone.
- **Treating $\eta=2/\lambda_{\max}$ as safe**, or quadratic thresholds as global truths for nonlinear models.
- **Computing $\kappa$ for a singular or indefinite Hessian.**
- **Standardising with statistics from validation or test data**, or forgetting to map coefficients back.
- **Mixing momentum conventions**, or comparing methods at one shared $\eta$ instead of tuning each.
- **Choosing $\lambda$ or the stopping step on the test set**, or equating lower training loss with a better model.
:::

## Lesson summary

- Vector gradient descent updates all components at once; trustworthy runs record histories, stop reasons and finite checks, after a gradient check.
- On a quadratic, $z_{i,k+1}=(1-\eta\lambda_i)z_{i,k}$: stable if and only if $0<\eta<2/\lambda_{\max}$, with late rate $\rho=\max_i\lvert1-\eta\lambda_i\rvert$ and best constant-step rate $\rho_\star=(\kappa-1)/(\kappa+1)$.
- A large $\kappa$ means a narrow valley: zig-zag across, crawl along. $\kappa$ depends on units and parameterisation.
- Scaling $\boldsymbol\theta=\mathbf D\mathbf z$ is preconditioning with $\mathbf P=\mathbf D\mathbf D^{\mathsf T}$. Standardise with training statistics; scaling cannot fix coupling, collinearity or missing information.
- Heavy-ball momentum damps the zig-zag and speeds progress along valleys; it is stable for $\eta\lambda<2(1+\beta)$ and not universally faster.
- Regularisation and early stopping are chosen on validation data; optimisation, prediction and science are separate questions.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
For $\mathbf H=\operatorname{diag}(2,\ 8)$, $\eta=0.1$ and $\mathbf e_0=(1,\ 1)$, compute $\mathbf e_1$ and $\mathbf e_2$.
---answer---
The multipliers are $1-0.2=0.8$ and $1-0.8=0.2$, so $\mathbf e_1=(0.8,\ 0.2)$ and $\mathbf e_2=(0.64,\ 0.04)$.
:::

::: exercise
For $\mathbf H=\begin{pmatrix}5&3\\3&5\end{pmatrix}$, find the stability interval, the best constant step and its contraction factor.
---answer---
**Eigenvalues.** 8 and 2.

**Stability.** $0<\eta<2/8=0.25$.

**Best step.** $\eta_\star=2/(8+2)=0.2$; with $\kappa=4$, $\rho_\star=3/5=0.6$.
:::

::: exercise
With $\kappa=100$ and $\eta=1/\lambda_{\max}$, how many steps reduce the flat-mode error a million-fold?
---answer---
The flat-mode multiplier is $1-1/100=0.99$, so $\ln(10^{-6})/\ln(0.99)\approx1375$ steps.
:::

::: exercise
Repeat the previous exercise with the best constant step.
---answer---
$\rho_\star=99/101\approx0.980$, so $\ln(10^{-6})/\ln(0.980)\approx691$ steps.
:::

::: exercise
Tuned heavy-ball momentum contracts by about $(\sqrt\kappa-1)/(\sqrt\kappa+1)$ per step. Repeat the exercise for it.
---answer---
$(10-1)/(10+1)=9/11\approx0.818$, so about 69 steps.
:::

::: exercise
With $\boldsymbol\theta=\mathbf D\mathbf z$, $\mathbf D=\operatorname{diag}(10,\ 0.1)$ and $\nabla_{\boldsymbol\theta}L=(0.2,\ 5)$, find $\nabla_{\mathbf z}\tilde L$.
---answer---
$\mathbf D^{\mathsf T}\nabla_{\boldsymbol\theta}L=(10\times0.2,\ 0.1\times5)=(2,\ 0.5)$.
:::

::: exercise
Show that gradient descent in $\mathbf z=\mathbf D^{-1}\boldsymbol\theta$ is preconditioned gradient descent in $\boldsymbol\theta$ with $\mathbf P=\mathbf D\mathbf D^{\mathsf T}$.
---answer---
$\mathbf z_{k+1}=\mathbf z_k-\eta\mathbf D^{\mathsf T}\nabla_{\boldsymbol\theta}L(\mathbf D\mathbf z_k)$. Multiply by $\mathbf D$: $\boldsymbol\theta_{k+1}=\boldsymbol\theta_k-\eta\mathbf D\mathbf D^{\mathsf T}\nabla_{\boldsymbol\theta}L(\boldsymbol\theta_k)$.
:::

::: exercise
For the design with an intercept and $x=(100,\ 101,\ 102)$, compute $\frac1n\widetilde{\mathbf X}^{\mathsf T}\widetilde{\mathbf X}$ and its condition number. Repeat after centring $x$.
---answer---
**Raw.** The means are $\bar x=101$ and $\overline{x^2}=10201.67$, so the matrix is $\begin{pmatrix}1&101\\101&10201.67\end{pmatrix}$, with trace 10202.67 and determinant 0.667. Hence $\lambda_{\min}\approx6.5\times10^{-5}$, $\lambda_{\max}\approx10202.7$ and $\kappa\approx1.6\times10^8$.

**Centred** ($x=-1,\ 0,\ 1$): $\operatorname{diag}(1,\ 0.667)$, so $\kappa=1.5$.
:::

::: exercise
A Hessian has eigenvalues 0.5 and 50. A ridge penalty adds $\lambda/n=0.5$ to both. What happens to $\kappa$?
---answer---
It falls from $50/0.5=100$ to $50.5/1=50.5$.
:::

::: exercise
On $L=\theta^2/2$ from $\theta_0=1$ with $\eta=0.1$, compute two steps of vanilla gradient descent and of heavy-ball momentum with $\beta=0.5$.
---answer---
**Vanilla.** $\theta_1=0.9$, $\theta_2=0.81$.

**Momentum.** $v_1=1$, $\theta_1=0.9$; $v_2=0.5+0.9=1.4$, $\theta_2=0.9-0.14=0.76$.
:::

::: exercise
Why is $\eta=2/\lambda_{\max}$ not convergence, even though the iterates stay bounded?
---answer---
The sharpest mode's multiplier is $-1$: its error flips sign with constant size forever, so the objective keeps a constant contribution from that mode and never reaches its minimum. A finite run merely looks bounded.
:::

::: exercise
*(Challenge.)* Derive the best constant step $\eta_\star$ and its rate $\rho_\star$ for eigenvalues in $[\lambda_{\min},\ \lambda_{\max}]$.
---answer---
The worst multiplier is $\max\big(\lvert1-\eta\lambda_{\min}\rvert,\ \lvert1-\eta\lambda_{\max}\rvert\big)$. The first term decreases with $\eta$; the second (beyond $1/\lambda_{\max}$) increases. The maximum is smallest where they are equal: $1-\eta\lambda_{\min}=\eta\lambda_{\max}-1$, so $\eta_\star=2/(\lambda_{\min}+\lambda_{\max})$ and $\rho_\star=1-\frac{2\lambda_{\min}}{\lambda_{\min}+\lambda_{\max}}=\frac{\kappa-1}{\kappa+1}$.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise that fits a neuron's speed-response curve by gradient descent. Both open in Google Colab.

{{ colab: week4/lesson15/Lesson15_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week4/lesson15/Lesson15_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- S. Boyd and L. Vandenberghe, *Convex Optimization*, Cambridge University Press, 2004 (free online). Chapter 9 (unconstrained minimisation, conditioning).
- J. Nocedal and S. J. Wright, *Numerical Optimization*, 2nd ed., Springer, 2006. Chapters 2 and 3 (line searches, step lengths).
- G. Goh, "Why momentum really works", *Distill*, 2017.
- L. Bottou, F. E. Curtis and J. Nocedal, "Optimization methods for large-scale machine learning", *SIAM Review* 60:223–311, 2018.
- I. Goodfellow, Y. Bengio and A. Courville, *Deep Learning*, MIT Press, 2016. Chapter 7 (regularisation, early stopping) and Chapter 8 (optimisation).
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
