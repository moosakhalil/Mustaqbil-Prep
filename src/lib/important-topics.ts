// The topics the past initial-test questions repeat most (from the tally of the past-paper PDFs, as a share of an Academic part).
// Shown as "Most repeated in past papers" on each course page, and used for the daily suggestion when a person has no results yet.
// `degreeCourse` is the degree bank that matches the topic, for a quick 20-question quiz.

export type ImportantTopic = { id: string; title: string; share: number; covers: string; degreeCourse: string };

export const IMPORTANT_TOPICS: ImportantTopic[] = [
  { id: "networks", title: "Networks", share: 20, covers: "OSI layers, protocols and ports, IP addresses, subnetting", degreeCourse: "cn" },
  { id: "programming", title: "Programming", share: 15, covers: "OOP, languages, compilers, web basics, Git", degreeCourse: "oop" },
  { id: "security", title: "Security", share: 12, covers: "malware, attacks, encryption, firewalls, CIA", degreeCourse: "is" },
  { id: "databases", title: "Databases", share: 12, covers: "SQL, keys, normalisation, ACID", degreeCourse: "dbms" },
  { id: "basics", title: "Computer basics", share: 12, covers: "abbreviations, number systems, hardware, Linux commands", degreeCourse: "cald" },
  { id: "os", title: "Operating systems", share: 8, covers: "scheduling, memory, deadlock, processes and threads", degreeCourse: "os" },
  { id: "dsa", title: "Data structures", share: 8, covers: "stacks, queues, trees, sorting, complexity", degreeCourse: "dsa" },
  { id: "se", title: "Software engineering", share: 8, covers: "SDLC, Agile, testing, design patterns", degreeCourse: "ise" },
  { id: "cloud-ai", title: "Cloud and AI", share: 5, covers: "SaaS, PaaS, IaaS, machine learning basics", degreeCourse: "cc" },
];
