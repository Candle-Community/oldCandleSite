import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERS = ["rich.cndl", ".aleedotg"];

export async function GET() {
  const session = await auth();
  if (!session || !ADMIN_USERS.includes(session.user.discordTag ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";
  try {
    const res = await fetch(`${trackerUrl}/api/settings`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json({ usd_cpm: data.usd_cpm ?? 5 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Cannot reach tracker API: ${msg}` }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || !ADMIN_USERS.includes(session.user.discordTag ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { usd_cpm } = await req.json();
  if (typeof usd_cpm !== "number" || usd_cpm <= 0) {
    return NextResponse.json({ error: "usd_cpm must be a positive number" }, { status: 400 });
  }

  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";
  const password   = process.env.ADMIN_PASSWORD   || "candle2024";

  try {
    const res = await fetch(`${trackerUrl}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, usd_cpm }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Cannot reach tracker API: ${msg}` }, { status: 502 });
  }
}
