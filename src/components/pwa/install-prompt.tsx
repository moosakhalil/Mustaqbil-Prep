"use client";

import { Download, Share } from "lucide-react";
import { dismissInstall, promptInstall, useInstall } from "@/lib/install";

/** Offered after the first finished quiz (not on arrival). Installed, the app opens from the home screen and quizzes work offline. */
export function InstallPrompt() {
  const { show, mode } = useInstall();
  if (!show) return null;
  return (
    <section className="mt-6 rounded-card border border-accent/40 bg-accent/10 p-4" aria-label="Install the app">
      <p className="flex items-center gap-2 font-bold">
        <Download size={18} className="text-accent" aria-hidden /> Install Mustaqbil Prep
      </p>
      {mode === "ios" ? (
        <p className="mt-1 text-sm">
          Tap <Share size={14} className="inline align-text-bottom" aria-label="Share" /> in Safari, then <b>Add to Home Screen</b>. Quizzes open from your home screen and work offline.
        </p>
      ) : (
        <p className="mt-1 text-sm">Open quizzes from your home screen. They work offline too.</p>
      )}
      <div className="mt-3 flex gap-3">
        {mode === "prompt" && (
          <button type="button" onClick={() => void promptInstall()} className="h-12 flex-1 rounded-option bg-accent font-bold text-accent-ink">
            Install
          </button>
        )}
        <button type="button" onClick={dismissInstall} className="h-12 flex-1 rounded-option border border-line font-bold">
          Not now
        </button>
      </div>
    </section>
  );
}
