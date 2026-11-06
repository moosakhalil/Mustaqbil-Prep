import { describe, expect, it } from "vitest";
import type { CourseCap } from "./selection-logic";
import { DEFAULT_SETTINGS, evenPercents, makePlan, resolveSettings, sanitizeSettings, setPercent, type Settings } from "./settings-logic";

const cap = (id: string, capacity: number): CourseCap => ({ id, title: id, chapters: 1, capacity });
const os = cap("os", 126);
const dbms = cap("dbms", 168);
const s = (over: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...over });
const sum = (r: Record<string, number>) => Object.values(r).reduce((t, n) => t + n, 0);

describe("quiz settings", () => {
  it("splits 100% evenly with an exact total", () => {
    expect(evenPercents(["a", "b", "c"])).toEqual({ a: 34, b: 33, c: 33 });
    expect(evenPercents(["a", "b"])).toEqual({ a: 50, b: 50 });
    expect(evenPercents([])).toEqual({});
  });

  it("keeps the count between 1 and what the topics can give, and says when it lowered it", () => {
    expect(resolveSettings(s({ count: 500 }), [os, dbms])).toMatchObject({ max: 294, count: 294, clamped: true });
    expect(resolveSettings(s({ count: 30 }), [os, dbms])).toMatchObject({ count: 30, clamped: false });
    expect(resolveSettings(s({ count: 5 }), [])).toMatchObject({ max: 0, count: 0 });
  });

  it("gives each course its share: even, and custom 60/40 as in the design (30 questions = 18 + 12)", () => {
    expect(resolveSettings(s({ count: 30 }), [os, dbms]).counts).toEqual({ os: 15, dbms: 15 });
    const custom = s({ count: 30, mix: "custom", percents: { os: 60, dbms: 40 } });
    expect(resolveSettings(custom, [os, dbms]).counts).toEqual({ os: 18, dbms: 12 });
  });

  it("with two courses the other one takes the rest", () => {
    expect(setPercent({ os: 50, dbms: 50 }, ["os", "dbms"], "os", 60)).toEqual({ os: 60, dbms: 40 });
    expect(setPercent({}, ["os", "dbms"], "dbms", 130)).toEqual({ dbms: 100, os: 0 });
  });

  it("with three courses the total must be 100 before the quiz can start", () => {
    const caps = [cap("a", 100), cap("b", 100), cap("c", 100)];
    const off = s({ mix: "custom", percents: setPercent(evenPercents(["a", "b", "c"]), ["a", "b", "c"], "a", 50) });
    const r = resolveSettings(off, caps);
    expect(r.totalPercent).toBe(116);
    expect(r.mixOk).toBe(false);
    expect(makePlan({ a: [1], b: [1], c: [1] }, off, caps, "p1")).toBeNull();
  });

  it("a short course gives all it has and the rest goes to the others", () => {
    const r = resolveSettings(s({ count: 40 }), [cap("small", 5), cap("big", 100)]);
    expect(r.counts).toEqual({ small: 5, big: 35 });
    expect(sum(r.counts)).toBe(40);
  });

  it("exam time: one minute per question, or a custom number of minutes", () => {
    expect(resolveSettings(s({ mode: "exam", count: 30 }), [os]).minutes).toBe(30);
    expect(resolveSettings(s({ mode: "exam", count: 30, timeMode: "custom", minutes: 45 }), [os]).minutes).toBe(45);
    expect(resolveSettings(s({ mode: "practice" }), [os]).minutes).toBe(0);
  });

  it("builds the plan the quiz screen needs", () => {
    const plan = makePlan({ os: [1, 2], dbms: [3], gone: [9] }, s({ count: 20, mode: "exam" }), [os, dbms], "p1");
    expect(plan).toEqual({ id: "p1", selection: { os: [1, 2], dbms: [3] }, count: 20, mode: "exam", weights: { os: 50, dbms: 50 }, minutes: 20 });
  });

  it("repairs damaged saved settings", () => {
    expect(sanitizeSettings("junk")).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ count: "x", mode: "other", mix: 3, percents: { a: "z", b: 5 }, minutes: 99999 })).toEqual({
      ...DEFAULT_SETTINGS, percents: { b: 5 }, minutes: 600,
    });
  });
});
