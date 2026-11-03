import { getChatGPTUser } from "../../../chatgpt-auth";
import { GameAction, performAction } from "../../../../lib/game-server";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const action = await request.json().catch(() => null) as GameAction | null;
  if (!action?.kind) return Response.json({ error: "유효한 행동이 필요합니다." }, { status: 400 });
  try {
    const character = await performAction(user.userId, action);
    return Response.json({ character });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "행동을 처리하지 못했습니다." }, { status: 400 });
  }
}
