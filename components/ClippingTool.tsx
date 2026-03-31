"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const CLIPPING_API = process.env.NEXT_PUBLIC_CLIPPING_API_URL ?? "http://localhost:8000";

const TEMPLATES = [
  { id: "classic",     name: "Classic",     bg: "black", capColor: "#FFFF00", desc: "Bold yellow outlined captions." },
  { id: "blur_bg",     name: "Blur BG",     bg: "blur",  capColor: "#FFFFFF", desc: "Blurred background, white captions." },
  { id: "karaoke",     name: "Karaoke",     bg: "black", capColor: "#00C896", desc: "Green on yellow outline style." },
  { id: "beasty",      name: "Beasty",      bg: "black", capColor: "#FFFFFF", desc: "Big Impact font. MrBeast-inspired." },
  { id: "deep_diver",  name: "Deep Diver",  bg: "black", capColor: "#000000", desc: "Opaque caption box style." },
  { id: "pod_p",       name: "Pod P",       bg: "black", capColor: "#FF69B4", desc: "Pink neon glow captions." },
  { id: "youshaei",    name: "Youshaei",    bg: "black", capColor: "#00C896", desc: "Clean green on white style." },
  { id: "mozi",        name: "Mozi",        bg: "black", capColor: "#FF8C00", desc: "Massive orange Impact font." },
  { id: "minimal",     name: "Minimal",     bg: "blur",  capColor: "#FFFFFF", desc: "Clean white text, minimal." },
  { id: "no_captions", name: "No Captions", bg: "blur",  capColor: null,      desc: "No captions." },
];

const COLORS = [
  { hex: "#FFFF00", label: "Yellow" },
  { hex: "#FFFFFF", label: "White" },
  { hex: "#00C896", label: "Green" },
  { hex: "#FF69B4", label: "Pink" },
  { hex: "#FF8C00", label: "Orange" },
  { hex: "#00FFFF", label: "Cyan" },
];

const STEP_PROG: Record<string, number> = {
  uploading: 8, downloading: 12, transcribing: 38, analysing: 68,
  rendering: 88, uploading_drive: 96, done: 100, error: 0,
};
const STEP_LABEL: Record<string, string> = {
  uploading: "Uploading", downloading: "Downloading", transcribing: "Transcribing audio",
  analysing: "AI finding highlights", rendering: "Rendering clips",
  uploading_drive: "Uploading to Drive", done: "Complete", error: "Error",
};

type Clip = {
  variant: string;
  filename: string;
  name?: string;
  hook?: string;
  reason?: string;
  drive_link?: string;
  download_url?: string;
  local_url?: string;
};

type Section = "form" | "processing" | "results";

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function ClippingTool() {
  const [inputTab, setInputTab] = useState<"upload" | "youtube">("upload");
  const [selFile, setSelFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [streamName, setStreamName] = useState("");
  const [numClips, setNumClips] = useState(8);
  const [numClipsStr, setNumClipsStr] = useState("8");
  const [selTpl, setSelTpl] = useState("classic");
  const [selColor, setSelColor] = useState("#FFFF00");
  const [watermark, setWatermark] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [section, setSection] = useState<Section>("form");
  const [procStatus, setProcStatus] = useState("uploading");
  const [procMsg, setProcMsg] = useState("Starting...");
  const [elapsed, setElapsed] = useState("0:00");
  const [clips, setClips] = useState<Clip[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    (inputTab === "upload" && selFile != null) ||
    (inputTab === "youtube" && youtubeUrl.trim() !== "");

  const stopTimers = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  }, []);

  useEffect(() => () => stopTimers(), [stopTimers]);

  function startTimer() {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(formatElapsed(Date.now() - startTimeRef.current));
    }, 1000);
  }

  async function poll(jobId: string) {
    try {
      const data = await fetch(`${CLIPPING_API}/status/${jobId}`).then((r) => r.json());
      setProcStatus(data.status ?? "");
      setProcMsg(data.message ?? "");
      if (data.status === "done") {
        stopTimers();
        setClips(data.clips ?? []);
        setSection("results");
      } else if (data.status === "error") {
        stopTimers();
        setErrorMsg(data.message ?? "Something went wrong.");
        setClips([]);
        setSection("results");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit() {
    const name =
      streamName.trim() ||
      (selFile ? selFile.name.replace(/\.[^.]+$/, "").replace(/\s+/g, "_") : "stream");

    setSection("processing");
    setProcStatus("uploading");
    setProcMsg("Starting...");
    setElapsed("0:00");
    startTimer();

    const form = new FormData();
    form.append("file", inputTab === "upload" && selFile ? selFile : new Blob([]), inputTab === "upload" && selFile ? selFile.name : "");
    form.append("youtube_url", inputTab === "youtube" ? youtubeUrl.trim() : "");
    form.append("stream_name", name);
    form.append("num_clips", String(numClips));
    form.append("variant", selTpl);
    form.append("caption_color", selColor);
    form.append("watermark", watermark ? "true" : "false");

    try {
      const res = await fetch(`${CLIPPING_API}/process`, { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const jobId: string = data.job_id;
      pollRef.current = setInterval(() => poll(jobId), 3000);
    } catch (err: unknown) {
      stopTimers();
      setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
      setClips([]);
      setSection("results");
    }
  }

  function resetTool() {
    stopTimers();
    setSelFile(null);
    setYoutubeUrl("");
    setStreamName("");
    setNumClips(8);
    setNumClipsStr("8");
    setSelTpl("classic");
    setSelColor("#FFFF00");
    setWatermark(true);
    setSection("form");
    setErrorMsg("");
    setClips([]);
  }

  function onFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setSelFile(f);
  }

  const progress = STEP_PROG[procStatus] ?? 0;
  const pillSteps = [
    { id: "s1", statuses: ["uploading", "downloading"], label: "Upload" },
    { id: "s2", statuses: ["transcribing"],             label: "Transcribe" },
    { id: "s3", statuses: ["analysing"],                label: "AI Analysis" },
    { id: "s4", statuses: ["rendering", "uploading_drive"], label: "Render" },
    { id: "s5", statuses: ["done"],                     label: "Done" },
  ];
  const statusOrder = ["uploading", "downloading", "transcribing", "analysing", "rendering", "uploading_drive", "done"];
  const statusIdx = statusOrder.indexOf(procStatus);

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 26,
  };
  const label: React.CSSProperties = {
    fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
    letterSpacing: "0.8px", color: "rgba(255,255,255,0.3)", marginBottom: 14,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#fff",
    fontSize: "0.9rem", fontWeight: 600,
    outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>

      {/* FORM */}
      {section === "form" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Source video */}
          <div style={card}>
            <div style={label}>Source Video</div>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 3, gap: 3, marginBottom: 16 }}>
              {(["upload", "youtube"] as const).map((t) => (
                <button key={t} onClick={() => setInputTab(t)} style={{
                  flex: 1, padding: "9px 6px", border: "none", borderRadius: 8,
                  background: inputTab === t ? "rgba(255,255,255,0.09)" : "transparent",
                  color: inputTab === t ? "#fff" : "rgba(255,255,255,0.38)",
                  fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {t === "upload" ? "📁 Upload File" : "▶ YouTube URL"}
                </button>
              ))}
            </div>

            {inputTab === "upload" ? (
              <div>
                <div
                  onDrop={onFileDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${dragOver ? "#32fe9f" : "rgba(255,255,255,0.12)"}`,
                    borderRadius: 12, padding: "40px 16px", textAlign: "center", cursor: "pointer",
                    background: dragOver ? "rgba(50,254,159,0.06)" : "rgba(255,255,255,0.02)",
                    transition: "all 0.18s",
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: 9 }}>🎬</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#fff", marginBottom: 4 }}>Drop your file here</div>
                  <p style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.3)" }}>
                    or <strong style={{ color: "#32fe9f" }}>click to browse</strong> — MP4, MOV, MKV
                  </p>
                </div>
                <input ref={fileInputRef} type="file" accept="video/*" style={{ display: "none" }}
                  onChange={(e) => { if (e.target.files?.[0]) setSelFile(e.target.files[0]); }} />
                {selFile && (
                  <div style={{ marginTop: 10, padding: "9px 13px", background: "rgba(50,254,159,0.1)", border: "1px solid rgba(50,254,159,0.2)", borderRadius: 8, fontSize: "0.78rem", color: "#32fe9f", fontWeight: 700 }}>
                    ✓ {selFile.name} ({(selFile.size / 1e6).toFixed(1)} MB)
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>YouTube URL</div>
                <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} />
              </div>
            )}
          </div>

          {/* Settings */}
          <div style={card}>
            <div style={label}>Settings</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10 }}>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>Stream / Episode Name</div>
                <input type="text" value={streamName} onChange={(e) => setStreamName(e.target.value)}
                  placeholder="e.g. March_Stream_01" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}># of Clips</div>
                <input type="number" value={numClipsStr} min={1} max={20}
                  onChange={(e) => {
                    setNumClipsStr(e.target.value);
                    const n = parseInt(e.target.value);
                    if (!isNaN(n) && n >= 1 && n <= 20) setNumClips(n);
                  }}
                  onBlur={() => {
                    const n = parseInt(numClipsStr);
                    const clamped = isNaN(n) ? 8 : Math.min(20, Math.max(1, n));
                    setNumClips(clamped);
                    setNumClipsStr(String(clamped));
                  }}
                  style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Caption style */}
          <div style={card}>
            <div style={label}>Caption Style</div>
            <div style={{ overflowX: "auto", paddingBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, width: "max-content" }}>
                {TEMPLATES.map((t) => (
                  <div key={t.id} onClick={() => setSelTpl(t.id)} style={{
                    cursor: "pointer", borderRadius: 10, overflow: "hidden", width: 90, flexShrink: 0,
                    border: selTpl === t.id ? "1.5px solid #32fe9f" : "1.5px solid rgba(255,255,255,0.09)",
                    background: "rgba(255,255,255,0.03)",
                    boxShadow: selTpl === t.id ? "0 0 0 2px rgba(50,254,159,0.14)" : "none",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ width: 90, height: 160, background: t.bg === "blur" ? "#0d0d0d" : "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {t.capColor && <span style={{ fontSize: 8, fontWeight: 900, color: t.capColor, textShadow: "1px 1px 0 #000, -1px -1px 0 #000" }}>WORD</span>}
                    </div>
                    <div style={{ fontSize: "0.58rem", fontWeight: 800, textAlign: "center", color: selTpl === t.id ? "#32fe9f" : "rgba(255,255,255,0.4)", padding: "4px", background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.07)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {TEMPLATES.find((t) => t.id === selTpl) && (
              <p style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
                {TEMPLATES.find((t) => t.id === selTpl)?.desc}
              </p>
            )}
          </div>

          {/* Controls */}
          <div style={card}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "rgba(255,255,255,0.3)", marginBottom: 9 }}>Watermark</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div onClick={() => setWatermark(!watermark)} style={{ position: "relative", width: 38, height: 21, cursor: "pointer", background: watermark ? "#32fe9f" : "rgba(255,255,255,0.1)", borderRadius: 999, transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", width: 15, height: 15, borderRadius: "50%", background: watermark ? "#000" : "rgba(255,255,255,0.4)", top: 3, left: watermark ? 20 : 3, transition: "left 0.2s" }} />
                  </div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Candle logo</span>
                </div>
              </div>
              <div style={{ flex: 2 }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", color: "rgba(255,255,255,0.3)", marginBottom: 9 }}>Caption Colour</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {COLORS.map((c) => (
                    <div key={c.hex} onClick={() => setSelColor(c.hex)} title={c.label} style={{ width: 22, height: 22, borderRadius: "50%", cursor: "pointer", background: c.hex, border: selColor === c.hex ? "2px solid rgba(255,255,255,0.8)" : "2px solid transparent", transform: selColor === c.hex ? "scale(1.15)" : "scale(1)", transition: "all 0.14s" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!canSubmit} style={{
            width: "100%", padding: 15,
            background: canSubmit ? "#32fe9f" : "rgba(255,255,255,0.07)",
            color: canSubmit ? "#000" : "rgba(255,255,255,0.2)",
            fontSize: "0.98rem", fontWeight: 900, border: "none", borderRadius: 12,
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "all 0.18s", fontFamily: "inherit", marginTop: 4,
          }}>
            {canSubmit ? "Generate Clips →" : "Select a video to continue"}
          </button>
        </div>
      )}

      {/* PROCESSING */}
      {section === "processing" && (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "26px 26px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: "#fff", marginBottom: 4 }}>Processing your video</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.38)" }}>{procMsg}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 16 }}>
              {pillSteps.map((pill) => {
                const pillIdx = statusOrder.indexOf(pill.statuses[0]);
                const isActive = pill.statuses.includes(procStatus);
                const isDone = pillIdx < statusIdx && !isActive;
                return (
                  <div key={pill.id} style={{
                    padding: "3px 11px", borderRadius: 999, fontSize: "0.62rem", fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.4px",
                    border: isActive ? "1px solid #32fe9f" : isDone ? "1px solid rgba(50,254,159,0.2)" : "1px solid rgba(255,255,255,0.08)",
                    color: isActive ? "#fff" : isDone ? "#32fe9f" : "rgba(255,255,255,0.3)",
                    background: isActive ? "#32fe9f" : isDone ? "rgba(50,254,159,0.1)" : "transparent",
                  }}>
                    {pill.label}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.07)", borderTopColor: "#32fe9f", animation: "spin 0.9s linear infinite" }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{STEP_LABEL[procStatus] ?? procStatus}</div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.2)", fontVariantNumeric: "tabular-nums" }}>{elapsed} elapsed</div>
          </div>
          <div style={{ padding: "14px 26px 22px" }}>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 999, height: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#32fe9f", borderRadius: 999, width: `${progress}%`, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", fontWeight: 700, color: "rgba(255,255,255,0.2)", marginTop: 7 }}>
              <span>{progress}%</span><span>{procStatus}</span>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {section === "results" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "#fff" }}>
                {errorMsg ? "Something went wrong" : `${clips.length} clip${clips.length !== 1 ? "s" : ""} ready!`}
              </h3>
              {!errorMsg && clips[0]?.drive_link && (
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Clips saved to Google Drive.</p>
              )}
            </div>
            <button onClick={resetTool} style={{ padding: "8px 16px", background: "transparent", color: "#32fe9f", border: "1px solid rgba(50,254,159,0.25)", borderRadius: 8, fontSize: "0.78rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
              ← New Video
            </button>
          </div>

          {errorMsg ? (
            <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: 11, padding: "16px 18px", color: "#f87171", fontSize: "0.86rem", fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {clips.map((clip, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, animation: "fadeUp 0.35s ease both" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#32fe9f", marginBottom: 4 }}>
                      Clip {i + 1}
                    </div>
                    {clip.hook && <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>{clip.hook}</div>}
                    {clip.reason && <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>{clip.reason}</div>}
                    <div style={{ fontSize: "0.66rem", color: "rgba(50,254,159,0.5)", fontWeight: 700, marginTop: 5 }}>{clip.name ?? clip.filename}</div>
                  </div>
                  {(clip.drive_link || clip.local_url || clip.download_url) && (
                    <a
                      href={clip.drive_link || `${CLIPPING_API}${clip.local_url ?? clip.download_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={!clip.drive_link ? (clip.name ?? clip.filename) : undefined}
                      style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, padding: "7px 13px", background: "#32fe9f", color: "#000", borderRadius: 7, fontSize: "0.75rem", fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      {clip.drive_link ? "Drive ↗" : "⬇ Download"}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
        input:focus { border-color: #32fe9f !important; background: rgba(50,254,159,0.04) !important; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
