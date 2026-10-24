---
summary: "How a change travels through a network: the chain rule, computation graphs and backpropagation, the gradients of a layer, gradient checking, vanishing and exploding gradients, and a hand-written backward pass that trains a decoder of real motor cortex."
---

::: objectives
- The chain rule for compositions, why it holds, and how local derivatives multiply along a chain
- Computation graphs, the forward pass, and reverse accumulation (backpropagation), including fan-out
- Why reverse mode computes all parameter gradients for about the cost of one extra forward pass
- The gradients of an affine layer (outer products, transposed weights) and of elementwise activations, for a batch
- Gradient checking with central differences
- Why products of many derivatives vanish or explode, and the remedies: ReLU, initialisation, residual connections
- How a hand-written backward pass trains a network to decode wheel velocity from mouse motor cortex, and what input gradients reveal about it
:::

**Before you start.** This reading is the mathematical companion to the Lesson 10 teaching notebook. You need Lesson 9 (derivatives, the linear approximation, activation derivatives and central differences), matrix products, transposes and outer products (Lessons 3–4), and the spectral radius (Lesson 6). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $f\circ g$ | composition, $f(g(x))$ |
| $\partial L/\partial w$ | partial derivative: the derivative with respect to $w$, with the other variables held fixed |
| $\mathbf{z}=\mathbf{W}\mathbf{a}+\mathbf{b}$, $\mathbf{a}'=\phi(\mathbf{z})$ | a layer: an affine map, then an activation |
| $\boldsymbol\delta=\partial L/\partial\mathbf{z}$ | the error signal at a layer's pre-activations |
| $\mathbf{A}$, $\mathbf{Z}$, $\boldsymbol\Delta$ | the same for a batch, one example per row |
| $\odot$ | elementwise product |

## The problem: nudging a synaptic weight

A model neuron with input $x$, synaptic weight $w$ and bias $b$ fires at $r=r_{\max}\sigma(z)$, with $z=wx+b$. A change of $w$ reaches the rate *through* $z$:

$$\frac{dr}{dw}=\frac{dr}{dz}\cdot\frac{dz}{dw}=r_{\max}\sigma'(z)\,x .$$

With $r_{\max}=50$ spikes/s, $x=2$ and $b=-3$, this is 10.5, 25.0 and 4.5 spikes/s per unit weight at $w=0.5$, 1.5 and 3: large only where the sigmoid is in its sensitive range. A plastic synapse onto a saturated neuron barely changes its output.

{{ interactive: chain-neuron | The two links of the chain and their composition. Move the weight: the orange tangents show each link's local slope, and the slope of the whole chain (right) is their product. The purple dashed curve on the right is dr/dw at every weight. }}

## The chain rule

::: keypoint
If $y=f(u)$ and $u=g(x)$, then

$$\frac{dy}{dx}=\frac{dy}{du}\cdot\frac{du}{dx}=f'\big(g(x)\big)\,g'(x).$$

For longer chains the local derivatives multiply: $\big(f(g(h(x)))\big)'=f'(g(h(x)))\,g'(h(x))\,h'(x)$. Units cancel link by link.
:::

::: note Why it is true: the chain rule
Write $\Delta u=g(x+\Delta x)-g(x)$. If $\Delta u\neq0$,

$$\frac{f(g(x+\Delta x))-f(g(x))}{\Delta x}=\frac{f(u+\Delta u)-f(u)}{\Delta u}\cdot\frac{\Delta u}{\Delta x}.$$

As $\Delta x\to0$, $\Delta u\to0$ (because $g$ is continuous), so the first factor tends to $f'(u)$ and the second to $g'(x)$. (The case $\Delta u=0$ for some small $\Delta x$ needs a small extra argument found in any calculus text; the result is the same.)

In the language of Lesson 9, each link scales a small nudge by its local slope: $\Delta y\approx f'(u)\Delta u\approx f'(u)g'(x)\Delta x$.
:::

Examples:

- $(e^{-t/\tau})'=-\frac1\tau e^{-t/\tau}$;
- $(\sin\omega t)'=\omega\cos\omega t$;
- $\frac{d}{dx}\sigma(wx+b)=w\,\sigma(1-\sigma)$;
- $(\ln(1+e^x))'=\sigma(x)$;
- $\big(e^{\sin(x^2)}\big)'=e^{\sin(x^2)}\cos(x^2)\,2x$.

All agree with central differences to better than $10^{-7}$ in the notebook.

::: keypoint
**One flat link stalls the chain.** The derivative is a product, so it is small if any factor is small, however large the others: a saturated activation, a near-zero weight, or a $\cos u\approx0$ in the middle of a chain.
:::

{{ interactive: chain-links | The three-link chain $y=e^{\sin(x^2)}$. The bars are the three local slopes and their product, which is the slope of the blue tangent. Press Play: wherever cos(x²) passes through zero, the whole derivative drops to zero with it. }}

::: quiz
? What is $\frac{d}{dx}e^{3x^2}$?
- [ ] $e^{3x^2}$
- [ ] $3x^2e^{3x^2}$
- [x] $6x\,e^{3x^2}$
- [ ] $6x\,e^{6x}$
> Outer derivative $e^{u}$ evaluated at $u=3x^2$, times the inner derivative $6x$.

? In a chain of five links, four local slopes are about 3 and one is 0.001. What is the overall slope, roughly?
- [ ] about 12
- [ ] about 3
- [x] about 0.08
> $3^4\times0.001=0.081$. One flat link drags the whole product down.
:::

## Computation graphs and reverse accumulation

A formula is a **computation graph**: nodes are elementary operations, and edges carry values. For the neuron's loss on one example, $z=wx+b$, $r=r_{\max}\sigma(z)$, $L=\tfrac12(r-y)^2$.

::: definition Definition: backpropagation (reverse accumulation)
**Forward pass**: evaluate the nodes from the inputs to the output, storing every intermediate value.

**Backward pass**: set $\partial L/\partial L=1$; visit the nodes in reverse order; at each node multiply the incoming (upstream) derivative by the node's local derivative and pass it to the node's inputs.

A value used by several nodes (**fan-out**) receives the **sum** of the derivatives arriving along all paths.
:::

For the example:

$$\frac{\partial L}{\partial r}=r-y,\quad
\frac{\partial L}{\partial z}=(r-y)\,r_{\max}\sigma'(z),\quad
\frac{\partial L}{\partial w}=\frac{\partial L}{\partial z}\,x,\quad
\frac{\partial L}{\partial b}=\frac{\partial L}{\partial z}.$$

With $w=1.2$, $b=-1$, $x=2$ and $y=30$: $r=40.1$, $\partial L/\partial z=80.2$, $\partial L/\partial w=160.4$ and $\partial L/\partial b=80.2$, matching central differences.

{{ interactive: backprop-graph | The computation graph of one neuron's loss. Step through the forward pass (values, in black, flow left to right) and then the backward pass (derivatives, in orange, flow right to left, multiplied at each node by its local derivative). The readout checks the result against a central difference; change w and step through again. }}

::: note Why it is true: fan-out sums
If $L$ depends on $a$ through two intermediate values, $L=F(u(a),v(a))$, a small change $\Delta a$ changes $u$ by about $u'\Delta a$ and $v$ by about $v'\Delta a$, and each changes $L$ (the linear approximation for a function of two variables, Lesson 14): $\Delta L\approx\frac{\partial F}{\partial u}u'\Delta a+\frac{\partial F}{\partial v}v'\Delta a$. The contributions of the two paths add.

Example: $f=a^2+2a$ uses $a$ in two places, and $f'(a)=2a+2$. At $a=3$ the notebook's engine accumulates $6+2=8$.
:::

**Automatic differentiation.** PyTorch, JAX and TensorFlow record each operation's inputs and local derivative during the forward pass, and run the backward pass automatically. The notebook builds a 40-line scalar version (in the spirit of A. Karpathy's *micrograd*). Every backward rule uses `+=`, which implements fan-out.

::: keypoint
**Why reverse mode.** With $P$ parameters, finite differences need about $P$ extra evaluations of the loss. Reverse accumulation obtains all $P$ partial derivatives in one backward pass, at a cost comparable to one forward pass, because every shared upstream derivative is computed once and reused. In the notebook, for a network with 1680 parameters, backpropagation takes 0.3 ms against 0.4 s for finite differences, and the two agree to $5\times10^{-11}$.
:::

## Backpropagation through layers

::: keypoint
For a layer $\mathbf{z}=\mathbf{W}\mathbf{a}+\mathbf{b}$ ($\mathbf{W}$ of shape $(n_{\text{out}},n_{\text{in}})$) with upstream gradient $\boldsymbol\delta=\partial L/\partial\mathbf{z}$:

$$\frac{\partial L}{\partial\mathbf{W}}=\boldsymbol\delta\,\mathbf{a}^{\mathsf T},\qquad
\frac{\partial L}{\partial\mathbf{b}}=\boldsymbol\delta,\qquad
\frac{\partial L}{\partial\mathbf{a}}=\mathbf{W}^{\mathsf T}\boldsymbol\delta .$$

Through an elementwise activation $\mathbf{a}'=\phi(\mathbf{z})$: $\dfrac{\partial L}{\partial\mathbf{z}}=\dfrac{\partial L}{\partial\mathbf{a}'}\odot\phi'(\mathbf{z})$.

For a batch stored as rows, $\partial L/\partial\mathbf{W}=\boldsymbol\Delta^{\mathsf T}\mathbf{A}$, $\partial L/\partial\mathbf{b}$ is the column sums of $\boldsymbol\Delta$, and $\partial L/\partial\mathbf{A}=\boldsymbol\Delta\mathbf{W}$.
:::

::: note Why it is true: the three layer gradients
Entry by entry, $z_i=\sum_jW_{ij}a_j+b_i$. Only $z_i$ depends on $W_{ij}$, with $\partial z_i/\partial W_{ij}=a_j$, so $\partial L/\partial W_{ij}=\delta_ia_j$: the matrix of all these is the outer product $\boldsymbol\delta\mathbf{a}^{\mathsf T}$ (Lesson 4). Likewise $\partial z_i/\partial b_i=1$.

Each $a_j$ feeds every $z_i$ (fan-out), so $\partial L/\partial a_j=\sum_i\delta_iW_{ij}=(\mathbf{W}^{\mathsf T}\boldsymbol\delta)_j$.

For the activation, $a'_i$ depends only on $z_i$, so the chain rule acts unit by unit: $\partial L/\partial z_i=(\partial L/\partial a'_i)\,\phi'(z_i)$.

With a batch, the loss is a sum (or mean) over examples, so the weight and bias gradients add over rows; stacking the per-example formulas as rows gives the matrix forms.
:::

{{ interactive: layer-grad | The gradients of one linear layer. Change the input activity a and the error signal δ: each weight's gradient is (error at its target) × (activity at its source), the outer product δaᵀ; the error passed back to the inputs is Wᵀδ. Blue cells are positive, vermilion negative. }}

The outer product $\boldsymbol\delta\mathbf{a}^{\mathsf T}$ has the form of Hebb's rule (postsynaptic factor times presynaptic activity), with an *error* in place of the postsynaptic activity. The backward pass sends error signals through $\mathbf{W}^{\mathsf T}$: the forward weights, used backwards.

::: note In practice
**Gradient checking.** Perturb each parameter by $\pm10^{-5}$, recompute the loss, and compare $(L_+-L_-)/(2\times10^{-5})$ with the backward pass, using the relative error $\lvert g_{\text{num}}-g_{\text{bp}}\rvert/(\lvert g_{\text{num}}\rvert+\lvert g_{\text{bp}}\rvert)$.

In the notebook, a three-layer network passes for all 47 parameters with relative error $4\times10^{-9}$. Values above about $10^{-4}$ indicate a bug, unless a ReLU input lies within $10^{-5}$ of zero, where the central difference straddles the corner.
:::

::: quiz
? A layer has $\mathbf{W}$ of shape $(32, 437)$. What shape is $\partial L/\partial\mathbf{W}$?
- [ ] $(437, 32)$
- [x] $(32, 437)$
- [ ] $(32,)$
> A gradient always has the shape of the thing it is the gradient of. Here it is the outer product of a 32-vector $\boldsymbol\delta$ and a 437-vector $\mathbf{a}$.

? The error signal reaching a layer's inputs is…
- [ ] $\mathbf{W}\boldsymbol\delta$
- [x] $\mathbf{W}^{\mathsf T}\boldsymbol\delta$
- [ ] $\boldsymbol\delta\mathbf{a}^{\mathsf T}$
> Each input feeds every output, so its error is a sum over outputs, weighted by the same weights: the transpose.
:::

## Vanishing and exploding gradients

::: keypoint
Backpropagating through $L$ layers multiplies $L$ factors, each a transposed weight matrix scaled by activation slopes:

$$\boldsymbol\delta_1=\big(\mathbf{W}_2^{\mathsf T}\cdots(\mathbf{W}_L^{\mathsf T}\boldsymbol\delta_L\odot\phi'(\mathbf{z}_{L-1}))\cdots\big)\odot\phi'(\mathbf{z}_1).$$

If the typical factor is below 1, the error signal shrinks geometrically (**vanishing**); above 1, it grows (**exploding**). Sigmoid slopes are at most $\tfrac14$, so sigmoid networks vanish unless their weights are large, and large weights saturate the units.
:::

::: note Why it is true: the geometric growth or decay
In one dimension, with weight $w$ and slope $\phi'$ at every layer, $\delta_1=(w\phi')^{L-1}\delta_L$, which tends to 0 or grows without bound as $L$ grows, unless $\lvert w\phi'\rvert=1$.

With matrices, the size of $\boldsymbol\delta$ is multiplied at each layer by a factor between the smallest and largest stretch of the matrix $\operatorname{diag}(\phi')\mathbf{W}^{\mathsf T}$. For random $\mathbf{W}$ with entries of variance $c/n$, a unit vector is stretched on average by about $\sqrt{c}$ times the typical slope. This is why initialisation sets the variance to $1/n_{\text{in}}$ for tanh (Xavier/Glorot) and to $2/n_{\text{in}}$ for ReLU (He: half of the ReLU units are inactive, which halves the variance).
:::

In the notebook's 12-layer networks with standard initialisation, the error signal at the first layer is $10^{-7}$ of that at the last for sigmoid, 0.24 for tanh and 0.6 for ReLU. Scaling the ReLU weights by 0.5, 0.7, 1.4 or 2 gives $3\times10^{-4}$, $10^{-2}$, 24 and $1.2\times10^3$.

{{ interactive: vanishing | The size of the error signal at each layer of a random 12-layer network (64 units wide, computed in your browser), relative to the last layer, on a log scale. Pick an activation and scale the weights away from the standard initialisation: the signal vanishes or explodes geometrically. }}

Remedies keep each factor near 1: ReLU activations, careful initialisation, residual connections $\mathbf{a}_{k+1}=\mathbf{a}_k+f(\mathbf{a}_k)$, normalisation layers, gradient clipping, and gated recurrent units.

**Recurrent networks.** Backpropagation through time multiplies by (roughly) the same $\mathbf{W}^{\mathsf T}$ at every step, so gradients over $T$ steps scale like $\rho(\mathbf{W})^T$ (Lesson 6). Long-range dependencies are hard to learn unless the relevant modes have eigenvalues near 1.

{{ interactive: bptt | The simplest recurrent network, $x_{t+1}=w\,x_t$: the gradient over T steps is $w^T$ (log scale). Sweep w through 1 and watch the gradient go from vanishing to exploding. }}

## Mini-lab: a network decoder of motor cortex

**Data.** The recording of Lessons 5–7: 447 neurons in mouse primary motor cortex while the mouse turned a wheel ([Steinmetz et al., 2019](https://doi.org/10.1038/s41586-019-1787-x); data released under CC0).

- **Inputs:** the rates of 437 neurons (ten are silent in the training trials) in 50 ms bins, smoothed over about 50 ms within each trial and standardised with training statistics; shape (17100, 437).
- **Output:** the wheel velocity in the same bin, standardised; shape (17100, 1).
- **Split:** the first 171 trials for training, the other 171 for testing.

The linear least-squares decoder (Lesson 5) reaches a test $R^2$ of 0.756.

**Network.** 437 inputs, 32 tanh units and 1 linear output, with Xavier initialisation. The notebook's own backward pass agrees with central differences on the real data (relative error $3\times10^{-7}$). It is trained by plain gradient descent, $\theta\leftarrow\theta-0.05\,\partial L/\partial\theta$ (Lesson 12 studies this rule).

The test $R^2$ peaks at 0.718 after 400 steps, below the linear decoder's 0.756. By step 1500 the training $R^2$ has risen to 0.947 while the test $R^2$ has fallen to 0.683: overfitting (Lesson 15).

{{ figure: cell031_1.svg | Training (blue) and test (vermilion) R² during gradient descent, with the linear decoder's test R² (black dashed) for comparison. The dotted line marks the best test step, 400. }}

**Input gradients.** Backpropagating the decoded velocity all the way to the inputs gives $\partial\hat v/\partial(\text{rate}_j)$ in every test bin. Its mean over bins correlates 0.88 with the linear decoder's weights: on average the network relies on much the same neurons, with the same signs.

The sensitivity varies from bin to bin as hidden units move along their tanh curves. The average pattern is almost identical while the wheel turns fast and while it is still (correlation 0.99), but about a third smaller during fast turns, because hidden units are more saturated then (mean tanh slope 0.46 against 0.67). This network is largely linear in what it uses, which helps explain why it cannot beat the linear decoder.

{{ figure: cell033_1.svg | Left: the network's mean input sensitivity for each neuron against the linear decoder's weight for it. Right: how the sensitivity varies from bin to bin for the 12 most influential neurons (box plots). }}

**Depth on real inputs.** In 10-hidden-layer networks of width 64 on these inputs at initialisation, the first layer's weight gradient is $1.1\times10^{-6}$ of the last layer's for sigmoid, but 2.1 for tanh and 0.27 for ReLU.

{{ figure: cell035_1.svg | Weight-gradient norms per layer for deep decoders of the real data at initialisation (log scale): sigmoid (blue) vanishes over a million-fold; tanh (vermilion) and ReLU (green) stay near 1. }}

::: pitfall
One architecture, one learning rate and one split; the test trials were used to pick the stopping step, which is optimistic (use a validation set, Lesson 15). Input gradients are local: they say nothing about large changes, redundancy between correlated neurons, or causation in the brain. The last exercise in the notebook trains deeper tanh and ReLU networks; in 400 steps neither beats the linear decoder (test $R^2$ 0.69 and 0.65 against 0.76), and the ReLU network overfits faster.
:::

## Where this appears in neuroscience and machine learning

**Machine learning.** Backpropagation with automatic differentiation trains essentially every modern network, and gradient checking tests new layers. Initialisation schemes, ReLU-type activations, residual connections, normalisation and LSTMs all exist to keep products of derivatives near 1. Input gradients (saliency maps) are a basic tool for attributing a model's output to its inputs.

**Neuroscience.** Networks trained by backpropagation are used as models of neural computation, and their internal representations are compared with recordings. Gradients of biophysical and population models with respect to their parameters, computed by automatic differentiation, make large models fittable. Decoders for brain–computer interfaces are trained this way.

**Credit assignment in the brain.** Exact backpropagation needs feedback signals passed through the *transpose* of the forward weights (the weight-transport problem), separate forward and backward phases, and precise error signals. Proposed biological alternatives include feedback alignment, where fixed random feedback still allows learning (Lillicrap et al., 2016), dendritic error signals, and predictive coding. How the brain assigns credit to its synapses remains an open question (Lillicrap et al., 2020).

::: pitfall
**Common mistakes to avoid.**

- **Evaluating the outer derivative at the wrong point**: $f'(g(x))$, not $f'(x)$.
- **Dropping a link** of the chain, typically an inner constant ($\frac{d}{dx}e^{3x}=3e^{3x}$).
- **Overwriting instead of accumulating** gradients when a value is used twice.
- **Shape errors**: $\partial L/\partial\mathbf{W}$ must have the shape of $\mathbf{W}$; use $\boldsymbol\Delta^{\mathsf T}\mathbf{A}$, not $\mathbf{A}^{\mathsf T}\boldsymbol\Delta$, for $\mathbf{W}$ stored as $(n_{\text{out}},n_{\text{in}})$.
- **Forgetting the batch factor**: if the loss is a mean, divide the output error by $n$.
- **Using the activation's output where its input is needed**, or the reverse: $\tanh'=1-a^2$ uses the output $a$; ReLU′ uses the input $z$.
- **Skipping the gradient check**, or checking with $h$ too small (rounding) or at a ReLU corner.
- **Initialising a deep network with arbitrary weight scales**, or using sigmoids in deep hidden layers.
- **Reading input gradients as causal importance.**
:::

## Lesson summary

- Chain rule: $(f\circ g)'=f'(g)\,g'$. Along a chain, local derivatives multiply, and one flat link stalls the product.
- Backpropagation: a forward pass storing values; a backward pass from $\partial L/\partial L=1$, multiplying local derivatives in reverse and summing over fan-out. All parameter gradients cost about one extra forward pass.
- Layer gradients: $\boldsymbol\delta\mathbf{a}^{\mathsf T}$, $\boldsymbol\delta$, $\mathbf{W}^{\mathsf T}\boldsymbol\delta$; activations multiply by $\phi'$ elementwise; batches sum over rows.
- Always gradient-check a hand-written backward pass.
- Depth multiplies factors: sigmoid networks vanish; the weight scale decides vanishing or exploding; ReLU, Xavier/He initialisation and residual connections keep the factors near 1. Recurrent gradients scale like $\rho(\mathbf{W})^T$.
- On real mouse motor-cortex data, a hand-written backpropagation trains a decoder. Its input gradients largely mirror the linear weights, and a one-layer tanh network does not beat linear decoding.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
Differentiate: (a) $(3x^2+1)^5$; (b) $e^{-x^2/2}$; (c) $\ln(\cos x)$; (d) $\sigma(\sigma(x))$.
---answer---
**(a)** $5(3x^2+1)^4\cdot6x=30x(3x^2+1)^4$.

**(b)** $-x\,e^{-x^2/2}$.

**(c)** $\dfrac{-\sin x}{\cos x}=-\tan x$.

**(d)** $\sigma'(\sigma(x))\,\sigma'(x)=\sigma(\sigma(x))\big(1-\sigma(\sigma(x))\big)\,\sigma(x)(1-\sigma(x))$.
:::

::: exercise
For $L=\tfrac12\big(\tanh(wx+b)-y\big)^2$, write the backward pass and give $\partial L/\partial w$ and $\partial L/\partial b$. Evaluate them at $w=0$, $b=0$, $x=1$, $y=1$.
---answer---
**Backward pass.** With $z=wx+b$ and $a=\tanh z$: $\partial L/\partial a=a-y$; $\partial L/\partial z=(a-y)(1-a^2)$; $\partial L/\partial w=(a-y)(1-a^2)x$; $\partial L/\partial b=(a-y)(1-a^2)$.

**At the given point** $a=0$, so both equal $-1$.
:::

::: exercise
For $f(a,b)=ab+a^2b$, draw the computation graph and compute $\partial f/\partial a$ and $\partial f/\partial b$ by backpropagation at $a=2$, $b=3$. Where does fan-out occur?
---answer---
**Graph.** $u=ab$, $s=a^2$, $v=sb$, $f=u+v$.

**Backward.** $\partial f/\partial u=\partial f/\partial v=1$; $\partial f/\partial s=b=3$.

$\partial f/\partial a=b+2a\cdot b=3+12=15$ (two paths: through $u$ and through $s$).

$\partial f/\partial b=a+s=2+4=6$ (two paths: through $u$ and through $v$).

**Fan-out.** Both $a$ and $b$ feed two nodes.
:::

::: exercise
A layer has $\mathbf{W}=\begin{pmatrix}1&2\\0&-1\\3&1\end{pmatrix}$ and input $\mathbf{a}=(2,\ 1)$; the upstream gradient is $\boldsymbol\delta=(1,\ 0,\ -1)$. Compute $\partial L/\partial\mathbf{W}$, $\partial L/\partial\mathbf{b}$ and $\partial L/\partial\mathbf{a}$.
---answer---
$\partial L/\partial\mathbf{W}=\boldsymbol\delta\mathbf{a}^{\mathsf T}=\begin{pmatrix}2&1\\0&0\\-2&-1\end{pmatrix}$.

$\partial L/\partial\mathbf{b}=(1,\ 0,\ -1)$.

$\partial L/\partial\mathbf{a}=\mathbf{W}^{\mathsf T}\boldsymbol\delta=(1-3,\ 2-1)=(-2,\ 1)$.

(These are the starting values of the layer-gradient figure above.)
:::

::: exercise
A ReLU layer receives $\mathbf{z}=(1.5,\ -0.3,\ 0.0,\ 2.0)$ and upstream gradient $(0.5,\ 0.5,\ 0.5,\ 0.5)$ at its output. What is $\partial L/\partial\mathbf{z}$? Which units receive no gradient, and what convention is used at $z=0$?
---answer---
$\partial L/\partial\mathbf{z}=(0.5,\ 0,\ 0,\ 0.5)$, using the convention ReLU′(0) = 0.

Units 2 and 3 receive no gradient. Unit 3 sits exactly at the corner, where the derivative is undefined and software uses 0.
:::

::: exercise
In a chain of 20 sigmoid units, each with weight 2 and operating at $z=1$, by roughly what factor is the error signal multiplied from the last unit to the first? What if each weight were 5 and the units were operating at $z=0$?
---answer---
**Weight 2 at $z=1$.** $\sigma'(1)=\sigma(1)(1-\sigma(1))\approx0.197$; each factor is $2\times0.197\approx0.39$; over 19 links, $0.39^{19}\approx2\times10^{-8}$.

**Weight 5 at $z=0$.** $5\times0.25=1.25$ per link, and $1.25^{19}\approx70$: exploding (until the units saturate).
:::

::: exercise
Show that for the output layer $\mathbf{P}=\mathbf{A}\mathbf{W}^{\mathsf T}+\mathbf{b}$ with loss $L=\frac{1}{2n}\sum\lVert\mathbf{P}-\mathbf{Y}\rVert^2$, $\partial L/\partial\mathbf{P}=(\mathbf{P}-\mathbf{Y})/n$.
---answer---
$L=\frac{1}{2n}\sum_{k,j}(P_{kj}-Y_{kj})^2$, and each $P_{kj}$ appears in one term only, so $\partial L/\partial P_{kj}=\frac1n(P_{kj}-Y_{kj})$.
:::

::: exercise
Count the multiplications in a forward pass of a network $100\to50\to10$ (ignoring biases and activations) for one example, and in the backward pass (weight and input gradients). Compare with central-difference gradient checking of all the weights.
---answer---
**Forward:** $100\times50+50\times10=5500$.

**Backward:** weight gradients $5500$; input gradients $500$ (layer 2) $+\,5000$ (layer 1, optional); about $11{,}000$ in all, roughly two forward passes.

**Gradient checking** all 5500 weights by central differences needs $2\times5500$ forward passes: about 60 million multiplications.
:::

::: exercise
For the recurrent neuron $x_{t+1}=wx_t$ (linear), give $\partial x_T/\partial x_0$. For which $w$ does it neither vanish nor explode? Relate this to the spectral radius of Lesson 6.
---answer---
$\partial x_T/\partial x_0=w^T$. It vanishes for $\lvert w\rvert<1$, explodes for $\lvert w\rvert>1$, and stays of size 1 only for $\lvert w\rvert=1$. This is the spectral-radius condition of Lesson 6 for a $1\times1$ matrix.
:::

::: exercise
He initialisation uses variance $2/n_{\text{in}}$ for ReLU layers. Explain the factor 2 in one sentence.
---answer---
A ReLU zeroes about half of its inputs, halving the variance of the signal it passes on; doubling the weight variance compensates, keeping signal (and gradient) sizes constant across layers.
:::

::: exercise
Why can the central difference $(L(w+h)-L(w-h))/2h$ disagree with backpropagation at a ReLU unit whose input is exactly 0, even when the code is correct?
---answer---
At $z=0$ ReLU has a corner. The central difference sees slope 0 on one side and 1 on the other and returns about $\tfrac12$ (times the weight path), while backpropagation uses the convention 0 (or 1). Both follow a convention; the true derivative does not exist there.
:::

::: exercise
*(Challenge.)* For the Poisson neuron $\lambda=e^{\mathbf{w}\cdot\mathbf{x}+b}$ with loss $L=\lambda-y\ln\lambda$, show $\partial L/\partial\mathbf{w}=(\lambda-y)\mathbf{x}$. Compare with the gradient of the squared loss for a linear neuron $\hat y=\mathbf{w}\cdot\mathbf{x}+b$, $L=\tfrac12(\hat y-y)^2$, and comment.
---answer---
**Poisson.** $\partial L/\partial\lambda=1-y/\lambda$ and $\partial\lambda/\partial z=\lambda$, so $\partial L/\partial z=\lambda-y$ and $\partial L/\partial\mathbf{w}=(\lambda-y)\mathbf{x}$.

**Linear.** $\partial L/\partial\mathbf{w}=(\hat y-y)\mathbf{x}$.

**Comment.** Both have the form (prediction − target) × input. For these "matched" pairs of output function and loss (exponential with Poisson, identity with squared error), the activation's derivative cancels, leaving a simple error signal.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, including extending the automatic-differentiation engine and a real-data exercise on backpropagation for a deeper decoder. Both open in Google Colab.

{{ colab: week3/lesson10/Lesson10_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week3/lesson10/Lesson10_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- D. E. Rumelhart, G. E. Hinton and R. J. Williams, "Learning representations by back-propagating errors", *Nature* 323:533–536, 1986.
- I. Goodfellow, Y. Bengio and A. Courville, *Deep Learning*, MIT Press, 2016. Section 6.5, back-propagation and computation graphs; Sections 8.2 and 10.7, exploding and vanishing gradients.
- X. Glorot and Y. Bengio, "Understanding the difficulty of training deep feedforward neural networks", *AISTATS*, 2010; K. He et al., "Delving deep into rectifiers", *ICCV*, 2015. Initialisation.
- T. P. Lillicrap, D. Cownden, D. B. Tweed and C. J. Akerman, "Random synaptic feedback weights support error backpropagation for deep learning", *Nature Communications* 7:13276, 2016; T. P. Lillicrap et al., "Backpropagation and the brain", *Nature Reviews Neuroscience* 21:335–346, 2020.
- A. Karpathy, *micrograd* (github.com/karpathy/micrograd, MIT licence): a tiny scalar automatic-differentiation engine that inspired the notebook's `Value` class.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
- 3Blue1Brown, *Neural Networks* (video series), chapters 3–4: backpropagation, intuitively and with calculus.
