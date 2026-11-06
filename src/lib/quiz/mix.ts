export type MixEntry = {
  id: string;
  /** How many questions this course can give (after chapters are chosen and repeats removed). */
  capacity: number;
  /** Share of the quiz, as a percentage or any positive weight. Even split = the same weight for everyone. */
  weight: number;
};

/**
 * Decide how many questions each course contributes.
 * - Shares follow the weights; whole numbers come from the largest-remainder method, so the total is exact.
 * - A course with fewer questions than its share gives all it has, and the shortfall is shared among the others by their weights.
 * - If every course is used up, the result is smaller than `total` (the quiz simply has fewer questions).
 */
export function allocate(total: number, entries: readonly MixEntry[]): Record<string, number> {
  const result: Record<string, number> = Object.fromEntries(entries.map((e) => [e.id, 0]));
  let active = entries.filter((e) => e.capacity > 0 && e.weight > 0);
  let remaining = Math.max(0, Math.floor(total));

  while (remaining > 0 && active.length > 0) {
    const sumW = active.reduce((s, e) => s + e.weight, 0);
    const ideals = active.map((e) => (remaining * e.weight) / sumW);
    const shares = ideals.map(Math.floor);
    const left = remaining - shares.reduce((s, n) => s + n, 0);

    // hand the leftover questions to the biggest fractional parts (earlier entry wins a tie)
    const order = ideals.map((x, i) => ({ i, frac: x - shares[i] })).sort((a, b) => b.frac - a.frac || a.i - b.i);
    for (let k = 0; k < left; k++) shares[order[k].i]++;

    const full = active.filter((e, i) => shares[i] > e.capacity);
    if (full.length === 0) {
      active.forEach((e, i) => (result[e.id] = shares[i]));
      break;
    }
    // a course that cannot cover its share gives everything; the rest of the quiz is re-shared among the others
    for (const e of full) {
      result[e.id] = e.capacity;
      remaining -= e.capacity;
    }
    active = active.filter((e) => !full.includes(e));
  }
  return result;
}
