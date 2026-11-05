# AI_HANDOFF.md — Zorq

**Execution mode:** Autonomous. Phase completion reports are for the record, not for approval. See AGENTS.md §1.1. The only stops are hard blockers.

**Last updated:** 5 November 2026
**Project state:** Phase 1 complete — navigable Next.js shell deployed to a stable Vercel Preview; no wallet, database, contract or FL execution yet.
**Current phase:** Phase 1 checkpoint committed. Phase 2 code can proceed; Phase 3 contract deployment waits for operator funding of the preflight SS58 address. Neon provisioning waits for operator acceptance of the Vercel marketplace terms.

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
| Current branch / commit | `main` / Phase 1 checkpoint `a9b3b33`; this report is the commit immediately after |
| Vercel project | `uhhh2/zorq` — root directory `apps/web`, framework `nextjs`, Node `22.x` |
| Stable preview URL | `https://zorq-preview-uhhh2.vercel.app` |
| Deployed preview URL | `https://zorq-me71ph9qo-uhhh2.vercel.app` |
| Deployed commit SHA | `a9b3b33` (shell); deployment ID not retrievable after Vercel edge/CLI access failed |
| Production URL | Out of scope for the MVP; `main` is the Vercel default production branch by project convention |
| Database | Neon via Vercel integration — **awaiting operator ToS acceptance** |
| Render FL service | Not provisioned yet — Phase 4 |
| Portaldot contract address | Not deployed — Phase 3, awaiting funding |
| Contract deployment transaction | Not available |

## Functional status

- Repository classification: application scaffold now exists; no wallet/DB/contract/FL business logic yet.
- Product definition and PRD: specified.
- Architecture and stack: specified; implementation follows it with the logged D-001/D-002 substitutions.
- Contract/API/data model/security: specified in project documents.
- Application implementation: Phase 1 shell only.
- Tests: Phase 1 typecheck/lint/build/unit and local Playwright shell tests pass. Deployed-preview Playwright is currently blocked by the Vercel edge security checkpoint (L-001).
- E2E business flows: not implemented or demonstrated.

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

1. **Hard blocker — Portaldot gas funding:** deployer H160 `0xfb7e252fae2d9e5a849361c22d7e4f8be2bb32bf` (SS58 `5En6zJzY6eXkzns1AxsYzueGMNahKhZwYmXbARWkri9fUi4F`) has balance `0`. Operator must fund the SS58 address with testnet POT and reply `funded` before Phase 3 deployment.
2. **Hard blocker — Neon terms of service:** `vercel integration add neon` returned `integration_terms_acceptance_required`. Operator must open `https://vercel.com/uhhh2/~/integrations/accept-terms/neon?source=cli` and accept the marketplace terms, then the agent can retry provisioning. No acceptance was faked.
3. **Environment limitation — Vercel edge access:** after the first deployment, this environment receives HTTP 403 “Vercel Security Checkpoint” from `*.vercel.app` and `api.vercel.com`, and the Vercel CLI session token expired and cannot refresh. Git-push deployments still work; CLI env/deployment updates and automated preview tests from this environment do not. See L-001.
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

## Decision Log

Append-only. One entry per non-trivial decision made by the agent without operator input. Never edit or remove prior entries.

Format: `D-NNN — YYYY-MM-DD — Phase N — short decision title — rationale — files affected`

**D-001 — 2026-11-05 — Phase 1 — No Docker in local/staging workflow.** Operator instruction supersedes the Docker Compose references in `ARCHITECTURE.md`: use local `psql` for any local Postgres parity, Neon via Vercel for staging/preview, and let Render build the FL Dockerfile remotely. Docker is not installed locally. Files: `README.md`, `docs/DEVELOPER_SETUP.md`, `docs/DEPLOYMENT.md`, `AI_HANDOFF.md`.

**D-002 — 2026-11-05 — Phase 1 — Managed PostgreSQL provider is Neon via the Vercel integration, not Supabase.** Operator instructed Neon provisioning through `vercel integration add neon`; the pooled Neon connection string is used server-side with Postgres.js prepared statements disabled. This is a hosting/provider substitution for the Supabase designation in the frozen architecture; data model and DB authority rules are unchanged. Provisioning awaits operator acceptance of the Neon marketplace terms. Files: `.env.example`, `docs/DEVELOPER_SETUP.md`, `docs/DEPLOYMENT.md`, `AI_HANDOFF.md`.

**D-003 — 2026-11-05 — Phase 1 — Pin Node 22.23.4 and use uv 0.13.7.** Node 22.23.4 is the current supported Node 22 LTS patch and satisfies Hardhat 3/Next.js 16 requirements; `uv` is installed from the official installer for Python dependency management. Files: `.nvmrc`, `package.json`, `package-lock.json`.

**D-004 — 2026-11-05 — Phase 1 — Stable preview uses the custom Vercel alias `https://zorq-preview-uhhh2.vercel.app`, with deployment protection disabled.** The project's default production branch is `main`, so a plain push is labelled Production by Vercel. The custom alias points at the latest preview deployment and keeps a stable, public, testnet-only review URL. Vercel SSO protection was disabled because the preview contains only synthetic data and must be reviewable. Files: `docs/DEPLOYMENT.md`, `AI_HANDOFF.md`.

**D-005 — 2026-11-05 — Phase 1 — Use `twinkey-provider` with a persisted sr25519 keypair for all Portaldot writes.** The chain runtime confirms the SS58→H160 mapping, and direct external EOA transactions are not supported on this build; `twinkey-provider` translates writes into sr25519-signed `revive.call` extrinsics. Deployer key is persisted at `.secrets/deployer.json` (gitignored, mode 0600); only public addresses are reported. Files: `.env.example`, `docs/PORTALDOT_VALIDATION.md`, `AI_HANDOFF.md`.

## Known Limitations

Append-only. One entry per limitation accepted by the agent rather than fixed, including the reason and any user-facing consequence.

Format: `L-NNN — YYYY-MM-DD — Phase N — short title — description — consequence — mitigation-if-any`

**L-001 — 2026-11-05 — Phase 1 — Vercel edge security checkpoint blocks automated access from the build environment.** After the initial successful deployment, requests to `*.vercel.app` and `api.vercel.com` from this environment return HTTP 403 `Vercel Security Checkpoint` (`x-vercel-mitigated: challenge`), and the stored Vercel CLI session expired without being able to refresh. Consequence: automated deployed-preview E2E, deployment inspection and CLI environment updates cannot run here; git-push deployments still work. Mitigation: local production-build E2E plus operator browser verification, and re-authentication or a fresh `VERCEL_TOKEN` if the operator can supply one.

**L-002 — 2026-11-05 — Phase 1 — Stable preview alias is maintained manually.** The auto-generated branch alias `zorq-git-preview-uhhh2.vercel.app` returned 404 because Vercel did not create a preview deployment for the `preview` branch push. The stable URL is a custom alias to the latest preview deployment. Consequence: each checkpoint must re-alias the newest preview deployment, currently blocked by L-001. Mitigation: use git-push preview deployments once Vercel preview detection is confirmed, or restore CLI access and re-alias.

## Exact next task

**Phase 2 — backend, database and authentication foundation.** Operator actions required first: (1) fund SS58 `5En6zJzY6eXkzns1AxsYzueGMNahKhZwYmXbARWkri9fUi4F` with testnet POT at <https://pot-starter-hub.vercel.app> and reply `funded`; (2) accept the Neon marketplace terms at <https://vercel.com/uhhh2/~/integrations/accept-terms/neon?source=cli>. After those, provision Neon, apply the Drizzle schema, implement SIWE sessions/rate limits and continue to Phase 3 deployment.
