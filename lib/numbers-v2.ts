/**
 * Data for the "Moji prvi brojevi" v2 redesign (2026-07-11): numbers 1–10,
 * NOT 0–9 like the current simpler product in lib/numbers.ts. Kept as its own
 * file rather than editing lib/numbers.ts so the live 0–9 product (still sold)
 * is untouched while this redesign is built out.
 */

export interface NumberV2Entry {
  /** The numeral glyph(s) — "1" … "10". */
  digit: string;
  /** The Croatian number word, capitalised for the caption — "Četiri". */
  word: string;
  /** Icon key (lib/icons.ts) tiled `digit` times as the small counted picture. */
  countIcon: string;
}

export const NUMBERS_V2: NumberV2Entry[] = [
  { digit: "1", word: "Jedan", countIcon: "sun" },
  { digit: "2", word: "Dva", countIcon: "bird" },
  { digit: "3", word: "Tri", countIcon: "frog" },
  { digit: "4", word: "Četiri", countIcon: "tulip" },
  { digit: "5", word: "Pet", countIcon: "apple" },
  { digit: "6", word: "Šest", countIcon: "ladybug" },
  { digit: "7", word: "Sedam", countIcon: "star" },
  { digit: "8", word: "Osam", countIcon: "butterfly" },
  { digit: "9", word: "Devet", countIcon: "bee" },
  { digit: "10", word: "Deset", countIcon: "balloon" },
];
