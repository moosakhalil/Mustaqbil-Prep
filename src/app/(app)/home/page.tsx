import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
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
          <p className="flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1.5 text-xs font-bold">
            <Flame size={14} className="text-gold" aria-hidden /> {progress.streak} day streak
          </p>
        )}
      </div>
      {!user && (
        <p className="mt-2 text-sm text-soft">
          You are a guest. <Link href="/sign-in" className="font-semibold text-accent">Sign in</Link> to save your results.
        </p>
      )}

      {user && (
        <p className="mt-2 text-sm">
          {left !== null ? (
            <Link href="/profile" className="font-bold text-gold">Your test is in {left} {left === 1 ? "day" : "days"}</Link>
          ) : (
            <Link href="/profile" className="font-semibold text-accent">Set your test date</Link>
          )}
        </p>
      )}

      <div className="mt-5 space-y-5">
        <ContinueCard />
        <AiFocusCard scope="home" signedIn={!!user} />

        <section aria-label="Choose your path" className="space-y-3">
          <h2 className="font-extrabold">Choose your path</h2>
          <PictureCard
            size="wide" href="/home/academia" art="home-academia" tone="academia"
            title="Academia" subtitle="Software degree · 25 courses" chip={`${nf.format(manifest.totals.questions)} questions`}
          />
          <PictureCard
            size="wide" href="/home/military" art="home-military" tone="military"
            title="Military" subtitle={MILITARY_COURSES.map((c) => c.title).join(" · ")} chip="Initial test prep"
          />
        </section>

        {user && (
          <Link href="/feedback" className="block text-center text-sm font-semibold text-accent">Send feedback or share study material</Link>
        )}

        {user && progress && (
          <Link href="/progress" className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
            <span>
              <span className="block text-xs font-bold uppercase tracking-wide text-soft">This week</span>
              <span className="block font-bold">
                {progress.quizzes === 0 ? "Finish a quiz to start your week" : `${daysDone} of 7 days practised${latest !== undefined ? ` · latest quiz ${latest}%` : ""}`}
              </span>
            </span>
            <span aria-hidden className="text-soft">›</span>
          </Link>
        )}
      </div>
    </>
  );
}
