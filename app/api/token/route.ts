import { NextResponse } from "next/server";

const CNDL_MINT = "9dXSV8VWuYvGfTzqvkBeoFwH9ihVTybDuWo5VaJPCNDL";

export async function GET() {
  const heliusKey = process.env.HELIUS_API_KEY;
  if (!heliusKey) return NextResponse.json({ error: "No Helius key" }, { status: 500 });

  try {
    // Get token metadata + supply
    const assetRes = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getAsset",
        params: { id: CNDL_MINT },
      }),
    });
    const assetData = await assetRes.json();

    // Get top holders
    const holdersRes = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "2",
          method: "getTokenLargestAccounts",
          params: [CNDL_MINT],
        }),
      }
    );
    const holdersData = await holdersRes.json();

    // Get price from Jupiter
    const priceRes = await fetch(
      `https://price.jup.ag/v6/price?ids=${CNDL_MINT}`
    );
    const priceData = await priceRes.json();
    const price = priceData?.data?.[CNDL_MINT]?.price ?? null;

    // Get holder count from Helius
    const holderCountRes = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "3",
          method: "getTokenAccounts",
          params: {
            mint: CNDL_MINT,
            limit: 1,
            displayOptions: { showZeroBalance: false },
          },
        }),
      }
    );
    const holderCountData = await holderCountRes.json();
    const holderCount = holderCountData?.result?.total ?? null;

    const supply = assetData?.result?.token_info?.supply ?? null;
    const decimals = assetData?.result?.token_info?.decimals ?? 0;
    const adjustedSupply = supply ? supply / Math.pow(10, decimals) : null;

    const topHolders = holdersData?.result?.value ?? [];

    return NextResponse.json(
      { mint: CNDL_MINT, supply: adjustedSupply, decimals, price, holderCount, topHolders: topHolders.slice(0, 10) },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET" } });
}
