"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";

/** The gold "Preferred" tag on a course page. Tap it to make this course your preferred one (or to clear it). */
export function PreferredButton({ course, preferred, signedIn }: { course: string; preferred: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return preferred ? null : (
      <Link href="/sign-in" className="flex h-9 items-center gap-1 rounded-full bg-black/40 px-3 text-xs font-bold text-white">
        <Star size={13} aria-hidden /> Sign in to set preferred
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={preferred}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ preferredCourse: preferred ? null : course }) });
          if (res.ok) router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className={`flex h-9 items-center gap-1 rounded-full px-3 text-xs font-extrabold disabled:opacity-60 ${preferred ? "bg-gold text-black" : "bg-black/40 text-white"}`}
    >
      <Star size={13} fill={preferred ? "currentColor" : "none"} aria-hidden /> {preferred ? "Preferred" : "Make preferred"}
    </button>
  );
}
