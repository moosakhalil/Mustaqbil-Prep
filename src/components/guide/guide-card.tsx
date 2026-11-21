import Link from "next/link";
import type { ComponentType } from "react";
import { BookOpen, ChevronRight, Lock } from "lucide-react";

type Icon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

/**
 * A row for a part of the guide that is not built yet (degree topics). It is not tappable, but it reads like the other rows: a solid border, a full-strength
 * icon, 17px and 15px text, and a plain "Later" label. A screen reader hears "coming later".
 */
export function GuideSoonRow({ icon: Icon = BookOpen, title, hint, className = "" }: { icon?: Icon; title: string; hint: string; className?: string }) {
  return (
    <div role="note" aria-label={`${title}, coming later`} className={`flex items-center gap-3 rounded-card border border-line bg-surface p-3.5 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-option bg-line/60 text-soft">
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold leading-snug">{title}</span>
        <span className="block text-[15px] leading-snug text-soft">{hint}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-soft">
        <Lock size={14} aria-hidden /> Later
      </span>
    </div>
  );
}

/** A tappable row that opens a part of the guide (used on a course page and on the start page of a part). */
export function GuideLinkRow({ icon: Icon = BookOpen, title, hint, href, className = "" }: { icon?: Icon; title: string; hint: string; href: string; className?: string }) {
  return (
    <Link href={href} className={`flex min-h-16 items-center gap-3 rounded-card border border-line bg-surface p-3 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-option bg-accent/10 text-accent">
        <Icon size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold leading-snug">{title}</span>
        <span className="block text-[15px] leading-snug text-soft">{hint}</span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-soft" aria-hidden />
    </Link>
  );
}

/** The dark "Study guide" card on Home and on the Military page. It opens the Study guide. */
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
        <span className="block text-sm text-white/90">{hint}</span>
      </span>
      <ChevronRight size={22} className="shrink-0" aria-hidden />
    </Link>
  );
}
