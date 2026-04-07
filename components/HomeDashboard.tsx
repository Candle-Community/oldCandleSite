"use client";

import React, { useState } from "react";
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

// ── Icons ──────────────────────────────────────────────────────────
function IconRings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
function IconDistribution() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}
function IconScissors() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  );
}
function IconSubmit() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
function IconLeaderboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function IconPayouts() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v2m0 8v2M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1 2-2.5 2.5S9.5 15 9.5 16.5a2.5 2.5 0 0 0 5 0"/>
    </svg>
  );
}
function IconAdmin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconRocket() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  );
}
function IconX() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.25 2.25h6.988l4.26 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  );
}
function IconDiscord() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}
function IconDiamond() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
      <line x1="12" y1="22" x2="12" y2="2"/><line x1="2" y1="8.5" x2="22" y2="8.5"/>
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

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
            icon={<IconRings />}
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[0.875rem] font-semibold transition-colors ${
                isDistributionActive
                  ? "text-[#FF6021] bg-[#FF6021]/[0.08]"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <IconDistribution />
                Distribution
              </span>
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
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.875rem] font-semibold transition-colors ${
                      activeTab === s.id
                        ? "text-[#FF6021] bg-[#FF6021]/[0.08]"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {s.id === "clipping"    && <IconScissors />}
                    {s.id === "submit"      && <IconSubmit />}
                    {s.id === "leaderboard" && <IconLeaderboard />}
                    {s.id === "payouts"     && <IconPayouts />}
                    {s.id === "admin"       && <IconAdmin />}
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LaunchBot */}
          <SidebarItem
            label="LaunchBot"
            icon={<IconRocket />}
            active={activeTab === "launchbot"}
            onClick={() => selectTab("launchbot")}
          />

        </nav>

        {/* Bottom links */}
        <div className="px-4 pb-3 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <a href="https://x.com/candletv" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><IconX /></a>
            <a href="https://discord.gg/candledottv" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><IconDiscord /></a>
          </div>
          <a href="https://beliefs.candle.tv/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8rem] font-semibold text-gray-500 hover:text-white hover:bg-white/[0.04] transition-colors">
            <IconDiamond />Our Beliefs
          </a>
          <a href="https://docs.candle.tv/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8rem] font-semibold text-gray-500 hover:text-white hover:bg-white/[0.04] transition-colors">
            <IconDoc />How it Works
          </a>
        </div>

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

function SidebarItem({ label, icon, active, onClick }: { label: string; icon?: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.875rem] font-semibold transition-colors ${
        active
          ? "text-[#FF6021] bg-[#FF6021]/[0.08]"
          : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
      }`}
    >
      {icon}
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
