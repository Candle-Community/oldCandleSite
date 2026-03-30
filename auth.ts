import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import type { DiscordProfile } from "next-auth/providers/discord";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Discord],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        const dp = profile as DiscordProfile;
        token.discordId = dp.id;
        token.discordTag = dp.username;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.discordId === "string") session.user.discordId = token.discordId;
      if (typeof token.discordTag === "string") session.user.discordTag = token.discordTag;
      return session;
    },
  },
});
