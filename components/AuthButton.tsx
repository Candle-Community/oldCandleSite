"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-6 h-6 rounded-full bg-white/10 animate-pulse" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt="avatar"
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="text-xs text-gray-400 hidden sm:block">
          {session.user.discordTag ?? session.user.name}
        </span>
        <button
          onClick={() => signOut()}
          className="text-xs text-gray-500 border border-white/10 rounded-full px-3 py-1.5 hover:border-red-500/50 hover:text-red-400 transition-colors font-medium"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("discord")}
      className="text-xs text-gray-300 border border-[#5865F2]/50 rounded-full px-3 py-1.5 hover:border-[#5865F2] hover:bg-[#5865F2]/10 transition-colors font-medium"
    >
      Sign in with Discord
    </button>
  );
}
