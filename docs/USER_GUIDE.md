# Zorq MVP — User Guide

**Audience:** data providers and researchers testing the Zorq synthetic-data demonstration.

## What Zorq does

Zorq lets a data owner authorize one registered asset to participate in one particular federated-learning job under a stated purpose and validity window. A coordinator checks the license on Portaldot before admitting participants and at each training-round boundary.

## Important limitations

- Use synthetic demo data only. Do not upload real patient, banking, insurance, customer or personal data.
- The MVP does not accept dataset files. It registers an opaque asset reference associated with a generated synthetic partition.
- Flower is the MVP execution adapter. The demo uses simulated clients, not separately operated provider nodes. The app does not claim the built-in Portaldot FL or ZKP APIs have been integrated.
- FL alone does not guarantee that model updates or outputs cannot leak information.
- Testnet transactions are experimental and have no mainnet value.

## Connect your wallet

1. Open the actual Zorq application URL supplied by the operator.
2. Choose Connect Wallet and select the intended EVM wallet.
3. Switch to Portaldot V3 testnet (chain ID `420420777`) when prompted.
4. Sign the SIWE login message. This is a message signature, not a token transfer.
5. The app opens your dashboard. Do not share a seed phrase or private key.

## Register a synthetic asset

1. Open Assets and choose Register asset.
2. Enter a display name/description that contains no personal information.
3. Select an available synthetic demo partition.
4. Review the no-upload notice and confirm.
5. Review the wallet transaction and sign `registerAsset`.
6. After your wallet includes the transaction, Zorq returns to the Assets list immediately and shows the new row with a **pending** badge.
7. The list polls the backend every few seconds. The badge changes to **active** after the contract event is confirmed. Open the asset detail page to see registration evidence.

## Create a training job

1. Open Jobs and choose Create job.
2. Enter title, description and a clear purpose statement.
3. Select the fixed `synthetic-binary-classifier-v1` preset (8 numeric features, logistic classifier, fixed three-round FedAvg settings; no arbitrary model uploads).
4. Set valid start/end times within the product's maximum 30-day window.
5. Review the three-round, 2–5 participant demo limits and publish transaction.
6. After your wallet includes the transaction, Zorq returns to the Jobs list and shows the new job as **pending**. The list promotes it to **open** once the contract event is confirmed.

## Issue a DataLicense

1. Open an Open job and choose License an asset.
2. Select an asset you own.
3. Review job purpose/configuration and validity window.
4. Confirm that the selected data is synthetic demo data.
5. Sign the `issueLicense` transaction in your wallet.
6. After wallet inclusion, Zorq returns to the Licenses list and shows the new license as **pending**. The list promotes it to **active** after the mint event is confirmed.

A license does not grant general dataset access or authorize other jobs. It is bound to the selected asset and job. Each unique asset consumes one of the job’s lifetime participant slots; revoking/expiring it does not let a different asset take that slot, although the same asset may be re-licensed.

## Start a run

1. The job creator opens the job and chooses Start run.
2. Zorq checks that at least two distinct assets have valid licenses and there is no active run.
3. The coordinator requests an authorization snapshot from the contract at one confirmed block.
4. Only allowed synthetic clients are sent to the Flower coordinator.
5. A fresh authorization snapshot is required at each round boundary.
6. The dashboard shows progress, number of authorized participants, round metrics, and the final model hash.

## Revoke a license

1. Open your license detail.
2. Choose Revoke and review the irreversible revocation notice.
3. Sign `revokeLicense` with the asset-owning wallet.
4. Wait for confirmation.

If the revocation is mined after a round's authorization snapshot, a contribution already admitted in that round may complete. The next round must obtain a fresh snapshot and exclude the revoked license. The current round is not retroactively undone.

## Pause, resume or close a job

Only the job creator can change job state. Pause blocks future admission/rounds. Resume restores Open if the job has not expired. Close is terminal. Providers retain the ability to revoke their own licenses even if the job is paused or the platform pauses new issuance.

## Troubleshooting

- **Wrong network:** switch wallet to chain ID `420420777`.
- **Insufficient gas:** confirm the official testnet process for funding your EVM wallet. Do not assume a native SS58 address and EVM address share funds automatically.
- **Transaction pending:** the item appears in the relevant list with a **pending** badge. Keep the list open; it polls every few seconds and switches to **active** after confirmation. Do not send a second transaction.
- **Transaction failed or rejected:** the wallet error is shown and the unsubmitted draft is discarded, so it cannot appear as a ghost row. If the wallet reports insufficient tPOT, fund the wallet and start a new attempt.
- **Draft from an interrupted session:** unsubmitted drafts are hidden from all lists and are removed automatically after 30 minutes. Pending rows without a transaction hash are also cleaned up.
- **License denied:** verify asset ownership, job state, validity interval, revocation and exact job binding.
- **Run blocked:** ensure at least two distinct active licenses and that the chain/RPC and FL service are healthy.
- **Run stopped:** the system fails closed if authorization cannot be established. Check the recorded error and try again only after the cause is resolved.

## Support

Use only the actual support link published in the deployed app. This guide does not invent a contact address.


## Current testnet workflow

1. Open `https://zorq-git-preview-uhhh2.vercel.app/app` with a Substrate wallet extension (polkadot.js, Talisman or SubWallet).
2. Connect the wallet and sign the SIWE message; this creates an eight-hour session.
3. Register a synthetic asset (partition 0–4). The wallet signs `registerAsset`.
4. Create a job with a public purpose and a 2–5 asset cohort cap. The wallet signs `createJob`.
5. On the job detail, issue a DataLicense for an owned active asset. The wallet signs `issueLicense`.
6. Repeat for at least two distinct assets, then start the three-round run.
7. Open the run monitor to see each round's snapshot block, authorized/aggregated count and aggregate metrics.
8. Revoke a license between rounds. The next snapshot denies it; if at least two authorized assets remain, later rounds continue.
