"use client";

import { useEffect, useState } from "react";

type Bounty = {
  id: string;
  targetRobloxUserId: string;
  amount: number;
  status: string;
  createdAt: string;
  claimedAt: string | null;
  claimedByRobloxUserId: string | null;
  claimedByUsername: string | null;
};

export default function AdminBountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetRobloxUserId, setTargetRobloxUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [editingAmount, setEditingAmount] = useState<string | null>(null);
  const [editAmountValue, setEditAmountValue] = useState("");

  const fetchBounties = () => {
    setLoading(true);
    fetch("/api/admin/bounties")
      .then((r) => r.json())
      .then(setBounties)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBounties(); }, []);

  const createBounty = async () => {
    const amt = parseInt(amount, 10);
    if (!targetRobloxUserId.trim() || isNaN(amt) || amt < 0) return;
    await fetch("/api/admin/bounties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetRobloxUserId: targetRobloxUserId.trim(), amount: amt }),
    });
    setTargetRobloxUserId("");
    setAmount("");
    fetchBounties();
  };

  const updateStatus = async (bountyId: string, status: "ACTIVE" | "CLAIMED" | "CANCELLED") => {
    await fetch(`/api/admin/bounties/${bountyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchBounties();
  };

  const saveAmount = async (bountyId: string) => {
    const amt = parseInt(editAmountValue, 10);
    if (isNaN(amt) || amt < 0) return;
    await fetch(`/api/admin/bounties/${bountyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt }),
    });
    setEditingAmount(null);
    setEditAmountValue("");
    fetchBounties();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-amber-400">Bounties</h1>
      <div className="card flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Target Roblox User ID"
          value={targetRobloxUserId}
          onChange={(e) => setTargetRobloxUserId(e.target.value)}
          className="rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100 placeholder-amber-400/40"
        />
        <input
          type="number"
          min={0}
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100"
        />
        <button type="button" className="btn-primary" onClick={createBounty}>Create bounty</button>
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
                  <td className="p-3">{b.claimedByUsername ?? b.targetRobloxUserId}</td>
                  <td className="p-3">
                    {editingAmount === b.id ? (
                      <input
                        type="number"
                        min={0}
                        value={editAmountValue}
                        onChange={(e) => setEditAmountValue(e.target.value)}
                        className="w-24 rounded border border-amber-700/50 bg-stone-800 px-2 py-1 text-amber-100"
                      />
                    ) : (
                      b.amount.toLocaleString()
                    )}
                  </td>
                  <td className="p-3">{b.status}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    {editingAmount === b.id ? (
                      <>
                        <button type="button" className="btn-primary text-sm" onClick={() => saveAmount(b.id)}>Save</button>
                        <button type="button" className="btn-secondary text-sm" onClick={() => { setEditingAmount(null); setEditAmountValue(""); }}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" className="btn-secondary text-sm" onClick={() => { setEditingAmount(b.id); setEditAmountValue(String(b.amount)); }}>Edit amount</button>
                    )}
                    {b.status === "ACTIVE" && (
                      <>
                        <button type="button" className="btn-primary text-sm" onClick={() => updateStatus(b.id, "CLAIMED")}>Mark claimed</button>
                        <button type="button" className="btn-secondary text-sm" onClick={() => updateStatus(b.id, "CANCELLED")}>Void</button>
                      </>
                    )}
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
