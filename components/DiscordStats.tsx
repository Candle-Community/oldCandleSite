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

const rings = [
  {
    ring: 1,
    key: "general",
    name: "General",
    emoji: "🌐",
    color: "from-gray-500 to-gray-600",
    borderColor: "border-gray-600",
    textColor: "text-gray-400",
    description: "Everyone in the server without a specific role.",
    perks: ["#general access", "Community announcements", "Public alpha"],
  },
  {
    ring: 2,
    key: "verified",
    name: "Verified",
    emoji: "✅",
    color: "from-cyan-500 to-cyan-600",
    borderColor: "border-cyan-600",
    textColor: "text-cyan-400",
    description: "Verified Candle community members.",
    perks: ["Verified role", "#candle-verified channel", "Holder pathway access"],
  },
  {
    ring: 3,
    key: "holder",
    name: "Holder",
    emoji: "🔥",
    color: "from-orange-600 to-orange-700",
    borderColor: "border-orange-700",
    textColor: "text-orange-400",
    description: "Active $CNDL token holders.",
    perks: ["All Verified perks", "#holder-alpha", "Token-gated channels", "Believer NFT pathway"],
  },
  {
    ring: 4,
    key: "believer",
    name: "Believer",
    emoji: "💎",
    color: "from-purple-500 to-purple-700",
    borderColor: "border-purple-600",
    textColor: "text-purple-400",
    description: "Believer NFT holders.",
    perks: ["All Holder perks", "Believer NFT holder", "#believer-only", "Elite invitation pathway"],
  },
  {
    ring: 5,
    key: "elite",
    name: "Elite",
    emoji: "👑",
    color: "from-[#32fe9f] to-[#20cb7f]",
    borderColor: "border-[#32fe9f]",
    textColor: "text-[#33d4aa]",
    description: "The inner circle. OG founders and top contributors.",
    perks: ["All Believer perks", "Revenue share", "Strategy sessions", "Elite leaderboard access", "Founding member status"],
  },
];

export default function DiscordStats({
  memberCount,
  discordData,
}: {
  memberCount: number | null;
  discordData: DiscordData;
}) {
  const totalMembers = discordData?.totalMembers ?? null;

  const ringsWithCounts = rings.map((r) => ({
    ...r,
    members: discordData?.rings?.[r.key as keyof typeof discordData.rings] ?? null,
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-[#32fe9f] to-[#20cb7f] rounded-full" />
        <h2 className="text-2xl font-bold">Discord Community Stats</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Members</p>
          <p className="text-3xl font-bold text-white">
            {totalMembers !== null ? totalMembers.toLocaleString() : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Clipping Team</p>
          <p className="text-3xl font-bold text-green-400">
            {memberCount !== null ? memberCount : "—"}
          </p>
          <p className="text-xs text-gray-600 mt-1">Registered posters</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Elite Members</p>
          <p className="text-3xl font-bold text-[#32fe9f]">
            {discordData?.rings?.elite ?? "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Believers</p>
          <p className="text-3xl font-bold text-purple-400">
            {discordData?.rings?.believer ?? "—"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-500 font-medium">The 5 Rings</p>
        {ringsWithCounts.map((ring) => {
          const pct = totalMembers && ring.members !== null
            ? Math.round((ring.members / totalMembers) * 100)
            : null;

          return (
            <div key={ring.key} className={`card p-5 border ${ring.borderColor}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ring.emoji}</span>
                  <div>
                    <span className={`font-bold text-base ${ring.textColor}`}>
                      Ring {ring.ring}: {ring.name}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{ring.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-lg ${ring.textColor}`}>
                    {ring.members !== null ? ring.members.toLocaleString() : "—"}
                  </p>
                  {pct !== null && (
                    <p className="text-xs text-gray-600">{pct}% of server</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ring.perks.map((perk) => (
                  <span key={perk} className="text-xs text-gray-400 bg-[#1a1a1a] rounded px-2 py-1">
                    {perk}
                  </span>
                ))}
              </div>
              {pct !== null && (
                <div className="mt-3 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${ring.color}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
