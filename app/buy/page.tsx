"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PACKS, priceLabel, priceCents } from "@/lib/pricing";
import { Gift } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";

// Payments are off until the business entity (obrt) is registered. Until then
// this page captures demand: which pack people would buy. The Stripe checkout
// route + webhook stay in the codebase, just unlinked — flip back on later.
export default function BuyPage() {
  const [busy, setBusy] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());

  // `pack` = credits in the chosen pack, or 0 for general interest.
  async function notify(pack: number) {
    setBusy(pack);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        location.href = "/login";
        return;
      }
      // Idempotent: a repeat tap (e.g. after reload) hits the unique
      // (user_id, pack) constraint and is silently ignored, not errored.
      await supabase
        .from("waitlist")
        .upsert(
          { user_id: user.id, pack: pack || null },
          { onConflict: "user_id,pack", ignoreDuplicates: true },
        );
      setDone((prev) => new Set(prev).add(pack));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <SiteHeader />

      <main className="relative flex-1 px-6 pb-16 overflow-hidden">
        <div className="mx-auto max-w-3xl text-center">
          <div className="tile mx-auto h-[76px] w-[76px] mt-8" style={{ background: "var(--pink)" }}>
            <Gift size={38} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-5">
            Paid packs are coming soon!
          </h1>
          <p className="text-muted font-semibold mt-3 max-w-lg mx-auto">
            You&apos;ve used your free games for now. We&apos;re putting the
            finishing touches on game packs — tap the one you&apos;d want and
            we&apos;ll email you the moment it&apos;s ready (you&apos;ll get
            first dibs 💛).
          </p>

          {/* Packs — "Notify me" instead of buy */}
          <div className="grid gap-4 sm:grid-cols-2 mt-8">
            {PACKS.map((p) => {
              const notified = done.has(p.credits);
              return (
                <div
                  key={p.credits}
                  className="relative rounded-3xl bg-card p-6 text-left shadow-pop"
                >
                  {p.badge && (
                    <span
                      className="absolute -top-3 right-5 rounded-full px-3 py-1 text-xs font-display font-extrabold text-white"
                      style={{ background: "var(--pink)" }}
                    >
                      {p.badge}
                    </span>
                  )}
                  <p className="font-display font-bold text-muted">{p.label}</p>
                  <p className="font-display text-3xl font-extrabold mt-1">
                    {p.credits} games
                  </p>
                  <p className="text-muted text-sm font-semibold mt-1">
                    Launch price {priceLabel(p.credits)} · €
                    {(priceCents(p.credits) / p.credits / 100).toFixed(2)} each
                  </p>
                  <button
                    onClick={() => notify(p.credits)}
                    disabled={busy !== null || notified}
                    className={`mt-4 w-full font-display font-extrabold rounded-full px-6 py-3.5 disabled:opacity-100 ${
                      notified
                        ? "bg-card text-brand shadow-pop-sm"
                        : "text-white bg-brand btn-glow"
                    }`}
                  >
                    {notified
                      ? "✓ You're on the list!"
                      : busy === p.credits
                        ? "Saving…"
                        : "Notify me"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted font-semibold mt-8">
            No charge today — we&apos;ll just send you an email when packs become
            available.
          </p>
        </div>
      </main>
    </div>
  );
}
