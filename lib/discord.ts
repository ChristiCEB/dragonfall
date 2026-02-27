/**
 * SERVER-ONLY: Do not import from client components. DISCORD_WEBHOOK_URL is never exposed to the client.
 * If set, POSTs a JSON summary to the Discord webhook. Fire-and-forget; does not throw.
 */

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export type DiscordWebhookEvent =
  | { type: "bounty_claimed"; targetUserId: string; targetUsername: string; claimedBy: string; amount: number }
  | { type: "large_purchase"; userId: string; username: string; amount: number; reason?: string }
  | { type: "suspicious"; message: string; details?: Record<string, unknown> };

/**
 * If DISCORD_WEBHOOK_URL is set, POST an embed summary to Discord. Otherwise no-op.
 * Never exposes secrets; only sends event summary.
 */
export async function optionalDiscordWebhook(event: DiscordWebhookEvent): Promise<void> {
  if (!WEBHOOK_URL?.startsWith("https://discord.com/api/webhooks/")) return;

  let content: string;
  let color: number;

  switch (event.type) {
    case "bounty_claimed":
      content = `**Bounty claimed**\nTarget: ${event.targetUsername} (${event.targetUserId})\nClaimed by: ${event.claimedBy}\nAmount: ${event.amount} Drogons`;
      color = 0x00ff00;
      break;
    case "large_purchase":
      content = `**Large purchase**\nUser: ${event.username} (${event.userId})\nAmount: ${event.amount} Drogons${event.reason ? `\nReason: ${event.reason}` : ""}`;
      color = 0xffaa00;
      break;
    case "suspicious":
      content = `**Suspicious activity**\n${event.message}${event.details ? `\n\`\`\`json\n${JSON.stringify(event.details)}\n\`\`\`` : ""}`;
      color = 0xff0000;
      break;
    default:
      return;
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{ title: "Dragonfall", description: content, color }],
      }),
    });
  } catch {
    // Fire-and-forget
  }
}

/** @deprecated Use optionalDiscordWebhook */
export async function sendDiscordWebhook(event: DiscordWebhookEvent): Promise<void> {
  return optionalDiscordWebhook(event);
}
