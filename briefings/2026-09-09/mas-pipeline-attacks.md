# Adversarial attacks in multi-agent LLM pipelines

**Source:** [arXiv:2608.00718](https://arxiv.org/abs/2608.00718) · Aug 2026 (still high-signal for this week’s agent-security focus)

## Why it matters

Shows that once one agent accepts adversarial content, pipelines often propagate it as trusted input. Attack success tracked more with **pipeline structure** than backbone model strength.

## Key details

- Missing primitive: **boundary verification** across agents (content, identity, execution intent, state integrity)
- Attack surfaces: content injection, agent impersonation, plan deviation, memory poisoning
- Evaluated across GPT-5-mini, Claude Sonnet 4.5, Kimi K2.5 under matched pipelines
- Narrow success-rate spread across models vs larger spread across attack types → architecture dominates

## Defender action

Add explicit inter-agent checks (attestation/identity, plan verification, content tainting, state integrity). Do not treat a stronger model as a substitute for pipeline-level controls.