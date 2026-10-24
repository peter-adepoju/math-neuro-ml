---
title: "Resources"
summary: "Running the notebooks, the datasets used in the course, and credits."
---

## Running the notebooks

Every lesson has two notebooks: a **teaching notebook** that runs each example from the reading, and an **exercise notebook** with graded tasks. Both open in Google Colab, which runs Python in your browser.

1. Click an "Open in Colab" button on a lesson page.
2. Sign in with a Google account if asked.
3. Choose **Runtime → Run all**, or run the cells one at a time with Shift+Enter.
4. To keep your work, choose **File → Save a copy in Drive**.

Notebooks that use real data download a small file the first time they run, so you need an internet connection.

## Datasets

All the recordings are openly licensed and stored in the course repository's [data folder](https://github.com/peter-adepoju/math-neuro-ml/tree/main/data).

| Recording | What it contains | Licence | Used in |
|---|---|---|---|
| Mouse visual decision task, Neuropixels, sessions 11 and 25 | spike counts of 698 and 1056 neurons across the brain, 50–250 ms after a grating appears, with the contrasts shown and the mouse's choice on each trial | CC0 | Parts I–III |
| Mouse motor cortex with wheel movement, sessions 10 and 28 | spike counts of 447 and 180 neurons in primary motor cortex in 10 ms bins over 2.5 s trials, with wheel velocity | CC0 | Parts I–III |
| Whole-cell current clamp, two cells | membrane potential during current steps, at 10 kHz and 20 kHz | MIT | Parts II and IV |

## Credits

The course, its notebooks, notes and interactive figures were created by **Peter Adepoju**.

- N. A. Steinmetz, P. Zatka-Haas, M. Carandini and K. D. Harris, "Distributed coding of choice, action and engagement across the mouse brain", *Nature* 576:266–273, 2019. Data released under CC0; the subsets used here were made from the Neuromatch Academy version.
- S. W. Harden, pyABF, sample recordings `18711001.abf` and `171116sh_0018.abf` (MIT licence). The cell type and preparation are not documented.
- Some ideas and the Wilson–Cowan parameters of Lesson 23 are adapted from Neuromatch Academy (CC-BY).
- Maths on these pages is typeset with KaTeX; interactive notebook figures use Plotly.
