// Credit pricing. 1 credit = 1 game generation.
// Anchored to the two headline packs: 15 credits = €5, 60 credits = €10.
// The top-up slider uses the same curve, so price-per-game drops as you buy more.

export interface Pack {
  credits: number;
  label: string;
  badge?: string;
}

export const PACKS: Pack[] = [
  { credits: 15, label: "Starter" },
  { credits: 60, label: "Family", badge: "Best value" },
];

// Minimum top-up = 4 games (~€2.17) so Stripe's fixed ~€0.25 fee stays a small
// share of the charge. (No integer credit count lands exactly on €2.)
export const MIN_CREDITS = 4;
export const MAX_CREDITS = 100;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/** Per-credit price in cents — decreases with quantity. */
export function perCreditCents(n: number): number {
  if (n <= 15) return lerp(60, 33.333, (n - 1) / 14); // €0.60 → €0.333
  if (n <= 60) return lerp(33.333, 16.667, (n - 15) / 45); // €0.333 → €0.167
  return lerp(16.667, 14, (n - 60) / 40); // €0.167 → €0.14
}

/** Total price in cents for `n` credits. */
export function priceCents(n: number): number {
  const clamped = Math.min(MAX_CREDITS, Math.max(MIN_CREDITS, Math.round(n)));
  return Math.round(clamped * perCreditCents(clamped));
}

/** "€7.50" style formatting from a credit count. */
export function priceLabel(n: number): string {
  return `€${(priceCents(n) / 100).toFixed(2)}`;
}
