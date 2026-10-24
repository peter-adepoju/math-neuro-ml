---
summary: "Recordings, connectivity and the bookkeeping that keeps them honest: matrix shape and axes, the transpose, special matrices, adjacency matrices, elementwise versus matrix operations, centring, missing data and aligned labels."
---

::: objectives
- What a matrix is, how its entries are indexed, and why its *shape* is the first thing to check
- How rows, columns and NumPy axes correspond, and how to predict the shape of any reduction before running it
- What the transpose does, the rules it obeys, and how it connects to the dot product of Lesson 2
- The special matrices you will meet again and again: identity, diagonal, symmetric and antisymmetric
- How a matrix can describe a neural circuit, how to read inputs and outputs from it, and why large circuits are stored sparsely
- The difference between elementwise operations and matrix operations, and how broadcasting works
- Why centred columns have mean zero and z-scored columns have standard deviation one, and why the statistics must come from training data only
- How missing values bias summaries, and how one misaligned label column can silently ruin an analysis
:::

**Before you start.** This reading is the mathematical companion to the Lesson 3 teaching notebook. You need the vector ideas from Lessons 1 and 2: a vector $\mathbf{v}=(v_1,\dots,v_n)$, its norm $\lVert \mathbf{v} \rVert$, the dot product $\mathbf{u}\cdot\mathbf{v}=\sum_i u_iv_i$ and cosine similarity. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

Lessons 1 and 2 worked with one vector, or two, at a time. Real recordings contain hundreds of trials and hundreds of neurons. This lesson is about organising them as a single table of numbers, a **matrix**, and about handling that table correctly. Much of it is bookkeeping, and that is the point: most analysis errors in neuroscience are bookkeeping errors, and they almost never raise an error message. Most examples use small simulated tables, so that every number can be checked by hand; the mini-lab then applies the same steps to a real Neuropixels recording.

| Symbol | Meaning |
|---|---|
| $\mathbf{X}, \mathbf{A}, \mathbf{W}$ | matrices (bold capitals) |
| $x_{ij}$ | the entry of $\mathbf{X}$ in row $i$, column $j$ (a single number) |
| $m \times n$ | the shape: $m$ rows and $n$ columns |
| $\mathbb{R}^{m\times n}$ | the set of all real $m\times n$ matrices |
| $\mathbf{x}_i$ | row $i$ of $\mathbf{X}$, read as a vector (trial $i$'s population vector) |
| $\mathbf{X}^{\mathsf T}$ | the transpose of $\mathbf{X}$ |
| $\mathbf{I}_n$ | the $n\times n$ identity matrix |
| $\mathbf{A}\odot\mathbf{B}$ | the elementwise (Hadamard) product |
| $\mathbf{1}$ | a column of ones, $(1,1,\dots,1)^{\mathsf T}$ |
| $\mu_j,\ \sigma_j$ | the mean and standard deviation of column $j$ |

## The problem: one recording session as one table

Three neurons are recorded on four trials. On each trial we note each neuron's firing rate, in spikes per second. Writing the trials as rows and the neurons as columns gives a table:

$$\mathbf{R} = \begin{pmatrix} 12 & 4 & 19\\ 50 & 8 & 33\\ 14 & 5 & 21\\ 48 & 9 & 30 \end{pmatrix} \begin{matrix} \leftarrow \text{trial 1}\\ \leftarrow \text{trial 2}\\ \leftarrow \text{trial 3}\\ \leftarrow \text{trial 4} \end{matrix} \qquad \text{columns: N1, N2, N3.}$$

Every question we might ask is a question about a slice of this table.

- *What did the population do on trial 2?* Read row 2: $(50,\ 8,\ 33)$ spikes/s. This is a population vector, exactly the object of Lessons 1 and 2.
- *How did neuron N3 behave across the session?* Read column 3: $(19,\ 33,\ 21,\ 30)$ spikes/s.
- *What is the average population response?* Average the rows: $(31,\ 6.5,\ 25.75)$ spikes/s.

Trials 2 and 4 look alike and trials 1 and 3 look alike, which hints at two experimental conditions. Spotting such structure, and then testing it, is what the rest of Part I is about.

```python
R = np.array([[12.0,  4.0, 19.0],
              [50.0,  8.0, 33.0],
              [14.0,  5.0, 21.0],
              [48.0,  9.0, 30.0]])   # spikes/s, shape (n_trials, n_neurons) = (4, 3)

print(R[1])            # -> [50.  8. 33.]        trial 2 (row index 1)
print(R[:, 2])         # -> [19. 33. 21. 30.]    neuron N3 (column index 2)
print(R.mean(axis=0))  # -> [31.   6.5  25.75]   mean population vector
```

The same table shape appears far outside neuroscience. A machine-learning dataset of three houses described by size, number of bedrooms and age is also a $3\times3$ matrix, one house per row, one feature per column. Learning algorithms do not care whether a row is a trial or a house; they care that *each row is one observation and each column is one measured quantity*. This convention is used throughout the course.

::: keypoint
**Rows are observations, columns are variables.** In this course a data matrix has shape (number of observations, number of variables): (trials, neurons), (time bins, neurons), (houses, features). Before any analysis, say aloud what one row is, what one column is, and what the units are.
:::

## Matrices: notation, entries and shape

::: definition Definition: matrix
An $m\times n$ **matrix** is a rectangular array of numbers with $m$ rows and $n$ columns:

$$\mathbf{X} = \begin{pmatrix} x_{11} & x_{12} & \cdots & x_{1n}\\ x_{21} & x_{22} & \cdots & x_{2n}\\ \vdots & \vdots & \ddots & \vdots\\ x_{m1} & x_{m2} & \cdots & x_{mn} \end{pmatrix}.$$

The pair $(m, n)$ is its **shape**. The number $x_{ij}$ is the **entry** in row $i$ and column $j$: row index first, column index second, always. The set of all real $m\times n$ matrices is written $\mathbb{R}^{m\times n}$, so "$\mathbf{X}\in\mathbb{R}^{24\times 6}$" means "$\mathbf{X}$ is a table of real numbers with 24 rows and 6 columns".
:::

Two small points cause most of the confusion in practice.

**Mathematics counts from 1, Python from 0.** The entry $x_{34}$ (row 3, column 4) is `X[2, 3]` in NumPy. In the notebook's recording, $x_{34}$ is trial 3's rate for neuron N4, and `rates[2, 3]` returns $42.9$ spikes/s. This page uses mathematical indices; the code uses Python's.

**A matrix needs a description, not just numbers.** `rates` has shape $(24,6)$. Without the sentence "24 trials by 6 neurons, in spikes/s, rows in the order the trials were run", the array is uninterpretable, and even the shape could be misread as 24 neurons and 6 trials. Every array in this course is described by its *shape*, its *units* and the *meaning of each axis*.

{{ interactive: matrix-explorer | The notebook's simulated session: 24 trials (rows) by 6 neurons (columns), in spikes/s. Click a row label to read one trial's population vector, or a column label to follow one neuron through the session. The reduction buttons show which axis disappears. }}

### Vectors as thin matrices

A vector with $n$ coordinates can be written as a matrix in two ways: as a **column vector**, an $n\times 1$ matrix, or as a **row vector**, a $1\times n$ matrix. In linear algebra the default is the column; a row is written as the transpose of a column. In NumPy, a plain 1-D array of shape `(n,)` is neither: it has one axis, not two. That is usually convenient, but it means `x.T` on a 1-D array does nothing. If you ever need an explicit column, `x.reshape(-1, 1)` gives shape $(n,1)$.

::: pitfall
Shapes `(6,)`, `(6, 1)` and `(1, 6)` hold the same six numbers but behave differently. Adding a `(6, 1)` array to a `(6,)` array does not raise an error; broadcasting quietly produces a $6\times6$ matrix. When a result has an unexpected shape, print the shapes of the inputs first.
:::

## Rows, columns and axes

Write row $i$ of $\mathbf{X}$ as $\mathbf{x}_i=(x_{i1},\dots,x_{in})$; it is trial $i$'s population vector. Column $j$ holds neuron $j$'s rate on every trial. NumPy names the two directions by number:

- **axis 0** runs *down* the rows (it indexes trials);
- **axis 1** runs *across* the columns (it indexes neurons).

### Reductions: the axis you name disappears

A **reduction** turns many numbers into one: a sum, a mean, a maximum. Applied to a matrix along one axis, it collapses that axis and keeps the other.

::: keypoint
For $\mathbf{X}\in\mathbb{R}^{m\times n}$,

$$\mu_j = \frac{1}{m}\sum_{i=1}^{m} x_{ij} \quad (\texttt{X.mean(axis=0)}, \text{ shape } (n,)), \qquad \bar{x}_i = \frac{1}{n}\sum_{j=1}^{n} x_{ij} \quad (\texttt{X.mean(axis=1)}, \text{ shape } (m,)).$$

`axis=0` averages over the row index $i$, so the rows disappear and one number per column remains. `axis=1` averages over the column index $j$, so one number per row remains. The rule: *the axis you name is the one that disappears*.
:::

::: example Worked example: the four-trial table
**Column means** (`axis=0`): $\mu_1=(12+50+14+48)/4=31$, $\mu_2=(4+8+5+9)/4=6.5$, $\mu_3=(19+33+21+30)/4=25.75$. Shape $(3,)$, one per neuron, in spikes/s.

**Row means** (`axis=1`): $35/3=11.7$, $91/3=30.3$, $40/3=13.3$, $87/3=29.0$. Shape $(4,)$, one per trial: the average activity of the whole population on that trial. The row means confirm the two groups of trials seen above.
:::

The two reductions answer different scientific questions. The column mean is a neuron's average rate across the session. The row mean is the population's overall activity on one trial, which tracks things like arousal or attention that affect many neurons together. Using the wrong one does not crash; it answers a question you did not ask.

### Condition means with a mask

Averaging only some of the rows gives one population vector per condition. Let $\mathcal{I}_c$ be the set of trial indices in condition $c$, with $|\mathcal{I}_c|$ trials in it. The **condition mean** is

$$\bar{\mathbf{x}}_c = \frac{1}{|\mathcal{I}_c|}\sum_{i\in\mathcal{I}_c} \mathbf{x}_i ,$$

an average of population vectors, using the vector addition and scaling of Lesson 1. In NumPy the set $\mathcal{I}_c$ is a **boolean mask**, an array of `True`/`False` with one entry per row (try the *left trials only* button in the figure above):

```python
is_left = conditions == 'left'            # shape (24,), True on left trials
left_mean = rates[is_left].mean(axis=0)   # shape (6,): one mean per neuron
# -> [20.9  5.  12.  78.4  7.9 14.8]  spikes/s
```

The mask must have one entry per *row*, in the same order as the rows. The section on keeping metadata aligned shows what happens when it does not.

::: quiz
? `X` has shape `(340, 698)`: trials by neurons. What is the shape of `X.mean(axis=0)`?
- [ ] `(340,)`
- [x] `(698,)`
- [ ] `(340, 698)`
- [ ] `(1,)`
> The axis you name disappears. `axis=0` indexes the 340 trials, so averaging over it leaves one number per neuron: 698 of them.

? Which question does a row mean of a (trials, neurons) matrix answer?
- [ ] How active is each neuron on average across the session?
- [x] How active was the whole population on each trial?
- [ ] How many trials did each neuron fire on?
> A row is one trial, so its mean is that trial's average across neurons: the population's overall activity on the trial.
:::

## The transpose

::: definition Definition: transpose
The **transpose** of an $m\times n$ matrix $\mathbf{A}$ is the $n\times m$ matrix $\mathbf{A}^{\mathsf T}$ with entries

$$(\mathbf{A}^{\mathsf T})_{ij} = a_{ji}.$$

Rows become columns and columns become rows. Geometrically, the matrix is reflected in its main diagonal (the entries $a_{11}, a_{22}, \dots$).
:::

::: example Worked example: a small transpose
$$\mathbf{A}=\begin{pmatrix} 1 & 2 & 3\\ 4 & 5 & 6\end{pmatrix}\ (2\times3) \qquad\Longrightarrow\qquad \mathbf{A}^{\mathsf T}=\begin{pmatrix} 1 & 4\\ 2 & 5\\ 3 & 6\end{pmatrix}\ (3\times2).$$

The entry $a_{23}=6$ moves to position $(3,2)$ of $\mathbf{A}^{\mathsf T}$. In the notebook, `rates[2, 3]` and `rates.T[3, 2]` are both $42.9$.
:::

{{ interactive: transpose | The four-trial table R and its transpose. Press Play, or drag the slider, to watch every entry reflect in the main diagonal: entry (i, j) lands at (j, i), and the diagonal stays put. Click any entry to follow it. }}

### Rules the transpose obeys

Here $\mathbf{A}$ and $\mathbf{B}$ have the same shape and $c$ is a number.

| Rule | Statement | In words |
|---|---|---|
| Double transpose | $(\mathbf{A}^{\mathsf T})^{\mathsf T}=\mathbf{A}$ | reflecting twice gets you back |
| Sums | $(\mathbf{A}+\mathbf{B})^{\mathsf T}=\mathbf{A}^{\mathsf T}+\mathbf{B}^{\mathsf T}$ | transpose then add, or add then transpose |
| Scaling | $(c\mathbf{A})^{\mathsf T}=c\,\mathbf{A}^{\mathsf T}$ | numbers pass straight through |
| Shape | $m\times n \ \mapsto\ n\times m$ | the two shape numbers swap |

::: note Why it is true: the three rules
Compare entries. Two matrices are equal exactly when they have the same shape and every entry agrees.

- $\big((\mathbf{A}^{\mathsf T})^{\mathsf T}\big)_{ij} = (\mathbf{A}^{\mathsf T})_{ji} = a_{ij}$, applying the definition twice.
- $\big((\mathbf{A}+\mathbf{B})^{\mathsf T}\big)_{ij} = (\mathbf{A}+\mathbf{B})_{ji} = a_{ji}+b_{ji} = (\mathbf{A}^{\mathsf T})_{ij}+(\mathbf{B}^{\mathsf T})_{ij}$.
- $\big((c\mathbf{A})^{\mathsf T}\big)_{ij} = (c\mathbf{A})_{ji} = c\,a_{ji} = c\,(\mathbf{A}^{\mathsf T})_{ij}$.
:::

### The transpose and the dot product

Treat $\mathbf{u}$ and $\mathbf{v}$ as $n\times1$ columns. Then $\mathbf{u}^{\mathsf T}$ is a $1\times n$ row, and the row-times-column product, which Lesson 4 defines in general, is exactly the dot product of Lesson 2:

$$\mathbf{u}^{\mathsf T}\mathbf{v} = \begin{pmatrix} u_1 & \cdots & u_n\end{pmatrix}\begin{pmatrix} v_1\\ \vdots\\ v_n\end{pmatrix} = \sum_{i=1}^{n}u_iv_i = \mathbf{u}\cdot\mathbf{v}.$$

This is why textbooks write the dot product as $\mathbf{u}^{\mathsf T}\mathbf{v}$, and why a neuron's input $\mathbf{w}\cdot\mathbf{x}+b$ appears as $\mathbf{w}^{\mathsf T}\mathbf{x}+b$.

### Why you transpose, and the bug it can cause

Data arrive in many orientations. Some recording software saves (neurons, time bins); scikit-learn and almost every machine-learning library expect (observations, variables). Transposing is how you match the convention. The danger is that after a transpose the same axis number means something else.

::: pitfall
`rates.T` has shape $(6, 24)$: neurons are now rows. `rates.T.mean(axis=0)` returns 24 numbers, one per *trial*, not one per neuron. No error is raised, because 24 numbers is a perfectly valid answer to a different question. After any transpose, re-describe the array's axes and re-check the shape of each reduction.
:::

## Special matrices

A matrix is **square** when $m=n$. Square matrices have a **main diagonal**, the entries $a_{11}, a_{22},\dots,a_{nn}$, and several kinds of square matrix are common enough to have names.

::: definition Definition: identity, diagonal, symmetric and antisymmetric
- The **identity** $\mathbf{I}_n$ has ones on the diagonal and zeros elsewhere: $(\mathbf{I}_n)_{ij}=1$ if $i=j$ and $0$ otherwise. In Lesson 4 it plays the role of the number 1: multiplying by it changes nothing.
- A **diagonal** matrix has zeros everywhere off the diagonal. It scales each coordinate separately; a diagonal matrix of gains $\operatorname{diag}(2,\,1,\,0.5,\,1,\,3)$ doubles neuron 1, halves neuron 3 and triples neuron 5.
- A **symmetric** matrix satisfies $\mathbf{A}^{\mathsf T}=\mathbf{A}$, that is $a_{ij}=a_{ji}$ for every pair: the matrix is its own mirror image.
- An **antisymmetric** (or skew-symmetric) matrix satisfies $\mathbf{A}^{\mathsf T}=-\mathbf{A}$.
:::

### Distance and similarity matrices are symmetric

Take $k$ trials and form the $k\times k$ matrix $\mathbf{D}$ with $d_{ij}=\lVert \mathbf{x}_i-\mathbf{x}_j \rVert$, the Lesson 1 distance between trials $i$ and $j$. Two facts follow immediately.

- $d_{ij}=d_{ji}$, because $\mathbf{x}_i-\mathbf{x}_j=-(\mathbf{x}_j-\mathbf{x}_i)$ and a vector and its negative have the same length. So $\mathbf{D}$ is symmetric.
- $d_{ii}=\lVert \mathbf{0} \rVert=0$. So the diagonal is zero.

The same argument with the symmetry of the dot product shows that a matrix of cosine similarities is symmetric with ones on the diagonal, like the one in Lesson 2. Matrices like these are the basic object of **representational similarity analysis**, which compares brain regions, or brains and neural networks, by comparing their similarity matrices.

### Every square matrix is symmetric plus antisymmetric

::: keypoint
Any square matrix splits uniquely as

$$\mathbf{A} = \underbrace{\tfrac12(\mathbf{A}+\mathbf{A}^{\mathsf T})}_{\text{symmetric part}} + \underbrace{\tfrac12(\mathbf{A}-\mathbf{A}^{\mathsf T})}_{\text{antisymmetric part}} .$$
:::

::: note Why it is true: the decomposition
Call the two parts $\mathbf{S}$ and $\mathbf{K}$. Their sum is $\tfrac12\mathbf{A}+\tfrac12\mathbf{A}^{\mathsf T}+\tfrac12\mathbf{A}-\tfrac12\mathbf{A}^{\mathsf T}=\mathbf{A}$. Using the transpose rules, $\mathbf{S}^{\mathsf T}=\tfrac12(\mathbf{A}^{\mathsf T}+\mathbf{A})=\mathbf{S}$ and $\mathbf{K}^{\mathsf T}=\tfrac12(\mathbf{A}^{\mathsf T}-\mathbf{A})=-\mathbf{K}$.

**Uniqueness.** Suppose also $\mathbf{A}=\mathbf{S}'+\mathbf{K}'$ with $\mathbf{S}'$ symmetric and $\mathbf{K}'$ antisymmetric. Then $\mathbf{A}^{\mathsf T}=\mathbf{S}'-\mathbf{K}'$, and adding and subtracting the two equations gives $\mathbf{S}'=\tfrac12(\mathbf{A}+\mathbf{A}^{\mathsf T})$ and $\mathbf{K}'=\tfrac12(\mathbf{A}-\mathbf{A}^{\mathsf T})$.

**The diagonal.** $\mathbf{K}^{\mathsf T}=-\mathbf{K}$ on the diagonal reads $k_{ii}=-k_{ii}$, so every diagonal entry of an antisymmetric matrix is zero.
:::

For a connectivity matrix (next section) the split has a meaning. The symmetric part says how strongly each pair of neurons is coupled, whichever way the signal travels; the antisymmetric part says which direction dominates. Ignoring direction, as an undirected network analysis does, keeps only the symmetric part.

{{ interactive: pair-split | Two neurons and their two connections. Set the weight from N1 to N2 and the weight from N2 to N1, and see the matrix split into its symmetric part (the average coupling of the pair, drawn without direction) and its antisymmetric part (the imbalance between the two directions). Try +0.4 one way and −0.4 the other: the symmetric part vanishes and the pair looks unconnected. }}

## Connectivity as an adjacency matrix

A matrix need not hold measurements. It can describe a **network**: $n$ neurons (nodes) and weighted connections (edges) between them.

::: definition Definition: adjacency matrix
For a network of $n$ neurons, the **adjacency matrix** is the $n\times n$ matrix $\mathbf{A}$ with

$$a_{ij} = \text{weight of the connection from neuron } j \text{ to neuron } i,$$

and $a_{ij}=0$ when there is no connection. Row $i$ lists everything neuron $i$ *receives*; column $j$ lists everything neuron $j$ *sends*. Positive weights are excitatory, negative weights inhibitory; diagonal entries $a_{ii}$ are self-connections.
:::

The "row = target, column = source" convention is not arbitrary. If neuron $j$ fires at rate $r_j$, neuron $i$'s total input is $\sum_j a_{ij}r_j$: row $i$ of $\mathbf{A}$ dotted with the rate vector. In Lesson 4 this becomes the matrix–vector product $\mathbf{A}\mathbf{r}$, which computes every neuron's input at once. Some graph libraries use the opposite convention; always check.

{{ interactive: adjacency | The notebook's six-neuron circuit and its adjacency matrix, side by side. Excitatory connections are blue, the one inhibitory connection is vermilion. Click a neuron to highlight its row (what it receives) and its column (what it sends); click a matrix entry to light up its arrow. "Lesion N1" multiplies the matrix by a mask that zeroes N1's column. }}

### Reading a circuit from its matrix

::: keypoint
For a weighted network with adjacency matrix $\mathbf{A}$,

$$s_i^{\text{in}} = \sum_{j=1}^{n} a_{ij}\ \ (\text{row sum}), \qquad s_j^{\text{out}} = \sum_{i=1}^{n} a_{ij}\ \ (\text{column sum}), \qquad \text{density} = \frac{\#\{(i,j): a_{ij}\neq 0\}}{n^2}.$$

In NumPy: `A.sum(axis=1)`, `A.sum(axis=0)` and `np.count_nonzero(A) / A.size`.
:::

The in-strength $s_i^{\text{in}}$ is the net drive neuron $i$ would receive if every source fired at rate 1; the out-strength is the net influence neuron $j$ exerts. Replacing each weight by $1$ if nonzero gives the **in-degree** and **out-degree**, the number of incoming and outgoing connections. Excluding self-connections, some authors divide the number of connections by $n(n-1)$ instead of $n^2$; state which you use.

::: example Worked example: the notebook circuit
The connections are N1→N2 ($+0.8$), N1→N4 ($+0.4$), N2→N3 ($+0.6$), N3→N1 ($-0.5$), N4→N5 ($+0.9$), N5→N4 ($+0.9$) and N5→N6 ($+0.7$).

**In-strengths** (row sums): N1 $-0.5$, N2 $+0.8$, N3 $+0.6$, N4 $0.4+0.9=+1.3$, N5 $+0.9$, N6 $+0.7$.

**Out-strengths** (column sums): N1 $0.8+0.4=+1.2$, N2 $+0.6$, N3 $-0.5$, N4 $+0.9$, N5 $0.9+0.7=+1.6$, N6 $0$.

**Density:** 7 connections out of $6^2=36$ possible, $7/36=0.19$. N6 sends nothing: it is a pure output. The pair N4 ↔ N5 excite each other, a recurrent loop. Since $a_{21}=0.8$ but $a_{12}=0$, the matrix is not symmetric.
:::

::: note Why it is true: total input equals total output
Every connection is counted once as somebody's input and once as somebody's output. In symbols, add up all the entries of $\mathbf{A}$ in two orders:

$$\sum_{i=1}^{n} s_i^{\text{in}} = \sum_{i=1}^{n}\sum_{j=1}^{n} a_{ij} = \sum_{j=1}^{n}\sum_{i=1}^{n} a_{ij} = \sum_{j=1}^{n} s_j^{\text{out}}.$$

Check: $-0.5+0.8+0.6+1.3+0.9+0.7 = 3.8 = 1.2+0.6-0.5+0.9+1.6+0$.
:::

### Large networks are sparse

Real circuits are mostly empty. The nematode *C. elegans*, whose full wiring diagram is known, has 302 neurons and a few thousand synaptic connections, so only a few per cent of its $302^2\approx 91{,}000$ possible connections exist. In cortex the fraction is far smaller. A matrix that is mostly zeros is called **sparse**.

Storing every zero wastes memory. A dense $n\times n$ matrix of 64-bit floating-point numbers uses $8n^2$ bytes, whatever is in it. The notebook's network has $n=2000$ neurons at about 1% density: $8\times2000^2 = 32$ MB, almost all of it zeros.

{{ figure: cell039_1.svg | A spy plot of the first 300 neurons of the notebook's 2000-neuron network: each dot is one nonzero entry, one connection. About 1% of the possible connections exist. From the teaching notebook. }}

**Compressed sparse row** (CSR) storage keeps only the nonzeros, in three arrays:

- `data`: the nonzero values, row by row (nnz numbers, where nnz is the number of nonzeros);
- `indices`: the column of each value (nnz integers);
- `indptr`: where each row starts in `data` ($m+1$ integers). Row $i$ occupies positions `indptr[i]` up to, but not including, `indptr[i+1]`; an empty row starts and ends at the same place.

::: keypoint
With 8-byte values and 4-byte integer indices, an $m\times n$ matrix with nnz nonzeros needs

$$\text{dense: } 8mn \text{ bytes}, \qquad \text{CSR: } 8\,\text{nnz} + 4\,\text{nnz} + 4(m+1) = 12\,\text{nnz}+4(m+1) \text{ bytes}.$$
:::

::: example Worked example: the notebook's 2000-neuron network
It has $\text{nnz}=40{,}117$. CSR: $12\times40{,}117+4\times2001 = 489{,}408$ bytes, about $0.5$ MB, against $32$ MB dense: 65 times smaller. The saving grows with $n$, because dense storage grows like $n^2$ while CSR grows like the number of connections.
:::

{{ interactive: sparse-memory | Memory needed to store an n × n connectivity matrix, dense (vermilion) and in CSR (blue), as the density of connections changes. Move the sliders: below a density of 2/3 CSR is smaller, and at realistic densities it is smaller by orders of magnitude. }}

Sparse storage is not always better. Ignoring the small $4(m+1)$ term, CSR is smaller than dense when $12\,\text{nnz}<8mn$, that is when the density $\text{nnz}/(mn)$ is below $8/12=2/3$. In practice sparse formats pay off only at much lower densities, because sparse arithmetic is slower per entry; a common rule of thumb is to go sparse below roughly 10%.

::: quiz
? In this course's convention, where is the connection from neuron 3 to neuron 5 stored in the adjacency matrix?
- [ ] Row 3, column 5
- [x] Row 5, column 3
- [ ] On the diagonal
> Rows are targets and columns are sources: $a_{ij}$ is the weight from $j$ to $i$, so the connection from 3 to 5 is $a_{53}$.

? A matrix is antisymmetric. What must its diagonal be?
- [ ] All ones
- [x] All zeros
- [ ] It can be anything
> $\mathbf{A}^{\mathsf T}=-\mathbf{A}$ on the diagonal says $a_{ii}=-a_{ii}$, which forces $a_{ii}=0$.

? Which is the column sum of an adjacency matrix?
- [ ] A neuron's in-strength: everything it receives
- [x] A neuron's out-strength: everything it sends
- [ ] The density of the network
> Column $j$ lists every connection leaving neuron $j$, so its sum is $j$'s out-strength.
:::

## Elementwise operations versus matrix operations

Several operations on matrices simply act on each entry separately. For matrices of the same shape and a number $c$,

$$(\mathbf{A}+\mathbf{B})_{ij}=a_{ij}+b_{ij}, \qquad (c\mathbf{A})_{ij}=c\,a_{ij}, \qquad (\mathbf{A}\odot\mathbf{B})_{ij}=a_{ij}\,b_{ij}.$$

The third is the **elementwise** or **Hadamard product**, written `A * B` in NumPy.

::: example Worked example: three elementwise operations from the notebook
**Averaging sessions.** For two sessions with the same trials and neurons, $\tfrac12(\mathbf{X}^{(1)}+\mathbf{X}^{(2)})$ averages entry by entry.

**Changing units.** Multiplying a matrix of rates (spikes/s) by $c=0.05$ s gives expected spike counts in a 50 ms window. Trial 1's rate for N1, $20.2$ spikes/s, becomes $1.01$ spikes.

**Lesioning.** Let $\mathbf{M}$ be a **mask**: a matrix of ones, with zeros in column N1. Then $\mathbf{A}\odot\mathbf{M}$ keeps every connection except those leaving N1. Of the circuit's 7 connections, 5 remain (try *Lesion N1* in the circuit figure).
:::

::: note Why it is true: the Hadamard rules
Each rule is a rule about ordinary numbers, applied to each entry.

- **Commutative and associative:** $a_{ij}b_{ij}=b_{ij}a_{ij}$ and $(a_{ij}b_{ij})c_{ij}=a_{ij}(b_{ij}c_{ij})$.
- **Distributes over addition:** $a_{ij}(b_{ij}+c_{ij})=a_{ij}b_{ij}+a_{ij}c_{ij}$.
- **Its identity is the all-ones matrix $\mathbf{J}$**, *not* $\mathbf{I}$: $\mathbf{A}\odot\mathbf{I}$ keeps only the diagonal of $\mathbf{A}$.
- **A 0/1 mask is idempotent:** $\mathbf{M}\odot\mathbf{M}=\mathbf{M}$, because $0^2=0$ and $1^2=1$. Applying a lesion twice is the same as applying it once.
:::

### Broadcasting

Subtracting a baseline rate from every trial means subtracting the same vector $\mathbf{b}=(b_1,\dots,b_n)$ from every row. Mathematically this is

$$\mathbf{X} - \mathbf{1}\mathbf{b}^{\mathsf T}, \qquad \text{where } \mathbf{1}\mathbf{b}^{\mathsf T} = \begin{pmatrix} b_1 & \cdots & b_n\\ \vdots & & \vdots\\ b_1 & \cdots & b_n\end{pmatrix}\ (m\times n)$$

is the matrix whose every row is $\mathbf{b}$. NumPy never builds that matrix: `X - b`, with `X` of shape $(m,n)$ and `b` of shape $(n,)$, **broadcasts** `b` across the rows. Shapes are compared from the right; each pair of sizes must be equal, or one of them must be 1 (or missing). $(24,6)$ and $(6,)$ match; $(24,6)$ and $(24,)$ do not, and raise an error. To subtract a per-trial value, give it shape $(24,1)$.

### The most important distinction in this lesson

Given a weight vector $\mathbf{w}$ with one weight per neuron, `rates * w` and `rates @ w` look alike and compute very different things:

$$\underbrace{(\mathbf{X}\odot\mathbf{1}\mathbf{w}^{\mathsf T})_{ij} = x_{ij}w_j}_{\texttt{X * w}:\ \text{shape } (m,n)} \qquad\qquad \underbrace{(\mathbf{X}\mathbf{w})_i = \sum_{j=1}^{n} x_{ij}w_j = \mathbf{x}_i\cdot\mathbf{w}}_{\texttt{X @ w}:\ \text{shape } (m,)}$$

The first scales each column and keeps the matrix. The second multiplies and then *adds across each row*: it is the Lesson 2 dot product, done once per trial. It gives one weighted sum per trial, such as a decoder's score.

::: example Worked example: trial 1
$\mathbf{x}_1=(20.2,\ 7.8,\ 13.2,\ 73.1,\ 9.1,\ 13.1)$ spikes/s and $\mathbf{w}=(1,\ -1,\ 0,\ 0.05,\ -0.5,\ 0)$. The six products are $20.2,\ -7.8,\ 0,\ 3.655,\ -4.55,\ 0$: that is row 1 of `rates * w`. Their sum, $11.5$ spikes/s, is entry 1 of `rates @ w`.
:::

{{ interactive: star-vs-at | The same weights, two operations. Left: rates * w, still a 24 × 6 matrix, each column scaled by its neuron's weight (blue negative, vermilion positive). Right: rates @ w, one weighted sum per trial; bars are labelled with each trial's true condition (L or R). Change the weights and see how well the sign of the sum separates left from right trials. }}

::: pitfall
Writing `*` where you meant `@` usually does not crash: broadcasting makes the shapes compatible and you get a matrix instead of a vector. If you then call `.sum()` on it you even get a single number, which is the sum of all the trials' scores rather than any one of them. Check the shape of every product.
:::

## Centring and scaling

In the recording, N4 fires around 56 spikes/s and N3 around 12. Any method that compares raw numbers across neurons, such as a distance, a dot product, or a learning algorithm's weights, is dominated by the high-rate neuron. Two standard transformations remove this.

::: definition Definition: centring and z-scoring
For column $j$ of $\mathbf{X}\in\mathbb{R}^{m\times n}$, with mean $\mu_j=\frac1m\sum_i x_{ij}$ and standard deviation $\sigma_j=\sqrt{\frac1m\sum_i(x_{ij}-\mu_j)^2}$,

$$\text{centred: } \tilde{x}_{ij} = x_{ij}-\mu_j, \qquad\qquad \text{z-scored: } z_{ij} = \frac{x_{ij}-\mu_j}{\sigma_j}.$$

In matrix form, centring is $\tilde{\mathbf{X}}=\mathbf{X}-\mathbf{1}\boldsymbol{\mu}^{\mathsf T}$. The centred value is in the original units (spikes/s *relative to the neuron's average*); the z-score has no units: it counts standard deviations.
:::

::: keypoint
After centring, every column has mean exactly $0$. After z-scoring, every column has mean $0$ and standard deviation exactly $1$.
:::

::: note Why it is true: mean 0 and standard deviation 1
**Mean.** $\displaystyle\frac1m\sum_{i=1}^{m}(x_{ij}-\mu_j) = \frac1m\sum_{i=1}^{m}x_{ij} - \frac1m\cdot m\,\mu_j = \mu_j-\mu_j = 0.$

**Standard deviation.** The z-scores of column $j$ have mean $0$ (they are the centred values divided by the constant $\sigma_j$), so their variance is the mean of their squares:

$$\frac1m\sum_{i=1}^{m} z_{ij}^2 = \frac{1}{\sigma_j^2}\cdot\frac1m\sum_{i=1}^{m}(x_{ij}-\mu_j)^2 = \frac{\sigma_j^2}{\sigma_j^2} = 1 .$$

Both arguments need only that $\mu_j$ and $\sigma_j$ are constants within the column. They fail if $\sigma_j=0$: a neuron that never changes its rate cannot be z-scored.
:::

{{ interactive: centring | The 24 trials for each of the six neurons, blue for left trials and orange for right trials. Switch between raw rates, centred and z-scored, and watch every column slide to mean 0 and then stretch or shrink to the same spread. }}

The figure shows the cost as well as the benefit. Z-scoring gives every neuron an equal voice, so N4 no longer dominates, but it also amplifies neurons that carry nothing but noise: N3 and N6 do not distinguish the conditions, and dividing by their small $\sigma_j$ stretches that noise to full size. Whether to z-score is a modelling choice, not a default.

::: note In practice
**Which standard deviation?** NumPy's `np.std` divides by $m$ (as above); pandas' `.std()` and many statistics texts divide by $m-1$, which gives an unbiased variance estimate. With 24 trials the two differ by about 2%. Use one consistently and say which.

**Guard against zero spread.** Silent or saturated neurons have $\sigma_j=0$. Drop them, or divide by $\max(\sigma_j,\varepsilon)$.
:::

### Use training statistics only

In machine learning the data are split into a **training set**, used to fit a model, and a **test set**, used to judge it. The test set must play the role of data the model has never seen. Computing $\mu_j$ and $\sigma_j$ on all the data lets information about the test trials leak into the preprocessing, a mistake called **data leakage**. The correct procedure is

$$\mu_j,\ \sigma_j \text{ from the training rows only,} \qquad z^{\text{train}}_{ij}=\frac{x^{\text{train}}_{ij}-\mu_j}{\sigma_j}, \qquad z^{\text{test}}_{ij}=\frac{x^{\text{test}}_{ij}-\mu_j}{\sigma_j}.$$

The training columns then have mean $0$ and SD $1$ exactly; the test columns do not, and should not. In the notebook (16 training trials, 8 test) the test means range from $-0.74$ to $0.40$ and the SDs from $0.94$ to $1.57$. Those departures are the honest picture of how new data look to a model trained on the old.

## Missing data

Recordings have gaps: an electrode drifts and loses a neuron for a few trials, or a trial is aborted and nothing is saved. NumPy marks a missing entry with `np.nan`, "not a number".

**NaN spreads.** Any arithmetic involving `nan` returns `nan`, so one missing entry turns `np.mean` of its whole column into `nan`. This is a feature: it makes the gap impossible to miss. `np.nanmean` instead averages only the entries that are present:

$$\mu_j^{\text{obs}} = \frac{1}{|\mathcal{O}_j|}\sum_{i\in\mathcal{O}_j} x_{ij}, \qquad \mathcal{O}_j = \{i : x_{ij}\text{ is observed}\}.$$

Comparisons with `nan` are always `False`, even `np.nan == np.nan`, so missing entries must be found with `np.isnan`.

### Three ways to handle the gaps, and what each costs

The notebook damages the recording: N3 is lost on trials 5–9 (electrode drift) and trial 14 is missing entirely.

**Fill with zero.** Tempting, and wrong for rates: zero is a real firing rate, so the gap becomes a fake silent trial.

::: note Why it is true: zero-filling biases the mean
Suppose $k$ of a column's $m$ entries are missing and are replaced by $0$. The new mean is

$$\frac1m\Big(\sum_{i\in\mathcal{O}_j}x_{ij} + k\cdot 0\Big) = \frac{m-k}{m}\,\mu_j^{\text{obs}} ,$$

a fraction $(m-k)/m$ of the true observed mean. For N3 in the notebook, $k=6$ of $m=24$: $\tfrac{18}{24}\times 11.7 = 8.8$ spikes/s, exactly the biased value the notebook prints.
:::

**Drop rows (trials) or columns (neurons).** Dropping every trial with any gap keeps only complete data: here $(18,6)$, losing 6 trials. Dropping every neuron with any gap removes *all six* neurons, because the aborted trial 14 is missing in every column. Which to drop depends on where the gaps are: scattered gaps favour dropping trials, one bad neuron favours dropping it.

**Impute** (fill in) each gap with the column's observed mean. The shape is kept and the mean is unchanged, but the spread is not.

::: note Why it is true: mean imputation shrinks the variance
After filling $k$ gaps with $\mu_j^{\text{obs}}$, those $k$ entries contribute nothing to the sum of squared deviations, while the count grows from $m-k$ to $m$:

$$\sigma^2_{\text{imputed}} = \frac1m\sum_{i\in\mathcal{O}_j}(x_{ij}-\mu_j^{\text{obs}})^2 = \frac{m-k}{m}\,\sigma^2_{\text{obs}} .$$

The data look more consistent than they really are, which makes later statistical tests overconfident.
:::

{{ interactive: missing | Neuron N3 on the 24 trials, with the six missing entries shown as hollow circles. Choose how to handle the gaps and compare the mean (solid line) and the standard deviation with the observed values: zero-filling drags the mean down by the factor (m − k)/m, and mean imputation shrinks the spread. }}

::: pitfall
All three remedies assume the gaps are unrelated to what you are measuring (statisticians say the data are *missing completely at random*). If a neuron drops out precisely on the trials where it would have fired most, for example because the electrode moved during strong movements, no amount of averaging recovers the truth. Always report how many entries were missing and what you did about them.
:::

## Keeping metadata aligned

A data matrix almost never travels alone. It comes with **metadata**: a condition label for every trial, a brain region for every neuron, a session identifier, a timestamp. The analysis is only correct if row $i$ of the matrix and entry $i$ of every per-trial label refer to the same trial.

### Reordering is a permutation

Sorting, shuffling or merging data reorders rows. Mathematically a reordering is a **permutation** $\pi$: a list of row indices in a new order, such as `order = np.argsort(conditions)`. Applying it gives the new matrix with rows $\mathbf{x}_{\pi(1)},\dots,\mathbf{x}_{\pi(m)}$, which NumPy writes `X[order]`.

::: keypoint
If the same permutation is applied to the matrix and to every label array, every group statistic is unchanged. Apply it to only one of them and the pairing between data and labels is destroyed, with no error.
:::

::: note Why it is true: a common permutation changes nothing
The condition mean is a sum over the set $\mathcal{I}_c=\{i: \ell_i=c\}$ of trials with label $c$. After reordering both, the new trial in position $k$ has data $\mathbf{x}_{\pi(k)}$ and label $\ell_{\pi(k)}$, so the positions with label $c$ are exactly those $k$ with $\pi(k)\in\mathcal{I}_c$. Summing $\mathbf{x}_{\pi(k)}$ over them visits the same vectors $\mathbf{x}_i$, $i\in\mathcal{I}_c$, in a different order, and addition does not care about order. The mean is unchanged.

If only the data are reordered, position $k$ pairs $\mathbf{x}_{\pi(k)}$ with label $\ell_k$, and the "condition $c$" group is now $\{\mathbf{x}_{\pi(k)} : \ell_k=c\}$: a set of trials chosen by an unrelated rule.
:::

{{ interactive: alignment | The recording with its label strip (blue for left trials, orange for right). Sort the matrix and labels together, or sort the matrix alone and leave the labels behind, and watch the left-minus-right difference for each neuron (bars) collapse towards zero. }}

::: example Worked example: what a misalignment does to a result
With correct alignment, the notebook's left-minus-right difference is $(15.4,\ -12.4,\ 0.5,\ 38.2,\ -16.8,\ -0.6)$ spikes/s: N1 and N4 prefer left, N2 and N5 prefer right. After sorting the matrix by N1's rate but not the labels, it becomes $(-0.3,\ 0.3,\ -0.6,\ -3.5,\ 1.1,\ 1.1)$: the effect has all but vanished.

The reason is that a misaligned label is, in effect, a random label. A random half of the trials has, on average, the same mean as the other random half, so the expected difference is zero. Misalignment does not produce an obviously wrong answer; it produces a convincing *null* result.
:::

::: note In practice
- Keep each per-trial array in the same order as the rows, and reorder them all with the same index array.
- Use `np.argsort(..., kind='stable')` when sorting by condition, so trials keep their original time order within each condition.
- Better, keep data and labels in one `pandas` DataFrame: a sort or filter then moves the labels with the rows automatically, and `df.groupby('condition').mean()` computes condition means without a mask.
- After any merge or reordering, check a few rows by hand against the original.
:::

::: quiz
? A column of 20 rates has 5 missing entries, and its observed mean is 12 spikes/s. What mean do you get if you fill the gaps with 0?
- [ ] 12
- [x] 9
- [ ] 6
- [ ] 15
> The mean shrinks by the factor $(m-k)/m = 15/20$: $0.75\times12 = 9$ spikes/s.

? You compute $\mu_j$ and $\sigma_j$ on all trials, then split into training and test sets. What is wrong?
- [ ] Nothing, as long as you z-score both sets.
- [x] Information about the test trials leaks into the preprocessing, so the test set no longer plays the role of unseen data.
- [ ] The training set will no longer have mean 0.
> The statistics must come from the training rows only, and then be applied unchanged to the test rows.

? You sort the data matrix by neuron N1's rate but forget to sort the condition labels. What do you expect?
- [ ] An error from NumPy.
- [ ] A doubled condition effect.
- [x] Condition differences close to zero: a convincing but false null result.
> Misaligned labels behave like random labels, and random halves of the data have about the same mean.
:::

## Mini-lab: a real Neuropixels recording

The mini-lab applies the whole lesson to real data: one session of the Neuropixels recordings of Steinmetz et al. (2019). A mouse faced three screens. On each trial a grating could appear on the left, on the right, on both sides or on neither, and the mouse turned a wheel to report the side with higher contrast. Probes recorded hundreds of neurons across the brain, all in the **left hemisphere**. The file used here (mouse Lederberg, 5 December 2017) keeps one number per trial and neuron: the spike count from 50 to 250 ms after the grating appeared.

The file carries metadata on both axes, and the analysis uses both.

- **Rows (trials).** Two arrays of shape $(340,)$ give the left and right contrasts. They decide each trial's condition.
- **Columns (neurons).** An array of shape $(698,)$ gives each neuron's brain area. It decides which columns to analyse.

The analysis takes five steps.

1. **Describe and convert.** `counts` has shape $(340,698)$: (trials, neurons), spikes in a 0.2 s window. Dividing by the window length, a scalar multiplication by $1/0.2$, gives rates in spikes/s.
2. **Select columns.** A column mask built from the area labels keeps the 145 visual-cortex neurons: 66 in primary visual cortex (`VISp`) and 79 in a higher visual area (`VISam`). The area labels are cut with the same mask, so they still describe the columns.
3. **Label and select rows.** Each trial is labelled *left* (grating on the left only), *right*, *neither* or *both*. The 108 *both* trials are dropped from the matrix and from the labels with one row mask, leaving 232 trials: 59 left, 65 right, 108 neither.
4. **Drop unusable columns.** Seven neurons never fire in the window on the kept trials. Their standard deviation is $0$, so z-scoring would divide by zero. They are removed, with their area labels, leaving 138.
5. **Standardise, average, compare.** Z-score each column, average the rows within each condition to get `cond_means` of shape $(3,138)$ in SDs, and compute the $3\times3$ cosine-similarity matrix of its rows.

{{ figure: cell072_1.svg | Left: each condition's average z-scored pattern over the 138 visual-cortex neurons, sorted by area (VISam, then VISp) and then by their response on right trials; red is above the neuron's session mean and blue below. Right: cosine similarities between the three patterns. From the teaching notebook. }}

Mean rate (spikes/s) of the non-silent neurons in each visual area, by condition:

| Area | left | right | neither |
|---|---|---|---|
| `VISp` (62 neurons) | 1.39 | 5.32 | 1.17 |
| `VISam` (76 neurons) | 4.27 | 4.39 | 3.55 |

**Reading the result.** In `VISp` the population responds to *right* gratings: about 5.3 spikes/s against 1.4 for left and 1.2 for neither. The probes are in the left hemisphere, and each hemisphere's visual cortex represents the opposite side of space, so this is the expected **contralateral** response. The similarity matrix tells the same story for the whole population. The right pattern is nearly opposite to the other two ($-0.72$ with left, $-0.91$ with neither), while left and neither resemble each other ($+0.37$): to most of these neurons, a left grating looks much like no grating. `VISam` is different: its neurons fire more for a grating on *either* side. Splitting the columns by their area labels is what reveals this; pooled together, the two areas blur into a weaker version of the `VISp` result.

Part of the negativity in the similarity matrix is built in by the pipeline, and it is worth seeing why.

::: note Why it is true: centred condition means cannot all point the same way
After z-scoring, every column of the cleaned matrix has mean $0$, so the sum of all 232 rows is the zero vector. Grouping that sum by condition,

$$\mathbf{0} = \sum_{i=1}^{232}\mathbf{z}_i = 59\,\bar{\mathbf{z}}_{\text{left}} + 65\,\bar{\mathbf{z}}_{\text{right}} + 108\,\bar{\mathbf{z}}_{\text{neither}} .$$

A weighted sum of vectors with positive weights can only be zero if the vectors point in partly opposing directions. Take the dot product of the equation with $\bar{\mathbf{z}}_{\text{right}}$:

$$59\,\bar{\mathbf{z}}_{\text{right}}\cdot\bar{\mathbf{z}}_{\text{left}} + 65\lVert \bar{\mathbf{z}}_{\text{right}} \rVert^2 + 108\,\bar{\mathbf{z}}_{\text{right}}\cdot\bar{\mathbf{z}}_{\text{neither}} = 0 .$$

The middle term is positive, so at least one of the other two dot products, and hence cosine similarities, must be negative.
:::

So "right is opposite to neither" is partly a statement about centring: after z-scoring, each condition pattern describes how that condition *differs from the session average*, and such differences must partly cancel. What centring does *not* force is *which* pattern stands apart. That right is the odd one out, and that left and neither stay similar, is the data speaking. This is the matrix version of the warning in Lesson 2 that centring changes what cosine similarity measures.

::: pitfall
This is one mouse in one session, with contrasts from 0.25 to 1 pooled together and the *both* trials left out. The mouse also turns the wheel on almost every left trial but on only about half of the *neither* trials, so a difference between conditions can reflect movement as well as vision. Exercise 7 of the exercise notebook repeats the analysis on a second mouse and adds a motor area.
:::

## Where this appears in neuroscience and machine learning

**Population recordings.** Neuropixels probes record hundreds of neurons at once, as in the mini-lab; calcium imaging records thousands. The result is a (time bins × neurons) or (trials × neurons) matrix, and every analysis in this course starts from one.

**Connectomes.** Whole-brain wiring diagrams, from *C. elegans* to the fruit fly and millimetre-scale volumes of mouse cortex, are stored as sparse adjacency matrices. In-strength, out-strength and density are the first numbers computed on them.

**Representational similarity analysis.** Brain regions, subjects and artificial networks are compared through their symmetric (condition × condition) dissimilarity matrices, which need not have the same number of neurons.

**The design matrix.** In machine learning a dataset is an $m\times n$ matrix $\mathbf{X}$, one sample per row, one feature per column, with a separate label vector $\mathbf{y}$ of length $m$ that must stay aligned with the rows. Standardising features with training-set statistics is the first step of almost every pipeline.

**Neural network weights.** A layer of an artificial network stores its weights as a matrix whose row $i$ holds the weights into unit $i$, the same "row = target" convention as the adjacency matrix. Lesson 4 shows how one matrix–vector product computes all the units' inputs at once.

## Lesson summary

- An $m\times n$ matrix has entries $x_{ij}$ (row $i$, column $j$). In a data matrix, rows are observations (trials) and columns are variables (neurons). Always state shape, units and axis meaning.
- `axis=0` reduces over rows (one value per column); `axis=1` reduces over columns (one value per row). The named axis disappears.
- $(\mathbf{A}^{\mathsf T})_{ij}=a_{ji}$; $(\mathbf{A}^{\mathsf T})^{\mathsf T}=\mathbf{A}$, $(\mathbf{A}+\mathbf{B})^{\mathsf T}=\mathbf{A}^{\mathsf T}+\mathbf{B}^{\mathsf T}$, $(c\mathbf{A})^{\mathsf T}=c\mathbf{A}^{\mathsf T}$; and $\mathbf{u}^{\mathsf T}\mathbf{v}=\mathbf{u}\cdot\mathbf{v}$.
- Identity, diagonal, symmetric ($\mathbf{A}^{\mathsf T}=\mathbf{A}$) and antisymmetric ($\mathbf{A}^{\mathsf T}=-\mathbf{A}$) matrices; every square matrix is uniquely symmetric plus antisymmetric. Distance and similarity matrices are symmetric.
- An adjacency matrix stores $a_{ij}$ = weight from $j$ to $i$; row sums are in-strengths, column sums out-strengths, and the two totals are equal.
- Sparse (CSR) storage needs about $12\,\text{nnz}$ bytes instead of $8mn$; it wins below a density of $2/3$, and in practice far below.
- Addition, scaling and the Hadamard product act entry by entry; broadcasting stretches a vector across rows; `X @ w` gives the dot product of each row with $\mathbf{w}$.
- Centred columns have mean $0$; z-scored columns have mean $0$ and SD $1$. Fit the statistics on training data only.
- NaN spreads; zero-filling biases the mean by $(m-k)/m$; mean imputation shrinks the variance by the same factor.
- Apply every reordering to the data and the labels together; a misalignment produces a convincing null result.
- On real data (Steinmetz et al., 2019) the same steps show that primary visual cortex responds to contralateral gratings: metadata on the rows defines the conditions, metadata on the columns separates the brain areas.

## Exercises

These pen-and-paper exercises complement the coding exercises in the exercise notebook. Try each one before opening its answer.

::: exercise
For $\mathbf{M}=\begin{pmatrix}3&0&2\\1&4&5\end{pmatrix}$, give the shape, the entry $m_{23}$, row 2, column 3, and $\mathbf{M}^{\mathsf T}$ with its shape.
---answer---
- **Shape:** $2\times3$.
- **Entry:** $m_{23}=5$.
- **Row 2:** $(1,\ 4,\ 5)$. **Column 3:** $(2,\ 5)$.
- **Transpose:** $\mathbf{M}^{\mathsf T}=\begin{pmatrix}3&1\\0&4\\2&5\end{pmatrix}$, shape $3\times2$.
:::

::: exercise
For the same $\mathbf{M}$, compute `M.mean(axis=0)` and `M.mean(axis=1)` by hand, and give the shape of each.
---answer---
**`axis=0`** (down the rows, one value per column): $\big((3+1)/2,\ (0+4)/2,\ (2+5)/2\big)=(2,\ 2,\ 3.5)$, shape $(3,)$.

**`axis=1`** (across the columns, one value per row): $(5/3,\ 10/3)=(1.67,\ 3.33)$, shape $(2,)$.
:::

::: exercise
Prove that $(\mathbf{A}+\mathbf{B})^{\mathsf T}=\mathbf{A}^{\mathsf T}+\mathbf{B}^{\mathsf T}$ and $(c\mathbf{A})^{\mathsf T}=c\mathbf{A}^{\mathsf T}$ by comparing entries. Then show that if $\mathbf{A}$ and $\mathbf{B}$ are both symmetric, so is $\mathbf{A}+\mathbf{B}$.
---answer---
**The rules.** Entry $(i,j)$ of $(\mathbf{A}+\mathbf{B})^{\mathsf T}$ is $a_{ji}+b_{ji}$, which is entry $(i,j)$ of $\mathbf{A}^{\mathsf T}+\mathbf{B}^{\mathsf T}$. Likewise entry $(i,j)$ of $(c\mathbf{A})^{\mathsf T}$ is $c\,a_{ji}$, entry $(i,j)$ of $c\mathbf{A}^{\mathsf T}$.

**Symmetric sums.** If $\mathbf{A}^{\mathsf T}=\mathbf{A}$ and $\mathbf{B}^{\mathsf T}=\mathbf{B}$, then $(\mathbf{A}+\mathbf{B})^{\mathsf T}=\mathbf{A}^{\mathsf T}+\mathbf{B}^{\mathsf T}=\mathbf{A}+\mathbf{B}$.
:::

::: exercise
Split $\mathbf{A}=\begin{pmatrix}1&4\\2&3\end{pmatrix}$ into its symmetric and antisymmetric parts, and check that they add back to $\mathbf{A}$.
---answer---
$\mathbf{A}^{\mathsf T}=\begin{pmatrix}1&2\\4&3\end{pmatrix}$, so

$$\tfrac12(\mathbf{A}+\mathbf{A}^{\mathsf T})=\begin{pmatrix}1&3\\3&3\end{pmatrix}, \qquad \tfrac12(\mathbf{A}-\mathbf{A}^{\mathsf T})=\begin{pmatrix}0&1\\-1&0\end{pmatrix}.$$

Their sum is $\begin{pmatrix}1&4\\2&3\end{pmatrix}=\mathbf{A}$.
:::

::: exercise
A four-neuron circuit has connections N1→N2 ($0.5$), N1→N3 ($0.3$), N2→N3 ($-0.4$), N3→N4 ($0.8$) and N4→N1 ($0.2$). Write its adjacency matrix with the (target, source) convention, compute every in-strength and out-strength, check that the totals agree, and give the density.
---answer---
With rows and columns in the order N1–N4,

$$\mathbf{A}=\begin{pmatrix}0&0&0&0.2\\0.5&0&0&0\\0.3&-0.4&0&0\\0&0&0.8&0\end{pmatrix}.$$

- **In-strengths** (row sums): $0.2,\ 0.5,\ -0.1,\ 0.8$.
- **Out-strengths** (column sums): $0.8,\ -0.4,\ 0.8,\ 0.2$.
- **Totals:** both are $1.4$.
- **Density:** $5/16=0.31$.
:::

::: exercise
A model network has $10{,}000$ neurons, each receiving exactly 100 connections. Compute the memory needed in dense storage (8-byte floats) and in CSR (8-byte values, 4-byte indices). How many times smaller is CSR?
---answer---
$\text{nnz}=10^4\times100=10^6$.

- **Dense:** $8\times10^8$ bytes $=800$ MB.
- **CSR:** $12\times10^6+4\times10{,}001\approx12.04$ MB.

CSR is about **66 times** smaller.
:::

::: exercise
For $\mathbf{A}=\begin{pmatrix}1&2\\3&4\end{pmatrix}$ and $\mathbf{B}=\begin{pmatrix}0&1\\1&0\end{pmatrix}$, compute $\mathbf{A}\odot\mathbf{B}$. Then, by treating each row of $\mathbf{A}$ as a vector and taking dot products with the columns of $\mathbf{B}$, compute the $2\times2$ table whose $(i,j)$ entry is (row $i$ of $\mathbf{A}$)$\cdot$(column $j$ of $\mathbf{B}$). (Lesson 4 calls this $\mathbf{A}\mathbf{B}$.) Which of the two operations gives the same answer if $\mathbf{A}$ and $\mathbf{B}$ swap places?
---answer---
**Hadamard product.** $\mathbf{A}\odot\mathbf{B}=\begin{pmatrix}0&2\\3&0\end{pmatrix}$.

**Row-by-column table.** $\begin{pmatrix}2&1\\4&3\end{pmatrix}$: the columns of $\mathbf{A}$, swapped.

**Swapping places.** Rows of $\mathbf{B}$ with columns of $\mathbf{A}$ give $\begin{pmatrix}3&4\\1&2\end{pmatrix}$, the rows of $\mathbf{A}$ swapped: a different answer. But $\mathbf{B}\odot\mathbf{A}=\mathbf{A}\odot\mathbf{B}$. The Hadamard product is commutative; the matrix product is not.
:::

::: exercise
A neuron's rates on three trials are $(2,\ 4,\ 9)$ spikes/s. Centre and z-score them (dividing by $m$), and verify that the results have mean 0 and SD 1.
---answer---
**Centring.** The mean is $5$, so the centred values are $(-3,\ -1,\ 4)$, which sum to $0$.

**Z-scoring.** $\sigma=\sqrt{(9+1+16)/3}=\sqrt{26/3}=2.944$, so the z-scores are $(-1.019,\ -0.340,\ 1.359)$.

**Check.** Their mean is $0$, and their mean square is $(9+1+16)/(3\times26/3)=1$.
:::

::: exercise
A column of rates is $(10,\ 12,\ \text{NaN},\ 14)$ spikes/s. Compute `np.nanmean`, the mean after filling with 0, and the standard deviation (dividing by the count) before and after mean imputation. Check both against the formulas of the missing-data section.
---answer---
- **`nanmean`:** $(10+12+14)/3=12$.
- **Zero-filled mean:** $36/4=9=\tfrac34\times12$, matching $(m-k)/m=3/4$.
- **Observed SD:** $\sqrt{(4+0+4)/3}=1.633$.
- **After imputation:** the column $(10,\ 12,\ 12,\ 14)$ has SD $\sqrt{8/4}=1.414=\sqrt{3/4}\times1.633$, matching the variance factor $(m-k)/m$.
:::

::: exercise
Four trials have labels $(A,\ B,\ A,\ B)$ and N1 rates $(5,\ 20,\ 7,\ 22)$ spikes/s. Compute the correct $A-B$ difference. Then sort the rates in increasing order without reordering the labels, and recompute it.
---answer---
**Correct.** $A$ mean $6$, $B$ mean $21$, difference $-15$ spikes/s.

**Misaligned.** Sorted rates $(5,\ 7,\ 20,\ 22)$ with labels $(A,B,A,B)$: $A$ mean $12.5$, $B$ mean $14.5$, difference $-2$ spikes/s. A large effect has nearly disappeared.
:::

::: exercise
Explain, using the formula for $\mathbf{X}\mathbf{w}$, why `(X * w).sum(axis=1)` equals `X @ w`. What does `(X * w).sum()` compute?
---answer---
`(X * w)[i, j]` $=x_{ij}w_j$. Summing over $j$ (`axis=1`) gives $\sum_j x_{ij}w_j=(\mathbf{X}\mathbf{w})_i$, which is entry $i$ of `X @ w`.

`(X * w).sum()` sums over both axes, giving $\sum_i(\mathbf{X}\mathbf{w})_i$: the total of all the trials' scores, a single number with no per-trial meaning.
:::

::: exercise
*(Challenge.)* Show that z-scores do not depend on units: if every entry of a column is transformed to $x'_{ij}=c\,x_{ij}+d$ with $c>0$ (for example, converting spikes/s to spikes per 50 ms has $c=0.05$, $d=0$), then $z'_{ij}=z_{ij}$. What happens when $c<0$? Does centring alone have the same property?
---answer---
The new mean is $\mu'=c\mu+d$ and the new SD is $\sigma'=|c|\sigma$: the shift cancels in every deviation, and the scale multiplies each one. So

$$z'_{ij}=\frac{cx_{ij}+d-c\mu-d}{|c|\sigma}=\frac{c}{|c|}\,z_{ij},$$

which is $z_{ij}$ for $c>0$ and $-z_{ij}$ for $c<0$.

Centring alone removes $d$ but keeps the factor $c$: centred values still carry units.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, including a real-data exercise that repeats the mini-lab on a second mouse and adds a motor area. Both open in Google Colab.

{{ colab: week1/lesson3/Lesson3_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week1/lesson3/Lesson3_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Introduction to Linear Algebra*, 6th ed., Wellesley–Cambridge Press, 2023. Chapter 2 introduces matrices and the transpose.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab and Exercise 7 data, used here in the trial-binned form prepared by Neuromatch Academy.
- C. R. Harris et al., "Array programming with NumPy", *Nature* 585:357–362, 2020. Axes, broadcasting and vectorised operations.
- J. G. White, E. Southgate, J. N. Thomson and S. Brenner, "The structure of the nervous system of the nematode *Caenorhabditis elegans*", *Philosophical Transactions of the Royal Society B* 314:1–340, 1986.
- O. Sporns, *Networks of the Brain*, MIT Press, 2010. Adjacency matrices, strength and density in neuroscience.
- N. Kriegeskorte, M. Mur and P. Bandettini, "Representational similarity analysis: connecting the branches of systems neuroscience", *Frontiers in Systems Neuroscience* 2:4, 2008.
- R. J. A. Little and D. B. Rubin, *Statistical Analysis with Missing Data*, 3rd ed., Wiley, 2019. Chapter 1 explains why the reason data are missing matters.
- Neuromatch Academy, Computational Neuroscience course, https://compneuro.neuromatch.io (CC-BY 4.0). Several notebook ideas in this course are adapted from it.
