import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { GameRow } from "@/lib/types";
import { GAME_MAP } from "@/lib/games";
import { THEME_MAP } from "@/lib/themes";
import { DIFFICULTY_MAP } from "@/lib/difficulty";
import { SiteHeader } from "@/components/site-header";
import { Palette, Search, Sparkle } from "@/components/icons";
import type { ComponentType } from "react";

export const metadata = {
  title: "My Games — Wonder Pages",
};

// Avoid caching one user's library for another.
export const dynamic = "force-dynamic";

const GAME_ICON: Record<string, ComponentType<{ size?: number }>> = {
  coloring: Palette,
  "find-it": Search,
};

export default async function GamesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS scopes the result to the caller's own rows (anonymous or permanent).
  const { data } = user
    ? await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false })
    : { data: null };

  const games = (data ?? []) as GameRow[];

  return (
    <div className="flex flex-col min-h-full">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold">
          My <span style={{ color: "var(--teal)" }}>games</span>
        </h1>
        <p className="text-muted font-semibold mt-2">
          Every game you make is saved here — open one any time to keep playing,
          coloring or printing.
        </p>

        {games.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-9">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function GameCard({ game }: { game: GameRow }) {
  const meta = GAME_MAP[game.type];
  const theme = THEME_MAP[game.theme];
  const level = DIFFICULTY_MAP[game.difficulty];
  const accent = theme?.color ?? "var(--brand)";
  const GameIcon = GAME_ICON[game.type] ?? Palette;
  const date = new Date(game.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <li>
      <Link
        href={`/play/${game.id}`}
        className="shadow-pop lift group block overflow-hidden rounded-3xl bg-card border-[3px] border-transparent transition-colors"
        style={{ borderColor: "transparent" }}
      >
        {/* Thumbnail. Plain <img> — same public Storage URL the canvas loads. */}
        <div
          className="relative aspect-square w-full overflow-hidden"
          style={{ background: theme?.tint ?? "var(--background)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.image_url}
            alt={game.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display font-bold text-xs text-white shadow-md"
            style={{ background: accent }}
          >
            <GameIcon size={14} />
            {meta?.name ?? game.type}
          </span>
        </div>

        <div className="p-4">
          <h2 className="font-display text-lg font-extrabold leading-tight">
            {game.title}
          </h2>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold text-muted">
              {theme?.name ?? game.theme}
              {level ? ` · ${level.name}` : ""}
            </p>
            {level && (
              <span className="text-sm" aria-label={`${level.stars} of 3`}>
                {"★".repeat(level.stars)}
                <span className="text-border">{"★".repeat(3 - level.stars)}</span>
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">{date}</span>
            <span
              className="font-display font-extrabold text-sm inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all"
              style={{ color: "var(--teal-d)" }}
            >
              Play again →
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 grid place-items-center rounded-3xl bg-card shadow-pop-sm px-6 py-16 text-center">
      <div className="tile h-20 w-20" style={{ background: "var(--purple)" }}>
        <Sparkle size={38} />
      </div>
      <h2 className="font-display text-2xl font-extrabold mt-6">
        No games yet
      </h2>
      <p className="text-muted font-semibold mt-2 max-w-sm">
        Make your first one — pick a game, choose a world, and it&apos;ll be
        saved right here.
      </p>
      <Link
        href="/"
        className="btn-glow font-display text-lg font-extrabold text-white rounded-full px-8 py-4 mt-7 inline-flex items-center gap-2.5"
        style={{ background: "var(--teal)" }}
      >
        <Sparkle size={20} /> Create your first game
      </Link>
    </div>
  );
}
