"use client";

import { useState } from "react";
import Link from "next/link";
import Leaderboard from "./Leaderboard";
import EliteBot from "./EliteBot";
import DiscordStats from "./DiscordStats";
import CommunityRings from "./CommunityRings";
import CNDLToken from "./CNDLToken";
import ClippingTool from "./ClippingTool";

type Tab = "clipping" | "dashboard" | "community" | "payouts" | "launchbot";

type Props = {
  leaderboard: any[];
  cpm: number;
  stats: any;
  posts: any[];
  discordData: any;
  tokenData: any;
};

export default function HomeDashboard({ leaderboard, cpm, stats, posts, discordData, tokenData }: Props) {
  const [tab, setTab] = useState<Tab>("clipping");

  const tabs: { id: Tab; label: string }[] = [
    { id: "clipping",   label: "✂ Clipping"  },
    { id: "dashboard",  label: "Dashboard"   },
    { id: "community",  label: "Community"   },
    { id: "payouts",    label: "Payouts"     },
    { id: "launchbot",  label: "LaunchBot"   },
  ];

  return (
    <div className="min-h-screen bg-[#0c0e13] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4 sticky top-0 z-50 bg-[#0c0e13]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#32fe9f] to-[#20cb7f] flex items-center justify-center text-black font-bold text-sm">
              C
            </div>
            <span className="font-bold text-lg tracking-tight">
              Candle <span className="elite-gradient">Elite</span>
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  tab === t.id
                    ? "bg-[#32fe9f]/15 text-[#32fe9f] border border-[#32fe9f]/80 shadow-[inset_0_5px_10px_rgba(50,254,159,0.15)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <Link
            href="/tracker"
            className="text-xs text-gray-500 border border-white/10 rounded-full px-3 py-1.5 hover:border-[#32fe9f]/50 hover:text-gray-300 transition-colors font-medium"
          >
            Tracker →
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {tab === "clipping" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold">AI Clipping Tool</h1>
              <p className="text-gray-400 text-sm mt-1">Upload a stream or paste a YouTube link — AI finds the best moments and renders 9:16 clips</p>
            </div>
            <ClippingTool />
          </div>
        )}

        {tab === "dashboard" && (
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Live leaderboard and post activity</p>
            </div>
            <Leaderboard leaderboard={leaderboard} cpm={cpm} />
            <EliteBot posts={posts} stats={stats} cpm={cpm} />
          </div>
        )}

        {tab === "community" && (
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl font-bold">Community</h1>
              <p className="text-gray-400 text-sm mt-1">Discord rings and live member counts</p>
            </div>
            <CommunityRings discordData={discordData} />
            <DiscordStats memberCount={stats?.members ?? null} discordData={discordData} />
          </div>
        )}

        {tab === "payouts" && (
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl font-bold">Payouts</h1>
              <p className="text-gray-400 text-sm mt-1">Live $CNDL token price, holders, and clipping payouts</p>
            </div>
            <CNDLToken stats={stats} cpm={cpm} tokenData={tokenData} />
          </div>
        )}

        {tab === "launchbot" && (
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl font-bold">LaunchBot</h1>
              <p className="text-gray-400 text-sm mt-1">Coming soon</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-gray-500">
              LaunchBot coming soon
            </div>
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
