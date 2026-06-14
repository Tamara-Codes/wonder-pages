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

export default function ColoringCanvas({ game }: { game: GameRow }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const [color, setColor] = useState("#f59e0b");
  const [tool, setTool] = useState<Tool>("fill");
  const [brush, setBrush] = useState(14);
  const [loaded, setLoaded] = useState(false);

  // Load the line art onto the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paint = (img: HTMLImageElement) => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctxRef.current = ctx;
      setLoaded(true);
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => paint(img);
    // If CORS blocks the cross-origin load, retry without it so the page still
    // works (saving/printing may be unavailable on a tainted canvas).
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => paint(fallback);
      fallback.src = game.image_url;
    };
    img.src = game.image_url;
  }, [game.image_url]);

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

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${game.title.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

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
              <ToolButton label="Save" icon={<IconDownload />} onClick={download} />
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
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`font-display font-bold text-sm rounded-full px-4 py-2.5 lift-sm inline-flex items-center gap-2 ${
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
const IconDownload = () => (
  <Icon>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
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
