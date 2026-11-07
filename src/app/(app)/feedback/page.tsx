import Link from "next/link";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { BackHeader } from "@/components/home/back-header";
import { FEEDBACK_KINDS } from "@/lib/contact";

export const metadata = { title: "Feedback · Mustaqbil Prep" };

// "?kind=material" opens the form with "Study material" already chosen (used by the "Know a better source?" card on the result screen)
export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const initialKind = FEEDBACK_KINDS.find((k) => k.id === kind)?.id;
  return (
    <>
      <BackHeader title="Feedback" href="/profile" label="Profile" />
      <p className="text-sm text-soft">Tell the owner what works, what does not, and what you would like to see. If you have helpful study material, send it and it will be added.</p>
      <FeedbackForm initialKind={initialKind} />
      <p className="mt-4 flex min-h-11 flex-wrap items-center gap-x-2 text-xs text-soft">
        Where the questions come from:
        <Link href="/sources" className="inline-flex min-h-11 items-center font-bold text-accent">Sources</Link>
      </p>
    </>
  );
}
