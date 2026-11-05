import { NextResponse } from "next/server";
import { getSql } from "@zorq/db";

export const dynamic = "force-dynamic";

const CHAIN_ID = 420420777;
const RPC_URL = process.env.PORTALDOT_EVM_RPC_URL ?? "https://test-evm-rpc-v3.portaldot.dev";

async function checkChain(): Promise<{ ok: boolean; detail: string }> {
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_chainId",
        params: [],
        id: 1,
      }),
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, detail: "rpc_unavailable" };
    }

    const payload = (await response.json()) as { result?: unknown };
    const chainId =
      typeof payload.result === "string" ? Number.parseInt(payload.result, 16) : NaN;

    return chainId === CHAIN_ID
      ? { ok: true, detail: "chain_id_verified" }
      : { ok: false, detail: "wrong_chain_id" };
  } catch {
    return { ok: false, detail: "rpc_unavailable" };
  }
}

async function checkDatabase(): Promise<{ ok: boolean; detail: string }> {
  try {
    await getSql()`select 1 as ok`;
    return { ok: true, detail: "connected" };
  } catch {
    return { ok: false, detail: "unavailable" };
  }
}

export async function GET() {
  const database = await checkDatabase();
  const contract = process.env.ZORQ_CONTRACT_ADDRESS ? "configured" : "not_deployed";
  const chain = await checkChain();
  const ready = database.ok && contract === "configured" && chain.ok;

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      dependencies: {
        database: database.detail,
        chain: chain.detail,
        contract,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
