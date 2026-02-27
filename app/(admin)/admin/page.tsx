import { prisma } from "@/lib/db";
import { bigIntToNumber } from "@/lib/bigint";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [totalUsers, balanceAgg, activeBounties, latestSnapshot] = await Promise.all([
    prisma.user.count(),
    prisma.playerBalance.aggregate({ _sum: { drogonsBalance: true } }),
    prisma.bounty.count({ where: { status: "ACTIVE" } }),
    prisma.playerCountSnapshot.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);
  const totalDrogons = balanceAgg._sum.drogonsBalance ?? BigInt(0);
  const latestPlayerCount = latestSnapshot?.playerCount ?? 0;
  const playerCountAt = latestSnapshot?.createdAt;

  const cards = [
    { title: "Total users", value: totalUsers.toLocaleString(), href: "/admin/users" },
    { title: "Total drogons in economy", value: bigIntToNumber(totalDrogons).toLocaleString(), href: "/admin/users" },
    { title: "Active bounties", value: activeBounties.toString(), href: "/admin/bounties" },
    { title: "Latest player count", value: latestPlayerCount.toString(), sub: playerCountAt ? new Date(playerCountAt).toLocaleString() : null, href: "/" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-400">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.title} href={c.href} className="card block hover:border-amber-700/60 transition-colors">
            <h2 className="text-sm font-medium text-amber-200/80">{c.title}</h2>
            <p className="mt-1 text-2xl font-bold text-amber-400">{c.value}</p>
            {c.sub && <p className="mt-0.5 text-xs text-amber-200/50">{c.sub}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
