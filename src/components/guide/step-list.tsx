import type { Step } from "@/lib/guide";

/**
 * The steps of a trick. Each step is a number, a short bold heading on its own line (17px) and the explanation under it (16px).
 * Used by the lesson page and by the bulb sheet in a quiz, so a student learns the pattern once.
 */
export function StepList({ steps, className = "" }: { steps: Step[]; className?: string }) {
  return (
    <ol className={`space-y-4 ${className}`}>
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <span aria-hidden className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-accent text-base font-extrabold text-accent-ink">{i + 1}</span>
          <div className="min-w-0">
            <p className="text-[17px] font-bold leading-snug">{s.head}</p>
            <p className="mt-0.5 text-base leading-relaxed">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
