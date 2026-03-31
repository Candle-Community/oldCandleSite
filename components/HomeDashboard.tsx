"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Leaderboard from "./Leaderboard";
import EliteBot from "./EliteBot";
import DiscordStats from "./DiscordStats";
import CommunityRings from "./CommunityRings";
import CNDLToken from "./CNDLToken";
import ClippingTool from "./ClippingTool";
import SubmitPost from "./SubmitPost";
import AuthButton from "./AuthButton";
import LaunchBot from "./LaunchBot";

type Section = "main" | "clippers";
type MainTab = "community" | "launchbot";
type ClippersTab = "clipping" | "submit" | "dashboard" | "payouts" | "admin";

type Props = {
  leaderboard: any[];
  cpm: number;
  stats: any;
  posts: any[];
  discordData: any;
  tokenData: any;
};

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "community", label: "Community" },
  { id: "launchbot", label: "LaunchBot" },
];

const CLIPPERS_TABS: { id: ClippersTab; label: string }[] = [
  { id: "clipping",  label: "✂ Clipping" },
  { id: "submit",    label: "Submit"      },
  { id: "dashboard", label: "Dashboard"  },
  { id: "payouts",   label: "Payouts"    },
  { id: "admin",     label: "Admin"      },
];

export default function HomeDashboard({ leaderboard, cpm, stats, posts, discordData, tokenData }: Props) {
  const [section, setSection] = useState<Section>("main");
  const [mainTab, setMainTab] = useState<MainTab>("community");
  const [clippersTab, setClippersTab] = useState<ClippersTab>("clipping");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState(false);
  const { data: session } = useSession();

  function handleAdminUnlock() {
    if (adminInput === "123rich67$") {
      setAdminUnlocked(true);
      setAdminError(false);
    } else {
      setAdminError(true);
    }
  }

  const activeTabs = section === "main" ? MAIN_TABS : CLIPPERS_TABS;
  const activeTab  = section === "main" ? mainTab : clippersTab;

  function setActiveTab(id: string) {
    if (section === "main") setMainTab(id as MainTab);
    else setClippersTab(id as ClippersTab);
  }

  return (
    <div className="min-h-screen bg-[#0c0e13] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4 sticky top-0 z-50 bg-[#0c0e13]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#32fe9f] to-[#20cb7f] flex items-center justify-center text-black font-bold text-sm">
              C
            </div>
            <span className="font-bold text-lg tracking-tight">
              Candle <span className="elite-gradient">Elite</span>
            </span>
          </div>

          {/* Section toggle + tabs */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            {/* Section toggle */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-full p-0.5">
              {(["main", "clippers"] as Section[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    section === s
                      ? "bg-[#32fe9f]/15 text-[#32fe9f] border border-[#32fe9f]/60"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {s === "main" ? "Main" : "For Clippers"}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-white/10" />

            {/* Tab nav */}
            <div className="flex items-center gap-1">
              {activeTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeTab === t.id
                      ? "bg-[#32fe9f]/15 text-[#32fe9f] border border-[#32fe9f]/80 shadow-[inset_0_5px_10px_rgba(50,254,159,0.15)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side — always show AuthButton */}
          <div className="shrink-0">
            <AuthButton />
          </div>

        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ── MAIN section ── */}
        {section === "main" && mainTab === "community" && (
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl font-bold">Community</h1>
              <p className="text-gray-400 text-sm mt-1">Discord rings and live member counts</p>
            </div>
            <CommunityRings discordData={discordData} />
            <DiscordStats memberCount={stats?.members ?? null} discordData={discordData} />
          </div>
        )}

        {section === "main" && mainTab === "launchbot" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">LaunchBot</h1>
              <p className="text-gray-400 text-sm mt-1">Real-time Solana launch intelligence</p>
            </div>
            <LaunchBot />
          </div>
        )}

        {/* ── FOR CLIPPERS section ── */}
        {section === "clippers" && clippersTab === "clipping" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold">AI Clipping Tool</h1>
              <p className="text-gray-400 text-sm mt-1">Upload a stream or paste a YouTube link — AI finds the best moments and renders 9:16 clips</p>
            </div>
            <ClippingTool />
          </div>
        )}

        {section === "clippers" && clippersTab === "submit" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold">Submit</h1>
              <p className="text-gray-400 text-sm mt-1">Earn $CNDL for every 1,000 views on your approved X posts</p>
            </div>
            {session ? (
              <SubmitPost />
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-16 flex flex-col items-center gap-4">
                <div className="text-gray-500 text-sm">Sign in with Discord to submit posts and track your earnings</div>
                <AuthButton />
              </div>
            )}
          </div>
        )}

        {section === "clippers" && clippersTab === "dashboard" && (
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Live leaderboard and post activity</p>
            </div>
            <Leaderboard leaderboard={leaderboard} cpm={cpm} />
            <EliteBot posts={posts} stats={stats} cpm={cpm} />
          </div>
        )}

        {section === "clippers" && clippersTab === "payouts" && (
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl font-bold">Payouts</h1>
              <p className="text-gray-400 text-sm mt-1">Live $CNDL token price, holders, and clipping payouts</p>
            </div>
            <CNDLToken stats={stats} cpm={cpm} tokenData={tokenData} />
          </div>
        )}

        {section === "clippers" && clippersTab === "admin" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold">Admin</h1>
              <p className="text-gray-400 text-sm mt-1">Restricted access</p>
            </div>
            {adminUnlocked ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-gray-400">
                Admin panel coming soon
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-16 flex flex-col items-center gap-4 max-w-sm mx-auto">
                <div className="text-gray-400 text-sm font-medium">Enter admin password</div>
                <input
                  type="password"
                  value={adminInput}
                  onChange={(e) => { setAdminInput(e.target.value); setAdminError(false); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminUnlock()}
                  placeholder="Password"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#32fe9f]/50"
                />
                {adminError && <p className="text-red-400 text-xs">Incorrect password</p>}
                <button
                  onClick={handleAdminUnlock}
                  className="w-full bg-[#32fe9f]/15 text-[#32fe9f] border border-[#32fe9f]/50 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#32fe9f]/25 transition-colors"
                >
                  Unlock
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-6 mt-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-600">
          <span>© 2026 Candle Elite</span>
          <span>$CNDL · Members Only</span>
        </div>
      </footer>
    </div>
  );
}
