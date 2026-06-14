/**
 * Difficulty levels (⭐ / ⭐⭐ / ⭐⭐⭐) shared by every game.
 *
 * One level means different things per game, so each level carries the knobs
 * for both:
 *   • Find It!  — how many items, how big, how well they blend, how forgiving
 *                 the tap target is.
 *   • Coloring  — a phrase woven into the image prompt to dial drawing
 *                 complexity (toddler-simple → intricate).
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

  // ── Find It! tuning ───────────────────────────────────────────
  /** How many items the kid hunts for. */
  findItCount: number;
  /** Sprite size as a fraction of the scene's shorter side. */
  findItSize: number;
  /** Sprite saturation (lower = blends into the scene = harder to spot). */
  findItSaturation: number;
  /** Tap forgiveness as a fraction of sprite width (bigger = easier to hit). */
  findItPad: number;

  // ── Coloring tuning ───────────────────────────────────────────
  /** Complexity phrase appended to the coloring-page prompt. */
  coloringStyle: string;

  // ── Spot the Difference tuning ────────────────────────────────
  /** How many differences to make between the two scenes. */
  diffCount: number;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: "easy",
    name: "Easy",
    stars: 1,
    ages: "Ages 3–4",
    blurb: "Big & friendly",
    findItCount: 4,
    findItSize: 0.11,
    findItSaturation: 1.0,
    findItPad: 0.45,
    diffCount: 3,
    coloringStyle:
      "Very simple with only a few large bold shapes and extra-thick outlines, lots of open space, minimal detail — perfect for tiny hands.",
  },
  {
    id: "medium",
    name: "Medium",
    stars: 2,
    ages: "Ages 5–6",
    blurb: "Just right",
    findItCount: 6,
    findItSize: 0.088,
    findItSaturation: 0.82,
    findItPad: 0.3,
    diffCount: 5,
    coloringStyle:
      "Simple cute cartoon shapes with thick clean lines that are easy to color inside, a moderate amount of detail.",
  },
  {
    id: "hard",
    name: "Hard",
    stars: 3,
    ages: "Ages 7–8",
    blurb: "A real challenge",
    findItCount: 8,
    findItSize: 0.07,
    findItSaturation: 0.66,
    findItPad: 0.18,
    diffCount: 7,
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
