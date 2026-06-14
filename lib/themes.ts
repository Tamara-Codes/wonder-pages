export type ThemeId =
  | "princess"
  | "unicorns"
  | "space"
  | "dinosaurs"
  | "ocean"
  | "race-cars"
  | "ghosts"
  | "mermaids"
  | "animals"
  | "sports"
  | "sweets";

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
  {
    id: "ghosts",
    name: "Ghosts",
    emoji: "👻",
    color: "#6c8cff",
    tint: "#e9eeff",
    prompt:
      "friendly, cute cartoon ghosts floating among pumpkins, bats and a spooky-but-happy haunted house",
  },
  {
    id: "mermaids",
    name: "Mermaids",
    emoji: "🧜‍♀️",
    color: "#16b8a6",
    tint: "#dcf7f1",
    prompt:
      "friendly mermaids with flowing hair and shimmering tails, seashells, pearls and an underwater coral palace",
  },
  {
    id: "animals",
    name: "Animals",
    emoji: "🐾",
    color: "#e8932f",
    tint: "#fdeedd",
    prompt:
      "a cheerful group of friendly cartoon animals — a lion, elephant, rabbit and bear — in a sunny meadow",
  },
  {
    id: "sports",
    name: "Sports",
    emoji: "⚽",
    color: "#f0453f",
    tint: "#ffe3e1",
    prompt:
      "happy kids playing sports with a soccer ball, basketball, trophy and medals on a sunny field",
  },
  {
    id: "sweets",
    name: "Sweets",
    emoji: "🍭",
    color: "#c86be0",
    tint: "#f6e6fb",
    prompt:
      "a whimsical candy land with lollipops, cupcakes, candy canes, gumdrops and ice cream",
  },
];

export const THEME_MAP: Record<ThemeId, Theme> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
) as Record<ThemeId, Theme>;
