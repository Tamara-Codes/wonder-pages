"use client";

import { useEffect, useRef, useState } from "react";

type PreviewPage = { labelKey: string } & (
  | { kind: "img"; src: string }
  | { kind: "html"; html: string }
);

/**
 * A live, flip-through strip of REAL sample pages for one product — fetched
 * from /api/preview (pure code, no AI), so the landing shows exactly what the
 * finished, personalized book looks like. `body` is the preview request
 * payload (product + options + localized cover/dedication text); `pageLabels`
 * localizes each page's caption.
 */
export function BookSamples({
  body,
  pageLabels,
  loadingText,
  compact = false,
}: {
  body: Record<string, unknown>;
  pageLabels: Record<string, string>;
  loadingText: string;
  compact?: boolean;
}) {
  const itemW = compact ? "w-[122px] sm:w-[138px]" : "w-[150px] sm:w-[185px]";
  const [pages, setPages] = useState<PreviewPage[] | null>(null);
  const key = JSON.stringify(body);
  const bodyRef = useRef(body);
  bodyRef.current = body;

  useEffect(() => {
    let alive = true;
    setPages(null);
    fetch("/api/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyRef.current),
    })
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((d) => alive && setPages(d.pages || []))
      .catch(() => alive && setPages([]));
    return () => {
      alive = false;
    };
  }, [key]);

  return (
    <div className="overflow-x-auto pb-1">
      <ul className="flex gap-3 snap-x pb-2 w-max">
        {!pages &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className={`snap-start shrink-0 ${itemW}`}>
              <div className="aspect-[210/297] rounded-2xl bg-card shadow-pop-sm animate-pulse" />
              {i === 1 && (
                <p className="text-center text-xs font-display font-bold text-muted mt-3">{loadingText}</p>
              )}
            </li>
          ))}

        {pages?.map((p, i) => (
          <li key={i} className={`snap-start shrink-0 ${itemW}`}>
            <div className="rounded-2xl bg-white shadow-pop-sm overflow-hidden border border-border">
              {p.kind === "img" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.src} alt={pageLabels[p.labelKey] ?? p.labelKey} className="block w-full" />
              ) : (
                <div className="[&>*]:!shadow-none [&>*]:!border-0 [&>*]:!rounded-none" dangerouslySetInnerHTML={{ __html: p.html }} />
              )}
            </div>
            <p className="text-center text-xs font-display font-bold text-muted mt-2">
              {pageLabels[p.labelKey] ?? p.labelKey}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
