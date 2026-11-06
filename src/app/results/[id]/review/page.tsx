import { notFound, redirect } from "next/navigation";
import { ReviewView } from "@/components/quiz/review-view";
import { getSavedAttempt } from "@/lib/server/attempts";
import { getSession } from "@/lib/session";

export const metadata = { title: "Review · Mustaqbil Prep" };

export default async function SavedReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const { id } = await params;
  const attempt = await getSavedAttempt(session.user.id, id);
  if (!attempt) notFound();
  return <ReviewView signedIn attempt={attempt} backHref={`/results/${id}`} />;
}
