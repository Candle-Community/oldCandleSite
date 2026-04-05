import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TRACKER_API_URL = process.env.TRACKER_API_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "candle2024";
const ADMIN_USERS = ["rich.cndl", ".aleedotg"];

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name || !ADMIN_USERS.includes(session.user.name)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const res = await fetch(`${TRACKER_API_URL}/api/posts/${params.id}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
