import Link from "next/link";
import type { ComponentType } from "react";
import { BookOpen, Calculator, Clock, LayoutGrid, Lock, Sparkles } from "lucide-react";
import type { GuidePartId } from "@/lib/guide";

/** The icon of each guide part. */
export const GUIDE_ICONS: Record<GuidePartId, ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>> = {
  notes: BookOpen,
  verbal: Calculator,
  nonverbal: LayoutGrid,
  tips: Clock,
  ai: Sparkles,
};

/** The small "Soon" label with a lock. "light" sits on a dark card; "solid" sits on a normal surface. */
export function SoonPill({ tone = "solid" }: { tone?: "light" | "solid" }) {
  return (
    <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${tone === "light" ? "bg-white text-slate-900" : "bg-text text-bg"}`}>
      <Lock size={12} aria-hidden /> Soon
    </span>
  );
}

/** A quiet, locked row: dashed border, muted. Not tappable. Screen readers hear "coming soon". */
export function GuideSoonRow({ icon: Icon = BookOpen, title, hint, className = "" }: { icon?: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>; title: string; hint: string; className?: string }) {
  return (
    <div role="note" aria-label={`${title}, coming soon`} className={`flex items-center gap-3 rounded-card border-2 border-dashed border-line bg-surface/70 p-3 text-soft ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-option bg-accent/10 text-accent opacity-60">
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-note">{hint}</span>
      </span>
      <SoonPill />
    </div>
  );
}

/** The dark "Study guide" card on Home and on the Military page. It is the one Soon item that opens something: the Study guide page. */
export function GuideCard({ hint, className = "" }: { hint: string; className?: string }) {
  return (
    <Link
      href="/guide"
      className={`flex items-center gap-3 rounded-card border border-line bg-linear-to-br from-[#1a1a2e] via-[#3a3a7a] to-[#6a6fd0] p-4 text-white active:opacity-90 ${className}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
        <BookOpen size={22} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-extrabold leading-tight">Study guide</span>
        <span className="block text-[13px] text-white/90">{hint}</span>
      </span>
      <SoonPill tone="light" />
    </Link>
  );
}
