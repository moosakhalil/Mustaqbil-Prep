import { BottomNav } from "@/components/bottom-nav";
import { requireSession } from "@/lib/session";

// Military screens keep the bottom navigation (the Home tab stays active through /home).
export default async function MilitaryLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <>
      <main className="mx-auto w-full max-w-md px-5 pb-24 pt-4">{children}</main>
      <BottomNav />
    </>
  );
}
