import Leaderboard from "@/components/Leaderboard";
import EliteBot from "@/components/EliteBot";
import DiscordStats from "@/components/DiscordStats";
import CommunityRings from "@/components/CommunityRings";
import CNDLToken from "@/components/CNDLToken";
import { fetchDiscordData } from "@/lib/discord";
import { fetchTokenData } from "@/lib/token";

const TRACKER_API = process.env.TRACKER_API_URL || "http://localhost:3001";

async function fetchTrackerData() {
  try {
    const [leaderboardRes, statsRes, postsRes] = await Promise.all([
      fetch(`${TRACKER_API}/api/leaderboard`, { next: { revalidate: 60 } }),
      fetch(`${TRACKER_API}/api/stats`, { next: { revalidate: 60 } }),
      fetch(`${TRACKER_API}/api/posts`, { next: { revalidate: 60 } }),
    ]);
    const { leaderboard, cpm } = await leaderboardRes.json();
    const stats = await statsRes.json();
    const posts = await postsRes.json();
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-bold text-sm">
              C
            </div>
            <span className="font-bold text-lg tracking-tight">
              Candle <span className="elite-gradient">Elite</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#leaderboard" className="hover:text-yellow-400 transition-colors">Leaderboard</a>
            <a href="#bot" className="hover:text-yellow-400 transition-colors">Elite Bot</a>
            <a href="#rings" className="hover:text-yellow-400 transition-colors">Community</a>
            <a href="#discord" className="hover:text-yellow-400 transition-colors">Discord</a>
            <a href="#token" className="hover:text-yellow-400 transition-colors">$CNDL</a>
            <a href="/arcade" className="hover:text-green-400 transition-colors font-semibold" style={{color:'#00e554'}}>Arcade ↗</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/arcade" className="text-xs font-bold rounded-full px-3 py-1 transition-all hover:opacity-80" style={{background:'rgba(0,229,84,0.1)', border:'1px solid rgba(0,229,84,0.3)', color:'#00e554'}}>Arcade ↗</a>
            <span className="text-xs text-gray-500 border border-[#222] rounded-full px-3 py-1">Members Only</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 text-center border-b border-[#1a1a1a]">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-yellow-400 mb-4">Welcome to the Inner Circle</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Candle <span className="elite-gradient">Elite</span> Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Leaderboards, insights, stats, and token data — all in one place.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        <section id="leaderboard">
          <Leaderboard leaderboard={leaderboard} cpm={cpm} />
        </section>
        <section id="bot">
          <EliteBot posts={posts} stats={stats} cpm={cpm} />
        </section>
        <section id="rings">
          <CommunityRings discordData={discordData} />
        </section>
        <section id="discord">
          <DiscordStats memberCount={stats?.members ?? null} discordData={discordData} />
        </section>
        <section id="token">
          <CNDLToken stats={stats} cpm={cpm} tokenData={tokenData} />
        </section>

        {/* Arcade Banner */}
        <section id="arcade" className="relative overflow-hidden rounded-2xl border border-[#00e554]/20 bg-[#06100a] p-8 md:p-12 text-center">
          <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,229,84,0.06), transparent 70%)'}} />
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{color:'rgba(0,229,84,0.6)'}}>$CHAD Arcade</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{fontFamily:'inherit'}}>
            Play. Score. Win <span style={{color:'#00e554'}}>$CHAD</span>.
          </h2>
          <p className="text-gray-400 mb-2 max-w-md mx-auto">
            Three arcade games. Weekly prize pool. Top 3 scores every Sunday win $100 · $50 · $25 in $CHAD.
          </p>
          <p className="text-xs mb-8" style={{color:'rgba(0,229,84,0.45)'}}>Flappy Beard &nbsp;·&nbsp; Chad Dodge &nbsp;·&nbsp; Moon or Rug</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <span className="text-4xl">🧔</span>
            <span className="text-4xl">💨</span>
            <span className="text-4xl">🌙</span>
          </div>
          <div className="mt-8">
            <a
              href="/arcade"
              className="inline-block font-bold text-black px-8 py-4 rounded-full text-lg tracking-wide transition-all hover:scale-105"
              style={{background:'#00e554', boxShadow:'0 0 32px rgba(0,229,84,0.3)'}}
            >
              ENTER ARCADE →
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] px-6 py-8 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <span>© 2026 Candle Elite. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/arcade" className="hover:text-green-400 transition-colors" style={{color:'rgba(0,229,84,0.5)'}}>$CHAD Arcade</a>
            <span>·</span>
            <span>$CNDL · Elite Members Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
