import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Sign in with Discord first" }, { status: 401 });
  }
  if (!session.user.discordId) {
    return NextResponse.json({ error: "Discord identity not found in session — please sign out and sign back in" }, { status: 401 });
  }

  const { postUrl, xHandle, platform } = await req.json();
  if (!postUrl) {
    return NextResponse.json({ error: "postUrl is required" }, { status: 400 });
  }

  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";

  let upstream: Response;
  try {
    upstream = await fetch(`${trackerUrl}/api/web-submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discordId: session.user.discordId,
        discordTag: session.user.discordTag,
        xHandle: xHandle || "",
        postUrl,
        platform: platform || "x",
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Cannot reach tracker API (${trackerUrl}): ${msg}` }, { status: 502 });
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return NextResponse.json(
      { error: `Tracker returned non-JSON (status ${upstream.status}) — check Railway logs` },
      { status: 502 }
    );
  }

  return NextResponse.json(data, { status: upstream.status });
}
