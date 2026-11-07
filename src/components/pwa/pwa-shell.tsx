"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { flushOutbox } from "@/lib/attempt-sync";
import { listenForInstall } from "@/lib/install";

const online = {
  subscribe(cb: () => void) {
    window.addEventListener("online", cb);
    window.addEventListener("offline", cb);
    return () => {
      window.removeEventListener("online", cb);
      window.removeEventListener("offline", cb);
    };
  },
  get: () => navigator.onLine,
  server: () => true,
};

// Screens kept for offline use. Their scripts are only saved once something has loaded them,
// so after the app is up, load each screen once and every script and style it uses.
const QUIZ_PAGES = ["/practice", "/practice/settings", "/quiz", "/quiz/result", "/quiz/review", "/offline"];

async function warmQuizPages() {
  try {
    if (sessionStorage.getItem("mp-warm") === "1") return;
    const assets = new Set<string>();
    for (const page of QUIZ_PAGES) {
      const html = await (await fetch(page, { credentials: "same-origin" })).text();
      for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)) assets.add(m[1]);
    }
    await Promise.all([...assets].map((u) => fetch(u).catch(() => null)));
    sessionStorage.setItem("mp-warm", "1");
  } catch {
    // not critical
  }
}

/** Mounted once in the root layout: registers the service worker, shows the offline and "new version" banners, sends waiting results. */
export function PwaShell() {
  const isOnline = useSyncExternalStore(online.subscribe, online.get, online.server);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    listenForInstall();
  }, []);

  // results finished offline are sent as soon as the connection is back
  useEffect(() => {
    if (isOnline) void flushOutbox();
  }, [isOnline]);

  useEffect(() => {
    // The service worker is production-only: in development it would keep stale code.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;

    // After a new version takes over, reload once (not on the very first install)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/serwist/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) setWaiting(worker);
          });
        });
        void reg.update().catch(() => {});
        void navigator.serviceWorker.ready.then(() => warmQuizPages());
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") void reg.update().catch(() => {});
        });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {!isOnline && (
        <div role="status" className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-warn px-4 py-2 text-center text-sm font-bold text-bg">
          <WifiOff size={16} aria-hidden /> You&apos;re offline. Quizzes still work. Saving, sign-in and AI need the internet.
        </div>
      )}
      {waiting && (
        <div role="status" className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-card border border-line bg-surface p-3 shadow-lg">
          <span className="text-sm font-semibold">A new version is ready.</span>
          <button type="button" onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })} className="h-11 rounded-full bg-accent px-5 text-sm font-bold text-accent-ink">
            Refresh
          </button>
        </div>
      )}
    </>
  );
}
