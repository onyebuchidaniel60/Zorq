# Zorq

**Programmable authorization for privacy-preserving federated AI.**

Zorq lets a data owner authorize one of their registered data assets to participate in one specific federated-learning job for a defined purpose, scope and time window. A non-transferable ERC-721 DataLicense represents the right; the Portaldot EVM contract is the authoritative source of its lifecycle and authorization state. The execution coordinator checks that state before admitting participants and at each training-round boundary.

> **MVP limitation:** Zorq is an experimental testnet demonstration using synthetic data and a Flower FL adapter. It does not accept real personal, medical, financial or customer data. It does not currently claim native Portaldot FL, ZKP, homomorphic-encryption, differential-privacy or secure-aggregation integration.

## Project documents

- [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — product, MVP, user flows, requirements, business rules, data model, APIs, UX and security.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system architecture, smart contract, stack, service boundaries and deployment.
- [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) — phased build sequence and acceptance gates.
- [`AGENTS.md`](./AGENTS.md) — persistent instructions for implementation agents.
- [`AI_HANDOFF.md`](./AI_HANDOFF.md) — current project phase and verified state.
- [`docs/`](./docs/) — operator, developer, API, deployment, security, testing and design records.

## Status

This package is a pre-implementation blueprint. Application code, contract deployment, preview URL and test evidence do not exist yet. Follow `IMPLEMENTATION_PLAN.md` starting with Phase 0 read-only repository inspection. Do not assume a deployment URL, contract address or GitHub URL.

## Agreed MVP

- Portaldot V3 EVM testnet contract.
- One Solidity contract combining the ERC-721 DataLicense and authoritative registry.
- Non-transferable license bound to one asset and one FL job.
- SIWE wallet authentication for off-chain application sessions.
- Supabase PostgreSQL for off-chain metadata, indexing and audit history.
- Flower/PyTorch synthetic binary-classification FL demo (2–5 participants, 3 rounds).
- On-chain authorization snapshot at admission and each round boundary.
- Revocation between rounds excludes the participant from subsequent rounds.

## Architecture and scope authority

`PROJECT_SPEC.md` controls product behaviour and scope. `ARCHITECTURE.md` controls the agreed technical architecture. The agent must not change either without explicit operator approval. When an external integration is undocumented, report the gap and preserve the adapter boundary; do not invent APIs.

## Development setup

The exact setup is documented in [`docs/DEVELOPER_SETUP.md`](./docs/DEVELOPER_SETUP.md). The selected stack is Node.js 22.13+, npm workspaces, Python 3.12/uv, Docker, Hardhat 3, Next.js, Postgres and Flower. Exact compatible dependency versions must be pinned in lockfiles during Phase 1 after repository inspection. Do not silently upgrade major versions.

## Environment configuration

See [`docs/DEVELOPER_SETUP.md`](./docs/DEVELOPER_SETUP.md) and `ARCHITECTURE.md` section 11. Copy `.env.example` to the relevant local env file and fill secrets outside version control. Never commit secrets or put server-only variables in `NEXT_PUBLIC_*` variables. Preview and production must use separate databases and credentials.

## Testing

See [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md). Every phase follows:

`IMPLEMENT ONE PHASE → TEST → INSPECT → FIX → COMMIT → CHECKPOINT → STOP`.

Do not claim a test passed unless it was executed and the actual output supports that claim. Critical end-to-end flows must pass on the deployed preview before final visual-design work.

## Deployment

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md). The skeletal frontend must deploy to a stable Vercel Preview URL in Phase 1 and remain updated at verified checkpoints. Preview deployments use synthetic test data and testnet/sandbox integrations only. Production deployment requires separate operator authorization.

## Privacy and safety

See [`docs/SECURITY_AND_PRIVACY.md`](./docs/SECURITY_AND_PRIVACY.md). No raw dataset uploads are supported. FL does not itself guarantee that model updates or the final model reveal no information. Use only the generated synthetic partitions supplied by the project for the MVP demo.

## Links

- **Documentation:** `/docs` (must be a working in-app documentation destination once Phase 8 is complete).
- **GitHub:** not listed until the actual repository URL is read from the real git remote and confirmed public/approved. Never invent a destination or expose a private repository.
- **Portaldot explorer:** `https://scanner-testnet-v3.portaldot.dev/` (verify the relevant transaction/contract URL before linking it).
