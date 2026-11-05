# AGENTS.md — Zorq Implementation Rules

This file is a persistent implementation contract for OpenCode/Codex/other coding agents. Read `PROJECT_SPEC.md`, `ARCHITECTURE.md`, and `IMPLEMENTATION_PLAN.md` before touching code. These documents are authoritative. The agent is an implementation executor, not product owner or architect.

## 1. Product and scope

Zorq is programmable authorization infrastructure for federated machine learning. A non-transferable ERC-721 DataLicense binds one data asset to one specific FL job, purpose/configuration commitment, validity interval and owner. The EVM contract is the authoritative source for rights. The MVP uses synthetic data and a Flower demo adapter. It does not handle real health/financial data, uploads, payments, mainnet, LLMs, production ZKP, or claim native Portaldot FL/HE/ZKP integration without verified evidence.

Build only the MVP in `PROJECT_SPEC.md`. Do not add features because they seem attractive. No tokenomics, marketplace, arbitrary model execution, arbitrary worker URL, revenue sharing, production data or invented Portaldot calls.

## 1.1 Execution model — autonomous

- OpenCode executes Phases 1 through 10 end-to-end in one continuous run, without stopping after any phase, checkpoint, functionality gate, or design phase, and without requesting operator approval for any decision.
- Phase completion reports are for the record, not for approval. After writing a phase report, the agent proceeds to the next phase in the same session.
- Prerequisites: at the end of Phase 0 the agent produces an exhaustive Prerequisites Manifest (see `PREREQUISITES.md`) listing every credential, account, access grant, funded address, API key, seed value, external service, and decision the agent requires to complete Phases 1–10 without further contact. The operator supplies all items once. The agent then executes to completion.
- The only legitimate stops after prerequisites are supplied are hard blockers that cannot be worked around: a missing credential that was not on the manifest, a Portaldot testnet outage, or an external service that never becomes available. In these cases the agent stops, states the specific blocker and the exact input or action required, and does not proceed.
- Ambiguous decisions are resolved by choosing the option most consistent with `PROJECT_SPEC.md` and `ARCHITECTURE.md`, logging the decision and rationale in `AI_HANDOFF.md`'s Decision Log, and continuing. Ambiguity is not a stop condition.
- Any decision that would change contract semantics, license ownership model, data model for user data, or chain target must be resolved without changing them. If the source docs truly cannot support the required functionality otherwise, the agent logs the conflict in `AI_HANDOFF.md`'s Known Limitations section, implements the closest behaviour-consistent alternative, and continues. It does not stop for approval.

## 2. Fixed architecture

- Next.js App Router + TypeScript for frontend and server API.
- Tailwind CSS 4; temporary simple styling until the Phase 7 operator-supplied reference-image implementation.
- wagmi/viem for wallet interactions; SIWE + signed HttpOnly cookie for application sessions.
- Solidity `ZorqRegistry` on Portaldot V3 EVM testnet; single contract combines ERC-721 and authoritative registry; OpenZeppelin Contracts 5.x; Hardhat 3.
- Supabase PostgreSQL + Drizzle/Postgres.js; DB server-side only; chain state is authority.
- Python 3.12 + FastAPI + Flower + PyTorch CPU for synthetic FL demonstration.
- Vercel Preview for web; Render Docker service for FL; separate staging/production environments.
- No Redis, queue platform, object storage, payment service, LLM, or ZKP provider in MVP.
- UI polish skill: stageshow (`npx skills add benjitaylor/skills --skill stageshow`), used only in Phase 7 against the operator-supplied reference image.
- Demo video: Playwright-driven capture + free Google AI Studio text-to-speech + ffmpeg. No human voiceover, no named presenter.

Do not change chain, chain ID, contract architecture, auth, DB, FL adapter, runtime, hosting topology, permissions, model preset or license semantics. Deviations are permitted only under §1.1 and the architecture-freeze rule in `ARCHITECTURE.md`, and must be logged in `AI_HANDOFF.md`'s Decision Log. Technical uncertainty is a reason to report a blocker, not silently substitute an architecture.

## 3. Critical business rules

1. Every license is bound to exactly one asset and one job.
2. Purpose and model-configuration hashes are fixed for a published job.
3. Only the data asset owner can issue or revoke its license.
4. License NFT is non-transferable; approvals and transfers revert.
5. License validity uses `[validFrom, validUntil)` and on-chain `block.timestamp`.
6. Only the job creator can pause/resume/close the job. Closed is terminal.
7. Contract state, not Postgres mirror or frontend state, decides authorization.
8. Authorization snapshot reads all candidate licenses at one confirmed block number/hash. The same allowlist governs that round's training and aggregation.
9. Revoke after a round snapshot does not retroactively cancel that already admitted round; next round must check a fresh snapshot and exclude it.
10. If RPC/auth snapshot service fails or state is ambiguous, fail closed. Never run a round using stale or cached allowlist.
11. MVP supports two to five synthetic assets/clients, the fixed `synthetic-binary-classifier-v1` model, three rounds and one active run per job. Require two distinct authorized asset IDs. Use exactly the data-generation, model and hyperparameter values in `PROJECT_SPEC.md`; do not tune them.
12. `maxParticipants` is a lifetime distinct-asset cohort cap per job. Revocation/expiry does not free a slot for a different asset; the same asset may be reissued without consuming another slot.
13. The coordinator may accept updates only from the allowlist for that same round/snapshot. Validate shapes, lengths, numeric finiteness and maximum payload size.
14. Raw data is never uploaded to Zorq or stored on-chain. Synthetic demo partitions only.
15. FL is not automatically privacy preserving against update leakage, poisoning or inference. Do not claim otherwise.
16. No real payments or mainnet transactions. Wallet pays testnet gas for user actions.

## 4. Portaldot and evidence rules

- Chain ID: `420420777`. RPC/network details are in `ARCHITECTURE.md`; validate them live during Phase 0/1 before deployment.
- Test-token funding instructions have specified a native SS58 address, not EVM `0x`; confirm the official method to fund the EVM H160 account before assuming the wallet can deploy/transact.
- Portaldot's public material advertises FL/ZKP/HE but the reviewed public developer documentation does not provide a developer-ready FL enrollment/authorization API or a Zorq proof API. Use `FlowerDemoProvider`; do not fabricate an API or display simulated proof verification as real.
- Native Portaldot FL/ZKP integration is future work until an official interface, credentials/access, sample and successful on-testnet evidence exist.
- Never expose private key, seed phrase, auth secrets, database URL, RPC credentials or FL service token in logs, screenshots, output or repo.

## 5. Coding constraints

- TypeScript strict mode. Avoid `any`; use typed domain interfaces and Zod validation.
- Do not install or invoke Stageshow before Phase 7. It is an execution-quality skill for an already-chosen visual direction, not a substitute for functional implementation.
- Demo-video scripts live in `scripts/demo-video/`, must be idempotent and re-runnable, must not use paid TTS APIs, cloned voices, or real personal data.
- Demo-video reference inputs are operator-supplied and committed under `docs/demo/reference/`. Do not fetch, scrape, download, or generate a reference video. Do not copy footage, music, logos, presenter likeness, or verbatim narration from it. If no reference video is present when Phase 5.5 or Phase 10 begins, proceed using `docs/DEMO_VIDEO.md` alone and note the absence in the phase report.
- Keep domain rules in server-side services, not React components.
- All API input is validated server-side. Do not trust wallet address, tx hash, job ID, asset ID or status supplied by browser without verification.
- Use parameterized SQL/Drizzle. Use DB transactions for multi-row state transitions.
- Avoid cross-service direct database access. Python FL service calls internal API only; it does not connect to Supabase.
- Keep internal FL endpoints inaccessible from browser and protected by high-entropy service token + TLS.
- No private keys or custodial signing. Wallet signs transactions in the user's wallet.
- Do not store secrets in code, `.env.example`, client bundles or committed deployment configs.
- Use stable external IDs where required; use UUID primary keys for off-chain rows and opaque bytes32 IDs on-chain.
- Use idempotency keys and unique constraints for draft/confirmation/run-start flows.
- Log structured events with request IDs; redact personal metadata, signatures, nonce values, auth cookies, data labels and service tokens.
- No unapproved dependency or infrastructure additions. Pin dependencies and commit lockfiles.
- Respect repository conventions after Phase 0 inspection. If the repo contradicts the frozen architecture, stop and report instead of rewriting indiscriminately.

## 6. Frontend sequence and preview deployment (mandatory)

- Phase 1 must produce a navigable skeletal frontend with the agreed routes, primary navigation, responsive structure and clearly labelled placeholders. Deploy it early to a stable Vercel Preview URL and report the exact URL plus deployed commit SHA.
- Do not postpone all frontend work until backend completion. Do not make unfinished controls look functional.
- Use synthetic test data, Portaldot testnet and staging services only. No production dataset, production secret, real payment or irreversible production action may be exposed by preview.
- Keep the same branch-specific preview URL current after each verified phase checkpoint. Record deployed commit, visible changes, incomplete parts, tests/evidence, blockers and known issues in `AI_HANDOFF.md`.
- If preview deployment is blocked, state exact blocker and provide local evidence; never claim it is deployed.

## 7. Functionality gate before final design

- Complete and demonstrate all critical flows on the deployed preview before final visual polish: wallet login, register asset, create job, issue license, start three-round FL run, round-snapshot authorization, revoke between rounds, exclusion at next round, job pause/close and failure states.
- Run contract/unit/integration/E2E tests and show evidence. A screenshot or agent assertion alone is insufficient.
- Use one plain consistent temporary visual system while functionality is being implemented.
- Do not begin final visual styling until the Phase 5 self-verified functional checkpoint is complete.

## 8. Design reference and implementation rule

- The operator supplies reference image(s) at Phase 6 handoff, committed under `docs/design/reference/`.
- The agent implements the UI directly from those images in Phase 7 using the Stageshow skill.
- There is no mockup production and no approval loop; the operator has explicitly waived it.
- The agent records the reference and its adaptations in `docs/DESIGN_DECISIONS.md`.
- If the reference image is missing when Phase 7 begins, or if implementing it would require a product-behaviour, API, data-model, permission or architecture change, STOP and report the specific blocker under AGENTS.md §1.1.
- Visual work must not change behaviour.

## 9. Documentation and complete frontend obligations

- Maintain a useful `README.md` and project-specific `docs/` covering setup, configuration, testing, deployment, troubleshooting, API, architecture, user/operator guidance and security/privacy.
- Complete all agreed routes, navigation and footer; loading/empty/validation/success/error/permission-denied/not-found states; responsive layouts; semantic structure, labels, keyboard access, focus visibility and accessible feedback; page titles/meta, favicon/app icon and applicable social metadata.
- Home/footer must link to a real, reachable Documentation destination and actual GitHub repository when suitable. Never invent or guess URLs. The intended repo URL must be read from the actual git remote and verified. If private or public disclosure is inappropriate, document why and log the alternate link/omission decision in `AI_HANDOFF.md`'s Decision Log. Do not expose private source code.
- `/docs` is the intended product documentation route; it must be real and useful, not a placeholder. Support/privacy/terms pages must contain accurate project-specific information; do not fabricate contact details or legal claims.
- No dead links, `href="#"`, inert buttons, unexplained placeholders or unverified route claims in final UI.
- Verify footer/docs/GitHub destinations on deployed preview.

## 10. Test, review and Git rules

For every phase: implement → test → inspect → fix → commit → checkpoint → continue to the next phase. Do not stop after any phase. Do not request approval.

- Run relevant unit, contract, integration, E2E and build/type/lint checks.
- Test on the deployed preview where feasible. Never claim tests passed unless commands ran and output supports the claim.
- Review security, ownership isolation, race conditions, idempotency, retry and state transitions.
- Use small conventional commits. Do not rewrite history or force push unless explicitly asked.
- Proceed to the next phase automatically after each checkpoint commit, unless a blocker defined in §1.1 is encountered.
- Do not modify unrelated files.
- Do not create a large one-shot implementation across multiple phases.

## 11. Handling ambiguity and failures

- If a requirement is unclear or an implementation would alter the architecture or product semantics: choose the option most consistent with `PROJECT_SPEC.md` and `ARCHITECTURE.md`, log the decision in `AI_HANDOFF.md`'s Decision Log, and continue.
- If a Portaldot API is undocumented: use the `FlowerDemoProvider` adapter as specified. Do not guess endpoints or fabricate integrations. Log the gap as a Known Limitation and continue.
- If a dependency or service is unavailable: implement the specified mock or local fixture where the specification permits, label it honestly in the UI and docs, and continue.
- If a test fails: reproduce, diagnose, and fix. If the failure cannot be fixed within the phase's time budget after at least three distinct fix attempts, log it in Known Limitations with full detail, disable the specific failing assertion only if it is a documented external-dependency failure (never a business-rule failure), and continue. Do not weaken business-rule assertions.
- Never claim a test passed that did not pass.
- The only stop conditions are the hard blockers defined in §1.1.

## 12. Required phase completion report

Update `AI_HANDOFF.md` and provide:

```text
Assigned phase/task:
Commit SHA:
Preview URL (exact):
Deployed commit/deployment ID:
Changes visible:
Intentionally incomplete areas:
Tests (exact commands + actual results):
Manual verification:
Known issues/blockers:
Security notes:
Design reference image status (supplied / missing / ambiguous):
Operator approval status (visuals: waived):
README/docs status:
Documentation footer URL:
GitHub URL or documented reason absent:
Decisions logged this phase (D-NNN ids):
New Known Limitations this phase:
Next single task:
```

Commit `AI_HANDOFF.md` and the checkpoint commit, then immediately begin the next phase. Do not wait for the operator.
