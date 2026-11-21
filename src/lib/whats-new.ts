// The "What's new" window shown on Home after an update. Each phone remembers the last release it saw and is shown only the newer ones, newest first.
// To announce a new release: add an entry at the TOP of RELEASES with a new id (a date, or the same date with -2, -3) and 2 to 4 plain lines.
// Never edit or remove the older entries: people who skipped an update still read them, and a line is written once so what a student read stays true.

export type Release = { id: string; items: readonly string[] };

export const RELEASES: readonly Release[] = [
  {
    id: "2026-11-21",
    items: [
      "The Study guide is open: short lessons on what the past papers repeat most, for Verbal, Non-verbal and Academic.",
      "Tap the bulb on a practice question for a hint. Then tap Back to question to carry on where you were.",
      "After a quiz, Fix this first shows your weakest topic. Each lesson ends with 3 practice questions.",
      "Subnetting has a full how-to-solve lesson. A Your next lesson card shows what to read next.",
    ],
  },
  {
    id: "2026-11-19",
    items: [
      "Your quizzes now save to your account, so they follow you to any phone.",
      "You can keep up to 3 unfinished quizzes, and a mock test, on Home.",
      "The exam clock pauses when you leave and starts again when you tap Resume.",
      "Mock test: after each part, one button starts the next.",
    ],
  },
  {
    id: "2026-11-17-2",
    items: [
      "PMA Long Course is here, with Verbal and past Academic questions from earlier PMA tests.",
      "The Military page now shows Army (ICTO, PMA LC, LCC) and Navy & PAF in two sections.",
      "A small chip shows how many AI requests you have left today.",
      "Study guide is coming soon: notes, tricks and exam tips for the initial test. Stay tuned.",
    ],
  },
];

export const WHATS_NEW_KEY = "mp.whatsnew.v1";

/** A person who skipped many updates (or whose last-seen release is no longer listed) is given this many, not a wall of text. */
export const MAX_RELEASES = 4;

type Store = Pick<Storage, "getItem" | "key" | "length">;

/**
 * The releases this phone has not seen, newest first.
 * A brand-new visitor (nothing of the app saved on the phone yet) gets none: they have nothing to compare with.
 */
export function unseenReleases(store: Store): Release[] {
  const seen = store.getItem(WHATS_NEW_KEY);
  if (seen !== null) {
    const at = RELEASES.findIndex((r) => r.id === seen);
    return at >= 0 ? RELEASES.slice(0, at) : RELEASES.slice(0, MAX_RELEASES);
  }
  for (let i = 0; i < store.length; i++) if (store.key(i)?.startsWith("mp.")) return RELEASES.slice(0, MAX_RELEASES);
  return [];
}

/** Show the window when there is something this phone has not seen. */
export const shouldShowWhatsNew = (store: Store): boolean => unseenReleases(store).length > 0;

/** The id to remember once the window is closed. */
export const latestReleaseId = () => RELEASES[0].id;
