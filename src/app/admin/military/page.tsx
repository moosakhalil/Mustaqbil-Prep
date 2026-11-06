import { notFound } from "next/navigation";
import { MilitarySetup } from "@/components/military/military-setup";
import { MILITARY_COURSES } from "@/lib/military";
import { getPattern, getSubjects } from "@/lib/server/military";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Military setup · Mustaqbil Prep" };

// Owner only. Everyone else gets a plain "not found".
export default async function MilitarySetupPage() {
  const session = await getSession();
  if (!session || !isAdmin(session.user)) notFound();

  const ids = MILITARY_COURSES.map((c) => c.id);
  const [subjects, patterns] = await Promise.all([Promise.all(ids.map(getSubjects)), Promise.all(ids.map(getPattern))]);

  return (
    <MilitarySetup
      subjects={Object.fromEntries(ids.map((id, i) => [id, subjects[i]]))}
      patterns={Object.fromEntries(ids.map((id, i) => [id, patterns[i]]))}
    />
  );
}
