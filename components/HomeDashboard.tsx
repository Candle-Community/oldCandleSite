"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Leaderboard from "./Leaderboard";
import DiscordStats from "./DiscordStats";
import CommunityRings from "./CommunityRings";
import CNDLToken from "./CNDLToken";
import ClippingTool from "./ClippingTool";
import SubmitPost from "./SubmitPost";
import AuthButton from "./AuthButton";
import LaunchBot from "./LaunchBot";
import AdminPanel from "./AdminPanel";
import PayoutMembers from "./PayoutMembers";

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
  const { data: session } = useSession();

  const ADMIN_USERS = ["rich.cndl", ".aleedotg"];
  const isAdmin = ADMIN_USERS.includes(session?.user?.discordTag ?? "");

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
    ...(isAdmin ? [{ id: "admin" as Tab, label: "Admin" }] : []),
  ];

  const isDistributionActive = DISTRIBUTION_SUBS.some(s => s.id === activeTab);

  return (
    <div className="min-h-screen bg-[#0c0e13] text-white flex">

      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0a0c10] sticky top-0 h-screen overflow-y-auto">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            {/* Candle candlestick chart icon */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              {/* Left candle */}
              <rect x="3" y="16" width="5" height="8" rx="1" fill="#32fe9f"/>
              <rect x="4.5" y="13" width="2" height="3" rx="0.5" fill="#32fe9f"/>
              {/* Middle candle */}
              <rect x="11" y="11" width="6" height="10" rx="1" fill="#32fe9f"/>
              <rect x="13" y="8" width="2" height="3" rx="0.5" fill="#32fe9f"/>
              <rect x="13" y="21" width="2" height="2" rx="0.5" fill="#32fe9f"/>
              {/* Right candle */}
              <rect x="20" y="6" width="5" height="13" rx="1" fill="#32fe9f"/>
              <rect x="21.5" y="3" width="2" height="3" rx="0.5" fill="#32fe9f"/>
            </svg>
            <div>
              <div className="font-bold text-base tracking-tight leading-tight">
                Candle <span className="elite-gradient">Elite</span>
              </div>
            </div>
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
                  ? "text-[#FF6021] bg-[#FF6021]/[0.08]"
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === s.id
                        ? "text-[#FF6021] bg-[#FF6021]/[0.08]"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
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
              <Leaderboard leaderboard={leaderboard} cpm={cpm} tokenPrice={tokenData?.price} />
            </div>
          )}

          {activeTab === "payouts" && (
            <div className="space-y-10">
              <PageHeader title="Payouts" sub="Live $CNDL token price, holders, and clipping payouts" />
              <CNDLToken stats={stats} cpm={cpm} tokenData={tokenData} clippers={leaderboard.length} />
              <PayoutMembers />
            </div>
          )}

          {activeTab === "admin" && (
            <div className="space-y-8">
              <PageHeader title="Admin" sub="Review and manage post submissions" />
              {isAdmin ? (
                <AdminPanel />
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-16 flex flex-col items-center gap-4">
                  <div className="text-gray-500 text-sm">You don&apos;t have permission to access this page.</div>
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
          ? "text-[#FF6021] bg-[#FF6021]/[0.08]"
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
