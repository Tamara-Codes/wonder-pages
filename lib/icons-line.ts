/**
 * Server-only: turn a flat-colour Noto icon into colour-in LINE ART.
 *
 * The alphabet booklet needs blank pictures a child paints, but our icon
 * vocabulary is full-colour emoji. Rather than redraw them, we blank every
 * shape's fill to white and outline every shape in ink — so each colour region
 * boundary (guitar body, sound hole, strings…) becomes a black line and the
 * interior is left white to colour. Pure string transform, no AI.
 *
 * Imported only by server components (the alphabet page renderer), so `fs`
 * never reaches the client bundle.
 */

import { readFileSync } from "fs";
import { join } from "path";

const INK = "#2b2440"; // default outline colour (--foreground)
// Outline weight in the 0–128 icon viewBox.
const STROKE = 2.5;

const cache = new Map<string, string>();

/** Line-art SVG markup for an icon key (cached), ready to inline. */
export function iconLineArt(key: string, ink: string = INK): string {
  const ck = `${key}|${ink}`;
  const hit = cache.get(ck);
  if (hit) return hit;
  const raw = readFileSync(
    join(process.cwd(), "public", "icons", `${key}.svg`),
    "utf8",
  );
  const out = toLineArt(raw, ink);
  cache.set(ck, out);
  return out;
}

/** Blank all fills → white, recolour all strokes → ink, outline every shape. */
export function toLineArt(svg: string, ink: string = INK): string {
  const colour = /#[0-9a-fA-F]{3,8}|rgb\([^)]*\)|url\([^)]*\)/.source;
  svg = svg
    // every coloured fill becomes white (leave `fill:none` alone)
    .replace(new RegExp(`fill:\\s*(${colour})`, "g"), "fill:#ffffff")
    .replace(new RegExp(`fill\\s*=\\s*"(${colour})"`, "g"), 'fill="#ffffff"')
    // any existing stroke becomes ink
    .replace(new RegExp(`stroke:\\s*(${colour})`, "g"), `stroke:${ink}`)
    .replace(new RegExp(`stroke\\s*=\\s*"(${colour})"`, "g"), `stroke="${ink}"`);

  // Wrap the drawing in a group that strokes every shape that doesn't set its
  // own stroke. <defs>/gradients ride along harmlessly (they don't render).
  return svg.replace(
    /(<svg[^>]*>)([\s\S]*)(<\/svg>)/,
    (_m, open: string, inner: string, close: string) =>
      `${open}<g fill="#ffffff" stroke="${ink}" stroke-width="${STROKE}" stroke-linejoin="round" stroke-linecap="round">${inner}</g>${close}`,
  );
}
