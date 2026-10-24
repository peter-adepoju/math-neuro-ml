---
summary: "What a matrix does to a vector: matrix–vector and matrix–matrix products, linear transformations, composition, rank, determinant and inverse, neural-network layers, and translating between neural and stimulus space."
---

::: objectives
- How to compute a matrix–vector product, and read it as dot products (rows) or as a mixture of columns
- How to multiply two matrices, predict the shape of any product, and send a whole batch of trials through a model at once
- Why matrix multiplication is associative but not commutative, and what each fact means for a chain of processing stages
- Why every linear transformation is a matrix, and how to build rotations, scalings, shears, reflections and projections from where they send the basis vectors
- What rank measures, why a map into fewer dimensions loses information, and why a chain is no richer than its narrowest stage
- What the determinant says about area, when a matrix can be undone, and why nearly singular matrices are dangerous
- How a bias and an activation function turn a matrix into a neural-network layer, and why the nonlinearity matters
- How matrices translate between neural and behavioural (or stimulus) space, tested on real recordings from mouse visual cortex
:::

**Before you start.** This reading is the mathematical companion to the Lesson 4 teaching notebook. You need Lessons 1–3: vectors, norms and basis vectors; the dot product and its geometry; and matrices as tables, with the transpose and the (row = target, column = source) convention for weights. Lesson 3 treated a matrix as a table of data. This lesson treats it as a *machine* that acts on vectors. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\mathbf{A}\in\mathbb{R}^{m\times n}$ | a matrix with $m$ rows and $n$ columns |
| $\mathbf{a}_i$, $\mathbf{a}_{:,j}$ | row $i$ and column $j$ of $\mathbf{A}$, read as vectors |
| $\mathbf{A}\mathbf{x}$, $\mathbf{A}\mathbf{B}$ | matrix–vector and matrix–matrix products |
| $\mathbf{e}_1,\dots,\mathbf{e}_n$ | the standard basis vectors (Lesson 1) |
| $\mathbf{I}$, $\mathbf{A}^{-1}$ | the identity matrix, and the inverse of $\mathbf{A}$ |
| $\operatorname{rank}\mathbf{A}$ | the rank: the dimension of the set of outputs of $\mathbf{A}$ |
| $\det\mathbf{A}$ | the determinant of a square matrix ($ad-bc$ for $2\times2$) |
| $f(\cdot)$ | an activation function, applied entry by entry |
| $\mathbf{E}$, $\mathbf{D}$ | encoding (behaviour → neurons) and decoding (neurons → behaviour) matrices |

## The problem: from one weighted sum to a population

In Lesson 2 one postsynaptic neuron received input from four presynaptic neurons, and its total input was a dot product, $z=\mathbf{w}\cdot\mathbf{r}$. A real circuit has many postsynaptic neurons listening to the same inputs, each with its own weights. With presynaptic rates $\mathbf{r}=(2,\ 5,\ 1,\ 4)$ spikes/s and three postsynaptic neurons, there are three weight vectors and three dot products. Stack the weight vectors as the *rows* of a matrix, with rows for postsynaptic and columns for presynaptic neurons as in Lesson 3:

$$\mathbf{W}=\begin{pmatrix} 0.5 & -0.2 & 0.8 & 0.1\\ 0.0 & 0.6 & -0.3 & 0.4\\ 0.3 & 0.3 & 0.3 & -0.5\end{pmatrix}, \qquad \mathbf{r}=\begin{pmatrix}2\\5\\1\\4\end{pmatrix},$$

$$\mathbf{z}=\mathbf{W}\mathbf{r}=\begin{pmatrix} 0.5(2)-0.2(5)+0.8(1)+0.1(4)\\ 0(2)+0.6(5)-0.3(1)+0.4(4)\\ 0.3(2)+0.3(5)+0.3(1)-0.5(4)\end{pmatrix}=\begin{pmatrix}1.2\\4.3\\0.4\end{pmatrix}\text{ spikes/s}.$$

Postsynaptic neuron 2 receives the most input because its largest weights sit on the two most active inputs. Neuron 3 receives almost none, because the $-0.5$ on input 4 cancels its positive weights.

The single expression $\mathbf{z}=\mathbf{W}\mathbf{r}$ is the whole lesson. What follows reads it in different ways: as arithmetic, as geometry, as a stage in a pathway, as a layer of a neural network, and as a translator between brain activity and behaviour.

## The matrix–vector product

::: definition Definition: matrix–vector product
For $\mathbf{A}\in\mathbb{R}^{m\times n}$ and $\mathbf{x}\in\mathbb{R}^n$, the product $\mathbf{y}=\mathbf{A}\mathbf{x}$ is the vector in $\mathbb{R}^m$ with entries

$$y_i=\sum_{j=1}^{n} a_{ij}\,x_j, \qquad i=1,\dots,m .$$

It is defined only when the number of columns of $\mathbf{A}$ equals the number of entries of $\mathbf{x}$. The shape rule is $(m\times n)(n) = (m)$.
:::

The same double-indexed sum can be grouped in two ways, and each grouping is a useful picture.

::: keypoint
**Row view.** $y_i=\mathbf{a}_i\cdot\mathbf{x}$: output $i$ is the dot product of row $i$ with the input. Each postsynaptic neuron computes its own weighted sum.

**Column view.** $\mathbf{A}\mathbf{x}=x_1\mathbf{a}_{:,1}+x_2\mathbf{a}_{:,2}+\cdots+x_n\mathbf{a}_{:,n}$: the output is a mixture of the columns, weighted by the inputs. Each presynaptic neuron contributes its own pattern of effects on the output population, scaled by its rate.
:::

::: note Why it is true: the two views agree
Entry $i$ of the column-view sum is $\sum_j x_j\,(\mathbf{a}_{:,j})_i=\sum_j x_ja_{ij}$, which is $y_i$. The row view is the same sum read as a dot product. Nothing is computed differently; the terms $a_{ij}x_j$ are just added in a different order.
:::

{{ interactive: matvec | The product W r from the opening example, two ways. In the row view each postsynaptic neuron's output is one dot product; in the column view each presynaptic neuron adds its own column of effects, scaled by its rate, and the stacked colours sum to the outputs (black dots). Move the input rates and switch views. }}

The column view makes some questions easy. If presynaptic neuron 2 falls silent, $\mathbf{z}$ changes by exactly $-5\times$ its column, $-5(-0.2,\ 0.6,\ 0.3)=(1,\ -3,\ -1.5)$, without recomputing anything else.

**Units.** Each term $a_{ij}x_j$ has units (units of $a_{ij}$)$\times$(units of $x_j$), as for the dot product in Lesson 2. With dimensionless weights and rates in spikes/s, $\mathbf{z}$ is in spikes/s.

## The matrix–matrix product

::: definition Definition: matrix product
For $\mathbf{A}\in\mathbb{R}^{m\times k}$ and $\mathbf{B}\in\mathbb{R}^{k\times n}$, the product $\mathbf{C}=\mathbf{A}\mathbf{B}\in\mathbb{R}^{m\times n}$ has entries

$$c_{ij}=\sum_{l=1}^{k}a_{il}\,b_{lj}=\mathbf{a}_i\cdot\mathbf{b}_{:,j}.$$

The shape rule is $(m\times k)(k\times n)=(m\times n)$: the inner sizes must match and the outer sizes survive.
:::

There are again two readings. Entry by entry, each $c_{ij}$ is one dot product, row $i$ of $\mathbf{A}$ with column $j$ of $\mathbf{B}$. Column by column, $\mathbf{c}_{:,j}=\mathbf{A}\mathbf{b}_{:,j}$: the product is $\mathbf{A}$ applied to every column of $\mathbf{B}$ at once. A matrix–vector product is the special case $n=1$.

::: example Worked example: a 2 × 3 times a 3 × 2
$$\mathbf{A}=\begin{pmatrix}1&0&2\\-1&3&1\end{pmatrix},\quad \mathbf{B}=\begin{pmatrix}3&1\\2&1\\1&0\end{pmatrix},\quad \mathbf{A}\mathbf{B}=\begin{pmatrix}5&1\\4&2\end{pmatrix}.$$

For example $c_{11}=1\cdot3+0\cdot2+2\cdot1=5$ and $c_{21}=-1\cdot3+3\cdot2+1\cdot1=4$. $\mathbf{B}\mathbf{A}$ also exists, but it is $3\times3$: a different matrix of a different shape.
:::

{{ interactive: matmul | Click any entry of C = A B. Its row of A and its column of B light up, and the panel shows the dot product that makes it. }}

### Sending a batch of trials through a model

Lesson 3's data matrices have one trial per row: $\mathbf{X}\in\mathbb{R}^{T\times n}$, with row $\mathbf{x}_t$. To send every trial through weights $\mathbf{W}\in\mathbb{R}^{m\times n}$ we want $\mathbf{W}\mathbf{x}_t$ for each $t$. Stacked as rows, these are

$$\mathbf{Z}=\mathbf{X}\mathbf{W}^{\mathsf T}\in\mathbb{R}^{T\times m}.$$

::: note Why it is true: row t of X Wᵀ is W xₜ
Entry $(t,i)$ of $\mathbf{X}\mathbf{W}^{\mathsf T}$ is $\sum_j x_{tj}(\mathbf{W}^{\mathsf T})_{ji}=\sum_j x_{tj}w_{ij}=\mathbf{w}_i\cdot\mathbf{x}_t$, which is entry $i$ of $\mathbf{W}\mathbf{x}_t$.
:::

Writing $\mathbf{W}\mathbf{X}$ instead is a shape error ($(m\times n)(T\times n)$ has inner sizes $n$ and $T$), unless $T=n$ by coincidence, in which case it is a silent error. The notebook sends 50 trials through $\mathbf{W}$ with one product and checks the result against a loop.

## The algebra of matrix products

Shapes are assumed compatible.

| Rule | Statement | Meaning |
|---|---|---|
| Associative | $(\mathbf{A}\mathbf{B})\mathbf{C}=\mathbf{A}(\mathbf{B}\mathbf{C})$ | grouping a chain is free |
| Distributive | $\mathbf{A}(\mathbf{B}+\mathbf{C})=\mathbf{A}\mathbf{B}+\mathbf{A}\mathbf{C}$ | two input sources add their effects |
| Identity | $\mathbf{I}\mathbf{A}=\mathbf{A}\mathbf{I}=\mathbf{A}$ | $\mathbf{I}$ is the "do nothing" matrix |
| Transpose of a product | $(\mathbf{A}\mathbf{B})^{\mathsf T}=\mathbf{B}^{\mathsf T}\mathbf{A}^{\mathsf T}$ | the order reverses |
| **Not** commutative | $\mathbf{A}\mathbf{B}\neq\mathbf{B}\mathbf{A}$ in general | the order of factors matters |

::: note Why it is true: associativity and the transpose rule
**Associativity.** Entry $(i,j)$ of $(\mathbf{A}\mathbf{B})\mathbf{C}$ is $\sum_p(\mathbf{A}\mathbf{B})_{ip}c_{pj}=\sum_p\sum_l a_{il}b_{lp}c_{pj}$. Entry $(i,j)$ of $\mathbf{A}(\mathbf{B}\mathbf{C})$ is $\sum_l a_{il}(\mathbf{B}\mathbf{C})_{lj}=\sum_l\sum_p a_{il}b_{lp}c_{pj}$. These are the same finite double sum, added in a different order.

**Transpose.** $\big((\mathbf{A}\mathbf{B})^{\mathsf T}\big)_{ij}=(\mathbf{A}\mathbf{B})_{ji}=\sum_l a_{jl}b_{li}=\sum_l(\mathbf{B}^{\mathsf T})_{il}(\mathbf{A}^{\mathsf T})_{lj}=(\mathbf{B}^{\mathsf T}\mathbf{A}^{\mathsf T})_{ij}$.
:::

::: example Worked example: order matters
For $\mathbf{P}=\begin{pmatrix}2&0\\1&3\end{pmatrix}$ and $\mathbf{Q}=\begin{pmatrix}1&4\\2&1\end{pmatrix}$, $\mathbf{P}\mathbf{Q}=\begin{pmatrix}2&8\\7&7\end{pmatrix}$ but $\mathbf{Q}\mathbf{P}=\begin{pmatrix}6&12\\5&3\end{pmatrix}$. One counterexample is enough to show the rule $\mathbf{A}\mathbf{B}=\mathbf{B}\mathbf{A}$ is false in general.
:::

Associativity is also a matter of efficiency. For $n\times n$ matrices and a vector, $(\mathbf{A}\mathbf{B})\mathbf{x}$ first builds $\mathbf{A}\mathbf{B}$, about $n^3$ multiplications, then multiplies by $\mathbf{x}$. $\mathbf{A}(\mathbf{B}\mathbf{x})$ needs two matrix–vector products, about $2n^2$. For $n=1000$ that is $10^9$ against $2\times10^6$: the same answer at one five-hundredth of the cost.

::: quiz
? $\mathbf{A}$ is $3\times5$ and $\mathbf{B}$ is $5\times2$. What is the shape of $\mathbf{A}\mathbf{B}$?
- [ ] $5\times5$
- [x] $3\times2$
- [ ] $2\times3$
- [ ] It is not defined.
> The inner sizes (5 and 5) match and disappear; the outer sizes (3 and 2) survive.

? With one trial per row in $\mathbf{X}$ ($T\times n$) and weights $\mathbf{W}$ ($m\times n$), which product sends every trial through the weights?
- [ ] `W @ X`
- [x] `X @ W.T`
- [ ] `X @ W`
> Row $t$ of $\mathbf{X}\mathbf{W}^{\mathsf T}$ is $\mathbf{W}\mathbf{x}_t$. `W @ X` has mismatched inner sizes, and `X @ W` only works by accident when the shapes happen to fit.
:::

## Matrices as linear transformations

::: definition Definition: linear transformation
A function $T$ from $\mathbb{R}^n$ to $\mathbb{R}^m$ is **linear** if, for all vectors $\mathbf{u},\mathbf{v}$ and numbers $c$,

$$T(\mathbf{u}+\mathbf{v})=T(\mathbf{u})+T(\mathbf{v}),\qquad T(c\,\mathbf{u})=c\,T(\mathbf{u}).$$
:::

::: keypoint
Every matrix gives a linear transformation $\mathbf{x}\mapsto\mathbf{A}\mathbf{x}$, and every linear transformation is multiplication by exactly one matrix: the one whose columns are $T(\mathbf{e}_1),\dots,T(\mathbf{e}_n)$. **The columns of a matrix are where it sends the basis vectors.**
:::

::: note Why it is true: linear maps and matrices are the same thing
**Matrices are linear.** By the distributive rule, $\mathbf{A}(\mathbf{u}+\mathbf{v})=\mathbf{A}\mathbf{u}+\mathbf{A}\mathbf{v}$, and $\mathbf{A}(c\mathbf{u})=c\,\mathbf{A}\mathbf{u}$ because $c$ can be taken out of each sum $\sum_j a_{ij}cu_j$.

**Linear maps are matrices.** Write any input in the basis (Lesson 1), $\mathbf{x}=x_1\mathbf{e}_1+\cdots+x_n\mathbf{e}_n$. Applying the two linearity rules repeatedly,

$$T(\mathbf{x})=x_1T(\mathbf{e}_1)+\cdots+x_nT(\mathbf{e}_n).$$

That is the column view of $\mathbf{A}\mathbf{x}$ for the matrix with columns $T(\mathbf{e}_j)$. So $T(\mathbf{x})=\mathbf{A}\mathbf{x}$ for every $\mathbf{x}$. Knowing what $T$ does to $n$ basis vectors determines everything it does.
:::

This gives a recipe: to build a transformation, decide where $\mathbf{e}_1$ and $\mathbf{e}_2$ should go and write those as columns.

{{ interactive: transform | A 2 × 2 matrix acting on the plane. The light grey dots are a lattice of inputs and the dark grey dots their images; the yellow shape is the image of the unit square, and the two arrows are A e₁ and A e₂, the columns. Pick a transformation, or drag the arrow tips to build your own, and press Play to morph from the identity. }}

### Rotations

Rotating $\mathbf{e}_1=(1,0)$ anticlockwise by $\theta$ gives $(\cos\theta,\ \sin\theta)$; rotating $\mathbf{e}_2=(0,1)$ gives $(-\sin\theta,\ \cos\theta)$. Those are the columns:

$$\mathbf{R}_\theta=\begin{pmatrix}\cos\theta & -\sin\theta\\ \sin\theta & \cos\theta\end{pmatrix}.$$

::: note Why it is true: a rotation keeps every length, angle and dot product
Compute $\mathbf{R}_\theta^{\mathsf T}\mathbf{R}_\theta$: the diagonal entries are $\cos^2\theta+\sin^2\theta=1$ and the off-diagonal entries are $-\cos\theta\sin\theta+\sin\theta\cos\theta=0$, so $\mathbf{R}_\theta^{\mathsf T}\mathbf{R}_\theta=\mathbf{I}$. Then, using $\mathbf{u}\cdot\mathbf{v}=\mathbf{u}^{\mathsf T}\mathbf{v}$ and the transpose rule,

$$(\mathbf{R}\mathbf{u})\cdot(\mathbf{R}\mathbf{v})=\mathbf{u}^{\mathsf T}\mathbf{R}^{\mathsf T}\mathbf{R}\mathbf{v}=\mathbf{u}^{\mathsf T}\mathbf{v}=\mathbf{u}\cdot\mathbf{v}.$$

Lengths ($\lVert \mathbf{v} \rVert^2=\mathbf{v}\cdot\mathbf{v}$) and angles ($\cos\theta=\mathbf{u}\cdot\mathbf{v}/\lVert \mathbf{u} \rVert\lVert \mathbf{v} \rVert$) are built from dot products, so they are kept too. Matrices with $\mathbf{Q}^{\mathsf T}\mathbf{Q}=\mathbf{I}$ are called **orthogonal**; they include rotations and reflections.
:::

### Scalings, reflections and shears

A **scaling** $\operatorname{diag}(s_1,s_2)$ multiplies each axis separately: $\mathbf{e}_1\mapsto(s_1,0)$, $\mathbf{e}_2\mapsto(0,s_2)$. A uniform scaling ($s_1=s_2$) keeps angles but not lengths; an unequal one distorts both. A **reflection** in the $x$-axis is $\operatorname{diag}(1,-1)$. A horizontal **shear** $\begin{pmatrix}1&k\\0&1\end{pmatrix}$ leaves $\mathbf{e}_1$ fixed and slides $\mathbf{e}_2$ sideways to $(k,1)$: every point moves horizontally by $k$ times its height.

### Projections

Lesson 2 projected a vector $\mathbf{x}$ onto the line through a unit vector $\hat{\mathbf{u}}$: $\operatorname{proj}(\mathbf{x})=(\hat{\mathbf{u}}\cdot\mathbf{x})\,\hat{\mathbf{u}}$. That is linear, so it is a matrix.

::: note Why it is true: the projection matrix is û ûᵀ
$(\hat{\mathbf{u}}\cdot\mathbf{x})\,\hat{\mathbf{u}}=\hat{\mathbf{u}}\,(\hat{\mathbf{u}}^{\mathsf T}\mathbf{x})=(\hat{\mathbf{u}}\hat{\mathbf{u}}^{\mathsf T})\mathbf{x}$ by associativity, where $\hat{\mathbf{u}}\hat{\mathbf{u}}^{\mathsf T}$ is the $2\times2$ matrix with entries $\hat u_i\hat u_j$ (an **outer product**). It is symmetric, and projecting twice changes nothing:

$$\mathbf{P}^2=\hat{\mathbf{u}}(\hat{\mathbf{u}}^{\mathsf T}\hat{\mathbf{u}})\hat{\mathbf{u}}^{\mathsf T}=\hat{\mathbf{u}}\cdot1\cdot\hat{\mathbf{u}}^{\mathsf T}=\mathbf{P},$$

because $\hat{\mathbf{u}}^{\mathsf T}\hat{\mathbf{u}}=\lVert \hat{\mathbf{u}} \rVert^2=1$. For the $x$-axis, $\hat{\mathbf{u}}=\mathbf{e}_1$ and $\mathbf{P}=\begin{pmatrix}1&0\\0&0\end{pmatrix}$.
:::

## Composition: one transformation after another

::: keypoint
Applying $\mathbf{S}$ and then $\mathbf{R}$ is the single transformation $\mathbf{R}\mathbf{S}$:

$$\mathbf{R}(\mathbf{S}\mathbf{x})=(\mathbf{R}\mathbf{S})\mathbf{x}.$$

Read products right to left: the matrix next to $\mathbf{x}$ acts first.
:::

This is associativity with $\mathbf{x}$ as a one-column matrix. Two consequences follow. A chain of linear stages, however long, is one linear stage. And because $\mathbf{R}\mathbf{S}\neq\mathbf{S}\mathbf{R}$ in general, the order of the stages matters.

{{ interactive: compose | A stretch S = diag(1.8, 0.5) and a rotation R, applied to the letter F in the two possible orders. Press Play to watch each order happen one stage at a time, or change the rotation angle: R S (stretch first) and S R (rotate first) give different shapes. }}

::: pitfall
"$\mathbf{A}\mathbf{B}$ means do $\mathbf{A}$ first" is backwards. In $(\mathbf{A}\mathbf{B})\mathbf{x}=\mathbf{A}(\mathbf{B}\mathbf{x})$ it is $\mathbf{B}$ that touches $\mathbf{x}$ first. For a pathway retina → LGN → V1 with linear stages $\mathbf{W}_1$ (retina to LGN) and $\mathbf{W}_2$ (LGN to V1), the combined map is $\mathbf{W}_2\mathbf{W}_1$.
:::

## Changing dimension, and rank

A matrix in $\mathbb{R}^{m\times n}$ maps $\mathbb{R}^n$ into $\mathbb{R}^m$. A tall matrix ($m>n$) embeds a few variables into many, like two stimulus features driving three neurons. A wide matrix ($m<n$) compresses many into few, like a readout of many neurons onto two behavioural variables.

::: definition Definition: image and rank
The **image** of $\mathbf{A}$ is the set of all its possible outputs $\mathbf{A}\mathbf{x}$. By the column view, this is the set of all combinations of the columns of $\mathbf{A}$ (their **span**). The **rank** of $\mathbf{A}$ is the number of independent directions in its image: the smallest number of vectors whose combinations give every output.
:::

::: keypoint
$\operatorname{rank}\mathbf{A}\le\min(m,n)$. The image is spanned by $n$ columns, so its dimension is at most $n$; it lies inside $\mathbb{R}^m$, so its dimension is at most $m$.
:::

::: example Worked example: three ranks
$\mathbf{A}=\begin{pmatrix}1&2&3\\0&1&1\\1&3&4\end{pmatrix}$ has rank 2, not 3: column 3 equals column 1 plus column 2, so it adds no new direction, and every output lies in a plane. The projection onto the $x$-axis has rank 1: every output lies on the $x$-axis. A rotation has rank 2: it reaches every point of the plane. (Pick *Project onto x-axis* in the transformation figure to watch the plane collapse onto a line.)
:::

### Lost information

When the rank is smaller than the number of inputs, different inputs share an output. If $\mathbf{A}\mathbf{n}=\mathbf{0}$ for some nonzero $\mathbf{n}$, then $\mathbf{A}(\mathbf{x}+t\mathbf{n})=\mathbf{A}\mathbf{x}$ for every $t$: a whole line of inputs collapses to one point. The notebook's $2\times3$ readout sends $(1,\ 2,\ 0.5)$, $(-0.6,\ 3.2,\ 2.5)$ and $(-3,\ 5,\ 5.5)$ all to $(1.4,\ 1.7)$. Once two inputs share an output, nothing applied afterwards can tell them apart. A readout of 30 neurons onto 2 numbers therefore cannot be reversed by any method.

### Bottlenecks

::: keypoint
$\operatorname{rank}(\mathbf{A}\mathbf{B})\le\min(\operatorname{rank}\mathbf{A},\ \operatorname{rank}\mathbf{B})$. A chain is never richer than its narrowest stage.
:::

::: note Why it is true: the bottleneck rule
Every output of $\mathbf{A}\mathbf{B}$ has the form $\mathbf{A}(\mathbf{B}\mathbf{x})$, so it lies in the image of $\mathbf{A}$: hence $\operatorname{rank}(\mathbf{A}\mathbf{B})\le\operatorname{rank}\mathbf{A}$. And the outputs are $\mathbf{A}$ applied to vectors $\mathbf{B}\mathbf{x}$ in the image of $\mathbf{B}$. If $\mathbf{v}_1,\dots,\mathbf{v}_r$ ($r=\operatorname{rank}\mathbf{B}$) span that image, the outputs are combinations of $\mathbf{A}\mathbf{v}_1,\dots,\mathbf{A}\mathbf{v}_r$, at most $r$ directions. Hence $\operatorname{rank}(\mathbf{A}\mathbf{B})\le\operatorname{rank}\mathbf{B}$.
:::

If 50 neurons project through 2 relay neurons onto 50 others, the $50\times50$ map has rank at most 2, however large it looks (the notebook confirms rank 2). Such **low-rank** connectivity is a common model of cortical networks, and it is one reason recorded population activity often lies close to a low-dimensional subspace. Lesson 7 measures that dimension with PCA.

## Determinant, identity and inverse

### The determinant measures area

A $2\times2$ matrix $\mathbf{A}=\begin{pmatrix}a&b\\c&d\end{pmatrix}$ sends the unit square to the parallelogram spanned by its columns $(a,c)$ and $(b,d)$.

::: keypoint
The parallelogram has area $|\det\mathbf{A}|$, where $\det\mathbf{A}=ad-bc$. Every region's area is multiplied by the same factor, since a linear map treats every small square in the same way. The sign of $\det\mathbf{A}$ is negative when the map flips orientation, like a mirror.
:::

::: note Why it is true: area = ad − bc (for a, b, c, d > 0)
Surround the parallelogram by the box of width $a+b$ and height $c+d$. The box minus the parallelogram consists of two triangles of area $\tfrac12ac$, two of area $\tfrac12bd$, and two rectangles of area $bc$. So

$$\text{area}=(a+b)(c+d)-ac-bd-2bc=ad-bc.$$

The other arrangements give $|ad-bc|$ by the same kind of argument.
:::

Rotations, reflections and shears have $|\det|=1$ (area kept), the scaling $\operatorname{diag}(1.8,\ 0.5)$ has $0.9$, and projections have $0$: they squash the plane flat. The transformation figure above reports the determinant of every matrix you build.

### Inverses

::: definition Definition: inverse
A square matrix $\mathbf{A}$ is **invertible** if there is a matrix $\mathbf{A}^{-1}$ with $\mathbf{A}^{-1}\mathbf{A}=\mathbf{A}\mathbf{A}^{-1}=\mathbf{I}$. Then $\mathbf{y}=\mathbf{A}\mathbf{x}$ can be undone: $\mathbf{x}=\mathbf{A}^{-1}\mathbf{y}$.
:::

Geometry gives many inverses directly: rotate back by $-\theta$ (which is $\mathbf{R}_\theta^{\mathsf T}$, since $\mathbf{R}^{\mathsf T}\mathbf{R}=\mathbf{I}$); scale by the reciprocals; shear by $-k$. A projection has no inverse, because it sends different inputs to the same output.

::: keypoint
A $2\times2$ matrix is invertible exactly when $\det\mathbf{A}=ad-bc\neq0$, and then

$$\mathbf{A}^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}.$$

To undo a chain, undo the stages in reverse order: $(\mathbf{A}\mathbf{B})^{-1}=\mathbf{B}^{-1}\mathbf{A}^{-1}$.
:::

::: note Why it is true: the formula and the reverse-order rule
Multiply: $\begin{pmatrix}d&-b\\-c&a\end{pmatrix}\begin{pmatrix}a&b\\c&d\end{pmatrix}=\begin{pmatrix}da-bc & db-bd\\ -ca+ac & -cb+ad\end{pmatrix}=(ad-bc)\,\mathbf{I}$. Dividing by $ad-bc$ gives $\mathbf{I}$, which is possible only if $ad-bc\neq0$. If $ad-bc=0$ the area factor is 0, the plane is flattened onto a line or a point, and different inputs share outputs, so no inverse can exist.

For a chain, $(\mathbf{B}^{-1}\mathbf{A}^{-1})(\mathbf{A}\mathbf{B})=\mathbf{B}^{-1}(\mathbf{A}^{-1}\mathbf{A})\mathbf{B}=\mathbf{B}^{-1}\mathbf{B}=\mathbf{I}$, using associativity.
:::

{{ interactive: near-singular | The matrix A = [[1, 0.6], [0.5, d]]. As d moves towards 0.3 the determinant shrinks to zero and the unit square (yellow) is squashed flat. On the right, a measurement y = A x of the true x = (1, 2) is perturbed by ±0.01 (the small dashed box); undoing it with A⁻¹ blows that tiny box up into the purple region of possible answers. }}

::: pitfall
**Nearly singular is nearly as bad as singular.** The inverse of $\begin{pmatrix}1&1\\1&1+\varepsilon\end{pmatrix}$ has entries of size $1/\varepsilon$. In the notebook, with $\varepsilon=0.001$ and a measurement error of only $\pm0.01$, "recovering" $\mathbf{x}=(1,\ 2)$ gives $(21,\ -18)$. A small determinant amplifies noise. Lesson 5 returns to this, and to why `np.linalg.solve` is preferred over computing an inverse.
:::

::: quiz
? A $2\times2$ matrix has determinant $-2$. What does it do to the unit square?
- [ ] It squashes it flat.
- [ ] It halves its area.
- [x] It doubles its area and flips its orientation, like a mirror.
> $|\det| = 2$ is the area factor, and the negative sign means the orientation is reversed.

? You apply $\mathbf{S}$ first and then $\mathbf{R}$. Which single matrix does that?
- [ ] $\mathbf{S}\mathbf{R}$
- [x] $\mathbf{R}\mathbf{S}$
- [ ] $\mathbf{S}+\mathbf{R}$
> $\mathbf{R}(\mathbf{S}\mathbf{x}) = (\mathbf{R}\mathbf{S})\mathbf{x}$: the matrix next to $\mathbf{x}$ acts first, so read products right to left.

? A $3\times3$ matrix has a column equal to the sum of the other two. What can you conclude?
- [ ] Its rank is 3.
- [x] Its rank is at most 2, its determinant is 0, and it has no inverse.
- [ ] It is a rotation.
> The third column adds no new direction, so the image is at most a plane. Different inputs share outputs, so nothing can undo the map.
:::

## Affine maps and activation functions

Each output neuron also gets a bias, so the population's input is

$$\mathbf{z}=\mathbf{W}\mathbf{x}+\mathbf{b}.$$

This is an **affine** map. It is not linear: it sends $\mathbf{0}$ to $\mathbf{b}$, and $\mathbf{W}(\mathbf{u}+\mathbf{v})+\mathbf{b}\neq(\mathbf{W}\mathbf{u}+\mathbf{b})+(\mathbf{W}\mathbf{v}+\mathbf{b})$ unless $\mathbf{b}=\mathbf{0}$.

::: note Why it is true: an affine map is linear one dimension up
Append a 1 to the input and build the augmented matrix:

$$\begin{pmatrix}\mathbf{W}&\mathbf{b}\\ \mathbf{0}^{\mathsf T}&1\end{pmatrix}\begin{pmatrix}\mathbf{x}\\1\end{pmatrix}=\begin{pmatrix}\mathbf{W}\mathbf{x}+\mathbf{b}\\ 1\end{pmatrix}=\begin{pmatrix}\mathbf{z}\\1\end{pmatrix}.$$

The bias has become one more column, multiplying a constant input of 1. Lesson 2 used the same trick for a single neuron, and in Lesson 5 it becomes the column of ones that gives a regression its intercept.
:::

### The nonlinear stage

A neural-network layer, and a simple rate model of a population, applies an **activation function** $f$ to each entry:

$$\mathbf{a}=f(\mathbf{W}\mathbf{x}+\mathbf{b}).$$

$\mathbf{z}$ is the **pre-activation**, a net input that may be negative. $\mathbf{a}$ is the **activation**, comparable to a firing rate. Common choices are ReLU, $\max(0,z)$; the sigmoid, $1/(1+e^{-z})$, which saturates between 0 and 1; and $\tanh z$, between $-1$ and 1.

{{ figure: cell053_1.svg | Three activation functions, each applied to one number at a time: ReLU (blue) is zero for negative input and the identity above; the sigmoid (vermilion) saturates between 0 and 1; tanh (green) saturates between −1 and 1. From the teaching notebook. }}

::: keypoint
Linear layers collapse: $\mathbf{W}_2(\mathbf{W}_1\mathbf{x})=(\mathbf{W}_2\mathbf{W}_1)\mathbf{x}$, so any stack of linear layers equals one matrix. A nonlinearity between them breaks the collapse: $\mathbf{W}_2f(\mathbf{W}_1\mathbf{x})\neq(\mathbf{W}_2\mathbf{W}_1)\mathbf{x}$ in general.
:::

::: note Why it is true: ReLU is not linear
One counterexample suffices: $\mathrm{ReLU}(1)+\mathrm{ReLU}(-1)=1+0=1$, but $\mathrm{ReLU}(1+(-1))=\mathrm{ReLU}(0)=0$. Because $f$ is not linear, $\mathbf{x}\mapsto\mathbf{W}_2f(\mathbf{W}_1\mathbf{x})$ is not linear either, so it cannot equal multiplication by any matrix.
:::

{{ interactive: relu-layer | One layer a = ReLU(W₁ x + b) acting on a grid of inputs. Left: the inputs, coloured by quadrant (blue where both coordinates have the same sign, vermilion where they differ). Middle: the affine stage shears and shifts the grid. Right: ReLU folds every negative coordinate onto an axis. Move the bias, or press Play, to slide the grid across the fold. No matrix can fold. }}

This is why depth adds power only when nonlinear stages separate the linear ones. It is also why real pathways, with their thresholds and saturations, are not simply products of matrices.

## Translating between neural and behavioural space

Two vector spaces describe the same moment of a reaching experiment: **behavioural space**, the direction of movement $\mathbf{d}=(\cos\theta,\ \sin\theta)\in\mathbb{R}^2$; and **neural space**, the rates $\mathbf{r}\in\mathbb{R}^N$ of $N$ motor-cortex neurons. Matrices translate in both directions: an encoding matrix $\mathbf{E}$ ($N\times2$) takes behaviour to neural activity, and a decoding matrix $\mathbf{D}$ ($2\times N$) takes it back.

### Cosine tuning is an affine map

Lesson 2 showed that a dot-product neuron is cosine-tuned, and motor-cortex neurons are well described this way (Georgopoulos et al., 1982): $r_i=b_i+g_i\cos(\theta-\phi_i)$, with baseline $b_i$, depth $g_i$ and preferred direction $\phi_i$.

::: note Why it is true: cosine tuning is r = b + E d
By the angle-difference identity, $g_i\cos(\theta-\phi_i)=(g_i\cos\phi_i)\cos\theta+(g_i\sin\phi_i)\sin\theta$. That is the dot product of $\mathbf{e}_i=g_i(\cos\phi_i,\ \sin\phi_i)$ with $\mathbf{d}$. Stacking the $N$ rows $\mathbf{e}_i$ gives the $N\times2$ **encoding matrix** $\mathbf{E}$, and $\mathbf{r}=\mathbf{b}+\mathbf{E}\mathbf{d}$.
:::

$\mathbf{E}$ has two columns, so its rank is at most 2. Without noise, every population response $\mathbf{r}$ lies on a flat 2-D sheet through $\mathbf{b}$ inside $N$-dimensional space, however large $N$ is.

### The population vector is a decoding matrix

The classic population vector (Georgopoulos et al., 1986) weights each neuron by $(r_i-b_i)/g_i$ and adds the unit vectors $\mathbf{u}_i=(\cos\phi_i,\ \sin\phi_i)$, scaled by $2/N$. That is a $2\times N$ matrix acting on $\mathbf{r}-\mathbf{b}$:

$$\hat{\mathbf{d}}=\mathbf{D}(\mathbf{r}-\mathbf{b}),\qquad \text{column } i \text{ of } \mathbf{D}=\frac{2}{N}\,\frac{\mathbf{u}_i}{g_i}.$$

Encoding then decoding is the composition $\mathbf{D}\mathbf{E}$, a $2\times2$ matrix, and $\hat{\mathbf{d}}=\mathbf{D}\mathbf{E}\,\mathbf{d}$ for noiseless data. A faithful round trip needs $\mathbf{D}\mathbf{E}=\mathbf{I}$.

::: keypoint
$$\mathbf{D}\mathbf{E}=\frac{2}{N}\sum_{i=1}^{N}\mathbf{u}_i\mathbf{u}_i^{\mathsf T} =\mathbf{I}+\frac1N\sum_{i=1}^{N}\begin{pmatrix}\cos2\phi_i & \sin2\phi_i\\ \sin2\phi_i & -\cos2\phi_i\end{pmatrix}.$$

$\mathbf{D}\mathbf{E}=\mathbf{I}$ exactly when the *doubled* preferred directions $2\phi_i$ average to zero, for example when the $\phi_i$ are evenly spread. Otherwise the decoder stretches behavioural space along the axis that the preferred directions favour.
:::

::: note Why it is true: the formula for D E
$\mathbf{D}\mathbf{E}=\sum_i(\text{column } i \text{ of } \mathbf{D})(\text{row } i \text{ of } \mathbf{E})=\sum_i\frac{2}{N}\frac{\mathbf{u}_i}{g_i}\,g_i\mathbf{u}_i^{\mathsf T}=\frac{2}{N}\sum_i\mathbf{u}_i\mathbf{u}_i^{\mathsf T}$; the depths cancel. Each outer product is

$$\mathbf{u}\mathbf{u}^{\mathsf T}=\begin{pmatrix}\cos^2\phi&\cos\phi\sin\phi\\ \cos\phi\sin\phi&\sin^2\phi\end{pmatrix},$$

and the double-angle identities $\cos^2\phi=\tfrac12(1+\cos2\phi)$, $\sin^2\phi=\tfrac12(1-\cos2\phi)$, $\cos\phi\sin\phi=\tfrac12\sin2\phi$ give $\mathbf{u}\mathbf{u}^{\mathsf T}=\tfrac12\mathbf{I}+\tfrac12\begin{pmatrix}\cos2\phi&\sin2\phi\\ \sin2\phi&-\cos2\phi\end{pmatrix}$. Summing and multiplying by $2/N$ gives the formula.
:::

{{ interactive: pop-vector | Model motor-cortex neurons, each a dot on the circle at its preferred direction. Press Play to sweep the true movement direction (dashed black arrow) round the circle; the purple arrow is the population vector's decoded direction. With evenly spread preferred directions D E is the identity and the two arrows agree; cluster the neurons, or remove some, and the decoded direction is pulled towards the over-represented axis. }}

**The correction.** If $\mathbf{D}\mathbf{E}$ is invertible, the corrected decoder $\mathbf{D}_c=(\mathbf{D}\mathbf{E})^{-1}\mathbf{D}$ satisfies $\mathbf{D}_c\mathbf{E}=(\mathbf{D}\mathbf{E})^{-1}(\mathbf{D}\mathbf{E})=\mathbf{I}$. It undoes the distortion exactly, for data that follow the model.

{{ figure: cell061_1.svg | A simulated population of 60 neurons with evenly spread preferred directions. Left: their rates over 300 time steps (brighter is faster). Middle: the movement direction over time, true (black) and decoded back from the 60 neurons with D (vermilion). Right: the same in behavioural space. Here D E is close to the identity, and the median error is 2.7°. From the teaching notebook. }}

## Mini-lab: encoding and decoding real visual cortex

The notebook returns to the Lesson 2 recording: 66 neurons in mouse primary visual cortex (left hemisphere) while gratings of contrast $0$, $0.25$, $0.5$ or $1$ appeared on the left, the right, both or neither (Steinmetz et al., 2019; data released under CC0). Behavioural space is now *stimulus space*: the contrast vector $\mathbf{c}=(c_L,\ c_R)$. The trials of each of the 16 stimuli are split alternately into a fit half and a test half.

**The fit as a matrix product.** Lesson 2 fitted each neuron with two projections. Put the 16 centred stimuli in the columns of $\mathbf{S}\in\mathbb{R}^{2\times16}$ (its rows are Lesson 2's $\mathbf{a}$ and $\mathbf{s}$) and the centred response tables in the rows of $\mathbf{C}\in\mathbb{R}^{66\times16}$. Because the rows of $\mathbf{S}$ are orthogonal and equally long, $\mathbf{S}\mathbf{S}^{\mathsf T}=2.1875\,\mathbf{I}$, and all 66 fits are one product:

$$\mathbf{E}=\frac{1}{2.1875}\,\mathbf{C}\mathbf{S}^{\mathsf T}\in\mathbb{R}^{66\times2},\qquad \mathbf{r}=\mathbf{b}+\mathbf{E}(\mathbf{c}-\bar{\mathbf{c}}).$$

Row $i$ of $\mathbf{E}$ is neuron $i$'s weight vector $(w_{L,i},\ w_{R,i})$. Keeping the 14 neurons with fit similarity above 0.8 gives the encoding matrix used below.

**Rank.** $\mathbf{E}$ has rank 2 by construction, while the real $14\times16$ centred response matrix has rank 14. Yet the rank-2 model $\mathbf{E}\mathbf{S}$ captures 88% of the responses' variation on the fit half and 83% on the test half. The rest is noise and saturation.

**The round trip.** Lesson 2 decoded each contrast by projecting onto one column of $\mathbf{E}$. Written as one matrix, with $\mathbf{w}_L$ and $\mathbf{w}_R$ the columns of $\mathbf{E}$,

$$\mathbf{D}=\begin{pmatrix}\mathbf{w}_L^{\mathsf T}/(\mathbf{w}_L\cdot\mathbf{w}_L)\\ \mathbf{w}_R^{\mathsf T}/(\mathbf{w}_R\cdot\mathbf{w}_R)\end{pmatrix},\qquad \mathbf{D}\mathbf{E}=\begin{pmatrix}1 & \dfrac{\mathbf{w}_L\cdot\mathbf{w}_R}{\mathbf{w}_L\cdot\mathbf{w}_L}\\[2mm] \dfrac{\mathbf{w}_L\cdot\mathbf{w}_R}{\mathbf{w}_R\cdot\mathbf{w}_R} & 1\end{pmatrix} =\begin{pmatrix}1&6.12\\0.11&1\end{pmatrix}.$$

The diagonal is exactly 1, but $\mathbf{D}\mathbf{E}=\mathbf{I}$ needs $\mathbf{w}_L\perp\mathbf{w}_R$, and here they are far from orthogonal ($\mathbf{w}_L\cdot\mathbf{w}_R=1311$). Both off-diagonal entries share that numerator; they differ only through the denominators. Because $\lVert \mathbf{w}_L \rVert=14.6$ is much shorter than $\lVert \mathbf{w}_R \rVert=110.2$, the left readout is swamped: each unit of right contrast moves it by 6 units.

{{ interactive: decode-real | Held-out decoding of the 16 stimuli from the real VISp population. Hollow circles are the true stimuli (left contrast across, right contrast up); filled markers are the decoded stimuli, joined to their true positions. Switch between the plain decoder D, whose left readout is dragged along by the right contrast, and the corrected decoder (D E)⁻¹ D, which removes the leak but stays noisy. }}

**The correction on real data.** $\mathbf{D}_c=(\mathbf{D}\mathbf{E})^{-1}\mathbf{D}$ satisfies $\mathbf{D}_c\mathbf{E}=\mathbf{I}$ exactly. On the test half the mean absolute error of the left readout falls from $2.24$ to $0.57$ (contrast units), but the right readout gets slightly worse, $0.10$ to $0.14$. By the $2\times2$ inverse formula, row 1 of $\mathbf{D}_c$ is (left row $-\,6.12\times$ right row)$/0.34$ and row 2 is (right row $-\,0.11\times$ left row)$/0.34$, where $0.34=1-6.12\times0.11$ is the determinant of $\mathbf{D}\mathbf{E}$. The leak is subtracted, but both readouts are divided by a determinant well below 1, and the right readout now carries a share of the left readout's large noise. A matrix close to losing its inverse amplifies noise when inverted. A fixed $2\times2$ matrix removes systematic distortion; it cannot remove noise, and these neurons carry little information about the left side.

::: pitfall
$(\mathbf{D}\mathbf{E})^{-1}\mathbf{D}$ is exact for the *model*, not optimal for the *data*. Fitting a decoder directly to recorded stimuli by least squares (Lesson 5) does better. The model is linear in contrast, ignores saturation, and some test averages rest on two or three trials. Good decoding shows that the information is in the population, not that the brain reads it out this way. Exercise 7 of the exercise notebook asks how decoding depends on the number of neurons, and shows the inverse failing when two neurons' weight vectors are nearly parallel.
:::

## Where this appears in neuroscience and machine learning

**Feedforward pathways and layers.** $\mathbf{a}=f(\mathbf{W}\mathbf{x}+\mathbf{b})$ is both a rate model of one stage of a sensory pathway and one layer of an artificial neural network. Stacking such stages, with nonlinearities between them, is a deep network.

**Low-rank structure.** Low-rank connectivity matrices are used to model how cortical circuits generate low-dimensional dynamics, and bottleneck layers (autoencoders, low-rank adaptation of large models) use the same idea in machine learning.

**Brain–computer interfaces.** Systems that let paralysed people move a cursor or a robotic arm translate motor-cortex activity into movement with a decoding matrix like $\mathbf{D}$. Early systems used the population vector; modern ones fit the decoder to data and add dynamics.

**Geometry of representations.** Rotations, projections and changes of coordinates are how analyses align the neural activity of different animals or sessions, find task-relevant axes (Lesson 2), and reduce dimension (Lesson 7).

**Batched computation.** $\mathbf{Z}=\mathbf{X}\mathbf{W}^{\mathsf T}$ is how every trial, or every training example, is sent through a model in one operation. It is the computation that graphics processors are built to do quickly.

## Lesson summary

- $\mathbf{y}=\mathbf{A}\mathbf{x}$ with $y_i=\sum_ja_{ij}x_j$: rows give dot products, columns give a weighted mixture; $(m\times n)(n)=(m)$.
- $\mathbf{C}=\mathbf{A}\mathbf{B}$ with $c_{ij}=\mathbf{a}_i\cdot\mathbf{b}_{:,j}$: $\mathbf{A}$ applied to every column of $\mathbf{B}$; $(m\times k)(k\times n)=(m\times n)$. A batch with one trial per row is $\mathbf{X}\mathbf{W}^{\mathsf T}$.
- Products are associative and distributive, $(\mathbf{A}\mathbf{B})^{\mathsf T}=\mathbf{B}^{\mathsf T}\mathbf{A}^{\mathsf T}$, but not commutative.
- Linear maps and matrices are the same thing; the columns are the images of the basis vectors. Rotations satisfy $\mathbf{R}^{\mathsf T}\mathbf{R}=\mathbf{I}$ and keep dot products; projections are $\hat{\mathbf{u}}\hat{\mathbf{u}}^{\mathsf T}$ with $\mathbf{P}^2=\mathbf{P}$.
- Composition: $\mathbf{R}(\mathbf{S}\mathbf{x})=(\mathbf{R}\mathbf{S})\mathbf{x}$; the rightmost matrix acts first.
- Rank is the dimension of the image: $\operatorname{rank}\mathbf{A}\le\min(m,n)$, and $\operatorname{rank}(\mathbf{A}\mathbf{B})$ is at most the smaller of $\operatorname{rank}\mathbf{A}$ and $\operatorname{rank}\mathbf{B}$. Lower rank than inputs means lost information.
- $|\det\mathbf{A}|$ is the area factor, and $\det=0$ means no inverse. For $2\times2$, $\mathbf{A}^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$; for a chain, $(\mathbf{A}\mathbf{B})^{-1}=\mathbf{B}^{-1}\mathbf{A}^{-1}$.
- A layer is $f(\mathbf{W}\mathbf{x}+\mathbf{b})$: affine, then nonlinear. Without $f$, layers collapse into one matrix.
- Cosine tuning is the affine map $\mathbf{r}=\mathbf{b}+\mathbf{E}\mathbf{d}$ of rank 2. A decoder $\mathbf{D}$ is faithful when $\mathbf{D}\mathbf{E}=\mathbf{I}$. For the population vector, $\mathbf{D}\mathbf{E}=\mathbf{I}$ plus a term set by the doubled preferred directions. For real V1 contrast tuning, separate projections give off-diagonal leaks; inverting $\mathbf{D}\mathbf{E}$ removes the leak but amplifies noise.

## Exercises

These pen-and-paper exercises complement the coding exercises in the exercise notebook. Try each one before opening its answer.

::: exercise
Compute $\begin{pmatrix}1&2\\3&4\\0&-1\end{pmatrix}\begin{pmatrix}2\\-1\end{pmatrix}$ with the row view and with the column view.
---answer---
**Row view.** $(1\cdot2+2\cdot(-1),\ 3\cdot2+4\cdot(-1),\ 0\cdot2+(-1)(-1))=(0,\ 2,\ 1)$.

**Column view.** $2\,(1,\ 3,\ 0)-1\,(2,\ 4,\ -1)=(0,\ 2,\ 1)$.
:::

::: exercise
$\mathbf{A}$ is $3\times5$, $\mathbf{B}$ is $5\times2$ and $\mathbf{C}$ is $2\times3$. Give the shapes of $\mathbf{A}\mathbf{B}\mathbf{C}$, $\mathbf{C}\mathbf{A}\mathbf{B}$ and $\mathbf{B}\mathbf{C}\mathbf{A}$, and say whether $\mathbf{A}\mathbf{C}$ is defined.
---answer---
- $\mathbf{A}\mathbf{B}\mathbf{C}$: $(3\times5)(5\times2)(2\times3)=3\times3$.
- $\mathbf{C}\mathbf{A}\mathbf{B}$: $(2\times3)(3\times5)(5\times2)=2\times2$.
- $\mathbf{B}\mathbf{C}\mathbf{A}$: $(5\times2)(2\times3)(3\times5)=5\times5$.
- $\mathbf{A}\mathbf{C}$ is **not defined**: the inner sizes are 5 and 2.
:::

::: exercise
Prove $(\mathbf{A}\mathbf{B})^{\mathsf T}=\mathbf{B}^{\mathsf T}\mathbf{A}^{\mathsf T}$ entry by entry. Deduce that $(\mathbf{X}\mathbf{W}^{\mathsf T})^{\mathsf T}=\mathbf{W}\mathbf{X}^{\mathsf T}$, and explain what this says about the samples-as-columns convention.
---answer---
**The rule.** $\big((\mathbf{A}\mathbf{B})^{\mathsf T}\big)_{ij}=(\mathbf{A}\mathbf{B})_{ji}=\sum_l a_{jl}b_{li}=\sum_l(\mathbf{B}^{\mathsf T})_{il}(\mathbf{A}^{\mathsf T})_{lj}=(\mathbf{B}^{\mathsf T}\mathbf{A}^{\mathsf T})_{ij}$.

**The batch product.** With $\mathbf{A}=\mathbf{X}$ and $\mathbf{B}=\mathbf{W}^{\mathsf T}$, $(\mathbf{X}\mathbf{W}^{\mathsf T})^{\mathsf T}=(\mathbf{W}^{\mathsf T})^{\mathsf T}\mathbf{X}^{\mathsf T}=\mathbf{W}\mathbf{X}^{\mathsf T}$.

**Meaning.** If trials are stored as columns ($\mathbf{X}^{\mathsf T}$), the batch product is $\mathbf{W}\mathbf{X}^{\mathsf T}$ and its result has one trial per column. Same numbers, transposed layout; the two conventions must not be mixed.
:::

::: exercise
For $\mathbf{A}=\begin{pmatrix}0&1\\0&0\end{pmatrix}$ and $\mathbf{B}=\begin{pmatrix}0&0\\1&0\end{pmatrix}$, compute $\mathbf{A}\mathbf{B}$ and $\mathbf{B}\mathbf{A}$.
---answer---
$\mathbf{A}\mathbf{B}=\begin{pmatrix}1&0\\0&0\end{pmatrix}$ and $\mathbf{B}\mathbf{A}=\begin{pmatrix}0&0\\0&1\end{pmatrix}$: two different matrices.
:::

::: exercise
Find the matrix that reflects the plane in the line $y=x$, by deciding where $\mathbf{e}_1$ and $\mathbf{e}_2$ go. Compute its determinant and interpret the sign.
---answer---
The reflection swaps the axes: $\mathbf{e}_1\mapsto\mathbf{e}_2$ and $\mathbf{e}_2\mapsto\mathbf{e}_1$, so the matrix is $\begin{pmatrix}0&1\\1&0\end{pmatrix}$.

Its determinant is $0\cdot0-1\cdot1=-1$: areas are kept, but the orientation is flipped, as in a mirror.
:::

::: exercise
Compute $\mathbf{R}_{90^\circ}^2$. Then show, using $\cos(\alpha+\beta)=\cos\alpha\cos\beta-\sin\alpha\sin\beta$ and $\sin(\alpha+\beta)=\sin\alpha\cos\beta+\cos\alpha\sin\beta$, that $\mathbf{R}_\alpha\mathbf{R}_\beta=\mathbf{R}_{\alpha+\beta}$. Do rotations commute?
---answer---
**The square.** $\mathbf{R}_{90}=\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ and $\mathbf{R}_{90}^2=\begin{pmatrix}-1&0\\0&-1\end{pmatrix}=\mathbf{R}_{180}$.

**The product.** Multiplying out, $\mathbf{R}_\alpha\mathbf{R}_\beta$ has first column $(\cos\alpha\cos\beta-\sin\alpha\sin\beta,\ \sin\alpha\cos\beta+\cos\alpha\sin\beta)=(\cos(\alpha+\beta),\ \sin(\alpha+\beta))$, and similarly for the second column.

**Commuting.** Since $\alpha+\beta=\beta+\alpha$, 2-D rotations do commute: a special case, not the rule.
:::

::: exercise
Write the matrix $\mathbf{P}$ that projects onto the line through $(3,\ 4)$. Verify $\mathbf{P}^2=\mathbf{P}$, and give its rank and determinant. Where does $(1,\ 0)$ go?
---answer---
$\hat{\mathbf{u}}=(0.6,\ 0.8)$, so $\mathbf{P}=\hat{\mathbf{u}}\hat{\mathbf{u}}^{\mathsf T}=\begin{pmatrix}0.36&0.48\\0.48&0.64\end{pmatrix}$.

**Check.** The entries of $\mathbf{P}^2$ are $0.36^2+0.48^2=0.36$, $0.36\cdot0.48+0.48\cdot0.64=0.48$ and $0.48^2+0.64^2=0.64$, so $\mathbf{P}^2=\mathbf{P}$.

**Rank and determinant.** Rank 1; determinant $0.36\cdot0.64-0.48^2=0$.

**Image of $(1,0)$:** $(0.36,\ 0.48)$.
:::

::: exercise
Find the rank of $\begin{pmatrix}1&2&0\\2&4&0\\0&0&3\end{pmatrix}$, and a nonzero vector $\mathbf{x}$ with $\mathbf{A}\mathbf{x}=\mathbf{0}$. What does that vector mean for a readout with these weights?
---answer---
**Rank.** Row 2 is twice row 1, and the third row is independent, so the rank is **2**.

**A vector sent to zero.** $\mathbf{x}=(2,\ -1,\ 0)$ gives $\mathbf{A}\mathbf{x}=\mathbf{0}$.

**Meaning.** A readout with these weights cannot see changes of the inputs in that direction (input 1 up by 2, input 2 down by 1): they leave every output unchanged.
:::

::: exercise
Invert $\begin{pmatrix}2&1\\5&3\end{pmatrix}$ with the $2\times2$ formula and check the answer by multiplying.
---answer---
$\det=6-5=1$, so the inverse is $\begin{pmatrix}3&-1\\-5&2\end{pmatrix}$.

**Check.** $\begin{pmatrix}3&-1\\-5&2\end{pmatrix}\begin{pmatrix}2&1\\5&3\end{pmatrix}=\begin{pmatrix}1&0\\0&1\end{pmatrix}$.
:::

::: exercise
Show that a shear $\begin{pmatrix}1&k\\0&1\end{pmatrix}$ has determinant 1 for every $k$, and explain geometrically why it keeps areas. What is its inverse?
---answer---
$\det=1\cdot1-k\cdot0=1$.

**Geometry.** The shear slides each horizontal strip sideways without changing its width or height, so the base and height of any parallelogram, and hence its area, are unchanged.

**Inverse.** Shear back by $-k$: $\begin{pmatrix}1&-k\\0&1\end{pmatrix}$.
:::

::: exercise
For $\mathbf{W}=\operatorname{diag}(1,\ 2)$ and $\mathbf{b}=(1,\ -1)$, show that $T(\mathbf{x})=\mathbf{W}\mathbf{x}+\mathbf{b}$ fails $T(\mathbf{u}+\mathbf{v})=T(\mathbf{u})+T(\mathbf{v})$, and by how much. Write the $3\times3$ augmented matrix.
---answer---
$T(\mathbf{u}+\mathbf{v})=\mathbf{W}\mathbf{u}+\mathbf{W}\mathbf{v}+\mathbf{b}$, while $T(\mathbf{u})+T(\mathbf{v})=\mathbf{W}\mathbf{u}+\mathbf{W}\mathbf{v}+2\mathbf{b}$. They differ by $\mathbf{b}=(1,\ -1)$, which is nonzero.

**Augmented matrix:** $\begin{pmatrix}1&0&1\\0&2&-1\\0&0&1\end{pmatrix}$.
:::

::: exercise
Four neurons have preferred directions $0^\circ$, $90^\circ$, $180^\circ$ and $270^\circ$, all with depth $g=10$ spikes/s. Write $\mathbf{E}$ and the population-vector decoder $\mathbf{D}$, and show $\mathbf{D}\mathbf{E}=\mathbf{I}$. Now remove the $180^\circ$ neuron. Compute the new $\mathbf{D}\mathbf{E}$ and the direction decoded for a true movement at $45^\circ$.
---answer---
**Four neurons.**

$$\mathbf{E}=10\begin{pmatrix}1&0\\0&1\\-1&0\\0&-1\end{pmatrix},\qquad \mathbf{D}=\frac{2}{4}\cdot\frac{1}{10}\begin{pmatrix}1&0&-1&0\\0&1&0&-1\end{pmatrix},\qquad \mathbf{D}\mathbf{E}=\frac{2}{4}\begin{pmatrix}2&0\\0&2\end{pmatrix}=\mathbf{I}.$$

**Three neurons** ($N=3$, without $180^\circ$): $\mathbf{D}\mathbf{E}=\frac{2}{3}\sum_i\mathbf{u}_i\mathbf{u}_i^{\mathsf T}=\frac23\begin{pmatrix}1&0\\0&2\end{pmatrix}$.

**Decoding $45^\circ$.** For $\mathbf{d}\propto(1,\ 1)$ the output is $\propto(\tfrac23,\ \tfrac43)$, at angle $\arctan 2=63.4^\circ$ instead of $45^\circ$. The vertical axis is now over-represented (two neurons against one), so the decoded direction is pulled towards it.
:::

::: exercise
*(Challenge.)* Show that $\operatorname{rank}(\mathbf{A}\mathbf{B})\le\operatorname{rank}\mathbf{A}$ always, and give an example where $\mathbf{A}$ and $\mathbf{B}$ both have rank 1 but $\mathbf{A}\mathbf{B}=\mathbf{0}$ (rank 0).
---answer---
**The bound.** Every output $\mathbf{A}\mathbf{B}\mathbf{x}=\mathbf{A}(\mathbf{B}\mathbf{x})$ is an output of $\mathbf{A}$, so the image of $\mathbf{A}\mathbf{B}$ lies inside the image of $\mathbf{A}$ and cannot have more independent directions.

**Example.** $\mathbf{A}=\begin{pmatrix}1&0\\0&0\end{pmatrix}$ (projection onto the $x$-axis) and $\mathbf{B}=\begin{pmatrix}0&0\\0&1\end{pmatrix}$ (onto the $y$-axis) give $\mathbf{A}\mathbf{B}=\mathbf{0}$: $\mathbf{B}$ keeps only the $y$-coordinate, which $\mathbf{A}$ then throws away.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, including a real-data exercise on how decoding depends on the number of neurons. Both open in Google Colab.

{{ colab: week1/lesson4/Lesson4_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week1/lesson4/Lesson4_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Introduction to Linear Algebra*, 6th ed., Wellesley–Cambridge Press, 2023. Chapters 2 and 8 cover matrix multiplication and linear transformations.
- 3Blue1Brown, *Essence of Linear Algebra* (video series), chapters 3–7: linear transformations, composition, determinants and inverses, animated.
- A. P. Georgopoulos, A. B. Schwartz and R. E. Kettner, "Neuronal population coding of movement direction", *Science* 233(4771):1416–1419, 1986.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recordings (data released under CC0; the subsets used here are in the course repository's `data/` folder).
- J. P. Cunningham and B. M. Yu, "Dimensionality reduction for large-scale neural recordings", *Nature Neuroscience* 17:1500–1509, 2014. Low-dimensional structure in population activity.
- Neuromatch Academy, Computational Neuroscience course, https://compneuro.neuromatch.io (CC-BY 4.0). Its linear-algebra refresher covers the same ground with neural examples.
