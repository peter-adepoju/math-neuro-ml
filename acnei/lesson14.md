**Learning objectives**

- Functions of several variables, their surfaces, heat maps and contour maps
- Partial derivatives as slopes of slices, with their units, analytically and numerically
- The gradient vector, the tangent-plane approximation, directional derivatives, and why the gradient is perpendicular to contours
- Critical points in several dimensions, the Hessian, and the classification into minima, maxima and saddles
- Feature scaling and units: what the size and direction of a gradient mean, and how units change the conditioning of a loss
- How a visual neuron's response to two contrasts is a surface whose gradient and curvature can be read from data, and how partial derivatives combine into a directional derivative

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

![One place field, three views: a surface (left), a heat map (middle) and a contour map, where each ring joins positions with the same rate (right).](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson14/cell007_1.svg)
*One place field, three views: a surface (left), a heat map (middle) and a contour map, where each ring joins positions with the same rate (right).*

How sensitive is the rate to position? The answer depends on the direction of the move: zero along a contour, largest towards the centre.

## Partial derivatives

**Definition: partial derivative**

$$\frac{\partial f}{\partial x}(x,y)=\lim_{h\to0}\frac{f(x+h,y)-f(x,y)}h ,\qquad \frac{\partial f}{\partial y}(x,y)=\lim_{h\to0}\frac{f(x,y+h)-f(x,y)}h .$$

Hold the other inputs fixed and differentiate as in Lesson 9. Geometrically: the slope of the slice of the surface parallel to that input's axis.

For the place field, with $g=\exp\!\big(-\frac{(x-x_0)^2+(y-y_0)^2}{2s^2}\big)$:

$$\frac{\partial r}{\partial x}=-r_{\max}\,g\,\frac{x-x_0}{s^2},\qquad \frac{\partial r}{\partial y}=-r_{\max}\,g\,\frac{y-y_0}{s^2}.$$

At $(45,\ 50)$ cm these are $+0.648$ and $-0.432$ spikes/s per cm, matching central differences and `np.gradient` on a 0.5 cm grid.

![Left: two slices through the point (45, 50) cm, one along x (blue) and one along y (orange). Middle and right: the rate along each slice; the slopes of their tangents (dashed) are the two partial derivatives, +0.648 and −0.432 spikes/s per cm.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson14/cell010_1.svg)
*Left: two slices through the point (45, 50) cm, one along x (blue) and one along y (orange). Middle and right: the rate along each slice; the slopes of their tangents (dashed) are the two partial derivatives, +0.648 and −0.432 spikes/s per cm.*

**Key point**

Each partial derivative has units of [output] per [unit of its own input]. Partial derivatives with respect to inputs in different units cannot be compared directly.

For a grid of values `Z[i, j]` with rows indexed by $y$ and columns by $x$, `np.gradient(Z, y, x)` returns $(\partial Z/\partial y,\ \partial Z/\partial x)$, in that order.

## The gradient, directional derivatives and contours

**Definition: gradient and directional derivative**

The **gradient** is $\nabla f=\big(\frac{\partial f}{\partial x_1},\dots,\frac{\partial f}{\partial x_d}\big)^{\mathsf T}$.

For a unit vector $\mathbf{u}$, the **directional derivative** is the slope along $\mathbf{u}$: $D_{\mathbf u}f=\lim_{t\to0}\frac{f(\mathbf{x}+t\mathbf{u})-f(\mathbf{x})}t$.

**Key point**

For a smooth $f$:

$$f(\mathbf{x}+\mathbf{h})\approx f(\mathbf{x})+\nabla f(\mathbf{x})\cdot\mathbf{h} ,\qquad D_{\mathbf u}f=\nabla f\cdot\mathbf{u}=\lVert\nabla f\rVert\cos\phi ,$$

with $\phi$ the angle between $\mathbf{u}$ and $\nabla f$. Hence the gradient points in the direction of **steepest ascent**, its length is the steepest slope, and it is **perpendicular to the contours**.

**Interactive figure.** The place field as a heat map with white contours. Drag the black point: the vermilion arrow is the gradient, always at right angles to the contours. The purple arrow is a direction u; the right panel shows the slope along u for every direction, a cosine whose peak lies along the gradient. Press Play to turn u.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=14&ix=place-field&t=The%20place%20field%20as%20a%20heat%20map%20with%20white%20contours.)

**Why it is true: the gradient is perpendicular to level sets**

Let $\mathbf c(t)$ be a curve lying in the level set $f=c$, so $f(\mathbf c(t))=c$ for all $t$. Differentiating with the chain rule (Lesson 10), $\nabla f(\mathbf c(t))\cdot\mathbf c'(t)=0$. The velocity $\mathbf c'(t)$ is tangent to the contour, so the gradient is perpendicular to every tangent direction of the contour.

At $(45,\ 50)$ cm the place field's gradient is $(0.648,\ -0.432)$, with length 0.778 spikes/s per cm, pointing at the field's centre. As the step direction turns, the slope traces a cosine with maximum 0.778 at $326^\circ$.

Reading a contour map: crowded contours mean large gradients; closed rings mark peaks or pits; crossing patterns mark saddles.

## Critical points and the Hessian

A critical point has $\nabla f=\mathbf 0$. Near one, the second-order Taylor expansion is

$$f(\mathbf{x}^*+\mathbf{h})\approx f(\mathbf{x}^*)+\tfrac12\mathbf{h}^{\mathsf T}\mathbf{H}\mathbf{h} ,$$

where the Hessian $\mathbf{H}$ is symmetric (the mixed partials of smooth functions are equal). With eigenvalues $\lambda_i$ and eigenvectors $\mathbf q_i$ (Lesson 6), writing $\mathbf{h}=\sum c_i\mathbf q_i$ gives $\mathbf{h}^{\mathsf T}\mathbf{H}\mathbf{h}=\sum\lambda_ic_i^2$.

**Key point**

- All $\lambda_i>0$: a local **minimum**.
- All $\lambda_i<0$: a local **maximum**.
- Mixed signs: a **saddle**.
- Some $\lambda_i=0$: inconclusive.

In 2-D: $\det\mathbf{H}<0$ means a saddle; $\det\mathbf{H}>0$ with trace $>0$ a minimum, and with trace $<0$ a maximum.

**Interactive figure.** Contours of the quadratic form ½ hᵀHh for a Hessian you set: blue where it is positive, vermilion dashed where negative. The arrows are the Hessian's eigenvectors, blue where the surface curves up and vermilion where it curves down. Try x² − 4xy + y²: positive diagonal entries, yet a saddle.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=14&ix=hessian&t=Contours%20of%20the%20quadratic%20form%20%C2%BD%20h%E1%B5%80Hh%20for%20a%20Hessian%20you%20set%3A%20blue%E2%80%A6)

A neuron with two place subfields (heights 12 and 16 spikes/s, width 12 cm) has two maxima, with Hessian eigenvalues $(-0.085,\ -0.070)$ and $(-0.112,\ -0.102)$, and a saddle between them at $(50.3,\ 42.2)$ cm with eigenvalues $(-0.065,\ +0.073)$. Two equal Gaussian subfields of width $s$ merge into a single peak when their separation falls below $2s$, where the curvature at the midpoint along the line joining them changes sign.

**Interactive figure.** A neuron with two place subfields. Green dots are maxima, the vermilion dot is the saddle between them, found with Newton's method; the readout gives the Hessian eigenvalues at each. Press Play to move the subfields: when they get close, the saddle and the smaller peak collide and vanish.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=14&ix=two-subfields&t=A%20neuron%20with%20two%20place%20subfields.)

## Feature scaling, units, and the size of a gradient

**Key point**

If an input $x_i$ is rescaled to $x_i'=x_i/c$ (for example cm to m, with $c=100$), the model is unchanged, but:

- its weight becomes $w_i'=c\,w_i$;
- the loss gradient component becomes $\partial L/\partial w_i'=\frac1c\,\partial L/\partial w_i$;
- the curvature becomes $\partial^2L/\partial w_i'^2=\frac1{c^2}\,\partial^2L/\partial w_i^2$.

**Why it is true: the scaling rules**

The prediction $w_ix_i=(cw_i)(x_i/c)$ is unchanged, so the loss as a function of the new weight is $\tilde L(w')=L(w'/c)$. By the chain rule $\frac{d\tilde L}{dw'}=\frac1cL'(w'/c)$, and differentiating again gives a factor $1/c^2$.

Consequences:

1. **The size of a gradient component is not the importance of a feature.** Compare after standardising, so each weight is an effect per standard deviation.
2. **The direction of a gradient depends on the units**, because steepness is per unit length, and length mixes units. Only the level sets are unit-free.
3. **Features on very different scales make the loss an elongated valley** with a large Hessian condition number.

In the notebook's example (speed in cm/s, distance in cm) the condition number is 5; with distance in m it is 33,885; standardised, it is about 4. The remaining elongation is due to the 0.6 correlation between speed and distance, which no rescaling removes.

**Interactive figure.** Loss contours over two weights, drawn with equal axis scales. Slide the distance unit from centimetres to metres: the loss is squeezed into a long, thin valley, and the downhill direction (vermilion) points across the valley rather than at the minimum. Standardising restores a rounder bowl.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=14&ix=scaling&t=Loss%20contours%20over%20two%20weights%2C%20drawn%20with%20equal%20axis%20scales.)

## Mini-lab: a contrast response as a surface

**Data.** Neuron 49 of a mouse primary-visual-cortex recording ([Steinmetz et al., 2019](https://doi.org/10.1038/s41586-019-1787-x); data released under CC0): spike counts 50–250 ms after the stimulus on 340 trials, with left and right contrasts $c_L,c_R\in\{0,\ 0.25,\ 0.5,\ 1\}$. The rate is a function of two variables, sampled on an uneven $4\times4$ grid.

**Empirical map and its gradient.** `np.gradient(rate_map, levels, levels)` handles the uneven spacing and returns the partial derivatives along rows ($c_R$) first. Their mean is $(4.2,\ 71.2)$ spikes/s per unit contrast, pointing at $87^\circ$: almost purely along the right-contrast axis. The probe was in the left hemisphere, and visual cortex represents the opposite side of space.

**Model.** $\lambda(\mathbf c)=\exp(b_0+b_Lc_L+b_Rc_R)$ for the count in the window, fitted by Newton's method with the loss gradient $\frac1n\mathbf{D}^{\mathsf T}(\boldsymbol\lambda-\mathbf y)$ and Hessian $\frac1n\sum_t\lambda_t\mathbf d_t\mathbf d_t^{\mathsf T}$, gives $(b_L,b_R)=(0.42,\ 1.75)$ per unit contrast: a gradient direction of $77^\circ$. Its gradient $\nabla\lambda=\lambda\,(b_L,b_R)$ always points the same way and grows with $\lambda$; its contours are straight lines.

**Interactive figure.** Left: the neuron's rate (numbers, and shading) on the 16 stimuli, with the numerical gradient at each (vermilion arrows); switch to the model to compare. Right: a slice through the surface, the rate against right contrast with nothing on the left: the data (black) saturate, the model (blue) accelerates.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=14&ix=contrast-surface&t=Left%3A%20the%20neuron%27s%20rate%20%28numbers%2C%20and%20shading%29%20on%20the%2016%20stimuli%2C%E2%80%A6)

**Key point**

**Same gradient direction, opposite curvature.** The model's second partial is $\partial^2\lambda/\partial c_R^2=\lambda b_R^2>0$: an exponential always curves upwards. The data's, estimated by differentiating the numerical partial again, averages $-81$ spikes/s per unit contrast squared: the response **saturates**. The first derivative's direction is robust to the choice of model; the second derivative's sign is not.

With the wrong curvature, the model over-predicts the blank-screen rate (12 against 7 spikes/s) and under-predicts at right contrast 0.5 (28 against 50). A saturating input, such as log contrast or a Naka–Rushton function (Lesson 8), would be needed to capture the shape.

**Directional derivatives.** Finite differences from the blank screen to full contrast estimate the gradient as $(5.0,\ 55.8)$. Along $\mathbf u=(1,\ 1)/\sqrt2$ the cosine rule predicts $\nabla\lambda\cdot\mathbf u=43.0$ spikes/s per unit distance; the measured slope is $49.1$. The linear approximation predicts 67.5 spikes/s with both screens at full contrast; the neuron fires 76.0. The difference, $r_{11}-r_{10}-r_{01}+r_{00}=8.5$, is a finite-difference estimate of the mixed partial $\partial^2\lambda/\partial c_L\partial c_R$, the off-diagonal entry of the rate surface's Hessian, though it rests on only 5 trials. Across 72 neurons of a second mouse (the last exercise in the notebook), adding the two partials predicts the both-screens rate with correlation 0.84, and the mixed partial has a median of $-0.2$ spikes/s.

**Units.** The Hessian of the loss at the fit has condition number 18 with contrasts as fractions, 22,288 with $c_L$ in percent, and 5 with standardised contrasts. The fitted model and its gradient direction (converted back) are identical in all three.

**Common pitfall**

One neuron; some stimuli have only 5–7 trials, so second differences on this coarse, uneven grid are noisy; the responses also reflect the mouse's movements; and the log-linear model has the wrong curvature.

## Where this appears in neuroscience and machine learning

**Neuroscience.** Rate maps of place, grid and head-direction cells, and receptive fields over visual space, are functions of several variables; preferred directions are gradient directions, and cosine tuning is a directional derivative. Growth cones and chemotaxing cells follow concentration gradients by sampling directional derivatives across their own extent. Saddles separate the basins of attraction of attractor networks, and the Jacobian of a dynamical system (Lesson 23) plays the Hessian's role in stability analysis.

**Machine learning.** Backpropagation (Lesson 10) computes gradients with respect to all parameters at once; gradient descent moves along $-\nabla L$, perpendicular to the loss contours (Lesson 15). Decision boundaries are level sets. In high dimensions saddles vastly outnumber local minima. For Poisson and logistic models the Hessian of the negative log-likelihood is the observed Fisher information, whose inverse approximates the parameters' covariance (Lessons 11 and 19). Feature standardisation, batch normalisation and preconditioning all address scaling.

**Common pitfall**

**Common mistakes to avoid.**

- **Forgetting to hold the other variables fixed** when taking a partial derivative, or forgetting the chain-rule factors they bring ($\partial_xe^{xy}=ye^{xy}$).
- **Mixing up axes** with grids: `meshgrid` puts $y$ along rows, and `np.gradient` returns derivatives in axis order.
- **Using a non-unit vector** in a directional derivative.
- **Classifying a critical point from the diagonal** of the Hessian alone: $x^2-4xy+y^2$ has positive diagonal entries but is a saddle.
- **Applying the Hessian test where the gradient is not zero.**
- **Reading the size of a gradient component as importance** without accounting for units.
- **Comparing gradient directions computed in mixed units**: steepest ascent depends on how distances are measured.

## Lesson summary

- Partial derivatives are slopes of slices, in units per unit of their own input.
- $\nabla f$ points uphill, has length equal to the steepest slope, and is perpendicular to the contours; $f(\mathbf{x}+\mathbf{h})\approx f+\nabla f\cdot\mathbf{h}$ and $D_{\mathbf u}f=\nabla f\cdot\mathbf{u}$.
- At critical points the Hessian's eigenvalues classify minima, maxima and saddles; saddles are common in two or more dimensions.
- Rescaling an input by $1/c$ multiplies its weight by $c$, its gradient component by $1/c$ and its curvature by $1/c^2$; standardise before comparing, and expect badly scaled features to make ill-conditioned losses.
- A V1 neuron's contrast response is a surface: data and model agree on its gradient direction (the opposite side of space) but disagree on its curvature (the data saturate). Directional derivatives combine the partials; the remainder is a mixed second derivative.

## Further reading

- G. Strang, *Calculus*, 3rd ed., Wellesley–Cambridge Press, 2017 (free online). Chapters on partial derivatives, gradients and the second-derivative test.
- M. P. Deisenroth, A. A. Faisal and C. S. Ong, *Mathematics for Machine Learning*, Cambridge University Press, 2020 (free online). Chapter 5, vector calculus.
- A. P. Georgopoulos, J. F. Kalaska, R. Caminiti and J. T. Massey, "On the relations between the direction of two-dimensional arm movements and cell discharge in primate motor cortex", *Journal of Neuroscience* 2:1527–1537, 1982.
- J. O'Keefe and J. Dostrovsky, "The hippocampus as a spatial map", *Brain Research* 34:171–175, 1971.
- Y. Gu, D. E. Angelaki and G. C. DeAngelis, "Neural correlates of multisensory cue integration in macaque MSTd", *Nature Neuroscience* 11:1201–1210, 2008.
- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The source of the mini-lab recording (data released under CC0).
