import { createBrowserStore } from "./session-store";

export type Theme = "system" | "light" | "dark";

const store = createBrowserStore<Theme>("mp.theme.v1", "system", (raw) => (raw === "light" || raw === "dark" ? raw : "system"), "local");

export const useTheme = store.useStore;

/** Apply the choice at once. "system" follows the phone. */
export function setTheme(theme: Theme) {
  store.set(theme);
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}
