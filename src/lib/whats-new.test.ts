import { describe, expect, it } from "vitest";
import { MAX_RELEASES, RELEASES, WHATS_NEW_KEY, shouldShowWhatsNew, unseenReleases } from "./whats-new";

/** A tiny stand-in for localStorage. */
function fake(entries: Record<string, string>) {
  const keys = Object.keys(entries);
  return { getItem: (k: string) => entries[k] ?? null, key: (i: number) => keys[i] ?? null, length: keys.length };
}

describe("What's new window", () => {
  it("is not shown to a brand-new visitor", () => {
    expect(shouldShowWhatsNew(fake({}))).toBe(false);
    expect(unseenReleases(fake({}))).toEqual([]);
  });

  it("is shown to someone who already uses the app and has never seen any notes", () => {
    expect(shouldShowWhatsNew(fake({ "mp.settings.v1": "{}" }))).toBe(true);
  });

  it("shows only the releases newer than the one last seen, newest first", () => {
    const seen = RELEASES[1].id;
    const list = unseenReleases(fake({ [WHATS_NEW_KEY]: seen, "mp.settings.v1": "{}" }));
    expect(list.map((r) => r.id)).toEqual([RELEASES[0].id]);
  });

  it("shows everything newer when an older release was seen", () => {
    const last = RELEASES[RELEASES.length - 1].id;
    const list = unseenReleases(fake({ [WHATS_NEW_KEY]: last, "mp.settings.v1": "{}" }));
    expect(list.map((r) => r.id)).toEqual(RELEASES.slice(0, -1).map((r) => r.id));
  });

  it("is not shown again once the newest release was seen", () => {
    expect(shouldShowWhatsNew(fake({ [WHATS_NEW_KEY]: RELEASES[0].id, "mp.settings.v1": "{}" }))).toBe(false);
  });

  it("gives a long-skipped student at most a few releases", () => {
    expect(unseenReleases(fake({ [WHATS_NEW_KEY]: "2020-01-01", "mp.settings.v1": "{}" })).length).toBeLessThanOrEqual(MAX_RELEASES);
  });

  it("lists releases newest first, each with a date id and 1 to 4 lines", () => {
    const ids = RELEASES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RELEASES) {
      expect(r.id).toMatch(/^\d{4}-\d{2}-\d{2}(-\d+)?$/);
      expect(r.items.length).toBeGreaterThan(0);
      expect(r.items.length).toBeLessThanOrEqual(4);
    }
    expect([...ids].sort().reverse()).toEqual(ids);
  });
});
