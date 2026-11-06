import type { PoolCourse } from "./build";

const key = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Groups of question ids that have the same text in different banks (for example "What does HTML stand for?" in two military banks).
 * buildQuiz uses at most one question of each group, so a quiz never shows the same question twice. Picture questions have no text and are skipped.
 */
export function repeatedTextGroups(pools: readonly PoolCourse[]): string[][] {
  const byText = new Map<string, string[]>();
  for (const pool of pools) {
    for (const q of pool.questions) {
      const k = key(q.q);
      if (!k) continue;
      const ids = byText.get(k);
      if (ids) ids.push(q.id);
      else byText.set(k, [q.id]);
    }
  }
  return [...byText.values()].filter((ids) => ids.length > 1);
}
