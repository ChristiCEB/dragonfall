"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { useRef, useEffect, useState } from "react";

export function Nav() {
  const pathname = usePathname();
  const { session, loading } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={
        pathname === href
          ? "text-amber-400 underline underline-offset-2"
          : "text-amber-100/90 hover:text-amber-400 transition-colors"
      }
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-amber-900/50 pb-4">
      <nav className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold tracking-wide text-amber-400">
            Dragonfall
          </Link>
          {link("/", "Home")}
          {link("/houses", "Houses")}
          {link("/players", "Players")}
          {link("/bounties", "Bounties")}
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-amber-200/60">...</span>
          ) : session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md border border-amber-800/50 bg-stone-800/50 px-3 py-2 text-amber-100 hover:bg-stone-800 transition-colors"
              >
                {session.avatarUrl ? (
                  <Image
                    src={session.avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-600 text-xs text-amber-200/80">
                    ?
                  </span>
                )}
                <span className="max-w-[120px] truncate">{session.displayName ?? session.username}</span>
                <svg className="h-4 w-4 text-amber-200/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-md border border-amber-800/50 bg-stone-900 shadow-xl py-1">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-amber-100 hover:bg-stone-800 hover:text-amber-400 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  {session.isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-amber-100 hover:bg-stone-800 hover:text-amber-400 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-amber-100 hover:bg-stone-800 hover:text-amber-400 transition-colors border-t border-amber-900/50"
                    onClick={async () => {
                      await fetch("/api/auth/signout", { method: "POST" });
                      window.location.href = "/";
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-primary">
              Sign in with Roblox
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
