"use client";

import { Fragment, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Gift, Palette } from "@/components/icons";
import { ShopHeader } from "@/components/shop-header";
import { COPY } from "@/lib/landing-copy";
import { ALPHABET_COPY } from "@/lib/alphabet-landing";
import {
  productPriceLabel,
  priceLabelCents,
  PRODUCT_PRICE_CENTS,
  BUNDLE_SAVING_CENTS,
} from "@/lib/products";

const PRODUCTS_ANCHOR = "#kompleti";

// The two standalone sets; the Komplet card below them gets the featured
// soft-teal panel treatment (same device as the leaf section).
const SETS = ["alphabet", "numbers"] as const;

// The page runs on the two wordmark colours only: coral + teal, alternating
// (index % 2) through pills and step titles.
const TINTS = [
  { bg: "var(--pink-soft)", fg: "var(--pink-d)" },
  { bg: "var(--teal-soft)", fg: "var(--teal-d)" },
];

// Carousel photos — one per caption in ALPHABET_COPY.format.slides. Real photos
// of the finished product. Any path that doesn't exist shows a placeholder.
const SHOWCASE_IMAGES = [
  "/showcase/photo-gift.png",   // gift packaging with personalized tag
  "/showcase/photo-pages.jpg",  // printed cover + alphabet coloring pages
];

export default function Home() {
  const c = ALPHABET_COPY;
  const shop = COPY;
  const sampleName = "Ema";
  const separateTotal = priceLabelCents(PRODUCT_PRICE_CENTS.alphabet + PRODUCT_PRICE_CENTS.numbers);

  return (
    <div className="flex flex-col min-h-full">
      <ShopHeader />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-5xl px-6 pt-10 sm:pt-16 pb-10 sm:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <p className="pop text-xs font-bold uppercase tracking-[0.18em] text-muted" style={{ animationDelay: "0.04s" }}>
                {c.hero.eyebrow}
              </p>
              <h1 className="pop font-extrabold tracking-tight leading-[1.08] mt-4 text-[clamp(30px,4.6vw,50px)]" style={{ animationDelay: "0.1s" }}>
                <Title title={c.hero.title} name={c.hero.titleName} box={c.hero.titleBox} />
              </h1>
              <p className="pop mt-5 text-base sm:text-lg leading-relaxed text-muted max-w-xl mx-auto lg:mx-0" style={{ animationDelay: "0.16s" }}>
                {c.hero.subtitle}
              </p>
              <div className="pop mt-8 flex flex-col items-center lg:items-start gap-3" style={{ animationDelay: "0.24s" }}>
                <Link href={PRODUCTS_ANCHOR} className="btn-glow font-extrabold text-xl rounded-full px-10 py-4 inline-flex items-center gap-2.5" style={{ background: "var(--teal-light)", color: "var(--foreground)" }}>
                  <Gift size={22} /> {c.hero.cta}
                </Link>
              </div>
            </div>

            {/* the printed product — a personalized keepsake set (sample) */}
            <div className="pop relative mx-auto lg:mx-0 lg:ml-auto w-full max-w-[640px] mt-4 lg:mt-0" style={{ animationDelay: "0.16s" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hero-pages.jpg" alt={`${sampleName} — ${c.hero.coverLabel}`} className="w-full h-auto rounded-2xl shadow-pop ring-1 ring-black/5" />
            </div>
          </div>

          {/* trust pills in the three logo colours */}
          <ul className="pop mt-12 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.3s" }}>
            {c.trust.map((label, i) => (
              <li
                key={label}
                className="rounded-full px-5 py-2.5 text-sm font-bold"
                style={{ background: TINTS[i % 2].bg, color: TINTS[i % 2].fg }}
              >
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Product photos (carousel) ────────────────────────── */}
        <section>
          <div className="mx-auto max-w-4xl px-6 py-14 sm:py-18">
            <Showcase slides={c.format.slides} images={SHOWCASE_IMAGES} />
          </div>
        </section>

        {/* ── What's on every leaf (anatomy of one leaf) ───────── */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          {/* Soft teal panel so the white sample pages stand out; text in ink. */}
          <div className="grid items-center gap-12 lg:grid-cols-2 rounded-2xl shadow-pop p-8 sm:p-12" style={{ background: "var(--teal-light)" }}>
            <div className="order-2 lg:order-1">
              <h2 className="font-extrabold tracking-tight text-2xl sm:text-3xl text-white">{c.leaf.heading}</h2>
              <p className="font-semibold mt-3" style={{ color: "rgba(43,36,64,0.78)" }}>{c.leaf.sub}</p>
              <ol className="mt-8 space-y-6">
                {c.leaf.steps.map((s) => (
                  <li key={s.title}>
                    <h3 className="font-extrabold text-lg leading-tight text-white">{s.title}</h3>
                    <p className="text-[15px] font-semibold mt-1.5 leading-snug" style={{ color: "rgba(43,36,64,0.78)" }}>{s.copy}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Each white leaf sits on a slightly rotated pink "leaf" backdrop,
                bringing the brand pink into the teal panel as a graphic (pink
                text on teal would be unreadable). */}
            <div className="order-1 lg:order-2 flex justify-center items-stretch gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl -rotate-3" style={{ background: "var(--pink)" }} aria-hidden />
                <div className="relative w-[190px] sm:w-[240px] aspect-[148/210] rounded-2xl bg-white shadow-pop ring-1 ring-black/5 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/showcase/letter-avion.png"
                    alt="A kao Avion — listić za bojanje"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl rotate-3" style={{ background: "var(--pink)" }} aria-hidden />
                <div className="relative w-[190px] sm:w-[240px] aspect-[148/210] rounded-2xl bg-white shadow-pop ring-1 ring-black/5 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/showcase/number-1.png"
                    alt="1 Jedan — listić za bojanje"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The sets + Komplet ───────────────────────────────── */}
        <section id="kompleti" className="scroll-mt-24">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
            <div className="grid gap-6 sm:grid-cols-2">
              {SETS.map((id) => (
                <div key={id} className="flex flex-col rounded-2xl bg-card shadow-pop-sm p-7 sm:p-8">
                  <h3 className="font-extrabold text-xl">{shop.products.cards[id].name}</h3>
                  <p className="text-sm text-muted font-semibold mt-1.5 leading-snug">{shop.products.cards[id].tagline}</p>
                  <p className="font-extrabold text-4xl mt-5" style={{ color: "var(--pink-d)" }}>{productPriceLabel(id)}</p>
                  <ul className="mt-5 space-y-3 flex-1">
                    {shop.products.cards[id].contents.map((line) => (
                      <li key={line} className="flex items-start gap-2.5 text-[15px] font-semibold">
                        <span className="mt-0.5 shrink-0 font-extrabold" style={{ color: "var(--teal)" }} aria-hidden>✓</span>{line}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/products/${id}`}
                    className="btn-glow font-extrabold text-lg rounded-full mt-7 px-6 py-3.5 inline-flex items-center justify-center gap-2.5"
                    style={{ background: "var(--teal-light)", color: "var(--foreground)" }}
                  >
                    <Gift size={20} /> {c.hero.cta}
                  </Link>
                </div>
              ))}
            </div>

            {/* Komplet — both sets, featured on the same soft-teal panel as the
                leaf section: white titles, ink body, white CTA. */}
            <div className="mt-6 rounded-2xl shadow-pop p-7 sm:p-9" style={{ background: "var(--teal-light)" }}>
              <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <span className="inline-block rounded-full px-4 py-1.5 text-sm font-extrabold" style={{ background: "var(--pink)", color: "var(--foreground)" }}>
                    Ušteda {priceLabelCents(BUNDLE_SAVING_CENTS)}
                  </span>
                  <h3 className="font-extrabold text-2xl mt-4 text-white">Komplet: abeceda + brojevi</h3>
                  <p className="text-sm font-semibold mt-1.5 leading-snug" style={{ color: "rgba(43,36,64,0.78)" }}>{shop.products.cards.bundle.tagline}</p>
                  <ul className="mt-5 space-y-3">
                    {shop.products.cards.bundle.contents.map((line) => (
                      <li key={line} className="flex items-start gap-2.5 text-[15px] font-semibold">
                        <span className="mt-0.5 shrink-0 font-extrabold text-white" aria-hidden>✓</span>{line}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center sm:pl-6">
                  <p className="font-extrabold text-5xl text-white">{productPriceLabel("bundle")}</p>
                  <p className="text-sm font-semibold" style={{ color: "rgba(43,36,64,0.66)" }}>
                    umjesto <span className="line-through">{separateTotal}</span>
                  </p>
                  <Link
                    href="/products/bundle"
                    className="font-extrabold text-lg rounded-full mt-4 px-8 py-3.5 inline-flex items-center justify-center gap-2.5 bg-white shadow-pop-sm lift-sm"
                    style={{ color: "var(--foreground)" }}
                  >
                    <Gift size={20} /> {c.hero.cta}
                  </Link>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-muted font-semibold mt-8 leading-relaxed max-w-2xl mx-auto">{c.pricing.note}</p>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 pt-16 sm:pt-20 pb-16">
          <h2 className="text-center font-display text-2xl sm:text-3xl">{c.faq.heading}</h2>
          <ul className="mt-9 space-y-4">
            {c.faq.items.map((item) => (
              <li key={item.q} className="rounded-2xl bg-card shadow-pop-sm p-6">
                <h3 className="font-display text-lg">{item.q}</h3>
                <p className="text-[15px] text-muted font-semibold mt-2 leading-snug">{item.a}</p>
              </li>
            ))}
          </ul>
          <div className="mt-20 text-center">
            <Link href={PRODUCTS_ANCHOR} className="btn-glow font-extrabold text-lg rounded-full px-9 py-4 inline-flex items-center gap-2.5" style={{ background: "var(--teal-light)", color: "var(--foreground)" }}>
              <Gift size={20} /> {shop.orderCta}
            </Link>
          </div>
        </section>

        <footer className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-center text-sm text-muted font-semibold">{c.footer}</p>
          <p className="mt-2 text-center text-sm">
            <Link href="/privacy" className="text-muted font-semibold underline hover:text-foreground">
              Zaštita privatnosti
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}

/**
 * Photo carousel of the finished product: one image + caption per slide, with
 * arrows and dots. Each image falls back to a placeholder until the real photo
 * is dropped in at its path (see SHOWCASE_IMAGES).
 */
function Showcase({ slides, images }: { slides: { caption: string }[]; images: string[] }) {
  const [i, setI] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const n = slides.length;
  const go = (d: number) => setI((p) => (p + d + n) % n);

  // Slides can have different aspect ratios (portrait gift shot vs landscape
  // pages shot). Rather than lock the frame to the tallest slide — which leaves
  // whitespace on the shorter ones — track the active slide's height and size
  // the frame to it, animating the difference.
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = useState<number[]>([]);
  const measure = useCallback(() => {
    const hs = slideRefs.current.map((el) => el?.offsetHeight ?? 0);
    setHeights((prev) =>
      hs.length === prev.length && hs.every((h, k) => h === prev[k]) ? prev : hs
    );
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="relative">
        <div
          className="relative overflow-hidden rounded-2xl bg-card shadow-pop"
          style={{ height: heights[i] || undefined }}
        >
          {/* Slides crossfade rather than slide horizontally: the active slide
              sits in flow at full height/opacity (defining the frame height),
              while the outgoing one fades out as an overlay on top. This keeps
              the frame fully covered in both directions, so slides of different
              aspect ratios never expose whitespace during the transition. */}
          {slides.map((s, k) => (
            <div
              key={k}
              ref={(el) => { slideRefs.current[k] = el; }}
              className="w-full"
              style={{
                position: k === i ? "relative" : "absolute",
                top: 0,
                left: 0,
                right: 0,
                opacity: k === i ? 1 : 0,
                transition: k === i ? "none" : "opacity 500ms ease-out",
                pointerEvents: k === i ? "auto" : "none",
                zIndex: k === i ? 0 : 1,
              }}
            >
              {images[k] && !failed[k] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[k]}
                  alt={s.caption}
                  onLoad={measure}
                  onError={() => setFailed((f) => ({ ...f, [k]: true }))}
                  // Cap the height so the portrait gift/envelope shot doesn't
                  // tower over the page; landscape shots still fill the width.
                  className="block mx-auto w-auto max-w-full h-auto max-h-[440px]"
                />
              ) : (
                <div className="grid aspect-[4/3] place-items-center" style={{ background: "var(--pink-soft)" }}>
                  <div className="flex flex-col items-center gap-2 text-muted" aria-hidden>
                    <Palette size={38} />
                    <span className="font-display text-sm">{k + 1} / {n}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button" onClick={() => go(-1)} aria-label="Previous"
          className="absolute left-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-card shadow-pop-sm font-display text-2xl leading-none hover:bg-white"
        >
          ‹
        </button>
        <button
          type="button" onClick={() => go(1)} aria-label="Next"
          className="absolute right-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-card shadow-pop-sm font-display text-2xl leading-none hover:bg-white"
        >
          ›
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-5">
        {slides.map((_, k) => (
          <button
            key={k} type="button" onClick={() => setI(k)} aria-label={`Slide ${k + 1}`}
            className="h-2.5 rounded-full transition-all"
            style={{ width: k === i ? 26 : 10, background: k === i ? "var(--teal-light)" : "rgba(43,36,64,0.18)" }}
          />
        ))}
      </div>
    </div>
  );
}

/** Hero headline with two colour-accented words pulled from the copy, plus the
 * literal " i " between them highlighted pink. */
function Title({ title, name, box }: { title: string; name: string; box: string }) {
  const parts = title.split(/(\{name\}|\{box\}| i )/);
  return (
    <>
      {parts.map((p, i) => {
        if (p === "{name}") return <span key={i} style={{ color: "var(--pink-d)" }}>{name}</span>;
        if (p === "{box}") return <span key={i} style={{ color: "var(--teal-light)" }}>{box}</span>;
        if (p === " i ") return <Fragment key={i}>{" i "}</Fragment>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
