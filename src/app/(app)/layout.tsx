import { BottomNav } from "@/components/bottom-nav";
import { requireSession } from "@/lib/session";

// Screens with the four-tab bottom navigation. Everyone must be signed in (the sign-in page is the only way in).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <>
      <main className="mx-auto w-full max-w-md px-5 pb-24 pt-6">{children}</main>
      <BottomNav />
    </>
  );
}
