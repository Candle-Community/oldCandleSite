import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Discord],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.discordId = (profile as { id: string }).id;
        token.discordTag = (profile as { username: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      session.user.discordId = token.discordId as string;
      session.user.discordTag = token.discordTag as string;
      return session;
    },
  },
});
