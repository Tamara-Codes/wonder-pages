"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * The one header across the shop (landing, products, wizard). Brand → home.
 * (Croatian-only.)
 */
export function ShopHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[rgba(255,251,242,0.92)] backdrop-blur">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-2 gap-3">
        <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tight inline-flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="Maštograd" width={48} height={48} priority />
          <span>
            <span style={{ color: "var(--pink)" }}>Mašto</span>
            <span style={{ color: "var(--teal)" }}>grad</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
