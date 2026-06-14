"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ensureSession } from "@/lib/supabase/session";
import { GAME_MAP, type GameId } from "@/lib/games";
import { THEME_MAP, type ThemeId } from "@/lib/themes";
import { DIFFICULTY_MAP, DEFAULT_DIFFICULTY, type DifficultyId } from "@/lib/difficulty";
import { Lock, Frown, Palette, Search, Sparkle } from "@/components/icons";

export default function GeneratingPage() {
  return (
    <Suspense>
      <CreateFlow />
    </Suspense>
  );
}

type Status = "working" | "error" | "limit";

function CreateFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const game = params.get("game") as GameId | null;
  const theme = params.get("theme") as ThemeId | null;
  const difficultyParam = params.get("difficulty") as DifficultyId | null;
  const difficulty =
    difficultyParam && DIFFICULTY_MAP[difficultyParam]
      ? difficultyParam
      : DEFAULT_DIFFICULTY;
  const title = params.get("title") ?? "";
  const valid = Boolean(game && GAME_MAP[game] && theme && THEME_MAP[theme]);

  const [status, setStatus] = useState<Status>("working");
  // Guard against React 18/19 double-invoking effects in dev (avoid 2 generations).
  const started = useRef(false);

  useEffect(() => {
    if (!valid || started.current) return;
    started.current = true;

    (async () => {
      try {
        await ensureSession();
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game, theme, difficulty, title }),
        });

        if (res.ok) {
          const { id } = await res.json();
          router.replace(`/play/${id}`);
          return;
        }

        if (res.status === 402) {
          // Logged in but out of credits → buy more.
          router.replace("/buy");
          return;
        }
        if (res.status === 403) {
          // Anonymous free game used → log in.
          setStatus("limit");
          return;
        }
        setStatus("error");
      } catch {
        setStatus("error");
      }
    })();
  }, [valid, game, theme, difficulty, title, router]);

  const t = theme && THEME_MAP[theme] ? THEME_MAP[theme] : null;
  const g = game && GAME_MAP[game] ? GAME_MAP[game] : null;
  const accent = t?.color ?? "var(--brand)";

  if (!valid) {
    return (
      <Centered>
        <p className="text-lg font-semibold text-muted">
          We couldn&apos;t find that game.
        </p>
        <Link
          href="/create"
          className="font-display font-extrabold text-brand underline mt-3 inline-block"
        >
          Start over
        </Link>
      </Centered>
    );
  }

  if (status === "limit") {
    return (
      <Centered>
        <div className="tile h-24 w-24" style={{ background: accent }}>
          <Lock size={44} />
        </div>
        <h1 className="font-display text-3xl font-extrabold mt-7">
          You&apos;ve used your free game
        </h1>
        <p className="text-muted font-semibold mt-3 max-w-sm">
          Log in to create as many games as you like — your free one is saved
          and waiting for you.
        </p>
        <Link
          href="/login?reason=limit"
          className="font-display font-extrabold text-white rounded-full px-8 py-4 mt-6 inline-block shadow-pop lift-sm"
          style={{ backgroundColor: accent }}
        >
          Log in to keep playing
        </Link>
        <Link
          href="/"
          className="text-muted font-semibold underline mt-4 inline-block lift-sm"
        >
          Maybe later — back to home
        </Link>
      </Centered>
    );
  }

  if (status === "error") {
    return (
      <Centered>
        <div className="tile h-24 w-24" style={{ background: accent }}>
          <Frown size={44} />
        </div>
        <h1 className="font-display text-2xl font-extrabold mt-7">
          Our crayons slipped!
        </h1>
        <p className="text-muted font-semibold mt-3">
          Something went wrong. Let&apos;s try again.
        </p>
        <button
          onClick={() => location.reload()}
          className="font-display font-extrabold text-white rounded-full px-8 py-4 mt-6 shadow-pop lift-sm"
          style={{ backgroundColor: accent }}
        >
          Try again
        </button>
      </Centered>
    );
  }

  // working
  const GameIcon = game === "coloring" ? Palette : Search;
  return (
    <Centered>
      <div className="relative grid place-items-center">
        {/* Twinkling sparkles orbiting the tile */}
        <span
          className="wp-twinkle absolute -top-2 -left-5"
          style={{ color: "var(--yellow)" }}
        >
          <Sparkle size={22} />
        </span>
        <span
          className="wp-twinkle absolute -bottom-1 -right-6"
          style={{ color: "var(--pink)", animationDelay: "0.6s" }}
        >
          <Sparkle size={16} />
        </span>
        <span
          className="wp-twinkle absolute -top-4 right-0"
          style={{ color: "var(--purple)", animationDelay: "1.1s" }}
        >
          <Sparkle size={13} />
        </span>

        <div
          className="wp-float tile h-24 w-24 shadow-pop"
          style={{ background: accent }}
        >
          <GameIcon size={46} />
        </div>
      </div>

      <h1 className="font-display text-3xl font-extrabold mt-9">
        Drawing your game…
      </h1>
      <p className="text-muted font-semibold mt-3 max-w-sm">
        Our artist is making a one-of-a-kind {t?.name} {g?.name} just for you —
        this takes a few seconds.
      </p>

      {/* Indeterminate progress sweep */}
      <div className="relative mt-8 h-2.5 w-64 overflow-hidden rounded-full bg-border">
        <span
          className="wp-indeterminate absolute inset-y-0 w-2/5 rounded-full"
          style={{ background: accent }}
        />
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex-1 grid place-items-center p-10 text-center overflow-hidden">
      <div className="relative flex flex-col items-center">{children}</div>
    </main>
  );
}
