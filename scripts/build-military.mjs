// Turns the military question files you converted from the PDFs into the app's own data.
//
//   node scripts/build-military.mjs [--src ../military]
//
// Put the converted files in a folder called "military" next to the "jsons" folder:
//   verbal.json                         Intelligence: Verbal (shared by ICTO, LCC, Navy IT, Airforce IT)
//   nonverbal.json                      Intelligence: Non-verbal, image questions (shared by all four)
//   academic-<course>-<subject>.json    Academic subject of one course, e.g. academic-icto-networks.json, academic-navy-it-electronics.json
//   img/                                the picture files that the non-verbal questions point to
//
// A file is a list of questions. Each question:
//   { "q": "text", "o": ["A", "B", "C", "D"], "a": 1, "e": "why (optional)", "u": "1. Chapter name (optional)" }
// A non-verbal question uses pictures instead of text:
//   { "img": "nonverbal-12.webp", "oimg": ["nonverbal-12-1.webp", "...-2.webp", "...-3.webp", "...-4.webp"], "a": 2 }   (2 to 6 option pictures)
// A file may also be { "title": "Nice name", "questions": [ ... ] }.
//
// The build stops with an error on a bad question. Output: public/data/military/ (manifest.json, one file per bank, img/).

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const srcArg = process.argv.indexOf("--src");
const srcDir = path.resolve(root, srcArg > -1 ? process.argv[srcArg + 1] : "../military");
const outDir = path.join(root, "public", "data", "military");
const COURSES = ["icto", "lcc", "navy-it", "airforce-it"];

const errors = [];
const fail = (file, i, msg) => errors.push(`${file}${i === undefined ? "" : ` question ${i + 1}`}: ${msg}`);

const banks = [];
const bodies = [];
const images = new Map(); // output name -> source path

function bankInfo(name) {
  if (name === "verbal") return { section: "verbal", title: "Verbal" };
  if (name === "nonverbal") return { section: "nonverbal", title: "Non-verbal" };
  for (const c of COURSES) if (name.startsWith(`academic-${c}-`)) return { section: "academic", course: c, title: name.slice(`academic-${c}-`.length).replace(/-/g, " ") };
  return null;
}

if (fs.existsSync(srcDir)) {
  for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith(".json")).sort()) {
    const id = file.replace(/\.json$/, "");
    const info = bankInfo(id);
    if (!info) { fail(file, undefined, 'name must be "verbal", "nonverbal" or "academic-<course>-<subject>" (course: ' + COURSES.join(", ") + ")"); continue; }

    let raw = JSON.parse(fs.readFileSync(path.join(srcDir, file), "utf8").replace(/^﻿/, ""));
    let title = info.title.replace(/\b\w/g, (c) => c.toUpperCase());
    if (!Array.isArray(raw)) { title = raw.title || title; raw = raw.questions; }
    if (!Array.isArray(raw) || raw.length === 0) { fail(file, undefined, "no questions"); continue; }

    const units = new Map();
    const questions = [];
    raw.forEach((x, i) => {
      const hasImages = !!x.oimg;
      const options = hasImages ? ["1", "2", "3", "4", "5", "6"].slice(0, x.oimg.length) : x.o;
      if (hasImages && (!Array.isArray(x.oimg) || x.oimg.length < 2 || x.oimg.length > 6)) return fail(file, i, "oimg needs 2 to 6 pictures");
      if (!Array.isArray(options) || (!hasImages && options.length !== 4)) return fail(file, i, "needs exactly 4 options");
      if (!hasImages && (typeof x.q !== "string" || !x.q.trim())) return fail(file, i, "question text is blank");
      if (!hasImages && (options.some((o) => typeof o !== "string" || !o.trim()) || new Set(options).size !== 4)) return fail(file, i, "blank or repeated option");
      if (!Number.isInteger(x.a) || x.a < 0 || x.a > options.length - 1) return fail(file, i, `answer must be 0 to ${options.length - 1} (0 = first option)`);

      const um = /^(\d+)\.\s+(.+)$/.exec(x.u ?? "1. General");
      if (!um) return fail(file, i, `chapter "${x.u}" must look like "1. Name"`);
      const n = Number(um[1]);
      const u = units.get(n) ?? { n, title: um[2].trim(), count: 0 };
      u.count++;
      units.set(n, u);

      const q = { id: `mil-${id}-${i + 1}`, u: n, q: (x.q ?? "").trim(), o: options.map((o) => String(o).trim()), a: x.a, e: (x.e ?? "").trim() };
      const imgOut = (name) => {
        const base = path.basename(String(name));
        const from = path.join(srcDir, "img", base);
        if (!fs.existsSync(from)) fail(file, i, `picture not found: img/${base}`);
        images.set(base, from);
        return `/data/military/img/${base}`;
      };
      if (x.img) q.img = imgOut(x.img);
      if (hasImages) q.oimg = x.oimg.map(imgOut);
      questions.push(q);
    });

    const body = JSON.stringify({ course: `mil-${id}`, questions });
    bodies.push({ id, body });
    banks.push({ id, code: `mil-${id}`, title, section: info.section, ...(info.course ? { course: info.course } : {}), total: questions.length, units: [...units.values()].sort((a, b) => a.n - b.n), file: `military/${id}.json`, bytes: Buffer.byteLength(body) });
  }
}

if (errors.length) {
  console.error(`Military build FAILED with ${errors.length} problem(s):`);
  errors.slice(0, 50).forEach((e) => console.error("  - " + e));
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "img"), { recursive: true });
for (const { id, body } of bodies) fs.writeFileSync(path.join(outDir, `${id}.json`), body);
for (const [name, from] of images) fs.copyFileSync(from, path.join(outDir, "img", name));

const hash = crypto.createHash("sha256");
for (const { body } of bodies) hash.update(body);
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ version: banks.length ? hash.digest("hex").slice(0, 12) : "empty", banks }, null, 1) + "\n");

console.log(`Military build OK: ${banks.length} banks, ${banks.reduce((s, b) => s + b.total, 0)} questions, ${images.size} pictures`);
if (!fs.existsSync(srcDir)) console.log(`(no "${path.relative(root, srcDir)}" folder yet: wrote an empty manifest)`);
for (const b of banks) console.log(`  ${b.id}: ${b.total} questions${b.course ? ` (${b.course})` : ""}`);
