import { prisma } from "@/lib/db";
import { bigIntToNumber } from "@/lib/bigint";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    totalBalances,
    balanceAgg,
    activeBounties,
    latestSnapshot,
    recentEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.playerBalance.count(),
    prisma.playerBalance.aggregate({ _sum: { drogonsBalance: true } }),
    prisma.bounty.count({ where: { status: "ACTIVE" } }),
    prisma.playerCountSnapshot.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.eventLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    }),
  ]);
  const totalDrogons = balanceAgg._sum.drogonsBalance ?? BigInt(0);
  const latestPlayerCount = latestSnapshot?.playerCount ?? 0;
  const playerCountAt = latestSnapshot?.createdAt;

  const cards = [
    { title: "Total users", value: totalUsers.toLocaleString(), href: "/admin/users" },
    { title: "Total balance records", value: totalBalances.toLocaleString(), href: "/admin/users" },
    { title: "Total drogons in economy", value: bigIntToNumber(totalDrogons).toLocaleString(), href: "/admin/users" },
    { title: "Active bounties", value: activeBounties.toString(), href: "/admin/bounties" },
    { title: "Latest player count", value: latestPlayerCount.toString(), sub: playerCountAt ? new Date(playerCountAt).toLocaleString() : null, href: "/" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-400">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.title} href={c.href} className="card block hover:border-amber-700/60 transition-colors">
            <h2 className="text-sm font-medium text-amber-200/80">{c.title}</h2>
            <p className="mt-1 text-2xl font-bold text-amber-400">{c.value}</p>
            {c.sub && <p className="mt-0.5 text-xs text-amber-200/50">{c.sub}</p>}
          </Link>
        ))}
      </div>
      <div className="card">
        <h2 className="text-sm font-medium text-amber-200/80 mb-3">Last 10 events</h2>
        {recentEvents.length === 0 ? (
          <p className="text-amber-200/60 text-sm">No events yet.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {recentEvents.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-2 text-amber-200/90">
                <span className="text-amber-400/80">{e.type}</span>
                {e.message && <span>{e.message}</span>}
                <span className="text-amber-200/50">
                  {e.user?.username ?? "—"} · {new Date(e.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/logs" className="mt-3 inline-block text-sm text-amber-400 hover:text-amber-300">
          View all logs →
        </Link>
      </div>
    </div>
  );
}
