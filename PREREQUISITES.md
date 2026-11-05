# Zorq — Prerequisites Manifest

_Produced by the agent at the end of Phase 0. Fill each row before instructing the agent to execute Phases 1–10._

## Credentials (supply as env vars in Vercel Preview, Render, and local env files — never commit)

| Variable | Where used | Supplied? |
|---|---|---|
| SESSION_SECRET | Next.js session signing | ☐ |
| DATABASE_URL | Postgres (Supabase staging) | ☐ |
| DEPLOYER_PRIVATE_KEY | Contract deployment on Portaldot testnet | ☐ |
| FL_SERVICE_SHARED_SECRET | Next.js ↔ FL service internal auth | ☐ |
| RATE_LIMIT_SECRET | Rate-limit HMAC salt | ☐ |
| PORTALDOT_EVM_RPC_URL | If a private/authenticated RPC is required | ☐ |

## Accounts / access

| Item | Required | Supplied? |
|---|---|---|
| GitHub repository (URL + push access) | Yes | ☐ |
| Vercel project + stable preview branch | Yes | ☐ |
| Supabase project (staging) | Yes | ☐ |
| Render service access (or payment method if agent creates it) | Yes | ☐ |

## Portaldot EVM funding

| Item | Value | Supplied? |
|---|---|---|
| Deployer / demo H160 address (agent-generated; displayed in Phase 0 report) | _agent supplies_ | ☐ |
| Funded with testnet POT (minimum amount stated by agent) | _agent supplies_ | ☐ |
| Confirmation of SS58 → H160 funding path (or agent-supplied alternative) | _agent supplies_ | ☐ |

## Operator-supplied inputs

| Item | Location | Supplied? |
|---|---|---|
| UI reference image(s) | docs/design/reference/ | ☐ |
| Demo-video reference | docs/demo/reference/ (optional) | ☐ |

## Open decisions (agent lists only decisions PROJECT_SPEC + ARCHITECTURE do not resolve)

| Decision | Options | Agent recommendation | Operator choice |
|---|---|---|---|
| _agent fills_ | | | |

## Sign-off

When every row above is supplied, reply: `execute`. The agent will then run Phases 1 through 10 autonomously, stopping only for hard blockers as defined in AGENTS.md §1.1.
