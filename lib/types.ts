import type { DifficultyId } from "./difficulty";
import type { GameId } from "./games";
import type { ThemeId } from "./themes";

/** One item the kid must find, placed in the image's natural pixels. */
export interface FoundItem {
  key: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The seek-and-find answer key: every item we composited + image dimensions. */
export interface FindItAnswer {
  imgW: number;
  imgH: number;
  items: FoundItem[];
}

/** One changed region in a Spot-the-Difference pair (image-A natural pixels). */
export interface DiffBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Spot-the-Difference answer key. `image_url` on the row holds scene A; this
 * carries scene B's URL plus every changed region (both images share imgW/imgH).
 */
export interface SpotDiffAnswer {
  imgW: number;
  imgH: number;
  imageB: string;
  diffs: DiffBox[];
}

/** Whatever answer key a game carries, keyed by its `type`. */
export type AnswerKey = FindItAnswer | SpotDiffAnswer;

/** A row in the `games` table. */
export interface GameRow {
  id: string;
  user_id: string;
  type: GameId;
  theme: ThemeId;
  difficulty: DifficultyId;
  title: string;
  image_url: string;
  /** Coloring only: the child's saved colored version (null until they save). */
  colored_url: string | null;
  answer_key: AnswerKey | null;
  created_at: string;
}
