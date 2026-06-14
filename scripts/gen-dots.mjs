// PROTOTYPE v1 — Connect the Dots, the RIGHT way (pure geometry, no AI engine).
//
// The lesson the other games taught: AI makes the art, CODE owns the answer key.
// Connect-the-dots is the purest case — the dots ARE the answer key, and the
// model never has to count or place numbers (it can't). We take a clean outline
// (a coloring page already is one) and derive ordered dots from its geometry:
//
//   1. Threshold the image to an ink mask (dark = ink).
//   2. Flood-fill "outside" from the border through white -> everything not
//      reached is the SUBJECT (its outline + enclosed interior = a silhouette).
//   3. Moore-neighbour boundary trace the subject -> one ordered closed loop.
//   4. Resample that loop to N points evenly spaced by arc length -> the dots.
//   5. Number them in trace order; connecting 1..N redraws the outline.
//
// Deterministic, verifiable, infinitely repeatable. No vision model, no
// edit-drift, no detection lottery — the opposite of "impossible".
//
//   node scripts/gen-dots.mjs [path-to-outline.png] [numDots]
// Output: /tmp/dots/{dots,solution}.png  (+ copies into screenshots/)

import fs from "node:fs";
import sharp from "sharp";

const SRC = process.argv[2] ?? "public/examples/unicorns-coloring.png";
const N = Number(process.argv[3] ?? 32);
const TRACE_W = 360; // downscale for tracing; dots scale back to full size
const INK = 140; // grayscale < INK counts as ink
const OUT = "/tmp/dots";
fs.mkdirSync(OUT, { recursive: true });

// ── 1. load + ink mask ────────────────────────────────────────────────
const meta = await sharp(SRC).metadata();
const fullW = meta.width;
const fullH = meta.height;
const scale = fullW / TRACE_W;
const h = Math.round(fullH / scale);
const { data: gray } = await sharp(SRC)
  .resize(TRACE_W, h, { fit: "fill" })
  .grayscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const w = TRACE_W;
let ink = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) ink[i] = gray[i] < INK ? 1 : 0;

// Dilate the ink to seal hairline gaps in the line art — otherwise the flood
// leaks through a 1px opening into the interior and shatters the silhouette.
function dilate(mask, r) {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let dx = -r; dx <= r && !v; dx++) {
        const nx = x + dx;
        if (nx >= 0 && nx < w && mask[y * w + nx]) v = 1;
      }
      tmp[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let dy = -r; dy <= r && !v; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < h && tmp[ny * w + x]) v = 1;
      }
      out[y * w + x] = v;
    }
  return out;
}
const sealed = dilate(ink, Math.max(2, Math.round(TRACE_W / 180)));

// ── 2. flood-fill outside, derive filled subject silhouette ────────────
const outside = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) {
  stack.push(x, 0, x, h - 1);
}
for (let y = 0; y < h; y++) {
  stack.push(0, y, w - 1, y);
}
while (stack.length) {
  const y = stack.pop();
  const x = stack.pop();
  if (x < 0 || y < 0 || x >= w || y >= h) continue;
  const i = y * w + x;
  if (outside[i] || sealed[i]) continue; // stop at the sealed outline
  outside[i] = 1;
  stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}
// subject = everything the flood couldn't reach (ink + enclosed interior)
const subject = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) subject[i] = outside[i] ? 0 : 1;

// Keep only the LARGEST connected subject blob — drops stray specks (resize
// noise, watermarks) that would otherwise hijack the raster-scan start pixel.
const label = new Int32Array(w * h).fill(-1);
let best = { id: -1, size: 0 };
let nextId = 0;
for (let s = 0; s < w * h; s++) {
  if (!subject[s] || label[s] >= 0) continue;
  const id = nextId++;
  let size = 0;
  const q = [s];
  label[s] = id;
  while (q.length) {
    const i = q.pop();
    size++;
    const x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (subject[ni] && label[ni] < 0) { label[ni] = id; q.push(ni); }
    }
  }
  if (size > best.size) best = { id, size };
}
const fg = (x, y) =>
  x >= 0 && y >= 0 && x < w && y < h && label[y * w + x] === best.id;

// ── 3. Moore-neighbour boundary trace (clockwise) ──────────────────────
// 8 neighbours clockwise starting from "west", so we hug the outer boundary.
const DIRS = [
  [-1, 0], [-1, -1], [0, -1], [1, -1],
  [1, 0], [1, 1], [0, 1], [-1, 1],
];
function trace() {
  // start: first subject pixel in raster order (guaranteed on the boundary)
  let sx = -1, sy = -1;
  for (let y = 0; y < h && sy < 0; y++) {
    for (let x = 0; x < w; x++) {
      if (fg(x, y)) { sx = x; sy = y; break; }
    }
  }
  if (sx < 0) return [];
  const contour = [[sx, sy]];
  let cx = sx, cy = sy;
  let dir = 0; // came from the west
  const maxSteps = w * h * 4;
  for (let step = 0; step < maxSteps; step++) {
    let found = false;
    // scan the 8 neighbours clockwise, starting just after the backtrack dir
    for (let k = 0; k < 8; k++) {
      const d = (dir + 1 + k) % 8;
      const nx = cx + DIRS[d][0];
      const ny = cy + DIRS[d][1];
      if (fg(nx, ny)) {
        cx = nx; cy = ny;
        dir = (d + 4) % 8; // new backtrack = opposite of the step we took
        contour.push([cx, cy]);
        found = true;
        break;
      }
    }
    if (!found) break; // isolated pixel
    if (cx === sx && cy === sy) break; // closed the loop
  }
  return contour;
}
const contour = trace();
if (contour.length < N) {
  console.error(`Traced only ${contour.length} boundary points — outline too thin/open?`);
  process.exit(1);
}

// ── 4. resample to N evenly-spaced points by arc length ────────────────
function resample(pts, n) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  const total = cum[cum.length - 1];
  const out = [];
  let seg = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total;
    while (seg < cum.length - 2 && cum[seg + 1] < target) seg++;
    const segLen = cum[seg + 1] - cum[seg] || 1;
    const t = (target - cum[seg]) / segLen;
    const x = pts[seg][0] + t * (pts[seg + 1][0] - pts[seg][0]);
    const y = pts[seg][1] + t * (pts[seg + 1][1] - pts[seg][1]);
    out.push([x * scale, y * scale]); // back to full-res coords
  }
  return out;
}
const dots = resample(contour, N).map(([x, y], i) => ({
  n: i + 1,
  x: Math.round(x),
  y: Math.round(y),
}));

// ── 5. render review images ────────────────────────────────────────────
const r = Math.max(10, Math.round(fullW / 90)); // dot radius
const fontSize = Math.round(r * 1.7);
function svg(withLine) {
  const line = withLine
    ? `<polyline points="${dots.map((d) => `${d.x},${d.y}`).join(" ")}" fill="none" stroke="#e0529c" stroke-width="${Math.max(2, r / 3)}" stroke-linejoin="round"/>`
    : "";
  const marks = dots
    .map(
      (d) => `
      <circle cx="${d.x}" cy="${d.y}" r="${r}" fill="#fff" stroke="#2e2a3f" stroke-width="${Math.max(2, r / 4)}"/>
      <text x="${d.x}" y="${d.y + fontSize * 0.35}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#2e2a3f" text-anchor="middle">${d.n}</text>`,
    )
    .join("");
  return Buffer.from(
    `<svg width="${fullW}" height="${fullH}" xmlns="http://www.w3.org/2000/svg">${line}${marks}</svg>`,
  );
}

// "puzzle" view: faint art + numbered dots (what the child sees)
const faded = await sharp(SRC)
  .ensureAlpha()
  .composite([{ input: Buffer.from(`<svg width="${fullW}" height="${fullH}"><rect width="100%" height="100%" fill="#fff" opacity="0.82"/></svg>`), top: 0, left: 0 }])
  .png()
  .toBuffer();
await sharp(faded).composite([{ input: svg(false) }]).png().toFile(`${OUT}/dots.png`);
// "solution" view: the connect order drawn over the dots
await sharp(faded).composite([{ input: svg(true) }]).png().toFile(`${OUT}/solution.png`);

// copy where it's easy to open
fs.copyFileSync(`${OUT}/dots.png`, "screenshots/dots-puzzle.png");
fs.copyFileSync(`${OUT}/solution.png`, "screenshots/dots-solution.png");

console.log(`✓ ${SRC} (${fullW}x${fullH})`);
console.log(`  traced ${contour.length} boundary pts -> ${dots.length} ordered dots`);
console.log(`  /tmp/dots/dots.png  +  screenshots/dots-puzzle.png`);
console.log(`  /tmp/dots/solution.png  +  screenshots/dots-solution.png`);
