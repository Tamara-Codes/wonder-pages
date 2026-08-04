import type { Metadata } from "next";
import { COPY } from "@/lib/landing-copy";
import { isProductId, productPriceLabel } from "@/lib/products";

// The page itself is a client component (the wizard), so per-product
// title/description live here in a server layout.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  if (!isProductId(product)) return {};
  const card = COPY.products.cards[product];
  const title = `${card.name} (${productPriceLabel(product)})`;
  return {
    title,
    description: `${card.tagline} Personalizirano imenom djeteta, ručno izrađeno i dostavljeno u Hrvatskoj.`,
    openGraph: { title: `${title} · Maštograd`, description: card.tagline },
    alternates: { canonical: `/products/${product}` },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
