---
summary: "Slopes in many directions: functions of several variables, partial derivatives, the gradient and directional derivatives, why the gradient is perpendicular to contours, the Hessian and saddles, how units change a gradient and the shape of a loss, and a real visual neuron's contrast-response surface."
---

::: objectives
- Functions of several variables, their surfaces, heat maps and contour maps
- Partial derivatives as slopes of slices, with their units, analytically and numerically
- The gradient vector, the tangent-plane approximation, directional derivatives, and why the gradient is perpendicular to contours
- Critical points in several dimensions, the Hessian, and the classification into minima, maxima and saddles
- Feature scaling and units: what the size and direction of a gradient mean, and how units change the conditioning of a loss
- How a visual neuron's response to two contrasts is a surface whose gradient and curvature can be read from data, and how partial derivatives combine into a directional derivative
:::

**Before you start.** This reading is the mathematical companion to the Lesson 14 teaching notebook. You need Lesson 2 (dot products and angles), Lesson 6 (eigenvalues of symmetric matrices), Lesson 9 (derivatives, the linear approximation, central differences) and Lesson 11 (second derivatives, curvature, Taylor approximation). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $f(\mathbf{x})$, $\mathbf{x}\in\mathbb{R}^d$ | a function of $d$ variables |
| $\partial f/\partial x_i$ | a partial derivative: the slope along $x_i$, with the other inputs fixed |
| $\nabla f$ | the gradient: the column vector of partial derivatives |
| $D_{\mathbf u} f=\nabla f\cdot\mathbf{u}$ | the directional derivative along the unit vector $\mathbf{u}$ |
| $\mathbf{H}$, $H_{ij}=\partial^2f/\partial x_i\partial x_j$ | the Hessian matrix |
| $\{\mathbf{x}: f(\mathbf{x})=c\}$ | a level set (a contour line in 2-D) |

## The problem: a place cell's map of space

A hippocampal place cell's rate depends on the animal's position:

$$r(x,y)=r_0+r_{\max}\exp\!\Big(-\frac{(x-x_0)^2+(y-y_0)^2}{2s^2}\Big),$$

with its centre at $(60,\ 40)$ cm, width $s=15$ cm, $r_0=0.5$ and $r_{\max}=20$ spikes/s. It can be drawn as a surface, a heat map or a contour map.

{{ figure: cell007_1.svg | One place field, three views: a surface (left), a heat map (middle) and a contour map, where each ring joins positions with the same rate (right). }}

How sensitive is the rate to position? The answer depends on the direction of the move: zero along a contour, largest towards the centre.

## Partial derivatives

::: definition Definition: partial derivative
$$\frac{\partial f}{\partial x}(x,y)=\lim_{h\to0}\frac{f(x+h,y)-f(x,y)}h ,\qquad
\frac{\partial f}{\partial y}(x,y)=\lim_{h\to0}\frac{f(x,y+h)-f(x,y)}h .$$

Hold the other inputs fixed and differentiate as in Lesson 9. Geometrically: the slope of the slice of the surface parallel to that input's axis.
:::

For the place field, with $g=\exp\!\big(-\frac{(x-x_0)^2+(y-y_0)^2}{2s^2}\big)$:

$$\frac{\partial r}{\partial x}=-r_{\max}\,g\,\frac{x-x_0}{s^2},\qquad \frac{\partial r}{\partial y}=-r_{\max}\,g\,\frac{y-y_0}{s^2}.$$

At $(45,\ 50)$ cm these are $+0.648$ and $-0.432$ spikes/s per cm, matching central differences and `np.gradient` on a 0.5 cm grid.

{{ figure: cell010_1.svg | Left: two slices through the point (45, 50) cm, one along x (blue) and one along y (orange). Middle and right: the rate along each slice; the slopes of their tangents (dashed) are the two partial derivatives, +0.648 and −0.432 spikes/s per cm. }}

::: keypoint
Each partial derivative has units of [output] per [unit of its own input]. Partial derivatives with respect to inputs in different units cannot be compared directly.

For a grid of values `Z[i, j]` with rows indexed by $y$ and columns by $x$, `np.gradient(Z, y, x)` returns $(\partial Z/\partial y,\ \partial Z/\partial x)$, in that order.
:::

## The gradient, directional derivatives and contours

::: definition Definition: gradient and directional derivative
The **gradient** is $\nabla f=\big(\frac{\partial f}{\partial x_1},\dots,\frac{\partial f}{\partial x_d}\big)^{\mathsf T}$.

For a unit vector $\mathbf{u}$, the **directional derivative** is the slope along $\mathbf{u}$: $D_{\mathbf u}f=\lim_{t\to0}\frac{f(\mathbf{x}+t\mathbf{u})-f(\mathbf{x})}t$.
:::

::: keypoint
For a smooth $f$:

$$f(\mathbf{x}+\mathbf{h})\approx f(\mathbf{x})+\nabla f(\mathbf{x})\cdot\mathbf{h} ,\qquad D_{\mathbf u}f=\nabla f\cdot\mathbf{u}=\lVert\nabla f\rVert\cos\phi ,$$

with $\phi$ the angle between $\mathbf{u}$ and $\nabla f$. Hence the gradient points in the direction of **steepest ascent**, its length is the steepest slope, and it is **perpendicular to the contours**.
:::

{{ interactive: place-field | The place field as a heat map with white contours. Drag the black point: the vermilion arrow is the gradient, always at right angles to the contours. The purple arrow is a direction u; the right panel shows the slope along u for every direction, a cosine whose peak lies along the gradient. Press Play to turn u. }}

::: note Why it is true: the gradient is perpendicular to level sets
Let $\mathbf c(t)$ be a curve lying in the level set $f=c$, so $f(\mathbf c(t))=c$ for all $t$. Differentiating with the chain rule (Lesson 10), $\nabla f(\mathbf c(t))\cdot\mathbf c'(t)=0$. The velocity $\mathbf c'(t)$ is tangent to the contour, so the gradient is perpendicular to every tangent direction of the contour.
:::

At $(45,\ 50)$ cm the place field's gradient is $(0.648,\ -0.432)$, with length 0.778 spikes/s per cm, pointing at the field's centre. As the step direction turns, the slope traces a cosine with maximum 0.778 at $326^\circ$.

Reading a contour map: crowded contours mean large gradients; closed rings mark peaks or pits; crossing patterns mark saddles.

::: quiz
? At some point, $\nabla f=(3,\ 4)$. What is the steepest slope there, and the slope along a contour?
- [ ] 7 and 0
- [x] 5 and 0
- [ ] 5 and 5
> The steepest slope is $\lVert\nabla f\rVert=\sqrt{9+16}=5$. A contour is perpendicular to the gradient, so the slope along it is $\nabla f\cdot\mathbf u=0$.

? $\nabla f=(2,\ 0)$. What is the slope in the direction $\mathbf u=(1,\ 1)/\sqrt2$?
- [ ] 2
- [x] $\sqrt2\approx1.41$
- [ ] 0
> $D_{\mathbf u}f=\nabla f\cdot\mathbf u=2/\sqrt2=\sqrt2$. Remember to use a unit vector.
:::

## Critical points and the Hessian

A critical point has $\nabla f=\mathbf 0$. Near one, the second-order Taylor expansion is

$$f(\mathbf{x}^*+\mathbf{h})\approx f(\mathbf{x}^*)+\tfrac12\mathbf{h}^{\mathsf T}\mathbf{H}\mathbf{h} ,$$

where the Hessian $\mathbf{H}$ is symmetric (the mixed partials of smooth functions are equal). With eigenvalues $\lambda_i$ and eigenvectors $\mathbf q_i$ (Lesson 6), writing $\mathbf{h}=\sum c_i\mathbf q_i$ gives $\mathbf{h}^{\mathsf T}\mathbf{H}\mathbf{h}=\sum\lambda_ic_i^2$.

::: keypoint
- All $\lambda_i>0$: a local **minimum**.
- All $\lambda_i<0$: a local **maximum**.
- Mixed signs: a **saddle**.
- Some $\lambda_i=0$: inconclusive.

In 2-D: $\det\mathbf{H}<0$ means a saddle; $\det\mathbf{H}>0$ with trace $>0$ a minimum, and with trace $<0$ a maximum.
:::

{{ interactive: hessian | Contours of the quadratic form ½ hᵀHh for a Hessian you set: blue where it is positive, vermilion dashed where negative. The arrows are the Hessian's eigenvectors, blue where the surface curves up and vermilion where it curves down. Try x² − 4xy + y²: positive diagonal entries, yet a saddle. }}

A neuron with two place subfields (heights 12 and 16 spikes/s, width 12 cm) has two maxima, with Hessian eigenvalues $(-0.085,\ -0.070)$ and $(-0.112,\ -0.102)$, and a saddle between them at $(50.3,\ 42.2)$ cm with eigenvalues $(-0.065,\ +0.073)$. Two equal Gaussian subfields of width $s$ merge into a single peak when their separation falls below $2s$, where the curvature at the midpoint along the line joining them changes sign.

::: quiz
? At a critical point the Hessian has eigenvalues $3$ and $-1$. What is the point?
- [ ] A minimum
- [ ] A maximum
- [x] A saddle
> Mixed signs: the surface curves up along one eigenvector and down along the other.

? A Hessian is $\begin{pmatrix}2&3\\3&2\end{pmatrix}$. Both diagonal entries are positive. Is the critical point a minimum?
- [ ] Yes: the diagonal entries are positive.
- [x] No: $\det\mathbf H=4-9<0$, so it is a saddle.
> The eigenvalues are 5 and −1. Always classify with the eigenvalues (or the determinant in 2-D), not the diagonal alone.
:::

{{ interactive: two-subfields | A neuron with two place subfields. Green dots are maxima, the vermilion dot is the saddle between them, found with Newton's method; the readout gives the Hessian eigenvalues at each. Press Play to move the subfields: when they get close, the saddle and the smaller peak collide and vanish. }}

## Feature scaling, units, and the size of a gradient

::: keypoint
If an input $x_i$ is rescaled to $x_i'=x_i/c$ (for example cm to m, with $c=100$), the model is unchanged, but:

- its weight becomes $w_i'=c\,w_i$;
- the loss gradient component becomes $\partial L/\partial w_i'=\frac1c\,\partial L/\partial w_i$;
- the curvature becomes $\partial^2L/\partial w_i'^2=\frac1{c^2}\,\partial^2L/\partial w_i^2$.
:::

::: note Why it is true: the scaling rules
The prediction $w_ix_i=(cw_i)(x_i/c)$ is unchanged, so the loss as a function of the new weight is $\tilde L(w')=L(w'/c)$. By the chain rule $\frac{d\tilde L}{dw'}=\frac1cL'(w'/c)$, and differentiating again gives a factor $1/c^2$.
:::

Consequences:

1. **The size of a gradient component is not the importance of a feature.** Compare after standardising, so each weight is an effect per standard deviation.
2. **The direction of a gradient depends on the units**, because steepness is per unit length, and length mixes units. Only the level sets are unit-free.
3. **Features on very different scales make the loss an elongated valley** with a large Hessian condition number.

In the notebook's example (speed in cm/s, distance in cm) the condition number is 5; with distance in m it is 33,885; standardised, it is about 4. The remaining elongation is due to the 0.6 correlation between speed and distance, which no rescaling removes.

{{ interactive: scaling | Loss contours over two weights, drawn with equal axis scales. Slide the distance unit from centimetres to metres: the loss is squeezed into a long, thin valley, and the downhill direction (vermilion) points across the valley rather than at the minimum. Standardising restores a rounder bowl. }}

## Mini-lab: a contrast response as a surface

**Data.** Neuron 49 of a mouse primary-visual-cortex recording ([Steinmetz et al., 2019](https://doi.org/10.1038/s41586-019-1787-x); data released under CC0): spike counts 50–250 ms after the stimulus on 340 trials, with left and right contrasts $c_L,c_R\in\{0,\ 0.25,\ 0.5,\ 1\}$. The rate is a function of two variables, sampled on an uneven $4\times4$ grid.

**Empirical map and its gradient.** `np.gradient(rate_map, levels, levels)` handles the uneven spacing and returns the partial derivatives along rows ($c_R$) first. Their mean is $(4.2,\ 71.2)$ spikes/s per unit contrast, pointing at $87^\circ$: almost purely along the right-contrast axis. The probe was in the left hemisphere, and visual cortex represents the opposite side of space.

**Model.** $\lambda(\mathbf c)=\exp(b_0+b_Lc_L+b_Rc_R)$ for the count in the window, fitted by Newton's method with the loss gradient $\frac1n\mathbf{D}^{\mathsf T}(\boldsymbol\lambda-\mathbf y)$ and Hessian $\frac1n\sum_t\lambda_t\mathbf d_t\mathbf d_t^{\mathsf T}$, gives $(b_L,b_R)=(0.42,\ 1.75)$ per unit contrast: a gradient direction of $77^\circ$. Its gradient $\nabla\lambda=\lambda\,(b_L,b_R)$ always points the same way and grows with $\lambda$; its contours are straight lines.

{{ interactive: contrast-surface | Left: the neuron's rate (numbers, and shading) on the 16 stimuli, with the numerical gradient at each (vermilion arrows); switch to the model to compare. Right: a slice through the surface, the rate against right contrast with nothing on the left: the data (black) saturate, the model (blue) accelerates. }}

::: keypoint
**Same gradient direction, opposite curvature.** The model's second partial is $\partial^2\lambda/\partial c_R^2=\lambda b_R^2>0$: an exponential always curves upwards. The data's, estimated by differentiating the numerical partial again, averages $-81$ spikes/s per unit contrast squared: the response **saturates**. The first derivative's direction is robust to the choice of model; the second derivative's sign is not.
:::

With the wrong curvature, the model over-predicts the blank-screen rate (12 against 7 spikes/s) and under-predicts at right contrast 0.5 (28 against 50). A saturating input, such as log contrast or a Naka–Rushton function (Lesson 8), would be needed to capture the shape.

**Directional derivatives.** Finite differences from the blank screen to full contrast estimate the gradient as $(5.0,\ 55.8)$. Along $\mathbf u=(1,\ 1)/\sqrt2$ the cosine rule predicts $\nabla\lambda\cdot\mathbf u=43.0$ spikes/s per unit distance; the measured slope is $49.1$. The linear approximation predicts 67.5 spikes/s with both screens at full contrast; the neuron fires 76.0. The difference, $r_{11}-r_{10}-r_{01}+r_{00}=8.5$, is a finite-difference estimate of the mixed partial $\partial^2\lambda/\partial c_L\partial c_R$, the off-diagonal entry of the rate surface's Hessian, though it rests on only 5 trials. Across 72 neurons of a second mouse (the last exercise in the notebook), adding the two partials predicts the both-screens rate with correlation 0.84, and the mixed partial has a median of $-0.2$ spikes/s.

**Units.** The Hessian of the loss at the fit has condition number 18 with contrasts as fractions, 22,288 with $c_L$ in percent, and 5 with standardised contrasts. The fitted model and its gradient direction (converted back) are identical in all three.

::: pitfall
One neuron; some stimuli have only 5–7 trials, so second differences on this coarse, uneven grid are noisy; the responses also reflect the mouse's movements; and the log-linear model has the wrong curvature.
:::

## Where this appears in neuroscience and machine learning

**Neuroscience.** Rate maps of place, grid and head-direction cells, and receptive fields over visual space, are functions of several variables; preferred directions are gradient directions, and cosine tuning is a directional derivative. Growth cones and chemotaxing cells follow concentration gradients by sampling directional derivatives across their own extent. Saddles separate the basins of attraction of attractor networks, and the Jacobian of a dynamical system (Lesson 23) plays the Hessian's role in stability analysis.

**Machine learning.** Backpropagation (Lesson 10) computes gradients with respect to all parameters at once; gradient descent moves along $-\nabla L$, perpendicular to the loss contours (Lesson 15). Decision boundaries are level sets. In high dimensions saddles vastly outnumber local minima. For Poisson and logistic models the Hessian of the negative log-likelihood is the observed Fisher information, whose inverse approximates the parameters' covariance (Lessons 11 and 19). Feature standardisation, batch normalisation and preconditioning all address scaling.

::: pitfall
**Common mistakes to avoid.**

- **Forgetting to hold the other variables fixed** when taking a partial derivative, or forgetting the chain-rule factors they bring ($\partial_xe^{xy}=ye^{xy}$).
- **Mixing up axes** with grids: `meshgrid` puts $y$ along rows, and `np.gradient` returns derivatives in axis order.
- **Using a non-unit vector** in a directional derivative.
- **Classifying a critical point from the diagonal** of the Hessian alone: $x^2-4xy+y^2$ has positive diagonal entries but is a saddle.
- **Applying the Hessian test where the gradient is not zero.**
- **Reading the size of a gradient component as importance** without accounting for units.
- **Comparing gradient directions computed in mixed units**: steepest ascent depends on how distances are measured.
:::

## Lesson summary

- Partial derivatives are slopes of slices, in units per unit of their own input.
- $\nabla f$ points uphill, has length equal to the steepest slope, and is perpendicular to the contours; $f(\mathbf{x}+\mathbf{h})\approx f+\nabla f\cdot\mathbf{h}$ and $D_{\mathbf u}f=\nabla f\cdot\mathbf{u}$.
- At critical points the Hessian's eigenvalues classify minima, maxima and saddles; saddles are common in two or more dimensions.
- Rescaling an input by $1/c$ multiplies its weight by $c$, its gradient component by $1/c$ and its curvature by $1/c^2$; standardise before comparing, and expect badly scaled features to make ill-conditioned losses.
- A V1 neuron's contrast response is a surface: data and model agree on its gradient direction (the opposite side of space) but disagree on its curvature (the data saturate). Directional derivatives combine the partials; the remainder is a mixed second derivative.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
For $f(x,y)=3x^2y-y^3$, find $\partial f/\partial x$ and $\partial f/\partial y$, and evaluate them at $(1,\ 2)$.
---answer---
$f_x=6xy$ and $f_y=3x^2-3y^2$. At $(1,\ 2)$: $12$ and $-9$.
:::

::: exercise
For $f(x,y)=x^2+4y^2$ at $(2,\ 1)$: find $\nabla f$ and $\lVert\nabla f\rVert$; the directional derivative along $(1,\ 1)/\sqrt2$; and a direction along which the directional derivative is zero.
---answer---
**Gradient.** $\nabla f=(2x,\ 8y)=(4,\ 8)$, with $\lVert\nabla f\rVert=\sqrt{80}\approx8.94$.

**Along $(1,1)/\sqrt2$:** $12/\sqrt2\approx8.49$.

**Zero slope** along $(-8,\ 4)/\sqrt{80}=(-2,\ 1)/\sqrt5$: tangent to the contour.
:::

::: exercise
Approximate $f(x,y)=e^x\cos y$ at $(0.1,\ 0.2)$ by its tangent plane at $(0,\ 0)$, and by the quadratic approximation. Compare with the exact value.
---answer---
**Tangent plane.** $\nabla f(0,0)=(1,\ 0)$, so $f\approx1+x=1.1$.

**Quadratic.** The Hessian at 0 is $\operatorname{diag}(1,\ -1)$, so $f\approx1+x+\frac12x^2-\frac12y^2=1.085$.

**Exact:** $e^{0.1}\cos0.2=1.0831$.
:::

::: exercise
Find and classify the critical point of $f(x,y)=x^2+xy+y^2-3x$.
---answer---
$2x+y-3=0$ and $x+2y=0$ give $(2,\ -1)$. $\mathbf{H}=\begin{pmatrix}2&1\\1&2\end{pmatrix}$ has eigenvalues 1 and 3: a **minimum**, with $f(2,-1)=-3$.
:::

::: exercise
Show that the origin is a saddle of $f(x,y)=x^2-4xy+y^2$, and find the directions of steepest upward and downward curvature.
---answer---
$\nabla f=\mathbf 0$ at the origin; $\mathbf{H}=\begin{pmatrix}2&-4\\-4&2\end{pmatrix}$ with $\det=-12<0$: a **saddle**.

Eigenvalue 6 along $(1,\ -1)/\sqrt2$ (curving up) and $-2$ along $(1,\ 1)/\sqrt2$ (curving down). The Hessian figure above has this example as a preset.
:::

::: exercise
For a circular Gaussian place field, show that the gradient's length is largest at distance $s$ (one field width) from the centre.
---answer---
At distance $d$ from the centre, $\lVert\nabla r\rVert=r_{\max}\frac d{s^2}e^{-d^2/2s^2}$. Its derivative with respect to $d$ is proportional to $\big(1-\frac{d^2}{s^2}\big)e^{-d^2/2s^2}$, which is zero at $d=s$: the steepest ring is one width from the centre.
:::

::: exercise
A rate model uses speed in cm/s with weight $0.5$ spikes/s per cm/s. Speed is re-expressed in m/s. What are the new weight, the factor applied to the loss gradient component for that weight, and the factor applied to its curvature?
---answer---
**New weight:** 50 spikes/s per m/s. **Gradient component:** multiplied by $1/100$. **Curvature:** multiplied by $10^{-4}$.
:::

::: exercise
A neuron has $\lambda(\mathbf v)=\exp(b_0+\mathbf b\cdot\mathbf v)$ with $\lambda(\mathbf 0)=12$ spikes/s and $\mathbf b=(-0.06,\ 0.03)$ per cm/s. Give $\nabla\lambda(\mathbf 0)$ and the preferred direction, and use the directional derivative to predict the rate at 5 cm/s in the preferred direction and perpendicular to it.
---answer---
**Gradient.** $\nabla\lambda(\mathbf 0)=12\mathbf b=(-0.72,\ 0.36)$ spikes/s per cm/s, of length 0.805. The preferred direction is the angle of $\mathbf b$, $153.4^\circ$.

**Preferred direction.** At 5 cm/s the directional derivative predicts $12+5\times0.805=16.0$ spikes/s (the exact model value is $12e^{5\times0.0671}=16.8$).

**Perpendicular.** 12 spikes/s (exactly).
:::

::: exercise
Show that the Hessian of $L(\mathbf w)=\frac1{2n}\lVert\mathbf y-\mathbf{X}\mathbf w\rVert^2$ is $\frac1n\mathbf{X}^{\mathsf T}\mathbf{X}$. What is it for standardised, uncorrelated features?
---answer---
With $L=\frac1{2n}(\mathbf y-\mathbf{X}\mathbf w)^{\mathsf T}(\mathbf y-\mathbf{X}\mathbf w)$, the gradient is $\nabla L=-\frac1n\mathbf{X}^{\mathsf T}(\mathbf y-\mathbf{X}\mathbf w)$, and differentiating again gives $\frac1n\mathbf{X}^{\mathsf T}\mathbf{X}$.

Standardised, uncorrelated features give the identity matrix: circular contours, condition number 1.
:::

::: exercise
Verify that $\frac{\partial^2f}{\partial x\partial y}=\frac{\partial^2f}{\partial y\partial x}$ for $f=x^3y^2$.
---answer---
$f_x=3x^2y^2$, so $f_{xy}=6x^2y$. $f_y=2x^3y$, so $f_{yx}=6x^2y$. Equal.
:::

::: exercise
Using the chain rule, show that the gradient is perpendicular to a level set.
---answer---
Along a level curve $\mathbf c(t)$, $f(\mathbf c(t))$ is constant, so $\frac{d}{dt}f(\mathbf c(t))=\nabla f\cdot\mathbf c'(t)=0$: the gradient is perpendicular to the curve's tangent.
:::

::: exercise
*(Challenge.)* For symmetric $\mathbf A$, show that $f(\mathbf w)=\frac12\mathbf w^{\mathsf T}\mathbf A\mathbf w-\mathbf b^{\mathsf T}\mathbf w$ has gradient $\mathbf A\mathbf w-\mathbf b$ and Hessian $\mathbf A$. When is $\mathbf w=\mathbf A^{-1}\mathbf b$ a minimum? Relate this to the normal equations of least squares.
---answer---
**Gradient.** $\partial_{w_k}\frac12\sum_{ij}w_iA_{ij}w_j=\frac12\sum_j(A_{kj}+A_{jk})w_j=(\mathbf A\mathbf w)_k$ for symmetric $\mathbf A$; so $\nabla f=\mathbf A\mathbf w-\mathbf b$ and $\mathbf{H}=\mathbf A$.

**Minimum.** The critical point $\mathbf A^{-1}\mathbf b$ is a minimum when $\mathbf A$ is positive definite (all eigenvalues positive).

**Least squares** has $\mathbf A=\frac1n\mathbf{X}^{\mathsf T}\mathbf{X}$ and $\mathbf b=\frac1n\mathbf{X}^{\mathsf T}\mathbf y$: setting the gradient to zero gives the normal equations of Lesson 5.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise on the gradients of contrast responses across a V1 population. Both open in Google Colab.

{{ colab: week4/lesson14/Lesson14_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week4/lesson14/Lesson14_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- G. Strang, *Calculus*, 3rd ed., Wellesley–Cambridge Press, 2017 (free online). Chapters on partial derivatives, gradients and the second-derivative test.
- M. P. Deisenroth, A. A. Faisal and C. S. Ong, *Mathematics for Machine Learning*, Cambridge University Press, 2020 (free online). Chapter 5, vector calculus.
- A. P. Georgopoulos, J. F. Kalaska, R. Caminiti and J. T. Massey, "On the relations between the direction of two-dimensional arm movements and cell discharge in primate motor cortex", *Journal of Neuroscience* 2:1527–1537, 1982.
- J. O'Keefe and J. Dostrovsky, "The hippocampus as a spatial map", *Brain Research* 34:171–175, 1971.
- Y. Gu, D. E. Angelaki and G. C. DeAngelis, "Neural correlates of multisensory cue integration in macaque MSTd", *Nature Neuroscience* 11:1201–1210, 2008.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
