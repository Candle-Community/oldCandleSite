import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Sign in with Discord first" }, { status: 401 });
  }
  if (!session.user.discordId) {
    return NextResponse.json({ error: "Discord identity not found in session" }, { status: 401 });
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
