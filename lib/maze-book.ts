/**
 * "Moji labirinti" — the maze book. Pure code (lib/maze.ts recursive
 * backtracker), personalized by name + gender + AGE: the buyer gives the
 * child's age (4–10) and the whole book is tuned to it, ramping from a bit
 * below that level on page 1 to a bit above it on the last page, so the child
 * gets early wins and grows into the end of the book.
 *
 * Mazes are seeded from name+age+page (lib/seeded-rng.ts), so one order
 * renders identically on every pass while different orders differ.
 *
 * Keepsake arc mirrors the other booklets: cover → posveta → mazes → diploma.
 */
import { generateMaze, mazeWalls, cellCenter, type MazeAnswer } from "./maze";
import { seededRng } from "./seeded-rng";
import {
  tagLeaf,
  coverLeaf,
  posvetaLeaf,
  diplomaLeaf,
  escapeHtml,
  PRINT_COLORS,
  type PrintOpts,
} from "./print-build";

const { INK, TEAL_D, PINK, PINK_D } = PRINT_COLORS;

export const MAZE_AGE_MIN = 4;
export const MAZE_AGE_MAX = 10;
const MAZE_COUNT = 24;

const STRINGS = {
  subtitle: "moji labirinti",
  blockWord: "LABIRINTI",
  prvaWord: "prvi",
  madeWith: "napravljeno s ljubavlju",
  instruction: "Pronađi put do srca!",
  diplomaTitle: "Diploma",
  diplomaIntro: "",
  diplomaBody: (gender?: "boy" | "girl"): string =>
    gender === "boy"
      ? "Prošao si sve labirinte i pronašao put do svakog cilja."
      : "Prošla si sve labirinte i pronašla put do svakog cilja.",
  diplomaCheer: "Bravo!",
  posvetaFallback: (name: string, gender?: "boy" | "girl"): string =>
    `${gender === "boy" ? "Dragi" : "Draga"} ${name},\n\n` +
    "pred tobom je knjižica puna zavrzlama — od sasvim laganih do pravih " +
    "izazova. Neka te svaki labirint nauči da se do cilja uvijek stigne: " +
    "korak po korak, bez žurbe.\n\n" +
    "Sretan rođendan!\nS puno ljubavi, mama i tata",
};

/**
 * Grid size for maze number `i` (0-based) of MAZE_COUNT, for a child of `age`.
 * Start ≈ a touch below the age level, end ≈ a touch above it:
 *   age 4 → 6×8 … 10×13    age 7 → 9×11 … 16×20    age 10 → 12×15 … 22×28
 */
function mazeGridFor(age: number, i: number): { cols: number; rows: number } {
  const t = MAZE_COUNT > 1 ? i / (MAZE_COUNT - 1) : 0;
  const start = age + 2;
  const end = 2 * age + 2;
  const cols = Math.round(start + (end - start) * t);
  const rows = Math.round(cols * 1.25);
  return { cols, rows };
}

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

/**
 * The maze as one SVG sized in mm: ink walls, a teal arrow dropping into the
 * entrance (top-left opening), a pink arrow leaving the exit (bottom-right
 * opening) and a pink heart in the goal cell. Wall thickness scales with the
 * cell so small kids get chunky corridors and big grids stay crisp.
 */
function mazeSceneSvg(maze: MazeAnswer): string {
  const { cols, rows } = maze;
  const cell = Math.min(112 / cols, 144 / rows); // mm per cell
  const w = cols * cell;
  const h = rows * cell;
  const sw = Math.min(1.3, Math.max(0.55, cell * 0.13));

  const walls = mazeWalls(maze)
    .map(
      (s) =>
        `<line x1="${(s.x1 * cell).toFixed(2)}" y1="${(s.y1 * cell).toFixed(2)}" x2="${(s.x2 * cell).toFixed(2)}" y2="${(s.y2 * cell).toFixed(2)}"/>`,
    )
    .join("");

  // Entrance arrow (teal, pointing down INTO the maze) over the top opening.
  const ax = cell / 2;
  const enter =
    `<g fill="none" stroke="${TEAL_D}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">` +
    `<line x1="${ax.toFixed(2)}" y1="-5" x2="${ax.toFixed(2)}" y2="-1.8"/>` +
    `<path d="M${(ax - 1.5).toFixed(2)} -3.4 L${ax.toFixed(2)} -1.5 L${(ax + 1.5).toFixed(2)} -3.4"/></g>`;
  // Exit arrow (pink, pointing down OUT of the maze) under the bottom opening.
  const ex = w - cell / 2;
  const exit =
    `<g fill="none" stroke="${PINK_D}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">` +
    `<line x1="${ex.toFixed(2)}" y1="${(h + 1.8).toFixed(2)}" x2="${ex.toFixed(2)}" y2="${(h + 5).toFixed(2)}"/>` +
    `<path d="M${(ex - 1.5).toFixed(2)} ${(h + 3.1).toFixed(2)} L${ex.toFixed(2)} ${(h + 5).toFixed(2)} L${(ex + 1.5).toFixed(2)} ${(h + 3.1).toFixed(2)}"/></g>`;

  // The goal heart, centred in the exit cell.
  const g = cellCenter(maze, cols * rows - 1);
  const hs = Math.max(3.2, cell * 0.62);
  const heart = `<g transform="translate(${(g.x * cell - hs / 2).toFixed(2)} ${(g.y * cell - hs / 2).toFixed(2)}) scale(${(hs / 24).toFixed(3)})"><path d="${HEART_PATH}" fill="${PINK}"/></g>`;

  const m = 2; // side margin for the stroke caps
  return `<svg viewBox="${-m} -7 ${(w + 2 * m).toFixed(2)} ${(h + 14).toFixed(2)}" width="${(w + 2 * m).toFixed(1)}mm" height="${(h + 14).toFixed(1)}mm" aria-hidden="true">
    <g stroke="${INK}" stroke-width="${sw.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" fill="none">${walls}</g>
    ${enter}${exit}${heart}
  </svg>`;
}

function mazeLeaf(maze: MazeAnswer, footer: string, pageNo: number): string {
  return `<section class="leaf"><div class="npg">
    <div class="npg-eyebrow">LABIRINT ${pageNo}</div>
    <div class="npg-instruction">${escapeHtml(STRINGS.instruction)}</div>
    <div class="mz-scene">${mazeSceneSvg(maze)}</div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

/** Every leaf of the maze book, in print order, as HTML strings. */
export function buildMazeBookLeaves(opts: PrintOpts = {}): string[] {
  const s = STRINGS;
  const name = (opts.childName || "").trim() || "Ema";
  const surname = (opts.childSurname || "").trim();
  const fullName = [name, surname].filter(Boolean).join(" ");
  const age = Math.min(MAZE_AGE_MAX, Math.max(MAZE_AGE_MIN, Math.round(opts.age ?? 6)));

  const footer = `${s.subtitle} · ${name.toUpperCase()}`;
  const leaves: string[] = [];
  leaves.push(tagLeaf(coverLeaf(name, opts.possessive || "", s.subtitle, s.blockWord, s.prvaWord, s.madeWith), "cover"));
  leaves.push(tagLeaf(posvetaLeaf(opts.posveta || s.posvetaFallback(name, opts.gender)), "posveta"));
  for (let i = 0; i < MAZE_COUNT; i++) {
    const { cols, rows } = mazeGridFor(age, i);
    const maze = generateMaze(cols, rows, seededRng(`${name}|maze|${age}|${i}`));
    leaves.push(tagLeaf(mazeLeaf(maze, footer, i + 1), `maze-${i + 1}`));
  }
  leaves.push(
    tagLeaf(diplomaLeaf(fullName, s.diplomaTitle, s.diplomaIntro, s.diplomaBody(opts.gender), opts.gender, s.diplomaCheer), "diploma"),
  );
  return leaves;
}
