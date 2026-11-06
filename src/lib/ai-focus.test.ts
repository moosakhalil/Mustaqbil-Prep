import { describe, expect, it } from "vitest";
import { coachSchema, daysLeft, focusPlanSchema } from "./ai-focus";
import { IMPORTANT_TOPICS } from "./important-topics";
import { manifest } from "./manifest";

describe("test date and AI plan shapes", () => {
  it("counts the days left, never negative, and ignores bad dates", () => {
    expect(daysLeft("2026-12-10", "2026-11-06")).toBe(34);
    expect(daysLeft("2026-11-06", "2026-11-06")).toBe(0);
    expect(daysLeft("2026-11-05", "2026-11-06")).toBeNull();
    expect(daysLeft(null, "2026-11-06")).toBeNull();
    expect(daysLeft("tomorrow", "2026-11-06")).toBeNull();
  });

  it("accepts a plan that only uses the allowed actions, and refuses an invented one", () => {
    const ok = { summary: "s", ai: true, daysLeft: null, items: [{ title: "t", why: "w", action: { kind: "military", course: "icto", section: "verbal", label: "ICTO · Verbal" } }] };
    expect(focusPlanSchema.safeParse(ok).success).toBe(true);
    const bad = { ...ok, items: [{ title: "t", why: "w", action: { kind: "delete-everything" } }] };
    expect(focusPlanSchema.safeParse(bad).success).toBe(false);
    expect(coachSchema.safeParse({ message: "m", tips: ["a", "b", "c"], next: "n" }).success).toBe(true);
  });

  it("only names degree courses that exist in the important topics", () => {
    const ids = new Set(manifest.courses.map((c) => c.id));
    for (const t of IMPORTANT_TOPICS) expect(ids.has(t.degreeCourse), t.degreeCourse).toBe(true);
  });
});
