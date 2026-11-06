import { manifest } from "@/lib/manifest";
import { createSessionStore } from "@/lib/session-store";
import { sanitize, type Selection } from "./selection-logic";

// The topics a student ticked, kept while they move from the picker to the quiz settings.
const store = createSessionStore<Selection>("mp.selection.v1", {}, (raw) => sanitize(raw, manifest.courses));

export const getSelection = store.get;
export const setSelection = store.set;
export const useSelection = store.useStore;
