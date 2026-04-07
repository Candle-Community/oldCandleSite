import { NextResponse } from "next/server";

const GUILD_ID = "1347239021331484733";
const ROLE_IDS = {
  verified: "1436046053198794792",
  holder: "1435281730222424215",
  believer: "1347278777415368827",
  elite: "1382439059313393724",
};

async function getRoleMemberCount(roleId: string, token: string): Promise<number> {
  let count = 0;
  let after = "0";

  while (true) {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}`,
      { headers: { Authorization: `Bot ${token}` } }
    );

    if (!res.ok) break;
    const members = await res.json();
    if (!Array.isArray(members) || members.length === 0) break;

    for (const m of members) {
      if (m.roles?.includes(roleId)) count++;
    }

    if (members.length < 1000) break;
    after = members[members.length - 1].user.id;
  }

  return count;
}

async function getGuildMemberCount(token: string): Promise<number> {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`,
    { headers: { Authorization: `Bot ${token}` } }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.approximate_member_count ?? 0;
}

export async function GET() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "No bot token" }, { status: 500 });

  // Debug: check guild access first
  const guildRes = await fetch(
    `https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`,
    { headers: { Authorization: `Bot ${token}` } }
  );
  if (!guildRes.ok) {
    const body = await guildRes.text();
    return NextResponse.json({ error: `Guild API failed: ${guildRes.status}`, body }, { status: 500 });
  }
  const guildData = await guildRes.json();

  try {
    const [verified, holder, believer, elite] = await Promise.all([
      getRoleMemberCount(ROLE_IDS.verified, token),
      getRoleMemberCount(ROLE_IDS.holder, token),
      getRoleMemberCount(ROLE_IDS.believer, token),
      getRoleMemberCount(ROLE_IDS.elite, token),
    ]);

    const totalMembers = guildData.approximate_member_count ?? 0;

    return NextResponse.json(
      { totalMembers, rings: { verified, holder, believer, elite }, _debug: { approximate_member_count: guildData.approximate_member_count } },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET" } });
}
