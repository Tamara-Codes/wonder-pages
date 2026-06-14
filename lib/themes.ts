export type ThemeId =
  | "princess"
  | "unicorns"
  | "space"
  | "dinosaurs"
  | "ocean"
  | "race-cars";

export interface Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  /** Accent color used across the UI for this theme. */
  color: string;
  /** Soft background tint paired with `color`. */
  tint: string;
  /** Fragment injected into the image-generation prompt. */
  prompt: string;
}

export const THEMES: Theme[] = [
  {
    id: "princess",
    name: "Princesses",
    emoji: "👑",
    color: "#e0529c",
    tint: "#ffe6f2",
    prompt:
      "fairytale princesses with sparkling crowns, a magical castle, royal gowns and friendly woodland helpers",
  },
  {
    id: "unicorns",
    name: "Unicorns",
    emoji: "🦄",
    color: "#ff5ca8",
    tint: "#ffe6f2",
    prompt: "magical unicorns, rainbows, sparkles and castles",
  },
  {
    id: "space",
    name: "Space",
    emoji: "🚀",
    color: "#8a6cff",
    tint: "#ece7ff",
    prompt: "outer space with rockets, planets, stars and friendly astronauts",
  },
  {
    id: "dinosaurs",
    name: "Dinosaurs",
    emoji: "🦕",
    color: "#46c36a",
    tint: "#e4f7e9",
    prompt: "friendly cartoon dinosaurs in a prehistoric jungle with volcanoes",
  },
  {
    id: "ocean",
    name: "Under the Sea",
    emoji: "🐠",
    color: "#3da5ff",
    tint: "#e3f1ff",
    prompt: "an underwater ocean scene with fish, dolphins, coral and treasure",
  },
  {
    id: "race-cars",
    name: "Race Cars",
    emoji: "🏎️",
    color: "#ff7a45",
    tint: "#ffe9df",
    prompt: "fast race cars on a winding track with flags and trophies",
  },
];

export const THEME_MAP: Record<ThemeId, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
) as Record<ThemeId, Theme>;
