import { PASS_MARK } from "@/lib/military-rules";
import type { Block } from "./types";

// "Exam tips and pass plan": plain advice. It states only what the app itself knows (the pass line, how the app works), and sends the student to the official notice for anything else.

export const TIPS_BLOCKS: Block[] = [
  {
    kind: "text",
    title: "The pass line",
    paragraphs: [`You need ${PASS_MARK}% or more in each of the three parts: Verbal, Non-verbal and Academic. A high score in one part does not make up for a low score in another, so give the weakest part your time first.`],
  },
  {
    kind: "steps",
    title: "Your plan, step by step",
    steps: [
      { head: "Read one lesson.", text: "Each one takes about 3 to 5 minutes. Start with the top lesson in Verbal and the top topic in Academic. They repeat the most." },
      { head: "Try the questions at the end.", text: "The button at the bottom of the lesson gives you a few questions on that topic straight away." },
      { head: "Open your result.", text: "\"Fix this first\" shows your weakest topic and takes you to its lesson. Read it, then practise again." },
      { head: "Take a full mock test.", text: "When your practice scores are at or above the pass line in every part, take the Full mock test on your course page to feel the real thing." },
    ],
  },
  {
    kind: "steps",
    title: "In the exam",
    steps: [
      { head: "Start with what you know.", text: "Answer the questions you are sure about first. They are the marks you can collect fastest." },
      { head: "Do not get stuck.", text: "If one question takes much longer than the others, flag it, move on, and come back at the end if there is time. In the mock test you can flag a question for review." },
      { head: "Know the rules of your test.", text: "Check the official notice for your test for how wrong answers are marked and how long each part is. The counts and times in this app's mock test may be examples until the real pattern is set." },
    ],
  },
  {
    kind: "table",
    title: "One-line reminders",
    head: ["Topic", "Remember"],
    rows: [
      ["Percentages", "Find 10% first, then build the percent from pieces."],
      ["Days and dates", "Gap divided by 7. Keep only the remainder."],
      ["Series", "Write the gaps. If they change, write the gaps of the gaps."],
      ["Speed and work", "Get the rate for one minute (or one man), then multiply."],
      ["Subnetting", "Jump = 256 minus the mask number. Network = start of the block. Broadcast = next block minus 1."],
      ["Picture puzzles", "Say the change in words before you look at the options."],
    ],
  },
];
