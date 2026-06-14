// Standalone "Find It!" generator — runs the REAL pipeline without Supabase.
// Gemini draws the scene; our code composites Wobble at coords we own (mirrors
// app/api/generate/route.ts). Saves the playable PNG + an answer-key PNG.
//
//   node scripts/gen-sample.mjs [theme]
//   theme = ocean | unicorns | space | dinosaurs | race-cars  (default: ocean)

import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

// --- load .env.local manually (no dotenv dependency) ---
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const THEMES = {
  unicorns:    { name: "Unicorns",     color: "#ff5ca8", prompt: "magical unicorns, rainbows, sparkles and castles" },
  space:       { name: "Space",        color: "#8a6cff", prompt: "outer space with rockets, planets, stars and friendly astronauts" },
  dinosaurs:   { name: "Dinosaurs",    color: "#46c36a", prompt: "friendly cartoon dinosaurs in a prehistoric jungle with volcanoes" },
  ocean:       { name: "Under the Sea", color: "#3da5ff", prompt: "an underwater ocean scene with fish, dolphins, coral and treasure" },
  "race-cars": { name: "Race Cars",    color: "#ff7a45", prompt: "fast race cars on a winding track with flags and trophies" },
};

const themeId = process.argv[2] ?? "ocean";
const theme = THEMES[themeId];
if (!theme) { console.error("Unknown theme:", themeId, "\nUse:", Object.keys(THEMES).join(", ")); process.exit(1); }

// mirrors buildPrompt() find-it branch in route.ts
const prompt = `A busy, cheerful children's search-and-find illustration. Theme: ${theme.prompt}. Flat 2D vector cartoon style, bright happy colors, lots of small friendly details and characters spread evenly across the whole scene. No text, no words, no letters. Full-bleed background that fills the entire image.`;

// the real Wobble sprite (mirrors lib/sprites.ts)
const wobbleSvg = (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <ellipse cx="50" cy="92" rx="26" ry="6" fill="rgba(0,0,0,0.15)"/>
  <path d="M50 8 C26 8 16 28 16 52 C16 78 30 92 50 92 C70 92 84 78 84 52 C84 28 74 8 50 8 Z" fill="${color}" stroke="#2e2a3f" stroke-width="4"/>
  <circle cx="38" cy="48" r="10" fill="#ffffff"/><circle cx="62" cy="48" r="10" fill="#ffffff"/>
  <circle cx="40" cy="50" r="4.5" fill="#2e2a3f"/><circle cx="60" cy="50" r="4.5" fill="#2e2a3f"/>
  <path d="M40 68 Q50 78 60 68" fill="none" stroke="#2e2a3f" stroke-width="4" stroke-linecap="round"/>
  <path d="M30 20 q-8 -10 2 -14" fill="none" stroke="#2e2a3f" stroke-width="4" stroke-linecap="round"/>
  <path d="M70 20 q8 -10 -2 -14" fill="none" stroke="#2e2a3f" stroke-width="4" stroke-linecap="round"/>
  <circle cx="28" cy="6" r="4" fill="${color}" stroke="#2e2a3f" stroke-width="3"/>
  <circle cx="72" cy="6" r="4" fill="${color}" stroke="#2e2a3f" stroke-width="3"/></svg>`;

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";

async function generateImage(p) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({ model: MODEL, contents: p });
  for (const part of res.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) return Buffer.from(part.inlineData.data, "base64");
  }
  throw new Error("Gemini returned no image data.");
}

console.log(`Generating "${theme.name}" Find It!  (model: ${MODEL})…`);
const image = await generateImage(prompt);

// --- composite Wobble, exactly like route.ts ---
const base = sharp(image);
const meta = await base.metadata();
const W = meta.width ?? 1024, H = meta.height ?? 1024;
const size = Math.round(Math.min(W, H) * 0.09);
const margin = Math.round(Math.min(W, H) * 0.06);
const x = margin + Math.floor(Math.random() * (W - size - 2 * margin));
const y = margin + Math.floor(Math.random() * (H - size - 2 * margin));

const sprite = await sharp(Buffer.from(wobbleSvg(theme.color))).resize(size, size).png().toBuffer();
const playable = await base.composite([{ input: sprite, left: x, top: y }]).png().toBuffer();
fs.writeFileSync("find-it-real.png", playable);

// answer-key overlay (a ring around the coords we stored)
const pad = Math.round(size * 0.25);
const rw = size + pad * 2;
const ring = `<svg xmlns="http://www.w3.org/2000/svg" width="${rw}" height="${rw}">
  <circle cx="${rw/2}" cy="${rw/2}" r="${rw/2 - 6}" fill="none" stroke="#ff2d6f" stroke-width="8"/></svg>`;
const ringBuf = await sharp(Buffer.from(ring)).png().toBuffer();
const answer = await sharp(playable)
  .composite([{ input: ringBuf, left: x - pad, top: y - pad }]).png().toBuffer();
fs.writeFileSync("find-it-real-answer.png", answer);

console.log(`Image: ${W}x${H}`);
console.log(`Answer key: { x:${x}, y:${y}, w:${size}, h:${size}, imgW:${W}, imgH:${H} }`);
console.log("Wrote find-it-real.png and find-it-real-answer.png");
