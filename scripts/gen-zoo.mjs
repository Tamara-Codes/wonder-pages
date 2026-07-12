/**
 * Generate the "count the zoo animals" scene for the numbers booklet with
 * Gemini: one FULL-COLOUR zoo picture where the exact animal counts matter —
 * the child counts each kind and writes the number in a box under the scene
 * (zooCountLeaf in lib/print-build.ts). Saved to public/icons-art/zoo-scene.png.
 *
 * TARGET COUNTS (the leaf's answer key — keep prompt and leaf in sync):
 *   1 lion, 2 camels, 3 elephants, 4 monkeys  (+ 1 giraffe, 1 zebra as extras)
 *
 * Like the shirts page, the whole scene is one Gemini image, so the workflow
 * is: generate → COUNT EVERY ANIMAL IN THE PNG BY EYE → re-run until the
 * counts are exactly right (this is the accepted exception to "code owns
 * coordinates" for static print pages).
 *
 * Usage:
 *   node scripts/gen-zoo.mjs          # (re)generate — overwrites the PNG
 */
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ART_DIR = join(process.cwd(), "public", "icons-art");

const PROMPT =
  `A cheerful FULL-COLOUR children's picture-book illustration of a ZOO, roughly SQUARE composition ` +
  `(as tall as it is wide, animals spread over several depth rows rather than one long line), on a pure ` +
  `white background. A simple sunny zoo scene with low green bushes, a couple of trees and simple fenced ` +
  `enclosures and exactly TWO separate trees, one towards the left and one towards the right. ` +
  `The scene contains EXACTLY TWELVE animals — this exact inventory and NOT ONE animal more or less, ` +
  `because children will count them: ` +
  `IN THE LEFT TREE: exactly TWO brown monkeys sitting on a branch. ` +
  `IN THE RIGHT TREE: exactly ONE brown monkey hanging from a branch. ` +
  `ON THE GROUND, lower middle: exactly ONE brown monkey (the fourth and last monkey). ` +
  `All four monkeys are the SAME kind of simple brown cartoon monkey. ` +
  `UPPER LEFT area: exactly ONE elephant. ` +
  `MIDDLE of the scene: exactly ONE smaller elephant. ` +
  `RIGHT side: exactly ONE elephant (the third and last elephant). ` +
  `LOWER LEFT area: exactly ONE camel. ` +
  `UPPER RIGHT area: exactly ONE camel (the second and last camel), far away from the first camel. ` +
  `LOWER MIDDLE: exactly ONE lion, sitting alone. ` +
  `Plus exactly ONE giraffe and exactly ONE zebra somewhere in between. ` +
  `NO other animals of any kind: no birds, no fish, no insects, no people, no extra elephants, no extra ` +
  `monkeys. Total: 4 monkeys + 3 elephants + 2 camels + 1 lion + 1 giraffe + 1 zebra = 12 animals. ` +
  `EVERY animal must be FULLY VISIBLE and clearly separate — none overlapping another, none half-hidden ` +
  `behind trees, fences or each other — so a small child can count each kind without doubt. ` +
  `All animals roughly similar in size, big enough to recognise. ` +
  `Flat, clean vector-style art with smooth confident outlines and soft flat colours, NO shading, NO ` +
  `gradients, NO texture. NO text, NO letters, NO numbers, NO signs anywhere in the image. No border, ` +
  `no frame. Pure white background behind the scene.`;

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

const res = await ai.models.generateContent({ model: MODEL, contents: PROMPT });
const parts = res.candidates?.[0]?.content?.parts ?? [];
const b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
if (!b64) {
  const text = parts.map((p) => p.text).filter(Boolean).join(" ");
  throw new Error(`no image returned${text ? ` — model said: ${text}` : ""}`);
}

const flat = await sharp(Buffer.from(b64, "base64")).flatten({ background: "#ffffff" }).png().toBuffer();
const t1 = await sharp(flat).trim({ threshold: 15 }).toBuffer();
const trimmed = await sharp(t1).trim({ threshold: 15 }).toBuffer();
const { width, height } = await sharp(trimmed).metadata();
const pad = Math.round(Math.max(width, height) * 0.03);
const padded = await sharp(trimmed)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toBuffer();
writeFileSync(join(ART_DIR, "zoo-scene.png"), await whitenBackground(padded));
console.log(`✓ zoo-scene.png  (${width}×${height} +${pad}px) — now COUNT the animals by eye!`);
