"use client";

import { useEffect, useState } from "react";

type Log = {
  id: string;
  type: string;
  message: string | null;
  payload: unknown;
  createdAt: string;
  user: { username: string; robloxUserId: string } | null;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/logs?limit=200")
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-amber-400">Event logs</h1>
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-4 text-amber-200/60">Loading…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-amber-800/50 bg-stone-800/50">
                <th className="p-3 font-semibold text-amber-300">Time</th>
                <th className="p-3 font-semibold text-amber-300">Type</th>
                <th className="p-3 font-semibold text-amber-300">User</th>
                <th className="p-3 font-semibold text-amber-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-amber-900/30">
                  <td className="p-3 text-amber-200/70">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="p-3">{l.type}</td>
                  <td className="p-3">{l.user ? `${l.user.username} (${l.user.robloxUserId})` : "—"}</td>
                  <td className="p-3 font-mono text-xs text-amber-200/60 max-w-md truncate" title={typeof l.payload === "object" ? JSON.stringify(l.payload) : String(l.payload)}>
                    {l.message ?? (l.payload != null ? JSON.stringify(l.payload) : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
