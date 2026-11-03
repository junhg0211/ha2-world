import { getChatGPTUser } from "../../chatgpt-auth";
import { activeCharacterForSiteUser, ensureSitePlayer, recentEventsForCharacter } from "../../../lib/game-server";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const player = await ensureSitePlayer(user.userId, user.displayName);
  const character = await activeCharacterForSiteUser(user.userId);
  const events = character ? await recentEventsForCharacter(character.id) : [];
  return Response.json({ player, character, events });
}
