import { describe, expect, it } from "vitest";
import { MILITARY_COURSES, MILITARY_GROUPS } from "./military";
import { academicBanks, intelligenceBank, militaryManifest, subjectCount } from "./military-data";
import { academicSources, defaultSourceId, isMostRepeatedSet } from "./military-academic";
import { defaultPattern, isPatternSet, NO_PATTERN } from "./military-pattern";

describe("Military screen order", () => {
  it("lists Army as ICTO, PMA LC, LCC and then Navy IT, PAF IT", () => {
    expect(MILITARY_COURSES.map((c) => c.id)).toEqual(["icto", "pma-lc", "lcc", "navy-it", "airforce-it"]);
    expect(MILITARY_GROUPS.map((g) => g.title)).toEqual(["Army", "Navy & PAF"]);
    expect(MILITARY_COURSES.filter((c) => c.group === "army").map((c) => c.id)).toEqual(["icto", "pma-lc", "lcc"]);
    expect(MILITARY_COURSES.filter((c) => c.group === "ssc").map((c) => c.id)).toEqual(["navy-it", "airforce-it"]);
  });
});

describe("PMA LC question banks", () => {
  it("has its own Verbal bank, while other courses keep the shared one", () => {
    const own = intelligenceBank("verbal", "pma-lc");
    const shared = intelligenceBank("verbal", "icto");
    expect(own?.course).toBe("pma-lc");
    expect(shared?.course).toBeUndefined();
    expect(intelligenceBank("verbal")?.id).toBe(shared?.id);
    expect(own?.id).not.toBe(shared?.id);
  });

  it("shares the Non-verbal picture bank", () => {
    expect(intelligenceBank("nonverbal", "pma-lc")?.id).toBe(intelligenceBank("nonverbal", "icto")?.id);
  });

  it("offers only its own past tests for Academic: no past papers, important subjects or syllabus", () => {
    const sources = academicSources("pma-lc", []);
    expect(sources.map((s) => s.id)).toEqual(["pma"]);
    expect(defaultSourceId(sources)).toBe("pma");
    const banks = academicBanks("pma-lc");
    expect(banks.length).toBeGreaterThan(0);
    expect(new Set(sources[0].subjects.map((s) => s.militaryFile))).toEqual(new Set(banks.map((b) => b.id)));
    for (const s of sources[0].subjects) {
      expect(s.source).toBe("military");
      expect(subjectCount(s)).toBeGreaterThan(0);
    }
  });

  it("ignores any subjects the owner adds for PMA LC in Military setup", () => {
    const owner = [{ id: "x", course: "pma-lc", title: "Networks", position: 0, source: "degree" as const, degreeCourse: "cn", units: null, militaryFile: null }];
    expect(academicSources("pma-lc", owner).map((s) => s.id)).toEqual(["pma"]);
  });

  it("gives no other course the PMA source", () => {
    for (const id of ["icto", "lcc", "navy-it", "airforce-it"]) expect(academicSources(id, []).some((s) => s.id === "pma"), id).toBe(false);
  });

  it("recognises the Most repeated set by name", () => {
    expect(isMostRepeatedSet({ militaryFile: "academic-pma-lc-most-repeated" })).toBe(true);
    expect(isMostRepeatedSet({ militaryFile: "academic-pma-lc-islamiat" })).toBe(false);
  });

  it("keeps question ids short enough to be saved with a result (60 characters)", () => {
    for (const b of militaryManifest.banks.filter((x) => x.course === "pma-lc")) {
      expect(`${b.code}-${b.total}`.length, b.id).toBeLessThanOrEqual(60);
    }
  });
});

describe("test pattern", () => {
  it("counts as not set when every number is 0", () => {
    expect(isPatternSet(NO_PATTERN)).toBe(false);
    expect(isPatternSet({ ...NO_PATTERN, verbalCount: 84 })).toBe(true);
  });

  it("starts PMA LC on its built-in pattern, and leaves the other courses unset", () => {
    expect(defaultPattern("pma-lc")).toEqual({ verbalCount: 84, verbalMinutes: 30, nonverbalCount: 64, nonverbalMinutes: 30, academicCount: 50, academicMinutes: 25 });
    expect(isPatternSet(defaultPattern("pma-lc"))).toBe(true);
    for (const id of ["icto", "lcc", "navy-it", "airforce-it"]) expect(isPatternSet(defaultPattern(id)), id).toBe(false);
  });

  it("fits inside the questions PMA LC has, so a full mock test can be built", () => {
    const p = defaultPattern("pma-lc");
    expect(intelligenceBank("verbal", "pma-lc")!.total).toBeGreaterThanOrEqual(p.verbalCount);
    expect(intelligenceBank("nonverbal", "pma-lc")!.total).toBeGreaterThanOrEqual(p.nonverbalCount);
    const own = academicSources("pma-lc", [])[0].subjects.filter((s) => !isMostRepeatedSet(s));
    expect(own.reduce((t, s) => t + subjectCount(s), 0)).toBeGreaterThanOrEqual(p.academicCount);
  });
});
