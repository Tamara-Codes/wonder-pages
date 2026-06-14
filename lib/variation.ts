/**
 * Best-effort image variety. Image generation isn't deterministic, but to make
 * repeats practically impossible we fold a randomly chosen "fresh take" phrase
 * into every prompt. Coloring pages stay black-and-white, so they only vary
 * composition/mood — never colour.
 */
import type { GameId } from "./games";

// Busy, many-object layouts — great for Find It! scenes.
const COMPOSITION = [
  "a wide panoramic layout",
  "a cozy close-up scene",
  "a tall storybook layout",
  "a bustling layout full of characters",
  "a calm, spacious layout",
  "a playful scattered arrangement",
  "a grand sweeping vista",
  "an up-close, zoomed-in view",
];

// Single-subject framings — for coloring pages, which feature ONE main
// character, so these never ask for crowds or scattered groups.
const COMPOSITION_COLORING = [
  "a cozy close-up of the main character",
  "a tall storybook layout with the character in the foreground",
  "a calm, spacious layout with the character off-center",
  "an up-close, zoomed-in portrait view",
  "a low three-quarter view of the character",
  "a gentle, slightly-above view of the character",
];

const MOOD = [
  "a sunny, cheerful feel",
  "a soft, dreamy feel",
  "a magical, sparkling feel",
  "a cozy, gentle feel",
  "an adventurous, exciting feel",
];

// Colour palettes only apply to the (full-colour) Find It! scenes.
const PALETTE = [
  "warm sunset colours",
  "cool ocean-blue colours",
  "bright, bold primary colours",
  "soft pastel colours",
  "rich jewel-tone colours",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** A one-line "make this one different" instruction to append to a prompt. */
export function variationPhrase(game: GameId): string {
  if (game === "coloring") {
    return `Make this version unique and original: use ${pick(COMPOSITION_COLORING)} with ${pick(MOOD)} — a fresh take, different from any other page.`;
  }
  return `Make this version unique and original: use ${pick(COMPOSITION)} in ${pick(PALETTE)} with ${pick(MOOD)} — a fresh take, different from any other scene.`;
}
