import { describe, expect, it } from "vitest";
import { GUIDE_PARTS, GUIDE_PART_INFO, guideStartCard, isGuideSoon } from "./guide";

describe("Study guide placeholders", () => {
  it("has every part locked as Soon for now", () => {
    for (const info of GUIDE_PART_INFO) expect(isGuideSoon(info.id), info.id).toBe(true);
    expect(Object.keys(GUIDE_PARTS).sort()).toEqual(GUIDE_PART_INFO.map((p) => p.id).sort());
  });

  it("shows a card on each part's start page", () => {
    expect(guideStartCard("icto", "verbal")?.title).toBe("Tricks and formulas");
    expect(guideStartCard("pma-lc", "nonverbal")?.title).toBe("How to solve picture puzzles");
    expect(guideStartCard("navy-it", "academic")?.title).toBe("Notes for these subjects");
  });

  it("calls the PMA LC Academic card Quick facts", () => {
    expect(guideStartCard("pma-lc", "academic")?.title).toBe("Quick facts for these subjects");
  });
});
