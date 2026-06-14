"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GAMES, GAME_MAP, type GameId } from "@/lib/games";
import { THEMES, THEME_MAP, type ThemeId } from "@/lib/themes";
import {
  DIFFICULTIES,
  DEFAULT_DIFFICULTY,
  type DifficultyId,
} from "@/lib/difficulty";
import {
  Palette,
  Search,
  Sparkle,
  Unicorn,
  Rocket,
  Dino,
  Fish,
  Car,
  Crown,
  SpotDiff,
  Ghost,
  Shell,
  Paw,
  Ball,
  Candy,
} from "@/components/icons";
import type { ComponentType } from "react";
import { SiteHeader } from "@/components/site-header";

type Icon = ComponentType<{ size?: number }>;

const GAME_ICON: Record<GameId, Icon> = {
  coloring: Palette,
  "find-it": Search,
  "spot-difference": SpotDiff,
};

const GAME_COLOR: Record<GameId, string> = {
  coloring: "#ff5ca8",
  "find-it": "#8a6cff",
  "spot-difference": "#16b8a6",
};

const DIFFICULTY_COLOR: Record<DifficultyId, string> = {
  easy: "var(--teal)",
  medium: "var(--purple)",
  hard: "var(--pink)",
};

const THEME_ICON: Record<ThemeId, Icon> = {
  princess: Crown,
  unicorns: Unicorn,
  space: Rocket,
  dinosaurs: Dino,
  ocean: Fish,
  "race-cars": Car,
  ghosts: Ghost,
  mermaids: Shell,
  animals: Paw,
  sports: Ball,
  sweets: Candy,
};

export default function CreatePage() {
  return (
    <Suspense>
      <Builder />
    </Suspense>
  );
}

function Builder() {
  const router = useRouter();
  const params = useSearchParams();

  // Allow an example/link to pre-select a game + world (e.g. /create?game=…&theme=…).
  const qpGame = params.get("game") as GameId | null;
  const qpTheme = params.get("theme") as ThemeId | null;

  const [game, setGame] = useState<GameId | null>(
    qpGame && GAME_MAP[qpGame] ? qpGame : null,
  );
  const [theme, setTheme] = useState<ThemeId | null>(
    qpTheme && THEME_MAP[qpTheme] ? qpTheme : null,
  );
  const [difficulty, setDifficulty] = useState<DifficultyId>(DEFAULT_DIFFICULTY);
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);

  // Suggest a name once a game + world are chosen, until the parent edits it.
  useEffect(() => {
    if (!titleTouched && game && theme) {
      setTitle(`${THEME_MAP[theme].name} ${GAME_MAP[game].name}`);
    }
  }, [game, theme, titleTouched]);

  const ready = Boolean(game && theme);

  function start() {
    if (!ready) return;
    const finalTitle = title.trim().slice(0, 80);
    router.push(
      `/create/generating?game=${game}&theme=${theme}&difficulty=${difficulty}&title=${encodeURIComponent(finalTitle)}`,
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-10 pb-24">
          {/* Intro */}
          <div className="text-center">
            <p className="pop font-label uppercase tracking-[0.16em] text-xs font-semibold text-muted">
              Make a game
            </p>
            <h1 className="pop font-display font-extrabold leading-tight mt-2 text-[clamp(30px,4.4vw,44px)]">
              Pick a game, choose a world,{" "}
              <span style={{ color: "var(--teal)" }}>and we&apos;ll make it</span>
            </h1>
          </div>

          {/* Step 1 — game */}
          <div className="mt-10">
            <StepHead n={1} text="Pick a game" delay="0.05s" />
            <div
              className="grid gap-5 sm:grid-cols-2 mt-5"
              role="radiogroup"
              aria-label="Pick a game"
            >
              {GAMES.map((g, i) => {
                const selected = game === g.id;
                const color = GAME_COLOR[g.id];
                const GameIcon = GAME_ICON[g.id];
                return (
                  <button
                    key={g.id}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setGame(g.id)}
                    className="pop shadow-pop lift relative text-left rounded-3xl bg-card p-7 border-[3px] transition-colors"
                    style={{
                      animationDelay: `${0.1 + i * 0.07}s`,
                      borderColor: selected ? color : "transparent",
                    }}
                  >
                    {selected && (
                      <span
                        className="animate-ping-once absolute -top-3 -right-3 grid h-9 w-9 place-items-center rounded-full text-white text-lg shadow-md"
                        style={{ background: color }}
                      >
                        ✓
                      </span>
                    )}
                    <div className="flex items-start gap-4">
                      <div
                        className="tile h-16 w-16 shrink-0"
                        style={{ background: color }}
                      >
                        <GameIcon size={32} />
                      </div>
                    </div>
                    <h3 className="font-display text-2xl font-extrabold mt-4">
                      {g.name}
                    </h3>
                    <p
                      className="font-display font-bold text-sm"
                      style={{ color }}
                    >
                      {g.tagline}
                    </p>
                    <p className="text-[15px] text-muted mt-2 font-semibold leading-snug">
                      {g.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — theme */}
          <div className="mt-11">
            <StepHead n={2} text="Pick a world" delay="0.05s" />
            <div
              className="flex flex-wrap gap-3 mt-5"
              role="radiogroup"
              aria-label="Pick a world"
            >
              {THEMES.map((t, i) => {
                const selected = theme === t.id;
                const ThemeIcon = THEME_ICON[t.id];
                return (
                  <button
                    key={t.id}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTheme(t.id)}
                    className="pop shadow-pop-sm lift-sm flex items-center gap-2.5 rounded-full px-5 py-3.5 font-display font-bold text-[15px] border-2"
                    style={{
                      animationDelay: `${0.1 + i * 0.05}s`,
                      background: selected ? t.color : "var(--card)",
                      color: selected ? "#fff" : "var(--foreground)",
                      borderColor: selected ? t.color : "transparent",
                    }}
                  >
                    <span
                      className="shrink-0"
                      style={{ color: selected ? "#fff" : t.color }}
                      aria-hidden
                    >
                      <ThemeIcon size={22} />
                    </span>
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3 — difficulty */}
          <div className="mt-11">
            <StepHead n={3} text="Pick a level" delay="0.05s" />
            <div
              className="grid gap-4 sm:grid-cols-3 mt-5"
              role="radiogroup"
              aria-label="Pick a level"
            >
              {DIFFICULTIES.map((d, i) => {
                const selected = difficulty === d.id;
                const color = DIFFICULTY_COLOR[d.id];
                return (
                  <button
                    key={d.id}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDifficulty(d.id)}
                    className="pop shadow-pop lift relative text-center rounded-3xl bg-card p-5 border-[3px] transition-colors"
                    style={{
                      animationDelay: `${0.1 + i * 0.06}s`,
                      borderColor: selected ? color : "transparent",
                    }}
                  >
                    {selected && (
                      <span
                        className="animate-ping-once absolute -top-3 -right-3 grid h-8 w-8 place-items-center rounded-full text-white text-base shadow-md"
                        style={{ background: color }}
                      >
                        ✓
                      </span>
                    )}
                    <div className="flex justify-center gap-1 text-2xl" aria-hidden>
                      {[1, 2, 3].map((s) => (
                        <span
                          key={s}
                          style={{ color: s <= d.stars ? color : "var(--border)" }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <h3 className="font-display text-lg font-extrabold mt-2">
                      {d.name}
                    </h3>
                    <p
                      className="font-display font-bold text-sm"
                      style={{ color }}
                    >
                      {d.blurb}
                    </p>
                    <p className="text-[13px] text-muted font-semibold mt-0.5">
                      {d.ages}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4 — name it */}
          <div className="mt-11">
            <StepHead n={4} text="Name your game" delay="0.05s" />
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleTouched(true);
              }}
              maxLength={80}
              placeholder="Give your game a name"
              aria-label="Name your game"
              className="pop mt-5 w-full rounded-2xl border-2 border-border bg-card px-5 py-4 font-display text-lg font-bold text-foreground outline-none transition-colors placeholder:font-semibold placeholder:text-muted focus:border-teal"
            />
          </div>

          {/* Create CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={start}
              disabled={!ready}
              className={`font-display text-xl font-extrabold text-white rounded-full px-12 py-5 inline-flex items-center gap-2.5 ${
                ready ? "btn-glow" : "opacity-50 cursor-not-allowed"
              }`}
              style={{ background: "var(--teal)" }}
            >
              Create my free game
              <Sparkle size={20} />
            </button>
            <p className="text-sm text-muted mt-4 font-bold h-5" aria-live="polite">
              {!game
                ? "👆 Pick a game to begin"
                : !theme
                  ? "🌈 Now pick a world"
                  : ""}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function StepHead({
  n,
  text,
  delay,
}: {
  n: number;
  text: string;
  delay: string;
}) {
  return (
    <div className="pop flex items-center gap-3" style={{ animationDelay: delay }}>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-white font-display font-extrabold">
        {n}
      </span>
      <h2 className="font-display text-2xl font-extrabold">{text}</h2>
    </div>
  );
}
