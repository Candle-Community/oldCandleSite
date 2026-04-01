import { NextResponse } from "next/server";

const CNDL_MINT = "9dXSV8VWuYvGfTzqvkBeoFwH9ihVTybDuWo5VaJPCNDL";
const USD_CPM = 5;

export async function GET() {
  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";

  const [postsRes, dexRes] = await Promise.all([
    fetch(`${trackerUrl}/api/posts`, { cache: "no-store" }),
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${CNDL_MINT}`, { next: { revalidate: 60 } }),
  ]);

  const allPosts = await postsRes.json();

  let tokenPrice: number | null = null;
  try {
    const dexData = await dexRes.json();
    const pairs = dexData?.pairs ?? [];
    const best = pairs.sort((a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
      (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    )[0];
    tokenPrice = best?.priceUsd ? parseFloat(best.priceUsd) : null;
  } catch { /* ignore */ }

  // Group approved posts by user
  const approved = Array.isArray(allPosts) ? allPosts.filter((p: { approved: number }) => p.approved === 1) : [];

  type UserMap = Record<string, { discord_tag: string; x_handle: string; total_views: number; post_count: number }>;
  const byUser = approved.reduce((acc: UserMap, p: { discord_id: string; discord_tag: string; x_handle: string; views: number; multiplier?: number }) => {
    if (!acc[p.discord_id]) {
      acc[p.discord_id] = { discord_tag: p.discord_tag, x_handle: p.x_handle, total_views: 0, post_count: 0 };
    }
    acc[p.discord_id].total_views += p.views * (p.multiplier ?? 1);
    acc[p.discord_id].post_count += 1;
    return acc;
  }, {});

  const members = Object.entries(byUser).map(([discord_id, u]) => {
    const cndl_owed = tokenPrice && tokenPrice > 0
      ? ((u.total_views / 1000) * (USD_CPM / tokenPrice)).toFixed(2)
      : ((u.total_views / 1000) * USD_CPM).toFixed(2);
    const usd_owed = ((u.total_views / 1000) * USD_CPM).toFixed(2);
    return { discord_id, ...u, cndl_owed, usd_owed };
  }).sort((a, b) => parseFloat(b.cndl_owed) - parseFloat(a.cndl_owed));

  return NextResponse.json({ members, tokenPrice });
}
