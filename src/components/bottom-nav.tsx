"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, House, ListChecks, User } from "lucide-react";

const TABS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/practice", label: "Practice", Icon: ListChecks },
  { href: "/progress", label: "Progress", Icon: ChartLine },
  { href: "/profile", label: "Profile", Icon: User },
] as const;

/** Four tabs at the bottom, as in the design. Not a hamburger menu. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-16 max-w-md">
        {TABS.map(({ href, label, Icon }) => {
          // the military screens belong to the Home tab
          const active = pathname === href || pathname.startsWith(href + "/") || (href === "/home" && pathname.startsWith("/military"));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? "text-accent" : "text-soft"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
