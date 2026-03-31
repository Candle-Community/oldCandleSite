# Discord OAuth + Post Submission Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Discord OAuth login to candleliteai.com and a "Submit" tab where authenticated clippers can submit X posts and view their earnings — backed by the existing candle-tracker bot database.

**Architecture:** Auth.js v5 (next-auth@beta) handles Discord OAuth; sessions are surfaced via `SessionProvider` + `useSession()` throughout the client. The existing `server.js` bot API on `:3001` is extended with two new endpoints (`POST /api/web-submit`, `GET /api/submissions/:discordId`) that the Next.js website proxies through its own API routes, attaching the authenticated user's Discord ID from the session.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Auth.js v5 (next-auth@beta), Discord OAuth2, better-sqlite3 (existing), Express (existing bot API)

---

## File Map

**New files (website):**
- `auth.ts` — Auth.js config (Discord provider, JWT/session callbacks)
- `types/next-auth.d.ts` — Session type extensions (discordId, discordTag)
- `app/providers.tsx` — Client-side SessionProvider wrapper
- `app/api/auth/[...nextauth]/route.ts` — Auth.js route handler
- `app/api/submit/route.ts` — Proxy: POST submission → bot API (auth-gated)
- `app/api/my-submissions/route.ts` — Proxy: GET user's posts → bot API (auth-gated)
- `components/AuthButton.tsx` — Sign in/out button using useSession
- `components/SubmitPost.tsx` — Submit form + personal submissions dashboard

**Modified files (website):**
- `.env.local` — Add AUTH_SECRET, AUTH_DISCORD_ID, AUTH_DISCORD_SECRET, TRACKER_API_URL
- `app/layout.tsx` — Wrap children with Providers
- `components/HomeDashboard.tsx` — Add "Submit" tab + AuthButton in header

**Modified files (bot):**
- `C:\Users\ericw\candle-tracker\db.js` — Add `getPostByUrl()` for duplicate detection
- `C:\Users\ericw\candle-tracker\server.js` — Add `POST /api/web-submit` and `GET /api/submissions/:discordId`

---

## Task 1: Discord OAuth App Setup (external — no code)

**Files:** `.env.local`

- [ ] **Step 1: Create Discord OAuth application**

  Go to https://discord.com/developers/applications → "New Application" → name it "Candle Elite".

- [ ] **Step 2: Configure OAuth2 redirects**

  In the app dashboard → OAuth2 → Redirects, add:
  - `http://localhost:3000/api/auth/callback/discord`
  - `https://candleliteai.com/api/auth/callback/discord`

  Save changes.

- [ ] **Step 3: Copy credentials**

  OAuth2 → General → copy **Client ID** and **Client Secret**.

- [ ] **Step 4: Add to .env.local**

  Open `C:\Users\ericw\candle-elite-community-website\.env.local` and add:

  ```env
  AUTH_SECRET=replace_with_32_char_random_string
  AUTH_DISCORD_ID=your_discord_client_id_here
  AUTH_DISCORD_SECRET=your_discord_client_secret_here
  TRACKER_API_URL=http://localhost:3001
  ```

  Generate AUTH_SECRET with: `openssl rand -base64 32`
  (Or use any random 32+ character string for now.)

---

## Task 2: Install Auth.js and Configure Discord Provider

**Files:**
- Create: `auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `types/next-auth.d.ts`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install next-auth**

  ```bash
  cd "C:\Users\ericw\candle-elite-community-website"
  npm install next-auth@beta
  ```

  Expected: next-auth@5.x.x added to package.json

- [ ] **Step 2: Create auth.ts at project root**

  Create `C:\Users\ericw\candle-elite-community-website\auth.ts`:

  ```ts
  import NextAuth from "next-auth";
  import Discord from "next-auth/providers/discord";

  export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Discord],
    callbacks: {
      jwt({ token, profile }) {
        if (profile) {
          token.discordId = (profile as { id: string }).id;
          token.discordTag = (profile as { username: string }).username;
        }
        return token;
      },
      session({ session, token }) {
        session.user.discordId = token.discordId as string;
        session.user.discordTag = token.discordTag as string;
        return session;
      },
    },
  });
  ```

- [ ] **Step 3: Create the Auth.js route handler**

  Create `C:\Users\ericw\candle-elite-community-website\app\api\auth\[...nextauth]\route.ts`:

  ```ts
  import { handlers } from "@/auth";
  export const { GET, POST } = handlers;
  ```

- [ ] **Step 4: Create type extensions**

  Create `C:\Users\ericw\candle-elite-community-website\types\next-auth.d.ts`:

  ```ts
  import { DefaultSession } from "next-auth";

  declare module "next-auth" {
    interface Session {
      user: {
        discordId: string;
        discordTag: string;
      } & DefaultSession["user"];
    }
  }

  declare module "next-auth/jwt" {
    interface JWT {
      discordId?: string;
      discordTag?: string;
    }
  }
  ```

- [ ] **Step 5: Verify the dev server starts without errors**

  ```bash
  cd "C:\Users\ericw\candle-elite-community-website"
  npm run dev
  ```

  Expected: Server starts on http://localhost:3000, no TypeScript errors.
  Navigate to http://localhost:3000/api/auth/signin — should show a "Sign in with Discord" page.

- [ ] **Step 6: Commit**

  ```bash
  cd "C:\Users\ericw\candle-elite-community-website"
  git add auth.ts app/api/auth types/next-auth.d.ts package.json package-lock.json
  git commit -m "feat: add Auth.js v5 with Discord OAuth provider"
  ```

---

## Task 3: Add SessionProvider to Layout

**Files:**
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create providers.tsx**

  Create `C:\Users\ericw\candle-elite-community-website\app\providers.tsx`:

  ```tsx
  "use client";

  import { SessionProvider } from "next-auth/react";

  export default function Providers({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
  }
  ```

- [ ] **Step 2: Wrap layout with Providers**

  Edit `C:\Users\ericw\candle-elite-community-website\app\layout.tsx` — replace the entire file:

  ```tsx
  import type { Metadata } from "next";
  import { Inter } from "next/font/google";
  import "./globals.css";
  import Providers from "./providers";

  const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
  });

  export const metadata: Metadata = {
    title: "Candle Community",
    description: "Candle Elite Dashboard & AI Clipping Tool",
  };

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <body
          className={`${inter.variable} antialiased`}
          style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    );
  }
  ```

- [ ] **Step 3: Verify no errors**

  The dev server should still compile cleanly. Reload http://localhost:3000.

- [ ] **Step 4: Commit**

  ```bash
  cd "C:\Users\ericw\candle-elite-community-website"
  git add app/providers.tsx app/layout.tsx
  git commit -m "feat: add SessionProvider to root layout"
  ```

---

## Task 4: AuthButton Component

**Files:**
- Create: `components/AuthButton.tsx`

- [ ] **Step 1: Create AuthButton**

  Create `C:\Users\ericw\candle-elite-community-website\components\AuthButton.tsx`:

  ```tsx
  "use client";

  import { useSession, signIn, signOut } from "next-auth/react";

  export default function AuthButton() {
    const { data: session, status } = useSession();

    if (status === "loading") {
      return (
        <div className="w-6 h-6 rounded-full bg-white/10 animate-pulse" />
      );
    }

    if (session) {
      return (
        <div className="flex items-center gap-2">
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt="avatar"
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-xs text-gray-400 hidden sm:block">
            {session.user.discordTag}
          </span>
          <button
            onClick={() => signOut()}
            className="text-xs text-gray-500 border border-white/10 rounded-full px-3 py-1.5 hover:border-red-500/50 hover:text-red-400 transition-colors font-medium"
          >
            Sign out
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => signIn("discord")}
        className="text-xs text-gray-300 border border-[#5865F2]/50 rounded-full px-3 py-1.5 hover:border-[#5865F2] hover:bg-[#5865F2]/10 transition-colors font-medium"
      >
        Sign in with Discord
      </button>
    );
  }
  ```

- [ ] **Step 2: Verify manually**

  With dev server running: click "Sign in with Discord" — should redirect to Discord OAuth, then back. After sign in, should show avatar + username + "Sign out" button.

- [ ] **Step 3: Commit**

  ```bash
  cd "C:\Users\ericw\candle-elite-community-website"
  git add components/AuthButton.tsx
  git commit -m "feat: add AuthButton with Discord sign in/out"
  ```

---

## Task 5: Extend Bot API (server.js + db.js)

**Files:**
- Modify: `C:\Users\ericw\candle-tracker\db.js`
- Modify: `C:\Users\ericw\candle-tracker\server.js`

- [ ] **Step 1: Add getPostByUrl to db.js**

  In `C:\Users\ericw\candle-tracker\db.js`, after the `getPost(id)` function (line 105–107), add:

  ```js
  getPostByUrl(post_url) {
    return db.prepare(`SELECT id FROM posts WHERE post_url=?`).get(post_url);
  },
  ```

- [ ] **Step 2: Add POST /api/web-submit to server.js**

  In `C:\Users\ericw\candle-tracker\server.js`, after the `app.get('/api/settings', ...)` block and before the `app.post('/api/settings', ...)` block (around line 62), add:

  ```js
  // ── Web submission endpoints ──────────────────────────────────────────────────

  app.post('/api/web-submit', (req, res) => {
    const { discordId, discordTag, xHandle, postUrl } = req.body;
    if (!discordId || !postUrl) {
      return res.status(400).json({ error: 'discordId and postUrl are required' });
    }
    const xUrlRegex = /https:\/\/(www\.)?(twitter|x)\.com\/\w+\/status\/\d+/;
    if (!xUrlRegex.test(postUrl)) {
      return res.status(400).json({ error: 'Must be a valid X/Twitter post URL' });
    }
    if (db.getPostByUrl(postUrl)) {
      return res.status(409).json({ error: 'This post has already been submitted' });
    }
    const result = db.addPost({
      discord_id: discordId,
      discord_tag: discordTag || discordId,
      x_handle: xHandle || '',
      post_url: postUrl,
      views: 0,
      likes: 0,
      reposts: 0,
    });
    res.json({ message: 'Submitted', id: result.lastInsertRowid });
  });

  app.get('/api/submissions/:discordId', (req, res) => {
    const posts = db.getPostsByUser(req.params.discordId);
    const cpm = db.getCpm();
    const postsWithEarnings = posts.map(p => ({
      ...p,
      effective_views: p.views * (p.multiplier || 1),
      cndl_owed: db.cndlOwed(p.views * (p.multiplier || 1)),
    }));
    res.json({ posts: postsWithEarnings, cpm });
  });
  ```

- [ ] **Step 3: Restart the bot API and verify**

  In the `C:\Users\ericw\candle-tracker` directory, restart server.js.

  Test with curl or a browser:
  ```bash
  curl http://localhost:3001/api/submissions/test_discord_id
  ```
  Expected: `{ "posts": [], "cpm": 10 }`

  Test the submit endpoint:
  ```bash
  curl -X POST http://localhost:3001/api/web-submit \
    -H "Content-Type: application/json" \
    -d '{"discordId":"123","discordTag":"testuser","postUrl":"https://x.com/user/status/12345678"}'
  ```
  Expected: `{ "message": "Submitted", "id": <number> }`

- [ ] **Step 4: Commit (bot repo)**

  ```bash
  cd "C:\Users\ericw\candle-tracker"
  git add db.js server.js
  git commit -m "feat: add web-submit and user submissions API endpoints"
  ```

---

## Task 6: Website API Proxy Routes

**Files:**
- Create: `app/api/submit/route.ts`
- Create: `app/api/my-submissions/route.ts`

These routes sit in front of the bot API, attach the authenticated user's identity, and prevent unauthenticated access.

- [ ] **Step 1: Create submit proxy route**

  Create `C:\Users\ericw\candle-elite-community-website\app\api\submit\route.ts`:

  ```ts
  import { auth } from "@/auth";
  import { NextRequest, NextResponse } from "next/server";

  export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Sign in with Discord first" }, { status: 401 });
    }

    const { postUrl, xHandle } = await req.json();
    if (!postUrl) {
      return NextResponse.json({ error: "postUrl is required" }, { status: 400 });
    }

    const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";
    const upstream = await fetch(`${trackerUrl}/api/web-submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discordId: session.user.discordId,
        discordTag: session.user.discordTag,
        xHandle: xHandle || "",
        postUrl,
      }),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  }
  ```

- [ ] **Step 2: Create my-submissions proxy route**

  Create `C:\Users\ericw\candle-elite-community-website\app\api\my-submissions\route.ts`:

  ```ts
  import { auth } from "@/auth";
  import { NextResponse } from "next/server";

  export async function GET() {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";
    const upstream = await fetch(
      `${trackerUrl}/api/submissions/${session.user.discordId}`,
      { cache: "no-store" }
    );

    const data = await upstream.json();
    return NextResponse.json(data);
  }
  ```

- [ ] **Step 3: Verify routes respond correctly**

  With dev server running and NOT signed in:
  - `curl http://localhost:3000/api/my-submissions` → should return `{ "error": "Unauthorized" }` with 401

  After signing in via Discord, the route should return posts (empty array if none submitted yet).

- [ ] **Step 4: Commit**

  ```bash
  cd "C:\Users\ericw\candle-elite-community-website"
  git add app/api/submit/route.ts app/api/my-submissions/route.ts
  git commit -m "feat: add auth-gated submit and my-submissions proxy routes"
  ```

---

## Task 7: SubmitPost Component

**Files:**
- Create: `components/SubmitPost.tsx`

This component combines the submission form AND the user's submission history in one place.

- [ ] **Step 1: Create SubmitPost component**

  Create `C:\Users\ericw\candle-elite-community-website\components\SubmitPost.tsx`:

  ```tsx
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

  export default function SubmitPost() {
    const { data: session } = useSession();
    const [postUrl, setPostUrl] = useState("");
    const [xHandle, setXHandle] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [cpm, setCpm] = useState(10);

    const fetchPosts = useCallback(async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch("/api/my-submissions");
        const data = await res.json();
        if (data.posts) {
          setPosts(data.posts);
          setCpm(data.cpm);
        }
      } finally {
        setLoadingPosts(false);
      }
    }, []);

    useEffect(() => {
      if (session) fetchPosts();
    }, [session, fetchPosts]);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setSubmitMsg(null);
      setSubmitting(true);
      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postUrl: postUrl.trim(), xHandle: xHandle.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          setSubmitMsg({ type: "success", text: "Post submitted! It will appear below after admin review." });
          setPostUrl("");
          fetchPosts();
        } else {
          setSubmitMsg({ type: "error", text: data.error || "Submission failed" });
        }
      } catch {
        setSubmitMsg({ type: "error", text: "Network error — is the tracker API running?" });
      } finally {
        setSubmitting(false);
      }
    }

    const totalCndl = posts
      .filter((p) => p.approved === 1)
      .reduce((sum, p) => sum + parseFloat(p.cndl_owed), 0)
      .toFixed(2);

    const pendingCount = posts.filter((p) => p.approved === 0).length;

    return (
      <div className="space-y-8">
        {/* Submit form */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold mb-1">Submit a Post</h2>
          <p className="text-gray-400 text-sm mb-5">
            Paste your X post URL — you earn <span className="text-[#32fe9f]">{cpm} $CNDL per 1,000 views</span> once approved.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">X Post URL *</label>
              <input
                type="url"
                required
                placeholder="https://x.com/username/status/1234567890"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#32fe9f]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Your X Handle (optional)</label>
              <input
                type="text"
                placeholder="@yourhandle"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#32fe9f]/50 transition-colors"
              />
            </div>
            {submitMsg && (
              <div
                className={`text-sm rounded-lg px-4 py-3 ${
                  submitMsg.type === "success"
                    ? "bg-[#32fe9f]/10 text-[#32fe9f] border border-[#32fe9f]/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {submitMsg.text}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#32fe9f]/10 text-[#32fe9f] border border-[#32fe9f]/50 rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-[#32fe9f]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit Post"}
            </button>
          </form>
        </div>

        {/* Earnings summary */}
        {posts.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Posts", value: posts.length },
              { label: "Pending Review", value: pendingCount },
              { label: "Total $CNDL Earned", value: totalCndl },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center"
              >
                <div className="text-xl font-bold text-[#32fe9f]">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Submissions table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Submissions</h2>
            <button
              onClick={fetchPosts}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loadingPosts ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-gray-500 text-sm">
              Loading…
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-gray-500 text-sm">
              No submissions yet. Paste a post URL above to get started.
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Post</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Views</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">$CNDL</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <a
                          href={post.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#32fe9f]/80 hover:text-[#32fe9f] text-xs truncate block max-w-xs transition-colors"
                        >
                          {post.post_url.replace("https://", "")}
                        </a>
                        <span className="text-gray-600 text-xs">
                          {new Date(post.submitted_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {post.views.toLocaleString()}
                        {post.multiplier !== 1 && (
                          <span className="text-xs text-gray-600 ml-1">×{post.multiplier}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[#32fe9f] font-medium">
                        {post.approved === 1 ? post.cndl_owed : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            post.approved === 1
                              ? "bg-[#32fe9f]/10 text-[#32fe9f]"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {post.approved === 1 ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Verify component compiles**

  With dev server running: no TypeScript errors in the terminal.

- [ ] **Step 3: Commit**

  ```bash
  cd "C:\Users\ericw\candle-elite-community-website"
  git add components/SubmitPost.tsx
  git commit -m "feat: add SubmitPost component with form and submissions table"
  ```

---

## Task 8: Wire Everything Into HomeDashboard

**Files:**
- Modify: `components/HomeDashboard.tsx`

- [ ] **Step 1: Update HomeDashboard**

  Replace the full contents of `C:\Users\ericw\candle-elite-community-website\components\HomeDashboard.tsx`:

  ```tsx
  "use client";

  import { useState } from "react";
  import { useSession } from "next-auth/react";
  import Link from "next/link";
  import Leaderboard from "./Leaderboard";
  import EliteBot from "./EliteBot";
  import DiscordStats from "./DiscordStats";
  import CommunityRings from "./CommunityRings";
  import CNDLToken from "./CNDLToken";
  import ClippingTool from "./ClippingTool";
  import SubmitPost from "./SubmitPost";
  import AuthButton from "./AuthButton";

  type Tab = "clipping" | "dashboard" | "community" | "payouts" | "launchbot" | "submit";

  type Props = {
    leaderboard: any[];
    cpm: number;
    stats: any;
    posts: any[];
    discordData: any;
    tokenData: any;
  };

  export default function HomeDashboard({ leaderboard, cpm, stats, posts, discordData, tokenData }: Props) {
    const [tab, setTab] = useState<Tab>("clipping");
    const { data: session } = useSession();

    const tabs: { id: Tab; label: string }[] = [
      { id: "clipping",  label: "✂ Clipping" },
      { id: "dashboard", label: "Dashboard"  },
      { id: "community", label: "Community"  },
      { id: "payouts",   label: "Payouts"    },
      { id: "submit",    label: "Submit"     },
      { id: "launchbot", label: "LaunchBot"  },
    ];

    return (
      <div className="min-h-screen bg-[#0c0e13] text-white">
        {/* Header */}
        <header className="border-b border-white/[0.06] px-6 py-4 sticky top-0 z-50 bg-[#0c0e13]/95 backdrop-blur">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#32fe9f] to-[#20cb7f] flex items-center justify-center text-black font-bold text-sm">
                C
              </div>
              <span className="font-bold text-lg tracking-tight">
                Candle <span className="elite-gradient">Elite</span>
              </span>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    tab === t.id
                      ? "bg-[#32fe9f]/15 text-[#32fe9f] border border-[#32fe9f]/80 shadow-[inset_0_5px_10px_rgba(50,254,159,0.15)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <AuthButton />
              <Link
                href="/tracker"
                className="text-xs text-gray-500 border border-white/10 rounded-full px-3 py-1.5 hover:border-[#32fe9f]/50 hover:text-gray-300 transition-colors font-medium"
              >
                Tracker →
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-6 py-10">

          {tab === "clipping" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold">AI Clipping Tool</h1>
                <p className="text-gray-400 text-sm mt-1">Upload a stream or paste a YouTube link — AI finds the best moments and renders 9:16 clips</p>
              </div>
              <ClippingTool />
            </div>
          )}

          {tab === "dashboard" && (
            <div className="space-y-10">
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">Live leaderboard and post activity</p>
              </div>
              <Leaderboard leaderboard={leaderboard} cpm={cpm} />
              <EliteBot posts={posts} stats={stats} cpm={cpm} />
            </div>
          )}

          {tab === "community" && (
            <div className="space-y-10">
              <div>
                <h1 className="text-2xl font-bold">Community</h1>
                <p className="text-gray-400 text-sm mt-1">Discord rings and live member counts</p>
              </div>
              <CommunityRings discordData={discordData} />
              <DiscordStats memberCount={stats?.members ?? null} discordData={discordData} />
            </div>
          )}

          {tab === "payouts" && (
            <div className="space-y-10">
              <div>
                <h1 className="text-2xl font-bold">Payouts</h1>
                <p className="text-gray-400 text-sm mt-1">Live $CNDL token price, holders, and clipping payouts</p>
              </div>
              <CNDLToken stats={stats} cpm={cpm} tokenData={tokenData} />
            </div>
          )}

          {tab === "submit" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold">Submit a Post</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Earn $CNDL for every 1,000 views on your approved X posts
                </p>
              </div>
              {session ? (
                <SubmitPost />
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                  <p className="text-gray-400 mb-4">Sign in with Discord to submit posts and track earnings</p>
                  <AuthButton />
                </div>
              )}
            </div>
          )}

          {tab === "launchbot" && (
            <div className="space-y-10">
              <div>
                <h1 className="text-2xl font-bold">LaunchBot</h1>
                <p className="text-gray-400 text-sm mt-1">Coming soon</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-gray-500">
                LaunchBot coming soon
              </div>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] px-6 py-6 mt-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-600">
            <span>© 2026 Candle Elite</span>
            <span>$CNDL · Members Only</span>
          </div>
        </footer>
      </div>
    );
  }
  ```

- [ ] **Step 2: Full end-to-end verification**

  With both servers running (`npm run dev` + `node server.js` in candle-tracker):

  1. Go to http://localhost:3000
  2. Click "Submit" tab → should show "Sign in with Discord" prompt
  3. Click "Sign in with Discord" in the header → OAuth flow → returns to site
  4. Click "Submit" tab again → should show the submission form
  5. Paste a real X post URL → submit → should get success message
  6. The post appears in the table as "Pending"
  7. In the Discord bot, run `/pending` → should show the web-submitted post

- [ ] **Step 3: Commit**

  ```bash
  cd "C:\Users\ericw\candle-elite-community-website"
  git add components/HomeDashboard.tsx
  git commit -m "feat: add Submit tab with auth gate and SubmitPost component"
  ```

---

## Self-Review

**Spec coverage:**
- ✅ Discord OAuth login via next-auth v5
- ✅ Sign in/out button visible in header on all tabs
- ✅ Submit tab with X post URL form
- ✅ Auth gate on Submit tab (shows sign-in prompt when logged out)
- ✅ Submissions saved to existing candle.db (same DB as Discord bot)
- ✅ Duplicate URL detection
- ✅ User's submissions table with views, $CNDL earned, status
- ✅ Bot API extended for web submissions
- ✅ Website API routes are auth-gated (session required)

**Placeholder scan:** None found — all steps contain actual code.

**Type consistency:**
- `session.user.discordId` — defined in `types/next-auth.d.ts`, used consistently in `auth.ts` callbacks, `app/api/submit/route.ts`, and `app/api/my-submissions/route.ts`
- `Post` type in `SubmitPost.tsx` matches shape returned by `GET /api/submissions/:discordId`
- `Tab` type updated to include `"submit"` in both the union and tabs array

**Known deployment note:** `TRACKER_API_URL` must point to the publicly accessible bot API in production (not `localhost:3001`). The bot needs to be deployed/accessible from Netlify for the website proxy routes to work.
