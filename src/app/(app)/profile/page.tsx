import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DeleteAccount, ExamDate, ExportData, FreshSwitch, OfflineSave, PreferredCourse, SignOut, ThemeSwitcher } from "@/components/profile/profile-controls";
import { AI_DAILY_LIMIT, aiUsedToday } from "@/lib/server/ai-usage";
import { getProfileInfo } from "@/lib/server/progress";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Profile · Mustaqbil Prep" };

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section aria-label={title} className="mt-4 rounded-card border border-line bg-surface p-4">
    <h2 className="text-xs font-bold uppercase tracking-wide text-soft">{title}</h2>
    <div className="mt-3 space-y-4">{children}</div>
  </section>
);

const Sub = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="font-bold">{title}</h3>
    {children}
  </div>
);

const Row = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="flex min-h-11 items-center justify-between gap-3 border-t border-line py-2 text-sm font-semibold first:border-t-0">
    {children}
    <ChevronRight size={18} className="shrink-0 text-soft" aria-hidden />
  </Link>
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold">{user.name}</p>
              <p className="truncate text-sm text-soft">{user.email}</p>
            </div>
            {isAdmin(user) && <span className="shrink-0 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-black">Owner</span>}
          </div>
          {isAdmin(user) && (
            <div className="mt-3 flex gap-2">
              <Link href="/admin/military" className="flex h-11 flex-1 items-center justify-center rounded-option bg-gold px-3 text-sm font-bold text-black">Military setup</Link>
              <Link href="/admin/feedback" className="flex h-11 flex-1 items-center justify-center rounded-option bg-gold px-3 text-sm font-bold text-black">Feedback inbox</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-line bg-surface p-4">
          <p className="text-soft">You are using Mustaqbil Prep as a guest. Sign in to save results and use the AI helper.</p>
          <Link href="/sign-in" className="mt-3 inline-flex h-12 items-center rounded-option bg-accent px-5 font-bold text-accent-ink">Sign in</Link>
        </div>
      )}

      {user && (
        <Card title="Study">
          <Sub title="Preferred military course">
            <p className="text-sm text-soft">It shows first on the Military screen, with a Preferred tag. Tap again to clear.</p>
            <PreferredCourse initial={preferred} />
          </Sub>
          <Sub title="Questions">
            <p className="text-sm text-soft">A new quiz takes questions you have not seen yet, and brings back about 1 in 5 that you got wrong. When you have seen them all, it starts again from the oldest.</p>
            <FreshSwitch initial={info?.freshFirst ?? true} />
          </Sub>
          <Sub title="Your test date">
            <p className="text-sm text-soft">The day of your real test. Home counts the days left and the AI study suggestion fits its advice to it.</p>
            <ExamDate initial={info?.examDate ?? null} />
          </Sub>
        </Card>
      )}

      <Card title="App">
        <Sub title="Appearance">
          <ThemeSwitcher />
        </Sub>
        <Sub title="Offline">
          <OfflineSave />
        </Sub>
      </Card>

      {user && (
        <section aria-label="AI helper" className="mt-4 rounded-card border border-line bg-surface p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-soft">AI helper</h2>
          <p className="mt-2 text-sm">
            <b>{Math.max(0, AI_DAILY_LIMIT - used)} of {AI_DAILY_LIMIT}</b> requests left today. Saved explanations are free. The count resets at midnight, Pakistan time.
          </p>
        </section>
      )}

      <Card title={user ? "Your data" : "More"}>
        {user && <ExportData />}
        <div>
          {user && <Row href="/feedback">Send feedback or study material</Row>}
          <Row href="/install">Put the app on my home screen</Row>
          <Row href="/sources">Where the questions come from</Row>
          <Row href="/privacy">Privacy</Row>
          <Row href="/terms">Terms</Row>
        </div>
      </Card>

      {user && (
        <>
          <div className="mt-4">
            <SignOut />
          </div>
          <div className="mt-10">
            <DeleteAccount />
          </div>
        </>
      )}
    </>
  );
}
