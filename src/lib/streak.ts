// Days are YYYY-MM-DD in Pakistan time, so "today" matches the student's day.
const DAY_MS = 86_400_000;

export function pkDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** The day `n` days before the given day (n can be 0). Both are YYYY-MM-DD. */
export function daysBefore(day: string, n: number): string {
  return new Date(Date.parse(day + "T00:00:00Z") - n * DAY_MS).toISOString().slice(0, 10);
}

/** Consecutive days with a quiz, counting back from today (or from yesterday if nothing has been done yet today). */
export function computeStreak(days: ReadonlySet<string>, today: string): number {
  let cursor = days.has(today) ? today : daysBefore(today, 1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = daysBefore(cursor, 1);
  }
  return streak;
}

/** The last 7 days, oldest first, each with whether a quiz was done. */
export function weekStrip(days: ReadonlySet<string>, today: string): { day: string; done: boolean }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = daysBefore(today, 6 - i);
    return { day, done: days.has(day) };
  });
}
