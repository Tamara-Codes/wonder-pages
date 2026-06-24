/**
 * Icon vocabulary — the shared picture set every puzzle is built from.
 *
 * These are flat-vector Noto Emoji SVGs vendored under public/icons/<key>.svg
 * (Apache-2.0). Using a fixed, *keyed* vocabulary instead of raw emoji means:
 *   • every picture is a real, consistent, print-ready vector (no OS-dependent
 *     emoji glyphs, and the My Games thumbnail can render the SAME art);
 *   • the games compose puzzles by picking KEYS from this list, so a picture
 *     can never be "missing" or render as tofu.
 *
 * Browser tiles load the SVG via `iconSrc(key)`. Server-side thumbnail
 * compositing reads the same files (see lib/icons-server).
 */

/** key → child-friendly label (also the aria-label / printed caption). */
export const ICONS: Record<string, string> = {
  // animals
  dog: "dog", cat: "cat", rabbit: "rabbit", fox: "fox", bear: "bear",
  lion: "lion", tiger: "tiger", cow: "cow", pig: "pig", monkey: "monkey",
  horse: "horse", elephant: "elephant", mouse: "mouse", frog: "frog",
  // birds
  chicken: "hen", owl: "owl", penguin: "penguin", bird: "bird", chick: "chick",
  // bugs
  bee: "bee", ladybug: "ladybug", butterfly: "butterfly", snail: "snail", spider: "spider",
  // sea
  fish: "fish", tropicalfish: "tropical fish", octopus: "octopus", crab: "crab",
  dolphin: "dolphin", whale: "whale", shark: "shark", shrimp: "shrimp", turtle: "turtle",
  // fruit
  apple: "apple", banana: "banana", strawberry: "strawberry", grapes: "grapes",
  orange: "orange", watermelon: "watermelon", pear: "pear", peach: "peach",
  cherries: "cherries", lemon: "lemon", pineapple: "pineapple",
  // vegetables
  carrot: "carrot", broccoli: "broccoli", corn: "corn", tomato: "tomato",
  potato: "potato", mushroom: "mushroom",
  // vehicles
  car: "car", bus: "bus", train: "train", airplane: "plane", bicycle: "bike",
  rocket: "rocket", sailboat: "boat", helicopter: "helicopter", truck: "truck", tractor: "tractor",
  // treats
  pizza: "pizza", icecream: "ice cream", donut: "donut", cookie: "cookie",
  cupcake: "cupcake", lollipop: "lollipop", cake: "cake", candy: "candy",
  // sky
  sun: "sun", cloud: "cloud", rainbow: "rainbow", star: "star", moon: "moon", snowflake: "snowflake",
  // plants
  tulip: "tulip", sunflower: "sunflower", rose: "rose", tree: "tree",
  cactus: "cactus", leaf: "leaf", lotus: "lily pad",
  // clothes
  shirt: "shirt", jeans: "jeans", socks: "sock", shoe: "shoe", cap: "cap",
  dress: "dress", gloves: "gloves", hat: "hat",
  // instruments
  guitar: "guitar", drum: "drum", trumpet: "trumpet", violin: "violin",
  saxophone: "saxophone", piano: "piano",
  // play things
  balloon: "balloon", gift: "present", soccer: "football", basketball: "basketball",
  crown: "crown", bell: "bell",
  // pair partners & odds-and-ends
  key: "key", lock: "lock", umbrella: "umbrella", book: "book", pencil: "pencil",
  scissors: "scissors", clock: "clock", mug: "mug", snowman: "snowman",
  bone: "bone", yarn: "wool", milk: "milk", egg: "egg", butter: "butter",
  needle: "needle", thread: "thread", baby: "baby", bottle: "bottle",
  web: "web", nest: "nest", wave: "wave", fuel: "fuel pump", sunglasses: "sunglasses",
  tooth: "tooth", toothbrush: "toothbrush", bread: "bread", cheese: "cheese", palette: "paints",
  // alphabet additions (see lib/alphabet.ts), pulled from Noto Emoji to match
  // the existing set. NOT added to CATEGORIES/PAIRS, so the picture games ignore
  // them. The pictures double as captions: jug=Ćup, jam=Džem, pupil=Đak (a
  // school bag), snout=Njuška (a pig nose), hook=Udica, heart=Ljubav.
  zebra: "zebra", jug: "jug", jam: "jam", pupil: "school bag", flute: "flute",
  snout: "snout", hook: "hook", heart: "heart",
  xylophone: "xylophone", // the ONE icon with no Noto match — art still to draw
  // theme mascots (decorative) — used as the hero + goal markers that make
  // mazes/tracing theme-coherent (see lib/theme-icons.ts). Like the alphabet
  // additions, kept OUT of CATEGORIES/PAIRS so the picture games ignore them.
  unicorn: "unicorn", castle: "castle", planet: "planet", volcano: "volcano",
  dino: "dinosaur", shell: "shell", trophy: "trophy", ghost: "ghost",
  pumpkin: "pumpkin", princess: "princess", mermaid: "mermaid",
  gem: "treasure", teddy: "teddy bear",
};

/** Keys whose SVG art is not yet drawn — render will 404 until drawn. */
export const PENDING_ICON_KEYS = ["xylophone"] as const;

export const ICON_KEYS = Object.keys(ICONS);

export function iconLabel(key: string): string {
  return ICONS[key] ?? key;
}

/** Public URL of the icon for a browser <img>. */
export function iconSrc(key: string): string {
  return `/icons/${key}.svg`;
}

/**
 * Categories for Odd One Out — each group shows four from one category plus one
 * outsider. Kept disjoint (a key lives in only one category) so the "odd" one
 * from another category is never secretly a member too.
 */
export const CATEGORIES: Record<string, string[]> = {
  animals: ["dog", "cat", "rabbit", "fox", "bear", "lion", "tiger", "cow", "pig", "monkey", "horse", "elephant", "mouse"],
  birds: ["chicken", "owl", "penguin", "bird", "chick"],
  bugs: ["bee", "ladybug", "butterfly", "snail", "spider"],
  "sea animals": ["fish", "tropicalfish", "octopus", "crab", "dolphin", "whale", "shark", "shrimp", "turtle"],
  fruit: ["apple", "banana", "strawberry", "grapes", "orange", "watermelon", "pear", "peach", "cherries", "lemon", "pineapple"],
  vegetables: ["carrot", "broccoli", "corn", "tomato", "potato", "mushroom"],
  vehicles: ["car", "bus", "train", "airplane", "bicycle", "rocket", "sailboat", "helicopter", "truck", "tractor"],
  treats: ["pizza", "icecream", "donut", "cookie", "cupcake", "lollipop", "cake", "candy"],
  "in the sky": ["sun", "cloud", "rainbow", "star", "moon", "snowflake"],
  plants: ["tulip", "sunflower", "rose", "tree", "cactus", "leaf"],
  clothes: ["shirt", "jeans", "socks", "shoe", "cap", "dress", "gloves", "hat"],
  instruments: ["guitar", "drum", "trumpet", "violin", "saxophone", "piano"],
};

/** Categories that are easy to confuse, for the "tricky" odd-one-out level. */
export const RELATED: Record<string, string[]> = {
  animals: ["birds", "bugs", "sea animals"],
  birds: ["animals", "bugs"],
  bugs: ["animals", "birds"],
  "sea animals": ["animals", "birds"],
  fruit: ["vegetables", "treats"],
  vegetables: ["fruit", "treats"],
  treats: ["fruit", "vegetables"],
  plants: ["in the sky"],
  "in the sky": ["plants"],
};

/**
 * Association pairs for Match the Pairs — two different things that obviously
 * go together. No key repeats across pairs, so any subset is a valid puzzle.
 */
export const PAIRS: [string, string][] = [
  ["bee", "tulip"],
  ["dog", "bone"],
  ["cat", "yarn"],
  ["key", "lock"],
  ["socks", "shoe"],
  ["cow", "milk"],
  ["chicken", "egg"],
  ["baby", "bottle"],
  ["spider", "web"],
  ["bird", "nest"],
  ["needle", "thread"],
  ["tooth", "toothbrush"],
  ["rabbit", "carrot"],
  ["monkey", "banana"],
  ["fish", "wave"],
  ["moon", "star"],
  ["frog", "lotus"],
  ["sun", "sunglasses"],
  ["snowman", "snowflake"],
  ["car", "fuel"],
  ["pencil", "book"],
  ["bread", "butter"],
  ["mouse", "cheese"],
];
