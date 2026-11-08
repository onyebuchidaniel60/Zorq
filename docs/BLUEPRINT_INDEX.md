# Zorq — Implementation-Ready Blueprint Index

**Blueprint version:** 1.0  
**Prepared:** 4 November 2026  
**Status:** Pre-implementation. No application code, contract code or deployment has been created by this blueprint.

This index is the navigation page for the implementation handoff. It maps the 30 requested output areas to their source-of-truth documents. The agent must read `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md` and `AGENTS.md` before implementation.

## Handoff package

| Document | Authority / purpose |
|---|---|
| `PROJECT_SPEC.md` | Product definition, scope, roles, flows, functional requirements, business logic, data model, UI routes, APIs, database behaviour, authentication, security, integrations, edge cases and acceptance criteria. |
| `ARCHITECTURE.md` | Fixed stack, system components, contract design, service boundaries, authorization execution, database/API architecture, auth, deployment, environment variables, repo structure and operations. |
| `IMPLEMENTATION_PLAN.md` | Phase-by-phase autonomous build lifecycle and checkpoints. |
| `AGENTS.md` | Persistent implementation-agent constraints. |
| `AI_HANDOFF.md` | Verified project state, preview/deployment status, known issues, approvals and exact next task. |
| `README.md` | Repository landing documentation and developer entry point. |
| `docs/` | Developer setup, API reference, deployment, security/privacy, user guide, Portaldot validation, tests, design reference, decision log and checkpoint records. |

## Mapping to requested blueprint order

| Requested section | Source of truth |
|---|---|
| 1. Product definition | `PROJECT_SPEC.md` §1 |
| 2. MVP scope | `PROJECT_SPEC.md` §2 |
| 3. User roles | `PROJECT_SPEC.md` §1.4–1.5 |
| 4. Complete user flows | `PROJECT_SPEC.md` §3 |
| 5. Functional requirements | `PROJECT_SPEC.md` §4 |
| 6. Business logic/state machines | `PROJECT_SPEC.md` §5; contract state in `ARCHITECTURE.md` §5 |
| 7. Data model | `PROJECT_SPEC.md` §6 |
| 8. System architecture | `ARCHITECTURE.md` §3, §6–8 |
| 9. Technology stack | `ARCHITECTURE.md` §4 |
| 10. API specification | `PROJECT_SPEC.md` §8; `docs/API_REFERENCE.md` |
| 11. Database operations | `PROJECT_SPEC.md` §9; `ARCHITECTURE.md` §8 |
| 12. Authentication/authorization | `PROJECT_SPEC.md` §10; `ARCHITECTURE.md` §9 |
| 13. Security architecture | `PROJECT_SPEC.md` §11; `docs/SECURITY_AND_PRIVACY.md` |
| 14. UI/UX architecture | `PROJECT_SPEC.md` §7 |
| 15. Design reference image / visual waiver | `IMPLEMENTATION_PLAN.md` Phase 6–7; `docs/DESIGN_DECISIONS.md`; `docs/DESIGN_APPROVAL.md` |
| 16. Third-party integrations | `PROJECT_SPEC.md` §12; `ARCHITECTURE.md` §2, §4, §10 |
| 17. AI architecture | `PROJECT_SPEC.md` §13 — no LLM/AI-agent component in MVP; FL model training is deterministic ML execution |
| 18. Payment architecture | `PROJECT_SPEC.md` §13 — no product payments/escrow in MVP; users pay their own testnet transaction gas |
| 19. Admin/operations | `PROJECT_SPEC.md` §13; `ARCHITECTURE.md` §13; `docs/DEPLOYMENT.md` |
| 20. Error/edge-case matrix | `PROJECT_SPEC.md` §14 |
| 21. Test strategy | `PROJECT_SPEC.md` §15; `docs/TEST_PLAN.md` |
| 22. Repository structure | `ARCHITECTURE.md` §12 |
| 23. Environment configuration | `ARCHITECTURE.md` §11; `docs/DEVELOPER_SETUP.md` |
| 24. Phased implementation plan | `IMPLEMENTATION_PLAN.md` |
| 25. `PROJECT_SPEC.md` | Full file included |
| 26. `ARCHITECTURE.md` | Full file included |
| 27. `IMPLEMENTATION_PLAN.md` | Full file included |
| 28. `AGENTS.md` | Full file included |
| 29. `AI_HANDOFF.md` | Full file included |
| 30. Final pre-implementation audit | `docs/PRE_IMPLEMENTATION_AUDIT.md` |

## Locked product/architecture decisions

1. DataLicense is a specific-job participation right, not general dataset access.
2. A DataLicense binds one asset, one job, one purpose/configuration commitment, one validity window and the asset owner's wallet.
3. The token is non-transferable. The asset owner controls issue/revocation.
4. One Solidity EVM `ZorqRegistry` contract is the sole authority for asset/job/license lifecycle in the MVP. No EVM-to-WASM contract bridge is assumed.
5. Postgres mirrors/indexes metadata; it cannot grant authorization.
6. Each run/round uses one authorization snapshot at a single confirmed Portaldot block. The snapshot allowlist governs both training and aggregation.
7. Revocation after a round snapshot does not retroactively cancel that round; the following round excludes the participant.
8. RPC or authorization uncertainty fails closed.
9. Flower is the MVP execution adapter using synthetic data. Native Portaldot FL and ZKP are not claimed without a documented and verified external API.
10. Final UI style comes from an operator-supplied reference image committed under `docs/design/reference/`; the mockup/approval loop is covered by the explicit waiver, and Phase 7 implements the reference directly with Stageshow.

## Known facts and unverified dependencies

- Portaldot V3 testnet values are recorded in `ARCHITECTURE.md` and `docs/PORTALDOT_VALIDATION.md`; Phase 0/3 must verify live chain ID/RPC and EVM funding.
- Portaldot advertises native FL/ZKP/HE features in older high-level developer material, but an externally callable FL orchestration API and ZKP proof API are not established by the public docs reviewed. These are future adapter candidates, not MVP requirements.
- Actual repository URL, Vercel preview URL, deployed commit, contract address and deployment transaction do not exist in this blueprint. `AI_HANDOFF.md` intentionally marks them as unknown/not deployed. Never fabricate values.
- Hackathon deadline surfaced as 6 November 2026, 04:00 UTC / 05:00 WAT; re-check the official DoraHacks page before submission in case the schedule changes.

## Operator decision points

The project runs autonomously after prerequisites are supplied. The only operator decision points are:

- Phase 0 Prerequisites Manifest completion (one-time input).
- Hard blockers defined in `AGENTS.md` §1.1 (missing credential, unavailable external service, Portaldot testnet outage).
- Production/mainnet deployment is out of scope and not a decision point.

All other decisions are made by the agent, logged in `AI_HANDOFF.md`'s Decision Log, and executed without approval.

## Current project state

`AI_HANDOFF.md` is the live continuity record and `docs/AUTONOMOUS_EXECUTION.md` defines the execution contract. At package creation: pre-implementation, no code written, no repo inspected, no preview deployed, no design reference supplied, no contract deployed and no automated tests run. Phases 1–10 run autonomously after the Phase 0 Prerequisites Manifest is supplied.
