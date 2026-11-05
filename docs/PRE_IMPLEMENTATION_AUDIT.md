# Zorq — Final Pre-Implementation Audit

**Review date:** 4 November 2026  
**Result:** Product and implementation baseline defined. External platform and deployment facts remain explicit preflight tasks; no application implementation has started.

## 1. Product consistency

- [x] Product is defined around job-specific FL participation authorization, not a generic data marketplace.
- [x] DataLicense binds asset + job + purpose/config commitment + validity period + owner.
- [x] MVP limits data to synthetic demo partitions; no raw data uploads.
- [x] Transfer is disabled; owner issues/revokes; job creator controls job state.
- [x] `maxParticipants` is specified as a lifetime distinct-asset cohort cap; same-asset reissue does not consume another slot.
- [x] Model output usage/ownership is explicitly outside MVP.
- [x] No LLM, payments, escrow, token economics or general marketplace is included.
- [x] Fixed model architecture, training hyperparameters, dataset sizes and round count are specified and hash-bound.

## 2. Architecture consistency

- [x] One EVM contract serves ERC-721 representation and authoritative registry state; no unverified EVM/WASM interop assumption.
- [x] Postgres is a metadata/index/audit mirror, not authorization authority.
- [x] Flower demo adapter is separated behind `FLExecutionProvider`.
- [x] Portaldot-native FL/ZKP/HE are not claimed or faked; future integration needs official API and successful test evidence.
- [x] Coordinator authorization is checked at admission and each round boundary against a single block snapshot.
- [x] Same snapshot allowlist controls both training and aggregation.
- [x] Revoke-after-snapshot semantics are explicit; current round may finish, next round excludes provider.
- [x] RPC or authorization ambiguity causes fail-closed behaviour.

## 3. Data, permissions and privacy

- [x] Owner metadata is private; public job data is role-filtered.
- [x] No raw source dataset is stored or exposed.
- [x] SIWE nonce/session and wallet ownership boundaries are specified.
- [x] Internal FL service API is separate from browser API and token-protected.
- [x] Worker updates and aggregate model are not described as automatically privacy-safe.
- [x] No HIPAA/GDPR/compliance certification or mathematical no-leakage claim.

## 4. Database/API consistency

- [x] Entities/relationships/statuses/indexes are specified in `PROJECT_SPEC.md`.
- [x] Domain APIs and internal service APIs are enumerated.
- [x] Draft-then-chain-confirm process is specified.
- [x] Receipt verification and transaction/event argument checks are specified.
- [x] Unique constraints, idempotency and one-active-run-per-job are specified.
- [x] Chain read uses explicit block number/hash for all license checks within a round.
- [x] Client cannot override on-chain state with a request parameter or DB mirror.

## 5. Security and failure modes

- [x] SIWE replay, CSRF, IDOR, wrong-chain, forged receipt, XSS, SQL injection, secret exposure, internal service spoofing, rate abuse, duplicate requests and race conditions have controls.
- [x] Model updates are schema-validated and size-limited; residual poisoning/leakage risk disclosed.
- [x] No arbitrary code/model/worker URL execution.
- [x] No production secrets/data in preview.
- [x] Smart contract is non-upgradeable and irreversible actions are called out.
- [x] Revocation/pause/deactivation semantics are explicit.

## 6. Frontend/workflow gates

- [x] Phase 1 includes all routes, a basic navigable shell and stable preview deployment.
- [x] Preview is kept updated at accepted phase checkpoints with URL, commit, changes, incomplete areas and test evidence.
- [x] UX structure and interaction behaviour are specified before implementation; final aesthetic is not assumed.
- [x] Phase 5 E2E completion is a hard gate before design.
- [x] Phase 6 records the operator-supplied reference image, its screen/state coverage and any extension; no mockup or approval loop.
- [x] Phase 7 implements the reference image with Stageshow after the Phase 5 self-verified functional checkpoint.
- [x] Phase 8 includes footer/docs/GitHub, routes, real links, metadata/icons, responsive/accessibility and all important UI states.
- [x] No fabricated GitHub or preview URL; private repo exposure requires operator approval.

## 7. Documentation and deployment

- [x] README and docs are part of handoff and implementation acceptance.
- [x] Documentation destination is specified as the real `/docs` page.
- [x] GitHub link is conditional on the actual repository URL and public/approved disclosure.
- [x] Separate Local/Preview/Production environment design specified.
- [x] Production deployment is out of scope for the MVP; testnet only.
- [x] `AI_HANDOFF.md` contains current phase, preview URL, deployed commit, completion/incompletion, test evidence, known issues, design reference status, decisions, known limitations, docs/footer status and one next task.

## 8. Remaining explicit preflight items (not delegated as architecture design)

These are external facts requiring live access or operator credentials; they are not product choices for the coding agent to invent:

1. **Repository state:** actual repo URL/remote, current branch, commit and pre-existing code must be inspected read-only in Phase 0.
2. **Vercel access:** identify/create the actual Vercel project and confirm stable branch preview URL after repository inspection.
3. **Supabase/Render access:** provision dedicated staging DB and protected FL service using secrets stored in the services, not in chat or Git.
4. **Portaldot gas path:** verify the EVM H160 wallet can obtain native testnet gas; native SS58 distribution instructions must not be assumed to fund EVM address automatically.
5. **EVM compatibility:** verify current RPC, chain ID, Solidity deployment, ERC-721 interface and transaction read-back on live V3 testnet.
6. **Explorer URL shape:** verify transaction/contract link patterns before UI uses them.
7. **Native FL/ZKP APIs:** no native integration until official interfaces and a successful test exist.
8. **Hackathon deadline/submission checklist:** re-check the official DoraHacks project page; available reports currently indicate 6 November 2026, 04:00 UTC / 05:00 WAT.
9. **Public GitHub disclosure:** obtain actual repository URL and determine whether it can be public; do not place a guessed URL in the footer.
10. **Support/contact/legal wording:** operator must provide real support destination and obtain appropriate legal review before any production/commercial launch.

## 9. Final audit conclusion

The coding agent is not required to choose the product, MVP, role model, license semantics, contract boundaries, stack, route structure, API shapes, data model, authorization rules or implementation sequence. Those are defined in the handoff files. The agent is allowed to make only low-impact implementation details within these constraints (for example, internal component file naming or a non-breaking helper abstraction).

Where a dependency depends on real external access or current chain behaviour, the agent must execute the specified preflight and report evidence. It must not silently swap services, assume a native Portaldot API, weaken security, invent URLs or bypass the reference-image workflow or test/evidence requirements.
