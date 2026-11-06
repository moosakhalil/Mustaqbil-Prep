// Copies the files the PDF feature needs from node_modules into public/, so the app serves them itself
// (and the offline cache can keep them). The copies are committed; run this again only after upgrading those packages.
//   node scripts/copy-assets.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(path.join(root, to)), { recursive: true });
  fs.copyFileSync(path.join(root, from), path.join(root, to));
  console.log(`${to}  (${Math.round(fs.statSync(path.join(root, to)).size / 1024)} KB)`);
};

// DejaVu Sans covers maths symbols, arrows and Greek letters that appear in the questions (free licence, see its LICENSE)
copy("node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf", "public/fonts/DejaVuSans.ttf");
copy("node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf", "public/fonts/DejaVuSans-Bold.ttf");
copy("node_modules/dejavu-fonts-ttf/LICENSE", "public/fonts/DejaVu-LICENSE.txt");
// The in-app PDF viewer (pdf.js) runs its heavy work in this worker file
copy("node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs");
