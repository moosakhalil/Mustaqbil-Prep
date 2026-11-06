import { requireSession } from "@/lib/session";
// Saved results open without the bottom navigation, like the quiz screens.
export default async function ResultsLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <main className="mx-auto w-full max-w-md px-5 pb-8 pt-4">{children}</main>;
}
