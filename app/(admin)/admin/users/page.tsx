"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  robloxUserId: string;
  username: string;
  displayName: string | null;
  role: string;
  drogons: number;
  houseName: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ isSuperAdmin?: boolean } | null>(null);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState("");

  const fetchSession = () => fetch("/api/auth/session").then((r) => r.json()).then(setSession);
  const fetchUsers = (q?: string) => {
    setLoading(true);
    const url = q != null && q.trim() ? `/api/admin/players?search=${encodeURIComponent(q.trim())}` : "/api/admin/players";
    fetch(url)
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSession(); }, []);
  useEffect(() => { fetchUsers(search); }, [search]);

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
    fetchUsers(search);
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    const res = await fetch(`/api/admin/players/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    if (res.ok) fetchUsers(search);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-amber-400">Users</h1>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search by username or user ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100 placeholder-amber-400/40 min-w-[200px]"
        />
      </div>
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-4 text-amber-200/60">Loading…</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-amber-800/50 bg-stone-800/50">
                <th className="p-3 font-semibold text-amber-300">User</th>
                <th className="p-3 font-semibold text-amber-300">Role</th>
                <th className="p-3 font-semibold text-amber-300">Drogons</th>
                <th className="p-3 font-semibold text-amber-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((p) => (
                <tr key={p.id} className="border-b border-amber-900/30">
                  <td className="p-3">{p.displayName ?? p.username} ({p.robloxUserId})</td>
                  <td className="p-3">{p.role}</td>
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
                  <td className="p-3 flex flex-wrap gap-2">
                    {editingBalance === p.id ? (
                      <>
                        <button type="button" className="btn-primary text-sm" onClick={() => saveBalance(p.id)}>Save</button>
                        <button type="button" className="btn-secondary text-sm" onClick={() => { setEditingBalance(null); setNewBalance(""); }}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" className="btn-secondary text-sm" onClick={() => { setEditingBalance(p.id); setNewBalance(String(p.drogons)); }}>Edit balance</button>
                    )}
                    {session?.isSuperAdmin && (
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        onClick={() => toggleRole(p.id, p.role)}
                      >
                        {p.role === "ADMIN" ? "Remove admin" : "Make admin"}
                      </button>
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
