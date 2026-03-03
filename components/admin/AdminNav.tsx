"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/houses", label: "Houses" },
  { href: "/admin/bounties", label: "Bounties" },
  { href: "/admin/logs", label: "Logs" },
] as const;

function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const base = "block rounded-md px-3 py-2 text-sm font-medium transition-colors";
  const active = "bg-amber-700/40 text-amber-200";
  const inactive = "text-amber-200/80 hover:bg-amber-800/30 hover:text-amber-200";

  return (
    <>
      {links.map(({ href, label }) => {
        const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`${base} ${isActive ? active : inactive}`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminNav({ mobile }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);

  if (mobile) {
    return (
      <div className="flex items-center gap-2 w-full">
        <Link href="/admin" className="text-lg font-bold text-amber-400 mr-auto">
          Admin
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden rounded p-2 text-amber-200/80 hover:bg-amber-800/30"
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {open && (
          <nav className="absolute top-full left-0 right-0 mt-0 border-b border-amber-800/50 bg-stone-900/98 p-2 flex flex-col gap-0.5 lg:hidden">
            <NavLinks mobile />
          </nav>
        )}
      </div>
    );
  }

  return <NavLinks />;
}
