"""Derive the Steinmetz motor-cortex files used in MAMBA (wheel decoding, dynamics, PCA, Poisson models, spike-train variability).

Source: steinmetz_part0.npz, steinmetz_part1.npz, steinmetz_part2.npz, Neuromatch Academy's trial-binned version of
Steinmetz et al. (2019) (39 sessions, 10 ms bins, stimulus onset at 0.5 s). The original dataset is released under CC0 1.0.
Download the three files from https://osf.io/agvxh, https://osf.io/uv3mw and https://osf.io/ehmw2 and put them next to this script.

Usage: python make_motor_subsets.py
Writes steinmetz_s10_hench_mop.npz (342 trials, 447 MOp neurons) and steinmetz_s28_radnitz_mop.npz (128 trials, 180 MOp neurons).
"""
import numpy as np

SESSIONS = {10: "steinmetz_s10_hench_mop.npz", 28: "steinmetz_s28_radnitz_mop.npz"}
AREA = "MOp"                                    # primary motor cortex

alldat = []
for j in range(3):
    alldat += list(np.load(f"steinmetz_part{j}.npz", allow_pickle=True)["dat"])

for idx, fname in SESSIONS.items():
    d = alldat[idx]
    keep = np.asarray(d["brain_area"]).astype(str) == AREA
    np.savez_compressed(
        fname,
        spikes=d["spks"][keep].transpose(1, 0, 2).astype(np.uint8),   # (n_trials, n_neurons, 250) spike counts per 10 ms bin
        wheel=d["wheel"][0].astype(np.int8),                          # (n_trials, 250) wheel velocity, encoder steps per 10 ms bin
        bin_s=np.float64(d["bin_size"]),                              # 0.01 s
        stim_onset_s=np.float64(d["stim_onset"]),                     # 0.5 s after trial start
        contrast_left=d["contrast_left"].astype(float),               # (n_trials,)
        contrast_right=d["contrast_right"].astype(float),             # (n_trials,)
        response=d["response"].astype(int),                           # (n_trials,) +1, -1, or 0 (no response)
        response_time_s=d["response_time"].ravel().astype(float),    # (n_trials,) from trial start
        gocue_s=d["gocue"].ravel().astype(float),                     # (n_trials,) from trial start
        feedback_type=d["feedback_type"].astype(int),                 # (n_trials,) +1 rewarded, -1 not
        ccf=d["ccf"][keep].astype(np.float32),                        # (n_neurons, 3) Allen CCF coordinates (AP, DV, LR), um
        mouse=np.str_(d["mouse_name"]), date=np.str_(d["date_exp"]),
    )
    print(fname, int(keep.sum()), "neurons", d["spks"].shape[1], "trials")
