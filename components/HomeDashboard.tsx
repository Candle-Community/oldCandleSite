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

type Tab =
  | "community"
  | "clipping"
  | "submit"
  | "leaderboard"
  | "payouts"
  | "admin"
  | "launchbot";

type Props = {
  leaderboard: any[];
  cpm: number;
  stats: any;
  posts: any[];
  discordData: any;
  tokenData: any;
};

export default function HomeDashboard({ leaderboard, cpm, stats, posts, discordData, tokenData }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("community");
  const [distributionOpen, setDistributionOpen] = useState(false);
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

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    if (["clipping", "submit", "leaderboard", "payouts", "admin"].includes(tab)) {
      setDistributionOpen(true);
    }
  }

  const DISTRIBUTION_SUBS: { id: Tab; label: string }[] = [
    { id: "clipping",    label: "Clipping"     },
    { id: "submit",      label: "Submit"       },
    { id: "leaderboard", label: "Leaderboard"  },
    { id: "payouts",     label: "Payouts"      },
    { id: "admin",       label: "Admin"        },
  ];

  const isDistributionActive = DISTRIBUTION_SUBS.some(s => s.id === activeTab);

  return (
    <div className="min-h-screen bg-[#0c0e13] text-white flex">

      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0a0c10] sticky top-0 h-screen overflow-y-auto">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#32fe9f] to-[#20cb7f] flex items-center justify-center text-black font-bold text-xs shrink-0">
              C
            </div>
            <span className="font-bold text-base tracking-tight">
              Candle <span className="elite-gradient">Elite</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">

          {/* Community Rings */}
          <SidebarItem
            label="Community Rings"
            active={activeTab === "community"}
            onClick={() => selectTab("community")}
          />

          {/* Distribution */}
          <div>
            <button
              onClick={() => {
                setDistributionOpen(o => !o);
                if (!isDistributionActive) selectTab("clipping");
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDistributionActive
                  ? "text-[#32fe9f] bg-[#32fe9f]/[0.08]"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>Distribution</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${distributionOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {distributionOpen && (
              <div className="mt-0.5 ml-3 pl-3 border-l border-white/[0.06] space-y-0.5">
                {DISTRIBUTION_SUBS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectTab(s.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activeTab === s.id
                        ? "text-[#32fe9f] bg-[#32fe9f]/[0.08] font-medium"
                        : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LaunchBot */}
          <SidebarItem
            label="LaunchBot"
            active={activeTab === "launchbot"}
            onClick={() => selectTab("launchbot")}
          />

        </nav>

        {/* Auth at bottom */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <AuthButton />
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-8 py-8">

          {activeTab === "community" && (
            <div className="space-y-10">
              <PageHeader title="Community Rings" sub="Discord rings and live member counts" />
              <CommunityRings discordData={discordData} />
              <DiscordStats memberCount={stats?.members ?? null} discordData={discordData} />
            </div>
          )}

          {activeTab === "clipping" && (
            <div className="space-y-8">
              <PageHeader title="AI Clipping Tool" sub="Upload a stream or paste a YouTube link — AI finds the best moments and renders 9:16 clips" />
              <ClippingTool />
            </div>
          )}

          {activeTab === "submit" && (
            <div className="space-y-8">
              <PageHeader title="Submit" sub="Earn $CNDL for every 1,000 views on your approved X posts" />
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

          {activeTab === "leaderboard" && (
            <div className="space-y-10">
              <PageHeader title="Leaderboard" sub="Live leaderboard and post activity" />
              <Leaderboard leaderboard={leaderboard} cpm={cpm} />
              <EliteBot posts={posts} stats={stats} cpm={cpm} />
            </div>
          )}

          {activeTab === "payouts" && (
            <div className="space-y-10">
              <PageHeader title="Payouts" sub="Live $CNDL token price, holders, and clipping payouts" />
              <CNDLToken stats={stats} cpm={cpm} tokenData={tokenData} />
            </div>
          )}

          {activeTab === "admin" && (
            <div className="space-y-8">
              <PageHeader title="Admin" sub="Restricted access" />
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

          {activeTab === "launchbot" && (
            <div className="space-y-6">
              <PageHeader title="LaunchBot" sub="Real-time Solana launch intelligence" />
              <LaunchBot />
            </div>
          )}

        </main>

        <footer className="border-t border-white/[0.06] px-8 py-5">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>© 2026 Candle Elite</span>
            <span>$CNDL · Members Only</span>
          </div>
        </footer>
      </div>

    </div>
  );
}

function SidebarItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "text-[#32fe9f] bg-[#32fe9f]/[0.08]"
          : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
      }`}
    >
      {label}
    </button>
  );
}

function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-gray-400 text-sm mt-1">{sub}</p>
    </div>
  );
}
