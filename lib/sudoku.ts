/**
 * Sudoku generator — pure code, no AI, in the "code owns game logic" spirit.
 *
 * Three sizes, mapped to age by the sudoku book (lib/sudoku-book.ts):
 *   4×4 (digits 1–4, 2×2 boxes)  — the entry size
 *   6×6 (digits 1–6, 2×3 boxes)  — the middle size
 *   9×9 (digits 1–9, 3×3 boxes)  — the classic
 *
 * Generation is the standard two-step: fill a complete valid grid with a
 * randomized backtracker, then dig cells out one by one, keeping a removal
 * only while the puzzle still has EXACTLY ONE solution (counting solver with
 * a fewest-candidates heuristic, capped at 2). Difficulty = target number of
 * givens; digging stops early if no more cells can be removed uniquely, so a
 * puzzle can end up slightly easier than asked — never broken.
 */
import { shuffled } from "./seeded-rng";

export type SudokuSize = 4 | 6 | 9;

export interface Sudoku {
  size: SudokuSize;
  /** Box shape: boxRows × boxCols cells per box (4→2×2, 6→2×3, 9→3×3). */
  boxRows: number;
  boxCols: number;
  /** Row-major; 0 = blank cell for the child to fill in. */
  puzzle: number[];
  solution: number[];
}

const BOXES: Record<SudokuSize, [number, number]> = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };

/** Can `v` go at `idx` without clashing in its row, column or box? */
function fits(g: number[], size: number, br: number, bc: number, idx: number, v: number): boolean {
  const r = Math.floor(idx / size);
  const c = idx % size;
  for (let i = 0; i < size; i++) {
    if (g[r * size + i] === v || g[i * size + c] === v) return false;
  }
  const r0 = r - (r % br);
  const c0 = c - (c % bc);
  for (let rr = r0; rr < r0 + br; rr++) {
    for (let cc = c0; cc < c0 + bc; cc++) {
      if (g[rr * size + cc] === v) return false;
    }
  }
  return true;
}

/** Fill the grid completely (randomized backtracker); true on success. */
function fillGrid(g: number[], size: number, br: number, bc: number, rnd: () => number, idx = 0): boolean {
  if (idx === size * size) return true;
  const values = shuffled(Array.from({ length: size }, (_, i) => i + 1), rnd);
  for (const v of values) {
    if (!fits(g, size, br, bc, idx, v)) continue;
    g[idx] = v;
    if (fillGrid(g, size, br, bc, rnd, idx + 1)) return true;
    g[idx] = 0;
  }
  return false;
}

/**
 * Count solutions, stopping at `cap` (2 is enough to test uniqueness). Always
 * branches on the blank with the fewest candidates, which keeps 9×9 checks
 * fast even at low givens. Restores the grid before returning.
 */
function countSolutions(g: number[], size: number, br: number, bc: number, cap: number): number {
  let best = -1;
  let bestVals: number[] | null = null;
  for (let i = 0; i < g.length; i++) {
    if (g[i]) continue;
    const vals: number[] = [];
    for (let v = 1; v <= size; v++) {
      if (fits(g, size, br, bc, i, v)) vals.push(v);
    }
    if (!bestVals || vals.length < bestVals.length) {
      best = i;
      bestVals = vals;
      if (vals.length <= 1) break; // can't do better than a forced cell
    }
  }
  if (best === -1) return 1; // no blanks left — one complete solution
  let n = 0;
  for (const v of bestVals!) {
    g[best] = v;
    n += countSolutions(g, size, br, bc, cap - n);
    g[best] = 0;
    if (n >= cap) break;
  }
  return n;
}

/** Generate one puzzle with (about) `givens` cells pre-filled. */
export function generateSudoku(size: SudokuSize, givens: number, rnd: () => number): Sudoku {
  const [boxRows, boxCols] = BOXES[size];
  const cells = size * size;
  const solution = new Array<number>(cells).fill(0);
  fillGrid(solution, size, boxRows, boxCols, rnd); // always succeeds on an empty grid
  const puzzle = solution.slice();
  let filled = cells;
  for (const idx of shuffled(Array.from({ length: cells }, (_, i) => i), rnd)) {
    if (filled <= givens) break;
    const kept = puzzle[idx];
    puzzle[idx] = 0;
    if (countSolutions(puzzle, size, boxRows, boxCols, 2) === 1) filled--;
    else puzzle[idx] = kept; // removal broke uniqueness — put it back
  }
  return { size, boxRows, boxCols, puzzle, solution };
}
