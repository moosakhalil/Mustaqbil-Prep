import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CourseData, Manifest } from "./question-types";

// Guards the generated question data against accidental loss or damage.
// Expected counts come from DATA_VALIDATION_REPORT.md (5 Nov 2026).
const EXPECTED: Record<string, number> = {
  agile: 237, ai: 531, bda: 187, cc: 226, cald: 201, cn: 359, cp: 180, dsa: 144, dbms: 557, daa: 112, ds: 321, fm: 192, is: 159,
  ise: 99, ml: 104, oop: 159, os: 207, sc: 370, sda: 623, spm: 363, sqe: 431, sre: 417, toa: 181, vp: 164, web: 159,
};

const dataDir = join(process.cwd(), "public", "data");
const manifest: Manifest = JSON.parse(readFileSync(join(dataDir, "manifest.json"), "utf8"));
const load = (file: string): CourseData => JSON.parse(readFileSync(join(dataDir, file), "utf8"));

describe("question data", () => {
  it("has all 25 courses and 6,683 questions", () => {
    expect(manifest.totals).toEqual({ courses: 25, questions: 6683 });
    expect(Object.fromEntries(manifest.courses.map((c) => [c.id, c.total]))).toEqual(EXPECTED);
  });

  it("keeps every question valid and every id unique", () => {
    const seen = new Set<string>();
    for (const c of manifest.courses) {
      const data = load(c.file);
      expect(data.questions).toHaveLength(c.total);
      const units = new Set(c.units.map((u) => u.n));
      for (const q of data.questions) {
        expect(seen.has(q.id)).toBe(false);
        seen.add(q.id);
        expect(q.id.startsWith(c.id + "-")).toBe(true);
        expect(q.o).toHaveLength(4);
        expect(new Set(q.o).size).toBe(4);
        expect(q.a).toBeGreaterThanOrEqual(0);
        expect(q.a).toBeLessThan(4);
        expect(units.has(q.u)).toBe(true);
      }
      // unit counts add up to the course total
      expect(c.units.reduce((s, u) => s + u.count, 0)).toBe(c.total);
    }
    expect(seen.size).toBe(6683);
  }, 60_000); // checks all 6,683 questions: slow on a busy or OneDrive-synced machine

  it("pins only the known position-dependent options", () => {
    const pinned: string[] = [];
    for (const c of manifest.courses) {
      for (const q of load(c.file).questions) {
        if (q.p) pinned.push(...q.p.map((i) => `${q.id}:${q.o[i]}`));
      }
    }
    expect(pinned.sort()).toEqual(
      ["is-120:None of them", "oop-153:Both of them", "oop-153:Neither of them", "toa-147:none of them", "toa-66:none of these"].sort(),
    );
  });

  it("lists the two known repeated questions", () => {
    expect(manifest.duplicates).toEqual([
      ["agile-140", "sc-154"],
      ["agile-97", "sc-306"],
    ]);
  });
});
