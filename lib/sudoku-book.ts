/**
 * "Moj sudoku" — the sudoku book. Pure code (lib/sudoku.ts), personalized by
 * name + gender + AGE (5–10): the age picks the grid sizes and the number of
 * givens, ramping easier → harder through the book.
 *
 *   age 5  → all 4×4                     age 8  → 6×6 into first 9×9s
 *   age 6  → 4×4 into first 6×6s         age 9  → 9×9, easy → medium
 *   age 7  → all 6×6                     age 10 → 9×9, medium → hard
 *
 * Arc: cover → posveta → how-to page → 20 puzzles → solutions → diploma.
 * Solutions print small at the back (dug digits in teal) so a parent can
 * check without solving. Puzzles are seeded from name+age+number, so one
 * order renders identically on every pass.
 */
import { generateSudoku, type Sudoku, type SudokuSize } from "./sudoku";
import { seededRng } from "./seeded-rng";
import {
  tagLeaf,
  coverLeaf,
  posvetaLeaf,
  diplomaLeaf,
  popCard,
  escapeHtml,
  PRINT_COLORS,
  type PrintOpts,
} from "./print-build";

const { INK, INK_SOFT, TEAL_D } = PRINT_COLORS;

export const SUDOKU_AGE_MIN = 5;
export const SUDOKU_AGE_MAX = 10;
const SUDOKU_COUNT = 20;
const SOLUTIONS_PER_PAGE = 6;

const STRINGS = {
  subtitle: "moj prvi sudoku",
  blockWord: "SUDOKU",
  prvaWord: "prvi",
  madeWith: "napravljeno s ljubavlju",
  howToTitle: "Kako se rješava?",
  rules: [
    "U svaki prazan kvadratić upiši jedan broj.",
    "U svakom retku svaki broj smije biti samo jednom.",
    "U svakom stupcu svaki broj smije biti samo jednom.",
    "U svakom okviru svaki broj smije biti samo jednom.",
    "Kreni od retka ili okvira u kojem već ima najviše brojeva — i piši olovkom!",
  ],
  solutionsTitle: "Rješenja",
  diplomaTitle: "Diploma",
  diplomaIntro: "",
  diplomaBody: (gender?: "boy" | "girl"): string =>
    gender === "boy"
      ? "Riješio si sve sudoku zagonetke, do posljednjeg broja."
      : "Riješila si sve sudoku zagonetke, do posljednjeg broja.",
  diplomaCheer: "Bravo!",
  posvetaFallback: (name: string, gender?: "boy" | "girl"): string =>
    `${gender === "boy" ? "Dragi" : "Draga"} ${name},\n\n` +
    "pred tobom je knjižica puna zagonetki s brojevima. Neka te svaka od njih " +
    "nauči ono najvažnije: svaka se zagonetka da riješiti kad je rješavaš " +
    "polako, red po red.\n\n" +
    "Sretan rođendan!\nS puno ljubavi, mama i tata",
};

/** One puzzle slot in the book's plan: which size, how many givens. */
interface Slot {
  size: SudokuSize;
  givens: number;
}

/** `count` slots of one size, givens easing linearly from → to. */
function segment(size: SudokuSize, from: number, to: number, count: number): Slot[] {
  return Array.from({ length: count }, (_, i) => ({
    size,
    givens: Math.round(from + ((to - from) * i) / Math.max(1, count - 1)),
  }));
}

/** The 20-puzzle difficulty plan for an age (clamped to the book's window). */
function sudokuPlan(age: number): Slot[] {
  switch (Math.min(SUDOKU_AGE_MAX, Math.max(SUDOKU_AGE_MIN, Math.round(age)))) {
    case 5: return segment(4, 10, 7, SUDOKU_COUNT);
    case 6: return [...segment(4, 9, 6, 14), ...segment(6, 27, 24, 6)];
    case 7: return segment(6, 27, 17, SUDOKU_COUNT);
    case 8: return [...segment(6, 23, 15, 12), ...segment(9, 47, 42, 8)];
    case 9: return segment(9, 45, 32, SUDOKU_COUNT);
    default: return segment(9, 38, 26, SUDOKU_COUNT); // 10
  }
}

/** Printed grid width (mm) per size — bigger cells for smaller hands. */
const GRID_WIDTH: Record<SudokuSize, number> = { 4: 82, 6: 104, 9: 116 };

/**
 * One sudoku as an SVG sized in mm: thin cell lines, thick box + outer
 * borders, givens printed bold. With `showSolution`, the dug cells print
 * their solution digit in teal — the mini grids on the answers pages.
 */
function sudokuSvg(s: Sudoku, width: number, showSolution = false): string {
  const n = s.size;
  const cell = width / n;
  const thin = Math.max(0.22, cell * 0.02);
  const thick = Math.max(0.7, cell * 0.06);

  let lines = "";
  for (let i = 0; i <= n; i++) {
    const p = (i * cell).toFixed(2);
    const vw = i % s.boxCols === 0 ? thick : thin;
    const hw = i % s.boxRows === 0 ? thick : thin;
    lines += `<line x1="${p}" y1="0" x2="${p}" y2="${width.toFixed(2)}" stroke="${INK}" stroke-width="${vw.toFixed(2)}"/>`;
    lines += `<line x1="0" y1="${p}" x2="${width.toFixed(2)}" y2="${p}" stroke="${INK}" stroke-width="${hw.toFixed(2)}"/>`;
  }

  let digits = "";
  for (let i = 0; i < n * n; i++) {
    const given = s.puzzle[i];
    const v = given || (showSolution ? s.solution[i] : 0);
    if (!v) continue;
    const x = ((i % n) + 0.5) * cell;
    const y = (Math.floor(i / n) + 0.5) * cell;
    const fill = given ? INK : TEAL_D;
    digits += `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-body),'Nunito',sans-serif;font-weight:800;font-size:${(cell * 0.56).toFixed(2)}px;fill:${fill}">${v}</text>`;
  }

  const m = thick / 2 + 0.2; // keep the outer border's stroke inside the viewBox
  const vb = (width + 2 * m).toFixed(2);
  return `<svg viewBox="${(-m).toFixed(2)} ${(-m).toFixed(2)} ${vb} ${vb}" width="${vb}mm" height="${vb}mm" aria-hidden="true">${lines}${digits}</svg>`;
}

function puzzleLeaf(s: Sudoku, no: number, footer: string, pageNo: number): string {
  return `<section class="leaf"><div class="npg">
    <div class="npg-eyebrow">ZAGONETKA ${no}</div>
    <div class="npg-instruction">Upiši brojeve od 1 do ${s.size}!</div>
    <div class="sud-grid">${sudokuSvg(s, GRID_WIDTH[s.size])}</div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

/** The kid-friendly rules page, with a solved 4×4 as the example. */
function howToLeaf(example: Sudoku): string {
  const rules = STRINGS.rules
    .map(
      (r) =>
        `<li style="margin:0 0 3mm;">${escapeHtml(r)}</li>`,
    )
    .join("");
  return popCard(
    `<div style="font-family:var(--font-baloo),'Baloo 2',sans-serif;font-weight:800;font-size:8mm;color:${TEAL_D};text-transform:uppercase;letter-spacing:0.5mm;">${escapeHtml(STRINGS.howToTitle)}</div>
     <ul style="font-family:var(--font-body),'Nunito',sans-serif;font-weight:700;font-size:4.5mm;color:${INK_SOFT};line-height:1.4;text-align:left;max-width:96mm;padding-left:5mm;margin:0;">${rules}</ul>
     <div>${sudokuSvg(example, 46, true)}</div>`,
    7,
  );
}

function solutionsLeaf(items: Array<{ no: number; s: Sudoku }>, footer: string, pageNo: number): string {
  const minis = items
    .map(
      ({ no, s }) =>
        `<div class="sud-sol"><span class="sud-sol-label">${no}.</span>${sudokuSvg(s, 35, true)}</div>`,
    )
    .join("");
  return `<section class="leaf"><div class="npg">
    <div class="npg-instruction">${escapeHtml(STRINGS.solutionsTitle)}</div>
    <div class="sud-sols">${minis}</div>
    <div class="lp-foot">${escapeHtml(footer)}</div>
  </div><div class="lp-pageno">${pageNo}</div></section>`;
}

/** Every leaf of the sudoku book, in print order, as HTML strings. */
export function buildSudokuBookLeaves(opts: PrintOpts = {}): string[] {
  const s = STRINGS;
  const name = (opts.childName || "").trim() || "Ema";
  const surname = (opts.childSurname || "").trim();
  const fullName = [name, surname].filter(Boolean).join(" ");
  const age = Math.min(SUDOKU_AGE_MAX, Math.max(SUDOKU_AGE_MIN, Math.round(opts.age ?? 7)));

  const footer = `${s.subtitle} · ${name.toUpperCase()}`;
  const plan = sudokuPlan(age);
  const puzzles = plan.map((slot, i) =>
    generateSudoku(slot.size, slot.givens, seededRng(`${name}|sudoku|${age}|${i}`)),
  );

  const leaves: string[] = [];
  leaves.push(tagLeaf(coverLeaf(name, opts.possessive || "", s.subtitle, s.blockWord, s.prvaWord, s.madeWith), "cover"));
  leaves.push(tagLeaf(posvetaLeaf(opts.posveta || s.posvetaFallback(name, opts.gender)), "posveta"));
  leaves.push(tagLeaf(howToLeaf(generateSudoku(4, 16, seededRng(`${name}|sudoku-primjer`))), "kako-se-rjesava"));

  puzzles.forEach((p, i) => {
    leaves.push(tagLeaf(puzzleLeaf(p, i + 1, footer, i + 1), `sudoku-${i + 1}`));
  });

  let pageNo = puzzles.length + 1;
  for (let i = 0; i < puzzles.length; i += SOLUTIONS_PER_PAGE) {
    const items = puzzles.slice(i, i + SOLUTIONS_PER_PAGE).map((p, j) => ({ no: i + j + 1, s: p }));
    leaves.push(tagLeaf(solutionsLeaf(items, footer, pageNo), `rjesenja-${Math.floor(i / SOLUTIONS_PER_PAGE) + 1}`));
    pageNo++;
  }

  leaves.push(
    tagLeaf(diplomaLeaf(fullName, s.diplomaTitle, s.diplomaIntro, s.diplomaBody(opts.gender), opts.gender, s.diplomaCheer), "diploma"),
  );
  return leaves;
}
