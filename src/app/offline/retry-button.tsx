"use client";

import { RefreshCw } from "lucide-react";

/** The main action on the offline screen: load the page again. */
export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-option bg-accent text-lg font-extrabold text-accent-ink active:bg-accent/80"
    >
      <RefreshCw size={20} aria-hidden /> Try again
    </button>
  );
}
