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
      <Link href="/sign-in" className="flex h-11 items-center gap-1.5 rounded-full border border-white bg-black/55 px-4 text-note font-bold text-white">
        <Star size={15} aria-hidden /> Sign in to set preferred
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
      className={`flex h-11 items-center gap-1.5 rounded-full border px-4 text-note font-extrabold disabled:opacity-60 ${preferred ? "border-gold bg-gold text-black" : "border-white bg-black/55 text-white"}`}
    >
      <Star size={15} fill={preferred ? "currentColor" : "none"} aria-hidden /> {preferred ? "Preferred" : "Make preferred"}
    </button>
  );
}
