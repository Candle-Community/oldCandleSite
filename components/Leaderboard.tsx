type LeaderboardRow = {
  discord_tag: string;
  x_handle: string;
  post_count: number;
  total_views: number;
  effective_views: number;
  cndl_owed: string;
  followers?: number;
};

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

const medals = ["👑", "🥈", "🥉"];

export default function Leaderboard({
  leaderboard,
  cpm,
}: {
  leaderboard: LeaderboardRow[];
  cpm: number;
}) {
  const top = leaderboard[0];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-[#32fe9f] to-[#20cb7f] rounded-full" />
        <h2 className="text-2xl font-bold">Elite Leaderboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Top Views</p>
          <p className="text-3xl font-bold text-[#32fe9f]">
            {top ? formatNum(top.total_views) : "—"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {top ? `@${top.x_handle} · #1 ranked` : "No data yet"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Top $CNDL Earned</p>
          <p className="text-3xl font-bold text-[#32fe9f]">
            {top ? `${top.cndl_owed}` : "—"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {top ? `@${top.x_handle} · CPM: ${cpm}` : `CPM: ${cpm}`}
          </p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No approved posts yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-5 px-5 py-3 text-xs text-gray-500 uppercase tracking-widest border-b border-[#1c1c1c]">
            <span>Rank</span>
            <span>Member</span>
            <span className="text-right">Followers</span>
            <span className="text-right">Views</span>
            <span className="text-right">$CNDL</span>
          </div>
          {leaderboard.map((m, i) => (
            <div
              key={m.discord_tag}
              className={`grid grid-cols-5 items-center px-5 py-4 border-b border-[#1a1a1a] last:border-0 hover:bg-[#151515] transition-colors ${
                i < 3 ? "bg-[#0a130c]" : ""
              }`}
            >
              <span className="font-bold text-sm flex items-center gap-2">
                {i < 3 ? (
                  <span>{medals[i]}</span>
                ) : (
                  <span className="text-gray-600">#{i + 1}</span>
                )}
              </span>
              <div>
                <p className={`font-medium text-sm ${i === 0 ? "text-[#32fe9f]" : "text-gray-200"}`}>
                  @{m.discord_tag}
                </p>
                <p className="text-xs text-gray-600">@{m.x_handle} · {m.post_count} posts</p>
              </div>
              <span className="text-right text-sm font-mono text-blue-400">
                {m.followers != null ? formatNum(m.followers) : "—"}
              </span>
              <span className="text-right text-sm font-mono text-gray-300">
                {formatNum(m.total_views)}
              </span>
              <span className="text-right text-sm font-mono text-green-400">
                {m.cndl_owed}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 mt-3 text-right">
        Ranked by effective views · CPM: {cpm} $CNDL / 1K views · Updates live
      </p>
    </div>
  );
}
