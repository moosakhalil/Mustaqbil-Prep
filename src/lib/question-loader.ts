import type { CourseData, Question } from "./question-types";
import type { PoolCourse } from "./quiz/build";
import type { Selection } from "./quiz/selection-logic";

// Question files are static (/data/degree/<course>.json). They are fetched once per course and kept in memory;
// the offline cache added later serves the same URLs without a connection.
const cache = new Map<string, Promise<Question[]>>();

export function loadCourse(id: string): Promise<Question[]> {
  let p = cache.get(id);
  if (!p) {
    // military banks have ids like "mil-verbal"; degree courses like "dsa"
    const url = id.startsWith("mil-") ? `/data/military/${encodeURIComponent(id.slice(4))}.json` : `/data/degree/${encodeURIComponent(id)}.json`;
    p = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load ${id} (${res.status})`);
        return res.json() as Promise<CourseData>;
      })
      .then((data) => data.questions);
    cache.set(id, p);
    p.catch(() => cache.delete(id)); // let a failed load be tried again
  }
  return p;
}

/** The questions of the ticked chapters only, per course, ready for buildQuiz. */
export async function loadPool(selection: Selection, weights: Record<string, number>): Promise<PoolCourse[]> {
  const ids = Object.keys(selection);
  const loaded = await Promise.all(ids.map(loadCourse));
  return ids.map((id, i) => {
    const units = new Set(selection[id]);
    return { id, weight: weights[id] ?? 1, questions: loaded[i].filter((q) => units.has(q.u)) };
  });
}

/** Look up single questions by id (for the wrong notebook and bookmarks). Ids look like "dsa-12". */
export async function loadQuestionsById(ids: readonly string[]): Promise<Question[]> {
  const byCourse = new Map<string, Set<string>>();
  for (const id of ids) {
    const course = id.slice(0, id.lastIndexOf("-"));
    byCourse.set(course, (byCourse.get(course) ?? new Set()).add(id));
  }
  const parts = await Promise.all([...byCourse].map(async ([course, set]) => (await loadCourse(course)).filter((q) => set.has(q.id))));
  return parts.flat();
}
