import { auth } from "@/auth";
import { NextResponse } from "next/server";

const CNDL_MINT = "9dXSV8VWuYvGfTzqvkBeoFwH9ihVTybDuWo5VaJPCNDL";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.discordId) {
    return NextResponse.json({ error: "Discord identity not found in session" }, { status: 401 });
  }

  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";

  const [upstream, dexRes] = await Promise.all([
    fetch(`${trackerUrl}/api/submissions/${session.user.discordId}`, { cache: "no-store" }),
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${CNDL_MINT}`, { next: { revalidate: 60 } }),
  ]);

  const data = await upstream.json();
  const usdCpm: number = typeof data.usd_cpm === "number" ? data.usd_cpm : 5;

  let tokenPrice: number | null = null;
  try {
    const dexData = await dexRes.json();
    const pairs = dexData?.pairs ?? [];
    const best = pairs.sort((a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
      (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    )[0];
    tokenPrice = best?.priceUsd ? parseFloat(best.priceUsd) : null;
  } catch { /* ignore price fetch failure */ }

  // Recalculate cndl_owed based on live USD CPM / live token price
  if (Array.isArray(data.posts) && tokenPrice && tokenPrice > 0) {
    data.posts = data.posts.map((p: { views: number; multiplier?: number; [key: string]: unknown }) => ({
      ...p,
      cndl_owed: (((p.views * (p.multiplier ?? 1)) / 1000) * (usdCpm / tokenPrice!)).toFixed(2),
    }));
  }

  return NextResponse.json({ ...data, cpm: usdCpm, tokenPrice }, { status: upstream.status });
}
