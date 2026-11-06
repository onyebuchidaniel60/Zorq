# Zorq Demo Narration

Artificial intelligence is bottlenecked by data privacy. Organizations hold valuable data, but they cannot share it. Existing solutions grant broad, indefinite access. Enter Zorq: programmable authorization for federated learning.

A Zorq DataLicense binds one registered asset to one federated-learning job. It fixes the purpose, the model configuration, the validity window and the owner. The license is non-transferable, and only the asset owner can issue or revoke it. Authorization is not a setting in a dashboard; it is contract state that the coordinator must read.

This demonstration uses synthetic data on the Portaldot V3 EVM testnet. Three assets are licensed to one job. The workspace shows the on-chain asset commitments, the public job definition and the active licenses. A Flower demonstration service acts as the coordinator. Before every round, it requests one authorization snapshot from the Zorq backend. Every candidate license is read at one confirmed contract state.

Rounds one and two authorize all three assets. After round two's snapshot, one license is revoked. The next snapshot sees the revocation and denies that token. Two authorized assets continue, and the run completes three rounds with a final model hash. The revocation does not rewrite the round that already finished; it changes the next round.

The deployed Portaldot contract is authoritative. Postgres mirrors metadata and audit history, but it cannot grant a right the chain denies. This is a synthetic-data testnet prototype. Flower is a demonstration adapter, and no native Portaldot federated-learning, zero-knowledge or homomorphic-encryption integration is claimed. Code, documentation and run evidence are in the public repository.
