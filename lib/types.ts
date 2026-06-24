import type { DifficultyId } from "./difficulty";
import type { ThemeId } from "./themes";
import type { MazeAnswer } from "./maze";
import type { MatchPairsAnswer } from "./matchpairs";
import type { TracingAnswer } from "./tracing";
import type { OddAnswer } from "./oddoneout";

/** Whatever answer key a code game carries, keyed by its `type`. */
export type AnswerKey = MazeAnswer | MatchPairsAnswer | TracingAnswer | OddAnswer;

/**
 * A row in `coloring_catalog` — pre-generated blank coloring line art, the
 * source of the activity book's coloring pages (selected, never generated
 * per order, so building a book costs no AI).
 */
export interface ColoringCatalogRow {
  id: string;
  theme: ThemeId;
  difficulty: DifficultyId;
  image_url: string;
  created_at: string;
}
