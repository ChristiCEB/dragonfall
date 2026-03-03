"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/ToastContext";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { TableSkeleton } from "@/components/admin/LoadingSkeleton";

type House = {
  id: string;
  name: string;
  rawName: string;
  groupId: number | null;
  r: number;
  g: number;
  b: number;
  isActive: boolean;
  totalDrogons: number;
  activityPoints: number;
  updatedAt: string | null;
};

export default function AdminHousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<House | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<House | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    groupId: "",
    r: "0",
    g: "0",
    b: "0",
    isActive: true,
  });
  const { addToast } = useToast();

  const fetchHouses = (q?: string) => {
    setLoading(true);
    const url = q != null && q.trim() ? `/api/admin/houses?search=${encodeURIComponent(q.trim())}` : "/api/admin/houses";
    fetch(url)
      .then((r) => r.json())
      .then(setHouses)
      .catch(() => addToast("Failed to load houses", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHouses(search);
  }, [search]);

  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const validForm = () => {
    const name = form.name.trim();
    const gid = parseInt(form.groupId, 10);
    return name && !Number.isNaN(gid) && gid >= 0;
  };

  const submitForm = async () => {
    if (!validForm()) {
      addToast("Name and Group ID (≥0) required", "error");
      return;
    }
    setFormLoading(true);
    const r = clamp(parseInt(form.r, 10) || 0);
    const g = clamp(parseInt(form.g, 10) || 0);
    const b = clamp(parseInt(form.b, 10) || 0);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/houses/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            groupId: parseInt(form.groupId, 10),
            r,
            g,
            b,
            isActive: form.isActive,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          addToast(data.error || "Update failed", "error");
          return;
        }
        addToast("House updated", "success");
      } else {
        const res = await fetch("/api/admin/houses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            groupId: parseInt(form.groupId, 10),
            r,
            g,
            b,
            isActive: form.isActive,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          addToast(data.error || "Create failed", "error");
          return;
        }
        addToast("House created", "success");
      }
      setFormOpen(false);
      setEditing(null);
      setForm({ name: "", groupId: "", r: "0", g: "0", b: "0", isActive: true });
      fetchHouses(search);
    } finally {
      setFormLoading(false);
    }
  };

  const toggleActive = async (house: House) => {
    const res = await fetch(`/api/admin/houses/${house.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !house.isActive }),
    });
    if (!res.ok) {
      addToast("Update failed", "error");
      return;
    }
    addToast(house.isActive ? "House deactivated" : "House activated", "success");
    fetchHouses(search);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/houses/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        addToast("Delete failed", "error");
        return;
      }
      addToast("House deleted", "success");
      setDeleteTarget(null);
      fetchHouses(search);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (h: House) => {
    setEditing(h);
    setForm({
      name: h.name,
      groupId: h.groupId != null ? String(h.groupId) : "",
      r: String(h.r),
      g: String(h.g),
      b: String(h.b),
      isActive: h.isActive,
    });
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-amber-400">Houses</h1>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search by name or group ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100 placeholder-amber-400/40 min-w-[200px]"
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setForm({ name: "", groupId: "", r: "0", g: "0", b: "0", isActive: true });
            setFormOpen(true);
          }}
        >
          Add house
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-amber-800/50 bg-stone-800/50">
                <th className="p-3 font-semibold text-amber-300">Name</th>
                <th className="p-3 font-semibold text-amber-300">Group ID</th>
                <th className="p-3 font-semibold text-amber-300">Color</th>
                <th className="p-3 font-semibold text-amber-300">Drogons</th>
                <th className="p-3 font-semibold text-amber-300">Active</th>
                <th className="p-3 font-semibold text-amber-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {houses.map((h) => (
                <tr key={h.id} className="border-b border-amber-900/30">
                  <td className="p-3">{h.name}</td>
                  <td className="p-3">{h.groupId ?? "—"}</td>
                  <td className="p-3 flex items-center gap-2">
                    <span
                      className="inline-block w-6 h-6 rounded border border-amber-700/50"
                      style={{ backgroundColor: `rgb(${h.r},${h.g},${h.b})` }}
                    />
                    <span className="text-amber-200/70 text-sm">{h.r},{h.g},{h.b}</span>
                  </td>
                  <td className="p-3">{h.totalDrogons.toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      className={`text-sm font-medium ${h.isActive ? "text-amber-400" : "text-amber-200/50"}`}
                      onClick={() => toggleActive(h)}
                    >
                      {h.isActive ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button type="button" className="btn-secondary text-sm" onClick={() => openEdit(h)}>Edit</button>
                    <button type="button" className="btn text-sm text-red-300 hover:bg-red-900/30" onClick={() => setDeleteTarget(h)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {houses.length === 0 && !loading && (
            <p className="p-4 text-amber-200/60">No houses. Add one or refresh to seed defaults.</p>
          )}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" aria-hidden onClick={() => { setFormOpen(false); setEditing(null); }} />
          <div className="relative rounded-lg border border-amber-800/50 bg-stone-900 p-6 shadow-xl max-w-md w-full space-y-3">
            <h3 className="text-lg font-semibold text-amber-200">{editing ? "Edit house" : "Add house"}</h3>
            <div>
              <label className="block text-sm text-amber-200/80 mb-1">House name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100"
                placeholder="e.g. House Lannister"
              />
            </div>
            <div>
              <label className="block text-sm text-amber-200/80 mb-1">Roblox Group ID</label>
              <input
                type="number"
                min={0}
                value={form.groupId}
                onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
                className="w-full rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-amber-200/80 mb-1">R (0-255)</label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={form.r}
                  onChange={(e) => setForm((f) => ({ ...f, r: e.target.value }))}
                  className="w-full rounded border border-amber-700/50 bg-stone-800 px-2 py-1 text-amber-100"
                />
              </div>
              <div>
                <label className="block text-sm text-amber-200/80 mb-1">G (0-255)</label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={form.g}
                  onChange={(e) => setForm((f) => ({ ...f, g: e.target.value }))}
                  className="w-full rounded border border-amber-700/50 bg-stone-800 px-2 py-1 text-amber-100"
                />
              </div>
              <div>
                <label className="block text-sm text-amber-200/80 mb-1">B (0-255)</label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={form.b}
                  onChange={(e) => setForm((f) => ({ ...f, b: e.target.value }))}
                  className="w-full rounded border border-amber-700/50 bg-stone-800 px-2 py-1 text-amber-100"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-amber-700/50"
              />
              <label htmlFor="isActive" className="text-sm text-amber-200/80">Active (show on leaderboards)</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => { setFormOpen(false); setEditing(null); }}>Cancel</button>
              <button type="button" className="btn-primary" onClick={submitForm} disabled={formLoading}>{formLoading ? "…" : editing ? "Save" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete house"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This will remove the house and its balance from the leaderboard.` : ""}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
