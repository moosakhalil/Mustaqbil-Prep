import { describe, expect, it } from "vitest";
import { AI_DAILY_LIMIT, aiLevel, minutesToPkMidnight, untilReset } from "./ai-limit";

describe("AI requests left chip", () => {
  it("is normal at 4 or more, amber at 3 or fewer, red at 0", () => {
    expect(AI_DAILY_LIMIT).toBe(10);
    expect(aiLevel(10)).toBe("ok");
    expect(aiLevel(4)).toBe("ok");
    expect(aiLevel(3)).toBe("low");
    expect(aiLevel(1)).toBe("low");
    expect(aiLevel(0)).toBe("empty");
    expect(aiLevel(-1)).toBe("empty");
  });

  it("counts the time to midnight in Pakistan time (UTC+5)", () => {
    // 14:00 UTC is 19:00 in Pakistan: 5 hours to midnight
    expect(minutesToPkMidnight(new Date("2026-11-17T14:00:00Z"))).toBe(5 * 60);
    expect(untilReset(new Date("2026-11-17T14:00:00Z"))).toBe("5 h 0 min");
    // 18:41 UTC is 23:41 in Pakistan: 19 minutes
    expect(untilReset(new Date("2026-11-17T18:41:00Z"))).toBe("19 min");
    // exactly midnight in Pakistan starts a whole new day
    expect(minutesToPkMidnight(new Date("2026-11-17T19:00:00Z"))).toBe(24 * 60);
  });
});
