import { NextResponse } from "next/server";

const CNDL_MINT = "9dXSV8VWuYvGfTzqvkBeoFwH9ihVTybDuWo5VaJPCNDL";
const CORS = { "Access-Control-Allow-Origin": "*" };

async function rpc(key: string, method: string, params: unknown) {
  const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "1", method, params }),
  });
  const data = await res.json();
  return data?.result ?? null;
}

export async function GET() {
  const heliusKey = process.env.HELIUS_API_KEY;
  if (!heliusKey) return NextResponse.json({ error: "No Helius key" }, { status: 500, headers: CORS });

  try {
    const [supplyResult, topHoldersResult, priceRes, holderRes] = await Promise.all([
      rpc(heliusKey, "getTokenSupply", [CNDL_MINT]),
      rpc(heliusKey, "getTokenLargestAccounts", [CNDL_MINT]),
      fetch(`https://api.dexscreener.com/latest/dex/tokens/${CNDL_MINT}`),
      fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: "2",
          method: "getTokenAccounts",
          params: { mint: CNDL_MINT, limit: 1, options: { showZeroBalance: false } },
        }),
      }),
    ]);

    const priceData  = await priceRes.json();
    const holderData = await holderRes.json();

    const decimals   = supplyResult?.value?.decimals ?? 0;
    const supply     = supplyResult?.value?.uiAmount ?? null;
    const topHolders = topHoldersResult?.value ?? [];
    const holderCount = holderData?.result?.total ?? null;

    const pairs = priceData?.pairs ?? [];
    const bestPair = pairs.sort((a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
      (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    )[0];
    const price = bestPair?.priceUsd ? parseFloat(bestPair.priceUsd) : null;

    return NextResponse.json(
      { mint: CNDL_MINT, supply, decimals, price, holderCount, topHolders: topHolders.slice(0, 10) },
      { headers: CORS }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "GET" } });
}
