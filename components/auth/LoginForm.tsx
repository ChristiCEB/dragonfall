"use client";

import { useState } from "react";
import Link from "next/link";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { login: login.trim(), password }
        : { username: username.trim().toLowerCase(), email: email.trim().toLowerCase() || undefined, password };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Something went wrong." });
        return;
      }
      setMessage({ type: "success", text: "Success. Redirecting…" });
      window.location.href = data.redirect ?? "/profile";
    } catch {
      setMessage({ type: "error", text: "Request failed. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-6">
      <h1 className="text-xl font-bold text-amber-400">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "login" ? (
          <div>
            <label className="block text-sm font-medium text-amber-200/90 mb-1">Username or email</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Username or email"
              autoComplete="username"
              className="w-full rounded-md border border-amber-800/60 bg-stone-800/80 px-3 py-2 text-amber-100 placeholder-amber-600 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-amber-200/90 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (letters, numbers, _ -)"
                autoComplete="username"
                className="w-full rounded-md border border-amber-800/60 bg-stone-800/80 px-3 py-2 text-amber-100 placeholder-amber-600 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-200/90 mb-1">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="w-full rounded-md border border-amber-800/60 bg-stone-800/80 px-3 py-2 text-amber-100 placeholder-amber-600 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-amber-200/90 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "login" ? "Password" : "At least 8 characters"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-md border border-amber-800/60 bg-stone-800/80 px-3 py-2 text-amber-100 placeholder-amber-600 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
            required
            minLength={mode === "register" ? 8 : undefined}
          />
        </div>
        {message && (
          <p
            className={`text-sm rounded-md px-3 py-2 ${
              message.type === "success"
                ? "bg-amber-900/30 text-amber-200 border border-amber-700/40"
                : "bg-red-900/30 text-red-200 border border-red-800/40"
            }`}
          >
            {message.text}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-amber-200/70">
        {mode === "login" ? (
          <>
            No account?{" "}
            <button type="button" onClick={() => { setMode("register"); setMessage(null); }} className="link-gold">
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => { setMode("login"); setMessage(null); }} className="link-gold">
              Sign in
            </button>
          </>
        )}
      </p>
      <p className="text-sm text-amber-200/50 border-t border-amber-900/50 pt-4">
        <Link href="/login/roblox" className="link-gold">Sign in with Roblox</Link> (optional)
      </p>
      <p className="text-sm text-amber-200/50">
        <Link href="/" className="link-gold">← Back to home</Link>
      </p>
    </div>
  );
}
