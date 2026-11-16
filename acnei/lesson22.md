**Learning objectives**

- Define the LIF neuron as passive subthreshold dynamics plus an event rule (threshold, reset, refractory period)
- Derive the rheobase, the interspike interval and the F–I curve, and explain their shape
- Simulate deterministic, Gaussian and Poisson drive; scale noise correctly with $\sqrt{\Delta t}$; explain fluctuation-driven, irregular firing
- Handle spike events accurately and test a simulation for time-step sensitivity
- Compare an LIF with a recorded neuron and name the assumptions that fail

**Before you start.** This reading is the mathematical companion to the Lesson 22 teaching notebook. You need Lesson 21 (the membrane equation, exponential approach, Euler), Lesson 17 (the variance of sums, CV and Fano factor) and Lesson 18 (Poisson processes, the CLT). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning (default) |
|---|---|
| $E_L$, $\theta$, $V_{\text{reset}}$ | resting potential (−70 mV), threshold (−50 mV), reset (−65 mV) |
| $\tau_m$, $R_m$, $t_{\text{ref}}$ | membrane time constant (20 ms), input resistance (100 MΩ), refractory period (2 ms) |
| $V_\infty=E_L+R_mI$ | the steady voltage for a constant current $I$ |
| $I_{\text{rh}}$, $T$, $f=1/T$ | rheobase, interspike interval, firing rate |
| $\sigma$; $\lambda$, $J$ | the SD of Gaussian membrane noise; Poisson input rate and jump size |

## The leaky integrate-and-fire model

**Key point**

**Subthreshold:** $\tau_m\,dV/dt=-(V-E_L)+R_mI(t)$.

**Event:** when $V\ge\theta$, record a spike, set $V\leftarrow V_{\text{reset}}$ and hold it there for $t_{\text{ref}}$.

The LIF is a **hybrid system**: a continuous ODE between events and a discontinuous jump at each event. The action potential itself is replaced by a time stamp.

With constant input below rheobase the LIF behaves exactly like Lesson 21's membrane and never fires; above it, it fires a perfectly regular train.

**Interactive figure.** An LIF neuron given a 200 ms current step from 50 to 250 ms; spikes are drawn as vertical lines. Slide or Play the current through rheobase (200 pA).

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=22&ix=lif-trace&t=An%20LIF%20neuron%20given%20a%20200%20ms%20current%20step%20from%2050%20to%20250%20ms%3B%E2%80%A6)

## Rheobase, interspike interval and the F–I curve

**Why it is true: the rheobase and the ISI formula**

Without a threshold, $V\to V_\infty=E_L+R_mI$. The neuron fires if and only if $V_\infty>\theta$, that is, $I>I_{\text{rh}}=(\theta-E_L)/R_m$.

After a reset, $V(t)=V_\infty+(V_{\text{reset}}-V_\infty)e^{-t/\tau_m}$ (Lesson 21). Setting $V(t)=\theta$:

$$e^{-t/\tau_m}=\frac{V_\infty-\theta}{V_\infty-V_{\text{reset}}}\quad\Longrightarrow\quad T(I)=t_{\text{ref}}+\tau_m\ln\frac{V_\infty-V_{\text{reset}}}{V_\infty-\theta},\qquad f(I)=\frac1{T(I)}.$$

**The shape of the curve.**

- As $I$ falls to $I_{\text{rh}}$, $V_\infty-\theta\to0^+$ and $T\to\infty$: the rate starts from zero (type I excitability) with infinite slope. With the defaults it is 9.8 spikes/s at 201 pA and 17.4 at 210 pA.
- For large $I$, $\ln\frac{V_\infty-V_{\text{reset}}}{V_\infty-\theta}\approx\frac{\theta-V_{\text{reset}}}{V_\infty}$, so $f$ grows roughly linearly, and $f\le1/t_{\text{ref}}$.
- $R_m$ sets the rheobase; $\tau_m$ does not affect it but scales every interval; a reset closer to $\theta$ shortens intervals.

**Interactive figure.** The F–I curve from the formula (blue), against the default neuron (grey dashed). The vermilion line marks the rheobase and the dotted line the ceiling 1/t_ref. Change τ_m, R_m, the reset and the refractory period, or press Play to sweep τ_m.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=22&ix=fi-curve&t=The%20F%E2%80%93I%20curve%20from%20the%20formula%20%28blue%29%2C%20against%20the%20default%20neuron%E2%80%A6)

## Deterministic versus stochastic drive

**Why it is true: Euler–Maruyama and the √Δt scaling**

For $\tau_m\,dV=-(V-E_L)\,dt+\sigma\sqrt{2\tau_m}\,dW$ (an Ornstein–Uhlenbeck process) the update is

$$V_{n+1}=V_n-\frac{\Delta t}{\tau_m}(V_n-E_L)+\sigma\sqrt{\frac{2\Delta t}{\tau_m}}\,\eta_n,\qquad\eta_n\sim\mathcal N(0,1).$$

Over a fixed time there are $T/\Delta t$ independent increments, and their variances add, so each must have variance proportional to $\Delta t$ for the total not to depend on the step. The stationary variance $s^2$ satisfies $s^2=(1-\Delta t/\tau_m)^2s^2+2\sigma^2\Delta t/\tau_m$, so $s^2\approx\sigma^2$ for small $\Delta t$; the autocorrelation decays as $e^{-\lvert u\rvert/\tau_m}$.

**Mean-driven against fluctuation-driven firing.** Above rheobase with little noise, firing is regular (CV 0.14 at 250 pA, $\sigma=1$ mV). Below rheobase, fluctuations alone cause irregular firing (CV 0.71 at 170 pA, $\sigma=4$ mV).

**Interactive figure.** An LIF with Gaussian membrane noise: the first 500 ms of the voltage (left) and the interspike intervals over 5 s (right). Blue when the mean current is above rheobase, vermilion when below. Change the mean current and the noise, or press Play to sweep the noise.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=22&ix=noise-drive&t=An%20LIF%20with%20Gaussian%20membrane%20noise%3A%20the%20first%20500%20ms%20of%20the%E2%80%A6)

Noise smooths the F–I curve: with $\sigma=5$ mV the rate is 15 spikes/s at 150 pA, where the deterministic neuron is silent.

**Interactive figure.** Firing rate against mean current: the noise-free formula (black) and simulations with membrane noise σ (green). Slide or Play σ.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=22&ix=noise-fi&t=Firing%20rate%20against%20mean%20current%3A%20the%20noise-free%20formula%20%28black%29%E2%80%A6)

**Poisson drive** (shot noise): inputs arrive at rate $\lambda$, each a jump of $J$ that decays with $\tau_m$. **Campbell's theorem** gives a mean depolarisation of $J\lambda\tau_m$ and a variance of $J^2\lambda\tau_m/2$. The simulation reproduces both: for $\lambda=2000$ s⁻¹ and $J=0.5$ mV, 19.9 and 2.23 mV against 20 and 2.24. Many small jumps per $\tau_m$ approximate Gaussian noise (the **diffusion approximation**).

**Interactive figure.** An LIF driven only by excitatory Poisson inputs. Change the input rate and the jump size: the readout compares Campbell's mean and SD with the output rate and irregularity.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=22&ix=poisson-drive&t=An%20LIF%20driven%20only%20by%20excitatory%20Poisson%20inputs.)

With Poisson input whose mean sits at or above threshold, the CV and Fano factor fall below 1 (0.2 and 0.05 at 4000 inputs/s): a single LIF with stationary input cannot produce the Fano factors above 1 seen in Lesson 17.

## Event handling and time-step sensitivity

Detecting threshold crossings only at grid points delays every spike, and therefore every reset, by up to $\Delta t$: the rate error is $O(\Delta t)$, however accurate the subthreshold update.

The fix has three parts: use the exact update $V_{n+1}=V_\infty+(V_n-V_\infty)e^{-\Delta t/\tau_m}$, interpolate the crossing $t^*=t_n+\Delta t\,(\theta-V_n)/(V_{n+1}-V_n)$, and time the reset from $t^*$. At 300 pA this reduces the error from 0.8 to 0.01 spikes/s at $\Delta t=1$ ms, with second-order convergence.

**Interactive figure.** Error in the simulated firing rate at 300 pA against the time step: Euler with spikes on the grid (vermilion) and the exact update with interpolated crossings (blue dashed). Step through Δt to compare.

[▶ Open this figure](https://peter-adepoju.github.io/math-neuro-ml/static/widget.html?lesson=22&ix=event-timing&t=Error%20in%20the%20simulated%20firing%20rate%20at%20300%20pA%20against%20the%20time%E2%80%A6)

Adding noise without the $\sqrt{\Delta t}$ factor makes the membrane SD fall from 3.0 to 0.29 mV as $\Delta t$ goes from 1 to 0.01 ms: results that depend on $\Delta t$ signal a bug.

**Common pitfall**

**The LIF's assumptions:** a passive subthreshold membrane, a fixed sharp threshold, an instant spike and reset, no memory beyond the last spike (no adaptation), and current rather than conductance input. Each fails somewhere; check them against data before trusting predictions.

## Mini-lab: does a real neuron behave like an LIF?

**Data.** Lesson 21's recording (pyABF sample `18711001.abf`, MIT licence), with 500 ms steps of 0–290 pA. Lesson 21 measured $E_L=-67.9$ mV, $\tau_m=17.5$ ms and $R_m=222$ MΩ.

**Measured.** Rheobase between 60 and 70 pA; first-spike threshold −34.6 mV (median); trough after the first spike −40.4 mV. The initial rate (1/first ISI) is 35 spikes/s at 290 pA, but only 14 spikes/s averaged over the step, because the intervals lengthen (last/first ISI 2.55, median).

**An LIF with the neuron's own parameters** predicts a rheobase of 150 pA and 201 spikes/s at 290 pA.

**A fitted LIF.** With $\tau_m$ fixed at 17.5 ms, the best fit to the initial-rate curve has an RMSE of 7.3 spikes/s and a reset pushed to the −120 mV search bound. The RMSE falls to 1.1 spikes/s only as $\tau_m$ is allowed to grow to 500 ms, with $R_m\approx540$ MΩ. Those parameters reproduce the curve but describe no membrane: the fit is phenomenological and sloppy.

![Left: recorded spike trains at 70, 150 and 290 pA. Middle: the measured F–I curve (initial and average rates), the LIF with the neuron's own parameters (vermilion) and the best fitted LIF (dashed). Right: fit error against the assumed τ_m.](https://peter-adepoju.github.io/math-neuro-ml/assets/lesson22/cell028_1.svg)
*Left: recorded spike trains at 70, 150 and 290 pA. Middle: the measured F–I curve (initial and average rates), the LIF with the neuron's own parameters (vermilion) and the best fitted LIF (dashed). Right: fit error against the assumed τ_m.*

The missing mechanisms are voltage-dependent currents near threshold (which lower the real rheobase), slow afterhyperpolarisation and adaptation (which lower real rates and lengthen intervals), and a threshold that rises during a train. The adaptive LIF adds $\tau_w\,dw/dt=-w$, with $w\leftarrow w+b$ at each spike: a second equation (Lesson 23).

## Where this appears in neuroscience and machine learning

**Neuroscience.** Point-neuron models of cortex, hippocampus and cerebellum; F–I curves and type I/II excitability; irregular firing in balanced networks and mean-field theory (Brunel, 2000); generalised and adaptive LIF models fitted to cell-type databases; simulators (NEST, Brian, NEURON) and spike-timing precision.

**Machine learning.** Spiking neural networks and neuromorphic hardware; surrogate-gradient training through the non-differentiable threshold; the F–I curve as an activation function (ReLU-like above threshold); event-based sensors; noise as regularisation.

**Common pitfall**

**Common mistakes to avoid.**

- **Forgetting the refractory clamp**, or letting $V$ integrate during it.
- **Scaling noise by $\Delta t$ instead of $\sqrt{\Delta t}$**, so that results change with the step.
- **Reporting rates from a single step size** without checking convergence, or locking spike times to the grid.
- **Reading LIF parameters fitted to an F–I curve as membrane properties.**
- **Assuming the mean input decides the output rate**: fluctuations matter as much.

## Lesson summary

- LIF = passive membrane + threshold, reset and refractory period: a hybrid system.
- $I_{\text{rh}}=(\theta-E_L)/R_m$; $T=t_{\text{ref}}+\tau_m\ln\frac{V_\infty-V_{\text{reset}}}{V_\infty-\theta}$; $f=1/T$, saturating at $1/t_{\text{ref}}$.
- Gaussian noise: Euler–Maruyama with $\sigma\sqrt{2\Delta t/\tau_m}$. Poisson input: Campbell's mean $J\lambda\tau_m$ and variance $J^2\lambda\tau_m/2$.
- Noise allows irregular firing below rheobase and smooths the F–I curve.
- Interpolate threshold crossings, and rerun with half the step.
- Real neurons adapt and are not passive near threshold; an LIF captures them only phenomenologically.

## Further reading

- W. Gerstner, W. M. Kistler, R. Naud and L. Paninski, *Neuronal Dynamics*, Cambridge University Press, 2014 (free online). Chapters 1, 6 and 8.
- P. Dayan and L. F. Abbott, *Theoretical Neuroscience*, MIT Press, 2001. Section 5.4.
- N. Brunel and M. C. W. van Rossum, "Lapicque's 1907 paper: from frogs to integrate-and-fire", *Biological Cybernetics* 97:337–339, 2007.
- N. Brunel, "Dynamics of sparsely connected networks of excitatory and inhibitory spiking neurons", *Journal of Computational Neuroscience* 8:183–208, 2000.
- R. Brette and W. Gerstner, "Adaptive exponential integrate-and-fire model as an effective description of neuronal activity", *Journal of Neurophysiology* 94:3637–3642, 2005.
- S. W. Harden, pyABF (swharden.com/pyabf): the source of the recordings used here.
