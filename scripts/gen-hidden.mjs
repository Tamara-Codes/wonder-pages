// Hidden-object ("I Spy") demo generator — Option A.
// Gemini draws a busy BACKGROUND; our code composites N item sprites at known,
// non-overlapping coords. The find-list = exactly what we placed, so every tap
// is verifiable. Saves a playable PNG, an answer PNG, and prints the answer key.
//
//   node scripts/gen-hidden.mjs [theme] [count]
//   theme: ocean|unicorns|space|dinosaurs|race-cars (default ocean), count default 6

import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const THEMES = {
  unicorns:    "magical unicorns, rainbows, sparkles and castles",
  space:       "outer space with rockets, planets, stars and friendly astronauts",
  dinosaurs:   "friendly cartoon dinosaurs in a prehistoric jungle with volcanoes",
  ocean:       "an underwater ocean scene with fish, dolphins, coral and treasure",
  "race-cars": "fast race cars on a winding track with flags and trophies",
};
const themeId = process.argv[2] ?? "ocean";
const count = Number(process.argv[3] ?? 6);
const subject = THEMES[themeId];
if (!subject) { console.error("Unknown theme:", themeId); process.exit(1); }

// Busy background — extra clutter so small items have somewhere to hide.
// STRICT flat-vector style so our flat sticker items composite cohesively.
const prompt = `A busy children's seek-and-find picture, packed edge to edge with many small friendly objects. Theme: ${subject}. STRICT FLAT VECTOR STICKER STYLE: solid flat color fills only, absolutely no gradients, no grain, no texture, no noise, no painterly shading, no soft lighting, no drop shadows. Bold uniform black outlines of even thickness around every object, like clean vector clip-art on a sticker sheet. Crisp digital cartoon. No text, no words, no letters. Flat full-bleed background filling the entire image.`;

// --- our own item sprites (bold flat shapes, dark outline = sticker-like) ---
// Padded viewBox + soft drop shadow so each item "sits" on the scene.
const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -10 128 132" width="128" height="132"><defs><filter id="sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1a1530" flood-opacity="0.4"/></filter></defs><g filter="url(#sh)">${inner}</g></svg>`;
const ITEMS = {
  star: { label: "Star", svg: wrap(`<path d="M50 6 L62 38 L96 40 L68 62 L78 95 L50 74 L22 95 L32 62 L4 40 L38 38 Z" fill="#ffc93c" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/>`) },
  key:  { label: "Key",  svg: wrap(`<g fill="#ffd24d" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"><circle cx="30" cy="50" r="20"/><rect x="46" y="44" width="50" height="12" rx="3"/><rect x="78" y="56" width="9" height="16" rx="2"/><rect x="92" y="56" width="8" height="11" rx="2"/></g><circle cx="30" cy="50" r="7" fill="#fff" stroke="#2e2a3f" stroke-width="4"/>`) },
  bell: { label: "Bell", svg: wrap(`<g fill="#ff9f1c" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"><rect x="44" y="6" width="12" height="12" rx="4"/><path d="M50 14 C30 14 26 40 22 64 C20 76 14 80 14 80 L86 80 C86 80 80 76 78 64 C74 40 70 14 50 14 Z"/><circle cx="50" cy="88" r="8"/></g>`) },
  apple:{ label: "Apple",svg: wrap(`<path d="M52 26 q8 -16 22 -18" fill="none" stroke="#2e2a3f" stroke-width="5"/><path d="M54 22 q12 -8 20 -2 q-6 12 -20 4 Z" fill="#46c36a" stroke="#2e2a3f" stroke-width="4" stroke-linejoin="round"/><path d="M50 32 C40 20 16 24 16 50 C16 76 38 94 50 94 C62 94 84 76 84 50 C84 24 60 20 50 32 Z" fill="#e84a5f" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/>`) },
  boot: { label: "Boot", svg: wrap(`<path d="M34 10 L60 10 L62 58 L86 62 Q94 64 94 76 L94 90 L28 90 Q24 90 24 82 L28 18 Q28 10 34 10 Z" fill="#3da5ff" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/>`) },
  gift: { label: "Gift", svg: wrap(`<g stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"><rect x="18" y="42" width="64" height="46" rx="4" fill="#ff5ca8"/><rect x="14" y="30" width="72" height="16" rx="4" fill="#ff7ab8"/><rect x="44" y="30" width="12" height="58" fill="#ffd24d"/><path d="M50 30 C40 12 16 18 30 30 Z M50 30 C60 12 84 18 70 30 Z" fill="#ffd24d"/></g>`) },
  ring: { label: "Ring", svg: wrap(`<circle cx="50" cy="62" r="26" fill="none" stroke="#ffd24d" stroke-width="9"/><path d="M38 36 L50 14 L62 36 Z" fill="#9be8ff" stroke="#2e2a3f" stroke-width="4" stroke-linejoin="round"/>`) },
  ball: { label: "Ball", svg: wrap(`<circle cx="50" cy="50" r="40" fill="#ff7a45" stroke="#2e2a3f" stroke-width="5"/><path d="M14 42 Q50 30 86 42 M14 58 Q50 70 86 58 M50 11 V89" fill="none" stroke="#2e2a3f" stroke-width="4"/>`) },
};

const chosen = Object.keys(ITEMS).slice(0, count);

const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
async function generateImage(p) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({ model: MODEL, contents: p });
  for (const part of res.candidates?.[0]?.content?.parts ?? [])
    if (part.inlineData?.data) return Buffer.from(part.inlineData.data, "base64");
  throw new Error("Gemini returned no image data.");
}

// Cache the raw background so we can iterate compositing for free (REUSE_BG=1).
const bgCache = `brand-assets/bg-${themeId}.png`;
let image;
if (process.env.REUSE_BG && fs.existsSync(bgCache)) {
  console.log(`Reusing cached background ${bgCache}`);
  image = fs.readFileSync(bgCache);
} else {
  console.log(`Generating busy "${themeId}" background (model: ${MODEL})…`);
  image = await generateImage(prompt);
  fs.writeFileSync(bgCache, image);
}

const base = sharp(image);
const meta = await base.metadata();
const W = meta.width ?? 1024, H = meta.height ?? 1024;
const size = Math.round(Math.min(W, H) * 0.088);
const margin = Math.round(Math.min(W, H) * 0.05);

// place each item with rejection sampling so none overlap
const placed = [];
const overlaps = (x, y) => placed.some(p => Math.abs(p.x - x) < size * 1.15 && Math.abs(p.y - y) < size * 1.15);
for (const key of chosen) {
  let x, y, tries = 0;
  do {
    x = margin + Math.floor(Math.random() * (W - size - 2 * margin));
    y = margin + Math.floor(Math.random() * (H - size - 2 * margin));
  } while (overlaps(x, y) && ++tries < 200);
  placed.push({ key, label: ITEMS[key].label, x, y, w: size, h: size });
}

// render each sprite slightly desaturated so it matches the flat-vector palette
const sprites = await Promise.all(placed.map(async p => ({
  input: await sharp(Buffer.from(ITEMS[p.key].svg))
    .resize(size, size)
    .modulate({ saturation: 0.82 })
    .png().toBuffer(),
  left: p.x, top: p.y,
})));
const playable = await sharp(image).composite(sprites).png().toBuffer();
fs.writeFileSync("hidden-demo.png", playable);

// answer overlay: rings + labels
const pad = Math.round(size * 0.22);
const rings = placed.map(p => {
  const rw = p.w + pad * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rw}" height="${rw + 26}">
    <circle cx="${rw/2}" cy="${rw/2 + 26}" r="${rw/2 - 5}" fill="none" stroke="#ff2d6f" stroke-width="7"/>
    <rect x="${rw/2 - p.label.length*7 - 8}" y="0" width="${p.label.length*14 + 16}" height="24" rx="12" fill="#ff2d6f"/>
    <text x="${rw/2}" y="17" font-family="Arial" font-size="15" font-weight="bold" fill="#fff" text-anchor="middle">${p.label}</text></svg>`;
  return { input: Buffer.from(svg), left: p.x - pad, top: p.y - pad - 26 };
});
const answer = await sharp(playable).composite(rings).png().toBuffer();
fs.writeFileSync("hidden-demo-answer.png", answer);

// emit the checklist sprite SVGs + answer key for the play-mock
fs.writeFileSync("brand-assets/hidden-items.json", JSON.stringify({
  theme: themeId, imgW: W, imgH: H,
  items: placed.map(p => ({ ...p, svg: ITEMS[p.key].svg })),
}, null, 2));

console.log(`Image ${W}x${H}, item size ${size}px`);
console.log("Find list + answer key:");
placed.forEach(p => console.log(`  ${p.label.padEnd(6)} @ (${p.x}, ${p.y})`));
console.log("Wrote hidden-demo.png, hidden-demo-answer.png, brand-assets/hidden-items.json");
