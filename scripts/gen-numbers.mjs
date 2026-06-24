/**
 * Generate the "Moji prvi brojevi" colour-in scenes with Gemini and save them,
 * trimmed, into public/icons-art/<key>.png (the exact files the number leaf
 * auto-uses — see lib/numbers.ts). Each scene shows EXACTLY N cute things to
 * colour (the numeral's quantity); 0 is an empty basket. Style matches the
 * alphabet art: hand-drawn black outline, NO background, NO colour — a clean
 * coloring page (see scripts/gen-alphabet.mjs).
 *
 * Usage:
 *   node scripts/gen-numbers.mjs num-3          # one number (test)
 *   node scripts/gen-numbers.mjs num-1 num-2 …  # a batch
 *   node scripts/gen-numbers.mjs --list         # print all keys + status
 *   node scripts/gen-numbers.mjs --all          # every missing key
 *
 * Re-running a key overwrites it (regenerate until you like it).
 */
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ART_DIR = join(process.cwd(), "public", "icons-art");

// key (file name) → { count, thing }. The prompt asks for exactly `count` of
// `thing`; count 0 is special-cased to an empty basket below.
const SUBJECTS = {
  "num-0": { count: 0, thing: "basket" },
  "num-1": { count: 1, thing: "happy smiling sun" },
  "num-2": { count: 2, thing: "cute little bird" },
  "num-3": { count: 3, thing: "cute frog" },
  "num-4": { count: 4, thing: "cute fish" },
  "num-5": { count: 5, thing: "cute butterfly" },
  "num-6": { count: 6, thing: "cute ladybug" },
  "num-7": { count: 7, thing: "cute five-pointed star with a happy face" },
  "num-8": { count: 8, thing: "cute flower (a tulip)" },
  "num-9": { count: 9, thing: "cute bee" },
};

const NUM_WORD = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

function subjectClause({ count, thing }) {
  if (count === 0) {
    return "a single cute empty wicker basket, clearly EMPTY with nothing inside it";
  }
  const plural = /s$|sh$|ch$/.test(thing) ? `${thing}es` : `${thing}s`;
  const noun = count === 1 ? `a single cute cartoon ${thing}` : `exactly ${NUM_WORD[count]} (${count}) cute cartoon ${plural}`;
  const layout =
    count === 1
      ? ""
      : `, all the same size and clearly SEPARATED from each other (not overlapping), arranged neatly so a child can count every one`;
  return `${noun}${layout}`;
}

const PROMPT = (subject) =>
  `An OUTLINE-ONLY black and white coloring page for young children: ${subject}. ` +
  `The picture must look like it was DRAWN BY HAND with a crayon or a soft pencil on paper — a loose, hand-sketched children's illustration. The strokes must look hand-made and a little rough: slightly grainy, uneven and wobbly lines with natural imperfections and visible sketchiness, clearly NOT smooth digital vector art, NOT crisp geometric curves, NOT a clean clipart look. ` +
  `Black hand-drawn outlines, closed enough that a child can colour inside them; pure white background, the interior left BLANK and UNCOLOURED (no shading or fill inside the shapes). ` +
  `No shading, no hatching, no grey, no colour, no fill; every interior area left plain white. ` +
  `Show ONLY the subject(s) described, centered and spread across the page — absolutely NO background scenery: no clouds, no sky, no ground, no grass, no stars behind them, nothing behind them. ` +
  `No numbers, no text, no letters, no border, no frame.`;

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const env = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  const m = env.match(/^\s*GEMINI_API_KEY\s*=\s*(.+)\s*$/m);
  if (!m) throw new Error("GEMINI_API_KEY not found in env or .env.local");
  return m[1].trim();
}

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const ai = new GoogleGenAI({ apiKey: apiKey(), httpOptions: { timeout: 120000 } });

/** Generate, trim whitespace, pad slightly, and save one key. */
async function generateOne(key) {
  const subject = SUBJECTS[key];
  if (!subject) throw new Error(`unknown key "${key}" (not in SUBJECTS)`);

  const res = await ai.models.generateContent({ model: MODEL, contents: PROMPT(subjectClause(subject)) });
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  const b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!b64) {
    const text = parts.map((p) => p.text).filter(Boolean).join(" ");
    throw new Error(`no image returned for "${key}"${text ? ` — model said: ${text}` : ""}`);
  }

  // flatten to white → trim borders twice (outer + any letterbox frame) → pad.
  const flat = await sharp(Buffer.from(b64, "base64")).flatten({ background: "#ffffff" }).png().toBuffer();
  const t1 = await sharp(flat).trim({ threshold: 15 }).toBuffer();
  const trimmed = await sharp(t1).trim({ threshold: 15 }).toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(width, height) * 0.04);
  const out = await sharp(trimmed)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  writeFileSync(join(ART_DIR, `${key}.png`), out);
  console.log(`✓ ${key}.png  (${width}×${height} +${pad}px)`);
}

const args = process.argv.slice(2);

if (args[0] === "--list" || args.length === 0) {
  console.log("Number scene keys (✓ = already has art):");
  for (const key of Object.keys(SUBJECTS)) {
    console.log(`  ${existsSync(join(ART_DIR, `${key}.png`)) ? "✓" : " "} ${key.padEnd(8)} ${subjectClause(SUBJECTS[key])}`);
  }
  console.log("\nUsage: node scripts/gen-numbers.mjs <key> [key…]   |   --all");
  process.exit(0);
}

const keys = args[0] === "--all"
  ? Object.keys(SUBJECTS).filter((k) => !existsSync(join(ART_DIR, `${k}.png`)))
  : args;

console.log(`Generating ${keys.length} image(s) with ${MODEL}…`);
for (const key of keys) {
  try {
    await generateOne(key);
  } catch (e) {
    console.error(`✗ ${key}: ${e.message}`);
  }
}
console.log("Done.");
