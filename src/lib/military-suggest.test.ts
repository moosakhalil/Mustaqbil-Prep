import { describe, expect, it } from "vitest";
import { manifest } from "./manifest";
import { DEGREE_WEIGHT, SUGGESTED, degreeWeight } from "./military-suggest";

describe("academic mix presets", () => {
  it("only name degree courses that exist", () => {
    const ids = new Set(manifest.courses.map((c) => c.id));
    for (const id of Object.keys(DEGREE_WEIGHT)) expect(ids.has(id), id).toBe(true);
    for (const s of Object.values(SUGGESTED)) for (const id of [...s.important, ...s.also]) expect(ids.has(id), id).toBe(true);
  });

  it("put Networks first, and unlisted courses get a small default", () => {
    expect(Math.max(...Object.values(DEGREE_WEIGHT))).toBe(DEGREE_WEIGHT.cn);
    expect(degreeWeight("toa")).toBeGreaterThan(0);
  });
});
