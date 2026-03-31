type Post = {
  id: number;
  discord_tag: string;
  x_handle: string;
  post_url: string;
  views: number;
  likes: number;
  multiplier: number;
  approved: number;
  submitted_at: string;
};

type Stats = {
  totalViews: number;
  approvedPosts: number;
  members: number;
  totalCndl: string;
  cpm: number;
} | null;

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "just now";
}

function qualityLabel(multiplier: number) {
  if (multiplier >= 2) return { label: "Long form", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" };
  if (multiplier >= 1.5) return { label: "High quality", color: "text-green-400 bg-green-400/10 border-green-400/20" };
  if (multiplier >= 1) return { label: "Standard", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
  return { label: "Low effort", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" };
}

export default function EliteBot({
  posts,
  stats,
  cpm,
}: {
  posts: Post[];
  stats: Stats;
  cpm: number;
}) {
  const approvedPosts = posts
    .filter((p) => p.approved === 1)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 5);

  const topPost = posts.filter((p) => p.approved === 1).sort((a, b) => b.views - a.views)[0];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-[#32fe9f] to-[#20cb7f] rounded-full" />
        <h2 className="text-2xl font-bold">Elite Bot</h2>
        <span className="ml-auto text-xs text-green-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Posts Approved</p>
          <p className="text-3xl font-bold text-white">{stats?.approvedPosts ?? "—"}</p>
          <p className="text-xs text-gray-600 mt-1">All time</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Views</p>
          <p className="text-3xl font-bold text-[#32fe9f]">
            {stats ? formatNum(stats.totalViews) : "—"}
          </p>
          <p className="text-xs text-gray-600 mt-1">Approved posts</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Top Post</p>
          <p className="text-3xl font-bold text-green-400">
            {topPost ? formatNum(topPost.views) : "—"}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {topPost ? `@${topPost.x_handle}` : "No posts yet"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-500 font-medium">Recent Approved Posts</p>
        {approvedPosts.length === 0 ? (
          <div className="card p-6 text-center text-gray-500">No approved posts yet.</div>
        ) : (
          approvedPosts.map((post) => {
            const q = qualityLabel(post.multiplier ?? 1);
            const effectiveViews = Math.round(post.views * (post.multiplier ?? 1));
            const cndlEarned = ((effectiveViews / 1000) * cpm).toFixed(2);
            return (
              <div key={post.id} className="card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${q.color}`}>
                    {q.label}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-mono text-green-400">{cndlEarned} $CNDL</span>
                    <span>{timeAgo(post.submitted_at)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-200 hover:text-[#33d4aa] transition-colors"
                  >
                    View post →
                  </a>
                  <span className="text-xs font-mono text-gray-400">
                    {formatNum(post.views)} views · {post.likes} likes
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  @{post.discord_tag} · @{post.x_handle}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
