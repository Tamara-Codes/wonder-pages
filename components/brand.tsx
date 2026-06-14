/**
 * Wonder Pages brand mark + wordmark lockup.
 *
 * WonderMark    — the app icon (bound activity book + crayon + rainbow page
 *                 edge on a sticker tile). Keep in sync with app/icon.svg and
 *                 brand-assets/wonder-icon.svg.
 * BrandLockup   — icon + "Wonder" (pink) + "Pages" (teal). Render it INSIDE a
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
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="96" height="96" rx="24" fill="#ffc93c" />
      <g transform="translate(50 51) scale(0.8) translate(-50 -51)">
        {/* rainbow page fore-edge */}
        <g stroke="#2b2440" strokeWidth="3" strokeLinejoin="round">
          <rect x="70" y="20" width="13" height="62" rx="4" fill="#ffffff" />
          <rect x="70" y="20" width="13" height="13" fill="#ff5ca8" />
          <rect x="70" y="33" width="13" height="13" fill="#ff7a45" />
          <rect x="70" y="46" width="13" height="13" fill="#21c7b6" />
          <rect x="70" y="59" width="13" height="13" fill="#8a6cff" />
          <rect x="70" y="72" width="13" height="10" fill="#3da5ff" />
          <rect x="70" y="20" width="13" height="62" rx="4" fill="none" />
        </g>
        {/* cover + spine */}
        <rect x="20" y="16" width="54" height="70" rx="9" fill="#21c7b6" stroke="#2b2440" strokeWidth="4" />
        <rect x="20" y="16" width="11" height="70" rx="5" fill="#16a596" stroke="#2b2440" strokeWidth="4" />
        {/* crayon emblem */}
        <g transform="translate(47 51) rotate(-30) scale(0.8) translate(-47 -51)">
          <rect x="40" y="37" width="14" height="42" rx="3" fill="#ff7a45" stroke="#2b2440" strokeWidth="3.4" />
          <path d="M40 38 L54 38 L47 23 Z" fill="#ffc93c" stroke="#2b2440" strokeWidth="3.4" strokeLinejoin="round" />
          <path d="M43.5 31 L50.5 31 L47 23 Z" fill="#e8662f" stroke="#2b2440" strokeWidth="3" strokeLinejoin="round" />
          <rect x="39.4" y="49" width="15.2" height="13" fill="#ffffff" stroke="#2b2440" strokeWidth="3" />
          <g stroke="#2b2440" strokeWidth="2.4" strokeLinecap="round">
            <path d="M42.5 53 H51.5" />
            <path d="M42.5 58 H51.5" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function BrandLockup({ markSize = 30 }: { markSize?: number }) {
  return (
    <>
      <WonderMark size={markSize} />
      <span>
        <span style={{ color: "var(--pink)" }}>Wonder</span>{" "}
        <span style={{ color: "var(--teal)" }}>Pages</span>
      </span>
    </>
  );
}
