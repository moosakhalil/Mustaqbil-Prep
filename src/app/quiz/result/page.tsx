import { ResultView } from "@/components/quiz/result-view";
import { getSession } from "@/lib/session";

export const metadata = { title: "Results · Mustaqbil Prep" };

export default async function ResultPage() {
  const session = await getSession();
  return <ResultView signedIn={!!session} />;
}
