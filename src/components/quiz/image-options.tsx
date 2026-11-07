"use client";

import { useState } from "react";
import { Check, X, ZoomIn } from "lucide-react";
import type { QuizQuestion } from "@/lib/quiz/build";
import { Sheet } from "./sheet";

/** The question figure in its own card. Tap it to zoom in for fine detail. */
export function QuestionFigure({ src, label }: { src: string; label: string }) {
  const [zoom, setZoom] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setZoom(true)} className="relative block w-full rounded-card border border-line bg-white p-2" aria-label={`${label}. Tap to zoom.`}>
        {/* the figures are plain images from our own data folder */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="mx-auto max-h-64 w-auto object-contain" />
        <span className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white" aria-hidden>
          <ZoomIn size={16} />
        </span>
      </button>
      {zoom && (
        <Sheet title="Zoom" onClose={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="mt-3 w-full rounded-card bg-white object-contain" />
          <button type="button" onClick={() => setZoom(false)} className="mt-4 h-12 w-full rounded-option bg-accent font-bold text-accent-ink">Close</button>
        </Sheet>
      )}
    </>
  );
}

/**
 * Answer figures as numbered tiles in a 2 x 2 grid. Choose a tile, then press Confirm, so a slip on a small shape does not count.
 * `answered` is the confirmed answer (null before). In practice mode the right and wrong tiles show after confirming.
 */
export function ImageOptions({
  q, answered, reveal, onConfirm, readOnly = false,
}: { q: QuizQuestion; answered: number | null; reveal: boolean; onConfirm: (option: number) => void; readOnly?: boolean }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const pick = answered ?? chosen;
  // readOnly is the review screen: always show which tile is right and which (if any) was chosen wrongly
  const locked = readOnly || (reveal && answered !== null);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Answer figures">
        {q.optionImages!.map((src, i) => {
          const isRight = locked && i === q.answer;
          const isWrong = locked && i === answered && i !== q.answer;
          const selected = !locked && pick === i;
          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => setChosen(i)}
              aria-pressed={selected}
              aria-label={`Option ${i + 1}${isRight ? ", correct" : isWrong ? ", your wrong answer" : selected ? ", selected" : ""}`}
              className={`relative rounded-option border-2 bg-white p-2 ${isRight ? "border-ok" : isWrong ? "border-bad" : selected ? "border-accent ring-2 ring-accent" : "border-line"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="mx-auto h-28 w-full object-contain" />
              <span className={`absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm font-bold ${isRight ? "bg-ok text-bg" : isWrong ? "bg-bad text-bg" : selected ? "bg-accent text-accent-ink" : "bg-black/70 text-white"}`}>
                {isRight ? <Check size={14} strokeWidth={3} aria-hidden /> : isWrong ? <X size={14} strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              {isRight && <span className="absolute bottom-1 right-2 text-note font-bold text-ok">Correct</span>}
              {isWrong && <span className="absolute bottom-1 right-2 text-note font-bold text-bad">Your answer</span>}
            </button>
          );
        })}
      </div>
      {!locked && (
        <button
          type="button"
          disabled={pick === null}
          onClick={() => pick !== null && onConfirm(pick)}
          className="mt-4 h-12 w-full rounded-option bg-accent font-bold text-accent-ink disabled:bg-line disabled:text-soft"
        >
          {pick === null ? "Choose an option" : answered === pick ? "Answer saved" : `Confirm option ${pick + 1}`}
        </button>
      )}
    </div>
  );
}
