// PROTOTYPE v2 — Spot the Difference via AI edit + VISION DETECTION (no diffing).
//
// Lesson from v1: diffing A vs B produced false positives (the editor subtly
// redraws unrelated areas like trees) and split single objects into two blobs.
// Fix: we LOCATE the specific objects we remove using the vision model (like
// Find It!). Those boxes are the answer key — editor drift elsewhere is ignored.
//
// 1. Gemini draws scene A (full-bleed, not cropped).
// 2. Vision model locates the target objects in A  -> answer-key boxes.
// 3. Gemini edits A -> B, removing exactly those objects.
// 4. (guard) re-detect in B to confirm they're gone.
// 5. Side-by-side review PNG, answer boxes circled.
//
//   node scripts/gen-spotdiff.mjs
// Output: /tmp/spotdiff/{a,b,review}.png

import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const DETECT_MODEL = process.env.GEMINI_DETECT_MODEL ?? "gemini-2.5-flash";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 120000 } });
const OUT = "/tmp/spotdiff";
fs.mkdirSync(OUT, { recursive: true });

const TARGETS = ["cow", "goat", "turkey"]; // the objects we'll remove

async function genImage(parts) {
  const res = await ai.models.generateContent({ model: IMAGE_MODEL, contents: [{ role: "user", parts }] });
  for (const p of res.candidates?.[0]?.content?.parts ?? []) {
    if (p.inlineData?.data) return Buffer.from(p.inlineData.data, "base64");
  }
  throw new Error("no image data");
}

// Uses the EXACT production prompt from lib/gemini.detectObjects (forbids the
// flaky box_2d array, forces clean named edges 0–1000).
async function detect(image, labels) {
  const list = labels.map((l) => `"${l}"`).join(", ");
  const prompt =
    `Detect these objects in the image: ${list}. ` +
    `Return ONLY a JSON array, no prose, no markdown, no code fences. ` +
    `For EACH object output an object with EXACTLY these keys: "label", "xmin", "ymin", "xmax", "ymax". ` +
    `The four numbers are integers from 0 to 1000 (x runs left→right, y runs top→bottom). ` +
    `Do NOT use a "box_2d" array. Follow this exact format:\n` +
    `[{"label":"cow","xmin":120,"ymin":60,"xmax":300,"ymax":240}]\n` +
    `List each object at most once. Omit any requested object not clearly present.`;
  const res = await ai.models.generateContent({
    model: DETECT_MODEL,
    contents: [{ role: "user", parts: [{ inlineData: { mimeType: "image/png", data: image.toString("base64") } }, { text: prompt }] }],
  });
  let text = "";
  for (const p of res.candidates?.[0]?.content?.parts ?? []) if (typeof p.text === "string") text += p.text;
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  let raw; try { raw = JSON.parse(m[0]); } catch { return []; }
  return (Array.isArray(raw) ? raw : [])
    .filter((e) => e && typeof e === "object" && e.label != null && e.xmin != null && e.xmax != null)
    .map((e) => ({ label: String(e.label), xmin: +e.xmin, ymin: +e.ymin, xmax: +e.xmax, ymax: +e.ymax }))
    .filter((e) => [e.xmin, e.ymin, e.xmax, e.ymax].every(Number.isFinite));
}

const scenePrompt =
  "A cheerful children's book FARM scene, flat 2D vector cartoon style, bright happy colours, soft " +
  "simple shapes. A grassy field with a wooden fence, leafy round trees and a small blue pond. " +
  "Spread these clearly-separated friendly farm animals across the scene with space between them: " +
  "a brown horse, a spotted cow, two fluffy sheep, a white goat, a hen, a rooster, a turkey, yellow " +
  "ducklings in the pond. The WHOLE scene must fit comfortably inside the frame with a little margin " +
  "around the edges — nothing cropped or touching the borders. No text, no words.";

console.log(`Image model: ${IMAGE_MODEL} · detect: ${DETECT_MODEL}\n[1/5] scene A…`);
const aRaw = await genImage([{ text: scenePrompt }]);
// Keep the native aspect — DON'T crop. Just downscale to a sensible width.
const a = await sharp(aRaw).resize({ width: 1000, withoutEnlargement: false }).png().toBuffer();
const meta = await sharp(a).metadata();
const W = meta.width, H = meta.height;
fs.writeFileSync(`${OUT}/a.png`, a);
console.log(`  A = ${W}x${H}`);

console.log(`[2/5] locating targets in A: ${TARGETS.join(", ")}…`);
const found = await detect(a, TARGETS);
console.log(`  found ${found.length}: ${found.map((f) => f.label).join(", ")}`);
const boxes = found.map((f) => ({
  label: f.label,
  x: (f.xmin / 1000) * W,
  y: (f.ymin / 1000) * H,
  w: ((f.xmax - f.xmin) / 1000) * W,
  h: ((f.ymax - f.ymin) / 1000) * H,
}));

console.log("[3/5] editing → B (remove targets)…");
const editPrompt =
  `This is a children's farm picture. Produce an edited copy that is EXACTLY identical — same ` +
  `background, style, colours, and the same position and appearance of every other animal — EXCEPT ` +
  `remove these completely: ${TARGETS.join(", ")}. Fill each removed spot with the matching grass / ` +
  `fence / background so it looks natural. Do NOT move, add, recolour, resize or redraw anything else. ` +
  `Keep the framing identical. Output only the edited image.`;
const bRaw = await genImage([{ inlineData: { mimeType: "image/png", data: a.toString("base64") } }, { text: editPrompt }]);
const b = await sharp(bRaw).resize(W, H, { fit: "fill" }).png().toBuffer();
fs.writeFileSync(`${OUT}/b.png`, b);

console.log("[4/5] guard: re-detect targets in B (should be gone)…");
const still = await detect(b, TARGETS);
console.log(`  still present in B: ${still.length ? still.map((s) => s.label).join(", ") : "none ✓"}`);

console.log("[5/5] composing review…");
const circles = boxes
  .map((bx) => {
    const cx = bx.x + bx.w / 2, cy = bx.y + bx.h / 2;
    const r = Math.max(bx.w, bx.h) / 2 + 14;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#19c37d" stroke-width="5"/>`;
  })
  .join("");
const ov = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${circles}</svg>`)).png().toBuffer();
const aM = await sharp(a).composite([{ input: ov, left: 0, top: 0 }]).png().toBuffer();
const bM = await sharp(b).composite([{ input: ov, left: 0, top: 0 }]).png().toBuffer();
const review = await sharp({ create: { width: W * 2 + 30, height: H, channels: 3, background: "#0c3b2e" } })
  .composite([{ input: aM, left: 0, top: 0 }, { input: bM, left: W + 30, top: 0 }])
  .png().toBuffer();
fs.writeFileSync(`${OUT}/review.png`, review);
console.log(`Wrote ${OUT}/review.png  (answer key = ${boxes.length} differences)`);
