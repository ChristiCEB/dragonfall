import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-amber-900/50 pt-6 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-amber-200/70">
        <p>© {currentYear} Dragonfall. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
          <Link href="/houses" className="hover:text-amber-400 transition-colors">Houses</Link>
          <Link href="/players" className="hover:text-amber-400 transition-colors">Players</Link>
          <Link href="/bounties" className="hover:text-amber-400 transition-colors">Bounties</Link>
        </nav>
      </div>
    </footer>
  );
}
