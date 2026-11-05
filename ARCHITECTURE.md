# Zorq — System Architecture & Technical Design

**Version:** 1.0  
**Prepared:** 4 November 2026  
**Status:** Proposed architecture for operator approval; application code has not been started.  
**Authority:** `PROJECT_SPEC.md` defines product behaviour. This document fixes the technical design for the MVP.

---

## 1. Architecture decisions at a glance

| Area | Decision |
|---|---|
| Application shape | Small monorepo with Next.js web/API app, one Python FL service and one Solidity contract package |
| Frontend / backend | Next.js App Router, TypeScript, Route Handlers; one application backend, no separate Node microservice |
| Wallet | wagmi + viem, injected EVM wallet first; SIWE for off-chain session |
| Chain | Portaldot V3 EVM testnet, chain ID `420420777` |
| Contract | One Solidity `ZorqRegistry` contract; ERC-721 DataLicense plus asset/job/license registry in the same contract |
| License model | Soulbound/non-transferable ERC-721; chain state is authoritative |
| Smart-contract tooling | Hardhat 3, OpenZeppelin Contracts 5.x, Solidity 0.8.24-compatible compiler |
| Off-chain database | Supabase-managed PostgreSQL, Drizzle ORM and Postgres.js; transaction-pooler mode with prepared statements disabled when used |
| Auth/session | SIWE + short-lived signed HttpOnly cookie with `jose`; no Supabase Auth dependency |
| FL engine | Flower with fixed FedAvg synthetic binary-classification task; custom server strategy calls Zorq authorization snapshot API each round |
| FL service | Python 3.12, FastAPI, Flower 1.42.x, PyTorch CPU; deployed as a Docker service on Render |
| Web hosting | Vercel; stable branch preview URL from Phase 1, then production only after explicit release approval |
| Storage | No raw dataset or file storage. Model updates are transient; only aggregate metrics/model hash are persisted |
| Payments | None. Users pay their own Portaldot testnet transaction gas |
| AI/LLM | None. FL model training is not an LLM feature |
| Monitoring | Vercel/Render platform logs, health/readiness endpoints, sanitized application audit events; no extra observability vendor in MVP |

The architecture intentionally avoids a separate ink! registry contract. The earlier hybrid EVM-NFT/WASM-registry concept is retained as two logical responsibilities but implemented inside one EVM contract because cross-runtime contract invocation was not established in the public V3 developer material reviewed.

## 2. Portaldot integration assessment

### 2.1 Network values to configure

Current Portaldot V3 developer announcements identify the following testnet references:

| Setting | Value | Use |
|---|---|---|
| Network name | Portaldot V3 Testnet | Wallet label |
| EVM JSON-RPC | `https://test-evm-rpc-v3.portaldot.dev` | Solidity contract deploy/calls and backend reads |
| Chain ID | `420420777` | wagmi chain, SIWE chain ID and server receipt validation |
| Substrate WebSocket | `wss://test-node-v3.portaldot.dev` | Not required for MVP; support/preflight only |
| Testnet explorer | `https://scanner-testnet-v3.portaldot.dev/` | Transaction/contract links after checking explorer route behaviour |
| Native token | Testnet POT / tPOTv3 naming appears in network communications | Wallet gas; confirm actual EVM account funding path |

**Mandatory Phase 1 preflight:** call `eth_chainId`, `eth_blockNumber`, `eth_getBalance`, `eth_call`, estimate gas, and perform a tiny test transaction using an operator-controlled test wallet. Confirm the EVM wallet can actually obtain native testnet gas. Portaldot's developer announcement instructed participants to submit a native SS58 address beginning with `5` for test-token distribution and explicitly warned not to submit an EVM `0x` address. Do not assume that funding a native SS58 address automatically funds the H160 EVM address used by this DApp. Ask Portaldot support for the official mapping/funding procedure if needed. Never submit a seed phrase or private key.

### 2.2 What is documented versus not verified

**Documented/advertised:** Portaldot V3 is presented as supporting EVM and WASM execution and ERC-20/ERC-721 token standards. Portaldot's older developer overview advertises ZKP, homomorphic encryption and a built-in federated-learning framework.

**Not established by the public developer documentation reviewed:** an externally callable API for creating native FL jobs, enrolling participants, attaching third-party authorization hooks, running native training rounds, generating/verifying Zorq-specific ZK proofs, or configuring HE operations. The older developer docs include general feature descriptions and standard Substrate/ink! interfaces, not a complete developer API for those services.

**Architecture consequence:**

- MVP contract and wallet integration use the documented V3 EVM surface.
- MVP FL execution uses Flower as a clearly labelled demonstration adapter.
- No Portaldot-native FL, ZKP or HE integration claim is made until a real supported API is obtained and exercised.
- Define an `FLExecutionProvider` boundary so a future `PortaldotNativeFLProvider` can replace the Flower demo provider without changing the product's DataLicense logic.
- Do not build fake ZKP screens or simulated proof indicators that could be mistaken for a real Portaldot proof.

### 2.3 Portaldot acceptance evidence

The MVP is not considered Portaldot-integrated merely because the UI displays the network name. Evidence must include:

1. Correct `eth_chainId` result (`420420777`).
2. Deployed `ZorqRegistry` contract address and deployment transaction hash.
3. A successful asset/job/license state-changing transaction from a user wallet.
4. Transaction gas paid using the network's native testnet gas asset.
5. Contract read proving a valid DataLicense is authorized and a revoked/expired one is denied.
6. Explorer links to the deployment and at least one transaction, verified to resolve.

---

## 3. High-level system architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│ Browser                                                            │
│ Next.js UI · wagmi wallet · SIWE signing · route navigation       │
└───────────────┬───────────────────────────────────┬───────────────┘
                │ HTTPS / session cookie            │ Wallet-signed tx
                ▼                                   ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ Next.js Route Handlers       │       │ Portaldot V3 EVM testnet     │
│ Auth · domain API · policy   │◄─────►│ ZorqRegistry Solidity        │
│ receipt verifier · run API  │ reads │ ERC-721 + asset/job/license  │
└───────────┬──────────────┬───┘       │ registry in one contract     │
            │              │           └──────────────────────────────┘
            │              │
            ▼              ▼
┌───────────────────┐   ┌──────────────────────────────────────────┐
│ Supabase Postgres │   │ Python FL service (Render Docker)         │
│ Drizzle ORM       │◄──┤ FastAPI · Flower · custom FedAvg strategy │
│ off-chain index   │   │ Internal service token                     │
└───────────────────┘   └─────────────────┬────────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────────┐
                              │ Flower simulated clients   │
                              │ 2–5 synthetic partitions   │
                              │ Local train -> model delta │
                              └────────────────────────────┘
```

### Trust boundaries

1. **Wallet boundary:** only the wallet signs its on-chain actions. The application never receives a private key.
2. **Chain boundary:** the contract is authoritative for asset owner, job owner/state and license status.
3. **Backend boundary:** the Next.js API handles authenticated metadata, transaction verification and authorization snapshots.
4. **FL service boundary:** the Python coordinator is trusted to obey the allowlist returned by the backend. It is a trust boundary, not a cryptographically forced property of the blockchain.
5. **Worker boundary:** MVP clients are simulated Flower clients using synthetic partitions. This is not yet an independently operated enterprise data node.
6. **Database boundary:** Postgres holds metadata and mirrors; it cannot grant a license if the contract denies it.

## 4. Technology stack

### 4.1 Web app

- **Next.js 16.4.x (App Router), TypeScript, React version supported by the selected Next.js release.** Next.js 16.4.5 was the latest stable patch surfaced in the release check on 4 November 2026. Pin the exact tested patch in `package-lock.json`; do not use canary builds.
- **Tailwind CSS 4** for temporary functional styling and later approved design tokens.
- **Radix UI primitives** for accessible dialogs, menus and form interactions; final component styling remains operator-approved in Phase 6.
- **wagmi v3 + viem 2.x + @tanstack/react-query** for wallet connection, chain switching, reads and user-signed transactions.
- **Zod** for request, response and form validation.
- **SIWE (`siwe`) + `jose`** for wallet login and signed session cookie.

Why: Next.js provides the frontend and a single server-side route/API layer. wagmi/viem are wallet-aware and avoid a custom wallet RPC abstraction. Zod provides a shared deterministic validation layer. A separate NestJS/Express backend is unnecessary for this MVP.

### 4.2 Smart contracts

- **Solidity 0.8.24-compatible compiler** (pin a supported patch in Hardhat config).
- **OpenZeppelin Contracts 5.x** for ERC-721 and Ownable2Step base implementations.
- **Hardhat 3.x** for compilation, local EVM testing, TypeScript integration tests and deployment scripts.

Why: Portaldot V3 advertises EVM execution and ERC-721 support. Solidity gives the project a standard EVM implementation path without adding an unverified EVM/WASM bridge. OpenZeppelin reduces custom standard code. Hardhat 3 is the current stable Hardhat line and supports TypeScript tests and Solidity tests. No proxy/upgradeability framework is included.

### 4.3 Database

- **Supabase-managed PostgreSQL** as a managed relational database.
- **Drizzle ORM + Postgres.js** for strongly typed schema and SQL access.
- Use Supabase shared transaction pooler for serverless Next.js functions; set `prepare: false` for Postgres.js when using transaction mode. Use a separate local Postgres container for local development/tests.
- Do not use Supabase browser Data API or Supabase Auth in the MVP. The browser talks only to Next.js APIs; service-role DB connection remains server-side.

Why: The data is relational and requires unique constraints/transactions; Postgres is appropriate. Drizzle enables parameterized typed queries. One managed Postgres service is enough; no Redis, object storage, message broker or search cluster is needed.

### 4.4 FL service

- **Python 3.12**.
- **Flower 1.42.x** for the federated-learning application and strategy abstraction.
- **PyTorch CPU** for one small binary-classification model.
- **FastAPI + Pydantic** for internal start/status/event APIs.
- **uv** for Python package and environment management.
- **Docker** for repeatable Render deployment.

Why: Flower provides `ServerApp`/`ClientApp`, FedAvg and custom strategy extension points. A small PyTorch model makes the demo an actual federated training workflow, not a static animation. GPU, Ray cluster, Kubernetes, external model registry and separate queue are unnecessary for 2–5 synthetic clients.

### 4.5 Hosting

- **Vercel:** Next.js web app, stable branch-specific preview deployment and production environment.
- **Render:** Python FL service, Docker runtime, one active simulation at a time.
- **Supabase:** separate development/staging database and production database if production is later approved.
- **Hardhat local network:** deterministic local contract tests. Portaldot testnet used for testnet smoke/deployment.

Do not share production DB or production secrets with a preview deployment. Preview uses synthetic seed data and testnet only. Vercel supports separate Local/Preview/Production environments and branch-specific preview URLs; use the stable branch URL as the operator's ongoing preview.

### 4.6 Version and runtime policy

- Node.js 22.13+ (Hardhat 3 prerequisite); pin a currently supported Node 22 patch in `.nvmrc` or `.node-version`.
- npm workspaces; commit `package-lock.json`.
- Python 3.12; `uv.lock` committed.
- Pin OpenZeppelin major 5.x, Flower 1.42.x, wagmi 3.x and viem 2.x. Lock exact patch/minor versions during Phase 1 and avoid automatic major upgrades.
- Dependabot/Renovate is not required for hackathon MVP; perform manual dependency/security review before release.
- Windows PowerShell is supported for local development. Use `npm.cmd` from PowerShell when script execution policy blocks `npm.ps1`; inspect `$LASTEXITCODE` after commands. The coding agent must not rely on Unix-only shell syntax for operator instructions.

---

## 5. Smart contract architecture

### 5.1 Contract decision

Deploy one non-upgradeable Solidity contract:

`ZorqRegistry is ERC721, Ownable2Step`

The ERC-721 token and registry are one deployed contract. This avoids unverified EVM-to-WASM call assumptions and ensures `checkAuthorization` reads the exact lifecycle state that mints/revokes the token.

No payment/escrow functionality, no external contract calls, no token transfers and no proxy.

### 5.2 Core structures

```text
DataAsset {
  address owner;
  bytes32 metadataCommitment;
  bool active;
  uint64 registeredAt;
}

TrainingJob {
  address creator;
  bytes32 purposeHash;
  bytes32 modelConfigHash;
  uint64 startsAt;
  uint64 endsAt;
  uint8 maxParticipants;
  uint8 distinctAssetCount; // lifetime cohort count; bounded at 5
  JobState state; // OPEN, PAUSED, CLOSED
}
mapping(bytes32 jobId => mapping(bytes32 assetId => bool)) jobAssetBound;

DataLicense {
  bytes32 assetId;
  bytes32 jobId;
  uint64 validFrom;
  uint64 validUntil; // exclusive
  uint32 revision;
  bool revoked;
}
```

### 5.3 Function contract

The following external function surface is fixed for the MVP. Names may be adjusted only for Solidity style/compatibility without changing semantics.

| Function | Access | Behaviour |
|---|---|---|
| `registerAsset(bytes32 assetId, bytes32 metadataCommitment)` | Any wallet, unless new issuance paused | Register unique opaque asset and set `msg.sender` as owner |
| `deactivateAsset(bytes32 assetId)` | Asset owner | Permanently deactivate; cannot be reactivated in MVP |
| `createJob(bytes32 jobId, bytes32 purposeHash, bytes32 modelConfigHash, uint64 startsAt, uint64 endsAt, uint8 maxParticipants)` | Any wallet, unless new issuance paused | Register job owned by `msg.sender`, initially OPEN; require maxParticipants in [2,5] |
| `setJobState(bytes32 jobId, JobState nextState)` | Job creator | Open/pause/resume/close with fixed transition table |
| `issueLicense(bytes32 assetId, bytes32 jobId, uint64 validFrom, uint64 validUntil)` | Asset owner | Create a new revision and mint non-transferable ERC-721 to asset owner |
| `revokeLicense(uint256 tokenId)` | Asset owner | Mark license revoked; revocation always available even during emergency creation pause |
| `checkAuthorization(uint256 tokenId, address participant, bytes32 jobId)` | View | Return allow/deny plus deterministic reason code |
| `getAsset(bytes32 assetId)` | View | Return public owner/commitment/active fields |
| `getJob(bytes32 jobId)` | View | Return public purpose/config commitments, window, state and creator |
| `getLicense(uint256 tokenId)` | View | Return asset/job binding, dates, revision and revoked flag |
| `latestLicenseId(bytes32 assetId, bytes32 jobId)` | View | Return latest token ID/revision pointer |
| `getJobParticipantCount(bytes32 jobId)` | View | Return lifetime distinct-asset cohort count and configured maximum |
| `setCreationPaused(bool paused)` | Contract owner | Emergency pause for asset registration, job creation and license issuance; does not disable revocation |

### 5.4 Contract invariants

1. Asset IDs and job IDs are non-zero and unique.
2. Owner of an asset/job is the caller that registered it; no ownership transfer function exists.
3. `issueLicense` requires `msg.sender == asset.owner`. On the first license for an asset/job pair, set `jobAssetBound[jobId][assetId] = true` and increment `TrainingJob.distinctAssetCount`; require `distinctAssetCount < maxParticipants` before increment. Re-issuance for the same pair does not increment.
4. License is minted to the asset owner.
5. Job must be OPEN and current time within job window at issue time.
6. License validity interval must be a subset of the job interval and use `[validFrom, validUntil)` semantics.
7. `purposeHash` and `modelConfigHash` are immutable per job and indirectly bound to the license by `jobId`.
8. One unexpired, unrevoked license revision per asset/job pair at a time.
9. A later revision may be created after the preceding latest revision is revoked or expired; old token/history remains. The same asset/job pairing retains its original participant slot.
10. `maxParticipants` is a lifetime distinct-asset cohort cap for the job. Revocation/expiry does not release a slot for a different asset; the same asset may be re-issued.
11. Only asset owner can revoke; only job creator can change job state.
12. Revocation is terminal for that token.
13. ERC-721 token is soulbound: transfers and approval flows revert. It is not a tradable credential.
14. Contract owner cannot mint/revoke for users or edit their asset/job/license fields.
15. Emergency creation pause cannot prevent license revocation.
16. All time comparisons use `block.timestamp`, not the browser or application server clock.
17. `checkAuthorization` checks token existence, token owner/participant equality, asset owner, asset active, exact job binding, not revoked, job OPEN, job window and license window.

### 5.5 Authorization reason codes

The view function returns one reason code:

`AUTHORIZED`, `UNKNOWN_LICENSE`, `WRONG_PARTICIPANT`, `WRONG_JOB`, `REVOKED`, `ASSET_INACTIVE`, `JOB_NOT_OPEN`, `NOT_YET_VALID`, `LICENSE_EXPIRED`, `JOB_NOT_STARTED`, `JOB_EXPIRED`.

The backend stores the returned code, not a guessed interpretation.

### 5.6 Events

- `AssetRegistered(bytes32 indexed assetId, address indexed owner, bytes32 metadataCommitment)`
- `AssetDeactivated(bytes32 indexed assetId, address indexed owner)`
- `JobCreated(bytes32 indexed jobId, address indexed creator, bytes32 purposeHash, bytes32 modelConfigHash, uint64 startsAt, uint64 endsAt)`
- `JobStateChanged(bytes32 indexed jobId, address indexed creator, JobState state)`
- `LicenseIssued(uint256 indexed tokenId, bytes32 indexed assetId, bytes32 indexed jobId, address owner, uint32 revision, uint64 validFrom, uint64 validUntil)`
- `LicenseRevoked(uint256 indexed tokenId, bytes32 indexed assetId, bytes32 indexed jobId, address owner)`
- `CreationPauseChanged(bool paused)`

### 5.7 Contract implementation notes

- Use OpenZeppelin Contracts 5.x ERC721 and Ownable2Step.
- Constructor must set initial owner explicitly as required by OpenZeppelin 5.x.
- Override ERC-721 `_update` to reject non-mint/non-burn transfers; no burn function is exposed. Override approvals to revert so the UI cannot suggest approvals work.
- Do not add ERC-721 Enumerable (unnecessary state/gas); use events and API index for UI lists.
- Do not store private dataset metadata or raw data references on chain.
- Use random 32-byte asset IDs and salted metadata commitments. Canonicalize `{assetId, ownerAddressLowercase, displayName, description, demoPartitionId}` as UTF-8 JSON with lexicographically sorted keys and no insignificant whitespace. Compute `metadataDigest = keccak256(canonicalJson)` and `metadataCommitment = keccak256(abi.encode(metadataDigest, salt))` with a cryptographically random 32-byte salt retained server-side. A hash commitment is integrity evidence, not encryption.
- `purposeHash` is a hash of the public purpose string after Unicode NFKC normalization, line-ending normalization, whitespace collapse and trim (preserve case). `modelConfigHash` is Keccak-256 over canonical JSON with lexicographically sorted keys and the fixed model preset/config values defined in `PROJECT_SPEC.md`. The same canonicalization function is shared by draft creation, tests and transaction preparation.
- Test with fuzz/property tests for timestamp boundaries and caller authorization.
- Verify target chain supports deployed Solidity bytecode and standard ERC-721 calls before completing the contract.

---

## 6. Application services and responsibilities

### 6.1 Next.js application

Responsibilities:

- Public and authenticated routes.
- Wallet connect and chain checks.
- SIWE nonce/message/verification/session.
- Zod request validation.
- Asset/job/license drafts and transaction confirmation.
- On-chain contract reads for UI and backend authorization.
- Postgres metadata/audit transactions.
- Authorization snapshots for the FL service.
- Run start/status/round endpoints.
- In-app docs/privacy/terms/support pages.

Must not:

- store a user's private key;
- upload or receive a real dataset;
- perform model computation;
- trust client-provided transaction data without verifying receipt/logs;
- authorize a training run from database status alone.

### 6.2 Python FL service

Responsibilities:

- Internal FastAPI API for start/status and callbacks.
- Launch a fixed Flower App / local simulation using `synthetic-binary-classifier-v1`: 8 numeric inputs, `Linear(8,1)`, `BCEWithLogitsLoss`, SGD `lr=0.05`, batch size 32, two local epochs, three server rounds, FedAvg weighted by local sample count, 256 synthetic samples per simulated participant and 512 fixed synthetic evaluation examples. Generate eight-dimensional standard-normal features; binary labels come from a fixed sigmoid teacher with weights `[0.6,-0.8,0.4,0.2,-0.3,0.7,-0.5,0.1]` and deterministic partition bias `(partitionId - 2) * 0.15`; evaluation uses zero bias. Seed with `DEMO_DATA_SEED` plus partition ID. All authorized demo clients participate each round; no random client sampling. The final model hash is SHA-256 over sorted state-dict keys and each tensor's dtype, shape and contiguous CPU bytes.
- Custom FedAvg strategy that requests a Zorq authorization snapshot before each round.
- Only send training instructions to the snapshot allowlist.
- Aggregate only updates from the exact round allowlist and validate tensor payloads.
- Send progress/aggregate metrics/model hash/failure state to Next.js internal endpoints.

Must not:

- accept arbitrary job code, arbitrary model files, arbitrary user worker endpoints or public run-start requests;
- access Supabase directly in MVP;
- hold wallet keys or deploy/change contracts;
- skip authorization when the internal API is unavailable;
- retain raw data/model updates after a run.

### 6.3 `FLExecutionProvider` abstraction

Application domain interface:

```text
FLExecutionProvider
  health() -> provider health
  startRun(runSpecification) -> providerRunId
```

MVP implementation: `FlowerDemoProvider`. The only production-like alternative planned is `PortaldotNativeFLProvider`, which cannot be implemented until Portaldot provides a documented interface and successful sample execution. The agent must not invent that API.

### 6.4 Authorization provider

Next.js backend owns an `OnChainAuthorizationService` that calls `ZorqRegistry.checkAuthorization` at an explicit block number. Python service never makes an authorization decision from its own database. It receives a snapshot allowlist from Next.js.

No `ZKP` provider is implemented in MVP. A future `AuthorizationProofProvider` must be introduced only when a real supported proving/verifying workflow exists.

---

## 7. Authorization and FL execution sequence

### 7.1 License issue

```text
Provider browser
  -> POST /api/licenses/drafts
  -> backend validates asset owner, job and time window
  <- exact issueLicense transaction args
  -> wallet signs issueLicense(...) on Portaldot
  -> frontend waits for receipt
  -> POST /api/licenses/{id}/confirm {txHash}
  -> backend verifies sender + contract + event + args + confirmations
  -> DB transaction: license + chain_transactions + audit_events
  <- active license token ID
```

### 7.2 Run start and round checkpoints

```text
Job creator
  -> POST /api/jobs/{jobId}/runs [Idempotency-Key]
  -> backend checks creator + job + FL health + no active run
  -> create queued run
  -> call FlowerDemoProvider.startRun()

Flower Server Strategy — before round N
  -> POST /api/internal/runs/{runId}/authorization-snapshot {roundNumber:N}
  -> backend selects one confirmed chain block B
  -> backend reads job + every candidate license at block B
  -> backend persists block number/hash + allow/deny decisions
  <- allowed participant IDs + denials + block evidence

Flower Strategy
  -> configure_fit for allowed clients only
  -> clients train locally on their synthetic partitions
  -> validate received updates against round allowlist
  -> aggregate allowed updates only
  -> POST internal progress event
  -> next round requests a new snapshot

After final round
  -> Flower calculates final model hash and aggregate metrics
  -> POST /api/internal/runs/{runId}/complete
  -> DB transaction marks run completed and writes audit event
  -> dashboard shows run evidence
```

### 7.3 Round consistency rule

The backend chooses one block for each round. Every candidate license check for that round must use exactly that block number. The stored block hash is part of the result evidence. If the RPC cannot serve a consistent state for that block, the snapshot fails and no training starts.

Use `PORTALDOT_CONFIRMATION_DEPTH` to select a stable block (`latest - depth`) unless the current RPC has an explicitly tested `finalized` tag. The preflight determines the configured depth; do not assume a Substrate finality tag is mapped correctly to the EVM RPC. The snapshot block's timestamp determines validity, not server time.

### 7.4 Mid-round revocation

The round snapshot is a deliberate policy cut-off. Revocation mined after snapshot B is considered effective for the next snapshot B2. The current round may finish and aggregate if all other checks pass. This avoids ambiguous per-client block reads mid-round and makes the rule demonstrable. The UI must show the snapshot block so a reviewer can understand why a just-revoked license was still included in the currently running round.

---

## 8. Database and API architecture

### 8.1 Database authority model

- Chain owns: on-chain asset/job ownership, job state, license token ownership, license binding, validity and revocation.
- Postgres owns: private asset display metadata, public job description text, SIWE nonce lifecycle, application activity/audit records, run/round records and authorization snapshot evidence.
- Postgres status is a mirror/index, not an authorization source.
- All writes from a wallet transaction are confirmed by receipt and event before DB activation.

### 8.2 Database connection

- Web server connects using `DATABASE_URL` in server-only environment.
- For Supabase shared transaction pooler, use Postgres.js with `prepare: false`.
- Use one connection per warm serverless instance, low pool size (start at 1) and avoid creating a new pool per request.
- Migrations run from a developer/CI environment using a direct/session connection, not from a preview request handler.
- No Supabase service-role key is placed in browser code.

### 8.3 API shape

API route details, fields and errors are in `PROJECT_SPEC.md` §8. Keep one versionless `/api` namespace for MVP. If contracts/API change later, update documentation and tests together; do not add a generic GraphQL server or public RPC proxy.

### 8.4 Internal service API

- Python FL service talks only to Next.js internal routes.
- Internal token via HTTP `Authorization: Bearer ...` over HTTPS.
- Next routes verify token with constant-time comparison and strict JSON schemas.
- Do not allow browser CORS origins for internal paths.
- Configure request body size, timeouts and maximum rounds/participants.
- One active FL simulation service run at a time.

---

## 9. Authentication, sessions and authorization checks

### SIWE

- SIWE message domain and URI exactly match the app's configured `APP_ORIGIN`.
- SIWE chain ID exactly `420420777`.
- Nonce is random, one-time and short-lived.
- Verify signature and parsed SIWE message on server; don't trust address sent separately from signed message.
- Cookie is HttpOnly, Secure in hosted environments, SameSite Lax/Strict, path `/`, eight-hour expiry.
- Session JWT is verified on every protected API request. Use `jose` with strong `SESSION_SECRET`; rotation invalidates existing cookies.

### Resource authorization

- `data_assets.owner_wallet = session.wallet` for private asset reads/mutations.
- `fl_jobs.creator_wallet = session.wallet` for job controls/run start.
- `licenses.asset_owner_wallet = session.wallet` for license control.
- Job creator receives only selected public participant/authorization fields, never private asset metadata.
- Participant owner sees only their own asset/license data plus permitted run summaries.
- All UUID and chain identifier routes must apply ownership conditions in the SQL query itself, not merely hide buttons in frontend.

### CSRF and origin validation

- All state-changing routes require valid session + exact allowed Origin/Host and non-GET method.
- SameSite cookies, no wildcard CORS, no cross-origin internal service requests from browser.
- SIWE is authentication; it is not CSRF protection.

---

## 10. Deployment architecture and environments

### 10.1 Local development

```text
Local browser
  -> Next.js dev server
  -> local Postgres (Docker Compose)
  -> Hardhat local EVM (contract tests/dev)
  -> local FastAPI + Flower service
  -> Flower synthetic clients
```

Local test wallets/keys are generated by Hardhat and must never be reused on Portaldot testnet/mainnet. No real dataset.

### 10.2 Preview/staging

- Vercel stable branch preview (exact URL reported at Phase 1).
- Separate Supabase staging project/database with synthetic records only.
- Portaldot V3 testnet; no mainnet network config in preview.
- Render staging FL service with its own internal token and synthetic demo workload.
- Vercel Preview environment variables are separate from Production.
- Enable preview protection if the operator chooses; never put sensitive data into a public preview.
- The preview is kept current after each accepted phase and its deployed commit is recorded.

### 10.3 Production (future / explicit approval)

- Separate Vercel Production environment, Supabase production DB and Render production FL service.
- Production chain target remains disabled until a separate decision; no mainnet deployment by default.
- No production data allowed until privacy/security review, worker identity model, data policy, model update leakage assessment and legal review are complete.
- Production release requires explicit operator authorization after final UI, regression and security gates.

### 10.4 Health and readiness

- Web: `/api/health` liveness; `/api/ready` checks DB and configured dependencies but does not expose exact secrets or RPC response internals.
- FL: `/health` liveness; `/ready` checks config, Flower package and internal API reachability. Do not publicly expose run secrets.
- Health endpoint must not provide DB connection strings, contract owner, env vars or full exception stack.

### 10.5 Background work and reliability

No Redis, queue or scheduler in MVP. The FL service accepts one run at a time and runs the Flower simulation process. It persists progress through internal callbacks to Next.js/Postgres. On process restart, an in-progress run is marked failed via startup reconciliation; it is not silently resumed from an uncertain partial round. A new run is a new record. This is an explicit demo-scale trade-off, not a production job orchestration design.

---

## 11. Environment variables

All variables are described here and mirrored in `.env.example`. Names are fixed; no values/secrets are committed.

### Web / Next.js

| Variable | Required | Exposure | Purpose |
|---|---|---|---|
| `APP_ORIGIN` | Yes | Server only | Exact canonical app origin for SIWE verification |
| `NEXT_PUBLIC_APP_URL` | Yes | Client-safe | Public app base URL for metadata/links |
| `SESSION_SECRET` | Yes | Server-only secret | Strong random key for signing session JWT; minimum 32 bytes |
| `DATABASE_URL` | Yes | Server-only secret | Supabase transaction pooler/local Postgres connection |
| `PORTALDOT_CHAIN_ID` | Yes | Server only | Expected chain ID; `420420777` in preview |
| `PORTALDOT_EVM_RPC_URL` | Yes | Server only | Portaldot V3 EVM RPC for reads/receipt checks |
| `PORTALDOT_CONFIRMATION_DEPTH` | Yes | Server only | Confirmed block depth selected during V3 preflight |
| `ZORQ_CONTRACT_ADDRESS` | Yes after deploy | Server only | Deployed `ZorqRegistry` address |
| `NEXT_PUBLIC_PORTALDOT_CHAIN_ID` | Yes | Client-safe | Chain ID for wagmi network configuration |
| `NEXT_PUBLIC_PORTALDOT_RPC_URL` | Yes | Client-safe | Public RPC endpoint if exposed to wallet; no secret embedded |
| `NEXT_PUBLIC_PORTALDOT_EXPLORER_URL` | Yes | Client-safe | Verified testnet explorer URL |
| `NEXT_PUBLIC_ZORQ_CONTRACT_ADDRESS` | Yes after deploy | Client-safe | Public contract address for wallet call interface |
| `NEXT_PUBLIC_GITHUB_REPOSITORY_URL` | Required for final footer | Client-safe | Real public repository URL set after repository creation; must not be guessed |
| `FL_SERVICE_URL` | Yes | Server only | Render FL service base URL |
| `FL_SERVICE_SHARED_SECRET` | Yes | Server-only secret | Authenticates Next.js to Python FL service |
| `FL_SERVICE_TIMEOUT_MS` | Optional | Server only | Internal request timeout; default 10,000 ms |
| `RATE_LIMIT_SECRET` | Yes | Server-only secret | HMAC salt for privacy-preserving rate-limit bucket keys |

### Python FL service

| Variable | Required | Exposure | Purpose |
|---|---|---|---|
| `ZORQ_INTERNAL_API_BASE_URL` | Yes | Server-only | Next.js API base URL used for internal authorization/progress endpoints |
| `FL_SERVICE_SHARED_SECRET` | Yes | Server-only secret | Must match Next.js service token; store separately in Render |
| `FL_SERVICE_MODE` | Yes | Server-only | `simulation` for MVP; never `native_portaldot` unless adapter is implemented and verified |
| `FLOWER_MAX_CONCURRENT_RUNS` | Yes | Server-only | `1` for MVP |
| `FLOWER_MAX_PARTICIPANTS` | Yes | Server-only | `5` for MVP |
| `DEMO_DATA_SEED` | Yes | Server-only | Reproducible seed for synthetic dataset generation |
| `PYTHONUNBUFFERED` | Yes | Server-only | `1` for immediate logs |

### Contract/deployment scripts

| Variable | Required | Exposure | Purpose |
|---|---|---|---|
| `PORTALDOT_EVM_RPC_URL` | Yes | Local/CI server-only | Deployment/testnet RPC |
| `PORTALDOT_CHAIN_ID` | Yes | Local/CI server-only | Guard deployment target |
| `DEPLOYER_PRIVATE_KEY` | Only for testnet deploy | Secret; never browser | Dedicated testnet deployer key; use local generated key for local chain |
| `CONTRACT_OWNER_ADDRESS` | Yes for deployment | Public config | Initial operational owner |

Never expose `SESSION_SECRET`, `DATABASE_URL`, `FL_SERVICE_SHARED_SECRET`, `DEPLOYER_PRIVATE_KEY` or `RATE_LIMIT_SECRET` to `NEXT_PUBLIC_*`, client runtime, logs or Git.

---

## 12. Repository structure

```text
zorq/
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── AGENTS.md
├── AI_HANDOFF.md
├── README.md
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json                 # npm workspace root
├── package-lock.json
├── docker-compose.yml            # local Postgres + FL service; optional web profile
├── apps/
│   ├── web/                      # Next.js UI + Route Handlers
│   │   ├── app/                  # public/app routes and API route handlers
│   │   ├── components/           # shared behaviour components
│   │   ├── lib/                  # auth, DB, chain, validation, API services
│   │   ├── db/                   # Drizzle schema, migrations, seed scripts
│   │   ├── public/               # favicon/static public assets
│   │   └── tests/                # web unit/integration tests
│   └── fl-service/               # Python FastAPI + Flower
│       ├── zorq_fl/
│       │   ├── api/              # internal FastAPI routes
│       │   ├── flower_app/       # ServerApp, ClientApp, strategy
│       │   ├── model/            # fixed model and synthetic data generation
│       │   ├── auth/             # backend internal API client
│       │   └── run/              # run process and lifecycle
│       ├── tests/
│       ├── pyproject.toml
│       ├── uv.lock
│       └── Dockerfile
├── packages/
│   ├── contracts/               # Hardhat 3 project
│   │   ├── contracts/
│   │   ├── ignition/modules/
│   │   ├── test/
│   │   ├── scripts/
│   │   └── hardhat.config.ts
│   └── shared/                   # shared constants/schemas if needed; no secrets
├── docs/
│   ├── API_REFERENCE.md
│   ├── DEVELOPER_SETUP.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY_AND_PRIVACY.md
│   ├── USER_GUIDE.md
│   ├── PORTALDOT_VALIDATION.md
│   ├── TEST_PLAN.md
│   ├── DESIGN_DECISIONS.md
│   └── DESIGN_APPROVAL.md
└── scripts/
    ├── verify-testnet.mjs
    └── smoke-test.mjs
```

Directory responsibilities are fixed. The agent may add small implementation files within these boundaries, but must not split into more services or add a new infrastructure dependency without approval.

---

## 13. Logging, monitoring and operational controls

- Structured JSON logs with `requestId`, entity/run IDs, route, error code and elapsed time.
- Do not log SIWE signatures, cookies, internal bearer token, raw metadata salt, raw data, client model updates or private keys.
- Persist user-relevant events in `audit_events`; technical logs remain in hosting provider.
- `GET /api/ready` checks DB and configured RPC/contract read availability without returning endpoint credentials.
- FL service records the run/round ID and safe client status, not raw training payloads.
- Maximum one Flower run at a time and maximum five clients.
- Operator may pause new contract creation/issuance in an incident. Revocation remains available.
- No third-party analytics, user tracking or model telemetry service in MVP.

---

## 14. Architecture trade-offs and rejected alternatives

| Alternative | Decision | Reason |
|---|---|---|
| Separate ERC-721 EVM contract + ink! registry | Rejected for MVP | Cross-runtime calls/state synchronization not confirmed; same-contract registry avoids dual source of truth |
| Custom ink! contract | Rejected for MVP | EVM path is more directly aligned with V3 EVM RPC and frontend wallet tooling; older ink! docs are not proof of current V3 cross-VM integration |
| ERC-1155 | Rejected | Licenses are unique per asset/job/revision, not interchangeable batches |
| Transferable ERC-721 | Rejected | Rights are tied to the provider's dataset control and explicit consent; secondary transfer would create unsafe assumptions |
| Public dataset marketplace | Rejected | Not necessary to demonstrate job-bound authorization; risks metadata exposure and scope creep |
| Real dataset uploads / IPFS / object storage | Rejected | Raw data locality is a core product boundary; MVP uses synthetic client partitions |
| Custom FL engine | Rejected | Flower provides a maintained FL framework and FedAvg/custom strategy surface |
| Portaldot native FL only | Deferred | Public API not established in the docs reviewed; do not fabricate integration |
| LLM / AI agents | Rejected | Not needed for authorization or FL; deterministic code is safer |
| Redis / queue | Rejected for MVP | One concurrent small simulation; DB state + one worker process is sufficient for demo, with documented crash behaviour |
| Microservices for every domain | Rejected | One Next.js backend plus one Python FL service is sufficient |
| Supabase Auth | Rejected | Wallet-native SIWE provides required identity; do not add two auth systems |
| Mainnet deployment | Rejected | Hackathon/testnet prototype only; no mainnet or production data |

---

## 15. Unresolved external dependency policy

The architecture does not leave a design decision to the coding agent. It records external facts that cannot be asserted before an operator/organizer provides them:

1. **Portaldot EVM gas funding:** verify whether the EVM account receives test POT through a wallet mapping/faucet flow. If not, obtain official operator instructions. Do not switch to mainnet or use a third-party bridge without approval.
2. **Native FL API:** if Portaldot provides a supported API, document endpoint/auth/SDK/example and run a real test. Only then propose the native adapter; until approved, FlowerDemoProvider is the chosen MVP provider.
3. **Native ZKP API:** require exact supported proof system, prover/verifier endpoints, key/circuit management, privacy statement and successful proof verification. Until then, do not claim ZKP integration.
4. **Public repository URL:** set only after the actual GitHub repository has been created and confirmed public. Until then the app must not render a fabricated GitHub link.
5. **Explorer URL behaviour:** test exact transaction and address routes before generating external links. Never fabricate URL paths.

---

## 16. References and technical verification sources

Checked on 4 November 2026. The repository should retain these links and update the validation note if Portaldot changes network details.

- Portaldot V3 network endpoint announcement (EVM RPC, Substrate WS, testnet explorer, chain ID, test-token distribution caution): https://x.com/Portaldot_Dev (original posts dated 17 and 23 October 2026; a readable mirror is https://teapawt.net/PortaldotL0).
- Portaldot developer docs and older chain/FL/ZKP overview: https://portaldot-dev.readthedocs.io/en/latest/ and https://portaldot-dev.readthedocs.io/en/latest/Introduction.html.
- Portaldot Hacker House: https://dorahacks.io/hackathon/portaldot-hacker-house-2026/detail.
- Next.js release list: https://github.com/vercel/next.js/releases.
- Vercel environments and preview deployments: https://vercel.com/docs/deployments/environments.
- Wagmi wallet connection: https://wagmi.sh/react/guides/connect-wallet.
- Hardhat 3 docs: https://hardhat.org/docs/getting-started.
- OpenZeppelin Contracts 5.x: https://docs.openzeppelin.com/contracts/5.x.
- SIWE/EIP-4361: https://eips.ethereum.org/EIPS/eip-4361.
- Supabase Postgres connection and Drizzle setup: https://supabase.com/docs/guides/database/connecting-to-postgres and https://supabase.com/docs/guides/database/drizzle.
- Flower framework/PyTorch quickstart: https://flower.ai/docs/examples/quickstart-pytorch.html and https://flower.ai/docs/framework/main/en/ref-api/flwr.server.strategy.FedAvg.html.

---

**Architecture freeze rule:** the coding agent implements this architecture as written. Any change to chain, contract model, auth, database, FL provider, deployment topology, data visibility, license ownership or enforcement semantics requires separate operator approval.
