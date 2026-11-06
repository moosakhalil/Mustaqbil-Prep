import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/** "‹ Home" link and the screen title, for the screens one step below Home. */
export function BackHeader({ title, href = "/home", label = "Home", color = "text-text" }: { title: string; href?: string; label?: string; color?: string }) {
  return (
    <div>
      <Link href={href} className="-ml-2 inline-flex min-h-12 items-center gap-0.5 rounded-option px-2 text-sm font-bold text-soft">
        <ChevronLeft size={18} aria-hidden /> {label}
      </Link>
      <h1 className={`-mt-1 text-[28px] font-extrabold leading-tight ${color}`}>{title}</h1>
    </div>
  );
}
