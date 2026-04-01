import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ADMIN_USERS = ["rich.cndl", ".aleedotg"];
const CNDL_MINT = "9dXSV8VWuYvGfTzqvkBeoFwH9ihVTybDuWo5VaJPCNDL";
const USD_CPM = 5;

export async function GET() {
  const session = await auth();
  if (!session || !ADMIN_USERS.includes(session.user.discordTag ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";

  const [postsRes, walletsRes, dexRes] = await Promise.all([
    fetch(`${trackerUrl}/api/posts`, { cache: "no-store" }),
    fetch(`${trackerUrl}/api/wallets`, { cache: "no-store" }),
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${CNDL_MINT}`, { next: { revalidate: 60 } }),
  ]);

  const allPosts  = await postsRes.json();
  const allWallets = await walletsRes.json();

  let tokenPrice: number | null = null;
  try {
    const dexData = await dexRes.json();
    const pairs = dexData?.pairs ?? [];
    const best = pairs.sort((a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) =>
      (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    )[0];
    tokenPrice = best?.priceUsd ? parseFloat(best.priceUsd) : null;
  } catch { /* ignore */ }

  // Build wallet lookup by discord_id
  type Wallet = { discord_id: string; wallet_address: string };
  const walletMap: Record<string, string> = {};
  if (Array.isArray(allWallets)) {
    allWallets.forEach((w: Wallet) => { walletMap[w.discord_id] = w.wallet_address; });
  }

  // Get start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  // Filter approved posts for this week
  const approved = Array.isArray(allPosts)
    ? allPosts.filter((p: { approved: number; submitted_at: string }) =>
        p.approved === 1 && new Date(p.submitted_at) >= weekStart
      )
    : [];

  // Group by user
  type UserEntry = {
    discord_id: string;
    discord_tag: string;
    wallet_address: string | null;
    total_views: number;
    post_count: number;
    cndl_owed: string;
    usd_owed: string;
  };

  const byUser: Record<string, UserEntry> = {};
  approved.forEach((p: { discord_id: string; discord_tag: string; views: number; multiplier?: number }) => {
    if (!byUser[p.discord_id]) {
      byUser[p.discord_id] = {
        discord_id: p.discord_id,
        discord_tag: p.discord_tag,
        wallet_address: walletMap[p.discord_id] ?? null,
        total_views: 0,
        post_count: 0,
        cndl_owed: "0",
        usd_owed: "0",
      };
    }
    byUser[p.discord_id].total_views += p.views * (p.multiplier ?? 1);
    byUser[p.discord_id].post_count += 1;
  });

  const tasks = Object.values(byUser).map(u => {
    const usd = (u.total_views / 1000) * USD_CPM;
    const cndl = tokenPrice && tokenPrice > 0
      ? (usd / tokenPrice).toFixed(2)
      : usd.toFixed(2);
    return { ...u, cndl_owed: cndl, usd_owed: usd.toFixed(2) };
  }).sort((a, b) => parseFloat(b.cndl_owed) - parseFloat(a.cndl_owed));

  return NextResponse.json({ tasks, tokenPrice, weekStart: weekStart.toISOString() });
}
