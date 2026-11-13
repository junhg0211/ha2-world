import { settleWorld } from "../../../../lib/game-server";

/** Called by a trusted scheduler. It has no player identity and only advances global time. */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-ha2-cron-secret") !== secret) {
    return Response.json({ error: "스케줄러 인증이 필요합니다." }, { status: 403 });
  }
  await settleWorld();
  return Response.json({ settledAt: new Date().toISOString() });
}
