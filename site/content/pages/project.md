---
title: "Course project"
summary: "Answer one question about real or simulated neural data with the mathematics of the course, and present it."
---

The project brings the course together. In a team of two or three, you choose a question, answer it with the methods of the lessons, and present the answer with its uncertainty and its limits. A small question answered honestly is worth more than an ambitious one that is not checked.

## How it works

1. **Choose a question.** Pick one of the eight options below, or propose your own to your tutor.
2. **Reach the minimum result.** Each option names a minimum result every team can reach. The starter notebook loads the data, describes every array, and works the first step for you.
3. **Go further if you can.** Each option has stretch goals for strong teams.
4. **Present.** A 10-minute talk with 5 minutes of questions, an executed notebook that runs from top to bottom, and a one-page summary. You also review two other teams' talks.

## The eight options

| Option | Question | Data | Main mathematics | Starter |
|---|---|---|---|---|
| 1 | How well does mouse visual cortex predict the mouse's choice, and do other brain areas do better? | Steinmetz sessions 11 and 25 | projections, least squares, logistic fit by gradient descent, ROC, bootstrap | {{ colab: project/Project1_Starter.ipynb Open in Colab }} |
| 2 | How many dimensions does motor cortex need to decode wheel movement, and does the answer hold in a second mouse? | Steinmetz sessions 10 and 28 | least squares, PCA, ridge, validation | {{ colab: project/Project2_Starter.ipynb Open in Colab }} |
| 3 | How sure can we be of a mouse's psychometric curve? | Steinmetz sessions 11 and 25 | binomial likelihood, Bayes, logistic curve, bootstrap | {{ colab: project/Project3_Starter.ipynb Open in Colab }} |
| 4 | Are motor-cortex spike counts Poisson, and what makes them not? | Steinmetz sessions 10 and 28 | Fano factor, CV, Poisson rate models, law of total variance | {{ colab: project/Project4_Starter.ipynb Open in Colab }} |
| 5 | Is trial-to-trial variability shared across brain areas? | Steinmetz sessions 11 and 25 | covariance, PCA of residuals, variance of a sum | {{ colab: project/Project5_Starter.ipynb Open in Colab }} |
| 6 | How do action potentials change during a spike train? | patch clamp, 20 kHz | derivatives, finite differences, thresholds, bootstrap | {{ colab: project/Project6_Starter.ipynb Open in Colab }} |
| 7 | How much of a real neuron does a leaky integrate-and-fire model capture? | patch clamp, 10 kHz | passive membrane ODE, LIF, f–I curve, least squares | {{ colab: project/Project7_Starter.ipynb Open in Colab }} |
| 8 | When does an excitatory–inhibitory circuit oscillate? | simulation | coupled ODEs, Jacobian, eigenvalues, phase plane | {{ colab: project/Project8_Starter.ipynb Open in Colab }} |

## What a good project shows

| | A strong project | A weak project |
|---|---|---|
| Question | specific, answerable with the data, with a stated minimum result | vague, or needs data the course does not have |
| Method | mathematics from the course, applied correctly, checked against a simulation or known case | errors that change the answer; no checks |
| Data | shapes, units and splits stated; held-out testing wherever something is fitted | test data used for fitting; units unclear |
| Answer | stated with its uncertainty and the limits of the data | claims beyond what the figures show |
| Figures | each makes one point, with labelled axes and units | cluttered or unlabelled |
