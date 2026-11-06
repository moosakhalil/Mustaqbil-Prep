import { useSyncExternalStore } from "react";

// "Install as app". Android and desktop Chrome give a one-tap prompt (beforeinstallprompt); iPhone needs "Share, Add to Home Screen".
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: PromptEvent | null = null;
let version = 0; // changes when something about the prompt changes, so the screen redraws
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

const DISMISS_KEY = "mp.install.dismissed";
const QUIET_DAYS = 14;

/** Call once, early (the browser fires the event only once). */
export function listenForInstall() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as PromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

function dismissedRecently(): boolean {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY));
    return t > 0 && Date.now() - t < QUIET_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

export function dismissInstall() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // storage blocked: it may show again, which is harmless
  }
  emit();
}

export async function promptInstall() {
  if (!deferred) return;
  await deferred.prompt();
  await deferred.userChoice.catch(() => null);
  deferred = null;
  emit();
}

export type InstallState = { show: boolean; mode: "prompt" | "ios" | null };

function snapshot(): string {
  if (typeof window === "undefined") return "none";
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone || dismissedRecently()) return "none";
  if (deferred) return "prompt";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  return ios ? "ios" : "none";
}

/** Whether to offer installing, and how. Never inside the installed app, and not for 14 days after "Not now". */
export function useInstall(): InstallState {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => (void version, snapshot()),
    () => "none",
  );
  return { show: s !== "none", mode: s === "prompt" ? "prompt" : s === "ios" ? "ios" : null };
}

export type InstallInfo = {
  /** False on the server and during the first draw, so no platform's steps flash up before the phone is known. */
  ready: boolean;
  platform: "android" | "ios" | "desktop";
  /** Already running as an installed app. */
  installed: boolean;
  /** Opened inside another app (Facebook, Instagram, WhatsApp and similar), which cannot install. */
  inAppBrowser: boolean;
  /** An iPhone or iPad browser other than Safari: only Safari can add to the home screen. */
  iosOtherBrowser: boolean;
  /** The browser offered a one-tap install. */
  canPrompt: boolean;
};

function infoSnapshot(): string {
  if (typeof window === "undefined") return "";
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const platform = ios ? "ios" : /android/i.test(ua) ? "android" : "desktop";
  const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const inApp = /FBAN|FBAV|Instagram|Snapchat|Twitter|MicroMessenger|TikTok|Messenger|; wv\)|WhatsApp|Line\//i.test(ua);
  const iosOther = ios && /crios|fxios|edgios|opios|gsa\//i.test(ua);
  return [platform, installed ? 1 : 0, inApp ? 1 : 0, iosOther ? 1 : 0, deferred ? 1 : 0, version].join("|");
}

/** The phone and browser facts the Install page uses to show only the steps that fit. */
export function useInstallInfo(): InstallInfo {
  const raw = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    infoSnapshot,
    () => "",
  );
  if (!raw) return { ready: false, platform: "desktop", installed: false, inAppBrowser: false, iosOtherBrowser: false, canPrompt: false };
  const [platform, installed, inApp, iosOther, prompt] = raw.split("|");
  return { ready: true, platform: platform as InstallInfo["platform"], installed: installed === "1", inAppBrowser: inApp === "1", iosOtherBrowser: iosOther === "1", canPrompt: prompt === "1" };
}
