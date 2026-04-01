"use client";

import { useState, useEffect } from "react";

type Member = {
  discord_tag: string;
  x_handle: string;
  total_views: number;
  post_count: number;
  cndl_owed: string;
  usd_owed: string;
};

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export default function PayoutMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payouts")
      .then(r => r.json())
      .then(data => {
        setMembers(data.members ?? []);
        setTokenPrice(data.tokenPrice ?? null);
      })
      .catch(() => setError("Failed to load payout data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-gray-600 text-sm">Loading…</div>;
  if (error)   return <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400 text-sm">{error}</div>;
  if (members.length === 0) return <div className="py-12 text-center text-gray-600 text-sm">No approved posts yet.</div>;

  const totalCndl = members.reduce((s, m) => s + parseFloat(m.cndl_owed), 0);
  const totalUsd  = members.reduce((s, m) => s + parseFloat(m.usd_owed), 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-[#FF6021] to-[#cc4a0f] rounded-full" />
        <h2 className="text-2xl font-bold">Payout Summary</h2>
        <span className="ml-auto text-xs font-mono text-[#FF6021] bg-[#FF6021]/10 border border-[#FF6021]/20 rounded-full px-3 py-1">
          Live
        </span>
      </div>

      {/* Totals row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total $CNDL Owed</p>
          <p className="text-2xl font-bold text-[#32fe9f]">{formatNum(totalCndl)}</p>
          <p className="text-xs text-gray-600 mt-1">Across all members</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total USD Owed</p>
          <p className="text-2xl font-bold text-white">${totalUsd.toFixed(2)}</p>
          {tokenPrice && <p className="text-xs text-gray-600 mt-1">At ${tokenPrice < 0.001 ? tokenPrice.toFixed(7) : tokenPrice.toFixed(4)} / $CNDL</p>}
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Members Owed</p>
          <p className="text-2xl font-bold text-white">{members.length}</p>
          <p className="text-xs text-gray-600 mt-1">With approved posts</p>
        </div>
      </div>

      {/* Member table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-5 px-5 py-3 text-xs text-gray-500 uppercase tracking-widest border-b border-white/[0.06]">
          <span>Member</span>
          <span>X Handle</span>
          <span className="text-right">Posts</span>
          <span className="text-right">Views</span>
          <span className="text-right">$CNDL Owed</span>
        </div>
        {members.map((m, i) => (
          <div
            key={m.discord_tag + i}
            className="grid grid-cols-5 items-center px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-sm font-medium text-white">{m.discord_tag}</span>
            <a
              href={`https://x.com/${m.x_handle.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-[#FF6021] transition-colors"
            >
              @{m.x_handle.replace(/^@/, "")}
            </a>
            <span className="text-right text-sm text-gray-400">{m.post_count}</span>
            <span className="text-right text-sm font-mono text-gray-300">{formatNum(m.total_views)}</span>
            <div className="text-right">
              <div className="text-sm font-mono text-[#32fe9f] font-semibold">{parseFloat(m.cndl_owed).toLocaleString()}</div>
              <div className="text-xs text-gray-600">≈ ${m.usd_owed}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
