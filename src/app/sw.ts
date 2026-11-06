/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const sameOrigin = (url: URL) => url.origin === self.location.origin;

// What is kept on the phone so quizzes work without internet:
//  - the app code (/_next/static), icons, fonts and the question files (/data), kept fresh in the background
//  - the quiz screens themselves (they hold no personal data: only whether someone is signed in)
// What is never kept: API replies and pages that show a person's name or progress (Home, Progress, Profile, saved results).
const QUIZ_PAGES = ["/practice", "/practice/settings", "/quiz", "/quiz/result", "/quiz/review", "/military/mock-result"];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // a new version waits until the person taps "Refresh"
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    { matcher: ({ url }) => sameOrigin(url) && url.pathname.startsWith("/api/"), handler: new NetworkOnly() },
    {
      matcher: ({ url }) => sameOrigin(url) && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({ cacheName: "static-assets", plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 })] }),
    },
    {
      // question banks and military pictures: show the saved copy at once, refresh it in the background
      matcher: ({ url }) => sameOrigin(url) && url.pathname.startsWith("/data/"),
      handler: new StaleWhileRevalidate({ cacheName: "question-data", plugins: [new ExpirationPlugin({ maxEntries: 400, maxAgeSeconds: 90 * 24 * 60 * 60 })] }),
    },
    {
      matcher: ({ url }) => sameOrigin(url) && (/^\/(icons|fonts|art)\//.test(url.pathname) || url.pathname === "/pdf.worker.min.mjs"),
      handler: new StaleWhileRevalidate({ cacheName: "brand-assets" }),
    },
    {
      // the quiz screens: use the network, fall back to the saved copy when offline
      matcher: ({ request, url }) => sameOrigin(url) && request.mode === "navigate" && QUIZ_PAGES.includes(url.pathname),
      handler: new NetworkFirst({ cacheName: "quiz-pages", networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 20 })] }),
    },
    {
      matcher: ({ request, url }) => sameOrigin(url) && (request.mode === "navigate" || request.headers.get("RSC") === "1"),
      handler: new NetworkOnly(),
    },
  ],
  fallbacks: {
    entries: [{ url: "/offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
