import { describe, expect, it } from "vitest";
import type { CourseInfo } from "../question-types";
import { courseState, sanitize, selectMany, summarize, toggleCourse, toggleUnit } from "./selection-logic";

const course = (id: string, counts: number[]): CourseInfo => ({
  id, title: id.toUpperCase(), domain: "degree", file: `degree/${id}.json`, bytes: 0,
  total: counts.reduce((s, n) => s + n, 0),
  units: counts.map((count, i) => ({ n: i + 1, title: `Unit ${i + 1}`, count })),
});
const os = course("os", [22, 35, 28, 41]);
const dbms = course("dbms", [64, 72, 96]);

describe("topic selection", () => {
  it("ticking a course ticks every chapter, ticking again clears it", () => {
    const all = toggleCourse({}, os);
    expect(all).toEqual({ os: [1, 2, 3, 4] });
    expect(courseState(all, os)).toBe("all");
    expect(toggleCourse(all, os)).toEqual({});
  });

  it("shows a partial mark when only some chapters are ticked, and a click completes it", () => {
    const some = toggleUnit(toggleUnit({}, "dbms", 2), "dbms", 3);
    expect(courseState(some, dbms)).toBe("some");
    expect(toggleCourse(some, dbms)).toEqual({ dbms: [1, 2, 3] });
  });

  it("removes a course from the picks when its last chapter is unticked", () => {
    expect(toggleUnit({ os: [2] }, "os", 2)).toEqual({});
  });

  it("adds up courses, chapters and questions for the sticky bar", () => {
    // Operating Systems: all 4 chapters (22+35+28+41 = 126). DBMS: chapters 2 and 3 (72+96 = 168)
    const sel = { os: [1, 2, 3, 4], dbms: [2, 3] };
    expect(summarize(sel, [os, dbms])).toEqual({ courses: 2, chapters: 6, questions: 126 + 168 });
  });

  it("select all adds to what is already ticked", () => {
    expect(selectMany({ os: [2] }, [{ id: "os", units: [1, 2] }, { id: "dbms", units: [3] }])).toEqual({ os: [1, 2], dbms: [3] });
  });

  it("ignores saved picks for courses or chapters that no longer exist", () => {
    expect(sanitize({ os: [1, 99, "x"], gone: [1], dbms: "bad" }, [os, dbms])).toEqual({ os: [1] });
    expect(sanitize("junk", [os])).toEqual({});
  });
});
