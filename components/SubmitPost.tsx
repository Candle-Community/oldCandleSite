"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

type Post = {
  id: number;
  post_url: string;
  views: number;
  likes: number;
  approved: number;
  multiplier: number;
  effective_views: number;
  cndl_owed: string;
  submitted_at: string;
};

type FilterTab = "all" | "pending" | "approved";

function StatCard({
  icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 ${gradient} border border-white/[0.06]`}>
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function SubmitModal({
  cpm,
  onClose,
  onSubmitted,
}: {
  cpm: number;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [postUrl, setPostUrl] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl: postUrl.trim(), xHandle: xHandle.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onSubmitted();
        onClose();
      } else {
        setError(data.error || "Submission failed");
      }
    } catch {
      setError("Network error — make sure the tracker API is running");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden border border-white/[0.08] flex" style={{ minHeight: 440 }}>
        {/* Left: checklist */}
        <div className="w-80 flex-shrink-0 bg-[#111318] p-8 border-r border-white/[0.06]">
          <h3 className="font-bold text-white text-base mb-2">Submission checklist</h3>
          <p className="text-gray-500 text-xs mb-6 leading-relaxed">
            Please ensure you adhere to all the rules and requirements before submitting to maximize your chance of approval.
          </p>
          <div className="mb-5">
            <div className="text-white text-xs font-semibold mb-1">General</div>
            <p className="text-gray-500 text-xs leading-relaxed">
              Posts must feature Candle-related content. Clips, threads, and commentary all qualify. Off-topic content will be rejected.
            </p>
          </div>
          <div>
            <div className="text-white text-xs font-semibold mb-1">Important</div>
            <p className="text-gray-500 text-xs leading-relaxed">
              Posts must be <strong className="text-white">publicly visible</strong> on X and owned by your account. Reposted content does not qualify.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 bg-[#0e1015] p-8 flex flex-col">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-bold text-white text-lg">Candle Elite Clipping</h2>
              <p className="text-gray-400 text-sm mt-0.5">
                <span className="text-[#32fe9f] font-semibold">${cpm.toFixed(2)}</span>
                {" / 1k views · Clipping"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-lg leading-none mt-0.5"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-4">
            <div>
              <label className="text-white text-xs font-medium mb-1.5 block">
                X Post URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://x.com/username/status/1234567890"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                className="w-full bg-[#1a1d24] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#32fe9f]/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-white text-xs font-medium mb-1.5 block">
                X Handle <span className="text-gray-600 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="@yourhandle"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                className="w-full bg-[#1a1d24] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#32fe9f]/50 transition-colors"
              />
            </div>

            <label className="flex items-start gap-3 bg-[#1a1d24] border border-white/[0.08] rounded-lg p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-[#32fe9f] flex-shrink-0"
              />
              <span className="text-gray-400 text-xs leading-relaxed">
                I&apos;ve read the submission requirements and acknowledge that my submission may be auto-rejected if it does not adhere to them.
              </span>
            </label>

            {error && (
              <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <div className="mt-auto flex justify-end">
              <button
                type="submit"
                disabled={!agreed || submitting}
                className="bg-[#1e2a1e] border border-[#32fe9f]/30 text-[#32fe9f] text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#32fe9f]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit for approval"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SubmitPost() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [cpm, setCpm] = useState(10);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showModal, setShowModal] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-submissions");
      if (!res.ok) return;
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        setCpm(data.cpm);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchPosts();
  }, [session, fetchPosts]);

  const filteredPosts = posts.filter((p) => {
    if (filter === "pending") return p.approved === 0;
    if (filter === "approved") return p.approved === 1;
    return true;
  });

  const counts = {
    all: posts.length,
    pending: posts.filter((p) => p.approved === 0).length,
    approved: posts.filter((p) => p.approved === 1).length,
  };

  const totalViews = posts.filter((p) => p.approved === 1).reduce((s, p) => s + p.views, 0);
  const totalCndl = posts.filter((p) => p.approved === 1).reduce((s, p) => s + parseFloat(p.cndl_owed), 0).toFixed(2);

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All Clips" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
  ];

  return (
    <div className="space-y-8">
      {showModal && (
        <SubmitModal
          cpm={cpm}
          onClose={() => setShowModal(false)}
          onSubmitted={() => { fetchPosts(); }}
        />
      )}

      {/* Analytics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👁"
          label="Views"
          value={totalViews.toLocaleString()}
          gradient="bg-gradient-to-br from-[#1a0a2e] to-[#0e0e14]"
        />
        <StatCard
          icon="💰"
          label="Payouts"
          value={`${totalCndl} $CNDL`}
          gradient="bg-gradient-to-br from-[#0a1f0a] to-[#0e0e14]"
        />
        <StatCard
          icon="🎬"
          label="Submissions"
          value={counts.all}
          sub={`${counts.approved} Approved`}
          gradient="bg-gradient-to-br from-[#1a0f00] to-[#0e0e14]"
        />
        <StatCard
          icon="📈"
          label="CPM Rate"
          value={`${cpm} $CNDL`}
          sub="per 1k views"
          gradient="bg-gradient-to-br from-[#001a1a] to-[#0e0e14]"
        />
      </div>

      {/* Submissions section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Submissions</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#32fe9f]/10 text-[#32fe9f] border border-[#32fe9f]/30 rounded-full px-4 py-1.5 text-sm font-semibold hover:bg-[#32fe9f]/20 transition-colors"
          >
            + Submit Post
          </button>
        </div>

        {/* Filter tabs */}
        <div className="border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-6">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${
                  filter === tab.id
                    ? "text-[#32fe9f] border-[#32fe9f]"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                    filter === tab.id
                      ? "bg-[#32fe9f]/15 text-[#32fe9f]"
                      : "bg-white/[0.06] text-gray-500"
                  }`}
                >
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center text-gray-600 text-sm">Loading…</div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-gray-600 text-sm">No submissions found</div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#32fe9f]/80 hover:text-[#32fe9f] text-sm truncate block transition-colors"
                  >
                    {post.post_url.replace("https://", "")}
                  </a>
                  <span className="text-gray-600 text-xs">
                    {new Date(post.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-6 ml-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-white text-sm font-medium">{post.views.toLocaleString()}</div>
                    <div className="text-gray-600 text-xs">views</div>
                  </div>
                  <div className="text-right w-20">
                    <div className="text-[#32fe9f] text-sm font-medium">
                      {post.approved === 1 ? `${post.cndl_owed} $CNDL` : "—"}
                    </div>
                    <div className="text-gray-600 text-xs">earned</div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium w-20 text-center ${
                      post.approved === 1
                        ? "bg-[#32fe9f]/10 text-[#32fe9f]"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {post.approved === 1 ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
