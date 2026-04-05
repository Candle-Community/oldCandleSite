import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !ADMIN_USERS.includes(session.user.discordTag ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";
  const password = process.env.ADMIN_PASSWORD || "candle2024";

  try {
    const res = await fetch(`${trackerUrl}/api/posts/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Cannot reach tracker API: ${msg}` }, { status: 502 });
  }
}

const ADMIN_USERS = ["rich.cndl", ".aleedotg"];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !ADMIN_USERS.includes(session.user.discordTag ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { approved, notes, views, multiplier } = await req.json();
  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";
  const password = process.env.ADMIN_PASSWORD || "candle2024";

  try {
    // Fetch the existing post to fill in any fields not provided
    const existing = await fetch(`${trackerUrl}/api/posts`, { cache: "no-store" });
    const allPosts = await existing.json();
    const post = Array.isArray(allPosts) ? allPosts.find((p: { id: number }) => String(p.id) === id) : null;

    const res = await fetch(`${trackerUrl}/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        approved:   approved   ?? post?.approved   ?? 0,
        notes:      notes      ?? post?.notes      ?? "",
        views:      views      ?? post?.views      ?? 0,
        likes:      post?.likes      ?? 0,
        reposts:    post?.reposts    ?? 0,
        multiplier: multiplier ?? post?.multiplier ?? 1.0,
      }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Cannot reach tracker API: ${msg}` }, { status: 502 });
  }
}
