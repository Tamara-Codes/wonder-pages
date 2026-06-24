/**
 * Server-side preview builder. Given a product + its personalization, returns
 * an ordered list of "pages" the customer can flip through before ordering —
 * a representative sample of the finished book, not all 40 pages.
 *
 * Three kinds of page art:
 *   • code games (maze/match-pairs/tracing/odd-one-out) — rendered live + themed
 *     via buildCodeGame (pure CPU, no AI), embedded as PNG data URIs;
 *   • coloring — representative sample images (the catalog isn't seeded yet);
 *   • alphabet — built as inline-styled HTML using the icon line art (so we
 *     don't pull react-dom/server into the route graph).
 *
 * Cover + dedication text is passed in already-localized by the caller, so this
 * module stays language-agnostic.
 */
import { buildCodeGame, type CodeGameId } from "./page-build";
import { THEME_MAP, type ThemeId } from "./themes";
import { ageToDifficulty } from "./booklet";
import { ALPHABETS, type LanguageId } from "./alphabet";
import { NUMBERS, type NumberEntry } from "./numbers";
import { iconLineArt } from "./icons-line";
import { existsSync } from "fs";
import { join } from "path";

export type PreviewPage = { labelKey: string } & (
  | { kind: "img"; src: string }
  | { kind: "html"; html: string }
);

export interface PreviewOpts {
  childName?: string;
  childSurname?: string; // alphabet: shown on the diploma leaf
  gender?: "boy" | "girl"; // alphabet: diploma wording + colours
  theme?: ThemeId;
  age?: number;
  language?: LanguageId;
  /** Already-localized strings from the caller (so this file stays neutral). */
  coverActivity?: string;
  coverAlphabet?: string;
  coverNumbers?: string; // numbers keepsake: subtitle on the personalized front leaf
  dedication?: string; // may contain {name}
  /** Per-page alphabet footer, e.g. "made with love by {name}" (pre-localized). */
  alphabetByline?: string; // may contain {name}
  // ── alphabet keepsake leaves (all strings pre-localized by the caller) ──
  posveta?: string; // the parent's free-written dedication
  nameLeafLabel?: string; // label on the name leaf, e.g. "Moje ime"
  diplomaTitle?: string; // e.g. "Diploma"
  diplomaIntro?: string; // small line above the name, e.g. "dodjeljuje se"
  diplomaBody?: string; // congratulation line below the name
}

const CODE_GAMES: CodeGameId[] = ["maze", "match-pairs", "tracing", "odd-one-out"];
const ALPHA_ACCENT = "#000000"; // black
const ART_DIR = join(process.cwd(), "public", "icons-art");

// Column count for the tiled "count" picture (N things to colour) so each
// number lays out tidily: 3 → one row, 9 → a 3×3 grid.
const COUNT_COLS: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 3 };

/**
 * A generated colour-in illustration for a key, if one exists at
 * public/icons-art/<key>.png. Drop a PNG there and that letter's picture is
 * upgraded automatically — no code change. Until then we fall back to the emoji
 * line art. The file name MUST equal the entry's iconKey (e.g. airplane.png).
 */
function artImageSrc(key: string): string | null {
  return existsSync(join(ART_DIR, `${key}.png`)) ? `/icons-art/${key}.png` : null;
}

// Representative coloring art per theme (catalog not seeded yet — samples only).
const COLORING_SAMPLE: Partial<Record<ThemeId, string[]>> = {
  unicorns: ["/examples/unicorns-coloring.png"],
  dinosaurs: ["/examples/dinosaurs-coloring.png"],
  princess: ["/princess-coloring.png"],
};
function coloringSamples(theme: ThemeId): string[] {
  return COLORING_SAMPLE[theme] ?? ["/examples/unicorns-coloring.png", "/princess-coloring.png"];
}

async function codeGameImg(type: CodeGameId, theme: ThemeId, age: number): Promise<string> {
  const { png } = await buildCodeGame(type, theme, ageToDifficulty(age));
  return `data:image/png;base64,${png.toString("base64")}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** A simple printed-cover panel (inline styles, so it needs no Tailwind/CSS). */
function coverHtml(title: string, accent: string, tint: string, emoji: string): string {
  return `<div style="aspect-ratio:210/297;background:${accent};border-radius:18px;padding:14px;display:flex;">
    <div style="flex:1;background:${tint};border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:22px;">
      <div style="font-size:78px;line-height:1;">${emoji}</div>
      <div style="font-family:'Baloo 2',system-ui,sans-serif;font-weight:800;font-size:23px;color:#2B2440;line-height:1.15;">${escapeHtml(title)}</div>
    </div>
  </div>`;
}

function dedicationHtml(text: string): string {
  return `<div style="aspect-ratio:210/297;background:#fff;border:1px solid #EFE7DA;border-radius:18px;display:flex;align-items:center;justify-content:center;padding:30px;text-align:center;">
    <div style="font-family:'Baloo 2',system-ui,sans-serif;font-weight:800;font-size:22px;color:#2B2440;line-height:1.3;">${escapeHtml(text)}</div>
  </div>`;
}

/**
 * Two rows of primary-school handwriting ruling (top line, dashed midline,
 * baseline) so the child practises writing the letter: the first row is seeded
 * with light "ghost" letters to trace, the second is blank to write freely.
 */
function handwritingSvg(glyph: string, accent: string): string {
  const W = 400;
  const count = glyph.length > 1 ? 4 : 6; // digraphs (Dž, Lj, Nj) get fewer, wider
  const slot = (W - 24) / count;
  const ghosts = Array.from({ length: count }, (_, i) =>
    `<text x="${24 + slot * (i + 0.5)}" y="46" text-anchor="middle" style="font-family:'Baloo 2',sans-serif;font-size:34px;font-weight:700;fill:${accent};fill-opacity:.3">${escapeHtml(glyph)}</text>`,
  ).join("");
  const rule = (top: number) =>
    `<line x1="6" y1="${top}" x2="${W - 6}" y2="${top}" stroke="${accent}" stroke-width="1.5" stroke-opacity=".4"/>
     <line x1="6" y1="${top + 20}" x2="${W - 6}" y2="${top + 20}" stroke="${accent}" stroke-width="1.5" stroke-opacity=".35" stroke-dasharray="6 7"/>
     <line x1="6" y1="${top + 40}" x2="${W - 6}" y2="${top + 40}" stroke="${accent}" stroke-width="2" stroke-opacity=".7"/>`;
  return `<svg viewBox="0 0 400 108" style="width:96%" aria-hidden="true">${rule(8)}${ghosts}${rule(60)}</svg>`;
}

/** One rounded "alphabet block" (A/B/C) for the cover. */
function abcBlock(ch: string, bg: string, fg: string, rot: number): string {
  return `<span style="display:inline-grid;place-items:center;width:54px;height:54px;border-radius:14px;background:${bg};color:${fg};font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:34px;transform:rotate(${rot}deg);box-shadow:0 4px 0 rgba(43,36,64,.14);">${ch}</span>`;
}

/** A whole word in big SOLID letters; long names fill the leaf width. */
function solidWordSvg(text: string, color: string): string {
  const len = Math.max(text.length, 1);
  const MAX = 96;
  const TARGET = 384;
  const fs = Math.min(MAX, Math.round(TARGET / (0.6 * len)));
  const fit = len >= 7 ? ` textLength="${TARGET}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<svg viewBox="0 0 400 124" style="width:100%" aria-hidden="true">
    <text x="200" y="90" text-anchor="middle"${fit} style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:${fs}px;fill:${color};">${escapeHtml(text)}</text>
  </svg>`;
}

/**
 * The personalized cover / box lid: playful A-B-C alphabet blocks, the child's
 * name large in the gender colour (boy blue, girl pink), and a short subtitle.
 * Confetti Pop, matching the rest of the set.
 */
function alphabetCoverHtml(name: string, subtitle: string, gender?: "boy" | "girl"): string {
  const accent = gender === "boy" ? BLUE_D : PINK_D;
  const abc = `<div style="display:flex;gap:9px;justify-content:center;">
    ${abcBlock("A", PINK, "#fff", -6)}
    ${abcBlock("B", YELLOW, INK, 4)}
    ${abcBlock("C", TEAL, "#fff", -3)}
  </div>`;
  return popCard(
    `${abc}
     ${solidWordSvg(name, accent)}
     <div style="font-family:var(--font-hand),'Caveat',cursive;font-size:26px;color:${accent};line-height:1.1;">${escapeHtml(subtitle)}</div>`,
    16,
  );
}

/**
 * One "G is for Guitar" page as inline-styled HTML — three things to colour,
 * top to bottom: the big hollow letter + connective, the picture, and the whole
 * word in big hollow letters. A small "made with love by {name}" footer makes
 * every page personal (the gift hook). No handwriting ruling — letter tracing
 * lives on its own page in the activity book, so it isn't duplicated here.
 */
function alphabetPageHtml(
  letter: string,
  iconKey: string,
  connective: string,
): string {
  const accent = ALPHA_ACCENT;
  // Prefer a generated colour-in illustration; fall back to emoji line art.
  const src = artImageSrc(iconKey);
  const picture = src
    ? `<div style="flex:1;width:100%;min-height:0;display:grid;place-items:center;margin:2px 0;"><img src="${src}" alt="" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain"/></div>`
    : `<div style="flex:1;width:80%;min-height:0;display:grid;place-items:center;margin:2px 0;">${iconLineArt(iconKey, accent).replace("<svg", '<svg style="max-width:100%;max-height:100%;height:auto;width:auto"')}</div>`;
  return `<div style="aspect-ratio:210/297;background:#fff;border:1px solid #EFE7DA;border-radius:18px;padding:16px 22px 14px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;">
    <div style="display:flex;align-items:baseline;justify-content:center;gap:9px;">
      <span style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:56px;line-height:1;color:#fff;-webkit-text-stroke:5px ${accent};paint-order:stroke fill;">${escapeHtml(letter)}</span>
      <span style="font-family:var(--font-hand),'Caveat',cursive;font-weight:700;font-size:31px;line-height:1;color:${accent};">${escapeHtml(connective)}</span>
    </div>
    ${picture}
    ${handwritingSvg(letter, accent)}
  </div>`;
}

// ── "Confetti Pop" leaf design system, shared by the posveta / name / diploma
// leaves (matches the app + sister app: solid colours, no gradients, flat
// offset "sticker" shadows, vibrant + toy-like). Tokens mirror globals.css.
// The A–Ž letter pages keep their plain look — they're line art to colour in.
const INK = "#2b2440";
const MUTED = "#7a7392";
const PINK = "#ff5ca8";
const PINK_D = "#d63f86";
const YELLOW = "#ffc93c";
const TEAL = "#21c7b6";
const PURPLE = "#8a6cff";
const BLUE = "#3da5ff";
const BLUE_D = "#2f7fd0";

const ICON_STAR = `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#fff"/></svg>`;

// A prize rosette: gold medal, white star, two ribbon tails in the leaf's
// colours (so the diploma can read girlish/boyish per the chosen gender).
function rosette(c1: string, c2: string): string {
  return `<svg width="74" height="90" viewBox="0 0 74 90" aria-hidden="true">
    <path d="M27 52 L20 86 L33 76 L37 54 Z" fill="${c1}"/>
    <path d="M47 52 L54 86 L41 76 L37 54 Z" fill="${c2}"/>
    <circle cx="37" cy="34" r="28" fill="${YELLOW}" stroke="#fff" stroke-width="4"/>
    <path transform="translate(37 34) scale(1.25) translate(-12 -12)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#fff"/>
  </svg>`;
}

// A single dot divider, in the leaf's colour.
function dot(color: string): string {
  return `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="${color}"/></svg>`;
}

/** A rounded-square sticker tile with a white icon — the app's `.tile` motif. */
function tile(bg: string, icon: string): string {
  return `<div style="width:56px;height:56px;border-radius:18px;background:${bg};display:grid;place-items:center;box-shadow:0 4px 0 rgba(43,36,64,.12);">${icon}</div>`;
}

/** A bold Baloo display heading in a brand colour. */
function popHeading(
  text: string,
  color: string,
  opts: { size?: number; spacing?: number; upper?: boolean } = {},
): string {
  const upper = opts.upper ? "text-transform:uppercase;" : "";
  return `<div style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:${opts.size ?? 22}px;letter-spacing:${opts.spacing ?? 0}px;${upper}color:${color};line-height:1.1;">${escapeHtml(text)}</div>`;
}

// Scattered confetti behind the content — dots + little rotated squares, spread
// over the whole leaf (denser than a tidy border, but biased away from the
// centred text so it reads as decoration, not clutter).
function confetti(): string {
  const c = (color: string, pos: string, s: number) =>
    `<span style="position:absolute;${pos};width:${s}px;height:${s}px;border-radius:50%;background:${color};"></span>`;
  const sq = (color: string, pos: string, s: number) =>
    `<span style="position:absolute;${pos};width:${s}px;height:${s}px;border-radius:2px;background:${color};transform:rotate(22deg);"></span>`;
  return [
    // top band
    c(PINK, "left:22px;top:26px", 11),
    sq(YELLOW, "right:28px;top:30px", 10),
    c(TEAL, "left:46%;top:20px", 6),
    c(PURPLE, "right:70px;top:60px", 7),
    sq(PINK, "left:36px;top:72px", 7),
    // mid — hug the sides so the text stays clear
    c(YELLOW, "left:18px;top:40%", 9),
    c(TEAL, "right:18px;top:36%", 7),
    sq(PURPLE, "left:24px;top:56%", 7),
    c(PINK, "right:22px;top:54%", 8),
    c(YELLOW, "right:26px;top:70%", 6),
    c(TEAL, "left:30px;top:72%", 7),
    // bottom band
    c(PURPLE, "left:30px;bottom:30px", 10),
    sq(TEAL, "right:32px;bottom:34px", 8),
    c(PINK, "left:48%;bottom:22px", 7),
    c(YELLOW, "right:72px;bottom:58px", 6),
    sq(PINK, "left:64px;bottom:64px", 6),
  ].join("");
}

/**
 * The shared card: white sticker on the page, confetti behind the content.
 * `justify` controls vertical distribution — "center" (default) for the posveta
 * and diploma; "space-between" for the name leaf (title up top, lines at bottom).
 */
function popCard(content: string, gap = 18, justify = "center"): string {
  return `<div style="aspect-ratio:210/297;background:#fff;border-radius:24px;padding:32px 26px;position:relative;overflow:hidden;box-shadow:0 6px 0 rgba(43,36,64,.08);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
    ${confetti()}
    <div style="position:relative;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:${justify};gap:${gap}px;width:100%;">${content}</div>
  </div>`;
}

/**
 * A whole word in big HOLLOW letters to colour in. Short names get a big capped
 * size; longer names snap to a target width (textLength) so a long name like
 * "Magdalena" reads just as large across the leaf as a short one like "Ema".
 */
function hollowWordSvg(text: string, accent: string): string {
  const len = Math.max(text.length, 1);
  const MAX = 108; // cap so short names don't get absurdly tall
  const TARGET = 384; // width to fill within the 400 viewBox
  const fs = Math.min(MAX, Math.round(TARGET / (0.6 * len)));
  // Names long enough to reach the target width get pinned to it (fill the leaf).
  const fit = len >= 7 ? ` textLength="${TARGET}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<svg viewBox="0 0 400 130" style="width:100%" aria-hidden="true">
    <text x="200" y="92" text-anchor="middle"${fit} style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:${fs}px;fill:#fff;stroke:${accent};stroke-width:5;stroke-linejoin:round;paint-order:stroke;">${escapeHtml(text)}</text>
  </svg>`;
}

/**
 * The trace + write rows: two sets of school ruling (top line, dashed midline,
 * baseline). The first row ghosts the name to trace; the second is blank to
 * write it. The ghost is sized to the ruling so a CAPITAL spans the full row
 * (top line → baseline) and is the SAME height for every name — a name too long
 * to fit condenses horizontally instead of shrinking the letters.
 */
function wordTraceSvg(text: string, accent: string): string {
  const W = 400;
  const F = 60; // constant ghost size — caps span the whole row, any name
  const CAP = 43; // ~0.72em cap height (top line → baseline)
  const XH = 31; // ~0.52em x-height (sets the dashed midline)
  const GAP = 22; // space between the trace row and the write row
  const yt1 = 8, yb1 = yt1 + CAP, ym1 = yb1 - XH;
  const yt2 = yb1 + GAP, yb2 = yt2 + CAP, ym2 = yb2 - XH;
  const row = (yt: number, ym: number, yb: number) =>
    `<line x1="8" y1="${yt}" x2="${W - 8}" y2="${yt}" stroke="${accent}" stroke-width="1.5" stroke-opacity=".4"/>
     <line x1="8" y1="${ym}" x2="${W - 8}" y2="${ym}" stroke="${accent}" stroke-width="1.5" stroke-opacity=".35" stroke-dasharray="6 7"/>
     <line x1="8" y1="${yb}" x2="${W - 8}" y2="${yb}" stroke="${accent}" stroke-width="2" stroke-opacity=".75"/>`;
  const avail = W - 24;
  const natural = 0.6 * F * Math.max(text.length, 1);
  const fit = natural > avail ? ` textLength="${avail}" lengthAdjust="spacingAndGlyphs"` : "";
  const ghost = `<text x="${W / 2}" y="${yb1}" text-anchor="middle"${fit} style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:700;font-size:${F}px;fill:${accent};fill-opacity:.3">${escapeHtml(text)}</text>`;
  return `<svg viewBox="0 0 ${W} ${yb2 + 14}" style="width:100%" aria-hidden="true">${row(yt1, ym1, yb1)}${ghost}${row(yt2, ym2, yb2)}</svg>`;
}

/**
 * The "Moje ime" leaf: the child's first name big and hollow to colour, then
 * ruled lines to trace and write it. Auto-populated from the name they entered.
 */
function nameLeafHtml(name: string, label: string, gender?: "boy" | "girl"): string {
  // Match the diploma: boy reads blue, girl reads pink.
  const accent = gender === "boy" ? BLUE_D : PINK_D;
  const tileBg = gender === "boy" ? BLUE : PINK;
  return popCard(
    `<div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;">
       ${tile(tileBg, ICON_STAR)}
       ${popHeading(label, accent, { size: 18, spacing: 1, upper: true })}
       ${hollowWordSvg(name, accent)}
     </div>
     <div style="width:100%;">${wordTraceSvg(name, accent)}</div>`,
    16,
    "space-between",
  );
}

/**
 * Pick a comfortable size for the dedication by length — a short note reads big,
 * a long one shrinks to stay on the leaf. Keeps any message "displayed nicely".
 */
function posvetaFontSize(len: number): number {
  if (len <= 80) return 28;
  if (len <= 140) return 25;
  if (len <= 200) return 22;
  return 20;
}

/**
 * The "Posveta" leaf: the parent's free-written dedication, alone on a confetti
 * card — no icon, no heading. We KEEP the user's own line breaks (so a
 * salutation like "Draga Ema," and a sign-off like "Volimo te!" / "Mama i tata"
 * each stay on their own line), tidy any stray blank lines, then scale the text
 * to fit. The message is the whole leaf.
 */
function posvetaHtml(text: string): string {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const fs = posvetaFontSize(clean.length);
  return popCard(
    `<div style="font-family:var(--font-hand),'Caveat',cursive;font-size:${fs}px;color:${INK};line-height:1.5;white-space:pre-wrap;max-width:24ch;">${escapeHtml(clean)}</div>`,
    20,
  );
}

/**
 * The "Diploma" leaf: a little certificate carrying the child's FULL name
 * (name + surname). Auto-populated — this is where the surname now lives, since
 * the standalone prezime leaf was dropped.
 */
function diplomaHtml(
  fullName: string,
  title: string,
  intro: string,
  body: string,
  gender?: "boy" | "girl",
): string {
  // Boy reads blue + teal; girl reads pink + purple. Gold medal + rainbow
  // confetti stay the same for both.
  const p =
    gender === "boy"
      ? { head: BLUE_D, r1: BLUE, r2: TEAL, dot: BLUE_D }
      : { head: PINK_D, r1: PINK, r2: PURPLE, dot: PINK_D };
  const introLine = intro
    ? `<div style="font-family:var(--font-body),'Nunito',sans-serif;font-weight:700;font-size:15px;color:${MUTED};">${escapeHtml(intro)}</div>`
    : "";
  const bodyLine = body
    ? `<div style="font-family:var(--font-hand),'Caveat',cursive;font-size:23px;color:${INK};line-height:1.35;max-width:22ch;">${escapeHtml(body)}</div>`
    : "";
  return popCard(
    `${rosette(p.r1, p.r2)}
     ${popHeading(title, p.head, { size: 28, spacing: 2, upper: true })}
     ${introLine}
     ${popHeading(fullName, INK, { size: 26 })}
     ${dot(p.dot)}
     ${bodyLine}`,
    14,
  );
}

// ── Numbers keepsake ("Moji prvi brojevi") ─────────────────────────
/** An empty wicker basket to colour — the picture for 0 (nula). */
function emptyBasketSvg(ink: string): string {
  return `<svg viewBox="0 0 140 120" style="width:58%;height:auto" fill="#fff" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
 * copies of the fallback icon tiled in a grid (0 → an empty basket). */
function countPictureHtml(entry: NumberEntry): string {
  const accent = ALPHA_ACCENT;
  const src = artImageSrc(entry.artKey);
  if (src) {
    return `<div style="flex:1;width:100%;min-height:0;display:grid;place-items:center;margin:2px 0;"><img src="${src}" alt="" style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain"/></div>`;
  }
  if (entry.count === 0) {
    return `<div style="flex:1;width:100%;min-height:0;display:grid;place-items:center;margin:2px 0;">${emptyBasketSvg(accent)}</div>`;
  }
  const cols = COUNT_COLS[entry.count] ?? 3;
  const sz = entry.count <= 2 ? 92 : entry.count <= 4 ? 76 : entry.count <= 6 ? 60 : 48; // px per item
  const one = iconLineArt(entry.fallbackIcon, accent).replace("<svg", `<svg style="width:${sz}px;height:${sz}px"`);
  const cells = Array.from({ length: entry.count }, () => `<div style="display:grid;place-items:center;">${one}</div>`).join("");
  return `<div style="flex:1;min-height:0;width:100%;display:grid;grid-template-columns:repeat(${cols},auto);gap:8px;justify-content:center;align-content:center;margin:2px 0;">${cells}</div>`;
}

/**
 * One number leaf as inline-styled HTML — the big hollow numeral + its word, the
 * counted picture to colour, and the handwriting lines to trace the numeral.
 * Mirrors alphabetPageHtml so the preview reads the same as the alphabet.
 */
function numberPageHtml(entry: NumberEntry): string {
  const accent = ALPHA_ACCENT;
  return `<div style="aspect-ratio:210/297;background:#fff;border:1px solid #EFE7DA;border-radius:18px;padding:16px 22px 14px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;">
    <div style="display:flex;align-items:baseline;justify-content:center;gap:10px;">
      <span style="font-family:var(--font-display),'Baloo 2',sans-serif;font-weight:800;font-size:56px;line-height:1;color:#fff;-webkit-text-stroke:5px ${accent};paint-order:stroke fill;">${escapeHtml(entry.digit)}</span>
      <span style="font-family:var(--font-hand),'Caveat',cursive;font-weight:700;font-size:31px;line-height:1;color:${accent};">${escapeHtml(entry.word)}</span>
    </div>
    ${countPictureHtml(entry)}
    ${handwritingSvg(entry.digit, accent)}
  </div>`;
}

/** The numbers cover / box lid: playful 1-2-3 blocks + the child's name. */
function numberCoverHtml(name: string, subtitle: string, gender?: "boy" | "girl"): string {
  const accent = gender === "boy" ? BLUE_D : PINK_D;
  const blocks = `<div style="display:flex;gap:9px;justify-content:center;">
    ${abcBlock("1", PINK, "#fff", -6)}
    ${abcBlock("2", YELLOW, INK, 4)}
    ${abcBlock("3", TEAL, "#fff", -3)}
  </div>`;
  return popCard(
    `${blocks}
     ${solidWordSvg(name, accent)}
     <div style="font-family:var(--font-hand),'Caveat',cursive;font-size:26px;color:${accent};line-height:1.1;">${escapeHtml(subtitle)}</div>`,
    16,
  );
}

function numbersPages(opts: PreviewOpts): PreviewPage[] {
  const name = (opts.childName || "").trim();
  const surname = (opts.childSurname || "").trim();
  const fullName = [name, surname].filter(Boolean).join(" ") || name || "123";

  // A few sample numbers — prefer ones with finished scene art; otherwise show
  // 1·2·3 so the preview demonstrates the counting idea.
  const withArt = NUMBERS.filter((e) => artImageSrc(e.artKey));
  const sample = (withArt.length >= 2 ? withArt : NUMBERS.slice(1)).slice(0, 3);

  const pages: PreviewPage[] = [
    { labelKey: "cover", kind: "html", html: numberCoverHtml(name || "123", opts.coverNumbers || "moji brojevi", opts.gender) },
  ];
  pages.push({ labelKey: "posveta", kind: "html", html: posvetaHtml(opts.posveta || "") });
  pages.push({ labelKey: "name", kind: "html", html: nameLeafHtml(name || "123", opts.nameLeafLabel || "My name", opts.gender) });
  for (const entry of sample) {
    pages.push({ labelKey: "numbers", kind: "html", html: numberPageHtml(entry) });
  }
  pages.push({
    labelKey: "diploma",
    kind: "html",
    html: diplomaHtml(fullName, opts.diplomaTitle || "Diploma", opts.diplomaIntro || "", opts.diplomaBody || "", opts.gender),
  });
  return pages;
}

async function activityPages(opts: PreviewOpts): Promise<PreviewPage[]> {
  const theme = opts.theme ?? "unicorns";
  const age = opts.age ?? 5;
  const t = THEME_MAP[theme];
  const name = (opts.childName || "").trim();

  const pages: PreviewPage[] = [];
  pages.push({ labelKey: "cover", kind: "html", html: coverHtml(opts.coverActivity || "Activity Book", t.color, t.tint, t.emoji) });
  if (opts.dedication) {
    pages.push({ labelKey: "dedication", kind: "html", html: dedicationHtml(opts.dedication.replace("{name}", name || "—")) });
  }
  const imgs = await Promise.all(CODE_GAMES.map((g) => codeGameImg(g, theme, age)));
  CODE_GAMES.forEach((g, i) => pages.push({ labelKey: g, kind: "img", src: imgs[i] }));
  for (const src of coloringSamples(theme)) pages.push({ labelKey: "coloring", kind: "img", src });
  return pages;
}

function alphabetPages(opts: PreviewOpts): PreviewPage[] {
  const lang: LanguageId = opts.language ?? "hr";
  const alpha = ALPHABETS[lang];

  const name = (opts.childName || "").trim();
  const surname = (opts.childSurname || "").trim();
  const fullName = [name, surname].filter(Boolean).join(" ") || name || "ABC";

  // A few sample letters — prefer ones that already have a generated
  // illustration so the preview showcases finished pages.
  const withArt = alpha.letters.filter((e) => artImageSrc(e.iconKey));
  const sample = (withArt.length >= 2 ? withArt : alpha.letters).slice(0, 3);

  // The keepsake arc: cover → posveta → name → letters → diploma.
  const pages: PreviewPage[] = [
    { labelKey: "cover", kind: "html", html: alphabetCoverHtml(name || "ABC", opts.coverAlphabet || "my alphabet", opts.gender) },
  ];

  pages.push({
    labelKey: "posveta",
    kind: "html",
    html: posvetaHtml(opts.posveta || ""),
  });

  pages.push({
    labelKey: "name",
    kind: "html",
    html: nameLeafHtml(name || "ABC", opts.nameLeafLabel || "My name", opts.gender),
  });

  for (const entry of sample) {
    pages.push({ labelKey: "alphabet", kind: "html", html: alphabetPageHtml(entry.letter, entry.iconKey, alpha.connective) });
  }

  pages.push({
    labelKey: "diploma",
    kind: "html",
    html: diplomaHtml(
      fullName,
      opts.diplomaTitle || "Diploma",
      opts.diplomaIntro || "",
      opts.diplomaBody || "",
      opts.gender,
    ),
  });

  return pages;
}

export async function buildPreview(
  product: "activity" | "alphabet" | "numbers" | "bundle",
  opts: PreviewOpts,
): Promise<PreviewPage[]> {
  if (product === "activity") return activityPages(opts);
  if (product === "alphabet") return alphabetPages(opts);
  if (product === "numbers") return numbersPages(opts);
  // bundle = both keepsakes (alphabet + numbers) — show both sets in the box.
  return [...alphabetPages(opts), ...numbersPages(opts)];
}
