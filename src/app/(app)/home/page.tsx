import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Check, ChevronRight, Flame } from "lucide-react";
import { AiFocusCard } from "@/components/home/ai-focus";
import { ContinueCard } from "@/components/home/quick-actions";
import { PictureCard } from "@/components/home/picture-card";
import { manifest } from "@/lib/manifest";
import { MILITARY_COURSES, isMilitaryCourse } from "@/lib/military";
import { daysLeft } from "@/lib/ai-focus";
import { getProfileInfo, getProgress } from "@/lib/server/progress";
import { pkDay } from "@/lib/streak";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Home · Mustaqbil Prep" };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Karachi" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

const nf = new Intl.NumberFormat("en");

export default async function HomePage({ searchParams }: { searchParams: Promise<{ domain?: string; course?: string }> }) {
  // old links (/home?domain=military&course=icto) still work
  const { domain, course } = await searchParams;
  if (domain === "military") redirect(isMilitaryCourse(course) ? `/home/military/${course}` : "/home/military");
  const session = await getSession();
  const user = session?.user;
  const [progress, info] = user ? await Promise.all([getProgress(user.id), getProfileInfo(user.id)]) : [null, null];
  const left = daysLeft(info?.examDate, pkDay(new Date()));
  const daysDone = progress ? progress.week.filter((d) => d.done).length : 0;
  const latest = progress?.trend.at(-1);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-soft">{greeting()}</p>
          <h1 className="text-[28px] font-extrabold leading-tight">{user ? `Hi, ${user.name.split(" ")[0]}` : "Mustaqbil Prep"}</h1>
          {user && isAdmin(user) && <span className="mt-1 inline-block rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-black">Owner</span>}
        </div>
        {progress && progress.streak > 0 && (
          <p className="flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1.5 text-note font-bold">
            <Flame size={16} className="text-gold" aria-hidden /> {progress.streak} day streak
          </p>
        )}
      </div>
      {!user && (
        <p className="mt-2 flex flex-wrap items-center gap-x-1 text-sm text-soft">
          You are a guest. <Link href="/sign-in" className="inline-flex min-h-11 items-center font-semibold text-accent">Sign in</Link> to save your results.
        </p>
      )}

      {user && (
        <Link href="/profile" className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-card border border-line bg-surface px-4">
          <span className={`flex items-center gap-2 font-bold ${left !== null ? "text-gold" : ""}`}>
            <CalendarDays size={18} className={left !== null ? "text-gold" : "text-accent"} aria-hidden />
            {left !== null ? `Your test is in ${left} ${left === 1 ? "day" : "days"}` : "Set your test date"}
          </span>
          <span className="flex items-center gap-0.5 text-sm font-bold text-accent">
            {left !== null ? "Change" : "Set"} <ChevronRight size={16} aria-hidden />
          </span>
        </Link>
      )}

      <div className="mt-5 space-y-5">
        <ContinueCard />

        <section aria-label="Choose your path" className="space-y-3">
          <h2 className="font-extrabold">Choose your path</h2>
          <div className="grid grid-cols-2 gap-3">
            <PictureCard
              href="/home/academia" art="home-academia" tone="academia"
              title="Academia" subtitle={`${manifest.totals.courses} courses`} chip={`${nf.format(manifest.totals.questions)} questions`}
            />
            <PictureCard
              href="/home/military" art="home-military" tone="military"
              title="Military" subtitle={`${MILITARY_COURSES.length} courses`} chip="Initial tests"
            />
          </div>
        </section>

        <AiFocusCard scope="home" signedIn={!!user} />

        {user && progress && (
          <Link href="/progress" className="flex min-h-14 items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-wide text-soft">
                This week{progress.quizzes > 0 ? ` · ${daysDone} of 7 days` : ""}
              </span>
              {progress.quizzes === 0 ? (
                <span className="mt-1 block font-bold">Finish a quiz to start your week</span>
              ) : (
                <>
                  <span className="sr-only">{daysDone} of 7 days practised.</span>
                  <span aria-hidden className="mt-2 flex gap-1.5">
                    {progress.week.map((d) => (
                      <span key={d.day} className={`flex h-5 w-5 items-center justify-center rounded-full ${d.done ? "bg-accent text-accent-ink" : "border border-dashed border-soft"}`}>
                        {d.done && <Check size={12} strokeWidth={3} />}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </span>
            {latest !== undefined ? (
              <span className="shrink-0 text-right">
                <span className="block text-xl font-extrabold tabular-nums">{latest}%</span>
                <span className="block text-note text-soft">latest quiz</span>
              </span>
            ) : (
              <ChevronRight size={20} className="shrink-0 text-soft" aria-hidden />
            )}
          </Link>
        )}
      </div>
    </>
  );
}
