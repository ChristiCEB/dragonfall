import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PlayerProfile } from "@/components/PlayerProfile";
import { bigIntToNumber } from "@/lib/bigint";

type Props = { params: Promise<{ robloxUserId: string }> };

export default async function PlayerPage({ params }: Props) {
  const { robloxUserId } = await params;
  const [user, session] = await Promise.all([
    prisma.user.findUnique({
      where: { robloxUserId },
      include: { balance: true },
    }),
    getSession(),
  ]);
  if (!user) notFound();
  const events = await prisma.eventLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const player = {
    id: user.id,
    robloxUserId: user.robloxUserId,
    username: user.robloxUsername,
    displayName: user.robloxUsername,
    avatarUrl: user.avatarUrl,
    drogons: user.balance ? bigIntToNumber(user.balance.drogonsBalance) : 0,
    houseName: null as string | null,
    createdAt: user.createdAt.toISOString(),
  };
  const eventsForClient = events.map((e) => ({
    id: e.id,
    type: e.type,
    message: e.message,
    payload: e.payload,
    createdAt: e.createdAt.toISOString(),
  }));
  return (
    <PlayerProfile
      player={player}
      events={eventsForClient}
      isOwnProfile={session?.robloxUserId === robloxUserId}
    />
  );
}
