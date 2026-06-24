/**
 * The Alphabet booklet — a SEPARATE printed product from the activity booklet.
 *
 * One page per letter, "A is for Apple" style: a big outline letter to colour,
 * the connective ("is for" / "je za"), the word, and the matching picture from
 * the shared icon vocabulary (lib/icons.ts) as blank line art to colour in.
 *
 * Like every other Wonder Pages page, an alphabet page is composed PURELY in
 * code from a keyed picture — there is no per-page AI cost. Only the cover is
 * live-AI (personalized with the child's name), exactly as for the activity
 * booklet (see lib/booklet.ts).
 *
 * Each language has its OWN letter set and its OWN word→picture table: the
 * Croatian alphabet has 30 letters (incl. the digraphs Dž, Lj, Nj and the
 * diacritic letters Č, Ć, Đ, Š, Ž) and lacks Q, W, X, Y, and a word's initial
 * letter differs from English (apple→A but jabuka→J). So the tables below are
 * hand-curated per language, NOT derived from one another.
 *
 * The classic alphabet-book troublemakers (EN Q/X/Z; HR Ć/Dž/Đ/E/F/Lj/Nj/U)
 * were solved by pulling matching emoji from Noto or reusing an icon we already
 * own — see lib/icons.ts. The ONLY picture with no Noto match is the xylophone
 * (EN X); its key is in PENDING_ICON_KEYS and that one page won't render until
 * the SVG is drawn.
 */

import { ICONS } from "./icons";

export type LanguageId = "en" | "hr";

/** One letter page: the glyph, the word, and the picture key to colour. */
export interface AlphabetEntry {
  /** Display glyph for the big outline letter — e.g. "G", "Dž". */
  letter: string;
  /** The word, capitalised for the caption — e.g. "Guitar", "Gitara". */
  word: string;
  /** Key into ICONS / iconSrc — the picture drawn as blank line art. */
  iconKey: string;
}

export interface Alphabet {
  id: LanguageId;
  /** Name shown in the language picker, in its own language. */
  label: string;
  /** Connective between letter and word — "A {is for} Apple". */
  connective: string;
  letters: AlphabetEntry[];
}

// ── English (26 letters) ──────────────────────────────────────────
const EN: AlphabetEntry[] = [
  { letter: "A", word: "Apple", iconKey: "apple" },
  { letter: "B", word: "Banana", iconKey: "banana" },
  { letter: "C", word: "Cupcake", iconKey: "cupcake" },
  { letter: "D", word: "Dog", iconKey: "dog" },
  { letter: "E", word: "Elephant", iconKey: "elephant" },
  { letter: "F", word: "Fish", iconKey: "fish" },
  { letter: "G", word: "Guitar", iconKey: "guitar" },
  { letter: "H", word: "Horse", iconKey: "horse" },
  { letter: "I", word: "Ice cream", iconKey: "icecream" },
  { letter: "J", word: "Jeans", iconKey: "jeans" },
  { letter: "K", word: "Key", iconKey: "key" },
  { letter: "L", word: "Lion", iconKey: "lion" },
  { letter: "M", word: "Monkey", iconKey: "monkey" },
  { letter: "N", word: "Nest", iconKey: "nest" },
  { letter: "O", word: "Owl", iconKey: "owl" },
  { letter: "P", word: "Pig", iconKey: "pig" },
  { letter: "Q", word: "Queen", iconKey: "crown" }, // reuses the crown icon
  { letter: "R", word: "Rabbit", iconKey: "rabbit" },
  { letter: "S", word: "Sun", iconKey: "sun" },
  { letter: "T", word: "Tiger", iconKey: "tiger" },
  { letter: "U", word: "Umbrella", iconKey: "umbrella" },
  { letter: "V", word: "Violin", iconKey: "violin" },
  { letter: "W", word: "Whale", iconKey: "whale" },
  { letter: "X", word: "Xylophone", iconKey: "xylophone" }, // pending art
  { letter: "Y", word: "Yarn", iconKey: "yarn" },
  { letter: "Z", word: "Zebra", iconKey: "zebra" }, // pending art
];

// ── Croatian (30 letters) ─────────────────────────────────────────
// Validated with Tamara (native speaker, primary market). Tricky letters that
// had no matching emoji landed on: E→Enciklopedija (book), Lj→Ljubav (heart),
// U→Udica (hook), Nj→Njuška (pig nose), Ć→Ćup (amphora), Dž→Džem, Đ→Đak.
const HR: AlphabetEntry[] = [
  { letter: "A", word: "Avion", iconKey: "airplane" },
  { letter: "B", word: "Banana", iconKey: "banana" },
  { letter: "C", word: "Cipela", iconKey: "shoe" },
  { letter: "Č", word: "Čarapa", iconKey: "socks" },
  { letter: "Ć", word: "Ćup", iconKey: "jug" }, // amphora
  { letter: "D", word: "Delfin", iconKey: "dolphin" },
  { letter: "Dž", word: "Džem", iconKey: "jam" }, // jar of spread
  { letter: "Đ", word: "Đak", iconKey: "pupil" }, // school bag
  { letter: "E", word: "Elisa", iconKey: "propeller" }, // elisa = propeller (helicopter/motor)
  { letter: "F", word: "Frula", iconKey: "flute" },
  { letter: "G", word: "Gitara", iconKey: "guitar" },
  { letter: "H", word: "Helikopter", iconKey: "helicopter" },
  { letter: "I", word: "Igla", iconKey: "needle" },
  { letter: "J", word: "Jabuka", iconKey: "apple" },
  { letter: "K", word: "Krava", iconKey: "cow" },
  { letter: "L", word: "Lav", iconKey: "lion" },
  { letter: "Lj", word: "Ljuljačka", iconKey: "swing" }, // ljuljačka = swing
  { letter: "M", word: "Medo", iconKey: "bear" }, // medo = teddy (the art is a teddy bear)
  { letter: "N", word: "Naranča", iconKey: "orange" },
  { letter: "Nj", word: "Njuška", iconKey: "dog" }, // shown as a dog (njuška = a dog's snout)
  { letter: "O", word: "Oblak", iconKey: "cloud" },
  { letter: "P", word: "Princeza", iconKey: "princess" }, // Pas→dog moved to Nj
  { letter: "R", word: "Riba", iconKey: "fish" },
  { letter: "S", word: "Sunce", iconKey: "sun" },
  { letter: "Š", word: "Šešir", iconKey: "hat" },
  { letter: "T", word: "Tigar", iconKey: "tiger" },
  { letter: "U", word: "Udica", iconKey: "hook" }, // fishing/cargo hook
  { letter: "V", word: "Vlak", iconKey: "train" },
  { letter: "Z", word: "Zec", iconKey: "rabbit" },
  { letter: "Ž", word: "Žaba", iconKey: "frog" },
];

export const ALPHABETS: Record<LanguageId, Alphabet> = {
  en: { id: "en", label: "English", connective: "is for", letters: EN },
  hr: { id: "hr", label: "Hrvatski", connective: "kao", letters: HR },
};

export const LANGUAGE_IDS = Object.keys(ALPHABETS) as LanguageId[];

/** Pages in the alphabet booklet for a language (one per letter). */
export function letterCount(lang: LanguageId): number {
  return ALPHABETS[lang].letters.length;
}

/**
 * Dev guard: every entry's iconKey must exist in the icon vocabulary, so a
 * page can never reference a picture that isn't even keyed. (Whether the SVG
 * file is drawn yet is a separate matter — see PENDING_ICON_KEYS.)
 */
export function unknownIconKeys(): string[] {
  return LANGUAGE_IDS.flatMap((lang) =>
    ALPHABETS[lang].letters
      .map((e) => e.iconKey)
      .filter((key) => !(key in ICONS)),
  );
}
