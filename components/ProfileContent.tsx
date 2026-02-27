"use client";

import Image from "next/image";
import type { SessionUser } from "@/hooks/useSession";
import { useEffect, useState } from "react";

type ProfileData = {
  drogons: number;
  houseName: string | null;
  createdAt: string;
};

export function ProfileContent({ session }: { session: SessionUser }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch(`/api/players/${session.robloxUserId}`)
      .then((r) => r.json())
      .then((data) =>
        setProfile({
          drogons: data.drogons ?? 0,
          houseName: data.houseName ?? null,
          createdAt: data.createdAt ?? "",
        })
      )
      .catch(() => setProfile(null));
  }, [session.robloxUserId]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-400">Your Profile</h1>
      <div className="card flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {session.avatarUrl ? (
          <Image
            src={session.avatarUrl}
            alt=""
            width={80}
            height={80}
            className="rounded-full border-2 border-amber-700/50"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-600 text-2xl text-amber-200/60">
            ?
          </div>
        )}
        <div>
          <p className="text-xl font-semibold text-amber-100">
            {session.displayName ?? session.username}
          </p>
          <p className="text-amber-200/70">@{session.username}</p>
          <p className="mt-1 text-sm text-amber-200/50">
            Roblox ID: {session.robloxUserId}
          </p>
        </div>
      </div>
      <div className="card grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-amber-200/70">Drogons</p>
          <p className="text-2xl font-bold text-amber-400">
            {profile?.drogons?.toLocaleString() ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-amber-200/70">House</p>
          <p className="text-lg text-amber-100">{profile?.houseName ?? "—"}</p>
        </div>
        {profile?.createdAt && (
          <div className="sm:col-span-2">
            <p className="text-sm text-amber-200/50">
              Account linked: {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
