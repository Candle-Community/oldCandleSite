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
  holderCount: number | null;
  topHolders: { address: string; amount: string; uiAmount: number }[];
} | null;


function formatNum(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
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
  const supply = tokenData?.supply ?? null;
  const price = tokenData?.price ?? null;
  const holderCount = tokenData?.holderCount ?? null;
  const topHolders = tokenData?.topHolders ?? [];

  const marketCap = supply && price ? supply * price : null;

  // Build wallet distribution from top holders
  const totalSupply = supply ?? 1;
  const top10Pct = topHolders.length > 0
    ? topHolders.slice(0, 10).reduce((a, h) => a + h.uiAmount, 0) / totalSupply * 100
    : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
        <h2 className="text-2xl font-bold">$CNDL Token</h2>
        <span className="ml-auto text-xs font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1">
          $CNDL
        </span>
      </div>

      {/* Live token stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Price</p>
          <p className="text-3xl font-bold text-yellow-400">
            {price !== null ? `$${price < 0.01 ? price.toFixed(6) : price.toFixed(4)}` : "—"}
          </p>
          <p className="text-xs text-gray-600 mt-1">USD</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Market Cap</p>
          <p className="text-3xl font-bold text-green-400">
            {marketCap !== null ? `$${formatNum(marketCap)}` : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Holders</p>
          <p className="text-3xl font-bold text-white">
            {holderCount !== null ? holderCount.toLocaleString() : "—"}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Supply</p>
          <p className="text-3xl font-bold text-white">
            {supply !== null ? formatNum(supply) : "—"}
          </p>
        </div>
      </div>

      {/* Clipping stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">$CNDL Owed</p>
          <p className="text-3xl font-bold text-yellow-400">
            {stats ? parseFloat(stats.totalCndl).toLocaleString() : "—"}
          </p>
          <p className="text-xs text-gray-600 mt-1">To clipping team</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">CPM Rate</p>
          <p className="text-3xl font-bold text-green-400">{cpm}</p>
          <p className="text-xs text-gray-600 mt-1">$CNDL per 1K views</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Approved Posts</p>
          <p className="text-3xl font-bold text-white">{stats?.approvedPosts ?? "—"}</p>
          <p className="text-xs text-gray-600 mt-1">Total clipping posts</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Clippers</p>
          <p className="text-3xl font-bold text-white">{stats?.members ?? "—"}</p>
          <p className="text-xs text-gray-600 mt-1">Registered members</p>
        </div>
      </div>

      {/* Top Holders */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-gray-300 mb-4">
          Top Holders
          {top10Pct !== null && (
            <span className="ml-2 text-xs text-gray-500 font-normal">
              Top 10 hold {top10Pct.toFixed(1)}% of supply
            </span>
          )}
        </p>
        {topHolders.length === 0 ? (
          <p className="text-sm text-gray-600">No data</p>
        ) : (
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
                      <span className="text-gray-600 text-xs">{formatNum(h.uiAmount)}</span>
                      <span className="font-mono text-white font-semibold text-xs">{pct.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${Math.min(pct * 5, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
