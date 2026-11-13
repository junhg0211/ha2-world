import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { gameSettings } from "../../../../db/schema";

function allowed(request: Request) { const key = process.env.ADMIN_API_KEY; return Boolean(key) && request.headers.get("x-ha2-admin-key") === key; }

export async function GET(request: Request) {
  if (!allowed(request)) return Response.json({ error: "운영자 인증이 필요합니다." }, { status: 403 });
  return Response.json({ settings: await getDb().select().from(gameSettings) });
}
export async function POST(request: Request) {
  if (!allowed(request)) return Response.json({ error: "운영자 인증이 필요합니다." }, { status: 403 });
  const body = await request.json().catch(() => null) as { key?: string; value?: number } | null;
  if (!body?.key || !Number.isFinite(body.value)) return Response.json({ error: "키와 숫자 값이 필요합니다." }, { status: 400 });
  const row = { key: body.key.slice(0, 64), value: String(body.value), updatedAt: new Date() };
  await getDb().insert(gameSettings).values(row).onConflictDoUpdate({ target: gameSettings.key, set: { value: row.value, updatedAt: row.updatedAt } });
  return Response.json({ setting: row });
}
