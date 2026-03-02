"use client";

import { useState } from "react";
import Link from "next/link";

export function LinkRobloxForm() {
  const [input, setInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [robloxUserId, setRobloxUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState<"request" | "verify" | "regenerate" | null>(null);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) {
      setMessage({ type: "error", text: "Enter your Roblox profile URL or user ID." });
      return;
    }
    setMessage(null);
    setLoading("request");
    try {
      const res = await fetch("/api/link/roblox/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robloxProfileUrlOrUserId: input.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to create link request." });
        return;
      }
      setCode(data.code);
      setRobloxUserId(data.robloxUserId ?? null);
      setMessage({ type: "success", text: "Code created. Put it in your Roblox bio and click Verify." });
    } catch {
      setMessage({ type: "error", text: "Request failed. Try again." });
    } finally {
      setLoading(null);
    }
  }

  async function handleVerify() {
    setMessage(null);
    setLoading("verify");
    try {
      const res = await fetch("/api/link/roblox/verify", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Verification failed." });
        return;
      }
      setMessage({ type: "success", text: `Roblox account linked: ${data.robloxUsername ?? data.robloxUserId}.` });
      setCode(null);
      setRobloxUserId(null);
    } catch {
      setMessage({ type: "error", text: "Verification failed. Try again." });
    } finally {
      setLoading(null);
    }
  }

  async function handleRegenerate() {
    if (!input.trim()) {
      setMessage({ type: "error", text: "Enter your Roblox profile URL or user ID first." });
      return;
    }
    setMessage(null);
    setLoading("regenerate");
    try {
      const res = await fetch("/api/link/roblox/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robloxProfileUrlOrUserId: input.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to regenerate code." });
        return;
      }
      setCode(data.code);
      setRobloxUserId(data.robloxUserId ?? null);
      setMessage({ type: "success", text: "New code created. Previous code is invalid." });
    } catch {
      setMessage({ type: "error", text: "Failed to regenerate. Try again." });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card max-w-xl space-y-6">
      <h1 className="text-xl font-bold text-amber-400">Link Roblox account</h1>
      <p className="text-amber-200/80 text-sm">
        Verify ownership by placing a one-time code in your Roblox profile &quot;About&quot; section.
      </p>

      <form onSubmit={handleRequest} className="space-y-3">
        <label className="block text-sm font-medium text-amber-200/90">
          Roblox profile URL or user ID
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://www.roblox.com/users/12345/profile or 12345"
          className="w-full rounded-md border border-amber-800/60 bg-stone-800/80 px-3 py-2 text-amber-100 placeholder-amber-600 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!!loading}
          className="btn-primary"
        >
          {loading === "request" ? "Creating…" : "Generate code"}
        </button>
      </form>

      {message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-amber-900/30 text-amber-200 border border-amber-700/40"
              : "bg-red-900/30 text-red-200 border border-red-800/40"
          }`}
        >
          {message.text}
        </p>
      )}

      {code && (
        <div className="space-y-3 rounded-md border border-amber-800/50 bg-stone-900/60 p-4">
          <p className="text-sm font-medium text-amber-300">Copy this code into your Roblox bio (About). Save it, then click Verify.</p>
          <p className="font-mono text-lg font-bold tracking-wider text-amber-400 select-all">{code}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleVerify}
              disabled={!!loading}
              className="btn-primary"
            >
              {loading === "verify" ? "Checking…" : "Verify now"}
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={!!loading}
              className="btn-secondary"
            >
              {loading === "regenerate" ? "Regenerating…" : "Regenerate code"}
            </button>
          </div>
        </div>
      )}

      <p className="text-sm text-amber-200/50">
        <Link href="/profile" className="link-gold">← Back to profile</Link>
      </p>
    </div>
  );
}
