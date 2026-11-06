import { Check, X } from "lucide-react";

export type OptionState = "idle" | "selected" | "correct" | "wrong";

const styles: Record<OptionState, string> = {
  idle: "border-line bg-surface",
  selected: "border-accent bg-accent/10",
  correct: "border-ok bg-ok/10",
  wrong: "border-bad bg-bad/10",
};

/** One answer option. Right and wrong get an icon and a word as well as a colour, so they work for colour-blind users. */
export function OptionButton({
  letter, text, state, disabled, onClick,
}: { letter: string; text: string; state: OptionState; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === "selected" ? true : undefined}
      className={`flex min-h-14 w-full items-center gap-3 rounded-option border-2 px-4 py-3 text-left ${styles[state]}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          state === "idle" ? "bg-line/70 text-soft" : state === "correct" ? "bg-ok text-bg" : state === "wrong" ? "bg-bad text-bg" : "bg-accent text-accent-ink"
        }`}
        aria-hidden
      >
        {state === "correct" ? <Check size={16} strokeWidth={3} /> : state === "wrong" ? <X size={16} strokeWidth={3} /> : letter}
      </span>
      <span className="flex-1 text-[16px] leading-snug">{text}</span>
      {state === "correct" && <span className="text-xs font-bold text-ok">Correct</span>}
      {state === "wrong" && <span className="text-xs font-bold text-bad">Your answer</span>}
    </button>
  );
}

export const LETTERS = ["A", "B", "C", "D", "E", "F"];
