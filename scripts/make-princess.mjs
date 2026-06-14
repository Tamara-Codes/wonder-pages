// One-off: generate a Princess coloring-book page directly via Gemini,
// using the same prompt recipe as app/api/generate + lib/gemini, and write
// it to public/. Bypasses auth/credits entirely.
import { readFileSync, writeFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

// Load GEMINI_API_KEY (and optional model override) from .env.local.
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

// Princess theme + Medium coloring style, mirroring lib/themes + lib/difficulty.
const subject =
  "fairytale princesses with sparkling crowns, a magical castle, royal gowns and friendly woodland helpers";
const coloringStyle =
  "Simple cute cartoon shapes with thick clean lines that are easy to color inside, a moderate amount of detail.";
const prompt = `Black and white coloring book page for young children. Subject: ${subject}. Bold clean black outlines only, absolutely no shading, no grey, no color fill, pure white background. ${coloringStyle} Centered full-page composition.`;

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

console.log(`Generating with ${MODEL}…`);
const res = await ai.models.generateContent({ model: MODEL, contents: prompt });

const parts = res.candidates?.[0]?.content?.parts ?? [];
const data = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
if (!data) {
  console.error("No image data returned. Raw text parts:");
  console.error(parts.map((p) => p.text).filter(Boolean).join("\n") || "(none)");
  process.exit(1);
}

const out = new URL("../public/princess-coloring.png", import.meta.url);
writeFileSync(out, Buffer.from(data, "base64"));
console.log("Wrote", out.pathname);
