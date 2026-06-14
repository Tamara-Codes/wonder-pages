// Generate a handful of example games for the landing-page gallery.
// Display-only (no answer keys) — saved to public/examples/.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
  httpOptions: { timeout: 120000 },
});

const SUBJECT = {
  unicorns: "magical unicorns, rainbows, sparkles and castles",
  space: "outer space with rockets, planets, stars and friendly astronauts",
  dinosaurs: "friendly cartoon dinosaurs in a prehistoric jungle with volcanoes",
  "race-cars": "fast race cars on a winding track with flags and trophies",
};
const COLORING_STYLE =
  "Simple cute cartoon shapes with thick clean lines that are easy to color inside, a moderate amount of detail.";

function prompt(game, theme) {
  const subject = SUBJECT[theme];
  if (game === "coloring") {
    return `Black and white coloring book page for young children. Subject: ${subject}. Bold clean black outlines only, absolutely no shading, no grey, no color fill, pure white background. ${COLORING_STYLE} Centered full-page composition.`;
  }
  return `A busy children's seek-and-find picture, packed edge to edge with many small friendly objects. Theme: ${subject}. STRICT FLAT VECTOR STICKER STYLE: solid flat color fills only, no gradients, no grain, no texture, no shading, uniform black outlines. Crisp digital cartoon. No text. Flat full-bleed background.`;
}

const EXAMPLES = [
  { game: "coloring", theme: "unicorns", file: "unicorns-coloring" },
  { game: "coloring", theme: "dinosaurs", file: "dinosaurs-coloring" },
  { game: "find-it", theme: "space", file: "space-findit" },
  { game: "find-it", theme: "race-cars", file: "racecars-findit" },
];

mkdirSync(new URL("../public/examples/", import.meta.url), { recursive: true });

for (const ex of EXAMPLES) {
  console.log(`Generating ${ex.file}…`);
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt(ex.game, ex.theme),
  });
  const data = (res.candidates?.[0]?.content?.parts ?? []).find(
    (p) => p.inlineData?.data,
  )?.inlineData?.data;
  if (!data) {
    console.error(`  FAILED: no image for ${ex.file}`);
    continue;
  }
  writeFileSync(
    new URL(`../public/examples/${ex.file}.png`, import.meta.url),
    Buffer.from(data, "base64"),
  );
  console.log(`  saved public/examples/${ex.file}.png`);
}
console.log("Done.");
