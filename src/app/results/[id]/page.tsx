import { notFound, redirect } from "next/navigation";
import { ResultView } from "@/components/quiz/result-view";
import { getSavedAttempt } from "@/lib/server/attempts";
import { getSession } from "@/lib/session";

export const metadata = { title: "Result · Mustaqbil Prep" };

export default async function SavedResultPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const { id } = await params;
  const attempt = await getSavedAttempt(session.user.id, id);
  if (!attempt) notFound();
  return <ResultView signedIn attempt={attempt} reviewHref={`/results/${id}/review`} />;
}
