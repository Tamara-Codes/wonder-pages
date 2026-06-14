import Image from "next/image";
import Link from "next/link";
import {
  Palette,
  Search,
  Gift,
  Sparkle,
  Mail,
  Smile,
  Printer,
  Wand,
  Zap,
} from "@/components/icons";
import type { ComponentType } from "react";
import { SiteHeader } from "@/components/site-header";

type Icon = ComponentType<{ size?: number }>;

// The product journey — shown as a three-step band under the hero.
const JOURNEY: { Icon: Icon; title: string; copy: string; color: string }[] = [
  {
    Icon: Wand,
    title: "Build it",
    copy: "Pick a game and a world they love. Wonder Pages creates a one-of-a-kind game in seconds — ready to play on any screen.",
    color: "var(--purple)",
  },
  {
    Icon: Printer,
    title: "Print it",
    copy: "Print it at home to colour, solve and play on paper — as many times as you like, no screen needed.",
    color: "var(--blue)",
  },
  {
    Icon: Gift,
    title: "Gift it",
    copy: "Order it as a one-of-a-kind printed booklet, posted to your door as a keepsake or as a gift — no printer needed. Coming soon.",
    color: "var(--pink)",
  },
];

// A slice of the real coloring-app palette (see coloring-canvas.tsx),
// shown in the hero so the screen reads as the actual app.
const HERO_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#8b5cf6", "#ec4899",
];

// Real generated examples for the gallery. Each tile links to the builder
// pre-selected to that game + world, so a parent can start with one tap.
const EXAMPLES: {
  src: string;
  game: string;
  gameId: string;
  Icon: Icon;
  world: string;
  themeId: string;
  color: string;
}[] = [
  { src: "/examples/dinosaurs-coloring.png", game: "Coloring", gameId: "coloring", Icon: Palette, world: "Dinosaurs", themeId: "dinosaurs", color: "#46c36a" },
  { src: "/examples/racecars-findit.png", game: "Find It!", gameId: "find-it", Icon: Search, world: "Race Cars", themeId: "race-cars", color: "#ff7a45" },
];

// Parent-friendly reassurance row, shown just under the hero.
const TRUST: { Icon: Icon; label: string; color: string }[] = [
  { Icon: Smile, label: "Kid-friendly game ideas", color: "var(--pink)" },
  { Icon: Printer, label: "Printable at home", color: "var(--blue)" },
  { Icon: Gift, label: "First game free", color: "var(--teal)" },
  { Icon: Zap, label: "Made in seconds", color: "var(--orange)" },
  { Icon: Sparkle, label: "No sign-up needed", color: "var(--purple)" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Left — message + CTA */}
            <div className="text-center lg:text-left">
              <p
                className="pop font-label uppercase tracking-[0.16em] text-xs font-semibold text-muted"
                style={{ animationDelay: "0.04s" }}
              >
                Personalized printable games for kids
              </p>
              <h1
                className="pop font-display font-extrabold leading-[1.02] mt-3 text-[clamp(36px,5.6vw,60px)]"
                style={{ animationDelay: "0.1s" }}
              >
                Turn your child&apos;s favorite{" "}
                <span style={{ color: "var(--pink)" }}>worlds</span> into
                printable <span style={{ color: "var(--teal)" }}>games</span>
              </h1>
              <p
                className="pop mx-auto lg:mx-0 mt-4 max-w-[48ch] text-lg font-semibold text-muted"
                style={{ animationDelay: "0.18s" }}
              >
                Pick a game style, add a world they love — dinosaurs, unicorns,
                space, the ocean, race cars — and Wonder Pages creates a
                one-of-a-kind activity game to play or print today.
              </p>

              {/* Primary CTA → the builder */}
              <div
                className="pop mt-8 flex flex-col items-center lg:items-start gap-3"
                style={{ animationDelay: "0.24s" }}
              >
                <Link
                  href="/create"
                  className="btn-glow font-display text-xl font-extrabold text-white rounded-full px-10 py-4.5 inline-flex items-center gap-2.5"
                  style={{ background: "var(--teal)" }}
                >
                  <Sparkle size={22} />
                  Create your free game
                </Link>
              </div>
            </div>

            {/* Right — the coloring app (coloured in) + a printed booklet beside it */}
            <div
              className="pop relative mx-auto w-full max-w-[480px] lg:max-w-none pb-4"
              style={{ animationDelay: "0.16s" }}
            >
              {/* The coloring app — full screen, coloured in */}
              <div className="relative z-10 w-[76%] rotate-[-1.5deg]">
                <div className="overflow-hidden rounded-[26px] border border-border bg-card shadow-pop lift">
                  {/* App top bar */}
                  <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                    <span className="flex gap-1.5" aria-hidden>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--pink)" }} />
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--yellow)" }} />
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--teal)" }} />
                    </span>
                    <span className="font-display text-[13px] font-bold text-muted">
                      Coloring · Princess Castle
                    </span>
                  </div>
                  {/* The coloured-in page */}
                  <div className="bg-white">
                    <Image
                      src="/coloring-colored.png"
                      alt="A princess and castle coloring page coloured in inside the Wonder Pages app."
                      width={800}
                      height={800}
                      priority
                      className="block h-auto w-full"
                    />
                  </div>
                  {/* Real colour palette */}
                  <div className="flex items-center gap-1.5 border-t border-border px-3 py-3">
                    <span className="text-foreground" aria-hidden>
                      <Palette size={16} />
                    </span>
                    {HERO_PALETTE.map((c, i) => (
                      <span
                        key={c}
                        className="h-5 w-5 rounded-md"
                        style={{
                          background: c,
                          boxShadow: i === 5 ? "0 0 0 2px #fff, 0 0 0 4px var(--foreground)" : undefined,
                        }}
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-display font-bold text-[13px] text-white shadow-md"
                  style={{ background: "var(--teal)" }}
                >
                  <Palette size={15} /> Colour it in the app
                </span>
              </div>

              {/* The printed personalized booklet, beside it — larger, leaning right */}
              <div className="absolute -bottom-8 -right-52 z-20 w-[84%] sm:w-[82%]">
                <Image
                  src="/booklet.png"
                  alt="A printed, personalized Wonder Pages princess activity booklet."
                  width={702}
                  height={870}
                  className="h-auto w-full rotate-[22deg] drop-shadow-xl"
                />
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-display font-bold text-[13px] text-white shadow-md"
                  style={{ background: "var(--pink)" }}
                >
                  <Gift size={15} /> Print it as a gift
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust / value strip (right under the hero) ───────── */}
        <section className="mx-auto max-w-5xl px-6 mt-12 pb-20">
          <ul className="pop flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-3xl bg-card shadow-pop-sm px-5 py-4">
            {TRUST.map((t) => (
              <li
                key={t.label}
                className="flex items-center gap-2.5 font-display font-bold text-sm text-foreground"
              >
                <span
                  className="grid h-8 w-8 place-items-center rounded-xl text-white shrink-0"
                  style={{ background: t.color }}
                  aria-hidden
                >
                  <t.Icon size={17} />
                </span>
                {t.label}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Journey: build it → print or gift it ──────────────── */}
        <section style={{ background: "#f4f1fe" }}>
          <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="pop text-center font-display text-2xl sm:text-3xl font-extrabold">
            Build it — then print or{" "}
            <span style={{ color: "var(--pink)" }}>gift</span> it
          </h2>
          <ul className="mt-7 grid gap-5 sm:grid-cols-3" aria-label="What you can do with your game">
            {JOURNEY.map((s, i) => (
              <li
                key={s.title}
                className="pop shadow-pop rounded-3xl bg-card p-6 text-center sm:text-left"
                style={{ animationDelay: `${0.06 + i * 0.08}s` }}
              >
                <div
                  className="tile h-14 w-14 mx-auto sm:mx-0"
                  style={{ background: s.color }}
                  aria-hidden
                >
                  <s.Icon size={28} />
                </div>
                <h3 className="font-display text-xl font-extrabold mt-4">
                  {s.title}
                </h3>
                <p className="text-[15px] text-muted font-semibold mt-1.5 leading-snug">
                  {s.copy}
                </p>
              </li>
            ))}
          </ul>
          </div>
        </section>

        {/* ── Example gallery: real generated games ─────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <h2 className="pop font-display text-2xl sm:text-3xl font-extrabold">
              A peek at what you can{" "}
              <span style={{ color: "var(--pink)" }}>make</span>
            </h2>
            <p className="pop text-muted font-semibold mt-2">
              Every game is one-of-a-kind. Tap one to start your own.
            </p>
          </div>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
            {EXAMPLES.map((ex, i) => (
              <li key={ex.src}>
                <Link
                  href={`/create?game=${ex.gameId}&theme=${ex.themeId}`}
                  className="pop shadow-pop lift group block overflow-hidden rounded-3xl bg-card"
                  style={{ animationDelay: `${0.05 + i * 0.06}s` }}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ex.src}
                      alt={`${ex.world} ${ex.game} made with Wonder Pages`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                    <span
                      className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display font-bold text-xs text-white shadow-md"
                      style={{ background: ex.color }}
                    >
                      <ex.Icon size={14} /> {ex.game} · {ex.world}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <Link
              href="/create"
              className="btn-glow font-display text-lg font-extrabold text-white rounded-full px-9 py-4 inline-flex items-center gap-2.5"
              style={{ background: "var(--teal)" }}
            >
              <Sparkle size={20} /> Make your own
            </Link>
          </div>
        </section>

        {/* ── Coming soon: printed booklet gifts (V2 teaser) ───── */}
        <section style={{ background: "#fff4fa" }}>
          <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="coming-soon-frame relative overflow-hidden rounded-[28px] border-2 border-dashed border-purple/40 shadow-pop-sm p-8 sm:p-10">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div
                className="tile h-20 w-20 shrink-0"
                style={{ background: "var(--purple)" }}
              >
                <Gift size={40} />
              </div>
              <div className="flex-1">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label uppercase tracking-[0.12em] text-[11px] font-bold text-white"
                  style={{ background: "var(--purple)" }}
                >
                  <Mail size={13} /> Coming soon
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-3">
                  Make it a gift
                </h2>
                <p className="text-muted font-semibold mt-2 max-w-[52ch]">
                  Soon you&apos;ll be able to turn your child&apos;s favorite
                  activity games into a beautifully printed booklet, mailed to
                  someone special.
                </p>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* ── Footer credit ─────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-center text-sm text-muted font-semibold">
            Made with care for curious kids · Wonder Pages
          </p>
        </section>
      </main>
    </div>
  );
}
