import { NextRequest } from "next/server";
import { publishDiscordWebhook } from "../../../../lib/discord-webhook";

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

  const result = await publishDiscordWebhook({ characterName, event, detail });
  if (result.delivered) return Response.json({ delivered: true });
  if (result.reason === "not_configured") return Response.json({ delivered: false, message: "DISCORD_WEBHOOK_URL이 아직 설정되지 않았습니다." });
  return Response.json({ message: "Discord 웹훅 전송에 실패했습니다." }, { status: 502 });
}
