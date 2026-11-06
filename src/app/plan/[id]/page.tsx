import { redirect } from "next/navigation";
import { PlanView } from "@/components/quiz/plan-view";
import { getSession } from "@/lib/session";

export const metadata = { title: "Study plan · Mustaqbil Prep" };

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const { id } = await params;
  return <PlanView attemptId={id} />;
}
