# API Reference — Zorq MVP

All routes are served by Next.js Route Handlers. JSON requests/responses. Authenticated writes require a valid SIWE session, same-origin/CSRF validation and Zod schema validation. Use the standard error envelope below. This document describes the frozen contract; code must match it.

## Error envelope

```json
{
  "error": {
    "code": "LICENSE_NOT_ACTIVE",
    "message": "This license is not active for the requested training job.",
    "requestId": "uuid",
    "details": {}
  }
}
```

Do not return stack traces, SQL errors, secret values, signatures, auth cookies or private asset metadata to unauthorized users.

## Authentication

| Method | Path | Auth | Request | Result |
|---|---|---|---|---|
| GET | `/api/health` | None | — | Liveness only; no config details |
| GET | `/api/ready` | None | — | Sanitized dependency readiness |
| POST | `/api/auth/nonce` | None | `{address, ss58Address}` | Returns EIP-4361 challenge `{nonce, message, expiresAt}`; five-minute expiry |
| POST | `/api/auth/verify` | None | `{message, signature, signatureType?}` | Verifies the sr25519 signature bound to the SS58 account and sets a secure session cookie |
| GET | `/api/auth/me` | Session | — | Current wallet/session expiry |
| POST | `/api/auth/logout` | Session cookie | — | Clears the cookie; same-origin check |

The challenge request must include both the H160 `address` and the `ss58Address` that signs the message. The server recomputes the H160 from the SS58 account and rejects a mismatch. `signatureType` is `payload` for raw message bytes or `bytes` for the `<Bytes>…</Bytes>` extension wrapper.

## Assets

| Method | Path | Auth | Request | Result |
|---|---|---|---|---|
| GET | `/api/assets` | Session | `status?` | Own assets plus global reserved partition IDs for the registration form |
| POST | `/api/assets/drafts` | Session | `{displayName,description,dataSource,demoPartitionId?,dbUrl?,dbTable?,labelColumn?,idempotencyKey}` | Draft + opaque on-chain ID + commitment + tx args; external URLs are encrypted and never returned |
| GET | `/api/assets/{assetId}` | Session | — | Owner-only private metadata; other users receive 404 |
| POST | `/api/assets/{assetId}/confirm` | Session | `{txHash}` | Verify receipt/event and activate asset |
| POST | `/api/assets/{assetId}/deactivate/confirm` | Session | `{txHash}` | Verify owner-signed deactivation |

## Jobs

| Method | Path | Auth | Request | Result |
|---|---|---|---|---|
| GET | `/api/jobs` | Session | `status?`, `cursor?` | Public job metadata and counts; no private asset metadata |
| POST | `/api/jobs/drafts` | Session | `{title,description,purposeText,startsAt,endsAt,idempotencyKey}` | Draft, purpose/config hashes and contract args |
| GET | `/api/jobs/{jobId}` | Session | — | Job data plus role-filtered participants |
| POST | `/api/jobs/{jobId}/confirm` | Session | `{txHash}` | Verify `JobCreated` and publish |
| POST | `/api/jobs/{jobId}/state/confirm` | Session | `{expectedState,txHash}` | Verify creator-signed pause/resume/close |
| POST | `/api/jobs/{jobId}/runs` | Session | `Idempotency-Key` header | Create run if job creator, no active run and enough valid licenses |

## Licenses

| Method | Path | Auth | Request | Result |
|---|---|---|---|---|
| GET | `/api/licenses` | Session | `status?` | Licenses belonging to current wallet |
| POST | `/api/licenses/drafts` | Session | `{assetId,jobId,validFrom,validUntil,idempotencyKey}` | Validated draft and `issueLicense` arguments |
| GET | `/api/licenses/{licenseId}` | Session | — | Owner details; job creator receives sanitized job-bound state only |
| POST | `/api/licenses/{licenseId}/confirm` | Session | `{txHash}` | Verify mint and record token/revision |
| POST | `/api/licenses/{licenseId}/revoke/confirm` | Session | `{txHash}` | Verify owner-signed revoke |

## Runs

| Method | Path | Auth | Request | Result |
|---|---|---|---|---|
| GET | `/api/runs/{runId}` | Session | — | Role-filtered run status, aggregate metrics and evidence |
| GET | `/api/runs/{runId}/rounds` | Session | — | Round results and authorization snapshots summary |

## Internal FL service API

These routes are server-to-server only. They must never be called from the browser. Require TLS, `Authorization: Bearer <FL_SERVICE_SHARED_SECRET>`, strict schema validation and run/round idempotency.

| Method | Path | Request | Result / fail-closed behaviour |
|---|---|---|---|
| POST | `/api/internal/runs/{runId}/authorization-snapshot` | `{roundNumber}` | Single-block chain snapshot; stored snapshot ID, block number/hash, allowed participant IDs and denied reason codes. Fail closed on RPC error, stale state or fewer than two allowed participants. |
| POST | `/api/internal/runs/{runId}/events` | `{type,roundNumber?,metrics?,modelHash?,failureCode?}` | Validated run progress event; duplicate event ID ignored safely. |
| POST | `/api/internal/runs/{runId}/complete` | `{finalModelHash,aggregateMetrics}` | Completes only when expected rounds and state invariants hold. |
| POST | `/api/internal/runs/{runId}/fail` | `{failureCode,publicMessage}` | Records sanitized failure; no secret/stack trace in public message. |

## Deterministic error codes

At minimum: `INVALID_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `WRONG_CHAIN`, `INVALID_SIGNATURE`, `NONCE_EXPIRED`, `NONCE_REUSED`, `TX_NOT_FOUND`, `TX_REVERTED`, `TX_WRONG_CHAIN`, `TX_WRONG_CONTRACT`, `TX_WRONG_SENDER`, `TX_EVENT_MISMATCH`, `ASSET_INACTIVE`, `JOB_NOT_OPEN`, `LICENSE_NOT_ACTIVE`, `LICENSE_EXPIRED`, `LICENSE_REVOKED`, `WRONG_JOB`, `INSUFFICIENT_PARTICIPANTS`, `RUN_ALREADY_ACTIVE`, `FL_PROVIDER_UNAVAILABLE`, `AUTHORIZATION_UNAVAILABLE`, `RATE_LIMITED`, `IDEMPOTENCY_CONFLICT`, `INTERNAL_ERROR`.

## Rate limits and idempotency

- SIWE nonce: maximum 5 requests/IP/10 minutes; each nonce expires in 5 minutes.
- SIWE verify: maximum 10 failed attempts/IP+wallet/10 minutes.
- Authenticated endpoints: default 60 requests/wallet/minute.
- Start-run requires `Idempotency-Key`; only one active run per job.
- Draft/confirmation dedupe by wallet + idempotency key or entity + transaction hash.
- Internal events/snapshots dedupe by run ID + round number + event type/snapshot ID.


## Runs and internal FL endpoints (implemented)

| Method | Path | Auth | Result |
|---|---|---|---|
| POST | `/api/jobs/{jobId}/runs` | Session + creator + `Idempotency-Key` | Creates a queued run and calls the FL service; 422 below two active licenses |
| GET | `/api/runs/{runId}` | Session; creator or participant owner | Role-filtered run, rounds and authorization checks |
| GET | `/api/runs/{runId}/rounds` | Session; creator or participant owner | Round snapshots and decisions |
| POST | `/api/internal/runs/{runId}/authorization-snapshot` | Internal bearer | One-block contract snapshot + allow/deny decisions |
| POST | `/api/internal/runs/{runId}/events` | Internal bearer | Round progress and aggregate metrics |
| POST | `/api/internal/runs/{runId}/complete` | Internal bearer | Final model hash and aggregate metrics |
| POST | `/api/internal/runs/{runId}/fail` | Internal bearer | Sanitized failure state |

The internal endpoints are not browser-accessible and require `FL_SERVICE_SHARED_SECRET`. Snapshot evidence is stored in `training_rounds` and `authorization_checks`.
