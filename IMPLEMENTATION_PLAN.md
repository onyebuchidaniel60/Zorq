# Zorq — Phased Implementation Plan

**Version:** 1.0  
**Date:** 4 November 2026  
**Status:** Pre-implementation plan; no application code has been written.

This plan is subordinate to `PROJECT_SPEC.md` and `ARCHITECTURE.md`. The coding agent executes the phases in order, verifies each, records a checkpoint and continues. It does not redesign the product. The execution model is autonomous as defined in `AGENTS.md` §1.1.

## 0. Non-negotiable sequence

Phase sequence is strictly ordered. Each phase ends with a commit and an `AI_HANDOFF.md` checkpoint, then the agent proceeds directly to the next phase.

```text
Repository inspection + prerequisite manifest (Phase 0)
  -> Phase 1 skeletal frontend + stable preview
  -> Phase 2 backend / DB / SIWE
  -> Phase 3 contract + domain APIs
  -> Phase 4 functional frontend + Flower demo
  -> Phase 5 end-to-end MVP completion
  -> Phase 5.5 first-pass demo video (optional if time-tight)
  -> Phase 6 reference-image handoff
  -> Phase 7 approved reference-image implementation with Stageshow
  -> Phase 8 docs + frontend completeness
  -> Phase 9 security / regression / testnet release
  -> Phase 10 demo video final
```

No phase requires operator approval. The only stops are hard blockers as defined in `AGENTS.md` §1.1.

The product's UX structure and interaction behaviour are already specified in `PROJECT_SPEC.md`. Final visual direction comes from an operator-supplied reference image implemented in Phase 7. The temporary visual system is plain, consistent, responsive and legible. Final styling must not start before the Phase 5 self-verified functional checkpoint is complete.

At every verified phase checkpoint, update the stable preview deployment where applicable and record the exact preview URL, commit SHA, what changed, what remains incomplete, tests and evidence, known issues, design reference status, and docs/footer status in `AI_HANDOFF.md`. A deployment is not a production release.

## Phase 0 — Read-only repository and environment inspection + prerequisite manifest

**Objective:** establish the actual state of the target repository and available deployment environment without changing application files, then produce the exhaustive Prerequisites Manifest.

**Dependencies:** operator supplies repository/workspace and grants appropriate read access; no credentials are pasted into chat or committed.

**Tasks:**
1. Inspect current branch, git status, remote URLs, commit history, repository tree, package manifests, lockfiles, existing tests, environment samples, deployment configuration and docs.
2. Identify whether the repo is empty, an existing prototype, or a continuation. Preserve useful work; do not overwrite.
3. Check Node/npm, Python/uv, Docker, wallet/RPC reachability and local build capability. Do not print secret values.
4. Confirm access to Vercel, Supabase, Render and Portaldot testnet, including the correct test-wallet funding route. If access is missing, state exact prerequisites.
5. Compare the repository against the frozen architecture and list only concrete conflicts.
6. Return a read-only inspection report. Do not create or edit application files in this phase.
7. Record the inspection and Prerequisites Manifest in `AI_HANDOFF.md`.
8. Produce a Prerequisites Manifest. Write it to `PREREQUISITES.md` at the repository root using the template below. Every entry must be actionable: exact variable name, exact access needed, exact decision required, or exact file/data needed. If a decision can be made by the agent from the source docs, it is not in the manifest. Only list items the agent cannot obtain, decide, or generate itself.
   Template entries must cover at minimum:
   - Every credential the agent will need and the exact env var name it belongs in (e.g. `DEPLOYER_PRIVATE_KEY`, `SESSION_SECRET`, `DATABASE_URL`, `FL_SERVICE_SHARED_SECRET`, `RATE_LIMIT_SECRET`, `PORTALDOT_EVM_RPC_URL` if a private endpoint is required).
   - Every external account/project the agent will need already created with the agent granted access: GitHub repo (URL + push access), Vercel project + stable preview branch, Supabase project + connection details, Render service (or explicit instruction to create one; if creating requires operator payment method, that must be supplied).
   - Portaldot testnet EVM funding: the agent must specify the exact H160 address it will use as deployer and job creator, confirm this address is funded with testnet POT, and provide the path for how the agent will obtain or be given the private key for that address. If the agent cannot obtain testnet POT itself, the operator must pre-fund a specific address before Phase 3 — the agent states this clearly.
   - Reference image file (already covered by A6) — agent must state: 'committed to `docs/design/reference/`' or 'missing — Phase 7 will block'.
   - Reference video file (already covered by A7) — agent must state: 'committed to `docs/demo/reference/`' or 'missing — Phase 5.5 / Phase 10 will proceed without it'.
   - Any product decisions that `PROJECT_SPEC.md` and `ARCHITECTURE.md` genuinely leave open after the agent has applied `AGENTS.md` §11. These should be rare; the agent must not offload decisions to the operator just for convenience.
   - Any question about the Portaldot EVM gas-funding path (SS58 to H160 mapping) that requires official confirmation.
   - Confirmed access status for every external integration listed in `PROJECT_SPEC.md` §12.
9. Present the Prerequisites Manifest as the FINAL section of the Phase 0 report. Do not begin Phase 1 in the same session. The operator will fill in the manifest and instruct 'execute'; the agent will then run Phases 1 through 10 autonomously, stopping only for hard blockers defined in `AGENTS.md` §1.1.

**Expected output:** repository report with git branch/commit, repo state, stack compatibility, deploy access, secrets presence by variable name only, identified blockers, recommended Phase 1 commands and the completed `PREREQUISITES.md` manifest.

**Database/API/UI changes:** none.

**Tests/verification:** read-only inspection commands; no build that mutates tracked files; only `PREREQUISITES.md` and `AI_HANDOFF.md` are written.

**Acceptance criteria:** existing structure is understood; no application changes; no secret values exposed; every blocker is explicit; the Prerequisites Manifest is complete and actionable.

**Git checkpoint:** `chore: record Phase 0 amended inspection and prerequisites manifest`.

## Phase 1 — Repository/platform foundation + skeletal frontend deployment

**Objective:** make Zorq visible on a stable preview URL as early as practical, using a navigable shell and honest placeholders.

**Dependencies:** Phase 0 accepted; repository and Vercel project access available; preview environment configured with synthetic/test-only configuration.

**Tasks:**
1. Create/confirm npm workspaces and monorepo layout from `ARCHITECTURE.md`; pin Node runtime and commit lockfiles. Create no business logic beyond the agreed shell.
2. Scaffold the Next.js App Router application and TypeScript strict configuration.
3. Create all agreed public and app routes: `/`, `/docs`, `/privacy`, `/terms`, `/support`, `/app`, `/app/assets`, `/app/assets/new`, `/app/assets/[assetId]`, `/app/jobs`, `/app/jobs/new`, `/app/jobs/[jobId]`, `/app/licenses`, `/app/licenses/[licenseId]`, `/app/runs/[runId]`.
4. Implement a plain navigation shell, route headings, role-aware navigation placeholders, content skeletons, responsive layout and honest “not implemented yet” labels. No dead links or fake transaction controls. Placeholder actions are disabled and clearly marked as unavailable.
5. Add minimal app metadata, an accessible skip link, semantic landmarks, basic not-found and error boundaries.
6. Add `.env.example` containing variable names and safe placeholders only; ensure secrets are never prefixed with `NEXT_PUBLIC_`.
7. Configure Vercel Preview environment and a stable branch-specific preview URL. Use a dedicated staging Supabase project/database only when needed; do not connect production credentials.
8. Deploy the shell. Verify public and app routes load, navigation works, and the deployment corresponds to the reported commit.
9. Update `AI_HANDOFF.md` with the exact deployed preview URL and commit SHA. If deployment is blocked, record blocker and local verification; do not claim deployment.

**Expected files:** `apps/web/**`, root `package.json`, `package-lock.json`, `tsconfig` files, `.nvmrc`, `.env.example`, `README.md`, `AGENTS.md`, `AI_HANDOFF.md`, Vercel config if required.

**Database changes:** none, except a dedicated empty staging DB may be provisioned; no migration yet.

**API changes:** `GET /api/health` may be added as a liveness endpoint; no domain APIs.

**UI changes:** skeletal shell and all agreed routes only.

**Tests:** lint/typecheck/build; route smoke tests; Playwright smoke against deployed preview; check responsive layout at phone/tablet/desktop widths; inspect browser console and deployment logs.

**Acceptance criteria:** a stable preview URL is sent to the operator; all routes are navigable; unfinished features are explicitly labelled; no fake successful actions; no production data/services; build and route smoke checks pass.

**Verification procedure:** visit exact preview URL in clean browser session, click every primary navigation entry, load dynamic routes with sample IDs, test narrow viewport, verify deployed commit in Vercel/Git provider, confirm no secrets in client bundle.

**Git checkpoint:** `chore: scaffold Zorq app shell and preview deployment`.

**Checkpoint:** commit `chore: scaffold Zorq app shell and preview deployment`, update `AI_HANDOFF.md`, then continue to Phase 2 automatically.

## Phase 2 — Backend, database and authentication foundation

**Objective:** establish trusted server-side persistence, SIWE sessions, request validation, authorization middleware and environment separation.

**Dependencies:** Phase 1 accepted; Supabase staging project and Vercel Preview vars provisioned; Portaldot RPC is reachable for chain-ID reads (no contract yet).

**Tasks:**
1. Implement Drizzle schema for `users`, `auth_nonces`, and foundational `audit_events`, `idempotency_records`, `rate_limit_buckets`.
2. Configure Supabase Postgres connection server-side only. For transaction-pooler mode use Postgres.js with prepared statements disabled. Validate connectivity through a readiness check.
3. Add migration generation and execution instructions; migrations must be committed and repeatable.
4. Implement SIWE nonce creation, message verification and session lifecycle exactly as in the specification: 5-minute single-use nonce, Portaldot V3 chain ID, domain/origin validation, eight-hour signed HttpOnly/Secure/SameSite cookie, logout and session validation.
5. Add `requireSession`, wallet identity extraction, same-origin/CSRF checks, structured API error envelope and request IDs.
6. Add Zod schemas and server-side validation for every endpoint introduced.
7. Add rate limits for nonce and failed signature attempts. If a persistent rate-limit implementation is needed, use the agreed Postgres table; do not add Redis.
8. Add health and readiness endpoints. Readiness reports sanitized dependency health only; never return config/secrets.
9. Configure local, Preview and Production environment separation. Keep production values absent; production is out of scope for the MVP.

**Expected files:** `apps/web/src/server/auth/**`, `apps/web/src/app/api/auth/**`, `packages/db/**`, `packages/validation/**`, migration files, integration tests, `docs/DEVELOPER_SETUP.md` updates.

**Database changes:** users, auth_nonces, audit_events, idempotency_records, rate_limit_buckets.

**API changes:** `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/me`, `/api/auth/logout`, `/api/health`, `/api/ready`.

**UI changes:** connect-wallet button and login/session states using the temporary system; no final visual styling.

**Tests:** SIWE happy path, wrong chain, wrong domain, wrong origin, expired nonce, replayed nonce, invalid signature, cookie flags, logout, missing session, cross-wallet access attempt, DB outage and readiness behaviour.

**Acceptance criteria:** wallet login works on the agreed chain; nonce cannot be replayed; cookie is HttpOnly/Secure/SameSite; API rejects unauthenticated mutations; DB migrations can be recreated; preview contains no production secrets.

**Verification procedure:** automated tests plus browser login/logout on preview with a disposable test wallet; inspect cookie flags in browser devtools; attempt a request with another wallet/session and prove denial.

**Git checkpoint:** `feat: add SIWE authentication and database foundation`.

**Checkpoint:** commit `feat: add SIWE authentication and database foundation`, update `AI_HANDOFF.md`, then continue to Phase 3 automatically.

## Phase 3 — Core contract, domain behaviour and APIs

**Objective:** implement and verify the authoritative on-chain asset/job/license state machine and corresponding off-chain draft/confirmation APIs.

**Dependencies:** Phase 2 accepted; Portaldot testnet RPC/funding preflight completed; test account gas path confirmed; contract compiler/runtime confirmed compatible.

**Tasks:**
1. Implement `ZorqRegistry` exactly as specified in `ARCHITECTURE.md`, using OpenZeppelin ERC-721 and Ownable2Step, no proxy and no token transfer/approval support.
2. Implement unit, fuzz/property and event tests for all state transitions, caller ownership, zero IDs, job/license time windows, expiry boundary, revocation, deactivation, issuance pause, soulbound transfer reverts and authorization reason codes.
3. Deploy to local Hardhat network and verify ABI/address/bytecode. Then deploy to Portaldot V3 testnet using operator-controlled deployer credentials from secret manager/environment; never print private key.
4. Verify testnet `eth_chainId`, `eth_blockNumber`, contract calls, gas estimation, successful test transaction and explorer link behaviour. Record contract address, deployment tx and compiler metadata in a deployment record.
5. Implement asset/job/license draft routes, user-signed transaction confirmation, receipt/log verification, and mirrored status updates. Database is not authoritative for permission.
6. Add job and asset ownership checks to all routes. Keep provider-private asset metadata private.
7. Implement idempotency and database transaction boundaries for transaction confirmation, avoiding duplicate events or duplicated license mirrors.
8. Implement on-chain `checkAuthorization` service that accepts an explicit block number and returns on-chain reason code, not an inferred DB status.
9. Add API tests for manipulated transaction hash, receipt from wrong chain, wrong contract, wrong sender, wrong event args, reorg/unconfirmed tx, replay, concurrent confirmation and RPC failure.

**Expected files:** `packages/contracts/**`, Hardhat config/deploy scripts, `apps/web/src/server/chain/**`, `apps/web/src/server/domain/**`, asset/job/license API routes, Drizzle schema for assets/jobs/licenses/chain_transactions, tests and `docs/PORTALDOT_VALIDATION.md`.

**Database changes:** `data_assets`, `fl_jobs`, `licenses`, `chain_transactions`, audit rows, idempotency rows.

**API changes:** asset/job/license list, drafts, detail, confirm and state/revoke confirmation endpoints.

**UI changes:** connect real wallet transactions to asset/job/license screens using temporary design. Show pending/confirmed/failed states distinctly.

**Tests:** contract unit/property tests; route integration tests; receipt/event verification; two-wallet authorization tests; DB rollback/idempotency tests.

**Acceptance criteria:** contract deployed on Portaldot testnet; chain ID and deployment evidence recorded; real wallet transaction creates an asset/job/license; owner can revoke; non-owner cannot revoke; transfers revert; checkAuthorization allows a valid case and denies revoked/expired/wrong-job/wrong-owner/deactivated cases; mirror cannot override chain state.

**Verification procedure:** inspect contract transaction on explorer; call read methods at a fixed block; run full route tests; execute a two-wallet manual smoke test; attach tx hashes and test outputs to checkpoint.

**Git checkpoint:** `feat: add Portaldot DataLicense registry and domain APIs`.

**Checkpoint:** commit `feat: add Portaldot DataLicense registry and domain APIs`, update `AI_HANDOFF.md`, then continue to Phase 4 automatically. Any chain compatibility issue is logged as a Known Limitation; do not switch to another chain or contract architecture.

## Phase 4 — Functional frontend integration and FL adapter

**Objective:** connect the shell to the agreed API and execute a real Flower simulation whose participant admission is constrained by the Portaldot DataLicense state.

**Dependencies:** Phase 3 accepted with contract deployment and confirmed testnet operations; synthetic dataset generation and model preset fixed.

**Tasks:**
1. Implement app data screens, forms and interactions using temporary functional styling, not final brand design.
2. Complete asset registration, job creation, license issuance, revoke and job pause/resume/close journeys.
3. Implement Python 3.12 FastAPI/Flower service, fixed PyTorch binary classifier, deterministic synthetic partitions, two-to-five Flower clients and three rounds.
4. Implement `FLExecutionProvider` interface and `FlowerDemoProvider` adapter. No Portaldot-native FL adapter until supported public API and successful integration proof exist.
5. Before run admission and every round, Python service requests a new authorization snapshot from Next.js internal endpoint. Next.js reads chain state at one explicit confirmed block and stores snapshot evidence.
6. Include only participants returned in the snapshot; reject or ignore any extra client update. Verify participant IDs, asset IDs, round number and snapshot ID on every update.
7. Implement model-update validation: finite numeric tensors, expected tensor names/shapes, payload-size bounds, no arbitrary code. Clearly document that these checks do not prevent poisoning or inferential leakage.
8. Implement run status and sanitized progress callback endpoints. The internal service uses a high-entropy service token and TLS; no browser-accessible internal routes.
9. Add idempotent run start and a single active run per job. Enforce minimum two distinct assets and max five participants.
10. Implement status/round UI with live polling (bounded interval) and refresh fallback; avoid websockets unless needed.

**Expected files:** `apps/fl-service/**`, `apps/web/src/server/fl/**`, `apps/web/src/app/api/internal/**`, run APIs, dashboard components, worker fixtures, Dockerfile, tests.

**Database changes:** `job_participants`, `training_runs`, `training_rounds`, `authorization_checks`, run audit events.

**API changes:** run start/status/round endpoints and internal snapshot/events/complete/fail endpoints.

**UI changes:** working dashboards/forms/states with plain temporary visual system; visible notice that data is synthetic and Flower is a demo adapter, not native Portaldot FL.

**Tests:** coordinator fails closed on RPC/API error; valid users admitted; expired/revoked users excluded at next boundary; mid-round revocation does not change saved snapshot; model shape/NaN/Inf/oversize updates rejected; duplicate run starts do not duplicate; internal endpoint rejects missing/wrong token.

**Acceptance criteria:** complete workflow works with two or more synthetic partitions and real Portaldot license records; every round stores block number/hash and allowlist; revocation between rounds excludes provider from next round; run dashboard reflects actual coordinator events; no fake native FL/ZKP claim.

**Verification procedure:** run a demo job on preview; revoke one license after round 1 but before round 2 snapshot; show round 1 completion and round 2 exclusion; inspect contract and round snapshot evidence; record test run IDs and sanitized logs.

**Git checkpoint:** `feat: integrate DataLicense authorization with Flower runs`.

**Checkpoint:** commit `feat: integrate DataLicense authorization with Flower runs`, update `AI_HANDOFF.md`, then continue to Phase 5 automatically.

## Phase 5 — End-to-end functionality completion

**Objective:** complete critical MVP flows and prove them end to end before any final visual design work begins.

**Dependencies:** Phase 4 checkpoint complete.

**Tasks:**
1. Fix functional defects discovered in complete flows without scope expansion.
2. Complete all loading, empty, validation, failure, success, permission-denied and not-found states for agreed routes.
3. Complete data visibility checks for owner/provider/job creator/public visitor.
4. Test all edge paths: chain RPC down, stale UI, wallet rejected, chain switch failed, tx pending/reverted, reorg/confirmation mismatch, revoked/expired license, job paused/closed, fewer than two participants, FL service down, callback duplication and browser refresh.
5. Run complete Playwright E2E suite against deployed Preview, not just local mocks.
6. Run contract regression and full integration test suite using a fresh synthetic seed.
7. Record evidence for at least two critical journeys: asset/job/license setup and three-round run with revocation at a round boundary.
8. Update `AI_HANDOFF.md` with exact preview URL, deployed commit, test command/results, proof artifacts, known issues and unresolved non-blocking limitations.

**Expected files:** regression test suite, fixtures, test report, updated `docs/TEST_PLAN.md`, `AI_HANDOFF.md`.

**Database changes/API changes/UI changes:** only fixes required to meet already approved specification; no feature expansion.

**Tests:** complete unit/contract/integration/E2E/security smoke set; preview smoke and console inspection.

**Acceptance criteria:** every critical MVP user journey passes on preview; no severity-1/2 defects; all known limitations are documented; evidence is recorded in `AI_HANDOFF.md`. Final visual design is still not implemented.

**Verification procedure:** clean seeded environment, run published scripts, capture results, verify run evidence and contract state, manually inspect preview at desktop and mobile widths.

**Git checkpoint:** `test: accept Zorq MVP functional flows`.

Phase 5 completion is a self-verified checkpoint. The agent runs the full E2E suite against the deployed preview, records pass/fail results and evidence in `AI_HANDOFF.md`, commits, and proceeds to Phase 5.5 / Phase 6. If E2E failures cannot be fixed after three distinct attempts, log them in Known Limitations with evidence and proceed. Do not fabricate passing evidence.

**Checkpoint:** commit `test: accept Zorq MVP functional flows`, update `AI_HANDOFF.md`, then continue to Phase 5.5 / Phase 6 automatically.

### Phase 5.5 — First-pass demo video (recommended if the submission deadline is tight)

Record a first-pass demo video against the functional, unpolished preview so a submission artifact exists before Phases 7–10. Re-record in Phase 10 if time allows.

If `docs/demo/reference/` contains an operator-supplied reference video, review it first and record adopted/rejected attributes in `docs/demo/REFERENCE_NOTES.md` before scripting. The hard limits in `docs/DEMO_VIDEO.md` take precedence over the reference in every conflict.

**Checkpoint:** commit `docs: add first-pass demo video`, update `AI_HANDOFF.md`, then continue to Phase 6 automatically.

## Phase 6 — Reference-image handoff (operator-supplied)

**Objective:** register the operator-supplied reference image(s) as the authoritative visual source for Phase 7.

**Dependencies:** Phase 5 checkpoint complete.

**Tasks:**
1. Inspect `docs/design/reference/`. If it is missing or empty, record the specific blocker under `AGENTS.md` §1.1 and do not invent, fetch, generate or substitute a reference image.
2. Record the image path(s), the screens/states each reference covers, and the screens/states it does not cover in `docs/DESIGN_DECISIONS.md`.
3. If any primary screen or state is uncovered, propose an extension in `docs/DESIGN_DECISIONS.md` that stays within the existing product behaviour and proceed. Do not create a mockup approval loop; the waiver covers visual direction.
4. Archive the waiver record in `docs/DESIGN_APPROVAL.md`.

**Expected files:** `docs/DESIGN_DECISIONS.md`, `docs/DESIGN_APPROVAL.md`, reference assets under `docs/design/reference/`.

**Database/API/UI changes:** none.

**Tests:** confirm reference files are readable and the coverage inventory is complete.

**Acceptance criteria:** the reference image is present and recorded; covered and uncovered screens/states are explicit; extensions are documented; no mockup or approval loop is introduced.

**Git checkpoint:** `docs: record operator-supplied design reference`.

**Checkpoint:** commit `docs: record operator-supplied design reference`, update `AI_HANDOFF.md`, then continue to Phase 7 automatically.

## Phase 7 — Implement the operator-supplied reference image with Stageshow

**Objective:** implement the UI from the operator-supplied reference image(s) using Stageshow for execution quality, without changing product behaviour, APIs, data model, permissions or architecture.

**Dependencies:** Phase 6 checkpoint complete and reference image present.

**Tasks:**
1. Before implementing visuals, install and use the Stageshow skill:
   `npx skills add benjitaylor/skills --skill stageshow`
   Use it only for composition, motion, density and faux-product-UI polish consistent with the operator-supplied reference image. Do not let it override the reference direction or introduce behaviour changes.
2. Implement the visual system from the reference image(s): typography, colour tokens, spacing, layout, component surfaces, navigation, forms, tables/cards, status chips, motion and responsive patterns.
3. Apply the visual system to each existing screen and relevant state; preserve existing route names, APIs, state transitions and permission boundaries.
4. Replace temporary styling only; do not change business logic or contract interactions.
5. If the reference implies a feature the product does not have, record the gap in `docs/DESIGN_DECISIONS.md` and implement the closest behaviour-consistent equivalent. If implementing it would require a product-behaviour, API, data-model, permission or architecture change, stop and report the specific blocker under `AGENTS.md` §1.1.
6. Run all existing E2E tests; they must still pass.

**Expected files:** design tokens, component library, route layouts and screens, `docs/design/` artifacts, `docs/DESIGN_DECISIONS.md` updates.

**Database/API changes:** none.

**UI changes:** reference-image visuals only.

**Tests:** visual regression snapshots where stable; all existing E2E tests must pass; keyboard and responsive checks.

**Acceptance criteria:** the implemented UI matches the operator-supplied reference image; no behaviour/API/architecture changes; all critical journeys remain green.

**Verification procedure:** compare preview at target viewports; run E2E; record reference-to-implementation mapping and gaps.

**Git checkpoint:** `feat: implement operator-supplied Zorq visual reference`.

**Checkpoint:** commit `feat: implement operator-supplied Zorq visual reference`, update `AI_HANDOFF.md`, then continue to Phase 8 automatically.

## Phase 8 — Frontend completeness, docs and footer links

**Objective:** ship the complete frontend shell, not just the main dashboard.

**Dependencies:** Phase 7 checkpoint complete; real GitHub repository URL exists; public docs destination is deployed/available.

**Tasks:**
1. Verify all public/app routes, global navigation, footer, metadata, favicon/app icon, Open Graph metadata and not-found/error boundaries.
2. Complete loading/skeleton, empty, validation, success, error, permission-denied and missing-resource states for every applicable screen.
3. Verify responsive layouts and accessible labels, semantics, keyboard navigation, focus states, colour contrast and form error announcements.
4. Publish the actual docs destination (in-app `/docs` and/or repository docs served publicly) and use exact working URL in footer.
5. Add GitHub footer link only to the actual intended public repository. If repository is private or publicity would expose sensitive code, explain the reason and log the alternate link/omission decision in `AI_HANDOFF.md`'s Decision Log. Never invent a repo URL.
6. Complete `README.md` and `docs/` contents: developer setup, environment variables, user guide, API reference, architecture, deployment, Portaldot validation, test strategy, security/privacy and troubleshooting.
7. Validate external links; no dead URLs, `href="#"`, inert controls or unexplained placeholder copy.
8. Verify `/privacy`, `/terms` and `/support` copy is accurate and not legal advice; link only to a real, verified support channel/contact.

**Expected files:** all `docs/**`, README, footer/navigation, metadata/icons, accessibility updates, link tests.

**Database/API changes:** none unless a documented issue requires a logged decision.

**UI changes:** complete final frontend inventory.

**Tests:** broken-link checks, route E2E, responsive E2E/screenshot checks, axe/accessibility smoke, keyboard navigation, docs/GitHub footer link checks.

**Acceptance criteria:** all routes and controls have defined behaviour; docs link resolves; GitHub link resolves to the actual repo or a documented exception; no dead links/placeholders; docs pass setup review; responsive/accessibility checks pass.

**Verification procedure:** inspect deployed preview, click every footer and navigation link, run automated link and E2E suite, review README/docs as a new developer, test keyboard-only flow.

**Git checkpoint:** `docs: complete Zorq docs and frontend release requirements`.

**Checkpoint:** commit `docs: complete Zorq docs and frontend release requirements`, update `AI_HANDOFF.md`, then continue to Phase 9 automatically.

## Phase 9 — Final regression, security, testnet release and monitoring

**Objective:** perform final adversarial/operational review and complete the testnet release.

**Dependencies:** Phase 8 checkpoint complete; Portaldot, Vercel, Supabase and Render configuration stable; contract deployment recorded.

**Tasks:**
1. Run full unit/contract/integration/E2E suites from a clean state.
2. Run security review: SIWE replay, CSRF/origin, IDOR, rate limits, internal service authentication, secrets scan, XSS/injection, contract ownership/reentrancy surface, race and idempotency.
3. Verify contract bytecode/source and deployment transaction; review role and ownership assumptions.
4. Verify the coordinator fail-closed behaviour if RPC/Next API fails and that no unauthorised client updates can enter a round.
5. Verify preview has no production secrets or real data. Production is out of scope for the MVP.
6. Production deployment is out of scope for the MVP. The agent completes Phase 9 by deploying to testnet only, running the full suite, and recording final evidence. Do not deploy to mainnet, do not move real value, do not enable production data. If any of those are required, treat them as out of scope and note in Known Limitations.
7. Smoke-test the stable preview/testnet deployment and verify health/readiness, wallet chain, user flows and docs/footer links.
8. Record monitoring/incident instructions, final commit, deployment IDs, contract address, run evidence and known limitations.

**Expected files:** final test/security reports, release notes, runbook updates, `AI_HANDOFF.md`.

**Database/API/UI changes:** only bug fixes required by the specification.

**Tests:** full defined suite; secret scanning; dependency audit; testnet deployment smoke test.

**Acceptance criteria:** no open critical/high security defect; all MVP acceptance tests pass; testnet deployment smoke verified; limitations disclosed; URL, commit and evidence recorded.

**Verification procedure:** signed-off checklist and testnet smoke report.

**Git checkpoint:** `release: Zorq MVP testnet demo` or appropriate release tag. Testnet only.

**Checkpoint:** commit the testnet release checkpoint, update `AI_HANDOFF.md`, then continue to Phase 10 automatically.

## Phase 10 — Demo video production

**Objective:** produce the final demo video specified in `docs/DEMO_VIDEO.md`.

**Dependencies:** Phase 9 checkpoint complete; functional testnet preview available.

**Tasks:**
1. Read `docs/DEMO_VIDEO.md` and follow it as the authoritative specification.
2. If `docs/demo/reference/` contains an operator-supplied reference video, review it first and record adopted/rejected attributes in `docs/demo/REFERENCE_NOTES.md` before scripting. The hard limits in `docs/DEMO_VIDEO.md` take precedence over the reference in every conflict.
3. Build a single step timeline that drives both the Playwright capture and the narration generation; keep checked-in `narration.md`, `timeline.json` and automation under `scripts/demo-video/`.
4. Generate narration with a free Google AI Studio male voice (suggested Charon or Orus; Puck only if the tone fits). No cloned voices, no paid tiers, no presenter name.
5. Capture deterministic UI actions with Playwright and mux audio/video with ffmpeg.
6. Verify the final video against every gate below and record the result.

**Expected files:** `docs/demo/` video/narration/timeline/reference notes, `scripts/demo-video/`, `AI_HANDOFF.md`.

**Database/API/UI changes:** none.

**Tests:** duration check, narration/visual sync check, on-screen claim verification, reproducible re-render from `scripts/demo-video/`.

**Gate:** video <= 3:00, free Google AI Studio male voice, no presenter name, no narration/visual drift, every on-screen claim verifiable in the recording, reproducible from `scripts/demo-video/`.

**Checkpoint:** commit `docs: add final Zorq demo video`, update `AI_HANDOFF.md`, then produce the final Phase 10 report.

## Standard checkpoint report (required after every phase)

```text
Phase completed:
Commit SHA:
Preview URL (exact, stable branch URL):
Deployment status and deployment ID:
What changed and is visible:
Incomplete/placeholder areas:
Tests executed (exact commands):
Test results (pass/fail counts and evidence):
Manual verification performed:
Known issues / blockers:
Security and environment notes:
Design reference image status (supplied / missing / ambiguous):
Operator approval status (visuals: waived):
Documentation completeness:
Docs footer URL (actual or not yet published):
GitHub URL (actual or not yet created/private with reason):
Decisions logged this phase (D-NNN ids):
New Known Limitations this phase:
Next phase (automatic):
```

## Scope/deadline rule

Hackathon deadlines do not waive the hard limits in `docs/DEMO_VIDEO.md` or the test/evidence requirements. The final submission deadline currently surfaced for the event is 6 November 2026 at 04:00 UTC (05:00 WAT), but verify the official DoraHacks submission page immediately before submission. If the available time is insufficient, prioritise a truthful, functioning testnet core and disclose missing native FL/ZKP integration. Do not fake features or bypass the reference-image workflow.
