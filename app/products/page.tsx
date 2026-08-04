import type { Metadata } from "next";
import { ShopHeader } from "@/components/shop-header";
import { ProductCard } from "@/components/product-card";
import { COPY } from "@/lib/landing-copy";
import { productPriceLabel } from "@/lib/products";

export const metadata: Metadata = {
  alternates: { canonical: "/products" },
};

// The full chooser: every standalone product, side by side.
const CHOOSER_PRODUCTS = [
  { id: "alphabet" as const, accent: "var(--teal)", accentDark: "var(--teal-d)" },
  { id: "numbers" as const, accent: "var(--purple)", accentDark: "var(--purple-d)" },
];

export default function ProductsPage() {
  const c = COPY;
  return (
    <div className="flex flex-col min-h-full">
      <ShopHeader />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-14 sm:py-20 w-full">
        <div className="text-center">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{c.products.heading}</h1>
          <p className="text-muted font-semibold mt-2">{c.products.sub}</p>
        </div>
        <div className="mt-10 space-y-8">
          {CHOOSER_PRODUCTS.map(({ id, accent, accentDark }) => (
            <div key={id}>
              <h2 className="font-display text-xl font-extrabold mb-3">{c.products.cards[id].name}</h2>
              <ProductCard
                price={productPriceLabel(id)}
                contents={c.products.cards[id].contents}
                href={`/products/${id}`}
                cta={c.products.choose}
                accent={accent}
                accentDark={accentDark}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
