"use client";
import { useState, useEffect } from "react";

type DiscordData = {
  totalMembers: number;
  rings: {
    general: number;
    verified: number;
    holder: number;
    believer: number;
    elite: number;
  };
} | null;

const RINGS = [
  {
    id: "general",
    ring: 1,
    label: "General",
    action: "Join Discord",
    emoji: "🌐",
    color: "#6b7280",
    labelColor: "text-gray-400",
    borderColor: "border-gray-600",
    bgColor: "bg-gray-600/10",
    r: 210,
    sw: 28,
    perks: ["#general access", "Community announcements", "Public alpha"],
  },
  {
    id: "verified",
    ring: 2,
    label: "Verified",
    action: "Verify on Candle →",
    emoji: "✅",
    color: "#06b6d4",
    labelColor: "text-cyan-400",
    borderColor: "border-cyan-600",
    bgColor: "bg-cyan-600/10",
    r: 165,
    sw: 28,
    perks: ["Verified role", "#candle-verified channel", "Holder pathway access"],
  },
  {
    id: "holder",
    ring: 3,
    label: "Holder",
    action: "Buy $CNDL →",
    emoji: "🔥",
    color: "#f97316",
    labelColor: "text-orange-400",
    borderColor: "border-orange-600",
    bgColor: "bg-orange-600/10",
    r: 120,
    sw: 28,
    perks: ["#holder-alpha", "Token-gated channels", "Believer NFT pathway"],
  },
  {
    id: "believer",
    ring: 4,
    label: "Believer",
    action: "Mint Believer NFT →",
    emoji: "💎",
    color: "#a855f7",
    labelColor: "text-purple-400",
    borderColor: "border-purple-600",
    bgColor: "bg-purple-600/10",
    r: 75,
    sw: 28,
    perks: ["Believer NFT holder", "#believer-only", "Elite invitation pathway"],
  },
  {
    id: "elite",
    ring: 5,
    label: "Elite",
    action: "Invitation only",
    emoji: "👑",
    color: "#32fe9f",
    labelColor: "text-[#32fe9f]",
    borderColor: "border-[#32fe9f]",
    bgColor: "bg-[#32fe9f]/10",
    r: 36,
    sw: 0,
    perks: ["Direct team access", "Revenue share", "Strategy sessions", "Founding member status"],
  },
];

const LABEL_ANGLES: Record<string, number> = {
  general: 315,
  verified: 45,
  holder: 135,
  believer: 225,
};

const CX = 250;
const CY = 250;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function CommunityRings({ discordData }: { discordData: DiscordData }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<DiscordData>(discordData);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch("/api/discord", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (json.totalMembers !== undefined) {
          const total: number = json.totalMembers;
          const { verified = 0, holder = 0, believer = 0, elite = 0 } = json.rings ?? {};
          const general = Math.max(0, total - verified - holder - believer - elite);
          setLiveData({ totalMembers: total, rings: { general, verified, holder, believer, elite } });
        }
      } catch {}
    }
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  const ringsWithCounts = RINGS.map((r) => ({
    ...r,
    members: liveData?.rings?.[r.id as keyof typeof liveData.rings] ?? null,
  }));

  const totalMembers = liveData?.totalMembers ?? null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-[#32fe9f] to-[#20cb7f] rounded-full" />
        <h2 className="text-2xl font-bold">Community Rings</h2>
        <span className="text-xs text-gray-600 border border-[#222] rounded-full px-3 py-1 ml-2">
          5 Rings{totalMembers !== null ? ` · ${totalMembers.toLocaleString()} members` : ""}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* SVG Diagram */}
        <div className="flex-shrink-0 w-full lg:w-[460px]">
          <svg viewBox="0 0 500 500" className="w-full" style={{ maxHeight: 460 }}>
            <circle cx={CX} cy={CY} r={238} fill="rgba(255,255,255,0.015)" />

            {/* Stroke rings (General → Believer) */}
            {ringsWithCounts.slice(0, 4).map((ring) => {
              const isActive = hovered === ring.id;
              const isDimmed = hovered !== null && !isActive;
              const angle = LABEL_ANGLES[ring.id];
              const labelR = ring.r + ring.sw / 2 + 20;
              const dot = polarToXY(CX, CY, ring.r + ring.sw / 2 + 5, angle);
              const label = polarToXY(CX, CY, labelR, angle);

              return (
                <g key={ring.id}>
                  <circle
                    cx={CX} cy={CY} r={ring.r}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={ring.sw}
                    opacity={isDimmed ? 0.12 : isActive ? 1 : 0.65}
                    style={{
                      filter: isActive ? `drop-shadow(0 0 14px ${ring.color})` : undefined,
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={() => setHovered(ring.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  <circle
                    cx={dot.x} cy={dot.y} r={3}
                    fill={ring.color}
                    opacity={isDimmed ? 0.12 : 0.8}
                    style={{ pointerEvents: "none", transition: "opacity 0.2s" }}
                  />
                  <text
                    x={label.x} y={label.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={ring.color} fontSize="11" fontWeight="600"
                    opacity={isDimmed ? 0.15 : isActive ? 1 : 0.7}
                    style={{ pointerEvents: "none", transition: "opacity 0.2s" }}
                  >
                    {ring.label}
                  </text>
                </g>
              );
            })}

            {/* Elite — filled center */}
            {(() => {
              const elite = ringsWithCounts[4];
              const isActive = hovered === "elite";
              const isDimmed = hovered !== null && !isActive;
              return (
                <g>
                  <circle
                    cx={CX} cy={CY} r={elite.r}
                    fill={elite.color}
                    opacity={isDimmed ? 0.15 : 1}
                    style={{
                      filter: `drop-shadow(0 0 ${isActive ? 24 : 10}px ${elite.color})`,
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={() => setHovered("elite")}
                    onMouseLeave={() => setHovered(null)}
                  />
                  <text x={CX} y={CY - 9} textAnchor="middle" fontSize="16" style={{ pointerEvents: "none" }}>
                    👑
                  </text>
                  <text
                    x={CX} y={CY + 10}
                    textAnchor="middle"
                    fill="#0a0a0a" fontSize="9" fontWeight="800" letterSpacing="2"
                    style={{ pointerEvents: "none" }}
                  >
                    ELITE
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Ring list */}
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">
            Hover a ring to see perks
          </p>

          {ringsWithCounts.map((ring, i) => {
            const isActive = hovered === ring.id;
            const pct = totalMembers && ring.members !== null
              ? Math.round((ring.members / totalMembers) * 100)
              : null;

            return (
              <div key={ring.id}>
                <div
                  className={`card p-4 border cursor-pointer transition-all duration-200 ${ring.borderColor} ${isActive ? ring.bgColor : ""}`}
                  onMouseEnter={() => setHovered(ring.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base">{ring.emoji}</span>
                      <div>
                        <div className={`font-bold text-sm ${ring.labelColor}`}>
                          Ring {ring.ring}: {ring.label}
                        </div>
                        <div className="text-xs text-gray-600">{ring.action}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-bold text-sm ${ring.labelColor}`}>
                        {ring.members !== null ? ring.members.toLocaleString() : "—"}
                      </div>
                      {pct !== null && <div className="text-xs text-gray-600">{pct}%</div>}
                    </div>
                  </div>

                  <div className="mt-2 h-0.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: pct !== null ? `${Math.max(pct, 1)}%` : "0%",
                        background: ring.color,
                        opacity: 0.6,
                      }}
                    />
                  </div>

                  {isActive && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ring.perks.map((p) => (
                        <span key={p} className="text-xs text-gray-400 bg-[#1a1a1a] rounded px-2 py-1">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {i < ringsWithCounts.length - 1 && (
                  <div className="flex justify-start pl-7 py-0.5">
                    <span className="text-gray-700 text-xs">↓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
