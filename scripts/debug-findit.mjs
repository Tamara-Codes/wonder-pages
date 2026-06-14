// Debug the Find It! pipeline: generate a scene with known items, save it,
// then run detection and dump the RAW model response + parsed boxes.
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
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

const IMAGE_MODEL = env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const DETECT_MODEL = env.GEMINI_DETECT_MODEL || "gemini-2.5-flash";
const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
  httpOptions: { timeout: 120000 },
});

const labels = ["Star", "Key", "Crown", "Fish", "Balloon", "Apple"];
const items = labels.map((l) => `a ${l.toLowerCase()}`).join(", ");

const genPrompt = `A busy children's seek-and-find picture, packed edge to edge with many small friendly objects. Theme: outer space with rockets, planets, stars and friendly astronauts. Naturally include these specific objects somewhere in the scene, each one fully visible (not hidden, cropped or covered), clearly recognizable, well separated from each other and placed in different areas: ${items}. STRICT FLAT VECTOR STICKER STYLE: solid flat color fills only, no gradients, uniform black outlines. No text. Flat full-bleed background.`;

const outPath = new URL("../public/debug-findit.png", import.meta.url);
let png;
if (process.env.REUSE === "1") {
  png = readFileSync(outPath);
  console.log("[1] Reusing existing public/debug-findit.png");
} else {
  console.log(`[1] Generating with ${IMAGE_MODEL}…`);
  const gen = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: genPrompt,
  });
  const imgData = (gen.candidates?.[0]?.content?.parts ?? []).find(
    (p) => p.inlineData?.data,
  )?.inlineData?.data;
  if (!imgData) {
    console.error("No image generated.");
    process.exit(1);
  }
  png = Buffer.from(imgData, "base64");
  writeFileSync(outPath, png);
  console.log("    saved public/debug-findit.png");
}

console.log(`[2] Detecting with ${DETECT_MODEL}…`);
// Downscale for detection: smaller payload + faster, boxes are normalized anyway.
const small = await sharp(png).resize(768, 768, { fit: "inside" }).png().toBuffer();
console.log(`    detection image: ${(small.length / 1024).toFixed(0)}KB`);
const list = labels.map((l) => `"${l}"`).join(", ");
const detPrompt =
  `Detect these objects in the image: ${list}. ` +
  `Return ONLY a JSON array, no prose, no markdown, no code fences. ` +
  `For EACH object output an object with EXACTLY these keys: "label", "xmin", "ymin", "xmax", "ymax". ` +
  `The four numbers are integers from 0 to 1000 (x runs left→right, y runs top→bottom). ` +
  `Do NOT use a "box_2d" array. Follow this exact format:\n` +
  `[{"label":"Star","xmin":120,"ymin":60,"xmax":300,"ymax":240}]\n` +
  `List each object at most once. Omit any requested object not clearly present.`;

const det = await ai.models.generateContent({
  model: DETECT_MODEL,
  contents: [
    {
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/png", data: small.toString("base64") } },
        { text: detPrompt },
      ],
    },
  ],
});

const text = (det.candidates?.[0]?.content?.parts ?? [])
  .map((p) => (typeof p.text === "string" ? p.text : ""))
  .join("");
console.log("\n=== RAW detection text ===");
console.log(text);

// Replicate the parser + matcher from lib/gemini + route.
const match = text.match(/\[[\s\S]*\]/);
const raw = match ? JSON.parse(match[0]) : [];
const parsed = [];
for (const e of raw) {
  if (!e || typeof e !== "object" || typeof e.label !== "string") continue;
  if (e.xmin != null && e.ymin != null && e.xmax != null && e.ymax != null) {
    parsed.push({ label: e.label, box: [Number(e.ymin), Number(e.xmin), Number(e.ymax), Number(e.xmax)] });
  } else {
    const box = e.box_2d ?? e.box ?? e.bbox;
    if (Array.isArray(box) && box.length === 4) parsed.push({ label: e.label, box: box.map(Number) });
  }
}
const meta = await sharp(png).metadata();
const W = meta.width, H = meta.height;
console.log(`\n=== Parsed ${parsed.length}/${labels.length} → pixel coords (image ${W}x${H}) ===`);
for (const b of parsed) {
  const [ymin, xmin, ymax, xmax] = b.box;
  console.log(
    `  ${b.label.padEnd(9)} x=${Math.round((xmin / 1000) * W)} y=${Math.round((ymin / 1000) * H)} ` +
      `w=${Math.round(((xmax - xmin) / 1000) * W)} h=${Math.round(((ymax - ymin) / 1000) * H)}`,
  );
}
