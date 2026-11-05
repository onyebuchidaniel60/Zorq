# Deployment and Environment Runbook

**Status:** deployment target and controls are specified; actual project URLs/credentials are not yet provisioned.

## Environments

| Environment | Web | Database | Chain | FL service | Data |
|---|---|---|---|---|---|
| Local | Next dev server | Local Postgres via `psql` (no Docker) | Hardhat local by default; optional testnet smoke | Local Python/uv | Seeded synthetic only |
| Preview/staging | Stable Vercel Preview (`https://zorq-preview-uhhh2.vercel.app`) | Neon Postgres via Vercel integration | Portaldot V3 testnet | Render staging service | Synthetic only |
| Production | Out of scope for the MVP | Not provisioned | Not deployed | Not provisioned | No real datasets |

Docker is intentionally not installed or used locally (Decision D-001). Local Postgres parity uses `psql`; the FL service's Dockerfile is built by Render remotely. The managed Postgres provider is Neon via the Vercel integration rather than Supabase (Decision D-002).

## Early preview rule

Phase 1 publishes the skeletal UI to a stable branch-specific Vercel Preview URL. Give the operator the exact URL after first deployment and keep it updated after each verified phase. Use Preview-specific environment variables and a dedicated staging DB. Never place production secrets in Preview. No real data, payments, irreversible actions or production contract admin privileges in Preview.

Vercel Preview and Production are separate environments and can have separate environment variables. Use branch-specific URL for continuity and commit-specific URL as evidence for a checkpoint.

## Vercel deployment procedure

1. Inspect current Vercel project and linked repository during Phase 0.
2. Configure the intended stable preview branch (operator-approved branch name; do not assume existing name).
3. Add only Preview environment values from the staging secret store.
4. Connect Git provider and confirm automatic preview deployment for accepted commits.
5. Deploy Phase 1 shell and verify exact URL/commit/route load.
6. After each accepted phase, verify the latest preview deployment; update `AI_HANDOFF.md`.
7. Production deployment is out of scope for the MVP. Do not promote to Production.

Phase 1 created project `uhhh2/zorq`, linked to the public GitHub repository, with root directory `apps/web`, framework `nextjs`, Node `22.x`. The stable preview alias is `https://zorq-preview-uhhh2.vercel.app`. Deployment protection is disabled because this is a public synthetic-data testnet preview. `main` is the Vercel production branch by project default; publish checkpoint commits to `main` and alias a fresh preview deployment to the stable preview URL, or use the dedicated `preview` branch once Vercel preview detection is confirmed.

## Supabase → Neon substitution

- Use the Neon resource provisioned through the Vercel integration as the staging/preview Postgres database.
- Keep the pooled `DATABASE_URL` server-only; configure Postgres.js with `prepare: false` for pooler compatibility.
- Run versioned migrations from a developer/CI environment; never edit schema manually in a deployed environment.
- Backup/export only synthetic data for MVP.
- Restrict DB network/service credentials to backend; browser never receives direct DB privileges.

Supabase remains the provider named in the frozen `ARCHITECTURE.md`; the substitution to Neon is a hosting/provider decision forced by the operator's provisioning instruction and is logged as D-002.

## Render FL service

- Deploy Python service as Docker web service.
- Only expose required internal endpoints; require shared token and TLS.
- Keep worker service private where possible; if public ingress is unavoidable, enforce token, rate limit and IP controls.
- Set concurrency to one run; hard timeout and memory/CPU limits.
- Do not allow arbitrary Python files, model artifacts or user-defined worker endpoints.
- Health endpoint is liveness; readiness includes the ability to communicate with the app's internal API.
- Logs must be sanitized.

## Portaldot testnet preflight

Before deploying contract or signing transactions:

1. Check `eth_chainId` equals `420420777`.
2. Check `eth_blockNumber`, `eth_getBalance`, `eth_call`, gas estimate and RPC reliability.
3. Confirm RPC is the current V3 EVM endpoint from Portaldot's current developer communications.
4. Confirm how test POT sent to the user's native SS58 address is made available to their EVM H160 address. Do not assume equivalence.
5. Deploy a minimal smoke contract/test transaction with a disposable operator-controlled account.
6. Verify transaction receipt, event data, read-back state and explorer link.
7. Record contract address, deployment tx, compiler version, optimizer settings, source/bytecode verification status and test block.

Do not ask for or log seed phrases/private keys. Store deployment key in secure CI/Vercel/secret-manager environment only. A wallet-controlled application transaction is signed by the user's wallet, not a server-held key.

## Release and rollback

- Production deployment is out of scope for the MVP. The agent completes Phase 9 by deploying to testnet only. Do not deploy to mainnet, do not move real value, do not enable production data.
- Freeze commits to the release candidate, run all tests, record exact commit and environment.
- Run migration backup/check, deploy app and services, execute smoke tests, confirm explorer links and monitor logs.
- For app rollback, revert deployment to last verified commit. For DB changes, use forward migration or tested rollback plan; never drop data blindly.
- Smart contract is non-upgradeable and chain actions are irreversible. No contract migration or alternate contract address without a new approved deployment plan.

## Incident steps

1. Pause new asset/job/license issuance using contract's owner-controlled creation pause, if needed.
2. Do not disable provider revocation.
3. Pause job(s) at creator control where possible.
4. Stop FL service and mark affected runs failed if authorization snapshots cannot be trusted.
5. Preserve sanitized audit/transaction evidence.
6. Do not alter contract data or admin ownership under pressure without operator approval.
7. Record incident, impact, rollback and recovery steps.
