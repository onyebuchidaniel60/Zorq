# Developer Setup

**Status:** setup specification; commands and scripts are to be implemented and verified during Phase 1/2.

## Prerequisites

- Node.js 22.23.4 (exact patch pinned in `.nvmrc`).
- npm 10.9.x bundled with Node 22.23.4; use the root committed `package-lock.json`.
- Python 3.12 and `uv`.
- `psql` for optional local Postgres parity. Docker is not used locally (Decision D-001).
- A supported Substrate wallet for testnet interaction; the EVM H160 identity is derived from the SS58 key.
- Access to a Portaldot V3 test account and verified EVM gas funding.
- Vercel, Neon (via Vercel) and Render access for deployment phases; not required for local-only unit tests.

## Repository layout

See `ARCHITECTURE.md` section 12. The monorepo contains `apps/web`, `apps/fl-service`, `packages/contracts`, `packages/db`, `packages/shared`, `packages/validation`, `tests` and `docs`.

## Initial setup sequence

The agent must implement and test actual scripts before documenting them as ready. Verified Phase 1 sequence:

1. Clone the actual repository URL supplied by the operator. Do not guess it.
2. Check out the agreed development branch and inspect `git status`.
3. Install Node 22.23.4 (`nvm use`) and install dependencies with `npm ci` from repository root.
4. Install Python dependencies using `uv sync` in `apps/fl-service` (Phase 4).
5. Copy `.env.example` to `.env.local` for web and the FL service's local env file. Populate only local test values.
6. Start local Postgres with `psql`/a host service if local parity is needed; staging uses Neon via Vercel.
7. Apply database migrations with the documented script (Phase 2).
8. Start Next.js with `npm run dev -- --port 3100`; start the FL service using its documented command (Phase 4).
9. Run lint, typecheck, unit, contract and integration tests.

Do not claim these commands are executable until implemented and verified. During Phase 0 inspect existing commands and keep README accurate to the actual repository.

## Environment groups

### Web/server-only

- `DATABASE_URL` — Postgres connection string; server-only.
- `SESSION_SECRET` — 32+ random bytes for signed session; server-only.
- `APP_ORIGIN` — canonical app origin for SIWE and origin validation.
- `PORTALDOT_EVM_RPC_URL` — Portaldot V3 EVM RPC; server-only.
- `PORTALDOT_CHAIN_ID` — expected chain ID `420420777`.
- `ZORQ_CONTRACT_ADDRESS` — deployed registry address; server-only for receipt/read verification.
- `NEXT_PUBLIC_APP_URL` — public canonical app URL for metadata and absolute links.
- `NEXT_PUBLIC_PORTALDOT_CHAIN_ID`, `NEXT_PUBLIC_PORTALDOT_RPC_URL`, `NEXT_PUBLIC_PORTALDOT_EXPLORER_URL` and `NEXT_PUBLIC_ZORQ_CONTRACT_ADDRESS` — public wallet/network configuration only; never put secrets here.
- `FL_SERVICE_URL` — internal FL service origin; server-only.
- `FL_SERVICE_SHARED_SECRET` — high-entropy internal auth token; server-only.
- `FL_SERVICE_TIMEOUT_MS` — optional internal service timeout; default 10,000 ms.
- `RATE_LIMIT_SECRET` — server-only HMAC salt for rate-limit bucket keys.

### Contract deployment

- `PORTALDOT_EVM_RPC_URL` — RPC URL.
- `PORTALDOT_CHAIN_ID` — expected chain ID.
- `DEPLOYER_PRIVATE_KEY` — deployer secret from secure environment/secret manager; never commit or print.

### FL service

- `FL_SERVICE_SHARED_SECRET` — internal shared secret.
- `ZORQ_INTERNAL_API_BASE_URL` — Next.js internal API origin used by the FL service for authorization/progress callbacks.
- `FL_SERVICE_MODE` — `simulation` for this MVP; do not set `native_portaldot` without a verified adapter and operator approval.
- `FLOWER_MAX_CONCURRENT_RUNS` — set to `1` for MVP.
- `FLOWER_MAX_PARTICIPANTS` — set to `5` for MVP.
- `DEMO_DATA_SEED` — deterministic synthetic-data seed.
- `PYTHONUNBUFFERED` — set to `1` for immediate logs.

Exact names are controlled by `ARCHITECTURE.md` section 11. Do not add new variables without updating this document and `.env.example`.

## Windows PowerShell notes

- Use `npm.cmd` if the PowerShell execution policy blocks `npm.ps1`.
- Check `$LASTEXITCODE` after each command before proceeding.
- Use PowerShell-compatible commands in documentation; do not assume Bash shell syntax.
- Keep line endings and path handling cross-platform.

## Wallet and testnet setup

Portaldot network values are recorded in `ARCHITECTURE.md`. Before a transaction, check live `eth_chainId` and `eth_blockNumber`. The test-token distribution instructions have referred to native SS58 addresses rather than EVM H160 addresses; confirm the mapping/funding path with Portaldot support. Never ask the operator to paste a seed phrase or private key into chat or source control.

For local development, `next.config.ts` loads the repository-level `.env.local`. The Preview environment receives the same names from Vercel. `npm run db:migrate` applies the committed Drizzle migrations using `DATABASE_URL_UNPOOLED` (or `DATABASE_URL`).

## Authentication implementation

- The browser uses a Substrate extension (polkadot.js, Talisman or SubWallet) through `twinkey-provider`'s `fromExtension`.
- The server creates a one-use, five-minute nonce and an EIP-4361 SIWE message bound to the app domain, URI and chain ID `420420777`.
- The extension signs the message bytes with sr25519; the server verifies the signature against the SS58 public key and requires `ss58ToH160(ss58) === address` from the challenge request.
- A successful verification issues an eight-hour signed HttpOnly session cookie. Nonces are atomically consumed in Postgres; replayed signatures are rejected.
- Sign-in never sends a transaction and never sends an EVM private key to the server.

## Test data

Only generated synthetic partitions may be used. Do not import or upload any real personal, medical, financial or commercial dataset. Use a deterministic seed in tests and clearly label all seeded accounts/assets/jobs as demo data.
