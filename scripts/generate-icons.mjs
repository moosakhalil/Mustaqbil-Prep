// Builds the app icons from the emblem (App Emblem.png, next to the jsons folder).
//   pnpm icons
// A simplified shield-only icon can replace the emblem later: change EMBLEM below and run this again.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const EMBLEM = path.resolve(root, "..", "App Emblem.png");
const out = path.join(root, "public", "icons");
const NAVY = "#0b1020"; // the dark theme background, so the gold and indigo of the emblem stand out

await mkdir(out, { recursive: true });

// the emblem without its empty margin
const art = await sharp(EMBLEM).trim().toBuffer();

/** A navy square (optionally with rounded corners) with the emblem centred at `ratio` of the side. */
async function tile(size, ratio, radius = 0) {
  const inner = await sharp(art).resize({ width: Math.round(size * ratio), height: Math.round(size * ratio), fit: "inside" }).toBuffer();
  const base = await sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: inner, gravity: "centre" }])
    .png()
    .toBuffer();
  if (!radius) return base;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/></svg>`);
  return sharp(base).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

const write = async (name, buf) => {
  await sharp(buf).toFile(path.join(out, name));
  console.log("public/icons/" + name);
};

for (const size of [192, 512]) await write(`icon-${size}.png`, await tile(size, 0.82, size * 0.22)); // any purpose: rounded tile
await write("icon-maskable-512.png", await tile(512, 0.64)); // maskable: full bleed, emblem inside the safe circle
await write("apple-touch-icon-180.png", await tile(180, 0.8)); // iOS rounds the corners itself
for (const size of [16, 32, 48]) await write(`favicon-${size}.png`, await tile(size, 0.94, size * 0.2));
