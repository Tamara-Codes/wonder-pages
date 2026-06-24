/**
 * Moja slova brand mark + wordmark lockup.
 *
 * WonderMark    — the app icon: three playful A B C blocks (pink/teal/purple).
 * BrandLockup   — icon + "Moja" (pink) + "slova" (teal). Render it INSIDE a
 *                 wrapper (<Link>/<span>) that sets the font-display size, e.g.
 *                 the page headers.
 */

export function WonderMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const blocks = [
    { x: 8, y: 36, rot: -10, cx: 27, cy: 55, fill: "#ff5ca8", letter: "A" },
    { x: 31, y: 22, rot: 5, cx: 50, cy: 41, fill: "#21c7b6", letter: "B" },
    { x: 54, y: 36, rot: 11, cx: 73, cy: 55, fill: "#8a6cff", letter: "C" },
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      {blocks.map((b) => (
        <g key={b.letter} transform={`rotate(${b.rot} ${b.cx} ${b.cy})`}>
          <rect x={b.x} y={b.y} width="38" height="38" rx="9" fill={b.fill} stroke="#2b2440" strokeWidth="3.5" />
          <text
            x={b.cx}
            y={b.cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            style={{ fontFamily: "var(--font-display), 'Baloo 2', system-ui, sans-serif", fontWeight: 800, fontSize: 24 }}
          >
            {b.letter}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BrandLockup({ markSize = 30 }: { markSize?: number }) {
  return (
    <>
      <WonderMark size={markSize} />
      <span>
        <span style={{ color: "var(--pink)" }}>Moja</span>{" "}
        <span style={{ color: "var(--teal)" }}>slova</span>
      </span>
    </>
  );
}
