// The Study guide: the shape of a lesson. Lessons are plain data, so the lesson page, the quiz bulb, the AI helper and the tests all read the same text.

/** The four parts of the guide. `ssc` is the Academic past papers of ICTO, LCC, Navy IT and PAF IT (they share one set of banks); `pma` is PMA Long Course. */
export type GuideGroupId = "verbal" | "nonverbal" | "ssc" | "pma";

/** One numbered step of "The trick". */
export type Step = { head: string; text: string };

/** A solved example: the question, the working line by line, and the answer. */
export type WorkedExample = { prompt: string; lines: string[]; answer: string };

/**
 * A short list of facts under a heading. `match` is a regular expression (source text, matched without regard to case) over the question text
 * of the lesson's past-paper bank: the page counts how many past questions touch this group. A question can fit more than one group.
 */
export type FactGroup = { title: string; facts: string[]; match?: string };
// A fact is one short idea. A key word in [[double square brackets]] is shown in bold (see markup.ts).

export type Block =
  | { kind: "steps"; title: string; steps: Step[] }
  | { kind: "text"; title: string; paragraphs: string[] }
  | { kind: "examples"; title: string; items: WorkedExample[] }
  | { kind: "table"; title: string; head: string[]; rows: string[][]; note?: string }
  | { kind: "watch"; text: string }
  | { kind: "facts"; title: string; groups: FactGroup[]; note?: string }
  /** A real question of the Non-verbal bank, shown with its figures, the right option and the bank's own explanation. */
  | { kind: "bankExample"; title: string; questionId: string }
  /** Every past question of a bank as "question, answer" lines, with a search box. Built from the bank itself, so it can never disagree with the quiz. */
  | { kind: "bankFacts"; title: string; bank: string };

/** Where "Try questions" takes its questions from. `{course}` in `bank` is replaced by the student's own course (ICTO, LCC, Navy IT or PAF IT). */
export type PracticeSource = { bank: string; units?: number[] };

export type Lesson = {
  /** Unique inside its group. Part of the page address: /guide/<group>/<id>. */
  id: string;
  group: GuideGroupId;
  title: string;
  /** One plain sentence for the list. */
  summary: string;
  /** Rough reading time. */
  minutes: number;
  blocks: Block[];
  /** The questions "Try questions" uses. A lesson may have a different source for PMA LC (its Verbal is its own bank). */
  practice: { default: PracticeSource; "pma-lc"?: PracticeSource };
};
