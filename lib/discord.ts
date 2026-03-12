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
      { headers: { Authorization: `Bot ${token}` }, cache: "no-store" }
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
    { headers: { Authorization: `Bot ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.approximate_member_count ?? 0;
}

export async function fetchDiscordData() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;

  try {
    const [totalMembers, verified, holder, believer, elite] = await Promise.all([
      getGuildMemberCount(token),
      getRoleMemberCount(ROLE_IDS.verified, token),
      getRoleMemberCount(ROLE_IDS.holder, token),
      getRoleMemberCount(ROLE_IDS.believer, token),
      getRoleMemberCount(ROLE_IDS.elite, token),
    ]);

    const general = Math.max(0, totalMembers - verified - holder - believer - elite);
    return { totalMembers, rings: { general, verified, holder, believer, elite } };
  } catch {
    return null;
  }
}
