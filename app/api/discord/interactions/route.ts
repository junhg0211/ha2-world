import { activeCharacterForDiscord, characterSummary, recentEventsForCharacter } from "../../../../lib/game-server";

const PING = 1;
const APPLICATION_COMMAND = 2;
const CHANNEL_MESSAGE = 4;

function hexToBytes(value: string) {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)));
}

async function validSignature(request: Request, rawBody: string) {
  const key = process.env.DISCORD_PUBLIC_KEY;
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const publicKey = key && hexToBytes(key);
  const signatureBytes = signature && hexToBytes(signature);
  if (!publicKey || !signatureBytes || !timestamp) return false;
  const cryptoKey = await crypto.subtle.importKey("raw", publicKey, { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify({ name: "Ed25519" }, cryptoKey, signatureBytes, new TextEncoder().encode(timestamp + rawBody));
}

function response(content: string) {
  return Response.json({ type: CHANNEL_MESSAGE, data: { content, flags: 64, allowed_mentions: { parse: [] } } });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!(await validSignature(request, rawBody))) return new Response("invalid request signature", { status: 401 });
  const payload = JSON.parse(rawBody) as { type: number; data?: { name?: string }; member?: { user?: { id?: string } }; user?: { id?: string } };
  if (payload.type === PING) return Response.json({ type: PING });
  if (payload.type !== APPLICATION_COMMAND) return new Response("unsupported interaction", { status: 400 });

  const discordUserId = payload.member?.user?.id ?? payload.user?.id;
  if (!discordUserId) return response("Discord 사용자를 확인하지 못했습니다.");
  const character = await activeCharacterForDiscord(discordUserId);
  if (!character) return response("현재 조종 캐릭터가 없습니다. 운영자가 조종권을 배정하거나 출산 대기열을 이용해야 합니다.");

  if (payload.data?.name === "life") return response(characterSummary(character));
  if (payload.data?.name === "world") {
    const events = await recentEventsForCharacter(character.id);
    const body = events.length ? events.map((event) => `• ${event.detail}`).join("\n") : "아직 확인할 사건이 없습니다.";
    return response(`**${character.name}의 최근 사건**\n${body}`);
  }
  return response("지원하지 않는 명령입니다. `/life`, `/world`를 사용할 수 있습니다.");
}
