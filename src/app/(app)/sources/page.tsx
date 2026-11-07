import Link from "next/link";
import { BackHeader } from "@/components/home/back-header";
import { MATERIAL_EMAIL } from "@/lib/contact";
import { manifest } from "@/lib/manifest";
import { SourcesList, type SourceItem } from "./sources-list";

export const metadata = { title: "Sources · Mustaqbil Prep" };

const nf = new Intl.NumberFormat("en");

// The degree numbers come from the question files, so they never go stale. The military counts are typed by hand, so they say "about".
const ITEMS: SourceItem[] = [
  {
    id: "degree", kind: "Degree",
    title: `Degree courses (${manifest.totals.courses} banks)`,
    short: `${nf.format(manifest.totals.questions)} questions · prepared by the owner`,
    text: "Question banks for the software-engineering degree courses, prepared by the owner for this app.",
  },
  {
    id: "basics", kind: "Military", title: "Computer Basics",
    short: "About 299 questions · written by Claude from past-test topics",
    text: "299 practice questions written by Claude (an AI assistant) from the topics that repeat in past initial tests. Every answer was checked.",
  },
  {
    id: "past", kind: "Military", title: "Past Papers",
    short: "From notes shared by Sir Bilal Arif and Major (R) Muhammad Arif",
    text: "Questions collected from study notes shared by Sir Bilal Arif and Major (R) Muhammad Arif (past-paper and repeated-question notes). Wrong answer keys were corrected and unclear questions were removed. Short explanations were written by Claude.",
  },
  {
    id: "verbal", kind: "Military", title: "Verbal",
    short: "About 195 questions · ISSB test, Claude and recalled questions",
    text: "The first 39 questions come from the ISSB School of Excellence verbal test. 50 practice questions were written by Claude. 106 are repeated questions recalled by candidates and shared by the owner, with the answers worked out again and corrected where the recalled answer was wrong. Each group is named in its chapter name.",
  },
  {
    id: "nonverbal", kind: "Military", title: "Non-verbal",
    short: "About 216 picture questions · shared set, practice book and drawn by code",
    text: "The first 18 picture questions come from a shared set of figure-analogy puzzles. 48 more come from a practice book (Career Finder, ISSB) shared by the owner, with the answers taken from the book's own answer key. 150 more were drawn by code and written by Claude. Each group is named in its chapter name.",
  },
  {
    id: "navy", kind: "Military", title: "Calculus and Probability (Navy IT)",
    short: "Written by Claude · follows the OpenStax outlines",
    text: "Practice questions written by Claude. Topic coverage follows the OpenStax Calculus and Introductory Statistics outlines (CC BY 4.0, openstax.org).",
  },
  {
    id: "ai", kind: "AI", title: "AI explanations, study plan and coach",
    short: "Made by AI from your results. It can make mistakes.",
    text: "Made by an AI model from your results and the question text. They can make mistakes, so use them as a guide.",
  },
];

export default function SourcesPage() {
  return (
    <>
      <BackHeader title="Sources" href="/profile" label="Profile" variant="bar" />
      <p className="mt-1 text-sm text-soft">Where the questions and help in this app come from. All questions are practice material. They are not official papers.</p>
      <SourcesList items={ITEMS} />
      <p className="mt-5 text-sm">
        Something wrong, or material to share? Use{" "}
        <Link href="/feedback" className="inline-flex min-h-11 items-center font-bold text-accent">Feedback</Link>
        {" "}or email{" "}
        <a href={`mailto:${MATERIAL_EMAIL}`} className="inline-flex min-h-11 items-center font-bold text-accent">{MATERIAL_EMAIL}</a>.
      </p>
    </>
  );
}
