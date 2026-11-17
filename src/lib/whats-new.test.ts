import { describe, expect, it } from "vitest";
import { WHATS_NEW, WHATS_NEW_KEY, shouldShowWhatsNew } from "./whats-new";

/** A tiny stand-in for localStorage. */
function fake(entries: Record<string, string>) {
  const keys = Object.keys(entries);
  return { getItem: (k: string) => entries[k] ?? null, key: (i: number) => keys[i] ?? null, length: keys.length };
}

describe("What's new window", () => {
  it("is not shown to a brand-new visitor", () => {
    expect(shouldShowWhatsNew(fake({}))).toBe(false);
  });

  it("is shown to someone who already uses the app and has not seen it", () => {
    expect(shouldShowWhatsNew(fake({ "mp.settings.v1": "{}" }))).toBe(true);
  });

  it("is shown when only an older release was seen", () => {
    expect(shouldShowWhatsNew(fake({ [WHATS_NEW_KEY]: "2020-01-01", "mp.settings.v1": "{}" }))).toBe(true);
  });

  it("is not shown again once this release was seen", () => {
    expect(shouldShowWhatsNew(fake({ [WHATS_NEW_KEY]: WHATS_NEW.id, "mp.settings.v1": "{}" }))).toBe(false);
  });

  it("has a release id and at least one item", () => {
    expect(WHATS_NEW.id).toMatch(/^\d{4}-\d{2}-\d{2}(-\d+)?$/);
    expect(WHATS_NEW.items.length).toBeGreaterThan(0);
  });
});
