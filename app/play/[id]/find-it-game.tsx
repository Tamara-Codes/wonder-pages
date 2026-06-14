"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { GameRow, FindItAnswer, FoundItem } from "@/lib/types";
import { findItemDataUri } from "@/lib/sprites";
import { THEME_MAP } from "@/lib/themes";
import { PlayHeader } from "./coloring-canvas";
import { Bulb } from "@/components/icons";

export default function FindItGame({ game }: { game: GameRow }) {
  // The dispatcher only renders this for find-it games, so the key is a FindItAnswer.
  const answer = game.answer_key as FindItAnswer | null;
  const items = answer?.items ?? [];
  const imgRef = useRef<HTMLImageElement>(null);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState(0);
  const [hintKey, setHintKey] = useState<string | null>(null);

  const accent = THEME_MAP[game.theme]?.color ?? "var(--brand)";
  const tint = THEME_MAP[game.theme]?.tint ?? "#f0eee9";
  const allFound = items.length > 0 && found.size === items.length;

  // Center of an item as a percentage of the image, for positioning markers.
  const centerOf = (p: FoundItem) => ({
    left: ((p.x + p.w / 2) / answer!.imgW) * 100,
    top: ((p.y + p.h / 2) / answer!.imgH) * 100,
    size: (p.w / answer!.imgW) * 100,
  });

  function handleClick(e: React.MouseEvent<HTMLImageElement>) {
    if (!answer || allFound) return;
    const rect = imgRef.current!.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * answer.imgW;
    const ny = ((e.clientY - rect.top) / rect.height) * answer.imgH;

    // First not-yet-found item under the tap (generous padding for small fingers).
    const hit = items.find((p) => {
      if (found.has(p.key)) return false;
      const pad = p.w * 0.3;
      return (
        nx >= p.x - pad &&
        nx <= p.x + p.w + pad &&
        ny >= p.y - pad &&
        ny <= p.y + p.h + pad
      );
    });

    if (hit) setFound((prev) => new Set(prev).add(hit.key));
    else setMisses((m) => m + 1);
  }

  function showHint() {
    const next = items.find((p) => !found.has(p.key));
    if (!next) return;
    setHintKey(next.key);
    setTimeout(() => setHintKey(null), 1600);
  }

  return (
    <div className="flex flex-col min-h-full">
      <PlayHeader />
      <main className="flex-1 px-4 pb-10">
        <div className="mx-auto max-w-5xl">
          {/* Instruction / progress */}
          <div className="text-center mb-4">
            <h1 className="font-display text-xl font-bold leading-tight">
              {allFound ? "You found them all! 🎉" : "Find the hidden things!"}
            </h1>
            <p className="text-sm text-muted">
              {allFound
                ? "Amazing spotting!"
                : `${found.size} of ${items.length} found${
                    misses > 0 ? ` · keep looking!` : ""
                  }`}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Scene */}
            <div className="relative flex-1 rounded-3xl bg-card p-2 shadow-pop overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={game.image_url}
                alt={game.title}
                onClick={handleClick}
                className="w-full h-auto rounded-2xl select-none cursor-pointer"
                draggable={false}
              />

              {/* Found markers */}
              {items
                .filter((p) => found.has(p.key))
                .map((p) => {
                  const c = centerOf(p);
                  return (
                    <span
                      key={p.key}
                      className="absolute rounded-full ring-4 ring-white animate-ping-once pointer-events-none"
                      style={{
                        left: `${c.left}%`,
                        top: `${c.top}%`,
                        width: `${c.size * 1.5}%`,
                        aspectRatio: "1 / 1",
                        transform: "translate(-50%, -50%)",
                        boxShadow: `0 0 0 4px ${accent}`,
                      }}
                    />
                  );
                })}

              {/* Hint ring */}
              {hintKey &&
                (() => {
                  const p = items.find((i) => i.key === hintKey);
                  if (!p) return null;
                  const c = centerOf(p);
                  return (
                    <span
                      className="absolute rounded-full pointer-events-none animate-pulse"
                      style={{
                        left: `${c.left}%`,
                        top: `${c.top}%`,
                        width: `${c.size * 3.5}%`,
                        aspectRatio: "1 / 1",
                        transform: "translate(-50%, -50%)",
                        boxShadow: `0 0 0 3px ${accent}88`,
                      }}
                    />
                  );
                })()}
            </div>

            {/* Checklist */}
            <aside className="w-full md:w-72 shrink-0">
              <div className="rounded-3xl bg-card p-4 shadow-pop">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-extrabold">Find these!</h2>
                  <span
                    className="font-display font-extrabold text-sm"
                    style={{ color: accent }}
                  >
                    {found.size}/{items.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-border overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${items.length ? (found.size / items.length) * 100 : 0}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>

                <ul className="flex flex-col gap-2.5">
                  {items.map((p) => {
                    const done = found.has(p.key);
                    return (
                      <li
                        key={p.key}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-2 shadow-pop-sm ${
                          done ? "" : "border-border bg-card"
                        }`}
                        style={done ? { background: `${accent}1a`, borderColor: `${accent}55` } : undefined}
                      >
                        <span
                          className="grid place-items-center rounded-xl shrink-0"
                          style={{ width: 44, height: 44, background: tint }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={findItemDataUri(p.key)} alt={p.label} className="w-8 h-8" />
                        </span>
                        <span
                          className={`font-display font-extrabold flex-1 ${
                            done ? "text-muted line-through" : ""
                          }`}
                        >
                          {p.label}
                        </span>
                        <span
                          className="grid place-items-center rounded-full shrink-0"
                          style={{
                            width: 26,
                            height: 26,
                            background: done ? accent : "transparent",
                            border: done ? `2px solid ${accent}` : "2px solid var(--border)",
                          }}
                        >
                          {done && (
                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                              <path
                                d="M5 13l4 4L19 7"
                                fill="none"
                                stroke="#fff"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Controls */}
                <div className="mt-4">
                  {allFound ? (
                    <Link
                      href="/"
                      className="block text-center font-display font-extrabold text-white rounded-full px-6 py-3.5 shadow-pop lift-sm"
                      style={{ backgroundColor: accent }}
                    >
                      Make another game ✨
                    </Link>
                  ) : (
                    <button
                      onClick={showHint}
                      className="w-full font-display font-bold text-sm rounded-full px-5 py-3 bg-card shadow-pop-sm lift-sm inline-flex items-center justify-center gap-2"
                    >
                      <Bulb size={16} /> Hint
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
