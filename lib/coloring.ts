/**
 * The coloring-page prompt — the single source of truth for how we ask the
 * image model to draw blank line art. Used by the one-time catalog builder
 * (app/api/admin/catalog) so every booklet coloring page is drawn the same way.
 */

import { THEME_MAP, type ThemeId } from "./themes";
import { DIFFICULTY_MAP, type DifficultyId } from "./difficulty";
import { variationPhrase } from "./variation";

export function buildColoringPrompt(
  theme: ThemeId,
  difficulty: DifficultyId,
): string {
  const subject = THEME_MAP[theme].prompt;
  return `A single illustration for a young child's coloring book — ONE storybook scene, like a page from a picture book (not a pattern or poster). World to draw from: ${subject}. Pick just ONE main character as the clear focus in the foreground, doing something, set in a simple background with only a few supporting details. COMPOSITION: keep it natural and asymmetric. Do NOT draw the main character more than once, do NOT repeat or duplicate figures, do NOT mirror the left and right halves of the page, and never use a kaleidoscope, mandala, tiled, grid or symmetrical pattern layout. LINE ART: bold, clean black outlines of even weight only — absolutely no shading, no grey, no hatching or cross-hatching, no solid filled-black areas, and no colour at all. Pure white background. Keep shapes large and open with clear gaps so small hands can easily colour inside them. ${DIFFICULTY_MAP[difficulty].coloringStyle} ${variationPhrase("coloring")}`;
}
