/**
 * Theme mascots — the hero + goal that make a book theme-coherent.
 *
 * Every theme gets a "hero" (the character the page is about) and a "goal" (what
 * they're heading toward). These drive the path games: a unicorn maze leads the
 * unicorn to the castle; a space maze flies the rocket to the planet. Keys are
 * icon vocabulary keys (see lib/icons.ts); the mascots were vendored from Noto
 * to match the existing flat-vector set.
 */
import type { ThemeId } from "./themes";
import { iconLabel } from "./icons";

export interface ThemeMascots {
  /** The character the page follows (start of the path). */
  hero: string;
  /** What the hero is heading toward (end of the path). */
  goal: string;
}

export const THEME_MASCOTS: Record<ThemeId, ThemeMascots> = {
  princess: { hero: "princess", goal: "castle" },
  unicorns: { hero: "unicorn", goal: "castle" },
  space: { hero: "rocket", goal: "planet" },
  dinosaurs: { hero: "dino", goal: "egg" },
  ocean: { hero: "dolphin", goal: "gem" },
  "race-cars": { hero: "car", goal: "trophy" },
  ghosts: { hero: "ghost", goal: "pumpkin" },
  mermaids: { hero: "mermaid", goal: "shell" },
  animals: { hero: "dog", goal: "bone" },
  sports: { hero: "soccer", goal: "trophy" },
  sweets: { hero: "teddy", goal: "cake" },
};

/** Child-facing instruction for a themed maze, e.g. "Help the unicorn find the castle!" */
export function mazeInstruction(theme: ThemeId): string {
  const { hero, goal } = THEME_MASCOTS[theme];
  return `Help the ${iconLabel(hero)} find the ${iconLabel(goal)}!`;
}

/** Child-facing instruction for a themed tracing page. */
export function traceInstruction(theme: ThemeId): string {
  const { hero, goal } = THEME_MASCOTS[theme];
  return `Trace the path to take the ${iconLabel(hero)} to the ${iconLabel(goal)}!`;
}
