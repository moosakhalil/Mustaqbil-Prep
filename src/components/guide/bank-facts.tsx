"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { filterFacts, toFacts, type Fact } from "@/lib/guide/facts";
import { bankById } from "@/lib/military-data";
import { loadCourse } from "@/lib/question-loader";
import { Skeleton } from "@/components/ui/skeleton";

/** Cards shown at first, and added each time "Show more" is pressed. */
const PAGE = 30;

/**
 * Every text question of a bank as a card: the question, the answer in its own box, and a "Why this answer" button when the bank has a reason.
 * When the bank says how often a question was listed in past tests, the most listed come first and the card says so. Built from the bank itself,
 * so it always agrees with the quiz.
 */
export function BankFacts({ title, bank }: { title: string; bank: string }) {
  const code = bankById(bank)?.code;
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const failed = loadFailed || !code; // a bank the app does not know is the same as one that cannot load
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    loadCourse(code)
      .then((questions) => {
        if (!cancelled) setFacts(toFacts(questions));
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const matches = useMemo(() => (facts ? filterFacts(facts, search) : []), [facts, search]);
  const rows = matches.slice(0, shown);
  const byListing = !!facts?.some((f) => f.times !== null);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-extrabold leading-tight">{title}</h2>
      {failed ? (
        <p role="status" className="rounded-card border border-line bg-surface p-4 text-[15px] text-soft">The questions could not be loaded. Check your connection and open this lesson again.</p>
      ) : !facts ? (
        <div role="status" aria-busy="true" aria-label="Loading the questions" className="space-y-2">
          <Skeleton className="h-13 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          <label className="flex min-h-13 items-center gap-2 rounded-option border border-line bg-surface px-3 focus-within:border-accent">
            <Search size={20} className="shrink-0 text-soft" aria-hidden />
            <span className="sr-only">Search the questions</span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShown(PAGE);
              }}
              placeholder={`Search ${facts.length} questions`}
              className="h-13 w-full bg-transparent text-base outline-none"
            />
          </label>
          <p className="text-[15px] text-soft" aria-live="polite">
            {matches.length === facts.length ? `${facts.length} questions${byListing ? ". Most repeated first." : ""}` : `${matches.length} of ${facts.length} questions`}
          </p>
          {rows.length === 0 ? (
            <p className="rounded-card border border-line bg-surface p-4 text-base text-soft">Nothing matches. Try a shorter word.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((f, i) => (
                <li key={f.id} className="rounded-card border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-soft">Question {i + 1}</span>
                    {f.times !== null && <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-sm font-bold text-accent">Listed {f.times} {f.times === 1 ? "time" : "times"}</span>}
                  </div>
                  <p className="mt-2 text-[17px] font-bold leading-snug">{f.question}</p>
                  <p className="mt-3 flex flex-wrap items-baseline gap-x-3 rounded-option border-2 border-ok bg-ok/10 px-4 py-2.5">
                    <span className="text-sm font-bold text-soft">Answer</span>
                    <span className="text-xl font-extrabold leading-snug">{f.answer}</span>
                  </p>
                  {f.why && (
                    <details className="group mt-3">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center rounded-option border border-line text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">Why this answer</span>
                        <span className="hidden group-open:inline">Hide the reason</span>
                      </summary>
                      <p className="mt-3 text-base leading-relaxed">{f.why}</p>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
          {matches.length > shown && (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="h-13 w-full rounded-option border border-line text-base font-bold text-accent">
              Show more ({matches.length - shown} left)
            </button>
          )}
        </>
      )}
    </div>
  );
}
