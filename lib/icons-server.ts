/**
 * Server-only icon helpers — reads the vendored Noto SVGs off disk and
 * composites puzzle thumbnails with sharp. Imported only by the thumbnail
 * builders (lib/matchpairs, lib/oddoneout), which clients pull from with
 * `import type` only, so fs/sharp never reach the browser bundle. It's pulled
 * in via a dynamic import() from the (server-only) thumbnail builders, so it
 * never lands in client code.
 */

import { readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const cache = new Map<string, Buffer>();

/** Raw SVG bytes for one icon (cached). */
export function iconSvgBuffer(key: string): Buffer {
  let buf = cache.get(key);
  if (!buf) {
    buf = readFileSync(join(process.cwd(), "public", "icons", `${key}.svg`));
    cache.set(key, buf);
  }
  return buf;
}

export interface Placement {
  key: string;
  x: number;
  y: number;
  size: number;
}

/**
 * Build a thumbnail PNG: a `bg`-filled canvas, an optional vector overlay drawn
 * behind (e.g. connector lines), then each icon rasterized independently and
 * composited on top — so icons keep their own colours with no id/style clashes.
 */
export async function composeThumb(
  width: number,
  height: number,
  bg: string,
  placements: Placement[],
  overlaySvg?: string,
): Promise<Buffer> {
  const layers: sharp.OverlayOptions[] = [];
  if (overlaySvg) layers.push({ input: Buffer.from(overlaySvg), top: 0, left: 0 });

  for (const p of placements) {
    const size = Math.round(p.size);
    const png = await sharp(iconSvgBuffer(p.key))
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    layers.push({ input: png, left: Math.round(p.x), top: Math.round(p.y) });
  }

  return sharp({
    create: {
      width: Math.round(width),
      height: Math.round(height),
      channels: 4,
      background: bg,
    },
  })
    .composite(layers)
    .png()
    .toBuffer();
}
