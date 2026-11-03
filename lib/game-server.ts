import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { characters, crops, players, worldEvents } from "../db/schema";
import { publishDiscordWebhook } from "./discord-webhook";

export type DiscordCharacter = typeof characters.$inferSelect;

export type GameAction =
  | { kind: "move"; delta: number }
  | { kind: "craft_food" }
  | { kind: "eat_food" }
  | { kind: "plant_raw" }
  | { kind: "harvest"; cropId: string }
  | { kind: "upgrade"; stat: "clothing" | "scissors" | "rock" | "paper" }
  | { kind: "say"; text: string };

const now = () => new Date();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export async function ensureSitePlayer(siteUserId: string, displayName: string) {
  const db = getDb();
  const [existing] = await db.select().from(players).where(eq(players.siteUserId, siteUserId)).limit(1);
  if (existing) return existing;
  const player = { id: id("player"), siteUserId, discordUserId: null, displayName, activeCharacterId: null, isAdmin: false, createdAt: now() };
  await db.insert(players).values(player);
  return player;
}

export async function activeCharacterForSiteUser(siteUserId: string) {
  const db = getDb();
  const [player] = await db.select().from(players).where(eq(players.siteUserId, siteUserId)).limit(1);
  if (!player?.activeCharacterId) return null;
  const [character] = await db.select().from(characters).where(and(eq(characters.id, player.activeCharacterId), eq(characters.alive, true))).limit(1);
  return character ?? null;
}

async function writeEvent(character: DiscordCharacter, type: string, detail: string, visibility: "private" | "nearby" | "public" = "private") {
  const db = getDb();
  await db.insert(worldEvents).values({ id: id("event"), characterId: character.id, type, detail, visibility, createdAt: now() });
  return publishDiscordWebhook({ characterName: character.name, event: type, detail });
}

function normalizedPosition(position: number) {
  return ((position % 360) + 360) % 360;
}

export async function performAction(siteUserId: string, action: GameAction) {
  const db = getDb();
  const character = await activeCharacterForSiteUser(siteUserId);
  if (!character) throw new Error("현재 조종 캐릭터가 없습니다.");
  const updatedAt = now();

  if (action.kind === "move") {
    if (!Number.isFinite(action.delta) || Math.abs(action.delta) > 6) throw new Error("한 번에 이동할 수 있는 거리는 6.0 이하입니다.");
    const position = normalizedPosition(character.position + action.delta);
    await db.update(characters).set({ position, updatedAt }).where(eq(characters.id, character.id));
    await writeEvent(character, "이동", `좌표 ${position.toFixed(1)}로 이동했습니다.`, "nearby");
    return { ...character, position };
  }

  if (action.kind === "craft_food") {
    if (character.raw < 1) throw new Error("식 제작에는 재 1개가 필요합니다.");
    const changes = { raw: character.raw - 1, food: character.food + 1, updatedAt };
    await db.update(characters).set(changes).where(eq(characters.id, character.id));
    await writeEvent(character, "식 제작", "재 1개를 소비해 식 1개를 만들었습니다.");
    return { ...character, ...changes };
  }

  if (action.kind === "eat_food") {
    if (character.food < 1) throw new Error("먹을 식이 없습니다.");
    if (character.hp >= character.hpMax) throw new Error("체력이 이미 가득 찼습니다.");
    const changes = { food: character.food - 1, hp: Math.min(character.hpMax, character.hp + 1), updatedAt };
    await db.update(characters).set(changes).where(eq(characters.id, character.id));
    await writeEvent(character, "식 섭취", "체력이 1 회복되었습니다.");
    return { ...character, ...changes };
  }

  if (action.kind === "plant_raw") {
    if (character.raw < 1) throw new Error("심을 재가 없습니다.");
    const plantedAt = now();
    await db.batch([
      db.update(characters).set({ raw: character.raw - 1, updatedAt }).where(eq(characters.id, character.id)),
      db.insert(crops).values({ id: id("crop"), plantedByCharacterId: character.id, position: character.position, plantedAt, harvestAt: new Date(plantedAt.getTime() + 24 * 60 * 60 * 1000), harvestedAt: null, harvestedByCharacterId: null, yieldAmount: null }),
    ]);
    await writeEvent(character, "재배", `좌표 ${character.position.toFixed(1)}에 재를 심었습니다. 24시간 뒤 누구나 수확할 수 있습니다.`, "nearby");
    return { ...character, raw: character.raw - 1, updatedAt };
  }

  if (action.kind === "harvest") {
    const [crop] = await db.select().from(crops).where(eq(crops.id, action.cropId)).limit(1);
    if (!crop || crop.harvestedAt) throw new Error("수확할 수 있는 재배가 없습니다.");
    if (crop.harvestAt.getTime() > Date.now()) throw new Error("아직 수확할 수 없습니다.");
    const yieldAmount = 2 + Math.floor(Math.random() * 3);
    await db.batch([
      db.update(crops).set({ harvestedAt: updatedAt, harvestedByCharacterId: character.id, yieldAmount }).where(eq(crops.id, crop.id)),
      db.update(characters).set({ raw: character.raw + yieldAmount, updatedAt }).where(eq(characters.id, character.id)),
    ]);
    await writeEvent(character, "수확", `재배한 재를 수확해 재 ${yieldAmount}개를 얻었습니다.`, "nearby");
    return { ...character, raw: character.raw + yieldAmount, updatedAt };
  }

  if (action.kind === "upgrade") {
    if (character.food < 20) throw new Error("스탯 강화에는 식 20개가 필요합니다.");
    const field = action.stat === "clothing" ? "clothing" : action.stat === "scissors" ? "muScissors" : action.stat === "rock" ? "muRock" : "muPaper";
    const changes = { food: character.food - 20, [field]: character[field] + 1, updatedAt };
    await db.update(characters).set(changes).where(eq(characters.id, character.id));
    await writeEvent(character, "스탯 강화", `식 20개를 소비해 ${action.stat} 수치를 1 올렸습니다.`);
    return { ...character, ...changes };
  }

  const text = action.text.trim().slice(0, 1800);
  if (!text) throw new Error("보낼 RP 메시지가 없습니다.");
  await writeEvent(character, "RP", text, "public");
  return character;
}

export async function activeCharacterForDiscord(discordUserId: string) {
  const db = getDb();
  const [player] = await db.select().from(players).where(eq(players.discordUserId, discordUserId)).limit(1);
  if (!player?.activeCharacterId) return null;
  const [character] = await db.select().from(characters).where(and(eq(characters.id, player.activeCharacterId), eq(characters.alive, true))).limit(1);
  return character ?? null;
}

export async function recentEventsForCharacter(characterId: string) {
  return getDb().select().from(worldEvents).where(eq(worldEvents.characterId, characterId)).orderBy(desc(worldEvents.createdAt)).limit(5);
}

export function characterSummary(character: DiscordCharacter) {
  return [
    `**${character.name}** · ${character.gender === "female" ? "여성" : "남성"}`,
    `체력 ${Math.round(character.hp)}/${Math.round(character.hpMax)} · 좌표 ${character.position.toFixed(1)}`,
    `재 ${character.raw} · 식 ${character.food} · 의 ${character.clothing} · 무 ${character.muScissors}/${character.muRock}/${character.muPaper}`,
  ].join("\n");
}
