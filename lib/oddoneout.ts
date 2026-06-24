/**
 * Odd One Out — category puzzles, pure code.
 *
 * Each group is five pictures: four that belong to a category and one that
 * doesn't — "4 flowers and a bee". A page holds several groups. The child finds
 * the odd one in each; it plays the same on paper (circle it) and on screen
 * (tap it).
 *
 * The categories and members come from a fixed, curated vocabulary
 * ([[lib/icons]] CATEGORIES) so every picture is a real print-ready vector and
 * the content is deterministic — no flaky model call in a paid print pipeline.
 * Code owns the logic: it picks the members + outsider, shuffles, and records
 * where the odd one landed. `closeness` makes the outsider harder to spot by
 * drawing it from a *related* category (a bee among bugs vs a rocket among
 * flowers).
 */

import { CATEGORIES, RELATED } from "./icons";

export interface OddGroup {
  /** The category the four belong to (shown once solved). */
  category: string;
  /** Five icon keys (lib/icons) in display order. */
  keys: string[];
  /** Index (0-based) of the one that doesn't belong. */
  oddIndex: number;
}

export interface OddAnswer {
  groups: OddGroup[];
  /** How many columns of groups to lay the page out in. */
  cols: number;
}

function shuffle<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = <T,>(arr: readonly T[], rnd: () => number): T =>
  arr[Math.floor(rnd() * arr.length)];

/**
 * Build `groups` category puzzles. Each uses four members of one category plus
 * one outsider from another; `closeness` (0–1) biases the outsider toward a
 * related category so it's trickier to spot. rnd is injectable for tests.
 */
export function generateOddOneOut(
  groups: number,
  closeness: number,
  rnd: () => number = Math.random,
): OddAnswer {
  const all = Object.keys(CATEGORIES).filter((c) => CATEGORIES[c].length >= 4);
  const chosen = shuffle(all, rnd).slice(0, Math.min(groups, all.length));

  const out: OddGroup[] = chosen.map((category) => {
    const members = shuffle(CATEGORIES[category], rnd).slice(0, 4);

    // Pick the outsider's category — a related one when "tricky", else any other.
    const related = (RELATED[category] ?? []).filter((c) => CATEGORIES[c]?.length);
    const others = all.filter((c) => c !== category);
    const pool = closeness >= 0.6 && related.length ? related : others;
    const oddCategory = pick(pool, rnd);
    const odd = pick(CATEGORIES[oddCategory], rnd);

    const keys = shuffle([...members, odd], rnd);
    return { category, keys, oddIndex: keys.indexOf(odd) };
  });

  return { groups: out, cols: 2 };
}

/** Thumbnail PNG for My Games — the first few groups as rows of pictures. */
export async function oddThumb(answer: OddAnswer, bg: string): Promise<Buffer> {
  const { composeThumb } = await import("./icons-server");
  const cell = 120;
  const pad = 26;
  const gap = 14;
  const per = 5;
  const rows = Math.min(4, answer.groups.length || 1);
  const width = pad * 2 + per * cell + (per - 1) * gap;
  const height = pad * 2 + rows * cell + (rows - 1) * gap;

  const placements = [];
  for (let r = 0; r < rows; r++) {
    const group = answer.groups[r];
    for (let i = 0; i < per; i++) {
      placements.push({
        key: group.keys[i],
        x: pad + i * (cell + gap),
        y: pad + r * (cell + gap),
        size: cell,
      });
    }
  }

  return composeThumb(width, height, bg, placements);
}
