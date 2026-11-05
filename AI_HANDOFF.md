# AI_HANDOFF.md — Zorq

**Execution mode:** Autonomous. Phase completion reports are for the record, not for approval. See AGENTS.md §1.1. The only stops are hard blockers.

**Last updated:** 5 November 2026
**Project state:** Blueprint-only repository inspected; Phase 0 (amended) complete; no application code written; autonomous execution ready after prerequisites.
**Current phase:** Phase 0 complete — awaiting operator completion of `PREREQUISITES.md` and reply `execute`.

## Product in one paragraph

Zorq is programmable authorization infrastructure for privacy-preserving federated machine learning. A data owner issues a non-transferable ERC-721 DataLicense that binds one registered data asset to one specific FL job, purpose/configuration commitment, permitted time window and owner. A coordinator checks authoritative Portaldot EVM contract state at admission and at every round boundary. Revocation after a round snapshot affects subsequent rounds, not a contribution already admitted into the current round.

## Source-of-truth documents

1. `PROJECT_SPEC.md` — product, scope, users, flows, functional requirements, state machines, data model, UI routes, API, security and acceptance criteria.
2. `ARCHITECTURE.md` — fixed stack, smart contract, backend/FL boundaries, auth, deployment, DB, environment variables and repository layout.
3. `IMPLEMENTATION_PLAN.md` — autonomous phase sequence, tasks, checkpoints and Phase 10 demo-video production.
4. `AGENTS.md` — mandatory coding-agent rules.
5. `docs/` — developer setup, API, deployment, privacy, operator/user guide, test plan, Portaldot validation, design reference/waiver, demo-video spec and autonomous-execution contract.

## Current architecture decisions

- Portaldot V3 EVM testnet; chain ID `420420777` confirmed live on 5 November 2026; block production confirmed advancing.
- One Solidity `ZorqRegistry` contract on Portaldot V3 EVM; ERC-721 license identity and registry state in the same contract; token is non-transferable.
- Chain is authorization source of truth; Postgres is metadata/index/audit store.
- Next.js App Router/TypeScript APIs, wagmi/viem, SIWE cookie session, Supabase Postgres + Drizzle.
- Python FastAPI + Flower + PyTorch synthetic binary classifier as a demo FL execution adapter.
- Vercel stable branch Preview; Render Docker for FL service; staging-only secrets and synthetic data; production out of scope.
- No raw data upload, real regulated data, payment, mainnet, LLM, native FL/ZKP/HE claim, or arbitrary model/worker execution in MVP.
- At run admission and each round boundary, Next.js obtains a contract snapshot at one confirmed block and returns the allowlist to Flower. Coordinator fails closed if snapshot is unavailable. Same allowlist governs training and aggregation.

## Portaldot external integration status

Public Portaldot material advertises V3 EVM/WASM and ERC standards, and older developer material advertises FL/ZKP/HE. The public developer docs reviewed do not provide the complete callable FL enrollment/execution API or ZKP proving/verifying API needed to claim native integration. MVP must use `FlowerDemoProvider`; no fabricated Portaldot adapter or mocked proof indicator. A future native adapter requires official docs/access, a working sample and successful integration evidence.

Current network references recorded in `ARCHITECTURE.md`:

- EVM RPC: `https://test-evm-rpc-v3.portaldot.dev`
- Chain ID: `420420777`
- Substrate WS: `wss://test-node-v3.portaldot.dev` (not required for MVP)
- Explorer: `https://scanner-testnet-v3.portaldot.dev/`

Portaldot test-token distribution instructions have specified a native SS58 address beginning with `5`, not an EVM `0x` address. Verify the exact H160 gas-funding path before transactions; never share seed phrases/private keys.

**Phase 0 live check (5 November 2026):** `eth_chainId` returned `0x190f1ca9` = `420420777`; six `eth_blockNumber` samples advanced from `0x50802` to `0x50807` over ~32 seconds; `eth_gasPrice` returned `0x55a5` (21,925 wei). No transaction was sent. The reviewed public developer docs remain Substrate/ink!-oriented and do not document an SS58-to-H160 funding flow.

## Preview and repository status

| Item | Current value |
|---|---|
| Git repository | `onyebuchidaniel60/Zorq` (public) |
| Actual Git remote URL | `https://github.com/onyebuchidaniel60/Zorq` |
| Current branch / commit | `main` / Part A amendment `fb9e956`; the Phase 0 inspection-report commit immediately follows |
| Vercel preview URL | **Not deployed yet** |
| Deployed commit SHA | **Not applicable yet** |
| Preview environment | Vercel CLI authenticated; no Zorq project exists yet |
| Production URL | Out of scope for the MVP |
| Supabase staging DB | **Not provisioned — blocker** |
| Render FL service | **Not provisioned — blocker** |
| Portaldot contract address | Not deployed yet |
| Contract deployment transaction | Not available |

Phase 1 must deploy the skeletal frontend early and then report its exact stable preview URL and deployed commit as soon as deployment succeeds. Keep it current at later verified phase checkpoints. Never fabricate or reuse a URL from another project.

## Functional status

- Repository classification: **blueprint-only**. Head contains source documents, docs and `.env.example`; no application code, package manifests, lockfiles, tests or deployment config.
- Product definition and PRD: specified.
- Architecture and stack: specified; Phase 0 repository inspection found no implementation conflicts because no application code exists yet.
- Contract/API/data model/security: specified in project documents.
- Application implementation: not started.
- Tests: no application tests exist. Phase 0 ran read-only RPC/tooling checks only.
- E2E flows: not implemented or demonstrated.

## UI/design status

- Route/UX structure: specified in `PROJECT_SPEC.md`.
- Early skeletal frontend: not implemented or deployed.
- Temporary functional UI: not implemented.
- Design source: operator-supplied reference image, to be committed at `docs/design/reference/`.
- Mockup approval: explicitly waived by the operator. There is no mockup or approval loop.
- Final visual direction: comes directly from the reference image in Phase 7 using Stageshow.
- Reference image status: **missing — operator supply required before Phase 7**.
- Demo-video reference: expected at `docs/demo/reference/` for demo-video production; optional, and absence is recorded rather than replaced.
- Final UI implementation is prohibited until the Phase 5 self-verified functional checkpoint is complete and the reference image is present.

## Documentation/footer status

- Blueprint source documents exist in the repository.
- Repository README/docs will be expanded by implementation phases; source docs, docs index, demo-video spec, autonomous-execution contract and prerequisites manifest are present.
- `/docs` is planned as a real in-app docs destination; not implemented yet.
- Actual public GitHub repository URL is confirmed: `https://github.com/onyebuchidaniel60/Zorq`.
- Private repository or unsuitable public disclosure is not an issue for this public repo; any future change requires a documented alternative/omission recorded in the Decision Log.

## Known issues / risks / blockers

1. Repository is blueprint-only: no application code, package manifests, lockfiles, tests, deployment config or contract exists. Phase 1 must scaffold them.
2. **Hard blocker — Portaldot EVM gas funding:** deployer H160 `0x5fE9C50bd45Ebe0e66eD4547ae43edD4ec26949e` has balance `0x0`. The reviewed public docs describe SS58 test-token distribution, not an SS58-to-H160 mapping. Operator must confirm the official path or fund the H160 address directly.
3. **Hard blocker — Supabase staging:** no project, `DATABASE_URL`, CLI or access token is available.
4. **Hard blocker — Render FL service:** no service, API key or deploy access is available.
5. **Phase 7 blocker — reference image:** `docs/design/reference/` is missing. Do not fetch, generate or substitute one.
6. Portaldot native FL API and ZKP API are not established by the public developer docs reviewed. Do not claim native integration.
7. Confirm that the live V3 testnet accepts the chosen Solidity bytecode/compiler and standard ERC-721 methods before treating deployment as complete.
8. Hackathon deadline surfaced as 6 November 2026, 04:00 UTC / 05:00 WAT; verify official submission page and any revised timeline.
9. This is a synthetic-data technical demonstration, not production data governance/privacy certification.
10. Local environment has Node 24.22.1 only, and `uv` and Docker are not installed. Phase 1 must install/pin Node 22 and `uv`; local Postgres/Docker verification may require host installation.
11. Reference video `docs/demo/reference/` is missing; Phase 5.5 / Phase 10 will proceed using `docs/DEMO_VIDEO.md` alone and record the absence.

## Phase 0 completion report (amended)

```text
Assigned phase/task: Phase 0 (amended) — apply source-document corrections A0–A8, run read-only repository/environment inspection, produce PREREQUISITES.md, present the Prerequisites Manifest.
Commit SHA: fb9e956 (Part A amendments); the Phase 0 inspection report is the commit immediately after this file.
Preview URL (exact): None — Phase 1 has not started.
Deployed commit/deployment ID: Not applicable; no deployment has been created.
Changes visible: Source docs now define autonomous execution, the reference-image/reference-video workflow, demo-video specification, Decision Log and Known Limitations. PREREQUISITES.md is populated with the exact outstanding inputs.
Intentionally incomplete areas: No application code, package manifests, lockfiles, application tests, deployment configuration, contract, preview URL or demo video. Phase 1 is intentionally not started.
Tests (exact commands + actual results): `git status --short --branch` -> `main...origin/main [ahead 1]`; `curl` `eth_chainId` -> `0x190f1ca9` = 420420777; six `eth_blockNumber` samples -> `0x50802` to `0x50807` (advances); `eth_gasPrice` -> `0x55a5`; `eth_getBalance(0x5fE9...949e)` -> `0x0`; `npm view next@16.4.5 version` -> 16.4.5; `npm view hardhat version` -> 3.21.2; `npm view @playwright/test version` -> 1.64.1; `pip index versions flwr` -> 1.42.0 available; `node --version` -> v24.22.1; `python3 --version` -> 3.12.3; `ffmpeg -version` -> 6.1.1; `uv` and `docker` -> not found.
Manual verification: Repository tree, git remote, docs and environment inspected. GitHub repo is public and push-authenticated. Vercel CLI is authenticated but no Zorq project exists. Reference directories are absent. No transaction was sent.
Known issues/blockers: Supabase staging access, Render FL service access, Portaldot H160 gas funding, and the missing reference image are outstanding. Full list above.
Security notes: No secret values were printed or committed. The disposable deployer private key is held outside the repository at `/tmp/opencode/zorq-deployer.json` with mode 0600; only the H160 address is reported. No reference image or video was fetched, generated or substituted.
Design reference image status (supplied / missing / ambiguous): Missing.
Operator approval status (visuals: waived): Waived.
README/docs status: Source docs, docs index, README links, DEMO_VIDEO.md, AUTONOMOUS_EXECUTION.md and PREREQUISITES.md updated/created. No in-app `/docs` route yet.
Documentation footer URL: Not deployed; `/docs` is planned for Phase 1/8.
GitHub URL or documented reason absent: https://github.com/onyebuchidaniel60/Zorq (public, verified).
Decisions logged this phase (D-NNN ids): None.
New Known Limitations this phase: None.
Next single task: Operator completes PREREQUISITES.md and replies `execute`; Phase 1 then starts automatically.
```

## Decision Log

Append-only. One entry per non-trivial decision made by the agent without operator input. Never edit or remove prior entries.

Format: `D-NNN — YYYY-MM-DD — Phase N — short decision title — rationale — files affected`

_Empty at Phase 0._

## Known Limitations

Append-only. One entry per limitation accepted by the agent rather than fixed, including the reason and any user-facing consequence.

Format: `L-NNN — YYYY-MM-DD — Phase N — short title — description — consequence — mitigation-if-any`

_Empty at Phase 0._

## Exact next task

**Phase 0 (amended) — apply the approved source-document corrections A0–A8, run the read-only repository/environment inspection, produce `PREREQUISITES.md`, and present the Prerequisites Manifest as the final section of the Phase 0 report. Do not begin Phase 1 in the same session. Wait for the operator to fill the manifest and reply 'execute'.**
