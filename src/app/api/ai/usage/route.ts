import { authed, isResponse, json } from "@/lib/server/api";
import { AI_DAILY_LIMIT, aiLeftToday } from "@/lib/server/ai-usage";

// How many AI requests the signed-in person has left today. Read once by the app and shown as the "left" chip on every AI button.
export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  return json({ left: await aiLeftToday(who.userId), limit: AI_DAILY_LIMIT });
}
