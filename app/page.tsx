"use client";

import { Fragment, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Gift, Smile, Sparkle, Palette, Trace } from "@/components/icons";
import { ShopHeader } from "@/components/shop-header";
import { COPY } from "@/lib/landing-copy";
import { ALPHABET_COPY } from "@/lib/alphabet-landing";
import { productPriceLabel } from "@/lib/products";

const STEP_COLORS = ["var(--purple)", "var(--blue)", "var(--pink)"];
const ALPHABET_HREF = "/products/alphabet";
const PRODUCTS_ANCHOR = "#kompleti";

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

  return (
    <div className="flex flex-col min-h-full">
      <ShopHeader />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-5xl px-6 pt-10 sm:pt-16 pb-8 sm:pb-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <p className="pop font-label uppercase tracking-[0.16em] text-xs font-semibold text-muted" style={{ animationDelay: "0.04s" }}>
                {c.hero.eyebrow}
              </p>
              <h1 className="pop font-display font-extrabold leading-[1.04] mt-3 text-[clamp(34px,5.2vw,56px)]" style={{ animationDelay: "0.1s" }}>
                <Title title={c.hero.title} name={c.hero.titleName} box={c.hero.titleBox} />
              </h1>
              <p className="pop mt-5 text-base sm:text-lg leading-relaxed text-muted max-w-xl mx-auto lg:mx-0" style={{ animationDelay: "0.16s" }}>
                {c.hero.subtitle}
              </p>
              <div className="pop mt-7 flex flex-col items-center lg:items-start gap-3" style={{ animationDelay: "0.24s" }}>
                <Link href={PRODUCTS_ANCHOR} className="btn-glow font-display text-xl font-extrabold text-white rounded-full px-10 py-4.5 inline-flex items-center gap-2.5" style={{ background: "var(--teal)" }}>
                  <Gift size={22} /> {c.hero.cta}
                </Link>
              </div>
            </div>

            {/* the printed product — a personalized keepsake set (sample) */}
            <div className="pop relative mx-auto lg:mx-0 lg:ml-auto w-full max-w-[640px] mt-4 lg:mt-0" style={{ animationDelay: "0.16s" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hero-pages.jpg" alt={`${sampleName} — ${c.hero.coverLabel}`} className="w-full h-auto rounded-3xl shadow-pop" />
            </div>
          </div>
        </section>

        {/* ── Trust strip ──────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 mt-4 sm:mt-8 pb-16">
          <ul className="pop flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-3xl bg-card shadow-pop-sm px-5 py-4">
            {c.trust.map((label, i) => (
              <li key={label} className="flex items-center gap-2.5 font-display font-bold text-sm text-foreground">
                <span className="grid h-8 w-8 place-items-center rounded-xl text-white shrink-0" style={{ background: STEP_COLORS[i % 3] }} aria-hidden>
                  <Smile size={17} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* ── A box of leaves, not a book (photo carousel) ─────── */}
        <section style={{ background: "#f4f1fe" }}>
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold">{c.format.heading}</h2>
              <p className="text-muted font-semibold mt-2">{c.format.sub}</p>
            </div>
            <div className="mt-9">
              <Showcase slides={c.format.slides} images={SHOWCASE_IMAGES} />
            </div>
          </div>
        </section>

        {/* ── What's on every leaf (anatomy of one leaf) ───────── */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold">{c.leaf.heading}</h2>
              <p className="text-muted font-semibold mt-2">{c.leaf.sub}</p>
              <ol className="mt-7 space-y-5">
                {c.leaf.steps.map((s, i) => (
                  <li key={s.title} className="flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white" style={{ background: STEP_COLORS[i % 3] }} aria-hidden>
                      {[<Palette key="a" size={20} />, <Sparkle key="b" size={20} />, <Trace key="c" size={20} />][i % 3]}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-extrabold leading-tight">{s.title}</h3>
                      <p className="text-[15px] text-muted font-semibold mt-1 leading-snug">{s.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="order-1 lg:order-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/showcase/letter-avion.png"
                alt="A kao Avion — listić za bojanje"
                className="w-[240px] sm:w-[300px] rounded-2xl shadow-pop"
              />
            </div>
          </div>
        </section>

        {/* ── The set ──────────────────────────────────────────── */}
        <section id="kompleti" className="scroll-mt-24" style={{ background: "#f4f1fe" }}>
          <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
            <div className="text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold">Moja prva abeceda</h2>
              <p className="text-muted font-semibold mt-2">
                Personalizirani poklon s prvim slovima vašeg djeteta, ručno tiskan u Hrvatskoj i isporučen u poklon vrećici.
              </p>
            </div>
            <div className="mt-9">
              <ProductCard
                price={productPriceLabel("alphabet")}
                contents={shop.products.cards.alphabet.contents}
                href={ALPHABET_HREF}
                cta={c.hero.cta}
                accent="var(--teal)"
                accentDark="var(--teal-d)"
              />
            </div>

            <p className="text-center text-xs text-muted font-semibold mt-6 leading-relaxed">{c.pricing.note}</p>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 pt-28 pb-16">
          <h2 className="text-center font-display text-2xl sm:text-3xl font-extrabold">{c.faq.heading}</h2>
          <ul className="mt-8 space-y-4">
            {c.faq.items.map((item) => (
              <li key={item.q} className="rounded-3xl bg-card shadow-pop-sm p-6">
                <h3 className="font-display text-lg font-extrabold">{item.q}</h3>
                <p className="text-[15px] text-muted font-semibold mt-2 leading-snug">{item.a}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <Link href={ALPHABET_HREF} className="btn-glow font-display text-lg font-extrabold text-white rounded-full px-9 py-4 inline-flex items-center gap-2.5" style={{ background: "var(--teal)" }}>
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
 * Photo carousel for the "box of letters" section: one image + caption per
 * slide, with arrows and dots. Each image falls back to a placeholder until the
 * real photo is dropped in at its path (see SHOWCASE_IMAGES).
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
    <div className="mx-auto max-w-[440px]">
      <div className="relative">
        <div
          className="relative overflow-hidden rounded-3xl bg-card shadow-pop"
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
                  className="block w-full h-auto"
                />
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-[#efeaff]">
                  <div className="flex flex-col items-center gap-2 text-muted" aria-hidden>
                    <Palette size={38} />
                    <span className="font-display font-bold text-sm">{k + 1} / {n}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button" onClick={() => go(-1)} aria-label="Previous"
          className="absolute left-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-card shadow-pop-sm font-display font-extrabold text-2xl leading-none hover:bg-white"
        >
          ‹
        </button>
        <button
          type="button" onClick={() => go(1)} aria-label="Next"
          className="absolute right-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-card shadow-pop-sm font-display font-extrabold text-2xl leading-none hover:bg-white"
        >
          ›
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-5">
        {slides.map((_, k) => (
          <button
            key={k} type="button" onClick={() => setI(k)} aria-label={`Slide ${k + 1}`}
            className="h-2.5 rounded-full transition-all"
            style={{ width: k === i ? 26 : 10, background: k === i ? "var(--teal)" : "rgba(0,0,0,0.16)" }}
          />
        ))}
      </div>
    </div>
  );
}

/** One product card in the "choose your set" section: name + price + what's
 * inside + an order CTA, in the product's accent colour. */
function ProductCard({
  price,
  contents,
  href,
  cta,
  accent,
  accentDark,
}: {
  price: string;
  contents: string[];
  href: string;
  cta: string;
  accent: string;
  accentDark: string;
}) {
  return (
    <div className="grid sm:grid-cols-2 rounded-3xl shadow-pop overflow-hidden">
      {/* Left — white: what's inside */}
      <div className="bg-card p-8 sm:p-9 flex flex-col justify-center">
        <ul className="space-y-3.5">
          {contents.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-[15px] font-semibold text-foreground">
              <span className="mt-0.5 shrink-0 font-extrabold" style={{ color: accentDark }} aria-hidden>✓</span>{line}
            </li>
          ))}
        </ul>
      </div>
      {/* Right — teal: price + order button */}
      <div className="flex flex-col items-center justify-center gap-5 p-8 sm:p-9 text-center" style={{ background: accent }}>
        <p className="font-display font-extrabold leading-none text-white text-5xl">{price}</p>
        <Link
          href={href}
          className="btn-glow font-display text-xl font-extrabold rounded-full w-full bg-white px-6 py-4 inline-flex items-center justify-center gap-2.5"
          style={{ color: accentDark }}
        >
          <Gift size={22} /> {cta}
        </Link>
      </div>
    </div>
  );
}

/** Hero headline with two colour-accented words pulled from the copy. */
function Title({ title, name, box }: { title: string; name: string; box: string }) {
  const parts = title.split(/(\{name\}|\{box\})/);
  return (
    <>
      {parts.map((p, i) => {
        if (p === "{name}") return <span key={i} style={{ color: "var(--teal)" }}>{name}</span>;
        if (p === "{box}") return <span key={i} style={{ color: "var(--purple)" }}>{box}</span>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
