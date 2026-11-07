import Link from "next/link";
import { Check, WifiOff } from "lucide-react";
import { RetryButton } from "./retry-button";

export const metadata = { title: "You're offline · Mustaqbil Prep" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-5 px-5 py-8 text-center">
      <span aria-hidden className="flex h-20 w-20 items-center justify-center rounded-full bg-warn/15 text-warn">
        <WifiOff size={40} />
      </span>
      <h1 className="text-2xl font-extrabold">You&apos;re offline</h1>
      <p className="text-soft">Your saved quizzes still work. Results are sent when you are back online.</p>

      <section aria-label="What works offline" className="w-full rounded-card border border-line bg-surface p-4 text-left">
        <h2 className="font-bold">Works offline</h2>
        <ul className="mt-2 space-y-1.5 text-note">
          <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden /> Quizzes you have opened before</li>
          <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden /> Finishing a quiz and seeing your score</li>
        </ul>
        <h2 className="mt-3 font-bold">Needs internet</h2>
        <p className="mt-1 text-note text-soft">Sign-in, saving results to your account, and the AI helper.</p>
      </section>

      <div className="flex w-full flex-col gap-3">
        <RetryButton />
        <Link href="/practice" className="flex h-12 w-full items-center justify-center rounded-option border border-line bg-surface font-bold">
          Open saved quizzes
        </Link>
      </div>
    </main>
  );
}
