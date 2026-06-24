/**
 * Build one contact-sheet PNG of every illustration in public/icons-art so the
 * whole set can be reviewed at a glance. Writes icons-art-montage.png at repo root.
 *   node scripts/montage.mjs
 */
import sharp from "sharp";
import { readdirSync, writeFileSync } from "fs";
import { join } from "path";

const DIR = join(process.cwd(), "public", "icons-art");
const files = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".png")).sort();

const THUMB = 200, PAD = 16, LABEL = 26, COLS = 6;
const cellW = THUMB + PAD * 2;
const cellH = THUMB + LABEL + PAD * 2;
const rows = Math.ceil(files.length / COLS);
const W = cellW * COLS, H = cellH * rows;

const composites = [];
for (let i = 0; i < files.length; i++) {
  const col = i % COLS, row = Math.floor(i / COLS);
  const x = col * cellW, y = row * cellH;
  const img = await sharp(join(DIR, files[i]))
    .resize(THUMB, THUMB, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  composites.push({ input: img, left: x + PAD, top: y + PAD });
  const name = files[i].replace(/\.png$/, "");
  const label = `<svg width="${cellW}" height="${LABEL}"><text x="${cellW / 2}" y="${LABEL - 7}" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#333">${name}</text></svg>`;
  composites.push({ input: Buffer.from(label), left: x, top: y + PAD + THUMB });
}

const out = await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
  .composite(composites)
  .png()
  .toBuffer();
writeFileSync(join(process.cwd(), "icons-art-montage.png"), out);
console.log(`montage: ${files.length} images → icons-art-montage.png (${W}×${H})`);
