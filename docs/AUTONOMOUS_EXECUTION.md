# Autonomous Execution Model

Zorq is built by OpenCode in a single autonomous run from Phase 1 through Phase 10 after the Phase 0 Prerequisites Manifest is supplied by the operator.

## Contract

- Prerequisites: supplied once, at Phase 0 sign-off. Nothing is requested mid-build except hard blockers.
- Decisions: made by the agent using the source docs, logged in `AI_HANDOFF.md`'s Decision Log, executed without approval.
- Phase reports: for the record, not for approval. The agent commits and continues.
- Deviations from `ARCHITECTURE.md` or `PROJECT_SPEC.md`: permitted only when unavoidable; logged with rationale; committed separately.
- Tests: must actually pass. Failing tests are fixed, or logged as Known Limitations with full evidence if unfixable after three attempts. Business-rule assertions are never weakened.
- Stop conditions: only those in `AGENTS.md` §1.1 — missing credential not on the manifest, unavailable external service, Portaldot outage, or a required input that cannot be generated or inferred.

## Why this works

The Prerequisites Manifest front-loads every input the agent will need. The Decision Log and Known Limitations sections mean the operator can review every judgment call after the build, without being in the loop during it. Git history (one commit per phase, one per decision) makes the whole run auditable.

## What the operator does

1. Review the Phase 0 report + Prerequisites Manifest.
2. Fill in every row.
3. Reply `execute`.
4. Review the final result: git log, `AI_HANDOFF.md` Decision Log, `AI_HANDOFF.md` Known Limitations, deployed preview URL, contract address, demo video.

## What the operator does NOT do

- Approve individual phases.
- Approve design mockups (covered by the visual waiver; reference image is authoritative).
- Approve deployment (testnet-only, out of scope for production).
- Answer questions mid-build.
