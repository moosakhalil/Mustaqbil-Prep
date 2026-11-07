import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * "‹ Home" link and the screen title, for the screens one step below Home.
 * variant "bar" is the compact style used by most other screens: a 44px back button and an 18px title on one line.
 */
export function BackHeader({
  title, href = "/home", label = "Home", color = "text-text", variant = "large",
}: { title: string; href?: string; label?: string; color?: string; variant?: "large" | "bar" }) {
  if (variant === "bar") {
    return (
      <div className="flex items-center gap-1">
        <Link href={href} aria-label={`Back to ${label}`} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-soft">
          <ChevronLeft size={24} aria-hidden />
        </Link>
        <h1 className={`text-lg font-bold ${color}`}>{title}</h1>
      </div>
    );
  }
  return (
    <div>
      <Link href={href} className="-ml-2 inline-flex min-h-12 items-center gap-0.5 rounded-option px-2 text-sm font-bold text-soft">
        <ChevronLeft size={18} aria-hidden /> {label}
      </Link>
      <h1 className={`-mt-1 text-[28px] font-extrabold leading-tight ${color}`}>{title}</h1>
    </div>
  );
}
