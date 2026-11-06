import { manifest } from "@/lib/manifest";
import { createSessionStore } from "@/lib/session-store";
import { DEFAULT_SETTINGS, sanitizePlan, sanitizeSettings, type QuizPlan, type Settings } from "./settings-logic";

// What the student chose on the settings screen (kept while they come back and change it)
const settings = createSessionStore<Settings>("mp.settings.v1", DEFAULT_SETTINGS, sanitizeSettings);
export const getSettings = settings.get;
export const setSettings = settings.set;
export const useSettings = settings.useStore;

// The quiz that was started: read by the quiz screen
const plan = createSessionStore<QuizPlan | null>("mp.plan.v1", null, (raw) => sanitizePlan(raw, manifest.courses));
export const setPlan = plan.set;
export const usePlan = plan.useStore;
