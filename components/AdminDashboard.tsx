"use client";

import { useEffect, useState } from "react";

type Player = { id: string; robloxUserId: string; username: string; displayName: string | null; drogons: number; houseName: string | null };
type House = { id: string; name: string; totalDrogons: number; activityPoints: number };
type Bounty = { id: string; targetRobloxUserId: string; targetUsername: string | null; amount: number; status: string };
type Log = { id: string; type: string; message?: string; payload?: unknown; createdAt: string; user?: { username: string; robloxUserId: string } | null };

export function AdminDashboard() {
  const [tab, setTab] = useState<"players" | "houses" | "bounties" | "logs">("players");
  const [players, setPlayers] = useState<Player[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [bountyTarget, setBountyTarget] = useState("");
  const [bountyUsername, setBountyUsername] = useState("");
  const [bountyAmount, setBountyAmount] = useState("");

  const fetchPlayers = () => {
    setLoading(true);
    fetch("/api/admin/players")
      .then((r) => r.json())
      .then(setPlayers)
      .finally(() => setLoading(false));
  };
  const fetchHouses = () => {
    setLoading(true);
    fetch("/api/admin/houses")
      .then((r) => r.json())
      .then(setHouses)
      .finally(() => setLoading(false));
  };
  const fetchBounties = () => {
    setLoading(true);
    fetch("/api/admin/bounties")
      .then((r) => r.json())
      .then(setBounties)
      .finally(() => setLoading(false));
  };
  const fetchLogs = () => {
    setLoading(true);
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === "players") fetchPlayers();
    if (tab === "houses") fetchHouses();
    if (tab === "bounties") fetchBounties();
    if (tab === "logs") fetchLogs();
  }, [tab]);

  const saveBalance = async (userId: string) => {
    const n = parseInt(newBalance, 10);
    if (isNaN(n) || n < 0) return;
    await fetch(`/api/admin/players/${userId}/balance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drogons: n }),
    });
    setEditingBalance(null);
    setNewBalance("");
    fetchPlayers();
  };

  const createBounty = async () => {
    const amount = parseInt(bountyAmount, 10);
    if (!bountyTarget.trim() || isNaN(amount) || amount < 0) return;
    await fetch("/api/admin/bounties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetRobloxUserId: bountyTarget.trim(),
        amount,
      }),
    });
    setBountyTarget("");
    setBountyUsername("");
    setBountyAmount("");
    fetchBounties();
  };

  const cancelBounty = async (bountyId: string) => {
    await fetch(`/api/admin/bounties/${bountyId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELLED" }) });
    fetchBounties();
  };

  const tabs = [
    { id: "players" as const, label: "Players" },
    { id: "houses" as const, label: "Houses" },
    { id: "bounties" as const, label: "Bounties" },
    { id: "logs" as const, label: "Logs" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-400">Admin</h1>
      <div className="flex gap-2 border-b border-amber-800/50 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn ${tab === t.id ? "bg-amber-700/50 text-amber-200" : "btn-secondary"}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "players" && (
        <div className="card overflow-hidden p-0">
          {loading ? (
            <p className="p-4 text-amber-200/60">Loading…</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-amber-800/50 bg-stone-800/50">
                  <th className="p-3 font-semibold text-amber-300">User</th>
                  <th className="p-3 font-semibold text-amber-300">House</th>
                  <th className="p-3 font-semibold text-amber-300">Drogons</th>
                  <th className="p-3 font-semibold text-amber-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id} className="border-b border-amber-900/30">
                    <td className="p-3">{p.displayName ?? p.username} ({p.robloxUserId})</td>
                    <td className="p-3">{p.houseName ?? "—"}</td>
                    <td className="p-3">
                      {editingBalance === p.id ? (
                        <input
                          type="number"
                          min={0}
                          value={newBalance}
                          onChange={(e) => setNewBalance(e.target.value)}
                          className="w-24 rounded border border-amber-700/50 bg-stone-800 px-2 py-1 text-amber-100"
                        />
                      ) : (
                        p.drogons.toLocaleString()
                      )}
                    </td>
                    <td className="p-3">
                      {editingBalance === p.id ? (
                        <>
                          <button type="button" className="btn-primary mr-2 text-sm" onClick={() => saveBalance(p.id)}>Save</button>
                          <button type="button" className="btn-secondary text-sm" onClick={() => { setEditingBalance(null); setNewBalance(""); }}>Cancel</button>
                        </>
                      ) : (
                        <button type="button" className="btn-secondary text-sm" onClick={() => { setEditingBalance(p.id); setNewBalance(String(p.drogons)); }}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "houses" && (
        <div className="card overflow-hidden p-0">
          {loading ? (
            <p className="p-4 text-amber-200/60">Loading…</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-amber-800/50 bg-stone-800/50">
                  <th className="p-3 font-semibold text-amber-300">House</th>
                  <th className="p-3 font-semibold text-amber-300">Drogons</th>
                  <th className="p-3 font-semibold text-amber-300">Activity</th>
                </tr>
              </thead>
              <tbody>
                {houses.map((h) => (
                  <tr key={h.id} className="border-b border-amber-900/30">
                    <td className="p-3">{h.name}</td>
                    <td className="p-3">{h.totalDrogons.toLocaleString()}</td>
                    <td className="p-3">{h.activityPoints.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "bounties" && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Target Roblox User ID"
              value={bountyTarget}
              onChange={(e) => setBountyTarget(e.target.value)}
              className="rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100 placeholder-amber-400/40"
            />
            <input
              type="text"
              placeholder="Target username (optional)"
              value={bountyUsername}
              onChange={(e) => setBountyUsername(e.target.value)}
              className="rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100 placeholder-amber-400/40"
            />
            <input
              type="number"
              min={0}
              placeholder="Amount"
              value={bountyAmount}
              onChange={(e) => setBountyAmount(e.target.value)}
              className="w-24 rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100"
            />
            <button type="button" className="btn-primary" onClick={createBounty}>Add bounty</button>
          </div>
          <div className="card overflow-hidden p-0">
            {loading ? (
              <p className="p-4 text-amber-200/60">Loading…</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-amber-800/50 bg-stone-800/50">
                    <th className="p-3 font-semibold text-amber-300">Target</th>
                    <th className="p-3 font-semibold text-amber-300">Amount</th>
                    <th className="p-3 font-semibold text-amber-300">Status</th>
                    <th className="p-3 font-semibold text-amber-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bounties.map((b) => (
                    <tr key={b.id} className="border-b border-amber-900/30">
                      <td className="p-3">{b.targetUsername ?? b.targetRobloxUserId}</td>
                      <td className="p-3">{b.amount.toLocaleString()}</td>
                      <td className="p-3">{b.status}</td>
                      <td className="p-3">
                        {b.status === "ACTIVE" && (
                          <button type="button" className="btn-secondary text-sm" onClick={() => cancelBounty(b.id)}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="card overflow-hidden p-0">
          {loading ? (
            <p className="p-4 text-amber-200/60">Loading…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-amber-800/50 bg-stone-800/50">
                  <th className="p-3 font-semibold text-amber-300">Time</th>
                  <th className="p-3 font-semibold text-amber-300">Action</th>
                  <th className="p-3 font-semibold text-amber-300">User</th>
                  <th className="p-3 font-semibold text-amber-300">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-amber-900/30">
                    <td className="p-3 text-amber-200/70">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="p-3">{l.type}</td>
                    <td className="p-3">{l.user?.username ?? "—"}</td>
                    <td className="p-3 font-mono text-xs text-amber-200/60">
                      {l.payload != null ? JSON.stringify(l.payload) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
