"use client";

import Link from "next/link";
import Image from "next/image";

type Player = {
  id: string;
  robloxUserId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  drogons: number;
  houseName: string | null;
  createdAt: string;
};

type EventItem = {
  id: string;
  type: string;
  message: string | null;
  payload: unknown;
  createdAt: string;
};

export function PlayerProfile({
  player,
  events = [],
  isOwnProfile = false,
}: {
  player: Player;
  events?: EventItem[];
  isOwnProfile?: boolean;
}) {
  return (
    <div className="space-y-8">
      <Link href="/players" className="text-amber-400 hover:text-amber-300 text-sm inline-block">
        ← Back to leaderboard
      </Link>
      <div className="card flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {player.avatarUrl ? (
          <Image
            src={player.avatarUrl}
            alt=""
            width={96}
            height={96}
            className="rounded-full border-2 border-amber-700/50"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-stone-600 text-3xl text-amber-200/60">
            ?
          </div>
        )}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-amber-100">
              {player.displayName ?? player.username}
            </h1>
            {isOwnProfile && (
              <span className="rounded bg-amber-900/50 px-2 py-0.5 text-xs font-medium text-amber-300">
                You
              </span>
            )}
          </div>
          <p className="text-amber-200/70">@{player.username}</p>
          <p className="text-sm text-amber-200/50">Roblox ID: {player.robloxUserId}</p>
          {isOwnProfile && (
            <Link href="/profile" className="mt-2 inline-block text-sm text-amber-400 hover:text-amber-300">
              View your full profile →
            </Link>
          )}
        </div>
      </div>
      <div className="card grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-amber-200/70">Drogons</p>
          <p className="text-2xl font-bold text-amber-400">{player.drogons.toLocaleString()}</p>
        </div>
        {player.houseName && (
          <div>
            <p className="text-sm text-amber-200/70">House</p>
            <p className="text-lg text-amber-100">{player.houseName}</p>
          </div>
        )}
        <div className={player.houseName ? "sm:col-span-2" : ""}>
          <p className="text-sm text-amber-200/50">
            First seen: {new Date(player.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      {events.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-amber-300 mb-4">Recent activity</h2>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-2 text-sm border-b border-amber-900/30 pb-2 last:border-0">
                <span className="text-amber-200/50 shrink-0">{new Date(e.createdAt).toLocaleString()}</span>
                <span className="font-medium text-amber-200">{e.type}</span>
                {e.message && <span className="text-amber-200/70">{e.message}</span>}
                {e.payload != null && (
                  <span className="font-mono text-xs text-amber-200/50 truncate max-w-full">
                    {JSON.stringify(e.payload)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
