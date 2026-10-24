---
summary: "What happens when a matrix is applied again and again: eigenvectors and eigenvalues, complex eigenvalues as rotation, modes and power iteration, symmetric matrices, stability in discrete and continuous time, neural integrators, and the dynamics of real motor cortex."
---

::: objectives
- What an eigenvector and an eigenvalue are: a direction a matrix only stretches, and by how much
- How to find eigenvalues from the characteristic equation, and the $2\times2$ shortcut through the trace and determinant
- What real, repeated and complex eigenvalues mean geometrically, and what a defective matrix is
- How diagonalisation splits repeated application of a matrix into independent modes, and why power iteration finds the dominant one
- Why symmetric matrices have real eigenvalues and orthogonal eigenvectors, and what the Rayleigh quotient is
- How the spectral radius decides whether a discrete-time network decays, persists or explodes, and how to read timescales and frequencies from eigenvalues
- How the same ideas work in continuous time, for linear rate networks and neural integrators, and why simple simulations can be unstable
- How to fit a dynamics matrix to real motor-cortex activity, read its eigenvalues, and check them against controls
:::

**Before you start.** This reading is the mathematical companion to the Lesson 6 teaching notebook. You need Lessons 2–5: dot products, length and orthogonality (Lesson 2), symmetric matrices and transposes (Lesson 3), matrix products, determinants, inverses and rotation matrices (Lesson 4), and least squares (Lesson 5). One section uses complex numbers $a+ib$ with $i^2=-1$; everything you need is restated there. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\mathbf{A}\mathbf{v}=\lambda\mathbf{v}$ | $\mathbf{v}\neq\mathbf{0}$ is an eigenvector of $\mathbf{A}$ with eigenvalue $\lambda$ |
| $\operatorname{tr}\mathbf{A}$, $\det\mathbf{A}$ | the trace (sum of the diagonal entries) and the determinant |
| $\mathbf{V}$, $\boldsymbol\Lambda$ | eigenvectors as columns; eigenvalues on a diagonal |
| $\rho(\mathbf{A})$ | the spectral radius, $\max_i\lvert\lambda_i\rvert$ |
| $\mathbf{x}_t$, $\mathbf{x}(t)$ | the population state (rates relative to baseline) at step $t$, or at time $t$ |
| $\Delta t$, $\tau$, $f$ | time step; decay time constant; oscillation frequency |
| $\tau_n$, $\mu$ | a single neuron's time constant; an eigenvalue of the weight matrix $\mathbf{W}$ |
| $\lvert z\rvert$, $\arg z$ | the modulus and angle of a complex number $z$ |

## The problem: three recurrent networks, three fates

Two neurons excite and inhibit each other. Their rates, relative to baseline, form $\mathbf{x}_t\in\mathbb{R}^2$, and each time step applies the same weight matrix: $\mathbf{x}_{t+1}=\mathbf{W}\mathbf{x}_t$, so $\mathbf{x}_t=\mathbf{W}^t\mathbf{x}_0$. Lesson 4 described what a matrix does *once*. Recurrent circuits apply it again and again, and three small matrices already show three fates:

$$\mathbf{W}_{\text{decay}}=\begin{pmatrix}0.6&0.2\\0.1&0.7\end{pmatrix},\qquad
\mathbf{W}_{\text{grow}}=\begin{pmatrix}0.9&0.4\\0.2&1.0\end{pmatrix},\qquad
\mathbf{W}_{\text{osc}}=0.95\,\mathbf{R}(20^\circ).$$

{{ figure: cell007_1.svg | The same starting perturbation under the three weight matrices, for neuron 1 (solid) and neuron 2 (dashed). The panel titles give the eigenvalues: both inside the unit circle (decay, left), one outside (growth, middle), and a complex pair of modulus 0.95 (a decaying oscillation, right). }}

You cannot read the fate from the entries: $\mathbf{W}_{\text{grow}}$ has no entry above 1, and still explodes. The **eigenvalues** tell you. This lesson explains why, and how to read timescales and oscillation frequencies from them without simulating anything.

## Eigenvectors: directions a matrix only stretches

::: definition Definition: eigenvector and eigenvalue
A nonzero vector $\mathbf{v}$ is an **eigenvector** of a square matrix $\mathbf{A}$ if

$$\mathbf{A}\mathbf{v}=\lambda\mathbf{v}$$

for some number $\lambda$, its **eigenvalue**. The output points along the input: $\mathbf{A}$ stretches $\mathbf{v}$ by $\lambda$ (and flips it if $\lambda<0$), without turning it.
:::

Most inputs are turned by a matrix. Eigenvectors are the special directions that are not. ("Eigen" is German for "own": the matrix's own directions.)

{{ interactive: eig-hunt | Turn the input x (black) around the unit circle and watch the output A x (blue). The dashed curve shows every possible output. Only along the eigenvector directions does A x line up with x; it then turns green. The rotation has no real eigenvector at all. }}

Eigenvectors are defined only up to scale: if $\mathbf{A}\mathbf{v}=\lambda\mathbf{v}$, then $\mathbf{A}(c\mathbf{v})=\lambda(c\mathbf{v})$ for any $c\neq0$. Software returns them scaled to length 1, with an arbitrary sign. The zero vector is excluded because $\mathbf{A}\mathbf{0}=\lambda\mathbf{0}$ for every $\lambda$.

For $\mathbf{A}_1=\begin{pmatrix}2&1\\1&2\end{pmatrix}$, $\mathbf{A}_1(1,\ 1)=(3,\ 3)$ and $\mathbf{A}_1(-1,\ 1)=(-1,\ 1)$: eigenvalues 3 and 1. Every other input is turned.

::: note In practice
`lam, V = np.linalg.eig(A)` returns the eigenvalues as a 1-D array and the eigenvectors as the *columns* of `V`: `V[:, k]` goes with `lam[k]`. The order is not sorted. For a symmetric matrix use `np.linalg.eigh`, which returns real eigenvalues in increasing order.
:::

## Finding eigenvalues: the characteristic equation

$\mathbf{A}\mathbf{v}=\lambda\mathbf{v}$ is the same as $(\mathbf{A}-\lambda\mathbf{I})\mathbf{v}=\mathbf{0}$ with $\mathbf{v}\neq\mathbf{0}$. By Lesson 4, a matrix sends a nonzero vector to zero exactly when it is singular, that is, when its determinant is zero. So the eigenvalues are the roots of the **characteristic equation**

$$\det(\mathbf{A}-\lambda\mathbf{I})=0 .$$

For an $n\times n$ matrix the left side is a polynomial of degree $n$, so there are $n$ eigenvalues, counted with repetition, some possibly complex. Once $\lambda$ is known, the eigenvectors are the nonzero solutions of $(\mathbf{A}-\lambda\mathbf{I})\mathbf{v}=\mathbf{0}$: its null directions (Lesson 5).

::: keypoint
For a $2\times2$ matrix,

$$\lambda^2-(\operatorname{tr}\mathbf{A})\,\lambda+\det\mathbf{A}=0,\qquad
\lambda=\frac{\operatorname{tr}\mathbf{A}\pm\sqrt{\operatorname{tr}^2\mathbf{A}-4\det\mathbf{A}}}{2},$$

and for any square matrix, $\lambda_1+\cdots+\lambda_n=\operatorname{tr}\mathbf{A}$ and $\lambda_1\cdots\lambda_n=\det\mathbf{A}$.
:::

::: note Why it is true: the 2 × 2 characteristic equation
With $\mathbf{A}=\begin{pmatrix}a&b\\c&d\end{pmatrix}$,

$$\det\begin{pmatrix}a-\lambda&b\\c&d-\lambda\end{pmatrix}=(a-\lambda)(d-\lambda)-bc=\lambda^2-(a+d)\lambda+(ad-bc).$$

If the roots are $\lambda_1,\lambda_2$, the polynomial factors as $(\lambda-\lambda_1)(\lambda-\lambda_2)=\lambda^2-(\lambda_1+\lambda_2)\lambda+\lambda_1\lambda_2$. Matching coefficients gives $\lambda_1+\lambda_2=a+d=\operatorname{tr}\mathbf{A}$ and $\lambda_1\lambda_2=ad-bc=\det\mathbf{A}$.

The same matching works for $n\times n$: the constant term of $\det(\mathbf{A}-\lambda\mathbf{I})$ is $\det\mathbf{A}$ (set $\lambda=0$), and the $\lambda^{n-1}$ term collects only the diagonal entries.
:::

::: example Worked example: the decaying network
$\mathbf{W}_{\text{decay}}$ has $\operatorname{tr}=1.3$ and $\det=0.42-0.02=0.40$, so $\lambda^2-1.3\lambda+0.4=0$ and

$$\lambda=\frac{1.3\pm\sqrt{1.69-1.6}}{2}=\frac{1.3\pm0.3}{2}:\qquad \lambda_1=0.8,\quad \lambda_2=0.5.$$

**Eigenvector for 0.8.** $\mathbf{W}-0.8\mathbf{I}=\begin{pmatrix}-0.2&0.2\\0.1&-0.1\end{pmatrix}$, so $v_1=v_2$ and $\mathbf{v}_1=(1,\ 1)$.

**Eigenvector for 0.5.** $\mathbf{W}-0.5\mathbf{I}=\begin{pmatrix}0.1&0.2\\0.1&0.2\end{pmatrix}$, so $\mathbf{v}_2=(2,\ -1)$.

Both eigenvalues lie between 0 and 1: both directions shrink at every step.
:::

### Three kinds of eigenvalue

The **discriminant** $\operatorname{tr}^2\mathbf{A}-4\det\mathbf{A}$ sorts $2\times2$ matrices:

- **positive:** two different real eigenvalues, and two eigenvector directions;
- **zero:** one repeated eigenvalue;
- **negative:** a complex-conjugate pair $a\pm ib$, and no real eigenvector: the matrix turns every direction.

**Repeated eigenvalues come in two kinds.** $2\mathbf{I}$ has eigenvalue 2 twice, and every vector is an eigenvector. The **shear** $\begin{pmatrix}1&1\\0&1\end{pmatrix}$ has eigenvalue 1 twice, but $\mathbf{A}-\mathbf{I}=\begin{pmatrix}0&1\\0&0\end{pmatrix}$ sends only the direction $(1,\ 0)$ to zero, so there is only one eigenvector direction. Such a matrix is called **defective**. Defective matrices are rare in data (an arbitrarily small change separates the eigenvalues), but they behave differently, as one of the exercises shows.

{{ interactive: trace-det | Every 2 × 2 matrix is a point in the trace–determinant plane. Drag the purple point: above the dashed parabola the eigenvalues are complex, below it real; inside the green triangle both lie inside the unit circle (middle panel), so repeated application decays (right panel). The grey dots are the three networks above and a pure 20° rotation: W grow sits just outside the triangle. }}

::: quiz
? A $2\times2$ matrix has trace 4 and determinant 3. What are its eigenvalues?
- [ ] 4 and 3
- [x] 3 and 1
- [ ] 2 and 2
- [ ] $2\pm i$
> They add up to the trace (4) and multiply to the determinant (3): 3 and 1. Check: $\lambda^2-4\lambda+3=(\lambda-3)(\lambda-1)$.

? A $2\times2$ matrix has $\operatorname{tr}^2-4\det<0$. What does it do to directions?
- [ ] It leaves two directions unturned.
- [x] It turns every direction: there is no real eigenvector.
- [ ] It squashes the plane onto a line.
> A negative discriminant means a complex pair of eigenvalues, which is rotation (next section).
:::

## Complex eigenvalues mean rotation

A complex number $z=a+ib$ is a point $(a,\ b)$ in the plane. Its **modulus** $\lvert z\rvert=\sqrt{a^2+b^2}$ is its distance from 0, and its **angle** $\arg z$ is measured from the positive real axis, so $z=\lvert z\rvert(\cos\theta+i\sin\theta)=\lvert z\rvert e^{i\theta}$. Multiplying by $z$ scales by $\lvert z\rvert$ and rotates by $\theta$; so $z^t$ has modulus $\lvert z\rvert^t$ and angle $t\theta$.

The rotation $\mathbf{R}(\theta)$ of Lesson 4 turns every direction, so it has no real eigenvector. Its trace is $2\cos\theta$ and its determinant is 1, and the characteristic equation gives

$$\lambda=\cos\theta\pm\sqrt{\cos^2\theta-1}=\cos\theta\pm i\sin\theta=e^{\pm i\theta}.$$

::: keypoint
A real $2\times2$ matrix with complex eigenvalues $re^{\pm i\theta}$ acts, in suitable coordinates, as "rotate by $\theta$ and scale by $r$". Applied repeatedly, it traces a spiral: inwards if $r<1$, a closed orbit if $r=1$, outwards if $r>1$. One full turn takes $360^\circ/\theta$ steps.
:::

{{ interactive: spiral | The matrix r R(θ) applied again and again, starting from (1, 0) (black). The angle θ sets how many steps one turn takes; only the modulus r decides whether the spiral closes in, circles or flies out. Press Play to watch the steps. }}

::: note Why it is true: the rotation–scaling form
Let $\lambda=re^{i\theta}$ with $\theta\neq0$ and eigenvector $\mathbf{v}=\mathbf{p}+i\mathbf{q}$ ($\mathbf{p},\mathbf{q}$ real). Take the real and imaginary parts of $\mathbf{A}\mathbf{v}=\lambda\mathbf{v}$, with $\lambda=r\cos\theta+ir\sin\theta$:

$$\mathbf{A}\mathbf{p}=r\cos\theta\,\mathbf{p}-r\sin\theta\,\mathbf{q},\qquad
\mathbf{A}\mathbf{q}=r\sin\theta\,\mathbf{p}+r\cos\theta\,\mathbf{q}.$$

In the basis $(\mathbf{p},\mathbf{q})$ the matrix is therefore $r\begin{pmatrix}\cos\theta&\sin\theta\\-\sin\theta&\cos\theta\end{pmatrix}=r\,\mathbf{R}(-\theta)$: a rotation and a uniform scaling.

The basis $(\mathbf{p},\mathbf{q})$ is generally not orthogonal, so in the original coordinates the spirals are stretched into ellipses. But the number of steps per turn and the shrinkage per step are exactly $360^\circ/\theta$ and $r$.
:::

In neural terms, a complex pair means two populations driving each other with a lag, the classic excitation–inhibition loop, and the angle sets the oscillation period.

## Diagonalisation and mode decomposition

Suppose an $n\times n$ matrix has $n$ independent eigenvectors (always true when its eigenvalues are all different). Put them as the columns of $\mathbf{V}$ and the eigenvalues on the diagonal of $\boldsymbol\Lambda$. The $n$ equations $\mathbf{A}\mathbf{v}_i=\lambda_i\mathbf{v}_i$ are, column by column, the single matrix equation $\mathbf{A}\mathbf{V}=\mathbf{V}\boldsymbol\Lambda$. Since $\mathbf{V}$ is invertible,

$$\mathbf{A}=\mathbf{V}\boldsymbol\Lambda\mathbf{V}^{-1}\qquad\text{and}\qquad \mathbf{A}^t=\mathbf{V}\boldsymbol\Lambda^t\mathbf{V}^{-1}.$$

::: note Why it is true: powers of a diagonalised matrix
$\mathbf{A}^2=\mathbf{V}\boldsymbol\Lambda\mathbf{V}^{-1}\mathbf{V}\boldsymbol\Lambda\mathbf{V}^{-1}=\mathbf{V}\boldsymbol\Lambda^2\mathbf{V}^{-1}$, because the inner $\mathbf{V}^{-1}\mathbf{V}=\mathbf{I}$ cancels; repeating gives $\mathbf{A}^t=\mathbf{V}\boldsymbol\Lambda^t\mathbf{V}^{-1}$. And $\boldsymbol\Lambda^t$ is diagonal with entries $\lambda_i^t$: a power of a diagonal matrix is computed entry by entry.
:::

::: keypoint
**Mode decomposition.** Write the starting state in the eigenvector basis, $\mathbf{x}_0=c_1\mathbf{v}_1+\cdots+c_n\mathbf{v}_n$ (that is, $\mathbf{c}=\mathbf{V}^{-1}\mathbf{x}_0$). Then

$$\mathbf{x}_t=\mathbf{A}^t\mathbf{x}_0=c_1\lambda_1^t\mathbf{v}_1+\cdots+c_n\lambda_n^t\mathbf{v}_n .$$

Each term is a **mode**: a fixed pattern of activity $\mathbf{v}_i$ whose size is multiplied by $\lambda_i$ at every step, independently of the others.
:::

The modes do not interact: a coupled $n$-neuron network behaves like $n$ separate one-number systems $c\mapsto\lambda c$, seen through the change of basis $\mathbf{V}$. As $t$ grows, the mode with the largest $\lvert\lambda_i\rvert$ dominates, and activity lines up with its eigenvector.

::: example Worked example: two modes
$\mathbf{A}_4=\begin{pmatrix}0.8&0.3\\0.1&0.6\end{pmatrix}$ has $\operatorname{tr}=1.4$ and $\det=0.45$, so eigenvalues $0.9$ and $0.5$, with eigenvectors along $(3,\ 1)$ and $(1,\ -1)$.

The notebook starts from $\mathbf{x}_0=(-0.4,\ 1)$, which is $0.474\,\mathbf{v}_1+1.202\,\mathbf{v}_2$ in NumPy's unit-length eigenvectors $\mathbf{v}_1=(0.949,\ 0.316)$ and $\mathbf{v}_2=(-0.707,\ 0.707)$.

The fast mode ($\lambda=0.5$) halves at each step; the slow mode ($\lambda=0.9$) loses 10%. After about five steps only the slow mode is left.
:::

{{ interactive: modes | The worked example, step by step. Left: neuron 2's activity (black) is exactly the sum of a slow mode (blue) and a fast mode (vermilion), each shrinking by its own factor. Right: the same in state space; the two arrows add up to the current state, and once the fast arrow has shrunk away, the state slides along the slow eigenvector. }}

### Power iteration

Because the dominant mode wins, applying $\mathbf{A}$ again and again to almost any starting vector, rescaling to length 1 each time, converges to the dominant eigenvector. The estimate $\lambda\approx\mathbf{v}^{\mathsf T}\mathbf{A}\mathbf{v}$ then gives the eigenvalue.

::: note Why it is true: power iteration converges, and how fast
After $k$ steps,

$$\mathbf{A}^k\mathbf{x}_0=\lambda_1^k\big(c_1\mathbf{v}_1+c_2(\lambda_2/\lambda_1)^k\mathbf{v}_2+\cdots\big).$$

If $\lvert\lambda_1\rvert>\lvert\lambda_2\rvert\ge\cdots$ and $c_1\neq0$, every ratio $(\lambda_i/\lambda_1)^k\to0$, so after rescaling the direction tends to $\mathbf{v}_1$. The error shrinks like $\lvert\lambda_2/\lambda_1\rvert^k$: fast when the dominant eigenvalue is well separated, slow when the top two are close. Rescaling only prevents overflow or underflow; it does not change the direction.
:::

{{ interactive: power-iter | Power iteration on the two-mode matrix, with the second eigenvalue set by the buttons. Left: each purple dot is one rescaled iterate, closing in on the dominant eigenvector (green dashed). Right: the angle error on a log scale falls along a straight line with slope set by |λ₂/λ₁| (grey dashed). }}

Power iteration needs only matrix–vector products, so it works for matrices far too large to store. The original PageRank algorithm ranked web pages this way, and the same idea underlies the methods inside modern eigenvalue software.

## Symmetric matrices

::: keypoint
If $\mathbf{S}=\mathbf{S}^{\mathsf T}$ is real, then:

1. all its eigenvalues are real;
2. eigenvectors for different eigenvalues are orthogonal;
3. it can always be written $\mathbf{S}=\mathbf{Q}\boldsymbol\Lambda\mathbf{Q}^{\mathsf T}$ with $\mathbf{Q}$ orthogonal ($\mathbf{Q}^{\mathsf T}\mathbf{Q}=\mathbf{I}$).

This is the **spectral theorem**.
:::

::: note Why it is true: real eigenvalues and orthogonal eigenvectors
**(1) Real eigenvalues.** Let $\mathbf{S}\mathbf{v}=\lambda\mathbf{v}$, allowing complex $\lambda$ and $\mathbf{v}$, and let $\bar{\mathbf{v}}$ be the complex conjugate. Then $\bar{\mathbf{v}}^{\mathsf T}\mathbf{S}\mathbf{v}=\lambda\,\bar{\mathbf{v}}^{\mathsf T}\mathbf{v}$. Conjugating the eigen-equation (since $\mathbf{S}$ is real) gives $\mathbf{S}\bar{\mathbf{v}}=\bar\lambda\bar{\mathbf{v}}$, and transposing, using $\mathbf{S}^{\mathsf T}=\mathbf{S}$, gives $\bar{\mathbf{v}}^{\mathsf T}\mathbf{S}=\bar\lambda\bar{\mathbf{v}}^{\mathsf T}$. Multiplying on the right by $\mathbf{v}$: $\bar{\mathbf{v}}^{\mathsf T}\mathbf{S}\mathbf{v}=\bar\lambda\,\bar{\mathbf{v}}^{\mathsf T}\mathbf{v}$. So $\lambda\,\bar{\mathbf{v}}^{\mathsf T}\mathbf{v}=\bar\lambda\,\bar{\mathbf{v}}^{\mathsf T}\mathbf{v}$. Since $\bar{\mathbf{v}}^{\mathsf T}\mathbf{v}=\sum_i\lvert v_i\rvert^2>0$, $\lambda=\bar\lambda$: $\lambda$ is real.

**(2) Orthogonal eigenvectors.** Let $\mathbf{S}\mathbf{v}_1=\lambda_1\mathbf{v}_1$ and $\mathbf{S}\mathbf{v}_2=\lambda_2\mathbf{v}_2$ with $\lambda_1\neq\lambda_2$. Then $\lambda_1(\mathbf{v}_1\cdot\mathbf{v}_2)=(\mathbf{S}\mathbf{v}_1)^{\mathsf T}\mathbf{v}_2=\mathbf{v}_1^{\mathsf T}\mathbf{S}^{\mathsf T}\mathbf{v}_2=\mathbf{v}_1^{\mathsf T}\mathbf{S}\mathbf{v}_2=\lambda_2(\mathbf{v}_1\cdot\mathbf{v}_2)$. So $(\lambda_1-\lambda_2)(\mathbf{v}_1\cdot\mathbf{v}_2)=0$, and $\mathbf{v}_1\cdot\mathbf{v}_2=0$.

**(3)**, for repeated eigenvalues, needs more work; any linear algebra text in the further reading proves it.
:::

With $\mathbf{Q}$ orthogonal, $\mathbf{Q}^{-1}=\mathbf{Q}^{\mathsf T}$: the change of basis is a rotation (possibly with a reflection), and nothing is skewed. Symmetric matrices are everywhere in data analysis: covariance matrices (Lesson 7), symmetric connectivity, kernel matrices and Hessians (Lesson 14). The notebook checks all three facts for a random symmetric $4\times4$ matrix. The first example of this lesson, $\begin{pmatrix}2&1\\1&2\end{pmatrix}$, is symmetric, and its eigenvectors $(1,\ 1)$ and $(-1,\ 1)$ are indeed at right angles.

::: keypoint
**Rayleigh quotient.** For a unit vector $\mathbf{u}$, $\lambda_{\min}\le\mathbf{u}^{\mathsf T}\mathbf{S}\mathbf{u}\le\lambda_{\max}$, with equality at the corresponding eigenvectors.
:::

::: note Why it is true: the Rayleigh bounds
Write $\mathbf{u}=\mathbf{Q}\mathbf{a}$; since $\mathbf{Q}$ preserves length, $\lVert\mathbf{a}\rVert=1$. Then $\mathbf{u}^{\mathsf T}\mathbf{S}\mathbf{u}=\mathbf{a}^{\mathsf T}\mathbf{Q}^{\mathsf T}\mathbf{Q}\boldsymbol\Lambda\mathbf{Q}^{\mathsf T}\mathbf{Q}\mathbf{a}=\mathbf{a}^{\mathsf T}\boldsymbol\Lambda\mathbf{a}=\sum_i\lambda_ia_i^2$, a weighted average of the eigenvalues with weights $a_i^2\ge0$ summing to 1. It is largest when all the weight sits on $\lambda_{\max}$.
:::

If $\mathbf{S}$ is a covariance matrix, $\mathbf{u}^{\mathsf T}\mathbf{S}\mathbf{u}$ is the variance of the data projected onto $\mathbf{u}$. The direction of largest variance is therefore the top eigenvector, which is where Lesson 7 begins.

::: note In practice
Eigenvalues also explain Lesson 5's condition number. For a symmetric invertible matrix, $\kappa(\mathbf{S})=\lvert\lambda\rvert_{\max}/\lvert\lambda\rvert_{\min}$. For any matrix $\mathbf{A}$, the eigenvalues of the symmetric matrix $\mathbf{A}^{\mathsf T}\mathbf{A}$ are the squares of the stretch factors that define $\kappa(\mathbf{A})$. The singular value decomposition, later in the course, makes this precise.
:::

## Stability in discrete time

Each mode is multiplied by $\lambda_i$ at every step, so its size changes like $\lvert\lambda_i\rvert^t$. The long-run fate is set by the largest modulus.

::: definition Definition: spectral radius
$\rho(\mathbf{W})=\max_i\lvert\lambda_i\rvert$. For $\mathbf{x}_{t+1}=\mathbf{W}\mathbf{x}_t$:

- $\rho<1$: **stable**. Every mode decays, and activity returns to baseline from any start.
- $\rho=1$: **marginal**. The dominant mode neither grows nor decays: a memory, or a sustained oscillation.
- $\rho>1$: **unstable**. Activity grows without bound from almost any start (in a real circuit, until something saturates).
:::

The stable region is the inside of the unit circle in the complex plane. $\mathbf{W}_{\text{grow}}$ has eigenvalues $0.66$ and $1.24$: the second is outside, so the network explodes, although no weight exceeds 1.

::: keypoint
**Timescale and frequency of a mode.** With time step $\Delta t$, a mode with eigenvalue $\lambda$ decays with time constant $\tau$ and oscillates with frequency $f$:

$$\tau=\frac{-\Delta t}{\ln\lvert\lambda\rvert},\qquad f=\frac{\lvert\arg\lambda\rvert}{2\pi\,\Delta t}.$$
:::

::: note Why it is true: the time constant formula
After $t$ steps, time $t\Delta t$ has passed and the mode's size is $\lvert\lambda\rvert^t=e^{t\ln\lvert\lambda\rvert}$. An exponential decay with time constant $\tau$ has size $e^{-t\Delta t/\tau}$. Equating exponents, $t\ln\lvert\lambda\rvert=-t\Delta t/\tau$, so $\tau=-\Delta t/\ln\lvert\lambda\rvert$.

The angle advances by $\lvert\arg\lambda\rvert$ radians per step, so a full turn ($2\pi$) takes $2\pi/\lvert\arg\lambda\rvert$ steps, that is $2\pi\Delta t/\lvert\arg\lambda\rvert$ seconds, and $f$ is its reciprocal.

For $\lvert\lambda\rvert$ near 1, $\ln\lvert\lambda\rvert\approx\lvert\lambda\rvert-1$, so $\tau\approx\Delta t/(1-\lvert\lambda\rvert)$: halving the distance to the unit circle doubles the timescale.
:::

With $\Delta t=50$ ms: $\lvert\lambda\rvert=0.5$ gives $\tau=0.07$ s, $0.9$ gives $0.47$ s, $0.99$ gives $5.0$ s and $0.999$ gives $50$ s.

### A random recurrent network

Take $N=100$ neurons with independent Gaussian weights of standard deviation $g/\sqrt N$. The **circular law** says that for large $N$ the eigenvalues fill a disc of radius about $g$. For a finite network the radius is only approximately $g$ (the notebook's raw matrix has $\rho=1.056$ for $g=1$), so the notebook rescales it to $\rho=1$ exactly and then multiplies by $g$. The gain alone moves the network through the unit circle.

{{ interactive: random-net | A 100-neuron random network. Left: its 100 eigenvalues and the unit circle; any that escape the circle turn vermilion. Right: the size of activity over 150 steps, on a log scale, from the same random start. Below g = 1 activity decays geometrically; above it, it explodes. Press Play to sweep the gain. }}

At $g=1$ the size of activity settles to a plateau: the other 99 modes decay, and only the dominant mode, with $\lvert\lambda\rvert=1$, persists.

::: quiz
? A network has eigenvalues $0.5$, $-0.97$ and $0.3\pm0.4i$. Is it stable?
- [x] Yes: the spectral radius is 0.97.
- [ ] No: one eigenvalue is negative.
- [ ] No: complex eigenvalues always oscillate for ever.
> Only the moduli matter: 0.5, 0.97 and $\sqrt{0.09+0.16}=0.5$. The largest is 0.97 < 1. The negative eigenvalue makes that mode flip sign each step while it decays.

? With $\Delta t=50$ ms, which eigenvalue modulus gives a timescale of about 1 s?
- [ ] 0.5
- [ ] 0.9
- [x] 0.95
- [ ] 0.999
> $\tau\approx\Delta t/(1-\lvert\lambda\rvert)=0.05/0.05=1$ s. (The exact formula gives 0.97 s.)
:::

## Stability in continuous time

Neurons change continuously. A standard **linear rate network** of $N$ neurons, each with time constant $\tau_n$ (tens of milliseconds), is

$$\tau_n\frac{d\mathbf{x}}{dt}=-\mathbf{x}+\mathbf{W}\mathbf{x}+\mathbf{u}(t),$$

where $-\mathbf{x}$ is each neuron's leak back to baseline, $\mathbf{W}\mathbf{x}$ is recurrent input, and $\mathbf{u}$ is external input. Without input this is $d\mathbf{x}/dt=\mathbf{A}\mathbf{x}$ with $\mathbf{A}=(\mathbf{W}-\mathbf{I})/\tau_n$.

::: keypoint
The solution of $d\mathbf{x}/dt=\mathbf{A}\mathbf{x}$ is $\mathbf{x}(t)=\sum_ic_ie^{\lambda_it}\mathbf{v}_i$. Each mode decays with time constant $1/\lvert\operatorname{Re}\lambda_i\rvert$ and oscillates at frequency $\lvert\operatorname{Im}\lambda_i\rvert/2\pi$. The system is **stable** if and only if every eigenvalue has a **negative real part**: the left half-plane, not the unit disc.
:::

::: note Why it is true: modes in continuous time
Try $\mathbf{x}(t)=c(t)\mathbf{v}$ with $\mathbf{A}\mathbf{v}=\lambda\mathbf{v}$. Then $\dot c\,\mathbf{v}=c\,\mathbf{A}\mathbf{v}=\lambda c\,\mathbf{v}$, so $\dot c=\lambda c$ and $c(t)=c(0)e^{\lambda t}$. Sums of solutions are solutions (the equation is linear), and with $n$ independent eigenvectors any starting state can be matched.

Finally, $\lvert e^{\lambda t}\rvert=e^{(\operatorname{Re}\lambda)t}$, which decays exactly when $\operatorname{Re}\lambda<0$, and $e^{i(\operatorname{Im}\lambda)t}$ turns at $\lvert\operatorname{Im}\lambda\rvert$ radians per second.
:::

::: note Why it is true: eigenvalues of a rate network
If $\mathbf{W}\mathbf{v}=\mu\mathbf{v}$, then $\mathbf{A}\mathbf{v}=(\mathbf{W}\mathbf{v}-\mathbf{v})/\tau_n=\frac{\mu-1}{\tau_n}\mathbf{v}$. So $\mathbf{A}$ has the same eigenvectors as $\mathbf{W}$, and eigenvalues $(\mu-1)/\tau_n$. The network is stable exactly when every eigenvalue of $\mathbf{W}$ has real part below 1. A real mode with $\mu<1$ decays with time constant

$$\tau=\frac{1}{\lvert(\mu-1)/\tau_n\rvert}=\frac{\tau_n}{1-\mu},$$

which is far longer than $\tau_n$ when $\mu$ is close to 1.
:::

**Recurrence creates slow timescales.** With $\tau_n=20$ ms, $\mu=0.95$ gives $\tau=0.4$ s, twenty times longer than any single neuron.

### A neural integrator

If $\mathbf{W}$ has an eigenvalue $\mu=1$ exactly, that mode has $\lambda=0$ in $\mathbf{A}$: it neither decays nor grows, and the network **holds** whatever input pushed it along that direction. It integrates its input.

The notebook's $\mathbf{W}_{\text{int}}=\begin{pmatrix}0.75&0.25\\0.25&0.75\end{pmatrix}$ has $\mu=1$ along $(1,\ 1)$ and $\mu=0.5$ along $(1,\ -1)$, so $\mathbf{A}$ has eigenvalues $0$ and $-25$ s⁻¹.

{{ interactive: integrator | A 50 ms input pulse (grey band) into a two-neuron rate network with τₙ = 20 ms. The slider sets the eigenvalue μ for the pattern (1, 1); the pattern (1, −1) always has μ − 0.5. At μ = 1 an input along (1, 1) is held for ever; at 0.95 it fades over 0.4 s; an input along (1, −1) fades within tens of milliseconds. }}

The brainstem circuit that holds the eyes still between saccades is thought to work this way. How precisely biology tunes $\mu$ to 1 remains a long-standing question.

### From continuous to discrete time, and back

Over one step $\Delta t$, the exact solution multiplies each mode by $e^{\lambda\Delta t}$. So the exact one-step map has eigenvalues $e^{\lambda\Delta t}$. Since $\lvert e^{\lambda\Delta t}\rvert=e^{(\operatorname{Re}\lambda)\Delta t}$, the left half-plane maps into the unit disc: the two stability conditions are the same condition, seen with two different clocks. This also explains the discrete timescale formula: $\lvert\lambda_{\text{disc}}\rvert=e^{-\Delta t/\tau}$ gives $\tau=-\Delta t/\ln\lvert\lambda_{\text{disc}}\rvert$.

::: pitfall
**Euler simulation can invent instability.** The simple update $\mathbf{x}\leftarrow\mathbf{x}+\Delta t\,\mathbf{A}\mathbf{x}$ multiplies by $\mathbf{I}+\Delta t\,\mathbf{A}$, whose eigenvalues are $1+\Delta t\,\lambda$, not $e^{\lambda\Delta t}$. For a real $\lambda<0$ the simulation is stable only if $\lvert1+\Delta t\lambda\rvert<1$, that is, $\Delta t<2/\lvert\lambda\rvert$.

A single neuron's leak with $\tau_n=20$ ms has $\lambda=-50$ s⁻¹. Euler is accurate at $\Delta t=1$ ms (factor $0.95$ against the exact $0.951$), wrong but stable at 30 ms (factor $-0.5$: the sign flips each step), and unstable at 50 ms (factor $-1.5$), although the real system decays. Rule of thumb: keep $\Delta t$ well below the fastest time constant.
:::

{{ interactive: euler | The decay $e^{-50t}$ of one neuron's leak (black) and its Euler simulation (vermilion) for the chosen step. Small steps track the decay; above 20 ms the simulation overshoots and flips sign; above 40 ms it explodes. Press Play to sweep the step size. }}

## Mini-lab: the dynamics of real motor cortex

The recording is the one from Lesson 5: 447 neurons in mouse primary motor cortex while the mouse turned a wheel, 342 trials of 2.5 s in 50 ms bins ([Steinmetz et al., 2019](https://doi.org/10.1038/s41586-019-1787-x); data released under CC0). We ask whether population activity behaves like $\mathbf{x}_{t+1}=\mathbf{A}\mathbf{x}_t$, and what the eigenvalues of $\mathbf{A}$ say.

**Method.**

1. Smooth each neuron's rate within each trial with a Gaussian of standard deviation one bin; centre with the training-trial means; keep the 20 neurons with the largest training variance. The array $\mathbf{Z}$ has shape (342, 50, 20): trial by time bin by neuron, in spikes/s.
2. Fit $\mathbf{A}$ ($20\times20$) by least squares on the first 171 trials, predicting each bin from the previous one in the same trial (Lesson 5): $\min_{\mathbf{A}}\sum_t\lVert\mathbf{x}_{t+1}-\mathbf{A}\mathbf{x}_t\rVert^2$.
3. Read the eigenvalues.
4. Check on the held-out trials, and against two controls.

**Results.** The one-step test $R^2$ is $0.903$, against $0.888$ for the trivial prediction "next bin equals this bin" ($\mathbf{A}=\mathbf{I}$). The spectral radius is $0.927$: the fitted circuit is stable. Eight of the ten possible eigenvalue pairs are complex, so the fitted dynamics rotate, slowly. The slowest mode has $\lambda=0.926+0.042i$, so $\tau=-0.05/\ln0.927=0.66$ s; the next has $\lvert\lambda\rvert=0.918$, $\tau=0.58$ s and a frequency of $0.41$ Hz.

| model fitted to | spectral radius | slowest $\tau$ (s) |
|---|---|---|
| real smoothed activity | 0.927 | 0.66 |
| (a) white noise, smoothed the same way | 0.794 | 0.22 |
| (b) real activity, bins of each training trial shuffled in time | 0.505 | 0.07 |

{{ interactive: eig-real | The eigenvalues of the three fitted 20 × 20 dynamics matrices, close to the right-hand edge of the unit circle (zoomed in). Click any eigenvalue to read off its timescale and frequency; hide a set with its buttons. }}

**Controls.** Smoothing makes neighbouring bins similar by construction, so smoothed noise, which has no dynamics at all, already gives eigenvalues near 0.8 and a timescale of 0.2 s. Shuffling the time order keeps every neuron's rates but destroys their order, and the eigenvalues shrink to about 0.5. So the temporal structure is real, and the real activity is about three times slower than the smoothing alone produces. But part of any timescale measured this way comes from the preprocessing: an exercise in the notebook shows that, across smoothing widths from 0 to 200 ms, the slowest fitted timescale of the real data runs from 0.42 s to about 12 s.

The notebook also lets the fitted model run on its own from a state in a held-out trial. Without input, the model relaxes back to baseline, while the real activity keeps changing because it is driven by ongoing input. Before relaxing, the model's activity briefly rises: eigenvalues govern the long run, but a matrix with non-orthogonal eigenvectors can amplify some states for a while.

::: pitfall
A high one-step $R^2$ proves little for smooth signals: persistence alone scores $0.89$. Report fitted timescales together with the smoothing width and a noise baseline. A model with no input term attributes some of the input drive (the stimulus, the movement) to $\mathbf{A}$; 20 of 447 neurons are a small, biased sample; and fitted eigenvalues carry statistical uncertainty that resampling trials would measure.
:::

## Where this appears in neuroscience and machine learning

**Stability of recurrent circuits.** Cortex is strongly recurrent, and runaway excitation, seizure-like activity, is what $\rho>1$ looks like. Inhibition keeps the spectral radius in check. Random networks switch from quiet to chaotic activity when the gain crosses 1 (Sompolinsky, Crisanti and Sommers, 1988), a direct consequence of the circular law.

**Memory and integration.** Eigenvalues near 1 (discrete time) or near 0 (continuous time) give long timescales: oculomotor integrators, working memory, and line attractors in models of decision-making. Recurrence lets 20 ms neurons hold information for seconds.

**Rotational dynamics.** Fitted linear dynamics of motor-cortex populations during reaching contain strong complex eigenvalue pairs (Churchland et al., 2012): the same phenomenon as the mini-lab's rotating modes.

**Machine learning.** In a recurrent neural network, gradients are passed backwards by repeated multiplication with the recurrent weight matrix, so they vanish when $\rho<1$ and explode when $\rho>1$. Initialisations near $\rho=1$ (orthogonal, or "edge of chaos") and reservoir computing, which tunes $\rho$ just below 1, use this directly. Modern linear state-space sequence models parameterise their eigenvalues explicitly to keep them inside the stable region. Power iteration underlies PageRank, and symmetric eigen-decompositions underlie PCA, spectral clustering and the analysis of Hessians in optimisation.

::: pitfall
**Common mistakes to avoid.**

- **Reading eigenvectors as rows.** `np.linalg.eig` returns them as columns: `V[:, k]`.
- **Expecting a particular scale or sign.** Eigenvectors are defined up to a nonzero factor; compare directions, not entries.
- **Judging stability from the entries.** $\mathbf{W}_{\text{grow}}$ has no weight above 1 and still explodes. Compute the eigenvalues.
- **Using the discrete criterion in continuous time, or the reverse.** $\lvert\lambda\rvert<1$ for maps; $\operatorname{Re}\lambda<0$ for differential equations.
- **Forgetting that $\mathbf{A}=(\mathbf{W}-\mathbf{I})/\tau_n$.** A rate network is stable when the eigenvalues of $\mathbf{W}$ have real part below 1, not when $\rho(\mathbf{W})<1$.
- **Assuming every matrix can be diagonalised.** Defective matrices (shears) cannot, and can grow even with $\rho=1$.
- **Using `eig` for a symmetric matrix.** `eigh` is faster and returns exactly real, sorted eigenvalues and orthonormal eigenvectors.
- **Trusting a fitted timescale without controls.** Smoothing and filtering create timescales of their own.
:::

## Lesson summary

- An eigenvector is a direction a matrix only stretches: $\mathbf{A}\mathbf{v}=\lambda\mathbf{v}$. Eigenvalues solve $\det(\mathbf{A}-\lambda\mathbf{I})=0$; they add up to the trace and multiply to the determinant.
- For $2\times2$ matrices, the discriminant $\operatorname{tr}^2-4\det$ decides between real ($>0$), repeated ($=0$) and complex ($<0$) eigenvalues. Complex eigenvalues $re^{\pm i\theta}$ mean "rotate by $\theta$ and scale by $r$".
- With $n$ independent eigenvectors, $\mathbf{A}=\mathbf{V}\boldsymbol\Lambda\mathbf{V}^{-1}$, $\mathbf{A}^t=\mathbf{V}\boldsymbol\Lambda^t\mathbf{V}^{-1}$, and $\mathbf{x}_t=\sum_ic_i\lambda_i^t\mathbf{v}_i$: independent modes. The dominant mode wins; power iteration finds it at rate $\lvert\lambda_2/\lambda_1\rvert$.
- Symmetric matrices have real eigenvalues and orthonormal eigenvectors, $\mathbf{S}=\mathbf{Q}\boldsymbol\Lambda\mathbf{Q}^{\mathsf T}$, and $\mathbf{u}^{\mathsf T}\mathbf{S}\mathbf{u}$ lies between the extreme eigenvalues.
- Discrete time: stable if and only if $\rho<1$; a mode has $\tau=-\Delta t/\ln\lvert\lambda\rvert$ and $f=\lvert\arg\lambda\rvert/2\pi\Delta t$.
- Continuous time: stable if and only if every $\operatorname{Re}\lambda<0$. A rate network has eigenvalues $(\mu-1)/\tau_n$ and slow modes with $\tau=\tau_n/(1-\mu)$; $\mu=1$ gives an integrator. Exact steps map $\lambda\mapsto e^{\lambda\Delta t}$; Euler maps $\lambda\mapsto1+\Delta t\lambda$.
- Fitted to real motor cortex, a $20\times20$ linear model is stable ($\rho=0.93$) with slowly rotating modes, but its timescales depend strongly on smoothing: always compare with controls.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
Find the eigenvalues and eigenvectors of $\begin{pmatrix}5&2\\2&2\end{pmatrix}$. Check the trace and determinant, and check that the eigenvectors are orthogonal. Why must they be?
---answer---
**Eigenvalues.** $\operatorname{tr}=7$ and $\det=6$, so $\lambda^2-7\lambda+6=(\lambda-6)(\lambda-1)$: $\lambda=6$ and $1$.

**Eigenvectors.** For 6: $\begin{pmatrix}-1&2\\2&-4\end{pmatrix}\mathbf{v}=\mathbf{0}$ gives $\mathbf{v}=(2,\ 1)$. For 1: $\begin{pmatrix}4&2\\2&1\end{pmatrix}\mathbf{v}=\mathbf{0}$ gives $(1,\ -2)$.

**Checks.** $6+1=7$, $6\times1=6$, and $(2,\ 1)\cdot(1,\ -2)=0$. They must be orthogonal because the matrix is symmetric with distinct eigenvalues.
:::

::: exercise
For $\mathbf{W}=\begin{pmatrix}1&-1\\1&1\end{pmatrix}$, find the eigenvalues, their modulus and their angle. Is $\mathbf{x}_{t+1}=\mathbf{W}\mathbf{x}_t$ stable? Without multiplying matrices, find $\mathbf{W}^8$.
---answer---
**Eigenvalues.** $\operatorname{tr}=2$, $\det=2$, discriminant $-4$: $\lambda=1\pm i$, with modulus $\sqrt2\approx1.41$ and angle $\pm45^\circ$.

**Stability.** Unstable: an outward spiral.

**The eighth power.** $\mathbf{W}=\sqrt2\,\mathbf{R}(45^\circ)$, so $\mathbf{W}^8=(\sqrt2)^8\,\mathbf{R}(360^\circ)=16\,\mathbf{I}$.
:::

::: exercise
Show that the eigenvalues of a triangular matrix $\begin{pmatrix}a&b\\0&d\end{pmatrix}$ are its diagonal entries. Find its eigenvectors when $a\neq d$.
---answer---
**Eigenvalues.** $\det\begin{pmatrix}a-\lambda&b\\0&d-\lambda\end{pmatrix}=(a-\lambda)(d-\lambda)$, with roots $a$ and $d$.

**Eigenvectors.** For $\lambda=a$: $\mathbf{v}=(1,\ 0)$. For $\lambda=d$: $(a-d)v_1+bv_2=0$, so $\mathbf{v}=(b,\ d-a)$.
:::

::: exercise
A network has eigenvalues $0.9$ and $0.5$ with eigenvectors $\mathbf{v}_1$, $\mathbf{v}_2$, and starts at $\mathbf{x}_0=2\mathbf{v}_1+4\mathbf{v}_2$. Write $\mathbf{x}_t$. After how many steps is the fast mode's coefficient below 1% of the slow mode's?
---answer---
**Trajectory.** $\mathbf{x}_t=2(0.9)^t\mathbf{v}_1+4(0.5)^t\mathbf{v}_2$.

**When.** We need $4(0.5)^t<0.01\times2(0.9)^t$, that is $(5/9)^t<0.005$, so $t>\ln0.005/\ln(5/9)\approx9.01$: after 10 steps.
:::

::: exercise
With $\Delta t=10$ ms, a mode has $\lvert\lambda\rvert=0.98$ and $\arg\lambda=3.6^\circ$. Find its time constant and frequency.
---answer---
**Time constant.** $\tau=-0.01/\ln0.98\approx0.495$ s.

**Frequency.** $3.6^\circ=0.0628$ rad, so $f=0.0628/(2\pi\times0.01)=1.0$ Hz: a 1 Hz oscillation that decays over half a second.
:::

::: exercise
If $\mathbf{A}\mathbf{v}=\lambda\mathbf{v}$, show that $\mathbf{v}$ is also an eigenvector of $\mathbf{A}^k$, of $\mathbf{A}+c\mathbf{I}$ and (if $\mathbf{A}$ is invertible) of $\mathbf{A}^{-1}$, and give the eigenvalues.
---answer---
**Powers.** $\mathbf{A}^k\mathbf{v}=\lambda^k\mathbf{v}$ (apply $\mathbf{A}$ $k$ times).

**Shift.** $(\mathbf{A}+c\mathbf{I})\mathbf{v}=(\lambda+c)\mathbf{v}$.

**Inverse.** Multiplying $\mathbf{A}\mathbf{v}=\lambda\mathbf{v}$ by $\mathbf{A}^{-1}$ gives $\mathbf{v}=\lambda\mathbf{A}^{-1}\mathbf{v}$, so $\mathbf{A}^{-1}\mathbf{v}=\lambda^{-1}\mathbf{v}$. ($\lambda\neq0$ because $\mathbf{A}$ is invertible.)
:::

::: exercise
Show that for any matrix $\mathbf{B}$, $\mathbf{B}^{\mathsf T}\mathbf{B}$ is symmetric and has no negative eigenvalues. (Hint: compute $\lVert\mathbf{B}\mathbf{v}\rVert^2$ for an eigenvector $\mathbf{v}$.)
---answer---
**Symmetric.** $(\mathbf{B}^{\mathsf T}\mathbf{B})^{\mathsf T}=\mathbf{B}^{\mathsf T}\mathbf{B}$.

**No negative eigenvalues.** If $\mathbf{B}^{\mathsf T}\mathbf{B}\mathbf{v}=\lambda\mathbf{v}$ with $\mathbf{v}$ real (the matrix is symmetric), then $\lVert\mathbf{B}\mathbf{v}\rVert^2=\mathbf{v}^{\mathsf T}\mathbf{B}^{\mathsf T}\mathbf{B}\mathbf{v}=\lambda\lVert\mathbf{v}\rVert^2$, so $\lambda=\lVert\mathbf{B}\mathbf{v}\rVert^2/\lVert\mathbf{v}\rVert^2\ge0$.
:::

::: exercise
A rate network with $\tau_n=10$ ms has $\mathbf{W}=\begin{pmatrix}0&w\\w&0\end{pmatrix}$. Find the eigenvalues of $\mathbf{W}$ and of $\mathbf{A}=(\mathbf{W}-\mathbf{I})/\tau_n$. For which $w$ is it stable? For $w=0.9$, give both mode time constants and describe the two activity patterns.
---answer---
**Eigenvalues.** $\mu=\pm w$, with eigenvectors $(1,\ 1)$ and $(1,\ -1)$; $\mathbf{A}$ has eigenvalues $(\pm w-1)/0.01$.

**Stability.** Both must be negative: $-1<w<1$.

**For $w=0.9$.** Along $(1,\ 1)$ (both neurons together) $\tau=0.01/0.1=100$ ms. Along $(1,\ -1)$ (one up, one down) $\tau=0.01/1.9\approx5.3$ ms. Mutual excitation slows the common pattern and speeds up the difference.
:::

::: exercise
A continuous-time mode has $\lambda=-100$ s⁻¹. What is the largest Euler step $\Delta t$ for which the simulation is stable? Compare the Euler factor and the exact factor at $\Delta t=5$ ms.
---answer---
**Largest step.** $\lvert1-100\Delta t\rvert<1$ requires $\Delta t<0.02$ s $=20$ ms.

**At 5 ms.** The Euler factor is $1-0.5=0.5$; the exact one is $e^{-0.5}\approx0.61$. Stable, but noticeably inaccurate.
:::

::: exercise
Power iteration is run on a matrix with $\lvert\lambda_2/\lambda_1\rvert=0.8$. Roughly how many iterations reduce the error in the direction by a factor of $10^6$? What if the ratio is $0.99$?
---answer---
**Ratio 0.8.** $0.8^k<10^{-6}$ needs $k>6\ln10/\ln1.25\approx62$.

**Ratio 0.99.** $k>6\ln10/(-\ln0.99)\approx1375$.
:::

::: exercise
Show by induction that $\begin{pmatrix}1&1\\0&1\end{pmatrix}^t=\begin{pmatrix}1&t\\0&1\end{pmatrix}$. What does this say about the claim "$\rho=1$ means activity stays bounded"?
---answer---
**Induction.** True for $t=1$. If it is true for $t$, then $\begin{pmatrix}1&t\\0&1\end{pmatrix}\begin{pmatrix}1&1\\0&1\end{pmatrix}=\begin{pmatrix}1&t+1\\0&1\end{pmatrix}$.

**Meaning.** From $(0,\ 1)$ the state is $(t,\ 1)$: it grows linearly although $\rho=1$. "Marginal" guarantees bounded activity only for diagonalisable matrices; a defective eigenvalue on the unit circle gives polynomial growth.
:::

::: exercise
*(Challenge.)* Show that both eigenvalues of a real $2\times2$ matrix have modulus below 1 if and only if $\det<1$ and $\lvert\operatorname{tr}\rvert<1+\det$ (the green triangle in the trace–determinant figure). Consider the complex and the real cases separately.
---answer---
**Complex case** ($\operatorname{tr}^2<4\det$, so $\det>0$). $\lvert\lambda\rvert^2=\lambda\bar\lambda=\det$, so both moduli are below 1 if and only if $\det<1$; and then $\lvert\operatorname{tr}\rvert<2\sqrt{\det}\le1+\det$ automatically.

**Real case.** Let $p(\lambda)=\lambda^2-\operatorname{tr}\,\lambda+\det$. Both roots lie in $(-1,1)$ if and only if $p(1)>0$, $p(-1)>0$ and the vertex $\operatorname{tr}/2$ lies in $(-1,1)$. The conditions $p(\pm1)>0$ read $1\mp\operatorname{tr}+\det>0$, that is $\lvert\operatorname{tr}\rvert<1+\det$. Given that, $\det<1$ forces $\lvert\operatorname{tr}\rvert<2$, so the vertex condition holds. Conversely, with both roots in $(-1,1)$, $\det=\lambda_1\lambda_2<1$.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise on whether a fitted timescale lives in the brain or in the smoothing. Both open in Google Colab.

{{ colab: week2/lesson6/Lesson6_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week2/lesson6/Lesson6_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Introduction to Linear Algebra*, 6th ed., Wellesley–Cambridge Press, 2023. Chapter 6, eigenvalues and eigenvectors, including the spectral theorem.
- S. H. Strogatz, *Nonlinear Dynamics and Chaos*, 2nd ed., Westview Press, 2015. Chapter 5, linear systems in the plane and the trace–determinant classification.
- P. Dayan and L. F. Abbott, *Theoretical Neuroscience*, MIT Press, 2001. Chapter 7, linear recurrent networks, eigenvector modes and neural integrators.
- H. Sompolinsky, A. Crisanti and H.-J. Sommers, "Chaos in random neural networks", *Physical Review Letters* 61:259–262, 1988.
- M. M. Churchland et al., "Neural population dynamics during reaching", *Nature* 487:51–56, 2012. Rotational dynamics in motor cortex.
- H. S. Seung, "How the brain keeps the eyes still", *PNAS* 93:13339–13344, 1996. The line-attractor integrator.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
- 3Blue1Brown, *Essence of Linear Algebra*, chapter 14, "Eigenvectors and eigenvalues": the geometric picture, animated.
