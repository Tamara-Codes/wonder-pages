/**
 * Server-side builders for a single booklet/game page.
 *
 * The four code games (maze, match-pairs, tracing, odd-one-out) are built here
 * with no AI — code owns the puzzle, and the PNG is just a thumbnail. Coloring
 * is the exception: in a booklet it's SELECTED from the shared catalog rather
 * than generated, so it's handled by the caller (see /api/booklets), not here.
 */
import sharp from "sharp";
import { generateMaze, mazeThumb } from "./maze";
import { generateMatchPairs, matchPairsThumb } from "./matchpairs";
import { generateTracing, tracingSvg } from "./tracing";
import { generateOddOneOut, oddThumb } from "./oddoneout";
import { THEME_MAP, type ThemeId } from "./themes";
import { DIFFICULTY_MAP, type DifficultyId } from "./difficulty";
import type { GameId } from "./games";
import type { AnswerKey } from "./types";

export type CodeGameId = Exclude<GameId, "coloring">;

export function isCodeGame(type: GameId): type is CodeGameId {
  return type !== "coloring";
}

/**
 * Build one code game: returns its thumbnail PNG and the answer key that IS the
 * puzzle. No AI, no network — pure CPU, so a whole booklet's worth materializes
 * in a moment.
 */
export async function buildCodeGame(
  type: CodeGameId,
  theme: ThemeId,
  difficulty: DifficultyId,
): Promise<{ png: Buffer; answerKey: AnswerKey }> {
  const level = DIFFICULTY_MAP[difficulty];
  const tint = THEME_MAP[theme].tint;

  switch (type) {
    case "maze": {
      const maze = generateMaze(level.mazeSize, level.mazeSize);
      // Themed: the theme's hero starts the maze and its goal ends it.
      return { png: await mazeThumb(maze, theme), answerKey: maze };
    }
    case "match-pairs": {
      const pairs = generateMatchPairs(level.matchPairs);
      return { png: await matchPairsThumb(pairs, tint), answerKey: pairs };
    }
    case "tracing": {
      const tracing = generateTracing(level.traceRows, level.traceComplexity);
      return {
        png: await sharp(Buffer.from(tracingSvg(tracing, tint))).png().toBuffer(),
        answerKey: tracing,
      };
    }
    case "odd-one-out": {
      const odd = generateOddOneOut(level.oddGroups, level.oddCloseness);
      return { png: await oddThumb(odd, tint), answerKey: odd };
    }
  }
}
