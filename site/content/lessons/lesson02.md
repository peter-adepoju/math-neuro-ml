---
summary: "The dot product as a neuron's weighted input, a measure of alignment and a projection: comparing population patterns, task axes, linear classifiers and a real visual neuron's weights."
---

::: objectives
- What a dot product is, how to compute it by hand, and what its units mean
- Why the same number is both a sum of products *and* two lengths times the cosine of an angle
- What orthogonality means, and why a computer almost never reports an exact zero
- How cosine similarity separates the *pattern* of a neural response from its *strength*, and why it misleads on raw firing rates
- How to project one vector onto another, what the projection error measures, and why the projection is the closest point on a line
- How a neuron's weighted input $\mathbf{w}\cdot\mathbf{x}+b$ and a linear classifier are the same computation
- How projections measure a real visual neuron's weights, and how projecting a population response back decodes the stimulus
:::

**Before you start.** This reading is the mathematical companion to the Lesson 2 teaching notebook. You need only what Lesson 1 gave you: a vector as an ordered list of numbers $\mathbf{v}=(v_1,\dots,v_n)$, the norm $\lVert \mathbf{v} \rVert=\sqrt{v_1^2+\cdots+v_n^2}$, the unit vector $\hat{\mathbf{v}}=\mathbf{v}/\lVert \mathbf{v} \rVert$, and vector addition and scaling. Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\mathbf{u}, \mathbf{v}, \mathbf{x}, \mathbf{w}$ | vectors (bold lower case), all with $n$ coordinates |
| $u_i$ | the $i$-th coordinate of $\mathbf{u}$ (a single number, not bold) |
| $\sum_{i=1}^{n} a_i$ | "add up $a_1 + a_2 + \cdots + a_n$" |
| $\mathbf{u}\cdot\mathbf{v}$ | the dot product of $\mathbf{u}$ and $\mathbf{v}$ (a single number) |
| $\theta$ | the angle between two vectors |
| $\operatorname{comp}_{\mathbf{v}}(\mathbf{u})$, $\operatorname{proj}_{\mathbf{v}}(\mathbf{u})$ | the scalar and vector projection of $\mathbf{u}$ onto $\mathbf{v}$ |
| $b$ | a bias: a single number added after a dot product |

## The problem: are two brain states alike?

Three neurons are recorded under three conditions. The firing rates, in spikes per second, are

$$\mathbf{r}_A = (10,\ 30,\ 20), \qquad \mathbf{r}_{A,\text{strong}} = (20,\ 60,\ 40), \qquad \mathbf{r}_B = (30,\ 10,\ 20).$$

$\mathbf{r}_{A,\text{strong}}$ is exactly twice $\mathbf{r}_A$: the same pattern, fired more strongly, as happens when a stimulus is shown at higher contrast. $\mathbf{r}_B$ is a genuinely different pattern, with the roles of the first two neurons swapped.

Lesson 1 gave you one way to compare two states: the distance between them. Here is what it says.

```python
r_A        = np.array([10.0, 30.0, 20.0])   # spikes/s, (N1, N2, N3)
r_A_strong = np.array([20.0, 60.0, 40.0])   # same pattern, twice as strong
r_B        = np.array([30.0, 10.0, 20.0])   # different pattern

print(np.linalg.norm(r_A - r_A_strong))     # -> 37.4
print(np.linalg.norm(r_A - r_B))            # -> 28.3
```

By distance, $\mathbf{r}_B$ is *closer* to $\mathbf{r}_A$ than $\mathbf{r}_{A,\text{strong}}$ is, even though $\mathbf{r}_{A,\text{strong}}$ has the identical pattern. Distance is not wrong; it answers a different question. It mixes two things together: **how strongly** the population fired, and **which pattern** it fired in. A neuroscientist asking "does this stimulus evoke the same representation?" usually cares about the second.

The tool that pulls these apart is the **dot product**. It is one of the most heavily used operations in computational neuroscience and machine learning: it computes a neuron's total input, a linear model's prediction, the similarity of two representations, and the position of a data point along a chosen axis. This lesson builds it from the definition up.

## The dot product

A neuron receives input from four presynaptic neurons. Input $i$ fires at rate $x_i$ and reaches the neuron through a connection of strength $w_i$, called its **weight**. A positive weight pushes the neuron's input up; a negative weight pushes it down. A simple model says the neuron's **total weighted input** is

$$z = w_1 x_1 + w_2 x_2 + w_3 x_3 + w_4 x_4 .$$

Collect the rates into a vector $\mathbf{x}$ and the weights into a vector $\mathbf{w}$, and this sum gets a name.

::: definition Definition: dot product
The **dot product** of two vectors with the same number of coordinates, $\mathbf{u}=(u_1,\dots,u_n)$ and $\mathbf{v}=(v_1,\dots,v_n)$, is the single number

$$\mathbf{u}\cdot\mathbf{v} = \sum_{i=1}^{n} u_i v_i = u_1v_1 + u_2v_2 + \cdots + u_nv_n .$$

Multiply matching coordinates, then add. It is also called the **inner product**, and written $\mathbf{u}^{\mathsf T}\mathbf{v}$ when vectors are treated as columns (Lesson 3).
:::

Read the summation sign $\sum_{i=1}^{n}$ as an instruction: "let $i$ run through $1, 2, \dots, n$, write down the expression for each value, and add them all." Nothing more is hidden in it.

::: example Worked example: a neuron's total input
Rates $\mathbf{x}=(20,\ 10,\ 5,\ 15)$ spikes/s, weights $\mathbf{w}=(0.8,\ -0.5,\ 0.3,\ 0)$ with no units.

$$\mathbf{w}\cdot\mathbf{x} = (0.8)(20) + (-0.5)(10) + (0.3)(5) + (0)(15) = 16 - 5 + 1.5 + 0 = 12.5 \text{ spikes/s}.$$

Each product is one input's **contribution**. Input 1 contributes the most. Input 2 is fairly active, but its negative weight turns its activity into a *negative* contribution. Input 4 fires at 15 spikes/s and contributes nothing, because its weight is zero.
:::

{{ interactive: contributions | The four contributions from the worked example. Each bar is one product $w_i x_i$, and the dashed green line is their sum, the dot product. Move the weights and the rates to see how each input pushes the total up or down. }}

In NumPy the dot product is written with the `@` operator (or `np.dot`). A loop gives the same number; NumPy is simply faster.

```python
x_inputs  = np.array([20.0, 10.0, 5.0, 15.0])   # spikes/s, shape (4,)
w_weights = np.array([0.8, -0.5, 0.3, 0.0])      # no units, shape (4,)

print(w_weights * x_inputs)     # -> [16.  -5.   1.5  0. ]   the contributions
print(w_weights @ x_inputs)     # -> 12.5                   their sum
```

### Two conditions, and the units of the answer

The definition quietly requires two things.

**Same length.** Coordinate $i$ of one vector is paired with coordinate $i$ of the other, so both need $n$ coordinates. NumPy raises an error if they do not.

**Same meaning, in the same order.** Coordinate $i$ of $\mathbf{w}$ must refer to the same input as coordinate $i$ of $\mathbf{x}$. NumPy cannot check this. If the rates are stored with inputs 1 and 2 swapped, the code runs happily and returns $-0.5$ spikes/s instead of $12.5$.

**Units multiply.** The units of each term are (units of $w_i$) $\times$ (units of $x_i$), and every term must have the same units for the sum to make sense. With dimensionless weights and rates in spikes/s, $z$ is in spikes/s. If a weight meant "millivolts of depolarisation per spike/s of input", $z$ would be in millivolts.

::: pitfall
Mismatched *lengths* crash. Mismatched *order* does not. A dot product between a weight vector and a rate vector whose neurons are listed in a different order is a perfectly valid number with no meaning. Keep the neuron (or feature) order in one place and use it everywhere.
:::

## The rules the dot product obeys

Five rules follow directly from the definition. Together they let you handle dot products the way you handle ordinary multiplication. Here $\mathbf{u},\mathbf{v},\mathbf{w}$ have the same length and $c$ is a number.

| Rule | Statement | Meaning for a neuron |
|---|---|---|
| Symmetry | $\mathbf{u}\cdot\mathbf{v}=\mathbf{v}\cdot\mathbf{u}$ | the order of comparison does not matter |
| Sums split | $\mathbf{u}\cdot(\mathbf{v}+\mathbf{w})=\mathbf{u}\cdot\mathbf{v}+\mathbf{u}\cdot\mathbf{w}$ | two input sources add their effects |
| Scaling passes through | $\mathbf{u}\cdot(c\mathbf{v})=c\,(\mathbf{u}\cdot\mathbf{v})$ | doubling all inputs doubles the input |
| Self dot product | $\mathbf{v}\cdot\mathbf{v}=\lVert \mathbf{v} \rVert^2$ | links to the Lesson 1 norm |
| Positivity | $\mathbf{v}\cdot\mathbf{v}\ge 0$, and $0$ only if $\mathbf{v}=\mathbf{0}$ | only the zero vector has length zero |

::: note Why it is true: the five rules
Each rule is a statement about ordinary numbers, applied one coordinate at a time.

- **Symmetry:** $\sum_i u_iv_i = \sum_i v_iu_i$ because $u_iv_i = v_iu_i$ for numbers.
- **Sums split:** $\sum_i u_i(v_i+w_i) = \sum_i u_iv_i + \sum_i u_iw_i$, by multiplying out each bracket.
- **Scaling:** $\sum_i u_i(cv_i) = c\sum_i u_iv_i$, taking the common factor $c$ out of the sum.
- **Self dot product:** $\mathbf{v}\cdot\mathbf{v}=\sum_i v_i^2$, which is the square of $\lVert \mathbf{v} \rVert=\sqrt{\sum_i v_i^2}$.
- **Positivity:** a sum of squares is never negative, and it is zero only if every square, hence every $v_i$, is zero.
:::

The fourth rule deserves a second look: *the norm from Lesson 1 is a dot product*, $\lVert \mathbf{v} \rVert=\sqrt{\mathbf{v}\cdot\mathbf{v}}$. That single fact connects lengths to dot products, and it gives the most useful identity in this lesson.

::: keypoint
**Expanding a squared length.** For any two vectors,

$$\lVert \mathbf{u}+\mathbf{v} \rVert^2 = \lVert \mathbf{u} \rVert^2 + 2\,\mathbf{u}\cdot\mathbf{v} + \lVert \mathbf{v} \rVert^2, \qquad \lVert \mathbf{u}-\mathbf{v} \rVert^2 = \lVert \mathbf{u} \rVert^2 - 2\,\mathbf{u}\cdot\mathbf{v} + \lVert \mathbf{v} \rVert^2 .$$

It is $(a\pm b)^2 = a^2 \pm 2ab + b^2$ for vectors. To prove it, write $\lVert \mathbf{u}-\mathbf{v} \rVert^2=(\mathbf{u}-\mathbf{v})\cdot(\mathbf{u}-\mathbf{v})$ and multiply out using the rules above.
:::

Check it on the vectors from the problem: $\lVert \mathbf{r}_A \rVert^2=\lVert \mathbf{r}_B \rVert^2=1400$ and $\mathbf{r}_A\cdot\mathbf{r}_B = 300+300+400 = 1000$, so $\lVert \mathbf{r}_A-\mathbf{r}_B \rVert^2 = 1400 - 2000 + 1400 = 800$, and $\sqrt{800}=28.3$: the distance NumPy printed.

## The geometric view: length and angle

So far the dot product is arithmetic. Its power comes from a second formula, which shows what that arithmetic *measures*.

::: keypoint
For any two nonzero vectors separated by an angle $\theta$ (between $0^\circ$ and $180^\circ$),

$$\mathbf{u}\cdot\mathbf{v} = \lVert \mathbf{u} \rVert\,\lVert \mathbf{v} \rVert\cos\theta .$$

This is the same number as $\sum_i u_iv_i$, written in terms of two lengths and one angle.
:::

{{ interactive: dot-angle | Drag the tips of u (blue) and v (orange). The panel computes the dot product both ways, as a sum of products and as lengths times the cosine of the angle, and the two always agree. Press Play to rotate v all the way round and watch the sign change at 90°. }}

### Where the formula comes from

Draw $\mathbf{u}$ and $\mathbf{v}$ from the same starting point. The third side of the triangle they make runs from the tip of $\mathbf{v}$ to the tip of $\mathbf{u}$, and that side is the vector $\mathbf{u}-\mathbf{v}$. (Tick *Show the triangle* in the figure above.)

::: note Why it is true: u · v = ‖u‖ ‖v‖ cos θ
Compute the squared length of the third side in two ways.

**With geometry.** The **law of cosines**, the version of Pythagoras for any triangle, says that a triangle with sides $a$ and $b$ and angle $\theta$ between them has third side $c$ with $c^2 = a^2 + b^2 - 2ab\cos\theta$. Here $a=\lVert \mathbf{u} \rVert$, $b=\lVert \mathbf{v} \rVert$ and $c=\lVert \mathbf{u}-\mathbf{v} \rVert$:

$$\lVert \mathbf{u}-\mathbf{v} \rVert^2 = \lVert \mathbf{u} \rVert^2 + \lVert \mathbf{v} \rVert^2 - 2\lVert \mathbf{u} \rVert\lVert \mathbf{v} \rVert\cos\theta .$$

**With algebra.** The identity in the key point above gives

$$\lVert \mathbf{u}-\mathbf{v} \rVert^2 = \lVert \mathbf{u} \rVert^2 + \lVert \mathbf{v} \rVert^2 - 2\,\mathbf{u}\cdot\mathbf{v}.$$

The left sides are equal, so the right sides are equal. Cancel $\lVert \mathbf{u} \rVert^2+\lVert \mathbf{v} \rVert^2$ and divide by $-2$: $\mathbf{u}\cdot\mathbf{v} = \lVert \mathbf{u} \rVert\lVert \mathbf{v} \rVert\cos\theta$.
:::

The proof is drawn in two dimensions, but nothing in it depends on that: any two vectors, however many coordinates they have, lie in a flat plane through the origin, and the triangle lives in that plane. So the formula holds for 3 neurons or 3000. Rearranging gives the angle itself:

$$\cos\theta = \frac{\mathbf{u}\cdot\mathbf{v}}{\lVert \mathbf{u} \rVert\,\lVert \mathbf{v} \rVert}, \qquad \theta = \arccos\!\left(\frac{\mathbf{u}\cdot\mathbf{v}}{\lVert \mathbf{u} \rVert\,\lVert \mathbf{v} \rVert}\right).$$

::: example Worked example: the three brain states
$\mathbf{r}_A\cdot\mathbf{r}_{A,\text{strong}} = 200 + 1800 + 800 = 2800$, and $\lVert \mathbf{r}_A \rVert\lVert \mathbf{r}_{A,\text{strong}} \rVert = \sqrt{1400}\,\sqrt{5600} = 2800$. So $\cos\theta = 1$ and $\theta = 0^\circ$: the same direction.

$\mathbf{r}_A\cdot\mathbf{r}_B = 1000$ and $\lVert \mathbf{r}_A \rVert\lVert \mathbf{r}_B \rVert = 1400$. So $\cos\theta = 0.714$ and $\theta = 44.4^\circ$.

The angle gives the answer distance could not: $\mathbf{r}_{A,\text{strong}}$ has *exactly* the pattern of $\mathbf{r}_A$, and $\mathbf{r}_B$ does not.
:::

### Reading the sign

Lengths are never negative, so the sign of $\mathbf{u}\cdot\mathbf{v}$ is the sign of $\cos\theta$, and the cosine is positive below $90^\circ$, zero at $90^\circ$ and negative above:

- $\mathbf{u}\cdot\mathbf{v}>0$: an acute angle; the vectors point broadly the same way.
- $\mathbf{u}\cdot\mathbf{v}=0$: a right angle.
- $\mathbf{u}\cdot\mathbf{v}<0$: an obtuse angle; the vectors point broadly opposite ways.

A few cosines are worth knowing by heart: $\cos 0^\circ = 1$, $\cos 60^\circ = 0.5$, $\cos 90^\circ = 0$, $\cos 120^\circ=-0.5$, $\cos 180^\circ=-1$. The *size* of the dot product also depends on the two lengths; its *sign* depends only on the angle.

### Why the cosine never leaves [−1, 1]

For the angle formula to make sense, the ratio $\mathbf{u}\cdot\mathbf{v}/(\lVert \mathbf{u} \rVert\lVert \mathbf{v} \rVert)$ must always lie between $-1$ and $1$. A picture in two dimensions suggests it, but it is not a proof for a thousand. The guarantee has a name: the **Cauchy–Schwarz inequality**,

$$|\mathbf{u}\cdot\mathbf{v}| \le \lVert \mathbf{u} \rVert\,\lVert \mathbf{v} \rVert .$$

::: note Why it is true: Cauchy–Schwarz
If $\mathbf{v}=\mathbf{0}$ both sides are zero. Otherwise, for every number $t$, the vector $\mathbf{u}-t\mathbf{v}$ has a squared length that cannot be negative:

$$0 \le \lVert \mathbf{u}-t\mathbf{v} \rVert^2 = \lVert \mathbf{u} \rVert^2 - 2t\,(\mathbf{u}\cdot\mathbf{v}) + t^2\lVert \mathbf{v} \rVert^2 .$$

Choose $t = (\mathbf{u}\cdot\mathbf{v})/\lVert \mathbf{v} \rVert^2$. Substituting,

$$0 \le \lVert \mathbf{u} \rVert^2 - \frac{(\mathbf{u}\cdot\mathbf{v})^2}{\lVert \mathbf{v} \rVert^2}.$$

Multiply by $\lVert \mathbf{v} \rVert^2$ and take square roots: $|\mathbf{u}\cdot\mathbf{v}| \le \lVert \mathbf{u} \rVert\lVert \mathbf{v} \rVert$. Equality holds only when $\mathbf{u}-t\mathbf{v}=\mathbf{0}$, that is, when one vector is a multiple of the other. (That value of $t$ is not a lucky guess: the projection section shows it makes $\mathbf{u}-t\mathbf{v}$ as short as possible.)
:::

::: note In practice
On a computer the ratio can still land a hair outside $[-1,1]$, for example $1.0000000000000002$, because decimals are stored approximately. `np.arccos` of such a value returns `nan`. Always clip first.
:::

```python
def angle_between(a, b, eps=1e-12):
    norm_a, norm_b = np.linalg.norm(a), np.linalg.norm(b)
    if norm_a < eps or norm_b < eps:
        raise ValueError("The angle is undefined for a zero vector.")
    cos_theta = np.clip((a @ b) / (norm_a * norm_b), -1.0, 1.0)
    return np.degrees(np.arccos(cos_theta))

print(angle_between(r_A, r_A_strong))   # -> 0.0
print(angle_between(r_A, r_B))          # -> 44.4
```

::: quiz
? Two vectors have $\mathbf{u}\cdot\mathbf{v} = -6$. What can you say about the angle between them?
- [ ] It is less than $90^\circ$.
- [ ] It is exactly $90^\circ$.
- [x] It is more than $90^\circ$.
- [ ] Nothing, without knowing the lengths.
> The lengths are positive, so the sign of the dot product is the sign of $\cos\theta$. A negative cosine means an obtuse angle. The lengths only set the *size* of the dot product.

? $\lVert \mathbf{u} \rVert = 3$, $\lVert \mathbf{v} \rVert = 4$ and the angle between them is $60^\circ$. What is $\mathbf{u}\cdot\mathbf{v}$?
- [ ] 12
- [x] 6
- [ ] 7
- [ ] 3.46
> $\mathbf{u}\cdot\mathbf{v} = \lVert \mathbf{u} \rVert\lVert \mathbf{v} \rVert\cos 60^\circ = 3 \times 4 \times 0.5 = 6$.
:::

## Orthogonality

Two downstream neurons read out the same three-neuron population, with weight vectors $\mathbf{w}_1=(1,\ 1,\ 0)$ and $\mathbf{w}_2=(1,\ -1,\ 0)$. The population changes by $\Delta\mathbf{r}=(5,\ 5,\ 0)$ spikes/s. Read-out 1 changes by $\mathbf{w}_1\cdot\Delta\mathbf{r} = 10$ spikes/s. Read-out 2 changes by $\mathbf{w}_2\cdot\Delta\mathbf{r} = 5-5 = 0$: it does not see this change at all.

The reason is that $\mathbf{w}_1\cdot\mathbf{w}_2 = 1 - 1 + 0 = 0$, and $\Delta\mathbf{r}$ is a multiple of $\mathbf{w}_1$.

::: definition Definition: orthogonal
Two vectors are **orthogonal** when $\mathbf{u}\cdot\mathbf{v}=0$. For nonzero vectors this means $\cos\theta=0$, so they meet at a right angle. The zero vector is orthogonal to every vector.
:::

### Pythagoras, in any number of dimensions

Set $\mathbf{u}\cdot\mathbf{v}=0$ in the identity for $\lVert \mathbf{u}+\mathbf{v} \rVert^2$ and the cross term vanishes:

$$\mathbf{u}\cdot\mathbf{v}=0 \quad\Longleftrightarrow\quad \lVert \mathbf{u}+\mathbf{v} \rVert^2 = \lVert \mathbf{u} \rVert^2 + \lVert \mathbf{v} \rVert^2 .$$

This is Pythagoras' theorem, now proved for vectors with any number of coordinates. When $\mathbf{u}$ and $\mathbf{v}$ are not orthogonal, the extra term $2\,\mathbf{u}\cdot\mathbf{v}$ appears. Pythagoras returns in the projection section, where it shows why a projection is the closest point on a line.

### Coordinates are dot products

The standard basis vectors from Lesson 1, $\mathbf{e}_1=(1,0,\dots,0)$, $\mathbf{e}_2=(0,1,0,\dots,0)$ and so on, each have length 1 and are orthogonal to one another. A dot product with one of them picks out a coordinate:

$$\mathbf{v}\cdot\mathbf{e}_i = v_i .$$

So "the firing rate of neuron $i$" is itself a dot product: the population vector read out along the axis of neuron $i$. The task-axis section below generalises this to axes that are not one neuron but a combination of many.

### Zero on a computer

Build two perpendicular unit vectors from `cos` and `sin` and NumPy reports their dot product as `6.123e-17`, not `0.0`. Nothing is wrong with the vectors; the computer stored $\cos 90^\circ$ approximately. The right test is "close to zero, within a tolerance".

```python
reference = np.array([1.0, 0.0])
rotated   = np.array([np.cos(np.pi / 2), np.sin(np.pi / 2)])
print(reference @ rotated)                              # -> 6.123233995736766e-17
print(reference @ rotated == 0.0)                       # -> False
print(np.isclose(reference @ rotated, 0.0, atol=1e-8))  # -> True
```

::: pitfall
**Orthogonal is not the same as independent.** Orthogonality is geometry: a dot product of zero. Statistical independence is a statement about probability distributions (Lesson 17). Two neurons whose rate vectors across trials are orthogonal can still be strongly related.
:::

## Normalisation and cosine similarity

The formula $\mathbf{u}\cdot\mathbf{v} = \lVert \mathbf{u} \rVert\lVert \mathbf{v} \rVert\cos\theta$ shows exactly why the raw dot product cannot answer the opening question on its own: it multiplies the pattern information ($\cos\theta$) by the strength information ($\lVert \mathbf{u} \rVert\lVert \mathbf{v} \rVert$). To compare patterns only, divide the strength out.

::: definition Definition: cosine similarity
For nonzero vectors,

$$\cos(\mathbf{u},\mathbf{v}) = \frac{\mathbf{u}\cdot\mathbf{v}}{\lVert \mathbf{u} \rVert\,\lVert \mathbf{v} \rVert} = \hat{\mathbf{u}}\cdot\hat{\mathbf{v}} = \cos\theta .$$

It lies in $[-1,1]$ by Cauchy–Schwarz: $1$ for the same direction, $0$ for orthogonal, $-1$ for opposite. It is undefined if either vector is zero.
:::

The middle form, $\hat{\mathbf{u}}\cdot\hat{\mathbf{v}}$, says something simple: *cosine similarity is normalisation followed by a dot product*. Normalise both vectors to length 1, as in Lesson 1, and take their dot product.

::: note Why it is true: rescaling does not change cosine similarity
For a number $c>0$, $\lVert c\mathbf{v} \rVert = c\lVert \mathbf{v} \rVert$, so

$$\cos(\mathbf{u},c\mathbf{v}) = \frac{c\,(\mathbf{u}\cdot\mathbf{v})}{\lVert \mathbf{u} \rVert\; c\lVert \mathbf{v} \rVert} = \cos(\mathbf{u},\mathbf{v}).$$

The factor $c$ cancels. If $c<0$, then $\lVert c\mathbf{v} \rVert = |c|\lVert \mathbf{v} \rVert$ and the sign flips: an opposite direction is a different pattern.
:::

{{ interactive: strength-pattern | Rescale the pattern $\mathbf{r}_B$ by a factor $s$ and follow three ways of comparing it with $\mathbf{r}_A$. The dot product grows in proportion to s and the distance changes with it, but the cosine similarity stays at 0.714. Press Play to sweep s. }}

There is also a neat link back to distance. For unit vectors, the squared-length identity gives

$$\lVert \hat{\mathbf{u}}-\hat{\mathbf{v}} \rVert^2 = 1 - 2\,\hat{\mathbf{u}}\cdot\hat{\mathbf{v}} + 1 = 2 - 2\cos(\mathbf{u},\mathbf{v}).$$

So comparing patterns by cosine similarity is the same as comparing them by distance *after normalising both*. The larger the similarity, the smaller that distance.

::: keypoint
Cosine similarity removes overall strength and keeps the relative pattern across neurons. That is exactly what normalisation did in Lesson 1, because it *is* normalisation followed by a dot product.
:::

## Comparing neural population patterns

Four neurons are recorded while an animal views five stimuli: a grating at $0^\circ$, the same grating at high contrast, gratings at $45^\circ$ and $90^\circ$, and a blank screen. Each stimulus gives one population vector. The cosine similarity between every pair, arranged in a table, is a **similarity matrix**. Comparing such matrices across brain areas, species or models is the basis of **representational similarity analysis** (Kriegeskorte et al., 2008).

{{ interactive: similarity-matrix | Cosine similarity between five simulated population responses. Click any square to see the two responses it compares. Then switch to mean-centred and watch the blank screen stop looking like everything else. }}

The two $0^\circ$ gratings score $1.00$: the same pattern at a different strength. The $0^\circ$ and $90^\circ$ gratings are least alike, at $0.40$, with $45^\circ$ in between. So far, so sensible. Now look at the blank screen. Its response is almost flat, $(4,\ 5,\ 4,\ 5)$ spikes/s, with no structure at all, yet its similarity to every grating is between $0.79$ and $0.93$.

### The nonnegative firing-rate problem

This is not a quirk of the example. It is guaranteed.

::: note Why it is true: firing-rate vectors are never more than 90° apart
Firing rates are never negative. If every $u_i\ge 0$ and every $v_i \ge 0$, then every product $u_iv_i \ge 0$, so $\mathbf{u}\cdot\mathbf{v} = \sum_i u_iv_i \ge 0$. Therefore $\cos\theta \ge 0$ and $\theta \le 90^\circ$. The dot product is exactly zero only if no neuron is active in both conditions.
:::

All raw firing-rate vectors live in one "all-positive" corner of the space. Any two of them start out partly aligned, simply because everything fires a little: shared baseline activity inflates similarity.

A common remedy is **mean-centring**: subtract each vector's own average across neurons before comparing, $\mathbf{u}-\bar{u}\,\mathbf{1}$, where $\bar u$ is the mean of the coordinates and $\mathbf{1}=(1,\dots,1)$. The blank screen's similarity to the $0^\circ$ grating drops from $0.79$ to $-0.32$, because its tiny ups and downs no longer ride on a shared positive level.

::: note In practice
Cosine similarity of mean-centred vectors has a familiar name: it is exactly the **Pearson correlation** between the two vectors' coordinates,

$$r = \frac{\sum_i (u_i-\bar u)(v_i-\bar v)}{\sqrt{\sum_i (u_i-\bar u)^2}\,\sqrt{\sum_i (v_i-\bar v)^2}} .$$

So "raw cosine similarity or correlation?" is really "mean-centre first, or not?". Neither is automatically right. Report which one you used.
:::

::: pitfall
High similarity between two stimuli is a fact about two measured vectors. It does not show the brain processes them by the same mechanism. The value also depends on which neurons happened to be recorded: add or remove a few neurons and the matrix changes.
:::

::: quiz
? Population response $\mathbf{s}$ is exactly $0.2\,\mathbf{r}$. What is their cosine similarity?
- [ ] 0.2
- [x] 1
- [ ] 5
- [ ] It depends on the lengths.
> A positive multiple points the same way, and cosine similarity divides the lengths out. Same pattern, five times weaker: similarity 1.

? Two responses use completely separate sets of neurons: wherever one is nonzero, the other is zero. What is their raw cosine similarity?
- [ ] 1
- [x] 0
- [ ] −1
- [ ] It cannot be computed.
> Every product $u_iv_i$ is zero, so the dot product is zero and the vectors are orthogonal. With nonnegative rates this is the *least* similar two responses can be: they cannot reach $-1$.

? Why does the blank screen look similar to every grating in the raw similarity matrix?
- [ ] Because the blank screen evokes a strong response.
- [x] Because all firing rates are nonnegative, so every pair of responses is at most 90° apart and a shared baseline pushes similarities up.
- [ ] Because cosine similarity is not defined for flat vectors.
> Rates live in the all-positive corner, so every dot product is nonnegative. Mean-centring removes the shared level and lets different patterns become dissimilar.
:::

## Projection and projection error

Often we have a direction we care about, a "choice axis" or a neuron's preferred input, and want to know how much of a vector lies along it. That is **projection**.

### Deriving the projection

Let $\mathbf{v}$ be the direction and $\mathbf{u}$ the vector to project. We look for the point $t\mathbf{v}$ on the line through $\mathbf{v}$ that best represents $\mathbf{u}$, and we ask for the leftover piece, the **residual** $\mathbf{e}=\mathbf{u}-t\mathbf{v}$, to be at right angles to the line. The projection is the "shadow" of $\mathbf{u}$ on the line.

::: note Why it is true: the projection formula
Require the residual to be orthogonal to $\mathbf{v}$:

$$(\mathbf{u}-t\mathbf{v})\cdot\mathbf{v} = 0 \;\;\Longrightarrow\;\; \mathbf{u}\cdot\mathbf{v} - t\,(\mathbf{v}\cdot\mathbf{v}) = 0 \;\;\Longrightarrow\;\; t = \frac{\mathbf{u}\cdot\mathbf{v}}{\mathbf{v}\cdot\mathbf{v}} .$$

Only the rules of the dot product were used. This $t$ is the same value that appeared in the Cauchy–Schwarz proof.
:::

::: definition Definition: scalar projection, vector projection and residual
For a nonzero direction $\mathbf{v}$,

$$\operatorname{comp}_{\mathbf{v}}(\mathbf{u}) = \frac{\mathbf{u}\cdot\mathbf{v}}{\lVert \mathbf{v} \rVert} = \mathbf{u}\cdot\hat{\mathbf{v}} = \lVert \mathbf{u} \rVert\cos\theta, \qquad \operatorname{proj}_{\mathbf{v}}(\mathbf{u}) = \frac{\mathbf{u}\cdot\mathbf{v}}{\mathbf{v}\cdot\mathbf{v}}\,\mathbf{v}, \qquad \mathbf{e} = \mathbf{u} - \operatorname{proj}_{\mathbf{v}}(\mathbf{u}).$$

The **scalar projection** is a signed number: the coordinate of $\mathbf{u}$ along the line (negative if $\mathbf{u}$ leans the other way). The **vector projection** is the arrow along the line with that signed length. The length $\lVert \mathbf{e} \rVert$ is the **projection error**: how much of $\mathbf{u}$ the direction fails to capture.
:::

If $\mathbf{v}$ is already a unit vector, $\lVert \mathbf{v} \rVert=1$ and $\mathbf{v}\cdot\mathbf{v}=1$, so the formulas shrink to $\operatorname{comp}=\mathbf{u}\cdot\hat{\mathbf{v}}$ and $\operatorname{proj} = (\mathbf{u}\cdot\hat{\mathbf{v}})\,\hat{\mathbf{v}}$. Using these shortcuts with a vector that is *not* of length 1 is the single most common projection mistake.

{{ interactive: projection | Drag the tips of u (blue) and v (orange). The green arrow is the projection of u onto the line through v; the dashed black segment is the residual, which always meets the line at a right angle. Slide the purple point along the line, or press Play: its distance to u is smallest exactly at the projection. }}

::: example Worked example: projecting u = (3, 4) onto v = (2, 0.5)
$$\begin{aligned} \mathbf{u}\cdot\mathbf{v} &= 6 + 2 = 8, \qquad \mathbf{v}\cdot\mathbf{v} = 4 + 0.25 = 4.25, \qquad \lVert \mathbf{v} \rVert = 2.062,\\ \operatorname{comp}_{\mathbf{v}}(\mathbf{u}) &= 8/2.062 = 3.881,\\ \operatorname{proj}_{\mathbf{v}}(\mathbf{u}) &= (8/4.25)\,(2,\ 0.5) = 1.882\,(2,\ 0.5) = (3.765,\ 0.941),\\ \mathbf{e} &= (3,\ 4) - (3.765,\ 0.941) = (-0.765,\ 3.059), \qquad \lVert \mathbf{e} \rVert = 3.153. \end{aligned}$$

Check: $\mathbf{e}\cdot\mathbf{v} = -1.529 + 1.529 = 0$. The residual is orthogonal to $\mathbf{v}$, as designed.
:::

```python
def vector_projection(u, v):
    if np.isclose(v @ v, 0.0):
        raise ValueError("Cannot project onto the zero vector.")
    return (u @ v) / (v @ v) * v

u_vec, v_dir = np.array([3.0, 4.0]), np.array([2.0, 0.5])
proj = vector_projection(u_vec, v_dir)
residual = u_vec - proj
print(proj, np.linalg.norm(residual))   # -> [3.765 0.941] 3.153
print(residual @ v_dir)                 # -> 0.0
```

### The projection is the closest point on the line

The projection is not just one choice of point on the line. It is the best one, as the purple point in the figure shows.

::: note Why it is true: no point on the line is closer to u than its projection
Take any other point $s\mathbf{v}$ on the line, and write $\mathbf{p}=t\mathbf{v}$ for the projection. Then

$$\mathbf{u}-s\mathbf{v} = (\mathbf{u}-\mathbf{p}) + (t-s)\mathbf{v} = \mathbf{e} + (t-s)\mathbf{v}.$$

The two pieces are orthogonal, because $\mathbf{e}\cdot\mathbf{v}=0$. By Pythagoras,

$$\lVert \mathbf{u}-s\mathbf{v} \rVert^2 = \lVert \mathbf{e} \rVert^2 + (t-s)^2\lVert \mathbf{v} \rVert^2 \;\ge\; \lVert \mathbf{e} \rVert^2 ,$$

with equality only when $s=t$.
:::

### A formula for the projection error

Pythagoras also gives the size of the error without computing $\mathbf{e}$. Since $\mathbf{u} = \operatorname{proj}_{\mathbf{v}}(\mathbf{u}) + \mathbf{e}$ with the two pieces orthogonal,

$$\lVert \mathbf{e} \rVert^2 = \lVert \mathbf{u} \rVert^2 - \operatorname{comp}_{\mathbf{v}}(\mathbf{u})^2 = \lVert \mathbf{u} \rVert^2 - \lVert \mathbf{u} \rVert^2\cos^2\theta = \lVert \mathbf{u} \rVert^2\sin^2\theta .$$

For the worked example, $25 - 3.881^2 = 9.94$ and $\sqrt{9.94}=3.153$. The error is zero when $\mathbf{u}$ lies along the line ($\theta=0^\circ$ or $180^\circ$) and as large as $\lVert \mathbf{u} \rVert$ itself when $\mathbf{u}$ is orthogonal to it.

::: note Try it: remove a direction
Given two non-orthogonal directions $\mathbf{d}_1$ and $\mathbf{d}_2$, the residual $\mathbf{q}_2 = \mathbf{d}_2 - \operatorname{proj}_{\mathbf{d}_1}(\mathbf{d}_2)$ is orthogonal to $\mathbf{d}_1$. This is the first step of the **Gram–Schmidt** procedure. Neuroscientists use the same move to remove a shared "arousal" direction from population activity before asking about task structure. The bonus question of the exercise notebook asks you to do it.
:::

::: quiz
? You project $\mathbf{u}$ onto $\mathbf{v}=(3,\ 4)$ using $\mathbf{u}\cdot\mathbf{v}$ as the scalar projection. What went wrong?
- [ ] Nothing: the scalar projection is always $\mathbf{u}\cdot\mathbf{v}$.
- [x] $\mathbf{v}$ has length 5, not 1, so the answer is 5 times too big; divide by $\lVert \mathbf{v} \rVert$.
- [ ] The scalar projection should be divided by $\lVert \mathbf{u} \rVert$.
> $\operatorname{comp}_{\mathbf{v}}(\mathbf{u}) = \mathbf{u}\cdot\mathbf{v}/\lVert \mathbf{v} \rVert$. The shortcut $\mathbf{u}\cdot\hat{\mathbf{v}}$ only works for a unit vector.

? When is the projection error $\lVert \mathbf{e} \rVert$ equal to $\lVert \mathbf{u} \rVert$?
- [ ] When $\mathbf{u}$ lies along the line.
- [x] When $\mathbf{u}$ is orthogonal to the line.
- [ ] Never.
> $\lVert \mathbf{e} \rVert = \lVert \mathbf{u} \rVert\,|\sin\theta|$, which equals $\lVert \mathbf{u} \rVert$ at $\theta = 90^\circ$: the line captures none of $\mathbf{u}$.
:::

## Projecting neural activity onto a task axis

Two neurons are recorded on 40 trials of Stimulus A and 40 trials of Stimulus B. Each trial is one point in a two-neuron state space. The two clouds overlap a little in each neuron on its own, but they are clearly different *as patterns*. Is there one number per trial that captures the difference?

Build a **task axis**: the unit vector from the mean B response to the mean A response,

$$\hat{\mathbf{a}} = \frac{\bar{\mathbf{r}}_A - \bar{\mathbf{r}}_B}{\lVert \bar{\mathbf{r}}_A - \bar{\mathbf{r}}_B \rVert} .$$

Then project every trial onto it. Each trial $\mathbf{r}$ becomes the single number $\mathbf{r}\cdot\hat{\mathbf{a}}$, its coordinate along the axis.

{{ interactive: task-axis | Forty trials of Stimulus A (blue) and forty of Stimulus B (orange) in the state space of two neurons. Turn the axis with the slider or by dragging its end: below, every trial is reduced to its coordinate along the axis. Press "Best axis" to jump to the direction from the mean B response to the mean A response, where the two conditions separate best. }}

With trials stored as the rows of an array of shape (number of trials, number of neurons), every coordinate is computed in one line. Here the axis is $(0.804,\ -0.594)$: neuron 1 fires more for A, neuron 2 more for B.

```python
task_axis = normalise(trials_A.mean(axis=0) - trials_B.mean(axis=0))
print(task_axis)                  # -> [ 0.804 -0.594]
coords_A = trials_A @ task_axis   # (40, 2) @ (2,) -> (40,): one dot product per trial
```

`trials_A @ task_axis` computes forty dot products at once, one per row. "One dot product per row" is precisely a matrix–vector product, the subject of Lesson 4.

::: keypoint
A scalar projection turns a many-neuron response into one interpretable number: "how far along the A-versus-B direction was this trial?". This is the core idea behind many population analyses, from choice axes to the dimensionality-reduction methods of Lesson 7 (Cunningham and Yu, 2014).
:::

::: pitfall
The axis is a modelling choice. A different pair of conditions defines a different axis and different coordinates. And a clean separation along an axis shows the information is *present* in the population; it does not show that the brain *reads it out* along that axis.
:::

## Weighted sums and bias: the first linear stage of a neuron

The dot product section computed a neuron's total weighted input. Simple neuron models add one more number, a **bias** $b$:

$$z = \mathbf{w}\cdot\mathbf{x} + b = \sum_{i=1}^{n} w_ix_i + b .$$

The bias shifts the total up or down whatever the inputs are, rather like a resting level of excitability. It is not one of the products in the sum.

::: example Worked example: five inputs and a bias
$\mathbf{x}=(12,\ 30,\ 5,\ 20,\ 8)$ spikes/s, $\mathbf{w}=(0.6,\ -0.4,\ 0,\ 0.9,\ -0.2)$ and $b=3$ spikes/s.

The contributions are $7.2,\ -12,\ 0,\ 18,\ -1.6$. Their sum is $\mathbf{w}\cdot\mathbf{x}=11.6$, so $z = 11.6 + 3 = 14.6$ spikes/s.
:::

{{ figure: cell064_1.svg | The contributions of the five inputs, plus the bias (purple), adding up to z = 14.6 spikes/s (dashed line). Blue bars push z up, vermilion bars pull it down. From the teaching notebook. }}

### Linear or affine?

In mathematics a function $f$ is **linear** when $f(\mathbf{x}+\mathbf{y}) = f(\mathbf{x})+f(\mathbf{y})$ and $f(c\mathbf{x}) = c f(\mathbf{x})$. By the rules of the dot product, $\mathbf{x}\mapsto\mathbf{w}\cdot\mathbf{x}$ is linear. Adding a bias breaks this: with $b\neq 0$, doubling every input does *not* double $z$, and a silent input ($\mathbf{x}=\mathbf{0}$) still gives $z=b$. A linear function plus a constant is called **affine**.

A useful trick tucks the bias inside the dot product. Append a constant $1$ to the inputs and the bias to the weights:

$$\tilde{\mathbf{x}} = (x_1,\dots,x_n,\ 1), \qquad \tilde{\mathbf{w}} = (w_1,\dots,w_n,\ b), \qquad \tilde{\mathbf{w}}\cdot\tilde{\mathbf{x}} = \mathbf{w}\cdot\mathbf{x} + b .$$

This "column of ones" is exactly how an intercept enters the design matrix of linear regression in Lesson 5.

### The weight vector as a preferred direction

Now read the formula geometrically. Hold the input's strength fixed at $\lVert \mathbf{x} \rVert$ and rotate its direction, writing $\mathbf{x}(\phi)=\lVert \mathbf{x} \rVert(\cos\phi,\ \sin\phi)$, with the weight vector pointing at angle $\phi_w$. By the geometric formula,

$$z(\phi) = \mathbf{w}\cdot\mathbf{x}(\phi) = \lVert \mathbf{w} \rVert\,\lVert \mathbf{x} \rVert\cos(\phi-\phi_w).$$

The neuron responds most when the input points along $\mathbf{w}$, not at all when the input is orthogonal to it, and most negatively when the input points the opposite way. The weight vector is the neuron's **preferred direction**, and the curve $z(\phi)$ is a **cosine tuning curve**.

{{ interactive: tuning | A dot-product neuron. Drag the green weight vector w to set its preferred direction; press Play (or use the slider) to sweep the input x (blue) round the circle. On the right, the neuron's input z traces a cosine that peaks where x points along w. }}

::: note Why it is true: the tuning formula, from coordinates
With $\mathbf{w}=\lVert \mathbf{w} \rVert(\cos\phi_w,\ \sin\phi_w)$,

$$\mathbf{w}\cdot\mathbf{x}(\phi) = \lVert \mathbf{w} \rVert\lVert \mathbf{x} \rVert\big(\cos\phi_w\cos\phi + \sin\phi_w\sin\phi\big) = \lVert \mathbf{w} \rVert\lVert \mathbf{x} \rVert\cos(\phi-\phi_w),$$

using the angle-difference identity $\cos(\alpha-\beta)=\cos\alpha\cos\beta+\sin\alpha\sin\beta$. It agrees with the geometric formula, as it must.
:::

This is not only a textbook idea. Neurons in primate motor cortex fire in a way that is well described by cosine tuning to the direction of an arm movement (Georgopoulos et al., 1982).

::: pitfall
Real tuning curves have a baseline rate, cannot go below zero, saturate, and are noisy. A positive model weight is not automatically an excitatory synapse, nor a negative weight an inhibitory one. The dot product describes only the *linear* part of a neuron's computation. The nonlinear stage that follows, $f(\mathbf{w}\cdot\mathbf{x}+b)$, is introduced in Lesson 4.
:::

## The same computation in a linear classifier

A **linear classifier** scores an observation $\mathbf{x}$ with $z=\mathbf{w}\cdot\mathbf{x}+b$ and predicts class 1 if $z>0$, class 0 otherwise. It is the neuron of the previous section with a threshold, and it is the oldest learning machine there is: Rosenblatt's perceptron (1958) was exactly this rule. Everything in this lesson explains what it does geometrically.

{{ interactive: classifier | A linear classifier on two simulated features: circles are class 1, squares class 0. Drag the tip of w to turn the boundary (black line), and move the bias b to slide it parallel to itself; the boundary is always at right angles to w. Click a trial to see its score and its signed distance from the boundary (purple). }}

::: note Why it is true: three facts about the boundary w · x + b = 0
**It is orthogonal to $\mathbf{w}$.** Take two points $\mathbf{x}_1$ and $\mathbf{x}_2$ on the boundary. Subtracting $\mathbf{w}\cdot\mathbf{x}_1+b=0$ from $\mathbf{w}\cdot\mathbf{x}_2+b=0$ gives $\mathbf{w}\cdot(\mathbf{x}_2-\mathbf{x}_1)=0$: every direction along the boundary is orthogonal to $\mathbf{w}$.

**The score measures distance.** Split $\mathbf{x}=\mathbf{x}_0 + d\,\hat{\mathbf{w}}$, where $\mathbf{x}_0$ is the nearest boundary point and $d$ the signed distance. Then $\mathbf{w}\cdot\mathbf{x}+b = (\mathbf{w}\cdot\mathbf{x}_0+b) + d\,\mathbf{w}\cdot\hat{\mathbf{w}} = 0 + d\lVert \mathbf{w} \rVert$, so

$$d = \frac{\mathbf{w}\cdot\mathbf{x}+b}{\lVert \mathbf{w} \rVert}.$$

It is a scalar projection onto $\hat{\mathbf{w}}$, shifted by $b/\lVert \mathbf{w} \rVert$.

**The bias slides; the weights turn.** At $\mathbf{x}=\mathbf{0}$ the signed distance is $b/\lVert \mathbf{w} \rVert$, so the boundary sits $-b/\lVert \mathbf{w} \rVert$ from the origin along $\hat{\mathbf{w}}$. Changing $b$ moves the boundary parallel to itself; changing the direction of $\mathbf{w}$ turns it. Multiplying both $\mathbf{w}$ and $b$ by the same $c>0$ changes every score but not the boundary.
:::

The task axis of the previous section is already a classifier. Take $\mathbf{w}=\hat{\mathbf{a}}$ and choose the bias so the boundary passes through the midpoint $\mathbf{m}$ of the two condition means, $b=-\mathbf{m}\cdot\hat{\mathbf{a}} = -5.67$ spikes/s. Then $z>0$ means "closer to A along the axis". On 80 new trials that were not used to build it, it decodes the stimulus correctly 98% of the time.

{{ figure: cell082_1.svg | The task-axis decoder applied to 80 new trials. Each bar counts trials with a given score z; new Stimulus A trials are blue and new Stimulus B trials orange, and the black line is the decision boundary z = 0. From the teaching notebook. }}

::: note In practice
Accuracy measured on the same trials used to choose the axis is optimistic, because the axis was tuned to those trials' noise. The notebook therefore tests on fresh trials. Lesson 5 makes this train/test separation systematic.
:::

::: quiz
? A classifier has $\mathbf{w}=(3,\ 4)$ and $b=-10$. What is the signed distance of the point $(4,\ 2)$ from the boundary?
- [ ] 10
- [x] 2
- [ ] −2
- [ ] 0.4
> $d=(\mathbf{w}\cdot\mathbf{x}+b)/\lVert \mathbf{w} \rVert = (12+8-10)/5 = 2$. It is positive, so the point is classified as class 1.

? You double both $\mathbf{w}$ and $b$. What happens?
- [ ] The boundary moves twice as far from the origin.
- [ ] The boundary turns by 90°.
- [x] The boundary stays put; every score doubles.
> The boundary is where $\mathbf{w}\cdot\mathbf{x}+b=0$, and multiplying both sides by 2 does not change where that holds. The scores $z$ double, but the signed distances $z/\lVert \mathbf{w} \rVert$ do not.
:::

## Real data: a visual neuron's weights, found by projection

The neuron model $\mathbf{w}\cdot\mathbf{x}+b$ responds most to inputs that point along its weight vector. This section measures the weight vectors of real neurons with projections, and then turns the result around: projecting a population response back onto the weights *decodes* the input.

**The data.** A mouse faced three screens. On each trial a grating could appear on the left screen, the right screen, both or neither, each at a contrast of $0$ (absent), $0.25$, $0.5$ or $1$. Neuropixels probes in the left hemisphere recorded neurons across the brain (Steinmetz et al., 2019; the Neuromatch Academy version of the data, released under CC0). We use the 66 neurons in primary visual cortex (VISp) of one session, and count each neuron's spikes 50–250 ms after the stimulus appears.

The stimulus on a trial is the vector $\mathbf{c}=(c_L,\ c_R)$, and there are $4\times4=16$ possible stimuli. List them in a fixed order, $k=1,\dots,16$. A neuron's **response table** is the vector

$$\mathbf{r}=(r_1,\ \dots,\ r_{16}) \quad\text{spikes/s},$$

whose entry $r_k$ is its mean rate over the trials showing stimulus $k$. Two more vectors of length 16 record the stimuli: $\mathbf{c}_L$ holds each stimulus's left contrast and $\mathbf{c}_R$ its right contrast.

### A full grid of stimuli gives two orthogonal vectors

Centre the two stimulus vectors: $\mathbf{a}=\mathbf{c}_L-\bar c\,\mathbf{1}$ and $\mathbf{s}=\mathbf{c}_R-\bar c\,\mathbf{1}$, where $\bar c=0.4375$ is the mean of the four levels $0,\ 0.25,\ 0.5,\ 1$ and $\mathbf{1}=(1,\dots,1)$. Everything in this section rests on one fact.

::: keypoint
Because every left contrast is paired with every right contrast exactly once,

$$\mathbf{a}\cdot\mathbf{1}=\mathbf{s}\cdot\mathbf{1}=0, \qquad \mathbf{a}\cdot\mathbf{s}=0, \qquad \mathbf{a}\cdot\mathbf{a}=\mathbf{s}\cdot\mathbf{s}=2.1875 .$$
:::

::: note Why it is true: the four dot products
Index the stimuli by the pair $(i,j)$: left level $x_i$ and right level $x_j$, with $x_1,\dots,x_4 = 0,\ 0.25,\ 0.5,\ 1$. Then $a_{ij}=x_i-\bar c$ and $s_{ij}=x_j-\bar c$.

- **Sums.** $\sum_{i,j}a_{ij}=4\sum_i(x_i-\bar c)=0$, because deviations from a mean add to zero. Likewise for $\mathbf{s}$.
- **Cross term.** $\mathbf{a}\cdot\mathbf{s}=\sum_i\sum_j(x_i-\bar c)(x_j-\bar c)=\big(\sum_i(x_i-\bar c)\big)\big(\sum_j(x_j-\bar c)\big)=0\times0=0$. The double sum factorises only because every pair $(i,j)$ appears once: this is why balanced experimental designs are so convenient.
- **Squares.** $\mathbf{a}\cdot\mathbf{a}=4\sum_i(x_i-\bar c)^2$, and the deviations $-0.4375,\ -0.1875,\ 0.0625,\ 0.5625$ give $4\times0.546875=2.1875$.
:::

### Fitting the weights with two projections

The dot-product neuron with input $\mathbf{c}_k-\bar{\mathbf{c}}$ predicts

$$r_k = b + w_L\,a_k + w_R\,s_k, \qquad\text{that is,}\qquad \mathbf{r}=b\,\mathbf{1}+w_L\,\mathbf{a}+w_R\,\mathbf{s},$$

with baseline $b$ (spikes/s) and **weight vector** $\mathbf{w}=(w_L,\ w_R)$ in spikes/s per unit contrast. Its direction says which side the neuron prefers ($0^\circ$ left only, $90^\circ$ right only); its length says how strongly it responds.

::: keypoint
Let $\mathbf{d}=\mathbf{r}-\bar r\,\mathbf{1}$ be the centred table. Then

$$b=\bar r, \qquad w_L=\frac{\mathbf{d}\cdot\mathbf{a}}{\mathbf{a}\cdot\mathbf{a}}, \qquad w_R=\frac{\mathbf{d}\cdot\mathbf{s}}{\mathbf{s}\cdot\mathbf{s}} .$$
:::

::: note Why it is true: the fit
**Baseline.** Dot the model with $\mathbf{1}$ and divide by 16: $\bar r=b+w_L(\mathbf{a}\cdot\mathbf{1})/16+w_R(\mathbf{s}\cdot\mathbf{1})/16=b$. So $\mathbf{d}=w_L\mathbf{a}+w_R\mathbf{s}$.

**Weights.** Dot $\mathbf{d}$ with $\mathbf{a}$: $\mathbf{d}\cdot\mathbf{a}=w_L(\mathbf{a}\cdot\mathbf{a})+w_R(\mathbf{s}\cdot\mathbf{a})=w_L(\mathbf{a}\cdot\mathbf{a})$. Likewise for $\mathbf{s}$. Orthogonality is what lets each dot product pick out one weight and ignore the other; each weight is the coefficient of a vector projection.
:::

::: example Worked example: neuron 49
Its mean rate over the 16 stimuli is $b=41.0$ spikes/s, and the centred table gives $\mathbf{d}\cdot\mathbf{a}=6.5$ and $\mathbf{d}\cdot\mathbf{s}=129.4$. So

$$w_L=6.5/2.1875=3.0, \qquad w_R=129.4/2.1875=59.2 \text{ spikes/s per unit contrast},$$

a weight vector of length $59.2$ pointing at $87^\circ$: almost purely right. The model predicts $41.0+3.0(-0.4375)+59.2(-0.4375)=13.8$ spikes/s for a blank screen and $41.0-1.3+59.2(0.5625)=73.0$ for full contrast on the right. The data are $6.6$ and $62.4$: the real neuron reaches 36 spikes/s already at contrast $0.25$ and then flattens, which a straight line cannot do.
:::

{{ interactive: v1-neuron | Real VISp neurons from Steinmetz et al. (2019). Pick a neuron. Left: its mean rate for each of the 16 stimuli, with right contrast across and left contrast up. Middle: its response to the right grating alone (dots) and the fitted dot-product model (line). Right: the weight vectors of all 14 well-fitted neurons, with the chosen one highlighted. }}

### How good is the fit? A projection onto a plane

The centred model $\mathbf{m}=w_L\mathbf{a}+w_R\mathbf{s}$ is the sum of the vector projections of $\mathbf{d}$ onto $\mathbf{a}$ and onto $\mathbf{s}$. Because $\mathbf{a}$ and $\mathbf{s}$ are orthogonal, it is the projection of $\mathbf{d}$ onto the *plane* they span, and the leftover $\mathbf{e}=\mathbf{d}-\mathbf{m}$ is orthogonal to both. The notebook scores the fit with the cosine similarity between data and model, the **fit similarity**.

::: note Why it is true: fit similarity = ‖m‖ / ‖d‖
Since $\mathbf{e}$ is orthogonal to $\mathbf{a}$ and $\mathbf{s}$, it is orthogonal to $\mathbf{m}$, so $\mathbf{d}\cdot\mathbf{m}=(\mathbf{m}+\mathbf{e})\cdot\mathbf{m}=\lVert \mathbf{m} \rVert^2$. Therefore

$$\cos(\mathbf{d},\mathbf{m})=\frac{\lVert \mathbf{m} \rVert^2}{\lVert \mathbf{d} \rVert\,\lVert \mathbf{m} \rVert}=\frac{\lVert \mathbf{m} \rVert}{\lVert \mathbf{d} \rVert},$$

and by Pythagoras $\lVert \mathbf{d} \rVert^2=\lVert \mathbf{m} \rVert^2+\lVert \mathbf{e} \rVert^2$. The squared similarity is the fraction of the table's variation that the model captures. Both vectors are centred, so this is also a correlation.
:::

Neuron 49 scores $0.95$: the model captures about 90% of its variation, and most of the remaining 10% is the saturation. Across all 66 neurons the median is only $0.62$, and 14 neurons exceed $0.8$. Most of the others fire less than 1 spike/s in this window, so their tables are dominated by noise; a few are silent.

**All the arrows point the same way.** The 14 well-fitted weight vectors all point between $55^\circ$ and $109^\circ$ (median $85^\circ$): these neurons respond to the right grating and almost ignore the left. The probes were in the left hemisphere, and each hemisphere's visual cortex represents the opposite (contralateral) side of the visual field. The projections recovered this anatomy from the responses alone. (In motor cortex the same picture shows preferred directions spread around the whole circle; Georgopoulos et al., 1986.)

### Reading out the population by projecting back

Now reverse the question: given a population response, which stimulus produced it? Take $N$ neurons with fitted baselines $\mathbf{b}=(b_1,\dots,b_N)$ and weights. If every neuron followed its model exactly, the population's deviations from baseline on a stimulus $(c_L,\ c_R)$ would be

$$\mathbf{r}-\mathbf{b} = \Delta_L\,\mathbf{w}_L + \Delta_R\,\mathbf{w}_R, \qquad \Delta_L=c_L-\bar c,\quad \Delta_R=c_R-\bar c,$$

where now $\mathbf{w}_L=(w_{L,1},\dots,w_{L,N})$ and $\mathbf{w}_R$ are vectors *over neurons*. Projecting onto $\mathbf{w}_R$ gives the decoder

$$\hat c_R=\bar c+\frac{\mathbf{w}_R\cdot(\mathbf{r}-\mathbf{b})}{\mathbf{w}_R\cdot\mathbf{w}_R} = c_R + \frac{\mathbf{w}_R\cdot\mathbf{w}_L}{\mathbf{w}_R\cdot\mathbf{w}_R}\,\Delta_L .$$

It is exact when $\mathbf{w}_R$ and $\mathbf{w}_L$ are orthogonal; otherwise the left contrast leaks in through the second term.

::: example Worked example: a second mouse (Exercise 7)
In a session of another mouse (162 VISp neurons), the trials of each stimulus are split alternately into a fit half and a test half. Twenty neurons have fit similarity above $0.8$ on the fit half; their weight vectors again point to the right (median $87^\circ$), with $\lVert \mathbf{w}_R \rVert=58.3$ and $\lVert \mathbf{w}_L \rVert=5.9$. The leak factor $\mathbf{w}_R\cdot\mathbf{w}_L/\mathbf{w}_R\cdot\mathbf{w}_R=0.027$ is negligible. On the test half, with nothing on the left, the decoder returns $0.04,\ 0.25,\ 0.52,\ 0.68$ for true right contrasts $0,\ 0.25,\ 0.5,\ 1$. The lower three are close. Full contrast is underestimated by a third, because the neurons saturate and the decoder assumes a straight line.
:::

### Why a short direction gives a noisy readout

Projecting onto $\mathbf{w}_L$ to decode the *left* contrast fails completely: the estimates for $0,\ 0.25,\ 0.5,\ 1$ are $-0.35,\ -0.60,\ -0.21,\ -0.11$. Real responses are the model plus noise, $\mathbf{r}-\mathbf{b}=\Delta_L\mathbf{w}_L+\Delta_R\mathbf{w}_R+\boldsymbol{\varepsilon}$, and the noise enters the estimate as

$$\frac{\mathbf{w}_L\cdot\boldsymbol{\varepsilon}}{\mathbf{w}_L\cdot\mathbf{w}_L} = \frac{\hat{\mathbf{w}}_L\cdot\boldsymbol{\varepsilon}}{\lVert \mathbf{w}_L \rVert} .$$

The numerator is the noise's scalar projection onto a unit vector, which does not depend on $\lVert \mathbf{w}_L \rVert$. The denominator is ten times smaller for $\mathbf{w}_L$ than for $\mathbf{w}_R$, so the same noise produces a ten times larger error. Projecting onto a direction the neurons barely use amplifies noise: a population that ignores the left side cannot report it.

::: pitfall
These decoders use *averages* over the trials of each stimulus; a single trial is much noisier, and some test averages rest on only one or two trials. The 0.8 threshold is arbitrary, the straight-line model ignores saturation, and projection is not the best linear decoder: regression (Lesson 5) does better. Neural responses here also reflect the mouse's movement after the stimulus. A decoder that works shows the information is in the population, not that the brain reads it out this way.
:::

## Lesson summary

- The dot product $\mathbf{u}\cdot\mathbf{v}=\sum_i u_iv_i$ multiplies matching coordinates and adds; its units are the product of the two vectors' units.
- It is symmetric, splits over sums, lets scalars pass through, and $\mathbf{v}\cdot\mathbf{v}=\lVert \mathbf{v} \rVert^2$.
- Expanding $\lVert \mathbf{u}\pm\mathbf{v} \rVert^2=\lVert \mathbf{u} \rVert^2\pm2\,\mathbf{u}\cdot\mathbf{v}+\lVert \mathbf{v} \rVert^2$ links dot products to lengths.
- The same number equals $\lVert \mathbf{u} \rVert\lVert \mathbf{v} \rVert\cos\theta$ (the law of cosines); Cauchy–Schwarz keeps the ratio in $[-1,1]$.
- Orthogonal means $\mathbf{u}\cdot\mathbf{v}=0$; then squared lengths add (Pythagoras); coordinates are dot products with orthogonal unit axes.
- Cosine similarity $=\hat{\mathbf{u}}\cdot\hat{\mathbf{v}}$ compares patterns and ignores strength; on raw firing rates it is always $\ge 0$; mean-centred, it is the Pearson correlation.
- Projection: $t=\mathbf{u}\cdot\mathbf{v}/\mathbf{v}\cdot\mathbf{v}$ makes the residual orthogonal; the projection is the closest point on the line; $\lVert \mathbf{e} \rVert=\lVert \mathbf{u} \rVert\,|\sin\theta|$.
- Projecting trials onto a task axis turns a population response into one number per trial.
- $z=\mathbf{w}\cdot\mathbf{x}+b$ is a neuron's linear input and a classifier's score; $\mathbf{w}$ is a preferred direction and is orthogonal to the decision boundary; $b$ slides the boundary.
- On a full grid of stimuli the centred stimulus vectors are orthogonal, so two projections fit a neuron's weights. Mouse VISp neurons weight the opposite (contralateral) side, and projecting a population response onto those weights decodes the contrast, except along a direction the neurons barely use.

## Exercises

These pen-and-paper exercises complement the coding exercises in the exercise notebook. Try each one before opening its answer.

::: exercise
For $\mathbf{u}=(2,\ -1,\ 3)$ and $\mathbf{v}=(4,\ 0,\ -2)$, compute $\mathbf{u}\cdot\mathbf{v}$, both norms, and the angle between them.
---answer---
**Dot product.** $\mathbf{u}\cdot\mathbf{v}=8+0-6=2$.

**Norms.** $\lVert \mathbf{u} \rVert=\sqrt{4+1+9}=\sqrt{14}=3.742$ and $\lVert \mathbf{v} \rVert=\sqrt{16+0+4}=\sqrt{20}=4.472$.

**Angle.** $\cos\theta=2/\sqrt{280}=0.120$, so $\theta=83.1^\circ$: nearly orthogonal.
:::

::: exercise
Input rates are $\mathbf{x}=(10,\ 20)$ spikes/s and weights are $\mathbf{w}=(0.5,\ 0.1)$ millivolts per spike/s. Compute $\mathbf{w}\cdot\mathbf{x}$ and state its units.
---answer---
$\mathbf{w}\cdot\mathbf{x}=0.5\times10+0.1\times20=5+2=7$.

**Units.** Each term is (mV per spike/s) $\times$ (spikes/s) = mV, so the answer is **7 mV**.
:::

::: exercise
Show that $(\mathbf{u}+\mathbf{v})\cdot(\mathbf{u}-\mathbf{v})=\lVert \mathbf{u} \rVert^2-\lVert \mathbf{v} \rVert^2$. Deduce that if $\lVert \mathbf{u} \rVert=\lVert \mathbf{v} \rVert$, then $\mathbf{u}+\mathbf{v}$ and $\mathbf{u}-\mathbf{v}$ are orthogonal. (Geometrically: the diagonals of a rhombus meet at a right angle.)
---answer---
Multiply out with the rules of the dot product:

$$(\mathbf{u}+\mathbf{v})\cdot(\mathbf{u}-\mathbf{v}) = \mathbf{u}\cdot\mathbf{u}-\mathbf{u}\cdot\mathbf{v}+\mathbf{v}\cdot\mathbf{u}-\mathbf{v}\cdot\mathbf{v} = \lVert \mathbf{u} \rVert^2-\lVert \mathbf{v} \rVert^2,$$

because the middle terms cancel by symmetry.

If the two norms are equal, the right side is $0$, so $\mathbf{u}+\mathbf{v}$ and $\mathbf{u}-\mathbf{v}$ are orthogonal.
:::

::: exercise
Find the value of $k$ that makes $(1,\ k,\ 2)$ orthogonal to $(3,\ -1,\ 1)$.
---answer---
Set the dot product to zero: $3-k+2=0$, so $k=5$.
:::

::: exercise
Compute the cosine similarity of $\mathbf{r}=(10,\ 0,\ 5)$ with $\mathbf{s}=(2,\ 0,\ 1)$, and of $\mathbf{r}$ with $\mathbf{t}=(0,\ 8,\ 0)$. Interpret both numbers as statements about neural activity patterns.
---answer---
**$\mathbf{r}$ and $\mathbf{s}$.** $\mathbf{s}=0.2\,\mathbf{r}$, a positive multiple, so the cosine similarity is **1**: the same pattern, five times weaker.

**$\mathbf{r}$ and $\mathbf{t}$.** $\mathbf{r}\cdot\mathbf{t}=0$, so the cosine similarity is **0**: the two conditions activate entirely different neurons.
:::

::: exercise
Prove that $\lVert \hat{\mathbf{u}}-\hat{\mathbf{v}} \rVert^2 = 2-2\cos(\mathbf{u},\mathbf{v})$, and explain why ranking pairs by cosine similarity gives the same order as ranking them, in reverse, by the distance between their unit vectors.
---answer---
**The identity.** Unit vectors have $\hat{\mathbf{u}}\cdot\hat{\mathbf{u}}=\hat{\mathbf{v}}\cdot\hat{\mathbf{v}}=1$, so expanding the square gives

$$\lVert \hat{\mathbf{u}}-\hat{\mathbf{v}} \rVert^2 = 1-2\,\hat{\mathbf{u}}\cdot\hat{\mathbf{v}}+1 = 2-2\cos(\mathbf{u},\mathbf{v}).$$

**The ranking.** The distance is a decreasing function of the similarity: the more similar a pair, the closer its unit vectors. So the two orderings are reversed copies of each other.
:::

::: exercise
Project $\mathbf{u}=(6,\ 2)$ onto $\mathbf{v}=(1,\ 1)$. Give the scalar projection, the vector projection, the residual and the projection error, and check that the residual is orthogonal to $\mathbf{v}$.
---answer---
$\mathbf{u}\cdot\mathbf{v}=8$ and $\mathbf{v}\cdot\mathbf{v}=2$.

- **Scalar projection:** $8/\sqrt2=5.657$.
- **Vector projection:** $(8/2)\,(1,\ 1)=(4,\ 4)$.
- **Residual:** $\mathbf{e}=(6,\ 2)-(4,\ 4)=(2,\ -2)$.
- **Projection error:** $\lVert \mathbf{e} \rVert=\sqrt8=2.828$.

**Check.** $\mathbf{e}\cdot\mathbf{v}=2-2=0$.
:::

::: exercise
Starting from $\mathbf{u}=\operatorname{proj}_{\mathbf{v}}(\mathbf{u})+\mathbf{e}$, show that $\lVert \mathbf{e} \rVert^2=\lVert \mathbf{u} \rVert^2-(\mathbf{u}\cdot\mathbf{v})^2/\lVert \mathbf{v} \rVert^2$. Explain why this proves the Cauchy–Schwarz inequality a second way.
---answer---
The two pieces are orthogonal, so by Pythagoras $\lVert \mathbf{u} \rVert^2=\lVert \operatorname{proj}_{\mathbf{v}}(\mathbf{u}) \rVert^2+\lVert \mathbf{e} \rVert^2$, and

$$\lVert \operatorname{proj}_{\mathbf{v}}(\mathbf{u}) \rVert^2 = \left(\frac{\mathbf{u}\cdot\mathbf{v}}{\mathbf{v}\cdot\mathbf{v}}\right)^2\lVert \mathbf{v} \rVert^2 = \frac{(\mathbf{u}\cdot\mathbf{v})^2}{\lVert \mathbf{v} \rVert^2}.$$

Rearranging gives the formula. Since $\lVert \mathbf{e} \rVert^2\ge0$, it follows that $(\mathbf{u}\cdot\mathbf{v})^2\le\lVert \mathbf{u} \rVert^2\lVert \mathbf{v} \rVert^2$, which is Cauchy–Schwarz.
:::

::: exercise
A model neuron has $\mathbf{w}=(2,\ -1,\ 0.5)$ and $b=-3$. Compute $z$ for $\mathbf{x}=(4,\ 6,\ 2)$. Which single input, increased by 1 spike/s, would raise $z$ the most, and by how much?
---answer---
$z=8-6+1-3=0$: the neuron sits exactly on its threshold.

Increasing input $i$ by 1 spike/s changes $z$ by $w_i$. Input 1 has the largest weight, so raising it by 1 spike/s raises $z$ by **2**.
:::

::: exercise
A classifier has $\mathbf{w}=(3,\ 4)$ and $b=-10$. Find the distance from the origin to the boundary, and the signed distance of the point $\mathbf{x}=(4,\ 2)$. Which class is predicted? What happens to the boundary, and to the scores, if both $\mathbf{w}$ and $b$ are doubled?
---answer---
$\lVert \mathbf{w} \rVert=5$.

- **Origin to boundary:** $|{-10}|/5=2$.
- **Signed distance of $\mathbf{x}$:** $(12+8-10)/5=2$. It is positive, so the classifier predicts **class 1**.
- **Doubling $\mathbf{w}$ and $b$:** the boundary does not move, and every score doubles.
:::

::: exercise
Prove that if two vectors have only nonnegative entries, the angle between them is at most $90^\circ$. When exactly is it $90^\circ$? What does that mean for two population responses?
---answer---
Every product $u_iv_i\ge0$, so the dot product, and hence $\cos\theta$, is $\ge 0$, and $\theta\le90^\circ$.

It is exactly $90^\circ$ only if $u_iv_i=0$ for every $i$: no neuron is active in both conditions. The two responses use completely separate sets of neurons.
:::

::: exercise
Two condition means are $\bar{\mathbf{r}}_A=(30,\ 18)$ and $\bar{\mathbf{r}}_B=(18,\ 28)$ spikes/s. Build the unit task axis and the midpoint bias $b=-\mathbf{m}\cdot\hat{\mathbf{a}}$. Classify the trial $\mathbf{r}=(26,\ 20)$.
---answer---
**Task axis.** $\bar{\mathbf{r}}_A-\bar{\mathbf{r}}_B=(12,\ -10)$, of length $15.62$, so $\hat{\mathbf{a}}=(0.768,\ -0.640)$.

**Bias.** The midpoint is $\mathbf{m}=(24,\ 23)$, so $b=-(18.44-14.72)=-3.71$.

**The trial.** $z=\hat{\mathbf{a}}\cdot\mathbf{r}+b=19.97-12.80-3.71=3.46>0$, so the trial is classified as **A**.
:::

::: exercise
*(Challenge.)* Show that the Pearson correlation of the coordinates of $\mathbf{u}$ and $\mathbf{v}$ equals the cosine similarity of the mean-centred vectors. Then explain why, with only two neurons, mean-centred cosine similarity can only ever be $+1$ or $-1$ (or undefined).
---answer---
**The identity.** Write $\tilde u_i=u_i-\bar u$ and $\tilde v_i=v_i-\bar v$. The Pearson formula is

$$\frac{\sum_i\tilde u_i\tilde v_i}{\sqrt{\sum_i\tilde u_i^2}\,\sqrt{\sum_i\tilde v_i^2}} = \cos(\tilde{\mathbf{u}},\tilde{\mathbf{v}}).$$

**Two neurons.** With two coordinates, a mean-centred vector has the form $(c,\ -c)$, so every one lies on the same line through the origin. Any two are either parallel ($+1$), opposite ($-1$), or one is zero (undefined). This is why the notebooks only mean-centre with more than two neurons.
:::

::: exercise
A $2\times2$ contrast grid has stimuli $(c_L,c_R)=(0,0),\ (0,1),\ (1,0),\ (1,1)$. Write down the centred vectors $\mathbf{a}$ and $\mathbf{s}$ and check that they are orthogonal. A neuron's response table is $\mathbf{r}=(5,\ 25,\ 7,\ 27)$ spikes/s. Find $b$, $w_L$, $w_R$, the direction of $\mathbf{w}$ and the fit similarity. Then show that if noise $\boldsymbol{\varepsilon}$ with independent entries of standard deviation $\sigma$ is added to a population response, the projection decoder's error has standard deviation $\sigma/\lVert \mathbf{w} \rVert$.
---answer---
**The centred vectors.** $\bar c=0.5$, so $\mathbf{a}=(-0.5,\ -0.5,\ 0.5,\ 0.5)$ and $\mathbf{s}=(-0.5,\ 0.5,\ -0.5,\ 0.5)$. Then $\mathbf{a}\cdot\mathbf{s}=0.25-0.25-0.25+0.25=0$, and $\mathbf{a}\cdot\mathbf{a}=\mathbf{s}\cdot\mathbf{s}=1$.

**The fit.** $b=\bar r=16$ and $\mathbf{d}=(-11,\ 9,\ -9,\ 11)$, so

- $w_L=\mathbf{d}\cdot\mathbf{a}=5.5-4.5-4.5+5.5=2$ spikes/s per unit contrast;
- $w_R=\mathbf{d}\cdot\mathbf{s}=5.5+4.5+4.5+5.5=20$ spikes/s per unit contrast;
- the direction is $\arctan(20/2)=84.3^\circ$, mostly right.

The model $2\mathbf{a}+20\mathbf{s}=(-11,\ 9,\ -9,\ 11)$ equals $\mathbf{d}$ exactly, so the fit similarity is **1**.

**The noise.** The decoder's error is $\mathbf{w}\cdot\boldsymbol{\varepsilon}/\lVert \mathbf{w} \rVert^2$. The sum $\mathbf{w}\cdot\boldsymbol{\varepsilon}=\sum_iw_i\varepsilon_i$ has variance $\sum_iw_i^2\sigma^2=\sigma^2\lVert \mathbf{w} \rVert^2$, because variances of independent terms add (Lesson 17). So the error has standard deviation $\sigma\lVert \mathbf{w} \rVert/\lVert \mathbf{w} \rVert^2=\sigma/\lVert \mathbf{w} \rVert$.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has seven graded exercises worth 100 points, plus a bonus, including a real-data exercise that decodes contrast from mouse visual cortex. Both open in Google Colab.

{{ colab: week1/lesson2/Lesson2_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week1/lesson2/Lesson2_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Introduction to Linear Algebra*, 6th ed., Wellesley–Cambridge Press, 2023. Chapter 1 covers dot products, lengths and angles.
- A. P. Georgopoulos, J. F. Kalaska, R. Caminiti and J. T. Massey, "On the relations between the direction of two-dimensional arm movements and cell discharge in primate motor cortex", *Journal of Neuroscience* 2(11):1527–1537, 1982.
- A. P. Georgopoulos, A. B. Schwartz and R. E. Kettner, "Neuronal population coding of movement direction", *Science* 233(4771):1416–1419, 1986.
- N. Kriegeskorte, M. Mur and P. Bandettini, "Representational similarity analysis: connecting the branches of systems neuroscience", *Frontiers in Systems Neuroscience* 2:4, 2008.
- J. P. Cunningham and B. M. Yu, "Dimensionality reduction for large-scale neural recordings", *Nature Neuroscience* 17:1500–1509, 2014.
- F. Rosenblatt, "The perceptron: a probabilistic model for information storage and organization in the brain", *Psychological Review* 65(6):386–408, 1958.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the real-data recordings (released under CC0; the subsets used here are in the course repository's `data/` folder).
