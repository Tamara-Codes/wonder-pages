/**
 * Tracing game — pure code, no AI.
 *
 * Pre-writing practice: a few dashed guide strokes the child traces over to
 * build the hand control handwriting needs — straight lines, hills, waves,
 * zig-zags and loops. Identical on paper (trace each line with a crayon) and on
 * screen (drag along the dashes and they ink in as you go). Code owns every
 * stroke: the guide-path points ARE the answer key.
 */

export interface TracePoint {
  x: number;
  y: number;
}

export interface TraceStroke {
  /** Guide-path points in card coordinates, ordered start→end (left→right). */
  points: TracePoint[];
  /** What the stroke teaches, e.g. "Waves" — a tiny caption / thumbnail hint. */
  label: string;
}

export interface TracingAnswer {
  imgW: number;
  imgH: number;
  strokes: TraceStroke[];
}

// A full A4 portrait sheet (210 × 297 mm). The lines are spread to fill the
// page top-to-bottom, so it prints as one complete worksheet whatever the
// stroke count.
const W = 900;
const H = Math.round((W * 297) / 210); // 1273
const TOP_PAD = 90;
const BOT_PAD = 90;
const LEFT_PAD = 120; // room for the green "start here" dot
const RIGHT_PAD = 80;
const SAMPLES = 80; // points per stroke — dense enough for smooth dashes + coverage

interface PatternSpec {
  name: string;
  label: string;
  /** How many repeats of the motif across the page width. */
  cycles: number;
  /** Flip a single diagonal up vs down (slope only). */
  flip?: boolean;
}

// The distinct pre-writing strokes, in a gentle teaching order (top → bottom of
// the page). A page takes the FIRST `rows` of these, so every line on the sheet
// is a different shape — never the same motif twice. cycles is the baseline
// repeat count; complexity scales it (easier = fewer, calmer repeats).
const CURRICULUM: Omit<PatternSpec, "flip">[] = [
  { name: "line", label: "Straight line", cycles: 1 },
  { name: "slope", label: "Slanted line", cycles: 1 },
  { name: "hills", label: "Hills", cycles: 4 },
  { name: "scallops", label: "Scallops", cycles: 4 },
  { name: "wave", label: "Waves", cycles: 4 },
  { name: "zigzag", label: "Zig-zags", cycles: 6 },
  { name: "mountains", label: "Mountains", cycles: 5 },
  { name: "loops", label: "Loops", cycles: 4 },
  { name: "steps", label: "Steps", cycles: 4 },
];

/** Raw (unnormalised) samples for a pattern, t running 0→1. */
function rawSamples(spec: PatternSpec): { rx: number; ry: number }[] {
  const n = spec.cycles;
  const pts: { rx: number; ry: number }[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    let rx = t;
    let ry = 0;
    switch (spec.name) {
      case "line":
        ry = 0;
        break;
      case "slope": // one long diagonal across the page
        ry = (spec.flip ? -1 : 1) * (t - 0.5) * 2;
        break;
      case "hills": // rounded bumps sitting on the line — all upward
        ry = Math.abs(Math.sin(Math.PI * n * t));
        break;
      case "scallops": // rounded dips hanging below the line — all downward
        ry = -Math.abs(Math.sin(Math.PI * n * t));
        break;
      case "wave": // smooth S-curves crossing the line
        ry = Math.sin(2 * Math.PI * n * t);
        break;
      case "zigzag": { // sharp points above and below
        const phase = (n * t) % 1;
        ry = 1 - 4 * Math.abs(phase - 0.5); // triangle wave in [-1, 1]
        break;
      }
      case "mountains": { // sharp peaks pointing up from the line only
        const phase = (n * t) % 1;
        ry = 1 - 2 * Math.abs(phase - 0.5); // rectified triangle in [0, 1]
        break;
      }
      case "loops": { // cursive loop-the-loops (B > A makes x curl back)
        const theta = 2 * Math.PI * n * t;
        rx = theta - 2.1 * Math.sin(theta);
        ry = -2.1 * Math.cos(theta);
        break;
      }
      case "steps": // square battlements, up and down
        ry = Math.sin(2 * Math.PI * n * t) >= 0 ? 1 : -1;
        break;
    }
    pts.push({ rx, ry });
  }
  return pts;
}

/**
 * Build a tracing page: `rows` dashed guide strokes, each a DIFFERENT stroke
 * shape from the curriculum, mapped into its own band down an A4 page.
 */
export function generateTracing(
  rows: number,
  complexity: number,
  rnd: () => number = Math.random,
): TracingAnswer {
  // One distinct shape per row. If a page wants more rows than we have shapes,
  // wrap around but bump the repeat count so the encore line still looks fresh.
  const scale = [0.7, 1, 1.3][complexity] ?? 1;
  const specs: PatternSpec[] = Array.from({ length: rows }, (_, i) => {
    const base = CURRICULUM[i % CURRICULUM.length];
    const wraps = Math.floor(i / CURRICULUM.length);
    const cycles = Math.max(1, Math.round(base.cycles * scale) + wraps);
    return { ...base, cycles, flip: base.name === "slope" && rnd() < 0.5 };
  });

  const x0 = LEFT_PAD;
  const x1 = W - RIGHT_PAD;
  // Spread the rows evenly down the A4 page so it fills top-to-bottom whatever
  // the line count.
  const band = (H - TOP_PAD - BOT_PAD) / rows;
  const ampPx = band * 0.3;

  const strokes: TraceStroke[] = specs.map((spec, row) => {
    const raw = rawSamples(spec);
    const minRx = Math.min(...raw.map((p) => p.rx));
    const maxRx = Math.max(...raw.map((p) => p.rx));
    const spanRx = maxRx - minRx || 1;
    const maxAbsRy = Math.max(...raw.map((p) => Math.abs(p.ry))) || 1;
    const midY = TOP_PAD + band * row + band / 2;

    const points = raw.map((p) => ({
      x: Math.round(x0 + ((p.rx - minRx) / spanRx) * (x1 - x0)),
      y: Math.round(midY - (p.ry / maxAbsRy) * ampPx),
    }));

    return { points, label: spec.label };
  });

  return { imgW: W, imgH: H, strokes };
}

function polylinePoints(stroke: TraceStroke): string {
  return stroke.points.map((p) => `${p.x},${p.y}`).join(" ");
}

/** A self-contained SVG thumbnail for My Games (rasterized server-side by sharp). */
export function tracingSvg(answer: TracingAnswer, bg: string): string {
  const { imgW, imgH } = answer;
  const lines = answer.strokes
    .map((s) => {
      const start = s.points[0];
      const end = s.points[s.points.length - 1];
      return `<polyline points="${polylinePoints(s)}" fill="none" stroke="#b9b3c9" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 20"/>
<circle cx="${start.x}" cy="${start.y}" r="15" fill="#21c7b6"/>
<circle cx="${end.x}" cy="${end.y}" r="9" fill="#ff5ca8"/>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}" viewBox="0 0 ${imgW} ${imgH}">
<rect width="${imgW}" height="${imgH}" fill="${bg}"/>
${lines}
</svg>`;
}
