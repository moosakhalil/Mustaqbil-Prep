import Link from "next/link";

export type SegmentedItem = { label: string; href: string; active: boolean; tone?: "accent" | "military" };

/** A 44px two-or-more part switch between sibling screens (for example Academia / Military). The active part is raised and coloured. */
export function Segmented({ items, label }: { items: SegmentedItem[]; label: string }) {
  return (
    <nav aria-label={label} className="flex gap-1 rounded-full bg-line/60 p-1">
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={`flex h-11 flex-1 items-center justify-center rounded-full text-sm font-bold ${
            it.active ? `bg-surface shadow-sm ${it.tone === "military" ? "text-military" : "text-accent"}` : "text-soft"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
