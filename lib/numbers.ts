/**
 * The Numbers booklet — "Moji prvi brojevi", a SEPARATE printed product from the
 * alphabet, built exactly like it (see lib/alphabet.ts).
 *
 * One leaf per number 0–9: a big hollow numeral to colour, the number word
 * ("3 — TRI"), a cute picture showing EXACTLY that many things to colour, and
 * ruled lines to practise writing the numeral. So the child paints, counts, and
 * writes — the numeral's meaning (the quantity) is built into the picture.
 *
 * The picture is a bespoke Gemini colour-in scene at public/icons-art/<artKey>.png
 * (one scene per number, drawn by scripts/gen-numbers.mjs). Until that art is
 * dropped in, the leaf falls back to tiling a single existing icon `count` times
 * (e.g. three frogs) from the shared vocabulary — so the product renders fully
 * with no AI and upgrades automatically the moment the scene art exists. This is
 * the same art-upgrade pattern the alphabet uses (see preview-build/print-build).
 *
 * Croatian-only (the primary market): nula, jedan, dva … devet.
 */

import { ICONS } from "./icons";

/** One number leaf: the numeral, its word, the quantity, and the picture. */
export interface NumberEntry {
  /** The numeral as a glyph — "0" … "9". */
  digit: string;
  /** The Croatian number word, capitalised for the caption — "Tri". */
  word: string;
  /** How many things the picture shows (equals the numeral; 0 = none). */
  count: number;
  /** Key for the bespoke colour-in scene at public/icons-art/<artKey>.png. */
  artKey: string;
  /**
   * An existing icon key (lib/icons.ts) tiled `count` times as the fallback
   * picture when the scene art isn't drawn yet. Ignored for 0 (drawn empty).
   */
  fallbackIcon: string;
}

// ── 0–9 ───────────────────────────────────────────────────────────
// Each number gets its own cute subject so the booklet stays varied, and the
// fallback icon matches the Gemini scene's subject so both read the same.
export const NUMBERS: NumberEntry[] = [
  { digit: "0", word: "Nula", count: 0, artKey: "num-0", fallbackIcon: "" }, // empty basket
  { digit: "1", word: "Jedan", count: 1, artKey: "num-1", fallbackIcon: "sun" },
  { digit: "2", word: "Dva", count: 2, artKey: "num-2", fallbackIcon: "bird" },
  { digit: "3", word: "Tri", count: 3, artKey: "num-3", fallbackIcon: "frog" },
  { digit: "4", word: "Četiri", count: 4, artKey: "num-4", fallbackIcon: "fish" },
  { digit: "5", word: "Pet", count: 5, artKey: "num-5", fallbackIcon: "butterfly" },
  { digit: "6", word: "Šest", count: 6, artKey: "num-6", fallbackIcon: "ladybug" },
  { digit: "7", word: "Sedam", count: 7, artKey: "num-7", fallbackIcon: "star" },
  { digit: "8", word: "Osam", count: 8, artKey: "num-8", fallbackIcon: "tulip" },
  { digit: "9", word: "Devet", count: 9, artKey: "num-9", fallbackIcon: "bee" },
];

/** Pages in the numbers booklet (one per numeral). */
export function numberCount(): number {
  return NUMBERS.length;
}

/**
 * Dev guard: every fallbackIcon must exist in the icon vocabulary, so the
 * fallback picture can never reference art that isn't even keyed.
 */
export function unknownNumberIcons(): string[] {
  return NUMBERS.map((n) => n.fallbackIcon)
    .filter(Boolean)
    .filter((key) => !(key in ICONS));
}
