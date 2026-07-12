/**
 * Generate the FULL-COLOUR kite-flying-frog scene for the numbers-v2
 * connect-the-dots page with Gemini and save it into
 * public/icons-art/kite-frog.png — the file connectDotsKiteLeaf() in
 * lib/print-build.ts auto-uses once present. Unlike most booklet art this is
 * a whole painted storybook scene (like the shirts page), NOT line art:
 * sky + meadow + frog with a wind-blown scarf holding a spool, with a thin
 * kite string rising into EMPTY sky — the kite itself is only dots the child
 * connects, drawn in code (connectDotsKiteSvg) over this image.
 *
 * After regenerating, eyeball the page render and re-tune KITE_CORNERS in
 * lib/print-build.ts so the diamond's bottom dot sits on the string's tip.
 *
 * Usage:
 *   node scripts/gen-kite-frog.mjs            # generate (only if the PNG is missing)
 *   node scripts/gen-kite-frog.mjs --force    # overwrite the APPROVED art (re-tune KITE_CORNERS after!)
 */
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ART_DIR = join(process.cwd(), "public", "icons-art");
const OUT_FILE = join(ART_DIR, "kite-frog.png");

// The current kite-frog.png was APPROVED by Tamara (2026-07-12, "perfect —
// save it just as it is") and KITE_CORNERS in lib/print-build.ts is tuned to
// it. Refuse to overwrite it unless explicitly forced.
if (existsSync(OUT_FILE) && !process.argv.includes("--force")) {
  console.error(
    "kite-frog.png already exists and the current version is APPROVED.\n" +
    "Re-run with --force to overwrite it — then re-tune KITE_CORNERS in lib/print-build.ts.",
  );
  process.exit(1);
}

const PROMPT =
  `A soft, warm children's picture-book illustration in gentle watercolor style, PORTRAIT orientation ` +
  `(taller than wide, about 3:4). A wide light-blue spring sky fills the upper two thirds of the picture, ` +
  `with a few soft white clouds near the edges, some thin curved white wind swirls, and a few small green ` +
  `leaves tumbling through the air to show a breezy day. The bottom third is a fresh green meadow with soft ` +
  `grass, tiny wildflowers, a gentle hill, and a small rustic wooden fence off to the right side. ` +
  `Standing on the meadow in the BOTTOM-LEFT corner is a cute happy cartoon frog, drawn small (about a ` +
  `quarter of the picture's height), wearing a little red jacket and a long yellow striped knitted scarf ` +
  `whose ends stream out sideways to the left, flapping in the wind. The frog looks up toward the upper ` +
  `right and holds a small wooden kite spool in its hands. ` +
  `From the spool, ONE single very THIN dark kite string rises in a gentle elegant curve toward the ` +
  `RIGHT side of the picture — and simply ENDS in the open sky at about the MIDDLE HEIGHT of the ` +
  `picture, no higher. Tied to the string near its end are two or three tiny colorful ribbon bows ` +
  `(one blue, one yellow, one red), like the tail of a kite. ` +
  `VERY IMPORTANT: there is NO KITE anywhere in the picture. The string ends at nothing, half-way up — ` +
  `the ENTIRE TOP HALF of the sky, above the string's end, stays open, calm and almost empty (just ` +
  `plain sky), because a large connect-the-dots kite will be printed there later. ` +
  `No text, no letters, no numbers, no dots, no border, no frame. Soft storybook colors, cozy and airy.`;

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const env = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  const m = env.match(/^\s*GEMINI_API_KEY\s*=\s*(.+)\s*$/m);
  if (!m) throw new Error("GEMINI_API_KEY not found in env or .env.local");
  return m[1].trim();
}

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const ai = new GoogleGenAI({ apiKey: apiKey(), httpOptions: { timeout: 120000 } });

const res = await ai.models.generateContent({
  model: MODEL,
  contents: PROMPT,
  config: { imageConfig: { aspectRatio: "3:4" } },
});
const parts = res.candidates?.[0]?.content?.parts ?? [];
const b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
if (!b64) {
  const text = parts.map((p) => p.text).filter(Boolean).join(" ");
  throw new Error(`no image returned${text ? ` — model said: ${text}` : ""}`);
}

// Full-bleed colour scene: no trimming/whitening (that's for line art on
// white) — just flatten and cap the width for a sane file size.
const out = await sharp(Buffer.from(b64, "base64"))
  .flatten({ background: "#ffffff" })
  .resize({ width: 1400, withoutEnlargement: true })
  .png()
  .toBuffer();
const { width, height } = await sharp(out).metadata();

writeFileSync(join(ART_DIR, "kite-frog.png"), out);
console.log(`✓ kite-frog.png  (${width}×${height}, colour scene)`);
