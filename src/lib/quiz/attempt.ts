import { createBrowserStore } from "@/lib/session-store";
import { sanitizeAttempt, type Attempt } from "./attempt-logic";

// The quiz in progress (or the one just finished), kept on the phone so a refresh or closing the app does not lose it.
const store = createBrowserStore<Attempt | null>("mp.attempt.v1", null, sanitizeAttempt, "local");

export const getAttempt = store.get;
export const setAttempt = store.set;
export const useAttempt = store.useStore;
