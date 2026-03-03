"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/ToastContext";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { TableSkeleton } from "@/components/admin/LoadingSkeleton";

type Group = {
  id: number;
  groupName: string;
  groupId: number;
  r: number;
  g: number;
  b: number;
  minRank: number | null;
};

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ groupName: "", groupId: "", r: "0", g: "0", b: "0", minRank: "" });
  const { addToast } = useToast();

  const fetchGroups = (q?: string) => {
    setLoading(true);
    const url = q != null && q.trim() ? `/api/admin/groups?search=${encodeURIComponent(q.trim())}` : "/api/admin/groups";
    fetch(url)
      .then((r) => r.json())
      .then(setGroups)
      .catch(() => addToast("Failed to load groups", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups(search);
  }, [search]);

  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const validForm = () => {
    const name = form.groupName.trim();
    const gid = parseInt(form.groupId, 10);
    const r = clamp(parseInt(form.r, 10) || 0);
    const g = clamp(parseInt(form.g, 10) || 0);
    const b = clamp(parseInt(form.b, 10) || 0);
    const minRank = form.minRank === "" ? null : Math.max(0, Math.min(254, parseInt(form.minRank, 10) || 0));
    return name && !Number.isNaN(gid) && gid >= 0;
  };

  const submitForm = async () => {
    if (!validForm()) {
      addToast("Fill name and group ID; RGB 0-255", "error");
      return;
    }
    setFormLoading(true);
    const r = clamp(parseInt(form.r, 10) || 0);
    const g = clamp(parseInt(form.g, 10) || 0);
    const b = clamp(parseInt(form.b, 10) || 0);
    const minRank = form.minRank === "" ? undefined : Math.max(0, Math.min(254, parseInt(form.minRank, 10) || 0));
    const body = {
      groupName: form.groupName.trim(),
      groupId: parseInt(form.groupId, 10),
      r,
      g,
      b,
      minRank: minRank ?? null,
    };
    try {
      if (editing) {
        const res = await fetch(`/api/admin/groups/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          addToast(data.error || "Update failed", "error");
          return;
        }
        addToast("Group updated", "success");
      } else {
        const res = await fetch("/api/admin/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          addToast(data.error || "Create failed", "error");
          return;
        }
        addToast("Group created", "success");
      }
      setFormOpen(false);
      setEditing(null);
      setForm({ groupName: "", groupId: "", r: "0", g: "0", b: "0", minRank: "" });
      fetchGroups(search);
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        addToast("Delete failed", "error");
        return;
      }
      addToast("Group deleted", "success");
      setDeleteTarget(null);
      fetchGroups(search);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (g: Group) => {
    setEditing(g);
    setForm({
      groupName: g.groupName,
      groupId: String(g.groupId),
      r: String(g.r),
      g: String(g.g),
      b: String(g.b),
      minRank: g.minRank != null ? String(g.minRank) : "",
    });
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-amber-400">Nametag Groups</h1>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search by name or group ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100 placeholder-amber-400/40 min-w-[200px]"
        />
        <button type="button" className="btn-primary" onClick={() => { setEditing(null); setForm({ groupName: "", groupId: "", r: "0", g: "0", b: "0", minRank: "" }); setFormOpen(true); }}>
          Add group
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-amber-800/50 bg-stone-800/50">
                <th className="p-3 font-semibold text-amber-300">Name</th>
                <th className="p-3 font-semibold text-amber-300">Group ID</th>
                <th className="p-3 font-semibold text-amber-300">Color</th>
                <th className="p-3 font-semibold text-amber-300">Min rank</th>
                <th className="p-3 font-semibold text-amber-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-b border-amber-900/30">
                  <td className="p-3">{g.groupName}</td>
                  <td className="p-3">{g.groupId}</td>
                  <td className="p-3 flex items-center gap-2">
                    <span
                      className="inline-block w-6 h-6 rounded border border-amber-700/50"
                      style={{ backgroundColor: `rgb(${g.r},${g.g},${g.b})` }}
                    />
                    <span className="text-amber-200/70 text-sm">{g.r},{g.g},{g.b}</span>
                  </td>
                  <td className="p-3">{g.minRank ?? "—"}</td>
                  <td className="p-3 flex gap-2">
                    <button type="button" className="btn-secondary text-sm" onClick={() => openEdit(g)}>Edit</button>
                    <button type="button" className="btn text-sm text-red-300 hover:bg-red-900/30" onClick={() => setDeleteTarget(g)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {groups.length === 0 && !loading && (
            <p className="p-4 text-amber-200/60">No groups. Add one to show on Roblox nametags.</p>
          )}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" aria-hidden onClick={() => { setFormOpen(false); setEditing(null); }} />
          <div className="relative rounded-lg border border-amber-800/50 bg-stone-900 p-6 shadow-xl max-w-md w-full space-y-3">
            <h3 className="text-lg font-semibold text-amber-200">{editing ? "Edit group" : "Add group"}</h3>
            <div>
              <label className="block text-sm text-amber-200/80 mb-1">Group name</label>
              <input
                type="text"
                value={form.groupName}
                onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
                className="w-full rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100"
                placeholder="e.g. TARGARYEN REALM"
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
            <div>
              <label className="block text-sm text-amber-200/80 mb-1">Min rank (optional, 0-254)</label>
              <input
                type="number"
                min={0}
                max={254}
                value={form.minRank}
                onChange={(e) => setForm((f) => ({ ...f, minRank: e.target.value }))}
                className="w-full rounded border border-amber-700/50 bg-stone-800 px-3 py-2 text-amber-100"
                placeholder="Leave empty for any rank"
              />
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
        title="Delete group"
        message={deleteTarget ? `Delete "${deleteTarget.groupName}" (ID ${deleteTarget.groupId})? This will remove it from Roblox nametag options.` : ""}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
