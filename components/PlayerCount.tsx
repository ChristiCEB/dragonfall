"use client";

import { useEffect, useState } from "react";

export function PlayerCount() {
  const [count, setCount] = useState<number | null>(null);
  const [recordedAt, setRecordedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/player-count")
      .then((r) => r.json())
      .then((data) => {
        setCount(data.count ?? 0);
        setRecordedAt(data.recordedAt ?? null);
      })
      .catch(() => setCount(null));
  }, []);

  return (
    <div className="rounded-xl border border-amber-800/50 bg-stone-900/60 px-8 py-6 shadow-lg">
      <p className="text-sm font-medium text-amber-200/80 uppercase tracking-wider">Players online now</p>
      <p className="mt-1 text-4xl font-bold text-amber-400">
        {count !== null ? count.toLocaleString() : "—"}
      </p>
      {recordedAt && (
        <p className="mt-2 text-xs text-amber-200/50">
          Last updated: {new Date(recordedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
