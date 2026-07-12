/**
 * Crop the four reference animals for the count row OUT of the generated
 * zoo scene (public/icons-art/zoo-scene.png), so the icons under the page
 * are pixel-identical in style to the animals the child counts.
 * Boxes are tuned by eye to the CURRENT scene — re-tune if regenerated.
 */
import sharp from "sharp";
import { join } from "path";

const ART = join(process.cwd(), "public", "icons-art");
const SRC = join(ART, "zoo-scene.png");

// Version lives IN the output filename (zoo-icon-camel-v3.png): the browser
// aggressively caches same-named art, so a re-crop under the old name keeps
// showing the stale icon. Bump together with the src paths in zooCountLeaf
// (lib/print-build.ts), and delete the old versions.
const V = 4;

const meta = await sharp(SRC).metadata();
console.log("scene:", meta.width, "x", meta.height);

// left, top, width, height — in scene pixels (loose; trimmed after crop)
// Camel extents measured by pixel scan: tail to x=91, snout to x=400, hooves+
// shadow to y=915 (bush starts y=939), head top y=617.
const BOXES = {
  camel: [82, 590, 328, 335],
  lion: [380, 795, 160, 200],
  elephant: [295, 402, 255, 193],
  monkey: [425, 630, 145, 155],
};

// Scene rects to paint WHITE before cropping — neighbours that intrude into a
// box (the big elephant's feet hang just above the small elephant's ear, so
// the box can't simply start lower without cutting the ear).
// The big elephant's feet + their wide shadow ellipse hang over the small
// elephant (shadow spans x≈270–450, down to y≈442 on the left). Three rects
// hug the small elephant's outline: deep on the left (its tail starts y≈445),
// shallower over its back, and a thin strip past its ear (ear top y≈422).
const ERASE = {
  // The lion (mane from x=396, below y=790) pokes into the camel box's
  // bottom-right corner (the snout only needs the box's top-right), and a
  // little grass tuft sits by the back hoof in the bottom-left corner.
  camel: [
    { left: 394, top: 785, width: 20, height: 145 },
    { left: 78, top: 888, width: 34, height: 42 },
  ],
  elephant: [
    { left: 290, top: 350, width: 44, height: 94 },
    { left: 334, top: 350, width: 88, height: 71 },
    { left: 418, top: 390, width: 36, height: 31 },
  ],
};

for (const [name, [left, top, width, height]] of Object.entries(BOXES)) {
  const patches = (ERASE[name] ?? []).map((r) => ({
    input: { create: { width: r.width, height: r.height, channels: 3, background: "#ffffff" } },
    left: r.left,
    top: r.top,
  }));
  const source = patches.length ? await sharp(SRC).composite(patches).toBuffer() : SRC;
  const cropped = await sharp(source).extract({ left, top, width, height }).toBuffer();
  // Gentle trim + generous pad: an aggressive trim shaves the light tops of
  // heads (tan camel, monkey tuft) and the icons look decapitated at 12 mm.
  const trimmed = await sharp(cropped).trim({ threshold: 5 }).toBuffer();
  const m = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(m.width, m.height) * 0.09);
  await sharp(trimmed)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(ART, `zoo-icon-${name}-v${V}.png`));
  console.log(`✓ zoo-icon-${name}-v${V}.png (${m.width}x${m.height})`);
}
