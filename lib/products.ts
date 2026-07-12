/**
 * The shop catalog. Wonder Pages sells pre-built, personalized printed books;
 * the customer picks a product, configures it (name + options), previews it,
 * and places a manual order. Three things to buy:
 *
 *   activity  → a 40-page themed activity book; options: theme + child's age
 *   alphabet  → an A-to-Z handwriting book;      options: language (en/hr)
 *   numbers   → a 0-to-9 handwriting book (HR);  no options
 *   bundle    → alphabet + numbers together, cheaper (the "oba kompleta" offer)
 *
 * All are personalized with the child's name. Structural data lives here;
 * customer-facing names/descriptions live in lib/landing-copy.ts (bilingual).
 */

export type ProductId = "activity" | "alphabet" | "numbers" | "bundle";

/** Per-product price (Croatia is on the euro; cents). */
export const PRODUCT_PRICE_CENTS: Record<ProductId, number> = {
  activity: 2500,
  alphabet: 1500,
  numbers: 1500,
  bundle: 2500,
};

export const PRODUCT_CURRENCY = "eur";

/**
 * Delivery fee per method (cents), within Croatia. BoxNow = a small parcel to a
 * locker (our send cost is ~€1–2); pošta = home delivery of a small parcel.
 * The order total = items + the chosen method's fee.
 */
export const DELIVERY_FEE_CENTS: Record<"boxnow" | "posta", number> = {
  boxnow: 100,
  posta: 399,
};

/** What buying the bundle (alphabet + numbers) saves vs. the two separately. */
export const BUNDLE_SAVING_CENTS =
  PRODUCT_PRICE_CENTS.alphabet + PRODUCT_PRICE_CENTS.numbers - PRODUCT_PRICE_CENTS.bundle;

/**
 * The child ages a product can be tuned to. Products whose content adapts to
 * the child's age (difficulty mapped from age — the buyer picks an age, not a
 * "level") declare their window here; `false` means the wizard doesn't ask.
 */
export type AgeWindow = { min: number; max: number };

/** Server-side sanity bounds for any child age, across all products. */
export const AGE_MIN = 3;
export const AGE_MAX = 10;

export interface ProductConfig {
  id: ProductId;
  priceCents: number;
  /** Which options the configure wizard must collect for this product. */
  needs: { theme: boolean; age: AgeWindow | false; language: boolean };
  /** The single-product ids this product delivers (bundle = both). */
  includes: Exclude<ProductId, "bundle">[];
}

export const PRODUCTS: Record<ProductId, ProductConfig> = {
  activity: {
    id: "activity",
    priceCents: PRODUCT_PRICE_CENTS.activity,
    needs: { theme: true, age: { min: 3, max: 8 }, language: false },
    includes: ["activity"],
  },
  alphabet: {
    id: "alphabet",
    priceCents: PRODUCT_PRICE_CENTS.alphabet,
    needs: { theme: false, age: false, language: true },
    includes: ["alphabet"],
  },
  numbers: {
    id: "numbers",
    priceCents: PRODUCT_PRICE_CENTS.numbers,
    needs: { theme: false, age: false, language: false },
    includes: ["numbers"],
  },
  bundle: {
    id: "bundle",
    priceCents: PRODUCT_PRICE_CENTS.bundle,
    needs: { theme: false, age: false, language: false },
    includes: ["alphabet", "numbers"],
  },
};

export const PRODUCT_IDS = Object.keys(PRODUCTS) as ProductId[];

export function isProductId(value: unknown): value is ProductId {
  return typeof value === "string" && value in PRODUCTS;
}

export function priceLabelCents(cents: number): string {
  return `€${(cents / 100).toFixed(0)}`;
}

/** Like priceLabelCents but keeps the cents when they're non-zero (e.g. "€3,99"). */
export function priceLabelCentsExact(cents: number): string {
  const eur = cents / 100;
  return Number.isInteger(eur) ? `€${eur}` : `€${eur.toFixed(2).replace(".", ",")}`;
}

export function productPriceLabel(id: ProductId): string {
  return priceLabelCents(PRODUCT_PRICE_CENTS[id]);
}
