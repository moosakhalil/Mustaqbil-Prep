import Link from "next/link";
import { DeleteAccount, ExamDate, ExportData, FreshSwitch, OfflineSave, PreferredCourse, SignOut, ThemeSwitcher } from "@/components/profile/profile-controls";
import { AI_DAILY_LIMIT, aiUsedToday } from "@/lib/server/ai-usage";
import { getProfileInfo } from "@/lib/server/progress";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Profile · Mustaqbil Prep" };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-6">
    <h2 className="text-xs font-bold uppercase tracking-wide text-soft">{title}</h2>
    <div className="mt-2 space-y-3">{children}</div>
  </section>
);

export default async function ProfilePage() {
  const session = await getSession();
  const user = session?.user;
  const [info, used] = user ? await Promise.all([getProfileInfo(user.id), aiUsedToday(user.id)]) : [null, 0];
  const preferred = info?.preferredCourse ?? null;

  return (
    <>
      <h1 className="text-lg font-bold">Profile</h1>

      {user ? (
        <div className="mt-4 rounded-card border border-line bg-surface p-4">
          <p className="font-bold">{user.name}</p>
          <p className="text-sm text-soft">{user.email}</p>
          {isAdmin(user) && (
            <p className="mt-2">
              <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-black">Owner</span>{" "}
              <Link href="/admin/military" className="text-sm font-bold text-accent">Military setup</Link>{" "}
              <Link href="/admin/feedback" className="text-sm font-bold text-accent">Feedback inbox</Link>
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-line bg-surface p-4">
          <p className="text-soft">You are using Mustaqbil Prep as a guest. Sign in to save results and use the AI helper.</p>
          <Link href="/sign-in" className="mt-3 inline-flex h-12 items-center rounded-option bg-accent px-5 font-bold text-accent-ink">Sign in</Link>
        </div>
      )}

      <Section title="Appearance">
        <ThemeSwitcher />
      </Section>

      <Section title="Offline">
        <OfflineSave />
      </Section>

      {user && (
        <>
          <Section title="Preferred military course">
            <p className="text-sm text-soft">It shows first on the Military screen, with a Preferred tag. Tap again to clear.</p>
            <PreferredCourse initial={preferred} />
          </Section>

          <Section title="Questions">
            <p className="text-sm text-soft">A new quiz takes questions you have not seen yet, and brings back about 1 in 5 that you got wrong. When you have seen them all, it starts again from the oldest.</p>
            <FreshSwitch initial={info?.freshFirst ?? true} />
          </Section>

          <Section title="Your test date">
            <p className="text-sm text-soft">The day of your real test. Home counts the days left and the AI study suggestion fits its advice to it.</p>
            <ExamDate initial={info?.examDate ?? null} />
          </Section>

          <Section title="AI helper">
            <p className="rounded-card border border-line bg-surface p-4 text-sm">
              <b>{Math.max(0, AI_DAILY_LIMIT - used)} of {AI_DAILY_LIMIT}</b> requests left today. Saved explanations are free. The count resets at midnight, Pakistan time.
            </p>
          </Section>

          <Section title="Install">
            <Link href="/install" className="flex h-12 items-center justify-center rounded-option border border-line font-bold">Put the app on my home screen</Link>
          </Section>

          <Section title="Feedback">
            <Link href="/feedback" className="flex h-12 items-center justify-center rounded-option bg-accent font-bold text-accent-ink">Send feedback or study material</Link>
            <Link href="/sources" className="flex h-12 items-center justify-center rounded-option border border-line font-bold">Where the questions come from</Link>
          </Section>

          <Section title="Your data">
            <ExportData />
            <DeleteAccount />
          </Section>

          <div className="mt-6">
            <SignOut />
          </div>
        </>
      )}

      <p className="mt-8 flex justify-center gap-4 text-xs text-soft">
        <Link href="/privacy" className="font-semibold">Privacy</Link>
        <Link href="/terms" className="font-semibold">Terms</Link>
      </p>
    </>
  );
}
