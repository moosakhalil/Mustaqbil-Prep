import "server-only";
import { manifest } from "@/lib/manifest";
import { militaryManifest } from "@/lib/military-data";
import type { CourseData, Question } from "@/lib/question-types";

// The server must use its own copy of a question, never text sent by the browser (otherwise someone could
// put wrong text into the shared explanation cache). Question files are static, so they are fetched from this site once and kept in memory.
const cache = new Map<string, Promise<Question[]>>();

function loadCourse(origin: string, course: string): Promise<Question[]> {
  let p = cache.get(course);
  if (!p) {
    // military banks have ids like "mil-academic-icto-pp-networks"; degree courses like "dsa"
    const url = course.startsWith("mil-") ? `${origin}/data/military/${encodeURIComponent(course.slice(4))}.json` : `${origin}/data/degree/${encodeURIComponent(course)}.json`;
    p = fetch(url, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`question file ${course}: ${r.status}`);
        return r.json() as Promise<CourseData>;
      })
      .then((d) => d.questions);
    cache.set(course, p);
    p.catch(() => cache.delete(course));
  }
  return p;
}

/** One question by id such as "dsa-12" (degree) or "mil-academic-icto-pp-networks-12" (military), or null if there is no such question. */
export async function findQuestion(origin: string, id: string): Promise<Question | null> {
  const cut = id.lastIndexOf("-");
  if (cut < 1) return null;
  const course = id.slice(0, cut);
  const known = course.startsWith("mil-") ? militaryManifest.banks.some((b) => b.code === course) : manifest.courses.some((c) => c.id === course);
  if (!known) return null;
  return (await loadCourse(origin, course)).find((q) => q.id === id) ?? null;
}
