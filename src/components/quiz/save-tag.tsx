"use client";

import { Check, WifiOff } from "lucide-react";
import { useDirtyCount } from "@/lib/progress-queue";
import { useOnline } from "@/lib/progress-sync";

/** Says where the quiz is kept: in the account (signed in and online) or only on this phone (offline, waiting to send, or a guest). */
export function SaveTag({ signedIn, className = "" }: { signedIn: boolean; className?: string }) {
  const waiting = useDirtyCount() > 0;
  const online = useOnline();
  const inAccount = signedIn && online && !waiting;
  return inAccount ? (
    <span className={`inline-flex items-center gap-1 text-note font-bold text-ok ${className}`}>
      <Check size={12} strokeWidth={3} aria-hidden /> Saved to your account
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1 text-note font-bold text-warn ${className}`}>
      {online ? <Check size={12} strokeWidth={3} aria-hidden /> : <WifiOff size={12} aria-hidden />} Saved on this phone
    </span>
  );
}
