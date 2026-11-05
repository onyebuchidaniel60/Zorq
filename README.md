# Zorq

**Programmable authorization for privacy-preserving federated AI.**

Zorq lets a data owner authorize one of their registered data assets to participate in one specific federated-learning job for a defined purpose, scope and time window. A non-transferable ERC-721 DataLicense represents the right; the Portaldot EVM contract is the authoritative source of its lifecycle and authorization state. The execution coordinator checks that state before admitting participants and at each training-round boundary.

> **MVP limitation:** Zorq is an experimental testnet demonstration using synthetic data and a Flower FL adapter. It does not accept real personal, medical, financial or customer data. It does not currently claim native Portaldot FL, ZKP, homomorphic-encryption, differential-privacy or secure-aggregation integration.

## Project documents

- [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — product, MVP, user flows, requirements, business rules, data model, APIs, UX and security.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system architecture, smart contract, stack, service boundaries and deployment.
- [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) — autonomous phased build sequence and checkpoints.
- [`AGENTS.md`](./AGENTS.md) — persistent instructions for implementation agents.
- [`AI_HANDOFF.md`](./AI_HANDOFF.md) — current project phase and verified state.
- [`PREREQUISITES.md`](./PREREQUISITES.md) — the Phase 0 prerequisites manifest the operator fills before autonomous execution.
- [`docs/AUTONOMOUS_EXECUTION.md`](./docs/AUTONOMOUS_EXECUTION.md) — the autonomous execution contract for Phases 1–10.
- [`docs/`](./docs/) — operator, developer, API, deployment, security, testing, demo-video and design records.

## Status

**Phase 2 complete — wallet authentication, sessions and Postgres foundation.**

- Stable preview: <https://zorq-preview-uhhh2.vercel.app>
- Wallet sign-in uses an EIP-4361 SIWE message signed by the user's Substrate sr25519 account; the server verifies the signature and binds the SS58 account to its chain-derived H160.
- Postgres (Neon via Vercel) stores users, one-use nonces, audit events, idempotency records and rate-limit buckets. Migrations are versioned in `packages/db/migrations`.
- Asset registration, job creation, licensing and Flower training remain Phases 3–4. Unfinished controls stay disabled and labelled.
- Portaldot V3 EVM testnet chain ID `420420777` is verified live. The contract is not deployed yet.
- Design reference images and a reference video are committed under `docs/design/reference/` and `docs/demo/reference/`. They are not used for styling until Phase 7 and demo production.
- Source documents remain authoritative. See [`AI_HANDOFF.md`](./AI_HANDOFF.md) for current verification evidence, decisions and known limitations.

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

`PROJECT_SPEC.md` controls product behaviour and scope. `ARCHITECTURE.md` controls the agreed technical architecture. Deviations are permitted only when unavoidable, logged in `AI_HANDOFF.md`'s Decision Log, and committed separately. When an external integration is undocumented, report the gap and preserve the adapter boundary; do not invent APIs.

## Development setup

The exact setup is documented in [`docs/DEVELOPER_SETUP.md`](./docs/DEVELOPER_SETUP.md). The implemented stack is Node.js `22.23.4` (pinned in `.nvmrc`), npm workspaces, Python 3.12 with `uv`, Hardhat 3, Next.js 16.4.5, Postgres and Flower. Docker is not required locally: local Postgres parity uses `psql`, staging uses Neon via the Vercel integration, and Render builds the FL Dockerfile remotely. See Decision D-001 in `AI_HANDOFF.md`.

Quick start:

```bash
nvm use
npm install
npm run dev -- --port 3100
```

Checks:

```bash
npm run typecheck
npm run lint
npm run build
npm run test
npm run test:auth        # real API + Neon integration; starts a local server
npx playwright install chromium
npm run test:e2e
```

Local env values live in the gitignored repository-level `.env.local` and are loaded by `next.config.ts`. Hosted Preview values are managed in Vercel project settings. Apply committed migrations with `npm run db:migrate`.

Exact compatible dependency versions are pinned in `package-lock.json`. Do not silently upgrade major versions.

## Environment configuration

See [`docs/DEVELOPER_SETUP.md`](./docs/DEVELOPER_SETUP.md) and `ARCHITECTURE.md` section 11. Copy `.env.example` to the relevant local env file and fill secrets outside version control. Never commit secrets or put server-only variables in `NEXT_PUBLIC_*` variables. Preview and production must use separate databases and credentials.

## Testing

See [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md). Every phase follows:

`IMPLEMENT → TEST → INSPECT → FIX → COMMIT → CHECKPOINT → CONTINUE`.

Do not claim a test passed unless it was executed and the actual output supports that claim. Critical end-to-end flows must pass on the deployed preview before final visual-design work.

## Deployment

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md). The skeletal frontend must deploy to a stable Vercel Preview URL in Phase 1 and remain updated at verified checkpoints. Preview deployments use synthetic test data and testnet/sandbox integrations only. Production deployment is out of scope for the MVP.

## Privacy and safety

See [`docs/SECURITY_AND_PRIVACY.md`](./docs/SECURITY_AND_PRIVACY.md). No raw dataset uploads are supported. FL does not itself guarantee that model updates or the final model reveal no information. Use only the generated synthetic partitions supplied by the project for the MVP demo.

## Links

- **Documentation:** `/docs` (working in-app destination in the current preview).
- **GitHub:** <https://github.com/onyebuchidaniel60/Zorq> (actual public repository, read from the git remote).
- **Portaldot explorer:** `https://scanner-testnet-v3.portaldot.dev/` (verify the relevant transaction/contract URL before linking it).
