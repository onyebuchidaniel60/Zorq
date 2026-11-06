# AI_HANDOFF.md — Zorq

**Execution mode:** Autonomous. Phase completion reports are for the record, not for approval. See AGENTS.md §1.1. The only stops are hard blockers.

**Last updated:** 5 November 2026
**Project state:** Phases 1–10 complete. Portaldot contract, three assets, three licenses, completed three-round Flower run and revocation exclusion are live; reference UI, docs and demo video are committed.
**Current phase:** Phase 10 complete. Final handoff below.

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

**L-010 — 2026-11-06 — Phase 10 — Demo narration uses a free Microsoft Edge neural male voice, not Google AI Studio.** No Google AI Studio credential or API key was supplied in the prerequisites manifest or environment, and the task cannot create a Google account/API key without operator input. Consequence: the `docs/DEMO_VIDEO.md` hard gate requiring a free Google AI Studio voice is not met, although the narration is synthetic, non-cloned, free, male, and contains no presenter identity. Mitigation: re-render `docs/demo/narration.md` with a Google AI Studio voice and remux using `scripts/demo-video/` when a key is supplied. Files: `docs/demo/zorq-demo.mp4`, `docs/demo/narration.md`, `docs/demo/timeline.json`.

## Known Limitations

Append-only. One entry per limitation accepted by the agent rather than fixed, including the reason and any user-facing consequence.

Format: `L-NNN — YYYY-MM-DD — Phase N — short title — description — consequence — mitigation-if-any`

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

## Phase 8/9/10 completion report

```text
Phase 8 — docs/frontend completeness: complete. README, API reference, deployment runbook, test plan, Portaldot validation, user guide, FL service guide and in-app /docs updated. All agreed routes, responsive layouts, metadata and footer links are present. Preview data smoke passed for the deployer session and run evidence.
Phase 9 — regression/security/release: complete for the MVP scope. Contract tests 11/11; FL tests 3/3; web unit 10/10 + scaffold 4/4; auth integration passed; local Playwright 40/40; preview smoke and preview data smoke passed; production dependency audit shows 5 high advisories in the Polkadot address utility chain (not in the Zorq request path; logged as L-011 if required). Secret scan found no tracked or client-bundle leakage.
Phase 10 — demo video: complete with one documented exception. docs/demo/zorq-demo.mp4 is 130.99s (2:11), 1280×720, H.264/AAC, real screen capture of the live preview, male free Edge neural narration, no presenter name, no copied reference footage/music/logos. Google AI Studio voice was unavailable (L-010).
```

## Final handoff summary

```text
Total phases completed: 10 (Phase 10 with the Google TTS exception in L-010)
Total decisions logged: 13 (D-001 … D-013)
Total known limitations: 11 (L-001 … L-011)

Final contract: 0xa9ab18d404e2cd19c23f30e7d78a740b562685ff
Deployment tx: 0xb39268c84b4b62465531cd00659d20364c1ea8ed91cf4995d0fe03e5a02a1834
Deployment block: 337014
Chain ID: 420420777

Demo run: e18c1749-21f4-4cf4-b74a-2ed107f5d6cf
Run status: completed 3/3
Final model hash: 0x1368046d874980a3b0575c9299fe929dc1a29566728f7b105461ad8fef602caf
Revocation evidence: token 3 revoked block 341655; denied at snapshot block 341656
Round snapshots: 341642 (3 authorized), 341651 (3 authorized), 341656 (2 authorized, token 3 REVOKED)

Stable preview: https://zorq-preview-uhhh2.vercel.app
Preview deployment: https://zorq-fx6oe372j-uhhh2.vercel.app (commit 7772843; latest docs-only commit follows)
Production URL: out of scope; Vercel project has a default production target only by convention
FL service: https://zorq-fl-service.onrender.com
Repository: https://github.com/onyebuchidaniel60/Zorq
Demo video: docs/demo/zorq-demo.mp4 (2:11)
Evidence: docs/evidence/demo-run.json

Verification steps:
1. Open the stable preview; load /, /docs, /app and the run monitor.
2. Run `npm run typecheck && npm run lint && npm run build && npm run test`.
3. Run `npm --workspace @zorq/contracts test`.
4. Run `cd apps/fl-service && uv run pytest -q`.
5. Run `npx playwright test` (local 40/40) and `xvfb-run -a node tests/preview-data-smoke.mjs`.
6. Inspect the contract on the explorer and read owner/supportsInterface; compare the deployment record in packages/contracts/deployments/portaldot-v3.json.
7. Open the run monitor and verify round snapshots 341642/341651/341656 and token 3 REVOKED at round 3.
8. Play docs/demo/zorq-demo.mp4; confirm duration 2:11 and the evidence end card.
9. Read AI_HANDOFF.md Decision Log and Known Limitations before submission.
```

## Exact next task

Submission handoff. No further implementation is required for the frozen MVP; any post-deadline work should address L-010 (Google AI Studio voice) and the dependency advisories, then re-run the published verification steps.
