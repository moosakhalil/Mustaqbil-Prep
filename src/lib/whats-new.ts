// The "What's new" window shown once on Home after an update. To announce a new release: change `id` (a new date, or the same date with -2, -3) and the items below.

export const WHATS_NEW = {
  id: "2026-11-17-2",
  title: "What's new",
  items: [
    "PMA Long Course is here, with Verbal and past Academic questions from earlier PMA tests.",
    "The Military page now shows Army (ICTO, PMA LC, LCC) and Navy & PAF in two sections.",
    "A small chip shows how many AI requests you have left today.",
    "Study guide is coming soon: notes, tricks and exam tips for the initial test. Stay tuned.",
  ],
} as const;

export const WHATS_NEW_KEY = "mp.whatsnew.v1";

type Store = Pick<Storage, "getItem" | "key" | "length">;

/**
 * Show the window when the person has not seen this release's notes yet.
 * A brand-new visitor (nothing of the app saved on the phone yet) is not shown it: they have nothing to compare with.
 */
export function shouldShowWhatsNew(store: Store): boolean {
  const seen = store.getItem(WHATS_NEW_KEY);
  if (seen === WHATS_NEW.id) return false;
  if (seen !== null) return true;
  for (let i = 0; i < store.length; i++) if (store.key(i)?.startsWith("mp.")) return true;
  return false;
}
