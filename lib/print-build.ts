/**
 * Print build — the WHOLE Croatian ABC book laid out as one document, every
 * page sized to exact A5 (148 × 210 mm) so it can be opened and printed (or
 * "Save as PDF", paper size A5) in one go.
 *
 * This is deliberately SEPARATE from lib/preview-build.ts. The preview renders
 * small on-screen cards (rounded corners, borders, drop shadows, a 3-letter
 * sample) — all wrong for a printed page. Here every leaf fills a physical A5
 * sheet, sizes are in millimetres (so they print at a known physical size, not
 * "whatever 56px happens to be"), and the screen-only chrome is gone.
 *
 * Order of the book (the keepsake arc): cover → posveta → name → A–Ž → diploma.
 * Server-only: reads icon art from disk.
 */
import { ALPHABETS, type LanguageId } from "./alphabet";
import { NUMBERS, type NumberEntry } from "./numbers";
import { iconLineArt } from "./icons-line";
import { existsSync } from "fs";
import { join } from "path";

const ART_DIR = join(process.cwd(), "public", "icons-art");
const INK = "#000000";

// Confetti-Pop palette (mirrors globals.css / preview-build).
const INK_SOFT = "#2b2440";
const MUTED = "#7a7392";
const PINK = "#ff5ca8";
const PINK_D = "#d63f86";
const YELLOW = "#ffc93c";
const TEAL = "#21c7b6";
const TEAL_D = "#16a596";
const PURPLE = "#8a6cff";
const BLUE = "#3da5ff";
const BLUE_D = "#2f7fd0";

export interface PrintOpts {
  language?: LanguageId;
  childName?: string;
  childSurname?: string;
  gender?: "boy" | "girl";
  /** Parent's free-written dedication for the posveta leaf. */
  posveta?: string;
  /**
   * The child's name in the POSSESSIVE form, for the cover headline
   * ("Emina prva ABECEDA"). Croatian possessives are irregular (Ema→Emina,
   * Marko→Markova, Luka→Lukina), so we never derive it — it's typed per order.
   * When omitted the cover shows the plain name + the neutral subtitle instead.
   */
  possessive?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** Commissioned colour-in art for a key, if drawn; else null (use line art). */
function artImageSrc(key: string): string | null {
  return existsSync(join(ART_DIR, `${key}.png`)) ? `/icons-art/${key}.png` : null;
}

// ── Letter page (A–Ž) ─────────────────────────────────────────────
/**
 * Two single lines to write on (in mm). The first line carries light "ghost"
 * CAPITAL glyphs to trace (clean low-opacity letters — renders cleanly even for
 * Ž/Č); the second is blank to write freehand. viewBox units = mm.
 */
function handwriting(glyph: string): string {
  const W = 120;
  const count = glyph.length > 1 ? 4 : 6; // digraphs (Dž, Lj, Nj) get fewer, wider
  const slot = W / count;
  const ghosts = Array.from({ length: count }, (_, i) =>
    `<text x="${(slot * (i + 0.5)).toFixed(1)}" y="16" text-anchor="middle" style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:700;font-size:16px;fill:${INK};fill-opacity:.08">${escapeHtml(glyph)}</text>`,
  ).join("");
  const line = (y: number) =>
    `<line x1="1" y1="${y}" x2="${W - 1}" y2="${y}" stroke="${INK}" stroke-width="0.7" stroke-opacity=".8"/>`;
  // Two baselines 24 mm apart: trace on the first, write on the second.
  return `<svg class="lp-hand" viewBox="0 0 120 44" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${line(16)}${ghosts}${line(40)}</svg>`;
}

/**
 * One "A kao AVION" colour-in leaf: the hollow letter, the connective, and the
 * WORD in big capitals (children learn uppercase print first), then the picture
 * and the handwriting lines. The word wraps to its own line for long words.
 */
function letterLeaf(
  letter: string,
  word: string,
  iconKey: string,
  connective: string,
  footer: string,
  pageNo: number,
): string {
  const src = artImageSrc(iconKey);
  const picture = src
    ? `<img src="${src}" alt="" />`
    : iconLineArt(iconKey, INK).replace("<svg", "<svg ");
  return `<section class="leaf"><div class="lp">
    <div class="lp-head">
      <span class="lp-letter${letter.length > 1 ? " lp-letter--dg" : ""}">${escapeHtml(letter)}</span>
      <span class="lp-con">${escapeHtml(connective)}</span>
      <span class="lp-word">${escapeHtml(word.toUpperCase())}</span>
    </div>
    <div class="lp-pic">${picture}</div>
    ${handwriting(letter)}
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

// ── Number leaf (0–9) ──────────────────────────────────────────────
// Column count for the tiled "count" picture so each number lays out tidily.
const COUNT_COLS: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 3 };

/** An empty wicker basket to colour — the picture for 0 (nula). */
function emptyBasket(): string {
  return `<svg viewBox="0 0 140 120" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M22 50 L118 50 L106 108 L34 108 Z"/>
    <path d="M30 50 C30 22 110 22 110 50" fill="none"/>
    <line x1="28" y1="68" x2="112" y2="68"/>
    <line x1="44" y1="56" x2="50" y2="102"/>
    <line x1="64" y1="56" x2="65" y2="104"/>
    <line x1="84" y1="56" x2="80" y2="102"/>
    <line x1="100" y1="56" x2="92" y2="100"/>
  </svg>`;
}

/** The picture for one number: the bespoke scene art if drawn, else `count`
 * copies of the fallback icon tiled in a grid (0 → an empty basket). Sizes are
 * in mm and computed so any count fits the ~74 mm-tall picture box. */
function numberPicture(entry: NumberEntry): string {
  const src = artImageSrc(entry.artKey);
  if (src) return `<img src="${src}" alt="" />`;
  if (entry.count === 0) return emptyBasket();
  const cols = COUNT_COLS[entry.count] ?? 3;
  const rows = Math.ceil(entry.count / cols);
  const gap = 5; // mm
  const item = Math.min(48, Math.floor((74 - (rows - 1) * gap) / rows)); // mm per item
  const one = iconLineArt(entry.fallbackIcon, INK).replace("<svg", "<svg ");
  const cells = Array.from({ length: entry.count }, () => `<div class="lp-cell">${one}</div>`).join("");
  return `<div class="lp-count" style="grid-template-columns:repeat(${cols},${item}mm);gap:${gap}mm;">${cells}</div>`;
}

/**
 * One number colour-in leaf: the hollow numeral + its word, the counted picture
 * (N things to colour), and the handwriting lines to trace the numeral. Mirrors
 * letterLeaf so the two booklets print identically.
 */
function numberLeaf(entry: NumberEntry, footer: string, pageNo: number): string {
  return `<section class="leaf"><div class="lp">
    <div class="lp-head">
      <span class="lp-letter">${escapeHtml(entry.digit)}</span>
      <span class="lp-word">${escapeHtml(entry.word.toUpperCase())}</span>
    </div>
    <div class="lp-pic">${numberPicture(entry)}</div>
    ${handwriting(entry.digit)}
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

// ── Cover ──────────────────────────────────────────────────────────
/**
 * The headline word (ABECEDA / ALPHABET) is spelled out in toy alphabet
 * blocks — the colourful stacking cubes children play with. Each block is a
 * little isometric cube (coloured body + lighter top + darker right face) with
 * a white panel and the letter, drawn as crisp vector so it prints sharp at A5.
 */
type BlockShade = { face: string; top: string; side: string };
const BLOCK_PALETTE: BlockShade[] = [
  { face: PINK, top: "#ff8cc2", side: PINK_D },
  { face: YELLOW, top: "#ffd96e", side: "#e0a91f" },
  { face: TEAL, top: "#5bd9cb", side: TEAL_D },
  { face: PURPLE, top: "#a98fff", side: "#6b4ee0" },
  { face: BLUE, top: "#74c0ff", side: BLUE_D },
];

/** One toy block (local coords); S = front-face size, d = extruded depth. */
function oneBlock(letter: string, p: BlockShade, S: number, d: number): string {
  const top = `<polygon points="0,${d} ${d},0 ${S + d},0 ${S},${d}" fill="${p.top}"/>`;
  const side = `<polygon points="${S},${d} ${S + d},0 ${S + d},${S} ${S},${S + d}" fill="${p.side}"/>`;
  const front = `<rect x="0" y="${d}" width="${S}" height="${S}" rx="9" fill="${p.face}"/>`;
  const m = 13; // white panel inset
  const panel = `<rect x="${m}" y="${d + m}" width="${S - 2 * m}" height="${S - 2 * m}" rx="7" fill="#fffdf7"/>`;
  const glyph = `<text x="${S / 2}" y="${d + S / 2}" text-anchor="middle" dominant-baseline="central" dy="0.04em" style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:44px;fill:${p.side}">${escapeHtml(letter)}</text>`;
  return top + side + front + panel + glyph;
}

/** A whole word as a slightly-tumbled row of toy blocks; fills its width. */
function alphabetBlocks(word: string): string {
  const S = 80;
  const d = 14;
  const gap = 16;
  const Wb = S + d;
  const tilts = [-4, 3, -2, 4, -3, 2, -4, 3];
  const jit = [0, -5, 4, -3, 5, -4, 2, -3]; // index-based jitter (deterministic)
  const letters = [...word];
  const totalW = letters.length * Wb + (letters.length - 1) * gap;
  const blocks = letters
    .map((ch, i) => {
      const p = BLOCK_PALETTE[i % BLOCK_PALETTE.length];
      const x = i * (Wb + gap);
      const y = jit[i % jit.length];
      const cx = x + Wb / 2;
      const cy = y + Wb / 2;
      return `<g transform="rotate(${tilts[i % tilts.length]} ${cx} ${cy}) translate(${x} ${y})">${oneBlock(ch, p, S, d)}</g>`;
    })
    .join("");
  const pad = 14;
  return `<svg class="cover-blocks" viewBox="${-pad} ${-pad - 6} ${totalW + pad * 2} ${Wb + 12 + pad * 2}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${blocks}</svg>`;
}

/** Display size (mm) for the headline name, shrinking as it gets longer. */
function coverNameSize(len: number): number {
  if (len <= 5) return 26;
  if (len <= 6) return 23;
  if (len <= 7) return 20;
  if (len <= 8) return 18;
  if (len <= 9) return 16;
  if (len <= 10) return 14;
  return 12;
}

const coverHeart = `<svg viewBox="0 0 24 24" width="11mm" height="11mm" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#e8243a"/></svg>`;

function coverLeaf(
  name: string,
  possessive: string,
  subtitle: string,
  blockWord: string,
  prvaWord: string,
  madeWith: string,
): string {
  const poss = possessive.trim();
  const headline = (poss || name).toUpperCase();
  const fs = coverNameSize(headline.length);
  // With a possessive ("EMINA prva ABECEDA") the headline already says "first",
  // so drop the duplicate subtitle and finish with three confetti dots instead.
  const top = poss
    ? `<div class="cover-name" style="font-size:${fs}mm">${escapeHtml(headline)}</div>
       <div class="cover-prva">${escapeHtml(prvaWord)}</div>`
    : `<div class="cover-name" style="font-size:${fs}mm">${escapeHtml(headline)}</div>`;
  // With a possessive the headline already says "first", so the love line goes
  // to the very bottom (pinned) instead of the subtitle.
  const love = poss
    ? `<div class="cover-love">${coverHeart}<span>${escapeHtml(madeWith)}</span></div>`
    : "";
  const subtitleLine = poss
    ? ""
    : `<div class="cover-sub">${escapeHtml(subtitle)}</div>`;
  return `<section class="leaf"><div class="cover">${confetti()}
    <div class="cover-in">
      <div class="cover-top">${top}</div>
      <div class="cover-blocks-wrap">${alphabetBlocks(blockWord)}</div>
      ${subtitleLine}
    </div>
    ${love}
  </div></section>`;
}

// ── Keepsake leaves (colour pages — confetti decoration is intentional) ──
function confetti(): string {
  // Positions in %, so the decoration scales to the full A5 leaf. Biased to the
  // sides so the centred content stays clear.
  const c = (color: string, pos: string, s: number) =>
    `<span class="cf" style="${pos};width:${s}mm;height:${s}mm;border-radius:50%;background:${color};"></span>`;
  const sq = (color: string, pos: string, s: number) =>
    `<span class="cf" style="${pos};width:${s}mm;height:${s}mm;border-radius:0.6mm;background:${color};transform:rotate(22deg);"></span>`;
  return [
    c(PINK, "left:6%;top:7%", 3.2),
    sq(YELLOW, "right:8%;top:8%", 3),
    c(TEAL, "left:46%;top:5%", 1.8),
    c(PURPLE, "right:18%;top:18%", 2),
    sq(PINK, "left:9%;top:22%", 2),
    c(YELLOW, "left:5%;top:42%", 2.6),
    c(TEAL, "right:5%;top:38%", 2),
    sq(PURPLE, "left:6%;top:58%", 2),
    c(PINK, "right:6%;top:55%", 2.3),
    c(YELLOW, "right:7%;top:72%", 1.8),
    c(TEAL, "left:8%;top:74%", 2),
    c(PURPLE, "left:8%;bottom:8%", 3),
    sq(TEAL, "right:9%;bottom:9%", 2.3),
    c(PINK, "left:48%;bottom:6%", 2),
    c(YELLOW, "right:18%;bottom:16%", 1.8),
    sq(PINK, "left:16%;bottom:17%", 1.8),
  ].join("");
}

/** White card filling the leaf, confetti behind centred content. */
function popCard(content: string, gap = 6, topAnchor = false): string {
  // topAnchor pulls content toward the top of the leaf (used by the diploma so
  // the rosette badge rides high) instead of being vertically centred.
  const popStyle = topAnchor ? ' style="justify-content:flex-start;padding-top:34mm"' : "";
  return `<section class="leaf"><div class="pop"${popStyle}>${confetti()}
    <div class="pop-in" style="gap:${gap}mm">${content}</div>
  </div></section>`;
}

const ICON_STAR = `<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#fff"/></svg>`;

function tile(bg: string, icon: string): string {
  return `<div class="tile" style="background:${bg}"><div class="tile-i">${icon}</div></div>`;
}

function popHeading(text: string, color: string, opts: { size?: number; spacing?: number; upper?: boolean } = {}): string {
  const upper = opts.upper ? "text-transform:uppercase;" : "";
  return `<div style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:${opts.size ?? 7}mm;letter-spacing:${opts.spacing ?? 0}mm;${upper}color:${color};line-height:1.1;">${escapeHtml(text)}</div>`;
}

function dot(color: string): string {
  return `<span style="display:inline-block;width:3.5mm;height:3.5mm;border-radius:50%;background:${color};"></span>`;
}

function rosette(c1: string, c2: string): string {
  return `<svg width="33mm" height="40mm" viewBox="0 0 74 90" aria-hidden="true">
    <path d="M27 52 L20 86 L33 76 L37 54 Z" fill="${c1}"/>
    <path d="M47 52 L54 86 L41 76 L37 54 Z" fill="${c2}"/>
    <circle cx="37" cy="34" r="28" fill="${YELLOW}" stroke="#fff" stroke-width="4"/>
    <path transform="translate(37 34) scale(1.25) translate(-12 -12)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#fff"/>
  </svg>`;
}

/** A whole word in big HOLLOW letters to colour (vector, fills the width). */
function hollowWordSvg(text: string, accent: string): string {
  const len = Math.max(text.length, 1);
  const MAX = 108;
  const TARGET = 384;
  const fs = Math.min(MAX, Math.round(TARGET / (0.6 * len)));
  const fit = len >= 7 ? ` textLength="${TARGET}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<svg viewBox="0 0 400 130" style="width:100%" aria-hidden="true">
    <text x="200" y="92" text-anchor="middle"${fit} style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:${fs}px;fill:#fff;stroke:${accent};stroke-width:5;stroke-linejoin:round;paint-order:stroke;">${escapeHtml(text)}</text>
  </svg>`;
}

function wordFontSize(len: number): number {
  if (len <= 3) return 100;
  if (len <= 4) return 90;
  if (len <= 5) return 78;
  if (len <= 6) return 68;
  if (len <= 7) return 60;
  if (len <= 8) return 54;
  if (len <= 9) return 48;
  if (len <= 10) return 44;
  if (len <= 11) return 40;
  if (len <= 12) return 36;
  return 32;
}

/**
 * Two single lines to write a whole word on (no top/midline; CAPITALS): the
 * first carries the word to trace, the second is blank. Vector, fills width.
 */
function wordTraceSvg(text: string, accent: string): string {
  const W = 400;
  const fs = Math.min(38, wordFontSize(text.length) * 0.5);
  const line = (y: number) =>
    `<line x1="6" y1="${y}" x2="${W - 6}" y2="${y}" stroke="${accent}" stroke-width="2" stroke-opacity=".7"/>`;
  const ghost = `<text x="${W / 2}" y="46" text-anchor="middle" style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:700;font-size:${fs}px;fill:${accent};fill-opacity:.18">${escapeHtml(text)}</text>`;
  return `<svg viewBox="0 0 400 110" style="width:96%" aria-hidden="true">${line(48)}${ghost}${line(96)}</svg>`;
}

function nameLeaf(name: string, label: string, gender?: "boy" | "girl"): string {
  const caps = name.toUpperCase(); // the book is capital letters only
  // Pink for girls, blue for boys (undefined defaults to pink, like the diploma).
  const accent = gender === "boy" ? BLUE_D : PINK_D;
  const tileBg = gender === "boy" ? BLUE : PINK;
  return popCard(
    `${tile(tileBg, ICON_STAR)}
     ${popHeading(label, accent, { size: 6, spacing: 0.4, upper: true })}
     ${hollowWordSvg(caps, accent)}
     <div style="width:100%;">${wordTraceSvg(caps, accent)}</div>`,
    5,
  );
}

function posvetaFontSize(len: number): number {
  if (len <= 80) return 9;
  if (len <= 140) return 8;
  if (len <= 200) return 7;
  return 6.2;
}

function posvetaLeaf(text: string): string {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const fs = posvetaFontSize(clean.length);
  return popCard(
    `<div style="font-family:var(--font-hand),'Caveat',cursive;font-size:${fs}mm;color:${INK_SOFT};line-height:1.5;white-space:pre-wrap;max-width:24ch;">${escapeHtml(clean)}</div>`,
    6,
  );
}

function diplomaLeaf(
  fullName: string,
  title: string,
  intro: string,
  body: string,
  gender?: "boy" | "girl",
  cheer = "",
): string {
  const p =
    gender === "boy"
      ? { head: BLUE_D, r1: BLUE, r2: TEAL, dot: BLUE_D }
      : { head: PINK_D, r1: PINK, r2: PURPLE, dot: PINK_D };
  const introLine = intro
    ? `<div style="font-family:var(--font-body),'Nunito',sans-serif;font-weight:700;font-size:4.4mm;color:${MUTED};">${escapeHtml(intro)}</div>`
    : "";
  const bodyLine = body
    ? `<div style="font-family:var(--font-hand),'Caveat',cursive;font-size:6.8mm;color:${INK_SOFT};line-height:1.35;max-width:22ch;">${escapeHtml(body)}</div>`
    : "";
  // The cheer ("Bravo!") gets its own line below the message, in the accent
  // colour, so it lands as a little celebration rather than trailing the text.
  const cheerLine = cheer
    ? `<div style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:8mm;color:${p.head};">${escapeHtml(cheer)}</div>`
    : "";
  return popCard(
    `${rosette(p.r1, p.r2)}
     ${popHeading(title, p.head, { size: 9, spacing: 0.6, upper: true })}
     ${introLine}
     ${popHeading(fullName, INK_SOFT, { size: 8 })}
     ${dot(p.dot)}
     ${bodyLine}
     ${cheerLine}`,
    9,
    true,
  );
}

// ── Localized strings ──────────────────────────────────────────────
const STRINGS = {
  hr: {
    subtitle: "moja prva slova",
    blockWord: "ABECEDA",
    prvaWord: "prva",
    madeWith: "napravljeno s ljubavlju",
    nameLabel: "Moje ime",
    diplomaTitle: "Diploma",
    diplomaIntro: "", // no "dodjeljuje se" — it needs the dative (Emi); keep the name in nominative
    diplomaBody: (gender?: "boy" | "girl"): string =>
      `Naučil${gender === "boy" ? "o" : "a"} si cijelu abecedu, od A do Ž.`,
    diplomaCheer: "Bravo!",
    posvetaFallback: (name: string, gender?: "boy" | "girl"): string =>
      `${gender === "boy" ? "Dragi" : "Draga"} ${name},\n\n` +
      "neka ti ova abeceda bude prvi korak u čarobni svijet slova i priča. " +
      "Želimo ti da svako slovo otvori nova vrata mašte, igre i radosti — " +
      "i da uživaš u svakom listiću koji obojiš.\n\n" +
      "Sretan rođendan!\nS puno ljubavi, mama i tata",
  },
  en: {
    subtitle: "my first letters",
    blockWord: "ALPHABET",
    prvaWord: "first",
    madeWith: "made with love",
    nameLabel: "My name",
    diplomaTitle: "Diploma",
    diplomaIntro: "awarded to",
    diplomaBody: (_gender?: "boy" | "girl"): string => "for learning the whole alphabet, from A to Z.",
    diplomaCheer: "Well done!",
    posvetaFallback: (name: string, _gender?: "boy" | "girl"): string =>
      `Dear ${name},\n\n` +
      "may this alphabet be your first step into the magical world of letters " +
      "and stories. We wish that every letter opens new doors of imagination, play " +
      "and joy — and that you treasure every leaf you colour in.\n\n" +
      "Happy birthday!\nWith love, Mum and Dad",
  },
} as const;

/** Every leaf of the book, in print order, as HTML strings. */
export function buildPrintLeaves(opts: PrintOpts = {}): string[] {
  const lang: LanguageId = opts.language ?? "hr";
  const alpha = ALPHABETS[lang];
  const s = STRINGS[lang];
  const name = (opts.childName || "").trim() || "Ema";
  const surname = (opts.childSurname || "").trim();
  const fullName = [name, surname].filter(Boolean).join(" ");

  // Keepsake arc: cover → posveta → A–Ž → my-name → diploma.
  // Every letter page carries a quiet personalized footer + a page number.
  const footer = `${s.subtitle} · ${name.toUpperCase()}`;
  const leaves: string[] = [];
  leaves.push(
    coverLeaf(name, opts.possessive || "", s.subtitle, s.blockWord, s.prvaWord, s.madeWith),
  );
  leaves.push(posvetaLeaf(opts.posveta || s.posvetaFallback(name, opts.gender)));
  // Page numbers count the LETTERS (A = 1), not the keepsake leaves.
  alpha.letters.forEach((e, i) => {
    leaves.push(letterLeaf(e.letter, e.word, e.iconKey, alpha.connective, footer, i + 1));
  });
  leaves.push(nameLeaf(name, s.nameLabel, opts.gender));
  leaves.push(
    diplomaLeaf(fullName, s.diplomaTitle, s.diplomaIntro, s.diplomaBody(opts.gender), opts.gender, s.diplomaCheer),
  );
  return leaves;
}

// ── Numbers booklet ("Moji prvi brojevi") — HR only ────────────────
const NUMBER_STRINGS = {
  subtitle: "moji prvi brojevi",
  blockWord: "BROJEVI",
  prvaWord: "prvi",
  madeWith: "napravljeno s ljubavlju",
  nameLabel: "Moje ime",
  diplomaTitle: "Diploma",
  diplomaIntro: "",
  diplomaBody: (gender?: "boy" | "girl"): string =>
    `Naučil${gender === "boy" ? "o" : "a"} si brojeve od 0 do 9.`,
  diplomaCheer: "Bravo!",
  posvetaFallback: (name: string, gender?: "boy" | "girl"): string =>
    `${gender === "boy" ? "Dragi" : "Draga"} ${name},\n\n` +
    "neka ti ovi brojevi otvore vrata svijeta brojanja, igre i otkrivanja. " +
    "Želimo ti da svaki broj koji obojiš i napišeš bude mali korak prema novim " +
    "pustolovinama — i da uživaš u svakom listiću.\n\n" +
    "Sretan rođendan!\nS puno ljubavi, mama i tata",
};

/** Every leaf of the numbers booklet, in print order, as HTML strings. */
export function buildNumbersPrintLeaves(opts: PrintOpts = {}): string[] {
  const s = NUMBER_STRINGS;
  const name = (opts.childName || "").trim() || "Ema";
  const surname = (opts.childSurname || "").trim();
  const fullName = [name, surname].filter(Boolean).join(" ");

  // Keepsake arc: cover → posveta → 0–9 → my-name → diploma.
  const footer = `${s.subtitle} · ${name.toUpperCase()}`;
  const leaves: string[] = [];
  leaves.push(coverLeaf(name, opts.possessive || "", s.subtitle, s.blockWord, s.prvaWord, s.madeWith));
  leaves.push(posvetaLeaf(opts.posveta || s.posvetaFallback(name, opts.gender)));
  // Page numbers count the NUMBERS (0 = 1), not the keepsake leaves.
  NUMBERS.forEach((entry, i) => {
    leaves.push(numberLeaf(entry, footer, i + 1));
  });
  leaves.push(nameLeaf(name, s.nameLabel, opts.gender));
  leaves.push(diplomaLeaf(fullName, s.diplomaTitle, s.diplomaIntro, s.diplomaBody(opts.gender), opts.gender, s.diplomaCheer));
  return leaves;
}

/**
 * The print stylesheet. `@page { size: A5; margin: 0 }` makes every browser
 * print at A5 with the leaf sizing we control; on screen the leaves stack on the
 * cream background with a soft shadow so it reads like a book preview.
 *
 * All physical sizes are in mm. The 14 mm side / 15 mm top-bottom inset on the
 * letter page is the print "safe area" — nothing important rides the trim edge.
 */
export const PRINT_CSS = `
  @page { size: A5; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fffbf2; }

  .leaf {
    width: 148mm; height: 210mm; overflow: hidden; position: relative;
    background: #fff; display: flex; align-items: stretch; justify-content: stretch;
  }

  /* Letter page (A–Ž) */
  .lp { flex: 1; display: flex; flex-direction: column; padding: 14mm 16mm; }
  .lp-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 3mm 5mm; }
  .lp-letter {
    font-family: var(--font-display), 'Baloo 2', sans-serif; font-weight: 800;
    font-size: 19mm; line-height: 1; color: #fff;
    -webkit-text-stroke: 0.75mm ${INK}; paint-order: stroke fill;
  }
  /* Digraphs (Lj, Dž, Nj) are two glyphs — render a touch smaller to balance. */
  .lp-letter--dg { font-size: 14mm; -webkit-text-stroke-width: 0.6mm; }
  .lp-con { font-family: var(--font-hand), 'Caveat', cursive; font-weight: 700; font-size: 11mm; line-height: 1; color: ${INK}; }
  /* The word is HOLLOW too, so the child can colour it in (like the big letter). */
  .lp-word {
    font-family: var(--font-display), 'Baloo 2', sans-serif; font-weight: 800;
    font-size: 19mm; line-height: 1; letter-spacing: 0.3mm;
    color: #fff; -webkit-text-stroke: 0.7mm ${INK}; paint-order: stroke fill;
  }
  /* Every picture is capped to the SAME square footprint (78×78mm) so all
     pages read at a consistent size — a wide fish and a tall princess now
     occupy the same area, not wildly different ones. */
  .lp-pic { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; margin: 3mm 0; overflow: hidden; }
  .lp-pic img, .lp-pic svg { max-width: 78mm; max-height: 78mm; width: auto; height: auto; object-fit: contain; }
  .lp-hand { width: 100%; }
  /* Number leaf: the counted picture — N icons tiled in a centred grid. */
  .lp-count { display: grid; place-content: center; justify-content: center; margin: 0 auto; }
  .lp-cell { display: grid; place-items: center; }
  .lp-count svg, .lp-count img { width: 100%; height: auto; max-height: 100%; }
  .lp-foot { margin-top: 3mm; text-align: center; font-family: var(--font-body), 'Nunito', sans-serif; font-weight: 700; font-size: 3mm; letter-spacing: 1.4mm; text-transform: uppercase; color: ${MUTED}; }
  .lp-pageno { position: absolute; bottom: 8mm; right: 12mm; font-family: var(--font-body), 'Nunito', sans-serif; font-weight: 700; font-size: 3.4mm; color: ${MUTED}; }

  /* Cover */
  .cover {
    flex: 1; margin: 10mm; border: 0.7mm solid ${INK}; border-radius: 7mm;
    position: relative; overflow: hidden; background: #fff;
    display: flex; align-items: flex-start; justify-content: center;
    padding: 26mm 11mm 14mm; text-align: center;
  }
  .cover-in {
    position: relative; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16mm; width: 100%;
  }
  .cover-top { display: flex; flex-direction: column; align-items: center; gap: 0; }
  .cover-name {
    font-family: var(--font-display), 'Baloo 2', sans-serif; font-weight: 800;
    line-height: 1; letter-spacing: 0.6mm; color: ${INK};
  }
  .cover-prva {
    font-family: var(--font-hand), 'Caveat', cursive; font-weight: 700;
    font-size: 14mm; line-height: 1; color: ${PINK}; margin-top: 9mm;
    transform: rotate(-4deg);
  }
  .cover-blocks-wrap { width: 100%; max-width: 126mm; }
  .cover-blocks { display: block; width: 100%; height: auto; }
  .cover-sub { font-family: var(--font-hand), 'Caveat', cursive; font-weight: 700; font-size: 14mm; color: ${INK_SOFT}; }
  .cover-love {
    position: absolute; left: 0; right: 0; bottom: 14mm;
    display: flex; flex-direction: column; align-items: center; gap: 2mm;
    font-family: var(--font-hand), 'Caveat', cursive; font-weight: 700;
    font-size: 11mm; line-height: 1; color: ${INK_SOFT};
  }
  .cover-love svg { flex: none; }

  /* Keepsake (confetti) leaves */
  .pop {
    flex: 1; position: relative; overflow: hidden; background: #fff;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 24mm 18mm;
  }
  .cf { position: absolute; }
  .pop-in { position: relative; display: flex; flex-direction: column; align-items: center; width: 100%; }
  .tile { width: 17mm; height: 17mm; border-radius: 5mm; display: grid; place-items: center; }
  .tile-i { width: 8mm; height: 8mm; }

  /* Screen-only book-preview chrome — never printed */
  @media screen {
    body { padding: 24px 0; }
    .leaf { margin: 0 auto 20px; box-shadow: 0 8px 30px rgba(43,36,64,.16); }
  }
  @media print {
    .leaf { box-shadow: none; page-break-after: always; break-after: page; }
    .leaf:last-child { page-break-after: auto; break-after: auto; }
  }
`;
