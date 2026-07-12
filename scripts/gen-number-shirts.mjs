/**
 * Generate the "missing numbers" shirts-on-a-clothesline page for the
 * numbers-v2 booklet with Gemini: ten t-shirts pegged to two washing lines
 * (1–5 up top, 6–10 below), each with a white label on the chest. Shirts
 * 1, 2, 4, 7 and 10 show their number; shirts 3, 5, 6, 8 and 9 have an EMPTY
 * label the child writes into. Unlike the rest of the art this one is IN
 * COLOUR — blue shirts for a boy, pink for a girl — saved into
 * public/icons-art/num-shirts-<gender>.png, the files missingNumbersLeaf()
 * in lib/print-build.ts uses.
 *
 * Usage:
 *   node scripts/gen-number-shirts.mjs boy          # one variant
 *   node scripts/gen-number-shirts.mjs boy girl     # both
 *   node scripts/gen-number-shirts.mjs --all        # every missing variant
 *
 * Re-running a variant overwrites it (regenerate until you like it).
 */
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ART_DIR = join(process.cwd(), "public", "icons-art");

const COLOURS = {
  boy: { shirt: "light sky-blue", accent: "slightly darker blue" },
  girl: { shirt: "light pink", accent: "slightly darker pink" },
};

const PROMPT = (gender) => {
  const c = COLOURS[gender];
  return (
    `A cheerful FULL-COLOUR children's picture-book illustration, portrait orientation, on a pure white ` +
    `background with no scenery: two horizontal washing lines (simple rope lines stretched across the page), ` +
    `one in the upper half and one in the lower half. Hanging from each rope by small wooden clothespins are ` +
    `exactly FIVE simple cartoon t-shirts — ten t-shirts in total, all the same size, evenly spaced, none ` +
    `overlapping. Every t-shirt is plain ${c.shirt} with a ${c.accent} outline, and every t-shirt has one big ` +
    `plain WHITE CIRCLE label printed on the middle of its chest. ` +
    `The shirts are numbered in reading order — top rope left to right, then bottom rope left to right. ` +
    `Exactly FIVE of the white circle labels contain a number, drawn as a large, bold, dark, child-friendly ` +
    `digit; the other FIVE white circle labels are COMPLETELY EMPTY — pure blank white, no digit, no mark. ` +
    `TOP ROPE, left to right: shirt with "1", shirt with "2", shirt with EMPTY label, shirt with "4", ` +
    `shirt with EMPTY label. ` +
    `BOTTOM ROPE, left to right: shirt with EMPTY label, shirt with "7", shirt with EMPTY label, ` +
    `shirt with EMPTY label, shirt with "10". ` +
    `So the only digits visible anywhere in the whole image are exactly: 1, 2, 4, 7 and 10 — nothing else. ` +
    `Flat, clean vector-style art with smooth confident outlines, soft flat colours, NO shading, NO gradients, ` +
    `NO texture. Maybe one tiny cute bird sitting on a rope for charm, but otherwise NOTHING else: no sky, ` +
    `no clouds, no sun, no grass, no ground, no border, no frame, no text, no letters, no extra numbers. ` +
    `Pure white background everywhere behind the ropes and shirts.`
  );
};

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const env = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  const m = env.match(/^\s*GEMINI_API_KEY\s*=\s*(.+)\s*$/m);
  if (!m) throw new Error("GEMINI_API_KEY not found in env or .env.local");
  return m[1].trim();
}

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const ai = new GoogleGenAI({ apiKey: apiKey(), httpOptions: { timeout: 120000 } });

/** Snap the near-white background to PURE white (see gen-alphabet.mjs for why). */
async function whitenBackground(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    if ((data[i] + data[i + 1] + data[i + 2]) / 3 >= 245) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toBuffer();
}

/** Generate, trim whitespace, pad slightly, and save one gender variant. */
async function generateOne(gender) {
  if (!COLOURS[gender]) throw new Error(`unknown variant "${gender}" (expected boy | girl)`);

  const res = await ai.models.generateContent({ model: MODEL, contents: PROMPT(gender) });
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  const b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!b64) {
    const text = parts.map((p) => p.text).filter(Boolean).join(" ");
    throw new Error(`no image returned for "${gender}"${text ? ` — model said: ${text}` : ""}`);
  }

  const flat = await sharp(Buffer.from(b64, "base64")).flatten({ background: "#ffffff" }).png().toBuffer();
  const t1 = await sharp(flat).trim({ threshold: 15 }).toBuffer();
  const trimmed = await sharp(t1).trim({ threshold: 15 }).toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(width, height) * 0.04);
  const padded = await sharp(trimmed)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  const out = await whitenBackground(padded);

  writeFileSync(join(ART_DIR, `num-shirts-${gender}.png`), out);
  console.log(`✓ num-shirts-${gender}.png  (${width}×${height} +${pad}px)`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--list") {
  console.log("Shirt-page variants (✓ = already has art):");
  for (const g of Object.keys(COLOURS)) {
    console.log(`  ${existsSync(join(ART_DIR, `num-shirts-${g}.png`)) ? "✓" : " "} ${g}`);
  }
  console.log("\nUsage: node scripts/gen-number-shirts.mjs <boy|girl> [boy|girl]   |   --all");
  process.exit(0);
}

const keys = args[0] === "--all"
  ? Object.keys(COLOURS).filter((g) => !existsSync(join(ART_DIR, `num-shirts-${g}.png`)))
  : args;

console.log(`Generating ${keys.length} variant(s) with ${MODEL}…`);
for (const gender of keys) {
  try {
    await generateOne(gender);
  } catch (e) {
    console.error(`✗ ${gender}: ${e.message}`);
  }
}
console.log("Done.");
