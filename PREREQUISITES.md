# Zorq — Prerequisites Manifest

_Produced by the agent at the end of Phase 0. Fill each row before instructing the agent to execute Phases 1–10._

**Phase 0 status:** Repository is blueprint-only. No application code, package manifest, lockfile, deployment config or test exists. Portaldot RPC is reachable and chain ID is confirmed. The outstanding items below are the only inputs the agent cannot obtain, decide or generate itself.

## Credentials (supply as env vars in Vercel Preview, Render, and local env files — never commit)

| Variable | Where used | Supplied? |
|---|---|---|
| `SESSION_SECRET` | Next.js session signing; minimum 32 random bytes | ☐ |
| `DATABASE_URL` | Postgres (Supabase staging); direct/session URL for migrations plus pooler URL if different | ☐ |
| `DEPLOYER_PRIVATE_KEY` | Contract deployment on Portaldot testnet. Agent generated a disposable key held **outside the repo** at `/tmp/opencode/zorq-deployer.json`; do not ask for or paste this key. Operator only needs to fund the H160 address below. | ☐ (funding only) |
| `FL_SERVICE_SHARED_SECRET` | Next.js ↔ FL service internal auth; high-entropy | ☐ |
| `RATE_LIMIT_SECRET` | Rate-limit HMAC salt; high-entropy | ☐ |
| `PORTALDOT_EVM_RPC_URL` | Public V3 RPC works without auth; supply only if an authenticated/private endpoint is required | ☐ (optional) |

## Accounts / access

| Item | Required | Current status | Supplied? |
|---|---|---|---|
| GitHub repository (URL + push access) | Yes | **Confirmed:** `https://github.com/onyebuchidaniel60/Zorq` is public, default branch `main`, and the `gh` CLI is authenticated with `repo` scope. | ☑ |
| Vercel project + stable preview branch | Yes | **Unconfirmed:** Vercel CLI is authenticated as `onyebuchidaniel60-1034`, but no Zorq project exists. Agent can create a project under this account if authorized; otherwise supply the existing project name/ID and stable preview branch. | ☐ |
| Supabase project (staging) | Yes | **Blocked:** no Supabase CLI, no `DATABASE_URL`, no access token in the environment. Operator must create the staging project and supply connection details, or supply a Supabase access token so the agent can create it. | ☐ |
| Render service access (or payment method if agent creates it) | Yes | **Blocked:** no Render CLI, API key or service. Operator must create the Docker web service and supply its URL/token, or supply a Render API key/payment method so the agent can create it. | ☐ |

## Portaldot EVM funding

| Item | Value | Supplied? |
|---|---|---|
| Deployer / demo H160 address (agent-generated; displayed in Phase 0 report) | `0x5fE9C50bd45Ebe0e66eD4547ae43edD4ec26949e` | ☐ |
| Funded with testnet POT (minimum amount stated by agent) | **Minimum 0.1 test POT; 1 test POT recommended.** Live balance at Phase 0 is `0x0`; observed `eth_gasPrice` is `0x55a5` (21,925 wei), so this is ample for deployment and demo transactions. | ☐ |
| Confirmation of SS58 → H160 funding path (or agent-supplied alternative) | **Blocked / operator input required.** Portaldot test-token instructions use a native SS58 address beginning with `5`, not an EVM `0x` address. The reviewed public developer docs do not document an SS58-to-H160 funding/mapping flow. Operator must confirm the official method, or fund the H160 address directly through a verified path. Never send a seed phrase or private key. | ☐ |

## Operator-supplied inputs

| Item | Location | Current status | Supplied? |
|---|---|---|---|
| UI reference image(s) | `docs/design/reference/` | **Missing.** Phase 7 will block until the operator commits the reference image(s). Do not fetch, generate or substitute. | ☐ |
| Demo-video reference | `docs/demo/reference/` (optional) | **Missing.** Phase 5.5 / Phase 10 will proceed using `docs/DEMO_VIDEO.md` alone and note the absence. If the directory exists but is empty, it will be recorded as “pending operator supply”. | ☐ (optional) |

## Open decisions (agent lists only decisions PROJECT_SPEC + ARCHITECTURE do not resolve)

| Decision | Options | Agent recommendation | Operator choice |
|---|---|---|---|
| Supabase provisioning route | (a) Operator creates the staging project and supplies `DATABASE_URL`; (b) operator supplies a Supabase access token and the agent creates it | (a), because it keeps billing/ownership with the operator and avoids a long-lived token | |
| Render provisioning route | (a) Operator creates the Docker web service and supplies URL + deploy access; (b) operator supplies a Render API key/payment method and the agent creates it | (a), for the same ownership/billing reason | |
| Vercel project route | (a) Agent creates a project under the authenticated account; (b) operator supplies an existing project name/ID and stable preview branch | (a), because the account is already authenticated and no product decision is involved | |
| Portaldot H160 gas path | Official SS58→H160 mapping, direct H160 faucet/transfer, or operator-funded transfer | Operator confirms the official path; do not guess | |

_No other product decisions are open. The agent resolves remaining implementation choices from `PROJECT_SPEC.md` and `ARCHITECTURE.md` and logs them in `AI_HANDOFF.md`'s Decision Log._

## Sign-off

When every required row above is supplied, reply: `execute`. The agent will then run Phases 1 through 10 autonomously, stopping only for hard blockers as defined in AGENTS.md §1.1.
