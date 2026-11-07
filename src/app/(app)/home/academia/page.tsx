import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Banner } from "@/components/home/picture-card";
import { BackHeader } from "@/components/home/back-header";
import { CourseCarousel } from "@/components/home/course-carousel";
import { ContinueCard, CourseTile, DailyTen, NotebookTile, WeakRow } from "@/components/home/quick-actions";
import { manifest } from "@/lib/manifest";
import { getProgress } from "@/lib/server/progress";
import { getSession } from "@/lib/session";

export const metadata = { title: "Academia · Mustaqbil Prep" };

const TILES = ["cn", "dbms", "oop", "os", "dsa", "sda"];
const nf = new Intl.NumberFormat("en");

/** Academia: the software degree courses (everything the old Software Degree home had). */
export default async function AcademiaPage() {
  const session = await getSession();
  const user = session?.user;
  const progress = user ? await getProgress(user.id) : null;

  return (
    <>
      <BackHeader title="Academia" color="text-accent" />
      <Banner art="home-academia" tone="academia" title="Software degree" subtitle={`${manifest.totals.courses} courses · ${nf.format(manifest.totals.questions)} questions`} />

      <div className="mt-5 space-y-5">
        <ContinueCard variant="row" />
        <div className="flex gap-3">
          <DailyTen />
          <NotebookTile signedIn={!!user} count={progress?.toRevise ?? 0} />
        </div>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">Start a quiz</h2>
            <Link href="/practice" className="-mr-2 inline-flex min-h-11 items-center gap-0.5 px-2 text-sm font-bold text-accent">
              See all {manifest.courses.length} <ChevronRight size={16} aria-hidden />
            </Link>
          </div>
          <CourseCarousel label="Courses. Swipe sideways for more.">
            {TILES.map((id) => (
              <CourseTile key={id} id={id} />
            ))}
          </CourseCarousel>
        </section>

        {progress && progress.weak.length > 0 && (
          <section>
            <h2 className="font-extrabold">Needs work</h2>
            <div className="mt-2 space-y-2">
              {progress.weak.map((w) => (
                <WeakRow key={`${w.course}:${w.unit}`} course={w.course} unit={w.unit} percent={w.percent} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
