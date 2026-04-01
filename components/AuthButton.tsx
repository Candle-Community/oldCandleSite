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
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-[#FF6021] bg-[#FF6021]/15 border border-[#FF6021]/80 rounded-full px-3 py-1.5 font-semibold shadow-[inset_0_5px_10px_rgba(255,96,33,0.15)] hover:bg-[#FF6021]/30 transition-all"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("discord")}
      className="text-xs text-[#FF6021] bg-[#FF6021]/15 border border-[#FF6021]/80 rounded-full px-3 py-1.5 font-semibold shadow-[inset_0_5px_10px_rgba(255,96,33,0.15)] hover:bg-[#FF6021]/30 transition-all"
    >
      Sign in with Discord
    </button>
  );
}
