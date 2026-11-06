import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { attemptResult, type Attempt } from "@/lib/quiz/attempt-logic";
import type { Score, Tally } from "@/lib/quiz/score";

export type PdfNames = {
  course: (id: string) => string;
  unit: (course: string, unit: number) => string;
};

export type PdfFonts = { regular: ArrayBuffer | Uint8Array; bold: ArrayBuffer | Uint8Array };

const A4 = { w: 595.28, h: 841.89 };
const M = 42; // margin
const COLORS = {
  text: rgb(0.06, 0.09, 0.16),
  soft: rgb(0.28, 0.33, 0.41),
  line: rgb(0.85, 0.88, 0.93),
  accent: rgb(0.31, 0.27, 0.9),
  ok: rgb(0.08, 0.5, 0.24),
  bad: rgb(0.78, 0.16, 0.16),
  warn: rgb(0.71, 0.33, 0.04),
  okBg: rgb(0.9, 0.97, 0.92),
  badBg: rgb(0.99, 0.91, 0.91),
};

const pct = (t: Tally) => (t.total === 0 ? 0 : Math.round((t.correct / t.total) * 100));
const word = (p: number) => (p >= 70 ? "Strong" : p >= 50 ? "Okay" : "Weak");
const toneColor = (p: number) => (p >= 70 ? COLORS.ok : p >= 50 ? COLORS.warn : COLORS.bad);
const LETTERS = ["A", "B", "C", "D", "E", "F"];

function clock(sec: number) {
  return sec >= 60 ? `${Math.floor(sec / 60)} min ${Math.round(sec % 60)} s` : `${Math.round(sec)} s`;
}

/** Writes lines of text down the pages, adding a page when one is full. */
class Writer {
  page!: PDFPage;
  y = 0;
  pages: PDFPage[] = [];
  constructor(private doc: PDFDocument, private regular: PDFFont, private bold: PDFFont) {
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([A4.w, A4.h]);
    this.pages.push(this.page);
    this.y = A4.h - M;
  }

  ensure(height: number) {
    if (this.y - height < M + 18) this.newPage();
  }

  /** Split text into lines that fit `width`, breaking inside a very long word when needed. */
  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const lines: string[] = [];
    for (const para of text.replace(/\r/g, "").split("\n")) {
      let line = "";
      for (const rawWord of para.split(/\s+/).filter(Boolean)) {
        let w = rawWord;
        while (font.widthOfTextAtSize(w, size) > width) {
          // a word wider than the line: cut it
          let cut = w.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > width) cut--;
          if (line) { lines.push(line); line = ""; }
          lines.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        const trial = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(trial, size) <= width) line = trial;
        else { lines.push(line); line = w; }
      }
      lines.push(line);
    }
    return lines;
  }

  text(text: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number; width?: number; gap?: number } = {}) {
    const size = opts.size ?? 10;
    const font = opts.bold ? this.bold : this.regular;
    const x = opts.x ?? M;
    const width = opts.width ?? A4.w - M - x;
    const lead = size * 1.4;
    for (const line of this.wrap(text, font, size, width)) {
      this.ensure(lead);
      this.y -= lead;
      if (line) this.page.drawText(line, { x, y: this.y, size, font, color: opts.color ?? COLORS.text });
    }
    this.y -= opts.gap ?? 0;
  }

  rule() {
    this.ensure(10);
    this.y -= 4;
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: A4.w - M, y: this.y }, thickness: 0.6, color: COLORS.line });
    this.y -= 6;
  }

  bar(label: string, t: Tally) {
    const p = pct(t);
    this.ensure(30);
    this.y -= 12;
    const right = `${p}%  ${t.correct}/${t.total}  ${word(p)}`;
    const rightW = this.bold.widthOfTextAtSize(right, 9);
    const labelLines = this.wrap(label, this.regular, 9.5, A4.w - 2 * M - rightW - 10);
    this.page.drawText(labelLines[0] ?? "", { x: M, y: this.y, size: 9.5, font: this.regular, color: COLORS.text });
    this.page.drawText(right, { x: A4.w - M - rightW, y: this.y, size: 9, font: this.bold, color: toneColor(p) });
    this.y -= 7;
    this.page.drawRectangle({ x: M, y: this.y, width: A4.w - 2 * M, height: 4, color: COLORS.line });
    if (p > 0) this.page.drawRectangle({ x: M, y: this.y, width: ((A4.w - 2 * M) * p) / 100, height: 4, color: toneColor(p) });
    this.y -= 6;
  }
}

/** Build the PDF of one finished quiz. Works fully on the phone (no network), so old results can be downloaded again. */
export async function buildResultPdf(attempt: Attempt, names: PdfNames, fonts: PdfFonts, images: Record<string, Uint8Array> = {}): Promise<Uint8Array> {
  const { score, durationSec, avgSeconds } = attemptResult(attempt);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(fonts.regular, { subset: true });
  const bold = await doc.embedFont(fonts.bold, { subset: true });
  doc.setTitle(`Mustaqbil Prep - ${attempt.label}`);
  doc.setAuthor("Mustaqbil Prep");
  doc.setCreator("Mustaqbil Prep");

  const w = new Writer(doc, regular, bold);
  const when = new Date(attempt.finishedAt ?? attempt.startedAt);

  // ---- header
  w.text("Mustaqbil Prep", { size: 11, bold: true, color: COLORS.accent });
  w.text("Quiz result", { size: 22, bold: true, gap: 2 });
  w.text(attempt.label, { size: 12, bold: true });
  w.text(`${attempt.mode === "exam" ? "Exam" : "Practice"} · ${when.toISOString().slice(0, 10)} ${when.toISOString().slice(11, 16)} UTC${attempt.section ? ` · ${attempt.section}` : ""}`, { color: COLORS.soft, gap: 8 });

  // ---- score box
  w.ensure(86);
  const top = w.y;
  w.page.drawRectangle({ x: M, y: top - 78, width: A4.w - 2 * M, height: 78, borderColor: COLORS.line, borderWidth: 1, color: rgb(0.97, 0.98, 1) });
  const big = `${Math.round(score.percent)}%`;
  w.page.drawText(big, { x: M + 16, y: top - 44, size: 34, font: bold, color: toneColor(score.percent) });
  w.page.drawText(word(score.percent), { x: M + 18, y: top - 62, size: 10, font: bold, color: toneColor(score.percent) });
  const stat = (x: number, label: string, value: string, color = COLORS.text) => {
    w.page.drawText(value, { x, y: top - 36, size: 16, font: bold, color });
    w.page.drawText(label, { x, y: top - 52, size: 9, font: regular, color: COLORS.soft });
  };
  stat(M + 130, "Correct", String(score.correct), COLORS.ok);
  stat(M + 200, "Wrong", String(score.wrong), COLORS.bad);
  stat(M + 262, "Skipped", String(score.skipped), COLORS.soft);
  stat(M + 330, "Total time", clock(durationSec));
  stat(M + 420, "Per question", clock(avgSeconds));
  w.y = top - 90;

  if (attempt.section) {
    const pass = score.percent >= 50;
    w.text(`Pass mark 50%: ${pass ? "PASS" : "FAIL"} (${Math.round(score.percent)}%)`, { bold: true, color: pass ? COLORS.ok : COLORS.bad, gap: 4 });
  }

  // ---- by course and chapter
  const courses = Object.entries(score.byCourse);
  if (courses.length > 1) {
    w.text("By course", { size: 13, bold: true });
    for (const [id, t] of courses) w.bar(names.course(id), t);
    w.y -= 6;
  }
  w.text("By chapter (weakest first)", { size: 13, bold: true });
  for (const row of weakest(score, names).slice(0, 15)) w.bar(row.label, row.tally);
  w.y -= 8;

  // ---- answer review
  w.rule();
  w.text("Answer review", { size: 14, bold: true, gap: 4 });
  // pictures of figure questions (PNG or JPG bytes given by the caller), embedded once each
  const embedded = new Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>> | null>();
  const picture = async (url: string) => {
    if (!embedded.has(url)) {
      const bytes = images[url];
      embedded.set(url, bytes ? await doc.embedPng(bytes).catch(() => doc.embedJpg(bytes).catch(() => null)) : null);
    }
    return embedded.get(url)!;
  };

  for (const [i, q] of attempt.questions.entries()) {
    const picked = attempt.answers[q.id] ?? null;
    const right = picked === q.answer;
    w.ensure(60);
    w.text(`${i + 1}. ${names.course(q.course)} · ${names.unit(q.course, q.unit)}`, { size: 8.5, color: COLORS.soft });
    if (q.q) w.text(q.q, { size: 10.5, bold: true, gap: 3 });

    if (q.img) {
      const img = await picture(q.img);
      if (img) {
        const scale = Math.min((A4.w - 2 * M - 20) / img.width, 190 / img.height, 1.5);
        const wd = img.width * scale;
        const ht = img.height * scale;
        w.ensure(ht + 10);
        w.page.drawImage(img, { x: M + 10, y: w.y - ht, width: wd, height: ht });
        w.y -= ht + 8;
      } else w.text("(figure: open the quiz in the app to see it)", { size: 9, color: COLORS.soft });
    }

    if (q.optionImages) {
      const cols = Math.max(4, q.optionImages.length); // 5 or 6 option pictures get narrower tiles so they fit the page
      const tile = (A4.w - 2 * M - (cols - 1) * 8) / cols;
      const loaded = await Promise.all(q.optionImages.map(picture));
      const rowH = 120;
      w.ensure(rowH + 14);
      const top = w.y;
      loaded.forEach((img, oi) => {
        const x = M + oi * (tile + 8);
        const isRight = oi === q.answer;
        const isPicked = oi === picked;
        w.page.drawRectangle({ x, y: top - rowH, width: tile, height: rowH, borderColor: isRight ? COLORS.ok : isPicked ? COLORS.bad : COLORS.line, borderWidth: isRight || isPicked ? 2 : 0.6 });
        if (img) {
          const s = Math.min((tile - 8) / img.width, (rowH - 26) / img.height);
          w.page.drawImage(img, { x: x + (tile - img.width * s) / 2, y: top - 4 - img.height * s, width: img.width * s, height: img.height * s });
        }
        const tag = `${oi + 1}${isRight ? "  Correct" : isPicked ? "  Your answer" : ""}`;
        w.page.drawText(tag, { x: x + 4, y: top - rowH + 5, size: 8.5, font: isRight || isPicked ? bold : regular, color: isRight ? COLORS.ok : isPicked ? COLORS.bad : COLORS.soft });
      });
      w.y = top - rowH - 6;
    } else q.options.forEach((opt, oi) => {
      const isRight = oi === q.answer;
      const isPicked = oi === picked;
      const tag = isRight ? "  [Correct answer]" : isPicked ? "  [Your answer, wrong]" : "";
      const lines = w.wrap(`${LETTERS[oi]}. ${opt}${tag}`, regular, 9.5, A4.w - 2 * M - 16);
      w.ensure(lines.length * 13 + 4);
      if (isRight || isPicked) {
        w.page.drawRectangle({ x: M + 4, y: w.y - lines.length * 13 - 1, width: A4.w - 2 * M - 8, height: lines.length * 13 + 2, color: isRight ? COLORS.okBg : COLORS.badBg });
      }
      w.text(`${LETTERS[oi]}. ${opt}${tag}`, { size: 9.5, x: M + 10, width: A4.w - 2 * M - 16, bold: isRight || isPicked, color: isRight ? COLORS.ok : isPicked ? COLORS.bad : COLORS.text });
    });
    w.text(picked === null ? "You skipped this question." : right ? "You answered correctly." : "You answered wrongly.", { size: 9, bold: true, color: picked === null ? COLORS.soft : right ? COLORS.ok : COLORS.bad });
    w.text(q.explanation ? `Explanation: ${q.explanation}` : " ", { size: 9, color: COLORS.soft, gap: 10 });
  }

  // ---- footers
  const total = w.pages.length;
  w.pages.forEach((p, i) => {
    const label = `Mustaqbil Prep · Page ${i + 1} of ${total}`;
    p.drawText(label, { x: A4.w - M - regular.widthOfTextAtSize(label, 8), y: 22, size: 8, font: regular, color: COLORS.soft });
  });

  return doc.save();
}

function weakest(score: Score, names: PdfNames) {
  return Object.entries(score.byUnit)
    .map(([key, tally]) => {
      const cut = key.lastIndexOf(":");
      const course = key.slice(0, cut);
      return { tally, label: `${names.course(course)} · ${names.unit(course, Number(key.slice(cut + 1)))}` };
    })
    .sort((a, b) => pct(a.tally) - pct(b.tally) || b.tally.total - a.tally.total);
}
