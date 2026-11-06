import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";
import { saveAttempt } from "@/lib/server/attempts";

// A finished quiz from the signed-in person. Sent again after being offline, so repeats are answered with 409 (already saved).
export async function POST(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;

  const body = await readJson(req);
  if (body === null) return fail("Missing or too large", 400);

  const result = await saveAttempt(who.userId, body);
  if (result === "invalid") return fail("That quiz could not be read", 400);
  if (result === "exists") return json({ ok: true, already: true }, 409);
  return json({ ok: true }, 201);
}
