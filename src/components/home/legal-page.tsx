import Link from "next/link";
import { Mail } from "lucide-react";
import { LegalBackButton } from "./legal-back-button";

export const LEGAL_UPDATED = "7 November 2026";

/** A section title on Privacy and Terms: clearly bigger than the text under it. */
export function LegalHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-3 text-xl font-extrabold">{children}</h2>;
}

/** The shared frame of the Privacy and Terms pages: Back button, title, date, the text, and a contact line. */
export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md space-y-3 px-5 py-6 text-[15px] leading-relaxed">
      <LegalBackButton />
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="text-note text-soft">
        {intro ? `${intro} ` : ""}Last updated {LEGAL_UPDATED}.
      </p>
      {children}
      <div className="mt-6 flex items-center gap-3 rounded-card border border-line bg-surface p-4">
        <Mail size={20} className="shrink-0 text-accent" aria-hidden />
        <p className="text-sm">
          <b>Questions?</b> Write to the owner from{" "}
          <Link href="/feedback" className="inline-flex min-h-11 items-center font-bold text-accent underline">Feedback</Link>.
        </p>
      </div>
    </main>
  );
}
