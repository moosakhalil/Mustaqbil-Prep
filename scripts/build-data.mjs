// Phase 1: turn the 25 degree question banks into the app's own data.
//
//   node scripts/build-data.mjs [--src ../jsons]
//
// Reads every bank, checks it strictly (the build FAILS on a bad question), and writes:
//   public/data/manifest.json        courses, units, counts, duplicate groups, data version
//   public/data/degree/<code>.json   one file per course, so the app (and the offline cache) loads only what it needs
//
// Output is deterministic (no timestamps), so re-running without changes gives no diff.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const srcArg = process.argv.indexOf("--src");
const srcDir = path.resolve(root, srcArg > -1 ? process.argv[srcArg + 1] : "../jsons");
const outDir = path.join(root, "public", "data");

// file -> short code (used in question ids like "dsa-12") and display title
const COURSES = [
  ["agile_mcq.json", "agile", "Agile Development"],
  ["ai_mcq.json", "ai", "Artificial Intelligence"],
  ["bigdata_mcq.json", "bda", "Big Data Analytics"],
  ["cloud_computing_mcq.json", "cc", "Cloud Computing"],
  ["cald_mcq.json", "cald", "Computer Architecture & Logic Design"],
  ["computer_networks_mcq.json", "cn", "Computer Communication & Networks"],
  ["cp_mcq_bank.json", "cp", "Computer Programming"],
  ["dsa_mcq_bank.json", "dsa", "Data Structures & Algorithms"],
  ["dbms_mcq_bank.json", "dbms", "Database Management Systems"],
  ["daa_mcq_bank.json", "daa", "Design & Analysis of Algorithms"],
  ["discrete_structures_mcq.json", "ds", "Discrete Structures"],
  ["fm_mcq_bank.json", "fm", "Formal Methods in SE"],
  ["is_mcq_bank.json", "is", "Information Security"],
  ["ise_mcq_bank.json", "ise", "Introduction to Software Engineering"],
  ["ml_mcq_bank.json", "ml", "Machine Learning"],
  ["oop_mcq_bank.json", "oop", "Object-Oriented Programming"],
  ["os_mcq_bank.json", "os", "Operating Systems"],
  ["software_construction_mcq.json", "sc", "Software Construction"],
  ["sda_mcq.json", "sda", "Software Design & Architecture"],
  ["SPM_MCQ_Bank.json", "spm", "Software Project Management"],
  ["SQE_MCQ_Bank.json", "sqe", "Software Quality Engineering"],
  ["SRE_MCQ_Bank.json", "sre", "Software Requirement Engineering"],
  ["toa_mcq.json", "toa", "Theory of Automata"],
  ["visual_programming_mcq.json", "vp", "Visual Programming"],
  ["web_engineering_mcq.json", "web", "Web Engineering"],
];

// An option like "None of them" / "All of the above" only makes sense in the last slots, so the quiz must never shuffle it
// into the middle. Pinned options keep their original order at the end. The option must be only that phrase, so sentences that
// merely start with it ("None of them has zero No instances") and maths options such as "P(A and B)" are left alone.
const PINNED = /^(none|neither|both|all)( of)? (the above|above|these|them|those)\s*[.;]?$/i;

const errors = [];
const fail = (file, id, msg) => errors.push(`${file}${id === undefined ? "" : `#${id}`}: ${msg}`);
const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").replace(/[\s.?:;!]+$/, "").trim();

const manifestCourses = [];
const courseFiles = [];
const byText = new Map(); // normalised question text -> ["agile-97", ...]
let pinnedCount = 0;

for (const [file, code, title] of COURSES) {
  const full = path.join(srcDir, file);
  if (!fs.existsSync(full)) {
    fail(file, undefined, "file not found");
    continue;
  }
  const raw = JSON.parse(fs.readFileSync(full, "utf8").replace(/^﻿/, "")); // some editors add a byte-order mark
  if (!Array.isArray(raw) || raw.length === 0) {
    fail(file, undefined, "not a non-empty array");
    continue;
  }

  const seenIds = new Set();
  const units = new Map(); // number -> { n, title, count }
  const questions = [];

  for (const x of raw) {
    const id = x.id;
    if (!Number.isInteger(id)) { fail(file, id, "id is not an integer"); continue; }
    if (seenIds.has(id)) { fail(file, id, "duplicate id"); continue; }
    seenIds.add(id);

    for (const k of ["u", "q", "e"]) {
      if (typeof x[k] !== "string" || !x[k].trim()) fail(file, id, `field "${k}" is blank or not text`);
    }
    if (!Array.isArray(x.o) || x.o.length !== 4) { fail(file, id, "needs exactly 4 options"); continue; }
    if (x.o.some((o) => typeof o !== "string" || !o.trim())) fail(file, id, "blank option");
    if (new Set(x.o).size !== 4) fail(file, id, "two options are identical (compared case-sensitively)");
    if (!Number.isInteger(x.a) || x.a < 0 || x.a > 3) { fail(file, id, "answer index out of range"); continue; }

    const m = /^(\d+)\.\s+(.+)$/.exec(x.u ?? "");
    if (!m) { fail(file, id, `unit "${x.u}" is not in the form "N. Title"`); continue; }
    const n = Number(m[1]);
    const unitTitle = m[2].trim();
    const unit = units.get(n);
    if (!unit) units.set(n, { n, title: unitTitle, count: 1 });
    else if (unit.title !== unitTitle) fail(file, id, `unit ${n} has two titles: "${unit.title}" and "${unitTitle}"`);
    else unit.count++;

    const pin = [];
    x.o.forEach((o, i) => { if (PINNED.test(o.trim())) pin.push(i); });
    pinnedCount += pin.length;

    const qid = `${code}-${id}`;
    const q = { id: qid, u: n, q: x.q.trim(), o: x.o.map((o) => o.trim()), a: x.a, e: x.e.trim() };
    if (pin.length) q.p = pin;
    questions.push(q);

    const key = norm(x.q);
    byText.set(key, [...(byText.get(key) ?? []), qid]);
  }

  questions.sort((a, b) => a.u - b.u || Number(a.id.split("-").pop()) - Number(b.id.split("-").pop()));
  const body = JSON.stringify({ course: code, questions });
  courseFiles.push({ code, body });
  manifestCourses.push({
    id: code,
    title,
    domain: "degree",
    file: `degree/${code}.json`,
    total: questions.length,
    units: [...units.values()].sort((a, b) => a.n - b.n),
    bytes: Buffer.byteLength(body),
  });
}

// Question text that appears more than once (inside one course or across courses). The quiz skips repeats within one attempt.
const duplicates = [...byText.values()].filter((ids) => ids.length > 1).sort((a, b) => a[0].localeCompare(b[0]));

if (errors.length) {
  console.error(`Data build FAILED with ${errors.length} problem(s):`);
  errors.slice(0, 50).forEach((e) => console.error("  - " + e));
  process.exit(1);
}

fs.rmSync(path.join(outDir, "degree"), { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "degree"), { recursive: true });
for (const { code, body } of courseFiles) fs.writeFileSync(path.join(outDir, "degree", `${code}.json`), body);

// Version = hash of every course file, so the offline cache knows when to refresh
const hash = crypto.createHash("sha256");
for (const { body } of courseFiles) hash.update(body);
const total = manifestCourses.reduce((s, c) => s + c.total, 0);
const manifest = {
  version: hash.digest("hex").slice(0, 12),
  totals: { courses: manifestCourses.length, questions: total },
  courses: manifestCourses,
  duplicates,
};
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");

const kb = (b) => (b / 1024).toFixed(0) + " KB";
console.log(`Data build OK: ${manifestCourses.length} courses, ${total} questions, ${manifestCourses.reduce((s, c) => s + c.units.length, 0)} units`);
console.log(`Total size ${kb(courseFiles.reduce((s, f) => s + Buffer.byteLength(f.body), 0))}, data version ${manifest.version}`);
console.log(`Pinned-last options: ${pinnedCount}; repeated question texts: ${duplicates.length}`);
for (const ids of duplicates) console.log("  repeat: " + ids.join(" = "));
