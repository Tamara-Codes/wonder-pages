export type GameId =
  | "coloring"
  | "maze"
  | "match-pairs"
  | "tracing"
  | "odd-one-out";

export interface Game {
  id: GameId;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  /** Recommended age range, shown as a card badge. */
  ages: string;
  /** Short "what you get" badge, e.g. how it plays. */
  badge: string;
  /** False = shown but not yet playable (coming soon). */
  available: boolean;
}

export const GAMES: Game[] = [
  {
    id: "coloring",
    name: "Coloring Book",
    emoji: "🎨",
    tagline: "Color it your way",
    description:
      "We draw a magical black-and-white scene. Your child brings it to life with color — on screen or printed.",
    ages: "Ages 3–8",
    badge: "Calm & creative",
    available: true,
  },
  {
    id: "maze",
    name: "Maze",
    emoji: "🌀",
    tagline: "Find your way out",
    description:
      "A twisting path from start to finish. Your child traces the one true route through the maze with a finger — no dead end too tricky.",
    ages: "Ages 4–9",
    badge: "Trace the path",
    available: true,
  },
  {
    id: "match-pairs",
    name: "Match the Pairs",
    emoji: "🧩",
    tagline: "What goes together?",
    description:
      "Two columns of pictures: a bee and a flower, a fish and a pond, a key and a lock. Your child draws a line joining each thing to the one it belongs with.",
    ages: "Ages 3–6",
    badge: "Match & connect",
    available: true,
  },
  {
    id: "tracing",
    name: "Tracing",
    emoji: "✏️",
    tagline: "Trace the lines",
    description:
      "Dashed lines, hills, waves and loops to trace over. Your child follows each one from the green dot to the end — the hand control that handwriting starts with.",
    ages: "Ages 3–6",
    badge: "Pencil control",
    available: true,
  },
  {
    id: "odd-one-out",
    name: "Odd One Out",
    emoji: "🔎",
    tagline: "Which one doesn't belong?",
    description:
      "Little groups of pictures — four that go together and one that doesn't, like four flowers and a bee. Your child spots the odd one in each group.",
    ages: "Ages 4–9",
    badge: "Think & sort",
    available: true,
  },
];

export const GAME_MAP: Record<GameId, Game> = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
) as Record<GameId, Game>;
