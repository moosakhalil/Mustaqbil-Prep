"use client";

import { useGuideRead } from "@/lib/guide/read";

/** "2 of 6 lessons read" in 15px bold, with a 12px bar under it. `keys` are the lesson keys of the group. */
export function ReadProgress({ keys, className = "" }: { keys: readonly string[]; className?: string }) {
  const read = useGuideRead();
  const done = keys.filter((k) => read.has(k)).length;
  return (
    <div className={className}>
      <p className="text-[15px] font-bold">{done} of {keys.length} lessons read</p>
      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={`${done} of ${keys.length} lessons read`}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${keys.length ? (done / keys.length) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
