/**
 * Item sprites for the seek-and-find ("Find It!") game.
 *
 * The kid hunts a checklist of these items inside a busy generated scene. As
 * always in Wonder Pages, the AI only draws the *background* — our code
 * composites these sprites at coordinates WE choose (see app/api/generate),
 * so every tap is verifiable.
 *
 * Each shape is drawn on a 0..100 box; `wrap` puts it on a padded viewBox with
 * a soft drop shadow so the rasterized sprite "sits" on the scene instead of
 * looking pasted on. Flat fills + uniform dark outlines match the flat-vector
 * art style we prompt the image model for, so the items blend in.
 */

export interface FindItemDef {
  key: string;
  label: string;
}

const SHAPES: Record<string, { label: string; inner: string }> = {
  star: {
    label: "Star",
    inner: `<path d="M50 6 L62 38 L96 40 L68 62 L78 95 L50 74 L22 95 L32 62 L4 40 L38 38 Z" fill="#ffc93c" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/>`,
  },
  key: {
    label: "Key",
    inner: `<g fill="#ffd24d" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"><circle cx="30" cy="50" r="20"/><rect x="46" y="44" width="50" height="12" rx="3"/><rect x="78" y="56" width="9" height="16" rx="2"/><rect x="92" y="56" width="8" height="11" rx="2"/></g><circle cx="30" cy="50" r="7" fill="#fff" stroke="#2e2a3f" stroke-width="4"/>`,
  },
  bell: {
    label: "Bell",
    inner: `<g fill="#ff9f1c" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"><rect x="44" y="6" width="12" height="12" rx="4"/><path d="M50 14 C30 14 26 40 22 64 C20 76 14 80 14 80 L86 80 C86 80 80 76 78 64 C74 40 70 14 50 14 Z"/><circle cx="50" cy="88" r="8"/></g>`,
  },
  apple: {
    label: "Apple",
    inner: `<path d="M52 26 q8 -16 22 -18" fill="none" stroke="#2e2a3f" stroke-width="5"/><path d="M54 22 q12 -8 20 -2 q-6 12 -20 4 Z" fill="#46c36a" stroke="#2e2a3f" stroke-width="4" stroke-linejoin="round"/><path d="M50 32 C40 20 16 24 16 50 C16 76 38 94 50 94 C62 94 84 76 84 50 C84 24 60 20 50 32 Z" fill="#e84a5f" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/>`,
  },
  boot: {
    label: "Boot",
    inner: `<path d="M34 10 L60 10 L62 58 L86 62 Q94 64 94 76 L94 90 L28 90 Q24 90 24 82 L28 18 Q28 10 34 10 Z" fill="#3da5ff" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/>`,
  },
  gift: {
    label: "Gift",
    inner: `<g stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"><rect x="18" y="42" width="64" height="46" rx="4" fill="#ff5ca8"/><rect x="14" y="30" width="72" height="16" rx="4" fill="#ff7ab8"/><rect x="44" y="30" width="12" height="58" fill="#ffd24d"/><path d="M50 30 C40 12 16 18 30 30 Z M50 30 C60 12 84 18 70 30 Z" fill="#ffd24d"/></g>`,
  },
  ring: {
    label: "Ring",
    inner: `<circle cx="50" cy="62" r="26" fill="none" stroke="#ffd24d" stroke-width="9"/><path d="M38 36 L50 14 L62 36 Z" fill="#9be8ff" stroke="#2e2a3f" stroke-width="4" stroke-linejoin="round"/>`,
  },
  ball: {
    label: "Ball",
    inner: `<circle cx="50" cy="50" r="40" fill="#ff7a45" stroke="#2e2a3f" stroke-width="5"/><path d="M14 42 Q50 30 86 42 M14 58 Q50 70 86 58 M50 11 V89" fill="none" stroke="#2e2a3f" stroke-width="4"/>`,
  },
  heart: {
    label: "Heart",
    inner: `<path d="M50 86 C20 64 10 44 10 30 C10 16 22 8 34 8 C42 8 48 14 50 22 C52 14 58 8 66 8 C78 8 90 16 90 30 C90 44 80 64 50 86 Z" fill="#ff5c7a" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/>`,
  },
  moon: {
    label: "Moon",
    inner: `<path d="M62 8 A42 42 0 1 0 62 92 A32 32 0 1 1 62 8 Z" fill="#ffd24d" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/>`,
  },
  fish: {
    label: "Fish",
    inner: `<g stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"><path d="M14 50 Q40 22 70 50 Q40 78 14 50 Z" fill="#3da5ff"/><path d="M70 50 L92 34 L88 50 L92 66 Z" fill="#3da5ff"/></g><circle cx="30" cy="46" r="4" fill="#2e2a3f"/>`,
  },
  crown: {
    label: "Crown",
    inner: `<path d="M16 78 L22 34 L40 56 L50 26 L60 56 L78 34 L84 78 Z" fill="#ffc93c" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/><circle cx="22" cy="34" r="5" fill="#ff5c7a" stroke="#2e2a3f" stroke-width="3"/><circle cx="50" cy="26" r="5" fill="#ff5c7a" stroke="#2e2a3f" stroke-width="3"/><circle cx="78" cy="34" r="5" fill="#ff5c7a" stroke="#2e2a3f" stroke-width="3"/>`,
  },
  flower: {
    label: "Flower",
    inner: `<g stroke="#2e2a3f" stroke-width="4" stroke-linejoin="round"><circle cx="50" cy="22" r="15" fill="#ff7ab8"/><circle cx="78" cy="50" r="15" fill="#ff7ab8"/><circle cx="50" cy="78" r="15" fill="#ff7ab8"/><circle cx="22" cy="50" r="15" fill="#ff7ab8"/></g><circle cx="50" cy="50" r="15" fill="#ffd24d" stroke="#2e2a3f" stroke-width="4"/>`,
  },
  leaf: {
    label: "Leaf",
    inner: `<path d="M20 80 C20 40 50 14 84 16 C86 50 60 80 20 80 Z" fill="#46c36a" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/><path d="M28 72 Q52 48 78 26" fill="none" stroke="#2e2a3f" stroke-width="4"/>`,
  },
  balloon: {
    label: "Balloon",
    inner: `<path d="M50 8 C68 8 78 22 78 40 C78 60 60 72 50 72 C40 72 22 60 22 40 C22 22 32 8 50 8 Z" fill="#9b6cff" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/><path d="M50 72 L45 82 L55 82 Z" fill="#9b6cff" stroke="#2e2a3f" stroke-width="4" stroke-linejoin="round"/><path d="M50 82 q7 8 -2 16" fill="none" stroke="#2e2a3f" stroke-width="3"/>`,
  },
  car: {
    label: "Car",
    inner: `<path d="M6 66 L14 46 Q34 28 50 28 Q66 28 80 46 L94 50 L94 66 Z" fill="#e84a5f" stroke="#2e2a3f" stroke-width="5" stroke-linejoin="round"/><path d="M30 44 Q40 32 50 32 L50 44 Z" fill="#9be8ff" stroke="#2e2a3f" stroke-width="3"/><circle cx="30" cy="68" r="11" fill="#2e2a3f"/><circle cx="30" cy="68" r="4" fill="#fff"/><circle cx="72" cy="68" r="11" fill="#2e2a3f"/><circle cx="72" cy="68" r="4" fill="#fff"/>`,
  },
};

function wrap(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -10 128 132" width="128" height="132"><defs><filter id="sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1a1530" flood-opacity="0.4"/></filter></defs><g filter="url(#sh)">${inner}</g></svg>`;
}

export const FIND_ITEM_KEYS = Object.keys(SHAPES);

export function findItemLabel(key: string): string {
  return SHAPES[key]?.label ?? key;
}

/** Full SVG (with shadow) for one item, ready to rasterize or use as a data URI. */
export function findItemSvg(key: string): string {
  return wrap(SHAPES[key]?.inner ?? "");
}

/** Convenience for <img src>: the item sprite as an inline data URI. */
export function findItemDataUri(key: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(findItemSvg(key))}`;
}

/** Pick `n` distinct item keys at random (defaults to Math.random; injectable for tests). */
export function pickFindItems(n: number, rnd: () => number = Math.random): string[] {
  const pool = [...FIND_ITEM_KEYS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}
