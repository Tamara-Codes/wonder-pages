/**
 * Generate the Croatian-alphabet colour-in illustrations with Gemini and save
 * them, trimmed, into public/icons-art/<key>.png (the exact files the alphabet
 * page auto-uses). Style: a single cute children's cartoon, bold black line art,
 * NO background, NO colour — a clean coloring page.
 *
 * Usage:
 *   node scripts/gen-alphabet.mjs lion            # one image (test)
 *   node scripts/gen-alphabet.mjs cow lion frog … # a batch (any number of keys)
 *   node scripts/gen-alphabet.mjs --list          # print all keys + status
 *   node scripts/gen-alphabet.mjs --all           # every missing key (careful!)
 *
 * Re-running a key overwrites it (regenerate until you like it).
 * The key is the English file name, NOT the Croatian word (e.g. socks = Čarapa).
 */
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ART_DIR = join(process.cwd(), "public", "icons-art");

// key (file name) → what to draw. Covers the full Croatian alphabet.
const SUBJECTS = {
  airplane: "a cute cartoon airplane with a happy smiling face",
  banana: "a cute cartoon banana with a happy smiling face",
  cupcake: "a cute cartoon cupcake with a happy face",
  shoe: "a single cute cartoon shoe — a classic elegant lady's shoe with a small heel (a court / Mary-Jane style shoe), NOT a sneaker, NOT a trainer, NOT a boot",
  socks: "a pair of cute cartoon socks",
  jug: "a cute cartoon clay jug pot with a happy face",
  dolphin: "a cute cartoon dolphin with a friendly face",
  jam: "a cute cartoon jar of jam with a label",
  pupil: "a cute cartoon schoolchild pupil — a happy young school kid standing, wearing a backpack and holding a book",
  book: "a cute cartoon open book, plain object with no face and no eyes",
  flute: "a simple cute cartoon wooden flute",
  guitar: "a cute cartoon acoustic guitar with a happy face and little arms and hands",
  helicopter: "a cute cartoon helicopter with a happy face",
  propeller: "a single cute cartoon propeller with three blades and a round centre hub (like a helicopter or motor propeller), with a happy smiling face",
  swing: "a single cute cartoon playground swing — a flat seat hanging from two ropes on a simple A-frame, NO child sitting on it",
  needle: "a simple cartoon sewing needle with thread",
  apple: "a cute cartoon apple with a happy face",
  cow: "a cute cartoon cow with a friendly face",
  lion: "a cute cartoon lion with a friendly face",
  heart: "a cute cartoon heart with a happy face",
  bear: "a cute cartoon teddy bear",
  orange: "a cute cartoon orange fruit with a happy face",
  snout: "a single cute cartoon animal snout / muzzle close-up — just the rounded nose shape with two nostrils, NO big face, NO eyes, NO whole pig, only the snout",
  cloud: "a cute cartoon cloud with a happy face",
  dog: "a cute cartoon dog with a friendly face",
  princess: "a cute cartoon princess — a little girl wearing a crown and a pretty gown, standing and smiling",
  fish: "a cute cartoon fish with a friendly face",
  sun: "a cute cartoon sun with a happy face",
  hat: "a cute cartoon sun hat",
  tiger: "a cute cartoon tiger with a friendly face",
  hook: "a simple cartoon fishing hook",
  train: "a cute cartoon train with a happy face",
  rabbit: "a cute cartoon rabbit with a friendly face",
  frog: "a cute cartoon frog with a friendly face",
};

const PROMPT = (subject) =>
  `An OUTLINE-ONLY black and white coloring page for young children: ${subject}. ` +
  `The picture must look like it was DRAWN BY HAND with a crayon or a soft pencil on paper — a loose, hand-sketched children's illustration. The strokes must look hand-made and a little rough: slightly grainy, uneven and wobbly lines with natural imperfections and visible sketchiness, clearly NOT smooth digital vector art, NOT crisp geometric curves, NOT a clean clipart look. ` +
  `Black hand-drawn outlines, closed enough that a child can colour inside them; pure white background, the interior left BLANK and UNCOLOURED (no shading or fill inside the shapes). ` +
  `No shading, no hatching, no grey, no colour, no fill; every interior area left plain white. ` +
  `Show ONLY the single subject, centered — absolutely NO background scenery: no clouds, no sky, no ground, no grass, no stars, nothing behind it. ` +
  `No text, no letters, no border, no frame.`;

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

  const res = await ai.models.generateContent({ model: MODEL, contents: PROMPT(subject) });
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
  console.log("Croatian alphabet keys (✓ = already has art):");
  for (const key of Object.keys(SUBJECTS)) {
    console.log(`  ${existsSync(join(ART_DIR, `${key}.png`)) ? "✓" : " "} ${key.padEnd(12)} ${SUBJECTS[key]}`);
  }
  console.log("\nUsage: node scripts/gen-alphabet.mjs <key> [key…]   |   --all");
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
