"use client";

import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { Gift } from "@/components/icons";
import { COPY } from "@/lib/landing-copy";

/**
 * The one header across the shop (landing, products, wizard). Brand → home and
 * a primary CTA into the catalog. (Croatian-only.)
 */
export function ShopHeader() {
  const c = COPY;
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[rgba(255,251,242,0.92)] backdrop-blur">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-3.5 gap-3">
        <Link href="/" className="font-display text-lg sm:text-[22px] font-extrabold inline-flex items-center gap-2 shrink-0">
          <BrandLockup />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/#kompleti"
            className="btn-glow font-display font-extrabold text-sm text-white rounded-full px-5 py-2.5 inline-flex items-center gap-2"
            style={{ background: "var(--teal)" }}
          >
            <Gift size={16} /> {c.orderCta}
          </Link>
        </div>
      </div>
    </header>
  );
}
