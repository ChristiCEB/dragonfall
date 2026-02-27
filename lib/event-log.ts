import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * SERVER-ONLY: Do not import from client components. Writes to database.
 * Write an event to EventLog. Never expose sensitive data in message/payload to client.
 */
export async function logEvent(
  type: string,
  message?: string | null,
  payload?: Record<string, unknown> | null,
  userId?: string | null
): Promise<void> {
  await prisma.eventLog.create({
    data: {
      type,
      message: message ?? null,
      payload: (payload ?? undefined) as Prisma.InputJsonValue | undefined,
      userId: userId ?? undefined,
    },
  });
}
