# Zorq Test Strategy and Acceptance Plan

## Test layers

### Unit tests

- SIWE message validation and nonce lifecycle.
- Zod input schemas, normalization, time-range validation and deterministic hash generation.
- Asset/job/license domain rules and role filters.
- Run state transitions, minimum/maximum participants and active-run constraints.
- Authorization reason mapping and round-snapshot invariants.
- Flower model serialization, tensor schema and metric sanitization.

### Smart-contract tests (Hardhat)

- Deploy and initial owner assignment.
- Asset ID zero/duplicate rejection; registration pause; deactivate only by owner.
- Job ID zero/duplicate rejection; job window/max participant validation.
- Creator-only pause/resume/close; invalid transitions; close terminal.
- License issuance by asset owner only; wrong asset/job; inactive asset; non-open job; time-window containment.
- Nonzero validity, `[validFrom, validUntil)` boundaries and job expiry.
- Duplicate active license prevention; revision after revocation/expiry.
- Revocation by owner only, idempotent/terminal behaviour.
- ERC-721 `transferFrom`, `safeTransferFrom`, `approve`, `setApprovalForAll` revert.
- Authorization result matrix for all reason codes.
- Emergency owner pause blocks new asset/job/license creation but never blocks revocation.
- Fuzz/property tests for timestamp edges, owner spoof, ID uniqueness and state invariants.

### Integration tests

- DB migrations apply cleanly and transaction rollback works.
- SIWE session + Postgres user upsert.
- Contract receipt verification: wrong chain, contract, sender, event args, status and confirmations.
- On-chain read at a specified block; no reliance on mirrored DB status.
- Snapshot writes atomic; duplicate round request idempotent; one block hash for a snapshot.
- Internal FL service token enforcement and event callback validation.
- Flower coordinator receives only allowlist and rejects unlisted updates.
- Render service failure/RPC failure results in failed run, not fallback to cached authorization.

### End-to-end tests

1. Connect wallet → SIWE → app dashboard → logout.
2. Wallet A registers synthetic asset → chain confirmation → owner sees asset; wallet B cannot read metadata.
3. Wallet B creates job → publishes → provider sees purpose and config preset.
4. Wallet A issues license for own asset/job → license appears; job creator cannot revoke it.
5. Wallet B starts run with two licenses → three rounds complete → dashboard shows metrics/model hash.
6. Revoke one license after round 1 snapshot and before round 2 snapshot → round 1 completes with original allowlist; round 2 excludes revoked asset.
7. Expired license rejected at run admission/round boundary.
8. Paused/closed job prevents start/next-round admission.
9. RPC outage before round snapshot → run stops/fails closed; no stale allowlist reused.
10. User attempts to access another wallet's private asset/license/run metadata → denial without metadata leak.
11. All app routes render loading/empty/error/not-found states and navigation works.
12. Final design changes preserve all existing E2E outcomes.

### Security tests

- SIWE nonce replay, expiry, wrong domain/URI/chain, malformed signature.
- CSRF and invalid Origin.
- IDOR for every wallet-owned resource.
- Forged transaction hash, wrong contract, wrong sender and event mismatch.
- Repeated and concurrent confirmation/run-start requests.
- Service token absent/wrong, request from browser, malformed internal payload.
- Unknown Flower client, wrong partition, stale snapshot ID, duplicate update, malformed arrays, NaN/Inf, oversize payload.
- XSS and SQL injection probes in display name/job description.
- Rate limit enforcement and log redaction.
- No production environment variable exposed in client bundle or preview build.

## E2E functionality gate before final visual design

All of the following must pass on the deployed stable Preview environment, using the actual testnet contract and synthetic data:

- [ ] wallet sign-in/logout
- [ ] register asset and verify chain event/read state
- [ ] create/publish job and verify chain state
- [ ] issue a non-transferable license; prove wrong owner cannot issue/revoke
- [ ] start a run with at least two distinct valid licensed assets
- [ ] snapshot at a confirmed block; record block hash and allowlist per round
- [ ] 3 rounds run and dashboard updates match actual service events
- [ ] revoke between rounds; next round excludes revoked participant
- [ ] expired/revoked/wrong-job/inactive-asset/paused-job denials
- [ ] RPC/FL failure fails closed
- [ ] access-control/IDOR tests pass
- [ ] deployed preview route and UI smoke tests pass

No final UI visual design before every blocking criterion passes and the evidence is recorded in `AI_HANDOFF.md`.

## Final frontend quality gate

- [ ] all specified routes work or show intentional, explained state
- [ ] mobile/tablet/desktop checked
- [ ] keyboard navigation and visible focus
- [ ] semantic headings/landmarks, labels and announced form errors
- [ ] contrast reviewed
- [ ] loading, empty, error, success, permission denied and 404 states covered
- [ ] real `/docs` destination reachable
- [ ] actual GitHub repository URL verified or operator-approved exception documented
- [ ] no dead link, inert button or `href="#"`
- [ ] page metadata, favicon/app icon and relevant social metadata
- [ ] privacy/terms/support destinations accurate and no fabricated contact data
- [ ] README/docs setup instructions tested by a fresh checkout where possible
- [ ] Demo video is <= 3:00, uses a free Google AI Studio male voice, contains no presenter name, has no narration/visual drift, and every on-screen claim is verifiable in the recording.
- [ ] Video file and narration script are committed under `docs/demo/` (or linked from README) and the script is reproducible via `scripts/demo-video/`.
- [ ] UI implemented from the operator-supplied reference image; no behaviour/API/architecture changes introduced by visual work; all existing E2E tests still pass.
- [ ] Demo video was produced with the operator-supplied reference video reviewed (or its absence noted); no footage, music, logos or verbatim narration copied from the reference; `docs/demo/REFERENCE_NOTES.md` present.

## Test evidence format

Every checkpoint records commit SHA, exact commands, pass/fail output, E2E URL, chain/contract reference, run IDs, sanitized screenshots/logs, known limitations and manual review. Do not state “tested” without evidence.

## Phase 2 evidence (5 November 2026)

| Check | Command | Result |
|---|---|---|
| Drizzle generation | `npm run db:generate` | `migrations/0000_dapper_starhawk.sql`, 5 tables |
| Migration | `npm run db:migrate` | Applied to Neon branch `br-solitary-frost-bcm6xvxx` |
| Typecheck | `npm run typecheck` | Pass |
| Lint | `npm run lint` | Pass |
| Build | `npm run build` | Pass; auth routes dynamic |
| Unit | `npm run test` | 10/10 Vitest + 4/4 scaffold |
| Auth integration | `npm run test:auth` | Nonce, sr25519 signature, cookie flags, `/me`, replay, invalid signature, wrong origin, logout, rate limit |
| Local E2E | `npx playwright test` | 40/40 desktop + mobile |
| Deployed preview | `xvfb-run -a node tests/preview-smoke.mjs` | All 15 routes, real sign-in, cookie flags, replay rejection, logout, cleanup |
| Readiness | `GET /api/ready` | 503 with database connected, chain verified, contract not deployed |

The deployed preview smoke requires a display because Vercel's edge checkpoint rejects headless bulk traffic from this environment; use `xvfb-run` on Linux. The script never prints tokens, connection strings or signatures.


## Phase 4/5 live run evidence (6 November 2026)

| Check | Result |
|---|---|
| Contract tests | 11/11 passing |
| FL simulation tests | 3/3 passing |
| Web unit/scaffold | 10/10 Vitest + 4/4 scaffold |
| Local Playwright | 40/40 desktop + mobile |
| Preview smoke | All routes, sr25519 sign-in, cookie flags, replay rejection, logout |
| Preview data UI | Deployer session; assets/jobs/licenses/job detail/run monitor; run page shows `REVOKED` and `completed` |
| Three-round run | `e18c1749-21f4-4cf4-b74a-2ed107f5d6cf` completed 3/3 |
| Revocation rule | Token 3 revoked block `341655`, denied at round-3 snapshot `341656`, rounds 1–2 included it |
| Final model hash | `0x1368046d874980a3b0575c9299fe929dc1a29566728f7b105461ad8fef602caf` |
