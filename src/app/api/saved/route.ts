import { authed, fail, isResponse, json, readJson } from "@/lib/server/api";
import { deleteProgress, listProgress, saveMockProgress, saveQuizProgress } from "@/lib/server/saved-progress";

// Unfinished quizzes and the mock test in progress, kept in the account so they follow the student to any phone.

export async function GET(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  return json(await listProgress(who.userId));
}

// body: { kind: "quiz", record } or { kind: "mock", state }
export async function PUT(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const body = (await readJson(req, 400_000)) as { kind?: string; record?: unknown; state?: unknown } | null;
  if (!body || typeof body !== "object") return fail("Missing or too large", 400);

  if (body.kind === "mock") {
    return (await saveMockProgress(who.userId, body.state)) === "saved" ? json({ ok: true }) : fail("That mock test could not be read", 400);
  }
  if (body.kind === "quiz") {
    const result = await saveQuizProgress(who.userId, body.record);
    if (result === "invalid") return fail("That quiz could not be read", 400);
    if (result === "full") return fail("Too many saved quizzes", 409);
    return json({ ok: true });
  }
  return fail("Unknown kind", 400);
}

// ?id=<attempt id>, or ?id=mock:<mock id>
export async function DELETE(req: Request) {
  const who = await authed(req);
  if (isResponse(who)) return who;
  const id = new URL(req.url).searchParams.get("id");
  if (!id || id.length > 90) return fail("Missing id", 400);
  await deleteProgress(who.userId, id);
  return json({ ok: true });
}
