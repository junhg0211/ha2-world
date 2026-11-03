type WebhookActivity = { characterName: string; event: string; detail: string };

export async function publishDiscordWebhook(activity: WebhookActivity) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { delivered: false as const, reason: "not_configured" as const };
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: activity.characterName,
      allowed_mentions: { parse: [] },
      embeds: [{ title: activity.event, description: activity.detail.slice(0, 1800), color: 0xd6bd72, footer: { text: "Living Ring · 웹 활동" }, timestamp: new Date().toISOString() }],
    }),
  });
  return response.ok ? { delivered: true as const } : { delivered: false as const, reason: "delivery_failed" as const };
}
