"""Derive the small current-clamp files used in MAMBA Lessons 21-22 from two pyABF sample recordings.

Source: the pyABF repository (https://github.com/swharden/pyABF, MIT licence, commit 3ad9cd6),
files data/abfs/18711001.abf and data/abfs/171116sh_0018.abf. Copy them next to this script and run
    pip install pyabf
    python make_patch_subsets.py
Writes patch_18711001_steps.npz and patch_171116sh_0018_steps.npz (each under 1.5 MB).

Both are whole-cell current-clamp recordings sampled at 20 kHz; we keep every second sample (10 kHz).
Voltage is stored as int16 in units of 0.01 mV and the injected current as int16 in pA, to keep files small.
"""
import numpy as np
import pyabf

FILES = {"18711001.abf": "patch_18711001_steps.npz", "171116sh_0018.abf": "patch_171116sh_0018_steps.npz"}
KEEP = 2                                                    # 20 kHz -> 10 kHz

for src, dst in FILES.items():
    abf = pyabf.ABF(src)
    V, I = [], []
    for s in range(abf.sweepCount):
        abf.setSweep(s)
        V.append(abf.sweepY[::KEEP]); I.append(abf.sweepC[::KEEP])
    V, I = np.array(V), np.array(I)                          # (n_sweeps, n_samples) mV and pA
    np.savez_compressed(
        dst,
        v_cmV=np.round(V * 100).astype(np.int16),           # membrane potential, units of 0.01 mV
        i_pA=np.round(I).astype(np.int16),                  # injected current command, pA
        fs_hz=np.float64(abf.dataRate / KEEP),              # sampling rate after decimation
        protocol=np.str_(abf.protocol),
        source=np.str_(f"pyABF sample file {src} (github.com/swharden/pyABF, MIT licence)"),
    )
    print(dst, V.shape, f"{abf.dataRate / KEEP:.0f} Hz")
