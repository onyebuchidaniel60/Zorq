# Zorq Demo Narration

Organizations hold useful data, but collaborative machine learning often requires broad access that outlives the job. Zorq makes authorization execution-scoped. A DataLicense binds one registered asset to one federated-learning job: its purpose hash, fixed model configuration, validity window, and owner. The license is a non-transferable ERC-721. Only the asset owner can issue or revoke it.

This demonstration uses synthetic data on the Portaldot V3 EVM testnet. Three assets are licensed to one job. The workspace shows the on-chain asset commitments, the public job definition, and the active licenses. The coordinator is a Flower demonstration service. Before each round, it requests one authorization snapshot from the Zorq backend.

Rounds one and two authorize all three assets. After round two's snapshot, one license is revoked. The revocation transaction is mined at block 341655. The next snapshot is block 341656. The revoked token is denied, and two authorized assets continue. The run completes three rounds and records a final model hash.

The authoritative contract is deployed at 0xa9ab18d404e2cd19c23f30e7d78a740b562685ff, chain ID 420420777. Postgres mirrors metadata and audit history, but cannot grant a right the chain denies. This is a synthetic-data testnet prototype: Flower is a demonstration adapter, and no native Portaldot FL, ZKP, or homomorphic-encryption integration is claimed. Code, documentation, and run evidence are in the public repository.
