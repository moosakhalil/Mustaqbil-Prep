import { describe, expect, it } from "vitest";
import { evaluateMock, passes, readiness } from "./military-rules";

describe("army initial test pass rule (50% in each part)", () => {
  it("exactly 50% passes", () => {
    expect(passes(50)).toBe(true);
    expect(passes(49.9)).toBe(false);
  });

  it("is eligible only when all three parts are taken and each is 50% or more", () => {
    const r = evaluateMock({ verbal: 50, nonverbal: 72, academic: 91 });
    expect(r.eligible).toBe(true);
    expect(r.failed).toEqual([]);
  });

  it("a high Academic score does not make up for a low Verbal score", () => {
    const r = evaluateMock({ verbal: 45, nonverbal: 60, academic: 95 });
    expect(r.eligible).toBe(false);
    expect(r.failed).toEqual(["verbal"]);
    expect(r.parts[0]).toEqual({ section: "verbal", percent: 45, pass: false, shortBy: 5 });
  });

  it("is not eligible when a part was not taken", () => {
    const r = evaluateMock({ verbal: 80, nonverbal: 80 });
    expect(r.eligible).toBe(false);
    expect(r.missing).toEqual(["academic"]);
    expect(r.parts[2]).toEqual({ section: "academic", percent: null, pass: null, shortBy: 0 });
  });

  it("names every failed part", () => {
    expect(evaluateMock({ verbal: 10, nonverbal: 20, academic: 30 }).failed).toEqual(["verbal", "nonverbal", "academic"]);
  });

  it("readiness averages the parts that have a score", () => {
    expect(readiness({})).toBeNull();
    expect(readiness({ verbal: 60, academic: 80 })).toBe(70);
  });
});
