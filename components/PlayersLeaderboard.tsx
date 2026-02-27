"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type Player = {
  id: string;
  robloxUserId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  drogons: number;
};

export function PlayersLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-amber-200/60">Loading…</p>;
  if (players.length === 0) return <p className="text-amber-200/70">No players yet.</p>;

  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-amber-800/50 bg-stone-800/50">
            <th className="p-3 font-semibold text-amber-300">Rank</th>
            <th className="p-3 font-semibold text-amber-300">Player</th>
            <th className="p-3 font-semibold text-amber-300">Drogons</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id} className="border-b border-amber-900/30 hover:bg-stone-800/30 transition-colors">
              <td className="p-3 text-amber-200/80">{i + 1}</td>
              <td className="p-3">
                <Link
                  href={`/players/${p.robloxUserId}`}
                  className="flex items-center gap-3 font-medium text-amber-100 hover:text-amber-400 transition-colors"
                >
                  {p.avatarUrl ? (
                    <Image
                      src={p.avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="rounded-full border border-amber-800/50"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-600 text-sm text-amber-200/60">
                      ?
                    </span>
                  )}
                  {p.displayName ?? p.username}
                </Link>
              </td>
              <td className="p-3 text-amber-400 font-medium">{p.drogons.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
