import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.LAUNCHBOT_API_URL;

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!BASE) return NextResponse.json({ error: "LAUNCHBOT_API_URL not configured" }, { status: 503 });
  const { path } = await params;
  const url = `${BASE}/api/${path.join("/")}${req.nextUrl.search}`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }
}
