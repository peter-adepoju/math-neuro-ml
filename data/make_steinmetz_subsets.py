"""Derive the small Steinmetz files used in MAMBA exercises from the Neuromatch Academy release.

Source: steinmetz_part0.npz, steinmetz_part1.npz, steinmetz_part2.npz (Neuromatch Academy's
trial-binned version of Steinmetz et al., 2019; 39 sessions, 10 ms bins, stimulus onset at 0.5 s).
Download them from https://osf.io/agvxh, https://osf.io/uv3mw and https://osf.io/ehmw2 and put them next to this script.

Usage: python make_steinmetz_subsets.py
Writes steinmetz_s11_lederberg.npz and steinmetz_s25_radnitz.npz (each well under 1 MB).
"""
import numpy as np

SESSIONS = {11: "steinmetz_s11_lederberg.npz", 25: "steinmetz_s25_radnitz.npz"}
BIN_S = 0.01               # width of one time bin in the source files (s)
ONSET_BIN = 50             # stimulus onset at 0.5 s = bin 50
WIN = (55, 75)             # 50-250 ms after stimulus onset

alldat = []
for j in range(3):
    alldat += list(np.load(f"steinmetz_part{j}.npz", allow_pickle=True)["dat"])

for idx, fname in SESSIONS.items():
    d = alldat[idx]
    # spks has shape (n_neurons, n_trials, n_bins); sum the window and put trials on the rows.
    counts = d["spks"][:, :, WIN[0]:WIN[1]].sum(axis=2).T.astype(np.int16)    # (n_trials, n_neurons)
    np.savez_compressed(
        fname,
        counts=counts,                                          # spikes in the window, (n_trials, n_neurons)
        window_s=np.float64((WIN[1] - WIN[0]) * BIN_S),         # 0.2 s
        window_start_s=np.float64((WIN[0] - ONSET_BIN) * BIN_S),  # 0.05 s after stimulus onset
        brain_area=np.asarray(d["brain_area"]).astype(str),     # (n_neurons,)
        contrast_left=d["contrast_left"].astype(np.float64),    # (n_trials,), 0 to 1
        contrast_right=d["contrast_right"].astype(np.float64),  # (n_trials,), 0 to 1
        response=d["response"].astype(np.int8),                # (n_trials,): +1 turn left, -1 turn right, 0 no turn
        feedback_type=d["feedback_type"].astype(np.int8),      # (n_trials,): +1 rewarded, -1 not rewarded
        response_time_s=d["response_time"].ravel().astype(np.float64),  # (n_trials,)
        mouse_name=str(d["mouse_name"]), date_exp=str(d["date_exp"]), nma_session_index=idx,
    )
    print(fname, counts.shape, "max count", counts.max())
