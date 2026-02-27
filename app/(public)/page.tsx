import Link from "next/link";
import { PlayerCount } from "@/components/PlayerCount";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-wide text-amber-400 md:text-6xl">
          Dragonfall Realm Economy
        </h1>
        <p className="text-lg text-amber-200/80 max-w-xl mx-auto">
          Track Drogons, Houses, and Bounties across the realm.
        </p>
        <div className="flex justify-center">
          <PlayerCount />
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/houses"
          className="card block text-center hover:border-amber-600/60 hover:shadow-amber-900/20 transition-all"
        >
          <h2 className="text-xl font-semibold text-amber-300">Houses</h2>
          <p className="mt-2 text-sm text-amber-200/70">
            Leaderboard by activity and Drogons.
          </p>
          <span className="mt-3 inline-block text-amber-400 text-sm font-medium">View leaderboard →</span>
        </Link>
        <Link
          href="/players"
          className="card block text-center hover:border-amber-600/60 hover:shadow-amber-900/20 transition-all"
        >
          <h2 className="text-xl font-semibold text-amber-300">Players</h2>
          <p className="mt-2 text-sm text-amber-200/70">
            Top players ranked by Drogons.
          </p>
          <span className="mt-3 inline-block text-amber-400 text-sm font-medium">View leaderboard →</span>
        </Link>
        <Link
          href="/bounties"
          className="card block text-center hover:border-amber-600/60 hover:shadow-amber-900/20 transition-all sm:col-span-2 lg:col-span-1"
        >
          <h2 className="text-xl font-semibold text-amber-300">Bounties</h2>
          <p className="mt-2 text-sm text-amber-200/70">
            Active bounties — claim in-game.
          </p>
          <span className="mt-3 inline-block text-amber-400 text-sm font-medium">View bounties →</span>
        </Link>
      </section>
    </div>
  );
}
