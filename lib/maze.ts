/**
 * Maze game — pure code, no AI.
 *
 * As always in Wonder Pages, the AI draws nothing here: our code generates a
 * perfect maze (one unique path between any two cells), renders a thumbnail for
 * My Games, and the play view traces the child's route through it. The maze
 * data IS the answer key.
 *
 * A "perfect" maze is built with the classic randomized depth-first search
 * (recursive backtracker): start in one cell, carve to a random unvisited
 * neighbour, and backtrack at dead ends until every cell is reached. The result
 * is always solvable with exactly one route between entrance and exit.
 */

import type { ThemeId } from "./themes";
import { THEME_MASCOTS } from "./theme-icons";

/** Open-passage bits for a cell. A set bit means there's NO wall that way. */
const NORTH = 1;
const EAST = 2;
const SOUTH = 4;
const WEST = 8;

export interface MazeAnswer {
  cols: number;
  rows: number;
  /** One entry per cell (row-major). Bitmask of OPEN sides: N=1, E=2, S=4, W=8. */
  cells: number[];
  /** Cell indices from entrance (top-left, 0) to exit (bottom-right), inclusive. */
  solution: number[];
}

interface Dir {
  bit: number;
  opp: number;
  dc: number;
  dr: number;
}

const DIRS: Dir[] = [
  { bit: NORTH, opp: SOUTH, dc: 0, dr: -1 },
  { bit: EAST, opp: WEST, dc: 1, dr: 0 },
  { bit: SOUTH, opp: NORTH, dc: 0, dr: 1 },
  { bit: WEST, opp: EAST, dc: -1, dr: 0 },
];

/** Build a perfect `cols`×`rows` maze. rnd is injectable for deterministic tests. */
export function generateMaze(
  cols: number,
  rows: number,
  rnd: () => number = Math.random,
): MazeAnswer {
  const cells = new Array<number>(cols * rows).fill(0);
  const visited = new Array<boolean>(cols * rows).fill(false);
  const at = (c: number, r: number) => r * cols + c;

  // Iterative recursive-backtracker (an explicit stack avoids deep recursion).
  const stack: Array<[number, number]> = [[0, 0]];
  visited[0] = true;

  while (stack.length) {
    const [c, r] = stack[stack.length - 1];
    const open = DIRS.filter(({ dc, dr }) => {
      const nc = c + dc;
      const nr = r + dr;
      return (
        nc >= 0 && nc < cols && nr >= 0 && nr < rows && !visited[at(nc, nr)]
      );
    });
    if (open.length === 0) {
      stack.pop();
      continue;
    }
    const d = open[Math.floor(rnd() * open.length)];
    const nc = c + d.dc;
    const nr = r + d.dr;
    cells[at(c, r)] |= d.bit; // carve the wall between this cell…
    cells[at(nc, nr)] |= d.opp; // …and its new neighbour (both sides)
    visited[at(nc, nr)] = true;
    stack.push([nc, nr]);
  }

  return { cols, rows, cells, solution: solveMaze(cells, cols, rows) };
}

/** Shortest route (the only route, in a perfect maze) from cell 0 to the last cell. */
function solveMaze(cells: number[], cols: number, rows: number): number[] {
  const goal = cols * rows - 1;
  const prev = new Array<number>(cols * rows).fill(-1);
  const seen = new Array<boolean>(cols * rows).fill(false);
  const queue = [0];
  seen[0] = true;

  const steps = [
    { bit: NORTH, d: -cols },
    { bit: EAST, d: 1 },
    { bit: SOUTH, d: cols },
    { bit: WEST, d: -1 },
  ];

  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    if (cur === goal) break;
    const c = cur % cols;
    for (const { bit, d } of steps) {
      if (!(cells[cur] & bit)) continue;
      if (bit === EAST && c === cols - 1) continue; // guard row wrap-around
      if (bit === WEST && c === 0) continue;
      const next = cur + d;
      if (next < 0 || next >= cols * rows || seen[next]) continue;
      seen[next] = true;
      prev[next] = cur;
      queue.push(next);
    }
  }

  const path: number[] = [];
  for (let cur = goal; cur !== -1; cur = prev[cur]) path.push(cur);
  return path.reverse();
}

export interface WallSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Wall segments in cell units — a cell spans [c, c+1] × [r, r+1]. Each cell
 * contributes its north + west wall (when closed); shared walls aren't drawn
 * twice. The right and bottom outer borders are added explicitly, minus the
 * entrance (top of cell 0) and exit (bottom of the last cell) openings.
 */
export function mazeWalls(maze: MazeAnswer): WallSeg[] {
  const { cols, rows, cells } = maze;
  const segs: WallSeg[] = [];
  const add = (x1: number, y1: number, x2: number, y2: number) =>
    segs.push({ x1, y1, x2, y2 });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (!(cells[i] & NORTH) && i !== 0) add(c, r, c + 1, r); // skip entrance
      if (!(cells[i] & WEST)) add(c, r, c, r + 1);
    }
  }
  add(cols, 0, cols, rows); // right border (no opening this side)
  add(0, rows, cols - 1, rows); // bottom border, last unit left open = exit
  return segs;
}

/** True if you can move directly between adjacent cells `a` and `b` (no wall). */
export function passageOpen(maze: MazeAnswer, a: number, b: number): boolean {
  const { cols, cells } = maze;
  const ac = a % cols;
  const ar = Math.floor(a / cols);
  const bc = b % cols;
  const br = Math.floor(b / cols);
  if (bc === ac && br === ar - 1) return !!(cells[a] & NORTH);
  if (bc === ac + 1 && br === ar) return !!(cells[a] & EAST);
  if (bc === ac && br === ar + 1) return !!(cells[a] & SOUTH);
  if (bc === ac - 1 && br === ar) return !!(cells[a] & WEST);
  return false; // not orthogonally adjacent
}

/** Center point of a cell index, in the same cell units as mazeWalls. */
export function cellCenter(maze: MazeAnswer, index: number): { x: number; y: number } {
  return {
    x: (index % maze.cols) + 0.5,
    y: Math.floor(index / maze.cols) + 0.5,
  };
}

// Shared geometry for the maze raster (kept in one place so the plain SVG and
// the themed thumbnail line up exactly).
const CELL = 40;
const PAD = 22;

function mazeDims(maze: MazeAnswer) {
  return {
    cell: CELL,
    pad: PAD,
    w: maze.cols * CELL + PAD * 2,
    h: maze.rows * CELL + PAD * 2,
    map: (n: number) => PAD + n * CELL,
  };
}

/**
 * Themed maze thumbnail: the maze walls with the theme's hero at the entrance
 * and its goal at the exit — "help the unicorn find the castle". The hero/goal
 * icons replace the plain start/end dots so the page reads as part of the
 * chosen world. Server-only (dynamically imports the sharp compositor).
 */
export async function mazeThumb(
  maze: MazeAnswer,
  theme: ThemeId,
): Promise<Buffer> {
  const { composeThumb } = await import("./icons-server");
  const { cell, w, h, map } = mazeDims(maze);

  const walls = mazeWalls(maze)
    .map(
      (s) =>
        `<line x1="${map(s.x1)}" y1="${map(s.y1)}" x2="${map(s.x2)}" y2="${map(s.y2)}"/>`,
    )
    .join("");
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g stroke="#2b2440" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">${walls}</g></svg>`;

  const { hero, goal } = THEME_MASCOTS[theme];
  const size = cell * 1.5;
  const place = (key: string, idx: number) => {
    const ctr = cellCenter(maze, idx);
    return { key, size, x: map(ctr.x) - size / 2, y: map(ctr.y) - size / 2 };
  };

  return composeThumb(w, h, "#ffffff", [
    place(hero, 0),
    place(goal, maze.cols * maze.rows - 1),
  ], overlay);
}

/** A self-contained SVG thumbnail (plain start/end dots, no theme art). */
export function mazeSvg(maze: MazeAnswer): string {
  const { cols, rows } = maze;
  const cell = 40;
  const pad = 22;
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2;
  const map = (n: number) => pad + n * cell;

  const walls = mazeWalls(maze)
    .map(
      (s) =>
        `<line x1="${map(s.x1)}" y1="${map(s.y1)}" x2="${map(s.x2)}" y2="${map(s.y2)}"/>`,
    )
    .join("");

  const start = cellCenter(maze, 0);
  const end = cellCenter(maze, cols * rows - 1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="#ffffff"/>
<g stroke="#2b2440" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">${walls}</g>
<circle cx="${map(start.x)}" cy="${map(start.y)}" r="${cell * 0.3}" fill="#21c7b6"/>
<g transform="translate(${map(end.x)}, ${map(end.y)})">
<circle r="${cell * 0.32}" fill="#ff5ca8"/>
<path d="M${-cell * 0.16} 0 L${cell * 0.16} 0 M0 ${-cell * 0.16} L0 ${cell * 0.16}" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
</g>
</svg>`;
}
