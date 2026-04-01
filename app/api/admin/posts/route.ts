import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ADMIN_USERS = ["rich.cndl", ".aleedotg"];

export async function GET() {
  const session = await auth();
  if (!session || !ADMIN_USERS.includes(session.user.discordTag ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";
  try {
    const res = await fetch(`${trackerUrl}/api/posts`, { cache: "no-store" });
    const posts = await res.json();
    return NextResponse.json(posts);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Cannot reach tracker API: ${msg}` }, { status: 502 });
  }
}
