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
6. Wait for chain confirmation and the app's event verification.
7. Open the asset detail page to see active status and registration evidence.

## Create a training job

1. Open Jobs and choose Create job.
2. Enter title, description and a clear purpose statement.
3. Select the fixed `synthetic-binary-classifier-v1` preset (8 numeric features, logistic classifier, fixed three-round FedAvg settings; no arbitrary model uploads).
4. Set valid start/end times within the product's maximum 30-day window.
5. Review the three-round, 2–5 participant demo limits and publish transaction.
6. After contract confirmation, the job becomes Open.

## Issue a DataLicense

1. Open an Open job and choose License an asset.
2. Select an asset you own.
3. Review job purpose/configuration and validity window.
4. Confirm that the selected data is synthetic demo data.
5. Sign the `issueLicense` transaction in your wallet.
6. After confirmation, the non-transferable DataLicense appears in your Licenses list.

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
- **Transaction pending:** wait for confirmation; do not send repeated transactions. Refresh to inspect transaction status.
- **Transaction failed:** review the failure message; the draft may need to be retried with a new idempotency key.
- **License denied:** verify asset ownership, job state, validity interval, revocation and exact job binding.
- **Run blocked:** ensure at least two distinct active licenses and that the chain/RPC and FL service are healthy.
- **Run stopped:** the system fails closed if authorization cannot be established. Check the recorded error and try again only after the cause is resolved.

## Support

Use only the actual support link published in the deployed app. This guide does not invent a contact address.
