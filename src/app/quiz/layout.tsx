import { requireSession } from "@/lib/session";
// Quiz screens have no bottom navigation, so the student stays focused. The person must be signed in.
export default async function QuizLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <main className="mx-auto w-full max-w-md px-5 pb-8 pt-4">{children}</main>;
}
