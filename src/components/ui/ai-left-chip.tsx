import { Sparkles } from "lucide-react";
import type { AiQuota } from "@/lib/ai-quota";

const style = {
  ok: "border-gold/60 bg-gold/20 text-text",
  low: "border-warn bg-warn/15 text-warn",
  empty: "border-bad bg-bad/10 text-bad",
} as const;

/** "7 of 10 left": how many AI requests remain today. Gold normally, amber at 3 or fewer, red at 0. The words change too, not only the colour. */
export function AiLeftChip({ quota, short = false, className = "" }: { quota: AiQuota; short?: boolean; className?: string }) {
  const text = short ? `${quota.left} left` : `${quota.left} of ${quota.limit} left`;
  return (
    <span
      role="status"
      aria-label={`${quota.left} of ${quota.limit} AI requests left today`}
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-extrabold tabular-nums ${style[quota.level]} ${className}`}
    >
      <Sparkles size={12} aria-hidden /> {text}
    </span>
  );
}
