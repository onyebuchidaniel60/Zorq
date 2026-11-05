# AI_HANDOFF.md — Zorq

**Last updated:** 4 November 2026  
**Project state:** Pre-implementation; blueprint assembled; no application code written.  
**Current phase:** Phase 0 — repository/environment inspection has not been run against the actual implementation repository.

## Product in one paragraph

Zorq is programmable authorization infrastructure for privacy-preserving federated machine learning. A data owner issues a non-transferable ERC-721 DataLicense that binds one registered data asset to one specific FL job, purpose/configuration commitment, permitted time window and owner. A coordinator checks authoritative Portaldot EVM contract state at admission and at every round boundary. Revocation after a round snapshot affects subsequent rounds, not a contribution already admitted into the current round.

## Source-of-truth documents

1. `PROJECT_SPEC.md` — product, scope, users, flows, functional requirements, state machines, data model, UI routes, API, security and acceptance criteria.
2. `ARCHITECTURE.md` — fixed stack, smart contract, backend/FL boundaries, auth, deployment, DB, environment variables and repository layout.
3. `IMPLEMENTATION_PLAN.md` — phase sequence, tasks, phase gates and checkpoint requirements.
4. `AGENTS.md` — mandatory coding-agent rules.
5. `docs/` — developer setup, API, deployment, privacy, operator/user guide, test plan, Portaldot validation and design approval records.

## Current architecture decisions

- Portaldot V3 EVM testnet; expected chain ID `420420777`; verify live RPC before use.
- One Solidity `ZorqRegistry` contract on Portaldot V3 EVM; ERC-721 license identity and registry state in the same contract; token is non-transferable.
- Chain is authorization source of truth; Postgres is metadata/index/audit store.
- Next.js App Router/TypeScript APIs, wagmi/viem, SIWE cookie session, Supabase Postgres + Drizzle.
- Python FastAPI + Flower + PyTorch synthetic binary classifier as a demo FL execution adapter.
- Vercel stable branch Preview; Render Docker for FL service; separate staging/production secrets and data.
- No raw data upload, real regulated data, payment, mainnet, LLM, native FL/ZKP/HE claim, or arbitrary model/worker execution in MVP.
- At run admission and each round boundary, Next.js obtains a contract snapshot at one confirmed block and returns the allowlist to Flower. Coordinator fails closed if snapshot is unavailable. Same allowlist governs training and aggregation.

## Portaldot external integration status

Public Portaldot material advertises V3 EVM/WASM and ERC standards, and older developer material advertises FL/ZKP/HE. The public developer docs reviewed do not provide the complete callable FL enrollment/execution API or ZKP proving/verifying API needed to claim native integration. MVP must use `FlowerDemoProvider`; no fabricated Portaldot adapter or mocked proof indicator. A future native adapter requires official docs/access, a working sample and successful integration evidence.

Current network references recorded in `ARCHITECTURE.md`:

- EVM RPC: `https://test-evm-rpc-v3.portaldot.dev`
- Chain ID: `420420777`
- Substrate WS: `wss://test-node-v3.portaldot.dev` (not required for MVP)
- Explorer: `https://scanner-testnet-v3.portaldot.dev/`

Portaldot test-token distribution instructions have specified a native SS58 address beginning with `5`, not an EVM `0x` address. Verify the exact H160 gas-funding path before transactions; never share seed phrases/private keys.

## Preview and repository status

| Item | Current value |
|---|---|
| Git repository | Not supplied/inspected in this blueprint session |
| Actual Git remote URL | Not known; do not invent |
| Current branch / commit | Not known; Phase 0 inspection required |
| Vercel preview URL | **Not deployed yet** |
| Deployed commit SHA | **Not applicable yet** |
| Preview environment | Not configured/verified yet |
| Production URL | Not deployed; no production release authorized |
| Supabase staging DB | Not provisioned/verified yet |
| Render FL service | Not provisioned/verified yet |
| Portaldot contract address | Not deployed yet |
| Contract deployment transaction | Not available |

Phase 1 must deploy the skeletal frontend early and then report its exact stable preview URL and deployed commit as soon as deployment succeeds. Keep it current at later verified phase checkpoints. Never fabricate or reuse a URL from another project.

## Functional status

- Product definition and PRD: specified.
- Architecture and stack: specified subject to Phase 0 repo inspection and testnet preflight.
- Contract/API/data model/security: specified in project documents.
- Application implementation: not started.
- Tests: not run; no application test evidence exists.
- E2E flows: not implemented or demonstrated.

## UI/design status

- Route/UX structure: specified in `PROJECT_SPEC.md`.
- Early skeletal frontend: not implemented or deployed.
- Temporary functional UI: not implemented.
- Design references: not collected.
- Mockups/prototypes: not produced.
- Final visual design: **not selected and not approved**.
- Final UI implementation is prohibited until core MVP functionality is accepted and the operator explicitly approves mockups.

## Documentation/footer status

- Blueprint source documents exist in this package.
- Repository README/docs must be materialized into the target repo by implementation phases.
- `/docs` is planned as a real in-app docs destination.
- Actual public GitHub repository URL is not known until repository inspection/creation. Footer link must not be fabricated.
- Private repository or unsuitable public disclosure requires operator-approved alternative/omission.

## Known issues / risks / blockers

1. The actual target repository and git remote are not provided in this handoff package; run Phase 0 read-only inspection first.
2. Portaldot EVM gas funding for the wallet's H160 address must be verified. Do not assume native SS58 token distribution funds EVM account.
3. Portaldot native FL API and ZKP API are not established by the public developer docs reviewed. Do not claim native integration.
4. Confirm that the live V3 testnet accepts the chosen Solidity bytecode/compiler and standard ERC-721 methods before treating deployment as complete.
5. Hackathon deadline surfaced as 6 November 2026, 04:00 UTC / 05:00 WAT; verify official submission page and any revised timeline.
6. This is a synthetic-data technical demonstration, not production data governance/privacy certification.

## Exact next task

**Run Phase 0 only: read-only inspect the actual Zorq implementation repository and available deployment environment.** Report repository tree, branch, commit, remotes, existing framework/dependencies/tests, current environment configuration by variable names only, Vercel/Supabase/Render access status, Portaldot testnet RPC/chain-ID reachability and EVM gas-funding blocker. Do not edit files or deploy during Phase 0. Wait for operator approval before Phase 1.
