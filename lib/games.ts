export type GameId = "coloring" | "find-it" | "spot-difference";

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
    id: "find-it",
    name: "Find It!",
    emoji: "🔍",
    tagline: "Hunt the hidden things",
    description:
      "A busy scene packed with surprises. Your child ticks off every hidden item on the list — a search-and-find adventure.",
    ages: "Ages 4–9",
    badge: "Quick to play",
    available: true,
  },
  {
    id: "spot-difference",
    name: "Spot the Difference",
    emoji: "🔎",
    tagline: "Find what changed",
    description:
      "Two almost-matching scenes, side by side. A few things have quietly changed — your child hunts down every difference.",
    ages: "Ages 4–9",
    badge: "Sharp eyes",
    available: true,
  },
];

export const GAME_MAP: Record<GameId, Game> = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
) as Record<GameId, Game>;
