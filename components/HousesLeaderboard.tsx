"use client";

import { useEffect, useState } from "react";

type House = {
  id: string;
  name: string;
  totalDrogons: number;
  activityPoints: number;
  updatedAt: string | null;
};

export function HousesLeaderboard() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/houses")
      .then((r) => r.json())
      .then(setHouses)
      .catch(() => setHouses([]))
      .finally(() => setLoading(false));
  }, []);

  const lastUpdated = houses.reduce<string | null>(
    (acc, h) => (h.updatedAt && (!acc || new Date(h.updatedAt) > new Date(acc)) ? h.updatedAt : acc),
    null
  );

  if (loading) return <p className="text-amber-200/60">Loading…</p>;
  if (houses.length === 0) return <p className="text-amber-200/70">No houses yet.</p>;

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-amber-800/50 bg-stone-800/50">
              <th className="p-3 font-semibold text-amber-300">Rank</th>
              <th className="p-3 font-semibold text-amber-300">House</th>
              <th className="p-3 font-semibold text-amber-300">Activity points</th>
              <th className="p-3 font-semibold text-amber-300">Drogons</th>
            </tr>
          </thead>
          <tbody>
            {houses.map((h, i) => (
              <tr key={h.id} className="border-b border-amber-900/30 hover:bg-stone-800/30 transition-colors">
                <td className="p-3 text-amber-200/80">{i + 1}</td>
                <td className="p-3 font-medium text-amber-100">{h.name}</td>
                <td className="p-3 text-amber-400">{h.activityPoints.toLocaleString()}</td>
                <td className="p-3 text-amber-200/80">{h.totalDrogons.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lastUpdated && (
        <p className="text-sm text-amber-200/50">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
      )}
    </div>
  );
}
