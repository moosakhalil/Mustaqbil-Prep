import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** Back button that says where it goes (44px tall), then the screen title. For the Military screens below a course. */
export function BackTitle({ href, label, title }: { href: string; label: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={href} aria-label={`Back to ${label}`} className="flex h-11 shrink-0 items-center gap-0.5 rounded-option border border-line bg-surface pl-2 pr-3 text-sm font-bold">
        <ChevronLeft size={18} aria-hidden /> {label}
      </Link>
      <h1 className="min-w-0 flex-1 text-lg font-bold leading-tight">{title}</h1>
    </div>
  );
}
