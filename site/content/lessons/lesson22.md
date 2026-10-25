---
summary: "A neuron that spikes: the passive membrane plus threshold, reset and refractory period; rheobase, interspike intervals and the F–I curve; Gaussian and Poisson noise, regular and irregular firing; accurate spike timing in simulation; and a real neuron that refuses to be an LIF."
---

::: objectives
- Define the LIF neuron as passive subthreshold dynamics plus an event rule (threshold, reset, refractory period)
- Derive the rheobase, the interspike interval and the F–I curve, and explain their shape
- Simulate deterministic, Gaussian and Poisson drive; scale noise correctly with $\sqrt{\Delta t}$; explain fluctuation-driven, irregular firing
- Handle spike events accurately and test a simulation for time-step sensitivity
- Compare an LIF with a recorded neuron and name the assumptions that fail
:::

**Before you start.** This reading is the mathematical companion to the Lesson 22 teaching notebook. You need Lesson 21 (the membrane equation, exponential approach, Euler), Lesson 17 (the variance of sums, CV and Fano factor) and Lesson 18 (Poisson processes, the CLT). Boxes headed *Why it is true* hold short derivations: you can skip them on a first read.

| Symbol | Meaning (default) |
|---|---|
| $E_L$, $\theta$, $V_{\text{reset}}$ | resting potential (−70 mV), threshold (−50 mV), reset (−65 mV) |
| $\tau_m$, $R_m$, $t_{\text{ref}}$ | membrane time constant (20 ms), input resistance (100 MΩ), refractory period (2 ms) |
| $V_\infty=E_L+R_mI$ | the steady voltage for a constant current $I$ |
| $I_{\text{rh}}$, $T$, $f=1/T$ | rheobase, interspike interval, firing rate |
| $\sigma$; $\lambda$, $J$ | the SD of Gaussian membrane noise; Poisson input rate and jump size |

## The leaky integrate-and-fire model

::: keypoint
**Subthreshold:** $\tau_m\,dV/dt=-(V-E_L)+R_mI(t)$.

**Event:** when $V\ge\theta$, record a spike, set $V\leftarrow V_{\text{reset}}$ and hold it there for $t_{\text{ref}}$.

The LIF is a **hybrid system**: a continuous ODE between events and a discontinuous jump at each event. The action potential itself is replaced by a time stamp.
:::

With constant input below rheobase the LIF behaves exactly like Lesson 21's membrane and never fires; above it, it fires a perfectly regular train.

{{ interactive: lif-trace | An LIF neuron given a 200 ms current step from 50 to 250 ms; spikes are drawn as vertical lines. Slide or Play the current through rheobase (200 pA). }}

## Rheobase, interspike interval and the F–I curve

::: note Why it is true: the rheobase and the ISI formula
Without a threshold, $V\to V_\infty=E_L+R_mI$. The neuron fires if and only if $V_\infty>\theta$, that is, $I>I_{\text{rh}}=(\theta-E_L)/R_m$.

After a reset, $V(t)=V_\infty+(V_{\text{reset}}-V_\infty)e^{-t/\tau_m}$ (Lesson 21). Setting $V(t)=\theta$:

$$e^{-t/\tau_m}=\frac{V_\infty-\theta}{V_\infty-V_{\text{reset}}}\quad\Longrightarrow\quad T(I)=t_{\text{ref}}+\tau_m\ln\frac{V_\infty-V_{\text{reset}}}{V_\infty-\theta},\qquad f(I)=\frac1{T(I)}.$$
:::

**The shape of the curve.**

- As $I$ falls to $I_{\text{rh}}$, $V_\infty-\theta\to0^+$ and $T\to\infty$: the rate starts from zero (type I excitability) with infinite slope. With the defaults it is 9.8 spikes/s at 201 pA and 17.4 at 210 pA.
- For large $I$, $\ln\frac{V_\infty-V_{\text{reset}}}{V_\infty-\theta}\approx\frac{\theta-V_{\text{reset}}}{V_\infty}$, so $f$ grows roughly linearly, and $f\le1/t_{\text{ref}}$.
- $R_m$ sets the rheobase; $\tau_m$ does not affect it but scales every interval; a reset closer to $\theta$ shortens intervals.

{{ interactive: fi-curve | The F–I curve from the formula (blue), against the default neuron (grey dashed). The vermilion line marks the rheobase and the dotted line the ceiling 1/t_ref. Change τ_m, R_m, the reset and the refractory period, or press Play to sweep τ_m. }}

::: quiz
? With the defaults ($E_L=-70$, $\theta=-50$, $V_{\text{reset}}=-65$ mV, $\tau_m=20$ ms, $R_m=100$ MΩ, $t_{\text{ref}}=2$ ms), what is the rate at 300 pA?
- [ ] 300 spikes/s
- [x] about 49 spikes/s
- [ ] 0: the neuron is below rheobase
> $V_\infty=-70+30=-40$ mV, so $T=2+20\ln(25/10)=20.3$ ms and $f=49.2$ spikes/s.
:::

## Deterministic versus stochastic drive

::: note Why it is true: Euler–Maruyama and the √Δt scaling
For $\tau_m\,dV=-(V-E_L)\,dt+\sigma\sqrt{2\tau_m}\,dW$ (an Ornstein–Uhlenbeck process) the update is

$$V_{n+1}=V_n-\frac{\Delta t}{\tau_m}(V_n-E_L)+\sigma\sqrt{\frac{2\Delta t}{\tau_m}}\,\eta_n,\qquad\eta_n\sim\mathcal N(0,1).$$

Over a fixed time there are $T/\Delta t$ independent increments, and their variances add, so each must have variance proportional to $\Delta t$ for the total not to depend on the step. The stationary variance $s^2$ satisfies $s^2=(1-\Delta t/\tau_m)^2s^2+2\sigma^2\Delta t/\tau_m$, so $s^2\approx\sigma^2$ for small $\Delta t$; the autocorrelation decays as $e^{-\lvert u\rvert/\tau_m}$.
:::

**Mean-driven against fluctuation-driven firing.** Above rheobase with little noise, firing is regular (CV 0.14 at 250 pA, $\sigma=1$ mV). Below rheobase, fluctuations alone cause irregular firing (CV 0.71 at 170 pA, $\sigma=4$ mV).

{{ interactive: noise-drive | An LIF with Gaussian membrane noise: the first 500 ms of the voltage (left) and the interspike intervals over 5 s (right). Blue when the mean current is above rheobase, vermilion when below. Change the mean current and the noise, or press Play to sweep the noise. }}

Noise smooths the F–I curve: with $\sigma=5$ mV the rate is 15 spikes/s at 150 pA, where the deterministic neuron is silent.

{{ interactive: noise-fi | Firing rate against mean current: the noise-free formula (black) and simulations with membrane noise σ (green). Slide or Play σ. }}

**Poisson drive** (shot noise): inputs arrive at rate $\lambda$, each a jump of $J$ that decays with $\tau_m$. **Campbell's theorem** gives a mean depolarisation of $J\lambda\tau_m$ and a variance of $J^2\lambda\tau_m/2$. The simulation reproduces both: for $\lambda=2000$ s⁻¹ and $J=0.5$ mV, 19.9 and 2.23 mV against 20 and 2.24. Many small jumps per $\tau_m$ approximate Gaussian noise (the **diffusion approximation**).

{{ interactive: poisson-drive | An LIF driven only by excitatory Poisson inputs. Change the input rate and the jump size: the readout compares Campbell's mean and SD with the output rate and irregularity. }}

With Poisson input whose mean sits at or above threshold, the CV and Fano factor fall below 1 (0.2 and 0.05 at 4000 inputs/s): a single LIF with stationary input cannot produce the Fano factors above 1 seen in Lesson 17.

::: quiz
? Gaussian noise with $\sigma=2$ mV, $\tau_m=20$ ms and $\Delta t=0.1$ ms: what SD of noise is added at each step?
- [ ] 2 mV
- [x] 0.2 mV
- [ ] 0.01 mV
> $\sigma\sqrt{2\Delta t/\tau_m}=2\sqrt{0.2/20}=0.2$ mV.
:::

## Event handling and time-step sensitivity

Detecting threshold crossings only at grid points delays every spike, and therefore every reset, by up to $\Delta t$: the rate error is $O(\Delta t)$, however accurate the subthreshold update.

The fix has three parts: use the exact update $V_{n+1}=V_\infty+(V_n-V_\infty)e^{-\Delta t/\tau_m}$, interpolate the crossing $t^*=t_n+\Delta t\,(\theta-V_n)/(V_{n+1}-V_n)$, and time the reset from $t^*$. At 300 pA this reduces the error from 0.8 to 0.01 spikes/s at $\Delta t=1$ ms, with second-order convergence.

{{ interactive: event-timing | Error in the simulated firing rate at 300 pA against the time step: Euler with spikes on the grid (vermilion) and the exact update with interpolated crossings (blue dashed). Step through Δt to compare. }}

Adding noise without the $\sqrt{\Delta t}$ factor makes the membrane SD fall from 3.0 to 0.29 mV as $\Delta t$ goes from 1 to 0.01 ms: results that depend on $\Delta t$ signal a bug.

::: pitfall
**The LIF's assumptions:** a passive subthreshold membrane, a fixed sharp threshold, an instant spike and reset, no memory beyond the last spike (no adaptation), and current rather than conductance input. Each fails somewhere; check them against data before trusting predictions.
:::

## Mini-lab: does a real neuron behave like an LIF?

**Data.** Lesson 21's recording (pyABF sample `18711001.abf`, MIT licence), with 500 ms steps of 0–290 pA. Lesson 21 measured $E_L=-67.9$ mV, $\tau_m=17.5$ ms and $R_m=222$ MΩ.

**Measured.** Rheobase between 60 and 70 pA; first-spike threshold −34.6 mV (median); trough after the first spike −40.4 mV. The initial rate (1/first ISI) is 35 spikes/s at 290 pA, but only 14 spikes/s averaged over the step, because the intervals lengthen (last/first ISI 2.55, median).

**An LIF with the neuron's own parameters** predicts a rheobase of 150 pA and 201 spikes/s at 290 pA.

**A fitted LIF.** With $\tau_m$ fixed at 17.5 ms, the best fit to the initial-rate curve has an RMSE of 7.3 spikes/s and a reset pushed to the −120 mV search bound. The RMSE falls to 1.1 spikes/s only as $\tau_m$ is allowed to grow to 500 ms, with $R_m\approx540$ MΩ. Those parameters reproduce the curve but describe no membrane: the fit is phenomenological and sloppy.

{{ figure: cell028_1.svg | Left: recorded spike trains at 70, 150 and 290 pA. Middle: the measured F–I curve (initial and average rates), the LIF with the neuron's own parameters (vermilion) and the best fitted LIF (dashed). Right: fit error against the assumed τ_m. }}

The missing mechanisms are voltage-dependent currents near threshold (which lower the real rheobase), slow afterhyperpolarisation and adaptation (which lower real rates and lengthen intervals), and a threshold that rises during a train. The adaptive LIF adds $\tau_w\,dw/dt=-w$, with $w\leftarrow w+b$ at each spike: a second equation (Lesson 23).

## Where this appears in neuroscience and machine learning

**Neuroscience.** Point-neuron models of cortex, hippocampus and cerebellum; F–I curves and type I/II excitability; irregular firing in balanced networks and mean-field theory (Brunel, 2000); generalised and adaptive LIF models fitted to cell-type databases; simulators (NEST, Brian, NEURON) and spike-timing precision.

**Machine learning.** Spiking neural networks and neuromorphic hardware; surrogate-gradient training through the non-differentiable threshold; the F–I curve as an activation function (ReLU-like above threshold); event-based sensors; noise as regularisation.

::: pitfall
**Common mistakes to avoid.**

- **Forgetting the refractory clamp**, or letting $V$ integrate during it.
- **Scaling noise by $\Delta t$ instead of $\sqrt{\Delta t}$**, so that results change with the step.
- **Reporting rates from a single step size** without checking convergence, or locking spike times to the grid.
- **Reading LIF parameters fitted to an F–I curve as membrane properties.**
- **Assuming the mean input decides the output rate**: fluctuations matter as much.
:::

## Lesson summary

- LIF = passive membrane + threshold, reset and refractory period: a hybrid system.
- $I_{\text{rh}}=(\theta-E_L)/R_m$; $T=t_{\text{ref}}+\tau_m\ln\frac{V_\infty-V_{\text{reset}}}{V_\infty-\theta}$; $f=1/T$, saturating at $1/t_{\text{ref}}$.
- Gaussian noise: Euler–Maruyama with $\sigma\sqrt{2\Delta t/\tau_m}$. Poisson input: Campbell's mean $J\lambda\tau_m$ and variance $J^2\lambda\tau_m/2$.
- Noise allows irregular firing below rheobase and smooths the F–I curve.
- Interpolate threshold crossings, and rerun with half the step.
- Real neurons adapt and are not passive near threshold; an LIF captures them only phenomenologically.

## Exercises

These are pen-and-paper exercises that complement the coding exercises in the exercise notebook. Try each one before opening the answer.

::: exercise
An LIF has $E_L=-65$ mV, $\theta=-50$ mV and $R_m=250$ MΩ. Find its rheobase.
---answer---
$15\text{ mV}/250\text{ MΩ}=60$ pA.
:::

::: exercise
With the defaults ($E_L=-70$, $\theta=-50$, $V_{\text{reset}}=-65$ mV, $\tau_m=20$ ms, $R_m=100$ MΩ, $t_{\text{ref}}=2$ ms), find the ISI and the rate at 300 pA.
---answer---
$V_\infty=-40$ mV, so $T=2+20\ln(25/10)=2+18.33=20.33$ ms and $f=49.2$ spikes/s.
:::

::: exercise
For the defaults, find the first-spike latency from rest at 250 pA.
---answer---
$V_\infty=-45$ mV, and the climb from −70 mV takes $20\ln\frac{25}{5}=32.2$ ms.
:::

::: exercise
What is the maximum firing rate of an LIF with $t_{\text{ref}}=4$ ms?
---answer---
$1/(4\text{ ms})=250$ spikes/s.
:::

::: exercise
Show that for large $I$, $f(I)\approx\dfrac{R_mI}{\tau_m(\theta-V_{\text{reset}})}$ when $t_{\text{ref}}=0$ (to leading order).
---answer---
With $u=V_\infty-\theta$ large, $\ln\frac{u+(\theta-V_{\text{reset}})}{u}\approx\frac{\theta-V_{\text{reset}}}{u}$, and $u\approx R_mI$. So $T\approx\tau_m(\theta-V_{\text{reset}})/(R_mI)$.
:::

::: exercise
Doubling $\tau_m$ (same $R_m$): what happens to the rheobase, and to the rate at a current well above it?
---answer---
The rheobase is unchanged, because $\tau_m$ does not enter it. Every climb takes twice as long, so (with a negligible $t_{\text{ref}}$) the rate roughly halves.
:::

::: exercise
Gaussian noise with $\sigma=2$ mV, $\tau_m=20$ ms and $\Delta t=0.1$ ms: what is the SD of the noise added per step?
---answer---
$2\sqrt{2\times0.1/20}=0.2$ mV.
:::

::: exercise
Poisson input at 3000 inputs/s with $J=0.2$ mV and $\tau_m=20$ ms: find the mean and SD of the depolarisation.
---answer---
Mean $0.2\times3\times20=12$ mV; SD $\sqrt{0.04\times3\times20/2}=1.10$ mV.
:::

::: exercise
Keeping the mean of the previous exercise fixed, the jump size is quadrupled. How do $\lambda$ and the SD change?
---answer---
$\lambda$ falls to 750 inputs/s, and the SD doubles to 2.19 mV (the variance is proportional to $J^2\lambda=J\times$ mean).
:::

::: exercise
A simulation records spikes at grid points with $\Delta t=0.5$ ms. Roughly how large can each spike-time error be, and why does it accumulate?
---answer---
Up to 0.5 ms. Each reset starts late by the same error, so every interval is lengthened and the next spike inherits the delay: the rate is biased, not just jittered.
:::

::: exercise
Shunting inhibition multiplies $1/R_m$ and $1/\tau_m$ by $1+g$. Find the new rheobase for $g=0.25$ with the defaults.
---answer---
$R'=R_m/1.25$, so $I_{\text{rh}}'=1.25\times200=250$ pA.
:::

::: exercise
*(Challenge.)* With $V_{\text{reset}}=E_L$ and $t_{\text{ref}}=0$, show that $T=\tau_m\ln\frac{I}{I-I_{\text{rh}}}$. How does $f$ behave just above rheobase: linearly in $I-I_{\text{rh}}$, or otherwise?
---answer---
With $V_{\text{reset}}=E_L$, $T=\tau_m\ln\frac{R_mI}{R_mI-(\theta-E_L)}=\tau_m\ln\frac{I}{I-I_{\text{rh}}}$.

Just above rheobase this logarithm diverges, so $f=1/T\approx\big(\tau_m\ln\frac{I_{\text{rh}}}{I-I_{\text{rh}}}\big)^{-1}$: the rate rises like $-1/\ln(I-I_{\text{rh}})$, with infinite slope at rheobase, not linearly.
:::

## Practise in Python

The teaching notebook runs every example on this page; the exercise notebook has graded exercises worth 100 points, ending with a real-data exercise on the F–I curve of a second neuron. Both open in Google Colab.

{{ colab: week6/lesson22/Lesson22_Teaching_Notebook.ipynb Open the teaching notebook }} {{ colab: week6/lesson22/Lesson22_Exercises_Notebook.ipynb Open the exercise notebook }}

## Further reading

- W. Gerstner, W. M. Kistler, R. Naud and L. Paninski, *Neuronal Dynamics*, Cambridge University Press, 2014 (free online). Chapters 1, 6 and 8.
- P. Dayan and L. F. Abbott, *Theoretical Neuroscience*, MIT Press, 2001. Section 5.4.
- N. Brunel and M. C. W. van Rossum, "Lapicque's 1907 paper: from frogs to integrate-and-fire", *Biological Cybernetics* 97:337–339, 2007.
- N. Brunel, "Dynamics of sparsely connected networks of excitatory and inhibitory spiking neurons", *Journal of Computational Neuroscience* 8:183–208, 2000.
- R. Brette and W. Gerstner, "Adaptive exponential integrate-and-fire model as an effective description of neuronal activity", *Journal of Neurophysiology* 94:3637–3642, 2005.
- S. W. Harden, pyABF (swharden.com/pyabf): the source of the recordings used here.
