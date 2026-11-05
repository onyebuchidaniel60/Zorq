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

No final UI visual design before every blocking criterion passes and operator accepts evidence.

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

## Test evidence format

Every checkpoint records commit SHA, exact commands, pass/fail output, E2E URL, chain/contract reference, run IDs, sanitized screenshots/logs, known limitations and manual review. Do not state “tested” without evidence.
