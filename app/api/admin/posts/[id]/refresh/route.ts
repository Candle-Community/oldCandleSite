import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERS = ["rich.cndl", ".aleedotg"];

export async function POST(
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
    const res = await fetch(`${trackerUrl}/api/posts/${id}/refresh`, {
      method: "POST",
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
