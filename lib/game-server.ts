import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { characters, players, worldEvents } from "../db/schema";

export type DiscordCharacter = typeof characters.$inferSelect;

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
