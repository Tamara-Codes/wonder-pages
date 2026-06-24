/**
 * Match the Pairs — "what goes together", pure code.
 *
 * Two columns of pictures. Each picture on the left belongs with exactly one on
 * the right — a thing and where it lives, its partner, or what it makes: bee ↔
 * flower, key ↔ lock, cow ↔ milk. The child draws a line joining each pair — on
 * paper with a pencil, on screen by tapping one then the other. It's an
 * association puzzle, NOT matching a picture to a copy of itself.
 *
 * The pairs come from a fixed, curated vocabulary ([[lib/icons]] PAIRS) so the
 * content is deterministic and every picture is a real print-ready vector — no
 * flaky model call in a paid print pipeline. Code owns the logic: it shuffles
 * the right column and records which right slot each left item belongs to.
 */

import { PAIRS } from "./icons";

export interface MatchPairsAnswer {
  /** Icon keys (lib/icons) down the left column, top to bottom. */
  left: string[];
  /** Icon keys down the right column, shuffled. */
  right: string[];
  /** solution[i] = the index in `right` that pairs with left[i]. */
  solution: number[];
}

function shuffle<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a Match the Pairs puzzle of `count` pairs. Picks distinct association
 * pairs, then shuffles the right column (deranged where possible) so the
 * matches cross rather than running straight across. rnd is injectable.
 */
export function generateMatchPairs(
  count: number,
  rnd: () => number = Math.random,
): MatchPairsAnswer {
  const n = Math.min(count, PAIRS.length);
  const chosen = shuffle(PAIRS, rnd).slice(0, n);
  const left = chosen.map((p) => p[0]);

  // Shuffle the right slots; retry for a derangement so no pair sits straight
  // across (the connecting lines then genuinely cross).
  let order = chosen.map((_, i) => i);
  for (let attempt = 0; attempt < 20; attempt++) {
    order = shuffle(
      chosen.map((_, i) => i),
      rnd,
    );
    if (n < 2 || order.every((from, slot) => from !== slot)) break;
  }
  const right = order.map((from) => chosen[from][1]);
  const solution = new Array<number>(n);
  order.forEach((from, slot) => {
    solution[from] = slot;
  });

  return { left, right, solution };
}

/** Thumbnail PNG for My Games — the two columns joined by their answer lines. */
export async function matchPairsThumb(
  answer: MatchPairsAnswer,
  bg: string,
): Promise<Buffer> {
  const { composeThumb } = await import("./icons-server");
  const n = answer.left.length;
  const pad = 30;
  const cell = 120;
  const rowGap = 24;
  const colGap = 150;
  const leftX = pad;
  const rightX = pad + cell + colGap;
  const width = rightX + cell + pad;
  const height = pad * 2 + n * cell + (n - 1) * rowGap;
  const rowY = (i: number) => pad + i * (cell + rowGap);

  let lines = "";
  let dots = "";
  for (let i = 0; i < n; i++) {
    const y1 = rowY(i) + cell / 2;
    const y2 = rowY(answer.solution[i]) + cell / 2;
    lines += `<line x1="${leftX + cell}" y1="${y1}" x2="${rightX}" y2="${y2}" stroke="#c9bfe0" stroke-width="5" stroke-linecap="round"/>`;
    dots += `<circle cx="${leftX + cell}" cy="${y1}" r="7" fill="#b9aede"/><circle cx="${rightX}" cy="${y2}" r="7" fill="#b9aede"/>`;
  }
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g>${lines}</g><g>${dots}</g></svg>`;

  const placements = [];
  for (let i = 0; i < n; i++) {
    placements.push({ key: answer.left[i], x: leftX, y: rowY(i), size: cell });
    placements.push({ key: answer.right[i], x: rightX, y: rowY(i), size: cell });
  }

  return composeThumb(width, height, bg, placements, overlay);
}
