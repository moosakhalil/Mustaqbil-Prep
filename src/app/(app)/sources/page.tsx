import Link from "next/link";
import { BackHeader } from "@/components/home/back-header";
import { MATERIAL_EMAIL } from "@/lib/contact";

export const metadata = { title: "Sources · Mustaqbil Prep" };

const ROWS: { title: string; text: string }[] = [
  { title: "Degree courses (25 banks)", text: "Question banks for the software-engineering degree courses, prepared by the owner for this app." },
  { title: "Computer Basics (military)", text: "299 practice questions written by Claude (an AI assistant) from the topics that repeat in past initial tests. Every answer was checked." },
  { title: "Past Papers (military)", text: "Questions collected from study notes shared by Sir Bilal Arif and Major (R) Muhammad Arif (past-paper and repeated-question notes). Wrong answer keys were corrected and unclear questions were removed. Short explanations were written by Claude." },
  { title: "Verbal (military)", text: "The first 39 questions come from the ISSB School of Excellence verbal test. 50 practice questions were written by Claude. 106 are repeated questions recalled by candidates and shared by the owner, with the answers worked out again and corrected where the recalled answer was wrong. Each group is named in its chapter name." },
  { title: "Non-verbal (military)", text: "The first 18 picture questions come from a shared set of figure-analogy puzzles. 48 more come from a practice book (Career Finder, ISSB) shared by the owner, with the answers taken from the book's own answer key. 150 more were drawn by code and written by Claude. Each group is named in its chapter name." },
  { title: "Calculus and Probability (Navy IT)", text: "Practice questions written by Claude. Topic coverage follows the OpenStax Calculus and Introductory Statistics outlines (CC BY 4.0, openstax.org)." },
  { title: "AI explanations, study plan and coach", text: "Made by an AI model from your results and the question text. They can make mistakes, so use them as a guide." },
];

export default function SourcesPage() {
  return (
    <>
      <BackHeader title="Sources" href="/profile" label="Profile" />
      <p className="text-sm text-soft">Where the questions and help in this app come from. All questions are practice material. They are not official papers.</p>
      <ul className="mt-4 space-y-3">
        {ROWS.map((r) => (
          <li key={r.title} className="rounded-card border border-line bg-surface p-4">
            <p className="font-bold">{r.title}</p>
            <p className="mt-1 text-sm text-soft">{r.text}</p>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm">
        Something wrong, or material to share? Use <Link href="/feedback" className="font-bold text-accent">Feedback</Link> or email <a href={`mailto:${MATERIAL_EMAIL}`} className="font-bold text-accent">{MATERIAL_EMAIL}</a>.
      </p>
    </>
  );
}
