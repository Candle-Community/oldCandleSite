"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Post = {
  id: number;
  discord_tag: string;
  x_handle: string;
  post_url: string;
  views: number;
  multiplier: number;
  approved: number; // 0=pending, 1=approved, -1=denied
  notes: string;
  submitted_at: string;
  platform?: string;
};

type AdminTab = "pending" | "approved" | "denied" | "tasks";

export default function AdminPanel() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("pending");
  const [denyingId, setDenyingId] = useState<number | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editViews, setEditViews] = useState("");
  const [editMultiplier, setEditMultiplier] = useState("");

  // CPM widget state
  const [cpm, setCpm] = useState<number | null>(null);
  const [cpmInput, setCpmInput] = useState("");
  const [cpmSaving, setCpmSaving] = useState(false);
  const [cpmError, setCpmError] = useState<string | null>(null);
  const [cpmSaved, setCpmSaved] = useState(false);

  // Tasks tab state
  type PayoutTask = {
    discord_id: string;
    discord_tag: string;
    wallet_address: string | null;
    total_views: number;
    post_count: number;
    cndl_owed: string;
    usd_owed: string;
  };
  const [tasks, setTasks] = useState<PayoutTask[]>([]);
  const [taskTokenPrice, setTaskTokenPrice] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [taskSubtab, setTaskSubtab] = useState<"pending" | "completed">("pending");
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/posts");
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to load posts");
        return;
      }
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setError("Cannot reach server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        if (typeof d.usd_cpm === "number") {
          setCpm(d.usd_cpm);
          setCpmInput(String(d.usd_cpm));
        }
      })
      .catch(() => {});
  }, []);

  async function saveCpm() {
    const val = parseFloat(cpmInput);
    if (isNaN(val) || val <= 0) {
      setCpmError("Must be a positive number");
      return;
    }
    setCpmSaving(true);
    setCpmError(null);
    setCpmSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usd_cpm: val }),
      });
      if (res.ok) {
        setCpm(val);
        setCpmSaved(true);
        setTimeout(() => setCpmSaved(false), 2000);
      } else {
        const d = await res.json();
        setCpmError(d.error || `Save failed (HTTP ${res.status})`);
      console.error('[CPM save]', res.status, d);
      }
    } catch {
      setCpmError("Network error");
    } finally {
      setCpmSaving(false);
    }
  }

  async function approve(id: number) {
    setActionLoading(id);
    await fetch(`/api/admin/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: 1 }),
    });
    await fetchPosts();
    setActionLoading(null);
  }

  async function remove(id: number) {
    setActionLoading(id);
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    await fetchPosts();
    setActionLoading(null);
    router.refresh(); // re-fetches server components (leaderboard, stats)
  }

  async function saveEdit(post: Post) {
    setActionLoading(post.id);
    await fetch(`/api/admin/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approved:   post.approved,
        notes:      post.notes,
        views:      parseInt(editViews) >= 0 ? parseInt(editViews) : post.views,
        multiplier: parseFloat(editMultiplier) > 0 ? parseFloat(editMultiplier) : post.multiplier,
      }),
    });
    setEditingId(null);
    await fetchPosts();
    setActionLoading(null);
    router.refresh();
  }

  async function deny(id: number) {
    setActionLoading(id);
    await fetch(`/api/admin/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: -1, notes: denyReason.trim() }),
    });
    setDenyingId(null);
    setDenyReason("");
    await fetchPosts();
    setActionLoading(null);
  }

  const pending  = posts.filter(p => p.approved === 0);
  const approved = posts.filter(p => p.approved === 1);
  const denied   = posts.filter(p => p.approved === -1);
  const shown    = tab === "pending" ? pending : tab === "approved" ? approved : denied;

  const tabs: { id: AdminTab; label: string; count: number }[] = [
    { id: "pending",  label: "Pending",  count: pending.length  },
    { id: "approved", label: "Approved", count: approved.length },
    { id: "denied",   label: "Denied",   count: denied.length   },
    { id: "tasks",    label: "Tasks",    count: tasks.length    },
  ];

  async function loadTasks() {
    setTasksLoading(true);
    try {
      const res = await fetch("/api/admin/tasks");
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setTaskTokenPrice(data.tokenPrice ?? null);
      const week = data.weekStart ?? null;
      setWeekStart(week);
      // Load completed IDs from localStorage for this week
      if (week) {
        const key = `completed_tasks_${week}`;
        const stored = JSON.parse(localStorage.getItem(key) || "[]");
        setCompletedIds(new Set(stored));
      }
    } finally {
      setTasksLoading(false);
    }
  }

  function markPaid(discordId: string) {
    const key = `completed_tasks_${weekStart}`;
    const next = new Set(completedIds);
    next.add(discordId);
    setCompletedIds(next);
    localStorage.setItem(key, JSON.stringify([...next]));
  }

  function unmarkPaid(discordId: string) {
    const key = `completed_tasks_${weekStart}`;
    const next = new Set(completedIds);
    next.delete(discordId);
    setCompletedIds(next);
    localStorage.setItem(key, JSON.stringify([...next]));
  }

  async function saveWallet(discordId: string) {
    setWalletSaving(true);
    try {
      await fetch(`/api/admin/wallets/${discordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: walletInput.trim() }),
      });
      setEditingWallet(null);
      await loadTasks();
    } finally {
      setWalletSaving(false);
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-gray-600 text-sm">Loading submissions…</div>;
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400 text-sm">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* CPM Widget */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest flex-shrink-0">
          CPM Rate
        </span>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-600 text-xs">$</span>
          <input
            type="number"
            step="0.5"
            min="0.01"
            value={cpmInput}
            onChange={e => { setCpmInput(e.target.value); setCpmSaved(false); setCpmError(null); }}
            onKeyDown={e => e.key === "Enter" && saveCpm()}
            className="w-20 bg-[#1a1d24] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF6021]/50"
          />
          <span className="text-gray-600 text-xs">USD per 1k views</span>
        </div>
        {cpmError && <span className="text-red-400 text-xs">{cpmError}</span>}
        {cpmSaved && <span className="text-[#32fe9f] text-xs">Saved!</span>}
        {cpm !== null && (
          <span className="text-gray-600 text-xs">
            Current: <span className="text-white">${cpm}</span>
          </span>
        )}
        <button
          onClick={saveCpm}
          disabled={cpmSaving}
          className="text-xs px-3 py-1.5 rounded-full font-semibold bg-[#FF6021]/15 text-[#FF6021] border border-[#FF6021]/80 hover:bg-[#FF6021]/30 transition-all disabled:opacity-40 flex-shrink-0"
        >
          {cpmSaving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06]">
        <div className="flex gap-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? "text-[#FF6021] border-[#FF6021]"
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                tab === t.id ? "bg-[#FF6021]/15 text-[#FF6021]" : "bg-white/[0.06] text-gray-500"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tasks tab ── */}
      {tab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Weekly payout tasks — $CNDL owed to each wallet</p>
              {weekStart && (
                <p className="text-xs text-gray-600 mt-0.5">
                  Week of {new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              {taskTokenPrice && (
                <p className="text-xs text-gray-600 mt-0.5">
                  Live price: ${taskTokenPrice < 0.001 ? taskTokenPrice.toFixed(7) : taskTokenPrice.toFixed(4)} / $CNDL
                </p>
              )}
            </div>
            <button
              onClick={loadTasks}
              disabled={tasksLoading}
              className="text-xs px-3 py-1.5 rounded-full font-semibold bg-[#FF6021]/15 text-[#FF6021] border border-[#FF6021]/80 hover:bg-[#FF6021]/30 transition-all disabled:opacity-40"
            >
              {tasksLoading ? "Loading…" : tasks.length === 0 ? "Load Tasks" : "Refresh"}
            </button>
          </div>

          {/* Subtabs */}
          {tasks.length > 0 && (
            <div className="flex gap-4 border-b border-white/[0.06]">
              {(["pending", "completed"] as const).map(st => {
                const count = st === "pending"
                  ? tasks.filter(t => !completedIds.has(t.discord_id)).length
                  : tasks.filter(t => completedIds.has(t.discord_id)).length;
                return (
                  <button
                    key={st}
                    onClick={() => setTaskSubtab(st)}
                    className={`pb-2 text-xs font-semibold capitalize transition-colors border-b-2 ${
                      taskSubtab === st
                        ? "text-[#FF6021] border-[#FF6021]"
                        : "text-gray-500 border-transparent hover:text-gray-300"
                    }`}
                  >
                    {st === "pending" ? "Pending" : "Completed"} <span className="ml-1 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {tasks.length === 0 && !tasksLoading ? (
            <div className="py-16 text-center text-gray-600 text-sm">
              Click &quot;Load Tasks&quot; to fetch this week&apos;s payouts.
            </div>
          ) : (() => {
            const shown = tasks.filter(t =>
              taskSubtab === "pending" ? !completedIds.has(t.discord_id) : completedIds.has(t.discord_id)
            );
            return (
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="grid grid-cols-6 px-5 py-3 text-xs text-gray-500 uppercase tracking-widest border-b border-white/[0.06]">
                  <span>Member</span>
                  <span>Posts</span>
                  <span className="text-right">Views</span>
                  <span className="text-right">$CNDL Owed</span>
                  <span>Wallet Address</span>
                  <span />
                </div>
                {shown.length === 0 && (
                  <div className="py-10 text-center text-gray-600 text-sm">
                    No {taskSubtab} tasks.
                  </div>
                )}
                {shown.map(task => (
                  <div
                    key={task.discord_id}
                    className={`grid grid-cols-6 items-center px-5 py-4 border-b border-white/[0.04] last:border-0 gap-3 ${
                      completedIds.has(task.discord_id) ? "opacity-50" : !task.wallet_address ? "bg-red-500/[0.03]" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-white">{task.discord_tag}</span>
                    <span className="text-sm text-gray-400">{task.post_count}</span>
                    <span className="text-right text-sm font-mono text-gray-300">
                      {task.total_views.toLocaleString()}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-mono text-[#32fe9f] font-semibold">
                        {parseFloat(task.cndl_owed).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-600">≈ ${task.usd_owed}</div>
                    </div>
                    {/* Wallet address — editable */}
                    <div className="min-w-0">
                      {editingWallet === task.discord_id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={walletInput}
                            onChange={e => setWalletInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && saveWallet(task.discord_id)}
                            className="w-full bg-white/[0.06] border border-white/10 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#FF6021]/50"
                            placeholder="Wallet address"
                          />
                          <button
                            onClick={() => saveWallet(task.discord_id)}
                            disabled={walletSaving}
                            className="text-[10px] px-2 py-1 rounded bg-[#FF6021]/20 text-[#FF6021] border border-[#FF6021]/50 hover:bg-[#FF6021]/30 disabled:opacity-40"
                          >
                            {walletSaving ? "…" : "Save"}
                          </button>
                          <button onClick={() => setEditingWallet(null)} className="text-gray-600 hover:text-gray-400 text-[10px] px-1">✕</button>
                        </div>
                      ) : task.wallet_address ? (
                        <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                          {task.wallet_address.slice(0, 6)}…{task.wallet_address.slice(-6)}
                          <button onClick={() => navigator.clipboard.writeText(task.wallet_address!)} className="text-gray-600 hover:text-[#FF6021]" title="Copy">⧉</button>
                          <button onClick={() => { setEditingWallet(task.discord_id); setWalletInput(task.wallet_address!); }} className="text-gray-600 hover:text-[#FF6021]" title="Edit">✎</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => { setEditingWallet(task.discord_id); setWalletInput(""); }}
                          className="text-xs text-red-400/70 italic hover:text-red-400 transition-colors"
                        >
                          No wallet — click to add
                        </button>
                      )}
                    </div>
                    {/* Mark paid / undo */}
                    <div className="flex justify-end">
                      {completedIds.has(task.discord_id) ? (
                        <button
                          onClick={() => unmarkPaid(task.discord_id)}
                          className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-white/[0.04] text-gray-500 border border-white/10 hover:text-gray-300 transition-all"
                        >
                          Undo
                        </button>
                      ) : (
                        <button
                          onClick={() => markPaid(task.discord_id)}
                          className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-[#32fe9f]/10 text-[#32fe9f] border border-[#32fe9f]/40 hover:bg-[#32fe9f]/20 transition-all"
                        >
                          ✓ Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {/* Total row — only on pending tab */}
                {taskSubtab === "pending" && shown.length > 0 && (
                  <div className="grid grid-cols-6 items-center px-5 py-3 bg-white/[0.02] border-t border-white/[0.08]">
                    <span className="text-xs text-gray-500 font-semibold uppercase col-span-2">Total</span>
                    <span className="text-right text-xs font-mono text-gray-400">
                      {shown.reduce((s, t) => s + t.total_views, 0).toLocaleString()}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-mono text-[#32fe9f] font-bold">
                        {shown.reduce((s, t) => s + parseFloat(t.cndl_owed), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-600">
                        ≈ ${shown.reduce((s, t) => s + parseFloat(t.usd_owed), 0).toFixed(2)}
                      </div>
                    </div>
                    <span /><span />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Post list */}
      {tab !== "tasks" && shown.length === 0 ? (
        <div className="py-16 text-center text-gray-600 text-sm">
          No {tab} submissions.
        </div>
      ) : tab !== "tasks" && (
        <div className="space-y-3">
          {shown.map(post => {
            const xProfileUrl = post.x_handle
              ? `https://x.com/${post.x_handle.replace(/^@/, "")}`
              : null;
            const isDenying = denyingId === post.id;

            return (
              <div
                key={post.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white text-sm font-semibold">
                        {post.discord_tag}
                      </span>
                      {xProfileUrl && (
                        <a
                          href={xProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 text-xs hover:text-[#FF6021] transition-colors"
                        >
                          @{post.x_handle.replace(/^@/, "")} ↗
                        </a>
                      )}
                      <span className="text-gray-600 text-xs">
                        {new Date(post.submitted_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        post.platform === "tiktok"
                          ? "bg-pink-500/15 text-pink-400"
                          : "bg-sky-500/15 text-sky-400"
                      }`}>
                        {post.platform === "tiktok" ? "TikTok" : "X"}
                      </span>
                    </div>
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF6021]/70 hover:text-[#FF6021] text-xs truncate block transition-colors"
                    >
                      {post.post_url}
                    </a>
                    {tab === "denied" && (
                      <div className={`text-xs mt-0.5 ${post.notes ? "text-red-400/80" : "text-gray-600 italic"}`}>
                        {post.notes ? `Reason: ${post.notes}` : "No reason given"}
                      </div>
                    )}
                    {tab !== "denied" && post.notes && (
                      <div className="text-gray-500 text-xs italic">Note: {post.notes}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right mr-2">
                      <div className="text-white text-sm font-medium">{post.views.toLocaleString()}</div>
                      <div className="text-gray-600 text-xs">views · ×{post.multiplier ?? 1}</div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingId(post.id);
                        setEditViews(String(post.views));
                        setEditMultiplier(String(post.multiplier ?? 1));
                        setDenyingId(null);
                        setConfirmDeleteId(null);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full font-semibold bg-white/[0.06] text-gray-400 border border-white/10 hover:text-white hover:border-white/20 transition-all"
                    >
                      Edit
                    </button>

                    {tab === "pending" && (
                      <>
                        <button
                          onClick={() => approve(post.id)}
                          disabled={actionLoading === post.id}
                          className="text-xs px-3 py-1.5 rounded-full font-semibold bg-[#FF6021]/15 text-[#FF6021] border border-[#FF6021]/80 shadow-[inset_0_5px_10px_rgba(255,96,33,0.15)] hover:bg-[#FF6021]/30 transition-all disabled:opacity-40"
                        >
                          {actionLoading === post.id ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => { setDenyingId(post.id); setDenyReason(""); }}
                          disabled={actionLoading === post.id}
                          className="text-xs px-3 py-1.5 rounded-full font-semibold bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20 transition-all disabled:opacity-40"
                        >
                          Deny
                        </button>
                      </>
                    )}

                    {tab === "approved" && (
                      <>
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#FF6021]/10 text-[#FF6021]">
                          Approved
                        </span>
                        <button
                          onClick={() => setConfirmDeleteId(post.id)}
                          disabled={actionLoading === post.id}
                          className="text-xs px-3 py-1.5 rounded-full font-semibold bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20 transition-all disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </>
                    )}

                    {tab === "denied" && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/10 text-red-400">
                        Denied
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove confirmation */}
                {confirmDeleteId === post.id && (
                  <div className="flex items-center gap-3 pt-1 border-t border-white/[0.06]">
                    <span className="text-xs text-gray-400 flex-1">Permanently remove this post? This will also remove it from the leaderboard.</span>
                    <button
                      onClick={() => remove(post.id)}
                      disabled={actionLoading === post.id}
                      className="text-xs px-3 py-2 rounded-full font-semibold bg-red-500/15 text-red-400 border border-red-500/60 hover:bg-red-500/25 transition-all disabled:opacity-40"
                    >
                      {actionLoading === post.id ? "…" : "Yes, remove"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Edit views / multiplier */}
                {editingId === post.id && (
                  <div className="flex items-center gap-3 pt-1 border-t border-white/[0.06] flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Views</label>
                      <input
                        type="number"
                        value={editViews}
                        onChange={e => setEditViews(e.target.value)}
                        className="w-28 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF6021]/50"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">CPM multiplier</label>
                      <input
                        type="number"
                        step="0.25"
                        value={editMultiplier}
                        onChange={e => setEditMultiplier(e.target.value)}
                        className="w-20 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#FF6021]/50"
                      />
                    </div>
                    <button
                      onClick={() => saveEdit(post)}
                      disabled={actionLoading === post.id}
                      className="text-xs px-3 py-1.5 rounded-full font-semibold bg-[#FF6021]/15 text-[#FF6021] border border-[#FF6021]/80 hover:bg-[#FF6021]/30 transition-all disabled:opacity-40"
                    >
                      {actionLoading === post.id ? "…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Deny reason input (inline, expands on click) */}
                {isDenying && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                    <input
                      autoFocus
                      type="text"
                      value={denyReason}
                      onChange={e => setDenyReason(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && deny(post.id)}
                      placeholder="Reason for denial (optional)"
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                    />
                    <button
                      onClick={() => deny(post.id)}
                      disabled={actionLoading === post.id}
                      className="text-xs px-3 py-2 rounded-full font-semibold bg-red-500/15 text-red-400 border border-red-500/60 hover:bg-red-500/25 transition-all disabled:opacity-40"
                    >
                      {actionLoading === post.id ? "…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setDenyingId(null)}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

