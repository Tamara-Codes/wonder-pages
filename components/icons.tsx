// Shared SVG icon set (lucide-style line icons) — replaces emoji used as UI
// icons across the app. They draw with currentColor, so on a coloured .tile
// (which sets color:#fff) they render white; elsewhere they inherit text color.
import type { CSSProperties } from "react";

type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

function Svg({
  size = 24,
  className,
  style,
  filled,
  children,
}: IconProps & { filled?: boolean; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Sparkle = (p: IconProps) => (
  <Svg {...p} filled>
    <path d="M12 2c.4 4.6 3.4 7.6 8 8-4.6.4-7.6 3.4-8 8-.4-4.6-3.4-7.6-8-8 4.6-.4 7.6-3.4 8-8Z" />
  </Svg>
);

export const Home = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);

export const Mail = (p: IconProps) => (
  <Svg {...p}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Svg>
);

export const Wand = (p: IconProps) => (
  <Svg {...p}>
    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
    <path d="m14 7 3 3" />
    <path d="M5 6v4" />
    <path d="M19 14v4" />
    <path d="M10 2v2" />
    <path d="M7 8H3" />
    <path d="M21 16h-4" />
    <path d="M11 3H9" />
  </Svg>
);

export const Lock = (p: IconProps) => (
  <Svg {...p}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

export const Gift = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </Svg>
);

export const Ticket = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" />
    <path d="M13 11v2" />
    <path d="M13 17v2" />
  </Svg>
);

export const Palette = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="13.5" cy="6.5" r=".7" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="10.5" r=".7" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="7.5" r=".7" fill="currentColor" stroke="none" />
    <circle cx="6.5" cy="12.5" r=".7" fill="currentColor" stroke="none" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.7h2c3 0 5.5-2.5 5.5-5.5C22 6 17.5 2 12 2Z" />
  </Svg>
);

export const Search = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);

export const Printer = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 9V3h12v6" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </Svg>
);

export const Smile = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" x2="9.01" y1="9" y2="9" />
    <line x1="15" x2="15.01" y1="9" y2="9" />
  </Svg>
);

export const Zap = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 14a1 1 0 0 1-.8-1.6l9.9-10.2a.5.5 0 0 1 .9.5l-1.9 6a1 1 0 0 0 1 1.3h7a1 1 0 0 1 .8 1.6l-9.9 10.2a.5.5 0 0 1-.9-.5l1.9-6a1 1 0 0 0-1-1.3z" />
  </Svg>
);

export const Rocket = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </Svg>
);

export const Fish = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12c3-5 11-5 14 0-3 5-11 5-14 0Z" />
    <path d="M17 12l5-4v8z" />
    <path d="M7.5 10.5h.01" />
  </Svg>
);

export const Car = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </Svg>
);

export const Unicorn = (p: IconProps) => (
  <Svg {...p}>
    {/* horn */}
    <path d="m9 8 1.5-6L13 7.5" />
    {/* head: forehead → muzzle → chin */}
    <path d="M13 7.5c2.2.6 3.8 2.6 3.8 5 0 .8-.2 1.6-.5 2.3L18 18l-3 .5-1 2.5-1.5-2-3 .5L8.5 17" />
    {/* back of head / cheek down to jaw */}
    <path d="M10.5 2.8C8.4 3.4 6.8 5.3 6.6 7.6" />
    <path d="M6.6 7.6C5 8.4 4 10 4 11.9c0 1.7.8 3.2 2.1 4.1" />
    {/* eye */}
    <path d="M11 11h.01" />
  </Svg>
);

export const Dino = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17c0-1.5 1-3 2.5-3.5C6 9 9 6 13 6c2 0 3.5.8 3.5.8S18 4 20 4c0 2-1 3-1 3 1 1 2 2.6 2 4.5 0 1.2-.4 2.3-1 3.2" />
    <path d="M20 14.7V18a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1.5" />
    <path d="M9 14v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2" />
    <path d="M16 9h.01" />
  </Svg>
);

export const Crown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 18h18l-1.5-9-4.5 4-3-6-3 6-4.5-4z" />
    <path d="M3 18v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-1" />
  </Svg>
);

export const Bulb = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </Svg>
);

export const Frown = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
    <line x1="9" x2="9.01" y1="9" y2="9" />
    <line x1="15" x2="15.01" y1="9" y2="9" />
  </Svg>
);
