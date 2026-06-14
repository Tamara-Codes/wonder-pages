import Image from "next/image";
import Link from "next/link";
import {
  Palette,
  Search,
  Gift,
  Sparkle,
  Mail,
  Smile,
  Wand,
  Zap,
} from "@/components/icons";
import type { ComponentType } from "react";
import { SiteHeader } from "@/components/site-header";
import { NotifyForm } from "@/components/notify-form";

type Icon = ComponentType<{ size?: number }>;

// The product journey — shown as a three-step band under the hero.
const JOURNEY: { Icon: Icon; title: string; copy: string; color: string }[] = [
  {
    Icon: Wand,
    title: "Create & play",
    copy: "Pick a world a kid loves and make the games — coloring, find-it and more. Play one of each free with no sign-up. Want more? Log in — token packs are coming soon.",
    color: "var(--purple)",
  },
  {
    Icon: Gift,
    title: "Build the booklet",
    copy: "Gather the favorites into one keepsake activity book and add a personal first page — the kid's name, a note, a little dedication just for them.",
    color: "var(--blue)",
  },
  {
    Icon: Mail,
    title: "Delivered to the door",
    copy: "We print it as a beautiful bound booklet and post it to any address you enter — your home, or straight to the lucky kid. No printer needed. Delivery coming soon.",
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
  { Icon: Smile, label: "Personalized, one of a kind", color: "var(--pink)" },
  { Icon: Gift, label: "One of each game free", color: "var(--teal)" },
  { Icon: Zap, label: "Made in seconds", color: "var(--orange)" },
  { Icon: Sparkle, label: "No sign-up needed", color: "var(--purple)" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-5xl px-6 pt-10 sm:pt-20 pb-6 sm:pb-16 lg:-left-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Left — message + CTA */}
            <div className="text-center lg:text-left">
              <p
                className="pop font-label uppercase tracking-[0.16em] text-xs font-semibold text-muted"
                style={{ animationDelay: "0.04s" }}
              >
                A one-of-a-kind gift for a kid you love
              </p>
              <h1
                className="pop font-display font-extrabold leading-[1.02] mt-3 text-[clamp(36px,5.6vw,60px)]"
                style={{ animationDelay: "0.1s" }}
              >
                Turn a kid&apos;s favorite{" "}
                <span style={{ color: "var(--teal)" }}>world</span> into a{" "}
                <span style={{ color: "var(--pink)" }}>gift</span>{" "}
                they&apos;ll keep
              </h1>
              <p
                className="pop mx-auto lg:mx-0 mt-4 max-w-[48ch] text-lg font-semibold text-muted"
                style={{ animationDelay: "0.18s" }}
              >
                Pick a world a kid loves — dinosaurs, unicorns, space, race
                cars — and create and play one of each game free. Collect the
                favorites into a personalized booklet, add a note just for them,
                and we&apos;ll post it as a keepsake gift — for your own child, a
                niece, a friend&apos;s little one.
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
                  Create a game
                </Link>
                <span className="font-display text-sm font-semibold text-muted">
                  One of each game free · no sign-up · booklet delivery coming soon
                </span>
              </div>
            </div>

            {/* Right — the coloring app (coloured in) + a printed booklet beside it */}
            <div
              className="pop relative mx-auto w-full max-w-[480px] lg:max-w-none mt-8 lg:mt-0 pb-10 sm:pb-4 left-3 lg:left-0"
              style={{ animationDelay: "0.16s" }}
            >
              {/* The coloring app — full screen, coloured in */}
              <div className="relative z-10 w-[54%] sm:w-[64%] lg:w-[76%] rotate-[-1.5deg]">
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

              {/* The printed personalized booklet, beside it — larger, leaning right.
                  It's rotated 22°, which shrinks its visual footprint, so it carries
                  a larger width than the app to read as the same size. Centered on the
                  same vertical axis as the app so the two sit level, not staggered. */}
              <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:-right-20 lg:top-auto lg:bottom-[-2rem] lg:translate-y-0 lg:-right-52 z-20 w-[72%] sm:w-[78%] lg:w-[84%]">
                <Image
                  src="/booklet.png"
                  alt="A printed, personalized Wonder Pages princess activity booklet."
                  width={702}
                  height={870}
                  className="h-auto w-full rotate-[22deg] drop-shadow-xl"
                />
                <span
                  className="absolute top-1 left-[60%] -translate-x-1/2 rotate-[11deg] lg:top-[-0.75rem] lg:left-1/2 lg:rotate-0 z-30 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-display font-bold text-[13px] text-white shadow-md"
                  style={{ background: "var(--pink)" }}
                >
                  <Gift size={15} /> Order it as a gift
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust / value strip (right under the hero) ───────── */}
        <section className="mx-auto max-w-5xl px-6 mt-5 sm:mt-12 pb-20">
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

        {/* ── Journey: create & play → booklet → delivered ──────── */}
        <section style={{ background: "#f4f1fe" }}>
          <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="pop text-center font-display text-2xl sm:text-3xl font-extrabold">
            From games they play to a{" "}
            <span style={{ color: "var(--pink)" }}>gift</span> in the mail
          </h2>
          <ul className="mt-7 grid gap-5 sm:grid-cols-3" aria-label="How Wonder Pages works">
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
                  The keepsake booklet, in the mail
                </h2>
                <p className="text-muted font-semibold mt-2 max-w-[52ch]">
                  Soon you&apos;ll gather several games into one bound activity
                  booklet, add a personal first page, and have it printed and
                  posted to any address you enter — a one-of-a-kind gift, no
                  printer needed. Want first dibs?
                </p>
                <NotifyForm source="booklet" />
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
