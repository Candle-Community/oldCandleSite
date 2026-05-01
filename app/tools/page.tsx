"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";

type Post = {
  id: number;
  post_url: string;
  views: number;
  approved: number;
  cndl_owed: string;
  submitted_at: string;
  multiplier?: number;
};

type FilterTab = "all" | "pending" | "approved";

const MONO = "'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";

export default function ToolsPage() {
  const now = new Date();
  const timestamp =
    now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    ", " +
    now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div
      style={{ fontFamily: MONO }}
      className="min-h-screen bg-[#080b0e] text-[#b8ccb8] flex flex-col"
    >
      {/* Top bar — full width */}
      <header className="flex items-center h-10 border-b border-[#162416] flex-shrink-0">
        {/* Sidebar label */}
        <div className="w-52 flex-shrink-0 flex items-center px-4 h-full border-r border-[#162416]">
          <span className="text-[#32fe9f] text-sm tracking-tight">~/elite</span>
        </div>
        {/* Command bar */}
        <div className="flex-1 flex items-center px-4 gap-2 h-full text-xs">
          <span className="text-[#32fe9f]">›</span>
          <span className="text-gray-600">
            find tools where tier=chad and tag=clipping_
          </span>
          <span className="ml-auto text-gray-700 border border-[#162416] rounded px-1.5 py-0.5 text-[10px]">
            ⌘K
          </span>
        </div>
        {/* Build button */}
        <div className="px-4 flex-shrink-0 border-l border-[#162416] h-full flex items-center">
          <button className="text-xs text-[#32fe9f] border border-[#32fe9f]/40 rounded px-3 py-1 hover:bg-[#32fe9f]/10 transition-colors">
            $ ./build
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 border-r border-[#162416] flex flex-col p-3 gap-0.5">
          <SidebarItem href="/" label="home" hotkey="H" active={false} />
          <SidebarItem href="/tools" label="tools" hotkey="T" active={true} />
          <SidebarItem href="/contribute" label="contribute" hotkey="C" active={false} />

          <div className="mt-6 mb-2 px-2">
            <span className="text-[#1e3a1e] text-[10px] tracking-wider">// WORKSPACE</span>
          </div>
          <div className="px-2 space-y-1.5 text-[11px]">
            <div className="text-gray-600">
              branch: <span className="text-[#32fe9f]">main</span>
            </div>
            <div className="text-gray-600">
              status: <span className="text-[#32fe9f]">● live</span>
            </div>
            <div className="text-gray-600">
              program: <span className="text-gray-400">clipping</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 top-0 w-80 h-80 rounded-full bg-[#32fe9f]/5 blur-3xl" />
          </div>

          <ClippingContent timestamp={timestamp} />
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  href,
  label,
  hotkey,
  active,
}: {
  href: string;
  label: string;
  hotkey: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
        active
          ? "text-[#32fe9f] bg-[#32fe9f]/[0.07]"
          : "text-gray-600 hover:text-gray-300 hover:bg-white/[0.03]"
      }`}
    >
      <span className="flex items-center gap-2">
        {active ? (
          <span className="text-[#32fe9f]">›</span>
        ) : (
          <span className="inline-block w-3" />
        )}
        {label}
      </span>
      <span className="text-gray-700 border border-[#162416] px-1 rounded text-[9px]">
        {hotkey}
      </span>
    </a>
  );
}

function ClippingContent({ timestamp }: { timestamp: string }) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [cpm, setCpm] = useState(5);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
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
        if (data.tokenPrice) setTokenPrice(data.tokenPrice);
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

  const totalViews = posts
    .filter((p) => p.approved === 1)
    .reduce((s, p) => s + p.views, 0);
  const totalCndl = posts
    .filter((p) => p.approved === 1)
    .reduce((s, p) => s + parseFloat(p.cndl_owed), 0)
    .toFixed(2);

  const rawName = session?.user?.name ?? "user";
  const username = rawName.toLowerCase().replace(/\s+/g, ".");

  return (
    <div className="max-w-4xl">
      {/* Terminal window */}
      <div className="border border-[#162416] rounded-lg overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0c1110] border-b border-[#162416]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            <span className="ml-2 text-gray-600 text-xs">
              {username}@candle-elite: ~
            </span>
          </div>
          <span className="text-gray-700 text-[11px]">{timestamp}</span>
        </div>

        {/* Terminal body */}
        <div className="p-6 bg-[#080b0e]">
          {/* Auth intro */}
          {session ? (
            <>
              <p className="text-xs mb-1">
                <span className="text-[#32fe9f]">›</span>
                <span className="text-gray-500">
                  {" "}ssh github.com/candle-elite/clipping-program.git
                </span>
              </p>
              <p className="text-xs text-gray-600 mb-6">
                authenticated via{" "}
                <span className="text-[#a855f7]">discord::{username}</span>{" "}
                <span className="text-[#32fe9f]">✓</span>
              </p>
            </>
          ) : (
            <p className="text-xs mb-6">
              <span className="text-[#32fe9f]">›</span>
              <span className="text-gray-600"> auth required — sign in to continue</span>
            </p>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            clipping_program.
          </h1>

          {session ? (
            <>
              <p className="text-gray-600 text-sm mb-8">
                you have{" "}
                <span className="text-[#32fe9f]">{counts.all} submissions</span> in the
                tracker.{" "}
                {counts.approved > 0 && (
                  <>
                    <span className="text-[#32fe9f]">{counts.approved} approved</span>.
                    {" "}keep going.
                  </>
                )}
              </p>

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                  {
                    key: "total_views",
                    value: totalViews.toLocaleString(),
                    sub: "approved views",
                  },
                  {
                    key: "total_payout",
                    value: `${totalCndl} $CNDL`,
                    sub: tokenPrice
                      ? `≈ $${(parseFloat(totalCndl) * tokenPrice).toFixed(2)} USD`
                      : undefined,
                  },
                  {
                    key: "submissions",
                    value: String(counts.all),
                    sub: `${counts.approved} approved`,
                  },
                  {
                    key: "cpm_rate",
                    value: `$${cpm}`,
                    sub: "USD per 1k views",
                  },
                ].map((s) => (
                  <div
                    key={s.key}
                    className="border border-[#162416] rounded p-4 bg-[#0c1110]"
                  >
                    <div className="text-[#1e3a1e] text-[10px] mb-2 tracking-wider">
                      — {s.key}
                    </div>
                    <div className="text-white font-bold text-xl">{s.value}</div>
                    {s.sub && (
                      <div className="text-gray-600 text-[10px] mt-1">{s.sub}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submissions panel */}
              <div className="border border-[#162416] rounded overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#0c1110] border-b border-[#162416]">
                  <span className="text-[#1e3a1e] text-xs tracking-wider">
                    — my_submissions
                  </span>
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-[11px] text-[#32fe9f] border border-[#32fe9f]/30 rounded px-2.5 py-1 hover:bg-[#32fe9f]/10 transition-colors"
                  >
                    $ submit_post --new
                  </button>
                </div>

                {/* Filter row */}
                <div className="flex items-center gap-3 px-4 py-2 border-b border-[#162416] bg-[#080b0e]">
                  {(["all", "pending", "approved"] as FilterTab[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-[11px] transition-colors ${
                        filter === f
                          ? "text-[#32fe9f]"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                    >
                      {filter === f ? `[ ${f} ${counts[f]} ]` : `${f} ${counts[f]}`}
                    </button>
                  ))}
                </div>

                {/* Rows */}
                <div className="divide-y divide-[#0f1e0f]">
                  {loading ? (
                    <div className="px-4 py-10 text-center text-gray-700 text-xs">
                      loading…
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="px-4 py-10 text-center text-gray-700 text-xs">
                      no submissions found_
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-[#0c1110] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <a
                            href={post.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#32fe9f]/60 hover:text-[#32fe9f] text-xs truncate block transition-colors"
                          >
                            {post.post_url.replace("https://", "")}
                          </a>
                          <span className="text-gray-700 text-[10px]">
                            {new Date(post.submitted_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0 w-28">
                          <div className="text-gray-300 text-xs">
                            {post.views.toLocaleString()}
                          </div>
                          <div className="text-gray-700 text-[10px]">views</div>
                        </div>
                        <div className="text-right flex-shrink-0 w-32">
                          <div className="text-[#32fe9f] text-xs">
                            {post.approved === 1 ? `${post.cndl_owed} $CNDL` : "—"}
                          </div>
                          {post.approved === 1 && tokenPrice && (
                            <div className="text-gray-700 text-[10px]">
                              ≈ ${(parseFloat(post.cndl_owed) * tokenPrice).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div
                          className={`text-[10px] px-2 py-0.5 rounded font-medium w-16 text-center flex-shrink-0 ${
                            post.approved === 1
                              ? "text-[#32fe9f] border border-[#32fe9f]/20 bg-[#32fe9f]/[0.06]"
                              : "text-yellow-500 border border-yellow-500/20 bg-yellow-500/[0.06]"
                          }`}
                        >
                          {post.approved === 1 ? "approved" : "pending"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Not signed in */
            <div className="border border-[#162416] rounded p-10 text-center">
              <div className="text-[#1e3a1e] text-xs mb-4 tracking-wider">
                — auth_required
              </div>
              <p className="text-gray-500 text-sm mb-6">
                sign in with discord to access the clipping program
              </p>
              <button
                onClick={() => signIn("discord")}
                className="text-xs text-[#32fe9f] border border-[#32fe9f]/40 rounded px-5 py-2 hover:bg-[#32fe9f]/10 transition-colors"
              >
                $ auth --provider=discord
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit modal */}
      {showModal && (
        <SubmitModal
          cpm={cpm}
          onClose={() => setShowModal(false)}
          onSubmitted={() => { fetchPosts(); }}
        />
      )}
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
  const [platform, setPlatform] = useState<"x" | "tiktok">("x");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl: postUrl.trim(), xHandle: xHandle.trim(), platform }),
      });
      const data = await res.json();
      if (res.ok) {
        onSubmitted();
        onClose();
      } else {
        setError(data.error || `submission failed (HTTP ${res.status})`);
      }
    } catch {
      setError("network error — make sure the tracker API is running");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", fontFamily: MONO }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl border border-[#162416] rounded-lg overflow-hidden flex"
        style={{ minHeight: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: checklist */}
        <div className="w-72 flex-shrink-0 bg-[#0c1110] border-r border-[#162416] p-6">
          <div className="text-[#1e3a1e] text-[10px] mb-4 tracking-wider">
            — submission_checklist
          </div>
          <p className="text-gray-600 text-xs leading-relaxed mb-6">
            ensure you adhere to all requirements before submitting to maximize approval chance.
          </p>
          <div className="mb-5">
            <div className="text-gray-400 text-[11px] mb-1.5">
              <span className="text-[#32fe9f]">#</span> general
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              posts must feature candle-related content. clips, threads, and commentary qualify. off-topic will be rejected.
            </p>
          </div>
          <div>
            <div className="text-gray-400 text-[11px] mb-1.5">
              <span className="text-[#32fe9f]">#</span> important
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              posts must be{" "}
              <span className="text-gray-300">publicly visible</span> and owned by your account. reposted content does not qualify.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 bg-[#080b0e] flex flex-col">
          {/* Modal window chrome */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#162416] bg-[#0c1110]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-gray-600 text-xs">$ submit_post --new</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-300 transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          <div className="p-6 flex flex-col flex-1">
            <div className="mb-5">
              <h2 className="text-white font-bold text-base">candle elite clipping</h2>
              <p className="text-gray-600 text-xs mt-1">
                <span className="text-[#32fe9f]">${cpm.toFixed(2)} USD</span>
                {" worth of $CNDL per 1k views"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-4">
              {/* Platform toggle */}
              <div>
                <label className="text-gray-600 text-[10px] tracking-wider block mb-2">
                  — platform
                </label>
                <div className="flex gap-2">
                  {(["x", "tiktok"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setPlatform(p); setPostUrl(""); setError(null); }}
                      className={`flex-1 py-2 rounded text-xs font-medium border transition-colors ${
                        platform === p
                          ? p === "tiktok"
                            ? "text-pink-400 border-pink-500/40 bg-pink-500/[0.06]"
                            : "text-[#32fe9f] border-[#32fe9f]/40 bg-[#32fe9f]/[0.06]"
                          : "text-gray-600 border-[#162416] hover:text-gray-400"
                      }`}
                    >
                      {p === "x" ? "𝕏  X / Twitter" : "♪  TikTok"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-600 text-[10px] tracking-wider block mb-2">
                  — {platform === "x" ? "x_post_url" : "tiktok_url"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder={
                    platform === "x"
                      ? "https://x.com/username/status/1234567890"
                      : "https://www.tiktok.com/@username/video/1234567890"
                  }
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  style={{ fontFamily: MONO }}
                  className="w-full bg-[#0c1110] border border-[#162416] rounded px-3 py-2.5 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#32fe9f]/40 transition-colors"
                />
              </div>

              <div>
                <label className="text-gray-600 text-[10px] tracking-wider block mb-2">
                  — {platform === "tiktok" ? "tiktok_handle" : "x_handle"}{" "}
                  <span className="text-gray-700">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder={platform === "tiktok" ? "@yourtiktok" : "@yourhandle"}
                  value={xHandle}
                  onChange={(e) => setXHandle(e.target.value)}
                  style={{ fontFamily: MONO }}
                  className="w-full bg-[#0c1110] border border-[#162416] rounded px-3 py-2.5 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-[#32fe9f]/40 transition-colors"
                />
              </div>

              <label className="flex items-start gap-3 border border-[#162416] rounded p-3 cursor-pointer hover:border-[#32fe9f]/20 transition-colors">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-[#32fe9f] flex-shrink-0"
                />
                <span className="text-gray-600 text-xs leading-relaxed">
                  i&apos;ve read the requirements and acknowledge my submission may be auto-rejected if it doesn&apos;t comply.
                </span>
              </label>

              {error && (
                <div className="text-red-400 text-xs border border-red-500/20 rounded px-3 py-2 bg-red-500/[0.06]">
                  error: {error}
                </div>
              )}

              <div className="mt-auto flex justify-end">
                <button
                  type="submit"
                  disabled={!agreed || submitting}
                  className="text-xs text-[#32fe9f] border border-[#32fe9f]/40 rounded px-5 py-2 hover:bg-[#32fe9f]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {submitting ? "submitting…" : "$ submit --confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
