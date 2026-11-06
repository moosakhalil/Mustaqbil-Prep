import { describe, expect, it } from "vitest";
import { computeStreak, daysBefore, pkDay, weekStrip } from "./streak";

describe("streak", () => {
  const set = (...d: string[]) => new Set(d);

  it("counts consecutive days back from today", () => {
    expect(computeStreak(set("2026-11-05", "2026-11-04", "2026-11-03", "2026-11-01"), "2026-11-05")).toBe(3);
  });

  it("keeps the streak alive until the end of today", () => {
    expect(computeStreak(set("2026-11-04", "2026-11-03"), "2026-11-05")).toBe(2);
    expect(computeStreak(set("2026-11-03"), "2026-11-05")).toBe(0);
    expect(computeStreak(set(), "2026-11-05")).toBe(0);
  });

  it("crosses month and year ends", () => {
    expect(daysBefore("2026-03-01", 1)).toBe("2026-02-28");
    expect(computeStreak(set("2027-01-01", "2026-12-31"), "2027-01-01")).toBe(2);
  });

  it("gives the week strip, oldest first", () => {
    const strip = weekStrip(set("2026-11-05", "2026-11-03"), "2026-11-05");
    expect(strip).toHaveLength(7);
    expect(strip[0].day).toBe("2026-10-30");
    expect(strip.filter((s) => s.done).map((s) => s.day)).toEqual(["2026-11-03", "2026-11-05"]);
  });

  it("uses the Pakistan day (UTC+5)", () => {
    expect(pkDay(new Date("2026-11-05T20:00:00Z"))).toBe("2026-11-06"); // 01:00 on the 6th in Pakistan
    expect(pkDay(new Date("2026-11-05T10:00:00Z"))).toBe("2026-11-05");
  });
});
