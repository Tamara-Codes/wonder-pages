import { iconLineArt } from "@/lib/icons-line";
import type { AlphabetEntry } from "@/lib/alphabet";

// Default accent colour for everything on the page: the big letter, the
// connective, the picture line art, and the handwriting guide lines. Keeps the
// page to a single colour on white. Override per-render with the `accent` prop.
const ACCENT = "#475569"; // slate

/**
 * One alphabet booklet page — "A is for Apple" line art.
 *
 * Pure presentation: give it a letter entry + the language's connective and it
 * lays out a printable A5 page with three things a child does:
 *   1. colour the big HOLLOW letter,
 *   2. colour the picture,
 *   3. write the letter on the ruled handwriting lines (the first row is seeded
 *      with light letters to trace).
 *
 * The picture comes from the shared icon vocabulary (lib/icons.ts). No state,
 * no AI — the same component renders the on-screen preview and the print page.
 */
export default function AlphabetPage({
  entry,
  connective,
  accent = ACCENT,
  className = "",
}: {
  entry: AlphabetEntry;
  connective: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${entry.letter} ${connective} ${entry.word}`}
      className={`relative mx-auto flex aspect-[210/297] w-full max-w-md flex-col items-center justify-between rounded-3xl bg-card px-8 py-9 text-center shadow-pop ${className}`}
    >
      {/* "G is for" — big hollow letter + connective, on one line at the top. */}
      <div className="flex items-center justify-center gap-3" aria-hidden>
        <span
          className="font-display font-bold leading-none"
          style={{
            fontSize: "clamp(3.25rem, 16vw, 5rem)",
            color: "var(--card)",
            WebkitTextStroke: `6.5px ${accent}`,
            paintOrder: "stroke fill",
          }}
        >
          {entry.letter}
        </span>
        <span className="font-label text-2xl" style={{ color: accent }}>
          {connective}
        </span>
      </div>

      {/* The big picture to colour — flat emoji blanked to line art (lib/icons-line) */}
      <div
        className="grid aspect-square w-full max-w-[15rem] place-items-center [&>svg]:h-full [&>svg]:w-full"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: iconLineArt(entry.iconKey, accent) }}
      />

      {/* Handwriting practice — write the letter on the lines */}
      <HandwritingLines glyph={entry.letter} accent={accent} />
    </div>
  );
}

/**
 * Two rows of primary-school handwriting ruling (top line, dashed midline,
 * baseline). The first row is pre-filled with light "ghost" letters to trace;
 * the second is empty for free writing. Digraphs (Dž, Lj, Nj) get fewer, wider
 * tracing letters so they don't crowd.
 */
function HandwritingLines({ glyph, accent }: { glyph: string; accent: string }) {
  const W = 400;
  const rule = (top: number) => (
    <g key={top} stroke={accent}>
      <line x1="6" y1={top} x2={W - 6} y2={top} strokeWidth="1.5" strokeOpacity="0.5" />
      <line
        x1="6"
        y1={top + 26}
        x2={W - 6}
        y2={top + 26}
        strokeWidth="1.5"
        strokeOpacity="0.45"
        strokeDasharray="6 7"
      />
      <line x1="6" y1={top + 52} x2={W - 6} y2={top + 52} strokeWidth="2" strokeOpacity="0.8" />
    </g>
  );

  const count = glyph.length > 1 ? 4 : 6;
  const slot = (W - 24) / count;
  const ghosts = Array.from({ length: count }, (_, i) => (
    <text
      key={i}
      x={24 + slot * (i + 0.5)}
      y={62}
      textAnchor="middle"
      className="font-display"
      style={{
        fontSize: 44,
        fontWeight: 700,
        fill: accent,
        fillOpacity: 0.35,
      }}
    >
      {glyph}
    </text>
  ));

  return (
    <svg viewBox="0 0 400 150" className="w-full" role="presentation" aria-hidden>
      {rule(10)}
      {ghosts}
      {rule(88)}
    </svg>
  );
}
