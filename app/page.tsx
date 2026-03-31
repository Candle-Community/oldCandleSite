import HomeDashboard from "@/components/HomeDashboard";
import { fetchDiscordData } from "@/lib/discord";
import { fetchTokenData } from "@/lib/token";

const TRACKER_API = process.env.TRACKER_API_URL || "http://localhost:3001";

async function fetchTrackerData() {
  try {
    const [leaderboardRes, statsRes, postsRes] = await Promise.all([
      fetch(`${TRACKER_API}/api/leaderboard`, { next: { revalidate: 60 } }),
      fetch(`${TRACKER_API}/api/stats`,       { next: { revalidate: 60 } }),
      fetch(`${TRACKER_API}/api/posts`,       { next: { revalidate: 60 } }),
    ]);
    const lbJson    = await leaderboardRes.json();
    const statsJson = await statsRes.json();
    const postsJson = await postsRes.json();
    const leaderboard = Array.isArray(lbJson?.leaderboard) ? lbJson.leaderboard : [];
    const cpm         = typeof lbJson?.cpm === "number" ? lbJson.cpm : 10;
    const posts       = Array.isArray(postsJson) ? postsJson : [];
    const stats       = statsJson?.totalViews !== undefined ? statsJson : null;
    return { leaderboard, cpm, stats, posts };
  } catch {
    return { leaderboard: [], cpm: 10, stats: null, posts: [] };
  }
}

export default async function Home() {
  const [{ leaderboard, cpm, stats, posts }, discordData, tokenData] = await Promise.all([
    fetchTrackerData(),
    fetchDiscordData(),
    fetchTokenData(),
  ]);

  return (
    <HomeDashboard
      leaderboard={leaderboard}
      cpm={cpm}
      stats={stats}
      posts={posts}
      discordData={discordData}
      tokenData={tokenData}
    />
  );
}
