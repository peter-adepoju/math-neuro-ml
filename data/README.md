# Data used in MAMBA exercises

## Steinmetz et al. (2019): Neuropixels recordings in mice doing a visual decision task

Mice saw a grating on the left, the right, both sides or neither, and turned a wheel to report which side had the higher contrast. Neuropixels probes recorded hundreds of neurons at once across many brain areas. All recordings were made in the **left hemisphere**, so right-side stimuli are contralateral.

The files here are small subsets of [Neuromatch Academy's trial-binned release](https://github.com/MouseLand/steinmetz2019_NMA) of the dataset. Each file holds one session, with spike counts summed over one window.

| File | NMA session | Mouse, date | Trials × neurons |
|---|---|---|---|
| `steinmetz_s11_lederberg.npz` | 11 | Lederberg, 2017-12-05 | 340 × 698 |
| `steinmetz_s25_radnitz.npz` | 25 | Radnitz, 2017-01-09 | 178 × 1056 |

### What each file contains

| Key | Shape | Meaning |
|---|---|---|
| `counts` | (n_trials, n_neurons) | spikes counted 50–250 ms after stimulus onset |
| `window_s` | scalar | window length, 0.2 s; divide `counts` by it to get spikes/s |
| `brain_area` | (n_neurons,) | Allen atlas acronym for each neuron (`root` means not assigned) |
| `contrast_left`, `contrast_right` | (n_trials,) | stimulus contrast on each side: 0, 0.25, 0.5 or 1 |
| `response` | (n_trials,) | wheel turn: +1 left, −1 right, 0 none |
| `feedback_type` | (n_trials,) | +1 rewarded, −1 not rewarded |
| `response_time_s` | (n_trials,) | time of response (s) |

`make_steinmetz_subsets.py` rebuilds these files from the Neuromatch release.

**Credit.** N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. The trial binning is by Neuromatch Academy (MouseLand/steinmetz2019_NMA).

### Motor-cortex sessions (spike trains in 10 ms bins, with wheel movement)

Two further sessions from the same release, keeping only neurons in primary motor cortex (MOp) and the whole 2.5 s of every trial:

| File | NMA session | Mouse, date | Trials × MOp neurons × bins |
|---|---|---|---|
| `steinmetz_s10_hench_mop.npz` | 10 | Hench, 2017-06-18 | 342 × 447 × 250 |
| `steinmetz_s28_radnitz_mop.npz` | 28 | Radnitz, 2017-01-12 | 128 × 180 × 250 |

| Key | Shape | Meaning |
|---|---|---|
| `spikes` | (n_trials, n_neurons, 250) | spike counts per 10 ms bin; the trial starts 0.5 s before stimulus onset |
| `wheel` | (n_trials, 250) | wheel velocity, encoder steps per 10 ms bin; positive values accompany `response` = +1 |
| `bin_s`, `stim_onset_s` | scalars | 0.01 s; 0.5 s |
| `contrast_left`, `contrast_right`, `response`, `feedback_type` | (n_trials,) | as above |
| `response_time_s`, `gocue_s` | (n_trials,) | times from the start of the trial (s) |
| `ccf` | (n_neurons, 3) | Allen atlas coordinates of each neuron (AP, DV, LR), µm |

`make_motor_subsets.py` rebuilds these files from the Neuromatch release.

**Licence.** The original Steinmetz et al. (2019) dataset is released under CC0 1.0 (public domain), via UCL's research data repository (doi:10.5522/04/9974357).

## Whole-cell current-clamp recordings (Lessons 21–22)

Two sample recordings distributed with [pyABF](https://github.com/swharden/pyABF) (MIT licence), reduced to 10 kHz. Each sweep injects current steps into one neuron and records its membrane potential. The cell type and preparation are not documented in the source.

| File | Source file | Sweeps × samples | Protocol |
|---|---|---|---|
| `patch_18711001_steps.npz` | `18711001.abf` | 30 × 15,000 (1.5 s) | every sweep: −100 pA for 0.3 s from 0.023 s; then a step of 0, 10, …, 290 pA (one per sweep) for 0.5 s from 0.823 s |
| `patch_171116sh_0018_steps.npz` | `171116sh_0018.abf` | 17 × 30,000 (3 s) | a step of −100, −75, …, 300 pA (one per sweep) from 0.147 to 0.647 s; −100 pA in every sweep from 1.147 to 1.647 s; the sweep's step again from 1.647 to 2.147 s |

| Key | Shape | Meaning |
|---|---|---|
| `v_cmV` | (n_sweeps, n_samples) | membrane potential in units of 0.01 mV (divide by 100 for mV) |
| `i_pA` | (n_sweeps, n_samples) | injected current command, pA |
| `fs_hz` | scalar | sampling rate, 10,000 Hz |

Two further files keep the depolarising steps at the full 20 kHz, for derivative-based analysis of action potentials:

| File | Sweeps × samples | Window |
|---|---|---|
| `patch_18711001_ap20k.npz` | 29 × 11,000 | 0.80–1.35 s of each sweep (steps of 10–290 pA) |
| `patch_171116sh_0018_ap20k.npz` | 12 × 11,000 | 0.12–0.67 s of each sweep (steps of 25–300 pA) |

Keys: `v_cmV` (membrane potential, 0.01 mV units), `step_pA` (current during the step, pA), `fs_hz` (20,000), `t0_s` (time of the first sample from the start of the sweep).

`make_patch_subsets.py` rebuilds all four files from the pyABF sample files.

**Credit.** S. W. Harden, pyABF (https://swharden.com/pyabf), sample data files `18711001.abf` and `171116sh_0018.abf`.
