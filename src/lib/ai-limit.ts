// The daily AI limit and the small pure helpers behind the "AI requests left" chip. Safe to use in the browser and on the server.

/** AI requests per person per day (study suggestion, plan, coach and new explanations together; saved answers are free). */
export const AI_DAILY_LIMIT = 10;

/** Below this many left the chip turns amber. */
export const AI_LOW_AT = 3;

export type AiLevel = "ok" | "low" | "empty";

export const aiLevel = (left: number): AiLevel => (left <= 0 ? "empty" : left <= AI_LOW_AT ? "low" : "ok");

/** Whole minutes from now until the next midnight in Pakistan time (when the daily count resets). Always 1 or more. */
export function minutesToPkMidnight(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return Math.max(1, 24 * 60 - (hour * 60 + minute));
}

/** "5 h 20 min", or "40 min" when under an hour. */
export function untilReset(now: Date): string {
  const mins = minutesToPkMidnight(now);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
