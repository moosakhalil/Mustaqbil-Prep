"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** Goes back to the screen the person came from (Sign in or Profile). With no earlier screen, it opens Profile. */
export function LegalBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/profile"))}
      className="-ml-2 inline-flex h-11 items-center gap-0.5 rounded-option px-2 text-sm font-bold text-accent"
    >
      <ChevronLeft size={18} aria-hidden /> Back
    </button>
  );
}
