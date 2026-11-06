# AI_HANDOFF.md — Zorq

**Execution mode:** Autonomous. Phase completion reports are for the record, not for approval. See AGENTS.md §1.1. The only stops are hard blockers.

**Last updated:** 6 November 2026
**Project state:** Phases 1–10 complete plus final polish: auth-state hydration and 401 re-authentication fixed, enterprise copy/logo/docs applied, external-database assets implemented, and the demo video re-rendered at 2:02. A post-handoff hardening pass removed ghost draft/pending rows, added optimistic pending-to-active lists and back navigation, and cleaned three unsubmitted license ghosts plus one stale asset draft from the test database. A final UX pass added Portaldot explorer transaction links, button hover/pressed/loading states, and Quick Start guides in the README and `/docs`. Final live testnet end-to-end verification is being handled manually by the operator in a real browser. The custom `zorq-preview` alias still serves the previous build (L-012).
**Current phase:** Phase 10 and final polish complete. Post-handoff transaction UX and onboarding polish are complete; the operator owns live wallet verification.

## Phase 3 deployment evidence

| Check | Result |
|---|---|
| Contract address | `0xa9ab18d404e2cd19c23f30e7d78a740b562685ff` |
| Deployment extrinsic | `0xb39268c84b4b62465531cd00659d20364c1ea8ed91cf4995d0fe03e5a02a1834` |
| Block | `337014` / `0xb4aa259a6a45fa225dcdb2e8c5eb6fbcfb2f822afc04c24ef0606cebff1c6088` |
| Deployer H160 | `0xfb7e252fae2d9e5a849361c22d7e4f8be2bb32bf` |
| Initial owner | `0xFb7E252faE2D9e5A849361C22d7E4F8be2BB32Bf` (deployer) |
| Runtime code on chain | `6,861` bytes (`eth_getCode`) |
| `owner()` | `0xFb7E252faE2D9e5A849361C22d7E4F8be2BB32Bf` |
| `supportsInterface(0x80ac58cd)` | `true` |
| `name()` / `symbol()` | `Zorq DataLicense` / `ZORQ` |
| `creationPaused()` | `false` |
| Balance after deployment | `29.0077` tPOTv3; after testnet asset/job calls and fees: `19.5` tPOTv3 |
| Explorer route | `https://scanner-testnet-v3.portaldot.dev/address/0xa9ab18d404e2cd19c23f30e7d78a740b562685ff` (SPA responds 200; EVM rendering not independently asserted) |

## Product in one paragraph

Zorq is programmable authorization infrastructure for privacy-preserving federated machine learning. A data owner issues a non-transferable ERC-721 DataLicense that binds one registered data asset to one specific FL job, purpose/configuration commitment, permitted time window and owner. A coordinator checks authoritative Portaldot EVM contract state at admission and at every round boundary. Revocation after a round snapshot affects subsequent rounds, not a contribution already admitted into the current round.

## Source-of-truth documents

1. `PROJECT_SPEC.md` — product, scope, users, flows, functional requirements, state machines, data model, UI routes, API, security and acceptance criteria.
2. `ARCHITECTURE.md` — fixed stack, smart contract, backend/FL boundaries, auth, deployment, DB, environment variables and repository layout.
3. `IMPLEMENTATION_PLAN.md` — autonomous phase sequence, tasks, checkpoints and Phase 10 demo-video production.
4. `AGENTS.md` — mandatory coding-agent rules.
5. `docs/` — developer setup, API, deployment, privacy, operator/user guide, test plan, Portaldot validation, design reference/waiver, demo-video spec and autonomous-execution contract.

## Current architecture decisions

- Portaldot V3 EVM testnet; chain ID `420420777` confirmed live on 5 November 2026; block production confirmed advancing.
- One Solidity `ZorqRegistry` contract on Portaldot V3 EVM; ERC-721 license identity and registry state in the same contract; token is non-transferable.
- Chain is authorization source of truth; Postgres is metadata/index/audit store.
- Next.js 16.4.5 App Router/TypeScript APIs, wagmi/viem planned, SIWE cookie session planned, Postgres + Drizzle.
- Python FastAPI + Flower + PyTorch synthetic binary classifier as a demo FL execution adapter.
- Vercel stable Preview; Render Docker for FL service; staging-only secrets and synthetic data; production out of scope.
- No raw data upload, real regulated data, payment, mainnet, LLM, native FL/ZKP/HE claim, or arbitrary model/worker execution in MVP.
- At run admission and each round boundary, Next.js obtains a contract snapshot at one confirmed block and returns the allowlist to Flower. Coordinator fails closed if snapshot is unavailable.

## Portaldot external integration status

Public Portaldot material advertises V3 EVM/WASM and ERC standards, and older developer material advertises FL/ZKP/HE. The public developer docs reviewed do not provide the complete callable FL enrollment/execution API or ZKP proving/verifying API needed to claim native integration. MVP must use `FlowerDemoProvider`; no fabricated Portaldot adapter or mocked proof indicator.

Current network references recorded in `ARCHITECTURE.md`:

- EVM RPC: `https://test-evm-rpc-v3.portaldot.dev`
- Chain ID: `420420777`
- Substrate WS: `wss://test-node-v3.portaldot.dev` (not required for MVP)
- Explorer: `https://scanner-testnet-v3.portaldot.dev/`

**Phase 1 preflight (5 November 2026):**

- `eth_chainId` = `0x190f1ca9` = `420420777`.
- `eth_blockNumber` advanced (`0x50f52` observed during the preflight window).
- Deployer SS58 (sr25519, prefix 42): `5En6zJzY6eXkzns1AxsYzueGMNahKhZwYmXbARWkri9fUi4F`.
- Derived H160 confirmed by the chain runtime (`twinkey_identity`, `reviveApi.address`): `0xfb7e252fae2d9e5a849361c22d7e4f8be2bb32bf`.
- Native/EVM balance: `0` — **awaiting operator funding** at <https://pot-starter-hub.vercel.app>.
- Write path: `twinkey-provider` converts writes to sr25519-signed `revive.call` extrinsics; direct external EOA sends are not supported on this chain build.
- Deployer seed persisted outside the repository at `.secrets/deployer.json` with mode `0600`.

## Preview and repository status

| Item | Current value |
|---|---|
| Git repository | `onyebuchidaniel60/Zorq` (public) |
| Actual Git remote URL | `https://github.com/onyebuchidaniel60/Zorq` |
| Current branch / commit | `main` / Phase 2 checkpoint `c4b6def`; this report is the commit immediately after |
| Vercel project | `uhhh2/zorq` — root directory `apps/web`, framework `nextjs`, Node `22.x` |
| Stable preview URL | `https://zorq-preview-uhhh2.vercel.app` |
| Deployed preview URL | `https://zorq-p470qche0-uhhh2.vercel.app` |
| Deployed commit SHA | `c4b6def` (Phase 2 auth/database) |
| Deployment ID | `dpl_3YQiqPcZbkk4YnCZZrCM4D5JR54d` |
| Production URL | Out of scope for the MVP; `main` is the Vercel default production branch by project convention |
| Database | Neon project `zorq-db` (`still-bonus-67603921`), branch `br-solitary-frost-bcm6xvxx`, database `neondb`, region us-east-1 — connected |
| Render FL service | `https://zorq-fl-service.onrender.com` (service `srv-dbmbfht9fdbs73ccvj5g`, live, health/ready 200) |
| Demo run | `e18c1749-21f4-4cf4-b74a-2ed107f5d6cf` — completed 3/3 |
| Final model hash | `0x1368046d874980a3b0575c9299fe929dc1a29566728f7b105461ad8fef602caf` |
| Portaldot contract address | `0xa9ab18d404e2cd19c23f30e7d78a740b562685ff` |
| Contract deployment transaction | `0xb39268c84b4b62465531cd00659d20364c1ea8ed91cf4995d0fe03e5a02a1834` (block `337014`) |
| Testnet asset transaction | `0x2befac3470e0cfa45667266275624428f7b553e20dd98b03811ba56c34303fb0` (block `337097`) |
| Testnet job transaction | `0x87958b335720f8130270c37778f329e3df149ce6ee9136cbde7d43a6bba1290a` (block `337103`) |
| Render FL service | `https://zorq-fl-service.onrender.com` (build in progress) |

## Functional status

- Repository classification: application scaffold plus authentication/database foundation.
- Product definition and PRD: specified.
- Architecture and stack: specified; implementation follows it with the logged D-001/D-002 substitutions.
- Contract/API/data model/security: specified in project documents.
- Application implementation: Phase 1 shell + Phase 2 wallet authentication, sessions and DB.
- Tests: Phase 2 typecheck/lint/build/unit/integration/auth and local Playwright pass; deployed-preview headful smoke passes all routes and a real sr25519 sign-in.
- E2E business flows: asset/job/license/FL flows are not implemented yet (Phases 3–4).

## UI/design status

- Route/UX structure: specified in `PROJECT_SPEC.md`; all agreed routes now resolve in the shell.
- Temporary functional UI: implemented as a neutral, consistent system. Unfinished forms and buttons are disabled and labelled with the delivering phase.
- Design source: two operator-supplied reference images at `docs/design/reference/reference1.webp` and `reference2.webp`.
- Mockup approval: explicitly waived by the operator. No mockup or approval loop.
- Final visual direction: comes directly from the reference images in Phase 7 using Stageshow.
- Reference image status: **supplied**; not used for styling before Phase 7.
- Demo-video reference: supplied at `docs/demo/reference/reference-video.mp4`; structural review happens before Phase 5.5/Phase 10.

## Documentation/footer status

- Repository README and developer/deployment/Portaldot docs updated to the implemented Phase 1 state.
- `/docs` is a real in-app documentation destination with useful prototype content.
- Actual public GitHub repository URL: `https://github.com/onyebuchidaniel60/Zorq`; linked in the footer and support page.
- Privacy, experimental terms and support pages are real and project-specific; support links to the actual GitHub issue tracker.
- No invented email addresses, legal claims or partner logos.

## Known issues / risks / blockers

1. **Resolved — Portaldot contract deployment:** `ZorqRegistry` deployed successfully at `0xa9ab18d404e2cd19c23f30e7d78a740b562685ff` in block `337014`.
2. **Resolved — successful FL run:** three assets and three licenses are active; run `e18c1749-21f4-4cf4-b74a-2ed107f5d6cf` completed three rounds. Token 3 was revoked at block 341655 and excluded at the round 3 snapshot (block 341656).
2. **Resolved — Neon terms of service:** operator accepted the marketplace terms; the Neon integration is provisioned and `DATABASE_URL` works against preview and local.
3. **Environment limitation — Vercel edge checkpoint:** bulk/headless requests to `*.vercel.app` trigger a security checkpoint. CLI access is restored with the operator-supplied `VERCEL_TOKEN`; deployed preview evidence uses a headful xvfb Playwright smoke script. See L-004.
4. Portaldot native FL API and ZKP API are not established by the public developer docs reviewed. Do not claim native integration.
5. Confirm that the live V3 testnet accepts the chosen Solidity bytecode/compiler and standard ERC-721 methods before treating deployment as complete.
6. Hackathon deadline surfaced as 6 November 2026, 04:00 UTC / 05:00 WAT; verify official submission page and any revised timeline.
7. This is a synthetic-data technical demonstration, not production data governance/privacy certification.
8. Reference images/video are present but must not be used before Phase 7 / demo production. No copying of footage, music, logos or narration.

## Phase 0 completion report (amended)

```text
Assigned phase/task: Phase 0 (amended) — apply source-document corrections A0–A8, run read-only repository/environment inspection, produce PREREQUISITES.md, present the Prerequisites Manifest.
Commit SHA: fb9e956 (Part A amendments); the Phase 0 inspection report is the commit immediately after this file.
Preview URL (exact): None — Phase 1 had not started.
Deployed commit/deployment ID: Not applicable; no deployment had been created.
Changes visible: Source docs now define autonomous execution, reference-image/reference-video workflow, demo-video specification, Decision Log and Known Limitations. PREREQUISITES.md is populated with the exact outstanding inputs.
Intentionally incomplete areas: No application code, package manifests, lockfiles, application tests, deployment configuration, contract, preview URL or demo video.
Tests (exact commands + actual results): `git status --short --branch` -> `main...origin/main [ahead 1]`; `curl` `eth_chainId` -> `0x190f1ca9` = 420420777; six `eth_blockNumber` samples -> `0x50802` to `0x50807` (advances); `eth_gasPrice` -> `0x55a5`; `eth_getBalance(0x5fE9...949e)` -> `0x0`; `npm view next@16.4.5 version` -> 16.4.5; `npm view hardhat version` -> 3.21.2; `npm view @playwright/test version` -> 1.64.1; `pip index versions flwr` -> 1.42.0 available; `node --version` -> v24.22.1; `python3 --version` -> 3.12.3; `ffmpeg -version` -> 6.1.1; `uv` and `docker` -> not found.
Manual verification: Repository tree, git remote, docs and environment inspected. GitHub repo is public and push-authenticated. Vercel CLI was authenticated but no Zorq project existed. Reference directories were absent. No transaction was sent.
Known issues/blockers: Supabase staging access, Render FL service access, Portaldot H160 gas funding, and the missing reference image were outstanding at Phase 0.
Security notes: No secret values were printed or committed. The disposable deployer key was held outside the repository with mode 0600; only the H160 address was reported.
Design reference image status: Missing at Phase 0; supplied before Phase 1.
Operator approval status (visuals: waived): Waived.
README/docs status: Source docs, docs index, README links, DEMO_VIDEO.md, AUTONOMOUS_EXECUTION.md and PREREQUISITES.md updated/created. No in-app `/docs` route existed.
Documentation footer URL: Not deployed; `/docs` planned.
GitHub URL or documented reason absent: https://github.com/onyebuchidaniel60/Zorq (public, verified).
Decisions logged this phase (D-NNN ids): None.
New Known Limitations this phase: None.
Next single task: Operator completes PREREQUISITES.md and replies `execute`; Phase 1 then starts automatically.
```

## Phase 1 completion report

```text
Assigned phase/task: Phase 1 — repository/platform foundation + skeletal frontend deployment.
Commit SHA: a9b3b33 (scaffold + lockfile). This report is committed immediately after.
Preview URL (exact): https://zorq-preview-uhhh2.vercel.app
Deployed commit/deployment ID: commit a9b3b33; deployment URL https://zorq-me71ph9qo-uhhh2.vercel.app. Exact deployment ID was not captured because Vercel API/CLI access failed after deployment (L-001).
Changes visible: Navigable public routes `/`, `/docs`, `/privacy`, `/terms`, `/support`; app routes `/app`, `/app/assets`, `/app/assets/new`, `/app/assets/[assetId]`, `/app/jobs`, `/app/jobs/new`, `/app/jobs/[jobId]`, `/app/licenses`, `/app/licenses/[licenseId]`, `/app/runs/[runId]`; responsive header/footer/app navigation; skip link; semantic headings; disabled labelled forms; health and readiness endpoints; branded 404/error/loading states; favicon and noindex robots policy.
Intentionally incomplete areas: wallet connection and SIWE (Phase 2); database and migrations (Phase 2); ZorqRegistry and domain APIs (Phase 3); Flower service and run dashboard (Phase 4); final visual reference implementation (Phase 7); expanded docs/footer completeness (Phase 8); demo video (Phase 5.5/10).
Tests (exact commands + actual results):
  `npm run typecheck` -> PASS (tsc --noEmit, exit 0)
  `npm run lint` -> PASS (eslint ., exit 0)
  `npm run build` -> PASS (Next.js 16.4.5 Turbopack build; 16 routes emitted)
  `npm run test` -> PASS 4/4 (node:test scaffold checks)
  `npx playwright test` -> PASS 40/40 (chromium desktop + mobile, local dev server on port 3100)
  `PLAYWRIGHT_BASE_URL=https://zorq-preview-uhhh2.vercel.app npx playwright test` -> 9 passed / 31 failed; failures were HTTP 403 from the Vercel edge security checkpoint, not application assertions (L-001)
  `curl https://zorq-preview-uhhh2.vercel.app/` before the edge block -> HTTP 200, title `Job-specific DataLicenses for federated learning`
  `curl .../api/ready` -> HTTP 503 with sanitized `{"database":"not_configured","chain":"chain_id_verified","contract":"not_deployed"}`
  Portaldot: `eth_chainId` = 420420777; block number advanced; `twinkey_identity` confirmed H160 mapping; balance 0.
Manual verification: every route visited locally at desktop and Pixel 7 widths; disabled controls verified; no inert `href="#"` links; health endpoint checked for secret leakage; preview HTML and title checked once before the edge challenge activated.
Known issues/blockers: deployer address unfunded (Phase 3 blocker); Neon terms acceptance outstanding (Phase 2 blocker); Vercel edge/CLI access blocked from this environment (L-001).
Security notes: no secrets in the client bundle or git; `.env.local`, `.vercel/` and `.secrets/` are gitignored; generated SESSION_SECRET, RATE_LIMIT_SECRET and FL_SERVICE_SHARED_SECRET were stored only in `.env.local` and Vercel Preview env vars; deployer seed is mode 0600 outside the repository. No transaction was sent.
Design reference image status: Supplied (two WebP images).
Operator approval status (visuals: waived): Waived.
README/docs status: README updated to the real Phase 1 state and commands; developer setup, deployment and Portaldot validation docs updated; `/docs`, privacy, terms and support are real pages.
Documentation footer URL: https://zorq-preview-uhhh2.vercel.app/docs
GitHub URL or documented reason absent: https://github.com/onyebuchidaniel60/Zorq (public, actual remote).
Decisions logged this phase (D-NNN ids): D-001, D-002, D-003, D-004, D-005.
New Known Limitations this phase: L-001, L-002.
Next single task: Operator funds SS58 `5En6zJzY6eXkzns1AxsYzueGMNahKhZwYmXbARWkri9fUi4F` and accepts the Neon marketplace terms; then Phase 2 backend/SIWE foundation and Phase 3 testnet deployment.
```

## Phase 3 interim status (contract only; deployment pending)

```text
Contract source: packages/contracts/contracts/ZorqRegistry.sol
Compiler: solc 0.8.24, optimizer enabled, runs 1, viaIR true
Runtime code: 6,861 bytes; creation code: 7,872 bytes
Contract tests: 11/11 passing via `npx hardhat test`
Coverage: registration/deactivation, job windows and state transitions, license issuance/revocation/revision, participant cohort cap, soulbound transfers/approvals, deterministic authorization reasons, creation pause, non-owner rejection.
Deployment: **complete**. Contract `0xa9ab18d404e2cd19c23f30e7d78a740b562685ff`, extrinsic `0xb39268c84b4b62465531cd00659d20364c1ea8ed91cf4995d0fe03e5a02a1834`, block `337014`. Read verification passed for `owner`, `supportsInterface`, `name`, `symbol` and `creationPaused`; `eth_getCode` returns 6,861 bytes.
```

## Phase 4/5 end-to-end run evidence

```text
Job: a37f6074-bd7d-44fc-a00c-c737b8a78b77 (chain id 0x98f6b7a3...), created block 341500.
Assets: partition 0 (0xed1505...), partition 1 (0x03acb2...), partition 2 (0xb5c072...).
Licenses: token 1 (asset 0), token 2 (asset 1), token 3 (asset 2), all active before the run.
Run: e18c1749-21f4-4cf4-b74a-2ed107f5d6cf.
Round 1: snapshot block 341642; 3 authorized, 3 aggregated; loss 0.587897, accuracy 0.71875.
Round 2: snapshot block 341651; 3 authorized, 3 aggregated; loss 0.515531, accuracy 0.810547.
Revocation: token 3 revoked in block 341655 (tx 0xd89a1d66d9a4c00e08faf38e5808065f2c6ca4402d9769a9ef2aae0890332028), after round 2 snapshot.
Round 3: snapshot block 341656; 2 authorized, 2 aggregated; token 3 denied REVOKED; loss 0.462994, accuracy 0.857422.
Status: completed; final model hash 0x1368046d874980a3b0575c9299fe929dc1a29566728f7b105461ad8fef602caf.
Evidence file: docs/evidence/demo-run.json.
```

The sequence demonstrates the exact rule: revocation after a snapshot does not retroactively remove the participant from the round already admitted, and the next snapshot excludes it. The run still completes because two authorized assets remain.

## Phase 2 completion report

```text
Assigned phase/task: Phase 2 — backend, database and authentication foundation.
Commit SHA: c4b6def (auth/DB checkpoint). This report is committed immediately after.
Preview URL (exact): https://zorq-preview-uhhh2.vercel.app
Deployed commit/deployment ID: c4b6def / dpl_3YQiqPcZbkk4YnCZZrCM4D5JR54d.
ON-CHAIN BALANCE CHECK (reported first): twinkey_identity returned nativeFree 1000000000000000 = 10.0000 tPOTv3 and evmBalanceWei 10000000000000000000; eth_getBalance returned 0x8963dd8c2c5e0000. Funding received.
Changes visible: wallet connect/sign-in/sign-out panel with session restore; real sr25519 SIWE challenge/verify endpoints; HttpOnly session cookie; one-use nonce persistence; DB-backed rate limits; audit events; idempotency table; Drizzle migration 0000_dapper_starhawk.sql; readiness now reports database connected; Neon project zorq-db (still-bonus-67603921), branch br-solitary-frost-bcm6xvxx, database neondb.
Intentionally incomplete areas: asset/job/license domain APIs and contract (Phase 3); Flower run service and dashboard (Phase 4); final visual reference (Phase 7); expanded docs/footer (Phase 8); demo video (Phase 5.5/10).
Tests (exact commands + actual results):
  `vercel whoami` with operator-supplied VERCEL_TOKEN -> authenticated (token never printed)
  `vercel integration add neon --name zorq-db --billing-plan free_v3 -e production -e preview` -> success, resource store_wHQlJczk7fQSnkNQ, connected true, envPulled true
  `vercel env pull /tmp/... --environment=preview` -> DATABASE_URL present; `psql <DATABASE_URL> -tAc 'select 1'` -> 1
  `npm run db:generate` -> migrations/0000_dapper_starhawk.sql (5 tables)
  `npm run db:migrate` -> Database migrations applied
  `npm run typecheck` -> PASS (exit 0)
  `npm run lint` -> PASS (exit 0)
  `npm run build` -> PASS; auth routes emitted as dynamic
  `npm run test` -> PASS 10/10 Vitest + 4/4 scaffold tests
  `npm run test:auth` -> PASS: nonce created, sr25519 signature verified, cookie flags, /me, replay rejected, invalid signature rejected, wrong origin rejected, logout clears cookie, nonce rate limit enforced
  `npx playwright test` (local, port 3100) -> PASS 40/40 desktop + mobile
  `xvfb-run -a node tests/preview-smoke.mjs` against https://zorq-preview-uhhh2.vercel.app -> PASS: challenge cleared, all 15 routes, health, real sr25519 sign-in through the deployed API, HttpOnly/Secure/SameSite cookie, nonce replay rejected, logout, test rows cleaned up (exit 0)
  `curl https://zorq-preview-uhhh2.vercel.app/api/ready` -> 503 with `{"database":"connected","chain":"chain_id_verified","contract":"not_deployed"}`
Manual verification: preview routes and sign-in exercised headful through the deployed origin; cookie flags inspected in the browser context; DB rows and cleanup verified with psql counts; no secrets printed.
Known issues/blockers: contract not deployed (Phase 3); Render FL service not provisioned (Phase 4); Vercel edge checkpoint requires headful preview automation (L-004); real wallet-extension UI path not exercised in this environment (L-005).
Security notes: VERCEL_TOKEN, RENDER_API_KEY, DATABASE_URL and all generated secrets were read from the gitignored mode-0600 .env.local and never printed in logs, reports or commits. A tracked-file secret scan found none. Nonce replay, invalid signature, wrong origin, rate limiting and cookie flags are covered by automated tests. Sign-in is sr25519 signature verification; no private key or seed is sent to the server.
Design reference image status: Supplied (two WebP images); not used before Phase 7.
Operator approval status (visuals: waived): Waived.
README/docs status: README, developer setup, API reference and security/privacy docs updated for auth/DB; docs/TEST_PLAN includes Phase 2 evidence.
Documentation footer URL: https://zorq-preview-uhhh2.vercel.app/docs
GitHub URL or documented reason absent: https://github.com/onyebuchidaniel60/Zorq (public, actual remote).
Decisions logged this phase (D-NNN ids): D-006, D-007, D-008.
New Known Limitations this phase: L-003, L-004, L-005.
Next single task: Phase 3 — ZorqRegistry contract, contract tests, testnet deployment with the funded deployer, and asset/job/license domain APIs.
```

## Decision Log

Append-only. One entry per non-trivial decision made by the agent without operator input. Never edit or remove prior entries.

Format: `D-NNN — YYYY-MM-DD — Phase N — short decision title — rationale — files affected`

**D-001 — 2026-11-05 — Phase 1 — No Docker in local/staging workflow.** Operator instruction supersedes the Docker Compose references in `ARCHITECTURE.md`: use local `psql` for any local Postgres parity, Neon via Vercel for staging/preview, and let Render build the FL Dockerfile remotely. Docker is not installed locally. Files: `README.md`, `docs/DEVELOPER_SETUP.md`, `docs/DEPLOYMENT.md`, `AI_HANDOFF.md`.

**D-002 — 2026-11-05 — Phase 1 — Managed PostgreSQL provider is Neon via the Vercel integration, not Supabase.** Operator instructed Neon provisioning through `vercel integration add neon`; the pooled Neon connection string is used server-side with Postgres.js prepared statements disabled. This is a hosting/provider substitution for the Supabase designation in the frozen architecture; data model and DB authority rules are unchanged. Provisioning awaits operator acceptance of the Neon marketplace terms. Files: `.env.example`, `docs/DEVELOPER_SETUP.md`, `docs/DEPLOYMENT.md`, `AI_HANDOFF.md`.

**D-003 — 2026-11-05 — Phase 1 — Pin Node 22.23.4 and use uv 0.13.7.** Node 22.23.4 is the current supported Node 22 LTS patch and satisfies Hardhat 3/Next.js 16 requirements; `uv` is installed from the official installer for Python dependency management. Files: `.nvmrc`, `package.json`, `package-lock.json`.

**D-004 — 2026-11-05 — Phase 1 — Stable preview uses the custom Vercel alias `https://zorq-preview-uhhh2.vercel.app`, with deployment protection disabled.** The project's default production branch is `main`, so a plain push is labelled Production by Vercel. The custom alias points at the latest preview deployment and keeps a stable, public, testnet-only review URL. Vercel SSO protection was disabled because the preview contains only synthetic data and must be reviewable. Files: `docs/DEPLOYMENT.md`, `AI_HANDOFF.md`.

**D-005 — 2026-11-05 — Phase 1 — Use `twinkey-provider` with a persisted sr25519 keypair for all Portaldot writes.** The chain runtime confirms the SS58→H160 mapping, and direct external EOA transactions are not supported on this build; `twinkey-provider` translates writes into sr25519-signed `revive.call` extrinsics. Deployer key is persisted at `.secrets/deployer.json` (gitignored, mode 0600); only public addresses are reported. Files: `.env.example`, `docs/PORTALDOT_VALIDATION.md`, `AI_HANDOFF.md`.

**D-006 — 2026-11-05 — Phase 2 — Neon PostgreSQL provisioned via the Vercel integration.** The resource is `zorq-db` (`store_wHQlJczk7fQSnkNQ`), Neon project `still-bonus-67603921`, branch `br-solitary-frost-bcm6xvxx`, database `neondb`, region us-east-1. The pooled `DATABASE_URL` is used server-side with Postgres.js `prepare: false`; `DATABASE_URL_UNPOOLED` is used only for migrations. The integration connected production and preview and pulled env vars; the free plan id exposed by Vercel is `free_v3` (not `free`). Files: `.env.example`, `packages/db/**`, `docs/DEVELOPER_SETUP.md`, `docs/DEPLOYMENT.md`.

**D-007 — 2026-11-05 — Phase 2 — SIWE signature scheme uses sr25519 over the EIP-4361 message.** Portaldot writes require Substrate keys, so the wallet signs the exact SIWE message bytes with sr25519 via the extension's `signRaw`. The server parses EIP-4361 fields with `siwe`, validates domain/URI/chain/nonce/time, recomputes `ss58ToH160` for the challenge, and verifies the signature with `@polkadot/util-crypto` against the stored SS58 public key. Identity and permissions remain H160-based; no ECDSA key is introduced. Files: `apps/web/src/server/auth/**`, `apps/web/src/lib/wallet-client.ts`, `apps/web/src/components/wallet/**`.

**D-008 — 2026-11-05 — Phase 2 — Preview acceptance uses a headful xvfb Playwright smoke script.** Vercel's edge security checkpoint rejects headless bulk automation from this environment even with a valid session cookie; a real headful browser clears the challenge. The checked-in `apps/web/tests/preview-smoke.mjs` drives the deployed preview, performs a real sr25519 sign-in through the page context and cleans up its synthetic DB rows. Local Playwright remains headless for the 40-test shell suite. Files: `apps/web/tests/preview-smoke.mjs`, `AI_HANDOFF.md`, `docs/TEST_PLAN.md`.

**D-009 — 2026-11-05 — Phase 3 — Testnet calls use a direct `revive.call` path with the persisted sr25519 signer.** The browser-facing `twinkey-provider` wrapper obscured some revert reasons during testnet smoke tests, so the integration scripts encode the contract calldata and submit `revive.call` with `keyringSigner`; this is the same Substrate signing path and still uses the deployed contract ABI. Deployment uses `revive.instantiateWithCode`. Files: `apps/web/tests/integration/*.ts`, `packages/contracts/scripts/deploy-portaldot.ts`.

**D-010 — 2026-11-05 — Phase 4 — Flower integration uses in-process NumPyClient plus FedAvg aggregation, not Ray simulation.** The service runs one deterministic simulation per request, calls only the snapshot allowlist, and passes the resulting `FitRes` objects to Flower's `FedAvg.aggregate_fit`. This keeps the Render free-plan footprint small and makes the authorization cutoff explicit. Files: `apps/fl-service/zorq_fl/flower_app/**`, `apps/fl-service/zorq_fl/run/manager.py`.

**D-011 — 2026-11-05 — Phase 4 — Render Docker service uses the free plan, Oregon region, one instance and `/health`.** Env vars are set from the generated local secret; the service is deployed from `apps/fl-service` on `main`. Files: `apps/fl-service/Dockerfile`, `AI_HANDOFF.md`.

**D-012 — 2026-11-05 — Phase 4 — Render build uses CPU-only PyTorch and no Ray.** `torch==2.9.1+cpu` is resolved from the PyTorch CPU index; the Flower Ray simulation extra was removed because the service uses in-process NumPyClient/FedAvg. This keeps the free-plan image within disk/memory limits. Files: `apps/fl-service/pyproject.toml`, `apps/fl-service/uv.lock`, `apps/fl-service/Dockerfile`.

**D-013 — 2026-11-05 — Phase 5 — Demo job uses three assets so revocation can be shown without stopping the run.** The operator requested two licenses, but a two-asset cohort would fail the next round after revoking one (minimum two authorized assets). A third synthetic asset/license lets round 2 include all three and round 3 continue with two after the revocation. This stays within the 2–5 cohort limit. Files: `apps/web/tests/integration/demo-*.ts`, `AI_HANDOFF.md`.

**D-014 — 2026-11-06 — Post-Phase 10 hotfix — SIWE accepts only an exact set of trusted public origins, bound per challenge.** The failing browser was on `https://zorq-six.vercel.app`, a production alias, while `APP_ORIGIN` was `https://zorq-uhhh2.vercel.app`. Keeping a single canonical origin would break other official aliases; allowing arbitrary `Host` values would weaken the check. The server now accepts `APP_ORIGIN`, `NEXT_PUBLIC_APP_URL`, an optional comma-separated `ALLOWED_ORIGINS`, and the known Vercel production/preview aliases. It normalizes the browser `Origin` with `new URL(raw).origin`, never trusts `Host`/`x-forwarded-host`, and binds the SIWE domain/URI to the validated request origin stored with the nonce; verification compares against that stored origin. Preview remains exactly `https://zorq-preview-uhhh2.vercel.app`; production remains its own canonical `https://zorq-uhhh2.vercel.app` with `zorq-six` explicitly allowed. Files: `apps/web/src/server/env.ts`, `apps/web/src/server/http/request.ts`, `apps/web/src/server/auth/siwe.ts`, `apps/web/src/server/auth/service.ts`, `apps/web/src/app/api/auth/nonce/route.ts`, `apps/web/tests/unit/origin.test.ts`.

**D-019 — 2026-11-06 — External-database assets.** Asset drafts accept `dataSource: "demo" | "external"`, optional `dbUrl`, `dbTable`, `labelColumn` and nullable `demoPartitionId`. PostgreSQL URLs are encrypted at rest with AES-256-GCM derived from `SESSION_SECRET`; table/label identifiers are validated and quoted. The coordinator receives the URL only in the internal snapshot, reads at most 1,000 rows with pandas/SQLAlchemy, normalizes up to eight numeric features and a binary label, discards raw rows, and skips a failed external participant without crashing the run. Migration: `packages/db/migrations/0003_abandoned_vivisector.sql`. Files: `apps/web/src/server/domain/external-db.ts`, `apps/web/src/components/forms/new-asset-form.tsx`, `apps/fl-service/zorq_fl/model/external.py`, `apps/fl-service/zorq_fl/run/manager.py`.

**D-020 — 2026-11-06 — Contract writes use direct `revive.call` with the injected Substrate signer.** The previous viem/twinkey write path could surface opaque provider errors and event-decoding failures. `submitContractTransaction()` builds the revive call, submits through the injected signer, decodes module dispatch errors, waits for eight confirmations, and returns the extrinsic hash and block hash for API confirmation. This keeps the contract interaction and authorization semantics unchanged while making wallet failures actionable. Superseded for asset/job/license creation by D-022; revoke and job-state actions retain the eight-confirmation wait. Files: `apps/web/src/lib/wallet-client.ts`, `apps/web/src/components/forms/**`, `apps/web/src/components/jobs/job-actions.tsx`, `apps/web/src/components/licenses/revoke-license-button.tsx`.

**D-021 — 2026-11-06 — Post-handoff UX — Drafts are hidden, short-lived, and deleted on safe failure; pending rows are created only after a transaction hash exists.** Asset/job/license drafts are server-generated so the browser receives the exact identifiers and arguments without trusting client-supplied values. Lists exclude `draft`. On wallet rejection, insufficient tPOT/storage deposit or a decoded dispatch error, the client deletes the draft through an owner-scoped same-origin `DELETE`. On inclusion, the client calls `/pending` to store `{txHash, blockHash}` and redirects to the list. This satisfies the requirement that no ghost record appears while preserving server-generated chain arguments. Files: `apps/web/src/server/domain/**`, `apps/web/src/app/api/**`, `apps/web/src/components/forms/**`, `apps/web/src/components/jobs/job-actions.tsx`, `apps/web/src/lib/client-api.ts`.

**D-022 — 2026-11-06 — Post-handoff UX — Transaction submission resolves at inclusion and confirmation is polled from the list page.** `submitContractTransaction()` returns as soon as the transaction is in a block (or final) instead of blocking for eight confirmations. Asset, job and license forms call `/pending` and navigate immediately; `PendingSync` polls `/confirm` every four seconds and refreshes the server-rendered list when the contract event is accepted. Revoke and job-state actions pass `waitForConfirmations: 8` to preserve their existing synchronous confirmation contract. Backend confirmation remains receipt/event-verified and fail-closed; only the client wait point changed. Cleanup also removes `pending_chain` rows with no transaction hash and drafts older than 30 minutes. Files: `apps/web/src/lib/wallet-client.ts`, `apps/web/src/components/pending-sync.tsx`, `apps/web/src/app/app/{assets,jobs,licenses}/page.tsx`, `apps/web/src/server/domain/{assets,jobs,licenses}.ts`.

**D-023 — 2026-11-06 — Final UX — Confirmed records link to the Portaldot scanner through its hash route, and primary submit buttons expose explicit busy states.** The scanner is a hash-router SPA; `/tx/<hash>` renders the home shell, while `/#/extrinsics/<hash>` resolves the extrinsic detail. `explorerTxUrl()` builds the hash route from `NEXT_PUBLIC_PORTALDOT_EXPLORER_URL`, validates the 32-byte hash, and is unit-tested. List and detail pages render the link only for confirmed statuses (`active`/`deactivated`, `open`/`paused`/`closed`, `active`/`revoked`/`expired`), never for `draft` or `pending_chain`. Primary buttons retain hover/pressed feedback and now show a spinner with disabled `aria-busy` states during wallet and chain operations. Quick Start checklists were added to README and `/docs` with the tPOT storage-deposit warning. No contract, API, schema or authorization semantics changed. Files: `apps/web/src/lib/explorer.ts`, `apps/web/src/components/explorer-tx-link.tsx`, `apps/web/src/components/spinner.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/app/{app,docs}/**`, `README.md`.

**L-010 — 2026-11-06 — Phase 10 — Demo narration uses a free Microsoft Edge neural male voice, not Google AI Studio.** No Google AI Studio credential or API key was supplied in the prerequisites manifest or environment, and the task cannot create a Google account/API key without operator input. Consequence: the `docs/DEMO_VIDEO.md` hard gate requiring a free Google AI Studio voice is not met, although the narration is synthetic, non-cloned, free, male, and contains no presenter identity. Mitigation: re-render `docs/demo/narration.md` with a Google AI Studio voice and remux using `scripts/demo-video/` when a key is supplied. Files: `docs/demo/zorq-demo.mp4`, `docs/demo/narration.md`, `docs/demo/timeline.json`.

**D-015 — 2026-11-06 — Final polish — Reference image 3 becomes the definitive UI direction.** The dark near-black canvas, lime accent, dot grid, metric cards, icon rail and dense table language replace the earlier light dashboard. Public pages reuse the same palette with dark content cards. The implementation follows Stageshow craft rules but does not copy the kit or reference assets. No route, permission, contract, database or API behaviour changes. Files: `apps/web/src/app/globals.css`, `apps/web/src/components/**`, `apps/web/src/app/**/page.tsx`, `docs/DESIGN_DECISIONS.md`.

**D-016 — 2026-11-06 — Final polish — Partition availability is read from the database before the form renders, and client responses are parsed defensively.** The registration page calls a read-only `listReservedPartitions()` query and disables reserved partitions; `/api/assets` also exposes the same read-only list. Forms validate empty/null JSON bodies, transaction hashes and wallet signatures, and translate wallet rejection/empty-response failures into readable messages. No schema, contract or authorization rule changed. Files: `apps/web/src/server/domain/assets.ts`, `apps/web/src/app/api/assets/route.ts`, `apps/web/src/app/app/assets/new/page.tsx`, `apps/web/src/components/forms/new-asset-form.tsx`, `apps/web/src/components/forms/new-job-form.tsx`, `apps/web/src/lib/client-api.ts`, `apps/web/src/lib/wallet-client.ts`.

**D-017 — 2026-11-06 — Final polish — Authentication and wallet connection are separate states, and 401s re-authenticate once.** The server layout hydrates the SIWE session as `user`; the wallet extension may still be disconnected on a fresh page load. Forms now distinguish `isAuthenticated` from `isConnected`, resolve the wallet on demand with `ensureWallet()`, and retry a request once after an automatic SIWE prompt on 401. A valid session no longer produces the stale “Connect and sign in with your wallet first” error. Files: `apps/web/src/components/wallet/wallet-context.tsx`, `apps/web/src/lib/client-api.ts`, `apps/web/src/components/forms/**`, `apps/web/tests/auth-state-smoke.mjs`.

**D-018 — 2026-11-06 — Final polish — Enterprise copy, new Zorq mark, expanded documentation and repository cleanup.** Replaced visible “synthetic/demo/prototype” language in React UI with enterprise wording while keeping honest evaluation-data and testnet disclaimers in README/docs. Added a custom geometric Zorq SVG mark for header, footer, rail and favicon; expanded README with Mermaid architecture, setup, env vars and Portaldot deployment details; expanded `/docs`; removed build logs/caches and temporary artifacts; tightened `.gitignore`. No business logic, contract or schema changes. Files: `README.md`, `apps/web/src/components/zorq-logo.tsx`, `apps/web/src/app/icon.svg`, `apps/web/src/**`, `docs/**`, `.gitignore`.

## Known Limitations

Append-only. One entry per limitation accepted by the agent rather than fixed, including the reason and any user-facing consequence.

Format: `L-NNN — YYYY-MM-DD — Phase N — short title — description — consequence — mitigation-if-any`

**L-013 — 2026-11-06 — Final verification — Live wallet-level testnet verification is operator-owned.** The automated fresh-user run reached wallet sign-in and asset-draft creation, and a registration transaction was mined (`assets(0xa12be287a2fba330af8a6f6bd8e59a169cd4f4dd18b83503b226907a984432f1)` returns active), but the full DB-confirmed asset -> job -> license proof was not completed and this environment has no real injected wallet extension. Per operator instruction, the operator is funding the wallet and will handle the empty-balance failure and successful transaction checks manually in a real browser. Consequence: automated evidence ends at the verified sign-in/draft/transaction path and the post-handoff ghost reconciliation; the operator owns the live wallet-level result. Files: `apps/web/tests/fresh-user-flow.mjs`, `scripts/db/reset-test-data.mjs`, `AI_HANDOFF.md`.

**L-012 — 2026-11-06 — Final polish — The custom `zorq-preview` alias still serves the previous UI build.** Vercel CLI alias mutation endpoints remain challenge-blocked from this environment (`login_required` / security checkpoint), so the new UI cannot be force-promoted to the manually maintained custom alias. Consequence: the stable custom preview URL shows the older light UI, while the new UI is live and verified on the production alias `https://zorq-six.vercel.app` and the preview branch alias `https://zorq-git-preview-uhhh2.vercel.app`. Mitigation: provide a fresh `VERCEL_TOKEN` and run `vercel alias set` for the latest preview deployment, or point the custom domain at the preview branch in the Vercel dashboard. Files: `AI_HANDOFF.md`, `docs/evidence/preview-signin.txt`.

**L-001 — 2026-11-05 — Phase 1 — Vercel edge security checkpoint blocks automated access from the build environment.** After the initial successful deployment, requests to `*.vercel.app` and `api.vercel.com` from this environment return HTTP 403 `Vercel Security Checkpoint` (`x-vercel-mitigated: challenge`), and the stored Vercel CLI session expired without being able to refresh. Consequence: automated deployed-preview E2E, deployment inspection and CLI environment updates cannot run here; git-push deployments still work. Mitigation: local production-build E2E plus operator browser verification, and re-authentication or a fresh `VERCEL_TOKEN` if the operator can supply one.

**L-002 — 2026-11-05 — Phase 1 — Stable preview alias is maintained manually.** The auto-generated branch alias `zorq-git-preview-uhhh2.vercel.app` returned 404 because Vercel did not create a preview deployment for the `preview` branch push. The stable URL is a custom alias to the latest preview deployment. Consequence: each checkpoint must re-alias the newest preview deployment, currently blocked by L-001. Mitigation: use git-push preview deployments once Vercel preview detection is confirmed, or restore CLI access and re-alias.

**L-003 — 2026-11-05 — Phase 2 — Logout is client-cookie clearing; signed sessions are stateless.** The session JWT is not revoked server-side on logout. A copied cookie remains cryptographically valid until its eight-hour expiry. Consequence: logout removes the browser credential but cannot invalidate a stolen copy. Mitigation: HttpOnly/Secure/SameSite cookie, short eight-hour lifetime, no localStorage; a server-side session revocation table is future work. Files: `apps/web/src/server/auth/session.ts`, `docs/SECURITY_AND_PRIVACY.md`.

**L-004 — 2026-11-05 — Phase 2 — Vercel edge checkpoint blocks headless/bulk preview automation.** Direct curl and headless Playwright traffic to `*.vercel.app` from this environment intermittently returns HTTP 403 “Vercel Security Checkpoint”; a headful browser under xvfb clears it. Consequence: deployed-preview evidence uses `tests/preview-smoke.mjs` rather than the full headless suite; the full 40-test suite runs locally. Mitigation: headful xvfb preview smoke; operator browser verification; do not loop retries.

**L-005 — 2026-11-05 — Phase 2 — Real Substrate wallet-extension UI path is not exercised in this environment.** Server-side sr25519 verification and the deployed API sign-in are tested with generated keypairs, but no polkadot.js/Talisman/SubWallet extension is installed in the build environment. Consequence: the browser `fromExtension` + `signRaw` UI path needs an operator manual check with a real extension. Mitigation: server verification is extension-agnostic; add a mock-injected extension to Playwright in Phase 5. Files: `apps/web/src/lib/wallet-client.ts`, `AI_HANDOFF.md`.

**L-006 — 2026-11-05 — Phase 3 — Portaldot code storage deposit dominates deployment cost.** The chain charges a storage deposit proportional to deployed code size (observed effective rate roughly `0.0009` tPOTv3 per byte). The size-optimized `ZorqRegistry` runtime code is 6,861 bytes, so the deployer needs more than the initial 10 tPOTv3 faucet claim after failed-attempt fees. Consequence: testnet deployment waits for a small operator top-up; contract functionality is verified locally. Mitigation: viaIR/size optimization reduced the contract; the deploy script now aborts before sending when the balance is below the conservative estimate. Files: `packages/contracts/scripts/deploy-portaldot.ts`, `AI_HANDOFF.md`.

**L-007 — 2026-11-05 — Phase 3 — Portaldot protocol-level instantiation deposit is ~22 tPOTv3 even for a 116-byte contract.** Free dry-run probes measured `22.1580` tPOTv3 for a minimal contract and `revive.depositPerByte = 6e12` native (`0.06` tPOTv3 per runtime byte). `ZorqRegistry` is therefore estimated at 430–500 tPOTv3. The 10-tPOT faucet is structurally insufficient for any useful contract. Consequence: testnet deployment cannot proceed with faucet-only funding; the application can still be fully verified on a local Hardhat EVM. Mitigation: operator supplies a ~500 tPOTv3 account or authorizes the documented local-chain fallback; no further faucet claims should be sent to this address. Files: `packages/contracts/scripts/deploy-portaldot.ts`, `AI_HANDOFF.md`.

**L-008 — 2026-11-05 — Phase 3 — Testnet license mint exceeds the remaining deployer balance.** The deployer holds ~19.1 tPOTv3 after contract deployment and successful asset/job creation; the license mint's storage deposit is higher than that. Consequence: the testnet license/revocation leg cannot be completed without another small top-up, although the API and contract paths are implemented and contract-tested. Mitigation: top up ~10 tPOTv3 and rerun `tests/integration/license-flow.ts`; the local contract tests cover the same rules. Files: `apps/web/tests/integration/license-flow.ts`, `AI_HANDOFF.md`.

**L-009 — 2026-11-05 — Phase 4 — Successful three-round FL run needs funded assets and licenses.** The MVP requires two distinct authorized assets. The deployer holds one active testnet asset and an open job, but lacks the storage deposit for a second asset and two licenses. The Render FL service is live and its fail-closed path is verified; the authorized training path cannot be demonstrated on testnet until approximately 70–100 tPOTv3 is supplied or the operator authorizes a local-chain fallback. Files: `AI_HANDOFF.md`, `apps/fl-service/**`.

**L-011 — 2026-11-06 — Phase 9 — Five production dependency advisories remain in the Polkadot address utility chain.** `npm audit --omit=dev` reports five high advisories through `@polkadot-apps/address → polkadot-api → deepmerge-ts/write-package`; the proposed fix is a major downgrade of the address utility. Zorq uses only `ss58ToH160` with validated string inputs, so the recursive-merge path is not exposed, but the advisories remain. Consequence: dependency audit is not clean; do not claim a zero-vulnerability release. Mitigation: replace the address utility with a small local SS58→H160 implementation or track an upstream fix before production use. Files: `package-lock.json`, `AI_HANDOFF.md`.

## Post-Phase 10 hotfix — sign-in nonce failure (6 November 2026)

**Symptom:** the operator saw “The sign-in challenge could not be created” after connecting a wallet on the deployed app.

**Diagnosis:** Vercel runtime logs showed repeated `auth.nonce.failed` / `INTERNAL_ERROR` on the production deployment `dpl_4hz1dxMJktrJppn13d2vbD1qFj7q` (`zorq-hn5wh421l-uhhh2.vercel.app`). That deployment had only the Neon-injected database variables; `APP_ORIGIN`, `SESSION_SECRET`, `RATE_LIMIT_SECRET`, `ZORQ_CONTRACT_ADDRESS`, `FL_SERVICE_URL` and the public Portaldot variables existed only in Preview. `getServerEnv()` therefore threw before the nonce route could run, producing the generic 500 envelope. The stable Preview deployment already had correct values and returned nonce 200.

**Fix:**
1. Verified Preview values are exactly `APP_ORIGIN=https://zorq-preview-uhhh2.vercel.app` and `NEXT_PUBLIC_APP_URL=https://zorq-preview-uhhh2.vercel.app` (no trailing slash), with `SESSION_SECRET`, `DATABASE_URL`, `ZORQ_CONTRACT_ADDRESS`, `FL_SERVICE_URL` and the public Portaldot variables present.
2. Added the missing config and secrets to the Vercel **Production** environment and redeployed with `vercel deploy --prod`.
3. Hardened the nonce path: `packages/db/src/client.ts` now uses a 30s connect timeout and 30s idle timeout; `/api/auth/nonce` and `/api/auth/verify` set `maxDuration = 30`; a transient Neon connect/timeout error triggers one retry. The generic user-facing message is now “temporarily unavailable”, without exposing internals.

**Verification:** Production `/api/ready` reports database connected, chain verified and contract configured; `/api/auth/nonce` returns 200. Stable Preview `/api/ready` is ready and `/api/auth/nonce` returns 200. A headful Playwright run with a mock Substrate extension clicked Connect wallet → Sign in, observed the `/api/auth/nonce` response 200, and reached “Signed in”. Evidence screenshot: `docs/evidence/signin-success.png`; test script: `apps/web/tests/preview-signin-hotfix.mjs`.

**Regression checks:** auth integration passed (nonce, signature, cookie flags, replay rejection, invalid signature, wrong origin, logout, rate limit); contract tests 11/11; FL service tests 3/3; web unit 10/10; scaffold 4/4. No business-rule assertion was weakened.

**Security:** no token, secret, seed or database URL was printed. The hotfix changes configuration, timeout/retry behaviour and the generic error copy only; no contract, schema, ownership or authorization semantics changed.

## Post-Phase 10 hotfix 2 — ORIGIN_MISMATCH on the Vercel alias (6 November 2026)

**Symptom:** after the nonce/database fix, clicking **Sign in** returned the red banner “The request origin is not allowed.”

**Diagnosis:** Vercel runtime logs for `/api/auth/nonce` showed `ORIGIN_MISMATCH` on deployment `dpl_DtNzH8G3jUTP7JpFQLz2DvhRQSFd` at 01:33–01:34Z with `domain=zorq-six.vercel.app`. The browser was on `https://zorq-six.vercel.app`, an official production alias of the same Vercel project; the request `Origin` header was valid but `APP_ORIGIN` was `https://zorq-uhhh2.vercel.app`, so the single-origin allowlist rejected it before nonce creation. No `Host`/`x-forwarded-host` spoofing or non-standard SubWallet header was involved.

**Fix:**
1. Added `ALLOWED_ORIGINS` (optional comma-separated) plus an exact built-in set of the project’s Vercel production and preview aliases. No wildcard, suffix matching or request-host fallback is used.
2. Normalized the browser `Origin` header with `new URL(raw).origin`, accepting only `http`/`https` origins and rejecting missing/malformed values.
3. Bound each SIWE challenge to the validated request origin: the nonce stores its `domain` and `uri`, and `/api/auth/verify` validates the signed message against those stored values rather than a single global origin.
4. Added the request origin to failed-auth structured logs for future diagnosis. No secret, token or database URL is logged.

**Environment verification:** Preview `APP_ORIGIN` and `NEXT_PUBLIC_APP_URL` remain exactly `https://zorq-preview-uhhh2.vercel.app` (no trailing slash). Production remains its own canonical `https://zorq-uhhh2.vercel.app`; forcing the preview origin into production would mislabel the production deployment, so the failing production alias `https://zorq-six.vercel.app` is explicitly allowed instead.

**Verification:** commit `cb5f94c`; Vercel deployment status success. A headful Playwright run with a mock Substrate extension against `https://zorq-six.vercel.app` observed `/api/auth/nonce` **200**, a SIWE message with `domain=zorq-six.vercel.app` and `URI: https://zorq-six.vercel.app`, and reached “Signed in”. The same check passed against `https://zorq-preview-uhhh2.vercel.app` with its own domain. Screenshots: `docs/evidence/signin-zorq-six.png`, `docs/evidence/signin-preview.png`; log: `docs/evidence/origin-hotfix.txt`; script: `apps/web/tests/preview-signin-hotfix.mjs`.

**Regression checks:** web unit 14/14 (3 files), auth integration passed, typecheck/lint/build passed, local Playwright 40/40, contract 11/11, FL 3/3. No origin check was bypassed and no business-rule assertion was weakened.

## Final polish pass — bugs, reference UI, video re-render (6 November 2026)

**Part 1 — frontend bug fixes**

- Asset registration now reads reserved synthetic partitions from the database before the form renders and disables every in-use option with an “(In use)” label. The selected default is the first free partition; if none remain, submission is disabled. `/api/assets` also exposes the read-only `usedPartitions` list for other clients. The server-side uniqueness rule is unchanged.
- Job, asset, license and revocation client flows now parse empty/null JSON bodies defensively, validate draft shapes and transaction hashes, and never read properties from a null response. Wallet rejection, insufficient testnet POT, empty signature and null-response failures produce readable messages instead of a JavaScript crash.
- Sign-in now reloads the server-rendered app after a successful SIWE verification, so the page content and header share the same session state. The mock-extension Playwright test checks both `/api/auth/nonce` and `/api/auth/verify` return 200.

**Part 2 — reference UI overhaul**

- `reference3.webp` is now the primary visual source: near-black canvas, lime accent, dot grid, compact icon rail, top dashboard bar, large greeting, lime metric cards, dense tables and dark document cards.
- All public and app routes were restyled, including loading, error, 404, forms, wallet, detail pages and mobile table layouts. Stageshow craft rules informed hierarchy, spacing, icon consistency and accent restraint; the kit and reference assets were not copied.
- No route behaviour, permission rule, contract call, database schema or business authorization rule changed. The only API addition is the read-only partition list described above.

**Part 3 — demo video**

- `docs/demo/narration.md` now opens immediately with the data-privacy problem, contains no presenter name and spells no hex address, block height, transaction hash or long numeric ID. The same `en-US-BrianNeural` voice at `-4%` was retained.
- `docs/demo/timeline.json` was retimed to a 2:02 target. The Playwright capture was re-run against the new UI on the preview branch alias, the end card was restyled to the dark/lime system, and `scripts/demo-video/render.sh` now sizes the evidence card to the remaining narration time.
- Final video: `docs/demo/zorq-demo.mp4`, 122.5 seconds, 1280×720, H.264/AAC, under the 3:00 hard limit.

**Verification**

- `npm run typecheck`, `npm run lint`, `npm run build` — pass.
- Web unit/scaffold — 27/27 Vitest + 4/4 scaffold.
- Local Playwright — 40/40 desktop + mobile.
- Auth integration — pass (nonce, signature, cookie flags, replay, invalid signature, wrong origin, logout, rate limit).
- Contract — 11/11; FL service — 7/7.
- Deployed sign-in and data-page smoke — pass on `https://zorq-six.vercel.app` and `https://zorq-git-preview-uhhh2.vercel.app`.
- Evidence: `docs/evidence/signin-zorq-six.png`, `docs/evidence/signin-preview.png`, `docs/evidence/ui-overview.png`, `docs/evidence/ui-landing.png`.

**Deployment note:** the custom `zorq-preview` alias remains on the previous build because Vercel alias mutation is challenge-blocked (L-012). The new UI is live on the production alias and the preview branch alias above.

## Auth-state, enterprise copy and logo pass (6 November 2026)

- **Auth state:** `/app/assets/new` no longer treats a valid SIWE session as unauthenticated when the wallet extension is disconnected. The form resolves the wallet on demand, and any 401 response triggers one SIWE prompt and a retry. The exact regression is covered by `apps/web/tests/auth-state-smoke.mjs`.
- **Copy:** “Synthetic demo partition” is now “Data Partition”; the commitment copy is “A salted commitment is integrity evidence. Raw data partitions never leave the provider's runtime.”; the app footer reads “© 2026 Zorq · Protocol Infrastructure.” Visible synthetic/demo/prototype language was replaced with enterprise wording across React UI. README/docs retain the honest evaluation-data and testnet limitations.
- **Logo:** a new geometric Zorq SVG mark is used in the header, footer, app rail and favicon.
- **Documentation:** `README.md` now includes a project overview, Mermaid architecture diagram, repository layout, local setup, environment variable table, Portaldot deployment evidence and testing/security guidance. `/docs` now covers architecture, lifecycle, snapshots, auth, APIs, local development, deployment and testing.
- **Declutter:** removed `.next`, Playwright reports, test results, TypeScript build info, demo raw captures and log artifacts from the working tree; tightened `.gitignore`; no temporary debugging scripts remain under `scripts/`.
- **Video:** re-rendered against the final logo and enterprise copy at 122.5s; the capture aborts on failed auth and the evidence card was updated to evaluation-deployment wording.
- **Verification:** web unit/scaffold 27/27 + 4/4; local Playwright 40/40; auth integration pass; auth-state smoke pass; contract 11/11; FL 7/7; typecheck/lint/build pass.

## DB reset, transaction hardening and external databases (6 November 2026)

- **Test data cleared:** `scripts/db/reset-test-data.mjs` deletes `authorization_checks`, `training_rounds`, `training_runs`, `job_participants`, `licenses`, `chain_transactions`, `fl_jobs`, `data_assets` and stale idempotency records in dependency order. It was run successfully; all listed tables ended at zero.
- **Transaction hardening:** asset/job/license/revocation writes now use the injected Substrate signer through direct `revive.call`, decode module errors, wait for eight confirmations and return the hash/block hash. Exact failures are logged to the browser console and shown in the UI. `StorageDepositNotEnoughFunds` maps to “Insufficient testnet POT for the storage deposit. Fund the wallet and retry.”
- **External database feature:** implemented end-to-end across the asset form, Zod/Drizzle schema and migration, encrypted credential storage, internal snapshot enrichment, and the Python coordinator. External participants are normalized to the eight-feature model; a failed source is marked `DATA FAILED` and skipped, and the run fails closed only if fewer than two participants load. Deployed evidence: `docs/evidence/external-database-form.png`; smoke script: `apps/web/tests/external-form-smoke.mjs`.
- **Tests:** web unit/scaffold 27/27 + 4/4; local Playwright 40/40; auth integration pass; auth-state smoke pass; contract 11/11; FL 7/7; typecheck/lint/build pass. External loader tests cover SQLite fixtures, missing labels and failure isolation.
- **Live verification owner:** L-013. The operator is funding the deployer and performing the final fresh asset -> job -> license check manually in a real browser. The post-handoff ghost reconciliation is complete and the remaining active test assets/job were retained.

## Post-handoff transaction UX hardening (6 November 2026)

**Symptoms reported on the live testnet:** failed wallet transactions left `draft`/`pending_chain` rows that appeared as ghost assets/licenses; license transactions that succeeded stayed `pending_chain`; the UI blocked for 10–15 seconds waiting for Substrate finality; detail/creation pages had no back navigation.

**Fixes**

- Asset, job and license drafts are now hidden from every list and are only used to obtain the server-generated chain identifiers and arguments. They are never presented as pending before the user signs.
- After a wallet rejection, insufficient tPOT/storage deposit, or dispatch error, the client calls the new `DELETE /api/{assets|jobs|licenses}/{id}` endpoint and the draft is removed. Timeouts/network ambiguity retain the hidden draft for the 30-minute safety cleanup rather than deleting a possibly-settled transaction.
- `submitContractTransaction` resolves immediately after block inclusion and returns `{hash, blockHash}`. Asset, job and license forms call the new `/pending` route and redirect to `/app/assets`, `/app/jobs` or `/app/licenses` without waiting for finality.
- List pages render a **pending** badge and `PendingSync` polls `/confirm` every four seconds. The backend verifies the receipt/event and updates `pending_chain` to `active` (assets/licenses) or `open` (jobs). Synchronous revoke/job-state actions retain an eight-confirmation wait so their existing confirmation contracts do not regress.
- Cleanup removes unsubmitted drafts older than 30 minutes and `pending_chain` rows with no transaction hash. These rows cannot be confirmed because no hash exists.
- Detail and creation pages now show a compact `← Back` link to their parent list (`/app/assets`, `/app/jobs`, `/app/licenses`); the run monitor links back to its job.

**Live database reconciliation:** Three license rows were `pending_chain` with `chain_tx_hash = NULL`. A read-only contract call for each asset/job pair returned `latestLicenseId = 0`, proving no token had been minted. Those three ghosts and one stale draft asset were deleted; active assets and the open job were retained. Post-cleanup: `0` ghost licenses, `0` unsubmitted asset drafts, `0` ghost jobs.

**Verification:** `npm run typecheck`, `npm run lint` and `npm run build` pass. Web unit/scaffold is 28/28 + 4/4. Playwright desktop + mobile is 40/40 on a warm local dev server; the first cold run hit two 30-second compile timeouts on `/app` and `/app/assets`, and both passed on the targeted warm rerun before the full 40/40 pass. The production build manifest includes `/api/assets/[assetId]/pending`, `/api/jobs/[jobId]/pending`, `/api/licenses/[licenseId]/pending` and the `DELETE` handlers. A real injected wallet and funded/empty testnet account are not available in this environment, so the final wallet-level empty-balance and successful-transaction checks remain operator-owned (L-013).

## Operator manual verification handoff (6 November 2026)

- The operator is funding the deployer wallet and will complete the live testnet end-to-end flow manually in a real browser.
- The agent completed the ghost-record/optimistic-transaction hardening; live wallet-level verification remains operator-owned.
- The Neon test-data tables are not zeroed because the operator's active test assets/job are retained. The post-handoff reconciliation removed the three unsubmitted license ghosts and one stale draft asset; there are now zero pending rows without a transaction hash and zero unsubmitted drafts.
- The external-database feature, transaction hardening, optimistic pending-to-active lists, back navigation, enterprise copy/logo, README/docs and `/docs` are implemented and pushed.
- Latest deployed web alias: `https://zorq-six.vercel.app`; preview branch: `https://zorq-git-preview-uhhh2.vercel.app`; FL service: `https://zorq-fl-service.onrender.com`.

## Phase 8/9/10 completion report

```text
Phase 8 — docs/frontend completeness: complete. README, API reference, deployment runbook, test plan, Portaldot validation, user guide, FL service guide and in-app /docs updated. All agreed routes, responsive layouts, metadata and footer links are present. Preview data smoke passed for the deployer session and run evidence.
Phase 9 — regression/security/release: complete for the MVP scope. Contract tests 11/11; FL tests 3/3; web unit 10/10 + scaffold 4/4; auth integration passed; local Playwright 40/40; preview smoke and preview data smoke passed; production dependency audit shows 5 high advisories in the Polkadot address utility chain (not in the Zorq request path; logged as L-011 if required). Secret scan found no tracked or client-bundle leakage.
Phase 10 — demo video: complete with one documented exception. docs/demo/zorq-demo.mp4 is 130.99s (2:11), 1280×720, H.264/AAC, real screen capture of the live preview, male free Edge neural narration, no presenter name, no copied reference footage/music/logos. Google AI Studio voice was unavailable (L-010).
```

## Final handoff summary

```text
Total phases completed: 10 (Phase 10 with the Google TTS exception in L-010)
Total decisions logged: 23 (D-001 … D-023)
Total known limitations: 13 (L-001 … L-013)

Final contract: 0xa9ab18d404e2cd19c23f30e7d78a740b562685ff
Deployment tx: 0xb39268c84b4b62465531cd00659d20364c1ea8ed91cf4995d0fe03e5a02a1834
Deployment block: 337014
Chain ID: 420420777

Demo run: e18c1749-21f4-4cf4-b74a-2ed107f5d6cf
Run status: completed 3/3
Final model hash: 0x1368046d874980a3b0575c9299fe929dc1a29566728f7b105461ad8fef602caf
Revocation evidence: token 3 revoked block 341655; denied at snapshot block 341656
Round snapshots: 341642 (3 authorized), 341651 (3 authorized), 341656 (2 authorized, token 3 REVOKED)

New UI production alias: https://zorq-six.vercel.app
New UI preview branch alias: https://zorq-git-preview-uhhh2.vercel.app
Custom stable preview alias: https://zorq-preview-uhhh2.vercel.app (still previous build; L-012)
FL service: https://zorq-fl-service.onrender.com
Repository: https://github.com/onyebuchidaniel60/Zorq
Demo video: docs/demo/zorq-demo.mp4 (2:02)
Evidence: docs/evidence/demo-run.json

Verification steps:
1. Open `https://zorq-six.vercel.app` or the preview branch alias; load /, /docs, /app and the run monitor.
2. Run `npm run typecheck && npm run lint && npm run build && npm run test`.
3. Run `npm --workspace @zorq/contracts test`.
4. Run `cd apps/fl-service && uv run pytest -q`.
5. Run `npx playwright test` (local 40/40) and `xvfb-run -a node tests/preview-data-smoke.mjs`.
6. Inspect the contract on the explorer and read owner/supportsInterface; compare the deployment record in packages/contracts/deployments/portaldot-v3.json.
7. Open the run monitor and verify round snapshots 341642/341651/341656 and token 3 REVOKED at round 3.
8. Play docs/demo/zorq-demo.mp4; confirm duration 2:02 and the dark evidence end card.
9. Read AI_HANDOFF.md Decision Log and Known Limitations before submission.
```

## Explorer links, button states and Quick Start (6 November 2026)

- **Explorer links:** Confirmed assets, jobs and licenses now show an external-link icon in their list rows and detail pages. The link is built by `explorerTxUrl()` and points to `NEXT_PUBLIC_PORTALDOT_EXPLORER_URL/#/extrinsics/<txHash>`. The scanner is a hash-router SPA; a browser check against the deployment extrinsic confirmed that `/#/extrinsics/<hash>` renders the extrinsic detail, while `/tx/<hash>` falls back to the home shell.
- **Visibility rule:** The icon appears only when the row has a transaction hash and a confirmed status. `draft` and `pending_chain` rows do not render it. Jobs add a creation-transaction block on their detail page; assets and licenses reuse their existing transaction block with a labelled “View on explorer” link.
- **Button interaction:** Primary buttons now have pointer cursors, a lifted/darker hover state, a pressed scale state, disabled styling and an `aria-busy` spinner state. “Register asset”, “Publish job”, “Issue DataLicense”, “Revoke license” and “Start three-round run” show “Waiting for wallet…”, “Confirming on chain…” or “Starting run…” while the action is in progress.
- **Quick Start:** A numbered six-step checklist is now at the top of `README.md` and in a prominent dark card on `/docs`. Both cover wallet sign-in, demo asset registration, job creation, licensing at least two assets (three for the revocation demo), starting the run, and revoking mid-run. Both warn that tPOT is required for gas and storage deposits.
- **Docs refresh:** `/docs` testing counts updated to 31/31 + 4/4.

**Verification:** `npm run typecheck`, `npm run lint` and `npm run build` pass. Web unit/scaffold is 31/31 + 4/4. Playwright is 40/40 desktop + mobile. The explorer hash route was opened in a real browser against the deployment extrinsic and rendered the extrinsic detail. An authenticated local browser session rendered the jobs list with the new explorer icon and the `/docs` Quick Start card was visually inspected. Live wallet-level testing remains operator-owned (L-013).

## Post-handoff hardening completion report

```text
Assigned phase/task: Phase 10 post-handoff — ghost draft/pending cleanup, optimistic pending-to-active lists, and back navigation
Commit SHA: 51f5151 + d88f167 (code/docs); report b02d803
Preview URL (exact): https://zorq-six.vercel.app and https://zorq-git-preview-uhhh2.vercel.app
Deployed commit/deployment ID: Vercel auto-deploy from the pushed commits. Both aliases were observed serving the new `Back to assets` markup on /app/assets/new. The dashboard deployment ID is not exposed by the deployment headers from this environment (L-001).
Changes visible:
- Drafts are excluded from asset, job and license lists.
- Failed/rejected/insufficient-tPOT transactions delete the unsubmitted draft; ambiguous timeouts keep it hidden for the 30-minute cleanup.
- Successful inclusion redirects to the parent list, shows a pending badge, and polls /confirm every 4 seconds until active/open.
- Pending jobs are visible only to their creator until published.
- ← Back links on asset, job, license and run detail/creation pages.
Intentionally incomplete areas:
- Live wallet-level checks with a real extension, a 0-tPOT account and a funded successful transaction remain operator-owned (L-013). No automated test fabricates a wallet signature or transaction.
- Revoke and job-state actions retain the eight-confirmation synchronous wait; only creation flows are optimistic.
Tests (exact commands + actual results):
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — 28/28 Vitest, 4/4 scaffold.
- `npm run build` — pass; `/api/{assets,jobs,licenses}/[id]/pending` and DELETE handlers present in the route manifest.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npx playwright test` — 40/40 desktop + mobile after warm-up. The first cold run timed out on two desktop routes during dev compilation; both passed on targeted warm rerun and the full warm suite passed.
- Live DB reconciliation — read-only `latestLicenseId` returned 0 for three `pending_chain` licenses with null transaction hashes; those three ghosts and one stale draft asset were removed. Active assets and the open job were retained.
Manual verification: Inspected the deployed `/app/assets/new` HTML on both aliases for the new back link. Confirmed the route manifest and DB post-cleanup counts. No wallet transaction was sent.
Known issues/blockers: L-012 (custom alias) and L-013 (live wallet verification); no code blocker.
Security notes: No key, seed, session cookie, database URL or service token was printed. Draft deletion is owner-scoped, same-origin and session-protected. Confirmation remains receipt/event-verified and fail-closed; cleanup never deletes active/revoked records.
Design reference image status (supplied / missing / ambiguous): supplied and unchanged (`docs/design/reference/reference3.webp`); this pass adds no new visual direction.
Operator approval status (visuals: waived): waived.
README/docs status: README, API reference, user guide and test plan updated with the draft/pending lifecycle and the reconciliation evidence.
Documentation footer URL: `/docs` (reachable on both deployed aliases).
GitHub URL or documented reason absent: https://github.com/onyebuchidaniel60/Zorq
Decisions logged this phase: D-021, D-022
New Known Limitations this phase: none (L-012 and L-013 remain)
Next single task: Operator manual testnet verification with a real wallet: attempt a 0-tPOT failure and confirm no ghost row, then complete a successful asset/job/license flow and watch pending become active.
```

## Explorer/button/Quick Start completion report

```text
Assigned phase/task: Final UX polish — Portaldot explorer links, interactive button states and Quick Start onboarding
Commit SHA: 334fba5 (code/docs); this report is committed immediately after
Preview URL (exact): https://zorq-six.vercel.app and https://zorq-git-preview-uhhh2.vercel.app
Deployed commit/deployment ID: Vercel auto-deploy from 334fba5; dashboard deployment ID is not exposed by deployment headers from this environment (L-001).
Changes visible:
- Confirmed asset, job and license rows and detail pages show an external-link icon to the Portaldot scanner.
- Primary submit buttons have hover, pressed, disabled and spinner/aria-busy states.
- README and /docs open with a six-step Quick Start and a tPOT storage-deposit warning.
Intentionally incomplete areas:
- Live wallet-level testing (0 tPOT failure and a funded successful transaction) remains operator-owned (L-013).
- The custom zorq-preview alias remains on the previous build (L-012); production and preview-branch aliases are current.
Tests (exact commands + actual results):
- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — 31/31 Vitest, 4/4 scaffold.
- `npm run build` — pass.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npx playwright test` — 40/40 desktop + mobile.
- Explorer route browser check — `https://scanner-testnet-v3.portaldot.dev/#/extrinsics/<deployment-tx>` rendered the extrinsic detail; `/tx/<hash>` fell back to the home shell.
- Authenticated local render — deployer session rendered the jobs list with the explorer href.
- `/docs` Quick Start — visually inspected at 1440px.
Manual verification: Opened the scanner detail route, inspected the authenticated jobs list and /docs screenshot, and confirmed the generated href. No wallet transaction was sent.
Known issues/blockers: L-012 and L-013; no code blocker.
Security notes: Explorer links only contain public transaction hashes and public network configuration. No secret, key, cookie, database URL or service token was printed. External links use rel="noreferrer" and target="_blank".
Design reference image status (supplied / missing / ambiguous): supplied and unchanged (`docs/design/reference/reference3.webp`); this pass follows the existing dark/lime system.
Operator approval status (visuals: waived): waived.
README/docs status: README Quick Start added at the top; /docs Quick Start card added; test plan and handoff updated.
Documentation footer URL: /docs (reachable on both deployed aliases).
GitHub URL or documented reason absent: https://github.com/onyebuchidaniel60/Zorq
Decisions logged this phase: D-023
New Known Limitations this phase: none (L-012 and L-013 remain)
Next single task: Operator manual testnet verification with a real wallet.
```

## Exact next task

Operator manual testnet verification. The agent has completed the code and documentation changes; live wallet-level checks remain operator-owned.
