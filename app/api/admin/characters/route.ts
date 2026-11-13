import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getDb } from "../../../../db";
import { characters, players, worldEvents } from "../../../../db/schema";

const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

function isAdmin(request: Request) {
  const key = process.env.ADMIN_API_KEY;
  return Boolean(key) && request.headers.get("x-ha2-admin-key") === key;
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "운영자 인증이 필요합니다." }, { status: 403 });
  const operator = await getChatGPTUser();
  if (!operator) return Response.json({ error: "사이트 로그인이 필요합니다." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
  const gender = body?.gender === "male" || body?.gender === "female" ? body.gender : null;
  const targetSiteUserId = typeof body?.siteUserId === "string" ? body.siteUserId : operator.userId;
  const targetDiscordUserId = typeof body?.discordUserId === "string" ? body.discordUserId : null;
  if (!name || !gender) return Response.json({ error: "이름과 성별이 필요합니다." }, { status: 400 });

  const db = getDb();
  const [existing] = await db.select().from(players).where(eq(players.siteUserId, targetSiteUserId)).limit(1);
  const player = existing ?? {
    id: id("player"),
    siteUserId: targetSiteUserId,
    discordUserId: targetDiscordUserId,
    displayName: operator.displayName,
    activeCharacterId: null,
    isAdmin: false,
    createdAt: new Date(),
  };
  if (!existing) await db.insert(players).values(player);
  if (existing && targetDiscordUserId && !existing.discordUserId) {
    await db.update(players).set({ discordUserId: targetDiscordUserId }).where(eq(players.id, existing.id));
  }

  const now = new Date();
  const character = {
    id: id("character"), playerId: player.id, name, gender, alive: true,
    bornAt: now, naturalDeathAt: new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000),
    position: typeof body?.position === "number" ? body.position : 0,
    hp: 100, hpMax: 100, hungerAt: now,
    raw: typeof body?.raw === "number" ? Math.max(0, Math.floor(body.raw)) : 0,
    food: typeof body?.food === "number" ? Math.max(0, Math.floor(body.food)) : 0,
    clothing: typeof body?.clothing === "number" ? Math.max(0, Math.floor(body.clothing)) : 0,
    muScissors: 1, muRock: 1, muPaper: 1, createdAt: now, updatedAt: now,
  };
  await db.batch([
    db.insert(characters).values(character),
    db.update(players).set({ activeCharacterId: character.id }).where(eq(players.id, player.id)),
    db.insert(worldEvents).values({ id: id("event"), characterId: character.id, type: "운영자 배정", detail: `${name}의 조종권이 운영자에 의해 배정되었습니다.`, visibility: "private", createdAt: now }),
  ]);
  return Response.json({ character }, { status: 201 });
}
