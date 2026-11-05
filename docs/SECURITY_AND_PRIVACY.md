# Security and Privacy Model

## Product security boundary

Zorq controls authorization for a defined training operation. It does not itself guarantee the confidentiality of model updates, training outputs or the final model. The MVP handles synthetic demo partitions only.

## Assets to protect

- Wallet ownership and signed authorizations.
- SIWE nonce/session integrity.
- Data asset private metadata and demo partition assignment.
- License lifecycle and job binding.
- Authorization snapshots and participant allowlists.
- FL service shared token and internal endpoints.
- Contract deployment key and RPC access.
- Run events, aggregate metrics and model artifacts/hashes.

## Threat/control matrix

| Threat | Required control | Verification |
|---|---|---|
| SIWE replay | Single-use nonce, 5-minute expiry, exact origin/domain/URI/chain validation | Replay and wrong-origin tests |
| Session theft | HttpOnly, Secure, SameSite cookie; short lifetime; logout invalidates cookie | Cookie flags/session tests |
| CSRF | Same-origin and Origin/Host checks on mutations; SameSite cookie | Cross-origin POST tests |
| IDOR | Every private asset/license/run query scoped to session wallet or explicitly allowed job role; return 404 for inaccessible objects | Cross-wallet resource tests |
| Wrong-chain tx | Verify receipt chain ID and configured RPC | Wrong-chain fixture/test |
| Forged confirmation | Verify receipt success, tx sender, contract address, decoded event args and on-chain state | Altered hash/sender/event tests |
| Database mirror abuse | DB is not authorization authority; backend reads contract at snapshot block | Mutate mirror row and confirm no authorization change |
| Revocation race | Snapshot block/hash fixed per round; same allowlist for training and aggregation | Revoke during/after snapshot test |
| RPC outage | Fail closed; do not use stale cached snapshots | Simulated RPC outage test |
| FL service spoofing | Internal high-entropy bearer token over TLS; no public browser access | Wrong/missing token tests |
| Extra worker update | Enforce participant/asset/round/snapshot allowlist; reject unknown updates | Inject unlisted client update |
| Malformed update | Validate tensor names/shapes, finite values, dtype, count and payload limits | NaN/Inf/shape/oversize tests |
| Arbitrary code execution | Fixed model/training task; no model upload, notebooks, arbitrary worker URLs or Python execution | API rejects unsupported fields |
| SQL injection | Zod validation, Drizzle parameterized query, no string-built SQL | Injection tests and code review |
| XSS | React escaping, avoid unsafe HTML, strict validation for markdown if ever used | Stored/reflected XSS tests |
| SSRF | No user-supplied URL fetches; server integrations use fixed allowlisted origins | API schema and egress review |
| Rate abuse | IP/wallet rate limits, nonce controls, run concurrency limit | Load/rate-limit tests |
| Secret leak | Server-only env vars, secret scanning, sanitized logs | CI secret scan and client-bundle inspection |
| Admin misuse | Operator can pause creation only; cannot mint/revoke/change ownership | Contract permission tests |
| Supply-chain risk | Lockfiles, pinned major versions, dependency audit before release | Audit output stored in checkpoint |

## Contract invariants

- Only asset owner can issue/revoke licenses for that asset.
- Only job creator can pause/resume/close the job.
- License is non-transferable; approvals are unavailable.
- License token ID maps to immutable asset/job identity, validity interval and revision; revoked is terminal.
- A closed job is terminal.
- Job purpose and model configuration hashes cannot change after creation.
- Contract owner emergency pause cannot block revocation.
- `checkAuthorization` returns deterministic deny reason for non-existing, wrong owner, wrong job, revoked, inactive asset, non-open job, not-yet-valid or expired license.

## FL trust and privacy limitations

The MVP Flower coordinator is an off-chain trusted component. It must obey the authorization snapshot but Portaldot does not cryptographically force a third-party coordinator to do so. The architecture mitigates this with a single-block snapshot, signed/recorded evidence and aggregation allowlist checks, but it does not prove coordinator honesty.

Federated learning avoids sending raw source partitions to a central data lake in this demo; however, gradients/updates may leak information and may be poisoned. The MVP does not implement differential privacy, secure aggregation, homomorphic encryption, TEEs, trusted execution or ZKP. Do not describe the synthetic Flower run as confidential medical/financial computation.

## Data-handling rules

- No raw dataset upload endpoint exists.
- Synthetic partitions are generated locally/from fixed seeded fixtures.
- Chain stores opaque IDs and salted commitments only; a hash commitment is not encryption.
- Private metadata is stored in Postgres and visible only to the owner wallet.
- Job creator/public users see purpose/configuration, asset counts and job-level results, not providers' private asset names/descriptions.
- Do not log full request bodies, signatures, nonce, cookies, dataset metadata or model arrays.
- Keep only run metrics, status, model hash and authorization evidence; discard raw in-memory updates after completion.
- Retention for audit events is 90 days in MVP unless operator-approved policy changes; no production compliance assertion.

## Responsible disclosure / support

Support contact destination must be provided by the operator before public launch. Do not invent an email, security address, Discord channel or legal contact. The MVP is an experimental testnet application and is not suitable for regulated data or production workloads.
