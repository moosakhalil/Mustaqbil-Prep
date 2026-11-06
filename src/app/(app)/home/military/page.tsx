import Link from "next/link";
import { Banner, PictureCard, type Tone } from "@/components/home/picture-card";
import { BackHeader } from "@/components/home/back-header";
import { MILITARY_COURSES, MILITARY_GROUPS, isMilitaryCourse } from "@/lib/military";
import { IssbCard } from "@/components/military/issb-card";
import { PASS_MARK } from "@/lib/military-rules";
import { getPreferredCourse } from "@/lib/server/progress";
import { getFeatureVote } from "@/lib/server/votes";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Military · Mustaqbil Prep" };

/** Military: the courses, in two groups (Army, Short Service Commission). The preferred course is first in its group. */
export default async function MilitaryPage() {
  const session = await getSession();
  const user = session?.user;
  const [preferred, issbVote] = user ? await Promise.all([getPreferredCourse(user.id), getFeatureVote(user.id, "issb")]) : [null, null];
  const pref = isMilitaryCourse(preferred) ? preferred : null;

  return (
    <>
      <BackHeader title="Military" color="text-military" />
      <Banner art="home-military" tone="military" title="Initial test preparation" subtitle="Verbal · Non-verbal · Academic" />

      <div className="mt-5 space-y-6">
        {MILITARY_GROUPS.map((g) => {
          const list = MILITARY_COURSES.filter((c) => c.group === g.id).sort((a, b) => Number(b.id === pref) - Number(a.id === pref));
          return (
            <section key={g.id} aria-label={g.title}>
              <h2 className="flex items-center gap-3 text-xs font-extrabold uppercase tracking-wide text-soft">
                {g.title} <span aria-hidden className="h-px flex-1 bg-line" />
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {list.map((c) => (
                  <PictureCard key={c.id} href={`/home/military/${c.id}`} art={`course-${c.id}`} tone={c.id as Tone} title={c.title} subtitle={c.blurb} preferred={c.id === pref} logo={`logo-${c.id}`} />
                ))}
              </div>
            </section>
          );
        })}

        <section aria-label="Coming soon">
          <h2 className="flex items-center gap-3 text-xs font-extrabold uppercase tracking-wide text-soft">
            Coming soon <span aria-hidden className="h-px flex-1 bg-line" />
          </h2>
          <div className="mt-2">
            <IssbCard initialVote={issbVote} />
          </div>
        </section>

        <p className="rounded-card border border-line bg-surface p-4 text-sm">
          <span className="block text-xs text-soft">Pass rule</span>
          <b>{PASS_MARK}% in each part to go on to the next round</b>
        </p>

        {user && isAdmin(user) && (
          <Link href="/admin/military" className="inline-flex min-h-12 items-center text-sm font-bold text-accent">
            Owner: Military setup (subjects and test pattern)
          </Link>
        )}
      </div>
    </>
  );
}
