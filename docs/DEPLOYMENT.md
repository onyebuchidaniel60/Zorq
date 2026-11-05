# Deployment and Environment Runbook

**Status:** deployment target and controls are specified; actual project URLs/credentials are not yet provisioned.

## Environments

| Environment | Web | Database | Chain | FL service | Data |
|---|---|---|---|---|---|
| Local | Next dev server | Local Docker Postgres | Hardhat local by default; optional testnet smoke | Local Docker/Python | Seeded synthetic only |
| Preview/staging | Stable Vercel branch Preview | Separate Supabase staging DB | Portaldot V3 testnet | Render staging service or protected local test service | Synthetic only |
| Production | Out of scope for the MVP | Not provisioned | Not deployed | Not provisioned | No real datasets |

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

## Supabase

- Create/identify a dedicated staging project.
- Keep DB connection string server-only.
- Use transaction pooler mode for serverless if suitable; configure Postgres.js with prepared statements disabled when required.
- Run versioned migrations; never edit production schema manually without migration.
- Backup/export only synthetic data for MVP.
- Restrict DB network/service credentials to backend; browser never receives direct DB privileges.

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
