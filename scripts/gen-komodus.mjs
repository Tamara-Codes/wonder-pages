// One-off: generate Komodus mascot candidates via Gemini (Nano Banana).
// Reuses the env-loading + SDK pattern from make-princess.mjs.
//   node scripts/gen-komodus.mjs            -> 4 base candidates
//   node scripts/gen-komodus.mjs sheet      -> character sheet from komodus/base.png
//   node scripts/gen-komodus.mjs scene "<instruction>" <outName>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const MODEL = env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY, httpOptions: { timeout: 120000 } });
const dir = new URL("../komodus/", import.meta.url);
if (!existsSync(dir)) mkdirSync(dir);

const STYLE =
  `Style: flat vector illustration with soft gradient shading, clean bold outlines, ` +
  `modern and minimal, suitable for logos and print. ` +
  `Colors: leaf-green body (#5BB86A), soft cream belly (#FBF3E0), coral accent (#FF8A65), ` +
  `sunny-yellow highlights (#FFD54F). Plain off-white background (#FBF7EF).`;

// Identity lock for image-to-image edits — stops Gemini from "redesigning" him.
const LOCK =
  `CRITICAL: keep the dragon's identity EXACTLY identical to the attached reference image — ` +
  `same leaf-green scale color, same cream belly color AND shape, same eye shape and color, ` +
  `same coral wing color and size, same back spikes, same face. Do NOT restyle or recolor him. ` +
  `Change ONLY his pose and the scene around him. He must look like the same character.`;

const BASE_PROMPT =
  `A friendly baby Komodo dragon mascot named "Komodus" for a children's personalized-book brand. ` +
  `Chubby, rounded, huggable proportions; oversized friendly eyes; a big warm smile; tiny rounded wings; ` +
  `soft rounded back spikes (cute, not scary). Cheerful, curious personality. ` +
  STYLE +
  ` Full body, front view, standing, waving hello. Adorable, premium, child-friendly. Square image, high resolution.`;

async function gen(prompt, contents) {
  const res = await ai.models.generateContent({ model: MODEL, contents: contents ?? prompt });
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  const data = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!data) {
    console.error("No image data. Text parts:", parts.map((p) => p.text).filter(Boolean).join("\n") || "(none)");
    return null;
  }
  return Buffer.from(data, "base64");
}

function load(name) {
  return readFileSync(new URL(name, dir));
}

const mode = process.argv[2];

if (!mode) {
  // 4 base candidates
  for (let i = 1; i <= 4; i++) {
    process.stdout.write(`base candidate ${i}/4… `);
    const buf = await gen(BASE_PROMPT);
    if (buf) {
      writeFileSync(new URL(`base-${i}.png`, dir), buf);
      console.log("ok");
    } else console.log("FAILED");
  }
} else if (mode === "sheet") {
  const img = load("base.png");
  const instruction =
    `Make a character reference sheet of THIS exact dragon character: the same Komodus in 5 poses ` +
    `(front, side, back, waving, reading a book) and 4 facial expressions (happy, excited, curious, sleepy). ` +
    `Keep the identical design, proportions, and colors throughout. Evenly spaced on a plain white background. ` +
    LOCK + " " + STYLE;
  process.stdout.write("character sheet… ");
  const buf = await gen(null, [{ role: "user", parts: [
    { inlineData: { mimeType: "image/png", data: img.toString("base64") } },
    { text: instruction },
  ]}]);
  if (buf) { writeFileSync(new URL("character-sheet.png", dir), buf); console.log("ok"); } else console.log("FAILED");
} else if (mode === "scene") {
  const instruction = process.argv[3];
  const outName = process.argv[4] || "scene.png";
  const img = load("base.png");
  process.stdout.write(`scene -> ${outName}… `);
  const buf = await gen(null, [{ role: "user", parts: [
    { inlineData: { mimeType: "image/png", data: img.toString("base64") } },
    { text: `${LOCK} Scene: ${instruction} ${STYLE}` },
  ]}]);
  if (buf) { writeFileSync(new URL(outName, dir), buf); console.log("ok"); } else console.log("FAILED");
}

console.log("Done. Files in wonder-pages/komodus/");
