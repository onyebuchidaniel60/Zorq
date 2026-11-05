# Zorq — Prerequisites Manifest

_Produced by the agent at the end of Phase 0. Fill each row before instructing the agent to execute Phases 1–10._

**Phase 0 status:** Repository is blueprint-only. No application code, package manifest, lockfile, deployment config or test exists. Baseline HEAD at Phase 0: `931b654`.

## Credentials (supply as env vars in Vercel Preview, Render, and local env files — never commit)

| Variable | Where used | Supplied? |
|---|---|---|
| `SESSION_SECRET` | Next.js session signing; minimum 32 random bytes | ☑ Agent generates |
| `DATABASE_URL` | Postgres (Neon via Vercel integration); pooled connection string | ☑ Agent provisions via `vercel integration add neon` |
| `DEPLOYER_SEED` / keypair | Portaldot testnet deployer; SS58 sr25519 keypair, persisted outside repo | ☑ Agent generates at `.secrets/` (gitignored) |
| `FL_SERVICE_SHARED_SECRET` | Next.js ↔ FL service internal auth; high-entropy | ☑ Agent generates |
| `RATE_LIMIT_SECRET` | Rate-limit HMAC salt; high-entropy | ☑ Agent generates |
| `PORTALDOT_EVM_RPC_URL` | Public V3 RPC: `https://test-evm-rpc-v3.portaldot.dev` | ☑ Public endpoint, no auth required |

## Accounts / access

| Item | Required | Current status | Supplied? |
|---|---|---|---|
| GitHub repository (URL + push access) | Yes | Confirmed: `https://github.com/onyebuchidaniel60/Zorq` is public, default branch `main` | ☑ |
| Vercel project + stable preview branch | Yes | CLI authenticated as `onyebuchidaniel60-1034`; agent creates the Zorq project and stable preview branch in Phase 1 | ☑ |
| Neon database (via Vercel) | Yes | Agent provisions via `vercel integration add neon --plan free` in Phase 2 | ☑ |
| Render service access | Yes | API key supplied in `.env.local` as `RENDER_API_KEY` (gitignored, mode 600); agent creates the Docker web service in Phase 4 | ☑ |

## Portaldot EVM funding

| Item | Value | Supplied? |
|---|---|---|
| Deployer SS58 address (agent-generated, printed in Phase 1 report) | _agent supplies_ | ☐ Awaiting Phase 1 output |
| Derived H160 address (agent computes via `ss58ToH160`) | _agent supplies_ | ☐ Awaiting Phase 1 output |
| Funded with testnet POT | Fund at POT Starter Hub: `https://pot-starter-hub.vercel.app` — 10 tPOTv3 per claim, 24h cooldown | ☐ Operator funds after Phase 1 |
| Confirmation of SS58 → H160 funding path | POT Starter Hub funds SS58 directly; H160 derives from same keypair via `ss58ToH160` from `@polkadot-apps/address` | ☑ Path confirmed |
| Write path | Use `twinkey-provider` or equivalent Substrate signing path for contract deployment and state-changing transactions (direct EOA writes may fail on Portaldot V3) | ☑ Confirmed |

## Operator-supplied inputs

| Item | Location | Supplied? |
|---|---|---|
| UI reference image 1 | `docs/design/reference/reference1.webp` | ☑ Committed |
| UI reference image 2 | `docs/design/reference/reference2.webp` | ☑ Committed |
| Demo-video reference | `docs/demo/reference/reference-video.mp4` | ☑ Committed (or: ☑ Intentionally absent — proceed per `docs/DEMO_VIDEO.md`) |

## Open decisions

None. PROJECT_SPEC.md and ARCHITECTURE.md resolve all product and architecture decisions. The agent resolves any residual ambiguity per AGENTS.md §1.1 and logs it in `AI_HANDOFF.md`'s Decision Log.

## Sign-off

All required inputs supplied. Proceed with Phase 1 through Phase 10 autonomously. Operator will fund the SS58 address after Phase 1 preflight and reply `funded` to unblock Phase 3 deployment.

Reply: `execute`
