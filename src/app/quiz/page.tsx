import { QuizRunner } from "@/components/quiz/runner";
import { getSession } from "@/lib/session";

export const metadata = { title: "Quiz · Mustaqbil Prep" };

export default async function QuizPage() {
  const session = await getSession();
  return <QuizRunner signedIn={!!session} />;
}
