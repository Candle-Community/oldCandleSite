"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
interface Member {
  id: string;
  xHandle: string;
  discordUsername: string;
}

interface Post {
  id: string;
  xHandle: string;
  postUrl: string;
  views: number;
  likes: number;
  reposts: number;
  postDate: string;
  notes: string;
  approved: boolean;
  submittedAt: string;
}

interface LeaderboardRow {
  xHandle: string;
  discordUsername: string;
  postCount: number;
  totalViews: number;
  totalLikes: number;
  totalReposts: number;
}

// ── DB (localStorage) ──────────────────────────────────────────
const DB = {
  getMembers: (): Member[] => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("ct_members") || "[]");
  },
  saveMembers: (m: Member[]) => localStorage.setItem("ct_members", JSON.stringify(m)),
  getPosts: (): Post[] => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("ct_posts") || "[]");
  },
  savePosts: (p: Post[]) => localStorage.setItem("ct_posts", JSON.stringify(p)),
  getLeaderboard: (): LeaderboardRow[] => {
    const posts = DB.getPosts().filter((p) => p.approved);
    const members = DB.getMembers();
    const map: Record<string, LeaderboardRow> = {};
    posts.forEach((p) => {
      if (!map[p.xHandle]) {
        const m = members.find((m) => m.xHandle === p.xHandle);
        map[p.xHandle] = {
          xHandle: p.xHandle,
          discordUsername: m?.discordUsername || "",
          postCount: 0,
          totalViews: 0,
          totalLikes: 0,
          totalReposts: 0,
        };
      }
      map[p.xHandle].postCount++;
      map[p.xHandle].totalViews += p.views || 0;
      map[p.xHandle].totalLikes += p.likes || 0;
      map[p.xHandle].totalReposts += p.reposts || 0;
    });
    return Object.values(map).sort((a, b) => b.totalViews - a.totalViews);
  },
};

// ── Helpers ────────────────────────────────────────────────────
function fmtNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return (n || 0).toString();
}
function fmtDate(d: string): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}
function cndlOwed(v: number): string {
  return (((v || 0) / 1000) * 0.1).toFixed(2);
}
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

type Tab = "dashboard" | "members" | "submit" | "admin" | "clipping";

// ══════════════════════════════════════════════════════════════
export default function TrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00c896] to-[#009e78] flex items-center justify-center text-black font-bold text-sm">
              C
            </div>
            <span className="font-bold text-lg tracking-tight">
              Candle <span className="elite-gradient">Elite</span>
            </span>
          </Link>

          {/* Tab nav */}
          <div className="flex items-center gap-1">
            {(
              [
                { id: "dashboard", label: "Dashboard" },
                { id: "members",   label: "Members"   },
                { id: "submit",    label: "Submit Post"},
                { id: "admin",     label: "Admin"     },
                { id: "clipping",  label: "🎬 Clipping AI" },
              ] as { id: Tab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === t.id
                    ? "bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Link
            href="/"
            className="text-xs text-gray-500 border border-[#222] rounded-full px-3 py-1 hover:border-[#00c896]/40 hover:text-gray-300 transition-colors"
          >
            ← Back to Main
          </Link>
        </div>
      </header>

      {/* Tab content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "members"   && <MembersTab />}
        {activeTab === "submit"    && <SubmitTab />}
        {activeTab === "admin"     && <AdminTab />}
        {activeTab === "clipping"  && <ClippingTab />}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD TAB
// ══════════════════════════════════════════════════════════════
function DashboardTab() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [allPosts, setAllPosts]       = useState<Post[]>([]);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setLeaderboard(DB.getLeaderboard());
    setAllPosts(DB.getPosts());
  }, []);

  const members  = DB.getMembers();
  const approved = allPosts.filter((p) => p.approved);
  const totalViews = leaderboard.reduce((s, r) => s + r.totalViews, 0);
  const totalCndl  = leaderboard.reduce((s, r) => s + parseFloat(cndlOwed(r.totalViews)), 0);

  const filtered = allPosts.filter((p) => {
    const matchUser   = p.xHandle.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && p.approved) ||
      (statusFilter === "pending"  && !p.approved);
    return matchUser && matchStatus;
  });

  const medals = ["👑", "🥈", "🥉"];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Leaderboard ranked by total approved views</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Views",    value: fmtNum(totalViews)       },
          { label: "Approved Posts", value: approved.length           },
          { label: "Members",        value: members.length            },
          { label: "$CNDL Owed",     value: totalCndl.toFixed(2)     },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-2xl font-bold text-[#00c896]">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1a1a1a]">
          <h2 className="font-semibold">Leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {["#", "X Handle", "Discord", "Posts", "Total Views", "Likes", "Reposts", "$CNDL Owed"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-600 py-12">
                    No approved posts yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((r, i) => (
                  <tr key={r.xHandle} className="border-b border-[#111] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-lg">{medals[i] || i + 1}</td>
                    <td className="px-4 py-3">
                      <a href={`https://x.com/${r.xHandle}`} target="_blank" rel="noreferrer"
                        className="text-[#00c896] hover:text-[#33d4aa] transition-colors font-medium">
                        @{r.xHandle}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{r.discordUsername || "—"}</td>
                    <td className="px-4 py-3 text-gray-300">{r.postCount}</td>
                    <td className="px-4 py-3 font-semibold text-white">{fmtNum(r.totalViews)}</td>
                    <td className="px-4 py-3 text-gray-300">{fmtNum(r.totalLikes)}</td>
                    <td className="px-4 py-3 text-gray-300">{fmtNum(r.totalReposts)}</td>
                    <td className="px-4 py-3 font-semibold text-green-400">{cndlOwed(r.totalViews)} $CNDL</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent Posts</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search by handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c896]/50 w-48"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00c896]/50"
            >
              <option value="all">All Posts</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center text-gray-600">No posts found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...filtered].reverse().map((p) => {
              const m = members.find((m) => m.xHandle === p.xHandle);
              return (
                <div key={p.id} className={`card p-5 border-l-2 ${p.approved ? "border-l-green-500" : "border-l-[#00c896]"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#00c896]">@{p.xHandle}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.approved ? "bg-green-500/10 text-green-400" : "bg-[#00c896]/10 text-[#00c896]"
                    }`}>
                      {p.approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  {m?.discordUsername && <div className="text-xs text-gray-500 mb-1">{m.discordUsername}</div>}
                  <div className="text-xs text-gray-600 mb-3">{fmtDate(p.postDate)}</div>
                  <div className="flex gap-4 mb-3">
                    {[
                      { val: fmtNum(p.views),   lbl: "Views"   },
                      { val: fmtNum(p.likes),   lbl: "Likes"   },
                      { val: fmtNum(p.reposts), lbl: "Reposts" },
                    ].map((s) => (
                      <div key={s.lbl} className="text-center">
                        <div className="font-bold text-sm">{s.val}</div>
                        <div className="text-xs text-gray-600">{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                  {p.notes && <div className="text-xs text-gray-500 italic mb-3">{p.notes}</div>}
                  <a href={p.postUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-[#00c896] hover:text-[#33d4aa] font-semibold transition-colors">
                    View Post →
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MEMBERS TAB
// ══════════════════════════════════════════════════════════════
function MembersTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [xHandle, setXHandle]  = useState("");
  const [discord, setDiscord]  = useState("");

  useEffect(() => { setMembers(DB.getMembers()); }, []);

  const posts = DB.getPosts().filter((p) => p.approved);

  function addMember() {
    const handle = xHandle.trim().replace("@", "");
    if (!handle) return;
    const all = DB.getMembers();
    if (all.find((m) => m.xHandle === handle)) { alert("Member already exists."); return; }
    all.push({ id: genId(), xHandle: handle, discordUsername: discord.trim() });
    DB.saveMembers(all);
    setMembers(all);
    setXHandle(""); setDiscord(""); setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-gray-400 text-sm mt-1">All registered community members</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#00c896] text-black rounded-lg text-sm font-bold hover:bg-[#33d4aa] transition-colors"
        >
          + Add Member
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Add New Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">X Handle</label>
              <input value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@username"
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c896]/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Discord Username</label>
              <input value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="username"
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c896]/50" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={addMember}
              className="px-4 py-2 bg-[#00c896] text-black rounded-lg text-sm font-bold hover:bg-[#33d4aa] transition-colors">
              Add Member
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="card p-12 text-center text-gray-600">No members yet. Add one above.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => {
            const mPosts     = posts.filter((p) => p.xHandle === m.xHandle);
            const totalViews = mPosts.reduce((s, p) => s + (p.views || 0), 0);
            return (
              <div key={m.id} className="card p-5">
                <div className="font-semibold text-[#00c896] mb-1">@{m.xHandle}</div>
                {m.discordUsername && <div className="text-sm text-gray-500 mb-4">{m.discordUsername}</div>}
                <div className="flex gap-6 mt-auto">
                  {[
                    { val: mPosts.length,          lbl: "Posts"  },
                    { val: fmtNum(totalViews),      lbl: "Views"  },
                    { val: cndlOwed(totalViews),    lbl: "$CNDL"  },
                  ].map((s) => (
                    <div key={s.lbl} className="text-center">
                      <div className="font-bold">{s.val}</div>
                      <div className="text-xs text-gray-600">{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  SUBMIT TAB
// ══════════════════════════════════════════════════════════════
function SubmitTab() {
  const [form, setForm] = useState({
    xHandle: "", postUrl: "", views: "", likes: "", reposts: "", postDate: "", notes: "",
  });
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  function set(field: string, val: string) { setForm((f) => ({ ...f, [field]: val })); }

  function submit() {
    const handle = form.xHandle.trim().replace("@", "");
    if (!handle || !form.postUrl.trim()) {
      setMsg({ text: "X handle and post URL are required.", type: "error" }); return;
    }
    const posts = DB.getPosts();
    posts.push({
      id: genId(), xHandle: handle, postUrl: form.postUrl.trim(),
      views: parseInt(form.views) || 0, likes: parseInt(form.likes) || 0,
      reposts: parseInt(form.reposts) || 0, postDate: form.postDate,
      notes: form.notes.trim(), approved: false, submittedAt: new Date().toISOString(),
    });
    DB.savePosts(posts);
    setForm({ xHandle: "", postUrl: "", views: "", likes: "", reposts: "", postDate: "", notes: "" });
    setMsg({ text: "Post submitted! Awaiting admin approval.", type: "success" });
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Submit Post</h1>
        <p className="text-gray-400 text-sm mt-1">Submit an X post for approval and earn $CNDL</p>
      </div>

      <div className="card p-6 space-y-4">
        <Field label="X Handle">
          <input value={form.xHandle} onChange={(e) => set("xHandle", e.target.value)} placeholder="@yourhandle" />
        </Field>
        <Field label="Post URL">
          <input type="url" value={form.postUrl} onChange={(e) => set("postUrl", e.target.value)} placeholder="https://x.com/..." />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Views">
            <input type="number" value={form.views} onChange={(e) => set("views", e.target.value)} placeholder="0" min="0" />
          </Field>
          <Field label="Likes">
            <input type="number" value={form.likes} onChange={(e) => set("likes", e.target.value)} placeholder="0" min="0" />
          </Field>
          <Field label="Reposts">
            <input type="number" value={form.reposts} onChange={(e) => set("reposts", e.target.value)} placeholder="0" min="0" />
          </Field>
          <Field label="Post Date">
            <input type="text" value={form.postDate} onChange={(e) => set("postDate", e.target.value)} placeholder="YYYY-MM-DD" />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Any extra context..." />
        </Field>

        <button onClick={submit}
          className="w-full py-3 bg-[#00c896] text-black rounded-lg font-bold text-sm hover:bg-[#33d4aa] transition-colors">
          Submit for Approval →
        </button>

        {msg && (
          <div className={`text-sm px-4 py-3 rounded-lg ${
            msg.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="[&_input]:w-full [&_input]:bg-[#0a0a0a] [&_input]:border [&_input]:border-[#222] [&_input]:rounded-lg [&_input]:px-4 [&_input]:py-3 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder-gray-600 [&_input]:outline-none [&_input:focus]:border-[#00c896]/50 [&_textarea]:w-full [&_textarea]:bg-[#0a0a0a] [&_textarea]:border [&_textarea]:border-[#222] [&_textarea]:rounded-lg [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-white [&_textarea]:placeholder-gray-600 [&_textarea]:outline-none [&_textarea:focus]:border-[#00c896]/50 [&_textarea]:resize-none [&_textarea]:font-sans">
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ADMIN TAB
// ══════════════════════════════════════════════════════════════
function AdminTab() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => { setPosts(DB.getPosts()); }, []);

  const pending  = posts.filter((p) => !p.approved);
  const approved = posts.filter((p) => p.approved);

  function approvePost(id: string) {
    const all = DB.getPosts();
    const p   = all.find((p) => p.id === id);
    if (p) { p.approved = true; DB.savePosts(all); setPosts([...all]); }
  }

  function deletePost(id: string) {
    if (!confirm("Are you sure?")) return;
    const all = DB.getPosts().filter((p) => p.id !== id);
    DB.savePosts(all);
    setPosts([...all]);
  }

  function AdminPostList({ items, isApproved }: { items: Post[]; isApproved: boolean }) {
    if (!items.length) return (
      <div className="card p-10 text-center text-gray-600">
        {isApproved ? "No approved posts." : "No pending posts."}
      </div>
    );
    return (
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="card p-5 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#00c896] mb-1">@{p.xHandle}</div>
              <div className="text-xs text-gray-500 mb-1">
                {fmtDate(p.postDate)} · {fmtNum(p.views)} views · {fmtNum(p.likes)} likes · {fmtNum(p.reposts)} reposts
              </div>
              <a href={p.postUrl} target="_blank" rel="noreferrer"
                className="text-xs text-gray-600 hover:text-gray-400 truncate block transition-colors">
                {p.postUrl}
              </a>
              {p.notes && <div className="text-xs text-gray-600 italic mt-1">{p.notes}</div>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!isApproved && (
                <button onClick={() => approvePost(p.id)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-black transition-colors">
                  Approve
                </button>
              )}
              <button onClick={() => deletePost(p.id)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors">
                {isApproved ? "Remove" : "Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-gray-400 text-sm mt-1">Review and approve submitted posts</p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-sm">
        <div className="card p-4 text-center">
          <div className="text-xl font-bold text-[#00c896]">{pending.length}</div>
          <div className="text-xs text-gray-500 mt-1">Pending</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xl font-bold text-green-400">{approved.length}</div>
          <div className="text-xs text-gray-500 mt-1">Approved</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xl font-bold text-white">{posts.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total</div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          Pending Posts
          {pending.length > 0 && (
            <span className="text-xs bg-[#00c896]/10 text-[#00c896] border border-[#00c896]/20 px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </h2>
        <AdminPostList items={pending} isApproved={false} />
      </div>

      <div>
        <h2 className="font-semibold mb-4">Approved Posts</h2>
        <AdminPostList items={approved} isApproved={true} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  CLIPPING AI TAB
// ══════════════════════════════════════════════════════════════
function ClippingTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [streamName, setStreamName]     = useState("");
  const [numClips, setNumClips]         = useState(8);
  const [isDragging, setIsDragging]     = useState(false);
  const [status, setStatus]             = useState<{
    visible: boolean;
    step: string;
    message: string;
    pct: number;
    elapsed: string;
    clips: { name: string; hook: string; reason: string; drive_link?: string }[];
    error: string;
  }>({
    visible: false, step: "", message: "", pct: 0, elapsed: "", clips: [], error: "",
  });
  const [processing, setProcessing] = useState(false);

  const stepProgress: Record<string, number> = {
    uploading: 5, transcribing: 30, analysing: 65, rendering: 85, uploading_drive: 95, done: 100, error: 0,
  };

  const handleFile = useCallback((f: File) => { setSelectedFile(f); }, []);

  async function processStream() {
    if (!selectedFile) return;
    const name = streamName.trim() || selectedFile.name.replace(/\.[^.]+$/, "").replace(/\s+/g, "_");
    setProcessing(true);
    setStatus({ visible: true, step: "Step 1/4 — Upload", message: "Uploading video...", pct: 5, elapsed: "0:00", clips: [], error: "" });

    const form = new FormData();
    form.append("file", selectedFile);
    form.append("stream_name", name);
    form.append("num_clips", String(numClips));

    let jobId: string;
    const start = Date.now();
    const timer = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      setStatus((s) => ({ ...s, elapsed: `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}` }));
    }, 1000);

    try {
      const res  = await fetch("/process", { method: "POST", body: form });
      const data = await res.json();
      jobId = data.job_id;
    } catch {
      clearInterval(timer);
      setStatus((s) => ({ ...s, step: "Error", message: "Upload failed. Is the Python server running?", pct: 0, error: "Upload failed." }));
      setProcessing(false);
      return;
    }

    const stepMap: Record<string, string> = {
      uploading: "Step 1/4 — Upload", transcribing: "Step 2/4 — Transcription",
      analysing: "Step 3/4 — AI Analysis", rendering: "Step 4/4 — Rendering",
      uploading_drive: "Step 4/4 — Google Drive", done: "Complete", error: "Error",
    };

    const poll = setInterval(async () => {
      try {
        const res  = await fetch(`/status/${jobId}`);
        const data = await res.json();
        setStatus((s) => ({
          ...s,
          step: stepMap[data.status] || data.status,
          pct:  stepProgress[data.status] ?? 0,
          message: data.status === "done" ? data.message : (data.message || ""),
          clips: data.status === "done" ? (data.clips || []) : s.clips,
          error: data.status === "error" ? data.message : "",
        }));
        if (data.status === "done" || data.status === "error") {
          clearInterval(poll); clearInterval(timer); setProcessing(false);
        }
      } catch { /* keep polling */ }
    }, 3000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold">
          Candle<span className="elite-gradient">Clipping</span>.ai
        </h1>
        <p className="text-gray-400 mt-2">Drop a stream. Get viral clips. Automatically.</p>
      </div>

      {/* Upload card */}
      <div className="card p-6 space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => document.getElementById("clip-file-input")?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-[#00c896] bg-[#00c896]/5"
              : "border-[#222] hover:border-[#333] hover:bg-white/[0.02]"
          }`}
        >
          <div className="text-4xl mb-3">🎬</div>
          <p className="text-gray-400 text-sm">
            <span className="text-[#00c896] font-semibold">Drop your stream file here</span>
          </p>
          <p className="text-gray-600 text-xs mt-1">or click to select — MP4, MOV, MKV</p>
          <input id="clip-file-input" type="file" accept="video/*" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>

        {selectedFile && (
          <div className="bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-xs text-gray-400">
            Selected: <span className="text-white">{selectedFile.name}</span>{" "}
            ({(selectedFile.size / 1e6).toFixed(1)} MB)
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Stream Name</label>
            <input value={streamName} onChange={(e) => setStreamName(e.target.value)} placeholder="e.g. March_Stream_01"
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#00c896]/50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Clips to Generate</label>
            <input type="number" value={numClips} min={1} max={20}
              onChange={(e) => setNumClips(parseInt(e.target.value) || 8)}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-[#00c896]/50" />
          </div>
        </div>

        <button
          onClick={processStream}
          disabled={!selectedFile || processing}
          className="w-full py-3 bg-[#00c896] text-black rounded-lg font-bold text-sm hover:bg-[#33d4aa] transition-colors disabled:bg-[#222] disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          {processing ? "Processing..." : !selectedFile ? "Select a video to continue" : "Process Stream →"}
        </button>
      </div>

      {/* Status */}
      {status.visible && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">{status.step}</div>
              <div className={`font-medium text-sm ${status.error ? "text-red-400" : "text-white"}`}>
                {status.error || status.message || "Processing..."}
              </div>
            </div>
            <div className="text-xs text-gray-600">{status.elapsed}</div>
          </div>

          {/* Progress bar */}
          <div className="bg-[#0a0a0a] rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00c896] to-[#009e78] rounded-full transition-all duration-700"
              style={{ width: `${status.pct}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 text-right">{status.pct}%</div>

          {/* Clips */}
          {status.clips.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-sm font-semibold text-green-400">✓ {status.clips.length} clips ready</div>
              {status.clips.map((c, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
                  <div className="font-semibold text-[#00c896] text-sm mb-1">Clip {i + 1} — {c.name}</div>
                  <div className="text-xs text-gray-400 italic mb-1">"{c.hook}"</div>
                  <div className="text-xs text-gray-600 mb-3">{c.reason}</div>
                  {c.drive_link && (
                    <a href={c.drive_link} target="_blank" rel="noreferrer"
                      className="inline-block px-3 py-1.5 bg-[#00c896] text-black rounded-lg text-xs font-bold hover:bg-[#33d4aa] transition-colors">
                      Open in Drive →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-700 pb-4">
        candleclipping.ai — powered by Candle.tv
      </p>
    </div>
  );
}
