"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, Download, MoreVertical, Share, WifiOff, Zap } from "lucide-react";
import { promptInstall, useInstallInfo } from "@/lib/install";

const btn = "flex h-12 w-full items-center justify-center gap-2 rounded-option bg-accent font-bold text-accent-ink";
const btnLight = "flex h-12 w-full items-center justify-center gap-2 rounded-option border border-line bg-surface font-bold";
const box = "rounded-card border border-line bg-surface p-4";
const key = (label: string) => <b className="whitespace-nowrap rounded bg-line/60 px-1.5 py-0.5">{label}</b>;

/** The bottom bar of Safari with the Share button circled: where to look on an iPhone. */
function SafariBar() {
  return (
    <svg viewBox="0 0 320 64" className="mx-auto h-auto w-full max-w-[320px]" role="img" aria-label="Safari's bottom bar. The Share button is circled.">
      <rect x="1" y="1" width="318" height="62" rx="18" className="fill-surface stroke-line" strokeWidth="2" />
      <g className="stroke-soft" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M44 22l-9 10 9 10" />
        <path d="M100 22l9 10-9 10" />
        <path d="M208 22h20a2 2 0 0 1 2 2v18l-12-5-12 5V24a2 2 0 0 1 2-2z" />
        <rect x="270" y="26" width="20" height="16" rx="3" />
        <path d="M274 22h18a2 2 0 0 1 2 2v14" />
      </g>
      <circle cx="160" cy="32" r="24" className="fill-accent/15 stroke-accent" strokeWidth="3" />
      <g transform="translate(148 20)" className="stroke-accent" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 15V3" />
        <path d="M8 7l4-4 4 4" />
        <path d="M7 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1" />
      </g>
    </svg>
  );
}

function CopyLink({ light }: { light?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={light ? btnLight : btn}
      onClick={() => {
        void navigator.clipboard?.writeText(window.location.href).then(() => setDone(true));
      }}
    >
      {done ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />} {done ? "Link copied" : "Copy link"}
    </button>
  );
}

/** The Install page: one link to share. It looks at the phone and shows only the steps that phone needs. */
export function InstallPage() {
  const info = useInstallInfo();
  const browser = info.platform === "ios" ? "Safari" : "Chrome";

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-3 gap-2 text-center text-xs font-semibold" aria-label="Why install">
        <li className={`${box} !p-3`}><Zap size={20} className="mx-auto text-gold" aria-hidden /><span className="mt-1 block">Opens like an app</span></li>
        <li className={`${box} !p-3`}><WifiOff size={20} className="mx-auto text-accent" aria-hidden /><span className="mt-1 block">Works offline</span></li>
        <li className={`${box} !p-3`}><Download size={20} className="mx-auto text-military" aria-hidden /><span className="mt-1 block">Free, no store</span></li>
      </ul>

      {info.ready && info.installed && (
        <>
          <p className="text-soft">Mustaqbil Prep is already installed on this phone. Open it from your home screen.</p>
          <Link href="/home" className={btn}>Open Mustaqbil Prep here</Link>
        </>
      )}

      {info.ready && !info.installed && (
        <>
          {info.inAppBrowser && (
            <div role="note" className={`${box} flex flex-col gap-3`}>
              <p>This app cannot be installed from inside another app. Open the link in <b>{browser}</b> to install it.</p>
              <CopyLink />
            </div>
          )}

          {!info.inAppBrowser && info.platform === "android" && (
            <>
              <p className="text-soft">Put it on your home screen. It opens fast and your quizzes work without internet.</p>
              {info.canPrompt ? (
                <button type="button" className={btn} onClick={() => void promptInstall()}>
                  <Download size={18} aria-hidden /> Install
                </button>
              ) : (
                <ol className={`${box} flex list-decimal flex-col gap-3 ps-8`}>
                  <li>Open the browser menu <MoreVertical size={14} className="inline align-text-bottom" aria-label="three dots" /> in Chrome.</li>
                  <li>Tap {key("Install app")} or {key("Add to Home screen")}.</li>
                  <li>Tap {key("Install")}, then open Mustaqbil Prep from your home screen.</li>
                </ol>
              )}
            </>
          )}

          {!info.inAppBrowser && info.platform === "ios" && (
            <>
              {info.iosOtherBrowser ? (
                <div role="note" className={`${box} flex flex-col gap-3`}>
                  <p>On an iPhone or iPad, only <b>Safari</b> can add an app to the home screen. Open this link in Safari.</p>
                  <CopyLink />
                </div>
              ) : (
                <>
                  <p className="text-soft">Put it on your home screen. It opens fast and your quizzes work without internet.</p>
                  <SafariBar />
                  <ol className="flex list-decimal flex-col gap-3 ps-6">
                    <li>Tap the {key("Share")} button <Share size={14} className="inline align-text-bottom" aria-hidden /> at the bottom of Safari.</li>
                    <li>Scroll down and tap {key("Add to Home Screen")}.</li>
                    <li>Tap {key("Add")}, then open Mustaqbil Prep from your home screen and sign in.</li>
                  </ol>
                  <p className="text-sm text-soft">Cannot see the Share button? Tap the three dots first. If this link opened inside another app, such as WhatsApp, open it in Safari.</p>
                </>
              )}
            </>
          )}

          {!info.inAppBrowser && info.platform === "desktop" && (
            <>
              <p className="text-soft">Mustaqbil Prep is made for phones. Open this link on your phone: in Chrome on Android, or in Safari on iPhone.</p>
              {info.canPrompt && (
                <button type="button" className={btn} onClick={() => void promptInstall()}>
                  <Download size={18} aria-hidden /> Install on this computer
                </button>
              )}
              <CopyLink light={info.canPrompt} />
            </>
          )}

          <Link href="/sign-in" className={`${btnLight} mt-1`}>Not now, continue in the browser</Link>
        </>
      )}
    </div>
  );
}
