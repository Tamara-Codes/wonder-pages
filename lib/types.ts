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

/** A row in the `games` table. */
export interface GameRow {
  id: string;
  user_id: string;
  type: GameId;
  theme: ThemeId;
  difficulty: DifficultyId;
  title: string;
  image_url: string;
  answer_key: FindItAnswer | null;
  created_at: string;
}
