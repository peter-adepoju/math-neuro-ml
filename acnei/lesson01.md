**Learning objectives**

- What a vector is, and why one population response and one row of a dataset are the same kind of object
- How to read a vector three ways, as a list, an arrow and a point, and when each view helps
- How to add, subtract and scale vectors, and what each operation means for neural data
- How the Euclidean norm follows from Pythagoras, what distance measures, and when it misleads
- How to normalise a vector, and what normalisation keeps and throws away
- What linear combinations, span, basis, coordinates and dimension mean, and why population activity often fills only part of the space
- How a recording through time becomes a trajectory of vectors

**Before you start.** This reading is the mathematical companion to the Lesson 1 teaching notebook. The notebook lets you run each idea; this page explains why it is true, and the interactive figures let you play with it. You need nothing beyond school algebra, coordinates on a graph and Pythagoras' theorem. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $a,\ c,\ \alpha$ | scalars: single numbers (plain letters) |
| $\mathbf{v}, \mathbf{r}, \mathbf{x}$ | vectors (bold lower case) |
| $v_i$ | the $i$-th coordinate of $\mathbf{v}$ (a single number, not bold) |
| $n$ | the number of coordinates, the *dimension* |
| $\mathbb{R}^n$ | the set of all vectors with $n$ real-number coordinates |
| $\mathbf{0}$ | the zero vector $(0,\dots,0)$ |
| $\lVert \mathbf{v} \rVert$ | the length (Euclidean norm) of $\mathbf{v}$ |
| $d(\mathbf{u},\mathbf{v})$ | the distance between $\mathbf{u}$ and $\mathbf{v}$ |
| $\hat{\mathbf{v}}$ | the unit vector in the direction of $\mathbf{v}$ |
| $\mathbf{e}_1,\dots,\mathbf{e}_n$ | the standard basis vectors |
| $\mathbf{v}^{\mathsf T}$ | the transpose of $\mathbf{v}$: a column turned into a row |

## The problem: one brain state as one vector

Three neurons are recorded at the same time. At one moment their firing rates are 12, 4 and 19 spikes per second. Shown a different stimulus, the same three neurons fire at 50, 8 and 33 spikes per second.

You could treat these as six unrelated numbers. But each triple describes *one* thing: the state of a small population at one instant. Writing each triple as a single object,

$$\mathbf{r}_1 = (12,\ 4,\ 19), \qquad \mathbf{r}_2 = (50,\ 8,\ 33) \quad \text{spikes/s},$$

lets you ask questions about states as wholes.

- How did the state change? Subtract: $\mathbf{r}_2-\mathbf{r}_1 = (38,\ 4,\ 14)$.
- How far did it move? Measure the length of that change: $\sqrt{38^2+4^2+14^2} = 40.69$ spikes/s.

Both answers are explained in this lesson.

```python
r_1 = np.array([12.0, 4.0, 19.0])   # spikes/s, (N1, N2, N3), stimulus 1
r_2 = np.array([50.0, 8.0, 33.0])   # spikes/s, stimulus 2

print(r_2 - r_1)                    # -> [38.  4. 14.]
print(np.linalg.norm(r_2 - r_1))    # -> 40.69
```

The same object appears in machine learning. One house in a dataset of house prices is described by its size, number of bedrooms and age, $\mathbf{x} = (1416,\ 3,\ 40)$. A model that predicts the price receives this whole list as its input. A population response and a row of a dataset are the same kind of mathematical object: a **vector**.

**Interactive figure.** One population response, three ways at once: as bars (one per neuron), as a list of numbers, and as a point in the state space of N1 and N2. Move the sliders, drag the point, or glide between the two stimuli from the text.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=population-vector&t=One%20population%20response%2C%20three%20ways%20at%20once%3A%20as%20bars%20%28one%20per%E2%80%A6)

## Scalars and vectors

**Definition: scalar and vector**

A **scalar** is a single number, such as one neuron's firing rate of $23.5$ spikes/s. A **vector** is an *ordered* list of $n$ numbers treated as one object,

$$\mathbf{v} = (v_1,\ v_2,\ \dots,\ v_n).$$

The numbers $v_i$ are its **coordinates** (or components), and $n$ is its **dimension**. The set of all such vectors is written $\mathbb{R}^n$.

Three words in that definition carry most of the meaning.

**Ordered.** $(12,\ 4,\ 19)$ and $(4,\ 12,\ 19)$ are different vectors. Coordinate $i$ always means the same thing: the first coordinate is always neuron N1, the second always N2. If two recordings list their neurons in different orders, their vectors cannot be compared until the order is matched.

**One object.** A vector is not a bag of numbers. Operations on it act on the whole state: adding two states, scaling a state, measuring its length.

**Dimension.** The dimension is the number of coordinates, nothing more. "High-dimensional" simply means "many coordinates".

| Object | Example | Dimension |
|---|---|---|
| Population response of 3 neurons | $(12,\ 4,\ 19)$ spikes/s | 3 |
| One time point from a 64-electrode EEG cap | one voltage per electrode | 64 |
| One $28\times28$ greyscale image, flattened | one brightness per pixel | 784 |
| One fMRI volume | one signal per voxel | about 100 000 |
| One house in a dataset | (size, bedrooms, age) | 3 |
| Model parameters | $\mathbf{w}=(w_1,w_2,w_3)$ | 3 |

The last row matters later. The numbers a model *learns*, such as one weight per input, also form a vector, usually written $\mathbf{w}$ or $\boldsymbol{\theta}$. Everything in this lesson applies to them too.

**Key point**

A vector does not carry its own meaning. The list $(12,\ 4,\ 19)$ could be three firing rates, or a house, or nothing at all. Meaning lives in two pieces of information you must keep alongside the numbers: what each coordinate refers to, and its units.

## Three views of a vector

The vector $\mathbf{v}=(4,\ -2)$ can be read in three ways:

1. **A list of numbers.** Two values stored in order.
2. **An arrow (a displacement).** Starting anywhere, move 4 units along the first axis and $-2$ along the second. The arrow says *how to move*, not where you are.
3. **A point (a state).** The location $(4,\ -2)$ itself. The point says *where you are*.

**Interactive figure.** The same vector as a list, an arrow and a point. Move the start of the arrow: the arrow slides, but the vector, two numbers, stays the same.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=vector-views&t=The%20same%20vector%20as%20a%20list%2C%20an%20arrow%20and%20a%20point.)

![The same vector drawn as a displacement, an arrow (left), and as a state, a single point (right). From the teaching notebook.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell014_1.svg)
*The same vector drawn as a displacement, an arrow (left), and as a state, a single point (right). From the teaching notebook.*

For neural data the point view dominates. A population response is drawn as a point in **neural state space**, with one axis per neuron. Repeated trials of one condition form a cloud of nearby points; different conditions form different clouds. The arrow view takes over when we ask how one state *changes* into another.

![Fifteen trials of each of four conditions in the state space of neurons N1 and N2. Each small point is one trial; the large markers are the condition means.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell027_1.svg)
*Fifteen trials of each of four conditions in the state space of neurons N1 and N2. Each small point is one trial; the large markers are the condition means.*

With three neurons the space has three axes, and the picture still works. With a hundred neurons it can no longer be drawn, but the mathematics is exactly the same: one axis per neuron, one point per state.

**Interactive figure.** The same trials in the full three-neuron state space. Drag to rotate; hover over a point to read its coordinates.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&plotly=cell032_1&t=The%20same%20trials%20in%20the%20full%20three-neuron%20state%20space.)

## Writing vectors down, and storing them

### Columns and rows

Mathematics usually writes a vector as a **column**, and its **transpose**, written with a superscript $\mathsf{T}$, as a row:

$$\mathbf{v} = \begin{pmatrix} v_1 \\ v_2 \\ v_3 \end{pmatrix}, \qquad \mathbf{v}^{\mathsf T} = \begin{pmatrix} v_1 & v_2 & v_3 \end{pmatrix}.$$

Writing $(v_1, v_2, v_3)$ inside a sentence is shorthand for the column. For now the orientation is only a convention. From Lesson 3, when vectors meet matrices, it starts to matter.

### Shapes in NumPy

NumPy stores the same three numbers in three different ways, distinguished by their **shape**:

| Shape | Created by | What it is |
|---|---|---|
| `(3,)` | `np.array([1., 2., 3.])` | a flat, one-dimensional array with no orientation |
| `(3, 1)` | `v.reshape(3, 1)` | a column: three rows, one column |
| `(1, 3)` | `v.reshape(1, 3)` | a row: one row, three columns |

The flat shape `(n,)` is the usual way to store a vector in NumPy. Two attributes describe any array: `.shape`, the size along each axis, and `.ndim`, the number of axes.

```python
r = np.array([12.5, 45.3, 8.7, 33.1, 71.4])   # five neurons, spikes/s
print(r.shape, r.ndim, r.size)                 # -> (5,) 1 5
print(r[0], r[-1], r[1:3])                     # -> 12.5 71.4 [45.3  8.7]
```

Python counts from zero, so neuron N1 is `r[0]`. A slice `r[1:3]` includes the start index and stops *before* the end index, giving N2 and N3.

### Broadcasting

When NumPy combines two arrays of different shapes, it applies a rule called **broadcasting**: it lines the shapes up from the right, and any axis of size 1 is stretched to match the other array. This is often convenient and occasionally disastrous.

```python
v_flat = np.array([1.0, 2.0, 3.0])   # shape (3,)
v_col  = v_flat.reshape(3, 1)        # shape (3, 1)
print((v_flat + v_col).shape)        # -> (3, 3)   not (3,)!
```

The flat array is treated as a row of shape `(1, 3)`; the column has shape `(3, 1)`. Both size-1 axes stretch, and the result is a $3\times3$ table holding every pairwise sum. No error is raised.

**Common pitfall**

Before combining two arrays, print both `.shape`s. If they differ, reshape one to match, for example with `v_col.reshape(-1)`, which flattens back to `(3,)`. Most shape bugs in neural-data code are broadcasting doing exactly what it was told.

## Adding, subtracting and scaling

**Definition: vector addition and scalar multiplication**

For $\mathbf{u},\mathbf{v}\in\mathbb{R}^n$ and a scalar $c$, act coordinate by coordinate:

$$\begin{gathered} \mathbf{u}+\mathbf{v} = (u_1+v_1,\ \dots,\ u_n+v_n), \qquad \mathbf{u}-\mathbf{v} = (u_1-v_1,\ \dots,\ u_n-v_n),\\ c\,\mathbf{v} = (cv_1,\ \dots,\ cv_n). \end{gathered}$$

Only vectors of the same dimension can be added or subtracted.

**Worked example: baseline and stimulus**

Three neurons, mean rates under two conditions: Baseline $\mathbf{r}_A=(5,\ 8,\ 6)$ and Stimulus A $\mathbf{r}_B=(55,\ 12,\ 9)$ spikes/s.

$$\begin{aligned} \mathbf{r}_B - \mathbf{r}_A &= (55-5,\ 12-8,\ 9-6) = (50,\ 4,\ 3) && \text{the change in state}\\ 1.5\,\mathbf{r}_A &= (7.5,\ 12,\ 9) && \text{same pattern, 50\% stronger}\\ \mathbf{r}_A + \mathbf{r}_B &= (60,\ 20,\ 15) && \text{a modelled combination} \end{aligned}$$

### What the operations look like

**Addition** places arrows tip to tail: walk along $\mathbf{u}$, then along $\mathbf{v}$, and you arrive at $\mathbf{u}+\mathbf{v}$. Doing it in the other order arrives at the same place, so the two routes form a parallelogram.

**Subtraction** gives the arrow *from* one point *to* another. $\mathbf{r}_B-\mathbf{r}_A$ is the arrow that starts at state A and ends at state B, because $\mathbf{r}_A + (\mathbf{r}_B-\mathbf{r}_A) = \mathbf{r}_B$. This is the state-change vector.

**Scalar multiplication** stretches or shrinks an arrow without turning it (if $c>0$), or flips it to point the opposite way (if $c<0$). For a population response, $c\,\mathbf{r}$ is the same *pattern* across neurons at a different overall *strength*.

**Interactive figure.** Choose an operation and drag the vectors. For c u, move the slider through zero to see the arrow flip.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=add-scale&t=Choose%20an%20operation%20and%20drag%20the%20vectors.)

![Geometric addition: the two routes, p then q and q then p, close a parallelogram whose diagonal is p + q. From the teaching notebook.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell035_1.svg)
*Geometric addition: the two routes, p then q and q then p, close a parallelogram whose diagonal is p + q. From the teaching notebook.*

![The state-change vector from Baseline to Stimulus A in the plane of the first two neurons.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell038_1.svg)
*The state-change vector from Baseline to Stimulus A in the plane of the first two neurons.*

### The rules of vector arithmetic

Because each operation works coordinate by coordinate, vectors inherit the familiar rules of ordinary arithmetic. Here $\mathbf{u},\mathbf{v},\mathbf{w}\in\mathbb{R}^n$ and $a, c$ are scalars.

| Rule | Statement |
|---|---|
| Order of addition does not matter | $\mathbf{u}+\mathbf{v}=\mathbf{v}+\mathbf{u}$ |
| Grouping does not matter | $(\mathbf{u}+\mathbf{v})+\mathbf{w}=\mathbf{u}+(\mathbf{v}+\mathbf{w})$ |
| Zero vector | $\mathbf{v}+\mathbf{0}=\mathbf{v}$ |
| Negatives | $\mathbf{v}+(-\mathbf{v})=\mathbf{0}$, where $-\mathbf{v}=(-1)\mathbf{v}$ |
| Scaling a sum | $c(\mathbf{u}+\mathbf{v}) = c\mathbf{u}+c\mathbf{v}$ |
| Summing scales | $(a+c)\mathbf{v} = a\mathbf{v}+c\mathbf{v}$ |
| Scaling twice | $a(c\mathbf{v}) = (ac)\mathbf{v}$, and $1\mathbf{v}=\mathbf{v}$ |

**Why it is true: all seven rules**

Each rule is true for ordinary numbers, and vector operations apply ordinary arithmetic to each coordinate separately. For example, coordinate $i$ of $c(\mathbf{u}+\mathbf{v})$ is $c(u_i+v_i)=cu_i+cv_i$, which is coordinate $i$ of $c\mathbf{u}+c\mathbf{v}$. Since this holds for every $i$, the vectors are equal. The other six rules are checked the same way.

Any collection of objects that can be added and scaled while obeying these rules is called a **vector space**. The name matters because so many things qualify: lists of firing rates, sound waveforms, images, even functions (Part II). Everything proved from these rules holds for all of them.

**Common pitfall**

Arithmetic is always *possible*; it is not always *meaningful*. Adding two coordinates measured in different units, or adding two population responses and calling the sum "the response to both stimuli together", is a modelling claim. Real neurons often combine inputs nonlinearly. Treat $\mathbf{r}_A+\mathbf{r}_B$ as a hypothesis to test, not a fact.

## Length and distance

### From Pythagoras to the norm

How long is the arrow $\mathbf{v}=(3,\ 4)$? Its two coordinates are the two shorter sides of a right-angled triangle, and the arrow is the hypotenuse, so Pythagoras gives $\sqrt{3^2+4^2}=5$.

**Interactive figure.** Pythagoras gives the length of a vector. Drag the tip, then add a third coordinate: the floor diagonal and the new side form a second right-angled triangle.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=norm-pythagoras&t=Pythagoras%20gives%20the%20length%20of%20a%20vector.)

**Definition: Euclidean norm**

The **Euclidean norm**, or length, of $\mathbf{v}\in\mathbb{R}^n$ is

$$\lVert \mathbf{v} \rVert = \sqrt{v_1^2 + v_2^2 + \cdots + v_n^2} = \sqrt{\textstyle\sum_{i=1}^{n} v_i^2}.$$

It is sometimes written $\lVert \mathbf{v} \rVert_2$ to distinguish it from other norms.

**Why it is true: the formula in any number of dimensions**

In three dimensions, apply Pythagoras twice. The diagonal of the floor of the box has squared length $v_1^2+v_2^2$. That diagonal and the vertical side $v_3$ are the two shorter sides of a second right-angled triangle, whose hypotenuse is the vector. So $\lVert \mathbf{v} \rVert^2 = (v_1^2+v_2^2)+v_3^2$.

Each new coordinate adds one more right-angled step, so in $n$ dimensions $\lVert \mathbf{v} \rVert^2=v_1^2+\cdots+v_n^2$. When we can no longer draw the space, we *define* length by this formula, so that it agrees with geometry wherever geometry can be drawn.

### Properties of the norm

Three properties make the norm behave like a length.

1. **Never negative, and zero only for the zero vector.** A sum of squares is $\ge0$, and is $0$ only if every $v_i=0$.
2. **Scaling scales the length.** $\lVert c\mathbf{v} \rVert = |c|\,\lVert \mathbf{v} \rVert$. Doubling a response doubles its length; reversing it does not change its length.
3. **The triangle inequality.** $\lVert \mathbf{u}+\mathbf{v} \rVert \le \lVert \mathbf{u} \rVert+\lVert \mathbf{v} \rVert$. Going directly is never longer than going via a detour.

**Why it is true: scaling scales the length**

$\lVert c\mathbf{v} \rVert = \sqrt{\sum_i (cv_i)^2} = \sqrt{c^2\sum_i v_i^2} = \sqrt{c^2}\,\sqrt{\sum_i v_i^2} = |c|\,\lVert \mathbf{v} \rVert$. Note $\sqrt{c^2}=|c|$, not $c$: length is never negative.

**Interactive figure.** The direct route u + v against the detour u then v. The two are equal only when u and v point the same way.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=triangle-inequality&t=The%20direct%20route%20u%20%2B%20v%20against%20the%20detour%20u%20then%20v.)

The triangle inequality is proved in Lesson 2, once the dot product is available (it follows from the Cauchy–Schwarz inequality proved there).

### Distance

**Definition: Euclidean distance**

The distance between two vectors is the length of their difference,

$$d(\mathbf{u},\mathbf{v}) = \lVert \mathbf{u}-\mathbf{v} \rVert = \sqrt{\textstyle\sum_{i=1}^n (u_i-v_i)^2}.$$

That is exactly the length of the state-change arrow. For Baseline and Stimulus A, $d = \lVert (50,\ 4,\ 3) \rVert = \sqrt{2500+16+9} = \sqrt{2525} = 50.2$ spikes/s. Distance inherits three sensible properties from the norm:

- $d(\mathbf{u},\mathbf{v})\ge0$, with equality only when $\mathbf{u}=\mathbf{v}$;
- $d(\mathbf{u},\mathbf{v})=d(\mathbf{v},\mathbf{u})$;
- $d(\mathbf{u},\mathbf{w})\le d(\mathbf{u},\mathbf{v})+d(\mathbf{v},\mathbf{w})$.

![Length is the size of one arrow (left); distance is the length of the difference between two states (right, first two neurons only). From the teaching notebook.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell043_1.svg)
*Length is the size of one arrow (left); distance is the length of the difference between two states (right, first two neurons only). From the teaching notebook.*

```python
d = np.linalg.norm(condition_means['Baseline'] - condition_means['Stimulus A'])
print(round(d, 1))     # -> 50.2
```

Repeating this for every pair of the four conditions gives the table below (spikes/s, all three neurons).

| | Baseline | Stimulus A | Stimulus B | Motor |
|---|---|---|---|---|
| **Baseline** | 0.0 | 50.2 | 65.2 | 63.4 |
| **Stimulus A** | 50.2 | 0.0 | 75.0 | 61.1 |
| **Stimulus B** | 65.2 | 75.0 | 0.0 | 36.5 |
| **Motor** | 63.4 | 61.1 | 36.5 | 0.0 |

A table of all pairwise distances is symmetric with zeros down the diagonal, as the properties require. Stimulus B and Motor are the closest pair of distinct conditions (36.5); Stimulus A and Stimulus B the furthest apart (75.0).

### Other ways to measure length

The Euclidean norm is the natural length of an arrow, but not the only useful one.

$$\lVert \mathbf{v} \rVert_1 = \sum_i |v_i| \quad\text{(Manhattan)}, \qquad \lVert \mathbf{v} \rVert_\infty = \max_i |v_i| \quad\text{(largest coordinate)}.$$

The $L_1$ norm is the distance a taxi drives along a street grid; the $L_\infty$ norm is the biggest change in any one neuron. All three belong to one family, the $p$-norms $\lVert \mathbf{v} \rVert_p = \big(\sum_i |v_i|^p\big)^{1/p}$, with $p = 1$, $2$ and $p\to\infty$. In machine learning, the $L_1$ and $L_2$ norms of a weight vector reappear as *regularisation* penalties (Part II).

**Interactive figure.** The set of all vectors of length 1 under each norm: a diamond for L₁, a circle for L₂, a square for L∞. Slide p to see the family morph from one to the next, and drag the point to compare its three lengths.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=unit-balls&t=The%20set%20of%20all%20vectors%20of%20length%201%20under%20each%20norm%3A%20a%20diamond%20for%E2%80%A6)

### When distance misleads

Euclidean distance quietly assumes every coordinate is measured on a comparable scale. Two houses differ by 114 square feet, 1 bedroom and 35 years. Squaring and adding, the size difference supplies 91% of the squared distance and the bedrooms almost nothing, simply because square feet are big numbers. The same happens with neurons: one that ranges from 0 to 200 spikes/s will dominate one that ranges from 0 to 5, regardless of which carries the information.

**Interactive figure.** Which feature dominates the distance between two houses? Change the units, or standardise, and watch the answer change while the houses stay the same.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=feature-scale&t=Which%20feature%20dominates%20the%20distance%20between%20two%20houses%3F)

A common fix is **standardisation**: for each feature, subtract its mean across the dataset and divide by its standard deviation, $z = (x-\text{mean})/\text{sd}$. Each feature then has no units and a comparable spread. Lesson 7 returns to this choice in detail.

**Key point**

Euclidean distance is a modelling choice, not an automatic measure of biological or practical similarity. Check the units and ranges of the coordinates before trusting it.

## Unit vectors and normalisation

Sometimes the *pattern* of a response matters more than its strength. The same stimulus at low and high contrast may drive the same neurons in the same proportions, only more strongly. To compare patterns, remove the strength.

**Definition: unit vector and normalisation**

A **unit vector** has length 1. For any nonzero $\mathbf{v}$, the unit vector pointing the same way is

$$\hat{\mathbf{v}} = \frac{\mathbf{v}}{\lVert \mathbf{v} \rVert}.$$

Computing $\hat{\mathbf{v}}$ is called **normalisation**. The zero vector has no direction and cannot be normalised.

**Why it is true: the unit vector has length 1 and points the same way**

$\hat{\mathbf{v}}$ is $\mathbf{v}$ multiplied by the positive scalar $c = 1/\lVert \mathbf{v} \rVert$, so it points the same way. By the scaling property, $\lVert\hat{\mathbf{v}}\rVert = |c|\,\lVert \mathbf{v} \rVert = \lVert \mathbf{v} \rVert/\lVert \mathbf{v} \rVert = 1$.

Rearranging the definition shows what normalisation does:

$$\mathbf{v} \;=\; \underbrace{\lVert \mathbf{v} \rVert}_{\text{strength}} \;\times\; \underbrace{\hat{\mathbf{v}}}_{\text{pattern}} .$$

Every nonzero vector splits into a length and a direction. Normalisation keeps the direction and discards the length. For $\mathbf{v}=(3,\ 4)$: $\lVert \mathbf{v} \rVert=5$ and $\hat{\mathbf{v}}=(0.6,\ 0.8)$.

**Interactive figure.** Strength times pattern. Change the strength with the slider: the vector grows and shrinks, but its unit vector on the circle stays put. Drag the vector to change its direction.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=normalise&t=Strength%20times%20pattern.)

![Responses A and B and a scaled-down copy of A (left). After normalising (right), A and 0.35 × A land on the same unit vector: only the direction survives. From the teaching notebook.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell050_1.svg)
*Responses A and B and a scaled-down copy of A (left). After normalising (right), A and 0.35 × A land on the same unit vector: only the direction survives. From the teaching notebook.*

In code, normalisation needs a guard: dividing by a length of zero is undefined, and NumPy would silently return `nan`. Checking against a small tolerance `eps` also catches vectors that are zero up to rounding.

```python
def normalise(v, eps=1e-12):
    v = np.asarray(v, dtype=float)
    norm = np.linalg.norm(v)
    if norm < eps:
        raise ValueError("The zero vector has no defined direction.")
    return v / norm

print(normalise([3.0, 4.0]))     # -> [0.6 0.8]
```

**In practice**

**What normalisation removes:** overall response strength. **What it keeps:** the relative pattern across neurons. Whether that is the right trade depends on the question. If arousal or contrast changes overall firing and you care about *which* neurons respond, normalise. If response strength itself is the signal, do not. Lesson 2 builds on this idea to measure how similar two patterns are (cosine similarity).

## Linear combinations, span, basis and dimension

### Linear combinations

**Definition: linear combination**

A **linear combination** of vectors $\mathbf{v}_1,\dots,\mathbf{v}_k$ is any weighted sum

$$\alpha_1\mathbf{v}_1 + \alpha_2\mathbf{v}_2 + \cdots + \alpha_k\mathbf{v}_k ,$$

where the weights $\alpha_1,\dots,\alpha_k$ are scalars.

Suppose the population often responds in two coordinated patterns: a "sensory" pattern $\mathbf{u}_{\text{stim}}=(1,\ 1,\ 0)$ that engages N1 and N2, and a "motor" pattern $\mathbf{u}_{\text{motor}}=(0,\ 1,\ 1)$ that engages N2 and N3. On a trial that engages them with strengths 20 and 15,

$$20\,\mathbf{u}_{\text{stim}} + 15\,\mathbf{u}_{\text{motor}} = (20,\ 20,\ 0) + (0,\ 15,\ 15) = (20,\ 35,\ 15).$$

### The standard basis and coordinates

The simplest building blocks are the **standard basis** vectors, each with a single 1:

$$\mathbf{e}_1 = (1,0,\dots,0),\quad \mathbf{e}_2 = (0,1,0,\dots,0),\quad\dots,\quad \mathbf{e}_n = (0,\dots,0,1).$$

Every vector is a linear combination of them, and the weights are just its coordinates:

$$\mathbf{v} = v_1\mathbf{e}_1 + v_2\mathbf{e}_2 + \cdots + v_n\mathbf{e}_n .$$

For $\mathbf{v}=(4,\ -2)$: four steps along $\mathbf{e}_1$, then $-2$ along $\mathbf{e}_2$. In neural terms, $\mathbf{e}_i$ is "neuron $i$ alone", and a population vector is a weighted sum of single-neuron directions.

![A vector rebuilt from the standard basis: 4 steps along e₁, then −2 along e₂. From the teaching notebook.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell057_1.svg)
*A vector rebuilt from the standard basis: 4 steps along e₁, then −2 along e₂. From the teaching notebook.*

### Span and linear independence

**Definition: span**

The **span** of a set of vectors is the set of all their linear combinations: every point you can reach by choosing the weights.

One nonzero vector spans a line through the origin. Two vectors span a plane, *unless* one is a multiple of the other, in which case they still only span a line. The second vector added no new direction.

**Definition: linear independence**

Vectors $\mathbf{v}_1,\dots,\mathbf{v}_k$ are **linearly independent** if the only way to combine them into the zero vector is with every weight zero:

$$\alpha_1\mathbf{v}_1+\cdots+\alpha_k\mathbf{v}_k=\mathbf{0} \quad\Longrightarrow\quad \alpha_1=\cdots=\alpha_k=0 .$$

Otherwise they are **linearly dependent**: at least one of them is a combination of the others, and adds nothing to the span.

For two vectors the test is simple: they are dependent exactly when one is a multiple of the other. $(2,\ 3)$ and $(4,\ 6)$ are dependent, since $(4,6)=2(2,3)$. $(1,\ 0)$ and $(0,\ 1)$ are independent.

**Interactive figure.** Build any point from two vectors. The faint lines are the coordinate grid of the basis b₁, b₂. Drag the purple target to read its coordinates in this basis, then make b₁ and b₂ parallel and watch the span collapse to a line.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=span-basis&t=Build%20any%20point%20from%20two%20vectors.)

![Independent directions span the plane (left); dependent directions collapse onto a line (right). From the teaching notebook.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell063_1.svg)
*Independent directions span the plane (left); dependent directions collapse onto a line (right). From the teaching notebook.*

### Basis, coordinates and dimension

**Definition: basis and dimension**

A **basis** of a space is a set of linearly independent vectors whose span is the whole space. Every vector in the space is then a combination of the basis vectors in exactly one way, and those unique weights are its **coordinates** in that basis. Every basis of a given space has the same number of vectors, and that number is the space's **dimension**.

The standard basis $\mathbf{e}_1,\dots,\mathbf{e}_n$ is one basis of $\mathbb{R}^n$, which is why $\mathbb{R}^n$ has dimension $n$. But it is not the only one, and other bases are often more meaningful.

**Why it is true: coordinates in a basis are unique**

Suppose $\mathbf{v} = \sum_i \alpha_i\mathbf{b}_i = \sum_i \beta_i\mathbf{b}_i$ for the same basis vectors $\mathbf{b}_i$. Subtracting, $\sum_i(\alpha_i-\beta_i)\mathbf{b}_i=\mathbf{0}$. The basis vectors are independent, so every $\alpha_i-\beta_i=0$. The two sets of weights were the same.

**Worked example: is a state in the span of two patterns?**

Every combination of $\mathbf{u}_{\text{stim}}$ and $\mathbf{u}_{\text{motor}}$ has the form

$$a(1,\ 1,\ 0) + b(0,\ 1,\ 1) = (a,\ a+b,\ b).$$

**State $(20,\ 35,\ 15)$.** Matching the first and last coordinates forces $a=20$, $b=15$. Check the middle one: $a+b=35$. It matches, so the state is in the span, with coordinates $(20,\ 15)$ in the pattern basis.

**State $(30,\ 10,\ 0)$.** Now $a=30$, $b=0$, but then $a+b=30\ne10$. No weights work: this state is *not* in the span.

**Key point**

Recordings of hundreds of neurons often turn out to be well described by a handful of coordinated patterns: the activity stays close to a low-dimensional subspace of the full neural space, sometimes called a **neural manifold**. Finding those patterns from data is what principal component analysis does (Lesson 7).

## From time series to trajectories

Real recordings follow activity through time. At each time bin $t$ the population has a state vector $\mathbf{r}(t)$, and the ordered sequence of states $\mathbf{r}(0), \mathbf{r}(1), \dots$ is a **trajectory** through state space.

Stored in NumPy, a recording of $T$ time bins from $n$ neurons is an array of shape `(T, n)`: one row per time bin, one column per neuron. Row $t$ is the state vector $\mathbf{r}(t)$; column $i$ is neuron $i$'s firing-rate trace. The same numbers can be drawn as $n$ traces against time, or as one path through $n$-dimensional space.

![Three firing-rate traces over 3 s, with a stimulus turning on at 1 s. Each column of the (60, 3) recording is one trace. From the teaching notebook.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell068_1.svg)
*Three firing-rate traces over 3 s, with a stimulus turning on at 1 s. Each column of the (60, 3) recording is one trace. From the teaching notebook.*

![The same recording as one path through three-neuron state space: each point is one row, one time bin. Colour runs from early to late.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell071_1.svg)
*The same recording as one path through three-neuron state space: each point is one row, one time bin. Colour runs from early to late.*

**Interactive figure.** Press Play to watch the population state move through state space, one 50 ms bin at a time.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&plotly=cell074_1&t=Press%20Play%20to%20watch%20the%20population%20state%20move%20through%20state%20space%2C%E2%80%A6)

Everything from this lesson applies to the trajectory.

- The **step** from one bin to the next is the difference $\Delta\mathbf{r}(t) = \mathbf{r}(t+1)-\mathbf{r}(t)$.
- Its length divided by the bin width $\Delta t$, $\lVert \Delta\mathbf{r}(t) \rVert/\Delta t$, is the **speed** of the population through state space. Where consecutive points are close, the state changed slowly; where they spread apart, it changed quickly.
- The **path length** adds up all the step lengths. The **net displacement** is the distance from the first state to the last. By the triangle inequality the path is never shorter than the displacement. A large ratio between them means the population wandered rather than moving directly.

**Interactive figure.** Press Play, or step through a two-neuron trajectory. The red arrow is the latest step; compare the path length so far with the net displacement.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=trajectory&t=Press%20Play%2C%20or%20step%20through%20a%20two-neuron%20trajectory.)

Comparing two conditions then means comparing two trajectories: for example, the distance between their states at matching times. In the notebook's mini-lab the two conditions start 2.1 spikes/s apart and end 24.0 spikes/s apart, consistent with the stimuli driving increasingly distinct patterns over time.

![Two conditions as two trajectories in the plane of N1 and N2. From the teaching notebook.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson01/cell076_1.svg)
*Two conditions as two trajectories in the plane of N1 and N2. From the teaching notebook.*

**Interactive figure.** Condition A (blue) and condition B (red) advance together, one 50 ms bin at a time. Pale lines are each condition's full route, bold lines the route so far, and the dashed line joins the two current states, whose length is the distance between conditions. Press Play or drag the time slider.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=two-conditions&t=Condition%20A%20%28blue%29%20and%20condition%20B%20%28red%29%20advance%20together%2C%20one%2050%E2%80%A6)

**In practice**

Motor cortex activity during reaching is a classic example: it traces out smooth, rotation-like trajectories that are remarkably similar across reach directions (Churchland et al., 2012). Analyses like that one start from exactly the objects in this section: a `(T, n)` array, its rows as states, and distances and directions between them.

## Mini-lab: following a population through state space

The teaching notebook's mini-lab puts the whole lesson together on the three-neuron recording above. It picks an early state (0.25 s, before the stimulus) and a late state (2.25 s), and asks how the population moved.

| Quantity | Value |
|---|---|
| early state $\mathbf{r}_{\text{early}}$ | $(3.96,\ 17.89,\ 7.67)$ spikes/s |
| late state $\mathbf{r}_{\text{late}}$ | $(49.54,\ 10.10,\ 26.95)$ spikes/s |
| change $\mathbf{r}_{\text{late}} - \mathbf{r}_{\text{early}}$ | $(45.59,\ -7.79,\ 19.28)$ spikes/s |
| lengths $\lVert\mathbf{r}_{\text{early}}\rVert$, $\lVert\mathbf{r}_{\text{late}}\rVert$ | 19.87 and 57.30 spikes/s |
| distance moved | 50.10 spikes/s |
| unit vector of the late state | $(0.865,\ 0.176,\ 0.470)$ |

The change is dominated by N1 (+45.6 spikes/s) and N3 (+19.3), while N2 fell slightly: the stimulus mainly recruited N1 and N3. The late state's unit vector says the same in terms of pattern: most of its direction lies along N1.

**Interactive figure.** The same recording two ways. Left: the three firing-rate traces, with a dashed cursor at the current time. Right: the matching point in the plane of N1 and N2 (purple), the route so far (dark line) and the full route (grey); the two hollow circles mark the early and late states in the table. Press Play or drag the time slider.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=01&ix=linked-traces&t=The%20same%20recording%20two%20ways.)

**Limitation.** The analysis uses Euclidean distance on raw firing rates, with no correction for the different ranges of N1, N2 and N3, and the 2D panels show only the first two neurons. A different choice of neurons to display, or a different distance measure, could change the numbers without changing the recording.

The **exercise notebook** continues with real data: population vectors of neurons in mouse primary visual cortex (Steinmetz et al., 2019), compared across stimulus conditions.

## Lesson summary

- A vector is an ordered list of $n$ numbers treated as one object; its meaning lives in what each coordinate refers to and its units.
- A vector can be read as a list, an arrow (a change) or a point (a state); neural data mostly uses points in state space.
- NumPy stores vectors as shape `(n,)`; columns `(n, 1)` and rows `(1, n)` broadcast differently.
- Addition, subtraction and scaling work coordinate by coordinate; $\mathbf{r}_B-\mathbf{r}_A$ is the change from state A to state B, and $c\,\mathbf{r}$ is the same pattern at a different strength.
- The norm $\lVert \mathbf{v} \rVert=\sqrt{\sum_i v_i^2}$ is Pythagoras in $n$ dimensions; $\lVert c\mathbf{v} \rVert=|c|\lVert \mathbf{v} \rVert$; the triangle inequality holds.
- Distance is the norm of the difference; it is a modelling choice that is distorted by mismatched scales.
- Normalisation $\hat{\mathbf{v}}=\mathbf{v}/\lVert \mathbf{v} \rVert$ splits a vector into strength $\times$ pattern and keeps only the pattern.
- Linear combinations, span, independence, basis and dimension describe which states a set of patterns can produce; population activity often stays near a low-dimensional subspace.
- A recording through time is a `(T, n)` array whose rows trace a trajectory; steps, speed, path length and displacement are all differences and norms.

## Further reading

- G. Strang, *Introduction to Linear Algebra*, 6th ed., Wellesley–Cambridge Press, 2023. Chapter 1 introduces vectors, linear combinations and lengths.
- M. M. Churchland, J. P. Cunningham, M. T. Kaufman, J. D. Foster, P. Nuyujukian, S. I. Ryu and K. V. Shenoy, "Neural population dynamics during reaching", *Nature* 487:51–56, 2012.
- S. Saxena and J. P. Cunningham, "Towards the neural population doctrine", *Current Opinion in Neurobiology* 55:103–111, 2019.
- J. A. Gallego, M. G. Perich, L. E. Miller and S. A. Solla, "Neural manifolds for the control of movement", *Neuron* 94(5):978–984, 2017.
