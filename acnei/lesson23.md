**Learning objectives**

- Write coupled rate equations as one ODE for a state vector, and solve linear systems through their eigenvalues
- Draw and read a phase plane: direction field, nullclines, fixed points, trajectories and basins of attraction
- Linearise at a fixed point with the Jacobian and classify it from its eigenvalues or its trace and determinant
- Analyse the Wilson–Cowan excitatory–inhibitory model: bistability, limit-cycle oscillations, and bifurcations as eigenvalues cross zero
- Fit a two-variable model to a recording, interpret its eigenvalues, and test it on data it was not fitted to

**Before you start.** This reading is the mathematical companion to the Lesson 23 teaching notebook. You need Lesson 6 (eigenvalues, continuous-time stability), Lesson 14 (partial derivatives, gradients, Taylor expansion in several variables), Lesson 8 (sigmoids) and Lessons 21 and 22 (relaxation equations, Euler, the LIF). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning |
|---|---|
| $\mathbf x\in\mathbb R^n$, $\dot{\mathbf x}=\mathbf F(\mathbf x)$ | a state vector and its rate of change |
| $\mathbf x^*$, $\boldsymbol\delta=\mathbf x-\mathbf x^*$ | a fixed point; the deviation from it |
| $J_{ij}=\partial F_i/\partial x_j$ | the Jacobian at $\mathbf x^*$ |
| $\tau=\operatorname{tr}J$, $\Delta=\det J$ | trace and determinant (here $\tau$ is not a time constant) |
| $r_E$, $r_I$; $w_{XY}$; $P$, $Q$ | population rates (fractions of maximum); weights from $Y$ to $X$; external drives |

## State vectors and linear systems

A single linear ODE approaches its equilibrium monotonically, so it cannot explain a sag (Lesson 21) or adaptation (Lesson 22). Two coupled variables can. Systems of first-order ODEs are written $\dot{\mathbf x}=\mathbf F(\mathbf x,t)$, and Euler and `solve_ivp` work on vectors unchanged.

**Why it is true: the solution of ẋ = Ax**

If $A=P\Lambda P^{-1}$, with eigenvalues $\lambda_i$ and eigenvectors $\mathbf v_i$ (Lesson 6), put $\mathbf y=P^{-1}\mathbf x$. Then $\dot{\mathbf y}=\Lambda\mathbf y$, so each $y_i(t)=y_i(0)e^{\lambda_it}$, and

$$\mathbf x(t)=\sum_ic_i\,e^{\lambda_it}\,\mathbf v_i=e^{At}\mathbf x_0,\qquad\mathbf c=P^{-1}\mathbf x_0.$$

Modes decay if $\operatorname{Re}\lambda_i<0$. A complex pair $\alpha\pm i\omega$ gives combinations of $e^{\alpha t}\cos\omega t$ and $e^{\alpha t}\sin\omega t$: oscillation at angular frequency $\omega$, with decay time $1/\lvert\alpha\rvert$. For $\dot{\mathbf x}=A\mathbf x+\mathbf b$, apply this to $\mathbf x-\mathbf x^*$ with $\mathbf x^*=-A^{-1}\mathbf b$.

**A sag model.** With $u=V-E_L$ and a slow variable $w$: $\tau_m\dot u=-u-w+R_mI$ and $\tau_w\dot w=-w+gu$. For $\tau_m=30$ ms and $\tau_w=150$ ms, $g=0$ gives a monotone response, $g=0.5$ a sag, and $g=3$ a damped oscillation with eigenvalues $-0.02\pm0.022i$ ms⁻¹ (decay time 50 ms, period 284 ms). The modal formula matches $e^{At}$ to $10^{-13}$, and Euler with $\Delta t=0.1$ ms to 0.009 mV.

**Interactive figure.** The response of the sag model to −100 pA: the voltage u (blue) and the slow variable w (orange dashed), with the steady level R I/(1 + g) (grey). Slide or Play the coupling g from no sag, through a sag, to ringing.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=23&ix=sag-model&t=The%20response%20of%20the%20sag%20model%20to%20%E2%88%92100%20pA%3A%20the%20voltage%20u%20%28blue%29%20and%E2%80%A6)

## The phase plane

For two variables, every point of the plane carries an arrow $(\dot x,\dot y)$, and trajectories follow the arrows. **Nullclines** are the curves $\dot x=0$ (crossed vertically) and $\dot y=0$ (crossed horizontally); **fixed points** lie at their intersections. The **basin** of a stable fixed point is the set of starting states that end there; basins are separated by the stable manifold of a saddle.

**A decision circuit.** Two populations with self-excitation $w_s=0.6$ and cross-inhibition $w_c=1$ have two stable "decision" states, $(0.996,\ 0)$ and $(0,\ 0.996)$, and a saddle at $(0.208,\ 0.208)$ with eigenvalues 0.164 and −0.166 ms⁻¹. With equal inputs the diagonal splits the plane into mirror-image basins (49% of starts each); a larger input to one population enlarges its basin.

**Interactive figure.** The decision circuit's phase plane: nullclines of r₁ (blue) and r₂ (vermilion dashed), fixed points (filled: stable; open: saddle), basins (shaded) and the trajectory from a start you drag. Slide or Play the input bias to tilt the competition.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=23&ix=decision&t=The%20decision%20circuit%27s%20phase%20plane%3A%20nullclines%20of%20r%E2%82%81%20%28blue%29%20and%20r%E2%82%82%E2%80%A6)

## The Jacobian and stability

**Why it is true: linearisation and the trace–determinant test**

By the multivariable Taylor expansion (Lesson 14), $\mathbf F(\mathbf x^*+\boldsymbol\delta)=\mathbf F(\mathbf x^*)+J\boldsymbol\delta+O(\lvert\boldsymbol\delta\rvert^2)=J\boldsymbol\delta+O(\lvert\boldsymbol\delta\rvert^2)$, so small deviations obey $\dot{\boldsymbol\delta}=J\boldsymbol\delta$.

For a 2 × 2 $J$, $\det(J-\lambda I)=\lambda^2-\tau\lambda+\Delta$ with $\tau=\lambda_1+\lambda_2$ and $\Delta=\lambda_1\lambda_2$, so

$$\lambda_{1,2}=\tfrac12\big(\tau\pm\sqrt{\tau^2-4\Delta}\big).$$

- $\Delta<0$: real eigenvalues of opposite sign (a saddle).
- $\Delta>0$: both real parts have the sign of $\tau$; they are real if $\tau^2\ge4\Delta$ (a node) and complex if $\tau^2<4\Delta$ (a focus).

**Interactive figure.** Left: trajectories of ẋ = J x from 12 starts, with the eigenvector directions (vermilion dashed) when the eigenvalues are real. Right: J's position in the trace–determinant plane. Pick an example or set the four entries yourself; Play sweeps J₂₂.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=23&ix=linear-portraits&t=Left%3A%20trajectories%20of%20%E1%BA%8B%20%3D%20J%20x%20from%2012%20starts%2C%20with%20the%20eigenvector%E2%80%A6)

**Key point**

**Stable if and only if $\tau<0$ and $\Delta>0$.**

The sag model has $\tau=-(1/\tau_m+1/\tau_w)<0$ and $\Delta=(1+g)/(\tau_m\tau_w)>0$ for every $g\ge0$: increasing $g$ moves it from node to focus (at $g^*=\tau_m\tau_w\tau^2/4-1$, 0.8 here) but never makes it unstable.

A kick from the decision model's stable state decays at −0.0999 ms⁻¹, close to the Jacobian's slowest eigenvalue, −0.0975 ms⁻¹.

## The Wilson–Cowan model

$$\tau_E\dot r_E=-r_E+F_E(w_{EE}r_E-w_{EI}r_I+P),\qquad\tau_I\dot r_I=-r_I+F_I(w_{IE}r_E-w_{II}r_I+Q),$$

with $F(x)=1/(1+e^{-a(x-\theta)})-1/(1+e^{a\theta})$, $\tau_E=10$ ms, $\tau_I=20$ ms, $a_E=1.2$, $\theta_E=2.8$, $a_I=1$ and $\theta_I=4$ (adapted from Neuromatch Academy, CC-BY).

- **Set A** ($w_{EE}=9$, $w_{EI}=4$, $w_{IE}=13$, $w_{II}=11$, $P=0$) is **bistable**: a stable low state at $(0,\ 0)$ (a focus), a saddle at $(0.337,\ 0.168)$ and a stable high state at $(0.938,\ 0.672)$. Brief pulses switch the circuit on or off: persistent activity.
- **Set B** ($w_{EE}=6.4$, $w_{EI}=4.8$, $w_{IE}=6$, $w_{II}=1.2$, $P=0.9$) has a single fixed point, $(0.618,\ 0.320)$, with eigenvalues $0.0054\pm0.0635i$ ms⁻¹: an **unstable focus**. Trajectories spiral out onto a **limit cycle**: $r_E$ oscillates between 0.14 and 0.80 with period 163 ms (6.2 Hz). Excitation recruits inhibition with a delay; inhibition shuts excitation down; both decay; the cycle repeats.

**Interactive figure.** The Wilson–Cowan model. Left: nullclines of r_E (blue) and r_I (vermilion dashed), fixed points and the trajectory from a start you drag. Right: r_E and r_I over time. Switch between the bistable and oscillating parameter sets, and slide or Play the drive P.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=23&ix=wilson-cowan&t=The%20Wilson%E2%80%93Cowan%20model.)

**Bifurcations.** Sweeping $P$ in Set B:

- for weak drive there is a quiet stable state;
- at $P=0.65$–0.70 there are three fixed points (the quiet state, a saddle and an unstable focus);
- just above, the quiet state and the saddle collide and vanish (a **saddle-node** bifurcation), and the trajectory jumps onto a large limit cycle;
- oscillations persist up to $P\approx1$, where the focus's eigenvalues cross the imaginary axis (a **Hopf** bifurcation, $P=0.999$) and the amplitude shrinks to zero.

Frequencies range from 3.5 to 10.4 Hz; faster time constants move the rhythm towards the gamma range.

![Left: the range of r_E after transients against the drive P; the shaded band is the oscillation. Right: the largest real part of the fixed points' eigenvalues, for the upper fixed point (vermilion) and the quiet state (blue).](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson23/cell020_1.svg)
*Left: the range of r_E after transients against the drive P; the shaded band is the oscillation. Right: the largest real part of the fixed points' eigenvalues, for the upper fixed point (vermilion) and the quiet state (blue).*

## Mini-lab: a two-variable model of a sagging neuron

**Data.** Lesson 21's second neuron (pyABF sample `171116sh_0018.abf`, MIT licence): the mean of 17 responses to −100 pA.

**Fit.** One variable: $\tau_m=16.8$ ms, $R_m=112$ MΩ, RMSE 1.07 mV. Two variables ($\tau_m\dot u=-u-w+R_mI$, $\tau_w\dot w=-w+gu$): $\tau_m=33.8$ ms, $R_m=153$ MΩ, $\tau_w=208$ ms, $g=0.56$, RMSE 0.19 mV. The Jacobian's eigenvalues are real and negative (timescales 39 and 116 ms): a **stable node**. The cell would become a resonator only for $g>1.08$.

**Out-of-sample prediction.** After the current ends, $w$ is still negative and keeps depolarising the cell: the model predicts a rebound of +2.9 mV, 100–200 ms after release. Sweep 4, not used in the fit, shows +3.2 mV; the one-variable model predicts −0.1 mV.

![Left: one-variable (orange dotted) and two-variable (blue dashed) fits to the −100 pA step. Middle: the prediction of the rebound after release, against an unused sweep (black). Right: the fitted model's trajectory in the (u, w) plane, with its fixed point (pink).](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson23/cell025_1.svg)
*Left: one-variable (orange dotted) and two-variable (blue dashed) fits to the −100 pA step. Middle: the prediction of the rebound after release, against an unused sweep (black). Right: the fitted model's trajectory in the (u, w) plane, with its fixed point (pink).*

The exercise notebook applies a model-free linearity test (the on and off responses of any linear system are mirror images) to the first neuron, and finds that it fails: no linear model, of any size, fits both.

## Where this appears in neuroscience and machine learning

**Neuroscience.** Hodgkin–Huxley and its reductions (FitzHugh–Nagumo, Morris–Lecar, Izhikevich); subthreshold resonance; attractor models of working memory, decisions and head direction; E–I oscillations (PING gamma) and neural mass models for EEG and MEG; seizure onset and up/down states as bifurcations.

**Machine learning.** Continuous-time RNNs, neural ODEs and state-space sequence models; fixed-point and Jacobian analysis of trained RNNs; exploding and vanishing gradients as eigenvalues of recurrent Jacobians (Lesson 10); Hopfield networks; the stability of training dynamics.

**Common pitfall**

**Common mistakes to avoid.**

- **Forgetting that nullclines are not trajectories**: they mark where one rate is zero.
- **Linearising at a point that is not a fixed point**, or trusting the linearisation far from it.
- **Reading stability from the trace alone**: a negative trace with a negative determinant is still a saddle.
- **Missing fixed points** by searching from too few starting guesses.
- **Measuring oscillations before transients have died away**, or mistaking slow damping near a Hopf point for a limit cycle.

## Lesson summary

- $\dot{\mathbf x}=\mathbf F(\mathbf x)$; linear systems decompose into modes $e^{\lambda_it}\mathbf v_i$.
- Phase plane: nullclines, fixed points at their intersections, basins separated by saddles.
- The Jacobian $J=\partial\mathbf F/\partial\mathbf x$ at $\mathbf x^*$: stable if and only if $\operatorname{tr}J<0$ and $\det J>0$; oscillatory if $(\operatorname{tr}J)^2<4\det J$.
- Wilson–Cowan: recurrent excitation gives bistability; delayed inhibition gives limit cycles.
- Bifurcations happen where eigenvalues cross zero: saddle-node (fixed points appear or vanish) and Hopf (oscillations start or stop).
- A fitted two-variable model explains a sag and predicts a rebound; on/off asymmetry proves nonlinearity.

## Further reading

- S. H. Strogatz, *Nonlinear Dynamics and Chaos*, 2nd ed., Westview Press, 2015. Chapters 5–8.
- H. R. Wilson and J. D. Cowan, "Excitatory and inhibitory interactions in localized populations of model neurons", *Biophysical Journal* 12:1–24, 1972.
- E. M. Izhikevich, *Dynamical Systems in Neuroscience*, MIT Press, 2007. Chapters 1 and 4.
- W. Gerstner, W. M. Kistler, R. Naud and L. Paninski, *Neuronal Dynamics*, Cambridge University Press, 2014 (free online). Chapters 4, 6 and 16.
- Neuromatch Academy, Computational Neuroscience, W2D2 (linear systems) and W2D4 (Wilson–Cowan), CC-BY.
- S. W. Harden, pyABF (swharden.com/pyabf): the source of the recordings used here.
