# Zorq — Product & Functional Specification

**Document status:** Implementation-ready baseline for MVP planning  
**Version:** 1.0  
**Prepared:** 4 November 2026  
**Product:** Zorq  
**Network target:** Portaldot V3 testnet  
**Source of truth:** This document defines product behaviour. `ARCHITECTURE.md` defines the technical implementation. `IMPLEMENTATION_PLAN.md` controls sequencing.

---

## 1. Product definition

### 1.1 One-line description

**Zorq is a programmable authorization layer that lets data owners grant job-specific, time-bounded rights for their datasets to participate in federated machine-learning runs, without uploading the raw datasets to Zorq.**

### 1.2 Problem

Organizations hold useful private datasets but are reluctant to contribute them to collaborative AI because ordinary sharing arrangements often grant broad access, separate permission from actual execution, and make it difficult to prove which dataset was authorized for which training job and when that authorization ceased to apply.

The core problem is not simply discovering or selling datasets. It is enforcing a narrowly defined right to participate in a specific computation.

### 1.3 Current alternatives and workarounds

- Bilateral data-sharing agreements and manual approval processes.
- Centralized data warehouses or platforms that receive copies of source datasets.
- Access-control lists and API credentials that grant access to a resource but do not necessarily govern each training round.
- Federated-learning frameworks that coordinate training but do not, by themselves, provide Zorq's on-chain, job-bound licensing primitive.
- Blockchain data NFTs or permission records that represent ownership or access but may not be coupled to a particular FL execution checkpoint.

Zorq does not claim that these approaches do not exist. Its differentiation is the integration of a job-specific authorization object with an execution coordinator that checks the authoritative on-chain state at admission and at each round boundary.

### 1.4 Target users

1. **Data providers:** organizations or individuals that control a dataset and decide whether it may contribute to a specific training job.
2. **Model researchers / job creators:** people or organizations that define an FL objective, configuration, participation window and run.
3. **Participant operators:** technical operators who run the local client/worker process that uses a dataset in an FL computation.
4. **Protocol / product operator:** maintains the Zorq application and deployment. This is an operational role, not a party with permission to grant a user's data rights.

### 1.5 User roles and permissions

A connected wallet may act in more than one role. There is no global role assignment or KYC in the MVP.

| Role | Capabilities | Restrictions |
|---|---|---|
| Data provider | Register an asset commitment; view and manage own asset metadata; issue and revoke licenses for own assets; inspect own contribution history | Cannot issue permission for another owner's asset; cannot change a job's purpose/configuration; cannot transfer a license |
| Job creator / researcher | Create and publish a job; pause, resume or close own job; view job status and authorized participant count; start and monitor runs | Cannot inspect private dataset names/descriptions or issue/revoke another provider's license |
| Participant worker | Executes the approved local training task for an asset/job assignment | Cannot choose a different job/model/purpose; cannot submit an update outside the round assignment |
| Application operator | Pause new platform activity during an incident; deploy and monitor services | No unilateral ability to mint a provider's license, change its owner, or read raw participant data |
| Public visitor | Read public product explanation and documentation | Cannot access app data or perform transactions until wallet authentication |

### 1.6 Core value proposition

Zorq turns a general data permission into a verifiable participation right with an explicit asset reference, job binding, declared purpose, model-configuration commitment and validity window. The FL coordinator checks that right before admitting a participant and again at each new round.

### 1.7 Key differentiator

**The DataLicense is an execution-scoped authorization primitive, not a generic dataset-access token.** It binds:

- one registered data asset;
- one specific federated-learning job;
- the job's published purpose hash;
- the job's model/configuration hash;
- an explicit validity interval; and
- the owner wallet that granted the right.

The license is represented as a non-transferable ERC-721 token on Portaldot V3. The same EVM contract contains the authoritative registry state; there is no separate EVM-to-WASM contract dependency in the MVP.

### 1.8 Primary use case

A researcher publishes a synthetic binary-classification FL job. Two or more data providers register separate synthetic dataset assets, inspect the job's purpose and fixed model configuration, and issue DataLicenses for that job. The coordinator reads the Portaldot contract at the start of each training round, dispatches training instructions only to currently authorized simulated Flower clients, aggregates only updates from clients admitted into that round's snapshot, and records the block used for the authorization decision. A provider revokes a license between rounds; the next round excludes that provider.

### 1.9 Secondary use cases

- A provider revokes a license before a run begins, causing admission to fail.
- A job creator pauses or closes a job, preventing future round admission.
- A provider allows a license to expire naturally; subsequent round checks reject it.
- A researcher reviews the on-chain license and job events alongside the application activity history.

### 1.10 Explicit product boundaries / what Zorq does not do

The MVP does **not**:

- upload, host, sell, inspect or centrally store real customer datasets;
- support real patient, banking, insurance or other regulated personal data;
- claim that federated learning alone prevents model-update leakage;
- provide differential privacy, secure aggregation, homomorphic encryption or a production ZKP proof unless a separately verified integration is delivered;
- claim to integrate with Portaldot's built-in FL or ZKP execution systems without a documented, tested API and a real test run;
- execute arbitrary user-supplied Python, notebooks, models or container images;
- provide a public dataset marketplace, data pricing, revenue sharing or token rewards;
- make DataLicenses transferable or tradable;
- provide model ownership, IP licensing or commercial usage rights over model outputs;
- provide medical, financial or other regulated decision-making systems;
- deploy to Portaldot mainnet or move real value;
- use an LLM or generative AI service.

The MVP is an experimental testnet prototype using synthetic data only.

---

## 2. MVP scope

### 2.1 MUST HAVE

1. Wallet connection to Portaldot V3 EVM testnet and Sign-In with Ethereum authentication.
2. A navigable frontend shell deployed to a stable Vercel preview in the first implementation phase.
3. Data asset registration using private off-chain metadata plus a random opaque on-chain asset ID and salted metadata commitment. No raw data upload.
4. Training-job creation with a public purpose statement, fixed model preset, configuration hash, participant limits and time window.
5. One Solidity EVM contract on Portaldot V3 that combines the ERC-721 DataLicense representation with authoritative asset/job/license registry state.
6. Non-transferable DataLicense issuance, job binding, validity checks, revocation, and re-issuance after prior license revocation/expiry.
7. Server-side verification of user-submitted transaction receipts and events before mirroring chain state to Postgres.
8. An FL coordinator using Flower with a fixed synthetic binary-classification task and at least two simulated clients/partitions.
9. On-chain authorization checks at run admission and at the start of each training round, all evaluated against one recorded block snapshot per round.
10. Round-level rule: a revocation mined after a round's authorization snapshot does not retroactively invalidate that round; it blocks the participant at the next round snapshot.
11. The coordinator fails closed if the chain authorization service is unavailable or ambiguous.
12. A run dashboard with status, rounds, participant counts, authorization outcomes, aggregate metrics and final model hash.
13. A reproducible test suite covering contract rules, API permissions, coordinator filtering, revocation and critical E2E flows.
14. Portaldot testnet deployment and at least one state-changing transaction paid in native testnet gas, subject to funding compatibility preflight.
15. Repository documentation, a public repository for hackathon submission if required by the official submission rules, and truthful demo evidence.

### 2.2 SHOULD HAVE

- A small in-app `/docs` page explaining user workflows and the prototype's privacy limitations.
- A contract-event history view with explorer links once the exact explorer URL and transaction format are verified.
- A reproducible local Docker Compose environment for the web app, local Postgres, FL service and two synthetic Flower clients.
- A one-click seeded demo scenario using explicitly synthetic assets and data.
- An operator-only emergency pause for new asset/job/license issuance that does not block a provider from revoking an existing license.

### 2.3 NICE TO HAVE

- Publicly verifiable signed run receipts containing run ID, round, block number/hash, included license IDs and model hash.
- Downloadable sanitized run report.
- A ZKP adapter interface and a mocked test implementation clearly labelled as a mock (not a Portaldot proof).
- Read-only event indexing to recover if a browser closes before a transaction-confirmation API call.

### 2.4 FUTURE

- Native Portaldot FL adapter, after official interface documentation, access credentials, sample code and a successful test are obtained.
- Native Portaldot ZKP adapter, after proof-generation and verification APIs are documented and tested.
- Real participant worker agents deployed inside provider-controlled infrastructure.
- Mutual TLS and signed worker identity/attestation.
- Data-use policies and output/model governance.
- Differential privacy, secure aggregation, encrypted transport hardening and model-update leakage assessment.
- Additional model families, model configuration management and evaluation datasets.
- More formal asset metadata privacy, selective disclosure and auditable consent renewal.
- Enterprise identity, organization membership, approval workflows and multi-signature control.

### 2.5 OUT OF SCOPE

Real data onboarding, real customer use, real medical/financial records, payments, escrow, token economics, public data marketplace, license trading, user-defined code execution, arbitrary model uploads, mainnet, legal compliance certification, production SLAs, production ZKP/HE claims, and a general-purpose AI-agent layer.

### 2.6 MVP size limits

- One fixed model preset: `synthetic-binary-classifier-v1`.
- Two to five synthetic FL participants per run.
- Three training rounds by default.
- At least two authorized, distinct asset IDs required to start a run.
- One active run per job at a time.
- No more than one demo worker partition per registered asset.
- Job maximum duration: 30 days in the MVP.
- No more than five participant assets for a single job in the demo environment.
- No arbitrary dataset file uploads or custom model code.

**Fixed model preset (`synthetic-binary-classifier-v1`):** 8 numeric input features; one `torch.nn.Linear(8, 1)` logit output; binary labels; `BCEWithLogitsLoss`; SGD optimizer with learning rate `0.05`; batch size `32`; two local epochs per round; three server rounds; Flower FedAvg weighted by the number of local examples. Each synthetic participant receives 256 deterministic examples generated from `DEMO_DATA_SEED` plus its partition ID. Generate feature vectors from an eight-dimensional standard normal distribution; generate labels using a fixed sigmoid teacher with weight vector `[0.6,-0.8,0.4,0.2,-0.3,0.7,-0.5,0.1]` and a small deterministic partition-specific bias `(partitionId - 2) * 0.15`. A fixed synthetic global evaluation set of 512 examples uses the same feature/teacher distribution with zero bias and is used for aggregate loss/accuracy after each round. No participant-level metric or individual model update is shown in the UI. All participants are simulated Flower clients in a controlled simulation runtime; they are not separately operated hospital/company nodes. All eligible clients in the authorization snapshot participate in each round (no random sampling). Model weights are hashed as SHA-256 over sorted state-dict keys and each tensor's dtype, shape and contiguous CPU byte representation. These values are committed as the model configuration and included in `modelConfigHash`; the agent must not tune them without operator approval.

---

## 3. Core user flows

Every on-chain action is wallet-signed. The backend never stores user private keys or signs user transactions.

### Flow A — Connect wallet and authenticate

**Entry:** public landing page or protected app route.  
**Preconditions:** EVM wallet installed/available; user has or can obtain a Portaldot V3 testnet account.  
**Steps:**
1. User selects Connect Wallet.
2. Frontend requests supported wallet connection through wagmi.
3. Frontend checks chain ID `420420777`; if wrong, requests chain switch or add-network operation.
4. Frontend requests a one-time SIWE nonce from `POST /api/auth/nonce`.
5. Backend creates a nonce tied to the expected app origin and wallet address, expiring after five minutes.
6. Frontend constructs the SIWE message with the exact domain, URI, chain ID and nonce; user signs it.
7. Frontend submits message/signature to `POST /api/auth/verify`.
8. Backend validates domain, URI, chain ID, signature, issue/expiry time and unused nonce; atomically marks nonce used.
9. Backend issues an eight-hour signed, HttpOnly, Secure, SameSite cookie and upserts the wallet profile.

**State changes:** `auth_nonces.consumed_at`; `users.last_seen_at`; session cookie issued.  
**Success:** protected dashboard loads.  
**Failure:** wrong chain, rejected signature, expired/reused nonce or origin mismatch produces a clear recoverable error; no session is created.  
**Permissions:** wallet proves control of its own address only.  
**Exit:** authenticated app or public page after logout.

### Flow B — Register a data asset

**Entry:** `/app/assets/new`.  
**Preconditions:** authenticated wallet; no raw data upload; user accepts synthetic-demo-only description.  
**Steps:**
1. User enters asset display name and optional description.
2. User chooses one of the available synthetic demo partition labels; the backend prevents duplicate partition assignment in the demo environment.
3. Backend creates a random opaque `chainAssetId`, creates a random salt, computes a metadata commitment, and stores a `pending_tx` draft.
4. Frontend asks wallet to call `registerAsset(chainAssetId, metadataCommitment)` on the deployed Zorq contract.
5. Wallet submits transaction and frontend waits for receipt plus configured confirmations.
6. Frontend calls `POST /api/assets/{assetId}/confirm` with transaction hash.
7. Backend verifies chain ID, contract address, sender wallet, successful receipt, `AssetRegistered` event arguments and current contract state.
8. Backend atomically changes asset status to `active`, stores block/transaction evidence and audit event.

**State changes:** asset draft -> active; chain transaction recorded.  
**Success:** asset appears in owner dashboard.  
**Failure:** reverted/mismatched tx leaves a visible failed/pending state; user can retry with a new draft; a tx from another wallet is rejected.  
**Edge cases:** double-click uses idempotency key; duplicate `chainAssetId` is rejected on-chain; metadata hash is not accepted from an untrusted client without recomputation by server.  
**Permissions:** only the authenticated wallet that owns the draft can confirm it; the contract records `msg.sender` as owner.  
**Exit:** asset detail page.

### Flow C — Create and publish a training job

**Entry:** `/app/jobs/new`.  
**Preconditions:** authenticated wallet; fixed model preset available; start/end times valid.  
**Steps:**
1. User enters title, job description, public purpose statement and job window.
2. UI explains fixed training preset, three rounds, and minimum two participants.
3. Backend creates a draft, computes `purposeHash` and deterministic `modelConfigHash`, and returns the exact transaction arguments.
4. User signs `createJob(jobId, purposeHash, modelConfigHash, startsAt, endsAt, maxParticipants)`.
5. Frontend waits for receipt/confirmations and submits tx hash to `POST /api/jobs/{id}/confirm`.
6. Backend verifies sender, event arguments, contract address, block and on-chain state, then marks job `open`.

**State changes:** draft -> open.  
**Success:** job is visible in `/app/jobs` and can accept licenses.  
**Failure:** invalid time window, wrong signer, wrong contract, reverted tx or mismatched purpose/config hash prevents publication.  
**Permissions:** only the authenticated creator can publish/control the job.  
**Exit:** job detail page.

### Flow D — Provider reviews a job and issues a DataLicense

**Entry:** open job detail page and select License an Asset.  
**Preconditions:** authenticated provider; provider owns an active asset; job is open; time window is within job window; no currently valid license exists for that asset/job pair.  
**Steps:**
1. Provider selects one of their assets.
2. UI displays job purpose, fixed model preset, training window, maximum rounds and license validity choices.
3. Provider confirms that the asset is synthetic demo data and reviews the non-transferable/revocation notice.
4. Backend creates a pending license draft and validates asset ownership and job state against the chain.
5. Provider signs `issueLicense(assetId, jobId, validFrom, validUntil)`.
6. Backend confirms `LicenseIssued` event and verifies token owner, asset/job binding, dates and revision.
7. Backend records the license and creates/updates the job-participant association.

**State changes:** pending license -> active or expired as time passes; participant linked to job.  
**Success:** license detail page shows token ID, job, asset reference, validity and chain transaction.  
**Failure:** wrong owner, wrong job, invalid dates, already-active license or failed transaction is rejected.  
**Edge cases:** re-issue allowed only when previous latest license is revoked or expired; duplicate submission is idempotent; contract is authoritative if DB and UI disagree.  
**Permissions:** only the asset owner can issue; job creator cannot issue on behalf of provider.  
**Exit:** license detail or job detail.

### Flow E — Revoke a DataLicense

**Entry:** license detail page for a license owned by the connected wallet.  
**Preconditions:** active or not-yet-expired license; user controls asset owner wallet.  
**Steps:**
1. User selects Revoke.
2. UI explains that a contribution already admitted into the current round may finish; the next round will exclude the participant.
3. User confirms and signs `revokeLicense(licenseId)`.
4. Frontend waits for receipt and confirmations.
5. Backend verifies sender, event and contract status; records revocation and audit event.

**State changes:** `revoked=false -> true`; terminal.  
**Success:** UI shows revoked and the next authorization snapshot will deny participation.  
**Failure:** unauthorized wallet, unknown token or already revoked token produces a deterministic error.  
**Permissions:** license's asset owner only.  
**Exit:** license detail.

### Flow F — Start an FL run

**Entry:** job detail page, Start Run action.  
**Preconditions:** connected wallet is job creator; job is open and within its window; at least two distinct assets have candidate licenses; FL service is healthy; no active run exists for this job.  
**Steps:**
1. User selects Start Run.
2. Backend re-reads job/asset/license state on-chain at a consistent confirmed block snapshot.
3. Backend requires at least two distinct authorized assets and at least two available demo clients.
4. Backend creates a run with an idempotency key and calls the internal FL service.
5. Flower coordinator requests an authorization snapshot for round 1.
6. Backend queries contract `checkAuthorization` for all candidate licenses at the same block number and returns only authorized participants plus denial reasons.
7. Flower configures the round only for authorized simulation clients.
8. Each client trains locally on its synthetic partition and returns model parameters/metrics.
9. Flower aggregates only updates from the exact round snapshot allowlist.
10. Flower reports progress to the backend; dashboard polls run status.
11. Repeat authorization snapshot at the start of each later round.
12. On completion, persist aggregate metrics and model hash; mark run completed.

**State changes:** run queued -> preflight -> running -> completed or failed; round and authorization records created.  
**Success:** dashboard shows three completed rounds, allowed participants, aggregate evaluation metrics and model hash.  
**Failure:** fewer than two authorizations, paused/closed job, unavailable chain RPC, unavailable FL service, participant failure below minimum, or invalid model update stops the run safely.  
**Permissions:** only job creator may start.  
**Exit:** run monitor.

### Flow G — Revoke during an active run

**Entry:** provider revokes an active license while a run is in progress.  
**Rule:** each round has a fixed authorization snapshot identified by block number/hash. A revocation included after that snapshot does not retroactively remove a contribution already admitted to that round. At the next round boundary, the coordinator obtains a new snapshot; the revoked license is denied and the client is not sent another training instruction. If fewer than two authorized assets remain, the run stops before that next round.  
**Audit:** record the revocation transaction block and the next-round denial block.  
**No claim:** Zorq cannot cancel computation already started on a participant's machine.

### Flow H — Pause/resume/close a job

**Entry:** job creator on job detail.  
**Preconditions:** creator wallet; current state permits transition.  
**Steps:** user chooses pause, resume or close; wallet signs `setJobState`; backend confirms event and mirrors state.  
**Rules:** Open -> Paused or Closed; Paused -> Open or Closed; Closed is terminal. A pause/close during a run takes effect at the next round authorization checkpoint.  
**Close:** irreversible in MVP; no reopen.  
**Permissions:** creator only.  
**Failure:** invalid transition or wrong wallet reverts; UI keeps last confirmed state.

---

## 4. Functional requirements

### FR-01 — Wallet connection and SIWE authentication

- **Purpose:** prove wallet control for off-chain user actions.
- **Actor:** any user.
- **Inputs:** EVM wallet address, SIWE message, signature, nonce.
- **Processing:** verify domain, URI, chain ID, issued-at, expiration, nonce uniqueness and signature; create short-lived session.
- **Output:** authenticated wallet session.
- **Permissions:** address-bound; no permissions beyond that wallet.
- **Validation:** nonce one use, >= 8 random characters, five-minute expiry, correct chain ID.
- **Errors:** `WRONG_CHAIN`, `INVALID_SIGNATURE`, `NONCE_EXPIRED`, `NONCE_REUSED`, `ORIGIN_MISMATCH`.
- **Acceptance:** replaying a successful SIWE message cannot create a second session; signature from a different address fails.

### FR-02 — Asset registration

- **Purpose:** register an opaque asset reference and owner.
- **Actor:** data provider.
- **Inputs:** display name, description, fixed demo partition label.
- **Processing:** random ID/salt, metadata commitment, on-chain `registerAsset`, verified receipt.
- **Output:** active asset record and on-chain reference.
- **Permissions:** owner only.
- **Validation:** no raw files, URLs, connection strings or real personal data; name 3-80 chars; description <= 500 chars; one asset per demo partition slot.
- **Errors:** `ASSET_DUPLICATE`, `PARTITION_UNAVAILABLE`, `TX_MISMATCH`, `CHAIN_UNAVAILABLE`.
- **Acceptance:** a valid owner can register; another wallet cannot deactivate or license it.

### FR-03 — Job creation

- **Purpose:** define a specific, reproducible FL operation.
- **Actor:** researcher.
- **Inputs:** title, description, purpose, start/end, fixed model preset.
- **Processing:** canonicalize and hash purpose/config; on-chain createJob; verify event.
- **Output:** published job.
- **Permissions:** creator controls status.
- **Validation:** title 3-100 chars; description <= 1,000; purpose 20-500 chars; start < end; duration <= 30 days; end > current block time; max participants 2-5; fixed model key only.
- **Errors:** `INVALID_JOB_WINDOW`, `UNSUPPORTED_MODEL`, `JOB_ALREADY_EXISTS`, `TX_MISMATCH`.
- **Acceptance:** published job hash values match the values used in the contract transaction and database.

### FR-04 — DataLicense issuance

- **Purpose:** grant one asset a constrained right to contribute to one job.
- **Actor:** asset owner.
- **Inputs:** asset ID, job ID, valid-from and valid-until.
- **Processing:** verify owner/job/asset state; wallet calls contract; contract mints a non-transferable ERC-721; API confirms event and stores mirror.
- **Output:** license token ID and lifecycle record.
- **Permissions:** registered asset owner only.
- **Validation:** license window is contained in job window; valid-from >= current time; valid-until > valid-from; job open; asset active; no currently effective latest license.
- **Errors:** `NOT_ASSET_OWNER`, `JOB_NOT_OPEN`, `ASSET_INACTIVE`, `INVALID_LICENSE_WINDOW`, `ACTIVE_LICENSE_EXISTS`.
- **Acceptance:** contract `checkAuthorization` returns true only for the correct owner, asset/job and valid period.

### FR-05 — License revocation and re-issuance

- **Purpose:** stop future participation.
- **Actor:** asset owner.
- **Inputs:** license ID and wallet transaction.
- **Processing:** set revoked flag and emit event; mirror status after verification.
- **Output:** license is no longer authorizing future round snapshots.
- **Permissions:** asset owner only.
- **Validation:** token exists and is not already revoked.
- **Errors:** `NOT_LICENSE_OWNER`, `LICENSE_REVOKED`, `LICENSE_NOT_FOUND`.
- **Acceptance:** revoked license fails `checkAuthorization` at a subsequent snapshot; new revision can be issued only after prior revision is revoked or expired.

### FR-06 — Job controls

- **Purpose:** allow creator to pause, resume or permanently close a job.
- **Actor:** job creator.
- **Inputs:** job ID and requested state.
- **Processing:** contract state transition, event and verified mirror.
- **Output:** current chain state.
- **Permissions:** job creator only.
- **Validation:** only Open->Paused/Closed and Paused->Open/Closed; Closed terminal.
- **Errors:** `NOT_JOB_CREATOR`, `INVALID_JOB_TRANSITION`.
- **Acceptance:** paused/closed jobs cannot admit participants on next round snapshot.

### FR-07 — Authorization snapshots

- **Purpose:** provide one consistent authorization decision set for a round.
- **Actor:** internal FL service only.
- **Inputs:** run ID, job ID, round number.
- **Processing:** verify internal token; choose one confirmed block; read job and each candidate license at that same block; record block number/hash/timestamp and decisions; return allowlist.
- **Output:** allowed participants, denied participants with reason codes, block evidence.
- **Permissions:** internal service credential only.
- **Validation:** job/run match; round is next expected round; no duplicate inconsistent snapshot.
- **Errors:** `INTERNAL_AUTH_FAILED`, `CHAIN_UNAVAILABLE`, `SNAPSHOT_ALREADY_EXISTS`, `INVALID_ROUND`.
- **Acceptance:** coordinator cannot begin a round without a complete snapshot; service failure causes fail-closed behaviour.

### FR-08 — Federated training

- **Purpose:** demonstrate distributed model training using synthetic partitions.
- **Actor:** job creator starts; FL service runs.
- **Inputs:** published job, authorized participant set, fixed model config.
- **Processing:** Flower FedAvg; only allowlisted client apps receive `fit` instructions; only updates from those clients are aggregated; fixed 3 rounds.
- **Output:** round metrics and final model hash.
- **Permissions:** service-to-service trigger; creator can start; clients do not select different jobs.
- **Validation:** minimum two distinct assets per round; parameters finite and expected size; client identity matches registered simulation mapping.
- **Errors:** `INSUFFICIENT_AUTHORIZED_PARTICIPANTS`, `WORKER_TIMEOUT`, `INVALID_MODEL_UPDATE`, `FL_SERVICE_UNAVAILABLE`, `AUTHORIZATION_SERVICE_UNAVAILABLE`.
- **Acceptance:** a revoked participant is excluded from the next round; unauthorized client updates never enter the aggregate.

### FR-09 — Run monitoring

- **Purpose:** make execution and authorization decisions inspectable.
- **Actor:** job creator; provider sees own participation only.
- **Inputs:** run ID.
- **Processing:** query run, rounds, aggregate metrics, authorization decisions and sanitized chain evidence.
- **Output:** status timeline and round details.
- **Permissions:** job creator and owners of participating assets receive role-filtered views; no private asset description exposed to job creator.
- **Acceptance:** unauthorized wallets receive 404/403 without resource metadata leakage.

### FR-10 — Activity/audit history

- **Purpose:** preserve an auditable off-chain history linked to chain evidence.
- **Actor:** system, wallet user.
- **Inputs:** verified domain action or system event.
- **Processing:** append-only audit event in same DB transaction as mirror update.
- **Output:** activity list and transaction details.
- **Permissions:** filtered by entity ownership/job membership.
- **Acceptance:** no API route updates or deletes an existing audit record.

---

## 5. Business logic and state machines

### 5.1 Asset state

`DRAFT -> PENDING_CHAIN -> ACTIVE -> DEACTIVATED`

- `DRAFT`: off-chain draft only.
- `PENDING_CHAIN`: user transaction submitted but not confirmed.
- `ACTIVE`: successful contract event and current chain state confirmed.
- `DEACTIVATED`: owner has deactivated asset on chain; terminal in MVP.
- Failed transaction: `PENDING_CHAIN -> TX_FAILED`; user creates a new draft or retries only if exact chain call remains possible.
- Deactivation prevents new license issuance and future round authorization. It does not stop an already admitted round; it takes effect at the next snapshot.

### 5.2 Job state

**On-chain:** `OPEN`, `PAUSED`, `CLOSED`.

**Allowed transitions:**

```text
OPEN ──pause──> PAUSED
OPEN ──close──> CLOSED
PAUSED ──resume──> OPEN
PAUSED ──close──> CLOSED
CLOSED ──> terminal
```

- Job window is `[startsAt, endsAt)`.
- New licenses only while job is `OPEN` and the chain block timestamp is inside the job window.
- `PAUSED` blocks license issuance and new training-round admission. It may be resumed before end time.
- `CLOSED` is terminal.
- The off-chain database mirrors the chain state; it never overrides it.

### 5.3 DataLicense state

Derived status:

- `PENDING_CHAIN`: awaiting mint transaction confirmation.
- `ACTIVE`: not revoked, asset active, job open, chain timestamp in `[validFrom, validUntil)` and job window.
- `EXPIRED`: current chain timestamp >= `validUntil` or job end time.
- `REVOKED`: revocation flag true; terminal.
- `BLOCKED`: asset inactive or job paused/closed; may be temporary for asset/job state except `CLOSED`.

`REVOKED` and `EXPIRED` are never silently reactivated. A provider may issue a new license revision after the prior latest license is revoked or expired, provided the asset/job remain eligible.

### 5.4 License ownership and transfer

- License token is minted to the registered asset owner's wallet.
- ERC-721 token is non-transferable; transfers and approvals are disabled/reverted.
- No secondary market, broker, operator or researcher can take ownership.
- A license cannot be transferred to a different wallet; the provider must make a new asset registration/authorization decision if ownership arrangements change.

### 5.5 Job and license constraints

- Each asset is owned by exactly one wallet and may be used in multiple different jobs if the owner separately authorizes each job.
- A job is owned by its creator wallet.
- One currently effective license per asset/job pair.
- License valid window must be a subset of the job window.
- `purposeHash` and `modelConfigHash` are stored on the job; a license is bound through its `jobId` and cannot change purpose/model independently.
- No license is a general right to read or download the dataset.
- `minParticipants=2`; `maxParticipants` from 2 to 5.
- In the demo, two different asset IDs are required; they may be created by one wallet. The MVP does not yet prove independent enterprise ownership. `maxParticipants` counts unique asset IDs ever bound to the job, not currently-active licenses; a revoked/expired asset may be re-licensed, but a new asset cannot take its cohort slot.

### 5.6 Round snapshot and revocation semantics

- At admission and at the beginning of each round, the coordinator asks the backend for a single-block authorization snapshot.
- Backend derives the distinct candidate asset IDs from the `job_participants` index, then reads each asset/job `latestLicenseId` and `checkAuthorization` from the contract at the same explicit block number. The DB is only candidate discovery; it cannot approve a candidate.
- All candidate licenses are checked at the same block number and block hash. The snapshot stores that block hash and timestamp.
- The snapshot is immutable for that round.
- A revocation or job/asset state change mined after the round snapshot affects the next round, not the currently admitted round.
- The coordinator may aggregate only updates from the snapshot allowlist, and only if the participant has completed the assigned task and update validation passes.
- A participant not present in the snapshot receives no training instruction for that round.
- If fewer than two authorized participants remain, the next round does not start; the run stops with `INSUFFICIENT_AUTHORIZED_PARTICIPANTS`.
- If chain state cannot be read, the coordinator fails closed and does not start a round.

### 5.7 Run state

```text
QUEUED -> PREFLIGHT -> RUNNING -> COMPLETED
                     └────────> FAILED
```

- One active run per job at a time.
- Multiple sequential runs may be created while the job remains open and licenses are valid.
- Each run has exactly the configured number of rounds (default three) unless a defined failure terminates it.
- A run is not automatically restarted after a process crash; it is marked failed and the job creator may start a new run after the service is healthy.
- No pause/resume within a run in MVP. A pause or close is observed at the next round snapshot.
- Starting a run requires an idempotency key.

### 5.8 Confirmation, conflict and duplicate rules

- A browser transaction is not authoritative merely because the wallet returned a transaction hash.
- Backend confirmation requires matching chain ID, contract address, sender wallet, event signature and expected event arguments, successful receipt, and configured confirmation depth.
- Duplicate confirmation of the same transaction is idempotent.
- Confirmation using a different transaction for an already-confirmed entity returns `409 CONFLICT`.
- On-chain uniqueness is authoritative even if two browsers submit concurrently.
- Database uniqueness and conditional updates prevent two pending records from being confirmed as the same logical resource.

### 5.9 Irreversible actions

- Data asset deactivation is terminal in MVP.
- Job closure is terminal in MVP.
- License revocation is terminal.
- License transfer is impossible.
- Model output publication/download is not supported.
- User wallet signatures and on-chain transactions cannot be reversed by Zorq; the UI must show the exact action and destination contract before signing.

---

## 6. Data model

PostgreSQL stores application metadata and indexed copies of confirmed chain events. The Portaldot contract is authoritative for ownership, job/asset/license lifecycle and on-chain validity.

### 6.1 Tables

#### `users`

- `wallet_address` — `varchar(42)`, PK, normalized lowercase EVM address.
- `display_name` — `varchar(80)`, optional.
- `created_at`, `updated_at`, `last_seen_at` — `timestamptz`.
- `status` — `active|blocked`, default `active`.
- Unique wallet address.

#### `auth_nonces`

- `nonce` — `varchar(128)`, PK, cryptographically random.
- `wallet_address` — `varchar(42)`, required.
- `domain`, `uri`, `chain_id` — exact SIWE context.
- `created_at`, `expires_at`, `consumed_at` — `timestamptz`.
- Index `(wallet_address, created_at)` and `expires_at`.
- Consumed timestamp can only be set once.

#### `data_assets`

- `id` — UUID PK.
- `chain_asset_id` — `char(66)` (`bytes32` hex), unique.
- `owner_wallet` — FK `users.wallet_address`.
- `display_name` — `varchar(80)`, required.
- `description` — `varchar(500)`, optional.
- `demo_partition_id` — smallint 0-4, unique while active.
- `metadata_commitment` — `char(66)`, required and published on-chain.
- `metadata_salt` — `char(66)`, server-only random salt used to build/recompute the commitment; never returned by public APIs.
- `status` — `draft|pending_chain|active|tx_failed|deactivated`.
- `chain_tx_hash` — nullable `char(66)`.
- `chain_block_number` — nullable bigint.
- `created_at`, `updated_at`, `deactivated_at` — `timestamptz`.
- Index `(owner_wallet, status)` and `chain_asset_id`.
- No dataset file path, real data URL, column names or personal records.

#### `fl_jobs`

- `id` — UUID PK.
- `chain_job_id` — `char(66)`, unique.
- `creator_wallet` — FK `users.wallet_address`.
- `title` — `varchar(100)`.
- `description` — `varchar(1000)`.
- `purpose_text` — `varchar(500)`, public statement.
- `purpose_hash` — `char(66)`.
- `model_key` — enum, MVP value `synthetic-binary-classifier-v1`.
- `model_config` — JSONB, canonical fixed configuration.
- `model_config_hash` — `char(66)`.
- `min_participants` — smallint, default 2.
- `max_participants` — smallint, 2-5.
- `max_rounds` — smallint, default 3.
- `starts_at`, `ends_at` — `timestamptz`.
- `status` — `draft|pending_chain|open|paused|closed|tx_failed`.
- `chain_tx_hash`, `chain_block_number` — nullable.
- `created_at`, `updated_at` — `timestamptz`.
- Index `(status, starts_at, ends_at)`, `(creator_wallet, created_at)`.

#### `licenses`

- `id` — UUID PK.
- `token_id` — `numeric(78,0)`, unique, nullable until mint confirmation.
- `asset_id` — FK `data_assets.id`.
- `job_id` — FK `fl_jobs.id`.
- `asset_owner_wallet` — `varchar(42)`.
- `revision` — integer >= 1.
- `valid_from`, `valid_until` — `timestamptz`.
- `status_mirror` — `pending_chain|active|expired|revoked|blocked|tx_failed`; derived/updated from chain and snapshots.
- `revoked_at` — nullable `timestamptz`.
- `chain_tx_hash`, `chain_block_number` — nullable.
- `created_at`, `updated_at` — `timestamptz`.
- Unique `(asset_id, job_id, revision)`; unique `(token_id)`.
- Index `(job_id, status_mirror)`, `(asset_id, created_at)`, `(asset_owner_wallet, status_mirror)`.

#### `job_participants`

- `id` — UUID PK.
- `job_id` — FK `fl_jobs.id`.
- `asset_id` — FK `data_assets.id`.
- `license_id` — FK `licenses.id`.
- `owner_wallet` — `varchar(42)`.
- `created_at`, `updated_at` — `timestamptz`.
- Unique `(job_id, license_id)`.
- Unique `(job_id, asset_id, license_id)`.
- Current eligibility is always checked against chain state, not this mirror.

#### `training_runs`

- `id` — UUID PK.
- `job_id` — FK `fl_jobs.id`.
- `requested_by_wallet` — FK `users.wallet_address`.
- `status` — `queued|preflight|running|completed|failed`.
- `idempotency_key` — `varchar(128)`, unique with `requested_by_wallet` and route scope.
- `total_rounds` — smallint.
- `current_round` — smallint, default 0.
- `final_model_hash` — nullable `char(66)`.
- `aggregate_metrics` — nullable JSONB, aggregate metrics only.
- `failure_code`, `failure_message` — nullable bounded text.
- `started_at`, `completed_at`, `created_at`, `updated_at` — `timestamptz`.
- Partial unique index: one active run per job where status in `queued, preflight, running`.
- Index `(job_id, created_at desc)`.

#### `training_rounds`

- `id` — UUID PK.
- `run_id` — FK `training_runs.id`.
- `round_number` — smallint.
- `status` — `authorizing|running|completed|failed|skipped`.
- `snapshot_block_number` — bigint, required after authorization.
- `snapshot_block_hash` — `char(66)`, required after authorization.
- `snapshot_block_timestamp` — `timestamptz`.
- `authorized_count`, `aggregated_count` — smallint.
- `aggregate_metrics` — JSONB, no per-record metrics.
- `started_at`, `completed_at`, `created_at` — `timestamptz`.
- Unique `(run_id, round_number)`.

#### `authorization_checks`

- `id` — UUID PK.
- `run_id` — FK `training_runs.id`.
- `round_id` — FK `training_rounds.id`.
- `license_id` — FK `licenses.id`.
- `participant_wallet` — `varchar(42)`.
- `allowed` — boolean.
- `reason_code` — enum/string using contract codes (`AUTHORIZED`, `UNKNOWN_LICENSE`, `WRONG_PARTICIPANT`, `WRONG_JOB`, `REVOKED`, `ASSET_INACTIVE`, `JOB_NOT_OPEN`, `NOT_YET_VALID`, `LICENSE_EXPIRED`, `JOB_NOT_STARTED`, `JOB_EXPIRED`) plus service-only `RPC_ERROR`/`AUTHORIZATION_UNAVAILABLE`.
- `snapshot_block_number` — bigint.
- `snapshot_block_hash` — `char(66)`.
- `checked_at` — `timestamptz`.
- Unique `(round_id, license_id)`.
- Index `(run_id, round_id, allowed)`.

#### `chain_transactions`

- `id` — UUID PK.
- `tx_hash` — `char(66)`, unique.
- `chain_id` — bigint.
- `entity_type` — enum `asset|job|license`.
- `entity_id` — UUID.
- `sender_wallet` — `varchar(42)`.
- `event_name` — varchar.
- `block_number` — bigint.
- `block_hash` — `char(66)`.
- `status` — `confirmed|reverted|reorg_suspected`.
- `created_at` — `timestamptz`.

#### `audit_events`

- `id` — UUID PK.
- `actor_wallet` — nullable `varchar(42)`; null for system events.
- `entity_type`, `entity_id`, `action` — indexed strings.
- `details` — JSONB containing sanitized non-secret event details.
- `request_id` — nullable UUID/string for traceability.
- `created_at` — `timestamptz`.
- Append-only; no update/delete API.

#### `idempotency_records`

- `id` — UUID PK.
- `wallet_address` — `varchar(42)`.
- `route_key` — varchar.
- `idempotency_key` — varchar.
- `response_body` — JSONB.
- `created_at`, `expires_at` — `timestamptz`.
- Unique `(wallet_address, route_key, idempotency_key)`.

#### `rate_limit_buckets`

- `bucket_key` — varchar PK (hashed IP/wallet+route; never store raw IP in this key).
- `window_start` — `timestamptz`.
- `request_count` — integer.
- `updated_at` — `timestamptz`.
- Used with atomic upsert; old buckets periodically removed.

### 6.2 Relationships

```text
users 1 ── N data_assets
users 1 ── N fl_jobs
users 1 ── N licenses (as asset owner)
data_assets 1 ── N licenses
fl_jobs 1 ── N licenses
fl_jobs 1 ── N training_runs
training_runs 1 ── N training_rounds
training_rounds 1 ── N authorization_checks
licenses 1 ── N authorization_checks (over multiple rounds/runs)
fl_jobs + data_assets + licenses ── job_participants
assets/jobs/licenses 1 ── N chain_transactions and audit_events (polymorphic entity references)
```

### 6.3 Data classification and visibility

| Data | Public / visible to | Private / restricted |
|---|---|---|
| Job title, description, purpose, model preset and time window | Public authenticated job listing; purpose hash/config hash also on chain | None beyond creator profile details |
| Wallet address, contract events, token ID, chain transaction | Public on Portaldot | Do not promise wallet anonymity |
| Asset display name and description | Owner only in MVP | Other users and job creator |
| Asset ID and metadata commitment | On-chain opaque reference; DB record owner-only | Mapping salt and full metadata |
| Raw source dataset | Never uploaded to Zorq | Remains in local/synthetic client environment |
| SIWE nonce/session secret | Server only | All clients and other users |
| FL model updates | Transient coordinator process; never exposed in user UI | Do not persist per-client updates |
| Aggregate metrics/model hash | Job creator and authorized participant owners in role-filtered views | Internal error traces remain operator-only |
| Authorization history | Job creator sees participant wallet + allow/deny status; provider sees own license decisions | Other assets' descriptions and metadata |
| Service tokens, DB URL, RPC credentials if private | Server only | Client, repository and logs |

### 6.4 Data retention

- Expired nonces: delete after 24 hours.
- Idempotency records: 24 hours after expiry.
- Audit events, chain transaction metadata, licenses and run summaries: retain for prototype evaluation unless user requests deletion of off-chain profile metadata.
- Synthetic training partitions are generated at runtime; no raw dataset retention.
- Model updates are held in memory and discarded after aggregation; final model weights are not offered for download in MVP.

---

## 7. UI/UX architecture

This section specifies information architecture and behaviour, not the final visual aesthetic. Final design references and mockups are a late-stage approval-gated phase defined in `IMPLEMENTATION_PLAN.md`.

### 7.1 Public routes

| Route | Purpose | Main content/actions | States and acceptance |
|---|---|---|---|
| `/` | Explain product and boundary | One-line proposition, how it works, synthetic-demo limitation, Portaldot testnet label, Connect Wallet CTA | No fabricated metrics/partners; CTA connects wallet |
| `/docs` | User-facing documentation landing page | How licenses work, asset/job setup, round/revocation semantics, limitations | Links to real in-app docs sections; no dead links |
| `/privacy` | Explain wallet and metadata handling | Data collected, not collected, retention, contact/support route | Accurate to actual implementation; no compliance certification claim |
| `/terms` | Experimental testnet terms/limitations | Testnet-only status, no real data, no warranty, no production use | Clearly labelled prototype notice; obtain legal review before commercial launch |
| `/support` | Help and issue reporting | Troubleshooting, current known limitations, repository issue link only when real repo URL exists | No invented email or GitHub destination |

### 7.2 Authenticated app routes

| Route | Role | Structural layout and required behaviour |
|---|---|---|
| `/app` | Any connected user | Summary cards for owned assets, open jobs, active licenses, recent runs; empty state with next action; chain status banner |
| `/app/assets` | Data provider | Owned assets table/list; status, partition label, created time; register CTA; empty state |
| `/app/assets/new` | Data provider | Form for name/description, synthetic partition picker, privacy warning; transaction review and pending/failed/confirmed states |
| `/app/assets/[assetId]` | Asset owner | Metadata, on-chain asset ID, commitment, status, licenses; deactivate action with confirmation; not found/forbidden states |
| `/app/jobs` | Researcher/provider | Public job list with open/paused/closed filters; purpose, creator wallet, time window, participant count; empty state |
| `/app/jobs/new` | Researcher | Job form; fixed model preset summary; date/time validation; publish transaction step |
| `/app/jobs/[jobId]` | Creator or provider | Public job info; creator controls; participant count; provider's own asset licensing action; sanitized participant list; Start Run eligibility explanation |
| `/app/licenses` | Data provider | Owned license list, status, job, validity, token ID, revocation availability |
| `/app/licenses/[licenseId]` | License owner; job creator receives sanitized view | License conditions, chain transaction, snapshot history; owner revoke action; transfer is not offered |
| `/app/runs/[runId]` | Job creator and participant owners | Run state, round timeline, block snapshot, allowed/denied participants, aggregate metrics, final model hash; no per-client raw data or update weights |

### 7.3 Shared components and behaviour

- `AppShell`, responsive primary navigation, wallet/account control, chain mismatch banner, environment badge (`TESTNET`), footer.
- `WalletConnectButton`, `NetworkSwitchNotice`, `TransactionStatusPanel`, `TxExplorerLink` (only with verified explorer URL).
- `DataAssetForm`, `JobForm`, `LicenseIssueForm`, `RevokeConfirmationDialog`, `JobStateControl`.
- `StatusBadge` with text labels (not colour alone), `EmptyState`, `LoadingSkeleton`, `InlineError`, `PermissionDenied`, `NotFound`, `RetryPanel`.
- `RunTimeline`, `RoundCard`, `AuthorizationTable`, `AggregateMetricsPanel`.
- Every mutation must show pending-wallet, submitted, confirming, success and failed/reverted states.
- Every asynchronous list/detail page must have loading, empty, error and retry states.
- No visual control may appear active unless it performs its stated action.

### 7.4 Responsive and accessibility requirements

- Mobile-first, with primary flows usable at 360px viewport width; tablet and desktop layouts also tested.
- Semantic heading order, labelled form fields, explicit help/error text, keyboard operation, visible focus, sensible focus management in dialogs, no colour-only status indicators, reduced-motion support, appropriate contrast.
- Tables collapse to cards or scroll with accessible labels on mobile.
- Wallet dialogs and transaction prompts must remain usable on narrow screens.

### 7.5 Early skeletal UI

Phase 1 must publish the route-complete shell to a stable preview before core backend work. All listed routes must resolve; unfinished pages show clearly labelled structural placeholders such as “Not connected yet — feature is planned for Phase 3/4.” Wallet connect may be functional if the chain config is verified. No screen may imply that a license, transaction or FL run succeeded when it has not.

### 7.6 Temporary functional UI

Until core E2E flows pass, use a neutral, consistent temporary component system. Implement real forms, validation, network state, transaction state, tables and run progress without visual polish. Do not pick an unapproved final aesthetic.

### 7.7 Final frontend inventory

- All routes and navigation, footer, docs/privacy/terms/support destinations, real external links.
- Loading, empty, validation, success, error, permission denied, unavailable service, transaction rejected, chain mismatch, not found and global error states.
- Responsive desktop/tablet/mobile layouts and accessible keyboard interactions.
- Page titles/metadata, icon/favicon, Open Graph metadata for public landing/docs pages.
- `robots.txt`/sitemap policy: preview deployments should be noindex; production can index public landing/docs only if operator approves; authenticated app routes must not be indexed.
- Privacy and experimental terms pages are required. No analytics or cookie-consent platform in MVP; avoid non-essential tracking.
- `/docs` is the real documentation destination for the footer. GitHub footer link must be configured to the actual public repository URL after it exists; do not render a fake placeholder URL.
- No dead links, `href="#"`, inert buttons or unexplained placeholders in final UI.

### 7.8 End-to-end functionality gate before visual design

Final visual work cannot start until all are true on the deployed preview:

1. Wallet connect/SIWE succeeds and wrong-chain/invalid-signature paths work.
2. Asset registration succeeds on Portaldot testnet and owner sees it.
3. Job creation succeeds on testnet and is published with correct hashes.
4. Two distinct assets are licensed to one job and licenses are confirmed on-chain.
5. A Flower run completes three rounds and dashboard shows evidence.
6. Revoking one license between rounds causes exclusion from the next round.
7. Paused/closed job and expired license are denied.
8. Chain/FL service outage fails closed.
9. Unauthorized wallet cannot read or mutate another user's private asset/license data.
10. Critical E2E suite passes and exact preview URL/commit/test evidence are recorded in `AI_HANDOFF.md`.

---

## 8. API specification

All APIs are served by Next.js Route Handlers unless marked **internal**. Responses use JSON. All mutating routes require SIWE session authentication, same-origin checks and schema validation.

### Error envelope

```json
{
  "error": {
    "code": "LICENSE_NOT_ACTIVE",
    "message": "This license is not active for the requested training job.",
    "requestId": "uuid",
    "details": {}
  }
}
```

Do not expose stack traces, SQL, RPC credentials, raw dataset metadata or internal service tokens.

### Public and authentication endpoints

| Method / path | Auth | Request | Purpose / response | Key errors and controls |
|---|---|---|---|---|
| `GET /api/health` | None | — | Liveness only | Must not reveal configuration/secrets |
| `GET /api/ready` | None | — | Readiness for DB/RPC contract config/FL health | Returns sanitized dependency status |
| `POST /api/auth/nonce` | None | `{address}` | SIWE nonce/message context | Rate-limited; correct domain/chain |
| `POST /api/auth/verify` | None | `{message,signature}` | Verify SIWE and set session cookie | `INVALID_SIGNATURE`, `NONCE_REUSED`, `WRONG_CHAIN`; rate-limited |
| `GET /api/auth/me` | Session | — | Wallet profile and session expiry | 401 if absent/expired |
| `POST /api/auth/logout` | Session | — | Clear session cookie | Same-origin/CSRF checks |

### Assets

| Method / path | Auth | Request | Behaviour / response | Errors |
|---|---|---|---|---|
| `GET /api/assets` | Session | query `status?` | Only current wallet's assets | 401 |
| `POST /api/assets/drafts` | Session | `{displayName,description,demoPartitionId,idempotencyKey}` | Create draft; return `assetId`, `chainAssetId`, `metadataCommitment`, contract call args | 400 validation, 409 partition/duplicate |
| `GET /api/assets/{assetId}` | Session | — | Only owner sees private metadata | 404 for absent/non-owned resource |
| `POST /api/assets/{assetId}/confirm` | Session | `{txHash}` | Verify transaction/event and activate asset | 409 mismatch/duplicate, 422 reverted, 503 RPC unavailable |
| `POST /api/assets/{assetId}/deactivate/confirm` | Session | `{txHash}` | Confirm owner-signed deactivation | Same tx controls |

### Jobs

| Method / path | Auth | Request | Behaviour / response | Errors |
|---|---|---|---|---|
| `GET /api/jobs` | Session | `status?`, `cursor?` | Public job metadata and counts | 400 invalid filters |
| `POST /api/jobs/drafts` | Session | `{title,description,purposeText,startsAt,endsAt,idempotencyKey}` | Create job draft, fixed model config and hashes; returns contract args | 400 invalid window/text |
| `GET /api/jobs/{jobId}` | Session | — | Job metadata; role-filtered participants | 404 if missing |
| `POST /api/jobs/{jobId}/confirm` | Session | `{txHash}` | Verify `JobCreated`; publish job | 409 mismatch, 422 reverted |
| `POST /api/jobs/{jobId}/state/confirm` | Session | `{expectedState,txHash}` | Verify creator-signed pause/resume/close tx | 403 wrong creator, 409 transition mismatch |
| `POST /api/jobs/{jobId}/runs` | Session | `Idempotency-Key` header | Check creator/job and launch run | 403, 409 active run, 422 insufficient participants, 503 FL/RPC |

### Licenses

| Method / path | Auth | Request | Behaviour / response | Errors |
|---|---|---|---|---|
| `GET /api/licenses` | Session | `status?` | Only licenses owned by current wallet | 401 |
| `POST /api/licenses/drafts` | Session | `{assetId,jobId,validFrom,validUntil,idempotencyKey}` | Validate owner/job/chain state and return `issueLicense` args | 403, 409 active license, 422 window |
| `GET /api/licenses/{licenseId}` | Session | — | Owner detail; creator receives sanitized subset | 404/403 without metadata leakage |
| `POST /api/licenses/{licenseId}/confirm` | Session | `{txHash}` | Verify mint transaction and record token/revision | 409 mismatch, 422 revert |
| `POST /api/licenses/{licenseId}/revoke/confirm` | Session | `{txHash}` | Verify owner-signed revocation | 403, 409 already revoked |

### Runs

| Method / path | Auth | Request | Behaviour / response | Errors |
|---|---|---|---|---|
| `GET /api/runs/{runId}` | Session | — | Role-filtered run status and aggregate metrics | 404/403 |
| `GET /api/runs/{runId}/rounds` | Session | — | Round and authorization summaries | 404/403 |

### Internal FL service endpoints

These routes require `Authorization: Bearer <FL_SERVICE_SHARED_SECRET>`, TLS and strict payload validation. They are not called from the browser.

| Method / path | Request | Behaviour | Fail-closed condition |
|---|---|---|---|
| `POST /api/internal/runs/{runId}/authorization-snapshot` | `{roundNumber}` | Read all candidate licenses at one confirmed block; store immutable snapshot; return allowed participant/partition IDs and denied reason codes | RPC error, mismatched run/job, duplicate inconsistent round or too few participants |
| `POST /api/internal/runs/{runId}/events` | `{type,roundNumber?,metrics?,modelHash?,failureCode?}` | Record safe run/round progress and audit event | Invalid transition, unknown run, invalid metric schema |
| `POST /api/internal/runs/{runId}/complete` | `{finalModelHash,aggregateMetrics}` | Mark run completed after verifying expected final round | Wrong state, malformed metrics |
| `POST /api/internal/runs/{runId}/fail` | `{failureCode,publicMessage}` | Mark failed with sanitized reason | Unknown run or invalid transition |

### Rate limits and idempotency

- SIWE nonce: 5 requests per IP per 10 minutes; nonce lifetime five minutes.
- SIWE verify: 10 failed attempts per IP/wallet per 10 minutes.
- Authenticated API: 60 requests/minute per wallet; higher limits require evidence.
- Run start: one active run per job; API requires `Idempotency-Key`.
- Draft creation and chain confirmation are idempotent by wallet + route + key or entity + tx hash.
- Internal endpoints have service-token authentication plus run/round idempotency.

---

## 9. Database operations, transactions and concurrency

### 9.1 Draft then chain-confirm pattern

For assets, jobs and licenses:

```text
Validate session and ownership
  -> create pending DB draft (idempotent)
  -> user signs transaction in wallet
  -> wait for chain receipt/confirmation
  -> API verifies chain ID, contract, sender, event, args and current state
  -> BEGIN DB transaction
       conditionally update pending entity to confirmed state
       insert chain_transactions row (unique tx hash)
       insert append-only audit_events row
       update associated participant/license mirror
     COMMIT
  -> return confirmed resource
```

Never update a DB row to active based only on a client-supplied transaction hash.

### 9.2 Run start atomicity

- Begin DB transaction.
- Lock the job row (`SELECT ... FOR UPDATE`).
- Verify authenticated wallet is creator, job mirror is open, and no active run exists.
- Insert queued run with unique idempotency key; partial unique index prevents a second active run.
- Commit.
- Call FL service outside the DB transaction.
- If FL service rejects/fails to start, update run to failed with sanitized error; allow a new run after that state is terminal.

### 9.3 Authorization snapshot consistency

- Select one chain block number using the configured confirmation strategy.
- Read that block and persist number/hash/timestamp.
- Query the job and all candidate licenses at that same block number.
- Store one authorization row per candidate license and round.
- The round record and its checks are immutable once completed.
- Coordinator must consume the returned snapshot; it must not re-query individual licenses at different heads during the same round.

### 9.4 Concurrency and replay protection

- Unique contract IDs, token IDs, tx hashes, job/asset revisions, round numbers and idempotency keys.
- Contract checks prevent two active licenses for an asset/job pair.
- Conditional `UPDATE ... WHERE status='pending_chain'` prevents duplicate confirmation races.
- `SELECT FOR UPDATE` on job row plus partial unique active-run index prevents concurrent run starts.
- A round can only be created for `current_round + 1`.
- Duplicate internal callbacks with the same event/round payload are idempotent; mismatched repeated callbacks are rejected and audited.
- If a chain reorg is detected before configured confirmation threshold, do not mark the tx confirmed. If a confirmed block hash later becomes non-canonical, flag the entity/run for operator investigation and stop new runs for the affected job until revalidated.

---

## 10. Authentication and authorization

- Authentication: SIWE (EIP-4361) using the user's Portaldot EVM wallet.
- The SIWE message binds domain, URI, chain ID `420420777`, nonce, issued-at and expiration.
- Session: eight-hour signed JWT via `jose`, stored only in `HttpOnly; Secure; SameSite=Lax/Strict` cookie; never localStorage. Session secret is server-only.
- Nonce: cryptographically random, one use, five-minute expiry, tied to wallet and exact origin.
- Authorization: wallet address is the owner key for resources; every query scopes by current wallet or explicitly permitted job role.
- On-chain authorization: contract verifies `msg.sender` for writes and records owner; contract `checkAuthorization` decides participation.
- Off-chain authorization: Next.js API verifies session and ownership before returning private metadata or triggering runs.
- Internal service auth: independent high-entropy secret, constant-time comparison, rotation procedure, HTTPS only; never client-exposed.
- Job creators see public job data, their own job controls, and sanitized participant status. They do not receive provider dataset names/descriptions.
- Providers see their own assets, licenses and contribution history; other providers' private metadata is not exposed.
- Operator has deployment/incident controls only; does not acquire data-owner permissions.

---

## 11. Security and privacy architecture

### Threats and required controls

| Risk | MVP mitigation |
|---|---|
| Wallet impersonation / replay | SIWE domain/URI/chain binding, one-use nonce, five-minute expiry, signature recovery/verification, secure cookie |
| Wrong-chain transaction | Wallet chain check; backend verifies receipt chain ID and contract address |
| IDOR / cross-user reads | Every private DB query scopes by authenticated wallet and ownership relationship; return 404 for non-owned IDs where appropriate |
| Unauthorized license issuance | Contract checks asset owner; API pre-validates; transaction sender and emitted event verified |
| License transfer to attacker | Soulbound ERC-721; transfers and approval methods disabled/reverted |
| Expired/revoked access | Contract checks timestamp and revoked state; coordinator snapshot at every round boundary |
| Coordinator bypass | Coordinator fails closed, uses only backend-generated snapshot allowlist, logs immutable per-round decisions; trust boundary explicitly documented |
| Contract owner abuse | Owner cannot mint/revoke on behalf of providers; owner emergency control only pauses new issuance; no upgrade proxy; two-step ownership transfer |
| Reentrancy | MVP contract makes no external value transfers and no arbitrary external calls; keep code small; still run static analysis and tests |
| SQL injection | Drizzle parameterized queries, Zod validation, no raw interpolated SQL from user data |
| XSS | Render user text as text, sanitize any markdown, no unsafe HTML, CSP |
| CSRF | SameSite cookie, strict Origin/Host validation on mutations, no state changes via GET |
| SSRF | No user-supplied dataset URLs or file fetches; no arbitrary worker endpoint URLs in MVP |
| File upload malware/data leak | No upload endpoint at all in MVP |
| DoS / abuse | Rate limits; bounded payloads; max 5 simulated participants; max 3 rounds; one active run/job; FL service concurrency cap |
| Internal service spoofing | Service bearer token, TLS, strict schema, rotation, never included in frontend bundles |
| Replay/duplicate tx confirmation | Unique tx hash, event argument verification, idempotency keys, confirmed block checks |
| Race conditions | DB transactions, row locks, contract uniqueness, fixed round snapshot and unique round records |
| Malicious model update / poisoning | Synthetic data only; reject NaN/Inf, unexpected tensor count/shape, oversized payloads and out-of-bound metrics; no claim of poisoning resistance |
| Model-update leakage | State plainly that FedAvg updates can reveal information; synthetic data only; no real sensitive data until DP/secure aggregation review |
| Log leakage | Redact tokens, SIWE signatures, salts, private metadata and raw model updates; bounded sanitized exception messages |
| Secret leakage | `.env*` ignored, `.env.example` placeholders only, Vercel/Render secrets, no secret in browser bundle or Git |

### Privacy statements the product may make

Allowed:
- “The MVP does not upload raw datasets to Zorq.”
- “The demo uses synthetic data partitions.”
- “The coordinator records authorization decisions against a specific Portaldot block.”
- “Training contributions are admitted according to the on-chain DataLicense state checked at round boundaries.”

Not allowed:
- “Data is mathematically impossible to leak.”
- “Zorq is HIPAA/GDPR compliant.”
- “Portaldot ZKP/HE is active in this demo” unless those exact proofs/encryption operations are wired and tested.
- “The model is privacy-safe” without a model-update leakage review.

---

## 12. External integrations

### Mandatory for MVP

1. **Portaldot V3 EVM testnet** — contract deployment, wallet transactions and read-only authorization calls. Use the current V3 EVM RPC and chain ID after Phase 1 preflight. User wallets pay native testnet gas.
2. **EVM wallet provider** — injected wallets through wagmi connectors. WalletConnect is optional; MetaMask/injected is the initial required path.
3. **Supabase PostgreSQL** — off-chain metadata, sessions/nonces, runs and audit data. Connect only from server services using Drizzle; no browser database credentials.
4. **Vercel** — Next.js preview and production deployments. Preview environment uses staging database and testnet only.
5. **Render** — Python FL service deployment; internal authenticated API only.
6. **Flower** — federated simulation framework with fixed FedAvg synthetic task.

### Not used in MVP

- Portaldot native FL service: adapter seam only until docs/API/test credential/example are confirmed.
- Portaldot ZKP suite: adapter seam only; no proof claims.
- Portaldot HE service: not integrated.
- Email, SMS, push, analytics, payment, file/object storage and external data provider APIs: not required.

### Failure handling

- Portaldot RPC unavailable: all chain-dependent create/confirm/snapshot operations fail closed; preserve pending UI state and allow retry.
- Wallet rejected: no DB state change to active; user can try again.
- Supabase unavailable: no new entity creation/confirmation; do not pretend success.
- FL service unavailable: run stays failed/queued with clear retry path; no model result displayed.
- Internal auth failure: reject and log security event without exposing token.
- Vercel/Render preview deployment failure: local verification may continue, but report the exact blocker; do not claim deployment.

---

## 13. AI, payments and admin

### AI architecture

No LLM or generative AI service is used. The product demonstrates conventional federated model training through Flower and PyTorch. Model choice and training configuration are fixed and deterministic for the demo. The model output is not treated as a legal/medical/financial recommendation.

### Payments / financial logic

No product payments, escrow, balances, fees, rewards or token economics. The only value transfer is the network fee paid by the user's own wallet for Portaldot testnet transactions. Zorq never holds funds or private keys. The fee token/network display must be verified against the live testnet.

### Admin / operations

No general admin dashboard in MVP. Contract deployer/owner is a restricted operational owner and may pause new asset/job/license issuance during an incident. Revocation remains enabled. Operations use hosting dashboards, sanitized logs, health endpoints and DB administration. Every operator action is documented and must not grant access to dataset contents.

---

## 14. Error and edge-case matrix

| Scenario | Expected behaviour | Recovery |
|---|---|---|
| Wallet absent | Show connect-wallet path; do not load protected resources | Install/connect compatible wallet |
| Wrong chain | Block signing and explain required chain | Switch to chain 420420777 |
| User rejects signature | Keep unauthenticated; show neutral message | Retry SIWE |
| SIWE nonce expired/reused | Reject and clear challenge | Request new nonce |
| Asset draft duplicate | Return idempotent original or conflict | Reuse original draft or create a new one |
| Chain tx reverted | Mark pending record `tx_failed`; never activate | Show revert reason if safely decoded; allow new draft |
| Chain RPC unavailable | Fail closed | Retry after RPC recovers |
| Wrong transaction contract/sender/event | Reject confirmation; audit suspicious mismatch | Submit correct transaction |
| Asset owner mismatch | 403/404; contract write reverts | Connect owner wallet |
| Job paused/closed | Do not issue license or start next round | Creator resumes if still paused; closed is terminal |
| License expired | Deny and show expired | Provider may reissue within active job window |
| License revoked | Deny; no reactivation | Provider may issue a new revision if job/asset allow |
| License revoked mid-round | Current snapshot round may complete; next snapshot excludes it | Verify next round authorization record |
| Too few authorized participants | Do not start next round; fail run clearly | Provider issues new licenses or creator starts new job/run after repair |
| Worker unavailable | Exclude failed client; continue only if minimum successful authorized participants still met | Restart worker/new run |
| Flower returns bad parameters | Reject update; if fewer than min accepted, fail run | Investigate worker; new run |
| Internal token invalid | Reject request; no run/authorization change | Rotate/fix service secret |
| DB failure after chain tx | Chain remains authoritative; frontend shows reconciliation pending | Retry confirmation; recovery endpoint re-reads chain/event |
| Chain reorg | Do not confirm until threshold; flag if previously confirmed block non-canonical | Reconcile affected entities and pause new runs if needed |
| Duplicate run start | Return existing run for same idempotency key; otherwise 409 if active run exists | Monitor existing run |
| Concurrent revoke/start | Snapshot block determines the round's policy; next round uses new block | UI explains fixed round boundary |
| Unknown route | Branded 404/not-found page | Navigate to valid route |
| Unauthorized private resource | 404 or 403 without metadata leakage | Switch to owning wallet |
| Model metrics absent | Show metric unavailable; do not fabricate | Keep run result status with explanation |
| Final model hash absent | Run cannot be marked completed | Mark failed or rerun; do not invent hash |

---

## 15. Test strategy and acceptance criteria

### Unit tests

- Hash canonicalization for purpose and model config is stable.
- Job and license date-window validation, including exclusive end boundary.
- License revision/re-issuance rules.
- API role/ownership policy functions.
- SIWE message validation helper.
- Authorization response mapping.
- Flower allowlist and update filtering logic.
- Model parameter shape/NaN/Inf checks.

### Contract tests (Hardhat 3)

- Asset registration emits correct event and prevents duplicate IDs.
- Only asset owner can deactivate/issue license.
- Only job creator can change job state.
- Job state transitions obey the state machine.
- Job and license windows are enforced using `block.timestamp`.
- License binds asset, job, owner, purpose/config through job ID.
- Non-transferability: transfer and approvals revert.
- Revoke is terminal and only owner can invoke.
- Duplicate active license prevented; new revision permitted after revoke/expiry.
- `checkAuthorization` returns deterministic success/failure reasons.
- Fuzz boundary timestamps and unauthorized caller addresses.

### Integration tests

- Next.js API with local Hardhat node and test wallet.
- SIWE nonce one-time semantics and cookie settings.
- DB transaction updates entity + chain transaction + audit together.
- Confirmation endpoint rejects a valid tx from the wrong contract/sender/event arguments.
- Authorization snapshot reads every license at one block and persists block hash.
- Internal service token failure is rejected.
- Flower strategy fetches snapshot before each round and filters unauthorized clients.
- Revoke between rounds excludes provider at next round.
- Portaldot testnet smoke test verifies chain ID, RPC, deploy/read/write/gas in a separate explicit testnet run.

### End-to-end tests

1. New wallet -> connect -> SIWE -> dashboard.
2. Wallet A -> register asset A -> transaction confirmed -> owner detail.
3. Wallet B or same test wallet -> register asset B -> transaction confirmed.
4. Researcher wallet -> create job -> publish -> public job detail.
5. Asset owners -> issue licenses to job -> verify tokens and owner binding.
6. Researcher -> start run -> three round snapshots -> complete -> metrics/hash visible.
7. Revoke license between round 1 and 2 -> next round excludes it; if below min, run stops.
8. Expire license / pause job -> next round denied.
9. Unauthorized wallet attempts private asset read, license read and run start -> rejected.
10. RPC or FL service error -> no false success; clear failure state.

### Security tests

- SIWE signature replay, wrong domain, wrong chain ID, expired nonce, reused nonce.
- Cookie flags, session expiry and logout.
- IDOR attempts on all UUID/chain ID endpoints.
- Forged tx hash, wrong sender, wrong contract, wrong event arguments, failed receipt.
- Wrong asset/job license, transfer attempt, unauthorized revocation.
- SQL injection strings and XSS payloads in title/description/purpose.
- CSRF/Origin mismatch.
- Rate-limit bypass attempts and payload size abuse.
- Internal service endpoint called without/with wrong token.
- Worker sends unknown client ID, NaN, Inf, malformed tensor shape or oversized update.
- Coordinator receives no/ambiguous chain state and fails closed.

### MVP acceptance gate

All 10 items in §7.8 must pass on the deployed preview. Additionally:
- Contract deployed on Portaldot V3 testnet; contract address, chain ID, deployment tx and explorer link recorded.
- At least one real user-wallet transaction consumed native testnet gas. Confirm exact gas asset/funding path on V3; do not assume Substrate and EVM account funding are automatically interchangeable.
- No real dataset or production secret appears in preview, logs, repository or public UI.
- Every core action has an evidence-backed success/failure state.
- Build, lint, unit, integration, contract and E2E tests pass; remaining exceptions are explicitly documented and operator-approved.
- Final visual phase remains blocked until functionality gate, references/mockups and explicit operator approval are complete.

---

## 16. Product and integration assumptions that must remain visible

| ID | Assumption / boundary | Treatment |
|---|---|---|
| A-01 | Portaldot V3 EVM-compatible RPC and ERC-721-compatible execution are available | Verify chain ID/RPC and deploy a tiny contract before building full registry |
| A-02 | Portaldot's advertised native FL framework may exist but public developer API is not established in the docs reviewed | Do not claim native FL integration; use Flower demo adapter; keep `FLExecutionProvider` interface for later native adapter |
| A-03 | Portaldot advertises ZKP/HE/federated learning in older developer overview | No production ZKP/HE claim until exact API and cryptographic flow are tested |
| A-04 | Testnet token funding may be issued to native SS58 accounts while the DApp uses EVM H160 wallets | Confirm EVM gas funding/mapping with Portaldot support before relying on testnet deployment |
| A-05 | Round-level enforcement is achievable because the coordinator is under Zorq's control | Document coordinator as a trust boundary; use a single-block snapshot and fail-closed policy |
| A-06 | Synthetic Flower simulation demonstrates algorithm and policy integration, not independent enterprise infrastructure | UI and pitch label clients as simulated demo participants; real provider-hosted worker agents are future scope |
| A-07 | Non-transferable ERC-721 is the safest MVP license representation | Transfers/approvals are disabled; no trading or secondary rights |
| A-08 | Hash commitments are not encryption | Keep metadata and salts off-chain; do not call commitments confidential storage |

## 17. References

- User-provided `PROPER_VIBE_CODING_WORKFLOW_REVISED(6).md` — governing sequencing and agent discipline.
- Portaldot V3 network announcements and current testnet endpoints: https://x.com/Portaldot_Dev (network post dated 23 October 2026; mirror captured at https://teapawt.net/PortaldotL0).
- Portaldot developer documentation: https://portaldot-dev.readthedocs.io/en/latest/ and https://portaldot-dev.readthedocs.io/en/latest/Introduction.html.
- Portaldot Hacker House listing: https://dorahacks.io/hackathon/portaldot-hacker-house-2026/detail (verify exact submission requirements in DoraHacks before submission).
- Flower FL framework: https://flower.ai/docs/framework/ and https://flower.ai/docs/examples/quickstart-pytorch.html.
- EIP-4361 SIWE: https://eips.ethereum.org/EIPS/eip-4361.
- OpenZeppelin Contracts 5.x: https://docs.openzeppelin.com/contracts/5.x.

---

**Specification rule:** Any proposed change to user roles, asset visibility, license rights, authorization timing, model scope, raw-data handling or state transitions is a product decision and requires operator approval. The coding agent may not change these behaviours independently.
