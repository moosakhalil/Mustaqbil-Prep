import { ReviewView } from "@/components/quiz/review-view";
import { getSession } from "@/lib/session";

export const metadata = { title: "Review · Mustaqbil Prep" };

export default async function ReviewPage() {
  const session = await getSession();
  return <ReviewView signedIn={!!session} />;
}
