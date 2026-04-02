"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApiPolling } from "@/hooks/useApiPolling";
import type { LaunchOverviewData, LaunchMetricData } from "@/types/launch";
import type { NarrativeOverview, NarrativeTokenData } from "@/types/narrative";
type NarrativeToken = NarrativeTokenData;

// ── Chart types ──
interface Candle { time: number; open: number; high: number; low: number; close: number; }
interface ScorePoint { time: number; score: number; }

// ── SOL Candlestick Chart ──
function SolChart({ candles, scores }: { candles: Candle[]; scores: ScorePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;
    let chart: ReturnType<typeof import("lightweight-charts")["createChart"]> | null = null;

    import("lightweight-charts").then(({ createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType }) => {
      if (!containerRef.current) return;
      chart = createChart(containerRef.current, {
        layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#6b7280", fontFamily: "monospace" },
        grid: { vertLines: { color: "#1e1e2e" }, horzLines: { color: "#1e1e2e" } },
        width: containerRef.current.clientWidth,
        height: 220,
        crosshair: { mode: 0 },
        timeScale: { borderColor: "#1e1e2e", timeVisible: false },
        rightPriceScale: { borderColor: "#1e1e2e", scaleMargins: { top: 0.02, bottom: 0.28 } },
      });

      const bgSeries = chart.addSeries(HistogramSeries, { priceScaleId: "bgcolor", lastValueVisible: false, priceLineVisible: false });
      chart.priceScale("bgcolor").applyOptions({ visible: false, scaleMargins: { top: 0, bottom: 0 } });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#00e676", downColor: "#ff1744", borderUpColor: "#00e676", borderDownColor: "#ff1744", wickUpColor: "#00e676", wickDownColor: "#ff1744",
      });

      const scoreSeries = chart.addSeries(LineSeries, {
        priceScaleId: "score", color: "#f0b90b", lineWidth: 2, lastValueVisible: true, priceLineVisible: false,
        priceFormat: { type: "custom" as const, formatter: (p: number) => p.toFixed(0) },
      });
      chart.priceScale("score").applyOptions({ borderColor: "#1e1e2e", scaleMargins: { top: 0.78, bottom: 0.02 } });

      candleSeries.setData(candles.map(c => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close })));
      if (scores.length > 0) {
        bgSeries.setData(scores.map(s => ({ time: s.time as any, value: 1, color: s.score >= 70 ? "rgba(0,230,118,0.18)" : s.score <= 30 ? "rgba(255,23,68,0.18)" : "rgba(240,185,11,0.14)" })));
        scoreSeries.setData(scores.map(s => ({ time: s.time as any, value: s.score, color: s.score >= 70 ? "#00e676" : s.score <= 30 ? "#ff1744" : "#f0b90b" })));
      }

      chart.timeScale().fitContent();

      const ro = new ResizeObserver(entries => { for (const e of entries) chart?.applyOptions({ width: e.contentRect.width }); });
      ro.observe(containerRef.current!);
    });

    return () => { chart?.remove(); };
  }, [candles, scores]);

  return <div ref={containerRef} className="w-full" style={{ height: 220 }} />;
}

// ── Formatters ──
const $$ = (v: number) => v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${v.toFixed(0)}`;
const N = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toLocaleString();
const P = (v: number | null) => v == null ? "--" : `${v > 0 ? "+" : ""}${v.toFixed(0)}%`;
const T = (m: number | null) => { if (m == null) return "--"; if (m < 60) return `${Math.round(m)}m`; const h = Math.floor(m / 60); if (h >= 24) { const d = Math.floor(h / 24); return d > 0 && h % 24 > 0 ? `${d}d ${h % 24}h` : `${d}d`; } return `${h}h`; };
const AGO = (c: string | null) => { if (!c) return ""; const h = Math.floor((Date.now() - new Date(c).getTime()) / 36e5); return h >= 24 ? `${Math.floor(h / 24)}d ago` : h > 0 ? `${h}h ago` : `${Math.floor((Date.now() - new Date(c).getTime()) / 6e4)}m ago`; };

// ── Sub-components ──
function Live() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-50" />
      <span className="relative rounded-full h-2 w-2 bg-emerald-400" />
    </span>
  );
}

function InfoIcon({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1.5 align-middle">
      <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        className="text-white/10 hover:text-white/30 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute z-50 top-7 right-0 w-64 px-3 py-2.5 rounded-xl bg-[#1a1c2e]/95 backdrop-blur border border-white/10 text-[11px] text-white/60 leading-relaxed shadow-2xl pointer-events-none">
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function Gauge({ score }: { score: number }) {
  const r = 54, c = Math.PI * r, off = c * (1 - score / 100);
  const col = score >= 70 ? "#00e676" : score <= 30 ? "#ff1744" : "#f0b90b";
  const lab = score >= 70 ? "Launch Window" : score <= 30 ? "Danger Zone" : "Neutral";
  const msg = score >= 70 ? "Favorable conditions" : score <= 30 ? "Consider waiting" : "Proceed with caution";
  return (
    <div className="flex flex-col items-center">
      <svg width="130" height="75" viewBox="0 0 130 75">
        <path d="M 8 70 A 54 54 0 0 1 122 70" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={5} strokeLinecap="round" />
        <motion.path d="M 8 70 A 54 54 0 0 1 122 70" fill="none" stroke={col} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.5, ease: "easeOut" }} style={{ filter: `drop-shadow(0 0 12px ${col}60)` }} />
      </svg>
      <div className="-mt-9 text-center">
        <div className="text-4xl font-black" style={{ color: col }}>{score.toFixed(0)}</div>
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5" style={{ color: `${col}bb` }}>{lab}</div>
        <div className="text-[10px] text-white/30 mt-1">{msg}</div>
      </div>
    </div>
  );
}

function Check({ label, value, good, display }: { label: string; value: number | null; good: boolean; display: string }) {
  if (value == null) return null;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${good ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" : "bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.4)]"}`} />
      <span className="text-[11px] text-white/40 flex-1">{label}</span>
      <span className={`text-[11px] font-bold tabular-nums ${good ? "text-emerald-400" : "text-red-400"}`}>{display}</span>
    </div>
  );
}

function G({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}
      className={`bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-2xl ${className}`}>
      {children}
    </motion.div>
  );
}

const LC_LEFT: Record<string, string> = { emerging: "border-l-blue-400", trending: "border-l-emerald-400", saturated: "border-l-amber-400", fading: "border-l-red-400/50" };
const LC_BADGE: Record<string, string> = { emerging: "bg-blue-500/15 text-blue-300", trending: "bg-emerald-500/15 text-emerald-300", saturated: "bg-amber-500/10 text-amber-300", fading: "bg-red-500/10 text-red-300" };
const LP: Record<string, string> = { pumpdotfun: "pump.fun", pumpfun: "pump.fun", letsbonk: "LetsBonk", bags: "Bags", moonshot: "Moonshot", jupstudio: "Jup Studio", launchlab: "LaunchLab", meteora: "Meteora", bonk: "Bonk", candle: "Candle" };
const BC = ["#f0b90b", "#34d399", "#60a5fa", "#c084fc", "#f472b6"];
const DS_ICON = "https://dd.dexscreener.com/ds-data/dapps/dexscreener.png";

// ── Fake health score from launch data when pulse endpoint unavailable ──
function deriveScore(launch: LaunchOverviewData | null): number | null {
  if (!launch) return null;
  const surv = launch.metrics.find(m => m.name === "Survival Rate (24h)")?.current;
  const bs = launch.metrics.find(m => m.name === "Buy/Sell Ratio")?.current;
  const vol = launch.metrics.find(m => m.name === "Volume")?.current;
  if (surv == null || bs == null || vol == null) return null;
  const s = Math.min(100, Math.max(0,
    (surv / 60) * 40 +
    (Math.min(bs, 2) / 2) * 30 +
    (Math.min(vol, 3e9) / 3e9) * 30
  ));
  return Math.round(s);
}

// ══════════════════════════════════════════════════════════════
export default function LaunchBot() {
  const { data: launch } = useApiPolling<LaunchOverviewData>("/launch/overview?range=30d", 60000);
  const { data: narr } = useApiPolling<NarrativeOverview>("/narrative/overview", 60000);
  const [selectedNarrative, setSelectedNarrative] = useState<string | null>(null);
  const [narrativeDetail, setNarrativeDetail] = useState<{ name: string; tokens: NarrativeToken[] } | null>(null);
  const [narrativeDetailLoading, setNarrativeDetailLoading] = useState(false);

  const selectNarrative = useCallback(async (name: string) => {
    setSelectedNarrative(name);
    setNarrativeDetail(null);
    setNarrativeDetailLoading(true);
    try {
      const res = await fetch(`/api/launchbot/narrative/${encodeURIComponent(name)}`);
      if (res.ok) { const d = await res.json(); setNarrativeDetail(d); }
    } catch { /* ignore */ } finally {
      setNarrativeDetailLoading(false);
    }
  }, []);
  const [chartData, setChartData] = useState<{ candles: Candle[]; scores: ScorePoint[] } | null>(null);

  const fetchChart = useCallback(async () => {
    try {
      const res = await fetch("/api/launchbot/pulse/chart?range=all");
      if (res.ok) { const d = await res.json(); setChartData(d); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchChart();
    const id = setInterval(fetchChart, 60000);
    return () => clearInterval(id);
  }, [fetchChart]);

  const derivedScore = deriveScore(launch);
  const chartScore = chartData?.scores?.length ? chartData.scores[chartData.scores.length - 1].score : null;
  const score = derivedScore ?? chartScore;
  const tiers = launch?.metrics.find(m => m.name === "Launch Performance")?.tiers;
  const act = launch?.metrics.find(m => m.name === "Launchpad Activity") as (LaunchMetricData & { migration_rate?: number; total_graduated?: number }) | undefined;
  const launches = act?.current ?? 0;
  const gradRate = act?.migration_rate;
  const graduated = act?.total_graduated;
  const bd = (act?.breakdown || {}) as Record<string, number>;
  const surv = launch?.metrics.find(m => m.name === "Survival Rate (24h)");
  const bs = launch?.metrics.find(m => m.name === "Buy/Sell Ratio");
  const vol = launch?.metrics.find(m => m.name === "Volume");
  const sorted = Object.entries(bd).filter(([k, v]) => v > 0 && k !== "moon.it").sort((a, b) => b[1] - a[1]);
  const maxLP = sorted[0]?.[1] || 1;

  const noApi = !process.env.NEXT_PUBLIC_LAUNCHBOT_CONFIGURED;

  if (selectedNarrative) {
    const nr = narr?.narratives.find(n => n.name === selectedNarrative);
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelectedNarrative(null); setNarrativeDetail(null); }} className="text-sm text-white/40 hover:text-white/70 transition-colors">
          ← Back to dashboard
        </button>
        {nr && (
          <G className="p-5" delay={0}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg font-bold text-white/80">{nr.name}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${LC_BADGE[nr.lifecycle] || LC_BADGE.fading}`}>{nr.lifecycle}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div><div className="text-[10px] text-white/30 uppercase mb-1">Tokens</div><div className="font-bold text-white/80">{nr.token_count}</div></div>
              <div><div className="text-[10px] text-white/30 uppercase mb-1">Avg Gain</div><div className={`font-bold ${nr.avg_gain_pct > 0 ? "text-emerald-400" : "text-red-400"}`}>{P(nr.avg_gain_pct)}</div></div>
              <div><div className="text-[10px] text-white/30 uppercase mb-1">Volume</div><div className="font-bold text-white/80">{$$(nr.total_volume)}</div></div>
            </div>
            {narrativeDetailLoading && <div className="text-white/20 text-xs animate-pulse">Loading tokens...</div>}
            {narrativeDetail && narrativeDetail.tokens.length > 0 && (
              <div className="border-t border-white/[0.06] pt-4">
                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Tokens in this narrative</div>
                <div className="space-y-1">
                  {narrativeDetail.tokens.map((t, i) => {
                    const up = (t.price_change_pct ?? 0) > 0;
                    return (
                      <motion.div key={t.address} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                        <span className="text-white/20 text-[10px] w-5 tabular-nums">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <a href={t.pair_address ? `https://dexscreener.com/solana/${t.pair_address}` : `https://dexscreener.com/solana/${t.address}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[12px] font-semibold text-white/80 hover:text-amber-400 transition-colors truncate block">
                            {t.name} <span className="text-white/30 font-normal">{t.symbol}</span>
                          </a>
                          {t.mcap && <div className="text-[10px] text-white/25">{$$(t.mcap)} mcap{t.volume_24h ? ` · ${$$(t.volume_24h)} vol` : ""}</div>}
                        </div>
                        {t.price_change_pct != null && (
                          <div className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md ${up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                            {P(t.price_change_pct)}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
            {narrativeDetail && narrativeDetail.tokens.length === 0 && (
              <div className="text-white/20 text-xs pt-2">No token data available yet.</div>
            )}
          </G>
        )}
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-900/[0.06] rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-900/[0.04] rounded-full blur-[140px]" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>

      {/* Header row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="text-amber-400 font-black text-lg tracking-[0.3em]">CANDLE</span>
          <Live />
          <span className="text-[10px] text-white/20 ml-2">Solana Launch Intelligence</span>
        </div>
        <InfoIcon text="Real-time dashboard for Solana token developers. The health score tells you if conditions are right for launching." />
      </motion.div>

      {/* No API configured notice */}
      {!launch && !narr && (
        <G className="p-6 mb-4 text-center" delay={0}>
          <div className="text-white/30 text-sm animate-pulse">Connecting to launch intelligence backend...</div>
          <div className="text-white/15 text-xs mt-2">Add LAUNCHBOT_API_URL to environment variables to activate</div>
        </G>
      )}

      {/* Row 1: Gauge | Chart | Conditions */}
      <G className="mb-3 overflow-hidden" delay={0.05}>
        <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_200px]">
          {/* Gauge */}
          <div className="flex items-center justify-center p-5 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
            {score !== null
              ? <Gauge score={score} />
              : <div className="text-white/15 text-xs animate-pulse text-center">Calculating<br />health score...</div>
            }
          </div>
          {/* Chart */}
          <div className="p-3 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
            {chartData && chartData.candles.length > 0
              ? <SolChart candles={chartData.candles} scores={chartData.scores} />
              : <div className="flex items-center justify-center h-[220px] text-white/15 text-xs animate-pulse">Loading chart...</div>
            }
          </div>
          {/* Conditions */}
          <div className="p-5 flex flex-col justify-center">
            <div className="text-xs text-white/50 uppercase tracking-[0.12em] font-bold mb-3">Market Conditions</div>
            <div className="space-y-0.5">
              <Check label="24h Launches" value={launches} good={launches > 10000} display={N(launches)} />
              <Check label="Graduation Rate" value={gradRate ?? null} good={(gradRate ?? 0) > 1} display={`${(gradRate ?? 0).toFixed(1)}%`} />
              <Check label="24h Survival" value={surv?.current ?? null} good={(surv?.current ?? 0) > 20} display={`${(surv?.current ?? 0).toFixed(0)}%`} />
              <Check label="Buy/Sell Ratio" value={bs?.current ?? null} good={(bs?.current ?? 0) > 0.8} display={(bs?.current ?? 0).toFixed(2)} />
              <Check label="DEX Volume" value={vol?.current ?? null} good={(vol?.current ?? 0) > 1e9} display={$$(vol?.current ?? 0)} />
            </div>
            {launch && <div className="text-[9px] text-white/15 mt-3">Updated {new Date(launch.last_updated).toLocaleTimeString()}</div>}
          </div>
        </div>
      </G>

      {/* Row 2: Launch Performance | Launchpad Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <G className="p-5" delay={0.2}>
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs text-white/50 uppercase tracking-[0.12em] font-bold">Launch Performance</span>
            <InfoIcon text="Peak market cap that graduated tokens reached in the last 24h." />
          </div>
          {tiers ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[8px] text-white/15 uppercase tracking-wider mb-1">
                <span className="w-20" /><span className="flex-1" />
                <span className="w-16 text-right">Peak Mcap</span>
                <span className="w-16 text-right">Peaked after</span>
              </div>
              {[
                { key: "best24h" as const, label: "Best (24h)", color: "text-amber-400", bar: "bg-amber-400" },
                { key: "top10" as const, label: "Top 10%", color: "text-blue-400", bar: "bg-blue-400" },
                { key: "bonded" as const, label: "Bonded", color: "text-white/60", bar: "bg-white/40" },
              ].map(({ key, label, color, bar }, idx) => (
                <div key={key} className="flex items-center gap-2 py-1">
                  <span className={`text-[11px] w-20 font-medium ${color}`}>{label}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/[0.03] overflow-hidden">
                    <motion.div initial={{ width: 0 }}
                      animate={{ width: key === "best24h" ? "100%" : `${Math.max(4, (Math.log10(tiers[key] + 1) / Math.log10(tiers.best24h + 1)) * 100)}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className={`h-full rounded-full ${bar}`} />
                  </div>
                  <span className={`text-[12px] font-bold tabular-nums w-16 text-right ${color}`}>{$$(tiers[key])}</span>
                  <span className="text-[10px] text-white/20 w-16 text-right tabular-nums">{T(tiers.time_to_peak?.[key] ?? null)}</span>
                </div>
              ))}
              {tiers.best_address && (
                <div className="flex items-center gap-2 ml-20 -mt-0.5 mb-1">
                  <span className="text-[9px] font-mono text-white/20">{tiers.best_address.slice(0, 6)}...{tiers.best_address.slice(-4)}</span>
                  <a href={`https://dexscreener.com/solana/${tiers.best_address}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] text-amber-400/40 hover:text-amber-400 transition-colors">
                    <img src={DS_ICON} alt="" className="w-3.5 h-3.5 rounded" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span>DexScreener</span>
                  </a>
                </div>
              )}
              {tiers.all_median != null && (
                <div className="flex items-center gap-2 py-1 mt-1 border-t border-white/[0.04]">
                  <span className="text-[11px] w-20 text-red-400/60 font-medium">All Launches</span>
                  <div className="flex-1 h-1 rounded-full bg-white/[0.03] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(3, (Math.log10(tiers.all_median + 1) / Math.log10(tiers.best24h + 1)) * 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }} className="h-full rounded-full bg-red-400/50" />
                  </div>
                  <span className="text-[12px] font-bold tabular-nums w-16 text-right text-red-400/60">{$$(tiers.all_median)}</span>
                  <span className="w-16" />
                </div>
              )}
            </div>
          ) : <div className="text-white/15 text-[10px] py-6 animate-pulse text-center">Loading...</div>}
        </G>

        <G className="p-5" delay={0.25}>
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs text-white/50 uppercase tracking-[0.12em] font-bold">Launchpad Activity</span>
            <InfoIcon text="Token launches per platform from on-chain data." />
          </div>
          <div className="space-y-1.5">
            {sorted.slice(0, 5).map(([k, v], i) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-[11px] text-white/50 w-16 truncate font-medium">{LP[k] || k}</span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.03] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(3, (v / maxLP) * 100)}%` }}
                    transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                    className="h-full rounded-full" style={{ background: BC[i % BC.length] }} />
                </div>
                <span className="text-[11px] tabular-nums text-white/30 w-14 text-right font-medium">{v.toLocaleString()}</span>
              </div>
            ))}
            {sorted.length === 0 && <div className="text-white/15 text-[10px] py-4 animate-pulse text-center">Loading...</div>}
          </div>
          {graduated != null && (
            <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center gap-4 text-[10px] text-white/25">
              <span><span className="text-emerald-400 font-bold">{N(graduated)}</span> graduated</span>
              {gradRate != null && <span><span className="text-amber-400 font-bold">{gradRate.toFixed(1)}%</span> graduation rate</span>}
            </div>
          )}
        </G>
      </div>

      {/* Row 3: Narratives + Runners */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-white/50 uppercase tracking-[0.12em] font-bold">What to Launch — Current Narratives</span>
            <InfoIcon text="AI-classified trending token themes. Click to explore." />
          </div>
          <div className="text-[8px] text-red-400/25 mb-2">Includes unverified tokens for narrative identification. Not investment advice.</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {narr?.narratives.map((nr, i) => {
              const heat = nr.avg_gain_pct > 100 ? 3 : nr.avg_gain_pct > 30 ? 2 : nr.avg_gain_pct > 0 ? 1 : 0;
              return (
                <motion.button key={nr.name} onClick={() => selectNarrative(nr.name)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                  className={`bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] border-l-2 ${LC_LEFT[nr.lifecycle] || LC_LEFT.fading} rounded-xl p-4 text-left hover:bg-white/[0.04] hover:border-white/[0.1] active:scale-[0.98] transition-all w-full group relative`}>
                  {heat >= 2 && <div className="absolute top-2 right-2 text-sm opacity-40">{heat >= 3 ? "🔥🔥" : "🔥"}</div>}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-white/80 group-hover:text-white">{nr.name}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${LC_BADGE[nr.lifecycle] || LC_BADGE.fading}`}>{nr.lifecycle}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-white/40"><span className="text-white/60 font-semibold">{nr.token_count}</span> tokens</span>
                    <span className="text-white/25">{$$(nr.total_volume)}</span>
                    <span className={`font-bold ${nr.avg_gain_pct > 0 ? "text-emerald-400" : "text-red-400"}`}>{P(nr.avg_gain_pct)}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
          {(!narr || narr.narratives.length === 0) && (
            <G className="p-8 text-center" delay={0.3}>
              <div className="text-white/15 text-sm animate-pulse">Scanning for trending narratives...</div>
            </G>
          )}
        </div>

        {/* Top Runners */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-white/50 uppercase tracking-[0.12em] font-bold">Top Runners</span>
            <InfoIcon text="Tokens with highest gains in 24h." />
          </div>
          <G className="p-3 max-h-[400px] overflow-y-auto" delay={0.3}>
            {narr?.top_runners.slice(0, 10).map((t, i) => {
              const up = (t.price_change_pct ?? 0) > 0;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <motion.div key={t.address} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04, duration: 0.2 }}
                  className="flex items-center gap-2 py-2 border-b border-white/[0.04] last:border-0 group hover:bg-white/[0.02] transition-colors rounded px-1 -mx-1">
                  <span className="text-xs w-5 text-center">{i < 3 ? medals[i] : <span className="text-white/15 text-[10px]">#{i + 1}</span>}</span>
                  <div className="flex-1 min-w-0">
                    <a href={`https://dexscreener.com/solana/${t.address}`} target="_blank" rel="noopener noreferrer"
                      className="text-[12px] font-semibold text-white/80 hover:text-amber-400 transition-colors truncate block">{t.name}</a>
                    <div className="text-[9px] text-white/25">
                      {t.narrative && <span className="text-amber-400/50">{t.narrative}</span>}
                      {t.narrative && <span className="mx-1">·</span>}
                      {AGO(t.created_at)}
                    </div>
                  </div>
                  <div className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md ${up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    {P(t.price_change_pct)}
                  </div>
                  <span className="text-[10px] tabular-nums text-white/20 w-14 text-right">{t.mcap ? $$(t.mcap) : "--"}</span>
                </motion.div>
              );
            })}
            {(!narr || narr.top_runners.length === 0) && (
              <div className="text-white/15 text-center py-6 text-[10px] animate-pulse">Scanning runners...</div>
            )}
          </G>
        </div>
      </div>
    </div>
  );
}
