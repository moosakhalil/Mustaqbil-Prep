import { shuffled, type Rng } from "@/lib/quiz/random";

// "Fresh questions first": a new quiz takes questions the person has not seen yet, brings back some they got wrong (revision),
// and only when the new ones run out does it reuse the ones seen longest ago.

/** The military past-paper and Computer Basics banks are the same for every course, so a question is "seen" under one shared key. */
export const seenKey = (id: string) => id.replace(/^mil-academic-(icto|lcc|navy-it|airforce-it)-/, "mil-academic-");

/** question key -> [times seen, day last seen (days since 1970)] */
export type SeenMap = Record<string, [number, number]>;

export type Fresh = {
  seen: SeenMap;
  /** Keys (see seenKey) of questions answered wrongly and not yet answered correctly since. */
  wrong: ReadonlySet<string>;
  /** Share of a quiz given to revision questions. Default 1 in 5. */
  reviseShare?: number;
};

export const REVISE_SHARE = 0.2;

/** Choose `n` questions of one pool: revision first (a few), then unseen, then the oldest seen. */
export function pickFresh<Q extends { id: string }>(questions: readonly Q[], n: number, fresh: Fresh, rng?: Rng): Q[] {
  if (n <= 0 || questions.length === 0) return [];
  const share = fresh.reviseShare ?? REVISE_SHARE;
  const revisable = questions.filter((q) => fresh.wrong.has(seenKey(q.id)));
  const reviseSlots = Math.min(Math.floor(n * share), revisable.length);
  const revise = shuffled(revisable, rng).slice(0, reviseSlots);
  const taken = new Set(revise.map((q) => q.id));

  const rest = questions.filter((q) => !taken.has(q.id));
  const unseen = shuffled(
    rest.filter((q) => !fresh.seen[seenKey(q.id)]),
    rng,
  );
  const need = n - revise.length;
  const picked = unseen.slice(0, need);
  if (picked.length < need) {
    // the new ones ran out: reuse the questions seen longest ago (ties in random order)
    const older = shuffled(
      rest.filter((q) => fresh.seen[seenKey(q.id)]),
      rng,
    ).sort((a, b) => fresh.seen[seenKey(a.id)][1] - fresh.seen[seenKey(b.id)][1]);
    picked.push(...older.slice(0, need - picked.length));
  }
  return [...revise, ...picked];
}
