const CNDL_MINT = "9dXSV8VWuYvGfTzqvkBeoFwH9ihVTybDuWo5VaJPCNDL";

export async function fetchTokenData() {
  const heliusKey = process.env.HELIUS_API_KEY;
  if (!heliusKey) return null;

  try {
    const [assetRes, holdersRes, priceRes] = await Promise.all([
      // Token metadata + supply
      fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "1", method: "getAsset", params: { id: CNDL_MINT } }),
        next: { revalidate: 300 },
      }),
      // Top holders
      fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "2", method: "getTokenLargestAccounts", params: [CNDL_MINT] }),
        next: { revalidate: 300 },
      }),
      // Price from Jupiter v2
      fetch(`https://api.jup.ag/price/v2?ids=${CNDL_MINT}`, { next: { revalidate: 60 } }),
    ]);

    const assetData = await assetRes.json();
    const holdersData = await holdersRes.json();
    const priceData = await priceRes.json();

    const supply = assetData?.result?.token_info?.supply ?? null;
    const decimals = assetData?.result?.token_info?.decimals ?? 0;
    const adjustedSupply = supply ? supply / Math.pow(10, decimals) : null;
    const price = priceData?.data?.[CNDL_MINT]?.price ?? null;
    const topHolders = holdersData?.result?.value ?? [];

    // Derive holder count from Helius REST API
    const holderCountRes = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${heliusKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mintAccounts: [CNDL_MINT] }),
        next: { revalidate: 300 },
      }
    );
    const holderCountData = await holderCountRes.json();
    const holderCount = holderCountData?.[0]?.onChainAccountInfo?.accountInfo?.data?.parsed?.info?.holderCount ?? null;

    return {
      mint: CNDL_MINT,
      supply: adjustedSupply,
      decimals,
      price,
      holderCount,
      topHolders: topHolders.slice(0, 10),
    };
  } catch {
    return null;
  }
}
