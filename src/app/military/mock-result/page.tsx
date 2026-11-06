import { MockResult } from "@/components/military/mock-result";
import { getSession } from "@/lib/session";

export const metadata = { title: "Mock test result · Mustaqbil Prep" };

export default async function MockResultPage() {
  const session = await getSession();
  return <MockResult signedIn={!!session} />;
}
