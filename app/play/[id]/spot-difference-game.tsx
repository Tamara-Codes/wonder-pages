"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { GameRow, SpotDiffAnswer, DiffBox } from "@/lib/types";
import { THEME_MAP } from "@/lib/themes";
import { PlayHeader } from "./coloring-canvas";
import { Bulb } from "@/components/icons";

export default function SpotDifferenceGame({ game }: { game: GameRow }) {
  // The dispatcher only renders this for spot-difference games.
  const answer = game.answer_key as SpotDiffAnswer | null;
  const diffs = answer?.diffs ?? [];
  const aRef = useRef<HTMLImageElement>(null);
  const bRef = useRef<HTMLImageElement>(null);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [misses, setMisses] = useState(0);
  const [hint, setHint] = useState<number | null>(null);

  const accent = THEME_MAP[game.theme]?.color ?? "var(--brand)";
  const allFound = diffs.length > 0 && found.size === diffs.length;

  // Center of a difference as a percentage of the image, for positioning rings.
  const centerOf = (d: DiffBox) => ({
    left: ((d.x + d.w / 2) / answer!.imgW) * 100,
    top: ((d.y + d.h / 2) / answer!.imgH) * 100,
    size: (d.w / answer!.imgW) * 100,
  });

  function handleClick(
    e: React.MouseEvent<HTMLImageElement>,
    ref: React.RefObject<HTMLImageElement | null>,
  ) {
    if (!answer || allFound) return;
    const rect = ref.current!.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * answer.imgW;
    const ny = ((e.clientY - rect.top) / rect.height) * answer.imgH;

    // First not-yet-found difference under the tap (generous padding for small fingers).
    const idx = diffs.findIndex((d, i) => {
      if (found.has(i)) return false;
      const padX = d.w * 0.35;
      const padY = d.h * 0.35;
      return (
        nx >= d.x - padX &&
        nx <= d.x + d.w + padX &&
        ny >= d.y - padY &&
        ny <= d.y + d.h + padY
      );
    });

    if (idx >= 0) setFound((prev) => new Set(prev).add(idx));
    else setMisses((m) => m + 1);
  }

  function showHint() {
    const next = diffs.findIndex((_, i) => !found.has(i));
    if (next < 0) return;
    setHint(next);
    setTimeout(() => setHint((h) => (h === next ? null : h)), 1600);
  }

  // One image panel with its found/hint rings overlaid.
  function Panel({
    src,
    imgRef,
    label,
  }: {
    src: string;
    imgRef: React.RefObject<HTMLImageElement | null>;
    label: string;
  }) {
    return (
      <div className="relative flex-1 rounded-3xl bg-card p-2 shadow-pop overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={`${game.title} — ${label}`}
          onClick={(e) => handleClick(e, imgRef)}
          className="w-full h-auto rounded-2xl select-none cursor-pointer block"
          draggable={false}
        />
        {/* Found rings */}
        {diffs.map((d, i) =>
          found.has(i) ? (
            <span
              key={i}
              className="absolute rounded-full ring-4 ring-white animate-ping-once pointer-events-none"
              style={{
                left: `${centerOf(d).left}%`,
                top: `${centerOf(d).top}%`,
                width: `${Math.max(centerOf(d).size * 1.4, 9)}%`,
                aspectRatio: "1 / 1",
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 0 4px ${accent}`,
              }}
            />
          ) : null,
        )}
        {/* Hint ring */}
        {hint != null && !found.has(hint) && (
          <span
            className="absolute rounded-full pointer-events-none animate-pulse"
            style={{
              left: `${centerOf(diffs[hint]).left}%`,
              top: `${centerOf(diffs[hint]).top}%`,
              width: `${Math.max(centerOf(diffs[hint]).size * 2.4, 14)}%`,
              aspectRatio: "1 / 1",
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 0 3px ${accent}88`,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <PlayHeader />
      <main className="flex-1 px-4 pb-10">
        <div className="mx-auto max-w-5xl">
          {/* Instruction / progress */}
          <div className="text-center mb-4">
            <h1 className="font-display text-xl font-bold leading-tight">
              {allFound ? "You found them all! 🎉" : "Spot the differences!"}
            </h1>
            <p className="text-sm text-muted">
              {allFound
                ? "Brilliant spotting!"
                : `${found.size} of ${diffs.length} found${
                    misses > 0 ? " · keep looking!" : ""
                  }`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mx-auto max-w-md h-2.5 rounded-full bg-border overflow-hidden mb-5">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${diffs.length ? (found.size / diffs.length) * 100 : 0}%`,
                backgroundColor: accent,
              }}
            />
          </div>

          {/* The two scenes — side by side, stacked on small screens. Tap either. */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <Panel src={game.image_url} imgRef={aRef} label="picture 1" />
            <Panel src={answer?.imageB ?? game.image_url} imgRef={bRef} label="picture 2" />
          </div>

          {/* Controls */}
          <div className="mt-6 text-center">
            {allFound ? (
              <Link
                href="/"
                className="inline-block text-center font-display font-extrabold text-white rounded-full px-8 py-3.5 shadow-pop lift-sm"
                style={{ backgroundColor: accent }}
              >
                Make another game ✨
              </Link>
            ) : (
              <button
                onClick={showHint}
                className="font-display font-bold text-sm rounded-full px-6 py-3 bg-card shadow-pop-sm lift-sm inline-flex items-center justify-center gap-2"
              >
                <Bulb size={16} /> Hint
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
