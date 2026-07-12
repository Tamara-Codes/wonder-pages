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
import { NUMBERS_V2 } from "./numbers-v2";
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

/** The print palette, for the sibling book builders (maze-book, sudoku-book). */
export const PRINT_COLORS = { INK, INK_SOFT, MUTED, PINK, PINK_D, YELLOW, TEAL, TEAL_D, PURPLE, BLUE, BLUE_D };

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
  /**
   * Child's age — drives puzzle difficulty in the age-adaptive books (maze,
   * sudoku). Each book clamps it to its own window and ramps within the book.
   */
  age?: number;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/**
 * Tag a leaf with a semantic name (cover, posveta, letter-A, …). The per-page
 * export script (scripts/print-book.mjs) reads `data-leaf` to name each PNG, so
 * a broken page is easy to point at ("fix letter-Ž"). Harmless on the route.
 */
export function tagLeaf(html: string, label: string): string {
  return html.replace('<section class="leaf"', `<section data-leaf="${label}" class="leaf"`);
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
    `<text x="${(slot * (i + 0.5)).toFixed(1)}" y="16" text-anchor="middle" style="font-family:var(--font-baloo),'Baloo 2',sans-serif;font-weight:700;font-size:16px;fill:${INK};fill-opacity:.08">${escapeHtml(glyph)}</text>`,
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
  const glyph = `<text x="${S / 2}" y="${d + S / 2}" text-anchor="middle" dominant-baseline="central" dy="0.04em" style="font-family:var(--font-baloo),'Baloo 2',sans-serif;font-weight:800;font-size:44px;fill:${p.side}">${escapeHtml(letter)}</text>`;
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

export function coverLeaf(
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
export function popCard(content: string, gap = 6, topAnchor = false): string {
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
  return `<div style="font-family:var(--font-baloo),'Baloo 2',sans-serif;font-weight:800;font-size:${opts.size ?? 7}mm;letter-spacing:${opts.spacing ?? 0}mm;${upper}color:${color};line-height:1.1;">${escapeHtml(text)}</div>`;
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
    <text x="200" y="92" text-anchor="middle"${fit} style="font-family:var(--font-baloo),'Baloo 2',sans-serif;font-weight:800;font-size:${fs}px;fill:#fff;stroke:${accent};stroke-width:5;stroke-linejoin:round;paint-order:stroke;">${escapeHtml(text)}</text>
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
  const ghost = `<text x="${W / 2}" y="46" text-anchor="middle" style="font-family:var(--font-baloo),'Baloo 2',sans-serif;font-weight:700;font-size:${fs}px;fill:${accent};fill-opacity:.18">${escapeHtml(text)}</text>`;
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

export function posvetaLeaf(text: string): string {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const fs = posvetaFontSize(clean.length);
  return popCard(
    `<div style="font-family:var(--font-hand),'Caveat',cursive;font-size:${fs}mm;color:${INK_SOFT};line-height:1.5;white-space:pre-wrap;max-width:24ch;">${escapeHtml(clean)}</div>`,
    6,
  );
}

export function diplomaLeaf(
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
    ? `<div style="font-family:var(--font-baloo),'Baloo 2',sans-serif;font-weight:800;font-size:8mm;color:${p.head};">${escapeHtml(cheer)}</div>`
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
    tagLeaf(coverLeaf(name, opts.possessive || "", s.subtitle, s.blockWord, s.prvaWord, s.madeWith), "cover"),
  );
  leaves.push(tagLeaf(posvetaLeaf(opts.posveta || s.posvetaFallback(name, opts.gender)), "posveta"));
  // Page numbers count the LETTERS (A = 1), not the keepsake leaves.
  alpha.letters.forEach((e, i) => {
    leaves.push(tagLeaf(letterLeaf(e.letter, e.word, e.iconKey, alpha.connective, footer, i + 1), `letter-${e.letter}`));
  });
  leaves.push(tagLeaf(nameLeaf(name, s.nameLabel, opts.gender), "name"));
  leaves.push(
    tagLeaf(diplomaLeaf(fullName, s.diplomaTitle, s.diplomaIntro, s.diplomaBody(opts.gender), opts.gender, s.diplomaCheer), "diploma"),
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
  leaves.push(tagLeaf(coverLeaf(name, opts.possessive || "", s.subtitle, s.blockWord, s.prvaWord, s.madeWith), "cover"));
  leaves.push(tagLeaf(posvetaLeaf(opts.posveta || s.posvetaFallback(name, opts.gender)), "posveta"));
  // Page numbers count the NUMBERS (0 = 1), not the keepsake leaves.
  NUMBERS.forEach((entry, i) => {
    leaves.push(tagLeaf(numberLeaf(entry, footer, i + 1), `number-${entry.digit}`));
  });
  leaves.push(tagLeaf(nameLeaf(name, s.nameLabel, opts.gender), "name"));
  leaves.push(tagLeaf(diplomaLeaf(fullName, s.diplomaTitle, s.diplomaIntro, s.diplomaBody(opts.gender), opts.gender, s.diplomaCheer), "diploma"));
  return leaves;
}

// ── Numbers v2 prototype — simple "1–10" leaf, mirrors letterLeaf ─
// One-off test leaf for the richer "Moji prvi brojevi" redesign (2026-07-11):
// numbers 1–10, laid out EXACTLY like an alphabet leaf (word up top, one big
// colour-in picture, two trace/write lines at the bottom) — the "picture" is
// the numeral itself, a friendly character to colour. The word sits LEFT
// (not centred like the alphabet leaf) and the picture rides high, pulled up
// toward the word rather than centred in its box.
//
// The numeral character is a bespoke Gemini colour-in drawing at
// public/icons-art/num<digit>-face.png (scripts/gen-numbers-v2.mjs), same
// commissioned-art pattern as the alphabet icons. Falls back to a hand-drawn
// SVG face (text glyph + eyes) for any digit not yet generated.
// Does NOT touch lib/numbers.ts or buildNumbersPrintLeaves above — the
// simpler 0–9 product still in use.

/** Eye/mouth placement tuned per digit's glyph shape (viewBox 0 0 140 170), used only by the SVG fallback. */
interface NumberFace { cx1: number; cx2: number; cy: number; r: number }
const NUMBER_FACES: Record<string, NumberFace> = {
  "1": { cx1: 62, cx2: 80, cy: 56, r: 6.5 },
};

/** Hand-drawn fallback: the numeral glyph + eyes/smile, for a digit with no commissioned art yet. */
function numberFaceFallback(digit: string): string {
  const f = NUMBER_FACES[digit] ?? { cx1: 52, cx2: 88, cy: 62, r: 7 };
  const mouthY = f.cy + 20;
  return `<svg viewBox="0 0 140 170" aria-hidden="true">
    <text x="70" y="150" text-anchor="middle" style="font-family:var(--font-baloo),'Baloo 2',sans-serif;font-weight:800;font-size:170px;fill:#fff;stroke:${INK};stroke-width:6;paint-order:stroke fill;">${digit}</text>
    <circle cx="${f.cx1}" cy="${f.cy}" r="${f.r}" fill="${INK}"/>
    <circle cx="${f.cx2}" cy="${f.cy}" r="${f.r}" fill="${INK}"/>
    <path d="M${f.cx1} ${mouthY} Q70 ${mouthY + 9} ${f.cx2} ${mouthY}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

/** The numeral picture: commissioned Gemini art if drawn, else the SVG fallback face. */
function numberFace(digit: string): string {
  const src = artImageSrc(`num${digit}-face`);
  return src ? `<img src="${src}" alt="" />` : numberFaceFallback(digit);
}

/** One number leaf, laid out like letterLeaf: word (left), the big numeral picture, then trace lines. */
function numberSimpleLeaf(digit: string, word: string, footer: string, pageNo: number): string {
  return `<section class="leaf"><div class="lp">
    <div class="lp-head lp-head--left">
      <span class="lp-word">${escapeHtml(word.toUpperCase())}</span>
    </div>
    <div class="lp-pic">${numberFace(digit)}</div>
    ${handwriting(digit)}
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

/** Single-leaf test build: just the "Broj 1" prototype page. */
export function buildNumberIntroTestLeaves(childName = "Ema"): string[] {
  const footer = `moji prvi brojevi · ${childName.toUpperCase()}`;
  return [tagLeaf(numberSimpleLeaf("1", "Jedan", footer, 1), "number-1-test")];
}

// ── Numbers v2 prototype — "Igram se s brojem" (page 2 per digit) ──
// One-off test leaf for the SECOND page per number (2026-07-11): two small
// activities, pure code/layout (no Gemini art) — recognition (circle the
// digit among decoys) + counting (count a picture, write the number). Reuses
// the shared icon vocabulary via iconLineArt, same as the alphabet leaf.

/** A row of digit glyphs (some matching the target, some decoys) to circle by hand. */
function digitRecognitionRow(digits: string[]): string {
  const cells = digits.map((d) => `<span class="npg-digit">${escapeHtml(d)}</span>`).join("");
  return `<div class="npg-digits">${cells}</div>`;
}

/** `count` copies of one icon in a simple row, to count — then a blank box to write the answer. */
function countAndWriteRow(iconKey: string, count: number): string {
  const one = iconLineArt(iconKey, INK).replace("<svg", "<svg ");
  const cells = Array.from({ length: count }, () => `<div class="npg-count-cell">${one}</div>`).join("");
  return `<div class="npg-count-row">${cells}</div><div class="npg-answer-box"></div>`;
}

/** One "Igram se s brojem" test leaf for digit 1: recognition + count-and-write. */
function numberPlayTestLeaf(childName: string): string {
  const footer = `moji prvi brojevi · ${childName.toUpperCase()}`;
  return `<section class="leaf"><div class="npg">
    <div class="npg-eyebrow">BROJ 1 · IGRAM SE</div>
    <div class="npg-activity">
      <div class="npg-instruction">Zaokruži broj 1.</div>
      ${digitRecognitionRow(["7", "1", "4", "1", "0", "1"])}
    </div>
    <div class="npg-activity">
      <div class="npg-instruction">Prebroji i napiši.</div>
      ${countAndWriteRow("balloon", 1)}
    </div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">1b</div></section>`;
}

/** Single-leaf test build: just the "Igram se s brojem 1" prototype page. */
export function buildNumberPlayTestLeaves(childName = "Ema"): string[] {
  return [tagLeaf(numberPlayTestLeaf(childName), "number-1-play-test")];
}

// ── Numbers v2 prototype — "dice + cube stacks" tasks leaf ────────
// One-off test leaf (2026-07-12) with two tasks, pure code/vector (no Gemini
// art): matching (dice faces 1–6 in mixed order up top, numerals 1–6 below —
// draw a line between each pair) + counting (four stacks of building cubes,
// count each and write the total in the box underneath).

/** Standard pip positions per die value, on a 0–100 face. */
const DIE_PIPS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[31, 31], [69, 69]],
  3: [[31, 31], [50, 50], [69, 69]],
  4: [[31, 31], [69, 31], [31, 69], [69, 69]],
  5: [[31, 31], [69, 31], [50, 50], [31, 69], [69, 69]],
  6: [[31, 31], [69, 31], [31, 50], [69, 50], [31, 69], [69, 69]],
};

/** One die face: rounded light-blue square + dark-blue pips (a colour page). */
function dieFace(value: number): string {
  const pips = DIE_PIPS[value]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.5" fill="${BLUE_D}"/>`)
    .join("");
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect x="3" y="3" width="94" height="94" rx="18" fill="#e8f3ff" stroke="${BLUE_D}" stroke-width="5"/>
    ${pips}
  </svg>`;
}

/** Face tints for one cube stack: lightest top, darkest side, strong outline. */
interface CubeShade { top: string; front: string; side: string; stroke: string }

/**
 * A stack of building cubes drawn in simple isometric art, tinted in the given
 * colour (lightest top, darkest side) so the 3D reads — this is a colour page.
 * `rows` lists the cubes per row TOP to BOTTOM; each row is centred over the
 * one below. Painted bottom-up and left-to-right so nearer faces cover the
 * ones behind.
 */
function cubeStackSvg(rows: number[], shade: CubeShade): string {
  const S = 20; // front-face size (viewBox units)
  const D = 8; // isometric depth
  const SW = 2; // stroke width
  const MM = 0.32; // mm per viewBox unit → a ~6.4 mm cube
  const n = rows.length;
  const maxCols = Math.max(...rows);
  const W = maxCols * S + D + SW;
  const H = n * S + D + SW;
  const cubes: string[] = [];
  for (let rb = 0; rb < n; rb++) {
    const cols = rows[n - 1 - rb];
    const x0 = SW / 2 + ((maxCols - cols) * S) / 2;
    const yB = H - SW / 2 - rb * S;
    const yT = yB - S;
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * S;
      cubes.push(
        `<polygon points="${x},${yT} ${x + D},${yT - D} ${x + S + D},${yT - D} ${x + S},${yT}" fill="${shade.top}"/>`,
        `<polygon points="${x + S},${yB} ${x + S + D},${yB - D} ${x + S + D},${yT - D} ${x + S},${yT}" fill="${shade.side}"/>`,
        `<rect x="${x}" y="${yT}" width="${S}" height="${S}" fill="${shade.front}"/>`,
      );
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="${(W * MM).toFixed(1)}mm" height="${(H * MM).toFixed(1)}mm" stroke="${shade.stroke}" stroke-width="${SW}" stroke-linejoin="round" aria-hidden="true">${cubes.join("")}</svg>`;
}

// Cubes per row (top to bottom) + tint, one colour per stack: a blue 2×2
// block of 4, a yellow tower of 6, a green pyramid of 10 (2/3/5) and a red
// mound of 8 (1/1/2/4).
const CUBE_STACKS: Array<{ rows: number[]; shade: CubeShade }> = [
  { rows: [2, 2], shade: { top: "#f5faff", front: "#e8f3ff", side: "#cde4fa", stroke: BLUE_D } },
  { rows: [1, 1, 1, 1, 1, 1], shade: { top: "#fff9e6", front: "#ffefc2", side: "#ffdf8f", stroke: "#e0a91f" } },
  { rows: [2, 3, 5], shade: { top: "#eefcf8", front: "#d9f6ee", side: "#b6ecdd", stroke: TEAL_D } },
  { rows: [1, 1, 2, 4], shade: { top: "#fff0f0", front: "#ffdede", side: "#ffc2c2", stroke: "#d64545" } },
];

/** The two-task leaf: dice↔number matching + count-the-cubes. */
function numberTasksLeaf(footer: string, pageNo: number): string {
  // Mixed so no die sits above its own number (a straight-down line is no fun).
  const diceOrder = [3, 6, 1, 5, 2, 4];
  const dice = diceOrder
    .map((v) => `<div class="npg-die">${dieFace(v)}</div>`)
    .join("");
  const nums = [1, 2, 3, 4, 5, 6]
    .map((n) => `<span class="npg-num">${n}</span>`)
    .join("");
  const stacks = CUBE_STACKS
    .map(({ rows, shade }) => `<div class="npg-stack">${cubeStackSvg(rows, shade)}<div class="npg-stack-box"></div></div>`)
    .join("");
  return `<section class="leaf"><div class="npg">
    <div class="npg-activity npg-activity--tight">
      <div class="npg-instruction">Spoji kockicu s brojem.</div>
      <div class="npg-pair-row">${dice}</div>
      <div class="npg-pair-row npg-pair-row--nums">${nums}</div>
    </div>
    <div class="npg-activity npg-activity--tight">
      <div class="npg-instruction">Prebroji kocke i napiši broj.</div>
      <div class="npg-stacks">${stacks}</div>
    </div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

/** Single-leaf test build: just the dice + cube-stacks tasks prototype page. */
export function buildNumberTasksTestLeaves(childName = "Ema"): string[] {
  const footer = `moji prvi brojevi · ${(childName || "Ema").toUpperCase()}`;
  return [tagLeaf(numberTasksLeaf(footer, 1), "numbers-tasks-test")];
}

// ── Numbers v2 — "missing numbers" shirts leaf ────────────────────
// The one leaf of the booklet that is IN COLOUR: ten shirts pegged to two
// washing lines, numbered 1–10 in reading order, but 3, 5, 6, 8 and 9 are
// blank — the child writes them in. The whole scene is a commissioned Gemini
// drawing at public/icons-art/num-shirts-<gender>.png (scripts/
// gen-number-shirts.mjs): blue shirts for a boy, pink for a girl.

/** The shirts leaf, or null if the art for that gender isn't generated yet. */
function missingNumbersLeaf(gender: "boy" | "girl", footer: string, pageNo: number): string | null {
  const src = artImageSrc(`num-shirts-${gender}`);
  if (!src) return null;
  return `<section class="leaf"><div class="lp">
    <div class="npg-instruction">Napiši brojeve koji nedostaju!</div>
    <div class="lp-pic lp-pic--wide"><img src="${src}" alt="" /></div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

// ── Numbers v2 — connect-the-dots kite leaf ───────────────────────
// The child joins dots 1–10 and a diamond kite appears in the sky (2026-07-12,
// went FULL COLOUR same day — Tamara wanted a storybook scene like her
// reference, not line art). Split follows the shirts-page precedent: the whole
// painted scene (sky, meadow, frog in a red jacket with the scarf streaming in
// the wind, the THIN kite string rising from its spool and ending in open sky
// with little ribbon bows) is ONE Gemini image at public/icons-art/
// kite-frog.png (scripts/gen-kite-frog.mjs); the code overlays only what must
// be exact — small dots, thin plain numbers, the kite's smiley face and a
// dashed close-the-shape hint. KITE_CORNERS positions the diamond so its
// BOTTOM corner sits where the painted string ends — re-tune by eye whenever
// the scene art is regenerated.

type XY = [number, number];

/** Diamond corners of the dot kite in the scene viewBox (0 0 116 150), bottom
 * corner on the painted string's tip. Tuned to the current kite-frog.png. */
const KITE_CORNERS: { T: XY; R: XY; B: XY; L: XY } = {
  T: [84, 14],
  R: [106, 40],
  B: [84, 70],
  L: [62, 40],
};

/** The dot/number/face overlay on top of the painted scene, as one SVG. */
function connectDotsKiteSvg(sceneSrc: string): string {
  const { T, R, B, L } = KITE_CORNERS;
  const C: XY = [(L[0] + R[0]) / 2, (T[1] + B[1]) / 2];
  const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // 10 dots starting at the BOTTOM corner (where the painted string ends, so
  // the child starts at the string) and going up the right side, over the top,
  // down the left; the dashed hint closes 10 back into 1.
  const dots: XY[] = [
    B, lerp(B, R, 1 / 3), lerp(B, R, 2 / 3), R,
    lerp(R, T, 0.5), T, lerp(T, L, 0.5), L,
    lerp(L, B, 1 / 3), lerp(L, B, 2 / 3),
  ];
  // Hand-tuned label offsets for dots the generic outward push crowds into
  // painted details (dot 1 sits on the string tip).
  const labelNudge: Record<number, XY> = { 1: [5, 2.5] };
  const halo = `paint-order:stroke fill;stroke:#ffffff;stroke-width:1px;`;
  const dotMarks = dots
    .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.95" fill="${INK_SOFT}" stroke="#fff" stroke-width="0.35"/>`)
    .join("");
  const labels = dots
    .map(([x, y], i) => {
      let [ox, oy] = labelNudge[i + 1] ?? [0, 0];
      if (!ox && !oy) {
        const len = Math.hypot(x - C[0], y - C[1]) || 1;
        ox = ((x - C[0]) / len) * 5;
        oy = ((y - C[1]) / len) * 5;
      }
      return `<text x="${(x + ox).toFixed(1)}" y="${(y + oy).toFixed(1)}" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-body),'Nunito',sans-serif;font-weight:700;font-size:4.8px;fill:${INK_SOFT};${halo}">${i + 1}</text>`;
    })
    .join("");
  // The kite's smiley face, thin like the painted linework: outlined eyes with
  // pupils + a light smile, pre-printed in the diamond's top half.
  const fx = C[0], fy = T[1] + (B[1] - T[1]) * 0.24;
  const face =
    `<ellipse cx="${fx - 4.5}" cy="${fy}" rx="1.5" ry="1.9" fill="#fff" stroke="${INK_SOFT}" stroke-width="0.45"/>` +
    `<circle cx="${fx - 4.5}" cy="${(fy + 0.6).toFixed(1)}" r="0.6" fill="${INK_SOFT}"/>` +
    `<ellipse cx="${fx + 4.5}" cy="${fy}" rx="1.5" ry="1.9" fill="#fff" stroke="${INK_SOFT}" stroke-width="0.45"/>` +
    `<circle cx="${fx + 4.5}" cy="${(fy + 0.6).toFixed(1)}" r="0.6" fill="${INK_SOFT}"/>` +
    `<path d="M${fx - 5} ${fy + 4.5} Q${fx} ${fy + 7.8} ${fx + 5} ${fy + 4.5}" fill="none" stroke="${INK_SOFT}" stroke-width="0.55" stroke-linecap="round"/>`;
  // Dashed hint along the last edge (dot 10 back down to dot 1) so the child
  // knows the kite closes where it began.
  const closeHint = `<line x1="${dots[9][0].toFixed(1)}" y1="${dots[9][1].toFixed(1)}" x2="${B[0]}" y2="${B[1]}" stroke="${INK_SOFT}" stroke-width="0.4" stroke-dasharray="1.1 1.9" stroke-linecap="round"/>`;
  const scene = `<image href="${sceneSrc}" x="0" y="0" width="116" height="150" preserveAspectRatio="xMidYMid meet"/>`;
  return `<svg viewBox="0 0 116 150" aria-hidden="true">${scene}${closeHint}${face}${dotMarks}${labels}</svg>`;
}

/** The connect-the-dots kite leaf, or null until the frog art is generated. */
function connectDotsKiteLeaf(footer: string, pageNo: number): string | null {
  const src = artImageSrc("kite-frog");
  if (!src) return null;
  return `<section class="leaf"><div class="npg">
    <div class="npg-instruction">Spoji brojeve od 1 do 10!</div>
    <div class="npg-scene">${connectDotsKiteSvg(src)}</div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

/** Single-leaf test build: just the connect-the-dots kite page. */
export function buildKiteTestLeaves(childName = "Ema"): string[] {
  const footer = `moji prvi brojevi · ${(childName || "Ema").toUpperCase()}`;
  const leaf = connectDotsKiteLeaf(footer, 1);
  return leaf ? [tagLeaf(leaf, "kite-dots-test")] : [];
}

// ── Numbers v2 — count-the-zoo-animals leaf ───────────────────────
// A FULL-COLOUR zoo scene (one Gemini image, scripts/gen-zoo.mjs — regenerate
// and COUNT the animals by eye until exact) with a count-and-write row under
// it: a small picture of each animal kind next to an empty box. The answer
// key lives in the generated scene: 2 camels, 1 lion, 3 elephants, 4 monkeys
// (plus a giraffe and a zebra as extras the child doesn't count). The small
// pictures are CROPPED OUT OF THE SCENE ITSELF (scripts/crop-zoo-icons.mjs)
// so they match the counted animals exactly — if the scene is regenerated,
// re-tune the crop boxes there and re-run that script.

const ZOO_COUNT_ICONS = ["camel", "lion", "elephant", "monkey"];

// The icon VERSION is part of the FILENAME (zoo-icon-camel-v4.png) — a query
// param wasn't enough, the browser kept serving the stale cached icon. Bump
// together with V in scripts/crop-zoo-icons.mjs. The scene keeps its name +
// a query version (it changes rarely once the counts are right).
const ZOO_ART_V = "4";

/** The zoo counting leaf, or null until the scene art is generated. */
function zooCountLeaf(footer: string, pageNo: number): string | null {
  const src = artImageSrc("zoo-scene");
  if (!src) return null;
  const row = ZOO_COUNT_ICONS
    .map((k) => `<div class="npg-zoo-cell"><img src="/icons-art/zoo-icon-${k}-v${ZOO_ART_V}.png" alt="" /><div class="npg-stack-box"></div></div>`)
    .join("");
  return `<section class="leaf"><div class="npg">
    <div class="npg-instruction">Prebroji životinje i napiši broj.</div>
    <div class="npg-zoo-scene"><img src="${src}?v=${ZOO_ART_V}" alt="" /></div>
    <div class="npg-zoo-row">${row}</div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

/** Single-leaf test build: just the count-the-zoo-animals page. */
export function buildZooTestLeaves(childName = "Ema"): string[] {
  const footer = `moji prvi brojevi · ${(childName || "Ema").toUpperCase()}`;
  const leaf = zooCountLeaf(footer, 1);
  return leaf ? [tagLeaf(leaf, "zoo-count-test")] : [];
}

// ── Numbers v2 prototype — colour-by-number balloon leaf ──────────
// "Oboji sliku po brojevima!": a hot-air balloon drawn as white outline
// regions, each holding a number; the legend up top maps every number 1–10 to
// a printed colour swatch. PURE CODE (no Gemini) — regions, dividers and
// number placement are exact SVG. Numbers 1–4 repeat symmetrically across the
// seven envelope gores (1,2,3,4,3,2,1); 5 = bottom band, 6 = basket,
// 7 = pennant flag, 9 = crown cap, 8 + 10 = the two clouds, and the sun
// reuses 2 (žuto) so repetition is part of the game.

/** Number → printed swatch colour (cheerful print-safe hues, brand-adjacent). */
const CBN_LEGEND: Array<{ n: number; hex: string }> = [
  { n: 1, hex: "#e94f4f" },  // crveno
  { n: 2, hex: "#ffc93c" },  // žuto
  { n: 3, hex: "#3da5ff" },  // plavo
  { n: 4, hex: "#58c15c" },  // zeleno
  { n: 5, hex: "#ff9838" },  // narančasto
  { n: 6, hex: "#a9764f" },  // smeđe
  { n: 7, hex: "#ff5ca8" },  // ružičasto
  { n: 8, hex: "#a5d8ff" },  // svijetloplavo
  { n: 9, hex: "#8a6cff" },  // ljubičasto
  { n: 10, hex: "#b9b4c7" }, // sivo
];

/** The balloon colouring picture: all regions white, numbered, ink outlines. */
function colourByNumberBalloonSvg(): string {
  const num = (x: number, y: number, n: number, size = 5): string =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-body),'Nunito',sans-serif;font-weight:700;font-size:${size}px;fill:${INK}">${n}</text>`;
  const thick = `fill="#fff" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"`;
  const thin = `fill="none" stroke="${INK}" stroke-width="0.55" stroke-linecap="round"`;

  // Envelope outline: widest 76 at y38, pole at (58,8), throat 50–66 at y70.
  const envelope = `<path d="M50 70 C 28 62, 20 50, 20 38 C 20 18, 38 8, 58 8 C 78 8, 96 18, 96 38 C 96 50, 88 62, 66 70 Z" ${thick}/>`;
  // Crown-cap divider (region 9 above it) and bottom-band divider (region 5
  // below it), both gentle downward-bowed arcs across the envelope.
  const capLine = `<path d="M36 14 Q58 22 80 14" ${thin}/>`;
  const bandLine = `<path d="M26 55 Q58 65 90 55" ${thin}/>`;
  // Six gore dividers between the cap and band arcs → seven vertical stripes.
  // Each boundary j (at fraction f = j/7) starts on the cap arc, bulges out to
  // the envelope's width at mid-height, and lands on the band arc.
  let gores = "";
  for (let j = 1; j <= 6; j++) {
    const f = j / 7;
    const bow = f * (1 - f); // 0 at the edges, max in the middle (arc dip)
    const capX = 36 + 44 * f, capY = 14 + 16 * bow;
    const bandX = 26 + 64 * f, bandY = 55 + 20 * bow;
    const midX = 20 + 76 * f;
    gores += `<path d="M${capX.toFixed(1)} ${capY.toFixed(1)} C ${midX.toFixed(1)} 30, ${midX.toFixed(1)} 46, ${bandX.toFixed(1)} ${bandY.toFixed(1)}" ${thin}/>`;
  }
  // Stripe numbers at the widest line, symmetric 1,2,3,4,3,2,1.
  const goreNums = [1, 2, 3, 4, 3, 2, 1]
    .map((n, k) => num(20 + (76 * (k + 0.5)) / 7, 38, n))
    .join("");
  // Pennant flag on a little mast at the pole (region 7).
  const flag =
    `<line x1="58" y1="8" x2="58" y2="1" stroke="${INK}" stroke-width="0.6"/>` +
    `<path d="M58 1 L58 7.4 L74 4.2 Z" ${thick.replace("0.9", "0.6")}/>`;
  // Ropes + basket (region 6): rim bar and a slightly tapered weave body.
  const basket =
    `<line x1="50" y1="70" x2="48.5" y2="82" stroke="${INK}" stroke-width="0.6"/>` +
    `<line x1="66" y1="70" x2="67.5" y2="82" stroke="${INK}" stroke-width="0.6"/>` +
    `<rect x="44" y="82" width="28" height="4.5" rx="1.5" ${thick.replace("0.9", "0.7")}/>` +
    `<path d="M46.5 86.5 L69.5 86.5 L67.5 99 L48.5 99 Z" ${thick.replace("0.9", "0.7")}/>`;
  // Sun with rays (reuses 2 = žuto) and the two clouds (8 and 10).
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return `<line x1="${(13 + 9 * c).toFixed(1)}" y1="${(13 + 9 * s).toFixed(1)}" x2="${(13 + 12.5 * c).toFixed(1)}" y2="${(13 + 12.5 * s).toFixed(1)}" stroke="${INK}" stroke-width="0.6" stroke-linecap="round"/>`;
  }).join("");
  const sun = `${rays}<circle cx="13" cy="13" r="7" ${thick.replace("0.9", "0.7")}/>`;
  const cloudPath = `M4 12 Q0 12 0 8 Q0 4 4 4 Q5 0 9.5 0 Q13 0 14.5 2.5 Q19 1.5 20 5.5 Q24 5.5 24 9 Q24 12 20 12 Z`;
  const clouds =
    `<g transform="translate(2 62)"><path d="${cloudPath}" ${thick.replace("0.9", "0.7")}/></g>` +
    `<g transform="translate(91 54)"><path d="${cloudPath}" ${thick.replace("0.9", "0.7")}/></g>`;

  const numbers =
    goreNums +
    num(58, 15.2, 9, 4.2) +   // crown cap
    num(58, 67.2, 5, 4.2) +   // bottom band
    num(58, 93, 6) +          // basket
    num(62.5, 4.2, 7, 3.4) +  // flag
    num(13, 13, 2) +          // sun
    num(14, 70, 8, 4.2) +     // left cloud
    num(103, 62, 10, 4.2);    // right cloud
  return `<svg viewBox="0 0 116 104" aria-hidden="true">${sun}${clouds}${envelope}${capLine}${bandLine}${gores}${flag}${basket}${numbers}</svg>`;
}

/** The colour-by-number leaf: legend of 10 swatches, then the balloon. */
function colourByNumberLeaf(footer: string, pageNo: number): string {
  const legend = CBN_LEGEND
    .map(({ n, hex }) => `<div class="cbn-swatch" style="background:${hex}"><span class="cbn-badge">${n}</span></div>`)
    .join("");
  return `<section class="leaf"><div class="npg">
    <div class="npg-instruction">Oboji sliku po brojevima!</div>
    <div class="cbn-legend">${legend}</div>
    <div class="npg-scene">${colourByNumberBalloonSvg()}</div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

/** Single-leaf test build: just the colour-by-number balloon page. */
export function buildColourByNumberTestLeaves(childName = "Ema"): string[] {
  const footer = `moji prvi brojevi · ${(childName || "Ema").toUpperCase()}`;
  return [tagLeaf(colourByNumberLeaf(footer, 1), "colour-by-number-test")];
}

// ── Numbers v2 prototype — ladybug draw-the-dots leaf ─────────────
// "Nacrtaj točkice na praznom krilu!": five ladybugs on leaves, each with the
// numeral printed on its LEFT wing and the RIGHT wing empty — the child DRAWS
// that many spots, the one production skill (making a quantity, not reading or
// counting one) no other page trains. PURE CODE. Light-tint fills like the
// dice/tasks page so pencil dots stay visible on the wing.

/** The wing numbers, one per bug, top-left → bottom-right (quincunx order). */
const LADYBUG_NUMBERS = [2, 4, 5, 7, 10];

/** Five ladybugs-on-leaves in a quincunx, each in its own 52×46 cell. */
function ladybugDotsSvg(): string {
  const RED_D = "#d64545", RED_T = "#ffe7e4", GREEN_D = "#4b9a50", GREEN_T = "#e8f5e4";
  // One bug in local coords (cell 0 0 52 46): leaf behind, body circle split
  // into two wings, dark head with antennae, three little legs per side.
  const bug = (n: number): string => {
    const legs = [150, 180, 210]
      .map((deg) => {
        const a = (deg * Math.PI) / 180;
        const [c, s] = [Math.cos(a), Math.sin(a)];
        const line = (sx: number, sy: number, ex: number, ey: number) =>
          `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${INK_SOFT}" stroke-width="0.7" stroke-linecap="round"/>`;
        // A leg on each side, mirrored around the body's centre x = 26.
        return (
          line(26 + 15.5 * c, 23 + 15.5 * s, 26 + 19.5 * c, 23 + 19.5 * s) +
          line(26 - 15.5 * c, 23 + 15.5 * s, 26 - 19.5 * c, 23 + 19.5 * s)
        );
      })
      .join("");
    return (
      `<path d="M2 38 Q14 18, 50 24 Q40 46, 8 44 Q0 42, 2 38 Z" fill="${GREEN_T}" stroke="${GREEN_D}" stroke-width="0.7" stroke-linejoin="round"/>` +
      `<path d="M6 40 Q24 30, 46 26" fill="none" stroke="${GREEN_D}" stroke-width="0.55" stroke-linecap="round"/>` +
      legs +
      `<path d="M23.8 4.4 Q21.5 1.6, 19.8 1.2" fill="none" stroke="${INK_SOFT}" stroke-width="0.7" stroke-linecap="round"/>` +
      `<circle cx="19.4" cy="1.1" r="0.8" fill="${INK_SOFT}"/>` +
      `<path d="M28.2 4.4 Q30.5 1.6, 32.2 1.2" fill="none" stroke="${INK_SOFT}" stroke-width="0.7" stroke-linecap="round"/>` +
      `<circle cx="32.6" cy="1.1" r="0.8" fill="${INK_SOFT}"/>` +
      `<circle cx="26" cy="9" r="5.4" fill="${INK_SOFT}"/>` +
      `<circle cx="26" cy="23" r="15.5" fill="${RED_T}" stroke="${RED_D}" stroke-width="1"/>` +
      `<line x1="26" y1="7.5" x2="26" y2="38.5" stroke="${RED_D}" stroke-width="0.8"/>` +
      `<text x="18.5" y="23.5" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-body),'Nunito',sans-serif;font-weight:800;font-size:9px;fill:${INK}">${n}</text>`
    );
  };
  // Quincunx cells: two up top, one in the middle, two below; tiny alternating
  // tilts (around each cell's centre) so the bugs feel alive, not gridded.
  const cells: Array<{ x: number; y: number; r: number }> = [
    { x: 3, y: 0, r: -4 },
    { x: 61, y: 0, r: 3 },
    { x: 32, y: 52, r: -2 },
    { x: 3, y: 104, r: 3 },
    { x: 61, y: 104, r: -4 },
  ];
  const bugs = cells
    .map((c, i) => `<g transform="translate(${c.x} ${c.y}) rotate(${c.r} 26 23)">${bug(LADYBUG_NUMBERS[i])}</g>`)
    .join("");
  return `<svg viewBox="0 0 116 150" aria-hidden="true">${bugs}</svg>`;
}

/** The ladybug draw-the-dots leaf. */
function ladybugDotsLeaf(footer: string, pageNo: number): string {
  return `<section class="leaf"><div class="npg">
    <div class="npg-instruction">Nacrtaj točkice na praznom krilu!</div>
    <div class="npg-scene">${ladybugDotsSvg()}</div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

/** Single-leaf test build: just the ladybug draw-the-dots page. */
export function buildLadybugTestLeaves(childName = "Ema"): string[] {
  const footer = `moji prvi brojevi · ${(childName || "Ema").toUpperCase()}`;
  return [tagLeaf(ladybugDotsLeaf(footer, 1), "ladybug-dots-test")];
}

// v2 is 1–10 (not 0–9), so the diploma line needs its own wording; everything
// else (cover/posveta/name/diploma chrome) is shared with NUMBER_STRINGS.
const NUMBER_STRINGS_V2 = {
  ...NUMBER_STRINGS,
  diplomaBody: (gender?: "boy" | "girl"): string =>
    `Naučil${gender === "boy" ? "o" : "a"} si brojeve od 1 do 10.`,
};

/**
 * Full numbers-v2 booklet: cover → posveta → 1–10 (word+face+trace+counted
 * objects leaf) → diploma. Reuses NUMBERS_V2 (lib/numbers-v2.ts) and the same
 * keepsake leaves (cover/posveta/diploma) as buildNumbersPrintLeaves — only
 * the digit page itself is the new design. Does NOT touch lib/numbers.ts or
 * buildNumbersPrintLeaves above — the simpler 0–9 product still in use.
 */
export function buildNumbersV2PrintLeaves(opts: PrintOpts = {}): string[] {
  const s = NUMBER_STRINGS_V2;
  const name = (opts.childName || "").trim() || "Ema";
  const surname = (opts.childSurname || "").trim();
  const fullName = [name, surname].filter(Boolean).join(" ");

  const footer = `${s.subtitle} · ${name.toUpperCase()}`;
  const leaves: string[] = [];
  leaves.push(tagLeaf(coverLeaf(name, opts.possessive || "", s.subtitle, s.blockWord, s.prvaWord, s.madeWith), "cover"));
  leaves.push(tagLeaf(posvetaLeaf(opts.posveta || s.posvetaFallback(name, opts.gender)), "posveta"));
  NUMBERS_V2.forEach((entry, i) => {
    leaves.push(tagLeaf(numberSimpleLeaf(entry.digit, entry.word, footer, i + 1), `number-${entry.digit}`));
  });
  // Grammar elsewhere (posveta, diploma) already defaults to the feminine form.
  let activityPage = NUMBERS_V2.length + 1;
  const shirts = missingNumbersLeaf(opts.gender ?? "girl", footer, activityPage);
  if (shirts) {
    leaves.push(tagLeaf(shirts, "missing-numbers"));
    activityPage++;
  }
  const kite = connectDotsKiteLeaf(footer, activityPage);
  if (kite) {
    leaves.push(tagLeaf(kite, "kite-dots"));
    activityPage++;
  }
  leaves.push(tagLeaf(numberTasksLeaf(footer, activityPage), "numbers-tasks"));
  activityPage++;
  const zoo = zooCountLeaf(footer, activityPage);
  if (zoo) {
    leaves.push(tagLeaf(zoo, "zoo-count"));
    activityPage++;
  }
  leaves.push(tagLeaf(ladybugDotsLeaf(footer, activityPage), "ladybug-dots"));
  activityPage++;
  // The colour-by-number balloon closes the activity arc — the big colouring
  // reward right before the diploma.
  leaves.push(tagLeaf(colourByNumberLeaf(footer, activityPage), "colour-by-number"));
  activityPage++;
  leaves.push(tagLeaf(diplomaLeaf(fullName, s.diplomaTitle, s.diplomaIntro, s.diplomaBody(opts.gender), opts.gender, s.diplomaCheer), "diploma"));
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
    font-family: var(--font-baloo), 'Baloo 2', sans-serif; font-weight: 800;
    font-size: 19mm; line-height: 1; color: #fff;
    -webkit-text-stroke: 0.75mm ${INK}; paint-order: stroke fill;
  }
  /* Digraphs (Lj, Dž, Nj) are two glyphs — render a touch smaller to balance. */
  .lp-letter--dg { font-size: 14mm; -webkit-text-stroke-width: 0.6mm; }
  .lp-con { font-family: var(--font-hand), 'Caveat', cursive; font-weight: 700; font-size: 11mm; line-height: 1; color: ${INK}; }
  /* The word is HOLLOW too, so the child can colour it in (like the big letter). */
  .lp-word {
    font-family: var(--font-baloo), 'Baloo 2', sans-serif; font-weight: 800;
    font-size: 19mm; line-height: 1; letter-spacing: 0.3mm;
    color: #fff; -webkit-text-stroke: 0.7mm ${INK}; paint-order: stroke fill;
  }
  /* Pictures fill the leaf as large as possible: width capped at 100mm, height
     bounded to the picture box itself (max-height:100%) so a tall, narrow figure
     (e.g. the Indijanac) is never clipped top/bottom by the overflow:hidden — it
     just grows to the full available height instead. Wide art is held to 100mm. */
  .lp-pic { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; margin: 3mm 0; overflow: hidden; }
  .lp-pic img, .lp-pic svg { max-width: 100mm; max-height: 100%; width: auto; height: auto; object-fit: contain; }
  /* Numbers v2 prototype: word left-aligned. */
  .lp-head--left { justify-content: flex-start; }
  /* Missing-numbers shirts leaf: the colour scene bleeds past the text column
     (10mm side inset instead of 16mm) so the shirts print as big as possible. */
  .lp-pic--wide { margin-left: -6mm; margin-right: -6mm; }
  .lp-pic--wide img { max-width: 100%; }
  .lp-hand { width: 100%; }
  /* Number leaf: the counted picture — N icons tiled in a centred grid. */
  .lp-count { display: grid; place-content: center; justify-content: center; margin: 0 auto; }
  .lp-cell { display: grid; place-items: center; }
  .lp-count svg, .lp-count img { width: 100%; height: auto; max-height: 100%; }
  .lp-foot { margin-top: 3mm; text-align: center; font-family: var(--font-body), 'Nunito', sans-serif; font-weight: 700; font-size: 3mm; letter-spacing: 1.4mm; text-transform: uppercase; color: ${MUTED}; }

  /* Numbers v2 prototype: "Igram se s brojem" (page 2 per digit) */
  .npg { flex: 1; display: flex; flex-direction: column; padding: 16mm 16mm 14mm; }
  .npg-eyebrow { font-family: var(--font-body), 'Nunito', sans-serif; font-weight: 800; font-size: 4mm; letter-spacing: 1.2mm; text-transform: uppercase; color: ${MUTED}; text-align: center; }
  .npg-activity { margin-top: 14mm; display: flex; flex-direction: column; align-items: center; }
  .npg-instruction { font-family: var(--font-baloo), 'Baloo 2', sans-serif; font-weight: 700; font-size: 7mm; color: ${INK_SOFT}; text-align: center; }
  .npg-digits { margin-top: 8mm; display: flex; gap: 7mm; }
  .npg-digit {
    font-family: var(--font-baloo), 'Baloo 2', sans-serif; font-weight: 800; font-size: 16mm;
    line-height: 1; color: #fff; -webkit-text-stroke: 0.7mm ${INK}; paint-order: stroke fill;
  }
  .npg-count-row { margin-top: 8mm; display: flex; gap: 8mm; justify-content: center; }
  .npg-count-cell { width: 24mm; height: 24mm; }
  .npg-count-cell svg, .npg-count-cell img { width: 100%; height: 100%; }
  .npg-answer-box {
    margin-top: 7mm; width: 22mm; height: 22mm; border: 0.7mm solid ${INK}; border-radius: 4mm;
  }
  /* Numbers v2 prototype: dice + cube-stack tasks page. The two pair rows share
     the same 6-column grid so each die lines up over a number; the gap between
     them is the drawing room for the connecting lines. */
  .npg-activity--tight { margin-top: 15mm; }
  /* The tasks page has no eyebrow — pull the first task up to the top padding,
     leaving the gap between the two tasks untouched. */
  .npg-activity--tight:first-child { margin-top: 0; }
  .npg-pair-row { margin-top: 7mm; width: 100%; display: grid; grid-template-columns: repeat(6, 1fr); justify-items: center; align-items: center; }
  .npg-pair-row--nums { margin-top: 16mm; }
  /* Plain solid digits (not the hollow colour-in ones) to match the dice with. */
  .npg-num { font-family: var(--font-body), 'Nunito', sans-serif; font-weight: 700; font-size: 12mm; line-height: 1; color: ${INK}; }
  .npg-die { width: 13mm; height: 13mm; }
  .npg-die svg { width: 100%; height: 100%; }
  .npg-stacks { margin-top: 7mm; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 2mm; }
  .npg-stack { display: flex; flex-direction: column; align-items: center; gap: 4mm; }
  .npg-stack svg { display: block; }
  .npg-stack-box { width: 12mm; height: 12mm; border: 0.6mm solid ${INK}; border-radius: 3mm; }
  /* Connect-the-dots kite page: one SVG scene fills the leaf under the instruction. */
  .npg-scene { flex: 1; min-height: 0; margin-top: 4mm; display: flex; justify-content: center; }
  .npg-scene svg { width: 100%; height: 100%; }
  /* Count-the-zoo-animals page: the colour scene fills the free height, the
     count row beneath pairs each small animal icon with a write-in box. */
  .npg-zoo-scene { flex: 1; min-height: 0; margin-top: 5mm; display: flex; align-items: flex-start; justify-content: center; overflow: hidden; }
  .npg-zoo-scene img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
  .npg-zoo-row { margin-top: 6mm; margin-bottom: 9mm; width: 100%; display: grid; grid-template-columns: repeat(4, 1fr); justify-items: center; }
  .npg-zoo-cell { display: flex; align-items: center; gap: 3mm; }
  .npg-zoo-cell img { height: 12mm; width: auto; max-width: 20mm; object-fit: contain; }
  /* Colour-by-number page: the legend row of 10 printed swatches, each with a
     white number badge readable on any swatch colour. */
  .cbn-legend { margin-top: 6mm; display: flex; justify-content: center; gap: 2.4mm; }
  .cbn-swatch { width: 8.8mm; height: 8.8mm; border-radius: 2.2mm; border: 0.45mm solid ${INK}; display: grid; place-items: center; }
  .cbn-badge {
    width: 5.8mm; height: 5.8mm; border-radius: 50%; background: #fff; border: 0.3mm solid ${INK};
    display: grid; place-items: center;
    font-family: var(--font-body), 'Nunito', sans-serif; font-weight: 800; font-size: 3.2mm; color: ${INK};
  }
  /* Pin the footer to the bottom of the tasks page whatever the content height. */
  .npg .lp-foot { margin-top: auto; padding-top: 3mm; }
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
    font-family: var(--font-baloo), 'Baloo 2', sans-serif; font-weight: 800;
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

  /* Maze book: one maze fills the free height, centred. Sized in mm by the
     builder; max-* only guards against overflow on extreme aspect ratios. */
  .mz-scene { flex: 1; min-height: 0; margin-top: 5mm; display: flex; align-items: center; justify-content: center; }
  .mz-scene svg { max-width: 100%; max-height: 100%; }

  /* Sudoku book */
  .npg-eyebrow + .npg-instruction { margin-top: 2.5mm; }
  .sud-grid { flex: 1; min-height: 0; margin-top: 6mm; display: flex; align-items: center; justify-content: center; }
  .sud-grid svg { max-width: 100%; max-height: 100%; }
  /* Solutions pages: mini solved grids, two columns, filled top-down. */
  .sud-sols { flex: 1; min-height: 0; margin-top: 6mm; display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; justify-items: center; align-content: start; }
  .sud-sol { display: flex; flex-direction: column; align-items: center; gap: 1.2mm; }
  .sud-sol-label { font-family: var(--font-body), 'Nunito', sans-serif; font-weight: 700; font-size: 3.4mm; color: ${MUTED}; }

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
