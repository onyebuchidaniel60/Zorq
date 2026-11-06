const DEFAULT_EXPLORER_BASE = "https://scanner-testnet-v3.portaldot.dev";

export function explorerBase(): string {
  return (
    process.env.NEXT_PUBLIC_PORTALDOT_EXPLORER_URL ?? DEFAULT_EXPLORER_BASE
  ).replace(/\/+$/, "");
}

export function explorerTxUrl(txHash: string | null | undefined): string | null {
  if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return null;
  }
  return `${explorerBase()}/#/extrinsics/${txHash}`;
}
