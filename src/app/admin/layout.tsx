import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <main className="mx-auto w-full max-w-md px-5 pb-10 pt-4">
      <Link href="/profile" className="inline-flex min-h-12 items-center gap-1 text-sm font-semibold text-accent">
        <ChevronLeft size={18} aria-hidden /> Profile
      </Link>
      {children}
    </main>
  );
}
