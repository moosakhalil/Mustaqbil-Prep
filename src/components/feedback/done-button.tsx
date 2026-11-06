"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Owner: mark a message done, or new again. */
export function DoneButton({ id, status }: { id: string; status: "new" | "done" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/admin/feedback", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: status === "new" ? "done" : "new" }) });
          if (res.ok) router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="mt-3 h-10 rounded-option border border-line bg-surface px-4 text-sm font-bold disabled:opacity-60"
    >
      {status === "new" ? "Mark done" : "Mark as new again"}
    </button>
  );
}
