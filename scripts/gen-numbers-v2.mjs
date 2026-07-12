/**
 * Generate the "Moji prvi brojevi" v2 numeral-character illustrations with
 * Gemini and save them, trimmed, into public/icons-art/num<digit>-face.png —
 * the exact files numberFace() in lib/print-build.ts auto-uses once present
 * (falls back to the hand-drawn SVG face otherwise). Style matches
 * scripts/gen-alphabet.mjs: bold black line art, no shading, no colour, no
 * background — a clean coloring page, but the SUBJECT here is the numeral
 * itself drawn as a friendly character with a face, not a picture beside it.
 *
 * Usage:
 *   node scripts/gen-numbers-v2.mjs 1            # one digit (test)
 *   node scripts/gen-numbers-v2.mjs 1 2 3        # a batch
 *   node scripts/gen-numbers-v2.mjs --list       # print all digits + status
 *   node scripts/gen-numbers-v2.mjs --all        # every missing digit 1–10
 *
 * Re-running a digit overwrites it (regenerate until you like it).
 */
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ART_DIR = join(process.cwd(), "public", "icons-art");

// digit → Croatian word, just for a friendlier console listing.
const WORDS = {
  "1": "Jedan", "2": "Dva", "3": "Tri", "4": "Četiri", "5": "Pet",
  "6": "Šest", "7": "Sedam", "8": "Osam", "9": "Devet", "10": "Deset",
};

// Where the face goes on each digit — the biggest fully-enclosed blank area of
// that numeral's own shape, so eyes/mouth never straddle or cross a stroke.
const FACE_SPOT = {
  "1": "just below the small flag/serif at the top of the vertical stroke, on the flat body of the stroke",
  "2": "inside the open upper hook, above the diagonal stroke, nowhere near the base",
  "3": "inside the top curve/loop of the number, well above the middle waist, small and neatly clear of both curves",
  "4": "in the wide open triangular gap in the upper-left area, well clear of the diagonal and vertical strokes",
  "5": "on the flat top bar, well above and clear of the curved hook below it",
  "6": "centered inside the round enclosed loop at the bottom of the number, exactly like a clock face sitting inside a ring — the loop must keep its own separate inner ring outline (a closed circle drawn inside the loop) so the loop still reads as a ring with a hole, with the face drawn inside that inner ring",
  "7": "extremely high up, touching the underside of the flat top bar, within the top 15% of the number's total height — must NOT be mid-way down the diagonal stroke",
  "8": "the number 8 has two round holes stacked in it, a small one on top and a bigger one below. Draw a small cute face — small eyes, small smile, with room to spare around it — sitting inside the BOTTOM hole. The bottom hole itself should look exactly like the top hole (a single simple round opening), just bigger, with the little face floating inside it. The top hole stays empty and plain",
  "9": "centered inside the round enclosed loop at the top of the number. That loop must keep its own separate inner ring outline (a closed circle drawn inside the loop, the way a real hole looks), so it still reads as a ring with a hole — do not let the face fill in or erase that inner ring, draw the face INSIDE it",
  "10": "centered inside the oval hole of the '0' character (the second, right-hand digit) — small face, plenty of white margin around it inside that hole, exactly like the standalone '0' character. The '1' character (the first, left-hand digit) stays completely plain and undecorated, no face on it",
};

// Extra per-digit shape notes for proportion problems seen in earlier drafts.
const SHAPE_NOTE = {
  "3": "Keep the numeral's proportions natural and slim, like a normal printed number 3 — NOT fat, bulging, " +
    "or swollen in the middle waist; the two curves should be a normal, even, moderate width throughout. ",
};

const TWO_DIGIT_NOTE = (digit) =>
  digit.length > 1
    ? `This number has TWO characters side by side ("1" then "0") — draw them as a single friendly DUO standing ` +
      `next to each other, close together like one combined character, both the same bold line weight and height. `
    : "";

const PROMPT = (digit) =>
  `A clean OUTLINE-ONLY black-and-white coloring page for young children: the number "${digit}" drawn as ` +
  `one single friendly cartoon character — the numeral's own shape IS the character's body, with two round ` +
  `simple eyes, small eyebrows, and a small smile placed ${FACE_SPOT[digit]}. ` +
  `${TWO_DIGIT_NOTE(digit)}` +
  `The face must sit ENTIRELY inside that one blank enclosed area — it must NOT overlap, cross, touch, or ` +
  `straddle any black outline stroke of the numeral, and must NOT span two separate strokes or loops. ` +
  `If that area is small, draw the face small enough to fit inside it cleanly rather than making it bigger. ` +
  `${SHAPE_NOTE[digit] ?? ""}` +
  `Bold, smooth, even black outlines of a UNIFORM thickness — crisp rounded cartoon line art like a printed ` +
  `coloring book or simple clipart, the kind of clean outline a child can colour inside. ` +
  `Absolutely NO shading, NO hatching, NO cross-hatching, NO texture, NO grain, NO grey tones, NO colour, ` +
  `NO fill, NO gradients, NO pencil sketchiness — every interior area left completely plain blank white. ` +
  `The lines must be smooth and confident, NOT grainy, NOT wobbly, NOT rough, NOT sketchy. ` +
  `Show ONLY the numeral character, centered, filling most of the frame, tall and upright — absolutely NO ` +
  `background scenery: no clouds, no sky, no ground, no stars, nothing behind it. Pure white background. ` +
  `No text, no letters, no other digits, no border, no frame — just the single numeral "${digit}" character.`;

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

/** Generate, trim whitespace, pad slightly, and save one digit. */
async function generateOne(digit) {
  if (!WORDS[digit]) throw new Error(`unknown digit "${digit}" (expected 0–9)`);

  const res = await ai.models.generateContent({ model: MODEL, contents: PROMPT(digit) });
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  const b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!b64) {
    const text = parts.map((p) => p.text).filter(Boolean).join(" ");
    throw new Error(`no image returned for "${digit}"${text ? ` — model said: ${text}` : ""}`);
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

  writeFileSync(join(ART_DIR, `num${digit}-face.png`), out);
  console.log(`✓ num${digit}-face.png  (${width}×${height} +${pad}px)`);
}

const args = process.argv.slice(2);

if (args[0] === "--list" || args.length === 0) {
  console.log("Number-character digits (✓ = already has art):");
  for (const digit of Object.keys(WORDS)) {
    console.log(`  ${existsSync(join(ART_DIR, `num${digit}-face.png`)) ? "✓" : " "} ${digit.padEnd(3)} ${WORDS[digit]}`);
  }
  console.log("\nUsage: node scripts/gen-numbers-v2.mjs <digit> [digit…]   |   --all");
  process.exit(0);
}

const keys = args[0] === "--all"
  ? Object.keys(WORDS).filter((d) => !existsSync(join(ART_DIR, `num${d}-face.png`)))
  : args;

console.log(`Generating ${keys.length} digit(s) with ${MODEL}…`);
for (const digit of keys) {
  try {
    await generateOne(digit);
  } catch (e) {
    console.error(`✗ ${digit}: ${e.message}`);
  }
}
console.log("Done.");
