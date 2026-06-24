/**
 * Trim the surrounding whitespace from every colour-in illustration in
 * public/icons-art so the drawing fills its frame (otherwise the generated
 * PNGs float small inside a big white margin). Re-run after adding new art.
 *
 *   node scripts/trim-art.mjs
 */
import sharp from "sharp";
import { readdirSync, writeFileSync } from "fs";
import { join } from "path";

const dir = join(process.cwd(), "public", "icons-art");
const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".png"));

for (const f of files) {
  const p = join(dir, f);
  // Trim the border, twice: the first pass removes the outer frame (e.g. white),
  // the second removes any inner letterbox frame in a different solid colour
  // (e.g. grey bars around an otherwise white image). Then add a small uniform
  // margin back so the lines don't touch the very edge.
  const once = await sharp(p).trim({ threshold: 15 }).toBuffer();
  const trimmed = await sharp(once).trim({ threshold: 15 }).toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(width, height) * 0.04);
  const out = await sharp(trimmed)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  writeFileSync(p, out);
  console.log(`trimmed ${f}: ${width}×${height} (+${pad}px pad)`);
}
