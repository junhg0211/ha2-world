import { NextRequest } from "next/server";

const maxLength = 1800;

function clean(value: unknown, max = 100) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const characterName = clean(payload?.characterName, 80);
  const event = clean(payload?.event, 100);
  const detail = clean(payload?.detail, maxLength);
  if (!characterName || !event || !detail) {
    return Response.json({ message: "캐릭터 이름, 활동 종류, 상세 내용이 필요합니다." }, { status: 400 });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ delivered: false, message: "DISCORD_WEBHOOK_URL이 아직 설정되지 않았습니다." });
  }

  const discordResponse = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: characterName,
      allowed_mentions: { parse: [] },
      embeds: [{ title: event, description: detail, color: 0xd6bd72, footer: { text: "Living Ring · 웹 활동" }, timestamp: new Date().toISOString() }],
    }),
  });
  if (!discordResponse.ok) return Response.json({ message: "Discord 웹훅 전송에 실패했습니다." }, { status: 502 });
  return Response.json({ delivered: true });
}
