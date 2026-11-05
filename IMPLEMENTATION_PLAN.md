# Zorq — Phased Implementation Plan

**Version:** 1.0  
**Date:** 4 November 2026  
**Status:** Pre-implementation plan; no application code has been written.

This plan is subordinate to `PROJECT_SPEC.md` and `ARCHITECTURE.md`. The coding agent executes one assigned phase or subtask only, verifies it, records a checkpoint and stops. It does not redesign the product or advance itself to the next phase.

## 0. Non-negotiable sequence and gates

```text
Repository inspection
  → Phase 1: skeletal frontend + first stable preview deployment
  → Phase 2: backend / database / SIWE foundation
  → Phase 3: contract + domain APIs + authorization rules
  → Phase 4: functional frontend + Flower demo integration
  → Phase 5: end-to-end proof of the MVP; hard functionality gate
  → Phase 6: approved-reference research + mockups / prototypes
  → EXPLICIT OPERATOR APPROVAL GATE (STOP)
  → Phase 7: implement approved final visual direction
  → Phase 8: full frontend completeness + docs + footer links
  → Phase 9: security / regression / release approval / monitoring
```

The product's UX structure and interaction behaviour are already specified in `PROJECT_SPEC.md`. Final visual design is deliberately not selected. The temporary visual system is plain, consistent, responsive and legible. Final styling must not start before Phase 5 is accepted and must not be implemented before the operator explicitly approves the Phase 6 mockups.

At every verified phase checkpoint, update the stable preview deployment where applicable and record the exact preview URL, commit SHA, what changed, what remains incomplete, tests and evidence, known issues, design approval status, and docs/footer status in `AI_HANDOFF.md`. A deployment is not a production release.

## Phase 0 — Read-only repository and environment inspection

**Objective:** establish the actual state of the target repository and available deployment environment without changing files.

**Dependencies:** operator supplies repository/workspace and grants appropriate read access; no credentials are pasted into chat or committed.

**Tasks:**
1. Inspect current branch, git status, remote URLs, commit history, repository tree, package manifests, lockfiles, existing tests, environment samples, deployment configuration and docs.
2. Identify whether the repo is empty, an existing prototype, or a continuation. Preserve useful work; do not overwrite.
3. Check Node/npm, Python/uv, Docker, wallet/RPC reachability and local build capability. Do not print secret values.
4. Confirm access to Vercel, Supabase, Render and Portaldot testnet, including the correct test-wallet funding route. If access is missing, state exact prerequisites.
5. Compare the repository against the frozen architecture and list only concrete conflicts.
6. Return a read-only inspection report. Do not create or edit files in this phase.

**Expected output:** repository report with git branch/commit, repo state, stack compatibility, deploy access, secrets presence by variable name only, identified blockers and recommended Phase 1 commands.

**Database/API/UI changes:** none.

**Tests/verification:** read-only commands; no build that mutates tracked files; `git status` unchanged after inspection.

**Acceptance criteria:** existing structure is understood; no changes; no secret values exposed; every blocker is explicit.

**Git checkpoint:** none; no commit.

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

**Stop condition:** stop after Phase 1 and report evidence. Do not begin Phase 2 without instruction.

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
9. Configure local, Preview and Production environment separation. Keep production values absent until approved.

**Expected files:** `apps/web/src/server/auth/**`, `apps/web/src/app/api/auth/**`, `packages/db/**`, `packages/validation/**`, migration files, integration tests, `docs/DEVELOPER_SETUP.md` updates.

**Database changes:** users, auth_nonces, audit_events, idempotency_records, rate_limit_buckets.

**API changes:** `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/me`, `/api/auth/logout`, `/api/health`, `/api/ready`.

**UI changes:** connect-wallet button and login/session states using the temporary system; no final visual styling.

**Tests:** SIWE happy path, wrong chain, wrong domain, wrong origin, expired nonce, replayed nonce, invalid signature, cookie flags, logout, missing session, cross-wallet access attempt, DB outage and readiness behaviour.

**Acceptance criteria:** wallet login works on the agreed chain; nonce cannot be replayed; cookie is HttpOnly/Secure/SameSite; API rejects unauthenticated mutations; DB migrations can be recreated; preview contains no production secrets.

**Verification procedure:** automated tests plus browser login/logout on preview with a disposable test wallet; inspect cookie flags in browser devtools; attempt a request with another wallet/session and prove denial.

**Git checkpoint:** `feat: add SIWE authentication and database foundation`.

**Stop condition:** stop, report test evidence and preview commit; do not proceed to Phase 3 automatically.

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

**Stop condition:** stop at accepted checkpoint. Any chain compatibility issue triggers a report and decision, not an autonomous switch to another chain or contract architecture.

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

**Stop condition:** stop at checkpoint with end-to-end evidence; do not begin visual redesign.

## Phase 5 — End-to-end functionality completion (hard gate)

**Objective:** complete critical MVP flows and prove them end to end before any final visual design work begins.

**Dependencies:** Phase 4 accepted.

**Tasks:**
1. Fix functional defects discovered in complete flows without scope expansion.
2. Complete all loading, empty, validation, failure, success, permission-denied and not-found states for agreed routes.
3. Complete data visibility checks for owner/provider/job creator/public visitor.
4. Test all edge paths: chain RPC down, stale UI, wallet rejected, chain switch failed, tx pending/reverted, reorg/confirmation mismatch, revoked/expired license, job paused/closed, fewer than two participants, FL service down, callback duplication and browser refresh.
5. Run complete Playwright E2E suite against deployed Preview, not just local mocks.
6. Run contract regression and full integration test suite using a fresh synthetic seed.
7. Demonstrate at least two critical journeys to operator: asset/job/license setup and three-round run with revocation at a round boundary.
8. Update `AI_HANDOFF.md` with exact preview URL, deployed commit, test command/results, proof artifacts, known issues and unresolved non-blocking limitations.

**Expected files:** regression test suite, fixtures, test report, updated `docs/TEST_PLAN.md`, `AI_HANDOFF.md`.

**Database changes/API changes/UI changes:** only fixes required to meet already approved specification; no feature expansion.

**Tests:** complete unit/contract/integration/E2E/security smoke set; preview smoke and console inspection.

**Acceptance criteria:** every critical MVP user journey passes on preview; no severity-1/2 defects; all known limitations are documented; operator has inspected working flows. Final visual design is still not implemented.

**Verification procedure:** clean seeded environment, run published scripts, capture results, verify run evidence and contract state, manually inspect preview at desktop and mobile widths.

**Git checkpoint:** `test: accept Zorq MVP functional flows`.

**HARD GATE:** do not enter Phase 6 until the operator accepts functional evidence. If the deadline arrives before completion, preserve the honest functional UI; do not bypass the gate to add superficial visual polish.

## Phase 6 — Design references, mockups and operator review

**Objective:** create the proposed final visual direction using references selected or approved by the operator.

**Dependencies:** Phase 5 accepted. No design references or aesthetic has been pre-approved.

**Tasks:**
1. Ask the operator for their references or present a small set of relevant candidate products for selection. Record source URLs/assets and the exact visual attributes considered.
2. Derive a Zorq-specific direction; do not copy logos, proprietary illustrations or exact branded compositions.
3. Produce mockups/prototypes for: landing page, app overview, asset list/detail, job detail, license detail, run dashboard, transaction/confirmation states, empty/error states, and responsive desktop/mobile adaptations.
4. Identify what is borrowed from each reference (e.g. navigation hierarchy, density, typography feel, status treatment) and what is original.
5. Present clickable prototypes/screenshots and collect explicit operator feedback. Revise until direction is accepted.
6. Create `docs/DESIGN_DECISIONS.md` and `docs/DESIGN_APPROVAL.md` containing references, approved screens, tokens, component decisions, deviations, accessibility notes, and approval record.

**Expected files:** mockup assets (in `docs/design/`), design comparison notes, approval record.

**Database/API changes:** none.

**UI changes:** mockups only; do not replace the functional temporary system with final visual components.

**Tests:** no feature tests added; verify mockups cover every route class, required state and responsive breakpoint.

**Acceptance criteria:** operator can inspect all core mockups and understands reference-derived attributes; design decision record is complete; approval is explicit and written.

**Verification procedure:** operator reviews desktop/mobile mockups and confirms acceptance in chat or `docs/DESIGN_APPROVAL.md`.

**Git checkpoint:** `docs: add operator-approved Zorq visual direction` only after approval.

## Explicit approval gate — STOP

No final visual styling or polished UI implementation is authorized until the operator explicitly says the presented mockups/direction are approved. Silence, an implied preference, or approval of a single screen is not approval of the whole direction. If revisions are requested, remain in Phase 6.

## Phase 7 — Implement approved final visual direction

**Objective:** apply approved design tokens and components to the working product without changing its behaviour or architecture.

**Dependencies:** explicit written operator approval and committed design decision record.

**Tasks:**
1. Implement approved typography, colour tokens, spacing, layout, component surfaces, navigation, forms, tables/cards, status chips and responsive patterns.
2. Apply design to each existing screen and relevant state; preserve existing route names, APIs, state transitions and permission boundaries.
3. Replace temporary styling only; do not change business logic or contract interactions.
4. If an approved visual reference appears to require a behaviour/API change, stop and request separate approval.

**Expected files:** design tokens, component library, route layouts and screens, docs/design artifacts.

**Database/API changes:** none.

**UI changes:** approved visuals only.

**Tests:** visual regression snapshots where stable; all existing E2E tests must still pass; keyboard and responsive checks.

**Acceptance criteria:** approved mockups are matched; no behaviour/API changes; all critical journeys remain green.

**Verification procedure:** compare preview at approved viewports; run E2E; operator review.

**Git checkpoint:** `feat: implement approved Zorq visual system`.

## Phase 8 — Frontend completeness, docs and footer links

**Objective:** ship the complete frontend shell, not just the main dashboard.

**Dependencies:** Phase 7 accepted; real GitHub repository URL exists; public docs destination is deployed/available.

**Tasks:**
1. Verify all public/app routes, global navigation, footer, metadata, favicon/app icon, Open Graph metadata and not-found/error boundaries.
2. Complete loading/skeleton, empty, validation, success, error, permission-denied and missing-resource states for every applicable screen.
3. Verify responsive layouts and accessible labels, semantics, keyboard navigation, focus states, colour contrast and form error announcements.
4. Publish the actual docs destination (in-app `/docs` and/or repository docs served publicly) and use exact working URL in footer.
5. Add GitHub footer link only to the actual intended public repository. If repository is private or publicity would expose sensitive code, explain and obtain operator approval for an alternate link or omission. Never invent a repo URL.
6. Complete `README.md` and `docs/` contents: developer setup, environment variables, user guide, API reference, architecture, deployment, Portaldot validation, test strategy, security/privacy and troubleshooting.
7. Validate external links; no dead URLs, `href="#"`, inert controls or unexplained placeholder copy.
8. Verify `/privacy`, `/terms` and `/support` copy is accurate and not legal advice; link only to real support channel/contact approved by operator.

**Expected files:** all `docs/**`, README, footer/navigation, metadata/icons, accessibility updates, link tests.

**Database/API changes:** none unless a documented issue requires separate approval.

**UI changes:** complete final frontend inventory.

**Tests:** broken-link checks, route E2E, responsive E2E/screenshot checks, axe/accessibility smoke, keyboard navigation, docs/GitHub footer link checks.

**Acceptance criteria:** all routes and controls have defined behaviour; docs link resolves; GitHub link resolves to actual repo or approved documented exception; no dead links/placeholders; docs pass setup review; responsive/accessibility checks pass.

**Verification procedure:** inspect deployed preview, click every footer and navigation link, run automated link and E2E suite, review README/docs as a new developer, test keyboard-only flow.

**Git checkpoint:** `docs: complete Zorq docs and frontend release requirements`.

## Phase 9 — Final regression, security, release and monitoring

**Objective:** perform final adversarial/operational review and release only when explicitly authorized.

**Dependencies:** Phase 8 accepted; Portaldot, Vercel, Supabase and Render configuration stable; contract deployment recorded; production release permission explicitly given.

**Tasks:**
1. Run full unit/contract/integration/E2E suites from a clean state.
2. Run security review: SIWE replay, CSRF/origin, IDOR, rate limits, internal service authentication, secrets scan, XSS/injection, contract ownership/reentrancy surface, race and idempotency.
3. Verify contract bytecode/source and deployment transaction; review role and ownership assumptions.
4. Verify the coordinator fail-closed behaviour if RPC/Next API fails and that no unauthorised client updates can enter a round.
5. Verify preview has no production secrets or real data. Ensure Production is a separate environment/database/service.
6. Obtain explicit operator release authorization before promoting/deploying to production or a final public domain. Hackathon testnet demo is not a mainnet release.
7. Deploy, smoke-test actual production URL and verify health/readiness, wallet chain, user flows and docs/footer links.
8. Record monitoring/incident instructions, final commit, deployment IDs, contract address, run evidence and known limitations.

**Expected files:** final test/security reports, release notes, runbook updates, `AI_HANDOFF.md`.

**Database/API/UI changes:** only approved bug fixes.

**Tests:** full defined suite; secret scanning; dependency audit; production smoke test after authorization.

**Acceptance criteria:** no open critical/high security defect; all MVP acceptance tests pass; release approved; actual production smoke verified; limitations disclosed; operator receives URL, commit and evidence.

**Verification procedure:** signed-off checklist and production smoke report.

**Git checkpoint:** `release: Zorq MVP testnet demo` or appropriate release tag. Production deploy only after separate authorization.

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
Design references/mockups status:
Operator approval status:
Documentation completeness:
Docs footer URL (actual or not yet published):
GitHub URL (actual or not yet created/private with reason):
Next single task (requires operator instruction):
```

## Scope/deadline rule

Hackathon deadlines do not waive the gates. The final submission deadline currently surfaced for the event is 6 November 2026 at 04:00 UTC (05:00 WAT), but verify the official DoraHacks submission page immediately before submission. If the available time is insufficient, prioritise a truthful, functioning testnet core and disclose missing native FL/ZKP integration. Do not fake features or silently bypass the final-design approval process.
