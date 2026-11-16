**Learning objectives**

- How to read a linear system $\mathbf{A}\mathbf{x}=\mathbf{b}$ as lines that must meet (rows) and as a mixture of columns, and how rank decides between one solution, none and infinitely many
- How Gaussian elimination solves a system, and why `solve` is preferred to computing an inverse
- What the condition number measures, and how it limits the effect of measurement error
- What happens with more equations than unknowns (overdetermined) or fewer (underdetermined)
- Why least squares is a projection, where the normal equations come from, and why the residual is orthogonal to the columns
- What the pseudoinverse does, and why forming $\mathbf{A}^{\mathsf T}\mathbf{A}$ squares the condition number
- How to build a design matrix: intercepts, units, indicator coding and the dummy-variable trap
- How to check a model with residuals and $R^2$, and evaluate it honestly on held-out data
- How a least-squares decoder of real motor-cortex activity compares with the projection decoder of Lessons 2 and 4

**Before you start.** This reading is the mathematical companion to the Lesson 5 teaching notebook. You need Lessons 1–4: dot products and projection onto a line (Lesson 2), data matrices with one observation per row (Lesson 3), and matrix products, rank, determinants and inverses (Lesson 4). Lesson 4 used a matrix to compute outputs from inputs. This lesson runs it backwards: from what we measured to what produced it. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\mathbf{A}\mathbf{x}=\mathbf{b}$ | a linear system: $\mathbf{A}$ and $\mathbf{b}$ known, $\mathbf{x}$ unknown |
| $[\mathbf{A}\mid\mathbf{b}]$ | the augmented matrix: $\mathbf{A}$ with $\mathbf{b}$ added as an extra column |
| $\kappa(\mathbf{A})$ | the condition number of $\mathbf{A}$ |
| column space | the set of all $\mathbf{A}\mathbf{x}$: every mixture of the columns |
| $\mathbf{r}=\mathbf{b}-\mathbf{A}\mathbf{x}$ | the residual: what the model leaves unexplained |
| $\hat{\mathbf{x}}$, $\hat{\boldsymbol\beta}$ | a least-squares solution |
| $\mathbf{A}^{+}$ | the pseudoinverse |
| $\mathbf{X}$, $\mathbf{y}$ | a design matrix (one row per observation) and the response |
| SSE, $R^2$ | sum of squared errors, and the fraction of variance explained |

## The problem: what are this neuron's weights?

A neuron's response is a weighted sum of two inputs (Lesson 2), but we do not know the weights $w_1, w_2$. We run two experiments. The first gives a response of 7 with inputs $(3, 1)$; the second gives 4 with inputs $(1, 2)$. So $3w_1+w_2=7$ and $w_1+2w_2=4$, or in matrix form

$$\underbrace{\begin{pmatrix}3&1\\1&2\end{pmatrix}}_{\mathbf{A}}\begin{pmatrix}w_1\\w_2\end{pmatrix}=\underbrace{\begin{pmatrix}7\\4\end{pmatrix}}_{\mathbf{b}},\qquad \text{solution } (w_1,\ w_2)=(2,\ 1).$$

In Lesson 4, $\mathbf{A}$ and $\mathbf{x}$ were known and we computed $\mathbf{b}$. Here $\mathbf{b}$ is what we measured and $\mathbf{x}$ is what we want: the matrix is run backwards.

Real measurements are noisy, so we would repeat the experiment. With 50 noisy trials instead of 2 there are 50 equations in 2 unknowns, and no pair of weights satisfies them all exactly. The notebook's least-squares answer from 50 trials is $(2.02,\ 0.95)$, close to the true $(2,\ 1)$. This lesson builds the ideas behind both answers: the exact one and the best compromise.

## Linear systems: two pictures and a rank test

**Key point**

**Row picture.** Each equation is a line (with 2 unknowns), a plane (with 3), or a hyperplane in general. A solution lies on all of them at once.

**Column picture.** $\mathbf{A}\mathbf{x}=x_1\mathbf{a}_{:,1}+\cdots+x_n\mathbf{a}_{:,n}$ (the column view of Lesson 4), so a solution is a set of amounts of the columns that add up to $\mathbf{b}$. A solution exists exactly when $\mathbf{b}$ lies in the **column space** of $\mathbf{A}$.

**Interactive figure.** The same system in two pictures. Left: each experiment is a line, and the solution is where the lines cross. Right: the solution says how much of column 1 (blue) and column 2 (orange) to mix to reach b. Switch between the three cases and drag b to see when a solution exists.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=05&ix=row-col&t=The%20same%20system%20in%20two%20pictures.)

**Key point**

**Rank test.** $\mathbf{A}\mathbf{x}=\mathbf{b}$ has a solution if and only if $\operatorname{rank}[\mathbf{A}\mid\mathbf{b}]=\operatorname{rank}\mathbf{A}$. The solution is unique if, in addition, $\operatorname{rank}\mathbf{A}$ equals the number of unknowns $n$; otherwise there are infinitely many.

**Why it is true: the rank test**

**Existence.** Adding $\mathbf{b}$ to the columns of $\mathbf{A}$ raises the rank exactly when $\mathbf{b}$ points in a direction the columns cannot reach, that is, when $\mathbf{b}$ is not in the column space. So equal ranks mean $\mathbf{b}$ is a mixture of the columns: a solution exists.

**Uniqueness.** If $\mathbf{x}_1$ and $\mathbf{x}_2$ are both solutions, $\mathbf{A}(\mathbf{x}_1-\mathbf{x}_2)=\mathbf{0}$. When $\operatorname{rank}\mathbf{A}=n$ the $n$ columns are independent, and the only mixture of them giving $\mathbf{0}$ is the trivial one, so $\mathbf{x}_1=\mathbf{x}_2$. When $\operatorname{rank}\mathbf{A}<n$ there is a nonzero $\mathbf{n}$ with $\mathbf{A}\mathbf{n}=\mathbf{0}$ (a null direction, Lesson 4), and $\mathbf{x}+t\mathbf{n}$ is a solution for every $t$.

For a square $\mathbf{A}$, full rank is the same as $\det\mathbf{A}\neq0$ (Lesson 4). The three cases in the figure are the ones the notebook works through:

- **Independent experiments** ($\det = 5$): one solution.
- **Experiment 2 is a multiple of experiment 1, with a response that disagrees:** the lines are parallel, and there is no solution.
- **The same experiment twice:** the two lines are one line, and there are infinitely many solutions.

## Solving by elimination

**Gaussian elimination** turns a square system into a triangular one by subtracting multiples of one equation from another, then solves it from the bottom up.

**Why it is true: row operations do not change the solutions**

If $\mathbf{x}$ satisfies equations $E_1$ and $E_2$, it satisfies $E_2-cE_1$. Conversely, from $E_1$ and $E_2-cE_1$ we get back $E_2=(E_2-cE_1)+cE_1$. So the old and new systems have exactly the same solutions. Swapping two equations obviously changes nothing either.

**Worked example: a 3 × 3 system**

$$\begin{aligned}2x_1+x_2+x_3&=4\\4x_1+3x_2+3x_3&=10\\8x_1+7x_2+9x_3&=24\end{aligned}
\;\xrightarrow[\;R_3-4R_1\;]{\;R_2-2R_1\;}\;
\begin{aligned}2x_1+x_2+x_3&=4\\x_2+x_3&=2\\3x_2+5x_3&=8\end{aligned}
\;\xrightarrow{\;R_3-3R_2\;}\;
\begin{aligned}2x_1+x_2+x_3&=4\\x_2+x_3&=2\\2x_3&=2\end{aligned}$$

**Back substitution:** $x_3=1$, then $x_2=2-1=1$, then $x_1=(4-1-1)/2=1$.

**Interactive figure.** The worked example as an augmented matrix, one row operation at a time. Each step clears one entry below a pivot (green zeros); once the matrix is triangular, back substitution reads off x₃, then x₂, then x₁. Press Play or move the slider.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=05&ix=elimination&t=The%20worked%20example%20as%20an%20augmented%20matrix%2C%20one%20row%20operation%20at%20a%E2%80%A6)

**Pivoting.** Each step divides by the diagonal entry, called the **pivot**. A zero pivot makes the step impossible, and a tiny one magnifies rounding error. **Partial pivoting** swaps in, before each step, the row with the largest available pivot. Library solvers always do this.

**Cost.** Eliminating an $n\times n$ system takes about $\tfrac23n^3$ arithmetic operations; back substitution takes about $n^2$.

**Key point**

**Solve, do not invert.** Computing $\mathbf{A}^{-1}$ and then $\mathbf{A}^{-1}\mathbf{b}$ does more work than elimination and usually adds rounding error. Use `np.linalg.solve`. In the notebook, for the $12\times12$ Hilbert matrix (condition number $1.6\times10^{16}$), `solve` misses the true answer by $0.45$ and the inverse by $9.4$.

## Conditioning: how errors are amplified

Suppose two experiments present almost the same combination of inputs. Their lines are nearly parallel, and a small shift in one line slides the crossing point a long way.

**Interactive figure.** The same small change in the second measurement, applied to two systems. On the left the lines cross at a healthy angle and the solution barely moves. On the right the lines are nearly parallel, and the crossing point races along them. The dotted orange line is the original second experiment.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=05&ix=conditioning&t=The%20same%20small%20change%20in%20the%20second%20measurement%2C%20applied%20to%20two%E2%80%A6)

**Definition: condition number**

For a square invertible $\mathbf{A}$, the **condition number** is $\kappa(\mathbf{A})=\lVert\mathbf{A}\rVert\,\lVert\mathbf{A}^{-1}\rVert$, where $\lVert\mathbf{M}\rVert=\max_{\mathbf{v}\neq\mathbf{0}}\lVert\mathbf{M}\mathbf{v}\rVert/\lVert\mathbf{v}\rVert$ is the largest factor by which $\mathbf{M}$ stretches any vector. Equivalently, $\kappa$ is the ratio of the largest to the smallest stretch that $\mathbf{A}$ applies. It is always at least 1, and it equals 1 for rotations.

**Key point**

If $\mathbf{A}\mathbf{x}=\mathbf{b}$ and the data change to $\mathbf{b}+\delta\mathbf{b}$, the solution changes by $\delta\mathbf{x}$ with

$$\frac{\lVert\delta\mathbf{x}\rVert}{\lVert\mathbf{x}\rVert}\;\le\;\kappa(\mathbf{A})\,\frac{\lVert\delta\mathbf{b}\rVert}{\lVert\mathbf{b}\rVert}.$$

A condition number of $10^k$ can turn a relative error in the data into one $10^k$ times larger: up to $k$ digits lost.

**Why it is true: the error bound**

Subtracting $\mathbf{A}\mathbf{x}=\mathbf{b}$ from $\mathbf{A}(\mathbf{x}+\delta\mathbf{x})=\mathbf{b}+\delta\mathbf{b}$ gives $\mathbf{A}\,\delta\mathbf{x}=\delta\mathbf{b}$, so $\delta\mathbf{x}=\mathbf{A}^{-1}\delta\mathbf{b}$ and $\lVert\delta\mathbf{x}\rVert\le\lVert\mathbf{A}^{-1}\rVert\lVert\delta\mathbf{b}\rVert$.

Also $\lVert\mathbf{b}\rVert=\lVert\mathbf{A}\mathbf{x}\rVert\le\lVert\mathbf{A}\rVert\lVert\mathbf{x}\rVert$, so $1/\lVert\mathbf{x}\rVert\le\lVert\mathbf{A}\rVert/\lVert\mathbf{b}\rVert$. Multiplying the two inequalities gives the bound.

**Worked example: nearly redundant experiments**

$\mathbf{A}=\begin{pmatrix}3&1\\5.9&2\end{pmatrix}$ has $\kappa\approx488$. With $\mathbf{b}=(7,\ 13.8)$ the solution is $(2,\ 1)$.

Change $b_2$ by $0.1$, a $0.6\%$ change in $\lVert\mathbf{b}\rVert$, and the solution becomes $(1,\ 4)$. It has moved by $\lVert(-1,\ 3)\rVert=3.2$, a $141\%$ change. The amplification is about 220, within the bound of 488.

Conditioning is a property of the *problem*, not of the method used to solve it. No algorithm can recover digits that the data do not pin down. The cure is a better experiment: inputs that vary independently of each other.

## Overdetermined and underdetermined systems

**Overdetermined** ($m>n$: more equations than unknowns). The column space of a tall $\mathbf{A}$ is at most $n$-dimensional inside $\mathbb{R}^m$, and a noisy $\mathbf{b}$ almost surely lies off it, so there is no exact solution. With three experiments and two weights, the three lines in the row picture have no common point.

**Underdetermined** ($m<n$: fewer equations than unknowns). The rank is at most $m<n$, so there are null directions. Whenever a solution exists, there are infinitely many.

**Key point**

If $\mathbf{x}_p$ is any one solution, *every* solution has the form $\mathbf{x}_p+\mathbf{n}$ with $\mathbf{A}\mathbf{n}=\mathbf{0}$. The data determine the solution only up to the null directions.

For example, the single equation $3w_1+w_2=7$ is solved by $(2,\ 1)$, $(2.5,\ -0.5)$, $(3,\ -2)$ and every other point $(2,\ 1)+t(1,\ -3)$.

**Interactive figure.** One experiment, two unknown weights: every point on the blue line fits the measurement exactly. Slide the purple solution along the line (the null direction) and watch its length. The green point is the shortest solution, at right angles to the line; the pseudoinverse later in this lesson picks it.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=05&ix=null-line&t=One%20experiment%2C%20two%20unknown%20weights%3A%20every%20point%20on%20the%20blue%20line%E2%80%A6)

## Least squares

When no exact solution exists, choose the $\mathbf{x}$ that makes the residual as short as possible:

$$\hat{\mathbf{x}}=\arg\min_{\mathbf{x}}\ \lVert\mathbf{b}-\mathbf{A}\mathbf{x}\rVert^2=\arg\min_{\mathbf{x}}\ \sum_{i=1}^{m}\big(b_i-(\mathbf{A}\mathbf{x})_i\big)^2 .$$

Squaring makes every error count as positive and punishes big misses more than small ones. The sum is the **sum of squared errors**, SSE.

**Key point**

$\hat{\mathbf{x}}$ minimises the squared residual if and only if the residual is orthogonal to every column of $\mathbf{A}$:

$$\mathbf{A}^{\mathsf T}(\mathbf{b}-\mathbf{A}\hat{\mathbf{x}})=\mathbf{0}
\qquad\Longleftrightarrow\qquad
\mathbf{A}^{\mathsf T}\mathbf{A}\,\hat{\mathbf{x}}=\mathbf{A}^{\mathsf T}\mathbf{b}\quad\text{(the normal equations).}$$

If the columns of $\mathbf{A}$ are independent, $\mathbf{A}^{\mathsf T}\mathbf{A}$ is invertible and $\hat{\mathbf{x}}=(\mathbf{A}^{\mathsf T}\mathbf{A})^{-1}\mathbf{A}^{\mathsf T}\mathbf{b}$ is unique. Geometrically, $\mathbf{A}\hat{\mathbf{x}}$ is the projection of $\mathbf{b}$ onto the column space. ("Normal" here means perpendicular.)

**Interactive figure.** Three experiments, two weights. The pale blue plane is the column space, spanned by the columns a₁ (blue) and a₂ (orange): every A x lies in it. b (black) lies off the plane, so it cannot be reached. Move x to slide the green point A x around the plane: the vermilion residual is shortest when it meets the plane at a right angle. Turn the view to see the angle from the side.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=05&ix=projection&t=Three%20experiments%2C%20two%20weights.)

**Why it is true: an orthogonal residual is the smallest residual**

Suppose $\hat{\mathbf{r}}=\mathbf{b}-\mathbf{A}\hat{\mathbf{x}}$ is orthogonal to every column. For any other $\mathbf{x}$,

$$\mathbf{b}-\mathbf{A}\mathbf{x}=\hat{\mathbf{r}}+\mathbf{A}(\hat{\mathbf{x}}-\mathbf{x}).$$

The second piece is a mixture of columns, so it is orthogonal to $\hat{\mathbf{r}}$, and Pythagoras (Lesson 2) gives

$$\lVert\mathbf{b}-\mathbf{A}\mathbf{x}\rVert^2=\lVert\hat{\mathbf{r}}\rVert^2+\lVert\mathbf{A}(\hat{\mathbf{x}}-\mathbf{x})\rVert^2\ \ge\ \lVert\hat{\mathbf{r}}\rVert^2 .$$

So no $\mathbf{x}$ does better. Equality holds only if $\mathbf{A}(\hat{\mathbf{x}}-\mathbf{x})=\mathbf{0}$, which forces $\mathbf{x}=\hat{\mathbf{x}}$ when the columns are independent.

Conversely, if the residual had a component along some column, moving $\mathbf{x}$ a little in that direction would shorten it, so a minimiser must have an orthogonal residual.

**Why it is true: AᵀA is invertible exactly when the columns are independent**

Suppose $\mathbf{A}^{\mathsf T}\mathbf{A}\mathbf{v}=\mathbf{0}$. Then $0=\mathbf{v}^{\mathsf T}\mathbf{A}^{\mathsf T}\mathbf{A}\mathbf{v}=(\mathbf{A}\mathbf{v})\cdot(\mathbf{A}\mathbf{v})=\lVert\mathbf{A}\mathbf{v}\rVert^2$, so $\mathbf{A}\mathbf{v}=\mathbf{0}$. If the columns are independent this forces $\mathbf{v}=\mathbf{0}$, so the square matrix $\mathbf{A}^{\mathsf T}\mathbf{A}$ has no null direction and is invertible. If they are dependent, a nonzero $\mathbf{v}$ with $\mathbf{A}\mathbf{v}=\mathbf{0}$ also gives $\mathbf{A}^{\mathsf T}\mathbf{A}\mathbf{v}=\mathbf{0}$.

In the figure's example, $\mathbf{A}$ has rows $(3,1)$, $(1,2)$, $(2,2)$ and $\mathbf{b}=(7,\ 4,\ 6.5)$. The least-squares weights are $\hat{\mathbf{x}}=(2,\ 1.111)$, and the residual $(-0.111,\ -0.222,\ 0.278)$ has zero dot product with both columns.

### Fitting a straight line

Fitting a line is least squares in disguise. For data $(c_i, r_i)$ and the model $r\approx\beta_0+\beta_1c$, each data point is one equation, $\beta_0+\beta_1c_i\approx r_i$. The design matrix has a column of ones (for $\beta_0$) and a column of the $c_i$ (for $\beta_1$). Writing out the two normal equations gives the familiar formulas.

**Key point**

$$\hat\beta_1=\frac{\sum_i(c_i-\bar c)(r_i-\bar r)}{\sum_i(c_i-\bar c)^2},\qquad \hat\beta_0=\bar r-\hat\beta_1\bar c .$$

The fitted line passes through the point of means $(\bar c,\ \bar r)$, and with an intercept the residuals sum to zero.

**Interactive figure.** Thirty trials of a neuron's response to gratings of six contrasts (blue). Set the intercept and slope yourself and try to make the sum of squared residuals (vermilion segments) as small as you can, then jump to the least-squares line. At the best line, the residuals sum to zero and are orthogonal to the contrast column.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=05&ix=line-fit&t=Thirty%20trials%20of%20a%20neuron%27s%20response%20to%20gratings%20of%20six%20contrasts%E2%80%A6)

The notebook's fit gives an intercept of 8.15 spikes/s and a slope of 29.5 spikes/s per unit contrast, with $R^2=0.81$. The data were simulated with an intercept of 8 and a slope of 30.

**Why it is true: the line formulas**

The first normal equation, $\mathbf{1}\cdot(\mathbf{r}-\beta_0\mathbf{1}-\beta_1\mathbf{c})=0$, reads $\sum_i r_i-m\beta_0-\beta_1\sum_i c_i=0$, so $\beta_0=\bar r-\beta_1\bar c$. It also says the residuals sum to zero.

Substitute this into the second equation, $\mathbf{c}\cdot(\mathbf{r}-\beta_0\mathbf{1}-\beta_1\mathbf{c})=0$, which gives $\sum_ic_i\big((r_i-\bar r)-\beta_1(c_i-\bar c)\big)=0$. Since $\sum_i\bar c\,(r_i-\bar r)=0$ and $\sum_i\bar c\,(c_i-\bar c)=0$, $c_i$ may be replaced by $c_i-\bar c$, and solving for $\beta_1$ gives the formula.

**The hat matrix.** With independent columns, the fitted values are $\hat{\mathbf{b}}=\mathbf{H}\mathbf{b}$ with $\mathbf{H}=\mathbf{A}(\mathbf{A}^{\mathsf T}\mathbf{A})^{-1}\mathbf{A}^{\mathsf T}$. $\mathbf{H}$ is the projection onto the column space: it is symmetric and $\mathbf{H}^2=\mathbf{H}$. For a single unit column $\hat{\mathbf{u}}$ it reduces to Lesson 4's $\hat{\mathbf{u}}\hat{\mathbf{u}}^{\mathsf T}$.

## The pseudoinverse and numerical stability

**Definition: pseudoinverse**

The **pseudoinverse** $\mathbf{A}^{+}$ gives a least-squares solution $\hat{\mathbf{x}}=\mathbf{A}^{+}\mathbf{b}$ for a matrix of any shape.

- If $\mathbf{A}$ is square and invertible, $\mathbf{A}^{+}=\mathbf{A}^{-1}$.
- If $\mathbf{A}$ is tall with independent columns, $\mathbf{A}^{+}=(\mathbf{A}^{\mathsf T}\mathbf{A})^{-1}\mathbf{A}^{\mathsf T}$.
- If there are many least-squares solutions, $\mathbf{A}^{+}\mathbf{b}$ is the **shortest** one.

**Why it is true: the shortest solution has no null component**

All solutions have the form $\mathbf{x}_0+\mathbf{n}$ with $\mathbf{A}\mathbf{n}=\mathbf{0}$. Split $\mathbf{x}_0$ into a part orthogonal to every null direction plus a part along them, and absorb the second part into $\mathbf{n}$: every solution is then $\mathbf{x}^\star+\mathbf{n}$ with $\mathbf{x}^\star$ orthogonal to all null directions.

By Pythagoras, $\lVert\mathbf{x}^\star+\mathbf{n}\rVert^2=\lVert\mathbf{x}^\star\rVert^2+\lVert\mathbf{n}\rVert^2$, which is smallest when $\mathbf{n}=\mathbf{0}$. For $3w_1+w_2=7$, the null direction is $(1,\ -3)$ and the shortest solution is $(2.1,\ 0.7)$, of length $2.21$: the green point in the figure above.

**Common pitfall**

The shortest solution is a *choice*, not something the data determined. With fewer observations than unknowns, part of any reported answer is an assumption. The exercise notebook shows what that does to a decoder trained on fewer time bins than it has weights.

### Why solvers avoid the normal equations

**Key point**

$\kappa(\mathbf{A}^{\mathsf T}\mathbf{A})=\kappa(\mathbf{A})^2$. Forming $\mathbf{A}^{\mathsf T}\mathbf{A}$ doubles the number of digits that can be lost.

The full proof uses the singular value decomposition, built up in Lessons 6–7. The idea is that $\mathbf{A}^{\mathsf T}\mathbf{A}$ applies $\mathbf{A}$'s stretching twice, so each stretch factor is squared, and so is the ratio between the largest and smallest. For a diagonal $\mathbf{A}=\operatorname{diag}(d_1,\dots,d_n)$ it is immediate: $\mathbf{A}^{\mathsf T}\mathbf{A}=\operatorname{diag}(d_1^2,\dots,d_n^2)$.

The notebook shows the consequence with polynomial columns $1, c, \dots, c^{10}$ for $c\in[0,1]$:

- $\kappa(\mathbf{X})=2\times10^7$ becomes $\kappa(\mathbf{X}^{\mathsf T}\mathbf{X})=4\times10^{14}$.
- On exact data, the normal equations recover the coefficients to within $4\times10^{-4}$.
- `np.linalg.lstsq`, which works with $\mathbf{X}$ directly (through the QR or singular value decomposition), recovers them to within $8\times10^{-11}$.

**In practice**

Use `np.linalg.lstsq` (or scikit-learn's linear regression, which does the same). Centre and scale continuous columns (Lesson 3) to improve conditioning, and avoid nearly duplicate columns. Keep the normal equations for derivations, not for computation.

## Design matrices

A **design matrix** $\mathbf{X}$ has one row per observation (a trial, a time bin) and one column per **regressor**: a quantity the model may use to explain the response. Least squares fits $\mathbf{y}\approx\mathbf{X}\boldsymbol\beta$, one coefficient per column. Building $\mathbf{X}$ is where the modelling decisions are made.

**Intercept.** A column of ones (Lesson 4's augmented-matrix trick) gives the model a baseline. Without it the fit is forced through the origin.

**Units.** Since $y_i=\sum_j x_{ij}\beta_j$, each $\beta_j$ has units of (units of $y$)/(units of column $j$). Rescaling a column by $c$ rescales its coefficient by $1/c$ and leaves the fitted values unchanged.

**Categorical variables.** A variable with $K$ categories, such as the condition left / right / no-go, is coded with **indicator** columns (also called one-hot or dummy columns): 1 if the observation is in that category and 0 otherwise. With an intercept, use $K-1$ indicators. The omitted category is the **reference**, and each indicator coefficient is a difference from it.

**Key point**

**The dummy-variable trap.** An intercept plus all $K$ indicators gives dependent columns, because the indicators add up to the column of ones. The design matrix loses rank, and the coefficients are no longer unique, though the fitted values are.

**Interactive figure.** A simulated neuron in three conditions (left, right, no-go) at four contrasts. With left as the reference, the coefficients are unique. With all three indicators, you can add any amount c to the intercept and subtract it from every indicator: the bars move, but the fitted lines do not.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=05&ix=dummy-trap&t=A%20simulated%20neuron%20in%20three%20conditions%20%28left%2C%20right%2C%20no-go%29%20at%E2%80%A6)

**Why it is true: different coefficients, same fit**

Every observation lies in exactly one category, so $\sum_k\text{is}_k=\mathbf{1}$. For any $c$, adding $c$ to the intercept and subtracting $c$ from every indicator coefficient changes each fitted value by $c\cdot1-c\sum_k\text{is}_k=c-c=0$. Infinitely many coefficient vectors therefore give identical predictions, so none of them can be interpreted on its own.

**Worked example: condition and contrast**

In the notebook's simulated neuron, the columns are intercept, contrast, is_right and is_nogo, with left as the reference. The fitted coefficients are:

- intercept $10.07$ spikes/s (the left condition at zero contrast);
- contrast $11.84$ spikes/s per unit contrast;
- right − left $=+6.21$ spikes/s;
- no-go − left $=-4.25$ spikes/s.

The true values were $10$, $12$, $+6$ and $-4$. Adding is_left as a fifth column leaves the rank at 4 and makes $\kappa(\mathbf{X}^{\mathsf T}\mathbf{X})$ jump from 19 to $4\times10^{16}$.

With a single contrast column, the model assumes contrast has the same effect in every condition: the three lines are parallel. **Interaction** columns, such as contrast × is_right, relax that assumption. Every column is a hypothesis about how the response works.

## Residuals, R², and honest evaluation

**Definition: R²**

With fitted values $\hat{\mathbf{y}}=\mathbf{X}\hat{\boldsymbol\beta}$ and residuals $\mathbf{r}=\mathbf{y}-\hat{\mathbf{y}}$,

$$R^2=1-\frac{\text{SSE}}{\text{SST}},\qquad \text{SSE}=\lVert\mathbf{r}\rVert^2,\quad \text{SST}=\lVert\mathbf{y}-\bar y\mathbf{1}\rVert^2 .$$

$R^2$ is the fraction of the response's variance that the model explains: 1 for a perfect fit, 0 for a model no better than predicting the mean.

**Key point**

For a least-squares fit *with an intercept*, $\text{SST}=\text{SSR}+\text{SSE}$ with $\text{SSR}=\lVert\hat{\mathbf{y}}-\bar y\mathbf{1}\rVert^2$, so $0\le R^2\le1$ on the training data. On new data, $R^2$ can be negative: the model can do worse than predicting the mean.

**Why it is true: the variance decomposition**

$\mathbf{y}-\bar y\mathbf{1}=(\hat{\mathbf{y}}-\bar y\mathbf{1})+\mathbf{r}$. Both $\hat{\mathbf{y}}$ and $\mathbf{1}$ lie in the column space (the intercept column is $\mathbf{1}$), so $\hat{\mathbf{y}}-\bar y\mathbf{1}$ does too, and the residual is orthogonal to it. Pythagoras gives $\text{SST}=\text{SSR}+\text{SSE}$, so $\text{SSE}\le\text{SST}$.

**Residuals reveal missing structure.** Least squares always returns *some* answer, even for the wrong model. If the model is adequate, residuals plotted against the fitted values or any regressor look like structureless noise. A curve or a funnel means something is missing.

Real visual neurons' contrast responses **saturate**: they rise steeply at low contrast and flatten at high contrast. A straight line fitted to such a response gets $R^2=0.76$, which looks respectable, yet its residuals are negative, then positive, then negative.

![Left: training trials from a saturating contrast response (blue dots), the true curve (grey dashed) and the best straight line (vermilion). Right: the line's residuals (vermilion) against its fitted values. They curve from negative to positive and back: a pattern, not noise.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson05/cell041_1.svg)
*Left: training trials from a saturating contrast response (blue dots), the true curve (grey dashed) and the best straight line (vermilion). Right: the line's residuals (vermilion) against its fitted values. They curve from negative to positive and back: a pattern, not noise.*

**Key point**

Adding a column never increases the training SSE.

**Why it is true: more columns, never worse on training data**

The old least-squares solution, with coefficient 0 on the new column, is still available to the larger model. So the larger model's minimum SSE is at most the old one.

This is why training error cannot be used to choose a model: it always prefers the most flexible one. Push far enough and the model bends to chase the noise in the training data, which is called **overfitting**. The honest measure is the error on **new** data that played no part in the fit.

**Interactive figure.** Polynomial fits of degree 0 to 12 to 20 training trials (blue) from a saturating response. The vermilion dots are 100 new test trials that the fit never sees. Training error only falls as the degree grows; test error falls to a minimum around degrees 3–6 and then roughly doubles. Press Play to step through the degrees.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=05&ix=overfit&t=Polynomial%20fits%20of%20degree%200%20to%2012%20to%2020%20training%20trials%20%28blue%29%E2%80%A6)

**In practice**

- Split the data before fitting. Use a **validation** set to make choices (degree, regressors, which neurons, preprocessing), and the **test** set once, for the final report.
- Every statistic computed from the data, including centring and scaling constants, is part of the fit: compute it on the training data only (Lesson 3).
- For time series, split by time. Neighbouring time bins are similar, and a random split would leak information from the test set into the training set.

## Mini-lab: a least-squares decoder for real motor cortex

In Lesson 4 we decoded with matrices built from an encoding model. Here we fit a decoder directly to data.

**The data.** One session of [Steinmetz et al. (2019)](https://doi.org/10.1038/s41586-019-1787-x) (data released under CC0): 447 neurons in mouse primary motor cortex (MOp), recorded while the mouse turned a wheel with its front paws to report which of two screens had the higher contrast. There are 342 trials of 2.5 s each, regrouped into 50 ms bins.

**The model.** The decoder predicts the wheel velocity $v_t$ (encoder steps/s) from the neurons' rates in the same bin:

$$\hat v_t=\beta_0+\sum_i\beta_i\,r_{i,t}.$$

The design matrix $\mathbf{X}$ has one row per time bin, an intercept column and one column per neuron. The first 171 trials are used for training and the other 171 for testing.

**A rank-deficient design.** The 448-column training design matrix has rank 438 and a condition number of $3\times10^{19}$. Ten neurons never fire in the training trials, so their columns are all zeros and the training data say nothing about their weights. (Together they fire 119 spikes in the test trials.) Dropping those columns, a decision made from the training data only, gives a full-rank design with 438 columns and $\kappa\approx10^3$.

**Results on the held-out trials.** History columns hold each neuron's rate in earlier bins of the same trial.

| activity used | columns | training $R^2$ | test $R^2$ |
|---|---|---|---|
| current bin only | 438 | 0.853 | 0.745 |
| 2 bins (100 ms) | 875 | 0.904 | 0.777 |
| 3 bins (150 ms) | 1312 | 0.922 | 0.738 |

One extra bin helps. A second extra bin raises the training $R^2$ again but lowers the test $R^2$: with 1312 weights and about 8200 training rows, the decoder starts fitting noise. This is the overfitting curve again, on real data.

**Against the projection decoder.** Lessons 2 and 4 decoded by projection: fit each neuron's encoding slope $e_i$ from $r_i\approx b_i+e_iv$, then read out $\hat v=\bar v+\mathbf{e}\cdot(\mathbf{r}-\mathbf{b})/(\mathbf{e}\cdot\mathbf{e})$.

**Interactive figure.** Ten held-out trials placed end to end: the true wheel velocity (black) against the least-squares decoder (blue) and the projection decoder (vermilion), both using one 50 ms bin of activity. Switch between them. The projection decoder follows the timing but swings far too wide.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=05&ix=decoder&t=Ten%20held-out%20trials%20placed%20end%20to%20end%3A%20the%20true%20wheel%20velocity%E2%80%A6)

On the same held-out bins, the projection decoder's output correlates $0.57$ with the true velocity, but its spread is far too large (standard deviation 717 against 410 steps/s), and its test $R^2$ is $-1.09$. Least squares reaches $0.75$, with a correlation of $0.87$.

Why does least squares win? The projection decoder adds up 437 noisy contributions as if each neuron's noise were independent and equally large, and its weights come from 437 separate one-neuron fits. Least-squares weights are, by construction, the best linear weights for the training data given *all* the neurons together: no other choice of $\boldsymbol\beta$ gives a smaller training error. Whether that advantage carries over to new data depends on having enough data per weight.

**Common pitfall**

Neighbouring 50 ms bins are strongly correlated, so 8550 training bins carry far less independent information than 8550 separate trials would. Motor-cortex activity also reflects the stimulus, licking and other movements that go with wheel turns. The model is linear and ignores movement dynamics; real brain–computer interfaces add **regularisation** (Lesson 15) and dynamical models. Good decoding shows that the information is present, not how the brain uses it.

## Where this appears in neuroscience and machine learning

**The general linear model of fMRI.** Every voxel's time series is fitted by least squares with the same design matrix: task regressors convolved with a haemodynamic response, plus nuisance columns for head motion and slow drift. The coefficient maps are the "activations" reported in fMRI studies, and the dummy-variable trap and collinear regressors are classic pitfalls there.

**Encoding models.** A neuron's rate is regressed on stimulus features (contrast, orientation indicators, running speed, recent stimulus history) to ask which features drive it. The residuals show what the features miss.

**Decoders.** Brain–computer interfaces map population activity to cursor or arm velocity with fitted linear decoders, usually with history columns and regularisation.

**Machine learning.** Linear regression *is* least squares. The final readout layer of many models is a least-squares fit, as in reservoir computing and kernel methods. Train/validation/test splitting, feature engineering and one-hot encoding are standard practice. When there are more parameters than data points, ridge regularisation and the minimum-norm behaviour of the pseudoinverse underlie the modern "double descent" phenomenon.

**Common pitfall**

**Common mistakes to avoid.**

- **Inverting to solve.** Use `np.linalg.solve` for square systems and `np.linalg.lstsq` for least squares, not `inv`.
- **Using the normal equations numerically.** They square the condition number.
- **Forgetting the intercept.** The fit is then forced through zero, the residuals need not sum to zero, and $R^2$ can mislead.
- **Reading coefficients without units or without the reference.** An indicator coefficient is a *difference* from the reference category, in the units of the response.
- **Collinear or ill-conditioned designs.** Nearly duplicate regressors give unstable, uninterpretable coefficients even when the fit looks fine.
- **Touching the test set more than once,** or computing preprocessing statistics on it.
- **Random splits of time series.** Split by time.
- **Trusting a fit with more parameters than observations.** It can fit the training data perfectly and still predict worse than the mean.

## Lesson summary

- $\mathbf{A}\mathbf{x}=\mathbf{b}$: rows are lines or planes that must meet; columns must mix to give $\mathbf{b}$. A solution exists if and only if $\operatorname{rank}[\mathbf{A}\mid\mathbf{b}]=\operatorname{rank}\mathbf{A}$, and it is unique if, in addition, $\operatorname{rank}\mathbf{A}=n$.
- Elimination with pivoting and back substitution solves square systems; `solve` beats `inv`.
- $\kappa(\mathbf{A})=\lVert\mathbf{A}\rVert\lVert\mathbf{A}^{-1}\rVert$ bounds how much errors are amplified; $10^k$ means up to $k$ digits lost. Nearly redundant experiments are ill-conditioned.
- Overdetermined systems usually have no exact solution; underdetermined ones have a solution plus any null direction.
- Least squares minimises $\lVert\mathbf{b}-\mathbf{A}\mathbf{x}\rVert^2$. The minimiser makes the residual orthogonal to the columns, $\mathbf{A}^{\mathsf T}\mathbf{A}\hat{\mathbf{x}}=\mathbf{A}^{\mathsf T}\mathbf{b}$, and $\mathbf{A}\hat{\mathbf{x}}$ is the projection of $\mathbf{b}$.
- The pseudoinverse gives the least-squares solution for any shape, and the shortest one when it is not unique. $\kappa(\mathbf{A}^{\mathsf T}\mathbf{A})=\kappa(\mathbf{A})^2$, so use `lstsq`.
- Design matrices: an intercept, units ($\beta$ in response units per regressor unit), $K-1$ indicators with a reference, and interactions as hypotheses.
- With an intercept, $\text{SST}=\text{SSR}+\text{SSE}$ and $0\le R^2\le1$ on training data; adding columns never hurts training error; evaluate on held-out data.
- On real mouse motor cortex, a least-squares decoder of wheel velocity reaches a test $R^2$ of $0.75$ from one 50 ms bin and $0.78$ with 100 ms of activity; the projection decoder's scale is badly off ($R^2=-1.09$).

## Further reading

- G. Strang, *Introduction to Linear Algebra*, 6th ed., Wellesley–Cambridge Press, 2023. Chapter 2 (elimination) and Chapter 4 (orthogonality and least squares).
- L. N. Trefethen and D. Bau, *Numerical Linear Algebra*, SIAM, 1997. Lectures 11–12 on least squares and conditioning.
- K. J. Friston et al., "Statistical parametric maps in functional imaging: a general linear approach", *Human Brain Mapping* 2:189–210, 1994. The general linear model of fMRI.
- J. I. Glaser et al., "Machine learning for neural decoding", *eNeuro* 7(4), 2020. Linear and nonlinear decoders compared on motor-cortex data.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
- M. Belkin, D. Hsu, S. Ma and S. Mandal, "Reconciling modern machine-learning practice and the classical bias–variance trade-off", *PNAS* 116(32):15849–15854, 2019. Double descent.
