/**
 * The Booklet — Wonder Pages' core product.
 *
 * A booklet is a personalized printed activity book (a gift for a child 2–8):
 * one fixed size, a balanced mix of games as its pages, plus a personalized
 * cover. This module owns the booklet's hard rules — its size and price, how a
 * child's age maps to game difficulty, and how we auto-propose the full page
 * set from the child's age + chosen interests.
 *
 * Cost rule (see the AI-cost strategy): only coloring pages touch AI, and those
 * are SELECTED from a pre-built shared catalog — never generated per booklet.
 * The four code games (maze, match-pairs, tracing, odd-one-out) are free to
 * build. So a proposed mix has no per-booklet AI cost at all; the only live AI
 * call in the whole flow is the cover, rendered at payment.
 */

import { GAME_MAP, type GameId } from "./games";
import { THEMES, THEME_MAP, type ThemeId } from "./themes";
import type { DifficultyId } from "./difficulty";

// ── Size & price (single tier) ────────────────────────────────────
// One clear choice for gift buyers: a 40-page book at a flat €25, the same
// price in every country. (Croatia is fulfilled by hand rather than Lulu, but
// the customer still pays the same — see `fulfillmentFor`.)
export const BOOKLET_PAGES = 40;
export const BOOKLET_PRICE_CENTS = 2500;
export const BOOKLET_CURRENCY = "eur";

export function priceLabel(): string {
  return `€${(BOOKLET_PRICE_CENTS / 100).toFixed(0)}`;
}

// ── Fulfillment routing ───────────────────────────────────────────
// Lulu prints + ships everywhere EXCEPT Croatia, which Tamara fulfills
// personally (print + hand-deliver). The checkout/order path branches on this.
export type Fulfillment = "lulu" | "self";
export const SELF_FULFILL_COUNTRIES = ["HR"] as const;

export function fulfillmentFor(countryCode: string): Fulfillment {
  return (SELF_FULFILL_COUNTRIES as readonly string[]).includes(
    countryCode.toUpperCase(),
  )
    ? "self"
    : "lulu";
}

// ── Age → difficulty ──────────────────────────────────────────────
// The buyer picks the child's age once; every page derives its difficulty from
// it (matching the age bands in difficulty.ts). 2–4 → easy, 5–6 → medium,
// 7–8 → hard.
export const MIN_AGE = 2;
export const MAX_AGE = 8;

export function ageToDifficulty(age: number): DifficultyId {
  if (age <= 4) return "easy";
  if (age <= 6) return "medium";
  return "hard";
}

// ── Auto-proposed page mix ────────────────────────────────────────
/** One proposed page: which game, in which world, at what difficulty. */
export interface PageSpec {
  type: GameId;
  theme: ThemeId;
  difficulty: DifficultyId;
}

// Relative share of each game type by difficulty band. Younger children lean on
// coloring + tracing (calm, motor skills); older children get more reasoning
// puzzles (maze, odd-one-out). Coloring is always a healthy share — it's the
// activity-book staple — and costs nothing because it comes from the catalog.
const TYPE_WEIGHTS: Record<DifficultyId, Partial<Record<GameId, number>>> = {
  easy: { coloring: 4, tracing: 3, "match-pairs": 2, "odd-one-out": 1, maze: 1 },
  medium: { coloring: 3, maze: 2, "match-pairs": 2, "odd-one-out": 2, tracing: 1 },
  hard: { coloring: 2, maze: 3, "odd-one-out": 3, "match-pairs": 2, tracing: 1 },
};

/**
 * Split `total` into integer counts proportional to `weights`, summing exactly
 * to `total` (largest-remainder rounding so nothing is lost or over-counted).
 */
function allocate(
  weights: Partial<Record<GameId, number>>,
  total: number,
): Partial<Record<GameId, number>> {
  const entries = Object.entries(weights) as [GameId, number][];
  const weightSum = entries.reduce((s, [, w]) => s + w, 0);

  const ideal = entries.map(([type, w]) => ({ type, value: (w / weightSum) * total }));
  const counts: Partial<Record<GameId, number>> = {};
  let assigned = 0;
  for (const { type, value } of ideal) {
    counts[type] = Math.floor(value);
    assigned += counts[type]!;
  }

  // Hand out the leftover pages to the largest fractional remainders.
  const byRemainder = ideal
    .map(({ type, value }) => ({ type, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; assigned < total; i++, assigned++) {
    counts[byRemainder[i % byRemainder.length].type]!++;
  }
  return counts;
}

/**
 * Propose the full ordered page set for a booklet from the child's age and the
 * chosen worlds. Game types are allocated by age-appropriate weights, spread
 * across the selected themes, then interleaved so the booklet alternates
 * activities (never 16 coloring pages in a row). Deterministic for a given
 * input, so a draft stays stable while the buyer reorders/swaps it.
 */
export function proposePageMix(opts: {
  age: number;
  themes: ThemeId[];
  count?: number;
}): PageSpec[] {
  const count = opts.count ?? BOOKLET_PAGES;
  const difficulty = ageToDifficulty(opts.age);
  const themes =
    opts.themes.filter((t) => THEME_MAP[t]).length > 0
      ? opts.themes.filter((t) => THEME_MAP[t])
      : [THEMES[0].id];

  const counts = allocate(TYPE_WEIGHTS[difficulty], count);

  // One queue per game type, with themes spread round-robin across its pages.
  let themeCursor = 0;
  const queues: PageSpec[][] = [];
  for (const [type, n] of Object.entries(counts) as [GameId, number][]) {
    if (!GAME_MAP[type] || n <= 0) continue;
    const queue: PageSpec[] = [];
    for (let i = 0; i < n; i++) {
      const theme = themes[themeCursor++ % themes.length];
      queue.push({ type, theme, difficulty });
    }
    queues.push(queue);
  }

  // Interleave the queues so game types are distributed through the booklet.
  const pages: PageSpec[] = [];
  for (let drained = false; !drained; ) {
    drained = true;
    for (const queue of queues) {
      const page = queue.shift();
      if (page) {
        pages.push(page);
        drained = false;
      }
    }
  }
  return pages;
}
