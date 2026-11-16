**Learning objectives**

- Read a first-order ODE as a rule for the rate of change of a state; distinguish autonomous from non-autonomous equations
- Solve the linear relaxation equation, find equilibria and their stability, and interpret the time constant
- Derive the membrane equation from a circuit, check its units, and predict responses to steps, pulses and sinusoids
- Implement the Euler method, measure its local and global error, and explain its instability for large steps
- Fit the passive membrane to a recording and test where the model fails

**Before you start.** This reading is the mathematical companion to the Lesson 21 teaching notebook. You need Lesson 8 (the exponential and logarithm), Lesson 9 (derivatives, finite differences, the linear approximation), Lesson 13 (accumulation) and Lesson 6 (stability in discrete and continuous time). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning (typical unit) |
|---|---|
| $x(t)$, $dx/dt=f(x,t)$ | a state and its rate of change |
| $x^*$, $x_\infty$ | an equilibrium; the level approached for constant input |
| $\tau$ | a time constant (ms) |
| $V$, $E_L$ | membrane potential and leak reversal (resting) potential (mV) |
| $C_m$, $R_m$, $\tau_m=R_mC_m$ | membrane capacitance (pF), input resistance (MΩ), membrane time constant (ms) |
| $I(t)$ | injected current (pA) |
| $\Delta t$, $x_n\approx x(t_n)$ | the time step; the numerical approximation at step $n$ |

## The derivative as a rate of change of state

A **first-order ODE** specifies how fast a state changes: $dx/dt=f(x,t)$. It is **autonomous** if $f=f(x)$ (the rule never changes) and **non-autonomous** if it depends on time, usually through an input $I(t)$.

**Motivation.** 100 pA into a 100 pF capacitor charges it at $I/C=1$ mV/ms, so after 50 ms a perfect capacitor would have moved 50 mV. A membrane with 200 MΩ of leak moves 18.4 mV and levels off at 20 mV, because the leak current grows with the distance from rest.

**Interactive figure.** 100 pA into a 100 pF membrane: a perfect capacitor (orange dashed) against a capacitor with a leak (blue), which levels off at E_L + R I (grey). Change the current and the leak resistance, or press Play to sweep the resistance.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=21&ix=capacitor-leak&t=100%20pA%20into%20a%20100%20pF%20membrane%3A%20a%20perfect%20capacitor%20%28orange%20dashed%29%E2%80%A6)

At each point $(t,x)$ the equation gives a slope; a solution is a curve tangent to this **direction field** everywhere, and solutions from different starting points never cross.

**Interactive figure.** The direction field of the membrane equation (τ_m = 20 ms, R_m = 200 MΩ): every short line is the slope dV/dt at that time and voltage. Drag the starting voltage; switch between constant input and a current pulse from 20 to 60 ms.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=21&ix=direction-field&t=The%20direction%20field%20of%20the%20membrane%20equation%20%28%CF%84_m%20%3D%2020%20ms%2C%20R_m%20%3D%E2%80%A6)

## Initial-value problems, equilibria and time constants

An **initial-value problem** adds $x(t_0)=x_0$; for a smooth $f$ it has exactly one solution. An **equilibrium** $x^*$ satisfies $f(x^*)=0$. In one dimension it is stable if $f'(x^*)<0$ and unstable if $f'(x^*)>0$; the **phase line** shows the direction of motion on each side.

**Why it is true: the solution of the relaxation equation**

Let $\tau\,dx/dt=-(x-x_\infty)$ with constant $x_\infty$. Put $y=x-x_\infty$, so $dy/dt=-y/\tau$. Separating variables, $\int dy/y=-\int dt/\tau$, so $\ln\lvert y\rvert=-t/\tau+c$ and $y=y_0e^{-t/\tau}$. Hence

$$x(t)=x_\infty+(x_0-x_\infty)\,e^{-t/\tau}.$$

Check: $dx/dt=-(x_0-x_\infty)e^{-t/\tau}/\tau=-(x-x_\infty)/\tau$, and $x(0)=x_0$.

The fraction of the initial distance remaining after time $t$ is $e^{-t/\tau}$: 37% after $\tau$, 5% after $3\tau$, under 1% after $5\tau$. The half-life is $\tau\ln2$.

**Interactive figure.** The relaxation equation as the fraction of the distance covered (blue). Dots mark τ, 3τ and 5τ; the vermilion dashed line continues the initial slope, which would arrive in exactly τ. Slide or Play τ.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=21&ix=relaxation&t=The%20relaxation%20equation%20as%20the%20fraction%20of%20the%20distance%20covered%E2%80%A6)

**A nonlinear example.** A rate unit with recurrent excitation, $\tau\,dr/dt=-r+F(wr+I)$ with a sigmoid $F$, has one equilibrium for weak recurrence. For strong recurrence ($w=1$, $I=0$) it has two stable states, near 0 and 1, separated by an unstable one at 0.5. The unstable point is a threshold between two basins: the unit **remembers** which side it started on, a model of persistent activity.

**Interactive figure.** The phase line of a recurrent rate unit: τ dr/dt against r (blue), with arrows showing the direction of motion. Filled green circles are stable equilibria, open circles unstable. Change the recurrent weight and the input, or press Play to sweep the weight from one equilibrium to three.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=21&ix=phase-line&t=The%20phase%20line%20of%20a%20recurrent%20rate%20unit%3A%20%CF%84%20dr%2Fdt%20against%20r%20%28blue%29%2C%E2%80%A6)

## The membrane equation

**Why it is true: the membrane equation from Kirchhoff's current law**

The membrane is a capacitor $C_m$ in parallel with a leak resistor $R_m$ in series with a battery $E_L$. Injected current either charges the capacitor or leaks out:

$$I(t)=C_m\frac{dV}{dt}+\frac{V-E_L}{R_m}\quad\Longrightarrow\quad\tau_m\frac{dV}{dt}=-(V-E_L)+R_mI(t),\qquad\tau_m=R_mC_m.$$

For constant $I$ this is the relaxation equation with $V_\infty=E_L+R_mI$.

**Key point**

**Units.** MΩ × pF $=10^6\times10^{-12}$ s = 1 µs, so 200 MΩ × 100 pF = 20 ms. MΩ × pA = 1 µV, so 200 MΩ × 100 pA = 20 mV.

Because $C_m$ and $1/R_m$ both scale with membrane area, $\tau_m$ does not depend on cell size.

The equation is **linear** in $V-E_L$ and $I$, so responses scale with the input and add (superposition).

- A pulse much shorter than $\tau_m$ is integrated: 2 ms of 1000 pA (2 pC) gives a peak of 19.0 mV, close to $Q/C=20$ mV, while the same charge spread over 40 ms gives only 8.7 mV.
- Two brief inputs $\Delta$ apart sum with weight $e^{-\Delta/\tau_m}$: $\tau_m$ is the neuron's integration window.
- For a sinusoidal current of frequency $f$, the steady amplitude is $R_mI_0/\sqrt{1+(2\pi f\tau_m)^2}$: a **low-pass filter** with cutoff $1/(2\pi\tau_m)\approx8$ Hz for $\tau_m=20$ ms.

**Interactive figure.** The membrane (τ_m = 20 ms, R_m = 200 MΩ) driven three ways; the grey trace is the input current, scaled. Pulses of equal charge: vary the duration. Two brief pulses: vary the gap. A sinusoidal current: vary the frequency.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=21&ix=membrane-filter&t=The%20membrane%20%28%CF%84_m%20%3D%2020%20ms%2C%20R_m%20%3D%20200%20M%CE%A9%29%20driven%20three%20ways%3B%20the%E2%80%A6)

## The Euler method and numerical error

**Key point**

**Forward Euler:** $x_{n+1}=x_n+\Delta t\,f(x_n,t_n)$. For the membrane,

$$V_{n+1}=V_n+\frac{\Delta t}{\tau_m}\big(-(V_n-E_L)+R_mI_n\big).$$

**Why it is true: order and stability of Euler**

**Local error.** By Taylor's theorem, $x(t+\Delta t)=x(t)+\Delta t\,x'(t)+\tfrac12\Delta t^2x''(\xi)$; Euler omits the last term, so one step is wrong by $O(\Delta t^2)$.

**Global error.** Reaching a fixed time $T$ takes $T/\Delta t$ steps, so the accumulated error is $O(\Delta t)$: Euler is first order.

**Stability.** For $dx/dt=-x/\tau$, $x_{n+1}=(1-\Delta t/\tau)x_n$, so $x_n=(1-\Delta t/\tau)^nx_0$. It decays monotonically for $\Delta t<\tau$, oscillates while decaying for $\tau<\Delta t<2\tau$, and grows without bound for $\Delta t>2\tau$, although the true solution always decays.

**Interactive figure.** Left: the exact response to a 100 pA step (black) and the numerical steps (vermilion). Right: the maximum error against step size on log–log axes, with the current step marked. Slide or Play the step through the three regimes; switch to the exponential update to compare.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=21&ix=euler-steps&t=Left%3A%20the%20exact%20response%20to%20a%20100%20pA%20step%20%28black%29%20and%20the%E2%80%A6)

For a 100 pA step ($\tau=20$ ms), the maximum error over 100 ms is 0.19 mV at $\Delta t=1$ ms, and halves each time the step is halved (log–log slope 1.03). An adaptive Runge–Kutta solver (`solve_ivp`, RK45, `rtol` $10^{-6}$) reaches an error of $2\times10^{-5}$ mV with 92 evaluations of $f$; Euler would need about a million steps for the same accuracy.

For piecewise-constant input, the **exponential update** $V_{n+1}=V_\infty+(V_n-V_\infty)e^{-\Delta t/\tau_m}$ is exact and stable for any step. Rule of thumb: keep $\Delta t$ below a tenth of the fastest time constant, and check by halving it.

## Mini-lab: fitting the membrane equation to a real neuron

**Data.** A whole-cell current-clamp recording distributed with pyABF (`18711001.abf`, MIT licence; cell type undocumented): 30 sweeps at 10 kHz, each with −100 pA for 300 ms followed by a step of 0–290 pA.

**Fit.** A single exponential fitted to the mean response to −100 pA gives $E_L=-67.9$ mV, $\tau_m=17.5$ ms [95% bootstrap over sweeps 17.1, 17.8], $R_m=222$ MΩ [218, 226] and $C_m=\tau_m/R_m=79$ pF, with an RMSE of 0.38 mV. Euler with $\Delta t=0.1$ ms and a reference solver agree to within 0.02 mV, so numerical error is negligible here.

**Model checking.**

- **Recovery.** After the current ends, the voltage jumps 1.3 mV within 0.2 ms (an electrode artefact: about 13 MΩ of uncompensated series resistance), then recovers with an apparent time constant of 34 ms, twice the charging value. A single passive compartment predicts the same time constant on and off.
- **Depolarisation.** The model predicts 2.2 mV per 10 pA; the neuron deflects 3.0 mV at 10 pA and 25 mV at 60 pA, 1.4–1.9 times the prediction. Voltage-dependent inward currents raise the effective resistance near threshold.
- **Spikes.** From 70 pA the neuron fires, which the membrane equation cannot do.

![Left: the mean response to −100 pA (black) and the fitted passive model (vermilion dashed). Middle: depolarising steps, recording solid and model dashed. Right: steady deflection against current (black dots); the dashed line is the passive prediction.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson21/cell027_1.svg)
*Left: the mean response to −100 pA (black) and the fitted passive model (vermilion dashed). Middle: depolarising steps, recording solid and model dashed. Right: steady deflection against current (black dots); the dashed line is the passive prediction.*

The passive model is a **local** description, valid for small deflections around and below rest. The exercise notebook shows a second neuron with a 3 mV sag during hyperpolarisation, for which even the fitted time constant depends on the fitting window (17 to 35 ms).

## Where this appears in neuroscience and machine learning

**Neuroscience.** Membrane, synaptic, calcium and adaptation dynamics; integration windows and temporal summation; dendritic filtering; passive parameters from current steps; simulators such as NEURON, Brian and NEST; persistent activity as bistability.

**Machine learning.** Gradient descent is Euler's method on the gradient flow $d\theta/dt=-\nabla L$ (Lesson 12), and the learning-rate limit is Euler's stability limit. Exponential moving averages (momentum, Adam) are discretised relaxation equations. Continuous-time RNNs and neural ODEs are ODEs, and residual networks take Euler steps; spiking networks use leaky units.

**Common pitfall**

**Common mistakes to avoid.**

- **Mixing units**: MΩ × pF is microseconds, not milliseconds; MΩ × pA is microvolts.
- **Saying the response is complete after one time constant**: 37% remains.
- **Choosing $\Delta t$ comparable to $\tau$**, or never checking a simulation by halving the step.
- **Mistaking numerical artefacts for dynamics**: Euler's oscillations for $\tau<\Delta t<2\tau$ are not in the model.
- **Fitting a time constant without saying over which window**, or with a baseline that is not subtracted.
- **Applying the passive model far from rest** without checking linearity.

## Lesson summary

- An ODE gives the rate of change of a state; with an initial condition it has one solution.
- Equilibria solve $f(x^*)=0$; in one dimension they are stable if $f'(x^*)<0$.
- $\tau\,dx/dt=-(x-x_\infty)$ gives $x_\infty+(x_0-x_\infty)e^{-t/\tau}$: 63% of the way after $\tau$, 95% after $3\tau$.
- The membrane: $\tau_m\,dV/dt=-(V-E_L)+R_mI$ with $\tau_m=R_mC_m$; linear, low-pass, with integration window $\tau_m$.
- Euler: local error $O(\Delta t^2)$, global error $O(\Delta t)$, unstable for $\Delta t>2\tau$; compare with a reference solver.
- Real neurons are passive only near rest: check linearity, symmetry and sag.

## Further reading

- P. Dayan and L. F. Abbott, *Theoretical Neuroscience*, MIT Press, 2001. Sections 5.1–5.4.
- W. Gerstner, W. M. Kistler, R. Naud and L. Paninski, *Neuronal Dynamics*, Cambridge University Press, 2014 (free online). Chapter 1.
- S. H. Strogatz, *Nonlinear Dynamics and Chaos*, 2nd ed., Westview Press, 2015. Chapter 2.
- C. Koch, *Biophysics of Computation*, Oxford University Press, 1999. Chapter 1.
- S. W. Harden, pyABF (swharden.com/pyabf): the source of the recordings used here.
