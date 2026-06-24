/**
 * Difficulty levels (⭐ / ⭐⭐ / ⭐⭐⭐) shared by every game.
 *
 * One level means different things per game, so each level carries the knobs
 * for each: a coloring-complexity phrase for the AI page, and grid/count/ratio
 * settings for the code-built puzzles (maze, match-pairs, tracing, odd-one-out).
 *
 * As always in Wonder Pages, the AI only draws the background; our code owns
 * the game logic — so these knobs, not the model, decide how hard a game is.
 */

export type DifficultyId = "easy" | "medium" | "hard";

export interface Difficulty {
  id: DifficultyId;
  name: string;
  /** Filled stars to render (1–3). */
  stars: number;
  /** Age hint shown under the picker. */
  ages: string;
  /** Short reassuring label. */
  blurb: string;

  // ── Coloring tuning ───────────────────────────────────────────
  /** Complexity phrase appended to the coloring-page prompt. */
  coloringStyle: string;

  // ── Maze tuning ───────────────────────────────────────────────
  /** Grid side length (the maze is mazeSize × mazeSize cells). */
  mazeSize: number;

  // ── Match the Pairs tuning ────────────────────────────────────
  /** How many pairs to match (rows per column). */
  matchPairs: number;

  // ── Tracing tuning ────────────────────────────────────────────
  /** How many guide lines on the page. */
  traceRows: number;
  /** Stroke complexity 0–2 (higher = springier waves, zig-zags, loops). */
  traceComplexity: number;

  // ── Odd One Out tuning ────────────────────────────────────────
  /** How many category groups (each = 4 belong + 1 odd) on the page. */
  oddGroups: number;
  /** How related the odd one is (0 = obviously different, 1 = tricky look-alike). */
  oddCloseness: number;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: "easy",
    name: "Easy",
    stars: 1,
    ages: "Ages 3–4",
    blurb: "Big & friendly",
    mazeSize: 7,
    matchPairs: 3,
    traceRows: 7,
    traceComplexity: 0,
    oddGroups: 6,
    oddCloseness: 0.1,
    coloringStyle:
      "Very simple with only a few large bold shapes and extra-thick outlines, lots of open space, minimal detail — perfect for tiny hands.",
  },
  {
    id: "medium",
    name: "Medium",
    stars: 2,
    ages: "Ages 5–6",
    blurb: "Just right",
    mazeSize: 11,
    matchPairs: 4,
    traceRows: 8,
    traceComplexity: 1,
    oddGroups: 8,
    oddCloseness: 0.4,
    coloringStyle:
      "Simple cute cartoon shapes with thick clean lines that are easy to color inside, a moderate amount of detail.",
  },
  {
    id: "hard",
    name: "Hard",
    stars: 3,
    ages: "Ages 7–8",
    blurb: "A real challenge",
    mazeSize: 15,
    matchPairs: 6,
    traceRows: 9,
    traceComplexity: 2,
    oddGroups: 10,
    oddCloseness: 0.75,
    coloringStyle:
      "Moderately detailed with several distinct areas to color and clean medium-weight outlines — engaging for older children, but with comfortably sized spaces and no tiny cramped details that are fiddly to color in.",
  },
];

export const DIFFICULTY_MAP: Record<DifficultyId, Difficulty> =
  Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d])) as Record<
    DifficultyId,
    Difficulty
  >;

export const DEFAULT_DIFFICULTY: DifficultyId = "medium";
