import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.discordId) {
    return NextResponse.json({ error: "Discord identity not found in session" }, { status: 401 });
  }

  const trackerUrl = process.env.TRACKER_API_URL || "http://localhost:3001";
  const upstream = await fetch(
    `${trackerUrl}/api/submissions/${session.user.discordId}`,
    { cache: "no-store" }
  );

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
