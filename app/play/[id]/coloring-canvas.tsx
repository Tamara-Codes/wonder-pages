"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameRow } from "@/lib/types";
import { SiteHeader } from "@/components/site-header";

const PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#d946ef", "#ec4899", "#f43f5e", "#78350f",
  "#000000", "#9ca3af", "#ffffff",
];

const MAX_DIM = 1200; // cap internal resolution for smooth painting
const TOLERANCE = 48; // flood-fill color match tolerance

type Tool = "fill" | "brush" | "eraser";

const SAVE_LABEL: Record<"idle" | "saving" | "saved" | "error", string> = {
  idle: "Save",
  saving: "Saving…",
  saved: "Saved!",
  error: "Try again",
};

export default function ColoringCanvas({ game }: { game: GameRow }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const blankImg = useRef<HTMLImageElement | null>(null); // blank line art, for Restart
  const undoStack = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const [color, setColor] = useState("#f59e0b");
  const [tool, setTool] = useState<Tool>("fill");
  const [brush, setBrush] = useState(14);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  // Load the blank line art (sizing the canvas and keeping it for Restart), then
  // paint any previously-saved coloring on top so the child continues where they
  // left off.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    // Prefer a CORS-clean load (so saving/printing works); fall back to a plain
    // load if CORS blocks it, leaving a tainted canvas the browser can't export.
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const tryLoad = (crossOrigin: boolean) => {
          const img = new Image();
          if (crossOrigin) img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => (crossOrigin ? tryLoad(false) : reject());
          img.src = src;
        };
        tryLoad(true);
      });

    (async () => {
      const blank = await load(game.image_url).catch(() => null);
      if (cancelled || !blank) return;
      blankImg.current = blank;

      const scale = Math.min(1, MAX_DIM / Math.max(blank.width, blank.height));
      canvas.width = Math.round(blank.width * scale);
      canvas.height = Math.round(blank.height * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctxRef.current = ctx;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(blank, 0, 0, canvas.width, canvas.height);

      if (game.colored_url) {
        const colored = await load(game.colored_url).catch(() => null);
        if (cancelled) return;
        if (colored) ctx.drawImage(colored, 0, 0, canvas.width, canvas.height);
      }
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [game.image_url, game.colored_url]);

  const snapshot = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.current.length > 20) undoStack.current.shift();
  }, []);

  const undo = useCallback(() => {
    const ctx = ctxRef.current;
    const prev = undoStack.current.pop();
    if (ctx && prev) ctx.putImageData(prev, 0, 0);
  }, []);

  // Wipe back to the blank line art (one undo step keeps it reversible).
  const restart = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const blank = blankImg.current;
    if (!ctx || !canvas || !blank) return;
    snapshot();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(blank, 0, 0, canvas.width, canvas.height);
  }, [snapshot]);

  function toCanvasPoint(e: React.PointerEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width),
      y: Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height),
    };
  }

  function floodFill(x: number, y: number, hex: string) {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const { width: w, height: h } = canvas;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const fill = hexToRgb(hex);

    const start = (y * w + x) * 4;
    const sr = d[start], sg = d[start + 1], sb = d[start + 2];
    // Don't fill if the target already matches (or is a dark line).
    if (close(sr, sg, sb, fill.r, fill.g, fill.b, 4)) return;

    const stack = [y * w + x];
    const seen = new Uint8Array(w * h);
    while (stack.length) {
      const p = stack.pop()!;
      if (seen[p]) continue;
      seen[p] = 1;
      const i = p * 4;
      if (!close(d[i], d[i + 1], d[i + 2], sr, sg, sb, TOLERANCE)) continue;
      d[i] = fill.r;
      d[i + 1] = fill.g;
      d[i + 2] = fill.b;
      d[i + 3] = 255;
      const px = p % w;
      if (px > 0) stack.push(p - 1);
      if (px < w - 1) stack.push(p + 1);
      if (p >= w) stack.push(p - w);
      if (p < w * (h - 1)) stack.push(p + w);
    }
    ctx.putImageData(img, 0, 0);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!loaded) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    snapshot();
    const { x, y } = toCanvasPoint(e);
    if (tool === "fill") {
      floodFill(x, y, color);
      return;
    }
    drawing.current = true;
    last.current = { x, y };
    paintTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current) return;
    const { x, y } = toCanvasPoint(e);
    paintTo(x, y);
  }

  function onPointerUp() {
    drawing.current = false;
    last.current = null;
  }

  function paintTo(x: number, y: number) {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = brush;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const from = last.current ?? { x, y };
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
  }

  // Save the current painting into My Games (the colored copy), keeping the
  // blank line art so it can still be re-coloured or printed.
  const save = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || saveState === "saving") return;
    setSaveState("saving");
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("export failed"); // tainted canvas → toBlob is null
      const res = await fetch(`/api/games/${game.id}/colored`, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });
      if (!res.ok) throw new Error("save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [game.id, saveState]);

  return (
    <div className="flex flex-col min-h-full">
      <PlayHeader />
      <main className="flex-1 px-4 pb-10 print:p-0">
        <div className="mx-auto max-w-3xl">
          {/* Only this prints (see @media print in globals.css) */}
          <div className="print-canvas rounded-3xl bg-card p-2 shadow-pop overflow-hidden print:rounded-none print:shadow-none print:p-0">
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="w-full h-auto rounded-2xl touch-none cursor-crosshair print:rounded-none"
            />
          </div>

          {/* Controls — never printed */}
          <div className="print:hidden">
            {/* Tools */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <ToolButton active={tool === "fill"} label="Fill" icon={<IconFill />} onClick={() => setTool("fill")} />
              <ToolButton active={tool === "brush"} label="Brush" icon={<IconBrush />} onClick={() => setTool("brush")} />
              <ToolButton active={tool === "eraser"} label="Eraser" icon={<IconEraser />} onClick={() => setTool("eraser")} />
              <span className="mx-1 h-7 w-px bg-border" />
              <ToolButton label="Undo" icon={<IconUndo />} onClick={undo} />
              <ToolButton label="Restart" icon={<IconRestart />} onClick={restart} />
              <ToolButton
                label={SAVE_LABEL[saveState]}
                icon={saveState === "saved" ? <IconCheck /> : <IconSave />}
                onClick={save}
                disabled={saveState === "saving"}
              />
              <ToolButton label="Print" icon={<IconPrint />} onClick={() => window.print()} />
            </div>

            {/* Brush size — appears only when a drawing tool is active */}
            {(tool === "brush" || tool === "eraser") && (
              <div className="mt-3 mx-auto flex max-w-md items-center gap-4 rounded-full bg-card shadow-pop-sm px-6 py-3">
                <span className="font-display font-bold text-sm text-muted whitespace-nowrap">
                  Brush size
                </span>
                <input
                  type="range"
                  min={4}
                  max={48}
                  value={brush}
                  onChange={(e) => setBrush(Number(e.target.value))}
                  className="wp-range flex-1"
                  style={
                    {
                      ["--pct" as string]: `${((brush - 4) / 44) * 100}%`,
                    } as React.CSSProperties
                  }
                  aria-label="Brush size"
                />
                <span
                  className="grid shrink-0 place-items-center"
                  style={{ width: 30, height: 30 }}
                >
                  <span
                    className="rounded-full"
                    style={{
                      width: brush / 2 + 6,
                      height: brush / 2 + 6,
                      backgroundColor: color,
                    }}
                  />
                </span>
              </div>
            )}

            {/* Palette */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={`h-9 w-9 rounded-full border-2 transition-transform ${
                    color === c
                      ? "scale-110 border-foreground"
                      : "border-black/10 hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`font-display font-bold text-sm rounded-full px-4 py-2.5 lift-sm inline-flex items-center gap-2 disabled:opacity-60 disabled:pointer-events-none ${
        active
          ? "bg-brand text-white shadow-pop-sm"
          : "bg-card text-foreground shadow-pop-sm"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Pretty line icons (lucide-style), drawn with currentColor ──────────
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const IconFill = () => (
  <Icon>
    <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
    <path d="m5 2 5 5" />
    <path d="M2 13h15" />
    <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
  </Icon>
);
const IconBrush = () => (
  <Icon>
    <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
  </Icon>
);
const IconEraser = () => (
  <Icon>
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </Icon>
);
const IconUndo = () => (
  <Icon>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icon>
);
const IconRestart = () => (
  <Icon>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Icon>
);
const IconSave = () => (
  <Icon>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </Icon>
);
const IconCheck = () => (
  <Icon>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
const IconPrint = () => (
  <Icon>
    <path d="M6 9V2h12v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </Icon>
);

export function PlayHeader() {
  return <SiteHeader print />;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function close(
  r: number, g: number, b: number,
  r2: number, g2: number, b2: number,
  tol: number,
) {
  return (
    Math.abs(r - r2) <= tol &&
    Math.abs(g - g2) <= tol &&
    Math.abs(b - b2) <= tol
  );
}
