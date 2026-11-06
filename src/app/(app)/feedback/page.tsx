import Link from "next/link";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { BackHeader } from "@/components/home/back-header";

export const metadata = { title: "Feedback · Mustaqbil Prep" };

export default function FeedbackPage() {
  return (
    <>
      <BackHeader title="Feedback" href="/profile" label="Profile" />
      <p className="text-sm text-soft">Tell the owner what works, what does not, and what you would like to see. If you have helpful study material, send it and it will be added.</p>
      <FeedbackForm />
      <p className="mt-6 text-xs text-soft">
        Where the questions come from: <Link href="/sources" className="font-bold text-accent">Sources</Link>
      </p>
    </>
  );
}
