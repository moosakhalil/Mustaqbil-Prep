import type { Lesson } from "./types";

// Quick-facts pages for PMA Long Course. PMA Academic is its own past tests only. Each page is a short how-to-revise note and then the subject's past questions
// with their answers, built from the bank itself, so the facts can never disagree with the quiz.

const pma = (id: string, rest: Omit<Lesson, "group" | "practice" | "id" | "blocks"> & { bank: string; intro: string }): Lesson => ({
  id,
  group: "pma",
  title: rest.title,
  summary: rest.summary,
  minutes: rest.minutes,
  practice: { default: { bank: rest.bank } },
  blocks: [
    {
      kind: "steps",
      title: "How to revise these",
      steps: [
        { head: "Read the list once.", text: rest.intro },
        { head: "Cover the answer.", text: "Read a question, say the answer to yourself, then check it. Mark the ones you got wrong." },
        { head: "Practise, then read the misses again.", text: "Use \"Try questions\" below. Facts stick when you meet them again after a short break." },
      ],
    },
    { kind: "bankFacts", title: "Past questions and their answers", bank: rest.bank },
  ],
});

export const PMA_LESSONS: Lesson[] = [
  pma("most-repeated", {
    title: "Most repeated set",
    summary: "The questions that came again and again in past PMA tests. Start here.",
    minutes: 6,
    bank: "academic-pma-lc-most-repeated",
    intro: "These questions came again and again in past PMA tests, so they are the best ones to know first.",
  }),
  pma("geography", {
    title: "Geography and world",
    summary: "Countries, capitals, rivers, seas and places in Pakistan and the world.",
    minutes: 6,
    bank: "academic-pma-lc-geography",
    intro: "Go through the places and their facts. A short map picture in your head helps (which country, which side of the sea).",
  }),
  pma("islamiat", {
    title: "Islamiat",
    summary: "The Quran, the Prophets, the Companions, the Caliphs and the pillars of Islam.",
    minutes: 6,
    bank: "academic-pma-lc-islamiat",
    intro: "Go through the names, titles and dates. Each answer comes with a short reason, so open it when you are unsure.",
  }),
  pma("pak-studies", {
    title: "Pakistan Studies and history",
    summary: "The freedom movement, reforms, resolutions, leaders and dates.",
    minutes: 6,
    bank: "academic-pma-lc-pak-studies",
    intro: "Go through the dates and names. Put the events in order on a line: reforms, reports, missions, the resolution, independence and what followed.",
  }),
  pma("maths-science-english", {
    title: "Maths, science and English",
    summary: "Short maths and science questions, and word meanings.",
    minutes: 4,
    bank: "academic-pma-lc-maths-science-english",
    intro: "Go through the short answers. For the arithmetic ones, work them out yourself before you open the answer.",
  }),
  pma("gk-defence", {
    title: "General knowledge and defence",
    summary: "Awards, sport, world bodies, Pakistan firsts and defence facts.",
    minutes: 4,
    bank: "academic-pma-lc-gk-defence",
    intro: "Go through the names, years and places. Awards and sport results change, so learn the ones in this list.",
  }),
];
