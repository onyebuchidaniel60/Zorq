# Portaldot V3 Integration Validation Record

**Prepared:** 4 November 2026  
**Status:** evidence baseline; must be reconfirmed during Phase 0/3 using live network and official channels.

## Network parameters currently recorded

| Item | Recorded value |
|---|---|
| Network | Portaldot V3 Testnet |
| Chain ID | `420420777` |
| EVM RPC | `https://test-evm-rpc-v3.portaldot.dev` |
| Substrate WebSocket | `wss://test-node-v3.portaldot.dev` |
| Explorer base | `https://scanner-testnet-v3.portaldot.dev/` |

A Portaldot developer announcement reports that V3 testnet RPC endpoints were updated while chain ID `420420777` remained unchanged. It also says test-token distribution requires a native POT SS58 address beginning with `5`, not an EVM `0x` address. The team must verify the current announcement and exact gas-funding path before deploying or transacting.

## Evidence matrix

| Capability | Current evidence | Zorq decision |
|---|---|---|
| V3 EVM execution | Portaldot V3 communications advertise EVM support; testnet RPC and chain ID are published | Use Solidity/EVM for MVP after live smoke test |
| ERC-721 | V3 communications advertise ERC-721 support | Use OpenZeppelin ERC-721 as license representation; validate standard calls on V3 |
| WASM/ink! | Older developer documentation lists Python SDK, Substrate contracts and ink! interfaces; V3 says WASM support | Not used in MVP; avoid cross-runtime dependency |
| Built-in FL | Older overview advertises distributed ML/FL and HE | No developer-ready job/participant/round API confirmed; use Flower demo adapter |
| ZKP | Older overview advertises ZKP | No confirmed proof generation/verification API suitable for this workflow; no ZKP claim in MVP |
| Native gas | Network distribution instructions mention native SS58 funding address | Verify H160 funding/mapping before test transaction |

## Phase 0/3 live preflight checklist

- [ ] Fetch `eth_chainId`; verify `420420777`.
- [ ] Fetch `eth_blockNumber` and ensure it advances.
- [ ] Check `eth_getBalance` for disposable H160 test wallet.
- [ ] Estimate gas for a small deployment or test transaction.
- [ ] Confirm wallet can switch/add network with the same chain ID/RPC.
- [ ] Confirm exact route to fund EVM H160 account; obtain written guidance if ambiguous.
- [ ] Compile `ZorqRegistry` with pinned Solidity compiler.
- [ ] Deploy test contract on V3 EVM.
- [ ] Call `owner`, `supportsInterface(ERC721)`, `getAsset`/read method and `checkAuthorization`.
- [ ] Submit one user-signed registration transaction; confirm receipt, events and state read-back.
- [ ] Verify explorer links for transaction and contract.
- [ ] Record block, endpoint, contract address, tx hash, compiler settings and evidence.

## FL/ZKP verification gate for any future native adapter

Do not implement a `PortaldotNativeFLProvider` or Portaldot ZKP adapter from high-level marketing text. Required evidence before scope change:

1. Official current developer documentation for external API/SDK or contract interface.
2. Actual API methods for job creation, participant registration, round execution, status/results and authorization hook or coordinator integration.
3. API authentication/permissions and network/environment access.
4. Working minimal sample or support-provided example.
5. Successful testnet execution and observable result.
6. Operator-approved impact analysis and architecture change.

## Sources to recheck

- Portaldot developer documentation: https://portaldot-dev.readthedocs.io/en/latest/
- Portaldot introduction (high-level FL/ZKP/HE claims): https://portaldot-dev.readthedocs.io/en/latest/Introduction.html
- Portaldot developer channel: https://x.com/Portaldot_Dev
- Portaldot Hacker House listing: https://dorahacks.io/hackathon/portaldot-hacker-house-2026/detail

This document is a validation checklist, not a claim that all checks have already passed.
