/**
 * Generate SIMPLE, minimal line-art icons for the numbers-v2 "counted object"
 * picture (e.g. 4 flowers for "4", 5 apples for "5") and save them to
 * public/icons-art/count-<key>.png. numberCountPicture() in lib/print-build.ts
 * uses these when present, falling back to the auto-outlined Noto icon
 * (lib/icons-line.ts) otherwise.
 *
 * These are deliberately PLAINER than the alphabet's bespoke art (no face, no
 * shading, very few internal lines) because they get tiled multiple times per
 * page at a larger size — too much detail per copy reads as visual clutter
 * once there are 5–10 of them on one leaf.
 *
 * Usage:
 *   node scripts/gen-count-icons.mjs apple
 *   node scripts/gen-count-icons.mjs apple star butterfly
 *   node scripts/gen-count-icons.mjs --list
 */
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ART_DIR = join(process.cwd(), "public", "icons-art");

// key → simple subject description, deliberately plain (no face, few details).
const SUBJECTS = {
  sun: "a simple sun — a plain circle with a ring of short simple triangular or rounded rays around it, no face",
  bird: "a single simple bird silhouette, sitting, a simple rounded body and one simple wing shape, no face details beyond a small dot eye, no feather texture",
  frog: "a simple sitting frog silhouette, plain rounded body and two simple round eyes on top, no face beyond the eyes, no skin texture",
  tulip: "a simple single tulip flower — a plain rounded cup-shaped bloom on a plain straight stem with one simple leaf",
  apple: "a simple apple — a plain rounded apple body with one small leaf and a short stem, no face, no shading lines, no highlight squiggles",
  ladybug: "a simple ladybug — a plain rounded oval body with a single line down the middle and a few simple round dots, small dot eyes, no face beyond that, no shading",
  star: "a single simple five-pointed star outline, plain and clean, NO sparkle lines, NO face, NO extra decoration of any kind — just the plain star shape",
  butterfly: "a simple butterfly — two large simple rounded upper wings and two smaller simple rounded lower wings, a plain thin body down the middle with two simple straight antennae, NO patterns or decorative lines or spots on the wings, NO face",
  bee: "a simple bee — a plain rounded oval body with two or three simple straight stripe lines, two plain simple oval wings, two small simple antennae, no face beyond small dot eyes",
  balloon: "a single simple balloon — a plain rounded balloon shape on a thin simple string, no face, no pattern",
};

const PROMPT = (subject) =>
  `A very simple, minimal black-and-white outline coloring icon for young children: ${subject}. ` +
  `Bold, smooth, even black outline of a UNIFORM thickness — as simple and clean as possible, the kind of ` +
  `plain, uncluttered icon that stays clear even when drawn small and repeated many times on a page. ` +
  `Use the FEWEST possible internal lines — only what's essential to recognise the shape. ` +
  `Absolutely NO shading, NO hatching, NO texture, NO grain, NO grey tones, NO colour, NO fill, NO gradients, ` +
  `NO sketchy or wobbly lines, NO tiny fine details — every interior area left completely plain blank white. ` +
  `Show ONLY the single object, centered, filling most of the frame — absolutely NO background, no scenery, ` +
  `nothing behind it. Pure white background. No text, no letters, no border, no frame.`;

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const env = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  const m = env.match(/^\s*GEMINI_API_KEY\s*=\s*(.+)\s*$/m);
  if (!m) throw new Error("GEMINI_API_KEY not found in env or .env.local");
  return m[1].trim();
}

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const ai = new GoogleGenAI({ apiKey: apiKey(), httpOptions: { timeout: 120000 } });

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

  writeFileSync(join(ART_DIR, `count-${key}.png`), out);
  console.log(`✓ count-${key}.png  (${width}×${height} +${pad}px)`);
}

const args = process.argv.slice(2);

if (args[0] === "--list" || args.length === 0) {
  console.log("Count-icon keys (✓ = already has art):");
  for (const key of Object.keys(SUBJECTS)) {
    console.log(`  ${existsSync(join(ART_DIR, `count-${key}.png`)) ? "✓" : " "} ${key.padEnd(10)} ${SUBJECTS[key]}`);
  }
  console.log("\nUsage: node scripts/gen-count-icons.mjs <key> [key…]");
  process.exit(0);
}

console.log(`Generating ${args.length} icon(s) with ${MODEL}…`);
for (const key of args) {
  try {
    await generateOne(key);
  } catch (e) {
    console.error(`✗ ${key}: ${e.message}`);
  }
}
console.log("Done.");
