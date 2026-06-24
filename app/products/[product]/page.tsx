"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShopHeader } from "@/components/shop-header";
import { ConfigureWizard } from "@/components/configure-wizard";
import { COPY } from "@/lib/landing-copy";
import { isProductId } from "@/lib/products";

export default function ConfigurePage() {
  const c = COPY;
  const params = useParams<{ product: string }>();
  const product = params?.product;

  return (
    <div className="flex flex-col min-h-full">
      <ShopHeader />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-10 sm:py-14 w-full">
        {isProductId(product) ? (
          <ConfigureWizard product={product} copy={c} />
        ) : (
          <div className="text-center py-16">
            <p className="font-display text-xl font-extrabold">404</p>
            <Link href="/products" className="text-teal font-display font-bold underline mt-2 inline-block">
              {c.nav.products}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
