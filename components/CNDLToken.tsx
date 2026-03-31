type Stats = {
  totalViews: number;
  approvedPosts: number;
  members: number;
  totalCndl: string;
  cpm: number;
} | null;

type TokenData = {
  mint: string;
  supply: number | null;
  decimals: number;
  price: number | null;
  marketCap: number | null;
  fdv: number | null;
  volume24h: number | null;
  change24h: number | null;
  liquidity: number | null;
  holderCount: number | null;
  topHolders: { address: string; amount: string; uiAmount: number }[];
} | null;

function fmt(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtUsd(n: number) {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toLocaleString();
}

export default function CNDLToken({
  stats,
  cpm,
  tokenData,
}: {
  stats: Stats;
  cpm: number;
  tokenData: TokenData;
}) {
  const supply    = tokenData?.supply    ?? null;
  const price     = tokenData?.price     ?? null;
  const marketCap = tokenData?.marketCap ?? null;
  const fdv       = tokenData?.fdv       ?? null;
  const volume24h = tokenData?.volume24h ?? null;
  const change24h = tokenData?.change24h ?? null;
  const liquidity = tokenData?.liquidity ?? null;
  const topHolders = tokenData?.topHolders ?? [];

  const changePositive = change24h !== null && change24h >= 0;

  const top10Pct = topHolders.length > 0 && supply
    ? topHolders.slice(0, 10).reduce((a, h) => a + h.uiAmount, 0) / supply * 100
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-[#32fe9f] to-[#20cb7f] rounded-full" />
        <h2 className="text-2xl font-bold">$CNDL Token</h2>
        <span className="ml-auto text-xs font-mono text-[#32fe9f] bg-[#32fe9f]/10 border border-[#32fe9f]/20 rounded-full px-3 py-1">
          Live
        </span>
      </div>

      {/* Market stats row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Price</p>
          <p className="text-2xl font-bold text-[#32fe9f]">
            {price !== null ? `$${price < 0.001 ? price.toFixed(7) : price.toFixed(4)}` : "—"}
          </p>
          {change24h !== null && (
            <p className={`text-xs mt-1 font-semibold ${changePositive ? "text-[#32fe9f]" : "text-red-400"}`}>
              {changePositive ? "▲" : "▼"} {Math.abs(change24h).toFixed(2)}% 24h
            </p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Market Cap</p>
          <p className="text-2xl font-bold text-white">
            {marketCap !== null ? fmtUsd(marketCap) : "—"}
          </p>
          {fdv !== null && fdv !== marketCap && (
            <p className="text-xs text-gray-600 mt-1">FDV {fmtUsd(fdv)}</p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Supply</p>
          <p className="text-2xl font-bold text-white">
            {supply !== null ? fmt(supply) : "—"}
          </p>
          <p className="text-xs text-gray-600 mt-1">$CNDL tokens</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Liquidity</p>
          <p className="text-2xl font-bold text-white">
            {liquidity !== null ? fmtUsd(liquidity) : "—"}
          </p>
          {volume24h !== null && (
            <p className="text-xs text-gray-600 mt-1">Vol 24h {fmtUsd(volume24h)}</p>
          )}
        </div>
      </div>

      {/* Clipping payout stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">$CNDL Owed</p>
          <p className="text-2xl font-bold text-[#32fe9f]">
            {stats ? parseFloat(stats.totalCndl).toLocaleString() : "—"}
          </p>
          <p className="text-xs text-gray-600 mt-1">To clipping team</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">CPM Rate</p>
          <p className="text-2xl font-bold text-white">{cpm}</p>
          <p className="text-xs text-gray-600 mt-1">$CNDL per 1K views</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Approved Posts</p>
          <p className="text-2xl font-bold text-white">{stats?.approvedPosts ?? "—"}</p>
          <p className="text-xs text-gray-600 mt-1">Total clipping posts</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Clippers</p>
          <p className="text-2xl font-bold text-white">{stats?.members ?? "—"}</p>
          <p className="text-xs text-gray-600 mt-1">Registered members</p>
        </div>
      </div>

      {/* Top Holders */}
      {topHolders.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-gray-300 mb-4">
            Top Holders
            {top10Pct !== null && (
              <span className="ml-2 text-xs text-gray-500 font-normal">
                Top 10 hold {top10Pct.toFixed(1)}% of supply
              </span>
            )}
          </p>
          <div className="space-y-3">
            {topHolders.slice(0, 8).map((h, i) => {
              const pct = supply ? (h.uiAmount / supply) * 100 : 0;
              return (
                <div key={h.address}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 font-mono text-xs">
                      #{i + 1} {h.address.slice(0, 4)}...{h.address.slice(-4)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 text-xs">{fmt(h.uiAmount)}</span>
                      <span className="font-mono text-white font-semibold text-xs">{pct.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#32fe9f]"
                      style={{ width: `${Math.min(pct * 5, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
