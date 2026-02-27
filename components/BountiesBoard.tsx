"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Bounty = {
  id: string;
  targetRobloxUserId: string;
  targetUsername: string | null;
  amount: number;
  createdAt: string;
};

type Session = { id: string; isAdmin?: boolean } | null;

export function BountiesBoard() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  const [createTarget, setCreateTarget] = useState("");
  const [createAmount, setCreateAmount] = useState("");

  const fetchBounties = () => {
    fetch("/api/bounties")
      .then((r) => r.json())
      .then(setBounties)
      .catch(() => setBounties([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/bounties").then((r) => r.json()).then(setBounties).catch(() => setBounties([])),
      fetch("/api/auth/session").then((r) => r.json()).then((d) => setSession(d?.id ? d : null)).catch(() => setSession(null)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const amount = parseInt(createAmount, 10);
    if (!createTarget.trim() || isNaN(amount) || amount < 0) return;
    const res = await fetch("/api/admin/bounties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetRobloxUserId: createTarget.trim(), amount }),
    });
    if (res.ok) {
      setCreateTarget("");
      setCreateAmount("");
      fetchBounties();
    }
  };

  if (loading) return <p className="text-amber-200/60">Loading…</p>;
  if (bounties.length === 0 && !session?.isAdmin) return <p className="text-amber-200/70">No active bounties.</p>;

  return (
    <div className="space-y-6">
      {session?.isAdmin && (
        <div className="card flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm text-amber-200/70 mb-1">Target Roblox User ID</label>
            <input
              type="text"
              placeholder="e.g. 123456789"
              value={createTarget}
              onChange={(e) => setCreateTarget(e.target.value)}
              className="rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100 placeholder-amber-400/40 min-w-[180px]"
            />
          </div>
          <div>
            <label className="block text-sm text-amber-200/70 mb-1">Amount (Drogons)</label>
            <input
              type="number"
              min={0}
              value={createAmount}
              onChange={(e) => setCreateAmount(e.target.value)}
              className="rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100 w-28"
            />
          </div>
          <button type="button" className="btn-primary" onClick={handleCreate}>
            Create bounty
          </button>
        </div>
      )}
      {bounties.length === 0 ? (
        <p className="text-amber-200/70">No active bounties.</p>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-amber-800/50 bg-stone-800/50">
                <th className="p-3 font-semibold text-amber-300">Target</th>
                <th className="p-3 font-semibold text-amber-300">Bounty (Drogons)</th>
                <th className="p-3 font-semibold text-amber-300">Added</th>
              </tr>
            </thead>
            <tbody>
              {bounties.map((b) => (
                <tr key={b.id} className="border-b border-amber-900/30 hover:bg-stone-800/30 transition-colors">
                  <td className="p-3">
                    <Link
                      href={`/players/${b.targetRobloxUserId}`}
                      className="font-medium text-amber-100 hover:text-amber-400 transition-colors"
                    >
                      {b.targetUsername ?? b.targetRobloxUserId}
                    </Link>
                  </td>
                  <td className="p-3 text-amber-400 font-medium">{b.amount.toLocaleString()}</td>
                  <td className="p-3 text-amber-200/70 text-sm">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
