"use client";

import { Children, useRef, useState } from "react";

/**
 * A row of cards that scrolls sideways and snaps. The next card peeks in at the edge, and small dots show where you are.
 * Give it the cards as children.
 */
export function CourseCarousel({ label, children }: { label: string; children: React.ReactNode }) {
  const items = Children.toArray(children);
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = ref.current;
    if (!el || items.length < 2) return;
    const room = el.scrollWidth - el.clientWidth;
    setActive(room > 0 ? Math.round((el.scrollLeft / room) * (items.length - 1)) : 0);
  }

  return (
    <div role="group" aria-label={label}>
      <div
        ref={ref}
        onScroll={onScroll}
        className="-mx-5 mt-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div key={i} className="shrink-0 snap-start">
            {item}
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-2 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full ${i === active ? "w-4 bg-accent" : "w-1.5 bg-line"}`} />
        ))}
      </div>
    </div>
  );
}
