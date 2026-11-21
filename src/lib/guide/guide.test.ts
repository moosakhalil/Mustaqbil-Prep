import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bankById, militaryManifest } from "@/lib/military-data";
import type { Question } from "@/lib/question-types";
import {
  ALL_LESSONS, GROUP_IDS, SSC_COURSES, findLesson, guideCourse, guideStartCard, hasAiHelper, isLessonKey, jumpLinks, lessonHref, lessonKey, lessonText, lessonsForQuestion, lessonsOf,
  listSections, nextLesson, nextUnreadLesson, parseBack, pastCount, practiceCount, practiceFor, sectionId, trickSteps, weakLessons,
} from "./index";
import { cleanExplanation, countMatching, filterFacts, timesListed, toFacts } from "./facts";
import { plainFact, splitBold } from "./markup";
import { mergeRead, sanitizeRead } from "./read-logic";

const bank = (id: string): Question[] => JSON.parse(readFileSync(join(process.cwd(), "public/data/military", `${id}.json`), "utf8")).questions;
const COURSES = [...SSC_COURSES, "pma-lc"] as const;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

describe("Study guide lessons", () => {
  it("has unique ids inside each group and unique keys overall", () => {
    for (const g of GROUP_IDS) {
      const ids = ALL_LESSONS.filter((l) => l.group === g).map((l) => l.id);
      expect(new Set(ids).size, g).toBe(ids.length);
      expect(ids.length, g).toBeGreaterThan(0);
    }
    expect(new Set(ALL_LESSONS.map(lessonKey)).size).toBe(ALL_LESSONS.length);
  });

  it("gives every lesson a title, a summary, a reading time and something to read", () => {
    for (const l of ALL_LESSONS) {
      expect(l.title.trim(), l.id).not.toBe("");
      expect(l.summary.trim(), l.id).not.toBe("");
      expect(l.minutes, l.id).toBeGreaterThan(0);
      expect(l.blocks.length, l.id).toBeGreaterThan(0);
    }
  });

  it("finds a lesson by group and id, and knows the keys it stores", () => {
    expect(findLesson("verbal", "percentages")?.title).toBe("Percentages and arithmetic");
    expect(findLesson("verbal", "nope")).toBeUndefined();
    expect(isLessonKey("verbal/percentages")).toBe(true);
    expect(isLessonKey("verbal/nope")).toBe(false);
    expect(isLessonKey(5)).toBe(false);
  });

  it("only points at banks and chapters that exist, for every course", () => {
    for (const l of ALL_LESSONS) {
      for (const course of COURSES) {
        const src = practiceFor(l, course);
        const b = bankById(src.bank);
        expect(b, `${l.group}/${l.id} for ${course}: ${src.bank}`).toBeTruthy();
        for (const u of src.units ?? []) expect(b!.units.some((x) => x.n === u), `${src.bank} unit ${u}`).toBe(true);
        expect(practiceCount(l, course), `${l.id} ${course}`).toBeGreaterThan(0);
      }
      for (const block of l.blocks) if (block.kind === "bankFacts") expect(bankById(block.bank), block.bank).toBeTruthy();
    }
  });

  it("uses the PMA LC Verbal bank for a PMA student and the shared one for everyone else", () => {
    const l = findLesson("verbal", "percentages")!;
    expect(practiceFor(l, "pma-lc")).toEqual({ bank: "verbal-pma-lc", units: [2] });
    expect(practiceFor(l, "navy-it")).toEqual({ bank: "verbal", units: [9] });
  });

  it("uses the student's own copy of the SSC past-paper bank", () => {
    const l = findLesson("ssc", "subnetting")!;
    expect(practiceFor(l, "navy-it").bank).toBe("academic-navy-it-pp-subnetting");
    expect(practiceFor(l, "pma-lc").bank).toBe("academic-icto-pp-subnetting"); // a PMA student reading an SSC lesson falls back to ICTO
  });

  it("chooses the course for a lesson", () => {
    expect(guideCourse("pma", "icto")).toBe("pma-lc");
    expect(guideCourse("ssc", "lcc")).toBe("lcc");
    expect(guideCourse("ssc", "pma-lc")).toBe("icto");
    expect(guideCourse("ssc", null)).toBe("icto");
    expect(guideCourse("verbal", "pma-lc")).toBe("pma-lc");
    expect(guideCourse("nonverbal", null)).toBe("icto");
  });

  it("lists the biggest topic first (and the PMA Most repeated set always first)", () => {
    expect(lessonsOf("verbal").map((l) => l.id)).toEqual(["percentages", "days-dates", "directions-letters-series", "odd-one-out-words", "speed-time-work", "ages-relations"]);
    expect(lessonsOf("ssc").slice(0, 3).map((l) => l.id)).toEqual(["security", "subnetting", "networks"]);
    expect(lessonsOf("pma")[0].id).toBe("most-repeated");
    expect(lessonsOf("nonverbal").map((l) => l.id)).toEqual(["figure-analogies", "matrix-puzzles", "series", "analogies", "odd-one-out", "mirror-rotation", "mixed-puzzles"]);
    // sizes shown in the list come from the bank
    expect(pastCount(findLesson("verbal", "percentages")!)).toBe(32);
    expect(pastCount(findLesson("ssc", "subnetting")!)).toBe(72);
    expect(nextLesson(lessonsOf("verbal")[0])?.id).toBe("days-dates");
    expect(nextLesson(lessonsOf("verbal").at(-1)!)).toBeUndefined();
  });

  it("shows the AI helper only where it has a trick to work from", () => {
    expect(hasAiHelper(findLesson("verbal", "percentages")!)).toBe(true);
    expect(hasAiHelper(findLesson("ssc", "security")!)).toBe(true);
    expect(hasAiHelper(findLesson("nonverbal", "series")!)).toBe(false);
    expect(hasAiHelper(findLesson("pma", "geography")!)).toBe(false);
    const text = lessonText(findLesson("verbal", "percentages")!);
    expect(text).toContain("Find 10% first");
    expect(text).toContain("Answer: 72");
  });

  it("starts the bulb help with the steps of the trick", () => {
    expect(trickSteps(findLesson("verbal", "days-dates")!).map((s) => s.head)).toEqual(["Find the gap.", "Only the leftover matters.", "Move that many days."]);
    expect(trickSteps(findLesson("ssc", "security")!)).toEqual([]);
  });
});

describe("Lesson content against the question banks", () => {
  // Every verbal worked example is a real question of the bank, with the bank's answer.
  it("uses real questions and the bank's answers in the Verbal examples", () => {
    const questions = [...bank("verbal"), ...bank("verbal-pma-lc")];
    const problems: string[] = [];
    for (const l of ALL_LESSONS.filter((x) => x.group === "verbal")) {
      for (const block of l.blocks) {
        if (block.kind !== "examples") continue;
        for (const ex of block.items) {
          const p = norm(ex.prompt);
          const hit = questions.find((q) => norm(q.q).startsWith(p));
          if (!hit) {
            problems.push(`${l.id}: not in the bank: ${ex.prompt}`);
            continue;
          }
          const answer = norm(String(hit.o[hit.a]));
          if (!(norm(ex.answer).includes(answer) || answer.includes(norm(ex.answer)))) problems.push(`${l.id}: ${ex.prompt} -> ${ex.answer} (bank: ${hit.o[hit.a]})`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("uses real, answerable picture questions in the Non-verbal lessons", () => {
    const all = bank("nonverbal");
    for (const l of ALL_LESSONS.filter((x) => x.group === "nonverbal")) {
      const example = l.blocks.find((b) => b.kind === "bankExample");
      expect(example, l.id).toBeTruthy();
      if (example?.kind !== "bankExample") continue;
      const q = all.find((x) => x.id === example.questionId);
      expect(q, `${l.id}: ${example.questionId}`).toBeTruthy();
      expect(q!.oimg?.length, l.id).toBe(4);
      expect(q!.a).toBeGreaterThanOrEqual(0);
      expect(q!.a).toBeLessThan(4);
      // the example belongs to the lesson's own chapter
      expect(q!.u, l.id).toBe(l.practice.default.units![0]);
    }
  });

  it("has fact-group patterns that are valid and match past Security questions", () => {
    const security = bank("academic-icto-pp-security");
    const lesson = findLesson("ssc", "security")!;
    for (const block of lesson.blocks) {
      if (block.kind !== "facts") continue;
      for (const g of block.groups) {
        expect(() => new RegExp(g.match ?? "", "i")).not.toThrow();
        if (g.match) expect(countMatching(security, g.match), g.title).toBeGreaterThan(0);
      }
    }
  });
});

describe("Subnetting lesson arithmetic", () => {
  const toNum = (s: string) => s.split(".").reduce((a, b) => a * 256 + Number(b), 0);
  const toIp = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  function info(ip: string, prefix: number) {
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const net = (toNum(ip) & mask) >>> 0;
    const broadcast = (net | (~mask >>> 0)) >>> 0;
    return { network: toIp(net), broadcast: toIp(broadcast), first: toIp(net + 1), last: toIp(broadcast - 1), hosts: 2 ** (32 - prefix) - 2 };
  }

  it("gives the same answers as the worked examples", () => {
    expect(info("22.10.10.5", 24)).toMatchObject({ network: "22.10.10.0", broadcast: "22.10.10.255", first: "22.10.10.1", last: "22.10.10.254", hosts: 254 });
    expect(info("192.168.5.64", 26)).toMatchObject({ broadcast: "192.168.5.127", first: "192.168.5.65", last: "192.168.5.126", hosts: 62 });
    expect(info("172.20.15.25", 20)).toMatchObject({ network: "172.20.0.0", broadcast: "172.20.15.255", hosts: 4094 });
    expect(info("172.16.50.0", 23).last).toBe("172.16.51.254");
    expect(2 ** (24 - 8)).toBe(65536); // 22.10.10.5/24 starts from the Class A default /8
    expect(2 ** (20 - 16)).toBe(16); // 172.16.0.0/20
    expect(2 ** (27 - 24)).toBe(8); // 10.0.0.0/24 with 255.255.255.224
    expect(2 ** (22 - 16)).toBe(64); // at least 1000 hosts from /16: 10 host bits (1022), /22
    expect(2 ** (26 - 24)).toBe(4); // at least 50 hosts from /24: 6 host bits (62), /26
  });

  it("agrees with every bank question of those kinds", () => {
    let checked = 0;
    for (const q of bank("academic-icto-pp-subnetting")) {
      const a = String(q.o[q.a]);
      let m: RegExpExecArray | null;
      if ((m = /broadcast address for the subnet ([\d.]+)\/(\d+)/i.exec(q.q))) expect(info(m[1], +m[2]).broadcast, q.q).toBe(a);
      else if ((m = /first usable IP address in the subnet ([\d.]+)\/(\d+)/i.exec(q.q))) expect(info(m[1], +m[2]).first, q.q).toBe(a);
      else if ((m = /last usable IP address in the subnet ([\d.]+)\/(\d+)/i.exec(q.q))) expect(info(m[1], +m[2]).last, q.q).toBe(a);
      else if ((m = /(?:subnet|network) address (?:for|of) the IP(?: address)? ([\d.]+)\/(\d+)/i.exec(q.q))) expect(info(m[1], +m[2]).network, q.q).toBe(a);
      else continue;
      checked++;
    }
    expect(checked).toBeGreaterThan(20);
  });
});

describe("Which lesson helps with which question", () => {
  const ids = (course: string, unit: number) => lessonsForQuestion(course, unit).map(lessonKey);

  it("maps Verbal chapters, with a main lesson first", () => {
    expect(ids("mil-verbal", 9)).toEqual(["verbal/percentages"]);
    expect(ids("mil-verbal", 8)).toEqual(["verbal/days-dates"]);
    expect(ids("mil-verbal", 5)).toEqual(["verbal/ages-relations", "verbal/directions-letters-series"]);
    expect(ids("mil-verbal-pma-lc", 1)).toEqual(["verbal/days-dates"]);
    expect(ids("mil-verbal-pma-lc", 6)).toEqual(["verbal/odd-one-out-words"]);
  });

  it("maps every chapter of the Verbal, PMA Verbal and Non-verbal banks to a lesson", () => {
    for (const id of ["verbal", "verbal-pma-lc", "nonverbal"]) {
      const b = bankById(id)!;
      for (const u of b.units) expect(lessonsForQuestion(b.code, u.n).length, `${id} unit ${u.n}`).toBeGreaterThan(0);
    }
    expect(ids("mil-nonverbal", 6)).toEqual(["nonverbal/mirror-rotation"]);
  });

  it("maps the SSC past-paper banks of all four courses, and the Computer basics practice bank", () => {
    for (const course of SSC_COURSES) {
      for (const topic of ["subnetting", "security", "networks", "databases", "software-engineering", "os-linux", "computer-basics", "programming-web", "data-structures", "cloud-ai"]) {
        expect(ids(`mil-academic-${course}-pp-${topic}`, 1), `${course} ${topic}`).toEqual([`ssc/${topic}`]);
      }
      expect(ids(`mil-academic-${course}-computer-basics`, 1)).toEqual(["ssc/computer-basics"]);
      expect(ids(`mil-academic-${course}-calculus`, 1)).toEqual([]);
      expect(ids(`mil-academic-${course}-probability`, 1)).toEqual([]);
    }
  });

  it("maps every PMA subject bank, and nothing else", () => {
    for (const slug of ["most-repeated", "geography", "islamiat", "pak-studies", "maths-science-english", "gk-defence"]) {
      expect(ids(`mil-academic-pma-lc-${slug}`, 1)).toEqual([`pma/${slug}`]);
    }
    expect(ids("dsa", 3)).toEqual([]);
    expect(ids("mil-academic-pma-lc-unknown", 1)).toEqual([]);
  });

  it("covers every Academic bank in the app that should have a lesson", () => {
    const missing = militaryManifest.banks
      .filter((b) => b.section === "academic" && !/calculus|probability/.test(b.id))
      .filter((b) => lessonsForQuestion(b.code, 1).length === 0)
      .map((b) => b.id);
    expect(missing).toEqual([]);
  });
});

describe("Fix this first", () => {
  const tally = (correct: number, total: number) => ({ total, correct, wrong: total - correct, skipped: 0 });

  it("returns the weakest lessons first and ignores strong ones and chapters without a lesson", () => {
    const weak = weakLessons({
      byUnit: {
        "mil-verbal:9": tally(2, 5), // percentages 40%
        "mil-verbal:8": tally(3, 5), // days 60%
        "mil-verbal:13": tally(4, 5), // odd one out 80%: strong
        "dsa:3": tally(0, 4), // degree course: no lesson
      },
    });
    expect(weak.map((w) => [lessonKey(w.lesson), w.percent])).toEqual([["verbal/percentages", 40], ["verbal/days-dates", 60]]);
  });

  it("adds up chapters that belong to the same main lesson", () => {
    const weak = weakLessons({ byUnit: { "mil-verbal:2": tally(1, 3), "mil-verbal:3": tally(0, 3), "mil-verbal:12": tally(2, 4) } });
    expect(weak).toHaveLength(1);
    expect(weak[0]).toMatchObject({ correct: 3, total: 10, percent: 30 });
    expect(lessonKey(weak[0].lesson)).toBe("verbal/directions-letters-series");
  });

  it("returns nothing when everything went well", () => {
    expect(weakLessons({ byUnit: { "mil-verbal:9": tally(4, 5) } })).toEqual([]);
    expect(weakLessons({ byUnit: {} })).toEqual([]);
  });
});

describe("Start page cards", () => {
  it("points each part to its place in the guide", () => {
    expect(guideStartCard("icto", "verbal")).toMatchObject({ title: "Tricks and formulas", href: "/guide/verbal" });
    expect(guideStartCard("pma-lc", "nonverbal")).toMatchObject({ title: "How to solve picture puzzles", href: "/guide/nonverbal" });
    expect(guideStartCard("navy-it", "academic")).toMatchObject({ title: "Most repeated topics", href: "/guide/ssc" });
    expect(guideStartCard("pma-lc", "academic")).toMatchObject({ title: "Quick facts for these subjects", href: "/guide/pma" });
  });
});

describe("Read ticks", () => {
  it("keeps only known lessons, once each", () => {
    expect(sanitizeRead(["verbal/percentages", "verbal/percentages", "verbal/nope", 4, null])).toEqual(["verbal/percentages"]);
    expect(sanitizeRead("not a list")).toEqual([]);
  });

  it("joins the phone's list with the account's and says what the account still needs", () => {
    const r = mergeRead(["verbal/percentages", "ssc/security"], ["ssc/security", "pma/geography", "old/removed"]);
    expect(r.merged.sort()).toEqual(["pma/geography", "ssc/security", "verbal/percentages"]);
    expect(r.toPush).toEqual(["verbal/percentages"]);
  });
});

describe("Past-question lists", () => {
  const q = (id: string, text: string, answer: string, e: string, extra: Partial<Question> = {}): Question => ({ id, u: 1, q: text, o: [answer, "x", "y", "z"], a: 0, e, ...extra });

  it("removes the 'where this came from' sentences from an explanation", () => {
    expect(cleanExplanation("Japan is called the Land of the Rising Sun. Past repeated PMA LC question, listed 3 times.")).toBe("Japan is called the Land of the Rising Sun.");
    expect(cleanExplanation("A /26 has 6 host bits. Practice question written by Claude.")).toBe("A /26 has 6 host bits.");
    expect(cleanExplanation("Past PMA LC question.")).toBe("");
  });

  it("reads how many times a PMA question was listed", () => {
    expect(timesListed("Something. Past repeated PMA LC question, listed 4 times.")).toBe(4);
    expect(timesListed("Past PMA LC question.")).toBeNull();
  });

  it("lists text questions with their answers, most listed first when the bank says how often, and leaves picture questions out", () => {
    const facts = toFacts([
      q("a", "First?", "One", "Past repeated PMA LC question, listed 2 times."),
      q("b", "Second?", "Two", "Past repeated PMA LC question, listed 5 times."),
      q("c", "", "3", "", { oimg: ["1.webp", "2.webp", "3.webp", "4.webp"] }),
    ]);
    expect(facts.map((f) => f.id)).toEqual(["b", "a"]);
    expect(facts[0]).toMatchObject({ question: "Second?", answer: "Two", times: 5 });
    // no counts in the bank: its own order is kept
    expect(toFacts([q("a", "A?", "1", "e1"), q("b", "B?", "2", "e2")]).map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("searches question and answer for every word typed", () => {
    const facts = toFacts([q("a", "Which port does HTTP use?", "80", ""), q("b", "Which port does HTTPS use?", "443", "")]);
    expect(filterFacts(facts, "https").map((f) => f.id)).toEqual(["b"]);
    expect(filterFacts(facts, "port 80").map((f) => f.id)).toEqual(["a"]);
    expect(filterFacts(facts, "  ").length).toBe(2);
    expect(filterFacts(facts, "zzz")).toEqual([]);
  });

  it("builds lists from the real banks without trouble", () => {
    const geography = toFacts(bank("academic-pma-lc-geography"));
    expect(geography.length).toBeGreaterThan(100);
    expect(geography.every((f) => f.question && f.answer)).toBe(true);
    expect(geography.some((f) => /past (repeated )?pma lc/i.test(f.why))).toBe(false);
  });
});

describe("Readability rules", () => {
  const allFacts = ALL_LESSONS.flatMap((l) =>
    l.blocks.flatMap((b) => (b.kind === "facts" ? b.groups.flatMap((g) => g.facts.map((fact) => ({ lesson: lessonKey(l), group: g.title, fact }))) : [])),
  );
  const sentences = (s: string) => (s.match(/[.!?](\s|$)/g) ?? []).length;

  it("keeps every fact to one short idea (at most two sentences, 150 characters)", () => {
    expect(allFacts.length).toBeGreaterThan(100);
    const tooLong = allFacts.filter(({ fact }) => plainFact(fact).length > 150 || sentences(plainFact(fact)) > 2).map((f) => `${f.lesson} / ${f.group}: ${f.fact}`);
    expect(tooLong).toEqual([]);
  });

  it("closes every bold mark and never leaves a stray bracket", () => {
    for (const { lesson, fact } of allFacts) {
      expect(fact.split("[[").length, `${lesson}: ${fact}`).toBe(fact.split("]]").length);
      expect(plainFact(fact), `${lesson}: ${fact}`).not.toMatch(/\[\[|\]\]/);
    }
  });

  it("cuts a fact into bold and plain pieces", () => {
    expect(splitBold("A [[hash]] gives a fixed-length output.")).toEqual([
      { text: "A ", bold: false },
      { text: "hash", bold: true },
      { text: " gives a fixed-length output.", bold: false },
    ]);
    expect(plainFact("[[Symmetric]] encryption uses one shared key.")).toBe("Symmetric encryption uses one shared key.");
    expect(splitBold("no marks")).toEqual([{ text: "no marks", bold: false }]);
    expect(plainFact("an [[unclosed mark")).toBe("an [[unclosed mark"); // shown as written
  });

  it("gives the AI helper plain facts, without bold marks", () => {
    expect(lessonText(findLesson("ssc", "security")!)).not.toContain("[[");
  });

  it("splits each list under plain headings instead of tags", () => {
    const headings = (g: Parameters<typeof listSections>[0]) => listSections(g).map((s) => `${s.heading}:${s.lessons.length}`);
    expect(headings("verbal")).toEqual(["Must learn:3", "Then:3"]);
    expect(headings("ssc")).toEqual(["Must learn:3", "Then:7"]);
    expect(headings("pma")).toEqual(["Start here:1", "Subjects:5"]);
    expect(headings("nonverbal")).toEqual(["Chapters:7"]);
    for (const g of GROUP_IDS) expect(listSections(g).flatMap((s) => s.lessons.map(lessonKey))).toEqual(lessonsOf(g).map(lessonKey)); // same lessons, same order
  });

  it("offers the first unread lesson: Verbal, Non-verbal, then the student's own Academic part, then the other", () => {
    expect(nextUnreadLesson(new Set(), null) ? lessonKey(nextUnreadLesson(new Set(), null)!) : null).toBe("verbal/percentages");
    const verbal = new Set(lessonsOf("verbal").map(lessonKey));
    expect(lessonKey(nextUnreadLesson(verbal, null)!)).toBe("nonverbal/figure-analogies");
    const upToNonverbal = new Set([...verbal, ...lessonsOf("nonverbal").map(lessonKey)]);
    expect(lessonKey(nextUnreadLesson(upToNonverbal, "navy-it")!)).toBe("ssc/security");
    expect(lessonKey(nextUnreadLesson(upToNonverbal, "pma-lc")!)).toBe("pma/most-repeated");
    const everything = new Set(ALL_LESSONS.map(lessonKey));
    expect(nextUnreadLesson(everything, null)).toBeUndefined();
    // a lesson read out of order is skipped
    expect(lessonKey(nextUnreadLesson(new Set(["verbal/percentages"]), null)!)).toBe("verbal/days-dates");
  });

  it("gives long lessons jump links and short ones none", () => {
    const sub = findLesson("ssc", "subnetting")!;
    const links = jumpLinks(sub.blocks);
    expect(links.length).toBe(sub.blocks.length);
    expect(links[0].id).toBe(sectionId(0));
    expect(links.at(-1)).toEqual({ id: sectionId(sub.blocks.length - 1), label: "Watch out" });
    expect(jumpLinks(findLesson("ssc", "security")!.blocks)).toEqual([]); // two sections only
    expect(jumpLinks(findLesson("verbal", "percentages")!.blocks).length).toBeGreaterThanOrEqual(4);
  });

  it("keeps every lesson short enough to read: no step or paragraph runs past 400 characters", () => {
    for (const l of ALL_LESSONS) {
      for (const b of l.blocks) {
        if (b.kind === "steps") for (const s of b.steps) expect(s.text.length, `${lessonKey(l)} step "${s.head}"`).toBeLessThanOrEqual(400);
        if (b.kind === "text") for (const p of b.paragraphs) expect(p.length, `${lessonKey(l)} text`).toBeLessThanOrEqual(400);
        if (b.kind === "watch") expect(b.text.length, `${lessonKey(l)} watch`).toBeLessThanOrEqual(300);
      }
    }
  });
});

describe("Coming back from a lesson to the quiz", () => {
  const lesson = () => findLesson("verbal", "percentages")!;

  it("adds the screen to return to, and nothing when there is none", () => {
    expect(lessonHref(lesson())).toBe("/guide/verbal/percentages");
    expect(lessonHref(lesson(), "/quiz")).toBe("/guide/verbal/percentages?back=%2Fquiz");
    expect(lessonHref(lesson(), "/quiz/review")).toBe("/guide/verbal/percentages?back=%2Fquiz%2Freview");
  });

  it("accepts only the quiz and the review of a quiz", () => {
    expect(parseBack("/quiz")).toBe("/quiz");
    expect(parseBack("/quiz/review")).toBe("/quiz/review");
    expect(parseBack("/results/abc123_-X/review")).toBe("/results/abc123_-X/review");
  });

  it("ignores any other address, so the link cannot be used to send a student elsewhere", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/home", "/quiz/result", "/results//review", "/results/a/b/review", "/quiz?x=1", "javascript:alert(1)", "", undefined, null, 5]) {
      expect(parseBack(bad), String(bad)).toBeUndefined();
    }
    expect(lessonHref(lesson(), "https://evil.example")).toBe("/guide/verbal/percentages");
  });
});
