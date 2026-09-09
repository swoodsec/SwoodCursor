# SoK: When Safe Agents Fail Together (multi-agent LLM security)

**Source:** [arXiv:2609.00595](https://arxiv.org/abs/2609.00595) · Sep 1, 2026

## Why it matters

Systematizes why individually “safe” agents still fail in multi-agent systems (MAS): risk emerges at interaction boundaries where information, state, decisions, and authority cross principals.

## Key details

- Survey/systematization of **197** works: 6 interaction interfaces, 4 adversary positions, 7 system-level risks, 8 recurring attack paths
- Introduces **A-I-R** framing: Adversary position × Interaction interface → system-level Risk
- Defense lens as a five-part contract (path target, observation, intervention, trust boundary, recovery)
- Gap call-outs: path closure, recovery, isolating interaction effects in evals, and open-system benchmarks

## Defender action

For agentic products/SOCs using multi-agent workflows, design controls at **delegation boundaries** (identity, content, intent, state), not only per-prompt filters. Trace attacks end-to-end and test whether defenses actually close those paths.