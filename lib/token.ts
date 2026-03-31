const CNDL_MINT = "9dXSV8VWuYvGfTzqvkBeoFwH9ihVTybDuWo5VaJPCNDL";
const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";

async function rpc(method: string, params: unknown) {
  const res = await fetch(PUBLIC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "1", method, params }),
    next: { revalidate: 120 },
  });
  const data = await res.json();
  return data?.result ?? null;
}

export async function fetchTokenData() {
  try {
    const [supplyResult, topHoldersResult, dexRes] = await Promise.all([
      rpc("getTokenSupply", [CNDL_MINT]),
      rpc("getTokenLargestAccounts", [CNDL_MINT]),
      fetch(`https://api.dexscreener.com/latest/dex/tokens/${CNDL_MINT}`, {
        next: { revalidate: 60 },
      }),
    ]);

    const dexData = await dexRes.json();

    const decimals = supplyResult?.value?.decimals ?? 6;
    const supply = supplyResult?.value?.uiAmount ?? null;
    const topHolders = (topHoldersResult?.value ?? []).map((h: { address: string; amount: string; uiAmount: number }) => ({
      address: h.address,
      amount: h.amount,
      uiAmount: h.uiAmount,
    }));

    // DexScreener: pick the pair with highest liquidity
    const pairs: {
      priceUsd?: string;
      liquidity?: { usd?: number };
      marketCap?: number;
      fdv?: number;
      volume?: { h24?: number };
      priceChange?: { h24?: number };
    }[] = dexData?.pairs ?? [];

    const bestPair = pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

    const price      = bestPair?.priceUsd   ? parseFloat(bestPair.priceUsd) : null;
    const marketCap  = bestPair?.marketCap  ?? null;
    const fdv        = bestPair?.fdv        ?? null;
    const volume24h  = bestPair?.volume?.h24 ?? null;
    const change24h  = bestPair?.priceChange?.h24 ?? null;
    const liquidity  = bestPair?.liquidity?.usd ?? null;

    return {
      mint: CNDL_MINT,
      supply,
      decimals,
      price,
      marketCap,
      fdv,
      volume24h,
      change24h,
      liquidity,
      holderCount: null,   // no free on-chain holder count API without Helius
      topHolders: topHolders.slice(0, 10),
    };
  } catch {
    return null;
  }
}
